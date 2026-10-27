import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, FormGroup, FormHelperText, Grid2 as Grid,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import { api, errorMessage } from '../api/client';
import { DISCIPLINE_LABEL, roleLabel, type Discipline, type MembershipStatus, type Role, type RoleInfo } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { MembershipChip, isoDay } from '../components/billingFormat';
import { DisciplineIcon } from '../components/DisciplineChip';
import CredentialDialog from '../components/CredentialDialog';
import PageHeader from '../components/PageHeader';

const EMPTY = { email: '', fullName: '', phone: '', password: '', roles: [] as Role[], disciplines: [] as Discipline[], enrolledOn: isoDay(new Date()), active: true };
const DISCIPLINES: Discipline[] = ['GYM', 'CROSSFIT'];

export default function UserFormPage() {
  const params = useParams();
  const isNew = !params.id;
  const id = isNew ? null : Number(params.id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const { can } = useAuth();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [credential, setCredential] = useState(false);

  useEffect(() => {
    api.roles().then(setRoles);
    if (id) {
      api.user(id)
        .then((u) => setForm({ email: u.email, fullName: u.fullName, phone: u.phone ?? '', password: '', roles: u.roles, disciplines: u.disciplines, enrolledOn: u.enrolledOn, active: u.active }))
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoaded(true));
    }
  }, [id]);

  useEffect(() => {
    if (id && can('PAGOS')) api.membershipStatuses().then((l) => setStatus(l.find((s) => s.userId === id) ?? null));
  }, [id, can]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));
  const toggleRole = (r: Role) => set({ roles: form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r] });
  const toggleDiscipline = (d: Discipline) =>
    set({ disciplines: form.disciplines.includes(d) ? form.disciplines.filter((x) => x !== d) : [...form.disciplines, d] });
  const isMember = form.roles.includes('SOCIO');
  const missingDiscipline = isMember && form.disciplines.length === 0;

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const common = {
        fullName: form.fullName,
        phone: form.phone || undefined,
        roles: form.roles,
        disciplines: isMember ? form.disciplines : [],
        enrolledOn: form.enrolledOn,
      };
      if (isNew) await api.createUser({ ...common, email: form.email, password: form.password });
      else await api.updateUser(id!, { ...common, active: form.active, password: form.password || undefined });
      navigate('/usuarios');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <>
      <PageHeader
        back="/usuarios"
        title={isNew ? 'Nuevo usuario' : form.fullName}
        subtitle={isNew ? undefined : form.email}
        actions={!isNew && (
          <>
            <Button variant="outlined" color="inherit" startIcon={<AccountCircleOutlined />} onClick={() => navigate(`/progreso/${id}`)}>Perfil</Button>
            <Button variant="outlined" color="inherit" startIcon={<QrCode2Outlined />} onClick={() => setCredential(true)}>Credencial QR</Button>
          </>
        )}
      />
      {id && (
        <CredentialDialog
          open={credential}
          onClose={() => setCredential(false)}
          name={form.fullName}
          load={() => api.userQr(id)}
          regenerate={() => api.regenerateQr(id)}
        />
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={save}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">Datos personales</Typography>
                <TextField label="Nombre completo" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} required />
                <TextField label="Correo" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required disabled={!isNew}
                  helperText={isNew ? undefined : 'El correo no se puede cambiar'} />
                <TextField label="Teléfono" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                <TextField
                  label={isNew ? 'Contraseña' : 'Nueva contraseña'}
                  type="password"
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  required={isNew}
                  slotProps={{ htmlInput: { minLength: 6 } }}
                  helperText={isNew ? 'Mínimo 6 caracteres' : 'Déjala vacía para conservar la actual'}
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Roles</Typography>
                  <Typography variant="caption" color="text.secondary">El usuario ve las pantallas de todos sus roles</Typography>
                </Box>
                <FormGroup>
                  {roles.map((r) => (
                    <FormControlLabel
                      key={r.id}
                      control={<Checkbox checked={form.roles.includes(r.name)} onChange={() => toggleRole(r.name)} />}
                      label={
                        <Box>
                          <Typography variant="body2">{roleLabel(r.name)}</Typography>
                          {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', mb: 1, '& .MuiCheckbox-root': { pt: 0.5 } }}
                    />
                  ))}
                </FormGroup>
                {form.roles.length === 0 && <FormHelperText error>Elige al menos un rol</FormHelperText>}
                {isMember && (
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle2">Subrol de socio</Typography>
                    <Typography variant="caption" color="text.secondary">Puede ser de Gym, de CrossFit o de ambos</Typography>
                    <FormGroup row sx={{ mt: 1, gap: 2 }}>
                      {DISCIPLINES.map((d) => (
                        <FormControlLabel
                          key={d}
                          control={<Checkbox checked={form.disciplines.includes(d)} onChange={() => toggleDiscipline(d)} />}
                          label={<Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><DisciplineIcon discipline={d} fontSize="small" /><span>{DISCIPLINE_LABEL[d]}</span></Stack>}
                        />
                      ))}
                    </FormGroup>
                    {missingDiscipline && <FormHelperText error>Elige al menos uno</FormHelperText>}
                    <TextField
                      label="Fecha de inscripción"
                      type="date"
                      value={form.enrolledOn}
                      onChange={(e) => set({ enrolledOn: e.target.value })}
                      required
                      sx={{ mt: 2 }}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText="Su primer pago cubre desde esta fecha"
                    />
                    {status && (
                      <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <MembershipChip status={status} />
                        <Button size="small" onClick={() => navigate(`/pagos/nuevo?userId=${id}`)}>Registrar pago</Button>
                      </Stack>
                    )}
                  </Box>
                )}
                {!isNew && (
                  <>
                    <Divider />
                    <FormControlLabel
                      control={<Switch checked={form.active} onChange={(e) => set({ active: e.target.checked })} />}
                      label={form.active ? 'Usuario activo' : 'Usuario inactivo (no puede entrar)'}
                    />
                  </>
                )}
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button color="inherit" onClick={() => navigate('/usuarios')}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={busy || form.roles.length === 0 || missingDiscipline}>
              {isNew ? 'Crear usuario' : 'Guardar cambios'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}

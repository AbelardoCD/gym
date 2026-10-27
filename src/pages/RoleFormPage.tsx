import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Button, Card, CardContent, Divider, Grid2 as Grid, Stack, Switch, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { api, errorMessage } from '../api/client';
import { roleLabel, type Permission, type PermissionCode } from '../api/types';
import ConfirmButton from '../components/ConfirmButton';
import PageHeader from '../components/PageHeader';

export default function RoleFormPage() {
  const params = useParams();
  const isNew = !params.id;
  const id = isNew ? null : Number(params.id);
  const navigate = useNavigate();
  const [perms, setPerms] = useState<Permission[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<PermissionCode[]>(['INICIO']);
  const [users, setUsers] = useState(0);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.permissions().then(setPerms);
    if (id) {
      api.role(id)
        .then((r) => { setName(r.name); setDescription(r.description ?? ''); setSelected(r.permissions); setUsers(r.users); })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoaded(true));
    }
  }, [id]);

  const toggle = (c: PermissionCode) => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const isAdminRole = name === 'ADMINISTRADOR' && !isNew;

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.saveRole(id, { name, description, permissions: selected });
      navigate('/roles');
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
        back="/roles"
        title={isNew ? 'Nuevo rol' : roleLabel(name)}
        subtitle={isNew ? undefined : `${users} ${users === 1 ? 'usuario tiene' : 'usuarios tienen'} este rol`}
        actions={!isNew && !isAdminRole && (
          <ConfirmButton
            label="Eliminar"
            startIcon={<DeleteOutline />}
            title="¿Eliminar el rol?"
            message={users > 0 ? 'Este rol tiene usuarios; quítaselo a cada uno antes de eliminarlo.' : 'Esta acción no se puede deshacer.'}
            onConfirm={async () => {
              try { await api.deleteRole(id!); navigate('/roles'); } catch (err) { setError(errorMessage(err)); }
            }}
          />
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={save}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">Datos del rol</Typography>
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                  required
                  disabled={isAdminRole}
                  helperText="En mayúsculas, sin espacios. Ej.: RECEPCION"
                />
                <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="subtitle2">Pantallas que puede ver</Typography>
              <Typography variant="caption" color="text.secondary">Los cambios aplican de inmediato a los usuarios con este rol</Typography>
              <Table size="small" sx={{ mt: 1.5 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Pantalla</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Permite</TableCell>
                    <TableCell align="right">Acceso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {perms.map((p) => {
                    const locked = isAdminRole && p.code === 'ROLES';
                    return (
                      <TableRow key={p.code} hover onClick={() => !locked && toggle(p.code)} sx={{ cursor: locked ? 'default' : 'pointer' }}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary' }}>{p.description}</TableCell>
                        <TableCell align="right">
                          <Switch size="small" checked={selected.includes(p.code)} disabled={locked} onClick={(e) => e.stopPropagation()} onChange={() => toggle(p.code)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button color="inherit" onClick={() => navigate('/roles')}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={busy}>{isNew ? 'Crear rol' : 'Guardar cambios'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}

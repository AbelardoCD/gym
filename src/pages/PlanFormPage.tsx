import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Divider, FormControl, FormControlLabel, FormLabel, InputAdornment, MenuItem, Stack, Switch,
  TextField, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { api, errorMessage, type PlanBody } from '../api/client';
import { ACCESS_LABEL, PERIOD_LABEL, type PlanAccess, type PlanPeriod } from '../api/types';
import ConfirmButton from '../components/ConfirmButton';
import PageHeader from '../components/PageHeader';

const ACCESS: PlanAccess[] = ['GYM', 'CROSSFIT', 'AMBOS'];
const PERIODS: PlanPeriod[] = ['DIA', 'SEMANA', 'MES', 'ANIO'];
const EMPTY: PlanBody = { name: '', access: 'GYM', period: 'MES', price: 0, active: true };

/** Alta y edición de un tipo de membresía con su precio. */
export default function PlanFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState<PlanBody>(EMPTY);
  const [price, setPrice] = useState('');
  const [payments, setPayments] = useState(0);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.plan(id)
      .then((p) => {
        setForm({ name: p.name, access: p.access, period: p.period, price: p.price, active: p.active });
        setPrice(String(p.price));
        setPayments(p.payments);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoaded(true));
  }, [id]);

  const set = (patch: Partial<PlanBody>) => setForm((f) => ({ ...f, ...patch }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.savePlan(id, { ...form, price: Number(price) });
      navigate('/membresias');
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
        back="/membresias"
        title={id ? form.name : 'Nueva membresía'}
        subtitle={id ? `${payments} ${payments === 1 ? 'pago registrado' : 'pagos registrados'}` : 'Define a qué da acceso, cada cuánto se paga y su precio'}
        actions={id && (
          <ConfirmButton
            label="Eliminar"
            startIcon={<DeleteOutline />}
            title="¿Eliminar la membresía?"
            message={payments > 0 ? 'Tiene pagos registrados, así que no se puede borrar. Desactívala para que ya no se ofrezca.' : 'Esta acción no se puede deshacer.'}
            onConfirm={async () => {
              try {
                await api.deletePlan(id);
                navigate('/membresias');
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          />
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={save} sx={{ maxWidth: 640 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <TextField label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} required placeholder="Ej. Gym - Mes" />
            <FormControl>
              <FormLabel sx={{ fontSize: 13, mb: 0.75 }}>Acceso</FormLabel>
              <ToggleButtonGroup exclusive size="small" value={form.access} onChange={(_, v: PlanAccess | null) => v && set({ access: v })}>
                {ACCESS.map((a) => <ToggleButton key={a} value={a} sx={{ px: 2, textTransform: 'none' }}>{ACCESS_LABEL[a]}</ToggleButton>)}
              </ToggleButtonGroup>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Se paga por" value={form.period} onChange={(e) => set({ period: e.target.value as PlanPeriod })}>
                {PERIODS.map((p) => <MenuItem key={p} value={p}>{PERIOD_LABEL[p]}</MenuItem>)}
              </TextField>
              <TextField
                label="Precio"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                slotProps={{
                  htmlInput: { min: 0, step: '0.01' },
                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                }}
              />
            </Stack>
            <FormControlLabel
              control={<Switch checked={form.active} onChange={(e) => set({ active: e.target.checked })} />}
              label={form.active ? 'Activa: se puede cobrar' : 'Inactiva: ya no se ofrece'}
            />
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/membresias')}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={busy}>{id ? 'Guardar cambios' : 'Crear membresía'}</Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

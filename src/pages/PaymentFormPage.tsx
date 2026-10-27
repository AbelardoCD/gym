import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Divider, FormControl, FormLabel, Grid2 as Grid, InputAdornment, MenuItem, Stack,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { api, errorMessage } from '../api/client';
import {
  ACCESS_LABEL, DISCIPLINE_LABEL, METHOD_LABEL, PERIOD_LABEL, PERIOD_PLURAL, type MembershipPlan, type PaymentMethod, type PaymentPreview,
  type PlanAccess, type User,
} from '../api/types';
import PageHeader from '../components/PageHeader';
import { MembershipChip, fmtDay, fmtMoney } from '../components/billingFormat';

const METHODS: PaymentMethod[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

/** Mismas reglas que el backend: qué membresías puede pagar un socio según sus subroles. */
function fits(access: PlanAccess, u: User) {
  if (access === 'AMBOS') return u.disciplines.includes('GYM') && u.disciplines.includes('CROSSFIT');
  return u.disciplines.includes(access);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.75, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" component="div" sx={{ textAlign: 'right' }}>{children}</Typography>
    </Stack>
  );
}

/** Registro de un pago. El periodo y el monto se calculan solos, pero se pueden ajustar. */
export default function PaymentFormPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [member, setMember] = useState<User | null>(null);
  const [planId, setPlanId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [coversFrom, setCoversFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [status, setStatus] = useState<PaymentPreview['status'] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listUsers('SOCIO').then((list) => {
      const active = list.filter((u) => u.active);
      setMembers(active);
      const pre = Number(search.get('userId'));
      if (pre) setMember(active.find((u) => u.id === pre) ?? null);
    });
    api.plans().then((list) => setPlans(list.filter((p) => p.active)));
  }, [search]);

  const options = useMemo(() => (member ? plans.filter((p) => fits(p.access, member)) : []), [plans, member]);
  const plan = options.find((p) => p.id === planId);

  // Al cambiar de socio se reinicia la membresía y la fecha de inicio.
  useEffect(() => {
    setPlanId('');
    setCoversFrom('');
    setPreview(null);
  }, [member]);

  // Recalcula periodo y monto cada vez que cambia algo.
  useEffect(() => {
    if (!member || !planId || quantity < 1) return;
    api.paymentPreview({ userId: member.id, planId, quantity, coversFrom: coversFrom || undefined })
      .then((p) => {
        setPreview(p);
        setAmount(String(p.amount));
        if (!coversFrom) setCoversFrom(p.coversFrom);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [member, planId, quantity, coversFrom]);

  // El estado del socio se muestra aunque todavía no elija membresía.
  useEffect(() => {
    setStatus(null);
    if (member) api.membershipStatuses().then((l) => setStatus(l.find((s) => s.userId === member.id) ?? null));
  }, [member]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!member || !planId) return;
    setError('');
    setBusy(true);
    try {
      const p = await api.registerPayment({
        userId: member.id, planId, quantity, coversFrom, amount: Number(amount), method, notes: notes || undefined,
      });
      navigate(`/pagos/${p.id}`, { replace: true, state: { registered: true } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader back="/pagos" title="Registrar pago" subtitle="Elige al socio y la membresía; el periodo y el monto se calculan solos" />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2} component="form" onSubmit={save}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Autocomplete
                  options={members}
                  value={member}
                  onChange={(_, v) => setMember(v)}
                  getOptionLabel={(u) => u.fullName}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderOption={(props, u) => (
                    <li {...props} key={u.id}>
                      <Box>
                        <Typography variant="body2">{u.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(' y ')}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(p) => <TextField {...p} label="Socio" required />}
                />
                <TextField
                  select
                  label="Membresía"
                  value={planId}
                  onChange={(e) => { setPlanId(Number(e.target.value)); setCoversFrom(''); }}
                  disabled={!member}
                  required
                  helperText={member && options.length === 0 ? 'No hay membresías activas para los subroles de este socio' : undefined}
                >
                  {options.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', width: '100%', gap: 2 }}>
                        <span>{p.name}</span>
                        <Typography variant="body2" color="text.secondary">{fmtMoney(p.price)} / {PERIOD_LABEL[p.period].toLowerCase()}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label={plan ? `Cantidad de ${PERIOD_PLURAL[plan.period]}` : 'Cantidad'}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    slotProps={{ htmlInput: { min: 1, max: 366 } }}
                  />
                  <TextField
                    label="Inicia el"
                    type="date"
                    value={coversFrom}
                    onChange={(e) => setCoversFrom(e.target.value)}
                    disabled={!planId}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
                <FormControl>
                  <FormLabel sx={{ fontSize: 13, mb: 0.75 }}>Método de pago</FormLabel>
                  <ToggleButtonGroup exclusive size="small" value={method} onChange={(_, v: PaymentMethod | null) => v && setMethod(v)}>
                    {METHODS.map((m) => <ToggleButton key={m} value={m} sx={{ px: 2, textTransform: 'none' }}>{METHOD_LABEL[m]}</ToggleButton>)}
                  </ToggleButtonGroup>
                </FormControl>
                <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional, por ejemplo una promoción" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Resumen</Typography>
              <Row label="Inscripción">{member ? fmtDay(member.enrolledOn) : '—'}</Row>
              <Row label="Estado actual">{status ? <MembershipChip status={status} /> : '—'}</Row>
              <Row label="Acceso">{plan ? ACCESS_LABEL[plan.access] : '—'}</Row>
              <Row label="Cubre">{preview ? `${fmtDay(preview.coversFrom)} – ${fmtDay(preview.coversTo)}` : '—'}</Row>
              <Divider sx={{ my: 1.5 }} />
              <TextField
                label="Monto a cobrar"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!preview}
                required
                helperText={preview && Number(amount) !== preview.amount ? `Precio de lista: ${fmtMoney(preview.amount)}` : ' '}
                slotProps={{
                  htmlInput: { min: 0, step: '0.01' },
                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { fontSize: 22, fontWeight: 700 } },
                }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={busy || !preview} sx={{ mt: 1 }}>
                Registrar pago
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

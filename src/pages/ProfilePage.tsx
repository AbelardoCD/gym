import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Grid2 as Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import { api, errorMessage } from '../api/client';
import { MEASURES, type MeasureKey, type Measurement, type Payment, type Profile } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { fmtDay, fmtMoney } from '../components/billingFormat';
import CatalogTable from '../components/CatalogTable';
import DisciplineChip from '../components/DisciplineChip';
import MeasurementDialog from '../components/MeasurementDialog';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';
import { tones } from '../theme';

const LINE = '#b9b9c1';
const EMPTY_FORM = { phone: '', birthDate: '', emergencyName: '', emergencyPhone: '', medicalNotes: '' };
const COLUMN_LABEL: Record<MeasureKey, string> = {
  weightKg: 'Peso', heightCm: 'Estatura', bodyFatPct: 'Grasa', waistCm: 'Cintura', chestCm: 'Pecho', hipCm: 'Cadera', armCm: 'Brazo', thighCm: 'Pierna',
};
const unitOf = (key: MeasureKey) => MEASURES.find((m) => m.key === key)!.unit;
const num = (v: number | null | undefined, unit = '') => (v == null ? '—' : `${Number(v).toLocaleString([], { maximumFractionDigits: 1 })}${unit && ` ${unit}`}`);

function age(birth?: string | null) {
  if (!birth) return null;
  const b = new Date(`${birth}T12:00`);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--;
  return years;
}

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{value || '—'}</Typography>
    </div>
  );
}

/** Último valor capturado de una medida y cuánto cambió desde la primera toma que la tuvo. */
function trend(rows: Measurement[], key: MeasureKey) {
  const withValue = rows.filter((r) => r[key] != null);
  if (withValue.length === 0) return null;
  const first = withValue[0];
  const last = withValue[withValue.length - 1];
  const diff = Number(last[key]) - Number(first[key]);
  return { value: Number(last[key]), diff: withValue.length > 1 ? diff : null, since: first.measuredOn };
}

function trendHint(t: ReturnType<typeof trend>, unit: string) {
  if (!t || t.diff == null) return t ? 'Primera toma' : 'Sin registros';
  const sign = t.diff > 0 ? '+' : t.diff < 0 ? '−' : '±';
  return `${sign}${num(Math.abs(t.diff), unit)} desde el ${fmtDay(t.since)}`;
}

/**
 * Perfil de un usuario: foto, datos de contacto y emergencia, y su progreso (medidas).
 * Sin :id es el perfil propio ("Mi perfil").
 */
export default function ProfilePage() {
  const params = useParams();
  const { user, can, refresh } = useAuth();
  const userId = params.id ? Number(params.id) : user!.id;
  const self = userId === user?.id;
  const canEdit = self || can('USUARIOS');
  const staff = can('USUARIOS', 'PROGRESO');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState<Measurement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [chartKey, setChartKey] = useState<MeasureKey>('weightKg');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isMember = !!profile?.roles.includes('SOCIO');

  const loadMeasurements = () => api.measurements(userId).then(setRows);

  function show(p: Profile) {
    setProfile(p);
    setForm({
      phone: p.phone ?? '', birthDate: p.birthDate ?? '', emergencyName: p.emergencyName ?? '',
      emergencyPhone: p.emergencyPhone ?? '', medicalNotes: p.medicalNotes ?? '',
    });
  }

  useEffect(() => {
    setProfile(null);
    api.profile(userId).then(show).catch((e) => setMessage({ ok: false, text: errorMessage(e) }));
    if (self || staff) loadMeasurements().catch(() => setRows([]));
    if (self) api.myPayments().then((m) => setPayments(m.payments)).catch(() => setPayments([]));
  }, [userId]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      show(await api.updateProfile(userId, { ...form, birthDate: form.birthDate || null }));
      setMessage({ ok: true, text: 'Datos guardados' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  async function photo(action: 'upload' | 'delete', file?: File) {
    setMessage(null);
    try {
      show(action === 'upload' ? await api.uploadPhoto(userId, file!) : await api.deletePhoto(userId));
      if (self) await refresh();
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    }
  }

  async function remove(m: Measurement) {
    await api.deleteMeasurement(userId, m.id);
    loadMeasurements();
  }

  const chartData = useMemo(() => rows.filter((r) => r[chartKey] != null).map((r) => ({
    date: new Date(`${r.measuredOn}T12:00`), value: Number(r[chartKey]),
  })), [rows, chartKey]);

  if (!profile) {
    return message ? <Alert severity="error">{message.text}</Alert> : null;
  }

  // En la tabla solo aparecen las medidas que se han capturado alguna vez.
  const shown = MEASURES.map((m) => m.key).filter((k) => k !== 'heightCm' && rows.some((r) => r[k] != null));
  const weight = trend(rows, 'weightKg');
  const fat = trend(rows, 'bodyFatPct');
  const waist = trend(rows, 'waistCm');
  const lastBmi = [...rows].reverse().find((r) => r.bmi != null)?.bmi;
  const years = age(profile.birthDate);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  return (
    <>
      <PageHeader
        title={self ? 'Mi perfil' : profile.fullName}
        subtitle={self ? 'Tu foto, tus datos de contacto y tu progreso' : profile.email}
        back={self ? undefined : can('PROGRESO') ? '/progreso' : '/usuarios'}
      />
      {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1 }}>
              <UserAvatar userId={profile.id} name={profile.fullName} photoVersion={profile.photoVersion} size={112} sx={{ mb: 1 }} />
              <Typography variant="h6">{profile.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {[years != null && `${years} años`, `Inscrito desde el ${fmtDay(profile.enrolledOn)}`].filter(Boolean).join(' · ')}
              </Typography>
              {profile.disciplines.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  {profile.disciplines.map((d) => <DisciplineChip key={d} discipline={d} />)}
                </Stack>
              )}
              {canEdit && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) photo('upload', f);
                      e.target.value = '';
                    }}
                  />
                  <Button size="small" variant="outlined" color="inherit" startIcon={<PhotoCameraOutlined />} onClick={() => fileInput.current?.click()}>
                    {profile.photoVersion ? 'Cambiar foto' : 'Subir foto'}
                  </Button>
                  {profile.photoVersion && <Button size="small" color="inherit" onClick={() => photo('delete')}>Quitar</Button>}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Contacto y salud</Typography>
              {canEdit ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Teléfono" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth label="Fecha de nacimiento" type="date" value={form.birthDate}
                      onChange={(e) => set({ birthDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Contacto de emergencia" value={form.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Teléfono de emergencia" value={form.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth multiline minRows={2} label="Lesiones, alergias o padecimientos"
                      helperText={self ? "Lo ven tus entrenadores para ajustar tus rutinas" : "Lo ven los entrenadores para ajustar sus rutinas"}
                      value={form.medicalNotes} onChange={(e) => set({ medicalNotes: e.target.value })}
                    />
                  </Grid>
                  <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={save} disabled={busy}>Guardar</Button>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><ReadOnly label="Teléfono" value={profile.phone} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><ReadOnly label="Fecha de nacimiento" value={profile.birthDate && fmtDay(profile.birthDate)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><ReadOnly label="Contacto de emergencia" value={profile.emergencyName} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><ReadOnly label="Teléfono de emergencia" value={profile.emergencyPhone} /></Grid>
                  <Grid size={12}><ReadOnly label="Lesiones, alergias o padecimientos" value={profile.medicalNotes} /></Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {self && payments.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4 }}>Mis pagos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Descarga el recibo de cualquiera de tus pagos</Typography>
          <CatalogTable
            rows={payments}
            rowKey={(p) => p.id}
            columns={[
              { label: 'Fecha', render: (p) => <Typography variant="body2" fontWeight={500}>{new Date(p.paidAt).toLocaleDateString([], { dateStyle: 'medium' })}</Typography> },
              { label: 'Membresía', render: (p) => p.planName, hideOnMobile: true },
              { label: 'Cubre', render: (p) => `${fmtDay(p.coversFrom)} – ${fmtDay(p.coversTo)}`, hideOnMobile: true },
              { label: 'Monto', render: (p) => fmtMoney(p.amount), align: 'right' },
              {
                label: '',
                align: 'right',
                render: (p) => (
                  <Tooltip title="Descargar recibo">
                    <IconButton size="small" onClick={() => api.downloadReceipt(p.id)}><ReceiptLongOutlined fontSize="small" /></IconButton>
                  </Tooltip>
                ),
              },
            ]}
          />
        </>
      )}

      {isMember && (self || staff) && (
        <>
          <Stack direction="row" sx={{ mt: 4, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h6">Progreso</Typography>
              <Typography variant="body2" color="text.secondary">
                {staff ? 'Medidas tomadas por los entrenadores' : 'Tus medidas las registra tu entrenador'}
              </Typography>
            </div>
            {staff && <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAdding(true)}>Registrar medidas</Button>}
          </Stack>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}><Tile label="Peso" value={num(weight?.value, 'kg')} hint={trendHint(weight, 'kg')} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><Tile label="IMC" value={num(lastBmi)} hint="Peso entre estatura al cuadrado" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><Tile label="Grasa corporal" value={num(fat?.value, '%')} hint={trendHint(fat, '%')} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><Tile label="Cintura" value={num(waist?.value, 'cm')} hint={trendHint(waist, 'cm')} /></Grid>
          </Grid>

          {rows.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="subtitle2">Evolución</Typography>
                  <TextField
                    select size="small" fullWidth={false} value={chartKey}
                    onChange={(e) => setChartKey(e.target.value as MeasureKey)} sx={{ width: 180 }}
                  >
                    {MEASURES.map((m) => <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>)}
                  </TextField>
                </Stack>
                {chartData.length < 2 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    Se necesitan al menos dos tomas con esta medida para ver la gráfica
                  </Typography>
                ) : (
                  <LineChart
                    height={260}
                    dataset={chartData}
                    xAxis={[{
                      dataKey: 'date', scaleType: 'time', tickNumber: 6,
                      valueFormatter: (d: Date) => d.toLocaleDateString([], { day: 'numeric', month: 'short' }),
                      tickLabelStyle: { fontSize: 11, fill: tones.muted },
                    }]}
                    yAxis={[{ tickLabelStyle: { fontSize: 11, fill: tones.muted } }]}
                    series={[{
                      dataKey: 'value', color: LINE, curve: 'linear', showMark: true,
                      valueFormatter: (v) => num(v, unitOf(chartKey)),
                    }]}
                    grid={{ horizontal: true }}
                    margin={{ top: 16, right: 16, bottom: 28, left: 40 }}
                    slotProps={{ legend: { hidden: true } }}
                    sx={{
                      '& .MuiLineElement-root': { strokeWidth: 2 },
                      '& .MuiMarkElement-root': { stroke: LINE, fill: tones.surface, strokeWidth: 2 },
                      '& .MuiChartsGrid-line': { stroke: tones.border, strokeDasharray: '2 4' },
                      '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: tones.border },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          <CatalogTable
            rows={[...rows].reverse()}
            rowKey={(m) => m.id}
            empty="Todavía no hay medidas registradas"
            columns={[
              { label: 'Fecha', render: (m) => <Typography variant="body2" fontWeight={500}>{fmtDay(m.measuredOn)}</Typography> },
              ...shown.map((k) => ({
                label: COLUMN_LABEL[k],
                align: 'right' as const,
                hideOnMobile: !['weightKg', 'bodyFatPct'].includes(k),
                render: (m: Measurement) => num(m[k], unitOf(k)),
              })),
              { label: 'IMC', render: (m) => num(m.bmi), align: 'right', hideOnMobile: true },
              {
                label: 'Notas',
                hideOnMobile: true,
                render: (m) => (
                  <Box sx={{ maxWidth: 220 }}>
                    {m.notes && <Typography variant="body2">{m.notes}</Typography>}
                    {m.registeredBy && <Typography variant="caption" color="text.secondary">Tomó: {m.registeredBy}</Typography>}
                  </Box>
                ),
              },
              ...(staff ? [{
                label: '',
                align: 'right' as const,
                render: (m: Measurement) => (
                  <Tooltip title="Borrar">
                    <IconButton size="small" onClick={() => remove(m)}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                  </Tooltip>
                ),
              }] : []),
            ]}
          />
          <MeasurementDialog open={adding} userId={userId} onClose={() => setAdding(false)} onSaved={loadMeasurements} />
        </>
      )}
    </>
  );
}

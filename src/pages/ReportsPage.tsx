import { useEffect, useState, type ReactNode } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Grid2 as Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import { api } from '../api/client';
import { METHOD_LABEL, type ExportKind, type ReportSummary } from '../api/types';
import PageHeader from '../components/PageHeader';
import { fmtMoney, isoDay } from '../components/billingFormat';
import { tones } from '../theme';

/** Un solo tono neutro para las barras: cada gráfica tiene una sola serie y el título dice qué es. */
const BAR = '#b9b9c1';
/** $500, $1.5k, $25k: corto para el eje. */
const compactMoney = { format: (v: number) => (v >= 1000 ? `$${Number((v / 1000).toFixed(1))}k` : `$${v}`) };
const monthLabel = (ym: string) => new Date(`${ym}-15T12:00`).toLocaleDateString([], { month: 'short' });

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2">{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        <Box sx={{ mt: 1 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function Bars({ data, money = false, height = 240 }: { data: { label: string; value: number }[]; money?: boolean; height?: number }) {
  return (
    <BarChart
      height={height}
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: 'label', tickLabelStyle: { fontSize: 11, fill: tones.muted } }]}
      yAxis={[{ tickLabelStyle: { fontSize: 11, fill: tones.muted }, valueFormatter: money ? (v: number) => compactMoney.format(v) : undefined }]}
      series={[{ dataKey: 'value', color: BAR, valueFormatter: (v) => (money ? fmtMoney(v ?? 0) : String(v ?? 0)) }]}
      borderRadius={4}
      grid={{ horizontal: true }}
      margin={{ top: 12, right: 8, bottom: 28, left: money ? 44 : 32 }}
      slotProps={{ legend: { hidden: true } }}
      sx={{
        '& .MuiChartsGrid-line': { stroke: tones.border, strokeDasharray: '2 4' },
        '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: tones.border },
      }}
    />
  );
}

/** Estado de las membresías: cada uno con su ícono y texto, no solo color. */
function MemberStates({ m }: { m: ReportSummary['members'] }) {
  const rows = [
    { label: 'Vigentes', value: m.vigentes, color: 'success' as const, icon: <CheckCircleOutline fontSize="small" /> },
    { label: 'Por vencer', value: m.porVencer, color: 'warning' as const, icon: <ScheduleOutlined fontSize="small" /> },
    { label: 'Vencidas', value: m.vencidas, color: 'error' as const, icon: <ErrorOutline fontSize="small" /> },
    { label: 'Sin pagos', value: m.sinPagos, color: 'default' as const, icon: <RemoveCircleOutline fontSize="small" /> },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <Stack spacing={1.25}>
      {rows.map((r) => (
        <Stack key={r.label} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip size="small" variant="outlined" color={r.color} icon={r.icon} label={r.label} />
          <Typography variant="body2" fontWeight={600}>
            {r.value} <Typography component="span" variant="caption" color="text.secondary">{total ? `${Math.round((r.value / total) * 100)}%` : ''}</Typography>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(isoDay(now));
  const [data, setData] = useState<ReportSummary | null>(null);
  const [busy, setBusy] = useState<ExportKind | null>(null);

  useEffect(() => {
    setData(null);
    api.reportSummary({ from, to }).then(setData);
  }, [from, to]);

  async function download(kind: ExportKind) {
    setBusy(kind);
    try {
      await api.exportExcel(kind, { from, to });
    } finally {
      setBusy(null);
    }
  }

  const exportButton = (kind: ExportKind, label: string) => (
    <Button size="small" variant="outlined" color="inherit" startIcon={<FileDownloadOutlined />} disabled={busy !== null} onClick={() => download(kind)}>
      {label}
    </Button>
  );

  return (
    <>
      <PageHeader title="Reportes" subtitle="Ingresos, socios y asistencia del periodo" />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
            <TextField type="date" label="Desde" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to } }} sx={{ maxWidth: { md: 180 } }} />
            <TextField type="date" label="Hasta" value={to} onChange={(e) => e.target.value && setTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from } }} sx={{ maxWidth: { md: 180 } }} />
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>Excel:</Typography>
              {exportButton('pagos', 'Pagos')}
              {exportButton('asistencia', 'Asistencia')}
              {exportButton('socios', 'Socios')}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {!data ? (
        <Grid container spacing={2}>
          {[0, 1, 2, 3].map((i) => <Grid key={i} size={{ xs: 6, md: 3 }}><Skeleton variant="rounded" height={110} /></Grid>)}
          <Grid size={12}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}><Tile label="Ingresos" value={fmtMoney(data.income)} hint={`${data.payments} ${data.payments === 1 ? 'pago' : 'pagos'}`} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Tile label="Ticket promedio" value={fmtMoney(data.payments ? data.income / data.payments : 0)} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}><Tile label="Visitas" value={data.visits} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Tile label="Socios nuevos" value={data.newMembers} hint="inscritos en el periodo" /></Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <ChartCard title="Ingresos por mes" subtitle="Últimos 12 meses">
              <Bars data={data.incomeByMonth.map((p) => ({ label: monthLabel(p.label), value: p.value }))} money />
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ChartCard title="Membresías hoy" subtitle="Socios activos por estado">
              <Box sx={{ mt: 1.5 }}><MemberStates m={data.members} /></Box>
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <ChartCard title="Horas pico" subtitle="Entradas por hora del día en el periodo">
              <Bars data={data.visitsByHour} />
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ChartCard title="Días con más visitas">
              <Bars data={data.visitsByWeekday} />
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <ChartCard title="Ingresos por membresía">
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Membresía</TableCell><TableCell align="right">Pagos</TableCell><TableCell align="right">Total</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {data.incomeByPlan.length === 0 && (
                    <TableRow><TableCell colSpan={3}><Typography variant="body2" color="text.secondary">Sin pagos en el periodo</Typography></TableCell></TableRow>
                  )}
                  {data.incomeByPlan.map((p) => (
                    <TableRow key={p.plan}>
                      <TableCell>{p.plan}</TableCell>
                      <TableCell align="right">{p.payments}</TableCell>
                      <TableCell align="right"><b>{fmtMoney(p.total)}</b></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <ChartCard title="Ingresos por método de pago">
              <Table size="small">
                <TableBody>
                  {data.incomeByMethod.map((m) => (
                    <TableRow key={m.label}>
                      <TableCell>{METHOD_LABEL[m.label]}</TableCell>
                      <TableCell align="right"><b>{fmtMoney(m.value)}</b></TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', width: 56 }}>
                        {data.income ? `${Math.round((m.value / data.income) * 100)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ChartCard>
          </Grid>
        </Grid>
      )}
    </>
  );
}

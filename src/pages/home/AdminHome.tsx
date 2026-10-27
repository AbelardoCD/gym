import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid2 as Grid, TextField, Typography } from '@mui/material';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import { api } from '../../api/client';
import type { Attendance, MembershipStatus } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import CatalogTable from '../../components/CatalogTable';
import PageHeader from '../../components/PageHeader';
import { fmtTime } from '../../components/attendanceFormat';
import { MembershipChip } from '../../components/billingFormat';

/** Fecha local en formato yyyy-mm-dd. */
const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

/** Inicio del administrador: la asistencia del día. */
export default function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = isoDay(new Date());
  const [day, setDay] = useState(today);
  const [rows, setRows] = useState<Attendance[]>([]);
  const [week, setWeek] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  /** Vigencia de cada socio: para ver de un vistazo quién entró sin estar al corriente. */
  const [statuses, setStatuses] = useState<Map<number, MembershipStatus>>(new Map());

  useEffect(() => {
    api.membershipStatuses().then((l) => setStatuses(new Map(l.map((m) => [m.userId, m])))).catch(() => undefined);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const weekStart = isoDay(new Date(Date.parse(day) - 6 * 86400000));
    return Promise.all([
      api.attendance({ from: day, to: day }).then(setRows),
      api.attendance({ from: weekStart, to: day }).then(setWeek),
    ]).finally(() => setLoading(false));
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  // Hora con más entradas del día (la salida es opcional, así que no se cuenta quién sigue dentro).
  const byHour = rows.reduce<Record<number, number>>((acc, a) => {
    const h = new Date(a.checkInAt).getHours();
    return { ...acc, [h]: (acc[h] ?? 0) + 1 };
  }, {});
  const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  const people = new Set(rows.map((a) => a.userId)).size;
  const isToday = day === today;

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.fullName.split(' ')[0] ?? ''}`}
        subtitle={isToday ? 'Asistencia de hoy' : `Asistencia del ${new Date(`${day}T12:00`).toLocaleDateString([], { dateStyle: 'long' })}`}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="date"
              size="small"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              slotProps={{ htmlInput: { max: today } }}
              sx={{ width: 170, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.8)' } }}
            />
            <Button variant="contained" startIcon={<HowToRegOutlined />} onClick={() => navigate('/asistencia')}>Registrar</Button>
          </Box>
        }
      />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Stat label="Visitas del día" value={rows.length} hint={`${people} ${people === 1 ? 'persona' : 'personas'}`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Stat
            label="Hora más concurrida"
            value={peak ? `${peak[0]}:00` : '—'}
            hint={peak ? `${peak[1]} ${peak[1] === 1 ? 'entrada' : 'entradas'}` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stat label="Visitas en 7 días" value={week.length} hint={`${(week.length / 7).toFixed(1)} por día`} />
        </Grid>
      </Grid>
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(a) => a.id}
        searchText={(a) => a.userName}
        empty={isToday ? 'Nadie ha registrado entrada hoy' : 'Sin registros ese día'}
        columns={[
          { label: 'Usuario', render: (a) => <Typography variant="body2" fontWeight={600}>{a.userName}</Typography> },
          { label: 'Entrada', render: (a) => fmtTime(a.checkInAt) },
          { label: 'Membresía', render: (a) => (statuses.has(a.userId) ? <MembershipChip status={statuses.get(a.userId)} /> : '—') },
          { label: 'Salida', render: (a) => (a.checkOutAt ? fmtTime(a.checkOutAt) : '—'), hideOnMobile: true },
        ]}
      />
    </>
  );
}

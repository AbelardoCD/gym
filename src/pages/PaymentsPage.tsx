import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Grid2 as Grid, Stack, TextField, Typography } from '@mui/material';
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined';
import { useAuth } from '../auth/AuthContext';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { METHOD_LABEL, PERIOD_LABEL, PERIOD_PLURAL, type Payment, type PaymentMethod } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';
import { fmtDay, fmtMoney, isoDay } from '../components/billingFormat';

const METHODS: PaymentMethod[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

export const planQuantity = (p: Payment) =>
  p.quantity === 1 ? `1 ${PERIOD_LABEL[p.period].toLowerCase()}` : `${p.quantity} ${PERIOD_PLURAL[p.period]}`;

/** Lista de pagos realizados, filtrada por fecha de cobro. */
export default function PaymentsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [from, setFrom] = useState(isoDay(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(isoDay(now));
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { can } = useAuth();
  const [notice, setNotice] = useState('');

  async function sendReminders() {
    const { sent } = await api.runReminders();
    setNotice(sent === 0 ? 'No había recordatorios pendientes' : `Se enviaron ${sent} ${sent === 1 ? 'recordatorio' : 'recordatorios'} de vencimiento`);
  }

  useEffect(() => {
    setLoading(true);
    api.payments({ from, to }).then(setRows).finally(() => setLoading(false));
  }, [from, to]);

  const total = useMemo(() => rows.reduce((s, p) => s + p.amount, 0), [rows]);
  const byMethod = useMemo(
    () => METHODS.map((m) => ({ m, sum: rows.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0) })),
    [rows],
  );

  return (
    <>
      <PageHeader
        title="Pagos"
        subtitle="Pagos realizados por los socios"
        actions={
          <>
            {can('MEMBRESIAS') && (
              <Button variant="outlined" color="inherit" startIcon={<NotificationsActiveOutlined />} onClick={sendReminders}>
                Enviar recordatorios
              </Button>
            )}
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/pagos/nuevo')}>Registrar pago</Button>
          </>
        }
      />
      {notice && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total cobrado</Typography>
              <Typography sx={{ fontSize: 30, fontWeight: 700, mt: 0.5 }}>{fmtMoney(total)}</Typography>
              <Typography variant="caption" color="text.secondary">{rows.length} {rows.length === 1 ? 'pago' : 'pagos'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField type="date" label="Desde" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to } }} />
                <TextField type="date" label="Hasta" value={to} onChange={(e) => e.target.value && setTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from } }} />
              </Stack>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {byMethod.map(({ m, sum }) => (
                  <Box key={m}>
                    <Typography variant="caption" color="text.secondary">{METHOD_LABEL[m]}</Typography>
                    <Typography variant="body2" fontWeight={600}>{fmtMoney(sum)}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.userName} ${p.planName} ${METHOD_LABEL[p.method]}`}
        onRowClick={(p) => navigate(`/pagos/${p.id}`)}
        empty="No hay pagos en esas fechas"
        columns={[
          { label: 'Fecha', render: (p) => new Date(p.paidAt).toLocaleDateString([], { dateStyle: 'medium' }) },
          { label: 'Socio', render: (p) => <Typography variant="body2" fontWeight={600}>{p.userName}</Typography> },
          {
            label: 'Membresía',
            render: (p) => (
              <>
                <Typography variant="body2">{p.planName}</Typography>
                <Typography variant="caption" color="text.secondary">{planQuantity(p)}</Typography>
              </>
            ),
            hideOnMobile: true,
          },
          { label: 'Cubre', render: (p) => `${fmtDay(p.coversFrom)} – ${fmtDay(p.coversTo)}`, hideOnMobile: true },
          { label: 'Método', render: (p) => METHOD_LABEL[p.method], hideOnMobile: true },
          { label: 'Monto', align: 'right', render: (p) => <Typography variant="body2" fontWeight={600}>{fmtMoney(p.amount)}</Typography> },
        ]}
      />
    </>
  );
}

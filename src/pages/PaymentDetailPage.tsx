import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import MailOutlineOutlined from '@mui/icons-material/MailOutlineOutlined';
import { api, errorMessage } from '../api/client';
import { METHOD_LABEL, type Payment } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import ConfirmButton from '../components/ConfirmButton';
import PageHeader from '../components/PageHeader';
import { fmtDay, fmtMoney } from '../components/billingFormat';
import { planQuantity } from './PaymentsPage';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1, gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>{value}</Typography>
    </Stack>
  );
}

/** Detalle de un pago. Los pagos no se editan; el administrador puede anularlos. */
export default function PaymentDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [p, setP] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  /** Al llegar desde "Registrar pago" se confirma el registro. */
  const [notice, setNotice] = useState<string | null>(useLocation().state?.registered ? 'Pago registrado' : null);
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    setError('');
    try {
      setNotice(`Recibo enviado a ${await api.emailReceipt(id)}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    api.payment(id).then(setP).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (!p) return error ? <Alert severity="error">{error}</Alert> : null;

  return (
    <>
      <PageHeader
        back="/pagos"
        title={`Pago de ${p.userName}`}
        subtitle={new Date(p.paidAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
        actions={(
          <>
            <Button variant="outlined" color="inherit" startIcon={<DownloadOutlined />} onClick={() => api.downloadReceipt(p.id)}>Recibo PDF</Button>
            <Button variant="outlined" color="inherit" startIcon={<MailOutlineOutlined />} onClick={resend} disabled={sending}>Enviar por correo</Button>
            {isAdmin && (
              <ConfirmButton
                label="Anular pago"
                startIcon={<BlockOutlined />}
                title="¿Anular este pago?"
                message="Se borrará y el periodo que cubría dejará de contar en la vigencia del socio."
                onConfirm={async () => { await api.cancelPayment(p.id); navigate('/pagos'); }}
              />
            )}
          </>
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2, maxWidth: 560 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      <Card sx={{ maxWidth: 560 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Monto</Typography>
          <Typography sx={{ fontSize: 32, fontWeight: 700 }}>{fmtMoney(p.amount)}</Typography>
          <Divider sx={{ my: 2 }} />
          <Row label="Membresía" value={p.planName} />
          <Row label="Cantidad" value={planQuantity(p)} />
          <Row label="Cubre" value={`${fmtDay(p.coversFrom)} – ${fmtDay(p.coversTo)}`} />
          <Row label="Método" value={METHOD_LABEL[p.method]} />
          {p.notes && <Row label="Notas" value={p.notes} />}
          <Row label="Registró" value={p.registeredBy} />
        </CardContent>
      </Card>
    </>
  );
}

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  /** Carga el código; se vuelve a pedir cada vez que se abre. */
  load: () => Promise<string>;
  /** Si se da, aparece "Regenerar" (invalida la credencial anterior). */
  regenerate?: () => Promise<string>;
}

/** Imagen de la credencial para imprimir: el QR con el nombre debajo, sobre fondo blanco. */
async function credentialPng(code: string, name: string): Promise<string> {
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, code, { width: 520, margin: 0, errorCorrectionLevel: 'M' });
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qr, 40, 40);
  ctx.fillStyle = '#111114';
  ctx.textAlign = 'center';
  ctx.font = '600 32px Inter, sans-serif';
  ctx.fillText(name, 300, 625, 540);
  ctx.fillStyle = '#6b6b73';
  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillText('Muestra este código en recepción', 300, 670);
  return canvas.toDataURL('image/png');
}

/** Credencial QR del usuario: se muestra en recepción para registrar la entrada. */
export default function CredentialDialog({ open, onClose, name, load, regenerate }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Primer clic en "Regenerar" pide confirmación en el mismo diálogo. */
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(null);
    setConfirming(false);
    load().then(setCode);
  }, [open]);

  useEffect(() => {
    if (code) QRCode.toDataURL(code, { width: 640, margin: 1, errorCorrectionLevel: 'M' }).then(setImage);
    else setImage(null);
  }, [code]);

  async function download() {
    if (!code) return;
    const a = document.createElement('a');
    a.href = await credentialPng(code, name);
    a.download = `credencial-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  }

  async function renew() {
    if (!regenerate) return;
    setBusy(true);
    try {
      setCode(await regenerate());
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Credencial</DialogTitle>
      <DialogContent>
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, aspectRatio: '1', display: 'grid', placeItems: 'center' }}>
          {image ? (
            <Box component="img" src={image} alt={`Código QR de ${name}`} sx={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
          ) : (
            <CircularProgress size={28} sx={{ color: '#888' }} />
          )}
        </Box>
        <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>{name}</Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Se muestra en recepción al llegar para registrar la entrada
        </Typography>
        {confirming && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            La credencial actual dejará de funcionar y habrá que entregar la nueva.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {regenerate && (confirming ? (
          <Button color="warning" startIcon={<RefreshOutlined />} onClick={renew} disabled={busy} sx={{ mr: 'auto' }}>
            Confirmar
          </Button>
        ) : (
          <Button color="inherit" startIcon={<RefreshOutlined />} onClick={() => setConfirming(true)} disabled={!code} sx={{ mr: 'auto' }}>
            Regenerar
          </Button>
        ))}
        <Button color="inherit" startIcon={<DownloadOutlined />} onClick={download} disabled={!code}>Descargar</Button>
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

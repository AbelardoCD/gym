import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import QrCodeScannerOutlined from '@mui/icons-material/QrCodeScannerOutlined';
import { api, errorCode, errorField, errorMessage } from '../api/client';
import type { ScanResult } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { MembershipChip } from './billingFormat';
import UserAvatar from './UserAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Se llama después de cada entrada registrada, para refrescar la lista. */
  onRegistered: () => void;
}

/**
 * La cámara ignora el mismo código durante un minuto, para que un QR que se queda frente a ella
 * se lea una y otra vez. Escribirlo a mano no tiene esta espera.
 */
const REPEAT_MS = 60_000;

type Expired = { message: string; code: string; userId?: string };

/**
 * Lector de credenciales para recepción. Usa la cámara del equipo y también acepta lectores USB,
 * que escriben el código en el campo de texto y terminan con Enter.
 */
export default function ScanDialog({ open, onClose, onRegistered }: Props) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const last = useRef<{ code: string; at: number } | null>(null);
  /** Mientras se procesa un código o se decide sobre una membresía vencida, la cámara no lee. */
  const busy = useRef(false);
  const registered = useRef(onRegistered);
  registered.current = onRegistered;
  const [camera, setCamera] = useState<'starting' | 'on' | 'off'>('starting');
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState<Expired | null>(null);

  async function submit(code: string, force = false) {
    busy.current = true;
    setError(null);
    try {
      const r = await api.scan(code, force);
      setResult(r);
      setExpired(null);
      registered.current();
    } catch (e) {
      setResult(null);
      if (errorCode(e) === 'MEMBRESIA_VENCIDA') {
        setExpired({ message: errorMessage(e), code, userId: errorField(e, 'userId') });
        return; // la cámara sigue en pausa hasta que se decida
      }
      setError(errorMessage(e));
    }
    busy.current = false;
  }

  function onDetected(code: string) {
    const now = Date.now();
    if (busy.current || (last.current?.code === code && now - last.current.at < REPEAT_MS)) return;
    last.current = { code, at: now };
    submit(code);
  }

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setExpired(null);
    setTyped('');
    busy.current = false;
    last.current = null;
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      const v = video.current;
      if (stopped || !v || !ctx) return;
      if (v.readyState >= v.HAVE_ENOUGH_DATA && v.videoWidth) {
        // Se reduce el cuadro para que la lectura sea rápida incluso en equipos modestos.
        const scale = Math.min(1, 480 / v.videoWidth);
        canvas.width = v.videoWidth * scale;
        canvas.height = v.videoHeight * scale;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (qr?.data) onDetected(qr.data);
      }
      timer = window.setTimeout(tick, 200);
    };

    setCamera('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('off');
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          if (stopped) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (video.current) {
            video.current.srcObject = s;
            video.current.play().catch(() => undefined);
          }
          setCamera('on');
          tick();
        })
        .catch(() => setCamera('off'));
    }
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  function cancelExpired() {
    setExpired(null);
    busy.current = false;
  }

  const entry = result?.action === 'ENTRADA';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Escanear credencial</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.default',
            border: 1, borderColor: 'divider', aspectRatio: '4 / 3', display: camera === 'off' ? 'none' : 'block',
          }}
        >
          <Box component="video" ref={video} muted playsInline sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <Box
            sx={{
              position: 'absolute', inset: '18%', border: '2px solid rgba(255,255,255,.75)', borderRadius: 2,
              boxShadow: '0 0 0 9999px rgba(0,0,0,.35)', pointerEvents: 'none',
            }}
          />
          {camera === 'starting' && (
            <Typography variant="body2" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
              Abriendo la cámara…
            </Typography>
          )}
        </Box>
        {camera === 'off' && (
          <Alert severity="info" icon={<QrCodeScannerOutlined />}>
            No se pudo abrir la cámara. Puedes usar un lector USB o escribir el código abajo.
          </Alert>
        )}

        <TextField
          fullWidth
          size="small"
          autoFocus
          label="Código (lector USB o a mano)"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typed.trim()) {
              submit(typed.trim());
              setTyped('');
            }
          }}
          sx={{ mt: 2 }}
        />

        <Box aria-live="polite" sx={{ mt: 2, minHeight: 64 }}>
          {result && (
            <Alert severity={entry ? 'success' : 'info'} sx={{ alignItems: 'center' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <UserAvatar userId={result.attendance.userId} name={result.attendance.userName} photoVersion={result.photoVersion} size={40} />
                <span>
                  {entry
                    ? <><strong>Entrada</strong> de {result.attendance.userName}</>
                    : <>{result.attendance.userName} <strong>ya registró su entrada</strong> hoy</>}
                </span>
                {result.membership && <MembershipChip status={result.membership} />}
              </Stack>
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {expired && (
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button color="inherit" size="small" onClick={cancelExpired}>Cancelar</Button>
                  <Button color="inherit" size="small" onClick={() => submit(expired.code, true)}>Dejar pasar</Button>
                  {can('PAGOS') && expired.userId && (
                    <Button color="inherit" size="small" variant="outlined" onClick={() => navigate(`/pagos/nuevo?userId=${expired.userId}`)}>
                      Cobrar
                    </Button>
                  )}
                </Stack>
              }
              sx={{ flexWrap: 'wrap', '& .MuiAlert-action': { pl: { xs: 0, sm: 2 }, ml: { xs: 0, sm: 'auto' } } }}
            >
              {expired.message}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

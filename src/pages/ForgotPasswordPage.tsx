import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import MailOutlineOutlined from '@mui/icons-material/MailOutlineOutlined';
import { api, errorMessage } from '../api/client';
import AuthShell from '../components/AuthShell';

/** Pide el correo y manda el enlace para restablecer la contraseña. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Recuperar contraseña</Typography>
      {sent ? (
        <>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Si <b>{email}</b> está registrado, te llegará un correo con un enlace para elegir una nueva contraseña.
            Revisa también la carpeta de spam. El enlace vale por una hora.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth sx={{ py: 1.4 }}>Volver a iniciar sesión</Button>
        </>
      ) : (
        <Box component="form" onSubmit={submit}>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Escribe tu correo y te mandamos un enlace para cambiarla.</Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Correo"
              type="email"
              size="medium"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><MailOutlineOutlined fontSize="small" /></InputAdornment> } }}
            />
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={busy} sx={{ py: 1.4 }}>
              {busy ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </Stack>
        </Box>
      )}
      <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" color="text.secondary" underline="hover">Regresar al inicio de sesión</Link>
      </Typography>
    </AuthShell>
  );
}

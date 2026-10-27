import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { api, errorMessage } from '../api/client';
import AuthShell from '../components/AuthShell';

/** Llega desde el enlace del correo: elige la nueva contraseña. */
export default function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    setError('');
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const lock = { input: { startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment> } };

  return (
    <AuthShell>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Nueva contraseña</Typography>
      {!token ? (
        <Alert severity="error" variant="outlined" sx={{ mt: 3 }}>El enlace está incompleto. Ábrelo de nuevo desde el correo.</Alert>
      ) : done ? (
        <>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Listo, tu contraseña cambió. Ya puedes iniciar sesión con ella.</Typography>
          <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth sx={{ py: 1.4 }}>Iniciar sesión</Button>
        </>
      ) : (
        <Box component="form" onSubmit={submit}>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Elige una contraseña de al menos 6 caracteres.</Typography>
          <Stack spacing={2.5}>
            <TextField label="Nueva contraseña" type="password" size="medium" autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} required autoFocus slotProps={{ ...lock, htmlInput: { minLength: 6 } }} />
            <TextField label="Repítela" type="password" size="medium" autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required error={mismatch} helperText={mismatch ? 'No coinciden' : ' '} slotProps={lock} />
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={busy || mismatch} sx={{ py: 1.4 }}>
              {busy ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </Stack>
        </Box>
      )}
      <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
        <Link component={RouterLink} to={done ? '/login' : '/recuperar'} color="text.secondary" underline="hover">
          {done ? 'Regresar' : 'Pedir otro enlace'}
        </Link>
      </Typography>
    </AuthShell>
  );
}

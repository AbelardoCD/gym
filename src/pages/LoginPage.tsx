import { useState, type FormEvent } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import MailOutlineOutlined from '@mui/icons-material/MailOutlineOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AuthShell from '../components/AuthShell';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
        <Box component="form" onSubmit={submit}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Bienvenido</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Ingresa con tu correo y contraseña</Typography>
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
            <TextField
              label="Contraseña"
              type={show ? 'text' : 'password'}
              size="medium"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {show ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Link component={RouterLink} to="/recuperar" variant="body2" color="text.secondary" underline="hover" sx={{ alignSelf: 'flex-end', mt: '-6px !important' }}>
              ¿Olvidaste tu contraseña?
            </Link>
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={busy} sx={{ py: 1.4 }}>
              {busy ? 'Entrando…' : 'Iniciar sesión'}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4, textAlign: 'center' }}>
            ¿No tienes cuenta? Pídela en recepción.
          </Typography>
        </Box>
    </AuthShell>
  );
}

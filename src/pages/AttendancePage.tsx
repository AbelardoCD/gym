import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import QrCodeScannerOutlined from '@mui/icons-material/QrCodeScannerOutlined';
import { api, errorCode, errorMessage } from '../api/client';
import type { Attendance, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { duration, fmtDateTime as fmt } from '../components/attendanceFormat';
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';
import ScanDialog from '../components/ScanDialog';

export default function AttendancePage() {
  const { can, user } = useAuth();
  const manager = can('ASISTENCIA_GESTION');
  const [rows, setRows] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [target, setTarget] = useState<User | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  /** Aviso de membresía vencida; quien gestiona asistencia puede dejar pasar de todos modos. */
  const [expired, setExpired] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const load = () => api.attendance({ userId: target?.id }).then(setRows);
  useEffect(() => {
    load();
  }, [target]);
  useEffect(() => {
    if (manager) api.listUsers().then((l) => setUsers(l.filter((u) => u.active)));
  }, [manager]);

  async function run(action: 'in' | 'out', force = false) {
    setMessage(null);
    setExpired(null);
    try {
      const a = action === 'in' ? await api.checkIn(target?.id, force) : await api.checkOut(target?.id);
      setMessage({ ok: true, text: `${action === 'in' ? 'Entrada' : 'Salida'} registrada para ${a.userName}` });
      load();
    } catch (e) {
      if (errorCode(e) === 'MEMBRESIA_VENCIDA' && manager) setExpired(errorMessage(e));
      else setMessage({ ok: false, text: errorMessage(e) });
    }
  }

  return (
    <>
      <PageHeader
        title="Asistencia"
        subtitle={manager ? 'Registra la entrada de cualquier usuario; la salida es opcional' : 'Registra tu entrada; la salida es opcional'}
        actions={manager && (
          <Button variant="contained" startIcon={<QrCodeScannerOutlined />} onClick={() => setScanning(true)}>Escanear QR</Button>
        )}
      />
      {manager && <ScanDialog open={scanning} onClose={() => setScanning(false)} onRegistered={load} />}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
            {manager ? (
              <Autocomplete
                sx={{ flex: 1, maxWidth: { md: 380 } }}
                options={users}
                value={target}
                onChange={(_, v) => setTarget(v)}
                getOptionLabel={(u) => u.fullName}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(p) => <TextField {...p} label="Usuario" placeholder={`Vacío = ${user?.fullName}`} />}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Últimos 30 días</Typography>
            )}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<LoginOutlined />} onClick={() => run('in')}>Registrar entrada</Button>
              <Button variant="outlined" color="inherit" startIcon={<LogoutOutlined />} onClick={() => run('out')}>Registrar salida</Button>
            </Stack>
          </Stack>
          {message && <Alert severity={message.ok ? 'success' : 'error'} sx={{ mt: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}
        </CardContent>
      </Card>
      <Dialog open={!!expired} onClose={() => setExpired(null)}>
        <DialogTitle>Membresía sin pagar</DialogTitle>
        <DialogContent>
          <DialogContentText>{expired}. ¿Qué quieres hacer?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setExpired(null)}>Cancelar</Button>
          <Button color="inherit" onClick={() => run('in', true)}>Dejar pasar</Button>
          {can('PAGOS') && (
            <Button variant="contained" onClick={() => navigate(`/pagos/nuevo?userId=${target?.id ?? user?.id}`)}>Cobrar</Button>
          )}
        </DialogActions>
      </Dialog>
      <CatalogTable
        rows={rows}
        rowKey={(a) => a.id}
        searchText={manager ? (a) => a.userName : undefined}
        empty="Sin registros en los últimos 30 días"
        columns={[
          { label: 'Usuario', render: (a) => <Typography variant="body2" fontWeight={500}>{a.userName}</Typography> },
          { label: 'Entrada', render: (a) => fmt(a.checkInAt) },
          { label: 'Salida', render: (a) => (a.checkOutAt ? fmt(a.checkOutAt) : '—'), hideOnMobile: true },
          { label: 'Duración', render: duration },
        ]}
      />
    </>
  );
}

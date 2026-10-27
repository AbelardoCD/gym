import { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid2 as Grid, InputAdornment, TextField,
} from '@mui/material';
import { api, errorMessage, type MeasurementBody } from '../api/client';
import { MEASURES, type MeasureKey } from '../api/types';
import { isoDay } from './billingFormat';

interface Props {
  open: boolean;
  userId: number;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY = Object.fromEntries(MEASURES.map((m) => [m.key, ''])) as Record<MeasureKey, string>;

/** Captura de una toma de medidas; todos los campos son opcionales salvo la fecha. */
export default function MeasurementDialog({ open, userId, onClose, onSaved }: Props) {
  const [day, setDay] = useState(isoDay(new Date()));
  const [values, setValues] = useState(EMPTY);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDay(isoDay(new Date()));
    setValues(EMPTY);
    setNotes('');
    setError('');
  }, [open]);

  async function save() {
    const body: MeasurementBody = { measuredOn: day, notes: notes || undefined };
    for (const m of MEASURES) {
      const v = values[m.key].replace(',', '.').trim();
      body[m.key] = v ? Number(v) : null;
    }
    if (MEASURES.every((m) => body[m.key] == null)) {
      setError('Captura al menos una medida');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.addMeasurement(userId, body);
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar medidas</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}>
            <TextField
              sx={{ width: { xs: '100%', sm: 220 } }}
              label="Fecha"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          {MEASURES.map((m) => (
            <Grid key={m.key} size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                label={m.label}
                value={values[m.key]}
                onChange={(e) => setValues({ ...values, [m.key]: e.target.value })}
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: { endAdornment: <InputAdornment position="end">{m.unit}</InputAdornment> },
                }}
              />
            </Grid>
          ))}
          <Grid size={12}>
            <TextField fullWidth multiline minRows={2} label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={busy}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

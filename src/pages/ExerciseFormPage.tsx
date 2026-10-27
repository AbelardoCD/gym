import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { api, errorMessage, type ExerciseBody } from '../api/client';
import { MUSCLE_LABEL, type MuscleGroup } from '../api/types';
import ConfirmButton from '../components/ConfirmButton';
import PageHeader from '../components/PageHeader';

const EMPTY: ExerciseBody = { name: '', muscleGroup: 'PECHO', active: true };

/** Alta y edición de un ejercicio del catálogo. */
export default function ExerciseFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState<ExerciseBody>(EMPTY);
  const [uses, setUses] = useState(0);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.exercise(id)
      .then((e) => {
        setForm({ name: e.name, muscleGroup: e.muscleGroup, active: e.active });
        setUses(e.uses);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoaded(true));
  }, [id]);

  const set = (patch: Partial<ExerciseBody>) => setForm((f) => ({ ...f, ...patch }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.saveExercise(id, form);
      navigate('/ejercicios');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <>
      <PageHeader
        back="/ejercicios"
        title={id ? form.name : 'Nuevo ejercicio'}
        subtitle={id ? `Se usa en ${uses} ${uses === 1 ? 'rutina' : 'rutinas'}` : 'Queda disponible para todas las rutinas'}
        actions={id && (
          <ConfirmButton
            label="Eliminar"
            startIcon={<DeleteOutline />}
            title="¿Eliminar el ejercicio?"
            message={uses > 0 ? 'Lo usan rutinas, así que no se puede borrar. Desactívalo para que ya no se ofrezca.' : 'Esta acción no se puede deshacer.'}
            onConfirm={async () => {
              try {
                await api.deleteExercise(id);
                navigate('/ejercicios');
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          />
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={save} sx={{ maxWidth: 560 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <TextField label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} required autoFocus={!id} />
            <TextField select label="Grupo" value={form.muscleGroup} onChange={(e) => set({ muscleGroup: e.target.value as MuscleGroup })}>
              {(Object.keys(MUSCLE_LABEL) as MuscleGroup[]).map((g) => <MenuItem key={g} value={g}>{MUSCLE_LABEL[g]}</MenuItem>)}
            </TextField>
            {id && (
              <FormControlLabel
                control={<Switch checked={form.active} onChange={(e) => set({ active: e.target.checked })} />}
                label={form.active ? 'Activo: aparece al armar rutinas' : 'Inactivo: ya no se ofrece en rutinas nuevas'}
              />
            )}
            <Box>
              <Button type="submit" variant="contained" disabled={busy}>{id ? 'Guardar cambios' : 'Crear ejercicio'}</Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { api, errorMessage } from '../api/client';
import { DAY_LABEL, MUSCLE_LABEL, todayDay, type MuscleGroup, type Routine, type RoutineExercise } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import DisciplineChip from '../components/DisciplineChip';
import FileList from '../components/FileList';
import PageHeader from '../components/PageHeader';
import { groupByMuscle } from '../components/RoutineExercisesEditor';

/** Los ejercicios del día, separados por la parte del cuerpo que trabajan. */
function byMuscle(exercises: RoutineExercise[]) {
  const groups: { group: MuscleGroup; items: (RoutineExercise & { n: number })[] }[] = [];
  groupByMuscle(exercises).forEach((e, i) => {
    const last = groups[groups.length - 1];
    if (last?.group === e.muscleGroup) last.items.push({ ...e, n: i + 1 });
    else groups.push({ group: e.muscleGroup, items: [{ ...e, n: i + 1 }] });
  });
  return groups;
}

/** Detalle de solo lectura de una rutina asignada. */
export default function MyRoutinePage() {
  const id = Number(useParams().id);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [error, setError] = useState('');
  const [day, setDay] = useState<number | null>(null);

  useEffect(() => {
    api.routine(id).then((r) => {
      setRoutine(r);
      // Abre en el día de hoy si la rutina lo tiene; si no, en el primero.
      const today = todayDay();
      setDay(r.days.some((d) => d.dayOfWeek === today) ? today : r.days[0]?.dayOfWeek ?? null);
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!routine) return null;
  const current = routine.days.find((d) => d.dayOfWeek === day);

  return (
    <>
      <PageHeader
        back="/"
        title={routine.name}
        subtitle={`Entrenador: ${routine.trainer.fullName}`}
        actions={<DisciplineChip discipline={routine.discipline} />}
      />
      {routine.description && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Indicaciones</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{routine.description}</Typography>
          </CardContent>
        </Card>
      )}
      {current && (
        <Card sx={{ mb: 2 }}>
          <Tabs
            value={day}
            onChange={(_, d: number) => setDay(d)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
          >
            {routine.days.map((d) => (
              <Tab
                key={d.dayOfWeek}
                value={d.dayOfWeek}
                label={d.dayOfWeek === todayDay() ? `${DAY_LABEL[d.dayOfWeek]} · hoy` : DAY_LABEL[d.dayOfWeek]}
                sx={{ minHeight: 44, textTransform: 'none', minWidth: 0, px: 2 }}
              />
            ))}
          </Tabs>
          {(current.description || current.exercises.length > 0) && (
            <CardContent sx={{ pb: current.exercises.length ? 0 : undefined }}>
              {current.exercises.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: current.description ? 0.5 : 0 }}>
                  Trabajas: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {byMuscle(current.exercises).map((g) => MUSCLE_LABEL[g.group]).join(' · ')}
                  </Box>
                </Typography>
              )}
              {current.description && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{current.description}</Typography>
              )}
            </CardContent>
          )}
          {current.exercises.length > 0 && (
            <Stack spacing={2} sx={{ p: 2 }}>
              {byMuscle(current.exercises).map((g) => (
                <Box key={g.group}>
                  <Typography variant="overline" sx={{ display: 'block', fontWeight: 600, letterSpacing: '.08em', mb: 0.5 }}>
                    {MUSCLE_LABEL[g.group]}
                  </Typography>
                  <CatalogTable
                    rows={g.items}
                    rowKey={(e) => e.n}
                    columns={[
                      { label: '#', render: (e) => <Typography variant="body2" color="text.secondary">{e.n}</Typography>, width: 40 },
                      { label: 'Ejercicio', render: (e) => <Typography variant="body2" fontWeight={600}>{e.name}</Typography> },
                      { label: 'Series', render: (e) => e.sets ?? '—', align: 'right' },
                      { label: 'Reps', render: (e) => e.reps ?? '—', align: 'right' },
                      { label: 'Notas', render: (e) => e.notes ?? '', hideOnMobile: true },
                    ]}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      )}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="subtitle2">Material</Typography>
        </CardContent>
        {routine.files.length === 0
          ? <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>Esta rutina no tiene archivos.</Typography>
          : <FileList files={routine.files} />}
      </Card>
    </>
  );
}

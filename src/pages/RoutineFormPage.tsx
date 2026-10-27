import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, FormControl, FormLabel, Grid2 as Grid, LinearProgress, Menu, MenuItem,
  Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { api, errorMessage } from '../api/client';
import { DAY_LABEL, DAYS, DISCIPLINE_LABEL, type Discipline, type Exercise, type Routine, type User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import ConfirmButton from '../components/ConfirmButton';
import { DisciplineIcon } from '../components/DisciplineChip';
import FileList from '../components/FileList';
import PageHeader from '../components/PageHeader';
import RoutineExercisesEditor, { groupByMuscle, type ExerciseRow } from '../components/RoutineExercisesEditor';

const ACCEPT = 'video/*,image/*,.pdf,.xls,.xlsx,.csv';

interface DayDraft {
  description: string;
  rows: ExerciseRow[];
}

type DayDrafts = Record<number, DayDraft>;

const EMPTY_DAY: DayDraft = { description: '', rows: [] };
const hasContent = (d?: DayDraft) => !!d && (d.rows.length > 0 || d.description.trim() !== '');

/** Alta y edición de una rutina. Los archivos se suben una vez guardada. */
export default function RoutineFormPage() {
  const params = useParams();
  const isNew = !params.id;
  const id = isNew ? null : Number(params.id);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('GYM');
  const [members, setMembers] = useState<User[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [days, setDays] = useState<DayDrafts>({});
  const [day, setDay] = useState(1);
  const [copyMenu, setCopyMenu] = useState<HTMLElement | null>(null);
  const current = days[day] ?? EMPTY_DAY;
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Solo se ofrecen los socios del tipo de la rutina (los ya asignados se conservan).
  const options = users.filter((u) => u.disciplines.includes(discipline) || members.some((m) => m.id === u.id));

  function changeDiscipline(d: Discipline) {
    setDiscipline(d);
    setMembers((list) => list.filter((u) => u.disciplines.includes(d)));
  }

  const canEdit = isNew || (!!routine && (isAdmin || routine.trainer.id === user?.id));

  useEffect(() => {
    api.listUsers().then((list) => setUsers(list.filter((u) => u.active)));
    api.exercises().then(setCatalog);
  }, []);

  useEffect(() => {
    if (!id) return;
    api.routine(id).then((r) => {
      setRoutine(r);
      setName(r.name);
      setDescription(r.description ?? '');
      setDiscipline(r.discipline);
      setDays(Object.fromEntries(r.days.map((d) => [d.dayOfWeek, {
        description: d.description ?? '',
        rows: groupByMuscle(d.exercises).map((e) => ({
          exerciseId: e.exerciseId, name: e.name, muscleGroup: e.muscleGroup,
          sets: e.sets?.toString() ?? '', reps: e.reps ?? '', notes: e.notes ?? '',
        })),
      }])));
      if (r.days.length) setDay(r.days[0].dayOfWeek);
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  // Cuando llegan ambos datos, traduce los miembros de la rutina a objetos de la lista.
  useEffect(() => {
    if (routine && users.length) setMembers(users.filter((u) => routine.members.some((m) => m.id === u.id)));
  }, [routine, users]);

  const updateDay = (patch: Partial<DayDraft>) => setDays((all) => ({ ...all, [day]: { ...(all[day] ?? EMPTY_DAY), ...patch } }));

  /** Copia el día abierto a otro (reemplaza lo que tuviera) y abre el destino. */
  function copyTo(target: number) {
    setDays((all) => ({ ...all, [target]: { description: current.description, rows: current.rows.map((r) => ({ ...r })) } }));
    setDay(target);
    setCopyMenu(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setBusy(true);
    try {
      const body = {
        name, description, discipline, memberIds: members.map((m) => m.id),
        days: DAYS.filter((d) => hasContent(days[d])).map((d) => ({
          dayOfWeek: d,
          description: days[d].description,
          exercises: days[d].rows.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets ? Number(e.sets) : null, reps: e.reps, notes: e.notes })),
        })),
      };
      if (isNew) {
        const r = await api.createRoutine(body);
        navigate(`/rutinas/${r.id}`, { replace: true });
      } else {
        setRoutine(await api.updateRoutine(id!, body));
        setSaved(true);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || !id) return;
    setError('');
    try {
      for (const f of Array.from(files)) await api.uploadFile(id, f, setProgress);
      setRoutine(await api.routine(id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProgress(null);
    }
  }

  async function removeFile(fileId: number) {
    await api.deleteFile(id!, fileId);
    setRoutine(await api.routine(id!));
  }

  if (!isNew && !routine) return error ? <Alert severity="error">{error}</Alert> : null;

  return (
    <>
      <PageHeader
        back="/rutinas"
        title={isNew ? 'Nueva rutina' : routine!.name}
        subtitle={isNew ? 'Después de guardarla podrás subir videos, PDF, Excel y fotos' : `Entrenador: ${routine!.trainer.fullName}`}
        actions={!isNew && canEdit && (
          <ConfirmButton
            label="Eliminar"
            startIcon={<DeleteOutline />}
            title="¿Eliminar la rutina?"
            message="Se borrarán también todos sus archivos. Esta acción no se puede deshacer."
            onConfirm={async () => { await api.deleteRoutine(id!); navigate('/rutinas'); }}
          />
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>Cambios guardados</Alert>}
      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>Solo el entrenador que creó la rutina puede modificarla.</Alert>}

      <Grid container spacing={2} component="form" onSubmit={save}>
        <Grid size={{ xs: 12, md: isNew ? 12 : 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">Datos de la rutina</Typography>
                <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required disabled={!canEdit} />
                <FormControl>
                  <FormLabel sx={{ fontSize: 13, mb: 0.75 }}>Tipo de rutina</FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={discipline}
                    disabled={!canEdit}
                    onChange={(_, v: Discipline | null) => v && changeDiscipline(v)}
                  >
                    {(['GYM', 'CROSSFIT'] as Discipline[]).map((d) => (
                      <ToggleButton key={d} value={d} sx={{ px: 2.5, gap: 1, textTransform: 'none' }}>
                        <DisciplineIcon discipline={d} fontSize="small" />
                        {DISCIPLINE_LABEL[d]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </FormControl>
                <TextField label="Indicaciones generales (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={4} disabled={!canEdit} />
                <Autocomplete
                  multiple
                  disabled={!canEdit}
                  options={options}
                  value={members}
                  onChange={(_, v) => setMembers(v)}
                  getOptionLabel={(u) => u.fullName}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderOption={(props, u) => (
                    <li {...props} key={u.id}>
                      <Box>
                        <Typography variant="body2">{u.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                      </Box>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((u, i) => <Chip {...getTagProps({ index: i })} key={u.id} size="small" label={u.fullName} />)
                  }
                  renderInput={(p) => (
                    <TextField {...p} label="Asignar a" placeholder="Buscar socio" helperText={`Solo aparecen los socios de ${DISCIPLINE_LABEL[discipline]}`} />
                  )}
                  noOptionsText={`No hay socios de ${DISCIPLINE_LABEL[discipline]}`}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {!isNew && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="subtitle2">Material ({routine!.files.length})</Typography>
                {canEdit && (
                  <Button component="label" size="small" variant="outlined" startIcon={<UploadFileOutlined />}>
                    Subir
                    <input hidden type="file" multiple accept={ACCEPT} onChange={(e) => upload(e.target.files)} />
                  </Button>
                )}
              </CardContent>
              {progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mx: 2, mb: 1 }} />}
              {routine!.files.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                  Sube videos, PDF, Excel o fotos.
                </Typography>
              ) : (
                <FileList files={routine!.files} onDelete={canEdit ? (f) => removeFile(f.id) : undefined} />
              )}
            </Card>
          </Grid>
        )}

        <Grid size={12}>
          <Card>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2">Plan por día</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Elige el día, la parte del cuerpo y sus ejercicios. Los días vacíos no se muestran al socio.
                  </Typography>
                </Box>
                {canEdit && hasContent(current) && (
                  <>
                    <Button size="small" color="inherit" startIcon={<ContentCopyOutlined />} onClick={(e) => setCopyMenu(e.currentTarget)} sx={{ flexShrink: 0 }}>
                      Copiar a…
                    </Button>
                    <Menu anchorEl={copyMenu} open={!!copyMenu} onClose={() => setCopyMenu(null)}>
                      {DAYS.filter((d) => d !== day).map((d) => (
                        <MenuItem key={d} onClick={() => copyTo(d)}>
                          {DAY_LABEL[d]}
                          {hasContent(days[d]) && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(se reemplaza)</Typography>}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Stack>
            </CardContent>
            <Tabs
              value={day}
              onChange={(_, d: number) => setDay(d)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ px: 1, borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
            >
              {DAYS.map((d) => {
                const n = days[d]?.rows.length ?? 0;
                return (
                  <Tab
                    key={d}
                    value={d}
                    sx={{ minHeight: 44, textTransform: 'none', minWidth: 0, px: 2 }}
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <span>{DAY_LABEL[d]}</span>
                        {hasContent(days[d]) && (
                          <Box
                            component="span"
                            sx={{ fontSize: 11, lineHeight: '18px', minWidth: 18, px: 0.5, borderRadius: 9, bgcolor: 'action.selected', color: 'text.primary' }}
                          >
                            {n || '•'}
                          </Box>
                        )}
                      </Stack>
                    }
                  />
                );
              })}
            </Tabs>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label={`Descripción del ${DAY_LABEL[day].toLowerCase()} (opcional)`}
                  placeholder="Ej. Cuádriceps y glúteo, calentar 10 minutos en caminadora"
                  value={current.description}
                  onChange={(e) => updateDay({ description: e.target.value.slice(0, 4000) })}
                  multiline
                  minRows={2}
                  disabled={!canEdit}
                />
                <RoutineExercisesEditor key={day} catalog={catalog} rows={current.rows} onChange={(rows) => updateDay({ rows })} disabled={!canEdit} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {canEdit && (
          <Grid size={12}>
            <Button type="submit" variant="contained" disabled={busy}>{isNew ? 'Crear rutina' : 'Guardar cambios'}</Button>
          </Grid>
        )}
      </Grid>
    </>
  );
}

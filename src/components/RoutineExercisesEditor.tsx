import { useState } from 'react';
import {
  Autocomplete, Box, Checkbox, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlined from '@mui/icons-material/ArrowUpwardOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { MUSCLE_LABEL, type Exercise, type MuscleGroup } from '../api/types';

/** Fila editable: series y repeticiones como texto mientras se escriben. */
export interface ExerciseRow {
  exerciseId: number;
  name: string;
  muscleGroup: MuscleGroup;
  sets: string;
  reps: string;
  notes: string;
}

interface Props {
  catalog: Exercise[];
  rows: ExerciseRow[];
  onChange: (rows: ExerciseRow[]) => void;
  disabled?: boolean;
}

const GROUP_ORDER = Object.keys(MUSCLE_LABEL) as MuscleGroup[];

/**
 * Junta los ejercicios de la misma parte del cuerpo, conservando el orden en que aparece cada parte
 * y el orden de los ejercicios dentro de ella.
 */
export function groupByMuscle<T extends { muscleGroup: MuscleGroup }>(rows: T[]): T[] {
  const order: MuscleGroup[] = [];
  rows.forEach((r) => { if (!order.includes(r.muscleGroup)) order.push(r.muscleGroup); });
  return order.flatMap((g) => rows.filter((r) => r.muscleGroup === g));
}

/**
 * Arma los ejercicios de un día por parte del cuerpo: primero se elige la parte de una lista
 * (Pecho, Bíceps, Cuádriceps…) y después sus ejercicios del catálogo, con su orden, series y repeticiones.
 */
export default function RoutineExercisesEditor({ catalog, rows, onChange, disabled }: Props) {
  // Partes elegidas que todavía no tienen ejercicios; las que ya tienen salen de las filas.
  const [pending, setPending] = useState<MuscleGroup[]>([]);
  const groups = [...new Set([...rows.map((r) => r.muscleGroup), ...pending])];
  const free = GROUP_ORDER.filter((g) => !groups.includes(g));
  const selectedIds = new Set(rows.map((r) => r.exerciseId));

  /** Reemplaza los ejercicios de una parte, conservando el orden de las demás. */
  function pick(group: MuscleGroup, list: Exercise[]) {
    const ids = new Set(list.map((e) => e.id));
    const kept = rows.filter((r) => r.muscleGroup === group && ids.has(r.exerciseId));
    const added = list
      .filter((e) => !selectedIds.has(e.id))
      .map((e) => ({ exerciseId: e.id, name: e.name, muscleGroup: e.muscleGroup, sets: '', reps: '', notes: '' }));
    onChange(groups.flatMap((g) => (g === group ? [...kept, ...added] : rows.filter((r) => r.muscleGroup === g))));
  }

  function removeGroup(group: MuscleGroup) {
    setPending((list) => list.filter((g) => g !== group));
    onChange(rows.filter((r) => r.muscleGroup !== group));
  }

  const update = (i: number, patch: Partial<ExerciseRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function move(i: number, delta: number) {
    const next = [...rows];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  }

  return (
    <Stack spacing={2}>
      {groups.map((group) => {
        const label = MUSCLE_LABEL[group];
        // Los inactivos no se ofrecen, salvo que la rutina ya los tenga.
        const options = catalog
          .filter((e) => e.muscleGroup === group && (e.active || selectedIds.has(e.id)))
          .sort((a, b) => a.name.localeCompare(b.name));
        const selected = options.filter((e) => selectedIds.has(e.id));
        return (
          <Box key={group} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ px: 1.5, py: 0.75, alignItems: 'center', bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}
            >
              <Typography variant="overline" sx={{ lineHeight: 1.6, fontWeight: 600, letterSpacing: '.08em' }}>{label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                {selected.length} {selected.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Typography>
              {!disabled && (
                <Tooltip title={`Quitar ${label.toLowerCase()}`}>
                  <IconButton size="small" aria-label={`Quitar ${label}`} onClick={() => removeGroup(group)}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {!disabled && (
              <Box sx={{ p: 1.5 }}>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  size="small"
                  options={options}
                  value={selected}
                  onChange={(_, v) => pick(group, v)}
                  getOptionLabel={(e) => e.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderTags={() => null}
                  renderOption={({ key, ...props }, e, { selected: checked }) => (
                    <li key={key} {...props}>
                      <Checkbox size="small" checked={checked} sx={{ mr: 1, p: 0.5 }} />
                      {e.name}
                    </li>
                  )}
                  renderInput={(p) => (
                    <TextField {...p} label={`Ejercicios de ${label.toLowerCase()}`} placeholder={selected.length ? 'Agregar o quitar…' : 'Elegir de la lista…'} />
                  )}
                  noOptionsText="No hay ejercicios con ese nombre"
                />
              </Box>
            )}
            {rows.map((r, i) => {
              if (r.muscleGroup !== group) return null;
              const up = i > 0 && rows[i - 1].muscleGroup === group;
              const down = i < rows.length - 1 && rows[i + 1].muscleGroup === group;
              const remove = () => onChange(rows.filter((_, j) => j !== i));
              return (
                <Stack
                  key={r.exerciseId}
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  sx={{ p: 1.5, alignItems: { md: 'center' }, borderTop: disabled && !up ? 0 : 1, borderColor: 'divider' }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 20, textAlign: 'right' }}>{i + 1}</Typography>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0, flex: 1 }}>{r.name}</Typography>
                    {!disabled && (
                      <Stack direction="row" sx={{ display: { md: 'none' } }}>
                        <RowActions up={up} down={down} i={i} move={move} remove={remove} />
                      </Stack>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pl: { xs: 4.5, md: 0 } }}>
                    <TextField
                      size="small" label="Series" value={r.sets} disabled={disabled}
                      onChange={(e) => update(i, { sets: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                      slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                      sx={{ width: 76 }}
                    />
                    <TextField
                      size="small" label="Reps" value={r.reps} disabled={disabled} placeholder="8-10"
                      onChange={(e) => update(i, { reps: e.target.value.slice(0, 30) })}
                      sx={{ width: 96 }}
                    />
                    <TextField
                      size="small" label="Notas" value={r.notes} disabled={disabled}
                      onChange={(e) => update(i, { notes: e.target.value.slice(0, 255) })}
                      sx={{ flex: 1, minWidth: { md: 160 } }}
                    />
                    {!disabled && (
                      <Stack direction="row" sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <RowActions up={up} down={down} i={i} move={move} remove={remove} />
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              );
            })}
          </Box>
        );
      })}

      {!disabled && free.length > 0 && (
        <TextField
          select
          size="small"
          label={groups.length ? 'Agregar otra parte del cuerpo' : 'Parte del cuerpo a trabajar'}
          value=""
          onChange={(e) => setPending((list) => [...list, e.target.value as MuscleGroup])}
          helperText={groups.length ? undefined : 'Elige la parte y después sus ejercicios'}
          sx={{ maxWidth: { sm: 320 } }}
        >
          {free.map((g) => <MenuItem key={g} value={g}>{MUSCLE_LABEL[g]}</MenuItem>)}
        </TextField>
      )}
      {disabled && groups.length === 0 && (
        <Typography variant="body2" color="text.secondary">Este día no tiene ejercicios.</Typography>
      )}
    </Stack>
  );
}

/** Subir y bajar solo mueven dentro de la misma parte del cuerpo. */
function RowActions({ i, up, down, move, remove }: { i: number; up: boolean; down: boolean; move: (i: number, d: number) => void; remove: () => void }) {
  return (
    <>
      <Tooltip title="Subir">
        <span><IconButton size="small" aria-label="Subir" disabled={!up} onClick={() => move(i, -1)}><ArrowUpwardOutlined fontSize="small" /></IconButton></span>
      </Tooltip>
      <Tooltip title="Bajar">
        <span><IconButton size="small" aria-label="Bajar" disabled={!down} onClick={() => move(i, 1)}><ArrowDownwardOutlined fontSize="small" /></IconButton></span>
      </Tooltip>
      <Tooltip title="Quitar">
        <IconButton size="small" aria-label="Quitar" onClick={remove}><CloseOutlined fontSize="small" /></IconButton>
      </Tooltip>
    </>
  );
}

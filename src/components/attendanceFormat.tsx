import { Typography } from '@mui/material';
import type { Attendance } from '../api/types';

export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { timeStyle: 'short' });

/** Duración de la visita. La salida es opcional, así que sin ella no hay duración. */
export function duration(a: Attendance) {
  if (!a.checkOutAt) return <Typography variant="body2" color="text.secondary">Sin salida</Typography>;
  const min = Math.round((Date.parse(a.checkOutAt) - Date.parse(a.checkInAt)) / 60000);
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

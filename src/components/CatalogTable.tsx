import { useMemo, useState, type ReactNode } from 'react';
import {
  Box, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  /** Oculta la columna en pantallas pequeñas. */
  hideOnMobile?: boolean;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  /** Texto con el que se filtra cada fila desde el buscador. */
  searchText?: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: string;
  loading?: boolean;
}

/** Tabla de catálogo con buscador; al hacer clic en una fila se abre su detalle. */
export default function CatalogTable<T>({ rows, columns, rowKey, searchText, onRowClick, empty = 'Sin registros', loading }: Props<T>) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return !term || !searchText ? rows : rows.filter((r) => searchText(r).toLowerCase().includes(term));
  }, [rows, q, searchText]);
  const mobile = { display: { xs: 'none', md: 'table-cell' } };

  return (
    <Paper variant="outlined">
      {searchText && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ maxWidth: 320 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
          />
        </Box>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label} align={c.align} sx={{ width: c.width, ...(c.hideOnMobile ? mobile : {}) }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={rowKey(r)} hover={!!onRowClick} onClick={() => onRowClick?.(r)} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map((c) => (
                  <TableCell key={c.label} align={c.align} sx={c.hideOnMobile ? mobile : undefined}>{c.render(r)}</TableCell>
                ))}
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    {loading ? 'Cargando…' : empty}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

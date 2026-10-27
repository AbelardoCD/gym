import { useState } from 'react';
import {
  Box, Dialog, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import MovieOutlined from '@mui/icons-material/MovieOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { fileUrl } from '../api/client';
import type { FileType, RoutineFile } from '../api/types';

const ICONS: Record<FileType, JSX.Element> = {
  VIDEO: <MovieOutlined />,
  PDF: <PictureAsPdfOutlined />,
  EXCEL: <TableChartOutlined />,
  IMAGEN: <ImageOutlined />,
};

const LABELS: Record<FileType, string> = { VIDEO: 'Video', PDF: 'PDF', EXCEL: 'Excel', IMAGEN: 'Foto' };

const size = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function Preview({ file }: { file: RoutineFile }) {
  const url = fileUrl(file);
  const media = { width: '100%', maxHeight: '75vh', borderRadius: 8, display: 'block' };
  if (file.fileType === 'VIDEO') return <video src={url} controls autoPlay style={{ ...media, background: '#000' }} />;
  if (file.fileType === 'IMAGEN') return <img src={url} alt={file.originalName} style={{ ...media, objectFit: 'contain' }} />;
  return <iframe src={url} title={file.originalName} style={{ ...media, height: '75vh', border: 0 }} />;
}

/** Lista de archivos de una rutina. Videos, fotos y PDF se abren en un visor; Excel se descarga. */
export default function FileList({ files, onDelete }: { files: RoutineFile[]; onDelete?: (f: RoutineFile) => void }) {
  const [open, setOpen] = useState<RoutineFile | null>(null);

  return (
    <>
      <List disablePadding>
        {files.map((f) => (
          <ListItem
            key={f.id}
            disablePadding
            divider
            secondaryAction={
              <Box>
                <Tooltip title="Descargar">
                  <IconButton component="a" href={fileUrl(f)} download={f.originalName} size="small"><DownloadOutlined fontSize="small" /></IconButton>
                </Tooltip>
                {onDelete && (
                  <Tooltip title="Quitar">
                    <IconButton size="small" onClick={() => onDelete(f)}><DeleteOutline fontSize="small" /></IconButton>
                  </Tooltip>
                )}
              </Box>
            }
          >
            <ListItemButton
              onClick={() => (f.fileType === 'EXCEL' ? window.open(fileUrl(f), '_blank') : setOpen(f))}
              sx={{ pr: onDelete ? 12 : 7, borderRadius: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{ICONS[f.fileType]}</ListItemIcon>
              <ListItemText
                primary={f.originalName}
                secondary={`${LABELS[f.fileType]} · ${size(f.sizeBytes)}`}
                primaryTypographyProps={{ noWrap: true, fontSize: 14 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="lg" fullWidth>
        {open && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              {open.originalName}
              <IconButton onClick={() => setOpen(null)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseOutlined /></IconButton>
            </DialogTitle>
            <DialogContent><Preview file={open} /></DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}

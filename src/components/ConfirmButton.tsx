import { useState, type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface Props {
  label: string;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  startIcon?: ReactNode;
}

/** Botón de acción destructiva que pide confirmación. */
export default function ConfirmButton({ label, title, message, onConfirm, startIcon }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="error" variant="outlined" startIcon={startIcon} onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={async () => { setOpen(false); await onConfirm(); }}>{label}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

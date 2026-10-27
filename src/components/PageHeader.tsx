import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';

interface Props {
  title: string;
  subtitle?: string;
  /** Ruta a la que regresa la flecha (pantallas de detalle). */
  back?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, back, actions }: Props) {
  const navigate = useNavigate();
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
      <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
        {back && (
          <IconButton onClick={() => navigate(back)} sx={{ ml: -1 }}>
            <ArrowBackOutlined />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" noWrap>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Stack>
      {actions && <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>{actions}</Stack>}
    </Stack>
  );
}

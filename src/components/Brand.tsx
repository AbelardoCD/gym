import { Box, Stack, Typography } from '@mui/material';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';

/** Logotipo: ícono en un cuadro claro y el nombre del gimnasio. */
export default function Brand({ size = 32 }: { size?: number }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: size, height: size, borderRadius: 2, display: 'grid', placeItems: 'center',
          bgcolor: 'primary.main', color: 'primary.contrastText',
        }}
      >
        <FitnessCenterOutlined sx={{ fontSize: size * 0.6 }} />
      </Box>
      <Typography variant="h6" sx={{ fontSize: size * 0.5, letterSpacing: '-0.01em' }}>Gimnasio</Typography>
    </Stack>
  );
}

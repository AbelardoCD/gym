import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Brand from './Brand';
import { tones } from '../theme';

const FEATURES = [
  { icon: <FitnessCenterOutlined fontSize="small" />, text: 'Tus rutinas con videos, PDF y fotos' },
  { icon: <EventAvailableOutlined fontSize="small" />, text: 'Registro de asistencia al instante' },
  { icon: <ChatBubbleOutlineOutlined fontSize="small" />, text: 'Chat directo con tu entrenador' },
];

/** Panel decorativo: degradado carbón con una retícula tenue y el mensaje de bienvenida. */
function Showcase() {
  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
        justifyContent: 'space-between', p: 6, borderRight: `1px solid ${tones.border}`,
        background: `radial-gradient(120% 80% at 0% 0%, #26262c 0%, ${tones.canvas} 60%)`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `linear-gradient(${tones.border} 1px, transparent 1px), linear-gradient(90deg, ${tones.border} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(70% 60% at 30% 30%, #000 0%, transparent 100%)',
        }}
      />
      <Box sx={{ position: 'relative' }}><Brand size={36} /></Box>
      <Box sx={{ position: 'relative', maxWidth: 460 }}>
        <Typography variant="h3" sx={{ fontSize: { md: 44, lg: 52 }, lineHeight: 1.05, mb: 2 }}>
          Entrena.<br />Registra.<br /><Box component="span" sx={{ color: 'text.secondary' }}>Avanza.</Box>
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 380 }}>
          Todo tu gimnasio en un solo lugar: rutinas, asistencia y comunicación con tu equipo.
        </Typography>
        <Stack spacing={1.5}>
          {FEATURES.map((f) => (
            <Stack key={f.text} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: tones.raised, border: `1px solid ${tones.border}`, color: 'text.secondary' }}>
                {f.icon}
              </Box>
              <Typography variant="body2">{f.text}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ position: 'relative' }}>© {new Date().getFullYear()} Gimnasio</Typography>
    </Box>
  );
}

/** Pantallas de acceso (login, recuperar contraseña): panel decorativo a la izquierda y el formulario a la derecha. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' } }}>
      <Showcase />
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, sm: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box sx={{ display: { md: 'none' }, mb: 5 }}><Brand size={36} /></Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

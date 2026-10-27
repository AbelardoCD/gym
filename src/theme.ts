import { createTheme } from '@mui/material/styles';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Tema oscuro neutro: carbón y grises, con texto claro como acento. Sin colores saturados.
export const tones = {
  canvas: '#0e0e10', // fondo general
  surface: '#16161a', // tarjetas, tablas, menú
  raised: '#1e1e23', // encabezados de tabla, avatares, burbujas
  hover: '#232328',
  border: '#2a2a30',
  text: '#ededef',
  muted: '#9a9aa3',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: tones.text, contrastText: '#111113' },
    secondary: { main: tones.muted },
    success: { main: '#8fb59a' },
    error: { main: '#d08a82' },
    warning: { main: '#c9a56b' },
    info: { main: '#93a3b3' },
    background: { default: tones.canvas, paper: tones.surface },
    text: { primary: tones.text, secondary: tones.muted },
    divider: tones.border,
    action: { hover: tones.hover, selected: tones.raised },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.03em' },
    h4: { fontWeight: 600, fontSize: '1.6rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: tones.canvas }, '::selection': { background: '#3a3a42' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, paddingInline: 16 }, outlined: { borderColor: tones.border } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: tones.border } },
    },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: tones.canvas, '& .MuiOutlinedInput-notchedOutline': { borderColor: tones.border },
          '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: '#4a4a52' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 }, filled: { backgroundColor: tones.raised } } },
    MuiAvatar: { styleOverrides: { colorDefault: { backgroundColor: tones.raised, color: tones.text } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: tones.border },
        head: { color: tones.muted, fontWeight: 500, fontSize: '0.8rem', backgroundColor: tones.raised },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: tones.hover } } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
          '&.Mui-selected': { backgroundColor: tones.raised, '&:hover': { backgroundColor: tones.hover } },
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { border: `1px solid ${tones.border}` } } },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { '&.Mui-checked + .MuiSwitch-track': { opacity: 0.9 } },
      },
    },
  },
});

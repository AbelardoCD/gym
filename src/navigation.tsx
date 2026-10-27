import type { ReactElement } from 'react';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PeopleOutlineOutlined from '@mui/icons-material/PeopleOutlineOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import SellOutlined from '@mui/icons-material/SellOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import MonitorWeightOutlined from '@mui/icons-material/MonitorWeightOutlined';
import type { PermissionCode } from './api/types';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactElement;
  /** Basta con tener uno de estos permisos para ver la pantalla. */
  permissions: PermissionCode[];
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', icon: <HomeOutlined />, permissions: ['INICIO'] },
  { path: '/rutinas', label: 'Rutinas', icon: <FitnessCenterOutlined />, permissions: ['RUTINAS'] },
  { path: '/ejercicios', label: 'Ejercicios', icon: <ListAltOutlined />, permissions: ['RUTINAS'] },
  { path: '/progreso', label: 'Progreso', icon: <MonitorWeightOutlined />, permissions: ['PROGRESO'] },
  { path: '/asistencia', label: 'Asistencia', icon: <EventAvailableOutlined />, permissions: ['ASISTENCIA', 'ASISTENCIA_GESTION'] },
  { path: '/chat', label: 'Chat', icon: <ChatBubbleOutlineOutlined />, permissions: ['CHAT'] },
  { path: '/pagos', label: 'Pagos', icon: <PaymentsOutlined />, permissions: ['PAGOS'] },
  { path: '/membresias', label: 'Membresías', icon: <SellOutlined />, permissions: ['MEMBRESIAS'] },
  { path: '/reportes', label: 'Reportes', icon: <InsightsOutlined />, permissions: ['REPORTES'] },
  { path: '/usuarios', label: 'Usuarios', icon: <PeopleOutlineOutlined />, permissions: ['USUARIOS'] },
  { path: '/roles', label: 'Roles y permisos', icon: <AdminPanelSettingsOutlined />, permissions: ['ROLES'] },
];

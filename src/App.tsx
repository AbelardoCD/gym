import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { PermissionCode } from './api/types';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import { NAV_ITEMS } from './navigation';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import MyRoutinePage from './pages/MyRoutinePage';
import RoutinesPage from './pages/RoutinesPage';
import RoutineFormPage from './pages/RoutineFormPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';
import RolesPage from './pages/RolesPage';
import RoleFormPage from './pages/RoleFormPage';
import AttendancePage from './pages/AttendancePage';
import ChatPage from './pages/ChatPage';
import PaymentsPage from './pages/PaymentsPage';
import PaymentFormPage from './pages/PaymentFormPage';
import PaymentDetailPage from './pages/PaymentDetailPage';
import PlansPage from './pages/PlansPage';
import PlanFormPage from './pages/PlanFormPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import ExercisesPage from './pages/ExercisesPage';
import ExerciseFormPage from './pages/ExerciseFormPage';
import ProgressPage from './pages/ProgressPage';

function RequireLogin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress size={28} /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Muestra la pantalla solo si alguno de los roles del usuario tiene el permiso; si no, lo lleva a la primera que sí puede ver. */
function Allow({ perms, children }: { perms: PermissionCode[]; children: ReactNode }) {
  const { can } = useAuth();
  if (can(...perms)) return <>{children}</>;
  const first = NAV_ITEMS.find((i) => can(...i.permissions) && !i.permissions.some((p) => perms.includes(p)));
  return first ? <Navigate to={first.path} replace /> : <Box sx={{ p: 4 }}>Tu rol no tiene pantallas asignadas. Habla con el administrador.</Box>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />
      <Route element={<RequireLogin><Layout /></RequireLogin>}>
        <Route index element={<Allow perms={['INICIO']}><HomePage /></Allow>} />
        <Route path="/mis-rutinas/:id" element={<Allow perms={['INICIO']}><MyRoutinePage /></Allow>} />
        <Route path="/rutinas" element={<Allow perms={['RUTINAS']}><RoutinesPage /></Allow>} />
        <Route path="/rutinas/nueva" element={<Allow perms={['RUTINAS']}><RoutineFormPage /></Allow>} />
        <Route path="/rutinas/:id" element={<Allow perms={['RUTINAS']}><RoutineFormPage /></Allow>} />
        <Route path="/usuarios" element={<Allow perms={['USUARIOS']}><UsersPage /></Allow>} />
        <Route path="/usuarios/nuevo" element={<Allow perms={['USUARIOS']}><UserFormPage /></Allow>} />
        <Route path="/usuarios/:id" element={<Allow perms={['USUARIOS']}><UserFormPage /></Allow>} />
        <Route path="/roles" element={<Allow perms={['ROLES']}><RolesPage /></Allow>} />
        <Route path="/roles/nuevo" element={<Allow perms={['ROLES']}><RoleFormPage /></Allow>} />
        <Route path="/roles/:id" element={<Allow perms={['ROLES']}><RoleFormPage /></Allow>} />
        <Route path="/asistencia" element={<Allow perms={['ASISTENCIA', 'ASISTENCIA_GESTION']}><AttendancePage /></Allow>} />
        <Route path="/pagos" element={<Allow perms={['PAGOS']}><PaymentsPage /></Allow>} />
        <Route path="/pagos/nuevo" element={<Allow perms={['PAGOS']}><PaymentFormPage /></Allow>} />
        <Route path="/pagos/:id" element={<Allow perms={['PAGOS']}><PaymentDetailPage /></Allow>} />
        <Route path="/membresias" element={<Allow perms={['MEMBRESIAS']}><PlansPage /></Allow>} />
        <Route path="/membresias/nueva" element={<Allow perms={['MEMBRESIAS']}><PlanFormPage /></Allow>} />
        <Route path="/membresias/:id" element={<Allow perms={['MEMBRESIAS']}><PlanFormPage /></Allow>} />
        <Route path="/ejercicios" element={<Allow perms={['RUTINAS']}><ExercisesPage /></Allow>} />
        <Route path="/ejercicios/nuevo" element={<Allow perms={['RUTINAS']}><ExerciseFormPage /></Allow>} />
        <Route path="/ejercicios/:id" element={<Allow perms={['RUTINAS']}><ExerciseFormPage /></Allow>} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/progreso" element={<Allow perms={['PROGRESO']}><ProgressPage /></Allow>} />
        <Route path="/progreso/:id" element={<Allow perms={['PROGRESO', 'USUARIOS']}><ProfilePage /></Allow>} />
        <Route path="/reportes" element={<Allow perms={['REPORTES']}><ReportsPage /></Allow>} />
        <Route path="/chat" element={<Allow perms={['CHAT']}><ChatPage /></Allow>} />
        <Route path="/chat/:conversationId" element={<Allow perms={['CHAT']}><ChatPage /></Allow>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

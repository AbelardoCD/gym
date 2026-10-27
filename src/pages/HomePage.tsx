import { useAuth } from '../auth/AuthContext';
import AdminHome from './home/AdminHome';
import MemberHome from './home/MemberHome';

/** El administrador ve la asistencia; los demás, sus rutinas asignadas. */
export default function HomePage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminHome /> : <MemberHome />;
}

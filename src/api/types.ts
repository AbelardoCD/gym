// Tipos compartidos con el backend. En la etapa 2 esta carpeta se puede mover a un
// paquete común para reutilizarla desde React Native sin cambios.
/** Nombre de un rol de la tabla roles. */
export type Role = 'ADMINISTRADOR' | 'ENTRENADOR' | 'SOCIO' | (string & {});

/** Código de una pantalla (tabla permissions). */
export type PermissionCode = 'INICIO' | 'RUTINAS' | 'ASISTENCIA' | 'ASISTENCIA_GESTION' | 'CHAT' | 'USUARIOS' | 'ROLES' | 'PAGOS' | 'MEMBRESIAS' | 'REPORTES' | 'PROGRESO';

export interface Permission {
  id: number;
  code: PermissionCode;
  name: string;
  description?: string;
}

export interface RoleInfo {
  id: number;
  name: Role;
  description?: string;
  permissions: PermissionCode[];
  users: number;
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ENTRENADOR: 'Entrenador',
  SOCIO: 'Socio',
};

export function roleLabel(name: Role): string {
  return ROLE_LABELS[name] ?? name.charAt(0) + name.slice(1).toLowerCase().replace(/_/g, ' ');
}

export const rolesLabel = (roles: Role[]) => roles.map(roleLabel).join(', ');

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  roles: Role[];
  permissions: PermissionCode[];
  /** Subroles del socio: Gym, CrossFit o ambos. */
  disciplines: Discipline[];
  /** Fecha de inscripción (yyyy-mm-dd). */
  enrolledOn: string;
  active: boolean;
  createdAt: string;
  /** Cambia con cada foto nueva; null si no tiene foto. */
  photoVersion?: string | null;
}

export interface UserSummary {
  id: number;
  fullName: string;
  roles: Role[];
}

export type FileType = 'VIDEO' | 'PDF' | 'EXCEL' | 'IMAGEN';

export interface RoutineFile {
  id: number;
  fileType: FileType;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
}

export type Discipline = 'GYM' | 'CROSSFIT';

export const DISCIPLINE_LABEL: Record<Discipline, string> = { GYM: 'Gym', CROSSFIT: 'CrossFit' };

export type MuscleGroup =
  | 'PECHO' | 'ESPALDA' | 'HOMBRO' | 'BICEP' | 'TRICEP' | 'ANTEBRAZO'
  | 'CUADRICEPS' | 'FEMORAL' | 'GLUTEO' | 'PANTORRILLA' | 'CORE' | 'FUNCIONAL' | 'CARDIO';

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  PECHO: 'Pecho', ESPALDA: 'Espalda', HOMBRO: 'Hombro', BICEP: 'Bíceps', TRICEP: 'Tríceps', ANTEBRAZO: 'Antebrazo',
  CUADRICEPS: 'Cuádriceps', FEMORAL: 'Femoral', GLUTEO: 'Glúteo', PANTORRILLA: 'Pantorrilla', CORE: 'Core',
  FUNCIONAL: 'CrossFit y funcional', CARDIO: 'Cardio',
};

export interface Exercise {
  id: number;
  name: string;
  muscleGroup: MuscleGroup;
  active: boolean;
  /** En cuántas rutinas se usa. */
  uses: number;
}

/** Un ejercicio dentro de una rutina. reps es texto libre: "12", "8-10", "30 s". */
export interface RoutineExercise {
  exerciseId: number;
  name: string;
  muscleGroup: MuscleGroup;
  sets?: number | null;
  reps?: string | null;
  notes?: string | null;
}

/** 1 = lunes ... 7 = domingo. */
export const DAY_LABEL: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};
export const DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Día de hoy en la numeración de la rutina (JavaScript cuenta el domingo como 0). */
export const todayDay = () => new Date().getDay() || 7;

export interface RoutineDay {
  dayOfWeek: number;
  description?: string | null;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  discipline: Discipline;
  trainer: UserSummary;
  members: UserSummary[];
  /** Solo los días con ejercicios o descripción, de lunes a domingo. */
  days: RoutineDay[];
  files: RoutineFile[];
  createdAt: string;
}

export const exerciseCount = (r: Routine) => r.days.reduce((n, d) => n + d.exercises.length, 0);

export interface Attendance {
  id: number;
  userId: number;
  userName: string;
  checkInAt: string;
  checkOutAt?: string;
}

export interface ScanResult {
  /** YA_REGISTRADA: ya había entrado hoy; no se duplica. */
  action: 'ENTRADA' | 'YA_REGISTRADA';
  attendance: Attendance;
  /** Solo para socios. */
  membership?: MembershipStatus;
  photoVersion?: string | null;
}

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  roles: Role[];
  disciplines: Discipline[];
  enrolledOn: string;
  birthDate?: string | null;
  photoVersion?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  medicalNotes?: string | null;
}

export type MeasureKey = 'weightKg' | 'heightCm' | 'bodyFatPct' | 'waistCm' | 'chestCm' | 'hipCm' | 'armCm' | 'thighCm';

export const MEASURES: { key: MeasureKey; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'heightCm', label: 'Estatura', unit: 'cm' },
  { key: 'bodyFatPct', label: 'Grasa corporal', unit: '%' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm' },
  { key: 'chestCm', label: 'Pecho', unit: 'cm' },
  { key: 'hipCm', label: 'Cadera', unit: 'cm' },
  { key: 'armCm', label: 'Brazo', unit: 'cm' },
  { key: 'thighCm', label: 'Pierna', unit: 'cm' },
];

export type Measurement = { id: number; measuredOn: string; bmi?: number | null; notes?: string | null; registeredBy?: string | null }
  & Partial<Record<MeasureKey, number | null>>;

export interface ProgressRow {
  userId: number;
  fullName: string;
  disciplines: Discipline[];
  photoVersion?: string | null;
  lastMeasuredOn?: string | null;
  lastWeightKg?: number | null;
}

export type ChatRequestStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface ChatRequest {
  id: number;
  sender: UserSummary;
  receiver: UserSummary;
  status: ChatRequestStatus;
  createdAt: string;
  conversationId?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface Conversation {
  id: number;
  contact: UserSummary;
  lastMessage?: Message;
  unread: number;
}

export type ChatEvent =
  | { type: 'MENSAJE'; payload: Message }
  | { type: 'LEIDO'; payload: number }
  | { type: 'SOLICITUD_RECIBIDA' | 'SOLICITUD_ACEPTADA' | 'SOLICITUD_RECHAZADA'; payload: ChatRequest };

export type PlanAccess = 'GYM' | 'CROSSFIT' | 'AMBOS';
export type PlanPeriod = 'DIA' | 'SEMANA' | 'MES' | 'ANIO';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type MembershipState = 'VIGENTE' | 'POR_VENCER' | 'VENCIDA' | 'SIN_PAGOS';

export const ACCESS_LABEL: Record<PlanAccess, string> = { GYM: 'Gym', CROSSFIT: 'CrossFit', AMBOS: 'Gym y CrossFit' };
export const PERIOD_LABEL: Record<PlanPeriod, string> = { DIA: 'Día', SEMANA: 'Semana', MES: 'Mes', ANIO: 'Año' };
export const PERIOD_PLURAL: Record<PlanPeriod, string> = { DIA: 'días', SEMANA: 'semanas', MES: 'meses', ANIO: 'años' };
export const METHOD_LABEL: Record<PaymentMethod, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' };

export interface MembershipPlan {
  id: number;
  name: string;
  access: PlanAccess;
  period: PlanPeriod;
  price: number;
  active: boolean;
  /** Pagos hechos con esta membresía. */
  payments: number;
}

export interface MembershipStatus {
  userId: number;
  enrolledOn: string;
  paidUntil?: string;
  state: MembershipState;
  /** Días que faltan; negativo si ya venció. */
  daysLeft?: number;
}

export interface Payment {
  id: number;
  userId: number;
  userName: string;
  planId?: number;
  planName: string;
  period: PlanPeriod;
  quantity: number;
  amount: number;
  method: PaymentMethod;
  coversFrom: string;
  coversTo: string;
  notes?: string;
  registeredBy: string;
  paidAt: string;
}

export interface PaymentPreview {
  coversFrom: string;
  coversTo: string;
  amount: number;
  status: MembershipStatus;
}

export interface ReportSummary {
  income: number;
  payments: number;
  visits: number;
  newMembers: number;
  members: { vigentes: number; porVencer: number; vencidas: number; sinPagos: number };
  incomeByMonth: { label: string; value: number }[];
  incomeByMethod: { label: PaymentMethod; value: number }[];
  incomeByPlan: { plan: string; payments: number; total: number }[];
  visitsByHour: { label: string; value: number }[];
  visitsByWeekday: { label: string; value: number }[];
  enrollmentsByMonth: { label: string; value: number }[];
}

export type ExportKind = 'pagos' | 'asistencia' | 'socios';

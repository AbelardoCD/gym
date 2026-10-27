import axios from 'axios';
import type {
  Attendance, ChatRequest, Conversation, Discipline, MembershipPlan, MembershipStatus, Message, Payment, PaymentMethod, PaymentPreview,
  Permission, PlanAccess, PlanPeriod, ExportKind, ReportSummary, PermissionCode, ScanResult, Exercise, MuscleGroup, Profile, Measurement, MeasureKey, ProgressRow, Role, RoleInfo, Routine, RoutineFile, User, UserSummary,
} from './types';

export interface PlanBody {
  name: string;
  access: PlanAccess;
  period: PlanPeriod;
  price: number;
  active: boolean;
}

export interface PaymentBody {
  userId: number;
  planId: number;
  quantity: number;
  coversFrom?: string;
  amount?: number;
  method: PaymentMethod;
  notes?: string;
}

export interface RoutineBody {
  name: string;
  description?: string;
  discipline: Discipline;
  memberIds: number[];
  days: {
    dayOfWeek: number;
    description?: string;
    exercises: { exerciseId: number; sets?: number | null; reps?: string; notes?: string }[];
  }[];
}

export interface ExerciseBody {
  name: string;
  muscleGroup: MuscleGroup;
  active: boolean;
}

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const TOKEN_KEY = 'gym.token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const http = axios.create({ baseURL: `${API_URL}/api` });

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Código de error del backend (por ejemplo MEMBRESIA_VENCIDA), si lo trae. */
export function errorCode(e: unknown): string | undefined {
  return axios.isAxiosError(e) ? e.response?.data?.code ?? undefined : undefined;
}

/** Dato extra que el backend adjunta a un error (por ejemplo el userId de una membresía vencida). */
export function errorField(e: unknown, key: string): string | undefined {
  return axios.isAxiosError(e) ? e.response?.data?.fields?.[key] ?? undefined : undefined;
}

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) return e.response?.data?.message ?? e.message;
  return String(e);
}

/** URL directa de un archivo (para <video>, <img> o descargar), con el token como parámetro. */
export function fileUrl(file: RoutineFile): string {
  return `${API_URL}${file.url}?token=${encodeURIComponent(tokenStore.get() ?? '')}`;
}

export interface ProfileBody {
  phone?: string;
  birthDate?: string | null;
  emergencyName?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
}

export type MeasurementBody = { measuredOn: string; notes?: string } & Partial<Record<MeasureKey, number | null>>;

/** URL de la foto de perfil, o undefined si no tiene. La versión evita mostrar una foto vieja desde caché. */
export function photoUrl(userId: number, version?: string | null): string | undefined {
  if (!version) return undefined;
  return `${API_URL}/api/profiles/${userId}/photo?v=${version}&token=${encodeURIComponent(tokenStore.get() ?? '')}`;
}

/** Descarga un archivo del backend con el nombre que manda el servidor. */
async function download(path: string, fallbackName: string, params?: object) {
  const r = await http.get<Blob>(path, { params, responseType: 'blob' });
  const name = /filename="?([^";]+)"?/.exec(r.headers['content-disposition'] ?? '')?.[1] ?? fallbackName;
  const url = URL.createObjectURL(r.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (email: string, password: string) =>
    http.post<{ token: string; user: User }>('/auth/login', { email, password }).then((r) => r.data),

  me: () => http.get<User>('/users/me').then((r) => r.data),
  listUsers: (role?: Role) => http.get<User[]>('/users', { params: { role } }).then((r) => r.data),
  createUser: (body: { email: string; password: string; fullName: string; phone?: string; roles: Role[]; disciplines: Discipline[]; enrolledOn?: string }) =>
    http.post<User>('/users', body).then((r) => r.data),
  updateUser: (id: number, body: { fullName: string; phone?: string; roles: Role[]; disciplines: Discipline[]; enrolledOn?: string; active: boolean; password?: string }) =>
    http.put<User>(`/users/${id}`, body).then((r) => r.data),
  user: (id: number) => http.get<User>(`/users/${id}`).then((r) => r.data),

  permissions: () => http.get<Permission[]>('/permissions').then((r) => r.data),
  roles: () => http.get<RoleInfo[]>('/roles').then((r) => r.data),
  role: (id: number) => http.get<RoleInfo>(`/roles/${id}`).then((r) => r.data),
  saveRole: (id: number | null, body: { name: string; description?: string; permissions: PermissionCode[] }) =>
    (id ? http.put<RoleInfo>(`/roles/${id}`, body) : http.post<RoleInfo>('/roles', body)).then((r) => r.data),
  deleteRole: (id: number) => http.delete(`/roles/${id}`),
  searchUsers: (q: string) => http.get<UserSummary[]>('/users/search', { params: { q } }).then((r) => r.data),

  routines: () => http.get<Routine[]>('/routines').then((r) => r.data),
  myRoutines: () => http.get<Routine[]>('/routines/mine').then((r) => r.data),
  routine: (id: number) => http.get<Routine>(`/routines/${id}`).then((r) => r.data),
  exercises: () => http.get<Exercise[]>('/exercises').then((r) => r.data),
  exercise: (id: number) => http.get<Exercise>(`/exercises/${id}`).then((r) => r.data),
  saveExercise: (id: number | null, body: ExerciseBody) =>
    (id ? http.put<Exercise>(`/exercises/${id}`, body) : http.post<Exercise>('/exercises', body)).then((r) => r.data),
  deleteExercise: (id: number) => http.delete(`/exercises/${id}`),

  createRoutine: (body: RoutineBody) =>
    http.post<Routine>('/routines', body).then((r) => r.data),
  updateRoutine: (id: number, body: RoutineBody) =>
    http.put<Routine>(`/routines/${id}`, body).then((r) => r.data),
  deleteRoutine: (id: number) => http.delete(`/routines/${id}`),
  uploadFile: (routineId: number, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return http
      .post<RoutineFile>(`/routines/${routineId}/files`, form, {
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
      .then((r) => r.data);
  },
  deleteFile: (routineId: number, fileId: number) => http.delete(`/routines/${routineId}/files/${fileId}`),

  forgotPassword: (email: string) => http.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => http.post('/auth/reset-password', { token, password }),
  runReminders: () => http.post<{ sent: number }>('/payments/reminders/run').then((r) => r.data),

  reportSummary: (params: { from: string; to: string }) => http.get<ReportSummary>('/reports/summary', { params }).then((r) => r.data),
  /** Descarga el Excel con el token en la cabecera y lo guarda con el nombre que manda el servidor. */
  exportExcel: (kind: ExportKind, params: { from: string; to: string }) =>
    download(`/reports/export/${kind}`, `${kind}.xlsx`, params),

  plans: () => http.get<MembershipPlan[]>('/plans').then((r) => r.data),
  plan: (id: number) => http.get<MembershipPlan>(`/plans/${id}`).then((r) => r.data),
  savePlan: (id: number | null, body: PlanBody) =>
    (id ? http.put<MembershipPlan>(`/plans/${id}`, body) : http.post<MembershipPlan>('/plans', body)).then((r) => r.data),
  deletePlan: (id: number) => http.delete(`/plans/${id}`),

  payments: (params: { userId?: number; from?: string; to?: string }) =>
    http.get<Payment[]>('/payments', { params }).then((r) => r.data),
  payment: (id: number) => http.get<Payment>(`/payments/${id}`).then((r) => r.data),
  paymentPreview: (params: { userId: number; planId: number; quantity: number; coversFrom?: string }) =>
    http.get<PaymentPreview>('/payments/preview', { params }).then((r) => r.data),
  registerPayment: (body: PaymentBody) => http.post<Payment>('/payments', body).then((r) => r.data),
  cancelPayment: (id: number) => http.delete(`/payments/${id}`),
  downloadReceipt: (id: number) => download(`/payments/${id}/receipt`, `recibo-${id}.pdf`),
  emailReceipt: (id: number) => http.post<{ sentTo: string }>(`/payments/${id}/receipt/email`).then((r) => r.data.sentTo),
  membershipStatuses: () => http.get<MembershipStatus[]>('/payments/status').then((r) => r.data),
  myPayments: () => http.get<{ status: MembershipStatus; payments: Payment[] }>('/payments/mine').then((r) => r.data),

  checkIn: (userId?: number, force = false) => http.post<Attendance>('/attendance/check-in', { userId, force }).then((r) => r.data),
  scan: (code: string, force = false) => http.post<ScanResult>('/attendance/scan', { code, force }).then((r) => r.data),
  myQr: () => http.get<{ code: string }>('/users/me/qr').then((r) => r.data.code),
  userQr: (id: number) => http.get<{ code: string }>(`/users/${id}/qr`).then((r) => r.data.code),
  regenerateQr: (id: number) => http.post<{ code: string }>(`/users/${id}/qr`).then((r) => r.data.code),
  profile: (id: number) => http.get<Profile>(`/profiles/${id}`).then((r) => r.data),
  updateProfile: (id: number, body: ProfileBody) => http.put<Profile>(`/profiles/${id}`, body).then((r) => r.data),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<Profile>(`/profiles/${id}/photo`, form).then((r) => r.data);
  },
  deletePhoto: (id: number) => http.delete<Profile>(`/profiles/${id}/photo`).then((r) => r.data),
  measurements: (id: number) => http.get<Measurement[]>(`/profiles/${id}/measurements`).then((r) => r.data),
  addMeasurement: (id: number, body: MeasurementBody) => http.post<Measurement>(`/profiles/${id}/measurements`, body).then((r) => r.data),
  deleteMeasurement: (id: number, measurementId: number) => http.delete(`/profiles/${id}/measurements/${measurementId}`),
  progress: () => http.get<ProgressRow[]>('/profiles').then((r) => r.data),
  checkOut: (userId?: number) => http.post<Attendance>('/attendance/check-out', { userId }).then((r) => r.data),
  attendance: (params: { userId?: number; from?: string; to?: string }) =>
    http.get<Attendance[]>('/attendance', { params }).then((r) => r.data),

  sendChatRequest: (receiverId: number) => http.post<ChatRequest>('/chat/requests', { receiverId }).then((r) => r.data),
  incomingRequests: () => http.get<ChatRequest[]>('/chat/requests/incoming').then((r) => r.data),
  outgoingRequests: () => http.get<ChatRequest[]>('/chat/requests/outgoing').then((r) => r.data),
  acceptRequest: (id: number) => http.post<ChatRequest>(`/chat/requests/${id}/accept`).then((r) => r.data),
  rejectRequest: (id: number) => http.post<ChatRequest>(`/chat/requests/${id}/reject`).then((r) => r.data),
  conversations: () => http.get<Conversation[]>('/chat/conversations').then((r) => r.data),
  messages: (conversationId: number, beforeId?: number) =>
    http.get<Message[]>(`/chat/conversations/${conversationId}/messages`, { params: { beforeId } }).then((r) => r.data),
  sendMessage: (conversationId: number, content: string) =>
    http.post<Message>(`/chat/conversations/${conversationId}/messages`, { content }).then((r) => r.data),
  markRead: (conversationId: number) => http.post(`/chat/conversations/${conversationId}/read`),
};

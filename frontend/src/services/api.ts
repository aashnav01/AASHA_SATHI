import axios from 'axios';

const AUTH_STORAGE_KEY = 'asha_sathi_auth';

export const API = axios.create({
  // Relative by default: the API is served from the same origin as the app,
  // so no build-time URL is needed. VITE_API_URL only matters if the frontend
  // is ever hosted separately from the API.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    const { token } = JSON.parse(raw) as { token: string };
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: 'asha' | 'supervisor' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const registerAsha = (name: string, mobile: string, pin: string) =>
  API.post<AuthResponse>('/auth/register', { name, mobile, pin }).then((r) => r.data);

export const loginAsha = (mobile: string, pin: string) =>
  API.post<AuthResponse>('/auth/login', { mobile, pin }).then((r) => r.data);

export const fetchMe = () =>
  API.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user);

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  location?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  is_recurring: boolean;
}

export const getTasks = (showCompleted = false) =>
  API.get<Task[]>(`/asha/tasks?show_completed=${showCompleted}`).then((r) => r.data);

export const createTask = (payload: Omit<Task, 'id' | 'completed'>) =>
  API.post<Task>('/asha/tasks', payload).then((r) => r.data);

export const completeTask = (id: string) =>
  API.patch(`/asha/tasks/${id}`).then((r) => r.data);

// ── Panic ────────────────────────────────────────────────────────────────────

export const sendPanic = (location: { lat: number; lng: number }) =>
  API.post('/asha/panic', location).then((r) => r.data);

// ── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncPayload {
  anemia: Array<{
    symptoms: string[];
    foods_consumed: string[];
    advice_given: string;
    clientId?: string;
    clientTimestamp?: string;
  }>;
  ppd: Array<{
    epds_answers: number[];
    total_score: number;
    risk_level: string;
    referral_message: string;
    clientId?: string;
    clientTimestamp?: string;
  }>;
  alerts: Array<{
    location: { lat: number; lng: number };
    clientId?: string;
    clientTimestamp?: string;
  }>;
  referrals: Array<{
    patient_name: string;
    facility_id: string;
    status: string;
    checklist: { ifa_tablets: boolean; anc_card: boolean; aadhaar: boolean; cash: boolean };
    clientId?: string;
    clientTimestamp?: string;
  }>;
  incentives: Array<{
    task_id: string;
    task_name: string;
    category: string;
    amount_earned: number;
    date_completed: string;
    status: string;
    clientId?: string;
    clientTimestamp?: string;
  }>;
  wellness: Array<{
    date: string;
    mood: number;
    tiredness: number;
    supervisor_support: number;
    completed_visits: number;
    overall_score: number;
    clientId?: string;
    clientTimestamp?: string;
  }>;
  taskCompletions: Array<{
    task_id: string;
    task_name: string;
    category: string;
    completed_at: string;
    date: string;
    frequency: string;
    incentive_amount: number;
    clientId?: string;
    clientTimestamp?: string;
  }>;
}

export interface SyncResponse {
  inserted: Record<string, number>;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export const syncData = (payload: SyncPayload) =>
  API.post<SyncResponse>('/sync', payload).then((r) => r.data);

// ── Supervisor charts ─────────────────────────────────────────────────────────

export interface ChartsData {
  anemia: Array<{ date: string; count: number }>;
  ppd: Array<{ date: string; count: number }>;
  ppd_risk_distribution: Array<{ risk_level: string; count: number }>;
}

export const getChartsData = () =>
  API.get<ChartsData>('/supervisor/charts-data').then((r) => r.data);

// ── Symptom Check ─────────────────────────────────────────────────────────────

export interface SymptomCheckResult {
  results: Array<{ symptom: string; action: string; advice: string; urgency: string }>;
  overall_urgency: 'low' | 'medium' | 'high';
  summary: string;
}

export const checkSymptoms = (symptoms: string[], duration_days: number, spreading_rapidly: boolean) =>
  API.post<SymptomCheckResult>('/symptom-check', { symptoms, duration_days, spreading_rapidly }).then(
    (r) => r.data,
  );

// ── Pregnancy Risk ────────────────────────────────────────────────────────────

export interface PregnancyRiskResult {
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
  recommendations: string[];
}

export const assessPregnancyRisk = (data: {
  hemoglobin_g_dl: number;
  ppd_score: number;
  epds_q10_score: number;
  systolic_bp: number;
  diastolic_bp: number;
  gestational_age_weeks: number;
  has_bleeding: boolean;
  has_severe_headache: boolean;
  has_reduced_fetal_movement: boolean;
  has_fever: boolean;
  has_swelling: boolean;
}) => API.post<PregnancyRiskResult>('/pregnancy-risk', data).then((r) => r.data);

// ── Education ─────────────────────────────────────────────────────────────────

export interface EducationModule {
  id: number;
  title: string;
  category: string;
  type: 'video' | 'audio' | 'image' | 'text';
  youtube_id?: string;
  duration: string;
  color: string;
}

export const getEducationModules = () =>
  API.get<EducationModule[]>('/education').then((r) => r.data);

// ── PPD Analysis ──────────────────────────────────────────────────────────────

export interface PpdAnalysisResult {
  counseling_script: string;
  action_plan: string[];
  referral_summary: string;
}

export const getPpdGuidance = (data: { epds_answers: number[]; score: number; risk_level: string }) =>
  API.post<PpdAnalysisResult>('/ppd-analysis', data).then((r) => r.data);

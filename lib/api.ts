// ─── Config ───────────────────────────────────────────────────────────────────
// Change this to your LAN IP when testing on a physical device
// e.g. http://192.168.1.x:8000/api/v1
export const API_BASE = 'http://192.168.18.214:8000/api/v1';

// ─── Token Storage ────────────────────────────────────────────────────────────
// Uses @react-native-async-storage/async-storage when available,
// falls back to in-memory store during development before install.

const TOKEN_KEY = '@ai_lolos_token';

let _memToken: string | null = null;

async function getStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default ?? mod;
  } catch {
    // Package not installed yet — use memory fallback
    return {
      setItem: async (_: string, v: string) => { _memToken = v; },
      getItem: async (_: string) => _memToken,
      removeItem: async (_: string) => { _memToken = null; },
    };
  }
}

export const storeToken = async (token: string) => {
  _memToken = token;
  const s = await getStorage();
  await s.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  if (_memToken) return _memToken;
  const s = await getStorage();
  const t = await s.getItem(TOKEN_KEY);
  _memToken = t;
  return t;
};

export const clearToken = async () => {
  _memToken = null;
  const s = await getStorage();
  await s.removeItem(TOKEN_KEY);
};

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: object,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, json);
  }

  return json as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ token: string; user: User }> => {
    // Backend returns: { success, message, data: { user, token } }
    const res = await request<{ data: { token: string; user: User } }>(
      'POST', '/auth/register', payload, false
    );
    return res.data;
  },

  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    // Backend returns: { success, data: { user, token } }
    const res = await request<{ data: { token: string; user: User } }>(
      'POST', '/auth/login', { email, password }, false
    );
    return res.data;
  },

  me: () => request<{ data: User }>('GET', '/auth/me'),

  logout: () => request<void>('POST', '/auth/logout'),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingApi = {
  getKampus: (search?: string, size = 100) => {
    const qs = new URLSearchParams({ size: String(size) });
    if (search) qs.set('search', search);
    return request<{ data: Kampus[] }>('GET', `/kampus?${qs}`, undefined, false);
  },

  getJurusan: (kampusId: number) =>
    request<{ data: Jurusan[] }>('GET', `/kampus/${kampusId}/jurusan`, undefined, false),

  setTarget: (targets: { kampus_id: number; jurusan_id: number }[]) =>
    request('POST', '/onboarding/target', { targets }),

  saveReferral: (referral_source: string) =>
    request('POST', '/onboarding/referral', { referral_source }),

  complete: () => request('POST', '/onboarding/complete'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  index:  () => request<{ data: DashboardData }>('GET', '/dashboard'),
  streak: () => request<{ data: { streak: number } }>('GET', '/dashboard/streak'),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  tier: 'free' | 'premium' | 'daily_pass';
  onboarding_completed: boolean;
  diagnostic_completed: boolean;
  is_banned?: boolean;
  last_active?: string;
  // convenience
  is_premium?: boolean; // computed on frontend: tier === 'premium'
  subscription_tier?: string; // alias for tier
}

export interface Kampus {
  id: number;
  nama: string;
  akronim: string;
  kota: string;
  provinsi: string;
  logo_url?: string;
  jurusan_count?: number;
}

export interface Jurusan {
  id: number;
  nama: string;
  fakultas: string;
  passing_grade_estimate?: number;
  peminat_tahun_lalu?: number;
}

export interface DashboardData {
  total_soal_dijawab: number;
  rata_rata_skor: number;
  streak: number;
  mapel_progress: Array<{ mapel: string; skor: number }>;
}

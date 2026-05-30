// ─── Config ───────────────────────────────────────────────────────────────────
// Change this to your LAN IP when testing on a physical device
// e.g. http://192.168.1.x:8000/api/v1
export const API_BASE = 'http://10.106.215.35:8000/api/v1';

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

  updateProfile: (data: { name?: string; asal_sekolah?: string; referral_source?: string }) =>
    request('POST', '/user/profile', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  index:  () => request<{ data: DashboardData }>('GET', '/dashboard'),
  streak: () => request<{ data: { streak: number } }>('GET', '/dashboard/streak'),
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardApi = {
  index:  (periode: 'minggu' | 'bulan' | 'all' = 'minggu') =>
    request<{ data: any[] }>('GET', `/leaderboard?periode=${periode}`),
  myRank: () =>
    request<{ data: { rank: number; points: number; streak_days: number } }>('GET', '/leaderboard/me'),
};

// ─── Riwayat Latihan ──────────────────────────────────────────────────────────
export const riwayatApi = {
  list: (page = 1, perPage = 15) =>
    request<{ data: any[]; current_page: number; last_page: number; total: number }>(
      'GET', `/latihan/riwayat?per_page=${perPage}&page=${page}`
    ),
  review: (sesiId: number) =>
    request<{ data: any[]; summary: { total: number; benar: number; salah: number; dilewati: number } }>(
      'GET', `/latihan/${sesiId}/review`
    ),
};


// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'pengamat' | 'admin';
  tier: 'free' | 'premium' | 'daily_pass';
  onboarding_completed: boolean;
  diagnostic_completed: boolean;
  is_banned?: boolean;
  last_active?: string;
  asal_sekolah?: string | null;
  sekolah_id?: number | null;
  // convenience
  is_premium?: boolean;
  subscription_tier?: string;
}

// ─── Pengawas Types ───────────────────────────────────────────────────────────
export interface Sekolah {
  id: number;
  nama: string;
  slug: string;
  kota?: string;
  provinsi?: string;
  npsn?: string;
}

export interface PengawasOverview {
  sekolah: Sekolah;
  total_siswa: number;
  aktif_hari_ini: number;
  aktif_minggu_ini: number;
  tidak_aktif_7d: number;
  avg_snbt: number;
  sesi_minggu_ini: number;
  streak_bagus: number;
  tier_distribusi: Record<string, number>;
}

export interface SiswaListItem {
  id: number;
  name: string;
  email: string;
  tier: string;
  streak_days: number;
  points: number;
  last_active?: string;
  avatar_url?: string;
  total_sesi: number;
  avg_snbt: number;
  sesi_7d: number;
}

export interface SiswaDetail {
  siswa: SiswaListItem & { kampusTargets?: any[] };
  sesi_list: Array<{ id: number; tipe: string; skor_akhir: number; skor_raw: number; created_at: string }>;
  progres_mapel: Array<{ mapel: string; kode: string; total: number; benar: number; akurasi: number }>;
  kelemahan: Array<{ sub_materi: string; mapel: string; accuracy_rate: number; attempt_count: number }>;
}

export interface RankingSiswa extends SiswaListItem {
  rank: number;
}

export interface AktivitasHarian {
  tanggal: string;
  total_sesi: number;
  siswa_aktif: number;
  avg_snbt: number;
}

export interface KelemahanKelas {
  sub_materi_id: number;
  sub_materi: string;
  mapel: string;
  kode_mapel: string;
  jumlah_siswa: number;
  avg_akurasi: number;
  total_attempt: number;
  persen_siswa: number;
}

export interface AtRiskData {
  tidak_aktif: SiswaListItem[];
  akurasi_rendah: (SiswaListItem & { avg_akurasi: number })[];
  belum_latihan: SiswaListItem[];
}

export interface PengawasApprovalStatus {
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_registered';
  sekolah?: Sekolah;
  catatan?: string;
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

// ─── Pengawas API ─────────────────────────────────────────────────────────────
export const pengawasApi = {
  /** Register akun pengawas baru */
  register: (payload: { name: string; email: string; password: string; sekolah_id: number; jabatan?: string }) =>
    request<{ success: boolean; message: string }>('POST', '/pengamat/register', payload, false),

  /** Cek status approval setelah login */
  getStatus: () =>
    request<{ success: boolean; data: PengawasApprovalStatus }>('GET', '/pengamat/auth/status'),

  /** Profil pengawas */
  me: () =>
    request<{ success: boolean; data: User }>('GET', '/pengamat/me'),

  /** Ringkasan statistik sekolah */
  overview: () =>
    request<{ success: boolean; data: PengawasOverview }>('GET', '/pengamat/overview'),

  /** Daftar siswa (paginated, search, sort) */
  getSiswa: (params?: { search?: string; sort_by?: string; page?: number; per_page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search)  qs.set('search', params.search);
    if (params?.sort_by) qs.set('sort_by', params.sort_by);
    if (params?.page)    qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    return request<{ success: boolean; data: { data: SiswaListItem[]; current_page: number; last_page: number; total: number } }>(
      'GET', `/pengamat/siswa?${qs}`
    );
  },

  /** Detail 1 siswa */
  getSiswaDetail: (siswaId: number) =>
    request<{ success: boolean; data: SiswaDetail }>('GET', `/pengamat/siswa/${siswaId}`),

  /** Ranking siswa */
  getRanking: (periode: 'minggu' | 'bulan' | 'all' = 'minggu') =>
    request<{ success: boolean; data: RankingSiswa[]; periode: string }>('GET', `/pengamat/ranking?periode=${periode}`),

  /** Chart aktivitas harian */
  getAktivitasHarian: (hari: 7 | 14 | 30 = 7) =>
    request<{ success: boolean; data: AktivitasHarian[] }>('GET', `/pengamat/aktivitas-harian?hari=${hari}`),

  /** Kelemahan agregat kelas */
  getKelemahanKelas: () =>
    request<{ success: boolean; data: KelemahanKelas[]; total_siswa: number }>('GET', '/pengamat/kelemahan-kelas'),

  /** Siswa berisiko */
  getAtRisk: () =>
    request<{ success: boolean; data: AtRiskData; summary: Record<string, number> }>('GET', '/pengamat/at-risk'),

  /** Cari sekolah (untuk register) */
  searchSekolah: (q: string) =>
    request<{ success: boolean; data: Sekolah[] }>('GET', `/pengamat/sekolah?q=${encodeURIComponent(q)}`, undefined, false),
};

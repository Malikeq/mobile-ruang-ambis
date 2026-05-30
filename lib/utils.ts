// ─── lib/utils.ts ─────────────────────────────────────────────────────────────
// Shared utility functions — single source of truth.
// Import from here instead of duplicating logic per-screen.

// ─── Target Normalization ─────────────────────────────────────────────────────

export interface Target {
  kampusLabel: string;    // display name (akronim or nama)
  jurusanLabel: string;   // display name
  target_nilai: number;
  skor_saat_ini: number;
}

/** Raw API shape — backend may return nested objects OR flat strings */
interface TargetRaw {
  kampus:        any;  // string | { nama: string; akronim?: string }
  jurusan:       any;  // string | { nama: string; passing_grade_estimate?: number }
  target_nilai?: number;
  skor_saat_ini?: number;
  passing_grade_estimate?: number;
}

/**
 * Normalize raw API target response to a flat display shape.
 * This is the SINGLE SOURCE OF TRUTH — do not duplicate this logic.
 * Previously duplicated in index.tsx and profil.tsx with different signatures.
 */
export function normalizeTarget(raw: TargetRaw): Target {
  const k = raw.kampus;
  const j = raw.jurusan;
  return {
    kampusLabel:  typeof k === 'string' ? k : (k?.akronim || k?.nama || 'PTN'),
    jurusanLabel: typeof j === 'string' ? j : (j?.nama || 'Jurusan'),
    target_nilai:  raw.target_nilai ?? (typeof j === 'object' ? j?.passing_grade_estimate : 0) ?? 0,
    skor_saat_ini: raw.skor_saat_ini ?? 0,
  };
}

/**
 * Safe progress percentage — avoids divide-by-zero.
 * Returns 0 if target_nilai is 0 or falsy.
 */
export function targetProgress(skor: number, targetNilai: number): number {
  if (!targetNilai || targetNilai <= 0) return 0;
  return Math.min(100, Math.max(0, (skor / targetNilai) * 100));
}

// ─── SNBT Score ───────────────────────────────────────────────────────────────

/**
 * Convert accuracy (0-100) to SNBT scale (400-1000).
 * Use backend `skor_akhir` when available; this is the fallback formula.
 */
export function accuracyToSnbt(accuracy: number): number {
  return Math.round(400 + (accuracy / 100) * 600);
}

// ─── Date & Time ─────────────────────────────────────────────────────────────

/** Returns "Pagi", "Siang", "Sore", or "Malam" based on current hour */
export function greetByHour(): string {
  const h = new Date().getHours();
  return h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malam';
}

/** Format seconds to MM:SS string */
export function formatSeconds(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Days remaining until a given date (min 0) */
export function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

/** Format Date to YYYY-MM-DD string (for calendar comparisons) */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── String ───────────────────────────────────────────────────────────────────

/** Safe initial letter for avatar (always uppercase, never crashes) */
export function nameInitial(name?: string | null): string {
  return (name ?? 'U')[0].toUpperCase();
}

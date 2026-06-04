/**
 * useFeatures — hook to get current user's enabled features from their active package.
 *
 * Usage:
 *   const { features, can, limit } = useFeatures();
 *   if (!can('ai_tutor')) { ... }
 *   const maxSoal = limit('latihan_soal_per_sesi'); // -1 = unlimited
 */

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, getToken } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FeatureSet {
  ai_tutor:               boolean;
  ai_tanya_harian:        number;
  ai_photo_solve:         boolean;
  ai_foto_harian:         number;
  latihan_soal_per_sesi:  number;  // -1 = unlimited
  latihan_sesi_per_hari:  number;  // -1 = unlimited
  review_jawaban:         boolean;
  riwayat_latihan:        boolean;
  leaderboard:            boolean;
  analisis_kelemahan:     boolean;
  soal_adaptif:           boolean;
  tryout_penuh:           boolean;
  akses_semua_mapel:      boolean;
  export_hasil:           boolean;
  bonus_poin_streak:      boolean;
}

// Default for free users (offline / before API loads)
const FREE_DEFAULTS: FeatureSet = {
  ai_tutor:               false,
  ai_tanya_harian:        0,
  ai_photo_solve:         false,
  ai_foto_harian:         0,
  latihan_soal_per_sesi:  20,
  latihan_sesi_per_hari:  3,
  review_jawaban:         false,
  riwayat_latihan:        false,
  leaderboard:            true,
  analisis_kelemahan:     false,
  soal_adaptif:           false,
  tryout_penuh:           false,
  akses_semua_mapel:      false,
  export_hasil:           false,
  bonus_poin_streak:      false,
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

let _cache: FeatureSet | null = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFeatures() {
  const [features, setFeatures] = useState<FeatureSet>(_cache ?? FREE_DEFAULTS);
  const [loading, setLoading]   = useState(!_cache);

  const fetch = useCallback(async () => {
    // Use cache if fresh
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      setFeatures(_cache);
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) { setLoading(false); return; }

      const res  = await globalThis.fetch(`${API_BASE}/user/features`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const data = json?.data as FeatureSet;
      if (data) {
        _cache  = data;
        _cacheTs = Date.now();
        setFeatures(data);
      }
    } catch {
      // Keep defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /** Check if a boolean feature is enabled */
  const can = useCallback((key: keyof FeatureSet): boolean => {
    const v = features[key];
    return v === true || (typeof v === 'number' && v !== 0);
  }, [features]);

  /** Get numeric limit for a feature. -1 = unlimited. */
  const limit = useCallback((key: keyof FeatureSet): number => {
    return (features[key] as number) ?? 0;
  }, [features]);

  /** Invalidate cache (call after subscription purchase) */
  const invalidate = useCallback(() => {
    _cache  = null;
    _cacheTs = 0;
    setLoading(true);
    fetch();
  }, [fetch]);

  return { features, can, limit, loading, invalidate, refresh: fetch };
}

// ─── Standalone helper (outside React) ────────────────────────────────────────

export async function fetchUserFeatures(): Promise<FeatureSet> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;
  try {
    const token = await getToken();
    if (!token) return FREE_DEFAULTS;
    const res  = await globalThis.fetch(`${API_BASE}/user/features`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const json = await res.json();
    const data = json?.data as FeatureSet;
    if (data) { _cache = data; _cacheTs = Date.now(); }
    return data ?? FREE_DEFAULTS;
  } catch {
    return FREE_DEFAULTS;
  }
}

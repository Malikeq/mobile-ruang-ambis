import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/api';

/** Client-side limits — align with product; enforce server-side when endpoints exist */
export const LIMITS = {
  free: {
    sesiPerHari: 2,
    soalPerSesi: 20,
    aiChatPerHari: 5,
    fotoPerBulan: 3,
    riwayatHari: 30,
  },
  premium: {
    sesiPerHari: Infinity,
    soalPerSesi: 50,
    aiChatPerHari: Infinity,
    fotoPerBulan: Infinity,
    riwayatHari: Infinity,
  },
} as const;

export type Plan = 'free' | 'premium';

export interface UsageToday {
  sesiHariIni: number;
}

export interface FeatureFlags {
  plan: Plan;
  isPremium: boolean;
  canStartNewSesi: boolean;
  canUseAIChat: boolean;
  canUseFotoSoal: boolean;
  canDoMultiSesi: boolean;
  sesiRemainingToday: number;
  limits: typeof LIMITS.free | typeof LIMITS.premium;
  usage: UsageToday;
  refreshUsage: () => Promise<void>;
}

function isPaidTier(tier?: string): boolean {
  return tier === 'premium' || tier === 'daily_pass';
}

export function useFeatureFlags(): FeatureFlags {
  const { user, token } = useAuth();
  const [usage, setUsage] = useState<UsageToday>({ sesiHariIni: 0 });

  const isPremium = isPaidTier(user?.tier);
  const plan: Plan = isPremium ? 'premium' : 'free';
  const limits = isPremium ? LIMITS.premium : LIMITS.free;

  const refreshUsage = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      const sesi = Number(json?.data?.sesi_hari_ini ?? 0);
      setUsage({ sesiHariIni: Number.isFinite(sesi) ? sesi : 0 });
    } catch {
      /* keep last known */
    }
  }, [token]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const canDoMultiSesi = isPremium || usage.sesiHariIni < limits.sesiPerHari;
  const sesiRemainingToday = isPremium
    ? Infinity
    : Math.max(0, limits.sesiPerHari - usage.sesiHariIni);

  return {
    plan,
    isPremium,
    canStartNewSesi: canDoMultiSesi,
    canDoMultiSesi,
    canUseAIChat: isPremium,
    canUseFotoSoal: isPremium,
    sesiRemainingToday,
    limits,
    usage,
    refreshUsage,
  };
}

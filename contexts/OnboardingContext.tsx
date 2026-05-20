/**
 * OnboardingContext — stores all pre-registration onboarding data in memory.
 * Data flows:
 *   challenge.tsx  → setSekolah, setReferral
 *   university.tsx → setTargets
 *   register.tsx   → reads all, submits to API after register, then resets
 */
import React, { createContext, useContext, useState } from 'react';

export interface OnboardingTarget {
  kampus_id:     number;
  kampus_nama:   string;
  kampus_akronim:string;
  jurusan_id:    number | null;
  jurusan_nama:  string | null;
  passing_grade: number | null;
  priority:      number;
}

interface OnboardingState {
  referral:    string;
  sekolah:     string;
  targets:     OnboardingTarget[];
  setReferral: (v: string) => void;
  setSekolah:  (v: string) => void;
  setTargets:  (v: OnboardingTarget[]) => void;
  reset:       () => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [referral, setReferral] = useState('');
  const [sekolah,  setSekolah]  = useState('');
  const [targets,  setTargets]  = useState<OnboardingTarget[]>([]);

  const reset = () => { setReferral(''); setSekolah(''); setTargets([]); };

  return (
    <OnboardingContext.Provider value={{ referral, sekolah, targets, setReferral, setSekolah, setTargets, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}

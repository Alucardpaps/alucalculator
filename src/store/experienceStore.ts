'use client';

/**
 * AluCAD OS — Experience Mode Store (Professional vs Beginner)
 * 
 * Manages the global UX mode across all pages and calculators:
 * - 'professional': Complete engineering workstation with all technical variables,
 *                   formulas, 2D/3D CAD, assumptions, matrices, and standards.
 * - 'beginner':     Streamlined view focusing strictly on direct answers, 
 *                   minimal data, large clear metrics, and high clarity.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

export type ExperienceMode = 'professional' | 'beginner';

interface ExperienceState {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  toggleMode: () => void;
}

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set) => ({
      mode: 'professional',
      setMode: (_mode: ExperienceMode) => set({ mode: 'professional' }),
      toggleMode: () => set({ mode: 'professional' }),
    }),
    {
      name: 'alucalc-experience-mode',
    }
  )
);

/**
 * Hydration-safe React hook to consume experience mode without SSR mismatches.
 * Permanently locked to professional engineering mode.
 */
export function useExperienceMode() {
  return {
    mode: 'professional' as const,
    isBeginner: false,
    isProfessional: true,
    setMode: (_mode: ExperienceMode) => {},
    toggleMode: () => {},
    mounted: true,
  };
}

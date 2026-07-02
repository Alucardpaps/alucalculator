'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleType } from '@/config/modules';

export type MobileTab =
  | 'dashboard'
  | 'solvers'
  | 'academy'
  | 'cad'
  | 'fieldTools'
  | 'aegis'
  | 'settings';

export type MobileFontSize = 'small' | 'medium' | 'large';

export interface CalcHistoryEntry {
  id: string;
  moduleType: ModuleType | string;
  moduleTitle: string;
  timestamp: string;
  inputs?: Record<string, unknown>;
  result?: unknown;
}

interface MobileState {
  hasCompletedOnboarding: boolean;
  recentModules: ModuleType[];
  favoriteModules: ModuleType[];
  calcHistory: CalcHistoryEntry[];
  reduceMotion: boolean;
  biometricLockEnabled: boolean;
  biometricUnlocked: boolean;
  mobileFontSize: MobileFontSize;
  lastRefreshAt: number | null;
  soundEnabled: boolean;

  completeOnboarding: () => void;
  resetOnboarding: () => void;
  trackModuleOpen: (type: ModuleType, title?: string) => void;
  toggleFavorite: (type: ModuleType) => void;
  isFavorite: (type: ModuleType) => boolean;
  addCalcHistory: (entry: Omit<CalcHistoryEntry, 'id' | 'timestamp'>) => void;
  removeCalcHistory: (id: string) => void;
  clearCalcHistory: () => void;
  setReduceMotion: (v: boolean) => void;
  setBiometricLockEnabled: (v: boolean) => void;
  setBiometricUnlocked: (v: boolean) => void;
  setMobileFontSize: (size: MobileFontSize) => void;
  setSoundEnabled: (v: boolean) => void;
  markRefreshed: () => void;
}

const MAX_RECENT = 12;
const MAX_HISTORY = 50;

export const useMobileStore = create<MobileState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      recentModules: [],
      favoriteModules: [],
      calcHistory: [],
      reduceMotion: false,
      biometricLockEnabled: false,
      biometricUnlocked: true,
      mobileFontSize: 'medium',
      lastRefreshAt: null,
      soundEnabled: true,

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),

      trackModuleOpen: (type, title) => {
        set((s) => {
          const filtered = s.recentModules.filter((x) => x !== type);
          const recentModules = [type, ...filtered].slice(0, MAX_RECENT);

          const historyEntry: CalcHistoryEntry = {
            id: `${type}-${Date.now()}`,
            moduleType: type,
            moduleTitle: title ?? type,
            timestamp: new Date().toISOString(),
          };
          const calcHistory = [
            historyEntry,
            ...s.calcHistory.filter((h) => h.moduleType !== type || Date.now() - new Date(h.timestamp).getTime() > 5000),
          ].slice(0, MAX_HISTORY);

          return { recentModules, calcHistory };
        });
      },

      toggleFavorite: (type) => {
        set((s) => {
          const exists = s.favoriteModules.includes(type);
          return {
            favoriteModules: exists
              ? s.favoriteModules.filter((x) => x !== type)
              : [...s.favoriteModules, type],
          };
        });
      },

      isFavorite: (type) => get().favoriteModules.includes(type),

      addCalcHistory: (entry) => {
        set((s) => ({
          calcHistory: [
            {
              ...entry,
              id: `${entry.moduleType}-${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
            ...s.calcHistory,
          ].slice(0, MAX_HISTORY),
        }));
      },

      removeCalcHistory: (id) =>
        set((s) => ({ calcHistory: s.calcHistory.filter((h) => h.id !== id) })),

      clearCalcHistory: () => set({ calcHistory: [] }),

      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setBiometricLockEnabled: (biometricLockEnabled) =>
        set({ biometricLockEnabled, biometricUnlocked: !biometricLockEnabled }),
      setBiometricUnlocked: (biometricUnlocked) => set({ biometricUnlocked }),
      setMobileFontSize: (mobileFontSize) => set({ mobileFontSize }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      markRefreshed: () => set({ lastRefreshAt: Date.now() }),
    }),
    {
      name: 'alucalc-mobile-v2',
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        recentModules: s.recentModules,
        favoriteModules: s.favoriteModules,
        calcHistory: s.calcHistory,
        reduceMotion: s.reduceMotion,
        biometricLockEnabled: s.biometricLockEnabled,
        mobileFontSize: s.mobileFontSize,
        soundEnabled: s.soundEnabled,
      }),
    },
  ),
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LicensePlan = 'free' | 'pro' | 'team' | 'enterprise';

export interface UsageCounters {
  pdf: number;
  dxf: number;
  step: number;
  ai: number;
  day: string;
}

export const FREE_LIMITS = { pdf: 3, dxf: 1, step: 0, ai: 15 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyUsage(): UsageCounters {
  return { pdf: 0, dxf: 0, step: 0, ai: 0, day: todayKey() };
}

export interface LicenseState {
  plan: LicensePlan;
  licenseKey: string;
  usage: UsageCounters;
  isUpgradeModalOpen: boolean;
  upgradeModalFeature: 'pdf' | 'dxf' | 'step' | 'ai' | null;
  openUpgradeModal: (feature: 'pdf' | 'dxf' | 'step' | 'ai') => void;
  closeUpgradeModal: () => void;
  activate: (key: string) => { ok: boolean; message: string };
  clearLicense: () => void;
  canUse: (kind: keyof Omit<UsageCounters, 'day'>) => boolean;
  bump: (kind: keyof Omit<UsageCounters, 'day'>) => boolean;
  guardFeature: (kind: 'pdf' | 'dxf' | 'step' | 'ai') => boolean;
  limits: () => { pdf: number; dxf: number; step: number; ai: number };
}

function normalizeUsage(usage: UsageCounters): UsageCounters {
  if (usage.day !== todayKey()) return emptyUsage();
  return usage;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      licenseKey: '',
      usage: emptyUsage(),
      isUpgradeModalOpen: false,
      upgradeModalFeature: null,
      openUpgradeModal: (feature) => set({ isUpgradeModalOpen: true, upgradeModalFeature: feature }),
      closeUpgradeModal: () => set({ isUpgradeModalOpen: false, upgradeModalFeature: null }),
      limits: () => {
        const plan = get().plan;
        if (plan === 'free') return FREE_LIMITS;
        return { pdf: Infinity, dxf: Infinity, step: Infinity, ai: Infinity };
      },
      activate: (raw) => {
        const key = raw.trim().toUpperCase();
        if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3,5}$/.test(key) && !/^ALU-(PRO|TEAM|ENT)-[A-Z0-9]{8,}$/.test(key)) {
          return { ok: false, message: 'License key format is not recognized. Format: ALU-PRO-XXXXXXXX or XXXX-XXXX-XXXX-XXXX' };
        }
        let plan: LicensePlan = 'pro';
        if (key.includes('TEAM')) plan = 'team';
        if (key.includes('ENT')) plan = 'enterprise';
        set({ plan, licenseKey: key, isUpgradeModalOpen: false });
        return { ok: true, message: `Activated ${plan.toUpperCase()} plan successfully!` };
      },
      clearLicense: () => set({ plan: 'free', licenseKey: '' }),
      canUse: (kind) => {
        const usage = normalizeUsage(get().usage);
        const limits = get().limits();
        return usage[kind] < limits[kind];
      },
      bump: (kind) => {
        const usage = normalizeUsage(get().usage);
        const limits = get().limits();
        if (usage[kind] >= limits[kind]) return false;
        set({ usage: { ...usage, [kind]: usage[kind] + 1, day: todayKey() } });
        return true;
      },
      guardFeature: (kind) => {
        const allowed = get().bump(kind);
        if (!allowed) {
          get().openUpgradeModal(kind);
          return false;
        }
        return true;
      },
    }),
    {
      name: 'alucalc-license',
      partialize: (state) => ({
        plan: state.plan,
        licenseKey: state.licenseKey,
        usage: state.usage,
      }),
    },
  ),
);

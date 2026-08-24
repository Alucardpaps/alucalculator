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

const FREE_LIMITS = { pdf: 3, dxf: 1, step: 0, ai: 15 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyUsage(): UsageCounters {
  return { pdf: 0, dxf: 0, step: 0, ai: 0, day: todayKey() };
}

interface LicenseState {
  plan: LicensePlan;
  licenseKey: string;
  usage: UsageCounters;
  activate: (key: string) => { ok: boolean; message: string };
  clearLicense: () => void;
  bump: (kind: keyof Omit<UsageCounters, 'day'>) => boolean;
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
      limits: () => {
        const plan = get().plan;
        if (plan === 'free') return FREE_LIMITS;
        return { pdf: Infinity, dxf: Infinity, step: Infinity, ai: Infinity };
      },
      activate: (raw) => {
        const key = raw.trim().toUpperCase();
        if (!/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3,5}$/.test(key) && !/^ALU-(PRO|TEAM|ENT)-[A-Z0-9]{8,}$/.test(key)) {
          return { ok: false, message: 'License key format is not recognized.' };
        }
        let plan: LicensePlan = 'pro';
        if (key.includes('TEAM')) plan = 'team';
        if (key.includes('ENT')) plan = 'enterprise';
        set({ plan, licenseKey: key });
        return { ok: true, message: `Activated ${plan} plan.` };
      },
      clearLicense: () => set({ plan: 'free', licenseKey: '' }),
      bump: (kind) => {
        const usage = normalizeUsage(get().usage);
        const limits = get().limits();
        if (usage[kind] >= limits[kind]) return false;
        set({ usage: { ...usage, [kind]: usage[kind] + 1, day: todayKey() } });
        return true;
      },
    }),
    { name: 'alucalc-license' },
  ),
);

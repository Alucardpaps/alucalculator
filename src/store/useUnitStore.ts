/**
 * Global Unit Store using Zustand (Evolution Proposal implementation)
 * O(1) performance updates without triggering global re-renders.
 */
import { create } from 'zustand';

export type UnitSystem = 'Metric' | 'Imperial';

interface UnitState {
  system: UnitSystem;
  toggleSystem: () => void;
  setSystem: (system: UnitSystem) => void;
  
  // Helpers
  convertLength: (val: number, from: 'mm' | 'inch', to: 'mm' | 'inch') => number;
  convertForce: (val: number, from: 'N' | 'lbf', to: 'N' | 'lbf') => number;
  convertPressure: (val: number, from: 'MPa' | 'psi', to: 'MPa' | 'psi') => number;
}

export const useUnitStore = create<UnitState>((set) => ({
  system: 'Metric',
  toggleSystem: () => set((state) => ({ system: state.system === 'Metric' ? 'Imperial' : 'Metric' })),
  setSystem: (system) => set({ system }),

  convertLength: (val, from, to) => {
    if (from === to) return val;
    if (from === 'mm' && to === 'inch') return val / 25.4;
    return val * 25.4; // inch to mm
  },
  convertForce: (val, from, to) => {
    if (from === to) return val;
    if (from === 'N' && to === 'lbf') return val * 0.224808943;
    return val / 0.224808943; // lbf to N
  },
  convertPressure: (val, from, to) => {
    if (from === to) return val;
    if (from === 'MPa' && to === 'psi') return val * 145.037738;
    return val / 145.037738; // psi to MPa
  }
}));

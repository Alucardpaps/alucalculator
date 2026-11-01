'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SharedCutPart {
  id: string;
  label: string;
  length: number;
  qty: number;
  material?: string;
  crossSection?: string;
}

interface CutStoreState {
  pendingParts: SharedCutPart[];
  stockLength: number;
  kerf: number;
  setPendingParts: (parts: SharedCutPart[]) => void;
  addPendingParts: (parts: SharedCutPart[]) => void;
  clearPendingParts: () => void;
}

export const useCutStore = create<CutStoreState>()(
  persist(
    (set) => ({
      pendingParts: [],
      stockLength: 6000,
      kerf: 4,
      setPendingParts: (parts) => set({ pendingParts: parts }),
      addPendingParts: (parts) =>
        set((state) => ({ pendingParts: [...state.pendingParts, ...parts] })),
      clearPendingParts: () => set({ pendingParts: [] }),
    }),
    {
      name: 'alucalc-shared-cut-parts-v1',
    }
  )
);

/**
 * modules/mechanical/SheetMetal/store.ts
 * 
 * Zustand local state for the Sheet Metal Module
 */

import { create } from 'zustand';
import { SheetMetalInput, SheetMetalResult, SheetMetalEngine } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

interface SheetMetalState {
    input: SheetMetalInput;
    result: SheetMetalResult | null;
    metadata: EngineMetadata | null;
    isCalculating: boolean;

    setInput: (updates: Partial<SheetMetalInput>) => void;
    calculate: () => void;
    reset: () => void;
}

const defaultInput: SheetMetalInput = {
    thickness: 2.0,
    bendAngle: 90,
    innerRadius: 2.0,
    kFactor: 0.33,
    material: 'Aluminum 6061-T6'
};

export const useSheetMetalStore = create<SheetMetalState>((set, get) => ({
    input: { ...defaultInput },
    result: null,
    metadata: null,
    isCalculating: false,

    setInput: (updates) => {
        set((state) => ({ input: { ...state.input, ...updates } }));
    },

    calculate: () => {
        set({ isCalculating: true });

        try {
            const { input } = get();
            const { result, metadata } = SheetMetalEngine.calculate(input);
            set({ result, metadata, isCalculating: false });
        } catch (error) {
            console.error('Calculation failed:', error);
            set({ isCalculating: false });
        }
    },

    reset: () => {
        set({ input: { ...defaultInput }, result: null, metadata: null });
    }
}));

/**
 * modules/mechanical/MfgReadiness/store.ts
 */

import { create } from 'zustand';
import { MfgGeometryInput, MfgResult, MfgReadinessEngine } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

interface MfgState {
    input: MfgGeometryInput;
    result: MfgResult | null;
    metadata: EngineMetadata | null;
    isAnalyzing: boolean;

    setInput: (updates: Partial<MfgGeometryInput>) => void;
    analyze: () => void;
}

export const useMfgStore = create<MfgState>((set, get) => ({
    input: {
        entityCount: 150,
        minInnerRadius: 2.0,
        hasUndercuts: false,
        hasTightPockets: true,
        wallThicknessMin: 1.5,
        processTarget: 'cnc'
    },
    result: null,
    metadata: null,
    isAnalyzing: false,

    setInput: (updates) => {
        set((state) => ({ input: { ...state.input, ...updates } }));
    },

    analyze: () => {
        set({ isAnalyzing: true });

        // Simulate minor async to feel like deep geometry analysis
        setTimeout(() => {
            const { input } = get();
            const { result, metadata } = MfgReadinessEngine.analyze(input);
            set({ result, metadata, isAnalyzing: false });
        }, 600);
    }
}));

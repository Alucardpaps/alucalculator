/**
 * modules/mechanical/FailurePrediction/store.ts
 */

import { create } from 'zustand';
import { FailureInput, FailureResult, FailurePredictionEngine } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

interface FailureState {
    input: FailureInput;
    result: FailureResult | null;
    metadata: EngineMetadata | null;

    setInput: (updates: Partial<FailureInput>) => void;
    analyze: () => void;
}

export const useFailureStore = create<FailureState>((set, get) => ({
    input: {
        geometryType: 'plate',
        hasSharpInternalCorners: true,
        hasSuddenCrossSecChange: false,
        appliedLoadType: 'dynamic',
        yieldStrengthMpa: 276, // Al 6061-T6
        estimatedMaxStressMpa: 150
    },
    result: null,
    metadata: null,

    setInput: (updates) => {
        set((state) => ({ input: { ...state.input, ...updates } }));
    },

    analyze: () => {
        const { input } = get();
        const { result, metadata } = FailurePredictionEngine.analyze(input);
        set({ result, metadata });
    }
}));

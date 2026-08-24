/**
 * modules/generative/GenerativeLite/store.ts
 */

import { create } from 'zustand';
import { GenerativeInput, GenerativeResult, GenerativeLiteEngine } from './engine';
import { EngineMetadata } from '@/engine/project/ProjectSchema';

interface GenState {
    input: GenerativeInput;
    result: GenerativeResult | null;
    metadata: EngineMetadata | null;

    isRunning: boolean;
    progress: number; // 0-100
    currentIteration: number;
    liveVolume: number;

    setInput: (updates: Partial<GenerativeInput>) => void;
    startOptimization: () => void;
    cancel: () => void;
}

let worker: Worker | null = null;

export const useGenerativeStore = create<GenState>((set, get) => ({
    input: {
        targetVolumeFraction: 0.4,
        preserveRegions: [],
        loadCases: []
    },
    result: null,
    metadata: null,
    isRunning: false,
    progress: 0,
    currentIteration: 0,
    liveVolume: 1000,

    setInput: (updates) => set(s => ({ input: { ...s.input, ...updates } })),

    startOptimization: () => {
        const { input } = get();
        set({ isRunning: true, progress: 0, currentIteration: 0, liveVolume: 1000, result: null, metadata: null });

        worker = new Worker(new URL('@/engine/workers/generativeWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            const data = e.data;
            if (data.type === 'PROGRESS') {
                set({
                    progress: data.progressPercent,
                    currentIteration: data.iteration,
                    liveVolume: data.currentVolume
                });
            } else if (data.type === 'COMPLETE') {
                const finalResult = {
                    finalVolume: data.finalVolume,
                    massSavedKg: ((1000 - data.finalVolume) * 2.7) / 1000, // Assuming Alum
                    optimizedMeshUrl: data.optimizedMeshUrl
                };

                set({
                    isRunning: false,
                    progress: 100,
                    result: finalResult,
                    metadata: GenerativeLiteEngine.generateMetadata(input, finalResult)
                });
                worker?.terminate();
            }
        };

        worker.postMessage({
            type: 'START_OPTIMIZATION',
            targetVolumeFraction: input.targetVolumeFraction,
            maxIterations: 40,
            initialVolume: 1000
        });
    },

    cancel: () => {
        if (worker) {
            worker.terminate();
            set({ isRunning: false });
        }
    }
}));

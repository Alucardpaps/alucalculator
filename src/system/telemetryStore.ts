/**
 * AluCalculator — Engine Telemetry Store
 * 
 * Zustand store tracking per-engine execution analytics.
 * Fed automatically by engineRunner.ts on every execution.
 * 
 * Tracks:
 * - Per-engine: run count, average time, error rate, recent errors
 * - Global: total calculations, uptime, worker usage percentage
 */

import { create } from 'zustand';
import type { EngineExecutionMeta, EngineTelemetrySnapshot } from '@/types/engine-metadata';
import { setTelemetryRecorder } from '@/runtime/engineRunner';

// ============================================
// STORE TYPES
// ============================================

interface TelemetryState {
    /** Per-engine telemetry snapshots */
    engines: Record<string, EngineTelemetrySnapshot>;
    /** Global statistics */
    global: {
        totalExecutions: number;
        totalErrors: number;
        workerExecutions: number;
        bootTimestamp: number;
    };
}

interface TelemetryActions {
    /** Record a single engine execution */
    recordExecution: (meta: EngineExecutionMeta, success: boolean, error?: string) => void;
    /** Get telemetry for a specific engine */
    getEngineTelemetry: (engineId: string) => EngineTelemetrySnapshot | null;
    /** Reset all telemetry data */
    reset: () => void;
}

type TelemetryStore = TelemetryState & TelemetryActions;

// ============================================
// CONSTANTS
// ============================================

const MAX_RECENT_ERRORS = 10;

const INITIAL_SNAPSHOT: EngineTelemetrySnapshot = {
    totalRuns: 0,
    averageTimeMs: 0,
    lastRunTimestamp: 0,
    errorRate: 0,
    totalErrors: 0,
    recentErrors: [],
};

// ============================================
// STORE
// ============================================

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
    engines: {},
    global: {
        totalExecutions: 0,
        totalErrors: 0,
        workerExecutions: 0,
        bootTimestamp: Date.now(),
    },

    recordExecution: (meta: EngineExecutionMeta, success: boolean, error?: string) => {
        set(state => {
            const existing = state.engines[meta.engineId] ?? { ...INITIAL_SNAPSHOT };

            const newTotalRuns = existing.totalRuns + 1;
            const newTotalErrors = existing.totalErrors + (success ? 0 : 1);

            // Running average for execution time
            const newAverageTime =
                (existing.averageTimeMs * existing.totalRuns + meta.executionTimeMs) / newTotalRuns;

            // Update recent errors ring buffer
            const newRecentErrors = [...existing.recentErrors];
            if (!success && error) {
                newRecentErrors.push(`[${new Date(meta.timestamp).toISOString()}] ${error}`);
                if (newRecentErrors.length > MAX_RECENT_ERRORS) {
                    newRecentErrors.shift();
                }
            }

            const updatedSnapshot: EngineTelemetrySnapshot = {
                totalRuns: newTotalRuns,
                averageTimeMs: Math.round(newAverageTime * 100) / 100,
                lastRunTimestamp: meta.timestamp,
                errorRate: newTotalRuns > 0 ? newTotalErrors / newTotalRuns : 0,
                totalErrors: newTotalErrors,
                recentErrors: newRecentErrors,
            };

            return {
                engines: {
                    ...state.engines,
                    [meta.engineId]: updatedSnapshot,
                },
                global: {
                    ...state.global,
                    totalExecutions: state.global.totalExecutions + 1,
                    totalErrors: state.global.totalErrors + (success ? 0 : 1),
                    workerExecutions: state.global.workerExecutions + (meta.workerUsed ? 1 : 0),
                },
            };
        });
    },

    getEngineTelemetry: (engineId: string): EngineTelemetrySnapshot | null => {
        return get().engines[engineId] ?? null;
    },

    reset: () => {
        set({
            engines: {},
            global: {
                totalExecutions: 0,
                totalErrors: 0,
                workerExecutions: 0,
                bootTimestamp: Date.now(),
            },
        });
    },
}));

// ============================================
// BOOT INTEGRATION
// ============================================

/**
 * Initialize the telemetry system.
 * Wires the Zustand store's recordExecution method into engineRunner's telemetry hook.
 * Called during kernel boot Phase 6.
 */
export function initializeTelemetry(): void {
    const { recordExecution } = useTelemetryStore.getState();
    setTelemetryRecorder(recordExecution);
    console.log('[TELEMETRY] ✅ Telemetry system initialized.');
}

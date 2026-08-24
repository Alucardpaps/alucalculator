/**
 * AluCalculator — Unified Engine Runner
 * 
 * The single entry point for all engine executions.
 * 
 * Pipeline:
 *   UI → Logic → engineRunner.execute(engineId, input) → 
 *     → validate input
 *     → resolve dependencies
 *     → route to worker or main thread
 *     → wrap result with metadata
 *     → feed telemetry
 *     → return EngineResult<T>
 * 
 * Design constraints:
 * - Never throws — always returns EngineResult with success=false on error
 * - Always produces execution metadata, even on validation failure
 * - Telemetry is updated on every invocation (success or failure)
 */

import type { EngineResult } from '@/types/engine-contracts';
import type { EngineExecutionMeta, EngineValidationMeta, UnitSystemMeta } from '@/types/engine-metadata';
import { ENGINE_REGISTRY } from '@/engine/engineRegistry';
import { shouldUseWorker, executeInWorker } from './workerRouter';

// ============================================
// UUID GENERATOR (lightweight, no dependency)
// ============================================

function generateExecutionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// TELEMETRY HOOK
// ============================================

type TelemetryRecorder = (meta: EngineExecutionMeta, success: boolean, error?: string) => void;

let _telemetryRecorder: TelemetryRecorder | null = null;

/**
 * Set the telemetry recorder function.
 * Called by telemetryStore.ts during boot.
 */
export function setTelemetryRecorder(recorder: TelemetryRecorder): void {
    _telemetryRecorder = recorder;
}

// ============================================
// ENGINE RUNNER
// ============================================

export interface ExecuteOptions {
    /** Override unit system for this execution */
    unitSystem?: 'SI' | 'Imperial';
    /** Override precision for this execution */
    precision?: number;
    /** Parent execution ID (for chained runs) */
    parentExecutionId?: string;
    /** Skip worker routing and force main thread */
    forceMainThread?: boolean;
}

/**
 * Execute an engine by ID with validated inputs.
 * This is the ONLY sanctioned way to run an engine.
 */
export async function executeEngine<TInput, TOutput>(
    engineId: string,
    input: TInput,
    options: ExecuteOptions = {}
): Promise<EngineResult<TOutput>> {
    const executionId = generateExecutionId();
    const startTime = performance.now();

    // --- Resolve engine ---
    const entry = ENGINE_REGISTRY.get(engineId);
    if (!entry) {
        return createFailureResult<TOutput>(
            executionId,
            engineId,
            '0.0.0',
            startTime,
            `Engine '${engineId}' not found in registry.`,
            options
        );
    }

    const manifest = entry.manifest;

    // --- Validate input ---
    let validationMeta: EngineValidationMeta;

    if (entry.instance && typeof entry.instance.validate === 'function') {
        const errors = entry.instance.validate(input);
        validationMeta = {
            inputValidated: errors.length === 0,
            schemaUsed: manifest.inputSchemaVersion,
            validationErrors: errors,
        };

        if (errors.length > 0) {
            const result = createFailureResult<TOutput>(
                executionId,
                engineId,
                manifest.version,
                startTime,
                `Validation failed: ${errors.join('; ')}`,
                options,
                validationMeta
            );
            recordTelemetry(result.execution, false, result.error ?? undefined);
            return result;
        }
    } else {
        // No validate function — mark as unvalidated but proceed
        validationMeta = {
            inputValidated: false,
            schemaUsed: manifest.inputSchemaVersion,
            validationErrors: [],
            validationWarnings: ['Engine does not implement validate()'],
        };
    }

    // --- Execute ---
    try {
        let data: TOutput;
        let workerUsed = false;

        const useWorker = !options.forceMainThread && shouldUseWorker(engineId);

        if (useWorker) {
            data = await executeInWorker<TOutput>(engineId, executionId, input);
            workerUsed = true;
        } else {
            // Ensure engine is initialized
            if (!entry.initialized) {
                await ENGINE_REGISTRY.initialize(engineId);
            }

            if (entry.instance && typeof entry.instance.execute === 'function') {
                const rawResult = entry.instance.execute(input);
                data = rawResult instanceof Promise ? await rawResult : rawResult;
            } else {
                throw new Error(`Engine '${engineId}' has no execute() method.`);
            }
        }

        const executionTimeMs = performance.now() - startTime;

        const executionMeta: EngineExecutionMeta = {
            executionId,
            engineId,
            version: manifest.version,
            inputSchemaVersion: manifest.inputSchemaVersion,
            executionTimeMs,
            workerUsed,
            timestamp: Date.now(),
            parentExecutionId: options.parentExecutionId,
        };

        const unitSystemMeta: UnitSystemMeta = {
            unitSystem: options.unitSystem ?? manifest.preferredUnitSystem,
            autoConvert: false,
            precision: options.precision ?? 6,
        };

        const result: EngineResult<TOutput> = {
            success: true,
            data,
            error: null,
            execution: executionMeta,
            validation: validationMeta,
            unitSystem: unitSystemMeta,
        };

        recordTelemetry(executionMeta, true);
        return result;

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const result = createFailureResult<TOutput>(
            executionId,
            engineId,
            manifest.version,
            startTime,
            errorMessage,
            options,
            validationMeta
        );
        recordTelemetry(result.execution, false, errorMessage);
        return result;
    }
}

// ============================================
// HELPERS
// ============================================

function createFailureResult<T>(
    executionId: string,
    engineId: string,
    version: string,
    startTime: number,
    error: string,
    options: ExecuteOptions,
    validationMeta?: EngineValidationMeta
): EngineResult<T> {
    return {
        success: false,
        data: null,
        error,
        execution: {
            executionId,
            engineId,
            version,
            inputSchemaVersion: '0.0.0',
            executionTimeMs: performance.now() - startTime,
            workerUsed: false,
            timestamp: Date.now(),
            parentExecutionId: options.parentExecutionId,
        },
        validation: validationMeta ?? {
            inputValidated: false,
            schemaUsed: 'unknown',
            validationErrors: [error],
        },
        unitSystem: {
            unitSystem: options.unitSystem ?? 'SI',
            autoConvert: false,
            precision: options.precision ?? 6,
        },
    };
}

function recordTelemetry(meta: EngineExecutionMeta, success: boolean, error?: string): void {
    if (_telemetryRecorder) {
        try {
            _telemetryRecorder(meta, success, error);
        } catch {
            // Telemetry must never crash the execution pipeline
        }
    }
}

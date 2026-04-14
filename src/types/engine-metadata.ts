/**
 * AluCalculator — Engine Metadata Type System
 * 
 * Enterprise-grade metadata interfaces for execution tracing,
 * validation, unit systems, dependency graphs, and telemetry.
 * 
 * These types are consumed by:
 * - engineRunner.ts (execution pipeline)
 * - engineRegistry.ts (manifest storage)
 * - telemetryStore.ts (analytics)
 * - workerRouter.ts (offload decisions)
 */

// ============================================
// EXECUTION METADATA
// ============================================

/**
 * Attached to every engine execution result.
 * Enables full auditability and replay.
 */
export interface EngineExecutionMeta {
    /** Unique ID for this specific execution (UUID v4) */
    executionId: string;
    /** Which engine produced this result */
    engineId: string;
    /** Engine version at time of execution */
    version: string;
    /** Input schema version used */
    inputSchemaVersion: string;
    /** Wall-clock execution time in milliseconds */
    executionTimeMs: number;
    /** Whether execution was offloaded to a Web Worker */
    workerUsed: boolean;
    /** Unix timestamp (ms) of execution start */
    timestamp: number;
    /** Optional parent execution ID (for chained/dependent runs) */
    parentExecutionId?: string;
}

// ============================================
// VALIDATION METADATA
// ============================================

/**
 * Records the validation state of engine inputs.
 * Attached to every EngineResult.
 */
export interface EngineValidationMeta {
    /** Whether all inputs passed schema validation */
    inputValidated: boolean;
    /** Schema identifier used for validation */
    schemaUsed: string;
    /** List of validation errors (empty if inputValidated is true) */
    validationErrors: string[];
    /** Warnings that don't block execution but should be surfaced */
    validationWarnings?: string[];
}

// ============================================
// UNIT SYSTEM METADATA
// ============================================

/**
 * Declares the unit system context for an engine execution.
 * Critical for SI ↔ Imperial consistency.
 */
export interface UnitSystemMeta {
    /** Active unit system */
    unitSystem: 'SI' | 'Imperial';
    /** Whether the engine auto-converted inputs to its native unit system */
    autoConvert: boolean;
    /** Decimal precision for output values */
    precision: number;
}

// ============================================
// DEPENDENCY GRAPH METADATA
// ============================================

/**
 * Declares an engine's dependencies and outputs.
 * Used by dependencyResolver.ts for topological execution ordering.
 * 
 * Example:
 *   FEA engine depends on: ['materials', 'structure']
 *   FEA engine produces:   ['stress-result', 'displacement-result']
 */
export interface EngineDependencyMeta {
    /** Engine IDs this engine requires to run first */
    dependsOn: string[];
    /** Data keys this engine produces (consumed by downstream engines) */
    produces: string[];
}

// ============================================
// TELEMETRY SNAPSHOT
// ============================================

/**
 * Per-engine runtime statistics.
 * Aggregated by telemetryStore.ts.
 */
export interface EngineTelemetrySnapshot {
    /** Total number of successful executions */
    totalRuns: number;
    /** Average execution time in ms */
    averageTimeMs: number;
    /** Unix timestamp of last execution */
    lastRunTimestamp: number;
    /** Error rate as a ratio (0.0 to 1.0) */
    errorRate: number;
    /** Total number of failed executions */
    totalErrors: number;
    /** Last N error messages (ring buffer, max 10) */
    recentErrors: string[];
}

// ============================================
// COMPOSITE — FULL ENGINE METADATA
// ============================================

/**
 * Complete metadata bundle attached to an engine result.
 * This is the single source of truth for "what happened during execution."
 */
export interface FullEngineMetadata {
    execution: EngineExecutionMeta;
    validation: EngineValidationMeta;
    unitSystem: UnitSystemMeta;
}

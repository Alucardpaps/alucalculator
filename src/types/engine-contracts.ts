/**
 * AluCalculator — Engine Contract Interfaces
 * 
 * Defines the IEngine interface that all engines must implement,
 * the EngineManifest that describes engine capabilities,
 * and the EngineResult wrapper for typed outputs with metadata.
 * 
 * ARCHITECTURAL RULE:
 * - Engines MUST be pure, stateless, and deterministic.
 * - All side effects happen in the runtime adapter layer.
 * - Results are always serializable and replayable.
 */

import type {
    EngineExecutionMeta,
    EngineValidationMeta,
    EngineDependencyMeta,
    UnitSystemMeta,
} from './engine-metadata';

// ============================================
// ENGINE MANIFEST
// ============================================

/** Engine category taxonomy */
export type EngineCategory =
    | 'mechanical'
    | 'materials'
    | 'structure'
    | 'graph'
    | 'math'
    | 'export'
    | 'fea'
    | 'electrical'
    | 'thermal';

/**
 * Static declaration of an engine's identity and capabilities.
 * Registered once at boot time, immutable thereafter.
 */
export interface EngineManifest {
    /** Unique engine identifier (e.g., 'gear-geometry', 'structural-3d') */
    id: string;
    /** Semantic version (e.g., '1.0.0') */
    version: string;
    /** Human-readable engine name */
    name: string;
    /** Brief description of what this engine computes */
    description: string;
    /** Engine category for grouping and filtering */
    category: EngineCategory;
    /** Dependency declarations */
    dependencies: EngineDependencyMeta;
    /** Whether this engine can be offloaded to a Web Worker */
    workerEligible: boolean;
    /** Engineering standards this engine references */
    standards: string[];
    /** Input schema version identifier */
    inputSchemaVersion: string;
    /** Default unit system preference */
    preferredUnitSystem: UnitSystemMeta['unitSystem'];
    /** Tags for AI introspection and search */
    tags?: string[];
}

// ============================================
// ENGINE RESULT WRAPPER
// ============================================

/**
 * Every engine execution returns an EngineResult<T>.
 * Wraps the typed output with full execution and validation metadata.
 * 
 * This enables:
 * - Audit trails
 * - Telemetry recording
 * - Result caching
 * - History replay from IndexedDB
 * - PDF report generation with provenance
 */
export interface EngineResult<T> {
    /** Whether the engine executed successfully */
    success: boolean;
    /** Typed output payload (null on failure) */
    data: T | null;
    /** Error message (null on success) */
    error: string | null;
    /** Execution metadata (timing, worker usage, etc.) */
    execution: EngineExecutionMeta;
    /** Validation metadata (input status, schema used) */
    validation: EngineValidationMeta;
    /** Unit system context */
    unitSystem: UnitSystemMeta;
}

// ============================================
// ENGINE INTERFACE
// ============================================

/**
 * The core engine contract.
 * All engines MUST implement this interface.
 * 
 * Design constraints:
 * - execute() must be pure — same input always yields same output
 * - validate() must be synchronous and fast
 * - getManifest() returns static metadata (no computation)
 */
export interface IEngine<TInput, TOutput> {
    /** Execute the engine computation */
    execute(input: TInput): TOutput | Promise<TOutput>;

    /** Validate inputs before execution. Returns error strings, empty = valid. */
    validate(input: TInput): string[];

    /** Return the engine's static manifest */
    getManifest(): EngineManifest;
}

// ============================================
// ENGINE REGISTRY ENTRY
// ============================================

/**
 * A registered engine in the ENGINE_REGISTRY.
 * Contains the manifest + optional lazy-loaded instance.
 */
export interface EngineRegistryEntry {
    manifest: EngineManifest;
    /** The engine instance (null until first use if lazy-loaded) */
    instance: IEngine<unknown, unknown> | null;
    /** Lazy loader for deferred initialization */
    loader?: () => Promise<IEngine<unknown, unknown>>;
    /** Whether the engine has been initialized */
    initialized: boolean;
}

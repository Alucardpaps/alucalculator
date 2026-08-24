/**
 * AluCalculator — Engine Dependency Resolver
 * 
 * Topological sort-based dependency resolution.
 * Ensures engines execute in the correct order when
 * one engine's output feeds another engine's input.
 * 
 * Example:
 *   structural-3d → depends on → [materials, structural-2d]
 *   structural-2d → depends on → [materials]
 *   materials → depends on → []
 *   
 *   Resolution: [materials, structural-2d, structural-3d]
 */

import { ENGINE_REGISTRY } from './engineRegistry';

// ============================================
// TYPES
// ============================================

export interface DependencyResolutionResult {
    /** Ordered list of engine IDs to execute */
    executionOrder: string[];
    /** Whether any cycles were detected */
    hasCycles: boolean;
    /** Engines involved in cycles (empty if no cycles) */
    cycleParticipants: string[];
}

// ============================================
// RESOLVER
// ============================================

/**
 * Resolve the execution order for a given engine and all its transitive dependencies.
 * Uses Kahn's algorithm (BFS topological sort) for determinism.
 */
export function resolveDependencies(engineId: string): DependencyResolutionResult {
    const visited = new Set<string>();
    const result: string[] = [];
    const inProgress = new Set<string>();
    const cycleParticipants: string[] = [];

    function dfs(id: string): boolean {
        if (inProgress.has(id)) {
            // Cycle detected
            cycleParticipants.push(id);
            return false;
        }

        if (visited.has(id)) {
            return true; // Already processed
        }

        inProgress.add(id);

        const entry = ENGINE_REGISTRY.get(id);
        if (entry) {
            const deps = entry.manifest.dependencies.dependsOn;
            for (const depId of deps) {
                if (!dfs(depId)) {
                    cycleParticipants.push(id);
                    return false;
                }
            }
        }

        inProgress.delete(id);
        visited.add(id);
        result.push(id);
        return true;
    }

    const success = dfs(engineId);

    return {
        executionOrder: result,
        hasCycles: !success,
        cycleParticipants,
    };
}

/**
 * Resolve dependencies for multiple engines simultaneously.
 * Useful for batch execution or flow graph evaluation.
 */
export function resolveMultipleDependencies(engineIds: string[]): DependencyResolutionResult {
    const visited = new Set<string>();
    const result: string[] = [];
    const inProgress = new Set<string>();
    const cycleParticipants: string[] = [];
    let hasCycles = false;

    function dfs(id: string): boolean {
        if (inProgress.has(id)) {
            cycleParticipants.push(id);
            return false;
        }
        if (visited.has(id)) return true;

        inProgress.add(id);

        const entry = ENGINE_REGISTRY.get(id);
        if (entry) {
            for (const depId of entry.manifest.dependencies.dependsOn) {
                if (!dfs(depId)) {
                    cycleParticipants.push(id);
                    return false;
                }
            }
        }

        inProgress.delete(id);
        visited.add(id);
        result.push(id);
        return true;
    }

    for (const engineId of engineIds) {
        if (!dfs(engineId)) {
            hasCycles = true;
        }
    }

    return {
        executionOrder: result,
        hasCycles,
        cycleParticipants,
    };
}

/**
 * Get the immediate dependents of an engine (engines that depend on it).
 * Useful for invalidation — if engine A changes, what must recalculate?
 */
export function getDependents(engineId: string): string[] {
    return ENGINE_REGISTRY.getAll()
        .filter(e => e.manifest.dependencies.dependsOn.includes(engineId))
        .map(e => e.manifest.id);
}

/**
 * Validate the entire dependency graph for cycles.
 * Should be called during kernel boot after all engines are registered.
 */
export function validateDependencyGraph(): DependencyResolutionResult {
    const allIds = ENGINE_REGISTRY.getAllManifests().map(m => m.id);
    return resolveMultipleDependencies(allIds);
}

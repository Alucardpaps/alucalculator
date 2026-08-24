/**
 * AluCAD — Constraint Solver V2
 * 
 * Upgraded relaxation solver with:
 *   - Partial cluster solving (only solve affected subgraph)
 *   - Tighter convergence epsilon (0.001 vs previous 0.05)
 *   - Time budget enforcement (16ms per solve = 1 frame budget)
 *   - Cached last solution for warm-start
 *   - Dirty flag system
 *   - DOF-aware state tracking
 * 
 * Compatible with existing ConstraintSolver — extends, does not replace.
 * The original solver is still used as the core relaxation engine;
 * V2 wraps it with graph-aware partial solving and diagnostics.
 */

import type { CadEntity, Point } from '../types';
import type { Constraint } from '../../constraints/types';
import { ConstraintGraph, type DOFAnalysis, type SketchState } from '../ConstraintGraph';

// Solver functions — reuse existing implementations
import { solveCoincident, solveHorizontal, solveVertical, solveFixed } from '../../constraints/solvers/basic';
import { solveParallel, solvePerpendicular, solveAngle } from '../../constraints/solvers/linear';
import { solveTangent } from '../../constraints/solvers/tangent';
import { solveDistance } from '../../constraints/solvers/distance';
import { solveEqualLength, solveRadius, solveDiameter, solveConcentric, solveMidpoint } from '../../constraints/solvers/dimensional';
import type { ConstraintSolverFunction } from '../../constraints/types';

// ============================================
// TYPES
// ============================================

export interface SolverV2Config {
    /** Maximum iterations per solve pass */
    maxIterations: number;
    /** Convergence threshold (world units) */
    convergenceEpsilon: number;
    /** Maximum time budget in ms (0 = unlimited) */
    maxTimeMs: number;
    /** Enable partial solving (only solve dirty clusters) */
    enablePartialSolve: boolean;
    /** Relaxation factor (0-1): lower = more stable, higher = faster convergence */
    relaxationFactor: number;
}

export interface SolverV2Result {
    converged: boolean;
    iterations: number;
    error: number;
    timeMs: number;
    solvedEntities: CadEntity[];
    dofAnalysis: DOFAnalysis;
    sketchState: SketchState;
    /** Which entities were actually modified */
    modifiedEntityIds: string[];
    /** Whether the solver hit the time budget */
    timedOut: boolean;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: SolverV2Config = {
    maxIterations: 500,
    convergenceEpsilon: 0.001,
    maxTimeMs: 16, // 1 frame budget
    enablePartialSolve: true,
    relaxationFactor: 0.4,
};

// ============================================
// SOLVER V2
// ============================================

export class ConstraintSolverV2 {
    private config: SolverV2Config;
    private graph: ConstraintGraph;
    private dirtyEntityIds = new Set<string>();
    private lastSolution = new Map<string, any>(); // entity.id → geometry snapshot

    constructor(config: Partial<SolverV2Config> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.graph = new ConstraintGraph();
    }

    // -------------------------------------------
    // GRAPH MANAGEMENT
    // -------------------------------------------

    /**
     * Rebuild constraint graph from current state.
     * Call after major changes (undo/redo, batch operations).
     */
    rebuildGraph(entities: CadEntity[], constraints: Constraint[]): void {
        this.graph.rebuild(entities, constraints);
        this.markAllDirty();
    }

    /**
     * Mark specific entities as dirty (needing re-solve).
     */
    markDirty(entityIds: string[]): void {
        for (const id of entityIds) {
            this.dirtyEntityIds.add(id);
            // Also mark connected entities through constraint graph
            const affected = this.graph.getAffectedEntities(id);
            affected.forEach(aId => this.dirtyEntityIds.add(aId));
        }
    }

    /**
     * Mark all entities dirty.
     */
    markAllDirty(): void {
        // Will be populated on next solve from entity list
        this.dirtyEntityIds.clear();
        this.lastSolution.clear();
    }

    // -------------------------------------------
    // SOLVE
    // -------------------------------------------

    /**
     * Main solve entry point.
     * If partial solving is enabled, only solves dirty clusters.
     */
    solve(entities: CadEntity[], constraints: Constraint[]): SolverV2Result {
        const startTime = performance.now();

        // Rebuild graph if needed (lightweight — just index update)
        this.graph.rebuild(entities, constraints);

        // DOF analysis
        const dofAnalysis = this.graph.analyzeDOF();

        // Determine which entities to solve
        let entitiesToSolve: CadEntity[];
        let constraintsToSolve: Constraint[];

        if (this.config.enablePartialSolve && this.dirtyEntityIds.size > 0) {
            // Get affected cluster
            const affectedIds = new Set<string>();
            for (const dirtyId of this.dirtyEntityIds) {
                const affected = this.graph.getAffectedEntities(dirtyId);
                affected.forEach(id => affectedIds.add(id));
            }

            entitiesToSolve = entities.filter(e => affectedIds.has(e.id));
            constraintsToSolve = constraints.filter(c =>
                c.active && c.entityIds.some(id => affectedIds.has(id))
            );
        } else {
            entitiesToSolve = [...entities];
            constraintsToSolve = constraints.filter(c => c.active);
        }

        // Clone entities for solving (never mutate originals)
        const solvedEntities = this.cloneEntities(entitiesToSolve);
        const entityMap = new Map<string, CadEntity>();
        solvedEntities.forEach(e => entityMap.set(e.id, e));

        // Also include non-dirty entities in map for constraint references
        entities.forEach(e => {
            if (!entityMap.has(e.id)) {
                entityMap.set(e.id, { ...e, geometry: { ...e.geometry } } as CadEntity);
            }
        });

        // Capture fixed geometry snapshots
        const fixedSnapshots = this.captureFixedSnapshots(entityMap, constraintsToSolve);

        // --- Relaxation loop ---
        let converged = false;
        let iterations = 0;
        let maxError = Infinity;
        let timedOut = false;

        for (let i = 0; i < this.config.maxIterations; i++) {
            // Time budget check
            if (this.config.maxTimeMs > 0) {
                const elapsed = performance.now() - startTime;
                if (elapsed > this.config.maxTimeMs) {
                    timedOut = true;
                    break;
                }
            }

            maxError = 0;
            iterations = i + 1;

            for (const constraint of constraintsToSolve) {
                const solver = this.getSolver(constraint.type);
                if (!solver) continue;

                try {
                    const error = solver(entityMap, constraint);
                    if (!Number.isNaN(error) && error > maxError) {
                        maxError = error;
                    }
                } catch {
                    // Constraint solver failure — skip, don't crash
                }
            }

            // Enforce FIXED constraints
            this.enforceFixed(entityMap, fixedSnapshots);

            // Apply relaxation factor (damping)
            if (this.config.relaxationFactor < 1.0) {
                this.applyRelaxation(entityMap, this.lastSolution, this.config.relaxationFactor);
            }

            // Convergence check
            if (maxError < this.config.convergenceEpsilon) {
                converged = true;
                break;
            }
        }

        // Track modifications
        const modifiedEntityIds: string[] = [];
        for (const [id, entity] of entityMap) {
            const oldGeom = this.lastSolution.get(id);
            if (!oldGeom || !geometryEqual(oldGeom, entity.geometry)) {
                modifiedEntityIds.push(id);
            }
            // Cache for next solve (warm start)
            this.lastSolution.set(id, JSON.parse(JSON.stringify(entity.geometry)));
        }

        // Clear dirty flags
        this.dirtyEntityIds.clear();

        // Merge solved entities back into full list
        const result = entities.map(e => {
            const solved = entityMap.get(e.id);
            return solved || e;
        });

        const timeMs = performance.now() - startTime;

        return {
            converged,
            iterations,
            error: maxError,
            timeMs: Math.round(timeMs * 100) / 100,
            solvedEntities: result,
            dofAnalysis,
            sketchState: dofAnalysis.state,
            modifiedEntityIds,
            timedOut,
        };
    }

    // -------------------------------------------
    // DOF & STATE
    // -------------------------------------------

    getSketchState(): SketchState {
        return this.graph.getSketchState();
    }

    getDOFAnalysis(): DOFAnalysis {
        return this.graph.analyzeDOF();
    }

    getGraph(): ConstraintGraph {
        return this.graph;
    }

    // -------------------------------------------
    // SOLVER DISPATCH
    // -------------------------------------------

    private getSolver(type: string): ConstraintSolverFunction | null {
        switch (type) {
            case 'COINCIDENT': return solveCoincident;
            case 'HORIZONTAL': return solveHorizontal;
            case 'VERTICAL': return solveVertical;
            case 'FIXED': return null; // Handled separately
            case 'PARALLEL': return solveParallel;
            case 'PERPENDICULAR': return solvePerpendicular;
            case 'ANGLE': return solveAngle;
            case 'TANGENT': return solveTangent;
            case 'DISTANCE': return solveDistance;
            // Dimensional solvers
            case 'EQUAL_LENGTH': return solveEqualLength;
            case 'RADIUS': return solveRadius;
            case 'DIAMETER': return solveDiameter;
            case 'CONCENTRIC': return solveConcentric;
            case 'MIDPOINT': return solveMidpoint;
            default: return null;
        }
    }

    // -------------------------------------------
    // HELPERS
    // -------------------------------------------

    private cloneEntities(entities: CadEntity[]): CadEntity[] {
        return entities.map(e => {
            const cloned = { ...e, geometry: { ...e.geometry } } as CadEntity;
            if (cloned.geometry.type === 'POLYLINE') {
                cloned.geometry = {
                    ...cloned.geometry,
                    vertices: cloned.geometry.vertices.map(v => ({ ...v })),
                };
            }
            return cloned;
        });
    }

    private captureFixedSnapshots(
        entityMap: Map<string, CadEntity>,
        constraints: Constraint[]
    ): Map<string, any> {
        const snapshots = new Map<string, any>();
        for (const c of constraints) {
            if (c.type === 'FIXED' && c.active) {
                for (const id of c.entityIds) {
                    const e = entityMap.get(id);
                    if (e) {
                        snapshots.set(id, JSON.parse(JSON.stringify(e.geometry)));
                    }
                }
            }
        }
        return snapshots;
    }

    private enforceFixed(entityMap: Map<string, CadEntity>, snapshots: Map<string, any>): void {
        for (const [id, geom] of snapshots) {
            const e = entityMap.get(id);
            if (e) {
                e.geometry = JSON.parse(JSON.stringify(geom));
            }
        }
    }

    private applyRelaxation(
        entityMap: Map<string, CadEntity>,
        lastSolution: Map<string, any>,
        factor: number
    ): void {
        // Blend current solution with previous solution for stability
        for (const [id, entity] of entityMap) {
            const prev = lastSolution.get(id);
            if (!prev) continue;

            const geom = entity.geometry;
            if (geom.type === 'LINE' && prev.type === 'LINE') {
                geom.start.x = lerp(prev.start.x, geom.start.x, factor);
                geom.start.y = lerp(prev.start.y, geom.start.y, factor);
                geom.end.x = lerp(prev.end.x, geom.end.x, factor);
                geom.end.y = lerp(prev.end.y, geom.end.y, factor);
            } else if (geom.type === 'CIRCLE' && prev.type === 'CIRCLE') {
                geom.center.x = lerp(prev.center.x, geom.center.x, factor);
                geom.center.y = lerp(prev.center.y, geom.center.y, factor);
                geom.radius = lerp(prev.radius, geom.radius, factor);
            }
            // Points don't need relaxation — they converge fast
        }
    }
}

// ============================================
// UTILITIES
// ============================================

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function geometryEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

// ============================================
// SINGLETON
// ============================================

export const solverV2 = new ConstraintSolverV2();

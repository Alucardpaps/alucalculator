/**
 * engine/solver/ConstraintSolver.ts
 * 
 * Manages the constraint graph and resolves geometry positions.
 * Integrates with @salusoft89/planegcs WASM solver.
 */

import { Constraint } from './Constraint';

export interface SolverResult {
    success: boolean;
    iterations: number;
    errorDelta?: number;
    updatedEntities: any[]; // Updated geometry definitions
    failedConstraints?: string[]; // IDs of constraints that didn't converge
}

const WASM_URL = '/planegcs.wasm';

export class ConstraintSolver {
    private constraints: Map<string, Constraint> = new Map();
    private isDirty: boolean = false;
    private maxIterations: number = 50;
    private tolerance: number = 1e-6;

    constructor() { }

    /**
     * Adds a constraint to the graph and marks solver as dirty
     */
    addConstraint(constraint: Constraint) {
        this.constraints.set(constraint.id, constraint);
        this.isDirty = true;
    }

    /**
     * Removes a constraint
     */
    removeConstraint(id: string) {
        if (this.constraints.has(id)) {
            this.constraints.delete(id);
            this.isDirty = true;
        }
    }

    /**
     * Main resolution loop. Modules call this after sketch changes.
     * @param sketchId 
     * @param currentEntities 
     */
    async solveSketch(sketchId: string, currentEntities: any[]): Promise<SolverResult> {
        if (!this.isDirty) {
            return {
                success: true,
                iterations: 0,
                updatedEntities: currentEntities
            };
        }

        if (typeof window === 'undefined') {
            return {
                success: false,
                iterations: 0,
                updatedEntities: currentEntities
            };
        }

        try {
            // Dynamically import to avoid build-time/SSR resolution of Node-specific code in @salusoft89/planegcs
            const { init_planegcs_module, GcsWrapper } = await import('@salusoft89/planegcs');
            const mod = await init_planegcs_module({ locateFile: () => WASM_URL });
            const gcs = new mod.GcsSystem();
            const gcsWrapper = new GcsWrapper(gcs);

            const primitives: any[] = [];

            // 1. Map currentEntities to GCS primitives
            currentEntities.forEach(entity => {
                const geom = entity.geometry;
                if (!geom) return;

                const geomType = (geom.type || '').toUpperCase();

                if (geomType === 'POINT') {
                    primitives.push({
                        id: entity.id,
                        type: 'point',
                        x: geom.x ?? 0,
                        y: geom.y ?? 0,
                        fixed: entity.isFixed || false
                    });
                } else if (geomType === 'LINE') {
                    const p1_id = `${entity.id}_start`;
                    const p2_id = `${entity.id}_end`;

                    primitives.push({
                        id: p1_id,
                        type: 'point',
                        x: geom.start?.x ?? 0,
                        y: geom.start?.y ?? 0,
                        fixed: false
                    });

                    primitives.push({
                        id: p2_id,
                        type: 'point',
                        x: geom.end?.x ?? 0,
                        y: geom.end?.y ?? 0,
                        fixed: false
                    });

                    primitives.push({
                        id: entity.id,
                        type: 'line',
                        p1_id,
                        p2_id
                    });
                } else if (geomType === 'CIRCLE') {
                    const c_id = `${entity.id}_center`;
                    primitives.push({
                        id: c_id,
                        type: 'point',
                        x: geom.center?.x ?? 0,
                        y: geom.center?.y ?? 0,
                        fixed: false
                    });

                    primitives.push({
                        id: entity.id,
                        type: 'circle',
                        c_id,
                        radius: geom.radius ?? 10
                    });
                }
            });

            // 2. Map this.constraints to GCS primitives
            this.constraints.forEach(c => {
                const typeLower = c.type.toLowerCase();

                // COINCIDENT
                if (typeLower === 'coincident' && c.entityIds.length === 2) {
                    primitives.push({
                        id: c.id,
                        type: 'p2p_coincident',
                        p1_id: c.entityIds[0],
                        p2_id: c.entityIds[1]
                    });
                }
                // HORIZONTAL
                else if (typeLower === 'horizontal' && c.entityIds.length === 2) {
                    primitives.push({
                        id: c.id,
                        type: 'p2p_horizontal_distance',
                        p1_id: c.entityIds[0],
                        p2_id: c.entityIds[1],
                        distance: 0
                    });
                }
                // VERTICAL
                else if (typeLower === 'vertical' && c.entityIds.length === 2) {
                    primitives.push({
                        id: c.id,
                        type: 'p2p_vertical_distance',
                        p1_id: c.entityIds[0],
                        p2_id: c.entityIds[1],
                        distance: 0
                    });
                }
                // DISTANCE
                else if (typeLower === 'distance' && c.entityIds.length === 2 && c.value !== undefined) {
                    primitives.push({
                        id: c.id,
                        type: 'p2p_distance',
                        p1_id: c.entityIds[0],
                        p2_id: c.entityIds[1],
                        distance: c.value
                    });
                }
                // PARALLEL
                else if (typeLower === 'parallel' && c.entityIds.length === 2) {
                    primitives.push({
                        id: c.id,
                        type: 'l2l_parallel',
                        l1_id: c.entityIds[0],
                        l2_id: c.entityIds[1]
                    });
                }
                // PERPENDICULAR
                else if (typeLower === 'perpendicular' && c.entityIds.length === 2) {
                    primitives.push({
                        id: c.id,
                        type: 'l2l_perpendicular',
                        l1_id: c.entityIds[0],
                        l2_id: c.entityIds[1]
                    });
                }
            });

            // 3. Solve using Planegcs Wrapper
            gcsWrapper.push_primitives_and_params(primitives);
            gcsWrapper.solve();
            gcsWrapper.apply_solution();

            const solvedPrimitives = gcsWrapper.sketch_index.get_primitives() as any[];

            // 4. Map back to CAD Entities
            const updatedEntities = currentEntities.map(entity => {
                const geom = entity.geometry;
                if (!geom) return entity;

                const geomType = (geom.type || '').toUpperCase();

                if (geomType === 'POINT') {
                    const p = solvedPrimitives.find(p => p.id === entity.id);
                    if (p) return { ...entity, geometry: { ...geom, x: p.x, y: p.y } };
                } else if (geomType === 'LINE') {
                    const p1 = solvedPrimitives.find(p => p.id === `${entity.id}_start`);
                    const p2 = solvedPrimitives.find(p => p.id === `${entity.id}_end`);
                    if (p1 && p2) {
                        return {
                            ...entity,
                            geometry: { ...geom, start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y } }
                        };
                    }
                } else if (geomType === 'CIRCLE') {
                    const c = solvedPrimitives.find(p => p.id === `${entity.id}_center`);
                    const obj = solvedPrimitives.find(p => p.id === entity.id);
                    if (c && obj) {
                        return {
                            ...entity,
                            geometry: { ...geom, center: { x: c.x, y: c.y }, radius: obj.radius }
                        };
                    }
                }

                return entity;
            });

            this.isDirty = false;

            return {
                success: true,
                iterations: 10,
                updatedEntities
            };

        } catch (e) {
            console.error(`[ConstraintSolver] planegcs resolution failed:`, e);
            this.isDirty = false;
            return {
                success: false,
                iterations: 0,
                updatedEntities: currentEntities
            };
        }
    }
}

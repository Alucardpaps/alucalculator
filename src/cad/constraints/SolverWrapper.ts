import { CadEntity, Constraint } from '../kernel/types';
const wasm_url = '/planegcs.wasm';
import { useCadStore } from '../store/cadStore';

export class SolverWrapper {
    private gcsWrapper: any | null = null;
    private isInitialized = false;

    async init() {
        if (this.isInitialized || typeof window === 'undefined') return;
        try {
            // Dynamically import to avoid build-time/SSR resolution of Node-specific code in @salusoft89/planegcs
            const { init_planegcs_module, GcsWrapper } = await import('@salusoft89/planegcs');
            const mod = await init_planegcs_module({ locateFile: () => wasm_url });
            const gcs = new mod.GcsSystem();
            this.gcsWrapper = new GcsWrapper(gcs);
            this.isInitialized = true;
            console.log("SolverInitialized");
        } catch (e) {
            console.error("Failed to initialize planegcs", e);
        }
    }

    solve(entities: CadEntity[], constraints: Constraint[]): CadEntity[] {
        if (!this.gcsWrapper) return entities;

        const primitives: any[] = [];

        // 1. Map CadEntities to SketchPrimitives
        entities.forEach(entity => {
            const geom = entity.geometry;
            if (geom.type === 'POINT') {
                primitives.push({
                    id: entity.id,
                    type: 'point',
                    x: geom.x,
                    y: geom.y,
                    fixed: entity.isFixed || false
                } as any);
            } else if (geom.type === 'LINE') {
                const p1_id = `${entity.id}_start`;
                const p2_id = `${entity.id}_end`;

                primitives.push({
                    id: p1_id,
                    type: 'point',
                    x: geom.start.x,
                    y: geom.start.y,
                    fixed: false // can be constrained
                } as any);

                primitives.push({
                    id: p2_id,
                    type: 'point',
                    x: geom.end.x,
                    y: geom.end.y,
                    fixed: false
                } as any);

                primitives.push({
                    id: entity.id,
                    type: 'line',
                    p1_id,
                    p2_id
                } as any);
            } else if (geom.type === 'CIRCLE') {
                const c_id = `${entity.id}_center`;
                primitives.push({
                    id: c_id,
                    type: 'point',
                    x: geom.center.x,
                    y: geom.center.y,
                    fixed: false
                } as any);

                primitives.push({
                    id: entity.id,
                    type: 'circle',
                    c_id,
                    radius: geom.radius
                } as any);
                // planegcs also supports arc_rules but let's do circle first
            }
        });

        // 2. Map CadStore constraints to SketchPrimitives
        constraints.forEach(c => {
            if (!c.active) return;

            // COINCIDENT
            if (c.type === 'COINCIDENT' && c.entityIds.length === 2) {
                primitives.push({
                    id: c.id,
                    type: 'p2p_coincident',
                    p1_id: c.entityIds[0],
                    p2_id: c.entityIds[1]
                } as any);
            }
            // HORIZONTAL (p1, p2)
            else if (c.type === 'HORIZONTAL' && c.entityIds.length === 2) {
                primitives.push({
                    id: c.id,
                    type: 'p2p_horizontal_distance',
                    p1_id: c.entityIds[0],
                    p2_id: c.entityIds[1],
                    distance: 0 // effectively horizontal alignment
                } as any);
            }
            // DISTANCE
            else if (c.type === 'DISTANCE' && c.entityIds.length === 2 && c.value !== undefined) {
                primitives.push({
                    id: c.id,
                    type: 'p2p_distance',
                    p1_id: c.entityIds[0],
                    p2_id: c.entityIds[1],
                    distance: c.value
                } as any);
            }
            // PARALLEL
            else if (c.type === 'PARALLEL' && c.entityIds.length === 2) {
                primitives.push({
                    id: c.id,
                    type: 'l2l_parallel',
                    l1_id: c.entityIds[0],
                    l2_id: c.entityIds[1]
                } as any);
            }
            // PERPENDICULAR
            else if (c.type === 'PERPENDICULAR' && c.entityIds.length === 2) {
                primitives.push({
                    id: c.id,
                    type: 'l2l_perpendicular',
                    l1_id: c.entityIds[0],
                    l2_id: c.entityIds[1]
                } as any);
            }
        });

        // 3. Solve
        try {
            this.gcsWrapper.push_primitives_and_params(primitives as any);
            this.gcsWrapper.solve();
            this.gcsWrapper.apply_solution();

            const solvedPrimitives = this.gcsWrapper.sketch_index.get_primitives() as any[];

            // 4. Map back to CAD Entities
            const newEntities = entities.map(entity => {
                const geom = entity.geometry;

                if (geom.type === 'POINT') {
                    const p = solvedPrimitives.find(p => p.id === entity.id);
                    if (p) return { ...entity, geometry: { ...geom, x: p.x, y: p.y } };
                } else if (geom.type === 'LINE') {
                    const p1 = solvedPrimitives.find(p => p.id === `${entity.id}_start`);
                    const p2 = solvedPrimitives.find(p => p.id === `${entity.id}_end`);
                    if (p1 && p2) {
                        return {
                            ...entity,
                            geometry: { ...geom, start: { x: p1.x, y: p1.y }, end: { x: p2.x, y: p2.y } }
                        };
                    }
                } else if (geom.type === 'CIRCLE') {
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
            return newEntities as CadEntity[];
        } catch (e) {
            console.error("Solver exception:", e);
            return entities; // return unmodified if fail
        }
    }
}

export const solverWrapper = new SolverWrapper();

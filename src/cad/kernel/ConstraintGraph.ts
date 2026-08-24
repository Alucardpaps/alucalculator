/**
 * AluCAD — Constraint Graph
 * 
 * Represents constraints as a graph: nodes = geometric entities, edges = constraints.
 * Provides DOF analysis, cluster detection, and sketch state classification.
 * 
 * DOF Calculation:
 *   Point = 2 DOF (x, y)
 *   Line  = 4 DOF (p1.x, p1.y, p2.x, p2.y) — but uses point references
 *   Circle = 3 DOF (center.x, center.y, radius)
 *   Each constraint removes DOF based on its type
 * 
 * Sketch States:
 *   Under-defined: totalDOF > 0 (free entities exist)
 *   Fully defined:  totalDOF = 0 and no conflicts
 *   Over-defined:   too many constraints → solver conflict
 */

import type { Constraint, ConstraintType } from '../constraints/types';
import type { CadEntity } from '../kernel/types';

// ============================================
// TYPES
// ============================================

export interface ConstraintNode {
    entityId: string;
    entityType: string;  // 'LINE' | 'CIRCLE' | 'ARC' | 'POINT' etc.
    /** IDs of variables this entity owns (e.g., x, y for a point) */
    variableCount: number;
    /** IDs of constraints referencing this entity */
    connectedConstraintIds: Set<string>;
}

export interface DOFAnalysis {
    /** Total remaining degrees of freedom */
    totalDOF: number;
    /** Number of active constraints */
    constraintCount: number;
    /** Number of entity variables */
    variableCount: number;
    /** Sketch definition state */
    state: 'under-defined' | 'fully-defined' | 'over-defined';
    /** Entities that have free DOF */
    unconstrainedEntities: string[];
    /** Groups of entities involved in conflicting constraints */
    overConstrainedGroups: string[][];
    /** Per-entity DOF info */
    entityDOF: Map<string, number>;
}

export type SketchState = 'under-defined' | 'fully-defined' | 'over-defined';

// ============================================
// CONSTRAINT DOF MAP
// ============================================

/** How many DOF each constraint type removes */
const CONSTRAINT_DOF_COST: Record<ConstraintType, number> = {
    COINCIDENT: 2,      // Merges two points → removes 2 DOF (x, y)
    HORIZONTAL: 1,      // Fixes Y relationship → removes 1 DOF
    VERTICAL: 1,        // Fixes X relationship → removes 1 DOF
    PARALLEL: 1,        // Angle relationship → removes 1 DOF
    PERPENDICULAR: 1,   // Angle relationship → removes 1 DOF
    TANGENT: 1,         // Geometric contact → removes 1 DOF
    FIXED: 2,           // Locks position → removes 2 DOF per point
    DISTANCE: 1,        // Scalar constraint → removes 1 DOF
    ANGLE: 1,           // Scalar constraint → removes 1 DOF
    EQUAL_LENGTH: 1,    // Relationship → removes 1 DOF
    CONCENTRIC: 2,      // Merges centers → removes 2 DOF
    MIDPOINT: 2,        // Position constraint → removes 2 DOF
    RADIUS: 1,          // Scalar constraint → removes 1 DOF
    DIAMETER: 1,        // Scalar constraint → removes 1 DOF
};

/** How many DOF an entity contributes */
function entityDOFCount(entityType: string): number {
    switch (entityType) {
        case 'LINE': return 4;  // Two endpoints (p1.x, p1.y, p2.x, p2.y)
        case 'CIRCLE': return 3;  // Center (x, y) + radius
        case 'ARC': return 5;  // Center (x, y) + radius + startAngle + endAngle
        case 'POINT': return 2;  // x, y
        case 'POLYLINE': return 2;  // Approximation — depends on vertex count
        default: return 2;
    }
}

// ============================================
// CONSTRAINT GRAPH
// ============================================

export class ConstraintGraph {
    private nodes = new Map<string, ConstraintNode>();
    private edges = new Map<string, Constraint>();

    // -------------------------------------------
    // GRAPH CONSTRUCTION
    // -------------------------------------------

    addNode(entity: CadEntity): void {
        if (this.nodes.has(entity.id)) return;
        this.nodes.set(entity.id, {
            entityId: entity.id,
            entityType: entity.geometry.type,
            variableCount: entityDOFCount(entity.geometry.type),
            connectedConstraintIds: new Set(),
        });
    }

    removeNode(entityId: string): void {
        const node = this.nodes.get(entityId);
        if (!node) return;

        // Remove all constraints referencing this entity
        for (const cId of node.connectedConstraintIds) {
            this.edges.delete(cId);
        }

        this.nodes.delete(entityId);
    }

    addEdge(constraint: Constraint): void {
        this.edges.set(constraint.id, constraint);

        for (const entityId of constraint.entityIds) {
            const node = this.nodes.get(entityId);
            if (node) {
                node.connectedConstraintIds.add(constraint.id);
            }
        }
    }

    removeEdge(constraintId: string): void {
        const constraint = this.edges.get(constraintId);
        if (!constraint) return;

        for (const entityId of constraint.entityIds) {
            const node = this.nodes.get(entityId);
            if (node) {
                node.connectedConstraintIds.delete(constraintId);
            }
        }

        this.edges.delete(constraintId);
    }

    // -------------------------------------------
    // REBUILD FROM STATE
    // -------------------------------------------

    rebuild(entities: CadEntity[], constraints: Constraint[]): void {
        this.nodes.clear();
        this.edges.clear();

        for (const entity of entities) {
            // Skip dimension entities — they're visual, not geometric
            if (entity.geometry.type === 'DIMENSION') continue;
            this.addNode(entity);
        }

        for (const constraint of constraints) {
            if (constraint.active) {
                this.addEdge(constraint);
            }
        }
    }

    // -------------------------------------------
    // DOF ANALYSIS
    // -------------------------------------------

    analyzeDOF(): DOFAnalysis {
        // Count total variables
        let totalVariables = 0;
        const entityDOF = new Map<string, number>();

        for (const [id, node] of this.nodes) {
            totalVariables += node.variableCount;
            entityDOF.set(id, node.variableCount);
        }

        // Count total constraint DOF cost
        let totalConstraintDOF = 0;
        for (const [, constraint] of this.edges) {
            const cost = CONSTRAINT_DOF_COST[constraint.type] ?? 1;
            totalConstraintDOF += cost;

            // Distribute cost across referenced entities
            const perEntity = cost / constraint.entityIds.length;
            for (const entityId of constraint.entityIds) {
                const current = entityDOF.get(entityId) ?? 0;
                entityDOF.set(entityId, current - perEntity);
            }
        }

        const totalDOF = totalVariables - totalConstraintDOF;

        // Unconstrained entities (DOF > 0)
        const unconstrainedEntities: string[] = [];
        for (const [id, dof] of entityDOF) {
            if (dof > 0.5) { // threshold to avoid floating point
                unconstrainedEntities.push(id);
            }
        }

        // Over-constrained detection
        const overConstrainedGroups: string[][] = [];
        if (totalDOF < 0) {
            // Find entities with negative remaining DOF
            const overConstrained: string[] = [];
            for (const [id, dof] of entityDOF) {
                if (dof < -0.5) {
                    overConstrained.push(id);
                }
            }
            if (overConstrained.length > 0) {
                overConstrainedGroups.push(overConstrained);
            }
        }

        // State classification
        let state: SketchState;
        if (totalDOF < -0.5) {
            state = 'over-defined';
        } else if (totalDOF > 0.5) {
            state = 'under-defined';
        } else {
            state = 'fully-defined';
        }

        return {
            totalDOF: Math.max(0, totalDOF),
            constraintCount: this.edges.size,
            variableCount: totalVariables,
            state,
            unconstrainedEntities,
            overConstrainedGroups,
            entityDOF,
        };
    }

    // -------------------------------------------
    // CLUSTER DETECTION (Union-Find)
    // -------------------------------------------

    /**
     * Find connected clusters of entities.
     * Used for partial constraint solving — only solve dirty cluster.
     */
    getConnectedClusters(): string[][] {
        const parent = new Map<string, string>();
        const rank = new Map<string, number>();

        // Initialize union-find
        for (const id of this.nodes.keys()) {
            parent.set(id, id);
            rank.set(id, 0);
        }

        function find(x: string): string {
            if (parent.get(x) !== x) {
                parent.set(x, find(parent.get(x)!));
            }
            return parent.get(x)!;
        }

        function union(a: string, b: string): void {
            const rootA = find(a);
            const rootB = find(b);
            if (rootA === rootB) return;

            const rankA = rank.get(rootA) || 0;
            const rankB = rank.get(rootB) || 0;

            if (rankA < rankB) {
                parent.set(rootA, rootB);
            } else if (rankA > rankB) {
                parent.set(rootB, rootA);
            } else {
                parent.set(rootB, rootA);
                rank.set(rootA, rankA + 1);
            }
        }

        // Union entities connected by constraints
        for (const constraint of this.edges.values()) {
            const ids = constraint.entityIds.filter(id => this.nodes.has(id));
            for (let i = 1; i < ids.length; i++) {
                union(ids[0], ids[i]);
            }
        }

        // Group by root
        const clusters = new Map<string, string[]>();
        for (const id of this.nodes.keys()) {
            const root = find(id);
            if (!clusters.has(root)) {
                clusters.set(root, []);
            }
            clusters.get(root)!.push(id);
        }

        return Array.from(clusters.values());
    }

    // -------------------------------------------
    // QUERIES
    // -------------------------------------------

    getSketchState(): SketchState {
        return this.analyzeDOF().state;
    }

    getConstraintsForEntity(entityId: string): Constraint[] {
        const node = this.nodes.get(entityId);
        if (!node) return [];

        return Array.from(node.connectedConstraintIds)
            .map(id => this.edges.get(id))
            .filter(Boolean) as Constraint[];
    }

    /** Get entity IDs affected by changing a specific entity */
    getAffectedEntities(entityId: string): Set<string> {
        const visited = new Set<string>();
        const queue = [entityId];

        while (queue.length > 0) {
            const current = queue.pop()!;
            if (visited.has(current)) continue;
            visited.add(current);

            const node = this.nodes.get(current);
            if (!node) continue;

            for (const cId of node.connectedConstraintIds) {
                const constraint = this.edges.get(cId);
                if (!constraint) continue;
                for (const eId of constraint.entityIds) {
                    if (!visited.has(eId)) {
                        queue.push(eId);
                    }
                }
            }
        }

        return visited;
    }

    get nodeCount(): number {
        return this.nodes.size;
    }

    get edgeCount(): number {
        return this.edges.size;
    }
}

// ============================================
// SINGLETON
// ============================================

export const constraintGraph = new ConstraintGraph();

/**
 * AluCAD — Dimensional Constraint Solvers
 * 
 * Solvers for EQUAL_LENGTH, RADIUS, DIAMETER, CONCENTRIC, MIDPOINT.
 * All use the same relaxation pattern as existing solvers.
 * 
 * Convention:
 *   - Return error value (distance from satisfied state)
 *   - Mutate entities in-place (relaxation approach)
 *   - entityIds order matters for each constraint type
 */

import type { Constraint, ConstraintSolverFunction } from '../types';
import type { CadEntity, LineGeometry, CircleGeometry, Point } from '../../kernel/types';

// ============================================
// EQUAL LENGTH
// ============================================

/**
 * EQUAL_LENGTH constraint.
 * entityIds: [lineA, lineB]
 * Makes lineB's length equal to lineA's length.
 */
export const solveEqualLength: ConstraintSolverFunction = (
    entities: Map<string, CadEntity>,
    constraint: Constraint
): number => {
    const [idA, idB] = constraint.entityIds;
    const a = entities.get(idA);
    const b = entities.get(idB);

    if (!a || !b) return 0;
    if (a.geometry.type !== 'LINE' || b.geometry.type !== 'LINE') return 0;

    const gA = a.geometry as LineGeometry;
    const gB = b.geometry as LineGeometry;

    const lenA = dist(gA.start, gA.end);
    const lenB = dist(gB.start, gB.end);

    if (lenA < 0.0001 || lenB < 0.0001) return 0;

    const error = Math.abs(lenA - lenB);
    if (error < 0.001) return 0;

    // Scale lineB to match lineA's length
    const ratio = lenA / lenB;
    const midB = mid(gB.start, gB.end);
    const halfNewLen = lenA / 2;

    const dx = gB.end.x - gB.start.x;
    const dy = gB.end.y - gB.start.y;
    const ux = dx / lenB;
    const uy = dy / lenB;

    // Move B's endpoints symmetrically from midpoint
    const factor = 0.3; // Relaxation damping
    gB.start.x += (midB.x - halfNewLen * ux - gB.start.x) * factor;
    gB.start.y += (midB.y - halfNewLen * uy - gB.start.y) * factor;
    gB.end.x += (midB.x + halfNewLen * ux - gB.end.x) * factor;
    gB.end.y += (midB.y + halfNewLen * uy - gB.end.y) * factor;

    return error;
};

// ============================================
// RADIUS
// ============================================

/**
 * RADIUS constraint.
 * entityIds: [circleId]
 * value: target radius
 */
export const solveRadius: ConstraintSolverFunction = (
    entities: Map<string, CadEntity>,
    constraint: Constraint
): number => {
    const entity = entities.get(constraint.entityIds[0]);
    if (!entity || entity.geometry.type !== 'CIRCLE') return 0;

    const geom = entity.geometry as CircleGeometry;
    const targetRadius = constraint.value ?? geom.radius;
    const error = Math.abs(geom.radius - targetRadius);

    if (error < 0.001) return 0;

    // Direct assignment for radius (single scalar variable)
    geom.radius += (targetRadius - geom.radius) * 0.5;

    return error;
};

// ============================================
// DIAMETER
// ============================================

/**
 * DIAMETER constraint.
 * entityIds: [circleId]
 * value: target diameter
 */
export const solveDiameter: ConstraintSolverFunction = (
    entities: Map<string, CadEntity>,
    constraint: Constraint
): number => {
    const entity = entities.get(constraint.entityIds[0]);
    if (!entity || entity.geometry.type !== 'CIRCLE') return 0;

    const geom = entity.geometry as CircleGeometry;
    const targetRadius = (constraint.value ?? geom.radius * 2) / 2;
    const error = Math.abs(geom.radius - targetRadius);

    if (error < 0.001) return 0;

    geom.radius += (targetRadius - geom.radius) * 0.5;

    return error;
};

// ============================================
// CONCENTRIC
// ============================================

/**
 * CONCENTRIC constraint.
 * entityIds: [circleA, circleB]
 * Merges the centers of two circles/arcs.
 */
export const solveConcentric: ConstraintSolverFunction = (
    entities: Map<string, CadEntity>,
    constraint: Constraint
): number => {
    const [idA, idB] = constraint.entityIds;
    const a = entities.get(idA);
    const b = entities.get(idB);

    if (!a || !b) return 0;

    let centerA: Point | null = null;
    let centerB: Point | null = null;

    if (a.geometry.type === 'CIRCLE') centerA = (a.geometry as CircleGeometry).center;
    if (a.geometry.type === 'ARC') centerA = (a.geometry as any).center;
    if (b.geometry.type === 'CIRCLE') centerB = (b.geometry as CircleGeometry).center;
    if (b.geometry.type === 'ARC') centerB = (b.geometry as any).center;

    if (!centerA || !centerB) return 0;

    const error = dist(centerA, centerB);
    if (error < 0.001) return 0;

    // Move both centers toward each other (50/50 split)
    const factor = 0.3;
    const mx = (centerA.x + centerB.x) / 2;
    const my = (centerA.y + centerB.y) / 2;

    centerA.x += (mx - centerA.x) * factor;
    centerA.y += (my - centerA.y) * factor;
    centerB.x += (mx - centerB.x) * factor;
    centerB.y += (my - centerB.y) * factor;

    return error;
};

// ============================================
// MIDPOINT
// ============================================

/**
 * MIDPOINT constraint.
 * entityIds: [pointId, lineId]
 * Constrains a point to lie at the midpoint of a line.
 */
export const solveMidpoint: ConstraintSolverFunction = (
    entities: Map<string, CadEntity>,
    constraint: Constraint
): number => {
    const [pointId, lineId] = constraint.entityIds;
    const pointEntity = entities.get(pointId);
    const lineEntity = entities.get(lineId);

    if (!pointEntity || !lineEntity) return 0;

    // Get point position
    let px: number, py: number;
    if (pointEntity.geometry.type === 'POINT') {
        px = pointEntity.geometry.x;
        py = pointEntity.geometry.y;
    } else {
        return 0;
    }

    // Get line midpoint
    if (lineEntity.geometry.type !== 'LINE') return 0;
    const lineGeom = lineEntity.geometry as LineGeometry;
    const mx = (lineGeom.start.x + lineGeom.end.x) / 2;
    const my = (lineGeom.start.y + lineGeom.end.y) / 2;

    const error = dist({ x: px, y: py }, { x: mx, y: my });
    if (error < 0.001) return 0;

    // Move point toward midpoint
    const factor = 0.4;
    if (pointEntity.geometry.type === 'POINT') {
        pointEntity.geometry.x += (mx - px) * factor;
        pointEntity.geometry.y += (my - py) * factor;
    }

    return error;
};

// ============================================
// HELPERS
// ============================================

function dist(a: Point, b: Point): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function mid(a: Point, b: Point): Point {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

import { ConstraintSolverFunction } from '../types';
import { distance, vector, normalize, dot, scale, add, perpendicular, sub } from '../../kernel/GeometryKernel';
import { CadEntity } from '../../kernel/types';

// ----------------------------------------------------------------------------
// DISTANCE
// ----------------------------------------------------------------------------
export const solveDistance: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const value = constraint.value;

    if (value === undefined) return 0;

    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2) return 0;

    // Helper to get centers/positions
    const p1 = getEntityPoint(e1);
    const p2 = getEntityPoint(e2);

    // Case 1: Point - Point
    // (Both are effectively points for distance measurement, e.g. center of circle, or endpoint)
    // If entities are LINES, what does "Distance" mean? 
    // Usually Distance(Line, Line) = perpendicular distance (must be parallel).
    // Usually Distance(Point, Line) = perp distance.

    if (isPointLike(e1) && isPointLike(e2)) {
        return solveDistancePointPoint(e1, e2, value);
    }

    // Case 2: Point - Line
    if (isPointLike(e1) && e2.geometry.type === 'LINE') {
        return solveDistancePointLine(e1, e2, value);
    }
    if (e1.geometry.type === 'LINE' && isPointLike(e2)) {
        return solveDistancePointLine(e2, e1, value);
    }

    // Case 3: Line - Line (Parallel distance)
    // TODO: Implement later if needed.

    return 0;
};

function isPointLike(e: CadEntity) {
    return e.geometry.type === 'POINT' || e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC';
}

function getEntityPoint(e: CadEntity) {
    if (e.geometry.type === 'POINT') return { x: e.geometry.x, y: e.geometry.y };
    if (e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC') return e.geometry.center;
    // For line, maybe midpoint?
    return { x: 0, y: 0 };
}

function solveDistancePointPoint(e1: CadEntity, e2: CadEntity, targetDist: number): number {
    // Current dist
    const p1 = getEntityPoint(e1);
    const p2 = getEntityPoint(e2);

    const currDist = distance(p1, p2);
    const diff = currDist - targetDist;

    if (Math.abs(diff) < 0.001) return 0;

    // Move e1 and e2 towards/away from each other
    // Direction p1 -> p2
    const v12 = vector(p1, p2);
    const dir = normalize(v12);

    // We want final distance to be targetDist.
    // Move each by diff/2
    const move = scale(dir, diff / 2);

    // e1 moves towards e2 (if diff>0, dist is too large, so move e1 +dir)
    // Wait: v12 is p2 - p1.
    // If we move p1 by +move, we move towards p2.
    // If dist > target, diff > 0. We want p1 to move TOWARDS p2.
    // So move p1 by +dir * (diff/2)
    // And move p2 by -dir * (diff/2) (towards p1)

    // Actually:
    // New P1 = P1 + (dist - target)/2 * dir
    // New P2 = P2 - (dist - target)/2 * dir

    const moveVec = scale(dir, diff / 2);

    if (e1.geometry.type === 'POINT') {
        e1.geometry.x += moveVec.x;
        e1.geometry.y += moveVec.y;
    } else if (e1.geometry.type === 'CIRCLE') {
        e1.geometry.center = add(e1.geometry.center, moveVec);
    }

    if (e2.geometry.type === 'POINT') {
        e2.geometry.x -= moveVec.x;
        e2.geometry.y -= moveVec.y;
    } else if (e2.geometry.type === 'CIRCLE') {
        e2.geometry.center = sub(e2.geometry.center, moveVec);
    }

    return Math.abs(diff);
}

function solveDistancePointLine(point: CadEntity, line: CadEntity, targetDist: number): number {
    const p = getEntityPoint(point);
    const lineGeom = line.geometry as any; // Quick cast
    const lStart = lineGeom.start;
    const lEnd = lineGeom.end;

    // Project p onto line (infinite)
    return 0; // TODO: Implement if needed for V1.
    // For now, V1 Master Prompt focuses on sketching.
    // Usually Distance(Point, Line) is explicit constraint.
}

import { ConstraintSolverFunction } from '../types';
import { distance, vector, normalize, dot, scale, add, perpendicular, sub } from '../../kernel/GeometryKernel';
import { CadEntity } from '../../kernel/types';

// ----------------------------------------------------------------------------
// PARALLEL
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// PARALLEL
// ----------------------------------------------------------------------------
export const solveParallel: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2 || e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return 0;

    const v1 = vector(e1.geometry.start, e1.geometry.end);
    const v2 = vector(e2.geometry.start, e2.geometry.end);

    const n1 = normalize(v1);
    const n2 = normalize(v2);

    const cross = n1.x * n2.y - n1.y * n2.x;

    if (Math.abs(cross) < 0.001) return 0;

    // Symmetric Rotation
    // 1. Determine target common direction
    const dotP = dot(n1, n2);
    // Align n2 to n1's hemisphere for averaging
    const n2Aligned = dotP >= 0 ? n2 : scale(n2, -1);

    // Average vector
    const sum = add(n1, n2Aligned);
    const avg = normalize(sum);

    // Target for e1 is avg
    // Target for e2 is avg (if dotP>=0) or -avg (if dotP<0)
    const target1 = avg;
    const target2 = dotP >= 0 ? avg : scale(avg, -1);

    // Apply rotation e1
    rotateLineToDir(e1, target1);
    // Apply rotation e2
    rotateLineToDir(e2, target2);

    return Math.abs(cross);
};

// ----------------------------------------------------------------------------
// PERPENDICULAR
// ----------------------------------------------------------------------------
export const solvePerpendicular: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2 || e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return 0;

    const v1 = vector(e1.geometry.start, e1.geometry.end);
    const v2 = vector(e2.geometry.start, e2.geometry.end);
    const n1 = normalize(v1);
    const n2 = normalize(v2);

    const dotProd = dot(n1, n2);
    if (Math.abs(dotProd) < 0.001) return 0;

    // We want dotProd = 0.
    // Current angle deviation from 90 degrees?
    // Let's just rotate both towards the ideal relationship.
    // Ideal for e1: perp(e2). Ideal for e2: perp(e1).
    // Average the "perfect e1" with "actual e1"?

    // Better: Rotate e1 by half error, e2 by half error.
    // Current geometric relation.
    // Let's take the bisector of n1 and n2.
    // Inv: The bisector should be at 45 degrees to both if they are perpendicular.

    // Simple approach: 
    // Target for e1 = correct deviation from e2
    // Target for e2 = correct deviation from e1

    // TargetDir1 = perpendicular(n2).
    // TargetDir2 = perpendicular(n1). 

    // Rotate e1 towards TargetDir1 (50%)
    // Rotate e2 towards TargetDir2 (50%)

    // Interpolate n1 towards perpen(n2)
    const t1 = perpendicular(n2);
    if (dot(n1, t1) < 0) { t1.x = -t1.x; t1.y = -t1.y; } // Pick closest perpendicular

    // Slerp/Lerp n1 -> t1 by 0.5?
    // Simply average n1 + t1?
    const nextN1 = normalize(add(n1, t1)); // Halfway

    const t2 = perpendicular(n1);
    if (dot(n2, t2) < 0) { t2.x = -t2.x; t2.y = -t2.y; }
    const nextN2 = normalize(add(n2, t2)); // Halfway

    rotateLineToDir(e1, nextN1);
    rotateLineToDir(e2, nextN2);

    return Math.abs(dotProd);
};

function rotateLineToDir(e: CadEntity, dir: { x: number, y: number }) {
    if (e.geometry.type !== 'LINE') return;
    const center = scale(add(e.geometry.start, e.geometry.end), 0.5);
    const len = distance(e.geometry.start, e.geometry.end);
    const halfLen = len / 2;

    e.geometry.start = {
        x: center.x - dir.x * halfLen,
        y: center.y - dir.y * halfLen
    };
    e.geometry.end = {
        x: center.x + dir.x * halfLen,
        y: center.y + dir.y * halfLen
    };
}

// ----------------------------------------------------------------------------
// ANGLE
// ----------------------------------------------------------------------------
export const solveAngle: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const value = constraint.value; // Expected angle in degrees (or radians, let's say Degrees)

    if (value === undefined) return 0;

    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2 || e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return 0;

    const v1 = vector(e1.geometry.start, e1.geometry.end);
    const v2 = vector(e2.geometry.start, e2.geometry.end);
    const n1 = normalize(v1);
    const n2 = normalize(v2);

    // Current angle
    const a1 = Math.atan2(n1.y, n1.x);
    const a2 = Math.atan2(n2.y, n2.x);

    // We want the difference between angles to be 'value' (in degrees)
    // The constraint value is usually absolute angle difference.
    // Let's assume smallest difference.

    let diffRad = a1 - a2;
    // Normalize to -PI..PI
    while (diffRad <= -Math.PI) diffRad += 2 * Math.PI;
    while (diffRad > Math.PI) diffRad -= 2 * Math.PI;

    const currentDeg = Math.abs(diffRad * 180 / Math.PI);
    const targetDeg = value;

    // We want to change the relative angle by (target - current)
    // But we need to know the SIGN of the rotation.
    // If we just use the difference magnitude, we might rotate the wrong way?
    // Actually, 'Angle' constraint usually implies a specific angle range or just "make them this far apart".
    // Let's rely on simple heuristic: move them towards the target separation.

    // Deviation
    // We want |a1 - a2| = target.
    // If we widen the gap or narrow it.

    // Let's use vector rotation.
    // Target Dir for e1 = Rotate(n2, +value) OR Rotate(n2, -value).
    // Pick closest.

    const tRad = value * Math.PI / 180;

    const t1a = rotateVec(n2, tRad);
    const t1b = rotateVec(n2, -tRad);

    // Which one is closer to n1?
    let targetDir1 = t1a;
    if (dot(n1, t1b) > dot(n1, t1a)) {
        targetDir1 = t1b;
    }

    // Now we have a target direction for e1 (assuming e2 is fixed).
    // We want to rotate e1 HALF way towards targetDir1.
    // And e2 HALF way the opposite.

    // Slerp n1 -> targetDir1 by 0.5
    const nextN1 = normalize(add(n1, targetDir1));

    // For e2, the target is Rotate(n1, +value) or Rotate(n1, -value).
    const t2a = rotateVec(n1, tRad);
    const t2b = rotateVec(n1, -tRad);
    let targetDir2 = t2a;
    if (dot(n2, t2b) > dot(n2, t2a)) {
        targetDir2 = t2b;
    }
    const nextN2 = normalize(add(n2, targetDir2));

    rotateLineToDir(e1, nextN1);
    rotateLineToDir(e2, nextN2);

    return Math.abs(currentDeg - targetDeg);
};

function rotateVec(v: { x: number, y: number }, angleRad: number) {
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    return {
        x: v.x * c - v.y * s,
        y: v.x * s + v.y * c
    };
}

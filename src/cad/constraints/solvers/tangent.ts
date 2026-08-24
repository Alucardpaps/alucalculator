import { ConstraintSolverFunction } from '../types';
import { distance, vector, normalize, dot, scale, add, perpendicular, sub } from '../../kernel/GeometryKernel';
import { CadEntity } from '../../kernel/types';

// ----------------------------------------------------------------------------
// TANGENT
// ----------------------------------------------------------------------------
export const solveTangent: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2) return 0;

    // Case 1: Line - Circle
    if (e1.geometry.type === 'LINE' && (e2.geometry.type === 'CIRCLE' || e2.geometry.type === 'ARC')) {
        return solveTangentLineCircle(e1, e2);
    }
    // Case 2: Circle - Line (Swap)
    if ((e1.geometry.type === 'CIRCLE' || e1.geometry.type === 'ARC') && e2.geometry.type === 'LINE') {
        return solveTangentLineCircle(e2, e1);
    }
    // Case 3: Circle - Circle
    if ((e1.geometry.type === 'CIRCLE' || e1.geometry.type === 'ARC') &&
        (e2.geometry.type === 'CIRCLE' || e2.geometry.type === 'ARC')) {
        return solveTangentCircleCircle(e1, e2);
    }

    return 0; // Not supported combo
};


function solveTangentLineCircle(line: CadEntity, circle: CadEntity): number {
    const geomLine = line.geometry as any;
    const geomCircle = circle.geometry as any;

    const start = geomLine.start;
    const end = geomLine.end;
    const center = geomCircle.center;
    const radius = geomCircle.radius;

    const vLine = vector(start, end);
    const lenLine = distance(start, end);
    if (lenLine < 0.001) return 0;

    const dir = normalize(vLine);
    const vStartCenter = vector(start, center);
    const t = dot(vStartCenter, dir);
    const closestP = add(start, scale(dir, t));

    // Distance from center to line (closest point)
    const dist = distance(center, closestP);
    const diff = dist - radius;

    if (Math.abs(diff) < 0.001) return 0;

    // Vector from closestP to center (Normal to line)
    const vNormal = vector(closestP, center);
    const nNormal = normalize(vNormal);

    // We need to change distance by `diff`.
    // Move center by -diff/2 * nNormal (towards line if diff>0)
    // Move line by +diff/2 * nNormal (towards circle if diff>0)
    // Wait.
    // If diff > 0 (too far), we want to reduce distance.
    // Move center towards line: center -= nNormal * (diff/2)
    // Move line towards center: line += nNormal * (diff/2)

    // Check signs:
    // nNormal points Line -> Center.
    // center new = center - nNormal * (diff/2) -> Moves AGAINST normal (towards line). Correct.
    // line new = line + nNormal * (diff/2) -> Moves WITH normal (towards center). Correct.

    const move = scale(nNormal, diff / 2);

    // Move Circle
    geomCircle.center = sub(center, move);

    // Move Line (translate both points)
    geomLine.start = add(start, move);
    geomLine.end = add(end, move);

    return Math.abs(diff);
}

function solveTangentCircleCircle(c1: CadEntity, c2: CadEntity): number {
    const c1Geom = c1.geometry as any;
    const c2Geom = c2.geometry as any;

    const center1 = c1Geom.center;
    const center2 = c2Geom.center;
    const r1 = c1Geom.radius;
    const r2 = c2Geom.radius;

    const dist = distance(center1, center2);

    const distExternal = r1 + r2;
    const distInternal = Math.abs(r1 - r2);

    const errExt = Math.abs(dist - distExternal);
    const errInt = Math.abs(dist - distInternal);

    let targetDist = distExternal;
    if (resultsAreInternal(dist, distInternal, distExternal)) {
        targetDist = distInternal;
    }

    const diff = dist - targetDist; // Current - Target
    if (Math.abs(diff) < 0.001) return 0;

    // v12 = c2 - c1 (Direction from 1 to 2)
    const v12 = vector(center1, center2);
    const dir = normalize(v12);

    // If diff > 0 (too far), need to bring closer.
    // Move c1 towards c2: c1 += dir * (diff/2)
    // Move c2 towards c1: c2 -= dir * (diff/2)
    // Check: c1 moves +dir (towards c2). Correct.
    // c2 moves -dir (towards c1). Correct.

    const move = scale(dir, diff / 2);

    c1Geom.center = add(center1, move);
    c2Geom.center = sub(center2, move);

    return Math.min(errExt, errInt);
}

// Helper to decide if we should solve for internal or external tangency
function resultsAreInternal(current: number, internal: number, external: number): boolean {
    return Math.abs(current - internal) < Math.abs(current - external);
}

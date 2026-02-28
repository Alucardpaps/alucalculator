import { Constraint, ConstraintSolverFunction } from '../types';
import { distance, add, scale, sub, vector } from '../../kernel/GeometryKernel';
import { CadEntity } from '../../kernel/types';

// ----------------------------------------------------------------------------
// HELPER: Get Point from Entity (Start/End/Center)
// ----------------------------------------------------------------------------
function getPoint(entity: CadEntity, index: number): { x: number, y: number } {
    if (entity.geometry.type === 'POINT') {
        return { x: entity.geometry.x, y: entity.geometry.y };
    }
    if (entity.geometry.type === 'LINE') {
        return index === 0 ? entity.geometry.start : entity.geometry.end;
    }
    if (entity.geometry.type === 'CIRCLE' || entity.geometry.type === 'ARC') {
        return entity.geometry.center;
    }
    return { x: 0, y: 0 };
}

function setPoint(entity: CadEntity, index: number, p: { x: number, y: number }) {
    if (entity.geometry.type === 'POINT') {
        entity.geometry.x = p.x;
        entity.geometry.y = p.y;
    } else if (entity.geometry.type === 'LINE') {
        if (index === 0) entity.geometry.start = p;
        else entity.geometry.end = p;
    } else if (entity.geometry.type === 'CIRCLE' || entity.geometry.type === 'ARC') {
        entity.geometry.center = p;
    }
}

// ----------------------------------------------------------------------------
// COINCIDENT
// ----------------------------------------------------------------------------
export const solveCoincident: ConstraintSolverFunction = (entities, constraint) => {
    const [id1, id2] = constraint.entityIds;
    const e1 = entities.get(id1);
    const e2 = entities.get(id2);

    if (!e1 || !e2) return 0;

    // TODO: We need a way to know WHICH point on the line is constrained.
    // For now, let's assume the constraint IDs might refer to "virtual" points or we check distance.
    // SIMPLE APPROACH: Merge CoG (Center of Geometry) or specific points if encoded.

    // Assumption: For V1, Coincident is strictly Point-to-Point (where points can be endpoints).
    // In a real system, we'd have a topology graph. 
    // Here, we'll try to bring the closest endpoints together.

    // Let's assume the solver strictly passes POINTS (or entities acting as points).
    // If we pass a LINE and a POINT, we project point onto line? No, that's "Point On Object".
    // "Coincident" usually means "Two points are at the same location".

    // Strategy: Move both points to their average position.

    const p1 = getPoint(e1, 0); // Default to start/center
    const p2 = getPoint(e2, 0); // Default to start/center

    // If it's a line, we need to know WHICH endpoint. 
    // This is a limitation of the current ID-only system WITHOUT sub-entity IDs.
    // FIX: We will scan endpoints to find which ones are closest and merge those.

    let bestP1Idx = 0;
    let bestP2Idx = 0;
    let minD = Infinity;

    const points1 = e1.geometry.type === 'LINE' ? [0, 1] : [0];
    const points2 = e2.geometry.type === 'LINE' ? [0, 1] : [0];

    for (let i of points1) {
        for (let j of points2) {
            const d = distance(getPoint(e1, i), getPoint(e2, j));
            if (d < minD) {
                minD = d;
                bestP1Idx = i;
                bestP2Idx = j;
            }
        }
    }

    const targetP1 = getPoint(e1, bestP1Idx);
    const targetP2 = getPoint(e2, bestP2Idx);

    const dist = distance(targetP1, targetP2);
    if (dist < 0.001) return 0; // Converged

    const mid = scale(add(targetP1, targetP2), 0.5);

    // Relaxation: Move both towards mid
    setPoint(e1, bestP1Idx, mid);
    setPoint(e2, bestP2Idx, mid);

    return dist;
};


// ----------------------------------------------------------------------------
// FIXED
// ----------------------------------------------------------------------------
export const solveFixed: ConstraintSolverFunction = (entities, constraint) => {
    const [id] = constraint.entityIds;
    const e = entities.get(id);
    if (!e) return 0;

    // Use value defined in constraint as target, OR initial position if not set
    // For simplicity, we assume the entity should stay where it was when constraint was created.
    // But we need that target position stored.

    // If no value, we can't lock it strictly without storage.
    // Assuming 'value' holds logic or we just skip (User shouldn't drag it).
    // The solver should just REVERT it to its original state?
    // In lightweight solvers, FIXED points just have infinite mass (inverse mass = 0).
    // Here we can force it to a specific coord if provided, else do nothing (it won't move if others move).
    // Actually, other constraints MIGHT move it. So we must force it back.

    // TODO: Store fixed coordinates in constraint.value or separate properties.
    return 0;
};

// ----------------------------------------------------------------------------
// HORIZONTAL / VERTICAL
// ----------------------------------------------------------------------------
export const solveHorizontal: ConstraintSolverFunction = (entities, constraint) => {
    const [id] = constraint.entityIds;
    const e = entities.get(id);
    if (!e || e.geometry.type !== 'LINE') return 0;

    const start = e.geometry.start;
    const end = e.geometry.end;

    const dy = end.y - start.y;
    if (Math.abs(dy) < 0.001) return 0;

    const avgY = (start.y + end.y) / 2;
    e.geometry.start.y = avgY;
    e.geometry.end.y = avgY;

    return Math.abs(dy);
};

export const solveVertical: ConstraintSolverFunction = (entities, constraint) => {
    const [id] = constraint.entityIds;
    const e = entities.get(id);
    if (!e || e.geometry.type !== 'LINE') return 0;

    const start = e.geometry.start;
    const end = e.geometry.end;

    const dx = end.x - start.x;
    if (Math.abs(dx) < 0.001) return 0;

    const avgX = (start.x + end.x) / 2;
    e.geometry.start.x = avgX;
    e.geometry.end.x = avgX;

    return Math.abs(dx);
};

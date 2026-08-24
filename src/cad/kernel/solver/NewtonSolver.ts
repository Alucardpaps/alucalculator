import { SketchModel } from '../SketchModel';
import { Matrix, Vector } from './LinearAlgebra';
import { Constraint, SketchPoint } from '../types';

/**
 * NewtonSolver
 * 
 * Solves the system of non-linear geometric constraints using Gauss-Newton iteration.
 * 
 * Objective: Find variable vector X such that Constraints(X) = 0.
 * Step: DeltaX = -(J^T * J)^-1 * J^T * F(X)
 */
export class NewtonSolver {
    model: SketchModel;
    maxIterations = 50;
    tolerance = 1e-6;

    results = {
        converged: true,
        error: 0,
        iterations: 0,
        overConstrainedIds: [] as string[]
    };

    constructor(model: SketchModel) {
        this.model = model;
    }

    solve(): { converged: boolean; error: number; iterations: number; overConstrainedIds: string[] } {
        const freeVarIds: string[] = [];
        this.model.variables.forEach((v, k) => {
            if (!v.isFixed) freeVarIds.push(k);
        });

        const n = freeVarIds.length;
        if (n === 0) return { converged: true, error: 0, iterations: 0, overConstrainedIds: [] };

        const activeConstraints = Array.from(this.model.constraints.values()).filter(c => c.active);

        let totalEquations = 0;
        activeConstraints.forEach(c => {
            const type = c.type.toUpperCase();
            if (type === 'COINCIDENT' || type === 'CONCENTRIC') totalEquations += 2;
            else totalEquations += 1;
        });

        for (let iter = 0; iter < this.maxIterations; iter++) {
            const J = new Matrix(totalEquations, n);
            const F = new Vector(totalEquations);
            let eqIndex = 0;

            for (const constraint of activeConstraints) {
                const entIds = (constraint as any).entityIds || (constraint as any).entities || [];
                const entities = entIds.map((id: string) => this.model.getEntity(id));
                const type = constraint.type.toUpperCase();

                if (type === 'COINCIDENT') {
                    const p1 = entities[0] as SketchPoint;
                    const p2 = entities[1] as SketchPoint;
                    if (!p1 || !p2) continue;

                    const valX1 = this.model.getVariableValue(p1.x.id);
                    const valX2 = this.model.getVariableValue(p2.x.id);
                    F.set(eqIndex, valX1 - valX2);

                    const idxX1 = freeVarIds.indexOf(p1.x.id);
                    const idxX2 = freeVarIds.indexOf(p2.x.id);
                    if (idxX1 !== -1) J.set(eqIndex, idxX1, 1);
                    if (idxX2 !== -1) J.set(eqIndex, idxX2, -1);
                    eqIndex++;

                    const valY1 = this.model.getVariableValue(p1.y.id);
                    const valY2 = this.model.getVariableValue(p2.y.id);
                    F.set(eqIndex, valY1 - valY2);

                    const idxY1 = freeVarIds.indexOf(p1.y.id);
                    const idxY2 = freeVarIds.indexOf(p2.y.id);
                    if (idxY1 !== -1) J.set(eqIndex, idxY1, 1);
                    if (idxY2 !== -1) J.set(eqIndex, idxY2, -1);
                    eqIndex++;
                }

                else if (type === 'PARALLEL') {
                    const l1 = entities[0] as any;
                    const l2 = entities[1] as any;
                    const p1 = this.model.getPoint(l1.p1)!;
                    const p2 = this.model.getPoint(l1.p2)!;
                    const p3 = this.model.getPoint(l2.p1)!;
                    const p4 = this.model.getPoint(l2.p2)!;

                    const x1 = this.model.getVariableValue(p1.x.id), y1 = this.model.getVariableValue(p1.y.id);
                    const x2 = this.model.getVariableValue(p2.x.id), y2 = this.model.getVariableValue(p2.y.id);
                    const x3 = this.model.getVariableValue(p3.x.id), y3 = this.model.getVariableValue(p3.y.id);
                    const x4 = this.model.getVariableValue(p4.x.id), y4 = this.model.getVariableValue(p4.y.id);

                    const dx1 = x2 - x1, dy1 = y2 - y1;
                    const dx2 = x4 - x3, dy2 = y4 - y3;

                    F.set(eqIndex, dx1 * dy2 - dy1 * dx2);

                    const vars = [p1.x.id, p1.y.id, p2.x.id, p2.y.id, p3.x.id, p3.y.id, p4.x.id, p4.y.id];
                    const derivs = [-dy2, dx2, dy2, -dx2, dy1, -dx1, -dy1, dx1];

                    vars.forEach((vid, i) => {
                        const idx = freeVarIds.indexOf(vid);
                        if (idx !== -1) J.set(eqIndex, idx, J.get(eqIndex, idx) + derivs[i]);
                    });
                    eqIndex++;
                }

                else if (type === 'PERPENDICULAR') {
                    const l1 = entities[0] as any;
                    const l2 = entities[1] as any;
                    const p1 = this.model.getPoint(l1.p1)!;
                    const p2 = this.model.getPoint(l1.p2)!;
                    const p3 = this.model.getPoint(l2.p1)!;
                    const p4 = this.model.getPoint(l2.p2)!;

                    const x1 = this.model.getVariableValue(p1.x.id), y1 = this.model.getVariableValue(p1.y.id);
                    const x2 = this.model.getVariableValue(p2.x.id), y2 = this.model.getVariableValue(p2.y.id);
                    const x3 = this.model.getVariableValue(p3.x.id), y3 = this.model.getVariableValue(p3.y.id);
                    const x4 = this.model.getVariableValue(p4.x.id), y4 = this.model.getVariableValue(p4.y.id);

                    const dx1 = x2 - x1, dy1 = y2 - y1;
                    const dx2 = x4 - x3, dy2 = y4 - y3;

                    F.set(eqIndex, dx1 * dx2 + dy1 * dy2);

                    const vars = [p1.x.id, p1.y.id, p2.x.id, p2.y.id, p3.x.id, p3.y.id, p4.x.id, p4.y.id];
                    const derivs = [-dx2, -dy2, dx2, dy2, -dx1, -dy1, dx1, dy1];

                    vars.forEach((vid, i) => {
                        const idx = freeVarIds.indexOf(vid);
                        if (idx !== -1) J.set(eqIndex, idx, J.get(eqIndex, idx) + derivs[i]);
                    });
                    eqIndex++;
                }

                else if (type === 'DISTANCE') {
                    const p1 = entities[0] as SketchPoint;
                    const p2 = entities[1] as SketchPoint;
                    const L = constraint.value ?? 0;

                    const x1 = this.model.getVariableValue(p1.x.id), y1 = this.model.getVariableValue(p1.y.id);
                    const x2 = this.model.getVariableValue(p2.x.id), y2 = this.model.getVariableValue(p2.y.id);

                    const dx = x1 - x2, dy = y1 - y2;
                    F.set(eqIndex, dx * dx + dy * dy - L * L);

                    const idxX1 = freeVarIds.indexOf(p1.x.id), idxX2 = freeVarIds.indexOf(p2.x.id);
                    const idxY1 = freeVarIds.indexOf(p1.y.id), idxY2 = freeVarIds.indexOf(p2.y.id);

                    if (idxX1 !== -1) J.set(eqIndex, idxX1, 2 * dx);
                    if (idxX2 !== -1) J.set(eqIndex, idxX2, -2 * dx);
                    if (idxY1 !== -1) J.set(eqIndex, idxY1, 2 * dy);
                    if (idxY2 !== -1) J.set(eqIndex, idxY2, -2 * dy);
                    eqIndex++;
                }

                else if (type === 'EQUAL_LENGTH') {
                    const l1 = entities[0] as any, l2 = entities[1] as any;
                    const p1 = this.model.getPoint(l1.p1)!, p2 = this.model.getPoint(l1.p2)!;
                    const p3 = this.model.getPoint(l2.p1)!, p4 = this.model.getPoint(l2.p2)!;

                    const dx1 = this.model.getVariableValue(p1.x.id) - this.model.getVariableValue(p2.x.id);
                    const dy1 = this.model.getVariableValue(p1.y.id) - this.model.getVariableValue(p2.y.id);
                    const dx2 = this.model.getVariableValue(p3.x.id) - this.model.getVariableValue(p4.x.id);
                    const dy2 = this.model.getVariableValue(p3.y.id) - this.model.getVariableValue(p4.y.id);

                    F.set(eqIndex, (dx1 * dx1 + dy1 * dy1) - (dx2 * dx2 + dy2 * dy2));

                    const vars = [p1.x.id, p1.y.id, p2.x.id, p2.y.id, p3.x.id, p3.y.id, p4.x.id, p4.y.id];
                    const derivs = [2 * dx1, 2 * dy1, -2 * dx1, -2 * dy1, -2 * dx2, -2 * dy2, 2 * dx2, 2 * dy2];
                    vars.forEach((vid, i) => {
                        const idx = freeVarIds.indexOf(vid);
                        if (idx !== -1) J.set(eqIndex, idx, J.get(eqIndex, idx) + derivs[i]);
                    });
                    eqIndex++;
                }

                else if (type === 'CONCENTRIC') {
                    const c1 = entities[0] as any, c2 = entities[1] as any;
                    const p1 = this.model.getPoint(c1.type === 'point' ? c1.id : c1.center)!;
                    const p2 = this.model.getPoint(c2.type === 'point' ? c2.id : c2.center)!;

                    [p1.x.id, p1.y.id].forEach((vid, i) => {
                        const targetVid = i === 0 ? p2.x.id : p2.y.id;
                        F.set(eqIndex, this.model.getVariableValue(vid) - this.model.getVariableValue(targetVid));
                        const idx1 = freeVarIds.indexOf(vid), idx2 = freeVarIds.indexOf(targetVid);
                        if (idx1 !== -1) J.set(eqIndex, idx1, 1);
                        if (idx2 !== -1) J.set(eqIndex, idx2, -1);
                        eqIndex++;
                    });
                }

                else if (type === 'TANGENT') {
                    const l = entities[0] as any, c = entities[1] as any;
                    const p1 = this.model.getPoint(l.p1)!, p2 = this.model.getPoint(l.p2)!;
                    const pc = this.model.getPoint(c.center)!, R = this.model.getVariableValue(c.radius.id);

                    const x1 = this.model.getVariableValue(p1.x.id), y1 = this.model.getVariableValue(p1.y.id);
                    const x2 = this.model.getVariableValue(p2.x.id), y2 = this.model.getVariableValue(p2.y.id);
                    const xc = this.model.getVariableValue(pc.x.id), yc = this.model.getVariableValue(pc.y.id);

                    const A = y1 - y2, B = x2 - x1, C = x1 * y2 - x2 * y1;
                    const num = A * xc + B * yc + C, distSq = A * A + B * B;
                    F.set(eqIndex, num * num - R * R * distSq);

                    const idxXc = freeVarIds.indexOf(pc.x.id), idxYc = freeVarIds.indexOf(pc.y.id);
                    if (idxXc !== -1) J.set(eqIndex, idxXc, 2 * num * A);
                    if (idxYc !== -1) J.set(eqIndex, idxYc, 2 * num * B);
                    eqIndex++;
                }

                else if (type === 'ANGLE') {
                    const l1 = entities[0] as any, l2 = entities[1] as any;
                    const p1 = this.model.getPoint(l1.p1)!, p2 = this.model.getPoint(l1.p2)!;
                    const p3 = this.model.getPoint(l2.p1)!, p4 = this.model.getPoint(l2.p2)!;
                    const angleRad = (constraint.value ?? 0) * (Math.PI / 180);

                    const dx1 = this.model.getVariableValue(p2.x.id) - this.model.getVariableValue(p1.x.id);
                    const dy1 = this.model.getVariableValue(p2.y.id) - this.model.getVariableValue(p1.y.id);
                    const dx2 = this.model.getVariableValue(p4.x.id) - this.model.getVariableValue(p3.x.id);
                    const dy2 = this.model.getVariableValue(p4.y.id) - this.model.getVariableValue(p3.y.id);

                    const L1 = Math.sqrt(dx1 * dx1 + dy1 * dy1), L2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    F.set(eqIndex, (dx1 * dx2 + dy1 * dy2) - L1 * L2 * Math.cos(angleRad));
                    eqIndex++;
                }
            }

            // --- Over-constrained Detection (Rank Analysis) ---
            const rank = Matrix.getRank(J);
            const overConstrainedIds: string[] = [];
            if (rank < totalEquations) {
                // Simplified: if rank < equations, the system is over-constrained
                // In a production solver, we'd use QR column pivoting to identify EXACTLY which rows.
                // For now, we flag the system status.
                // console.warn(`System Over-constrained: Rank ${rank} < Equations ${totalEquations}`);
            }

            const error = F.norm();
            if (error < this.tolerance) {
                return { converged: true, error, iterations: iter + 1, overConstrainedIds };
            }

            const JT = Matrix.transpose(J);
            const A = Matrix.multiply(JT, J);
            const b = Matrix.multiplyVector(JT, F);
            for (let i = 0; i < b.data.length; i++) b.set(i, -b.get(i));

            const lambda = 1e-4;
            for (let i = 0; i < A.rows; i++) A.set(i, i, A.get(i, i) + lambda);

            try {
                const deltaX = Matrix.solveLinearSystem(A, b);
                freeVarIds.forEach((id, i) => {
                    this.model.updateVariable(id, this.model.getVariableValue(id) + deltaX.get(i));
                });
            } catch (e) {
                console.error("Solver Singular Matrix", e);
                return { converged: false, error: F.norm(), iterations: iter + 1, overConstrainedIds: [] };
            }
        }
        return { converged: false, error: 0, iterations: this.maxIterations, overConstrainedIds: [] };
    }
}

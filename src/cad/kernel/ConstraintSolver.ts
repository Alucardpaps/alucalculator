/**
 * AluCAD - Geometric Constraint Solver (Orchestrator)
 * 
 * Determines entity positions based on geometric rules.
 * Delegates to modular solvers in `src/cad/constraints/solvers/`.
 * 
 * Implementation uses a relaxation iterative approach.
 */

import { CadEntity, Constraint } from './types';
import { solveCoincident, solveHorizontal, solveVertical, solveFixed } from '../constraints/solvers/basic';
import { solveParallel, solvePerpendicular, solveAngle } from '../constraints/solvers/linear';
import { solveTangent } from '../constraints/solvers/tangent';
import { solveDistance } from '../constraints/solvers/distance';
import { ConstraintSolverFunction } from '../constraints/types';

export class ConstraintSolver {
    private constraints: Constraint[] = [];
    private entities: Map<string, CadEntity> = new Map();
    private iterations = 500; // Increased iterations for stability
    private epsilon = 0.05; // Pixel tolerance

    constructor() { }

    public addConstraint(constraint: Constraint) {
        this.constraints.push(constraint);
    }

    public removeConstraint(id: string) {
        this.constraints = this.constraints.filter(c => c.id !== id);
    }

    public clearConstraints() {
        this.constraints = [];
    }

    public setConstraints(constraints: Constraint[]) {
        this.constraints = [...constraints];
    }

    public solve(entities: CadEntity[]): CadEntity[] {
        // Clone entities for mutation
        const solvedEntities = entities.map(e => ({
            ...e,
            geometry: { ...e.geometry }
        } as CadEntity));

        // Also clone vertices for Polyline if exists
        solvedEntities.forEach(e => {
            if (e.geometry.type === 'POLYLINE') {
                e.geometry.vertices = e.geometry.vertices.map(v => ({ ...v }));
            }
        });

        this.entities.clear();
        solvedEntities.forEach(e => this.entities.set(e.id, e));

        // Capture initial state for FIXED entities
        const fixedSnapshots = new Map<string, any>();
        this.constraints.forEach(c => {
            if (c.type === 'FIXED' && c.active) {
                c.entityIds.forEach(id => {
                    const e = this.entities.get(id);
                    if (e) {
                        // Deep clone geometry
                        fixedSnapshots.set(id, JSON.parse(JSON.stringify(e.geometry)));
                    }
                });
            }
        });

        // Relaxation Loop
        for (let i = 0; i < this.iterations; i++) {
            let maxError = 0;
            let totalError = 0;

            for (const constraint of this.constraints) {
                if (!constraint.active) continue;

                const error = this.dispatchConstraint(constraint);

                // Track max error to check convergence
                if (error > maxError) maxError = error;
                totalError += error;
            }

            // ENFORCE FIXED CONSTRAINTS
            // Reset fixed entities to their original geometry
            fixedSnapshots.forEach((geom, id) => {
                const e = this.entities.get(id);
                if (e) {
                    e.geometry = JSON.parse(JSON.stringify(geom));
                }
            });

            // Early exit if converged
            if (maxError < this.epsilon) {
                break;
            }
        }

        return solvedEntities;
    }

    private dispatchConstraint(c: Constraint): number {
        let solver: ConstraintSolverFunction | undefined;

        switch (c.type) {
            case 'COINCIDENT': solver = solveCoincident; break;
            case 'HORIZONTAL': solver = solveHorizontal; break;
            case 'VERTICAL': solver = solveVertical; break;

            case 'FIXED':
                // Handled in main loop
                return 0;

            case 'PARALLEL': solver = solveParallel; break;
            case 'PERPENDICULAR': solver = solvePerpendicular; break;
            case 'ANGLE': solver = solveAngle; break;

            case 'TANGENT': solver = solveTangent; break;

            case 'DISTANCE': solver = solveDistance; break;

            default:
                // console.warn('Unknown constraint type:', c.type);
                return 0;
        }

        if (solver) {
            try {
                const error = solver(this.entities, c);
                if (Number.isNaN(error)) {
                    console.error(`Constraint ${c.id} (${c.type}) produced NaN error.`);
                    return 0;
                }
                return error;
            } catch (e) {
                console.error(`Error solving constraint ${c.id}:`, e);
                return 0;
            }
        }
        return 0;
    }
}

export const constraintSolver = new ConstraintSolver();

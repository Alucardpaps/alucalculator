/**
 * useSketchSolver — Hybrid Solver Hook
 * 
 * Maintains both the legacy NewtonSolver (for parametric sketch model)
 * and the new SolverV2 (for constraint relaxation on CadEntities).
 * 
 * Provides:
 *   - Legacy solver for SketchModel-based parametric operations
 *   - SolverV2 for entity-level constraint solving
 *   - DOF analysis and sketch state via ConstraintGraph
 *   - Auto-solve on constraint changes
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { SketchModel } from '../kernel/SketchModel';
import { NewtonSolver } from '../kernel/solver/NewtonSolver';
import { SketchPoint, SketchLine, ConstraintType, EntityId } from '../kernel/types';
import { useCadStore } from '../store/cadStore';
import { ConstraintSolverV2, solverV2 } from '../kernel/solver/SolverV2';

export function useSketchSolver() {
    // Persistent model logic (non-reactive)
    const modelRef = useRef<SketchModel>(new SketchModel());
    const solverRef = useRef<NewtonSolver>(new NewtonSolver(modelRef.current));

    // Reactive state for UI rendering
    const [entities, setEntities] = useState<{
        points: SketchPoint[];
        lines: SketchLine[];
    }>({ points: [], lines: [] });

    const [solverStats, setSolverStats] = useState<{
        iterations: number;
        error: number;
        converged: boolean;
        sketchState?: string;
        dof?: number;
        timeMs?: number;
    }>({ iterations: 0, error: 0, converged: true });

    // --------------------------------------------------------
    // SYNC
    // --------------------------------------------------------
    const syncState = useCallback(() => {
        const model = modelRef.current;
        setEntities({
            points: Array.from(model.points.values()),
            lines: Array.from(model.lines.values())
        });
    }, []);

    // --------------------------------------------------------
    // V2 SOLVER: Entity-level constraint solving
    // --------------------------------------------------------
    const solveV2 = useCallback(() => {
        const { entities: storeEntities, constraints } = useCadStore.getState();
        if (constraints.length === 0) return;

        const result = solverV2.solve(storeEntities, constraints);

        // Update entities in store with solved positions
        if (result.modifiedEntityIds.length > 0) {
            useCadStore.setState({ entities: result.solvedEntities });
        }

        setSolverStats({
            iterations: result.iterations,
            error: result.error,
            converged: result.converged,
            sketchState: result.sketchState,
            dof: result.dofAnalysis.totalDOF,
            timeMs: result.timeMs,
        });
    }, []);

    // --------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------

    const addPoint = useCallback((x: number, y: number, fixed = false) => {
        modelRef.current.addPoint(x, y, fixed);
        syncState();
    }, [syncState]);

    const addLine = useCallback((p1Id: string, p2Id: string) => {
        modelRef.current.addLine(p1Id, p2Id);
        syncState();
    }, [syncState]);

    const addConstraint = useCallback((type: ConstraintType, entityIds: EntityId[], value?: number) => {
        modelRef.current.addConstraint(type, entityIds, value);

        // Newton solver for SketchModel
        const result = solverRef.current.solve();
        setSolverStats({
            iterations: result.iterations,
            error: result.error,
            converged: result.converged
        });

        syncState();

        // Also run V2 solver on store entities
        solveV2();
    }, [syncState, solveV2]);

    const dragPoint = useCallback((pointId: string, newX: number, newY: number) => {
        const model = modelRef.current;
        const point = model.getPoint(pointId);

        if (point) {
            model.variables.get(point.x.id)!.value = newX;
            model.variables.get(point.y.id)!.value = newY;

            const result = solverRef.current.solve();
            setSolverStats({
                iterations: result.iterations,
                error: result.error,
                converged: result.converged
            });

            syncState();

            // Mark dirty and re-solve V2
            solverV2.markDirty([pointId]);
            solveV2();
        }
    }, [syncState, solveV2]);

    // Initial sync
    useEffect(() => {
        syncState();
    }, [syncState, addConstraint, solveV2]);

    return {
        entities,
        solverStats,
        addPoint,
        addLine,
        addConstraint,
        dragPoint,
        solveV2,
        model: modelRef.current
    };
}

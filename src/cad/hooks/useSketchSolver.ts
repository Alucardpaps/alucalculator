import { useState, useRef, useCallback, useEffect } from 'react';
import { SketchModel } from '../kernel/SketchModel';
import { NewtonSolver } from '../kernel/solver/NewtonSolver';
import { SketchPoint, SketchLine, ConstraintType, EntityId } from '../kernel/types';
import { useCadStore } from '../store/cadStore';

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

        // Auto-solve when constraint added
        const result = solverRef.current.solve();
        setSolverStats({
            iterations: result.iterations,
            error: result.error,
            converged: result.converged
        });

        syncState();
    }, [syncState]);

    const dragPoint = useCallback((pointId: string, newX: number, newY: number) => {
        const model = modelRef.current;
        const point = model.getPoint(pointId);

        if (point) {
            // Update variables directly
            model.variables.get(point.x.id)!.value = newX;
            model.variables.get(point.y.id)!.value = newY;

            // Solve to satisfy constraints
            // TODO: In a real drag, we might want to temporarily "fix" the dragged point
            // or add a temporary constraint. For now, we just set values and solve.
            const result = solverRef.current.solve();

            setSolverStats({
                iterations: result.iterations,
                error: result.error,
                converged: result.converged
            });

            syncState();
        }
    }, [syncState]);

    // Initial sync and register interface
    useEffect(() => {
        syncState();

        // Register solver control to store
        useCadStore.getState().setSolverInterface({
            addConstraint,
            dragPoint,
            solve: () => {
                const result = solverRef.current.solve();
                setSolverStats({
                    iterations: result.iterations,
                    error: result.error,
                    converged: result.converged
                });
                syncState();
            }
        });

        // Cleanup
        return () => {
            useCadStore.getState().setSolverInterface(null);
        };
    }, [syncState, addConstraint]);

    return {
        entities,
        solverStats,
        addPoint,
        addLine,
        addConstraint,
        dragPoint,
        model: modelRef.current
    };
}

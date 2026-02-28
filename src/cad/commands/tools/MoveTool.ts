
import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class MoveTool extends BaseCommand {
    public id = 'MOVE';
    public name = 'MOVE';
    public displayName = 'Move';

    private draggingPointId: string | null = null;

    start(): void {
        const { selectedIds, entities } = useCadStore.getState();

        // If something is selected, start dragging the first selected point
        // Or if it's a line, dragging its endpoint (simplified for now)
        const point = entities.find(e => e.id === selectedIds[0] && e.geometry.type === 'POINT');
        if (point) {
            this.draggingPointId = point.id;
            this.setPrompt('Dragging point...');
        } else {
            this.setPrompt('Select a point to move');
            this.cancel();
        }
    }

    onMouseMove(point: Point): void {
        if (this.draggingPointId) {
            const solver = useCadStore.getState().solverInterface;
            if (solver) {
                // Real-time Solve!
                solver.dragPoint(this.draggingPointId, point.x, point.y);
            }
        }
    }

    onPointInput(point: Point): void {
        // Finish move on click
        this.draggingPointId = null;
        useCadStore.getState().setActiveCommand(null);
    }

    cancel(): void {
        this.draggingPointId = null;
        super.cancel();
    }
}

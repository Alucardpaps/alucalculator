
import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { sub } from '../../kernel/GeometryKernel';

export class CopyTool extends BaseCommand {
    public id = 'COPY';
    public name = 'COPY';
    public displayName = 'Copy';

    private basePoint: Point | null = null;
    private ghostEntities: any[] = [];

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length === 0) {
            this.setPrompt('Select objects to copy first');
            this.cancel();
            return;
        }
        this.setPrompt('Specify base point');
    }

    onMouseMove(point: Point): void {
        if (this.basePoint) {
            // Visualize copy
            // Current "previewEntity" logic in store is singular.
            // We might need a better way to preview multiple moving entities.
            // For now, let's just rely on the final placement or try to use previewEntity for at least one.
        }
    }

    onPointInput(point: Point): void {
        if (!this.basePoint) {
            this.basePoint = point;
            this.setPrompt('Specify second point');
        } else {
            // Execute Copy
            const vector = sub(point, this.basePoint);
            const { selectedIds, entities, addEntity } = useCadStore.getState();

            const toCopy = entities.filter(e => selectedIds.includes(e.id));

            toCopy.forEach(entity => {
                const copy = Transformer.copy(entity, vector);
                addEntity(copy);
            });

            this.cancel();
        }
    }

    cancel(): void {
        this.basePoint = null;
        super.cancel();
    }
}

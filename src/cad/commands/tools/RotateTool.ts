
import { BaseCommand } from '../BaseCommand';
import { Point } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { Transformer } from '../../kernel/Transformer';
import { vector } from '../../kernel/GeometryKernel';

export class RotateTool extends BaseCommand {
    public id = 'ROTATE';
    public name = 'ROTATE';
    public displayName = 'Rotate';

    private centerPoint: Point | null = null;

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length === 0) {
            this.setPrompt('Select objects to rotate first');
            this.cancel();
            return;
        }
        this.setPrompt('Specify base point (center)');
    }

    onMouseMove(point: Point): void {
        // Preview logic would go here
    }

    onPointInput(point: Point): void {
        if (!this.centerPoint) {
            this.centerPoint = point;
            this.setPrompt('Specify rotation angle (or click point)');
        } else {
            // Calculate angle from center to point
            const v = vector(this.centerPoint, point);
            const angleRad = Math.atan2(v.y, v.x);

            // Execute Rotate
            this.applyRotation(angleRad);
        }
    }

    onValueInput(value: string): void {
        if (this.centerPoint) {
            const angleDeg = parseFloat(value);
            if (!isNaN(angleDeg)) {
                this.applyRotation(angleDeg * Math.PI / 180);
            }
        }
    }

    private applyRotation(angleRad: number) {
        if (!this.centerPoint) return;

        const { selectedIds, entities, updateEntity } = useCadStore.getState();
        const toRotate = entities.filter(e => selectedIds.includes(e.id));

        toRotate.forEach(entity => {
            const rotated = Transformer.rotate(entity, this.centerPoint!, angleRad);
            updateEntity(entity.id, rotated);
        });

        this.cancel();
    }

    cancel(): void {
        this.centerPoint = null;
        super.cancel();
    }
}

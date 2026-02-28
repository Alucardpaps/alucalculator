
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createCircleEntity } from '../../kernel/types';
import { distance } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';

export class CircleTool extends BaseCommand {
    public id = 'CIRCLE';
    public name = 'CIRCLE';
    public displayName = 'Circle';

    private centerPoint: Point | null = null;
    private currentPoint: Point | null = null;

    start(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        this.setPrompt('Specify center point for circle:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.centerPoint) {
            const radius = distance(this.centerPoint, point);

            // Update preview
            const previewCircle = createCircleEntity(
                this.centerPoint,
                radius,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewCircle);
        }
    }

    onPointInput(point: Point): void {
        if (!this.centerPoint) {
            // First point: Center
            this.centerPoint = point;
            this.setPrompt('Specify radius of circle:');
        } else {
            // Second point: Radius definition
            const radius = distance(this.centerPoint, point);

            const layerId = useCadStore.getState().activeLayerId;
            const circle = createCircleEntity(this.centerPoint, radius, layerId, '#ffffff');

            useCadStore.getState().addEntity(circle);

            // Command finished, restart for next circle or finish?
            // AutoCAD usually finishes circles after one. But repeating is useful.
            // Let's restart.
            this.centerPoint = null;
            this.setPrompt('Specify center point for circle:');

            // Clear preview until next move
            // useCadStore.getState().setPreviewEntity(null); 
            // Better to let onMouseMove handle it, but since centerPoint is null now, 
            // we should clear preview to avoid ghost circle.
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    cancel(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

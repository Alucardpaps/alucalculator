
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createPolylineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class RectangleTool extends BaseCommand {
    public id = 'RECTANGLE';
    public name = 'RECTANGLE';
    public displayName = 'Rectangle';

    private startPoint: Point | null = null;
    private currentPoint: Point | null = null;

    start(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.setPrompt('Specify first corner point:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.startPoint) {
            // Update preview
            const vertices = [
                this.startPoint,
                { x: point.x, y: this.startPoint.y },
                point,
                { x: this.startPoint.x, y: point.y }
            ];

            const previewRect = createPolylineEntity(
                vertices,
                true, // closed
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewRect);
        }
    }

    onPointInput(point: Point): void {
        if (!this.startPoint) {
            // First corner
            this.startPoint = point;
            this.setPrompt('Specify other corner point:');
        } else {
            // Second corner - Create Rectangle
            const vertices = [
                this.startPoint,
                { x: point.x, y: this.startPoint.y },
                point,
                { x: this.startPoint.x, y: point.y }
            ];

            const layerId = useCadStore.getState().activeLayerId;
            const rect = createPolylineEntity(vertices, true, layerId, '#ffffff');

            useCadStore.getState().addEntity(rect);

            // Restart command
            this.startPoint = null;
            this.setPrompt('Specify first corner point:');
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

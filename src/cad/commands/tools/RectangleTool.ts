
import { BaseCommand } from '../BaseCommand';
import { Point, createRectangleEntity } from '../../kernel/types';
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
            const width = Math.abs(point.x - this.startPoint.x);
            const height = Math.abs(point.y - this.startPoint.y);
            const center = {
                x: (this.startPoint.x + point.x) / 2,
                y: (this.startPoint.y + point.y) / 2
            };

            const previewRect = createRectangleEntity(
                center,
                width,
                height,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewRect);
        }
    }

    onPointInput(point: Point): void {
        if (!this.startPoint) {
            this.startPoint = point;
            this.setPrompt('Specify other corner point:');
        } else {
            const width = Math.abs(point.x - this.startPoint.x);
            const height = Math.abs(point.y - this.startPoint.y);
            const center = {
                x: (this.startPoint.x + point.x) / 2,
                y: (this.startPoint.y + point.y) / 2
            };

            const layerId = useCadStore.getState().activeLayerId;
            const rect = createRectangleEntity(center, width, height, layerId, '#ffffff');

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

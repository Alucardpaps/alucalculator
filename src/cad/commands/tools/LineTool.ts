
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

export class LineTool extends BaseCommand {
    public id = 'LINE';
    public name = 'LINE';
    public displayName = 'Line';

    private startPoint: Point | null = null;
    private currentPoint: Point | null = null;

    start(): void {
        this.startPoint = null;
        this.currentPoint = null;
        this.setPrompt('Specify first point:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.startPoint) {
            // Update rubber band
            const previewLine = createLineEntity(
                this.startPoint,
                point,
                useCadStore.getState().activeLayerId,
                '#cccccc' // Preview color
            );
            useCadStore.getState().setPreviewEntity(previewLine);
        }
    }

    onPointInput(point: Point): void {
        if (!this.startPoint) {
            // First point
            this.startPoint = point;
            this.setPrompt('Specify next point:');
        } else {
            // Second point - Create Line
            const layerId = useCadStore.getState().activeLayerId;
            const line = createLineEntity(this.startPoint, point, layerId, '#ffffff');

            useCadStore.getState().addEntity(line);

            // Chain: start next line from end of this one
            this.startPoint = point;
            this.setPrompt('Specify next point:');

            // Reset preview to start at new point
            const previewLine = createLineEntity(
                this.startPoint,
                point,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewLine);
        }
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    // Render elastic band - handled by previewEntity now
    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        // No-op
    }
}

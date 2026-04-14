
import { BaseCommand } from '../BaseCommand';
import { Point, createHexagonEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

/**
 * HexagonTool — Draws a regular hexagon by center + radius.
 * 
 * Step 1: Click to set center point.
 * Step 2: Click (or type value) to set circumscribed radius.
 */
export class HexagonTool extends BaseCommand {
    public id = 'HEXAGON';
    public name = 'HEXAGON';
    public displayName = 'Hexagon';

    private centerPoint: Point | null = null;
    private currentPoint: Point | null = null;

    start(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        this.setPrompt('Specify center point:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.centerPoint) {
            const dx = point.x - this.centerPoint.x;
            const dy = point.y - this.centerPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);

            const previewHex = createHexagonEntity(
                this.centerPoint,
                radius,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewHex);
        }
    }

    onPointInput(point: Point): void {
        if (!this.centerPoint) {
            this.centerPoint = point;
            this.setPrompt('Specify radius (or click):');
        } else {
            const dx = point.x - this.centerPoint.x;
            const dy = point.y - this.centerPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);

            if (radius < 0.01) {
                this.setPrompt('Radius too small. Specify radius:');
                return;
            }

            const layerId = useCadStore.getState().activeLayerId;
            const hex = createHexagonEntity(this.centerPoint, radius, layerId, '#ffffff');
            useCadStore.getState().addEntity(hex);

            // Restart
            this.centerPoint = null;
            this.setPrompt('Specify center point:');
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    onValueInput(value: string): void {
        if (this.centerPoint) {
            const radius = parseFloat(value.trim());
            if (!isNaN(radius) && radius > 0) {
                const layerId = useCadStore.getState().activeLayerId;
                const hex = createHexagonEntity(this.centerPoint, radius, layerId, '#ffffff');
                useCadStore.getState().addEntity(hex);

                this.centerPoint = null;
                this.setPrompt('Specify center point:');
                useCadStore.getState().setPreviewEntity(null);
                return;
            }
        }
        super.onValueInput(value);
    }

    cancel(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

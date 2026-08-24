
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
            this.centerPoint = point;
            this.setPrompt('Specify radius (click or type value):');
        } else {
            const radius = distance(this.centerPoint, point);
            this.createCircle(radius);
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // If center not set yet, try as coordinates
        if (!this.centerPoint) {
            const parts = trimmed.split(',');
            if (parts.length === 2) {
                const x = parseFloat(parts[0].trim());
                const y = parseFloat(parts[1].trim());
                if (!isNaN(x) && !isNaN(y)) {
                    this.centerPoint = { x, y };
                    this.setPrompt('Specify radius (click or type value):');
                    return;
                }
            }
            useCadStore.getState().setCommandPrompt('Invalid center point. Use x,y format.');
            return;
        }

        // Center is set — expect radius value
        const radius = parseFloat(trimmed);
        if (!isNaN(radius) && radius > 0) {
            this.createCircle(radius);
        } else {
            // Could be x,y for radius point
            const parts = trimmed.split(',');
            if (parts.length === 2) {
                const x = parseFloat(parts[0].trim());
                const y = parseFloat(parts[1].trim());
                if (!isNaN(x) && !isNaN(y)) {
                    const r = distance(this.centerPoint, { x, y });
                    this.createCircle(r);
                    return;
                }
            }
            useCadStore.getState().setCommandPrompt('Invalid radius. Type a number or click.');
        }
    }

    private createCircle(radius: number): void {
        if (!this.centerPoint) return;

        const layerId = useCadStore.getState().activeLayerId;
        const circle = createCircleEntity(this.centerPoint, radius, layerId, '#ffffff');
        useCadStore.getState().addEntity(circle);

        // Restart
        this.centerPoint = null;
        this.currentPoint = null;
        this.setPrompt('Specify center point for circle:');
        useCadStore.getState().setPreviewEntity(null);
    }

    cancel(): void {
        this.centerPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

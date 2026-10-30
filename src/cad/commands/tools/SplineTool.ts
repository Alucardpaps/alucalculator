import { BaseCommand } from '../BaseCommand';
import { Point, createSplineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { distance } from '../../kernel/GeometryKernel';

export class SplineTool extends BaseCommand {
    public id = 'SPLINE';
    public name = 'SPLINE';
    public displayName = 'Spline';

    private points: Point[] = [];
    private currentPoint: Point | null = null;

    start(): void {
        this.points = [];
        this.currentPoint = null;
        this.setPrompt('Specify first point of spline:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.points.length > 0) {
            const previewPoints = [...this.points, point];
            const preview = createSplineEntity(
                previewPoints,
                false,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(preview);
        }
    }

    onPointInput(point: Point): void {
        if (this.points.length >= 2) {
            const last = this.points[this.points.length - 1];
            // Double click / clicking same spot finishes spline!
            if (distance(point, last) < 6) {
                this.finishSpline(false);
                return;
            }
            // Clicking near start point closes and finishes spline!
            if (distance(point, this.points[0]) < 8) {
                this.finishSpline(true);
                return;
            }
        }

        this.points.push(point);
        this.setPrompt(`Eğri noktası (${this.points.length}). Çift tıklayarak, ilk noktaya tıklayarak veya Enter ile tamamlayın:`);
    }

    onValueInput(value: string): void {
        const trimmed = value.trim().toUpperCase();

        if (trimmed === 'C' || trimmed === 'CLOSE') {
            this.finishSpline(true);
            return;
        }

        if (trimmed === '' || trimmed === 'ENTER') {
            this.finishSpline(false);
            return;
        }

        const parts = trimmed.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            if (!isNaN(x) && !isNaN(y)) {
                this.onPointInput({ x, y });
            }
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            this.finishSpline(false);
        } else if (key === 'Escape') {
            this.cancel();
        }
    }

    public finishSpline(closed = false): void {
        if (this.points.length >= 2) {
            const layerId = useCadStore.getState().activeLayerId;
            const spline = createSplineEntity(
                [...this.points],
                closed,
                layerId,
                '#ffffff'
            );
            useCadStore.getState().addEntity(spline);
        }

        this.points = [];
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        this.setPrompt('Specify first point of spline:');
    }

    cancel(): void {
        this.points = [];
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

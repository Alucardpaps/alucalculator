
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
            let endPt = point;

            // Ortho constraint
            if (useCadStore.getState().orthoEnabled) {
                endPt = this.constrainToOrtho(this.startPoint, point);
            }

            const previewLine = createLineEntity(
                this.startPoint,
                endPt,
                useCadStore.getState().activeLayerId,
                '#cccccc'
            );
            useCadStore.getState().setPreviewEntity(previewLine);
        }
    }

    onPointInput(point: Point): void {
        let finalPoint = point;

        // Ortho constraint
        if (this.startPoint && useCadStore.getState().orthoEnabled) {
            finalPoint = this.constrainToOrtho(this.startPoint, point);
        }

        if (!this.startPoint) {
            this.startPoint = finalPoint;
            this.setPrompt('Specify next point (or distance):');
        } else {
            const layerId = useCadStore.getState().activeLayerId;
            const line = createLineEntity(this.startPoint, finalPoint, layerId, '#ffffff');
            useCadStore.getState().addEntity(line);

            // Chain: start next line from end of this one
            this.startPoint = finalPoint;
            this.setPrompt('Specify next point (or distance):');
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    onValueInput(value: string): void {
        const trimmed = value.trim();

        // Relative coordinates: @dx,dy
        if (trimmed.startsWith('@') && this.startPoint) {
            const parts = trimmed.substring(1).split(',');
            if (parts.length === 2) {
                const dx = parseFloat(parts[0].trim());
                const dy = parseFloat(parts[1].trim());
                if (!isNaN(dx) && !isNaN(dy)) {
                    this.onPointInput({
                        x: this.startPoint.x + dx,
                        y: this.startPoint.y + dy
                    });
                    return;
                }
            }
        }

        // Polar relative: @distance<angle (degrees)
        if (trimmed.startsWith('@') && trimmed.includes('<') && this.startPoint) {
            const parts = trimmed.substring(1).split('<');
            const dist = parseFloat(parts[0].trim());
            const angleDeg = parseFloat(parts[1].trim());
            if (!isNaN(dist) && !isNaN(angleDeg)) {
                const angleRad = angleDeg * Math.PI / 180;
                this.onPointInput({
                    x: this.startPoint.x + dist * Math.cos(angleRad),
                    y: this.startPoint.y - dist * Math.sin(angleRad) // Screen Y inverted
                });
                return;
            }
        }

        // Absolute coordinates: x,y
        const parts = trimmed.split(',');
        if (parts.length === 2) {
            const x = parseFloat(parts[0].trim());
            const y = parseFloat(parts[1].trim());
            if (!isNaN(x) && !isNaN(y)) {
                this.onPointInput({ x, y });
                return;
            }
        }

        // Single number: distance from last point in current direction
        if (this.startPoint && this.currentPoint) {
            const dist = parseFloat(trimmed);
            if (!isNaN(dist) && dist > 0) {
                const dx = this.currentPoint.x - this.startPoint.x;
                const dy = this.currentPoint.y - this.startPoint.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0.001) {
                    this.onPointInput({
                        x: this.startPoint.x + (dx / len) * dist,
                        y: this.startPoint.y + (dy / len) * dist
                    });
                    return;
                }
            }
        }

        useCadStore.getState().setCommandPrompt(`Invalid: ${value}. Use x,y or @dx,dy or @dist<angle`);
    }

    cancel(): void {
        this.startPoint = null;
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }

    renderPreview(ctx: CanvasRenderingContext2D, transform: (p: Point) => Point): void {
        // Handled by previewEntity
    }

    private constrainToOrtho(from: Point, to: Point): Point {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        if (dx > dy) {
            return { x: to.x, y: from.y };
        } else {
            return { x: from.x, y: to.y };
        }
    }
}

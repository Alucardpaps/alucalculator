/**
 * AluCAD — Arc Tool
 * 
 * Creates arcs via 3-point method (start, through, end).
 * Also supports center-radius-angle via CLI input.
 */

import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity } from '../../kernel/types';
import { distance } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';

export class ArcTool extends BaseCommand {
    public id = 'ARC';
    public name = 'ARC';
    public displayName = 'Arc';

    private points: Point[] = [];

    start(): void {
        this.points = [];
        this.setPrompt('Specify start point of arc:');
    }

    onMouseMove(point: Point): void {
        if (this.points.length === 1) {
            // Preview line from start to cursor
            const preview: CadEntity = {
                id: 'preview-arc',
                layerId: useCadStore.getState().activeLayerId,
                color: '#cccccc',
                isVisible: true,
                isSelected: false,
                geometry: { type: 'LINE', start: this.points[0], end: point }
            };
            useCadStore.getState().setPreviewEntity(preview);
        } else if (this.points.length === 2) {
            // Preview arc through 3 points
            const arc = this.computeArc(this.points[0], this.points[1], point);
            if (arc) {
                const preview: CadEntity = {
                    id: 'preview-arc',
                    layerId: useCadStore.getState().activeLayerId,
                    color: '#cccccc',
                    isVisible: true,
                    isSelected: false,
                    geometry: { type: 'ARC', ...arc }
                };
                useCadStore.getState().setPreviewEntity(preview);
            }
        }
    }

    onPointInput(point: Point): void {
        this.points.push(point);

        if (this.points.length === 1) {
            this.setPrompt('Specify second point (through point) of arc:');
        } else if (this.points.length === 2) {
            this.setPrompt('Specify end point of arc:');
        } else if (this.points.length === 3) {
            this.createArc();
        }
    }

    onValueInput(value: string): void {
        // Support "cx,cy,r" for center-radius shorthand
        const parts = value.split(',').map(s => parseFloat(s.trim()));

        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            // x,y coordinate
            this.onPointInput({ x: parts[0], y: parts[1] });
        } else if (parts.length === 1 && !isNaN(parts[0]) && this.points.length >= 1) {
            // Single number: treat as radius for semicircle from last point
            const r = parts[0];
            const lastPt = this.points[this.points.length - 1];
            // Create semicircle arc above the point
            const center = { x: lastPt.x + r, y: lastPt.y };
            const entity: CadEntity = {
                id: crypto.randomUUID(),
                layerId: useCadStore.getState().activeLayerId,
                color: '#ffffff',
                isVisible: true,
                isSelected: false,
                geometry: {
                    type: 'ARC',
                    center,
                    radius: r,
                    startAngle: Math.PI,
                    endAngle: 0,
                }
            };
            useCadStore.getState().addEntity(entity);

            this.points = [];
            this.setPrompt('Specify start point of arc:');
            useCadStore.getState().setPreviewEntity(null);
        }
    }

    private computeArc(p1: Point, p2: Point, p3: Point) {
        // Find circumscribed circle of 3 points
        const ax = p1.x, ay = p1.y;
        const bx = p2.x, by = p2.y;
        const cx = p3.x, cy = p3.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 0.0001) return null; // Collinear

        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

        const center = { x: ux, y: uy };
        const radius = distance(center, p1);

        const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
        const endAngle = Math.atan2(p3.y - center.y, p3.x - center.x);

        return { center, radius, startAngle, endAngle };
    }

    private createArc(): void {
        const [p1, p2, p3] = this.points;
        const arc = this.computeArc(p1, p2, p3);

        if (!arc) {
            this.setPrompt('Points are collinear. Cannot create arc. Try again:');
            this.points = [];
            return;
        }

        const entity: CadEntity = {
            id: crypto.randomUUID(),
            layerId: useCadStore.getState().activeLayerId,
            color: '#ffffff',
            isVisible: true,
            isSelected: false,
            geometry: { type: 'ARC', ...arc }
        };

        useCadStore.getState().addEntity(entity);

        // Restart for next arc
        this.points = [];
        this.setPrompt('Specify start point of arc:');
        useCadStore.getState().setPreviewEntity(null);
    }

    cancel(): void {
        this.points = [];
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

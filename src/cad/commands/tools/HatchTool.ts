import { BaseCommand } from '../BaseCommand';
import { Point, createHatchEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { distance } from '../../kernel/GeometryKernel';

export class HatchTool extends BaseCommand {
    public id = 'HATCH';
    public name = 'HATCH';
    public displayName = 'Hatch';

    private points: Point[] = [];
    private currentPoint: Point | null = null;

    start(): void {
        this.points = [];
        this.currentPoint = null;

        // Check if closed entities are already selected
        const { entities, selectedIds } = useCadStore.getState();
        const selected = entities.filter(e => selectedIds.includes(e.id));
        for (const ent of selected) {
            const g = ent.geometry as any;
            if (g.type === 'POLYLINE' && g.closed && g.vertices?.length >= 3) {
                this.createHatch(g.vertices);
                return;
            }
            if (g.type === 'RECTANGLE') {
                const hw = g.width / 2;
                const hh = g.height / 2;
                const c = g.center;
                const rot = g.rotation || 0;
                const corners = [
                    { x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh }
                ].map(p => ({
                    x: c.x + p.x * Math.cos(rot) - p.y * Math.sin(rot),
                    y: c.y + p.x * Math.sin(rot) + p.y * Math.cos(rot),
                }));
                this.createHatch(corners);
                return;
            }
            if (g.type === 'HEXAGON') {
                const sides = g.sides || 6;
                const r = g.radius;
                const rot = g.rotation || 0;
                const c = g.center;
                const verts = [];
                for (let i = 0; i < sides; i++) {
                    const ang = rot + (Math.PI * 2 / sides) * i;
                    verts.push({ x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang) });
                }
                this.createHatch(verts);
                return;
            }
        }

        this.setPrompt('Tarama Sınırı: Noktaları seçin veya önce kapalı bir şekil (Dikdörtgen/Poligon) seçin:');
    }

    onMouseMove(point: Point): void {
        this.currentPoint = point;

        if (this.points.length >= 2) {
            const preview = createHatchEntity(
                [...this.points, point],
                'ANSI31',
                useCadStore.getState().activeLayerId,
                '#38bdf8'
            );
            useCadStore.getState().setPreviewEntity(preview);
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();

        if (this.points.length === 0) {
            const clicked = findEntityAtPoint(point, entities, viewport.zoom);
            if (clicked) {
                const g = clicked.geometry as any;
                if (g.type === 'POLYLINE' && g.closed && g.vertices?.length >= 3) {
                    this.createHatch(g.vertices);
                    return;
                }
                if (g.type === 'RECTANGLE') {
                    const hw = g.width / 2;
                    const hh = g.height / 2;
                    const c = g.center;
                    const rot = g.rotation || 0;
                    const corners = [
                        { x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh }
                    ].map(p => ({
                        x: c.x + p.x * Math.cos(rot) - p.y * Math.sin(rot),
                        y: c.y + p.x * Math.sin(rot) + p.y * Math.cos(rot),
                    }));
                    this.createHatch(corners);
                    return;
                }
                if (g.type === 'HEXAGON') {
                    const sides = g.sides || 6;
                    const r = g.radius;
                    const rot = g.rotation || 0;
                    const c = g.center;
                    const verts = [];
                    for (let i = 0; i < sides; i++) {
                        const ang = rot + (Math.PI * 2 / sides) * i;
                        verts.push({ x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang) });
                    }
                    this.createHatch(verts);
                    return;
                }
                if (g.type === 'CIRCLE') {
                    const r = g.radius;
                    const c = g.center;
                    const verts = [];
                    const steps = 36;
                    for (let i = 0; i < steps; i++) {
                        const ang = (Math.PI * 2 / steps) * i;
                        verts.push({ x: c.x + r * Math.cos(ang), y: c.y + r * Math.sin(ang) });
                    }
                    this.createHatch(verts);
                    return;
                }
            }
        }

        // If clicking near first point after at least 3 points, close and finish!
        if (this.points.length >= 3 && distance(point, this.points[0]) < 8) {
            this.finishHatch();
            return;
        }

        this.points.push(point);
        this.setPrompt(`Tarama sınırı (${this.points.length} nokta). Enter veya ilk noktaya tıklayarak tamamlayın:`);
    }

    onValueInput(value: string): void {
        const trimmed = value.trim().toUpperCase();
        if (trimmed === 'C' || trimmed === 'CLOSE' || trimmed === '' || trimmed === 'ENTER') {
            this.finishHatch();
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
            this.finishHatch();
        } else if (key === 'Escape') {
            this.cancel();
        }
    }

    public finishHatch(): void {
        if (this.points.length >= 3) {
            this.createHatch(this.points);
        }
        this.points = [];
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        this.setPrompt('Specify first boundary point:');
    }

    private createHatch(vertices: Point[]): void {
        const layerId = useCadStore.getState().activeLayerId;
        const hatch = createHatchEntity(
            vertices,
            'ANSI31',
            layerId,
            '#60a5fa'
        );
        useCadStore.getState().addEntity(hatch);
        useCadStore.getState().setCommandPrompt('Hatch pattern created.');
    }

    cancel(): void {
        this.points = [];
        this.currentPoint = null;
        useCadStore.getState().setPreviewEntity(null);
        super.cancel();
    }
}

/**
 * AluCAD — Array Tools
 * 
 * RectArrayTool: Creates a grid of copies.
 * CircArrayTool: Creates copies arranged in a circle.
 */

import { Command } from '../types';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';

// ============================================
// RECTANGULAR ARRAY
// ============================================

export class RectArrayTool implements Command {
    id = 'RECTARRAY';
    name = 'Rectangular Array';
    displayName = 'Rectangular Array';
    private rows = 3;
    private columns = 3;
    private rowSpacing = 20;
    private colSpacing = 20;

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length === 0) {
            useCadStore.setState({ commandState: 'AWAITING_POINT', commandPrompt: 'Select entities first, then start RECTARRAY.' });
            return;
        }
        useCadStore.setState({
            commandState: 'AWAITING_VALUE',
            commandPrompt: `Rows,Cols,RowSpacing,ColSpacing (${this.rows},${this.columns},${this.rowSpacing},${this.colSpacing}):`,
        });
    }

    onPointInput(_point: Point): void { }
    onMouseMove(_point: Point): void { }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    onValueInput(value: string): void {
        const parts = value.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 4 && parts.every(n => !isNaN(n))) {
            this.rows = Math.max(1, Math.round(parts[0]));
            this.columns = Math.max(1, Math.round(parts[1]));
            this.rowSpacing = parts[2];
            this.colSpacing = parts[3];
        } else if (parts.length >= 2 && parts.every(n => !isNaN(n))) {
            this.rows = Math.max(1, Math.round(parts[0]));
            this.columns = Math.max(1, Math.round(parts[1]));
        }
        this.applyArray();
    }

    private applyArray(): void {
        const { entities, selectedIds, addEntity } = useCadStore.getState();
        const sourceEntities = entities.filter(e => selectedIds.includes(e.id));
        if (sourceEntities.length === 0) return;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if (r === 0 && c === 0) continue;
                const dx = c * this.colSpacing;
                const dy = r * this.rowSpacing;
                for (const src of sourceEntities) {
                    const clone = offsetEntity(src, dx, dy);
                    if (clone) addEntity(clone);
                }
            }
        }
        useCadStore.setState({ commandPrompt: `Array: ${this.rows}×${this.columns} created.` });
    }

    cancel(): void { }
    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }
}

// ============================================
// CIRCULAR ARRAY
// ============================================

export class CircArrayTool implements Command {
    id = 'CIRCARRAY';
    name = 'Circular Array';
    displayName = 'Circular Array';
    private center: Point | null = null;
    private count = 6;
    private totalAngle = 360;
    private step = 0;

    start(): void {
        const { selectedIds } = useCadStore.getState();
        if (selectedIds.length === 0) {
            useCadStore.setState({ commandState: 'AWAITING_POINT', commandPrompt: 'Select entities first, then start CIRCARRAY.' });
            return;
        }
        useCadStore.setState({ commandState: 'AWAITING_POINT', commandPrompt: 'Specify center point of array:' });
        this.step = 0;
    }

    onPointInput(point: Point): void {
        if (this.step === 0) {
            this.center = point;
            this.step = 1;
            useCadStore.setState({ commandState: 'AWAITING_VALUE', commandPrompt: `Count,TotalAngle (${this.count},${this.totalAngle}):` });
        }
    }

    onMouseMove(_point: Point): void { }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    onValueInput(value: string): void {
        if (this.step === 1) {
            const parts = value.split(',').map(s => parseFloat(s.trim()));
            if (parts.length >= 1 && !isNaN(parts[0])) this.count = Math.max(2, Math.round(parts[0]));
            if (parts.length >= 2 && !isNaN(parts[1])) this.totalAngle = parts[1];
            this.applyArray();
        }
    }

    private applyArray(): void {
        if (!this.center) return;
        const { entities, selectedIds, addEntity } = useCadStore.getState();
        const sourceEntities = entities.filter(e => selectedIds.includes(e.id));
        if (sourceEntities.length === 0) return;

        const angleStep = (this.totalAngle / this.count) * (Math.PI / 180);
        for (let i = 1; i < this.count; i++) {
            const angle = angleStep * i;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            for (const src of sourceEntities) {
                const clone = rotateEntity(src, this.center!, cos, sin);
                if (clone) addEntity(clone);
            }
        }
        useCadStore.setState({ commandPrompt: `Circular array: ${this.count} items created.` });
    }

    cancel(): void {
        this.center = null;
        this.step = 0;
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }
}

// ============================================
// HELPERS
// ============================================

function offsetEntity(src: CadEntity, dx: number, dy: number): CadEntity | null {
    const id = crypto.randomUUID();
    const g = src.geometry;
    switch (g.type) {
        case 'LINE':
            return { ...src, id, isSelected: false, geometry: { ...g, start: { x: g.start.x + dx, y: g.start.y + dy }, end: { x: g.end.x + dx, y: g.end.y + dy } } };
        case 'CIRCLE':
            return { ...src, id, isSelected: false, geometry: { ...g, center: { x: g.center.x + dx, y: g.center.y + dy } } };
        case 'ARC':
            return { ...src, id, isSelected: false, geometry: { ...g, center: { x: g.center.x + dx, y: g.center.y + dy } } };
        case 'POLYLINE':
            return { ...src, id, isSelected: false, geometry: { ...g, vertices: g.vertices.map(v => ({ x: v.x + dx, y: v.y + dy })) } };
        case 'POINT':
            return { ...src, id, isSelected: false, geometry: { ...g, x: g.x + dx, y: g.y + dy } };
        default:
            return null;
    }
}

function rotateEntity(src: CadEntity, center: Point, cos: number, sin: number): CadEntity | null {
    const id = crypto.randomUUID();
    const g = src.geometry;
    const rot = (p: Point): Point => ({
        x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin,
        y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos,
    });
    switch (g.type) {
        case 'LINE':
            return { ...src, id, isSelected: false, geometry: { ...g, start: rot(g.start), end: rot(g.end) } };
        case 'CIRCLE':
            return { ...src, id, isSelected: false, geometry: { ...g, center: rot(g.center) } };
        case 'ARC':
            return { ...src, id, isSelected: false, geometry: { ...g, center: rot(g.center), startAngle: g.startAngle + Math.atan2(sin, cos), endAngle: g.endAngle + Math.atan2(sin, cos) } };
        case 'POLYLINE':
            return { ...src, id, isSelected: false, geometry: { ...g, vertices: g.vertices.map(rot) } };
        case 'POINT': {
            const rp = rot({ x: g.x, y: g.y });
            return { ...src, id, isSelected: false, geometry: { ...g, x: rp.x, y: rp.y } };
        }
        default:
            return null;
    }
}

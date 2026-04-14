/**
 * AluCAD — Fillet Tool
 * 
 * Creates a tangent arc between two intersecting lines.
 * Trims the lines to the arc tangent points.
 */

import { Command } from '../types';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { intersectLineLine, distance } from '../../kernel/GeometryKernel';

export class FilletTool implements Command {
    id = 'FILLET';
    name = 'Fillet';
    displayName = 'Fillet';
    private selectedEntities: CadEntity[] = [];
    private radius = 5;
    private mousePos: Point = { x: 0, y: 0 };

    start(): void {
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: 'Select first line for fillet (or type radius value):',
        });
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (!entity || entity.geometry.type !== 'LINE') {
            useCadStore.setState({ commandPrompt: 'No line found. Select a line:' });
            return;
        }

        this.selectedEntities.push(entity);

        if (this.selectedEntities.length === 1) {
            useCadStore.setState({ commandPrompt: `Select second line (radius: ${this.radius}):` });
        } else if (this.selectedEntities.length === 2) {
            this.applyFillet();
        }
    }

    onMouseMove(point: Point): void {
        this.mousePos = point;
    }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    onValueInput(value: string): void {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            this.radius = num;
            useCadStore.setState({ commandPrompt: `Fillet radius set to ${this.radius}. Select first line:` });
        }
    }

    private applyFillet(): void {
        const [e1, e2] = this.selectedEntities;
        if (e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return;

        const g1 = e1.geometry;
        const g2 = e2.geometry;

        const intersection = intersectLineLine(g1.start, g1.end, g2.start, g2.end, false);
        if (!intersection) {
            useCadStore.setState({ commandPrompt: 'Lines are parallel. Cannot fillet.' });
            this.selectedEntities = [];
            return;
        }

        const r = this.radius;
        const near1 = distance(g1.start, intersection) < distance(g1.end, intersection) ? 'start' : 'end';
        const near2 = distance(g2.start, intersection) < distance(g2.end, intersection) ? 'start' : 'end';

        const far1 = near1 === 'start' ? g1.end : g1.start;
        const far2 = near2 === 'start' ? g2.end : g2.start;

        const len1 = distance(intersection, far1);
        const len2 = distance(intersection, far2);

        if (len1 < r || len2 < r) {
            useCadStore.setState({ commandPrompt: 'Radius too large for these lines.' });
            this.selectedEntities = [];
            return;
        }

        const u1 = { x: (far1.x - intersection.x) / len1, y: (far1.y - intersection.y) / len1 };
        const u2 = { x: (far2.x - intersection.x) / len2, y: (far2.y - intersection.y) / len2 };

        const t1: Point = { x: intersection.x + u1.x * r, y: intersection.y + u1.y * r };
        const t2: Point = { x: intersection.x + u2.x * r, y: intersection.y + u2.y * r };

        const arcCenter = {
            x: (t1.x + t2.x) / 2 + (intersection.x - (t1.x + t2.x) / 2),
            y: (t1.y + t2.y) / 2 + (intersection.y - (t1.y + t2.y) / 2),
        };

        const startAngle = Math.atan2(t1.y - arcCenter.y, t1.x - arcCenter.x);
        const endAngle = Math.atan2(t2.y - arcCenter.y, t2.x - arcCenter.x);

        const { addEntity, updateEntity } = useCadStore.getState();

        updateEntity(e1.id, { geometry: near1 === 'start' ? { ...g1, start: t1 } : { ...g1, end: t1 } });
        updateEntity(e2.id, { geometry: near2 === 'start' ? { ...g2, start: t2 } : { ...g2, end: t2 } });

        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color,
            isVisible: true,
            isSelected: false,
            geometry: { type: 'ARC', center: arcCenter, radius: r, startAngle, endAngle },
        });

        useCadStore.setState({ commandPrompt: `Fillet applied (r=${this.radius}). Select lines or ESC:` });
        this.selectedEntities = [];
    }

    cancel(): void {
        this.selectedEntities = [];
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }
}

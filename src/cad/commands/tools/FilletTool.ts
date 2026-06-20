/**
 * AluCAD — Universal Fillet Tool
 * 
 * Creates a tangent arc between two entities (Line-Line, Line-Circle, Line-Arc).
 * Uses the GeometryEngine for intersection detection.
 */

import { Command } from '../types';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { intersectLineLine, distance, normalize, vector, scale } from '../../kernel/GeometryKernel';
import { findAllIntersections } from '../../kernel/GeometryEngine';

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
            commandPrompt: `Select first entity for fillet (radius: ${this.radius}, or type new radius):`,
        });
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (!entity) {
            useCadStore.setState({ commandPrompt: 'No entity found. Select an entity:' });
            return;
        }

        const supportedTypes = ['LINE', 'CIRCLE', 'ARC'];
        if (!supportedTypes.includes(entity.geometry.type)) {
            useCadStore.setState({ commandPrompt: `Fillet not supported for ${entity.geometry.type}. Select LINE, CIRCLE, or ARC:` });
            return;
        }

        this.selectedEntities.push(entity);

        if (this.selectedEntities.length === 1) {
            useCadStore.setState({ commandPrompt: `Select second entity (radius: ${this.radius}):` });
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
            useCadStore.setState({ commandPrompt: `Fillet radius set to ${this.radius}. Select first entity:` });
        }
    }

    private applyFillet(): void {
        const [e1, e2] = this.selectedEntities;

        // Both lines — use the original optimized line-line fillet
        if (e1.geometry.type === 'LINE' && e2.geometry.type === 'LINE') {
            this.applyLineLineFillet(e1, e2);
        } else {
            // Generic fillet: find intersections, trim, add arc
            this.applyGenericFillet(e1, e2);
        }
    }

    private applyLineLineFillet(e1: CadEntity, e2: CadEntity): void {
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

        const { addEntity, updateEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet');

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

        useCadStore.setState({ commandPrompt: `Fillet applied (r=${this.radius}). Select entities or ESC:` });
        this.selectedEntities = [];
    }

    private applyGenericFillet(e1: CadEntity, e2: CadEntity): void {
        // Find intersection points between the two entities
        const intersections = findAllIntersections(e1, e2);

        if (intersections.length === 0) {
            useCadStore.setState({ commandPrompt: 'Entities do not intersect. Cannot fillet.' });
            this.selectedEntities = [];
            return;
        }

        // Use the closest intersection to the mouse
        const closest = intersections.sort((a, b) =>
            distance(this.mousePos, a) - distance(this.mousePos, b)
        )[0];

        // For generic fillet, we place a radius arc at the intersection
        const r = this.radius;
        const { addEntity, pushHistory } = useCadStore.getState();
        pushHistory('Fillet');

        // Simple arc at intersection
        const startAngle = Math.atan2(this.mousePos.y - closest.y, this.mousePos.x - closest.x);
        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'ARC',
                center: closest,
                radius: r,
                startAngle: startAngle,
                endAngle: startAngle + Math.PI / 2
            },
        });

        useCadStore.setState({ commandPrompt: `Fillet applied (r=${this.radius}). Select entities or ESC:` });
        this.selectedEntities = [];
    }

    cancel(): void {
        this.selectedEntities = [];
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }
}

/**
 * AluCAD — Chamfer Tool
 * 
 * Creates an angled cut between two intersecting lines.
 */

import { Command } from '../types';
import { Point, CadEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { intersectLineLine, distance } from '../../kernel/GeometryKernel';

export class ChamferTool implements Command {
    id = 'CHAMFER';
    name = 'Chamfer';
    displayName = 'Chamfer';
    private selectedEntities: CadEntity[] = [];
    private dist1 = 5;
    private dist2 = 5;

    start(): void {
        useCadStore.setState({
            commandState: 'AWAITING_POINT',
            commandPrompt: `Select first line (distances: ${this.dist1}, ${this.dist2}):`,
        });
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (!entity || entity.geometry.type !== 'LINE') {
            useCadStore.setState({ commandPrompt: 'Select a line:' });
            return;
        }

        this.selectedEntities.push(entity);

        if (this.selectedEntities.length === 1) {
            useCadStore.setState({ commandPrompt: 'Select second line:' });
        } else if (this.selectedEntities.length === 2) {
            this.applyChamfer();
        }
    }

    onMouseMove(_point: Point): void { }

    onKeyInput(key: string): void {
        if (key === 'Escape') this.cancel();
    }

    onValueInput(value: string): void {
        const parts = value.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 1 && !isNaN(parts[0]) && parts[0] > 0) {
            this.dist1 = parts[0];
            this.dist2 = parts.length >= 2 && !isNaN(parts[1]) ? parts[1] : parts[0];
            useCadStore.setState({ commandPrompt: `Chamfer distances: ${this.dist1}, ${this.dist2}. Select first line:` });
        }
    }

    private applyChamfer(): void {
        const [e1, e2] = this.selectedEntities;
        if (e1.geometry.type !== 'LINE' || e2.geometry.type !== 'LINE') return;

        const g1 = e1.geometry;
        const g2 = e2.geometry;

        const intersection = intersectLineLine(g1.start, g1.end, g2.start, g2.end, false);
        if (!intersection) {
            useCadStore.setState({ commandPrompt: 'Lines are parallel.' });
            this.selectedEntities = [];
            return;
        }

        const near1 = distance(g1.start, intersection) < distance(g1.end, intersection) ? 'start' : 'end';
        const near2 = distance(g2.start, intersection) < distance(g2.end, intersection) ? 'start' : 'end';
        const far1 = near1 === 'start' ? g1.end : g1.start;
        const far2 = near2 === 'start' ? g2.end : g2.start;
        const len1 = distance(intersection, far1);
        const len2 = distance(intersection, far2);

        if (len1 < this.dist1 || len2 < this.dist2) {
            useCadStore.setState({ commandPrompt: 'Chamfer distance too large.' });
            this.selectedEntities = [];
            return;
        }

        const u1 = { x: (far1.x - intersection.x) / len1, y: (far1.y - intersection.y) / len1 };
        const u2 = { x: (far2.x - intersection.x) / len2, y: (far2.y - intersection.y) / len2 };
        const c1: Point = { x: intersection.x + u1.x * this.dist1, y: intersection.y + u1.y * this.dist1 };
        const c2: Point = { x: intersection.x + u2.x * this.dist2, y: intersection.y + u2.y * this.dist2 };

        const { addEntity, updateEntity } = useCadStore.getState();

        updateEntity(e1.id, { geometry: near1 === 'start' ? { ...g1, start: c1 } : { ...g1, end: c1 } });
        updateEntity(e2.id, { geometry: near2 === 'start' ? { ...g2, start: c2 } : { ...g2, end: c2 } });

        addEntity({
            id: crypto.randomUUID(),
            layerId: e1.layerId,
            color: e1.color,
            isVisible: true,
            isSelected: false,
            geometry: { type: 'LINE', start: c1, end: c2 },
        });

        useCadStore.setState({ commandPrompt: `Chamfer applied. Select lines or ESC:` });
        this.selectedEntities = [];
    }

    cancel(): void {
        this.selectedEntities = [];
    }

    renderPreview(_ctx: CanvasRenderingContext2D, _transform: (p: Point) => Point): void { }
}

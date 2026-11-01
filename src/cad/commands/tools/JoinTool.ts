import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity, createPolylineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { distance, vector, dot, normalize } from '../../kernel/GeometryKernel';

const TOLERANCE = 0.05;

export class JoinTool extends BaseCommand {
    public id = 'JOIN';
    public name = 'JOIN';
    public displayName = 'Join';

    private state: 'SELECTING' | 'EXECUTING' = 'SELECTING';

    start(): void {
        const store = useCadStore.getState();
        if (store.selectedIds.length >= 2) {
            this.executeJoin(store.selectedIds);
            this.finish();
        } else {
            this.state = 'SELECTING';
            this.setPrompt('Select entities to join into polyline (Press Enter when done):');
        }
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            const store = useCadStore.getState();
            if (store.selectedIds.length >= 2) {
                this.executeJoin(store.selectedIds);
            } else {
                this.setPrompt('Select at least 2 touching lines or polylines to join.');
            }
            this.finish();
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport, selectEntity, selectedIds } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);
        if (entity) {
            selectEntity(entity.id, true);
            const count = selectedIds.includes(entity.id) ? selectedIds.length : selectedIds.length + 1;
            this.setPrompt(`${count} entities selected. Press Enter to join:`);
        }
    }

    private executeJoin(selectedIds: string[]) {
        const store = useCadStore.getState();
        const candidates = store.entities.filter(e => selectedIds.includes(e.id));

        if (candidates.length < 2) {
            this.setPrompt('Need at least 2 entities to join.');
            return;
        }

        // 1. Check if all selected are collinear lines
        if (candidates.every(e => e.geometry.type === 'LINE')) {
            const mergedLine = this.tryMergeCollinearLines(candidates);
            if (mergedLine) {
                store.pushHistory('Join Collinear Lines');
                candidates.forEach(e => store.removeEntity(e.id));
                store.addEntity(mergedLine);
                this.setPrompt('Collinear lines merged into single line.');
                return;
            }
        }

        // 2. Chain touching lines/polylines into single POLYLINE
        const chained = this.tryChainEntities(candidates);
        if (chained) {
            store.pushHistory('Join into Polyline');
            candidates.forEach(e => store.removeEntity(e.id));
            store.addEntity(chained);
            const status = (chained.geometry as any).closed ? 'closed' : 'open';
            this.setPrompt(`Entities joined into 1 ${status} polyline.`);
        } else {
            this.setPrompt('Entities do not touch end-to-end within tolerance.');
        }
    }

    private tryMergeCollinearLines(lines: CadEntity[]): CadEntity | null {
        const first = lines[0].geometry as { type: 'LINE'; start: Point; end: Point };
        const v = vector(first.start, first.end);
        const len = distance(first.start, first.end);
        if (len < 0.001) return null;
        const u = normalize(v);

        // Check if all endpoints lie on the line passing through first.start with direction u
        const projections: { p: Point; t: number }[] = [];
        for (const e of lines) {
            if (e.geometry.type !== 'LINE') return null;
            const g = e.geometry;
            for (const pt of [g.start, g.end]) {
                const diff = vector(first.start, pt);
                const t = dot(diff, u);
                const perpDist = Math.abs(diff.x * u.y - diff.y * u.x);
                if (perpDist > TOLERANCE) return null; // Not collinear
                projections.push({ p: pt, t });
            }
        }

        projections.sort((a, b) => a.t - b.t);

        // Verify segments overlap or touch
        const minPt = projections[0].p;
        const maxPt = projections[projections.length - 1].p;

        return createLineEntity(minPt, maxPt, lines[0].layerId, lines[0].color);
    }

    private tryChainEntities(entities: CadEntity[]): CadEntity | null {
        interface Segment {
            id: string;
            start: Point;
            end: Point;
            points: Point[];
        }

        const segments: Segment[] = [];
        for (const e of entities) {
            if (e.geometry.type === 'LINE') {
                segments.push({
                    id: e.id,
                    start: e.geometry.start,
                    end: e.geometry.end,
                    points: [e.geometry.start, e.geometry.end]
                });
            } else if (e.geometry.type === 'POLYLINE') {
                if (e.geometry.closed) continue; // Closed polylines cannot be chained end-to-end
                const pts = e.geometry.vertices;
                if (pts.length < 2) continue;
                segments.push({
                    id: e.id,
                    start: pts[0],
                    end: pts[pts.length - 1],
                    points: [...pts]
                });
            } else if (e.geometry.type === 'ARC') {
                const a = e.geometry;
                const sp = { x: a.center.x + a.radius * Math.cos(a.startAngle), y: a.center.y + a.radius * Math.sin(a.startAngle) };
                const ep = { x: a.center.x + a.radius * Math.cos(a.endAngle), y: a.center.y + a.radius * Math.sin(a.endAngle) };
                // Approximate arc into vertices
                const pts: Point[] = [];
                const steps = 12;
                let sweep = a.endAngle - a.startAngle;
                if (sweep <= 0) sweep += 2 * Math.PI;
                for (let s = 0; s <= steps; s++) {
                    const theta = a.startAngle + (sweep * s) / steps;
                    pts.push({ x: a.center.x + a.radius * Math.cos(theta), y: a.center.y + a.radius * Math.sin(theta) });
                }
                segments.push({
                    id: e.id,
                    start: sp,
                    end: ep,
                    points: pts
                });
            }
        }

        if (segments.length === 0) return null;

        const chain: Point[] = [...segments[0].points];
        const remaining = segments.slice(1);

        let progress = true;
        while (progress && remaining.length > 0) {
            progress = false;
            const head = chain[0];
            const tail = chain[chain.length - 1];

            for (let i = 0; i < remaining.length; i++) {
                const seg = remaining[i];
                // Connect to tail?
                if (distance(tail, seg.start) <= TOLERANCE) {
                    chain.push(...seg.points.slice(1));
                    remaining.splice(i, 1);
                    progress = true;
                    break;
                }
                if (distance(tail, seg.end) <= TOLERANCE) {
                    const reversed = [...seg.points].reverse();
                    chain.push(...reversed.slice(1));
                    remaining.splice(i, 1);
                    progress = true;
                    break;
                }
                // Connect to head?
                if (distance(head, seg.end) <= TOLERANCE) {
                    chain.unshift(...seg.points.slice(0, -1));
                    remaining.splice(i, 1);
                    progress = true;
                    break;
                }
                if (distance(head, seg.start) <= TOLERANCE) {
                    const reversed = [...seg.points].reverse();
                    chain.unshift(...reversed.slice(0, -1));
                    remaining.splice(i, 1);
                    progress = true;
                    break;
                }
            }
        }

        if (chain.length < 2) return null;

        // Check if closed
        const isClosed = distance(chain[0], chain[chain.length - 1]) <= TOLERANCE;
        const finalVerts = isClosed ? chain.slice(0, -1) : chain;

        return createPolylineEntity(
            finalVerts,
            isClosed,
            entities[0].layerId,
            entities[0].color
        );
    }
}

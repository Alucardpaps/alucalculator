import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { distance } from '../../kernel/GeometryKernel';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { trimLineByCutter } from '../../kernel/GeometryKernel';

export class TrimTool extends BaseCommand {
    public id = 'TRIM';
    public name = 'TRIM';
    public displayName = 'Trim';

    private cuttingEdges: CadEntity[] = [];
    private state: 'SELECT_CUTTING' | 'SELECT_OBJECT' = 'SELECT_CUTTING';

    start(): void {
        this.cuttingEdges = [];
        this.state = 'SELECT_CUTTING';
        this.setPrompt('Select cutting edges (Enter to finish):');
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.state === 'SELECT_CUTTING') {
                if (this.cuttingEdges.length === 0) {
                    // Select all as cutters
                    this.cuttingEdges = [...useCadStore.getState().entities];
                }
                this.state = 'SELECT_OBJECT';
                this.setPrompt('Select object to trim (Shift to Extend):');
            } else {
                this.cancel();
            }
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport, removeEntity, addEntity } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (this.state === 'SELECT_CUTTING') {
            if (entity) {
                if (!this.cuttingEdges.find(e => e.id === entity.id)) {
                    this.cuttingEdges.push(entity);
                    // TODO: Highlight logic
                }
            } else {
                // Click, no entity -> finish
                if (this.cuttingEdges.length > 0) {
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to trim:');
                } else {
                    // Select All
                    this.cuttingEdges = [...entities];
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to trim (All selected):');
                }
            }
        } else if (this.state === 'SELECT_OBJECT') {
            if (entity) {
                this.performTrim(entity, point);
            }
        }
    }

    private performTrim(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'LINE') {
            console.warn("Only LINE trimming supported currently");
            return;
        }

        const targetGeo = entity.geometry;
        let segments: { start: Point, end: Point }[] = [{ start: targetGeo.start, end: targetGeo.end }];

        // Cut against ALL cutters
        this.cuttingEdges.forEach(cutter => {
            if (cutter.id === entity.id) return;
            if (cutter.geometry.type !== 'LINE') return; // Only line cutters for now

            const newSegments: { start: Point, end: Point }[] = [];
            segments.forEach(seg => {
                const result = trimLineByCutter(seg, cutter.geometry as any);
                newSegments.push(...result);
            });
            segments = newSegments;
        });

        // If no cuts happened, segments length is 1 and same as original
        if (segments.length === 1 &&
            segments[0].start === targetGeo.start &&
            segments[0].end === targetGeo.end) {
            return;
        }

        // We have multiple segments. One of them is the one we clicked on.
        // The one we clicked on should be REMOVED.
        // We identify the clicked segment by finding which one contains the projection of pickPoint.

        let bestDist = Infinity;
        let segmentToRemoveIndex = -1;

        segments.forEach((seg, i) => {
            const mid = { x: (seg.start.x + seg.end.x) / 2, y: (seg.start.y + seg.end.y) / 2 };
            const d = distance(pickPoint, mid);
            if (d < bestDist) {
                bestDist = d;
                segmentToRemoveIndex = i;
            }
        });

        if (segmentToRemoveIndex !== -1) {
            useCadStore.getState().pushHistory('Trim');
            useCadStore.getState().removeEntity(entity.id);

            // Add back the other segments
            segments.forEach((seg, i) => {
                if (i !== segmentToRemoveIndex) {
                    useCadStore.getState().addEntity(
                        createLineEntity(seg.start, seg.end, entity.layerId, entity.color)
                    );
                }
            });
        }
    }

    onMouseMove(point: Point): void {
        // todo preview
    }
}

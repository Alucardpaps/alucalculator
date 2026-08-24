
import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { getEntityIntersections } from '../../geometry/SnapEngine';
import { extendLineToBoundary, distance, vector, dot, normalize } from '../../kernel/GeometryKernel';

export class ExtendTool extends BaseCommand {
    public id = 'EXTEND';
    public name = 'EXTEND';
    public displayName = 'Extend';

    private boundaries: CadEntity[] = [];
    private state: 'SELECT_BOUNDARY' | 'SELECT_OBJECT' = 'SELECT_BOUNDARY';

    start(): void {
        this.boundaries = [];
        this.state = 'SELECT_BOUNDARY';
        this.setPrompt('Select boundary edges (Enter to select all):');
    }

    onKeyInput(key: string): void {
        if (key === 'Enter') {
            if (this.state === 'SELECT_BOUNDARY') {
                if (this.boundaries.length === 0) {
                    this.boundaries = [...useCadStore.getState().entities];
                }
                this.state = 'SELECT_OBJECT';
                this.setPrompt('Select object to extend (Shift to Trim):');
            } else {
                this.cancel();
            }
        }
    }

    onPointInput(point: Point): void {
        const { entities, viewport } = useCadStore.getState();
        const entity = findEntityAtPoint(point, entities, viewport.zoom);

        if (this.state === 'SELECT_BOUNDARY') {
            if (entity) {
                if (!this.boundaries.find(e => e.id === entity.id)) {
                    this.boundaries.push(entity);
                }
            } else {
                if (this.boundaries.length > 0) {
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to extend:');
                } else {
                    this.boundaries = [...entities];
                    this.state = 'SELECT_OBJECT';
                    this.setPrompt('Select object to extend (All selected):');
                }
            }
        } else if (this.state === 'SELECT_OBJECT') {
            if (entity) {
                this.performExtend(entity, point);
            }
        }
    }

    private performExtend(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'LINE') {
            console.warn("Only LINE extend supported currently");
            return;
        }

        const targetGeo = entity.geometry;

        // Find best extension among all boundaries
        // Only extends to the NEAREST intersection in the direction of extension

        let bestNewGeo: { start: Point, end: Point } | null = null;
        let bestDistChange = Infinity;

        this.boundaries.forEach(boundary => {
            if (boundary.id === entity.id) return;

            // To extend a line to ANY boundary, we treat the line as an infinite line
            // and find intersections with the boundary.
            // Then we pick the intersection that lies *outside* the line segment,
            // in the direction of the end we are extending.

            // 1. Determine which end we are picking based on pickPoint
            const dStart = distance(pickPoint, targetGeo.start);
            const dEnd = distance(pickPoint, targetGeo.end);
            const isExtendingEnd = dEnd < dStart;

            const rayDir = isExtendingEnd
                ? normalize(vector(targetGeo.start, targetGeo.end))
                : normalize(vector(targetGeo.end, targetGeo.start));

            const rayOrigin = isExtendingEnd ? targetGeo.end : targetGeo.start;

            // Mock infinite line (large enough to intersect everything we see)
            const mockInfiniteGeo = {
                type: 'LINE',
                start: targetGeo.start,
                end: {
                    x: rayOrigin.x + rayDir.x * 1000000,
                    y: rayOrigin.y + rayDir.y * 1000000
                }
            } as any;

            const mockEntity = {
                id: 'mock',
                geometry: mockInfiniteGeo
            } as CadEntity;

            const points = getEntityIntersections(mockEntity, boundary);

            points.forEach(pt => {
                // Determine if point is in the "forward" direction of the ray
                const vPt = vector(rayOrigin, pt);
                const projection = dot(vPt, rayDir);

                if (projection > 0.001) { // Positive projection = in front
                    const diff = distance(rayOrigin, pt);
                    if (diff < bestDistChange) {
                        bestDistChange = diff;
                        if (isExtendingEnd) {
                            bestNewGeo = { start: targetGeo.start, end: pt };
                        } else {
                            bestNewGeo = { start: pt, end: targetGeo.end };
                        }
                    }
                }
            });
        });

        if (bestNewGeo) {
            const finalGeo = bestNewGeo as { start: Point, end: Point };
            useCadStore.getState().pushHistory('Extend');
            useCadStore.getState().removeEntity(entity.id);
            useCadStore.getState().addEntity(
                createLineEntity(finalGeo.start, finalGeo.end, entity.layerId, entity.color)
            );
        }
    }

    onMouseMove(point: Point): void {
        // todo preview
    }
}

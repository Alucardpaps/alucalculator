import { BaseCommand } from '../BaseCommand';
import { Point, CadEntity, createLineEntity, createArcEntity, createPolylineEntity } from '../../kernel/types';
import { useCadStore } from '../../store/cadStore';
import { findEntityAtPoint } from '../../geometry/GeometryUtils';
import { findAllIntersections } from '../../kernel/GeometryEngine';
import { distance, vector, dot, normalize } from '../../kernel/GeometryKernel';

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
                    this.setPrompt(`${this.boundaries.length} boundary edge(s) selected. Enter to finish:`);
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
        if (entity.geometry.type === 'LINE') {
            this.extendLine(entity, pickPoint);
        } else if (entity.geometry.type === 'ARC') {
            this.extendArc(entity, pickPoint);
        } else if (entity.geometry.type === 'POLYLINE' && !entity.geometry.closed) {
            this.extendPolyline(entity, pickPoint);
        } else {
            this.setPrompt('Selected entity type cannot be extended. Select a Line, Arc, or Polyline:');
        }
    }

    private extendLine(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'LINE') return;
        const targetGeo = entity.geometry;

        const dStart = distance(pickPoint, targetGeo.start);
        const dEnd = distance(pickPoint, targetGeo.end);
        const isExtendingEnd = dEnd < dStart;

        const rayDir = isExtendingEnd
            ? normalize(vector(targetGeo.start, targetGeo.end))
            : normalize(vector(targetGeo.end, targetGeo.start));

        const rayOrigin = isExtendingEnd ? targetGeo.end : targetGeo.start;

        const mockInfiniteGeo = {
            type: 'LINE' as const,
            start: rayOrigin,
            end: {
                x: rayOrigin.x + rayDir.x * 1000000,
                y: rayOrigin.y + rayDir.y * 1000000
            }
        };

        const mockEntity = {
            id: 'mock',
            geometry: mockInfiniteGeo
        } as CadEntity;

        let bestNewGeo: { start: Point; end: Point } | null = null;
        let bestDistChange = Infinity;

        this.boundaries.forEach(boundary => {
            if (boundary.id === entity.id) return;
            const points = findAllIntersections(mockEntity, boundary);

            points.forEach(pt => {
                const vPt = vector(rayOrigin, pt);
                const projection = dot(vPt, rayDir);

                if (projection > 0.001) {
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
            const finalGeo = bestNewGeo as { start: Point; end: Point };
            const store = useCadStore.getState();
            store.pushHistory('Extend Line');
            store.removeEntity(entity.id);
            store.addEntity(
                createLineEntity(finalGeo.start, finalGeo.end, entity.layerId, entity.color)
            );
            this.setPrompt('Line extended. Select next object to extend:');
        } else {
            this.setPrompt('No boundary intersection found in direction of extension.');
        }
    }

    private extendArc(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'ARC') return;
        const targetArc = entity.geometry;

        const startPt = {
            x: targetArc.center.x + targetArc.radius * Math.cos(targetArc.startAngle),
            y: targetArc.center.y + targetArc.radius * Math.sin(targetArc.startAngle)
        };
        const endPt = {
            x: targetArc.center.x + targetArc.radius * Math.cos(targetArc.endAngle),
            y: targetArc.center.y + targetArc.radius * Math.sin(targetArc.endAngle)
        };

        const dStart = distance(pickPoint, startPt);
        const dEnd = distance(pickPoint, endPt);
        const isExtendingEnd = dEnd < dStart;

        const mockCircleEntity: CadEntity = {
            id: 'mock_circle',
            layerId: entity.layerId,
            color: entity.color,
            isVisible: true,
            isSelected: false,
            geometry: {
                type: 'CIRCLE',
                center: targetArc.center,
                radius: targetArc.radius
            }
        };

        let bestAngle: number | null = null;
        let bestAngleDelta = Infinity;

        this.boundaries.forEach(boundary => {
            if (boundary.id === entity.id) return;
            const pts = findAllIntersections(mockCircleEntity, boundary);
            pts.forEach(pt => {
                let a = Math.atan2(pt.y - targetArc.center.y, pt.x - targetArc.center.x);
                if (a < 0) a += 2 * Math.PI;

                if (isExtendingEnd) {
                    let delta = a - targetArc.endAngle;
                    while (delta <= 0.001) delta += 2 * Math.PI;
                    if (delta < bestAngleDelta) {
                        bestAngleDelta = delta;
                        bestAngle = a;
                    }
                } else {
                    let delta = targetArc.startAngle - a;
                    while (delta <= 0.001) delta += 2 * Math.PI;
                    if (delta < bestAngleDelta) {
                        bestAngleDelta = delta;
                        bestAngle = a;
                    }
                }
            });
        });

        if (bestAngle !== null && bestAngleDelta < 2 * Math.PI) {
            const store = useCadStore.getState();
            store.pushHistory('Extend Arc');
            store.removeEntity(entity.id);
            const newStartAngle = isExtendingEnd ? targetArc.startAngle : bestAngle;
            const newEndAngle = isExtendingEnd ? bestAngle : targetArc.endAngle;
            store.addEntity(
                createArcEntity(targetArc.center, targetArc.radius, newStartAngle, newEndAngle, entity.layerId, entity.color)
            );
            this.setPrompt('Arc extended. Select next object to extend:');
        } else {
            this.setPrompt('No boundary intersection found along arc radius.');
        }
    }

    private extendPolyline(entity: CadEntity, pickPoint: Point) {
        if (entity.geometry.type !== 'POLYLINE' || entity.geometry.vertices.length < 2) return;
        const verts = [...entity.geometry.vertices];
        const vStart = verts[0];
        const vEnd = verts[verts.length - 1];

        const dStart = distance(pickPoint, vStart);
        const dEnd = distance(pickPoint, vEnd);
        const isExtendingEnd = dEnd < dStart;

        const rayOrigin = isExtendingEnd ? vEnd : vStart;
        const refPoint = isExtendingEnd ? verts[verts.length - 2] : verts[1];
        const rayDir = normalize(vector(refPoint, rayOrigin));

        const mockInfiniteGeo = {
            type: 'LINE' as const,
            start: rayOrigin,
            end: {
                x: rayOrigin.x + rayDir.x * 1000000,
                y: rayOrigin.y + rayDir.y * 1000000
            }
        };

        const mockEntity = {
            id: 'mock',
            geometry: mockInfiniteGeo
        } as CadEntity;

        let bestPt: Point | null = null;
        let bestDistChange = Infinity;

        this.boundaries.forEach(boundary => {
            if (boundary.id === entity.id) return;
            const points = findAllIntersections(mockEntity, boundary);
            points.forEach(pt => {
                const vPt = vector(rayOrigin, pt);
                const projection = dot(vPt, rayDir);
                if (projection > 0.001) {
                    const diff = distance(rayOrigin, pt);
                    if (diff < bestDistChange) {
                        bestDistChange = diff;
                        bestPt = pt;
                    }
                }
            });
        });

        if (bestPt) {
            const store = useCadStore.getState();
            store.pushHistory('Extend Polyline');
            store.removeEntity(entity.id);
            if (isExtendingEnd) {
                verts[verts.length - 1] = bestPt;
            } else {
                verts[0] = bestPt;
            }
            store.addEntity(
                createPolylineEntity(verts, false, entity.layerId, entity.color)
            );
            this.setPrompt('Polyline extended. Select next object to extend:');
        } else {
            this.setPrompt('No boundary intersection found in direction of extension.');
        }
    }

    onMouseMove(_point: Point): void {
        // Future: interactive preview
    }
}

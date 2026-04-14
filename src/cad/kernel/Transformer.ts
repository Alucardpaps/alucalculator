
import { CadEntity, Point, createLineEntity, createCircleEntity, createPolylineEntity } from './types';
import { add, sub, rotatePoint, mirrorPoint } from './GeometryKernel';

export class Transformer {
    /**
     * Moves an entity by a vector
     */
    static move(entity: CadEntity, vector: Point): CadEntity {
        const geom = entity.geometry;
        const newEntity = { ...entity, id: crypto.randomUUID() }; // Clone logic, ID should optionally be preserved or new? 
        // For 'Move', we usually keep ID. For 'Copy', new ID. 
        // This helper returns a NEW geometry structure. The caller decides ID.

        // Actually, let's just return the modified geometry properties, or a clone with same ID?
        // Let's return a clone with SAME ID by default (mutation-like), caller manages ID if Copy.

        if (geom.type === 'LINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: add(geom.start, vector),
                    end: add(geom.end, vector)
                }
            };
        } else if (geom.type === 'CIRCLE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'POLYLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    vertices: geom.vertices.map(v => add(v, vector))
                }
            };
        } else if (geom.type === 'ARC') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'POINT') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    x: geom.x + vector.x,
                    y: geom.y + vector.y
                }
            };
        }
        return entity;
    }

    static copy(entity: CadEntity, vector: Point): CadEntity {
        const moved = Transformer.move(entity, vector);
        return { ...moved, id: crypto.randomUUID() };
    }

    static rotate(entity: CadEntity, center: Point, angleRad: number): CadEntity {
        const geom = entity.geometry;

        if (geom.type === 'LINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: rotatePoint(geom.start, center, angleRad),
                    end: rotatePoint(geom.end, center, angleRad)
                }
            };
        } else if (geom.type === 'CIRCLE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad)
                }
            };
        } else if (geom.type === 'POLYLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    vertices: geom.vertices.map(v => rotatePoint(v, center, angleRad))
                }
            };
        } else if (geom.type === 'ARC') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    startAngle: geom.startAngle + angleRad,
                    endAngle: geom.endAngle + angleRad
                }
            };
        } else if (geom.type === 'POINT') {
            const p = rotatePoint({ x: geom.x, y: geom.y }, center, angleRad);
            return {
                ...entity,
                geometry: { ...geom, x: p.x, y: p.y }
            };
        }
        return entity;
    }

    static mirror(entity: CadEntity, axisStart: Point, axisEnd: Point): CadEntity {
        const geom = entity.geometry;

        if (geom.type === 'LINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: mirrorPoint(geom.start, axisStart, axisEnd),
                    end: mirrorPoint(geom.end, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'CIRCLE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'POLYLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    vertices: geom.vertices.map(v => mirrorPoint(v, axisStart, axisEnd))
                }
            };
        } else if (geom.type === 'ARC') {
            const axisAngle = Math.atan2(axisEnd.y - axisStart.y, axisEnd.x - axisStart.x);
            // new angle = 2*axisAngle - oldAngle
            let newStart = 2 * axisAngle - geom.endAngle;
            let newEnd = 2 * axisAngle - geom.startAngle;

            // Normalize
            while (newStart < 0) newStart += 2 * Math.PI;
            while (newEnd < 0) newEnd += 2 * Math.PI;
            while (newStart >= 2 * Math.PI) newStart -= 2 * Math.PI;
            while (newEnd >= 2 * Math.PI) newEnd -= 2 * Math.PI;

            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd),
                    startAngle: newStart,
                    endAngle: newEnd
                }
            };
        } else if (geom.type === 'POINT') {
            const p = mirrorPoint({ x: geom.x, y: geom.y }, axisStart, axisEnd);
            return {
                ...entity,
                geometry: { ...geom, x: p.x, y: p.y }
            };
        }
        return entity;
    }
}

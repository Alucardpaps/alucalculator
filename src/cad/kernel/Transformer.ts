
import { CadEntity, Point, createLineEntity, createCircleEntity, createPolylineEntity } from './types';
import { add, sub, rotatePoint, mirrorPoint } from './GeometryKernel';

export class Transformer {
    /**
     * Moves an entity by a vector (updates geometry and dynamic block base point)
     */
    static move(entity: CadEntity, vector: Point): CadEntity {
        const moved = Transformer.moveGeometry(entity, vector);
        if (entity.dynamicBasePoint) {
            return {
                ...moved,
                dynamicBasePoint: add(entity.dynamicBasePoint, vector)
            };
        }
        return moved;
    }

    private static moveGeometry(entity: CadEntity, vector: Point): CadEntity {
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
        } else if (geom.type === 'RECTANGLE' || geom.type === 'HEXAGON') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'ELLIPSE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'SPLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    controlPoints: geom.controlPoints.map(p => add(p, vector))
                }
            };
        } else if (geom.type === 'TEXT') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    position: add(geom.position, vector)
                }
            };
        } else if (geom.type === 'DIMENSION') {
            const textPt = geom.textPoint || { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 };
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: add(geom.start, vector),
                    end: add(geom.end, vector),
                    textPoint: add(textPt, vector)
                }
            };
        } else if (geom.type === 'LEADER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: add(geom.start, vector),
                    end: add(geom.end, vector)
                }
            };
        } else if (geom.type === 'HATCH') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    boundaryVertices: geom.boundaryVertices.map(v => add(v, vector)),
                    holes: geom.holes ? geom.holes.map(hole => hole.map(v => add(v, vector))) : undefined
                }
            };
        } else if (geom.type === 'BELT_PULLEY') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center1: add(geom.center1, vector),
                    center2: add(geom.center2, vector)
                }
            };
        } else if (geom.type === 'PLANETARY_GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
                }
            };
        } else if (geom.type === 'FASTENER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    origin: add(geom.origin, vector)
                }
            };
        } else if (geom.type === 'SPROCKET') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: add(geom.center, vector)
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
        const rotated = Transformer.rotateGeometry(entity, center, angleRad);
        if (entity.dynamicBasePoint || entity.dynamicRotationRad !== undefined) {
            return {
                ...rotated,
                ...(entity.dynamicBasePoint ? { dynamicBasePoint: rotatePoint(entity.dynamicBasePoint, center, angleRad) } : {}),
                ...(entity.dynamicRotationRad !== undefined ? { dynamicRotationRad: entity.dynamicRotationRad + angleRad } : {})
            };
        }
        return rotated;
    }

    private static rotateGeometry(entity: CadEntity, center: Point, angleRad: number): CadEntity {
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
        } else if (geom.type === 'RECTANGLE' || geom.type === 'HEXAGON') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    rotation: (geom.rotation || 0) + angleRad
                }
            };
        } else if (geom.type === 'ELLIPSE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    rotation: (geom.rotation || 0) + angleRad
                }
            };
        } else if (geom.type === 'SPLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    controlPoints: geom.controlPoints.map(p => rotatePoint(p, center, angleRad))
                }
            };
        } else if (geom.type === 'TEXT') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    position: rotatePoint(geom.position, center, angleRad),
                    rotation: (geom.rotation || 0) + angleRad
                }
            };
        } else if (geom.type === 'DIMENSION') {
            const textPt = geom.textPoint || { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 };
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: rotatePoint(geom.start, center, angleRad),
                    end: rotatePoint(geom.end, center, angleRad),
                    textPoint: rotatePoint(textPt, center, angleRad)
                }
            };
        } else if (geom.type === 'LEADER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: rotatePoint(geom.start, center, angleRad),
                    end: rotatePoint(geom.end, center, angleRad)
                }
            };
        } else if (geom.type === 'HATCH') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    boundaryVertices: geom.boundaryVertices.map(v => rotatePoint(v, center, angleRad)),
                    holes: geom.holes ? geom.holes.map(hole => hole.map(v => rotatePoint(v, center, angleRad))) : undefined,
                    angle: ((geom.angle || 0) + (angleRad * 180 / Math.PI)) % 360
                }
            };
        } else if (geom.type === 'BELT_PULLEY') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center1: rotatePoint(geom.center1, center, angleRad),
                    center2: rotatePoint(geom.center2, center, angleRad)
                }
            };
        } else if (geom.type === 'PLANETARY_GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    rotationSun: (geom.rotationSun || 0) + angleRad,
                    rotationCarrier: (geom.rotationCarrier || 0) + angleRad
                }
            };
        } else if (geom.type === 'GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    rotation: (geom.rotation || 0) + angleRad
                }
            };
        } else if (geom.type === 'FASTENER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    origin: rotatePoint(geom.origin, center, angleRad),
                    rotation: (geom.rotation !== undefined ? geom.rotation : -Math.PI / 2) + angleRad
                }
            };
        } else if (geom.type === 'SPROCKET') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: rotatePoint(geom.center, center, angleRad),
                    rotation: (geom.rotation || 0) + angleRad
                }
            };
        }
        return entity;
    }

    static mirror(entity: CadEntity, axisStart: Point, axisEnd: Point): CadEntity {
        const mirrored = Transformer.mirrorGeometry(entity, axisStart, axisEnd);
        if (entity.dynamicBasePoint) {
            return {
                ...mirrored,
                dynamicBasePoint: mirrorPoint(entity.dynamicBasePoint, axisStart, axisEnd)
            };
        }
        return mirrored;
    }

    private static mirrorGeometry(entity: CadEntity, axisStart: Point, axisEnd: Point): CadEntity {
        const geom = entity.geometry;
        const axisAngle = Math.atan2(axisEnd.y - axisStart.y, axisEnd.x - axisStart.x);

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
        } else if (geom.type === 'RECTANGLE' || geom.type === 'HEXAGON') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation || 0)
                }
            };
        } else if (geom.type === 'ELLIPSE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation || 0)
                }
            };
        } else if (geom.type === 'SPLINE') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    controlPoints: geom.controlPoints.map(p => mirrorPoint(p, axisStart, axisEnd))
                }
            };
        } else if (geom.type === 'TEXT') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    position: mirrorPoint(geom.position, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation || 0)
                }
            };
        } else if (geom.type === 'DIMENSION') {
            const textPt = geom.textPoint || { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 };
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: mirrorPoint(geom.start, axisStart, axisEnd),
                    end: mirrorPoint(geom.end, axisStart, axisEnd),
                    textPoint: mirrorPoint(textPt, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'LEADER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: mirrorPoint(geom.start, axisStart, axisEnd),
                    end: mirrorPoint(geom.end, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'HATCH') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    boundaryVertices: geom.boundaryVertices.map(v => mirrorPoint(v, axisStart, axisEnd)),
                    holes: geom.holes ? geom.holes.map(hole => hole.map(v => mirrorPoint(v, axisStart, axisEnd))) : undefined
                }
            };
        } else if (geom.type === 'BELT_PULLEY') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center1: mirrorPoint(geom.center1, axisStart, axisEnd),
                    center2: mirrorPoint(geom.center2, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'PLANETARY_GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd)
                }
            };
        } else if (geom.type === 'GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation || 0)
                }
            };
        } else if (geom.type === 'FASTENER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    origin: mirrorPoint(geom.origin, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation !== undefined ? geom.rotation : -Math.PI / 2)
                }
            };
        } else if (geom.type === 'SPROCKET') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: mirrorPoint(geom.center, axisStart, axisEnd),
                    rotation: 2 * axisAngle - (geom.rotation || 0)
                }
            };
        }
        return entity;
    }

    /**
     * Uniform scale about a base point. Radius/size properties are multiplied
     * by |factor|; a negative factor mirrors through the base point.
     */
    static scale(entity: CadEntity, base: Point, factor: number): CadEntity {
        const scaled = Transformer.scaleGeometry(entity, base, factor);
        if (entity.dynamicBasePoint || entity.dynamicScale !== undefined) {
            const sc = (p: Point): Point => ({
                x: base.x + (p.x - base.x) * factor,
                y: base.y + (p.y - base.y) * factor,
            });
            return {
                ...scaled,
                ...(entity.dynamicBasePoint ? { dynamicBasePoint: sc(entity.dynamicBasePoint) } : {}),
                ...(entity.dynamicScale !== undefined ? { dynamicScale: entity.dynamicScale * Math.abs(factor) } : {})
            };
        }
        return scaled;
    }

    private static scaleGeometry(entity: CadEntity, base: Point, factor: number): CadEntity {
        const geom = entity.geometry;
        const k = factor;
        const abs = Math.abs(k);
        const sc = (p: Point): Point => ({
            x: base.x + (p.x - base.x) * k,
            y: base.y + (p.y - base.y) * k,
        });

        if (geom.type === 'LINE') {
            return { ...entity, geometry: { ...geom, start: sc(geom.start), end: sc(geom.end) } };
        }
        if (geom.type === 'CIRCLE') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), radius: geom.radius * abs } };
        }
        if (geom.type === 'ARC') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), radius: geom.radius * abs } };
        }
        if (geom.type === 'POLYLINE') {
            return { ...entity, geometry: { ...geom, vertices: geom.vertices.map(sc) } };
        }
        if (geom.type === 'POINT') {
            const p = sc({ x: geom.x, y: geom.y });
            return { ...entity, geometry: { ...geom, x: p.x, y: p.y } };
        }
        if (geom.type === 'RECTANGLE') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), width: geom.width * abs, height: geom.height * abs } };
        }
        if (geom.type === 'HEXAGON') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), radius: geom.radius * abs } };
        }
        if (geom.type === 'TEXT') {
            return { ...entity, geometry: { ...geom, position: sc(geom.position), fontSize: geom.fontSize * abs } };
        }
        if (geom.type === 'ELLIPSE') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), radiusX: geom.radiusX * abs, radiusY: geom.radiusY * abs } };
        }
        if (geom.type === 'SPLINE') {
            return { ...entity, geometry: { ...geom, controlPoints: geom.controlPoints.map(sc) } };
        }
        if (geom.type === 'LEADER') {
            return { ...entity, geometry: { ...geom, start: sc(geom.start), end: sc(geom.end) } };
        }
        if (geom.type === 'HATCH') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    boundaryVertices: geom.boundaryVertices.map(sc),
                    holes: geom.holes ? geom.holes.map(hole => hole.map(sc)) : undefined
                }
            };
        }
        if (geom.type === 'DIMENSION') {
            const textPt = geom.textPoint || { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 };
            return {
                ...entity,
                geometry: {
                    ...geom,
                    start: sc(geom.start),
                    end: sc(geom.end),
                    textPoint: sc(textPt),
                    value: geom.value * abs,
                },
            };
        }
        if (geom.type === 'BELT_PULLEY') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center1: sc(geom.center1),
                    radius1: geom.radius1 * abs,
                    center2: sc(geom.center2),
                    radius2: geom.radius2 * abs,
                },
            };
        }
        if (geom.type === 'PLANETARY_GEAR') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: sc(geom.center),
                    module: geom.module * abs,
                },
            };
        }
        if (geom.type === 'GEAR') {
            return { ...entity, geometry: { ...geom, center: sc(geom.center), module: geom.module * abs } };
        }
        if (geom.type === 'FASTENER') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    origin: sc(geom.origin),
                    diameter: geom.diameter * abs,
                    length: geom.length * abs,
                },
            };
        }
        if (geom.type === 'SPROCKET') {
            return {
                ...entity,
                geometry: {
                    ...geom,
                    center: sc(geom.center),
                    pitch: geom.pitch * abs,
                    rollerDiameter: geom.rollerDiameter * abs,
                    boreDiameter: geom.boreDiameter * abs,
                },
            };
        }
        return entity;
    }
}

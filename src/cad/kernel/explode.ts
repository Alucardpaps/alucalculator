/**
 * AluCAD — EXPLODE.
 *
 * Breaks compound objects into basic ones, from the same primitive decomposition the
 * canvas and the exporters use: polylines, rectangles and polygons into lines; gears,
 * sprockets, planetary sets, fasteners and belt drives into polylines, circles, arcs and
 * lines; dimensions and leaders into lines, arrowheads and text; hatches into their
 * pattern lines and boundary. Centre / hidden / dashed reference lines land on CENTER,
 * HIDDEN and DASHED layers (created on demand) so they keep their linetype.
 * Lines, circles, arcs, ellipses, splines, text and points are not explodable.
 */

import type { CadEntity, GeometryType, Layer, Point } from './types';
import type { Primitive, PrimStyle } from './primitiveTypes';
import { flattenPrimitive, geometryPrimitives } from './primitives';
import { ccwSweep, TAU } from './shapes';
import { hatchSegments } from './hatchPatterns';

const EXPLODABLE: ReadonlyArray<GeometryType['type']> = [
    'POLYLINE', 'RECTANGLE', 'HEXAGON', 'GEAR', 'SPROCKET', 'PLANETARY_GEAR', 'FASTENER', 'BELT_PULLEY',
    'DIMENSION', 'LEADER', 'HATCH',
];

export const isExplodable = (e: CadEntity) => EXPLODABLE.includes(e.geometry.type);

export const REFERENCE_LAYERS: Readonly<Record<'center' | 'hidden' | 'dashed', { name: string; lineType: string }>> = {
    center: { name: 'CENTER', lineType: 'CENTER' },
    hidden: { name: 'HIDDEN', lineType: 'HIDDEN' },
    dashed: { name: 'DASHED', lineType: 'DASHED' },
};

export interface ExplodeResult {
    entities: CadEntity[];
    /** reference layers (by REFERENCE_LAYERS key) the result needs */
    layersNeeded: Set<keyof typeof REFERENCE_LAYERS>;
}

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).slice(2, 11)}`);

/** Layer id for a reference style, matching `ensureReferenceLayers`. */
export const referenceLayerId = (key: keyof typeof REFERENCE_LAYERS) => `layer-ref-${key}`;

function pieces(p: Primitive, base: Omit<CadEntity, 'id' | 'geometry'>): CadEntity[] {
    const make = (geometry: GeometryType): CadEntity => ({ ...base, id: uid(), geometry });
    switch (p.kind) {
        case 'line':
            return [make({ type: 'LINE', start: p.a, end: p.b })];
        case 'circle':
            return [make({ type: 'CIRCLE', center: p.c, radius: p.r })];
        case 'arc':
            return ccwSweep(p.start, p.end) >= TAU - 1e-9
                ? [make({ type: 'CIRCLE', center: p.c, radius: p.r })]
                : [make({ type: 'ARC', center: p.c, radius: p.r, startAngle: p.start, endAngle: p.end })];
        case 'ellipse':
            return [make({
                type: 'ELLIPSE', center: p.c, radiusX: p.rx, radiusY: p.ry, rotation: p.rotation,
                ...(p.sweep >= TAU - 1e-9 ? {} : { startAngle: p.start, endAngle: p.start + p.sweep }),
            })];
        case 'polyline': {
            // straight polylines explode into lines (AutoCAD), arcs keep their shape as arcs
            const n = p.points.length;
            const out: CadEntity[] = [];
            const segs = p.closed ? n : n - 1;
            for (let i = 0; i < segs; i++) {
                const a = p.points[i], b = p.points[(i + 1) % n];
                const bulge = p.bulges?.[i] ?? 0;
                if (Math.abs(bulge) > 1e-12) {
                    const chain = flattenPrimitive({ kind: 'polyline', points: [a, b], bulges: [bulge], closed: false, style: p.style }, 0.01)[0];
                    out.push(make({ type: 'POLYLINE', vertices: chain, closed: false }));
                } else if (Math.hypot(b.x - a.x, b.y - a.y) > 1e-9) {
                    out.push(make({ type: 'LINE', start: a, end: b }));
                }
            }
            return out;
        }
        case 'spline':
            return [make({ type: 'SPLINE', controlPoints: p.points, closed: p.closed })];
        case 'text':
            return [make({
                type: 'TEXT', position: p.position, content: p.content, fontSize: p.height, fontFamily: 'JetBrains Mono, monospace',
                rotation: p.rotation, justification: p.align, bold: Boolean(p.bold), italic: Boolean(p.italic),
            })];
        case 'point':
            return [make({ type: 'POINT', x: p.p.x, y: p.p.y })];
        case 'hatch': {
            if (p.pattern === 'SOLID') return [];
            const { segments } = hatchSegments(p.rings, p.pattern, p.scale, p.angle, 20_000);
            return segments.map(([a, b]: [Point, Point]) => make({ type: 'LINE', start: a, end: b }));
        }
        default:
            return [];
    }
}

/** Basic entities replacing `entity`, or null when it is not explodable. */
export function explodeEntity(entity: CadEntity, units = 'mm'): ExplodeResult | null {
    if (!isExplodable(entity)) return null;
    const layersNeeded = new Set<keyof typeof REFERENCE_LAYERS>();
    const out: CadEntity[] = [];
    const g = entity.geometry;
    // polylines, rectangles and polygons give one line per side; a hatch gives its
    // pattern lines plus the boundary it draws
    for (const p of geometryPrimitives(g, units)) {
        const style: PrimStyle = p.style;
        const refKey = style === 'center' || style === 'hidden' || style === 'dashed' ? style : null;
        if (refKey) layersNeeded.add(refKey);
        const base = {
            layerId: refKey ? referenceLayerId(refKey) : entity.layerId,
            color: entity.color,
            isVisible: true,
            isSelected: true,
        };
        out.push(...pieces(p, base));
    }
    return { entities: out, layersNeeded };
}

/** Reference layers to add so exploded centre / hidden / dashed lines keep their linetype. */
export function missingReferenceLayers(layers: Layer[], needed: Iterable<keyof typeof REFERENCE_LAYERS>): Layer[] {
    const add: Layer[] = [];
    for (const key of needed) {
        const id = referenceLayerId(key);
        if (layers.some((l) => l.id === id) || add.some((l) => l.id === id)) continue;
        const def = REFERENCE_LAYERS[key];
        add.push({ id, name: def.name, color: '#8a96a6', visible: true, locked: false, frozen: false, lineType: def.lineType, lineWeight: 1 });
    }
    return add;
}

/**
 * AluCAD DXF importer (ASCII DXF R12 … R2018, via dxf-parser).
 *
 * Entities: LINE, CIRCLE, ARC, ELLIPSE (full and partial), LWPOLYLINE / POLYLINE (bulges,
 * closing bulge, clockwise bulges), SPLINE (true B-spline → polyline), POINT, TEXT,
 * MTEXT, INSERT (block references: nested, scaled, rotated, mirrored, arrays) and
 * DIMENSION (imported as the geometry of its dimension block).
 *
 * - $INSUNITS is honoured: inch, foot, cm, m … drawings land in millimetres.
 * - Colours: explicit ACI / true colour, BYLAYER (layer colour), BYBLOCK (insert colour).
 * - Layers: name, colour, visibility and frozen state; block content on layer "0" takes
 *   the layer of its INSERT (AutoCAD rule).
 * - OCS mirroring (extrusion Z = −1) is applied; paper-space entities are skipped.
 */

import DxfParserLib from 'dxf-parser';
import {
    CadEntity,
    Layer,
    Point,
    createArcEntity,
    createCircleEntity,
    createEllipseEntity,
    createLineEntity,
    createPointEntity,
    createPolylineEntity,
    createTextEntity,
} from '../kernel/types';
import { DEFAULT_LAYER } from '../kernel/constants';
import {
    decodeDxfUnicode,
    INSUNITS_NAMES,
    INSUNITS_TO_MM,
    MIRROR_X,
    apply,
    applyLinear,
    arcPoints,
    compose,
    determinant,
    dist,
    ellipsePoints,
    insertTransform,
    isSimilarity,
    ocsMirrored,
    polylinePoints,
    rgbIntToHex,
    rotationOf,
    scaleOf,
    splinePoints,
    type Affine,
} from '@/lib/dxf/dxfGeometry';

export interface DxfParseResult {
    entities: CadEntity[];
    layers: Layer[];
    unitScale: number;
    warnings: string[];
}

// Loosely typed dxf-parser output (fields differ per entity type)
interface RawEntity {
    type: string;
    layer?: string;
    color?: number;
    colorIndex?: number;
    inPaperSpace?: boolean;
    vertices?: Array<{ x: number; y: number; bulge?: number; splineControlPoint?: boolean }>;
    center?: { x: number; y: number };
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    majorAxisEndPoint?: { x: number; y: number };
    axisRatio?: number;
    shape?: boolean;
    isPolyfaceMesh?: boolean;
    is3dPolygonMesh?: boolean;
    controlPoints?: Array<{ x: number; y: number }>;
    fitPoints?: Array<{ x: number; y: number }>;
    knotValues?: number[];
    degreeOfSplineCurve?: number;
    closed?: boolean;
    position?: { x: number; y: number };
    name?: string;
    xScale?: number;
    yScale?: number;
    rotation?: number;
    columnCount?: number;
    rowCount?: number;
    columnSpacing?: number;
    rowSpacing?: number;
    extrusionDirectionZ?: number;
    extrusionDirection?: { x: number; y: number; z: number };
    // TEXT / MTEXT
    text?: string;
    startPoint?: { x: number; y: number };
    endPoint?: { x: number; y: number };
    textHeight?: number;
    height?: number;
    halign?: number;
    attachmentPoint?: number;
    directionVector?: { x: number; y: number };
    // DIMENSION
    block?: string;
}

interface RawBlock {
    name?: string;
    position?: { x: number; y: number };
    entities?: RawEntity[];
}

interface ParsedDxf {
    entities?: RawEntity[];
    blocks?: Record<string, RawBlock>;
    header?: Record<string, unknown>;
    tables?: { layer?: { layers?: Record<string, RawLayer> } };
}

interface RawLayer {
    name?: string;
    color?: number;
    colorIndex?: number;
    visible?: boolean;
    frozen?: boolean;
}

const DEFAULT_INK = '#ffffff'; // ACI 7; the canvas maps it to the theme's ink

function layerIdFromName(name: string): string {
    const n = decodeDxfUnicode(name || '0').trim();
    return n === '0' ? DEFAULT_LAYER.id : `layer-${n}`;
}

/** AutoCAD text control codes and MTEXT formatting → plain text. */
function cleanText(raw: string, mtext: boolean): string {
    let t = decodeDxfUnicode(raw || '');
    t = t.replace(/%%[cC]/g, 'Ø').replace(/%%[dD]/g, '°').replace(/%%[pP]/g, '±').replace(/%%%/g, '%');
    if (mtext) {
        t = t
            .replace(/\\P/g, ' ')
            .replace(/\\~/g, ' ')
            .replace(/\\[ACcFfHhLlOoQqTtWw][^;\\{}]*;?/g, '')
            .replace(/\\S([^;]*)\^([^;]*);/g, '$1/$2')
            .replace(/[{}]/g, '');
    }
    return t.replace(/\s+/g, ' ').trim();
}

const TAU = Math.PI * 2;
/** angle in [0, 2π) — arcs are stored CCW from start to end, wrapping through 0 */
const norm2pi = (a: number) => ((a % TAU) + TAU) % TAU;

const VISIBLE_GEOMETRY = ['LINE', 'CIRCLE', 'ARC', 'ELLIPSE', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'POINT', 'TEXT', 'MTEXT'];

export function parseDXF(dxfContent: string): DxfParseResult {
    const warnings: string[] = [];
    if (!dxfContent || !dxfContent.trim()) {
        return { entities: [], layers: [], unitScale: 1, warnings: ['Empty DXF'] };
    }

    let dxf: ParsedDxf | null = null;
    try {
        dxf = new DxfParserLib().parseSync(dxfContent) as unknown as ParsedDxf | null;
    } catch (err) {
        return {
            entities: [],
            layers: [],
            unitScale: 1,
            warnings: [`DXF parse error: ${err instanceof Error ? err.message : 'unreadable file'}`],
        };
    }
    if (!dxf) return { entities: [], layers: [], unitScale: 1, warnings: ['Empty DXF'] };

    // ── units ──
    const insUnits = Number(dxf.header?.['$INSUNITS'] ?? 0);
    const unitScale = INSUNITS_TO_MM[insUnits] ?? 1;
    if (unitScale !== 1) {
        warnings.push(`Drawing units: ${INSUNITS_NAMES[insUnits] ?? insUnits} — converted to millimetres (×${unitScale}).`);
    }

    // ── layers ──
    const layers: Layer[] = [{ ...DEFAULT_LAYER }];
    const layerColor = new Map<string, string>([['0', DEFAULT_INK]]);
    for (const [key, l] of Object.entries(dxf.tables?.layer?.layers ?? {})) {
        const name = (l.name || key || '0').trim() || '0';
        const color = typeof l.color === 'number' ? rgbIntToHex(l.color) : DEFAULT_INK;
        layerColor.set(name, color);
        if (name === '0') {
            layers[0] = { ...layers[0], color, visible: l.visible !== false };
            continue;
        }
        layers.push({
            id: layerIdFromName(name),
            name: decodeDxfUnicode(name),
            color,
            visible: l.visible !== false,
            locked: false,
            frozen: !!l.frozen,
            lineType: 'CONTINUOUS',
            lineWeight: 1,
        });
    }

    const entities: CadEntity[] = [];
    const skipped: Record<string, number> = {};
    const skip = (type: string) => (skipped[type] = (skipped[type] || 0) + 1);

    const resolveColor = (e: RawEntity, layerName: string, byBlock: string | null): string => {
        const idx = e.colorIndex;
        if (typeof e.color === 'number' && idx !== 0 && idx !== 256) return rgbIntToHex(e.color);
        if (idx === 0 && byBlock) return byBlock;
        return layerColor.get(layerName) ?? DEFAULT_INK;
    };

    const pushPolyline = (pts: Point[], closed: boolean, layerId: string, color: string) => {
        if (pts.length < 2) return;
        entities.push(createPolylineEntity(pts, closed, layerId, color));
    };

    const visit = (list: RawEntity[], m: Affine, depth: number, insertLayer: string | null, byBlock: string | null) => {
        for (const e of list) {
            if (e.inPaperSpace) continue;
            const ownLayer = (e.layer || '0').trim() || '0';
            const layerName = ownLayer === '0' && insertLayer ? insertLayer : ownLayer;
            const layerId = layerIdFromName(layerName);
            const color = resolveColor(e, layerName, byBlock);
            const local = ocsMirrored(e) ? compose(m, MIRROR_X) : m;
            const similar = isSimilarity(local);
            const s = scaleOf(local);
            const mirrored = determinant(local) < 0;

            try {
                switch (e.type) {
                    case 'LINE': {
                        const a = e.vertices?.[0];
                        const b = e.vertices?.[1];
                        if (!a || !b) break;
                        entities.push(createLineEntity(apply(local, a), apply(local, b), layerId, color));
                        break;
                    }
                    case 'CIRCLE': {
                        if (!e.center || !e.radius) break;
                        if (similar) {
                            entities.push(createCircleEntity(apply(local, e.center), e.radius * s, layerId, color));
                        } else {
                            const pts = arcPoints(e.center.x, e.center.y, e.radius, 0, Math.PI * 2);
                            pts.pop();
                            pushPolyline(pts.map((p) => apply(local, p)), true, layerId, color);
                        }
                        break;
                    }
                    case 'ARC': {
                        if (!e.center || !e.radius) break;
                        const a0 = e.startAngle ?? 0;
                        let a1 = e.endAngle ?? Math.PI * 2;
                        if (a1 <= a0) a1 += Math.PI * 2;
                        if (similar) {
                            const rot = rotationOf(local);
                            const start = norm2pi(mirrored ? rot - a1 : rot + a0);
                            const end = norm2pi(mirrored ? rot - a0 : rot + a1);
                            entities.push(createArcEntity(apply(local, e.center), e.radius * s, start, end, layerId, color));
                        } else {
                            pushPolyline(arcPoints(e.center.x, e.center.y, e.radius, a0, a1 - a0).map((p) => apply(local, p)), false, layerId, color);
                        }
                        break;
                    }
                    case 'ELLIPSE': {
                        if (!e.center || !e.majorAxisEndPoint) break;
                        const shape = ellipsePoints({
                            center: e.center,
                            majorAxisEndPoint: e.majorAxisEndPoint,
                            axisRatio: e.axisRatio,
                            startAngle: e.startAngle,
                            endAngle: e.endAngle,
                        });
                        if (similar) {
                            const major = applyLinear(local, e.majorAxisEndPoint);
                            const rx = Math.hypot(major.x, major.y);
                            const ry = rx * (e.axisRatio ?? 1);
                            const rotation = Math.atan2(major.y, major.x);
                            let start: number | undefined;
                            let end: number | undefined;
                            if (!shape.closed) {
                                const t0 = e.startAngle ?? 0;
                                let t1 = e.endAngle ?? Math.PI * 2;
                                if (t1 <= t0) t1 += Math.PI * 2;
                                start = mirrored ? -t1 : t0;
                                end = mirrored ? -t0 : t1;
                            }
                            entities.push(createEllipseEntity(apply(local, e.center), rx, ry, layerId, color, rotation, undefined, start, end));
                        } else {
                            pushPolyline(shape.points.map((p) => apply(local, p)), shape.closed, layerId, color);
                        }
                        break;
                    }
                    case 'LWPOLYLINE':
                    case 'POLYLINE': {
                        if (e.isPolyfaceMesh || e.is3dPolygonMesh) {
                            skip(`${e.type} mesh`);
                            break;
                        }
                        const verts = (e.vertices ?? []).filter((v) => !v.splineControlPoint);
                        if (verts.length < 2) break;
                        let closed = !!e.shape;
                        const pts = polylinePoints(verts, closed);
                        if (!closed && pts.length > 2 && dist(pts[0], pts[pts.length - 1]) < 1e-9) {
                            pts.pop();
                            closed = true;
                        }
                        pushPolyline(pts.map((p) => apply(local, p)), closed, layerId, color);
                        break;
                    }
                    case 'SPLINE': {
                        const pts = splinePoints(e);
                        if (pts.length < 2) break;
                        let closed = !!e.closed;
                        if (pts.length > 2 && dist(pts[0], pts[pts.length - 1]) < 1e-9) {
                            pts.pop();
                            closed = true;
                        }
                        pushPolyline(pts.map((p) => apply(local, p)), closed, layerId, color);
                        break;
                    }
                    case 'POINT': {
                        if (!e.position) break;
                        const p = apply(local, e.position);
                        entities.push(createPointEntity(p.x, p.y, layerId, color));
                        break;
                    }
                    case 'TEXT':
                    case 'MTEXT': {
                        const isM = e.type === 'MTEXT';
                        const content = cleanText(e.text ?? '', isM);
                        if (!content) break;
                        const h = (isM ? e.height : e.textHeight) || 2.5;
                        let rot = ((e.rotation ?? 0) * Math.PI) / 180;
                        if (isM && e.directionVector && (e.directionVector.x || e.directionVector.y)) {
                            rot = Math.atan2(e.directionVector.y, e.directionVector.x);
                        }
                        let justification: 'left' | 'center' | 'right' = 'left';
                        let anchor = e.startPoint ?? e.position;
                        if (isM) {
                            const ap = e.attachmentPoint ?? 1;
                            justification = ap % 3 === 2 ? 'center' : ap % 3 === 0 ? 'right' : 'left';
                            anchor = e.position;
                        } else if ((e.halign === 1 || e.halign === 2 || e.halign === 4) && e.endPoint) {
                            justification = e.halign === 2 ? 'right' : 'center';
                            anchor = e.endPoint;
                        }
                        if (!anchor) break;
                        // AluCAD draws text from its top edge; TEXT anchors sit on the baseline
                        const top = isM ? anchor : { x: anchor.x - Math.sin(rot) * h, y: anchor.y + Math.cos(rot) * h };
                        const ent = createTextEntity(apply(local, top), content, h * s, layerId, color, justification);
                        if (ent.geometry.type === 'TEXT') ent.geometry.rotation = rot + rotationOf(local);
                        entities.push(ent);
                        break;
                    }
                    case 'INSERT': {
                        const block = e.name ? dxf!.blocks?.[e.name] : undefined;
                        if (!block?.entities || depth > 8) {
                            skip('INSERT');
                            break;
                        }
                        const base = block.position ?? { x: 0, y: 0 };
                        const cols = Math.max(1, e.columnCount ?? 1);
                        const rows = Math.max(1, e.rowCount ?? 1);
                        for (let r = 0; r < rows; r++) {
                            for (let c = 0; c < cols; c++) {
                                const shifted: RawEntity = {
                                    ...e,
                                    position: {
                                        x: (e.position?.x ?? 0) + c * (e.columnSpacing ?? 0),
                                        y: (e.position?.y ?? 0) + r * (e.rowSpacing ?? 0),
                                    },
                                };
                                visit(block.entities, compose(m, insertTransform(shifted, base)), depth + 1, layerName, color);
                            }
                        }
                        break;
                    }
                    case 'DIMENSION': {
                        // the dimension's appearance lives in an anonymous block in world coordinates
                        const block = e.block ? dxf!.blocks?.[e.block] : undefined;
                        if (block?.entities && depth <= 8) visit(block.entities, m, depth + 1, layerName, color);
                        else skip('DIMENSION');
                        break;
                    }
                    default:
                        if (!VISIBLE_GEOMETRY.includes(e.type)) skip(e.type);
                }
            } catch (err) {
                warnings.push(`Skipped ${e.type}: ${err instanceof Error ? err.message : 'parse error'}`);
            }
        }
    };

    visit(dxf.entities ?? [], [unitScale, 0, 0, unitScale, 0, 0], 0, null, null);

    const skippedList = Object.entries(skipped).filter(([t]) => !['ATTRIB', 'ATTDEF', 'VIEWPORT'].includes(t));
    if (skippedList.length > 0) {
        warnings.push(`Not imported: ${skippedList.map(([t, n]) => `${n} ${t}`).join(', ')}.`);
    }
    if (entities.length === 0) warnings.push('No supported DXF entities (LINE, CIRCLE, ARC, ELLIPSE, POLYLINE, SPLINE, TEXT, INSERT)');
    return { entities, layers, unitScale, warnings };
}

/** @deprecated Use parseDXF().entities */
export function simpleParseDXF(text: string): CadEntity[] {
    return parseDXF(text).entities;
}

export function importDxfText(dxfContent: string): DxfParseResult {
    return parseDXF(dxfContent);
}

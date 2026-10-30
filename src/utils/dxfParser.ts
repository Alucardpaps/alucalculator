/**
 * DXF → nesting parts.
 *
 * Reads the geometry of a DXF drawing and turns every closed outline into a Part2D
 * (outer contour + holes, millimetres, Y up).
 *
 *  - Entities: LINE, ARC, CIRCLE, ELLIPSE, LWPOLYLINE / POLYLINE (with bulges, including
 *    the closing segment and negative = clockwise bulges), SPLINE (de Boor evaluation of
 *    the B-spline, fit points as fallback) and INSERT (block references, nested, with
 *    position / scale / rotation / mirror).
 *  - Loose LINE / ARC / open polyline pieces are chained end-to-end into closed loops
 *    (strict pass, then a tolerant pass for small drafting gaps).
 *  - $INSUNITS is honoured: inch, foot, cm, m … drawings are converted to millimetres.
 *  - OCS mirroring (extrusion Z = −1, typical for mirrored arcs and polylines) is applied.
 *  - Paper-space entities, frozen / hidden layers and the stock "SHEET" layer are skipped.
 *  - Outer contours are returned counter-clockwise, holes clockwise.
 *
 * Note: dxf-parser 1.x stores ARC / CIRCLE angles in radians and LINE end points in
 * `vertices`; this module relies on that format.
 */

import DxfParser from 'dxf-parser';
import type { Point2D, Polygon, Part2D, BoundingBox } from '@/types/nesting2d.types';
import { buildPartHierarchy } from '@/cam/core/hierarchy';
import {
    INSUNITS_NAMES as UNIT_NAMES,
    INSUNITS_TO_MM,
    MIRROR_X,
    apply,
    arcPoints,
    compose,
    dist,
    ellipsePoints,
    insertTransform,
    ocsMirrored,
    polylinePoints,
    splinePoints,
    type Affine,
} from '@/lib/dxf/dxfGeometry';
import type { CamPart, Contour } from '@/cam/core/geometry';

// ============================================
// TYPES
// ============================================

export interface DxfParseResult {
    parts: Part2D[];
    errors: string[];
    warnings: string[];
    rawEntityCount: number;
    skippedTypes: Record<string, number>;
    /** Factor applied to convert drawing units to millimetres. */
    unitScale?: number;
    /** Pieces that could not be chained into a closed outline. */
    openContours?: number;
}

export interface DxfParseOptions {
    normalizeOrigin?: boolean; // default true
    autoTagMetadata?: boolean; // default true
    /** Override the unit conversion (drawing unit → mm). Default: from $INSUNITS. */
    unitScale?: number;
}

/** Loosely typed view of a dxf-parser entity (fields differ per entity type). */
interface DxfEntity {
    type: string;
    layer?: string;
    inPaperSpace?: boolean;
    // LINE (dxf-parser 1.x) / legacy start-end
    vertices?: Array<{ x: number; y: number; bulge?: number; splineControlPoint?: boolean }>;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    // ARC / CIRCLE / ELLIPSE
    center?: { x: number; y: number };
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    majorAxisEndPoint?: { x: number; y: number };
    axisRatio?: number;
    // POLYLINE
    shape?: boolean;
    is3dPolyline?: boolean;
    isPolyfaceMesh?: boolean;
    is3dPolygonMesh?: boolean;
    // SPLINE
    controlPoints?: Array<{ x: number; y: number }>;
    fitPoints?: Array<{ x: number; y: number }>;
    knotValues?: number[];
    degreeOfSplineCurve?: number;
    closed?: boolean;
    // INSERT
    name?: string;
    position?: { x: number; y: number };
    xScale?: number;
    yScale?: number;
    rotation?: number;
    columnCount?: number;
    rowCount?: number;
    columnSpacing?: number;
    rowSpacing?: number;
    // OCS extrusion
    extrusionDirectionZ?: number;
    extrusionDirection?: { x: number; y: number; z: number };
    // TEXT
    text?: string;
    string?: string;
    startPoint?: { x: number; y: number };
    insertionPoint?: { x: number; y: number };
}

interface DxfBlock {
    name?: string;
    position?: { x: number; y: number };
    entities?: DxfEntity[];
}

interface Path {
    points: Point2D[];
    closed: boolean;
}


// ============================================
// CONSTANTS
// ============================================


/** Minimum points to consider a valid polygon */
const MIN_POLYGON_POINTS = 3;



// ============================================
// GEOMETRY UTILITIES
// ============================================

function calculateBoundingBox(points: Point2D[]): BoundingBox {
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function signedArea(points: Point2D[]): number {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return area / 2;
}

function createPolygon(points: Point2D[]): Polygon {
    return {
        points,
        bounds: calculateBoundingBox(points),
        area: Math.abs(signedArea(points)),
    };
}

/** Return the contour with the requested orientation (counter-clockwise when ccw = true). */
function oriented(points: Point2D[], ccw: boolean): Point2D[] {
    const isCcw = signedArea(points) > 0;
    return isCcw === ccw ? points : [...points].reverse();
}

// ============================================
// TRANSFORMS (OCS mirror, block references, units)
// ============================================

// ============================================
// ENTITY → PATH
// ============================================

function entityPath(e: DxfEntity): Path | null {
    switch (e.type) {
        case 'LINE': {
            const a = e.vertices?.[0] ?? e.start;
            const b = e.vertices?.[1] ?? e.end;
            if (!a || !b) return null;
            return { points: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }], closed: false };
        }
        case 'ARC': {
            if (!e.center || !e.radius) return null;
            const a0 = e.startAngle ?? 0;
            let a1 = e.endAngle ?? Math.PI * 2;
            if (a1 <= a0) a1 += Math.PI * 2;
            return { points: arcPoints(e.center.x, e.center.y, e.radius, a0, a1 - a0), closed: false };
        }
        case 'CIRCLE': {
            if (!e.center || !e.radius) return null;
            const pts = arcPoints(e.center.x, e.center.y, e.radius, 0, Math.PI * 2);
            pts.pop();
            return { points: pts, closed: true };
        }
        case 'ELLIPSE': {
            if (!e.center || !e.majorAxisEndPoint) return null;
            return ellipsePoints({ center: e.center, majorAxisEndPoint: e.majorAxisEndPoint, axisRatio: e.axisRatio, startAngle: e.startAngle, endAngle: e.endAngle });
        }
        case 'LWPOLYLINE':
        case 'POLYLINE': {
            if (e.isPolyfaceMesh || e.is3dPolygonMesh) return null;
            const verts = (e.vertices ?? []).filter((v) => !v.splineControlPoint);
            if (verts.length < 2) return null;
            const closed = !!e.shape;
            return { points: polylinePoints(verts, closed), closed };
        }
        case 'SPLINE': {
            const pts = splinePoints(e);
            if (pts.length < 2) return null;
            const closed = !!e.closed || (pts.length > 2 && dist(pts[0], pts[pts.length - 1]) < 1e-9);
            if (closed && dist(pts[0], pts[pts.length - 1]) < 1e-9) pts.pop();
            return { points: pts, closed };
        }
        default:
            return null;
    }
}

// ============================================
// CHAINING
// ============================================

function dropClosingDuplicate(points: Point2D[], tol: number): Point2D[] {
    const out = [...points];
    while (out.length > 1 && dist(out[0], out[out.length - 1]) <= tol) out.pop();
    return out;
}

/**
 * Join open pieces whose end points meet (within `tol`) into closed loops.
 * Returns the closed loops and the pieces that stayed open.
 */
function chainOpenPaths(open: Path[], tol: number): { loops: Point2D[][]; rest: Path[] } {
    const loops: Point2D[][] = [];
    const rest: Path[] = [];
    if (open.length === 0) return { loops, rest };

    const cell = Math.max(tol * 4, 1e-9);
    const grid = new Map<string, Array<{ idx: number; end: 0 | 1 }>>();
    const keyOf = (ix: number, iy: number) => `${ix},${iy}`;
    const add = (p: Point2D, idx: number, end: 0 | 1) => {
        const k = keyOf(Math.floor(p.x / cell), Math.floor(p.y / cell));
        let list = grid.get(k);
        if (!list) grid.set(k, (list = []));
        list.push({ idx, end });
    };
    open.forEach((p, i) => {
        add(p.points[0], i, 0);
        add(p.points[p.points.length - 1], i, 1);
    });
    const used = new Array<boolean>(open.length).fill(false);

    const findMatch = (p: Point2D): { idx: number; end: 0 | 1 } | null => {
        const ix = Math.floor(p.x / cell), iy = Math.floor(p.y / cell);
        let best: { idx: number; end: 0 | 1 } | null = null;
        let bestD = tol;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (const cand of grid.get(keyOf(ix + dx, iy + dy)) ?? []) {
                    if (used[cand.idx]) continue;
                    const pts = open[cand.idx].points;
                    const q = cand.end === 0 ? pts[0] : pts[pts.length - 1];
                    const d = dist(p, q);
                    if (d <= bestD) {
                        bestD = d;
                        best = cand;
                    }
                }
            }
        }
        return best;
    };

    for (let i = 0; i < open.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        const chain = [...open[i].points];
        const pieces = [i];
        let closed = false;
        // extend forwards, then backwards
        for (const forward of [true, false]) {
            while (!closed) {
                const tip = forward ? chain[chain.length - 1] : chain[0];
                const m = findMatch(tip);
                if (!m) break;
                used[m.idx] = true;
                pieces.push(m.idx);
                const pts = open[m.idx].points;
                if (forward) {
                    const seq = m.end === 0 ? pts : [...pts].reverse();
                    chain.push(...seq.slice(1));
                } else {
                    const seq = m.end === 1 ? pts : [...pts].reverse();
                    chain.unshift(...seq.slice(0, -1));
                }
                closed = chain.length >= 3 && dist(chain[0], chain[chain.length - 1]) <= tol;
            }
            if (closed) break;
        }
        if (!closed) closed = chain.length >= 3 && dist(chain[0], chain[chain.length - 1]) <= tol;
        if (closed) {
            loops.push(dropClosingDuplicate(chain, tol));
        } else {
            // keep the joined piece; a later, more tolerant pass may still close it
            rest.push({ points: chain, closed: false });
        }
    }
    return { loops, rest };
}

// ============================================
// METADATA FROM TEXT
// ============================================

interface DxfTextTag {
    text: string;
    x: number;
    y: number;
    layer?: string;
}

/**
 * Strips DXF/RTF formatting codes from MTEXT strings
 */
function cleanDxfText(raw: string): string {
    if (!raw) return '';
    return raw
        .replace(/\\A[0-9];/g, '')
        .replace(/\\[A-Za-z][^;]*;/g, '')
        .replace(/[\{\}]/g, '')
        .replace(/\\P/g, ' ')
        .replace(/\^J/g, ' ')
        .trim();
}

/**
 * Extracts metadata (quantity, thickness, material, part name) from text tags or layer names
 */
function extractPartMetadata(tags: DxfTextTag[], layerNames: string[]): {
    quantity?: number;
    thickness?: number;
    material?: string;
    label?: string;
    notes?: string;
} {
    let quantity: number | undefined;
    let thickness: number | undefined;
    let material: string | undefined;
    let label: string | undefined;
    const collectedNotes: string[] = [];

    const allStrings = [
        ...tags.map(t => t.text),
        ...tags.map(t => t.layer || ''),
        ...layerNames
    ].filter(Boolean);

    for (const str of allStrings) {
        // Quantity pattern: ADET: 10, QTY: 5, 10 ADET, 10 PCS, x10, QTY_10
        if (quantity === undefined) {
            const qtyMatch = str.match(/(?:ADET|QTY|PIECES?|PCS|COUNT|AD)\s*[:=_-]?\s*(\d+)/i)
                || str.match(/\b(\d+)\s*(?:ADET|PCS|PIECES?)\b/i)
                || str.match(/(?:^|\s)[xX]\s*(\d+)(?:\s|$)/)
                || str.match(/\b(?:QTY|ADET)[_-]?(\d+)\b/i);
            if (qtyMatch) {
                const parsed = parseInt(qtyMatch[1], 10);
                if (parsed > 0 && parsed < 100000) {
                    quantity = parsed;
                }
            }
        }

        // Thickness pattern: KALINLIK: 15, THK: 15mm, 15 MM, T: 15, THK_15
        if (thickness === undefined) {
            const thkMatch = str.match(/(?:THK|KALINLIK|THICKNESS|KAL)\s*[:=_-]?\s*(\d+(?:[.,]\d+)?)\s*(?:MM)?/i)
                || str.match(/\b(?:THK|KAL|T)[_-]?(\d+(?:[.,]\d+)?)\b/i)
                || str.match(/\b(\d+(?:[.,]\d+)?)\s*MM\b/i);
            if (thkMatch) {
                const parsed = parseFloat(thkMatch[1].replace(',', '.'));
                if (parsed > 0 && parsed < 200) {
                    thickness = parsed;
                }
            }
        }

        // Material pattern: MALZEME: ST37, MAT: S235, ST-52, HARDOX 450, 6082-T6, 304, etc.
        if (material === undefined) {
            const matExplicit = str.match(/(?:MAT|MALZEME|MATERIAL)\s*[:=_-]?\s*([A-Za-z0-9\-_\s]+)/i);
            if (matExplicit) {
                material = matExplicit[1].trim();
            } else {
                const matStandard = str.match(/\b(ST-?37(?:-[0-9])?|ST-?52(?:-[0-9])?|S235(?:JR)?|S355(?:JR|J2)?|HARDOX\s*\d+|6082(?:-T6)?|6061(?:-T6)?|304L?|316L?|ALUM[Iİ]NYUM|PASLANMAZ|DKP)\b/i);
                if (matStandard) {
                    material = matStandard[1].trim();
                }
            }
        }

        // Name / Label pattern: PARCA: FLANS-1, NAME: LEVHA-A, ITEM: B1
        if (label === undefined) {
            const nameMatch = str.match(/(?:NAME|PARCA|PARÇA|LABEL|ITEM|NO)\s*[:=_-]?\s*([A-Za-z0-9\-_]+)/i);
            if (nameMatch) {
                label = nameMatch[1].trim();
            }
        }

        collectedNotes.push(str);
    }

    return {
        quantity,
        thickness,
        material,
        label,
        notes: collectedNotes.length > 0 ? collectedNotes.join(' | ') : undefined,
    };
}

// ============================================
// MAIN PARSER
// ============================================

const GEOMETRY_TYPES = ['LINE', 'ARC', 'CIRCLE', 'ELLIPSE', 'LWPOLYLINE', 'POLYLINE', 'SPLINE'];
const TEXT_TYPES = ['TEXT', 'MTEXT', 'DIMENSION', 'LEADER', 'ATTDEF', 'ATTRIB'];

/**
 * Parse DXF file content to Part2D array
 */
export function parseDxfContent(
    dxfContent: string,
    filename: string,
    options?: DxfParseOptions
): DxfParseResult {
    const normalizeOrigin = options?.normalizeOrigin !== false; // default: true
    const autoTagMetadata = options?.autoTagMetadata !== false; // default: true

    const parts: Part2D[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const skippedTypes: Record<string, number> = {};
    let rawEntityCount = 0;
    let unitScale = 1;
    let openContours = 0;

    try {
        const parser = new DxfParser();
        const dxf = parser.parseSync(dxfContent) as unknown as {
            entities?: DxfEntity[];
            blocks?: Record<string, DxfBlock>;
            header?: Record<string, unknown>;
            tables?: { layer?: { layers?: Record<string, { visible?: boolean; frozen?: boolean }> } };
        } | null;

        if (!dxf || !dxf.entities) {
            errors.push('No entities found in DXF file');
            return { parts, errors, warnings, rawEntityCount: 0, skippedTypes };
        }

        rawEntityCount = dxf.entities.length;

        // ── units ──
        const insUnits = Number(dxf.header?.['$INSUNITS'] ?? 0);
        if (options?.unitScale && options.unitScale > 0) {
            unitScale = options.unitScale;
        } else if (INSUNITS_TO_MM[insUnits] !== undefined) {
            unitScale = INSUNITS_TO_MM[insUnits];
            if (unitScale !== 1) {
                warnings.push(`Drawing units: ${UNIT_NAMES[insUnits] ?? insUnits} — converted to millimetres (×${unitScale}).`);
            }
        }
        const toMm: Affine = [unitScale, 0, 0, unitScale, 0, 0];

        const layers = dxf.tables?.layer?.layers ?? {};
        const layerHidden = (name?: string) => {
            if (!name) return false;
            const l = layers[name];
            return !!l && (l.frozen === true || l.visible === false);
        };

        // ── flatten model space (block references expanded) ──
        const paths: Path[] = [];
        const textTags: DxfTextTag[] = [];
        let sheetSkipped = 0;
        let hiddenSkipped = 0;

        const visit = (entities: DxfEntity[], m: Affine, depth: number) => {
            for (const e of entities) {
                if (e.inPaperSpace) continue;
                if (e.layer && e.layer.toUpperCase() === 'SHEET') {
                    if (GEOMETRY_TYPES.includes(e.type)) sheetSkipped++;
                    continue;
                }
                if (layerHidden(e.layer)) {
                    hiddenSkipped++;
                    continue;
                }
                if (e.type === 'TEXT' || e.type === 'MTEXT') {
                    const cleaned = cleanDxfText(e.text || e.string || '');
                    const pos = e.startPoint || e.position || e.start || e.insertionPoint || { x: 0, y: 0 };
                    if (cleaned) {
                        const p = apply(m, { x: pos.x ?? 0, y: pos.y ?? 0 });
                        textTags.push({ text: cleaned, x: p.x, y: p.y, layer: e.layer });
                    }
                    skippedTypes[e.type] = (skippedTypes[e.type] || 0) + 1;
                    continue;
                }
                if (e.type === 'INSERT') {
                    const block = e.name ? dxf.blocks?.[e.name] : undefined;
                    if (!block?.entities || depth > 8) {
                        skippedTypes.INSERT = (skippedTypes.INSERT || 0) + 1;
                        continue;
                    }
                    const base = block.position ?? { x: 0, y: 0 };
                    const cols = Math.max(1, e.columnCount ?? 1);
                    const rows = Math.max(1, e.rowCount ?? 1);
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const shifted: DxfEntity = {
                                ...e,
                                position: {
                                    x: (e.position?.x ?? 0) + c * (e.columnSpacing ?? 0),
                                    y: (e.position?.y ?? 0) + r * (e.rowSpacing ?? 0),
                                },
                            };
                            visit(block.entities, compose(m, insertTransform(shifted, base)), depth + 1);
                        }
                    }
                    continue;
                }
                if (!GEOMETRY_TYPES.includes(e.type)) {
                    skippedTypes[e.type] = (skippedTypes[e.type] || 0) + 1;
                    continue;
                }
                const path = entityPath(e);
                if (!path) continue;
                const local = ocsMirrored(e) ? compose(m, MIRROR_X) : m;
                paths.push({ points: path.points.map((p) => apply(local, p)), closed: path.closed });
            }
        };
        visit(dxf.entities, toMm, 0);

        if (sheetSkipped > 0) {
            warnings.push(`Skipped ${sheetSkipped} SHEET layer entit${sheetSkipped === 1 ? 'y' : 'ies'} (stock boundary).`);
        }
        if (hiddenSkipped > 0) {
            warnings.push(`Skipped ${hiddenSkipped} entit${hiddenSkipped === 1 ? 'y' : 'ies'} on frozen or hidden layers.`);
        }
        for (const [type, count] of Object.entries(skippedTypes)) {
            if (TEXT_TYPES.includes(type)) warnings.push(`Extracted metadata from ${count} ${type} text annotations.`);
        }

        if (paths.length === 0) {
            errors.push('No supported geometry (LINE, ARC, CIRCLE, ELLIPSE, POLYLINE, SPLINE) found in part layers');
            return { parts, errors, warnings, rawEntityCount, skippedTypes, unitScale };
        }

        // ── closed loops: native closed entities + chained pieces ──
        const allPts = paths.flatMap((p) => [p.points[0], p.points[p.points.length - 1]]);
        const ext = calculateBoundingBox(allPts);
        const diag = Math.hypot(ext.width, ext.height) || 1;
        const strictTol = Math.max(1e-4, diag * 1e-7);
        const looseTol = Math.max(0.05, diag * 2e-5);

        const loops: Point2D[][] = [];
        const open: Path[] = [];
        for (const p of paths) {
            if (p.closed) {
                loops.push(dropClosingDuplicate(p.points, strictTol));
            } else if (p.points.length >= 3 && dist(p.points[0], p.points[p.points.length - 1]) <= strictTol) {
                loops.push(dropClosingDuplicate(p.points, strictTol)); // open entity that returns to its start
            } else if (p.points.length >= 2) {
                open.push(p);
            }
        }
        const pass1 = chainOpenPaths(open, strictTol);
        const pass2 = chainOpenPaths(pass1.rest, looseTol);
        loops.push(...pass1.loops, ...pass2.loops);
        openContours = pass2.rest.length;
        if (pass2.loops.length > 0) {
            warnings.push(`Closed ${pass2.loops.length} outline${pass2.loops.length === 1 ? '' : 's'} across small gaps (≤ ${looseTol.toFixed(2)} mm).`);
        }
        if (openContours > 0) {
            warnings.push(`${openContours} open contour${openContours === 1 ? '' : 's'} could not be closed and ${openContours === 1 ? 'was' : 'were'} ignored.`);
        }

        // ── contours → parts (even-odd containment) ──
        const rawContours: Contour[] = loops
            .filter((pts) => pts.length >= MIN_POLYGON_POINTS && Math.abs(signedArea(pts)) > 1e-6)
            .map((pts, idx) => {
                const poly = createPolygon(pts);
                return {
                    id: `contour_${idx}`,
                    segments: [],
                    points: pts,
                    isClosed: true,
                    role: 'outer' as const,
                    area: poly.area,
                    bounds: {
                        minX: poly.bounds.x,
                        minY: poly.bounds.y,
                        maxX: poly.bounds.x + poly.bounds.width,
                        maxY: poly.bounds.y + poly.bounds.height,
                        width: poly.bounds.width,
                        height: poly.bounds.height,
                    },
                    isClockwise: signedArea(pts) < 0,
                };
            });

        const camParts = buildPartHierarchy(rawContours, filename.replace(/\.dxf$/i, ''));

        camParts.forEach((camPart: CamPart, index: number) => {
            const origMinX = camPart.outerContour.bounds.minX;
            const origMinY = camPart.outerContour.bounds.minY;
            const origMaxX = camPart.outerContour.bounds.maxX;
            const origMaxY = camPart.outerContour.bounds.maxY;

            // Multi-part DXF origin normalization: offset coordinates to (0, 0)
            const offsetX = normalizeOrigin ? origMinX : 0;
            const offsetY = normalizeOrigin ? origMinY : 0;
            const shift = (pts: Point2D[]) => pts.map((pt) => ({ x: pt.x - offsetX, y: pt.y - offsetY }));

            const outerPoly = createPolygon(oriented(shift(camPart.outerContour.points), true));
            const innerPolys = camPart.holes.map((h: Contour) => createPolygon(oriented(shift(h.points), false)));

            // Associate text metadata tags within or near this part's bounding box
            let taggedMeta: ReturnType<typeof extractPartMetadata> = {};
            if (autoTagMetadata) {
                const nearbyTags = textTags.filter(t =>
                    t.x >= origMinX - 40 &&
                    t.x <= origMaxX + 40 &&
                    t.y >= origMinY - 40 &&
                    t.y <= origMaxY + 40
                );
                const partLayers = [
                    camPart.outerContour.id,
                    ...camPart.holes.map(h => h.id)
                ];
                taggedMeta = extractPartMetadata(nearbyTags, partLayers);
            }

            if (outerPoly.area > 1) {
                const partLabel = taggedMeta.label || camPart.label || `Part ${index + 1}`;
                const quantity = taggedMeta.quantity || 1;

                parts.push({
                    id: `${filename}-part-${index}`,
                    label: partLabel,
                    polygon: outerPoly,
                    quantity: quantity,
                    allowedRotations: [0, 90, 180, 270],
                    source: filename,
                    holeCount: innerPolys.length,
                    innerPolygons: innerPolys.length > 0 ? innerPolys : undefined,
                    material: taggedMeta.material,
                    thickness: taggedMeta.thickness,
                    notes: taggedMeta.notes,
                });
            }
        });

        if (parts.length === 0) {
            errors.push('No valid closed polygons found in DXF');
        }

    } catch (e) {
        errors.push(`DXF parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return { parts, errors, warnings, rawEntityCount, skippedTypes, unitScale, openContours };
}

export const parseDxfToParts = parseDxfContent;

/**
 * Validate DXF file before full parsing
 */
export function validateDxfFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
        return { valid: false, error: 'File must have .dxf extension' };
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return { valid: false, error: 'File too large (max 50MB)' };
    }

    return { valid: true };
}

/**
 * Canonical AutoCAD R12 (AC1009) DXF writer.
 *
 * Engineering-flow manufacturing output. POLYLINE + VERTEX + SEQEND only
 * (no LWPOLYLINE). Unknown layer names throw. Entity color is ByLayer.
 */

export type DxfUnits = 'mm' | 'inch';
export type DxfLineType = 'CONTINUOUS' | 'DASHED' | 'CENTER';

export interface DxfLayerDef {
    color: number;
    lineType: DxfLineType;
    cut: boolean;
}

/** Locked layer contract — name, ACI color, linetype, cut vs mark. */
export const DXF_LAYER_TABLE = {
    '0': { color: 7, lineType: 'CONTINUOUS', cut: false },
    PART_CONTOUR: { color: 7, lineType: 'CONTINUOUS', cut: true },
    HOLES: { color: 1, lineType: 'CONTINUOUS', cut: true },
    BEND: { color: 2, lineType: 'DASHED', cut: false },
    PITCH_CIRCLE: { color: 4, lineType: 'CENTER', cut: false },
    BASE_CIRCLE: { color: 3, lineType: 'CENTER', cut: false },
    ADDENDUM_CIRCLE: { color: 2, lineType: 'DASHED', cut: false },
    DEDENDUM_CIRCLE: { color: 1, lineType: 'DASHED', cut: false },
    REFERENCE: { color: 8, lineType: 'CENTER', cut: false },
    DIMENSIONS: { color: 6, lineType: 'CONTINUOUS', cut: false },
    SHEET: { color: 8, lineType: 'CONTINUOUS', cut: false },
} as const satisfies Record<string, DxfLayerDef>;

export type DxfLayerName = keyof typeof DXF_LAYER_TABLE;

export interface DxfWriterOptions {
    units?: DxfUnits;
    precision?: number;
}

type Point2 = { x: number; y: number };

type Entity =
    | { kind: 'LINE'; x1: number; y1: number; x2: number; y2: number; layer: DxfLayerName }
    | { kind: 'CIRCLE'; cx: number; cy: number; r: number; layer: DxfLayerName }
    | { kind: 'POLYLINE'; points: Point2[]; closed: boolean; layer: DxfLayerName }
    | { kind: 'TEXT'; x: number; y: number; height: number; text: string; layer: DxfLayerName };

const LINETYPES: Record<DxfLineType, string[]> = {
    CONTINUOUS: [
        '0', 'LTYPE',
        '2', 'CONTINUOUS',
        '70', '64',
        '3', 'Solid line',
        '72', '65',
        '73', '0',
        '40', '0.0',
    ],
    DASHED: [
        '0', 'LTYPE',
        '2', 'DASHED',
        '70', '64',
        '3', 'Dashed __ __ __ __ __',
        '72', '65',
        '73', '2',
        '40', '0.75',
        '49', '0.5',
        '49', '-0.25',
    ],
    CENTER: [
        '0', 'LTYPE',
        '2', 'CENTER',
        '70', '64',
        '3', 'Center ____ _ ____ _ ____',
        '72', '65',
        '73', '4',
        '40', '2.0',
        '49', '1.25',
        '49', '-0.25',
        '49', '0.25',
        '49', '-0.25',
    ],
};

const LAYER_NAMES = Object.keys(DXF_LAYER_TABLE) as DxfLayerName[];

export function isDxfLayer(name: string): name is DxfLayerName {
    return Object.prototype.hasOwnProperty.call(DXF_LAYER_TABLE, name);
}

export function assertDxfLayer(name: string): asserts name is DxfLayerName {
    if (!isDxfLayer(name)) {
        throw new Error(`Unknown DXF layer '${name}'. Allowed: ${LAYER_NAMES.join(', ')}`);
    }
}

export class DxfWriter {
    private readonly units: DxfUnits;
    private readonly precision: number;
    private readonly entities: Entity[] = [];
    private minX = Infinity;
    private minY = Infinity;
    private maxX = -Infinity;
    private maxY = -Infinity;
    private finalized: string | null = null;

    constructor(options: DxfWriterOptions = {}) {
        this.units = options.units ?? 'mm';
        this.precision = options.precision ?? 4;
    }

    public addLine(x1: number, y1: number, x2: number, y2: number, layer: string = '0') {
        this.ensureOpen();
        const name = this.requireLayer(layer);
        this.touch(x1, y1);
        this.touch(x2, y2);
        this.entities.push({ kind: 'LINE', x1, y1, x2, y2, layer: name });
    }

    public addCircle(cx: number, cy: number, radius: number, layer: string = '0') {
        this.ensureOpen();
        const name = this.requireLayer(layer);
        this.touch(cx - radius, cy - radius);
        this.touch(cx + radius, cy + radius);
        this.entities.push({ kind: 'CIRCLE', cx, cy, r: radius, layer: name });
    }

    public addPolyline(points: Point2[], closed: boolean = true, layer: string = 'PART_CONTOUR') {
        this.ensureOpen();
        const name = this.requireLayer(layer);
        if (points.length < 2) return;
        for (const p of points) this.touch(p.x, p.y);
        this.entities.push({ kind: 'POLYLINE', points: points.map((p) => ({ x: p.x, y: p.y })), closed, layer: name });
    }

    public addText(x: number, y: number, height: number, text: string, layer: string = 'DIMENSIONS') {
        this.ensureOpen();
        const name = this.requireLayer(layer);
        this.touch(x, y);
        this.touch(x + height * Math.max(1, text.length * 0.6), y + height);
        this.entities.push({ kind: 'TEXT', x, y, height, text, layer: name });
    }

    public end(): string {
        if (this.finalized !== null) return this.finalized;

        const n = (v: number) => v.toFixed(this.precision);
        const insUnits = this.units === 'mm' ? '4' : '1';
        const hasGeom = Number.isFinite(this.minX);
        const extMinX = hasGeom ? this.minX : 0;
        const extMinY = hasGeom ? this.minY : 0;
        const extMaxX = hasGeom ? this.maxX : 1;
        const extMaxY = hasGeom ? this.maxY : 1;

        const lines: string[] = [
            '0', 'SECTION',
            '2', 'HEADER',
            '9', '$ACADVER', '1', 'AC1009',
            '9', '$INSUNITS', '70', insUnits,
            '9', '$LUNITS', '70', '2',
            '9', '$LUPREC', '70', String(this.precision),
            '9', '$INSBASE', '10', '0.0', '20', '0.0', '30', '0.0',
            '9', '$EXTMIN', '10', n(extMinX), '20', n(extMinY), '30', '0.0',
            '9', '$EXTMAX', '10', n(extMaxX), '20', n(extMaxY), '30', '0.0',
            '0', 'ENDSEC',

            '0', 'SECTION',
            '2', 'TABLES',

            '0', 'TABLE',
            '2', 'LTYPE',
            '70', '3',
            ...LINETYPES.CONTINUOUS,
            ...LINETYPES.DASHED,
            ...LINETYPES.CENTER,
            '0', 'ENDTAB',

            '0', 'TABLE',
            '2', 'LAYER',
            '70', String(LAYER_NAMES.length),
        ];

        for (const name of LAYER_NAMES) {
            const def = DXF_LAYER_TABLE[name];
            lines.push(
                '0', 'LAYER',
                '2', name,
                '70', '0',
                '62', String(def.color),
                '6', def.lineType,
            );
        }

        lines.push(
            '0', 'ENDTAB',
            '0', 'ENDSEC',
            '0', 'SECTION',
            '2', 'BLOCKS',
            '0', 'ENDSEC',
            '0', 'SECTION',
            '2', 'ENTITIES',
        );

        for (const ent of this.entities) {
            if (ent.kind === 'LINE') {
                lines.push(
                    '0', 'LINE',
                    '8', ent.layer,
                    '10', n(ent.x1), '20', n(ent.y1), '30', '0.0',
                    '11', n(ent.x2), '21', n(ent.y2), '31', '0.0',
                );
            } else if (ent.kind === 'CIRCLE') {
                lines.push(
                    '0', 'CIRCLE',
                    '8', ent.layer,
                    '10', n(ent.cx), '20', n(ent.cy), '30', '0.0',
                    '40', n(ent.r),
                );
            } else if (ent.kind === 'POLYLINE') {
                lines.push(
                    '0', 'POLYLINE',
                    '8', ent.layer,
                    '66', '1',
                    '10', '0.0', '20', '0.0', '30', '0.0',
                    '70', ent.closed ? '1' : '0',
                );
                for (const p of ent.points) {
                    lines.push(
                        '0', 'VERTEX',
                        '8', ent.layer,
                        '10', n(p.x), '20', n(p.y), '30', '0.0',
                    );
                }
                lines.push('0', 'SEQEND', '8', ent.layer);
            } else {
                lines.push(
                    '0', 'TEXT',
                    '8', ent.layer,
                    '10', n(ent.x), '20', n(ent.y), '30', '0.0',
                    '40', n(ent.height),
                    '1', ent.text.replace(/\r?\n/g, ' '),
                );
            }
        }

        lines.push('0', 'ENDSEC', '0', 'EOF');
        this.finalized = lines.join('\n');
        return this.finalized;
    }

    private ensureOpen() {
        if (this.finalized !== null) {
            throw new Error('DxfWriter.end() already called');
        }
    }

    private requireLayer(name: string): DxfLayerName {
        assertDxfLayer(name);
        return name;
    }

    private touch(x: number, y: number) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (x < this.minX) this.minX = x;
        if (y < this.minY) this.minY = y;
        if (x > this.maxX) this.maxX = x;
        if (y > this.maxY) this.maxY = y;
    }
}

/**
 * Helper to generate a DXF string from simplified entities (visualizer / adapters).
 */
export function generateDXF(entities: any[], _layers?: any[]): string {
    const writer = new DxfWriter();

    entities.forEach((ent) => {
        const type = ent.geometry?.type;
        const layer = typeof ent.layerId === 'string' ? ent.layerId : '0';

        if (type === 'LINE') {
            writer.addLine(ent.geometry.start.x, ent.geometry.start.y, ent.geometry.end.x, ent.geometry.end.y, layer);
        } else if (type === 'CIRCLE') {
            writer.addCircle(ent.geometry.center.x, ent.geometry.center.y, ent.geometry.radius, layer);
        } else if (type === 'POLYLINE') {
            writer.addPolyline(ent.geometry.vertices || [], ent.geometry.closed ?? true, layer);
        }
    });

    return writer.end();
}

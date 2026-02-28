/**
 * 🧠 AluCalculator OS - DXF R12 Generator
 * 
 * Strict R12-compliant DXF writer for maximum compatibility (AutoCAD, ODA, Laser Cutters).
 * Supports:
 * - Layers (PART_CONTOUR, PITCH_CIRCLE, DIMENSIONS)
 * - Entities (LINE, CIRCLE, POLYLINE)
 * - Colors (ByLayer)
 */

export type DxfLayer = '0' | 'PART_CONTOUR' | 'PITCH_CIRCLE' | 'DIMENSIONS';

export class DxfWriter {
    private content: string[] = [];

    constructor() {
        this.writeHeader();
        this.writeTables();
        this.writeBlocks();
        this.content.push('SECTION', '2', 'ENTITIES');
    }

    private writeHeader() {
        this.content.push(
            'SECTION', '2', 'HEADER',
            '9', '$ACADVER', '1', 'AC1009', // R12
            '9', '$INSBASE', '10', '0.0', '20', '0.0', '30', '0.0',
            '9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0',
            '9', '$EXTMAX', '10', '1000.0', '20', '1000.0', '30', '0.0',
            '0', 'ENDSEC'
        );
    }

    private writeTables() {
        this.content.push(
            'SECTION', '2', 'TABLES',
            '0', 'TABLE', '2', 'LTYPE', '70', '1',
            '0', 'LTYPE', '2', 'CONTINUOUS', '70', '64', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0',
            '0', 'ENDTAB',
            '0', 'TABLE', '2', 'LAYER', '70', '4',
            this.layerDef('0', 7),
            this.layerDef('PART_CONTOUR', 3), // Green
            this.layerDef('PITCH_CIRCLE', 1), // Red
            this.layerDef('DIMENSIONS', 4),   // Cyan
            '0', 'ENDTAB',
            '0', 'ENDSEC'
        );
    }

    private layerDef(name: string, color: number): string {
        return [
            '0', 'LAYER',
            '2', name,
            '70', '64',
            '62', color.toString(),
            '6', 'CONTINUOUS'
        ].join('\n');
    }

    private writeBlocks() {
        this.content.push('SECTION', '2', 'BLOCKS', '0', 'ENDSEC');
    }

    // --- ENTITIES ---

    public addLine(x1: number, y1: number, x2: number, y2: number, layer: DxfLayer = '0') {
        this.content.push(
            '0', 'LINE',
            '8', layer,
            '10', x1.toFixed(4), '20', y1.toFixed(4), '30', '0.0',
            '11', x2.toFixed(4), '21', y2.toFixed(4), '31', '0.0'
        );
    }

    public addCircle(cx: number, cy: number, radius: number, layer: DxfLayer = '0') {
        this.content.push(
            '0', 'CIRCLE',
            '8', layer,
            '10', cx.toFixed(4), '20', cy.toFixed(4), '30', '0.0',
            '40', radius.toFixed(4)
        );
    }

    public addPolyline(points: { x: number, y: number }[], closed: boolean = true, layer: DxfLayer = 'PART_CONTOUR') {
        const flag = closed ? '1' : '0';
        this.content.push(
            '0', 'POLYLINE',
            '8', layer,
            '66', '1', // Vertices follow
            '10', '0.0', '20', '0.0', '30', '0.0', // Origin
            '70', flag
        );

        points.forEach(p => {
            this.content.push(
                '0', 'VERTEX',
                '8', layer,
                '10', p.x.toFixed(4), '20', p.y.toFixed(4), '30', '0.0'
            );
        });

        this.content.push('0', 'SEQEND', '8', layer);
    }

    public end(): string {
        this.content.push('0', 'ENDSEC', '0', 'EOF');
        return this.content.join('\n');
    }
}

/**
 * Helper to quickly generate a DXF string from a list of simplified entities.
 */
export function generateDXF(entities: any[], layers?: any[]): string {
    const writer = new DxfWriter();

    entities.forEach(ent => {
        const type = ent.geometry?.type;
        const layer = typeof ent.layerId === 'string' ? ent.layerId : '0';

        if (type === 'LINE') {
            writer.addLine(ent.geometry.start.x, ent.geometry.start.y, ent.geometry.end.x, ent.geometry.end.y, layer as DxfLayer);
        } else if (type === 'CIRCLE') {
            writer.addCircle(ent.geometry.center.x, ent.geometry.center.y, ent.geometry.radius, layer as DxfLayer);
        } else if (type === 'POLYLINE') {
            writer.addPolyline(ent.geometry.vertices || [], ent.geometry.closed ?? true, layer as DxfLayer);
        }
    });

    return writer.end();
}

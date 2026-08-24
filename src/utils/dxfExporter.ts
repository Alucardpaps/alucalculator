/**
 * DXF Exporter
 * Exports nested geometry to AutoCAD DXF format
 */

import type { PlacedPart, Sheet2D, SheetResult, DXFExportOptions } from '@/types/nesting2d.types';

const DEFAULT_OPTIONS: DXFExportOptions = {
    units: 'mm',
    layerName: 'PARTS',
    includeSheet: true
};

/**
 * Generate DXF file content from nesting result
 */
export function exportToDXF(
    sheetResult: SheetResult,
    sheet: Sheet2D,
    options: Partial<DXFExportOptions> = {}
): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    // DXF Header Section
    lines.push('0', 'SECTION');
    lines.push('2', 'HEADER');

    // AutoCAD version
    lines.push('9', '$ACADVER');
    lines.push('1', 'AC1015'); // AutoCAD 2000

    // Units (1 = Inches, 4 = Millimeters)
    lines.push('9', '$INSUNITS');
    lines.push('70', opts.units === 'mm' ? '4' : '1');

    lines.push('0', 'ENDSEC');

    // Tables Section (minimal)
    lines.push('0', 'SECTION');
    lines.push('2', 'TABLES');

    // Layer table
    lines.push('0', 'TABLE');
    lines.push('2', 'LAYER');
    lines.push('70', '2'); // Number of layers

    // Layer 0 (default)
    lines.push('0', 'LAYER');
    lines.push('2', '0');
    lines.push('70', '0');
    lines.push('62', '7'); // White
    lines.push('6', 'CONTINUOUS');

    // Parts layer
    lines.push('0', 'LAYER');
    lines.push('2', opts.layerName);
    lines.push('70', '0');
    lines.push('62', '5'); // Blue
    lines.push('6', 'CONTINUOUS');

    // Sheet layer
    if (opts.includeSheet) {
        lines.push('0', 'LAYER');
        lines.push('2', 'SHEET');
        lines.push('70', '0');
        lines.push('62', '8'); // Gray
        lines.push('6', 'CONTINUOUS');
    }

    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');

    // Entities Section
    lines.push('0', 'SECTION');
    lines.push('2', 'ENTITIES');

    // Draw sheet boundary
    if (opts.includeSheet) {
        lines.push(...createLWPolyline([
            { x: 0, y: 0 },
            { x: sheet.width, y: 0 },
            { x: sheet.width, y: sheet.height },
            { x: 0, y: sheet.height }
        ], 'SHEET', true));
    }

    // Draw each placed part
    for (const part of sheetResult.placedParts) {
        lines.push(...createLWPolyline(
            part.polygon.points,
            opts.layerName,
            true
        ));
    }

    lines.push('0', 'ENDSEC');

    // End of file
    lines.push('0', 'EOF');

    return lines.join('\n');
}

/**
 * Create LWPOLYLINE entity
 */
function createLWPolyline(
    points: { x: number; y: number }[],
    layer: string,
    closed: boolean
): string[] {
    const lines: string[] = [];

    lines.push('0', 'LWPOLYLINE');
    lines.push('8', layer); // Layer name
    lines.push('90', points.length.toString()); // Vertex count
    lines.push('70', closed ? '1' : '0'); // Closed flag

    for (const point of points) {
        lines.push('10', point.x.toFixed(4)); // X coordinate
        lines.push('20', point.y.toFixed(4)); // Y coordinate
    }

    return lines;
}

/**
 * Create ARC entity for lead-in
 */
function createArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    layer: string
): string[] {
    const lines: string[] = [];

    lines.push('0', 'ARC');
    lines.push('8', layer);
    lines.push('10', centerX.toFixed(4)); // Center X
    lines.push('20', centerY.toFixed(4)); // Center Y
    lines.push('40', radius.toFixed(4));  // Radius
    lines.push('50', startAngle.toFixed(2)); // Start angle (degrees)
    lines.push('51', endAngle.toFixed(2));   // End angle (degrees)

    return lines;
}

/**
 * Create LINE entity
 */
function createLine(
    x1: number, y1: number,
    x2: number, y2: number,
    layer: string
): string[] {
    const lines: string[] = [];

    lines.push('0', 'LINE');
    lines.push('8', layer);
    lines.push('10', x1.toFixed(4)); // Start X
    lines.push('20', y1.toFixed(4)); // Start Y
    lines.push('11', x2.toFixed(4)); // End X
    lines.push('21', y2.toFixed(4)); // End Y

    return lines;
}

/**
 * Generate lead-in arc at a point on the polygon
 * @param entryPoint - Point where cutting starts
 * @param nextPoint - Next point in the polygon (for direction)
 * @param radius - Lead-in arc radius
 * @returns Arc center and angle info
 */
function generateLeadInArc(
    entryPoint: { x: number; y: number },
    nextPoint: { x: number; y: number },
    radius: number
): { centerX: number; centerY: number; startAngle: number; endAngle: number } {
    // Calculate direction vector
    const dx = nextPoint.x - entryPoint.x;
    const dy = nextPoint.y - entryPoint.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.001) {
        return { centerX: entryPoint.x, centerY: entryPoint.y, startAngle: 0, endAngle: 90 };
    }

    // Normalized direction
    const nx = dx / len;
    const ny = dy / len;

    // Perpendicular (outward from polygon)
    const perpX = -ny;
    const perpY = nx;

    // Arc center is offset from entry point
    const centerX = entryPoint.x + perpX * radius;
    const centerY = entryPoint.y + perpY * radius;

    // Calculate angles
    const startAngle = Math.atan2(-perpY, -perpX) * (180 / Math.PI);
    const endAngle = startAngle + 90; // 90 degree arc

    return { centerX, centerY, startAngle, endAngle };
}

/**
 * Insert micro-tabs into a polygon edge
 * Gaps the cutting path to leave small tabs holding the part
 */
function insertMicroTabs(
    points: { x: number; y: number }[],
    tabWidth: number,
    tabsPerEdge: number,
    minEdgeLength: number
): { x: number; y: number }[][] {
    // Returns array of polyline segments (with gaps for tabs)
    const segments: { x: number; y: number }[][] = [];
    let currentSegment: { x: number; y: number }[] = [];

    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        const edgeLength = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );

        if (edgeLength < minEdgeLength || tabsPerEdge === 0) {
            // Edge too short for tabs, add full edge
            currentSegment.push(p1);
            continue;
        }

        // Add tabs along this edge
        const dx = (p2.x - p1.x) / edgeLength;
        const dy = (p2.y - p1.y) / edgeLength;

        const tabSpacing = edgeLength / (tabsPerEdge + 1);

        currentSegment.push(p1);

        for (let t = 1; t <= tabsPerEdge; t++) {
            const tabStart = t * tabSpacing - tabWidth / 2;
            const tabEnd = t * tabSpacing + tabWidth / 2;

            // Point before tab
            const beforeTab = {
                x: p1.x + dx * tabStart,
                y: p1.y + dy * tabStart
            };
            currentSegment.push(beforeTab);

            // End current segment (gap for tab)
            segments.push([...currentSegment]);
            currentSegment = [];

            // Start new segment after tab
            const afterTab = {
                x: p1.x + dx * tabEnd,
                y: p1.y + dy * tabEnd
            };
            currentSegment.push(afterTab);
        }
    }

    // Close remaining segment
    if (currentSegment.length > 0) {
        if (segments.length > 0) {
            // Connect to first segment
            currentSegment.push(...segments[0]);
            segments[0] = currentSegment;
        } else {
            segments.push(currentSegment);
        }
    }

    return segments;
}

/**
 * Export multiple sheets to separate DXF files (returns array of {filename, content})
 */
export function exportMultipleSheets(
    sheets: SheetResult[],
    sheetDef: Sheet2D,
    options: Partial<DXFExportOptions> = {}
): { filename: string; content: string }[] {
    return sheets.map((sheet, index) => ({
        filename: `sheet_${index + 1}.dxf`,
        content: exportToDXF(sheet, sheetDef, options)
    }));
}

/**
 * Create downloadable DXF blob
 */
export function createDXFBlob(dxfContent: string): Blob {
    return new Blob([dxfContent], { type: 'application/dxf' });
}

/**
 * Trigger DXF download
 */
export function downloadDXF(dxfContent: string, filename: string = 'nested_parts.dxf'): void {
    const blob = createDXFBlob(dxfContent);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

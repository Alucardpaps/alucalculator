/**
 * AluCalculator Engineering Kernel — CNC-Grade DXF Exporter
 * 
 * MANUFACTURING EXPORT — AutoCAD R12 Compatible
 * 
 * Standard: AutoCAD DXF R12 (ASCII)
 * 
 * CRITICAL: This exporter generates DXF from MATHEMATICAL points only.
 * NO mesh conversion. NO triangulation. Pure polylines for CNC.
 */

import type { Point2D, GearGeometry, ValidationResult } from '../math/involute';

// ============================================
// TYPES
// ============================================

export interface DXFExportOptions {
    filename: string;
    units: 'mm' | 'inch';
    precision: number;          // Decimal places
    layerPrefix?: string;
    includeConstructionLines?: boolean;
    includeDimensions?: boolean;
    colorByLayer?: boolean;
}

export interface DXFLayer {
    name: string;
    color: number;              // AutoCAD color index (1-255)
    lineType: 'CONTINUOUS' | 'DASHED' | 'CENTER' | 'PHANTOM';
}

export interface ExportResult {
    success: boolean;
    dxfContent: string;
    filename: string;
    pointCount: number;
    warnings: string[];
    errors: string[];
}

// ============================================
// AUTOCAD COLOR INDEX
// ============================================

const ACI = {
    RED: 1,
    YELLOW: 2,
    GREEN: 3,
    CYAN: 4,
    BLUE: 5,
    MAGENTA: 6,
    WHITE: 7,
    GRAY: 8,
    LIGHT_GRAY: 9,
};

// ============================================
// STANDARD LAYERS
// ============================================

const STANDARD_LAYERS: DXFLayer[] = [
    { name: 'PART_CONTOUR', color: ACI.WHITE, lineType: 'CONTINUOUS' },
    { name: 'PITCH_CIRCLE', color: ACI.CYAN, lineType: 'CENTER' },
    { name: 'BASE_CIRCLE', color: ACI.GREEN, lineType: 'DASHED' },
    { name: 'ADDENDUM_CIRCLE', color: ACI.YELLOW, lineType: 'DASHED' },
    { name: 'DEDENDUM_CIRCLE', color: ACI.RED, lineType: 'DASHED' },
    { name: 'DIMENSIONS', color: ACI.MAGENTA, lineType: 'CONTINUOUS' },
    { name: 'REFERENCE', color: ACI.GRAY, lineType: 'CENTER' },
];

// ============================================
// DXF HEADER TEMPLATE
// ============================================

function generateDXFHeader(units: 'mm' | 'inch'): string {
    const unitCode = units === 'mm' ? 4 : 1; // 4 = mm, 1 = inches

    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSUNITS
70
${unitCode}
9
$LUNITS
70
2
9
$LUPREC
70
4
0
ENDSEC
`;
}

// ============================================
// DXF TABLES (LAYERS)
// ============================================

function generateDXFTables(layers: DXFLayer[]): string {
    let content = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
${layers.length}
`;

    layers.forEach(layer => {
        content += `0
LAYER
2
${layer.name}
70
0
62
${layer.color}
6
${layer.lineType}
`;
    });

    content += `0
ENDTAB
0
ENDSEC
`;

    return content;
}

// ============================================
// DXF ENTITIES
// ============================================

function generateDXFEntitiesStart(): string {
    return `0
SECTION
2
ENTITIES
`;
}

function generateDXFEntitiesEnd(): string {
    return `0
ENDSEC
0
EOF
`;
}

// ============================================
// POLYLINE GENERATOR (CNC CORE)
// ============================================

/**
 * Generate a closed 2D polyline from points
 * This is the primary CNC output format
 */
function generatePolyline(
    points: Point2D[],
    layer: string,
    closed: boolean = true,
    precision: number = 4
): string {
    if (points.length < 2) return '';

    let content = `0
LWPOLYLINE
8
${layer}
90
${points.length}
70
${closed ? 1 : 0}
`;

    points.forEach(p => {
        content += `10
${p.x.toFixed(precision)}
20
${p.y.toFixed(precision)}
`;
    });

    return content;
}

/**
 * Generate a circle entity
 */
function generateCircle(
    centerX: number,
    centerY: number,
    radius: number,
    layer: string,
    precision: number = 4
): string {
    return `0
CIRCLE
8
${layer}
10
${centerX.toFixed(precision)}
20
${centerY.toFixed(precision)}
40
${radius.toFixed(precision)}
`;
}

/**
 * Generate a line entity
 */
function generateLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer: string,
    precision: number = 4
): string {
    return `0
LINE
8
${layer}
10
${x1.toFixed(precision)}
20
${y1.toFixed(precision)}
11
${x2.toFixed(precision)}
21
${y2.toFixed(precision)}
`;
}

/**
 * Generate text annotation
 */
function generateText(
    x: number,
    y: number,
    height: number,
    text: string,
    layer: string,
    precision: number = 4
): string {
    return `0
TEXT
8
${layer}
10
${x.toFixed(precision)}
20
${y.toFixed(precision)}
40
${height.toFixed(precision)}
1
${text}
`;
}

// ============================================
// GEAR DXF EXPORTER
// ============================================

/**
 * Export gear geometry to DXF
 * This produces manufacturing-ready output
 */
export function exportGearToDXF(
    geometry: GearGeometry,
    validation: ValidationResult,
    options: DXFExportOptions
): ExportResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check validation
    if (!validation.canExport) {
        errors.push('Export blocked due to validation errors');
        validation.errors.forEach(e => errors.push(e));
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings,
            errors,
        };
    }

    // Add validation warnings
    validation.warnings.forEach(w => warnings.push(w));

    // Check point count
    if (geometry.fullGearContour.length < 10) {
        errors.push('Insufficient geometry points for export');
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings,
            errors,
        };
    }

    // Build DXF content
    let dxf = '';

    // Header
    dxf += generateDXFHeader(options.units);

    // Layer table
    dxf += generateDXFTables(STANDARD_LAYERS);

    // Entities section
    dxf += generateDXFEntitiesStart();

    // === MAIN PART CONTOUR ===
    dxf += generatePolyline(
        geometry.fullGearContour,
        'PART_CONTOUR',
        true,
        options.precision
    );

    // === CONSTRUCTION CIRCLES ===
    if (options.includeConstructionLines) {
        // Pitch circle
        dxf += generateCircle(0, 0, geometry.pitchRadius, 'PITCH_CIRCLE', options.precision);

        // Base circle
        dxf += generateCircle(0, 0, geometry.baseRadius, 'BASE_CIRCLE', options.precision);

        // Addendum circle
        dxf += generateCircle(0, 0, geometry.addendumRadius, 'ADDENDUM_CIRCLE', options.precision);

        // Dedendum circle
        dxf += generateCircle(0, 0, geometry.dedendumRadius, 'DEDENDUM_CIRCLE', options.precision);

        // Center crosshair
        const crossSize = geometry.addendumRadius * 0.1;
        dxf += generateLine(-crossSize, 0, crossSize, 0, 'REFERENCE', options.precision);
        dxf += generateLine(0, -crossSize, 0, crossSize, 'REFERENCE', options.precision);
    }

    // === DIMENSIONS ===
    if (options.includeDimensions) {
        const textHeight = geometry.pitchRadius * 0.05;
        const textOffset = geometry.addendumRadius * 1.15;

        dxf += generateText(
            textOffset,
            textOffset,
            textHeight,
            `Da=${(geometry.addendumRadius * 2).toFixed(2)}`,
            'DIMENSIONS',
            options.precision
        );

        dxf += generateText(
            textOffset,
            textOffset - textHeight * 1.5,
            textHeight,
            `d=${(geometry.pitchRadius * 2).toFixed(2)}`,
            'DIMENSIONS',
            options.precision
        );

        dxf += generateText(
            textOffset,
            textOffset - textHeight * 3,
            textHeight,
            `Df=${(geometry.dedendumRadius * 2).toFixed(2)}`,
            'DIMENSIONS',
            options.precision
        );
    }

    // Close entities section
    dxf += generateDXFEntitiesEnd();

    // Add undercut warning to file if applicable
    if (geometry.undercutRisk) {
        warnings.push('UNDERCUT RISK: Geometry may require profile grinding');
    }

    return {
        success: true,
        dxfContent: dxf,
        filename: options.filename.endsWith('.dxf') ? options.filename : `${options.filename}.dxf`,
        pointCount: geometry.fullGearContour.length,
        warnings,
        errors,
    };
}

// ============================================
// GENERIC POLYLINE EXPORTER
// ============================================

/**
 * Export any closed polyline to DXF
 * Use this for non-gear contours
 */
export function exportPolylineToDXF(
    points: Point2D[],
    options: DXFExportOptions & { layerName?: string }
): ExportResult {
    if (points.length < 3) {
        return {
            success: false,
            dxfContent: '',
            filename: options.filename,
            pointCount: 0,
            warnings: [],
            errors: ['Minimum 3 points required for polyline'],
        };
    }

    let dxf = '';

    dxf += generateDXFHeader(options.units);
    dxf += generateDXFTables([STANDARD_LAYERS[0]]); // PART_CONTOUR only
    dxf += generateDXFEntitiesStart();
    dxf += generatePolyline(points, options.layerName || 'PART_CONTOUR', true, options.precision);
    dxf += generateDXFEntitiesEnd();

    return {
        success: true,
        dxfContent: dxf,
        filename: options.filename.endsWith('.dxf') ? options.filename : `${options.filename}.dxf`,
        pointCount: points.length,
        warnings: [],
        errors: [],
    };
}

// ============================================
// FILE DOWNLOAD HELPER
// ============================================

/**
 * Trigger browser download of DXF file
 */
export function downloadDXF(result: ExportResult): void {
    if (!result.success) {
        console.error('DXF export failed:', result.errors);
        return;
    }

    const blob = new Blob([result.dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ============================================
// DEFAULT OPTIONS
// ============================================

export const DEFAULT_DXF_OPTIONS: DXFExportOptions = {
    filename: 'gear_export',
    units: 'mm',
    precision: 4,
    includeConstructionLines: true,
    includeDimensions: true,
    colorByLayer: true,
};

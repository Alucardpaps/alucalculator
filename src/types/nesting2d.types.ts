/**
 * 2D Nesting Types
 * Core geometry and algorithm types for 2D bin packing
 */

// ============================================
// GEOMETRY PRIMITIVES
// ============================================

export interface Point2D {
    x: number;
    y: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Polygon {
    /** Ordered vertices (clockwise or counter-clockwise) */
    points: Point2D[];
    /** Cached bounding box */
    bounds: BoundingBox;
    /** Area in square units */
    area: number;
}

// ============================================
// PART & SHEET DEFINITIONS
// ============================================

export interface Part2D {
    id: string;
    label: string;
    /** Original polygon geometry */
    polygon: Polygon;
    /** Quantity needed */
    quantity: number;
    /** Allowed rotation angles (degrees) */
    allowedRotations: number[];
    /** Original source (SVG/DXF filename) */
    source?: string;
    /** Number of internal holes/cutouts (for decorative panels) */
    holeCount?: number;
    /** Inner polygons for preview rendering (holes, cutouts, decorative paths) */
    innerPolygons?: Polygon[];
}

export interface Sheet2D {
    width: number;
    height: number;
    /** Blade/kerf width in mm */
    kerf: number;
}

// ============================================
// PLACEMENT & RESULTS
// ============================================

export interface PlacedPart {
    partId: string;
    label: string;
    /** Position on sheet (bottom-left origin) */
    position: Point2D;
    /** Applied rotation in degrees */
    rotation: number;
    /** Transformed polygon after placement */
    polygon: Polygon;
    /** Instance index (for quantity > 1) */
    instanceIndex: number;
}

export interface FreeRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SheetResult {
    sheetIndex: number;
    placedParts: PlacedPart[];
    freeRectangles: FreeRectangle[];
    usedArea: number;
    wasteArea: number;
    efficiency: number;
}

export interface NestingResult {
    sheets: SheetResult[];
    totalSheets: number;
    totalEfficiency: number;
    totalWaste: number;
    unplacedParts: { partId: string; reason: string }[];
    computeTimeMs: number;
}

// ============================================
// JOB & WORKER MESSAGES
// ============================================

export interface NestingJob {
    parts: Part2D[];
    sheet: Sheet2D;
    options: NestingOptions;
}

export interface NestingOptions {
    /** Rotation step in degrees (e.g., 90 for 4 rotations) */
    rotationStep: number;
    /** Spacing between parts (mm) */
    spacing: number;
    /** Algorithm: 'guillotine' | 'shelf' | 'maxrects' */
    algorithm: 'guillotine' | 'shelf' | 'maxrects';
    /** Heuristic for rectangle selection */
    heuristic: 'best-area-fit' | 'best-short-side-fit' | 'best-long-side-fit';
    /** Allow multiple sheets */
    multiSheet: boolean;
    /** Max sheets to use (0 = unlimited) */
    maxSheets: number;
}

export type WorkerMessageType =
    | 'start'
    | 'progress'
    | 'complete'
    | 'error'
    | 'cancel';

export interface WorkerMessage {
    type: WorkerMessageType;
    payload?: NestingJob | NestingResult | number | string;
}

export interface WorkerProgressMessage {
    type: 'progress';
    payload: {
        currentPart: number;
        totalParts: number;
        currentSheet: number;
        percent: number;
    };
}

// ============================================
// UTILITY TYPES
// ============================================

export interface SVGParseResult {
    parts: Part2D[];
    errors: string[];
}

export interface DXFExportOptions {
    units: 'mm' | 'inches';
    layerName: string;
    includeSheet: boolean;
}

// ============================================
// PHASE 4: LEAD-IN & MICRO-TABS
// ============================================

export type LeadInType = 'arc' | 'line' | 'none';

export interface LeadInOptions {
    /** Type of lead-in/lead-out */
    type: LeadInType;
    /** Lead-in length in mm */
    length: number;
    /** Lead-in angle in degrees (for line type) */
    angle: number;
    /** Arc radius (for arc type) */
    radius: number;
}

export interface MicroTabOptions {
    /** Enable micro-tabs */
    enabled: boolean;
    /** Tab width in mm */
    width: number;
    /** Tab height/depth in mm */
    height: number;
    /** Number of tabs per part edge */
    countPerEdge: number;
    /** Minimum edge length to add tabs */
    minEdgeLength: number;
}

export interface CuttingPathOptions {
    leadIn: LeadInOptions;
    microTabs: MicroTabOptions;
    /** Cutting order optimization */
    optimizeCutOrder: boolean;
}


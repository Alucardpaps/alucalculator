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
    /** Material type (e.g. ST37, S235, 6082-T6) from BOM or DXF tag */
    material?: string;
    /** Thickness in mm from BOM or DXF tag */
    thickness?: number;
    /** Downstream manufacturing constraint for attribute clustering (e.g. bending, welding, machining) */
    downstreamProcess?: 'bending' | 'welding' | 'machining' | 'none';
    /** Grain direction constraint (x = aligned with sheet length, y = aligned with sheet width) */
    grainDirection?: 'none' | 'x' | 'y';
    /** Net calculated part weight (kg) */
    netWeightKg?: number;
    /** Bounding box rectangular weight (kg) */
    rectWeightKg?: number;
    /** Work order / İş Emri No */
    workOrder?: string;
    /** Customer / Müşteri */
    customer?: string;
    /** Engineering notes or tags */
    notes?: string;
    /** Parça bazlı kesim modu: 'common' (ortak kesim), 'standalone' (tekli kesim), 'auto' */
    cuttingMode?: 'common' | 'standalone' | 'auto';
    /** Ortak kesime (CLC) izin verilsin mi? (false ise tekli kesilir) */
    allowCommonLine?: boolean;
    /** Zincirleme / köprü kesime izin verilsin mi? */
    enableBridge?: boolean;
    /** Parça başına mikrojoint / tutucu sekme adedi */
    microjointCount?: number;
    /** Parçaya özel mikrojoint genişliği (mm) */
    microjointWidthMm?: number;
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
    /** Transformed inner cutouts/holes after placement */
    innerPolygons?: Polygon[];
    /** Parça bazlı kesim modu */
    cuttingMode?: 'common' | 'standalone' | 'auto';
    /** Ortak kesim izni */
    allowCommonLine?: boolean;
    /** Köprüleme izni */
    enableBridge?: boolean;
    /** Mikrojoint sekme sayısı */
    microjointCount?: number;
    /** Mikrojoint genişliği */
    microjointWidthMm?: number;
}

export interface FreeRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 🏭 SigmaNEST Industrial Remnant Sheet (Kalıntı Sac)
 * Generated automatically when sheet utilization leaves a reusable rectangular remnant
 */
export interface RemnantSheet2D {
    id: string; // e.g. TaskSheet45-1
    name: string;
    material: string;
    thickness: number;
    width: number;
    height: number;
    originX: number;
    originY: number;
    weightKg: number;
    originSheetIndex: number;
    createdAt: string;
    barcode?: string;
}

/**
 * ✂️ SigmaNEST Transverse Guillotine Crop Cut (Sac Ayırma / Giyotin Kesim)
 * Automatic line cut across the plate width or height to sever the remnant from the skeleton
 */
export interface GuillotineCropCut {
    axis: 'x' | 'y'; // 'x' cuts vertically at X coordinate, 'y' cuts horizontally at Y coordinate
    coordinate: number;
    startPoint: Point2D;
    endPoint: Point2D;
    lengthMm: number;
    piercePoint: Point2D;
}

export interface SheetResult {
    sheetIndex: number;
    placedParts: PlacedPart[];
    freeRectangles: FreeRectangle[];
    usedArea: number;
    wasteArea: number;
    efficiency: number;
    /** SigmaNEST Remnant Plate (Kalıntı Sac) */
    remnantSheet?: RemnantSheet2D;
    /** SigmaNEST Guillotine Crop Cut (Sac Kesme / Ayırma) */
    cropCut?: GuillotineCropCut;
    /** True scrap percentage deducting the reusable remnant */
    trueScrapPercent?: number;
    /** Used plate bounding envelope (Kull. Plaka Boyu & Eni) */
    usedEnvelope?: {
        width: number;
        height: number;
    };
    /** Plate this sheet was cut from (a stored remnant can be smaller than the job sheet) */
    stock?: {
        width: number;
        height: number;
        /** id of the stored remnant, when the sheet is a remnant */
        remnantId?: string;
    };
    /** Weights breakdown in kg */
    weights?: {
        sheetWeightKg: number;
        usedWeightKg: number;
        remnantWeightKg: number;
        partsWeightKg: number;
        scrapWeightKg: number;
    };
}

export interface NestingResult {
    sheets: SheetResult[];
    totalSheets: number;
    totalEfficiency: number;
    totalWaste: number;
    unplacedParts: { partId: string; reason: string }[];
    computeTimeMs: number;
    /** All reusable remnants generated across sheets */
    generatedRemnants?: RemnantSheet2D[];
    /** Aggregate scrap percentage accounting for recovered remnants */
    overallTrueScrapPercent?: number;
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
    /** Algorithm: 'sigmanest' | 'guillotine' | 'shelf' | 'maxrects' | 'hexagonal' */
    algorithm: 'sigmanest' | 'guillotine' | 'shelf' | 'maxrects' | 'hexagonal';
    /** Heuristic for rectangle selection */
    heuristic: 'best-area-fit' | 'best-short-side-fit' | 'best-long-side-fit';
    /** Allow multiple sheets */
    multiSheet: boolean;
    /** Max sheets to use (0 = unlimited) */
    maxSheets: number;
    /** Enable SigmaNEST Part-in-Part (Donut/Cutout) nesting */
    enablePartInPart?: boolean;
    /** Enable SigmaNEST Remnant Sheet Generation (Kalıntı Sac) */
    enableRemnantGeneration?: boolean;
    /** Minimum remnant dimension (mm) to qualify as a reusable sheet (default 400mm) */
    minRemnantDimensionMm?: number;
    /** Downstream manufacturing constraint clustering (e.g. group bending / welding) */
    downstreamClustering?: boolean;
    /** Available inventory remnants to nest onto FIRST before raw sheets */
    remnants?: RemnantSheet2D[];
    /** Enable Common Line (Ortak Kesim) flush 0-spacing packing */
    commonLine?: boolean;
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

// ============================================
// SIGMANEST DETAILED NESTING REPORT DATA
// ============================================

export interface SigmaNestReportPartItem {
    id: string | number;
    name: string;
    requiredQty: number;
    nestedQty: number;
    netWeightKg: number;
    rectWeightKg: number;
    dimensions: string; // e.g. "1268.00 x 408.00"
    workOrder: string;
    customer: string;
    cutTimeFormatted: string; // e.g. "00:05:58"
    cutTimeSec: number;
}

export interface SigmaNestReportData {
    reportTitle: string; // "Yerleşim Detayı"
    dateFormatted: string; // e.g. "29.05.2025 13:45:05"
    machineName: string; // e.g. "Esab_Plasma"
    taskName: string; // e.g. "T17_S235JR_30mm"
    programName: string; // e.g. "30 MM DENEME"
    amperage: number; // e.g. 200 A
    sheetIndex: number;
    totalSheets: number;
    repeatCount: number;
    stackCount: number;
    material: string; // e.g. "S235JR"
    thicknessMm: number; // e.g. 30.0
    sheetName: string; // e.g. "TaskSheet45"
    sheetLengthMm: number; // e.g. 15000.00
    sheetWidthMm: number; // e.g. 4000.00
    sheetWeightKg: number; // e.g. 14146.20
    usedLengthMm: number; // e.g. 8453.23
    usedWidthMm: number; // e.g. 3974.95
    usedWeightKg: number; // e.g. 6982.77
    remnantSheet?: RemnantSheet2D;
    remnantWeightKg: number; // e.g. 7163.43
    partsWeightKg: number; // e.g. 6361.90
    scrapWeightKg: number; // e.g. 620.87
    scrapPercent: number; // e.g. 8.89 %
    totalCutTimeFormatted: string; // e.g. "02:57:05"
    totalCutLengthMm: number; // e.g. 191761.58
    parts: SigmaNestReportPartItem[];
    workspacePath: string;
}



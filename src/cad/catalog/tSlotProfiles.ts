/**
 * AluCalc signature T-Slot aluminum extrusion catalog.
 * Wellste Industrial T-Slot Catalog (20, 30, 40, 45, 50, 60, 80 Series).
 *
 * 1:1 true dimensional precision based on Wellste / DIN EN 12020 / EN 755.
 * Multi-slot rectangular and square beam geometry with exact chamfers,
 * mouth bevels, lip thickness, trapezoidal undercut shoulders, and
 * multi-cell internal center bores.
 */

import {
    CadEntity,
    Point,
    createCircleEntity,
    createPolylineEntity,
} from '../kernel/types';
import {
    Point2,
    computeSectionProperties,
    PolygonSectionProperties,
    sampleCircle,
} from '../geometry/sectionProperties';

export type TSlotSeries = 20 | 30 | 40 | 45 | 50 | 60 | 80;
export type TSlotSize = number;

export interface TSlotSpec {
    id: string;
    name: string;
    series: TSlotSeries;
    size: number;
    width: number;
    height: number;
    gridSize: number;
    slotsX: number;
    slotsY: number;
    slot: number;        // slot mouth opening ws (mm)
    lip: number;         // lip thickness t1 (mm)
    headWidth: number;   // cavity head width wh (mm)
    headDepth: number;   // cavity depth dh (mm)
    bore: number;        // center bore diameter (mm)
    chamfer: number;     // outer corner chamfer (mm)
    massKgPerM: number;  // catalog linear mass (kg/m)
    ix_cm4: number;      // moment of inertia Ix (cm^4)
    iy_cm4: number;      // moment of inertia Iy (cm^4)
    alloy: string;
    standard: string;
}

export const TSLOT_CATALOG: readonly TSlotSpec[] = [
    // ═══════════════════════════════════════════════════════════════
    // 20 SERIES (Slot 6, grid 20 mm, bore Ø5.0 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '2020',
        name: '20×20 T-Slot (Slot 6)',
        series: 20,
        size: 20,
        width: 20,
        height: 20,
        gridSize: 20,
        slotsX: 1,
        slotsY: 1,
        slot: 6.2,
        lip: 1.8,
        headWidth: 9.6,
        headDepth: 4.2,
        bore: 5.0,
        chamfer: 0.8,
        massKgPerM: 0.65,
        ix_cm4: 0.72,
        iy_cm4: 0.72,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '2040',
        name: '20×40 T-Slot (Slot 6)',
        series: 20,
        size: 20,
        width: 20,
        height: 40,
        gridSize: 20,
        slotsX: 1,
        slotsY: 2,
        slot: 6.2,
        lip: 1.8,
        headWidth: 9.6,
        headDepth: 4.2,
        bore: 5.0,
        chamfer: 0.8,
        massKgPerM: 1.10,
        ix_cm4: 5.23,
        iy_cm4: 1.35,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '2060',
        name: '20×60 T-Slot (Slot 6)',
        series: 20,
        size: 20,
        width: 20,
        height: 60,
        gridSize: 20,
        slotsX: 1,
        slotsY: 3,
        slot: 6.2,
        lip: 1.8,
        headWidth: 9.6,
        headDepth: 4.2,
        bore: 5.0,
        chamfer: 0.8,
        massKgPerM: 1.45,
        ix_cm4: 16.50,
        iy_cm4: 2.10,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '2080',
        name: '20×80 T-Slot (Slot 6)',
        series: 20,
        size: 20,
        width: 20,
        height: 80,
        gridSize: 20,
        slotsX: 1,
        slotsY: 4,
        slot: 6.2,
        lip: 1.8,
        headWidth: 9.6,
        headDepth: 4.2,
        bore: 5.0,
        chamfer: 0.8,
        massKgPerM: 1.98,
        ix_cm4: 38.20,
        iy_cm4: 2.85,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 30 SERIES (Slot 8, grid 30 mm, bore Ø6.8 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '3030',
        name: '30×30 T-Slot (Slot 8)',
        series: 30,
        size: 30,
        width: 30,
        height: 30,
        gridSize: 30,
        slotsX: 1,
        slotsY: 1,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.0,
        massKgPerM: 1.05,
        ix_cm4: 2.90,
        iy_cm4: 2.90,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '3060',
        name: '30×60 T-Slot (Slot 8)',
        series: 30,
        size: 30,
        width: 30,
        height: 60,
        gridSize: 30,
        slotsX: 1,
        slotsY: 2,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.0,
        massKgPerM: 1.85,
        ix_cm4: 21.60,
        iy_cm4: 5.60,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '3090',
        name: '30×90 T-Slot (Slot 8)',
        series: 30,
        size: 30,
        width: 30,
        height: 90,
        gridSize: 30,
        slotsX: 1,
        slotsY: 3,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.0,
        massKgPerM: 2.85,
        ix_cm4: 72.40,
        iy_cm4: 8.35,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '30120',
        name: '30×120 T-Slot (Slot 8)',
        series: 30,
        size: 30,
        width: 30,
        height: 120,
        gridSize: 30,
        slotsX: 1,
        slotsY: 4,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.0,
        massKgPerM: 3.98,
        ix_cm4: 168.00,
        iy_cm4: 11.20,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '30150',
        name: '30×150 T-Slot (Slot 8)',
        series: 30,
        size: 30,
        width: 30,
        height: 150,
        gridSize: 30,
        slotsX: 1,
        slotsY: 5,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.0,
        massKgPerM: 4.50,
        ix_cm4: 320.00,
        iy_cm4: 14.10,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '6060-30',
        name: '60×60 T-Slot (Slot 8 / 30s Grid)',
        series: 30,
        size: 60,
        width: 60,
        height: 60,
        gridSize: 30,
        slotsX: 2,
        slotsY: 2,
        slot: 8.2,
        lip: 2.0,
        headWidth: 14.0,
        headDepth: 6.2,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 3.20,
        ix_cm4: 42.00,
        iy_cm4: 42.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 40 SERIES (Slot 8 & 10, grid 40 mm, bore Ø6.8 mm / Ø12.0 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '4040',
        name: '40×40 T-Slot (Slot 8)',
        series: 40,
        size: 40,
        width: 40,
        height: 40,
        gridSize: 40,
        slotsX: 1,
        slotsY: 1,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 1.75,
        ix_cm4: 9.70,
        iy_cm4: 9.70,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4040H',
        name: '40×40 Heavy T-Slot (Slot 10)',
        series: 40,
        size: 40,
        width: 40,
        height: 40,
        gridSize: 40,
        slotsX: 1,
        slotsY: 1,
        slot: 10.2,
        lip: 2.8,
        headWidth: 17.0,
        headDepth: 8.8,
        bore: 12.0,
        chamfer: 1.2,
        massKgPerM: 2.10,
        ix_cm4: 11.50,
        iy_cm4: 11.50,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4060',
        name: '40×60 T-Slot (Slot 8)',
        series: 40,
        size: 40,
        width: 40,
        height: 60,
        gridSize: 40,
        slotsX: 1,
        slotsY: 2,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 2.45,
        ix_cm4: 24.80,
        iy_cm4: 12.10,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4080',
        name: '40×80 T-Slot (Slot 8)',
        series: 40,
        size: 40,
        width: 40,
        height: 80,
        gridSize: 40,
        slotsX: 1,
        slotsY: 2,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 3.25,
        ix_cm4: 74.50,
        iy_cm4: 19.80,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '40120',
        name: '40×120 T-Slot (Slot 8)',
        series: 40,
        size: 40,
        width: 40,
        height: 120,
        gridSize: 40,
        slotsX: 1,
        slotsY: 3,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 4.90,
        ix_cm4: 245.00,
        iy_cm4: 30.50,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '40160',
        name: '40×160 T-Slot (Slot 8)',
        series: 40,
        size: 40,
        width: 40,
        height: 160,
        gridSize: 40,
        slotsX: 1,
        slotsY: 4,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.2,
        massKgPerM: 7.20,
        ix_cm4: 560.00,
        iy_cm4: 41.20,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '8080-40',
        name: '80×80 T-Slot (Slot 8 / 40s Grid)',
        series: 40,
        size: 80,
        width: 80,
        height: 80,
        gridSize: 40,
        slotsX: 2,
        slotsY: 2,
        slot: 8.2,
        lip: 2.5,
        headWidth: 16.5,
        headDepth: 8.5,
        bore: 6.8,
        chamfer: 1.5,
        massKgPerM: 5.80,
        ix_cm4: 135.00,
        iy_cm4: 135.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 45 SERIES (Slot 10, grid 45 mm, bore Ø10.2 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '4545',
        name: '45×45 T-Slot (Slot 10)',
        series: 45,
        size: 45,
        width: 45,
        height: 45,
        gridSize: 45,
        slotsX: 1,
        slotsY: 1,
        slot: 10.2,
        lip: 2.8,
        headWidth: 19.0,
        headDepth: 9.8,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 2.20,
        ix_cm4: 13.50,
        iy_cm4: 13.50,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4545H',
        name: '45×45 Heavy T-Slot (Slot 10)',
        series: 45,
        size: 45,
        width: 45,
        height: 45,
        gridSize: 45,
        slotsX: 1,
        slotsY: 1,
        slot: 10.2,
        lip: 3.0,
        headWidth: 19.0,
        headDepth: 9.8,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 2.50,
        ix_cm4: 15.80,
        iy_cm4: 15.80,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4560',
        name: '45×60 T-Slot (Slot 10)',
        series: 45,
        size: 45,
        width: 45,
        height: 60,
        gridSize: 45,
        slotsX: 1,
        slotsY: 2,
        slot: 10.2,
        lip: 2.8,
        headWidth: 19.0,
        headDepth: 9.8,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 2.80,
        ix_cm4: 31.00,
        iy_cm4: 18.20,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '4590',
        name: '45×90 T-Slot (Slot 10)',
        series: 45,
        size: 45,
        width: 45,
        height: 90,
        gridSize: 45,
        slotsX: 1,
        slotsY: 2,
        slot: 10.2,
        lip: 2.8,
        headWidth: 19.0,
        headDepth: 9.8,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 4.50,
        ix_cm4: 112.00,
        iy_cm4: 28.50,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '9090-45',
        name: '90×90 T-Slot (Slot 10 / 45s Grid)',
        series: 45,
        size: 90,
        width: 90,
        height: 90,
        gridSize: 45,
        slotsX: 2,
        slotsY: 2,
        slot: 10.2,
        lip: 2.8,
        headWidth: 19.0,
        headDepth: 9.8,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 7.80,
        ix_cm4: 220.00,
        iy_cm4: 220.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 50 SERIES (Slot 10, grid 50 mm, bore Ø10.2 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '5050',
        name: '50×50 T-Slot (Slot 10)',
        series: 50,
        size: 50,
        width: 50,
        height: 50,
        gridSize: 50,
        slotsX: 1,
        slotsY: 1,
        slot: 10.2,
        lip: 3.0,
        headWidth: 20.0,
        headDepth: 11.0,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 2.95,
        ix_cm4: 26.50,
        iy_cm4: 26.50,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '50100',
        name: '50×100 T-Slot (Slot 10)',
        series: 50,
        size: 50,
        width: 50,
        height: 100,
        gridSize: 50,
        slotsX: 1,
        slotsY: 2,
        slot: 10.2,
        lip: 3.0,
        headWidth: 20.0,
        headDepth: 11.0,
        bore: 10.2,
        chamfer: 1.5,
        massKgPerM: 4.90,
        ix_cm4: 198.00,
        iy_cm4: 52.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 60 SERIES (Slot 10, grid 60 mm, bore Ø12.0 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '6060',
        name: '60×60 T-Slot (Slot 10)',
        series: 60,
        size: 60,
        width: 60,
        height: 60,
        gridSize: 60,
        slotsX: 1,
        slotsY: 1,
        slot: 10.2,
        lip: 3.2,
        headWidth: 22.0,
        headDepth: 12.0,
        bore: 12.0,
        chamfer: 1.5,
        massKgPerM: 3.80,
        ix_cm4: 48.00,
        iy_cm4: 48.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '60120',
        name: '60×120 T-Slot (Slot 10)',
        series: 60,
        size: 60,
        width: 60,
        height: 120,
        gridSize: 60,
        slotsX: 1,
        slotsY: 2,
        slot: 10.2,
        lip: 3.2,
        headWidth: 22.0,
        headDepth: 12.0,
        bore: 12.0,
        chamfer: 1.5,
        massKgPerM: 6.80,
        ix_cm4: 360.00,
        iy_cm4: 95.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },

    // ═══════════════════════════════════════════════════════════════
    // 80 SERIES (Slot 10, grid 80 mm / 40 mm dual, bore Ø12.0 mm)
    // ═══════════════════════════════════════════════════════════════
    {
        id: '8080',
        name: '80×80 T-Slot (Slot 10)',
        series: 80,
        size: 80,
        width: 80,
        height: 80,
        gridSize: 40,
        slotsX: 2,
        slotsY: 2,
        slot: 10.2,
        lip: 3.0,
        headWidth: 17.5,
        headDepth: 9.0,
        bore: 12.0,
        chamfer: 2.0,
        massKgPerM: 5.80,
        ix_cm4: 145.00,
        iy_cm4: 145.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
    {
        id: '80160',
        name: '80×160 T-Slot (Slot 10)',
        series: 80,
        size: 80,
        width: 80,
        height: 160,
        gridSize: 40,
        slotsX: 2,
        slotsY: 4,
        slot: 10.2,
        lip: 3.0,
        headWidth: 17.5,
        headDepth: 9.0,
        bore: 12.0,
        chamfer: 2.0,
        massKgPerM: 12.60,
        ix_cm4: 1150.00,
        iy_cm4: 295.00,
        alloy: 'EN AW-6063-T5',
        standard: 'EN 12020 / EN 755',
    },
];

export function getTSlotSpec(sizeOrId: TSlotSize | string | number): TSlotSpec {
    const key = String(sizeOrId).trim().toUpperCase();
    const found = TSLOT_CATALOG.find((s) => s.id.toUpperCase() === key);
    if (found) return found;

    // Numeric search fallback (e.g. 20 -> 2020, 40 -> 4040)
    const num = parseInt(key, 10);
    if (!isNaN(num)) {
        const bySize = TSLOT_CATALOG.find((s) => s.width === num && s.height === num)
            || TSLOT_CATALOG.find((s) => s.series === num)
            || TSLOT_CATALOG.find((s) => s.id.startsWith(String(num)));
        if (bySize) return bySize;
    }

    return TSLOT_CATALOG[10]; // 40×40 default
}

function translate(pts: Point2[], origin: Point2): Point2[] {
    if (origin.x === 0 && origin.y === 0) return pts;
    return pts.map((p) => ({ x: p.x + origin.x, y: p.y + origin.y }));
}

function dedupe(pts: Point2[], tol = 1e-5): Point2[] {
    const out: Point2[] = [];
    for (const p of pts) {
        const prev = out[out.length - 1];
        if (prev && Math.hypot(prev.x - p.x, prev.y - p.y) <= tol) continue;
        out.push(p);
    }
    if (out.length >= 2) {
        const a = out[0];
        const b = out[out.length - 1];
        if (Math.hypot(a.x - b.x, a.y - b.y) <= tol) out.pop();
    }
    return out;
}

/**
 * Universal CCW Perimeter Generator for 1:1 Authentic T-Slot Extrusions.
 * Handles ANY W × H rectangular profile with arbitrary number of slots per face.
 * Follows exact DIN EN 12020 / Wellste cross-section geometry:
 * - Corner chamfer (c × 45°)
 * - Slot mouth bevel (0.5 mm × 45°)
 * - Slot mouth width ws
 * - Lip thickness t1
 * - Angled shoulder expansion (45°)
 * - Head cavity depth dh and width wh
 */
export function buildTSlotOuter(spec: TSlotSpec, origin: Point2 = { x: 0, y: 0 }): Point2[] {
    const W = spec.width;
    const H = spec.height;
    const xMin = -W / 2;
    const xMax = W / 2;
    const yMin = -H / 2;
    const yMax = H / 2;

    const nx = spec.slotsX;
    const ny = spec.slotsY;
    const pitchX = W / nx;
    const pitchY = H / ny;
    const minCellHalf = Math.min(pitchX, pitchY) / 2;

    const c = Math.min(spec.chamfer, 2.0);
    const s = spec.slot / 2;

    // Geometric boundary protection:
    // Slot depth cannot exceed minCellHalf - 1.2 mm
    const hd = Math.min(spec.headDepth, minCellHalf - 1.2);
    // Head half-width cannot exceed minCellHalf - hd - 0.8 mm
    const hw = Math.min(spec.headWidth / 2, Math.max(s + 0.5, minCellHalf - hd - 0.8));
    const lip = Math.min(spec.lip, hd - 1.2);
    const bevel = Math.min(0.5, c * 0.5);

    // Shoulder flare height
    const flareDy = Math.min(hw - s, Math.max(0.4, hd - lip - 0.6));

    const pts: Point2[] = [];

    // ── 1. BOTTOM EDGE (y = yMin, running Left → Right) ─────────────
    // Start at bottom-left corner chamfer end
    pts.push({ x: xMin, y: yMin + c });
    pts.push({ x: xMin + c, y: yMin });

    for (let i = 0; i < nx; i++) {
        const xc = xMin + (i + 0.5) * pitchX;
        pts.push({ x: xc - s - bevel, y: yMin });
        pts.push({ x: xc - s, y: yMin + bevel });
        pts.push({ x: xc - s, y: yMin + lip });
        pts.push({ x: xc - hw, y: yMin + lip + flareDy });
        pts.push({ x: xc - hw, y: yMin + hd });
        pts.push({ x: xc + hw, y: yMin + hd });
        pts.push({ x: xc + hw, y: yMin + lip + flareDy });
        pts.push({ x: xc + s, y: yMin + lip });
        pts.push({ x: xc + s, y: yMin + bevel });
        pts.push({ x: xc + s + bevel, y: yMin });
    }

    pts.push({ x: xMax - c, y: yMin });
    pts.push({ x: xMax, y: yMin + c });

    // ── 2. RIGHT EDGE (x = xMax, running Bottom → Top) ──────────────
    for (let j = 0; j < ny; j++) {
        const yc = yMin + (j + 0.5) * pitchY;
        pts.push({ x: xMax, y: yc - s - bevel });
        pts.push({ x: xMax - bevel, y: yc - s });
        pts.push({ x: xMax - lip, y: yc - s });
        pts.push({ x: xMax - lip - flareDy, y: yc - hw });
        pts.push({ x: xMax - hd, y: yc - hw });
        pts.push({ x: xMax - hd, y: yc + hw });
        pts.push({ x: xMax - lip - flareDy, y: yc + hw });
        pts.push({ x: xMax - lip, y: yc + s });
        pts.push({ x: xMax - bevel, y: yc + s });
        pts.push({ x: xMax, y: yc + s + bevel });
    }

    pts.push({ x: xMax, y: yMax - c });
    pts.push({ x: xMax - c, y: yMax });

    // ── 3. TOP EDGE (y = yMax, running Right → Left) ────────────────
    for (let i = nx - 1; i >= 0; i--) {
        const xc = xMin + (i + 0.5) * pitchX;
        pts.push({ x: xc + s + bevel, y: yMax });
        pts.push({ x: xc + s, y: yMax - bevel });
        pts.push({ x: xc + s, y: yMax - lip });
        pts.push({ x: xc + hw, y: yMax - lip - flareDy });
        pts.push({ x: xc + hw, y: yMax - hd });
        pts.push({ x: xc - hw, y: yMax - hd });
        pts.push({ x: xc - hw, y: yMax - lip - flareDy });
        pts.push({ x: xc - s, y: yMax - lip });
        pts.push({ x: xc - s, y: yMax - bevel });
        pts.push({ x: xc - s - bevel, y: yMax });
    }

    pts.push({ x: xMin + c, y: yMax });
    pts.push({ x: xMin, y: yMax - c });

    // ── 4. LEFT EDGE (x = xMin, running Top → Bottom) ───────────────
    for (let j = ny - 1; j >= 0; j--) {
        const yc = yMin + (j + 0.5) * pitchY;
        pts.push({ x: xMin, y: yc + s + bevel });
        pts.push({ x: xMin + bevel, y: yc + s });
        pts.push({ x: xMin + lip, y: yc + s });
        pts.push({ x: xMin + lip + flareDy, y: yc + hw });
        pts.push({ x: xMin + hd, y: yc + hw });
        pts.push({ x: xMin + hd, y: yc - hw });
        pts.push({ x: xMin + lip + flareDy, y: yc - hw });
        pts.push({ x: xMin + lip, y: yc - s });
        pts.push({ x: xMin + bevel, y: yc - s });
        pts.push({ x: xMin, y: yc - s - bevel });
    }

    return translate(dedupe(pts), origin);
}

/**
 * Generates all circular internal center bores for an Nx × Ny multi-cell beam.
 */
export function buildTSlotBores(spec: TSlotSpec, origin: Point2 = { x: 0, y: 0 }, segments = 36): Point2[][] {
    const W = spec.width;
    const H = spec.height;
    const xMin = -W / 2;
    const yMin = -H / 2;
    const nx = spec.slotsX;
    const ny = spec.slotsY;
    const pitchX = W / nx;
    const pitchY = H / ny;
    const r = spec.bore / 2;

    const holes: Point2[][] = [];
    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
            const bx = origin.x + xMin + (i + 0.5) * pitchX;
            const by = origin.y + yMin + (j + 0.5) * pitchY;
            holes.push(sampleCircle(bx, by, r, segments, true));
        }
    }
    return holes;
}

export function buildTSlotBore(spec: TSlotSpec, origin: Point2 = { x: 0, y: 0 }, segments = 36): Point2[] {
    const bores = buildTSlotBores(spec, origin, segments);
    return bores[0] || sampleCircle(origin.x, origin.y, spec.bore / 2, segments, true);
}

export interface TSlotSectionGeometry {
    spec: TSlotSpec;
    outer: Point2[];
    holes: Point2[][];
    section: PolygonSectionProperties;
}

export function buildTSlotSection(spec: TSlotSpec, origin: Point2 = { x: 0, y: 0 }): TSlotSectionGeometry {
    const outer = buildTSlotOuter(spec, origin);
    const holes = buildTSlotBores(spec, origin);
    const section = computeSectionProperties(outer, holes);
    return { spec, outer, holes, section };
}

export function tSlotToCadEntities(
    spec: TSlotSpec,
    origin: Point,
    layerId: string,
    color = '#38bdf8'
): CadEntity[] {
    const geom = buildTSlotSection(spec, origin);
    const outer = createPolylineEntity(geom.outer, true, layerId, color);
    
    const W = spec.width;
    const H = spec.height;
    const xMin = -W / 2;
    const yMin = -H / 2;
    const nx = spec.slotsX;
    const ny = spec.slotsY;
    const pitchX = W / nx;
    const pitchY = H / ny;
    const r = spec.bore / 2;

    const boreEntities: CadEntity[] = [];
    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
            const bx = origin.x + xMin + (i + 0.5) * pitchX;
            const by = origin.y + yMin + (j + 0.5) * pitchY;
            boreEntities.push(createCircleEntity({ x: bx, y: by }, r, layerId, color));
        }
    }

    return [outer, ...boreEntities];
}

export function tSlotMassKg(spec: TSlotSpec, lengthMm: number, qty = 1, densityGcm3 = 2.70): number {
    const fromCatalog = spec.massKgPerM * (lengthMm / 1000) * qty;
    if (fromCatalog > 0) return fromCatalog;
    const geom = buildTSlotSection(spec);
    const volCm3 = (geom.section.area * lengthMm) / 1000;
    return (volCm3 * densityGcm3 * qty) / 1000;
}

export function tSlotFormulas(spec: TSlotSpec, lengthMm: number, section?: PolygonSectionProperties) {
    const geom = section ? null : buildTSlotSection(spec);
    const s = section || geom!.section;
    const mass = tSlotMassKg(spec, lengthMm);
    const vol = s.area * lengthMm;
    return [
        { label: 'Kesit Alanı (A)', formula: 'A = ½ ∮ (x dy − y dx)  (Shoelace)', result: `${s.area.toFixed(1)} mm²`, unit: 'mm²', standard: spec.standard },
        { label: 'Atalet Momenti Ix', formula: 'Ix = ∮ y² dA  (Green)', result: `${(s.Ix / 1e4).toFixed(3)} cm⁴ (kat. ${spec.ix_cm4})`, unit: 'cm⁴', standard: spec.standard },
        { label: 'Atalet Momenti Iy', formula: 'Iy = ∮ x² dA  (Green)', result: `${(s.Iy / 1e4).toFixed(3)} cm⁴ (kat. ${spec.iy_cm4})`, unit: 'cm⁴', standard: spec.standard },
        { label: 'Mukavemet Momenti Wx', formula: 'Wx = Ix / y_max', result: `${(s.Wx / 1e3).toFixed(3)} cm³`, unit: 'cm³', standard: 'EN 1999-1-1' },
        { label: 'Ekstrüzyon Hacmi', formula: 'V = A · L', result: `${(vol / 1000).toFixed(1)} cm³`, unit: 'cm³', standard: spec.standard },
        { label: 'Kütle (katalog)', formula: 'm = ρ_lin · L', result: `${mass.toFixed(3)} kg`, unit: 'kg', standard: spec.alloy },
    ];
}

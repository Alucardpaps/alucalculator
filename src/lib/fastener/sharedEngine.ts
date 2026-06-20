/**
 * Shared fastener geometry & VDI 2230 torque engine.
 * Single source for /fasteners and /bolt-torque production dimensions.
 *
 * Thread geometry: ISO 965 tabulated values from fastenersData.ts
 * Clearance holes: ISO 273 (machiningStandards.ts)
 * Head/nut: ISO 4017/4032 (boltNutStandards.ts)
 */

import { FASTENERS_DB, type Fastener } from '@/data/fastenersData';
import { getClearanceHole } from '@/data/machiningStandards';
import {
    getFastenerGeometry,
    NUT_DIMENSIONS,
    BOLT_PROPERTY_CLASSES,
    THREAD_STANDARDS,
} from '@/data/boltNutStandards';

export type GeometryPageStandard =
    | 'ISO Metric'
    | 'ISO Metric Fine'
    | 'UNC'
    | 'UNF'
    | 'BSPP (G)'
    | 'BSPT (R)'
    | 'NPT'
    | 'Trapezoidal (Tr)'
    | 'Custom';

export type TorquePageStandard =
    | 'Metric Coarse'
    | 'Metric Fine'
    | 'UNC'
    | 'UNF'
    | 'Pipe'
    | 'Trapezoidal'
    | 'Custom';

export interface ThreadGeometry {
    standard: string;
    size: string;
    majorDia: number;
    minorDia: number;
    pitchDia: number;
    pitch: number;
    tapDrill: number;
    stressArea: number;
    clearanceNormal: number | null;
    clearanceFine: number | null;
    clearanceCoarse: number | null;
    isTapered: boolean;
    isImperialPitch: boolean;
    source: 'table' | 'computed';
}

export interface BoltAssemblyResult {
    d_nom: number;
    d2: number;
    d3: number;
    As: number;
    pitchVal: number;
    dh: number;
    dw: number;
    rb: number;
    K1: number;
    K2: number;
    K3: number;
    K: number;
    Fm_max: number;
    MA: number;
    stress: number;
    safety: number;
    Sy: number;
    grade: string;
    boltDim: ReturnType<typeof getFastenerGeometry>;
    nutDim: (typeof NUT_DIMENSIONS)[number] | { width: number; height: number };
    geometry: ThreadGeometry;
}

const TORQUE_TO_GEOMETRY: Record<TorquePageStandard, GeometryPageStandard | null> = {
    'Metric Coarse': 'ISO Metric',
    'Metric Fine': 'ISO Metric Fine',
    UNC: 'UNC',
    UNF: 'UNF',
    Pipe: null,
    Trapezoidal: 'Trapezoidal (Tr)',
    Custom: 'Custom',
};

const GEOMETRY_TO_TORQUE: Partial<Record<GeometryPageStandard, TorquePageStandard>> = {
    'ISO Metric': 'Metric Coarse',
    'ISO Metric Fine': 'Metric Fine',
    UNC: 'UNC',
    UNF: 'UNF',
    'BSPP (G)': 'Pipe',
    'BSPT (R)': 'Pipe',
    NPT: 'Pipe',
    'Trapezoidal (Tr)': 'Trapezoidal',
};

export function metricSizeLabel(d: number): string {
    return `M${Number.isInteger(d) ? d : d}`;
}

export function extractMetricNominal(size: string): string | null {
    const m = size.match(/^M(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return `M${Number.isInteger(n) ? n : n}`;
}

function rowToGeometry(row: Fastener, source: 'table' | 'computed' = 'table'): ThreadGeometry {
    const metricNom = extractMetricNominal(row.size);
    const clearanceNormal = metricNom ? getClearanceHole(metricNom, 'normal') : null;
    const clearanceFine = metricNom ? getClearanceHole(metricNom, 'fine') : null;
    const clearanceCoarse = metricNom ? getClearanceHole(metricNom, 'coarse') : null;
    const isImperialPitch = row.standard === 'UNC' || row.standard === 'UNF'
        || row.standard === 'BSPP (G)' || row.standard === 'BSPT (R)' || row.standard === 'NPT';

    return {
        standard: row.standard,
        size: row.size,
        majorDia: row.majorDia,
        minorDia: row.minorDia,
        pitchDia: row.pitchDia,
        pitch: row.pitch,
        tapDrill: row.tapDrill,
        stressArea: row.stressArea,
        clearanceNormal,
        clearanceFine,
        clearanceCoarse,
        isTapered: row.standard === 'NPT' || row.standard === 'BSPT (R)',
        isImperialPitch,
        source,
    };
}

function computeCustomGeometry(d: number, pitch: number, standardLabel = 'Custom'): ThreadGeometry {
    const d2 = d - 0.6495 * pitch;
    const d3 = d - 1.0825 * pitch;
    const stressArea = 0.7854 * Math.pow(d - 0.9382 * pitch, 2);
    const metricNom = extractMetricNominal(metricSizeLabel(d));
    return {
        standard: standardLabel,
        size: `Custom ${d}`,
        majorDia: d,
        minorDia: d3,
        pitchDia: d2,
        pitch,
        tapDrill: Math.max(d - pitch, 0),
        stressArea,
        clearanceNormal: metricNom ? getClearanceHole(metricNom, 'normal') : d * 1.05,
        clearanceFine: metricNom ? getClearanceHole(metricNom, 'fine') : null,
        clearanceCoarse: metricNom ? getClearanceHole(metricNom, 'coarse') : null,
        isTapered: false,
        isImperialPitch: false,
        source: 'computed',
    };
}

export function findGeometryRow(standard: GeometryPageStandard, size: string): Fastener | undefined {
    return FASTENERS_DB.find(f => f.standard === standard && f.size === size);
}

export function getThreadGeometryFromPage(
    standard: GeometryPageStandard,
    size: string,
    custom?: { diameter: number; pitch: number },
): ThreadGeometry | null {
    if (standard === 'Custom' && custom) {
        return computeCustomGeometry(custom.diameter, custom.pitch);
    }
    const row = findGeometryRow(standard, size);
    return row ? rowToGeometry(row) : null;
}

export function getThreadGeometryFromTorquePage(
    threadStandard: TorquePageStandard,
    size: string,
    custom?: { diameter: number; pitch: number },
): ThreadGeometry {
    if (threadStandard === 'Custom' && custom) {
        return computeCustomGeometry(custom.diameter, custom.pitch);
    }

    const mapped = TORQUE_TO_GEOMETRY[threadStandard];
    if (mapped) {
        const row = findGeometryRow(mapped, size);
        if (row) return rowToGeometry(row);
    }

    // Pipe / fallback via THREAD_STANDARDS formulas
    const std = THREAD_STANDARDS.find(t => t.size === size);
    if (std) {
        const pitchVal = std.pitch ?? (25.4 / (std.tpi || 1));
        const d = std.diameter;
        const d2 = d - 0.6495 * pitchVal;
        const d3 = std.minorDiameter ?? (d - 1.0825 * pitchVal);
        const metricNom = extractMetricNominal(size);
        return {
            standard: threadStandard,
            size,
            majorDia: d,
            minorDia: d3,
            pitchDia: d2,
            pitch: pitchVal,
            tapDrill: std.tapDrill,
            stressArea: std.area_tensile,
            clearanceNormal: metricNom ? getClearanceHole(metricNom, 'normal') : null,
            clearanceFine: metricNom ? getClearanceHole(metricNom, 'fine') : null,
            clearanceCoarse: metricNom ? getClearanceHole(metricNom, 'coarse') : null,
            isTapered: size.includes('NPT') || size.includes('R '),
            isImperialPitch: !!(std.tpi),
            source: 'computed',
        };
    }

    return computeCustomGeometry(12, 1.75, threadStandard);
}

export function getYieldStrength(grade: string): number {
    const cls = BOLT_PROPERTY_CLASSES.find(b => b.class === grade);
    return cls?.yieldStrengthMin ?? 640;
}

export function computeBoltAssembly(params: {
    threadStandard: TorquePageStandard;
    size: string;
    customDia?: number;
    pitch?: number;
    grade: string;
    muThread: number;
    muHead: number;
    yieldUtilization: number;
    clearanceSeries?: 'fine' | 'normal' | 'coarse';
}): BoltAssemblyResult {
    const {
        threadStandard,
        size,
        customDia = 12,
        pitch = 1.75,
        grade,
        muThread,
        muHead,
        yieldUtilization,
        clearanceSeries = 'normal',
    } = params;

    const geometry = getThreadGeometryFromTorquePage(
        threadStandard,
        size,
        threadStandard === 'Custom' ? { diameter: customDia, pitch } : undefined,
    );

    const Sy = getYieldStrength(grade);
    const d_nom = geometry.majorDia;
    const d2 = geometry.pitchDia;
    const d3 = geometry.minorDia;
    const As = geometry.stressArea;
    const pitchVal = geometry.pitch;

    const boltDim = getFastenerGeometry(size, d_nom);
    const nutDim = NUT_DIMENSIONS.find(n => n.size === size) || { width: boltDim.s, height: boltDim.k * 0.8 };

    const metricNom = extractMetricNominal(size);
    const dh = metricNom
        ? (getClearanceHole(metricNom, clearanceSeries) ?? geometry.clearanceNormal ?? d_nom + 1)
        : (geometry.clearanceNormal ?? d_nom * 1.05);

    const dw = boltDim.s;
    const rb = (dw + dh) / 4;

    const K1 = 0.159 * (pitchVal / d_nom);
    const K2 = 0.577 * muThread * (d2 / d_nom);
    const K3 = muHead * (rb / d_nom);
    const K = K1 + K2 + K3;

    const F0_max = (yieldUtilization / 100) * As * Sy;
    const Fm_max = F0_max / 1000;
    const MA = K * F0_max * (d_nom / 1000);

    return {
        d_nom,
        d2,
        d3,
        As,
        pitchVal,
        dh,
        dw,
        rb,
        K1,
        K2,
        K3,
        K,
        Fm_max,
        MA,
        stress: F0_max / As,
        safety: Sy / (F0_max / As),
        Sy,
        grade,
        boltDim,
        nutDim,
        geometry,
    };
}

export function buildFastenerLinkParams(standard: GeometryPageStandard, size: string, grade = '8.8') {
    const torqueStd = GEOMETRY_TO_TORQUE[standard] ?? 'Metric Coarse';
    return new URLSearchParams({ standard: torqueStd, size, grade }).toString();
}

export function buildGeometryLinkParams(threadStandard: TorquePageStandard, size: string) {
    const geometryStd = TORQUE_TO_GEOMETRY[threadStandard] ?? 'ISO Metric';
    if (!geometryStd || geometryStd === 'Custom') {
        return new URLSearchParams({ standard: 'ISO Metric', size: size.startsWith('M') ? size : 'M12' }).toString();
    }
    return new URLSearchParams({ standard: geometryStd, size }).toString();
}

export function parseFastenerSearchParams(search: string) {
    const p = new URLSearchParams(search);
    return {
        standard: p.get('standard') || undefined,
        size: p.get('size') || undefined,
        grade: p.get('grade') || undefined,
    };
}

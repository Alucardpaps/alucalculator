/**
 * ISO 286 — compatibility facade (mm units).
 *
 * This module used to carry its own formula-based ISO 286 approximation, which
 * disagreed with /fits (e.g. non-H holes silently fell back to H, k/m/p/s were
 * "simplified"). It now delegates to the single table-driven engine in
 * '@/lib/engine/iso286' so the calculator schema, Flow nodes and the /fits page
 * always return identical limits. Units here stay in millimetres for the
 * existing callers.
 */
import {
    calculateIT,
    calculateFit,
    getFundamentalDeviation as fundamentalDeviationUm,
    ISO_STEPS,
} from '@/lib/engine/iso286';

export function getStepGeometricMean(nominal: number): number {
    const steps = [0, ...ISO_STEPS];
    for (let i = 1; i < steps.length; i++) {
        if (nominal > steps[i - 1] && nominal <= steps[i]) return Math.sqrt(Math.max(1, steps[i - 1]) * steps[i]);
    }
    return nominal;
}

/** IT tolerance in mm. */
export function getTolerance(grade: number, diameter: number): number {
    const um = calculateIT(diameter, grade);
    return Number.isFinite(um) ? um / 1000 : 0;
}

/** Shaft fundamental deviation in mm (grade 6 assumed for k). */
export function getFundamentalDeviation(letter: string, diameter: number, grade = 6): number {
    const isHole = letter !== letter.toLowerCase();
    return fundamentalDeviationUm(diameter, letter, grade, isHole) / 1000;
}

export interface FitResult {
    hole: { ES: number; EI: number; tol: number; class: string };
    shaft: { es: number; ei: number; tol: number; class: string };
    fit: { type: 'Clearance' | 'Transition' | 'Interference'; maxClearance: number; minClearance: number };
    warnings?: string[];
}

function parseClass(cls: string, fallbackLetter: string, fallbackGrade: number) {
    const letter = cls.replace(/[0-9]/g, '') || fallbackLetter;
    const grade = parseInt(cls.replace(/[^0-9]/g, '') || String(fallbackGrade), 10);
    return { letter, grade };
}

export function calculateIsoFit(nominal: number, holeClass: string, shaftClass: string): FitResult {
    if (!nominal || isNaN(nominal) || nominal <= 0) nominal = 1;
    const h = parseClass(holeClass || 'H7', 'H', 7);
    const s = parseClass(shaftClass || 'g6', 'g', 6);
    const r = calculateFit(nominal, h.letter, h.grade, s.letter, s.grade);
    return {
        hole: { ES: r.holeES / 1000, EI: r.holeEI / 1000, tol: r.holeTol, class: `${h.letter}${h.grade}` },
        shaft: { es: r.shaft_es / 1000, ei: r.shaft_ei / 1000, tol: r.shaftTol, class: `${s.letter}${s.grade}` },
        fit: { type: r.fitType, maxClearance: r.maxClearance, minClearance: r.minClearance },
        warnings: r.warnings,
    };
}

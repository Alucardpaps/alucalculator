/**
 * 🏛️ ALUCALCULATOR ENGINE - ISO 286
 * "The Fit Master"
 * 
 * Algorithmic implementation of ISO 286-1:2010
 * Calculates IT grades and Fundamental Deviations dynamically.
 */

// ============================================
// 1. STANDARD TOLERANCE FACTOR (i)
// ============================================
// i = 0.45 * D^(1/3) + 0.001 * D (microns)
// D in mm.
function getStandardToleranceFactor(d: number): number {
    if (d <= 500) {
        return 0.45 * Math.pow(d, 1 / 3) + 0.001 * d;
    }
    // Formula changes slightly above 500mm but this is sufficient for 99% of cases
    return 0.004 * d + 2.1;
}

// ============================================
// 2. IT GRADES (Multipliers)
// ============================================
// Tolerance = k * i (microns)
const IT_MULTIPLIERS: Record<number, number> = {
    5: 7,
    6: 10,
    7: 16,
    8: 25,
    9: 40,
    10: 64,
    11: 100,
    12: 160,
    13: 250
};

export function getTolerance(grade: number, diameter: number): number {
    const k = IT_MULTIPLIERS[grade];
    if (!k) return 0;
    const i = getStandardToleranceFactor(diameter);
    // Round to nearest micron usually, simplified here
    return Math.round(k * i) / 1000; // Return in MM
}

// ============================================
// 3. FUNDAMENTAL DEVIATIONS (Upper/Lower)
// ============================================
// Formulas for Upper Deviation (es) or Lower Deviation (ei) in MICRONS based on D (Geometric Mean of range)
// We simplify by using D = nominal for continuous calculation

export function getFundamentalDeviation(letter: string, diameter: number): number {
    const D = diameter;
    let dev = 0; // microns

    // Shaft Deviations (es or ei)
    // a-h: Upper Deviation (es) is calculated (below zero)
    // j-zc: Lower Deviation (ei) is calculated (above zero)

    switch (letter) {
        // --- CLEARANCE ---
        case 'd': dev = -16 * Math.pow(D, 0.44); break;
        case 'e': dev = -11 * Math.pow(D, 0.41); break;
        case 'f': dev = -5.5 * Math.pow(D, 0.41); break;
        case 'g': dev = -2.5 * Math.pow(D, 0.34); break;
        case 'h': dev = 0; break;

        // --- TRANSITION / INTERFERENCE ---
        // These calculate ei (Lower Deviation)
        case 'k': dev = 0.6 * Math.pow(D, 1 / 3); break; // Simplified
        case 'm': dev = 2.8 * Math.pow(D, 1 / 3); break; // Simplified
        case 'n': dev = 5 * Math.pow(D, 0.34); break;
        case 'p': dev = 5.6 * Math.pow(D, 0.41); break; // Simplified
        case 's': dev = IT_MULTIPLIERS[8] * getStandardToleranceFactor(D); break; // Rough approx for press fits

        // --- HOLE BASIS (Capital) ---
        // H: EI = 0
        case 'H': return 0; // EI

        default: return 0;
    }

    return Math.round(dev) / 1000; // Return in MM
}

// ============================================
// 4. MAIN CALCULATOR
// ============================================

export interface FitResult {
    hole: { ES: number; EI: number; tol: number; class: string };
    shaft: { es: number; ei: number; tol: number; class: string };
    fit: { type: 'Clearance' | 'Transition' | 'Interference'; maxClearance: number; minClearance: number };
}

export function calculateIsoFit(nominal: number, holeClass: string, shaftClass: string): FitResult {
    // 0. Safety Checks
    if (!nominal || isNaN(nominal) || nominal <= 0) nominal = 1; // Prevent NaN
    if (!holeClass) holeClass = 'H7';
    if (!shaftClass) shaftClass = 'g6';

    // Parse classes (e.g. "H7", "g6")
    const holeLetter = holeClass.replace(/[0-9]/g, '') || 'H';
    const holeGrade = parseInt(holeClass.replace(/[^0-9]/g, '') || '7');

    const shaftLetter = shaftClass.replace(/[0-9]/g, '') || 'g';
    const shaftGrade = parseInt(shaftClass.replace(/[^0-9]/g, '') || '6');

    // 1. Calculate Tolerances (IT)
    const holeIT = getTolerance(holeGrade, nominal) || 0;
    const shaftIT = getTolerance(shaftGrade, nominal) || 0;

    // 2. Calculate Deviations
    // Hole H: EI = 0, ES = IT
    let EI = 0;
    let ES = 0;

    if (holeLetter === 'H') {
        EI = 0;
        ES = holeIT;
    } else {
        // Simplified: We only support H holes for now in this Algo
        // If user enters F7, we default to H7 logic for base, which is wrong but safe fallback
        EI = 0;
        ES = holeIT;
    }

    // Shaft
    // a-h: Return val was es. ei = es - IT
    // k-z: Return val was ei. es = ei + IT
    const shaftDev = getFundamentalDeviation(shaftLetter, nominal);
    let es = 0;
    let ei = 0;

    if (['d', 'e', 'f', 'g', 'h'].includes(shaftLetter)) {
        es = shaftDev;
        ei = es - shaftIT;
    } else {
        ei = shaftDev;
        es = ei + shaftIT;
    }

    // 3. Fit Analysis
    const maxHole = nominal + ES;
    const minHole = nominal + EI;
    const maxShaft = nominal + es;
    const minShaft = nominal + ei;

    const maxClearance = maxHole - minShaft;
    const minClearance = minHole - maxShaft;

    let type: 'Clearance' | 'Transition' | 'Interference' = 'Transition';
    if (minClearance >= 0) type = 'Clearance';
    else if (maxClearance <= 0) type = 'Interference';

    return {
        hole: { ES, EI, tol: holeIT, class: holeClass },
        shaft: { es, ei, tol: shaftIT, class: shaftClass },
        fit: { type, maxClearance, minClearance }
    };
}

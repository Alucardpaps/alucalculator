/**
 * ISO 286 Fits & Tolerances Engine — table driven (v6)
 * ---------------------------------------------------------------------------
 * Methodology tier: NORMATIVE — ISO 286-1:2010 (Tables 1–3) / ISO 286-2:2010.
 *
 * Why tables and not formulas: ISO 286-2 values are the *rounded* results of
 * the ISO 286-1 formulae plus a set of exceptions. The previous formula engine
 * deviated from the published tables by up to 9 µm (e.g. K7/N7/P7 holes lacked
 * the Δ correction, m-shafts used a wrong formula, j-shafts had the wrong sign,
 * t-shafts were copies of u, IT7 for ≤3 mm gave 8.5 µm instead of 10 µm).
 * Every value below is the tabulated value; regression tests live in
 * src/tests/iso286-tables.test.ts.
 *
 * Scope: nominal sizes 0 < D ≤ 500 mm, IT1–IT18, shafts a–z (+cd, ef, fg, js),
 * holes A–Z (+CD, EF, FG, JS). Units: µm unless stated otherwise.
 */

// Main steps (upper bounds, mm) — used for IT grades and d…p deviations.
export const ISO_STEPS = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];

// Sub-steps (upper bounds, mm) — used for a, b, c and r…z deviations.
const SUB_STEPS = [3, 6, 10, 14, 18, 24, 30, 40, 50, 65, 80, 100, 120, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500];
// Main-step index for each sub-step.
const SUB_TO_MAIN = [0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 11, 12, 12];

// ISO 286-1 Table 1 — standard tolerance grades IT1…IT18 (µm) per main step.
const IT_TABLE: Record<number, number[]> = {
    1: [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
    2: [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
    3: [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
    4: [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
    5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
    6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
    7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
    8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
    9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
    10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
    11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
    13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
    14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
    15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
    16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
    17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
    18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700],
};

type Row = (number | null)[];
const expand = (main: Row): Row => SUB_TO_MAIN.map((m) => main[m]);

// ISO 286-1 Table 2 — upper deviations es of shafts a…h (µm).
const SHAFT_ES: Record<string, Row> = {
    a: [-270, -270, -280, -290, -290, -300, -300, -310, -320, -340, -360, -380, -410, -460, -520, -580, -660, -740, -820, -920, -1050, -1200, -1350, -1500, -1650],
    b: [-140, -140, -150, -150, -150, -160, -160, -170, -180, -190, -200, -220, -240, -260, -280, -310, -340, -380, -420, -480, -540, -600, -680, -760, -840],
    c: [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480],
    cd: expand([-34, -46, -56, null, null, null, null, null, null, null, null, null, null]),
    d: expand([-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230]),
    e: expand([-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135]),
    ef: expand([-10, -14, -18, null, null, null, null, null, null, null, null, null, null]),
    f: expand([-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68]),
    fg: expand([-4, -6, -8, null, null, null, null, null, null, null, null, null, null]),
    g: expand([-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20]),
    h: expand([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
};

// j-shafts: lower deviation ei by grade (µm).
const SHAFT_J_EI: Record<number, Row> = {
    5: expand([-2, -2, -2, -3, -4, -5, -7, -9, -11, -13, -16, -18, -20]),
    6: expand([-2, -2, -2, -3, -4, -5, -7, -9, -11, -13, -16, -18, -20]),
    7: expand([-4, -4, -5, -6, -8, -10, -12, -15, -18, -21, -26, -28, -32]),
    8: expand([-6, null, null, null, null, null, null, null, null, null, null, null, null]),
};

// ISO 286-1 Table 3 — lower deviations ei of shafts k…z (µm).
const K_EI_IT4_7 = expand([0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5]);
const SHAFT_EI: Record<string, Row> = {
    m: expand([2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23]),
    n: expand([4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40]),
    p: expand([6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68]),
    r: [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132],
    s: [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252],
    t: [null, null, null, null, null, null, 41, 48, 54, 66, 75, 91, 104, 122, 134, 146, 166, 180, 196, 218, 240, 268, 294, 330, 360],
    u: [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540],
    v: [null, null, null, null, 39, 47, 55, 68, 81, 102, 120, 146, 172, 202, 228, 252, 284, 310, 340, 385, 425, 475, 530, 595, 660],
    x: [20, 28, 34, 40, 45, 54, 64, 80, 97, 122, 146, 178, 210, 248, 280, 310, 350, 385, 425, 475, 525, 590, 660, 740, 820],
    y: [null, null, null, null, null, 63, 75, 94, 114, 144, 174, 214, 254, 300, 340, 380, 425, 470, 520, 580, 650, 730, 820, 920, 1000],
    z: [26, 35, 42, 50, 60, 73, 88, 112, 136, 172, 210, 258, 310, 365, 415, 465, 520, 575, 640, 710, 790, 900, 1000, 1100, 1250],
};

// J-holes: upper deviation ES by grade (µm).
const HOLE_J_ES: Record<number, Row> = {
    6: expand([2, 5, 5, 6, 8, 10, 13, 16, 18, 22, 25, 29, 33]),
    7: expand([4, 6, 8, 10, 12, 14, 18, 22, 26, 30, 36, 39, 43]),
    8: expand([6, 10, 12, 15, 20, 24, 28, 34, 41, 47, 55, 60, 66]),
};

export const ISO286_MAX_NOMINAL_MM = 500;

function subIndex(nominal: number): number {
    if (!(nominal > 0)) return 0;
    for (let i = 0; i < SUB_STEPS.length; i++) if (nominal <= SUB_STEPS[i]) return i;
    return SUB_STEPS.length - 1; // clamped; callers flag out-of-range
}

function mainIndex(nominal: number): number {
    return SUB_TO_MAIN[subIndex(nominal)];
}

/** Standard tolerance ITn in µm (ISO 286-1 Table 1). */
export function calculateIT(nominal: number, grade: number): number {
    const row = IT_TABLE[Math.round(grade)];
    if (!row) return NaN;
    return row[mainIndex(nominal)];
}

/** Δ = ITn − IT(n−1) for hole classes K…ZC (only for IT3…IT8 and D > 3 mm). */
function delta(nominal: number, grade: number): number {
    if (nominal <= 3 || grade < 3 || grade > 8) return 0;
    return calculateIT(nominal, grade) - calculateIT(nominal, grade - 1);
}

export interface Deviation {
    upper: number; // es / ES, µm
    lower: number; // ei / EI, µm
    supported: boolean;
    note?: string;
}

const unsupported = (it: number, note: string): Deviation => ({ upper: it, lower: 0, supported: false, note });
/** Normalise −0 to 0 so equality checks and "+0"/"-0" labels behave. */
const nz = (v: number) => (v === 0 ? 0 : v);
const dev = (upper: number, lower: number): Deviation => ({ upper: nz(upper), lower: nz(lower), supported: true });

/** Shaft limit deviations es/ei (µm). */
export function shaftDeviations(nominal: number, letter: string, grade: number): Deviation {
    const l = letter.toLowerCase();
    const it = calculateIT(nominal, grade);
    const si = subIndex(nominal);
    if (!Number.isFinite(it)) return unsupported(0, `IT${grade} is not a standard grade`);

    if (l === 'js') return dev(it / 2, -it / 2);
    if (SHAFT_ES[l]) {
        const es = SHAFT_ES[l][si];
        if (es == null) return unsupported(-it, `${l} is only defined up to 10 mm`);
        return dev(es, es - it);
    }
    if (l === 'j') {
        const row = SHAFT_J_EI[grade];
        const ei = row?.[si];
        if (ei == null) return unsupported(it, `j${grade} is not tabulated in ISO 286-2`);
        return dev(ei + it, ei);
    }
    if (l === 'k') {
        const ei = grade >= 4 && grade <= 7 ? (K_EI_IT4_7[si] as number) : 0;
        return dev(ei + it, ei);
    }
    if (SHAFT_EI[l]) {
        const ei = SHAFT_EI[l][si];
        if (ei == null) return unsupported(it, `${l} is not defined for Ø${nominal} mm (ISO 286-1 Table 3)`);
        return dev(ei + it, ei);
    }
    return unsupported(it, `Unknown shaft class "${letter}"`);
}

/** Hole limit deviations ES/EI (µm). */
export function holeDeviations(nominal: number, letter: string, grade: number): Deviation {
    const L = letter.toUpperCase();
    const l = L.toLowerCase();
    const it = calculateIT(nominal, grade);
    const si = subIndex(nominal);
    if (!Number.isFinite(it)) return unsupported(0, `IT${grade} is not a standard grade`);

    if (L === 'JS') return dev(it / 2, -it / 2);
    // A…H: EI = −es (mirror of the shaft)
    if (SHAFT_ES[l]) {
        const es = SHAFT_ES[l][si];
        if (es == null) return unsupported(it, `${L} is only defined up to 10 mm`);
        const EI = -es;
        return dev(EI + it, EI);
    }
    if (L === 'J') {
        const ES = HOLE_J_ES[grade]?.[si];
        if (ES == null) return unsupported(it, `J${grade} is not tabulated in ISO 286-2`);
        return dev(ES, ES - it);
    }
    if (L === 'K') {
        // ES = −ei(k) + Δ for ≤ IT8; ES = 0 above IT8 (and always 0 for ≤ 3 mm)
        const ES = nominal <= 3 ? 0 : grade <= 8 ? -(K_EI_IT4_7[si] as number) + delta(nominal, grade) : 0;
        return dev(ES, ES - it);
    }
    if (L === 'M') {
        const ei = SHAFT_EI.m[si] as number;
        const ES = grade <= 8 ? -ei + delta(nominal, grade) : -ei;
        return dev(ES, ES - it);
    }
    if (L === 'N') {
        const ei = SHAFT_EI.n[si] as number;
        const ES = nominal <= 3 ? -ei : grade <= 8 ? -ei + delta(nominal, grade) : 0;
        return dev(ES, ES - it);
    }
    if (SHAFT_EI[l]) {
        // P…ZC: ES = −ei + Δ for ≤ IT7, ES = −ei above IT7
        const ei = SHAFT_EI[l][si];
        if (ei == null) return unsupported(it, `${L} is not defined for Ø${nominal} mm (ISO 286-1 Table 3)`);
        const ES = -ei + (grade <= 7 ? delta(nominal, grade) : 0);
        return dev(ES, ES - it);
    }
    return unsupported(it, `Unknown hole class "${letter}"`);
}

/**
 * Fundamental deviation (µm): the limit deviation nearest to the zero line.
 * Shafts a–h → es, j–z → ei; holes A–H → EI, J–Z → ES; js/JS → 0.
 */
export function getFundamentalDeviation(nominal: number, letter: string, grade: number, isHole: boolean): number {
    const l = letter.toLowerCase();
    if (l === 'js') return 0;
    if (isHole) {
        const d = holeDeviations(nominal, letter, grade);
        return SHAFT_ES[l] ? d.lower : d.upper;
    }
    const d = shaftDeviations(nominal, letter, grade);
    return SHAFT_ES[l] ? d.upper : d.lower;
}

export type FitType = 'Clearance' | 'Transition' | 'Interference';

export function calculateFit(nominal: number, holeClass: string, holeGrade: number, shaftClass: string, shaftGrade: number) {
    const hole = holeDeviations(nominal, holeClass, holeGrade);
    const shaft = shaftDeviations(nominal, shaftClass, shaftGrade);
    const warnings: string[] = [];
    if (nominal > ISO286_MAX_NOMINAL_MM) warnings.push(`ISO 286-2 tables in this engine cover 1–${ISO286_MAX_NOMINAL_MM} mm; Ø${nominal} mm was evaluated with the 450–500 mm step.`);
    if (!hole.supported && hole.note) warnings.push(hole.note);
    if (!shaft.supported && shaft.note) warnings.push(shaft.note);

    const holeES = hole.upper;
    const holeEI = hole.lower;
    const shaft_es = shaft.upper;
    const shaft_ei = shaft.lower;

    // Work in µm to avoid floating noise, then convert.
    const maxClearanceUm = Math.round((holeES - shaft_ei) * 10) / 10;
    const minClearanceUm = Math.round((holeEI - shaft_es) * 10) / 10;

    let fitType: FitType = 'Transition';
    if (minClearanceUm >= 0) fitType = 'Clearance';
    if (maxClearanceUm <= 0) fitType = 'Interference';

    const mm = (v: number) => Math.round(v * 1e6) / 1e6;

    return {
        nominalDia: nominal,
        nominal,
        holeMax: mm(nominal + holeES / 1000),
        holeMin: mm(nominal + holeEI / 1000),
        shaftMax: mm(nominal + shaft_es / 1000),
        shaftMin: mm(nominal + shaft_ei / 1000),
        holeTol: (holeES - holeEI) / 1000,
        shaftTol: (shaft_es - shaft_ei) / 1000,
        maxClearance: maxClearanceUm / 1000,
        minClearance: minClearanceUm / 1000,
        maxClearanceUm,
        minClearanceUm,
        fitType,
        holeES,
        holeEI,
        shaft_es,
        shaft_ei,
        isSupported: hole.supported && shaft.supported && nominal <= ISO286_MAX_NOMINAL_MM,
        warnings,
        standard: 'ISO 286-1:2010 / ISO 286-2:2010',
    };
}

/** Parse "H7/g6" → calculateFit. */
export function calculateFitFromString(nominal: number, fit: string) {
    const m = fit.replace(/\s+/g, '').match(/^([A-Za-z]{1,2})(\d{1,2})\/([A-Za-z]{1,2})(\d{1,2})$/);
    if (!m) throw new Error(`Invalid fit designation "${fit}" (expected e.g. H7/g6)`);
    return calculateFit(nominal, m[1], parseInt(m[2], 10), m[3], parseInt(m[4], 10));
}

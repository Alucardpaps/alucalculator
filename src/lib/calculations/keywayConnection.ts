/**
 * DIN 6885-1 / ISO 3912 Parallel Key Connection Calculation Engine
 * Strength check per DIN 6892:2012 Method C (simplified):
 *   p = 2·T·K_A / (d · h' · l_tr · i · φ),  hub h' = h − t1 − s,  shaft h' = t1 − s  (s = key chamfer)
 *   φ = 1 (one key), 0.75 (two keys at 180°)
 * 
 * Computes:
 * - Standard key dimensions according to shaft diameter (DIN 6885-1)
 * - Hub surface contact pressure (p_hub)
 * - Shaft surface contact pressure (p_shaft)
 * - Key shear stress (tau)
 * - Safety factors (S_hub, S_shaft, S_shear)
 * - Maximum allowable transmissible torque (T_max)
 * - Minimum required key length (l_min)
 */

export interface KeywayStandardEntry {
    minDia: number;
    maxDia: number;
    b: number;      // Key width (mm)
    h: number;      // Key height (mm)
    t1: number;     // Shaft keyway depth (mm)
    t2: number;     // Hub keyway depth (mm)
    r: number;      // Chamfer / radius (mm)
}

export const DIN_6885_TABLE: KeywayStandardEntry[] = [
    { minDia: 6,   maxDia: 8,   b: 2,  h: 2,  t1: 1.2,  t2: 1.0,  r: 0.16 },
    { minDia: 8,   maxDia: 10,  b: 3,  h: 3,  t1: 1.8,  t2: 1.4,  r: 0.16 },
    { minDia: 10,  maxDia: 12,  b: 4,  h: 4,  t1: 2.5,  t2: 1.8,  r: 0.16 },
    { minDia: 12,  maxDia: 17,  b: 5,  h: 5,  t1: 3.0,  t2: 2.3,  r: 0.25 },
    { minDia: 17,  maxDia: 22,  b: 6,  h: 6,  t1: 3.5,  t2: 2.8,  r: 0.40 },
    { minDia: 22,  maxDia: 30,  b: 8,  h: 7,  t1: 4.0,  t2: 3.3,  r: 0.40 },
    { minDia: 30,  maxDia: 38,  b: 10, h: 8,  t1: 5.0,  t2: 3.3,  r: 0.40 },
    { minDia: 38,  maxDia: 44,  b: 12, h: 8,  t1: 5.0,  t2: 3.3,  r: 0.60 },
    { minDia: 44,  maxDia: 50,  b: 14, h: 9,  t1: 5.5,  t2: 3.8,  r: 0.60 },
    { minDia: 50,  maxDia: 58,  b: 16, h: 10, t1: 6.0,  t2: 4.3,  r: 0.60 },
    { minDia: 58,  maxDia: 65,  b: 18, h: 11, t1: 7.0,  t2: 4.4,  r: 0.60 },
    { minDia: 65,  maxDia: 75,  b: 20, h: 12, t1: 7.5,  t2: 4.9,  r: 1.00 },
    { minDia: 75,  maxDia: 85,  b: 22, h: 14, t1: 9.0,  t2: 5.4,  r: 1.00 },
    { minDia: 85,  maxDia: 95,  b: 25, h: 14, t1: 9.0,  t2: 5.4,  r: 1.00 },
    { minDia: 95,  maxDia: 110, b: 28, h: 16, t1: 10.0, t2: 6.4,  r: 1.00 },
    { minDia: 110, maxDia: 130, b: 32, h: 18, t1: 11.0, t2: 7.4,  r: 1.20 },
    { minDia: 130, maxDia: 150, b: 36, h: 20, t1: 12.0, t2: 8.4,  r: 1.20 },
    { minDia: 150, maxDia: 170, b: 40, h: 22, t1: 13.0, t2: 9.4,  r: 1.60 },
    { minDia: 170, maxDia: 200, b: 45, h: 25, t1: 15.0, t2: 10.4, r: 1.60 },
    { minDia: 200, maxDia: 230, b: 50, h: 28, t1: 17.0, t2: 11.4, r: 1.60 },
];

export interface KeywayMaterial {
    id: string;
    name: string;
    p_adm: number;     // Allowable surface pressure (MPa / N/mm^2)
    tau_adm: number;   // Allowable shear stress (MPa / N/mm^2)
}

export const KEYWAY_MATERIALS: Record<string, KeywayMaterial> = {
    'c45': {
        id: 'c45',
        name: 'Karbon Çeliği C45 / 1.0503 (Standart Kama Çeliği)',
        p_adm: 120,
        tau_adm: 90
    },
    '42crmo4': {
        id: '42crmo4',
        name: 'Islah Çeliği 42CrMo4 / 1.7225 (Yüksek Dayanımlı)',
        p_adm: 180,
        tau_adm: 130
    },
    's275': {
        id: 's275',
        name: 'Yapı Çeliği S275 / St 44 (Genel İmalat)',
        p_adm: 90,
        tau_adm: 70
    },
    's355': {
        id: 's355',
        name: 'Yapı Çeliği S355 / St 52',
        p_adm: 110,
        tau_adm: 85
    },
    'gg25': {
        id: 'gg25',
        name: 'Pik Döküm GG-25 / EN-GJL-250 (Dökme Gövde/Göbek)',
        p_adm: 60,
        tau_adm: 45
    },
    'ggg40': {
        id: 'ggg40',
        name: 'Sfero Döküm GGG-40 / EN-GJS-400 (Darbe Dayanımlı)',
        p_adm: 95,
        tau_adm: 70
    },
    'al6061': {
        id: 'al6061',
        name: 'Alüminyum 6061-T6 (Hafif Yapı Göbeği)',
        p_adm: 50,
        tau_adm: 40
    }
};

export type KeyForm = 'A' | 'B';

export interface KeywayCalculationInput {
    shaftDiameter: number;      // mm
    keyLength: number;          // mm
    keyCount: 1 | 2;            // Number of keys (1 or 2 at 120°/180°)
    keyForm: KeyForm;           // 'A' (round ends) or 'B' (straight ends)
    torque: number;             // N·m (Operating torque)
    serviceFactor: number;      // K_A (1.0 = uniform, 1.25 = light shock, 1.5 = moderate, 2.0 = heavy)
    hubMaterialId: string;
    shaftMaterialId: string;
    keyMaterialId: string;
    customDimensions?: {
        b?: number;
        h?: number;
        t1?: number;
        t2?: number;
    };
}

export interface KeywayCalculationResult {
    standardEntry: KeywayStandardEntry;
    b: number;                  // Width (mm)
    h: number;                  // Height (mm)
    t1: number;                 // Shaft keyway depth (mm)
    t2: number;                 // Hub keyway depth (mm)
    r: number;                  // Radius/chamfer (mm)
    effectiveLength: number;    // l_e (mm)
    effectiveKeyFactor: number; // i·φ — 1.0 for 1 key, 1.5 for 2 keys (DIN 6892)
    tangentialForce: number;    // F_t (N)
    pHub: number;               // Hub contact pressure (MPa)
    pShaft: number;             // Shaft contact pressure (MPa)
    tauKey: number;             // Key shear stress (MPa)
    allowablePHub: number;      // MPa
    allowablePShaft: number;    // MPa
    allowableTauKey: number;    // MPa
    safetyFactorHub: number;
    safetyFactorShaft: number;
    safetyFactorShear: number;
    minSafetyFactor: number;
    isSafe: boolean;
    maxTransmissibleTorque: number; // N·m
    minKeyLength: number;       // mm (required length to satisfy minimum safety factor 1.0)
    contactHeightShaft: number; // t1 − s (mm)
    contactHeightHub: number;   // h − t1 − s (mm)
}

/**
 * Returns standard DIN 6885-1 dimensions based on shaft diameter
 */
export function getStandardKeywayDimensions(shaftDiameter: number): KeywayStandardEntry {
    const entry = DIN_6885_TABLE.find(
        row => shaftDiameter > row.minDia && shaftDiameter <= row.maxDia
    );

    if (entry) return entry;

    // Fallback for smaller than 6mm or larger than 230mm
    if (shaftDiameter <= 6) {
        return DIN_6885_TABLE[0];
    }

    const last = DIN_6885_TABLE[DIN_6885_TABLE.length - 1];
    // Approximation for very large shafts > 230mm
    const b = Math.round(shaftDiameter * 0.25);
    const h = Math.round(shaftDiameter * 0.15);
    const t1 = Math.round(h * 0.6);
    const t2 = h - t1;
    return {
        minDia: 230,
        maxDia: 1000,
        b,
        h,
        t1,
        t2,
        r: 2.5
    };
}

/**
 * Performs full DIN 6885-1 engineering strength calculation
 */
export function calculateKeywayConnection(input: KeywayCalculationInput): KeywayCalculationResult {
    const std = getStandardKeywayDimensions(input.shaftDiameter);

    const b = input.customDimensions?.b ?? std.b;
    const h = input.customDimensions?.h ?? std.h;
    const t1 = input.customDimensions?.t1 ?? std.t1;
    const t2 = input.customDimensions?.t2 ?? std.t2;
    const r = std.r;

    // Effective length: Form A has round ends of diameter b, so l_e = l - b
    // Form B has straight ends, so l_e = l
    const effectiveLength = input.keyForm === 'A' 
        ? Math.max(1, input.keyLength - b) 
        : Math.max(1, input.keyLength);

    // Multi-key load sharing (DIN 6892): i·φ = 1 · 1.0 or 2 · 0.75
    const effectiveKeyFactor = input.keyCount === 2 ? 1.5 : 1.0;

    // Tangential force: F_t = 2 * T / d (T in N·mm -> T_Nm * 1000)
    // F_t = (2 * T * 1000) / d [N]
    const d = Math.max(1, input.shaftDiameter);
    const tangentialForce = (2000 * Math.abs(input.torque)) / d;

    // Total design force considering application service factor K_A
    const designForce = (tangentialForce * input.serviceFactor) / effectiveKeyFactor;

    // Load-bearing heights (DIN 6892): key chamfer s ≈ r of DIN 6885 is not load-bearing
    const contactHeightHub = Math.max(0.1, h - t1 - r);
    const contactHeightShaft = Math.max(0.1, t1 - r);

    // Contact surface pressures:
    // p_hub = F_design / ((h − t1 − s) · l_tr)
    // p_shaft = F_design / ((t1 − s) · l_tr)
    const pHub = designForce / (contactHeightHub * effectiveLength);
    const pShaft = designForce / (contactHeightShaft * effectiveLength);

    // Key shear stress:
    // tau = F_design / (b * l_e)
    const tauKey = designForce / (b * effectiveLength);

    // Material limits
    const hubMat = KEYWAY_MATERIALS[input.hubMaterialId] ?? KEYWAY_MATERIALS['gg25'];
    const shaftMat = KEYWAY_MATERIALS[input.shaftMaterialId] ?? KEYWAY_MATERIALS['c45'];
    const keyMat = KEYWAY_MATERIALS[input.keyMaterialId] ?? KEYWAY_MATERIALS['c45'];

    const allowablePHub = hubMat.p_adm;
    const allowablePShaft = shaftMat.p_adm;
    const allowableTauKey = keyMat.tau_adm;

    const safetyFactorHub = allowablePHub / Math.max(0.001, pHub);
    const safetyFactorShaft = allowablePShaft / Math.max(0.001, pShaft);
    const safetyFactorShear = allowableTauKey / Math.max(0.001, tauKey);

    const minSafetyFactor = Math.min(safetyFactorHub, safetyFactorShaft, safetyFactorShear);
    const isSafe = minSafetyFactor >= 1.0;

    // Maximum transmissible torque based on the weakest element:
    const tMaxHub = (allowablePHub * contactHeightHub * effectiveLength * d * effectiveKeyFactor) / (2000 * input.serviceFactor);
    const tMaxShaft = (allowablePShaft * contactHeightShaft * effectiveLength * d * effectiveKeyFactor) / (2000 * input.serviceFactor);
    const tMaxShear = (allowableTauKey * b * effectiveLength * d * effectiveKeyFactor) / (2000 * input.serviceFactor);

    const maxTransmissibleTorque = Math.min(tMaxHub, tMaxShaft, tMaxShear);

    // Minimum required key length to achieve safety factor >= 1.0:
    const forceUnitLength = (tangentialForce * input.serviceFactor) / effectiveKeyFactor;
    const l_e_min_hub = forceUnitLength / (allowablePHub * contactHeightHub);
    const l_e_min_shaft = forceUnitLength / (allowablePShaft * contactHeightShaft);
    const l_e_min_shear = forceUnitLength / (allowableTauKey * b);
    const l_e_min = Math.max(l_e_min_hub, l_e_min_shaft, l_e_min_shear);

    const minKeyLength = input.keyForm === 'A' ? Math.ceil(l_e_min + b) : Math.ceil(l_e_min);

    return {
        standardEntry: std,
        b,
        h,
        t1,
        t2,
        r,
        effectiveLength,
        effectiveKeyFactor,
        tangentialForce,
        pHub,
        pShaft,
        tauKey,
        allowablePHub,
        allowablePShaft,
        allowableTauKey,
        safetyFactorHub,
        safetyFactorShaft,
        safetyFactorShear,
        minSafetyFactor,
        isSafe,
        maxTransmissibleTorque,
        minKeyLength,
        contactHeightShaft,
        contactHeightHub
    };
}

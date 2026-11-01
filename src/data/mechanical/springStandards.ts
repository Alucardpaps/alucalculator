/**
 * DIN EN 13906-1 / DIN 2089 Helical Compression Springs Standards & Calculations
 */

export type SpringKind = 'compression' | 'extension';
export type SpringHookType = 'german' | 'extended_german' | 'english' | 'plain';
export type SpringEndType = 'squared_ground' | 'squared_unground' | 'plain_open';
export type SpringToleranceGrade = 1 | 2 | 3;
export type SpringWindingDirection = 'right' | 'left';

export interface SpringMaterial {
    id: string;
    nameEn: string;
    nameTr: string;
    standard: string;
    G: number; // Shear Modulus (MPa) at 20°C
    E: number; // Young's Modulus (MPa)
    density: number; // kg/mm^3 (e.g. 7.85e-6 for steel)
    // Tensile strength Rm parameters: Rm = A / (d^m) in MPa
    A: number;
    m: number;
    defaultTorsionRatio: number; // tau_zul / Rm (typically 0.56 for static)
    maxSolidTorsionRatio: number; // tau_czul / Rm (typically 0.85 for solid)
    tauO_ratio: number; // Torsional fatigue endurance ratio tau_O / Rm (typically 0.28 unpeened, 0.35 peened)
    tempCoeffG: number; // 1/K (approx 2.5e-4 for steel)
    maxTemp: number; // Max service temp in °C
    description: string;
}

export const SPRING_MATERIALS: Record<string, SpringMaterial> = {
    'en10270-1-sh': {
        id: 'en10270-1-sh',
        nameEn: 'Cold Drawn Spring Steel (EN 10270-1 SH)',
        nameTr: 'Soğuk Çekme Yay Çeliği (EN 10270-1 SH)',
        standard: 'EN 10270-1',
        G: 81500,
        E: 206000,
        density: 7.85e-6,
        A: 1780,
        m: 0.145,
        defaultTorsionRatio: 0.56,
        maxSolidTorsionRatio: 0.85,
        tauO_ratio: 0.28,
        tempCoeffG: 2.5e-4,
        maxTemp: 120,
        description: 'Standard patented cold drawn wire for high static & medium dynamic loads.'
    },
    'en10270-1-dh': {
        id: 'en10270-1-dh',
        nameEn: 'High Tensile Drawn Steel (EN 10270-1 DH)',
        nameTr: 'Yüksek Mukavemetli Yay Çeliği (EN 10270-1 DH)',
        standard: 'EN 10270-1',
        G: 81500,
        E: 206000,
        density: 7.85e-6,
        A: 1980,
        m: 0.140,
        defaultTorsionRatio: 0.56,
        maxSolidTorsionRatio: 0.85,
        tauO_ratio: 0.29,
        tempCoeffG: 2.5e-4,
        maxTemp: 120,
        description: 'Extra high tensile spring wire for demanding static compression.'
    },
    'en10270-2-vdsicr': {
        id: 'en10270-2-vdsicr',
        nameEn: 'Oil-Tempered Valve Steel (EN 10270-2 VDSiCr)',
        nameTr: 'Yağda Sertleştirilmiş Supap Çeliği (EN 10270-2 VDSiCr)',
        standard: 'EN 10270-2',
        G: 78500,
        E: 206000,
        density: 7.85e-6,
        A: 2020,
        m: 0.098,
        defaultTorsionRatio: 0.58,
        maxSolidTorsionRatio: 0.88,
        tauO_ratio: 0.35,
        tempCoeffG: 2.5e-4,
        maxTemp: 200,
        description: 'Shaved, high-purity alloyed spring wire for severe high-frequency cyclic fatigue.'
    },
    'en10270-3-14310': {
        id: 'en10270-3-14310',
        nameEn: 'Stainless Spring Steel (EN 10270-3 / 1.4310 - AISI 302)',
        nameTr: 'Paslanmaz Yay Çeliği (EN 10270-3 / 1.4310)',
        standard: 'EN 10270-3',
        G: 73000,
        E: 190000,
        density: 7.90e-6,
        A: 1680,
        m: 0.160,
        defaultTorsionRatio: 0.52,
        maxSolidTorsionRatio: 0.80,
        tauO_ratio: 0.25,
        tempCoeffG: 3.0e-4,
        maxTemp: 250,
        description: 'Corrosion resistant austenitic chromium-nickel wire for food/marine applications.'
    },
    'astm-a228': {
        id: 'astm-a228',
        nameEn: 'Music Wire (ASTM A228)',
        nameTr: 'Piyano Teli (ASTM A228)',
        standard: 'ASTM A228',
        G: 79300,
        E: 207000,
        density: 7.85e-6,
        A: 2216,
        m: 0.145,
        defaultTorsionRatio: 0.55,
        maxSolidTorsionRatio: 0.85,
        tauO_ratio: 0.30,
        tempCoeffG: 2.5e-4,
        maxTemp: 120,
        description: 'Finest quality, high-carbon steel wire for delicate precision instruments.'
    },
    'custom': {
        id: 'custom',
        nameEn: 'Custom / User Defined',
        nameTr: 'Özel / Kullanıcı Tanımlı',
        standard: 'DIN 2089',
        G: 80000,
        E: 206000,
        density: 7.85e-6,
        A: 1800,
        m: 0.14,
        defaultTorsionRatio: 0.56,
        maxSolidTorsionRatio: 0.85,
        tauO_ratio: 0.28,
        tempCoeffG: 2.5e-4,
        maxTemp: 150,
        description: 'User-defined custom material parameters.'
    }
};

export interface SpringInputs {
    springKind?: SpringKind; // 'compression' | 'extension' - Default: 'compression'
    wireDiameter: number; // d in mm
    meanDiameter: number; // D or Dm in mm
    freeLength: number; // L0 in mm
    activeCoils: number; // n or Na
    endType: SpringEndType;
    hookType?: SpringHookType; // 'german' | 'extended_german' | 'english' | 'plain'
    appliedForce1: number; // F1 (preload or working min) in N
    appliedForce2: number; // F2 (maximum working force) in N
    initialTensionForce?: number; // F0 (initial tension force in N for extension springs)
    materialId: string;
    customShearModulus?: number; // G in MPa
    customTensileStrength?: number; // Rm in MPa
    // Advanced Industrial Extensions (DIN EN 13906-1 / DIN EN 15800)
    toleranceGrade?: SpringToleranceGrade; // 1 (Fine), 2 (Standard), 3 (Coarse) - Default: 2
    operatingTemp?: number; // Service temperature in °C - Default: 20
    isShotPeened?: boolean; // Bilyeli dövme / gülleleme - Increases fatigue strength by 25-35%
    windingDirection?: SpringWindingDirection; // 'right' (RH) or 'left' (LH) - Default: 'right'
    housingDiameter?: number; // Dh in mm (Bore/Cylinder clearance check)
    mandrelDiameter?: number; // Dd in mm (Shaft/Guide rod clearance check)
}

export interface SpringOutputs {
    // Diameters
    d: number;
    Dm: number;
    De: number; // Outer diameter
    Di: number; // Inner diameter
    C: number; // Spring index (Dm / d)
    isIndexRecommended: boolean; // 4 <= C <= 12

    // Coils & Lengths
    n: number; // Active coils
    nt: number; // Total coils
    L0: number; // Free length
    Lc: number; // Solid length (blok boyu)
    p: number; // Free pitch (hatve)
    sc: number; // Deflection to solid height
    Fc: number; // Force at solid height
    L1: number; // Length at load F1
    L2: number; // Length at load F2
    F1: number; // Applied preload in N
    F2: number; // Applied max load in N
    s1: number; // Deflection at load F1
    s2: number; // Deflection at load F2
    deltaH: number; // Working stroke (s2 - s1)
    sa: number; // Coil clearance between active coils at F2

    // Mechanics & Stresses
    // Stresses & Mechanics
    R: number; // Spring rate / stiffness (N/mm)
    kw: number; // Wahl / Bergsträsser stress correction factor
    tau0_1: number; // Uncorrected shear stress at F1 (MPa)
    tau0_2: number; // Uncorrected shear stress at F2 (MPa)
    tau1: number; // Corrected shear stress at F1 (MPa)
    tau2: number; // Corrected shear stress at F2 (MPa)
    tauC: number; // Corrected shear stress at solid height (MPa)

    // Material Limits
    Rm: number; // Tensile strength for wire diameter d (MPa)
    tauZul: number; // Permissible static shear stress (MPa)
    tauCZul: number; // Permissible solid shear stress (MPa)
    SF_static: number; // Static safety factor (tauZul / tau2)
    SF_solid: number; // Solid safety factor (tauCZul / tauC)
    isSafeStatic: boolean;
    isSafeSolid: boolean;

    // Goodman Dynamic Fatigue (DIN EN 13906-1 Section 9.2)
    tau_m: number; // Mean shear stress (MPa)
    tau_a: number; // Stress amplitude (MPa)
    tau_O: number; // Base torsional fatigue endurance limit (MPa)
    tau_A_zul: number; // Permissible stress amplitude (Goodman/Smith) (MPa)
    SF_dynamic: number; // Dynamic fatigue safety factor Sh = tau_A_zul / tau_a
    isSafeDynamic: boolean; // SF_dynamic >= 1.20
    fatigueLifeCategory: 'infinite' | 'finite' | 'danger'; // > 10^7 cycles vs finite vs danger
    isShotPeened: boolean;

    // Thermal Derating & Relaxation Risk (DIN EN 13906-1 Section 9.4)
    operatingTemp: number; // Service temperature (°C)
    G_effective: number; // Temperature-derated shear modulus (MPa)
    tempDeratingFactor: number; // Ratio G_effective / G
    relaxationRisk: 'low' | 'moderate' | 'high';

    // Radial Expansion & Enclosure Check (DIN EN 13906-1 Section 9.1)
    deltaDe_2: number; // Outer diameter expansion at working load F2 (mm)
    deltaDe_c: number; // Outer diameter expansion at solid load Fc (mm)
    De_2: number; // Outer diameter under load F2 (mm)
    De_c: number; // Outer diameter at solid height Lc (mm)
    housingDiameter: number | null; // Bore diameter Dh (mm)
    mandrelDiameter: number | null; // Guide rod diameter Dd (mm)
    housingClearance: number | null; // Clearance to housing (Dh - De_c) (mm)
    mandrelClearance: number | null; // Clearance to mandrel (Di - Dd) (mm)
    isHousingOk: boolean | null;
    isMandrelOk: boolean | null;

    // Pitch Angle & Geometry (DIN EN 13906-1)
    pitchAngleDeg: number; // alpha = atan(p / (pi * Dm)) in degrees
    isPitchAngleOk: boolean; // alpha <= 7.5 deg
    windingDirection: SpringWindingDirection;
    endType: SpringEndType;
    springKind: SpringKind;
    hookType: SpringHookType;

    // Extension Springs (DIN EN 13906-2 / DIN 2097)
    Lk: number; // Body length (mm)
    LH: number; // Hook internal height (mm)
    tau0: number; // Initial coiling shear stress (MPa)
    F0: number; // Initial tension force (N)
    kb: number; // Hook curvature stress concentration factor
    sigma_b2: number; // Hook bending stress at F2 (MPa)
    sigma_b_zul: number; // Permissible hook bending stress (MPa)
    tau_t2: number; // Hook root torsional stress (MPa)
    SF_hook: number; // Hook safety factor (sigma_b_zul / sigma_b2)
    SF_body: number; // Body safety factor (tauZul / tau2)
    isHookSafe: boolean; // Hook stress safety verdict
    s_zul: number; // Max permissible deflection (mm)
    F_zul: number; // Max permissible working force (N)

    // DIN EN 15800 (DIN 2095) Manufacturing Tolerances
    toleranceGrade: SpringToleranceGrade; // 1 (Fine), 2 (Standard), 3 (Coarse)
    tol_De: number; // Outer diameter tolerance (+/- mm)
    tol_Di: number; // Inner diameter tolerance (+/- mm)
    tol_L0: number; // Free length tolerance (+/- mm)
    tol_F1: number; // Preload force tolerance (+/- N)
    tol_F2: number; // Working force tolerance (+/- N)
    perpendicularity_e1: number; // Max out-of-squareness e1 (mm)
    parallelism_e2: number; // Max parallelism e2 (mm)

    // Stability & Buckling (DIN EN 13906-1)
    slenderness: number; // lambda = L0 / Dm
    isBucklingRisk: boolean; // lambda > 4
    criticalDeflection: number; // scrit in mm
    requiresMandrel: boolean; // s2 > scrit when lambda > 4

    // Dynamics & Resonance
    resonanceFreq: number; // fe in Hz
    wireLength: number; // Developed wire length in mm
    springMass: number; // Mass in grams

    // Quality verdict
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    warnings: string[];
}

/**
 * Calculates diameter-dependent tensile strength Rm per EN 10270 formulas
 */
export function getMaterialRm(mat: SpringMaterial, d: number, customRm?: number): number {
    if (mat.id === 'custom' && customRm && customRm > 0) {
        return customRm;
    }
    const safeD = Math.max(0.1, d);
    return mat.A / Math.pow(safeD, mat.m);
}

/**
 * Performs full DIN EN 13906-1 / DIN 2089 Helical Spring Calculations
 */
export function calculateHelicalSpring(inputs: SpringInputs): SpringOutputs {
    const springKind: SpringKind = inputs.springKind || 'compression';
    const hookType: SpringHookType = inputs.hookType || 'german';
    const d = Math.max(0.2, inputs.wireDiameter);
    const Dm = Math.max(d * 1.5, inputs.meanDiameter);
    const n = Math.max(1, inputs.activeCoils);
    const endType = inputs.endType || 'squared_ground';
    const F1 = Math.max(0, inputs.appliedForce1);
    const F2 = Math.max(F1, inputs.appliedForce2);
    const toleranceGrade: SpringToleranceGrade = inputs.toleranceGrade || 2;
    const operatingTemp = inputs.operatingTemp ?? 20;
    const isShotPeened = Boolean(inputs.isShotPeened);
    const windingDirection: SpringWindingDirection = inputs.windingDirection || 'right';
    const housingDiameter = (inputs.housingDiameter && inputs.housingDiameter > 0) ? inputs.housingDiameter : null;
    const mandrelDiameter = (inputs.mandrelDiameter && inputs.mandrelDiameter > 0) ? inputs.mandrelDiameter : null;

    const mat = SPRING_MATERIALS[inputs.materialId] || SPRING_MATERIALS['en10270-1-sh'];
    const baseG = (inputs.materialId === 'custom' && inputs.customShearModulus && inputs.customShearModulus > 0)
        ? inputs.customShearModulus
        : mat.G;

    // Thermal Derating on G (DIN EN 13906-1/2 Section 9.4)
    let tempDeratingFactor = 1.0;
    if (operatingTemp > 20) {
        tempDeratingFactor = Math.max(0.65, 1 - mat.tempCoeffG * (operatingTemp - 20));
    }
    const G_effective = baseG * tempDeratingFactor;

    // Relaxation risk level
    let relaxationRisk: 'low' | 'moderate' | 'high' = 'low';
    if (operatingTemp > mat.maxTemp) {
        relaxationRisk = 'high';
    } else if (operatingTemp > 0.75 * mat.maxTemp || operatingTemp >= 80) {
        relaxationRisk = 'moderate';
    }

    const Rm = getMaterialRm(mat, d, inputs.customTensileStrength);

    // 1. Diameters & Spring Index
    const De = Dm + d;
    const Di = Dm - d;
    const C = Dm / d;
    const isIndexRecommended = C >= 4 && C <= 12;

    // Wahl stress correction factor kw (DIN EN 13906-1/2)
    let kw = 1.0;
    if (C > 1.1) {
        kw = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);
    } else {
        kw = 1.6;
    }

    // Hook curvature bending factor kb (DIN EN 13906-2)
    let kb = 1.0;
    if (C > 1.2) {
        kb = ((4 * Math.pow(C, 2) - C - 1) / (4 * C * (C - 1)));
    } else {
        kb = 1.35;
    }

    // Hook internal height LH (DIN EN 13906-2 / DIN 2097)
    let LH = 0;
    if (hookType === 'german') {
        LH = Di * 1.0;
    } else if (hookType === 'extended_german') {
        LH = Di * 1.5;
    } else if (hookType === 'english') {
        LH = Di * 0.8;
    } else {
        LH = 0;
    }

    // Close-coiled body length Lk
    const Lk = (n + 1) * d;

    // Free length L0
    let L0 = Math.max(d * 3, inputs.freeLength);
    if (springKind === 'extension' && (!inputs.freeLength || inputs.freeLength <= Lk)) {
        L0 = Lk + 2 * LH;
    }

    // 2. End Coils & Pitch
    let nt = n;
    let Lc = n * d;
    let p = d;
    let sc = 0;

    if (springKind === 'compression') {
        if (endType === 'squared_ground') {
            nt = n + 2;
            Lc = nt * d;
            p = (L0 - 2 * d) / n;
        } else if (endType === 'squared_unground') {
            nt = n + 1.5;
            Lc = (nt + 1.5) * d;
            p = (L0 - 3 * d) / n;
        } else {
            nt = n;
            Lc = (nt + 1) * d;
            p = (L0 - d) / n;
        }
        sc = Math.max(0, L0 - Lc);
    } else {
        nt = n;
        Lc = Lk;
        p = d;
    }

    // 3. Spring Stiffness (Rate) R with G_effective
    const R = (G_effective * Math.pow(d, 4)) / (8 * Math.pow(Dm, 3) * n);

    // Initial tension for extension springs (DIN EN 13906-2 Section 9.1)
    const tau0_base = Math.max(0.06 * Rm, Math.min(0.18 * Rm, (0.175 - 0.006 * C) * Rm));
    let F0 = 0;
    let tau0 = 0;
    if (springKind === 'extension') {
        if (inputs.initialTensionForce !== undefined && inputs.initialTensionForce >= 0) {
            F0 = inputs.initialTensionForce;
            tau0 = (8 * F0 * Dm) / (Math.PI * Math.pow(d, 3) * kw);
        } else {
            tau0 = tau0_base;
            F0 = (Math.PI * Math.pow(d, 3) * tau0) / (8 * Dm * kw);
        }
    }

    // 4. Deflections & Forces
    let s1 = 0;
    let s2 = 0;
    let L1 = L0;
    let L2 = L0;
    let deltaH = 0;
    let Fc = 0;
    let sa = 0;

    let tauZul = Rm * mat.defaultTorsionRatio;
    let tauCZul = Rm * mat.maxSolidTorsionRatio;
    const sigma_b_zul = Rm * 0.75;
    let sigma_b2 = 0;
    let tau_t2 = 0;
    let SF_hook = 999;
    let SF_body = 999;
    let F_zul = 0;
    let s_zul = 0;

    if (springKind === 'extension') {
        tauZul = Rm * 0.45; // DIN EN 13906-2 Table 1
        tauCZul = tauZul;

        s1 = R > 0 && F1 > F0 ? (F1 - F0) / R : 0;
        s2 = R > 0 && F2 > F0 ? (F2 - F0) / R : 0;
        deltaH = Math.max(0, s2 - s1);
        L1 = L0 + s1;
        L2 = L0 + s2;

        sigma_b2 = kb * (32 * F2 * Dm) / (Math.PI * Math.pow(d, 3));
        tau_t2 = kw * (8 * F2 * Dm) / (Math.PI * Math.pow(d, 3));

        const Fzul_body = (tauZul * Math.PI * Math.pow(d, 3)) / (8 * Dm * kw);
        const Fzul_hook = (sigma_b_zul * Math.PI * Math.pow(d, 3)) / (32 * Dm * kb);
        F_zul = Math.min(Fzul_body, Fzul_hook);
        s_zul = Math.max(0, R > 0 ? (F_zul - F0) / R : 0);

        sc = s_zul;
        Fc = F_zul;
        sa = n > 0 ? s2 / n : 0;
    } else {
        s1 = R > 0 ? F1 / R : 0;
        s2 = R > 0 ? F2 / R : 0;
        deltaH = Math.max(0, s2 - s1);
        L1 = Math.max(Lc, L0 - s1);
        L2 = Math.max(Lc, L0 - s2);
        Fc = R * sc;
        sa = (L2 - Lc) / n;
        F_zul = Fc;
        s_zul = sc;
    }

    // 6. Shear Stresses
    const tauFactor = (8 * Dm) / (Math.PI * Math.pow(d, 3));
    const tau0_1 = F1 * tauFactor;
    const tau0_2 = F2 * tauFactor;
    const tau1 = kw * tau0_1;
    const tau2 = kw * tau0_2;
    const tauC = springKind === 'extension' ? tauZul : kw * Fc * tauFactor;

    if (springKind === 'extension') {
        SF_body = tau2 > 0 ? tauZul / tau2 : 999;
        SF_hook = sigma_b2 > 0 ? sigma_b_zul / sigma_b2 : 999;
    } else {
        SF_body = tau2 > 0 ? tauZul / tau2 : 999;
        SF_hook = 999;
    }
    const SF_static = Math.min(SF_body, SF_hook);
    const SF_solid = springKind === 'extension' ? SF_static : (tauC > 0 ? tauCZul / tauC : 999);
    const isSafeStatic = SF_static >= 1.15;
    const isSafeSolid = SF_solid >= 1.0;

    // 8. Goodman Dynamic Fatigue (DIN EN 13906-1/2)
    const tau_m = (tau1 + tau2) / 2;
    const tau_a = (tau2 - tau1) / 2;
    const f_sp = isShotPeened ? 1.25 : 1.0;
    const extFatigueFactor = springKind === 'extension' ? 0.85 : 1.0;
    const tau_O = mat.tauO_ratio * Rm * f_sp * extFatigueFactor;
    let tau_A_zul = 0;
    if (tau_m < tauZul) {
        tau_A_zul = tau_O * (1 - (tau_m / tauZul));
    }
    const SF_dynamic = tau_a > 0.1 ? tau_A_zul / tau_a : 999;
    const isSafeDynamic = SF_dynamic >= 1.20 && tau2 <= tauZul;

    let fatigueLifeCategory: 'infinite' | 'finite' | 'danger' = 'infinite';
    if (tau2 > tauZul || SF_dynamic < 1.0) {
        fatigueLifeCategory = 'danger';
    } else if (SF_dynamic < 1.20) {
        fatigueLifeCategory = 'finite';
    } else {
        fatigueLifeCategory = 'infinite';
    }

    // 9. Radial Expansion Under Load
    let deltaDe_c = 0;
    let deltaDe_2 = 0;
    let De_2 = De;
    let De_c = De;
    if (springKind === 'compression') {
        deltaDe_c = Math.max(0, (p * p - d * d) / (Math.PI * Math.PI * Dm));
        deltaDe_2 = deltaDe_c * (sc > 0 ? Math.min(1, s2 / sc) : 0);
        De_2 = De + deltaDe_2;
        De_c = De + deltaDe_c;
    }

    const housingClearance = housingDiameter !== null ? housingDiameter - De_c : null;
    const isHousingOk = housingDiameter !== null ? housingClearance! >= 0.5 : null;

    const mandrelClearance = mandrelDiameter !== null ? Di - mandrelDiameter : null;
    const isMandrelOk = mandrelDiameter !== null ? mandrelClearance! >= 0.5 : null;

    // 10. Pitch Angle (DIN EN 13906-1)
    const pitchAngleRad = Math.atan(p / (Math.PI * Dm));
    const pitchAngleDeg = (pitchAngleRad * 180) / Math.PI;
    const isPitchAngleOk = pitchAngleDeg <= 7.5;

    // 11. DIN EN 15800 Manufacturing Tolerances (DIN 2095)
    const gradeFactor = toleranceGrade === 1 ? 0.63 : toleranceGrade === 3 ? 1.6 : 1.0;
    const tol_De = (0.01 * De + 0.1 * d) * gradeFactor;
    const tol_Di = tol_De;
    const tol_L0 = (0.008 * L0 + 0.05 * Dm) * gradeFactor;
    const tol_F1 = (0.02 * F1 + 0.005 * Fc) * gradeFactor;
    const tol_F2 = (0.02 * F2 + 0.005 * Fc) * gradeFactor;
    const perpendicularity_e1 = (0.025 * L0) * gradeFactor;
    const parallelism_e2 = (0.015 * De) * gradeFactor;

    // 12. Buckling Analysis (DIN EN 13906-1, Section 9.3)
    let slenderness = 0;
    let isBucklingRisk = false;
    let criticalDeflection = L0;
    let requiresMandrel = false;

    if (springKind === 'compression') {
        slenderness = Dm > 0 ? L0 / Dm : 0;
        isBucklingRisk = slenderness > 4.0;
        if (isBucklingRisk) {
            const innerVal = 1 - Math.pow(Math.PI / slenderness, 2) * 0.72;
            if (innerVal > 0) {
                criticalDeflection = L0 * (1 - Math.sqrt(innerVal));
                if (s2 > criticalDeflection) {
                    requiresMandrel = true;
                }
            }
        }
    }

    // 13. Natural Resonance Frequency fe (DIN EN 13906-1)
    const rhoSI = (mat.density || 7.85e-6) * 1e9;
    const dMeters = d * 1e-3;
    const DmMeters = Dm * 1e-3;
    const G_Pascals = G_effective * 1e6;
    const waveVelocity = Math.sqrt(G_Pascals / (2 * rhoSI));
    const resonanceFreq = (dMeters / (2 * Math.PI * n * Math.pow(DmMeters, 2))) * waveVelocity;

    // 14. Wire length & Spring mass
    const density = mat.density || 7.85e-6;
    const wireLength = Math.PI * Dm * (springKind === 'extension' ? (nt + 2) : nt);
    const wireVolume = (Math.PI * Math.pow(d, 2) / 4) * wireLength;
    const springMass = wireVolume * density * 1000;

    // Warnings and overall verdict
    const warnings: string[] = [];
    if (!isIndexRecommended) {
        warnings.push(`Yay indeksi C = ${C.toFixed(2)} (Önerilen: 4 ≤ C ≤ 12). C < 4 iç lifte mikroçatlak riskini artırır, C > 12 dolaşma eğilimi yapar.`);
    }
    if (springKind === 'compression') {
        if (!isPitchAngleOk) {
            warnings.push(`Eğim açısı α = ${pitchAngleDeg.toFixed(1)}° (Önerilen: α ≤ 7.5°). Yüksek eğim açısı telde ek eğilme gerilmelerine yol açar.`);
        }
        if (s2 >= sc) {
            warnings.push(`Çalışma sehim değeri (s2 = ${s2.toFixed(1)} mm) blok sehimini (sc = ${sc.toFixed(1)} mm) aşıyor! Yay bloklanacaktır.`);
        }
        if (sa < 0.1 * d && s2 > 0) {
            warnings.push(`Sargılar arası serbest aralık (sa = ${sa.toFixed(2)} mm) kritik seviyede (min 0.1·d = ${(0.1 * d).toFixed(2)} mm).`);
        }
        if (requiresMandrel) {
            warnings.push(`Burkulma Uyarısı: Narinlik oranı (L0/D = ${slenderness.toFixed(1)} > 4) ve s2 > scrit (${criticalDeflection.toFixed(1)} mm). Kılavuz pim/kovan gereklidir.`);
        }
        if (isHousingOk === false) {
            warnings.push(`Kovan Çapı Uyarısı: Blok durumunda dış çap genişlemesi (Dec = ${De_c.toFixed(2)} mm) kovan çapını (${housingDiameter} mm) zorlamaktadır.`);
        }
    } else {
        if (F2 <= F0 && F2 > 0) {
            warnings.push(`Uygulanan azami yük (F2 = ${F2} N), iç ön gerilim kuvvetinin (F0 = ${F0.toFixed(1)} N) altındadır. Sargılar açılmayacaktır.`);
        }
        if (s2 > s_zul) {
            warnings.push(`Çalışma uzaması (s2 = ${s2.toFixed(1)} mm), izin verilen azami açılma sınırını (szul = ${s_zul.toFixed(1)} mm) aşıyor! Kalıcı deformasyon riski.`);
        }
        if (SF_hook < 1.15) {
            warnings.push(`Kanca eğilme gerilmesi (σb2 = ${sigma_b2.toFixed(1)} MPa) emniyet sınırını aşıyor (σb,zul = ${sigma_b_zul.toFixed(1)} MPa, SF_hook = ${SF_hook.toFixed(2)}).`);
        }
    }

    if (!isSafeStatic) {
        warnings.push(`Maksimum gerilme emniyet sınırını aşıyor (SF = ${SF_static.toFixed(2)} < 1.15).`);
    }
    if (operatingTemp > mat.maxTemp) {
        warnings.push(`Çalışma sıcaklığı (${operatingTemp}°C), malzeme azami sıcaklık limitini (${mat.maxTemp}°C) aşıyor! Termal relaksasyon riski çok yüksek.`);
    } else if (relaxationRisk === 'high' || (relaxationRisk === 'moderate' && tau2 / tauZul > 0.85)) {
        warnings.push(`Yüksek sıcaklık (${operatingTemp}°C) ve gerilme nedeniyle DIN EN 13906 relaksasyon (kuvvet kaybı) riski mevcuttur.`);
    }
    if (isMandrelOk === false) {
        warnings.push(`Kılavuz Pim Uyarısı: İç çap (Di = ${Di.toFixed(2)} mm) ile kılavuz mil çapı (${mandrelDiameter} mm) arasındaki boşluk yetersizdir (min 0.5 mm).`);
    }
    if (fatigueLifeCategory === 'danger' && tau_a > 15) {
        warnings.push(`Dinamik Yorulma Uyarısı: Değişken gerilme genliği (τa = ${tau_a.toFixed(1)} MPa) emniyetli Goodman sınırını aşıyor (Sh = ${SF_dynamic.toFixed(2)} < 1.0).`);
    }

    let verdict: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    const isHookSafe = springKind === 'extension' ? SF_hook >= 1.15 : true;
    if (!isSafeStatic || !isHookSafe || (springKind === 'compression' && s2 >= sc) || (springKind === 'extension' && s2 > s_zul * 1.05) || (isHousingOk === false) || (isMandrelOk === false) || (operatingTemp > mat.maxTemp)) {
        verdict = 'FAIL';
    } else if (warnings.length > 0) {
        verdict = 'WARNING';
    }

    return {
        kb,
        isHookSafe,
        d,
        Dm,
        De,
        Di,
        C,
        isIndexRecommended,
        n,
        nt,
        L0,
        Lc,
        p,
        sc,
        Fc,
        L1,
        L2,
        F1,
        F2,
        s1,
        s2,
        deltaH,
        sa,
        R,
        kw,
        tau0_1,
        tau0_2,
        tau1,
        tau2,
        tauC,
        Rm,
        tauZul,
        tauCZul,
        SF_static,
        SF_solid,
        isSafeStatic,
        isSafeSolid,
        tau_m,
        tau_a,
        tau_O,
        tau_A_zul,
        SF_dynamic,
        isSafeDynamic,
        fatigueLifeCategory,
        isShotPeened,
        operatingTemp,
        G_effective,
        tempDeratingFactor,
        relaxationRisk,
        deltaDe_2,
        deltaDe_c,
        De_2,
        De_c,
        housingDiameter,
        mandrelDiameter,
        housingClearance,
        mandrelClearance,
        isHousingOk,
        isMandrelOk,
        pitchAngleDeg,
        isPitchAngleOk,
        windingDirection,
        endType: inputs.endType,
        springKind,
        hookType,
        Lk,
        LH,
        tau0,
        F0,
        sigma_b2,
        sigma_b_zul,
        tau_t2,
        SF_hook,
        SF_body,
        s_zul,
        F_zul,
        toleranceGrade,
        tol_De,
        tol_Di,
        tol_L0,
        tol_F1,
        tol_F2,
        perpendicularity_e1,
        parallelism_e2,
        slenderness,
        isBucklingRisk,
        criticalDeflection,
        requiresMandrel,
        resonanceFreq,
        wireLength,
        springMass,
        verdict,
        warnings
    };
}

/**
 * Standard Industrial Presets
 */
export const SPRING_PRESETS = [
    {
        id: 'precision_return',
        nameEn: 'Precision Instrument Return Spring',
        nameTr: 'Hassas Mekanizma Geri Dönüş Yayı',
        inputs: {
            wireDiameter: 2.0,
            meanDiameter: 16.0,
            freeLength: 55.0,
            activeCoils: 8.5,
            endType: 'squared_ground' as SpringEndType,
            appliedForce1: 25,
            appliedForce2: 85,
            materialId: 'astm-a228',
            toleranceGrade: 1 as SpringToleranceGrade,
            operatingTemp: 20,
            isShotPeened: false,
            windingDirection: 'right' as SpringWindingDirection,
            housingDiameter: 20.0,
            mandrelDiameter: 12.0
        }
    },
    {
        id: 'engine_valve',
        nameEn: 'Engine Valve Spring (High Fatigue)',
        nameTr: 'İçten Yanmalı Motor Supap Yayı',
        inputs: {
            wireDiameter: 4.5,
            meanDiameter: 28.0,
            freeLength: 52.0,
            activeCoils: 5.5,
            endType: 'squared_ground' as SpringEndType,
            appliedForce1: 220,
            appliedForce2: 680,
            materialId: 'en10270-2-vdsicr',
            toleranceGrade: 1 as SpringToleranceGrade,
            operatingTemp: 110,
            isShotPeened: true,
            windingDirection: 'right' as SpringWindingDirection,
            housingDiameter: 35.0,
            mandrelDiameter: 21.0
        }
    },
    {
        id: 'die_heavy',
        nameEn: 'Industrial Press / Die Spring',
        nameTr: 'Kalıp & Pres Ağır Yük Yayı',
        inputs: {
            wireDiameter: 8.0,
            meanDiameter: 42.0,
            freeLength: 90.0,
            activeCoils: 7.0,
            endType: 'squared_ground' as SpringEndType,
            appliedForce1: 600,
            appliedForce2: 2400,
            materialId: 'en10270-1-dh',
            toleranceGrade: 2 as SpringToleranceGrade,
            operatingTemp: 45,
            isShotPeened: true,
            windingDirection: 'right' as SpringWindingDirection,
            housingDiameter: 54.0,
            mandrelDiameter: 31.0
        }
    },
    {
        id: 'stainless_marine',
        nameEn: 'Stainless Corrosion-Resistant Spring',
        nameTr: 'Paslanmaz / Kimyasal Ortam Yayı',
        inputs: {
            wireDiameter: 3.2,
            meanDiameter: 22.0,
            freeLength: 65.0,
            activeCoils: 9.0,
            endType: 'squared_ground' as SpringEndType,
            appliedForce1: 45,
            appliedForce2: 160,
            materialId: 'en10270-3-14310',
            toleranceGrade: 2 as SpringToleranceGrade,
            operatingTemp: 60,
            isShotPeened: false,
            windingDirection: 'left' as SpringWindingDirection,
            housingDiameter: 28.0,
            mandrelDiameter: 16.5
        }
    },
    {
        id: 'tension_precision',
        nameEn: 'Precision Mechanism Tension Spring',
        nameTr: 'Hassas Mekanizma Çekme Yayı',
        inputs: {
            springKind: 'extension' as SpringKind,
            wireDiameter: 1.5,
            meanDiameter: 12.0,
            freeLength: 48.0,
            activeCoils: 18.0,
            endType: 'plain_open' as SpringEndType,
            hookType: 'german' as SpringHookType,
            appliedForce1: 15,
            appliedForce2: 45,
            materialId: 'en10270-1-sh',
            toleranceGrade: 1 as SpringToleranceGrade,
            operatingTemp: 20,
            isShotPeened: false,
            windingDirection: 'right' as SpringWindingDirection
        }
    },
    {
        id: 'tension_return',
        nameEn: 'Automotive Return Extension Spring',
        nameTr: 'Otomotiv Gaz / Fren Geri Dönüş Yayı',
        inputs: {
            springKind: 'extension' as SpringKind,
            wireDiameter: 2.8,
            meanDiameter: 20.0,
            freeLength: 85.0,
            activeCoils: 22.0,
            endType: 'plain_open' as SpringEndType,
            hookType: 'german' as SpringHookType,
            appliedForce1: 60,
            appliedForce2: 190,
            materialId: 'en10270-1-dh',
            toleranceGrade: 2 as SpringToleranceGrade,
            operatingTemp: 40,
            isShotPeened: true,
            windingDirection: 'right' as SpringWindingDirection
        }
    },
    {
        id: 'tension_heavy',
        nameEn: 'Heavy Counterbalance Extension Spring',
        nameTr: 'Kapak / Dengeleme Ağır Çekme Yayı',
        inputs: {
            springKind: 'extension' as SpringKind,
            wireDiameter: 5.0,
            meanDiameter: 35.0,
            freeLength: 140.0,
            activeCoils: 20.0,
            endType: 'plain_open' as SpringEndType,
            hookType: 'extended_german' as SpringHookType,
            appliedForce1: 250,
            appliedForce2: 850,
            materialId: 'en10270-2-vdsicr',
            toleranceGrade: 2 as SpringToleranceGrade,
            operatingTemp: 25,
            isShotPeened: true,
            windingDirection: 'right' as SpringWindingDirection
        }
    }
];

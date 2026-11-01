/**
 * Enhanced Welding Data
 * 
 * Comprehensive welding calculations including:
 * - Joint strength by type
 * - Electrode/filler specifications
 * - Heat input optimization
 * - Preheat requirements
 */

export type WeldJointType = 'fillet' | 'butt' | 'doubleFillet' | 'lap' | 'tee' | 'corner' | 'vGroove' | 'uGroove' | 'jGroove';

export type WeldingProcess = 'mig' | 'tig' | 'smaw' | 'fcaw' | 'saw';

export interface WeldingMethod {
    id: WeldingProcess;
    name: string;
    nameTr: string;
    efficiency: number;
    depositionRate: { min: number; max: number }; // kg/h
    positionCapability: ('flat' | 'horizontal' | 'vertical' | 'overhead')[];
    description: string;
}

export const WELDING_METHODS: Record<WeldingProcess, WeldingMethod> = {
    mig: {
        id: 'mig',
        name: 'MIG/MAG (GMAW)',
        nameTr: 'MIG/MAG',
        efficiency: 0.85,
        depositionRate: { min: 1.5, max: 8.0 },
        positionCapability: ['flat', 'horizontal', 'vertical', 'overhead'],
        description: 'Gas Metal Arc Welding - High productivity, clean welds'
    },
    tig: {
        id: 'tig',
        name: 'TIG (GTAW)',
        nameTr: 'TIG',
        efficiency: 0.65,
        depositionRate: { min: 0.3, max: 1.5 },
        positionCapability: ['flat', 'horizontal', 'vertical', 'overhead'],
        description: 'Gas Tungsten Arc Welding - Precision, high quality'
    },
    smaw: {
        id: 'smaw',
        name: 'Stick (SMAW)',
        nameTr: 'Elektrot',
        efficiency: 0.75,
        depositionRate: { min: 0.8, max: 3.0 },
        positionCapability: ['flat', 'horizontal', 'vertical', 'overhead'],
        description: 'Shielded Metal Arc Welding - Versatile, portable'
    },
    fcaw: {
        id: 'fcaw',
        name: 'Flux Core (FCAW)',
        nameTr: 'Özlü Tel',
        efficiency: 0.88,
        depositionRate: { min: 2.0, max: 10.0 },
        positionCapability: ['flat', 'horizontal', 'vertical'],
        description: 'Flux Cored Arc Welding - High deposition rate'
    },
    saw: {
        id: 'saw',
        name: 'Submerged Arc (SAW)',
        nameTr: 'Toz Altı',
        efficiency: 0.95,
        depositionRate: { min: 5.0, max: 25.0 },
        positionCapability: ['flat'],
        description: 'Submerged Arc Welding - Very high productivity'
    }
};

export interface JointTypeData {
    id: WeldJointType;
    name: string;
    nameTr: string;
    throatFactor: number;      // Effective throat multiplier
    stressConcentration: number; // Kt factor
    jointEfficiency: number;   // % of base metal strength
    icon: string;
    description: string;
}

export const JOINT_TYPES: Record<WeldJointType, JointTypeData> = {
    fillet: {
        id: 'fillet',
        name: 'Fillet Weld',
        nameTr: 'Köşe Kaynağı',
        throatFactor: 0.707,
        stressConcentration: 1.5,
        jointEfficiency: 0.70,
        icon: '◢',
        description: 'Most common weld type, joining perpendicular surfaces'
    },
    doubleFillet: {
        id: 'doubleFillet',
        name: 'Double Fillet',
        nameTr: 'Çift Köşe Kaynağı',
        throatFactor: 0.707,
        stressConcentration: 1.3,
        jointEfficiency: 0.80,
        icon: '◢◣',
        description: 'Both sides welded for increased strength'
    },
    butt: {
        id: 'butt',
        name: 'Butt Weld (Square)',
        nameTr: 'Alın Kaynağı',
        throatFactor: 1.0,
        stressConcentration: 1.2,
        jointEfficiency: 0.90,
        icon: '═',
        description: 'Full penetration joint, highest strength'
    },
    vGroove: {
        id: 'vGroove',
        name: 'V-Groove',
        nameTr: 'V Ağızlı',
        throatFactor: 1.0,
        stressConcentration: 1.1,
        jointEfficiency: 0.95,
        icon: 'V',
        description: 'Beveled edges for full penetration on thick plates'
    },
    uGroove: {
        id: 'uGroove',
        name: 'U-Groove',
        nameTr: 'U Ağızlı',
        throatFactor: 1.0,
        stressConcentration: 1.05,
        jointEfficiency: 0.98,
        icon: 'U',
        description: 'Curved groove for reduced filler metal on very thick plates'
    },
    jGroove: {
        id: 'jGroove',
        name: 'J-Groove',
        nameTr: 'J Ağızlı',
        throatFactor: 1.0,
        stressConcentration: 1.1,
        jointEfficiency: 0.95,
        icon: 'J',
        description: 'Single-side access groove weld'
    },
    lap: {
        id: 'lap',
        name: 'Lap Joint',
        nameTr: 'Bindirme Kaynağı',
        throatFactor: 0.707,
        stressConcentration: 1.8,
        jointEfficiency: 0.60,
        icon: '⊏',
        description: 'Overlapping plates with fillet welds'
    },
    tee: {
        id: 'tee',
        name: 'Tee Joint',
        nameTr: 'T Kaynağı',
        throatFactor: 0.707,
        stressConcentration: 1.6,
        jointEfficiency: 0.75,
        icon: '⊤',
        description: 'Perpendicular plate connection'
    },
    corner: {
        id: 'corner',
        name: 'Corner Joint',
        nameTr: 'Köşe Birleşimi',
        throatFactor: 0.707,
        stressConcentration: 1.7,
        jointEfficiency: 0.65,
        icon: '∟',
        description: 'L-shaped corner connection'
    }
};

// Common electrode specifications
export interface ElectrodeSpec {
    code: string;
    name: string;
    nameTr: string;
    process: WeldingProcess[];
    tensileStrength: number; // MPa
    yieldStrength: number;   // MPa
    elongation: number;      // %
    position: string;
    current: 'AC/DC+' | 'DC+' | 'DC-' | 'AC/DC';
    applications: string;
}

export const ELECTRODE_CATALOG: ElectrodeSpec[] = [
    // SMAW Electrodes
    { code: 'E6010', name: 'Cellulose Sodium', nameTr: 'Selülozik Sodyum', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'DC+', applications: 'Pipe, root passes' },
    { code: 'E6011', name: 'Cellulose Potassium', nameTr: 'Selülozik Potasyum', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'AC/DC+', applications: 'General purpose, AC welders' },
    { code: 'E6013', name: 'Rutile Potassium', nameTr: 'Rutil Potasyum', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'AC/DC', applications: 'Sheet metal, light fabrication' },
    { code: 'E7018', name: 'Iron Powder Low H', nameTr: 'Demir Tozu Düşük H', process: ['smaw'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'AC/DC+', applications: 'Structural steel, pressure vessels' },
    { code: 'E7024', name: 'Iron Powder Titania', nameTr: 'Demir Tozu Titanya', process: ['smaw'], tensileStrength: 490, yieldStrength: 400, elongation: 17, position: 'Flat/Horiz', current: 'AC/DC', applications: 'High deposition flat work' },
    { code: 'E308L-16', name: 'Stainless 308L', nameTr: 'Paslanmaz 308L', process: ['smaw'], tensileStrength: 550, yieldStrength: 350, elongation: 35, position: 'All', current: 'AC/DC+', applications: '304 stainless steel' },
    { code: 'E309L-16', name: 'Stainless 309L', nameTr: 'Paslanmaz 309L', process: ['smaw'], tensileStrength: 550, yieldStrength: 350, elongation: 30, position: 'All', current: 'AC/DC+', applications: 'Dissimilar steel joining' },

    // MIG/GMAW Wires
    { code: 'ER70S-6', name: 'Solid Wire Carbon', nameTr: 'SG2 Gazaltı Teli', process: ['mig'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'DC+', applications: 'General carbon steel' },
    { code: 'ER308L', name: 'Stainless 308L Wire', nameTr: 'Paslanmaz Tel 308L', process: ['mig', 'tig'], tensileStrength: 550, yieldStrength: 350, elongation: 35, position: 'All', current: 'DC+', applications: '304 stainless steel' },
    { code: 'ER4043', name: 'Aluminum Silicon', nameTr: 'Alüminyum Silisyum', process: ['mig', 'tig'], tensileStrength: 165, yieldStrength: 70, elongation: 18, position: 'All', current: 'DC+', applications: '6xxx series aluminum' },
    { code: 'ER5356', name: 'Aluminum Magnesium', nameTr: 'Alüminyum Magnezyum', process: ['mig', 'tig'], tensileStrength: 265, yieldStrength: 150, elongation: 25, position: 'All', current: 'DC+', applications: '5xxx series aluminum' },

    // Flux-cored Wires
    { code: 'E71T-1', name: 'Flux Core Gas Shield', nameTr: 'Gaz Korumalı Özlü Tel', process: ['fcaw'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'DC+', applications: 'Structural steel, shipbuilding' },
    { code: 'E71T-11', name: 'Flux Core Self-Shield', nameTr: 'Açık Saha Özlü Tel', process: ['fcaw'], tensileStrength: 490, yieldStrength: 400, elongation: 20, position: 'All', current: 'DC-', applications: 'Outdoor, windy conditions' },
];

/**
 * Calculate minimum weld size per AWS D1.1
 */
export function getMinWeldSize(thickness: number): number {
    if (thickness <= 6) return 3;
    if (thickness <= 13) return 5;
    if (thickness <= 19) return 6;
    if (thickness <= 38) return 8;
    if (thickness <= 57) return 10;
    if (thickness <= 150) return 13;
    return 16;
}

/**
 * Calculate weld throat area
 */
export function calculateThroatArea(
    jointType: WeldJointType,
    legSize: number,
    length: number,
    thickness?: number
): number {
    const joint = JOINT_TYPES[jointType];

    if (jointType === 'butt' || jointType === 'vGroove' || jointType === 'uGroove' || jointType === 'jGroove') {
        // Full penetration welds use plate thickness
        return (thickness || legSize) * length;
    }

    // Fillet type welds
    const throat = legSize * joint.throatFactor;
    const multiplier = jointType === 'doubleFillet' ? 2 : 1;
    return throat * length * multiplier;
}

/**
 * Calculate weld shear stress
 */
export function calculateWeldStress(
    load: number,        // N
    throatArea: number   // mm²
): number {
    return load / throatArea; // MPa
}

/**
 * Calculate heat input (kJ/mm)
 */
export function calculateHeatInput(
    current: number,     // A
    voltage: number,     // V
    speed: number,       // mm/min
    efficiency: number   // 0-1
): number {
    const speedMmPerSec = speed / 60;
    return (current * voltage * efficiency) / (speedMmPerSec * 1000);
}

/**
 * Evaluate heat input status
 */
export function evaluateHeatInput(heatInput: number, baseMetal: string = 'carbon'): {
    status: 'cold' | 'optimal' | 'hot';
    message: string;
    color: string;
} {
    // General guidelines - varies by material
    let minHeat = 0.5;
    let maxHeat = 2.5;

    if (baseMetal === 'stainless') {
        minHeat = 0.5;
        maxHeat = 1.5; // Lower to prevent sensitization
    } else if (baseMetal === 'aluminum') {
        minHeat = 0.8;
        maxHeat = 3.0; // Higher conductivity needs more heat
    }

    if (heatInput < minHeat) {
        return {
            status: 'cold',
            message: 'Low heat input - risk of lack of fusion',
            color: '#3b82f6'
        };
    } else if (heatInput > maxHeat) {
        return {
            status: 'hot',
            message: 'High heat input - risk of distortion/HAZ issues',
            color: '#ef4444'
        };
    }

    return {
        status: 'optimal',
        message: 'Heat input within recommended range',
        color: '#10b981'
    };
}

/**
 * Calculate preheat temperature requirement
 * Simplified carbon equivalent method
 */
export function calculatePreheat(
    carbonContent: number,      // % C
    thickness: number,          // mm
    manganeseContent: number = 0.8   // % Mn
): { temperature: number; required: boolean; reason: string } {
    // Carbon Equivalent (CE) formula
    const CE = carbonContent + manganeseContent / 6;

    if (CE < 0.4 && thickness < 25) {
        return { temperature: 0, required: false, reason: 'Low CE, thin material' };
    }

    if (CE < 0.45) {
        if (thickness < 25) return { temperature: 0, required: false, reason: 'Low CE' };
        if (thickness < 50) return { temperature: 75, required: true, reason: 'Moderate thickness' };
        return { temperature: 100, required: true, reason: 'Thick material' };
    }

    if (CE < 0.55) {
        if (thickness < 25) return { temperature: 75, required: true, reason: 'Moderate CE' };
        if (thickness < 50) return { temperature: 125, required: true, reason: 'Moderate CE + thickness' };
        return { temperature: 175, required: true, reason: 'High CE + thickness' };
    }

    // High CE
    if (thickness < 25) return { temperature: 125, required: true, reason: 'High CE' };
    if (thickness < 50) return { temperature: 175, required: true, reason: 'High CE + thickness' };
    return { temperature: 225, required: true, reason: 'Very high CE + thickness' };
}

/**
 * Estimate weld filler metal consumption
 */
export function estimateFillerConsumption(
    jointType: WeldJointType,
    legSize: number,       // mm
    length: number,        // mm (total weld length)
    thickness: number,     // mm (for groove welds)
    passes: number = 1
): { volume: number; weight: number } { // mm³ and grams
    let crossSectionArea = 0;

    if (jointType === 'fillet' || jointType === 'lap' || jointType === 'tee' || jointType === 'corner') {
        // Triangle: 0.5 * a * a
        crossSectionArea = 0.5 * legSize * legSize;
    } else if (jointType === 'doubleFillet') {
        crossSectionArea = legSize * legSize; // Two fillets
    } else if (jointType === 'butt') {
        crossSectionArea = thickness * 2; // Root gap + reinforcement
    } else if (jointType === 'vGroove') {
        // V-groove: approximate as triangle
        const grooveAngle = 60; // degrees
        const grooveWidth = thickness * Math.tan((grooveAngle / 2) * Math.PI / 180) * 2;
        crossSectionArea = 0.5 * grooveWidth * thickness + thickness * 3; // + reinforcement
    } else {
        // Default to butt
        crossSectionArea = thickness * 3;
    }

    const volume = crossSectionArea * length * passes;
    const weight = volume * 7.85 / 1000; // Steel density 7.85 g/cm³

    return { volume, weight };
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1 & TIER 2 EXPANSION:
// 1. Base Metal & Aluminum HAZ Catalog (EN 1993-1-8 & EN 1999-1-1 Table 8.1)
// 2. Omni-Style Bidirectional Weld Joint Strength Solver (Transverse, Parallel, U-Weld, Butt)
// 3. Multi-Standard Carbon Equivalent (CE_IIW, CE_AWS, CE_JWES, Pcm) & Preheat
// 4. Welding Cost, Shielding Gas, Wire Feed & Deposition Estimator
// ═══════════════════════════════════════════════════════════════════════════

export interface BaseMetalSpec {
    id: string;
    name: string;
    nameTr: string;
    family: 'carbon_steel' | 'stainless' | 'aluminum';
    standard: string;
    densityGcm3: number;
    fyMPa: number;           // Nominal yield strength
    fuMPa: number;           // Nominal ultimate tensile strength
    rhoHaz: number;          // EN 1999-1-1 HAZ softening factor (1.0 for steel, 0.50-0.80 for heat-treated Al)
    allowTensileMPa: number; // Classical permissible tensile stress σ_t (MPa)
    allowShearMPa: number;   // Classical permissible shear stress τ (MPa)
    recommendedElectrode: string;
    shieldingGas: string;
    shieldingGasTr: string;
}

export const BASE_METALS_CATALOG: BaseMetalSpec[] = [
    {
        id: 's235jr',
        name: 'S235JR Structural Steel',
        nameTr: 'S235JR Yapı Çeliği (St37)',
        family: 'carbon_steel',
        standard: 'EN 10025-2 / EN 1993-1-8',
        densityGcm3: 7.85,
        fyMPa: 235,
        fuMPa: 360,
        rhoHaz: 1.0,
        allowTensileMPa: 140,
        allowShearMPa: 98,
        recommendedElectrode: 'ER70S-6',
        shieldingGas: '82% Ar + 18% CO₂ (M21)',
        shieldingGasTr: '%82 Ar + %18 CO₂ (M21 Karışım)',
    },
    {
        id: 's275jr',
        name: 'S275JR Structural Steel',
        nameTr: 'S275JR Yapı Çeliği (St44)',
        family: 'carbon_steel',
        standard: 'EN 10025-2 / EN 1993-1-8',
        densityGcm3: 7.85,
        fyMPa: 275,
        fuMPa: 430,
        rhoHaz: 1.0,
        allowTensileMPa: 165,
        allowShearMPa: 115,
        recommendedElectrode: 'ER70S-6',
        shieldingGas: '82% Ar + 18% CO₂ (M21)',
        shieldingGasTr: '%82 Ar + %18 CO₂ (M21 Karışım)',
    },
    {
        id: 's355j2',
        name: 'S355J2 High-Strength Steel',
        nameTr: 'S355J2 Yüksek Mukavemetli Çelik (St52)',
        family: 'carbon_steel',
        standard: 'EN 10025-2 / EN 1993-1-8',
        densityGcm3: 7.85,
        fyMPa: 355,
        fuMPa: 510,
        rhoHaz: 1.0,
        allowTensileMPa: 210,
        allowShearMPa: 145,
        recommendedElectrode: 'E7018',
        shieldingGas: '82% Ar + 18% CO₂ (M21)',
        shieldingGasTr: '%82 Ar + %18 CO₂ (M21 Karışım)',
    },
    {
        id: 'astm_a36',
        name: 'ASTM A36 Carbon Steel',
        nameTr: 'ASTM A36 Karbon Çeliği',
        family: 'carbon_steel',
        standard: 'AWS D1.1 / AISC 360',
        densityGcm3: 7.85,
        fyMPa: 250,
        fuMPa: 400,
        rhoHaz: 1.0,
        allowTensileMPa: 150,
        allowShearMPa: 105,
        recommendedElectrode: 'E7018',
        shieldingGas: '75% Ar + 25% CO₂',
        shieldingGasTr: '%75 Ar + %25 CO₂',
    },
    {
        id: 'ss304l',
        name: 'AISI 304L Stainless Steel (1.4307)',
        nameTr: 'AISI 304L Paslanmaz Çelik (1.4307)',
        family: 'stainless',
        standard: 'EN 1993-1-4 / AWS D1.6',
        densityGcm3: 7.93,
        fyMPa: 210,
        fuMPa: 520,
        rhoHaz: 1.0,
        allowTensileMPa: 140,
        allowShearMPa: 95,
        recommendedElectrode: 'ER308L',
        shieldingGas: '98% Ar + 2% CO₂ (M12)',
        shieldingGasTr: '%98 Ar + %2 CO₂ (Paslanmaz M12)',
    },
    {
        id: 'al_6061_t6',
        name: '6061-T6 Aluminum (EN AW-6061)',
        nameTr: '6061-T6 Alüminyum (ITAB Yumuşamalı)',
        family: 'aluminum',
        standard: 'EN 1999-1-1 (EC9) / AWS D1.2',
        densityGcm3: 2.70,
        fyMPa: 275,
        fuMPa: 310,
        rhoHaz: 0.55, // T6 temper loses ~45% strength in HAZ per Eurocode 9 Table 8.1
        allowTensileMPa: 85,
        allowShearMPa: 55,
        recommendedElectrode: 'ER4043',
        shieldingGas: '100% Pure Argon (I1)',
        shieldingGasTr: '%100 Saf Argon (I1)',
    },
    {
        id: 'al_6082_t6',
        name: '6082-T6 Aluminum (EN AW-6082)',
        nameTr: '6082-T6 Yapısal Alüminyum',
        family: 'aluminum',
        standard: 'EN 1999-1-1 (EC9) §8.6',
        densityGcm3: 2.71,
        fyMPa: 260,
        fuMPa: 310,
        rhoHaz: 0.60, // MIG/TIG HAZ softening factor per EN 1999-1-1
        allowTensileMPa: 90,
        allowShearMPa: 60,
        recommendedElectrode: 'ER5356',
        shieldingGas: '100% Pure Argon (I1)',
        shieldingGasTr: '%100 Saf Argon (I1)',
    },
    {
        id: 'al_5083_h116',
        name: '5083-H116 Marine Aluminum',
        nameTr: '5083-H116 Denizcilik Alüminyumu',
        family: 'aluminum',
        standard: 'EN 1999-1-1 (EC9) / ASTM B928',
        densityGcm3: 2.66,
        fyMPa: 228,
        fuMPa: 317,
        rhoHaz: 0.82, // 5xxx strain-hardened retains much higher HAZ strength than 6xxx-T6
        allowTensileMPa: 115,
        allowShearMPa: 76,
        recommendedElectrode: 'ER5356',
        shieldingGas: '100% Pure Argon or Ar/He',
        shieldingGasTr: '%100 Saf Argon veya Ar/He',
    },
    {
        id: 'al_5052_h32',
        name: '5052-H32 Sheet Aluminum',
        nameTr: '5052-H32 Sac Alüminyumu',
        family: 'aluminum',
        standard: 'EN 1999-1-1 / AWS D1.2',
        densityGcm3: 2.68,
        fyMPa: 193,
        fuMPa: 228,
        rhoHaz: 0.80,
        allowTensileMPa: 82,
        allowShearMPa: 54,
        recommendedElectrode: 'ER5356',
        shieldingGas: '100% Pure Argon (I1)',
        shieldingGasTr: '%100 Saf Argon (I1)',
    },
];

export type OmniWeldJointConfig =
    | 'single_transverse'
    | 'double_transverse'
    | 'parallel_lap'
    | 'combined_u_weld'
    | 'single_butt'
    | 'double_butt'
    | 'circular_shaft_fillet';

export type OmniWeldSolveTarget = 'solve_load' | 'solve_length' | 'solve_size';

export interface OmniWeldInput {
    config: OmniWeldJointConfig;
    solveTarget: OmniWeldSolveTarget;
    weldSizeMm: number;            // s (fillet leg size) or t1 (butt throat 1) in mm
    secondThroatMm?: number;       // t2 for double_butt in mm
    length1Mm: number;             // l or l1 (transverse length) in mm
    length2Mm?: number;            // l2 (parallel weld length for combined_u_weld) in mm
    shaftDiameterMm?: number;      // d for circular_shaft_fillet in mm
    allowTensileMPa: number;       // σ_t (maximum permissible tensile stress, MPa)
    allowShearMPa: number;         // τ (maximum permissible shear stress, MPa)
    targetForceKN?: number;        // P_target (kN) when solving for required length or weld size
    includeCraterAllowance?: boolean; // Adds +12.5 mm seam start/stop crater allowance
}

export interface OmniWeldResult {
    maxForceN: number;
    maxForceKN: number;
    maxForceLbf: number;
    throatThicknessMm: number;
    effectiveThroatAreaMm2: number;
    effectiveLengthMm: number;
    totalSeamLengthWithCraterMm: number;
    transverseForceKN: number;
    parallelForceKN: number;
    requiredLengthMm: number;
    requiredLengthWithCraterMm: number;
    requiredWeldSizeMm: number;
    formulaLatex: string;
    substitutedStep: string;
}

/**
 * Tier 1 / Tier 2 Deterministic Weld Joint Strength & Reverse Solver
 * Methodology: Classical Permissible Stress Design (Shigley's Mechanical Engineering Design §9-2 / AWS D1.1 / OmniWelding Equations)
 */
export function calculateOmniWeldStrength(input: OmniWeldInput): OmniWeldResult {
    const s = Math.max(0.5, input.weldSizeMm);
    const t2 = Math.max(0.5, input.secondThroatMm ?? s);
    const l1 = Math.max(1, input.length1Mm);
    const l2 = Math.max(1, input.length2Mm ?? l1);
    const dShaft = Math.max(5, input.shaftDiameterMm ?? 50);
    const sigmaT = Math.max(1, input.allowTensileMPa);
    const tau = Math.max(1, input.allowShearMPa);
    const targetForceN = Math.max(100, (input.targetForceKN ?? 25) * 1000);
    const crater = input.includeCraterAllowance !== false ? 12.5 : 0;

    let throat = 0.707 * s;
    let area = 0;
    let forceN = 0;
    let transN = 0;
    let parN = 0;
    let effLen = l1;
    let reqLen = l1;
    let reqSize = s;
    let formulaLatex = '';
    let substitutedStep = '';

    switch (input.config) {
        case 'single_transverse': {
            throat = 0.707 * s;
            area = throat * l1;
            transN = area * sigmaT;
            forceN = transN;
            effLen = l1;
            reqLen = targetForceN / (0.707 * s * sigmaT);
            reqSize = targetForceN / (0.707 * l1 * sigmaT);
            formulaLatex = 'P = 0.707 \\cdot s \\cdot l \\cdot \\sigma_t';
            substitutedStep = `P = 0.707 × ${s.toFixed(1)} mm × ${l1.toFixed(0)} mm × ${sigmaT.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'double_transverse': {
            throat = 0.707 * s;
            area = 2 * throat * l1;
            transN = area * sigmaT;
            forceN = transN;
            effLen = 2 * l1;
            reqLen = targetForceN / (2 * 0.707 * s * sigmaT);
            reqSize = targetForceN / (2 * 0.707 * l1 * sigmaT);
            formulaLatex = 'P = 2 \\times 0.707 \\cdot s \\cdot l \\cdot \\sigma_t';
            substitutedStep = `P = 2 × 0.707 × ${s.toFixed(1)} mm × ${l1.toFixed(0)} mm × ${sigmaT.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'parallel_lap': {
            throat = 0.707 * s;
            area = 2 * throat * l1;
            parN = area * tau;
            forceN = parN;
            effLen = l1;
            reqLen = targetForceN / (2 * 0.707 * s * tau);
            reqSize = targetForceN / (2 * 0.707 * l1 * tau);
            formulaLatex = 'P = 2 \\times 0.707 \\cdot s \\cdot l \\cdot \\tau,\\quad L_{tot} = l + 12.5\\text{ mm}';
            substitutedStep = `P = 2 × 0.707 × ${s.toFixed(1)} mm × ${l1.toFixed(0)} mm × ${tau.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'combined_u_weld': {
            throat = 0.707 * s;
            transN = 0.707 * s * l1 * sigmaT;
            parN = 2 * 0.707 * s * l2 * tau;
            forceN = transN + parN;
            area = throat * (l1 + 2 * l2);
            effLen = l1 + l2;
            // Given l1 fixed, required l2 for parallel legs:
            const remainingForceN = Math.max(0, targetForceN - transN);
            reqLen = remainingForceN > 0 ? remainingForceN / (2 * 0.707 * s * tau) : 0;
            reqSize = targetForceN / (0.707 * (l1 * sigmaT + 2 * l2 * tau));
            formulaLatex = 'P = 0.707 \\cdot s \\cdot \\sigma_t \\cdot l_1 + 2 \\times 0.707 \\cdot s \\cdot \\tau \\cdot l_2,\\quad L = l_1 + l_2 + 12.5';
            substitutedStep = `P = (0.707×${s}×${sigmaT}×${l1}) + (2×0.707×${s}×${tau}×${l2}) = ${(transN / 1000).toFixed(2)} + ${(parN / 1000).toFixed(2)} = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'single_butt': {
            throat = s;
            area = s * l1;
            transN = area * sigmaT;
            forceN = transN;
            effLen = l1;
            reqLen = targetForceN / (s * sigmaT);
            reqSize = targetForceN / (l1 * sigmaT);
            formulaLatex = 'P = t \\cdot l \\cdot \\sigma_t';
            substitutedStep = `P = ${s.toFixed(1)} mm × ${l1.toFixed(0)} mm × ${sigmaT.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'double_butt': {
            throat = s + t2;
            area = (s + t2) * l1;
            transN = area * sigmaT;
            forceN = transN;
            effLen = l1;
            reqLen = targetForceN / ((s + t2) * sigmaT);
            reqSize = targetForceN / (2 * l1 * sigmaT);
            formulaLatex = 'P = (t_1 + t_2) \\cdot l \\cdot \\sigma_t';
            substitutedStep = `P = (${s.toFixed(1)} + ${t2.toFixed(1)}) mm × ${l1.toFixed(0)} mm × ${sigmaT.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
        case 'circular_shaft_fillet': {
            throat = 0.707 * s;
            const circ = Math.PI * dShaft;
            area = throat * circ;
            parN = area * tau;
            forceN = parN;
            effLen = circ;
            reqLen = targetForceN / (0.707 * s * tau);
            reqSize = targetForceN / (0.707 * circ * tau);
            formulaLatex = 'P = 0.707 \\cdot s \\cdot (\\pi d) \\cdot \\tau';
            substitutedStep = `P = 0.707 × ${s.toFixed(1)} mm × (π × ${dShaft} mm) × ${tau.toFixed(0)} MPa = ${(forceN / 1000).toFixed(2)} kN`;
            break;
        }
    }

    return {
        maxForceN: forceN,
        maxForceKN: forceN / 1000,
        maxForceLbf: forceN * 0.224808943,
        throatThicknessMm: throat,
        effectiveThroatAreaMm2: area,
        effectiveLengthMm: effLen,
        totalSeamLengthWithCraterMm: effLen + crater,
        transverseForceKN: transN / 1000,
        parallelForceKN: parN / 1000,
        requiredLengthMm: reqLen,
        requiredLengthWithCraterMm: reqLen + crater,
        requiredWeldSizeMm: reqSize,
        formulaLatex,
        substitutedStep,
    };
}

export interface CarbonEquivalentInput {
    C: number;
    Mn: number;
    Si: number;
    Cr: number;
    Mo: number;
    V: number;
    Cu: number;
    Ni: number;
    B: number;
    thicknessMm: number;
}

export interface CarbonEquivalentResult {
    ceIIW: number;
    ceAWS: number;
    ceJWES: number;
    pcm: number;
    weldabilityRating: 'Excellent' | 'Good' | 'Fair (Preheat Needed)' | 'Poor (High Cracking Risk)';
    weldabilityRatingTr: string;
    recommendedPreheatC: number;
    recommendedPreheatF: number;
    color: string;
    notesEn: string;
    notesTr: string;
}

export const CEV_STEEL_PRESETS: Array<{
    id: string;
    name: string;
    C: number; Mn: number; Si: number; Cr: number; Mo: number; V: number; Cu: number; Ni: number; B: number;
}> = [
    { id: 's235jr', name: 'S235JR (St37)', C: 0.14, Mn: 0.85, Si: 0.20, Cr: 0.05, Mo: 0.01, V: 0.0, Cu: 0.15, Ni: 0.05, B: 0.0 },
    { id: 's355j2', name: 'S355J2 (St52-3)', C: 0.18, Mn: 1.45, Si: 0.35, Cr: 0.08, Mo: 0.02, V: 0.03, Cu: 0.20, Ni: 0.08, B: 0.0 },
    { id: 'a36', name: 'ASTM A36', C: 0.22, Mn: 0.90, Si: 0.28, Cr: 0.05, Mo: 0.01, V: 0.0, Cu: 0.20, Ni: 0.05, B: 0.0 },
    { id: 'c45', name: 'C45 / AISI 1045 Medium Carbon', C: 0.45, Mn: 0.65, Si: 0.25, Cr: 0.15, Mo: 0.03, V: 0.0, Cu: 0.10, Ni: 0.10, B: 0.0 },
    { id: '4140', name: '42CrMo4 / AISI 4140 Alloy', C: 0.41, Mn: 0.85, Si: 0.25, Cr: 1.05, Mo: 0.22, V: 0.02, Cu: 0.10, Ni: 0.15, B: 0.0 },
    { id: 's690ql', name: 'S690QL High-Yield Quenched', C: 0.16, Mn: 1.35, Si: 0.40, Cr: 0.55, Mo: 0.45, V: 0.06, Cu: 0.15, Ni: 0.80, B: 0.0025 },
];

/**
 * Multi-Standard Carbon Equivalent Calculator (IIW, AWS D1.1, JWES/WES 3001, Ito-Bessyo Pcm)
 */
export function calculateCarbonEquivalentSuite(input: CarbonEquivalentInput): CarbonEquivalentResult {
    const { C, Mn, Si, Cr, Mo, V, Cu, Ni, B, thicknessMm } = input;
    const ceIIW = C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;
    const ceAWS = C + (Mn + Si) / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;
    const ceJWES = C + Si / 24 + Mn / 6 + Ni / 40 + Cr / 5 + Mo / 4 + V / 14;
    const pcm = C + Si / 30 + (Mn + Cu + Cr) / 20 + Ni / 60 + Mo / 15 + V / 10 + 5 * B;

    let rating: CarbonEquivalentResult['weldabilityRating'] = 'Excellent';
    let ratingTr = 'Mükemmel Kaynaklanabilirlik';
    let preheatC = 20;
    let color = '#22c55e';
    let notesEn = 'Low hydrogen-induced cold cracking risk. No preheat needed for thicknesses under 30 mm.';
    let notesTr = 'Soğuk çatlama riski çok düşüktür. 30 mm altı kalınlıklarda ön ısıtma gerekmez.';

    if (ceIIW <= 0.35) {
        rating = 'Excellent';
        ratingTr = 'Mükemmel (CE ≤ 0.35)';
        preheatC = thicknessMm > 35 ? 60 : 20;
        color = '#22c55e';
    } else if (ceIIW <= 0.42) {
        rating = 'Good';
        ratingTr = 'İyi Kaynaklanabilirlik (0.35–0.42)';
        preheatC = thicknessMm > 25 ? 80 : thicknessMm > 15 ? 50 : 20;
        color = '#00e5ff';
        notesEn = 'Good weldability. Use low-hydrogen electrodes (E7018 / G3Si1) and light preheat on plates > 20 mm.';
        notesTr = 'İyi kaynaklanabilirlik. 20 mm üstü plakalarda düşük hidrojenli sarf (E7018 / SG2) ve 50–80°C ön tav önerilir.';
    } else if (ceIIW <= 0.50) {
        rating = 'Fair (Preheat Needed)';
        ratingTr = 'Orta — Ön Isıtma Gerekli (0.42–0.50)';
        preheatC = thicknessMm > 30 ? 175 : thicknessMm > 15 ? 125 : 90;
        color = '#f59e0b';
        notesEn = 'Martensite formation risk in HAZ. Mandatory preheat (90–175°C) and controlled interpass temperature.';
        notesTr = 'ITAB bölgesinde martenzit oluşumu riski. Zorunlu ön ısıtma (90–175°C) ve pasolar arası sıcaklık kontrolü gerekir.';
    } else {
        rating = 'Poor (High Cracking Risk)';
        ratingTr = 'Zor — Yüksek Çatlama Riski (CE > 0.50)';
        preheatC = thicknessMm > 30 ? 280 : thicknessMm > 15 ? 230 : 180;
        color = '#ef4444';
        notesEn = 'High susceptibility to hydrogen cold cracking. Requires 180–300°C preheat, low-H consumables, and post-weld slow cooling / PWHT.';
        notesTr = 'Yüksek hidrojen kaynaklı soğuk çatlama riski! 180–300°C ön ısıtma, düşük hidrojenli sarf ve kaynak sonrası yavaş soğutma / gerilme giderme şarttır.';
    }

    return {
        ceIIW,
        ceAWS,
        ceJWES,
        pcm,
        weldabilityRating: rating,
        weldabilityRatingTr: ratingTr,
        recommendedPreheatC: preheatC,
        recommendedPreheatF: Math.round(preheatC * 1.8 + 32),
        color,
        notesEn,
        notesTr,
    };
}

export interface WeldingCostInput {
    jointType: WeldJointType;
    legSizeMm: number;
    thicknessMm: number;
    weldLengthMm: number;
    densityGcm3: number;
    depositionEfficiency: number; // e.g., 0.85 for MIG, 0.65 for SMAW, 0.92 for TIG
    travelSpeedMmMin: number;
    gasFlowLMin: number;
    currentA: number;
    voltageV: number;
    wirePricePerKg: number;
    gasPricePerL: number;
    laborRatePerHour: number;
    operatorDutyCycle: number;    // 0.25 to 0.70
}

export interface WeldingCostResult {
    crossSectionMm2: number;
    weldVolumeCm3: number;
    depositedMassKg: number;
    requiredFillerMassKg: number;
    arcOnTimeMin: number;
    totalJobTimeMin: number;
    shieldingGasLiters: number;
    electricalEnergyKWh: number;
    fillerCost: number;
    gasCost: number;
    laborCost: number;
    totalCost: number;
}

export function calculateWeldingCostAndGas(input: WeldingCostInput): WeldingCostResult {
    const {
        jointType, legSizeMm, thicknessMm, weldLengthMm, densityGcm3,
        depositionEfficiency, travelSpeedMmMin, gasFlowLMin,
        currentA, voltageV, wirePricePerKg, gasPricePerL, laborRatePerHour, operatorDutyCycle
    } = input;

    let areaMm2 = 0.5 * legSizeMm * legSizeMm;
    if (jointType === 'doubleFillet') {
        areaMm2 = legSizeMm * legSizeMm;
    } else if (jointType === 'butt') {
        areaMm2 = thicknessMm * 2.2;
    } else if (jointType === 'vGroove' || jointType === 'uGroove' || jointType === 'jGroove') {
        const grooveWidth = thicknessMm * Math.tan((60 / 2) * Math.PI / 180) * 2;
        areaMm2 = 0.5 * grooveWidth * thicknessMm + thicknessMm * 2.5;
    }

    const weldVolumeCm3 = (areaMm2 * weldLengthMm) / 1000;
    const depositedMassKg = (weldVolumeCm3 * densityGcm3) / 1000;
    const eff = Math.max(0.4, Math.min(0.99, depositionEfficiency));
    const requiredFillerMassKg = depositedMassKg / eff;

    // Estimate number of passes (assume max ~28 mm² per pass in standard MIG/SMAW)
    const passes = Math.max(1, Math.ceil(areaMm2 / 28));
    const totalPassLengthMm = weldLengthMm * passes;
    const speed = Math.max(20, travelSpeedMmMin);
    const arcOnTimeMin = totalPassLengthMm / speed;
    const duty = Math.max(0.15, Math.min(0.95, operatorDutyCycle));
    const totalJobTimeMin = arcOnTimeMin / duty;

    const shieldingGasLiters = arcOnTimeMin * Math.max(0, gasFlowLMin);
    const powerKW = (currentA * voltageV) / 1000;
    const electricalEnergyKWh = powerKW * (arcOnTimeMin / 60);

    const fillerCost = requiredFillerMassKg * wirePricePerKg;
    const gasCost = shieldingGasLiters * gasPricePerL;
    const laborCost = (totalJobTimeMin / 60) * laborRatePerHour;
    const totalCost = fillerCost + gasCost + laborCost;

    return {
        crossSectionMm2: areaMm2,
        weldVolumeCm3,
        depositedMassKg,
        requiredFillerMassKg,
        arcOnTimeMin,
        totalJobTimeMin,
        shieldingGasLiters,
        electricalEnergyKWh,
        fillerCost,
        gasCost,
        laborCost,
        totalCost,
    };
}


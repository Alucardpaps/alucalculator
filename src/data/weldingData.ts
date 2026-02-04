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
    { code: 'E6010', name: 'Cellulose Sodium', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'DC+', applications: 'Pipe, root passes' },
    { code: 'E6011', name: 'Cellulose Potassium', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'AC/DC+', applications: 'General purpose, AC welders' },
    { code: 'E6013', name: 'Rutile Potassium', process: ['smaw'], tensileStrength: 430, yieldStrength: 340, elongation: 22, position: 'All', current: 'AC/DC', applications: 'Sheet metal, light fabrication' },
    { code: 'E7018', name: 'Iron Powder Low H', process: ['smaw'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'AC/DC+', applications: 'Structural steel, pressure vessels' },
    { code: 'E7024', name: 'Iron Powder Titania', process: ['smaw'], tensileStrength: 490, yieldStrength: 400, elongation: 17, position: 'Flat/Horiz', current: 'AC/DC', applications: 'High deposition flat work' },
    { code: 'E308L-16', name: 'Stainless 308L', process: ['smaw'], tensileStrength: 550, yieldStrength: 350, elongation: 35, position: 'All', current: 'AC/DC+', applications: '304 stainless steel' },
    { code: 'E309L-16', name: 'Stainless 309L', process: ['smaw'], tensileStrength: 550, yieldStrength: 350, elongation: 30, position: 'All', current: 'AC/DC+', applications: 'Dissimilar steel joining' },

    // MIG/GMAW Wires
    { code: 'ER70S-6', name: 'Solid Wire Carbon', process: ['mig'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'DC+', applications: 'General carbon steel' },
    { code: 'ER308L', name: 'Stainless 308L Wire', process: ['mig', 'tig'], tensileStrength: 550, yieldStrength: 350, elongation: 35, position: 'All', current: 'DC+', applications: '304 stainless steel' },
    { code: 'ER4043', name: 'Aluminum Silicon', process: ['mig', 'tig'], tensileStrength: 165, yieldStrength: 70, elongation: 18, position: 'All', current: 'DC+', applications: '6xxx series aluminum' },
    { code: 'ER5356', name: 'Aluminum Magnesium', process: ['mig', 'tig'], tensileStrength: 265, yieldStrength: 150, elongation: 25, position: 'All', current: 'DC+', applications: '5xxx series aluminum' },

    // Flux-cored Wires
    { code: 'E71T-1', name: 'Flux Core Gas Shield', process: ['fcaw'], tensileStrength: 490, yieldStrength: 400, elongation: 22, position: 'All', current: 'DC+', applications: 'Structural steel, shipbuilding' },
    { code: 'E71T-11', name: 'Flux Core Self-Shield', process: ['fcaw'], tensileStrength: 490, yieldStrength: 400, elongation: 20, position: 'All', current: 'DC-', applications: 'Outdoor, windy conditions' },
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

import { EngineeringNodeSchema } from '../../types/core';
import {
    STRENGTH_MATERIALS,
    calculateBeam,
    calculatePrincipalStresses2D,
    calculateVonMises2D,
    calculateTorsion,
    BeamType,
    LoadType
} from '@/lib/stressAnalysis';
import { getBoltClass } from '@/data/boltNutStandards';
import { calculateIsoFit } from '@/lib/engines/math/iso286';

/**
 * 🛠️ Material Selection Node
 * Provides material properties based on name selection.
 */
export const MaterialNode: EngineeringNodeSchema = {
    id: 'mech-material',
    version: '1.0.0',
    title: 'Material Properties',
    description: 'Outputs engineering properties for selected alloy.',
    category: 'input',
    deterministic: true,
    inputs: [
        {
            id: 'materialName',
            label: 'Alloy Name',
            type: 'string',
            required: true,
            defaultValue: 'Steel AISI 1020'
        }
    ],
    outputs: [
        { id: 'E', label: 'Youngs Modulus (GPa)', type: 'number' },
        { id: 'Sy', label: 'Yield Strength (MPa)', type: 'yield_strength_mpa' },
        { id: 'Su', label: 'Ultimate Strength (MPa)', type: 'stress_mpa' },
        { id: 'G', label: 'Shear Modulus (GPa)', type: 'number' },
        { id: 'v', label: 'Poisson Ratio', type: 'ratio' }
    ],
    validate: (inputs: { materialName: string }) => {
        const mat = STRENGTH_MATERIALS.find(m => m.name === inputs.materialName);
        return {
            valid: !!mat,
            errors: mat ? [] : [`Material '${inputs.materialName}' not found in database.`],
            warnings: []
        };
    },
    compute: (inputs: { materialName: string }) => {
        const mat = STRENGTH_MATERIALS.find(m => m.name === inputs.materialName) || STRENGTH_MATERIALS[0];
        return {
            E: mat.E,
            Sy: mat.Sy,
            Su: mat.Su,
            G: mat.G || 0,
            v: mat.v || 0
        };
    }
};

/**
 * 🏗️ Beam Deflection Node
 * Calculates max deflection and stress for standard beam configurations.
 */
export const BeamDeflectionNode: EngineeringNodeSchema = {
    id: 'mech-beam-deflection',
    version: '1.0.0',
    title: 'Beam Deflection',
    description: 'Calculates displacement and bending stress.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'beamType', label: 'Beam Type', type: 'string', defaultValue: 'simply_supported' },
        { id: 'loadType', label: 'Load Type', type: 'string', defaultValue: 'point_center' },
        { id: 'L', label: 'Length (mm)', type: 'length_mm', required: true, defaultValue: 1000 },
        { id: 'P', label: 'Force (N)', type: 'force_n', required: true, defaultValue: 1000 },
        { id: 'E', label: 'Modulus E (GPa)', type: 'number', required: true, defaultValue: 200 },
        { id: 'I', label: 'Inertia I (mm4)', type: 'number', required: true, defaultValue: 100000 },
        { id: 'Z', label: 'Section Modulus Z (mm3)', type: 'number', required: true, defaultValue: 5000 }
    ],
    outputs: [
        { id: 'deflection', label: 'Max Deflection (mm)', type: 'length_mm' },
        { id: 'stress', label: 'Max Stress (MPa)', type: 'stress_mpa' },
        { id: 'moment', label: 'Max Moment (Nmm)', type: 'number' }
    ],
    validate: (inputs: any) => ({
        valid: inputs.L > 0 && inputs.E > 0 && inputs.I > 0,
        errors: [],
        warnings: []
    }),
    compute: (inputs: any) => {
        const res = calculateBeam(
            inputs.beamType as BeamType,
            inputs.loadType as LoadType,
            inputs.L,
            inputs.P,
            inputs.E,
            inputs.I,
            inputs.Z
        );
        return {
            deflection: res.maxDeflection,
            stress: res.maxStress,
            moment: res.maxMoment
        };
    }
};

/**
 * ⭕ Mohr's Circle / Combined Stress Node
 * Extracts principal stresses from a 2D stress state.
 */
export const CombinedStressNode: EngineeringNodeSchema = {
    id: 'mech-combined-stress',
    version: '1.0.0',
    title: 'Combined Stress (Mohr)',
    description: 'Calculates Principal Stresses and Von Mises.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'sigmaX', label: 'Sigma X (MPa)', type: 'stress_mpa', defaultValue: 0 },
        { id: 'sigmaY', label: 'Sigma Y (MPa)', type: 'stress_mpa', defaultValue: 0 },
        { id: 'tauXY', label: 'Tau XY (MPa)', type: 'stress_mpa', defaultValue: 0 }
    ],
    outputs: [
        { id: 'sigma1', label: 'Sigma 1 (Max)', type: 'stress_mpa' },
        { id: 'sigma2', label: 'Sigma 2 (Min)', type: 'stress_mpa' },
        { id: 'tauMax', label: 'Max Shear', type: 'stress_mpa' },
        { id: 'vonMises', label: 'Von Mises', type: 'stress_mpa' },
        { id: 'angle', label: 'Principal Angle (deg)', type: 'number' }
    ],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const state = { sigmaX: inputs.sigmaX, sigmaY: inputs.sigmaY, tauXY: inputs.tauXY };
        const principal = calculatePrincipalStresses2D(state);
        const vonMises = calculateVonMises2D(state);
        return {
            sigma1: principal.sigma1,
            sigma2: principal.sigma2,
            tauMax: principal.tauMax,
            vonMises: vonMises,
            angle: principal.angle
        };
    }
};

/**
 * 🌪️ Torsion Node
 * Torsional stress and twist for circular shafts.
 */
export const TorsionNode: EngineeringNodeSchema = {
    id: 'mech-torsion',
    version: '1.0.0',
    title: 'Shaft Torsion',
    description: 'Calculates shear stress and angle of twist.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'torque', label: 'Torque (Nm)', type: 'torque_nm', required: true, defaultValue: 100 },
        { id: 'L', label: 'Length (mm)', type: 'length_mm', required: true, defaultValue: 500 },
        { id: 'D', label: 'Diameter (mm)', type: 'diameter_mm', required: true, defaultValue: 30 },
        { id: 'di', label: 'Inner Dia (mm)', type: 'diameter_mm', defaultValue: 0 },
        { id: 'G', label: 'Shear Modulus (GPa)', type: 'number', defaultValue: 79 }
    ],
    outputs: [
        { id: 'shearStress', label: 'Max Shear Stress (MPa)', type: 'stress_mpa' },
        { id: 'twistDeg', label: 'Twist Angle (deg)', type: 'number' }
    ],
    validate: (inputs: any) => ({
        valid: inputs.D > inputs.di && inputs.D > 0,
        errors: inputs.D <= inputs.di ? ['Outer diameter must be greater than inner diameter'] : [],
        warnings: []
    }),
    compute: (inputs: any) => {
        const res = calculateTorsion(
            inputs.torque * 1000, // Nm to Nmm
            inputs.L,
            inputs.D,
            inputs.di,
            inputs.G
        );
        return {
            shearStress: res.maxShearStress,
            twistDeg: res.angleOfTwistDeg
        };
    }
};

/**
 * 🛠️ Sheet Metal Bending Node
 * Calculates Bend Allowance, Deduction & Setback.
 */
export const SheetMetalBendingNode: EngineeringNodeSchema = {
    id: 'mech-sheet-metal',
    version: '1.0.0',
    title: 'Sheet Metal Bending',
    description: 'Calculates Bend Allowance, Deduction & Setback.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'thickness', label: 'Thickness (t)', type: 'length_mm', required: true, defaultValue: 2 },
        { id: 'radius', label: 'Bend Radius (R)', type: 'length_mm', required: true, defaultValue: 2 },
        { id: 'angle', label: 'Angle (deg)', type: 'number', required: true, defaultValue: 90 },
        { id: 'kFactor', label: 'K-Factor', type: 'number', required: true, defaultValue: 0.33 }
    ],
    outputs: [
        { id: 'bendAllowance', label: 'BA (mm)', type: 'length_mm' },
        { id: 'bendDeduction', label: 'BD (mm)', type: 'length_mm' },
        { id: 'outsideSetback', label: 'OSSB (mm)', type: 'length_mm' }
    ],
    validate: (inputs: any) => ({
        valid: inputs.thickness > 0 && inputs.radius > 0 && inputs.angle > 0,
        errors: [],
        warnings: []
    }),
    compute: (inputs: any) => {
        const t = inputs.thickness;
        const R = inputs.radius;
        const A = inputs.angle;
        const K = inputs.kFactor;

        const rads = (A * Math.PI) / 180;
        const BA = rads * (R + K * t);
        const OSSB = (R + t) * Math.tan(rads / 2);
        const BD = (2 * OSSB) - BA;

        return {
            bendAllowance: BA,
            bendDeduction: BD,
            outsideSetback: OSSB
        };
    }
};

/**
 * 🔩 Fastener Bolt Stress Node
 */
export const BoltStressNode: EngineeringNodeSchema = {
    id: 'mech-bolt-stress',
    version: '1.0.0',
    title: 'Bolt Stress Tensor',
    description: 'Calculates Tensile Stress Area and Safety Factor.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'diameter', label: 'Nominal Dia (M)', type: 'length_mm', required: true, defaultValue: 10 },
        { id: 'pitch', label: 'Pitch (mm)', type: 'length_mm', required: true, defaultValue: 1.5 },
        { id: 'load', label: 'Load (kN)', type: 'number', required: true, defaultValue: 20 },
        { id: 'grade', label: 'Property Class', type: 'number', required: true, defaultValue: 8.8 }
    ],
    outputs: [
        { id: 'stressArea', label: 'Stress Area', type: 'number' },
        { id: 'tensileStress', label: 'Tensile Stress', type: 'stress_mpa' },
        { id: 'safetyFactor', label: 'Safety Factor', type: 'number' }
    ],
    validate: (inputs: any) => ({
        valid: inputs.diameter > 0 && inputs.pitch > 0,
        errors: [],
        warnings: []
    }),
    compute: (inputs: any) => {
        const d = inputs.diameter;
        const P = inputs.pitch;
        const F_N = inputs.load * 1000;
        const gradeStr = inputs.grade.toFixed(1);

        const boltClass = getBoltClass(gradeStr);
        const Sy = boltClass ? boltClass.yieldStrengthMin : 640;

        const As = (Math.PI / 4) * Math.pow(d - 0.9382 * P, 2);
        const sigma_t = F_N / As;
        const SF = Sy / sigma_t;

        return {
            stressArea: As,
            tensileStress: sigma_t,
            safetyFactor: SF
        };
    }
};

/**
 * 📏 Fit Tolerances Node
 */
export const FitToleranceNode: EngineeringNodeSchema = {
    id: 'mech-fit-tolerance',
    version: '1.0.0',
    title: 'Fit & Tolerance (ISO)',
    description: 'Resolves max/min clearance for given Hole & Shaft classes.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'nominalSize', label: 'Nominal Ø', type: 'length_mm', required: true, defaultValue: 50 },
        { id: 'holeClass', label: 'Hole Class', type: 'string', required: true, defaultValue: 'H7' },
        { id: 'shaftClass', label: 'Shaft Class', type: 'string', required: true, defaultValue: 'g6' }
    ],
    outputs: [
        { id: 'maxClearance', label: 'Max Clearance (mm)', type: 'length_mm' },
        { id: 'minClearance', label: 'Min Clearance (mm)', type: 'length_mm' },
        { id: 'fitType', label: 'Fit Type', type: 'string' }
    ],
    validate: (inputs: any) => ({
        valid: inputs.nominalSize > 0 && !!inputs.holeClass && !!inputs.shaftClass,
        errors: [],
        warnings: []
    }),
    compute: (inputs: any) => {
        const nom = inputs.nominalSize;
        const hc = inputs.holeClass;
        const sc = inputs.shaftClass;

        try {
            const res = calculateIsoFit(nom, hc, sc);
            return {
                maxClearance: res.fit.maxClearance,
                minClearance: res.fit.minClearance,
                fitType: res.fit.type
            };
        } catch (e) {
            return {
                maxClearance: 0,
                minClearance: 0,
                fitType: 'Unknown'
            };
        }
    }
};

/**
 * ⚙️ Machining Milling Node
 */
export const MachiningMillingNode: EngineeringNodeSchema = {
    id: 'fab-machining-milling',
    version: '1.0.0',
    title: 'Milling Feeds & Speeds',
    description: 'Calculate Spindle RPM, Feed Rate, and MRR.',
    category: 'fabrication' as any,
    deterministic: true,
    inputs: [
        { id: 'Vc', label: 'Cutting Speed (m/min)', type: 'number', required: true, defaultValue: 150 },
        { id: 'D', label: 'Diameter (mm)', type: 'length_mm', required: true, defaultValue: 10 },
        { id: 'Z', label: 'Teeth', type: 'number', required: true, defaultValue: 4 },
        { id: 'fz', label: 'Feed/Tooth (mm)', type: 'number', required: true, defaultValue: 0.05 },
        { id: 'ae', label: 'Radial Depth (mm)', type: 'length_mm', required: true, defaultValue: 5 },
        { id: 'ap', label: 'Axial Depth (mm)', type: 'length_mm', required: true, defaultValue: 10 }
    ],
    outputs: [
        { id: 'N', label: 'Spindle (RPM)', type: 'number' },
        { id: 'Vf', label: 'Feed (mm/min)', type: 'number' },
        { id: 'MRR', label: 'MRR (cm³/min)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.D > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const N = (inputs.Vc * 1000) / (Math.PI * inputs.D);
        const Vf = inputs.fz * inputs.Z * N;
        const MRR = (inputs.ae * inputs.ap * Vf) / 1000;
        return { N: Math.round(N), Vf: Math.round(Vf), MRR };
    }
};

/**
 * 🔄 Machining Grinding Node
 */
export const MachiningGrindingNode: EngineeringNodeSchema = {
    id: 'fab-machining-grinding',
    version: '1.0.0',
    title: 'Grinding Speed',
    description: 'Peripheral speed for grinding wheels.',
    category: 'fabrication' as any,
    deterministic: true,
    inputs: [
        { id: 'D', label: 'Diameter (mm)', type: 'length_mm', required: true, defaultValue: 250 },
        { id: 'N', label: 'RPM', type: 'number', required: true, defaultValue: 2800 }
    ],
    outputs: [
        { id: 'Vs', label: 'Speed (m/s)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.D > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const Vs = (Math.PI * inputs.D * inputs.N) / 60000;
        return { Vs };
    }
};

/**
 * ✨ Golden Ratio Node
 */
export const GoldenRatioNode: EngineeringNodeSchema = {
    id: 'math-golden-ratio',
    version: '1.0.0',
    title: 'Golden Ratio',
    description: 'Calculates perfect proportions (Φ = 1.618)',
    category: 'math' as any,
    deterministic: true,
    inputs: [
        { id: 'base', label: 'Base Length', type: 'length_mm', required: true, defaultValue: 100 }
    ],
    outputs: [
        { id: 'larger', label: 'Larger (A)', type: 'length_mm' },
        { id: 'smaller', label: 'Smaller (B)', type: 'length_mm' },
        { id: 'total', label: 'Total (A+B)', type: 'length_mm' }
    ],
    validate: (inputs: any) => ({ valid: inputs.base > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const PHI = 1.6180339887;
        const larger = inputs.base;
        const smaller = larger / PHI;
        const total = larger + smaller;
        return { larger, smaller, total };
    }
};

/**
 * 📐 Structural - Area Moment of Inertia Node
 */
export const AreaMomentNode: EngineeringNodeSchema = {
    id: 'mech-area-moment',
    version: '1.0.0',
    title: 'Area Moment of Inertia',
    description: 'Calculates structural properties of I-Beams & Rectangles.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'h', label: 'Height (h) mm', type: 'number', required: true, defaultValue: 200 },
        { id: 'b', label: 'Width (b) mm', type: 'number', required: true, defaultValue: 100 },
        { id: 'tf', label: 'Flange Thick (tf) mm', type: 'number', required: true, defaultValue: 10 },
        { id: 'tw', label: 'Web Thick (tw) mm', type: 'number', required: true, defaultValue: 6 }
    ],
    outputs: [
        { id: 'A', label: 'Area (mm²)', type: 'number' },
        { id: 'Ix', label: 'Ix (mm⁴)', type: 'number' },
        { id: 'Iy', label: 'Iy (mm⁴)', type: 'number' },
        { id: 'Zx', label: 'Zx (mm³)', type: 'number' },
        { id: 'Zy', label: 'Zy (mm³)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.h > 0 && inputs.b > 0 && inputs.tf >= 0 && inputs.tw >= 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const { h, b } = inputs;
        const tf = Math.min(inputs.tf, h / 2);
        const tw = Math.min(inputs.tw, b);

        const hWeb = h - 2 * tf;
        const bWebEmpty = b - tw;

        const A = 2 * (b * tf) + (tw * hWeb);

        const Ix_outer = (b * Math.pow(h, 3)) / 12;
        const Ix_inner = (bWebEmpty * Math.pow(hWeb, 3)) / 12;
        const Ix = Ix_outer - (hWeb > 0 ? Ix_inner : 0);

        const Iy_flanges = 2 * ((tf * Math.pow(b, 3)) / 12);
        const Iy_web = hWeb > 0 ? ((hWeb * Math.pow(tw, 3)) / 12) : 0;
        const Iy = Iy_flanges + Iy_web;

        const Zx = Ix / (h / 2);
        const Zy = Iy / (b / 2);

        return { A, Ix, Iy, Zx, Zy };
    }
};

/**
 * 🏭 Advanced Shaft Design (Goodman/Soderberg)
 */
export const ShaftDesignNode: EngineeringNodeSchema = {
    id: 'mech-shaft-design',
    version: '1.0.0',
    title: 'Advanced Shaft Design',
    description: 'Dynamic shaft sizing (Goodman/Soderberg/Gerber).',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'Ma', label: 'Alt. Bending (Nm)', type: 'torque_nm', required: true, defaultValue: 150 },
        { id: 'Mm', label: 'Mean Bending (Nm)', type: 'torque_nm', required: true, defaultValue: 0 },
        { id: 'Ta', label: 'Alt. Torsion (Nm)', type: 'torque_nm', required: true, defaultValue: 0 },
        { id: 'Tm', label: 'Mean Torsion (Nm)', type: 'torque_nm', required: true, defaultValue: 200 },
        { id: 'Sut', label: 'S_ut (MPa)', type: 'stress_mpa', required: true, defaultValue: 600 },
        { id: 'Sy', label: 'S_y (MPa)', type: 'stress_mpa', required: true, defaultValue: 450 },
        { id: 'Se', label: 'S_e (MPa)', type: 'stress_mpa', required: true, defaultValue: 200 },
        { id: 'n', label: 'Safety Factor', type: 'number', required: true, defaultValue: 2.0 },
        { id: 'theory', label: 'Theory (0:Goodman,1:Soderberg)', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [
        { id: 'dReq', label: 'Required Dia (mm)', type: 'length_mm' },
        { id: 'sigmaA', label: 'Alt. Stress (MPa)', type: 'stress_mpa' },
        { id: 'sigmaM', label: 'Mean Stress (MPa)', type: 'stress_mpa' }
    ],
    validate: (inputs: any) => ({ valid: inputs.Sut > 0 && inputs.Se > 0 && inputs.n > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        // Simple mock of the schema computation for the node
        const Kf = 1.5; const Kfs = 1.2;
        const Ma_nmm = inputs.Ma * 1000;
        const Mm_nmm = inputs.Mm * 1000;
        const Ta_nmm = inputs.Ta * 1000;
        const Tm_nmm = inputs.Tm * 1000;

        const A = Math.sqrt(4 * Math.pow(Kf * Ma_nmm, 2) + 3 * Math.pow(Kfs * Ta_nmm, 2));
        const B = Math.sqrt(4 * Math.pow(Kf * Mm_nmm, 2) + 3 * Math.pow(Kfs * Tm_nmm, 2));

        let dKub = 0;
        if (inputs.theory === 1) { // Soderberg
            dKub = (16 * inputs.n / Math.PI) * ((A / inputs.Se) + (B / inputs.Sy));
        } else if (inputs.theory === 2) { // Gerber
            dKub = ((8 * inputs.n * A) / (Math.PI * inputs.Se)) * (1 + Math.sqrt(1 + Math.pow((2 * B * inputs.Se) / (A * inputs.Sut), 2)));
        } else { // Goodman (0)
            dKub = (16 * inputs.n / Math.PI) * ((A / inputs.Se) + (B / inputs.Sut));
        }

        const dReq = Math.pow(dKub, 1 / 3);
        const factor = 16 / (Math.PI * Math.pow(dReq, 3));

        return {
            dReq: Math.round(dReq * 100) / 100,
            sigmaA: Math.round(factor * A * 100) / 100,
            sigmaM: Math.round(factor * B * 100) / 100
        };
    }
};

/**
 * 🏭 Bearing Life L10h Analysis (ISO/SKF)
 */
export const BearingLifeNode: EngineeringNodeSchema = {
    id: 'mech-bearing-life',
    version: '1.0.0',
    title: 'Bearing Life (L10h)',
    description: 'Calculates ISO dynamic load life.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'Fr', label: 'Radial Load (N)', type: 'force_n', required: true, defaultValue: 3000 },
        { id: 'Fa', label: 'Axial Load (N)', type: 'force_n', required: true, defaultValue: 500 },
        { id: 'rpm', label: 'Speed (RPM)', type: 'number', required: true, defaultValue: 1500 },
        { id: 'C', label: 'Dyn Load C (N)', type: 'force_n', required: true, defaultValue: 14000 },
        { id: 'C0', label: 'Stat Load C0 (N)', type: 'force_n', required: true, defaultValue: 7800 },
        { id: 'type', label: 'Type (0:Ball, 1:Roller)', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [
        { id: 'Pe', label: 'Equivalent P (N)', type: 'force_n' },
        { id: 'L10h', label: 'Life (hours)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.rpm > 0 && inputs.C > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        let P = inputs.Fr;
        const Fa_C0 = inputs.Fa / inputs.C0;
        let e = 0.22;
        if (Fa_C0 > 0.084) e = 0.28;

        let X = 1.0, Y = 0.0;
        if ((inputs.Fa / inputs.Fr) > e) {
            X = 0.56;
            Y = Fa_C0 > 0.084 ? 1.55 : 1.99; // Approximated
        }
        P = Math.max(inputs.Fr, X * inputs.Fr + Y * inputs.Fa);
        const p_exp = inputs.type === 0 ? 3.0 : (10.0 / 3.0);
        let L10 = 0;
        if (P > 0) L10 = Math.pow(inputs.C / P, p_exp);
        const L10h = (1000000 / (60 * inputs.rpm)) * L10;

        return {
            Pe: Math.round(P),
            L10h: Math.round(L10h)
        };
    }
};

/**
 * 🏭 Helical Spring Design
 */
export const SpringDesignNode: EngineeringNodeSchema = {
    id: 'mech-spring-design',
    version: '1.0.0',
    title: 'Spring Design',
    description: 'Helical compression spring analysis.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'F', label: 'Axial Force (N)', type: 'force_n', required: true, defaultValue: 500 },
        { id: 'd', label: 'Wire Dia. (mm)', type: 'length_mm', required: true, defaultValue: 5 },
        { id: 'D', label: 'Mean Dia. (mm)', type: 'length_mm', required: true, defaultValue: 40 },
        { id: 'Na', label: 'Active Coils', type: 'number', required: true, defaultValue: 10 },
        { id: 'G', label: 'Shear Mod (GPa)', type: 'number', required: true, defaultValue: 79.3 }
    ],
    outputs: [
        { id: 'tau', label: 'Shear Stress (MPa)', type: 'stress_mpa' },
        { id: 'delta', label: 'Deflection (mm)', type: 'length_mm' },
        { id: 'k', label: 'Stiffness (N/mm)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.d > 0 && inputs.D > 0 && inputs.Na > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const C = inputs.D / inputs.d;
        let Kw = 1.0;
        if (C > 1) Kw = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);

        const tau = Kw * ((8 * inputs.F * inputs.D) / (Math.PI * Math.pow(inputs.d, 3)));
        const G_MPa = inputs.G * 1000;
        const delta = (8 * inputs.F * Math.pow(inputs.D, 3) * inputs.Na) / (G_MPa * Math.pow(inputs.d, 4));
        const k = (G_MPa * Math.pow(inputs.d, 4)) / (8 * Math.pow(inputs.D, 3) * inputs.Na);

        return {
            tau: Math.round(tau * 10) / 10,
            delta: Math.round(delta * 100) / 100,
            k: Math.round(k * 100) / 100
        };
    }
};

/**
 * 🏭 3D Mohr's Circle Solver
 */
export const MohrCircle3DNode: EngineeringNodeSchema = {
    id: 'mech-mohr-3d',
    version: '1.0.0',
    title: '3D Mohr\'s Circle',
    description: 'Principal stress eigenvalue solver.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'sx', label: 'σx (MPa)', type: 'stress_mpa', required: true, defaultValue: 100 },
        { id: 'sy', label: 'σy (MPa)', type: 'stress_mpa', required: true, defaultValue: 50 },
        { id: 'sz', label: 'σz (MPa)', type: 'stress_mpa', required: true, defaultValue: -20 },
        { id: 'txy', label: 'τxy (MPa)', type: 'stress_mpa', required: true, defaultValue: 30 },
        { id: 'tyz', label: 'τyz (MPa)', type: 'stress_mpa', required: true, defaultValue: 0 },
        { id: 'tzx', label: 'τzx (MPa)', type: 'stress_mpa', required: true, defaultValue: 40 }
    ],
    outputs: [
        { id: 'p1', label: 'σ1 (Max)', type: 'stress_mpa' },
        { id: 'p2', label: 'σ2 (Int)', type: 'stress_mpa' },
        { id: 'p3', label: 'σ3 (Min)', type: 'stress_mpa' },
        { id: 'tmax', label: 'τmax (Abs)', type: 'stress_mpa' }
    ],
    validate: (inputs: any) => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const sx = inputs.sx, sy = inputs.sy, sz = inputs.sz;
        const txy = inputs.txy, tyz = inputs.tyz, tzx = inputs.tzx;

        const I1 = sx + sy + sz;
        const I2 = sx * sy + sy * sz + sz * sx - txy * txy - tyz * tyz - tzx * tzx;
        const I3 = sx * sy * sz - sx * tyz * tyz - sy * tzx * tzx - sz * txy * txy + 2 * txy * tyz * tzx;

        const a = -I1, b = I2, c = -I3;
        const Q = (3 * b - a * a) / 9;
        const R = (9 * a * b - 27 * c - 2 * a * a * a) / 54;

        let p1 = 0, p2 = 0, p3 = 0;
        if (Q === 0 && R === 0) {
            p1 = p2 = p3 = -a / 3;
        } else {
            const Q3 = Math.pow(-Q, 3);
            const theta = Math.acos(R / Math.sqrt(Q3 < 0 ? 0 : Q3));
            const r1 = 2 * Math.sqrt(-Q) * Math.cos(theta / 3) - a / 3;
            const r2 = 2 * Math.sqrt(-Q) * Math.cos((theta + 2 * Math.PI) / 3) - a / 3;
            const r3 = 2 * Math.sqrt(-Q) * Math.cos((theta + 4 * Math.PI) / 3) - a / 3;
            const roots = [r1, r2, r3].sort((a, b) => b - a);
            p1 = roots[0]; p2 = roots[1]; p3 = roots[2];
        }

        return {
            p1: Math.round(p1 * 10) / 10,
            p2: Math.round(p2 * 10) / 10,
            p3: Math.round(p3 * 10) / 10,
            tmax: Math.round(((p1 - p3) / 2) * 10) / 10
        };
    }
};

/**
 * 🏭 Thick/Thin Pressure Vessel (Lame's Eq)
 */
export const PressureVesselNode: EngineeringNodeSchema = {
    id: 'mech-pressure-vessel',
    version: '1.0.0',
    title: 'Pressure Vessel',
    description: 'Thick/Thin cylinder stress solver.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'ri', label: 'Inner Radius (mm)', type: 'length_mm', required: true, defaultValue: 100 },
        { id: 'ro', label: 'Outer Radius (mm)', type: 'length_mm', required: true, defaultValue: 150 },
        { id: 'pi', label: 'Inner Pres. (MPa)', type: 'stress_mpa', required: true, defaultValue: 50 },
        { id: 'po', label: 'Outer Pres. (MPa)', type: 'stress_mpa', required: true, defaultValue: 0 },
        { id: 'closed', label: 'Closed Ends? (1/0)', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [
        { id: 'sigTMax', label: 'Max Hoop (MPa)', type: 'stress_mpa' },
        { id: 'sigRMax', label: 'Max Radial (MPa)', type: 'stress_mpa' },
        { id: 'sigL', label: 'Longitudinal (MPa)', type: 'stress_mpa' },
        { id: 'tauMax', label: 'Max Shear (MPa)', type: 'stress_mpa' }
    ],
    validate: (inputs: any) => ({ valid: inputs.ro > inputs.ri && inputs.ri > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const den = Math.pow(inputs.ro, 2) - Math.pow(inputs.ri, 2);
        if (den <= 0) return { sigTMax: 0, sigRMax: 0, sigL: 0, tauMax: 0 };

        const term1 = (inputs.pi * Math.pow(inputs.ri, 2) - inputs.po * Math.pow(inputs.ro, 2)) / den;
        const term2 = (Math.pow(inputs.ri, 2) * Math.pow(inputs.ro, 2) * (inputs.pi - inputs.po)) / den;

        const sigT_ri = term1 + term2 / Math.pow(inputs.ri, 2);
        const sigT_ro = term1 + term2 / Math.pow(inputs.ro, 2);
        const sigTMax = Math.max(Math.abs(sigT_ri), Math.abs(sigT_ro)) * (sigT_ri >= 0 ? 1 : -1);
        const sigRMax = -Math.max(inputs.pi, inputs.po);

        let sigL = 0;
        if (inputs.closed === 1) sigL = term1;

        const p1 = Math.max(sigT_ri, -inputs.pi, sigL);
        const p3 = Math.min(sigT_ri, -inputs.pi, sigL);
        const tauMax = (p1 - p3) / 2;

        return {
            sigTMax: Math.round(sigTMax * 10) / 10,
            sigRMax: Math.round(sigRMax * 10) / 10,
            sigL: Math.round(sigL * 10) / 10,
            tauMax: Math.round(tauMax * 10) / 10
        };
    }
};

/**
 * 🏭 Non-Circular Torsion
 */
export const TorsionNonCircularNode: EngineeringNodeSchema = {
    id: 'mech-torsion-noncirc',
    version: '1.0.0',
    title: 'Non-Circular Torsion',
    description: 'Rect, Ellipse, Triangle Torsion.',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'T', label: 'Torque (Nm)', type: 'number', required: true, defaultValue: 500 },
        { id: 'G', label: 'Shear Mod (GPa)', type: 'number', required: true, defaultValue: 79.3 },
        { id: 'shape', label: 'Shape(0:Rect,1:Ell,2:Tri)', type: 'number', required: true, defaultValue: 0 },
        { id: 'a', label: 'Dim a (mm)', type: 'length_mm', required: true, defaultValue: 40 },
        { id: 'b', label: 'Dim b (mm)', type: 'length_mm', required: true, defaultValue: 20 }
    ],
    outputs: [
        { id: 'tauMax', label: 'Max Shear (MPa)', type: 'stress_mpa' },
        { id: 'theta_m', label: 'Twist (deg/m)', type: 'number' }
    ],
    validate: (inputs: any) => ({ valid: inputs.T > 0 && inputs.a > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const T = inputs.T * 1000;
        const G = inputs.G * 1000;
        const shape = inputs.shape;
        let a = inputs.a, b = inputs.b;

        let tauMax = 0;
        let theta_rad_mm = 0;

        if (shape === 0) {
            if (b > a) { let tmp = a; a = b; b = tmp; }
            const c1 = 1 / 3 - 0.21 * (b / a) * (1 - Math.pow(b / a, 4) / 12);
            const K = a * Math.pow(b, 3) * c1;
            const Q = a * Math.pow(b, 2) / (3 + 1.8 * (b / a));
            tauMax = T / Q;
            theta_rad_mm = T / (K * G);
        } else if (shape === 1) {
            if (b > a) { let tmp = a; a = b; b = tmp; }
            const K = (Math.PI * Math.pow(a, 3) * Math.pow(b, 3)) / (Math.pow(a, 2) + Math.pow(b, 2));
            tauMax = (2 * T) / (Math.PI * a * Math.pow(b, 2));
            theta_rad_mm = T / (K * G);
        } else {
            const K = (Math.sqrt(3) * Math.pow(a, 4)) / 80;
            tauMax = (20 * T) / Math.pow(a, 3);
            theta_rad_mm = T / (K * G);
        }

        const theta_deg_m = theta_rad_mm * (180 / Math.PI) * 1000;

        return {
            tauMax: Math.round(tauMax * 10) / 10,
            theta_m: Math.round(theta_deg_m * 1000) / 1000
        };
    }
};

/**
 * 🏭 Castigliano Energy
 */
export const CastiglianoEnergyNode: EngineeringNodeSchema = {
    id: 'mech-castigliano',
    version: '1.0.0',
    title: 'Castigliano Energy',
    description: 'Strain energy & deflection (Castigliano Theorem).',
    category: 'mechanical',
    deterministic: true,
    inputs: [
        { id: 'type', label: 'Load Type (0,1,2)', type: 'number', required: true, defaultValue: 0 },
        { id: 'P', label: 'Load P (N)', type: 'force_n', required: true, defaultValue: 1000 },
        { id: 'L', label: 'Length (mm)', type: 'length_mm', required: true, defaultValue: 1000 },
        { id: 'E', label: 'Elastic Mod. (GPa)', type: 'number', required: true, defaultValue: 200 },
        { id: 'I', label: 'Inertia (cm^4)', type: 'number', required: true, defaultValue: 100 },
        { id: 'A', label: 'Area (mm^2)', type: 'number', required: true, defaultValue: 500 }
    ],
    outputs: [
        { id: 'U', label: 'Energy (J)', type: 'number' },
        { id: 'delta', label: 'Deflection (mm)', type: 'length_mm' }
    ],
    validate: (inputs: any) => ({ valid: inputs.L > 0 && inputs.E > 0, errors: [], warnings: [] }),
    compute: (inputs: any) => {
        const type = inputs.type;
        const P = inputs.P;
        const L = inputs.L;
        const E_MPa = inputs.E * 1000;
        const I_mm4 = inputs.I * 10000;
        const A = inputs.A;

        let U_Nmm = 0;
        let delta = 0;

        if (type === 0) {
            U_Nmm = (Math.pow(P, 2) * Math.pow(L, 3)) / (6 * E_MPa * I_mm4);
            delta = (P * Math.pow(L, 3)) / (3 * E_MPa * I_mm4);
        } else if (type === 1) {
            U_Nmm = (Math.pow(P, 2) * Math.pow(L, 3)) / (96 * E_MPa * I_mm4);
            delta = (P * Math.pow(L, 3)) / (48 * E_MPa * I_mm4);
        } else {
            U_Nmm = (Math.pow(P, 2) * L) / (2 * A * E_MPa);
            delta = (P * L) / (A * E_MPa);
        }

        const U_J = U_Nmm / 1000;

        return {
            U: Math.round(U_J * 1000) / 1000,
            delta: Math.round(delta * 1000) / 1000
        };
    }
};

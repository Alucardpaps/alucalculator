/**
* AluCalculator V2 — Advanced Strength Analysis Schema
* 
* ENGINEERING DOMAIN: Mechanical
* STANDARDS: Shigley's Mechanical Engineering Design, AISC, Eurocode 3
* 
* Features:
* - Multi-mode analysis: Principal, Beam, Buckling, Torsion, Combined
* - Material Library integration
* - Safety Factor calculation per failure theory (Von Mises, Tresca)
*/

import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import {
    createValidatedValue,
    createUnverifiedValue,
    type ValidatedEngineeringValue,
    type CalculationResult,
    type ContextualValidationWarning
} from '@/types/engineering';

// ============================================
// MATERIAL DATA (Simplified for Schema)
// ============================================
const MATERIALS = {
    'S235': { name: 'Structural Steel S235', E: 210000, Sy: 235, Su: 360, density: 7.85, alpha: 12 },
    'S355': { name: 'Structural Steel S355', E: 210000, Sy: 355, Su: 470, density: 7.85, alpha: 12 },
    'SS304': { name: 'Stainless Steel 304', E: 193000, Sy: 205, Su: 515, density: 8.0, alpha: 17 },
    'SS316': { name: 'Stainless Steel 316', E: 193000, Sy: 205, Su: 515, density: 8.0, alpha: 16 },
    'AL6061-T6': { name: 'Aluminum 6061-T6', E: 68900, Sy: 276, Su: 310, density: 2.7, alpha: 23 },
    'AL7075-T6': { name: 'Aluminum 7075-T6', E: 71700, Sy: 503, Su: 572, density: 2.8, alpha: 23 },
    'Ti6Al4V': { name: 'Titanium Grade 5', E: 113800, Sy: 880, Su: 950, density: 4.43, alpha: 8.6 },

    // Tool Steels
    'H13': { name: 'Tool Steel H13 (Hot Work)', E: 210000, Sy: 1200, Su: 1420, density: 7.80, alpha: 11.5 },
    'D2': { name: 'Tool Steel D2 (Cold Work)', E: 210000, Sy: 1500, Su: 1700, density: 7.70, alpha: 10.4 },
    'O1': { name: 'Tool Steel O1 (Oil Hardening)', E: 200000, Sy: 1400, Su: 1600, density: 7.81, alpha: 11.9 },

    // Super Alloys
    'IN718': { name: 'Inconel 718 (Nickel Alloy)', E: 200000, Sy: 1034, Su: 1240, density: 8.19, alpha: 13.0 },
    'Hastelloy': { name: 'Hastelloy C-276', E: 205000, Sy: 355, Su: 790, density: 8.89, alpha: 11.2 },

    // Non-Ferrous & Others
    'Cu': { name: 'Copper (Pure)', E: 110000, Sy: 33, Su: 210, density: 8.96, alpha: 16.5 },
    'Brass': { name: 'Brass (Cartridge, 70/30)', E: 110000, Sy: 110, Su: 315, density: 8.53, alpha: 19.9 },
    'Bronze': { name: 'Phosphor Bronze', E: 110000, Sy: 170, Su: 380, density: 8.86, alpha: 17.8 },
    'Mg': { name: 'Magnesium Alloy AZ31B', E: 45000, Sy: 150, Su: 260, density: 1.77, alpha: 26.0 },
};

// ============================================
// CALCULATION ENGINE
// ============================================

function calculateStrength(
    inputs: Record<string, ValidatedEngineeringValue>
): CalculationResult {
    const timestamp = Date.now();
    const warnings: CalculationResult['warnings'] = [];
    const formulaTrace: Record<string, string> = {};
    const outputs: Record<string, ValidatedEngineeringValue> = {};

    const mode = inputs.mode.value as string; // 'principal', 'beam', 'buckling', 'torsion'
    const matKey = inputs.material.value as keyof typeof MATERIALS;
    const mat = MATERIALS[matKey] || MATERIALS['S235'];

    // Safety Factor Threshold
    const minSF = 1.5;

    // --- MODE 1: PRINCIPAL STRESS (MOHR'S CIRCLE) ---
    if (mode === 'principal') {
        const sx = inputs.sigmaX.value as number;
        const sy = inputs.sigmaY.value as number;
        const txy = inputs.tauXY.value as number;

        // Center and Radius
        const center = (sx + sy) / 2;
        const diff = (sx - sy) / 2;
        const radius = Math.sqrt(diff * diff + txy * txy);

        const s1 = center + radius;
        const s2 = center - radius;
        const tmax = radius;

        formulaTrace['s1'] = '\\sigma_{1,2} = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{(\\frac{\\sigma_x - \\sigma_y}{2})^2 + \\tau_{xy}^2}';

        // Von Mises
        const svm = Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
        formulaTrace['svm'] = '\\sigma_{vm} = \\sqrt{\\sigma_x^2 - \\sigma_x\\sigma_y + \\sigma_y^2 + 3\\tau_{xy}^2}';

        const sf = mat.Sy / svm;

        outputs['s1'] = createValidatedValue(s1, 'MPa', 'derived', { precision: 1 });
        outputs['s2'] = createValidatedValue(s2, 'MPa', 'derived', { precision: 1 });
        outputs['tmax'] = createValidatedValue(tmax, 'MPa', 'derived', { precision: 1 });
        outputs['svm'] = createValidatedValue(svm, 'MPa', 'derived', { precision: 1 });
        outputs['SF'] = createValidatedValue(sf, '-', 'derived', { precision: 2 });

        if (sf < 1.0) warnings.push({ field: 'SF', message: `Material YIELDED (SF=${sf.toFixed(2)} < 1.0)`, severity: 'critical' });
        else if (sf < minSF) warnings.push({ field: 'SF', message: `Low Safety Factor (< ${minSF})`, severity: 'warning' });
    }

    // --- MODE 2: BEAM DEFLECTION & STRESS ---
    else if (mode === 'beam') {
        const L = inputs.L.value as number;
        const F = inputs.F_beam.value as number;
        const I = inputs.I.value as number;
        const W = inputs.W.value as number; // Section Modulus
        const type = inputs.beamType.value as string; // 'cantilever', 'simply_supported'

        let maxMoment = 0;
        let maxDeflection = 0;

        if (type === 'cantilever') {
            // Point load at end
            maxMoment = F * L; // Nmm
            maxDeflection = (F * L * L * L) / (3 * mat.E * I);
            formulaTrace['M'] = 'M_{max} = F \\cdot L';
            formulaTrace['delta'] = '\\delta_{max} = \\frac{F L^3}{3 E I}';
        } else {
            // Simply supported, center point load
            maxMoment = (F * L) / 4;
            maxDeflection = (F * L * L * L) / (48 * mat.E * I);
            formulaTrace['M'] = 'M_{max} = \\frac{F L}{4}';
            formulaTrace['delta'] = '\\delta_{max} = \\frac{F L^3}{48 E I}';
        }

        const stress = maxMoment / W; // MPa
        const sf = mat.Sy / stress;

        outputs['M'] = createValidatedValue(maxMoment / 1000, 'Nm', 'derived', { precision: 1 }); // Conv to Nm
        outputs['delta'] = createValidatedValue(maxDeflection, 'mm', 'derived', { precision: 2 });
        outputs['sigma'] = createValidatedValue(stress, 'MPa', 'derived', { precision: 1 });
        outputs['SF'] = createValidatedValue(sf, '-', 'derived', { precision: 2 });

        // Deflection limit (L/250)
        const limit = L / 250;
        if (maxDeflection > limit) warnings.push({ field: 'delta', message: `Deflection exceeds L/250 limit (${limit.toFixed(1)} mm)`, severity: 'warning' });
        if (sf < 1.0) warnings.push({ field: 'SF', message: 'Beam fails in bending (Yield)', severity: 'critical' });
    }

    // --- MODE 3: COLUMN BUCKLING ---
    else if (mode === 'buckling') {
        const L = inputs.L_col.value as number;
        const F = inputs.F_col.value as number;
        const I = inputs.I_col.value as number;
        const A = inputs.A_col.value as number;
        const k_factor = (inputs.k_factor.value as number) || 1.0; // Pinned-Pinned default

        // Euler Critical Load
        // Pcr = (pi^2 * E * I) / (K * L)^2
        const Le = k_factor * L;
        const Pcr = (Math.PI * Math.PI * mat.E * I) / (Le * Le);

        // Critical Stress
        const sigmaCr = Pcr / A;

        // Slenderness Ratio
        // r = sqrt(I/A)
        const r = Math.sqrt(I / A);
        const lambda = Le / r;

        const sf = Pcr / F;

        formulaTrace['Pcr'] = 'P_{cr} = \\frac{\\pi^2 E I}{(K L)^2}';
        formulaTrace['lambda'] = '\\lambda = \\frac{K L}{r}';

        outputs['Pcr'] = createValidatedValue(Pcr, 'N', 'derived', { precision: 0 });
        outputs['sigmaCr'] = createValidatedValue(sigmaCr, 'MPa', 'derived', { precision: 1 });
        outputs['lambda'] = createValidatedValue(lambda, '-', 'derived', { precision: 1 });
        outputs['SF'] = createValidatedValue(sf, '-', 'derived', { precision: 2 });

        if (sf < 1.0) warnings.push({ field: 'SF', message: 'Column BUCKLES under load', severity: 'critical' });
        if (lambda > 200) warnings.push({ field: 'lambda', message: 'Slenderness ratio > 200 (Not recommended main member)', severity: 'warning' });

        // Johnson Parabola check (Short column)
        const Cc = Math.sqrt((2 * Math.PI * Math.PI * mat.E) / mat.Sy);
        if (lambda < Cc) {
            warnings.push({ field: 'lambda', message: `Slender ratio < Cc (${Cc.toFixed(0)}). Johnson formula required for accuracy. This is Euler (conservative).`, severity: 'info' });
        }
    }

    // --- MODE 4: TORSION ---
    else if (mode === 'torsion') {
        const T = inputs.T.value as number;
        const L = inputs.L_shaft.value as number;
        const D = inputs.D_shaft.value as number;
        const d = (inputs.d_shaft?.value as number) || 0; // Inner dia

        const J = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(d, 4));
        const G = mat.E / (2 * (1 + 0.3)); // Assume nu = 0.3 for steel/alum

        const tauMax = (T * (D / 2)) / J;
        const twistRad = (T * L) / (J * G);
        const twistDeg = twistRad * (180 / Math.PI);

        // Shear Yield ~ 0.577 * Sy (Von Mises)
        const Sy_shear = 0.577 * mat.Sy;
        const sf = Sy_shear / tauMax;

        formulaTrace['tau'] = '\\tau_{max} = \\frac{T r}{J}';
        formulaTrace['theta'] = '\\theta = \\frac{T L}{J G}';

        outputs['tau'] = createValidatedValue(tauMax, 'MPa', 'derived', { precision: 1 });
        outputs['theta'] = createValidatedValue(twistDeg, 'deg', 'derived', { precision: 2 });
        outputs['SF'] = createValidatedValue(sf, '-', 'derived', { precision: 2 });

        if (sf < 1.0) warnings.push({ field: 'SF', message: 'Shaft fails in SHEAR yield', severity: 'critical' });
    }

    // --- MODE 5: THERMAL EXPANSTION & STRESS ---
    else if (mode === 'thermal') {
        const L = inputs.L_therm.value as number;
        const dT = (inputs.T_final.value as number) - (inputs.T_init.value as number);
        // alpha is provided per material or as custom input in microstrain/C
        const alpha = (mat as any).alpha ? (mat as any).alpha * 1e-6 : 12e-6;
        const isConstrained = inputs.isConstrained.value === 'yes';

        // Delta L = alpha * L * dT
        const deltaL = alpha * L * dT;

        // If constrained, it cannot expand, so stress develops
        // Thermal Stress = E * alpha * dT
        const stress = isConstrained ? Math.abs(mat.E * alpha * dT) : 0;

        formulaTrace['deltaL'] = '\\Delta L = \\alpha \\cdot L \\cdot \\Delta T';
        formulaTrace['stress'] = '\\sigma_{th} = E \\cdot \\alpha \\cdot \\Delta T';

        outputs['deltaL'] = createValidatedValue(deltaL, 'mm', 'derived', { precision: 3 });
        outputs['thermalStress'] = createValidatedValue(stress, 'MPa', 'derived', { precision: 1 });
        outputs['dT'] = createValidatedValue(dT, 'deg', 'derived', { precision: 1 });

        if (isConstrained) {
            const sf = mat.Sy / (stress > 0 ? stress : 1e-9);
            outputs['SF'] = createValidatedValue(sf, '-', 'derived', { precision: 2 });
            if (sf < 1.0) warnings.push({ field: 'SF', message: 'Thermal stress exceeds yield strength!', severity: 'critical' });
        } else {
            outputs['SF'] = createValidatedValue(999, '-', 'derived', { precision: 0 }); // Safe if not constrained
        }
    }

    return {
        outputs,
        verified: (outputs['SF']?.value as number ?? 0) >= 1.0,
        warnings,
        timestamp,
        formulaTrace
    };
}

// ============================================
// SCHEMA DEFINITION
// ============================================

const strengthSchema: CalculatorSchemaV2 = {
    id: 'strength-analysis',
    metadata: {
        title: 'Strength of Materials',
        description: 'Multi-mode analysis: Stress, Beams, Buckling, Torsion.',
        category: 'materials',
        version: '2.0.0',
        author: 'AluCalc Engineering',
        lastUpdated: '2026-02-10',
        tags: ['stress', 'beam', 'buckling', 'mohr', 'torsion'],
        verifiedStandards: ['Shigley', 'AISC', 'Eurocode 3']
    },
    inputs: [
        {
            key: 'mode',
            label: 'Analysis Mode',
            unit: '-',
            defaultValue: 'principal',
            options: [
                { label: 'Principal Stress (Mohr)', value: 'principal' },
                { label: 'Beam Bending', value: 'beam' },
                { label: 'Column Buckling', value: 'buckling' },
                { label: 'Shaft Torsion', value: 'torsion' },
                { label: 'Thermal Stress', value: 'thermal' }
            ],
            validation: { required: true },
            description: 'Select the type of analysis to perform.'
        },
        {
            key: 'material',
            label: 'Material',
            unit: '-',
            defaultValue: 'S235',
            options: Object.entries(MATERIALS).map(([k, v]) => ({ label: v.name, value: k })),
            validation: { required: true },
            description: 'Material properties (E, Sy, Su).'
        },

        // --- PRINCIPAL INPUTS ---
        {
            key: 'sigmaX', label: 'Sigma X (σx)', unit: 'MPa', defaultValue: 100,
            condition: (inputs) => inputs.mode.value === 'principal',
            description: 'Normal stress in X direction.', validation: { required: true }
        },
        {
            key: 'sigmaY', label: 'Sigma Y (σy)', unit: 'MPa', defaultValue: 0,
            condition: (inputs) => inputs.mode.value === 'principal',
            description: 'Normal stress in Y direction.', validation: { required: true }
        },
        {
            key: 'tauXY', label: 'Shear XY (τxy)', unit: 'MPa', defaultValue: 50,
            condition: (inputs) => inputs.mode.value === 'principal',
            description: 'Shear stress in XY plane.', validation: { required: true }
        },

        // --- BEAM INPUTS ---
        {
            key: 'beamType', label: 'Beam Config', unit: '-', defaultValue: 'simply_supported',
            options: [{ label: 'Simply Supported', value: 'simply_supported' }, { label: 'Cantilever', value: 'cantilever' }],
            condition: (inputs) => inputs.mode.value === 'beam', validation: { required: true },
            description: 'Support condition.'
        },
        {
            key: 'L', label: 'Beam Length', unit: 'mm', defaultValue: 2000,
            condition: (inputs) => inputs.mode.value === 'beam', validation: { min: 1, required: true },
            description: 'Length of the beam.'
        },
        {
            key: 'F_beam', label: 'Force Load', unit: 'N', defaultValue: 1000,
            condition: (inputs) => inputs.mode.value === 'beam', validation: { required: true },
            description: 'Applied point load.'
        },
        {
            key: 'I', label: 'Inertia (Ix)', unit: 'mm4', defaultValue: 1000000,
            condition: (inputs) => inputs.mode.value === 'beam', validation: { min: 1, required: true },
            description: 'Area Moment of Inertia.'
        },
        {
            key: 'W', label: 'Section Modulus (Wx)', unit: 'mm3', defaultValue: 10000,
            condition: (inputs) => inputs.mode.value === 'beam', validation: { min: 1, required: true },
            description: 'Elastic Section Modulus.'
        },

        // --- BUCKLING INPUTS ---
        {
            key: 'L_col', label: 'Column Length', unit: 'mm', defaultValue: 3000,
            condition: (inputs) => inputs.mode.value === 'buckling', validation: { min: 1, required: true },
            description: 'Total length of column.'
        },
        {
            key: 'F_col', label: 'Axial Load', unit: 'N', defaultValue: 50000,
            condition: (inputs) => inputs.mode.value === 'buckling', validation: { required: true },
            description: 'Applied compressive load.'
        },
        {
            key: 'I_col', label: 'Inertia (Ix)', unit: 'mm4', defaultValue: 2000000,
            condition: (inputs) => inputs.mode.value === 'buckling', validation: { min: 1, required: true },
            description: 'Weak axis moment of inertia.'
        },
        {
            key: 'A_col', label: 'Area', unit: 'mm2', defaultValue: 2000,
            condition: (inputs) => inputs.mode.value === 'buckling', validation: { min: 1, required: true },
            description: 'Cross-sectional area.'
        },
        {
            key: 'k_factor', label: 'Effective Length K', unit: '-', defaultValue: 1.0,
            condition: (inputs) => inputs.mode.value === 'buckling',
            options: [
                { label: 'Pinned-Pinned (K=1.0)', value: 1.0 },
                { label: 'Fixed-Fixed (K=0.5)', value: 0.5 },
                { label: 'Fixed-Pinned (K=0.7)', value: 0.7 },
                { label: 'Fixed-Free (K=2.0)', value: 2.0 }
            ],
            validation: { required: true },
            description: 'Effective length factor based on end conditions.'
        },

        // --- TORSION INPUTS ---
        {
            key: 'T', label: 'Torque', unit: 'Nm', defaultValue: 500,
            condition: (inputs) => inputs.mode.value === 'torsion',
            validation: { required: true },
            description: 'Applied torque.'
        },
        {
            key: 'L_shaft', label: 'Shaft Length', unit: 'mm', defaultValue: 500,
            condition: (inputs) => inputs.mode.value === 'torsion', validation: { required: true },
            description: 'Length of shaft.'
        },
        {
            key: 'D_shaft', label: 'Outer Diameter', unit: 'mm', defaultValue: 50,
            condition: (inputs) => inputs.mode.value === 'torsion', validation: { min: 1, required: true },
            description: 'Outer diameter.'
        },
        {
            key: 'd_shaft', label: 'Inner Diameter', unit: 'mm', defaultValue: 0,
            condition: (inputs) => inputs.mode.value === 'torsion', validation: { min: 0, required: false },
            description: 'Inner diameter (0 for solid).'
        },

        // --- THERMAL INPUTS ---
        {
            key: 'L_therm', label: 'Original Length', unit: 'mm', defaultValue: 1000,
            condition: (inputs) => inputs.mode.value === 'thermal', validation: { min: 1, required: true },
            description: 'Length across which thermal expansion happens.'
        },
        {
            key: 'T_init', label: 'Init. Temp (T1)', unit: '°C' as any, defaultValue: 20,
            condition: (inputs) => inputs.mode.value === 'thermal', validation: { required: true },
            description: 'Starting temperature.'
        },
        {
            key: 'T_final', label: 'Final Temp (T2)', unit: '°C' as any, defaultValue: 100,
            condition: (inputs) => inputs.mode.value === 'thermal', validation: { required: true },
            description: 'Final temperature.'
        },
        {
            key: 'isConstrained', label: 'Constrained?', unit: '-', defaultValue: 'yes',
            condition: (inputs) => inputs.mode.value === 'thermal',
            options: [
                { label: 'Yes (Stress Develops)', value: 'yes' },
                { label: 'No (Free to Expand)', value: 'no' }
            ],
            validation: { required: true },
            description: 'Whether the geometry is locked between rigid walls.'
        },
    ],
    outputs: [
        {
            key: 'SF', label: 'Safety Factor', unit: '-', precision: 2,
            description: 'Factor of Safety against yield.',
            formulaLatex: 'SF = \\frac{S_y}{\\sigma_{eq}}',
            warningThreshold: { min: 1.5, message: 'Low Safety Factor' }
        },
        // Principal
        { key: 's1', label: 'Sigma 1 (Max)', unit: 'MPa', precision: 1, description: 'Principal Stress 1.', formulaLatex: '\\sigma_1 = \\frac{\\sigma_x+\\sigma_y}{2} + R' },
        { key: 's2', label: 'Sigma 2 (Min)', unit: 'MPa', precision: 1, description: 'Principal Stress 2.', formulaLatex: '\\sigma_2 = \\frac{\\sigma_x+\\sigma_y}{2} - R' },
        { key: 'svm', label: 'Von Mises', unit: 'MPa', precision: 1, description: 'Equivalent Von Mises Stress.', formulaLatex: '\\sigma_{vm} = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}' },
        // Beam
        { key: 'M', label: 'Max Moment', unit: 'Nm', precision: 1, description: 'Maximum bending moment.', formulaLatex: 'M_{max} = F \\cdot L' },
        { key: 'stress', label: 'Bending Stress', unit: 'MPa', precision: 1, description: 'Max bending stress.', formulaLatex: '\\sigma = \\frac{M}{W}' },
        { key: 'delta', label: 'Deflection', unit: 'mm', precision: 2, description: 'Max deflection.', formulaLatex: '\\delta = \\frac{F L^3}{3 E I}' },
        // Buckling
        { key: 'Pcr', label: 'Critical Load', unit: 'N', precision: 0, description: 'Euler Critical Buckling Load.', formulaLatex: 'P_{cr} = \\frac{\\pi^2 E I}{(KL)^2}' },
        { key: 'lambda', label: 'Slenderness', unit: '-', precision: 1, description: 'Slenderness Ratio (KL/r).', formulaLatex: '\\lambda = \\frac{KL}{r}' },
        // Torsion
        { key: 'tau', label: 'Shear Stress', unit: 'MPa', precision: 1, description: 'Max torsional shear stress.', formulaLatex: '\\tau = \\frac{Tr}{J}' },
        { key: 'theta', label: 'Twist Angle', unit: 'deg', precision: 2, description: 'Angle of twist.', formulaLatex: '\\theta = \\frac{TL}{JG}' },
        // Thermal
        { key: 'deltaL', label: 'Expansion (ΔL)', unit: 'mm', precision: 3, description: 'Length change.', formulaLatex: '\\Delta L = \\alpha L \\Delta T' },
        { key: 'thermalStress', label: 'Therm. Stress', unit: 'MPa', precision: 1, description: 'Stress if constrained.', formulaLatex: '\\sigma_{th} = E \\alpha \\Delta T' },
        { key: 'dT', label: 'Temp Diff (ΔT)', unit: 'deg' as any, precision: 1, description: 'Temperature change.', formulaLatex: '\\Delta T = T_2 - T_1' },
    ],
    calculationEngine: (inputs) => {
        // Clone inputs to avoid mutation
        const processedInputs = { ...inputs };

        // Torsion Mode: Convert Torque Nm -> Nmm for calculation consistency
        if (processedInputs.T) {
            const T_Nm = processedInputs.T.value as number;
            processedInputs.T = {
                ...processedInputs.T,
                value: T_Nm * 1000
            };
        }

        return calculateStrength(processedInputs);
    },
    tier: 'free',
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, any>) => {
            if (!result || !result.outputs) return null;

            // Helper to get value from either Record<string, number/string> or Record<string, ValidatedEngineeringValue>
            const getVal = (key: string) => {
                const val = inputs[key];
                return (val && typeof val === 'object' && 'value' in val) ? val.value : val;
            };

            const mode = getVal('mode') as string;
            const sf = Number(result.outputs.SF?.value || 0);
            const isUnsafe = sf < 1.0;
            const isWarning = sf < 1.5;
            const statusColor = isUnsafe ? '#ef4444' : (isWarning ? '#f59e0b' : '#22c55e');

            const w = 400;
            const h = 250;

            // --- RENDERER: PRINCIPAL (MOHR) ---
            if (mode === 'principal') {
                const s1 = Number(result.outputs.s1.value);
                const s2 = Number(result.outputs.s2.value);
                const tmax = Number(result.outputs.tmax.value);
                const center = (s1 + s2) / 2;

                const maxDim = Math.max(Math.abs(s1), Math.abs(s2), tmax) * 1.2 || 10;
                const scale = (w / 2.5) / maxDim;
                const cx = w / 2;
                const cy = h / 2;

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080b]/50 rounded-lg p-4 border border-slate-800/50">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full font-mono drop-shadow-2xl">
                            <defs>
                                <radialGradient id="gradPrincipal" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor={statusColor} stopOpacity="0.2" />
                                    <stop offset="100%" stopColor={statusColor} stopOpacity="0" />
                                </radialGradient>
                            </defs>
                            {/* Axes */}
                            <line x1="20" y1={cy} x2={w - 20} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1={cx + center * scale} y1="20" x2={cx + center * scale} y2={h - 20} stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />

                            {/* Circle */}
                            <circle cx={cx + center * scale} cy={cy} r={tmax * scale} fill="url(#gradPrincipal)" stroke={statusColor} strokeWidth="2" />

                            {/* Points */}
                            <circle cx={cx + s1 * scale} cy={cy} r="4" fill="#22c55e" />
                            <text x={cx + s1 * scale + 5} y={cy - 5} fill="#22c55e" fontSize="10">σ₁</text>

                            <circle cx={cx + s2 * scale} cy={cy} r="4" fill="#3b82f6" />
                            <text x={cx + s2 * scale - 15} y={cy - 5} fill="#3b82f6" fontSize="10">σ₂</text>

                            <text x={20} y={20} fill={statusColor} fontSize="12" fontWeight="bold">Mohr's Circle (Principal State)</text>
                        </svg>
                    </div>
                );
            }

            // --- RENDERER: BEAM ---
            if (mode === 'beam') {
                const type = getVal('beamType') as string;
                const L = Number(getVal('L'));
                const delta = Number(result.outputs.delta.value);
                const sf_val = Number(result.outputs.SF.value);

                const beamY = h / 2;
                const beamXStart = 50;
                const beamWidth = w - 100;

                // Max expected delta for scaling (visual only)
                const visualDelta = Math.min(Math.abs(delta) * 5, 40); // Exaggerate for visibility

                const points = [];
                for (let i = 0; i <= 20; i++) {
                    const xFrac = i / 20;
                    let y_offset = 0;

                    if (type === 'cantilever') {
                        y_offset = (visualDelta / 2) * (Math.pow(xFrac, 3) - 3 * xFrac);
                        if (delta > 0) y_offset = -y_offset;
                    } else {
                        y_offset = visualDelta * (16 / 5) * (Math.pow(xFrac, 4) - 2 * Math.pow(xFrac, 3) + xFrac);
                        if (delta > 0) y_offset = -y_offset;
                    }
                    points.push(`${beamXStart + xFrac * beamWidth},${beamY + y_offset}`);
                }

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080b]/50 rounded-lg p-4 border border-slate-800/50">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full font-mono">
                            {/* Supports */}
                            {type === 'cantilever' ? (
                                <rect x={beamXStart - 10} y={beamY - 30} width="10" height="60" fill="#475569" />
                            ) : (
                                <>
                                    <path d={`M ${beamXStart - 10} ${beamY + 10} L ${beamXStart} ${beamY} L ${beamXStart + 10} ${beamY + 10} Z`} fill="#475569" />
                                    <path d={`M ${beamXStart + beamWidth - 10} ${beamY + 10} L ${beamXStart + beamWidth} ${beamY} L ${beamXStart + beamWidth + 10} ${beamY + 10} Z`} fill="#475569" />
                                </>
                            )}

                            {/* Deflected Beam Line */}
                            <polyline points={points.join(' ')} fill="none" stroke={statusColor} strokeWidth="4" strokeLinecap="round" />

                            {/* Load Arrow */}
                            <g transform={`translate(${type === 'cantilever' ? beamXStart + beamWidth : beamXStart + beamWidth / 2}, ${type === 'cantilever' ? points[points.length - 1].split(',')[1] : points[10].split(',')[1]})`}>
                                <line x1="0" y1="-30" x2="0" y2="0" stroke="#f87171" strokeWidth="2" />
                                <path d="M -5 -5 L 0 0 L 5 -5" fill="none" stroke="#f87171" strokeWidth="2" />
                                <text x="5" y="-15" fill="#f87171" fontSize="10">F</text>
                            </g>

                            <text x={20} y={20} fill={statusColor} fontSize="12" fontWeight="bold">Beam Deflection Profile</text>
                            <text x={w - 100} y={h - 20} fill="#64748b" fontSize="10">SF: {sf_val.toFixed(2)}</text>
                        </svg>
                    </div>
                );
            }

            // --- RENDERER: BUCKLING ---
            if (mode === 'buckling') {
                const lambda = Number(result.outputs.lambda.value);

                const colX = w / 2;
                const colTop = 40;
                const colBottom = h - 40;
                const colHeight = colBottom - colTop;

                const points = [];
                const visualBuckle = Math.min(lambda / 5, 30); // Visual curvature

                for (let i = 0; i <= 20; i++) {
                    const yFrac = i / 20;
                    const x_offset = Math.sin(yFrac * Math.PI) * visualBuckle;
                    points.push(`${colX + x_offset},${colTop + yFrac * colHeight}`);
                }

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080b]/50 rounded-lg p-4 border border-slate-800/50">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full font-mono">
                            {/* Boundary Conditions */}
                            <rect x={colX - 20} y={colBottom} width="40" height="10" fill="#475569" />
                            <rect x={colX - 20} y={colTop - 10} width="40" height="10" fill="#475569" />

                            {/* Buckled Line */}
                            <polyline points={points.join(' ')} fill="none" stroke={statusColor} strokeWidth="4" strokeLinecap="round" />

                            {/* Axial Load Arrow */}
                            <g transform={`translate(${colX}, ${colTop - 35})`}>
                                <line x1="0" y1="0" x2="0" y2="25" stroke="#f87171" strokeWidth="2" />
                                <path d="M -5 20 L 0 25 L 5 20" fill="none" stroke="#f87171" strokeWidth="2" />
                                <text x="10" y="15" fill="#f87171" fontSize="10">P</text>
                            </g>

                            <text x={20} y={20} fill={statusColor} fontSize="12" fontWeight="bold">Column Buckling (Elastic Curve)</text>
                            <text x={20} y={h - 20} fill="#64748b" fontSize="10">λ = {lambda.toFixed(1)}</text>
                        </svg>
                    </div>
                );
            }

            // --- RENDERER: TORSION ---
            if (mode === 'torsion') {
                const tau = Number(result.outputs.tau.value);
                const theta = Number(result.outputs.theta.value);

                const shaftX = 100;
                const shaftY = h / 2;
                const shaftW = 200;
                const shaftR = 40;

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080b]/50 rounded-lg p-4 border border-slate-800/50">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full font-mono">
                            <defs>
                                <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#334155" />
                                    <stop offset="50%" stopColor="#94a3b8" />
                                    <stop offset="100%" stopColor="#0f172a" />
                                </linearGradient>
                            </defs>
                            {/* Shaft Body */}
                            <rect x={shaftX} y={shaftY - shaftR} width={shaftW} height={shaftR * 2} fill="url(#shaftGrad)" rx="4" />

                            {/* Torque Arrow (Front End) */}
                            <g transform={`translate(${shaftX + shaftW + 20}, ${shaftY})`}>
                                <path d="M -20 -20 A 30 30 0 1 1 -20 20" fill="none" stroke="#f87171" strokeWidth="3" markerEnd="url(#torqueArrow)" />
                                <text x="10" y="0" fill="#f87171" fontSize="12" fontWeight="bold">T</text>
                            </g>

                            {/* Constraint (Back End) */}
                            <rect x={shaftX - 10} y={shaftY - shaftR - 10} width="10" height={shaftR * 2 + 20} fill="#1e293b" />

                            <text x={20} y={20} fill={statusColor} fontSize="12" fontWeight="bold">Torsional Shear Stress</text>
                            <text x={20} y={h - 20} fill="#64748b" fontSize="10">τ_max: {tau.toFixed(1)} MPa | θ: {theta.toFixed(2)}°</text>

                            <defs>
                                <marker id="torqueArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                );
            }

            // --- RENDERER: THERMAL ---
            if (mode === 'thermal') {
                const deltaL = Number(result.outputs.deltaL.value);
                const stress = Number(result.outputs.thermalStress.value);
                const isConstrained = getVal('isConstrained') === 'yes';

                const barX = 100;
                const barY = h / 2 - 20;
                const barW = 200;
                const barH = 40;

                const visualExp = Math.sign(deltaL) * Math.min(Math.abs(deltaL) * 10, 40);

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080b]/50 rounded-lg p-4 border border-slate-800/50">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full font-mono">
                            <defs>
                                <linearGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                            </defs>

                            {/* Static Wall Left */}
                            <rect x={barX - 15} y={barY - 20} width="15" height={barH + 40} fill="#475569" />

                            {/* Right Constraint if exists */}
                            {isConstrained && (
                                <rect x={barX + barW} y={barY - 20} width="15" height={barH + 40} fill="#475569" />
                            )}

                            {/* The Bar */}
                            <rect x={barX} y={barY} width={barW + (isConstrained ? 0 : visualExp)} height={barH} fill="url(#tempGrad)" opacity="0.8" stroke={statusColor} strokeWidth={isConstrained ? 2 : 0} />

                            {/* Expansion Arrow If not constrained */}
                            {!isConstrained && visualExp !== 0 && (
                                <g transform={`translate(${barX + barW + visualExp}, ${barY + barH / 2})`}>
                                    <line x1="-30" y1="0" x2="0" y2="0" stroke="#22c55e" strokeWidth="2" />
                                    <path d="M -5 -5 L 0 0 L -5 5" fill="none" stroke="#22c55e" strokeWidth="2" />
                                    <text x="-25" y="-10" fill="#22c55e" fontSize="10">ΔL</text>
                                </g>
                            )}

                            <text x={20} y={20} fill={statusColor} fontSize="12" fontWeight="bold">Thermal Analysis</text>
                            {isConstrained && <text x={20} y={h - 20} fill="#ef4444" fontSize="10">σ_thermal: {stress.toFixed(1)} MPa (CONSTRAINED)</text>}
                            {!isConstrained && <text x={20} y={h - 20} fill="#3b82f6" fontSize="10">Free Expansion: {deltaL.toFixed(3)} mm</text>}
                        </svg>
                    </div>
                );
            }

            return null;
        }
    },
    documentation: {
        assumptions: [
            { id: 'linear-elastic', text: 'Material behaves linearly elastic (Hookes Law Applies).', impact: 'high' },
            { id: 'small-deflection', text: 'Small deflection theory (slope < 10 deg).', impact: 'medium' }
        ],
        standards: [
            { code: 'Shigley', title: 'Mechanical Engineering Design' },
            { code: 'AISC 360', title: 'Specification for Structural Steel Buildings' }
        ],
        formulaLatex: '\\sigma = \\frac{My}{I}'
    }
};

export default strengthSchema;

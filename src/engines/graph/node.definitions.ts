/**
 * AluCalculator Engineering Kernel — Standard Node Definitions
 * 
 * Pre-built engineering calculation nodes for the graph system.
 */

import {
    NodeDefinition,
    registerNode,
    ComputeResult,
    ValidationMessage,
} from './graph.engine';

// ============================================
// GEAR NODE
// ============================================

export const gearNode: NodeDefinition = {
    type: 'gear',
    name: 'Spur Gear',
    category: 'mechanical',
    description: 'Involute spur gear calculation with undercut detection',
    inputs: [
        { id: 'module', name: 'Module', dataType: 'number', unit: 'mm', required: true, defaultValue: 2 },
        { id: 'teeth', name: 'Teeth Count', dataType: 'number', unit: '-', required: true, defaultValue: 20 },
        { id: 'pressureAngle', name: 'Pressure Angle', dataType: 'number', unit: '°', required: true, defaultValue: 20 },
        { id: 'profileShift', name: 'Profile Shift', dataType: 'number', unit: '-', required: false, defaultValue: 0 },
        { id: 'faceWidth', name: 'Face Width', dataType: 'number', unit: 'mm', required: true, defaultValue: 10 },
    ],
    outputs: [
        { id: 'pitchDiameter', name: 'Pitch Diameter', dataType: 'number', unit: 'mm', formula: 'd = m × z' },
        { id: 'baseDiameter', name: 'Base Diameter', dataType: 'number', unit: 'mm', formula: 'd_b = d × cos(α)' },
        { id: 'tipDiameter', name: 'Tip Diameter', dataType: 'number', unit: 'mm', formula: 'd_a = d + 2m' },
        { id: 'rootDiameter', name: 'Root Diameter', dataType: 'number', unit: 'mm', formula: 'd_f = d - 2.5m' },
        { id: 'torqueCapacity', name: 'Max Torque', dataType: 'number', unit: 'N·m' },
        { id: 'geometry', name: 'Geometry', dataType: 'geometry' },
    ],
    compute: (inputs) => {
        const messages: ValidationMessage[] = [];
        const m = inputs.module as number;
        const z = inputs.teeth as number;
        const alpha = (inputs.pressureAngle as number) * Math.PI / 180;
        const x = (inputs.profileShift as number) || 0;
        const b = inputs.faceWidth as number;

        // Calculations
        const d = m * z;
        const db = d * Math.cos(alpha);
        const da = d + 2 * m * (1 + x);
        const df = d - 2 * m * (1.25 - x);

        // Undercut check
        const minTeeth = Math.ceil(2 / (Math.sin(alpha) ** 2));
        if (z < minTeeth && x <= 0) {
            messages.push({
                level: 'warning',
                code: 'UNDERCUT',
                message: `z=${z} < ${minTeeth} for α=${inputs.pressureAngle}°. Undercut risk!`,
                source: 'DIN 3960',
            });
        }

        // Approximate torque capacity (simplified Lewis)
        const torqueCapacity = 0.5 * b * m * m * z * 50; // Very simplified

        return {
            outputs: {
                pitchDiameter: d,
                baseDiameter: db,
                tipDiameter: da,
                rootDiameter: df,
                torqueCapacity,
                geometry: { type: 'gear', d, da, df },
            },
            status: messages.some(m => m.level === 'error') ? 'error' :
                messages.some(m => m.level === 'warning') ? 'warning' : 'valid',
            messages,
        };
    },
};

// ============================================
// SHAFT NODE
// ============================================

export const shaftNode: NodeDefinition = {
    type: 'shaft',
    name: 'Shaft',
    category: 'mechanical',
    description: 'Shaft sizing based on torque and bending moments',
    inputs: [
        { id: 'torque', name: 'Input Torque', dataType: 'number', unit: 'N·m', required: true },
        { id: 'length', name: 'Shaft Length', dataType: 'number', unit: 'mm', required: true, defaultValue: 100 },
        { id: 'material', name: 'Material', dataType: 'string', required: false, defaultValue: 'Steel' },
        { id: 'allowableStress', name: 'Allowable Stress', dataType: 'number', unit: 'MPa', required: true, defaultValue: 80 },
    ],
    outputs: [
        { id: 'minDiameter', name: 'Min Diameter', dataType: 'number', unit: 'mm', formula: 'd = ∛(16T/πτ)' },
        { id: 'recommendedDiameter', name: 'Recommended Diameter', dataType: 'number', unit: 'mm' },
        { id: 'shearStress', name: 'Shear Stress', dataType: 'number', unit: 'MPa' },
        { id: 'safetyFactor', name: 'Safety Factor', dataType: 'number', unit: '-' },
    ],
    compute: (inputs) => {
        const messages: ValidationMessage[] = [];
        const T = inputs.torque as number;
        const tau_allow = inputs.allowableStress as number;

        if (T <= 0) {
            messages.push({ level: 'error', code: 'INVALID_TORQUE', message: 'Torque must be positive' });
            return { outputs: {}, status: 'error', messages };
        }

        // Minimum diameter from pure torsion
        // τ = 16T / (πd³) → d = ∛(16T / πτ)
        const T_Nmm = T * 1000; // Convert to N·mm
        const dMin = Math.pow((16 * T_Nmm) / (Math.PI * tau_allow), 1 / 3);

        // Add safety margin (1.2x)
        const dRec = Math.ceil(dMin * 1.2);

        // Actual stress at recommended diameter
        const tau_actual = (16 * T_Nmm) / (Math.PI * Math.pow(dRec, 3));
        const SF = tau_allow / tau_actual;

        if (SF < 1.5) {
            messages.push({ level: 'warning', code: 'LOW_SF', message: `Safety factor ${SF.toFixed(2)} < 1.5` });
        }

        return {
            outputs: {
                minDiameter: dMin,
                recommendedDiameter: dRec,
                shearStress: tau_actual,
                safetyFactor: SF,
            },
            status: messages.some(m => m.level === 'error') ? 'error' :
                messages.some(m => m.level === 'warning') ? 'warning' : 'valid',
            messages,
        };
    },
};

// ============================================
// BEARING NODE
// ============================================

export const bearingNode: NodeDefinition = {
    type: 'bearing',
    name: 'Bearing',
    category: 'mechanical',
    description: 'Bearing life calculation based on radial load',
    inputs: [
        { id: 'radialLoad', name: 'Radial Load', dataType: 'number', unit: 'N', required: true },
        { id: 'axialLoad', name: 'Axial Load', dataType: 'number', unit: 'N', required: false, defaultValue: 0 },
        { id: 'rpm', name: 'Speed', dataType: 'number', unit: 'rpm', required: true, defaultValue: 1500 },
        { id: 'dynamicCapacity', name: 'Dynamic Capacity (C)', dataType: 'number', unit: 'N', required: true, defaultValue: 10000 },
        { id: 'type', name: 'Bearing Type', dataType: 'string', required: false, defaultValue: 'ball' },
    ],
    outputs: [
        { id: 'equivalentLoad', name: 'Equivalent Load', dataType: 'number', unit: 'N' },
        { id: 'lifeRevolutions', name: 'Life (revolutions)', dataType: 'number', unit: 'rev' },
        { id: 'lifeHours', name: 'Life (hours)', dataType: 'number', unit: 'h', formula: 'L₁₀h = (10⁶/60n) × L₁₀' },
        { id: 'status', name: 'Status', dataType: 'string' },
    ],
    compute: (inputs) => {
        const messages: ValidationMessage[] = [];
        const Fr = inputs.radialLoad as number;
        const Fa = inputs.axialLoad as number || 0;
        const n = inputs.rpm as number;
        const C = inputs.dynamicCapacity as number;
        const type = inputs.type as string || 'ball';

        // Ball bearing: p = 3, Roller: p = 10/3
        const p = type === 'ball' ? 3 : 10 / 3;

        // Equivalent load (simplified X=1, Y=0 for pure radial)
        const P = Fr + 0.5 * Fa;

        if (P <= 0) {
            messages.push({ level: 'error', code: 'NO_LOAD', message: 'Load must be positive' });
            return { outputs: {}, status: 'error', messages };
        }

        // Basic life (million revolutions)
        const L10 = Math.pow(C / P, p);
        const L10_rev = L10 * 1e6;

        // Life in hours
        const L10h = (1e6 / (60 * n)) * L10;

        // Status check
        let status = 'OK';
        if (L10h < 5000) {
            status = 'SHORT LIFE';
            messages.push({ level: 'warning', code: 'SHORT_LIFE', message: `Life ${L10h.toFixed(0)}h < 5000h recommended` });
        } else if (L10h < 20000) {
            status = 'ADEQUATE';
        } else {
            status = 'EXCELLENT';
        }

        return {
            outputs: {
                equivalentLoad: P,
                lifeRevolutions: L10_rev,
                lifeHours: L10h,
                status,
            },
            status: messages.some(m => m.level === 'error') ? 'error' :
                messages.some(m => m.level === 'warning') ? 'warning' : 'valid',
            messages,
        };
    },
};

// ============================================
// MATH NODES
// ============================================

export const multiplyNode: NodeDefinition = {
    type: 'multiply',
    name: 'Multiply',
    category: 'math',
    description: 'Multiply two values',
    inputs: [
        { id: 'a', name: 'A', dataType: 'number', required: true },
        { id: 'b', name: 'B', dataType: 'number', required: true },
    ],
    outputs: [
        { id: 'result', name: 'Result', dataType: 'number', formula: 'A × B' },
    ],
    compute: (inputs) => ({
        outputs: { result: (inputs.a as number) * (inputs.b as number) },
        status: 'valid',
        messages: [],
    }),
};

export const divideNode: NodeDefinition = {
    type: 'divide',
    name: 'Divide',
    category: 'math',
    description: 'Divide A by B',
    inputs: [
        { id: 'a', name: 'A', dataType: 'number', required: true },
        { id: 'b', name: 'B', dataType: 'number', required: true },
    ],
    outputs: [
        { id: 'result', name: 'Result', dataType: 'number', formula: 'A ÷ B' },
    ],
    compute: (inputs) => {
        const b = inputs.b as number;
        if (b === 0) {
            return {
                outputs: { result: NaN },
                status: 'error',
                messages: [{ level: 'error', code: 'DIV_ZERO', message: 'Division by zero' }],
            };
        }
        return {
            outputs: { result: (inputs.a as number) / b },
            status: 'valid',
            messages: [],
        };
    },
};

// ============================================
// REGISTER ALL NODES
// ============================================

export function registerStandardNodes(): void {
    registerNode(gearNode);
    registerNode(shaftNode);
    registerNode(bearingNode);
    registerNode(multiplyNode);
    registerNode(divideNode);
}

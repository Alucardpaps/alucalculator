/**
 * AluCalculator OS — Advanced Engineering Mathematics Library
 *
 * Implements deterministic vector analysis, 3x3 matrix algebra,
 * numerical calculus (Simpson integration & central difference derivative),
 * polynomial root solving, and statistical linear regression.
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { EngineeringNodeSchema } from '@/flow/types/core';

export interface Vector3Data {
    x: number;
    y: number;
    z: number;
}

export interface Matrix3Data {
    m00: number; m01: number; m02: number;
    m10: number; m11: number; m12: number;
    m20: number; m21: number; m22: number;
}

// ---------------------------------------------------------------------------
// 1. Vector 3D Definition Node
// ---------------------------------------------------------------------------
export const Vector3DNode: EngineeringNodeSchema = {
    id: 'math-vector-3d',
    version: '1.0.0',
    title: 'Vector 3D',
    description: 'Constructs a 3D spatial vector [X, Y, Z] with magnitude and normalized unit vector.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'x', label: 'X Component', type: 'number', required: true, defaultValue: 1 },
        { id: 'y', label: 'Y Component', type: 'number', required: true, defaultValue: 0 },
        { id: 'z', label: 'Z Component', type: 'number', required: true, defaultValue: 0 },
    ],
    outputs: [
        { id: 'vec', label: 'Vector (vec3)', type: 'vector3' },
        { id: 'magnitude', label: 'Magnitude |v|', type: 'number' },
        { id: 'u_x', label: 'Unit X', type: 'number' },
        { id: 'u_y', label: 'Unit Y', type: 'number' },
        { id: 'u_z', label: 'Unit Z', type: 'number' },
    ],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { x: number; y: number; z: number }) => {
        const x = Number(inputs.x || 0);
        const y = Number(inputs.y || 0);
        const z = Number(inputs.z || 0);
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const invMag = magnitude > 1e-12 ? 1 / magnitude : 0;
        return {
            vec: { x, y, z },
            magnitude,
            u_x: x * invMag,
            u_y: y * invMag,
            u_z: z * invMag,
        };
    },
};

// ---------------------------------------------------------------------------
// 2. Vector Operations Node (Dot, Cross, Addition, Angle)
// ---------------------------------------------------------------------------
export const VectorOperationsNode: EngineeringNodeSchema = {
    id: 'math-vector-ops',
    version: '1.0.0',
    title: 'Vector Operations (Dot / Cross)',
    description: 'Calculates dot product, cross product, vector sum, difference, and angle between two vectors.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'v1', label: 'Vector A', type: 'vector3', required: true, defaultValue: { x: 1, y: 0, z: 0 } },
        { id: 'v2', label: 'Vector B', type: 'vector3', required: true, defaultValue: { x: 0, y: 1, z: 0 } },
    ],
    outputs: [
        { id: 'dot', label: 'Dot Product (A · B)', type: 'number' },
        { id: 'cross', label: 'Cross Product (A × B)', type: 'vector3' },
        { id: 'sum', label: 'Sum (A + B)', type: 'vector3' },
        { id: 'diff', label: 'Diff (A - B)', type: 'vector3' },
        { id: 'angle_deg', label: 'Angle θ (deg)', type: 'number' },
    ],
    validate: (inputs: { v1?: Vector3Data; v2?: Vector3Data }) => {
        if (!inputs.v1 || !inputs.v2) {
            return { valid: false, errors: ['Both Vector A and Vector B must be provided'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { v1: Vector3Data; v2: Vector3Data }) => {
        const a = inputs.v1;
        const b = inputs.v2;

        const dot = a.x * b.x + a.y * b.y + a.z * b.z;
        const cross: Vector3Data = {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
        const sum: Vector3Data = {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z,
        };
        const diff: Vector3Data = {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        };

        const magA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
        const magB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
        let angle_deg = 0;
        if (magA > 1e-12 && magB > 1e-12) {
            const cosTheta = Math.max(-1, Math.min(1, dot / (magA * magB)));
            angle_deg = (Math.acos(cosTheta) * 180) / Math.PI;
        }

        return { dot, cross, sum, diff, angle_deg };
    },
};

// ---------------------------------------------------------------------------
// 3. Matrix 3x3 Node (Determinant, Transpose, Mat-Vec Multiply)
// ---------------------------------------------------------------------------
export const Matrix3x3Node: EngineeringNodeSchema = {
    id: 'math-matrix-3x3',
    version: '1.0.0',
    title: 'Matrix 3x3 Algebra',
    description: 'Computes determinant, trace, transpose, and matrix-vector product for 3x3 matrices.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'm00', label: 'm00', type: 'number', defaultValue: 1 },
        { id: 'm01', label: 'm01', type: 'number', defaultValue: 0 },
        { id: 'm02', label: 'm02', type: 'number', defaultValue: 0 },
        { id: 'm10', label: 'm10', type: 'number', defaultValue: 0 },
        { id: 'm11', label: 'm11', type: 'number', defaultValue: 1 },
        { id: 'm12', label: 'm12', type: 'number', defaultValue: 0 },
        { id: 'm20', label: 'm20', type: 'number', defaultValue: 0 },
        { id: 'm21', label: 'm21', type: 'number', defaultValue: 0 },
        { id: 'm22', label: 'm22', type: 'number', defaultValue: 1 },
        { id: 'vec', label: 'Vector v (optional)', type: 'vector3', required: false, defaultValue: { x: 1, y: 1, z: 1 } },
    ],
    outputs: [
        { id: 'det', label: 'Determinant det(M)', type: 'number' },
        { id: 'trace', label: 'Trace tr(M)', type: 'number' },
        { id: 'matrix', label: 'Matrix (mat3)', type: 'matrix3' },
        { id: 'transformed_vec', label: 'Transformed (M · v)', type: 'vector3' },
    ],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: Record<string, any>) => {
        const m00 = Number(inputs.m00 ?? 1);
        const m01 = Number(inputs.m01 ?? 0);
        const m02 = Number(inputs.m02 ?? 0);
        const m10 = Number(inputs.m10 ?? 0);
        const m11 = Number(inputs.m11 ?? 1);
        const m12 = Number(inputs.m12 ?? 0);
        const m20 = Number(inputs.m20 ?? 0);
        const m21 = Number(inputs.m21 ?? 0);
        const m22 = Number(inputs.m22 ?? 1);

        const det =
            m00 * (m11 * m22 - m12 * m21) -
            m01 * (m10 * m22 - m12 * m20) +
            m02 * (m10 * m21 - m11 * m20);

        const trace = m00 + m11 + m22;

        const v = inputs.vec || { x: 0, y: 0, z: 0 };
        const transformed_vec: Vector3Data = {
            x: m00 * v.x + m01 * v.y + m02 * v.z,
            y: m10 * v.x + m11 * v.y + m12 * v.z,
            z: m20 * v.x + m21 * v.y + m22 * v.z,
        };

        const matrix: Matrix3Data = { m00, m01, m02, m10, m11, m12, m20, m21, m22 };
        return { det, trace, matrix, transformed_vec };
    },
};

// ---------------------------------------------------------------------------
// 4. Numerical Calculus Node (Derivative & Simpson's 1/3 Integration)
// ---------------------------------------------------------------------------
export const NumericalCalculusNode: EngineeringNodeSchema = {
    id: 'math-numerical-calculus',
    version: '1.0.0',
    title: 'Numerical Calculus (Diff / Int)',
    description: 'Computes numerical derivative f’(x) and definite integral using Simpson’s 1/3 rule.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'f_xm1', label: 'f(x - h)', type: 'number', required: true, defaultValue: 0 },
        { id: 'f_x', label: 'f(x)', type: 'number', required: true, defaultValue: 1 },
        { id: 'f_xp1', label: 'f(x + h)', type: 'number', required: true, defaultValue: 4 },
        { id: 'h_step', label: 'Step size h', type: 'number', required: true, defaultValue: 1 },
    ],
    outputs: [
        { id: 'derivative_1st', label: '1st Derivative f’(x)', type: 'number' },
        { id: 'derivative_2nd', label: '2nd Derivative f’’(x)', type: 'number' },
        { id: 'simpson_integral', label: 'Integral [x-h, x+h]', type: 'number' },
    ],
    validate: (inputs: { h_step?: number }) => {
        if (!inputs.h_step || inputs.h_step <= 0) {
            return { valid: false, errors: ['Step size h must be positive and non-zero'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { f_xm1: number; f_x: number; f_xp1: number; h_step: number }) => {
        const ym1 = Number(inputs.f_xm1);
        const y0 = Number(inputs.f_x);
        const yp1 = Number(inputs.f_xp1);
        const h = Number(inputs.h_step);

        // Central Difference: f'(x) = (f(x+h) - f(x-h)) / (2h)
        const derivative_1st = (yp1 - ym1) / (2 * h);

        // Second Difference: f''(x) = (f(x+h) - 2f(x) + f(x-h)) / h^2
        const derivative_2nd = (yp1 - 2 * y0 + ym1) / (h * h);

        // Simpson's 1/3 Rule: Integral = (h/3) * (f(x-h) + 4f(x) + f(x+h))
        const simpson_integral = (h / 3) * (ym1 + 4 * y0 + yp1);

        return { derivative_1st, derivative_2nd, simpson_integral };
    },
};

// ---------------------------------------------------------------------------
// 5. Polynomial Roots Node (Quadratic & Cubic Solver)
// ---------------------------------------------------------------------------
export const PolynomialRootsNode: EngineeringNodeSchema = {
    id: 'math-poly-roots',
    version: '1.0.0',
    title: 'Polynomial Roots Solver',
    description: 'Finds real roots of quadratic (ax² + bx + c = 0) and cubic (ax³ + bx² + cx + d = 0) polynomials.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'Coefficient a (x³ or x²)', type: 'number', required: true, defaultValue: 1 },
        { id: 'b', label: 'Coefficient b (x² or x)', type: 'number', required: true, defaultValue: -3 },
        { id: 'c', label: 'Coefficient c (x or const)', type: 'number', required: true, defaultValue: 2 },
        { id: 'd', label: 'Coefficient d (for cubic)', type: 'number', required: false, defaultValue: 0 },
    ],
    outputs: [
        { id: 'root1', label: 'Root 1', type: 'number' },
        { id: 'root2', label: 'Root 2', type: 'number' },
        { id: 'root3', label: 'Root 3', type: 'number' },
        { id: 'real_root_count', label: 'Real Roots Count', type: 'number' },
        { id: 'discriminant', label: 'Discriminant Δ', type: 'number' },
    ],
    validate: (inputs: { a?: number }) => {
        if (inputs.a === 0 || inputs.a === undefined) {
            return { valid: false, errors: ['Leading coefficient a cannot be zero'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { a: number; b: number; c: number; d?: number }) => {
        const a = Number(inputs.a);
        const b = Number(inputs.b);
        const c = Number(inputs.c);
        const d = Number(inputs.d || 0);

        if (d === 0) {
            // Quadratic: ax² + bx + c = 0
            const discriminant = b * b - 4 * a * c;
            if (discriminant > 1e-12) {
                const sqrtD = Math.sqrt(discriminant);
                const r1 = (-b + sqrtD) / (2 * a);
                const r2 = (-b - sqrtD) / (2 * a);
                return { root1: r1, root2: r2, root3: 0, real_root_count: 2, discriminant };
            } else if (Math.abs(discriminant) <= 1e-12) {
                const r1 = -b / (2 * a);
                return { root1: r1, root2: r1, root3: 0, real_root_count: 1, discriminant: 0 };
            } else {
                return { root1: 0, root2: 0, root3: 0, real_root_count: 0, discriminant };
            }
        }

        // Cubic equation using Cardano-Vieta method: ax³ + bx² + cx + d = 0
        const p = (3 * a * c - b * b) / (3 * a * a);
        const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
        const discriminant = -(4 * p * p * p + 27 * q * q);

        const shift = -b / (3 * a);

        if (discriminant > 1e-12) {
            // 3 distinct real roots (Trigonometric Vieta solution)
            const r = Math.sqrt(-p / 3);
            const phi = Math.acos(-q / (2 * Math.pow(r, 3)));
            const root1 = 2 * r * Math.cos(phi / 3) + shift;
            const root2 = 2 * r * Math.cos((phi + 2 * Math.PI) / 3) + shift;
            const root3 = 2 * r * Math.cos((phi + 4 * Math.PI) / 3) + shift;
            return { root1, root2, root3, real_root_count: 3, discriminant };
        } else if (Math.abs(discriminant) <= 1e-12) {
            // Multiple real roots
            const root1 = 2 * Math.cbrt(-q / 2) + shift;
            const root2 = -Math.cbrt(-q / 2) + shift;
            return { root1, root2, root3: root2, real_root_count: 2, discriminant: 0 };
        } else {
            // 1 real root, 2 complex roots (Cardano)
            const u = Math.cbrt(-q / 2 + Math.sqrt((q * q) / 4 + (p * p * p) / 27));
            const v = Math.cbrt(-q / 2 - Math.sqrt((q * q) / 4 + (p * p * p) / 27));
            const root1 = u + v + shift;
            return { root1, root2: 0, root3: 0, real_root_count: 1, discriminant };
        }
    },
};

// ---------------------------------------------------------------------------
// 6. Statistics & Linear Regression Node
// ---------------------------------------------------------------------------
export const StatisticsRegressionNode: EngineeringNodeSchema = {
    id: 'math-statistics-regression',
    version: '1.0.0',
    title: 'Statistics & Linear Regression',
    description: 'Calculates mean, standard deviation, and best-fit linear regression (y = mx + c) with R².',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'data_x', label: 'X Data Points (JSON array)', type: 'json', required: true, defaultValue: [1, 2, 3, 4, 5] },
        { id: 'data_y', label: 'Y Data Points (JSON array)', type: 'json', required: true, defaultValue: [2.1, 3.9, 6.2, 8.1, 10.0] },
    ],
    outputs: [
        { id: 'slope_m', label: 'Slope m', type: 'number' },
        { id: 'intercept_c', label: 'Intercept c', type: 'number' },
        { id: 'r_squared', label: 'Coefficient of Determination R²', type: 'number' },
        { id: 'mean_x', label: 'Mean X', type: 'number' },
        { id: 'mean_y', label: 'Mean Y', type: 'number' },
        { id: 'std_y', label: 'Standard Deviation Y', type: 'number' },
    ],
    validate: (inputs: { data_x?: number[]; data_y?: number[] }) => {
        if (!Array.isArray(inputs.data_x) || !Array.isArray(inputs.data_y)) {
            return { valid: false, errors: ['Both X and Y inputs must be arrays of numbers'], warnings: [] };
        }
        if (inputs.data_x.length < 2 || inputs.data_y.length < 2) {
            return { valid: false, errors: ['At least 2 data points required'], warnings: [] };
        }
        if (inputs.data_x.length !== inputs.data_y.length) {
            return { valid: false, errors: ['X and Y arrays must have identical length'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { data_x: number[]; data_y: number[] }) => {
        const x = inputs.data_x.map(Number);
        const y = inputs.data_y.map(Number);
        const n = x.length;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const mean_x = sumX / n;
        const mean_y = sumY / n;

        let ssXX = 0;
        let ssYY = 0;
        let ssXY = 0;

        for (let i = 0; i < n; i++) {
            const dx = x[i] - mean_x;
            const dy = y[i] - mean_y;
            ssXX += dx * dx;
            ssYY += dy * dy;
            ssXY += dx * dy;
        }

        const slope_m = ssXX > 1e-12 ? ssXY / ssXX : 0;
        const intercept_c = mean_y - slope_m * mean_x;
        const r_squared = ssXX > 1e-12 && ssYY > 1e-12 ? (ssXY * ssXY) / (ssXX * ssYY) : 1;
        const std_y = Math.sqrt(ssYY / (n - 1));

        return {
            slope_m,
            intercept_c,
            r_squared,
            mean_x,
            mean_y,
            std_y,
        };
    },
};

import { EngineeringNodeSchema } from '@/flow/types/core';

// ------------------------------------------------------------------
// MATH: BASIC OPS
// ------------------------------------------------------------------
export const AddNode: EngineeringNodeSchema = {
    id: 'math-add',
    version: '1.0.0',
    title: 'Add (+)',
    description: 'Sum of two numbers.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 0 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a + inputs.b })
};

export const SubtractNode: EngineeringNodeSchema = {
    id: 'math-sub',
    version: '1.0.0',
    title: 'Subtract (-)',
    description: 'Difference of two numbers.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 0 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a - inputs.b })
};

export const MultiplyNode: EngineeringNodeSchema = {
    id: 'math-multiply',
    version: '1.0.0',
    title: 'Multiply (*)',
    description: 'Product of two numbers.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 1 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a * inputs.b })
};

export const DivideNode: EngineeringNodeSchema = {
    id: 'math-divide',
    version: '1.0.0',
    title: 'Divide (/)',
    description: 'Quotient of two numbers.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 1 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: (inputs: { b: number }) => ({
        valid: inputs.b !== 0,
        errors: inputs.b === 0 ? ['Division by zero'] : [],
        warnings: []
    }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a / inputs.b })
};

// ------------------------------------------------------------------
// MATH: ADVANCED
// ------------------------------------------------------------------
export const PowerNode: EngineeringNodeSchema = {
    id: 'math-pow',
    version: '1.0.0',
    title: 'Power (^)',
    description: 'A raised to power B.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'base', label: 'Base', type: 'number', required: true, defaultValue: 1 },
        { id: 'exp', label: 'Exponent', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { base: number, exp: number }) => ({ result: Math.pow(inputs.base, inputs.exp) })
};

export const SqrtNode: EngineeringNodeSchema = {
    id: 'math-sqrt',
    version: '1.0.0',
    title: 'Square Root',
    description: 'Square root of a number.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'val', label: 'Value', type: 'number', required: true, defaultValue: 1 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: (inputs) => ({
        valid: inputs.val >= 0,
        errors: inputs.val < 0 ? ['Cannot sqrt negative number'] : [],
        warnings: []
    }),
    compute: (inputs: { val: number }) => ({ result: Math.sqrt(inputs.val) })
};

// ------------------------------------------------------------------
// MATH: TRIG
// ------------------------------------------------------------------
export const SinNode: EngineeringNodeSchema = {
    id: 'math-sin',
    version: '1.0.0',
    title: 'Sin',
    description: 'Sine of angle (radians).',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'val', label: 'Angle (Rad)', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { val: number }) => ({ result: Math.sin(inputs.val) })
};

export const CosNode: EngineeringNodeSchema = {
    id: 'math-cos',
    version: '1.0.0',
    title: 'Cos',
    description: 'Cosine of angle (radians).',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'val', label: 'Angle (Rad)', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { val: number }) => ({ result: Math.cos(inputs.val) })
};

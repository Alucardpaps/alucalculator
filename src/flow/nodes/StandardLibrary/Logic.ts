import { EngineeringNodeSchema } from '@/flow/types/core';

// ------------------------------------------------------------------
// LOGIC: BRANCHING
// ------------------------------------------------------------------
export const IfNode: EngineeringNodeSchema = {
    id: 'logic-if',
    version: '1.0.0',
    title: 'If / Else',
    description: 'Switches output based on condition.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'condition', label: 'Condition', type: 'boolean', required: true, defaultValue: false },
        { id: 'trueVal', label: 'True Value', type: 'number', required: true, defaultValue: 0 },
        { id: 'falseVal', label: 'False Value', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { condition: boolean, trueVal: any, falseVal: any }) => ({
        result: inputs.condition ? inputs.trueVal : inputs.falseVal
    })
};

// ------------------------------------------------------------------
// LOGIC: COMPARISON
// ------------------------------------------------------------------
export const EqualNode: EngineeringNodeSchema = {
    id: 'logic-equal',
    version: '1.0.0',
    title: 'Equal (==)',
    description: 'Checks equality.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 0 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: any, b: any }) => ({ result: inputs.a === inputs.b })
};

export const GreaterNode: EngineeringNodeSchema = {
    id: 'logic-greater',
    version: '1.0.0',
    title: 'Greater (>)',
    description: 'Checks if A > B.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 0 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a > inputs.b })
};

export const LessNode: EngineeringNodeSchema = {
    id: 'logic-less',
    version: '1.0.0',
    title: 'Less (<)',
    description: 'Checks if A < B.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'number', required: true, defaultValue: 0 },
        { id: 'b', label: 'B', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: number, b: number }) => ({ result: inputs.a < inputs.b })
};

// ------------------------------------------------------------------
// LOGIC: BOOLEAN OPS
// ------------------------------------------------------------------
export const AndNode: EngineeringNodeSchema = {
    id: 'logic-and',
    version: '1.0.0',
    title: 'AND (&&)',
    description: 'Logical AND.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'boolean', required: true, defaultValue: false },
        { id: 'b', label: 'B', type: 'boolean', required: true, defaultValue: false }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: boolean, b: boolean }) => ({ result: inputs.a && inputs.b })
};

export const OrNode: EngineeringNodeSchema = {
    id: 'logic-or',
    version: '1.0.0',
    title: 'OR (||)',
    description: 'Logical OR.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'a', label: 'A', type: 'boolean', required: true, defaultValue: false },
        { id: 'b', label: 'B', type: 'boolean', required: true, defaultValue: false }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { a: boolean, b: boolean }) => ({ result: inputs.a || inputs.b })
};

export const NotNode: EngineeringNodeSchema = {
    id: 'logic-not',
    version: '1.0.0',
    title: 'NOT (!)',
    description: 'Logical NOT.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'val', label: 'Value', type: 'boolean', required: true, defaultValue: false }
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'boolean' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { val: boolean }) => ({ result: !inputs.val })
};

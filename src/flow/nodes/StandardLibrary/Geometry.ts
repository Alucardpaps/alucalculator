import { EngineeringNodeSchema } from '@/flow/types/core';

// ------------------------------------------------------------------
// GEOMETRY: PRIMITIVES
// ------------------------------------------------------------------
export const PointNode: EngineeringNodeSchema = {
    id: 'geo-point',
    version: '1.0.0',
    title: 'Point',
    description: 'Creates a 2D Point.',
    category: 'visualizer',
    deterministic: true,
    inputs: [
        { id: 'x', label: 'X', type: 'number', required: true, defaultValue: 0 },
        { id: 'y', label: 'Y', type: 'number', required: true, defaultValue: 0 }
    ],
    outputs: [{ id: 'geometry', label: 'Point', type: 'svg_geometry' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs: { x: number, y: number }) => ({
        geometry: { type: 'POINT', x: inputs.x, y: inputs.y }
    })
};

export const LineNode: EngineeringNodeSchema = {
    id: 'geo-line',
    version: '1.0.0',
    title: 'Line',
    description: 'Creates a Line between two points.',
    category: 'visualizer',
    deterministic: true,
    inputs: [
        { id: 'x1', label: 'X1', type: 'number', required: true, defaultValue: 0 },
        { id: 'y1', label: 'Y1', type: 'number', required: true, defaultValue: 0 },
        { id: 'x2', label: 'X2', type: 'number', required: true, defaultValue: 10 },
        { id: 'y2', label: 'Y2', type: 'number', required: true, defaultValue: 10 }
    ],
    outputs: [{ id: 'geometry', label: 'Line', type: 'svg_geometry' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs) => ({
        geometry: {
            type: 'LINE',
            start: { x: inputs.x1, y: inputs.y1 },
            end: { x: inputs.x2, y: inputs.y2 }
        }
    })
};

export const CircleNode: EngineeringNodeSchema = {
    id: 'geo-circle',
    version: '1.0.0',
    title: 'Circle',
    description: 'Creates a Circle.',
    category: 'visualizer',
    deterministic: true,
    inputs: [
        { id: 'cx', label: 'Center X', type: 'number', required: true, defaultValue: 0 },
        { id: 'cy', label: 'Center Y', type: 'number', required: true, defaultValue: 0 },
        { id: 'r', label: 'Radius', type: 'number', required: true, defaultValue: 5 }
    ],
    outputs: [{ id: 'geometry', label: 'Circle', type: 'svg_geometry' }],
    validate: (inputs) => ({
        valid: inputs.r >= 0,
        errors: inputs.r < 0 ? ['Radius cannot be negative'] : [],
        warnings: []
    }),
    compute: (inputs) => ({
        geometry: {
            type: 'CIRCLE',
            center: { x: inputs.cx, y: inputs.cy },
            radius: inputs.r
        }
    })
};

// ------------------------------------------------------------------
// GEOMETRY: OPERATIONS
// ------------------------------------------------------------------
export const DistanceNode: EngineeringNodeSchema = {
    id: 'geo-distance',
    version: '1.0.0',
    title: 'Distance',
    description: 'Euclidean distance between two points.',
    category: 'utility',
    deterministic: true,
    inputs: [
        { id: 'x1', label: 'X1', type: 'number', required: true, defaultValue: 0 },
        { id: 'y1', label: 'Y1', type: 'number', required: true, defaultValue: 0 },
        { id: 'x2', label: 'X2', type: 'number', required: true, defaultValue: 10 },
        { id: 'y2', label: 'Y2', type: 'number', required: true, defaultValue: 10 }
    ],
    outputs: [{ id: 'result', label: 'Distance', type: 'number' }],
    validate: () => ({ valid: true, errors: [], warnings: [] }),
    compute: (inputs) => {
        const dx = inputs.x2 - inputs.x1;
        const dy = inputs.y2 - inputs.y1;
        return { result: Math.sqrt(dx * dx + dy * dy) };
    }
};

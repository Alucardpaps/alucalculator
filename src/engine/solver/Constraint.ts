/**
 * engine/solver/Constraint.ts
 * 
 * Defines the core constraint types available for the Parametric Sketch Engine.
 */

export type ConstraintType =
    | 'coincident'
    | 'parallel'
    | 'perpendicular'
    | 'tangent'
    | 'horizontal'
    | 'vertical'
    | 'distance'
    | 'angle'
    | 'equal';

export interface Constraint {
    id: string;
    type: ConstraintType;
    entityIds: string[]; // GUIDs of the geometries involved
    value?: number; // Used for distance/angle
    isDriven?: boolean; // Driven dimension (reference only) vs Driving dimension
}

/**
 * Visual Dimension Entity contract for rendering dimensions on Canvas
 */
export interface DimensionEntity {
    id: string;
    constraintId: string;
    points: { x: number, y: number }[]; // Leader lines and attachment points
    textPosition: { x: number, y: number };
    displayText: string;
    layerId?: string;
}

/**
 * AluCAD Kernel — Multibody Data Model
 *
 * Each Body is an independent solid container holding sketches and features.
 * Bodies can be boolean-combined (union / subtract / intersect) at a later stage.
 *
 * ⚠️  Pure data types — NO React, NO UI.
 */

// ────────────────────────────────────────────────────
// TRANSFORM
// ────────────────────────────────────────────────────

export interface Transform {
    /** Translation in mm */
    position: { x: number; y: number; z: number };
    /** Euler rotation in degrees */
    rotation: { x: number; y: number; z: number };
}

export const IDENTITY_TRANSFORM: Transform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
};

// ────────────────────────────────────────────────────
// FEATURES
// ────────────────────────────────────────────────────

export type FeatureType =
    | 'EXTRUDE'
    | 'CUT'
    | 'REVOLVE'
    | 'FILLET'
    | 'CHAMFER'
    | 'SHELL'
    | 'MIRROR'
    | 'PATTERN';

export interface Feature {
    id: string;
    type: FeatureType;
    name: string;
    /** Reference to the sketch this feature operates on (optional) */
    sketchId?: string;
    /** Feature-specific parameters stored as key-value */
    params: Record<string, number | string | boolean>;
    /** Feature is suppressed (excluded from rebuild) */
    suppressed: boolean;
}

// ────────────────────────────────────────────────────
// BODY
// ────────────────────────────────────────────────────

export interface Body {
    id: string;
    name: string;
    /** IDs of sketches belonging to this body */
    sketches: string[];
    /** Ordered feature history — rebuild follows this order */
    features: Feature[];
    /** Body transform relative to assembly origin */
    transform: Transform;
    visible: boolean;
    /** Locked bodies cannot be edited */
    locked: boolean;
}

// ────────────────────────────────────────────────────
// BOOLEAN OPERATION (future assembly use)
// ────────────────────────────────────────────────────

export type BooleanOp = 'UNION' | 'SUBTRACT' | 'INTERSECT';

export interface BooleanOperation {
    id: string;
    type: BooleanOp;
    targetBodyId: string;
    toolBodyId: string;
}

// ────────────────────────────────────────────────────
// FACTORY HELPERS
// ────────────────────────────────────────────────────

export function createBody(name: string, id?: string): Body {
    return {
        id: id || crypto.randomUUID(),
        name,
        sketches: [],
        features: [],
        transform: { ...IDENTITY_TRANSFORM },
        visible: true,
        locked: false,
    };
}

export function createFeature(
    type: FeatureType,
    name: string,
    params: Record<string, number | string | boolean> = {},
    sketchId?: string,
): Feature {
    return {
        id: crypto.randomUUID(),
        type,
        name,
        sketchId,
        params,
        suppressed: false,
    };
}

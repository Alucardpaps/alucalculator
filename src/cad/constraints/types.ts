export type ConstraintType =
    | 'COINCIDENT'
    | 'PARALLEL'
    | 'PERPENDICULAR'
    | 'TANGENT'
    | 'HORIZONTAL'
    | 'VERTICAL'
    | 'DISTANCE'
    | 'ANGLE'
    | 'FIXED'
    | 'EQUAL_LENGTH'
    | 'CONCENTRIC'
    | 'MIDPOINT';

export interface Constraint {
    id: string;
    type: ConstraintType;
    entityIds: string[]; // Ordered list of involved entities
    active: boolean;
    value?: number;      // Target value (distance, angle, ref value)

    // Optional specific points on entities (e.g. for Coincident on a specific end of a line)
    // These could be normalized parameters (0=start, 1=end, 0.5=mid) or absolute coordinates if needed (though IDs are better)
    // For now we assume entities are points or we infer the closest point.
    // Better: use specific "Point" entities that happen to be endpoints of lines.
    // But for simple "Coincident(Line1.Start, Line2.End)", we need to know WHICH point.
    // We can use a convention: entityIds can be [LineID, PointID] or just [PointID, PointID].
}

export interface SolverState {
    iterations: number;
    error: number;
    converged: boolean;
}

export interface Variable {
    id: string;
    value: number;
    isFixed: boolean;
}

// Function signature for a specific constraint solver
// Returns the error (how far from satisfied)
// Mutates the entities in place (relaxation)
export type ConstraintSolverFunction = (
    entities: Map<string, any>,
    constraint: Constraint,
    helperMap?: Map<string, any> // For looking up parents/children if needed
) => number;

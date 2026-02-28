/**
 * CAD Kernel - Core Types
 * 
 * Defines the fundamental data structures for the geometric constraint solver.
 */

import { Constraint, ConstraintType, Variable } from '../constraints/types';

export type { Constraint, ConstraintType, Variable };

export type EntityId = string;
export type ConstraintId = string;

export interface Point {
    x: number;
    y: number;
}

export interface Viewport {
    center: Point;
    zoom: number;
    width: number;
    height: number;
}

export interface Layer {
    id: string;
    name: string;
    color: string;
    visible: boolean;
    locked: boolean;
    frozen: boolean;
    lineType: string;
    lineWeight: number;
}

export type CommandState = 'IDLE' | 'AWAITING_POINT' | 'AWAITING_VALUE' | 'PROCESSING';

// --------------------------------------------------------
// ENTITIES
// --------------------------------------------------------

export type EntityType = 'point' | 'line' | 'circle' | 'arc' | 'dimension';

export interface BaseEntity {
    id: EntityId;
    type: EntityType;
    visible: boolean;
}

export interface SketchPoint extends BaseEntity {
    type: 'point';
    x: Variable; // Reference to variable
    y: Variable; // Reference to variable
}

export interface SketchLine extends BaseEntity {
    type: 'line';
    p1: EntityId; // Start Point ID
    p2: EntityId; // End Point ID
}

export interface SketchCircle extends BaseEntity {
    type: 'circle';
    center: EntityId; // Center Point ID
    radius: Variable;
}

// --------------------------------------------------------
// SOLVER
// --------------------------------------------------------

export interface SolverState {
    variables: Map<string, Variable>;
    points: Map<EntityId, SketchPoint>;
    lines: Map<EntityId, SketchLine>;
    constraints: Map<ConstraintId, Constraint>;
    iterations: number;
    error: number;
    converged: boolean;
}

export interface SolverResult {
    converged: boolean;
    iterations: number;
    error: number;
    updatedSystem: SolverState;
}

// --------------------------------------------------------
// VISUALIZATION ENTITIES (Presentation Layer)
// --------------------------------------------------------

export interface LineGeometry {
    type: 'LINE';
    start: Point;
    end: Point;
}

export interface CircleGeometry {
    type: 'CIRCLE';
    center: Point;
    radius: number;
}

export interface ArcGeometry {
    type: 'ARC';
    center: Point;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export interface DimensionGeometry {
    type: 'DIMENSION';
    start: Point;
    end: Point;
    textPoint: Point;
    value: number;
    text?: string;
    offset?: number;
}

export interface PolylineGeometry {
    type: 'POLYLINE';
    vertices: Point[];
    closed: boolean;
}

export interface PointGeometry {
    type: 'POINT';
    x: number;
    y: number;
}

export type GeometryType = LineGeometry | CircleGeometry | PolylineGeometry | ArcGeometry | DimensionGeometry | PointGeometry;

export interface CadEntity {
    id: string;
    layerId: string;
    color: string;
    geometry: GeometryType;
    isVisible: boolean;
    isSelected: boolean;
}

// Factory Functions
export function createLineEntity(start: Point, end: Point, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'LINE', start, end }
    };
}

export function createPointEntity(x: number, y: number, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'POINT', x, y }
    };
}

export function createCircleEntity(center: Point, radius: number, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'CIRCLE', center, radius }
    };
}

export function createPolylineEntity(vertices: Point[], closed: boolean, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'POLYLINE', vertices, closed }
    };
}

// --------------------------------------------------------
// SNAPPING
// --------------------------------------------------------

export type OSnapMode = 'END' | 'MID' | 'CEN' | 'INT' | 'NEA' | 'PER' | 'TAN' | 'QUA';

export interface SnapResult {
    point: Point;
    mode: OSnapMode;
    entityId?: string;
}

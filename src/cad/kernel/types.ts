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

export type EntityType = 'point' | 'line' | 'circle' | 'arc' | 'dimension' | 'text' | 'gear' | 'fastener';

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
    /** Upper tolerance deviation (e.g. +0.05) */
    tolUpper?: number;
    /** Lower tolerance deviation (e.g. -0.01) */
    tolLower?: number;
}

export interface TextGeometry {
    type: 'TEXT';
    position: Point;
    content: string;
    fontSize: number;
    fontFamily: string;
    rotation: number;
    justification: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
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

export interface RectangleGeometry {
    type: 'RECTANGLE';
    center: Point;
    width: number;
    height: number;
    rotation?: number;
}

export interface HexagonGeometry {
    type: 'HEXAGON';
    center: Point;
    radius: number;
    rotation?: number;
}

export interface GearGeometry {
    type: 'GEAR';
    center: Point;
    module: number;
    teeth: number;
    pressureAngle: number;
    rotation?: number;
    width?: number; // Face width
    material?: string;
    analyticalData?: {
        torque?: number;
        power?: number;
        safetyFactor?: number;
        bendingStress?: number;
    };
}

export interface BeltPulleyGeometry {
    type: 'BELT_PULLEY';
    center1: Point;
    radius1: number;
    center2: Point;
    radius2: number;
    beltType: 'OPEN' | 'CROSSED';
}

export interface PlanetaryGearGeometry {
    type: 'PLANETARY_GEAR';
    center: Point;
    module: number;
    sunTeeth: number;
    planetTeeth: number;
    planetCount: number;
    rotationSun?: number;
    rotationCarrier?: number;
}

export interface FastenerGeometry {
    type: 'FASTENER';
    origin: Point;
    fastenerType: 'BOLT' | 'NUT';
    diameter: number;
    length: number;
    pitch: number;
    rotation?: number;
}


export type GeometryType = 
    | LineGeometry 
    | CircleGeometry 
    | PolylineGeometry 
    | ArcGeometry 
    | DimensionGeometry 
    | PointGeometry 
    | RectangleGeometry 
    | HexagonGeometry 
    | TextGeometry
    | GearGeometry
    | FastenerGeometry
    | BeltPulleyGeometry
    | PlanetaryGearGeometry;

export interface MachiningModifier {
    id: string; // Added ID for easier editing
    type: 'HOLE' | 'SURFACE_MILLED' | 'THREADED' | 'WELDED';
    x?: number;
    y?: number;
    diameter?: number;
    depth?: number;
    description?: string;
    weldSize?: number;
}

export interface CadEntity {
    id: string;
    layerId: string;
    color: string;
    geometry: GeometryType;
    isVisible: boolean;
    isSelected: boolean;
    isFixed?: boolean;
    modifiers?: MachiningModifier[];
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

export function createRectangleEntity(center: Point, width: number, height: number, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'RECTANGLE', center, width, height, rotation: 0 },
        modifiers: []
    };
}

export function createHexagonEntity(center: Point, radius: number, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'HEXAGON', center, radius, rotation: 0 },
        modifiers: []
    };
}

export function createGearEntity(center: Point, module: number, teeth: number, layerId: string, color: string): CadEntity {
    return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'GEAR', center, module, teeth, pressureAngle: 20, rotation: 0 }
    };
}

export function createFastenerEntity(origin: Point, type: 'BOLT' | 'NUT', diameter: number, length: number, pitch: number, layerId: string, color: string): CadEntity {
    return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'FASTENER', origin, fastenerType: type, diameter, length, pitch, rotation: 0 }
    };
}

export function createBeltPulleyEntity(c1: Point, r1: number, c2: Point, r2: number, layerId: string, color: string): CadEntity {
    return {
        id: crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'BELT_PULLEY', center1: c1, radius1: r1, center2: c2, radius2: r2, beltType: 'OPEN' }
    };
}

export function createPlanetaryGearEntity(center: Point, m: number, sunZ: number, planetZ: number, layerId: string, color: string): CadEntity {
    return {
        id: crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { 
            type: 'PLANETARY_GEAR', 
            center, 
            module: m, 
            sunTeeth: sunZ, 
            planetTeeth: planetZ, 
            planetCount: 3,
            rotationSun: 0,
            rotationCarrier: 0
        }
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
// --------------------------------------------------------
// UNITS
// --------------------------------------------------------

export type CadUnit = 'mm' | 'm' | 'in' | 'ft';

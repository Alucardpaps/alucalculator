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
    ccw?: boolean;
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

/** Regular polygon (the HEXAGON entity is also the N-sided POLYGON). */
export interface HexagonGeometry {
    type: 'HEXAGON';
    center: Point;
    /** circumscribed radius (centre → vertex) */
    radius: number;
    /** angle of vertex 0 (radians, counter-clockwise) */
    rotation?: number;
    /** number of sides, 3…100 (default 6) */
    sides?: number;
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
    view?: 'SIDE' | 'TOP';
    threadStyle?: 'SCHEMATIC' | 'DETAILED';
}

export interface SprocketGeometry {
    type: 'SPROCKET';
    center: Point;
    teeth: number;          // Number of teeth z
    pitch: number;          // Chain pitch p in mm (e.g. 12.7 for 08B)
    rollerDiameter: number; // Roller diameter d1 in mm (e.g. 8.51)
    boreDiameter: number;   // Shaft bore diameter in mm
    rotation?: number;      // Rotation in radians
}


export interface EllipseGeometry {
    type: 'ELLIPSE';
    center: Point;
    radiusX: number;
    radiusY: number;
    rotation?: number;
    startAngle?: number;
    endAngle?: number;
}

/** Smooth curve through the picked points (centripetal Catmull-Rom, see kernel/shapes). */
export interface SplineGeometry {
    type: 'SPLINE';
    /** the points the curve passes through */
    controlPoints: Point[];
    closed?: boolean;
}

export interface LeaderGeometry {
    type: 'LEADER';
    start: Point;
    end: Point;
    text: string;
}

export interface HatchGeometry {
    type: 'HATCH';
    boundaryVertices: Point[];
    holes?: Point[][];
    pattern: 'ANSI31' | 'SOLID' | 'CROSS' | 'HONEYCOMB';
    /** AutoCAD pattern scale (1 → ANSI31 lines 3.175 mm apart) */
    scale?: number;
    /** line angle in degrees (ANSI31 default 45) */
    angle?: number;
    strokeBorder?: boolean;
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
    | EllipseGeometry
    | SplineGeometry
    | LeaderGeometry
    | HatchGeometry
    | TextGeometry
    | GearGeometry
    | FastenerGeometry
    | BeltPulleyGeometry
    | PlanetaryGearGeometry
    | SprocketGeometry;


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
    groupId?: string;
    blockInstanceId?: string;
    isDynamic?: boolean;
    dynamicBlockId?: string;
    dynamicParams?: Record<string, any>;
    dynamicBasePoint?: Point;
    dynamicScale?: number;
    dynamicRotationRad?: number;
}

export type BlockCategory =
    | 'Templates'
    | 'TitleBlocks'
    | 'Symbols'
    | 'Fasteners'
    | 'Profiles'
    | 'Mounts'
    | 'Schematics'
    | 'Dynamic'
    | 'Custom'
    | string;

export interface BlockDefinition {
    id: string;
    name: string;
    description?: string;
    category?: BlockCategory;
    subcategory?: string;
    basePoint: Point;
    entities: CadEntity[];
    createdAt: number;
    updatedAt: number;
    isDynamic?: boolean;
    dynamicBlockId?: string;
    dynamicParams?: Record<string, any>;
}

// Factory Functions
export function createTextEntity(
    position: Point,
    content: string,
    fontSize = 10,
    layerId = 'layer-0',
    color = '#e7edf4',
    justification: 'left' | 'center' | 'right' = 'left',
    bold = false,
    italic = false,
    id?: string
): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: {
            type: 'TEXT',
            position,
            content,
            fontSize,
            fontFamily: 'JetBrains Mono, monospace',
            rotation: 0,
            justification,
            bold,
            italic
        }
    };
}
export function createLineEntity(
    start: Point,
    end: Point,
    layerIdOrColor = 'layer-0',
    color = '#ffffff',
    id?: string
): CadEntity {
    const isColor = typeof layerIdOrColor === 'string' && (layerIdOrColor.startsWith('#') || layerIdOrColor.startsWith('rgb'));
    const layer = isColor ? 'layer-0' : layerIdOrColor;
    const finalColor = isColor ? layerIdOrColor : color;
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId: layer,
        color: finalColor,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'LINE', start, end }
    };
}

export function createPointEntity(x: number, y: number, layerId = 'layer-0', color = '#ffffff', id?: string): CadEntity {
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'POINT', x, y }
    };
}

export function createCircleEntity(center: Point, radius: number, layerId = 'layer-0', color = '#ffffff', id?: string): CadEntity {
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'CIRCLE', center, radius }
    };
}

export function createArcEntity(
    center: Point,
    radius: number,
    startAngle = 0,
    endAngle = Math.PI * 2,
    layerIdOrColor = 'layer-0',
    color = '#ffffff',
    id?: string
): CadEntity {
    const isColor = typeof layerIdOrColor === 'string' && (layerIdOrColor.startsWith('#') || layerIdOrColor.startsWith('rgb'));
    const layer = isColor ? 'layer-0' : layerIdOrColor;
    const finalColor = isColor ? layerIdOrColor : color;
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId: layer,
        color: finalColor,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'ARC', center, radius, startAngle, endAngle }
    };
}

export function createPolylineEntity(vertices: Point[], closed: boolean, layerId = 'layer-0', color = '#ffffff', id?: string): CadEntity {
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'POLYLINE', vertices, closed }
    };
}

export function createRectangleEntity(
    center: Point,
    width: number,
    height: number,
    layerIdOrRot: string | number = 'layer-0',
    color = '#ffffff',
    id?: string
): CadEntity {
    let layer = 'layer-0';
    let finalColor = color;
    let rotation = 0;
    if (typeof layerIdOrRot === 'number') {
        rotation = layerIdOrRot;
    } else if (typeof layerIdOrRot === 'string') {
        if (layerIdOrRot.startsWith('#') || layerIdOrRot.startsWith('rgb')) {
            finalColor = layerIdOrRot;
        } else {
            layer = layerIdOrRot;
        }
    }
    return {
        id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent_${Math.random().toString(36).substring(2, 9)}`),
        layerId: layer,
        color: finalColor,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'RECTANGLE', center, width, height, rotation },
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

export function createFastenerEntity(
    origin: Point,
    type: 'BOLT' | 'NUT',
    diameter: number,
    length: number,
    pitch: number,
    layerId: string,
    color: string,
    rotation: number = -Math.PI / 2,
    view: 'SIDE' | 'TOP' = 'SIDE',
    threadStyle: 'SCHEMATIC' | 'DETAILED' = 'DETAILED'
): CadEntity {
    return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'FASTENER', origin, fastenerType: type, diameter, length, pitch, rotation, view, threadStyle }
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

export function createSprocketEntity(
    center: Point,
    teeth: number,
    pitch: number,
    rollerDiameter: number,
    boreDiameter: number,
    layerId: string,
    color: string
): CadEntity {
    return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: {
            type: 'SPROCKET',
            center,
            teeth,
            pitch,
            rollerDiameter,
            boreDiameter,
            rotation: 0
        }
    };
}

export function createEllipseEntity(
    center: Point, 
    radiusX: number, 
    radiusY: number, 
    layerId: string, 
    color: string, 
    rotation = 0, 
    id?: string,
    startAngle?: number,
    endAngle?: number
): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { 
            type: 'ELLIPSE', 
            center, 
            radiusX, 
            radiusY, 
            rotation,
            startAngle,
            endAngle
        }
    };
}

export function createSplineEntity(controlPoints: Point[], closed = false, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'SPLINE', controlPoints, closed }
    };
}

export function createLeaderEntity(start: Point, end: Point, text: string, layerId: string, color: string, id?: string): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: { type: 'LEADER', start, end, text }
    };
}

export function createHatchEntity(
    boundaryVertices: Point[],
    pattern: 'ANSI31' | 'SOLID' | 'CROSS' | 'HONEYCOMB',
    layerId: string,
    color: string,
    id?: string,
    holes?: Point[][],
    strokeBorder = true
): CadEntity {
    return {
        id: id || crypto.randomUUID(),
        layerId,
        color,
        isVisible: true,
        isSelected: false,
        geometry: {
            type: 'HATCH',
            boundaryVertices,
            holes,
            pattern,
            scale: 1,
            angle: 45,
            strokeBorder
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

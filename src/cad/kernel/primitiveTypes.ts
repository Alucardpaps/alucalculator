/**
 * AluCAD — drawing primitives (world coordinates, millimetres, radians, Y-up).
 *
 * Every entity decomposes into these few kinds (see `entityPrimitives`), which is what the
 * exporters, EXPLODE, hit testing and window selection consume.
 */

import type { Point } from './types';
import type { CubicSegment } from './shapes';

/** ISO 128 line meaning: visible outline, thin line, centre line, hidden line, other dashed line. */
export type PrimStyle = 'continuous' | 'thin' | 'center' | 'hidden' | 'dashed';

interface PrimBase {
    style: PrimStyle;
}

export interface LinePrim extends PrimBase { kind: 'line'; a: Point; b: Point }
export interface CirclePrim extends PrimBase { kind: 'circle'; c: Point; r: number; fill?: boolean }
/** Counter-clockwise arc from `start` to `end` (radians). */
export interface ArcPrim extends PrimBase { kind: 'arc'; c: Point; r: number; start: number; end: number }
/** Ellipse; `start`/`sweep` are parametric (sweep counter-clockwise, 2π = full). */
export interface EllipsePrim extends PrimBase {
    kind: 'ellipse'; c: Point; rx: number; ry: number; rotation: number; start: number; sweep: number;
}
/** Polyline; `bulges[i]` belongs to the segment from point i to point i+1 (+ = counter-clockwise). */
export interface PolylinePrim extends PrimBase {
    kind: 'polyline'; points: Point[]; bulges?: number[]; closed: boolean; fill?: boolean;
}
/** Smooth curve through `points` (exact as cubic Bézier segments). */
export interface SplinePrim extends PrimBase { kind: 'spline'; points: Point[]; closed: boolean; beziers: CubicSegment[] }
/** Text anchored at its top edge (AluCAD convention); `align` is horizontal. */
export interface TextPrim extends PrimBase {
    kind: 'text'; position: Point; content: string; height: number; rotation: number;
    align: 'left' | 'center' | 'right'; bold?: boolean; italic?: boolean;
}
export interface PointPrim extends PrimBase { kind: 'point'; p: Point }
/** Hatched / filled region (even-odd rings). */
export interface HatchPrim extends PrimBase {
    kind: 'hatch'; rings: Point[][]; pattern: 'ANSI31' | 'SOLID' | 'CROSS' | 'HONEYCOMB'; scale: number; angle: number;
}

export type Primitive =
    | LinePrim
    | CirclePrim
    | ArcPrim
    | EllipsePrim
    | PolylinePrim
    | SplinePrim
    | TextPrim
    | PointPrim
    | HatchPrim;

/**
 * 📐 AluCAD CAM Core — Geometric Primitives & Analytical Segment Models
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Pure deterministic geometry (Zero browser/UI dependencies)
 * - Supports true analytical lines and circular arcs (G01, G02, G03)
 * - Exact orientation calculation (CW vs CCW) for plasma cut directions
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface LineSegment {
  type: 'line';
  start: Point2D;
  end: Point2D;
  length: number;
}

export interface ArcSegment {
  type: 'arc';
  start: Point2D;
  end: Point2D;
  center: Point2D;
  radius: number;
  startAngleRad: number;
  endAngleRad: number;
  sweepAngleRad: number;
  clockwise: boolean;
  length: number;
}

export type Segment = LineSegment | ArcSegment;

export type ContourRole = 'outer' | 'hole';

export interface Contour {
  id: string;
  segments: Segment[];
  points: Point2D[];
  isClosed: boolean;
  role: ContourRole;
  area: number;
  bounds: BoundingBox;
  isClockwise: boolean;
  parentId?: string;
}

export interface CamPart {
  id: string;
  label: string;
  outerContour: Contour;
  holes: Contour[];
  quantity: number;
  allowedRotations: number[];
  material?: string;
  thicknessMm?: number;
  sourceFile?: string;
  cuttingMode?: 'common' | 'standalone' | 'auto';
  allowCommonLine?: boolean;
  enableBridge?: boolean;
  microjointCount?: number;
  microjointWidthMm?: number;
}

// ─── GEOMETRY HELPERS ───

export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createLineSegment(start: Point2D, end: Point2D): LineSegment {
  return {
    type: 'line',
    start,
    end,
    length: distance(start, end),
  };
}

export function createArcSegment(
  start: Point2D,
  end: Point2D,
  center: Point2D,
  radius: number,
  clockwise: boolean
): ArcSegment {
  let startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  let endAngle = Math.atan2(end.y - center.y, end.x - center.x);

  if (startAngle < 0) startAngle += 2 * Math.PI;
  if (endAngle < 0) endAngle += 2 * Math.PI;

  let sweep = 0;
  if (clockwise) {
    sweep = startAngle >= endAngle ? startAngle - endAngle : 2 * Math.PI - (endAngle - startAngle);
  } else {
    sweep = endAngle >= startAngle ? endAngle - startAngle : 2 * Math.PI - (startAngle - endAngle);
  }

  return {
    type: 'arc',
    start,
    end,
    center,
    radius,
    startAngleRad: startAngle,
    endAngleRad: endAngle,
    sweepAngleRad: sweep,
    clockwise,
    length: radius * sweep,
  };
}

/**
 * Computes polygon signed area using shoelace formula.
 * Positive = Counter-Clockwise (CCW), Negative = Clockwise (CW) in standard Cartesian Y-up
 */
export function computeSignedArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    sum += (p1.x * p2.y) - (p2.x * p1.y);
  }
  return sum / 2;
}

export function isPolygonClockwise(points: Point2D[]): boolean {
  return computeSignedArea(points) < 0;
}

export function computeBoundingBox(points: Point2D[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Tests whether a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Reverses a segment direction
 */
export function reverseSegment(seg: Segment): Segment {
  if (seg.type === 'line') {
    return createLineSegment(seg.end, seg.start);
  } else {
    return createArcSegment(seg.end, seg.start, seg.center, seg.radius, !seg.clockwise);
  }
}

/**
 * Reverses entire contour direction (flips CW <-> CCW)
 */
export function reverseContour(contour: Contour): Contour {
  const reversedSegments = [...contour.segments].reverse().map(reverseSegment);
  const reversedPoints = [...contour.points].reverse();
  return {
    ...contour,
    segments: reversedSegments,
    points: reversedPoints,
    isClockwise: !contour.isClockwise,
  };
}

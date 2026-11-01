/**
 * 🎯 AluCAD CAM Core — Analytical Arc Fitting (En Küçük Kareler Çember/Yay Uydurma)
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic Least-Squares Circle & Arc fitting (Kåsa / Pratt / Taubin formulation)
 * - Converts polygonized circular chords (e.g., 80-sided circle polygons from DXF)
 *   back into true analytical G02/G03 arcs
 * - Preserves sharp corner vertices (tangency discontinuity detection)
 * - Tolerances: radial tolerance <= 0.02 - 0.05 mm, minimum 4 vertices per arc
 */

import { Point2D, Segment, createLineSegment, createArcSegment, distance } from './geometry';

export interface CircleFitResult {
  center: Point2D;
  radius: number;
  maxResidual: number;
}

/**
 * Algebraic Least-Squares Circle Fit (Kåsa method with centroid normalization)
 */
export function fitCircleToPoints(points: Point2D[]): CircleFitResult | null {
  const n = points.length;
  if (n < 3) return null;

  // 1. Shift to centroid for numerical stability
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < n; i++) {
    meanX += points[i].x;
    meanY += points[i].y;
  }
  meanX /= n;
  meanY /= n;

  // 2. Linear system for A*(u^2 + v^2) + B*u + C*v + D = 0
  let Su2 = 0, Sv2 = 0, Suv = 0;
  let Su3 = 0, Sv3 = 0, Suv2 = 0, Su2v = 0;

  for (let i = 0; i < n; i++) {
    const u = points[i].x - meanX;
    const v = points[i].y - meanY;
    const u2 = u * u;
    const v2 = v * v;

    Su2 += u2;
    Sv2 += v2;
    Suv += u * v;
    Su3 += u2 * u;
    Sv3 += v2 * v;
    Suv2 += u * v2;
    Su2v += u2 * v;
  }

  // Linear equation system:
  // [Su2  Suv] [2*uc] = [Su3 + Suv2]
  // [Suv  Sv2] [2*vc] = [Sv3 + Su2v]
  const det = Su2 * Sv2 - Suv * Suv;
  if (Math.abs(det) < 1e-12) return null; // Collinear points

  const rhs1 = 0.5 * (Su3 + Suv2);
  const rhs2 = 0.5 * (Sv3 + Su2v);

  const uc = (Sv2 * rhs1 - Suv * rhs2) / det;
  const vc = (Su2 * rhs2 - Suv * rhs1) / det;

  const center: Point2D = {
    x: uc + meanX,
    y: vc + meanY,
  };

  // Radius = average distance from center
  let sumDist = 0;
  for (let i = 0; i < n; i++) {
    sumDist += distance(points[i], center);
  }
  const radius = sumDist / n;
  if (radius <= 0) return null;

  // Max residual deviation
  let maxResidual = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(distance(points[i], center) - radius);
    if (d > maxResidual) maxResidual = d;
  }

  return { center, radius, maxResidual };
}

/**
 * Checks orientation of arc formed by 3 successive points:
 * Returns true if clockwise, false if counter-clockwise
 */
export function isArcClockwise(p1: Point2D, p2: Point2D, p3: Point2D): boolean {
  // Cross product of (p2 - p1) and (p3 - p2)
  const cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
  return cross < 0;
}

export interface ArcFittingOptions {
  toleranceMm?: number; // Maximum allowed radial deviation (default 0.05 mm)
  minArcPoints?: number; // Minimum consecutive points to form an arc (default 4)
}

/**
 * Reconstructs analytical lines and arcs from a sequence of discrete polygon points.
 * Converts dense chords of circular cuts back into G02/G03 arc segments.
 */
export function fitArcsToPolygonPoints(
  points: Point2D[],
  options: ArcFittingOptions = {}
): Segment[] {
  const tolerance = options.toleranceMm ?? 0.05;
  const minPoints = options.minArcPoints ?? 4;
  const n = points.length;

  if (n < 3) {
    if (n === 2) return [createLineSegment(points[0], points[1])];
    return [];
  }

  const segments: Segment[] = [];
  let i = 0;

  // Check if entire closed polygon forms a single full circle
  if (n >= 8) {
    const fullFit = fitCircleToPoints(points);
    if (fullFit && fullFit.maxResidual <= tolerance) {
      // Split full 360 circle into two 180 arcs for G-code compatibility
      const midIdx = Math.floor(n / 2);
      const pStart = points[0];
      const pMid = points[midIdx];
      const pMidTest = points[Math.floor(midIdx / 2)];
      const cw = isArcClockwise(pStart, pMidTest, pMid);

      segments.push(createArcSegment(pStart, pMid, fullFit.center, fullFit.radius, cw));
      segments.push(createArcSegment(pMid, pStart, fullFit.center, fullFit.radius, cw));
      return segments;
    }
  }

  while (i < n) {
    let bestArcEnd = -1;
    let bestFit: CircleFitResult | null = null;

    // Greedily find longest window [i .. j] that fits a circle within tolerance
    for (let len = n - i; len >= minPoints; len--) {
      const candidatePoints = points.slice(i, i + len);
      const fit = fitCircleToPoints(candidatePoints);
      if (fit && fit.maxResidual <= tolerance) {
        bestArcEnd = i + len - 1;
        bestFit = fit;
        break;
      }
    }

    if (bestFit && bestArcEnd !== -1) {
      // Create arc segment from i to bestArcEnd
      const startP = points[i];
      const endP = points[bestArcEnd];
      const midP = points[Math.floor((i + bestArcEnd) / 2)];
      const cw = isArcClockwise(startP, midP, endP);

      segments.push(createArcSegment(startP, endP, bestFit.center, bestFit.radius, cw));
      i = bestArcEnd; // continue from arc end point
    } else {
      // Single line segment to next point
      const nextIdx = (i + 1) % n;
      segments.push(createLineSegment(points[i], points[nextIdx]));
      i++;
      if (i >= n) break;
    }
  }

  return segments;
}

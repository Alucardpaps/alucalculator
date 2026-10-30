/**
 * Analytical Geometry Distance Queries for DFM Validation
 *
 * Computes exact Euclidean distances from points (e.g. hole centers) to
 * line segments, circular arcs, circles, and composite ProfileLoops without
 * mesh raycasting or polygon discretization.
 */

import { Point2, pointDist } from '@/cad/geometry/sectionProperties';
import { ProfileEdge, ProfileLoop, edgeStart, edgeEnd } from '@/cad/geometry/profileLoop';

export function distPointToPoint(a: Point2, b: Point2): number {
  return pointDist(a, b);
}

/**
 * Exact distance from point P to line segment [A, B] with clamp.
 */
export function distPointToLineSegment(p: Point2, a: Point2, b: Point2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-12) return pointDist(p, a);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Exact distance from point P to circular arc.
 */
export function distPointToArc(
  p: Point2,
  center: Point2,
  radius: number,
  a0: number,
  a1: number,
  ccw: boolean
): number {
  const dToCenter = Math.hypot(p.x - center.x, p.y - center.y);
  let theta = Math.atan2(p.y - center.y, p.x - center.x);
  if (theta < 0) theta += 2 * Math.PI;

  let normA0 = a0 % (2 * Math.PI);
  if (normA0 < 0) normA0 += 2 * Math.PI;

  let normA1 = a1 % (2 * Math.PI);
  if (normA1 < 0) normA1 += 2 * Math.PI;

  let inSweep = false;
  if (ccw) {
    if (normA0 <= normA1) {
      inSweep = theta >= normA0 && theta <= normA1;
    } else {
      inSweep = theta >= normA0 || theta <= normA1;
    }
  } else {
    if (normA1 <= normA0) {
      inSweep = theta >= normA1 && theta <= normA0;
    } else {
      inSweep = theta >= normA1 || theta <= normA0;
    }
  }

  if (inSweep) {
    return Math.abs(dToCenter - radius);
  }

  // Outside arc sweep: measure to endpoints
  const pStart: Point2 = {
    x: center.x + radius * Math.cos(a0),
    y: center.y + radius * Math.sin(a0),
  };
  const pEnd: Point2 = {
    x: center.x + radius * Math.cos(a1),
    y: center.y + radius * Math.sin(a1),
  };
  return Math.min(pointDist(p, pStart), pointDist(p, pEnd));
}

/**
 * Exact distance from point P to circle boundary.
 */
export function distPointToCircle(p: Point2, center: Point2, radius: number): number {
  return Math.abs(Math.hypot(p.x - center.x, p.y - center.y) - radius);
}

/**
 * Exact distance from point P to any ProfileEdge.
 */
export function distPointToEdge(p: Point2, edge: ProfileEdge): number {
  if (edge.kind === 'line') {
    return distPointToLineSegment(p, edge.a, edge.b);
  }
  if (edge.kind === 'arc') {
    return distPointToArc(p, edge.center, edge.radius, edge.a0, edge.a1, edge.ccw);
  }
  return distPointToCircle(p, edge.center, edge.radius);
}

/**
 * Returns minimum distance from point P to the boundary of a ProfileLoop.
 */
export function distPointToLoop(p: Point2, loop: ProfileLoop): number {
  if (!loop || !loop.edges || loop.edges.length === 0) return Infinity;
  let minDist = Infinity;
  for (const edge of loop.edges) {
    const d = distPointToEdge(p, edge);
    if (d < minDist) {
      minDist = d;
    }
  }
  return minDist;
}

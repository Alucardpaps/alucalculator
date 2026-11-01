/**
 * Parametric 2D Profile Loop Kernel
 *
 * Preserves analytical geometry (lines, circular arcs, and true circles)
 * throughout 2D contour assembly, cross-module synchronization, and 3D extrusion.
 * Prevents premature polygon degradation (faceted 32-gons) and enables exact
 * 3D cylindrical hole rendering and concentric assembly mating.
 */

import { Point2, pointDist, shoelaceArea } from './sectionProperties';

export type ProfileEdge =
  | { kind: 'line'; a: Point2; b: Point2 }
  | { kind: 'arc'; center: Point2; radius: number; a0: number; a1: number; ccw: boolean }
  | { kind: 'circle'; center: Point2; radius: number };

export interface ProfileLoop {
  edges: ProfileEdge[];
  winding: 'ccw' | 'cw';
}

export interface ParametricRegion {
  outer: ProfileLoop;
  holes: ProfileLoop[];
  tessellation?: {
    outer: Point2[];
    holes: Point2[][];
  };
}

const DEFAULT_STITCH_TOL = 0.05; // mm

/**
 * Returns the starting point of an edge.
 */
export function edgeStart(edge: ProfileEdge): Point2 {
  if (edge.kind === 'line') return { ...edge.a };
  if (edge.kind === 'arc') {
    return {
      x: edge.center.x + edge.radius * Math.cos(edge.a0),
      y: edge.center.y + edge.radius * Math.sin(edge.a0),
    };
  }
  // Circle convention: start at angle 0
  return {
    x: edge.center.x + edge.radius,
    y: edge.center.y,
  };
}

/**
 * Returns the terminal point of an edge.
 */
export function edgeEnd(edge: ProfileEdge): Point2 {
  if (edge.kind === 'line') return { ...edge.b };
  if (edge.kind === 'arc') {
    return {
      x: edge.center.x + edge.radius * Math.cos(edge.a1),
      y: edge.center.y + edge.radius * Math.sin(edge.a1),
    };
  }
  return {
    x: edge.center.x + edge.radius,
    y: edge.center.y,
  };
}

/**
 * Reverses a profile edge.
 */
export function reverseEdge(edge: ProfileEdge): ProfileEdge {
  if (edge.kind === 'line') {
    return { kind: 'line', a: { ...edge.b }, b: { ...edge.a } };
  }
  if (edge.kind === 'arc') {
    return {
      kind: 'arc',
      center: { ...edge.center },
      radius: edge.radius,
      a0: edge.a1,
      a1: edge.a0,
      ccw: !edge.ccw,
    };
  }
  return { ...edge };
}

/**
 * Samples a profile edge into discrete points for tessellation / 2D drawing / Shoelace.
 */
export function sampleEdge(edge: ProfileEdge, curveSegments = 16): Point2[] {
  if (edge.kind === 'line') {
    return [{ ...edge.a }, { ...edge.b }];
  }
  if (edge.kind === 'circle') {
    const pts: Point2[] = [];
    const n = Math.max(16, curveSegments * 2);
    for (let i = 0; i < n; i++) {
      const theta = (2 * Math.PI * i) / n;
      pts.push({
        x: edge.center.x + edge.radius * Math.cos(theta),
        y: edge.center.y + edge.radius * Math.sin(theta),
      });
    }
    return pts;
  }
  // Arc
  const pts: Point2[] = [];
  let sweep = edge.a1 - edge.a0;
  if (edge.ccw && sweep < 0) sweep += 2 * Math.PI;
  if (!edge.ccw && sweep > 0) sweep -= 2 * Math.PI;

  const n = Math.max(4, Math.round((Math.abs(sweep) / (2 * Math.PI)) * curveSegments * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = edge.a0 + sweep * t;
    pts.push({
      x: edge.center.x + edge.radius * Math.cos(a),
      y: edge.center.y + edge.radius * Math.sin(a),
    });
  }
  return pts;
}

/**
 * Samples an entire ProfileLoop into discrete Point2[] vertices.
 */
export function sampleLoop(loop: ProfileLoop, curveSegments = 16): Point2[] {
  if (loop.edges.length === 1 && loop.edges[0].kind === 'circle') {
    const pts = sampleEdge(loop.edges[0], curveSegments);
    const area = shoelaceArea(pts);
    if ((loop.winding === 'ccw' && area < 0) || (loop.winding === 'cw' && area > 0)) {
      pts.reverse();
    }
    return pts;
  }

  const result: Point2[] = [];
  for (let i = 0; i < loop.edges.length; i++) {
    const edge = loop.edges[i];
    const pts = sampleEdge(edge, curveSegments);
    if (result.length === 0) {
      result.push(...pts);
    } else {
      // Avoid duplicate consecutive point at the junction
      for (let j = 1; j < pts.length; j++) {
        result.push(pts[j]);
      }
    }
  }

  // Remove duplicate closing point if identical to first
  if (result.length > 2 && pointDist(result[0], result[result.length - 1]) < DEFAULT_STITCH_TOL) {
    result.pop();
  }

  const area = shoelaceArea(result);
  if ((loop.winding === 'ccw' && area < 0) || (loop.winding === 'cw' && area > 0)) {
    result.reverse();
  }

  return result;
}

/**
 * Creates a single circular profile loop.
 */
export function circleLoop(center: Point2, radius: number, ccw = true): ProfileLoop {
  return {
    edges: [{ kind: 'circle', center: { ...center }, radius }],
    winding: ccw ? 'ccw' : 'cw',
  };
}

/**
 * Creates a rectangular profile loop from center and dimensions.
 */
export function rectangleLoop(center: Point2, width: number, height: number, rotation = 0): ProfileLoop {
  const hw = width / 2;
  const hh = height / 2;
  const local: Point2[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  const pts = local.map((p) => ({
    x: center.x + p.x * c - p.y * s,
    y: center.y + p.x * s + p.y * c,
  }));

  const edges: ProfileEdge[] = [
    { kind: 'line', a: pts[0], b: pts[1] },
    { kind: 'line', a: pts[1], b: pts[2] },
    { kind: 'line', a: pts[2], b: pts[3] },
    { kind: 'line', a: pts[3], b: pts[0] },
  ];

  return {
    edges,
    winding: 'ccw',
  };
}

/**
 * Creates a ProfileLoop from an array of polygonal vertices.
 */
export function pointsToProfileLoop(points: Point2[], winding: 'ccw' | 'cw' = 'ccw'): ProfileLoop {
  const edges: ProfileEdge[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    edges.push({
      kind: 'line',
      a: { ...points[i] },
      b: { ...points[(i + 1) % n] },
    });
  }
  return { edges, winding };
}

/**
 * Stitches arbitrary open and closed edges into closed ProfileLoops.
 * Preserves lines and arcs without polygonal discretization.
 */
export function stitchProfileEdges(rawEdges: ProfileEdge[], tol = DEFAULT_STITCH_TOL): ProfileLoop[] {
  const loops: ProfileLoop[] = [];
  const openEdges: ProfileEdge[] = [];

  for (const edge of rawEdges) {
    if (edge.kind === 'circle') {
      loops.push({ edges: [edge], winding: 'ccw' });
      continue;
    }
    // Check if edge is already a closed loop
    const start = edgeStart(edge);
    const end = edgeEnd(edge);
    if (pointDist(start, end) < tol) {
      loops.push({ edges: [edge], winding: 'ccw' });
      continue;
    }
    openEdges.push(edge);
  }

  const unused = openEdges.slice();

  while (unused.length > 0) {
    const currentChain: ProfileEdge[] = [unused.shift()!];
    let closed = false;

    while (!closed && unused.length > 0) {
      const tail = edgeEnd(currentChain[currentChain.length - 1]);
      const chainStart = edgeStart(currentChain[0]);

      // Check if current chain is closed on itself
      if (currentChain.length >= 2 && pointDist(tail, chainStart) < tol) {
        closed = true;
        break;
      }

      let bestIdx = -1;
      let bestDist = tol;
      let reverseMatch = false;

      for (let i = 0; i < unused.length; i++) {
        const candidate = unused[i];
        const cStart = edgeStart(candidate);
        const cEnd = edgeEnd(candidate);

        const dForward = pointDist(tail, cStart);
        if (dForward < bestDist) {
          bestDist = dForward;
          bestIdx = i;
          reverseMatch = false;
        }

        const dReverse = pointDist(tail, cEnd);
        if (dReverse < bestDist) {
          bestDist = dReverse;
          bestIdx = i;
          reverseMatch = true;
        }
      }

      if (bestIdx >= 0) {
        const [nextEdge] = unused.splice(bestIdx, 1);
        currentChain.push(reverseMatch ? reverseEdge(nextEdge) : nextEdge);
      } else {
        // No matching continuation found within tolerance
        break;
      }
    }

    const firstPoint = edgeStart(currentChain[0]);
    const lastPoint = edgeEnd(currentChain[currentChain.length - 1]);
    if (pointDist(firstPoint, lastPoint) < tol && currentChain.length >= 2) {
      // Calculate winding via sample points
      const pts = sampleLoop({ edges: currentChain, winding: 'ccw' }, 8);
      const area = shoelaceArea(pts);
      loops.push({
        edges: currentChain,
        winding: area >= 0 ? 'ccw' : 'cw',
      });
    }
  }

  return loops;
}

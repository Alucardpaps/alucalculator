export interface Point2D {
  x: number;
  y: number;
}

export interface SketchEntity {
  id: string;
  type: 'line' | 'polyline' | 'circle' | 'circle_2p' | 'arc' | 'arc_semi' | 'arc_3p' | 'ellipse' | 'rect' | 'slot' | 'polygon' | 'block';
  points: Point2D[];
  center?: Point2D;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  startAngle?: number;
  endAngle?: number;
  width?: number;
  height?: number;
  isClosed: boolean;
  isConstruction: boolean;
  name?: string;
  blockType?: string;
  angleDeg?: number;
}

export interface ProcessedContour {
  id: string;
  name: string;
  points: Point2D[];
  isClosed: boolean;
  wasGapHealed: boolean;
  gapSize?: number;
  isOpenProfile: boolean;
  type: string;
  radius?: number;
  width?: number;
  height?: number;
  center?: Point2D;
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
function dist2D(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Converts a 2D path (open polyline/arc or closed loop) into a closed ribbon polygon with wall thickness.
 * Mimics SolidWorks Thin Feature.
 */
export function convertPathToThinRibbon(
  pts: Point2D[],
  thicknessMm = 2,
  isClosed = false
): Point2D[] {
  if (!pts || pts.length < 2) return pts || [];
  const h = Math.max(0.2, thicknessMm) / 2;

  // If path is explicitly closed or first point equals last point
  const reallyClosed =
    isClosed ||
    (pts.length >= 3 &&
      Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-2);

  const cleanPts =
    reallyClosed &&
    pts.length >= 3 &&
    Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 1e-2
      ? pts.slice(0, -1)
      : [...pts];

  const N = cleanPts.length;
  if (N < 2) return pts;

  const left: Point2D[] = [];
  const right: Point2D[] = [];

  for (let i = 0; i < N; i++) {
    const prev = reallyClosed ? cleanPts[(i - 1 + N) % N] : cleanPts[Math.max(0, i - 1)];
    const curr = cleanPts[i];
    const next = reallyClosed ? cleanPts[(i + 1) % N] : cleanPts[Math.min(N - 1, i + 1)];

    let nx = 0;
    let ny = 0;

    if (i === 0 && !reallyClosed) {
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else if (i === N - 1 && !reallyClosed) {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      nx = -dy / len;
      ny = dx / len;
    } else {
      const d1x = curr.x - prev.x;
      const d1y = curr.y - prev.y;
      const len1 = Math.hypot(d1x, d1y) || 1;
      const n1x = -d1y / len1;
      const n1y = d1x / len1;

      const d2x = next.x - curr.x;
      const d2y = next.y - curr.y;
      const len2 = Math.hypot(d2x, d2y) || 1;
      const n2x = -d2y / len2;
      const n2y = d2x / len2;

      const avgX = n1x + n2x;
      const avgY = n1y + n2y;
      const avgLen = Math.hypot(avgX, avgY);

      if (avgLen > 1e-3) {
        const dot = n1x * (avgX / avgLen) + n1y * (avgY / avgLen);
        const miter = Math.min(2.5, 1 / Math.max(0.3, dot));
        nx = (avgX / avgLen) * miter;
        ny = (avgY / avgLen) * miter;
      } else {
        nx = n1x;
        ny = n1y;
      }
    }

    right.push({
      x: Math.round((curr.x + nx * h) * 100) / 100,
      y: Math.round((curr.y + ny * h) * 100) / 100,
    });
    left.push({
      x: Math.round((curr.x - nx * h) * 100) / 100,
      y: Math.round((curr.y - ny * h) * 100) / 100,
    });
  }

  if (reallyClosed) {
    return [...right, right[0], ...left.slice().reverse(), left[left.length - 1]];
  }

  // Open path ribbon: Right side from 0 to N-1, then Left side from N-1 down to 0
  return [...right, ...left.reverse()];
}

/**
 * Chains fragmented line/arc segments end-to-end and heals gaps.
 * If start and end are open and cannot be closed, marks as open profile (Thin Feature candidate).
 */
export function chainAndResolveSketchContours(
  sketchEntities: SketchEntity[],
  activeSketchPoints: Point2D[] = [],
  options: {
    snapToleranceMm?: number;
    gapHealToleranceMm?: number;
    defaultWallThicknessMm?: number;
    isConstructionMode?: boolean;
    thinWallEnabled?: boolean;
  } = {}
): ProcessedContour[] {
  const snapTol = options.snapToleranceMm ?? 15;
  const gapHealTol = options.gapHealToleranceMm ?? 35;
  const wallThickness = options.defaultWallThicknessMm ?? 2;
  const thinWallForce = options.thinWallEnabled ?? false;

  const result: ProcessedContour[] = [];

  // 1. Incorporate active uncommitted sketch points (if at least 2 points)
  const allEntities = [...sketchEntities.filter((e) => !e.isConstruction)];
  const isPointsAlreadyInEntity = sketchEntities.some(
    (e) =>
      e.points === activeSketchPoints ||
      (e.points.length === activeSketchPoints.length &&
        e.points[0]?.x === activeSketchPoints[0]?.x &&
        e.points[0]?.y === activeSketchPoints[0]?.y)
  );

  if (activeSketchPoints.length >= 2 && !options.isConstructionMode && !isPointsAlreadyInEntity) {
    allEntities.push({
      id: 'active-sketch-line',
      type: activeSketchPoints.length === 2 ? 'line' : 'polyline',
      points: [...activeSketchPoints],
      isClosed: false,
      isConstruction: false,
      name: 'Aktif Çizim Hattı',
    });
  }

  // 2. Separate closed primitives from open line segments
  const closedPrimitives: SketchEntity[] = [];
  const openSegments: Array<{ id: string; name: string; points: Point2D[]; type: string }> = [];

  allEntities.forEach((ent, idx) => {
    const isExplicitClosedPrimitive =
      ent.type === 'circle' ||
      ent.type === 'circle_2p' ||
      ent.type === 'rect' ||
      ent.type === 'polygon' ||
      ent.type === 'ellipse' ||
      ent.type === 'slot';

    if (isExplicitClosedPrimitive && ent.points && ent.points.length >= 3) {
      closedPrimitives.push(ent);
      return;
    }

    if (ent.isClosed && ent.points && ent.points.length >= 3) {
      closedPrimitives.push(ent);
      return;
    }

    // Single entity with first point close to last point (gap <= snapTol)
    if (ent.points && ent.points.length >= 3) {
      const d = dist2D(ent.points[0], ent.points[ent.points.length - 1]);
      if (d <= snapTol) {
        closedPrimitives.push({
          ...ent,
          isClosed: true,
          points: d > 0.05 ? [...ent.points, { ...ent.points[0] }] : ent.points,
        });
        return;
      }
    }

    if (ent.points && ent.points.length >= 2) {
      openSegments.push({
        id: ent.id || `seg-${idx}`,
        name: ent.name || `Çizgi Segmenti #${idx + 1}`,
        points: [...ent.points],
        type: ent.type || 'line',
      });
    }
  });

  // 3. Add closed primitives directly
  closedPrimitives.forEach((prim, idx) => {
    result.push({
      id: prim.id || `closed-prim-${idx}`,
      name: prim.name || `Kapalı Kontur #${idx + 1}`,
      points: prim.points,
      isClosed: true,
      wasGapHealed: false,
      isOpenProfile: false,
      type: prim.type || 'polygon',
      radius: prim.radius,
      width: prim.width,
      height: prim.height,
      center: prim.center,
    });
  });

  // 4. Graph Chaining Algorithm for open segments
  const pool = [...openSegments];

  while (pool.length > 0) {
    const current = pool.shift()!;
    let chain = [...current.points];
    let mergedAny = true;

    while (mergedAny && pool.length > 0) {
      mergedAny = false;
      const head = chain[0];
      const tail = chain[chain.length - 1];

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        const candHead = candidate.points[0];
        const candTail = candidate.points[candidate.points.length - 1];

        // Tail -> Candidate Head
        if (dist2D(tail, candHead) <= snapTol) {
          chain.push(...candidate.points.slice(1));
          pool.splice(i, 1);
          mergedAny = true;
          break;
        }

        // Tail -> Candidate Tail (reverse candidate)
        if (dist2D(tail, candTail) <= snapTol) {
          const rev = [...candidate.points].reverse();
          chain.push(...rev.slice(1));
          pool.splice(i, 1);
          mergedAny = true;
          break;
        }

        // Head -> Candidate Tail
        if (dist2D(head, candTail) <= snapTol) {
          chain.unshift(...candidate.points.slice(0, -1));
          pool.splice(i, 1);
          mergedAny = true;
          break;
        }

        // Head -> Candidate Head (reverse candidate)
        if (dist2D(head, candHead) <= snapTol) {
          const rev = [...candidate.points].reverse();
          chain.unshift(...rev.slice(0, -1));
          pool.splice(i, 1);
          mergedAny = true;
          break;
        }
      }
    }

    // 5. Evaluate the continuous chain: closed vs healed gap vs open profile
    const head = chain[0];
    const tail = chain[chain.length - 1];
    const gap = dist2D(head, tail);

    if (chain.length >= 3 && gap <= 0.5) {
      // Naturally closed
      result.push({
        id: current.id,
        name: current.name || `Zincir Kontur #${result.length + 1}`,
        points: chain,
        isClosed: true,
        wasGapHealed: false,
        isOpenProfile: false,
        type: current.type === 'line' ? 'polygon' : current.type,
      });
    } else if (chain.length >= 3 && gap <= gapHealTol && !thinWallForce) {
      // Gap within heal tolerance: Automatically close the gap!
      const healedPoints = [...chain, { x: head.x, y: head.y }];
      result.push({
        id: current.id,
        name: `${current.name || 'Kontur'} (Açıklık Kapatıldı)`,
        points: healedPoints,
        isClosed: true,
        wasGapHealed: true,
        gapSize: Math.round(gap * 10) / 10,
        isOpenProfile: false,
        type: 'polygon',
      });
    } else {
      // Open profile (either gap > tolerance or forced thin wall or open line/arc)
      // "Açıklık olsa bile profil var yine katı oluşması lazım"
      const ribbonPoints = convertPathToThinRibbon(chain, wallThickness, false);
      result.push({
        id: current.id,
        name: `${current.name || 'Profil'} (İnce Unsur ${wallThickness}mm)`,
        points: ribbonPoints,
        isClosed: false,
        wasGapHealed: false,
        gapSize: Math.round(gap * 10) / 10,
        isOpenProfile: true,
        type: current.type || 'polyline',
      });
    }
  }

  return result;
}

/**
 * Returns human-readable diagnostic messages for user notifications.
 */
export function getContourDiagnosticMessages(
  contours: ProcessedContour[],
  lang: 'tr' | 'en' = 'tr'
): string[] {
  const msgs: string[] = [];

  contours.forEach((c) => {
    if (c.wasGapHealed && c.gapSize && c.gapSize > 0.5) {
      msgs.push(
        lang === 'tr'
          ? `📐 Çizimdeki ${c.gapSize} mm açıklık tespit edildi ve otomatik kapatıldı.`
          : `📐 Detected ${c.gapSize} mm gap in sketch and automatically closed it.`
      );
    }
    if (c.isOpenProfile) {
      msgs.push(
        lang === 'tr'
          ? `📏 Açık profil algılandı: Çizgiye et kalınlığı (Thin Feature) verilerek katı oluşturuldu.`
          : `📏 Open profile detected: Extruded using Thin Feature wall thickness.`
      );
    }
  });

  return msgs;
}

// ═══════════════════════════════════════════════════════════════
// 2D CAD SKETCH TRIMMING, SPLITTING & PARAMETRIC PROPERTY EDITING
// ═══════════════════════════════════════════════════════════════

/**
 * Strict segment-segment intersection between (p1, p2) and (p3, p4).
 * Returns the intersection point and parameters t1, t2 in [0, 1].
 */
export function intersectSegments(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): { pt: Point2D; t1: number; t2: number } | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-6) return null;

  const t1 = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const t2 = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  if (t1 >= 1e-4 && t1 <= 1 - 1e-4 && t2 >= 1e-4 && t2 <= 1 - 1e-4) {
    return {
      pt: {
        x: Math.round((p1.x + t1 * (p2.x - p1.x)) * 100) / 100,
        y: Math.round((p1.y + t1 * (p2.y - p1.y)) * 100) / 100,
      },
      t1,
      t2,
    };
  }
  return null;
}

/**
 * Calculates Euclidean distance from a point to a 2D line segment (a, b).
 */
export function distancePointToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Decomposes polylines/rects/lines into individual 2-point line segments.
 */
function extractLineSegmentsFromEntity(e: SketchEntity): { id: string; p1: Point2D; p2: Point2D; originalEntity: SketchEntity }[] {
  const segs: { id: string; p1: Point2D; p2: Point2D; originalEntity: SketchEntity }[] = [];
  if (!e.points || e.points.length < 2) return segs;

  const n = e.points.length;
  const count = e.isClosed && n > 2 ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p1 = e.points[i];
    const p2 = e.points[(i + 1) % n];
    if (dist2D(p1, p2) > 0.1) {
      segs.push({
        id: `${e.id}-seg-${i}`,
        p1,
        p2,
        originalEntity: e,
      });
    }
  }
  return segs;
}

/**
 * Finds all intersections among line entities and splits them into sub-segments.
 */
export function splitAllIntersectingLines(entities: SketchEntity[]): SketchEntity[] {
  const segments: { p1: Point2D; p2: Point2D; isConstruction: boolean; name?: string }[] = [];
  const nonLineEntities: SketchEntity[] = [];

  for (const e of entities) {
    if (
      e.type === 'circle' ||
      e.type === 'circle_2p' ||
      e.type === 'ellipse' ||
      e.type === 'arc' ||
      e.type === 'arc_semi' ||
      e.type === 'arc_3p'
    ) {
      nonLineEntities.push(e);
      continue;
    }
    const extracted = extractLineSegmentsFromEntity(e);
    for (const s of extracted) {
      segments.push({
        p1: s.p1,
        p2: s.p2,
        isConstruction: e.isConstruction,
        name: e.name,
      });
    }
  }

  if (segments.length === 0) return entities;

  const splitSegments: { p1: Point2D; p2: Point2D; isConstruction: boolean; name?: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const s1 = segments[i];
    const splitPoints: { pt: Point2D; t: number }[] = [];

    for (let j = 0; j < segments.length; j++) {
      if (i === j) continue;
      const s2 = segments[j];
      const inter = intersectSegments(s1.p1, s1.p2, s2.p1, s2.p2);
      if (inter) {
        splitPoints.push({ pt: inter.pt, t: inter.t1 });
      }
    }

    if (splitPoints.length === 0) {
      splitSegments.push(s1);
    } else {
      splitPoints.sort((a, b) => a.t - b.t);
      const uniquePoints: Point2D[] = [];
      for (const sp of splitPoints) {
        if (uniquePoints.length === 0 || dist2D(uniquePoints[uniquePoints.length - 1], sp.pt) > 0.1) {
          uniquePoints.push(sp.pt);
        }
      }

      let currentStart = s1.p1;
      for (const pt of uniquePoints) {
        if (dist2D(currentStart, pt) > 0.1) {
          splitSegments.push({
            p1: currentStart,
            p2: pt,
            isConstruction: s1.isConstruction,
            name: s1.name,
          });
          currentStart = pt;
        }
      }
      if (dist2D(currentStart, s1.p2) > 0.1) {
        splitSegments.push({
          p1: currentStart,
          p2: s1.p2,
          isConstruction: s1.isConstruction,
          name: s1.name,
        });
      }
    }
  }

  const result: SketchEntity[] = [...nonLineEntities];
  let seq = 1;
  for (const seg of splitSegments) {
    result.push({
      id: `line-${Date.now().toString(36)}-${seq++}`,
      type: 'line',
      points: [seg.p1, seg.p2],
      isClosed: false,
      isConstruction: seg.isConstruction,
      name: seg.name || `Çizgi #${seq}`,
    });
  }

  return result;
}

/**
 * Trims a sketch entity segment closest to the pickPoint (AutoCAD / SolidWorks Trim Tool).
 */
export function trimEntityAtPoint(
  entities: SketchEntity[],
  pickPoint: Point2D,
  toleranceMm = 15
): { updatedEntities: SketchEntity[]; trimmed: boolean; trimmedId?: string } {
  const splitEntities = splitAllIntersectingLines(entities);

  let closestIdx = -1;
  let minDist = Infinity;

  for (let i = 0; i < splitEntities.length; i++) {
    const e = splitEntities[i];
    if (e.points && e.points.length >= 2) {
      for (let j = 0; j < e.points.length - 1; j++) {
        const d = distancePointToSegment(pickPoint, e.points[j], e.points[j + 1]);
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }
    } else if (e.center && e.radius) {
      const d = Math.abs(dist2D(pickPoint, e.center) - e.radius);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }
  }

  if (closestIdx !== -1 && minDist <= toleranceMm) {
    const trimmedId = splitEntities[closestIdx].id;
    const remaining = splitEntities.filter((_, idx) => idx !== closestIdx);
    return {
      updatedEntities: remaining,
      trimmed: true,
      trimmedId,
    };
  }

  return {
    updatedEntities: entities,
    trimmed: false,
  };
}

/**
 * Automatically trims dead-end overhangs / dangling tails extending past intersection points (e.g. Image 1).
 * Leaves clean closed loops and junctions intact.
 */
export function autoTrimOverhangs(
  entities: SketchEntity[]
): { updatedEntities: SketchEntity[]; trimmedCount: number } {
  let currentEntities = splitAllIntersectingLines(entities);
  let totalTrimmed = 0;
  let changed = true;

  while (changed) {
    changed = false;

    const vertices: { pt: Point2D; degree: number }[] = [];
    const getVertexIndex = (p: Point2D): number => {
      for (let i = 0; i < vertices.length; i++) {
        if (dist2D(vertices[i].pt, p) <= 0.2) return i;
      }
      vertices.push({ pt: p, degree: 0 });
      return vertices.length - 1;
    };

    const lineSegments: { entity: SketchEntity; v1: number; v2: number }[] = [];
    const otherEntities: SketchEntity[] = [];

    for (const e of currentEntities) {
      if (e.points && e.points.length === 2 && !e.isClosed) {
        const v1 = getVertexIndex(e.points[0]);
        const v2 = getVertexIndex(e.points[1]);
        vertices[v1].degree++;
        vertices[v2].degree++;
        lineSegments.push({ entity: e, v1, v2 });
      } else {
        otherEntities.push(e);
      }
    }

    const toRemoveIndices = new Set<number>();
    for (let i = 0; i < lineSegments.length; i++) {
      const seg = lineSegments[i];
      const deg1 = vertices[seg.v1].degree;
      const deg2 = vertices[seg.v2].degree;

      if ((deg1 === 1 && deg2 >= 3) || (deg2 === 1 && deg1 >= 3)) {
        toRemoveIndices.add(i);
        changed = true;
      }
    }

    if (toRemoveIndices.size > 0) {
      totalTrimmed += toRemoveIndices.size;
      const keptLineEntities = lineSegments
        .filter((_, idx) => !toRemoveIndices.has(idx))
        .map((s) => s.entity);
      currentEntities = [...otherEntities, ...keptLineEntities];
    }
  }

  return {
    updatedEntities: currentEntities,
    trimmedCount: totalTrimmed,
  };
}

/**
 * Updates a sketch entity's dimensions (Length, Angle, Coordinates, Radius, etc.)
 */
export function updateSketchEntityGeometry(
  entity: SketchEntity,
  params: {
    length?: number;
    angleDeg?: number;
    p1?: Point2D;
    p2?: Point2D;
    radius?: number;
    diameter?: number;
    width?: number;
    height?: number;
    cx?: number;
    cy?: number;
    center?: Point2D;
    points?: Point2D[];
    isConstruction?: boolean;
    name?: string;
  }
): SketchEntity {
  const updated = { ...entity };

  if (params.points) {
    updated.points = params.points;
  }

  if (params.isConstruction !== undefined) {
    updated.isConstruction = params.isConstruction;
  }
  if (params.name !== undefined) {
    updated.name = params.name;
  }

  // A. Circle or Arc Entity
  if (
    updated.type === 'circle' ||
    updated.type === 'circle_2p' ||
    updated.type === 'arc' ||
    updated.type === 'arc_semi' ||
    updated.type === 'arc_3p'
  ) {
    const effectiveRadius = params.radius !== undefined
      ? params.radius
      : params.diameter !== undefined
      ? params.diameter / 2
      : updated.radius;

    if (effectiveRadius !== undefined && effectiveRadius > 0) {
      updated.radius = Math.round(effectiveRadius * 100) / 100;
    }

    if (params.cx !== undefined || params.cy !== undefined || params.center) {
      const cx = params.center?.x ?? (params.cx !== undefined ? params.cx : (updated.center?.x ?? 0));
      const cy = params.center?.y ?? (params.cy !== undefined ? params.cy : (updated.center?.y ?? 0));
      updated.center = { x: Math.round(cx * 100) / 100, y: Math.round(cy * 100) / 100 };
    }

    if (updated.center && updated.radius) {
      const segs = 36;
      const pts: Point2D[] = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push({
          x: Math.round((updated.center.x + Math.cos(a) * updated.radius) * 100) / 100,
          y: Math.round((updated.center.y + Math.sin(a) * updated.radius) * 100) / 100,
        });
      }
      updated.points = pts;
    }
    return updated;
  }

  // B. Rectangle Entity
  if (updated.type === 'rect' && updated.points && updated.points.length >= 4) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of updated.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const currCx = updated.center?.x ?? ((minX + maxX) / 2);
    const currCy = updated.center?.y ?? ((minY + maxY) / 2);
    const cx = params.center?.x ?? (params.cx !== undefined ? params.cx : currCx);
    const cy = params.center?.y ?? (params.cy !== undefined ? params.cy : currCy);
    const w = params.width ?? updated.width ?? (maxX - minX);
    const h = params.height ?? updated.height ?? (maxY - minY);
    const angleDeg = params.angleDeg !== undefined ? params.angleDeg : (updated.angleDeg ?? 0);
    const angleRad = (angleDeg * Math.PI) / 180;

    const hw = w / 2;
    const hh = h / 2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const rotPt = (dx: number, dy: number) => ({
      x: Math.round((cx + dx * cosA - dy * sinA) * 100) / 100,
      y: Math.round((cy + dx * sinA + dy * cosA) * 100) / 100,
    });

    updated.points = [
      rotPt(-hw, -hh),
      rotPt(hw, -hh),
      rotPt(hw, hh),
      rotPt(-hw, hh),
    ];
    updated.center = { x: cx, y: cy };
    updated.width = w;
    updated.height = h;
    updated.angleDeg = angleDeg;
    return updated;
  }

  // C. Polygon / Polyline Entity
  if ((updated.type === 'polygon' || updated.type === 'polyline') && updated.points && updated.points.length >= 3) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of updated.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const currCx = updated.center?.x ?? ((minX + maxX) / 2);
    const currCy = updated.center?.y ?? ((minY + maxY) / 2);

    if (params.cx !== undefined || params.cy !== undefined || params.center) {
      const newCx = params.center?.x ?? (params.cx !== undefined ? params.cx : currCx);
      const newCy = params.center?.y ?? (params.cy !== undefined ? params.cy : currCy);
      const dx = newCx - currCx;
      const dy = newCy - currCy;
      updated.points = updated.points.map((p) => ({
        x: Math.round((p.x + dx) * 100) / 100,
        y: Math.round((p.y + dy) * 100) / 100,
      }));
      updated.center = { x: newCx, y: newCy };
    }

    if (params.width !== undefined && params.width > 0) {
      const currW = maxX - minX || 1;
      const scaleX = params.width / currW;
      const c = updated.center || { x: currCx, y: currCy };
      updated.points = updated.points.map((p) => ({
        x: Math.round((c.x + (p.x - c.x) * scaleX) * 100) / 100,
        y: p.y,
      }));
      updated.width = params.width;
    }

    if (params.height !== undefined && params.height > 0) {
      const currH = maxY - minY || 1;
      const scaleY = params.height / currH;
      const c = updated.center || { x: currCx, y: currCy };
      updated.points = updated.points.map((p) => ({
        x: p.x,
        y: Math.round((c.y + (p.y - c.y) * scaleY) * 100) / 100,
      }));
      updated.height = params.height;
    }

    if (params.angleDeg !== undefined) {
      const curAngle = updated.angleDeg ?? 0;
      const deltaAngleRad = ((params.angleDeg - curAngle) * Math.PI) / 180;
      const cosA = Math.cos(deltaAngleRad);
      const sinA = Math.sin(deltaAngleRad);
      const c = updated.center || { x: currCx, y: currCy };
      updated.points = updated.points.map((p) => {
        const ox = p.x - c.x;
        const oy = p.y - c.y;
        return {
          x: Math.round((c.x + ox * cosA - oy * sinA) * 100) / 100,
          y: Math.round((c.y + ox * sinA + oy * cosA) * 100) / 100,
        };
      });
      updated.angleDeg = params.angleDeg;
    }

    return updated;
  }

  // C. Line Entity (2 Points)
  if (updated.points && updated.points.length === 2) {
    let p1 = params.p1 ? { ...params.p1 } : { ...updated.points[0] };
    let p2 = params.p2 ? { ...params.p2 } : { ...updated.points[1] };

    const currentLen = dist2D(p1, p2) || 1;
    let currentAngleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    if (params.angleDeg !== undefined) {
      currentAngleRad = (params.angleDeg * Math.PI) / 180;
    }

    const targetLen = params.length !== undefined && params.length > 0 ? params.length : currentLen;

    p2 = {
      x: Math.round((p1.x + Math.cos(currentAngleRad) * targetLen) * 100) / 100,
      y: Math.round((p1.y + Math.sin(currentAngleRad) * targetLen) * 100) / 100,
    };

    updated.points = [p1, p2];
    return updated;
  }

  return updated;
}

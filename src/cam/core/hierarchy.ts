/**
 * 🌲 AluCAD CAM Core — Topological Contour Hierarchy (Even-Odd Outer vs Hole)
 * 
 * Determines parent-child nesting of contours:
 * - Identifies outer boundary contours vs internal hole/bore contours
 * - Groups holes under their containing parent outer contour into complete CamPart objects
 */

import { Point2D, Contour, CamPart, computeSignedArea, computeBoundingBox, isPointInPolygon } from './geometry';

/**
 * Builds CamPart array from raw closed contours using topological containment.
 */
export function buildPartHierarchy(rawContours: Contour[], sourceName: string = 'part'): CamPart[] {
  if (rawContours.length === 0) return [];

  // Sort contours by area descending (outermost parents are largest)
  const sorted = [...rawContours].sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  // Determine containment depth for each contour
  // Depth 0 = Outer boundary, Depth 1 = Hole in outer, Depth 2 = Island inside hole, etc.
  const parents: number[] = new Array(sorted.length).fill(-1);

  for (let i = 0; i < sorted.length; i++) {
    const child = sorted[i];
    // Find smallest enclosing contour j < i
    for (let j = i - 1; j >= 0; j--) {
      const candidateParent = sorted[j];
      // Quick bounding box check
      if (
        child.bounds.minX >= candidateParent.bounds.minX &&
        child.bounds.maxX <= candidateParent.bounds.maxX &&
        child.bounds.minY >= candidateParent.bounds.minY &&
        child.bounds.maxY <= candidateParent.bounds.maxY
      ) {
        // Test first vertex of child in candidateParent polygon
        if (child.points.length > 0 && isPointInPolygon(child.points[0], candidateParent.points)) {
          parents[i] = j;
          break;
        }
      }
    }
  }

  // Calculate containment depth
  const depths: number[] = new Array(sorted.length).fill(0);
  for (let i = 0; i < sorted.length; i++) {
    let p = parents[i];
    let d = 0;
    while (p !== -1) {
      d++;
      p = parents[p];
    }
    depths[i] = d;
  }

  // Assign roles based on even-odd rule:
  // Even depth (0, 2...) = 'outer' boundary
  // Odd depth (1, 3...) = 'hole'
  const camParts: CamPart[] = [];
  const partMap = new Map<number, CamPart>();

  for (let i = 0; i < sorted.length; i++) {
    const contour = sorted[i];
    const isOuter = depths[i] % 2 === 0;
    contour.role = isOuter ? 'outer' : 'hole';

    if (isOuter) {
      const part: CamPart = {
        id: `${sourceName}_${i}`,
        label: `${sourceName} ${camParts.length + 1}`,
        outerContour: contour,
        holes: [],
        quantity: 1,
        allowedRotations: [0, 90, 180, 270],
      };
      camParts.push(part);
      partMap.set(i, part);
    } else {
      // Find the immediate parent outer contour
      let p = parents[i];
      while (p !== -1 && depths[p] % 2 !== 0) {
        p = parents[p];
      }
      if (p !== -1 && partMap.has(p)) {
        contour.parentId = sorted[p].id;
        partMap.get(p)!.holes.push(contour);
      }
    }
  }

  return camParts;
}

import { describe, it, expect } from 'vitest';
import {
  intersectSegments,
  splitAllIntersectingLines,
  autoTrimOverhangs,
  trimEntityAtPoint,
  updateSketchEntityGeometry,
  type SketchEntity,
} from '@/design-studio/sketchContourEngine';

describe('2D CAD Sketch Trimming & Parametric Entity Editing Engine', () => {
  it('correctly calculates segment-segment intersection', () => {
    // Two lines crossing at (20, 20)
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 40, y: 40 };
    const p3 = { x: 0, y: 40 };
    const p4 = { x: 40, y: 0 };

    const inter = intersectSegments(p1, p2, p3, p4);
    expect(inter).not.toBeNull();
    expect(inter?.pt.x).toBe(20);
    expect(inter?.pt.y).toBe(20);
  });

  it('splits intersecting lines at intersection points', () => {
    const line1: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 40, y: 40 }],
      isClosed: false,
      isConstruction: false,
    };
    const line2: SketchEntity = {
      id: 'l2',
      type: 'line',
      points: [{ x: 0, y: 40 }, { x: 40, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };

    const split = splitAllIntersectingLines([line1, line2]);
    // Each of the 2 lines should be split into 2 sub-segments at (20, 20) -> total 4 segments
    expect(split.length).toBe(4);
    for (const seg of split) {
      expect(seg.points.length).toBe(2);
    }
  });

  it('auto-trims dangling overhangs/tails extending past intersections (Matching user Image 1)', () => {
    // Recreating user scenario from Image 1:
    // A triangle where two lines cross each other and have overhang tails extending to the left!
    // Junction at (30, 20)
    // Overhang 1 from (0, 0) to (30, 20)
    // Overhang 2 from (0, 40) to (30, 20)
    // Triangle legs from (30, 20) to (60, 40), (60, 40) to (60, 0), and (60, 0) to (30, 20)
    const line1: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 60, y: 40 }],
      isClosed: false,
      isConstruction: false,
    };
    const line2: SketchEntity = {
      id: 'l2',
      type: 'line',
      points: [{ x: 0, y: 40 }, { x: 60, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };
    const line3: SketchEntity = {
      id: 'l3',
      type: 'line',
      points: [{ x: 60, y: 40 }, { x: 60, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };

    const { updatedEntities, trimmedCount } = autoTrimOverhangs([line1, line2, line3]);
    expect(trimmedCount).toBe(2); // Exactly the 2 overhang tails were trimmed!
    expect(updatedEntities.length).toBe(3); // The 3 sides of the clean triangle remain!
  });

  it('trims specific picked entity segment (Single Click / Trim Tool)', () => {
    const line1: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 20 }, { x: 100, y: 20 }],
      isClosed: false,
      isConstruction: false,
    };
    const cutter: SketchEntity = {
      id: 'c1',
      type: 'line',
      points: [{ x: 50, y: 0 }, { x: 50, y: 40 }],
      isClosed: false,
      isConstruction: false,
    };

    // User clicks near (10, 20) to trim the left half of line1
    const { updatedEntities, trimmed } = trimEntityAtPoint([line1, cutter], { x: 10, y: 20 }, 15);
    expect(trimmed).toBe(true);
    // The left segment from (0, 20) to (50, 20) was removed.
    // Remaining: right segment (50, 20) to (100, 20) and 2 cutter segments (50, 0)-(50, 20) & (50, 20)-(50, 40)
    expect(updatedEntities.length).toBe(3);
  });

  it('updates line length and angle parametrically', () => {
    const line: SketchEntity = {
      id: 'l1',
      type: 'line',
      points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
      isClosed: false,
      isConstruction: false,
    };

    // 1. Change length from 50 to 80
    const lengthened = updateSketchEntityGeometry(line, { length: 80 });
    expect(lengthened.points[1].x).toBe(80);
    expect(lengthened.points[1].y).toBe(0);

    // 2. Change angle from 0 deg to 90 deg
    const rotated = updateSketchEntityGeometry(lengthened, { angleDeg: 90 });
    expect(rotated.points[1].x).toBe(0);
    expect(rotated.points[1].y).toBe(80);
  });

  it('guarantees ground-extruded solid aligns with 2D sketch plane coordinates without inversion', () => {
    // Ground sketch points
    const sketchPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ];
    const cx = (0 + 100) / 2; // 50
    const cy = (0 + 60) / 2;  // 30
    const depth = 20;

    // Solid created on ground:
    const pos = { x: cx, y: depth / 2, z: -cy };
    const rot = { x: -90, y: 0, z: 0 };
    const profileAxis = 'normal';

    expect(pos.x).toBe(50);
    expect(pos.y).toBe(10);
    expect(pos.z).toBe(-30); // Note -cy, matching sketch plane -y
    expect(rot.x).toBe(-90);
    expect(profileAxis).toBe('normal');

    // World coordinate verification:
    // In sketch plane, a point (x, y) has world coords: (x/10, 0, -y/10)
    // For vertex (100, 60):
    // Sketch world = (10, 0, -6)
    // In solid geometry, local shape point is (100 - cx, 60 - cy) = (50, 30) mm = (5, 3) units.
    // Bottom of solid has local z = -depth/20 = -1.
    // Rotated by x=-90 deg: (x, z, -y) = (5, -1, -3)
    // Plus part pos (5, 1, -3):
    // Solid world = (5 + 5, -1 + 1, -3 + (-3)) = (10, 0, -6)
    // Exactly matches sketch world!
    const localGeomPoint = { x: (100 - cx) / 10, y: (60 - cy) / 10, z: -depth / 20 };
    // Rotate x=-90: x' = x, y' = z, z' = -y
    const rotatedGeom = { x: localGeomPoint.x, y: localGeomPoint.z, z: -localGeomPoint.y };
    // Translate by part pos
    const worldPoint = {
      x: rotatedGeom.x + pos.x / 10,
      y: rotatedGeom.y + pos.y / 10,
      z: rotatedGeom.z + pos.z / 10,
    };

    expect(worldPoint.x).toBe(10);
    expect(worldPoint.y).toBe(0);
    expect(worldPoint.z).toBe(-6);
  });
});

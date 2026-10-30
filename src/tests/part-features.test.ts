import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { addRectangle, addCircle, addLine, addPoint } from '@/cad/part/sketch';
import { ORIGIN_PLANES, regenerate, newSketchFeature, volumeOf, planeFromFace, worldToSketch, sketchToWorld, type PartDoc, type ExtrudeFeature } from '@/cad/part/features';
import { detectProfiles } from '@/cad/part/profiles';

const bbox = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

function plateDoc(plane: keyof typeof ORIGIN_PLANES, direction: ExtrudeFeature['direction'] = 'normal'): PartDoc {
  const doc: PartDoc = { name: 'P', features: [] };
  const sk = newSketchFeature(doc, ORIGIN_PLANES[plane], plane);
  let s = addRectangle(sk.sketch, { x: 0, y: 0 }, { x: 100, y: 60 }).sketch;
  s = addCircle(s, { x: 50, y: 30 }, 10).sketch;
  sk.sketch = s;
  doc.features.push(sk, { id: 'e1', type: 'extrude', name: 'Extrude1', sketchId: sk.id, regionKeys: [], distance: 10, direction, operation: 'new' });
  return doc;
}

describe('part features', () => {
  it('extrude on Top (XZ) starts on the plane and grows +Y; hole subtracts', () => {
    const r = regenerate(plateDoc('XZ'));
    expect(r.errors).toEqual({});
    expect(r.bodies.length).toBe(1);
    const b = bbox(r.bodies[0].geometry);
    expect(b.min.y).toBeCloseTo(0, 4);
    expect(b.max.y).toBeCloseTo(10, 4);
    expect(b.min.x).toBeCloseTo(0, 4); expect(b.max.x).toBeCloseTo(100, 4);
    // sketch +v on top plane = world −Z
    expect(b.min.z).toBeCloseTo(-60, 4); expect(b.max.z).toBeCloseTo(0, 4);
    expect(volumeOf(r.bodies[0].geometry)).toBeCloseTo(100 * 60 * 10 - Math.PI * 100 * 10, -1);
  });

  it('reverse and symmetric do not mirror the profile', () => {
    const rev = bbox(regenerate(plateDoc('XY', 'reverse')).bodies[0].geometry);
    expect(rev.min.z).toBeCloseTo(-10, 4); expect(rev.max.z).toBeCloseTo(0, 4);
    expect(rev.min.y).toBeCloseTo(0, 4); expect(rev.max.y).toBeCloseTo(60, 4);
    const sym = bbox(regenerate(plateDoc('YZ', 'symmetric')).bodies[0].geometry);
    expect(sym.min.x).toBeCloseTo(-5, 4); expect(sym.max.x).toBeCloseTo(5, 4);
    expect(sym.min.z).toBeCloseTo(-100, 4); // right plane u = −Z
  });

  it('cut from a face sketch removes material; editing the sketch regenerates', () => {
    const doc = plateDoc('XZ');
    const top = planeFromFace(new THREE.Vector3(20, 10, -20), new THREE.Vector3(0, 1, 0));
    expect(top.origin[1]).toBeCloseTo(10);
    const sk2 = newSketchFeature(doc, top, 'Face');
    const c = worldToSketch(top, new THREE.Vector3(20, 10, -20));
    sk2.sketch = addCircle(sk2.sketch, c, 5).sketch;
    doc.features.push(sk2, { id: 'c1', type: 'extrude', name: 'Cut1', sketchId: sk2.id, regionKeys: [], distance: 4, direction: 'reverse', operation: 'cut' });
    const before = volumeOf(regenerate(plateDoc('XZ')).bodies[0].geometry);
    const r = regenerate(doc);
    expect(r.errors).toEqual({});
    expect(before - volumeOf(r.bodies[0].geometry)).toBeCloseTo(Math.PI * 25 * 4, -0.5);
    expect(sketchToWorld(top, c.x, c.y).distanceTo(new THREE.Vector3(20, 10, -20))).toBeLessThan(1e-6);

    // edit base sketch: grow plate → volume grows
    const base = doc.features[0] as any;
    const s = base.sketch;
    for (const p of Object.values(s.points) as any[]) if (p.x > 90) p.x = 150;
    expect(volumeOf(regenerate(doc).bodies[0].geometry)).toBeGreaterThan(volumeOf(r.bodies[0].geometry) + 25000);
  });

  it('join merges into one body, revolve around Y builds a cylinder', () => {
    const doc: PartDoc = { name: 'R', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    sk.sketch = addRectangle(sk.sketch, { x: 0, y: 0 }, { x: 20, y: 50 }).sketch;
    doc.features.push(sk, { id: 'r1', type: 'revolve', name: 'Revolve1', sketchId: sk.id, regionKeys: [], axis: 'Y', angle: 360, operation: 'new' });
    const r = regenerate(doc);
    expect(r.errors).toEqual({});
    expect(volumeOf(r.bodies[0].geometry)).toBeCloseTo(Math.PI * 400 * 50, -2);
    // join a boss on top
    const sk2 = newSketchFeature(doc, ORIGIN_PLANES.XZ, 'XZ');
    sk2.sketch = addCircle(sk2.sketch, { x: 0, y: 0 }, 10).sketch;
    doc.features.push(sk2, { id: 'j1', type: 'extrude', name: 'Extrude1', sketchId: sk2.id, regionKeys: [], distance: 80, direction: 'normal', operation: 'join' });
    const r2 = regenerate(doc);
    expect(r2.bodies.length).toBe(1);
    expect(bbox(r2.bodies[0].geometry).max.y).toBeCloseTo(80, 3);
  });

  it('revolve across the axis is rejected with a clear error', () => {
    const doc: PartDoc = { name: 'R', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    sk.sketch = addRectangle(sk.sketch, { x: -5, y: 0 }, { x: 20, y: 50 }).sketch;
    doc.features.push(sk, { id: 'r1', type: 'revolve', name: 'Revolve1', sketchId: sk.id, regionKeys: [], axis: 'Y', angle: 360, operation: 'new' });
    expect(regenerate(doc).errors.r1).toBe('crosses-axis');
  });

  it('extrudes two separate closed profiles in the same sketch', () => {
    const doc: PartDoc = { name: 'TwoProfiles', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    let s = addRectangle(sk.sketch, { x: 0, y: 0 }, { x: 20, y: 20 }).sketch;
    s = addRectangle(s, { x: 40, y: 0 }, { x: 60, y: 20 }).sketch;
    sk.sketch = s;
    doc.features.push(sk, { id: 'e1', type: 'extrude', name: 'Extrude1', sketchId: sk.id, regionKeys: [], distance: 10, direction: 'normal', operation: 'new' });
    const r = regenerate(doc);
    expect(r.errors).toEqual({});
    expect(r.bodies.length).toBeGreaterThanOrEqual(1);
    expect(volumeOf(r.bodies[0].geometry)).toBeCloseTo(20 * 20 * 10 * 2, -1);
  });

  it('detects and extrudes closed areas from intersecting lines with dangling tails', () => {
    const doc: PartDoc = { name: 'IntersectingLines', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    let s = sk.sketch;

    const makeLine = (curSk: typeof s, x1: number, y1: number, x2: number, y2: number) => {
      const pt1 = addPoint(curSk, x1, y1, 1e-6);
      const pt2 = addPoint(pt1.sketch, x2, y2, 1e-6);
      return addLine(pt2.sketch, pt1.id, pt2.id).sketch;
    };

    // Bottom horizontal line: (0, 0) -> (60, 0)
    s = makeLine(s, 0, 0, 60, 0);
    // Middle vertical line: (30, 0) -> (30, 50)
    s = makeLine(s, 30, 0, 30, 50);
    // Diagonal line crossing vertical: (0, 0) -> (50, 40) (overshooting!)
    s = makeLine(s, 0, 0, 50, 40);
    // Right slant line completing a second closed shape: (30, 50) -> (60, 0)
    s = makeLine(s, 30, 50, 60, 0);
    sk.sketch = s;

    const prof = detectProfiles(sk.sketch);
    expect(prof.regions.length).toBeGreaterThanOrEqual(2);
    // In auto mode, closed regions should be detected and extruded despite the dangling tail!
    doc.features.push(sk, { id: 'e1', type: 'extrude', name: 'Extrude1', sketchId: sk.id, regionKeys: [], distance: 10, direction: 'normal', operation: 'new' });
    const r = regenerate(doc);
    expect(r.errors).toEqual({});
    expect(r.bodies.length).toBe(1);
    expect(volumeOf(r.bodies[0].geometry)).toBeGreaterThan(0);

    // Test selective region extrusion: pick only 1 region
    const singleDoc: PartDoc = {
      name: 'SingleRegion',
      features: [
        sk,
        { id: 'e_single', type: 'extrude', name: 'ExtrudeSingle', sketchId: sk.id, regionKeys: [prof.regions[0].key], distance: 10, direction: 'normal', operation: 'new' }
      ]
    };
    const rSingle = regenerate(singleDoc);
    expect(rSingle.errors).toEqual({});
    expect(volumeOf(rSingle.bodies[0].geometry)).toBeLessThan(volumeOf(r.bodies[0].geometry));

    // Test selecting ALL regions explicitly
    const allDoc: PartDoc = {
      name: 'AllRegions',
      features: [
        sk,
        { id: 'e_all', type: 'extrude', name: 'ExtrudeAll', sketchId: sk.id, regionKeys: prof.regions.map(r => r.key), distance: 10, direction: 'normal', operation: 'new' }
      ]
    };
    const rAll = regenerate(allDoc);
    expect(rAll.errors).toEqual({});
    expect(volumeOf(rAll.bodies[0].geometry)).toBeGreaterThan(0);
  });
});

import { featureEdges } from '@/cad/part/features';
describe('feature edges', () => {
  const total = (arr: Float32Array) => { let L = 0; for (let i = 0; i < arr.length; i += 6) L += Math.hypot(arr[i + 3] - arr[i], arr[i + 4] - arr[i + 1], arr[i + 5] - arr[i + 2]); return L; };
  it('box: exactly the 12 edges', () => {
    const doc: PartDoc = { name: 'B', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    sk.sketch = addRectangle(sk.sketch, { x: 0, y: 0 }, { x: 40, y: 20 }).sketch;
    doc.features.push(sk, { id: 'e', type: 'extrude', name: 'E', sketchId: sk.id, regionKeys: [], distance: 10, direction: 'normal', operation: 'new' });
    expect(total(featureEdges(regenerate(doc).bodies[0].geometry))).toBeCloseTo(4 * (40 + 20 + 10), 3);
  });
  it('CSG seams do not create fake edges (join of two touching boxes = one bigger box)', () => {
    const doc: PartDoc = { name: 'B', features: [] };
    const sk = newSketchFeature(doc, ORIGIN_PLANES.XY, 'XY');
    sk.sketch = addRectangle(sk.sketch, { x: 0, y: 0 }, { x: 40, y: 20 }).sketch;
    const sk2 = newSketchFeature({ name: '', features: [sk] }, ORIGIN_PLANES.XY, 'XY');
    sk2.sketch = addRectangle(sk2.sketch, { x: 10, y: 0 }, { x: 30, y: 20 }).sketch;
    doc.features.push(sk, { id: 'e', type: 'extrude', name: 'E', sketchId: sk.id, regionKeys: [], distance: 10, direction: 'normal', operation: 'new' },
      sk2, { id: 'e2', type: 'extrude', name: 'E2', sketchId: sk2.id, regionKeys: [], distance: 10, direction: 'normal', operation: 'join' });
    const r = regenerate(doc);
    expect(r.bodies.length).toBe(1);
    expect(total(featureEdges(r.bodies[0].geometry))).toBeCloseTo(4 * (40 + 20 + 10), 1);
  });
});

import { describe, it, expect } from 'vitest';
import { emptySketch, addRectangle, addCircle, addPoint, addLine, solveSketch, mergePoints, deleteEntities, ORIGIN_ID } from '@/cad/part/sketch';
import { detectProfiles, regionAt } from '@/cad/part/profiles';

const len = (s: any, lid: string) => { const l = s.entities.find((e: any) => e.id === lid); const a = s.points[l.p1], b = s.points[l.p2]; return Math.hypot(b.x - a.x, b.y - a.y); };

describe('part sketch solver', () => {
  it('rectangle dimensions drive both edges, H/V kept', () => {
    let { sketch: s, ids } = addRectangle(emptySketch('s', 'S'), { x: 0, y: 0 }, { x: 40, y: 20 });
    s = { ...s, constraints: [...s.constraints, { id: 'd1', type: 'length', line: ids[0], value: 100 }, { id: 'd2', type: 'length', line: ids[1], value: 50 }] };
    const r = solveSketch(s);
    expect(r.converged).toBe(true);
    expect(len(r.sketch, ids[0])).toBeCloseTo(100, 3);
    expect(len(r.sketch, ids[2])).toBeCloseTo(100, 3); // opposite edge follows (H/V + shared corners)
    expect(len(r.sketch, ids[1])).toBeCloseTo(50, 3);
  });

  it('dragged (locked) point stays, connected edges follow', () => {
    let { sketch: s, ids } = addRectangle(emptySketch('s', 'S'), { x: 0, y: 0 }, { x: 40, y: 20 });
    const l0 = s.entities.find((e) => e.id === ids[1]) as any; // vertical right edge p1=(40,0) p2=(40,20)
    s.points[l0.p2] = { ...s.points[l0.p2], x: 60, y: 30 };
    const r = solveSketch(s, { locked: new Set([l0.p2]) });
    expect(r.sketch.points[l0.p2]).toMatchObject({ x: 60, y: 30 });
    expect(r.sketch.points[l0.p1].x).toBeCloseTo(60, 3); // vertical kept
  });

  it('origin is fixed; dx/dy position geometry', () => {
    let s = emptySketch('s', 'S');
    const p = addPoint(s, 3, 4); s = p.sketch;
    s = { ...s, constraints: [{ id: 'x', type: 'dx', a: ORIGIN_ID, b: p.id, value: 25 }, { id: 'y', type: 'dy', a: ORIGIN_ID, b: p.id, value: -10 }] };
    const r = solveSketch(s);
    expect(r.sketch.points[ORIGIN_ID]).toMatchObject({ x: 0, y: 0 });
    expect(r.sketch.points[p.id].x).toBeCloseTo(25, 4);
    expect(r.sketch.points[p.id].y).toBeCloseTo(-10, 4);
  });

  it('merge + delete keep topology clean', () => {
    let s = emptySketch('s', 'S');
    const a = addPoint(s, 0, 0); s = a.sketch;
    const b = addPoint(s, 10, 0); s = b.sketch;
    const c = addPoint(s, 10, 0.2); s = c.sketch;
    s = addLine(s, a.id, b.id).sketch;
    const l2 = addLine(s, c.id, a.id); s = l2.sketch;
    s = mergePoints(s, c.id, b.id);
    expect(Object.keys(s.points)).not.toContain(c.id);
    s = deleteEntities(s, l2.ids);
    expect(s.entities.length).toBe(1);
  });
});

describe('profile detection', () => {
  it('rectangle with a circle → plate with hole (auto) and 2 selectable regions', () => {
    let s = addRectangle(emptySketch('s', 'S'), { x: -50, y: -30 }, { x: 50, y: 30 }).sketch;
    s = addCircle(s, { x: 0, y: 0 }, 10).sketch;
    const r = detectProfiles(s);
    expect(r.auto.length).toBe(1);
    expect(r.auto[0].holes.length).toBe(1);
    expect(r.auto[0].area).toBeCloseTo(100 * 60 - Math.PI * 100, -1);
    expect(r.regions.length).toBe(2);
    expect(regionAt(r, { x: 40, y: 0 })?.holes.length).toBe(1);
    expect(regionAt(r, { x: 0, y: 0 })?.key.startsWith('c:')).toBe(true);
  });

  it('rectangle split by a line gives two faces; auto is the union outline', () => {
    let { sketch: s, ids } = addRectangle(emptySketch('s', 'S'), { x: 0, y: 0 }, { x: 100, y: 50 });
    const top = s.entities.find((e) => e.id === ids[2]) as any;
    const bottom = s.entities.find((e) => e.id === ids[0]) as any;
    // split bottom/top edges at x=40 by inserting points
    s = deleteEntities(s, [ids[0], ids[2]]);
    const m1 = addPoint(s, 40, 0); s = m1.sketch;
    const m2 = addPoint(s, 40, 50); s = m2.sketch;
    s = addLine(s, bottom.p1, m1.id).sketch; s = addLine(s, m1.id, bottom.p2).sketch;
    s = addLine(s, top.p1, m2.id).sketch; s = addLine(s, m2.id, top.p2).sketch;
    s = addLine(s, m1.id, m2.id).sketch;
    const r = detectProfiles(s);
    expect(r.regions.length).toBe(2);
    expect(r.regions.map((x) => Math.round(x.area)).sort((a, b) => a - b)).toEqual([2000, 3000]);
    expect(r.auto.length).toBe(1);
    expect(Math.round(r.auto[0].area)).toBe(5000);
  });

  it('open polyline has no profile and is reported', () => {
    let s = emptySketch('s', 'S');
    const a = addPoint(s, 0, 0); s = a.sketch; const b = addPoint(s, 10, 0); s = b.sketch; const c = addPoint(s, 10, 10); s = c.sketch;
    s = addLine(s, a.id, b.id).sketch; s = addLine(s, b.id, c.id).sketch;
    const r = detectProfiles(s);
    expect(r.auto.length).toBe(0);
    expect(r.openEdges).toBe(2);
  });

  it('construction geometry is ignored', () => {
    let s = addRectangle(emptySketch('s', 'S'), { x: 0, y: 0 }, { x: 10, y: 10 }, true).sketch;
    expect(detectProfiles(s).auto.length).toBe(0);
  });
});

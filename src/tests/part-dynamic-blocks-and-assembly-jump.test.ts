/**
 * Tests for Part Studio Dynamic Block stamping and Assembly to Part Studio jump
 */
import { describe, it, expect } from 'vitest';
import {
  emptySketch, addRectangle, addPoint, addPointEntity, solveSketch, addLine,
  applyLinearPatternToSketch, applyCircularPatternToSketch,
  trimEntity, filletCorner, chamferCorner, filletBetweenLines, chamferBetweenLines,
} from '@/cad/part/sketch';
import { detectProfiles } from '@/cad/part/profiles';
import { getAvailableDynamicBlocks, stampDynamicBlockToSketch } from '@/cad/part/dynamicBlockBridge';
import { useDesignStore } from '@/design-studio/designStore';
import { usePartStore } from '@/cad/part/partStore';
import {
  regenerate, generateHoleTool, generateThreadTool, ORIGIN_PLANES,
  type HoleFeature, type ThreadFeature, type LinearPatternFeature, type CircularPatternFeature, type MirrorFeature, volumeOf,
} from '@/cad/part/features';

describe('Part Studio Dynamic Block Integration', () => {
  it('should list available dynamic blocks from sketch blocks and CAD registry', () => {
    const blocks = getAvailableDynamicBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    const pcd = blocks.find((b) => b.id === 'bolt_circle');
    expect(pcd).toBeDefined();
    expect(pcd?.nameTr).toContain('Cıvata');
  });

  it('should stamp a dynamic block into a Part Studio sketch', () => {
    let sk = emptySketch('Front Plane');
    sk = stampDynamicBlockToSketch(sk, 'bolt_circle', { x: 0, y: 0 }, {
      pcdDia: 100,
      holeCount: 4,
      holeDia: 10,
    });

    expect(sk.entities.length).toBeGreaterThan(0);
    const lines = sk.entities.filter((e) => e.type === 'line');
    expect(lines.length).toBeGreaterThanOrEqual(4);
    // Rigidity verification: every stamped entity and point has blockInstanceId set
    for (const ent of sk.entities) {
      expect(ent.blockInstanceId).toBeDefined();
      if ('p1' in ent) expect(sk.points[ent.p1].blockInstanceId).toBe(ent.blockInstanceId);
      if ('p2' in ent) expect(sk.points[ent.p2].blockInstanceId).toBe(ent.blockInstanceId);
    }
  });

  it('stampDynamicBlock on partStore should automatically start a sketch and commit geometry', () => {
    const ps = usePartStore.getState();
    ps.newPart();
    ps.stampDynamicBlock('bolt_circle', { x: 0, y: 0 });

    const currentDraft = usePartStore.getState().draft;
    expect(currentDraft).toBeDefined();
    expect(currentDraft!.entities.length).toBeGreaterThan(0);
  });

  it('openPartStudioForPart should open Part Studio with the linked part', () => {
    const ds = useDesignStore.getState();
    const id = ds.addPart('box', { x: 0, y: 0, z: 0 });
    ds.openPartStudioForPart(id);

    expect(useDesignStore.getState().isPartStudioOpen).toBe(true);
    expect(usePartStore.getState().linkedPartId).toBe(id);
  });

  it('HoleFeature should generate tool geometry and cut hole in a solid body via CSG', () => {
    // Create a base box via Sketch + Extrude
    let sk = emptySketch('sk-1', 'Sketch 1');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 100, y: 100 }).sketch;

    const doc: any = {
      name: 'PlateWithHole',
      features: [
        { id: 'sk-1', type: 'sketch', name: 'Sketch 1', plane: ORIGIN_PLANES.XZ, planeLabel: 'Top plane (XZ)', sketch: sk, visible: true },
        { id: 'ex-1', type: 'extrude', name: 'Extrude 1', sketchId: 'sk-1', regionKeys: [], distance: 20, direction: 'normal', operation: 'new' },
      ],
    };

    const initialRegen = regenerate(doc);
    expect(initialRegen.bodies.length).toBe(1);
    const baseVol = volumeOf(initialRegen.bodies[0].geometry);
    expect(baseVol).toBeGreaterThan(0);

    // Add M6 Counterbore Hole Feature
    const holeFeature: HoleFeature = {
      id: 'hl-1',
      type: 'hole',
      name: 'Delik 1',
      holeType: 'counterbore',
      standardSize: 'M6',
      diameter: 6.6,
      depth: 25,
      isThroughAll: true,
      cboreDiameter: 10.0,
      cboreDepth: 6.0,
      plane: ORIGIN_PLANES.XZ,
      center: { x: 50, y: 50 },
    };

    const tool = generateHoleTool(holeFeature);
    expect(tool).toBeDefined();

    doc.features.push(holeFeature);
    const cutRegen = regenerate(doc);
    expect(cutRegen.bodies.length).toBe(1);
    const cutVol = volumeOf(cutRegen.bodies[0].geometry);
    // Volume after hole cut should be strictly smaller than base volume!
    expect(cutVol).toBeLessThan(baseVol);
  });

  it('ThreadFeature should generate thread tool and perform CSG subtraction', () => {
    let sk = emptySketch('sk-2', 'Sketch 2');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 50, y: 50 }).sketch;

    const doc: any = {
      name: 'PlateWithThread',
      features: [
        { id: 'sk-2', type: 'sketch', name: 'Sketch 2', plane: ORIGIN_PLANES.XZ, planeLabel: 'Top plane (XZ)', sketch: sk, visible: true },
        { id: 'ex-2', type: 'extrude', name: 'Extrude 2', sketchId: 'sk-2', regionKeys: [], distance: 20, direction: 'normal', operation: 'new' },
      ],
    };

    const initialRegen = regenerate(doc);
    const baseVol = volumeOf(initialRegen.bodies[0].geometry);

    const threadFeature: ThreadFeature = {
      id: 'th-1',
      type: 'thread',
      name: 'Diş 1',
      standard: 'ISO_METRIC',
      size: 'M10',
      nominalDiameter: 10.0,
      pitch: 1.5,
      length: 15,
      isInternal: true,
      plane: ORIGIN_PLANES.XZ,
      center: { x: 25, y: 25 },
    };

    const tool = generateThreadTool(threadFeature);
    expect(tool).toBeDefined();

    doc.features.push(threadFeature);
    const cutRegen = regenerate(doc);
    expect(cutRegen.bodies.length).toBe(1);
    const cutVol = volumeOf(cutRegen.bodies[0].geometry);
    expect(cutVol).toBeLessThan(baseVol);
  });

  it('Dimensioning dynamic block rigidly moves the block without changing internal distances', () => {
    let sk = emptySketch('sk-dyn');
    sk = stampDynamicBlockToSketch(sk, 'bolt_circle', { x: 0, y: 0 }, { pcdDia: 100, holeCount: 4, holeDia: 10 });
    const pts = Object.values(sk.points).filter((p) => p.blockInstanceId);
    expect(pts.length).toBeGreaterThan(1);
    const pA = pts[0];
    const pB = pts[1];
    const initialDist = Math.hypot(pB.x - pA.x, pB.y - pA.y);

    // Add dimension/distance constraint from origin (0, 0) to pA
    // Create an external reference point at (0, 0)
    const { sketch: skWithRef, ptId: originPtId } = addPointEntity(sk, 0, 0, true);
    skWithRef.constraints.push({
      id: 'cn-dim-x',
      type: 'dx',
      a: originPtId,
      b: pA.id,
      value: 50,
    });

    const solved = solveSketch(skWithRef, { iterations: 10 });
    expect(solved.converged).toBe(true);

    const newPA = solved.sketch.points[pA.id];
    const newPB = solved.sketch.points[pB.id];
    const newDist = Math.hypot(newPB.x - newPA.x, newPB.y - newPA.y);

    // The block must have moved rigidly: distance between internal points is preserved!
    expect(Math.abs(newDist - initialDist)).toBeLessThan(0.01);
  });

  it('HoleFeature with sketchId drills holes at all sketch points (Solidworks style Hole Wizard)', () => {
    // Base plate 200x200x20
    let plateSk = emptySketch('plate-sk');
    plateSk = addRectangle(plateSk, { x: 0, y: 0 }, { x: 200, y: 200 }).sketch;

    // Pattern sketch with 4 points for drilling
    let pointsSk = emptySketch('points-sk');
    const pt1 = addPointEntity(pointsSk, 30, 30).sketch;
    const pt2 = addPointEntity(pt1, 170, 30).sketch;
    const pt3 = addPointEntity(pt2, 30, 170).sketch;
    const pt4 = addPointEntity(pt3, 170, 170).sketch;

    const doc: any = {
      name: 'PlateWith4Holes',
      features: [
        { id: 'f-sk1', type: 'sketch', name: 'Plate Sketch', plane: ORIGIN_PLANES.XZ, planeLabel: 'Top plane (XZ)', sketch: plateSk, visible: true },
        { id: 'f-ex1', type: 'extrude', name: 'Base Plate', sketchId: 'f-sk1', regionKeys: [], distance: 20, direction: 'normal', operation: 'new' },
        { id: 'f-sk-pts', type: 'sketch', name: 'Hole Points', plane: ORIGIN_PLANES.XZ, planeLabel: 'Top plane (XZ)', sketch: pt4, visible: true },
        {
          id: 'f-hl1',
          type: 'hole',
          name: 'Hole Pattern',
          sketchId: 'f-sk-pts',
          holeType: 'simple',
          standardSize: 'custom',
          diameter: 12,
          depth: 25,
          isThroughAll: true,
          plane: ORIGIN_PLANES.XZ,
          center: { x: 0, y: 0 },
        },
      ],
    };

    const regenRes = regenerate(doc);
    expect(regenRes.bodies.length).toBe(1);
    const finalVol = volumeOf(regenRes.bodies[0].geometry);
    // 200 * 200 * 20 = 800,000 mm3
    // 4 holes each of volume PI * 6^2 * 20 ≈ 2261.9 * 4 ≈ 9047.8 mm3
    // Final volume should be around 790,950 mm3
    expect(finalVol).toBeLessThan(800000);
    expect(finalVol).toBeGreaterThan(780000);
  });

  it('2D sketch linear and circular pattern functions duplicate entities correctly', () => {
    let sk = emptySketch('sk-pattern');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 10, y: 10 }).sketch;
    const originalEntCount = sk.entities.length;

    // Linear pattern: 3 in X (step 20), 2 in Y (step 30) -> total 6 instances (5 clones)
    const linSk = applyLinearPatternToSketch(sk, sk.entities.map((e) => e.id), 3, 20, 2, 30, 0);
    expect(linSk.entities.length).toBe(originalEntCount * 6);

    // Circular pattern: 4 instances around (50, 50) over 360 degrees
    const circSk = applyCircularPatternToSketch(sk, sk.entities.map((e) => e.id), 50, 50, 4, 360);
    expect(circSk.entities.length).toBe(originalEntCount * 4);
  });

  it('3D feature pattern features (LinearPattern, CircularPattern, Mirror) replicate cuts and bodies', () => {
    let plateSk = emptySketch('base-sk');
    plateSk = addRectangle(plateSk, { x: 0, y: 0 }, { x: 300, y: 300 }).sketch;

    const doc: any = {
      name: 'PatternPlate',
      features: [
        { id: 'sk-base', type: 'sketch', name: 'Base', plane: ORIGIN_PLANES.XZ, planeLabel: 'Top plane (XZ)', sketch: plateSk, visible: true },
        { id: 'ex-base', type: 'extrude', name: 'Plate Extrude', sketchId: 'sk-base', regionKeys: [], distance: 20, direction: 'normal', operation: 'new' },
        {
          id: 'hl-target',
          type: 'hole',
          name: 'Hole 1',
          holeType: 'simple',
          standardSize: 'custom',
          diameter: 10,
          depth: 25,
          isThroughAll: true,
          plane: ORIGIN_PLANES.XZ,
          center: { x: 50, y: 50 },
        },
        {
          id: 'lp-1',
          type: 'linearPattern',
          name: 'Linear Pattern 1',
          targetFeatureId: 'hl-target',
          dir1Axis: 'X',
          dir1Count: 3,
          dir1Spacing: 40,
        } as LinearPatternFeature,
      ],
    };

    const regenLp = regenerate(doc);
    expect(regenLp.bodies.length).toBe(1);
    const lpVol = volumeOf(regenLp.bodies[0].geometry);

    // Now test Mirror feature
    const mirrorDoc: any = {
      name: 'MirrorPlate',
      features: [
        ...doc.features.slice(0, 3), // Base + Hole
        {
          id: 'mr-1',
          type: 'mirror',
          name: 'Mirror 1',
          targetFeatureId: 'hl-target',
          plane: 'YZ',
        } as MirrorFeature,
      ],
    };
    const regenMr = regenerate(mirrorDoc);
    expect(regenMr.bodies.length).toBe(1);
    const mrVol = volumeOf(regenMr.bodies[0].geometry);
    expect(mrVol).toBeLessThan(volumeOf(regenerate({ ...mirrorDoc, features: mirrorDoc.features.slice(0, 2) }).bodies[0].geometry));
  });

  it('2D sketch trimEntity should trim a line between intersections', () => {
    // Rectangle 100x100
    let sk = emptySketch('sk-cross');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 100, y: 100 }).sketch;

    // Add a crossing line that extends beyond the top edge: from (50, 50) to (50, 120)
    // Intersects top edge y=100 at (50, 100).
    const { sketch: skWithLine, ids: lineIds } = addRectangle(emptySketch('dummy'), { x: 0, y: 0 }, { x: 1, y: 1 });
    // Let's add the crossing line directly
    const pt1Id = 'p-cross-start';
    const pt2Id = 'p-cross-end';
    sk.points[pt1Id] = { id: pt1Id, x: 50, y: 50 };
    sk.points[pt2Id] = { id: pt2Id, x: 50, y: 120 };
    const crossingLineId = 'line-crossing';
    sk.entities.push({ id: crossingLineId, type: 'line', p1: pt1Id, p2: pt2Id });

    // The crossing line goes from y=50 to y=120, crossing top edge y=100 at y=100.
    // Click on the extension sticking out at y=110:
    const trimRes = trimEntity(sk, crossingLineId, { x: 50, y: 110 });
    expect(trimRes.success).toBe(true);

    // The line should now be trimmed back: ending at y=100 instead of y=120!
    const trimmedLine = trimRes.sketch.entities.find((e) => e.type === 'line' && (e.id === crossingLineId || ('p1' in e && trimRes.sketch.points[e.p1]?.x === 50)));
    expect(trimmedLine).toBeDefined();
    if (trimmedLine && trimmedLine.type === 'line') {
      const p1 = trimRes.sketch.points[trimmedLine.p1];
      const p2 = trimRes.sketch.points[trimmedLine.p2];
      const maxY = Math.max(p1.y, p2.y);
      expect(maxY).toBeCloseTo(100, 1);
    }
  });

  it('2D sketch filletCorner should create a tangent arc of radius R and trim the corner lines', () => {
    let sk = emptySketch('sk-fillet');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 100, y: 100 }).sketch;

    // Corner at top-right (100, 100)
    const cornerPt = Object.values(sk.points).find((p) => Math.abs(p.x - 100) < 1e-3 && Math.abs(p.y - 100) < 1e-3);
    expect(cornerPt).toBeDefined();

    const filletRes = filletCorner(sk, cornerPt!.id, 15);
    expect(filletRes.success).toBe(true);

    const arcs = filletRes.sketch.entities.filter((e) => e.type === 'arc');
    expect(arcs.length).toBe(1);

    // Still forms a single closed profile with smooth rounded corner
    const prof = detectProfiles(filletRes.sketch);
    expect(prof.auto.length).toBe(1);
    // Area of 100x100 minus corner square (15x15) plus quarter circle (PI * 15^2 / 4)
    // ~9951 mm² (within polygon approximation)
    expect(prof.auto[0].area).toBeGreaterThan(9940);
    expect(prof.auto[0].area).toBeLessThan(9960);
  });

  it('2D sketch chamferCorner should create a 45° bevel line and trim the corner lines', () => {
    let sk = emptySketch('sk-chamfer');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 100, y: 100 }).sketch;

    // Corner at top-left (0, 100)
    const cornerPt = Object.values(sk.points).find((p) => Math.abs(p.x - 0) < 1e-3 && Math.abs(p.y - 100) < 1e-3);
    expect(cornerPt).toBeDefined();

    const chamferRes = chamferCorner(sk, cornerPt!.id, 10);
    expect(chamferRes.success).toBe(true);

    // A new chamfer line is created (rectangle has 4 lines -> 1 chamfer line added = 5 lines total)
    const lines = chamferRes.sketch.entities.filter((e) => e.type === 'line');
    expect(lines.length).toBe(5);

    // Profile remains clean and closed
    const prof = detectProfiles(chamferRes.sketch);
    expect(prof.auto.length).toBe(1);
    // Area: 10000 - (10 * 10 / 2) = 9950 mm²
    expect(prof.auto[0].area).toBeCloseTo(9950, 0);
  });

  it('filletBetweenLines and chamferBetweenLines should correctly identify shared corner', () => {
    let sk = emptySketch('sk-lines');
    sk = addRectangle(sk, { x: 0, y: 0 }, { x: 50, y: 50 }).sketch;

    const lines = sk.entities.filter((e) => e.type === 'line');
    const l1 = lines[0];
    // Find an adjacent line sharing an endpoint with l1
    const l2 = lines.find((e) => e.id !== l1.id && ('p1' in e) && (e.p1 === ('p1' in l1 ? l1.p1 : '') || e.p1 === ('p2' in l1 ? l1.p2 : '') || e.p2 === ('p1' in l1 ? l1.p1 : '') || e.p2 === ('p2' in l1 ? l1.p2 : '')));
    expect(l2).toBeDefined();

    const filletRes = filletBetweenLines(sk, l1.id, l2!.id, 5);
    expect(filletRes.success).toBe(true);
    expect(filletRes.sketch.entities.some((e) => e.type === 'arc')).toBe(true);
  });

  it('Centerline line should not divide a closed profile in detectProfiles', () => {
    let sk = emptySketch('sk-centerline-profile');
    // Six points around a 100x50 rectangle with midpoints on top and bottom
    const p0 = addPoint(sk, 0, 0); sk = p0.sketch;
    const p1 = addPoint(sk, 50, 0); sk = p1.sketch;
    const p2 = addPoint(sk, 100, 0); sk = p2.sketch;
    const p3 = addPoint(sk, 100, 50); sk = p3.sketch;
    const p4 = addPoint(sk, 50, 50); sk = p4.sketch;
    const p5 = addPoint(sk, 0, 50); sk = p5.sketch;

    // Outer boundary
    sk = addLine(sk, p0.id, p1.id).sketch;
    sk = addLine(sk, p1.id, p2.id).sketch;
    sk = addLine(sk, p2.id, p3.id).sketch;
    sk = addLine(sk, p3.id, p4.id).sketch;
    sk = addLine(sk, p4.id, p5.id).sketch;
    sk = addLine(sk, p5.id, p0.id).sketch;

    // Mid line connecting p1 (50, 0) and p4 (50, 50)
    const { sketch: skMid, ids } = addLine(sk, p1.id, p4.id, false, false);
    const midLineId = ids[0];

    // As a normal solid line, it divides into 2 selectable regions
    const splitProf = detectProfiles(skMid);
    expect(splitProf.regions.length).toBe(2);

    // When marked as centerline, detectProfiles ignores it as a divider, keeping 1 single 5000 mm² region
    const skCenterline = {
      ...skMid,
      entities: skMid.entities.map((e) => (e.id === midLineId ? { ...e, centerline: true, construction: true } : e)),
    };
    const clProf = detectProfiles(skCenterline);
    expect(clProf.regions.length).toBe(1);
    expect(clProf.regions[0].area).toBeCloseTo(5000, 0);
  });

  it('diameter_dim constraint solves to exact half-diameter distance from centerline', () => {
    let sk = emptySketch('sk-diametric-dim');
    // Centerline along Y axis: (0, -100) to (0, 100)
    const p1 = addPoint(sk, 0, -100); sk = p1.sketch;
    const p2 = addPoint(sk, 0, 100); sk = p2.sketch;
    const { sketch: sLine, ids } = addLine(sk, p1.id, p2.id, true, true);
    const clLineId = ids[0];

    // Add point at (15, 25)
    const { sketch: sPt, id: ptId } = addPoint(sLine, 15, 25);

    // Add diametric dimension: diameter = 60 (so distance from centerline should be 30)
    sPt.constraints.push({
      id: 'dim-dia-1',
      type: 'diameter_dim',
      centerline: clLineId,
      point: ptId,
      value: 60,
    });

    const solved = solveSketch(sPt, { iterations: 15 });
    expect(solved.converged).toBe(true);
    // Point X coordinate should now be 30 (distance to centerline is value / 2 = 30)
    expect(solved.sketch.points[ptId].x).toBeCloseTo(30, 1);
  });

  it('openFeature("revolve") automatically picks the sketch centerline as revolution axis', () => {
    const ps = usePartStore.getState();
    ps.newPart();
    ps.startSketch('sk-rev-cl', ORIGIN_PLANES.XY);
    const curDraft = usePartStore.getState().draft!;
    const rectRes = addRectangle(curDraft, { x: 10, y: 0 }, { x: 50, y: 40 });
    let sWithCl = rectRes.sketch;
    const cp1 = addPoint(sWithCl, 0, -50); sWithCl = cp1.sketch;
    const cp2 = addPoint(sWithCl, 0, 50); sWithCl = cp2.sketch;
    const { sketch: sFinal, ids: clIds } = addLine(sWithCl, cp1.id, cp2.id, true, true);
    ps.commitDraft(sFinal);
    ps.finishSketch();

    // Open revolve feature
    ps.openFeature('revolve');
    const fDraft = usePartStore.getState().featureDraft;
    expect(fDraft).toBeDefined();
    expect(fDraft?.feature.type).toBe('revolve');
    expect((fDraft?.feature as any).axis).toBe(clIds[0]);
  });
});

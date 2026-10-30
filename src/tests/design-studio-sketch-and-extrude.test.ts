import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '../design-studio/designStore';

describe('Design Studio: 2D Sketching, Fillet, and Extrude/Cut Property Manager', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      mates: [],
      selectedMateId: null,
      selectedId: null,
      activeFace: null,
      tool: 'select',
      sketchPoints: [],
      sketchClosed: false,
      sketchShapeMode: 'line',
      sketchCircleRadius: 25,
      isExtrudeDialogOpen: false,
      extrudeDialogConfig: {
        mode: 'extrude',
        depth: 20,
        direction: 'outward',
        isThroughAll: false,
      },
    });
  });

  it('draws circles, rectangles, and polygons correctly with live points', () => {
    const store = useDesignStore.getState();

    // 1. Circle sketch
    store.addCircleSketch({ x: 0, y: 0 }, 15);
    const circleEnt = useDesignStore.getState().sketchEntities[0];
    const circlePoints = circleEnt?.points || useDesignStore.getState().sketchPoints;
    expect(circlePoints.length).toBeGreaterThan(16);
    expect(circleEnt?.isClosed ?? useDesignStore.getState().sketchClosed).toBe(true);

    // 2. Rectangle sketch
    store.clearSketch();
    store.addRectSketch({ x: 10, y: 20 }, 40, 60);
    const rectEnt = useDesignStore.getState().sketchEntities[0];
    const rectPoints = rectEnt?.points || useDesignStore.getState().sketchPoints;
    expect(rectPoints.length).toBe(4);
    expect(rectEnt?.isClosed ?? useDesignStore.getState().sketchClosed).toBe(true);

    // 3. Hexagon / Polygon sketch
    store.clearSketch();
    store.addPolygonSketch({ x: 0, y: 0 }, 20, 6);
    const polyEnt = useDesignStore.getState().sketchEntities[0];
    const polyPoints = polyEnt?.points || useDesignStore.getState().sketchPoints;
    expect(polyPoints.length).toBe(6);
    expect(polyEnt?.isClosed ?? useDesignStore.getState().sketchClosed).toBe(true);
  });

  it('applies corner fillet (radius) smoothing to polygon vertices', () => {
    const store = useDesignStore.getState();
    store.clearSketch();

    // Create a 40x40 square with 4 sharp corners
    store.addRectSketch({ x: 0, y: 0 }, 40, 40);
    const rectEnt = useDesignStore.getState().sketchEntities[0];
    const rectPoints = rectEnt?.points || useDesignStore.getState().sketchPoints;
    expect(rectPoints.length).toBe(4);

    // Apply 5mm fillet to all corners
    store.applySketchFillet(5);
    const filletedEnt = useDesignStore.getState().sketchEntities[0];
    const filletedPoints = filletedEnt?.points || useDesignStore.getState().sketchPoints;

    // Each 90-degree corner vertex should be replaced by an interpolated arc of points
    expect(filletedPoints.length).toBeGreaterThan(12);
    // The points should remain bounded within [-20, 20]
    filletedPoints.forEach((p) => {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(20.01);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(20.01);
    });
  });

  it('handles Extrude Boss (Katı Ekle) on a part face without displacing it to the ground', () => {
    const store = useDesignStore.getState();

    // Add a base box at position (100, 20, 50)
    const baseBox: DesignPart = {
      id: 'base-box',
      kind: 'box',
      name: 'Base Box',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 100, y: 20, z: 50 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 80 },
    };

    useDesignStore.setState({
      parts: [baseBox],
      selectedId: 'base-box',
      activeFace: 'top',
    });

    // Draw a 30x30 square sketch on the top face
    store.addRectSketch({ x: 0, y: 0 }, 30, 30);

    // Open Extrude PropertyManager dialog to choose Extrude Boss vs Cut
    store.openExtrudeDialog();
    expect(useDesignStore.getState().isExtrudeDialogOpen).toBe(true);

    // Configure Extrude Boss with depth 15 mm protruding outward
    store.setExtrudeDialogConfig({
      mode: 'extrude',
      depth: 15,
      direction: 'outward',
    });

    const newSolidId = store.applyExtrudeOrCut();
    expect(newSolidId).toBeDefined();

    const parts = useDesignStore.getState().parts;
    const newSolid = parts.find((p) => p.id === newSolidId);
    expect(newSolid).toBeDefined();
    expect(newSolid?.parentId).toBe('base-box');

    // Verify positioning: Base Box top face is at y = 20 + (40/2) = 40 mm.
    // getFaceTransform adds 0.15mm face offset to avoid z-fighting, and 15mm depth adds 7.5mm.
    // So y = 40 + 0.15 + 7.5 = 47.65 ≈ 47.7 mm.
    // It must NOT be on the floor grid (y = 7.5 or y = 0).
    expect(newSolid?.position.y).toBeCloseTo(47.7, 1);
    expect(newSolid?.position.x).toBeCloseTo(100, 1);
    expect(newSolid?.position.z).toBeCloseTo(50, 1);
  });

  it('handles Extrude Cut (Kesi Yap) on a part face via CSG surface cuts', () => {
    const store = useDesignStore.getState();

    const basePlate: DesignPart = {
      id: 'plate-1',
      kind: 'plate',
      name: 'Plate 1',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, height: 10, depth: 100 },
      cuts: [],
    };

    useDesignStore.setState({
      parts: [basePlate],
      selectedId: 'plate-1',
      activeFace: 'top',
    });

    // Draw circle sketch of radius 10 mm (diameter 20 mm)
    store.addCircleSketch({ x: 0, y: 0 }, 10);

    // Configure Extrude Cut
    store.setExtrudeDialogConfig({
      mode: 'cut',
      depth: 10,
      isThroughAll: true,
    });

    const updatedPartId = store.applyExtrudeOrCut();
    expect(updatedPartId).toBe('plate-1');

    const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'plate-1');
    expect(updatedPart?.cuts).toBeDefined();
    expect(updatedPart?.cuts?.length).toBe(1);

    const cut = updatedPart!.cuts![0];
    expect(cut.face).toBe('top');
    expect(cut.depth).toBeGreaterThanOrEqual(10);
    expect(cut.isThroughAll).toBe(true);
  });

  it('supports multi-entity sketching and endCurrentLineSegment without chained polyline forcing', () => {
    const store = useDesignStore.getState();

    // 1. Draw segment 1
    store.addSketchPoint({ x: 0, y: 0 });
    store.addSketchPoint({ x: 50, y: 0 });
    expect(useDesignStore.getState().sketchPoints.length).toBe(2);

    // 2. End current line segment
    store.endCurrentLineSegment();
    expect(useDesignStore.getState().sketchPoints.length).toBe(0);
    expect(useDesignStore.getState().sketchEntities.length).toBe(1);
    expect(useDesignStore.getState().sketchEntities[0].type).toBe('line');
    expect(useDesignStore.getState().sketchEntities[0].points.length).toBe(2);

    // 3. Add an independent circle entity on the same face
    store.addCircleEntity({ x: 25, y: 25 }, 10, false, 'Mounting Hole');
    expect(useDesignStore.getState().sketchEntities.length).toBe(2);
    expect(useDesignStore.getState().sketchEntities[1].type).toBe('circle');
    expect(useDesignStore.getState().sketchEntities[1].radius).toBe(10);

    // 4. Add numeric coordinate points
    store.addCoordinateSketchPoint(100, 50);
    expect(useDesignStore.getState().sketchPoints.length).toBe(1);
    expect(useDesignStore.getState().sketchPoints[0]).toEqual({ x: 100, y: 50 });
  });

  it('filters out construction lines from Extrude Boss and Extrude Cut operations', () => {
    const store = useDesignStore.getState();

    const basePlate: DesignPart = {
      id: 'plate-ref-test',
      kind: 'plate',
      name: 'Plate Ref Test',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 120, height: 10, depth: 120 },
      cuts: [],
    };

    useDesignStore.setState({
      parts: [basePlate],
      selectedId: 'plate-ref-test',
      activeFace: 'top',
      sketchEntities: [],
      sketchPoints: [],
    });

    // 1. Add a construction centerline (sanal referans kılavuz çizgisi)
    store.toggleConstructionMode();
    store.addSketchPoint({ x: -50, y: 0 });
    store.addSketchPoint({ x: 50, y: 0 });
    store.endCurrentLineSegment();

    expect(useDesignStore.getState().sketchEntities.length).toBe(1);
    expect(useDesignStore.getState().sketchEntities[0].isConstruction).toBe(true);

    // 2. Add an actual cut circle
    store.toggleConstructionMode(); // turn off construction
    store.addCircleEntity({ x: 0, y: 0 }, 15, false, 'Center Bore');

    // 3. Apply cut
    store.setExtrudeDialogConfig({
      mode: 'cut',
      depth: 10,
    });

    store.applyExtrudeOrCut();

    const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'plate-ref-test');
    expect(updatedPart?.cuts?.length).toBe(1);
    // The cut should only contain the circle contour, NOT the construction centerline
    expect(updatedPart?.cuts?.[0].profile?.length).toBeGreaterThanOrEqual(16);
  });

  it('keeps sketch on face when keepSketchAfterExtrude is enabled for re-use in both cut and solid', () => {
    const store = useDesignStore.getState();

    const basePlate: DesignPart = {
      id: 'plate-reuse-test',
      kind: 'plate',
      name: 'Plate Re-use',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, height: 10, depth: 100 },
      cuts: [],
    };

    useDesignStore.setState({
      parts: [basePlate],
      selectedId: 'plate-reuse-test',
      activeFace: 'top',
      keepSketchAfterExtrude: true,
      sketchEntities: [],
    });

    // Draw a square sketch
    store.addRectSketch({ x: 0, y: 0 }, 30, 30);
    const rectEnt = useDesignStore.getState().sketchEntities[0];
    const rectPoints = rectEnt?.points || useDesignStore.getState().sketchPoints;
    expect(rectPoints.length).toBe(4);

    // Apply Cut first
    store.setExtrudeDialogConfig({
      mode: 'cut',
      depth: 5,
    });

    store.applyExtrudeOrCut();

    // Verify cut occurred
    const updatedPart = useDesignStore.getState().parts.find((p) => p.id === 'plate-reuse-test');
    expect(updatedPart?.cuts?.length).toBe(1);

    // Sketch MUST still be preserved because keepSketchAfterExtrude = true
    const preservedEnt = useDesignStore.getState().sketchEntities[0];
    const preservedPoints = preservedEnt?.points || useDesignStore.getState().sketchPoints;
    expect(preservedPoints.length).toBe(4);

    // Now re-use the exact same sketch to Extrude Boss!
    store.setExtrudeDialogConfig({
      mode: 'extrude',
      depth: 15,
      direction: 'outward',
    });

    const bossId = store.applyExtrudeOrCut();
    expect(bossId).toBeDefined();

    const bossPart = useDesignStore.getState().parts.find((p) => p.id === bossId);
    expect(bossPart).toBeDefined();
    expect(bossPart?.parentId).toBe('plate-reuse-test');
  });

  it('stamps parametric dynamic blocks (bolt circle, vent louver, nema mount, aero wing) to 2D sketch', () => {
    const store = useDesignStore.getState();

    // 1. Stamp Bolt Circle PCD
    const stampedBoltIds = store.stampDynamicBlockToSketch('bolt_circle', { x: 0, y: 0 });
    expect(stampedBoltIds.length).toBeGreaterThan(0);

    const entities = useDesignStore.getState().sketchEntities;
    expect(entities.length).toBeGreaterThan(0);

    // Bolt circle generates both solid hole loops and a dashed PCD construction loop
    const hasConstruction = entities.some((e) => e.isConstruction);
    const hasSolid = entities.some((e) => !e.isConstruction);
    expect(hasConstruction).toBe(true);
    expect(hasSolid).toBe(true);

    // 2. Stamp Automotive Aero Wing NACA 0012 Profile
    store.clearSketch();
    const aeroIds = store.stampDynamicBlockToSketch('aero_wing', { x: 50, y: 20 });
    expect(aeroIds.length).toBeGreaterThan(0);

    const aeroEntities = useDesignStore.getState().sketchEntities;
    const wingEntity = aeroEntities.find((e) => e.blockType === 'aero_wing' || e.name?.includes('Kanat'));
    expect(wingEntity).toBeDefined();
    expect(wingEntity?.points.length).toBeGreaterThan(20);
    expect(wingEntity?.isClosed).toBe(true);
  });

  it('subdivides mesh geometry multiplying triangle resolution 4x for Blender sculpt mode', () => {
    const store = useDesignStore.getState();

    // Create a part with custom non-indexed triangle geometry (e.g. 2 triangles = 1 quad, 6 vertices)
    const pos = new Float32Array([
      0, 0, 0,
      10, 0, 0,
      10, 10, 0,

      0, 0, 0,
      10, 10, 0,
      0, 10, 0,
    ]);
    const norm = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);

    const sculptPart: DesignPart = {
      id: 'sculpt-part-1',
      kind: 'box',
      name: 'Sculpt Part',
      color: '#d946ef',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 10, height: 10, depth: 10 },
      customGeometry: {
        positions: Array.from(pos),
        normals: Array.from(norm),
      },
    };

    useDesignStore.setState({
      parts: [sculptPart],
      selectedId: 'sculpt-part-1',
    });

    // Initial vertices: 6 (2 triangles)
    expect(useDesignStore.getState().parts[0].customGeometry?.positions.length).toBe(18);

    // Apply 4x Subdivision
    store.subdivideSelectedPartMesh();

    const subdividedPart = useDesignStore.getState().parts.find((p) => p.id === 'sculpt-part-1');
    expect(subdividedPart?.customGeometry).toBeDefined();

    // 2 triangles * 4 = 8 triangles * 3 vertices * 3 coords = 72 floats
    expect(subdividedPart?.customGeometry?.positions.length).toBe(72);
    expect(subdividedPart?.customGeometry?.normals.length).toBe(72);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore } from '@/design-studio/designStore';
import { chainAndResolveSketchContours } from '@/design-studio/sketchContourEngine';

describe('CAD 2D Sketch to 3D Solid Flow & Open Profile Resilience', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      selectedId: null,
      sketchPoints: [],
      sketchClosed: false,
      sketchEntities: [],
      isExtrudeDialogOpen: false,
      tool: 'select',
      activeFace: null,
      extrudeDepth: 20,
    });
  });

  it('forms a 3D solid when sketchEntities has closed shapes (Circle + Polygon from screenshot) even when sketchPoints is empty', () => {
    const store = useDesignStore.getState();

    // 1. User draws a circle
    store.addCircleSketch({ x: 0, y: 0 }, 25);
    // 2. User draws a polygon / rectangle
    store.addPolygonSketch({ x: 60, y: 0 }, 30, 4);

    const stateAfterDrawing = useDesignStore.getState();
    expect(stateAfterDrawing.sketchEntities.length).toBe(2);
    expect(stateAfterDrawing.sketchPoints.length).toBe(0);

    // 3. User finishes sketch and commits extrude
    const resultPartId = stateAfterDrawing.commitExtrude();

    expect(resultPartId).not.toBeNull();
    const updatedParts = useDesignStore.getState().parts;
    expect(updatedParts.length).toBeGreaterThanOrEqual(1);

    const createdPart = updatedParts[0];
    expect(createdPart.kind).toBe('profile');
    expect(createdPart.params.extrudeDepth).toBe(20);
    expect(createdPart.outer.length).toBeGreaterThanOrEqual(3);
  });

  it('auto-heals a small gap (<= 35mm) in a line chain and creates a closed solid', () => {
    const store = useDesignStore.getState();

    // Line segments with a 12mm gap at the end
    store.sketchEntities = [
      {
        id: 'line-1',
        type: 'line',
        points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
        isClosed: false,
        isConstruction: false,
      },
      {
        id: 'line-2',
        type: 'line',
        points: [{ x: 50, y: 0 }, { x: 50, y: 40 }],
        isClosed: false,
        isConstruction: false,
      },
      {
        id: 'line-3',
        type: 'line',
        points: [{ x: 50, y: 40 }, { x: 0, y: 40 }],
        isClosed: false,
        isConstruction: false,
      },
      {
        id: 'line-4',
        type: 'line',
        points: [{ x: 0, y: 40 }, { x: 0, y: 12 }], // 12mm gap back to (0,0)
        isClosed: false,
        isConstruction: false,
      },
    ];

    const contours = chainAndResolveSketchContours(store.sketchEntities, [], {
      gapHealToleranceMm: 35,
    });

    expect(contours.length).toBe(1);
    expect(contours[0].wasGapHealed).toBe(true);
    expect(contours[0].isClosed).toBe(true);
    expect(contours[0].gapSize).toBe(12);

    // Apply extrude
    const createdId = store.applyExtrudeOrCut({ depth: 15 });
    expect(createdId).not.toBeNull();

    const createdPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(createdPart).toBeDefined();
    expect(createdPart?.params.extrudeDepth).toBe(15);
  });

  it('forms a 3D solid from an open profile (single line or C-channel) using Thin Feature wall thickness', () => {
    const store = useDesignStore.getState();

    // Open C-channel with wide gap (60mm, above 35mm heal tolerance)
    store.sketchEntities = [
      {
        id: 'c-1',
        type: 'line',
        points: [{ x: 0, y: 0 }, { x: 60, y: 0 }],
        isClosed: false,
        isConstruction: false,
      },
      {
        id: 'c-2',
        type: 'line',
        points: [{ x: 60, y: 0 }, { x: 60, y: 40 }],
        isClosed: false,
        isConstruction: false,
      },
      {
        id: 'c-3',
        type: 'line',
        points: [{ x: 60, y: 40 }, { x: 0, y: 40 }],
        isClosed: false,
        isConstruction: false,
      },
    ];

    const contours = chainAndResolveSketchContours(store.sketchEntities, [], {
      gapHealToleranceMm: 35,
      defaultWallThicknessMm: 3,
    });

    expect(contours.length).toBe(1);
    expect(contours[0].isOpenProfile).toBe(true);
    // Ribbon creates a closed perimeter
    expect(contours[0].points.length).toBeGreaterThanOrEqual(6);

    const createdId = store.applyExtrudeOrCut({
      thinWallEnabled: true,
      thinWallThickness: 3,
      depth: 25,
    });

    expect(createdId).not.toBeNull();
    const createdPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(createdPart).toBeDefined();
    expect(createdPart?.params.thinWallThickness).toBe(3);
    expect(createdPart?.params.extrudeDepth).toBe(25);
  });

  it('allows extruding only a selected contour when multiple sketches coexist', () => {
    const store = useDesignStore.getState();

    store.addCircleSketch({ x: -40, y: 0 }, 15);
    store.addCircleSketch({ x: 40, y: 0 }, 20);

    const entities = useDesignStore.getState().sketchEntities;
    expect(entities.length).toBe(2);

    const firstCircleId = entities[0].id;

    // Extrude ONLY first circle
    const createdId = store.applyExtrudeOrCut({
      selectedContourId: firstCircleId,
      depth: 30,
    });

    expect(createdId).not.toBeNull();
    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBe(1);
  });
});

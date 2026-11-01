import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, DesignPart } from '../design-studio/designStore';

describe('CAD Sketch to 3D Solid Exact Coordinate Alignment', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      selectedId: null,
      activeFace: null,
      sketchEntities: [],
      sketchPoints: [],
      sketchClosed: false,
      tool: 'select',
      isExtrudeDialogOpen: false,
      extrudeDepth: 20,
    });
  });

  it('correctly places ground sketch extrusion without attaching to existing scene parts', () => {
    const store = useDesignStore.getState();

    // 1. Scene already has an existing part (e.g. a box)
    const existingBox: DesignPart = {
      id: 'existing-box-1',
      kind: 'box',
      name: 'Existing Box',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 100, y: 50, z: -200 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };
    useDesignStore.setState({ parts: [existingBox], selectedId: null, activeFace: null });

    // 2. User draws a rectangle on the ground plane at (x: 20, y: 30) with width 50, height 40
    store.addRectSketch({ x: 20, y: 30 }, 50, 40);

    // 3. User applies Extrude
    const createdId = store.applyExtrudeOrCut({ depth: 25, mode: 'extrude' });
    expect(createdId).toBeTruthy();

    const parts = useDesignStore.getState().parts;
    expect(parts.length).toBe(2);

    const newPart = parts.find((p) => p.id === createdId);
    expect(newPart).toBeDefined();

    // MUST NOT have parentId set to existingBox
    expect(newPart?.parentId).toBeNull();

    // Position MUST match ground plane: X = cx (20), Y = depth / 2 (12.5), Z = -cy (-30)
    expect(newPart?.position.x).toBe(20);
    expect(newPart?.position.y).toBe(12.5);
    expect(newPart?.position.z).toBe(-30);

    // Rotation MUST be [-90, 0, 0] for ground profile
    expect(newPart?.rotation.x).toBe(-90);
    expect(newPart?.rotation.y).toBe(0);
    expect(newPart?.rotation.z).toBe(0);
  });

  it('accurately attaches extrusion to top face of a 3D block', () => {
    const store = useDesignStore.getState();

    // 1. Create a 40x40x40 box centered at (0, 20, 0) sitting on the ground (Y: 0 to 40)
    const baseBox: DesignPart = {
      id: 'base-box',
      kind: 'box',
      name: 'Base Block',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };
    useDesignStore.setState({ parts: [baseBox], selectedId: 'base-box', activeFace: 'top' });

    // 2. Draw a 20x20 sketch at the center of the top face (cx: 0, cy: 0)
    store.addRectSketch({ x: 0, y: 0 }, 20, 20);

    // 3. Extrude by 15mm outward
    const createdId = store.applyExtrudeOrCut({ depth: 15, mode: 'extrude', direction: 'outward' });
    expect(createdId).toBeTruthy();

    const newPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(newPart).toBeDefined();

    // Top face is at Y = 40. Extruding outward by 15 means center is at Y = 40 + 7.5 = 47.5!
    expect(newPart?.position.x).toBe(0);
    expect(Math.abs(newPart!.position.y - 47.5)).toBeLessThanOrEqual(0.5);
    expect(newPart?.position.z).toBe(0);

    // Orientation must match top face (-90 deg around X)
    expect(newPart?.rotation.x).toBe(-90);
  });

  it('accurately attaches extrusion to front face of a 3D block', () => {
    const store = useDesignStore.getState();

    // 1. Create a 40x40x40 box centered at (0, 20, 0)
    // Front face (Z max) is at Z = +20, Y from 0 to 40
    const baseBox: DesignPart = {
      id: 'base-box-front',
      kind: 'box',
      name: 'Base Block',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };
    useDesignStore.setState({ parts: [baseBox], selectedId: 'base-box-front', activeFace: 'front' });

    // 2. Draw a rectangle/square centered at (cx: 0, cy: 0) on the front face
    store.addPolygonSketch({ x: 0, y: 0 }, 10, 4);

    // 3. Extrude by 20mm outward
    const createdId = store.applyExtrudeOrCut({ depth: 20, mode: 'extrude', direction: 'outward' });
    expect(createdId).toBeTruthy();

    const newPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(newPart).toBeDefined();

    // Front face is at Z = +20, block center Y = 20.
    // Extruding outward by 20mm means center along Z is at 20 + 10 = 30!
    expect(newPart?.position.x).toBe(0);
    expect(Math.abs(newPart!.position.y - 20)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(newPart!.position.z - 30)).toBeLessThanOrEqual(0.5);

    // Front face has normal (0, 0, 1), rotation is [0, 0, 0]
    expect(newPart?.rotation.x).toBe(0);
    expect(newPart?.rotation.y).toBe(0);
    expect(newPart?.rotation.z).toBe(0);
  });

  it('accurately attaches extrusion to right face of a 3D block', () => {
    const store = useDesignStore.getState();

    // 1. Create a 40x40x40 box centered at (0, 20, 0)
    // Right face (X max) is at X = +20, normal = (1, 0, 0)
    const baseBox: DesignPart = {
      id: 'base-box-right',
      kind: 'box',
      name: 'Base Block Right',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 0, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };
    useDesignStore.setState({ parts: [baseBox], selectedId: 'base-box-right', activeFace: 'right' });

    // 2. Draw a square centered at (cx: 0, cy: 0) on the right face
    store.addPolygonSketch({ x: 0, y: 0 }, 10, 4);

    // 3. Extrude by 20mm outward
    const createdId = store.applyExtrudeOrCut({ depth: 20, mode: 'extrude', direction: 'outward' });
    expect(createdId).toBeTruthy();

    const newPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(newPart).toBeDefined();

    // Right face is at X = +20. Extruding outward by 20mm means center along X is at 20 + 10 = 30!
    expect(Math.abs(newPart!.position.x - 30)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(newPart!.position.y - 20)).toBeLessThanOrEqual(0.5);
    expect(newPart?.position.z).toBe(0);

    // Right face has normal (1, 0, 0), rotation is [0, 90, 0]
    expect(newPart?.rotation.x).toBe(0);
    expect(newPart?.rotation.y).toBe(90);
    expect(newPart?.rotation.z).toBe(0);
  });

  it('correctly calculates World Datum Plane for rotated parts and places extrusions without coordinate drift', () => {
    const store = useDesignStore.getState();

    // 1. Part with non-zero rotation (e.g. rotated 90 degrees around Y in assembly)
    const rotatedBox: DesignPart = {
      id: 'rotated-box-1',
      kind: 'box',
      name: 'Rotated Block',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 50, y: 20, z: 50 },
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };
    useDesignStore.setState({ parts: [rotatedBox], selectedId: 'rotated-box-1', activeFace: 'front' });

    // 2. Draw a rectangle centered at (0, 0) on the front face
    store.addRectSketch({ x: 0, y: 0 }, 20, 20);

    // 3. Extrude by 20mm outward
    const createdId = store.applyExtrudeOrCut({ depth: 20, mode: 'extrude', direction: 'outward' });
    expect(createdId).toBeTruthy();

    const newPart = useDesignStore.getState().parts.find((p) => p.id === createdId);
    expect(newPart).toBeDefined();

    // When a box at (50, 20, 50) is rotated 90 deg around Y:
    // Its local front face (normal 0, 0, 1) in world space points along world +X!
    // Local center (0, 0, 20) transformed by R_y(90) becomes (20, 0, 0) relative to (50, 20, 50).
    // So the front face in the world is at X = 50 + 20 = 70.
    // Extruding outward by 20mm means center along X is at 70 + 10 = 80!
    expect(Math.abs(newPart!.position.x - 80)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(newPart!.position.y - 20)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(newPart!.position.z - 50)).toBeLessThanOrEqual(0.5);
    expect(newPart?.rotation.y).toBe(90);
  });

  it('edits part sketch in-place without duplicating part or shifting its assembly position', () => {
    const store = useDesignStore.getState();

    // 1. Part placed at an arbitrary assembly position & rotation
    const originalPart: DesignPart = {
      id: 'bracket-part-1',
      kind: 'profile',
      name: 'L-Bracket Profile',
      color: '#00e5ff',
      visible: true,
      locked: false,
      parentId: null,
      subAssemblyId: null,
      position: { x: 120, y: 45, z: -80 },
      rotation: { x: -90, y: 30, z: 15 },
      scale: { x: 1, y: 1, z: 1 },
      params: { extrudeDepth: 25, profileAxis: 'normal' },
      outer: [
        { x: -20, y: -15 },
        { x: 20, y: -15 },
        { x: 20, y: 15 },
        { x: -20, y: 15 },
      ],
    };

    useDesignStore.setState({
      parts: [originalPart],
      selectedId: 'bracket-part-1',
      editingPartId: null,
      sketchEntities: [],
      sketchPoints: [],
    });

    // 2. User clicks [✏️ Edit] on Sketch 1 in feature tree
    store.startEditPartSketch('bracket-part-1');

    const stateAfterEdit = useDesignStore.getState();
    expect(stateAfterEdit.editingPartId).toBe('bracket-part-1');
    expect(stateAfterEdit.tool).toBe('sketch-add');
    expect(stateAfterEdit.sketchEntities.length).toBeGreaterThanOrEqual(1);
    expect(stateAfterEdit.selectedSketchEntityId).toBe(stateAfterEdit.sketchEntities[0].id);

    // 3. User modifies width from 40 to 60 via parametric inspector
    const entId = stateAfterEdit.sketchEntities[0].id;
    store.updateSketchEntity(entId, { width: 60, height: 40 });

    const stateAfterUpdate = useDesignStore.getState();
    expect(stateAfterUpdate.sketchPoints.length).toBeGreaterThanOrEqual(4);

    // 4. User clicks [✔ Parçayı Güncelle / Update Part]
    const updatedId = store.commitExtrude();
    expect(updatedId).toBe('bracket-part-1');

    const stateAfterCommit = useDesignStore.getState();

    // MUST NOT duplicate part: count remains 1!
    expect(stateAfterCommit.parts.length).toBe(1);

    const updatedPart = stateAfterCommit.parts[0];
    expect(updatedPart.id).toBe('bracket-part-1');

    // Assembly world position and rotation MUST remain preserved!
    expect(updatedPart.position.x).toBe(120);
    expect(updatedPart.position.y).toBe(45);
    expect(updatedPart.position.z).toBe(-80);
    expect(updatedPart.rotation.x).toBe(-90);
    expect(updatedPart.rotation.y).toBe(30);
    expect(updatedPart.rotation.z).toBe(15);

    // Outer contour must reflect the new 60mm width (-30 to +30)
    let minX = Infinity, maxX = -Infinity;
    updatedPart.outer?.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
    });
    expect(Math.round(maxX - minX)).toBe(60);

    // Editing mode must be cleanly closed
    expect(stateAfterCommit.editingPartId).toBeNull();
    expect(stateAfterCommit.sketchEntities.length).toBe(0);
    expect(stateAfterCommit.sketchPoints.length).toBe(0);
  });
});



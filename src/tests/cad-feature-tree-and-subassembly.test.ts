import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '../design-studio/designStore';

describe('CAD Feature & Assembly Tree with Sub-Assemblies & Visual Editing (ISO 10303 / SolidWorks FeatureManager)', () => {
  beforeEach(() => {
    // Reset store
    useDesignStore.setState({
      parts: [],
      subAssemblies: [],
      expandedPartIds: [],
      selectedId: null,
      selectedFeature: null,
      editingPartId: null,
      tool: 'select',
      sketchPoints: [],
      sketchClosed: false,
    });
  });

  it('1. Sub-Assemblies: should create sub-assemblies and nest parts hierarchically', () => {
    const store = useDesignStore.getState();

    // 1. Create Sub-Assemblies
    const motorId = store.addSubAssembly('Motor Grubu');
    const wheelId = store.addSubAssembly('Ön Tekerlek Takımı');

    const state1 = useDesignStore.getState();
    expect(state1.subAssemblies).toHaveLength(2);
    expect(state1.subAssemblies.find((sa) => sa.id === motorId)?.name).toBe('Motor Grubu');
    expect(state1.subAssemblies.find((sa) => sa.id === wheelId)?.name).toBe('Ön Tekerlek Takımı');

    // 2. Add Parts
    const engineBlockId = store.addPart('box');
    const pistonId = store.addPart('cylinder');
    const wheelPartId = store.addPart('cylinder');
    const chassisId = store.addPart('plate'); // Root part

    // 3. Move parts to sub-assemblies
    store.movePartToSubAssembly(engineBlockId, motorId);
    store.movePartToSubAssembly(pistonId, motorId);
    store.movePartToSubAssembly(wheelPartId, wheelId);

    const state2 = useDesignStore.getState();
    expect(state2.parts.find((p) => p.id === engineBlockId)?.subAssemblyId).toBe(motorId);
    expect(state2.parts.find((p) => p.id === pistonId)?.subAssemblyId).toBe(motorId);
    expect(state2.parts.find((p) => p.id === wheelPartId)?.subAssemblyId).toBe(wheelId);
    expect(state2.parts.find((p) => p.id === chassisId)?.subAssemblyId).toBeNull();
  });

  it('2. Sub-Assembly Bulk Operations: toggling visibility and lock affects all child parts', () => {
    const store = useDesignStore.getState();
    const subAssyId = store.addSubAssembly('Şasi Grubu');
    const partA = store.addPart('box');
    const partB = store.addPart('plate');

    store.movePartToSubAssembly(partA, subAssyId);
    store.movePartToSubAssembly(partB, subAssyId);

    // Toggle visible (initial is visible: true)
    store.toggleSubAssemblyVisible(subAssyId);
    let state = useDesignStore.getState();
    expect(state.subAssemblies.find((s) => s.id === subAssyId)?.visible).toBe(false);
    expect(state.parts.find((p) => p.id === partA)?.visible).toBe(false);
    expect(state.parts.find((p) => p.id === partB)?.visible).toBe(false);

    // Toggle lock
    store.toggleSubAssemblyLocked(subAssyId);
    state = useDesignStore.getState();
    expect(state.subAssemblies.find((s) => s.id === subAssyId)?.locked).toBe(true);
    expect(state.parts.find((p) => p.id === partA)?.locked).toBe(true);
    expect(state.parts.find((p) => p.id === partB)?.locked).toBe(true);
  });

  it('3. Sub-Assembly Dissolve: dissolving sub-assembly moves parts to root instead of deleting them', () => {
    const store = useDesignStore.getState();
    const subAssyId = store.addSubAssembly('Geçici Grup');
    const partA = store.addPart('box');
    store.movePartToSubAssembly(partA, subAssyId);

    // Dissolve
    store.removeSubAssembly(subAssyId, true);
    const state = useDesignStore.getState();
    expect(state.subAssemblies.find((s) => s.id === subAssyId)).toBeUndefined();
    expect(state.parts.find((p) => p.id === partA)).toBeDefined();
    expect(state.parts.find((p) => p.id === partA)?.subAssemblyId).toBeNull();
  });

  it('4. Feature Tree Expansion: expandAllParts and collapseAllParts toggles all nodes', () => {
    const store = useDesignStore.getState();
    const p1 = store.addPart('box');
    const p2 = store.addPart('cylinder');
    store.addSubAssembly('Sub 1');

    store.expandAllParts();
    let state = useDesignStore.getState();
    expect(state.expandedPartIds).toContain(p1);
    expect(state.expandedPartIds).toContain(p2);
    expect(state.subAssemblies[0].expanded).toBe(true);

    store.collapseAllParts();
    state = useDesignStore.getState();
    expect(state.expandedPartIds).toHaveLength(0);
    expect(state.subAssemblies[0].expanded).toBe(false);
  });

  it('5. Visual Sketch Editing: startEditPartSketch loads contour and commitExtrude updates solid in place', () => {
    const store = useDesignStore.getState();
    const partId = store.addPart('box');

    // Start editing sketch of part
    store.startEditPartSketch(partId);
    let state = useDesignStore.getState();

    expect(state.editingPartId).toBe(partId);
    expect(state.tool).toBe('sketch-add');
    expect(state.sketchPoints.length).toBeGreaterThanOrEqual(4);
    expect(state.selectedFeature?.type).toBe('sketch');

    // Modify sketch points (e.g. draw a 60x40 contour)
    const newPoints = [
      { x: -30, y: -20 },
      { x: 30, y: -20 },
      { x: 30, y: 20 },
      { x: -30, y: 20 },
    ];
    useDesignStore.setState({ sketchPoints: newPoints, sketchClosed: true, extrudeDepth: 35 });

    // Commit changes
    const committedId = useDesignStore.getState().commitExtrude();
    expect(committedId).toBe(partId);

    const finalState = useDesignStore.getState();
    expect(finalState.parts).toHaveLength(1); // Did not duplicate part!
    const updated = finalState.parts[0];
    expect(updated.id).toBe(partId);
    expect(updated.params.extrudeDepth).toBe(35);
    expect(updated.outer).toBeDefined();
    expect(finalState.editingPartId).toBeNull();
    expect(finalState.tool).toBe('select');
  });

  it('6. Visual Cut & Hole Editing: updateCut and updateHole modify parameters with live state synchronization', () => {
    const store = useDesignStore.getState();
    const partId = store.addPart('box');
    store.select(partId);

    // Add a cut and a hole
    store.addCut({
      id: 'cut-1',
      type: 'rect',
      face: 'top',
      x: 0,
      y: 0,
      width: 20,
      length: 10,
      depth: 5,
      isThroughAll: false,
    });

    store.addHole({
      id: 'hole-1',
      size: 'M6',
      x: 10,
      y: 10,
      face: 'top',
      type: 'counterbore',
      isThroughAll: true,
      depth: 15,
    });

    let state = useDesignStore.getState();
    expect(state.cuts).toHaveLength(1);
    expect(state.holes).toHaveLength(1);

    // Update cut width, depth and face
    store.updateCut(partId, 'cut-1', { width: 32, depth: 12, face: 'front' });
    state = useDesignStore.getState();
    const updatedCut = state.parts.find((p) => p.id === partId)?.cuts?.find((c) => c.id === 'cut-1');
    expect(updatedCut?.width).toBe(32);
    expect(updatedCut?.depth).toBe(12);
    expect(updatedCut?.face).toBe('front');

    // Update hole size and type
    store.updateHole(partId, 'hole-1', { size: 'M10', type: 'tap', depth: 25 });
    state = useDesignStore.getState();
    const updatedHole = state.parts.find((p) => p.id === partId)?.holes?.find((h) => h.id === 'hole-1');
    expect(updatedHole?.size).toBe('M10');
    expect(updatedHole?.type).toBe('tap');
    expect(updatedHole?.depth).toBe(25);
  });

  it('7. Autodesk Inventor In-Place Part Editing: setEditingPartId activates part mode and clearing it returns to assembly', () => {
    const store = useDesignStore.getState();
    const p1 = store.addPart('box');
    const p2 = store.addPart('cylinder');

    // Enter in-place editing mode for p1
    store.setEditingPartId(p1);
    let state = useDesignStore.getState();
    expect(state.editingPartId).toBe(p1);
    expect(state.selectedId).toBe(p1);

    // Switch in-place edit mode to p2
    store.setEditingPartId(p2);
    state = useDesignStore.getState();
    expect(state.editingPartId).toBe(p2);
    expect(state.selectedId).toBe(p2);

    // Return to top assembly mode
    store.setEditingPartId(null);
    state = useDesignStore.getState();
    expect(state.editingPartId).toBeNull();
  });

  it('8. Autodesk Inventor Grounded Components (📌): togglePartGrounded anchors part and protects from transform shifts', () => {
    const store = useDesignStore.getState();
    const partId = store.addPart('box');
    store.select(partId);

    // Initial position
    let state = useDesignStore.getState();
    const initPos = state.parts.find((p) => p.id === partId)!.position;

    // Toggle Grounded
    store.togglePartGrounded(partId);
    state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === partId)?.grounded).toBe(true);

    // Attempting to move a grounded component must be blocked (Autodesk Inventor Grounded Anchor)
    store.updateSelectedTransform({ position: { x: 999, y: 888, z: 777 } });
    state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === partId)!.position).toEqual(initPos);

    // Unground and verify transform moves freely again
    store.togglePartGrounded(partId);
    state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === partId)?.grounded).toBe(false);

    store.updateSelectedTransform({ position: { x: 120, y: 50, z: 0 } });
    state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === partId)!.position.x).toBe(120);
  });

  it('9. Autodesk Inventor Demote: demoteToSubAssembly bundles parts into a new subassembly', () => {
    const store = useDesignStore.getState();
    const p1 = store.addPart('box');
    const p2 = store.addPart('cylinder');
    const p3 = store.addPart('plate');

    // Demote p1 and p2 into a new subassembly
    const subAssyId = store.demoteToSubAssembly([p1, p2], 'Gearbox Sub-Assembly');
    const state = useDesignStore.getState();

    expect(state.subAssemblies.find((sa) => sa.id === subAssyId)).toBeDefined();
    expect(state.subAssemblies.find((sa) => sa.id === subAssyId)?.name).toBe('Gearbox Sub-Assembly');
    expect(state.parts.find((p) => p.id === p1)?.subAssemblyId).toBe(subAssyId);
    expect(state.parts.find((p) => p.id === p2)?.subAssemblyId).toBe(subAssyId);
    expect(state.parts.find((p) => p.id === p3)?.subAssemblyId).toBeNull(); // remains at root
  });

  it('10. Autodesk Inventor Promote: promotePart elevates part out of subassembly to root', () => {
    const store = useDesignStore.getState();
    const subAssyId = store.addSubAssembly('Bracket Sub');
    const p1 = store.addPart('L-bracket');
    store.movePartToSubAssembly(p1, subAssyId);

    let state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === p1)?.subAssemblyId).toBe(subAssyId);

    // Promote part out of subassembly
    store.promotePart(p1);
    state = useDesignStore.getState();
    expect(state.parts.find((p) => p.id === p1)?.subAssemblyId).toBeNull();
  });
});

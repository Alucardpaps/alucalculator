import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '../design-studio/designStore';
import { extractPartFeatures } from '../design-studio/assembly/featureExtractor';
import { solveAssemblyMates } from '../design-studio/assembly/mateSolver';
import { detectCoaxialHolePairs, executeAutoFastenerAssembly } from '../design-studio/assembly/fastenerDetect';
import type { MateConstraint, HoleAxisFeature, PlanarFaceFeature } from '../design-studio/assembly/mateTypes';

describe('Design Studio: Assembly Mates & Smart Fasteners', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      mates: [],
      selectedMateId: null,
      selectedId: null,
      isMateModalOpen: false,
      isFastenersModalOpen: false,
    });
  });

  it('extracts geometric features for box, cylinder, and plate', () => {
    const boxPart: DesignPart = {
      id: 'box-1',
      kind: 'box',
      name: 'Box 1',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 30, depth: 40 },
    };

    const cylPart: DesignPart = {
      id: 'cyl-1',
      kind: 'cylinder',
      name: 'Cylinder 1',
      color: '#10b981',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 10, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { diameter: 20, length: 50 },
    };

    const boxFeats = extractPartFeatures(boxPart, true);
    expect(boxFeats.length).toBeGreaterThanOrEqual(6);
    expect(boxFeats.some((f) => f.name.includes('Top Face'))).toBe(true);

    const cylFeats = extractPartFeatures(cylPart, true);
    expect(cylFeats.some((f) => f.kind === 'hole-axis')).toBe(true);
    expect(cylFeats.some((f) => f.kind === 'planar-face')).toBe(true);
  });

  it('solves concentric and coincident mates accurately', () => {
    const plateA: DesignPart = {
      id: 'plate-a',
      kind: 'plate',
      name: 'Plate A',
      color: '#3b82f6',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 10, holeRadius: 5 },
    };

    const plateB: DesignPart = {
      id: 'plate-b',
      kind: 'plate',
      name: 'Plate B',
      color: '#10b981',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      position: { x: 50, y: 20, z: 30 }, // initially displaced
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 10, holeRadius: 5 },
    };

    const featsA = extractPartFeatures(plateA, true);
    const featsB = extractPartFeatures(plateB, true);

    const holeA = featsA.find((f) => f.kind === 'hole-axis') as HoleAxisFeature;
    const holeB = featsB.find((f) => f.kind === 'hole-axis') as HoleAxisFeature;

    const faceA = featsA.find((f) => f.id.includes('face-front')) as PlanarFaceFeature;
    const faceB = featsB.find((f) => f.id.includes('face-back')) as PlanarFaceFeature;

    expect(holeA).toBeDefined();
    expect(holeB).toBeDefined();

    // 1. Concentric Mate
    const concentricMate: MateConstraint = {
      id: 'mate-concentric-1',
      kind: 'concentric',
      partAId: plateA.id,
      featureA: holeA,
      partBId: plateB.id,
      featureB: holeB,
      active: true,
    };

    const res1 = solveAssemblyMates([plateA, plateB], [concentricMate], plateA.id);
    const solvedB1 = res1.parts.find((p) => p.id === plateB.id)!;
    // X and Y should now align with plate A's hole center (0, 0)
    expect(Math.abs(solvedB1.position.x)).toBeLessThan(0.01);
    expect(Math.abs(solvedB1.position.y)).toBeLessThan(0.01);

    // 2. Coincident Mate
    const coincidentMate: MateConstraint = {
      id: 'mate-coincident-1',
      kind: 'coincident',
      partAId: plateA.id,
      featureA: faceA,
      partBId: plateB.id,
      featureB: faceB,
      offset: 0,
      active: true,
    };

    const res2 = solveAssemblyMates([plateA, solvedB1], [concentricMate, coincidentMate], plateA.id);
    const solvedB2 = res2.parts.find((p) => p.id === plateB.id)!;
    // Z position should now be flush (offset 10mm since face-front is at +5 and face-back is at -5)
    expect(Math.abs(solvedB2.position.z - 10)).toBeLessThan(0.01);
  });

  it('supports mate suppression and flip', () => {
    const plateA: DesignPart = {
      id: 'plate-a',
      kind: 'plate',
      name: 'Plate A',
      color: '#3b82f6',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 10, holeRadius: 5 },
    };

    const plateB: DesignPart = {
      id: 'plate-b',
      kind: 'plate',
      name: 'Plate B',
      color: '#10b981',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      position: { x: 40, y: 40, z: 40 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 10, holeRadius: 5 },
    };

    const featsA = extractPartFeatures(plateA, true);
    const featsB = extractPartFeatures(plateB, true);
    const holeA = featsA.find((f) => f.kind === 'hole-axis') as HoleAxisFeature;
    const holeB = featsB.find((f) => f.kind === 'hole-axis') as HoleAxisFeature;

    const mate: MateConstraint = {
      id: 'm1',
      kind: 'concentric',
      partAId: plateA.id,
      featureA: holeA,
      partBId: plateB.id,
      featureB: holeB,
      active: true,
      suppressed: true, // Suppressed!
    };

    const res = solveAssemblyMates([plateA, plateB], [mate], plateA.id);
    const b = res.parts.find((p) => p.id === plateB.id)!;
    // When suppressed, positions should NOT be modified
    expect(b.position.x).toBe(40);
    expect(b.position.y).toBe(40);
  });

  it('detects coaxial hole stacks and executes auto fastener assembly', () => {
    const plateA: DesignPart = {
      id: 'p-a',
      kind: 'box',
      name: 'Plate A',
      color: '#3b82f6',
      visible: true,
      locked: true,
      parentId: null,
      position: { x: 0, y: 5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 10, depth: 50 },
      holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: 0, y: 0, depth: 10, isThroughAll: true }],
    };

    const plateB: DesignPart = {
      id: 'p-b',
      kind: 'box',
      name: 'Plate B',
      color: '#10b981',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 15, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 10, depth: 50 },
      holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: 0, y: 0, depth: 10, isThroughAll: true }],
    };

    const pairs = detectCoaxialHolePairs([plateA, plateB]);
    expect(pairs.length).toBe(1);
    expect(pairs[0].nominalMetricSize).toBe(6);
    expect(pairs[0].recommendedLength).toBeGreaterThanOrEqual(20);

    useDesignStore.setState({ parts: [plateA, plateB] });
    const autoRes = executeAutoFastenerAssembly();
    expect(autoRes.detected).toBe(1);
    expect(autoRes.fastenersAdded).toBe(2); // 1 bolt + 1 nut

    const updatedParts = useDesignStore.getState().parts;
    const updatedMates = useDesignStore.getState().mates;
    expect(updatedParts.some((p) => p.kind === 'hex-bolt')).toBe(true);
    expect(updatedParts.some((p) => p.kind === 'hex-nut')).toBe(true);
    expect(updatedMates.length).toBeGreaterThanOrEqual(1);
  });

  it('accurately classifies features from raycast without vector errors and extracts 6 faces for all parts', async () => {
    const { classifyFeatureFromRaycast, classifySurfaceFaceFromLocalNormal } = await import('../design-studio/assembly/featureExtractor');
    const THREE = await import('three');

    const customPart: DesignPart = {
      id: 'custom-part-1',
      kind: 'custom',
      name: 'Custom Bracket',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 100, y: 50, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 40, depth: 30 },
      holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: 10, y: 5, depth: 20, isThroughAll: true }],
    };

    // 1. Check all 6 faces extracted for custom part
    const feats = extractPartFeatures(customPart, true);
    expect(feats.some((f) => f.id.endsWith('face-top'))).toBe(true);
    expect(feats.some((f) => f.id.endsWith('face-bottom'))).toBe(true);
    expect(feats.some((f) => f.id.endsWith('face-front'))).toBe(true);
    expect(feats.some((f) => f.id.endsWith('face-back'))).toBe(true);
    expect(feats.some((f) => f.id.endsWith('face-right'))).toBe(true);
    expect(feats.some((f) => f.id.endsWith('face-left'))).toBe(true);

    // 2. Test classifySurfaceFaceFromLocalNormal
    expect(classifySurfaceFaceFromLocalNormal({ x: 0, y: 1, z: 0 })).toBe('top');
    expect(classifySurfaceFaceFromLocalNormal({ x: 0, y: -1, z: 0 })).toBe('bottom');
    expect(classifySurfaceFaceFromLocalNormal({ x: 0, y: 0, z: 1 })).toBe('front');
    expect(classifySurfaceFaceFromLocalNormal({ x: 0, y: 0, z: -1 })).toBe('back');
    expect(classifySurfaceFaceFromLocalNormal({ x: 1, y: 0, z: 0 })).toBe('right');
    expect(classifySurfaceFaceFromLocalNormal({ x: -1, y: 0, z: 0 })).toBe('left');

    // 3. Mock Three.js Mesh with worldToLocal
    const mockMesh = new THREE.Mesh();
    mockMesh.position.set(10, 5, 0); // scale 0.1
    mockMesh.updateMatrixWorld(true);

    // Hit on top face
    const topFeat = classifyFeatureFromRaycast(
      { x: 10, y: 7, z: 0 }, // world hit
      { x: 0, y: 1, z: 0 },   // local normal
      mockMesh,
      customPart
    );
    expect(topFeat).toBeDefined();
    expect(topFeat?.kind).toBe('planar-face');
    expect(topFeat?.id).toContain('face-top');

    // Hit near hole (localHit = { x: 10, y: 5 })
    const holeFeat = classifyFeatureFromRaycast(
      { x: 11, y: 7, z: 0.5 }, // world hit near hole (x=10mm -> 1cm, z=5mm -> 0.5cm)
      { x: 0, y: 1, z: 0 },
      mockMesh,
      customPart
    );
    expect(holeFeat).toBeDefined();
    expect(holeFeat?.kind).toBe('hole-axis');
    expect(holeFeat?.id).toContain('hole-h1');
  });

  it('completes in-context right-click mate workflow: Entity 1 pre-selection and Entity 2 snap', () => {
    const partA: DesignPart = {
      id: 'block-a',
      kind: 'box',
      name: 'Block A',
      color: '#3b82f6',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 50, depth: 50 },
    };

    const partB: DesignPart = {
      id: 'block-b',
      kind: 'box',
      name: 'Block B',
      color: '#10b981',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      position: { x: 150, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 50, depth: 50 },
    };

    useDesignStore.setState({ parts: [partA, partB] });

    // Step 1: User right clicks on Block A top face and clicks Mate
    useDesignStore.getState().openMateModal({
      partAId: 'block-a',
      featureAId: 'block-a-face-top',
      kind: 'coincident',
    });

    const draft = useDesignStore.getState().activeMateDraft;
    expect(draft?.partAId).toBe('block-a');
    expect(draft?.featureAId).toBe('block-a-face-top');
    expect(useDesignStore.getState().tool).toBe('mate');

    // Step 2: User clicks Block B bottom face -> sets Entity 2 and commits
    useDesignStore.getState().updateMateDraft({
      partBId: 'block-b',
      featureBId: 'block-b-face-bottom',
      kind: 'coincident',
    });

    const success = useDesignStore.getState().commitMateDraft();
    expect(success).toBe(true);

    const mates = useDesignStore.getState().mates;
    expect(mates.length).toBe(1);
    expect(mates[0].kind).toBe('coincident');

    // Verify Block B snapped in Y to touch Block A top face
    const solvedParts = useDesignStore.getState().parts;
    const solvedB = solvedParts.find((p) => p.id === 'block-b');
    expect(solvedB).toBeDefined();
    // Block A top face is at y = 25. Block B bottom face is at y = pos.y - 25.
    // For coincident mate: 25 = pos.y - 25 => pos.y = 50.
    expect(Math.round(solvedB!.position.y)).toBe(50);
  });

  it('SolidWorks Instant3D: updating part dimensions automatically updates connected mates', () => {
    const partA: DesignPart = {
      id: 'block-a',
      kind: 'box',
      name: 'Base Block',
      color: '#3b82f6',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 50, depth: 50 },
    };

    const partB: DesignPart = {
      id: 'block-b',
      kind: 'box',
      name: 'Top Block',
      color: '#10b981',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      position: { x: 0, y: 100, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 50, depth: 50 },
    };

    useDesignStore.setState({ parts: [partA, partB], mates: [] });

    // Mate top of A to bottom of B
    useDesignStore.getState().openMateModal({
      partAId: 'block-a',
      featureAId: 'block-a-face-top',
      kind: 'coincident',
    });
    useDesignStore.getState().updateMateDraft({
      partBId: 'block-b',
      featureBId: 'block-b-face-bottom',
      kind: 'coincident',
    });
    useDesignStore.getState().commitMateDraft();

    // Verify initial snap to y = 50
    let b = useDesignStore.getState().parts.find((p) => p.id === 'block-b')!;
    expect(Math.round(b.position.y)).toBe(50);

    // Instant3D: User edits Base Block height from 50 to 80 mm via direct dimension callout
    useDesignStore.getState().updatePartParams('block-a', { height: 80 });

    // Block B should automatically follow and adjust to y = 65 (40 + 25)
    b = useDesignStore.getState().parts.find((p) => p.id === 'block-b')!;
    expect(Math.round(b.position.y)).toBe(65);
  });

  it('Autodesk Inventor In-Place Editing: activates, switches, and returns cleanly', () => {
    const partA: DesignPart = {
      id: 'sub-part-1',
      kind: 'box',
      name: 'Part 1',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 30, height: 30, depth: 30 },
    };

    useDesignStore.setState({ parts: [partA], editingPartId: null });

    // Enter in-place edit mode
    useDesignStore.getState().setEditingPartId('sub-part-1');
    expect(useDesignStore.getState().editingPartId).toBe('sub-part-1');

    // Return to main assembly
    useDesignStore.getState().setEditingPartId(null);
    expect(useDesignStore.getState().editingPartId).toBeNull();
  });

  it('supports toggling grounded (fixed/float) constraint on components', () => {
    const partA: DesignPart = {
      id: 'anchor-part',
      kind: 'box',
      name: 'Anchor',
      color: '#3b82f6',
      visible: true,
      locked: false,
      grounded: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 40 },
    };

    useDesignStore.setState({ parts: [partA] });
    expect(useDesignStore.getState().parts[0].grounded).toBe(false);

    useDesignStore.getState().togglePartGrounded('anchor-part');
    expect(useDesignStore.getState().parts[0].grounded).toBe(true);

    useDesignStore.getState().togglePartGrounded('anchor-part');
    expect(useDesignStore.getState().parts[0].grounded).toBe(false);
  });

  it('contextual smart mate inference: selects concentric for 2 holes, coincident for 2 faces, tangent for cylinder+face', async () => {
    const { inferSmartMateKind, getValidMateKinds, extractPartFeatures } = await import('../design-studio/assembly/featureExtractor');

    const plate: DesignPart = {
      id: 'plate-1',
      kind: 'plate',
      name: 'Plate 1',
      color: '#3b82f6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 40, depth: 10, holeRadius: 4 },
      holes: [{ id: 'h1', type: 'clearance', size: 'M8', face: 'top', x: 20, y: 0 }],
    };

    const bolt: DesignPart = {
      id: 'bolt-1',
      kind: 'hex-bolt',
      name: 'Bolt M8',
      color: '#c5cdd6',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { diameter: 8, length: 30 },
    };

    const plateFeats = extractPartFeatures(plate, true);
    const boltFeats = extractPartFeatures(bolt, true);

    const holeFeat = plateFeats.find((f) => f.id.includes('hole-h1'));
    const plateFaceFeat = plateFeats.find((f) => f.kind === 'planar-face');
    const boltShaftFeat = boltFeats.find((f) => f.kind === 'hole-axis');
    const boltBearingFace = boltFeats.find((f) => f.kind === 'planar-face');

    expect(holeFeat).toBeDefined();
    expect(boltShaftFeat).toBeDefined();
    expect(plateFaceFeat).toBeDefined();
    expect(boltBearingFace).toBeDefined();

    // 1. Two hole/shaft axes -> concentric
    expect(inferSmartMateKind(holeFeat, boltShaftFeat)).toBe('concentric');
    const valAxes = getValidMateKinds(holeFeat, boltShaftFeat);
    expect(valAxes.recommended).toBe('concentric');
    expect(valAxes.incompatible).toContain('coincident');

    // 2. Two planar faces -> coincident
    expect(inferSmartMateKind(plateFaceFeat, boltBearingFace)).toBe('coincident');
    const valPlanes = getValidMateKinds(plateFaceFeat, boltBearingFace);
    expect(valPlanes.recommended).toBe('coincident');
    expect(valPlanes.incompatible).toContain('concentric');

    // 3. One shaft axis + one planar face -> tangent
    expect(inferSmartMateKind(boltShaftFeat, plateFaceFeat)).toBe('tangent');
    const valTangent = getValidMateKinds(boltShaftFeat, plateFaceFeat);
    expect(valTangent.recommended).toBe('tangent');

    // 4. Hole feature has descriptive name containing part name and size
    expect(holeFeat?.name).toContain('Plate 1');
    expect(holeFeat?.name).toContain('M8');
  });
});


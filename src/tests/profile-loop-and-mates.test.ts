import { describe, it, expect, beforeEach } from 'vitest';
import {
  circleLoop,
  rectangleLoop,
  stitchProfileEdges,
  sampleLoop,
  pointsToProfileLoop,
  ProfileEdge,
} from '@/cad/geometry/profileLoop';
import {
  extractClosedContours,
  assembleRegions,
  regionToExtrusionProfile,
} from '@/cad/geometry/contourAssembler';
import { CadEntity } from '@/cad/kernel/types';
import { extractPartFeatures } from '@/design-studio/assembly/featureExtractor';
import { solveAssemblyMates } from '@/design-studio/assembly/mateSolver';
import {
  detectCoaxialHolePairs,
  executeAutoFastenerAssembly,
} from '@/design-studio/assembly/fastenerDetect';
import { DesignPart, useDesignStore } from '@/design-studio/designStore';
import { useManufacturingStore } from '@/store/useManufacturingStore';

describe('Parametric Profile Loop Kernel (Phase 0)', () => {
  it('creates analytical circle loop with exact radius and center', () => {
    const loop = circleLoop({ x: 10, y: 20 }, 15);
    expect(loop.edges.length).toBe(1);
    expect(loop.edges[0].kind).toBe('circle');
    if (loop.edges[0].kind === 'circle') {
      expect(loop.edges[0].radius).toBe(15);
      expect(loop.edges[0].center).toEqual({ x: 10, y: 20 });
    }

    const sampled = sampleLoop(loop, 16);
    expect(sampled.length).toBeGreaterThanOrEqual(16);
  });

  it('stitches analytical lines and circular arc into a closed loop without polygon loss', () => {
    const rawEdges: ProfileEdge[] = [
      { kind: 'line', a: { x: 0, y: 0 }, b: { x: 50, y: 0 } },
      { kind: 'line', a: { x: 50, y: 0 }, b: { x: 50, y: 30 } },
      // Arc on top edge from (50, 30) curving down to (0, 30)
      {
        kind: 'arc',
        center: { x: 25, y: 30 },
        radius: 25,
        a0: 0,
        a1: Math.PI,
        ccw: true,
      },
      { kind: 'line', a: { x: 0, y: 30 }, b: { x: 0, y: 0 } },
    ];

    const stitched = stitchProfileEdges(rawEdges);
    expect(stitched.length).toBe(1);
    expect(stitched[0].edges.length).toBe(4);
    // Verify the arc edge is preserved analytically
    const arcEdge = stitched[0].edges.find((e) => e.kind === 'arc');
    expect(arcEdge).toBeDefined();
    if (arcEdge && arcEdge.kind === 'arc') {
      expect(arcEdge.radius).toBe(25);
      expect(arcEdge.center).toEqual({ x: 25, y: 30 });
    }
  });

  it('assembles 2D CAD entities into ParametricRegion with analytical hole circles', () => {
    const entities: CadEntity[] = [
      // Outer 100x80 rectangle
      {
        id: 'outer-rect',
        layerId: '0',
        color: '#fff',
        isVisible: true,
        isSelected: false,
        geometry: {
          type: 'RECTANGLE',
          center: { x: 0, y: 0 },
          width: 100,
          height: 80,
        },
      },
      // Inner Ø20 circular hole
      {
        id: 'inner-hole',
        layerId: '0',
        color: '#fff',
        isVisible: true,
        isSelected: false,
        geometry: {
          type: 'CIRCLE',
          center: { x: 0, y: 0 },
          radius: 10,
        },
      },
    ];

    const regions = assembleRegions(entities);
    expect(regions.length).toBe(1);
    const reg = regions[0];
    expect(reg.holes.length).toBe(1);

    const profile = regionToExtrusionProfile(reg);
    expect(profile.parametricRegion).toBeDefined();
    expect(profile.parametricRegion?.outer.edges.length).toBe(4);
    expect(profile.parametricRegion?.holes.length).toBe(1);
    expect(profile.parametricRegion?.holes[0].edges[0].kind).toBe('circle');
  });
});

describe('3D Assembly Mates & Kinematic Solver (Phase 1)', () => {
  it('extracts hole axes and planar face features from parametric profile parts', () => {
    const part: DesignPart = {
      id: 'test-profile-1',
      kind: 'profile',
      name: 'Plate with Hole',
      color: '#fff',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 10, y: 20, z: 30 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { extrudeDepth: 25 },
      profileRegion: {
        outer: rectangleLoop({ x: 0, y: 0 }, 80, 60),
        holes: [circleLoop({ x: 15, y: 5 }, 6)],
      },
    };

    const features = extractPartFeatures(part, true);
    const holeFeature = features.find((f) => f.kind === 'hole-axis');
    expect(holeFeature).toBeDefined();
    if (holeFeature && holeFeature.kind === 'hole-axis') {
      expect(holeFeature.radius).toBe(6);
      expect(holeFeature.depth).toBe(25);
      // World position check
      expect(holeFeature.center.x).toBe(10 + 15);
      expect(holeFeature.center.z).toBe(30 + 5);
    }
  });

  it('solves concentric mate aligning hole axis of part B to part A', () => {
    const partA: DesignPart = {
      id: 'part-a-grounded',
      kind: 'plate',
      name: 'Base Plate',
      color: '#38bdf8',
      visible: true,
      locked: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, height: 100, depth: 10, holeRadius: 5 },
    };

    const partB: DesignPart = {
      id: 'part-b-moving',
      kind: 'hex-bolt',
      name: 'Bolt M10',
      color: '#94a3b8',
      visible: true,
      locked: false,
      parentId: null,
      // Intentionally offset in X and Y
      position: { x: 50, y: 40, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { diameter: 10, length: 40 },
    };

    const featA = extractPartFeatures(partA, true).find((f) => f.kind === 'hole-axis')!;
    const featB = extractPartFeatures(partB, true).find((f) => f.kind === 'hole-axis')!;

    const mates = [
      {
        id: 'mate-1',
        kind: 'concentric' as const,
        partAId: partA.id,
        featureA: featA,
        partBId: partB.id,
        featureB: featB,
        active: true,
      },
    ];

    const { parts, result } = solveAssemblyMates([partA, partB], mates, partA.id);
    expect(result.success).toBe(true);
    expect(result.appliedMates).toBe(1);

    const solvedA = parts.find((p) => p.id === partA.id)!;
    const solvedB = parts.find((p) => p.id === partB.id)!;
    const featAAfter = extractPartFeatures(solvedA, true).find((f) => f.kind === 'hole-axis')!;
    const featBAfter = extractPartFeatures(solvedB, true).find((f) => f.kind === 'hole-axis')!;
    // Bolt shaft axis should be collinear with hole axis (X and Y coordinates match)
    expect(Math.abs(featBAfter.center.x - featAAfter.center.x)).toBeLessThan(1e-4);
    expect(Math.abs(featBAfter.center.y - featAAfter.center.y)).toBeLessThan(1e-4);
  });
});

describe('AI-Assisted Assembly Fastener Auto-Detection Protocol', () => {
  beforeEach(() => {
    useDesignStore.setState({ parts: [], mates: [] });
    useManufacturingStore.setState({
      branches: [{ id: 'main', branchName: 'main', commits: [], isMerged: false }],
      activeBranchId: 'main',
      fasteners: null,
    });
  });

  it('autonomously detects coaxial holes across two adjacent plates and sizes standard ISO bolts', () => {
    // Two stacked plates with M8 holes (radius = 4 mm)
    const plate1: DesignPart = {
      id: 'plate-bottom',
      kind: 'profile',
      name: 'Bottom Flange',
      color: '#38bdf8',
      visible: true,
      locked: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { extrudeDepth: 15 },
      profileRegion: {
        outer: rectangleLoop({ x: 0, y: 0 }, 100, 100),
        holes: [circleLoop({ x: 20, y: 20 }, 4.2)], // Ø8.4 clearance for M8
      },
    };

    const plate2: DesignPart = {
      id: 'plate-top',
      kind: 'profile',
      name: 'Top Bracket',
      color: '#22d3ee',
      visible: true,
      locked: false,
      parentId: null,
      // Stacked right on top
      position: { x: 0, y: 15, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { extrudeDepth: 15 },
      profileRegion: {
        outer: rectangleLoop({ x: 0, y: 0 }, 100, 100),
        holes: [circleLoop({ x: 20, y: 20 }, 4.2)], // Coaxial hole
      },
    };

    useDesignStore.setState({ parts: [plate1, plate2], mates: [] });

    // 1. Test detection
    const pairs = detectCoaxialHolePairs([plate1, plate2]);
    expect(pairs.length).toBe(1);
    expect(pairs[0].nominalMetricSize).toBe(8); // Detected M8
    expect(pairs[0].recommendedLength).toBeGreaterThanOrEqual(30);

    // 2. Test execution of AI Auto-Assembly
    const execRes = executeAutoFastenerAssembly();
    expect(execRes.detected).toBe(1);
    expect(execRes.fastenersAdded).toBe(2); // 1 bolt + 1 nut

    // Verify Manufacturing Store branch created per SKILL.md rule 3
    const mfgState = useManufacturingStore.getState();
    expect(mfgState.branches.length).toBeGreaterThan(1);
    expect(mfgState.fasteners?.detected).toBe(1);
    expect(mfgState.fasteners?.autoAssembled).toBe(true);

    // Verify Design Store parts and mates
    const currentDesign = useDesignStore.getState();
    expect(currentDesign.parts.length).toBe(4); // 2 plates + 1 bolt + 1 nut
    const bolt = currentDesign.parts.find((p) => p.kind === 'hex-bolt');
    const nut = currentDesign.parts.find((p) => p.kind === 'hex-nut');
    expect(bolt).toBeDefined();
    expect(nut).toBeDefined();
    expect(bolt?.params.diameter).toBe(8);
    expect(nut?.params.innerDiameter).toBe(8);
    expect(currentDesign.mates.length).toBe(1);
    expect(currentDesign.mates[0].kind).toBe('concentric');
  });
});

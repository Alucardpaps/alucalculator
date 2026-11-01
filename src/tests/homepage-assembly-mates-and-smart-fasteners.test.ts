import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignStore, type DesignPart } from '../design-studio/designStore';
import { detectCoaxialHolePairs, executeAutoFastenerAssembly } from '../design-studio/assembly/fastenerDetect';
import { solveAssemblyMates } from '../design-studio/assembly/mateSolver';
import type { MateConstraint, HoleAxisFeature, PlanarFaceFeature } from '../design-studio/assembly/mateTypes';

describe('Homepage & CAD Studio: SolidWorks-Grade Assembly Mates & Smart Fasteners (ISO 4762 / VDI 2230)', () => {
  beforeEach(() => {
    useDesignStore.setState({
      parts: [],
      subAssemblies: [],
      mates: [],
      selectedId: null,
      editingPartId: null,
      tool: 'select',
    });
  });

  it('1. Coaxial Hole Detection: accurately detects aligned holes across 2 distinct plates', () => {
    // Two parallel plates stacked along Y axis (thickness 15mm each)
    const plateTop: DesignPart = {
      id: 'plate-top',
      kind: 'box',
      name: 'Flange Plate Top',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 7.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 15, depth: 80 },
      holes: [
        {
          id: 'hole-top-1',
          size: 'M8',
          x: 40,
          y: 40,
          face: 'top',
          type: 'clearance',
          isThroughAll: true,
          depth: 15,
          diameter: 9.0,
        },
      ],
    };

    const plateBottom: DesignPart = {
      id: 'plate-bottom',
      kind: 'box',
      name: 'Flange Plate Bottom',
      color: '#334155',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: -7.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 15, depth: 80 },
      holes: [
        {
          id: 'hole-bot-1',
          size: 'M8',
          x: 40,
          y: 40,
          face: 'top',
          type: 'clearance',
          isThroughAll: true,
          depth: 15,
          diameter: 9.0,
        },
      ],
    };

    const pairs = detectCoaxialHolePairs([plateTop, plateBottom]);
    expect(pairs.length).toBeGreaterThanOrEqual(1);

    const match = pairs[0];
    // Sizing should resolve to metric M8
    expect(match.nominalMetricSize).toBe(8);
    // Standard recommended bolt length for 30mm grip + nut should be at least 40mm
    expect(match.recommendedLength).toBeGreaterThanOrEqual(40);
  });

  it('2. SolidWorks Smart Fastener Execution: auto-mounts ISO 4762 bolt and ISO 4032 nut', () => {
    const plateTop: DesignPart = {
      id: 'plate-1',
      kind: 'box',
      name: 'Plate 1',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 20, depth: 60 },
      holes: [
        {
          id: 'h1',
          size: 'M10',
          x: 30,
          y: 30,
          face: 'top',
          type: 'clearance',
          isThroughAll: true,
          depth: 20,
          diameter: 11.0,
        },
      ],
    };

    const plateBottom: DesignPart = {
      id: 'plate-2',
      kind: 'box',
      name: 'Plate 2',
      color: '#334155',
      visible: true,
      locked: true,
      grounded: true,
      parentId: null,
      position: { x: 0, y: -10, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 60, height: 20, depth: 60 },
      holes: [
        {
          id: 'h2',
          size: 'M10',
          x: 30,
          y: 30,
          face: 'top',
          type: 'clearance',
          isThroughAll: true,
          depth: 20,
          diameter: 11.0,
        },
      ],
    };

    useDesignStore.setState({ parts: [plateTop, plateBottom] });

    const result = executeAutoFastenerAssembly();
    expect(result.detected).toBe(1);
    expect(result.fastenersAdded).toBe(2); // 1 bolt + 1 nut

    const updatedParts = useDesignStore.getState().parts;
    const bolt = updatedParts.find((p) => p.kind === 'hex-bolt');
    const nut = updatedParts.find((p) => p.kind === 'hex-nut');

    expect(bolt).toBeDefined();
    expect(nut).toBeDefined();
    expect(bolt?.name).toContain('ISO 4762 Bolt M10');
    expect(nut?.name).toContain('ISO 4032 Nut M10');

    // Mates should be populated with concentric constraint
    const mates = useDesignStore.getState().mates;
    expect(mates.length).toBeGreaterThanOrEqual(1);
    expect(mates[0].kind).toBe('concentric');
  });

  it('3. SolidWorks Mate Solver: solves concentric kinematic constraint between hole and bolt', () => {
    const partA: DesignPart = {
      id: 'part-flange',
      kind: 'box',
      name: 'Base Flange',
      color: '#475569',
      visible: true,
      locked: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 50, height: 10, depth: 50 },
      holes: [
        {
          id: 'h1',
          size: 'M8',
          x: 0,
          y: 0,
          face: 'top',
          type: 'clearance',
          isThroughAll: true,
          depth: 10,
          diameter: 9.0,
        },
      ],
    };

    const partB: DesignPart = {
      id: 'part-bolt',
      kind: 'hex-bolt',
      name: 'ISO 4762 M8 Bolt',
      color: '#94a3b8',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 15, y: 25, z: 10 }, // Initially offset / unaligned
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { diameter: 8, length: 30 },
    };

    const concentricMate: MateConstraint = {
      id: 'mate-concentric-1',
      kind: 'concentric',
      name: 'Concentric Bolt to Hole',
      partAId: 'part-flange',
      featureA: {
        kind: 'hole-axis',
        id: 'part-flange-hole-h1',
        name: 'Hole Axis',
        center: { x: 0, y: 20, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4.5,
        depth: 10,
      } as HoleAxisFeature,
      partBId: 'part-bolt',
      featureB: {
        kind: 'hole-axis',
        id: 'part-bolt-shaft-axis',
        name: 'Bolt Shaft Axis',
        center: { x: 0, y: -15, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4,
        depth: 30,
      } as HoleAxisFeature,
    };

    const res = solveAssemblyMates([partA, partB], [concentricMate]);
    expect(res.result.success).toBe(true);

    const solvedBolt = res.parts.find((p) => p.id === 'part-bolt');
    // Bolt X and Z coordinates must be aligned to (0, 0)
    expect(Math.abs(solvedBolt!.position.x)).toBeLessThan(0.01);
    expect(Math.abs(solvedBolt!.position.z)).toBeLessThan(0.01);
  });

  it('4. Coincident Mate: aligns planar faces with zero gap', () => {
    const blockA: DesignPart = {
      id: 'plate-a',
      kind: 'plate',
      name: 'Bottom Plate',
      color: '#334155',
      visible: true,
      locked: true,
      parentId: null,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 10 },
    };

    const blockB: DesignPart = {
      id: 'plate-b',
      kind: 'plate',
      name: 'Top Plate',
      color: '#64748b',
      visible: true,
      locked: false,
      parentId: null,
      position: { x: 0, y: 0, z: 35 }, // Floating in +Z
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 40, height: 40, depth: 10 },
    };

    const coincidentMate: MateConstraint = {
      id: 'mate-coincident-1',
      kind: 'coincident',
      name: 'Plate Contact Face',
      partAId: 'plate-a',
      featureA: {
        kind: 'planar-face',
        id: 'plate-a-face-front',
        name: 'Front Face',
        origin: { x: 0, y: 0, z: 5 },
        normal: { x: 0, y: 0, z: 1 },
      } as PlanarFaceFeature,
      partBId: 'plate-b',
      featureB: {
        kind: 'planar-face',
        id: 'plate-b-face-back',
        name: 'Back Face',
        origin: { x: 0, y: 0, z: -5 },
        normal: { x: 0, y: 0, z: -1 },
      } as PlanarFaceFeature,
      offset: 0,
    };

    const res = solveAssemblyMates([blockA, blockB], [coincidentMate]);
    expect(res.result.success).toBe(true);

    const solvedB = res.parts.find((p) => p.id === 'plate-b');
    // Plate B back face at z - 5 must meet Plate A front face at z = 5 -> Plate B position.z must equal 10
    expect(Math.abs(solvedB!.position.z - 10)).toBeLessThan(0.01);
  });
});

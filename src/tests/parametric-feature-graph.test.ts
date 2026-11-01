import { describe, it, expect, vi } from 'vitest';
import {
  ParameterTable,
  IdentityMap,
  FeatureGraph,
  ReverseEditHandler,
  RebuildScheduler,
} from '@/kernel/parametric';
import type { DesignPart } from '@/design-studio/designStore';
import type { MateConstraint } from '@/design-studio/assembly/mateTypes';

describe('Parametric Table Kernel (ParameterTable)', () => {
  it('stores named parameters with units and bounds checking', () => {
    const table = new ParameterTable([
      { name: 'W_plate', value: 100, unit: 'mm', min: 10, max: 500 },
      { name: 't_wall', value: 3.5, unit: 'mm', min: 0.8 },
    ]);

    expect(table.getValue('W_plate')).toBe(100);
    expect(table.getValue('t_wall')).toBe(3.5);

    // Valid update
    table.setValue('W_plate', 120);
    expect(table.getValue('W_plate')).toBe(120);

    // Out of bounds update throws
    expect(() => table.setValue('W_plate', 600)).toThrow(/exceeds maximum/);
    expect(() => table.setValue('t_wall', 0.4)).toThrow(/below minimum/);
  });

  it('evaluates mathematical formulas referencing named parameters', () => {
    const table = new ParameterTable([
      { name: 'W', value: 100, unit: 'mm' },
      { name: 'R_bore', value: 15, unit: 'mm' },
      { name: 'offset', value: 5, unit: 'mm' },
    ]);

    expect(table.evaluate('W / 2')).toBe(50);
    expect(table.evaluate('W / 2 + R_bore + offset')).toBe(70);
    expect(table.evaluate('sqrt(W * 4)')).toBe(20);
  });

  it('notifies subscribers on value changes', () => {
    const table = new ParameterTable([{ name: 'D_shaft', value: 20, unit: 'mm' }]);
    const listener = vi.fn();
    table.subscribe(listener);

    table.setValue('D_shaft', 25);
    expect(listener).toHaveBeenCalledWith('D_shaft', 25);
  });
});

describe('IdentityMap & FeatureGraph DAG Rebuild', () => {
  it('performs topological sorting and detects cycles', () => {
    const map = new IdentityMap();
    map.registerFeature({
      id: 'feat_sketch',
      name: 'Base Sketch',
      kind: 'sketch',
      inputs: [],
      params: ['W_plate'],
    });
    map.registerFeature({
      id: 'feat_extrude',
      name: 'Base Extrude',
      kind: 'extrude',
      inputs: ['feat_sketch'],
      params: ['L_extrude'],
    });
    map.registerFeature({
      id: 'feat_hole',
      name: 'Center Bore',
      kind: 'hole',
      inputs: ['feat_extrude'],
      params: ['R_bore'],
    });

    const graph = new FeatureGraph(new ParameterTable(), map);
    const sorted = graph.topologicalSort();
    expect(sorted).toEqual(['feat_sketch', 'feat_extrude', 'feat_hole']);

    // Introduce cycle
    map.registerFeature({
      id: 'feat_sketch',
      name: 'Base Sketch',
      kind: 'sketch',
      inputs: ['feat_hole'], // creates cycle
      params: ['W_plate'],
    });

    expect(() => graph.topologicalSort()).toThrow(/Cyclic dependency detected/);
  });

  it('rebuilds 3D solid part from parameter changes and updates live DFM score', () => {
    const table = new ParameterTable([
      { name: 'W_plate', value: 100, unit: 'mm' },
      { name: 'L_depth', value: 20, unit: 'mm' },
      { name: 'R_hole', value: 5, unit: 'mm' },
    ]);

    const map = new IdentityMap();
    map.registerFeature({
      id: 'feat_sketch',
      name: 'Plate Sketch',
      kind: 'sketch',
      inputs: [],
      params: ['W_plate'],
      sourceId: 'cad_line_1',
      targetId: 'part_plate_1',
    });
    map.registerFeature({
      id: 'feat_extrude',
      name: 'Plate Extrude',
      kind: 'extrude',
      inputs: ['feat_sketch'],
      params: ['L_depth'],
      targetId: 'part_plate_1',
    });
    map.registerFeature({
      id: 'feat_hole',
      name: 'Hole Feature',
      kind: 'hole',
      inputs: ['feat_extrude'],
      params: ['R_hole'],
      targetId: 'part_plate_1',
    });

    map.bindParam({
      paramName: 'W_plate',
      featureId: 'feat_sketch',
      role: 'width',
    });
    map.bindParam({
      paramName: 'L_depth',
      featureId: 'feat_extrude',
      role: 'depth',
    });
    map.bindParam({
      paramName: 'R_hole',
      featureId: 'feat_hole',
      role: 'radius',
      entityRef: { store: 'studio', id: 'h1' },
    });

    const initialPart: DesignPart = {
      id: 'part_plate_1',
      name: 'Plate 100x100',
      kind: 'plate',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, length: 100, depth: 20 },
      holes: [
        {
          id: 'h1',
          size: 'M10',
          x: 40, // 10mm from edge (half-width is 50)
          y: 0,
          type: 'clearance',
          diameter: 10,
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#ffffff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const graph = new FeatureGraph(table, map);
    graph.setParts([initialPart]);

    // Initial rebuild
    graph.markFeatureDirty('feat_sketch');
    const res1 = graph.rebuild();
    expect(res1.success).toBe(true);
    expect(res1.dfmReport.passed).toBe(true);

    // Now increase R_hole from 5mm to 8mm (diameter becomes 16mm)
    // Center at 40, edge at 50 -> remaining wall becomes 50 - (40 + 8) = 2mm (< 5mm VDI critical limit)
    table.setValue('R_hole', 8);
    const res2 = graph.rebuild();
    expect(res2.success).toBe(true);
    const updatedPart = res2.parts.find((p) => p.id === 'part_plate_1');
    expect(updatedPart?.holes?.[0].diameter).toBe(16);

    // Live DFM reacts immediately and detects edge clearance violation
    expect(res2.dfmReport.passed).toBe(false);
    expect(res2.dfmReport.criticalCount).toBeGreaterThan(0);
    const edgeIssue = res2.dfmReport.issues.find((i) => i.ruleId === 'HOLE_EDGE_CLEARANCE');
    expect(edgeIssue).toBeDefined();
    expect(edgeIssue?.severity).toBe('CRITICAL');
  });

  it('re-solves kinematic mates across connected parts upon rebuild', () => {
    const table = new ParameterTable([
      { name: 'X_offset', value: 0, unit: 'mm' },
    ]);

    const map = new IdentityMap();
    map.registerFeature({
      id: 'feat_part_a',
      name: 'Fixed Base',
      kind: 'extrude',
      inputs: [],
      params: [],
      targetId: 'part_a',
    });
    map.registerFeature({
      id: 'feat_part_b',
      name: 'Moving Plate',
      kind: 'extrude',
      inputs: ['feat_part_a'],
      params: ['X_offset'],
      targetId: 'part_b',
    });

    const partA: DesignPart = {
      id: 'part_a',
      name: 'Base Part',
      kind: 'box',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 100, height: 20, depth: 100 },
      holes: [
        {
          id: 'ha',
          size: 'M8',
          x: 0,
          y: 0,
          type: 'clearance',
          diameter: 9,
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#fff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: true,
    };

    const partB: DesignPart = {
      id: 'part_b',
      name: 'Target Part',
      kind: 'box',
      position: { x: 50, y: 20, z: 50 }, // Misaligned
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      params: { width: 80, height: 20, depth: 80 },
      holes: [
        {
          id: 'hb',
          size: 'M8',
          x: 0,
          y: 0,
          type: 'clearance',
          diameter: 9,
          isThrough: true,
          face: 'top',
        },
      ],
      color: '#fff',
      roughness: 0.5,
      metalness: 0.5,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const mate: MateConstraint = {
      id: 'mate_concentric_ab',
      kind: 'concentric',
      partAId: 'part_a',
      partBId: 'part_b',
      featureA: {
        kind: 'hole-axis',
        id: 'part_a-hole-ha',
        name: 'Hole A Axis',
        center: { x: 0, y: 10, z: 0 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4.5,
        depth: 20,
      },
      featureB: {
        kind: 'hole-axis',
        id: 'part_b-hole-hb',
        name: 'Hole B Axis',
        center: { x: 50, y: 10, z: 50 },
        axis: { x: 0, y: 1, z: 0 },
        radius: 4.5,
        depth: 20,
      },
    };

    const graph = new FeatureGraph(table, map);
    graph.setParts([partA, partB]);
    graph.setMates([mate]);

    graph.markFeatureDirty('feat_part_b');
    const res = graph.rebuild();
    expect(res.success).toBe(true);

    // Part B position should be shifted to align concentric axes (X=0, Z=0)
    const solvedB = res.parts.find((p) => p.id === 'part_b');
    expect(solvedB?.position.x).toBeCloseTo(0, 1);
    expect(solvedB?.position.z).toBeCloseTo(0, 1);
  });
});

describe('Reverse Edit & Rebuild Scheduler', () => {
  it('translates 3D property modifications back to ParameterTable and 2D CAD entity', () => {
    const table = new ParameterTable([{ name: 'W_beam', value: 80, unit: 'mm' }]);
    const map = new IdentityMap();
    map.registerFeature({
      id: 'feat_beam',
      name: 'Beam Extrusion',
      kind: 'extrude',
      inputs: [],
      params: ['W_beam'],
      sourceId: 'cad_rect_1',
      targetId: 'beam_part_3d',
    });
    map.bindParam({
      paramName: 'W_beam',
      featureId: 'feat_beam',
      role: 'width',
    });

    const graph = new FeatureGraph(table, map);
    const reverseHandler = new ReverseEditHandler(graph);

    const editRes = reverseHandler.apply3DPropertyChange('beam_part_3d', 'width', 120);
    expect(editRes.success).toBe(true);
    expect(editRes.paramName).toBe('W_beam');
    expect(editRes.oldValue).toBe(80);
    expect(editRes.newValue).toBe(120);
    expect(editRes.affectedCadEntityId).toBe('cad_rect_1');
    expect(table.getValue('W_beam')).toBe(120);
  });

  it('coalesces rapid rebuild calls within scheduler debounce window', async () => {
    const graph = new FeatureGraph();
    const scheduler = new RebuildScheduler(graph, 20); // 20ms debounce
    const listener = vi.fn();
    scheduler.subscribe(listener);

    // Call schedule multiple times rapidly
    scheduler.scheduleRebuild();
    scheduler.scheduleRebuild();
    scheduler.scheduleRebuild();

    expect(listener).not.toHaveBeenCalled();

    // Wait for debounce timer to fire
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(listener).toHaveBeenCalledTimes(1);

    scheduler.dispose();
  });
});

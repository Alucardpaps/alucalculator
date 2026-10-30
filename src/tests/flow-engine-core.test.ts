import { describe, it, expect } from 'vitest';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';
import { arePortsCompatible, validateGraphPorts } from '@/flow/core/ports';
import { SpurGearNode } from '@/flow/nodes/Mechanical/mech-gear-spur';
import { DxfExportNode } from '@/flow/nodes/Export/ExportNodes';
import type { FlowGraphEdge, FlowGraphNode } from '@/flow/types/core';

function node(id: string, schemaId: string, data: Record<string, unknown> = {}): FlowGraphNode {
  return { id, type: 'engineering', data: { schemaId, ...data } };
}

function edge(id: string, source: string, sourceHandle: string, target: string, targetHandle: string): FlowGraphEdge {
  return { id, source, sourceHandle, target, targetHandle };
}

describe('Flow engine core — ports, hard-stop, gear, export', () => {
  it('rejects implicit port casts (number ≠ module_mm)', () => {
    expect(arePortsCompatible('number', 'module_mm')).toBe(false);
    expect(arePortsCompatible('module_mm', 'module_mm')).toBe(true);
    expect(arePortsCompatible('torque_nm', 'force_n')).toBe(false);
  });

  it('hard-stops the graph on unit mismatch', () => {
    const nodes = [
      node('mod', 'math-add', { a: 2, b: 0 }),
      node('gear', 'mech-gear-spur'),
    ];
    const edges = [
      edge('e1', 'mod', 'result', 'gear', 'module_mm'),
    ];
    const check = validateGraphPorts(nodes, edges, NODE_REGISTRY);
    expect(check.valid).toBe(false);
    expect(check.mismatches[0].message).toMatch(/Unit mismatch/);

    const result = new FlowEngine(nodes, edges, NODE_REGISTRY).execute();
    expect(result.success).toBe(false);
    expect(result.errors.has('GRAPH')).toBe(true);
  });

  it('blocks downstream nodes when a node fails validation', () => {
    const nodes = [
      node('div', 'math-divide', { a: 10, b: 0 }),
      node('mul', 'math-multiply', { b: 2 }),
    ];
    const edges = [
      edge('e1', 'div', 'result', 'mul', 'a'),
    ];
    const result = new FlowEngine(nodes, edges, NODE_REGISTRY).execute();
    expect(result.success).toBe(false);
    expect(result.nodeStatus.get('div')).toBe('error');
    expect(result.nodeStatus.get('mul')).toBe('blocked');
    expect(result.nodeResults.has('mul')).toBe(false);
  });

  it('recomputes only the dirty subtree on the second run', () => {
    const nodes = [
      node('a', 'math-add', { a: 1, b: 2 }),
      node('b', 'math-multiply', { b: 10 }),
    ];
    const edges = [edge('e1', 'a', 'result', 'b', 'a')];
    const engine = new FlowEngine(nodes, edges, NODE_REGISTRY);

    const first = engine.execute({ full: true });
    expect(first.success).toBe(true);
    expect(first.nodeResults.get('b')?.result).toBe(30);
    expect(first.nodeStatus.get('a')).toBe('computed');

    const second = engine.execute();
    expect(second.nodeStatus.get('a')).toBe('cached');
    expect(second.nodeStatus.get('b')).toBe('cached');
    expect(second.nodeResults.get('b')?.result).toBe(30);

    engine.markDirty('a');
    const third = engine.execute();
    expect(third.nodeStatus.get('a')).toBe('cached');
    expect(third.nodeResults.get('b')?.result).toBe(30);

    engine.setGraph(
      [
        node('a', 'math-add', { a: 4, b: 2 }),
        node('b', 'math-multiply', { b: 10 }),
      ],
      edges
    );
    engine.markDirty('a');
    const fourth = engine.execute();
    expect(fourth.nodeStatus.get('a')).toBe('computed');
    expect(fourth.nodeStatus.get('b')).toBe('computed');
    expect(fourth.nodeResults.get('b')?.result).toBe(60);
  });

  it('computes DIN 3960 spur gear geometry, contact ratio, and involute DXF', () => {
    const out = SpurGearNode.compute({
      module_mm: 2,
      pinion_teeth: 20,
      gear_teeth: 40,
      pressure_angle_deg: 20,
      profile_shift: 0,
      face_width_mm: 20,
      torque_nm: 50,
    });

    expect(out.pitch_diameter_mm).toBe(40);
    expect(out.base_circle_mm).toBeCloseTo(40 * Math.cos((20 * Math.PI) / 180), 3);
    expect(out.addendum_circle_mm).toBe(44);
    expect(out.dedendum_circle_mm).toBe(35);
    expect(out.center_distance_mm).toBe(60);
    expect(out.contact_ratio).toBeGreaterThan(1.2);
    expect(out.contact_ratio).toBeLessThan(2.2);
    expect(out.geometry).toContain('SECTION');
    expect(out.geometry).toContain('PITCH_CIRCLE');
    expect(out.geometry).toContain('PART_CONTOUR');
    expect(out.gear_geometry.involute.length).toBeGreaterThan(4);
    expect(out.validation_report.valid).toBe(true);
  });

  it('blocks DXF export when upstream validation_report.valid is false', () => {
    const blocked = DxfExportNode.validate({
      geometry: 'SECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF',
      validation_report: { valid: false, errors: ['SF < 1'] },
    });
    expect(blocked.valid).toBe(false);
    expect(blocked.errors[0]).toMatch(/Export blocked/);

    const ok = DxfExportNode.validate({
      geometry: SpurGearNode.compute({
        module_mm: 2,
        pinion_teeth: 20,
        gear_teeth: 40,
        pressure_angle_deg: 20,
        face_width_mm: 20,
      }).geometry,
      validation_report: { valid: true, errors: [], warnings: [] },
    });
    expect(ok.valid).toBe(true);
  });

  it('runs a typed gear pipeline: module constant → spur → dxf export', () => {
    const nodes = [
      node('m', 'input-constant-module', { value: 2 }),
      node('gear', 'mech-gear-spur', {
        pinion_teeth: 20,
        gear_teeth: 40,
        pressure_angle_deg: 20,
        face_width_mm: 20,
      }),
      node('dxf', 'export-dxf'),
    ];
    const edges = [
      edge('e1', 'm', 'value', 'gear', 'module_mm'),
      edge('e2', 'gear', 'geometry', 'dxf', 'geometry'),
      edge('e3', 'gear', 'validation_report', 'dxf', 'validation_report'),
    ];
    const result = new FlowEngine(nodes, edges, NODE_REGISTRY).execute();
    expect(result.success).toBe(true);
    expect(result.nodeResults.get('gear')?.pitch_diameter_mm).toBe(40);
    expect(result.nodeResults.get('dxf')?.dxf_file).toContain('EOF');
  });
});

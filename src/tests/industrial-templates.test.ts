import { describe, it, expect } from 'vitest';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';
import { ENGINEERING_TEMPLATES } from '@/flow/templates/engineeringTemplates';
import { validateGraphPorts } from '@/flow/core/ports';
import { PowerTorqueNode } from '@/flow/nodes/Mechanical/mech-power-torque';
import { HelicalGearNode } from '@/flow/nodes/Mechanical/mech-gear-helical';
import { PressureVesselCodeNode } from '@/flow/nodes/Mechanical/mech-pressure-vessel';
import { BearingLifeNode, SpringDesignNode } from '@/flow/nodes/Mechanical/EngineeringNodes';
import { SpurGearNode } from '@/flow/nodes/Mechanical/mech-gear-spur';
import { collectEngineeringBundle } from '@/export/zip/flow-bundle';
import { buildZip } from '@/export/zip/zip-builder';
import { dxfToSvgPreview, parseDxfEntities } from '@/viewers/dxf-preview';
import type { FlowGraphEdge, FlowGraphNode } from '@/flow/types/core';

describe('Industrial node kernels', () => {
  it('converts 7.5 kW at 1450 rpm with the 9550 convention', () => {
    const out = PowerTorqueNode.compute({ power_kw: 7.5, rpm: 1450 });
    expect(out.torque_nm).toBeCloseTo((9550 * 7.5) / 1450, 4);
    expect(PowerTorqueNode.validate({ power_kw: 0, rpm: 1450 }).valid).toBe(false);
  });

  it('computes helical mt, Fa = Ft tan(β), and εγ = εα + εβ', () => {
    const out = HelicalGearNode.compute({
      module_mm: 3,
      pinion_teeth: 20,
      gear_teeth: 60,
      pressure_angle_deg: 20,
      helix_angle_deg: 15,
      face_width_mm: 40,
      torque_nm: 200,
    });
    const beta = (15 * Math.PI) / 180;
    expect(out.mt_mm).toBeCloseTo(3 / Math.cos(beta), 4);
    expect(out.Fa).toBeCloseTo(out.Ft * Math.tan(beta), 2);
    expect(out.total_contact_ratio).toBeCloseTo(out.contact_ratio_transverse + out.overlap_ratio, 3);
    expect(out.geometry).toContain('SECTION');
    expect(out.geometry).toContain('PITCH_CIRCLE');
  });

  it('sizes ASME UG-27 and EN 13445 thickness', () => {
    const out = PressureVesselCodeNode.compute({ P: 1.6, R: 400, S: 138, E: 0.85, CA: 1.5 });
    const tAsme = (1.6 * 400) / (138 * 0.85 - 0.6 * 1.6) + 1.5;
    expect(out.t_asme_mm).toBeCloseTo(tAsme, 3);
    expect(out.t_req_mm).toBeGreaterThanOrEqual(out.t_asme_mm);
    expect(out.geometry).toContain('PART_CONTOUR');
    expect(PressureVesselCodeNode.validate({ P: 200, R: 400, S: 138, E: 0.85, CA: 0 }).valid).toBe(false);
  });

  it('uses rpm-typed ISO 281 life and rejects zero loads', () => {
    const rpmPort = BearingLifeNode.inputs.find((p) => p.id === 'rpm');
    expect(rpmPort?.type).toBe('rpm');
    const out = BearingLifeNode.compute({
      Fr: 3500,
      Fa: 800,
      rpm: 1450,
      C: 40800,
      C0: 24000,
      type: 0,
    });
    expect(out.L10h).toBeGreaterThan(0);
    expect(out.Pe).toBeGreaterThan(0);
    expect(out.geometry).toContain('SECTION');
    expect(BearingLifeNode.validate({ Fr: 0, Fa: 0, rpm: 1450, C: 1, C0: 1, type: 0 }).valid).toBe(false);
  });

  it('reports Wahl factor, solid height and surge frequency for a helical spring', () => {
    const out = SpringDesignNode.compute({ F: 500, d: 5, D: 35, Na: 10, G: 81.5 });
    const C = 35 / 5;
    const Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
    expect(out.kw).toBeCloseTo(Kw, 4);
    expect(out.De).toBe(40);
    expect(out.Lc).toBe(12 * 5);
    expect(out.fn).toBeGreaterThan(0);
    expect(out.geometry).toContain('PART_CONTOUR');
  });

  it('exposes spur pair forces and output shaft speed without breaking pitch diameter', () => {
    const out = SpurGearNode.compute({
      module_mm: 3,
      pinion_teeth: 18,
      gear_teeth: 54,
      pressure_angle_deg: 20,
      face_width_mm: 35,
      torque_nm: 49.3966,
      rpm: 1450,
    });
    expect(out.pitch_diameter_mm).toBe(54);
    expect(out.Ft).toBeCloseTo((2000 * 49.3966) / 54, 1);
    expect(out.Fa).toBe(0);
    expect(out.output_torque_nm).toBeCloseTo(49.3966 * 3, 3);
    expect(out.output_rpm).toBeCloseTo(1450 / 3, 3);
  });
});

describe('Industrial templates suite', () => {
  it('keeps exact port typing on every template edge', () => {
    expect(ENGINEERING_TEMPLATES).toHaveLength(39);
    expect(ENGINEERING_TEMPLATES[0].id).toBe('template-reducer-chain');
    for (const template of ENGINEERING_TEMPLATES) {
      const check = validateGraphPorts(template.nodes, template.edges, NODE_REGISTRY);
      expect(check.valid, `${template.id}: ${check.mismatches.map((m) => m.message).join(' | ')}`).toBe(true);
    }
  });

  it('executes the reducer chain and writes L10h, shaft stress, and DXF', () => {
    const template = ENGINEERING_TEMPLATES.find((t) => t.id === 'template-reducer-chain');
    expect(template).toBeDefined();
    const engine = new FlowEngine(
      template!.nodes as FlowGraphNode[],
      template!.edges as FlowGraphEdge[],
      NODE_REGISTRY
    );
    const result = engine.execute();
    expect(result.success, Array.from(result.errors.entries()).map(([k, v]) => `${k}:${v.join(';')}`).join(' | ')).toBe(true);

    const pt = result.nodeResults.get('red-pt');
    expect(pt.torque_nm).toBeCloseTo((9550 * 7.5) / 1450, 3);

    const gear = result.nodeResults.get('red-gear');
    expect(gear.pitch_diameter_mm).toBe(54);
    expect(gear.Ft).toBeGreaterThan(0);
    expect(gear.output_rpm).toBeCloseTo(1450 / 3, 3);

    const brg = result.nodeResults.get('red-brg');
    expect(brg.L10h).toBeGreaterThan(1000);

    const shaft = result.nodeResults.get('red-shaft');
    expect(shaft.stress).toBeGreaterThan(0);

    const dxf = result.nodeResults.get('red-export-dxf');
    expect(String(dxf.dxf_file)).toContain('PITCH_CIRCLE');
  });

  it('packages DXF + PDF + aluflow into a PKZIP archive', () => {
    const template = ENGINEERING_TEMPLATES.find((t) => t.id === 'template-iso281-bearing')!;
    const engine = new FlowEngine(
      template.nodes as FlowGraphNode[],
      template.edges as FlowGraphEdge[],
      NODE_REGISTRY
    );
    const result = engine.execute();
    expect(result.success).toBe(true);
    const nodes = template.nodes.map((n) => ({
      id: n.id,
      data: { schemaId: (n.data as { schemaId?: string }).schemaId, outputs: result.nodeResults.get(n.id) },
    }));
    const entries = collectEngineeringBundle({ aluflowJson: '{"version":"1.0.0"}', nodes });
    expect(entries.some((e) => e.name.endsWith('.dxf'))).toBe(true);
    expect(entries.some((e) => e.name.endsWith('.pdf'))).toBe(true);
    expect(entries.some((e) => e.name === 'project.aluflow')).toBe(true);
    const zip = buildZip(entries);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip.length).toBeGreaterThan(64);
  });

  it('renders a DXF thumbnail SVG from R12 entities', () => {
    const gear = SpurGearNode.compute({
      module_mm: 2,
      pinion_teeth: 20,
      gear_teeth: 40,
      pressure_angle_deg: 20,
      face_width_mm: 20,
    });
    const segs = parseDxfEntities(gear.geometry);
    expect(segs.length).toBeGreaterThan(4);
    const svg = dxfToSvgPreview(gear.geometry);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<circle');
  });
});

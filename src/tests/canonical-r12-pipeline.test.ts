import { describe, it, expect } from 'vitest';
import { DxfWriter, DXF_LAYER_TABLE } from '@/export/dxf/dxf-writer';
import { involutePoint, buildInvoluteFlank } from '@/engines/math/involute';
import { SpurGearNode } from '@/flow/nodes/Mechanical/mech-gear-spur';
import { MaterialNode } from '@/flow/nodes/Mechanical/EngineeringNodes';
import { DxfExportNode, PdfReportNode } from '@/flow/nodes/Export/ExportNodes';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';
import { ENGINEERING_TEMPLATES } from '@/flow/templates/engineeringTemplates';
import { resolveMaterial } from '@/materials/canonical';
import { STRENGTH_MATERIALS } from '@/lib/stressAnalysis';
import { FEA_MATERIALS } from '@/engines/fea/StlFeaSolver';
import { MaterialDB } from '@/lib/materials/materials.db';
import type { FlowGraphEdge, FlowGraphNode } from '@/flow/types/core';

describe('Canonical DXF R12 writer', () => {
  it('emits AC1009, INSUNITS=4, POLYLINE, and computed extents', () => {
    const writer = new DxfWriter();
    writer.addPolyline([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }], true, 'PART_CONTOUR');
    writer.addCircle(0, 0, 2, 'HOLES');
    const dxf = writer.end();
    expect(dxf.startsWith('0\nSECTION')).toBe(true);
    expect(dxf).toContain('$ACADVER');
    expect(dxf).toContain('AC1009');
    expect(dxf).toContain('$INSUNITS');
    expect(dxf).toMatch(/\$INSUNITS\n70\n4/);
    expect(dxf).toContain('POLYLINE');
    expect(dxf).toContain('VERTEX');
    expect(dxf).toContain('SEQEND');
    expect(dxf).not.toContain('LWPOLYLINE');
    expect(dxf).toContain('PART_CONTOUR');
    expect(dxf).toContain('HOLES');
    expect(dxf.endsWith('EOF')).toBe(true);
    expect(dxf).toContain('62\n7');
    expect(dxf).toContain('6\nCONTINUOUS');
    expect(dxf).toContain('6\nDASHED');
    expect(dxf).toContain('6\nCENTER');
  });

  it('throws on unknown layers and is idempotent after end()', () => {
    const writer = new DxfWriter();
    expect(() => writer.addLine(0, 0, 1, 1, 'PARTS')).toThrow(/Unknown DXF layer/);
    writer.addLine(0, 0, 1, 1, 'REFERENCE');
    const a = writer.end();
    const b = writer.end();
    expect(a).toBe(b);
    expect(() => writer.addCircle(0, 0, 1, 'PART_CONTOUR')).toThrow(/already called/);
  });

  it('locks the layer table colors and linetypes', () => {
    expect(DXF_LAYER_TABLE.PART_CONTOUR).toEqual({ color: 7, lineType: 'CONTINUOUS', cut: true });
    expect(DXF_LAYER_TABLE.HOLES).toEqual({ color: 1, lineType: 'CONTINUOUS', cut: true });
    expect(DXF_LAYER_TABLE.BEND).toEqual({ color: 2, lineType: 'DASHED', cut: false });
    expect(DXF_LAYER_TABLE.PITCH_CIRCLE).toEqual({ color: 4, lineType: 'CENTER', cut: false });
    expect(DXF_LAYER_TABLE.BASE_CIRCLE).toEqual({ color: 3, lineType: 'CENTER', cut: false });
    expect(DXF_LAYER_TABLE.ADDENDUM_CIRCLE).toEqual({ color: 2, lineType: 'DASHED', cut: false });
    expect(DXF_LAYER_TABLE.DEDENDUM_CIRCLE).toEqual({ color: 1, lineType: 'DASHED', cut: false });
    expect(DXF_LAYER_TABLE.REFERENCE).toEqual({ color: 8, lineType: 'CENTER', cut: false });
    expect(DXF_LAYER_TABLE.DIMENSIONS).toEqual({ color: 6, lineType: 'CONTINUOUS', cut: false });
    expect(DXF_LAYER_TABLE.SHEET).toEqual({ color: 8, lineType: 'CONTINUOUS', cut: false });
  });
});

describe('Canonical 6061-T6 material service', () => {
  it('records typical 276 MPa and Sy_min 240 MPa separately', () => {
    const typical = resolveMaterial('Aluminum 6061-T6');
    const min = resolveMaterial('6061-T6 (US Standard)', { useMinimumAllowable: true });
    expect(typical?.Sy).toBe(276);
    expect(typical?.Sy_min).toBe(240);
    expect(typical?.E).toBe(68.9);
    expect(typical?.density).toBe(2.7);
    expect(min?.Sy).toBe(240);
    expect(min?.usedMinimumAllowable).toBe(true);
  });

  it('aligns FEA, strength overlay, flow material node, and MaterialDB', () => {
    const strength = STRENGTH_MATERIALS.find((m) => /6061/.test(m.name));
    expect(strength?.Sy).toBe(276);
    expect(strength?.Sy_min).toBe(240);
    expect(strength?.E).toBe(68.9);
    expect(FEA_MATERIALS['al-6061-t6'].yieldStrength).toBe(276);
    expect(FEA_MATERIALS['al-6061-t6'].elasticModulus).toBe(68.9);
    expect(MaterialDB.get('al-6061-t6')?.yieldStrength).toBe(276);
    expect(MaterialDB.get('alu-6061-t6')?.yieldStrength).toBe(276);

    const out = MaterialNode.compute({ materialName: 'Aluminum 6061-T6' });
    expect(out.Sy).toBe(276);
    expect(out.Sy_min).toBe(240);
    expect(out.E).toBe(68.9);
    const outMin = MaterialNode.compute({ materialName: '6061-T6', useMinimumAllowable: true });
    expect(outMin.Sy).toBe(240);
  });
});

describe('Involute unification', () => {
  it('uses the same involutePoint samples in the spur node and kernel', () => {
    const rb = 20 * Math.cos((20 * Math.PI) / 180);
    const ra = 22;
    const kernel = buildInvoluteFlank(rb, ra, 12);
    const node = SpurGearNode.compute({
      module_mm: 2,
      pinion_teeth: 20,
      gear_teeth: 40,
      pressure_angle_deg: 20,
      profile_shift: 0,
      face_width_mm: 20,
    });
    expect(kernel.length).toBe(node.gear_geometry.involute.length);
    expect(kernel[0].x).toBeCloseTo(node.gear_geometry.involute[0].x, 5);
    expect(kernel[0].y).toBeCloseTo(node.gear_geometry.involute[0].y, 5);
    const tMid = Math.sqrt((ra / rb) ** 2 - 1) * 0.5;
    const p = involutePoint(rb, tMid);
    expect(p.x).toBeCloseTo(rb * (Math.cos(tMid) + tMid * Math.sin(tMid)), 12);
    expect(node.geometry).toContain('BASE_CIRCLE');
    expect(node.geometry).toContain('ADDENDUM_CIRCLE');
    expect(node.geometry).toContain('DEDENDUM_CIRCLE');
  });
});

describe('Industrial-template manufacturing loop', () => {
  it('emits SECTION+EOF geometry, sheet BEND, and PDF reports', () => {
    for (const template of ENGINEERING_TEMPLATES) {
      const engine = new FlowEngine(
        template.nodes as FlowGraphNode[],
        template.edges as FlowGraphEdge[],
        NODE_REGISTRY
      );
      const result = engine.execute();
      expect(result.success, `${template.id}: ${Array.from(result.errors.entries()).map(([k, v]) => `${k}:${v.join(';')}`).join(' | ')}`).toBe(true);

      const dxfNode = [...result.nodeResults.entries()].find(([id]) => id.includes('export-dxf'));
      expect(dxfNode, `${template.id} missing DXF export`).toBeDefined();
      const dxf = String(dxfNode?.[1]?.dxf_file ?? '');
      expect(dxf).toContain('SECTION');
      expect(dxf).toContain('EOF');
      expect(dxf).not.toContain('LWPOLYLINE');

      const pdfNode = [...result.nodeResults.entries()].find(([id]) => id.includes('export-pdf'));
      expect(pdfNode, `${template.id} missing PDF export`).toBeDefined();
      const pdf = String(pdfNode?.[1]?.pdf_file ?? '');
      expect(pdf.startsWith('%PDF-1.4')).toBe(true);
      expect(pdf).toContain('%%EOF');

      if (template.id === 'template-sheet-metal-bend') {
        expect(dxf).toContain('BEND');
        expect(dxf).toContain('PART_CONTOUR');
      }
      if (template.id === 'template-spur-gear-dxf') {
        expect(dxf).toContain('PITCH_CIRCLE');
        expect(dxf).toContain('BASE_CIRCLE');
        expect(dxf).toContain('PART_CONTOUR');
      }
    }
  });

  it('still blocks DXF and PDF when validation_report.valid is false', () => {
    const dxfBlocked = DxfExportNode.validate({
      geometry: '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF',
      validation_report: { valid: false, errors: ['SF < 1'] },
    });
    expect(dxfBlocked.valid).toBe(false);
    const pdfBlocked = PdfReportNode.validate({
      validation_report: { valid: false, errors: ['SF < 1'] },
      report_payload: { stress: 1 },
    });
    expect(pdfBlocked.valid).toBe(false);
  });
});

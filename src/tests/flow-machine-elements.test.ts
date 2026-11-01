import { describe, it, expect } from 'vitest';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';
import { ENGINEERING_TEMPLATES } from '@/flow/templates/engineeringTemplates';
import { validateGraphPorts } from '@/flow/core/ports';
import { ColumnBucklingNode } from '@/flow/nodes/Mechanical/mech-column-buckling';
import { WeldJointNode } from '@/flow/nodes/Mechanical/mech-weld-joint';
import { BeltDriveNode } from '@/flow/nodes/Mechanical/mech-belt-drive';
import { ChainDriveNode } from '@/flow/nodes/Mechanical/mech-chain-drive';
import { HydraulicCylinderNode } from '@/flow/nodes/Mechanical/mech-hydraulic-cylinder';
import {
    centerFromDatumLengthMm,
    iso4184PowerKw,
    openDrivePitchLengthMm,
    resolveIso4184Section,
    snapIso4184DatumLength,
} from '@/data/mechanical/iso4184';
import { iso10823ToothFactor, iso606RatedPowerKw, resolveIso606Size } from '@/data/mechanical/iso606';
import { directionalFilletCheck } from '@/data/mechanical/en1993Weld';
import type { FlowGraphEdge, FlowGraphNode } from '@/flow/types/core';

describe('Machine-element kernels', () => {
  it('Euler slender column matches π²EI/(KL)² and EN 1993-1-1 χ', () => {
    const L = 1500;
    const I = 125664;
    const A = 1257;
    const E = 200;
    const fy = 350;
    const K = 1;
    const P = 35000;
    const out = ColumnBucklingNode.compute({ L, I, A, E, fy, K, P, buckling_curve: 'b' });
    const E_MPa = 200000;
    const P_euler = (Math.PI ** 2 * E_MPa * I) / (K * L) ** 2;
    expect(out.Pcr_euler).toBeCloseTo(P_euler, 0);
    const i = Math.sqrt(I / A);
    expect(out.lambda).toBeCloseTo((K * L) / i, 3);
    const eps = Math.sqrt(235 / fy);
    const lambdaBar = out.lambda / (93.9 * eps);
    expect(out.lambda_bar).toBeCloseTo(lambdaBar, 3);
    const alpha = 0.34;
    const Phi = 0.5 * (1 + alpha * (lambdaBar - 0.2) + lambdaBar ** 2);
    const chi = 1 / (Phi + Math.sqrt(Phi ** 2 - lambdaBar ** 2));
    expect(out.chi).toBeCloseTo(chi, 3);
    expect(out.Nb_rd).toBeCloseTo((chi * A * fy) / 1, 0);
    expect(out.Pcr).toBeLessThanOrEqual(out.Pcr_euler + 1e-6);
    expect(out.regime).toBe('euler');
    expect(out.safety_factor).toBeCloseTo(out.Pcr / P, 3);
    expect(out.sigma_equiv).toBeCloseTo(fy * (P / out.Pcr), 2);
    expect(out.geometry).toContain('SECTION');
    expect(out.geometry).toContain('PART_CONTOUR');
    expect(ColumnBucklingNode.validate({ L: 0, I, A, E, fy, K, P }).valid).toBe(false);
  });

  it('DIN 4114 Tetmajer governs an intermediate steel column', () => {
    const out = ColumnBucklingNode.compute({
      L: 800,
      I: 125664,
      A: 1257,
      E: 200,
      fy: 235,
      K: 1,
      P: 80000,
      buckling_curve: 'b',
    });
    expect(out.lambda).toBeLessThan(105);
    expect(out.lambda).toBeGreaterThan(20);
    const sigma_t = 310 - 1.14 * out.lambda;
    expect(out.Pcr_tetmajer).toBeCloseTo(Math.min(235, sigma_t) * 1257, 0);
    expect(out.regime).toBe('tetmajer');
    expect(out.Pcr).toBeLessThanOrEqual(out.Pcr_tetmajer + 1e-6);
  });

  it('sizes a double fillet with EN 1993-1-8 and AWS D1.1', () => {
    const F = 25000;
    const L = 120;
    const z = 6;
    const fu = 420;
    const fy = 350;
    const out = WeldJointNode.compute({ F, L, z, fu, fy, joint: 'fillet-double', FEXX: 485 });
    const a = z / Math.SQRT2;
    const Aw = a * L * 2;
    expect(out.a_throat).toBeCloseTo(a, 3);
    expect(out.tau).toBeCloseTo(F / Aw, 2);
    const beta_w = 0.9;
    const fw = fu / (Math.sqrt(3) * beta_w * 1.25);
    expect(out.Fw_rd).toBeCloseTo(fw * Aw, 0);
    expect(out.Fw_aws).toBeCloseTo(0.3 * 485 * Aw, 0);
    expect(out.sigma_perp).toBeCloseTo(0, 6);
    expect(out.tau_par).toBeCloseTo(F / Aw, 2);
    expect(out.Fw_rd_dir).toBeCloseTo(out.Fw_rd, 0);
    expect(out.safety_factor).toBeGreaterThan(1);
    expect(out.geometry).toContain('BEND');
    expect(WeldJointNode.validate({ F: 0, L, z, fu, fy }).valid).toBe(false);
  });

  it('applies EN 1993-1-8 §4.5.3.2 directional stresses on a transverse fillet', () => {
    const F = 25000;
    const L = 120;
    const z = 6;
    const a = z / Math.SQRT2;
    const out = WeldJointNode.compute({
      F,
      L,
      z,
      fu: 420,
      fy: 350,
      joint: 'fillet-double',
      load_dir: 'transverse',
    });
    const Aw = a * L * 2;
    const sigma_perp = F / (Aw * Math.SQRT2);
    expect(out.sigma_perp).toBeCloseTo(sigma_perp, 2);
    expect(out.tau_perp).toBeCloseTo(sigma_perp, 2);
    expect(out.tau_par).toBeCloseTo(0, 6);
    const check = directionalFilletCheck({
      sigma_perp: out.sigma_perp,
      tau_perp: out.tau_perp,
      tau_par: out.tau_par,
      fu: 420,
      beta_w: 0.9,
      gamma_M2: 1.25,
    });
    expect(out.sigma_w).toBeCloseTo(check.sigma_w, 2);
    expect(check.sigma_w).toBeCloseTo(Math.sqrt(out.sigma_perp ** 2 + 3 * out.tau_perp ** 2), 4);
    expect(out.safety_factor).toBeGreaterThan(1);
  });

  it('computes open V-belt wrap, ISO 4184 Ld snap and Euler-Eytelwein tensions', () => {
    const d1 = 100;
    const d2 = 250;
    const C = 500;
    const out = BeltDriveNode.compute({
      d1,
      d2,
      C,
      power_kw: 5,
      rpm: 1450,
      mu: 0.3,
      Ks: 1.25,
      belt_type: 'v',
      section: 'A',
      groove_angle_deg: 40,
    });
    expect(out.n2).toBeCloseTo(1450 * (d1 / d2), 2);
    const Lth = openDrivePitchLengthMm(d1, d2, C);
    expect(out.belt_length_mm).toBeCloseTo(Lth, 1);
    const section = resolveIso4184Section('A')!;
    const Ld = snapIso4184DatumLength(Lth, section);
    expect(out.Ld_mm).toBe(Ld);
    expect(Ld).toBe(1600);
    expect(out.C_actual).toBeCloseTo(centerFromDatumLengthMm(d1, d2, Ld), 1);
    const theta = Math.PI - 2 * Math.asin((d2 - d1) / (2 * out.C_actual));
    expect(out.wrap_deg).toBeCloseTo((theta * 180) / Math.PI, 2);
    const v = (Math.PI * d1 * 1450) / 60000;
    const Te = (5 * 1.25 * 1000) / v;
    expect(out.Te).toBeCloseTo(Te, 1);
    const beta = (20 * Math.PI) / 180;
    const r = Math.exp((0.3 * theta) / Math.sin(beta));
    expect(out.T1 / out.T2).toBeCloseTo(r, 3);
    const Pr = iso4184PowerKw(section, d1, v, out.wrap_deg, Ld);
    expect(out.P_rated_kw).toBeCloseTo(Pr, 3);
    expect(out.belt_count).toBe(Math.max(1, Math.ceil((5 * 1.25) / Pr)));
    expect(out.geometry).toContain('PITCH_CIRCLE');
    expect(BeltDriveNode.validate({ d1, d2, C: 50, power_kw: 5, rpm: 1450, mu: 0.3, Ks: 1.25 }).valid).toBe(false);
    expect(BeltDriveNode.validate({ d1: 80, d2, C, power_kw: 5, rpm: 1450, mu: 0.3, Ks: 1.25, section: 'SPC' }).valid).toBe(false);
  });

  it('rates SPA vs A and snaps the same datum length', () => {
    const args = { d1: 100, d2: 250, C: 500, power_kw: 5, rpm: 1450, mu: 0.3, Ks: 1.25, belt_type: 'v' as const };
    const a = BeltDriveNode.compute({ ...args, section: 'A' });
    const spa = BeltDriveNode.compute({ ...args, section: 'SPA' });
    expect(a.Ld_mm).toBe(spa.Ld_mm);
    expect(spa.P_rated_kw).toBeGreaterThan(a.P_rated_kw);
    expect(spa.belt_count).toBeLessThan(a.belt_count);
  });

  it('uses ISO 606 pitch diameter, even-link C and ISO 10823 power', () => {
    const z1 = 19;
    const z2 = 57;
    const p = 15.875;
    const C = 500;
    const out = ChainDriveNode.compute({ z1, z2, p, C, power_kw: 5, rpm: 1450, Ks: 1.3, chain_no: '10B', strands: 1 });
    expect(out.dp1).toBeCloseTo(p / Math.sin(Math.PI / z1), 3);
    expect(out.dp2).toBeCloseTo(p / Math.sin(Math.PI / z2), 3);
    expect(out.n2).toBeCloseTo(1450 / (z2 / z1), 2);
    expect(out.even_links % 2).toBe(0);
    const A = (z1 + z2) / 2;
    const B = ((z2 - z1) / (2 * Math.PI)) ** 2;
    const x = out.C_actual / p;
    expect(2 * x + A + B / x).toBeCloseTo(out.even_links, 2);
    const v = (z1 * p * 1450) / 60000;
    expect(out.F).toBeCloseTo((5 * 1.3 * 1000) / v, 1);
    const size = resolveIso606Size('10B')!;
    expect(iso10823ToothFactor(19)).toBeCloseTo(1, 6);
    expect(out.P_rated_kw).toBeCloseTo(iso606RatedPowerKw({ size, z1, v_m_s: v, strands: 1 }), 3);
    expect(out.utilization).toBeCloseTo((5 * 1.3) / out.P_rated_kw, 3);
    expect(out.utilization).toBeLessThan(1);
    expect(out.geometry).toContain('PITCH_CIRCLE');
    expect(out.geometry).toContain('PART_CONTOUR');
    expect(ChainDriveNode.validate({ z1: 5, z2, p, C, power_kw: 5, rpm: 1450, Ks: 1.3 }).valid).toBe(false);
  });

  it('locks 08B pitch over a mismatched wired p and applies duplex 1.7', () => {
    const simplex = ChainDriveNode.compute({
      z1: 19, z2: 38, p: 15.875, C: 400, power_kw: 3, rpm: 960, Ks: 1.3, chain_no: '08B', strands: 1,
    });
    const duplex = ChainDriveNode.compute({
      z1: 19, z2: 38, p: 15.875, C: 400, power_kw: 3, rpm: 960, Ks: 1.3, chain_no: '08B', strands: 2,
    });
    expect(simplex.dp1).toBeCloseTo(12.7 / Math.sin(Math.PI / 19), 3);
    expect(duplex.P_rated_kw / simplex.P_rated_kw).toBeCloseTo(1.7, 3);
  });

  it('snaps ISO 6020 bore upward and checks Lamé wall plus Euler rod', () => {
    const P = 16;
    const stroke = 500;
    const under = HydraulicCylinderNode.compute({
      F: 49000,
      P,
      stroke,
      K: 1,
      E: 200,
      fy: 350,
      piston_speed_mm_s: 100,
    });
    expect(under.bore_std).toBe(63);
    expect(under.rod_std).toBe(36);

    const F = 50000;
    const out = HydraulicCylinderNode.compute({
      F,
      P,
      stroke,
      K: 1,
      E: 200,
      fy: 350,
      piston_speed_mm_s: 100,
    });
    expect(out.bore_std).toBe(80);
    expect(out.rod_std).toBe(45);
    const Ap = (Math.PI * 80 ** 2) / 4;
    expect(out.F_push).toBeCloseTo(P * Ap, 0);
    expect(out.F_pull).toBeCloseTo(P * (Math.PI * (80 ** 2 - 45 ** 2)) / 4, 0);
    const sigmaAll = 350 / 1.5;
    const t_thin = (P * 80) / (2 * sigmaAll);
    expect(out.t_wall).toBeGreaterThanOrEqual(t_thin - 1e-6);
    const I = (Math.PI * 45 ** 4) / 64;
    const Pcr = (Math.PI ** 2 * 200000 * I) / stroke ** 2;
    expect(out.Pcr).toBeCloseTo(Pcr, 0);
    expect(out.Q_L_min).toBeCloseTo(Ap * 100 * 6e-5, 3);
    expect(out.geometry).toContain('PART_CONTOUR');
    expect(HydraulicCylinderNode.validate({ F, P: 400, stroke, K: 1, E: 200, fy: 350 }).valid).toBe(false);
  });
});

const NEW_IDS = [
  'template-column-buckling',
  'template-weld-joint',
  'template-belt-drive',
  'template-chain-drive',
  'template-hydraulic-cylinder',
] as const;

describe('Five new industrial templates', () => {
  it('keeps exact port typing on the new templates', () => {
    for (const id of NEW_IDS) {
      const template = ENGINEERING_TEMPLATES.find((t) => t.id === id);
      expect(template, id).toBeDefined();
      const check = validateGraphPorts(template!.nodes, template!.edges, NODE_REGISTRY);
      expect(check.valid, `${id}: ${check.mismatches.map((m) => m.message).join(' | ')}`).toBe(true);
    }
  });

  it('executes each new template with DXF R12 and PDF', () => {
    for (const id of NEW_IDS) {
      const template = ENGINEERING_TEMPLATES.find((t) => t.id === id)!;
      const engine = new FlowEngine(
        template.nodes as FlowGraphNode[],
        template.edges as FlowGraphEdge[],
        NODE_REGISTRY
      );
      const result = engine.execute();
      expect(
        result.success,
        `${id}: ${Array.from(result.errors.entries())
          .map(([k, v]) => `${k}:${v.join(';')}`)
          .join(' | ')}`
      ).toBe(true);

      const dxfNode = [...result.nodeResults.entries()].find(([nid]) => nid.includes('export-dxf'));
      expect(dxfNode, `${id} missing DXF`).toBeDefined();
      const dxf = String(dxfNode?.[1]?.dxf_file ?? '');
      expect(dxf).toContain('SECTION');
      expect(dxf).toContain('EOF');
      expect(dxf).not.toContain('LWPOLYLINE');
      expect(dxf).toContain('AC1009');

      const pdfNode = [...result.nodeResults.entries()].find(([nid]) => nid.includes('export-pdf'));
      expect(String(pdfNode?.[1]?.pdf_file ?? '').startsWith('%PDF-1.4')).toBe(true);
    }
  });

  it('wires buckling equivalent stress so val-sf equals Pcr/P', () => {
    const template = ENGINEERING_TEMPLATES.find((t) => t.id === 'template-column-buckling')!;
    const engine = new FlowEngine(
      template.nodes as FlowGraphNode[],
      template.edges as FlowGraphEdge[],
      NODE_REGISTRY
    );
    const result = engine.execute();
    expect(result.success).toBe(true);
    const core = result.nodeResults.get('col-core');
    const sf = result.nodeResults.get('col-sf');
    expect(core.regime).toBe('euler');
    expect(sf.safety_factor).toBeCloseTo(core.safety_factor, 3);
    expect(String(result.nodeResults.get('col-export-dxf').dxf_file)).toContain('PART_CONTOUR');
  });

  it('emits pitch circles on belt and chain DXF', () => {
    for (const id of ['template-belt-drive', 'template-chain-drive'] as const) {
      const template = ENGINEERING_TEMPLATES.find((t) => t.id === id)!;
      const engine = new FlowEngine(
        template.nodes as FlowGraphNode[],
        template.edges as FlowGraphEdge[],
        NODE_REGISTRY
      );
      const result = engine.execute();
      expect(result.success).toBe(true);
      const dxf = String(result.nodeResults.get(id === 'template-belt-drive' ? 'blt-export-dxf' : 'chn-export-dxf').dxf_file);
      expect(dxf).toContain('PITCH_CIRCLE');
    }
  });
});

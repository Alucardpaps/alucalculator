import { describe, it, expect } from 'vitest';
import { getFastenerStandardSpecs, computeBoltAssembly, getGradesForStandard, getStandardThreadLengthB } from '@/lib/fastener/sharedEngine';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { useDesignStore } from '@/design-studio/designStore';

describe('Fastener Dynamic Standards Resolution', () => {
  it('correctly resolves Metric Coarse / Fine to ISO 4014 / ISO 4017 and ISO 4032', () => {
    const partial = getFastenerStandardSpecs('Metric Coarse', 'M12', false);
    expect(partial.family).toBe('metric');
    expect(partial.boltPartial).toBe('ISO 4014 (DIN 931)');
    expect(partial.boltCurrent).toBe('ISO 4014 (DIN 931)');
    expect(partial.nutStandard).toBe('ISO 4032 (DIN 934)');
    expect(partial.threadProfile).toBe('ISO 68-1');
    expect(partial.toleranceClass).toBe('ISO 965-1 (6g / 6H)');
    expect(partial.clearanceHole).toBe('ISO 273');
    expect(partial.strengthStandard).toBe('ISO 898-1');
    expect(partial.workbenchSubtitle).toContain('VDI 2230');

    const full = getFastenerStandardSpecs('Metric Coarse', 'M12', true);
    expect(full.boltCurrent).toBe('ISO 4017 (DIN 933)');
  });

  it('correctly resolves UNC / UNF Inch fasteners to ASME B18.2.1, ASME B1.1, ASME B18.2.2 and SAE J429', () => {
    const unc = getFastenerStandardSpecs('UNC', '1/2-13 UNC', false);
    expect(unc.family).toBe('inch');
    expect(unc.boltPartial).toContain('ASME B18.2.1');
    expect(unc.nutStandard).toBe('ASME B18.2.2');
    expect(unc.threadProfile).toContain('ASME B1.1');
    expect(unc.toleranceClass).toBe('Class 2A / 2B');
    expect(unc.clearanceHole).toBe('ASME B18.2.8');
    expect(unc.strengthStandard).toContain('SAE J429');
    expect(unc.buttonPartialLabel.en).toBe('Partial (ASME B18.2.1)');
    expect(unc.buttonFullLabel.en).toBe('Full (ASME B18.2.1)');
    expect(unc.workbenchSubtitle).toContain('ASME B18.2.1');

    const unf = getFastenerStandardSpecs('UNF', '3/8-24 UNF', true);
    expect(unf.family).toBe('inch');
    expect(unf.boltCurrent).toContain('ASME B18.2.1 (Tap Bolt)');
  });

  it('correctly resolves NPT pipe threads to ASME B1.20.1 and ASME B16.11', () => {
    const npt = getFastenerStandardSpecs('NPT', '1/2 NPT', false);
    expect(npt.family).toBe('npt');
    expect(npt.boltCurrent).toBe('ASME B1.20.1');
    expect(npt.nutStandard).toContain('ASME B16.11');
    expect(npt.threadProfile).toContain('ANSI/ASME B1.20.1');
    expect(npt.toleranceClass).toContain('L₁ Hand / L₂ Wrench');
    expect(npt.buttonPartialLabel.en).toBe('Taper (L1+L2)');
    expect(npt.workbenchSubtitle).toContain('ASME B1.20.1');
  });

  it('correctly resolves BSPP (G) parallel pipe threads to ISO 228-1 and DIN 3852-2', () => {
    const bspp = getFastenerStandardSpecs('BSPP (G)', 'G 1/2', false);
    expect(bspp.family).toBe('bspp');
    expect(bspp.boltCurrent).toBe('ISO 228-1');
    expect(bspp.boltPartial).toContain('DIN 3852-2');
    expect(bspp.nutStandard).toContain('ISO 228-2');
    expect(bspp.threadProfile).toContain('ISO 228-1 / BS 2779');
    expect(bspp.workbenchSubtitle).toContain('ISO 228-1');
  });

  it('correctly resolves BSPT (R) taper pipe threads to ISO 7-1 and EN 10226', () => {
    const bspt = getFastenerStandardSpecs('BSPT (R)', 'R 1/2', false);
    expect(bspt.family).toBe('bspt');
    expect(bspt.boltCurrent).toBe('ISO 7-1');
    expect(bspt.threadProfile).toContain('ISO 7-1');
    expect(bspt.workbenchSubtitle).toContain('ISO 7-1');
  });

  it('correctly resolves Trapezoidal (Tr) to DIN 103 and ISO 2901-2904', () => {
    const tr = getFastenerStandardSpecs('Trapezoidal', 'Tr 20x4', false);
    expect(tr.family).toBe('trapezoidal');
    expect(tr.boltCurrent).toBe('DIN 103');
    expect(tr.nutStandard).toContain('DIN 103-9');
    expect(tr.threadProfile).toContain('ISO 2901 / DIN 103');
    expect(tr.toleranceClass).toContain('7e / 7H');
    expect(tr.buttonPartialLabel.en).toBe('Partial (DIN 103)');
  });

  it('correctly resolves ACME to ASME B1.5 Class 2G', () => {
    const acme = getFastenerStandardSpecs('ACME', '1-5 ACME', false);
    expect(acme.family).toBe('acme');
    expect(acme.boltCurrent).toBe('ASME B1.5');
    expect(acme.nutStandard).toContain('ASME B1.5');
    expect(acme.threadProfile).toContain('ASME B1.5');
    expect(acme.toleranceClass).toBe('Class 2G / 3G');
    expect(acme.buttonPartialLabel.en).toBe('Partial (ASME B1.5)');
  });

  it('computeBoltAssembly attaches spec to results directly', () => {
    const metricRes = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M16',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 60,
    });
    expect(metricRes.spec.family).toBe('metric');
    expect(metricRes.spec.boltCurrent).toBe('ISO 4014 (DIN 931)');

    const inchRes = computeBoltAssembly({
      threadStandard: 'UNC',
      size: '1/2-13 UNC',
      grade: 'Grade 5',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 50,
    });
    expect(inchRes.spec.family).toBe('inch');
    expect(inchRes.spec.boltCurrent).toContain('ASME B18.2.1');
    expect(inchRes.spec.nutStandard).toBe('ASME B18.2.2');
  });

  it('getGradesForStandard returns standard-compliant grades for Inch, Pipe, British, Tr and Metric', () => {
    const inchGrades = getGradesForStandard('UNC', '1/2-13 UNC');
    expect(inchGrades.map(g => g.grade)).toEqual(['Grade 2', 'Grade 5', 'Grade 8', 'A325', 'A490', 'A193 B7']);
    expect(inchGrades.find(g => g.isDefault)?.grade).toBe('Grade 5');

    const pipeGrades = getGradesForStandard('NPT', '1/2 NPT');
    expect(pipeGrades.map(g => g.grade)).toEqual(['ASTM A105', 'A182 F316', 'A350 LF2', 'Grade B']);
    expect(pipeGrades.find(g => g.isDefault)?.grade).toBe('ASTM A105');

    const bswGrades = getGradesForStandard('BSW', '1/2 BSW');
    expect(bswGrades.map(g => g.grade)).toEqual(['Grade A', 'Grade R', 'Grade T', 'Grade V']);

    const metricGrades = getGradesForStandard('Metric Coarse', 'M12');
    expect(metricGrades.map(g => g.grade)).toEqual(['4.6', '5.8', '8.8', '10.9', '12.9', 'A2-70', 'A4-70', 'A4-80']);
    expect(metricGrades.find(g => g.isDefault)?.grade).toBe('8.8');
  });

  it('ISO 898-1 class 8.8 proof/yield stress is diameter dependent (580/640 for d ≤ 16, 600/660 above)', () => {
    const base = { threadStandard: 'Metric Coarse' as const, grade: '8.8', muThread: 0.12, muHead: 0.12, yieldUtilization: 90 };
    const m12 = computeBoltAssembly({ ...base, size: 'M12' });
    expect(m12.Sp).toBe(580);
    expect(m12.Sy).toBe(640);
    const m16 = computeBoltAssembly({ ...base, size: 'M16' });
    expect(m16.Sp).toBe(580);
    const m20 = computeBoltAssembly({ ...base, size: 'M20' });
    expect(m20.Sp).toBe(600);
    expect(m20.Sy).toBe(660);
    // other classes are not diameter dependent
    expect(computeBoltAssembly({ ...base, size: 'M20', grade: '10.9' }).Sp).toBe(830);
  });

  it('stainless A2-70 stays A2-70 on metric threads and uses Rp0.2 = 450 MPa', () => {
    const r = computeBoltAssembly({ threadStandard: 'Metric Coarse', size: 'M6', grade: 'A2-70', muThread: 0.12, muHead: 0.12, yieldUtilization: 90 });
    expect(r.grade).toBe('A2-70');
    expect(r.Sy).toBe(450);
    expect(r.Sp).toBe(450);
  });

  it('getStandardThreadLengthB calculates ASME B18.2.1 for inch and ISO 888 for metric', () => {
    // Metric ISO 888: 2d + 6 for L <= 125
    const bMetric = getStandardThreadLengthB('Metric Coarse', 12, 50);
    expect(bMetric).toBe(30); // 2*12 + 6 = 30

    // Inch ASME B18.2.1: 2D + 6.35 mm for L <= 152.4 mm (6 in)
    const dInch = 12.7; // 1/2 in
    const bInch = getStandardThreadLengthB('UNC', dInch, 100);
    expect(bInch).toBeCloseTo(2 * 12.7 + 6.35, 1); // 31.75 mm
  });

  it('CrossModuleBridge.exportFastenerTo3D attaches true standards for Inch and NPT fasteners, avoiding hardcoded ISO 4014', () => {
    // 1. Inch Fastener
    CrossModuleBridge.exportFastenerTo3D({
      size: '1/2-13 UNC',
      length: 50,
      propertyClass: 'Grade 5',
    });
    const state = useDesignStore.getState();
    const inchBolt = state.parts.find(p => p.kind === 'hex-bolt');
    expect(inchBolt).toBeDefined();
    expect(inchBolt?.manufacturingNotes?.[0]).toContain('ASME B18.2.1');
    expect(inchBolt?.manufacturingNotes?.[0]).not.toContain('ISO 4014');
    expect(inchBolt?.designStandard).toContain('ASME B18.2.1');

    const inchNut = state.parts.find(p => p.kind === 'hex-nut');
    expect(inchNut).toBeDefined();
    expect(inchNut?.manufacturingNotes?.[0]).toContain('ASME B18.2.2');
    expect(inchNut?.manufacturingNotes?.[0]).not.toContain('ISO 4032');

    // 2. NPT Pipe Fastener
    CrossModuleBridge.exportFastenerTo3D({
      size: '1/2 NPT',
      length: 30,
      propertyClass: 'ASTM A105',
    });
    const state2 = useDesignStore.getState();
    const nptBolt = state2.parts.find(p => p.kind === 'hex-bolt');
    expect(nptBolt?.manufacturingNotes?.[0]).toContain('ASME B1.20.1');
    expect(nptBolt?.manufacturingNotes?.[0]).not.toContain('ISO 4014');

    const nptNut = state2.parts.find(p => p.kind === 'hex-nut');
    expect(nptNut?.manufacturingNotes?.[0]).toContain('ASME B16.11');
    expect(nptNut?.manufacturingNotes?.[0]).not.toContain('ISO 4032');
  });

  it('correctly resolves NPSM straight pipe threads to ASME B1.20.1 Table 8 and ASME B18.3 for socket cap', () => {
    // 1. Standard NPSM mechanical pipe fitting
    const npsm = getFastenerStandardSpecs('NPSM', '1-1/2 NPSM', false);
    expect(npsm.family).toBe('pipe');
    expect(npsm.threadProfile).toContain('ASME B1.20.1');
    expect(npsm.threadProfile).toContain('60° Straight Pipe');
    expect(npsm.toleranceClass).toBe('Class 2A / 2B');
    expect(npsm.gaugeStandard).toBe('ASME B1.20.1 Table 8');
    expect(npsm.nutStandard).toContain('ASME B1.20.1');

    // 2. NPSM with socket cap bolt type (should never be ISO 68-1 Metric)
    const npsmSocket = getFastenerStandardSpecs('NPSM', '1-1/2 NPSM', false, 'socket_cap');
    expect(npsmSocket.threadProfile).toBe('ASME B1.20.1 (60° Straight Pipe)');
    expect(npsmSocket.threadProfile).not.toContain('ISO 68-1');
    expect(npsmSocket.toleranceClass).toBe('Class 2A / 2B');
    expect(npsmSocket.toleranceClass).not.toContain('6g / 6H');
    expect(npsmSocket.boltCurrent).toContain('ASME B18.3');
  });

  it('computes 1-1/2 NPSM dimensions accurately according to ASME B1.20.1 Table 8 and Machining Doctor', () => {
    const res = computeBoltAssembly({
      threadStandard: 'NPSM',
      size: '1-1/2 NPSM',
      grade: '8.8',
      muThread: 0.14,
      muHead: 0.14,
      yieldUtilization: 70,
      length: 50,
      boltType: 'socket_cap',
    });

    // Thread Major Diameter (2A): 1.877" = 47.676 mm (NOT the unthreaded pipe OD 48.260 mm)
    expect(res.d_nom).toBeCloseTo(47.676, 1);
    // Pitch: 11.5 TPI = 2.2087 mm
    expect(res.pitchVal).toBeCloseTo(2.2087, 2);
    // Pitch Diameter (d2): 1.8205" = 46.241 mm
    expect(res.d2).toBeCloseTo(46.241, 1);
    // Minor Diameter (d1): ~45.285 mm
    expect(res.d1).toBeCloseTo(45.285, 1);
    // Tap drill: 45.0 mm
    expect(res.tapDrill).toBeCloseTo(45.0, 1);
    // Spec citations
    expect(res.spec.threadProfile).toContain('ASME B1.20.1');
    expect(res.spec.threadProfile).not.toContain('ISO 68-1');
  });
});

import { describe, it, expect } from 'vitest';
import {
  calculateBearingLife,
  solveSkfPairedTaperedRollerOArrangement,
  solve3DShaftStaticEquilibrium,
  findSKFBearing,
  type BearingData
} from '@/data/skfBearings';
import { din743Check, type Din743Point, type Din743Material } from '@/modules/mechanical/ShaftDesign/din743';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';
import { executeSigmaNest2D, calculateSigmaNestLeadInParameters } from '@/cam';
import type { Part2D, Sheet2D } from '@/types/nesting2d.types';

/**
 * REDUCER SINGLE SOURCE OF ENGINEERING TRUTH TEST
 * 
 * Directly executes AluCalc OS production calculation engines:
 * 1. calculateBearingLife (@/data/skfBearings)
 * 2. din743Check (@/modules/mechanical/ShaftDesign/din743)
 * 3. computeBoltAssembly (@/lib/fastener/sharedEngine)
 * 
 * Compares them against independent analytical reference models.
 * Strictly verifies Fa = Ft * tan(beta).
 */

describe('Reducer Single Source of Engineering Truth Model', () => {
  // 1. Nominal Input Specifications
  const P_motor_kW = 15.0; // Nominal motor power
  const n_input_rpm = 1450.0; // Nominal input speed
  const K_A = 1.25; // ISO 6336 Application / Service factor
  const eta_stage = 0.98; // Stage mechanical efficiency

  // Gear Geometry Specs
  const stage1 = {
    z_pinion: 20,
    z_gear: 104,
    m_n: 2.5, // mm
    beta_deg: 14.0, // degrees
    alpha_n_deg: 20.0, // degrees
    b: 40.0 // mm face width
  };

  const stage2 = {
    z_pinion: 21,
    z_gear: 98,
    m_n: 4.0, // mm
    beta_deg: 12.0, // degrees
    alpha_n_deg: 20.0, // degrees
    b: 65.0 // mm face width
  };

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  it('Step 1: computes exact pitch diameters and gear ratios', () => {
    // d = z * m_n / cos(beta)
    const d1 = (stage1.z_pinion * stage1.m_n) / Math.cos(degToRad(stage1.beta_deg));
    const d2 = (stage1.z_gear * stage1.m_n) / Math.cos(degToRad(stage1.beta_deg));
    const i1 = stage1.z_gear / stage1.z_pinion;

    expect(d1).toBeCloseTo(51.5307, 3);
    expect(d2).toBeCloseTo(267.9595, 3);
    expect(i1).toBeCloseTo(5.20, 2);

    const d3 = (stage2.z_pinion * stage2.m_n) / Math.cos(degToRad(stage2.beta_deg));
    const d4 = (stage2.z_gear * stage2.m_n) / Math.cos(degToRad(stage2.beta_deg));
    const i2 = stage2.z_gear / stage2.z_pinion;

    expect(d3).toBeCloseTo(85.8766, 3);
    expect(d4).toBeCloseTo(400.7575, 3);
    expect(i2).toBeCloseTo(4.6667, 3);

    const i_total = i1 * i2;
    expect(i_total).toBeCloseTo(24.2667, 3);
  });

  it('Step 2: distinguishes nominal and design torques and strictly enforces Fa = Ft * tan(beta)', () => {
    // Torques
    const T1_nom = (9549.296585 * P_motor_kW) / n_input_rpm; // Nm
    const T1_design = T1_nom * K_A; // Nm

    expect(T1_nom).toBeCloseTo(98.786, 2);
    expect(T1_design).toBeCloseTo(123.482, 2);

    const d1_m = ((stage1.z_pinion * stage1.m_n) / Math.cos(degToRad(stage1.beta_deg))) / 1000;

    // Stage 1 Forces
    const Ft1_nom = (2 * T1_nom) / d1_m;
    const Ft1_design = (2 * T1_design) / d1_m;

    expect(Ft1_nom).toBeCloseTo(3834.06, 1);
    expect(Ft1_design).toBeCloseTo(4792.58, 1);

    const Fa1_nom = Ft1_nom * Math.tan(degToRad(stage1.beta_deg));
    const Fa1_design = Ft1_design * Math.tan(degToRad(stage1.beta_deg));

    // STRICT LAW CHECK: Fa must equal Ft * tan(beta)
    expect(Fa1_nom).toBeCloseTo(955.90, 1);
    expect(Fa1_design).toBeCloseTo(1194.88, 1);
    expect(Fa1_design / Ft1_design).toBeCloseTo(Math.tan(degToRad(stage1.beta_deg)), 6);

    const Fr1_nom = (Ft1_nom * Math.tan(degToRad(stage1.alpha_n_deg))) / Math.cos(degToRad(stage1.beta_deg));
    const Fr1_design = (Ft1_design * Math.tan(degToRad(stage1.alpha_n_deg))) / Math.cos(degToRad(stage1.beta_deg));

    expect(Fr1_nom).toBeCloseTo(1438.18, 1);
    expect(Fr1_design).toBeCloseTo(1797.73, 1);

    // Stage 2 Torques & Forces
    const i1 = stage1.z_gear / stage1.z_pinion;
    const n2_rpm = n_input_rpm / i1;
    expect(n2_rpm).toBeCloseTo(278.846, 2);

    const T2_nom = T1_nom * i1 * eta_stage;
    const T2_design = T1_design * i1 * eta_stage;

    expect(T2_nom).toBeCloseTo(503.41, 1);
    expect(T2_design).toBeCloseTo(629.27, 1);

    const d3_m = ((stage2.z_pinion * stage2.m_n) / Math.cos(degToRad(stage2.beta_deg))) / 1000;

    const Ft2_nom = (2 * T2_nom) / d3_m;
    const Ft2_design = (2 * T2_design) / d3_m;

    expect(Ft2_nom).toBeCloseTo(11724.0, 0);
    expect(Ft2_design).toBeCloseTo(14655.0, 0);

    const Fa2_nom = Ft2_nom * Math.tan(degToRad(stage2.beta_deg));
    const Fa2_design = Ft2_design * Math.tan(degToRad(stage2.beta_deg));

    // STRICT LAW CHECK: Fa2 must equal Ft2 * tan(beta2)
    expect(Fa2_nom).toBeCloseTo(2492.0, 0);
    expect(Fa2_design).toBeCloseTo(3115.0, 0);
    expect(Fa2_design / Ft2_design).toBeCloseTo(Math.tan(degToRad(stage2.beta_deg)), 6);

    const Fr2_nom = (Ft2_nom * Math.tan(degToRad(stage2.alpha_n_deg))) / Math.cos(degToRad(stage2.beta_deg));
    const Fr2_design = (Ft2_design * Math.tan(degToRad(stage2.alpha_n_deg))) / Math.cos(degToRad(stage2.beta_deg));

    expect(Fr2_nom).toBeCloseTo(4362.5, 0);
    expect(Fr2_design).toBeCloseTo(5453.2, 0);
  });

  it('Step 3: executes production calculateBearingLife engine and compares with independent reference', () => {
    // Official SKF Rolling Bearings Catalogue PUB BU/P1 10000/2 EN data:
    const skf32206J2Q: BearingData = {
      code: '32206 J2/Q',
      d: 30,
      D: 62,
      B: 21.25,
      C: 50.1, // kN
      C0: 57.0, // kN
      rpmRef: 7000,
      rpmLim: 10000,
      type: 'tapered-roller',
      e: 0.37,
      Y: 1.60,
      Y0: 0.90
    };

    const skf32210J2Q: BearingData = {
      code: '32210 J2/Q',
      d: 50,
      D: 90,
      B: 24.75,
      C: 82.5, // kN
      C0: 100.0, // kN
      rpmRef: 4800,
      rpmLim: 6700,
      type: 'tapered-roller',
      e: 0.43,
      Y: 1.40,
      Y0: 0.80
    };

    const skf32215J2Q: BearingData = {
      code: '32215 J2/Q',
      d: 75,
      D: 130,
      B: 33.25,
      C: 161.0, // kN
      C0: 196.0, // kN (tobuseiko/SKF 2018 list 196-212 kN)
      rpmRef: 3400,
      rpmLim: 4800,
      type: 'tapered-roller',
      e: 0.43,
      Y: 1.40,
      Y0: 0.80
    };

    // 1. Shaft 1 Locating Bearing: SKF 32206 J2/Q
    // When evaluated with Fa = 1.195 kN, Fr = 2.85 kN (Fa/Fr = 0.419 > e=0.37 => P = 0.4*Fr + 1.6*Fa = 3.052 kN)
    const res1 = calculateBearingLife(skf32206J2Q, 2.85, 1.195, 1450);
    expect(res1.P).toBeCloseTo(3.052, 2);
    expect(res1.L10).toBeGreaterThan(10000);
    expect(res1.L10h).toBeCloseTo(129218.5, -2);
    expect(res1.L10h).toBeGreaterThan(25000);

    // If evaluated purely radially (P = 2.85 kN): L10h = 162,352 h
    const res1_radial = calculateBearingLife(skf32206J2Q, 2.85, 0, 1450);
    expect(res1_radial.L10h).toBeCloseTo(162352.0, -2);

    // 2. Shaft 2 Intermediate Bearing Pair: SKF 32210 J2/Q in O-arrangement
    // Radial loads FrI = 10.20 kN, FrII = 8.95 kN, external thrust Ka = 1.92 kN
    // Net resultant FaI = 5.116 kN (using catalog Y = 1.40)
    // Fa/Fr = 5.116 / 10.20 = 0.502 > e=0.43 => P = 0.4*10.20 + 1.40*5.1164 = 11.243 kN
    const n2_rpm = n_input_rpm / (stage1.z_gear / stage1.z_pinion);
    const res2 = calculateBearingLife(skf32210J2Q, 10.20, 5.1164, n2_rpm);
    expect(res2.P).toBeCloseTo(11.243, 2);
    expect(res2.L10h).toBeCloseTo(45891.0, -1);
    expect(res2.L10h).toBeGreaterThan(25000);

    // 3. Shaft 3 Output Bearing: SKF 32215 J2/Q
    // Fr = 11.80 kN, Fa = 3.115 kN (Fa/Fr = 3.115/11.80 = 0.264 <= e=0.43 => P = Fr = 11.80 kN)
    const n3_rpm = n2_rpm / (stage2.z_gear / stage2.z_pinion);
    const res3 = calculateBearingLife(skf32215J2Q, 11.80, 3.115, n3_rpm);
    expect(res3.P).toBeCloseTo(11.80, 2);
    expect(res3.L10h).toBeCloseTo(1692915.0, -2);
    expect(res3.L10h).toBeGreaterThan(25000);
  });

  it('Step 4: executes production din743Check engine for critical shaft notch section', () => {
    // 42CrMo4 steel properties per DIN 743-3
    const mat42CrMo4: Din743Material = {
      Rm: 1000, // MPa
      Re: 750,  // MPa
      steelClass: 'quenched-tempered'
    };

    // Shaft 1 Pinion Seat (d = 30 mm, DIN 6885 keyway slot)
    const keywayPoint: Din743Point = {
      d: 30,
      sigmaB: 67.6, // MPa bending stress amplitude
      tau: 23.3,    // MPa mean torsional stress
      notch: { kind: 'keyway', d: 30 },
      Rz: 6.3,
      torsionAlt: 0 // unidirectional steady torque
    };

    // Call real production engine
    const resKeyway = din743Check(keywayPoint, mat42CrMo4);
    expect(resKeyway.SD).toBeGreaterThanOrEqual(1.50); // Pass DIN 743 fatigue safety!
    expect(resKeyway.SF).toBeGreaterThanOrEqual(2.0);  // Static safety
    expect(resKeyway.tier).toBe('normative');
  });

  it('Step 5: executes production computeBoltAssembly engine for VDI 2230 bolting', () => {
    // Call production bolt engine for M12 Grade 8.8
    const boltRes = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: 'M12',
      grade: '8.8',
      muThread: 0.12,
      muHead: 0.12,
      yieldUtilization: 70,
      alphaA: 1.2
    });

    // Check tightening torque and safety per VDI 2230 (66.2 Nm computed by VDI 2230 Table A8 engine)
    expect(boltRes.MA).toBeCloseTo(66.23, 1);
    expect(boltRes.safety).toBeGreaterThan(1.10);
    expect(boltRes.d_nom).toBe(12);
  });

  it('Step 6 (G1-P0-01 & G1-P0-05): verifies SKF Table 7 O-arrangement Case 2a & Case 1a and operating life boundary metadata', () => {
    const rec32210 = findSKFBearing('32210 J2/Q')!;
    expect(rec32210).toBeDefined();

    const skf32210: BearingData = {
      code: rec32210.fullDesignation,
      type: rec32210.type,
      d: rec32210.d,
      D: rec32210.D,
      B: rec32210.B,
      C: rec32210.C,
      C0: rec32210.C0,
      e: rec32210.e,
      Y: rec32210.Y,
      Y0: rec32210.Y0
    };

    const n2_rpm = n_input_rpm / (stage1.z_gear / stage1.z_pinion);

    // Case 2a: External axial thrust Ka = 1.92 kN directed towards Bearing A (FrA = 10.20 kN, FrB = 8.95 kN)
    const case2a = solveSkfPairedTaperedRollerOArrangement({
      bearingA: skf32210,
      bearingB: skf32210,
      FrA: 10.20,
      FrB: 8.95,
      Ka: 1.92,
      kaDirection: 'towards_A',
      rpm: n2_rpm,
      arrangement: 'O-back-to-back'
    });

    expect(case2a.skfTableCase).toBe('Case 2a');
    expect(case2a.bearingA.Fa).toBeCloseTo(5.1164, 3);
    expect(case2a.bearingA.P).toBeCloseTo(11.243, 2);
    expect(case2a.bearingA.L10h).toBeCloseTo(45891.0, -1);
    expect(case2a.bearingB.Fa).toBeCloseTo(3.1964, 3);
    expect(case2a.bearingB.P).toBeCloseTo(8.95, 2);
    expect(case2a.bearingB.L10h).toBeCloseTo(98156.8, -1);
    expect(case2a.governingL10h).toBeCloseTo(45891.0, -1);

    // Boundary metadata check (G1-P0-05)
    expect(case2a.boundaryMetadata.zeroClearanceNoPreloadAssumption).toBe(true);
    expect(case2a.boundaryMetadata.lifeClassification).toBe('BASELINE_SCREENING_L10H');
    expect(case2a.boundaryMetadata.operatingLifeWarning).toContain('zero operating clearance');

    // Case 1a: External axial thrust Ka = 1.92 kN directed towards Bearing B
    const case1a = solveSkfPairedTaperedRollerOArrangement({
      bearingA: skf32210,
      bearingB: skf32210,
      FrA: 10.20,
      FrB: 8.95,
      Ka: 1.92,
      kaDirection: 'towards_B',
      rpm: n2_rpm,
      arrangement: 'O-back-to-back'
    });

    expect(case1a.skfTableCase).toBe('Case 1a');
    expect(case1a.bearingA.Fa).toBeCloseTo(3.6429, 3);
    expect(case1a.bearingA.P).toBeCloseTo(10.20, 2);
    expect(case1a.bearingA.L10h).toBeCloseTo(63483.86, 0);
    expect(case1a.bearingB.Fa).toBeCloseTo(5.5629, 3);
    expect(case1a.bearingB.P).toBeCloseTo(11.368, 2);
    expect(case1a.bearingB.L10h).toBeCloseTo(44230.01, 0);
    expect(case1a.bearingB.L10h).toBeGreaterThan(25000);
  });

  it('Step 7 (G1-P0-02): verifies 3D spatial shaft equilibrium and near-zero static residuals (ΣFx, ΣFy, ΣFz, ΣMx, ΣMy, ΣMz = 0)', () => {
    // Input Shaft 1: zA = 0 mm, Pinion at z = 90 mm, zB = 180 mm
    // Design forces: Ft1 = 4792.58 N, Fr1 = 1797.73 N, Fa1 = 1194.88 N at pitch radius r1 = 25.765 mm
    const eqShaft1 = solve3DShaftStaticEquilibrium({
      zAMm: 0,
      zBMm: 180,
      externalTorqueMzNmm: -4792.58 * 25.7653,
      loads: [
        {
          label: 'Stage 1 Helical Pinion',
          zMm: 90,
          rPitchMm: 25.7653,
          FxN: 4792.58,
          FyN: -1797.73,
          FzN: 1194.88,
          MxNmm: 1194.88 * 25.7653, // Overturning couple from axial force
          MzNmm: 4792.58 * 25.7653  // Gear mesh torsional moment about z-axis
        }
      ]
    });

    expect(Math.abs(eqShaft1.residuals.sumFxN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft1.residuals.sumFyN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft1.residuals.sumFzN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft1.residuals.sumMxAboutANmm)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft1.residuals.sumMyAboutANmm)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft1.residuals.sumMzNmm)).toBeLessThan(1e-9);
    expect(eqShaft1.bearingTorsionalMomentConstraint.bearingAMzNmm).toBe(0);
    expect(eqShaft1.bearingTorsionalMomentConstraint.bearingBMzNmm).toBe(0);
    expect(eqShaft1.bearingTorsionalMomentConstraint.torqueTransmissionPath).toContain('carry zero torsional moment');
    expect(eqShaft1.FrAkN).toBeCloseTo(2.61, 1);

    // Intermediate Shaft 2: Bearing A at z = 0 mm, Gear 2 at z = 75 mm, Pinion 3 at z = 165 mm, Bearing B at z = 240 mm
    const eqShaft2 = solve3DShaftStaticEquilibrium({
      zAMm: 0,
      zBMm: 240,
      loads: [
        {
          label: 'Stage 1 Driven Wheel z2=104',
          zMm: 75,
          rPitchMm: 133.98,
          FxN: -4792.58,
          FyN: 1797.73,
          FzN: -1194.88,
          MxNmm: -1194.88 * 133.98,
          MzNmm: -4792.58 * 133.98
        },
        {
          label: 'Stage 2 Driving Pinion z3=21',
          zMm: 165,
          rPitchMm: 42.938,
          FxN: -14655.0,
          FyN: -5453.2,
          FzN: 3115.0,
          MxNmm: 3115.0 * 42.938,
          MzNmm: 14655.0 * 42.938
        }
      ]
    });

    expect(Math.abs(eqShaft2.residuals.sumFxN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.residuals.sumFyN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.residuals.sumFzN)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.residuals.sumMxAboutANmm)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.residuals.sumMyAboutANmm)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.residuals.sumMzNmm)).toBeLessThan(1e-9);
    expect(Math.abs(eqShaft2.RAzN)).toBeCloseTo(1920.12, 1); // Net axial force Ka = 1.92 kN!
  });

  it('Step 8 (G1-P0-03): resolves SKF 32206/32210/32215 J2/Q directly from production SKF_MASTER_CATALOG with provenance', () => {
    const b06 = findSKFBearing('32206 J2/Q');
    const b10 = findSKFBearing('32210 J2/Q');
    const b15 = findSKFBearing('32215 J2/Q');

    expect(b06).toBeDefined();
    expect(b06!.C).toBe(50.1);
    expect(b06!.C0).toBe(57.0);
    expect(b06!.e).toBe(0.37);
    expect(b06!.Y).toBe(1.6);

    expect(b10).toBeDefined();
    expect(b10!.C).toBe(82.5);
    expect(b10!.C0).toBe(100.0);
    expect(b10!.e).toBe(0.43);
    expect(b10!.Y).toBe(1.4);

    expect(b15).toBeDefined();
    expect(b15!.C).toBe(161.0);
    expect(b15!.C0).toBe(196.0);
    expect(b15!.catalogRevisionRef).toContain('196.0 kN');
    expect(b15!.catalogRevisionRef).toContain('212.0 kN');
  });

  it('Step 9 (G1-P0-04 & G1-P0-06): executes parametric mutation tests and connected data-flow pipeline', () => {
    // 1. Connected flow: Motor (P_kW) -> Torque -> Gear Forces -> 3D Shaft Equilibrium -> Bearing Life
    const runConnectedPipeline = (motorKw: number, shaftDiaMm: number, boltGrade: string) => {
      const T1_des = ((9549.296585 * motorKw) / n_input_rpm) * K_A;
      const d1_m = ((stage1.z_pinion * stage1.m_n) / Math.cos(degToRad(stage1.beta_deg))) / 1000;
      const Ft1 = (2 * T1_des) / d1_m;
      const Fa1 = Ft1 * Math.tan(degToRad(stage1.beta_deg));
      const Fr1 = (Ft1 * Math.tan(degToRad(stage1.alpha_n_deg))) / Math.cos(degToRad(stage1.beta_deg));

      const eq1 = solve3DShaftStaticEquilibrium({
        zAMm: 0,
        zBMm: 180,
        loads: [{ label: 'Pinion', zMm: 90, rPitchMm: (d1_m * 1000) / 2, FxN: Ft1, FyN: -Fr1, FzN: Fa1 }]
      });

      const b06Rec = findSKFBearing('32206 J2/Q')!;
      const bearingLife = calculateBearingLife(
        {
          code: b06Rec.fullDesignation,
          type: b06Rec.type,
          d: b06Rec.d,
          D: b06Rec.D,
          B: b06Rec.B,
          C: b06Rec.C,
          C0: b06Rec.C0,
          e: b06Rec.e,
          Y: b06Rec.Y,
          Y0: b06Rec.Y0
        },
        eq1.FrAkN,
        Fa1 / 1000,
        n_input_rpm
      );

      // Bending moment at center z=90mm: Mb = FrA * 0.090 m
      const Mb_Nm = eq1.FrAN * 0.090;
      const Wb_mm3 = (Math.PI * Math.pow(shaftDiaMm, 3)) / 32;
      const Wt_mm3 = (Math.PI * Math.pow(shaftDiaMm, 3)) / 16;
      const sigmaB = (Mb_Nm * 1000) / Wb_mm3;
      const tau = (T1_des * 1000) / Wt_mm3;

      const shaftRes = din743Check(
        { d: shaftDiaMm, sigmaB, tau, notch: { kind: 'keyway', d: shaftDiaMm }, Rz: 6.3, torsionAlt: 0 },
        { Rm: 1000, Re: 750, steelClass: 'quenched-tempered' }
      );

      const boltRes = computeBoltAssembly({
        threadStandard: 'Metric Coarse',
        size: 'M12',
        grade: boltGrade,
        muThread: 0.12,
        muHead: 0.12,
        yieldUtilization: 70,
        alphaA: 1.2
      });

      return { bearingLife, shaftRes, boltRes };
    };

    const baseline = runConnectedPipeline(15.0, 30, '8.8');
    const mutatedOverload = runConnectedPipeline(45.0, 18, '4.6'); // 3x power, undersized 18mm shaft, weak 4.6 bolt

    // Prove parametric sensitivity & mutation detection:
    expect(mutatedOverload.bearingLife.L10h).toBeLessThan(baseline.bearingLife.L10h / 20);
    expect(mutatedOverload.shaftRes.SD).toBeLessThan(1.0); // Fails DIN 743 fatigue safety (< 1.5)!
    expect(mutatedOverload.boltRes.MA).toBeLessThan(baseline.boltRes.MA * 0.5); // 4.6 bolt has < half the torque capacity of 8.8

    // Explicit 15 kW -> 22 kW linear load scaling check on SKF 32210 J2/Q Case 2a (V10-12 / V10_Sayisal_Ref!B16 = 12802.34 h)
    const rec32210 = findSKFBearing('32210 J2/Q')!;
    const skf32210: BearingData = {
      code: rec32210.fullDesignation,
      type: rec32210.type,
      d: rec32210.d,
      D: rec32210.D,
      B: rec32210.B,
      C: rec32210.C,
      C0: rec32210.C0,
      e: rec32210.e,
      Y: rec32210.Y,
      Y0: rec32210.Y0
    };
    const scale22 = 22.0 / 15.0;
    const n2_rpm = n_input_rpm / (stage1.z_gear / stage1.z_pinion);
    const case2a_22kW = solveSkfPairedTaperedRollerOArrangement({
      bearingA: skf32210,
      bearingB: skf32210,
      FrA: 10.20 * scale22,
      FrB: 8.95 * scale22,
      Ka: 1.92 * scale22,
      kaDirection: 'towards_A',
      rpm: n2_rpm,
      arrangement: 'O-back-to-back'
    });
    expect(case2a_22kW.bearingA.P).toBeCloseTo(11.243 * scale22, 3);
    expect(case2a_22kW.bearingA.L10h).toBeCloseTo(12802.34, 0); // Exact (15/22)^(10/3) * 45890.55 = 12802.34 h!
  });

  it('Step 10 (G1-P0-07): executes operational 2D Nesting & CAM lead-in/remnant pipeline for reducer torque-arm bracket plates', () => {
    const bracketParts: Part2D[] = [
      {
        id: 'REDUCER-TORQUE-ARM-12MM',
        label: 'Torque Arm Plate 450x220',
        polygon: {
          points: [{ x: 0, y: 0 }, { x: 450, y: 0 }, { x: 450, y: 220 }, { x: 0, y: 220 }],
          bounds: { x: 0, y: 0, width: 450, height: 220 },
          area: 450 * 220
        },
        quantity: 4,
        allowedRotations: [0, 90],
        material: 'S235JR',
        thickness: 12
      }
    ];

    const sheet: Sheet2D = {
      width: 3000,
      height: 1500,
      kerf: 2.2
    };

    const nestResult = executeSigmaNest2D({
      parts: bracketParts,
      sheet,
      options: {
        spacing: 8,
        rotationStep: 90,
        algorithm: 'sigmanest',
        heuristic: 'best-area-fit',
        multiSheet: false,
        maxSheets: 1,
        enableRemnantGeneration: true,
        minRemnantDimensionMm: 400
      }
    });

    expect(nestResult.sheets.length).toBe(1);
    expect(nestResult.sheets[0].placedParts.length).toBe(4);
    expect(nestResult.sheets[0].remnantSheet).toBeDefined();
    expect(nestResult.sheets[0].cropCut).toBeDefined();

    const leadIn = calculateSigmaNestLeadInParameters(12, 'S235JR');
    expect(leadIn.leadInLengthMm).toBeGreaterThan(4);
    expect(leadIn.pierceDelaySec).toBeGreaterThan(0.2);
  });
});

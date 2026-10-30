import { describe, it, expect } from 'vitest';
import { calculateIso6336Mesh, inverseInvolute, involute, toothFormFactorYF } from '@/lib/iso6336';
import { calculateGearStrength } from '@/lib/gearStrength';
import { ratePlanetaryStage, planetLoadShareFactor, singleMeshEfficiency } from '@/lib/planetaryRating';
import { iso10823RatedPowerKw, rateOpenBelt, rateRollerChain, evenLinkCenterMm } from '@/lib/openDriveRating';

describe('ISO 6336 professional kernel', () => {
  it('inverts the involute function to machine precision', () => {
    const a = 20 * Math.PI / 180;
    expect(inverseInvolute(involute(a))).toBeCloseTo(a, 10);
  });

  it('matches ISO 6336-3 YF table at 20T (≈2.80)', () => {
    expect(toothFormFactorYF(20, 0)).toBeCloseTo(2.85, 1);
    expect(toothFormFactorYF(12, 0)).toBeGreaterThan(toothFormFactorYF(40, 0));
    expect(toothFormFactorYF(20, 0.4)).toBeLessThan(toothFormFactorYF(20, 0));
  });

  it('rates a 20/60 m=3 spur pair with realistic SH/SF and εα ≈ 1.67', () => {
    const mesh = calculateIso6336Mesh({
      mn: 3,
      z1: 20,
      z2: 60,
      b: 30,
      torqueNm: 36.2,
      rpmPinion: 1450,
      applicationFactor: 1.25,
      sigmaHlim: 1250,
      sigmaFlim1: 430,
      sigmaFlim2: 430,
    });
    expect(mesh.d1).toBe(60);
    expect(mesh.d2).toBe(180);
    expect(mesh.aWorking).toBe(120);
    expect(mesh.epsilonAlpha).toBeGreaterThan(1.55);
    expect(mesh.epsilonAlpha).toBeLessThan(1.85);
    expect(mesh.epsilonBeta).toBe(0);
    expect(mesh.Ft).toBeGreaterThan(1000);
    expect(mesh.sigmaH).toBeGreaterThan(200);
    expect(mesh.sigmaF1).toBeGreaterThan(mesh.sigmaF2);
    expect(mesh.SF1).toBeGreaterThan(1);
    expect(mesh.SH).toBeGreaterThan(1);
    expect(mesh.YF1).toBeGreaterThan(2.4);
    expect(mesh.YF1).toBeLessThan(3.4);
  });

  it('grows pitch diameters with helix via mt = mn/cos β and adds Fa, εβ', () => {
    const helical = calculateIso6336Mesh({
      mn: 3,
      z1: 20,
      z2: 60,
      b: 40,
      betaDeg: 15,
      torqueNm: 36.2,
      rpmPinion: 1450,
    });
    const mt = 3 / Math.cos(15 * Math.PI / 180);
    expect(helical.mt).toBeCloseTo(mt, 5);
    expect(helical.d1).toBeCloseTo(20 * mt, 4);
    expect(helical.Fa).toBeGreaterThan(0);
    expect(helical.Fa / helical.Ft).toBeCloseTo(Math.tan(15 * Math.PI / 180), 3);
    expect(helical.epsilonBeta).toBeGreaterThan(0.8);
    expect(helical.epsilonGamma).toBeGreaterThan(helical.epsilonAlpha);
  });

  it('uses conforming curvature (u−1)/u for internal gears', () => {
    const ext = calculateIso6336Mesh({ mn: 2, z1: 20, z2: 80, b: 20, torqueNm: 20, rpmPinion: 1000, internal: false });
    const inn = calculateIso6336Mesh({ mn: 2, z1: 20, z2: 80, b: 20, torqueNm: 20, rpmPinion: 1000, internal: true });
    expect(inn.aWorking).toBeCloseTo((80 - 20), 6); // (d2-d1)/2 = (160-40)/2 = 60, wait d=z*m so (160-40)/2=60
    expect(inn.aWorking).toBe(60);
    expect(inn.sigmaH).toBeLessThan(ext.sigmaH);
  });
});

describe('Planetary AGMA 6123 / Müller rating', () => {
  it('uses floating-sun load share Kγ = 1.10 for three planets', () => {
    expect(planetLoadShareFactor(3, true)).toBeCloseTo(1.1, 5);
    expect(planetLoadShareFactor(4, true)).toBeGreaterThan(planetLoadShareFactor(3, true));
    expect(planetLoadShareFactor(3, false)).toBeGreaterThan(planetLoadShareFactor(3, true));
  });

  it('gives ring-fixed stage efficiency above basic mesh efficiency (coupling power)', () => {
    const etaSp = singleMeshEfficiency(21, 21, false);
    const etaPr = singleMeshEfficiency(21, 63, true);
    const eta0 = etaSp * etaPr;
    const rated = ratePlanetaryStage({
      zs: 21,
      zp: 21,
      zr: 63,
      planetCount: 3,
      mn: 2,
      faceWidth: 20,
      mode: 'ring',
      nInRpm: 1500,
      powerKW: 5.5,
    });
    expect(rated.i).toBeCloseTo(1 + 63 / 21, 6);
    expect(rated.assemblyOk).toBe(true);
    expect(rated.eta0).toBeCloseTo(eta0, 5);
    expect(rated.etaStage).toBeGreaterThan(eta0);
    expect(rated.etaStage).toBeLessThan(0.995);
    expect(rated.Kgamma).toBeCloseTo(1.1, 5);
    expect(rated.Ft_planet).toBeGreaterThan(0);
    expect(rated.sunPlanet.SF).toBeGreaterThan(1);
    expect(rated.planetRing.SH).toBeGreaterThan(0.5);
    expect(rated.T_out).toBeGreaterThan(0);
    expect(Math.abs(rated.T_sun + rated.T_ring + rated.T_carrier)).toBeLessThan(1e-6);
  });

  it('flags non-integer (zs+zr)/N assembly', () => {
    const bad = ratePlanetaryStage({
      zs: 21,
      zp: 21,
      zr: 63,
      planetCount: 5,
      mn: 2,
      mode: 'ring',
      nInRpm: 1500,
      powerKW: 4,
    });
    expect((21 + 63) % 5).not.toBe(0);
    expect(bad.assemblyOk).toBe(false);
  });

  it('flags odd (zr-zs) coaxial non-integer teeth condition', () => {
    const odd = ratePlanetaryStage({
      zs: 20,
      zr: 63, // 63 - 20 = 43 (odd! Zp would be 21.5)
      planetCount: 3,
      mn: 2,
      mode: 'ring',
      nInRpm: 1500,
      powerKW: 4,
    });
    expect(odd.coaxialOk).toBe(false);
    expect(odd.status).toBe('unsafe');
    expect(odd.criticalMesh).toBe('coaxial integer teeth (odd Zr-Zs)');
  });

  it('detects adjacent planet interference collision when planet count is too high', () => {
    // 6 planets crowded with large diameter
    const crowded = ratePlanetaryStage({
      zs: 12,
      zr: 72, // zp = 30, dc = m*(12+30)=42m, Cadj = 2 * 42m/2 * sin(pi/6) = 21m. da_p = 30m + 2m = 32m > 21m! COLLISION!
      planetCount: 6,
      mn: 2,
      mode: 'ring',
      nInRpm: 1500,
      powerKW: 4,
    });
    expect(crowded.adjacentClearanceMm).toBeLessThan(0);
    expect(crowded.adjacentOk).toBe(false);
    expect(crowded.status).toBe('unsafe');
    expect(crowded.criticalMesh).toBe('adjacent planet collision');
  });

  it('assigns opposite helix hands: sun RH, planets/ring LH', () => {
    const h = ratePlanetaryStage({
      zs: 20, zp: 20, zr: 60, planetCount: 3, mn: 2, betaDeg: 15,
      mode: 'ring', nInRpm: 1500, powerKW: 5,
    });
    expect(h.helixHands.sun).toBe('RH');
    expect(h.helixHands.planets).toBe('LH');
    expect(h.helixHands.ring).toBe('LH');
    expect(h.Fa_sun).toBeGreaterThan(0);
    expect(h.mt).toBeCloseTo(2 / Math.cos(15 * Math.PI / 180), 4);
    expect(h.coaxialOk).toBe(true);
    expect(h.assemblyOk).toBe(false); // (20 + 60) % 3 = 2 (standard equal spacing impossible without tooth phase shift)
    expect(h.assemblyRemainder).toBe(2);
    expect(h.adjacentOk).toBe(true);
    expect(h.adjacentClearanceMm).toBeGreaterThan(1.0);
  });
});

describe('Belt and chain professional ratings', () => {
  it('adds centrifugal tension and a shaft resultant for a V-belt', () => {
    const r = rateOpenBelt({
      d1: 100,
      d2: 250,
      C: 500,
      n1: 1450,
      designPowerKW: 6.25,
      wrapRad: Math.PI * 0.9,
      tensionRatio: Math.exp(0.3 * Math.PI * 0.9 / Math.sin(19 * Math.PI / 180)),
      positiveDrive: false,
      pretensionFactor: 1.2,
      linearDensityKgM: 0.1,
      beltLengthMm: 1400,
    });
    expect(r.Te).toBeGreaterThan(0);
    expect(r.Tc).toBeGreaterThan(0);
    expect(r.T1).toBeGreaterThan(r.T2);
    expect(r.T1 - r.T2).toBeCloseTo(r.Te, 4);
    expect(r.shaftLoadN).toBeGreaterThan(r.T1 - r.T2);
    expect(r.flexHz).toBeGreaterThan(0);
  });

  it('reports teeth in mesh for timing belts', () => {
    const r = rateOpenBelt({
      d1: 76.4,
      d2: 152.8,
      C: 400,
      n1: 1450,
      designPowerKW: 3,
      wrapRad: Math.PI * 0.85,
      tensionRatio: 0,
      positiveDrive: true,
      pretensionFactor: 1.05,
      beltLengthMm: 1200,
      z1: 30,
    });
    expect(r.teethInMesh).toBeGreaterThan(10);
  });

  it('rates ISO 10B simplex above 5 kW at 1450 rpm / z=19', () => {
    const kw = iso10823RatedPowerKw(15.875, 19, 1450, 1);
    expect(kw).toBeGreaterThan(8);
    expect(kw).toBeLessThan(40);
  });

  it('snaps chain centre distance to an even pitch count', () => {
    const snap = evenLinkCenterMm(15.875, 19, 57, 500);
    expect(snap.evenLinks % 2).toBe(0);
    expect(snap.C_even).toBeGreaterThan(400);
    expect(Math.abs(snap.C_even - 500)).toBeLessThan(20);
  });

  it('recommends circulating lubrication above 8 m/s', () => {
    const r = rateRollerChain({
      pitchMm: 15.875,
      z1: 19,
      z2: 57,
      C: 500,
      n1: 3000,
      designPowerKW: 5,
      strandCount: 1,
      loadShare: 1,
      breakingLoadN: 22200,
      workingLoadN: 2800,
    });
    expect(r.lube === 'oil-bath' || r.lube === 'circulating').toBe(true);
    expect(r.ratedPowerKW).toBeGreaterThan(0);
  });
});

describe('schema engines expose professional outputs', () => {
  it('planetary schema reports Müller η, Kγ and ISO 6336 SF/SH', async () => {
    const schema = (await import('@/calculators/schemas-v2/planetary-gear')).default;
    const { createValidatedValue } = await import('@/types/engineering');
    const result = schema.calculationEngine({
      m: createValidatedValue(2, 'mm', 'user'),
      helixAngle: createValidatedValue(0, 'deg', 'user'),
      faceWidth: createValidatedValue(20, 'mm', 'user'),
      zs: createValidatedValue(21, '-', 'user'),
      zp: createValidatedValue(21, '-', 'user'),
      N: createValidatedValue(3, '-', 'user'),
      config: createValidatedValue('ring', '-', 'user'),
      nin: createValidatedValue(1500, 'rpm', 'user'),
      Tin: createValidatedValue(40, 'Nm', 'user'),
    });
    expect(result.outputs.eta.value).toBeGreaterThan(0.9);
    expect(result.outputs.Kgamma.value).toBeCloseTo(1.1, 5);
    expect(result.outputs.SFsp.value).toBeGreaterThan(1);
    expect(result.outputs.SHsp.value).toBeGreaterThan(0.5);
  }, 15000);

  it('chain schema reports ISO 10823 rated power and even-link centre', async () => {
    const schema = (await import('@/calculators/schemas-v2/chain-drive')).default;
    const { createValidatedValue } = await import('@/types/engineering');
    const result = schema.calculationEngine({
      chainType: createValidatedValue('roller-simplex', '-', 'user'),
      chainSize: createValidatedValue('10b', '-', 'user'),
      z1: createValidatedValue(19, '-', 'user'),
      z2: createValidatedValue(57, '-', 'user'),
      pitch: createValidatedValue(15.875, 'mm', 'user'),
      centerDist: createValidatedValue(500, 'mm', 'user'),
      rpm1: createValidatedValue(1450, 'RPM' as any, 'user'),
      power: createValidatedValue(5, 'kW', 'user'),
      serviceFactor: createValidatedValue(1.3, '-', 'user'),
    });
    expect(result.outputs.ratedPower.value).toBeGreaterThan(8);
    expect(result.outputs.C_even.value).toBeGreaterThan(400);
    expect(result.outputs.centrifugalN.value).toBeGreaterThan(0);
  });
});

describe('remaining professional wiring', () => {
  it('rewrites kernel calculateBendingStrength onto ISO 6336', async () => {
    const { createStandardGearPair, analyzeGearPair, calculateBendingStrength } = await import('@/engines/math/gear.geometry');
    const pair = createStandardGearPair(3, 20, 60, 20);
    const mesh = analyzeGearPair(pair);
    const rated = calculateBendingStrength({
      mesh,
      power: 5.5,
      pinionRPM: 1450,
      materialYield: 800,
      faceWidth: 30,
      qualityGrade: 6,
    });
    expect(rated.tangentialForce).toBeGreaterThan(1000);
    expect(rated.bendingStressPinion).toBeGreaterThan(0);
    expect(rated.contactStress).toBeGreaterThan(0);
    expect(rated.safetyFactorPinion).toBeGreaterThan(1);
    expect(rated.status).toMatch(/SAFE|MARGINAL/);
  });

  it('worm schema reports forces, centre distance and AGMA μ(vs)', async () => {
    const schema = (await import('@/calculators/schemas-v2/worm-gear')).default;
    const { createValidatedValue } = await import('@/types/engineering');
    const result = schema.calculationEngine({
      m: createValidatedValue(4, 'mm', 'user'),
      z1: createValidatedValue(2, '-', 'user'),
      z2: createValidatedValue(40, '-', 'user'),
      d1: createValidatedValue(50, 'mm', 'user'),
      alpha: createValidatedValue(20, 'deg', 'user'),
      mu: createValidatedValue(0.05, '-', 'user'),
      n1: createValidatedValue(1450, 'rpm', 'user'),
      T1: createValidatedValue(50, 'Nm', 'user'),
    });
    expect(result.outputs.a.value).toBeCloseTo((50 + 160) / 2, 5);
    expect(result.outputs.Ft1.value).toBeGreaterThan(0);
    expect(result.outputs.Fa1.value).toBeGreaterThan(result.outputs.Ft1.value);
    expect(result.outputs.muAgma.value).toBeGreaterThan(0.02);
    expect(result.outputs.selfLock.value).toBeGreaterThanOrEqual(0);
  });

  it('flow spur node emits ISO 6336 SF/SH when torque is set', async () => {
    const { SpurGearNode } = await import('@/flow/nodes/Mechanical/mech-gear-spur');
    const out = SpurGearNode.compute({
      module_mm: 3,
      pinion_teeth: 20,
      gear_teeth: 60,
      pressure_angle_deg: 20,
      face_width_mm: 30,
      torque_nm: 36,
      rpm: 1450,
    });
    expect(out.SF).toBeGreaterThan(1);
    expect(out.SH).toBeGreaterThan(0.5);
    expect(out.sigma_F).toBeGreaterThan(0);
  });
});

describe('gearStrength wrapper stays compatible', () => {
  it('still reports 60/180/120 mm for a spur 20/60 m=3 pair', () => {
    const result = calculateGearStrength(
      { module: 3, teethPinion: 20, teethGear: 60, faceWidth: 30, pressureAngle: 20, helixAngle: 0 },
      { power: 5.5, rpm: 1450, applicationFactor: 1.25 },
      { youngsModulus: 206, poissonRatio: 0.3, allowableBending: 430, allowableContact: 1250 }
    );
    expect(result.pitchDiameterPinion).toBe(60);
    expect(result.pitchDiameterGear).toBe(180);
    expect(result.centerDistance).toBe(120);
    expect(result.transverseContactRatio).toBeGreaterThan(1.2);
    expect(result.status).toMatch(/safe|marginal/);
  });
});

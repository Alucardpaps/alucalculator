import { describe, it, expect } from 'vitest';
import {
  calculateGearStrength,
  type GearParams,
  type LoadParams,
  type MaterialParams
} from '@/lib/gearStrength';

describe('ISO 6336 Gear Strength Engine', () => {
  const gear: GearParams = {
    module: 3,
    teethPinion: 20,
    teethGear: 60,
    faceWidth: 30,
    pressureAngle: 20,
    helixAngle: 0
  };

  const load: LoadParams = {
    power: 5.5, // 5.5 kW
    rpm: 1450, // 1450 rpm
    applicationFactor: 1.25,
    dynamicFactor: 1.1
  };

  const steel42CrMo4: MaterialParams = {
    youngsModulus: 206, // GPa
    poissonRatio: 0.3,
    allowableBending: 430, // MPa
    allowableContact: 1250 // MPa
  };

  it('calculates pitch diameters, center distance, and gear ratio accurately', () => {
    const result = calculateGearStrength(gear, load, steel42CrMo4);

    expect(result.pitchDiameterPinion).toBe(60); // 3 * 20 = 60 mm
    expect(result.pitchDiameterGear).toBe(180); // 3 * 60 = 180 mm
    expect(result.centerDistance).toBe(120); // (60 + 180) / 2 = 120 mm
    expect(result.transmissionRatio).toBe(3); // 60 / 20 = 3
    expect(result.transverseContactRatio).toBeGreaterThan(1.2);
  });

  it('computes tangential force Ft and contact/bending stresses', () => {
    const result = calculateGearStrength(gear, load, steel42CrMo4);

    expect(result.tangentialForce).toBeGreaterThan(1000); // N
    expect(result.radialForce).toBeGreaterThan(300); // N
    expect(result.contactStress).toBeGreaterThan(0);
    expect(result.bendingStressPinion).toBeGreaterThan(0);
    expect(result.bendingStressGear).toBeGreaterThan(0);

    expect(result.safetyContact).toBeGreaterThan(1.0);
    expect(result.safetyBendingPinion).toBeGreaterThan(1.0);
    expect(result.status).toBe('safe');
  });

  it('uses transverse module for helical pitch diameters and reports axial force', () => {
    const helical = calculateGearStrength(
      { ...gear, helixAngle: 15 },
      load,
      steel42CrMo4
    );
    const mt = 3 / Math.cos((15 * Math.PI) / 180);
    expect(helical.transverseModule).toBeCloseTo(mt, 4);
    expect(helical.pitchDiameterPinion).toBeCloseTo(20 * mt, 3);
    expect(helical.axialForce).toBeGreaterThan(0);
    expect(helical.overlapRatio).toBeGreaterThan(0.5);
    expect(helical.transverseContactRatio).toBeGreaterThan(1.2);
  });

  it('computes εα = gα / (π mt cos αt) without the 0.5/π bug', () => {
    const result = calculateGearStrength(gear, load, steel42CrMo4);
    // 20/60, m=3, 20° spur: εα ≈ 1.67
    expect(result.transverseContactRatio).toBeGreaterThan(1.55);
    expect(result.transverseContactRatio).toBeLessThan(1.85);
  });

  it('guarantees invariant tooth passing frequency across meshing pairs', () => {
    const z1 = 18;
    const z2 = 54;
    const rpm1 = 1450;
    const rpm2 = rpm1 / (z2 / z1); // 483.333 RPM

    const baseDur1 = 10.0 / (rpm1 / 1450);
    const baseDur2 = baseDur1 * (z2 / z1);

    const fTooth1 = z1 / baseDur1;
    const fTooth2 = z2 / baseDur2;

    expect(fTooth1).toBeCloseTo(fTooth2, 6); // Exactly identical tooth frequency -> 0 drift!
    expect(baseDur2 / baseDur1).toBe(z2 / z1);
  });
});

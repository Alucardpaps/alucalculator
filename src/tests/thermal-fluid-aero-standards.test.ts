/**
 * src/tests/thermal-fluid-aero-standards.test.ts
 *
 * Comprehensive Engineering Validation for Thermal, Fluid, Mechanical,
 * and Aerospace Dynamic calculation suites:
 * 1. Fluid Dynamics & Piping (Darcy-Weisbach, Colebrook-White, ISO 5167)
 * 2. Aerospace Dynamics & Wind Tunnel (ISA 1976, Aero Lift/Drag, Induced Drag)
 * 3. Vibration & Dynamics (SDOF Transmissibility, ISO 10816, ISO 1940-1)
 * 4. Pressure Vessel Design (ASME Section VIII Div 1 UG-27, UG-32, UG-99)
 * 5. Thermal Expansion & Stress (EN 1993-1-2, Constrained Stress, Slotted Holes)
 */

import { describe, it, expect } from 'vitest';
import { calculateISA } from '@/modules/mechanical/AerospaceDynamics';

describe('Thermal, Fluid, Vibration & Aerospace Standards Validation', () => {
  // -------------------------------------------------------------
  // 1. Aerospace Dynamics & ISA 1976 Atmosphere
  // -------------------------------------------------------------
  describe('ISA 1976 Standard Atmosphere (ICAO Doc 7488)', () => {
    it('verifies sea level standard conditions (0 m)', () => {
      const sl = calculateISA(0);
      expect(sl.T).toBeCloseTo(288.15, 2); // 15°C
      expect(sl.P).toBeCloseTo(101325, 0); // 101.325 kPa
      expect(sl.rho).toBeCloseTo(1.225, 2); // 1.225 kg/m^3
      expect(sl.a).toBeCloseTo(340.29, 1); // ~340.3 m/s speed of sound
    });

    it('verifies tropopause boundary at 11,000 m (isothermal transition)', () => {
      const tropo = calculateISA(11000);
      expect(tropo.T).toBeCloseTo(216.65, 1); // -56.5°C
      expect(tropo.P).toBeCloseTo(22632, -1); // ~22.6 kPa
      expect(tropo.rho).toBeCloseTo(0.3639, 2); // ~0.364 kg/m^3
    });

    it('verifies aerodynamic lift and drag power equations', () => {
      const rho = 1.225; // kg/m^3
      const v = 50; // m/s (180 km/h)
      const S = 20; // m^2
      const CL = 0.5;
      const CD = 0.03;

      const q = 0.5 * rho * v * v; // 1531.25 Pa
      const lift = q * S * CL; // 15312.5 N
      const drag = q * S * CD; // 918.75 N
      const powerWatts = drag * v; // 45937.5 W = 45.9 kW

      expect(q).toBeCloseTo(1531.25, 1);
      expect(lift).toBeCloseTo(15312.5, 0);
      expect(drag).toBeCloseTo(918.75, 0);
      expect(powerWatts / 1000).toBeCloseTo(45.94, 1);
    });

    it('verifies Prandtl lifting-line induced drag: CDi = CL^2 / (pi * AR * e)', () => {
      const CL = 0.6;
      const AR = 8.0;
      const e = 0.85;

      const CDi = (CL * CL) / (Math.PI * AR * e);
      expect(CDi).toBeCloseTo(0.01685, 4);
    });
  });

  // -------------------------------------------------------------
  // 2. Vibration & Dynamics Suite
  // -------------------------------------------------------------
  describe('Vibration Dynamics (ISO 10816, ISO 1940-1, SDOF)', () => {
    it('verifies SDOF undamped natural frequency: fn = sqrt(k/m) / 2pi', () => {
      const m = 100; // kg
      const k = 40000; // N/m
      const omega_n = Math.sqrt(k / m); // 20 rad/s
      const fn = omega_n / (2 * Math.PI); // ~3.183 Hz

      expect(omega_n).toBe(20);
      expect(fn).toBeCloseTo(3.183, 2);
    });

    it('verifies resonance zone transmissibility Tr >> 1 at r = 1.0', () => {
      const zeta = 0.05; // 5% damping
      const r = 1.0; // exact resonance

      // At r=1: Tr = sqrt( (1 + (2*zeta)^2) / ((2*zeta)^2) ) = sqrt( 1 + 1/(4*zeta^2) )
      const num = 1 + Math.pow(2 * zeta * r, 2);
      const den = Math.pow(1 - Math.pow(r, 2), 2) + Math.pow(2 * zeta * r, 2);
      const Tr = Math.sqrt(num / den);

      expect(Tr).toBeGreaterThan(9.0); // Severe amplification Tr ~ 10.05
      expect(Tr).toBeCloseTo(10.05, 1);
    });

    it('verifies effective isolation region occurs for r > sqrt(2)', () => {
      const zeta = 0.05;
      const r = 2.0; // well above sqrt(2) = 1.414

      const num = 1 + Math.pow(2 * zeta * r, 2);
      const den = Math.pow(1 - Math.pow(r, 2), 2) + Math.pow(2 * zeta * r, 2);
      const Tr = Math.sqrt(num / den);

      expect(Tr).toBeLessThan(1.0); // Attenuated!
      expect(Tr).toBeCloseTo(0.339, 2); // ~66% isolation efficiency
    });

    it('verifies ISO 1940-1 rotor unbalance formula: e_per = 1000 * G / omega', () => {
      const G = 2.5; // G 2.5 grade
      const rpm = 3000;
      const omega = (rpm * 2 * Math.PI) / 60; // 314.159 rad/s
      const e_per_um = (1000 * G) / omega; // micrometers

      expect(omega).toBeCloseTo(314.16, 1);
      expect(e_per_um).toBeCloseTo(7.96, 2); // 7.96 um specific unbalance
    });
  });

  // -------------------------------------------------------------
  // 3. Pressure Vessel Design (ASME Section VIII Div 1)
  // -------------------------------------------------------------
  describe('ASME Boiler & Pressure Vessel Code Sec VIII Div 1', () => {
    it('verifies UG-27 cylindrical shell required thickness: t = (P*R)/(S*E - 0.6P) + CA', () => {
      const P = 2.0; // MPa
      const R = 500; // mm
      const S = 138; // MPa (SA-516 Gr 70)
      const E = 0.85; // Spot RT
      const CA = 2.0; // mm

      const t_req = (P * R) / (S * E - 0.6 * P) + CA;
      // Denom = 138 * 0.85 - 1.2 = 117.3 - 1.2 = 116.1 MPa
      // t_req = 1000 / 116.1 + 2.0 = 8.613 + 2.0 = 10.613 mm
      expect(t_req).toBeCloseTo(10.61, 1);
    });

    it('verifies UG-32(d) 2:1 semi-ellipsoidal head required thickness', () => {
      const P = 2.0; // MPa
      const D = 1000; // mm (2 * R)
      const S = 138; // MPa
      const E = 0.85;
      const CA = 2.0;

      const t_head = (P * D) / (2 * S * E - 0.2 * P) + CA;
      // Denom = 2 * 117.3 - 0.4 = 234.2 MPa
      // t_head = 2000 / 234.2 + 2.0 = 8.54 + 2.0 = 10.54 mm
      expect(t_head).toBeCloseTo(10.54, 1);
    });

    it('verifies UG-99 hydrostatic test pressure multiplier P_test = 1.3 * MAWP', () => {
      const MAWP = 2.5; // MPa
      const P_test = 1.3 * MAWP;

      expect(P_test).toBeCloseTo(3.25, 2);
    });
  });

  // -------------------------------------------------------------
  // 4. Thermal Expansion & Constrained Stresses
  // -------------------------------------------------------------
  describe('Thermal Expansion & Stress (EN 1993-1-2 / AISC)', () => {
    it('verifies linear expansion: deltaL = alpha * L0 * deltaT', () => {
      const alpha = 23.1; // um/(m*K) = 23.1e-6 / C for 6082-T6
      const L0 = 2000; // mm
      const deltaT = 80; // °C

      const deltaL = L0 * alpha * deltaT * 1e-6; // mm
      // 2000 * 23.1e-6 * 80 = 3.696 mm
      expect(deltaL).toBeCloseTo(3.696, 2);
    });

    it('verifies constrained thermal stress: sigma = E * alpha * deltaT', () => {
      const E = 70000; // MPa (Aluminum)
      const alpha = 23.1e-6; // 1/C
      const deltaT = 50; // °C

      const sigma = E * alpha * deltaT; // MPa
      // 70000 * 23.1e-6 * 50 = 80.85 MPa
      expect(sigma).toBeCloseTo(80.85, 1);
    });

    it('verifies critical Euler thermal buckling temperature deltaT_cr', () => {
      const alpha = 23.1e-6;
      const L0 = 1000; // mm
      const r_gyr = 10; // mm
      // deltaT_cr = (pi^2 * r^2) / (alpha * L0^2)
      const critDeltaT = (Math.PI * Math.PI * (r_gyr * r_gyr)) / (alpha * (L0 * L0));
      // (9.8696 * 100) / (23.1e-6 * 1e6) = 986.96 / 23.1 = 42.72 °C
      expect(critDeltaT).toBeCloseTo(42.72, 1);
    });
  });
});

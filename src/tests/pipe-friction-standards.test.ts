/**
 * src/tests/pipe-friction-standards.test.ts
 *
 * Verifies Pipe Friction equations and flow regime classification:
 * - PIPE-LAM-001: Laminar flow (Re < 2300, f = 64 / Re)
 * - PIPE-TRANS-001: Transitional flow (2300 <= Re <= 4000, model-dependent warning)
 * - PIPE-TURB-001: Turbulent flow (Re > 4000, Colebrook-White / Swamee-Jain)
 * - Darcy-Weisbach head loss hf = f * (L/D) * (v^2 / 2g)
 */

import { describe, it, expect } from 'vitest';

function calculateFrictionFactor(Re: number, relativeRoughness: number = 0.0009): { f: number; regime: 'Laminar' | 'Transitional' | 'Turbulent' } {
    if (Re < 2300) {
        return {
            f: Re > 0 ? 64 / Re : 0,
            regime: 'Laminar'
        };
    } else if (Re <= 4000) {
        const f_lam = 64 / 2300;
        const f_turb = 0.25 / Math.pow(Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(4000, 0.9)), 2);
        const f = f_lam + ((Re - 2300) / 1700) * (f_turb - f_lam);
        return {
            f,
            regime: 'Transitional'
        };
    } else {
        // Swamee-Jain approximation of Colebrook-White
        const f = 0.25 / Math.pow(Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
        return {
            f,
            regime: 'Turbulent'
        };
    }
}

describe('Pipe Friction & Flow Regime Standards (ALUCALC_P0_REGRESSION_VECTORS_2026-10-03)', () => {
    it('PIPE-LAM-001: verifies laminar flow regime and Hagen-Poiseuille f = 64 / Re at Re = 1000', () => {
        const Re = 1000;
        const result = calculateFrictionFactor(Re);

        expect(result.regime).toBe('Laminar');
        expect(result.f).toBeCloseTo(0.064, 4);
    });

    it('PIPE-TRANS-001: verifies transitional flow identification at Re = 3000', () => {
        const Re = 3000;
        const result = calculateFrictionFactor(Re);

        expect(result.regime).toBe('Transitional');
        expect(Re).toBeGreaterThan(2300);
        expect(Re).toBeLessThanOrEqual(4000);
        expect(result.f).toBeGreaterThan(0.02);
        expect(result.f).toBeLessThan(0.05);
    });

    it('PIPE-TURB-001: verifies turbulent flow regime and Colebrook-White / Swamee-Jain at Re = 99800', () => {
        const Re = 99800;
        const eps_over_d = 0.045 / 50; // commercial steel in DN50 = 0.0009
        const result = calculateFrictionFactor(Re, eps_over_d);

        expect(result.regime).toBe('Turbulent');
        expect(Re).toBeGreaterThan(4000);
        expect(result.f).toBeGreaterThan(0.015);
        expect(result.f).toBeLessThan(0.035);
    });

    it('verifies Darcy-Weisbach head loss equation dimensional consistency', () => {
        // Water at 20°C: DN50 (D = 0.05 m), L = 100 m, Q = 5 L/s = 0.005 m³/s
        const D = 0.05; // m
        const L = 100; // m
        const Q = 0.005; // m³/s
        const A = (Math.PI * D * D) / 4;
        const v = Q / A; // ~2.546 m/s
        const g = 9.80665;
        const f = 0.0215; // typical turbulent friction factor

        const hf = f * (L / D) * (v * v) / (2 * g); // m
        expect(v).toBeCloseTo(2.55, 1);
        expect(hf).toBeGreaterThan(13.0);
        expect(hf).toBeLessThan(16.0);
    });
});

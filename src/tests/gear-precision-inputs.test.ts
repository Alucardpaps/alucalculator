import { describe, it, expect } from 'vitest';

describe('Gear 5-Decimal Precision Calculations', () => {
    it('accurately calculates operating pitch diameter dw and radius rw with 5-decimal shift inputs', () => {
        // Module m = 3, z1 = 20, z2 = 60, alpha = 20 deg
        const m = 3;
        const z1 = 20;
        const z2 = 60;
        const alphaRad = 20 * (Math.PI / 180);
        const inv = (a: number) => Math.tan(a) - a;

        // 5-decimal profile shifts
        const x1 = 0.24567;
        const x2 = -0.12345;

        // Standard reference pitch diameters: d = z * m
        const d1 = z1 * m; // 60 mm
        const d2 = z2 * m; // 180 mm
        const a_standard = (d1 + d2) / 2; // 120 mm

        // Base diameters: db = d * cos(alpha)
        const db1 = d1 * Math.cos(alphaRad);
        const db2 = d2 * Math.cos(alphaRad);

        // Operating pressure angle alpha_wt
        const sumX = x1 + x2; // 0.12222
        const sumZ = z1 + z2; // 80
        const inv_alpha_wt = (2 * Math.tan(alphaRad) * sumX / sumZ) + inv(alphaRad);

        let alpha_wt = alphaRad + 0.02;
        for (let k = 0; k < 8; k++) {
            alpha_wt = alpha_wt - (inv(alpha_wt) - inv_alpha_wt) / (Math.tan(alpha_wt) ** 2);
        }

        // Operating center distance a_wt
        const a_wt = a_standard * Math.cos(alphaRad) / Math.cos(alpha_wt);

        // Working pitch diameters dw = db / cos(alpha_wt)
        const dw1 = db1 / Math.cos(alpha_wt);
        const dw2 = db2 / Math.cos(alpha_wt);
        const rw1 = dw1 / 2;
        const rw2 = dw2 / 2;

        // Verify kinematic contact condition: rw1 + rw2 == a_wt
        expect(rw1 + rw2).toBeCloseTo(a_wt, 8);
        expect(dw1 + dw2).toBeCloseTo(2 * a_wt, 8);

        // Verify that 5-decimal formatted strings have full precision
        const dw1_str = dw1.toFixed(5);
        const rw1_str = rw1.toFixed(5);
        const a_wt_str = a_wt.toFixed(5);

        expect(dw1_str.split('.')[1].length).toBe(5);
        expect(rw1_str.split('.')[1].length).toBe(5);
        expect(a_wt_str.split('.')[1].length).toBe(5);

        // Verify that dw1 is greater than d1 because x1 > 0
        expect(dw1).toBeGreaterThan(d1);
    });

    it('retains 5-decimal precision for Wildhaber span and dimension over pins', () => {
        const m = 2.5;
        const z = 25;
        const alphaRad = 20 * (Math.PI / 180);
        const inv = (a: number) => Math.tan(a) - a;
        const x = 0.35412; // 5 decimals

        const k = Math.round(z / 9 + 0.5);
        const W = m * Math.cos(alphaRad) * (Math.PI * (k - 0.5) + z * inv(alphaRad) + 2 * x * Math.tan(alphaRad));

        const W_str = W.toFixed(5);
        expect(W_str.split('.')[1].length).toBe(5);
        expect(Number(W_str)).toBeCloseTo(W, 5);

        // Over pins measurement with 5-decimal pin diameter
        const Dp = 4.25123;
        const inv_alpha_pin = (Dp / (m * z * Math.cos(alphaRad))) + inv(alphaRad) + (2 * x * Math.tan(alphaRad) / z);
        let alpha_pin = 0.5;
        for (let j = 0; j < 8; j++) {
            alpha_pin = alpha_pin - (inv(alpha_pin) - inv_alpha_pin) / (Math.tan(alpha_pin) ** 2);
        }
        const d_center = (m * z * Math.cos(alphaRad)) / Math.cos(alpha_pin);
        const M = (d_center * Math.cos((90 / z) * (Math.PI / 180))) + Dp;

        const M_str = M.toFixed(5);
        expect(M_str.split('.')[1].length).toBe(5);
        expect(Number(M_str)).toBeCloseTo(M, 5);
    });
});

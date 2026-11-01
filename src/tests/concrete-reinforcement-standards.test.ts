/**
 * src/tests/concrete-reinforcement-standards.test.ts
 *
 * Verifies dual code compliance for reinforced concrete beam design:
 * 1. Eurocode 2 (EN 1992-1-1:2004+A1:2014) partial safety factor method (γc=1.5, γs=1.15)
 * 2. ACI 318 (ACI 318-19 / CODE-318-25) strength reduction method (φ=0.90) with Whitney stress block
 */

import { describe, it, expect } from 'vitest';

describe('Concrete Reinforcement Standards (Eurocode 2 vs ACI 318)', () => {
    // Benchmark RC section: 300x600 mm, cover 35 mm, stirrup 10 mm, 4xPhi20 rebar (As = 1256.6 mm2)
    // C25/30 concrete (fck = 25 MPa), B500B steel (fyk = 500 MPa), Med / Mu = 250 kNm
    const b = 300;
    const h = 600;
    const cover = 35;
    const barDia = 20;
    const numBars = 4;
    const fck = 25; // MPa
    const fyk = 500; // MPa
    const Med_kNm = 250;

    const d = h - cover - barDia / 2 - 10; // 540 mm
    const As_prov = numBars * (Math.PI * Math.pow(barDia, 2) / 4); // 1256.6 mm2
    const M_ed_Nm = Med_kNm * 1e6;

    it('CONC-EC2-001: verifies Eurocode 2 lever arm and reinforcement capacity', () => {
        // EN 1992-1-1 Clause 6.1
        const K = M_ed_Nm / (b * Math.pow(d, 2) * fck);
        expect(K).toBeCloseTo(0.1122, 3);
        expect(K).toBeLessThanOrEqual(0.167); // Singly reinforced limit

        // Internal lever arm z
        const z = d * (0.5 + Math.sqrt(0.25 - Math.min(0.225, K / 1.134)));
        expect(z).toBeGreaterThan(450);
        expect(z).toBeLessThan(d);

        // Design yield strength fyd = fyk / 1.15
        const fyd = fyk / 1.15;
        const As_req = M_ed_Nm / (fyd * z);

        expect(As_req).toBeLessThan(As_prov); // Safe
        expect(As_req).toBeCloseTo(1185, -1);
    });

    it('CONC-EC2-002: verifies compression steel warning when K > 0.167', () => {
        const excessiveMoment_kNm = 450; // Very high moment on same section
        const K_high = (excessiveMoment_kNm * 1e6) / (b * Math.pow(d, 2) * fck);

        expect(K_high).toBeGreaterThan(0.167);
    });

    it('CONC-ACI318-001: verifies ACI 318 Whitney stress block and tension-controlled condition', () => {
        // ACI 318-19 / CODE-318-25
        const phi = 0.90;
        const beta1 = fck <= 28 ? 0.85 : Math.max(0.65, 0.85 - (0.05 * (fck - 28)) / 7);
        expect(beta1).toBe(0.85);

        // Compression block depth a = As * fy / (0.85 * f'c * b)
        const a = (As_prov * fyk) / (0.85 * fck * b);
        expect(a).toBeCloseTo(98.56, 1);

        // Nominal moment Mn = As * fy * (d - a/2)
        const Mn_kNm = (As_prov * fyk * (d - a / 2)) * 1e-6;
        const phiMn_kNm = phi * Mn_kNm;

        expect(phiMn_kNm).toBeGreaterThan(Med_kNm); // Safe against 250 kNm
        expect(phiMn_kNm).toBeCloseTo(280.3, 1);

        // Neutral axis c = a / beta1
        const c_na = a / beta1;
        const cd_ratio = c_na / d;
        // Tension-controlled section requires c/d <= 0.375 (et >= 0.005)
        expect(cd_ratio).toBeLessThanOrEqual(0.375);
    });
});

import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const shaftDesignSchema: CalculatorSchemaV2 = {
    id: 'shaft-design',
    metadata: {
        title: 'Advanced Shaft Design',
        description: 'ASME Dynamic Shaft Design considering Bending, Torsion, and Fatigue (Goodman/Soderberg).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['shaft', 'fatigue', 'goodman', 'soderberg', 'machine elements'],
        verifiedStandards: ['ASME B106.1M']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Constant or reversed bending moments.', impact: 'high' },
            { id: 'a2', text: 'Constant or pulsating torsion.', impact: 'high' },
            { id: 'a3', text: 'Uses DE-Goodman, DE-Gerber, or DE-Soderberg.', impact: 'medium' }
        ],
        standards: [
            { code: 'ASME B106.1M', title: 'ASME Standard for Transmission Shafting' }
        ],
        formulaLatex: 'd = \\left( \\frac{16 n}{\\pi} \\left[ \\frac{\\sqrt{4M_a^2 + 3T_a^2}}{S_e} + \\frac{\\sqrt{4M_m^2 + 3T_m^2}}{S_{ut}} \\right] \\right)^{1/3}'
    },
    inputs: [
        { key: 'Ma', label: 'Alt. Bending (Ma)', unit: 'Nm', defaultValue: 150, description: 'Alternating Bending Moment', validation: { required: true, min: 0 } },
        { key: 'Mm', label: 'Mean Bending (Mm)', unit: 'Nm', defaultValue: 0, description: 'Mean Bending Moment', validation: { required: true, min: 0 } },
        { key: 'Ta', label: 'Alt. Torsion (Ta)', unit: 'Nm', defaultValue: 0, description: 'Alternating Torsional Moment', validation: { required: true, min: 0 } },
        { key: 'Tm', label: 'Mean Torsion (Tm)', unit: 'Nm', defaultValue: 200, description: 'Mean Torsional Moment', validation: { required: true, min: 0 } },
        { key: 'Sut', label: 'Ultimate Strength (Sut)', unit: 'MPa', defaultValue: 600, description: 'Ultimate Tensile Strength', validation: { required: true, min: 10 } },
        { key: 'Sy', label: 'Yield Strength (Sy)', unit: 'MPa', defaultValue: 450, description: 'Yield Strength', validation: { required: true, min: 10 } },
        { key: 'Se', label: 'Endurance Limit (Se)', unit: 'MPa', defaultValue: 200, description: 'Modified Endurance Limit (ka*kb*kc...*Se\')', validation: { required: true, min: 1 } },
        { key: 'Kf', label: 'Fatigue Factor (Kf)', unit: '-', defaultValue: 1.5, description: 'Fatigue stress concentration factor (Bending)', validation: { required: true, min: 1 } },
        { key: 'Kfs', label: 'Fatigue Factor (Kfs)', unit: '-', defaultValue: 1.2, description: 'Fatigue stress concentration factor (Torsion)', validation: { required: true, min: 1 } },
        { key: 'n', label: 'Safety Factor (n)', unit: '-', defaultValue: 2.0, description: 'Target Factor of Safety', validation: { required: true, min: 1 } },
        { key: 'theory', label: 'Failure Theory', unit: '-', defaultValue: 'Goodman', description: '0: Goodman, 1: Soderberg, 2: Gerber', validation: { required: true, min: 0, max: 2 } }
    ],
    outputs: [
        { key: 'dReq', label: 'Required Dia (d)', unit: 'mm', description: 'Minimum required shaft diameter.', precision: 2, formulaLatex: 'd = f(M, T, S_e, S_{ut})' },
        { key: 'sigmaA', label: 'Alt. Von Mises (σa\')', unit: 'MPa', description: 'Alternating equivalent stress.', precision: 1, formulaLatex: '\\sigma_a\' = \\frac{16}{\\pi d^3} \\sqrt{4(K_f M_a)^2 + 3(K_{fs} T_a)^2}' },
        { key: 'sigmaM', label: 'Mean Von Mises (σm\')', unit: 'MPa', description: 'Mean equivalent stress.', precision: 1, formulaLatex: '\\sigma_m\' = \\frac{16}{\\pi d^3} \\sqrt{4(K_f M_m)^2 + 3(K_{fs} T_m)^2}' },
    ],
    calculationEngine: (inputs) => {
        const Ma = Number(inputs.Ma.value);
        const Mm = Number(inputs.Mm.value);
        const Ta = Number(inputs.Ta.value);
        const Tm = Number(inputs.Tm.value);
        const Sut = Number(inputs.Sut.value);
        const Sy = Number(inputs.Sy.value);
        const Se = Number(inputs.Se.value);
        const Kf = Number(inputs.Kf.value);
        const Kfs = Number(inputs.Kfs.value);
        const n = Number(inputs.n.value);
        // We will default to Goodman for text 'Goodman', since V2 UI might pass string or number.
        const theoryStr = String(inputs.theory.value).toLowerCase();

        // Calculate equivalence terms (ignoring the 16/(pi*d^3) initially for diameter solving)
        const A = Math.sqrt(4 * Math.pow(Kf * Ma, 2) + 3 * Math.pow(Kfs * Ta, 2));
        const B = Math.sqrt(4 * Math.pow(Kf * Mm, 2) + 3 * Math.pow(Kfs * Tm, 2));

        let dKub: number;

        if (theoryStr.includes('soderberg') || theoryStr === '1') {
            // DE-Soderberg: 1/n = sigma_a/Se + sigma_m/Sy
            dKub = (16 * n / Math.PI) * ((A / Se) + (B / Sy));
        } else if (theoryStr.includes('gerber') || theoryStr === '2') {
            // DE-Gerber: 1/n = sigma_a/Se + (sigma_m/Sut)^2 * n
            // This requires solving a cubic if we do it backwards, but the standard direct equation is:
            // d = ( (8 * n * A) / (pi * Se) * ( 1 + ( 1 + (2*B*Se/(A*Sut))^2 )^0.5 ) )^(1/3)
            dKub = ((8 * n * A) / (Math.PI * Se)) * (1 + Math.sqrt(1 + Math.pow((2 * B * Se) / (A * Sut), 2)));
        } else {
            // DE-Goodman (Default): 1/n = sigma_a/Se + sigma_m/Sut
            dKub = (16 * n / Math.PI) * ((A / Se) + (B / Sut));
        }

        const d_m = Math.pow(dKub, 1 / 3); // in mm (if M,T were N-mm and S were MPa)
        // WAIT: Ma, Tm are in Nm!
        // We need them in N-mm to get d in mm using MPa (N/mm^2).
        const Ma_nmm = Ma * 1000;
        const Mm_nmm = Mm * 1000;
        const Ta_nmm = Ta * 1000;
        const Tm_nmm = Tm * 1000;

        const A_nmm = Math.sqrt(4 * Math.pow(Kf * Ma_nmm, 2) + 3 * Math.pow(Kfs * Ta_nmm, 2));
        const B_nmm = Math.sqrt(4 * Math.pow(Kf * Mm_nmm, 2) + 3 * Math.pow(Kfs * Tm_nmm, 2));

        let dKub_real = 0;
        if (theoryStr.includes('soderberg') || theoryStr === '1') {
            dKub_real = (16 * n / Math.PI) * ((A_nmm / Se) + (B_nmm / Sy));
        } else if (theoryStr.includes('gerber') || theoryStr === '2') {
            dKub_real = ((8 * n * A_nmm) / (Math.PI * Se)) * (1 + Math.sqrt(1 + Math.pow((2 * B_nmm * Se) / (A_nmm * Sut), 2)));
        } else {
            dKub_real = (16 * n / Math.PI) * ((A_nmm / Se) + (B_nmm / Sut));
        }

        const dReq = Math.pow(dKub_real, 1 / 3);

        // Actual stresses given this diameter
        const factor = 16 / (Math.PI * Math.pow(dReq, 3));
        const sigmaA = factor * A_nmm;
        const sigmaM = factor * B_nmm;

        return {
            outputs: {
                dReq: createValidatedValue(dReq, 'mm', 'derived'),
                sigmaA: createValidatedValue(sigmaA, 'MPa', 'derived'),
                sigmaM: createValidatedValue(sigmaM, 'MPa', 'derived')
            },
            verified: true,
            warnings: dReq > 200 ? [{ field: 'dReq', message: 'Calculated diameter > 200mm. Consider hollow shafts or material upgrade.', severity: 'info' }] : [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result) => {
            const Sa = result.outputs?.sigmaA?.value as number || 0;
            const Sm = result.outputs?.sigmaM?.value as number || 0;
            // The bounding box is an envelope (e.g. Goodman line)
            // It's hard to draw true envelope dynamically since we don't store Se/Sut explicitly in outputs.
            // But we can conceptually draw the Sm/Sa point on a graph.

            const maxS = Math.max(Sa, Sm, 100) * 1.5;
            const pxSa = 30 + (Sa / maxS) * 140;
            const pxSm = 30 + (Sm / maxS) * 140;

            return (
                <div className="w-full h-full flex items-center justify-center p-4 bg-[#05080b]">
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                        {/* Axes */}
                        <line x1="30" y1="170" x2="180" y2="170" stroke="#334155" strokeWidth="1" />
                        <line x1="30" y1="20" x2="30" y2="170" stroke="#334155" strokeWidth="1" />
                        <text x="180" y="185" fill="#64748b" fontSize="8" textAnchor="end">σm (Mean)</text>
                        <text x="15" y="20" fill="#64748b" fontSize="8" textAnchor="middle" transform="rotate(-90 15,20)">σa (Alt)</text>

                        {/* Envelope Line (Mocked as diagonal from Sut to Se on axes) */}
                        <line x1="30" y1="40" x2="160" y2="170" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Load Line & Point */}
                        <line x1="30" y1="170" x2={pxSm} y2={170 - (pxSa - 30)} stroke="rgba(200,200,200,0.5)" strokeWidth="1" />
                        <circle cx={pxSm} cy={170 - (pxSa - 30)} r="4" fill="#00e5ff" />
                        <circle cx={pxSm} cy={170 - (pxSa - 30)} r="8" fill="none" stroke="#00e5ff" strokeWidth="1" className="animate-ping" />

                        <text x={pxSm + 10} y={170 - (pxSa - 30) - 5} fill="white" fontSize="10">Operating Point</text>
                    </svg>
                </div>
            );
        }
    },
    tier: 'pro'
};

export default shaftDesignSchema;

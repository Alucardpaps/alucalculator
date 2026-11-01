import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';
import { SpringBlueprint } from '@/components/visualizers/SpringBlueprint';
import { calculateHelicalSpring } from '@/data/mechanical/springStandards';

export const springDesignSchema: CalculatorSchemaV2 = {
    id: 'spring-design',
    metadata: {
        title: 'Helical Spring Design',
        description: 'Design of helical compression springs including Wahl Factor, Shear Stress, and Deflection.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCAD OS',
        lastUpdated: '2026-02-12',
        tags: ['spring', 'helical', 'wahl factor', 'stiffness', 'deflection', 'machine elements'],
        verifiedStandards: ['Shigley\'s Mechanical Engineering Design']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Helical compression spring under static or low-cycle loading.', impact: 'medium' },
            { id: 'a2', text: 'Linear elastic material behavior strictly.', impact: 'high' }
        ],
        standards: [
            { code: 'DIN 2089', title: 'Helical compression springs out of round wire and rod' }
        ],
        formulaLatex: '\\tau = K_W \\frac{8 F D}{\\pi d^3} \\quad , \\quad \delta = \\frac{8 F D^3 N_a}{G d^4} \\quad , \\quad K_W = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}'
    },
    inputs: [
        { key: 'F', label: 'Applied Axial Force (F)', unit: 'N', defaultValue: 500, description: 'Axial load applied to the spring', validation: { required: true, min: 0 } },
        { key: 'd', label: 'Wire Diameter (d)', unit: 'mm', defaultValue: 5, description: 'Diameter of the spring wire', validation: { required: true, min: 0.1 } },
        { key: 'D', label: 'Mean Coil Diameter (D)', unit: 'mm', defaultValue: 40, description: 'Mean diameter of the spring coil (OD - d)', validation: { required: true, min: 1 } },
        { key: 'Na', label: 'Active Coils (Na)', unit: '-', defaultValue: 10, description: 'Number of active coils', validation: { required: true, min: 1 } },
        { key: 'G', label: 'Shear Modulus (G)', unit: 'GPa', defaultValue: 79.3, description: 'Shear Modulus of the spring material (e.g. 79.3 GPa for Steel)', validation: { required: true, min: 10 } },
        { key: 'Sy', label: 'Yield Strength in Shear (Ssy)', unit: 'MPa', defaultValue: 600, description: 'Torsional yield strength bounds check', validation: { required: true, min: 10 } }
    ],
    outputs: [
        { key: 'C', label: 'Spring Index (C)', unit: '-', description: 'Ratio of Mean Coil Dia to Wire Dia (D/d)', precision: 2, formulaLatex: 'C = D / d' },
        { key: 'Kw', label: 'Wahl Factor (Kw)', unit: '-', description: 'Stress correction factor for curvature', precision: 3, formulaLatex: 'K_W = \\frac{4C-1}{4C-4} + \\frac{0.615}{C}' },
        { key: 'tau', label: 'Shear Stress (τ)', unit: 'MPa', description: 'Maximum shear stress at the inner fiber', precision: 1, formulaLatex: '\\tau = K_W \\frac{8 F D}{\\pi d^3}' },
        { key: 'delta', label: 'Deflection (δ)', unit: 'mm', description: 'Axial deflection of the spring', precision: 2, formulaLatex: '\\delta = \\frac{8 F D^3 N_a}{G d^4}' },
        { key: 'k', label: 'Spring Rate (k)', unit: 'N/mm' as any, description: 'Stiffness of the spring (F/δ)', precision: 2, formulaLatex: 'k = \\frac{G d^4}{8 D^3 N_a}' },
        { key: 'SF', label: 'Safety Factor (SF)', unit: '-', description: 'Ratio of yield strength to max shear stress (Ssy/τ)', precision: 2, formulaLatex: 'SF = S_{sy} / \\tau' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const F = Number(inputs.F.value);
        const d = Number(inputs.d.value);
        const D = Number(inputs.D.value);
        const Na = Number(inputs.Na.value);
        const G_GPa = Number(inputs.G.value);
        const Ssy = Number(inputs.Sy.value);

        const G_MPa = G_GPa * 1000;

        // 1. Spring Index
        const C = D / d;

        // 2. Wahl Factor
        let Kw = 1.0;
        if (C > 1) {
            Kw = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);
        } else {
            // Unrealistic practically (C < 3 is very hard to manufacture), handle gracefully
            Kw = Number.MAX_VALUE;
        }

        // 3. Max Shear Stress
        const tau = Kw * ((8 * F * D) / (Math.PI * Math.pow(d, 3)));

        // 4. Deflection
        const delta = (8 * F * Math.pow(D, 3) * Na) / (G_MPa * Math.pow(d, 4));

        // 5. Spring Rate (Stiffness)
        const k = (G_MPa * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * Na);

        const SF = tau > 0 ? Ssy / tau : 0;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (C < 4 || C > 12) {
            warnings.push({ field: 'C', message: 'Spring index (C) should ideally be between 4 and 12 for manufacturability.', severity: 'warning' });
        }

        if (tau > Ssy) {
            warnings.push({ field: 'tau', message: `Maximum shear stress (${tau.toFixed(1)} MPa) exceeds the specified yield strength (${Ssy} MPa). Permanent set will occur!`, severity: 'critical' });
        }

        return {
            outputs: {
                C: createValidatedValue(C, '-', 'derived'),
                Kw: createValidatedValue(Kw, '-', 'derived'),
                tau: createValidatedValue(tau, 'MPa', 'derived'),
                delta: createValidatedValue(delta, 'mm', 'derived'),
                k: createValidatedValue(k, 'N/mm' as any, 'derived'),
                SF: createValidatedValue(SF, '-', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: any) => {
            const F = Number(inputs?.F?.value ?? inputs?.F ?? 500);
            const d = Number(inputs?.d?.value ?? inputs?.d ?? 5);
            const D = Number(inputs?.D?.value ?? inputs?.D ?? 40);
            const Na = Number(inputs?.Na?.value ?? inputs?.Na ?? 10);
            const springRes = calculateHelicalSpring({
                wireDiameter: d,
                meanDiameter: D,
                freeLength: Math.max(d * 4, D * 2.2),
                activeCoils: Na,
                endType: 'squared_ground',
                appliedForce1: Math.round(F * 0.25),
                appliedForce2: F,
                materialId: 'en10270-1-sh',
            });

            return (
                <div className="w-full h-full min-h-[380px] bg-[var(--bg-0)] rounded-xl overflow-hidden p-2">
                    <SpringBlueprint spring={springRes} appliedForce={F} showLegend={true} />
                </div>
            );
        }
    },
    tier: 'pro'
};

export default springDesignSchema;


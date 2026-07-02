import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const flywheelDesignSchema: CalculatorSchemaV2 = {
    id: 'flywheel-design',
    metadata: {
        title: 'Flywheel Design & Energy',
        description: 'Sizing, mass, mass moment of inertia, energy capacity, and hoop stress limits for solid or rimmed flywheels.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['flywheel', 'inertia', 'kinetic energy', 'hoop stress', 'fluctuation', 'machine elements'],
        verifiedStandards: ['Shigley\'s Mechanical Engineering Design']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Thin rim approximation for hoop stress calculations.', impact: 'medium' },
            { id: 'a2', text: 'Homogeneous material properties without void defects.', impact: 'high' }
        ],
        standards: [
            { code: 'Stress Analysis', title: 'Roark\'s Formulas for Stress and Strain, Ch. 16' }
        ],
        formulaLatex: 'J = \\frac{1}{8} M (D_o^2 + D_i^2) \\quad , \\quad E = \\frac{1}{2} J \\omega^2 \\quad , \\quad \\sigma_{\\theta} = \\rho \\omega^2 \\left(\\frac{D_o}{2}\\right)^2'
    },
    inputs: [
        { key: 'Do', label: 'Outer Diameter (Do)', unit: 'mm', defaultValue: 600, description: 'Outer diameter of the flywheel rim', validation: { required: true, min: 50, max: 5000 } },
        { key: 'Di', label: 'Inner Diameter (Di)', unit: 'mm', defaultValue: 400, description: 'Inner diameter of the rim (set to 0 for solid disk)', validation: { required: true, min: 0, max: 4900 } },
        { key: 'b', label: 'Rim Width (b)', unit: 'mm', defaultValue: 100, description: 'Axial thickness of the flywheel rim', validation: { required: true, min: 5, max: 2000 } },
        { key: 'n', label: 'Nominal Speed (n)', unit: 'rpm', defaultValue: 1500, description: 'Rotational speed of the flywheel', validation: { required: true, min: 1, max: 20000 } },
        {
            key: 'material',
            label: 'Flywheel Material',
            unit: '-',
            defaultValue: 'steel',
            description: 'Material density and yield strength limits',
            options: [
                { label: 'Structural Steel (density: 7850, yield: 250 MPa)', value: 'steel' },
                { label: 'Cast Iron (density: 7200, yield: 150 MPa)', value: 'castiron' },
                { label: 'Aluminum 6061-T6 (density: 2700, yield: 276 MPa)', value: 'aluminum' }
            ],
            validation: { required: true }
        },
        { key: 'Cs', label: 'Coefficient of Fluctuation (Cs)', unit: '-', defaultValue: 0.05, description: 'Allowed speed fluctuation (typically 0.01 - 0.20)', validation: { required: true, min: 0.001, max: 0.50 } }
    ],
    outputs: [
        { key: 'M', label: 'Flywheel Mass (M)', unit: 'kg', description: 'Calculated physical mass of the rim', precision: 1, formulaLatex: 'M = \\rho \\cdot \\frac{\\pi}{4}(D_o^2 - D_i^2) \\cdot b' },
        { key: 'J', label: 'Inertia (J)', unit: 'kg·m²' as any, description: 'Mass moment of inertia', precision: 3, formulaLatex: 'J = \\frac{1}{8} M (D_o^2 + D_i^2)' },
        { key: 'E', label: 'Kinetic Energy (E)', unit: 'kJ', description: 'Stored kinetic energy at nominal speed', precision: 2, formulaLatex: 'E = \\frac{1}{2} J \\omega^2' },
        { key: 'dE', label: 'Energy Capacity (ΔE)', unit: 'kJ', description: 'Usable energy capacity within fluctuation speed limits', precision: 2, formulaLatex: '\\Delta E = J \\omega^2 C_s' },
        { key: 'sigma', label: 'Hoop Stress (σθ)', unit: 'MPa', description: 'Centrifugal tensile hoop stress at the rim outer fiber', precision: 1, formulaLatex: '\\sigma_\\theta = \\rho \\omega^2 R_o^2' },
        { key: 'SF', label: 'Safety Factor (SF)', unit: '-', description: 'Ratio of yield strength to calculated hoop stress', precision: 2, formulaLatex: 'SF = S_y / \\sigma_\\theta' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const Do = Number(inputs.Do.value) / 1000; // convert to meters
        const Di = Number(inputs.Di.value) / 1000;
        const b = Number(inputs.b.value) / 1000;
        const n = Number(inputs.n.value);
        const Cs = Number(inputs.Cs.value);
        const mat = String(inputs.material.value);

        // Density & Yield limits
        let rho = 7850; // kg/m3
        let Sy = 250; // MPa
        if (mat === 'castiron') {
            rho = 7200;
            Sy = 150;
        } else if (mat === 'aluminum') {
            rho = 2700;
            Sy = 276;
        }

        const omega = (2 * Math.PI * n) / 60; // rad/s

        // 1. Mass calculation
        const volume = (Math.PI / 4) * (Do * Do - Di * Di) * b;
        const M = volume * rho;

        // 2. Mass moment of inertia
        const J = (1 / 8) * M * (Do * Do + Di * Di);

        // 3. Kinetic Energy
        const E_J = 0.5 * J * omega * omega;
        const E_kJ = E_J / 1000;

        // 4. Usable energy fluctuation
        const dE_kJ = (J * omega * omega * Cs) / 1000;

        // 5. Centrifugal Hoop Stress (at outer radius)
        // sigma = rho * omega^2 * r_o^2 (Pa)
        const Ro = Do / 2;
        const sigma_Pa = rho * omega * omega * Ro * Ro;
        const sigma_MPa = sigma_Pa / 1000000;

        const SF = sigma_MPa > 0 ? Sy / sigma_MPa : Number.MAX_VALUE;

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        if (SF < 2.0) {
            warnings.push({
                field: 'material',
                message: `Low safety factor (${SF.toFixed(2)}). Dynamic centrifugal forces are close to material yield limits. Risk of burst failure! Reduce RPM or outer diameter, or use higher strength material.`,
                severity: 'critical'
            });
        }
        if (Di >= Do) {
            warnings.push({
                field: 'Di',
                message: `Inner diameter must be strictly less than outer diameter.`,
                severity: 'critical'
            });
        }

        return {
            outputs: {
                M: createValidatedValue(M, 'kg', 'derived'),
                J: createValidatedValue(J, 'kg·m²' as any, 'derived'),
                E: createValidatedValue(E_kJ, 'kJ', 'derived'),
                dE: createValidatedValue(dE_kJ, 'kJ', 'derived'),
                sigma: createValidatedValue(sigma_MPa, 'MPa', 'derived'),
                SF: createValidatedValue(SF, '-', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any) => {
            const out = result.outputs || {};
            const SF = (out.SF?.value as number) || 5;
            const isFailing = SF < 2.0;

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Flywheel Wheel Layout */}
                    <div className="relative w-[200px] h-[200px]">
                        <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible animate-spin" style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}>
                            {/* Outer Rim */}
                            <circle cx="100" cy="100" r="75" fill="none" stroke={isFailing ? '#ef4444' : '#10b981'} strokeWidth="15" />
                            {/* Inner web/cutout circle */}
                            <circle cx="100" cy="100" r="67" fill="none" stroke="#334155" strokeWidth="1" />
                            
                            {/* Hub */}
                            <circle cx="100" cy="100" r="20" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                            <circle cx="100" cy="100" r="6" fill="#05080b" />
                            
                            {/* 4 Spokes representing hub connect */}
                            <line x1="100" y1="25" x2="100" y2="175" stroke="#38bdf8" strokeWidth="6" />
                            <line x1="25" y1="100" x2="175" y2="100" stroke="#38bdf8" strokeWidth="6" />
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Energy Cap</div>
                            <div className="text-xl font-bold font-mono text-[#00e5ff]">
                                {((out.dE?.value as number) || 0).toFixed(2)} <span className="text-[10px] text-gray-500">kJ</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Hoop Stress</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.sigma?.value as number) || 0).toFixed(1)} <span className="text-[10px] text-gray-500">MPa</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Safety Factor</div>
                            <div className={`text-xs font-bold font-mono ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
                                {SF.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default flywheelDesignSchema;

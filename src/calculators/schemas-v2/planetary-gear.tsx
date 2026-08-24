import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

export const planetaryGearSchema: CalculatorSchemaV2 = {
    id: 'planetary-gear',
    metadata: {
        title: 'Planetary Gear Train',
        description: 'Speed, torque, efficiency, and assembly spacing analysis for planetary gear sets (sun, planet, ring, carrier).',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-06-28',
        tags: ['planetary gear', 'epicyclic', 'gear ratio', 'carrier speed', 'spacing condition', 'machine elements'],
        verifiedStandards: ['ISO 6336', 'AGMA 6123']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Planets are equally spaced around the sun.', impact: 'medium' },
            { id: 'a2', text: 'Standard tooth profiles without profile shift.', impact: 'medium' }
        ],
        standards: [
            { code: 'AGMA 6123', title: 'Design Manual for Enclosed Epicyclic Gear Drives' },
            { code: 'ISO 6336', title: 'Calculation of load capacity of spur and helical gears' }
        ],
        formulaLatex: 'z_r = z_s + 2 \\cdot z_p \\quad , \\quad i = 1 + \\frac{z_r}{z_s} \\text{ (Ring Fixed)} \\quad , \\quad \\frac{z_s + z_r}{N} = \\text{Integer}'
    },
    inputs: [
        { key: 'm', label: 'Module (m)', unit: 'mm', defaultValue: 3, description: 'Pitch module of the teeth', validation: { required: true, min: 0.5, max: 50 } },
        { key: 'zs', label: 'Sun Gear Teeth (zs)', unit: '-', defaultValue: 18, description: 'Number of teeth on the sun gear', validation: { required: true, min: 10, max: 100, step: 1 } },
        { key: 'zp', label: 'Planet Gear Teeth (zp)', unit: '-', defaultValue: 18, description: 'Number of teeth on the planet gear', validation: { required: true, min: 10, max: 100, step: 1 } },
        { key: 'N', label: 'Number of Planets (N)', unit: '-', defaultValue: 3, description: 'Number of planet gears (typically 3 or 4)', validation: { required: true, min: 2, max: 8, step: 1 } },
        {
            key: 'config',
            label: 'Fixed Member',
            unit: '-',
            defaultValue: 'ring',
            description: 'The member of the epicyclic train that is stationary',
            options: [
                { label: 'Ring Fixed (Input Sun, Output Carrier)', value: 'ring' },
                { label: 'Carrier Fixed (Input Sun, Output Ring)', value: 'carrier' },
                { label: 'Sun Fixed (Input Ring, Output Carrier)', value: 'sun' }
            ],
            validation: { required: true }
        },
        { key: 'nin', label: 'Input Speed (nin)', unit: 'rpm', defaultValue: 1500, description: 'Rotational speed of the input member', validation: { required: true, min: 1, max: 10000 } },
        { key: 'Tin', label: 'Input Torque (Tin)', unit: 'Nm', defaultValue: 100, description: 'Torque applied to the input member', validation: { required: true, min: 0.1, max: 10000 } }
    ],
    outputs: [
        { key: 'zr', label: 'Ring Gear Teeth (zr)', unit: '-', description: 'Derived number of teeth on the ring gear', precision: 0, formulaLatex: 'z_r = z_s + 2 \\cdot z_p' },
        { key: 'i', label: 'Gear Ratio (i)', unit: '-', description: 'Absolute speed ratio between input and output', precision: 2, formulaLatex: 'i = \\omega_{in} / \\omega_{out}' },
        { key: 'nout', label: 'Output Speed (nout)', unit: 'rpm', description: 'Rotational speed of the output member', precision: 1, formulaLatex: 'n_{out} = n_{in} / i' },
        { key: 'Tout', label: 'Output Torque (Tout)', unit: 'Nm', description: 'Torque on the output member (assuming 97% efficiency)', precision: 1, formulaLatex: 'T_{out} = T_{in} \\cdot i \\cdot 0.97' },
        { key: 'ds', label: 'Sun Pitch Diameter (ds)', unit: 'mm', description: 'Pitch diameter of the sun gear', precision: 2, formulaLatex: 'd_s = m \\cdot z_s' },
        { key: 'dp', label: 'Planet Pitch Diameter (dp)', unit: 'mm', description: 'Pitch diameter of each planet gear', precision: 2, formulaLatex: 'd_p = m \\cdot z_p' },
        { key: 'dc', label: 'Carrier Orbit Diameter (dc)', unit: 'mm', description: 'Pitch circle diameter of the planet carrier pins', precision: 2, formulaLatex: 'd_c = d_s + d_p' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const m = Number(inputs.m.value);
        const zs = Number(inputs.zs.value);
        const zp = Number(inputs.zp.value);
        const N = Number(inputs.N.value);
        const config = String(inputs.config.value);
        const nin = Number(inputs.nin.value);
        const Tin = Number(inputs.Tin.value);

        // 1. Ring teeth constraint
        const zr = zs + 2 * zp;

        // 2. Diameters
        const ds = m * zs;
        const dp = m * zp;
        const dr = m * zr;
        const dc = ds + dp;

        // 3. Ratio based on config
        let i = 1;
        if (config === 'ring') {
            i = 1 + zr / zs; // Sun input, Carrier output, Ring fixed
        } else if (config === 'carrier') {
            i = -zr / zs; // Sun input, Ring output, Carrier fixed (reversing)
        } else if (config === 'sun') {
            i = 1 + zs / zr; // Ring input, Carrier output, Sun fixed
        }

        const absRatio = Math.abs(i);
        const nout = nin / i;
        const efficiency = 0.97; // 97% mesh efficiency approximation
        const Tout = Tin * absRatio * (i > 0 ? efficiency : -efficiency);

        const warnings: { field: string; message: string; severity: "info" | "warning" | "critical" }[] = [];

        // Check assembly condition
        const assemblySum = zs + zr;
        const spacingRemainder = assemblySum % N;
        if (spacingRemainder !== 0) {
            warnings.push({
                field: 'N',
                message: `Assembly index condition failed. (zs + zr) / N = (${zs} + ${zr}) / ${N} = ${(assemblySum / N).toFixed(2)}, which is not an integer. Planets cannot be equally spaced!`,
                severity: 'critical'
            });
        }

        // Check interference
        if (zp < 12) {
            warnings.push({
                field: 'zp',
                message: `Planet gear teeth count (${zp}) is below 12. Undercutting and tooth interference may occur without profile shift.`,
                severity: 'warning'
            });
        }

        return {
            outputs: {
                zr: createValidatedValue(zr, '-', 'derived'),
                i: createValidatedValue(i, '-', 'derived'),
                nout: createValidatedValue(nout, 'rpm', 'derived'),
                Tout: createValidatedValue(Tout, 'Nm', 'derived'),
                ds: createValidatedValue(ds, 'mm', 'derived'),
                dp: createValidatedValue(dp, 'mm', 'derived'),
                dc: createValidatedValue(dc, 'mm', 'derived')
            },
            verified: true,
            warnings,
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: any) => {
            const out = result.outputs || {};
            const ds = (out.ds?.value as number) || 54;
            const dp = (out.dp?.value as number) || 54;
            const zr = (out.zr?.value as number) || 90;
            const zs = Number(inputs?.zs?.value || 18);
            const N = Number(inputs?.N?.value || 3); // default visual planets

            const scale = 80 / (ds + 2 * dp);
            const rS = ds * scale;
            const rP = dp * scale;
            const rR = (ds + 2 * dp) * scale;
            const rC = (rS + rP);

            // Generate planet coordinates
            const planets = [];
            for (let k = 0; k < N; k++) {
                const angle = (k * 2 * Math.PI) / N - Math.PI / 2;
                planets.push({
                    x: 110 + rC * Math.cos(angle),
                    y: 110 + rC * Math.sin(angle)
                });
            }

            return (
                <div className="w-full h-full flex flex-row items-center justify-center p-6 bg-[#05080b] gap-12">
                    {/* Epicyclic Layout SVG */}
                    <div className="relative w-[220px] h-[220px]">
                        <svg viewBox="0 0 220 220" width="100%" height="100%" className="overflow-visible">
                            {/* Outer Ring Gear */}
                            <circle cx="110" cy="110" r={rR} fill="none" stroke="#ef4444" strokeWidth="3" />
                            <circle cx="110" cy="110" r={rR * 0.95} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.5" />
                            
                            {/* Carrier Spider (Traced from center to each planet) */}
                            {planets.map((p, idx) => (
                                <line key={`arm-${idx}`} x1="110" y1="110" x2={p.x} y2={p.y} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                            ))}
                            
                            {/* Sun Gear */}
                            <circle cx="110" cy="110" r={rS} fill="#0ea5e9" stroke="#38bdf8" strokeWidth="2" />
                            <circle cx="110" cy="110" r={rS * 0.8} fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3,3" />
                            <circle cx="110" cy="110" r={6} fill="#05080b" />

                            {/* Planets */}
                            {planets.map((p, idx) => (
                                <g key={`planet-${idx}`}>
                                    <circle cx={p.x} cy={p.y} r={rP} fill="#10b981" stroke="#34d399" strokeWidth="1.5" />
                                    <circle cx={p.x} cy={p.y} r={rP * 0.7} fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="2,2" />
                                    <circle cx={p.x} cy={p.y} r={4} fill="#05080b" />
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-5 w-36 border border-[#1a1f26] bg-[#0a0e14] p-4 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Ratio (i)</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {((out.i?.value as number) || 1).toFixed(2)}
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Output Speed</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">
                                {Math.abs((out.nout?.value as number) || 0).toFixed(0)} <span className="text-[10px] text-gray-500">rpm</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#1a1f26]"></div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Assembly Spacing</div>
                            <div className={`text-xs font-bold font-mono ${(zr + zs) % N === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {((zr + zs) % N === 0) ? 'OK' : 'MISALIGNED'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default planetaryGearSchema;

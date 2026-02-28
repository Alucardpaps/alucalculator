import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue, type CalculationResult } from '@/types/engineering';

export const hookesLaw3dSchema: CalculatorSchemaV2 = {
    id: 'hookes-law-3d',
    metadata: {
        title: "3D Hooke's Law & Bulk Modulus",
        description: 'Triaxial stress-strain relationships, volumetric analysis.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-25',
        tags: ['stress', 'strain', 'hooke', 'bulk', 'mechanics', 'poisson'],
        verifiedStandards: ['Linear Elasticity']
    },
    documentation: {
        assumptions: [
            { id: 'linear-elastic', text: 'Material is linear, elastic, isotropic, and homogeneous.', impact: 'high' },
            { id: 'small-strain', text: 'Strains are small (eng. strain).', impact: 'medium' }
        ],
        standards: [],
        formulaLatex: '\\epsilon_x = \\frac{1}{E} [\\sigma_x - \\nu(\\sigma_y + \\sigma_z)]'
    },
    inputs: [
        {
            key: 'E',
            label: 'Young\'s Modulus (E)',
            unit: 'GPa' as any,
            defaultValue: 200,
            description: 'Elastic Modulus (e.g., 200 for Steel)',
            validation: { required: true, min: 1 }
        },
        {
            key: 'nu',
            label: 'Poisson\'s Ratio (ν)',
            unit: '-' as any,
            defaultValue: 0.3,
            description: 'Lateral strain ratio (0 < ν < 0.5)',
            validation: { required: true, min: 0.01, max: 0.499 }
        },
        {
            key: 'sigmaX',
            label: 'Normal Stress (σx)',
            unit: 'MPa' as any,
            defaultValue: 100,
            description: 'Stress in X direction',
            validation: { required: true }
        },
        {
            key: 'sigmaY',
            label: 'Normal Stress (σy)',
            unit: 'MPa' as any,
            defaultValue: 50,
            description: 'Stress in Y direction',
            validation: { required: true }
        },
        {
            key: 'sigmaZ',
            label: 'Normal Stress (σz)',
            unit: 'MPa' as any,
            defaultValue: 0,
            description: 'Stress in Z direction',
            validation: { required: true }
        },
        {
            key: 'L0',
            label: 'Initial Cube Edge (L₀)',
            unit: 'mm' as any,
            defaultValue: 100,
            description: 'Initial dimension of an idealized cube',
            validation: { required: true, min: 1 }
        }
    ],
    outputs: [
        { key: 'epsX', label: 'Strain X (εx)', unit: 'uStrain' as any, description: 'Microstrain in X', formulaLatex: '\\epsilon_x' },
        { key: 'epsY', label: 'Strain Y (εy)', unit: 'uStrain' as any, description: 'Microstrain in Y', formulaLatex: '\\epsilon_y' },
        { key: 'epsZ', label: 'Strain Z (εz)', unit: 'uStrain' as any, description: 'Microstrain in Z', formulaLatex: '\\epsilon_z' },
        { key: 'epsV', label: 'Volumetric Strain (εv)', unit: 'uStrain' as any, description: 'Dilatation (sum of normal strains)', formulaLatex: '\\epsilon_v' },
        { key: 'K', label: 'Bulk Modulus (K)', unit: 'GPa' as any, description: 'Resistance to uniform compression', formulaLatex: 'K' },
        { key: 'G', label: 'Shear Modulus (G)', unit: 'GPa' as any, description: 'Modulus of rigidity', formulaLatex: 'G' },
        { key: 'deltaV', label: 'Volume Change (ΔV)', unit: 'mm3' as any, description: 'Change in cube volume', formulaLatex: '\\Delta V' }
    ],
    calculationEngine: (inputs) => {
        const E_MPa = Number(inputs.E.value) * 1000;
        const nu = Number(inputs.nu.value);
        const sx = Number(inputs.sigmaX.value);
        const sy = Number(inputs.sigmaY.value);
        const sz = Number(inputs.sigmaZ.value);
        const L0 = Number(inputs.L0.value);

        // Generalized Hooke's Law for Isotropic material
        const epsX = (1 / E_MPa) * (sx - nu * (sy + sz));
        const epsY = (1 / E_MPa) * (sy - nu * (sx + sz));
        const epsZ = (1 / E_MPa) * (sz - nu * (sx + sy));

        const epsV = epsX + epsY + epsZ;

        const E_GPa = Number(inputs.E.value);
        const K = E_GPa / (3 * (1 - 2 * nu));
        const G = E_GPa / (2 * (1 + nu));

        const V0 = Math.pow(L0, 3);
        const deltaV = V0 * epsV;

        return {
            outputs: {
                epsX: createValidatedValue(epsX * 1e6, 'uStrain' as any, 'derived'),
                epsY: createValidatedValue(epsY * 1e6, 'uStrain' as any, 'derived'),
                epsZ: createValidatedValue(epsZ * 1e6, 'uStrain' as any, 'derived'),
                epsV: createValidatedValue(epsV * 1e6, 'uStrain' as any, 'derived'),
                K: createValidatedValue(K, 'GPa' as any, 'derived'),
                G: createValidatedValue(G, 'GPa' as any, 'derived'),
                deltaV: createValidatedValue(deltaV, 'mm3' as any, 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: CalculationResult, inputs: Record<string, any>) => {
            if (!result || !result.outputs) return null;

            const sx = Number(inputs.sigmaX?.value || 0);
            const sy = Number(inputs.sigmaY?.value || 0);
            const sz = Number(inputs.sigmaZ?.value || 0);

            const ex = Number(result.outputs.epsX.value) / 1e6;
            const ey = Number(result.outputs.epsY.value) / 1e6;
            const ez = Number(result.outputs.epsZ.value) / 1e6;
            const ev = Number(result.outputs.epsV.value) / 1e6;

            // Base Cube Isometric Projection
            const cx = 200;
            const cy = 200;
            const size = 60; // base px size

            // Strain scale factor (exaggerated for visibility)
            const maxAbsStrain = Math.max(Math.abs(ex), Math.abs(ey), Math.abs(ez), 1e-6);
            const dispScale = 15 / maxAbsStrain;

            const dX = ex * dispScale;
            const dY = ey * dispScale;
            const dZ = ez * dispScale;

            // Isometric projection angles
            const aX = Math.PI / 6; // 30 deg
            const aY = Math.PI / 2; // 90 deg down
            const aZ = Math.PI * 5 / 6; // 150 deg

            const map3D = (x: number, y: number, z: number) => {
                // X points bottom right, Y points straight up (negative Y in SVG is up), Z points bottom left
                const isoX = cx + x * Math.cos(aX) + z * Math.cos(aZ);
                const isoY = cy - y - x * Math.sin(aX) - z * Math.sin(aZ);
                return { x: isoX, y: isoY };
            };

            const drawCube = (szX: number, szY: number, szZ: number, stroke: string, fill: string, dash: string = '') => {
                const s = size / 2;
                const p000 = map3D(-szX, -szY, -szZ);
                const p100 = map3D(szX, -szY, -szZ);
                const p110 = map3D(szX, szY, -szZ);
                const p010 = map3D(-szX, szY, -szZ);
                const p001 = map3D(-szX, -szY, szZ);
                const p101 = map3D(szX, -szY, szZ);
                const p111 = map3D(szX, szY, szZ);
                const p011 = map3D(-szX, szY, szZ);

                return (
                    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash}>
                        {/* Back faces (dashed normally, but ignoring hidden line removal for simplicity) */}
                        <polygon points={`${p000.x},${p000.y} ${p100.x},${p100.y} ${p110.x},${p110.y} ${p010.x},${p010.y}`} />
                        <polygon points={`${p000.x},${p000.y} ${p010.x},${p010.y} ${p011.x},${p011.y} ${p001.x},${p001.y}`} />
                        <polygon points={`${p000.x},${p000.y} ${p100.x},${p100.y} ${p101.x},${p101.y} ${p001.x},${p001.y}`} />

                        {/* Front Faces */}
                        <polygon points={`${p100.x},${p100.y} ${p101.x},${p101.y} ${p111.x},${p111.y} ${p110.x},${p110.y}`} fillOpacity="0.8" />
                        <polygon points={`${p010.x},${p010.y} ${p110.x},${p110.y} ${p111.x},${p111.y} ${p011.x},${p011.y}`} fillOpacity="0.9" />
                        <polygon points={`${p001.x},${p001.y} ${p101.x},${p101.y} ${p111.x},${p111.y} ${p011.x},${p011.y}`} fillOpacity="0.7" />
                    </g>
                );
            };

            const StressForce = ({ axis, val, pos }: { axis: 'X' | 'Y' | 'Z', val: number, pos: any }) => {
                if (val === 0) return null;
                const isTen = val > 0;
                let color = isTen ? '#ef4444' : '#3b82f6';
                let vecX = 0, vecY = 0, vecZ = 0;

                const len = 30;
                if (axis === 'X') vecX = isTen ? len : -len;
                if (axis === 'Y') vecY = isTen ? len : -len;
                if (axis === 'Z') vecZ = isTen ? len : -len;

                const start = map3D(pos.x, pos.y, pos.z);
                const end = map3D(pos.x + vecX, pos.y + vecY, pos.z + vecZ);

                return (
                    <g>
                        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx={end.x} cy={end.y} r="3" fill={color} />
                    </g>
                );
            };

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="flex gap-4 w-full justify-between items-center mb-4">
                        <div className="flex-1 bg-black/40 rounded p-2 text-cyan-400 font-mono text-xs border border-cyan-900/30">
                            <div>εx: {(ex * 1e6).toFixed(0)} με</div>
                            <div>εy: {(ey * 1e6).toFixed(0)} με</div>
                            <div>εz: {(ez * 1e6).toFixed(0)} με</div>
                        </div>
                        <div className="flex-1 bg-black/40 rounded p-2 text-fuchsia-400 font-mono text-xs border border-fuchsia-900/30 text-right">
                            <div className="font-bold">Dilatation (εv)</div>
                            <div className="text-lg">{(ev * 1e6).toFixed(0)} με</div>
                        </div>
                    </div>

                    <svg viewBox="0 0 400 350" className="w-full h-full drop-shadow-2xl">
                        {/* Base element (dashed) */}
                        {drawCube(size / 2, size / 2, size / 2, '#475569', 'none', '3 3')}

                        {/* Deformed element */}
                        {drawCube(size / 2 + dX, size / 2 + dY, size / 2 + dZ, '#0ea5e9', 'rgba(14, 165, 233, 0.15)')}

                        {/* Stresses applied to Faces */}
                        {/* X faces */}
                        <StressForce axis="X" val={sx} pos={{ x: size / 2 + dX, y: 0, z: 0 }} />
                        {/* Y faces */}
                        <StressForce axis="Y" val={sy} pos={{ x: 0, y: size / 2 + dY, z: 0 }} />
                        {/* Z faces */}
                        <StressForce axis="Z" val={sz} pos={{ x: 0, y: 0, z: size / 2 + dZ }} />

                        {/* Force magnitude labels */}
                        <g fill="#94a3b8" fontSize="10" fontFamily="monospace">
                            <text x="320" y="30" fill="#ef4444">Red = Tension</text>
                            <text x="320" y="45" fill="#3b82f6">Blue = Compres.</text>

                            <text x="20" y="320">Volumetric Change: {ev > 0 ? 'Expansion (+)' : 'Contraction (-)'}</text>
                        </g>

                    </svg>
                </div>
            );
        }
    },
    tier: 'free'
};

export default hookesLaw3dSchema;

import React from 'react';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';
import { createValidatedValue } from '@/types/engineering';

// Van der Waals constants. 
// a (L^2*bar/mol^2), b (L/mol)
const GAS_DATA: Record<string, { name: string, a: number, b: number }> = {
    'He': { name: 'Helium', a: 0.0346, b: 0.0238 },
    'N2': { name: 'Nitrogen', a: 1.370, b: 0.0387 },
    'O2': { name: 'Oxygen', a: 1.382, b: 0.0318 },
    'CO2': { name: 'Carbon Dioxide', a: 3.658, b: 0.0429 },
    'H2O': { name: 'Water Vapor', a: 5.536, b: 0.0305 },
    'NH3': { name: 'Ammonia', a: 4.225, b: 0.0371 },
    'CH4': { name: 'Methane', a: 2.303, b: 0.0431 }
};

export const gasLawsSchema: CalculatorSchemaV2 = {
    id: 'gas-laws',
    metadata: {
        title: 'Ideal & Real Gas Laws',
        description: 'Computes pressure using Ideal Gas Law and Van der Waals equation.',
        category: 'mechanical',
        version: '1.0.0',
        author: 'AluCalc OS',
        lastUpdated: '2026-02-12',
        tags: ['thermodynamics', 'gas', 'ideal', 'van-der-waals', 'pressure'],
        verifiedStandards: ['NIST reference data for Van der Waals parameters']
    },
    documentation: {
        assumptions: [
            { id: 'a1', text: 'Uses R = 0.083144626 L·bar/(K·mol) for Van der Waals parameters.', impact: 'medium' }
        ],
        standards: [
            { code: 'NVDW', title: 'Table of Van der Waals Constants' }
        ],
        formulaLatex: 'P_{id} = \\frac{nRT}{V}, \\quad P_{real} = \\frac{nRT}{V - nb} - a\\left(\\frac{n}{V}\\right)^2'
    },
    inputs: [
        { key: 'T', label: 'Temperature (T)', unit: 'K', defaultValue: 298.15, description: 'Absolute Temperature', validation: { required: true, min: 1 } },
        { key: 'V', label: 'Volume (V)', unit: 'L' as any, defaultValue: 10, description: 'Volume in Liters', validation: { required: true, min: 0.001 } },
        { key: 'n', label: 'Moles (n)', unit: 'mol' as any, defaultValue: 1, description: 'Amount of substance', validation: { required: true, min: 0.0001 } },
        { key: 'a', label: 'VDW Constant a', unit: '-' as any, defaultValue: 1.370, description: 'L^2*bar/mol^2', validation: { required: true, min: 0 } },
        { key: 'b', label: 'VDW Constant b', unit: '-' as any, defaultValue: 0.0387, description: 'L/mol', validation: { required: true, min: 0 } }
    ],
    outputs: [
        { key: 'P_ideal', label: 'Ideal Pressure', unit: 'bar' as any, description: 'Pressure calculated by Ideal Gas Law', precision: 3, formulaLatex: 'P_{id}' },
        { key: 'P_real', label: 'Real Pressure', unit: 'bar' as any, description: 'Pressure calculated by Van der Waals Eq', precision: 3, formulaLatex: 'P_{real}' },
        { key: 'Z', label: 'Compressibility Factor', unit: '-', description: 'Z = P_real * V / (nRT)', precision: 3, formulaLatex: 'Z' }
    ],
    calculationEngine: (inputs: Record<string, any>) => {
        const T = Number(inputs.T.value);
        const V = Number(inputs.V.value); // Liters
        const n = Number(inputs.n.value);
        const a = Number(inputs.a.value);
        const b = Number(inputs.b.value);

        const R = 0.083144626; // L*bar/(K*mol)

        const P_ideal = (n * R * T) / V;
        const P_real = ((n * R * T) / (V - n * b)) - (a * Math.pow(n / V, 2));

        const Z = (P_real * V) / (n * R * T);

        return {
            outputs: {
                P_ideal: createValidatedValue(P_ideal, 'bar' as any, 'derived'),
                P_real: createValidatedValue(P_real, 'bar' as any, 'derived'),
                Z: createValidatedValue(Z, '-', 'derived')
            },
            verified: true,
            warnings: [],
            timestamp: Date.now()
        };
    },
    visualization: {
        type: 'svg-parametric',
        render: (result: any, inputs: Record<string, any>) => {
            const P_ideal = result?.outputs?.P_ideal?.value || 0;
            const P_real = result?.outputs?.P_real?.value || 0;

            const maxP = Math.max(P_ideal, P_real, 1);
            const hId = (P_ideal / maxP) * 100;
            const hReal = (P_real / maxP) * 100;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#05080b]">
                    <div className="text-white/60 mb-8 font-mono text-sm tracking-widest uppercase">
                        Gas State Pressure (Bar)
                    </div>
                    {/* Bar Chart comparing P_id and P_real */}
                    <div className="flex gap-8 items-end h-48 border-b-2 border-white/20 pb-2 w-64 justify-center">
                        <div className="flex flex-col items-center w-20 group">
                            <div className="text-[#a855f7] font-mono text-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {P_ideal.toFixed(2)}
                            </div>
                            <div
                                className="w-full bg-gradient-to-t from-[#7e22ce] to-[#d8b4fe] rounded-t transition-all duration-500 relative overflow-hidden"
                                style={{ height: `${hId}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                            </div>
                            <div className="mt-4 text-[#d8b4fe] text-xs font-bold uppercase tracking-wider">Ideal</div>
                        </div>

                        <div className="flex flex-col items-center w-20 group">
                            <div className="text-[#3b82f6] font-mono text-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {P_real.toFixed(2)}
                            </div>
                            <div
                                className="w-full bg-gradient-to-t from-[#1d4ed8] to-[#93c5fd] rounded-t transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                style={{ height: `${hReal}%` }}
                            >
                                <div className="absolute inset-0 bg-white/10" style={{ boxShadow: 'inset 0 10px 10px rgba(255,255,255,0.5)' }}></div>
                            </div>
                            <div className="mt-4 text-[#93c5fd] text-xs font-bold uppercase tracking-wider">Van der Waals</div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    tier: 'free'
};

export default gasLawsSchema;

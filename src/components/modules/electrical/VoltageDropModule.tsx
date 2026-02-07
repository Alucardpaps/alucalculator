'use client';

import { useState, useMemo } from 'react';

// Voltage Drop Calculator for electrical cables
const CONDUCTOR_MATERIALS = [
    { name: 'Copper', resistivity: 0.0172 }, // Ω·mm²/m at 20°C
    { name: 'Aluminum', resistivity: 0.0282 },
];

const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

export default function VoltageDropModule() {
    const [voltage, setVoltage] = useState(230); // V
    const [current, setCurrent] = useState(20); // A
    const [length, setLength] = useState(50); // m (one-way)
    const [crossSection, setCrossSection] = useState(4); // mm²
    const [phases, setPhases] = useState<1 | 3>(1);
    const [materialIdx, setMaterialIdx] = useState(0);
    const [powerFactor, setPowerFactor] = useState(0.85);

    const material = CONDUCTOR_MATERIALS[materialIdx];

    const results = useMemo(() => {
        const rho = material.resistivity;
        const L = length;
        const A = crossSection;
        const I = current;
        const cosφ = powerFactor;

        // Cable resistance (round trip for single phase, factor for 3-phase)
        const factor = phases === 1 ? 2 : Math.sqrt(3);
        const R = (rho * L * factor) / A;

        // Voltage drop
        const Vd = I * R * cosφ;
        const VdPercent = (Vd / voltage) * 100;

        // Power loss
        const Ploss = I * I * R;

        // Recommended max drop (3% for lighting, 5% for power)
        const status = VdPercent <= 3 ? 'excellent' : VdPercent <= 5 ? 'acceptable' : 'excessive';

        // Minimum recommended size for <3% drop
        const minSize = (rho * L * factor * I * cosφ) / (voltage * 0.03);
        const recommendedSize = CABLE_SIZES.find(s => s >= minSize) || CABLE_SIZES[CABLE_SIZES.length - 1];

        return { R, Vd, VdPercent, Ploss, status, recommendedSize };
    }, [voltage, current, length, crossSection, phases, material, powerFactor]);

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Phase Selection */}
            <div className="flex gap-2">
                {([1, 3] as const).map(p => (
                    <button key={p} onClick={() => setPhases(p)}
                        className="flex-1 py-2 rounded text-xs font-bold transition-all"
                        style={{
                            backgroundColor: phases === p ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: phases === p ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {p === 1 ? '1-Phase (230V)' : '3-Phase (400V)'}
                    </button>
                ))}
            </div>

            {/* Material Selection */}
            <div className="flex gap-2">
                {CONDUCTOR_MATERIALS.map((m, i) => (
                    <button key={m.name} onClick={() => setMaterialIdx(i)}
                        className="flex-1 py-1.5 rounded text-[10px] font-medium transition-all"
                        style={{
                            backgroundColor: materialIdx === i ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: materialIdx === i ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {m.name}
                    </button>
                ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-2">
                <InputField label="Voltage (V)" value={voltage} onChange={setVoltage} />
                <InputField label="Current (A)" value={current} onChange={setCurrent} />
                <InputField label="Length (m)" value={length} onChange={setLength} />
                <div>
                    <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>Cross Section</label>
                    <select value={crossSection} onChange={e => setCrossSection(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded text-xs"
                        style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                    >
                        {CABLE_SIZES.map(s => <option key={s} value={s}>{s} mm²</option>)}
                    </select>
                </div>
                <InputField label="Power Factor" value={powerFactor} onChange={setPowerFactor} step={0.01} />
            </div>

            {/* SVG Cable Diagram */}
            <div className="rounded-lg p-2 flex justify-center" style={{ backgroundColor: 'var(--color-os-canvas)' }}>
                <svg viewBox="0 0 180 50" className="w-full h-12">
                    <rect x="10" y="20" width="30" height="20" fill="var(--color-os-header)" stroke="var(--color-os-border)" rx="2" />
                    <text x="25" y="33" textAnchor="middle" fontSize="8" fill="var(--color-os-text-primary)">Source</text>
                    <line x1="40" y1="25" x2="140" y2="25" stroke="var(--color-os-accent)" strokeWidth="3" />
                    <line x1="40" y1="35" x2="140" y2="35" stroke="var(--color-os-warning)" strokeWidth="3" />
                    <rect x="140" y="20" width="30" height="20" fill="var(--color-os-header)" stroke="var(--color-os-border)" rx="2" />
                    <text x="155" y="33" textAnchor="middle" fontSize="8" fill="var(--color-os-text-primary)">Load</text>
                    <text x="90" y="15" textAnchor="middle" fontSize="7" fill="var(--color-os-text-secondary)">{length}m × {crossSection}mm²</text>
                </svg>
            </div>

            {/* Results */}
            <div
                className="p-3 rounded-lg grid grid-cols-2 gap-2"
                style={{
                    backgroundColor: 'var(--color-os-header)',
                    border: `1px solid ${results.status === 'excellent' ? 'var(--color-os-success)' : results.status === 'acceptable' ? 'var(--color-os-warning)' : 'var(--color-os-danger)'}`
                }}
            >
                <ResultBlock label="Voltage Drop" value={`${results.Vd.toFixed(2)} V`} big />
                <ResultBlock
                    label="Drop %"
                    value={`${results.VdPercent.toFixed(2)}%`}
                    big
                    color={results.status === 'excellent' ? 'var(--color-os-success)' : results.status === 'acceptable' ? 'var(--color-os-warning)' : 'var(--color-os-danger)'}
                />
                <ResultBlock label="Cable Resistance" value={`${results.R.toFixed(3)} Ω`} />
                <ResultBlock label="Power Loss" value={`${results.Ploss.toFixed(1)} W`} />
                <ResultBlock label="Recommended Size" value={`≥ ${results.recommendedSize} mm²`} />
                <ResultBlock label="Status" value={results.status.toUpperCase()} color={results.status === 'excellent' ? 'var(--color-os-success)' : results.status === 'acceptable' ? 'var(--color-os-warning)' : 'var(--color-os-danger)'} />
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
    return (
        <div>
            <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} step={step}
                className="w-full px-2 py-1.5 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
            />
        </div>
    );
}

function ResultBlock({ label, value, big, color }: { label: string; value: string; big?: boolean; color?: string }) {
    return (
        <div className="text-center">
            <div className="text-[9px] uppercase" style={{ color: 'var(--color-os-text-secondary)' }}>{label}</div>
            <div className={`font-mono font-bold ${big ? 'text-lg' : 'text-sm'}`} style={{ color: color || 'var(--color-os-text-primary)' }}>{value}</div>
        </div>
    );
}

'use client';

import { useState, useMemo } from 'react';

/**
 * OhmsLawModule - Electrical calculator with circuit diagram
 */
export default function OhmsLawModule() {
    const [mode, setMode] = useState<'V' | 'I' | 'R' | 'P'>('V');
    const [voltage, setVoltage] = useState(12);
    const [current, setCurrent] = useState(2);
    const [resistance, setResistance] = useState(6);
    const [power, setPower] = useState(24);

    // Auto-calculate missing value
    const calculated = useMemo(() => {
        let V = voltage, I = current, R = resistance, P = power;

        switch (mode) {
            case 'V': // Calculate Voltage
                V = I * R;
                P = V * I;
                break;
            case 'I': // Calculate Current
                I = V / R;
                P = V * I;
                break;
            case 'R': // Calculate Resistance
                R = V / I;
                P = V * I;
                break;
            case 'P': // Calculate Power
                P = V * I;
                break;
        }

        return { V, I, R, P };
    }, [mode, voltage, current, resistance, power]);

    const updateAndCalc = (field: 'V' | 'I' | 'R', value: number) => {
        if (field === 'V') setVoltage(value);
        if (field === 'I') setCurrent(value);
        if (field === 'R') setResistance(value);
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Circuit Diagram */}
            <div
                className="rounded-lg p-4 flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-os-canvas)' }}
            >
                <svg viewBox="0 0 200 120" className="w-full h-24">
                    {/* Battery */}
                    <line x1="30" y1="40" x2="30" y2="80" stroke="var(--color-os-accent)" strokeWidth="2" />
                    <line x1="25" y1="50" x2="35" y2="50" stroke="var(--color-os-accent)" strokeWidth="3" />
                    <line x1="22" y1="60" x2="38" y2="60" stroke="var(--color-os-accent)" strokeWidth="1" />
                    <line x1="25" y1="70" x2="35" y2="70" stroke="var(--color-os-accent)" strokeWidth="3" />
                    <text x="30" y="95" textAnchor="middle" fill="var(--color-os-accent)" fontSize="10">{calculated.V.toFixed(1)}V</text>

                    {/* Wires */}
                    <line x1="30" y1="40" x2="100" y2="40" stroke="var(--color-os-text-primary)" strokeWidth="2" />
                    <line x1="100" y1="40" x2="170" y2="40" stroke="var(--color-os-text-primary)" strokeWidth="2" />
                    <line x1="170" y1="40" x2="170" y2="80" stroke="var(--color-os-text-primary)" strokeWidth="2" />
                    <line x1="170" y1="80" x2="30" y2="80" stroke="var(--color-os-text-primary)" strokeWidth="2" />

                    {/* Resistor */}
                    <path d="M 130,40 L 135,35 L 140,45 L 145,35 L 150,45 L 155,35 L 160,45 L 165,40"
                        fill="none" stroke="var(--color-os-warning)" strokeWidth="2" />
                    <text x="147" y="25" textAnchor="middle" fill="var(--color-os-warning)" fontSize="10">{calculated.R.toFixed(1)}Ω</text>

                    {/* Current arrow */}
                    <polygon points="70,40 75,35 75,37 90,37 90,43 75,43 75,45" fill="var(--color-os-success)" />
                    <text x="80" y="30" textAnchor="middle" fill="var(--color-os-success)" fontSize="10">{calculated.I.toFixed(2)}A</text>
                </svg>
            </div>

            {/* Mode Selection */}
            <div className="flex gap-1">
                {(['V', 'I', 'R', 'P'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className="flex-1 py-2 rounded text-xs font-bold transition-all"
                        style={{
                            backgroundColor: mode === m ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: mode === m ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        Calculate {m}
                    </button>
                ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
                {mode !== 'V' && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                            Voltage (V)
                        </label>
                        <input
                            type="number"
                            value={voltage}
                            onChange={e => updateAndCalc('V', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded text-sm font-mono"
                            style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                        />
                    </div>
                )}
                {mode !== 'I' && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                            Current (A)
                        </label>
                        <input
                            type="number"
                            value={current}
                            onChange={e => updateAndCalc('I', Number(e.target.value))}
                            step={0.1}
                            className="w-full px-3 py-2 rounded text-sm font-mono"
                            style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                        />
                    </div>
                )}
                {mode !== 'R' && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                            Resistance (Ω)
                        </label>
                        <input
                            type="number"
                            value={resistance}
                            onChange={e => updateAndCalc('R', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded text-sm font-mono"
                            style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                        />
                    </div>
                )}
            </div>

            {/* Result */}
            <div
                className="mt-auto p-4 rounded-lg text-center"
                style={{ backgroundColor: 'var(--color-os-header)', border: '1px solid var(--color-os-accent)' }}
            >
                <div className="text-[10px] uppercase mb-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    {mode === 'V' && 'Calculated Voltage'}
                    {mode === 'I' && 'Calculated Current'}
                    {mode === 'R' && 'Calculated Resistance'}
                    {mode === 'P' && 'Calculated Power'}
                </div>
                <div className="text-3xl font-mono font-bold" style={{ color: 'var(--color-os-accent)' }}>
                    {mode === 'V' && `${calculated.V.toFixed(2)} V`}
                    {mode === 'I' && `${calculated.I.toFixed(3)} A`}
                    {mode === 'R' && `${calculated.R.toFixed(2)} Ω`}
                    {mode === 'P' && `${calculated.P.toFixed(2)} W`}
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--color-os-text-secondary)' }}>
                    Power: {calculated.P.toFixed(2)} W
                </div>
            </div>
        </div>
    );
}

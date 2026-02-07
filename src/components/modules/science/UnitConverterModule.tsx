'use client';

import { useState, useMemo } from 'react';

type Category = 'length' | 'mass' | 'temperature' | 'pressure';

const CONVERSIONS: Record<Category, { units: string[]; base: string; factors: Record<string, number> }> = {
    length: {
        units: ['mm', 'cm', 'm', 'in', 'ft'],
        base: 'm',
        factors: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 }
    },
    mass: {
        units: ['g', 'kg', 'lb', 'oz'],
        base: 'kg',
        factors: { g: 0.001, kg: 1, lb: 0.453592, oz: 0.0283495 }
    },
    temperature: {
        units: ['°C', '°F', 'K'],
        base: '°C',
        factors: { '°C': 1, '°F': 1, 'K': 1 }
    },
    pressure: {
        units: ['Pa', 'kPa', 'bar', 'psi', 'atm'],
        base: 'Pa',
        factors: { Pa: 1, kPa: 1000, bar: 100000, psi: 6894.76, atm: 101325 }
    }
};

function convertValue(val: number, from: string, to: string, cat: Category): number {
    if (cat === 'temperature') {
        let celsius: number;
        if (from === '°C') celsius = val;
        else if (from === '°F') celsius = (val - 32) * 5 / 9;
        else celsius = val - 273.15;

        if (to === '°C') return celsius;
        else if (to === '°F') return celsius * 9 / 5 + 32;
        else return celsius + 273.15;
    }
    const factors = CONVERSIONS[cat].factors;
    return val * factors[from] / factors[to];
}

export default function UnitConverterModule() {
    const [category, setCategory] = useState<Category>('length');
    const [value, setValue] = useState(1);
    const [fromUnit, setFromUnit] = useState('m');
    const [toUnit, setToUnit] = useState('mm');

    const config = CONVERSIONS[category];

    const handleCategoryChange = (cat: Category) => {
        setCategory(cat);
        const newConfig = CONVERSIONS[cat];
        setFromUnit(newConfig.units[0]);
        setToUnit(newConfig.units[1]);
        setValue(1);
    };

    const result = useMemo(() =>
        convertValue(value, fromUnit, toUnit, category),
        [value, fromUnit, toUnit, category]
    );

    const quickRefs = useMemo(() =>
        config.units.filter(u => u !== fromUnit).slice(0, 4).map(u => ({
            unit: u,
            value: convertValue(value, fromUnit, u, category)
        })),
        [value, fromUnit, category, config.units]
    );

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex gap-2">
                {(Object.keys(CONVERSIONS) as Category[]).map(cat => (
                    <button key={cat} onClick={() => handleCategoryChange(cat)}
                        className="flex-1 py-2 px-2 rounded text-[10px] font-medium uppercase transition-all"
                        style={{
                            backgroundColor: category === cat ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                            color: category === cat ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input type="number" value={value} onChange={e => setValue(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded text-sm font-mono"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                />
                <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
                    className="w-20 px-2 py-2 rounded text-sm"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                >
                    {config.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            <div className="text-center" style={{ color: 'var(--color-os-accent)' }}>↓</div>

            <div className="flex gap-2">
                <input type="text" value={result.toFixed(6).replace(/\.?0+$/, '')} readOnly
                    className="flex-1 px-3 py-2 rounded text-sm font-mono"
                    style={{ backgroundColor: 'var(--color-os-panel)', color: 'var(--color-os-accent)', border: '1px solid var(--color-os-accent)' }}
                />
                <select value={toUnit} onChange={e => setToUnit(e.target.value)}
                    className="w-20 px-2 py-2 rounded text-sm"
                    style={{ backgroundColor: 'var(--color-os-header)', color: 'var(--color-os-text-primary)', border: '1px solid var(--color-os-border)' }}
                >
                    {config.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            <div className="mt-auto p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--color-os-header)' }}>
                <div className="mb-2 font-bold" style={{ color: 'var(--color-os-text-secondary)' }}>Quick Reference</div>
                <div className="grid grid-cols-2 gap-1" style={{ color: 'var(--color-os-text-secondary)' }}>
                    {quickRefs.map(({ unit, value: v }) => (
                        <div key={unit}>
                            <span className="font-mono" style={{ color: 'var(--color-os-text-primary)' }}>
                                {v.toFixed(4).replace(/\.?0+$/, '')}
                            </span> {unit}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


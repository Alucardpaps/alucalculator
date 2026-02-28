'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type Category = 'length' | 'mass' | 'temperature' | 'pressure' | 'force' | 'torque' | 'area' | 'volume' | 'velocity' | 'flow';

const CONVERSIONS: Record<Category, { units: string[]; base: string; factors: Record<string, number> }> = {
    length: {
        units: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'µm'],
        base: 'm',
        factors: { µm: 1e-6, mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 }
    },
    mass: {
        units: ['mg', 'g', 'kg', 't', 'lb', 'oz', 'grain'],
        base: 'kg',
        factors: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, lb: 0.453592, oz: 0.0283495, grain: 6.47989e-5 }
    },
    temperature: {
        units: ['°C', '°F', 'K'],
        base: '°C',
        factors: { '°C': 1, '°F': 1, 'K': 1 }
    },
    pressure: {
        units: ['Pa', 'kPa', 'MPa', 'GPa', 'bar', 'mbar', 'psi', 'ksi', 'atm', 'mmHg', 'inHg'],
        base: 'Pa',
        factors: { Pa: 1, kPa: 1000, MPa: 1e6, GPa: 1e9, bar: 100000, mbar: 100, psi: 6894.76, ksi: 6894760, atm: 101325, mmHg: 133.322, inHg: 3386.39 }
    },
    force: {
        units: ['N', 'kN', 'MN', 'lbf', 'kgf', 'dyn', 'kip'],
        base: 'N',
        factors: { N: 1, kN: 1000, MN: 1e6, lbf: 4.44822, kgf: 9.80665, dyn: 1e-5, kip: 4448.22 }
    },
    torque: {
        units: ['N·m', 'kN·m', 'N·mm', 'lbf·ft', 'lbf·in', 'kgf·m', 'kgf·cm'],
        base: 'N·m',
        factors: { 'N·m': 1, 'kN·m': 1000, 'N·mm': 0.001, 'lbf·ft': 1.35582, 'lbf·in': 0.112985, 'kgf·m': 9.80665, 'kgf·cm': 0.0980665 }
    },
    area: {
        units: ['mm²', 'cm²', 'm²', 'km²', 'in²', 'ft²', 'acre', 'ha'],
        base: 'm²',
        factors: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1, 'km²': 1e6, 'in²': 6.4516e-4, 'ft²': 0.092903, acre: 4046.86, ha: 10000 }
    },
    volume: {
        units: ['mm³', 'cm³', 'mL', 'L', 'm³', 'in³', 'ft³', 'gal(US)', 'gal(UK)'],
        base: 'm³',
        factors: { 'mm³': 1e-9, 'cm³': 1e-6, mL: 1e-6, L: 0.001, 'm³': 1, 'in³': 1.63871e-5, 'ft³': 0.0283168, 'gal(US)': 0.00378541, 'gal(UK)': 0.00454609 }
    },
    velocity: {
        units: ['m/s', 'km/h', 'ft/s', 'mph', 'knot', 'mm/s'],
        base: 'm/s',
        factors: { 'm/s': 1, 'km/h': 0.277778, 'ft/s': 0.3048, mph: 0.44704, knot: 0.514444, 'mm/s': 0.001 }
    },
    flow: {
        units: ['m³/s', 'L/min', 'L/s', 'gpm(US)', 'm³/h', 'ft³/min(CFM)'],
        base: 'm³/s',
        factors: { 'm³/s': 1, 'L/min': 1.66667e-5, 'L/s': 0.001, 'gpm(US)': 6.30902e-5, 'm³/h': 2.77778e-4, 'ft³/min(CFM)': 4.71947e-4 }
    }
};

const CATEGORY_LABELS: Record<Category, string> = {
    length: 'Length', mass: 'Mass', temperature: 'Temp',
    pressure: 'Pressure', force: 'Force', torque: 'Torque',
    area: 'Area', volume: 'Volume', velocity: 'Speed', flow: 'Flow'
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

    // Swap units
    const handleSwap = () => {
        const tmp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(tmp);
    };

    // Show all conversions from the input value
    const allConversions = useMemo(() =>
        config.units.filter(u => u !== fromUnit).map(u => ({
            unit: u,
            value: convertValue(value, fromUnit, u, category)
        })),
        [value, fromUnit, category, config.units]
    );

    const formatNum = (v: number): string => {
        if (v === 0) return '0';
        if (Math.abs(v) >= 1e9 || Math.abs(v) < 1e-6) return v.toExponential(4);
        const s = v.toPrecision(8);
        return parseFloat(s).toString();
    };

    return (
        <div className="flex flex-col gap-3 h-full select-none">
            {/* Category Switcher — 2 rows of 5 */}
            <div className="grid grid-cols-5 gap-1">
                {(Object.keys(CONVERSIONS) as Category[]).map(cat => (
                    <button key={cat} onClick={() => handleCategoryChange(cat)}
                        className={`py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all
                            ${category === cat
                                ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Input Section */}
            <div className="space-y-1.5">
                <div className="flex items-center bg-[#05070a] rounded-xl border border-white/5 overflow-hidden group focus-within:border-cyan-500/30 transition-colors">
                    <input
                        type="number"
                        value={value}
                        onChange={e => setValue(Number(e.target.value))}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-black font-mono text-white outline-none"
                    />
                    <div className="h-4 w-[1px] bg-white/10" />
                    <select
                        value={fromUnit}
                        onChange={e => setFromUnit(e.target.value)}
                        className="bg-transparent px-2 py-2 text-[10px] font-bold text-slate-400 outline-none w-[80px] cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        {config.units.map(u => <option key={u} value={u} className="bg-[#0a0e14]">{u}</option>)}
                    </select>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-0.5">
                    <button onClick={handleSwap} className="text-cyan-500/40 hover:text-cyan-400 transition-colors text-lg">
                        ⇅
                    </button>
                </div>

                <div className="flex items-center bg-cyan-950/20 rounded-xl border border-cyan-500/20 overflow-hidden group focus-within:border-cyan-500/40 transition-colors">
                    <input
                        type="text"
                        value={formatNum(result)}
                        readOnly
                        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-black font-mono text-cyan-400 outline-none"
                    />
                    <div className="h-4 w-[1px] bg-cyan-500/20" />
                    <select
                        value={toUnit}
                        onChange={e => setToUnit(e.target.value)}
                        className="bg-transparent px-2 py-2 text-[10px] font-bold text-cyan-300 outline-none w-[80px] cursor-pointer hover:bg-cyan-500/10 transition-colors"
                    >
                        {config.units.map(u => <option key={u} value={u} className="bg-[#0a0e14]">{u}</option>)}
                    </select>
                </div>
            </div>

            {/* All Conversions Reference */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-2 text-[8px] font-black uppercase tracking-[1.5px] text-slate-500 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-cyan-500/40" />
                    All Conversions
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                    {allConversions.map(({ unit, value: v }) => (
                        <button
                            key={unit}
                            onClick={() => setToUnit(unit)}
                            className={`flex flex-col min-w-0 overflow-hidden text-left rounded-lg px-1.5 py-1 transition-colors ${toUnit === unit ? 'bg-cyan-500/10' : 'hover:bg-white/5'}`}
                        >
                            <span className="text-[11px] font-black font-mono text-slate-200 truncate">
                                {formatNum(v)}
                            </span>
                            <span className={`text-[8px] font-bold uppercase truncate ${toUnit === unit ? 'text-cyan-400' : 'text-slate-500'}`}>{unit}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Hexagon, Activity } from 'lucide-react';

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
    length: 'Length', mass: 'Mass', temperature: 'Temperature',
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
    };

    const result = useMemo(() => convertValue(value || 0, fromUnit, toUnit, category), [value, fromUnit, toUnit, category]);

    const handleSwap = () => {
        const tmp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(tmp);
    };

    const allConversions = useMemo(() =>
        config.units.filter(u => u !== fromUnit).map(u => ({
            unit: u, value: convertValue(value || 0, fromUnit, u, category)
        })),
        [value, fromUnit, category, config.units]
    );

    const formatNum = (v: number): string => {
        if (v === 0) return '0';
        if (Math.abs(v) >= 1e9 || Math.abs(v) < 1e-6) return v.toExponential(4);
        return parseFloat(v.toPrecision(8)).toString();
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#03060a] overflow-hidden select-none relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#03060a] to-[#03060a] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[url('/noise.png')] mix-blend-overlay opacity-5 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
                
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                <Activity className="text-cyan-400" size={20} />
                            </div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">Dimension Engine</h1>
                        </div>
                        <p className="text-slate-500 text-xs mt-2 ml-14 font-mono tracking-widest">ISO / ANSI Conversion Protocol Active</p>
                    </div>
                </header>

                {/* Categories */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(CONVERSIONS) as Category[]).map(cat => (
                            <button key={cat} onClick={() => handleCategoryChange(cat)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all
                                    ${category === cat
                                        ? 'bg-cyan-500 text-[#03060a] shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105'
                                        : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {CATEGORY_LABELS[cat]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                    
                    {/* Main Interaction Area */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* FROM BOX */}
                        <motion.div layout className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 flex flex-col relative overflow-hidden group focus-within:border-slate-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-9xl font-black -translate-y-10 translate-x-4">
                                {fromUnit}
                            </div>
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Input Magnitude</label>
                            <div className="flex items-end gap-4 relative z-10">
                                <input
                                    type="number"
                                    value={value}
                                    onChange={e => setValue(Number(e.target.value))}
                                    className="bg-transparent text-5xl md:text-7xl font-black tracking-tighter text-white outline-none w-full placeholder:text-slate-800"
                                    placeholder="0"
                                />
                                <select
                                    value={fromUnit}
                                    onChange={e => setFromUnit(e.target.value)}
                                    className="bg-slate-900/50 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl text-lg font-bold text-slate-300 outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                                >
                                    {config.units.map(u => <option key={u} value={u} className="bg-[#0a0e14]">{u}</option>)}
                                </select>
                            </div>
                        </motion.div>

                        {/* SWAP BUTTON */}
                        <div className="flex justify-center -my-6 relative z-20">
                            <button onClick={handleSwap} className="w-14 h-14 rounded-full bg-[#03060a] border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
                                <ArrowRightLeft size={20} />
                            </button>
                        </div>

                        {/* TO BOX */}
                        <motion.div layout className="bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] p-8 flex flex-col relative overflow-hidden group focus-within:border-cyan-400/50 transition-colors">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none text-9xl font-black -translate-y-10 translate-x-4 text-cyan-500">
                                {toUnit}
                            </div>
                            <label className="text-xs font-mono text-cyan-600 uppercase tracking-widest mb-4">Converted Output</label>
                            <div className="flex items-end gap-4 relative z-10">
                                <input
                                    type="text"
                                    value={formatNum(result)}
                                    readOnly
                                    className="bg-transparent text-5xl md:text-7xl font-black tracking-tighter text-cyan-400 outline-none w-full"
                                />
                                <select
                                    value={toUnit}
                                    onChange={e => setToUnit(e.target.value)}
                                    className="bg-cyan-950/50 backdrop-blur-md border border-cyan-500/20 px-4 py-3 rounded-xl text-lg font-bold text-cyan-300 outline-none cursor-pointer hover:bg-cyan-900 transition-colors"
                                >
                                    {config.units.map(u => <option key={u} value={u} className="bg-[#0a0e14]">{u}</option>)}
                                </select>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel: All Results Matrix */}
                    <div className="w-full lg:w-80 bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            Relational Matrix
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 relative z-10">
                            <AnimatePresence mode="popLayout">
                                {allConversions.map(({ unit, value: v }) => (
                                    <motion.button
                                        key={unit}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => setToUnit(unit)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                                            ${toUnit === unit 
                                                ? 'bg-cyan-500/10 border-cyan-500/30' 
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                                    >
                                        <div className="flex flex-col text-left overflow-hidden">
                                            <span className={`text-lg font-black font-mono truncate ${toUnit === unit ? 'text-cyan-400' : 'text-slate-300'}`}>
                                                {formatNum(v)}
                                            </span>
                                        </div>
                                        <div className={`text-xs font-bold uppercase ${toUnit === unit ? 'text-cyan-500' : 'text-slate-500'}`}>
                                            {unit}
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

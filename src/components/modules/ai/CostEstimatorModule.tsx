'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Package, Clock, Wrench, TrendingUp, ChevronDown, Plus, Trash2, RotateCcw, Settings } from 'lucide-react';
import { usePersistedState } from '@/hooks/useUserPreferences';
import { useI18nStore } from '@/store/i18nStore';

// ──── PRICE DATABASE ────
const MATERIAL_PRICES: Record<string, { label: string; pricePerKg: number; density: number }> = {
    'alu_6061': { label: 'Aluminum 6061-T6', pricePerKg: 4.50, density: 2.71 },
    'alu_5052': { label: 'Aluminum 5052', pricePerKg: 4.20, density: 2.68 },
    'alu_7075': { label: 'Aluminum 7075-T6', pricePerKg: 7.80, density: 2.81 },
    'steel_mild': { label: 'Mild Steel (S235)', pricePerKg: 0.85, density: 7.85 },
    'steel_ss304': { label: 'Stainless 304', pricePerKg: 3.20, density: 8.00 },
    'steel_ss316': { label: 'Stainless 316L', pricePerKg: 4.50, density: 8.00 },
    'brass_360': { label: 'Brass C360', pricePerKg: 5.90, density: 8.50 },
    'copper': { label: 'Copper C110', pricePerKg: 9.20, density: 8.96 },
    'titanium': { label: 'Titanium Ti-6Al-4V', pricePerKg: 35.00, density: 4.43 },
};

const PROCESS_RATES: Record<string, { label: string; ratePerHour: number; setupMin: number }> = {
    'laser': { label: 'Laser Cutting', ratePerHour: 120, setupMin: 15 },
    'cnc_mill': { label: 'CNC Milling', ratePerHour: 95, setupMin: 30 },
    'cnc_lathe': { label: 'CNC Turning', ratePerHour: 85, setupMin: 20 },
    'waterjet': { label: 'Waterjet Cutting', ratePerHour: 100, setupMin: 10 },
    'bend': { label: 'Press Brake', ratePerHour: 65, setupMin: 10 },
    'weld_mig': { label: 'MIG Welding', ratePerHour: 75, setupMin: 15 },
    'weld_tig': { label: 'TIG Welding', ratePerHour: 95, setupMin: 20 },
    'assembly': { label: 'Assembly', ratePerHour: 55, setupMin: 5 },
    'finish': { label: 'Surface Finish', ratePerHour: 60, setupMin: 10 },
};

interface PartLine {
    id: string;
    name: string;
    material: string;
    massKg: number;
    qty: number;
}

interface OpLine {
    id: string;
    process: string;
    timeMin: number;
    qty: number;
}

export default function CostEstimatorModule({ lang, dict }: { lang: string; dict: any }) {
    const { t } = useI18nStore();

    // Parts
    const [parts, setParts] = useState<PartLine[]>([
        { id: 'p1', name: 'Base Plate', material: 'alu_6061', massKg: 2.5, qty: 1 },
        { id: 'p2', name: 'Side Bracket', material: 'steel_mild', massKg: 0.8, qty: 2 },
    ]);

    // Operations
    const [operations, setOps] = useState<OpLine[]>([
        { id: 'o1', process: 'laser', timeMin: 12, qty: 1 },
        { id: 'o2', process: 'bend', timeMin: 8, qty: 2 },
    ]);

    // Config
    const [overheadPct, setOverheadPct] = usePersistedState('costOverheadPct' as any, 15);
    const [marginPct, setMarginPct] = usePersistedState('costMarginPct' as any, 20);
    const [batchSize, setBatchSize] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    // Calculations
    const costs = useMemo(() => {
        const materialCost = parts.reduce((sum, p) => {
            const mat = MATERIAL_PRICES[p.material];
            return sum + (mat ? mat.pricePerKg * p.massKg * p.qty : 0);
        }, 0);

        let laborCost = 0;
        let setupCost = 0;
        operations.forEach(op => {
            const proc = PROCESS_RATES[op.process];
            if (proc) {
                laborCost += (proc.ratePerHour / 60) * op.timeMin * op.qty;
                setupCost += (proc.ratePerHour / 60) * proc.setupMin; // Setup once per batch
            }
        });

        // Setup amortized over batch
        const setupPerUnit = setupCost / Math.max(1, batchSize);

        const subtotal = materialCost + laborCost + setupPerUnit;
        const overhead = subtotal * (overheadPct / 100);
        const totalCost = subtotal + overhead;
        const margin = totalCost * (marginPct / 100);
        const unitPrice = totalCost + margin;
        const batchTotal = unitPrice * batchSize;

        const totalMass = parts.reduce((s, p) => s + p.massKg * p.qty, 0);
        const totalTime = operations.reduce((s, o) => s + o.timeMin * o.qty, 0);

        return { materialCost, laborCost, setupPerUnit, overhead, totalCost, margin, unitPrice, batchTotal, totalMass, totalTime };
    }, [parts, operations, overheadPct, marginPct, batchSize]);

    const addPart = () => setParts(p => [...p, { id: `p${Date.now()}`, name: `Part ${p.length + 1}`, material: 'alu_6061', massKg: 1, qty: 1 }]);
    const addOp = () => setOps(o => [...o, { id: `o${Date.now()}`, process: 'laser', timeMin: 10, qty: 1 }]);
    const removePart = (id: string) => setParts(p => p.filter(x => x.id !== id));
    const removeOp = (id: string) => setOps(o => o.filter(x => x.id !== id));
    const updatePart = (id: string, field: keyof PartLine, value: any) =>
        setParts(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
    const updateOp = (id: string, field: keyof OpLine, value: any) =>
        setOps(o => o.map(x => x.id === id ? { ...x, [field]: value } : x));

    const reset = () => {
        setParts([{ id: 'p1', name: 'Base Plate', material: 'alu_6061', massKg: 2.5, qty: 1 }]);
        setOps([{ id: 'o1', process: 'laser', timeMin: 12, qty: 1 }]);
    };

    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar select-none text-slate-200">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <DollarSign size={14} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-white">{t.costTitle}</h2>
                        <p className="text-[8px] text-gray-500">{t.costDesc}</p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <Settings size={13} />
                    </button>
                    <button onClick={reset} className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all">
                        <RotateCcw size={13} />
                    </button>
                </div>
            </div>

            {/* SETTINGS */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div>
                                <label className="text-[8px] text-gray-500 uppercase font-bold">{t.costOverhead}</label>
                                <input type="number" value={overheadPct} onChange={e => setOverheadPct(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono text-center outline-none focus:border-emerald-500/40"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] text-gray-500 uppercase font-bold">{t.costMargin}</label>
                                <input type="number" value={marginPct} onChange={e => setMarginPct(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono text-center outline-none focus:border-emerald-500/40"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] text-gray-500 uppercase font-bold">{t.costBatch}</label>
                                <input type="number" value={batchSize} onChange={e => setBatchSize(Math.max(1, Number(e.target.value)))} min={1}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono text-center outline-none focus:border-emerald-500/40"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PARTS TABLE */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                        <Package size={10} className="text-blue-400" /> {t.costBom}
                    </h3>
                    <button onClick={addPart} className="flex items-center gap-1 text-[8px] text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Plus size={10} /> Add
                    </button>
                </div>
                <div className="space-y-1">
                    {parts.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-lg p-1.5">
                            <input value={p.name} onChange={e => updatePart(p.id, 'name', e.target.value)}
                                className="flex-1 bg-transparent text-[10px] text-white outline-none min-w-0 font-medium px-1" placeholder="Name"
                            />
                            <select value={p.material} onChange={e => updatePart(p.id, 'material', e.target.value)}
                                className="bg-black/30 text-[9px] text-gray-300 border border-white/5 rounded px-1 py-0.5 outline-none cursor-pointer w-20 truncate"
                            >
                                {Object.entries(MATERIAL_PRICES).map(([k, v]) => (
                                    <option key={k} value={k} className="bg-[#0a0e14]">{v.label.split(' ')[0]}</option>
                                ))}
                            </select>
                            <input type="number" value={p.massKg} onChange={e => updatePart(p.id, 'massKg', Number(e.target.value))} step="0.1"
                                className="w-12 bg-black/30 border border-white/5 rounded text-[10px] text-white font-mono text-center outline-none px-1 py-0.5"
                            />
                            <span className="text-[8px] text-gray-600">kg</span>
                            <input type="number" value={p.qty} onChange={e => updatePart(p.id, 'qty', Math.max(1, Number(e.target.value)))} min={1}
                                className="w-8 bg-black/30 border border-white/5 rounded text-[10px] text-white font-mono text-center outline-none px-1 py-0.5"
                            />
                            <span className="text-[8px] text-gray-600">×</span>
                            <span className="text-[10px] font-mono text-emerald-400 w-14 text-right">
                                ${((MATERIAL_PRICES[p.material]?.pricePerKg || 0) * p.massKg * p.qty).toFixed(2)}
                            </span>
                            <button onClick={() => removePart(p.id)} className="text-gray-600 hover:text-red-400 transition-colors p-0.5">
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* OPERATIONS TABLE */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                        <Wrench size={10} className="text-amber-400" /> {t.costOps}
                    </h3>
                    <button onClick={addOp} className="flex items-center gap-1 text-[8px] text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Plus size={10} /> Add
                    </button>
                </div>
                <div className="space-y-1">
                    {operations.map(o => (
                        <div key={o.id} className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-lg p-1.5">
                            <select value={o.process} onChange={e => updateOp(o.id, 'process', e.target.value)}
                                className="flex-1 bg-black/30 text-[10px] text-gray-300 border border-white/5 rounded px-1.5 py-0.5 outline-none cursor-pointer min-w-0"
                            >
                                {Object.entries(PROCESS_RATES).map(([k, v]) => (
                                    <option key={k} value={k} className="bg-[#0a0e14]">{v.label}</option>
                                ))}
                            </select>
                            <input type="number" value={o.timeMin} onChange={e => updateOp(o.id, 'timeMin', Number(e.target.value))}
                                className="w-12 bg-black/30 border border-white/5 rounded text-[10px] text-white font-mono text-center outline-none px-1 py-0.5"
                            />
                            <span className="text-[8px] text-gray-600">min</span>
                            <input type="number" value={o.qty} onChange={e => updateOp(o.id, 'qty', Math.max(1, Number(e.target.value)))} min={1}
                                className="w-8 bg-black/30 border border-white/5 rounded text-[10px] text-white font-mono text-center outline-none px-1 py-0.5"
                            />
                            <span className="text-[8px] text-gray-600">×</span>
                            <span className="text-[10px] font-mono text-amber-400 w-14 text-right">
                                ${((PROCESS_RATES[o.process]?.ratePerHour || 0) / 60 * o.timeMin * o.qty).toFixed(2)}
                            </span>
                            <button onClick={() => removeOp(o.id)} className="text-gray-600 hover:text-red-400 transition-colors p-0.5">
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* COST BREAKDOWN */}
            <div className="mt-auto rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <div className="p-3 space-y-1.5">
                    <CostRow label="Material Cost" value={costs.materialCost} icon={<Package size={10} className="text-blue-400" />} />
                    <CostRow label="Labor Cost" value={costs.laborCost} icon={<Clock size={10} className="text-amber-400" />} />
                    <CostRow label="Setup (amortized)" value={costs.setupPerUnit} icon={<Settings size={10} className="text-gray-400" />} />
                    <CostRow label={`${t.costOverhead.replace('%', '')} (${overheadPct}%)`} value={costs.overhead} />

                    <div className="border-t border-white/5 border-dashed pt-1.5">
                        <CostRow label={t.costTotal} value={costs.totalCost} bold />
                    </div>
                    <CostRow label={`${t.costMargin.replace('%', '')} (${marginPct}%)`} value={costs.margin} icon={<TrendingUp size={10} className="text-emerald-400" />} />
                </div>

                {/* FINAL PRICE */}
                <div className="bg-emerald-500/10 border-t border-emerald-500/20 p-3">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/60">{t.costUnit}</div>
                            <div className="text-2xl font-black font-mono text-emerald-400 leading-none mt-0.5">
                                ${costs.unitPrice.toFixed(2)}
                            </div>
                        </div>
                        {batchSize > 1 && (
                            <div className="text-right">
                                <div className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Batch ({batchSize}×)</div>
                                <div className="text-sm font-bold font-mono text-white">${costs.batchTotal.toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 mt-2 pt-2 border-t border-emerald-500/10">
                        <span className="text-[9px] text-gray-500">Mass: <span className="text-white font-mono">{costs.totalMass.toFixed(2)} kg</span></span>
                        <span className="text-[9px] text-gray-500">Time: <span className="text-white font-mono">{costs.totalTime} min</span></span>
                        <span className="text-[9px] text-gray-500">$/kg: <span className="text-white font-mono">${(costs.unitPrice / Math.max(0.01, costs.totalMass)).toFixed(2)}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CostRow({ label, value, icon, bold }: { label: string; value: number; icon?: React.ReactNode; bold?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className={`flex items-center gap-1.5 text-[10px] ${bold ? 'text-white font-bold' : 'text-gray-400'}`}>
                {icon} {label}
            </span>
            <span className={`font-mono text-[11px] ${bold ? 'text-white font-bold' : 'text-gray-300'}`}>
                ${value.toFixed(2)}
            </span>
        </div>
    );
}

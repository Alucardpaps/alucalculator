'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Settings, Zap, Wrench, Droplets,
    CircleSlash, Ruler, Layers, Search, Info,
    BookOpen, ExternalLink, Activity, ArrowRight,
    CheckCircle2, Gauge, Scale, Cpu, Grid, Play, Thermometer
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useOSStore } from '@/store/osStore';

// Modules for inline rendering
import { BearingsModule } from '@/components/modules/mechanical/BearingsModule';
import { GearsModule } from '@/components/modules/mechanical/GearsModule';
import { FastenersModule } from '@/components/modules/mechanical/FastenersModule';
import ThermalExpansionModule from '@/components/modules/mechanical/ThermalExpansionModule';

// Real Engineering Data
import { BEARING_CATALOG, calculateBearingLife, BearingData } from '@/data/skfBearings';
import { FASTENERS_DB, Fastener } from '@/data/fastenersData';
import { GEAR_MATERIALS, GearMaterial } from '@/data/gearsData';
import { ELECTRODE_CATALOG } from '@/data/weldingData';
import { MATERIALS_DB, FITS_DB } from '@/data/materialsData';

const PUMP_CATALOG = [
    { model: 'CPP-32-160', type: 'Centrifugal', maxFlow: 25, maxHead: 35, efficiency: 72, power: 4 },
    { model: 'CPP-40-200', type: 'Centrifugal', maxFlow: 45, maxHead: 55, efficiency: 75, power: 7.5 },
    { model: 'CPP-50-250', type: 'Centrifugal', maxFlow: 75, maxHead: 80, efficiency: 78, power: 15 },
    { model: 'CPP-65-315', type: 'Centrifugal', maxFlow: 120, maxHead: 110, efficiency: 80, power: 30 },
    { model: 'CPP-80-400', type: 'Centrifugal', maxFlow: 200, maxHead: 140, efficiency: 82, power: 75 },
    { model: 'MDP-15', type: 'Magnetic Drive', maxFlow: 15, maxHead: 20, efficiency: 65, power: 1.5 },
    { model: 'DP-25', type: 'Diaphragm', maxFlow: 10, maxHead: 80, efficiency: 60, power: 2.2 },
];

const SHEET_STANDARD_SIZES = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0];

type ViewMode = 'browse' | 'wizard' | 'compare';
type CategoryID = 'bearings' | 'gears' | 'fasteners' | 'welding' | 'pumps' | 'strength' | 'fit' | 'sheet-metal' | 'thermal-expansion';

interface SelectionCategory {
    id: CategoryID;
    title: string;
    description: string;
    icon: any;
    color: string;
    metrics: string[];
    hasWizard: boolean;
}

const CATEGORIES: SelectionCategory[] = [
    {
        id: 'bearings',
        title: 'Bearings (Rulman)',
        description: 'ISO/SKF Deep Groove, Tapered, Cylindrical and Thrust Bearings.',
        icon: Settings,
        color: '#06b6d4',
        metrics: ['Bore (d)', 'Outer (D)', 'Dynamic Load (C)'],
        hasWizard: true
    },
    {
        id: 'fasteners',
        title: 'Fasteners (Bağlantı)',
        description: 'ISO Metric, UNC/UNF, BSP Pipe Threads & Tolerances.',
        icon: Wrench,
        color: '#ef4444',
        metrics: ['Major Dia', 'Pitch', 'Stress Area'],
        hasWizard: true
    },
    {
        id: 'gears',
        title: 'Gears (Dişli)',
        description: 'ISO 6336 Material Strengths & AGMA 2001 Standard Modules.',
        icon: Activity,
        color: '#8b5cf6',
        metrics: ['Hardness', 'Pitting Res.', 'Bending Str.'],
        hasWizard: true
    },
    {
        id: 'welding',
        title: 'Welding (Kaynak)',
        description: 'AWS D1.1 Fillet Weld Strength & ISO Heat Input.',
        icon: Zap,
        color: '#f59e0b',
        metrics: ['Strength', 'Heat Input', 'Leg Size'],
        hasWizard: true
    },
    {
        id: 'pumps',
        title: 'Pumps (Pompa)',
        description: 'Centrifugal Pump System Head & NPSH calculations.',
        icon: Droplets,
        color: '#3b82f6',
        metrics: ['Head', 'Flow Rate', 'NPSH'],
        hasWizard: true
    },
    {
        id: 'strength',
        title: 'Strength (Mukavemet)',
        description: 'Euler Buckling, Mohr Circle & Beam Deflection Data.',
        icon: CircleSlash,
        color: '#ec4899',
        metrics: ['Yield Str.', 'Tensile Str.', 'Modulus'],
        hasWizard: true
    },
    {
        id: 'fit',
        title: 'Fits & Tolerances',
        description: 'ISO 286 Limits and Fits (H7/g6, etc).',
        icon: Ruler,
        color: '#10b981',
        metrics: ['Clearance', 'Transition', 'Interference'],
        hasWizard: true
    },
    {
        id: 'sheet-metal',
        title: 'Sheet Metal (Sac)',
        description: 'DIN 6935 Bend Allowance and K-Factor values.',
        icon: Layers,
        color: '#14b8a6',
        metrics: ['Thickness', 'Bend Radius', 'K-Factor'],
        hasWizard: true
    },
    {
        id: 'thermal-expansion',
        title: 'Thermal Expansion',
        description: 'Linear coefficient α mapping and dimensional shift analysis.',
        icon: Thermometer,
        color: '#f97316',
        metrics: ['Coeff (α)', 'Melting Pt', 'Thermal Cond.'],
        hasWizard: true
    }
];

const StatBar = ({ value, max, color, label, unit }: { value: number, max: number, color: string, label: string, unit: string }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="w-full space-y-1 group">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
                <span>{label}</span>
                <span style={{ color }}>{value} <span className="opacity-60">{unit}</span></span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: pct + "%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, boxShadow: "0 0 10px " + color + "60" }}
                />
            </div>
        </div>
    );
};

const GlobalStyles = React.memo(() => (
    <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
        }
    `}} />
));

export default function EngineeringSelectionSystem() {
    const { t } = useI18nStore();
    const { openWindow } = useOSStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryID>('bearings');
    const [viewMode, setViewMode] = useState<ViewMode>('browse');

    const [compareItems, setCompareItems] = useState<string[]>([]);
    const [activeCalculator, setActiveCalculator] = useState<string | null>(null);

    const [wizardInputs, setWizardInputs] = useState({
        radialLoad: 12.5,
        axialLoad: 0,
        speed: 3000,
    });

    const [fastenerWizardInputs, setFastenerWizardInputs] = useState({
        tensileLoad: 10, // kN
        safetyFactor: 2.0,
        yieldStrength: 400, // MPa
    });

    const [gearWizardInputs, setGearWizardInputs] = useState({
        power: 5, // kW
        speed: 1500, // RPM
        applicationFactor: 1.25,
    });

    const [weldingWizardInputs, setWeldingWizardInputs] = useState({ thickness: 10, tensileRequirement: 400 });
    const [pumpWizardInputs, setPumpWizardInputs] = useState({ flowRate: 40, head: 50 });
    const [strengthWizardInputs, setStrengthWizardInputs] = useState({ force: 100, crossSection: 400, safetyFactor: 2.0 });
    const [fitWizardInputs, setFitWizardInputs] = useState({ nominalDiameter: 25 });
    const [sheetWizardInputs, setSheetWizardInputs] = useState({ requiredLoad: 50, width: 1000, yieldStrength: 235 });
    const [thermalWizardInputs, setThermalWizardInputs] = useState({
        length: 1000, // mm
        tempDelta: 50, // degC
        alpha: 23.1 // 10^-6 / K
    });

    const currentCat = CATEGORIES.find(c => c.id === selectedCategory)!;

    const handleCategorySwitch = (id: CategoryID) => {
        if (id !== selectedCategory) {
            setSelectedCategory(id);
            setCompareItems([]);
            if (viewMode === 'compare') setViewMode('browse');
            if (viewMode === 'wizard' && !CATEGORIES.find(c => c.id === id)?.hasWizard) setViewMode('browse');
        }
    };

    const toggleCompare = (id: string) => {
        setCompareItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-2)
        );
        if (!compareItems.includes(id) && compareItems.length === 1) {
            setViewMode('compare');
        }
    };

    const renderBrowserGrid = () => {
        if (selectedCategory === 'bearings') {
            const data = BEARING_CATALOG.slice(0, 100);
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((item) => {
                        const isSelected = compareItems.includes(item.code);
                        let btnClass = "text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ";
                        if (isSelected) {
                            btnClass += "scale-105 shadow-2xl z-10 ";
                        } else {
                            btnClass += "bg-white/[0.01] border-white/5 hover:border-white/20 hover:bg-white/[0.03]";
                        }

                        return (
                            <button
                                key={item.code}
                                onClick={() => toggleCompare(item.code)}
                                className={btnClass}
                                style={isSelected ? { backgroundColor: currentCat.color + '1A', borderColor: currentCat.color } : {}}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.type.replace(/-/g, ' ')}</div>
                                <div className="text-xl font-black italic text-white mb-4 group-hover:text-cyan-400 transition-colors">
                                    SKF {item.code}
                                </div>
                                <div className="space-y-3">
                                    <StatBar value={item.C} max={160} color="#0ea5e9" label="Dynamic Load" unit="kN" />
                                    <StatBar value={item.nMax || 15000} max={30000} color="#f59e0b" label="Max Speed" unit="rpm" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )
        }

        if (selectedCategory === 'fasteners') {
            const data = FASTENERS_DB.slice(0, 50);
            return (
                <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] uppercase tracking-[0.2em] text-gray-500">
                            <tr>
                                <th className="p-4 pl-6">Standard</th>
                                <th className="p-4">Size</th>
                                <th className="p-4">Pitch (mm)</th>
                                <th className="p-4">Major Dia (mm)</th>
                                <th className="p-4">Tap Drill (mm)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {data.map((f, i) => {
                                const isSelected = compareItems.includes(f.size);
                                return (
                                    <tr key={i} onClick={() => toggleCompare(f.size)} className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${isSelected ? 'bg-white/10' : ''}`}>
                                        <td className="p-4 pl-6 text-gray-400 font-medium group-hover:text-red-400">
                                            {isSelected && <CheckCircle2 size={14} className="inline mr-2 text-emerald-400" />}
                                            {f.standard}
                                        </td>
                                        <td className="p-4 font-black text-white italic">{f.size}</td>
                                        <td className="p-4 font-mono text-gray-300">{f.pitch.toFixed(2)}</td>
                                        <td className="p-4 font-mono text-gray-300">{f.majorDia.toFixed(2)}</td>
                                        <td className="p-4 font-mono text-amber-500">{f.tapDrill.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )
        }

        if (selectedCategory === 'gears') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GEAR_MATERIALS.map((g, i) => {
                        const isSelected = compareItems.includes(g.name);
                        return (
                            <div key={i} onClick={() => toggleCompare(g.name)} className={`relative p-6 rounded-2xl border transition-all cursor-pointer group ${isSelected ? 'border-purple-500 bg-purple-500/10 scale-105 shadow-xl z-10' : 'bg-white/[0.01] border-white/5 hover:border-purple-500/30'}`}>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <h3 className="text-lg font-black text-white mb-4 group-hover:text-purple-400 transition-colors uppercase italic">{g.name}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pitting Res.</div>
                                        <div className="text-xl font-mono font-bold text-gray-200">{g.sigma_Hlim} <span className="text-[10px] text-gray-600">N/mm²</span></div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Bending Str.</div>
                                        <div className="text-xl font-mono font-bold text-gray-200">{g.sigma_Flim} <span className="text-[10px] text-gray-600">N/mm²</span></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
        }

        if (selectedCategory === 'welding') {
            return (
                <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] uppercase tracking-[0.2em] text-gray-500">
                            <tr>
                                <th className="p-4 pl-6">AWS Code</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Yield (MPa)</th>
                                <th className="p-4">Current</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {ELECTRODE_CATALOG.map((e, i) => {
                                const isSelected = compareItems.includes(e.code);
                                return (
                                    <tr key={i} onClick={() => toggleCompare(e.code)} className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${isSelected ? 'bg-white/10' : ''}`}>
                                        <td className="p-4 pl-6 text-gray-400 font-medium group-hover:text-amber-500">
                                            {isSelected && <CheckCircle2 size={14} className="inline mr-2 text-emerald-400" />}
                                            {e.code}
                                        </td>
                                        <td className="p-4 font-black text-white italic">{e.name}</td>
                                        <td className="p-4 font-mono text-gray-300">{e.yieldStrength}</td>
                                        <td className="p-4 font-mono text-cyan-400">{e.current}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )
        }

        if (selectedCategory === 'pumps') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PUMP_CATALOG.map((p, i) => {
                        const isSelected = compareItems.includes(p.model);
                        return (
                            <div key={i} onClick={() => toggleCompare(p.model)} className={`relative p-6 rounded-2xl border transition-all cursor-pointer group ${isSelected ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-xl z-10' : 'bg-white/[0.01] border-white/5 hover:border-blue-500/30'}`}>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <h3 className="text-lg font-black text-white mb-1 group-hover:text-blue-400 transition-colors uppercase italic">{p.model}</h3>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{p.type}</div>
                                <div className="space-y-3">
                                    <StatBar value={p.maxFlow} max={250} color="#3b82f6" label="Max Flow" unit="m³/h" />
                                    <StatBar value={p.maxHead} max={160} color="#22d3ee" label="Max Head" unit="m" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
        }

        if (selectedCategory === 'strength') {
            const steelData = MATERIALS_DB.filter(m => m.category === 'Steel');
            return (
                <div className="bg-black/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] uppercase tracking-[0.2em] text-gray-500">
                            <tr>
                                <th className="p-4 pl-6">Material</th>
                                <th className="p-4">Yield (MPa)</th>
                                <th className="p-4">Tensile (MPa)</th>
                                <th className="p-4">Density</th>
                                <th className="p-4">Hardness</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {steelData.map((m, i) => {
                                const isSelected = compareItems.includes(m.name);
                                return (
                                    <tr key={i} onClick={() => toggleCompare(m.name)} className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${isSelected ? 'bg-white/10' : ''}`}>
                                        <td className="p-4 pl-6 text-white font-black italic group-hover:text-pink-400">
                                            {isSelected && <CheckCircle2 size={14} className="inline mr-2 text-emerald-400" />}
                                            {m.name}
                                        </td>
                                        <td className="p-4 font-mono text-emerald-400">{m.yield}</td>
                                        <td className="p-4 font-mono text-cyan-400">{m.tensile}</td>
                                        <td className="p-4 font-mono text-gray-300">{m.density}</td>
                                        <td className="p-4 font-mono text-gray-400">{m.hardness}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )
        }

        if (selectedCategory === 'fit') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FITS_DB.map((f, i) => {
                        const isSelected = compareItems.includes(f.grade);
                        return (
                            <div key={i} onClick={() => toggleCompare(f.grade)} className={`relative p-6 rounded-2xl border transition-all cursor-pointer group ${isSelected ? 'border-emerald-500 bg-emerald-500/10 scale-105 shadow-xl z-10' : 'bg-white/[0.01] border-white/5 hover:border-emerald-500/30'}`}>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <h3 className="text-3xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase italic">{f.grade}</h3>
                                <div className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-4">{f.desc}</div>
                                <p className="text-xs text-gray-400">{f.application}</p>
                            </div>
                        );
                    })}
                </div>
            )
        }

        if (selectedCategory === 'sheet-metal') {
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {SHEET_STANDARD_SIZES.map((s, i) => {
                        const sizeStr = s.toString();
                        const isSelected = compareItems.includes(sizeStr);
                        return (
                            <div key={i} onClick={() => toggleCompare(sizeStr)} className={`relative p-6 text-center rounded-2xl border transition-all cursor-pointer group flex flex-col items-center justify-center ${isSelected ? 'border-teal-500 bg-teal-500/10 scale-105 shadow-xl z-10' : 'bg-white/[0.01] border-white/5 hover:border-teal-500/30'}`}>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <h3 className="text-3xl font-black text-white group-hover:text-teal-400 transition-colors italic mb-1">{s.toFixed(1)}</h3>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">mm</div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (selectedCategory === 'thermal-expansion') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MATERIALS_DB.slice(0, 60).map((m, i) => {
                        const isSelected = compareItems.includes(m.name);
                        return (
                            <div key={i} onClick={() => toggleCompare(m.name)} className={`relative p-6 rounded-2xl border transition-all cursor-pointer group ${isSelected ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-xl z-10' : 'bg-white/[0.01] border-white/5 hover:border-orange-500/30'}`}>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 text-emerald-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                <h3 className="text-lg font-black text-white mb-1 group-hover:text-orange-400 transition-colors uppercase italic">{m.name}</h3>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{m.category}</div>
                                <div className="space-y-3">
                                    <StatBar value={m.thermalExp || 0} max={100} color="#f97316" label="Alpha (α)" unit="μm/mK" />
                                    <StatBar value={m.meltingPoint || 1500} max={2000} color="#ef4444" label="Melting Point" unit="°C" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCalculator('thermal-expansion');
                                    }}
                                    className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-orange-500/20 hover:border-orange-500/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Play size={10} className="fill-current" /> Initialize Module
                                </button>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-20 text-center opacity-40">
                <Grid size={48} className="mb-4 text-gray-500" />
                <h3 className="text-xl font-black tracking-tight text-white mb-2">Dataset Initiating</h3>
                <p className="text-sm text-gray-400">Connect to OS Database to view full specification matrices for {currentCat.title}.</p>
            </div>
        );
    };

    const renderCompareView = () => {
        if (compareItems.length !== 2) {
            return (
                <div className="flex flex-col items-center justify-center p-20 text-center opacity-40">
                    <Scale size={48} className="mb-4 text-gray-500" />
                    <h3 className="text-xl font-black tracking-tight text-white mb-2">Comparison Engine Requires 2 Items</h3>
                    <p className="text-sm text-gray-400">Return to Browse mode and select exactly two components to analyze.</p>
                </div>
            );
        }

        let title = "";
        let subtitle = "";
        let specs: any[] = [];
        let item1: any = null;
        let item2: any = null;
        let c1Title = "";
        let c2Title = "";

        if (selectedCategory === 'bearings') {
            item1 = BEARING_CATALOG.find(b => b.code === compareItems[0])!;
            item2 = BEARING_CATALOG.find(b => b.code === compareItems[1])!;
            title = "Kinematic Comparison";
            subtitle = `${item1.type.replace(/-/g, ' ')} vs ${item2.type.replace(/-/g, ' ')}`;
            c1Title = `SKF ${item1.code}`;
            c2Title = `SKF ${item2.code}`;
            specs = [
                { key: 'd', label: 'Bore Dia (mm)', better: 'neutral' },
                { key: 'D', label: 'Outer Dia (mm)', better: 'neutral' },
                { key: 'C', label: 'Dynamic Load (kN)', better: 'high' },
                { key: 'C0', label: 'Static Load (kN)', better: 'high' },
                { key: 'nMax', label: 'Speed Limit (RPM)', better: 'high' }
            ];
        } else if (selectedCategory === 'fasteners') {
            item1 = FASTENERS_DB.find(f => f.size === compareItems[0])!;
            item2 = FASTENERS_DB.find(f => f.size === compareItems[1])!;
            title = "Fastener Specs Analysis";
            subtitle = `${item1.standard} Comparison`;
            c1Title = item1.size;
            c2Title = item2.size;
            specs = [
                { key: 'majorDia', label: 'Major Dia (mm)', better: 'high' },
                { key: 'pitch', label: 'Pitch', better: 'neutral' },
                { key: 'tapDrill', label: 'Tap Drill (mm)', better: 'high' },
                { key: 'stressArea', label: 'Stress Area (mm²)', better: 'high' }
            ];
        } else if (selectedCategory === 'gears') {
            item1 = GEAR_MATERIALS.find(g => g.name === compareItems[0])!;
            item2 = GEAR_MATERIALS.find(g => g.name === compareItems[1])!;
            title = "Material Strength Matrix";
            subtitle = `ISO 6336 Gear Material Analysis`;
            c1Title = item1.name;
            c2Title = item2.name;
            specs = [
                { key: 'sigma_Hlim', label: 'Pitting Res (N/mm²)', better: 'high' },
                { key: 'sigma_Flim', label: 'Bending Str (N/mm²)', better: 'high' }
            ];
        } else if (selectedCategory === 'welding') {
            item1 = ELECTRODE_CATALOG.find(e => e.code === compareItems[0])!;
            item2 = ELECTRODE_CATALOG.find(e => e.code === compareItems[1])!;
            title = "Weld Consumable Matrix";
            subtitle = `AWS D1.1 Electrode Comparison`;
            c1Title = item1.code;
            c2Title = item2.code;
            specs = [
                { key: 'yieldStrength', label: 'Yield Str (MPa)', better: 'high' },
                { key: 'tensileStrength', label: 'Tensile Str (MPa)', better: 'high' },
                { key: 'elongation', label: 'Elongation (%)', better: 'high' },
                { key: 'current', label: 'Current Type', better: 'text' }
            ];
        } else if (selectedCategory === 'pumps') {
            item1 = PUMP_CATALOG.find(p => p.model === compareItems[0])!;
            item2 = PUMP_CATALOG.find(p => p.model === compareItems[1])!;
            title = "Hydraulic Performance Comparison";
            subtitle = `${item1.type} vs ${item2.type}`;
            c1Title = item1.model;
            c2Title = item2.model;
            specs = [
                { key: 'maxFlow', label: 'Max Flow (m³/h)', better: 'high' },
                { key: 'maxHead', label: 'Max Head (m)', better: 'high' },
                { key: 'efficiency', label: 'Efficiency (%)', better: 'high' },
                { key: 'power', label: 'Power Req (kW)', better: 'low' }
            ];
        } else if (selectedCategory === 'strength') {
            item1 = MATERIALS_DB.find(m => m.name === compareItems[0])!;
            item2 = MATERIALS_DB.find(m => m.name === compareItems[1])!;
            title = "Material Properties Matrix";
            subtitle = `Engineering Strength Comparison`;
            c1Title = item1.name;
            c2Title = item2.name;
            specs = [
                { key: 'yield', label: 'Yield Str (MPa)', better: 'high' },
                { key: 'tensile', label: 'Tensile Str (MPa)', better: 'high' },
                { key: 'youngsModulus', label: 'Modulus (GPa)', better: 'high' },
                { key: 'density', label: 'Density (g/cm³)', better: 'low' },
                { key: 'hardness', label: 'Hardness', better: 'text' }
            ];
        } else if (selectedCategory === 'fit') {
            item1 = FITS_DB.find(f => f.grade === compareItems[0])!;
            item2 = FITS_DB.find(f => f.grade === compareItems[1])!;
            title = "Tolerance Grade Matrix";
            subtitle = `ISO 286 Limits and Fits`;
            c1Title = item1.grade;
            c2Title = item2.grade;
            specs = [
                { key: 'desc', label: 'Fit Type', better: 'text' },
                { key: 'application', label: 'Core Application', better: 'text' }
            ];
        } else if (selectedCategory === 'sheet-metal') {
            item1 = { size: compareItems[0] };
            item2 = { size: compareItems[1] };
            title = "Sheet Gauge Matrix";
            subtitle = `DIN 6935 Standard Thickness`;
            c1Title = `${item1.size} mm`;
            c2Title = `${item2.size} mm`;
            specs = [
                { key: 'size', label: 'Nominal Thickness', better: 'text' }
            ];
        } else if (selectedCategory === 'thermal-expansion') {
            item1 = MATERIALS_DB.find(m => m.name === compareItems[0])!;
            item2 = MATERIALS_DB.find(m => m.name === compareItems[1])!;
            title = "Thermal Property Matrix";
            subtitle = `Expansion and Conductivity Comparison`;
            c1Title = item1.name;
            c2Title = item2.name;
            specs = [
                { key: 'thermalExp', label: 'Expansion Coeff (α)', better: 'low' },
                { key: 'meltingPoint', label: 'Melting Point (°C)', better: 'high' },
                { key: 'thermalCond', label: 'Thermal Conductivity', better: 'high' },
                { key: 'specificHeat', label: 'Specific Heat', better: 'high' }
            ];
        } else {
            return (
                <div className="flex flex-col items-center justify-center p-20 text-center opacity-40">
                    <Scale size={48} className="mb-4 text-gray-500" />
                    <h3 className="text-xl font-black tracking-tight text-white mb-2">Category Not Supported Yet</h3>
                    <p className="text-sm text-gray-400">Comparison matrices for {currentCat.title} will be available in the next patch.</p>
                </div>
            )
        }

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-white italic tracking-tight">{title}</h2>
                        <p className="text-gray-500 text-sm">{subtitle}</p>
                    </div>
                </div>

                <div className="bg-[#0a0e12] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-8 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] w-1/3">Technical Specification</th>
                                <th className="p-8 text-2xl font-black italic text-center text-cyan-400 w-1/3" style={{ color: currentCat.color }}>{c1Title}</th>
                                <th className="p-8 text-2xl font-black italic text-center text-cyan-400 w-1/3" style={{ color: currentCat.color }}>{c2Title}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-white/[0.02]">
                            {specs.map((spec) => {
                                const v1 = item1[spec.key];
                                const v2 = item2[spec.key];

                                let c1 = "p-8 text-center font-mono font-black text-xl ";
                                let c2 = "p-8 text-center font-mono font-black text-xl ";

                                if (spec.better === 'text') {
                                    return (
                                        <tr key={spec.key} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-8 font-bold text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                                {spec.label}
                                            </td>
                                            <td className={c1 + " text-white uppercase text-sm tracking-widest"} style={{ color: currentCat.color }}>{v1}</td>
                                            <td className={c2 + " text-white uppercase text-sm tracking-widest"} style={{ color: currentCat.color }}>{v2}</td>
                                        </tr>
                                    );
                                }

                                const n1 = v1 as number || 0;
                                const n2 = v2 as number || 0;
                                const is1Better = spec.better === 'high' ? n1 > n2 : (spec.better === 'low' ? n1 < n2 : false);
                                const is2Better = spec.better === 'high' ? n2 > n1 : (spec.better === 'low' ? n2 < n1 : false);

                                // Prevent divide by zero error
                                const avg = (n1 + n2) / 2;
                                const pctDiff = avg === 0 ? 0 : Math.abs((n1 - n2) / avg) * 100;

                                c1 += (is1Better ? "text-white" : "text-gray-600");
                                c2 += (is2Better ? "text-white" : "text-gray-600");

                                return (
                                    <tr key={spec.key} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-8 font-bold text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                            {spec.label}
                                        </td>
                                        <td className={c1}>
                                            {n1.toLocaleString()}
                                            {is1Better && pctDiff > 0 && <div className="text-[9px] text-emerald-400 mt-1 uppercase">+{pctDiff.toFixed(1)}%</div>}
                                        </td>
                                        <td className={c2}>
                                            {n2.toLocaleString()}
                                            {is2Better && pctDiff > 0 && <div className="text-[9px] text-emerald-400 mt-1 uppercase">+{pctDiff.toFixed(1)}%</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderWizardView = () => {
        if (!currentCat.hasWizard) return null;

        let inputContent = null;
        let resultContent = null;

        let targetModuleId: any = selectedCategory;
        if (selectedCategory === 'gears') targetModuleId = 'gears-bearings';
        if (selectedCategory === 'strength') targetModuleId = 'strength-analysis';
        if (selectedCategory === 'fit') targetModuleId = 'fits-tolerances';
        if (selectedCategory === 'thermal-expansion') targetModuleId = 'thermal-expansion';

        // CSS specific color class overrides for dynamic ring/borders
        const dynColor = currentCat.color;

        if (selectedCategory === 'bearings') {
            const loadThreshold = wizardInputs.radialLoad * 1.5;
            const recommended = BEARING_CATALOG.filter(b => b.C >= loadThreshold).sort((a, b) => a.C - b.C)[0] || BEARING_CATALOG[BEARING_CATALOG.length - 1];
            const lifeCalc = calculateBearingLife(recommended, wizardInputs.radialLoad, wizardInputs.axialLoad, wizardInputs.speed);

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Radial Load (Fr)</span>
                            <span className="text-cyan-400">{wizardInputs.radialLoad} kN</span>
                        </label>
                        <input
                            type="range" min="1" max="50" step="0.5"
                            className="w-full accent-cyan-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={wizardInputs.radialLoad}
                            onChange={(e) => setWizardInputs({ ...wizardInputs, radialLoad: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Axial Load (Fa)</span>
                            <span className="text-purple-400">{wizardInputs.axialLoad} kN</span>
                        </label>
                        <input
                            type="range" min="0" max="20" step="0.5"
                            className="w-full accent-purple-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={wizardInputs.axialLoad}
                            onChange={(e) => setWizardInputs({ ...wizardInputs, axialLoad: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Rotational Speed</span>
                            <span className="text-amber-400">{wizardInputs.speed} RPM</span>
                        </label>
                        <input
                            type="range" min="500" max="20000" step="100"
                            className="w-full accent-amber-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={wizardInputs.speed}
                            onChange={(e) => setWizardInputs({ ...wizardInputs, speed: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">
                                SKF {recommended.code}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.type.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Settings size={120} className="animate-spin-slow" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Gauge size={12} className="text-emerald-400" /> ISO 281 L10h
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400">
                                {Math.round(lifeCalc.L10h).toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">hrs</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-cyan-400" /> Equivalent Load (P)
                            </div>
                            <div className="text-3xl font-black font-mono text-cyan-400">
                                {lifeCalc.P.toFixed(1)}
                                <span className="text-xs text-gray-500 ml-1">kN</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-amber-400" /> Dynamic Cap (C)
                            </div>
                            <div className="text-3xl font-black font-mono text-amber-400">
                                {recommended.C}
                                <span className="text-xs text-gray-500 ml-1">kN</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'fasteners') {
            const requiredArea = (fastenerWizardInputs.tensileLoad * 1000 * fastenerWizardInputs.safetyFactor) / fastenerWizardInputs.yieldStrength;
            const validFasteners = FASTENERS_DB.filter(f => f.stressArea >= requiredArea && f.standard === 'ISO Metric');
            const recommended = validFasteners.sort((a, b) => a.stressArea - b.stressArea)[0] || FASTENERS_DB[FASTENERS_DB.length - 1];

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Tensile Load</span>
                            <span className="text-red-400">{fastenerWizardInputs.tensileLoad} kN</span>
                        </label>
                        <input
                            type="range" min="1" max="250" step="5"
                            className="w-full accent-red-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={fastenerWizardInputs.tensileLoad}
                            onChange={(e) => setFastenerWizardInputs({ ...fastenerWizardInputs, tensileLoad: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Safety Factor (SF)</span>
                            <span className="text-purple-400">{fastenerWizardInputs.safetyFactor.toFixed(1)}</span>
                        </label>
                        <input
                            type="range" min="1.0" max="5.0" step="0.5"
                            className="w-full accent-purple-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={fastenerWizardInputs.safetyFactor}
                            onChange={(e) => setFastenerWizardInputs({ ...fastenerWizardInputs, safetyFactor: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Material Yield Str</span>
                            <span className="text-amber-400">{fastenerWizardInputs.yieldStrength} MPa</span>
                        </label>
                        <input
                            type="range" min="300" max="1200" step="50"
                            className="w-full accent-amber-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={fastenerWizardInputs.yieldStrength}
                            onChange={(e) => setFastenerWizardInputs({ ...fastenerWizardInputs, yieldStrength: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">
                                {recommended.size}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">ISO Metric Coarse Thread</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Wrench size={120} className="animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-red-400" /> Required Area
                            </div>
                            <div className="text-3xl font-black font-mono text-red-400">
                                {requiredArea.toFixed(1)}
                                <span className="text-xs text-gray-500 ml-1">mm²</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-400" /> Actual Area
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400">
                                {recommended.stressArea.toFixed(1)}
                                <span className="text-xs text-gray-500 ml-1">mm²</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Settings size={12} className="text-cyan-400" /> Major Dia
                            </div>
                            <div className="text-3xl font-black font-mono text-cyan-400">
                                {recommended.majorDia}
                                <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'gears') {
            const torque = (9550 * gearWizardInputs.power) / gearWizardInputs.speed; // Nm
            const requiredStrength = Math.min((torque * gearWizardInputs.applicationFactor * 2), 600); // Scaled for demo purposes to range of materials
            const validMaterials = GEAR_MATERIALS.filter(m => m.sigma_Flim >= requiredStrength);
            const recommended = validMaterials.sort((a, b) => a.sigma_Flim - b.sigma_Flim)[0] || GEAR_MATERIALS[0];

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Transmitted Power</span>
                            <span className="text-[#8b5cf6]">{gearWizardInputs.power} kW</span>
                        </label>
                        <input
                            type="range" min="1" max="150" step="5"
                            className="w-full accent-[#8b5cf6] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={gearWizardInputs.power}
                            onChange={(e) => setGearWizardInputs({ ...gearWizardInputs, power: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Pinion Speed</span>
                            <span className="text-purple-400">{gearWizardInputs.speed} RPM</span>
                        </label>
                        <input
                            type="range" min="100" max="6000" step="100"
                            className="w-full accent-purple-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={gearWizardInputs.speed}
                            onChange={(e) => setGearWizardInputs({ ...gearWizardInputs, speed: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Application Factor (Ka)</span>
                            <span className="text-amber-400">{gearWizardInputs.applicationFactor.toFixed(2)}</span>
                        </label>
                        <input
                            type="range" min="1.0" max="2.25" step="0.25"
                            className="w-full accent-amber-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={gearWizardInputs.applicationFactor}
                            onChange={(e) => setGearWizardInputs({ ...gearWizardInputs, applicationFactor: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter w-3/4">
                                {recommended.name.split('(')[0].trim()}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.name.split('(')[1]?.replace(')', '') || 'Gear Material'}</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Activity size={100} className="animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-[#8b5cf6]" /> Input Torque
                            </div>
                            <div className="text-3xl font-black font-mono text-[#8b5cf6]">
                                {torque.toFixed(0)}
                                <span className="text-xs text-gray-500 ml-1">Nm</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-emerald-400" /> Core Hardness
                            </div>
                            <div className="text-xl mt-2 font-black font-mono text-emerald-400">
                                {recommended.hardness}
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-cyan-400" /> Bending Str
                            </div>
                            <div className="text-3xl font-black font-mono text-cyan-400">
                                {recommended.sigma_Flim}
                                <span className="text-xs text-gray-500 ml-1">MPa</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'welding') {
            const validElectrodes = ELECTRODE_CATALOG.filter(e => e.tensileStrength >= weldingWizardInputs.tensileRequirement);
            const recommended = validElectrodes.sort((a, b) => a.tensileStrength - b.tensileStrength)[0] || ELECTRODE_CATALOG[0];
            const minWeldSize = Math.max(3, Math.ceil(weldingWizardInputs.thickness * 0.7));

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Plate Thickness</span>
                            <span className="text-[#f59e0b]">{weldingWizardInputs.thickness} mm</span>
                        </label>
                        <input
                            type="range" min="1" max="50" step="1"
                            className="w-full accent-[#f59e0b] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={weldingWizardInputs.thickness}
                            onChange={(e) => setWeldingWizardInputs({ ...weldingWizardInputs, thickness: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Tensile Req</span>
                            <span className="text-red-400">{weldingWizardInputs.tensileRequirement} MPa</span>
                        </label>
                        <input
                            type="range" min="300" max="800" step="10"
                            className="w-full accent-red-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={weldingWizardInputs.tensileRequirement}
                            onChange={(e) => setWeldingWizardInputs({ ...weldingWizardInputs, tensileRequirement: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter w-3/4">
                                AWS {recommended.code}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.nameTr}</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Zap size={100} className="animate-pulse text-[#f59e0b]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-[#f59e0b]" /> Min Leg Size
                            </div>
                            <div className="text-3xl font-black font-mono text-[#f59e0b]">
                                {minWeldSize}
                                <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-400" /> Max Yield
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400">
                                {recommended.yieldStrength}
                                <span className="text-xs text-gray-500 ml-1">MPa</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-cyan-400" /> Current
                            </div>
                            <div className="text-xl mt-2 font-black font-mono text-cyan-400">
                                {recommended.current}
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'pumps') {
            const reqFlow = pumpWizardInputs.flowRate;
            const reqHead = pumpWizardInputs.head;
            const validPumps = PUMP_CATALOG.filter(p => p.maxFlow >= reqFlow && p.maxHead >= reqHead);
            const recommended = validPumps.sort((a, b) => a.power - b.power)[0] || PUMP_CATALOG[PUMP_CATALOG.length - 1];
            const reqPower = (reqFlow * reqHead * 1000 * 9.81) / (3600 * 1000 * (recommended.efficiency / 100));

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Target Flow Rate</span>
                            <span className="text-[#3b82f6]">{pumpWizardInputs.flowRate} m³/h</span>
                        </label>
                        <input
                            type="range" min="5" max="200" step="5"
                            className="w-full accent-[#3b82f6] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={pumpWizardInputs.flowRate}
                            onChange={(e) => setPumpWizardInputs({ ...pumpWizardInputs, flowRate: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Target Head</span>
                            <span className="text-cyan-400">{pumpWizardInputs.head} m</span>
                        </label>
                        <input
                            type="range" min="10" max="150" step="5"
                            className="w-full accent-cyan-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={pumpWizardInputs.head}
                            onChange={(e) => setPumpWizardInputs({ ...pumpWizardInputs, head: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">
                                {recommended.model}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.type} Pump</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Droplets size={100} className="text-[#3b82f6] animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-[#3b82f6]" /> Req Shaft Power
                            </div>
                            <div className="text-3xl font-black font-mono text-[#3b82f6]">
                                {reqPower.toFixed(1)}
                                <span className="text-xs text-gray-500 ml-1">kW</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-emerald-400" /> Rated Motor
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400">
                                {recommended.power}
                                <span className="text-xs text-gray-500 ml-1">kW</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-cyan-400" /> Peak Eff.
                            </div>
                            <div className="text-3xl font-black font-mono text-cyan-400">
                                {recommended.efficiency}
                                <span className="text-xs text-gray-500 ml-1">%</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'strength') {
            // Assume input is Force(kN) and Cross Section(mm2). 
            // Required Stress (MPa) = (Force * 1000 / area) * Safety Factor
            const requiredStress = (strengthWizardInputs.force * 1000 * strengthWizardInputs.safetyFactor) / strengthWizardInputs.crossSection;
            const validMaterials = MATERIALS_DB.filter(m => m.yield >= requiredStress && m.category === 'Steel');
            const recommended = validMaterials.sort((a, b) => a.yield - b.yield)[0] || MATERIALS_DB.filter(m => m.category === 'Steel')[0];

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Applied Force</span>
                            <span className="text-[#ec4899]">{strengthWizardInputs.force} kN</span>
                        </label>
                        <input
                            type="range" min="10" max="1000" step="10"
                            className="w-full accent-[#ec4899] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={strengthWizardInputs.force}
                            onChange={(e) => setStrengthWizardInputs({ ...strengthWizardInputs, force: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Safety Factor (SF)</span>
                            <span className="text-purple-400">{strengthWizardInputs.safetyFactor.toFixed(1)}</span>
                        </label>
                        <input
                            type="range" min="1.0" max="5.0" step="0.5"
                            className="w-full accent-purple-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={strengthWizardInputs.safetyFactor}
                            onChange={(e) => setStrengthWizardInputs({ ...strengthWizardInputs, safetyFactor: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Cross Section</span>
                            <span className="text-[#ec4899]">{strengthWizardInputs.crossSection} mm²</span>
                        </label>
                        <input
                            type="range" min="50" max="2500" step="50"
                            className="w-full accent-[#ec4899] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={strengthWizardInputs.crossSection}
                            onChange={(e) => setStrengthWizardInputs({ ...strengthWizardInputs, crossSection: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter w-3/4">
                                {recommended.name}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.category} (Steel)</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <CircleSlash size={100} className="text-[#ec4899] animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-[#ec4899]" /> Required Stress
                            </div>
                            <div className="text-3xl font-black font-mono text-[#ec4899]">
                                {requiredStress.toFixed(1)}
                                <span className="text-xs text-gray-500 ml-1">MPa</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-400" /> Actual Yield
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400">
                                {recommended.yield}
                                <span className="text-xs text-gray-500 ml-1">MPa</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-cyan-400" /> Density
                            </div>
                            <div className="text-3xl font-black font-mono text-cyan-400">
                                {recommended.density}
                                <span className="text-xs text-gray-500 ml-1">g/cm³</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'fit') {
            const recommended = FITS_DB[0]; // Sliding fit default
            const typicalClearance = (10 + fitWizardInputs.nominalDiameter * 0.5).toFixed(1);

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Nominal Shaft Dia</span>
                            <span className="text-[#10b981]">{fitWizardInputs.nominalDiameter} mm</span>
                        </label>
                        <input
                            type="range" min="5" max="200" step="1"
                            className="w-full accent-[#10b981] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={fitWizardInputs.nominalDiameter}
                            onChange={(e) => setFitWizardInputs({ ...fitWizardInputs, nominalDiameter: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter w-3/4">
                                {recommended.grade}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{recommended.desc}</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Ruler size={100} className="text-[#10b981] animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-2 bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-[#10b981]" /> Application
                            </div>
                            <div className="text-sm font-medium text-white/80 mt-2">
                                {recommended.application}
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-emerald-400" /> Typical Clearance
                            </div>
                            <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                                ±{typicalClearance}
                                <span className="text-xs text-gray-500 ml-1">μm</span>
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'sheet-metal') {
            // Simplified max stress = 6 * M / ( b * t^2 )
            // Required t = sqrt( 6 * P * L / (b * yield) )
            const L = 100; // mm span
            const reqThick = Math.sqrt((6 * sheetWizardInputs.requiredLoad * 1000 * L) / (sheetWizardInputs.width * sheetWizardInputs.yieldStrength));
            const validSizes = SHEET_STANDARD_SIZES.filter(s => s >= reqThick);
            const recommendedThick = validSizes[0] || SHEET_STANDARD_SIZES[SHEET_STANDARD_SIZES.length - 1];

            const kFactor = recommendedThick <= 1.2 ? 0.35 : recommendedThick <= 3.0 ? 0.40 : 0.45;

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Central Load P</span>
                            <span className="text-[#14b8a6]">{sheetWizardInputs.requiredLoad} kN</span>
                        </label>
                        <input
                            type="range" min="1" max="500" step="5"
                            className="w-full accent-[#14b8a6] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={sheetWizardInputs.requiredLoad}
                            onChange={(e) => setSheetWizardInputs({ ...sheetWizardInputs, requiredLoad: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Panel Width b</span>
                            <span className="text-cyan-400">{sheetWizardInputs.width} mm</span>
                        </label>
                        <input
                            type="range" min="100" max="2500" step="50"
                            className="w-full accent-cyan-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={sheetWizardInputs.width}
                            onChange={(e) => setSheetWizardInputs({ ...sheetWizardInputs, width: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter w-3/4">
                                {recommendedThick}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">Standard Sheet (Sac) T (mm)</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Layers size={100} className="text-[#14b8a6] animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-[#14b8a6]" /> Req Thickness
                            </div>
                            <div className="text-3xl font-black font-mono text-[#14b8a6]">
                                {reqThick.toFixed(2)}
                                <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-emerald-400" /> K-Factor
                            </div>
                            <div className="text-3xl mt-2 font-black font-mono text-emerald-400">
                                {kFactor}
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-cyan-400" /> Material
                            </div>
                            <div className="text-xl mt-3 font-black font-mono text-cyan-400">
                                S235JR
                            </div>
                        </div>
                    </div>
                </>
            );
        } else if (selectedCategory === 'thermal-expansion') {
            const dL = (thermalWizardInputs.length * thermalWizardInputs.alpha * thermalWizardInputs.tempDelta) / 1000000;
            const finalL = thermalWizardInputs.length + dL;
            const strain = (dL / thermalWizardInputs.length) * 100;

            inputContent = (
                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Initial Length (L0)</span>
                            <span className="text-[#f97316]">{thermalWizardInputs.length} mm</span>
                        </label>
                        <input
                            type="range" min="10" max="10000" step="10"
                            className="w-full accent-[#f97316] h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={thermalWizardInputs.length}
                            onChange={(e) => setThermalWizardInputs({ ...thermalWizardInputs, length: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Temp Delta (∆T)</span>
                            <span className="text-orange-400">{thermalWizardInputs.tempDelta} °C</span>
                        </label>
                        <input
                            type="range" min="-100" max="500" step="5"
                            className="w-full accent-orange-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={thermalWizardInputs.tempDelta}
                            onChange={(e) => setThermalWizardInputs({ ...thermalWizardInputs, tempDelta: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-500 uppercase flex justify-between">
                            <span>Coeff α (10⁻⁶/K)</span>
                            <span className="text-yellow-400">{thermalWizardInputs.alpha}</span>
                        </label>
                        <input
                            type="range" min="1" max="50" step="0.1"
                            className="w-full accent-yellow-400 h-1 bg-white/10 rounded-full appearance-none cursor-ew-resize"
                            value={thermalWizardInputs.alpha}
                            onChange={(e) => setThermalWizardInputs({ ...thermalWizardInputs, alpha: Number(e.target.value) })}
                        />
                    </div>
                </div>
            );

            resultContent = (
                <>
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">
                                {finalL.toFixed(3)}
                            </h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2">{t.thermal?.finalLength || 'Final Length'} (mm)</p>
                        </div>
                        <div className="hidden md:block opacity-20">
                            <Thermometer size={100} className="text-[#f97316] animate-pulse" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={12} className="text-[#f97316]" /> {t.thermal?.expansion || 'Expansion ∆L'}
                            </div>
                            <div className="text-3xl font-black font-mono text-[#f97316]">
                                {dL >= 0 ? "+" : ""}{dL.toFixed(4)}
                                <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Scale size={12} className="text-emerald-400" /> {t.thermal?.strain || 'Strain ε'}
                            </div>
                            <div className="text-3xl mt-2 font-black font-mono text-emerald-400">
                                {strain.toFixed(4)}
                                <span className="text-xs text-gray-500 ml-1">%</span>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-cyan-400" /> Material
                            </div>
                            <div className="text-xl mt-3 font-black font-mono text-cyan-400">
                                Al 6061-T6
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2 mb-12">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter">AI Selection Engine</h2>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">Enter operating conditions. OS identifies the optimal ISO component.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-8 backdrop-blur-xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4" style={{ color: dynColor }}>
                            <Cpu size={20} />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Live Parameters</h4>
                        </div>
                        {inputContent}
                    </div>

                    <div className="lg:col-span-8 p-10 rounded-[40px] relative overflow-hidden flex flex-col justify-between border" style={{ borderColor: `${dynColor}33`, background: `linear-gradient(to bottom right, ${dynColor}1A, transparent)` }}>
                        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at top right, ${dynColor}1A, transparent)` }} />

                        <div className="relative z-10">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2" style={{ color: dynColor }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dynColor }} />
                                Predicted Optimal Match
                            </div>
                            {resultContent}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setActiveCalculator(targetModuleId);
                            }}
                            className="relative z-10 mt-8 group w-full bg-white/5 border border-white/10 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:text-white hover:bg-[var(--hover-bg)] hover:border-[var(--hover-border)]"
                            style={{ '--hover-bg': dynColor, '--hover-border': dynColor } as React.CSSProperties}
                        >
                            Open Detailed Calculator Engine <Play size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#030507] text-gray-200 overflow-hidden font-sans select-none selection:bg-cyan-500/30">
            <header className="px-8 py-5 border-b border-white/[0.05] bg-[#05080a]/80 backdrop-blur-2xl z-50">
                <div className="flex items-center justify-between gap-6 max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20" />
                            <div className="p-3.5 rounded-2xl bg-white/5 text-blue-400 border border-white/10 relative z-10">
                                <Database size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                                ALU<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">CALC</span> OS <span className="opacity-20 font-light">|</span> <span className="text-lg italic text-gray-300 font-normal">Engineering Standards</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center bg-[#070b0e] p-1.5 rounded-2xl border border-white/[0.05] shadow-inner">
                        {(['browse', 'wizard', 'compare'] as ViewMode[]).map((mode) => {
                            if (mode === 'wizard' && !currentCat.hasWizard) return null;
                            const isActive = viewMode === mode;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={"relative px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-colors " + (isActive ? 'text-white' : 'text-gray-600 hover:text-gray-400')}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navHeaderIndicator"
                                            className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{mode}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                <AnimatePresence>
                    {activeCalculator && (
                        <motion.div
                            key="calculator-overlay"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 z-50 bg-[#030507]/95 flex flex-col"
                            style={{ willChange: 'opacity, transform' }}
                        >
                            <div className="flex-1 overflow-hidden relative border border-white/10 rounded-[40px] shadow-2xl m-6 bg-[#0a0e14]">
                                <button
                                    onClick={() => setActiveCalculator(null)}
                                    className="absolute top-6 right-6 z-50 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white transition-all flex items-center gap-2 hover:-translate-x-1"
                                >
                                    <ArrowRight size={14} className="rotate-180" /> Return to AI Selection Engine
                                </button>

                                {/* Render matching module directly, pass full height classes */}
                                <div className="w-full h-full pt-20 pb-0 overflow-y-auto">
                                    {activeCalculator === 'bearings' && <BearingsModule lang="en" dict={{}} />}
                                    {activeCalculator === 'gears-bearings' && <GearsModule lang="en" dict={{}} />}
                                    {activeCalculator === 'fasteners' && <FastenersModule lang="en" dict={{}} />}
                                    {activeCalculator === 'thermal-expansion' && <ThermalExpansionModule />}
                                    {/* Fallback if no specific highly-styled module exists yet */}
                                    {!['bearings', 'gears-bearings', 'fasteners', 'thermal-expansion'].includes(activeCalculator!) && (
                                        <div className="flex flex-col items-center justify-center h-full opacity-50 p-10 text-center">
                                            <Settings size={48} className="mb-4 text-cyan-500 animate-spin-slow" />
                                            <h2 className="text-2xl font-black italic tracking-tighter">Initializing {activeCalculator} Calculator</h2>
                                            <p className="text-sm font-bold tracking-widest uppercase mt-4">Module Upgrade in Progress</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <aside className="w-[300px] border-r border-white/[0.05] bg-[#050709] flex flex-col relative z-40">
                    <div className="p-6">
                        <div className="relative group mb-6">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={14} className="text-gray-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search DB..."
                                className="w-full bg-[#0a0e14] border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-blue-500/30 transition-all placeholder:text-gray-700 placeholder:font-normal"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <h2 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] pl-1 mb-4 flex items-center gap-2">
                            Data Modules
                        </h2>

                        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 custom-scrollbar">
                            {CATEGORIES.map(cat => {
                                const isSel = selectedCategory === cat.id;
                                let btnClass = "w-full text-left flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group ";
                                btnClass += isSel ? 'bg-white/[0.04] border border-white/10 shadow-lg' : 'hover:bg-white/[0.02] border border-transparent';

                                let iconClass = "p-2.5 rounded-xl transition-all " + (isSel ? 'bg-white/10 text-white' : 'bg-transparent text-gray-600 group-hover:bg-white/5 group-hover:text-gray-300');
                                let textClass = "text-xs font-black tracking-wide " + (isSel ? 'text-white' : 'text-gray-500 group-hover:text-gray-300');

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySwitch(cat.id)}
                                        className={btnClass}
                                    >
                                        <div className={iconClass}>
                                            <cat.icon size={18} style={{ color: isSel ? cat.color : undefined }} />
                                        </div>
                                        <div>
                                            <div className={textClass}>
                                                {cat.title.split(' ')[0]}
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mt-0.5">
                                                {cat.metrics.length} metrics
                                            </div>
                                        </div>
                                        {isSel && (
                                            <motion.div layoutId="sidebarIndicator" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" style={{ backgroundColor: cat.color }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <section className="flex-1 overflow-y-auto p-10 relative bg-gradient-to-br from-[#0a0e14] to-black">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCategory + "-" + viewMode}
                            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full max-w-[1400px] mx-auto"
                        >
                            {viewMode === 'browse' && renderBrowserGrid()}
                            {viewMode === 'compare' && renderCompareView()}
                            {viewMode === 'wizard' && renderWizardView()}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </main>

            <GlobalStyles />
        </div>
    );
}


'use client';

import { useState, useMemo } from 'react';
import { getKFactor, calculateBendAllowance, calculateWeldingConsumables } from '@/logic/manufacturing';
import { exportGCode } from '@/lib/cam/gcode';
import {
    FileCode, Flame, FoldHorizontal, Copy, Check, X,
    Sparkles, Gauge, Thermometer, Activity, Info,
    Box, BookOpen, ExternalLink, Layers, Target,
    Maximize2, Zap, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MATERIALS_DB } from '@/data/materialsData';
import {
    MANUFACTURING_PATHS, SURFACE_FINISH_DB, SURFACE_COATING_DB,
    MachiningProcess
} from '@/data/manufacturingData';
import { HANDBOOK_31_STRUCTURE } from '@/data/reference/machinery-handbook/structure';
import { getInitialState, applyProcess, convertHBtoHRC, MaterialState } from '@/logic/manufacturingLogic';
import { useI18nStore } from '@/store/i18nStore';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

/**
 * ManufacturingModule
 * Combined interface for Bending, Welding, CAM, and Sandbox Simulation
 */
export default function ManufacturingModule() {
    const [activeTab, setActiveTab] = useState<'bending' | 'welding' | 'cam' | 'sandbox'>('sandbox');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'bending': return <BendingCalculator />;
            case 'welding': return <WeldingCalculator />;
            case 'cam': return <CamGenerator />;
            case 'sandbox': return <ManufacturingSandbox />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
            {/* Tab Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {[
                    { id: 'sandbox', label: 'Sandbox', icon: <Sparkles className="w-4 h-4" />, color: 'blue' },
                    { id: 'bending', label: 'Bending', icon: <FoldHorizontal className="w-4 h-4" />, color: 'violet' },
                    { id: 'welding', label: 'Welding', icon: <Flame className="w-4 h-4" />, color: 'orange' },
                    { id: 'cam', label: 'CAM/G-Code', icon: <FileCode className="w-4 h-4" />, color: 'emerald' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'bending' | 'welding' | 'cam' | 'sandbox')}
                        className={`flex-1 min-w-[120px] py-3 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all
                            ${activeTab === tab.id
                                ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400 bg-${tab.color}-50/50 dark:bg-${tab.color}-900/10`
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {renderTabContent()}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// IRON-CARBON PHASE DIAGRAM (DYNAMIC SVG)
// ------------------------------------------------------------------

function PhaseDiagram({ carbonContent }: { carbonContent?: number }) {
    const width = 600;
    const height = 400;
    const padding = 50;

    // Mapping Carbon % (0-2%) to X and Temp (0-1600C) to Y
    const scaleX = (c: number) => padding + (c / 2) * (width - 2 * padding);
    const scaleY = (t: number) => height - padding - (t / 1600) * (height - 2 * padding);

    return (
        <div className="relative w-full aspect-[3/2] max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-4 shadow-inner">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-mono">
                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />

                {/* Major Phase Boundaries (Simplified for visualization) */}
                {/* Austenite (Gamma) Line */}
                <path
                    d={`M ${scaleX(0)} ${scaleY(912)} L ${scaleX(0.8)} ${scaleY(727)} L ${scaleX(2.0)} ${scaleY(1147)}`}
                    className="stroke-amber-500 fill-amber-500/10"
                    strokeWidth="2"
                    fill="none"
                />
                {/* Liquidus line (starts high) */}
                <path
                    d={`M ${scaleX(0)} ${scaleY(1538)} L ${scaleX(0.5)} ${scaleY(1495)} L ${scaleX(2.0)} ${scaleY(1147)}`}
                    className="stroke-blue-500 fill-blue-500/5"
                    strokeWidth="2"
                />
                {/* Eutectoid Horizontal Line (727C) */}
                <line x1={scaleX(0)} y1={scaleY(727)} x2={scaleX(2.0)} y2={scaleY(727)} className="stroke-red-500/30 stroke-dasharray-[4,4]" strokeDasharray="4,4" />

                {/* Labels */}
                <text x={scaleX(0.4)} y={scaleY(1000)} className="text-[14px] fill-amber-600 font-bold" textAnchor="middle">Austenite (γ)</text>
                <text x={scaleX(0.4)} y={scaleY(600)} className="text-[14px] fill-slate-500 font-bold" textAnchor="middle">Ferrite + Pearlite (α+P)</text>
                <text x={scaleX(1.4)} y={scaleY(600)} className="text-[14px] fill-slate-500 font-bold" textAnchor="middle">Cementite + Pearlite (Fe3C+P)</text>
                <text x={scaleX(1.0)} y={scaleY(1400)} className="text-[14px] fill-blue-500 font-bold" textAnchor="middle">Liquid (L)</text>

                {/* Static reference lines */}
                <line x1={scaleX(0.8)} y1={padding} x2={scaleX(0.8)} y2={height - padding} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="2,2" />
                <text x={scaleX(0.8)} y={height - padding + 15} className="text-[10px] fill-slate-400" textAnchor="middle">0.8%C (Eutectoid)</text>

                {/* Selected Material Carbon Highlight */}
                {carbonContent !== undefined && (
                    <g className="animate-pulse">
                        <line
                            x1={scaleX(carbonContent)} y1={padding}
                            x2={scaleX(carbonContent)} y2={height - padding}
                            className="stroke-blue-500" strokeWidth="3"
                        />
                        <rect
                            x={scaleX(carbonContent) - 40} y={padding - 20}
                            width="80" height="20" rx="4"
                            className="fill-blue-500 shadow-xl"
                        />
                        <text
                            x={scaleX(carbonContent)} y={padding - 6}
                            className="text-[10px] fill-white font-bold"
                            textAnchor="middle"
                        >
                            {carbonContent}% C
                        </text>
                    </g>
                )}

                {/* Axis Labels */}
                <text x={width / 2} y={height - 5} className="text-[12px] fill-slate-400 font-bold" textAnchor="middle">Carbon Content Percentage (%)</text>
                <text x={15} y={height / 2} className="text-[12px] fill-slate-400 font-bold" transform={`rotate(-90, 15, ${height / 2})`} textAnchor="middle">Temperature (°C)</text>
            </svg>

            {/* Region Details Overlay */}
            {carbonContent !== undefined && (
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg max-w-[180px]">
                    <h4 className="text-[10px] font-bold text-blue-500 uppercase mb-1">Material State</h4>
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-tight">
                        {carbonContent < 0.8 ? "Hypoeutectoid Steel: Forms Ferrite and Pearlite structure." : "Hypereutectoid Steel: Forms Cementite and Pearlite structure."}
                    </p>
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// HELPERS & CONSTANTS
// ------------------------------------------------------------------

const getRecommendedProcessId = (materialName: string): string | null => {
    const map: Record<string, string> = {
        'AISI 1045 (Carbon)': 'q-water',
        'AISI 4140 (Cr-Mo)': '4140-qo',
        '6061-T6 (US Standard)': '6061-t6-aging',
        'AISI 1018 (Mild)': '1018-cr',
        'AISI 4340 (High St)': '4340-ht',
        'SS 304 (Std)': '304-ann',
        'Alu 7075-T6': '7075-t6',
        'Titanium Gr5': 'ti-ann',
        'AISI D2 (Tool Steel)': 'd2-harden',
        'Brass (C360)': 'brass-soft',
        'Inconel 625': 'inc625-ann',
        'AISI 4130 (Chromoly)': '4130-norm',
        'SS 316 (Marine)': '316-ann',
        'St37 (S235JR)': 'st37-sr',
        'St52 (S355J2)': 'st52-sr',
        'C50 (Carbon)': 'c50-ind',
        '8620 (Case Hard.)': '8620-carburize',
        '1.2344 (H13 Hot)': 'h13-harden'
    };
    return map[materialName] || null;
};

// ------------------------------------------------------------------
// PREMIUM UI COMPONENTS (THE COCKPIT DESIGN SYSTEM)
// ------------------------------------------------------------------

function GlassCard({ children, className = "", glowColor = "blue" }: { children: React.ReactNode, className?: string, glowColor?: 'blue' | 'emerald' | 'orange' | 'amber' }) {
    const glows = {
        blue: "shadow-blue-500/10 border-blue-500/10",
        emerald: "shadow-emerald-500/10 border-emerald-500/10",
        orange: "shadow-orange-500/10 border-orange-500/10",
        amber: "shadow-amber-500/10 border-amber-500/10"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border ${glows[glowColor]} shadow-2xl rounded-[32px] p-6 ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${glowColor}-500/20 to-transparent`} />
            <div className="relative z-10 h-full">{children}</div>
        </motion.div>
    );
}

function StatHUD({ label, value, unit, icon: Icon, color = "blue", subValue }: { label: string, value: string | number, unit: string, icon: any, color?: string, subValue?: string }) {
    return (
        <div className="relative group">
            <div className={`absolute -inset-1 bg-${color}-500/5 blur-xl group-hover:bg-${color}-500/10 transition-all duration-700 rounded-full`} />
            <div className="relative flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                        <Icon className={`w-3 h-3 text-${color}-400`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 ml-1">
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{value}</span>
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{unit}</span>
                </div>
                {subValue && (
                    <div className={`text-[9px] font-bold uppercase tracking-widest mt-2 ml-1 text-${color}-400/60 border-t border-${color}-500/10 pt-1.5 w-full`}>{subValue}</div>
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// HIGH-FIDELITY STRESS-STRAIN VISUALIZER
// ------------------------------------------------------------------

function HUDCallout({ x, y, label, value, color, alignment = 'top' }: { x: number, y: number, label: string, value: string, color: string, alignment?: 'top' | 'right' | 'bottom' }) {
    const isTop = alignment === 'top';
    const isBottom = alignment === 'bottom';

    let pathD = `M ${x} ${y} L ${x} ${y - 15} L ${x + 20} ${y - 15}`;
    if (isBottom) pathD = `M ${x} ${y} L ${x} ${y + 15} L ${x + 20} ${y + 15}`;
    if (alignment === 'right') pathD = `M ${x} ${y} L ${x + 15} ${y} L ${x + 15} ${y - 10}`;

    return (
        <g className="transition-all duration-500">
            {/* Leader Line */}
            <path
                d={pathD}
                className={`stroke-${color}-500/50 fill-none`}
                strokeWidth="1"
            />
            {/* Callout Box */}
            <g transform={`translate(${alignment === 'right' ? x + 17 : x + 22}, ${isTop ? y - 30 : isBottom ? y + 5 : y - 25})`}>
                <rect width="80" height="24" rx="6" className="fill-slate-900/90 border border-white/10 backdrop-blur-md" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <rect width="3" height="24" rx="1.5" className={`fill-${color}-500`} />
                <text x="8" y="10" className={`text-[9px] font-black uppercase tracking-widest fill-${color}-400`}>{label}</text>
                <text x="8" y="20" className="text-[11px] font-black fill-white tracking-tight">{value}</text>
            </g>
        </g>
    );
}

function StressStrainChart({ yieldStrength, tensileStrength, modulus, strainHardening = 0.2, strengthCoeff = 1000, elongation = 20 }: {
    yieldStrength: number,
    tensileStrength: number,
    modulus: number,
    strainHardening?: number,
    strengthCoeff?: number,
    elongation?: number
}) {
    const width = 800;
    const height = 400;
    const padding = 45; // Reduced padding for more space

    const fractureStrain = (elongation / 100) || 0.35;
    const maxStrain = fractureStrain * 1.15; // Adaptive zoom
    const maxStress = Math.max(tensileStrength * 1.1, 400); // Adaptive vertical zoom

    const scaleX = (strain: number) => (strain / maxStrain) * (width - 2 * padding) + padding;
    const scaleY = (stress: number) => height - padding - (stress / maxStress) * (height - 2 * padding);

    const yieldStrain = (yieldStrength / (modulus * 1000));

    const points: [number, number][] = [];
    points.push([0, 0]);
    points.push([yieldStrain, yieldStrength]);

    const steps = 60;
    for (let i = 1; i <= steps; i++) {
        const strain = yieldStrain + (fractureStrain - yieldStrain) * (i / steps);
        let stress = strengthCoeff * Math.pow(strain, strainHardening);
        if (strain > fractureStrain * 0.7) {
            const neckingFactor = 1 - (strain - fractureStrain * 0.7) * 0.5;
            stress = Math.min(stress, tensileStrength) * neckingFactor;
        } else {
            stress = Math.min(stress, tensileStrength * 1.05);
        }
        points.push([strain, stress]);
    }

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p[0])} ${scaleY(p[1])}`).join(' ');
    const utsPoint = points[Math.round(points.length * 0.6)];

    return (
        <div className="relative group w-full flex flex-col items-center p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none drop-shadow-2xl">
                <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Reticle Axes */}
                {[0.1, 0.2, 0.3, 0.4].map(s => (
                    <g key={s}>
                        <line x1={scaleX(s)} y1={padding} x2={scaleX(s)} y2={height - padding} className="stroke-white/5" strokeWidth="0.5" />
                        <text x={scaleX(s)} y={height - padding + 20} className="text-[10px] fill-white/20 font-black uppercase tracking-widest" textAnchor="middle">{s}ε</text>
                    </g>
                ))}

                <line x1={padding} y1={height - padding} x2={width - padding + 40} y2={height - padding} className="stroke-white/10" strokeWidth="0.5" />
                <line x1={padding} y1={padding - 20} x2={padding} y2={height - padding} className="stroke-white/10" strokeWidth="0.5" />

                <path d={`${pathData} L ${scaleX(points[points.length - 1][0])} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`} fill="url(#curveGrad)" />

                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    d={pathData}
                    className="stroke-blue-400 fill-none"
                    strokeWidth="1.2"
                    filter="url(#glow)"
                />

                {/* HUD Elements */}
                <HUDCallout
                    x={scaleX(yieldStrain)}
                    y={scaleY(yieldStrength)}
                    label="Yield"
                    value={`${Math.round(yieldStrength)} MPa`}
                    color="blue"
                    alignment="top"
                />
                <HUDCallout
                    x={scaleX(utsPoint[0])}
                    y={scaleY(tensileStrength)}
                    label="UTS"
                    value={`${Math.round(tensileStrength)} MPa`}
                    color="emerald"
                    alignment="top"
                />
                <HUDCallout
                    x={scaleX(points[points.length - 1][0])}
                    y={scaleY(points[points.length - 1][1])}
                    label="Fracture"
                    value={`${Math.round(points[points.length - 1][1])} MPa`}
                    color="red"
                    alignment="bottom"
                />
            </svg>
        </div>
    );
}

// ------------------------------------------------------------------
// PROPERTY TRENDS CHART (CUMULATIVE CHANGES)
// ------------------------------------------------------------------

function PropertyTrendsChart({ stepStates }: { stepStates: any[] }) {
    const width = 800;
    const height = 300;
    const padding = 45;

    const maxYield = Math.max(...stepStates.map(s => s.yield)) * 1.15; // Tighter zoom
    const maxHardness = Math.max(...stepStates.map(s => s.hardness)) * 1.15; // Tighter zoom
    const maxElongation = Math.max(...stepStates.map(s => s.elongation || 20)) * 1.25;

    const scaleX = (idx: number) => (idx / (stepStates.length - 1 || 1)) * (width - 2 * padding) + padding;
    const scaleY = (val: number, max: number) => height - padding - (val / max) * (height - 2 * padding);

    const yieldPoints = stepStates.map((s, i) => [scaleX(i), scaleY(s.yield, maxYield)]);
    const hardnessPoints = stepStates.map((s, i) => [scaleX(i), scaleY(s.hardness, maxHardness)]);
    const elongationPoints = stepStates.map((s, i) => [scaleX(i), scaleY(s.elongation || 20, maxElongation)]);

    const getLinePath = (pts: number[][]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

    return (
        <div className="w-full relative py-2">
            <div className="flex gap-4 mb-6 justify-center">
                {[
                    { label: 'Strength', color: 'bg-emerald-500' },
                    { label: 'Hardness', color: 'bg-blue-500' },
                    { label: 'Ductility', color: 'bg-red-500' }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                ))}
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none transition-all">
                {/* Horizontal Scan Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <line key={v} x1={padding} y1={padding + v * (height - 2 * padding)} x2={width - padding} y2={padding + v * (height - 2 * padding)} className="stroke-white/[0.03]" strokeWidth="0.5" />
                ))}

                {/* X-Markers */}
                {stepStates.map((_, i) => (
                    <g key={i}>
                        <line x1={scaleX(i)} y1={padding} x2={scaleX(i)} y2={height - padding} className="stroke-white/[0.05]" strokeDasharray="2,4" strokeWidth="0.5" />
                        <text x={scaleX(i)} y={height - padding + 25} className="text-[11px] font-black fill-white/10 uppercase tracking-tighter" textAnchor="middle">S{i + 1}</text>
                    </g>
                ))}

                {/* Paths with precision lines */}
                <path d={getLinePath(elongationPoints)} className="stroke-red-500/20 fill-none" strokeWidth="0.8" strokeDasharray="4,2" />
                <path d={getLinePath(hardnessPoints)} className="stroke-blue-500/30 fill-none" strokeWidth="1.0" />
                <path d={getLinePath(yieldPoints)} className="stroke-emerald-500/40 fill-none" strokeWidth="1.2" />

                {/* Data Nodes */}
                {stepStates.map((s, i) => (
                    <g key={i}>
                        {/* Yield */}
                        <circle cx={scaleX(i)} cy={scaleY(s.yield, maxYield)} r="2" className="fill-slate-950 stroke-emerald-500/50 stroke-1" />
                        <text x={scaleX(i)} y={scaleY(s.yield, maxYield) + 15} className="text-[10px] font-black fill-emerald-400/80" textAnchor="middle">{Math.round(s.yield)}</text>
                        {/* Hardness */}
                        <circle cx={scaleX(i)} cy={scaleY(s.hardness, maxHardness)} r="2" className="fill-slate-950 stroke-blue-500/50 stroke-1" />
                        <text x={scaleX(i)} y={scaleY(s.hardness, maxHardness) - 12} className="text-[10px] font-black fill-blue-400/80" textAnchor="middle">{Math.round(s.hardness)}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

// ------------------------------------------------------------------
// PROCESS TIMELINE COMPONENT
// ------------------------------------------------------------------

function ProcessChainTimeline({
    chain,
    activeIndex,
    onSelect,
    onRemove
}: {
    chain: any[],
    activeIndex: number,
    onSelect: (i: number) => void,
    onRemove: (i: number) => void
}) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar px-1">
            {chain.map((step, index) => (
                <div key={`${step.id}-${index}`} className="flex items-center group/step">
                    {index > 0 && (
                        <div className="w-4 h-[1px] bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0" />
                    )}
                    <div className="relative">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(index)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelect(index)}
                            className={`flex flex-col items-center min-w-[100px] p-3 rounded-2xl border transition-all relative cursor-pointer
                                ${index === activeIndex
                                    ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                                }`}
                        >
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 mb-1">Step {index + 1}</span>
                            <span className="text-[10px] font-bold truncate max-w-[80px]">{step.method}</span>
                            {index > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/step:opacity-100 transition-opacity scale-75"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div className="ml-2 px-4 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 flex-shrink-0">
                <Sparkles className="w-3 h-3" /> Next Process
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// MANUFACTURING SANDBOX
// ------------------------------------------------------------------

export function ManufacturingSandbox() {
    const { t } = useI18nStore();
    const sandboxTitle = t.modules['manufacturing-sandbox']?.title || 'İmalat Atölyesi';

    const [selectedMaterialName, setSelectedMaterialName] = useState(MANUFACTURING_PATHS[0].materialName);
    const [processChain, setProcessChain] = useState<any[]>([{ id: 'raw', method: 'Raw Material' }]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [selectedCoatingId, setSelectedCoatingId] = useState<string | null>(null);
    const [machiningProcess, setMachiningProcess] = useState<MachiningProcess>(SURFACE_FINISH_DB[2]);
    const [showDiagram, setShowDiagram] = useState(false);

    const baseMaterial = useMemo(() =>
        MATERIALS_DB.find(m => m.name === selectedMaterialName)!,
        [selectedMaterialName]);

    const materialPath = useMemo(() =>
        MANUFACTURING_PATHS.find(p => p.materialName === selectedMaterialName)!,
        [selectedMaterialName]);

    // Cumulative Simulation calculation
    const stepStates = useMemo(() => {
        let current = getInitialState(baseMaterial);
        const results = [current];

        for (let i = 1; i < processChain.length; i++) {
            current = applyProcess(current, processChain[i]);
            results.push(current);
        }
        return results;
    }, [baseMaterial, processChain]);

    const currentState = stepStates[activeStepIndex] || stepStates[stepStates.length - 1];

    const handbookReference = useMemo(() => {
        const step = processChain[activeStepIndex];
        if (!step?.handbookSectionId) return null;
        return HANDBOOK_31_STRUCTURE.find(h => h.sections.some(s => s.id === step.handbookSectionId));
    }, [activeStepIndex, processChain]);

    const addToChain = (treatment: any) => {
        setProcessChain(prev => [...prev, treatment]);
        setActiveStepIndex(processChain.length);
    };

    const removeFromChain = (index: number) => {
        setProcessChain(prev => prev.filter((_, i) => i !== index));
        if (activeStepIndex >= index) setActiveStepIndex(Math.max(0, activeStepIndex - 1));
    };

    const currentCoating = useMemo(() =>
        SURFACE_COATING_DB.find(c => c.id === selectedCoatingId),
        [selectedCoatingId]);

    const activeTreatment = processChain[activeStepIndex]?.id !== 'raw' ? processChain[activeStepIndex] : null;


    return (
        <div className="space-y-6 pb-20 p-2 sm:p-6 animate-in fade-in duration-700 bg-slate-950 text-slate-200 min-h-screen">
            {/* Header with Title and Diagram Toggle */}
            <GlassCard className="!p-8" glowColor="blue">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black flex items-center gap-4 text-white uppercase tracking-tighter">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            {sandboxTitle}
                        </h2>
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.4em] ml-16 opacity-80">Precision Engineering Sandbox</div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowDiagram(true)}
                            className="flex-1 sm:flex-none text-[10px] bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-3 font-bold border border-white/10 uppercase tracking-widest backdrop-blur"
                        >
                            <Activity className="w-4 h-4 text-blue-400" />
                            Phase Diagram
                        </button>
                        <div className="hidden sm:flex px-4 py-3 rounded-2xl text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-[0.2em] items-center">
                            Physics Engine v3.0
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-3 space-y-4">
                    <GlassCard glowColor="blue" className="!p-4 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/20 rounded-lg"><Box className="w-3 h-3 text-blue-400" /></div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Material Core</h3>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {MANUFACTURING_PATHS.map(path => (
                                <button
                                    key={path.materialName}
                                    onClick={() => {
                                        setSelectedMaterialName(path.materialName);
                                        setProcessChain([{ id: 'raw', method: 'Raw Material' }]);
                                        setActiveStepIndex(0);
                                        setSelectedCoatingId(null);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all relative overflow-hidden group
                                        ${selectedMaterialName === path.materialName
                                            ? 'bg-blue-600/20 border-blue-500 shadow-lg'
                                            : 'bg-white/[0.02] border-white/[0.05] hover:border-blue-500/30'
                                        }`}
                                >
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="font-black text-[10px] uppercase tracking-widest">{path.materialName}</div>
                                        {selectedMaterialName === path.materialName && <Target className="w-3 h-3 text-blue-400 animate-pulse" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard glowColor="orange" className="!p-4 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-500/20 rounded-lg"><Zap className="w-3 h-3 text-orange-400" /></div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-400">Process Library</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {(() => {
                                const recommendedId = getRecommendedProcessId(selectedMaterialName);
                                const allProcesses = Array.from(new Set(MANUFACTURING_PATHS.flatMap(p => p.treatments.map(t => t.method)))).map(method => {
                                    return MANUFACTURING_PATHS.flatMap(p => p.treatments).find(treat => treat.method === method)!;
                                });

                                // Sort: Recommended first, then alphabetically
                                const sorted = [...allProcesses].sort((a, b) => {
                                    if (a.id === recommendedId) return -1;
                                    if (b.id === recommendedId) return 1;
                                    return a.method.localeCompare(b.method);
                                });

                                return sorted.map(t => {
                                    const isRecommended = t.id === recommendedId;
                                    return (
                                        <motion.button
                                            key={t.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addToChain(t)}
                                            className={`w-full text-left p-3 rounded-xl transition-all flex justify-between items-center group relative overflow-hidden
                                                ${isRecommended
                                                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)] border-2'
                                                    : 'bg-white/[0.02] border-white/[0.05] border'
                                                } hover:bg-orange-500/10 hover:border-orange-500/30`}
                                        >
                                            {isRecommended && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/15 to-transparent -translate-x-full"
                                                    animate={{ x: ['100%', '-100%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                />
                                            )}
                                            <div className="flex flex-col gap-0.5 relative z-10">
                                                <span className={`font-bold text-[9px] uppercase tracking-wider ${isRecommended ? 'text-amber-400' : 'text-white/60'} group-hover:text-white transition-colors`}>
                                                    {t.method}
                                                </span>
                                                {isRecommended && (
                                                    <span className="text-[6px] font-black text-amber-500/80 uppercase tracking-[0.2em] flex items-center gap-1">
                                                        <Sparkles className="w-2 h-2" /> Recommended State
                                                    </span>
                                                )}
                                            </div>
                                            <Maximize2 className={`w-2.5 h-2.5 ${isRecommended ? 'text-amber-400' : 'text-orange-400'} opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100`} />
                                        </motion.button>
                                    );
                                });
                            })()}
                        </div>
                    </GlassCard>

                    <GlassCard glowColor="emerald" className="!p-4 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg"><Layers className="w-3 h-3 text-emerald-400" /></div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Final Processing</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-2">Surface Finish (Ra)</label>
                                <div className="grid grid-cols-1 gap-1">
                                    {SURFACE_FINISH_DB.map(f => (
                                        <button
                                            key={f.name}
                                            onClick={() => setMachiningProcess(f)}
                                            className={`text-left p-2 rounded-lg text-[8px] font-bold transition-all border ${machiningProcess.name === f.name
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            <div className="flex justify-between">
                                                <span>{f.name}</span>
                                                <span className="opacity-60">Ra {f.raRange[0]}-{f.raRange[1]}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[7px] font-black text-white/30 uppercase tracking-widest block mb-2">Surface Coating</label>
                                <div className="grid grid-cols-1 gap-1">
                                    <button
                                        onClick={() => setSelectedCoatingId(null)}
                                        className={`text-left p-2 rounded-lg text-[8px] font-bold transition-all border ${!selectedCoatingId
                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                            : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        None / Raw
                                    </button>
                                    {SURFACE_COATING_DB.map(c => {
                                        const isCompatible = c.compatibleMaterials.some(m => selectedMaterialName.includes(m));
                                        return (
                                            <button
                                                key={c.id}
                                                disabled={!isCompatible}
                                                onClick={() => setSelectedCoatingId(c.id)}
                                                className={`text-left p-2 rounded-lg text-[8px] font-bold transition-all border relative overflow-hidden ${selectedCoatingId === c.id
                                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                    : isCompatible
                                                        ? 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'
                                                        : 'opacity-20 cursor-not-allowed bg-black/40 border-transparent text-white/10'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{c.name}</span>
                                                    {isCompatible && <span className="text-[6px] opacity-40">{c.thicknessRange}</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Results Display */}
                <div className="lg:col-span-9 space-y-4">
                    {/* Top Row: Path & HUD Stats */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                        <GlassCard className="xl:col-span-2 !p-5" glowColor="blue">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[7px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-2">
                                    <Radio className="w-3 h-3 text-blue-500" /> Tracking Active Sequence
                                </div>
                                <div className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">Cockpit v3.0</div>
                            </div>
                            <ProcessChainTimeline
                                chain={processChain}
                                activeIndex={activeStepIndex}
                                onSelect={setActiveStepIndex}
                                onRemove={removeFromChain}
                            />
                        </GlassCard>

                        <GlassCard className="xl:col-span-1 !p-5" glowColor="blue">
                            <StatHUD
                                label="Surface Hardness"
                                value={convertHBtoHRC(currentState.hardness).split(' ')[0]}
                                unit={convertHBtoHRC(currentState.hardness).split(' ')[1]}
                                icon={Gauge}
                                color="blue"
                                subValue={`${Math.round(currentState.hardness)} HB`}
                            />
                        </GlassCard>

                        <GlassCard className="xl:col-span-1 !p-5" glowColor="emerald">
                            <StatHUD
                                label="Yield Peak"
                                value={Math.round(currentState.yield)}
                                unit="MPa"
                                icon={Activity}
                                color="emerald"
                                subValue={`Factor: ${(currentState.yield / baseMaterial.yield).toFixed(2)}x`}
                            />
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <GlassCard className="xl:col-span-12 2xl:col-span-5 !p-4 min-h-[300px] flex flex-col relative" glowColor="blue">
                            <div className="absolute top-4 left-6 text-[7px] font-black uppercase tracking-[0.4em] text-white/20 z-10">Stress-Strain HUD</div>
                            <div className="w-full flex-1 flex items-center">
                                <StressStrainChart
                                    yieldStrength={currentState.yield}
                                    tensileStrength={currentState.tensile}
                                    modulus={currentState.modulus}
                                    strainHardening={currentState.strainHardening}
                                    strengthCoeff={currentState.strengthCoeff}
                                    elongation={currentState.elongation}
                                />
                            </div>
                        </GlassCard>

                        <GlassCard className="xl:col-span-12 2xl:col-span-7 !p-4 relative min-h-[300px]" glowColor="amber">
                            <div className="absolute top-4 left-6 text-[7px] font-black uppercase tracking-[0.4em] text-white/20 z-10">Material Property Monitor</div>
                            <div className="h-full flex flex-col justify-center pt-8">
                                <PropertyTrendsChart stepStates={stepStates} />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Bottom Row: Details & Surface */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GlassCard className="xl:col-span-2 !p-5" glowColor="blue">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg"><Info className="w-3 h-3 text-blue-400" /></div>
                                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Step Telemetry</h3>
                            </div>
                            {activeTreatment ? (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{activeTreatment.method}</div>
                                        <p className="text-[9px] text-white/40 leading-relaxed font-bold tracking-tight line-clamp-3">
                                            {activeTreatment.instructions || activeTreatment.description}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { label: 'Temp', val: activeTreatment.temperature || 'N/A' },
                                            { label: 'Medium', val: activeTreatment.medium || 'N/A' }
                                        ].map(item => (
                                            <div key={item.label} className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg flex items-center justify-between">
                                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{item.label}</span>
                                                <span className="text-[10px] font-black text-white/80">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-20 flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-white/10 text-[8px] font-black uppercase tracking-[0.4em]">Base State Active</div>
                            )}
                        </GlassCard>

                        <GlassCard className="!p-5 bg-gradient-to-br from-indigo-600/40 to-blue-700/40 border-blue-500/30" glowColor="blue">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[7px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Final Spec</div>
                                    <div className="text-sm font-black text-white uppercase tracking-tighter tabular-nums leading-tight">
                                        {selectedMaterialName}
                                    </div>
                                </div>
                                <div className="p-2 bg-white/10 rounded-lg"><Target className="w-3 h-3 text-white" /></div>
                            </div>
                            <div className="space-y-3 border-t border-white/10 pt-3">
                                <div className="text-[8px] text-white/40 font-bold uppercase tracking-widest line-clamp-1">
                                    {processChain.slice(1).map(p => p.method).join(' → ') || 'Unprocessed Core'}
                                </div>
                                <div className="flex items-center gap-4 text-[7px] font-black text-white/60 uppercase tracking-widest">
                                    <div className="flex items-center gap-1"><Maximize2 className="w-2 h-2 text-emerald-400" /> Ra {machiningProcess.raRange[0]}-{machiningProcess.raRange[1]}</div>
                                    <div className="flex items-center gap-1"><Sparkles className="w-2 h-2 text-blue-400" /> {selectedCoatingId ? SURFACE_COATING_DB.find(c => c.id === selectedCoatingId)?.name : 'No Coating'}</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* Phase Diagram Modal */}
            <AnimatePresence>
                {showDiagram && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Activity className="text-blue-500" />
                                    Iron-Carbon Phase Diagram
                                </h3>
                                <button
                                    onClick={() => setShowDiagram(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-auto bg-slate-950">
                                <PhaseDiagram carbonContent={baseMaterial.carbonContent} />
                            </div>
                            <div className="p-4 bg-slate-900 text-slate-400 text-[10px] leading-relaxed border-t border-white/5 px-8 py-5 text-center">
                                <div className="text-white font-bold mb-1">Material: {selectedMaterialName} (Carbon: {baseMaterial.carbonContent || 'N/A'}%)</div>
                                <div className="opacity-50 font-medium">Thermodynamic equilibrium states. Processing logic accounts for non-equilibrium phase shifts.</div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BendingCalculator() {
    const [material, setMaterial] = useState('Alu Soft (5754)');
    const [thickness, setThickness] = useState(3);
    const [radius, setRadius] = useState(3);
    const [angle, setAngle] = useState(90);

    const kFactor = (() => {
        try {
            return getKFactor(material, thickness);
        } catch {
            return 0.33;
        }
    })();

    const result = calculateBendAllowance(angle, radius, thickness, kFactor);

    return (
        <div className="space-y-6 max-w-md mx-auto p-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                    <select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
                    >
                        <option value="Alu Soft (5754)">Aluminum Soft (5754, 3003)</option>
                        <option value="Alu Hard (6061)">Aluminum Hard (6061-T6)</option>
                        <option value="Steel S235">Steel (S235, Mild)</option>
                        <option value="Stainless 304">Stainless Steel (304/316)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Thickness (mm)</label>
                        <input
                            type="number"
                            value={thickness}
                            onChange={(e) => setThickness(Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bend Radius (mm)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bend Angle (°)</label>
                    <input
                        type="range"
                        min="1"
                        max="180"
                        value={angle}
                        onChange={(e) => setAngle(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="text-right text-xs text-slate-500 mt-1">{angle}°</div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-slate-500">Bend Allowance (BA)</span>
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {result.value.toFixed(2)} <span className="text-sm text-slate-400">mm</span>
                    </span>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                    <span>K-Factor: {kFactor.toFixed(2)}</span>
                    <span>Deduction: {(2 * (Math.tan((angle * Math.PI / 180) / 2) * (radius + thickness)) - result.value).toFixed(2)} mm</span>
                </div>
            </div>

            <div className="flex justify-center py-4 opacity-50">
                <BendSvg angle={angle} radius={radius} thickness={thickness} />
            </div>
        </div>
    );
}

function WeldingCalculator() {
    const [process, setProcess] = useState<'MIG' | 'TIG'>('MIG');
    const [legSize, setLegSize] = useState(5);
    const [length, setLength] = useState(100);

    const result = calculateWeldingConsumables(process, legSize, length, process === 'MIG' ? 0.85 : 0.95);

    return (
        <div className="space-y-6 max-w-md mx-auto p-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Process</label>
                    <div className="flex gap-2">
                        {['MIG', 'TIG'].map(p => (
                            <button
                                key={p}
                                onClick={() => setProcess(p as 'MIG' | 'TIG')}
                                className={`flex-1 py-2 text-sm rounded-lg border transition-all
                                    ${process === p
                                        ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Fillet Leg Size (a) mm</label>
                        <input
                            type="number"
                            value={legSize}
                            onChange={(e) => setLegSize(Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Weld Length (mm)</label>
                        <input
                            type="number"
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block mb-1">Wire Mass Estimation</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {result.wireMass.value.toFixed(3)} <span className="text-sm text-slate-400">kg</span>
                    </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 block mb-1">Gas Volume</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {result.gasVolume.value.toFixed(1)} <span className="text-sm text-slate-400">L</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

function CamGenerator() {
    const [gcode, setGcode] = useState('');
    const [copied, setCopied] = useState(false);

    const generateSample = () => {
        const path = {
            start: { x: 0, y: 0 },
            points: [
                { x: 100, y: 0 },
                { x: 100, y: 50 },
                { x: 0, y: 50 },
                { x: 0, y: 0 }
            ]
        };
        const code = exportGCode([path], 'LASER');
        setGcode(code);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(gcode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">G-Code Output</h3>
                <div className="flex gap-2">
                    <button
                        onClick={generateSample}
                        className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Generate Sample
                    </button>
                    {gcode && (
                        <button
                            onClick={copyToClipboard}
                            className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg overflow-auto whitespace-pre custom-scrollbar">
                {gcode || '// No G-Code generated yet...'}
            </div>
        </div>
    );
}

function BendSvg({ angle, radius }: { angle: number, radius: number, thickness: number }) {
    return (
        <svg width="200" height="100" viewBox="0 0 200 100" className="stroke-slate-400 fill-none stroke-2">
            <path d={`M 20 80 L 80 80 Q 100 80 100 ${80 - radius * 2} L 100 20`} />
            <text x="110" y="50" className="text-[10px] fill-slate-500 stroke-none">{angle}°</text>
        </svg>
    );
}

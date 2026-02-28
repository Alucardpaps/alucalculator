'use client';

import { useState, useMemo } from 'react';
import { getKFactor, calculateBendAllowance, calculateWeldingConsumables } from '@/logic/manufacturing';
import { exportGCode } from '@/lib/cam/gcode';
import {
    FileCode, Flame, FoldHorizontal, Copy, Check, X,
    Sparkles, Gauge, Thermometer, Activity, Info,
    Box, BookOpen, ExternalLink, Layers
} from 'lucide-react';
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
// STRESS-STRAIN VISUALIZER
// ------------------------------------------------------------------

function StressStrainChart({ yieldStrength, tensileStrength, modulus, strainHardening = 0.2, strengthCoeff = 1000 }: {
    yieldStrength: number,
    tensileStrength: number,
    modulus: number,
    strainHardening?: number,
    strengthCoeff?: number
}) {
    const width = 300;
    const height = 150;
    const padding = 20;

    const maxStress = tensileStrength * 1.3;
    const maxStrain = 0.4;

    const scaleX = (strain: number) => (strain / maxStrain) * (width - 2 * padding) + padding;
    const scaleY = (stress: number) => height - padding - (stress / maxStress) * (height - 2 * padding);

    const yieldStrain = (yieldStrength / (modulus * 1000));
    const points: [number, number][] = [];

    points.push([0, 0]);
    points.push([yieldStrain, yieldStrength]);

    const steps = 20;
    const breakingStrain = 0.35;
    for (let i = 1; i <= steps; i++) {
        const strain = yieldStrain + (breakingStrain - yieldStrain) * (i / steps);
        const stress = strengthCoeff * Math.pow(strain, strainHardening);
        points.push([strain, Math.min(stress, tensileStrength * 1.1)]);
    }

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p[0])} ${scaleY(p[1])}`).join(' ');

    return (
        <div className="relative group">
            <svg width={width} height={height} className="overflow-visible">
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x={width - padding} y={height - 2} className="text-[8px] fill-slate-400 text-right" textAnchor="end">Strain (ε)</text>
                <text x={2} y={padding} className="text-[8px] fill-slate-400" transform={`rotate(-90, 2, ${padding})`} textAnchor="end">Stress (σ)</text>
                <line
                    x1={padding} y1={scaleY(yieldStrength)} x2={width - padding} y2={scaleY(yieldStrength)}
                    className="stroke-blue-500/20 stroke-dasharray-[2,2]" strokeDasharray="2,2"
                />
                <text x={padding + 5} y={scaleY(yieldStrength) - 2} className="text-[7px] fill-blue-500/50 font-bold uppercase">Yield</text>
                <path
                    d={pathData}
                    className="stroke-blue-500 dark:stroke-blue-400 fill-none transition-all duration-500"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx={scaleX(yieldStrain)} cy={scaleY(yieldStrength)} r="3" className="fill-blue-500 shadow-lg" />
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
                        <button
                            onClick={() => onSelect(index)}
                            className={`flex flex-col items-center min-w-[100px] p-3 rounded-2xl border transition-all relative
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
                        </button>
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
        <div className="space-y-6 pb-20 p-2 sm:p-4 animate-in fade-in duration-500">
            {/* Header with Title and Diagram Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        {sandboxTitle}
                    </h2>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-12">Experimental Multi-Stage Sandbox</div>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowDiagram(true)}
                        className="flex-1 sm:flex-none text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-widest"
                    >
                        <Activity className="w-4 h-4" />
                        Phase Diagram
                    </button>
                    <span className="hidden sm:flex px-3 py-2 rounded-xl text-[9px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider items-center">
                        Physics-Based Simulation
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 flex items-center gap-2">
                            <Box className="w-4 h-4" /> 1. Select Material
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {MANUFACTURING_PATHS.map(path => (
                                <button
                                    key={path.materialName}
                                    onClick={() => {
                                        setSelectedMaterialName(path.materialName);
                                        setProcessChain([{ id: 'raw', method: 'Raw Material' }]);
                                        setActiveStepIndex(0);
                                        setSelectedCoatingId(null);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all border ${selectedMaterialName === path.materialName
                                        ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold">{path.materialName}</div>
                                            <div className={`text-[9px] uppercase font-medium ${selectedMaterialName === path.materialName ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {MATERIALS_DB.find(m => m.name === path.materialName)?.category} Grade
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
                                <Thermometer className="w-4 h-4" /> 2. Add to Chain (HT)
                            </h3>
                            <div className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[8px] font-black uppercase">Experimental</div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {/* In Sandbox mode, we show ALL treatments from ALL paths for experimentation */}
                            {Array.from(new Set(MANUFACTURING_PATHS.flatMap(p => p.treatments.map(t => t.method)))).map(method => {
                                const t = MANUFACTURING_PATHS.flatMap(p => p.treatments).find(treat => treat.method === method)!;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => addToChain(t)}
                                        className="w-full text-left px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm transition-all hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-500 transition-colors uppercase text-xs">{t.method}</span>
                                            <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40">
                                                <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-orange-500" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Results Display */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Process Timeline */}
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm border-b-4 border-b-blue-500/20">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center justify-between">
                            <span>Process Path Sequence</span>
                            <span className="text-blue-500">Step {activeStepIndex + 1} Selected</span>
                        </div>
                        <ProcessChainTimeline
                            chain={processChain}
                            activeIndex={activeStepIndex}
                            onSelect={setActiveStepIndex}
                            onRemove={removeFromChain}
                        />
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center min-h-[220px]">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6 self-start">Engineering Stress-Strain</span>
                            <StressStrainChart
                                yieldStrength={currentState.yield}
                                tensileStrength={currentState.tensile}
                                modulus={currentState.modulus}
                                strainHardening={currentState.strainHardening}
                                strengthCoeff={currentState.strengthCoeff}
                            />
                        </div>

                        <div className="grid grid-rows-2 gap-4">
                            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 block mb-2">Hardness at Step {activeStepIndex + 1}</span>
                                <div className="text-5xl font-black mb-1 tracking-tighter">{convertHBtoHRC(currentState.hardness)}</div>
                                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{processChain[activeStepIndex]?.method}</div>
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                                    <Gauge size={120} />
                                </div>
                            </div>

                            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block mb-2">Yield Strength</span>
                                <div className="text-5xl font-black mb-1 tracking-tighter">
                                    {Math.round(currentState.yield)} <span className="text-lg font-normal text-white/20">MPa</span>
                                </div>
                                <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Base: {baseMaterial.yield} MPa</div>
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                                    <Activity size={120} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full shadow-sm">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Process Details
                                </h3>
                                {activeTreatment ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-3">{activeTreatment.method}</h4>
                                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
                                                {activeTreatment.instructions || activeTreatment.description}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Temperature</div>
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-200">{activeTreatment.temperature || 'N/A'}</div>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Quench Medium</div>
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-200">{activeTreatment.medium || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400 gap-3 grayscale opacity-50">
                                        <Box className="w-8 h-8 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Base Material State</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Property Insight</h4>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic">
                                    {activeTreatment?.bestFor || materialPath.machiningNotes}
                                </p>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> Final Finish & Coating
                                </h3>
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Surface Coating System</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSelectedCoatingId(null)}
                                            className={`px-4 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest ${!selectedCoatingId ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400'}`}
                                        >
                                            UNCOATED (RAW)
                                        </button>
                                        {SURFACE_COATING_DB.filter(c => c.compatibleMaterials.includes(baseMaterial.category)).map(coating => (
                                            <button
                                                key={coating.id}
                                                onClick={() => setSelectedCoatingId(coating.id)}
                                                className={`px-4 py-3 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-widest ${selectedCoatingId === coating.id ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-400'}`}
                                            >
                                                {coating.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Machining Precision (Ra)</label>
                                    <select
                                        value={machiningProcess.name}
                                        onChange={(e) => setMachiningProcess(SURFACE_FINISH_DB.find(p => p.name === e.target.value)!)}
                                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-black uppercase appearance-none outline-none focus:ring-2 ring-orange-500/20 transition-all cursor-pointer tracking-widest"
                                    >
                                        {SURFACE_FINISH_DB.map(p => (
                                            <option key={p.name} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-950 rounded-2xl space-y-4 border border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Surface Quality</span>
                                    <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-[9px] font-black tracking-widest shadow-lg shadow-blue-500/20 animate-pulse">
                                        {machiningProcess.raRange[0]} - {machiningProcess.raRange[1]} µm
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div style={{ width: (machiningProcess.raRange[0] / 50 * 100) + '%' }} className="h-full bg-slate-400/10" />
                                    <div style={{ width: ((machiningProcess.raRange[1] - machiningProcess.raRange[0]) / 50 * 100) + '%' }} className="h-full bg-blue-500" />
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-3xl shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Final System Spec</h4>
                                        <div className="text-lg font-black leading-tight uppercase tracking-tight">
                                            {selectedMaterialName} <br />
                                            <span className="text-xs opacity-80">{processChain.slice(1).map(p => p.method).join(' → ') || 'Raw state'}</span>
                                        </div>
                                    </div>
                                    <Layers className="w-6 h-6 opacity-30 group-hover:rotate-12 transition-transform duration-500" />
                                </div>
                                {currentCoating && (
                                    <div className="mt-4 pt-4 border-t border-white/20">
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentCoating.benefits.map(b => (
                                                <span key={b} className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm">{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
                <div className="lg:col-span-12">
                    <section className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Engineering Documentation</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Verify structural changes against machinery handbook standards.</p>
                            </div>
                        </div>
                        {handbookReference ? (
                            <button
                                onClick={() => {/* navigate to handbook */ }}
                                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-blue-500 hover:border-blue-500 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                Open Handbook: Section {activeTreatment?.handbookSectionId || 'HT'}
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Reference Available</div>
                        )}
                    </section>
                </div>
            </div>

            {/* Phase Diagram Modal */}
            {showDiagram && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                <Activity className="text-blue-500" />
                                Iron-Carbon Phase Diagram
                            </h3>
                            <button
                                onClick={() => setShowDiagram(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-auto bg-slate-50 dark:bg-slate-950/50">
                            <PhaseDiagram carbonContent={baseMaterial.carbonContent} />
                        </div>
                        <div className="p-4 bg-slate-900 text-slate-400 text-[10px] leading-relaxed border-t border-slate-800 px-8 py-4 text-center">
                            <div className="text-white font-bold mb-1">Current Material: {selectedMaterialName} (Carbon: {baseMaterial.carbonContent || 'N/A'}%)</div>
                            The diagram shows thermodynamic equilibrium phases. Heat treatments like Quenching bypass these regions to form non-equilibrium Martensite.
                        </div>
                    </div>
                </div>
            )}
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

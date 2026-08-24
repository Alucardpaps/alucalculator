/**
 * modules/finance/RealTimeCost/index.tsx
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useCostStore } from './store';
import { DollarSign, Coins, Timer, Ruler, TrendingDown, Sparkles, PieChart, Info, ArrowUpRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getRealTimeCostStrings } from '@/locales/realTimeCostTranslations';

// --- PROCESS EFFICIENCY SCORING ---

interface EfficiencyGrade {
    grade: string;
    label: string;
    colorClass: string;
}

/**
 * Computes a deterministic process efficiency grade based on cost breakdown ratios.
 */
function computeEfficiencyGrade(matPct: number, mfgPct: number, t: any): EfficiencyGrade {
    if (matPct > 50 && mfgPct < 30) {
        return { grade: 'A+', label: t.optimalEff, colorClass: 'text-emerald-400' };
    }
    if (matPct > 40 && mfgPct < 40) {
        return { grade: 'A', label: t.highlyEff, colorClass: 'text-emerald-500' };
    }
    if (matPct > 30) {
        return { grade: 'B', label: t.acceptableOverhead, colorClass: 'text-amber-400' };
    }
    return { grade: 'C', label: t.excessiveOverhead, colorClass: 'text-red-400' };
}

// --- DYNAMIC INSIGHT GENERATION ---

interface CostInsight {
    title: string;
    badgeText: string;
    badgeColorScheme: 'blue' | 'amber' | 'rose' | 'emerald';
    description: string;
}

/**
 * Generates actionable manufacturing insights derived from the real cost breakdown.
 */
function generateInsights(
    materialCost: number,
    machiningCost: number,
    weldingCost: number,
    totalCost: number,
    weightKg: number,
    t: any,
): CostInsight[] {
    const insights: CostInsight[] = [];
    const matPct = totalCost > 0 ? (materialCost / totalCost) * 100 : 0;
    const mfgPct = totalCost > 0 ? (machiningCost / totalCost) * 100 : 0;
    const wldPct = totalCost > 0 ? (weldingCost / totalCost) * 100 : 0;
    const costPerKg = weightKg > 0 ? totalCost / weightKg : 0;
    const overheadPct = totalCost > 0 ? ((totalCost - materialCost) / totalCost) * 100 : 0;

    // Determine the dominant cost driver
    const categories = [
        { name: 'Material', cost: materialCost, pct: matPct },
        { name: 'Machining', cost: machiningCost, pct: mfgPct },
        { name: 'Welding', cost: weldingCost, pct: wldPct },
    ].sort((a, b) => b.cost - a.cost);
    const dominant = categories[0];
    const second = categories[1];

    const localNames: Record<string, string> = {
        Material: t.material,
        Machining: t.mfg,
        Welding: t.welding
    };

    // Insight 1: Manufacturing Dominance & Optimization
    if (dominant.name === 'Machining' && dominant.pct > 50) {
        insights.push({
            title: t.insights.machiningDominantTitle,
            badgeText: t.insights.machiningDominantBadge.replace('{pct}', dominant.pct.toFixed(0)),
            badgeColorScheme: 'blue',
            description: t.insights.machiningDominantDesc
                .replace('${cost}', machiningCost.toFixed(2))
                .replace('{pct}', dominant.pct.toFixed(1)),
        });
    } else if (dominant.name === 'Material' && dominant.pct > 60) {
        insights.push({
            title: t.insights.materialHeavyTitle,
            badgeText: t.insights.materialHeavyBadge.replace('{pct}', dominant.pct.toFixed(0)),
            badgeColorScheme: 'amber',
            description: t.insights.materialHeavyDesc
                .replace('${cost}', materialCost.toFixed(2))
                .replace('{pct}', dominant.pct.toFixed(1))
                .replace('${costPerKg}', costPerKg.toFixed(2)),
        });
    } else if (dominant.name === 'Welding' && dominant.pct > 30) {
        insights.push({
            title: t.insights.weldingIntensiveTitle,
            badgeText: t.insights.weldingIntensiveBadge.replace('{pct}', dominant.pct.toFixed(0)),
            badgeColorScheme: 'rose',
            description: t.insights.weldingIntensiveDesc
                .replace('${cost}', weldingCost.toFixed(2))
                .replace('{pct}', dominant.pct.toFixed(1))
                .replace('${saving}', (weldingCost * 0.3).toFixed(2)),
        });
    } else {
        insights.push({
            title: t.insights.balancedTitle,
            badgeText: t.insights.balancedBadge.replace('{pct}', dominant.pct.toFixed(0)).replace('{name}', localNames[dominant.name].toLowerCase()),
            badgeColorScheme: 'emerald',
            description: t.insights.balancedDesc
                .replace('{dominant}', localNames[dominant.name])
                .replace('{dominantPct}', dominant.pct.toFixed(1))
                .replace('{secondPct}', second.pct.toFixed(1))
                .replace('{second}', localNames[second.name]),
        });
    }

    // Insight 2: Material Efficiency / Overhead Analysis
    if (overheadPct > 70) {
        insights.push({
            title: t.insights.highOverheadTitle,
            badgeText: t.insights.highOverheadBadge.replace('{pct}', overheadPct.toFixed(0)),
            badgeColorScheme: 'rose',
            description: t.insights.highOverheadDesc
                .replace('{pct}', overheadPct.toFixed(1))
                .replace('${overhead}', (totalCost - materialCost).toFixed(2)),
        });
    } else if (overheadPct < 40) {
        insights.push({
            title: t.insights.lowOverheadTitle,
            badgeText: t.insights.lowOverheadBadge.replace('{pct}', overheadPct.toFixed(0)),
            badgeColorScheme: 'emerald',
            description: t.insights.lowOverheadDesc
                .replace('{pct}', overheadPct.toFixed(1))
                .replace('${overhead}', (totalCost - materialCost).toFixed(2))
                .replace('${costPerKg}', costPerKg.toFixed(2)),
        });
    } else {
        insights.push({
            title: t.insights.efficiencyAnalysisTitle,
            badgeText: t.insights.efficiencyAnalysisBadge.replace('${costPerKg}', costPerKg.toFixed(1)),
            badgeColorScheme: 'amber',
            description: t.insights.efficiencyAnalysisDesc
                .replace('${costPerKg}', costPerKg.toFixed(2))
                .replace('{pct}', overheadPct.toFixed(1))
                .replace('${saving}', (materialCost * 0.1).toFixed(2)),
        });
    }

    return insights;
}

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    hover: 'hover:border-blue-500/30' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20',   hover: 'hover:border-amber-500/30' },
    rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    hover: 'hover:border-rose-500/30' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/30' },
};

export default function RealTimeCostModule() {
    const { language } = useI18nStore();
    const t = getRealTimeCostStrings(language);

    const { input, result, setInput } = useCostStore();
    const [isSimulating, setIsSimulating] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Trigger initial calculation
    useEffect(() => {
        setInput({}); // Forces calc via store logic
    }, []);

    // Simulate AI thinking time when inputs change drastically
    const handleInput = (key: string, value: number) => {
        setIsSimulating(true);
        setInput({ [key]: value });
        setTimeout(() => setIsSimulating(false), 400);
    };

    const total = result?.totalCost || 0;
    const matPct = total > 0 ? ((result?.materialCost || 0) / total) * 100 : 0;
    const mfgPct = total > 0 ? ((result?.machiningCost || 0) / total) * 100 : 0;
    const wldPct = total > 0 ? ((result?.weldingCost || 0) / total) * 100 : 0;

    const efficiencyGrade = useMemo(
        () => computeEfficiencyGrade(matPct, mfgPct, t),
        [matPct, mfgPct, t],
    );

    const insights = useMemo(
        () => generateInsights(
            result?.materialCost || 0,
            result?.machiningCost || 0,
            result?.weldingCost || 0,
            total,
            result?.weightKg || 0,
            t,
        ),
        [result, total, t],
    );

    return (
        <div className="flex h-full bg-[#0a0f16] text-slate-200 p-4 gap-4 overflow-hidden">
            {/* Left Column: Tweak Controls */}
            <div className="w-[350px] flex flex-col gap-4 overflow-y-auto no-scrollbar pb-12 pr-1">
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <DollarSign className="text-emerald-400 w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-base font-bold tracking-tight text-emerald-50">{t.title}</h2>
                        <div className="text-[10px] text-emerald-500/60 font-mono tracking-wider">{t.subtitle}</div>
                    </div>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
                        title="Module Info"
                    >
                        <HelpCircle size={14} />
                    </button>
                </div>

                {showInfo && (
                    <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3 text-xs text-emerald-300/80 leading-relaxed mx-1">
                        <Info size={12} className="inline mr-1.5 -mt-0.5 text-emerald-400" />
                        {t.description}
                    </div>
                )}

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-5 shadow-lg backdrop-blur text-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Coins size={14} className="text-amber-500" /> {t.materialContext}</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-400">{t.yieldVolume} (cm³)</label>
                                <span className="text-[10px] text-slate-500 font-mono">{input.materialVolumeCm3}</span>
                            </div>
                            <input
                                type="range" min="10" max="5000" step="10"
                                value={input.materialVolumeCm3}
                                onChange={e => handleInput('materialVolumeCm3', Number(e.target.value))}
                                className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                                <label className="block text-[10px] text-slate-500 mb-1">{t.density} (g/cm³)</label>
                                <input
                                    type="number" step="0.1"
                                    value={input.materialDensityGcm3}
                                    onChange={e => handleInput('materialDensityGcm3', Number(e.target.value))}
                                    className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                                />
                            </div>
                            <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                                <label className="block text-[10px] text-slate-500 mb-1">{t.rawCost} ($/kg)</label>
                                <input
                                    type="number" step="0.5"
                                    value={input.rawMaterialCostPerKg}
                                    onChange={e => handleInput('rawMaterialCostPerKg', Number(e.target.value))}
                                    className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 pt-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Timer size={14} className="text-blue-400" /> {t.machiningContext}</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-400">{t.cncRuntime} (hrs)</label>
                                <span className="text-[10px] text-slate-500 font-mono">{input.estimatedMachiningHours}h</span>
                            </div>
                            <input
                                type="range" min="0" max="24" step="0.5"
                                value={input.estimatedMachiningHours}
                                onChange={e => handleInput('estimatedMachiningHours', Number(e.target.value))}
                                className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg flex justify-between items-center">
                            <label className="text-[10px] text-slate-500">{t.machineOpRate} ($/hr)</label>
                            <input
                                type="number" step="5"
                                value={input.machineHourlyRate}
                                onChange={e => handleInput('machineHourlyRate', Number(e.target.value))}
                                className="w-20 bg-transparent text-right text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 pt-2">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Ruler size={14} className="text-rose-400" /> {t.weldingAssembly}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                            <label className="block text-[10px] text-slate-500 mb-1">{t.weldLength} (m)</label>
                            <input
                                type="number" step="0.5"
                                value={input.weldingLengthMeters}
                                onChange={e => handleInput('weldingLengthMeters', Number(e.target.value))}
                                className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                        <div className="bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg">
                            <label className="block text-[10px] text-slate-500 mb-1">{t.costRate} ($/m)</label>
                            <input
                                type="number" step="1"
                                value={input.weldingCostPerMeter}
                                onChange={e => handleInput('weldingCostPerMeter', Number(e.target.value))}
                                className="w-full bg-transparent text-slate-200 text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Analytics & Strategy */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">

                {/* Hero Number */}
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-900/30 rounded-2xl p-6 relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                                {t.projectedCost} {isSimulating && <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-400"></span>}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-white tracking-tighter">${total.toFixed(2)}</span>
                                <span className="text-slate-500 font-mono text-sm">{t.unit}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t.massProp}</div>
                            <div className="text-xl font-mono text-slate-300">{result?.weightKg.toFixed(3)} <span className="text-sm text-slate-600">kg</span></div>
                        </div>
                    </div>

                    {/* Breakdown Bar */}
                    <div className="mt-8">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-2 uppercase tracking-wider">
                            <span>{t.material} ({matPct.toFixed(0)}%)</span>
                            <span>{t.mfg} ({mfgPct.toFixed(0)}%)</span>
                            <span>{t.welding} ({wldPct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex transition-all duration-500">
                            <div className="bg-amber-500/80 transition-all duration-500" style={{ width: `${matPct}%` }}></div>
                            <div className="bg-blue-500/80 transition-all duration-500" style={{ width: `${mfgPct}%` }}></div>
                            <div className="bg-rose-500/80 transition-all duration-500" style={{ width: `${wldPct}%` }}></div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pl-1">
                            <div className="font-mono text-xs text-amber-500/90">${result?.materialCost.toFixed(2)}</div>
                            <div className="font-mono text-xs text-blue-500/90 text-center">${result?.machiningCost.toFixed(2)}</div>
                            <div className="font-mono text-xs text-rose-500/90 text-right">${result?.weldingCost.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="flex-1 bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-200">{t.analysisTitle}</h3>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-[calc(100%-40px)]">

                        {/* Dynamic Insight Cards */}
                        <div className="flex flex-col gap-3">
                            {insights.map((insight, idx) => {
                                const colors = BADGE_COLORS[insight.badgeColorScheme];
                                return (
                                    <div key={idx} className={`p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 ${colors.hover} transition-colors`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`flex items-center gap-2 ${colors.text} font-medium text-sm`}>
                                                {idx === 0 ? <ArrowUpRight size={16} /> : <TrendingDown size={16} />}
                                                {insight.title}
                                            </div>
                                            <span className={`text-[10px] font-mono ${colors.bg} ${colors.text} px-2 py-0.5 rounded border ${colors.border}`}>
                                                {insight.badgeText}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {insight.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Process Efficiency Score */}
                        <div className="bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col justify-center relative inner-shadow">

                            <div className="absolute top-3 right-3 text-slate-600"><PieChart size={18} /></div>
                            <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">{t.efficiencyScore}</h4>

                            <div className="flex items-end gap-3 mb-6">
                                <span className={`text-5xl font-black ${efficiencyGrade.colorClass}`}>{efficiencyGrade.grade}</span>
                                <span className={`${efficiencyGrade.colorClass} text-sm font-medium mb-1`}>
                                    {efficiencyGrade.label}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    {matPct > 40
                                        ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                        : <Info size={14} className="text-amber-500 flex-shrink-0" />}
                                    {matPct > 40
                                        ? t.materialHealthy.replace('{pct}', matPct.toFixed(1))
                                        : t.materialOverhead.replace('{pct}', matPct.toFixed(1))}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    {mfgPct < 40
                                        ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                        : <Info size={14} className="text-amber-500 flex-shrink-0" />}
                                    {mfgPct < 40
                                        ? t.machiningHealthy.replace('{pct}', mfgPct.toFixed(1))
                                        : t.machiningOver.replace('{pct}', mfgPct.toFixed(1))}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    {wldPct < 20
                                        ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                        : <Info size={14} className="text-amber-500 flex-shrink-0" />}
                                    {wldPct < 20
                                        ? t.weldingOptimized
                                        : t.weldingOver.replace('{pct}', wldPct.toFixed(1))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

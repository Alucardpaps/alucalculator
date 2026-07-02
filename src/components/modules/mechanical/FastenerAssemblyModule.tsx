'use client';

import { getFastenerAssemblyStrings, formatIntegrityPassDesc } from '@/locales/fastenerAssemblyUiTranslations';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Wrench, Download, RotateCcw, Box, 
    ArrowRight, Ruler, Cpu, ShieldAlert, CheckCircle, Info, Activity, AlertTriangle, FileText
} from 'lucide-react';
import { SaveButton } from "@/components/calculation/SaveButton";
import { THREAD_STANDARDS } from '@/data/boltNutStandards';
import {
    computeBoltAssembly,
    parseFastenerSearchParams,
    buildGeometryLinkParams,
    type TorquePageStandard,
} from '@/lib/fastener/sharedEngine';
import { FastenerAssemblyBlueprint } from './FastenerAssemblyBlueprint';
import { FastenerInteractiveSchematic } from './FastenerInteractiveSchematic';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useI18nStore } from "@/store/i18nStore";
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell
} from 'recharts';

export default function FastenerAssemblyModule() {
    const { language } = useI18nStore();
    const t = getFastenerAssemblyStrings(language);
    const searchParams = useSearchParams();

    // Technical State
    const [threadStandard, setThreadStandard] = useState<TorquePageStandard>('Metric Coarse');
    const [size, setSize] = useState('M12');
    
    // Custom properties
    const [customDia, setCustomDia] = useState(12);
    const [pitch, setPitch] = useState(1.75); // Used for custom or as display
    
    const [grade, setGrade] = useState('8.8');
    const [length, setLength] = useState(50);
    const [muThread, setMuThread] = useState(0.15);
    const [muHead, setMuHead] = useState(0.15);
    const [yieldUtilization, setYieldUtilization] = useState(90);
    
    // UI Tab State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'dimensions' | 'verification'>('dashboard');
    const [isExporting, setIsExporting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const { standard: qsStd, size: qsSize, grade: qsGrade } = parseFastenerSearchParams(searchParams.toString());
        if (qsStd) setThreadStandard(qsStd as TorquePageStandard);
        if (qsSize) setSize(qsSize);
        if (qsGrade) setGrade(qsGrade);
    }, [searchParams]);
    
    const printRef = useRef<HTMLDivElement>(null);

    // When standard changes, keep size if still valid
    useEffect(() => {
        if (threadStandard === 'Custom') return;
        const available = THREAD_STANDARDS.filter(t => t.type === threadStandard).map(t => t.size);
        if (available.includes(size)) return;
        setSize(available[0] || size);
    }, [threadStandard, size]);

    const results = useMemo(() => computeBoltAssembly({
        threadStandard,
        size,
        customDia,
        pitch,
        grade,
        muThread,
        muHead,
        yieldUtilization,
        clearanceSeries: 'normal',
    }), [threadStandard, size, customDia, pitch, grade, muThread, muHead, yieldUtilization]);

    // Chart data for Torque vs Preload Curve
    const chartData = useMemo(() => {
        const points = [];
        const maxTorque = results.MA * 1.3;
        const step = maxTorque / 10;
        
        for (let i = 0; i <= 10; i++) {
            const currentT = i * step;
            // Preload (F_m) = T / (K * d_nom) in kN
            const currentF = currentT > 0 ? (currentT / (results.K * (results.d_nom / 1000))) / 1000 : 0;
            
            points.push({
                torque: Number(currentT.toFixed(0)),
                preload: Number(currentF.toFixed(1)),
                limit: Number(results.Fm_max.toFixed(1))
            });
        }
        return points;
    }, [results]);

    // Donut chart data for Torque distribution
    const distributionData = useMemo(() => {
        const totalK = results.K1 + results.K2 + results.K3;
        if (totalK <= 0) return [];
        const p1 = (results.K1 / totalK) * 100;
        const p2 = (results.K2 / totalK) * 100;
        const p3 = (results.K3 / totalK) * 100;
        
        return [
            { name: t.usefulWork, value: Number(p1.toFixed(1)), color: '#10b981' }, 
            { name: t.threadLoss, value: Number(p2.toFixed(1)), color: '#f59e0b' }, 
            { name: t.underheadLoss, value: Number(p3.toFixed(1)), color: '#3b82f6' }
        ];
    }, [results, t]);

    // PDF Generation
    const exportToPDF = async () => {
        if (!printRef.current) return;
        try {
            setIsExporting(true);
            printRef.current.style.display = 'block';
            printRef.current.style.position = 'absolute';
            printRef.current.style.top = '-9999px';
            printRef.current.style.left = '-9999px';
            
            const dataUrl = await toPng(printRef.current, { 
                quality: 1, 
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
            pdf.save(`Fastener_Blueprint_${size}.pdf`);
            
        } catch (err) {
            console.error('PDF export failed', err);
        } finally {
            if (printRef.current) printRef.current.style.display = 'none';
            setIsExporting(false);
        }
    };

    const blueprintLabels = {
        title: t.blueprintTitle,
        subtitle: t.blueprintSubtitle,
        partHead: t.partHead,
        partShank: t.partShank,
        partThread: t.partThread,
        partNut: t.partNut,
        partWasher: t.partWasher,
        plateA: t.plateA,
        plateB: t.plateB,
        gripZone: t.gripZone,
        preload: t.preload,
        torque: t.torque,
        legend: t.legend,
        tension: t.tension,
        clearance: t.clearance,
        grade: t.grade,
    };

    const standardsList = ['Metric Coarse', 'Metric Fine', 'UNC', 'UNF', 'Pipe', 'Trapezoidal', 'Custom'];
    const engagementRatio = results.nutDim?.height ? results.nutDim.height / results.d_nom : 0;
    const clearanceSource = results.geometry.clearanceNormal ? 'ISO 273 table' : 'computed fallback';
    const productionChecks = [
        { label: 'Thread geometry source', value: results.geometry.source === 'table' ? 'Catalog/Table' : 'Computed', ok: results.geometry.source === 'table' },
        { label: 'Clearance hole source', value: clearanceSource, ok: !!results.geometry.clearanceNormal },
        { label: 'Nut engagement', value: `${engagementRatio.toFixed(2)} x d`, ok: engagementRatio >= 0.75 },
        { label: 'Yield utilization', value: `${yieldUtilization}%`, ok: yieldUtilization <= 90 },
        { label: 'VDI torque factor K', value: results.K.toFixed(4), ok: results.K > 0.08 && results.K < 0.35 },
    ];

    // Yield Utilization color states
    const utilColor = yieldUtilization > 90 ? '#ef4444' : yieldUtilization > 75 ? '#f97316' : '#10b981';
    const utilBg = yieldUtilization > 90 ? 'bg-red-500/10 border-red-500/30 text-red-400' : yieldUtilization > 75 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

    return (
        <div className="h-full flex flex-col overflow-hidden relative text-[#c5c6c7]">
            <div className="absolute inset-0 bg-[#020408]" />
            
            {/* TOP BAR / HEADER */}
            <div className="relative z-10 flex-shrink-0 px-6 py-4 border-b border-white/5 bg-[#020408] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                        <Wrench className="text-orange-400" size={20} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-black italic tracking-tight text-white uppercase truncate">
                            Bolt Torque & Preload <span className="text-orange-500">Workbench</span>
                        </h1>
                        <p className="text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase truncate">{t.subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={exportToPDF} disabled={isExporting}
                        className={`px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap`}>
                        {isExporting ? <RotateCcw size={13} className="animate-spin" /> : <Download size={13} />}
                        {isExporting ? t.generating : t.exportPdf}
                    </button>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4 overflow-hidden">
                
                {/* LEFT CONTROL PANEL (INPUTS) */}
                <div className="flex flex-col min-h-0 bg-[#06090e]/60 border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar gap-5">
                    
                    {/* Thread Standard Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">{t.threadStandard}</label>
                        <select 
                            value={threadStandard} 
                            onChange={(e) => setThreadStandard(e.target.value as TorquePageStandard)}
                            className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-orange-500/50 cursor-pointer"
                        >
                            {standardsList.map((std) => (
                                <option key={std} value={std}>{std}</option>
                            ))}
                        </select>
                    </div>

                    <hr className="border-white/5" />

                    {/* Geometry parameters */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">{t.stdSize}</h3>
                            <Box size={14} className="text-white/20" />
                        </div>
                        
                        {threadStandard === 'Custom' ? (
                            <div className="space-y-4">
                                <ControlSlider label={t.nomDia} value={customDia} min={3} max={100} step={1} unit="mm" onChange={setCustomDia} />
                                <ControlSlider label={t.pitchLead} value={pitch} min={0.2} max={10} step={0.05} unit="mm" onChange={setPitch} />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <select value={size} onChange={(e) => setSize(e.target.value)}
                                    className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-orange-500/50 cursor-pointer">
                                    {THREAD_STANDARDS.filter(th => th.type === threadStandard).map(th => (
                                        <option key={th.size} value={th.size}>{th.size} (Ø{th.diameter}mm)</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <ControlSlider label={t.length} value={length} min={10} max={300} step={5} unit="mm" onChange={setLength} />
                    </div>

                    <hr className="border-white/5" />

                    {/* Preload utilization & property class */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">Fastener Grade</h3>
                            <Activity size={14} className="text-white/20" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-mono text-white/30">{t.grade}</label>
                            <div className="flex gap-2">
                                {['8.8', '10.9', '12.9'].map((g) => (
                                    <button 
                                        key={g} 
                                        onClick={() => setGrade(g)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            grade === g 
                                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/30' 
                                                : 'bg-[#0a0f18] text-white/30 border-white/5 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ControlSlider label={t.yieldUtil} value={yieldUtilization} min={10} max={100} step={5} unit="%" onChange={setYieldUtilization} />
                    </div>

                    <hr className="border-white/5" />

                    {/* Friction parameters */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">Friction Coefficients</h3>
                        <ControlSlider label={t.threadFriction} value={muThread} min={0.05} max={0.35} step={0.01} unit="" onChange={setMuThread} />
                        <ControlSlider label={t.headFriction} value={muHead} min={0.05} max={0.35} step={0.01} unit="" onChange={setMuHead} />
                    </div>

                    {/* Shared geometry link */}
                    <div className="mt-auto pt-4 border-t border-white/5">
                        <Link 
                            href={`/fasteners?${buildGeometryLinkParams(threadStandard, size)}`}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider transition-all group"
                        >
                            <span>{t.openGeometry}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                </div>

                {/* RIGHT WORKSPACE */}
                <div className="flex flex-col min-h-0 gap-4 overflow-hidden">
                    
                    {/* TOP PANEL: VISUAL SCHEMATIC & SAFETY STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4 flex-shrink-0">
                        {/* Interactive Bolt Schematic Card */}
                        <div className="h-[230px]">
                            <FastenerInteractiveSchematic 
                                results={results} 
                                length={length} 
                                yieldUtilization={yieldUtilization} 
                                grade={grade} 
                                size={size} 
                                labels={blueprintLabels} 
                                isPipe={threadStandard === 'Pipe'} 
                                lang={language}
                            />
                        </div>
                        
                        {/* Yield Gauge & Key Metrics Card */}
                        <div className="bg-[#06090e]/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[230px]">
                            {/* Yield warning banner inside the card */}
                            <div className={`p-3 rounded-xl border ${utilBg} flex items-center gap-3`}>
                                <div className="p-1.5 rounded-lg bg-black/30 shrink-0">
                                    {yieldUtilization > 90 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-white truncate">
                                        {yieldUtilization > 90 ? t.highStressWarning : t.structuralIntegrity}
                                    </h4>
                                    <p className="text-[9px] text-white/50 truncate">
                                        {yieldUtilization > 90 ? t.yieldExceeded : t.safeUtilization}
                                    </p>
                                </div>
                                <span className="ml-auto text-[9px] font-mono font-bold uppercase bg-black/20 px-2 py-0.5 rounded border border-white/5">
                                    {yieldUtilization > 90 ? 'FAIL' : 'OK'}
                                </span>
                            </div>

                            {/* Large KPI metrics */}
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-[#080d14]/70 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{t.tighteningTorque}</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-lg font-black font-mono text-[#fbbf24]">{results.MA.toFixed(1)}</span>
                                        <span className="text-[8px] text-white/20 font-mono">Nm</span>
                                    </div>
                                </div>
                                <div className="bg-[#080d14]/70 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{t.preloadForce}</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-lg font-black font-mono text-[#10b981]">{results.Fm_max.toFixed(1)}</span>
                                        <span className="text-[8px] text-white/20 font-mono">kN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Yield progress line */}
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between items-baseline text-[9px]">
                                    <span className="font-mono text-white/30 uppercase">{t.yieldUtil}</span>
                                    <span className="font-mono font-black" style={{ color: utilColor }}>{yieldUtilization}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${yieldUtilization}%`, backgroundColor: utilColor }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM PANEL: TABBED DETAILED WORKSPACE */}
                    <div className="flex-1 flex flex-col min-h-0 bg-[#06090e]/20 border border-white/5 rounded-2xl overflow-hidden">
                        
                        {/* TABS NAVBAR */}
                        <div className="flex border-b border-white/5 bg-[#080d14] px-4 flex-shrink-0">
                            {[
                                { id: 'dashboard', label: t.chartsAnalytics, icon: Cpu },
                                { id: 'verification', label: t.tabVerification, icon: FileText },
                                { id: 'dimensions', label: t.tabDimensions, icon: Ruler },
                                { id: 'blueprint', label: t.hdBlueprint, icon: Box },
                            ].map((tab) => {
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                                            activeTab === tab.id
                                                ? 'border-orange-500 text-orange-400 bg-orange-500/[0.02]'
                                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        <TabIcon size={12} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ACTIVE TAB CONTENT */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 relative">
                            
                            {/* TAB 1: CHARTS & ANALYTICS */}
                            {activeTab === 'dashboard' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    
                                    {/* Torque Preload Curve */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.torquePreloadCurve}</h3>
                                        <div className="h-[180px]">
                                            {isMounted && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="gradientPreload" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                        <XAxis dataKey="torque" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />
                                                        <Area type="monotone" dataKey="preload" stroke="#f97316" strokeWidth={2} fill="url(#gradientPreload)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {/* Torque loss distribution */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.torqueDistribution}</h3>
                                        <div className="h-[180px] flex items-center justify-center gap-4">
                                            <div className="relative w-28 h-28 shrink-0">
                                                {isMounted && (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={distributionData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value">
                                                                {distributionData.map((entry: { color: string }, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                )}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-sm font-black text-emerald-400">
                                                        {((results.K1 / (results.K1 + results.K2 + results.K3)) * 100).toFixed(0)}%
                                                    </span>
                                                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">Useful</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                {distributionData.map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-[9px]">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                        <span className="text-slate-400 truncate flex-1 font-medium">{item.name}</span>
                                                        <span className="font-mono font-bold text-white shrink-0">{item.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* TAB 2: TECHNICAL DRAWING */}
                            {activeTab === 'blueprint' && (
                                <div className="flex flex-col h-full gap-4">
                                    <div className="flex-1 min-h-[380px] rounded-2xl border border-orange-500/20 bg-[#04060a] overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]">
                                        <FastenerAssemblyBlueprint 
                                            results={results} 
                                            length={length} 
                                            yieldUtilization={yieldUtilization} 
                                            grade={grade} 
                                            size={size} 
                                            labels={blueprintLabels} 
                                            isPipe={threadStandard === 'Pipe'} 
                                        />
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between border border-white/5 bg-[#080d14]/40 p-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Info size={12} className="text-orange-400" />
                                            <span>Use standard controls on the left to dynamically stretch length and diameters.</span>
                                        </div>
                                        <button 
                                            onClick={exportToPDF} 
                                            className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 text-orange-400 font-black uppercase text-[8px] tracking-wider transition-all"
                                        >
                                            Save Blueprint PDF
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DIMENSIONS & STANDARDS */}
                            {activeTab === 'dimensions' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Manufacturing Dimensions Card */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 space-y-3">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">{t.mfgDimensions}</h3>
                                            <span className="text-[7px] font-mono text-emerald-400/70">{t.linkedGeometry}</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {[
                                                { label: t.nomDia, val: results.d_nom.toFixed(2), unit: 'mm' },
                                                { label: t.pitchDia, val: results.d2.toFixed(2), unit: 'mm' },
                                                { label: t.minorDia, val: results.d3.toFixed(2), unit: 'mm' },
                                                { label: t.pitchLead, val: results.pitchVal.toFixed(2), unit: 'mm' },
                                                { label: t.stressArea, val: results.As.toFixed(2), unit: 'mm²' },
                                                { label: t.bearingDia, val: results.dw.toFixed(2), unit: 'mm' },
                                                { label: t.clearanceHole, val: results.dh.toFixed(2), unit: 'mm' },
                                                { label: t.frictionRad, val: results.rb.toFixed(2), unit: 'mm' },
                                            ].map((row, i) => (
                                                <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-white/[0.02]">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{row.label}</span>
                                                    <span className="font-mono text-xs font-black text-white shrink-0">
                                                        {row.val}<span className="text-slate-600 ml-1 text-[8px] font-bold">{row.unit}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bolt geometry reference schema */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">VDI 2230 Preload Calibration</h3>
                                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                                The nominal dimensions shown represent standard limits. Stress area and friction radius calculations follow ISO 898-1 standards. Utilization metrics evaluate tensile safety margins relative to the nominal yield capacity of class <span className="text-white font-bold">{grade}</span>.
                                            </p>
                                        </div>
                                        
                                        <div className="mt-4 border border-white/5 bg-black/40 rounded-xl p-3 space-y-1.5 text-[9px] font-mono text-slate-500">
                                            <div className="flex justify-between">
                                                <span>Nominal Size:</span>
                                                <span className="text-white font-bold">{threadStandard === 'Custom' ? 'Custom' : size}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Thread Standard:</span>
                                                <span className="text-white font-bold">{threadStandard}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Fastener Grade:</span>
                                                <span className="text-white font-bold">{grade}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Thread Length:</span>
                                                <span className="text-white font-bold">{length} mm</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* TAB 4: VDI 2230 VERIFICATION */}
                            {activeTab === 'verification' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Torque & friction parameters */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">{t.torqueFrictionAnalysis}</h3>
                                        <div className="space-y-2">
                                            <CoeffRow label={t.pitchTerm} value={results.K1.toFixed(5)} />
                                            <CoeffRow label={t.threadFrictionTerm} value={results.K2.toFixed(5)} />
                                            <CoeffRow label={t.underheadFrictionTerm} value={results.K3.toFixed(5)} />
                                            <div className="border-t border-white/10 pt-2 mt-2">
                                                <CoeffRow label={t.nutFactor} value={results.K.toFixed(5)} highlight />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Production checklist */}
                                    <div className="rounded-2xl border border-white/5 bg-[#080d14]/40 p-4 space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Design Compliance Checklist</h3>
                                        <div className="space-y-2">
                                            {productionChecks.map((row) => (
                                                <div key={row.label} className="flex items-center justify-between gap-4 border-b border-white/[0.03] pb-1.5">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{row.label}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-[9px] font-black font-mono ${row.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{row.value}</span>
                                                        {row.ok ? (
                                                            <CheckCircle size={11} className="text-emerald-500" />
                                                        ) : (
                                                            <Info size={11} className="text-amber-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* HIDDEN PRINT CONTAINER */}
            <div ref={printRef} style={{ display: 'none', width: '297mm', height: '210mm', backgroundColor: 'white', padding: '15mm', color: 'black', fontFamily: 'sans-serif' }}>
                <div style={{ border: '2px solid #000', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '10mm', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '24pt', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>PRODUCTION DRAWING</h1>
                            <h2 style={{ fontSize: '14pt', margin: 0, color: '#555' }}>FASTENER: {threadStandard === 'Custom' ? 'Custom Ø' + customDia : size} x {length}</h2>
                        </div>
                        <div style={{ width: '200px', borderLeft: '2px solid #000', paddingLeft: '10px' }}>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>DATE: {new Date().toLocaleDateString()}</div>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>CLASS: {grade}</div>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>STD: {threadStandard}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
                        <div style={{ flex: 2, border: '1px solid #ccc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                            <div style={{ width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FastenerAssemblyBlueprint results={results} length={length} yieldUtilization={yieldUtilization} grade={grade} size={size} labels={blueprintLabels} isPrint isPipe={threadStandard === 'Pipe'} />
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#eee' }}>
                                        <th colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontSize: '12pt' }}>GEOMETRY (mm)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={tdStyle}>Nominal Dia (d)</td><td style={tdStyle}>{results.d_nom.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Pitch Dia (d2)</td><td style={tdStyle}>{results.d2.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Minor Dia (d3)</td><td style={tdStyle}>{results.d3.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Length (L)</td><td style={tdStyle}>{length}</td></tr>
                                    <tr><td style={tdStyle}>Pitch / Lead</td><td style={tdStyle}>{results.pitchVal.toFixed(3)}</td></tr>
                                    <tr><td style={tdStyle}>Bearing Dia (dw)</td><td style={tdStyle}>{results.dw.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Clearance (dh)</td><td style={tdStyle}>{results.dh.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Frict. Rad. (rb)</td><td style={tdStyle}>{results.rb.toFixed(2)}</td></tr>
                                </tbody>
                            </table>

                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#eee' }}>
                                        <th colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontSize: '12pt' }}>ASSEMBLY SPECS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={tdStyle}>Preload Force (Fm)</td><td style={tdStyle}>{results.Fm_max.toFixed(2)} kN</td></tr>
                                    <tr><td style={tdStyle}>Tightening Torque (MA)</td><td style={tdStyle}>{results.MA.toFixed(2)} Nm</td></tr>
                                    <tr><td style={tdStyle}>Yield Utilization</td><td style={tdStyle}>{yieldUtilization}%</td></tr>
                                    <tr><td style={tdStyle}>Stress Area (As)</td><td style={tdStyle}>{results.As.toFixed(2)} mm²</td></tr>
                                    <tr><td style={tdStyle}>Nut Factor (K)</td><td style={tdStyle}>{results.K.toFixed(4)} (K1={results.K1.toFixed(3)}, K2={results.K2.toFixed(3)}, K3={results.K3.toFixed(3)})</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ControlSlider = ({ label, value, min, max, step = 1, onChange, unit }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-[9px] uppercase tracking-widest font-mono text-white/30">{label}</label>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold text-orange-400">{value}</span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-white transition-all"
      suppressHydrationWarning
    />
  </div>
);

const DataDisplay = ({ label, value, unit, icon: Icon, color = '#00e5ff', compact = false }: any) => (
  <div className={`relative group overflow-hidden bg-[#080d14]/70 border border-white/5 transition-all hover:border-orange-500/20 ${compact ? 'px-3 py-1.5 min-w-[100px] rounded-lg' : 'p-5 min-w-[150px] rounded-2xl'}`}>
    <div className={`flex items-center gap-2 ${compact ? 'mb-0.5' : 'mb-2'}`}>
      <div className={`rounded-xl bg-black/40 text-white/40 group-hover:text-orange-400 transition-colors ${compact ? 'p-1' : 'p-2'}`}>
        <Icon size={compact ? 12 : 16} />
      </div>
      <span className={`uppercase tracking-widest font-mono text-white/30 ${compact ? 'text-[7px]' : 'text-[9px]'}`}>{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`font-black font-mono tabular-nums tracking-tighter ${compact ? 'text-sm' : 'text-xl'}`} style={{ color }}>{value}</span>
      <span className="text-[9px] font-mono text-white/20 uppercase">{unit}</span>
    </div>
  </div>
);

const tdStyle = { border: '1px solid #000', padding: '8px', fontSize: '10pt' };

function CoeffRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`flex justify-between items-center text-[10px] py-1.5 border-b border-white/[0.02] ${highlight ? 'border-t border-white/10 pt-2.5 mt-2' : ''}`}>
            <span className={`uppercase tracking-widest truncate pr-2 ${highlight ? 'text-orange-400 font-black' : 'text-slate-400 font-bold'}`}>{label}</span>
            <span className={`font-mono font-black shrink-0 ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</span>
        </div>
    );
}

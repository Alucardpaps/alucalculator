"use client";

import { getFastenersModuleUiStrings } from '@/locales/fastenersModuleUiTranslations';
import { useState, useMemo } from "react";
import Link from "next/link";
import { useFastenerCalculator } from "@/hooks/useFastenerCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { 
    CheckCircle, AlertTriangle, Plus, FileText, 
    Zap, Shield, Activity, RotateCw, Cog, ArrowRight, Wrench
} from 'lucide-react';
import { useProjectStore } from "@/store/projectStore";
import { useI18nStore } from "@/store/i18nStore";
import { getFastenerMetadataStrings } from '@/locales/fastenerMetadataTranslations';
import { PDFReportEngine, ReportMetadata } from "@/lib/pdfReportEngine";
import { ReportSettingsModal } from "@/components/ui/ReportSettingsModal";
import { SaveButton } from "@/components/calculation/SaveButton";
import { getFastenerGeometry } from "@/data/boltNutStandards";
import { buildFastenerLinkParams } from "@/lib/fastener/sharedEngine";

// ════════════════════════════════════════════
// CONSTANTS & THEME
// ════════════════════════════════════════════

const COLORS = {
  bg: '#020408',
  panel: '#0a1018',
  text: '#C5C6C7',
  accent: '#00e5ff', // Cyan
  accentDim: 'rgba(0, 229, 255, 0.15)',
  glow: 'rgba(0, 229, 255, 0.3)',
  danger: '#FF4D4D',
  success: '#10B981',
  warning: '#F59E0B',
};

// ════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════

const ThreadEngagementVisualizer = ({ results, fastenerType }: any) => {
    const p = parseFloat(results.pitch || '2');
    const d = parseFloat(results.majorDia || '12');
    const d2 = parseFloat(results.pitchDia || '10.86');
    const d1 = parseFloat(results.minorDia || '9.85');
    const unit = results.unit || 'mm';

    // Scale factor to make it fit nicely in a 200x200 box
    const scale = Math.min(180 / (d || 12), 20);

    const D = d * scale;
    const D2 = d2 * scale;
    const D1 = d1 * scale;
    const P = p * scale;

    const numTeeth = 8;
    const threadLength = numTeeth * P;
    
    // Bolt V-profile path (right side, going downwards)
    let rightBoltPath = `M ${D/2} 0 `;
    for (let i = 0; i < numTeeth; i++) {
        const yStart = i * P;
        rightBoltPath += `L ${D1/2} ${yStart + P/2} L ${D/2} ${yStart + P} `;
    }

    // Bolt V-profile path (left side, going upwards)
    let leftBoltPath = `L ${-D/2} ${threadLength} `;
    for (let i = numTeeth - 1; i >= 0; i--) {
        const yStart = i * P;
        leftBoltPath += `L ${-D1/2} ${yStart + P/2} L ${-D/2} ${yStart} `;
    }
    
    const boltPath = rightBoltPath + leftBoltPath + 'Z';

    // Nut V-profile path: matches the bolt's V-profile but shifted/offset
    let leftNutPath = `M ${D/2} 0 `;
    for (let i = 0; i < numTeeth; i++) {
        const yStart = i * P;
        leftNutPath += `L ${D1/2} ${yStart + P/2} L ${D/2} ${yStart + P} `;
    }
    leftNutPath += `L ${D/2 + 30} ${threadLength} L ${D/2 + 30} 0 Z`;

    let rightNutPath = `M ${-D/2} 0 `;
    for (let i = 0; i < numTeeth; i++) {
        const yStart = i * P;
        rightNutPath += `L ${-D1/2} ${yStart + P/2} L ${-D/2} ${yStart + P} `;
    }
    rightNutPath += `L ${-D/2 - 30} ${threadLength} L ${-D/2 - 30} 0 Z`;

    return (
        <svg viewBox={`-100 -20 200 200`} className="w-[180px] h-[180px] overflow-visible">
            <defs>
                <pattern id="nutHatch" patternUnits="userSpaceOnUse" width="6" height="6">
                    <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="0.8" />
                </pattern>
            </defs>

            {/* Nut Cross section */}
            <g opacity={fastenerType === 'nut' ? 1.0 : 0.4} className="transition-opacity duration-300">
                <path d={leftNutPath} fill="url(#nutHatch)" stroke="#00e5ff" strokeWidth="1" />
                <path d={rightNutPath} fill="url(#nutHatch)" stroke="#00e5ff" strokeWidth="1" />
            </g>

            {/* Bolt Shaft */}
            <g opacity={fastenerType === 'bolt' ? 1.0 : 0.4} className="transition-opacity duration-300">
                <path d={boltPath} fill="#0a1018" stroke="#ecfeff" strokeWidth="1.5" />
                <line x1="0" y1="-10" x2="0" y2={threadLength + 10} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="10 5" />
            </g>

            {/* Diameters overlays */}
            <g className="text-[7px] font-mono fill-white/50 stroke-none">
                {/* Major Diameter d */}
                <line x1={-D/2} y1={P*2} x2={D/2} y2={P*2} stroke="#00e5ff" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x="0" y={P*2 - 2} textAnchor="middle" fill="#00e5ff" className="font-bold">d = {d.toFixed(2)} {unit}</text>

                {/* Pitch Diameter d2 */}
                <line x1={-D2/2} y1={P*3} x2={D2/2} y2={P*3} stroke="rgba(0, 229, 255, 0.6)" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x="0" y={P*3 - 2} textAnchor="middle" fill="rgba(0, 229, 255, 0.8)" className="font-bold">d₂ = {d2.toFixed(2)} {unit}</text>

                {/* Minor Diameter d1 */}
                <line x1={-D1/2} y1={P*4} x2={D1/2} y2={P*4} stroke="rgba(0, 229, 255, 0.4)" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x="0" y={P*4 - 2} textAnchor="middle" fill="rgba(0, 229, 255, 0.6)" className="font-bold">d₁ = {d1.toFixed(2)} {unit}</text>
            </g>
        </svg>
    );
};

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[#0a1018]/60 border border-white/5 rounded-2xl p-4 transition-all hover:border-[#00e5ff]/30 hover:scale-[1.02] duration-300">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-xl bg-black/40 text-white/40 group-hover:text-[#00e5ff] transition-colors">
        <Icon size={24} className="group-hover:rotate-[60deg] transition-all duration-700" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black font-mono tabular-nums tracking-tighter" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-mono text-white/20 uppercase">{unit}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: color }} />
  </div>
);

const ControlSlider = ({ label, value, min, max, step = 1, onChange, unit }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-baseline">
      <label className="text-[10px] uppercase tracking-widest font-mono text-white/30">{label}</label>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-mono font-bold text-[#00e5ff]">{value}</span>
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
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00e5ff] hover:accent-white transition-all"
    />
  </div>
);

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════

export function FastenersModule({ lang, dict }: { lang: string, dict: any }) {
    const { language } = useI18nStore();
    const t = getFastenersModuleUiStrings(language);

    const {
        standard, setStandard,
        size, setSize,
        availableSizes,
        results,
        manualUnit, setManualUnit,
        clearanceSeries, setClearanceSeries,
    } = useFastenerCalculator();

    const { addItem } = useProjectStore();
    const [length, setLength] = useState(50);
    const [fastenerType, setFastenerType] = useState<'bolt' | 'nut'>('bolt');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [grade, setGrade] = useState('8.8');

    const headGeom = useMemo(() => {
        if (!size.startsWith('M')) return null;
        return getFastenerGeometry(size);
    }, [size]);

    const torqueLink = `/bolt-torque/?${buildFastenerLinkParams(standard, size, grade)}`;

    // Metadata
    const metadata: CalculationMetadata = useMemo(() => {
        const isISO = standard.includes('ISO');
        const standardId = isISO ? "ISO 965-1" : "ASME B1.1";
        const fm = getFastenerMetadataStrings(language);
        const standardTitle = isISO ? fm.isoStandardTitle : fm.uncStandardTitle;
        const assumptions = [fm.assumption1, fm.assumption2, fm.assumption3];

        return { standardId, standardTitle, version: "2013", assumptions };
    }, [standard, language]);

    const status = Number(results.stressArea) > 0 ? 'valid' : 'invalid';

    const addToProject = () => {
        const volMm3 = Number(results.stressArea) * length;
        const volM3 = volMm3 / 1e9;
        const density = 7850;
        const weight = volM3 * density;

        addItem({
            type: 'part',
            name: `${size} x ${length} ${fastenerType === 'bolt' ? 'Bolt' : 'Nut'}`,
            category: 'Fasteners',
            material: 'Steel (Gr. 8.8)',
            weightPerUnit: weight,
            costPerUnit: weight * 6.5,
            quantity: 1
        });
    };

    const generateEnterpriseReport = async (meta: ReportMetadata) => {
        const engine = new PDFReportEngine(meta);
        let yPos = engine.addMetadataSection();

        yPos = engine.addKPIs([
            { label: "Standard", value: standard },
            { label: "Nominal Size", value: size },
            { label: "Stress Area", value: `${results.stressArea} ${results.unit}²` }
        ], yPos);

        yPos = engine.addSectionTitle("Thread Geometry Data", yPos);
        engine.addTable({
            head: [["Parameter", "Value", "Unit"]],
            body: [
                ["Type", fastenerType.toUpperCase(), "-"],
                ["Pitch", results.pitch.toString(), results.unit === 'mm' ? 'mm' : 'TPI'],
                ["Major Diameter (D)", results.majorDia.toString(), results.unit],
                ["Pitch Diameter (D2)", results.pitchDia.toString(), results.unit],
                ["Minor Diameter (D1)", results.minorDia.toString(), results.unit],
                ["Tap Drill Size", results.tapDrill.toString(), results.unit],
                ["Clearance Hole", results.clearance.toString(), results.unit]
            ],
            startY: yPos
        });

        engine.save(`Fastener_Spec_${meta.referenceNo}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-[#C5C6C7] select-none p-6 overflow-y-auto">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">{t.title}</h1>
                    <p className="text-[10px] font-mono tracking-[0.25em] text-[#00e5ff]/50 uppercase mt-1">{t.subtitle}</p>
                </div>
                <Link href={torqueLink}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider text-orange-400 hover:bg-orange-500/20 transition-all shrink-0">
                    <Wrench size={12} /> {t.openTorque} <ArrowRight size={12} />
                </Link>
            </div>

            {/* Viewport Panel (Full-width, matching Planetary Gearbox Schematic) */}
            <div className="p-4 bg-[#0a1018]/10 border border-[#00e5ff]/20 rounded-2xl mb-6 shadow-2xl">
                <EngineeringVisualization status={status} label="FASTENER THREAD GEOMETRY">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        {/* Left side: Dynamic 2D Thread Profile / Engagement Visualizer */}
                        <div className="bg-[#0a0c10] border border-[#00e5ff]/10 rounded-xl flex flex-col items-center justify-center p-6 min-h-[300px] relative overflow-hidden">
                            <ThreadEngagementVisualizer results={results} fastenerType={fastenerType} length={length} />
                            <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">{t.engagementDynamics}</span>
                            </div>
                        </div>

                        {/* Right side: Blueprint */}
                        <div className="bg-[#0a0c10] border border-[#00e5ff]/10 rounded-xl flex flex-col items-center justify-center p-6 min-h-[300px] relative">
                            <TechnicalDrawing
                                mode="fastener"
                                activeField={null}
                                data={{ ...results, diameter: results.majorDia, length, type: fastenerType }}
                            />
                            <div className="absolute bottom-4 right-4 flex flex-col gap-1 items-end bg-black/60 p-3 rounded-2xl border border-white/5">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{standard}</span>
                                <span className="text-lg font-black font-mono text-[#00e5ff] tracking-widest mt-0.5">{size}</span>
                            </div>
                        </div>
                    </div>
                </EngineeringVisualization>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Configuration & Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Actions Panel */}
                    <div className="p-4 rounded-xl bg-[#0a1018]/20 border border-white/5">
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            disabled={status !== 'valid'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/80 disabled:opacity-40 disabled:pointer-events-none text-black font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                            <FileText size={14} />
                            PDF SPEC
                        </button>
                    </div>

                    {/* Thread Standard Selection */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff]">{t.specification}</h3>
                            <Cog size={14} className="text-[#00e5ff]" />
                        </div>

                        {/* Fastener Type & Unit Toggles */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex gap-1">
                                    <button 
                                        onClick={() => setFastenerType('bolt')} 
                                        className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-lg ${
                                            fastenerType === 'bolt' 
                                                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {t.bolt}
                                    </button>
                                    <button 
                                        onClick={() => setFastenerType('nut')} 
                                        className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-lg ${
                                            fastenerType === 'nut' 
                                                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {t.nut}
                                    </button>
                                </div>
                                <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex gap-1">
                                    <button 
                                        onClick={() => setManualUnit('mm')} 
                                        className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-lg ${
                                            manualUnit === 'mm' 
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        MM
                                    </button>
                                    <button 
                                        onClick={() => setManualUnit('inch')} 
                                        className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-lg ${
                                            manualUnit === 'inch' 
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        INCH
                                    </button>
                                </div>
                            </div>

                            {/* Standard Selector */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">{t.stdFamily}</label>
                                <select
                                    className="w-full bg-[#0a1018] border border-white/5 focus:border-[#00e5ff]/50 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                                    value={standard}
                                    onChange={(e) => setStandard(e.target.value as any)}
                                >
                                    {(['ISO Metric', 'ISO Metric Fine', 'UNC', 'UNF', 'BSPP (G)', 'NPT']).map(s => (
                                        <option key={s} value={s} className="bg-[#020408]">{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">{t.clearanceSeries}</label>
                                <div className="flex gap-2">
                                    {(['fine', 'normal', 'coarse'] as const).map(s => (
                                        <button key={s} onClick={() => setClearanceSeries(s)}
                                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg ${clearanceSeries === s ? 'bg-[#00e5ff] text-black' : 'bg-white/5 text-slate-400'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dimensions Selection Card */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/30 backdrop-blur-xl space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#00e5ff]">{t.sizing}</h3>
                            <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-white/30">ISO/ANSI</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">{t.nomSize}</label>
                                <select
                                    className="w-full bg-[#0a1018] border border-white/5 focus:border-[#00e5ff]/50 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                >
                                    {availableSizes.map(s => <option key={s} value={s} className="bg-[#020408]">{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <CalculatorInput label={`${t.length} (${manualUnit})`} unit={manualUnit} value={length} onChange={(e) => setLength(Number(e.target.value))} />
                            </div>
                        </div>

                        <ControlSlider label={t.lengthAdj} value={length} min={5} max={200} step={5} unit={manualUnit} onChange={setLength} />
                    </div>
                </div>

                {/* Right Column: Drawing & Results */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Results Displays */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DataDisplay 
                                label={t.tapDrill}
                                value={results.tapDrill} 
                                unit={results.unit} 
                                icon={Activity} 
                                color={COLORS.accent}
                            />
                            <DataDisplay 
                                label={t.tensileArea}
                                value={results.stressArea} 
                                unit={`${results.unit}²`} 
                                icon={Zap} 
                                color="#white"
                            />
                            <DataDisplay 
                                label={t.clearanceHole}
                                value={results.clearance} 
                                unit={results.unit} 
                                icon={Shield} 
                                color="#C5C6C7"
                            />
                        </div>

                        {/* Extended Details Panel */}
                        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a1018]/20 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00e5ff]/5 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#00e5ff] uppercase flex items-center gap-1.5">
                                    <RotateCw size={12} className="animate-spin-slow" />
                                    {t.detailedThreadMetrics}
                                </span>
                                <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono">
                                    <div>{t.pitch}: <span className="text-[#00e5ff] font-bold">{results.displayPitch}</span></div>
                                    <div className="flex items-center gap-1">
                                        {status === 'valid' ? (
                                            <>
                                                <CheckCircle size={12} className="text-[#10B981]" />
                                                <span className="text-[#10B981]">{t.validGeometry}</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle size={12} className="text-[#FF4D4D] animate-pulse" />
                                                <span className="text-[#FF4D4D]">{t.outOfBounds}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                                <div className="space-y-1">
                                    <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.majorDia}</div>
                                    <div className="text-white font-bold">{results.majorDia} {results.unit}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.pitchDia}</div>
                                    <div className="text-white font-bold">{results.pitchDia} {results.unit}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.minorDia}</div>
                                    <div className="text-white font-bold">{results.minorDia} {results.unit}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.nomPitch}</div>
                                    <div className="text-white font-bold">{results.pitch} {results.unit === 'mm' ? 'mm' : 'TPI'}</div>
                                </div>
                                {headGeom ? (
                                    <>
                                        <div className="space-y-1">
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.headWidth}</div>
                                            <div className="text-white font-bold">{headGeom.s} mm</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-white/40 text-[9px] uppercase tracking-wider">{t.headHeight}</div>
                                            <div className="text-white font-bold">{headGeom.k} mm</div>
                                        </div>
                                    </>
                                ) : null}
                                {!results.isTapered && results.clearanceNormal !== 'N/A' ? (
                                    <div className="space-y-1 md:col-span-2">
                                        <div className="text-white/40 text-[9px] uppercase tracking-wider">ISO 273 (fine / normal / coarse)</div>
                                        <div className="text-white font-bold">{results.clearanceFine} / {results.clearanceNormal} / {results.clearanceCoarse} {results.unit}</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <AssumptionPanel metadata={metadata} status={status} />
                </div>
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle="Fastener Technical Specification"
            />
        </div>
    );
}

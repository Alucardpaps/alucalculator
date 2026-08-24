"use client";
import { useState, useMemo, useRef, useEffect, startTransition } from "react";
import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MATERIALS } from "@/data/gearsData";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, ShieldCheck, ShieldAlert, Zap, Layers, Cog, Gauge, Wrench, ChevronDown, Download, RotateCcw
} from 'lucide-react';
import { SaveButton } from "@/components/calculation/SaveButton";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { getGearsModuleStrings } from '@/locales/gearsModuleTranslations';

export function GearsModule({ lang, dict }: { lang: string, dict: any }) {
    const s = getGearsModuleStrings(lang);
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        gearModule, setGearModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        pressureAngle, setPressureAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2,
        loadClass, setLoadClass,
        dailyHours, setDailyHours,
        startsPerHour, setStartsPerHour,
        connectionType, setConnectionType,
    } = useDriveTrainCalculator();

    const [expandedSection, setExpandedSection] = useState<string | null>('geometry');
    const [isExporting, setIsExporting] = useState(false);
    
    const printRef = useRef<HTMLDivElement>(null);

    const isSafe = results.SF_bending > 1.4 && results.SF_contact > 1.0;
    const activeColor = isSafe ? '#00e5ff' : '#ef4444';

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    const exportToPDF = async () => {
        if (!printRef.current) return;
        try {
            setIsExporting(true);
            
            // Show temporarily for capture
            printRef.current.style.display = 'block';
            printRef.current.style.position = 'absolute';
            printRef.current.style.top = '-9999px';
            printRef.current.style.left = '-9999px';
            
            const dataUrl = await toPng(printRef.current, { 
                quality: 1, 
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
            pdf.save(`Gear_Production_Drawing_m${gearModule}_z${z1}_z${z2}.pdf`);
            
        } catch (err) {
            console.error('PDF export failed', err);
        } finally {
            if (printRef.current) {
                printRef.current.style.display = 'none';
            }
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-y-auto lg:overflow-hidden font-sans">
            {/* ═══ LEFT PANEL — Control Center (38%) ═══ */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full bg-[#080d14]/80 border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                
                {/* Header */}
                <div className="flex-none px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                            <Cog size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider text-cyan-400">{dict.gear?.title || "Gear Design"}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{dict.gear?.subtitle || s.isoSubtitle}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-500/20 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isExporting ? <RotateCcw size={14} className="animate-spin" /> : <Download size={14} />} 
                            PDF
                        </button>
                    </div>
                </div>

                {/* Scrollable Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
                    
                    {/* Section: Geometry */}
                    <CollapsibleSection 
                        id="geometry" title={s.toothGeometry} icon={<Settings size={14} />} 
                        isOpen={expandedSection === 'geometry'} onToggle={() => toggleSection('geometry')}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <GearInput label={dict.gears?.module || "Module (m)"} unit="mm" value={gearModule} min={0.5} max={20} step={0.5} onChange={(v: number) => setGearModule(v)} color="#00e5ff" desc={s.descModule} />
                                <GearInput label={dict.gears?.faceWidth || "Face Width (b)"} unit="mm" value={faceWidth} min={5} max={500} step={1} onChange={(v: number) => setFaceWidth(v)} color="#8b5cf6" desc={s.descFaceWidth} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <GearInput label={dict.gear?.inputs?.pinionTeeth || "Pinion Teeth (z₁)"} unit="" value={z1} min={8} max={200} step={1} onChange={(v: number) => setZ1(v)} color="#6366f1" desc={s.descPinionTeeth} />
                                <GearInput label={dict.gear?.inputs?.gearTeeth || "Gear Teeth (z₂)"} unit="" value={z2} min={8} max={500} step={1} onChange={(v: number) => setZ2(v)} color="#818cf8" desc={s.descGearTeeth} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <GearInput label={dict.gears?.helixAngle || "Helix Angle (β)"} unit="°" value={helixAngle} min={0} max={45} step={1} onChange={(v: number) => setHelixAngle(v)} color="#00e5ff" desc={s.descHelixAngle} />
                                <GearSelect label={dict.gears?.pressureAngle || "Pressure Angle (α)"} value={String(pressureAngle)} onChange={(v: string) => setPressureAngle(Number(v))} options={[
                                    { value: '14.5', label: '14.5°' },
                                    { value: '20', label: '20°' },
                                    { value: '25', label: '25°' }
                                ]} color="#00e5ff" desc={s.descPressureAngle} />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Section: Power & Material */}
                    <CollapsibleSection 
                        id="power" title={s.motorMaterial} icon={<Zap size={14} />}
                        isOpen={expandedSection === 'power'} onToggle={() => toggleSection('power')}
                    >
                        <div className="space-y-4">
                            <GearSelect label={dict.gear?.inputs?.power || "Motor Power"} value={String(selectedPower)} onChange={(v: string) => setSelectedPower(Number(v))} options={IEC_MOTORS.map(m => ({ value: String(m.power), label: `${m.power} kW` }))} color="#f59e0b" desc={s.descMotorPower} />
                            <GearSelect label={dict.common?.material || "Gear Material"} value={materialName} onChange={(v: string) => setMaterialName(v)} options={GEAR_MATERIALS.map(m => ({ value: m.name, label: m.name }))} color="#10b981" desc={s.descMaterial} />
                        </div>
                    </CollapsibleSection>

                    {/* Section: Service Conditions */}
                    <CollapsibleSection 
                        id="conditions" title={s.serviceConditions} icon={<Gauge size={14} />}
                        isOpen={expandedSection === 'conditions'} onToggle={() => toggleSection('conditions')}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <GearSelect label={s.loadClass} value={loadClass} onChange={(v: string) => setLoadClass(v as any)} options={[
                                    { value: 'U', label: s.loadUniform },
                                    { value: 'M', label: s.loadModerate },
                                    { value: 'H', label: s.loadHeavy }
                                ]} color="#f59e0b" desc={s.descLoadClass} />
                                <GearSelect label={s.dailyHours} value={String(dailyHours)} onChange={(v: string) => setDailyHours(Number(v))} options={[
                                    { value: '2', label: s.hoursLess3 },
                                    { value: '8', label: s.hours3to10 },
                                    { value: '12', label: s.hoursMore10 }
                                ]} color="#f59e0b" desc={s.descDailyHours} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <GearInput label={s.startsPerHour} unit="" value={startsPerHour} min={0} max={100} step={1} onChange={(v: number) => setStartsPerHour(v)} color="#f59e0b" desc={s.descStartsPerHour} />
                                <GearSelect label={s.outputConnect} value={connectionType} onChange={(v: string) => setConnectionType(v as any)} options={[
                                    { value: 'coupling', label: s.connDirect },
                                    { value: 'sprocket', label: s.connChain },
                                    { value: 'v_belt', label: s.connVBelt },
                                    { value: 'flat_belt', label: s.connFlatBelt }
                                ]} color="#f59e0b" desc={s.descConnection} />
                            </div>
                            <div className="flex items-center justify-between bg-cyan-900/20 border border-cyan-500/30 px-4 py-3 rounded-xl">
                                <span className="text-[10px] font-black tracking-widest uppercase text-cyan-300">
                                    {s.serviceFactor}
                                </span>
                                <span className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">{results.requiredFs.toFixed(2)}</span>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Section: Profile Shift */}
                    <CollapsibleSection 
                        id="shift" title={s.profileShift} icon={<Wrench size={14} />}
                        isOpen={expandedSection === 'shift'} onToggle={() => toggleSection('shift')}
                    >
                        <div className="space-y-4">
                            <GearInput label={s.shiftX1} unit="" value={x1} min={-1.5} max={1.5} step={0.05} onChange={(v: number) => setX1(v)} color="#00e5ff" desc={s.descShiftX1} />
                            <GearInput label={s.shiftX2} unit="" value={x2} min={-1.5} max={1.5} step={0.05} onChange={(v: number) => setX2(v)} color="#00e5ff" desc={s.descShiftX2} />
                        </div>
                    </CollapsibleSection>
                </div>
            </div>

            {/* ═══ RIGHT PANEL — Live Visualization & Results (62%) ═══ */}
            <div className="flex-1 h-auto lg:h-full flex flex-col overflow-hidden min-w-0">
                
                {/* Safety Factor Header */}
                <div className="flex-none px-6 md:px-8 pt-6 md:pt-8 pb-2 max-w-7xl w-full mx-auto">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <motion.div 
                                className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2" 
                                animate={{ color: activeColor }}
                            >
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                {isSafe ? s.designSafe : s.designWarning}
                            </motion.div>
                            <div className="flex items-baseline gap-6">
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        className="text-5xl sm:text-6xl md:text-[5.5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: results.SF_bending > 1.4 ? '#00e5ff' : '#ef4444', textShadow: `0 0 40px ${results.SF_bending > 1.4 ? 'rgba(0,229,255,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                                    >
                                        {results.SF_bending.toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        {s.rootBending}
                                    </span>
                                </div>
                                <div className="text-xl md:text-3xl font-thin text-gray-700 self-center">/</div>
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        className="text-5xl sm:text-6xl md:text-[5.5rem] font-black italic tracking-tighter leading-none"
                                        animate={{ color: results.SF_contact > 1.0 ? '#00e5ff' : '#ef4444', textShadow: `0 0 40px ${results.SF_contact > 1.0 ? 'rgba(0,229,255,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                                    >
                                        {results.SF_contact.toFixed(2)}
                                    </motion.div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        {s.flankContact}
                                    </span>
                                </div>
                            </div>
                        </div>
 
                        {/* Quick Stats */}
                        <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-left md:text-right pt-2 flex-wrap">
                            <QuickStat label={dict.common?.ratio || "Ratio"} value={`${results.ratio.toFixed(2)}:1`} color="#00e5ff" />
                            <QuickStat label={dict.common?.centerDist || "Center Dist"} value={`${results.a.toFixed(1)} mm`} color="#6366f1" />
                            <QuickStat label={dict.gears?.circularPitch || "Circ. Pitch"} value={`${(Math.PI * gearModule).toFixed(2)} mm`} color="#818cf8" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col 2xl:flex-row min-h-0">
                    {/* 2D Animated Visualization Area */}
                    <div className="flex-1 relative mx-6 my-4 2xl:my-0 2xl:mb-6 rounded-[32px] overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-[#0a1018] to-black shadow-inner min-h-[300px]">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                        
                        <div className="absolute top-5 left-5 z-20 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Cog size={14} className="animate-spin-slow" /> 
                            {s.dynamicBlueprint}
                        </div>
 
                        <GearSVG2D z1={z1} z2={z2} m={gearModule} a={results.a} rpm={results.motorSpeed || 1500} isPrint={false} />
                    </div>
 
                    {/* Manufacturing Dimensions Table & Alerts */}
                    <div className="flex-none 2xl:w-[450px] shrink-0 mx-6 mb-6 2xl:my-0 2xl:pr-6 2xl:h-full 2xl:overflow-y-auto flex flex-col gap-4">
                        {/* Manufacturing Dimensions Table (Compact) */}
                        <div className="rounded-2xl border border-white/5 bg-[#080d14]/60 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                    {s.mfgDimensions}
                                </span>
                                <span className="text-[9px] text-cyan-400/50 font-mono">ISO 6336:2019</span>
                            </div>
                            <div className="grid grid-cols-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
                                <div className="px-5 py-2">{s.parameter}</div>
                                <div className="px-5 py-2 text-center">{s.pinionCol}</div>
                                <div className="px-5 py-2 text-center">{s.gearCol}</div>
                            </div>
                            <div className="divide-y divide-white/[0.03]">
                                <DimRow label={s.tipDia} v1={results.da1} v2={results.da2} highlight />
                                <DimRow label={s.refDia} v1={results.d1} v2={results.d2} />
                                <DimRow label={s.rootDia} v1={results.df1} v2={results.df2} />
                                <DimRow label={s.overPins} v1={results.M1} v2={results.M2} precision={3} />
                            </div>
                        </div>
 
                        {/* Alerts */}
                        <AnimatePresence>
                            {!isSafe && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                >
                                    <ShieldAlert className="shrink-0 animate-pulse" size={28} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                                            {s.alertTitle}
                                        </p>
                                        <p className="text-[11px] opacity-80 mt-1">
                                            {s.alertDesc}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* HIDDEN PRINT CONTAINER */}
            <div ref={printRef} style={{ display: 'none', width: '297mm', height: '210mm', backgroundColor: 'white', padding: '15mm', color: 'black', fontFamily: 'sans-serif' }}>
                <div style={{ border: '2px solid #000', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '10mm', boxSizing: 'border-box' }}>
                    
                    {/* Header Block */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '24pt', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>PRODUCTION DRAWING</h1>
                            <h2 style={{ fontSize: '14pt', margin: 0, color: '#555' }}>GEAR STAGE: m={gearModule} | z1={z1} | z2={z2}</h2>
                        </div>
                        <div style={{ width: '200px', borderLeft: '2px solid #000', paddingLeft: '10px' }}>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>DATE: {new Date().toLocaleDateString()}</div>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>MATERIAL: {materialName}</div>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>QUALITY: ISO 6336</div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
                        
                        {/* Blueprint Drawing */}
                        <div style={{ flex: 2, border: '1px solid #ccc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                            <div style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GearSVG2D z1={z1} z2={z2} m={gearModule} a={results.a} rpm={0} isPrint={true} />
                            </div>
                        </div>

                        {/* Data Tables */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#eee' }}>
                                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontSize: '10pt' }}>Parameter</th>
                                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '10pt' }}>Pinion (z1)</th>
                                        <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '10pt' }}>Gear (z2)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={tdStyle}>Module (m)</td><td colSpan={2} style={{...tdStyle, textAlign: 'center'}}>{gearModule}</td></tr>
                                    <tr><td style={tdStyle}>Face Width (b)</td><td colSpan={2} style={{...tdStyle, textAlign: 'center'}}>{faceWidth}</td></tr>
                                    <tr><td style={tdStyle}>Number of Teeth (z)</td><td style={tdStyleCenter}>{z1}</td><td style={tdStyleCenter}>{z2}</td></tr>
                                    <tr><td style={tdStyle}>Profile Shift (x)</td><td style={tdStyleCenter}>{x1}</td><td style={tdStyleCenter}>{x2}</td></tr>
                                    <tr><td style={tdStyle}>Reference Dia (d)</td><td style={tdStyleCenter}>{results.d1.toFixed(2)}</td><td style={tdStyleCenter}>{results.d2.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Tip Dia (da)</td><td style={tdStyleCenter}>{results.da1.toFixed(2)}</td><td style={tdStyleCenter}>{results.da2.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Root Dia (df)</td><td style={tdStyleCenter}>{results.df1.toFixed(2)}</td><td style={tdStyleCenter}>{results.df2.toFixed(2)}</td></tr>
                                    <tr><td style={tdStyle}>Dimension Over Pins (M)</td><td style={tdStyleCenter}>{results.M1.toFixed(3)}</td><td style={tdStyleCenter}>{results.M2.toFixed(3)}</td></tr>
                                    <tr><td style={tdStyle}>Pin Diameter</td><td style={tdStyleCenter}>{pinDia1.toFixed(3)}</td><td style={tdStyleCenter}>{pinDia2.toFixed(3)}</td></tr>
                                </tbody>
                            </table>

                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#eee' }}>
                                        <th colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontSize: '10pt' }}>SYSTEM PROPERTIES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style={tdStyle}>Center Distance (a)</td><td style={tdStyleCenter}>{results.a.toFixed(2)} mm</td></tr>
                                    <tr><td style={tdStyle}>Transmission Ratio (i)</td><td style={tdStyleCenter}>{results.ratio.toFixed(3)}</td></tr>
                                    <tr><td style={tdStyle}>Helix Angle (β)</td><td style={tdStyleCenter}>{helixAngle}°</td></tr>
                                    <tr><td style={tdStyle}>Pressure Angle (α)</td><td style={tdStyleCenter}>{pressureAngle}°</td></tr>
                                    <tr><td style={tdStyle}>Transverse Module (mt)</td><td style={tdStyleCenter}>{results.mt.toFixed(3)}</td></tr>
                                </tbody>
                            </table>
                            
                            <div style={{ marginTop: 'auto', border: '2px solid ' + (isSafe ? '#10b981' : '#ef4444'), padding: '10px' }}>
                                <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '5px' }}>SAFETY FACTORS</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12pt' }}>
                                    <span>Root Bending (SF_F):</span>
                                    <strong>{results.SF_bending.toFixed(2)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12pt' }}>
                                    <span>Flank Contact (SF_H):</span>
                                    <strong>{results.SF_contact.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '20px', fontSize: '9pt', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                        * Generated by AluCalc Engineering Workstation. Values calculated per ISO 6336 standards.
                    </div>
                </div>
            </div>
        </div>
    );
}

const tdStyle = { border: '1px solid #000', padding: '6px', fontSize: '9pt' };
const tdStyleCenter = { ...tdStyle, textAlign: 'center' as const };

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function DimRow({ label, v1, v2, highlight, precision = 2 }: { label: string; v1: number; v2: number; highlight?: boolean; precision?: number }) {
    return (
        <div className={`grid grid-cols-3 text-xs font-mono ${highlight ? 'bg-cyan-500/5' : ''}`}>
            <div className={`px-5 py-2.5 ${highlight ? 'text-white font-bold' : 'text-gray-500'}`}>{label}</div>
            <div className={`px-5 py-2.5 text-center ${highlight ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>{v1.toFixed(precision)}</div>
            <div className={`px-5 py-2.5 text-center ${highlight ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>{v2.toFixed(precision)}</div>
        </div>
    );
}

function CollapsibleSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#0a1018]/60 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2.5 text-cyan-400">
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
                </div>
                <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <ChevronDown size={14} className="text-gray-600" />
                </div>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pt-1 block visible opacity-100">
                    {children}
                </div>
            )}
        </div>
    );
}

function GearInput({ label, unit, value, min, max, step, onChange, color, desc }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: string; desc?: string }) {
    const [localValue, setLocalValue] = useState(value);
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (v: number) => {
        setLocalValue(v);
        startTransition(() => {
            onChange(v);
        });
    };

    return (
        <div className="group">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span>
            </div>
            <div className="relative flex items-center bg-[#0e1622] border border-white/10 rounded-lg overflow-hidden transition-all duration-300 group-focus-within:border-cyan-500/40 group-focus-within:shadow-[0_0_15px_rgba(0,229,255,0.08)]">
                <input
                    type="number" value={localValue} onChange={(e) => handleChange(Number(e.target.value))}
                    min={min} max={max} step={step}
                    className="w-full bg-transparent text-xs font-black font-mono px-3 py-2 text-white outline-none appearance-none"
                />
                {unit && (
                    <div className="px-3 text-[9px] font-bold text-gray-600 border-l border-white/5 bg-white/[0.02]">
                        <span style={{ color }}>{unit}</span>
                    </div>
                )}
            </div>
            {desc && (
                <p className="text-[9px] text-white/40 mt-1 font-sans italic leading-relaxed">
                    {desc}
                </p>
            )}
            <div className="mt-2 px-0.5">
                <input
                    type="range" min={min} max={max} step={step} value={localValue} onChange={(e) => handleChange(Number(e.target.value))}
                    className="w-full h-[3px] bg-white/10 rounded-full appearance-none cursor-pointer outline-none"
                    style={{ accentColor: color }}
                />
            </div>
        </div>
    );
}

function GearSelect({ label, value, onChange, options, color, desc }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; color: string; desc?: string }) {
    return (
        <div className="group">
            <div className="mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            </div>
            <select
                className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white font-mono font-bold outline-none transition-all focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(0,229,255,0.08)] appearance-none cursor-pointer"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a1018]">{opt.label}</option>
                ))}
            </select>
            {desc && (
                <p className="text-[9px] text-white/40 mt-1 font-sans italic leading-relaxed">
                    {desc}
                </p>
            )}
        </div>
    );
}

function GearShape2D({ cx, cy, rRef, teeth, m, color, strokeWidth, opacity, isPrint, rotateDir, rpm }: any) {
    const rTip = rRef + m;
    const rRoot = rRef - 1.25 * m;
    
    const phiTip = (0.55 * (Math.PI / 2)) / teeth;
    const phiPitch = (1.0 * (Math.PI / 2)) / teeth;
    const phiRoot = (1.4 * (Math.PI / 2)) / teeth;

    const toothPath = useMemo(() => {
        let p = "";
        for (let i = 0; i < teeth; i++) {
            const centerAngle = (i * 360) / teeth;
            const rad = (centerAngle * Math.PI) / 180;
            
            const getPt = (r: number, offsetAngleRad: number) => {
                const a = rad + offsetAngleRad;
                const x = (cx + r * Math.sin(a)).toFixed(2);
                const y = (cy - r * Math.cos(a)).toFixed(2);
                return `${x},${y}`;
            };
            
            const p1 = getPt(rRoot, -phiRoot);
            const p2 = getPt(rRef, -phiPitch);
            const p3 = getPt(rTip, -phiTip);
            const p4 = getPt(rTip, phiTip);
            const p5 = getPt(rRef, phiPitch);
            const p6 = getPt(rRoot, phiRoot);
            
            if (i === 0) {
                p += `M ${p1} L ${p2} L ${p3} L ${p4} L ${p5} L ${p6}`;
            } else {
                p += ` L ${p1} L ${p2} L ${p3} L ${p4} L ${p5} L ${p6}`;
            }
        }
        p += " Z";
        return p;
    }, [cx, cy, rRef, teeth, m, phiRoot, phiPitch, phiTip, rRoot, rTip]);

    const animDuration = rpm > 0 ? (60 / rpm) * 15 : 0; // Speed scaling
    const animStyle = rpm > 0 && !isPrint ? {
        transformOrigin: `${cx}px ${cy}px`,
        animation: `${rotateDir === 'cw' ? 'spin-cw' : 'spin-ccw'} ${animDuration}s linear infinite`
    } : {};

    return (
        <g 
            transform={rotateDir === 'ccw' ? `rotate(${180 / teeth}, ${cx}, ${cy})` : undefined}
        >
            <g style={animStyle}>
                {/* Gear Body (Teeth Path) */}
                <path
                    d={toothPath}
                    fill={isPrint ? "none" : "rgba(0, 229, 255, 0.03)"}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    opacity={opacity}
                />

                {/* Spokes for realism */}
                <circle cx={cx} cy={cy} r={rRoot * 0.72} fill="none" stroke={color} strokeWidth="1" opacity={opacity * 0.3} />
                <circle cx={cx} cy={cy} r={rRoot * 0.3} fill="none" stroke={color} strokeWidth="1" opacity={opacity * 0.5} />
                
                {[0, 90, 180, 270].map((angle, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + (rRoot * 0.3) * Math.cos(rad);
                    const y1 = cy + (rRoot * 0.3) * Math.sin(rad);
                    const x2 = cx + (rRoot * 0.72) * Math.cos(rad);
                    const y2 = cy + (rRoot * 0.72) * Math.sin(rad);
                    return (
                        <line
                            key={idx}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={color}
                            strokeWidth="1.2"
                            opacity={opacity * 0.3}
                        />
                    );
                })}

                {/* Shaft Hub */}
                <circle cx={cx} cy={cy} r={rRoot * 0.18} fill="none" stroke={color} strokeWidth="1" opacity={opacity} />
                <rect
                    x={cx - (rRoot * 0.04)}
                    y={cy - (rRoot * 0.23)}
                    width={rRoot * 0.08}
                    height={rRoot * 0.08}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity={opacity}
                />
            </g>
        </g>
    );
}

function GearSVG2D({ z1, z2, m, a, rpm, isPrint = false }: { z1: number; z2: number; m: number; a: number; rpm: number; isPrint?: boolean }) {
    const r1 = (m * z1) / 2;
    const r2 = (m * z2) / 2;
    
    // Scale fitting inside 500x300
    // Keep centers matching center distance 'a', scaled to fit viewport
    const scale = Math.min(180 / (r1 + r2), 1.0);
    const scaledA = a * scale;
    const cx1 = 250 - scaledA / 2;
    const cx2 = 250 + scaledA / 2;
    
    const color1 = isPrint ? '#000000' : '#6366f1';
    const color2 = isPrint ? '#000000' : '#00e5ff';
    const textColor = isPrint ? '#000000' : 'rgba(255,255,255,0.3)';
    const strokeWidth = isPrint ? "1.2" : "2";
    const opacity = isPrint ? "1" : "0.8";

    // Speed ratio
    const ratio = z2 / z1;
    const pinionRpm = rpm;
    const gearRpm = rpm / ratio;

    return (
        <svg viewBox="0 0 500 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <style>{`
                @keyframes spin-cw {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-ccw {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
            `}</style>

            {/* Pinion */}
            <GearShape2D 
                cx={cx1} cy={150} rRef={r1 * scale} teeth={z1} m={m * scale}
                color={color1} strokeWidth={strokeWidth} opacity={opacity}
                isPrint={isPrint} rotateDir="cw" rpm={pinionRpm}
            />
            
            {/* Gear */}
            <GearShape2D 
                cx={cx2} cy={150} rRef={r2 * scale} teeth={z2} m={m * scale}
                color={color2} strokeWidth={strokeWidth} opacity={opacity}
                isPrint={isPrint} rotateDir="ccw" rpm={gearRpm}
            />

            {/* Center distance line */}
            <line x1={cx1} y1={150} x2={cx2} y2={150} stroke={textColor} strokeWidth="1" strokeDasharray="6,6" />
            
            {/* Labels */}
            <text x={cx1} y={150 + (r1 * scale) + 24} textAnchor="middle" fill={color1} fontSize="11" fontWeight="bold" fontFamily="monospace">z₁={z1}</text>
            <text x={cx2} y={150 + (r2 * scale) + 24} textAnchor="middle" fill={color2} fontSize="11" fontWeight="bold" fontFamily="monospace">z₂={z2}</text>
            <text x={250} y={135} textAnchor="middle" fill={textColor} fontSize="10" fontFamily="monospace" fontWeight="bold">a={a.toFixed(1)} mm</text>
        </svg>
    );
}

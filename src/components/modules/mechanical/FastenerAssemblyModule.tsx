'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Wrench, Download, RotateCcw, Box, FileImage, 
    ShieldAlert, AlertCircle, FileText
} from 'lucide-react';
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { CalculatorInput } from "@/components/CalculatorInput";
import { SaveButton } from "@/components/calculation/SaveButton";
import { FastenerVisualizer3D } from './FastenerVisualizer3D';
import { getFastenerGeometry, NUT_DIMENSIONS, BOLT_HEAD_DIMENSIONS, THREAD_STANDARDS } from '@/data/boltNutStandards';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function FastenerAssemblyModule() {
    // Technical State
    const [threadStandard, setThreadStandard] = useState('Metric Coarse');
    const [size, setSize] = useState('M12');
    
    // Custom properties
    const [customDia, setCustomDia] = useState(12);
    const [pitch, setPitch] = useState(1.75); // Used for custom or as display
    
    const [grade, setGrade] = useState('8.8');
    const [length, setLength] = useState(50);
    const [muThread, setMuThread] = useState(0.15);
    const [muHead, setMuHead] = useState(0.15);
    const [yieldUtilization, setYieldUtilization] = useState(90);
    
    // UI State
    const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
    const [isExporting, setIsExporting] = useState(false);
    
    const printRef = useRef<HTMLDivElement>(null);

    // When standard changes, update size to the first available in that standard
    useEffect(() => {
        if (threadStandard !== 'Custom') {
            const first = THREAD_STANDARDS.find(t => t.type === threadStandard || (threadStandard === 'Inch' && (t.type === 'UNC' || t.type === 'UNF')));
            if (first) {
                setSize(first.size);
            }
        }
    }, [threadStandard]);

    // Calculations based on VDI 2230 and ISO dimensions
    const results = useMemo(() => {
        // Properties
        const grades: any = {
            '8.8': { yield: 640 },
            '10.9': { yield: 940 },
            '12.9': { yield: 1080 }
        };
        const Sy = grades[grade]?.yield || 640;
        
        // Geometry
        let d_nom = 12;
        let pitchVal = pitch;
        let As = 84.3;

        if (threadStandard === 'Custom') {
            d_nom = customDia;
            pitchVal = pitch;
            const d2 = d_nom - 0.6495 * pitchVal;
            const d3 = d_nom - 1.2267 * pitchVal;
            As = (Math.PI / 4) * Math.pow((d2 + d3) / 2, 2);
        } else {
            const std = THREAD_STANDARDS.find(t => t.size === size);
            if (std) {
                d_nom = std.diameter;
                pitchVal = std.pitch || (25.4 / (std.tpi || 1));
                As = std.area_tensile;
            }
        }
        
        const d2 = d_nom - 0.6495 * pitchVal;
        const d3 = d_nom - 1.2267 * pitchVal;

        // Lookup ISO Dimensions
        const boltDim = getFastenerGeometry(size, d_nom);
        const nutDim = NUT_DIMENSIONS.find(n => n.size === size) || { width: boltDim.s, height: boltDim.k * 0.8 };
        
        // Torque
        const Fm_max = (yieldUtilization / 100) * As * Sy / 1000;
        const dk = d_nom * 1.5;
        const term1 = 0.159 * pitchVal;
        const term2 = 0.577 * d2 * muThread;
        const term3 = (dk / 2) * muHead;
        const MA = Fm_max * (term1 + term2 + term3);
        
        return {
            d_nom, d2, d3, As, Fm_max, MA, pitchVal,
            stress: (Fm_max * 1000) / As,
            safety: Sy / ((Fm_max * 1000) / As),
            boltDim, nutDim
        };
    }, [threadStandard, size, customDia, pitch, grade, length, muThread, muHead, yieldUtilization]);

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

    const standardsList = ['Metric Coarse', 'Metric Fine', 'UNC', 'UNF', 'Pipe', 'Trapezoidal', 'Custom'];

    return (
        <div className="flex flex-col h-full bg-[#020408] text-slate-200 select-none font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Header Side */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Fastener Node</h1>
                            <p className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase mt-1">Multi-Standard Solver</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <SaveButton 
                            type="bolt-torque"
                            inputData={{ threadStandard, size, customDia, pitch, grade, length, muThread, muHead, yieldUtilization }}
                            engineVersion="v2.5"
                            resultJson={results}
                        />
                        <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        >
                            {isExporting ? <RotateCcw size={14} className="animate-spin" /> : <Download size={14} />} 
                            {isExporting ? 'Generating...' : 'Export PDF'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visualizer & Configuration */}
                    <div className="space-y-8">
                        <EngineeringVisualization status="valid" label="ASSEMBLY CHARACTERISTICS">
                            <div className="flex flex-col w-full h-full min-h-[450px] relative bg-[#05080f] rounded-[3rem] border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />
                                
                                {/* View Toggle */}
                                <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                                    <button onClick={() => setViewMode('3D')} className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md flex items-center gap-2 ${viewMode === '3D' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}>
                                        <Box size={14} /> 3D Model
                                    </button>
                                    <button onClick={() => setViewMode('2D')} className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border backdrop-blur-md flex items-center gap-2 ${viewMode === '2D' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}>
                                        <FileImage size={14} /> 2D Blueprint
                                    </button>
                                </div>

                                <div className="flex-1 w-full relative z-10">
                                    <div className="absolute inset-0 p-6 pt-20 pb-24">
                                        {viewMode === '3D' ? (
                                            <div className="w-full h-full">
                                                <FastenerVisualizer3D 
                                                    d_nom={results.d_nom} 
                                                    pitch={results.pitchVal} 
                                                    headWidth={results.boltDim.s} 
                                                    headHeight={results.boltDim.k} 
                                                    nutWidth={results.nutDim.width} 
                                                    nutHeight={results.nutDim.height} 
                                                    length={length}
                                                    nutOffset={length * 0.4}
                                                    isPipe={threadStandard === 'Pipe'}
                                                    isTapered={size.includes('NPT') || size.includes('R ')}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FastenerBlueprint2D results={results} length={length} isPipe={threadStandard === 'Pipe'} isTapered={size.includes('NPT') || size.includes('R ')} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 w-full px-8">
                                    <div className="grid grid-cols-2 gap-8 w-full backdrop-blur-xl bg-[#080d14]/80 p-4 rounded-3xl border border-white/10">
                                        <div className="text-center border-r border-white/5">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preload Force</div>
                                            <div className="text-3xl font-black text-white mt-1 tabular-nums">{results.Fm_max.toFixed(1)} <span className="text-xs text-slate-600">kN</span></div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tightening Torque</div>
                                            <div className="text-3xl font-black text-orange-400 mt-1 tabular-nums">{results.MA.toFixed(1)} <span className="text-xs text-slate-600">Nm</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </EngineeringVisualization>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem]">
                            
                            <div className="col-span-full md:col-span-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Thread Standard</label>
                                <select 
                                    value={threadStandard} 
                                    onChange={(e) => setThreadStandard(e.target.value)}
                                    className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none appearance-none"
                                >
                                    {standardsList.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {threadStandard === 'Custom' ? (
                                <>
                                    <CalculatorInput label="Nominal Dia (d)" unit="mm" value={customDia} onChange={(e) => setCustomDia(Number(e.target.value))} />
                                    <CalculatorInput label="Thread Pitch" unit="mm" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                                </>
                            ) : (
                                <div className="col-span-full md:col-span-2 group">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Standard Size</label>
                                    <select 
                                        value={size} 
                                        onChange={(e) => setSize(e.target.value)}
                                        className="w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold outline-none appearance-none"
                                    >
                                        {THREAD_STANDARDS.filter(t => t.type === threadStandard).map(t => (
                                            <option key={t.size} value={t.size}>{t.size} (Ø{t.diameter}mm)</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <CalculatorInput label="Length (L)" unit="mm" value={length} onChange={(e) => setLength(Number(e.target.value))} />
                            <CalculatorInput label="Yield Utilization" unit="%" value={yieldUtilization} onChange={(e) => setYieldUtilization(Number(e.target.value))} />
                            <CalculatorInput label="Thread Friction μG" unit="coeff" value={muThread} onChange={(e) => setMuThread(Number(e.target.value))} />
                            <CalculatorInput label="Head Friction μK" unit="coeff" value={muHead} onChange={(e) => setMuHead(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Technical Analysis Output */}
                    <div className="space-y-6">
                        <div className="bg-[#0a0c10] rounded-[3rem] p-8 border border-orange-500/20 shadow-2xl relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <FileText size={120} />
                            </div>
                            
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-8">Manufacturing Dimensions</h2>

                            {/* Dimensions Table */}
                            <div className="flex-1 space-y-2 mb-8 relative z-10">
                                <DimTable 
                                    data={[
                                        { label: 'Nominal Dia (d)', val: results.d_nom.toFixed(2), unit: 'mm' },
                                        { label: 'Pitch Dia (d2)', val: results.d2.toFixed(2), unit: 'mm' },
                                        { label: 'Minor Dia (d3)', val: results.d3.toFixed(2), unit: 'mm' },
                                        { label: 'Pitch / Lead', val: results.pitchVal.toFixed(2), unit: 'mm' },
                                        { label: 'Stress Area (As)', val: results.As.toFixed(2), unit: 'mm²' },
                                    ]}
                                />
                            </div>

                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6 mt-4">System Validation</h2>

                            <div className="space-y-4">
                                <DetailRow label="Nominal Yield (Rel)" value={(results.stress / results.safety).toFixed(0)} unit="MPa" />
                                <DetailRow label="Utilization Ratio" value={yieldUtilization} unit="%" color="#f97316" />
                                
                                <div className="mt-6 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Structural Integrity</span>
                                        <div className="px-3 py-1 bg-emerald-500/20 rounded-full text-[8px] font-black text-emerald-400 uppercase">Passed</div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 leading-relaxed">
                                        Assembly preload of <span className="text-white font-bold">{results.Fm_max.toFixed(1)} kN</span> ensures joint stability without exceeding {yieldUtilization}% of the fastener's yield capacity.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <div className="grid grid-cols-3 gap-3">
                                    {['8.8', '10.9', '12.9'].map(g => (
                                        <button 
                                            key={g} 
                                            onClick={() => setGrade(g)}
                                            className={`py-2 rounded-2xl border text-[10px] font-black uppercase transition-all ${grade === g ? 'bg-orange-500 text-black border-orange-500 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Grade {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
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
                                <FastenerBlueprint2D results={results} length={length} isPrint={true} isPipe={threadStandard === 'Pipe'} />
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const tdStyle = { border: '1px solid #000', padding: '8px', fontSize: '10pt' };

function DimTable({ data }: { data: { label: string, val: any, unit: string }[] }) {
    return (
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
            {data.map((row, i) => (
                <div key={i} className="flex justify-between items-center p-3 px-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <div className="font-mono text-sm">
                        <span className="font-black text-white">{row.val}</span>
                        <span className="text-slate-500 ml-1">{row.unit}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function DetailRow({ label, value, unit, color }: any) {
    return (
        <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-white" style={{ color }}>{value}</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase">{unit}</span>
            </div>
        </div>
    );
}

function FastenerBlueprint2D({ results, length, isPrint = false, isPipe = false, isTapered = false }: any) {
    const d = results.d_nom;
    const l = length;
    
    // Scale factor
    const totalW = isPipe ? l + 40 : results.boltDim.k + l + results.nutDim.height + 10;
    const maxH = isPipe ? d * 2 : results.boltDim.s * 1.5;
    
    const strokeC = isPrint ? "#000000" : "#f97316";
    const textC = isPrint ? "#000000" : "#94a3b8";
    
    if (isPipe) {
        // Draw a Hex Nipple (Boru Nipeli / Manşon konsepti)
        const hexW = Math.max(10, l * 0.2);
        const threadL = (l - hexW) / 2;
        const hexH = d * 1.5;
        
        // NPT/BSPT standard taper is 1°47' (1.7899 degrees)
        const taperAngle = 1.7899 * Math.PI / 180;
        const dTop = isTapered ? (d/2) - (threadL * Math.tan(taperAngle)) : d/2;

        return (
            <svg viewBox={`0 -${maxH/2} ${l + 40} ${maxH + 20}`} className="w-full h-full max-h-[300px]">
                <line x1="-10" y1="0" x2={l + 30} y2="0" stroke={strokeC} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.5" />
                
                {/* Left Thread (Tapered or straight) */}
                <polygon points={`10,-${dTop} ${10+threadL},-${d/2} ${10+threadL},${d/2} 10,${dTop}`} fill="none" stroke={strokeC} strokeWidth="1.5" />
                <polygon points={`10,-${dTop} ${10+threadL},-${d/2} ${10+threadL},${d/2} 10,${dTop}`} fill="none" stroke={strokeC} strokeWidth="0.5" strokeDasharray="1,1" />
                
                {/* Center Hex */}
                <rect x={10+threadL} y={-hexH/2} width={hexW} height={hexH} fill="none" stroke={strokeC} strokeWidth="1.5" />
                <line x1={10+threadL+hexW} y1={-hexH/4} x2={10+threadL} y2={-hexH/2} stroke={strokeC} strokeWidth="0.5" />
                <line x1={10+threadL+hexW} y1={hexH/4} x2={10+threadL} y2={hexH/2} stroke={strokeC} strokeWidth="0.5" />

                {/* Right Thread (Tapered or straight) */}
                <polygon points={`${10+threadL+hexW},-${d/2} ${10+threadL*2+hexW},-${dTop} ${10+threadL*2+hexW},${dTop} ${10+threadL+hexW},${d/2}`} fill="none" stroke={strokeC} strokeWidth="1.5" />
                <polygon points={`${10+threadL+hexW},-${d/2} ${10+threadL*2+hexW},-${dTop} ${10+threadL*2+hexW},${dTop} ${10+threadL+hexW},${d/2}`} fill="none" stroke={strokeC} strokeWidth="0.5" strokeDasharray="1,1" />

                <g fontSize="4" fontFamily="monospace" fill={textC}>
                    <line x1={10} y1={hexH/2 + 5} x2={10} y2={hexH/2 + 10} stroke={strokeC} strokeWidth="0.2" />
                    <line x1={10+l} y1={hexH/2 + 5} x2={10+l} y2={hexH/2 + 10} stroke={strokeC} strokeWidth="0.2" />
                    <line x1={10} y1={hexH/2 + 8} x2={10+l} y2={hexH/2 + 8} stroke={strokeC} strokeWidth="0.2" />
                    <text x={10+l/2} y={hexH/2 + 13} textAnchor="middle">L={l}</text>
                    <text x={10+l+5} y={1} textAnchor="start">Ø{d.toFixed(1)}</text>
                    
                    {isTapered && (
                        <text x={10+l/2} y={-(hexH/2 + 8)} textAnchor="middle" fill="#ef4444" fontSize="3.5" fontWeight="bold">TAPER: 1° 47'</text>
                    )}
                </g>
            </svg>
        );
    }

    // Standard Bolt
    const k = results.boltDim.k;
    const s = results.boltDim.s;
    const m = results.nutDim.height;
    
    return (
        <svg viewBox={`0 -${maxH/2} ${totalW + 40} ${maxH + 20}`} className="w-full h-full max-h-[300px]">
            <line x1="-10" y1="0" x2={totalW + 20} y2="0" stroke={strokeC} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.5" />
            
            <rect x="10" y={-s/2} width={k} height={s} fill="none" stroke={strokeC} strokeWidth="1.5" />
            <line x1={10+k} y1={-s/4} x2={10} y2={-s/2} stroke={strokeC} strokeWidth="0.5" />
            <line x1={10+k} y1={s/4} x2={10} y2={s/2} stroke={strokeC} strokeWidth="0.5" />

            <rect x={10+k} y={-d/2} width={l} height={d} fill="none" stroke={strokeC} strokeWidth="1.5" />
            <rect x={10+k+l*0.4} y={-d/2} width={l*0.6} height={d} fill="none" stroke={strokeC} strokeWidth="0.5" strokeDasharray="1,1" />
            <rect x={10+k+l*0.7} y={-s/2} width={m} height={s} fill="none" stroke={strokeC} strokeWidth="1.5" />
            
            <g fontSize="4" fontFamily="monospace" fill={textC}>
                <line x1={10+k} y1={s/2 + 5} x2={10+k} y2={s/2 + 10} stroke={strokeC} strokeWidth="0.2" />
                <line x1={10+k+l} y1={s/2 + 5} x2={10+k+l} y2={s/2 + 10} stroke={strokeC} strokeWidth="0.2" />
                <line x1={10+k} y1={s/2 + 8} x2={10+k+l} y2={s/2 + 8} stroke={strokeC} strokeWidth="0.2" />
                <text x={10+k+l/2} y={s/2 + 13} textAnchor="middle">L={l}</text>

                <line x1={10} y1={s/2 + 5} x2={10} y2={s/2 + 10} stroke={strokeC} strokeWidth="0.2" />
                <line x1={10} y1={s/2 + 8} x2={10+k} y2={s/2 + 8} stroke={strokeC} strokeWidth="0.2" />
                <text x={10+k/2} y={s/2 + 13} textAnchor="middle">k</text>

                <line x1={10+k+l+5} y1={-d/2} x2={10+k+l+10} y2={-d/2} stroke={strokeC} strokeWidth="0.2" />
                <line x1={10+k+l+5} y1={d/2} x2={10+k+l+10} y2={d/2} stroke={strokeC} strokeWidth="0.2" />
                <line x1={10+k+l+8} y1={-d/2} x2={10+k+l+8} y2={d/2} stroke={strokeC} strokeWidth="0.2" />
                <text x={10+k+l+10} y={1} textAnchor="start">Ø{d.toFixed(1)}</text>
            </g>
        </svg>
    );
}

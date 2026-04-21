"use client";
import { useState } from "react";
import { useFastenerCalculator } from "@/hooks/useFastenerCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { ArrowLeftRight, CheckCircle, AlertTriangle, Plus, FileText } from 'lucide-react';
import { useProjectStore } from "@/store/projectStore";
import { PDFReportEngine, ReportMetadata } from "@/lib/pdfReportEngine";
import { ReportSettingsModal } from "@/components/ui/ReportSettingsModal";
import { SaveButton } from "@/components/calculation/SaveButton";

export function FastenersModule({ lang, dict }: { lang: string, dict: any }) {
    const {
        standard, setStandard,
        size, setSize,
        availableSizes,
        results,
        manualUnit, setManualUnit
    } = useFastenerCalculator();

    const { addItem } = useProjectStore();
    const [length, setLength] = useState(50);
    const [fastenerType, setFastenerType] = useState<'bolt' | 'nut'>('bolt');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: standard.includes('ISO') ? "ISO 965-1" : "ASME B1.1",
        standardTitle: standard.includes('ISO') ? "General purpose metric screw threads" : "Unified Inch Screw Threads (UN/UNR)",
        version: "2013",
        assumptions: [
            "Tolerance Class: 6g (Bolt) / 6H (Nut)",
            "Standard Coarse/Fine Pitches only",
            "Tensile Area calculation based on nominal diameter"
        ]
    };

    const status = Number(results.stressArea) > 0 ? 'valid' : 'invalid';

    const addToProject = () => {
        // Simple mass estimation for BOM
        // Stress Area (mm2) * Length (mm) -> Volume (mm3)
        const volMm3 = Number(results.stressArea) * length;
        const volM3 = volMm3 / 1e9;
        const density = 7850; // Steel kg/m3
        const weight = volM3 * density;

        addItem({
            name: `${size} x ${length} ${fastenerType === 'bolt' ? 'Bolt' : 'Nut'}`,
            category: 'Fasteners',
            material: 'Steel (Gr. 8.8)',
            weightPerUnit: weight,
            costPerUnit: weight * 6.5, // Fasteners have higher per-kg cost due to processing
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
        <div className="flex flex-col h-full bg-transparent text-slate-200 select-none p-6">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-6 justify-end">
                <div className="mr-auto flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-[0.3em] bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">Bölüm J: Fastener Analysis</span>
                    <SaveButton 
                        type="fasteners"
                        inputData={{ standard, size, fastenerType, length }}
                        engineVersion="v2.0"
                        resultJson={results}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        disabled={status !== 'valid'}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all border border-white/10"
                    >
                        <FileText size={16} /> PDF
                    </button>
                    <button
                        onClick={addToProject}
                        disabled={status !== 'valid'}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} /> ADD TO BOM
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">

                {/* 1. Visualization */}
                <div className="h-[300px] w-full bg-white/[0.02] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                    <EngineeringVisualization status={status} label="THREAD GEOMETRY">
                        <div className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[220px] relative">
                            <TechnicalDrawing
                                mode="fastener"
                                activeField={null}
                                data={{ ...results, diameter: results.majorDia, length, type: fastenerType }}
                            />
                            <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{standard}</span>
                                <span className="text-xl font-black font-mono text-white tracking-widest bg-orange-500/10 px-4 py-1.5 rounded-2xl border border-orange-500/30">{size}</span>
                            </div>
                        </div>
                    </EngineeringVisualization>
                </div>

                {/* 2. Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6 bg-white/[0.02] border border-white/10 p-6 rounded-3xl">
                        <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Configuration</div>

                        {/* Type & Unit Toggle */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/[0.05] p-1 rounded-2xl border border-white/10 flex">
                                    <button onClick={() => setFastenerType('bolt')} className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-xl ${fastenerType === 'bolt' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-gray-500 hover:text-white'}`}>Bolt</button>
                                    <button onClick={() => setFastenerType('nut')} className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-xl ${fastenerType === 'nut' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-gray-500 hover:text-white'}`}>Nut</button>
                                </div>
                                <div className="flex-1 bg-white/[0.05] p-1 rounded-2xl border border-white/10 flex">
                                    <button onClick={() => setManualUnit('mm')} className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-xl ${manualUnit === 'mm' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}>MM</button>
                                    <button onClick={() => setManualUnit('inch')} className={`flex-1 text-[10px] font-black tracking-widest uppercase transition-all py-2 rounded-xl ${manualUnit === 'inch' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}>INCH</button>
                                </div>
                            </div>

                            {/* Standard Select */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Standard Family</label>
                                <select
                                    className="w-full bg-white/[0.05] border border-white/10 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono transition-colors"
                                    value={standard}
                                    onChange={(e) => setStandard(e.target.value as any)}
                                >
                                    {(['ISO Metric', 'ISO Metric Fine', 'UNC', 'UNF', 'BSPP (G)', 'NPT']).map(s => (
                                        <option key={s} value={s} className="bg-[#050709]">{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white/[0.02] border border-white/10 p-6 rounded-3xl">
                        <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Dimensions</div>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Nominal Size</label>
                                <select
                                    className="w-full bg-white/[0.05] border border-white/10 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono transition-colors appearance-none"
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                >
                                    {availableSizes.map(s => <option key={s} value={s} className="bg-[#050709]">{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Length ({manualUnit})</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/[0.05] border border-white/10 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono transition-colors focus:outline-none"
                                    value={length}
                                    onChange={(e) => setLength(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Results */}
                <div className="bg-black/60 rounded-[40px] p-8 border border-orange-500/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">Calculated Engineering Geometry</span>
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Pitch: <span className="text-orange-400">{results.displayPitch}</span></div>
                            {status === 'valid' ? <CheckCircle size={18} className="text-orange-400" /> : <AlertTriangle size={18} className="text-red-500 animate-pulse" />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="p-6 rounded-3xl border bg-orange-900/10 border-orange-500/20">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tap Drill ($D_1$)</div>
                            <div className="text-4xl font-black font-mono tracking-tighter text-orange-400 mt-2">
                                {results.tapDrill} <span className="text-sm font-bold tracking-widest uppercase">{results.unit}</span>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl border bg-orange-900/10 border-orange-500/20">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stress Area ($A_s$)</div>
                            <div className="text-4xl font-black font-mono tracking-tighter text-white mt-2">
                                {results.stressArea} <span className="text-sm font-bold tracking-widest uppercase text-gray-500">{results.unit}²</span>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl border bg-orange-900/10 border-orange-500/20">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Clearance Drill ($d_h$)</div>
                            <div className="text-4xl font-black font-mono tracking-tighter text-gray-300 mt-2">
                                {results.clearance} <span className="text-sm font-bold tracking-widest uppercase">{results.unit}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
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

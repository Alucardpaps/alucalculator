"use client";
import { useState, useMemo } from 'react';
import {
    BEARING_CATALOG,
    BearingData,
    BearingType,
    detectBearingType,
    getBearingTypeInfo,
    calculateBearingLife
} from "@/data/skfBearings";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import { Bearing3D } from "@/components/3d/Bearing3D";
import { Search, Info, CheckCircle, AlertTriangle, Plus, FileText } from 'lucide-react';
import { useProjectStore } from "@/store/projectStore";
import { PDFReportEngine, ReportMetadata } from "@/lib/pdfReportEngine";
import { ReportSettingsModal } from "@/components/ui/ReportSettingsModal";

const BEARING_TYPE_FILTERS: { id: BearingType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'deep-groove-ball', label: 'DGB' },
    { id: 'angular-contact-ball', label: 'ACB' },
    { id: 'tapered-roller', label: 'TRB' },
    { id: 'cylindrical-roller', label: 'CRB' },
    { id: 'needle-roller', label: 'NRB' },
    { id: 'thrust-ball', label: 'Thrust' },
];

export function BearingsModule({ lang, dict }: { lang: string, dict: any }) {
    const { addItem } = useProjectStore();

    // Search & Filter State
    const [searchCode, setSearchCode] = useState('');
    const [typeFilter, setTypeFilter] = useState<BearingType | 'all'>('all');
    const [selectedBearing, setSelectedBearing] = useState<BearingData>(BEARING_CATALOG[14]); // 6204
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Inputs
    const [fr, setFr] = useState(5000);  // Radial Load (N)
    const [fa, setFa] = useState(1000);  // Axial Load (N)
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);

    // Filter Logic
    const filteredBearings = useMemo(() => {
        let list = BEARING_CATALOG;
        if (typeFilter !== 'all') {
            list = list.filter(b => b.type === typeFilter);
        }
        if (searchCode.trim()) {
            const search = searchCode.toUpperCase().replace(/\s/g, '');
            list = list.filter(b => b.code.toUpperCase().includes(search));
        }
        return list;
    }, [typeFilter, searchCode]);

    // Derived Data
    const results = useMemo(() => {
        return calculateBearingLife(selectedBearing, fr / 1000, fa / 1000, rpm, reliability);
    }, [selectedBearing, fr, fa, rpm, reliability]);

    const typeInfo = getBearingTypeInfo(selectedBearing.type);
    const lifeStatus = results.L10h > 50000 ? 'excellent' : results.L10h > 5000 ? 'good' : 'low';
    const status = lifeStatus === 'low' ? 'warning' : 'valid';

    const addToProject = () => {
        // Simple mass estimation for BOM
        // (D^2 - d^2) * B * core_factor * density
        const volMm3 = (Math.pow(selectedBearing.D, 2) - Math.pow(selectedBearing.d, 2)) * selectedBearing.B * 0.6;
        const weight = (volMm3 / 1e9) * 7850;

        addItem({
            name: `Bearing ${selectedBearing.code}`,
            category: 'Bearings',
            material: 'Chrome Steel (GCr15)',
            weightPerUnit: weight,
            costPerUnit: weight * 18.5, // Precision components cost more per kg
            quantity: 1
        });
    };

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "ISO 281:2007",
        standardTitle: "Rolling bearings \u2014 Dynamic load ratings and rating life",
        version: "2.0",
        assumptions: [
            "Lubrication condition assumed ideal (kappa > 1)",
            "Cleanliness: Normal clean",
            `Reliability: ${reliability}%`
        ]
    };

    const generateEnterpriseReport = async (meta: ReportMetadata) => {
        const engine = new PDFReportEngine(meta);
        let yPos = engine.addMetadataSection();

        yPos = engine.addKPIs([
            { label: "SKF Code", value: selectedBearing.code },
            { label: "Type", value: typeInfo.name.split(' ')[0] },
            { label: "L10h Life", value: `${results.L10h > 100000 ? '>100k' : results.L10h.toFixed(0)} hrs` }
        ], yPos);

        yPos = engine.addSectionTitle("Operating Conditions & Ratings", yPos);
        engine.addTable({
            head: [["Parameter", "Value", "Notes"]],
            body: [
                ["Radial Load (Fr)", `${fr} N`, "User Input"],
                ["Axial Load (Fa)", `${fa} N`, "User Input"],
                ["Operating Speed", `${rpm} RPM`, "User Input"],
                ["Target Reliability", `${reliability}%`, "ISO 281 L10 adjustment"],
                ["Dynamic Rating (C)", `${selectedBearing.C} kN`, "Catalog Data"],
                ["Static Rating (C0)", `${selectedBearing.C0} kN`, "Catalog Data"]
            ],
            startY: yPos
        });

        // Try to add the 2D graphic manually or text
        yPos = engine.addSectionTitle("Dimensions", yPos);
        engine.addTable({
            head: [["Inner Dia (d)", "Outer Dia (D)", "Width (B)", "Weight Estimation"]],
            body: [
                [`${selectedBearing.d} mm`, `${selectedBearing.D} mm`, `${selectedBearing.B} mm`, `${((Math.pow(selectedBearing.D, 2) - Math.pow(selectedBearing.d, 2)) * selectedBearing.B * 0.6 / 1e9 * 7850).toFixed(3)} kg`]
            ],
            startY: yPos
        });

        engine.save(`Bearing_Datasheet_${meta.referenceNo}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-slate-200 select-none p-6">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-6 justify-end">
                <button
                    onClick={addToProject}
                    className="mr-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95"
                >
                    <Plus size={16} />
                    ADD TO PROJECT
                </button>

                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
                >
                    <FileText size={16} />
                    REPORT
                </button>

                <button onClick={() => setViewMode('2D')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border ${viewMode === '2D' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}>2D</button>
                <button onClick={() => setViewMode('3D')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-full border ${viewMode === '3D' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}>3D</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">

                {/* 1. Visualization */}
                <div className="h-[300px] w-full bg-white/[0.02] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                    <EngineeringVisualization status={status} label="BEARING GEOMETRY">
                        {viewMode === '2D' ? (
                            <div className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[180px]">
                                <TechnicalDrawing
                                    mode="bearing"
                                    activeField={null}
                                    data={{
                                        od: selectedBearing.D,
                                        id: selectedBearing.d,
                                        width: selectedBearing.B,
                                        type: selectedBearing.type.includes('ball') ? 'ball' :
                                            selectedBearing.type.includes('tapered') ? 'tapered' :
                                                selectedBearing.type.includes('needle') ? 'needle' : 'roller'
                                    }}
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/50 px-2 py-1 rounded border border-white/10">
                                    <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                                    <span className="font-mono">{selectedBearing.code}</span>
                                </div>
                            </div>
                        ) : (
                            <Canvas shadows dpr={[1, 2]} camera={{ position: [200, 200, 200], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <spotLight position={[300, 300, 300]} angle={0.15} penumbra={1} intensity={1} castShadow />
                                <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                                    <Stage environment="city" intensity={0.5}>
                                        <Bearing3D
                                            od={selectedBearing.D}
                                            id={selectedBearing.d}
                                            width={selectedBearing.B}
                                            type={selectedBearing.type}
                                            rotation={[Math.PI / 2, 0, 0]} // Stand up
                                        />
                                    </Stage>
                                </PresentationControls>
                            </Canvas>
                        )}
                    </EngineeringVisualization>
                </div>

                {/* 2. Selection Grid */}
                <div className="bg-black/40 rounded-3xl border border-white/10 p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                            <input
                                className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                placeholder="Search SKF Code..."
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white/[0.03] border border-white/10 rounded-full px-4 py-2.5 text-xs text-gray-300 font-bold uppercase tracking-widest min-w-[120px] focus:outline-none focus:border-cyan-500/50"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            {BEARING_TYPE_FILTERS.map(f => (
                                <option key={f.id} value={f.id} className="bg-[#050709] text-white">{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredBearings.slice(0, 30).map(b => (
                            <button
                                key={b.code}
                                onClick={() => setSelectedBearing(b)}
                                className={`text-[11px] font-black tracking-widest py-3 px-2 rounded-2xl border transition-all ${selectedBearing.code === b.code
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {b.code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4">Applied Loads</div>
                        <CalculatorInput label="Radial (Fr)" unit="N" value={fr} onChange={(e) => setFr(Number(e.target.value))} />
                        <CalculatorInput label="Axial (Fa)" unit="N" value={fa} onChange={(e) => setFa(Number(e.target.value))} />
                    </div>
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4">Operating Conditions</div>
                        <CalculatorInput label="Speed" unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                        <CalculatorInput label="Reliability" unit="%" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} />
                    </div>
                </div>

                {/* 4. Results */}
                <div className="bg-black/60 rounded-[40px] p-8 border border-cyan-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">ISO 281 Life Prediction (L10h)</span>
                        {status === 'valid' ? <CheckCircle size={18} className="text-cyan-400" /> : <AlertTriangle size={18} className="text-red-500 animate-pulse" />}
                    </div>
                    <div className="text-6xl font-black font-mono text-white mb-6 tracking-tighter relative z-10 flex items-end gap-3">
                        {results.L10h > 100000 ? '>100k' : results.L10h.toFixed(0)} <span className="text-sm text-cyan-500 tracking-widest uppercase mb-2">hours</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-400 border-t border-white/10 pt-6 font-bold tracking-widest uppercase relative z-10">
                        <div>Static Safety (S0): <span className={results.staticSafety > 1 ? 'text-cyan-400 font-black' : 'text-red-500 font-black'}>{results.staticSafety.toFixed(2)}</span></div>
                        <div>Dyn. Rating (C): <span className="text-white font-black">{selectedBearing.C} kN</span></div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>

            <ReportSettingsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={generateEnterpriseReport}
                defaultTitle="Iso 281 Bearing Life Analysis"
            />
        </div>
    );
}

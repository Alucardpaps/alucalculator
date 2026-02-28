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
import { Search, Info, CheckCircle, AlertTriangle } from 'lucide-react';

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
    // Search & Filter State
    const [searchCode, setSearchCode] = useState('');
    const [typeFilter, setTypeFilter] = useState<BearingType | 'all'>('all');
    const [selectedBearing, setSelectedBearing] = useState<BearingData>(BEARING_CATALOG[14]); // 6204
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

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

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border-b border-slate-800 justify-end">
                <button onClick={() => setViewMode('2D')} className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '2D' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>2D</button>
                <button onClick={() => setViewMode('3D')} className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '3D' ? 'bg-slate-700 text-ind-orange' : 'text-slate-500 hover:text-white'}`}>3D</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <div className="h-64 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5 relative">
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
                <div className="bg-[#2a2a2a] rounded-lg border border-[#333] p-2">
                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2 top-2 text-slate-500" />
                            <input
                                className="w-full bg-[#1e1e1e] border border-slate-700 rounded pl-7 py-1 text-xs text-white"
                                placeholder="Search SKF Code..."
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-[#1e1e1e] border border-slate-700 rounded px-2 py-1 text-xs text-white max-w-[100px]"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            {BEARING_TYPE_FILTERS.map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-1 max-h-[120px] overflow-y-auto pr-1">
                        {filteredBearings.slice(0, 30).map(b => (
                            <button
                                key={b.code}
                                onClick={() => setSelectedBearing(b)}
                                className={`text-[10px] font-mono p-1 rounded border text-center transition-colors ${selectedBearing.code === b.code
                                    ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400'
                                    : 'bg-[#151515] border-transparent text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                {b.code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Loads</div>
                        <CalculatorInput label="Radial (Fr)" unit="N" value={fr} onChange={(e) => setFr(Number(e.target.value))} />
                        <CalculatorInput label="Axial (Fa)" unit="N" value={fa} onChange={(e) => setFa(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Condition</div>
                        <CalculatorInput label="Speed" unit="RPM" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
                        <CalculatorInput label="Reliability" unit="%" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} />
                    </div>
                </div>

                {/* 4. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 uppercase">Life Prediction (L10h)</span>
                        {status === 'valid' ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                    </div>
                    <div className="text-3xl font-mono font-bold text-white mb-2">
                        {results.L10h > 100000 ? '>100k' : results.L10h.toFixed(0)} <span className="text-sm text-slate-500">hours</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-700 pt-2">
                        <div>Static Safety: <span className={results.staticSafety > 1 ? 'text-green-400' : 'text-red-400'}>{results.staticSafety.toFixed(2)}</span></div>
                        <div>Dyn. Rating (C): {selectedBearing.C} kN</div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}

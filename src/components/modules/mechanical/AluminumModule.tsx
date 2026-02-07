'use client';

import { useState, useMemo } from 'react';
import { formatEngineeringValue } from '@/utils/formatting';
import { useWeightCalculator, MetalShape } from "@/hooks/useWeightCalculator";
import { MATERIALS_DB } from "@/data/materialsData";
import { EngineeringVisualization } from '@/components/ui/EngineeringVisualization';
import { AssumptionPanel, CalculationMetadata } from '@/components/ui/AssumptionPanel';
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TechnicalDrawing3D } from "@/components/TechnicalDrawing3D";
import { CalculatorInput } from "@/components/CalculatorInput";
import { Box, Layers, Circle, Cylinder, Zap, Settings, Triangle, Columns, Magnet, Type, Hexagon } from 'lucide-react';

export function AluminumModule({ lang, dict }: { lang: string, dict: any }) {
    // Core Logic Hook
    const {
        shape, setShape,
        unit, setUnit,
        inputs, setInputs,
        updateInput,
        weight,
        materialName, setMaterialName
    } = useWeightCalculator();

    const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
    const [activeTab, setActiveTab] = useState<'inputs' | 'details'>('inputs');

    // Shapes Config
    const shapesConfig: { id: MetalShape, label: string, icon: any }[] = [
        { id: 'box', label: 'Box', icon: Box },
        { id: 'sheet', label: 'Sheet', icon: Layers },
        { id: 'pipe', label: 'Pipe', icon: Circle },
        { id: 'bar', label: 'Bar', icon: Cylinder },
        { id: 'angle', label: 'Angle', icon: Triangle },
        { id: 'beam', label: 'Beam', icon: Columns },
        { id: 'channel', label: 'Channel', icon: Magnet },
        { id: 'tee', label: 'Tee', icon: Type },
        { id: 'hex', label: 'Hex', icon: Hexagon },
    ];

    const activeMaterial = useMemo(() =>
        MATERIALS_DB.find(m => m.name === materialName) || MATERIALS_DB[0],
        [materialName]);

    // Validation
    const isValid = useMemo(() => {
        const w = parseFloat(inputs.width) || 0;
        const h = parseFloat(inputs.height) || 0;
        const wt = parseFloat(inputs.wallThickness) || 0;

        if (shape === 'box') {
            if (wt * 2 >= w && w > 0) return false;
            if (wt * 2 >= h && h > 0) return false;
        }
        return true;
    }, [inputs, shape]);

    const status = isValid ? 'valid' : 'invalid';

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "ISO 10042:2018",
        standardTitle: "Arc-welded joints in aluminium and its alloys",
        version: "2.0.1",
        assumptions: [
            "Temp: 20°C / 68°F",
            `Density: ${activeMaterial.density} g/cm³`,
            "Tolerance: ISO 2768-m"
        ]
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('inputs')}
                    className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 ${activeTab === 'inputs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    <Settings size={14} /> Design
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                    onClick={() => setViewMode('2D')}
                    className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '2D' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    2D
                </button>
                <button
                    onClick={() => setViewMode('3D')}
                    className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '3D' ? 'bg-slate-700 text-ind-orange' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    3D
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">

                {/* 1. Vis - Flexible Height */}
                <div className="flex-[2] min-h-[200px] w-full bg-black/20 rounded-lg overflow-hidden border border-white/5 relative">
                    <EngineeringVisualization status={status} label={`${shape.toUpperCase()} PROFILE`}>
                        {viewMode === '2D' ? (
                            <TechnicalDrawing shape={shape} activeField={null} data={inputs} />
                        ) : (
                            <TechnicalDrawing3D shape={shape} activeField={null} inputs={inputs} />
                        )}
                    </EngineeringVisualization>
                </div>

                {/* Bottom Controls - Fixed Scrollable Area if needed, or just flex items */}
                <div className="flex-none space-y-4 overflow-y-auto pr-1">

                    {/* 1.5 Material Selector */}
                    <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] uppercase text-slate-400 font-bold">{dict.common?.material || "Material"}</label>
                            <span className="text-[9px] font-mono text-slate-500">{activeMaterial.density} g/cm³</span>
                        </div>
                        <select
                            value={materialName}
                            onChange={(e) => setMaterialName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                            {['Aluminum', 'Steel', 'Stainless', 'Non-Ferrous', 'Superalloy', 'Plastic'].map(cat => (
                                <optgroup key={cat} label={cat}>
                                    {MATERIALS_DB.filter(m => m.category === cat).map(m => (
                                        <option key={m.name} value={m.name}>{m.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* 2. Shape Selector */}
                    <div className="grid grid-cols-4 gap-2">
                        {shapesConfig.map(s => {
                            // Safer lookup for shape labels
                            const label = dict.aluminum?.shapes?.[s.id] || s.label;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setShape(s.id)}
                                    className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${shape === s.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-700 hover:bg-slate-800 text-slate-500'}`}
                                >
                                    <s.icon size={16} />
                                    <span className="text-[9px] uppercase font-bold text-center leading-tight">{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 3. Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Box Inputs */}
                        {shape === 'box' && (
                            <>
                                <CalculatorInput label={dict.aluminum?.params?.width || "Width (A)"} unit="mm" value={inputs.width} onChange={e => updateInput('width', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.height || "Height (B)"} unit="mm" value={inputs.height} onChange={e => updateInput('height', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.wall || "Wall (t)"} unit="mm" value={inputs.wallThickness} onChange={e => updateInput('wallThickness', e.target.value)} />
                            </>
                        )}

                        {/* Sheet Inputs */}
                        {shape === 'sheet' && (
                            <>
                                <CalculatorInput label={dict.aluminum?.params?.width || "Width"} unit="mm" value={inputs.width} onChange={e => updateInput('width', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.thickness || "Thickness"} unit="mm" value={inputs.thickness} onChange={e => updateInput('thickness', e.target.value)} />
                            </>
                        )}

                        {/* Pipe Inputs */}
                        {shape === 'pipe' && (
                            <>
                                <CalculatorInput label={dict.aluminum?.params?.diameter || "Diameter (OD)"} unit="mm" value={inputs.diameter} onChange={e => updateInput('diameter', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.wall || "Wall (t)"} unit="mm" value={inputs.wallThickness} onChange={e => updateInput('wallThickness', e.target.value)} />
                            </>
                        )}

                        {/* Bar Inputs */}
                        {shape === 'bar' && (
                            <CalculatorInput label={dict.aluminum?.params?.diameter || "Diameter (D)"} unit="mm" value={inputs.diameter} onChange={e => updateInput('diameter', e.target.value)} />
                        )}

                        {/* Hex Inputs */}
                        {shape === 'hex' && (
                            <CalculatorInput label={dict.aluminum?.params?.diameter || "Flat-to-Flat (S)"} unit="mm" value={inputs.diameter} onChange={e => updateInput('diameter', e.target.value)} />
                        )}

                        {/* Angle Inputs */}
                        {shape === 'angle' && (
                            <>
                                <CalculatorInput label={dict.aluminum?.params?.width || "Leg 1 (A)"} unit="mm" value={inputs.width} onChange={e => updateInput('width', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.height || "Leg 2 (B)"} unit="mm" value={inputs.height} onChange={e => updateInput('height', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.thickness || "Thickness (t)"} unit="mm" value={inputs.thickness} onChange={e => updateInput('thickness', e.target.value)} />
                            </>
                        )}

                        {/* Beam/Channel/Tee Inputs */}
                        {['beam', 'channel', 'tee'].includes(shape) && (
                            <>
                                <CalculatorInput label={dict.aluminum?.params?.width || "Width (A)"} unit="mm" value={inputs.width} onChange={e => updateInput('width', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.height || "Height (B)"} unit="mm" value={inputs.height} onChange={e => updateInput('height', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.web || "Web Thick (tw)"} unit="mm" value={inputs.webThickness} onChange={e => updateInput('webThickness', e.target.value)} />
                                <CalculatorInput label={dict.aluminum?.params?.flange || "Flange Thick (tf)"} unit="mm" value={inputs.flangeThickness} onChange={e => updateInput('flangeThickness', e.target.value)} />
                            </>
                        )}

                        <div className="space-y-1 col-span-2 border-t border-white/5 pt-2">
                            <CalculatorInput label={`${dict.aluminum?.params?.length || "Length"} (${unit})`} unit={unit === 'metric' ? 'mm' : 'in'} value={inputs.length} onChange={e => updateInput('length', e.target.value)} />
                        </div>
                    </div>

                    {/* 4. Results */}
                    <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between border border-slate-700">
                        <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold">{dict.common?.totalWeight || "Total Weight"}</div>
                            <div className="text-xl font-mono font-bold text-white tracking-tight">
                                {formatEngineeringValue(weight, { decimals: 3, unit: unit === 'metric' ? 'kg' : 'lbs' })}
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Zap size={16} />
                        </div>
                    </div>

                    {/* Assumption Panel */}
                    <AssumptionPanel metadata={metadata} status={status} />
                </div>
            </div>
        </div>
    );
}

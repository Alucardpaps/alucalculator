"use client";

import { useWeightCalculator, MetalShape } from "@/hooks/useWeightCalculator";
import { MATERIALS_DB } from "@/data/materialsData";
import { useState, useEffect, useMemo } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { TheorySection } from "@/components/TheorySection";
import { Plus, Box, Layers, Circle, Cylinder, ArrowRightLeft, Zap, Download, Triangle, Tally1, LayoutTemplate, Diamond, Baseline, Calculator, LucideIcon } from 'lucide-react'; // Added icons
import { ProjectManager } from '@/components/ProjectManager';
import { MarketService } from "@/logic/MarketService";
import { DxfService } from "@/logic/DxfService";
import { AdvancedCalculator } from '@/components/AdvancedCalculator';
import { STANDARD_PROFILES } from '@/data/standardProfiles';
import { useUrlState } from '@/hooks/useUrlState';
import { useCallback } from "react";

import { TechnicalDrawing3D } from "@/components/TechnicalDrawing3D";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ComparisonBar } from "@/components/ComparisonBar";
import { EngineeringWarnings } from "@/components/EngineeringWarnings";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectItem {
    id: string;
    shape: MetalShape;
    material: string;
    description: string;
    qty: number;
    length: number; // mm
    weight: number; // Single item weight
    totalWeight: number;
    cost: number;
}

export default function AluminumPageClient({ lang, dict }: { lang: string, dict: Record<string, any> }) {
    // URL State Management
    const { getInitialState, updateUrl } = useUrlState();

    // Parse URL params for initialization
    const initialUrlParams = useMemo(() => {
        const p = getInitialState();
        return {
            shape: p.s as MetalShape | undefined,
            materialName: p.m,
            customDensity: p.cd,
            inputs: {
                width: p.w,
                height: p.h,
                length: p.l,
                thickness: p.t,
                wallThickness: p.wt,
                diameter: p.d,
                webThickness: p.tw,
                flangeThickness: p.tf
            }
        };
    }, [getInitialState]); // Run once on mount

    // Calculators
    const {
        shape, setShape,
        unit, setUnit,
        inputs, setInputs,
        updateInput,
        weight,
        materialName, setMaterialName,
        customDensity, setCustomDensity
    } = useWeightCalculator(initialUrlParams);

    // Sync state back to URL (Debounced via useUrlState internal logic? No, useUrlState needs manual call)
    // We'll use a local effect here to debounce the updates to URL
    useEffect(() => {
        const timer = setTimeout(() => {
            updateUrl({
                s: shape,
                m: materialName,
                cd: customDensity,
                // Only save non-empty inputs to keep URL clean
                w: inputs.width,
                h: inputs.height,
                l: inputs.length,
                t: inputs.thickness,
                wt: inputs.wallThickness,
                d: inputs.diameter,
                tw: inputs.webThickness,
                tf: inputs.flangeThickness
            });
        }, 1000); // 1s debounce for URL updates

        return () => clearTimeout(timer);
    }, [shape, materialName, customDensity, inputs, updateUrl]);

    const [projectList, setProjectList] = useState<ProjectItem[]>([]);
    const [useLivePrice, setUseLivePrice] = useState(false);
    const [manualPrice, setManualPrice] = useState(3.5); // $/kg manual price
    const [liveData, setLiveData] = useState<{ price: number, currency: string }>({ price: 0, currency: '$' });
    const [showAdvancedCalc, setShowAdvancedCalc] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');

    // Comparison State
    const [comparisonBaseline, setComparisonBaseline] = useState<{ weight: number, cost: number, description: string } | null>(null);

    // --- STANDARD PROFILE HANDLER ---
    const handleStandardSelect = (series: string, name: string) => {
        const profile = STANDARD_PROFILES[series]?.find(p => p.name === name);
        if (profile) {
            setInputs({
                ...inputs,
                height: String(profile.h),
                width: String(profile.b),
                webThickness: String(profile.tw),
                flangeThickness: String(profile.tf),
                rootRadius: String(profile.r)
            });
        }
    };

    // Derive active material object
    const activeMaterial = useMemo(() => {
        if (materialName === 'Custom') {
            return {
                name: 'Custom Material',
                category: 'Custom',
                density: parseFloat(customDensity) || 0,
                yield: 0,
                tensile: 0,
                hardness: 'N/A',
                weldability: 'N/A',
                machinability: 'N/A',
                youngsModulus: 0,
                poissonsRatio: 0.3,

            }; // Mock object
        }
        return MATERIALS_DB.find(m => m.name === materialName) || MATERIALS_DB[0];
    }, [materialName, customDensity]);

    // Constants
    const materials = MATERIALS_DB;

    // Shape Buttons Config
    const shapesConfig: { id: MetalShape, label: string, icon: LucideIcon }[] = useMemo(() => [
        { id: 'box', label: dict.aluminum.shapes.box || 'Box', icon: Box },
        { id: 'sheet', label: dict.aluminum.shapes.sheet || 'Sheet', icon: Layers },
        { id: 'pipe', label: dict.aluminum.shapes.pipe || 'Pipe', icon: Circle },
        { id: 'bar', label: dict.aluminum.shapes.bar || 'Bar', icon: Cylinder },
        { id: 'angle', label: 'Angle', icon: Triangle },
        { id: 'beam', label: 'Beam', icon: LayoutTemplate }, // I-Beam
        { id: 'channel', label: 'Channel', icon: Baseline }, // U-Channel visually
        { id: 'tee', label: 'T-Profile', icon: Tally1 },
        { id: 'hex', label: 'Hex Bar', icon: Diamond },
    ], [dict.aluminum.shapes.box, dict.aluminum.shapes.sheet, dict.aluminum.shapes.pipe, dict.aluminum.shapes.bar]);

    // Add fallback labels for i18n if missing keys
    const getShapeLabel = useCallback((s: MetalShape) => {
        return shapesConfig.find(sc => sc.id === s)?.label || s;
    }, [shapesConfig]);

    // Live Price Logic
    useEffect(() => {
        if (useLivePrice) {
            MarketService.getData().then(data => {
                const baseLme = data.aluminum; // USD/ton
                const lmeKg = baseLme / 1000;
                // Mock alloy premium factors
                const factorMap: Record<string, number> = {
                    '6061': 1.2, '6063': 1.1, '7075': 1.8, '5083': 1.3,
                    'Alu 1050': 1.05, 'Alu 2024': 1.4
                };
                let factor = 1.2;
                for (const key in factorMap) {
                    if (activeMaterial.name.includes(key)) {
                        factor = factorMap[key];
                        break;
                    }
                }
                setLiveData({ price: lmeKg * factor, currency: '$' });
            });
        }
    }, [useLivePrice, activeMaterial]);

    const unitPrice = useLivePrice ? liveData.price : manualPrice;
    const currency = useLivePrice ? liveData.currency : (dict.currency || '$');

    // --- AUTO-HISTORY LOGIC ---
    useEffect(() => {
        if (weight <= 0) return;

        const timer = setTimeout(() => {
            try {
                const stored = localStorage.getItem('calc_history');
                const history = stored ? JSON.parse(stored) : [];

                // Create description
                let desc = `${getShapeLabel(shape)} - ${activeMaterial.name}`;
                if (shape === 'box') desc += ` (${inputs.width}x${inputs.height}x${inputs.wallThickness})`;
                else if (shape === 'bar') desc += ` (D:${inputs.diameter})`;
                else desc += ` L:${inputs.length}`;

                const newItem = {
                    id: Date.now().toString(),
                    description: desc,
                    weight: `${weight.toFixed(3)} ${unit === 'metric' ? 'kg' : 'lbs'}`,
                    timestamp: Date.now()
                };

                // Avoid duplicates (simple check: same weight and desc as last item)
                if (history.length > 0) {
                    const last = history[0];
                    if (last.weight === newItem.weight && last.description === newItem.description) return;
                }

                const newHistory = [newItem, ...history].slice(0, 20);
                localStorage.setItem('calc_history', JSON.stringify(newHistory));
                window.dispatchEvent(new Event('storage-local-update'));
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [weight, shape, inputs, activeMaterial, unit]);

    // Actions
    const addToProjectList = () => {
        if (weight <= 0) return;

        // Maintain internal length in MM
        let lengthInMm = parseFloat(inputs.length);
        if (unit === 'imperial') lengthInMm *= 25.4;

        const newItem: ProjectItem = {
            id: Date.now().toString(),
            shape,
            material: activeMaterial.name,
            description: `${activeMaterial.category} ${getShapeLabel(shape)}`,
            qty: 1,
            length: parseFloat(lengthInMm.toFixed(1)),
            weight: weight,
            totalWeight: weight,
            cost: weight * unitPrice
        };
        setProjectList([...projectList, newItem]);
    };

    const handleFocus = (field: string) => setActiveField(field);
    const handleBlur = () => setActiveField(null);

    const handleDownloadDxf = () => {
        const inputsPayload = {
            width: inputs.width,
            height: inputs.height,
            length: inputs.length,
            diameter: inputs.diameter,
            wallThickness: inputs.wallThickness,
            thickness: inputs.thickness,
            webThickness: inputs.webThickness,
            flangeThickness: inputs.flangeThickness,
        };
        const dxfContent = DxfService.generate(shape, inputsPayload);
        DxfService.download(`alucalculator_${shape}_${Date.now()}.dxf`, dxfContent);
    };

    return (
        <main className="min-h-screen bg-blueprint-grid flex flex-col items-center p-4 lg:p-12 font-sans overflow-x-hidden">
            <HistorySidebar />

            {/* Standardized Dashboard Header */}
            <header className="w-full max-w-7xl flex flex-col lg:flex-row justify-between items-center mb-8 bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-surface-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                    <div className="w-12 h-12 bg-tech-blue rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-lg group">
                        Al
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight uppercase">{dict.aluminum.title}</h1>
                        <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{dict.aluminum.desc}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="bg-surface-100 rounded-lg p-2 text-center min-w-[100px] hidden md:block">
                        <div className="field-label mb-0">{dict.market?.aluminum || 'Aluminum'}</div>
                        <div className="text-lg font-bold text-surface-700">{unitPrice > 0 ? `${currency}${unitPrice.toFixed(2)}` : '---'}</div>
                    </div>

                    <button
                        onClick={() => setShowAdvancedCalc(true)}
                        className="btn-secondary py-2 px-4 h-full"
                    >
                        <Calculator size={16} /> <span className="hidden md:inline">Advanced Calc</span>
                    </button>
                </div>
            </header>

            <AdvancedCalculator isOpen={showAdvancedCalc} onClose={() => setShowAdvancedCalc(false)} />

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COL: CALCULATOR INPUTS */}
                <div className="lg:col-span-7 space-y-8">

                    {/* Shape Selector - Updated with Grid */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <label className="field-label mb-4">Select Profile Shape</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            <AnimatePresence mode="popLayout">
                                {shapesConfig.map((s) => (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        key={s.id}
                                        onClick={() => setShape(s.id)}
                                        className={`relative h-20 rounded-xl border-2 transition-colors duration-200 flex flex-col items-center justify-center gap-1.5 ${shape === s.id ? 'border-brand-orange bg-brand-orange/5 text-brand-orange shadow-md z-10' : 'border-surface-200 hover:border-brand-blue/30 hover:bg-surface-50 text-surface-500'}`}
                                    >
                                        <s.icon size={20} />
                                        <span className="text-[10px] font-bold uppercase text-center leading-none">{s.label}</span>
                                        {shape === s.id && (
                                            <motion.div
                                                layoutId="active-dot"
                                                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-orange rounded-full"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Inputs & Material */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 relative overflow-hidden">

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Material & Unit */}
                            <div className="space-y-6">
                                <div>
                                    <label className="field-label">Material Alloy</label>
                                    <div className="relative">
                                        <select
                                            value={activeMaterial.name}
                                            onChange={(e) => setMaterialName(e.target.value)}
                                            className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            {materials.map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                            <option value="Custom">✨ Custom (Specify Density)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400 flex justify-between font-mono">
                                        {materialName === 'Custom' ? (
                                            <div className="flex items-center gap-2">
                                                <span>Density:</span>
                                                <input
                                                    type="number"
                                                    value={customDensity}
                                                    onChange={(e) => setCustomDensity(e.target.value)}
                                                    className="w-16 h-6 px-1 bg-white border border-slate-300 rounded text-slate-700 font-bold text-center"
                                                    step="0.01"
                                                />
                                                <span>g/cm³</span>
                                            </div>
                                        ) : (
                                            <span>Density: {activeMaterial.density} g/cm³</span>
                                        )}
                                        <span className={useLivePrice ? "text-ind-orange font-bold animate-pulse" : ""}>
                                            {unitPrice > 0 ? `${currency}${unitPrice.toFixed(2)} /kg` : 'No Price'}
                                        </span>
                                    </div>

                                    {/* Live Price Toggle */}
                                    <label className="mt-4 flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${useLivePrice ? 'bg-brand-orange' : 'bg-surface-200'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${useLivePrice ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <input type="checkbox" checked={useLivePrice} onChange={(e) => setUseLivePrice(e.target.checked)} className="hidden" />
                                        <span className={`text-xs font-bold uppercase transition-colors ${useLivePrice ? 'text-brand-orange' : 'text-surface-400'}`}>
                                            {useLivePrice ? (dict?.market?.live || 'Live') : (dict?.market?.useLivePrice || 'Canlı Fiyat Kullan')}
                                        </span>
                                    </label>

                                    {/* Manual Price Input - Only when Live Price is OFF */}
                                    {!useLivePrice && (
                                        <div className="mt-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                                {lang === 'tr' ? 'Manuel Fiyat' : 'Manual Price'}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={manualPrice}
                                                    onChange={(e) => setManualPrice(Number(e.target.value))}
                                                    className="w-24 h-10 px-3 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <span className="text-sm text-slate-500 font-medium">{currency}/kg</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="field-label mb-2">Unit System</label>
                                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                        <button
                                            onClick={() => setUnit('metric')}
                                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${unit === 'metric' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Metric (mm)
                                        </button>
                                        <button
                                            onClick={() => setUnit('imperial')}
                                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${unit === 'imperial' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Imperial (in)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dimensions Inputs */}
                            <div className="space-y-4">
                                {shape === 'box' && (
                                    <>
                                        <CalculatorInput
                                            label={dict.dimensions.width}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label={dict.dimensions.height}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.height}
                                            onChange={(e: any) => updateInput('height', e.target.value)}
                                            onFocus={() => handleFocus('height')}
                                            onBlur={handleBlur}
                                            active={activeField === 'height'}
                                        />
                                        <CalculatorInput
                                            label={dict.dimensions.wallThickness}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.wallThickness}
                                            onChange={(e: any) => updateInput('wallThickness', e.target.value)}
                                            onFocus={() => handleFocus('wallThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'wallThickness'}
                                        />
                                    </>
                                )}
                                {shape === 'sheet' && (
                                    <>
                                        <CalculatorInput
                                            label={dict.dimensions.width}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label={dict.dimensions.thickness}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.thickness}
                                            onChange={(e: any) => updateInput('thickness', e.target.value)}
                                            onFocus={() => handleFocus('thickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'thickness'}
                                        />
                                    </>
                                )}
                                {shape === 'pipe' && (
                                    <>
                                        <CalculatorInput
                                            label={dict.dimensions.outerDiameter}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.diameter}
                                            onChange={(e: any) => updateInput('diameter', e.target.value)}
                                            onFocus={() => handleFocus('diameter')}
                                            onBlur={handleBlur}
                                            active={activeField === 'diameter'}
                                        />
                                        <CalculatorInput
                                            label={dict.dimensions.wallThickness}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.wallThickness}
                                            onChange={(e: any) => updateInput('wallThickness', e.target.value)}
                                            onFocus={() => handleFocus('wallThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'wallThickness'}
                                        />
                                    </>
                                )}
                                {shape === 'bar' && (
                                    <CalculatorInput
                                        label={dict.dimensions.diameter}
                                        unit={unit === 'metric' ? 'mm' : 'in'}
                                        value={inputs.diameter}
                                        onChange={(e: any) => updateInput('diameter', e.target.value)}
                                        onFocus={() => handleFocus('diameter')}
                                        onBlur={handleBlur}
                                        active={activeField === 'diameter'}
                                    />
                                )}
                                {shape === 'hex' && (
                                    <CalculatorInput
                                        label="Key Size (Flat-Flat)"
                                        unit={unit === 'metric' ? 'mm' : 'in'}
                                        value={inputs.diameter}
                                        onChange={(e: any) => updateInput('diameter', e.target.value)}
                                        onFocus={() => handleFocus('diameter')}
                                        onBlur={handleBlur}
                                        active={activeField === 'diameter'}
                                    />
                                )}
                                {shape === 'angle' && (
                                    <>
                                        <CalculatorInput
                                            label="Leg A (Width)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label="Leg B (Height)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.height}
                                            onChange={(e: any) => updateInput('height', e.target.value)}
                                            onFocus={() => handleFocus('height')}
                                            onBlur={handleBlur}
                                            active={activeField === 'height'}
                                        />
                                        <CalculatorInput
                                            label={dict.dimensions.thickness}
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.thickness}
                                            onChange={(e: any) => updateInput('thickness', e.target.value)}
                                            onFocus={() => handleFocus('thickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'thickness'}
                                        />
                                    </>
                                )}
                                {shape === 'beam' && (
                                    <>
                                        <CalculatorInput
                                            label="Height (H)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.height}
                                            onChange={(e: any) => updateInput('height', e.target.value)}
                                            onFocus={() => handleFocus('height')}
                                            onBlur={handleBlur}
                                            active={activeField === 'height'}
                                        />
                                        <CalculatorInput
                                            label="Flange Width (B)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label="Web Thickness (Tw)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.webThickness}
                                            onChange={(e: any) => updateInput('webThickness', e.target.value)}
                                            onFocus={() => handleFocus('webThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'webThickness'}
                                        />
                                        <CalculatorInput
                                            label="Flange Thickness (Tf)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.flangeThickness}
                                            onChange={(e: any) => updateInput('flangeThickness', e.target.value)}
                                            onFocus={() => handleFocus('flangeThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'flangeThickness'}
                                        />
                                    </>
                                )}
                                {shape === 'channel' && (
                                    <>
                                        <CalculatorInput
                                            label="Height (H)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.height}
                                            onChange={(e: any) => updateInput('height', e.target.value)}
                                            onFocus={() => handleFocus('height')}
                                            onBlur={handleBlur}
                                            active={activeField === 'height'}
                                        />
                                        <CalculatorInput
                                            label="Width (B)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label="Base Thickness (Tw)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.webThickness}
                                            onChange={(e: any) => updateInput('webThickness', e.target.value)}
                                            onFocus={() => handleFocus('webThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'webThickness'}
                                        />
                                        <CalculatorInput
                                            label="Flange Thickness (Tf)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.flangeThickness}
                                            onChange={(e: any) => updateInput('flangeThickness', e.target.value)}
                                            onFocus={() => handleFocus('flangeThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'flangeThickness'}
                                        />
                                    </>
                                )}
                                {shape === 'tee' && (
                                    <>
                                        <CalculatorInput
                                            label="Height (H)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.height}
                                            onChange={(e: any) => updateInput('height', e.target.value)}
                                            onFocus={() => handleFocus('height')}
                                            onBlur={handleBlur}
                                            active={activeField === 'height'}
                                        />
                                        <CalculatorInput
                                            label="Width (B)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.width}
                                            onChange={(e: any) => updateInput('width', e.target.value)}
                                            onFocus={() => handleFocus('width')}
                                            onBlur={handleBlur}
                                            active={activeField === 'width'}
                                        />
                                        <CalculatorInput
                                            label="Web Thickness (Tw)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.webThickness}
                                            onChange={(e: any) => updateInput('webThickness', e.target.value)}
                                            onFocus={() => handleFocus('webThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'webThickness'}
                                        />
                                        <CalculatorInput
                                            label="Flange Thickness (Tf)"
                                            unit={unit === 'metric' ? 'mm' : 'in'}
                                            value={inputs.flangeThickness}
                                            onChange={(e: any) => updateInput('flangeThickness', e.target.value)}
                                            onFocus={() => handleFocus('flangeThickness')}
                                            onBlur={handleBlur}
                                            active={activeField === 'flangeThickness'}
                                        />
                                    </>
                                )}

                                <div className="pt-4 border-t border-slate-100">
                                    <CalculatorInput
                                        label={dict.dimensions.length}
                                        unit={unit === 'metric' ? 'mm' : 'in'}
                                        value={inputs.length}
                                        onChange={(e: any) => updateInput('length', e.target.value)}
                                        className="bg-blue-50/50 p-2 rounded-lg -mx-2"
                                        onFocus={() => handleFocus('length')}
                                        onBlur={handleBlur}
                                        active={activeField === 'length'}
                                    />
                                </div>
                            </div>

                            <EngineeringWarnings shape={shape} inputs={inputs} material={activeMaterial.category} />

                        </div>
                    </div>
                </div>

                {/* RIGHT COL: RESULTS */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 lg:self-start">

                    {/* Technical Drawing */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-1 flex flex-col items-center justify-center min-h-[350px] relative group overflow-hidden">

                        {/* View Toggle */}
                        <div className="absolute top-4 left-4 z-20 flex bg-slate-100 rounded-lg p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('2D')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '2D' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                2D BLUEPRINT
                            </button>
                            <button
                                onClick={() => setViewMode('3D')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '3D' ? 'bg-white text-ind-orange shadow' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                3D MODEL
                            </button>
                        </div>

                        <div className="w-full h-full flex items-center justify-center p-4">
                            {viewMode === '2D' ? (
                                <TechnicalDrawing shape={shape} activeField={activeField} data={inputs} />
                            ) : (
                                <div className="w-full h-[300px]">
                                    <TechnicalDrawing3D shape={shape} activeField={activeField} inputs={inputs} />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownloadDxf}
                            className="absolute bottom-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100 z-20"
                            title="Download DXF"
                        >
                            <Download size={14} />
                            DXF
                        </button>
                    </div>

                    {/* Weight Card */}
                    <motion.div
                        key={weight} // Animate on weight change? Maybe too much.
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 0.3 }}
                        className="bg-tech-blue text-white rounded-xl p-8 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-ind-orange/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">{dict.common.totalWeight}</div>
                                    <div className="text-white/50 text-xs font-mono">CALC_ID_01</div>
                                </div>
                                <div className="w-12 h-12 rounded-full border border-blue-400/30 flex items-center justify-center text-ind-orange text-xl">
                                    {weight > 0 ? <Zap size={24} className="fill-current" /> : '⚖️'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-mono font-bold tracking-tighter tabular-nums drop-shadow-md">
                                    {weight > 0 ? weight.toFixed(3) : '0.000'}
                                </div>
                                <div className="text-blue-200 text-xl font-medium mt-2">{unit === 'metric' ? 'kg' : 'lbs'}</div>
                                {unitPrice > 0 && (
                                    <div className="text-green-300 font-mono font-bold text-lg mt-2">
                                        {dict.aluminum.costData.estimatedCost}: {currency} {(weight * unitPrice).toFixed(2)}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={addToProjectList}
                                className="mt-6 w-full py-3 bg-white text-tech-blue font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                {dict.aluminum.projectList.add}
                            </button>
                        </div>
                    </motion.div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setComparisonBaseline({
                                    weight: weight,
                                    cost: weight * unitPrice,
                                    description: `${activeMaterial.name} ${getShapeLabel(shape)}`
                                });
                            }}
                            className="flex-1 py-3 bg-surface-100 hover:bg-surface-200 text-surface-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft size={18} />
                            Compare
                        </button>
                    </div>

                    {/* NEW PROJECT MANAGER */}
                    <ProjectManager
                        items={projectList}
                        setItems={setProjectList}
                        unitPrice={unitPrice}
                        currency={currency}
                        lang={lang}
                        dict={dict}
                    />

                </div>
            </div>

            <ComparisonBar
                baseline={comparisonBaseline}
                current={{
                    weight: weight,
                    cost: weight * unitPrice,
                    description: `${activeMaterial.name} ${getShapeLabel(shape)}`
                }}
                unit={unit}
                currency={currency}
                onClear={() => setComparisonBaseline(null)}
            />

            <div className="w-full max-w-7xl mt-12">
                <TheorySection title={dict.handbook.title}>
                    <p className="text-sm text-slate-600 leading-relaxed">{dict.aluminum.theory.densityDesc}</p>
                </TheorySection>
            </div>
        </main >
    );
}


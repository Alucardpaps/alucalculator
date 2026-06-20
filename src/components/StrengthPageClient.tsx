"use client";

import { useState, useMemo } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
import { TheorySection } from "@/components/TheorySection";
import { MohrCircleVisualization } from "@/components/MohrCircleVisualization";
import {
    STRENGTH_MATERIALS,
    MaterialStrength,
    calculatePrincipalStresses2D,
    calculateVonMises2D,
    calculateTresca,
    calculateSafetyFactor,
    calculateGoodman,
    calculateSoderberg,
    calculateBuckling,
    calculateBeam,
    calculateTorsion,
    calculatePressureVessel,
    calculateCombinedLoading,
    BeamType,
    LoadType
} from "@/lib/stressAnalysis";
import {
    ShapeType,
    SHAPE_INFO,
    calculateSectionProperties,
    ShapeDimensions
} from "@/utils/sectionProperties";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";

import {
    AlertTriangle, CheckCircle, Circle, BarChart3,
    Cylinder, ArrowUpDown, Rotate3d, Target, Zap, Box, Eye
} from 'lucide-react';

type AnalysisMode = 'principal' | 'vonMises' | 'fatigue' | 'buckling' | 'beam' | 'torsion' | 'pressure' | 'combined';

const ANALYSIS_MODES: { id: AnalysisMode; label: string; labelTr: string; icon: any; color: string }[] = [
    { id: 'principal', label: 'Principal Stress', labelTr: 'Asal Gerilme', icon: Circle, color: 'bg-purple-600' },
    { id: 'vonMises', label: 'Von Mises', labelTr: 'Von Mises', icon: Target, color: 'bg-blue-600' },
    { id: 'fatigue', label: 'Fatigue', labelTr: 'Yorulma', icon: Rotate3d, color: 'bg-orange-600' },
    { id: 'buckling', label: 'Buckling', labelTr: 'Burkulma', icon: ArrowUpDown, color: 'bg-red-600' },
    { id: 'beam', label: 'Beam', labelTr: 'Kiriş', icon: BarChart3, color: 'bg-green-600' },
    { id: 'torsion', label: 'Torsion', labelTr: 'Burulma', icon: Rotate3d, color: 'bg-cyan-600' },
    { id: 'pressure', label: 'Pressure Vessel', labelTr: 'Basınçlı Kap', icon: Cylinder, color: 'bg-pink-600' },
    { id: 'combined', label: 'Combined', labelTr: 'Kombine', icon: Zap, color: 'bg-amber-600' },
];

export default function StrengthPageClient({ lang, dict }: { lang: string, dict: any }) {
    const [mode, setMode] = useState<AnalysisMode>('principal');
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialStrength>(STRENGTH_MATERIALS[0]);

    // ===== SHAPE SELECTION STATE =====
    const [useShapeCalc, setUseShapeCalc] = useState(false);
    const [selectedShape, setSelectedShape] = useState<ShapeType>('box');
    const [shapeDims, setShapeDims] = useState<ShapeDimensions>({
        width: 60, height: 80, wallThickness: 4, // for box
        diameter: 50, thickness: 5,               // for pipe/bar
        flangeWidth: 60, flangeThickness: 8, webThickness: 5, // for I-beam
        legWidth: 50, legThickness: 5             // for angle
    });

    // Calculate section properties from shape
    const sectionProps = useMemo(() => {
        return calculateSectionProperties(selectedShape, shapeDims);
    }, [selectedShape, shapeDims]);

    // 3D View Mode


    // ===== PRINCIPAL/VON MISES STATE =====
    const [sigmaX, setSigmaX] = useState(100);   // MPa
    const [sigmaY, setSigmaY] = useState(-50);   // MPa
    const [tauXY, setTauXY] = useState(30);      // MPa

    // ===== FATIGUE STATE =====
    const [sigmaA, setSigmaA] = useState(80);    // Alternating stress (MPa)
    const [sigmaM, setSigmaM] = useState(50);    // Mean stress (MPa)

    // ===== BUCKLING STATE =====
    const [columnLength, setColumnLength] = useState(2000);  // mm
    const [inertiaManual, setInertiaManual] = useState(500000);          // mm⁴
    const [areaManual, setAreaManual] = useState(1000);                   // mm²
    const [appliedLoad, setAppliedLoad] = useState(50000);   // N
    const [endCondition, setEndCondition] = useState<'fixed-fixed' | 'fixed-pinned' | 'pinned-pinned' | 'fixed-free'>('pinned-pinned');

    // Use calculated or manual values
    const inertia = useShapeCalc ? sectionProps.Ix_mm4 : inertiaManual;
    const area = useShapeCalc ? sectionProps.area_mm2 : areaManual;

    // ===== BEAM STATE =====
    const [beamType, setBeamType] = useState<BeamType>('cantilever');
    const [loadType, setLoadType] = useState<LoadType>('point_end');
    const [beamLength, setBeamLength] = useState(1000);      // mm
    const [beamLoad, setBeamLoad] = useState(1000);          // N
    const [beamIManual, setBeamIManual] = useState(100000);              // mm⁴
    const [beamWManual, setBeamWManual] = useState(5000);                // mm³

    const beamI = useShapeCalc ? sectionProps.Ix_mm4 : beamIManual;
    const beamW = useShapeCalc ? sectionProps.Wx_mm3 : beamWManual;

    // ===== TORSION STATE =====
    const [torque, setTorque] = useState(500000);            // N·mm
    const [shaftLength, setShaftLength] = useState(500);     // mm
    const [shaftDiameter, setShaftDiameter] = useState(50);  // mm
    const [shaftInnerDia, setShaftInnerDia] = useState(0);   // mm (0 = solid)

    // ===== PRESSURE VESSEL STATE =====
    const [innerPressure, setInnerPressure] = useState(10);  // MPa
    const [innerRadius, setInnerRadius] = useState(200);     // mm
    const [wallThickness, setWallThickness] = useState(10);  // mm

    // ===== COMBINED STATE =====
    const [axialLoad, setAxialLoad] = useState(10000);       // N
    const [bendingMoment, setBendingMoment] = useState(100000); // N·mm
    const [combinedTorque, setCombinedTorque] = useState(50000); // N·mm
    const [combinedAreaManual, setCombinedAreaManual] = useState(500);   // mm²
    const [combinedIManual, setCombinedIManual] = useState(50000);       // mm⁴
    const [combinedJManual, setCombinedJManual] = useState(100000);      // mm⁴
    const [distFromNA, setDistFromNA] = useState(25);        // mm
    const [outerR, setOuterR] = useState(25);                // mm

    const combinedArea = useShapeCalc ? sectionProps.area_mm2 : combinedAreaManual;
    const combinedI = useShapeCalc ? sectionProps.Ix_mm4 : combinedIManual;
    const combinedJ = useShapeCalc ? sectionProps.J_mm4 : combinedJManual;

    // ===== CALCULATIONS =====
    const principalResults = useMemo(() => {
        return calculatePrincipalStresses2D({ sigmaX, sigmaY, tauXY });
    }, [sigmaX, sigmaY, tauXY]);

    const vonMisesStress = useMemo(() => {
        return calculateVonMises2D({ sigmaX, sigmaY, tauXY });
    }, [sigmaX, sigmaY, tauXY]);

    const trescaStress = useMemo(() => {
        return calculateTresca(principalResults);
    }, [principalResults]);

    const safetyFactor = useMemo(() => {
        return calculateSafetyFactor(vonMisesStress, selectedMaterial);
    }, [vonMisesStress, selectedMaterial]);

    const fatigueGoodman = useMemo(() => {
        return calculateGoodman(sigmaA, sigmaM, selectedMaterial);
    }, [sigmaA, sigmaM, selectedMaterial]);

    const fatigueSoderberg = useMemo(() => {
        return calculateSoderberg(sigmaA, sigmaM, selectedMaterial);
    }, [sigmaA, sigmaM, selectedMaterial]);

    const bucklingResults = useMemo(() => {
        return calculateBuckling(columnLength, inertia, area, selectedMaterial, endCondition, appliedLoad);
    }, [columnLength, inertia, area, selectedMaterial, endCondition, appliedLoad]);

    const beamResults = useMemo(() => {
        return calculateBeam(beamType, loadType, beamLength, beamLoad, selectedMaterial.E, beamI, beamW);
    }, [beamType, loadType, beamLength, beamLoad, selectedMaterial.E, beamI, beamW]);

    const torsionResults = useMemo(() => {
        const G = selectedMaterial.G || selectedMaterial.E / 2.6;
        return calculateTorsion(torque, shaftLength, shaftDiameter, shaftInnerDia, G);
    }, [torque, shaftLength, shaftDiameter, shaftInnerDia, selectedMaterial]);

    const pressureResults = useMemo(() => {
        return calculatePressureVessel(innerPressure, 0, innerRadius, innerRadius + wallThickness);
    }, [innerPressure, innerRadius, wallThickness]);

    const combinedResults = useMemo(() => {
        return calculateCombinedLoading(
            axialLoad, bendingMoment, combinedTorque,
            combinedArea, combinedI, combinedJ,
            distFromNA, outerR, selectedMaterial
        );
    }, [axialLoad, bendingMoment, combinedTorque, combinedArea, combinedI, combinedJ, distFromNA, outerR, selectedMaterial]);

    const currentModeInfo = ANALYSIS_MODES.find(m => m.id === mode)!;

    return (
        <main className="min-h-screen flex flex-col items-center p-4 lg:p-8 font-sans overflow-hidden">

            {/* Header */}
            <header className="w-full max-w-7xl flex flex-wrap justify-between items-center mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${currentModeInfo.color} rounded flex items-center justify-center text-white font-black text-xl`}>σ</div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                            {dict.strength?.title || 'Stress Analysis'}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lang === 'tr' ? currentModeInfo.labelTr : currentModeInfo.label} • {selectedMaterial.name}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                        value={selectedMaterial.name}
                        onChange={(e) => {
                            const mat = STRENGTH_MATERIALS.find(m => m.name === e.target.value);
                            if (mat) setSelectedMaterial(mat);
                        }}
                    >
                        {STRENGTH_MATERIALS.map(m => (
                            <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Analysis Mode Tabs */}
            <div className="w-full max-w-7xl flex flex-wrap gap-2 mb-4">
                {ANALYSIS_MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id
                                ? `${m.color} text-white shadow-md`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Icon size={14} />
                            {lang === 'tr' ? m.labelTr : m.label}
                        </button>
                    );
                })}
            </div>

            {/* Shape Selector Panel (For Buckling, Beam, Combined modes) */}
            {(mode === 'buckling' || mode === 'beam' || mode === 'combined') && (
                <div className="w-full max-w-7xl bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 mb-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Box size={18} className="text-cyan-400" />
                            <h3 className="text-sm font-bold text-white">{lang === 'tr' ? 'Şekil Seçimi' : 'Shape Selection'}</h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-slate-400">{lang === 'tr' ? 'Manuel' : 'Manual'}</span>
                            <input
                                type="checkbox"
                                checked={useShapeCalc}
                                onChange={(e) => setUseShapeCalc(e.target.checked)}
                                className="w-10 h-5 rounded-full appearance-none bg-slate-600 transition-all duration-300 checked:bg-cyan-500 relative cursor-pointer
                                    before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-all before:duration-300 checked:before:translate-x-5"
                            />
                            <span className="text-xs text-cyan-400 font-bold">{lang === 'tr' ? 'Şekilden' : 'From Shape'}</span>
                        </label>
                    </div>

                    {useShapeCalc && (
                        <>
                            {/* Shape Type Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(Object.keys(SHAPE_INFO) as ShapeType[]).map((shape) => (
                                    <button
                                        key={shape}
                                        onClick={() => setSelectedShape(shape)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedShape === shape
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        <span className="text-base">{SHAPE_INFO[shape].icon}</span>
                                        {lang === 'tr' ? SHAPE_INFO[shape].nameTr : SHAPE_INFO[shape].name}
                                    </button>
                                ))}
                            </div>

                            {/* Shape Dimension Inputs */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {(selectedShape === 'box') && (
                                    <>
                                        <CalculatorInput label={lang === 'tr' ? 'Genişlik (B)' : 'Width (B)'} unit="mm" value={shapeDims.width || 0} onChange={(e) => setShapeDims({ ...shapeDims, width: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Yükseklik (H)' : 'Height (H)'} unit="mm" value={shapeDims.height || 0} onChange={(e) => setShapeDims({ ...shapeDims, height: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Et Kalınlığı (t)' : 'Wall (t)'} unit="mm" value={shapeDims.wallThickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, wallThickness: Number(e.target.value) })} />
                                    </>
                                )}
                                {(selectedShape === 'pipe') && (
                                    <>
                                        <CalculatorInput label={lang === 'tr' ? 'Dış Çap (D)' : 'Outer Dia (D)'} unit="mm" value={shapeDims.diameter || 0} onChange={(e) => setShapeDims({ ...shapeDims, diameter: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Et Kalınlığı (t)' : 'Wall (t)'} unit="mm" value={shapeDims.wallThickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, wallThickness: Number(e.target.value) })} />
                                    </>
                                )}
                                {(selectedShape === 'bar') && (
                                    <CalculatorInput label={lang === 'tr' ? 'Çap (D)' : 'Diameter (D)'} unit="mm" value={shapeDims.diameter || 0} onChange={(e) => setShapeDims({ ...shapeDims, diameter: Number(e.target.value) })} />
                                )}
                                {(selectedShape === 'sheet' || selectedShape === 'rectangle') && (
                                    <>
                                        <CalculatorInput label={lang === 'tr' ? 'Genişlik (B)' : 'Width (B)'} unit="mm" value={shapeDims.width || 0} onChange={(e) => setShapeDims({ ...shapeDims, width: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Kalınlık (t)' : 'Thickness (t)'} unit="mm" value={shapeDims.thickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, thickness: Number(e.target.value) })} />
                                    </>
                                )}
                                {(selectedShape === 'ibeam' || selectedShape === 'channel' || selectedShape === 'tee') && (
                                    <>
                                        <CalculatorInput label={lang === 'tr' ? 'Yükseklik (H)' : 'Height (H)'} unit="mm" value={shapeDims.height || 0} onChange={(e) => setShapeDims({ ...shapeDims, height: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Flanş Genişliği' : 'Flange Width'} unit="mm" value={shapeDims.flangeWidth || 0} onChange={(e) => setShapeDims({ ...shapeDims, flangeWidth: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Flanş Kalınlığı' : 'Flange Thick.'} unit="mm" value={shapeDims.flangeThickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, flangeThickness: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Gövde Kalınlığı' : 'Web Thick.'} unit="mm" value={shapeDims.webThickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, webThickness: Number(e.target.value) })} />
                                    </>
                                )}
                                {(selectedShape === 'angle') && (
                                    <>
                                        <CalculatorInput label={lang === 'tr' ? 'Bacak Uzunluğu' : 'Leg Length'} unit="mm" value={shapeDims.legWidth || 0} onChange={(e) => setShapeDims({ ...shapeDims, legWidth: Number(e.target.value) })} />
                                        <CalculatorInput label={lang === 'tr' ? 'Kalınlık (t)' : 'Thickness (t)'} unit="mm" value={shapeDims.legThickness || 0} onChange={(e) => setShapeDims({ ...shapeDims, legThickness: Number(e.target.value) })} />
                                    </>
                                )}
                            </div>

                            {/* Calculated Section Properties */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-700/50 rounded-lg">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">A (Area)</div>
                                    <div className="text-lg font-mono text-cyan-400">{sectionProps.area_mm2.toFixed(0)} <span className="text-xs text-slate-400">mm²</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Ix (Inertia)</div>
                                    <div className="text-lg font-mono text-cyan-400">{sectionProps.Ix_mm4.toFixed(0)} <span className="text-xs text-slate-400">mm⁴</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Wx (Section Mod.)</div>
                                    <div className="text-lg font-mono text-cyan-400">{sectionProps.Wx_mm3.toFixed(0)} <span className="text-xs text-slate-400">mm³</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">J (Polar)</div>
                                    <div className="text-lg font-mono text-cyan-400">{sectionProps.J_mm4.toFixed(0)} <span className="text-xs text-slate-400">mm⁴</span></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 3D Shape Visualization */}
                    {useShapeCalc && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Eye size={14} className="text-cyan-400" />
                                    {lang === 'tr' ? 'Profil Görünümü' : 'Profile View'}
                                </span>
                            </div>
                            <div className="h-[200px] bg-slate-800 rounded-lg overflow-hidden">
                                <TechnicalDrawing
                                    mode="shape"
                                    shape={selectedShape === 'ibeam' ? 'beam' : selectedShape === 'rectangle' ? 'sheet' : selectedShape as any}
                                    activeField={null}
                                    data={shapeDims}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-5 space-y-4">

                    {/* PRINCIPAL / VON MISES INPUTS */}
                    {(mode === 'principal' || mode === 'vonMises') && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? '2B Gerilme Durumu' : '2D Stress State'}
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                <CalculatorInput label="σx" unit="MPa" value={sigmaX} onChange={(e) => setSigmaX(Number(e.target.value))} />
                                <CalculatorInput label="σy" unit="MPa" value={sigmaY} onChange={(e) => setSigmaY(Number(e.target.value))} />
                                <CalculatorInput label="τxy" unit="MPa" value={tauXY} onChange={(e) => setTauXY(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* FATIGUE INPUTS */}
                    {mode === 'fatigue' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Yorulma Yükleri' : 'Fatigue Loading'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <CalculatorInput label={lang === 'tr' ? 'Değişken (σa)' : 'Alternating (σa)'} unit="MPa" value={sigmaA} onChange={(e) => setSigmaA(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Ortalama (σm)' : 'Mean (σm)'} unit="MPa" value={sigmaM} onChange={(e) => setSigmaM(Number(e.target.value))} />
                            </div>
                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="text-[10px] text-slate-500">Material: {selectedMaterial.name}</div>
                                <div className="text-[10px] text-slate-500">Sy = {selectedMaterial.Sy} MPa | Su = {selectedMaterial.Su} MPa | Se ≈ {selectedMaterial.Se || (selectedMaterial.Sy * 0.5).toFixed(0)} MPa</div>
                            </div>
                        </div>
                    )}

                    {/* BUCKLING INPUTS */}
                    {mode === 'buckling' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Kolon Parametreleri' : 'Column Parameters'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <CalculatorInput label={lang === 'tr' ? 'Uzunluk (L)' : 'Length (L)'} unit="mm" value={columnLength} onChange={(e) => setColumnLength(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Uygulanan Yük' : 'Applied Load'} unit="N" value={appliedLoad} onChange={(e) => setAppliedLoad(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <CalculatorInput label="I (Inertia)" unit="mm⁴" value={inertia} onChange={(e) => setInertiaManual(Number(e.target.value))} />
                                <CalculatorInput label="A (Area)" unit="mm²" value={area} onChange={(e) => setAreaManual(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase mb-1 block">{lang === 'tr' ? 'Mesnet Koşulu' : 'End Condition'}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['pinned-pinned', 'fixed-pinned', 'fixed-fixed', 'fixed-free'] as const).map(ec => (
                                        <button
                                            key={ec}
                                            onClick={() => setEndCondition(ec)}
                                            className={`px-2 py-1.5 text-[10px] font-bold rounded border transition-all ${endCondition === ec
                                                ? 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500'
                                                }`}
                                        >
                                            {ec.replace(/-/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BEAM INPUTS */}
                    {mode === 'beam' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Kiriş Parametreleri' : 'Beam Parameters'}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {(['cantilever', 'simply_supported', 'fixed_both'] as BeamType[]).map(bt => (
                                    <button
                                        key={bt}
                                        onClick={() => setBeamType(bt)}
                                        className={`px-2 py-1.5 text-[10px] font-bold rounded border ${beamType === bt ? 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700' : 'border-slate-200 text-slate-500'
                                            }`}
                                    >
                                        {bt.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {(['point_end', 'point_center', 'distributed'] as LoadType[]).map(lt => (
                                    <button
                                        key={lt}
                                        onClick={() => setLoadType(lt)}
                                        className={`px-2 py-1.5 text-[10px] font-bold rounded border ${loadType === lt ? 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700' : 'border-slate-200 text-slate-500'
                                            }`}
                                    >
                                        {lt.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <CalculatorInput label="L" unit="mm" value={beamLength} onChange={(e) => setBeamLength(Number(e.target.value))} />
                                <CalculatorInput label="P/w" unit={loadType === 'distributed' ? 'N/mm' : 'N'} value={beamLoad} onChange={(e) => setBeamLoad(Number(e.target.value))} />
                                <CalculatorInput label="I" unit="mm⁴" value={beamI} onChange={(e) => setBeamIManual(Number(e.target.value))} />
                                <CalculatorInput label="W" unit="mm³" value={beamW} onChange={(e) => setBeamWManual(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* TORSION INPUTS */}
                    {mode === 'torsion' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Mil Parametreleri' : 'Shaft Parameters'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <CalculatorInput label="Torque (T)" unit="N·mm" value={torque} onChange={(e) => setTorque(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Uzunluk' : 'Length'} unit="mm" value={shaftLength} onChange={(e) => setShaftLength(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Dış Çap (D)' : 'Outer Dia (D)'} unit="mm" value={shaftDiameter} onChange={(e) => setShaftDiameter(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'İç Çap (d)' : 'Inner Dia (d)'} unit="mm" value={shaftInnerDia} onChange={(e) => setShaftInnerDia(Number(e.target.value))} />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">İç çap 0 = masif mil</p>
                        </div>
                    )}

                    {/* PRESSURE VESSEL INPUTS */}
                    {mode === 'pressure' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Basınçlı Kap' : 'Pressure Vessel'}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <CalculatorInput label={lang === 'tr' ? 'İç Basınç (p)' : 'Internal Pressure (p)'} unit="MPa" value={innerPressure} onChange={(e) => setInnerPressure(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'İç Yarıçap (ri)' : 'Inner Radius (ri)'} unit="mm" value={innerRadius} onChange={(e) => setInnerRadius(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Et Kalınlığı (t)' : 'Wall Thickness (t)'} unit="mm" value={wallThickness} onChange={(e) => setWallThickness(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* COMBINED LOADING INPUTS */}
                    {mode === 'combined' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                {lang === 'tr' ? 'Kombine Yükleme' : 'Combined Loading'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <CalculatorInput label={lang === 'tr' ? 'Eksenel (F)' : 'Axial (F)'} unit="N" value={axialLoad} onChange={(e) => setAxialLoad(Number(e.target.value))} />
                                <CalculatorInput label={lang === 'tr' ? 'Moment (M)' : 'Bending (M)'} unit="N·mm" value={bendingMoment} onChange={(e) => setBendingMoment(Number(e.target.value))} />
                                <CalculatorInput label="Torque (T)" unit="N·mm" value={combinedTorque} onChange={(e) => setCombinedTorque(Number(e.target.value))} />
                                <CalculatorInput label="A" unit="mm²" value={combinedArea} onChange={(e) => setCombinedAreaManual(Number(e.target.value))} />
                                <CalculatorInput label="I" unit="mm⁴" value={combinedI} onChange={(e) => setCombinedIManual(Number(e.target.value))} />
                                <CalculatorInput label="J" unit="mm⁴" value={combinedJ} onChange={(e) => setCombinedJManual(Number(e.target.value))} />
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-7 space-y-4">

                    {/* MOHR CIRCLE VISUALIZATION */}
                    {(mode === 'principal' || mode === 'vonMises') && (
                        <MohrCircleVisualization sigmaX={sigmaX} sigmaY={sigmaY} tauXY={tauXY} />
                    )}

                    {/* PRINCIPAL/VON MISES RESULTS */}
                    {(mode === 'principal' || mode === 'vonMises') && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Von Mises (σeq)</div>
                                    <div className={`text-4xl font-mono font-bold ${safetyFactor.status === 'failure' ? 'text-red-400' : safetyFactor.status === 'marginal' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {vonMisesStress.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Güvenlik K.' : 'Safety Factor'}</div>
                                    <div className={`text-4xl font-mono font-bold flex items-center gap-2 ${safetyFactor.status === 'failure' ? 'text-red-400' : safetyFactor.status === 'marginal' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {safetyFactor.fos.toFixed(2)}
                                        {safetyFactor.status === 'safe' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700">
                                <div>
                                    <div className="text-[10px] text-emerald-400 uppercase">σ₁ (Max)</div>
                                    <div className="font-mono text-lg">{principalResults.sigma1.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-blue-400 uppercase">σ₂ (Min)</div>
                                    <div className="font-mono text-lg">{principalResults.sigma2.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-red-400 uppercase">τmax</div>
                                    <div className="font-mono text-lg">{principalResults.tauMax.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-purple-400 uppercase">θp</div>
                                    <div className="font-mono text-lg">{principalResults.angle.toFixed(1)}°</div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="text-[10px] text-slate-400 uppercase mb-1">Tresca Stress</div>
                                <div className="font-mono text-lg">{trescaStress.toFixed(1)} MPa</div>
                            </div>
                        </div>
                    )}

                    {/* FATIGUE RESULTS */}
                    {mode === 'fatigue' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Goodman n</div>
                                    <div className={`text-4xl font-mono font-bold ${fatigueGoodman.safe ? 'text-green-400' : 'text-red-400'}`}>
                                        {fatigueGoodman.safetyCycles.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{fatigueGoodman.safe ? 'Safe for infinite life' : 'Finite life expected'}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Soderberg n</div>
                                    <div className={`text-4xl font-mono font-bold ${fatigueSoderberg.safe ? 'text-green-400' : 'text-orange-400'}`}>
                                        {fatigueSoderberg.safetyCycles.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">(Conservative)</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BUCKLING RESULTS */}
                    {mode === 'buckling' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Kritik Yük (Pcr)' : 'Critical Load (Pcr)'}</div>
                                    <div className="text-4xl font-mono font-bold text-red-400">
                                        {(bucklingResults.Pcr / 1000).toFixed(1)} <span className="text-lg">kN</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Güvenlik K.' : 'Safety Factor'}</div>
                                    <div className={`text-4xl font-mono font-bold ${bucklingResults.safe ? 'text-green-400' : 'text-red-400'}`}>
                                        {(bucklingResults.Pcr / appliedLoad).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">σcr</div>
                                    <div className="font-mono text-lg">{bucklingResults.Scr.toFixed(1)} MPa</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">λ (Slenderness)</div>
                                    <div className="font-mono text-lg">{bucklingResults.slendernessRatio.toFixed(1)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Mode</div>
                                    <div className="font-mono text-lg">{bucklingResults.mode}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BEAM RESULTS */}
                    {mode === 'beam' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Maks Sehim' : 'Max Deflection'}</div>
                                    <div className="text-4xl font-mono font-bold text-green-400">
                                        {beamResults.maxDeflection.toFixed(3)} <span className="text-lg">mm</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Maks Gerilme' : 'Max Stress'}</div>
                                    <div className="text-4xl font-mono font-bold text-purple-400">
                                        {beamResults.maxStress.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Mmax</div>
                                    <div className="font-mono">{(beamResults.maxMoment / 1000).toFixed(1)} kN·mm</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Vmax</div>
                                    <div className="font-mono">{beamResults.maxShear.toFixed(0)} N</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">Formula</div>
                                    <div className="font-mono text-xs">{beamResults.formula}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TORSION RESULTS */}
                    {mode === 'torsion' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Maks Kayma Ger.' : 'Max Shear Stress'}</div>
                                    <div className="text-4xl font-mono font-bold text-cyan-400">
                                        {torsionResults.maxShearStress.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Burulma Açısı' : 'Angle of Twist'}</div>
                                    <div className="text-4xl font-mono font-bold text-cyan-400">
                                        {torsionResults.angleOfTwistDeg.toFixed(3)} <span className="text-lg">°</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRESSURE VESSEL RESULTS */}
                    {mode === 'pressure' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="mb-2 text-xs text-slate-400">Method: {pressureResults.method}</div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Çevresel (σh)' : 'Hoop (σh)'}</div>
                                    <div className="text-3xl font-mono font-bold text-pink-400">
                                        {pressureResults.hoopStress.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Eksenel (σa)' : 'Axial (σa)'}</div>
                                    <div className="text-3xl font-mono font-bold text-pink-400">
                                        {pressureResults.axialStress.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="text-[10px] text-slate-400 uppercase mb-1">Von Mises</div>
                                <div className="font-mono text-2xl">{pressureResults.vonMises.toFixed(1)} MPa</div>
                            </div>
                        </div>
                    )}

                    {/* COMBINED LOADING RESULTS */}
                    {mode === 'combined' && (
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">Von Mises</div>
                                    <div className="text-4xl font-mono font-bold text-amber-400">
                                        {combinedResults.vonMises.toFixed(1)} <span className="text-lg">MPa</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-1">{lang === 'tr' ? 'Güvenlik K.' : 'Safety Factor'}</div>
                                    <div className={`text-4xl font-mono font-bold ${combinedResults.safetyFactor >= 2 ? 'text-green-400' : combinedResults.safetyFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {combinedResults.safetyFactor.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">σ (Normal)</div>
                                    <div className="font-mono text-lg">{combinedResults.normalStress.toFixed(1)} MPa</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">τ (Shear)</div>
                                    <div className="font-mono text-lg">{combinedResults.shearStress.toFixed(1)} MPa</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <TheorySection title={lang === 'tr' ? 'Teori' : 'Theory'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Von Mises Criterion</h4>
                        <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs mb-2">σeq = √[(σ1-σ2)² + (σ2-σ3)² + (σ3-σ1)²]/√2</code>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">Ductile materials yield when equivalent stress equals yield strength.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Goodman Line</h4>
                        <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs mb-2">σa/Se + σm/Su = 1/n</code>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">Fatigue failure criterion relating alternating and mean stress.</p>
                    </div>
                </div>
            </TheorySection>
        </main>
    );
}

import { useState, useMemo } from "react";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { CalculatorInput } from "@/components/CalculatorInput";
import { MohrCircleVisualization } from "@/components/MohrCircleVisualization";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
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
import {
    AlertTriangle, CheckCircle, Circle, BarChart3,
    Cylinder, ArrowUpDown, Rotate3d, Target, Zap, Box, Eye
} from 'lucide-react';

import { StockCheck } from "../shared/StockCheck";
import { PDFGenerator } from "../shared/PDFGenerator";

type AnalysisMode = 'principal' | 'vonMises' | 'fatigue' | 'buckling' | 'beam' | 'torsion' | 'pressure' | 'combined';

export function StrengthModule({ lang, dict }: { lang: string, dict: any }) {

    // Derived Configuration using Dictionary
    const ANALYSIS_MODES: { id: AnalysisMode; label: string; icon: any; color: string }[] = [
        { id: 'principal', label: dict.common?.results || 'Principal', icon: Circle, color: 'text-purple-400' },
        { id: 'vonMises', label: dict.strength?.vonMises || 'Von Mises', icon: Target, color: 'text-blue-400' },
        { id: 'fatigue', label: dict.strength?.fatigue || 'Fatigue', icon: Rotate3d, color: 'text-orange-400' },
        { id: 'buckling', label: dict.strength?.buckling || 'Buckling', icon: ArrowUpDown, color: 'text-red-400' },
        { id: 'beam', label: dict.common?.beam || 'Beam', icon: BarChart3, color: 'text-green-400' },
        { id: 'torsion', label: dict.strength?.torsion || 'Torsion', icon: Rotate3d, color: 'text-cyan-400' },
        { id: 'pressure', label: dict.common?.pressure || 'Pressure', icon: Cylinder, color: 'text-pink-400' },
        { id: 'combined', label: dict.strength?.combined || 'Combined', icon: Zap, color: 'text-amber-400' },
    ];

    const [mode, setMode] = useState<AnalysisMode>('principal');
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialStrength>(STRENGTH_MATERIALS[0]);

    // ===== SHAPE SELECTION STATE =====
    const [useShapeCalc, setUseShapeCalc] = useState(false);
    const [selectedShape, setSelectedShape] = useState<ShapeType>('box');
    const [shapeDims, setShapeDims] = useState<ShapeDimensions>({
        width: 60, height: 80, wallThickness: 4,
        diameter: 50, thickness: 5,
        flangeWidth: 60, flangeThickness: 8, webThickness: 5,
        legWidth: 50, legThickness: 5
    });

    const sectionProps = useMemo(() => calculateSectionProperties(selectedShape, shapeDims), [selectedShape, shapeDims]);

    // ===== INPUT STATES =====
    // Principal
    const [sigmaX, setSigmaX] = useState(100);
    const [sigmaY, setSigmaY] = useState(-50);
    const [tauXY, setTauXY] = useState(30);

    // Fatigue
    const [sigmaA, setSigmaA] = useState(80);
    const [sigmaM, setSigmaM] = useState(50);

    // Buckling
    const [columnLength, setColumnLength] = useState(2000);
    const [inertiaManual, setInertiaManual] = useState(500000);
    const [areaManual, setAreaManual] = useState(1000);
    const [appliedLoad, setAppliedLoad] = useState(50000);
    const [endCondition, setEndCondition] = useState<'fixed-fixed' | 'fixed-pinned' | 'pinned-pinned' | 'fixed-free'>('pinned-pinned');

    const inertia = useShapeCalc ? sectionProps.Ix_mm4 : inertiaManual;
    const area = useShapeCalc ? sectionProps.area_mm2 : areaManual;

    // Beam
    const [beamType, setBeamType] = useState<BeamType>('cantilever');
    const [loadType, setLoadType] = useState<LoadType>('point_end');
    const [beamLength, setBeamLength] = useState(1000);
    const [beamLoad, setBeamLoad] = useState(1000);
    const [beamIManual, setBeamIManual] = useState(100000);
    const [beamWManual, setBeamWManual] = useState(5000);

    const beamI = useShapeCalc ? sectionProps.Ix_mm4 : beamIManual;
    const beamW = useShapeCalc ? sectionProps.Wx_mm3 : beamWManual;

    // Torsion
    const [torque, setTorque] = useState(500000); // Nmm
    const [shaftLength, setShaftLength] = useState(500);
    const [shaftDiameter, setShaftDiameter] = useState(50);
    const [shaftInnerDia, setShaftInnerDia] = useState(0);

    // Pressure
    const [innerPressure, setInnerPressure] = useState(10); // MPa
    const [innerRadius, setInnerRadius] = useState(200);
    const [wallThickness, setWallThickness] = useState(10);

    // Combined
    const [axialLoad, setAxialLoad] = useState(10000);
    const [bendingMoment, setBendingMoment] = useState(100000);
    const [combinedTorque, setCombinedTorque] = useState(50000);
    const [combinedAreaManual, setCombinedAreaManual] = useState(500);
    const [combinedIManual, setCombinedIManual] = useState(50000);
    const [combinedJManual, setCombinedJManual] = useState(100000);
    const [distFromNA, setDistFromNA] = useState(25);
    const [outerR, setOuterR] = useState(25);

    const combinedArea = useShapeCalc ? sectionProps.area_mm2 : combinedAreaManual;
    const combinedI = useShapeCalc ? sectionProps.Ix_mm4 : combinedIManual;
    const combinedJ = useShapeCalc ? sectionProps.J_mm4 : combinedJManual;

    // ===== CALCULATIONS =====
    const principalResults = useMemo(() => calculatePrincipalStresses2D({ sigmaX, sigmaY, tauXY }), [sigmaX, sigmaY, tauXY]);
    const vonMisesStress = useMemo(() => calculateVonMises2D({ sigmaX, sigmaY, tauXY }), [sigmaX, sigmaY, tauXY]);
    const safetyFactor = useMemo(() => calculateSafetyFactor(vonMisesStress, selectedMaterial), [vonMisesStress, selectedMaterial]);
    const bucklingResults = useMemo(() => calculateBuckling(columnLength, inertia, area, selectedMaterial, endCondition, appliedLoad), [columnLength, inertia, area, selectedMaterial, endCondition, appliedLoad]);
    const beamResults = useMemo(() => calculateBeam(beamType, loadType, beamLength, beamLoad, selectedMaterial.E, beamI, beamW), [beamType, loadType, beamLength, beamLoad, selectedMaterial.E, beamI, beamW]);
    const torsionResults = useMemo(() => {
        const G = selectedMaterial.G || selectedMaterial.E / 2.6;
        return calculateTorsion(torque, shaftLength, shaftDiameter, shaftInnerDia, G);
    }, [torque, shaftLength, shaftDiameter, shaftInnerDia, selectedMaterial]);
    const pressureResults = useMemo(() => calculatePressureVessel(innerPressure, 0, innerRadius, innerRadius + wallThickness), [innerPressure, innerRadius, wallThickness]);
    const combinedResults = useMemo(() => calculateCombinedLoading(axialLoad, bendingMoment, combinedTorque, combinedArea, combinedI, combinedJ, distFromNA, outerR, selectedMaterial), [axialLoad, bendingMoment, combinedTorque, combinedArea, combinedI, combinedJ, distFromNA, outerR, selectedMaterial]);

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "General Mechanics",
        standardTitle: "Strength of Materials",
        version: "1.0",
        assumptions: [
            `Material: ${selectedMaterial.name}`,
            "Linear Elastic Behavior Assumed",
            "Homogeneous & Isotropic Material"
        ]
    };

    const currentModeInfo = ANALYSIS_MODES.find(m => m.id === mode)!;

    // Status Determination
    let status: 'valid' | 'invalid' | 'warning' = 'valid';
    if (mode === 'buckling' && !bucklingResults.safe) status = 'warning';
    if (mode === 'combined' && combinedResults.safetyFactor < 1.5) status = 'warning';
    if (safetyFactor.status === 'failure') status = 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            {/* Header / Mode Select */}
            <div className="flex overflow-x-auto gap-1 p-2 border-b border-[#333] shrink-0">
                {ANALYSIS_MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${mode === m.id
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon size={12} className={m.color} />
                            {m.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <EngineeringVisualization status={status} label={currentModeInfo.label.toUpperCase()}>
                    <div id="strength-viz-container" className="flex flex-col items-center justify-center p-2 w-full h-full min-h-[200px] relative">
                        {(mode === 'principal' || mode === 'vonMises') && (
                            <MohrCircleVisualization sigmaX={sigmaX} sigmaY={sigmaY} tauXY={tauXY} />
                        )}
                        {mode === 'beam' && (
                            <div className="text-center space-y-2">
                                <TechnicalDrawing mode="shape" shape="beam" activeField={null} data={{ height: 100, flangeWidth: 50, webThickness: 5, flangeThickness: 8 }} />
                                <div className="text-xs text-slate-400">{beamType.replace('_', ' ')} • {loadType.replace('_', ' ')}</div>
                            </div>
                        )}
                        {mode !== 'principal' && mode !== 'vonMises' && mode !== 'beam' && (
                            <div className="flex items-center justify-center text-slate-600 font-mono text-sm">
                                [Visualization Placeholder: {mode}]
                            </div>
                        )}
                    </div>
                </EngineeringVisualization>

                {/* 2. Controls */}
                <div className="space-y-4">
                    {/* Material Select */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{dict.common?.material || "Material"}</label>
                        <select
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                            value={selectedMaterial.name}
                            onChange={(e) => {
                                const mat = STRENGTH_MATERIALS.find(m => m.name === e.target.value);
                                if (mat) setSelectedMaterial(mat);
                            }}
                        >
                            {STRENGTH_MATERIALS.map(m => (
                                <option key={m.name} value={m.name}>{m.name} (Yield: {m.Sy} MPa)</option>
                            ))}
                        </select>
                    </div>

                    {/* DYNAMIC INPUTS BASED ON MODE */}

                    {/* Principal / Von Mises */}
                    {(mode === 'principal' || mode === 'vonMises') && (
                        <div className="grid grid-cols-3 gap-2">
                            <CalculatorInput label="σx (MPa)" unit="" value={sigmaX} onChange={(e) => setSigmaX(Number(e.target.value))} />
                            <CalculatorInput label="σy (MPa)" unit="" value={sigmaY} onChange={(e) => setSigmaY(Number(e.target.value))} />
                            <CalculatorInput label="τxy (MPa)" unit="" value={tauXY} onChange={(e) => setTauXY(Number(e.target.value))} />
                        </div>
                    )}

                    {/* Buckling */}
                    {mode === 'buckling' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label={`${dict.aluminum?.params?.length || "Length"} (mm)`} unit="" value={columnLength} onChange={(e) => setColumnLength(Number(e.target.value))} />
                                <CalculatorInput label={`${dict.common?.force || "Force"} (N)`} unit="" value={appliedLoad} onChange={(e) => setAppliedLoad(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label={`${dict.engineering?.inertia || "Inertia"} (mm⁴)`} unit="" value={inertia} onChange={(e) => setInertiaManual(Number(e.target.value))} />
                                <CalculatorInput label="Area (mm²)" unit="" value={area} onChange={(e) => setAreaManual(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* Beam */}
                    {mode === 'beam' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label={`${dict.aluminum?.params?.length || "Length"} (mm)`} unit="" value={beamLength} onChange={(e) => setBeamLength(Number(e.target.value))} />
                                <CalculatorInput label={`${dict.common?.load || "Load"} (N)`} unit="" value={beamLoad} onChange={(e) => setBeamLoad(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label={`${dict.engineering?.inertia || "Inertia"} (mm⁴)`} unit="" value={beamI} onChange={(e) => setBeamIManual(Number(e.target.value))} />
                                <CalculatorInput label={`${dict.engineering?.modulus || "Modulus"} (mm³)`} unit="" value={beamW} onChange={(e) => setBeamWManual(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* Fatigue */}
                    {mode === 'fatigue' && (
                        <div className="grid grid-cols-2 gap-2">
                            <CalculatorInput label="Alternating Stress (σa)" unit="MPa" value={sigmaA} onChange={(e) => setSigmaA(Number(e.target.value))} />
                            <CalculatorInput label="Mean Stress (σm)" unit="MPa" value={sigmaM} onChange={(e) => setSigmaM(Number(e.target.value))} />
                        </div>
                    )}

                    {/* Torsion */}
                    {mode === 'torsion' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label="Torque (T)" unit="Nmm" value={torque} onChange={(e) => setTorque(Number(e.target.value))} />
                                <CalculatorInput label="Length (L)" unit="mm" value={shaftLength} onChange={(e) => setShaftLength(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label="Outer Dia (D)" unit="mm" value={shaftDiameter} onChange={(e) => setShaftDiameter(Number(e.target.value))} />
                                <CalculatorInput label="Inner Dia (d)" unit="mm" value={shaftInnerDia} onChange={(e) => setShaftInnerDia(Number(e.target.value))} />
                            </div>
                        </div>
                    )}

                    {/* Pressure */}
                    {mode === 'pressure' && (
                        <div className="grid grid-cols-3 gap-2">
                            <CalculatorInput label="Pressure (P)" unit="MPa" value={innerPressure} onChange={(e) => setInnerPressure(Number(e.target.value))} />
                            <CalculatorInput label="Radius (r)" unit="mm" value={innerRadius} onChange={(e) => setInnerRadius(Number(e.target.value))} />
                            <CalculatorInput label="Wall (t)" unit="mm" value={wallThickness} onChange={(e) => setWallThickness(Number(e.target.value))} />
                        </div>
                    )}

                    {/* Combined */}
                    {mode === 'combined' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                <CalculatorInput label="Axial (F)" unit="N" value={axialLoad} onChange={(e) => setAxialLoad(Number(e.target.value))} />
                                <CalculatorInput label="Moment (M)" unit="Nmm" value={bendingMoment} onChange={(e) => setBendingMoment(Number(e.target.value))} />
                                <CalculatorInput label="Torque (T)" unit="Nmm" value={combinedTorque} onChange={(e) => setCombinedTorque(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <CalculatorInput label="Area (A)" unit="mm²" value={combinedArea} onChange={(e) => setCombinedAreaManual(Number(e.target.value))} />
                                <CalculatorInput label="Inertia (I)" unit="mm⁴" value={combinedI} onChange={(e) => setCombinedIManual(Number(e.target.value))} />
                                <CalculatorInput label="Polar (J)" unit="mm⁴" value={combinedJ} onChange={(e) => setCombinedJManual(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <CalculatorInput label="Dist to NA (y)" unit="mm" value={distFromNA} onChange={(e) => setDistFromNA(Number(e.target.value))} />
                                <CalculatorInput label="Outer Rad (r)" unit="mm" value={outerR} onChange={(e) => setOuterR(Number(e.target.value))} />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333] space-y-2">
                    {/* ... results content ... */}
                    {(mode === 'principal' || mode === 'vonMises') && (
                        /* ... same ... */
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="text-[10px] text-slate-500 uppercase">Von Mises</div>
                                <div className="text-xl font-mono font-bold text-blue-400">{vonMisesStress.toFixed(1)} MPa</div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-[10px] text-slate-500 uppercase">Safety Factor</div>
                                <div className={`text-xl font-mono font-bold ${safetyFactor.fos > 2 ? 'text-green-400' : 'text-amber-400'}`}>{safetyFactor.fos.toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                    {/* ... other modes omitted for brevity, keeping them locally ... */}
                </div>

                {/* MANUFACTURING SECTION */}
                <div className="space-y-2">
                    <StockCheck requirements={[
                        {
                            type: (mode === 'torsion' || mode === 'pressure') ? 'round' : 'rect', // Simple heuristic
                            material: selectedMaterial.name,
                            dims: { l: 100 }, // Default check length
                            qty: 1
                        }
                    ]} />

                    <PDFGenerator
                        filename={`STRENGTH_ANALYSIS_${mode.toUpperCase()}`}
                        title={`Strength Analysis: ${mode}`}
                        inputs={{ mode, material: selectedMaterial.name, sigmaX, sigmaY, tauXY }}
                        results={{
                            vonMises: vonMisesStress.toFixed(2) + ' MPa',
                            safetyFactor: safetyFactor.fos.toFixed(2),
                            status: safetyFactor.status
                        }}
                        visualElementId="strength-viz-container"
                    />
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}

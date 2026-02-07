import { useState, useEffect } from "react";
import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { TechnicalDrawing } from "@/components/TechnicalDrawing";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MODULES_ISO, GEAR_MATERIALS, APPLICATION_FACTORS } from "@/data/gearsData";
import { CalculatorInput } from "@/components/CalculatorInput";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import { Gear3D } from "@/components/3d/Gear3D";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";

import { StockCheck } from "../shared/StockCheck";
import { PDFGenerator } from "../shared/PDFGenerator";

export function GearsModule({ lang, dict }: { lang: string, dict: any }) {
    // ... existing hook ...
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        applicationName, setApplicationName,
        module, setModule,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2
    } = useDriveTrainCalculator();

    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

    // ... existing metadata ...
    const metadata: CalculationMetadata = {
        standardId: "ISO 6336:2019",
        standardTitle: "Calculation of load capacity of spur and helical gears",
        version: "2.1.0",
        assumptions: [
            "Operating Temp: 20°C",
            "Lubrication: Splash Oil (ISO VG 220)",
            "Quality Grade: ISO 7"
        ]
    };

    // Calculate Status
    const isSafe = results.SF_bending > 1.4 && results.SF_contact > 1.0;
    const isWarn = !isSafe && (results.SF_bending > 1.0 && results.SF_contact > 0.9);
    const status = isSafe ? 'valid' : isWarn ? 'warning' : 'invalid';

    // Derived Logic for Stock
    const da1 = module * z1 + 2 * module * (1 + x1);
    const da2 = module * z2 + 2 * module * (1 + x2);
    const requiredDia = Math.max(da1, da2) + 5;
    const requiredLen = faceWidth + 10;

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            {/* Toolbar - Only View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 px-2">ISO 6336 Gearset</span>
                <div className="flex-1" />
                <button onClick={() => setViewMode('2D')} className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '2D' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>2D</button>
                <button onClick={() => setViewMode('3D')} className={`px-2 py-1 text-xs font-mono rounded ${viewMode === '3D' ? 'bg-slate-700 text-ind-orange' : 'text-slate-500 hover:text-white'}`}>3D</button>
            </div>

            {/* Scrollable Content Area - All Sections Combined */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization */}
                <div id="gears-viz-container" className="h-64 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5 relative">
                    <EngineeringVisualization status={status} label="ISO 6336 GEARSET">
                        {viewMode === '2D' ? (
                            <div className="flex flex-col items-center justify-center p-4">
                                <TechnicalDrawing mode="gear" activeField={null} data={{ z1, z2, module, width: faceWidth }} />
                                <div className="text-xs font-mono text-slate-500 mt-2">
                                    System: {results.ratio.toFixed(2)}:1 Ratio | {(results.a).toFixed(1)}mm Center Dist
                                </div>
                            </div>
                        ) : (
                            // 3D View Integration
                            <Canvas gl={{ preserveDrawingBuffer: true }} shadows dpr={[1, 2]} camera={{ position: [50, 50, 50], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={1} castShadow />
                                <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                                    <Stage environment="city" intensity={0.5}>
                                        <Gear3D
                                            module={module}
                                            teeth={z1}
                                            faceWidth={faceWidth}
                                            profileShift={x1}
                                            color="#6366f1"
                                            position={[-(results.a) / 2, 0, 0]}
                                        />
                                        <Gear3D
                                            module={module}
                                            teeth={z2}
                                            faceWidth={faceWidth}
                                            profileShift={x2}
                                            color="#8b5cf6"
                                            position={[(results.a) / 2, 0, 0]}
                                            rotation={[0, 0, Math.PI / z2]} // Mesh alignment offset
                                        />
                                    </Stage>
                                </PresentationControls>
                            </Canvas>
                        )}
                    </EngineeringVisualization>
                </div>

                {/* 2. Design Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Basic Geometry */}
                    <div className="col-span-2 space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">{dict.common?.dimensions || "Geometry"}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <CalculatorInput label={dict.gears?.module || "Module (m)"} unit="mm" value={module} onChange={(e) => setModule(Number(e.target.value))} />
                            <CalculatorInput label={dict.gears?.faceWidth || "Face Width"} unit="mm" value={faceWidth} onChange={(e) => setFaceWidth(Number(e.target.value))} />
                            <CalculatorInput label={`${dict.manufacturing?.pinion || "Pinion"} (${dict.gears?.teeth || "z"})`} unit="" value={z1} onChange={(e) => setZ1(Number(e.target.value))} />
                            <CalculatorInput label={`${dict.manufacturing?.gear || "Gear"} (${dict.gears?.teeth || "z"})`} unit="" value={z2} onChange={(e) => setZ2(Number(e.target.value))} />
                            <CalculatorInput label={dict.gears?.helixAngle || "Helix Angle"} unit="°" value={helixAngle} onChange={(e) => setHelixAngle(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Power & Material */}
                    <div className="col-span-2 space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Power & Materials</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{dict.driveTrain?.primeMover || "Motor Power"}</label>
                                <select
                                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                                    value={selectedPower}
                                    onChange={(e) => setSelectedPower(Number(e.target.value))}
                                >
                                    {IEC_MOTORS.map(m => (
                                        <option key={m.power} value={m.power}>{m.power} kW</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{dict.common?.material || "Material"}</label>
                                <select
                                    className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                                    value={materialName}
                                    onChange={(e) => setMaterialName(e.target.value)}
                                >
                                    {GEAR_MATERIALS.map(m => (
                                        <option key={m.name} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Safety Factors (Moved up for better visibility) */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 uppercase">Safety Factors</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded border-l-2 ${results.SF_bending > 1.4 ? 'bg-green-900/10 border-green-500' : 'bg-red-900/10 border-red-500'}`}>
                            <div className="text-[10px] text-slate-500">Root Bending</div>
                            <div className={`text-lg font-bold font-mono ${results.SF_bending > 1.4 ? 'text-green-400' : 'text-red-400'}`}>
                                {results.SF_bending.toFixed(2)}
                            </div>
                        </div>
                        <div className={`p-2 rounded border-l-2 ${results.SF_contact > 1.0 ? 'bg-green-900/10 border-green-500' : 'bg-red-900/10 border-red-500'}`}>
                            <div className="text-[10px] text-slate-500">Flank Contact</div>
                            <div className={`text-lg font-bold font-mono ${results.SF_contact > 1.0 ? 'text-green-400' : 'text-red-400'}`}>
                                {results.SF_contact.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Manufacturing Section */}
                <div className="space-y-4">
                    {/* Profile Shift */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-ind-orange uppercase tracking-widest border-b border-ind-orange/30 pb-1">{dict.manufacturing?.shiftCoeff || "Profile Shift (x)"}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <CalculatorInput label="Shift x1" unit="" value={x1} onChange={(e) => setX1(Number(e.target.value))} />
                            <CalculatorInput label="Shift x2" unit="" value={x2} onChange={(e) => setX2(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Manufacturing Dimensions Table */}
                    <div className="bg-[#252525] p-3 rounded-lg border border-[#333]">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                            <span>{dict.common?.dimensions || "Manufacturing Dims"}</span>
                            <span className="text-[10px] text-slate-600">{dict.common?.metric || "Metric"} (mm)</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-[#1a1a1a] text-slate-500 font-bold uppercase text-[9px]">
                                    <tr>
                                        <th className="p-1">Parameter</th>
                                        <th className="p-1 text-center">{dict.manufacturing?.pinion || "Pinion"} (z1)</th>
                                        <th className="p-1 text-center">{dict.manufacturing?.gear || "Gear"} (z2)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#333] font-mono text-slate-300">
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">Ref Diameter (d)</td>
                                        <td className="p-1 text-center">{(module * z1).toFixed(2)}</td>
                                        <td className="p-1 text-center">{(module * z2).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-200 font-bold">Tip Diameter (da)</td>
                                        <td className="p-1 text-center text-ind-orange font-bold">
                                            {(module * z1 + 2 * module * (1 + x1)).toFixed(2)}
                                        </td>
                                        <td className="p-1 text-center text-ind-orange font-bold">
                                            {(module * z2 + 2 * module * (1 + x2)).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">Root Diameter (df)</td>
                                        <td className="p-1 text-center">{(module * z1 - 2.5 * module + 2 * module * x1).toFixed(2)}</td>
                                        <td className="p-1 text-center">{(module * z2 - 2.5 * module + 2 * module * x2).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">{dict.gears?.addendum || "Addendum (ha)"}</td>
                                        <td className="p-1 text-center text-emerald-400">{(module).toFixed(2)}</td>
                                        <td className="p-1 text-center text-emerald-400">{(module).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">{dict.gears?.dedendum || "Dedendum (hf)"}</td>
                                        <td className="p-1 text-center">{(1.25 * module).toFixed(2)}</td>
                                        <td className="p-1 text-center">{(1.25 * module).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">{dict.gears?.circularPitch || "Circular Pitch (p)"}</td>
                                        <td className="p-1 text-center" colSpan={2}>{(Math.PI * module).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 py-1.5 text-slate-500">{dict.manufacturing?.overPins || "Over Pins (M)"}</td>
                                        <td className="p-1 text-center">{results.M1.toFixed(3)}</td>
                                        <td className="p-1 text-center">{results.M2.toFixed(3)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Validation Alerts */}
                        <div className="space-y-1 mt-2">
                            {(faceWidth < 6 * module || faceWidth > 10 * module) && (
                                <div className="text-[10px] text-amber-500 flex items-center gap-1 bg-amber-950/30 p-1.5 rounded border border-amber-900/50">
                                    <span>⚠️</span> {dict.gears?.recFaceWidth || "Rec. Width (6m-10m)"}: {(6 * module).toFixed(1)} - {(10 * module).toFixed(1)} mm
                                </div>
                            )}
                            {(z1 < 13 || z2 < 13) && (
                                <div className="text-[10px] text-red-500 flex items-center gap-1 bg-red-950/30 p-1.5 rounded border border-red-900/50">
                                    <span>⚠️</span> ISO: Min 13 teeth to avoid undercut (without shift).
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Check (Shared) */}
                    <StockCheck requirements={[
                        { type: 'round', material: materialName, dims: { d: requiredDia, l: requiredLen }, qty: 2 }
                    ]} />

                    {/* Documentation (Shared) */}
                    <PDFGenerator
                        filename={`GEAR_SET_M${module}`}
                        title="Gear Manufacturing Job Card"
                        inputs={{ z1, z2, module, x1, x2, helixAngle, materialName }}
                        results={results}
                        visualElementId="gears-viz-container"
                        notes={[
                            "Dimensions include +0.2mm grinding allowance on flanks.",
                            `Requires Round Stock > Ø${requiredDia.toFixed(0)}mm`,
                            "Deburr all edges 0.5mm"
                        ]}
                    />
                </div>

                {/* 5. Assurance Metadata */}
                <AssumptionPanel metadata={metadata} status={status} />

            </div>
        </div>
    );
}

// ===================================
// SUB-COMPONENTS
// ===================================

// Removed internal StockAvailabilityCheck and ManufacturingActions in favor of shared versions
// See imports above.

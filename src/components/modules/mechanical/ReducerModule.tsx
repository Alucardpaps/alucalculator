import { useState, useMemo } from 'react';
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { CalculatorInput } from "@/components/CalculatorInput";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Stage, Box, Cylinder } from "@react-three/drei";

export function ReducerModule({ lang, dict }: { lang: string, dict: any }) {
    // State
    const [power, setPower] = useState(5.5); // kW
    const [ratio, setRatio] = useState(20);
    const [ambientTemp, setAmbientTemp] = useState(25); // C
    const [hasFan, setHasFan] = useState(false);
    const [oilType, setOilType] = useState('mineral'); // mineral | synthetic
    const [mountingPos, setMountingPos] = useState('M1'); // M1...M6

    // Calculations (Simplified from ISO/AGMA thermal models)
    const results = useMemo(() => {
        // 1. Geometry Estimation based on Power & Ratio
        // Torque T2 = 9550 * P / n2
        // Size index ~ cbrt(T2)
        const n1 = 1450;
        const n2 = n1 / ratio;
        const T2 = (9550 * power) / n2;

        // Characteristic Length (Size of housing)
        const L = Math.pow(T2 / 10, 0.33) * 100; // mm approx side length
        const surfaceArea = 6 * (L / 1000) ** 2; // m2

        // 2. Thermal Limit (Pt)
        // Pt = (Ct * Area * (T_oil_max - T_amb)) / 1000
        // Ct = Cooling Coeff (W/m2K) ~ 15 natural, 30 fan
        const T_oil_max = oilType === 'synthetic' ? 95 : 85;
        const Ct = hasFan ? 35 : 17;

        const Pt = (Ct * surfaceArea * (T_oil_max - ambientTemp)) / 1000 * 5; // Scaling factor for realism

        // 3. Oil Quantity
        // V_oil ~ Volume * 0.15 (15% fill for splash)
        const HousingVol = (L / 100) ** 3; // Liters approx
        const oilQty = HousingVol * (mountingPos === 'M1' ? 0.4 : 0.8); // Vertical need more

        // 4. Lubrication Interval (Hours)
        // Base 5000h mineral, 15000h synthetic @ 80C
        // Halves for every 10C above 80
        let baseInterval = oilType === 'synthetic' ? 20000 : 8000;
        const opTemp = 60 + (power / Pt) * 30; // Est operating temp
        if (opTemp > 80) {
            baseInterval = baseInterval / Math.pow(2, (opTemp - 80) / 10);
        }

        return {
            T2,
            L,
            Pt,
            oilQty,
            opTemp,
            interval: Math.max(1000, Math.round(baseInterval)),
            isOverheating: power > Pt
        };
    }, [power, ratio, ambientTemp, hasFan, oilType, mountingPos]);

    const metadata: CalculationMetadata = {
        standardId: "ISO TR 14179-1",
        standardTitle: "Thermal capacity of gear units",
        version: "1.0.0",
        assumptions: [
            "Housing: Cast Iron",
            "Dip Lubrication",
            "Altitude < 1000m"
        ]
    };

    const status = results.isOverheating ? 'warning' : 'valid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none">
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Visual */}
                <div className="h-64 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5 relative">
                    <EngineeringVisualization status={status} label={`REDUCER FRAME SIZE ${(results.L / 10).toFixed(0)}`}>
                        <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 5, 5], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                            <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                                <Stage environment="city" intensity={0.5}>
                                    {/* Procedural Housing */}
                                    <Box args={[results.L / 100, results.L / 100, results.L / 100]} position={[0, results.L / 200, 0]}>
                                        <meshStandardMaterial color={results.isOverheating ? "#ef4444" : "#475569"} roughness={0.7} />
                                    </Box>
                                    {/* Shafts */}
                                    <Cylinder args={[0.2, 0.2, results.L / 100 + 2, 16]} rotation={[0, 0, Math.PI / 2]} position={[0, results.L / 200, 0]}>
                                        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                                    </Cylinder>
                                    {/* Fan Cover if Fan */}
                                    {hasFan && (
                                        <Cylinder args={[results.L / 200, results.L / 200, 0.5, 32]} rotation={[0, 0, Math.PI / 2]} position={[results.L / 200 + 0.5, results.L / 200, 0]}>
                                            <meshStandardMaterial color="#0f172a" />
                                        </Cylinder>
                                    )}
                                </Stage>
                            </PresentationControls>
                        </Canvas>
                    </EngineeringVisualization>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-700 pb-1">Operating Conditions</div>
                    <CalculatorInput label="Input Power" unit="kW" value={power} onChange={(e) => setPower(Number(e.target.value))} />
                    <CalculatorInput label="Ambient Temp" unit="°C" value={ambientTemp} onChange={(e) => setAmbientTemp(Number(e.target.value))} />
                    <CalculatorInput label="Ratio (i)" unit=":1" value={ratio} onChange={(e) => setRatio(Number(e.target.value))} />

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">Cooling</label>
                        <button
                            onClick={() => setHasFan(!hasFan)}
                            className={`w-full py-1 text-xs border rounded ${hasFan ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#2a2a2a] border-[#333] text-slate-400'}`}
                        >
                            {hasFan ? 'Fan Cooling (Forced)' : 'Natural Convection'}
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">Oil Type</label>
                        <select
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                            value={oilType}
                            onChange={(e) => setOilType(e.target.value)}
                        >
                            <option value="mineral">Mineral Oil (VG 220)</option>
                            <option value="synthetic">Synthetic (PAO)</option>
                        </select>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333]">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] text-slate-500">Thermal Limit (Pt)</div>
                            <div className={`text-lg font-bold font-mono ${results.isOverheating ? 'text-red-400' : 'text-green-400'}`}>
                                {results.Pt.toFixed(1)} kW
                            </div>
                            {results.isOverheating && <div className="text-[9px] text-red-500">REQUIRES COOLING</div>}
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500">Est. Operating Temp</div>
                            <div className="text-lg font-bold font-mono text-white">
                                {results.opTemp.toFixed(1)} °C
                            </div>
                        </div>
                        <div className="col-span-2 border-t border-white/5 pt-2 flex justify-between">
                            <div>
                                <div className="text-[10px] text-slate-500">Oil Quantity</div>
                                <div className="text-sm font-bold text-ind-orange">{results.oilQty.toFixed(2)} L</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500">Change Interval</div>
                                <div className="text-sm font-bold text-emerald-400">{results.interval} Hours</div>
                            </div>
                        </div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}

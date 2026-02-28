import { useState, useMemo, useEffect } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
import { WeldingVisualization3D, WeldJointType3D } from "@/components/WeldingVisualization3D";
import {
    WELDING_METHODS,
    JOINT_TYPES,
    ELECTRODE_CATALOG,
    WeldingProcess,
    WeldJointType,
    getMinWeldSize,
    calculateThroatArea,
    calculateHeatInput,
    evaluateHeatInput,
    calculatePreheat,
    estimateFillerConsumption
} from "@/data/weldingData";
import { SHAPE_INFO, ShapeType } from "@/utils/sectionProperties";
import { EngineeringVisualization } from "@/components/ui/EngineeringVisualization";
import { AssumptionPanel, CalculationMetadata } from "@/components/ui/AssumptionPanel";
import { Flame, Zap, Thermometer, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { useI18nStore } from "@/store/i18nStore";

export function WeldingModule() {
    const { t } = useI18nStore();
    // Process & Joint Selection
    const [process, setProcess] = useState<WeldingProcess>('mig');
    const [jointType, setJointType] = useState<WeldJointType>('fillet');

    // Process Parameters
    const [current, setCurrent] = useState(180);  // Amps
    const [voltage, setVoltage] = useState(26);    // Volts
    const [speed, setSpeed] = useState(350);       // mm/min

    // Geometry
    const [legSize, setLegSize] = useState(6);     // a (mm)
    const [thickness, setThickness] = useState(12); // t (mm)
    const [length, setLength] = useState(200);     // L (mm)
    const [load, setLoad] = useState(15000);       // F (N)
    const [grooveAngle, setGrooveAngle] = useState(60);
    const [carbonContent, setCarbonContent] = useState(0.2); // %

    const [selectedElectrode, setSelectedElectrode] = useState(ELECTRODE_CATALOG[7]); // ER70S-6

    // Material Profile State (Simplified defaults for Module View)
    const [material1Profile, setMaterial1Profile] = useState<ShapeType>('sheet');
    const [material2Profile, setMaterial2Profile] = useState<ShapeType>('sheet');
    const [material1Color, setMaterial1Color] = useState('#94a3b8');
    const [material2Color, setMaterial2Color] = useState('#64748b');
    const [material1Name, setMaterial1Name] = useState(t.welding.materialSteel);
    const [material2Name, setMaterial2Name] = useState(t.welding.materialSteel);

    // Simplified Dims for module view (user can still edit them but defaults are safer)
    const defaultDims = { width: 60, height: 80, thickness: 12, wallThickness: 4, diameter: 50, flangeWidth: 40, flangeThickness: 6, webThickness: 4, legWidth: 40, legThickness: 5 };
    const [material1Dims, setMaterial1Dims] = useState<any>(defaultDims);
    const [material2Dims, setMaterial2Dims] = useState<any>(defaultDims);

    // Sync thickness
    useEffect(() => {
        // Auto-sync thickness logic (essential interaction)
        if (material1Profile === 'sheet') setThickness(material1Dims.thickness);
    }, [material1Dims, material1Profile]);

    // Calculations
    const results = useMemo(() => {
        const method = WELDING_METHODS[process];
        const joint = JOINT_TYPES[jointType];

        const heatInput = calculateHeatInput(current, voltage, speed, method.efficiency);
        const heatStatus = evaluateHeatInput(heatInput);
        const throatArea = calculateThroatArea(jointType, legSize, length, thickness);
        const stress = load / throatArea;
        const minWeldSize = getMinWeldSize(thickness);
        const weldSizeOk = legSize >= minWeldSize;
        const preheat = calculatePreheat(carbonContent, thickness);
        const filler = estimateFillerConsumption(jointType, legSize, length, thickness);
        const jointStrength = joint.jointEfficiency * selectedElectrode.tensileStrength;
        const safetyFactor = jointStrength / stress;

        return { heatInput, heatStatus, throatArea, stress, minWeldSize, weldSizeOk, preheat, filler, jointStrength, safetyFactor, efficiency: method.efficiency };
    }, [process, jointType, current, voltage, speed, legSize, thickness, length, load, carbonContent, selectedElectrode]);

    // Metadata
    const metadata: CalculationMetadata = {
        standardId: "AWS D1.1 / EN 1090",
        standardTitle: "Structural Welding Code - Steel",
        version: "2020",
        assumptions: [
            `Process: ${WELDING_METHODS[process].name}`,
            `Electrode: ${selectedElectrode.code}`,
            `Efficiency: ${(WELDING_METHODS[process].efficiency * 100).toFixed(0)}%`
        ]
    };

    const status = results.weldSizeOk && results.safetyFactor > 1.5 ? 'valid' : 'invalid';

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 select-none antialiased">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">

                {/* 1. Visualization */}
                <EngineeringVisualization status={status} label={t.welding.simulationLabel}>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <WeldingVisualization3D
                            jointType={jointType === 'doubleFillet' ? 'fillet' : jointType === 'vGroove' ? 'vgroove' : jointType as WeldJointType3D}
                            legSize={legSize}
                            thickness={thickness}
                            grooveAngle={grooveAngle}
                            length={length}
                            material1={{ color: material1Color, name: material1Name, shape: material1Profile, dimensions: material1Dims }}
                            material2={{ color: material2Color, name: material2Name, shape: material2Profile, dimensions: material2Dims }}
                            is2D={false}
                        />
                    </div>
                </EngineeringVisualization>

                {/* 2. Process & Joint Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-1">{t.welding.setup}</div>
                    <select
                        className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                        value={process}
                        onChange={(e) => setProcess(e.target.value as WeldingProcess)}
                    >
                        {Object.values(WELDING_METHODS).map(m => (
                            <option key={m.id} value={m.id}>{(t.welding.processes as any)?.[m.id] || m.name}</option>
                        ))}
                    </select>
                    <select
                        className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                        value={jointType}
                        onChange={(e) => setJointType(e.target.value as WeldJointType)}
                    >
                        {(['fillet', 'doubleFillet', 'butt', 'vGroove', 'tee', 'lap'] as WeldJointType[]).map(t_id => (
                            <option key={t_id} value={t_id}>{(t.welding.joints as any)?.[t_id] || JOINT_TYPES[t_id].name}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Parameters */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-1">{t.welding.power}</div>
                        <CalculatorInput label={t.welding.inputs.current} unit="A" value={current} onChange={(e) => setCurrent(Number(e.target.value))} />
                        <CalculatorInput label={t.welding.inputs.voltage} unit="V" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
                        <CalculatorInput label={t.welding.inputs.speed} unit="mm/min" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-1">{t.welding.geometry}</div>
                        <CalculatorInput label={t.welding.inputs.thickness} unit="mm" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} />
                        <CalculatorInput label={t.welding.inputs.legSize} unit="mm" value={legSize} onChange={(e) => setLegSize(Number(e.target.value))} />
                        <CalculatorInput label={t.welding.inputs.load} unit="N" value={load} onChange={(e) => setLoad(Number(e.target.value))} />
                    </div>
                </div>

                {/* 4. Results */}
                <div className="bg-[#252525] rounded-lg p-3 border border-[#333] space-y-3">
                    {/* Heat */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Flame size={12} className={results.heatStatus.status === 'optimal' ? 'text-green-500' : 'text-amber-500'} />
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.welding.heatInput}</span>
                        </div>
                        <div className="font-mono font-bold text-sm" style={{ color: results.heatStatus.color }}>
                            {results.heatInput.toFixed(2)} kJ/mm
                        </div>
                    </div>

                    {/* Stress */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Zap size={12} className={status === 'valid' ? 'text-green-500' : 'text-red-500'} />
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t.welding.weldStress} / SF</span>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold text-sm text-white">{results.stress.toFixed(1)} MPa</div>
                            <div className={`text-[10px] font-bold ${status === 'valid' ? 'text-green-500' : 'text-red-500'}`}>SF: {results.safetyFactor.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <AssumptionPanel metadata={metadata} status={status} />
            </div>
        </div>
    );
}

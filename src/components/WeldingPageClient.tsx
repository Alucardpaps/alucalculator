"use client";

import { useState, useMemo, useEffect } from "react";
import { CalculatorInput } from "@/components/CalculatorInput";
import { WeldingVisualization2D } from "@/components/modules/mechanical/WeldingVisualization2D";
import { TheorySection } from "@/components/TheorySection";
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
import { AlertTriangle, CheckCircle, Flame, Thermometer, Zap, Box, Layers, Eye } from 'lucide-react';
import { useI18nStore } from "@/store/i18nStore";

export default function WeldingPageClient() {
    const { t, language } = useI18nStore();
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

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

    // Material (for preheat calc)
    const [carbonContent, setCarbonContent] = useState(0.2); // %

    // Selected electrode
    const [selectedElectrode, setSelectedElectrode] = useState(ELECTRODE_CATALOG[7]); // ER70S-6



    // Material Profile Selection
    const [material1Profile, setMaterial1Profile] = useState<ShapeType>('sheet');
    const [material2Profile, setMaterial2Profile] = useState<ShapeType>('sheet');
    const [material1Color, setMaterial1Color] = useState('#94a3b8');
    const [material2Color, setMaterial2Color] = useState('#64748b');
    const [material1Id, setMaterial1Id] = useState('steel');
    const [material2Id, setMaterial2Id] = useState('steel');
    const [material1Dims, setMaterial1Dims] = useState<any>({ width: 60, height: 80, thickness: 12, wallThickness: 4, diameter: 50, flangeWidth: 40, flangeThickness: 6, webThickness: 4, legWidth: 40, legThickness: 5 });
    const [material2Dims, setMaterial2Dims] = useState<any>({ width: 60, height: 80, thickness: 12, wallThickness: 4, diameter: 50, flangeWidth: 40, flangeThickness: 6, webThickness: 4, legWidth: 40, legThickness: 5 });

    // Sync thickness with profile dims
    useEffect(() => {
        const getT = (shape: ShapeType, d: any) => {
            if (!d) return 10;
            if (shape === 'sheet') return d.thickness;
            if (shape === 'pipe' || shape === 'box') return d.wallThickness;
            if (shape === 'ibeam' || shape === 'channel' || shape === 'tee') return d.webThickness;
            if (shape === 'angle') return d.legThickness || d.thickness;
            if (shape === 'bar') return d.diameter;
            return 10;
        };

        const t1 = getT(material1Profile, material1Dims);
        const t2 = getT(material2Profile, material2Dims);
        const newT = Math.min(Number(t1 || 10), Number(t2 || 10));

        if (newT > 0) {
            setThickness(newT);
        }
    }, [material1Dims, material2Dims, material1Profile, material2Profile]);

    // Material options
    const MATERIAL_OPTIONS = [
        { id: 'steel', name: t.welding.materialSteel, color: '#94a3b8' },
        { id: 'stainless', name: t.welding.materialStainless, color: '#e2e8f0' },
        { id: 'aluminum', name: t.welding.materialAluminum, color: '#f1f5f9' },
        { id: 'copper', name: t.welding.materialCopper, color: '#f59e0b' },
        { id: 'brass', name: t.welding.materialBrass, color: '#fbbf24' },
    ];

    // Calculations
    const results = useMemo(() => {
        const method = WELDING_METHODS[process];
        const joint = JOINT_TYPES[jointType];

        // Heat Input
        const heatInput = calculateHeatInput(current, voltage, speed, method.efficiency);
        const heatStatus = evaluateHeatInput(heatInput);

        // Throat Area & Stress
        const throatArea = calculateThroatArea(jointType, legSize, length, thickness);
        const stress = load / throatArea;

        // Weld Size Check
        const minWeldSize = getMinWeldSize(thickness);
        const weldSizeOk = legSize >= minWeldSize;

        // Preheat requirement
        const preheat = calculatePreheat(carbonContent, thickness);

        // Filler consumption
        const filler = estimateFillerConsumption(jointType, legSize, length, thickness);

        // Joint efficiency
        const jointStrength = joint.jointEfficiency * selectedElectrode.tensileStrength;
        const safetyFactor = jointStrength / stress;

        return {
            heatInput,
            heatStatus,
            throatArea,
            stress,
            minWeldSize,
            weldSizeOk,
            preheat,
            filler,
            jointStrength,
            safetyFactor,
            efficiency: method.efficiency
        };
    }, [process, jointType, current, voltage, speed, legSize, thickness, length, load, carbonContent, selectedElectrode]);

    const currentMethod = WELDING_METHODS[process];
    const currentJoint = JOINT_TYPES[jointType];

    // Filter electrodes by selected process
    const compatibleElectrodes = ELECTRODE_CATALOG.filter(e => e.process.includes(process));

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-12 font-sans overflow-hidden">

            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center text-white font-black text-xl">W</div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">{t.welding?.title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.welding?.subtitle}</p>
                    </div>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded p-1">
                    <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'metric' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>METRIC</button>
                    <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs font-bold rounded ${unit === 'imperial' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>IMPERIAL</button>
                </div>
            </header>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: INPUTS */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Welding Process Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {t.welding.process}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(WELDING_METHODS).map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setProcess(method.id)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${process === method.id
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {language === 'tr' ? method.nameTr : method.name}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">{currentMethod.description}</p>
                    </div>

                    {/* Joint Type Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {t.welding.jointType}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(['fillet', 'doubleFillet', 'butt', 'vGroove', 'tee', 'lap'] as WeldJointType[]).map((type) => {
                                const joint = JOINT_TYPES[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setJointType(type)}
                                        className={`p-2 rounded-lg text-center transition-all ${jointType === type
                                            ? 'bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-500'
                                            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="text-2xl">{joint.icon}</span>
                                        <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                                            {(t.welding.joints as any)[type] || joint.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Weld Parameters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {t.welding.parameters}
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <CalculatorInput label={t.welding?.inputs?.current} unit="A" value={current} onChange={(e) => setCurrent(Number(e.target.value))} />
                            <CalculatorInput label={t.welding?.inputs?.voltage} unit="V" value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
                            <CalculatorInput label={t.welding?.inputs?.speed} unit="mm/min" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <CalculatorInput label={t.welding?.inputs?.thickness} unit="mm" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} />
                            {!['butt', 'vGroove', 'uGroove', 'jGroove'].includes(jointType) && (
                                <CalculatorInput label={t.welding?.inputs?.legSize} unit="mm" value={legSize} onChange={(e) => setLegSize(Number(e.target.value))} />
                            )}
                            {['vGroove', 'uGroove', 'jGroove'].includes(jointType) && (
                                <CalculatorInput label={t.welding?.inputs?.grooveAngle} unit="°" value={grooveAngle} onChange={(e) => setGrooveAngle(Number(e.target.value))} />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <CalculatorInput label={t.welding?.inputs?.length} unit="mm" value={length} onChange={(e) => setLength(Number(e.target.value))} />
                            <CalculatorInput label={t.welding?.inputs?.load} unit="N" value={load} onChange={(e) => setLoad(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Electrode Selection */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {t.welding.electrodes}
                        </h3>
                        <select
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-sm text-slate-900 dark:text-white"
                            value={selectedElectrode.code}
                            onChange={(e) => {
                                const electrode = ELECTRODE_CATALOG.find(el => el.code === e.target.value);
                                if (electrode) setSelectedElectrode(electrode);
                            }}
                        >
                            {compatibleElectrodes.map((el) => (
                                <option key={el.code} value={el.code}>
                                    {el.code} - {language === 'tr' ? el.nameTr : el.name} ({el.tensileStrength} MPa)
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-2">{selectedElectrode.applications}</p>
                    </div>
                </div>

                {/* RIGHT: VISUALIZATION & RESULTS */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Material Profile Selector */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} />
                                {t.welding.profiles}
                            </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Material 1 */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase">{t.welding.material1}</div>
                                <select
                                    className="w-full p-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded mb-2"
                                    value={material1Id}
                                    onChange={(e) => {
                                        const mat = MATERIAL_OPTIONS.find(m => m.id === e.target.value);
                                        if (mat) {
                                            setMaterial1Id(mat.id);
                                            setMaterial1Color(mat.color);
                                        }
                                    }}
                                >
                                    {MATERIAL_OPTIONS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                    {(['sheet', 'pipe', 'bar', 'box', 'ibeam', 'angle'] as ShapeType[]).map(shape => (
                                        <button
                                            key={shape}
                                            onClick={() => setMaterial1Profile(shape)}
                                            className={`p-1.5 rounded text-center transition-all ${material1Profile === shape ? 'bg-orange-100 border-2 border-orange-500' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <span className="text-lg">{SHAPE_INFO[shape]?.icon || '▢'}</span>
                                            <div className="text-[8px] text-slate-500">{SHAPE_INFO[shape]?.name || shape}</div>
                                        </button>
                                    ))}
                                </div>
                                {/* Dims 1 */}
                                <div className="grid grid-cols-2 gap-2">
                                    {material1Profile === 'sheet' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.width}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.width} onChange={e => setMaterial1Dims({ ...material1Dims, width: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.thick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.thickness} onChange={e => setMaterial1Dims({ ...material1Dims, thickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {(material1Profile === 'pipe' || material1Profile === 'bar') && (
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.diameter}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.diameter} onChange={e => setMaterial1Dims({ ...material1Dims, diameter: Number(e.target.value) })} /></div>
                                    )}
                                    {(material1Profile === 'pipe' || material1Profile === 'box') && (
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.wallThick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.wallThickness} onChange={e => setMaterial1Dims({ ...material1Dims, wallThickness: Number(e.target.value) })} /></div>
                                    )}
                                    {material1Profile === 'box' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.width}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.width} onChange={e => setMaterial1Dims({ ...material1Dims, width: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.height}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.height} onChange={e => setMaterial1Dims({ ...material1Dims, height: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {(material1Profile === 'ibeam' || material1Profile === 'channel' || material1Profile === 'tee') && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.height}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.height} onChange={e => setMaterial1Dims({ ...material1Dims, height: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.flange}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.flangeWidth} onChange={e => setMaterial1Dims({ ...material1Dims, flangeWidth: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.webT}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.webThickness} onChange={e => setMaterial1Dims({ ...material1Dims, webThickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {material1Profile === 'angle' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.leg}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.legWidth} onChange={e => setMaterial1Dims({ ...material1Dims, legWidth: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.thick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material1Dims.legThickness || material1Dims.thickness} onChange={e => setMaterial1Dims({ ...material1Dims, legThickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Material 2 */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase">{t.welding.material2}</div>
                                <select
                                    className="w-full p-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded mb-2"
                                    value={material2Id}
                                    onChange={(e) => {
                                        const mat = MATERIAL_OPTIONS.find(m => m.id === e.target.value);
                                        if (mat) {
                                            setMaterial2Id(mat.id);
                                            setMaterial2Color(mat.color);
                                        }
                                    }}
                                >
                                    {MATERIAL_OPTIONS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                    {(['sheet', 'pipe', 'bar', 'box', 'ibeam', 'angle'] as ShapeType[]).map(shape => (
                                        <button
                                            key={shape}
                                            onClick={() => setMaterial2Profile(shape)}
                                            className={`p-1.5 rounded text-center transition-all ${material2Profile === shape ? 'bg-orange-100 border-2 border-orange-500' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <span className="text-lg">{SHAPE_INFO[shape]?.icon || '▢'}</span>
                                            <div className="text-[8px] text-slate-500">{SHAPE_INFO[shape]?.name || shape}</div>
                                        </button>
                                    ))}
                                </div>
                                {/* Dims 2 */}
                                <div className="grid grid-cols-2 gap-2">
                                    {material2Profile === 'sheet' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.width}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.width} onChange={e => setMaterial2Dims({ ...material2Dims, width: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.thick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.thickness} onChange={e => setMaterial2Dims({ ...material2Dims, thickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {(material2Profile === 'pipe' || material2Profile === 'bar') && (
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.diameter}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.diameter} onChange={e => setMaterial2Dims({ ...material2Dims, diameter: Number(e.target.value) })} /></div>
                                    )}
                                    {(material2Profile === 'pipe' || material2Profile === 'box') && (
                                        <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.wallThick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.wallThickness} onChange={e => setMaterial2Dims({ ...material2Dims, wallThickness: Number(e.target.value) })} /></div>
                                    )}
                                    {material2Profile === 'box' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.width}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.width} onChange={e => setMaterial2Dims({ ...material2Dims, width: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.height}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.height} onChange={e => setMaterial2Dims({ ...material2Dims, height: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {(material2Profile === 'ibeam' || material2Profile === 'channel' || material2Profile === 'tee') && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.height}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.height} onChange={e => setMaterial2Dims({ ...material2Dims, height: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.flange}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.flangeWidth} onChange={e => setMaterial2Dims({ ...material2Dims, flangeWidth: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.webT}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.webThickness} onChange={e => setMaterial2Dims({ ...material2Dims, webThickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                    {material2Profile === 'angle' && (
                                        <>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.leg}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.legWidth} onChange={e => setMaterial2Dims({ ...material2Dims, legWidth: Number(e.target.value) })} /></div>
                                            <div className="col-span-1"><label className="text-[10px] text-slate-400">{t.welding.dims.thick}</label><input type="number" className="w-full text-xs p-1 border rounded" value={material2Dims.legThickness || material2Dims.thickness} onChange={e => setMaterial2Dims({ ...material2Dims, legThickness: Number(e.target.value) })} /></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Weldability Check */}
                        {material1Id !== material2Id && (
                            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-2 text-xs">
                                <AlertTriangle size={14} className="text-amber-500" />
                                <span className="text-amber-700 dark:text-amber-400">
                                    {t.welding.dissimilarWarning.replace('{m1}', (MATERIAL_OPTIONS.find(m => m.id === material1Id)?.name || material1Id)).replace('{m2}', (MATERIAL_OPTIONS.find(m => m.id === material2Id)?.name || material2Id))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Weld Visualization (Animated 2D) */}
                    <div className="h-[350px]">
                        <WeldingVisualization2D
                            jointType={jointType === 'doubleFillet' ? 'fillet' : jointType === 'vGroove' ? 'vgroove' : jointType as any}
                            legSize={legSize}
                            thickness={thickness}
                            grooveAngle={grooveAngle}
                            length={length}
                            material1={{
                                color: material1Color,
                                name: material1Id,
                                shape: material1Profile,
                                dimensions: material1Dims
                            }}
                            material2={{
                                color: material2Color,
                                name: material2Id,
                                shape: material2Profile,
                                dimensions: material2Dims
                            }}
                        />
                    </div>

                    {/* Material Comparison */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-1 mb-2">
                            <span>{material1Id}</span>
                            <span className="text-slate-700 mx-2">VS</span>
                            <span>{material2Id}</span>
                        </div>
                        <div className="flex h-4 rounded overflow-hidden shadow-inner">
                            <div className="h-full transition-all duration-500" style={{ width: `${(thickness / (thickness + 10)) * 100}%`, backgroundColor: material1Color }} />
                            <div className="h-full transition-all duration-500 border-l border-cyan-500/30" style={{ width: '2px', backgroundColor: '#06b6d4' }} />
                            <div className="h-full transition-all duration-500" style={{ width: `${(10 / (thickness + 10)) * 100}%`, backgroundColor: material2Color }} />
                        </div>
                    </div>

                    {/* Result Dashboard */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Heat Input */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                        <Flame size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.welding.heatInput}</h4>
                                        <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">
                                            {results.heatInput.toFixed(2)} <span className="text-sm font-medium text-slate-400">kJ/mm</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: results.heatStatus.color }}>
                                    {results.heatStatus.status === 'optimal' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                    {results.heatStatus.message}
                                </div>
                            </div>

                            {/* Stress */}
                            <div>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                    <Zap size={12} />
                                    {t.welding.weldStress}
                                </div>
                                <div className={`text-3xl font-mono font-bold ${results.safetyFactor < 1.5 ? 'text-red-400' : results.safetyFactor < 2.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {results.stress.toFixed(1)} <span className="text-lg">MPa</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Safety Factor: <span className={results.safetyFactor < 1.5 ? 'text-red-400' : 'text-green-400'}>{results.safetyFactor.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
                            {/* Throat Area */}
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase">{t.welding.throatArea}</div>
                                <div className="font-mono text-lg">{results.throatArea.toFixed(0)} mm²</div>
                            </div>

                            {/* Min Weld Size */}
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase">{t.welding.minWeldSize}</div>
                                <div className={`font-mono text-lg flex items-center gap-1 ${results.weldSizeOk ? 'text-green-400' : 'text-red-400'}`}>
                                    {results.minWeldSize} mm
                                    {results.weldSizeOk ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                </div>
                            </div>

                            {/* Joint Efficiency */}
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase">{t.welding.jointEfficiency}</div>
                                <div className="font-mono text-lg text-orange-400">{(currentJoint.jointEfficiency * 100).toFixed(0)}%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                            {/* Preheat */}
                            <div className="flex items-center gap-3">
                                <Thermometer size={20} className={results.preheat.required ? 'text-orange-400' : 'text-slate-500'} />
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase">{t.welding.preheat}</div>
                                    <div className={`font-mono text-lg ${results.preheat.required ? 'text-orange-400' : 'text-slate-400'}`}>
                                        {results.preheat.required ? `${results.preheat.temperature}°C` : t.welding.notRequired}
                                    </div>
                                </div>
                            </div>

                            {/* Filler Consumption */}
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase">{t.welding.fillerMetal}</div>
                                <div className="font-mono text-lg">{results.filler.weight.toFixed(1)} g</div>
                            </div>
                        </div>
                    </div>

                    {/* Process Info */}
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase">{t.welding.efficiency}</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">{(currentMethod.efficiency * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase">{t.welding.depositionRate}</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">{currentMethod.depositionRate.min}-{currentMethod.depositionRate.max} kg/h</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase">{t.welding.positions}</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">{currentMethod.positionCapability.join(', ')}</div>
                        </div>
                    </div>
                </div>

            </div>

            <TheorySection title={t.welding.thermodynamics}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t.welding.heatFormula}</h4>
                        <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm mb-2">Q = (V × I × 60 × η) / (v × 1000)</code>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t.welding.heatFormulaDesc}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t.welding.carbonEquivalent}</h4>
                        <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs mb-2">CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15</code>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t.welding.carbonEquivalentDesc}
                        </p>
                    </div>
                </div>
            </TheorySection>
        </main >
    );
}

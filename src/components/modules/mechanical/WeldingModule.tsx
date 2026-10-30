'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { WeldingVisualization2D } from './WeldingVisualization2D';
import {
    WELDING_METHODS,
    JOINT_TYPES,
    ELECTRODE_CATALOG,
    BASE_METALS_CATALOG,
    CEV_STEEL_PRESETS,
    WeldingProcess,
    WeldJointType,
    OmniWeldJointConfig,
    OmniWeldSolveTarget,
    getMinWeldSize,
    calculateThroatArea,
    calculateHeatInput,
    evaluateHeatInput,
    calculatePreheat,
    estimateFillerConsumption,
    calculateOmniWeldStrength,
    calculateCarbonEquivalentSuite,
    calculateWeldingCostAndGas,
} from '@/data/weldingData';
import {
    betaWFromFy,
    directionalFilletCheck,
    filletThroatMm,
    filletThroatStresses,
    simplifiedFilletFwRd,
} from '@/data/mechanical/en1993Weld';
import { ShapeType } from '@/utils/sectionProperties';
import {
    Flame,
    Zap,
    Settings,
    Layers,
    ShieldCheck,
    AlertTriangle,
    Calculator,
    FlaskConical,
    Coins,
    Copy,
    Check,
    ArrowRight,
    RotateCcw,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useOSStore } from '@/store/osStore';
import { t12 } from '@/locales/t12';
import { getWeldingModuleStrings } from '@/locales/weldingModuleTranslations';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

type WeldingActiveTab = 'eurocode_aws' | 'omni_joint_solver' | 'carbon_equivalent' | 'cost_gas';

export function WeldingModule() {
    const precision = useGlobalPrecision();
    const { language, t } = useI18nStore();
    const w = getWeldingModuleStrings(language);
    const { dictionary: dict } = useOSStore();
    const wDict = dict?.welding || {};

    const [activeTab, setActiveTab] = useState<WeldingActiveTab>('eurocode_aws');
    const [copiedWps, setCopiedWps] = useState(false);

    // ─── TAB 1: EUROCODE 3 / EUROCODE 9 / AWS D1.1 STATE ───
    const [baseMetalId, setBaseMetalId] = useState<string>('s235jr');
    const [process, setProcess] = useState<WeldingProcess>('mig');
    const [jointType, setJointType] = useState<WeldJointType>('fillet');
    const [current, setCurrent] = useState(180);
    const [voltage, setVoltage] = useState(26);
    const [speed, setSpeed] = useState(350);
    const [legSize, setLegSize] = useState(6);
    const [thickness, setThickness] = useState(10);
    const [length, setLength] = useState(150);
    const [loadParallel, setLoadParallel] = useState(15000);
    const [loadTransverse, setLoadTransverse] = useState(5000);
    const [grooveAngle, setGrooveAngle] = useState(60);
    const [carbonContent, setCarbonContent] = useState(0.18);
    const [selectedElectrode, setSelectedElectrode] = useState(ELECTRODE_CATALOG[7]); // ER70S-6

    const activeBaseMetal = useMemo(
        () => BASE_METALS_CATALOG.find((m) => m.id === baseMetalId) || BASE_METALS_CATALOG[0],
        [baseMetalId]
    );

    const handleBaseMetalChange = (newId: string) => {
        setBaseMetalId(newId);
        const found = BASE_METALS_CATALOG.find((m) => m.id === newId);
        if (found) {
            const recElec = ELECTRODE_CATALOG.find((e) => e.code === found.recommendedElectrode);
            if (recElec) setSelectedElectrode(recElec);
            setOmniSigmaT(found.allowTensileMPa);
            setOmniTau(found.allowShearMPa);
        }
    };

    const [material1Profile] = useState<ShapeType>('sheet');
    const [material2Profile] = useState<ShapeType>('sheet');
    const material1Color = activeBaseMetal.family === 'aluminum' ? '#cbd5e1' : '#94a3b8';
    const material2Color = activeBaseMetal.family === 'aluminum' ? '#94a3b8' : '#64748b';
    const defaultDims = useMemo(
        () => ({
            width: 60,
            height: 80,
            thickness,
            wallThickness: 4,
            diameter: 50,
            flangeWidth: 40,
            flangeThickness: 6,
            webThickness: 4,
            legWidth: 40,
            legThickness: 5,
        }),
        [thickness]
    );

    // ─── TAB 2: OMNI-STYLE JOINT STRENGTH & REVERSE SOLVER STATE ───
    const [omniConfig, setOmniConfig] = useState<OmniWeldJointConfig>('single_transverse');
    const [omniSolveTarget, setOmniSolveTarget] = useState<OmniWeldSolveTarget>('solve_load');
    const [omniWeldSize, setOmniWeldSize] = useState<number>(5);
    const [omniSecondThroat, setOmniSecondThroat] = useState<number>(5);
    const [omniLength1, setOmniLength1] = useState<number>(100);
    const [omniLength2, setOmniLength2] = useState<number>(80);
    const [omniShaftDia, setOmniShaftDia] = useState<number>(50);
    const [omniSigmaT, setOmniSigmaT] = useState<number>(70);
    const [omniTau, setOmniTau] = useState<number>(56);
    const [omniTargetForceKN, setOmniTargetForceKN] = useState<number>(24.75);
    const [omniIncludeCrater, setOmniIncludeCrater] = useState<boolean>(true);

    // ─── TAB 3: CARBON EQUIVALENT (CEV) & PREHEAT STATE ───
    const [cevPresetId, setCevPresetId] = useState<string>('s355j2');
    const [cevC, setCevC] = useState<number>(0.18);
    const [cevMn, setCevMn] = useState<number>(1.45);
    const [cevSi, setCevSi] = useState<number>(0.35);
    const [cevCr, setCevCr] = useState<number>(0.08);
    const [cevMo, setCevMo] = useState<number>(0.02);
    const [cevV, setCevV] = useState<number>(0.03);
    const [cevCu, setCevCu] = useState<number>(0.20);
    const [cevNi, setCevNi] = useState<number>(0.08);
    const [cevB, setCevB] = useState<number>(0.0);
    const [cevThickness, setCevThickness] = useState<number>(20);

    const applyCevPreset = (presetId: string) => {
        setCevPresetId(presetId);
        const p = CEV_STEEL_PRESETS.find((item) => item.id === presetId);
        if (p) {
            setCevC(p.C);
            setCevMn(p.Mn);
            setCevSi(p.Si);
            setCevCr(p.Cr);
            setCevMo(p.Mo);
            setCevV(p.V);
            setCevCu(p.Cu);
            setCevNi(p.Ni);
            setCevB(p.B);
        }
    };

    // ─── TAB 4: WELDING COST, GAS & DEPOSITION STATE ───
    const [gasFlowLMin, setGasFlowLMin] = useState<number>(14);
    const [wirePricePerKg, setWirePricePerKg] = useState<number>(4.5);
    const [gasPricePerL, setGasPricePerL] = useState<number>(0.015);
    const [laborRatePerHour, setLaborRatePerHour] = useState<number>(35);
    const [dutyCycle, setDutyCycle] = useState<number>(0.45);

    // ─── COMPUTE TAB 1: EUROCODE 3 / EUROCODE 9 / AWS D1.1 RESULTS ───
    const results = useMemo(() => {
        const method = WELDING_METHODS[process];
        const joint = JOINT_TYPES[jointType];
        const totalLoadN = Math.hypot(loadParallel, loadTransverse);
        const heatInput = calculateHeatInput(current, voltage, speed, method.efficiency);
        const heatStatus = evaluateHeatInput(
            heatInput,
            activeBaseMetal.family === 'aluminum'
                ? 'aluminum'
                : activeBaseMetal.family === 'stainless'
                ? 'stainless'
                : 'carbon'
        );
        const throatArea = calculateThroatArea(jointType, legSize, length, thickness);
        const stress = throatArea > 0 ? totalLoadN / throatArea : 0;
        const minWeldSize = getMinWeldSize(thickness);
        const weldSizeOk = legSize >= minWeldSize;
        const preheat = calculatePreheat(carbonContent, thickness);
        const filler = estimateFillerConsumption(jointType, legSize, length, thickness);
        const adjustedFillerWeightG = (filler.volume * activeBaseMetal.densityGcm3) / 1000;

        // EN 1993-1-8 (Steel) & EN 1999-1-1 (Aluminum HAZ softening rho_haz)
        const a_throat = filletThroatMm(legSize);
        const numWelds = jointType === 'doubleFillet' ? 2 : 1;
        const Aw_en = a_throat * length * numWelds;
        const beta_w = betaWFromFy(selectedElectrode.yieldStrength);
        const gamma_M2 = 1.25;
        // Effective ultimate strength accounting for Aluminum HAZ softening (EN 1999-1-1 §8.6)
        const effectiveFu = Math.min(
            selectedElectrode.tensileStrength,
            activeBaseMetal.fuMPa * activeBaseMetal.rhoHaz
        );
        const Fw_Rd_N = simplifiedFilletFwRd(Aw_en, effectiveFu, beta_w, gamma_M2);
        const Fw_Rd_kN = Fw_Rd_N / 1000;

        const throatStresses = filletThroatStresses({
            F_parallel: loadParallel,
            F_transverse: loadTransverse,
            a: a_throat,
            L: length,
            n: numWelds,
        });
        const enCheck = directionalFilletCheck({
            ...throatStresses,
            fu: effectiveFu,
            beta_w,
            gamma_M2,
        });

        const jointStrength = joint.jointEfficiency * effectiveFu;
        const safetyFactor = stress > 0 ? jointStrength / stress : 999;

        return {
            totalLoadN,
            heatInput,
            heatStatus,
            throatArea,
            a_throat,
            stress,
            minWeldSize,
            weldSizeOk,
            preheat,
            fillerWeightG: adjustedFillerWeightG,
            fillerVolumeMm3: filler.volume,
            jointStrength,
            safetyFactor,
            Fw_Rd_kN,
            Fw_Rd_N,
            beta_w,
            effectiveFu,
            throatStresses,
            enCheck,
            efficiency: method.efficiency,
        };
    }, [
        process,
        jointType,
        current,
        voltage,
        speed,
        legSize,
        thickness,
        length,
        loadParallel,
        loadTransverse,
        carbonContent,
        selectedElectrode,
        activeBaseMetal,
    ]);

    // ─── COMPUTE TAB 2: OMNI JOINT STRENGTH & REVERSE SOLVER ───
    const omniResult = useMemo(
        () =>
            calculateOmniWeldStrength({
                config: omniConfig,
                solveTarget: omniSolveTarget,
                weldSizeMm: omniWeldSize,
                secondThroatMm: omniSecondThroat,
                length1Mm: omniLength1,
                length2Mm: omniLength2,
                shaftDiameterMm: omniShaftDia,
                allowTensileMPa: omniSigmaT,
                allowShearMPa: omniTau,
                targetForceKN: omniTargetForceKN,
                includeCraterAllowance: omniIncludeCrater,
            }),
        [
            omniConfig,
            omniSolveTarget,
            omniWeldSize,
            omniSecondThroat,
            omniLength1,
            omniLength2,
            omniShaftDia,
            omniSigmaT,
            omniTau,
            omniTargetForceKN,
            omniIncludeCrater,
        ]
    );

    // ─── COMPUTE TAB 3: CARBON EQUIVALENT SUITE ───
    const cevResult = useMemo(
        () =>
            calculateCarbonEquivalentSuite({
                C: cevC,
                Mn: cevMn,
                Si: cevSi,
                Cr: cevCr,
                Mo: cevMo,
                V: cevV,
                Cu: cevCu,
                Ni: cevNi,
                B: cevB,
                thicknessMm: cevThickness,
            }),
        [cevC, cevMn, cevSi, cevCr, cevMo, cevV, cevCu, cevNi, cevB, cevThickness]
    );

    // ─── COMPUTE TAB 4: WELDING COST & GAS ───
    const costResult = useMemo(
        () =>
            calculateWeldingCostAndGas({
                jointType,
                legSizeMm: legSize,
                thicknessMm: thickness,
                weldLengthMm: length,
                densityGcm3: activeBaseMetal.densityGcm3,
                depositionEfficiency: WELDING_METHODS[process].efficiency,
                travelSpeedMmMin: speed,
                gasFlowLMin,
                currentA: current,
                voltageV: voltage,
                wirePricePerKg,
                gasPricePerL,
                laborRatePerHour,
                operatorDutyCycle: dutyCycle,
            }),
        [
            jointType,
            legSize,
            thickness,
            length,
            activeBaseMetal.densityGcm3,
            process,
            speed,
            gasFlowLMin,
            current,
            voltage,
            wirePricePerKg,
            gasPricePerL,
            laborRatePerHour,
            dutyCycle,
        ]
    );

    const isSafe = results.weldSizeOk && results.safetyFactor >= 1.25 && results.enCheck.U <= 1.0;

    const handleCopyWpsReport = () => {
        const report = [
            `ALUCALC OS — WPS & WELD JOINT VERIFICATION REPORT`,
            `Standard: ${activeBaseMetal.standard} / AWS D1.1`,
            `Base Metal: ${activeBaseMetal.name} (ρ_HAZ = ${activeBaseMetal.rhoHaz})`,
            `Process: ${WELDING_METHODS[process].name} | Filler: ${selectedElectrode.code} (${selectedElectrode.tensileStrength} MPa)`,
            `Shielding Gas: ${activeBaseMetal.shieldingGas}`,
            `Geometry: Joint=${jointType}, Leg Size s=${legSize} mm (Throat a=${results.a_throat.toFixed(2)} mm), Length L=${length} mm, Plate t=${thickness} mm`,
            `Loading: F_parallel=${loadParallel} N, F_transverse=${loadTransverse} N (Total F=${results.totalLoadN.toFixed(0)} N)`,
            `Results: EC3/EC9 Utilization U=${(results.enCheck.U * 100).toFixed(1)}%, Fw,Rd=${results.Fw_Rd_kN.toFixed(2)} kN, Safety Factor n=${results.safetyFactor.toFixed(2)}`,
            `Heat Input: Q=${results.heatInput.toFixed(2)} kJ/mm (${results.heatStatus.status.toUpperCase()}) | Filler Mass=${results.fillerWeightG.toFixed(1)} g`,
            `Status: ${isSafe ? 'PASS (COMPLIANT)' : 'FAIL / REVIEW REQUIRED'}`,
        ].join('\n');
        navigator.clipboard.writeText(report);
        setCopiedWps(true);
        setTimeout(() => setCopiedWps(false), 2000);
    };

    const resetAll = () => {
        setBaseMetalId('s235jr');
        setProcess('mig');
        setJointType('fillet');
        setCurrent(180);
        setVoltage(26);
        setSpeed(350);
        setLegSize(6);
        setThickness(10);
        setLength(150);
        setLoadParallel(15000);
        setLoadTransverse(5000);
    };

    return (
        <div className="flex flex-col w-full min-h-full bg-[var(--bg-0)] text-[var(--ink)]">
            {/* ═══ TOP INSTRUMENT COMMAND & MODE BAR ═══ */}
            <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] px-4 py-3 sm:px-6">
                <div className="max-w-[1680px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[var(--radius-s)] bg-[var(--warn)]/15 border border-[var(--warn)]/40 flex items-center justify-center text-[var(--warn)] shrink-0">
                            <Flame size={18} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold font-tech tracking-tight text-[var(--ink)]">
                                    {t12(
                                        language,
                                        'Welding Strength, Eurocode & WPS Workstation',
                                        'Kaynak Mukavemeti, Eurocode & WPS Çalışma İstasyonu'
                                    )}
                                </h2>
                                <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-2)] border border-[var(--line)] font-mono text-[10px] font-bold text-[var(--cyan)]">
                                    EN 1993-1-8 · EN 1999-1-1 · AWS D1.1
                                </span>
                            </div>
                            <p className="text-[11px] font-mono text-[var(--alu-dim)]">
                                {t12(
                                    language,
                                    'Fillet & Butt Joint Strength · Reverse Length/Leg Solver · Carbon Equivalent (CEV) · Cost & Shielding Gas',
                                    'Köşe ve Alın Kaynağı Mukavemeti · Tersine Boy/Kalınlık Çözücü · Karbon Eşdeğeri (CEV) · Maliyet & Koruyucu Gaz'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* 4-Mode Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-0)] p-1 rounded-[var(--radius-s)] border border-[var(--line)]">
                        {[
                            {
                                id: 'eurocode_aws' as WeldingActiveTab,
                                icon: <ShieldCheck size={13} />,
                                labelEn: '1. Eurocode / AWS & Sim',
                                labelTr: '1. Eurocode / AWS & Simülasyon',
                            },
                            {
                                id: 'omni_joint_solver' as WeldingActiveTab,
                                icon: <Calculator size={13} />,
                                labelEn: '2. Joint Strength & Reverse Solver',
                                labelTr: '2. Kaynak Yükü & Tersine Çözücü',
                            },
                            {
                                id: 'carbon_equivalent' as WeldingActiveTab,
                                icon: <FlaskConical size={13} />,
                                labelEn: '3. Carbon Equivalent (CEV)',
                                labelTr: '3. Karbon Eşdeğeri (CEV & Ön Tav)',
                            },
                            {
                                id: 'cost_gas' as WeldingActiveTab,
                                icon: <Coins size={13} />,
                                labelEn: '4. Cost, Gas & Filler Wire',
                                labelTr: '4. Maliyet, Gaz & Tel Tüketimi',
                            },
                        ].map((tab) => {
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                                        active
                                            ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                                            : 'text-[var(--alu)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)]'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{language === 'tr' ? tab.labelTr : tab.labelEn}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ═══ TAB 1: EUROCODE 3 / EUROCODE 9 / AWS D1.1 & LIVE ARC SIMULATION ═══ */}
            {activeTab === 'eurocode_aws' && (
                <div className="max-w-[1680px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* LEFT 5 COLUMNS: INPUTS */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Base Metal & Filler Selection */}
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-1.5">
                                    <Settings size={13} />
                                    {t12(language, 'Base Metal, Process & Filler', 'Ana Malzeme, Yöntem & Dolgu Teli')}
                                </span>
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer"
                                >
                                    <RotateCcw size={11} />
                                    {t12(language, 'Reset', 'Sıfırla')}
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                <FieldSelect
                                    label={t12(language, 'Base Metal (Steel / Aluminum / Stainless)', 'Ana Malzeme (Çelik / Alüminyum / Paslanmaz)')}
                                    value={baseMetalId}
                                    onChange={handleBaseMetalChange}
                                    options={BASE_METALS_CATALOG.map((m) => ({
                                        value: m.id,
                                        label: `${language === 'tr' ? m.nameTr : m.name} · fu=${m.fuMPa} MPa`,
                                    }))}
                                />

                                {activeBaseMetal.family === 'aluminum' && (
                                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--warn)]/10 border border-[var(--warn)]/30 text-[11px] font-mono text-[var(--warn)] flex items-start gap-2">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <strong>EN 1999-1-1 (Eurocode 9) ITAB / HAZ:</strong>{' '}
                                            {t12(
                                                language,
                                                `Heat-Affected Zone softening factor ρ_haz = ${activeBaseMetal.rhoHaz} applied automatically (${Math.round((1 - activeBaseMetal.rhoHaz) * 100)}% local T6 strength reduction near weld toe).`,
                                                `Isı Tesiri Altındaki Bölge (ITAB) yumuşama katsayısı ρ_haz = ${activeBaseMetal.rhoHaz} otomatik uygulandı (kaynak yanında %${Math.round((1 - activeBaseMetal.rhoHaz) * 100)} T6 mukavemet kaybı).`
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <FieldSelect
                                        label={wDict.inputs?.method || t12(language, 'Welding Process', 'Kaynak Yöntemi')}
                                        value={process}
                                        onChange={(v) => setProcess(v as WeldingProcess)}
                                        options={Object.values(WELDING_METHODS).map((m) => ({
                                            value: m.id,
                                            label: `${language === 'tr' ? m.nameTr : m.name} (η=${m.efficiency})`,
                                        }))}
                                    />
                                    <FieldSelect
                                        label={wDict.inputs?.type || t12(language, 'Joint Type', 'Birleşim Tipi')}
                                        value={jointType}
                                        onChange={(v) => setJointType(v as WeldJointType)}
                                        options={(
                                            ['fillet', 'doubleFillet', 'butt', 'vGroove', 'tee', 'lap', 'corner'] as WeldJointType[]
                                        ).map((j) => ({
                                            value: j,
                                            label: `${JOINT_TYPES[j].icon} ${
                                                language === 'tr' ? JOINT_TYPES[j].nameTr : JOINT_TYPES[j].name
                                            }`,
                                        }))}
                                    />
                                </div>

                                <FieldSelect
                                    label={w.electrode || t12(language, 'Electrode / Filler Wire', 'Elektrot / Kaynak Teli')}
                                    value={selectedElectrode.code}
                                    onChange={(v) =>
                                        setSelectedElectrode(
                                            ELECTRODE_CATALOG.find((e) => e.code === v) || ELECTRODE_CATALOG[0]
                                        )
                                    }
                                    options={ELECTRODE_CATALOG.map((e) => ({
                                        value: e.code,
                                        label: `${e.code} — ${language === 'tr' ? e.nameTr : e.name} (fu=${e.tensileStrength} MPa)`,
                                    }))}
                                />
                            </div>
                        </div>

                        {/* Geometry & Directional Loads */}
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--warn)] flex items-center gap-1.5 border-b border-[var(--line)] pb-2">
                                <Layers size={13} />
                                {t12(language, 'Weld Geometry & Directional Loads', 'Dikiş Geometrisi & Yönlü Kuvvetler')}
                            </span>

                            <div className="grid grid-cols-3 gap-2.5">
                                <FieldNumber
                                    label={t12(language, 'Leg Size (s)', 'Dikiş Kenarı (s)')}
                                    unit="mm"
                                    value={legSize}
                                    min={1.5}
                                    max={40}
                                    step={0.5}
                                    onChange={setLegSize}
                                />
                                <FieldNumber
                                    label={t12(language, 'Plate (t)', 'Sac Kalınlığı (t)')}
                                    unit="mm"
                                    value={thickness}
                                    min={1.5}
                                    max={120}
                                    step={0.5}
                                    onChange={setThickness}
                                />
                                <FieldNumber
                                    label={t12(language, 'Weld Length (L)', 'Kaynak Boyu (L)')}
                                    unit="mm"
                                    value={length}
                                    min={10}
                                    max={5000}
                                    step={5}
                                    onChange={setLength}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <FieldNumber
                                    label={t12(language, 'Longitudinal Shear (F∥)', 'Boyuna Kesme Yükü (F∥)')}
                                    unit="N"
                                    value={loadParallel}
                                    min={0}
                                    max={2000000}
                                    step={500}
                                    onChange={setLoadParallel}
                                />
                                <FieldNumber
                                    label={t12(language, 'Transverse Load (F⊥)', 'Enine Çekme Yükü (F⊥)')}
                                    unit="N"
                                    value={loadTransverse}
                                    min={0}
                                    max={2000000}
                                    step={500}
                                    onChange={setLoadTransverse}
                                />
                            </div>
                        </div>

                        {/* Arc Power & WPS Heat Input */}
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ok)] flex items-center gap-1.5 border-b border-[var(--line)] pb-2">
                                <Zap size={13} />
                                {t12(language, 'WPS Arc Power & Heat Input (EN 1011-1)', 'WPS Ark Gücü & Isı Girdisi (EN 1011-1)')}
                            </span>

                            <div className="grid grid-cols-3 gap-2.5">
                                <FieldNumber
                                    label={t12(language, 'Current (I)', 'Akım (I)')}
                                    unit="A"
                                    value={current}
                                    min={30}
                                    max={600}
                                    step={5}
                                    onChange={setCurrent}
                                />
                                <FieldNumber
                                    label={t12(language, 'Voltage (U)', 'Gerilim (U)')}
                                    unit="V"
                                    value={voltage}
                                    min={10}
                                    max={48}
                                    step={0.5}
                                    onChange={setVoltage}
                                />
                                <FieldNumber
                                    label={t12(language, 'Travel Speed', 'İlerleme Hızı')}
                                    unit="mm/min"
                                    value={speed}
                                    min={50}
                                    max={1500}
                                    step={10}
                                    onChange={setSpeed}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT 7 COLUMNS: TELEMETRY READOUTS & 2D BLUEPRINT / ARC SIMULATOR */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        {/* Primary Verdict & Multi-Metric Readout Bar */}
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--line)]">
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={`px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold uppercase ${
                                            isSafe
                                                ? 'bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/40'
                                                : 'bg-[var(--bad)]/15 text-[var(--bad)] border border-[var(--bad)]/40'
                                        }`}
                                    >
                                        {isSafe
                                            ? t12(language, '✓ PASS · CODE COMPLIANT', '✓ UYGUN · STANDARDA UYUMLU')
                                            : t12(language, '⚠ WARNING · CHECK UTILIZATION / MIN LEG', '⚠ UYARI · KAPASİTE / MİN. KENAR AŞIMI')}
                                    </span>
                                    <span className="text-xs font-mono text-[var(--alu)]">
                                        {language === 'tr' ? activeBaseMetal.shieldingGasTr : activeBaseMetal.shieldingGas}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopyWpsReport}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line-strong)] font-mono text-[11px] font-bold text-[var(--cyan)] cursor-pointer"
                                    >
                                        {copiedWps ? <Check size={12} /> : <Copy size={12} />}
                                        <span>{copiedWps ? t12(language, 'Copied WPS!', 'WPS Kopyalandı!') : t12(language, 'Copy WPS Report', 'WPS Raporunu Kopyala')}</span>
                                    </button>
                                    <Link
                                        href="/cad-editor"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] border border-[var(--line)] font-mono text-[11px] text-[var(--alu)] hover:text-[var(--ink)]"
                                    >
                                        <span>2D CAD</span>
                                        <ArrowRight size={11} />
                                    </Link>
                                </div>
                            </div>

                            {/* 6 Instrument Readout Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                                <ReadoutBox
                                    label={t12(language, 'Design Resistance Fw,Rd', 'Tasarım Dayanımı Fw,Rd')}
                                    value={`${results.Fw_Rd_kN.toFixed(1)} kN`}
                                    sub={`(${(results.Fw_Rd_N * 0.224809 / 1000).toFixed(1)} kip)`}
                                    color={results.totalLoadN <= results.Fw_Rd_N ? 'var(--ok)' : 'var(--bad)'}
                                />
                                <ReadoutBox
                                    label={t12(language, 'EC3 / EC9 Utilization', 'Eurocode Kullanım Oranı')}
                                    value={`${(results.enCheck.U * 100).toFixed(1)}%`}
                                    sub={`σ_w = ${results.enCheck.sigma_w.toFixed(1)} MPa`}
                                    color={results.enCheck.U <= 1.0 ? 'var(--cyan)' : 'var(--bad)'}
                                />
                                <ReadoutBox
                                    label={t12(language, 'Safety Factor (n)', 'Emniyet Katsayısı (n)')}
                                    value={formatEngineeringValue(results.safetyFactor, precision, true)}
                                    sub={`τ_avg = ${formatEngineeringValue(results.stress, precision, true)} MPa`}
                                    color={results.safetyFactor >= 1.5 ? 'var(--ok)' : 'var(--warn)'}
                                />
                                <ReadoutBox
                                    label={t12(language, 'Throat Thickness (a)', 'Boğaz Kalınlığı (a)')}
                                    value={`${results.a_throat.toFixed(2)} mm`}
                                    sub={`Aw = ${results.throatArea.toFixed(0)} mm²`}
                                    color="var(--ink)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Heat Input (Q)', 'Isı Girdisi (Q)')}
                                    value={`${results.heatInput.toFixed(2)} kJ/mm`}
                                    sub={results.heatStatus.status.toUpperCase()}
                                    color={results.heatStatus.color}
                                />
                                <ReadoutBox
                                    label={t12(language, 'Min Leg (AWS D1.1)', 'Min. Kenar (AWS D1.1)')}
                                    value={`${results.minWeldSize} mm`}
                                    sub={`Filler: ${results.fillerWeightG.toFixed(0)} g`}
                                    color={results.weldSizeOk ? 'var(--ok)' : 'var(--bad)'}
                                />
                            </div>

                            {/* Directional Stress Vector Breakdown Strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                                <div className="px-2.5 py-1.5 rounded-[2px] bg-[var(--bg-0)] border border-[var(--line)] flex justify-between">
                                    <span className="text-[var(--alu-dim)]">σ⊥ (Normal):</span>
                                    <span className="font-bold text-[var(--ink)]">{results.throatStresses.sigma_perp.toFixed(1)} MPa</span>
                                </div>
                                <div className="px-2.5 py-1.5 rounded-[2px] bg-[var(--bg-0)] border border-[var(--line)] flex justify-between">
                                    <span className="text-[var(--alu-dim)]">τ⊥ (Trans. Shear):</span>
                                    <span className="font-bold text-[var(--ink)]">{results.throatStresses.tau_perp.toFixed(1)} MPa</span>
                                </div>
                                <div className="px-2.5 py-1.5 rounded-[2px] bg-[var(--bg-0)] border border-[var(--line)] flex justify-between">
                                    <span className="text-[var(--alu-dim)]">τ∥ (Long. Shear):</span>
                                    <span className="font-bold text-[var(--ink)]">{results.throatStresses.tau_par.toFixed(1)} MPa</span>
                                </div>
                                <div className="px-2.5 py-1.5 rounded-[2px] bg-[var(--bg-0)] border border-[var(--line)] flex justify-between">
                                    <span className="text-[var(--alu-dim)]">fw,Rd Limit:</span>
                                    <span className="font-bold text-[var(--cyan)]">{results.enCheck.fw.toFixed(1)} MPa</span>
                                </div>
                            </div>
                        </div>

                        {/* 2D Blueprint & Live Spark Simulation */}
                        <div className="flex-1 min-h-[360px]">
                            <WeldingVisualization2D
                                jointType={
                                    jointType === 'doubleFillet'
                                        ? 'fillet'
                                        : jointType === 'vGroove'
                                        ? 'vgroove'
                                        : (jointType as any)
                                }
                                legSize={legSize}
                                thickness={thickness}
                                grooveAngle={grooveAngle}
                                length={length}
                                material1={{
                                    color: material1Color,
                                    name: language === 'tr' ? activeBaseMetal.nameTr : activeBaseMetal.name,
                                    shape: material1Profile,
                                    dimensions: defaultDims,
                                }}
                                material2={{
                                    color: material2Color,
                                    name: selectedElectrode.code,
                                    shape: material2Profile,
                                    dimensions: defaultDims,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB 2: OMNI-STYLE JOINT STRENGTH & BIDIRECTIONAL REVERSE SOLVER ═══ */}
            {activeTab === 'omni_joint_solver' && (
                <div className="max-w-[1680px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* LEFT 5 COLUMNS: OMNI JOINT CONFIGURATION & BIDIRECTIONAL INPUTS */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3.5">
                            <div className="border-b border-[var(--line)] pb-2">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)]">
                                    {t12(
                                        language,
                                        'Bidirectional Weld Joint Strength & Sizing Calculator',
                                        'Çift Yönlü Kaynak Bağlantı Mukavemeti & Boyutlandırma'
                                    )}
                                </span>
                                <p className="text-[11px] text-[var(--alu-dim)] mt-0.5">
                                    {t12(
                                        language,
                                        'Calculate maximum permissible weld load P, or reverse-solve for required weld length l or fillet leg size s.',
                                        'Maksimum emniyetli kaynak kuvvetini (P) hesaplayın veya hedef kuvvete göre gereken kaynak boyunu (l) / dikiş kalınlığını (s) bulun.'
                                    )}
                                </p>
                            </div>

                            {/* 3-Way Solve Target Selector */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] mb-1.5">
                                    {t12(language, 'What do you want to solve for?', 'Neyi Hesaplamak İstiyorsunuz?')}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                    {[
                                        {
                                            id: 'solve_load' as OmniWeldSolveTarget,
                                            labelEn: '⚡ Max Weld Load (P)',
                                            labelTr: '⚡ Maks. Yük Kapasitesi (P)',
                                        },
                                        {
                                            id: 'solve_length' as OmniWeldSolveTarget,
                                            labelEn: '📏 Required Length (l)',
                                            labelTr: '📏 Gereken Kaynak Boyu (l)',
                                        },
                                        {
                                            id: 'solve_size' as OmniWeldSolveTarget,
                                            labelEn: '📐 Required Weld Size (s)',
                                            labelTr: '📐 Gereken Dikiş Kenarı (s)',
                                        },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setOmniSolveTarget(mode.id)}
                                            className={`px-2.5 py-2 rounded-[var(--radius-s)] font-mono text-[11px] font-bold border text-center transition-colors cursor-pointer ${
                                                omniSolveTarget === mode.id
                                                    ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-[var(--cyan)]'
                                                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)] hover:text-[var(--ink)]'
                                            }`}
                                        >
                                            {language === 'tr' ? mode.labelTr : mode.labelEn}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 7 Joint Configuration Cards */}
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] mb-1.5">
                                    {t12(language, 'Select Weld Joint Alignment', 'Kaynak Birleşim Tipini Seçin')}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {[
                                        {
                                            id: 'single_transverse' as OmniWeldJointConfig,
                                            titleEn: 'Single Transverse Fillet',
                                            titleTr: 'Tek Sıra Enine Köşe Kaynağı',
                                            eq: 'P = 0.707 · s · l · σt',
                                        },
                                        {
                                            id: 'double_transverse' as OmniWeldJointConfig,
                                            titleEn: 'Double Transverse Fillet',
                                            titleTr: 'Çift Sıra Enine Köşe Kaynağı',
                                            eq: 'P = 2 × 0.707 · s · l · σt',
                                        },
                                        {
                                            id: 'parallel_lap' as OmniWeldJointConfig,
                                            titleEn: 'Double Parallel Lap Weld',
                                            titleTr: 'Çift Paralel Bindirme Kaynağı',
                                            eq: 'P = 2 × 0.707 · s · l · τ',
                                        },
                                        {
                                            id: 'combined_u_weld' as OmniWeldJointConfig,
                                            titleEn: 'Combined U-Weld (Trans + Par)',
                                            titleTr: 'Kombine U-Kaynak (1 Enine + 2 Paralel)',
                                            eq: 'P = 0.707·s·(σt·l1 + 2·τ·l2)',
                                        },
                                        {
                                            id: 'single_butt' as OmniWeldJointConfig,
                                            titleEn: 'Single Butt Joint Weld',
                                            titleTr: 'Tek Taraflı Alın Kaynağı (Butt)',
                                            eq: 'P = t · l · σt',
                                        },
                                        {
                                            id: 'double_butt' as OmniWeldJointConfig,
                                            titleEn: 'Double-Sided Butt Weld',
                                            titleTr: 'Çift Taraflı Alın Kaynağı (t1 + t2)',
                                            eq: 'P = (t1 + t2) · l · σt',
                                        },
                                        {
                                            id: 'circular_shaft_fillet' as OmniWeldJointConfig,
                                            titleEn: 'Circular Shaft / Pipe Fillet',
                                            titleTr: 'Dairesel Mil / Boru Çevre Kaynağı',
                                            eq: 'P = 0.707 · s · (π·d) · τ',
                                        },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setOmniConfig(item.id)}
                                            className={`p-2.5 rounded-[var(--radius-s)] border text-left transition-colors cursor-pointer ${
                                                omniConfig === item.id
                                                    ? 'bg-[var(--bg-2)] border-[var(--cyan)] text-[var(--ink)]'
                                                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)] hover:border-[var(--line-strong)]'
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{language === 'tr' ? item.titleTr : item.titleEn}</div>
                                            <div className="text-[10px] font-mono text-[var(--cyan)] mt-0.5">{item.eq}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Dimension & Stress Inputs */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <FieldNumber
                                    label={
                                        omniConfig === 'single_butt' || omniConfig === 'double_butt'
                                            ? t12(language, 'Throat Thickness t1', '1. Boğaz Kalınlığı t1')
                                            : t12(language, 'Size of Weld (s)', 'Kaynak Dikiş Boyutu (s)')
                                    }
                                    unit="mm"
                                    value={omniWeldSize}
                                    min={1}
                                    max={60}
                                    step={0.5}
                                    onChange={setOmniWeldSize}
                                />

                                {omniConfig === 'double_butt' && (
                                    <FieldNumber
                                        label={t12(language, 'Second Throat t2', '2. Boğaz Kalınlığı t2')}
                                        unit="mm"
                                        value={omniSecondThroat}
                                        min={1}
                                        max={60}
                                        step={0.5}
                                        onChange={setOmniSecondThroat}
                                    />
                                )}

                                {omniConfig === 'circular_shaft_fillet' ? (
                                    <FieldNumber
                                        label={t12(language, 'Shaft / Pipe Diameter (d)', 'Mil / Boru Çapı (d)')}
                                        unit="mm"
                                        value={omniShaftDia}
                                        min={5}
                                        max={1000}
                                        step={1}
                                        onChange={setOmniShaftDia}
                                    />
                                ) : (
                                    <FieldNumber
                                        label={
                                            omniConfig === 'combined_u_weld'
                                                ? t12(language, 'Transverse Length (l1)', 'Enine Kaynak Boyu (l1)')
                                                : t12(language, 'Length of Weld (l)', 'Kaynak Dikiş Boyu (l)')
                                        }
                                        unit="mm"
                                        value={omniLength1}
                                        min={5}
                                        max={5000}
                                        step={5}
                                        onChange={setOmniLength1}
                                    />
                                )}

                                {omniConfig === 'combined_u_weld' && (
                                    <FieldNumber
                                        label={t12(language, 'Parallel Weld Length (l2)', 'Paralel Kol Boyu (l2)')}
                                        unit="mm"
                                        value={omniLength2}
                                        min={5}
                                        max={5000}
                                        step={5}
                                        onChange={setOmniLength2}
                                    />
                                )}

                                <FieldNumber
                                    label={t12(language, 'Max Permissible Tensile (σt)', 'Emniyetli Çekme Gerilmesi (σt)')}
                                    unit="MPa"
                                    value={omniSigmaT}
                                    min={10}
                                    max={600}
                                    step={5}
                                    onChange={setOmniSigmaT}
                                />

                                <FieldNumber
                                    label={t12(language, 'Max Permissible Shear (τ)', 'Emniyetli Kayma Gerilmesi (τ)')}
                                    unit="MPa"
                                    value={omniTau}
                                    min={10}
                                    max={500}
                                    step={5}
                                    onChange={setOmniTau}
                                />

                                {omniSolveTarget !== 'solve_load' && (
                                    <div className="col-span-2">
                                        <FieldNumber
                                            label={t12(language, 'Target Applied Force (P_target)', 'Hedef Uygulanan Kuvvet (P_hedef)')}
                                            unit="kN"
                                            value={omniTargetForceKN}
                                            min={0.5}
                                            max={5000}
                                            step={0.5}
                                            onChange={setOmniTargetForceKN}
                                        />
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-xs font-mono text-[var(--alu)] cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={omniIncludeCrater}
                                    onChange={(e) => setOmniIncludeCrater(e.target.checked)}
                                    className="accent-[var(--cyan)]"
                                />
                                <span>
                                    {t12(
                                        language,
                                        'Add +12.5 mm start/stop weld crater allowance (L_total = l + 12.5 mm)',
                                        'Başlangıç/bitiş krater payı olarak +12.5 mm ekle (L_toplam = l + 12.5 mm)'
                                    )}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* RIGHT 7 COLUMNS: OMNI RESULTS, STEP-BY-STEP SUBSTITUTION & JOINT DIAGRAM */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="p-5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--cyan)] font-bold">
                                        {t12(language, 'DETERMINISTIC WELD STRENGTH OUTPUT', 'DETERMİNİSTİK KAYNAK MUKAVEMET ÇIKTISI')}
                                    </span>
                                    <h3 className="text-lg font-bold font-tech text-[var(--ink)]">
                                        {omniSolveTarget === 'solve_load'
                                            ? t12(language, `Maximum Weld Joint Strength: ${omniResult.maxForceKN.toFixed(2)} kN`, `Maksimum Kaynak Dikiş Dayanımı: ${omniResult.maxForceKN.toFixed(2)} kN`)
                                            : omniSolveTarget === 'solve_length'
                                            ? t12(language, `Required Weld Length: ${omniResult.requiredLengthMm.toFixed(1)} mm`, `Gereken Minimum Kaynak Boyu: ${omniResult.requiredLengthMm.toFixed(1)} mm`)
                                            : t12(language, `Required Weld Leg Size: ${omniResult.requiredWeldSizeMm.toFixed(2)} mm`, `Gereken Minimum Kaynak Kalınlığı: ${omniResult.requiredWeldSizeMm.toFixed(2)} mm`)}
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-[2px] bg-[var(--ok)]/15 border border-[var(--ok)]/40 font-mono text-xs font-bold text-[var(--ok)]">
                                    {(omniResult.maxForceLbf / 1000).toFixed(2)} kip ({omniResult.maxForceN.toFixed(0)} N)
                                </span>
                            </div>

                            {/* Primary Result Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ReadoutBox
                                    label={t12(language, 'Max Weld Strength (P)', 'Maks. Kaynak Kuvveti (P)')}
                                    value={`${omniResult.maxForceKN.toFixed(2)} kN`}
                                    sub={`${omniResult.maxForceLbf.toFixed(0)} lbf`}
                                    color="var(--cyan)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Throat Thickness (t)', 'Boğaz Kalınlığı (t)')}
                                    value={`${omniResult.throatThicknessMm.toFixed(2)} mm`}
                                    sub={`Aw = ${omniResult.effectiveThroatAreaMm2.toFixed(1)} mm²`}
                                    color="var(--ink)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Req. Length for Target P', 'Hedef Yük İçin Boy (l_req)')}
                                    value={`${omniResult.requiredLengthMm.toFixed(1)} mm`}
                                    sub={
                                        omniIncludeCrater
                                            ? `With crater: ${omniResult.requiredLengthWithCraterMm.toFixed(1)} mm`
                                            : 'Net effective length'
                                    }
                                    color="var(--ok)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Req. Leg Size for Target P', 'Hedef Yük İçin Kenar (s_req)')}
                                    value={`${omniResult.requiredWeldSizeMm.toFixed(2)} mm`}
                                    sub={`Total Seam L = ${omniResult.totalSeamLengthWithCraterMm.toFixed(1)} mm`}
                                    color="var(--warn)"
                                />
                            </div>

                            {/* Step-by-Step Substituted Formula Box */}
                            <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono space-y-1.5">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--alu-dim)] font-bold">
                                    {t12(language, 'Step-by-Step Formula Substitution', 'Adım Adım Formül ve Değer Yerleştirme')}
                                </div>
                                <div className="text-xs text-[var(--cyan)] font-bold">{omniResult.substitutedStep}</div>
                                {omniConfig === 'combined_u_weld' && (
                                    <div className="text-[11px] text-[var(--alu)]">
                                        {t12(
                                            language,
                                            `Transverse Contribution P_1 = ${omniResult.transverseForceKN.toFixed(2)} kN  |  Parallel Contribution P_2 = ${omniResult.parallelForceKN.toFixed(2)} kN`,
                                            `Enine Dikiş Katkısı P_1 = ${omniResult.transverseForceKN.toFixed(2)} kN  |  Paralel Kollar Katkısı P_2 = ${omniResult.parallelForceKN.toFixed(2)} kN`
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Interactive Joint Schematic SVG */}
                            <div className="p-4 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] flex flex-col items-center">
                                <svg viewBox="0 0 560 210" className="w-full max-w-[540px] h-auto">
                                    <rect x="0" y="0" width="560" height="210" fill="#07090c" rx="4" />
                                    {/* Base Plate */}
                                    <rect x="70" y="45" width="240" height="120" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                                    {/* Overlapping / Mating Plate */}
                                    <rect x="210" y="65" width="230" height="80" fill="#334155" stroke="#94a3b8" strokeWidth="2" />

                                    {/* Highlighted Weld Lines depending on omniConfig */}
                                    {(omniConfig === 'single_transverse' ||
                                        omniConfig === 'double_transverse' ||
                                        omniConfig === 'combined_u_weld' ||
                                        omniConfig === 'single_butt' ||
                                        omniConfig === 'double_butt') && (
                                        <rect x="206" y="65" width="8" height="80" fill="#f59e0b" />
                                    )}
                                    {omniConfig === 'double_transverse' && (
                                        <rect x="306" y="65" width="8" height="80" fill="#f59e0b" />
                                    )}
                                    {(omniConfig === 'parallel_lap' || omniConfig === 'combined_u_weld') && (
                                        <>
                                            <rect x="210" y="61" width="100" height="7" fill="#00e5ff" />
                                            <rect x="210" y="142" width="100" height="7" fill="#00e5ff" />
                                        </>
                                    )}
                                    {omniConfig === 'circular_shaft_fillet' && (
                                        <circle cx="260" cy="105" r="36" fill="#0f172a" stroke="#f59e0b" strokeWidth="7" />
                                    )}

                                    {/* Force Arrows */}
                                    <line x1="20" y1="105" x2="65" y2="105" stroke="#ef4444" strokeWidth="3" />
                                    <polygon points="20,105 32,99 32,111" fill="#ef4444" />
                                    <text x="42" y="92" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                        P={omniResult.maxForceKN.toFixed(1)}kN
                                    </text>

                                    <line x1="445" y1="105" x2="535" y2="105" stroke="#ef4444" strokeWidth="3" />
                                    <polygon points="535,105 523,99 523,111" fill="#ef4444" />
                                    <text x="490" y="92" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                        P={omniResult.maxForceKN.toFixed(1)}kN
                                    </text>

                                    {/* Dimension Callouts */}
                                    <text x="260" y="30" fill="#00e5ff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                        s = {omniWeldSize} mm (Throat a = {omniResult.throatThicknessMm.toFixed(2)} mm) · l = {omniLength1} mm
                                    </text>
                                    <text x="280" y="192" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                                        σt = {omniSigmaT} MPa · τ = {omniTau} MPa · Total Seam L = {omniResult.totalSeamLengthWithCraterMm.toFixed(1)} mm
                                    </text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB 3: CARBON EQUIVALENT (CEV) & PREHEAT CALCULATOR ═══ */}
            {activeTab === 'carbon_equivalent' && (
                <div className="max-w-[1680px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] block border-b border-[var(--line)] pb-2">
                                {t12(
                                    language,
                                    'Alloy Chemical Composition (% by Weight)',
                                    'Çelik Kimyasal Kompozisyonu (% Ağırlıkça)'
                                )}
                            </span>

                            {/* Quick Steel Grade Presets */}
                            <div className="flex flex-wrap gap-1.5">
                                {CEV_STEEL_PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => applyCevPreset(p.id)}
                                        className={`px-2.5 py-1 rounded-[2px] font-mono text-[10.5px] font-bold border cursor-pointer transition-colors ${
                                            cevPresetId === p.id
                                                ? 'bg-[var(--cyan)] text-[var(--bg-0)] border-[var(--cyan)]'
                                                : 'bg-[var(--bg-0)] text-[var(--alu)] border-[var(--line)] hover:text-[var(--ink)]'
                                        }`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                                <FieldNumber label="Carbon (C)" unit="%" value={cevC} min={0} max={2.0} step={0.01} onChange={setCevC} />
                                <FieldNumber label="Manganese (Mn)" unit="%" value={cevMn} min={0} max={5.0} step={0.05} onChange={setCevMn} />
                                <FieldNumber label="Silicon (Si)" unit="%" value={cevSi} min={0} max={3.0} step={0.05} onChange={setCevSi} />
                                <FieldNumber label="Chromium (Cr)" unit="%" value={cevCr} min={0} max={20.0} step={0.05} onChange={setCevCr} />
                                <FieldNumber label="Molybdenum (Mo)" unit="%" value={cevMo} min={0} max={5.0} step={0.02} onChange={setCevMo} />
                                <FieldNumber label="Vanadium (V)" unit="%" value={cevV} min={0} max={2.0} step={0.01} onChange={setCevV} />
                                <FieldNumber label="Copper (Cu)" unit="%" value={cevCu} min={0} max={3.0} step={0.02} onChange={setCevCu} />
                                <FieldNumber label="Nickel (Ni)" unit="%" value={cevNi} min={0} max={15.0} step={0.05} onChange={setCevNi} />
                                <FieldNumber label="Boron (B)" unit="%" value={cevB} min={0} max={0.02} step={0.0005} onChange={setCevB} />
                            </div>

                            <FieldNumber
                                label={t12(language, 'Combined Plate Thickness (t)', 'Kaynatılan Plaka Kalınlığı (t)')}
                                unit="mm"
                                value={cevThickness}
                                min={2}
                                max={150}
                                step={1}
                                onChange={setCevThickness}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div className="p-5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--cyan)] font-bold">
                                        EN 1011-2 · IIW · AWS D1.1 · ITO-BESSYO Pcm
                                    </span>
                                    <h3 className="text-lg font-bold font-tech text-[var(--ink)]">
                                        {language === 'tr' ? cevResult.weldabilityRatingTr : cevResult.weldabilityRating}
                                    </h3>
                                </div>
                                <span
                                    className="px-3 py-1 rounded-[2px] font-mono text-xs font-bold"
                                    style={{
                                        backgroundColor: `${cevResult.color}20`,
                                        color: cevResult.color,
                                        border: `1px solid ${cevResult.color}66`,
                                    }}
                                >
                                    {t12(
                                        language,
                                        `Preheat: ${cevResult.recommendedPreheatC}°C (${cevResult.recommendedPreheatF}°F)`,
                                        `Önerilen Ön Tav: ${cevResult.recommendedPreheatC}°C (${cevResult.recommendedPreheatF}°F)`
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ReadoutBox
                                    label="CE (IIW Standard)"
                                    value={cevResult.ceIIW.toFixed(3)}
                                    sub="C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15"
                                    color={cevResult.color}
                                />
                                <ReadoutBox
                                    label="CE (AWS D1.1)"
                                    value={cevResult.ceAWS.toFixed(3)}
                                    sub="Includes Silicon (Mn+Si)/6"
                                    color="var(--cyan)"
                                />
                                <ReadoutBox
                                    label="CE (JWES / WES 3001)"
                                    value={cevResult.ceJWES.toFixed(3)}
                                    sub="C + Si/24 + Mn/6 + Ni/40 + Cr/5..."
                                    color="var(--ink)"
                                />
                                <ReadoutBox
                                    label="Pcm (Critical Metal)"
                                    value={cevResult.pcm.toFixed(3)}
                                    sub="Low-Carbon High-Strength Steels"
                                    color="var(--ok)"
                                />
                            </div>

                            <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-xs text-[var(--alu)] leading-relaxed font-mono">
                                {language === 'tr' ? cevResult.notesTr : cevResult.notesEn}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB 4: WELDING COST, SHIELDING GAS & FILLER WIRE ESTIMATOR ═══ */}
            {activeTab === 'cost_gas' && (
                <div className="max-w-[1680px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] block border-b border-[var(--line)] pb-2">
                                {t12(language, 'Consumables, Gas Flow & Shop Rates', 'Sarf Malzeme, Gaz Debisi & Atölye Saat Ücreti')}
                            </span>

                            <div className="grid grid-cols-2 gap-2.5">
                                <FieldNumber
                                    label={t12(language, 'Shielding Gas Flow', 'Koruyucu Gaz Debisi')}
                                    unit="L/min"
                                    value={gasFlowLMin}
                                    min={0}
                                    max={40}
                                    step={1}
                                    onChange={setGasFlowLMin}
                                />
                                <FieldNumber
                                    label={t12(language, 'Wire / Electrode Price', 'Tel / Elektrot Birim Fiyatı')}
                                    unit="$/kg"
                                    value={wirePricePerKg}
                                    min={0.5}
                                    max={100}
                                    step={0.5}
                                    onChange={setWirePricePerKg}
                                />
                                <FieldNumber
                                    label={t12(language, 'Shielding Gas Price', 'Koruyucu Gaz Fiyatı')}
                                    unit="$/Liter"
                                    value={gasPricePerL}
                                    min={0.001}
                                    max={1}
                                    step={0.005}
                                    onChange={setGasPricePerL}
                                />
                                <FieldNumber
                                    label={t12(language, 'Welder Labor Rate', 'Kaynakçı Saat Ücreti')}
                                    unit="$/hr"
                                    value={laborRatePerHour}
                                    min={5}
                                    max={250}
                                    step={5}
                                    onChange={setLaborRatePerHour}
                                />
                                <div className="col-span-2">
                                    <FieldNumber
                                        label={t12(language, 'Operator Arc-On Factor (Duty Cycle)', 'Operatör Arkta Kalma Faktörü (0.20–0.80)')}
                                        unit="ratio"
                                        value={dutyCycle}
                                        min={0.15}
                                        max={0.9}
                                        step={0.05}
                                        onChange={setDutyCycle}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div className="p-5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-4">
                            <div className="border-b border-[var(--line)] pb-3 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ok)] font-bold">
                                        {t12(language, 'FABRICATION CONSUMPTION & SHOULD-COST', 'KAYNAK SARFİYAT VE MALİYET DÖKÜMÜ')}
                                    </span>
                                    <h3 className="text-lg font-bold font-tech text-[var(--ink)]">
                                        {t12(language, `Total Estimated Weld Cost: $${costResult.totalCost.toFixed(2)}`, `Toplam Tahmini Kaynak Maliyeti: $${costResult.totalCost.toFixed(2)}`)}
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-[2px] bg-[var(--bg-0)] border border-[var(--line)] font-mono text-xs text-[var(--cyan)]">
                                    ρ = {activeBaseMetal.densityGcm3} g/cm³ · η = {(WELDING_METHODS[process].efficiency * 100).toFixed(0)}%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ReadoutBox
                                    label={t12(language, 'Required Wire / Rod', 'Gereken Tel / Elektrot')}
                                    value={`${(costResult.requiredFillerMassKg * 1000).toFixed(0)} g`}
                                    sub={`Deposited: ${(costResult.depositedMassKg * 1000).toFixed(0)} g`}
                                    color="var(--cyan)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Shielding Gas Volume', 'Koruyucu Gaz Tüketimi')}
                                    value={`${costResult.shieldingGasLiters.toFixed(1)} L`}
                                    sub={`@ ${gasFlowLMin} L/min`}
                                    color="var(--ok)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Total Job Time', 'Toplam İşçilik Süresi')}
                                    value={`${costResult.totalJobTimeMin.toFixed(1)} min`}
                                    sub={`Arc-on: ${costResult.arcOnTimeMin.toFixed(1)} min`}
                                    color="var(--warn)"
                                />
                                <ReadoutBox
                                    label={t12(language, 'Arc Electrical Energy', 'Ark Elektrik Enerjisi')}
                                    value={`${costResult.electricalEnergyKWh.toFixed(2)} kWh`}
                                    sub={`Area: ${costResult.crossSectionMm2.toFixed(1)} mm²`}
                                    color="var(--ink)"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-1 font-mono text-xs">
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                                    <div className="text-[10px] text-[var(--alu-dim)] uppercase">Filler Wire Cost</div>
                                    <div className="text-base font-bold text-[var(--ink)] mt-0.5">${costResult.fillerCost.toFixed(2)}</div>
                                </div>
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                                    <div className="text-[10px] text-[var(--alu-dim)] uppercase">Shielding Gas Cost</div>
                                    <div className="text-base font-bold text-[var(--ink)] mt-0.5">${costResult.gasCost.toFixed(2)}</div>
                                </div>
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                                    <div className="text-[10px] text-[var(--alu-dim)] uppercase">Labor Cost</div>
                                    <div className="text-base font-bold text-[var(--cyan)] mt-0.5">${costResult.laborCost.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══ INSTRUMENT SUB-COMPONENTS ═══
function ReadoutBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] flex flex-col justify-between">
            <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--alu-dim)] truncate">{label}</span>
            <span className="text-base sm:text-lg font-mono font-bold mt-1 truncate" style={{ color }}>
                {value}
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)] mt-0.5 truncate">{sub}</span>
        </div>
    );
}

function FieldNumber({
    label,
    unit,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    unit: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] mb-1 truncate">
                {label}
            </label>
            <div className="flex items-center rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line-strong)] focus-within:border-[var(--cyan)] overflow-hidden">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step ?? 'any'}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--ink)] outline-none"
                />
                <span className="px-2 py-1.5 text-[10px] font-mono font-bold text-[var(--cyan)] bg-[var(--bg-2)] border-l border-[var(--line)]">
                    {unit}
                </span>
            </div>
        </div>
    );
}

function FieldSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)] mb-1 truncate">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line-strong)] focus:border-[var(--cyan)] px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--ink)] outline-none cursor-pointer"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--bg-1)] text-[var(--ink)]">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default WeldingModule;

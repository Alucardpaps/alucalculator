'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    calculateHelicalSpring,
    SPRING_MATERIALS,
    SPRING_PRESETS,
    SpringInputs,
    SpringEndType,
    SpringToleranceGrade,
    SpringWindingDirection,
    SpringKind,
    SpringHookType,
} from '@/data/mechanical/springStandards';
import { SpringBlueprint } from '@/components/visualizers/SpringBlueprint';
import { useI18nStore } from '@/store/i18nStore';
import { getSpringModuleStrings, SpringModuleStrings } from '@/locales/springModuleTranslations';
import { t12 } from '@/locales/t12';
import {
    Activity,
    CheckCircle2,
    Copy,
    Disc,
    Gauge,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Zap,
    Flame,
    Sparkles,
    Layers,
    Compass,
    Anchor,
    ArrowDownUp
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export default function AdvancedSpringModule() {
  const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const t = getSpringModuleStrings(language);

    // Spring Kind Mode: 'compression' | 'extension'
    const [springKind, setSpringKind] = useState<SpringKind>('compression');
    const [hookType, setHookType] = useState<SpringHookType>('german');
    const [initialTensionForce, setInitialTensionForce] = useState<string>('');

    // Geometry & Dimensions State
    const [wireDiameter, setWireDiameter] = useState<number>(4.5); // d in mm
    const [meanDiameter, setMeanDiameter] = useState<number>(32.0); // Dm in mm
    const [freeLength, setFreeLength] = useState<number>(75.0); // L0 in mm
    const [activeCoils, setActiveCoils] = useState<number>(7.5); // n
    const [endType, setEndType] = useState<SpringEndType>('squared_ground');
    const [appliedForce1, setAppliedForce1] = useState<number>(120); // F1 in N
    const [appliedForce2, setAppliedForce2] = useState<number>(480); // F2 in N
    const [materialId, setMaterialId] = useState<string>('en10270-1-sh');
    const [customG, setCustomG] = useState<number>(80000);
    const [customRm, setCustomRm] = useState<number>(1700);

    // Advanced Industrial Extensions (DIN EN 13906-1/2 / DIN EN 15800)
    const [toleranceGrade, setToleranceGrade] = useState<SpringToleranceGrade>(2);
    const [operatingTemp, setOperatingTemp] = useState<number>(20); // °C
    const [isShotPeened, setIsShotPeened] = useState<boolean>(false);
    const [windingDirection, setWindingDirection] = useState<SpringWindingDirection>('right');
    const [housingDiameter, setHousingDiameter] = useState<string>(''); // Dh in mm (optional)
    const [mandrelDiameter, setMandrelDiameter] = useState<string>(''); // Dd in mm (optional)

    // Toast feedback state
    const [copied, setCopied] = useState(false);

    // Calculation Engine Call
    const inputs: SpringInputs = useMemo(() => ({
        springKind,
        wireDiameter,
        meanDiameter,
        freeLength,
        activeCoils,
        endType,
        hookType,
        appliedForce1,
        appliedForce2,
        initialTensionForce: initialTensionForce !== '' ? parseFloat(initialTensionForce) : undefined,
        materialId,
        customShearModulus: customG,
        customTensileStrength: customRm,
        toleranceGrade,
        operatingTemp,
        isShotPeened,
        windingDirection,
        housingDiameter: housingDiameter ? parseFloat(housingDiameter) : undefined,
        mandrelDiameter: mandrelDiameter ? parseFloat(mandrelDiameter) : undefined,
    }), [
        springKind,
        wireDiameter,
        meanDiameter,
        freeLength,
        activeCoils,
        endType,
        hookType,
        appliedForce1,
        appliedForce2,
        initialTensionForce,
        materialId,
        customG,
        customRm,
        toleranceGrade,
        operatingTemp,
        isShotPeened,
        windingDirection,
        housingDiameter,
        mandrelDiameter
    ]);

    const spring = useMemo(() => calculateHelicalSpring(inputs), [inputs]);
    const isExtension = springKind === 'extension';

    // Handle interactive drag force update from visualizer
    const handleForceChange = useCallback((newForce: number) => {
        setAppliedForce2(Math.max(appliedForce1, newForce));
    }, [appliedForce1]);

    // Apply industrial preset
    const handleApplyPreset = (presetId: string) => {
        const p = SPRING_PRESETS.find(x => x.id === presetId);
        if (!p) return;
        if (p.inputs.springKind) {
            setSpringKind(p.inputs.springKind);
        } else {
            setSpringKind('compression');
        }
        setWireDiameter(p.inputs.wireDiameter);
        setMeanDiameter(p.inputs.meanDiameter);
        setFreeLength(p.inputs.freeLength);
        setActiveCoils(p.inputs.activeCoils);
        setEndType(p.inputs.endType);
        if (p.inputs.hookType) setHookType(p.inputs.hookType);
        setAppliedForce1(p.inputs.appliedForce1);
        setAppliedForce2(p.inputs.appliedForce2);
        setMaterialId(p.inputs.materialId);
        if (p.inputs.toleranceGrade) setToleranceGrade(p.inputs.toleranceGrade);
        if (p.inputs.operatingTemp !== undefined) setOperatingTemp(p.inputs.operatingTemp);
        if (p.inputs.isShotPeened !== undefined) setIsShotPeened(p.inputs.isShotPeened);
        if (p.inputs.windingDirection) setWindingDirection(p.inputs.windingDirection);
        setHousingDiameter(p.inputs.housingDiameter ? String(p.inputs.housingDiameter) : '');
        setMandrelDiameter(p.inputs.mandrelDiameter ? String(p.inputs.mandrelDiameter) : '');
        setInitialTensionForce('');
    };

    // Mode switch handler
    const handleSwitchKind = (kind: SpringKind) => {
        if (kind === springKind) return;
        setSpringKind(kind);
        if (kind === 'extension') {
            setEndType('plain_open');
            const defaultExt = SPRING_PRESETS.find(p => p.inputs.springKind === 'extension');
            if (defaultExt) {
                handleApplyPreset(defaultExt.id);
            }
        } else {
            setEndType('squared_ground');
            const defaultComp = SPRING_PRESETS.find(p => !p.inputs.springKind || p.inputs.springKind === 'compression');
            if (defaultComp) {
                handleApplyPreset(defaultComp.id);
            }
        }
    };

    // Deep-linking support (?kind=extension, ?kind=compression, ?preset=tension_precision, ?lang=tr)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const langParam = params.get('lang');
        const validLanguages = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
        if (langParam && validLanguages.includes(langParam)) {
            useI18nStore.getState().setLanguage(langParam as any);
        }
        const kindParam = params.get('kind') || params.get('mode') || params.get('type');
        const presetParam = params.get('preset');
        if (presetParam) {
            handleApplyPreset(presetParam);
        } else if (kindParam === 'extension' || kindParam === 'tension' || kindParam === 'cekme') {
            handleSwitchKind('extension');
        } else if (kindParam === 'compression' || kindParam === 'basi' || kindParam === 'basma') {
            handleSwitchKind('compression');
        }
    }, []);

    // Filter presets for current mode
    const filteredPresets = useMemo(() => {
        return SPRING_PRESETS.filter(p => {
            const isExt = p.inputs.springKind === 'extension';
            return springKind === 'extension' ? isExt : !isExt;
        });
    }, [springKind]);

    // Localized preset display name
    const getPresetLabel = (p: typeof SPRING_PRESETS[0]) => {
        const keyMap: Record<string, keyof SpringModuleStrings> = {
            precision_return: 'presetPrecision',
            engine_valve: 'presetValve',
            die_heavy: 'presetDie',
            stainless_marine: 'presetStainless',
            tension_precision: 'presetTensionPrecision',
            tension_return: 'presetTensionReturn',
            tension_heavy: 'presetTensionHeavy',
        };
        const trKey = keyMap[p.id];
        if (trKey && t[trKey]) {
            return t[trKey] as string;
        }
        return t12(language, p.nameEn, p.nameTr);
    };

    // Copy formatted engineering ASCII summary
    const handleCopyReport = () => {
        const text = isExtension ? [
            `============================================================`,
            `AluCalc | DIN EN 13906-2 / DIN 2089-2 / DIN 2097 EXTENSION SPRING REPORT`,
            `============================================================`,
            `GEOMETRY & DIMENSIONS:`,
            `  Wire Diameter d             = ${formatEngineeringValue(spring.d, precision, false)} mm`,
            `  Mean Diameter Dm            = ${formatEngineeringValue(spring.Dm, precision, false)} mm (Outer De = ${formatEngineeringValue(spring.De, precision, false)}, Inner Di = ${formatEngineeringValue(spring.Di, precision, false)})`,
            `  Close-Coiled Body Length Lk = ${formatEngineeringValue(spring.Lk, precision, false)} mm (Active Coils n = ${spring.n})`,
            `  Hook Height LH              = ${formatEngineeringValue(spring.LH, precision, false)} mm (Hook Type: ${spring.hookType.toUpperCase()})`,
            `  Free Length L0              = ${formatEngineeringValue(spring.L0, precision, false)} mm (Tolerance: +/- ${formatEngineeringValue(spring.tol_L0, precision, false)} mm)`,
            `  Spring Index C              = ${formatEngineeringValue(spring.C, precision, false)} (Wahl kw = ${formatEngineeringValue(spring.kw, precision, false)}, Hook kb = ${formatEngineeringValue(spring.kb, precision, false)})`,
            `  Winding Direction           = ${spring.windingDirection === 'right' ? 'Right Hand (RH)' : 'Left Hand (LH)'}`,
            ``,
            `MATERIAL & THERMAL PROPERTIES:`,
            `  Material                    = ${SPRING_MATERIALS[materialId]?.nameEn || materialId}`,
            `  Operating Temp              = ${spring.operatingTemp} deg C (G_eff = ${Math.round(spring.G_effective)} MPa, Derating: ${formatEngineeringValue((spring.tempDeratingFactor * 100), precision, false)}%)`,
            `  Relaxation Risk             = ${spring.relaxationRisk.toUpperCase()}`,
            `  Shot Peening                = ${spring.isShotPeened ? 'YES (+25% fatigue strength)' : 'NO (Standard)'}`,
            `  Tensile Strength Rm         = ${formatEngineeringValue(spring.Rm, precision, false)} MPa`,
            `  Permissible Body Shear tau_zul  = ${formatEngineeringValue(spring.tauZul, precision, false)} MPa (0.45*Rm per DIN EN 13906-2)`,
            `  Permissible Hook Bending sig_zul = ${formatEngineeringValue(spring.sigma_b_zul, precision, false)} MPa (0.75*Rm)`,
            `  Spring Rate R               = ${formatEngineeringValue(spring.R, precision, false)} N/mm`,
            ``,
            `INITIAL TENSION & LOADING STAGES:`,
            `  Initial Tension F0          = ${formatEngineeringValue(spring.F0, precision, false)} N (Initial Shear tau0 = ${formatEngineeringValue(spring.tau0, precision, false)} MPa)`,
            `  Preload F1                  = ${appliedForce1} N (+/- ${formatEngineeringValue(spring.tol_F1, precision, false)} N) -> Stroke s1 = ${formatEngineeringValue(spring.s1, precision, false)} mm (tau1 = ${formatEngineeringValue(spring.tau1, precision, false)} MPa)`,
            `  Working Load F2             = ${appliedForce2} N (+/- ${formatEngineeringValue(spring.tol_F2, precision, false)} N) -> Stroke s2 = ${formatEngineeringValue(spring.s2, precision, false)} mm (Extended L2 = ${formatEngineeringValue(spring.L2, precision, false)} mm)`,
            `  Max Permissible Stroke s_zul= ${formatEngineeringValue(spring.s_zul, precision, false)} mm (F_zul = ${formatEngineeringValue(spring.F_zul, precision, false)} N)`,
            `  Body Shear Stress tau2      = ${formatEngineeringValue(spring.tau2, precision, false)} MPa [Body SF = ${formatEngineeringValue(spring.SF_static, precision, false)}x - ${spring.isSafeStatic ? 'PASS' : 'FAIL'}]`,
            `  Hook Bending Stress sig_b2  = ${formatEngineeringValue(spring.sigma_b2, precision, false)} MPa [Hook SF = ${formatEngineeringValue(spring.SF_hook, precision, false)}x - ${spring.isHookSafe ? 'PASS' : 'FAIL'}]`,
            `  Hook Torsional Stress tau_t2= ${formatEngineeringValue(spring.tau_t2, precision, false)} MPa`,
            ``,
            `DYNAMIC FATIGUE (GOODMAN / SMITH):`,
            `  Mean Stress tau_m           = ${formatEngineeringValue(spring.tau_m, precision, false)} MPa`,
            `  Stress Amplitude tau_a      = ${formatEngineeringValue(spring.tau_a, precision, false)} MPa`,
            `  Permissible Amplitude       = ${formatEngineeringValue(spring.tau_A_zul, precision, false)} MPa`,
            `  Dynamic Safety Sh           = ${formatEngineeringValue(spring.SF_dynamic, precision, false)} [${spring.isSafeDynamic ? 'PASS' : 'WARNING'}]`,
            `  Fatigue Life Verdict        = ${spring.fatigueLifeCategory === 'infinite' ? '> 10^7 Cycles (Infinite)' : spring.fatigueLifeCategory === 'finite' ? '10^5 - 10^7 Cycles (Finite)' : 'Danger of Fracture'}`,
            ``,
            `DIN EN 15800 TOLERANCES (Grade ${spring.toleranceGrade}):`,
            `  Diameter tol (De/Di)        = +/- ${formatEngineeringValue(spring.tol_De, precision, false)} mm`,
            `  Free length tol (L0)        = +/- ${formatEngineeringValue(spring.tol_L0, precision, false)} mm`,
            `  Preload tol (F1)            = +/- ${formatEngineeringValue(spring.tol_F1, precision, false)} N`,
            `  Working load tol (F2)       = +/- ${formatEngineeringValue(spring.tol_F2, precision, false)} N`,
            ``,
            `DYNAMICS & WIRE DETAILS:`,
            `  Resonance Freq fe           = ${formatEngineeringValue(spring.resonanceFreq, precision, false)} Hz`,
            `  Spring Mass                 = ${formatEngineeringValue(spring.springMass, precision, false)} g (Wire length: ${formatEngineeringValue(spring.wireLength, precision, false)} mm)`,
            `OVERALL VERDICT: ${spring.verdict}`,
            `============================================================`,
        ].join('\n') : [
            `============================================================`,
            `AluCalc | DIN EN 13906-1 / DIN 2089 COMPRESSION SPRING REPORT`,
            `============================================================`,
            `GEOMETRY & DIMENSIONS:`,
            `  Wire Diameter d        = ${formatEngineeringValue(spring.d, precision, false)} mm`,
            `  Mean Diameter Dm       = ${formatEngineeringValue(spring.Dm, precision, false)} mm (Outer De = ${formatEngineeringValue(spring.De, precision, false)}, Inner Di = ${formatEngineeringValue(spring.Di, precision, false)})`,
            `  Free Length L0         = ${formatEngineeringValue(spring.L0, precision, false)} mm (Tolerance: +/- ${formatEngineeringValue(spring.tol_L0, precision, false)} mm)`,
            `  Active Coils n         = ${spring.n} (Total nt = ${spring.nt})`,
            `  Spring Index C         = ${formatEngineeringValue(spring.C, precision, false)} (Wahl factor kw = ${formatEngineeringValue(spring.kw, precision, false)})`,
            `  Solid Height Lc        = ${formatEngineeringValue(spring.Lc, precision, false)} mm (Max Stroke sc = ${formatEngineeringValue(spring.sc, precision, false)} mm)`,
            `  Free Pitch p           = ${formatEngineeringValue(spring.p, precision, false)} mm | Pitch Angle alpha = ${formatEngineeringValue(spring.pitchAngleDeg, precision, false)} deg`,
            `  Winding Direction      = ${spring.windingDirection === 'right' ? 'Right Hand (RH)' : 'Left Hand (LH)'}`,
            ``,
            `MATERIAL & THERMAL PROPERTIES:`,
            `  Material               = ${SPRING_MATERIALS[materialId]?.nameEn || materialId}`,
            `  Operating Temp         = ${spring.operatingTemp} deg C (G_eff = ${Math.round(spring.G_effective)} MPa, Derating: ${formatEngineeringValue((spring.tempDeratingFactor * 100), precision, false)}%)`,
            `  Relaxation Risk        = ${spring.relaxationRisk.toUpperCase()}`,
            `  Shot Peening           = ${spring.isShotPeened ? 'YES (+25% fatigue strength)' : 'NO (Standard)'}`,
            `  Tensile Strength Rm    = ${formatEngineeringValue(spring.Rm, precision, false)} MPa | Permissible tau_zul = ${formatEngineeringValue(spring.tauZul, precision, false)} MPa`,
            `  Spring Rate R          = ${formatEngineeringValue(spring.R, precision, false)} N/mm`,
            ``,
            `LOAD STAGES & STATIC STRESS:`,
            `  Preload F1             = ${appliedForce1} N (+/- ${formatEngineeringValue(spring.tol_F1, precision, false)} N) -> Stroke s1 = ${formatEngineeringValue(spring.s1, precision, false)} mm (tau1 = ${formatEngineeringValue(spring.tau1, precision, false)} MPa)`,
            `  Working F2             = ${appliedForce2} N (+/- ${formatEngineeringValue(spring.tol_F2, precision, false)} N) -> Stroke s2 = ${formatEngineeringValue(spring.s2, precision, false)} mm (tau2 = ${formatEngineeringValue(spring.tau2, precision, false)} MPa)`,
            `  Static Safety Factor   = ${formatEngineeringValue(spring.SF_static, precision, false)} [${spring.isSafeStatic ? 'PASS' : 'FAIL'}]`,
            `  Solid Safety Factor    = ${formatEngineeringValue(spring.SF_solid, precision, false)} [${spring.isSafeSolid ? 'PASS' : 'FAIL'}]`,
            ``,
            `DYNAMIC FATIGUE (GOODMAN / SMITH):`,
            `  Mean Stress tau_m      = ${formatEngineeringValue(spring.tau_m, precision, false)} MPa`,
            `  Stress Amplitude tau_a = ${formatEngineeringValue(spring.tau_a, precision, false)} MPa`,
            `  Permissible Amplitude  = ${formatEngineeringValue(spring.tau_A_zul, precision, false)} MPa`,
            `  Dynamic Safety Sh      = ${formatEngineeringValue(spring.SF_dynamic, precision, false)} [${spring.isSafeDynamic ? 'PASS' : 'WARNING'}]`,
            `  Fatigue Life Verdict   = ${spring.fatigueLifeCategory === 'infinite' ? '> 10^7 Cycles (Infinite)' : spring.fatigueLifeCategory === 'finite' ? '10^5 - 10^7 Cycles (Finite)' : 'Danger of Fracture'}`,
            ``,
            `RADIAL EXPANSION & CLEARANCES:`,
            `  Expansion at F2        = +${formatEngineeringValue(spring.deltaDe_2, precision, false)} mm (De2 = ${formatEngineeringValue(spring.De_2, precision, false)} mm)`,
            `  Expansion at Solid Fc  = +${formatEngineeringValue(spring.deltaDe_c, precision, false)} mm (Dec = ${formatEngineeringValue(spring.De_c, precision, false)} mm)`,
            housingDiameter ? `  Housing Bore Dh = ${housingDiameter} mm -> Clearance = ${spring.housingClearance?.toFixed(2)} mm [${spring.isHousingOk ? 'PASS' : 'FAIL'}]` : `  Housing Bore Dh: Not specified`,
            mandrelDiameter ? `  Mandrel Dia Dd  = ${mandrelDiameter} mm -> Clearance = ${spring.mandrelClearance?.toFixed(2)} mm [${spring.isMandrelOk ? 'PASS' : 'FAIL'}]` : `  Mandrel Dia Dd: Not specified`,
            ``,
            `DIN EN 15800 TOLERANCES (Grade ${spring.toleranceGrade}):`,
            `  Diameter tol (De/Di)   = +/- ${formatEngineeringValue(spring.tol_De, precision, false)} mm`,
            `  Free length tol (L0)   = +/- ${formatEngineeringValue(spring.tol_L0, precision, false)} mm`,
            `  Perpendicularity (e1)  = <= ${formatEngineeringValue(spring.perpendicularity_e1, precision, false)} mm`,
            `  Parallelism (e2)       = <= ${formatEngineeringValue(spring.parallelism_e2, precision, false)} mm`,
            ``,
            `STABILITY & DYNAMICS:`,
            `  Slenderness (L0/Dm)    = ${formatEngineeringValue(spring.slenderness, precision, false)} [${spring.isBucklingRisk ? 'BUCKLING RISK' : 'STABLE'}]`,
            `  Resonance Freq fe      = ${formatEngineeringValue(spring.resonanceFreq, precision, false)} Hz`,
            `  Active Coil Gap sa     = ${formatEngineeringValue(spring.sa, precision, false)} mm (Min: ${formatEngineeringValue((0.1 * spring.d), precision, false)} mm)`,
            `  Spring Mass            = ${formatEngineeringValue(spring.springMass, precision, false)} g (Wire length: ${formatEngineeringValue(spring.wireLength, precision, false)} mm)`,
            `OVERALL VERDICT: ${spring.verdict}`,
            `============================================================`,
        ].join('\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    return (
        <div className="flex flex-col xl:flex-row h-full w-full bg-[var(--bg-0)] text-[var(--ink)] overflow-hidden select-none">
            {/* ═══ LEFT CONTROL PANEL ═══ */}
            <div className="w-full xl:w-[420px] shrink-0 flex flex-col bg-[var(--bg-0)]/95 border-r border-[var(--line)] overflow-y-auto custom-scrollbar">
                {/* Module Header */}
                <div className="p-6 border-b border-[var(--line)] ">
                    {/* Top Spring Kind Mode Toggle */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] mb-4 font-mono text-[10px]">
                        <button
                            type="button"
                            onClick={() => handleSwitchKind('compression')}
                            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                                !isExtension
                                    ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-md '
                                    : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                            }`}
                        >
                            <ArrowDownUp size={12} className="rotate-180" />
                            <span>{t.compressionSpring}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchKind('extension')}
                            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                                isExtension
                                    ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-md '
                                    : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                            }`}
                        >
                            <Anchor size={12} />
                            <span>{t.extensionSpring}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
                                {isExtension ? <Anchor size={20} className="text-[var(--cyan)]" /> : <Disc size={20} className="animate-spin-slow" />}
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tighter uppercase text-[var(--ink)]">
                                    {isExtension ? t.titleExtension : t.titleCompression}
                                </h1>
                                <p className="text-[9px] text-[var(--cyan)]/80 font-mono tracking-widest uppercase">
                                    {isExtension ? t.subTitleExtension : t.subTitleCompression}
                                </p>
                            </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                            spring.verdict === 'PASS'
                                ? 'bg-[var(--ok)]/15 border-[var(--ok)]/40 text-[var(--ok)]'
                                : spring.verdict === 'WARNING'
                                    ? 'bg-[var(--warn)]/15 border-[var(--warn)]/40 text-[var(--warn)]'
                                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                spring.verdict === 'PASS'
                                    ? 'bg-emerald-400'
                                    : spring.verdict === 'WARNING'
                                        ? 'bg-amber-400'
                                        : 'bg-red-400 animate-ping'
                            }`} />
                            {spring.verdict === 'PASS' ? t.passBadge : spring.verdict === 'WARNING' ? t.warnBadge : t.failBadge}
                        </div>
                    </div>

                    {/* Industrial Presets Bar */}
                    <div className="mt-4 pt-3 border-t border-[var(--line)]">
                        <div className="text-[9px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Zap size={10} className="text-[var(--warn)]" /> {t.presetsTitle}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {filteredPresets.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleApplyPreset(p.id)}
                                    className="px-2 py-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--cyan)]/40 hover:bg-cyan-500/10 text-[var(--alu)] hover:text-[var(--cyan)] text-[9px] font-mono truncate text-left transition-colors"
                                    title={p.nameEn}
                                >
                                    {getPresetLabel(p)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="p-6 space-y-6 text-[10px]">
                    {/* 1. Geometry Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[var(--alu-dim)] uppercase tracking-wider font-bold">
                            <span className="flex items-center gap-1.5 text-[var(--cyan)]">
                                <Settings size={12} /> {t.geometryTitle}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--muted)]">
                                {isExtension ? 'DIN 2097' : 'DIN 2089'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.wireDiameter}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.3"
                                    max="30"
                                    value={wireDiameter}
                                    onChange={e => setWireDiameter(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.meanDiameter}</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="2"
                                    max="300"
                                    value={meanDiameter}
                                    onChange={e => setMeanDiameter(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                        </div>

                        {/* Bidirectional Derived Diameters Readout */}
                        <div className="grid grid-cols-2 gap-3 p-2 bg-[var(--bg-1)] rounded-lg border border-[var(--line)] font-mono text-[9px]">
                            <div className="text-[var(--alu-dim)]">
                                {t.outerDiameter} <span className="text-[var(--ink)] font-bold">De = {formatEngineeringValue(spring.De, precision, false)} mm</span>
                            </div>
                            <div className="text-[var(--alu-dim)]">
                                {t.innerDiameter} <span className="text-[var(--ink)] font-bold">Di = {formatEngineeringValue(spring.Di, precision, false)} mm</span>
                            </div>
                        </div>

                        {/* Extension Specific Derived Readout: Body Lk & Hook Height LH */}
                        {isExtension && (
                            <div className="grid grid-cols-2 gap-3 p-2 bg-[var(--bg-1)] rounded-lg border border-[var(--line)] font-mono text-[9px]">
                                <div className="text-[var(--alu-dim)]">
                                    {t.bodyLength} <span className="text-[var(--cyan)] font-bold">Lk = {formatEngineeringValue(spring.Lk, precision, false)} mm</span>
                                </div>
                                <div className="text-[var(--alu-dim)]">
                                    {t.hookHeightLH || 'Kanca LH'} <span className="text-[var(--cyan)] font-bold">LH = {formatEngineeringValue(spring.LH, precision, false)} mm</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">
                                    {t.freeLength}
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="10"
                                    max="1000"
                                    value={freeLength}
                                    onChange={e => setFreeLength(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                                {isExtension && (
                                    <div className="text-[8px] font-mono text-[var(--muted)] mt-1">
                                        (Lk + 2·LH = {formatEngineeringValue((spring.Lk + 2 * spring.LH), precision, false)} mm)
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.activeCoils}</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="1"
                                    max="60"
                                    value={activeCoils}
                                    onChange={e => setActiveCoils(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">
                                    {isExtension ? t.hookType : t.endType}
                                </label>
                                {isExtension ? (
                                    <select
                                        value={hookType}
                                        onChange={e => setHookType(e.target.value as SpringHookType)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-xs text-[var(--ink)] focus:border-cyan-500 outline-none mt-1"
                                    >
                                        <option value="german">{t.hookGerman}</option>
                                        <option value="extended_german">{t.hookExtended}</option>
                                        <option value="english">{t.hookEnglish}</option>
                                        <option value="plain">{t.hookPlain}</option>
                                    </select>
                                ) : (
                                    <select
                                        value={endType}
                                        onChange={e => setEndType(e.target.value as SpringEndType)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-xs text-[var(--ink)] focus:border-cyan-500 outline-none mt-1"
                                    >
                                        <option value="squared_ground">{t.squaredGround}</option>
                                        <option value="squared_unground">{t.squaredUnground}</option>
                                        <option value="plain_open">{t.plainOpen}</option>
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.windingDirection}</label>
                                <select
                                    value={windingDirection}
                                    onChange={e => setWindingDirection(e.target.value as SpringWindingDirection)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-xs text-[var(--ink)] focus:border-cyan-500 outline-none mt-1"
                                >
                                    <option value="right">{t.windingRight}</option>
                                    <option value="left">{t.windingLeft}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.toleranceGrade}</label>
                            <select
                                value={toleranceGrade}
                                onChange={e => setToleranceGrade(Number(e.target.value) as SpringToleranceGrade)}
                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-xs text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                            >
                                <option value={1}>{t.grade1}</option>
                                <option value={2}>{t.grade2}</option>
                                <option value={3}>{t.grade3}</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-[var(--bg-2)]" />

                    {/* 2. Loading & Operating Conditions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[var(--alu-dim)] uppercase tracking-wider font-bold">
                            <span className="flex items-center gap-1.5 text-[var(--warn)]">
                                <Gauge size={12} /> {t.loadingTitle}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--muted)]">
                                {isExtension ? 'DIN EN 13906-2' : 'DIN EN 13906-1'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.preload}</label>
                                <input
                                    type="number"
                                    step="10"
                                    min="0"
                                    value={appliedForce1}
                                    onChange={e => setAppliedForce1(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.maxWorkingLoad}</label>
                                <input
                                    type="number"
                                    step="10"
                                    min="1"
                                    value={appliedForce2}
                                    onChange={e => setAppliedForce2(Number(e.target.value))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--warn)] focus:border-amber-500 outline-none mt-1"
                                />
                            </div>
                        </div>

                        {/* Extension Spring Initial Tension (F0) input */}
                        {isExtension && (
                            <div>
                                <div className="flex items-center justify-between text-[9px] font-mono text-[var(--alu-dim)] uppercase">
                                    <span>{t.initialTension}</span>
                                    <span className="text-[var(--cyan)] font-bold">
                                        τ₀ = {formatEngineeringValue(spring.tau0, precision, false)} MPa
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder={`${t.initialTensionAuto} (~${formatEngineeringValue(spring.F0, precision, false)} N)`}
                                    value={initialTensionForce}
                                    onChange={e => setInitialTensionForce(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                />
                                <div className="text-[8.5px] font-mono text-[var(--muted)] mt-1">
                                    {initialTensionForce ? `F₀: ${initialTensionForce} N` : `F₀: ${formatEngineeringValue(spring.F0, precision, false)} N (${t.initialTensionAuto})`}
                                </div>
                            </div>
                        )}

                        {/* Service Temperature Input */}
                        <div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--alu-dim)] uppercase">
                                <span className="flex items-center gap-1">
                                    <Flame size={11} className="text-orange-400" /> {t.operatingTemp}: {operatingTemp}°C
                                </span>
                                <span className="text-[var(--muted)]">
                                    G(T) = {Math.round(spring.G_effective)} MPa ({formatEngineeringValue(((spring.tempDeratingFactor - 1) * 100), precision, false)}%)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="range"
                                    min="-40"
                                    max="250"
                                    step="5"
                                    value={operatingTemp}
                                    onChange={e => setOperatingTemp(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-[var(--bg-1)] rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                                />
                                <input
                                    type="number"
                                    min="-40"
                                    max="300"
                                    value={operatingTemp}
                                    onChange={e => setOperatingTemp(Number(e.target.value))}
                                    className="w-16 bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-1.5 font-mono text-xs text-orange-300 text-center"
                                />
                            </div>
                        </div>

                        {/* Shot Peening Toggle Button */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsShotPeened(v => !v)}
                                className={`w-full py-2 px-3 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-between transition-all ${
                                    isShotPeened
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-[var(--ok)] shadow-lg '
                                        : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Sparkles size={13} className={isShotPeened ? 'text-[var(--ok)]' : 'text-[var(--muted)]'} />
                                    {t.shotPeening}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                                    isShotPeened ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black' : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)]'
                                }`}>
                                    {isShotPeened ? t.shotPeeningActive : t.shotPeeningStandard}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-[var(--bg-2)]" />

                    {/* 3. Clearance & Housing / Pin Mounting */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[var(--alu-dim)] uppercase tracking-wider font-bold">
                            <span className="flex items-center gap-1.5 text-[var(--cyan)]">
                                <Compass size={12} /> {t.clearanceTitle}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--muted)]">
                                {isExtension ? 'DIN 2097' : 'DIN EN 13906-1'}
                            </span>
                        </div>

                        {!isExtension ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.housingDia}</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder={`>${formatEngineeringValue(spring.De_c, precision, false)}`}
                                        value={housingDiameter}
                                        onChange={e => setHousingDiameter(e.target.value)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                    />
                                    {housingDiameter && spring.housingClearance !== null && (
                                        <div className={`text-[8.5px] font-mono mt-1 ${spring.isHousingOk ? 'text-[var(--ok)]' : 'text-red-400 font-bold'}`}>
                                            Açıklık: {formatEngineeringValue(spring.housingClearance, precision, false)} mm {spring.isHousingOk ? '✓' : '(Çakışma!)'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">{t.mandrelDia}</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder={`<${formatEngineeringValue(spring.Di, precision, false)}`}
                                        value={mandrelDiameter}
                                        onChange={e => setMandrelDiameter(e.target.value)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)] focus:border-cyan-500 outline-none mt-1"
                                    />
                                    {mandrelDiameter && spring.mandrelClearance !== null && (
                                        <div className={`text-[8.5px] font-mono mt-1 ${spring.isMandrelOk ? 'text-[var(--ok)]' : 'text-red-400 font-bold'}`}>
                                            Açıklık: {formatEngineeringValue(spring.mandrelClearance, precision, false)} mm {spring.isMandrelOk ? '✓' : '(Sıkışma!)'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-[var(--bg-1)] rounded-lg border border-[var(--line)] font-mono text-[9px] space-y-1.5">
                                <div className="text-[var(--alu)] font-bold flex items-center justify-between">
                                    <span>Pim / Askı Bağlantı Geometrisi</span>
                                    <span className="text-[var(--cyan)]">Di = {formatEngineeringValue(spring.Di, precision, false)} mm</span>
                                </div>
                                <div className="flex justify-between text-[var(--alu-dim)]">
                                    <span>Tavsiye Edilen Pim Çapı (D_pin ≤ 0.75·Di):</span>
                                    <span className="text-[var(--ok)] font-bold">≤ {formatEngineeringValue((0.75 * spring.Di), precision, false)} mm</span>
                                </div>
                                <div className="flex justify-between text-[var(--alu-dim)]">
                                    <span>Kanca İçi Serbest Boşluk (LH):</span>
                                    <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.LH, precision, false)} mm</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-px bg-[var(--bg-2)]" />

                    {/* 4. Material Properties */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[var(--alu-dim)] uppercase tracking-wider font-bold">
                            <span className="flex items-center gap-1.5 text-purple-400">
                                <Activity size={12} /> {t.materialTitle}
                            </span>
                            <span className="font-mono text-[9px] text-[var(--muted)]">EN 10270</span>
                        </div>

                        <div>
                            <select
                                value={materialId}
                                onChange={e => setMaterialId(e.target.value)}
                                className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-xs text-[var(--ink)] focus:border-cyan-500 outline-none"
                            >
                                {Object.values(SPRING_MATERIALS).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {t12(language, m.nameEn, m.nameTr)} [{m.standard}]
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Material dynamic strength values */}
                        <div className="p-2.5 bg-[var(--bg-1)] rounded-lg border border-[var(--line)] font-mono text-[9px] space-y-1">
                            <div className="flex justify-between text-[var(--alu-dim)]">
                                <span>{t.effectiveG}:</span>
                                <span className="text-[var(--ink)] font-bold">{Math.round(spring.G_effective).toLocaleString()} MPa</span>
                            </div>
                            <div className="flex justify-between text-[var(--alu-dim)]">
                                <span>Kopma Dayanımı Rm(d):</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.Rm, precision, false)} MPa</span>
                            </div>
                            <div className="flex justify-between text-[var(--alu-dim)]">
                                <span>{isExtension ? 'Emniyet Kayma (0.45·Rm):' : 'Emniyet Kayma (τzul):'}</span>
                                <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(spring.tauZul, precision, false)} MPa</span>
                            </div>
                            {isExtension && (
                                <div className="flex justify-between text-[var(--alu-dim)]">
                                    <span>Kanca Emniyet Eğilme (σb,zul):</span>
                                    <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(spring.sigma_b_zul, precision, false)} MPa</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[var(--alu-dim)]">
                                <span>{t.fatigueLimit}:</span>
                                <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.tau_O, precision, false)} MPa</span>
                            </div>
                            <div className="flex justify-between text-[var(--alu-dim)]">
                                <span>{t.maxServiceTemp}:</span>
                                <span className="text-[var(--alu)]">{SPRING_MATERIALS[materialId]?.maxTemp || 150}°C</span>
                            </div>
                        </div>

                        {materialId === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">Özel G (MPa)</label>
                                    <input
                                        type="number"
                                        value={customG}
                                        onChange={e => setCustomG(Number(e.target.value))}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono text-[var(--alu-dim)] uppercase">Özel Rm (MPa)</label>
                                    <input
                                        type="number"
                                        value={customRm}
                                        onChange={e => setCustomRm(Number(e.target.value))}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg p-2 font-mono text-sm text-[var(--cyan)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Report Copy Action */}
                <div className="mt-auto p-4 border-t border-[var(--line)] bg-[var(--bg-1)]">
                    <button
                        type="button"
                        onClick={handleCopyReport}
                        className="w-full py-2.5 px-4 rounded-xl bg-[var(--cyan)]/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-[var(--cyan)] font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                    >
                        {copied ? <CheckCircle2 size={14} className="text-[var(--ok)]" /> : <Copy size={14} />}
                        {copied ? (t.copied || 'Rapor Kopyalandı!') : (t.copyReport || 'ASCII Hesap Raporu Kopyala')}
                    </button>
                </div>
            </div>

            {/* ═══ RIGHT VISUALIZER & RESULTS DASHBOARD ═══ */}
            <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto custom-scrollbar space-y-6">

                {/* Interactive High-Precision Spring Blueprint */}
                <div className="w-full h-[420px] bg-[var(--bg-0)] rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden relative">
                    <SpringBlueprint
                        spring={spring}
                        appliedForce={appliedForce2}
                        onForceChange={handleForceChange}
                        showLegend={true}
                    />
                </div>

                {/* Warnings Banner if any */}
                {spring.warnings.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[var(--ink)] text-xs font-mono space-y-1.5">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[var(--warn)]">
                            <ShieldAlert size={14} /> {isExtension ? 'DIN EN 13906-2 Mühendislik Uyarıları' : 'DIN EN 13906-1 Mühendislik Uyarıları'}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--ink)] pl-1">
                            {spring.warnings.map((w, idx) => (
                                <li key={idx}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ═══ 4 PRIMARY KPI METRIC CARDS ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* 1. Max Stress Card (Hook Bending for Extension vs Wahl Shear for Compression) */}
                    <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative overflow-hidden">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-1">
                            {isExtension ? t.hookStressCardTitle : t.stressCardTitle}
                        </div>
                        <div className={`text-2xl font-mono font-black ${
                            isExtension
                                ? spring.isHookSafe ? 'text-[var(--ink)]' : 'text-red-400'
                                : spring.isSafeStatic ? 'text-[var(--ink)]' : 'text-red-400'
                        }`}>
                            {isExtension ? formatEngineeringValue(spring.sigma_b2, precision, true) : formatEngineeringValue(spring.tau2, precision, true)} <span className="text-xs text-[var(--muted)] font-normal">MPa</span>
                        </div>
                        <div className="mt-2 text-[9px] font-mono flex items-center justify-between text-[var(--alu-dim)]">
                            <span>{isExtension ? `σb,zul: ${formatEngineeringValue(spring.sigma_b_zul, precision, true)} MPa` : `τzul: ${formatEngineeringValue(spring.tauZul, precision, true)} MPa`}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                                isExtension
                                    ? spring.isHookSafe ? 'bg-emerald-500/20 text-[var(--ok)]' : 'bg-red-500/20 text-red-300'
                                    : spring.isSafeStatic ? 'bg-emerald-500/20 text-[var(--ok)]' : 'bg-red-500/20 text-red-300'
                            }`}>
                                {isExtension ? `SF_kanca = ${formatEngineeringValue(spring.SF_hook, precision, true)}x` : `SF = ${formatEngineeringValue(spring.SF_static, precision, true)}x`}
                            </span>
                        </div>
                    </div>

                    {/* 2. Dynamic Goodman Fatigue Safety */}
                    <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative overflow-hidden">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-1">
                            {t.fatigueCardTitle}
                        </div>
                        <div className={`text-2xl font-mono font-black ${
                            spring.isSafeDynamic ? 'text-[var(--ok)]' : spring.SF_dynamic >= 1.0 ? 'text-[var(--warn)]' : 'text-red-400'
                        }`}>
                            {spring.SF_dynamic > 99 ? '∞' : formatEngineeringValue(spring.SF_dynamic, precision, true)} <span className="text-xs text-[var(--muted)] font-normal">x</span>
                        </div>
                        <div className="mt-2 text-[9px] font-mono flex items-center justify-between text-[var(--alu-dim)]">
                            <span>τa: {formatEngineeringValue(spring.tau_a, precision, true)} MPa</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[8.5px] ${
                                spring.fatigueLifeCategory === 'infinite'
                                    ? 'bg-emerald-500/20 text-[var(--ok)]'
                                    : spring.fatigueLifeCategory === 'finite'
                                        ? 'bg-amber-500/20 text-[var(--warn)]'
                                        : 'bg-red-500/20 text-red-300'
                            }`}>
                                {spring.fatigueLifeCategory === 'infinite' ? t.infiniteLife : spring.fatigueLifeCategory === 'finite' ? t.finiteLife : t.dangerLife}
                            </span>
                        </div>
                    </div>

                    {/* 3. Spring Rate / Stiffness */}
                    <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative overflow-hidden">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-1">
                            {t.stiffnessCardTitle}
                        </div>
                        <div className="text-2xl font-mono font-black text-[var(--cyan)]">
                            {formatEngineeringValue(spring.R, precision, true)} <span className="text-xs text-[var(--cyan)] font-normal">N/mm</span>
                        </div>
                        <div className="mt-2 text-[9px] font-mono text-[var(--alu-dim)] flex items-center justify-between">
                            <span>G({spring.operatingTemp}°C):</span>
                            <span className="text-[var(--ink)] font-bold">{Math.round(spring.G_effective)} MPa</span>
                        </div>
                    </div>

                    {/* 4. Working Deflection & Extension / Radial Bulge */}
                    <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative overflow-hidden">
                        <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider mb-1">
                            {isExtension ? t.extendedLength : t.deflectionCardTitle}
                        </div>
                        <div className="text-2xl font-mono font-black text-[var(--warn)]">
                            {isExtension ? formatEngineeringValue(spring.L2, precision, true) : formatEngineeringValue(spring.s2, precision, true)} <span className="text-xs text-amber-500 font-normal">mm</span>
                        </div>
                        <div className="mt-2 text-[9px] font-mono text-[var(--alu-dim)] flex items-center justify-between">
                            <span>{isExtension ? 'Strok s₂ (szul):' : `${t.radialExpansion}:`}</span>
                            <span className="text-[var(--ok)] font-bold">
                                {isExtension ? `${formatEngineeringValue(spring.s2, precision, true)} mm (${formatEngineeringValue(spring.s_zul, precision, true)})` : `+${formatEngineeringValue(spring.deltaDe_2, precision, true)} mm`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ═══ ADVANCED INDUSTRIAL VERIFICATION: GOODMAN & THERMAL ═══ */}
                <div className="p-5 rounded-2xl bg-[var(--bg-0)] border border-[var(--line)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ok)] flex items-center gap-2">
                            <Sparkles size={14} /> {isExtension ? t.extensionAnalysisTitle : t.fatigueThermalTitle}
                        </h2>
                        <span className="text-[9px] font-mono text-[var(--muted)]">Goodman / Smith Fatigue</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-mono">
                        {/* Col 1: Goodman Fatigue */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1 flex items-center justify-between">
                                <span>{t.goodmanTitle}</span>
                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                    spring.isSafeDynamic ? 'bg-emerald-500/20 text-[var(--ok)]' : 'bg-red-500/20 text-red-300'
                                }`}>
                                    Sh = {spring.SF_dynamic > 99 ? '∞' : formatEngineeringValue(spring.SF_dynamic, precision, true)}x
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.meanStress}</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.tau_m, precision, true)} MPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.stressAmp}</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.tau_a, precision, true)} MPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.allowableAmp}</span>
                                <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(spring.tau_A_zul, precision, true)} MPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.fatigueLimit}</span>
                                <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.tau_O, precision, true)} MPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.shotPeening}:</span>
                                <span className={`font-bold ${spring.isShotPeened ? 'text-[var(--ok)]' : 'text-[var(--alu-dim)]'}`}>
                                    {spring.isShotPeened ? t.shotPeeningActive : t.shotPeeningStandard}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.estimatedLife}</span>
                                <span className={`font-bold ${
                                    spring.fatigueLifeCategory === 'infinite'
                                        ? 'text-[var(--ok)]'
                                        : spring.fatigueLifeCategory === 'finite'
                                            ? 'text-[var(--warn)]'
                                            : 'text-red-400'
                                }`}>
                                    {spring.fatigueLifeCategory === 'infinite' ? t.infiniteLife : spring.fatigueLifeCategory === 'finite' ? t.finiteLife : t.dangerLife}
                                </span>
                            </div>
                        </div>

                        {/* Col 2: Thermal Derating & Relaxation */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1 flex items-center justify-between">
                                <span>{t.thermalTitle}</span>
                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                    spring.relaxationRisk === 'low'
                                        ? 'bg-emerald-500/20 text-[var(--ok)]'
                                        : spring.relaxationRisk === 'moderate'
                                            ? 'bg-amber-500/20 text-[var(--warn)]'
                                            : 'bg-red-500/20 text-red-300'
                                }`}>
                                    {spring.relaxationRisk.toUpperCase()} RİSK
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.serviceTempLabel}</span>
                                <span className="text-orange-300 font-bold">{spring.operatingTemp} °C</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.effectiveG}</span>
                                <span className="text-[var(--ink)] font-bold">{Math.round(spring.G_effective)} MPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.deratingFactor}</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue((spring.tempDeratingFactor * 100), precision, true)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.maxServiceTemp}</span>
                                <span className="text-[var(--alu)]">{SPRING_MATERIALS[materialId]?.maxTemp || 150} °C</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">{t.relaxationStatus}</span>
                                <span className={`font-bold ${
                                    spring.operatingTemp > (SPRING_MATERIALS[materialId]?.maxTemp || 150)
                                        ? 'text-red-400'
                                        : spring.relaxationRisk === 'moderate'
                                            ? 'text-[var(--warn)]'
                                            : 'text-[var(--ok)]'
                                }`}>
                                    {spring.relaxationRisk === 'low' ? t.relaxationLow : spring.relaxationRisk === 'moderate' ? t.relaxationMod : t.relaxationHigh}
                                </span>
                            </div>
                        </div>

                        {/* Col 3: Radial Expansion & Enclosure (Compression) OR Hook Integrity (Extension) */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            {!isExtension ? (
                                <>
                                    <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1 flex items-center justify-between">
                                        <span>{t.radialBoreTitle}</span>
                                        <span className="text-[8.5px] text-[var(--cyan)] font-mono">DIN 13906-1</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.loadedExpansion}</span>
                                        <span className="text-[var(--ok)] font-bold">+{formatEngineeringValue(spring.deltaDe_2, precision, true)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.loadedOuterDia}</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.De_2, precision, true)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.solidExpansion}</span>
                                        <span className="text-[var(--warn)] font-bold">+{formatEngineeringValue(spring.deltaDe_c, precision, true)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.solidOuterDia}</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.De_c, precision, true)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kovan Durumu (Dh):</span>
                                        <span className={`font-bold ${spring.isHousingOk === false ? 'text-red-400' : spring.isHousingOk === true ? 'text-[var(--ok)]' : 'text-[var(--muted)]'}`}>
                                            {spring.housingClearance !== null ? `${formatEngineeringValue(spring.housingClearance, precision, true)} mm [${spring.isHousingOk ? 'UYGUN' : 'ÇAKIŞMA'}]` : 'Belirtilmedi'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kılavuz Mil (Dd):</span>
                                        <span className={`font-bold ${spring.isMandrelOk === false ? 'text-red-400' : spring.isMandrelOk === true ? 'text-[var(--ok)]' : 'text-[var(--muted)]'}`}>
                                            {spring.mandrelClearance !== null ? `${formatEngineeringValue(spring.mandrelClearance, precision, true)} mm [${spring.isMandrelOk ? 'UYGUN' : 'SIKIŞMA'}]` : 'Belirtilmedi'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1 flex items-center justify-between">
                                        <span>{t.hookIntegrityTitle}</span>
                                        <span className="text-[8.5px] text-[var(--cyan)] font-mono">DIN 2097</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.hookBendingStress}</span>
                                        <span className={`font-bold ${spring.isHookSafe ? 'text-[var(--ink)]' : 'text-red-400'}`}>
                                            {formatEngineeringValue(spring.sigma_b2, precision, false)} MPa
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.allowableBendingStress}</span>
                                        <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(spring.sigma_b_zul, precision, false)} MPa</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.hookTorsionStress}</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.tau_t2, precision, false)} MPa</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.hookSafety}:</span>
                                        <span className={`font-bold ${spring.isHookSafe ? 'text-[var(--ok)]' : 'text-red-400'}`}>
                                            SF = {formatEngineeringValue(spring.SF_hook, precision, false)}x [{spring.isHookSafe ? 'UYGUN' : 'AŞIRI YÜK'}]
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.maxPermissibleDeflection}</span>
                                        <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(spring.s_zul, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">{t.initialTension}</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.F0, precision, false)} N</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ DIN EN 15800 / DIN 2095 MANUFACTURING TOLERANCES ═══ */}
                <div className="p-5 rounded-2xl bg-[var(--bg-0)] border border-[var(--line)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-2">
                            <Layers size={14} /> {t.tolerancesTitle}
                        </h2>
                        <span className="text-[9px] font-mono text-[var(--cyan)] font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                            Kalite Sınıfı {spring.toleranceGrade} ({spring.toleranceGrade === 1 ? t.grade1 : spring.toleranceGrade === 2 ? t.grade2 : t.grade3})
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--muted)]">{t.dimDe}:</div>
                            <div className="text-[var(--ink)] font-bold mt-1">± {formatEngineeringValue(spring.tol_De, precision, false)} mm</div>
                            <div className="text-[8.5px] text-[var(--muted)]">{formatEngineeringValue((spring.De - spring.tol_De), precision, false)} ... {formatEngineeringValue((spring.De + spring.tol_De), precision, false)}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--muted)]">{t.dimL0}:</div>
                            <div className="text-[var(--ink)] font-bold mt-1">± {formatEngineeringValue(spring.tol_L0, precision, false)} mm</div>
                            <div className="text-[8.5px] text-[var(--muted)]">{formatEngineeringValue((spring.L0 - spring.tol_L0), precision, false)} ... {formatEngineeringValue((spring.L0 + spring.tol_L0), precision, false)}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--muted)]">{t.forceF1}:</div>
                            <div className="text-[var(--cyan)] font-bold mt-1">± {formatEngineeringValue(spring.tol_F1, precision, false)} N</div>
                            <div className="text-[8.5px] text-[var(--muted)]">{formatEngineeringValue((spring.F1 - spring.tol_F1), precision, false)} ... {formatEngineeringValue((spring.F1 + spring.tol_F1), precision, false)}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--muted)]">{t.forceF2}:</div>
                            <div className="text-[var(--warn)] font-bold mt-1">± {formatEngineeringValue(spring.tol_F2, precision, false)} N</div>
                            <div className="text-[8.5px] text-[var(--muted)]">{formatEngineeringValue((spring.F2 - spring.tol_F2), precision, false)} ... {formatEngineeringValue((spring.F2 + spring.tol_F2), precision, false)}</div>
                        </div>

                        {!isExtension ? (
                            <>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">{t.perpendicularity}:</div>
                                    <div className="text-[var(--ink)] font-bold mt-1">≤ {formatEngineeringValue(spring.perpendicularity_e1, precision, false)} mm</div>
                                    <div className="text-[8.5px] text-[var(--muted)]">0.025·L0·f_grade</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">{t.parallelism}:</div>
                                    <div className="text-[var(--ink)] font-bold mt-1">≤ {formatEngineeringValue(spring.parallelism_e2, precision, false)} mm</div>
                                    <div className="text-[8.5px] text-[var(--muted)]">0.015·De·f_grade</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">Eğim Açısı (α):</div>
                                    <div className={`font-bold mt-1 ${spring.isPitchAngleOk ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}`}>
                                        {formatEngineeringValue(spring.pitchAngleDeg, precision, false)}° {spring.isPitchAngleOk ? '✓ (α ≤ 7.5°)' : '⚠️ (Eğilme Riski)'}
                                    </div>
                                    <div className="text-[8.5px] text-[var(--muted)]">p / (π·Dm)</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">{t.dimLk}:</div>
                                    <div className="text-[var(--ink)] font-bold mt-1">± {formatEngineeringValue((spring.tol_L0 * 0.75), precision, false)} mm</div>
                                    <div className="text-[8.5px] text-[var(--muted)]">Lk = {formatEngineeringValue(spring.Lk, precision, false)} mm</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">Kanca Açıklık Toleransı:</div>
                                    <div className="text-[var(--ink)] font-bold mt-1">± {formatEngineeringValue((0.15 * spring.d), precision, false)} mm</div>
                                    <div className="text-[8.5px] text-[var(--muted)]">DIN 2097 Form A/B</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                                    <div className="text-[var(--muted)]">Kanca Eğilme Faktörü (kb):</div>
                                    <div className="text-[var(--cyan)] font-bold mt-1">{formatEngineeringValue(spring.kb, precision, false)}</div>
                                    <div className="text-[8.5px] text-[var(--muted)]">C = {formatEngineeringValue(spring.C, precision, false)}</div>
                                </div>
                            </>
                        )}

                        <div className="p-2.5 rounded-lg bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--muted)]">{t.windingDirection}:</div>
                            <div className="text-[var(--ink)] font-bold mt-1">
                                {spring.windingDirection === 'right' ? t.windingRight : t.windingLeft}
                            </div>
                            <div className="text-[8.5px] text-[var(--muted)]">DIN 2089</div>
                        </div>
                    </div>
                </div>

                {/* ═══ DETAILED DIN EN 13906-1/2 GEOMETRY & DYNAMICS MATRIX ═══ */}
                <div className="p-5 rounded-2xl bg-[var(--bg-0)] border border-[var(--line)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--cyan)] flex items-center gap-2">
                            <ShieldCheck size={14} /> {isExtension ? (t.extensionAnalysisTitle || 'DIN EN 13906-2 Kanca & Detaylı Analiz') : (t.compressionAnalysisTitle || 'DIN EN 13906-1 Detaylı Geometri & Dinamik Tablosu')}
                        </h2>
                        <span className="text-[9px] font-mono text-[var(--muted)]">ISO 2162-1 Standards</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-mono">
                        {/* Column 1: Heights and Coils */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1">
                                {isExtension ? 'UZUNLUK & KANCA' : 'UZUNLUK & HATVE'}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Serbest Boy (L₀):</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.L0, precision, false)} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Yüklü Boy (L₂):</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.L2, precision, false)} mm</span>
                            </div>
                            {!isExtension ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Blok Boyu (Lc):</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.Lc, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Maksimum Sehim (sc):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.sc, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Serbest Hatve (p):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.p, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Sargı Boşluğu (sa):</span>
                                        <span className={`font-bold ${spring.sa >= 0.1 * spring.d ? 'text-[var(--ok)]' : 'text-red-400'}`}>
                                            {formatEngineeringValue(spring.sa, precision, false)} mm {spring.sa < 0.1 * spring.d ? '(Kritik!)' : ''}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Gövde Boyu (Lk):</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.Lk, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kanca Yüksekliği (LH):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.LH, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Çalışma Sehimi (s₂):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.s2, precision, false)} mm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">İzin Verilen Sehim (s_zul):</span>
                                        <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(spring.s_zul, precision, false)} mm</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Column 2: Stability & Dynamics OR Hook Stresses */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1">
                                {!isExtension ? 'BURKULMA & DİNAMİK' : 'KANCA GERİLMELERİ'}
                            </div>
                            {!isExtension ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Narinlik (λ = L₀/D):</span>
                                        <span className={`font-bold ${spring.slenderness > 4.0 ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>
                                            {formatEngineeringValue(spring.slenderness, precision, false)} {spring.slenderness > 4.0 ? '(λ > 4)' : '(Stabil)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kritik Burkulma Sehim:</span>
                                        <span className="text-[var(--ink)] font-bold">{spring.isBucklingRisk ? `${formatEngineeringValue(spring.criticalDeflection, precision, false)} mm` : 'Sonsuz (Burkulmaz)'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kılavuz Durumu:</span>
                                        <span className={`font-bold ${spring.requiresMandrel ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>
                                            {spring.requiresMandrel ? 'Kılavuz Pim Gerekli' : 'Serbest Çalışabilir'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Doğal Rezonans (fe):</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.resonanceFreq, precision, false)} Hz</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Maks. Devir (13. Harmonik):</span>
                                        <span className="text-[var(--ink)] font-bold">{Math.round((spring.resonanceFreq / 13) * 60)} RPM</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kanca Eğilme (σb2):</span>
                                        <span className={`font-bold ${spring.isHookSafe ? 'text-[var(--ink)]' : 'text-red-400'}`}>
                                            {formatEngineeringValue(spring.sigma_b2, precision, false)} MPa
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kanca Eğilme Faktörü (kb):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.kb, precision, false)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">İzin Verilen Eğilme (σb,zul):</span>
                                        <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(spring.sigma_b_zul, precision, false)} MPa</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kanca Emniyet Faktörü:</span>
                                        <span className={`font-bold ${spring.isHookSafe ? 'text-[var(--ok)]' : 'text-red-400'}`}>
                                            SF_kanca = {formatEngineeringValue(spring.SF_hook, precision, false)}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Kanca Tipi:</span>
                                        <span className="text-[var(--cyan)] font-bold">{spring.hookType.toUpperCase()}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Column 3: Material & Production */}
                        <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                            <div className="text-[var(--alu-dim)] font-bold border-b border-[var(--line)] pb-1">
                                {!isExtension ? 'İMALAT & BLOK' : 'İMALAT & GERİLME'}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Toplam Sargı (nt):</span>
                                <span className="text-[var(--ink)] font-bold">{spring.nt}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Açınım Tel Boyu (L):</span>
                                <span className="text-[var(--ink)] font-bold">{Math.round(spring.wireLength)} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Yay Kütlesi:</span>
                                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.springMass, precision, false)} g</span>
                            </div>
                            {!isExtension ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Blok Emniyeti SF_c:</span>
                                        <span className={`font-bold ${spring.isSafeSolid ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}`}>
                                            {formatEngineeringValue(spring.SF_solid, precision, false)}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Blok Gerilmesi (τc):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.tauC, precision, false)} MPa</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Gövde Kayma (τ₂):</span>
                                        <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(spring.tau2, precision, false)} MPa</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Gövde Emniyeti SF_gövde:</span>
                                        <span className={`font-bold ${spring.isSafeStatic ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}`}>
                                            {formatEngineeringValue(spring.SF_static, precision, false)}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted)]">Ön Gerilme (τ₀):</span>
                                        <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(spring.tau0, precision, false)} MPa</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

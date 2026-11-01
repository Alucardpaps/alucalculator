'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleDot, Search, Info, AlertTriangle, ShieldCheck, CheckCircle2, Copy, Check, Zap } from 'lucide-react';
import {
    BEARING_CATALOG,
    BearingType,
    BearingData,
    calculateBearingLife,
    getBearingTypeInfo,
} from '@/data/skfBearings';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getBearingsModuleUiStrings } from '@/locales/bearingsModuleUiTranslations';
import { BearingBlueprint } from '@/components/visualizers/BearingBlueprint';
import {
    CalculatorWorkbench,
    WorkbenchField,
    WorkbenchInfo,
    WorkbenchInputs,
    WorkbenchResults,
    WorkbenchSection,
    WorkbenchSlider,
    workbenchInputClass,
    workbenchSelectClass,
} from '@/components/ui/workbench';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { analyzeBearingLife, CONTAMINATION_LEVELS } from '@/lib/mechanical/bearingLifeEngine';

const TYPES: { id: BearingType; en: string; tr: string }[] = [
    { id: 'deep-groove-ball', en: 'Deep Groove Ball', tr: 'Sabit Bilyalı' },
    { id: 'angular-contact-ball', en: 'Angular Contact Ball', tr: 'Açısal Temaslı' },
    { id: 'tapered-roller', en: 'Tapered Roller', tr: 'Konik Makaralı' },
    { id: 'cylindrical-roller', en: 'Cylindrical Roller', tr: 'Silindirik Makaralı' },
    { id: 'needle-roller', en: 'Needle Roller', tr: 'İğne Makaralı' },
    { id: 'thrust-ball', en: 'Thrust Ball', tr: 'Eksenel Bilyalı' },
];

export function BearingsModule() {
    const precision = useGlobalPrecision();
    const { language } = useI18nStore();
    const ui = getBearingsModuleUiStrings(language);

    const [query, setQuery] = useState('');
    const [type, setType] = useState<BearingType | 'all'>('all');
    const [bore, setBore] = useState<number | 'all'>('all');
    const [code, setCode] = useState('6204');
    const [fr, setFr] = useState(5000);
    const [fa, setFa] = useState(1000);
    const [rpm, setRpm] = useState(3000);
    const [reliability, setReliability] = useState(90);
    const [viscosity, setViscosity] = useState(20); // ν at operating temperature, mm²/s
    const [contam, setContam] = useState('normal');
    const [tab, setTab] = useState<'life' | 'loadEq' | 'notes'>('life');
    const [copied, setCopied] = useState(false);

    const reset = () => {
        setQuery('');
        setType('all');
        setBore('all');
        setCode('6204');
        setFr(5000);
        setFa(1000);
        setRpm(3000);
        setReliability(90);
        setViscosity(20);
        setContam('normal');
    };

    const bearingPresets = useMemo(() => [
        {
            label: '6205 (Motor 1450 rpm)',
            onSelect: () => {
                setType('deep-groove-ball');
                setBore(25);
                setCode('6205');
                setFr(2500);
                setFa(400);
                setRpm(1450);
                setReliability(90);
            }
        },
        {
            label: '6308 (Gearbox 950 rpm)',
            onSelect: () => {
                setType('deep-groove-ball');
                setBore(40);
                setCode('6308');
                setFr(8500);
                setFa(1200);
                setRpm(950);
                setReliability(90);
            }
        },
        {
            label: '7208 Angular (Spindle 3000 rpm)',
            onSelect: () => {
                setType('angular-contact-ball');
                setBore(40);
                setCode('7208');
                setFr(3200);
                setFa(4500);
                setRpm(3000);
                setReliability(90);
            }
        },
        {
            label: '30206 Tapered (Hub 600 rpm)',
            onSelect: () => {
                setType('tapered-roller');
                setBore(30);
                setCode('30206');
                setFr(12000);
                setFa(3500);
                setRpm(600);
                setReliability(90);
            }
        }
    ], []);

    const selected: BearingData = useMemo(
        () => BEARING_CATALOG.find((b) => b.code === code) || BEARING_CATALOG.find((b) => b.code === '6204') || BEARING_CATALOG[0],
        [code],
    );

    const bores = useMemo(() => {
        const set = new Set<number>();
        BEARING_CATALOG.forEach((b) => set.add(b.d));
        return [...set].sort((a, b) => a - b);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return BEARING_CATALOG.filter((b) => {
            if (type !== 'all' && b.type !== type) return false;
            if (bore !== 'all' && b.d !== bore) return false;
            if (q && !b.code.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [query, type, bore]);

    const life = useMemo(
        () => calculateBearingLife(selected, fr / 1000, fa / 1000, rpm, reliability),
        [selected, fr, fa, rpm, reliability],
    );

    const ec = CONTAMINATION_LEVELS.find((c) => c.id === contam)?.ec ?? 0.55;
    const iso = useMemo(
        () => analyzeBearingLife({ bearing: selected, fr: fr / 1000, fa: fa / 1000, rpm, reliability, baseViscosity: viscosity, contamination: ec }),
        [selected, fr, fa, rpm, reliability, viscosity, ec],
    );
    const Lnm = iso.Lna ?? life.Lna;
    const massKg = selected.mass ?? (Math.PI / 4) * (selected.D ** 2 - selected.d ** 2) * selected.B * 7.85e-6 * 0.55; // ring volume × fill factor (estimate)

    const typeInfo = getBearingTypeInfo(selected.type);
    const pExp = selected.type.includes('roller') ? (10 / 3) : 3;

    const copyBearingReport = () => {
        const a1 = iso.a1 ?? 1.0;
        const text = `=== ${t12(language, 'ISO 281 BEARING LIFE CALCULATION REPORT', 'ISO 281 RULMAN ÖMRÜ HESAP RAPORU')} ===
${t12(language, 'Bearing Code', 'Rulman Kodu')}: ${selected.code} (${selected.type.replace(/-/g, ' ').toUpperCase()})
${t12(language, 'Dimensions', 'Boyutlar')}: d = ${selected.d} mm, D = ${selected.D} mm, B = ${selected.B} mm
${t12(language, 'Load Ratings', 'Yük Kapasitesi')}: C = ${selected.C} kN (${t12(language, 'Dynamic', 'Dinamik')}), C₀ = ${selected.C0} kN (${t12(language, 'Static', 'Statik')})
${t12(language, 'Operating Conditions', 'Çalışma Şartları')}: Fr = ${fr} N, Fa = ${fa} N, n = ${rpm} rpm, ${t12(language, 'Reliability', 'Güvenilirlik')} = ${reliability}% (a₁ = ${a1})
${t12(language, 'Equivalent Load', 'Eşdeğer Yük')}: P = ${formatEngineeringValue(life.P * 1000, precision, true)} N (${formatEngineeringValue(life.P, precision, true)} kN), P₀ = ${formatEngineeringValue(life.P0 * 1000, precision, true)} N
${t12(language, 'Static Safety Factor', 'Statik Emniyet')}: S₀ = C₀ / P₀ = ${formatEngineeringValue(life.staticSafety, precision, true)}
${t12(language, 'Basic Rating Life', 'Nominal Ömür')}: L₁₀ = ${formatEngineeringValue(life.L10, precision, true)} × 10⁶ ${t12(language, 'rev', 'devir')}
${t12(language, 'Life in Hours', 'Saatlik Ömür')}: L₁₀h = ${formatEngineeringValue(life.L10h, precision, true)} h
${t12(language, 'Lubrication', 'Yağlama')}: ν = ${viscosity} mm²/s, ν₁ = ${formatEngineeringValue(iso.nu1 ?? 0, precision, true)} mm²/s, κ = ${formatEngineeringValue(iso.viscosityRatio ?? 0, precision, true)}, eC = ${ec}, Cu ≈ ${formatEngineeringValue(iso.Cu ?? 0, precision, true)} kN → aISO = ${formatEngineeringValue(iso.aISO ?? 1, precision, true)}
${t12(language, 'Modified Life', 'Düzeltilmiş Ömür')}: Lnm = a₁·aISO·L₁₀h = ${formatEngineeringValue(Lnm, precision, true)} h
${t12(language, 'Standard', 'Standart')}: ISO 281:2007 · ISO 76`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <CalculatorWorkbench>
            {/* ═══ LEFT PANEL: CONTROLS & CATALOG ═══ */}
            <WorkbenchInputs
                title={ui.title || t12(language, 'Bearing Life', 'Rulman Ömrü')}
                subtitle="ISO 281 · L10 / L10h"
                icon={<CircleDot size={18} className="text-[var(--std)]" />}
                accent="blue"
                onReset={reset}
                presets={bearingPresets}
            >
                <WorkbenchSection title={ui.catalogSearch || t12(language, 'Catalog', 'Katalog')}>
                    <div className="relative">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={ui.searchPlaceholder || "Search SKF Code (e.g. 6204)..."}
                            className={`${workbenchInputClass} pl-9`}
                        />
                    </div>

                    <WorkbenchField label={ui.bearingFamily || t12(language, 'Type', 'Tip')}>
                        <select value={type} onChange={(e) => setType(e.target.value as BearingType | 'all')} className={workbenchSelectClass}>
                            <option value="all">{ui.allTypes || t12(language, 'All types', 'Tüm tipler')} ({BEARING_CATALOG.length})</option>
                            {TYPES.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t12(language, t.en, t.tr)}
                                </option>
                            ))}
                        </select>
                    </WorkbenchField>

                    <WorkbenchField label={ui.boreDia || t12(language, 'Bore d', 'İç Çap (Bore d)')}>
                        <select
                            value={bore === 'all' ? 'all' : String(bore)}
                            onChange={(e) => setBore(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className={workbenchSelectClass}
                        >
                            <option value="all">{ui.allBores || t12(language, 'All', 'Tümü')}</option>
                            {bores.map((d) => (
                                <option key={d} value={d}>d = {d} mm</option>
                            ))}
                        </select>
                    </WorkbenchField>

                    {/* Quick Bearing Grid */}
                    <div className="max-h-[160px] overflow-y-auto rounded-lg border border-white/[0.07] bg-[var(--bg-1)] p-1.5 custom-scrollbar">
                        <div className="grid grid-cols-3 gap-1">
                            {filtered.slice(0, 75).map((b) => (
                                <button
                                    key={b.code}
                                    type="button"
                                    onClick={() => setCode(b.code)}
                                    className={`rounded-md px-1.5 py-1 font-mono text-[10px] font-bold text-center transition-colors truncate ${
                                        selected.code === b.code
                                            ? 'bg-blue-500/25 border border-blue-400/40 text-blue-300'
                                            : 'text-[var(--alu-dim)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    {b.code}
                                </button>
                            ))}
                        </div>
                    </div>
                </WorkbenchSection>

                {/* LOAD & SPEED */}
                <WorkbenchSection title={ui.loadAndSpeed || t12(language, 'Load & Speed', 'Yük & Hız')}>
                    <WorkbenchField label={ui.radialLoad || t12(language, 'Radial Fr', 'Radyal Yük Fr')} unit="N">
                        <input type="number" value={fr} onChange={(e) => setFr(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="Fr" value={fr} min={0} max={50000} step={100} unit="N" onChange={setFr} />

                    <WorkbenchField label={ui.axialLoad || t12(language, 'Axial Fa', 'Eksenel Yük Fa')} unit="N">
                        <input type="number" value={fa} onChange={(e) => setFa(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="Fa" value={fa} min={0} max={30000} step={50} unit="N" onChange={setFa} />

                    <WorkbenchField label={ui.operatingSpeed || t12(language, 'Speed n', 'Dönme Hızı n')} unit="rpm">
                        <input type="number" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchSlider label="n" value={rpm} min={10} max={20000} step={50} unit="rpm" onChange={setRpm} />

                    <WorkbenchField label={ui.reliability || t12(language, 'Reliability', 'Güvenilirlik')}>
                        <select value={reliability} onChange={(e) => setReliability(Number(e.target.value))} className={workbenchSelectClass}>
                            {[90, 95, 96, 97, 98, 99].map((r) => (
                                <option key={r} value={r}>{r}% (a₁)</option>
                            ))}
                        </select>
                    </WorkbenchField>
                </WorkbenchSection>

                <WorkbenchSection title={t12(language, 'Lubrication & cleanliness (aISO)', 'Yağlama ve temizlik (aISO)')}>
                    <WorkbenchField label={t12(language, 'Operating viscosity ν', 'Çalışma viskozitesi ν')} unit="mm²/s">
                        <input type="number" min={1} value={viscosity} onChange={(e) => setViscosity(Math.max(1, Number(e.target.value)))} className={workbenchInputClass} />
                    </WorkbenchField>
                    <WorkbenchField label={t12(language, 'Contamination eC (ISO 281 Table 13)', 'Kirlilik eC (ISO 281 Tablo 13)')}>
                        <select value={contam} onChange={(e) => setContam(e.target.value)} className={workbenchSelectClass}>
                            {CONTAMINATION_LEVELS.map((c) => (
                                <option key={c.id} value={c.id}>{t12(language, c.en, c.tr)} · {c.ec}</option>
                            ))}
                        </select>
                    </WorkbenchField>
                    <p className="text-[10.5px] font-mono text-[var(--muted)]">
                        ν₁ = {formatEngineeringValue(iso.nu1 ?? 0, precision, true)} mm²/s · κ = ν/ν₁ = {formatEngineeringValue(iso.viscosityRatio ?? 0, precision, true)} · Cu ≈ {formatEngineeringValue(iso.Cu ?? 0, precision, true)} kN
                    </p>
                </WorkbenchSection>

                <div className="border-t border-[var(--line)] pt-3">
                    <Link href="/academy/bearing-life-calculation-explained/" className="text-[11px] font-semibold text-[var(--std)] hover:text-[var(--ink)]">
                        {ui.lessonLink || t12(language, 'ISO 281 lesson →', 'ISO 281 Rulman Dersi →')}
                    </Link>
                </div>
            </WorkbenchInputs>

            {/* ═══ RIGHT PANEL: KPIS, SCHEMATICS & TABS (Screenshot 1) ═══ */}
            <WorkbenchResults>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:p-5 custom-scrollbar">
                    
                    {/* Top Action Bar with 1-Click Report Copy */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="text-[11px] font-mono font-bold text-[var(--alu)]">
                                {selected.code} · ISO 281 {t12(language, 'Analysis Output', 'Analiz Çıktıları')}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={copyBearingReport}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] hover:bg-[var(--bg-3)] hover:border-[var(--line)] text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                            title={ui.copyReport || t12(language, 'Copy Report', 'Raporu Kopyala')}
                        >
                            {copied ? <Check size={13} className="text-[var(--ok)]" /> : <Copy size={13} className="text-[var(--cyan)]" />}
                            <span className="text-[11px]">{copied ? (ui.copied || t12(language, 'Copied', 'Kopyalandı')) : (ui.copyReport || t12(language, 'Copy Report', 'Raporu Kopyala'))}</span>
                        </button>
                    </div>

                    {/* Top 4 KPI Cards */}
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <Kpi label="L10H" value={life.L10h >= 1e6 ? life.L10h.toExponential(2) : formatEngineeringValue(life.L10h, precision, true)} unit="h" />
                        <Kpi label={`Lnm = a₁·aISO·L10h (aISO ${formatEngineeringValue(iso.aISO ?? 1, precision, true)})`} value={Lnm >= 1e6 ? Lnm.toExponential(2) : formatEngineeringValue(Lnm, precision, true)} unit="h" />
                        <Kpi label="P" value={formatEngineeringValue(life.P * 1000, precision, true)} unit="N" />
                        <Kpi label="S0 = C0 / P0" value={formatEngineeringValue(life.staticSafety, precision, true)} />
                    </div>

                    {/* ═══ ISO 281 Actionable Engineering Advice Card ═══ */}
                    <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                        life.staticSafety < 1.0 || life.L10h < 8000
                            ? 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                            : life.L10h < 20000 || life.staticSafety < 1.5
                            ? 'bg-[var(--warn)]/10 border-[var(--warn)]/40 text-[var(--warn)]'
                            : 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
                    }`}>
                        <div className="font-bold flex items-center justify-between uppercase text-[10px] tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <Zap size={13} className="shrink-0" />
                                <span>{t12(language, 'ISO 281 Engineering Recommendation', 'ISO 281 Mühendislik Tavsiyesi')}</span>
                            </div>
                            <span className="font-mono text-[9px] opacity-80">{selected.code} · C={selected.C} kN · C₀={selected.C0} kN</span>
                        </div>
                        <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
                            {life.staticSafety < 1.0 ? (
                                t12(
                                    language,
                                    `Static overload risk! Static safety factor S0 (${formatEngineeringValue(life.staticSafety, precision, true)}) is below 1.0. Permanent plastic indentation (Brinelling) of raceways will occur under shock or peak loads. Choose a heavier bearing series (e.g. 63xx or 64xx) or roller bearings.`,
                                    `Statik aşırı yük riski! Statik emniyet katsayısı S0 (${formatEngineeringValue(life.staticSafety, precision, true)}) 1.0'ın altındadır. Şok veya pik yüklerde yuvarlanma yollarında kalıcı plastik deformasyon (Brinelling) meydana gelir. Daha ağır bir rulman serisi (ör. 63xx veya 64xx) veya makaralı rulman seçin.`
                                )
                            ) : life.L10h < 8000 ? (
                                t12(
                                    language,
                                    `Short fatigue rating life! L10h is only ${formatEngineeringValue(life.L10h, precision, true)} hours (continuous industrial duty typically requires ≥ 20,000–40,000 h). Consider upgrading bore diameter, switching to a wider dimension series (63xx), or selecting cylindrical/tapered roller bearings.`,
                                    `Kısa yorulma ömrü! L10h anma ömrü sadece ${formatEngineeringValue(life.L10h, precision, true)} saattir (sürekli sanayi işletmelerinde tipik hedef ≥ 20.000–40.000 saattir). Mil çapını büyütmeyi, daha yüksek kapasiteli seriye (63xx) geçmeyi veya silindirik/konik makaralı rulman kullanmayı değerlendirin.`
                                )
                            ) : life.L10h < 20000 || life.staticSafety < 1.5 ? (
                                t12(
                                    language,
                                    `Moderate rating life (${formatEngineeringValue(life.L10h, precision, true)} h, S0=${formatEngineeringValue(life.staticSafety, precision, true)}). Suitable for intermittent 8 h/day service or light machinery. For 24/7 heavy process machinery, upgrade to the next size for extended maintenance intervals.`,
                                    `Orta seviye anma ömrü (${formatEngineeringValue(life.L10h, precision, true)} sa, S0=${formatEngineeringValue(life.staticSafety, precision, true)}). Günlük 8 saatlik aralıklı çalışma veya hafif makineler için uygundur. 7/24 kesintisiz proses hatlarında bakım periyodunu uzatmak için bir üst boyutu seçebilirsiniz.`
                                )
                            ) : (
                                t12(
                                    language,
                                    `Optimum ISO 281 bearing selection. Rating life L10h = ${life.L10h >= 1e6 ? life.L10h.toExponential(2) : formatEngineeringValue(life.L10h, precision, true)} hours with static safety S0 = ${formatEngineeringValue(life.staticSafety, precision, true)}. Fully compliant for continuous heavy-duty industrial operation.`,
                                    `Optimum ISO 281 rulman seçimi. Anma ömrü L10h = ${life.L10h >= 1e6 ? life.L10h.toExponential(2) : formatEngineeringValue(life.L10h, precision, true)} saat ve statik emniyet S0 = ${formatEngineeringValue(life.staticSafety, precision, true)}. Ağır hizmet tipi sürekli sanayi işletmesi için tam uygundur.`
                                )
                            )}
                        </p>
                    </div>

                    {iso.warnings && iso.warnings.length > 0 && (
                        <ul className="rounded-xl border border-[var(--warn)] bg-[var(--warn-soft)] px-3 py-2 text-[11px] text-[var(--ink)] space-y-0.5">
                            {iso.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
                        </ul>
                    )}

                    {/* Center Section: Blueprint Viewport + Selected Bearing Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        {/* Left: 2D Blueprint Schematic Viewport */}
                        <div className="lg:col-span-7 xl:col-span-8 p-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] flex flex-col justify-between">
                            <div className="w-full relative">
                                <BearingBlueprint
                                    type={selected.type}
                                    code={selected.code}
                                    d={selected.d}
                                    D={selected.D}
                                    B={selected.B}
                                    C={selected.C}
                                    C0={selected.C0}
                                    rpm={rpm}
                                    fr={fr}
                                    fa={fa}
                                    life={{ ...life, Lna: Lnm }}
                                    language={language}
                                />
                            </div>
                        </div>

                        {/* Right: Selected Bearing Details Table */}
                        <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--cyan)] mb-1.5">
                                    {t12(language, 'SELECTED BEARING', 'SEÇİLİ RULMAN')}
                                </h4>
                                <p className="text-xs sm:text-[13px] text-[var(--alu)] leading-relaxed">
                                    {typeInfo?.description || t12(language, 'ISO 281 equivalent load and L10 rating life.', 'ISO 281 eşdeğer yük ve L10 ömür hesabı.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 py-3.5 border-y border-[var(--line)] font-mono">
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Bore', 'İç Çap')} (d)</span>
                                    <span className="text-[var(--ink)] font-bold text-sm sm:text-base">{selected.d} mm</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Outer', 'Dış Çap')} (D)</span>
                                    <span className="text-[var(--ink)] font-bold text-sm sm:text-base">{selected.D} mm</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Width', 'Genişlik')} (B)</span>
                                    <span className="text-[var(--ink)] font-bold text-sm sm:text-base">{selected.B} mm</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Dyn Rating', 'Dinamik')} (C)</span>
                                    <span className="text-[var(--cyan)] font-bold text-sm sm:text-base">{selected.C} kN</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Static Rating', 'Statik')} (C₀)</span>
                                    <span className="text-[var(--cyan)] font-bold text-sm sm:text-base">{selected.C0} kN</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Mass', 'Ağırlık')}</span>
                                    <span className="text-[var(--ink)] font-bold text-sm sm:text-base">{selected.mass ? '' : '≈ '}{massKg.toFixed(3)} kg</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">{t12(language, 'Limit', 'Limit')} (e)</span>
                                    <span className="text-[var(--warn)] font-bold text-sm sm:text-base">{life.e !== undefined ? formatEngineeringValue(life.e, 3, true) : '–'}</span>
                                </div>
                                <div>
                                    <span className="text-[var(--alu-dim)] uppercase text-[10px] block tracking-wide">X · Y</span>
                                    <span className="text-[var(--warn)] font-bold text-sm sm:text-base">{formatEngineeringValue(life.X ?? 1, 2, true)} · {formatEngineeringValue(life.Y ?? 0, 2, true)}</span>
                                </div>
                            </div>

                            <div className="text-[10px] font-mono text-[var(--alu-dim)] flex justify-between items-center pt-2">
                                <span>ISO 281:2007 · SKF</span>
                                <span className="text-[var(--alu-dim)] px-2 py-0.5 rounded border border-[var(--line)] text-[10px]">{t12(language, 'catalogue data', 'katalog verisi')}</span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ BOTTOM TABBED SECTION: LIFE / LOAD EQ / NOTES ═══ */}
                    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                        <div className="flex border-b border-white/[0.06]">
                            {(['life', 'loadEq', 'notes'] as const).map((tId) => (
                                <button
                                    key={tId}
                                    type="button"
                                    onClick={() => setTab(tId)}
                                    className={`px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                                        tab === tId
                                            ? 'border-b-2 border-[var(--cyan)] text-[var(--cyan)] bg-[var(--bg-2)]/40'
                                            : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    {tId === 'life' ? (ui.tabLife || t12(language, 'LIFE', 'ÖMÜR')) : tId === 'loadEq' ? t12(language, 'LOAD EQ', 'EŞDEĞER YÜK') : (ui.tabNotes || t12(language, 'NOTES', 'NOTLAR'))}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 text-xs font-mono space-y-2 text-[var(--alu)]">
                            {tab === 'life' && (
                                <>
                                    <p className="text-[var(--cyan)]">
                                        L₁₀ = (C/P)ᵖ = ({selected.C} / {formatEngineeringValue(life.P, precision, true)})^{formatEngineeringValue(pExp, precision, true)} = {formatEngineeringValue(life.L10, precision, true)} · 10⁶ rev
                                    </p>
                                    <p className="text-[var(--alu-dim)]">
                                        L₁₀h = 10⁶ · L₁₀ / (60·n) = {formatEngineeringValue(life.L10h, precision, true)} h · Lnm = a₁·aISO·L₁₀h = {formatEngineeringValue(iso.a1 ?? 1, 2, true)} · {formatEngineeringValue(iso.aISO ?? 1, precision, true)} · L₁₀h = {formatEngineeringValue(Lnm, precision, true)} h
                                    </p>
                                    <p className="text-[11px] text-[var(--muted)]">
                                        {t12(language, 'p = 3 (ball) or 10/3 (roller); a₁ — ISO 281 Table 12; aISO(eC·Cu/P, κ) — ISO 281 §9.3 eqs. 15–20.', 'p = 3 (bilya) veya 10/3 (makara); a₁ — ISO 281 Tablo 12; aISO(eC·Cu/P, κ) — ISO 281 §9.3 denklem 15–20.')}
                                    </p>
                                </>
                            )}
                            {tab === 'loadEq' && (
                                <>
                                    <p className="text-[var(--cyan)]">
                                        P = X·Fr + Y·Fa = {formatEngineeringValue(life.X ?? 1, 2, true)}·{formatEngineeringValue(fr / 1000, precision, true)} + {formatEngineeringValue(life.Y ?? 0, 2, true)}·{formatEngineeringValue(fa / 1000, precision, true)} = {formatEngineeringValue(life.P, precision, true)} kN · Fa/Fr = {fr > 0 ? formatEngineeringValue(fa / fr, 3, true) : '∞'} {life.e !== undefined ? `(e = ${formatEngineeringValue(life.e, 3, true)})` : ''}
                                    </p>
                                    <p className="text-[var(--alu-dim)]">
                                        P₀ = X₀·Fr + Y₀·Fa = {formatEngineeringValue(life.P0, precision, true)} kN (Static equivalent load)
                                    </p>
                                </>
                            )}
                            {tab === 'notes' && (
                                <div className="space-y-1 text-[11px] text-[var(--alu-dim)]">
                                    <p>• {t12(language, 'L10 is the basic rating life at 90 % reliability (ISO 281 §6).', 'L10, %90 güvenilirlikte temel anma ömrüdür (ISO 281 §6).')}</p>
                                    <p>• {t12(language, 'Lnm adds reliability a₁ and the system factor aISO from lubrication (κ) and contamination (eC). Cu is estimated from C₀ (ISO 281 Annex B) when the catalogue gives no value.', 'Lnm, güvenilirlik a₁ ve yağlama (κ) ile kirlilikten (eC) gelen sistem faktörü aISO’yu içerir. Katalogda yoksa Cu, C₀’dan tahmin edilir (ISO 281 Ek B).')}</p>
                                    <p>• {t12(language, 'Static safety s₀ = C₀/P₀: ≥ 1 smooth running, ≥ 2 with shock loads (ball bearings).', 'Statik emniyet s₀ = C₀/P₀: sarsıntısız ≥ 1, darbeli yükte ≥ 2 (bilyalı).')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <WorkbenchInfo
                        formula="L₁₀ = (C / P)ᵖ · 10⁶ rev | L₁₀h = 10⁶·L₁₀/(60·n) | Lnm = a₁·aISO·L₁₀h"
                        formulaNote="ISO 281:2007 basic and modified rating life with aISO(eC·Cu/P, κ)."
                        standards={['ISO 281:2007', 'ISO 76 (STATIC)', 'ISO 15 (RADIAL DIMENSIONS)']}
                        assumptions={[
                            'Dynamic C and C₀ from catalogue; P from type-specific X/Y rules (ISO 281 Table 3 for deep-groove ball).',
                            'ν₁ from ISO 281 §9.3.3; Cu ≈ C₀/22 (ball) or C₀/8.2 (roller) when not catalogued.',
                            'Single bearing; induced axial forces of paired angular-contact / tapered bearings are not included.',
                        ]}
                        links={[{ href: '/academy/bearing-life-calculation-explained/', label: 'Academy' }]}
                    />
                </div>
            </WorkbenchResults>
        </CalculatorWorkbench>
    );
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 sm:p-4">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">{label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-[var(--ink)] sm:text-3xl">{value}</span>
                {unit && <span className="text-[11px] text-[var(--alu-dim)] font-mono">{unit}</span>}
            </div>
        </div>
    );
}

export default BearingsModule;

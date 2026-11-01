'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ALLOY_DATASHEETS,
  type AlloyDatasheet,
  type AluminumStockShape,
  calculateAlloyShapeWeight,
} from '@/data/alloyDatasheets';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  Scale,
  ShieldAlert,
  Thermometer,
  GitCompare,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';

interface AlloyInteractiveWorkbenchProps {
  alloy: AlloyDatasheet;
}

const SHAPE_OPTIONS: { id: AluminumStockShape; labelEn: string; labelTr: string }[] = [
  { id: 'plate', labelEn: 'Flat Plate / Sheet', labelTr: 'Düz Plaka / Sac Levha' },
  { id: 'round_bar', labelEn: 'Round Bar / Rod', labelTr: 'Yuvarlak Çubuk / Mil' },
  { id: 'hex_bar', labelEn: 'Hexagonal Bar', labelTr: 'Altıköşe Çubuk' },
  { id: 'octagonal_bar', labelEn: 'Octagonal Bar', labelTr: 'Sekizköşe Çubuk' },
  { id: 'round_tube', labelEn: 'Hollow Round Tube / Pipe', labelTr: 'Yuvarlak Boru' },
  { id: 'rect_tube', labelEn: 'Rectangular / Box Tube', labelTr: 'Kutu / Dikdörtgen Profil' },
  { id: 't_bar', labelEn: 'T-Profile / Extrusion', labelTr: 'T-Profil / Ekstrüzyon' },
  { id: 'wire_coil', labelEn: 'Wire / Coil Stock', labelTr: 'Tel / Kangal' },
  { id: 'sphere', labelEn: 'Solid Sphere', labelTr: 'Dolu Küre' },
  { id: 'ring_flange', labelEn: 'Ring / Machined Flange', labelTr: 'Halka / İşlenmiş Flanş' },
];

export function AlloyInteractiveWorkbench({ alloy }: AlloyInteractiveWorkbenchProps) {
  const { language } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'weight' | 'rivet_bend' | 'thermal_cnc' | 'compare'>('weight');

  // ─── Tab 1: 10-Shape Weight & Cost State ─────────────────────────────────
  const [shape, setShape] = useState<AluminumStockShape>('plate');
  const [lengthMm, setLengthMm] = useState<number>(1000);
  const [widthMm, setWidthMm] = useState<number>(500);
  const [thicknessMm, setThicknessMm] = useState<number>(6);
  const [outerDiaMm, setOuterDiaMm] = useState<number>(50);
  const [innerDiaMm, setInnerDiaMm] = useState<number>(25);
  const [wallMm, setWallMm] = useState<number>(4);
  const [acrossFlatsMm, setAcrossFlatsMm] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerKgUsd, setPricePerKgUsd] = useState<number>(6.8);

  // ─── Tab 2: Aerospace Rivet / Bearing & Sheet Bend State ─────────────────
  const [sheetThkMm, setSheetThkMm] = useState<number>(2.5);
  const [fastenerDiaMm, setFastenerDiaMm] = useState<number>(4.8);
  const [fastenerCount, setFastenerCount] = useState<number>(4);
  const [edgeRatioEd, setEdgeRatioEd] = useState<'1.5' | '2.0'>('2.0');
  const [insideBendRadiusMm, setInsideBendRadiusMm] = useState<number>(8.0);
  const [bendLengthMm, setBendLengthMm] = useState<number>(500);

  // ─── Tab 3: Thermal & CNC State ──────────────────────────────────────────
  const [thermalLengthMm, setThermalLengthMm] = useState<number>(1200);
  const [deltaTC, setDeltaTC] = useState<number>(65);
  const [toolDiaMm, setToolDiaMm] = useState<number>(12);
  const [fluteCount, setFluteCount] = useState<number>(3);
  const [axialDocMm, setAxialDocMm] = useState<number>(6);
  const [radialWocMm, setRadialWocMm] = useState<number>(4);

  // ─── Tab 4: Comparator State ─────────────────────────────────────────────
  const [compareSlug, setCompareSlug] = useState<string>(
    alloy.slug === '2024-t3' ? '7075-t6' : alloy.slug === '6061-t6' ? '2024-t3' : '6061-t6'
  );

  const weightCalc = useMemo(
    () =>
      calculateAlloyShapeWeight({
        shape,
        lengthMm,
        widthMm,
        thicknessMm,
        outerDiaMm,
        innerDiaMm,
        wallMm,
        acrossFlatsMm,
        quantity,
        densityGcm3: alloy.density,
        pricePerKgUsd,
      }),
    [shape, lengthMm, widthMm, thicknessMm, outerDiaMm, innerDiaMm, wallMm, acrossFlatsMm, quantity, alloy.density, pricePerKgUsd]
  );

  const rivetBendCalc = useMemo(() => {
    const baseBearingMpa = alloy.bearingYieldMPa || Math.round(alloy.yieldMPa * 1.6);
    const effectiveBearingMpa = edgeRatioEd === '2.0' ? baseBearingMpa : Math.round(baseBearingMpa * 0.78);
    const singleBearingKn = (sheetThkMm * fastenerDiaMm * effectiveBearingMpa) / 1000;
    const totalBearingKn = singleBearingKn * Math.max(1, fastenerCount);

    const shearMpa = alloy.shearMPa || Math.round(alloy.tensileMPa * 0.6);
    const minPitchMm = Number((3.5 * fastenerDiaMm).toFixed(1));
    const minEdgeDistMm = Number((Number(edgeRatioEd) * fastenerDiaMm).toFixed(1));

    // Cold Bend Analysis
    const minRatio = alloy.minBendRadiusRatio ?? 2.5;
    const minRequiredBendRadiusMm = Number((minRatio * sheetThkMm).toFixed(2));
    const isBendSafe = insideBendRadiusMm >= minRequiredBendRadiusMm;
    const vDieOpeningMm = Math.max(8, Number((8 * sheetThkMm).toFixed(1)));
    // Air bending force F (kN) = (1.42 * Rm * t^2 * L) / (1000 * V)
    const airBendForceKn = (1.42 * alloy.tensileMPa * sheetThkMm * sheetThkMm * (bendLengthMm / 1000)) / vDieOpeningMm;

    return {
      effectiveBearingMpa,
      singleBearingKn,
      totalBearingKn,
      shearMpa,
      minPitchMm,
      minEdgeDistMm,
      minRatio,
      minRequiredBendRadiusMm,
      isBendSafe,
      vDieOpeningMm,
      airBendForceKn,
    };
  }, [alloy, sheetThkMm, fastenerDiaMm, fastenerCount, edgeRatioEd, insideBendRadiusMm, bendLengthMm]);

  const thermalCncCalc = useMemo(() => {
    // Thermal Expansion: alpha is in 10^-6 / K
    const alphaPerK = alloy.thermalExp * 1e-6;
    const deltaLMm = thermalLengthMm * alphaPerK * deltaTC;
    const constrainedStressMpa = Math.abs(alloy.modulusGPa * 1000 * alphaPerK * deltaTC);

    // CNC Carbide Milling
    const vc = alloy.cncVcMMin || 380;
    const rpm = Math.round((1000 * vc) / (Math.PI * Math.max(1, toolDiaMm)));
    const fzMm = toolDiaMm <= 6 ? 0.04 : toolDiaMm <= 12 ? 0.08 : 0.12;
    const feedRateMmMin = Math.round(rpm * fluteCount * fzMm);
    const mrrCm3Min = (axialDocMm * radialWocMm * feedRateMmMin) / 1000;

    return {
      deltaLMm,
      deltaLMicrons: deltaLMm * 1000,
      constrainedStressMpa,
      vc,
      rpm,
      fzMm,
      feedRateMmMin,
      mrrCm3Min,
    };
  }, [alloy, thermalLengthMm, deltaTC, toolDiaMm, fluteCount, axialDocMm, radialWocMm]);

  const compareTarget = useMemo(
    () => ALLOY_DATASHEETS.find((a) => a.slug === compareSlug) || ALLOY_DATASHEETS[0],
    [compareSlug]
  );

  return (
    <section className="rounded-xl border border-cyan-500/30 bg-[var(--bg-1)] p-4 sm:p-5 mb-8 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3.5 mb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Interactive Engineering Workbench · {alloy.name} ({alloy.standard})
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
            {t12(
              language,
              `${alloy.name} Live Calculator & Design Verification Suite`,
              `${alloy.name} Canlı Hesaplama & Mühendislik Doğrulama İstasyonu`
            )}
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-lg border border-white/10 bg-[var(--bg-0)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'weight'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale size={13} />
            <span>{t12(language, '1. Weight & Cost (10 Shapes)', '1. Ağırlık & Maliyet (10 Kesit)')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rivet_bend')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rivet_bend'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={13} />
            <span>{t12(language, '2. Rivet Bearing & Bend Radius', '2. Perçin Ezilme & Büküm Yarıçapı')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thermal_cnc')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'thermal_cnc'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer size={13} />
            <span>{t12(language, '3. Thermal ΔL & CNC Speeds', '3. Termal Genleşme & CNC Devir')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare size={13} />
            <span>{t12(language, '4. Live Alloy Comparator', '4. Canlı Alaşım Karşılaştırıcı')}</span>
          </button>
        </div>
      </div>

      {/* ═══ TAB 1: 10-SHAPE WEIGHT, COST & 2.70 MYTH CALCULATOR ═══ */}
      {activeTab === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-white/10 bg-[var(--bg-1)] p-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t12(language, 'Stock Geometry / Profile Shape', 'Malzeme Kesiti / Profil Tipi')}
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as AluminumStockShape)}
                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-3 py-2 text-xs font-mono text-white"
              >
                {SHAPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t12(language, opt.labelEn, opt.labelTr)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {shape !== 'sphere' && shape !== 'ring_flange' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Length L (mm)', 'Boy L (mm)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lengthMm}
                    onChange={(e) => setLengthMm(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                  />
                </div>
              )}

              {(shape === 'plate' || shape === 'rect_tube' || shape === 't_bar') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Width W (mm)', 'Genişlik W (mm)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={widthMm}
                    onChange={(e) => setWidthMm(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                  />
                </div>
              )}

              {(shape === 'plate' || shape === 'rect_tube' || shape === 't_bar' || shape === 'ring_flange') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {shape === 'plate' || shape === 'ring_flange'
                      ? t12(language, 'Thickness t (mm)', 'Kalınlık t (mm)')
                      : t12(language, 'Height H (mm)', 'Yükseklik H (mm)')}
                  </label>
                  <input
                    type="number"
                    min={0.2}
                    step={0.5}
                    value={thicknessMm}
                    onChange={(e) => setThicknessMm(Math.max(0.1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                  />
                </div>
              )}

              {(shape === 'round_bar' || shape === 'wire_coil' || shape === 'round_tube' || shape === 'sphere' || shape === 'ring_flange') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Outer Ø OD (mm)', 'Dış Çap OD (mm)')}
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    value={outerDiaMm}
                    onChange={(e) => setOuterDiaMm(Math.max(0.5, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                  />
                </div>
              )}

              {shape === 'ring_flange' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Inner Bore Ø ID (mm)', 'İç Çap ID (mm)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={innerDiaMm}
                    onChange={(e) => setInnerDiaMm(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                  />
                </div>
              )}

              {(shape === 'round_tube' || shape === 'rect_tube' || shape === 't_bar') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Wall Thickness w (mm)', 'Et Kalınlığı w (mm)')}
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={wallMm}
                    onChange={(e) => setWallMm(Math.max(0.2, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                  />
                </div>
              )}

              {(shape === 'hex_bar' || shape === 'octagonal_bar') && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    {t12(language, 'Across Flats AF (mm)', 'Anahtar Ağzı AF (mm)')}
                  </label>
                  <input
                    type="number"
                    min={2}
                    value={acrossFlatsMm}
                    onChange={(e) => setAcrossFlatsMm(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Quantity (pcs)', 'Adet')}
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.round(Number(e.target.value))))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Unit Price ($/kg)', 'Birim Fiyat ($/kg)')}
                </label>
                <input
                  type="number"
                  step={0.2}
                  min={0.5}
                  value={pricePerKgUsd}
                  onChange={(e) => setPricePerKgUsd(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-3">
                <div className="text-[10px] font-mono uppercase text-cyan-300 font-bold">
                  {t12(language, `True Mass (${alloy.density.toFixed(2)} g/cm³)`, `Gerçek Kütle (${alloy.density.toFixed(2)} g/cm³)`)}
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {weightCalc.totalMassKg.toFixed(2)} kg
                </div>
                <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  {weightCalc.totalMassLb.toFixed(2)} lb ({weightCalc.singleMassKg.toFixed(3)} kg/pc)
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3">
                <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                  {t12(language, 'If Assumed ρ = 2.70 g/cm³', 'ρ = 2.70 Varsayılırsa')}
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {weightCalc.assumed270MassKg.toFixed(2)} kg
                </div>
                <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                  Δ = {weightCalc.massDeltaKg >= 0 ? '+' : ''}
                  {weightCalc.massDeltaKg.toFixed(2)} kg ({weightCalc.massErrorPct >= 0 ? '+' : ''}
                  {weightCalc.massErrorPct.toFixed(2)}%)
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                  {t12(language, 'Estimated Material Cost', 'Tahmini Malzeme Maliyeti')}
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  ${weightCalc.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  Vol: {weightCalc.totalVolumeCm3.toFixed(0)} cm³ · A: {weightCalc.crossAreaMm2.toFixed(0)} mm²
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3 text-xs space-y-1">
              <div className="font-mono text-[10px] uppercase text-cyan-300 font-bold">
                {t12(language, 'Engineering Mass Traceability Note', 'Mühendislik Kütle İzlenebilirlik Notu')}
              </div>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                {t12(
                  language,
                  `${alloy.name} contains alloying elements (${alloy.family} series) that shift its density to ${alloy.density.toFixed(2)} g/cm³ (${Math.round(alloy.density * 1000)} kg/m³). On a ${quantity}-piece batch, generic 2.70 g/cm³ calculators miscalculate shipping and structural mass by ${(Math.abs(weightCalc.massDeltaKg) * 1000).toFixed(0)} grams.`,
                  `${alloy.name}, alaşım elementleri nedeniyle ${alloy.density.toFixed(2)} g/cm³ (${Math.round(alloy.density * 1000)} kg/m³) yoğunluğa sahiptir. ${quantity} adetlik bu partide standart 2.70 g/cm³ hesaplayıcıları toplam ağırlığı ${(Math.abs(weightCalc.massDeltaKg) * 1000).toFixed(0)} gram hatalı hesaplar.`
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: AEROSPACE RIVET BEARING & COLD BEND RADIUS SIZER ═══ */}
      {activeTab === 'rivet_bend' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Fastener & Rivet Bearing Capacity */}
          <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                MIL-HDBK-5J / MMPDS & Eurocode 9 Bearing Check
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t12(language, 'Rivet & Pin Bearing Strength Calculator', 'Perçin / Cıvata Delik Ezilme (Bearing) Hesaplayıcı')}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Sheet t (mm)</label>
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  value={sheetThkMm}
                  onChange={(e) => setSheetThkMm(Math.max(0.4, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Pin/Rivet Ø D</label>
                <input
                  type="number"
                  step={0.4}
                  min={1.6}
                  value={fastenerDiaMm}
                  onChange={(e) => setFastenerDiaMm(Math.max(1.5, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Fasteners (N)</label>
                <input
                  type="number"
                  min={1}
                  value={fastenerCount}
                  onChange={(e) => setFastenerCount(Math.max(1, Math.round(Number(e.target.value))))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Edge e/D</label>
                <select
                  value={edgeRatioEd}
                  onChange={(e) => setEdgeRatioEd(e.target.value as '1.5' | '2.0')}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-amber-300"
                >
                  <option value="2.0">e/D = 2.0 (Std)</option>
                  <option value="1.5">e/D = 1.5 (Min)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-2.5">
                <div className="text-[9px] font-mono uppercase text-amber-300">Total Bearing Yield</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {rivetBendCalc.totalBearingKn.toFixed(2)} kN
                </div>
                <div className="text-[9px] font-mono text-amber-400">
                  {rivetBendCalc.singleBearingKn.toFixed(2)} kN / hole
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                <div className="text-[9px] font-mono uppercase text-slate-400">Alloy Shear τu</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {rivetBendCalc.shearMpa} MPa
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  F_bry = {rivetBendCalc.effectiveBearingMpa} MPa
                </div>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-2.5">
                <div className="text-[9px] font-mono uppercase text-cyan-300">Min Pitch / Edge</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  p ≥ {rivetBendCalc.minPitchMm} mm
                </div>
                <div className="text-[9px] font-mono text-cyan-400">
                  Edge e ≥ {rivetBendCalc.minEdgeDistMm} mm
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cold Bend Radius & Air Bending Force */}
          <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
            <div className="border-b border-white/10 pb-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  ASM Handbook / Press Brake Formability Check
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {t12(language, '90° Cold Bend Radius & Press Brake Tonnage', '90° Soğuk Büküm Yarıçapı & Abkant Pres Kuvveti')}
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  rivetBendCalc.isBendSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
              >
                {rivetBendCalc.isBendSafe
                  ? t12(language, 'BEND SAFE', 'BÜKÜM GÜVENLİ')
                  : t12(language, 'CRACK RISK!', 'ÇATLAMA RİSKİ!')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Inside Punch Radius R (mm)', 'İç Büküm Yarıçapı R (mm)')}
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  value={insideBendRadiusMm}
                  onChange={(e) => setInsideBendRadiusMm(Math.max(0.2, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Bend Length L (mm)', 'Büküm Boyu L (mm)')}
                </label>
                <input
                  type="number"
                  step={50}
                  min={10}
                  value={bendLengthMm}
                  onChange={(e) => setBendLengthMm(Math.max(10, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                <div className="text-[9px] font-mono uppercase text-slate-400">Min Safe Radius</div>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                  {rivetBendCalc.minRequiredBendRadiusMm} mm
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  R/t ≥ {rivetBendCalc.minRatio} ({alloy.temper})
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                <div className="text-[9px] font-mono uppercase text-slate-400">Rec. V-Die Opening</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  V = {rivetBendCalc.vDieOpeningMm} mm
                </div>
                <div className="text-[9px] font-mono text-slate-400">8 × t rule</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-2.5">
                <div className="text-[9px] font-mono uppercase text-emerald-300">Press Brake Force</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {rivetBendCalc.airBendForceKn.toFixed(1)} kN
                </div>
                <div className="text-[9px] font-mono text-emerald-400">
                  {(rivetBendCalc.airBendForceKn / 9.80665).toFixed(1)} metric tons
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: THERMAL EXPANSION (ΔL) & CNC MILLING PARAMETERS ═══ */}
      {activeTab === 'thermal_cnc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Thermal Expansion */}
          <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                α = {alloy.thermalExp.toFixed(1)} × 10⁻⁶ /K · k = {alloy.thermalCond} W/(m·K)
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t12(language, 'Linear Thermal Expansion (ΔL) & Thermal Stress', 'Boyuna Termal Genleşme (ΔL) & Isıl Gerilme')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Part Length L₀ (mm)', 'Parça Boyu L₀ (mm)')}
                </label>
                <input
                  type="number"
                  min={10}
                  value={thermalLengthMm}
                  onChange={(e) => setThermalLengthMm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {t12(language, 'Temp Change ΔT (°C / K)', 'Sıcaklık Farkı ΔT (°C)')}
                </label>
                <input
                  type="number"
                  step={5}
                  value={deltaTC}
                  onChange={(e) => setDeltaTC(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-3">
                <div className="text-[9px] font-mono uppercase text-cyan-300">Length Change (ΔL)</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {thermalCncCalc.deltaLMm >= 0 ? '+' : ''}
                  {thermalCncCalc.deltaLMm.toFixed(3)} mm
                </div>
                <div className="text-[10px] font-mono text-cyan-400">
                  ({thermalCncCalc.deltaLMicrons.toFixed(0)} μm)
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3">
                <div className="text-[9px] font-mono uppercase text-amber-300">Constrained Stress (σ_th)</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  {thermalCncCalc.constrainedStressMpa.toFixed(1)} MPa
                </div>
                <div className="text-[10px] font-mono text-amber-400">
                  If ends are rigidly fixed (E={alloy.modulusGPa} GPa)
                </div>
              </div>
            </div>
          </div>

          {/* CNC Milling Speeds & Feeds */}
          <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                Carbide Endmill Vc = {thermalCncCalc.vc} m/min · Machinability: {alloy.machinability}
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {t12(language, 'CNC Milling Spindle RPM, Feed & MRR Sizer', 'CNC Freze Devir (RPM), İlerleme ve Talaş Hacmi')}
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Tool Ø (mm)</label>
                <input
                  type="number"
                  min={1}
                  value={toolDiaMm}
                  onChange={(e) => setToolDiaMm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Flutes Z</label>
                <select
                  value={fluteCount}
                  onChange={(e) => setFluteCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-white"
                >
                  <option value={2}>2 Flutes</option>
                  <option value={3}>3 Flutes (Alu)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">ap (mm)</label>
                <input
                  type="number"
                  min={0.5}
                  value={axialDocMm}
                  onChange={(e) => setAxialDocMm(Math.max(0.2, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">ae (mm)</label>
                <input
                  type="number"
                  min={0.5}
                  value={radialWocMm}
                  onChange={(e) => setRadialWocMm(Math.max(0.2, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-2.5">
                <div className="text-[9px] font-mono uppercase text-cyan-300">Spindle Speed (n)</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {thermalCncCalc.rpm.toLocaleString()} RPM
                </div>
                <div className="text-[9px] font-mono text-cyan-400">Vc = {thermalCncCalc.vc} m/min</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-2.5">
                <div className="text-[9px] font-mono uppercase text-emerald-300">Table Feed (Vf)</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {thermalCncCalc.feedRateMmMin.toLocaleString()} mm/m
                </div>
                <div className="text-[9px] font-mono text-emerald-400">fz = {thermalCncCalc.fzMm} mm/tooth</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                <div className="text-[9px] font-mono uppercase text-slate-400">Chip Removal (Q)</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {thermalCncCalc.mrrCm3Min.toFixed(1)} cm³/m
                </div>
                <div className="text-[9px] font-mono text-slate-400">ZrN / DLC uncoated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: LIVE SIDE-BY-SIDE ALLOY COMPARATOR ═══ */}
      {activeTab === 'compare' && (
        <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-slate-300">
              {t12(language, 'Comparing Primary Alloy:', 'Karşılaştırılan Ana Alaşım:')}{' '}
              <strong className="text-cyan-300">{alloy.name}</strong> vs
            </div>
            <select
              value={compareSlug}
              onChange={(e) => setCompareSlug(e.target.value)}
              className="rounded-lg border border-cyan-500/40 bg-[var(--bg-0)] px-3 py-1.5 text-xs font-mono font-bold text-white"
            >
              {ALLOY_DATASHEETS.filter((a) => a.slug !== alloy.slug).map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} ({a.family} · Rp0.2 = {a.yieldMPa} MPa · ρ = {a.density.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-slate-400 bg-[var(--bg-0)]">
                  <th className="py-2 px-3">Property</th>
                  <th className="py-2 px-3 text-cyan-300">{alloy.name}</th>
                  <th className="py-2 px-3 text-amber-300">{compareTarget.name}</th>
                  <th className="py-2 px-3 text-right">Delta / Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <tr>
                  <td className="py-2 px-3 text-slate-400">Density (ρ)</td>
                  <td className="py-2 px-3 font-bold text-white">{alloy.density.toFixed(2)} g/cm³</td>
                  <td className="py-2 px-3 font-bold text-white">{compareTarget.density.toFixed(2)} g/cm³</td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {(((alloy.density - compareTarget.density) / compareTarget.density) * 100).toFixed(1)}% mass
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">Yield Strength (Rp0.2)</td>
                  <td className="py-2 px-3 font-bold text-cyan-300">{alloy.yieldMPa} MPa</td>
                  <td className="py-2 px-3 font-bold text-amber-300">{compareTarget.yieldMPa} MPa</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">
                    {alloy.yieldMPa >= compareTarget.yieldMPa
                      ? `+${alloy.yieldMPa - compareTarget.yieldMPa} MPa (${alloy.name})`
                      : `-${compareTarget.yieldMPa - alloy.yieldMPa} MPa`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">Ultimate Tensile (Rm)</td>
                  <td className="py-2 px-3 font-bold text-white">{alloy.tensileMPa} MPa</td>
                  <td className="py-2 px-3 font-bold text-white">{compareTarget.tensileMPa} MPa</td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {alloy.tensileMPa - compareTarget.tensileMPa >= 0 ? '+' : ''}
                    {alloy.tensileMPa - compareTarget.tensileMPa} MPa
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">Specific Yield (Rp0.2 / ρ)</td>
                  <td className="py-2 px-3 font-bold text-white">
                    {(alloy.yieldMPa / alloy.density).toFixed(1)} kN·m/kg
                  </td>
                  <td className="py-2 px-3 font-bold text-white">
                    {(compareTarget.yieldMPa / compareTarget.density).toFixed(1)} kN·m/kg
                  </td>
                  <td className="py-2 px-3 text-right text-cyan-300">
                    Strength-to-Weight Ratio
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">Fatigue Limit (5×10⁸ cyc)</td>
                  <td className="py-2 px-3 font-bold text-white">{alloy.fatigueLimitMPa ?? '—'} MPa</td>
                  <td className="py-2 px-3 font-bold text-white">{compareTarget.fatigueLimitMPa ?? '—'} MPa</td>
                  <td className="py-2 px-3 text-right text-slate-400">RR Moore rotating beam</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">Weldability / Joining</td>
                  <td className="py-2 px-3 font-bold text-white">{alloy.weldability}</td>
                  <td className="py-2 px-3 font-bold text-white">{compareTarget.weldability}</td>
                  <td className="py-2 px-3 text-right">
                    <Link href={`/materials/${compareTarget.slug}/`} className="text-cyan-400 hover:underline">
                      Open {compareTarget.name} →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

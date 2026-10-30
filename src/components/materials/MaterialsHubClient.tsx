'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ALLOY_DATASHEETS,
  COMPARE_PAIRS,
  type AluminumStockShape,
  calculateAlloyShapeWeight,
} from '@/data/alloyDatasheets';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  Search,
  Scale,
  Filter,
  ArrowUpDown,
  Flame,
  Wrench,
  Layers,
  GitCompare,
  Sparkles,
} from 'lucide-react';

type ApplicationGoal =
  | 'all'
  | 'welded'
  | 'cnc'
  | 'sheet_bend'
  | 'marine'
  | 'aerospace'
  | 'extrusion';

export function MaterialsHubClient() {
  const { language } = useI18nStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [goal, setGoal] = useState<ApplicationGoal>('all');
  const [minYieldMpa, setMinYieldMpa] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'yieldDesc' | 'densityAsc' | 'thermalDesc' | 'nameAsc'>('yieldDesc');

  // ─── Multi-Metal & Alloy Quick Weight Calculator State ───────────────────
  const [selectedMetalSlug, setSelectedMetalSlug] = useState<string>('2024-t3');
  const [shape, setShape] = useState<AluminumStockShape>('plate');
  const [lengthMm, setLengthMm] = useState<number>(1000);
  const [widthMm, setWidthMm] = useState<number>(500);
  const [thicknessMm, setThicknessMm] = useState<number>(10);
  const [outerDiaMm, setOuterDiaMm] = useState<number>(60);
  const [wallMm, setWallMm] = useState<number>(5);
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerKg, setPricePerKg] = useState<number>(6.5);

  const EXTRA_METALS = [
    { slug: 'steel_s355', name: 'Structural Steel S355 / A36', density: 7.85, yieldMPa: 355 },
    { slug: 'ss_304', name: 'Stainless Steel 304 / A2', density: 8.00, yieldMPa: 215 },
    { slug: 'ti_6al4v', name: 'Titanium Grade 5 (Ti-6Al-4V)', density: 4.43, yieldMPa: 880 },
    { slug: 'copper_c110', name: 'Electrolytic Copper C110', density: 8.96, yieldMPa: 220 },
    { slug: 'brass_c360', name: 'Free-Cutting Brass C360', density: 8.50, yieldMPa: 310 },
  ];

  const activeDensity = useMemo(() => {
    const alu = ALLOY_DATASHEETS.find((a) => a.slug === selectedMetalSlug);
    if (alu) return alu.density;
    const ext = EXTRA_METALS.find((m) => m.slug === selectedMetalSlug);
    return ext ? ext.density : 2.78;
  }, [selectedMetalSlug]);

  const quickWeight = useMemo(
    () =>
      calculateAlloyShapeWeight({
        shape,
        lengthMm,
        widthMm,
        thicknessMm,
        outerDiaMm,
        innerDiaMm: Math.max(0, outerDiaMm - 2 * wallMm),
        wallMm,
        acrossFlatsMm: outerDiaMm,
        quantity,
        densityGcm3: activeDensity,
        pricePerKgUsd: pricePerKg,
      }),
    [shape, lengthMm, widthMm, thicknessMm, outerDiaMm, wallMm, quantity, activeDensity, pricePerKg]
  );

  const filteredAlloys = useMemo(() => {
    return ALLOY_DATASHEETS.filter((a) => {
      if (selectedFamily !== 'all' && a.family !== selectedFamily) return false;
      if (a.yieldMPa < minYieldMpa) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          a.name.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          a.standard.toLowerCase().includes(q) ||
          a.blurb.toLowerCase().includes(q) ||
          a.applications.some((app) => app.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (goal === 'welded' && a.weldability === 'Poor') return false;
      if (goal === 'cnc' && a.machinability === 'Poor') return false;
      if (goal === 'sheet_bend' && (a.minBendRadiusRatio ?? 3) > 2.0) return false;
      if (goal === 'marine' && a.family !== '5xxx') return false;
      if (goal === 'aerospace' && a.family !== '2xxx' && a.family !== '7xxx') return false;
      if (goal === 'extrusion' && a.family !== '6xxx') return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'yieldDesc') return b.yieldMPa - a.yieldMPa;
      if (sortBy === 'densityAsc') return a.density - b.density;
      if (sortBy === 'thermalDesc') return b.thermalCond - a.thermalCond;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedFamily, goal, minYieldMpa, sortBy]);

  return (
    <div className="space-y-8">
      {/* ═══ TOP TRENDING ALLOY SHORTCUTS (Highlighting 2024-T3, 6061-T6, 7075-T6, 5083-H116) ═══ */}
      <section className="rounded-xl border border-cyan-500/30 bg-[var(--bg-1)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {t12(language, 'Most-Used Industrial Alloy Datasheets & Calculators', 'En Çok Kullanılan Endüstriyel Alaşım Veri Sayfaları & Hesaplayıcılar')}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            {ALLOY_DATASHEETS.length} Certified Series (1xxx – 7xxx)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { slug: '2024-t3', badge: '🔥 #1 Aerospace Skin', accent: 'border-amber-500/40 bg-amber-950/15 text-amber-300' },
            { slug: '6061-t6', badge: '⭐ Structural Standard', accent: 'border-cyan-500/40 bg-cyan-950/15 text-cyan-300' },
            { slug: '7075-t6', badge: '⚡ Max Strength (505 MPa)', accent: 'border-emerald-500/40 bg-emerald-950/15 text-emerald-300' },
            { slug: '5083-h116', badge: '⚓ Marine & Cryogenic', accent: 'border-blue-500/40 bg-blue-950/15 text-blue-300' },
          ].map((item) => {
            const a = ALLOY_DATASHEETS.find((x) => x.slug === item.slug);
            if (!a) return null;
            return (
              <Link
                key={a.slug}
                href={`/materials/${a.slug}/`}
                className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-3.5 hover:border-cyan-400/60 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[9.5px] font-mono font-bold ${item.accent}`}>
                      {item.badge}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">ρ={a.density.toFixed(2)}</span>
                  </div>
                  <div className="text-base font-black text-white group-hover:text-cyan-300 mt-2">
                    {a.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Rp0.2: <strong className="text-white">{a.yieldMPa} MPa</strong> · Rm: <strong className="text-white">{a.tensileMPa} MPa</strong>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>{a.standard.split('/')[0]}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Open Workbench →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ LIVE MULTI-ALLOY & METAL WEIGHT / COST CALCULATOR ═══ */}
      <section className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-cyan-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {t12(
                  language,
                  'Instant Aluminum & Structural Metal Weight / Cost Calculator',
                  'Canlı Alüminyum ve Mühendislik Metalleri Ağırlık & Maliyet Hesaplayıcı'
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t12(
                  language,
                  'Uses exact alloy density (e.g., 2.78 g/cm³ for 2024-T3, 2.81 g/cm³ for 7075-T6, 2.66 g/cm³ for 5083-H116) instead of generic 2.70 approximations.',
                  'Standart 2.70 varsayımı yerine gerçek alaşım yoğunluklarını (2024-T3: 2.78, 7075-T6: 2.81, 5083-H116: 2.66 g/cm³) kullanır.'
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/materials/${ALLOY_DATASHEETS.some((a) => a.slug === selectedMetalSlug) ? selectedMetalSlug : '2024-t3'}/`}
            className="text-xs font-mono font-bold text-cyan-300 hover:underline"
          >
            View Full Alloy Datasheet →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t12(language, 'Select Alloy / Metal', 'Alaşım / Metal Seçimi')}
              </label>
              <select
                value={selectedMetalSlug}
                onChange={(e) => setSelectedMetalSlug(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-2 text-xs font-mono text-white"
              >
                <optgroup label="Aluminum Alloys (Certified ρ)">
                  {ALLOY_DATASHEETS.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name} — ρ = {a.density.toFixed(2)} g/cm³ (Rp0.2 = {a.yieldMPa} MPa)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Reference Engineering Metals">
                  {EXTRA_METALS.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} — ρ = {m.density.toFixed(2)} g/cm³
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                {t12(language, 'Stock Shape', 'Kesit Tipi')}
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as AluminumStockShape)}
                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-2 text-xs font-mono text-cyan-300"
              >
                <option value="plate">Plate / Sheet</option>
                <option value="round_bar">Round Bar</option>
                <option value="hex_bar">Hex Bar</option>
                <option value="round_tube">Round Tube</option>
                <option value="rect_tube">Rect / Box Tube</option>
                <option value="ring_flange">Ring / Disc</option>
              </select>
            </div>

            {shape !== 'ring_flange' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Length L (mm)</label>
                <input
                  type="number"
                  min={1}
                  value={lengthMm}
                  onChange={(e) => setLengthMm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
            )}

            {(shape === 'plate' || shape === 'rect_tube') && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Width W (mm)</label>
                <input
                  type="number"
                  min={1}
                  value={widthMm}
                  onChange={(e) => setWidthMm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                />
              </div>
            )}

            {(shape === 'plate' || shape === 'rect_tube' || shape === 'ring_flange') && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {shape === 'rect_tube' ? 'Height H (mm)' : 'Thickness t (mm)'}
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={thicknessMm}
                  onChange={(e) => setThicknessMm(Math.max(0.2, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
            )}

            {(shape === 'round_bar' || shape === 'hex_bar' || shape === 'round_tube' || shape === 'ring_flange') && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {shape === 'hex_bar' ? 'Across Flats (mm)' : 'Outer Ø OD (mm)'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={outerDiaMm}
                  onChange={(e) => setOuterDiaMm(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
            )}

            {(shape === 'round_tube' || shape === 'rect_tube' || shape === 'ring_flange') && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Wall w (mm)</label>
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

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Qty (pcs)</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.round(Number(e.target.value))))}
                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Price ($/kg)</label>
              <input
                type="number"
                step={0.2}
                min={0}
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300"
              />
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-3 flex flex-col justify-between">
              <div className="text-[9.5px] font-mono uppercase text-cyan-300 font-bold">
                True Mass (ρ={activeDensity.toFixed(2)})
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white my-1">
                {quickWeight.totalMassKg.toFixed(2)} kg
              </div>
              <div className="text-[10px] font-mono text-cyan-400">
                {quickWeight.totalMassLb.toFixed(1)} lb
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3 flex flex-col justify-between">
              <div className="text-[9.5px] font-mono uppercase text-amber-300 font-bold">
                vs 2.70 Myth
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white my-1">
                {quickWeight.massDeltaKg >= 0 ? '+' : ''}
                {quickWeight.massDeltaKg.toFixed(2)} kg
              </div>
              <div className="text-[10px] font-mono text-amber-400">
                ({quickWeight.massErrorPct >= 0 ? '+' : ''}
                {quickWeight.massErrorPct.toFixed(1)}% diff)
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3 flex flex-col justify-between">
              <div className="text-[9.5px] font-mono uppercase text-emerald-300 font-bold">
                Est. Cost
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white my-1">
                ${quickWeight.totalCostUsd.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                {quickWeight.totalVolumeCm3.toFixed(0)} cm³
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTERACTIVE ALLOY SELECTOR WIZARD & MATRIX TABLE ═══ */}
      <section className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-cyan-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                {t12(language, 'Interactive Engineering Alloy Selector & Property Matrix', 'İnteraktif Mühendislik Alaşım Seçici & Özellik Matrisi')}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t12(
                language,
                'Filter by manufacturing process, series, or minimum yield strength (Rp0.2) to find the exact alloy for your design.',
                'Üretim yöntemine, alaşım serisine veya minimum akma dayanımına (Rp0.2) göre filtreleyerek projenize en uygun alaşımı seçin.'
              )}
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t12(language, 'Search 2024, 6061, marine, aircraft...', '2024, 6061, denizcilik, uçak ara...')}
              className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] pl-8 pr-3 py-1.5 text-xs font-mono text-white"
            />
          </div>
        </div>

        {/* Process / Goal Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', labelEn: 'All Applications (15)', labelTr: 'Tüm Uygulamalar (15)' },
            { id: 'aerospace', labelEn: '✈ Aerospace High-Strength (2xxx / 7xxx)', labelTr: '✈ Havacılık & Yüksek Mukavemet (2xxx / 7xxx)' },
            { id: 'welded', labelEn: '🔥 TIG/MIG Welded Structures', labelTr: '🔥 TIG/MIG Kaynaklı Yapılar' },
            { id: 'cnc', labelEn: '⚙ Precision CNC Machining', labelTr: '⚙ Hassas CNC İşleme' },
            { id: 'sheet_bend', labelEn: '📐 Sheet Metal Cold Bending', labelTr: '📐 Abkant Sac Büküm' },
            { id: 'marine', labelEn: '⚓ Marine & Saltwater (5xxx)', labelTr: '⚓ Denizcilik & Tuzlu Su (5xxx)' },
            { id: 'extrusion', labelEn: '🏗 Structural & T-Slot Extrusions (6xxx)', labelTr: '🏗 Yapısal & Sigma Profiller (6xxx)' },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGoal(g.id as ApplicationGoal)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                goal === g.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'border border-white/10 bg-[var(--bg-0)] text-slate-400 hover:text-white'
              }`}
            >
              {t12(language, g.labelEn, g.labelTr)}
            </button>
          ))}
        </div>

        {/* Series + Min Yield + Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', '1xxx', '2xxx', '3xxx', '5xxx', '6xxx', '7xxx'].map((fam) => (
              <button
                key={fam}
                type="button"
                onClick={() => setSelectedFamily(fam)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold cursor-pointer ${
                  selectedFamily === fam
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[var(--bg-0)] text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                {fam.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <span className="text-[10px] uppercase text-slate-400 shrink-0">Min Rp0.2: {minYieldMpa} MPa</span>
            <input
              type="range"
              min={0}
              max={480}
              step={20}
              value={minYieldMpa}
              onChange={(e) => setMinYieldMpa(Number(e.target.value))}
              className="w-full accent-[var(--cyan)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1 text-xs font-mono text-white"
            >
              <option value="yieldDesc">Sort: Yield Strength (High → Low)</option>
              <option value="densityAsc">Sort: Density (Lightest → Heaviest)</option>
              <option value="thermalDesc">Sort: Thermal Cond. (High → Low)</option>
              <option value="nameAsc">Sort: Alloy Designation (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Complete Comparison Matrix Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[var(--bg-0)] text-[10px] uppercase text-slate-400">
                <th className="py-2.5 px-3">Alloy & Temper</th>
                <th className="py-2.5 px-2.5">Series</th>
                <th className="py-2.5 px-2.5">Density (ρ)</th>
                <th className="py-2.5 px-2.5">Yield Rp0.2</th>
                <th className="py-2.5 px-2.5">Tensile Rm</th>
                <th className="py-2.5 px-2.5">Shear τu</th>
                <th className="py-2.5 px-2.5">Elong.</th>
                <th className="py-2.5 px-2.5">Weldability</th>
                <th className="py-2.5 px-2.5">Machinability</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredAlloys.map((a) => (
                <tr key={a.slug} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3">
                    <Link href={`/materials/${a.slug}/`} className="font-bold text-white hover:text-cyan-300">
                      {a.name}
                    </Link>
                    <span className="block text-[10px] text-slate-500">{a.standard}</span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-400">{a.family}</td>
                  <td className="py-2.5 px-2.5 font-bold text-cyan-300">{a.density.toFixed(2)} g/cm³</td>
                  <td className="py-2.5 px-2.5 font-bold text-emerald-300">{a.yieldMPa} MPa</td>
                  <td className="py-2.5 px-2.5 text-white">{a.tensileMPa} MPa</td>
                  <td className="py-2.5 px-2.5 text-slate-300">{a.shearMPa ?? '—'} MPa</td>
                  <td className="py-2.5 px-2.5 text-slate-300">{a.elongationPct}%</td>
                  <td className="py-2.5 px-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        a.weldability === 'Excellent'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : a.weldability === 'Good'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {a.weldability}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-300">{a.machinability}</td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      href={`/materials/${a.slug}/`}
                      className="inline-flex items-center rounded border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Datasheet & Calc →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ HEAD-TO-HEAD ALLOY COMPARISONS ═══ */}
      <section className="work-card">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare size={15} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-white">
            {t12(language, 'Direct Head-to-Head Alloy Comparisons', 'Doğrudan Başa Baş Alaşım Karşılaştırmaları')}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPARE_PAIRS.map(([a, b]) => (
            <Link key={`${a}-vs-${b}`} href={`/compare/${a}-vs-${b}/`} className="work-btn">
              {a.toUpperCase()} vs {b.toUpperCase()} →
            </Link>
          ))}
          <Link href="/handbook/" className="work-btn-primary">
            Full Engineering Handbook →
          </Link>
        </div>
      </section>
    </div>
  );
}

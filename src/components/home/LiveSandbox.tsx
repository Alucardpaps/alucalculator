'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Zap, Scale, Layers, Copy, Check, Sparkles } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getSandbox } from '@/locales/chromeTranslations';

export function LiveSandbox() {
  const { language } = useI18nStore();
  const s = getSandbox(language);

  const [activeTab, setActiveTab] = useState<'bolt' | 'alloy' | 'beam'>('bolt');

  // --- Bolt Torque State ---
  const [boltSize, setBoltSize] = useState<number>(12); // M12
  const [strengthClass, setStrengthClass] = useState<'8.8' | '10.9' | '12.9'>('8.8');
  const [friction, setFriction] = useState<number>(0.12);
  const [copied, setCopied] = useState(false);

  // --- Alloy Mass State ---
  const [selectedAlloy, setSelectedAlloy] = useState<string>('6061-t6');
  const [length, setLength] = useState<number>(500); // mm
  const [width, setWidth] = useState<number>(100); // mm
  const [thickness, setThickness] = useState<number>(15); // mm

  // --- Beam Deflection State ---
  const [beamType, setBeamType] = useState<'simply' | 'cantilever'>('simply');
  const [spanLength, setSpanLength] = useState<number>(1000); // mm
  const [appliedForce, setAppliedForce] = useState<number>(2500); // N

  // --- Bolt Calculation Math (VDI 2230) ---
  const boltResults = useMemo(() => {
    const pitchMap: Record<number, number> = { 6: 1.0, 8: 1.25, 10: 1.5, 12: 1.75, 14: 2.0, 16: 2.0, 20: 2.5, 24: 3.0, 30: 3.5 };
    const p = pitchMap[boltSize] || 1.75;
    const d2 = boltSize - 0.6495 * p;
    const d3 = boltSize - 1.2268 * p;
    const As = (Math.PI / 4) * Math.pow((d2 + d3) / 2, 2);

    const yieldMap: Record<string, number> = { '8.8': 640, '10.9': 900, '12.9': 1080 };
    const Rp02 = yieldMap[strengthClass] || 640;

    const FM_N = 0.9 * Rp02 * As * 0.95;
    const FM_kN = FM_N / 1000;

    const Dkm = 1.3 * boltSize;
    const MA_Nm = (FM_N * (0.16 * p + 0.58 * d2 * friction + (Dkm / 2) * friction)) / 1000;

    return {
      torque: MA_Nm.toFixed(1),
      preload: FM_kN.toFixed(1),
      area: As.toFixed(0)
    };
  }, [boltSize, strengthClass, friction]);

  // --- Alloy Mass Calculation Math ---
  const alloyResults = useMemo(() => {
    const alloys: Record<string, { name: string; density: number; pricePerKg: number }> = {
      '6061-t6': { name: 'Aluminium 6061-T6', density: 2.70, pricePerKg: 4.5 },
      '7075-t6': { name: 'Aluminium 7075-T6 Aerospace', density: 2.81, pricePerKg: 9.8 },
      '2024-t3': { name: 'Aluminium 2024-T3', density: 2.78, pricePerKg: 7.2 },
      'ti-6al-4v': { name: 'Titanium Ti-6Al-4V', density: 4.43, pricePerKg: 38.0 },
      'ss-316l': { name: 'Stainless Steel 316L', density: 8.00, pricePerKg: 6.5 },
      'tool-d2': { name: 'Tool Steel D2', density: 7.70, pricePerKg: 8.2 },
    };

    const sel = alloys[selectedAlloy] || alloys['6061-t6'];
    const volumeCm3 = (length * width * thickness) / 1000;
    const massKg = (volumeCm3 * sel.density) / 1000;
    const estCost = massKg * sel.pricePerKg;

    return {
      name: sel.name,
      volumeCm3: volumeCm3.toFixed(1),
      massKg: massKg.toFixed(2),
      cost: estCost.toFixed(2)
    };
  }, [selectedAlloy, length, width, thickness]);

  // --- Beam Deflection Math ---
  const beamResults = useMemo(() => {
    const E = 210000;
    const b = 50;
    const h = 100;
    const I = (b * Math.pow(h, 3)) / 12;
    const W = (b * Math.pow(h, 2)) / 6;

    const L = spanLength;
    const F = appliedForce;

    let deflection = 0;
    let maxMoment = 0;

    if (beamType === 'simply') {
      deflection = (F * Math.pow(L, 3)) / (48 * E * I);
      maxMoment = (F * L) / 4;
    } else {
      deflection = (F * Math.pow(L, 3)) / (3 * E * I);
      maxMoment = F * L;
    }

    const stressMPa = maxMoment / W;
    const yieldStress = 250;
    const safetyFactor = yieldStress / (stressMPa || 1);

    return {
      deflection: deflection.toFixed(2),
      stress: stressMPa.toFixed(1),
      safetyFactor: safetyFactor > 20 ? '>20' : safetyFactor.toFixed(2)
    };
  }, [beamType, spanLength, appliedForce]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mb-6 sm:mb-10 rounded-2xl sm:rounded-3xl border border-white/12 bg-gradient-to-r from-[#0b0f19] via-[#0e1322] to-[#0a0d16] p-4 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Activity size={15} />
            </span>
            <h2 className="text-base sm:text-xl font-black text-white">
              {s.title}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            {s.subtitle}
          </p>
        </div>

        {/* Tab Buttons (Horizontal scroll on mobile) */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar p-1 rounded-xl bg-black/50 border border-white/10 sm:overflow-visible">
          <button
            type="button"
            onClick={() => setActiveTab('bolt')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'bolt' ? 'bg-[#6b9fff] text-black shadow-md shadow-[#6b9fff]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.tabBolt}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alloy')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'alloy' ? 'bg-[#6b9fff] text-black shadow-md shadow-[#6b9fff]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.tabAlloy}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beam')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              activeTab === 'beam' ? 'bg-[#6b9fff] text-black shadow-md shadow-[#6b9fff]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.tabBeam}
          </button>
        </div>
      </div>

      {/* Tab 1: Bolt Torque */}
      {activeTab === 'bolt' && (
        <div className="pt-4 sm:pt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>{s.boltSize}</span>
                <span className="text-[#6b9fff] font-bold">M{boltSize}</span>
              </div>
              <input
                type="range"
                min="6"
                max="30"
                step="2"
                value={boltSize}
                onChange={(e) => setBoltSize(Number(e.target.value))}
                className="w-full accent-[#6b9fff] h-3 sm:h-2 rounded-lg bg-black/60 cursor-pointer touch-manipulation"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  {s.strengthClass}
                </label>
                <div className="flex gap-1.5 sm:gap-2">
                  {(['8.8', '10.9', '12.9'] as const).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setStrengthClass(cls)}
                      className={`flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                        strengthClass === cls
                          ? 'border-[#6b9fff] bg-[#6b9fff]/20 text-white font-black'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>{s.friction}</span>
                  <span className="text-[#6b9fff] font-bold">{friction.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.08"
                  max="0.20"
                  step="0.01"
                  value={friction}
                  onChange={(e) => setFriction(Number(e.target.value))}
                  className="w-full accent-[#6b9fff] h-3 sm:h-2 rounded-lg bg-black/60 cursor-pointer touch-manipulation"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-xl sm:rounded-2xl border border-white/15 bg-black/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b9fff] font-bold">
                {s.result}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`${boltResults.torque} N·m / ${boltResults.preload} kN`)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? s.copied : s.copy}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-emerald-400">{boltResults.torque}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.torque}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-[#6b9fff]">{boltResults.preload}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.preload}
                </p>
              </div>
            </div>

            <Link
              href="/bolt-torque/"
              className="w-full py-2.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#6b9fff] to-[#4b86e8] text-black font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-[#6b9fff]/20"
            >
              <span>{s.openSolver}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Alloy Mass Truth */}
      {activeTab === 'alloy' && (
        <div className="pt-4 sm:pt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                {s.material}
              </label>
              <select
                value={selectedAlloy}
                onChange={(e) => setSelectedAlloy(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/60 py-2.5 px-3 text-xs text-white outline-none focus:border-[#6b9fff]"
              >
                <option value="6061-t6">Aluminium 6061-T6 (2.70 g/cm³)</option>
                <option value="7075-t6">Aluminium 7075-T6 Aerospace (2.81 g/cm³)</option>
                <option value="2024-t3">Aluminium 2024-T3 (2.78 g/cm³)</option>
                <option value="ti-6al-4v">Titanium Ti-6Al-4V Grade 5 (4.43 g/cm³)</option>
                <option value="ss-316l">Stainless Steel 316L (8.00 g/cm³)</option>
                <option value="tool-d2">Tool Steel D2 (7.70 g/cm³)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">{s.length}</span>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">{s.width}</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">{s.thickness}</span>
                <input
                  type="number"
                  value={thickness}
                  onChange={(e) => setThickness(Math.max(0.1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-xl sm:rounded-2xl border border-white/15 bg-black/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
              {s.massMetrics}
            </span>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-amber-400">{alloyResults.massKg}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.mass}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-[#6b9fff]">{alloyResults.volumeCm3}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.volume}
                </p>
              </div>
            </div>

            <Link
              href="/handbook/"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-amber-400/20"
            >
              <span>{s.openAlloys}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 3: Beam Deflection */}
      {activeTab === 'beam' && (
        <div className="pt-4 sm:pt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                {s.support}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBeamType('simply')}
                  className={`flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                    beamType === 'simply'
                      ? 'border-cyan-400 bg-cyan-400/20 text-white font-black'
                      : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.simply}
                </button>
                <button
                  type="button"
                  onClick={() => setBeamType('cantilever')}
                  className={`flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                    beamType === 'cantilever'
                      ? 'border-cyan-400 bg-cyan-400/20 text-white font-black'
                      : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.cantilever}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>{s.span}</span>
                  <span className="text-cyan-400 font-bold">{spanLength} mm</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={spanLength}
                  onChange={(e) => setSpanLength(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-3 sm:h-2 rounded-lg bg-black/60 cursor-pointer touch-manipulation"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>{s.load}</span>
                  <span className="text-cyan-400 font-bold">{(appliedForce / 1000).toFixed(1)} kN</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={appliedForce}
                  onChange={(e) => setAppliedForce(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-3 sm:h-2 rounded-lg bg-black/60 cursor-pointer touch-manipulation"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-xl sm:rounded-2xl border border-white/15 bg-black/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              {s.defStress}
            </span>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-cyan-400">{beamResults.deflection}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.deflection}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <p className="text-xl sm:text-2xl font-black text-[#6b9fff]">{beamResults.stress}</p>
                <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                  {s.stress}
                </p>
              </div>
            </div>

            <Link
              href="/beam-deflection/"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-[#6b9fff] text-black font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-cyan-400/20"
            >
              <span>{s.openBeam}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { Disc, Settings, ShieldCheck, AlertTriangle, Copy, Check, Info, Zap } from 'lucide-react';

const MATERIALS: Array<{ id: string; name: string; Sy: number; Sut: number }> = [
  { id: 's355', name: 'S355 / A572', Sy: 355, Sut: 510 },
  { id: 'c45', name: 'C45 / AISI 1045', Sy: 430, Sut: 650 },
  { id: '42crmo4', name: '42CrMo4 / AISI 4140', Sy: 750, Sut: 950 },
  { id: 'aisi304', name: 'AISI 304 stainless', Sy: 215, Sut: 505 },
];

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(d) + 'e6';
  if (a >= 1000) return n.toFixed(1);
  if (a >= 10) return n.toFixed(d);
  return n.toFixed(Math.min(3, d + 1));
}

import ShaftDesignModule from '@/modules/mechanical/ShaftDesign';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export default function ShaftsModule() {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();
  const [designMode, setDesignMode] = useState<'stepped_cad' | 'simple_quick'>('stepped_cad');
  const [length, setLength] = useState(500);
  const [forcePos, setForcePos] = useState(250);
  const [force, setForce] = useState(2000);
  const [torque, setTorque] = useState(80);
  const [diameter, setDiameter] = useState(30);
  const [fosTarget, setFosTarget] = useState(2);
  const [matId, setMatId] = useState('c45');
  const [copiedReport, setCopiedReport] = useState(false);

  const mat = MATERIALS.find((m) => m.id === matId) ?? MATERIALS[1];

  const results = useMemo(() => {
    const L = Math.max(1, length);
    const a = Math.min(Math.max(0.1, forcePos), L - 0.1);
    const F = Math.max(0, force);
    const T_Nmm = Math.max(0, torque) * 1000;
    const d = Math.max(0.5, diameter);
    const Sy = mat.Sy;

    const Ra = (F * (L - a)) / L;
    const Rb = (F * a) / L;
    const M = (F * a * (L - a)) / L;

    const d3 = Math.pow(d, 3);
    const sigma = (32 * M) / (Math.PI * d3);
    const tau = (16 * T_Nmm) / (Math.PI * d3);
    const svm = Math.sqrt(sigma * sigma + 3 * tau * tau);
    const fos = svm > 1e-9 ? Sy / svm : Infinity;

    const n = Math.max(1, fosTarget);
    const dReq = Math.pow(
      (32 * n) / (Math.PI * Sy) * Math.sqrt(M * M + 0.75 * T_Nmm * T_Nmm),
      1 / 3,
    );

    return {
      a,
      Ra,
      Rb,
      M,
      sigma,
      tau,
      svm,
      fos,
      dReq,
      isSafe: fos >= n,
    };
  }, [length, forcePos, force, torque, diameter, fosTarget, mat]);

  const copyReport = () => {
    const text = `=== STATIC SHAFT SIZING & STRESS REPORT (von Mises, distortion energy) ===
Method: Static Sizing (methodId: shaft-static-quick)
[Note: For multi-step shoulder notches and DIN 743 fatigue verification, switch to Stepped Shaft CAD mode]
Span L: ${length} mm | Load Position a: ${forcePos} mm
Transverse Force F: ${force} N | Torque T: ${torque} N·m
Diameter d: ${diameter} mm | Material: ${mat.name} (Sy: ${mat.Sy} MPa)
Reactions: Ra = ${fmt(results.Ra, 1)} N, Rb = ${fmt(results.Rb, 1)} N
Max Bending Moment M: ${fmt(results.M / 1000, 2)} N·m
Bending Stress σb: ${fmt(results.sigma, 1)} MPa | Torsion Shear τ: ${fmt(results.tau, 1)} MPa
von Mises Stress σvm: ${fmt(results.svm, 1)} MPa
Factor of Safety FoS: ${fmt(results.fos, 2)} (Target: ${fosTarget})
Required Diameter d_req: ${fmt(results.dReq, 1)} mm
Status: ${results.isSafe ? 'SAFE' : 'OVERSTRESSED'}`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[var(--bg-0)] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Sleek Segmented Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-1)] border-b border-[var(--line)] text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--alu-dim)] text-[10px] uppercase tracking-wider font-semibold">{t12(language, 'Mode:', 'Mod:')}</span>
          <div className="inline-flex rounded p-0.5 bg-[var(--bg-0)] border border-[var(--line)]">
            <button
              onClick={() => setDesignMode('stepped_cad')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                designMode === 'stepped_cad'
                  ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
              }`}
            >
              {t12(language, 'Stepped Shaft CAD & DIN 743', 'Kademeli Mil CAD & DIN 743')}
            </button>
            <button
              onClick={() => setDesignMode('simple_quick')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                designMode === 'simple_quick'
                  ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/50 font-bold shadow-sm'
                  : 'text-[var(--alu-dim)] hover:text-white border border-transparent'
              }`}
            >
              {t12(language, 'Single-Step Quick Sizing', 'Tek Kademe Hızlı Hesap')}
            </button>
          </div>
        </div>
      </div>

      {designMode === 'stepped_cad' ? (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ShaftDesignModule />
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* SOL: Girdiler */}
          <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Header Card with Inline Standards */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shrink-0">
                <Disc size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
                  <span>{t12(language, 'Static Shaft Sizing & Stress', 'Statik Mil Boyutlandırma ve Gerilme')}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {['von Mises (DE)', t12(language, 'static', 'statik')].map((std) => (
                      <span key={std} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold">
                        {std}
                      </span>
                    ))}
                  </div>
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t12(language, 'Reactions · von Mises · static distortion-energy sizing (notch fatigue: Stepped Shaft · DIN 743)', 'Tepkiler · von Mises · statik biçim değiştirme enerjisi çapı (çentik yorulması: Kademeli Mil · DIN 743)')}
                </p>
              </div>
            </div>
          </div>

          {/* Geometry & Load Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Settings size={14} /> {t12(language, 'Geometry & Loading', 'Geometri ve Yükleme')}
              </h2>
              <span className="text-[10px] text-[var(--muted)] font-mono">σvm = √(σ² + 3τ²)</span>
            </div>

            <Num label={t12(language, 'Span L', 'Açıklık L')} unit="mm" value={length} min={50} max={5000} step={10} onChange={setLength} />
            <Num label={t12(language, 'Load position a (from left)', 'Yük konumu a (soldan)')} unit="mm" value={forcePos} min={1} max={length - 1} step={5} onChange={setForcePos} />
            <Num label={t12(language, 'Transverse force F', 'Enine kuvvet F')} unit="N" value={force} min={0} max={1e6} step={50} onChange={setForce} />
            <Num label={t12(language, 'Torque T', 'Tork T')} unit="N·m" value={torque} min={0} max={50000} step={1} onChange={setTorque} />
            <Num label={t12(language, 'Trial diameter d', 'Deneme çapı d')} unit="mm" value={diameter} min={4} max={400} step={0.5} onChange={setDiameter} />
            <Num label={t12(language, 'Target factor of safety', 'Hedef emniyet katsayısı')} unit="" value={fosTarget} min={1} max={8} step={0.1} onChange={setFosTarget} />

            <div className="pt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5">{t12(language, 'Material', 'Malzeme')}</span>
              <select
                value={matId}
                onChange={(e) => setMatId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              >
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · Sy {m.Sy} MPa (Sut {m.Sut} MPa)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ORTA: Görüntü (CAD Visualizer & Bending Moment Diagram) */}
        <div className="flex-1 min-w-0 min-h-[500px] lg:min-h-0 flex flex-col bg-[var(--bg-0)] border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {t12(language, 'Shaft Loading & Bending Moment Diagram (BMD)', 'Mil Yükleme ve Eğilme Momenti Diyagramı (BMD)')}
              </span>
              <span className="text-xs font-mono text-cyan-400">
                L = {length} mm | Ø {diameter} mm | M_max = {fmt(results.M / 1000, 2)} N·m
              </span>
            </div>

            <ShaftMechanicalDiagramSVG
              length={length}
              loadPos={forcePos}
              force={force}
              torque={torque}
              diameter={diameter}
              ra={results.Ra}
              rb={results.Rb}
              maxMoment={results.M / 1000}
              isSafe={results.isSafe}
              language={language}
            />
          </div>

          {/* Governing Equations Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> {t12(language, 'Governing formulas (static)', 'Esas alınan formüller (statik)')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] font-mono text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">{t12(language, 'Static Reactions & Bending:', 'Statik Tepkiler ve Eğilme:')}</span>
                <p>Ra = F·(L−a)/L = {fmt(results.Ra, 1)} N</p>
                <p>Rb = F·a/L = {fmt(results.Rb, 1)} N</p>
                <p className="text-cyan-400 font-bold">M_max = F·a·(L−a)/L = {fmt(results.M / 1000, 2)} N·m</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">{t12(language, 'Stress & static sizing:', 'Gerilme ve statik boyutlandırma:')}</span>
                <p>σb = 32M/(πd³) = {fmt(results.sigma, 1)} MPa</p>
                <p>τ = 16T/(πd³) = {fmt(results.tau, 1)} MPa</p>
                <p className="text-emerald-400 font-bold">σvm = √(σb² + 3τ²) = {fmt(results.svm, 1)} MPa</p>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: Çıktılar & KPIs */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[var(--bg-1)]/90 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Overall Safety Banner */}
          <div
            className={`rounded-2xl border p-4 flex items-center justify-between gap-3 shadow-xl ${
              results.isSafe
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {results.isSafe ? <ShieldCheck size={26} className="shrink-0 text-emerald-400" /> : <AlertTriangle size={26} className="shrink-0 text-rose-400" />}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">
                  {results.isSafe
                    ? t12(language, 'Statically safe (von Mises)', 'Statik olarak güvenli (von Mises)')
                    : t12(language, 'Overstressed (FoS Violation)', 'Aşırı Gerilme (Emniyet Katsayısı İhlali)')}
                </div>
                <div className="text-[11px] mt-0.5 opacity-90">
                  {results.isSafe
                    ? `FoS ${fmt(results.fos, 2)} ≥ ${t12(language, 'Target', 'Hedef')} ${fmt(fosTarget, 1)}`
                    : `FoS ${fmt(results.fos, 2)} < ${t12(language, 'Target', 'Hedef')} ${fmt(fosTarget, 1)}. ${t12(language, 'Req', 'Gereken')} d ≥ ${fmt(results.dReq, 1)} mm`}
                </div>
              </div>
            </div>
            <button
              onClick={copyReport}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
              title={t12(language, 'Copy Calculation Report', 'Hesaplama Raporunu Kopyala')}
            >
              {copiedReport ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          {/* ═══ DIN 743 / ASME B106.1M Actionable Engineering Advice Card ═══ */}
          <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
            !results.isSafe
              ? 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
              : results.fos < fosTarget * 1.25
              ? 'bg-[var(--warn)]/10 border-[var(--warn)]/40 text-[var(--warn)]'
              : 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
          }`}>
            <div className="font-bold flex items-center justify-between uppercase text-[10px] tracking-wider">
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="shrink-0" />
                <span>{t12(language, 'Design advice', 'Tasarım tavsiyesi')}</span>
              </div>
              <span className="font-mono text-[9px] opacity-80">{mat.name} · Sy={mat.Sy} MPa</span>
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[var(--ink)]">
              {!results.isSafe ? (
                t12(
                  language,
                  `Safety target breached! Current diameter (Ø${diameter} mm) yields FoS = ${fmt(results.fos, 2)} < ${fmt(fosTarget, 1)}. Increase shaft diameter to at least Ø${Math.ceil(results.dReq)} mm (static distortion-energy minimum; check fatigue in stepped mode) or select a higher strength alloy (e.g. 42CrMo4 with Sy=750 MPa).`,
                  `Emniyet katsayısı hedefi ihlal edildi! Mevcut mil çapı (Ø${diameter} mm) ile FoS = ${fmt(results.fos, 2)} < ${fmt(fosTarget, 1)}. Mil çapını en az Ø${Math.ceil(results.dReq)} mm'ye (statik asgari çap; yorulmayı kademeli modda kontrol edin) büyütün veya daha yüksek akma dayanımlı çeliğe (ör. 42CrMo4, Sy=750 MPa) geçin.`
                )
              ) : results.fos < fosTarget * 1.25 ? (
                t12(
                  language,
                  `Borderline safety margin (FoS = ${fmt(results.fos, 2)} vs target ${fmt(fosTarget, 1)}). If operating under dynamic reversing bending or heavy torque spikes, account for notch concentration factors (Kf) by using stepped CAD mode.`,
                  `Sınırda emniyet marjı (FoS = ${fmt(results.fos, 2)}, hedef ${fmt(fosTarget, 1)}). Dinamik yön değiştiren eğilme veya ani tork darbeleri söz konusuysa kademeli CAD sekmesinden çentik faktörlerini (Kf) hesaba katın.`
                )
              ) : (
                t12(
                  language,
                  `Compliant shaft sizing. Combined bending and torsional equivalent stress (σvm = ${fmt(results.svm, 1)} MPa) is well within material elastic limits with FoS = ${fmt(results.fos, 2)} ≥ ${fmt(fosTarget, 1)}.`,
                  `Uygun mil boyutlandırması. Bileşik eğilme ve burulma eşdeğer gerilmesi (σvm = ${fmt(results.svm, 1)} MPa), FoS = ${fmt(results.fos, 2)} ≥ ${fmt(fosTarget, 1)} ile malzemenin elastik sınırları içindedir.`
                )
              )}
            </p>
          </div>

          {/* 4 Core KPIs in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                von Mises σvm
              </span>
              <div className={`text-xl font-mono font-black ${results.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fmt(results.svm, 1)} <span className="text-xs font-normal text-slate-400">MPa</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {t12(language, 'Yield Sy:', 'Akma Sy:')} {mat.Sy} MPa
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                {t12(language, 'Safety Factor (FoS)', 'Emniyet Katsayısı (FoS)')}
              </span>
              <div className={`text-xl font-mono font-black ${results.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fmt(results.fos, 2)}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {t12(language, 'Target: ≥', 'Hedef: ≥')} {fmt(fosTarget, 1)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                {t12(language, 'Max Bending M', 'Maks Eğilme M')}
              </span>
              <div className="text-xl font-mono font-black text-cyan-400">
                {fmt(results.M / 1000, 2)} <span className="text-xs font-normal text-slate-400">N·m</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {t12(language, 'at x =', 'x = konumunda')} {forcePos} mm
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                {t12(language, 'Required d (static)', 'Gereken çap d (statik)')}
              </span>
              <div className="text-xl font-mono font-black text-white">
                {fmt(results.dReq, 1)} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {t12(language, 'Trial:', 'Deneme:')} {diameter} mm
              </p>
            </div>
          </div>

          {/* Detailed Reactions & Stresses */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-800 pb-1.5">
              {t12(language, 'Support Reactions & Stress Breakdown', 'Yatak Tepkileri ve Gerilme Dağılımı')}
            </span>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
              <span className="text-slate-400">{t12(language, 'Left Reaction Ra:', 'Sol Yatak Tepkisi Ra:')}</span>
              <span className="text-cyan-300 font-bold">{fmt(results.Ra, 1)} N</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
              <span className="text-slate-400">{t12(language, 'Right Reaction Rb:', 'Sağ Yatak Tepkisi Rb:')}</span>
              <span className="text-cyan-300 font-bold">{fmt(results.Rb, 1)} N</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
              <span className="text-slate-400">{t12(language, 'Bending Stress σb:', 'Eğilme Gerilmesi σb:')}</span>
              <span className="text-white font-bold">{fmt(results.sigma, 1)} MPa</span>
            </div>
            <div className="flex justify-between py-1 font-mono">
              <span className="text-slate-400">{t12(language, 'Torsional Shear τ:', 'Burulma Kayma Gerilmesi τ:')}</span>
              <span className="text-white font-bold">{fmt(results.tau, 1)} MPa</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function ShaftMechanicalDiagramSVG({
  length,
  loadPos,
  force,
  torque,
  diameter,
  ra,
  rb,
  maxMoment,
  isSafe,
  language,
}: {
  length: number;
  loadPos: number;
  force: number;
  torque: number;
  diameter: number;
  ra: number;
  rb: number;
  maxMoment: number;
  isSafe: boolean;
  language: string;
}) {
  const x0 = 70;
  const x1 = 530;
  const spanPx = x1 - x0;
  const ratio = Math.max(0.01, Math.min(0.99, loadPos / Math.max(1, length)));
  const xF = x0 + ratio * spanPx;

  const yShaft = 90;
  const shaftHeight = Math.max(14, Math.min(36, Math.round(diameter * 0.4)));

  // Bending moment curve scaling
  const yBmdBase = 250;
  const maxBmdHeight = 65;
  const yBmdPeak = yBmdBase - maxBmdHeight;

  return (
    <svg viewBox="0 0 600 290" className="w-full h-auto bg-slate-950/90 rounded-xl border border-slate-800 shadow-inner">
      <defs>
        <marker id="arrowCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 2 L 10 5 L 0 8 z" fill="#06b6d4" />
        </marker>
        <marker id="arrowRose" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 2 L 10 5 L 0 8 z" fill="#f43f5e" />
        </marker>
        <marker id="arrowEmerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 2 L 10 5 L 0 8 z" fill="#10b981" />
        </marker>
        <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="bmdFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* --- TOP: SHAFT & SUPPORTS --- */}
      {/* Dimension Line: Span L */}
      <line x1={x0} y1={30} x2={x1} y2={30} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
      <line x1={x0} y1={25} x2={x0} y2={35} stroke="#64748b" strokeWidth="1" />
      <line x1={x1} y1={25} x2={x1} y2={35} stroke="#64748b" strokeWidth="1" />
      <text x={(x0 + x1) / 2} y={23} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
        {t12(language, 'Span L =', 'Açıklık L =')} {length} mm
      </text>

      {/* Dimension Line: Load Position a */}
      {ratio < 0.85 && (
        <>
          <line x1={x0} y1={42} x2={xF} y2={42} stroke="#38bdf8" strokeWidth="1" />
          <line x1={x0} y1={39} x2={x0} y2={45} stroke="#38bdf8" strokeWidth="1" />
          <line x1={xF} y1={39} x2={xF} y2={45} stroke="#38bdf8" strokeWidth="1" />
          <text x={(x0 + xF) / 2} y={40} fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
            a = {loadPos} mm
          </text>
        </>
      )}

      {/* Shaft Body */}
      <rect
        x={x0 - 25}
        y={yShaft - shaftHeight / 2}
        width={spanPx + 50}
        height={shaftHeight}
        fill="url(#shaftGrad)"
        stroke="#64748b"
        strokeWidth="1.5"
        rx="3"
      />

      {/* Centerline */}
      <line x1={x0 - 35} y1={yShaft} x2={x1 + 35} y2={yShaft} stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="10 3 2 3" opacity="0.6" />

      {/* Bearing Support A (Pinned) */}
      <polygon points={`${x0},${yShaft + shaftHeight / 2} ${x0 - 12},${yShaft + shaftHeight / 2 + 20} ${x0 + 12},${yShaft + shaftHeight / 2 + 20}`} fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={x0 - 16} y1={yShaft + shaftHeight / 2 + 21} x2={x0 + 16} y2={yShaft + shaftHeight / 2 + 21} stroke="#94a3b8" strokeWidth="2" />
      {/* Ra Vector */}
      <line x1={x0} y1={yShaft + shaftHeight / 2 + 45} x2={x0} y2={yShaft + shaftHeight / 2 + 24} stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowEmerald)" />
      <text x={x0} y={yShaft + shaftHeight / 2 + 58} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        Ra={fmt(ra, 0)}N
      </text>

      {/* Bearing Support B (Roller) */}
      <polygon points={`${x1},${yShaft + shaftHeight / 2} ${x1 - 12},${yShaft + shaftHeight / 2 + 16} ${x1 + 12},${yShaft + shaftHeight / 2 + 16}`} fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx={x1 - 7} cy={yShaft + shaftHeight / 2 + 19} r="2.5" fill="#94a3b8" />
      <circle cx={x1 + 7} cy={yShaft + shaftHeight / 2 + 19} r="2.5" fill="#94a3b8" />
      <line x1={x1 - 16} y1={yShaft + shaftHeight / 2 + 23} x2={x1 + 16} y2={yShaft + shaftHeight / 2 + 23} stroke="#94a3b8" strokeWidth="2" />
      {/* Rb Vector */}
      <line x1={x1} y1={yShaft + shaftHeight / 2 + 45} x2={x1} y2={yShaft + shaftHeight / 2 + 25} stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowEmerald)" />
      <text x={x1} y={yShaft + shaftHeight / 2 + 58} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        Rb={fmt(rb, 0)}N
      </text>

      {/* Applied Force F Vector */}
      {force > 0 && (
        <>
          <line x1={xF} y1={48} x2={xF} y2={yShaft - shaftHeight / 2 - 2} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowRose)" />
          <text x={xF} y={42} fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            F = {force} N
          </text>
        </>
      )}

      {/* Torsion Torque Symbol at right end */}
      {torque > 0 && (
        <g transform={`translate(${x1 + 30}, ${yShaft})`}>
          <circle cx="0" cy="0" r="10" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="14 6" />
          <polygon points="5,-9 10,-9 7,-4" fill="#eab308" />
          <text x="14" y="4" fill="#eab308" fontSize="9" fontFamily="monospace" fontWeight="bold">
            T={torque}N·m
          </text>
        </g>
      )}

      {/* --- BOTTOM: BENDING MOMENT DIAGRAM (BMD) --- */}
      {/* Baseline */}
      <line x1={x0} y1={yBmdBase} x2={x1} y2={yBmdBase} stroke="#475569" strokeWidth="1.5" />
      <text x={x0 - 5} y={yBmdBase + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">M=0</text>
      <text x={x1 + 5} y={yBmdBase + 3} fill="#64748b" fontSize="9" fontFamily="monospace">M=0</text>

      {/* BMD Curve Polygon */}
      <polygon
        points={`${x0},${yBmdBase} ${xF},${yBmdPeak} ${x1},${yBmdBase}`}
        fill="url(#bmdFillGrad)"
        stroke="#06b6d4"
        strokeWidth="2"
      />

      {/* Peak Dimension Indicator */}
      <circle cx={xF} cy={yBmdPeak} r="3.5" fill="#06b6d4" />
      <line x1={xF} y1={yBmdPeak} x2={xF} y2={yBmdBase} stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <text x={xF} y={yBmdPeak - 6} fill="#22d3ee" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
        M_max = {fmt(maxMoment, 2)} N·m
      </text>
      <text x="300" y="278" fill="#64748b" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
        {t12(language, 'Bending Moment Distribution Diagram M(x) along shaft span', 'Mil boyunca eğilme momenti dağılımı diyagramı M(x)')}
      </text>
    </svg>
  );
}

function Num({
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
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-slate-400">
        <span>{label}</span>
        <span className="text-cyan-300 font-bold">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--cyan)] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
      />
    </label>
  );
}

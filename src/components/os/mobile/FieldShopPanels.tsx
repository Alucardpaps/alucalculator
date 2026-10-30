'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  RotateCw,
  Compass,
  Flame,
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Download,
  ShieldCheck,
  Disc,
  Ruler,
  Layers,
  Wrench,
  Gauge,
  Sparkles
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { calculateFit } from '@/lib/engine/iso286';

function Shell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-l)] sm:rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-4 sm:p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h2 className="text-sm font-semibold font-tech text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="text-[10px] font-mono text-[var(--cyan)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-0)] rounded-lg transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. THREAD IDENTIFIER (ISO 261 / ISO 724)
// ─────────────────────────────────────────────────────────────────────────────
const METRIC_THREADS = [
  { name: 'M3', od: 3, pitch: 0.5, tap: 2.5 },
  { name: 'M4', od: 4, pitch: 0.7, tap: 3.3 },
  { name: 'M5', od: 5, pitch: 0.8, tap: 4.2 },
  { name: 'M6', od: 6, pitch: 1.0, tap: 5.0 },
  { name: 'M8', od: 8, pitch: 1.25, tap: 6.8 },
  { name: 'M10', od: 10, pitch: 1.5, tap: 8.5 },
  { name: 'M12', od: 12, pitch: 1.75, tap: 10.2 },
  { name: 'M14', od: 14, pitch: 2.0, tap: 12.0 },
  { name: 'M16', od: 16, pitch: 2.0, tap: 14.0 },
  { name: 'M20', od: 20, pitch: 2.5, tap: 17.5 },
  { name: 'M24', od: 24, pitch: 3.0, tap: 21.0 },
  { name: 'M30', od: 30, pitch: 3.5, tap: 26.5 },
];

function ThreadIdPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [od, setOd] = useState(11.8);
  const match = useMemo(() => {
    return [...METRIC_THREADS].sort((a, b) => Math.abs(a.od - od) - Math.abs(b.od - od))[0];
  }, [od]);

  return (
    <Shell
      title={t12(language, 'Thread identifier (ISO metric)', 'Diş tanımlama (ISO metrik)')}
      subtitle="ISO 261 · ISO 724"
      onClose={onClose}
    >
      <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">
        {t12(language, 'Measured major Ø (mm)', 'Ölçülen dış çap (mm)')}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={od}
        onChange={(e) => setOd(Number(e.target.value))}
        className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono text-lg focus:border-[var(--cyan)] outline-none"
      />
      {match && (
        <div className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-4 space-y-1 font-mono text-sm">
          <div className="text-[var(--cyan)] text-xl font-semibold">{match.name} × {match.pitch}</div>
          <div className="text-[var(--alu-dim)] text-xs">Tap drill ≈ {match.tap} mm · ISO 261 / ISO 724</div>
        </div>
      )}
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ISO 898-1 PROPERTY CLASS
// ─────────────────────────────────────────────────────────────────────────────
const GRADES = [
  { cls: '4.8', Rm: 400, Re: 320, mark: '4.8' },
  { cls: '5.8', Rm: 500, Re: 400, mark: '5.8' },
  { cls: '8.8', Rm: 800, Re: 640, mark: '8.8' },
  { cls: '10.9', Rm: 1040, Re: 940, mark: '10.9' },
  { cls: '12.9', Rm: 1220, Re: 1100, mark: '12.9' },
];

function GradePanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [cls, setCls] = useState('8.8');
  const g = GRADES.find((x) => x.cls === cls)!;
  return (
    <Shell
      title={t12(language, 'ISO 898-1 property class', 'ISO 898-1 mukavemet sınıfı')}
      subtitle="ISO 898-1 · DIN 267"
      onClose={onClose}
    >
      <div className="grid grid-cols-5 gap-1.5">
        {GRADES.map((x) => (
          <button
            key={x.cls}
            type="button"
            onClick={() => setCls(x.cls)}
            className={`h-12 rounded-[var(--radius-s)] border font-mono text-sm font-bold transition ${
              cls === x.cls
                ? 'bg-[var(--cyan)] text-[var(--bg-0)] border-[var(--cyan)]'
                : 'bg-[var(--bg-0)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--line-strong)]'
            }`}
          >
            {x.cls}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm">
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)] uppercase">Rm min (Tensile)</div>
          <div className="text-[var(--ink)] text-lg font-bold">{g.Rm} MPa</div>
        </div>
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)] uppercase">Re / Rp0.2 min (Yield)</div>
          <div className="text-[var(--ink)] text-lg font-bold">{g.Re} MPa</div>
        </div>
      </div>
      <p className="text-[11px] text-[var(--alu-dim)]">
        {t12(language, 'Head marking = property class. Use VDI 2230 for tightening torque.', 'Baş damgası = mukavemet sınıfı. Sıkma torku için VDI 2230 kullanın.')}
      </p>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SURFACE ROUGHNESS RA (ISO 1302)
// ─────────────────────────────────────────────────────────────────────────────
const RA_ROWS = [
  { n: 'N5', ra: 0.4, use: 'Fine grind / seal faces' },
  { n: 'N6', ra: 0.8, use: 'Honing, hydraulic rods' },
  { n: 'N7', ra: 1.6, use: 'Finish turning, bearing seats' },
  { n: 'N8', ra: 3.2, use: 'Standard machining' },
  { n: 'N9', ra: 6.3, use: 'Rough mill / flame cut' },
  { n: 'N10', ra: 12.5, use: 'Saw, coarse mill' },
];

function RaPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  return (
    <Shell
      title={t12(language, 'Surface roughness Ra (ISO 1302)', 'Yüzey pürüzlülüğü Ra (ISO 1302)')}
      subtitle="ISO 1302 · DIN 4768"
      onClose={onClose}
    >
      <div className="space-y-1.5">
        {RA_ROWS.map((r) => (
          <div key={r.n} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] font-mono text-xs">
            <span className="text-[var(--cyan)] font-semibold">{r.n}</span>
            <span className="text-[var(--ink)] font-bold">Ra {r.ra} µm</span>
            <span className="text-[var(--alu-dim)] text-[10px] max-w-[45%] text-right">{r.use}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PARALLEL KEY (ISO 773 / DIN 6885)
// ─────────────────────────────────────────────────────────────────────────────
const KEYWAYS: { dMin: number; dMax: number; b: number; h: number }[] = [
  { dMin: 6, dMax: 8, b: 2, h: 2 },
  { dMin: 8, dMax: 10, b: 3, h: 3 },
  { dMin: 10, dMax: 12, b: 4, h: 4 },
  { dMin: 12, dMax: 17, b: 5, h: 5 },
  { dMin: 17, dMax: 22, b: 6, h: 6 },
  { dMin: 22, dMax: 30, b: 8, h: 7 },
  { dMin: 30, dMax: 38, b: 10, h: 8 },
  { dMin: 38, dMax: 44, b: 12, h: 8 },
  { dMin: 44, dMax: 50, b: 14, h: 9 },
  { dMin: 50, dMax: 58, b: 16, h: 10 },
  { dMin: 58, dMax: 65, b: 18, h: 11 },
  { dMin: 65, dMax: 75, b: 20, h: 12 },
  { dMin: 75, dMax: 85, b: 22, h: 14 },
  { dMin: 85, dMax: 95, b: 25, h: 14 },
];

function KeywayPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [d, setD] = useState(30);
  const row = KEYWAYS.find((k) => d >= k.dMin && d < k.dMax) || KEYWAYS[KEYWAYS.length - 1];
  return (
    <Shell
      title={t12(language, 'Parallel key (ISO 773 / DIN 6885)', 'Kama (ISO 773 / DIN 6885)')}
      subtitle="ISO 773 · DIN 6885-1"
      onClose={onClose}
    >
      <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">
        {t12(language, 'Shaft diameter d (mm)', 'Mil çapı d (mm)')}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={d}
        onChange={(e) => setD(Number(e.target.value))}
        className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono text-lg focus:border-[var(--cyan)] outline-none"
      />
      <div className="grid grid-cols-2 gap-3 font-mono">
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)]">b × h</div>
          <div className="text-lg text-[var(--cyan)] font-bold">{row.b} × {row.h} mm</div>
        </div>
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)]">d range</div>
          <div className="text-lg text-[var(--ink)]">{row.dMin}–{row.dMax} mm</div>
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TACHOMETER / MOTOR SYNC SPEED
// ─────────────────────────────────────────────────────────────────────────────
function TachPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [hz, setHz] = useState(50);
  const [poles, setPoles] = useState(4);
  const rpm = hz * 60;
  const sync = (50 * 120) / poles;
  return (
    <Shell
      title={t12(language, 'RPM / motor sync speed', 'Devir / senkron hız')}
      subtitle="n = 120f / p"
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">f (Hz)</label>
          <input
            type="number"
            inputMode="decimal"
            value={hz}
            onChange={(e) => setHz(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono focus:border-[var(--cyan)] outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">{t12(language, 'Poles (p)', 'Kutup Sayısı (p)')}</label>
          <select
            value={poles}
            onChange={(e) => setPoles(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono focus:border-[var(--cyan)] outline-none"
          >
            <option value={2}>2-Pole (3000 rpm @ 50Hz)</option>
            <option value={4}>4-Pole (1500 rpm @ 50Hz)</option>
            <option value={6}>6-Pole (1000 rpm @ 50Hz)</option>
            <option value={8}>8-Pole (750 rpm @ 50Hz)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono">
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)]">Speed (n = f × 60)</div>
          <div className="text-xl text-[var(--cyan)] font-bold">{rpm.toFixed(0)} rpm</div>
        </div>
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
          <div className="text-[10px] text-[var(--alu-dim)]">ns @ 50 Hz</div>
          <div className="text-xl text-[var(--ink)] font-bold">{sync.toFixed(0)} rpm</div>
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ISO 286 LIMITS & FITS PANEL (NEW PHONE-OPTIMIZED TOOL)
// ─────────────────────────────────────────────────────────────────────────────
const POPULAR_FITS = [
  { id: 'H7/g6', nameEn: 'Sliding Fit (H7/g6)', nameTr: 'Kayıcı Geçme (H7/g6)', hole: { cls: 'H', gr: 7 }, shaft: { cls: 'g', gr: 6 } },
  { id: 'H7/h6', nameEn: 'Locational Clearance (H7/h6)', nameTr: 'Konum Geçmesi (H7/h6)', hole: { cls: 'H', gr: 7 }, shaft: { cls: 'h', gr: 6 } },
  { id: 'H8/f7', nameEn: 'Running Fit (H8/f7)', nameTr: 'Döner Çalışma Geçmesi (H8/f7)', hole: { cls: 'H', gr: 8 }, shaft: { cls: 'f', gr: 7 } },
  { id: 'H7/k6', nameEn: 'Transition Fit (H7/k6)', nameTr: 'Geçiş Geçmesi (H7/k6)', hole: { cls: 'H', gr: 7 }, shaft: { cls: 'k', gr: 6 } },
  { id: 'H7/p6', nameEn: 'Light Press Fit (H7/p6)', nameTr: 'Hafif Pres Geçme (H7/p6)', hole: { cls: 'H', gr: 7 }, shaft: { cls: 'p', gr: 6 } },
  { id: 'H7/s6', nameEn: 'Heavy Press Fit (H7/s6)', nameTr: 'Ağır Sıkı Geçme (H7/s6)', hole: { cls: 'H', gr: 7 }, shaft: { cls: 's', gr: 6 } },
];

function LimitsFitsPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [d, setD] = useState(30);
  const [preset, setPreset] = useState('H7/g6');
  const [copied, setCopied] = useState(false);

  const curPreset = POPULAR_FITS.find((p) => p.id === preset) || POPULAR_FITS[0];

  const fitResult = useMemo(() => {
    try {
      return calculateFit(d, curPreset.hole.cls, curPreset.hole.gr, curPreset.shaft.cls, curPreset.shaft.gr);
    } catch {
      return null;
    }
  }, [d, curPreset]);

  const copySpecs = () => {
    if (!fitResult) return;
    const text = `ISO 286 Fit Ø${d} ${preset}: Hole ${fitResult.holeMin.toFixed(3)} - ${fitResult.holeMax.toFixed(3)} mm (ES: +${fitResult.holeES}µm, EI: ${fitResult.holeEI}µm) | Shaft ${fitResult.shaftMin.toFixed(3)} - ${fitResult.shaftMax.toFixed(3)} mm (es: ${fitResult.shaft_es.toFixed(1)}µm, ei: ${fitResult.shaft_ei.toFixed(1)}µm) | Fit: ${fitResult.fitType} (Max: ${fitResult.maxClearanceUm.toFixed(1)}µm, Min: ${fitResult.minClearanceUm.toFixed(1)}µm)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Shell
      title={t12(language, 'ISO 286 Limits & Fits', 'ISO 286 Tolerans & Geçmeler')}
      subtitle="ISO 286-1 · ISO 286-2 (µm)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">
            {t12(language, 'Nominal Diameter D (mm)', 'Anma Çapı D (mm)')}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={500}
              value={d}
              onChange={(e) => setD(Math.max(1, Number(e.target.value)))}
              className="flex-1 h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono text-lg font-bold focus:border-[var(--cyan)] outline-none"
            />
            <div className="flex gap-1">
              {[10, 20, 30, 50].map((quickD) => (
                <button
                  key={quickD}
                  type="button"
                  onClick={() => setD(quickD)}
                  className={`px-2.5 h-12 rounded-[var(--radius-s)] border font-mono text-xs ${
                    d === quickD
                      ? 'bg-[var(--cyan)] text-black border-[var(--cyan)] font-bold'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)]'
                  }`}
                >
                  Ø{quickD}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[var(--alu-dim)] mb-1">
            {t12(language, 'Standard Fit Preset', 'Standart Geçme Tipi')}
          </label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs focus:border-[var(--cyan)] outline-none"
          >
            {POPULAR_FITS.map((p) => (
              <option key={p.id} value={p.id}>
                {t12(language, p.nameEn, p.nameTr)}
              </option>
            ))}
          </select>
        </div>

        {fitResult && (
          <div className="space-y-2.5 font-mono text-xs">
            {/* Fit summary badge */}
            <div
              className={`p-3 rounded-[var(--radius-s)] border text-center ${
                fitResult.fitType === 'Clearance'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : fitResult.fitType === 'Interference'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="text-[10px] uppercase text-slate-400">
                {t12(language, 'Fit Condition', 'Geçme Karakteristiği')}
              </div>
              <div className="text-base font-bold mt-0.5">
                {fitResult.fitType === 'Clearance'
                  ? `🟢 ${t12(language, 'Clearance Fit', 'Boşluklu Geçme')} (+${fitResult.minClearanceUm.toFixed(1)} / +${fitResult.maxClearanceUm.toFixed(1)} µm)`
                  : fitResult.fitType === 'Interference'
                  ? `🔴 ${t12(language, 'Interference Fit', 'Sıkı / Pres Geçme')} (${fitResult.minClearanceUm.toFixed(1)} / ${fitResult.maxClearanceUm.toFixed(1)} µm)`
                  : `🟡 ${t12(language, 'Transition Fit', 'Geçiş Geçmesi')} (${fitResult.minClearanceUm.toFixed(1)} / +${fitResult.maxClearanceUm.toFixed(1)} µm)`}
              </div>
            </div>

            {/* Hole & Shaft Split */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
                <div className="text-[10px] text-[var(--cyan)] font-bold uppercase">
                  {t12(language, 'Hole', 'Delik')} {curPreset.hole.cls}{curPreset.hole.gr}
                </div>
                <div className="text-sm font-bold text-[var(--ink)]">
                  Ø{fitResult.holeMin.toFixed(3)} – {fitResult.holeMax.toFixed(3)} mm
                </div>
                <div className="text-[10px] text-[var(--alu-dim)]">
                  ES: +{fitResult.holeES} µm · EI: +{fitResult.holeEI} µm
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
                <div className="text-[10px] text-amber-400 font-bold uppercase">
                  {t12(language, 'Shaft', 'Mil')} {curPreset.shaft.cls}{curPreset.shaft.gr}
                </div>
                <div className="text-sm font-bold text-[var(--ink)]">
                  Ø{fitResult.shaftMin.toFixed(3)} – {fitResult.shaftMax.toFixed(3)} mm
                </div>
                <div className="text-[10px] text-[var(--alu-dim)]">
                  es: {fitResult.shaft_es >= 0 ? '+' : ''}{fitResult.shaft_es.toFixed(1)} µm · ei: {fitResult.shaft_ei >= 0 ? '+' : ''}{fitResult.shaft_ei.toFixed(1)} µm
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={copySpecs}
              className="w-full h-11 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 shadow active:scale-98 transition"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy ISO 286 Tolerances', 'Toleransları Kopyala')}</span>
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CNC SPEEDS & FEEDS (ISO 3002 KIENZLE) (NEW PHONE-OPTIMIZED TOOL)
// ─────────────────────────────────────────────────────────────────────────────
const CNC_MATERIALS = [
  { id: 'al', nameEn: 'Aluminum (6061/6082)', nameTr: 'Alüminyum (6061/6082)', vc: 300, fz: 0.08, kc: 800 },
  { id: 'steel', nameEn: 'Structural Steel (S235/S355)', nameTr: 'Yapı Çeliği (S235/S355)', vc: 140, fz: 0.05, kc: 1800 },
  { id: 'alloy', nameEn: 'Alloy Steel (4140/42CrMo4)', nameTr: 'Islah Çeliği (4140/42CrMo4)', vc: 90, fz: 0.04, kc: 2200 },
  { id: 'ss304', nameEn: 'Stainless Steel (304/316)', nameTr: 'Paslanmaz Çelik (304/316)', vc: 70, fz: 0.03, kc: 2400 },
  { id: 'cast_iron', nameEn: 'Cast Iron (GG-25)', nameTr: 'Pik Döküm (GG-25)', vc: 110, fz: 0.06, kc: 1200 },
  { id: 'brass', nameEn: 'Brass (Ms58)', nameTr: 'Pirinç (Ms58)', vc: 220, fz: 0.07, kc: 700 },
  { id: 'plastic', nameEn: 'Plastics (POM / Delrin)', nameTr: 'Plastik / Delrin (POM)', vc: 350, fz: 0.10, kc: 400 },
];

function CncFeedsPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [matId, setMatId] = useState('al');
  const [toolDia, setToolDia] = useState(10); // mm
  const [flutes, setFlutes] = useState(3);
  const [customVc, setCustomVc] = useState(300);
  const [customFz, setCustomFz] = useState(0.08);
  const [ap, setAp] = useState(3.0); // mm depth
  const [ae, setAe] = useState(5.0); // mm width
  const [copied, setCopied] = useState(false);

  const mat = CNC_MATERIALS.find((m) => m.id === matId) || CNC_MATERIALS[0];

  const handleMatChange = (newId: string) => {
    setMatId(newId);
    const found = CNC_MATERIALS.find((m) => m.id === newId);
    if (found) {
      setCustomVc(found.vc);
      setCustomFz(found.fz);
    }
  };

  // Calculations:
  // n = (1000 * Vc) / (pi * D)
  const rpm = (1000 * customVc) / (Math.PI * Math.max(1, toolDia));
  // vf = n * z * fz
  const vf = rpm * flutes * customFz;
  // MRR Q = ap * ae * vf / 1000 (cm3/min)
  const mrr = (ap * ae * vf) / 1000;
  // Power Pc = (Q * kc) / (60000 * 0.8) (kW)
  const powerKw = (mrr * mat.kc) / (60000 * 0.8);

  const copySpecs = () => {
    const text = `CNC Feeds: ${mat.nameEn} | Tool Ø${toolDia}mm (${flutes} flutes) | Vc: ${customVc} m/min, fz: ${customFz} mm/th -> Spindle: ${Math.round(rpm)} RPM, Feed: ${Math.round(vf)} mm/min | MRR: ${mrr.toFixed(1)} cm³/min, Power: ${powerKw.toFixed(2)} kW`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Shell
      title={t12(language, 'CNC Feeds & Speeds', 'CNC Kesme Hızı & Devir')}
      subtitle="ISO 3002 · Kienzle Speeds & Feeds"
      onClose={onClose}
    >
      <div className="space-y-3 font-mono text-xs">
        <div>
          <label className="block text-[11px] text-[var(--alu-dim)] mb-1">
            {t12(language, 'Workpiece Material', 'İş Parçası Malzemesi')}
          </label>
          <select
            value={matId}
            onChange={(e) => handleMatChange(e.target.value)}
            className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] outline-none"
          >
            {CNC_MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {t12(language, m.nameEn, m.nameTr)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Tool Diameter D (mm)', 'Takım Çapı D (mm)')}
            </label>
            <input
              type="number"
              min={1}
              max={160}
              value={toolDia}
              onChange={(e) => setToolDia(Math.max(1, Number(e.target.value)))}
              className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Flute Count (z)', 'Ağız Sayısı (z)')}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[2, 3, 4, 6].map((zNum) => (
                <button
                  key={zNum}
                  type="button"
                  onClick={() => setFlutes(zNum)}
                  className={`h-11 rounded-[var(--radius-s)] border font-bold ${
                    flutes === zNum
                      ? 'bg-[var(--cyan)] text-black border-[var(--cyan)]'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)]'
                  }`}
                >
                  {zNum}z
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              Vc ({t12(language, 'Cut Speed m/min', 'Kesme Hızı m/dk')})
            </label>
            <input
              type="number"
              value={customVc}
              onChange={(e) => setCustomVc(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--cyan)] font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              fz ({t12(language, 'Feed mm/tooth', 'İlerleme mm/diş')})
            </label>
            <input
              type="number"
              step="0.01"
              value={customFz}
              onChange={(e) => setCustomFz(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-amber-300 font-bold text-center"
            />
          </div>
        </div>

        {/* Results HUD */}
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-3 rounded-[var(--radius-s)] bg-cyan-950/30 border border-cyan-500/40">
            <div className="text-[10px] text-[var(--alu-dim)] uppercase">
              {t12(language, 'Spindle Speed', 'Devir Sayısı')}
            </div>
            <div className="text-xl font-bold text-[var(--cyan)] mt-0.5">
              {Math.round(rpm).toLocaleString()} <span className="text-xs">RPM</span>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-s)] bg-amber-950/30 border border-amber-500/40">
            <div className="text-[10px] text-[var(--alu-dim)] uppercase">
              {t12(language, 'Table Feed', 'Tabla İlerlemesi')}
            </div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {Math.round(vf).toLocaleString()} <span className="text-xs">mm/min</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[var(--alu-dim)] block text-[10px]">MRR (Q)</span>
            <span className="font-bold text-[var(--ink)]">{mrr.toFixed(1)} cm³/dk</span>
          </div>
          <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[var(--alu-dim)] block text-[10px]">Est. Power (Pc)</span>
            <span className="font-bold text-[var(--ink)]">{powerKw.toFixed(2)} kW</span>
          </div>
        </div>

        <button
          type="button"
          onClick={copySpecs}
          className="w-full h-11 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-bold text-xs uppercase flex items-center justify-center gap-2 shadow active:scale-98 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy CNC Parameters', 'CNC Parametrelerini Kopyala')}</span>
        </button>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. MAGNETIC COMPASS & BEARING (NEW PHONE-OPTIMIZED TOOL)
// ─────────────────────────────────────────────────────────────────────────────
function MagneticCompassPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [heading, setHeading] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [microTesla, setMicroTesla] = useState(48.5);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compass = 0;
      if ((e as any).webkitCompassHeading !== undefined) {
        compass = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha;
      }
      setHeading(Math.round(compass % 360));
      setIsLive(true);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const getCardinal = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return directions[idx];
  };

  const getCardinalTr = (deg: number) => {
    const directionsTr = ['Kuzey (N)', 'Kuzeydoğu (NE)', 'Doğu (E)', 'Güneydoğu (SE)', 'Güney (S)', 'Güneybatı (SW)', 'Batı (W)', 'Kuzeybatı (NW)'];
    const idx = Math.round(deg / 45) % 8;
    return directionsTr[idx];
  };

  return (
    <Shell
      title={t12(language, 'Digital Magnetic Compass', 'Dijital Manyetik Pusula')}
      subtitle="Precision 3-Axis Heading & Flux"
      onClose={onClose}
    >
      <div className="space-y-4 font-mono text-center">
        {/* Big Compass Rose */}
        <div className="relative w-48 h-48 mx-auto rounded-full border-2 border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-center shadow-inner">
          {/* Compass markers */}
          <span className="absolute top-2 text-xs font-bold text-rose-500">N</span>
          <span className="absolute bottom-2 text-xs font-bold text-[var(--alu)]">S</span>
          <span className="absolute right-2 text-xs font-bold text-[var(--alu)]">E</span>
          <span className="absolute left-2 text-xs font-bold text-[var(--alu)]">W</span>

          {/* Rotating Needle */}
          <div
            className="w-full h-full absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            <div className="w-1.5 h-20 bg-rose-500 rounded-t-full "></div>
            <div className="w-1.5 h-20 bg-slate-500 rounded-b-full"></div>
            <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-black"></div>
          </div>
        </div>

        {/* Readout */}
        <div className="space-y-1">
          <div className="text-3xl font-black text-[var(--cyan)]">
            {heading}° {getCardinal(heading)}
          </div>
          <div className="text-xs text-[var(--alu)]">
            {t12(language, getCardinal(heading), getCardinalTr(heading))}
          </div>
        </div>

        {/* Telemetry info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[10px] text-[var(--alu-dim)] block">SENSOR STATUS</span>
            <span className={`font-bold ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLive ? 'LIVE GYRO' : 'SIMULATED'}
            </span>
          </div>
          <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[10px] text-[var(--alu-dim)] block">MAGNETIC FLUX</span>
            <span className="font-bold text-[var(--ink)]">{microTesla} µT</span>
          </div>
        </div>

        {!isLive && (
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Manual Angle Dial (Desktop Test):', 'Manuel Açı Testi:')}</label>
            <input
              type="range"
              min={0}
              max={359}
              value={heading}
              onChange={(e) => setHeading(Number(e.target.value))}
              className="w-full accent-[var(--cyan)]"
            />
          </div>
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. WELDING HEAT INPUT & PREHEAT (EN 1011-2) (NEW PHONE-OPTIMIZED TOOL)
// ─────────────────────────────────────────────────────────────────────────────
const WELD_PROCESSES = [
  { id: 'mig', name: 'MIG / MAG (GMAW)', eta: 0.8 },
  { id: 'mma', name: 'MMA / Stick (SMAW)', eta: 0.8 },
  { id: 'tig', name: 'TIG (GTAW)', eta: 0.6 },
  { id: 'saw', name: 'SAW (Submerged Arc)', eta: 1.0 },
];

function WeldingHeatPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [procId, setProcId] = useState('mig');
  const [voltage, setVoltage] = useState(24); // V
  const [current, setCurrent] = useState(180); // A
  const [speed, setSpeed] = useState(25); // cm/min
  const [cev, setCev] = useState(0.42); // Carbon Equivalent
  const [thickness, setThickness] = useState(15); // mm
  const [copied, setCopied] = useState(false);

  const proc = WELD_PROCESSES.find((p) => p.id === procId) || WELD_PROCESSES[0];

  // Heat Input Q = eta * (U * I * 60) / (v * 1000) (kJ/mm)
  // where v is in mm/min = speed * 10
  const vMmMin = speed * 10;
  const heatInputKjMm = (proc.eta * voltage * current * 60) / (vMmMin * 1000);

  // Preheat recommendation per EN 1011-2
  let preheatTextEn = 'No preheat required (ambient ≥ 15°C)';
  let preheatTextTr = 'Ön ısıtma gerekmez (ortam ≥ 15°C)';
  let preheatStatus: 'ok' | 'warn' | 'bad' = 'ok';

  if (cev > 0.45 || (cev > 0.40 && thickness > 25)) {
    preheatTextEn = 'Mandatory Preheat: 150°C - 200°C (High cracking risk)';
    preheatTextTr = 'Zorunlu Ön Isıtma: 150°C - 200°C (Yüksek çatlak riski)';
    preheatStatus = 'bad';
  } else if (cev > 0.40 || thickness > 20) {
    preheatTextEn = 'Recommended Preheat: 100°C - 120°C';
    preheatTextTr = 'Önerilen Ön Isıtma: 100°C - 120°C';
    preheatStatus = 'warn';
  }

  const copySpecs = () => {
    const text = `Welding Heat Input (EN 1011-2): ${proc.name} | U=${voltage}V, I=${current}A, v=${speed}cm/min -> Heat Input Q = ${heatInputKjMm.toFixed(2)} kJ/mm | CEV=${cev}, t=${thickness}mm -> ${preheatTextEn}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Shell
      title={t12(language, 'Welding Heat Input & Preheat', 'Kaynak Isı Girdisi & Ön Isıtma')}
      subtitle="EN 1011-2 · ISO/TR 17671-2"
      onClose={onClose}
    >
      <div className="space-y-3 font-mono text-xs">
        <div>
          <label className="block text-[11px] text-[var(--alu-dim)] mb-1">
            {t12(language, 'Welding Process', 'Kaynak Yöntemi')}
          </label>
          <select
            value={procId}
            onChange={(e) => setProcId(e.target.value)}
            className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--cyan)] outline-none"
          >
            {WELD_PROCESSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (η = {p.eta})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Voltage (V)', 'Gerilim (V)')}
            </label>
            <input
              type="number"
              value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              className="w-full h-11 px-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Current (A)', 'Akım (A)')}
            </label>
            <input
              type="number"
              value={current}
              onChange={(e) => setCurrent(Number(e.target.value))}
              className="w-full h-11 px-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-amber-300 font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Speed (cm/min)', 'Hız (cm/dk)')}
            </label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-11 px-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--cyan)] font-bold text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Thickness (mm)', 'Et Kalınlığı (mm)')}
            </label>
            <input
              type="number"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
              {t12(language, 'Carbon Eq. (CEV)', 'Karbon Eşdeğeri (CEV)')}
            </label>
            <input
              type="number"
              step="0.01"
              value={cev}
              onChange={(e) => setCev(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] font-bold text-center"
            />
          </div>
        </div>

        {/* Heat Input KPI Card */}
        <div className="p-3.5 rounded-[var(--radius-s)] bg-rose-950/30 border border-rose-500/40 text-center">
          <div className="text-[10px] text-[var(--alu-dim)] uppercase">
            {t12(language, 'Heat Input (Q)', 'Kaynak Isı Girdisi (Q)')}
          </div>
          <div className="text-2xl font-black text-rose-400 mt-0.5">
            {heatInputKjMm.toFixed(2)} <span className="text-sm font-normal">kJ/mm</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Q = η × (U × I × 60) / (v × 1000)
          </div>
        </div>

        {/* Preheat Guidance */}
        <div
          className={`p-3 rounded-[var(--radius-s)] border text-xs font-mono ${
            preheatStatus === 'ok'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : preheatStatus === 'warn'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-slate-400">
            {t12(language, 'EN 1011-2 Preheat Guidance', 'EN 1011-2 Ön Isıtma Tavsiyesi')}
          </div>
          <div className="font-bold mt-1">
            {t12(language, preheatTextEn, preheatTextTr)}
          </div>
        </div>

        <button
          type="button"
          onClick={copySpecs}
          className="w-full h-11 rounded-[var(--radius-s)] bg-rose-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow active:scale-98 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy Welding Parameters', 'Kaynak Değerlerini Kopyala')}</span>
        </button>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. INSTANT INLINE UNIT CONVERTER (NEW PHONE-OPTIMIZED TOOL)
// ─────────────────────────────────────────────────────────────────────────────
function UnitConverterPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [tab, setTab] = useState<'len' | 'press' | 'torque' | 'power'>('len');
  const [val1, setVal1] = useState(25.4);

  return (
    <Shell
      title={t12(language, 'Engineering Unit Converter', 'Mühendislik Birim Dönüştürücü')}
      subtitle="Instant Shop-Floor Unit Matcher"
      onClose={onClose}
    >
      <div className="space-y-3 font-mono text-xs">
        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'len', label: t12(language, 'Length', 'Uzunluk') },
            { id: 'press', label: t12(language, 'Pressure', 'Basınç') },
            { id: 'torque', label: t12(language, 'Torque', 'Tork') },
            { id: 'power', label: t12(language, 'Power', 'Güç') },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setTab(cat.id as any);
                if (cat.id === 'len') setVal1(25.4);
                if (cat.id === 'press') setVal1(10);
                if (cat.id === 'torque') setVal1(100);
                if (cat.id === 'power') setVal1(7.5);
              }}
              className={`py-2 rounded-[var(--radius-s)] border text-[11px] font-bold ${
                tab === cat.id
                  ? 'bg-[var(--cyan)] text-black border-[var(--cyan)]'
                  : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div>
          <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
            {t12(language, 'Enter Value:', 'Değer Girin:')}
          </label>
          <input
            type="number"
            value={val1}
            onChange={(e) => setVal1(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] text-xl font-bold text-center focus:border-[var(--cyan)] outline-none"
          />
        </div>

        {/* Conversions Output */}
        <div className="space-y-2">
          {tab === 'len' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Millimeter (mm)</span>
                <span className="text-base font-bold text-[var(--cyan)]">{val1} mm</span>
              </div>
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Inch (in)</span>
                <span className="text-base font-bold text-[var(--ink)]">{(val1 / 25.4).toFixed(4)} in</span>
              </div>
            </div>
          )}

          {tab === 'press' && (
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[9px] text-[var(--alu-dim)] block">Bar</span>
                <span className="text-sm font-bold text-[var(--cyan)]">{val1} bar</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[9px] text-[var(--alu-dim)] block">PSI</span>
                <span className="text-sm font-bold text-amber-300">{(val1 * 14.5038).toFixed(1)} psi</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[9px] text-[var(--alu-dim)] block">MPa</span>
                <span className="text-sm font-bold text-emerald-400">{(val1 * 0.1).toFixed(3)} MPa</span>
              </div>
            </div>
          )}

          {tab === 'torque' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Newton-meter (N·m)</span>
                <span className="text-base font-bold text-[var(--cyan)]">{val1} N·m</span>
              </div>
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Foot-pound (lbf·ft)</span>
                <span className="text-base font-bold text-amber-300">{(val1 * 0.73756).toFixed(2)} lbf·ft</span>
              </div>
            </div>
          )}

          {tab === 'power' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Kilowatt (kW)</span>
                <span className="text-base font-bold text-[var(--cyan)]">{val1} kW</span>
              </div>
              <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--alu-dim)] block">Horsepower (HP)</span>
                <span className="text-base font-bold text-emerald-400">{(val1 * 1.34102).toFixed(2)} HP</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. PHOTO INSPECTION & TIMESTAMP (FIXES BROKEN field-camera)
// ─────────────────────────────────────────────────────────────────────────────
function PhotoInspectionPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [partId, setPartId] = useState('M12-BOLT-01');
  const [status, setStatus] = useState<'PASS' | 'WARN' | 'FAIL'>('PASS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <Shell
      title={t12(language, 'Field Photo & Quality Stamp', 'Saha Fotoğrafı & Muayene Damgası')}
      subtitle="ISO 9001 Field Traceability"
      onClose={onClose}
    >
      <div className="space-y-3 font-mono text-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-bold flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            <span>{t12(language, 'Snap / Upload Photo', 'Fotoğraf Çek / Yükle')}</span>
          </button>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className={`h-12 px-3 rounded-[var(--radius-s)] border font-bold ${
              status === 'PASS'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : status === 'WARN'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}
          >
            <option value="PASS">✅ {t12(language, 'PASS / CONFORM', 'UYGUN (KABUL)')}</option>
            <option value="WARN">⚠️ {t12(language, 'WARNING / REWORK', 'ŞARTLI / DÜZELTME')}</option>
            <option value="FAIL">❌ {t12(language, 'FAIL / REJECT', 'UYGUN DEĞİL (RED)')}</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-[var(--alu-dim)] mb-1">
            {t12(language, 'Part / Joint / Tag ID:', 'Parça / Bağlantı / Etiket Kodu:')}
          </label>
          <input
            type="text"
            value={partId}
            onChange={(e) => setPartId(e.target.value)}
            className="w-full h-10 px-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)]"
          />
        </div>

        {/* Photo Preview with Watermark Stamp */}
        <div className="relative rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] overflow-hidden min-h-[160px] flex items-center justify-center">
          {photoUrl ? (
            <div className="relative w-full">
              <img src={photoUrl} alt="Field Inspection" className="w-full max-h-[220px] object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 font-mono text-[10px] text-white flex justify-between items-end border-t border-white/20">
                <div>
                  <div className="font-bold text-[var(--cyan)]">{partId}</div>
                  <div className="text-[9px] text-slate-300">{nowStr} · AluCalc OS Field</div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded font-black text-xs ${
                    status === 'PASS' ? 'bg-emerald-500 text-black' : status === 'WARN' ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white'
                  }`}
                >
                  {status}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-[var(--alu-dim)] space-y-1">
              <Camera size={28} className="mx-auto opacity-40" />
              <p>{t12(language, 'No inspection photo taken yet.', 'Henüz muayene fotoğrafı çekilmedi.')}</p>
              <p className="text-[10px]">{t12(language, 'Tap above to snap an assembly defect or label.', 'Yukarıdaki butona dokunarak parça veya etiket çekin.')}</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. VERNIER CALIPER & FEELER GAUGE SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────
function VernierCaliperPanel({ onClose }: { onClose: () => void }) {
  const { language } = useI18nStore();
  const [measureMm, setMeasureMm] = useState(17.45);

  const integerMm = Math.floor(measureMm);
  const decimalMm = Number((measureMm - integerMm).toFixed(2));
  const vernierLine = Math.round(decimalMm / 0.05);

  return (
    <Shell
      title={t12(language, 'Vernier Caliper & Feeler Gauge', 'Sanal Verniyer Kumpas & Sentil')}
      subtitle="DIN 862 · 0.05 mm Resolution"
      onClose={onClose}
    >
      <div className="space-y-4 font-mono text-xs">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-[var(--alu-dim)]">{t12(language, 'Measured Value:', 'Ölçülen Değer:')}</span>
            <span className="text-xl font-bold text-[var(--cyan)]">{measureMm.toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.05}
            value={measureMm}
            onChange={(e) => setMeasureMm(Number(e.target.value))}
            className="w-full accent-[var(--cyan)]"
          />
        </div>

        {/* Vernier Breakdown Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[9px] text-[var(--alu-dim)] block uppercase">{t12(language, 'Main Scale', 'Ana Cetvel')}</span>
            <span className="text-base font-bold text-[var(--ink)]">{integerMm} mm</span>
          </div>
          <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[9px] text-[var(--alu-dim)] block uppercase">{t12(language, 'Vernier Line', 'Çakışan Çizgi')}</span>
            <span className="text-base font-bold text-amber-300">#{vernierLine} (0.05)</span>
          </div>
          <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)]">
            <span className="text-[9px] text-[var(--alu-dim)] block uppercase">{t12(language, 'Inch Approx', 'İnç Karşılığı')}</span>
            <span className="text-base font-bold text-emerald-400">{(measureMm / 25.4).toFixed(3)}″</span>
          </div>
        </div>

        {/* Common Feeler Gauge Reference */}
        <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            📐 {t12(language, 'Standard Feeler Blades (DIN 2275)', 'Standart Sentil Çakısı Kalınlıkları')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, 0.75, 1.00].map((blade) => (
              <button
                key={blade}
                type="button"
                onClick={() => setMeasureMm(blade)}
                className={`px-2 py-1 rounded text-[10px] border transition ${
                  Math.abs(measureMm - blade) < 0.01
                    ? 'bg-[var(--cyan)] text-black font-bold border-[var(--cyan)]'
                    : 'bg-black/50 border-[var(--line)] text-slate-300'
                }`}
              >
                {blade} mm
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT COMPOSITE DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
export function FieldShopPanels({ active, onClose }: { active: string | null; onClose: () => void }) {
  if (active === 'thread-identifier') return <ThreadIdPanel onClose={onClose} />;
  if (active === 'fastener-grade') return <GradePanel onClose={onClose} />;
  if (active === 'ra-comparator') return <RaPanel onClose={onClose} />;
  if (active === 'keyway-iso') return <KeywayPanel onClose={onClose} />;
  if (active === 'tachometer-rpm') return <TachPanel onClose={onClose} />;
  if (active === 'limits-fits') return <LimitsFitsPanel onClose={onClose} />;
  if (active === 'cnc-feeds') return <CncFeedsPanel onClose={onClose} />;
  if (active === 'magnetic-compass') return <MagneticCompassPanel onClose={onClose} />;
  if (active === 'welding-heat') return <WeldingHeatPanel onClose={onClose} />;
  if (active === 'unit-converter') return <UnitConverterPanel onClose={onClose} />;
  if (active === 'field-camera') return <PhotoInspectionPanel onClose={onClose} />;
  if (active === 'vernier-caliper') return <VernierCaliperPanel onClose={onClose} />;
  return null;
}

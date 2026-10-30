'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Wrench, Check, Copy, CheckSquare, Square, AlertCircle, ExternalLink } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface BoltTorqueScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BoltClass = '4.8' | '8.8' | '10.9' | '12.9';
type LubricationState = 'dry' | 'light_oil' | 'mos2';

interface SizeData {
  pitch: number;
  asMm2: number;
  dryTorque: Record<BoltClass, number>;
  yieldForceKn: Record<BoltClass, number>;
}

const BOLT_DATA: Record<string, SizeData> = {
  M6: {
    pitch: 1.0,
    asMm2: 20.1,
    dryTorque: { '4.8': 6, '8.8': 12, '10.9': 17, '12.9': 21 },
    yieldForceKn: { '4.8': 6.4, '8.8': 12.9, '10.9': 18.9, '12.9': 22.1 },
  },
  M8: {
    pitch: 1.25,
    asMm2: 36.6,
    dryTorque: { '4.8': 15, '8.8': 30, '10.9': 43, '12.9': 51 },
    yieldForceKn: { '4.8': 11.7, '8.8': 23.4, '10.9': 34.4, '12.9': 40.3 },
  },
  M10: {
    pitch: 1.5,
    asMm2: 58.0,
    dryTorque: { '4.8': 30, '8.8': 59, '10.9': 85, '12.9': 102 },
    yieldForceKn: { '4.8': 18.6, '8.8': 37.1, '10.9': 54.5, '12.9': 63.8 },
  },
  M12: {
    pitch: 1.75,
    asMm2: 84.3,
    dryTorque: { '4.8': 52, '8.8': 104, '10.9': 148, '12.9': 178 },
    yieldForceKn: { '4.8': 27.0, '8.8': 54.0, '10.9': 79.2, '12.9': 92.7 },
  },
  M16: {
    pitch: 2.0,
    asMm2: 157.0,
    dryTorque: { '4.8': 128, '8.8': 257, '10.9': 367, '12.9': 440 },
    yieldForceKn: { '4.8': 50.2, '8.8': 100.5, '10.9': 147.6, '12.9': 172.7 },
  },
  M20: {
    pitch: 2.5,
    asMm2: 245.0,
    dryTorque: { '4.8': 251, '8.8': 502, '10.9': 717, '12.9': 860 },
    yieldForceKn: { '4.8': 78.4, '8.8': 156.8, '10.9': 230.3, '12.9': 269.5 },
  },
  M24: {
    pitch: 3.0,
    asMm2: 353.0,
    dryTorque: { '4.8': 434, '8.8': 868, '10.9': 1240, '12.9': 1490 },
    yieldForceKn: { '4.8': 113.0, '8.8': 225.9, '10.9': 331.8, '12.9': 388.3 },
  },
};

const LUBRICATION_FACTORS: Record<LubricationState, { factor: number; labelEn: string; labelTr: string; k: number }> = {
  dry: { factor: 1.0, labelEn: 'Dry (K=0.20)', labelTr: 'Kuru (K=0.20)', k: 0.20 },
  light_oil: { factor: 0.80, labelEn: 'Lightly Oiled (K=0.16)', labelTr: 'Hafif Yağlı (K=0.16)', k: 0.16 },
  mos2: { factor: 0.65, labelEn: 'MoS2 / Paste (K=0.13)', labelTr: 'MoS2 / Macun (K=0.13)', k: 0.13 },
};

export function BoltTorqueScreeningModal({ isOpen, onClose }: BoltTorqueScreeningModalProps) {
  const { language } = useI18nStore();

  const [selectedSize, setSelectedSize] = useState<string>('M12');
  const [boltClass, setBoltClass] = useState<BoltClass>('8.8');
  const [lubrication, setLubrication] = useState<LubricationState>('dry');
  const [copied, setCopied] = useState(false);

  // Field checklist items
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    class_mark: true,
    thread_clean: true,
    washer_present: true,
    wrench_cal: false,
    star_pattern: false,
    relaxation_recheck: false,
  });

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentData = BOLT_DATA[selectedSize] || BOLT_DATA.M12;
  const lub = LUBRICATION_FACTORS[lubrication];

  const calculatedTorqueNm = Math.round(currentData.dryTorque[boltClass] * lub.factor);
  const yieldPreloadKn = Number((currentData.yieldForceKn[boltClass] * 0.70).toFixed(1));

  const copySummary = () => {
    const text = `AluCalc FIELD | ISO 898-1 Bolt Tightening Screening
Bolt: ${selectedSize} (Pitch: ${currentData.pitch} mm, As: ${currentData.asMm2} mm²)
Property Class: ${boltClass}
Condition: ${lub.labelEn}
Target Torque: ${calculatedTorqueNm} N·m
Preload Force FM (approx): ${yieldPreloadKn} kN
Checklist: ${Object.values(checklist).filter(Boolean).length}/6 verified
Screening only (±25% friction scatter). For critical joints verify per VDI 2230.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-[var(--bg-0)] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm sm:text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 text-[var(--cyan)]">
              <Wrench size={18} />
            </div>
            <div>
              <span className="font-mono">{t12(language, 'Bolt Tightening Screening & Checklist', 'Cıvata Sıkma Torku Saha Kontrolü')}</span>
              <span className="block text-[10px] text-slate-400 font-normal">ISO 898-1 / VDI 2230 Screening</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Size Selection (M6 - M24) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {t12(language, '1. Metric Bolt Size', '1. Metrik Cıvata Çapı')}
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 font-mono text-xs">
            {Object.keys(BOLT_DATA).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`py-2 px-1 rounded-xl border font-bold transition min-h-[44px] flex flex-col items-center justify-center ${
                  selectedSize === size
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                <span>{size}</span>
                <span className="text-[9px] text-slate-500 font-normal">P{BOLT_DATA[size].pitch}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Property Class Selection (4.8, 8.8, 10.9, 12.9) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {t12(language, '2. Property Class (Head Mark)', '2. Kalite Sınıfı (Kafa Markası)')}
          </label>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {(['4.8', '8.8', '10.9', '12.9'] as BoltClass[]).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setBoltClass(cls)}
                className={`py-2 px-2 rounded-xl border font-black transition min-h-[44px] flex items-center justify-center ${
                  boltClass === cls
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-400 shadow-lg'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Lubrication State Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {t12(language, '3. Lubrication & Friction Condition', '3. Yağlama Durumu & Sürtünme Katsayısı')}
          </label>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            {(['dry', 'light_oil', 'mos2'] as LubricationState[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setLubrication(st)}
                className={`py-2 px-2 rounded-xl border transition min-h-[44px] text-center ${
                  lubrication === st
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t12(language, LUBRICATION_FACTORS[st].labelEn, LUBRICATION_FACTORS[st].labelTr)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Card */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-2)] to-black/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
              {t12(language, 'Target Tightening Torque', 'Hedef Sıkma Torku')}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-400">
              As = {currentData.asMm2} mm²
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">{calculatedTorqueNm}</span>
              <span className="text-sm sm:text-base font-bold text-amber-400 font-mono">N·m</span>
            </div>
            <div className="text-right font-mono text-xs text-slate-300">
              <span className="text-[10px] text-slate-500 block">{t12(language, 'Preload FM', 'Yaklaşık Ön Yük')}</span>
              <span className="font-bold text-cyan-400">{yieldPreloadKn} kN</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 font-mono pt-1 border-t border-white/10">
            <AlertCircle size={12} className="shrink-0 text-amber-400" />
            <span>
              {t12(language, 'Screening values (±25% scatter). For critical safety joints, verify strictly with VDI 2230.', 'Saha tarama değeridir (±%25 sürtünme saçılması). Kritik bağlantılarda VDI 2230 hesabı zorunludur.')}
            </span>
          </div>
        </div>

        {/* Shop Floor Verification Checklist */}
        <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span>{t12(language, 'Field Verification Checklist', 'Saha Montaj Kontrol Listesi')}</span>
            <span className="text-cyan-400 text-[10px]">
              {Object.values(checklist).filter(Boolean).length} / 6
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {[
              { id: 'class_mark', tr: 'Cıvata kafa markalaması (4.8/8.8/10.9/12.9) doğrulandı', en: 'Bolt head class mark verified on site' },
              { id: 'thread_clean', tr: 'Dişler temiz, çapaksız ve hasarsız', en: 'Threads clean, deburred and undamaged' },
              { id: 'washer_present', tr: 'Sertleştirilmiş pul montaj yüzeyine takıldı', en: 'Hardened washer present under bolt head/nut' },
              { id: 'wrench_cal', tr: 'Tork anahtarı kalibrasyonu geçerli tarihte', en: 'Torque wrench calibration date verified' },
              { id: 'star_pattern', tr: 'Çapraz (yıldız) sıkma deseni uygulandı', en: 'Cross-star tightening sequence applied' },
              { id: 'relaxation_recheck', tr: '30 dk sonra gevşeme / oturma kontrolü yapıldı', en: '30-min relaxation recheck completed' },
            ].map((chk) => (
              <button
                key={chk.id}
                type="button"
                onClick={() => toggleCheck(chk.id)}
                className="flex items-center gap-2 w-full text-left py-1 text-slate-300 hover:text-white transition"
              >
                {checklist[chk.id] ? (
                  <CheckSquare size={15} className="text-emerald-400 shrink-0" />
                ) : (
                  <Square size={15} className="text-slate-600 shrink-0" />
                )}
                <span className={checklist[chk.id] ? 'line-through text-slate-500' : ''}>
                  {t12(language, chk.en, chk.tr)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={copySummary}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? (t12(language, 'Copied!', 'Kopyalandı!')) : (t12(language, 'Copy Summary', 'Özeti Kopyala'))}</span>
          </button>

          <Link
            href={`/bolt-torque?size=${selectedSize}&class=${boltClass}`}
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] shadow-lg"
          >
            <span>{t12(language, 'Full VDI 2230 Solver', 'VDI 2230 Tam Analiz')}</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BoltTorqueScreeningModal;

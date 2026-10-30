'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { X, CircleDot, AlertTriangle, Check, Copy, ExternalLink, Sliders } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface ORingCaliperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SealApp = 'piston_dyn' | 'rod_dyn' | 'face_static';

const STANDARD_CORDS = [
  { val: 1.78, as568: '0XX', metricNom: 1.80 },
  { val: 2.62, as568: '1XX', metricNom: 2.65 },
  { val: 3.53, as568: '2XX', metricNom: 3.55 },
  { val: 5.33, as568: '3XX', metricNom: 5.30 },
  { val: 6.99, as568: '4XX', metricNom: 7.00 },
];

export function ORingCaliperModal({ isOpen, onClose }: ORingCaliperModalProps) {
  const { language } = useI18nStore();

  const [measuredD2, setMeasuredD2] = useState<number>(3.5); // measured cord thickness
  const [measuredD1, setMeasuredD1] = useState<number>(40); // measured internal diameter
  const [sealApp, setSealApp] = useState<SealApp>('piston_dyn');
  const [copied, setCopied] = useState(false);

  // Match closest standard cord
  const match = useMemo(() => {
    let closest = STANDARD_CORDS[0];
    let minDiff = Math.abs(measuredD2 - closest.val);

    for (const cord of STANDARD_CORDS) {
      const diff = Math.abs(measuredD2 - cord.val);
      if (diff < minDiff) {
        minDiff = diff;
        closest = cord;
      }
    }

    const delta = Number((measuredD2 - closest.val).toFixed(2));
    const isSwollen = Math.abs(delta) > 0.15;

    // Gland dimensions
    // Dynamic (piston/rod): ~18% squeeze, static: ~24% squeeze
    const squeezeFactor = sealApp === 'face_static' ? 0.24 : 0.18;
    const recommendedT = Number((closest.val * (1 - squeezeFactor)).toFixed(2));
    const recommendedB = Number((closest.val * (sealApp === 'face_static' ? 1.30 : 1.36)).toFixed(2));

    return {
      closest,
      delta,
      isSwollen,
      recommendedT,
      recommendedB,
      squeezePercent: Math.round(squeezeFactor * 100),
    };
  }, [measuredD2, sealApp]);

  const copySummary = () => {
    const text = `AluCalc FIELD | ISO 3601 O-Ring Caliper Match
Measured: d2 = ${measuredD2} mm (Cord), d1 = ${measuredD1} mm (ID)
Nearest Standard: AS568 ${match.closest.as568} / Metric ${match.closest.metricNom} mm (Nominal: ${match.closest.val} mm)
Application: ${sealApp}
Recommended Groove Depth (t): ${match.recommendedT} mm
Recommended Groove Width (b): ${match.recommendedB} mm
Target Squeeze: ~${match.squeezePercent}%
${match.isSwollen ? 'WARNING: Cord deviation >0.15mm indicates chemical swelling or wear.' : 'Dimensions within nominal tolerance.'}
Inspect full gland analysis at: /o-ring`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-teal-500/30 bg-[var(--bg-0)] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm sm:text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 text-[var(--cyan)]">
              <CircleDot size={18} />
            </div>
            <div>
              <span className="font-mono">{t12(language, 'O-Ring Caliper & Gland Matcher', 'O-Ring Kumpas & Yuva Eşleştirici')}</span>
              <span className="block text-[10px] text-slate-400 font-normal">ISO 3601 / AS568 Field Caliper Tool</span>
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

        {/* Application Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {t12(language, '1. Application Type', '1. Uygulama Tipi')}
          </label>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            {[
              { id: 'piston_dyn', labelEn: 'Piston (Dynamic)', labelTr: 'Piston (Dinamik)' },
              { id: 'rod_dyn', labelEn: 'Rod (Dynamic)', labelTr: 'Mil/Boğaz (Dinamik)' },
              { id: 'face_static', labelEn: 'Flange (Static)', labelTr: 'Kapak (Statik)' },
            ].map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSealApp(app.id as SealApp)}
                className={`py-2 px-2 rounded-xl border text-center transition min-h-[44px] ${
                  sealApp === app.id
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-teal-400 font-bold shadow-md'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                {t12(language, app.labelEn, app.labelTr)}
              </button>
            ))}
          </div>
        </div>

        {/* Caliper Measurement Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {/* Measured Cord */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t12(language, 'Measured Cord d2', 'Ölçülen Kord d2')}</span>
              <span className="font-bold text-teal-300 text-sm">{measuredD2} mm</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.05"
              value={measuredD2}
              onChange={(e) => setMeasuredD2(parseFloat(e.target.value))}
              className="w-full accent-[var(--cyan)] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>1.0 mm</span>
              <span>3.5 mm</span>
              <span>8.0 mm</span>
            </div>
          </div>

          {/* Measured Inner Diameter */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t12(language, 'Measured ID d1', 'Ölçülen İç Çap d1')}</span>
              <span className="font-bold text-cyan-300 text-sm">{measuredD1} mm</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              step="1"
              value={measuredD1}
              onChange={(e) => setMeasuredD1(parseInt(e.target.value))}
              className="w-full accent-[var(--cyan)] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Ø5 mm</span>
              <span>Ø75 mm</span>
              <span>Ø150 mm</span>
            </div>
          </div>
        </div>

        {/* Matched Standard Card */}
        <div className="p-4 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-[var(--bg-2)] to-black/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-teal-300 font-bold uppercase tracking-wider">
              {t12(language, 'Nearest Standard Cord', 'En Yakın Standart Kord')}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-teal-200">
              AS568 {match.closest.as568} / ISO {match.closest.metricNom}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Nominal Cord', 'Nominal Kord W')}</span>
              <span className="text-base font-black text-white">{match.closest.val} mm</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Gland Depth t', 'Yuva Derinliği t')}</span>
              <span className="text-base font-black text-teal-300">{match.recommendedT} mm</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] text-slate-400 block">{t12(language, 'Gland Width b', 'Yuva Genişliği b')}</span>
              <span className="text-base font-black text-cyan-300">{match.recommendedB} mm</span>
            </div>
          </div>

          {/* Swelling Warning if delta > 0.15mm */}
          {match.isSwollen && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {t12(language, 'Chemical Swelling / Wear Warning!', 'Elastomer Şişme / Aşınma Uyarısı!')}
                </span>
                <span className="text-[10px] text-amber-200/80">
                  {t12(language, `Measured cord (${measuredD2} mm) deviates by ${Math.abs(match.delta)} mm. O-ring may be swollen from oil.`, `Ölçülen kord (${measuredD2} mm) standarttan ${Math.abs(match.delta)} mm sapıyor. Akışkandan dolayı şişmiş olabilir.`)}
                </span>
              </div>
            </div>
          )}

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
            <span>{t12(language, 'Target Squeeze:', 'Hedef Sıkışma Oranı:')}</span>
            <span className="text-emerald-400 font-bold">~%{match.squeezePercent}</span>
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
            <span>{copied ? (t12(language, 'Copied!', 'Kopyalandı!')) : (t12(language, 'Copy Match', 'Ölçümü Kopyala'))}</span>
          </button>

          <Link
            href={`/o-ring?cs=${match.closest.val}&id=${measuredD1}&type=${sealApp}`}
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] shadow-lg"
          >
            <span>{t12(language, 'Full ISO 3601 Solver', 'ISO 3601 Tam Tasarım')}</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ORingCaliperModal;

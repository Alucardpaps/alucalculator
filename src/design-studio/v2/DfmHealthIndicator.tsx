'use client';

/**
 * 🛡️ LIVE DFM & MACHINABILITY HEALTH INDICATOR
 * 
 * Provides real-time Design-for-Manufacturing feedback:
 * - Machinability score (0-100)
 * - Minimum wall thickness audit
 * - Standard CNC tooling corner radii & depth aspect ratio
 * - Live mass & weight savings breakdown
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { evaluateDfmHealth, type DfmHealthReport } from '@/design-studio/directModelingEngine';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface DfmHealthIndicatorProps {
  selectedPart: DesignPart | null;
}

export function DfmHealthIndicator({ selectedPart }: DfmHealthIndicatorProps) {
  const { language } = useI18nStore();
  const [expanded, setExpanded] = useState(false);

  if (!selectedPart) return null;

  const report: DfmHealthReport = evaluateDfmHealth(selectedPart);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="absolute top-[7.25rem] right-3 z-20 flex max-w-[calc(50%-12px)] flex-col items-end font-mono text-[11px] select-none">
      {/* Compact Pill Badge */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-m)] border shadow-xl transition-all cursor-pointer ${getScoreColor(
          report.score
        )} hover:brightness-125`}
        title={t12(language, 'Click to expand DFM Machinability report', 'DFM Üretilebilirlik raporunu detaylandır')}
      >
        <div className="flex items-center gap-1.5 font-bold">
          {report.isMachinable ? (
            <ShieldCheck size={14} className="text-emerald-400" />
          ) : (
            <ShieldAlert size={14} className="text-rose-400" />
          )}
          <span>DFM: {report.score}/100</span>
        </div>

        <div className="w-[1px] h-3 bg-white/20" />

        <div className="flex items-center gap-1 text-[10px] text-slate-300">
          <span>{report.massKg} kg</span>
          {report.weightSavingsPct > 0 && (
            <span className="text-emerald-400 font-bold">(-%{report.weightSavingsPct})</span>
          )}
        </div>

        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded Report Card */}
      {expanded && (
        <div className="mt-2 w-72 rounded-[var(--radius-m)] bg-[var(--bg-0)]/95 border border-[var(--line)] shadow-2xl p-3 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <span className="font-bold text-xs text-white flex items-center gap-1">
              <Cpu size={12} className="text-[var(--cyan)]" />
              <span>{t12(language, 'DFM CNC AUDIT', 'DFM CNC RAPORU')}</span>
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                report.isMachinable
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {report.isMachinable
                ? t12(language, 'Machinable', 'Üretilebilir')
                : t12(language, 'Review Needed', 'Revizyon Gerekli')}
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] flex flex-col">
              <span className="text-[9px] text-[var(--alu-dim)]">
                {t12(language, 'Min Wall', 'Min Cidar')}
              </span>
              <span className={`font-bold ${report.minWallMm < 1.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {report.minWallMm} mm
              </span>
            </div>

            <div className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] flex flex-col">
              <span className="text-[9px] text-[var(--alu-dim)]">
                {t12(language, 'Tool Radius', 'Takım Radyusu')}
              </span>
              <span className="font-bold text-slate-200">R{report.toolingRadiusMm} mm</span>
            </div>

            <div className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] flex flex-col">
              <span className="text-[9px] text-[var(--alu-dim)]">
                {t12(language, 'Estimated Mass', 'Tahmini Kütle')}
              </span>
              <span className="font-bold text-slate-200">{report.massKg} kg</span>
            </div>

            <div className="p-1.5 rounded bg-[var(--bg-1)] border border-[var(--line)] flex flex-col">
              <span className="text-[9px] text-[var(--alu-dim)]">
                {t12(language, 'Mass Saved', 'Kütle Kazancı')}
              </span>
              <span className="font-bold text-emerald-400">%{report.weightSavingsPct}</span>
            </div>
          </div>

          {/* Warnings & Recommendations */}
          {report.warnings.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-1.5">
              <span className="text-[9px] text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle size={10} />
                <span>{t12(language, 'Warnings', 'Uyarılar')}:</span>
              </span>
              {report.warnings.map((w, idx) => (
                <div key={idx} className="text-[9.5px] text-amber-200/90 pl-2 border-l border-amber-500/40">
                  {w}
                </div>
              ))}
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-1.5">
              <span className="text-[9px] text-[var(--cyan)] font-bold flex items-center gap-1">
                <Sparkles size={10} />
                <span>{t12(language, 'Tips', 'Öneriler')}:</span>
              </span>
              {report.recommendations.map((r, idx) => (
                <div key={idx} className="text-[9.5px] text-slate-300 pl-2 border-l border-[var(--cyan)]/40">
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

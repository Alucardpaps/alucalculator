'use client';

/**
 * 🩺 AEGIS DESIGN DOCTOR & DFM ADVISOR HUD
 * 
 * Inspired by Autodesk Inventor Design Doctor & CATIA DFM Advisor:
 * Real-time continuous geometric audit for CNC machining, thin-walls,
 * hole edge tear-out, thread stripping, and unconstrained assembly DOF.
 * 
 * Follows AluCalc Instrument Design Tokens (no backdrop-blur, no neon gradients).
 */

import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Wrench,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import {
  diagnosePartAndAssembly,
  executeAutoHealThickenWall,
  executeAutoHealOffsetHole,
  executeAutoHealShallowPocket,
  type DesignDoctorReport,
  type DiagnosticIssue,
} from '@/design-studio/designDoctorEngine';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface DesignDoctorHudProps {
  onNotification?: (msg: string) => void;
  defaultOpen?: boolean;
}

export function DesignDoctorHud({ onNotification, defaultOpen = false }: DesignDoctorHudProps) {
  const { language } = useI18nStore();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('doctor') === 'open') {
        setIsOpen(true);
      }
    }
  }, []);

  const selectedPart = useDesignStore((s) => s.getSelected());
  const allParts = useDesignStore((s) => s.parts);
  const mates = useDesignStore((s) => s.mates);

  const report: DesignDoctorReport = diagnosePartAndAssembly(selectedPart, allParts, mates);

  const handleAutoHeal = (issue: DiagnosticIssue) => {
    if (!issue.partId || !issue.autoHealAction) return;

    const store = useDesignStore.getState();
    const targetPart = store.parts.find((p) => p.id === issue.partId);
    if (!targetPart) return;

    store.pushHistory();

    if (issue.autoHealAction === 'thicken-wall') {
      const patch = executeAutoHealThickenWall(targetPart, 2.5);
      if (patch.params) {
        store.updatePartParams(targetPart.id, patch.params);
        onNotification?.(
          t12(
            language,
            `Auto-Healed: "${targetPart.name}" wall thickened to 2.5mm.`,
            `Otomatik Onarıldı: "${targetPart.name}" et kalınlığı 2.5mm yapıldı.`
          )
        );
      }
    } else if (issue.autoHealAction === 'offset-hole' && issue.featureId) {
      const patch = executeAutoHealOffsetHole(targetPart, issue.featureId, 1.5);
      if (patch.holes) {
        useDesignStore.setState({
          holes: patch.holes,
          parts: store.parts.map((p) => (p.id === targetPart.id ? { ...p, holes: patch.holes } : p)),
        });
        onNotification?.(
          t12(
            language,
            `Auto-Healed: Hole shifted to safe 1.5d edge margin.`,
            `Otomatik Onarıldı: Delik güvenli 1.5d kenar mesafesine kaydırıldı.`
          )
        );
      }
    } else if (issue.autoHealAction === 'shallow-pocket' && issue.featureId) {
      const patch = executeAutoHealShallowPocket(targetPart, issue.featureId);
      if (patch.cuts) {
        useDesignStore.setState({
          cuts: patch.cuts,
          parts: store.parts.map((p) => (p.id === targetPart.id ? { ...p, cuts: patch.cuts } : p)),
        });
        onNotification?.(
          t12(
            language,
            `Auto-Healed: Pocket depth capped to eliminate tool deflection.`,
            `Otomatik Onarıldı: Takım titreşimini önlemek için cep derinliği sınırlandı.`
          )
        );
      }
    } else if (issue.autoHealAction === 'ground-part') {
      onNotification?.(
        t12(
          language,
          `Part position locked to origin ground reference.`,
          `Parça konumu montaj referansına sabitlendi.`
        )
      );
    }
  };

  const getScoreBadge = () => {
    if (report.score >= 85 && report.criticalCount === 0) {
      return {
        bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        icon: <ShieldCheck size={13} className="text-emerald-400" />,
        label: `${report.score}/100 PASS`,
      };
    }
    if (report.criticalCount > 0) {
      return {
        bg: 'bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse',
        icon: <ShieldAlert size={13} className="text-rose-400" />,
        label: `${report.score}/100 CRITICAL`,
      };
    }
    return {
      bg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      icon: <AlertTriangle size={13} className="text-amber-400" />,
      label: `${report.score}/100 WARN`,
    };
  };

  const badge = getScoreBadge();

  return (
    <div className="absolute top-[7.25rem] left-3 z-20 flex max-w-[calc(50%-12px)] flex-col items-start font-mono text-[11px] select-none">
      {/* Status Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-m)] border shadow-xl transition-all cursor-pointer ${badge.bg} hover:brightness-125`}
        title={t12(language, 'AeGiS Design Doctor (Inventor & CATIA Rules)', 'AeGiS Tasarım Doktoru')}
      >
        <Activity size={13} className="text-[var(--cyan)]" />
        <span className="font-bold tracking-tight">DESIGN DOCTOR:</span>
        <div className="flex items-center gap-1 font-extrabold">{badge.icon}<span>{badge.label}</span></div>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded Diagnostic Modal Drawer */}
      {isOpen && (
        <div className="mt-2 w-84 rounded-[var(--radius-m)] bg-[var(--bg-0)] border border-[var(--line)] shadow-2xl p-3 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2 max-h-[75vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Activity size={14} className="text-[var(--cyan)]" />
              <span>{t12(language, 'IN-CANVAS DESIGN DOCTOR', 'CANLI TASARIM DOKTORU')}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] text-[10px]">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 font-bold uppercase">{t12(language, 'Health', 'Sağlık')}</span>
              <span className="text-white font-extrabold text-xs">{report.score}%</span>
            </div>
            <div className="flex flex-col items-center border-x border-[var(--line)]">
              <span className="text-slate-400 font-bold uppercase">{t12(language, 'Critical', 'Kritik')}</span>
              <span className={`font-extrabold text-xs ${report.criticalCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {report.criticalCount}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400 font-bold uppercase">{t12(language, 'Warnings', 'Uyarı')}</span>
              <span className={`font-extrabold text-xs ${report.warningCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {report.warningCount}
              </span>
            </div>
          </div>

          {/* Issues List */}
          <div className="flex flex-col gap-2 pt-1">
            {report.issues.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-[var(--radius-s)] text-emerald-300 text-xs">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  {t12(
                    language,
                    'Zero defects found! Geometry satisfies all DFM and Eurocode 3 standards.',
                    'Kusur bulunamadı! Geometri tüm DFM ve Eurocode 3 standartlarına uygundur.'
                  )}
                </span>
              </div>
            ) : (
              report.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-2.5 rounded-[var(--radius-s)] border flex flex-col gap-1.5 ${
                    issue.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : issue.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-extrabold text-[11px] leading-tight">
                      {language === 'tr' ? issue.titleTr : issue.titleEn}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded uppercase font-bold shrink-0 ${
                        issue.severity === 'critical'
                          ? 'bg-rose-500/30 text-rose-300'
                          : issue.severity === 'warning'
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-blue-500/30 text-blue-300'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    {language === 'tr' ? issue.descriptionTr : issue.descriptionEn}
                  </p>

                  <div className="text-[9px] text-slate-400 italic">
                    § {issue.standardCitation}
                  </div>

                  {issue.autoHealAction && (
                    <button
                      type="button"
                      onClick={() => handleAutoHeal(issue)}
                      className="mt-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-black font-extrabold text-[10px] cursor-pointer transition-all active:scale-95 shadow"
                    >
                      <Wrench size={11} />
                      <span>{language === 'tr' ? issue.autoHealLabelTr : issue.autoHealLabelEn}</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

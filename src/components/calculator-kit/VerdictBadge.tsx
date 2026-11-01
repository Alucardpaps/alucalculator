'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowUpRight } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { VerdictBadgeProps, VerdictStatus } from './types';

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  status,
  primaryMetricLabel,
  maxUtilization,
  weakestLinkText,
  standardCitation,
  onWeakestLinkClick,
  className = '',
}) => {
  const { language } = useI18nStore();
  const effectivePrimaryMetricLabel = primaryMetricLabel ?? t12(language, 'Max Capacity Utilization', 'Maksimum Kapasite Kullanımı');

  const getStatusConfig = (s: VerdictStatus) => {
    switch (s) {
      case 'PASS':
        return {
          title: t12(language, 'COMPLIANT (STANDARDS SATISFIED)', 'UYGUN (STANDART GÜVENLİĞİ SAĞLANDI)'),
          badgeColor: 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]',
          icon: <CheckCircle2 size={16} className="text-[var(--ok)] shrink-0" />,
          glow: '',
          dot: 'bg-[var(--ok)]',
        };
      case 'WARN':
        return {
          title: t12(language, 'MARGINAL (HIGH STRESS / LOW MARGIN)', 'SINIRDA (YÜKSEK GERİLME / YEDEK DÜŞÜK)'),
          badgeColor: 'border-[var(--warn)]/40 bg-[var(--warn)]/10 text-[var(--warn)]',
          icon: <AlertTriangle size={16} className="text-[var(--warn)] shrink-0" />,
          glow: '',
          dot: 'bg-[var(--warn)]',
        };
      case 'FAIL':
        return {
          title: t12(language, 'NON-COMPLIANT (LIMIT STATE EXCEEDED)', 'YETERSİZ (MUKAVEMET / SINIR DEĞER AŞILDI)'),
          badgeColor: 'border-[var(--bad)]/40 bg-[var(--bad)]/10 text-[var(--bad)]',
          icon: <XCircle size={16} className="text-[var(--bad)] shrink-0" />,
          glow: '',
          dot: 'bg-[var(--bad)]',
        };
      case 'INCOMPLETE':
      default:
        return {
          title: t12(language, 'AWAITING INPUT (INCOMPLETE)', 'GİRDİ BEKLENİYOR (TAMAMLANMADI)'),
          badgeColor: 'border-[var(--alu-dim)]/40 bg-[#8a96a6]/10 text-[var(--alu-dim)]',
          icon: <HelpCircle size={16} className="text-[var(--alu-dim)] shrink-0" />,
          glow: '',
          dot: 'bg-[#8a96a6]',
        };
    }
  };

  const cfg = getStatusConfig(status);

  return (
    <div
      className={`rounded-xl border bg-[var(--bg-1)] p-3.5 sm:p-4 transition-all ${cfg.badgeColor} ${cfg.glow} ${className}`}
    >
      {/* Top Header: Status LED + Title + Standard Citation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span className="text-xs font-bold tracking-wide uppercase font-mono">{cfg.title}</span>
        </div>

        {standardCitation && (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-[var(--std)]/30 bg-[var(--std)]/10 text-[var(--std)]">
            {standardCitation}
          </span>
        )}
      </div>

      {/* Main Metrics: Utilization Readout & Weakest Link */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--line)] pt-2.5">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
            {effectivePrimaryMetricLabel}
          </div>
          {maxUtilization !== undefined && !isNaN(maxUtilization) && (
            <div className="mt-0.5 flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                {(maxUtilization * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[var(--alu-dim)]">
                {status === 'PASS'
                  ? '(η ≤ 80%)'
                  : status === 'WARN'
                  ? '(80% < η ≤ 100%)'
                  : status === 'FAIL'
                  ? '(η > 100%)'
                  : ''}
              </span>
            </div>
          )}
        </div>

        {weakestLinkText && (
          <div className="text-right max-w-full sm:max-w-[60%]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
              {t12(language, 'Critical Limit State', 'Kritik Sınır Durumu')}
            </div>
            <button
              type="button"
              disabled={!onWeakestLinkClick}
              onClick={onWeakestLinkClick}
              className={`mt-0.5 font-mono text-xs text-left sm:text-right font-medium text-[var(--alu)] transition-colors ${
                onWeakestLinkClick
                  ? 'hover:text-[var(--cyan)] cursor-pointer inline-flex items-center gap-1'
                  : 'cursor-default'
              }`}
              title={onWeakestLinkClick ? t12(language, 'Focus on critical parameter detail', 'Kritik parametre detayına odaklan') : undefined}
            >
              <span>{weakestLinkText}</span>
              {onWeakestLinkClick && <ArrowUpRight size={12} className="shrink-0 text-[var(--cyan)]" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

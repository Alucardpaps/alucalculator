'use client';
/**
 * Company identity blocks for HTML / print reports.
 * Data: Settings → Reports (src/lib/report/reportBranding.ts).
 * Rendered black-on-white (wrap the report in .palette-literal or a white sheet).
 */
import React from 'react';
import { useReportBranding } from '@/lib/report/reportBranding';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function ReportBrandHeader({ title, docNumber }: { title?: string; docNumber?: string }) {
  const b = useReportBranding();
  const { language } = useI18nStore();
  if (!b.logoDataUrl && !b.companyName) return null;
  return (
    <header className="flex items-center justify-between gap-4 border-b-2 border-slate-900 pb-3">
      <div className="flex min-w-0 items-center gap-3">
        {b.logoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logoDataUrl} alt={b.companyName || 'logo'} className="h-12 w-auto max-w-[180px] object-contain" />
        )}
        <div className="min-w-0">
          {b.companyName && <div className="truncate text-base font-bold text-slate-900">{b.companyName}</div>}
          {b.companyLine && <div className="truncate text-[11px] text-slate-600">{b.companyLine}</div>}
        </div>
      </div>
      {(title || docNumber) && (
        <div className="shrink-0 text-right font-mono text-[11px] text-slate-700">
          {title && <div className="font-bold text-slate-900">{title}</div>}
          {docNumber && <div>{t12(language, 'Doc.', 'Belge')} {docNumber}</div>}
        </div>
      )}
    </header>
  );
}

export function ReportApprovalTable({ className = '' }: { className?: string }) {
  const b = useReportBranding();
  const { language } = useI18nStore();
  if (!b.showApprovalBlock) return null;
  const date = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-GB');
  const rows: [string, string][] = [
    [t12(language, 'Designed by', 'Tasarlayan'), b.designedBy],
    [t12(language, 'Checked by', 'Kontrol eden'), b.checkedBy],
    [t12(language, 'Approved by', 'Onaylayan'), b.approvedBy],
  ];
  return (
    <section className={`grid grid-cols-1 border-2 border-slate-900 font-mono text-xs sm:grid-cols-3 ${className}`} aria-label={t12(language, 'Approval', 'Onay')}>
      {rows.map(([role, name], i) => (
        <div key={role} className={`p-2.5 ${i > 0 ? 'border-t-2 border-slate-900 sm:border-l-2 sm:border-t-0' : ''}`}>
          <div className="text-[9px] font-bold uppercase text-slate-500">{role}</div>
          <div className="mt-1 min-h-[1.25rem] font-bold text-slate-900">{name || '—'}</div>
          <div className="mt-1 flex items-end justify-between gap-2 text-[10px] text-slate-600">
            <span>{t12(language, 'Date', 'Tarih')}: {name ? date : '……'}</span>
            <span className="inline-block w-24 border-b border-slate-400" aria-label={t12(language, 'Signature', 'İmza')} />
          </div>
        </div>
      ))}
    </section>
  );
}

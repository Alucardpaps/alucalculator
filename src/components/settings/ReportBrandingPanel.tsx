'use client';
/**
 * Settings → Reports: company identity and approval names printed on every PDF / print report.
 */
import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, RotateCcw } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { normaliseLogo, resetReportBranding, setReportBranding, useReportBranding, nextDocumentNumber } from '@/lib/report/reportBranding';

const input =
  'w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-3)] px-2.5 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';
const btn =
  'inline-flex items-center gap-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-[12px] text-[var(--alu)] hover:text-[var(--ink)] hover:bg-[var(--hover)] cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[11.5px] font-medium text-[var(--alu-dim)]">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export function ReportBrandingPanel() {
  const { language } = useI18nStore();
  const tr = (en: string, trk: string) => t12(language, en, trk);
  const b = useReportBranding();
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    setErr(null);
    try {
      const { dataUrl, aspect } = await normaliseLogo(f);
      setReportBranding({ logoDataUrl: dataUrl, logoAspect: aspect });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const date = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-GB');

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-4">
        <h3 className="text-[13px] font-semibold text-[var(--ink)]">{tr('Company identity', 'Firma kimliği')}</h3>
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="space-y-2">
            <div
              className="flex h-[100px] w-full items-center justify-center rounded-[var(--radius-m)] border border-dashed border-[var(--line-strong)] p-2 cursor-pointer hover:border-[var(--cyan)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
              style={{ background: 'white' }}
              role="button"
              tabIndex={0}
              aria-label={tr('Upload company logo', 'Firma amblemini yükle')}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            >
              {b.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoDataUrl} alt="logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-center text-[11px]" style={{ color: 'dimgray' }}>{tr('Drop logo here', 'Amblemi buraya bırakın')}<br />PNG · JPG · SVG</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
                <ImagePlus size={14} /> {b.logoDataUrl ? tr('Replace', 'Değiştir') : tr('Upload logo', 'Amblem yükle')}
              </button>
              {b.logoDataUrl && (
                <button type="button" className={btn} onClick={() => setReportBranding({ logoDataUrl: '', logoAspect: 1 })}>
                  <Trash2 size={14} /> {tr('Remove', 'Kaldır')}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {err && <p className="text-[11px] text-[var(--bad)]">{err}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr('Company name', 'Firma adı')}>
              <input className={input} value={b.companyName} placeholder="ACME Makina A.Ş." onChange={(e) => setReportBranding({ companyName: e.target.value })} />
            </Field>
            <Field label={tr('Second line (department, address, web)', 'İkinci satır (bölüm, adres, web)')}>
              <input className={input} value={b.companyLine} placeholder={tr('R&D · Istanbul', 'Ar-Ge · İstanbul')} onChange={(e) => setReportBranding({ companyLine: e.target.value })} />
            </Field>
            <Field label={tr('Document number prefix', 'Belge numarası öneki')} hint={`${tr('Next', 'Sıradaki')}: ${nextDocumentNumber(b)}`}>
              <input className={input} value={b.documentPrefix} onChange={(e) => setReportBranding({ documentPrefix: e.target.value })} />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-[var(--ink)]">{tr('Approval block', 'Onay bloğu')}</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-[var(--alu)]">
            <input type="checkbox" checked={b.showApprovalBlock} onChange={(e) => setReportBranding({ showApprovalBlock: e.target.checked })} className="accent-[var(--cyan)]" />
            {tr('Print on reports', 'Raporlara bas')}
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={tr('Designed by', 'Tasarlayan')}>
            <input className={input} value={b.designedBy} onChange={(e) => setReportBranding({ designedBy: e.target.value })} />
          </Field>
          <Field label={tr('Checked by', 'Kontrol eden')}>
            <input className={input} value={b.checkedBy} onChange={(e) => setReportBranding({ checkedBy: e.target.value })} />
          </Field>
          <Field label={tr('Approved by', 'Onaylayan')}>
            <input className={input} value={b.approvedBy} onChange={(e) => setReportBranding({ approvedBy: e.target.value })} />
          </Field>
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          {tr('Saved in this browser only. Used by every PDF and print report (calculation reports, project dossiers, cutting lists).',
            'Yalnızca bu tarayıcıda saklanır. Tüm PDF ve yazdırma raporlarında kullanılır (hesap raporları, proje dosyaları, kesim listeleri).')}
        </p>
      </section>

      {/* live preview — paper look */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold text-[var(--ink)]">{tr('Preview', 'Önizleme')}</h3>
        <div className="palette-literal rounded-[var(--radius-m)] border border-[var(--line)] bg-white p-4 text-slate-900 shadow-[var(--shadow-1)]">
          <div className="flex items-center justify-between gap-3 border-b-2 border-slate-900 pb-2">
            <div className="flex min-w-0 items-center gap-3">
              {b.logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoDataUrl} alt="" className="h-10 w-auto max-w-[140px] object-contain" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{b.companyName || 'AluCAD OS'}</div>
                <div className="truncate text-[11px] text-slate-600">{b.companyLine || tr('Engineering calculation report', 'Mühendislik hesap raporu')}</div>
              </div>
            </div>
            <div className="text-right font-mono text-[10.5px] text-slate-700">
              <div className="font-bold">{tr('SHAFT CHECK · DIN 743', 'MİL KONTROLÜ · DIN 743')}</div>
              <div>{nextDocumentNumber(b)}</div>
            </div>
          </div>
          <div className="my-3 h-10 rounded bg-slate-100" />
          {b.showApprovalBlock && (
            <div className="grid grid-cols-3 border border-slate-900 font-mono text-[11px]">
              {[[tr('Designed by', 'Tasarlayan'), b.designedBy], [tr('Checked by', 'Kontrol eden'), b.checkedBy], [tr('Approved by', 'Onaylayan'), b.approvedBy]].map(([r, n], i) => (
                <div key={r} className={`p-2 ${i ? 'border-l border-slate-900' : ''}`}>
                  <div className="text-[9px] font-bold uppercase text-slate-500">{r}</div>
                  <div className="font-bold">{n || '—'}</div>
                  <div className="text-[10px] text-slate-500">{n ? date : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <button type="button" className={btn} onClick={() => resetReportBranding()}>
        <RotateCcw size={14} /> {tr('Reset report settings', 'Rapor ayarlarını sıfırla')}
      </button>
    </div>
  );
}

export default ReportBrandingPanel;

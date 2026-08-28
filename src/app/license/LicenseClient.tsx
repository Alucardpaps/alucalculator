'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLicenseStore } from '@/store/licenseStore';
import { useI18nStore } from '@/store/i18nStore';
import { getAppPages } from '@/locales/appPagesTranslations';

export function LicenseClient() {
  const { plan, licenseKey, usage, activate, clearLicense, limits } = useLicenseStore();
  const language = useI18nStore((s) => s.language);
  const t = getAppPages(language).license;
  const [draft, setDraft] = useState(licenseKey);
  const [message, setMessage] = useState('');
  const caps = limits();

  const onActivate = () => {
    const result = activate(draft);
    setMessage(result.message);
  };

  const row = (label: string, used: number, cap: number) => (
    <li className="flex justify-between text-[13px] text-slate-300">
      <span>{label}</span>
      <span className="font-mono">
        {used} / {cap === Infinity ? '∞' : cap}
      </span>
    </li>
  );

  return (
    <main className="work-shell max-w-xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">{t.kicker}</p>
      <h1 className="work-title">{t.title}</h1>
      <p className="work-lead">{t.lead}</p>

      <div className="work-card mb-4">
        <p className="hud-label">{t.activePlan}</p>
        <p className="text-xl font-black text-white capitalize mb-4">{plan}</p>
        <label className="hud-label" htmlFor="license-key">{t.licenseKey}</label>
        <input
          id="license-key"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ALU-PRO-XXXXXXXX"
          className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white font-mono mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onActivate} className="work-btn-primary">
            {t.activate}
          </button>
          {plan !== 'free' && (
            <button type="button" onClick={clearLicense} className="work-btn">
              {t.clear}
            </button>
          )}
        </div>
        {message && <p className="mt-3 text-[12px] text-emerald-400">{message}</p>}
      </div>

      <div className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-3">{t.usage}</h2>
        <ul className="space-y-2">
          {row('PDF', usage.pdf, caps.pdf)}
          {row('DXF', usage.dxf, caps.dxf)}
          {row('AI', usage.ai, caps.ai)}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/pricing/" className="work-btn-primary">{t.viewPlans}</Link>
        <Link href="/sales/" className="work-btn">{t.salesInvoice}</Link>
        <Link href="/developers/" className="work-btn">API</Link>
      </div>
    </main>
  );
}

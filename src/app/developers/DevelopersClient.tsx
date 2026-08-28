'use client';

import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { getAppPages } from '@/locales/appPagesTranslations';

const SAMPLE = `{
  "calculator": "beam-analysis-v4",
  "rows": [
    { "material": "steel", "grade": "S355", "length": 5000, "force": 10000 },
    { "material": "aluminum", "grade": "6063-T6", "length": 2500, "force": 2000 }
  ]
}`;

const NL = `{
  "queries": [
    "aluminum 6061 beam length 2m with 5kN force",
    "ISO 281 bearing 6205 radial 2kN axial 0.5kN 3000 rpm"
  ]
}`;

export function DevelopersClient() {
  const language = useI18nStore((s) => s.language);
  const t = getAppPages(language).developers;
  return (
    <main className="work-shell max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">{t.kicker}</p>
      <h1 className="work-title">{t.title}</h1>
      <p className="work-lead">{t.lead}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <div className="work-card">
          <p className="hud-label">{t.apiKey}</p>
          <p className="text-sm font-bold text-white">{t.headerHint}</p>
        </div>
        <div className="work-card">
          <p className="hud-label">{t.limits}</p>
          <p className="text-sm font-bold text-white">{t.teamLimit}</p>
        </div>
        <div className="work-card">
          <p className="hud-label">{t.trust}</p>
          <p className="text-sm font-bold text-white">{t.deterministic}</p>
        </div>
      </div>

      <section className="work-card mb-4">
        <h2 className="text-sm font-bold text-white mb-3">{t.example}</h2>
        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">{`POST /api/bulk-calc
X-API-KEY: your_team_or_enterprise_key
Content-Type: application/json

${SAMPLE}`}</pre>
      </section>

      <section className="work-card mb-4">
        <h2 className="text-sm font-bold text-white mb-3">{t.nlBatch}</h2>
        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">{`POST /api/bulk-calc
X-API-KEY: your_key
Content-Type: application/json

${NL}`}</pre>
      </section>

      <section className="work-card mb-8">
        <h2 className="text-sm font-bold text-white mb-2">{t.response}</h2>
        <p className="text-[13px] text-slate-400">{t.responseBody}</p>
      </section>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/pricing/" className="work-btn-primary">{t.getTeam}</Link>
        <Link href="/sales/" className="work-btn">{t.requestKey}</Link>
        <a href="mailto:sales@alucalculator.com?subject=Bulk%20API%20access" className="work-btn">
          sales@alucalculator.com
        </a>
      </div>
      <p className="text-[12px] text-slate-500">
        {t.footer}
      </p>
    </main>
  );
}

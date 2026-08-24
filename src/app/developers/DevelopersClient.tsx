'use client';

import Link from 'next/link';

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
  return (
    <main className="work-shell max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">Developers</p>
      <h1 className="work-title">Bulk Calculation API</h1>
      <p className="work-lead">
        Batch beam, gear, mass, and natural-language calculations for engineering teams. Team and Enterprise plans.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <div className="work-card">
          <p className="hud-label">API Key</p>
          <p className="text-sm font-bold text-white">X-API-KEY header</p>
        </div>
        <div className="work-card">
          <p className="hud-label">Limits</p>
          <p className="text-sm font-bold text-white">Team: 500 rows/req</p>
        </div>
        <div className="work-card">
          <p className="hud-label">Trust</p>
          <p className="text-sm font-bold text-white">Deterministic engine</p>
        </div>
      </div>

      <section className="work-card mb-4">
        <h2 className="text-sm font-bold text-white mb-3">Example request</h2>
        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">{`POST /api/bulk-calc
X-API-KEY: your_team_or_enterprise_key
Content-Type: application/json

${SAMPLE}`}</pre>
      </section>

      <section className="work-card mb-4">
        <h2 className="text-sm font-bold text-white mb-3">Natural language batch</h2>
        <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">{`POST /api/bulk-calc
X-API-KEY: your_key
Content-Type: application/json

${NL}`}</pre>
      </section>

      <section className="work-card mb-8">
        <h2 className="text-sm font-bold text-white mb-2">Response</h2>
        <p className="text-[13px] text-slate-400">
          Per-row result JSON, assumptions (AI), engine version, and traceability fields. Failed rows do not fail the batch.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/pricing/" className="work-btn-primary">Get Team plan</Link>
        <Link href="/sales/" className="work-btn">Request API key</Link>
        <a href="mailto:sales@alucalculator.com?subject=Bulk%20API%20access" className="work-btn">
          sales@alucalculator.com
        </a>
      </div>
      <p className="text-[12px] text-slate-500">
        Bulk API is available on Team and Enterprise plans. Contact sales for access and API keys.
      </p>
    </main>
  );
}

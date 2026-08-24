'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { useLicenseStore } from '@/store/licenseStore';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    blurb: 'Daily engineering math in the browser',
    cta: 'Current plan',
    featured: false,
    items: [
      'Core calculators (mass, bolts, bearings, beams, gears…)',
      'Alloy-true aluminum density',
      '3 PDF / day (watermarked) · 1 DXF / day',
      'PWA offline-ready',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$190/yr',
    note: '−17%',
    sub: '≈ $15.8/mo billed yearly',
    blurb: 'For independent engineers & freelancers',
    cta: 'Upgrade to Pro',
    featured: true,
    items: [
      'Unlimited DXF / STEP / PDF',
      'Unwatermarked client PDFs',
      'Unlimited nesting & cut optimizer',
      'Local project BOM + priority support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$490/yr',
    note: '−17%',
    blurb: 'Shared licenses for design offices',
    cta: 'Get Team Access',
    featured: false,
    items: [
      'Up to 10 seats',
      'Bulk API (500 rows/request)',
      'Custom report header fields',
      'Everything in Pro',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    blurb: 'Factories, OEMs, universities — custom contract',
    cta: 'Contact Sales',
    featured: false,
    items: [
      'Unlimited seats & API volume',
      'SSO / SLA by contract (not self-serve)',
      'Custom standards packs on request',
      'Training & onboarding',
    ],
  },
] as const;

const MATRIX: { feature: string; free: boolean; pro: boolean; team: boolean; enterprise: boolean }[] = [
  { feature: `${TOTAL_CALCULATORS_LABEL} engineering calculators`, free: true, pro: true, team: true, enterprise: true },
  { feature: 'Alloy-true density & materials DB', free: true, pro: true, team: true, enterprise: true },
  { feature: 'PDF engineering reports', free: true, pro: true, team: true, enterprise: true },
  { feature: 'Unwatermarked client-ready PDFs', free: false, pro: true, team: true, enterprise: true },
  { feature: 'DXF manufacturing export', free: false, pro: true, team: true, enterprise: true },
  { feature: 'STEP 3D CAD export', free: false, pro: true, team: true, enterprise: true },
  { feature: 'Unlimited nesting & cutting optimizer', free: false, pro: true, team: true, enterprise: true },
  { feature: 'AI engineering copilot (daily quota)', free: true, pro: true, team: true, enterprise: true },
  { feature: 'Higher AI quota (Pro+)', free: false, pro: true, team: true, enterprise: true },
  { feature: 'Bulk Calculation API', free: false, pro: false, team: true, enterprise: true },
  { feature: 'Team seats (shared license keys)', free: false, pro: false, team: true, enterprise: true },
  { feature: 'Local project BOM (browser storage)', free: false, pro: true, team: true, enterprise: true },
  { feature: 'Priority email support', free: false, pro: true, team: true, enterprise: true },
];

function Cell({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
      <Check size={13} /> Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
      <Minus size={13} /> Not available
    </span>
  );
}

export function PricingClient() {
  const plan = useLicenseStore((s) => s.plan);

  return (
    <main className="work-shell max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-10 max-w-2xl">
        <p className="work-kicker">Pricing</p>
        <h1 className="work-title">Free, Pro, Team, Enterprise</h1>
        <p className="work-lead">
          Core engineering math stays free. Manufacturing exports, unwatermarked PDFs, and bulk API unlock on paid plans.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-12">
        {PLANS.map((p) => (
          <article
            key={p.id}
            className={`work-card flex flex-col ${p.featured ? 'border-[#6b9fff]/40 shadow-[0_0_30px_rgba(107,159,255,0.12)]' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-white">{p.name}</h2>
              {p.featured && (
                <span className="text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#6b9fff] text-black px-2 py-0.5">
                  Most popular
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-400 mb-3">{p.blurb}</p>
            <p className="text-2xl font-black text-white">
              {p.price}{' '}
              {'note' in p && p.note ? <span className="text-sm text-emerald-400">{p.note}</span> : null}
            </p>
            {'sub' in p && p.sub ? <p className="text-[11px] text-slate-500 mb-3">{p.sub}</p> : <div className="mb-3" />}
            <ul className="space-y-1.5 text-[12px] text-slate-300 flex-1 mb-4">
              {p.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={p.id === 'free' ? '/license/' : '/sales/'}
              className={p.featured ? 'work-btn-primary text-center' : 'work-btn text-center'}
            >
              {plan === p.id ? 'Current plan' : p.cta}
            </Link>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto work-card mb-10">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="py-2 pr-3 font-semibold">Feature</th>
              <th className="py-2 px-2">Free</th>
              <th className="py-2 px-2">Pro</th>
              <th className="py-2 px-2">Team</th>
              <th className="py-2 px-2">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.feature} className="border-b border-white/5">
                <td className="py-2.5 pr-3 text-slate-200">{row.feature}</td>
                <td className="py-2.5 px-2"><Cell ok={row.free} /></td>
                <td className="py-2.5 px-2"><Cell ok={row.pro} /></td>
                <td className="py-2.5 px-2"><Cell ok={row.team} /></td>
                <td className="py-2.5 px-2"><Cell ok={row.enterprise} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="work-card">
          <h2 className="text-sm font-bold text-white mb-2">Static-export safe licensing</h2>
          <p className="text-[13px] text-slate-400 leading-relaxed">
            Pay via Stripe / Lemon Squeezy / invoice. License keys verify on-device — works offline on the shop floor.{' '}
            Activate at <Link href="/license/" className="text-[#9bbdff] underline">/license</Link>.
          </p>
        </div>
        <div className="work-card">
          <h2 className="text-sm font-bold text-white mb-2">Enterprise & API</h2>
          <p className="text-[13px] text-slate-400 leading-relaxed mb-3">
            OEMs, factories, universities: Bulk API, multi-seat keys, and contracted support. SSO/SLA are not self-serve — planned with sales.
          </p>
          <a className="work-btn-primary inline-flex" href="mailto:sales@alucalculator.com?subject=AluCalc%20Enterprise">
            sales@alucalculator.com →
          </a>
        </div>
      </section>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Prices may exclude VAT. Annual billing recommended. 14-day satisfaction guarantee on digital licenses.
        Engineering results are decision-support tools. Always verify critical designs against applicable codes and professional judgment.
      </p>
    </main>
  );
}

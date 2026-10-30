import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, CheckCircle2, ShieldAlert, Cpu, FileText, Download } from 'lucide-react';
import { APP_VERSION, APP_APK_VERSION, APP_MODULE_COUNT, APP_KERNEL_SOLVER_COUNT } from '@/config/app';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'Release notes, engine updates, and specification changelog for AluCAD OS. Tracking web releases, APK deployments, and quota policies.',
  alternates: {
    canonical: 'https://www.alucalculator.com/changelog/',
  },
  openGraph: {
    title: 'Changelog',
    description:
      'Release notes, engine updates, and specification changelog for AluCAD OS. Tracking web releases, APK deployments, and quota policies.',
    url: 'https://www.alucalculator.com/changelog/',
    type: 'website',
  },
};

interface ChangelogEntry {
  date: string;
  badge: string;
  badgeType: 'release' | 'quota' | 'engine';
  title: string;
  details: string[];
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-08-26',
    badge: `v${APP_VERSION} Web`,
    badgeType: 'release',
    title: `Web Release ${APP_VERSION} — Core Identity & Engineering Engine Alignment`,
    details: [
      `Consolidated web platform version strictly to v${APP_VERSION} across all interfaces.`,
      `Single source of truth architecture implemented via centralized app configuration.`,
      `Eliminated non-deterministic marketing rounding; standardized public copy on exact ${APP_MODULE_COUNT} active modules.`,
      `Verified standard compliance benchmarks across ISO, DIN, and VDI calculation pipelines.`
    ]
  },
  {
    date: '2026-08-24',
    badge: `v${APP_APK_VERSION} APK`,
    badgeType: 'release',
    title: `Mobile & Wear OS Release v${APP_APK_VERSION} — Standalone Field Workstation`,
    details: [
      `Released AluCAD OS v${APP_APK_VERSION} for Android phones, tablets, and Wear OS smartwatches.`,
      'Integrated offline calculations with full local IndexedDB vault caching.',
      'Hardware sensor integration: digital level, clinometer, acoustic analyzer, and GPS surveyor.',
      'Optimized touch target layout and low-power rendering engine.'
    ]
  },
  {
    date: '2026-08-20',
    badge: 'Quota Policy',
    badgeType: 'quota',
    title: 'PDF Export Quota — 3/day Watermarked (Free Tier)',
    details: [
      'Standardized Free tier engineering reports to 3 PDF exports per day with verifiable watermarking.',
      'Audit checksum and verification hash included on all client-facing documentation.',
      'Pro and Team tiers retain unlimited unwatermarked PDF report generation with custom headers.',
      'Deterministic calculation methodology and equation breakdown attached to every exported document.'
    ]
  },
  {
    date: '2026-08-15',
    badge: 'CAD Export',
    badgeType: 'quota',
    title: 'DXF Manufacturing Export Quota — 1/day (Free Tier)',
    details: [
      'Configured Free tier AutoCAD R12 1:1 DXF profile and part export to 1 export per day.',
      'Enforced millimeter precision geometry validation for CNC laser and waterjet cutters.',
      'Pro tier provides unlimited DXF and 3D STL mesh export capability.',
      'Synchronized export quota logic between marketing matrix and live exporter gateway.'
    ]
  },
  {
    date: '2026-08-10',
    badge: 'Kernel Engine',
    badgeType: 'engine',
    title: `Registry Audit — MODULE_REGISTRY Frozen at ${APP_MODULE_COUNT} Modules`,
    details: [
      `MODULE_REGISTRY count locked and frozen at ${APP_MODULE_COUNT} total active modules.`,
      'Public copy updated: all rounded expressions (80+, 90+, 100+) permanently retired.',
      `V2 schema engine registry verified with ${APP_KERNEL_SOLVER_COUNT} dynamic kernel solvers.`,
      'Retired legacy aliases safely with deterministic redirection, preventing 404 dead-ends.'
    ]
  }
];

export default function ChangelogPage() {
  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans select-none">
      {/* Header */}
      <header className="mb-10 text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-tech text-xs uppercase tracking-wider font-semibold">
          <Sparkles size={13} />
          <span>System Audit & Release Ledger</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-tech text-white tracking-tight">
          AluCAD OS Changelog
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed font-normal">
          Chronological record of platform versions, mathematical solver updates, and quota specifications.
        </p>
      </header>

      {/* Timeline Entries */}
      <div className="relative border-l border-white/10 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-10 mb-16">
        {CHANGELOG_ENTRIES.map((entry, index) => (
          <article key={index} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-3.5 w-3.5 rounded-full bg-[var(--bg-0)] border-2 border-cyan-400 group-hover:scale-125 group-hover:border-cyan-300 transition-transform" />

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 hover:border-white/20 transition-colors space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    entry.badgeType === 'release'
                      ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                      : entry.badgeType === 'quota'
                      ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                      : 'bg-purple-950/80 border border-purple-500/40 text-purple-300'
                  }`}>
                    {entry.badge}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold font-tech text-white">
                    {entry.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                  <Calendar size={13} />
                  <time dateTime={entry.date}>{entry.date}</time>
                </div>
              </div>

              <ul className="space-y-2 pt-1">
                {entry.details.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* Footer Navigation Back to System */}
      <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500">
        <span>Current Web: v{APP_VERSION} · APK: v{APP_APK_VERSION}</span>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Library</Link>
          <Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link>
          <Link href="/download" className="hover:text-cyan-400 transition-colors">Download</Link>
        </div>
      </div>
    </main>
  );
}

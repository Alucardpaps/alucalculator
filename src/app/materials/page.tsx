import { Metadata } from 'next';
import Link from 'next/link';
import { MaterialsHubClient } from '@/components/materials/MaterialsHubClient';

export const metadata: Metadata = {
  title: 'Aluminum Alloys & Engineering Materials Hub — 2024-T3, 6061-T6, 7075-T6, 5083-H116 Weight & Properties',
  description:
    'Interactive engineering materials database and aluminum alloy selector. Compare true density (2.66–2.83 g/cm³), yield strength, weldability, chemical composition, and calculate 10-shape metal weight & cost.',
  alternates: {
    canonical: 'https://www.alucalculator.com/materials/',
  },
};

export default function MaterialsIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AluCalc Aluminum Alloys & Engineering Materials Hub',
    url: 'https://www.alucalculator.com/materials/',
    description:
      'Certified engineering properties, true densities, chemical compositions, and interactive weight/cost calculators for 1xxx–7xxx aluminum alloys including 2024-T3, 6061-T6, 7075-T6, and 5083-H116.',
  };

  return (
    <main className="work-shell max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation Strip */}
      <nav className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 mb-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-cyan-400">Home</Link>
          <span>/</span>
          <span className="text-white font-bold">Materials & Alloys Hub</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/welding/" className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 text-slate-300 hover:text-white">
            🔥 Welding Calculator (EC3/EC9) →
          </Link>
          <Link href="/bolt-torque/" className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 text-slate-300 hover:text-white">
            🔩 Bolt Torque (VDI 2230) →
          </Link>
          <Link href="/handbook/" className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 text-slate-300 hover:text-white">
            📘 Engineering Handbook →
          </Link>
        </div>
      </nav>

      <div className="mb-6">
        <p className="work-kicker">EN 573-3 · EN 485-2 · ASTM B209 · MMPDS Aerospace & Structural Database</p>
        <h1 className="work-title">Aluminum Alloys & Engineering Materials Hub</h1>
        <p className="work-lead max-w-4xl">
          Select, compare, and calculate with true certified alloy densities (2.66 to 2.83 g/cm³), yield/tensile/shear limits, Eurocode 9 HAZ factors, and CNC cutting speeds across 15 industrial aluminum tempers.
        </p>
      </div>

      <MaterialsHubClient />
    </main>
  );
}

import React from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';
import { getModuleMethod } from '@/data/moduleMethodology';
import { SolverTransparencyDrawer } from '@/components/solvers/SolverTransparencyDrawer';
import { StaticWorkedExample } from '@/components/solvers/StaticWorkedExample';
import { MathFormula } from '@/components/ui/MathFormula';
import Link from 'next/link';

import { FitsClient } from './FitsClient';

export const metadata: Metadata = {
  title: 'Fits & Tolerances Calculator (ISO 286 / DIN 7154)',
  description:
    'Calculate ISO 286 shaft and hole tolerance limits, fundamental deviations, clearance fits, interference fits, and transition fits for precision tooling.',
  alternates: {
    canonical: 'https://www.alucalculator.com/fits/',
  },
  openGraph: {
    title: 'Fits & Tolerances Calculator (ISO 286 / DIN 7154)',
    description:
      'Calculate ISO 286 shaft and hole tolerance limits, fundamental deviations, clearance fits, interference fits, and transition fits for precision tooling.',
    url: 'https://www.alucalculator.com/fits/',
    type: 'website',
  },
};

export default function FitsPage() {
  const seo = getModuleSeo('fits');
  const method = getModuleMethod('fits');

  return (
    <div className="module-page-frame min-h-screen flex flex-col justify-between bg-[var(--bg-0)] text-white">
      <ModulePageSeoShell slug="fits" seo={seo} />

      <div className="flex-1 w-full p-4 lg:p-8">
        <FitsClient />
      </div>

      <SolverTransparencyDrawer solverId="fits" />

      <section className="shrink-0 border-t border-white/[0.06] bg-[var(--bg-1)]" aria-label="Calculation methodology">
        <details open className="mx-auto max-w-[1400px] px-3 py-2 sm:px-4">
          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-white/50 [&::-webkit-details-marker]:hidden font-mono">
            <span className="inline-flex items-center gap-2">
              <span className="text-white/20">▸</span>
              Formula · assumptions · worked example
              <span className="font-mono font-normal normal-case tracking-normal text-white/20">
                ({method.standards.slice(0, 3).join(' · ')})
              </span>
            </span>
          </summary>
          <div className="mt-3 grid gap-3 border-t border-white/[0.05] pt-3 pb-2 sm:grid-cols-2 lg:grid-cols-3 font-mono">
            <div className="work-panel rounded-lg p-3 bg-white/[0.02] border border-white/[0.06]">
              <h2 className="work-label !mb-1.5 text-xs font-bold uppercase text-[var(--cyan)]">Formula</h2>
              <div className="overflow-x-auto">
                <MathFormula formula={method.formula} />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/35 font-sans">{method.formulaNote}</p>
            </div>
            <div className="work-panel rounded-lg p-3 bg-white/[0.02] border border-white/[0.06]">
              <h2 className="work-label !mb-1.5 text-xs font-bold uppercase text-[var(--ok)]">Assumptions</h2>
              <ul className="space-y-1">
                {method.assumptions.map((a) => (
                  <li key={a} className="text-[11px] leading-snug text-white/45 font-sans">· {a}</li>
                ))}
              </ul>
              {method.academyHref && (
                <Link href={method.academyHref} className="mt-2 inline-block text-[11px] text-[var(--std)]/80 hover:text-[var(--std)] font-mono">
                  {method.academyLabel} →
                </Link>
              )}
            </div>
            <div className="work-panel rounded-lg p-3.5 sm:col-span-2 lg:col-span-3 bg-white/[0.02] border border-white/[0.06]">
              <StaticWorkedExample method={method} defaultTitle={seo.title.split('|')[0].trim()} />
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}

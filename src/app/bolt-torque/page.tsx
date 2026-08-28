import React from 'react';
import { Metadata } from 'next';
import FastenerAssemblyModule from '@/components/modules/mechanical/FastenerAssemblyModule';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { getModuleSeo } from '@/config/seo';
import { getModuleMethod } from '@/data/moduleMethodology';
import { SolverTransparencyDrawer } from '@/components/solvers/SolverTransparencyDrawer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bolt Torque & Preload Calculator (VDI 2230) | AluCalc OS',
  description:
    'Calculate bolt tightening torque, preload clamp force, thread stripping safety, and yield utilization across metric and imperial fastener grades according to VDI 2230 / ISO 898-1.',
  alternates: {
    canonical: 'https://www.alucalculator.com/bolt-torque/',
  },
};

export default function BoltTorquePage() {
  const seo = getModuleSeo('bolt-torque');
  const method = getModuleMethod('bolt-torque');

  return (
    <div className="module-page-frame min-h-screen flex flex-col justify-between bg-[#020408] text-white">
      <ModulePageSeoShell slug="bolt-torque" seo={seo} />
      
      <div className="flex-1 w-full p-4 lg:p-8">
        <FastenerAssemblyModule />
      </div>

      <SolverTransparencyDrawer solverId="bolt-torque" />

      <section className="shrink-0 border-t border-white/[0.06] bg-[#0a0c12]" aria-label="Calculation methodology">
        <details className="mx-auto max-w-[1400px] px-3 py-2 sm:px-4">
          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-white/50 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-white/20">▸</span>
              Formula · assumptions · example
              <span className="font-mono font-normal normal-case tracking-normal text-white/20">
                ({method.standards.slice(0, 3).join(' · ')})
              </span>
            </span>
          </summary>
          <div className="mt-3 grid gap-3 border-t border-white/[0.05] pt-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="work-panel rounded-lg p-3">
              <h2 className="work-label !mb-1.5">Formula</h2>
              <p className="font-mono text-[12px] leading-relaxed text-white/85">{method.formula}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">{method.formulaNote}</p>
            </div>
            <div className="work-panel rounded-lg p-3">
              <h2 className="work-label !mb-1.5">Assumptions</h2>
              <ul className="space-y-1">
                {method.assumptions.map((a) => (
                  <li key={a} className="text-[11px] leading-snug text-white/45">· {a}</li>
                ))}
              </ul>
              {method.academyHref && (
                <Link href={method.academyHref} className="mt-2 inline-block text-[11px] text-[#6b9fff]/80 hover:text-[#9bbdff]">
                  {method.academyLabel} →
                </Link>
              )}
            </div>
            <div className="work-panel rounded-lg p-3 sm:col-span-2 lg:col-span-1">
              <h2 className="work-label !mb-1.5">Worked example</h2>
              <p className="text-[11px] text-white/50">{method.workedExample?.title || `Worked example — ${seo.title.split('|')[0].trim()}`}</p>
              <p className="mt-1 font-mono text-[12px] text-white/80">
                {method.workedExample?.result || 'Open the workbench to run the live solver with the same engine used in production.'}
              </p>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}

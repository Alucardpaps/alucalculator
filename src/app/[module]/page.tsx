import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Hexagon, Calculator } from 'lucide-react';
import { WindowContent } from '@/components/os/WindowContent';
import { ModuleType } from '@/config/modules';
import { getModuleSeo } from '@/config/seo';
import { getModuleMethod } from '@/data/moduleMethodology';
import { ModulePageSeoShell } from '@/components/seo/ModulePageSeoShell';
import { SolverTransparencyDrawer } from '@/components/solvers/SolverTransparencyDrawer';
import { RETIRED_MODULE_REDIRECTS } from '@/config/retiredModules';


/**
 * Data-driven slug → ModuleType lookup map.
 * Aliases (short slugs) point to their canonical ModuleType value.
 * Slugs that are already identical to their ModuleType are included
 * for O(1) deterministic resolution without a fallback cast.
 */
const SLUG_TO_MODULE: Record<string, ModuleType> = {
  // — Profile / Aluminum —
  'aluminum':               'profile-weight',
  'profile-weight':         'profile-weight',
  // — Bearings —
  'bearings':               'bearings',
  // — Unit Converter —
  'converter':              'unit-converter',
  'unit-converter':         'unit-converter',
  // — Fasteners —
  'fasteners':              'fasteners',
  // — Gears & Bearings —
  'gears':                  'gears-bearings',
  'gears-bearings':         'gears-bearings',
  // — Handbook —
  'handbook':               'handbook',
  // — Pumps —
  'pumps':                  'pumps',
  // — Sheet Metal —
  'sheet-metal':            'sheet-metal',
  // — Strength Analysis —
  'strength':               'strength-analysis',
  'strength-analysis':      'strength-analysis',
  // — Welding —
  'welding':                'welding',
  // — 2D Nesting —
  'nesting':                'nesting-2d',
  'nesting-2d':             'nesting-2d',
  // — Fits & Tolerances —
  'fits':                   'fits-tolerances',
  'fits-tolerances':        'fits-tolerances',
  // — Beam Deflection —
  'beam-deflection':        'beam-deflection',
  // — Fatigue Analysis —
  'fatigue':                'fatigue-analysis',
  'fatigue-analysis':       'fatigue-analysis',
  // — Thermal Expansion —
  'thermal':                'thermal-expansion',
  'thermal-expansion':      'thermal-expansion',
  // — Fluid Dynamics —
  'fluids':                 'fluid-dynamics',
  'fluid-dynamics':         'fluid-dynamics',
  // — Aerospace Dynamics —
  'aerospace':              'aerospace-dynamics',
  'aerospace-dynamics':     'aerospace-dynamics',
  // — Physics / Kinematics —
  'kinematics':             'physics-kinematics',
  'physics-kinematics':     'physics-kinematics',
  // — Sketch Pad —
  'sketch-pad':             'sketch-pad',
  // — CAD Editor —
  'cad-editor':             'cad-editor',
  // — Engineering Selection —
  'engineering-selection':  'engineering-selection',
  // — Manufacturing Readiness —
  'mfg-readiness':          'manufacturing-readiness',
  'manufacturing-readiness':'manufacturing-readiness',
  // — Manufacturing Sandbox —
  'mfg-sandbox':            'manufacturing-sandbox',
  'manufacturing-sandbox':  'manufacturing-sandbox',
  // — Cutting Optimizer —
  'cutting-optimizer':      'cutting-optimizer',
  // — Materials DB —
  'materials-db':           'materials-db',
  // — Fatigue Advanced —
  'fatigue-advanced':       'fatigue-advanced',
  // — Motor Selection —
  'motor-selection':        'motor-selection-std',
  'motor-selection-std':    'motor-selection-std',
  // — Gearbox Design —
  'gearbox-design':         'gearbox-design',
  // — Materials Explorer —
  'materials-explorer':     'materials-explorer',
  // — Failure Prediction —
  'failure-prediction':     'failure-prediction',
  // — Failure Diagnosis —
  'failure-diagnosis':      'failure-diagnosis',
  // — Simulation FEA —
  'simulation-fea':         'simulation-fea',
  // — Calculator —
  'calculator':             'calculator',
  // — Reducer Lubrication —
  'reducer-lubrication':    'reducer-lubrication',
  // — Concrete Reinforcement —
  'concrete-reinforcement': 'concrete-reinforcement',
  // — Ohm's Law —
  'ohms-law':               'ohms-law',
  // — Voltage Drop —
  'voltage-drop':           'voltage-drop',
  // — Periodic Table —
  'periodic-table':         'periodic-table',
  // — Chemistry Reactions —
  'chemistry-reactions':    'chemistry-reactions',
  // — Biology Genetics —
  'biology-genetics':       'biology-genetics',
  // — CS Algorithms —
  'cs-algorithms':          'cs-algorithms',
  // — Naval Hydrostatics —
  'naval-hydrostatics':     'naval-hydrostatics',
  // — Physics Solver —
  'physics-solver':         'physics-solver',
  // — Bolt Torque —
  'bolt-torque':            'bolt-torque',
  // — Chain Drive —
  'chain-drive':            'chain-drive',
  // — Belt Drive —
  'belt-drive':             'belt-drive',
  // — Material Selector AI —
  'material-selector-ai':   'material-selector-ai',
  // — Three-Phase Power —
  'three-phase-power':      'three-phase-power',
  // — Digital Logic —
  'digital-logic':          'digital-logic',
  // — Filter Design —
  'filter-design':          'filter-design',
  // — Planetary Gearbox —
  'planetary-gearbox':      'planetary-gearbox',
  // — Machining Details —
  'machining-details':      'machining-details',
  // — Manufacturing —
  'manufacturing':          'manufacturing',
  // — Cost Estimator —
  'cost-estimator':         'cost-estimator',
  // — AI Copilot —
  'ai-copilot':             'ai-copilot',
  // — Engineering Notes —
  'engineering-notes':      'engineering-notes',
  // — Settings —
  'settings':               'settings',
  // — File Explorer —
  'file-explorer':          'file-explorer',
  // — Project Manager —
  'project-manager':        'project-manager',
  // — Project Vault —
  'project-vault':          'project-vault',
  // — Browser —
  'browser':                'browser',
  // — Terminal —
  'terminal':               'terminal',
  // — Holographic Viewer —
  'holographic-viewer':     'holographic-viewer',
  // — Matrix Screensaver —
  'matrix-screensaver':     'matrix-screensaver',
  // — Parametric CAD —
  'parametric-cad':         'parametric-cad',
  // — Live-site aliases & thermal/fluid modules —
  '3-phase-power':          'three-phase-power',
  'chemistry-solver':       'chemistry-reactions',
  'column-buckling':        'column-buckling',
  'pipe-friction':          'pipe-friction',
  'heat-sink':              'heat-sink',
  'hvac-load':              'hvac-load',
  'pressure-vessel':        'pressure-vessel',
  'wind-tunnel':            'wind-tunnel',
  'advanced-spring':        'advanced-spring',
  'vibration':              'vibration',
  'pressure-drop':          'fluid-dynamics',
  'welding-fillet':         'welding-fillet',
};


/**
 * Generate unique metadata for each module page.
 * Uses the Centralized SEO Registry (Master Parameter Table).
 */
export async function generateMetadata({ params }: { params: Promise<{ module: string }> | { module: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module;
  const seo = getModuleSeo(moduleSlug);

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `https://www.alucalculator.com${seo.canonicalSlug}`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://www.alucalculator.com${seo.canonicalSlug}`,
      type: 'website',
    },
  };
}

// Strict Static Path Generation for 'output: export'
export async function generateStaticParams() {
  const modules = [
    'aluminum', 'profile-weight',
    'bearings',
    'converter', 'unit-converter',
    'fasteners',
    'gears', 'gears-bearings',
    'handbook',
    'pumps',
    'sheet-metal',
    'strength', 'strength-analysis',
    'welding',
    'nesting', 'nesting-2d',
    'fits', 'fits-tolerances',
    'sketch-pad',
    'cad-editor',
    'engineering-selection',
    'cutting-optimizer',
    'materials-db',
    'simulation-fea',
    'calculator',
    'beam-deflection',
    'fatigue', 'fatigue-analysis',
    'thermal', 'thermal-expansion',
    'fluids', 'fluid-dynamics',
    'aerospace', 'aerospace-dynamics',
    'kinematics', 'physics-kinematics',
    'mfg-readiness', 'manufacturing-readiness',
    'mfg-sandbox', 'manufacturing-sandbox',
    'fatigue-advanced',
    'motor-selection', 'motor-selection-std',
    'gearbox-design',
    'materials-explorer',
    'failure-prediction',
    'failure-diagnosis',
    'concrete-reinforcement',
    'ohms-law',
    'voltage-drop',
    'periodic-table',
    'chemistry-reactions',
    'biology-genetics',
    'cs-algorithms',
    'naval-hydrostatics',
    'physics-solver',
    'reducer-lubrication',
    'bolt-torque',
    'chain-drive',
    'belt-drive',
    'material-selector-ai',
    'settings',
    'digital-logic',
    'filter-design',
    'three-phase-power',
    'planetary-gearbox',
    'machining-details',
    'manufacturing',
    'cost-estimator',
    'ai-copilot',
    'engineering-notes',
    'file-explorer',
    'project-manager',
    'project-vault',
    'browser',
    'terminal',
    'holographic-viewer',
    'matrix-screensaver',
    'parametric-cad',
    // Headless calculator slugs from calculators.json
    '3-phase-power',
    'bend-allowance',
    'bending-moment',
    'centripetal-force',
    'chemical-molarity',
    'column-buckling',
    'gear-contact-stress',
    'gear-module',
    'gear-ratio',
    'heat-transfer-conduction',
    'hooke-law',
    'ideal-gas-law',
    'kinetic-energy',
    'lift-coefficient',
    'machining-time',
    'newton-second-law',
    'pressure-drop',
    'radioactive-decay',
    'reynolds-number',
    'rocket-equation',
    'roller-chain-drive',
    'specific-gravity',
    'thread-stripping-area',
    'timing-belt-design',
    'tolerance-stackup',
    'transformer-calculation',
    'truss-analysis',
    'v-belt-power',
    'welding-fillet',
    'chemistry-solver',
    'pipe-friction',
    'heat-sink',
    'hvac-load',
    'pressure-vessel',
    'wind-tunnel',
  ];
  const allSlugs = Array.from(new Set([...Object.keys(SLUG_TO_MODULE), ...modules]));
  
  return allSlugs.map((slug) => ({
    module: slug,
  }));
}

export default async function ModernModuleRouterPage({ params }: { params: Promise<{ module: string }> | { module: string } }) {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module.toLowerCase();
  
  if (moduleSlug === 'tolerance-stackup') {
    redirect('/fits');
  }
  if (moduleSlug === '3-phase-power') {
    redirect('/three-phase-power');
  }
  if (moduleSlug === 'simulation-fea') {
    redirect('/fea');
  }
  if (moduleSlug === 'calculators') {
    redirect('/lite');
  }
  if (moduleSlug === 'machine-assembly') {
    redirect('/workspace');
  }
  const retiredTarget = RETIRED_MODULE_REDIRECTS[moduleSlug];
  if (retiredTarget) {
    redirect(retiredTarget);
  }
  const type: ModuleType | null = SLUG_TO_MODULE[moduleSlug] ?? (moduleSlug as ModuleType);

  if (!type) return notFound();

  const method = getModuleMethod(moduleSlug);
  const seo = getModuleSeo(moduleSlug);

  return (
    <div className="module-page-frame">
      <ModulePageSeoShell slug={moduleSlug} seo={seo} />
      <div className="module-page-frame__body workstation-container-bg-cleanse">
        <WindowContent type={type} />
      </div>
      <SolverTransparencyDrawer solverId={moduleSlug} />
      <section className="shrink-0 border-t border-[var(--line)] bg-[var(--bg-1)]" aria-label="Calculation methodology">
        <details className="mx-auto max-w-[1400px] px-3 py-2 sm:px-4">
          <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wider text-[var(--alu-dim)]/50 hover:text-[var(--alu-dim)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-[var(--alu-dim)]/40">▸</span>
              Formula · assumptions · example
              <span className="font-mono font-normal normal-case tracking-normal text-[var(--alu-dim)]/50">
                ({method.standards.slice(0, 3).join(' · ')})
              </span>
            </span>
          </summary>
          <div className="mt-3 grid gap-3 border-t border-[var(--line)] pt-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="work-panel rounded-[var(--radius-s)] p-3 bg-[var(--bg-2)] border border-[var(--line)]">
              <h2 className="work-label !mb-1.5">Formula</h2>
              <p className="font-mono text-[12px] leading-relaxed text-[var(--ink)]">{method.formula}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--alu-dim)]">{method.formulaNote}</p>
            </div>
            <div className="work-panel rounded-[var(--radius-s)] p-3 bg-[var(--bg-2)] border border-[var(--line)]">
              <h2 className="work-label !mb-1.5">Assumptions</h2>
              <ul className="space-y-1">
                {method.assumptions.map((a) => (
                  <li key={a} className="text-[11px] leading-snug text-[var(--alu-dim)]">· {a}</li>
                ))}
              </ul>
              {method.academyHref && (
                <Link href={method.academyHref} className="mt-2 inline-block text-[11px] text-[var(--cyan)] hover:text-[var(--cyan-dim)] font-mono">
                  {method.academyLabel} →
                </Link>
              )}
            </div>
            <div className="work-panel rounded-[var(--radius-s)] p-3 sm:col-span-2 lg:col-span-1 bg-[var(--bg-2)] border border-[var(--line)]">
              <h2 className="work-label !mb-1.5">Worked example</h2>
              <p className="text-[11px] text-[var(--alu-dim)]">{method.workedExample?.title || `Worked example — ${seo.title.split('|')[0].trim()}`}</p>
              <p className="mt-1 font-mono text-[12px] text-[var(--ink)]">
                {method.workedExample?.result || 'Open the workbench to run the live solver with the same engine used in production.'}
              </p>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}

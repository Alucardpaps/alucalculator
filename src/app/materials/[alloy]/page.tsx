import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ALLOY_DATASHEETS,
  COMPARE_PAIRS,
  densityErrorPct,
  getAlloy,
  plateMassKg,
} from '@/data/alloyDatasheets';
import { AlloyInteractiveWorkbench } from '@/components/materials/AlloyInteractiveWorkbench';

interface PageProps {
  params: Promise<{ alloy: string }>;
}

export function generateStaticParams() {
  return ALLOY_DATASHEETS.map((a) => ({ alloy: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { alloy } = await params;
  const data = getAlloy(alloy);
  if (!data) return { title: 'Alloy not found' };
  return {
    title: `${data.name} Density (${data.density.toFixed(2)} g/cm³), Yield Strength, Weight Calculator & Datasheet`,
    description: `${data.name} (${data.standard}): true density ${data.density.toFixed(2)} g/cm³, yield strength ${data.yieldMPa} MPa, tensile ${data.tensileMPa} MPa, shear ${data.shearMPa ?? '—'} MPa, chemical composition & live 10-shape weight calculator.`,
    alternates: { canonical: `https://www.alucalculator.com/materials/${data.slug}/` },
  };
}

export default async function AlloyPage({ params }: PageProps) {
  const { alloy } = await params;
  const data = getAlloy(alloy);
  if (!data) notFound();

  const err = densityErrorPct(data.density);
  const correct = plateMassKg(data.density);
  const assumed = plateMassKg(2.7);
  const relatedPairs = COMPARE_PAIRS.filter((p) => p.includes(data.slug));
  const relatedAlloys = ALLOY_DATASHEETS.filter((a) => a.slug !== data.slug);

  const stats = [
    { label: 'Density (ρ)', value: `${data.density.toFixed(2)} g/cm³`, hint: `${Math.round(data.density * 1000)} kg/m³ · ${(data.density * 0.036127).toFixed(4)} lb/in³` },
    { label: 'Yield (Rp0.2)', value: `${data.yieldMPa} MPa`, hint: `${Math.round(data.yieldMPa * 0.145038)} ksi (0.2% offset)` },
    { label: 'Tensile (Rm)', value: `${data.tensileMPa} MPa`, hint: `${Math.round(data.tensileMPa * 0.145038)} ksi ultimate` },
    { label: 'Shear Strength (τu)', value: data.shearMPa ? `${data.shearMPa} MPa` : '—', hint: 'Ultimate shear' },
    { label: 'Fatigue Limit', value: data.fatigueLimitMPa ? `${data.fatigueLimitMPa} MPa` : '—', hint: '5×10⁸ cycles RR Moore' },
    { label: 'Bearing Yield', value: data.bearingYieldMPa ? `${data.bearingYieldMPa} MPa` : '—', hint: 'e/D = 2.0 pin/rivet' },
    { label: 'Elongation (A)', value: `${data.elongationPct}%`, hint: `Min bend R ≈ ${data.minBendRadiusRatio ?? 2.5}×t` },
    { label: 'Modulus (E)', value: `${data.modulusGPa} GPa`, hint: 'Shear G ≈ 27 GPa' },
    { label: 'Hardness', value: data.hardness, hint: `Temper ${data.temper}` },
    { label: 'α Thermal Exp.', value: `${data.thermalExp.toFixed(1)}×10⁻⁶/K`, hint: '20–100 °C linear' },
    { label: 'k Thermal Cond.', value: `${data.thermalCond} W/m·K`, hint: data.meltingRangeC || 'Solidus–Liquidus' },
    { label: 'Elec. Cond.', value: data.electricalConductivityIACS ? `${data.electricalConductivityIACS}% IACS` : '—', hint: `CNC Vc ≈ ${data.cncVcMMin ?? 380} m/min` },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the exact density of ${data.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The true density of ${data.name} (${data.standard}) is ${data.density.toFixed(2)} g/cm³ (${Math.round(data.density * 1000)} kg/m³ or ${(data.density * 0.036127).toFixed(4)} lb/in³). Using the generic 2.70 g/cm³ aluminum assumption introduces a ${err.toFixed(2)}% mass calculation error.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the yield strength and tensile strength of ${data.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `In the ${data.temper} temper, ${data.name} has a typical yield strength (Rp0.2) of ${data.yieldMPa} MPa, an ultimate tensile strength (Rm) of ${data.tensileMPa} MPa, and an ultimate shear strength of ${data.shearMPa ?? Math.round(data.tensileMPa * 0.6)} MPa with ${data.elongationPct}% elongation.`,
        },
      },
      {
        '@type': 'Question',
        name: `Can ${data.name} be welded?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${data.name} has ${data.weldability.toLowerCase()} arc weldability. ${data.pitfalls[0]}`,
        },
      },
    ],
  };

  return (
    <main className="work-shell max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb & Quick Hub Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-cyan-400">Home</Link>
          <span>/</span>
          <Link href="/materials/" className="hover:text-cyan-400 text-cyan-300 font-bold">Materials & Alloys Hub</Link>
          <span>/</span>
          <span className="text-white font-bold">{data.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/bolt-torque/" className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 text-slate-300 hover:text-white">
            Bolt Torque (VDI 2230) →
          </Link>
          <Link href="/welding/" className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 text-slate-300 hover:text-white">
            Welding & HAZ Calculator →
          </Link>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="work-kicker">{data.family} Series · Temper {data.temper} · {data.standard}</p>
          <h1 className="work-title">{data.name} — Properties, Weight Calculator & Engineering Datasheet</h1>
          <p className="work-lead max-w-3xl">{data.blurb}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 font-mono text-right">
          <div className="text-[10px] uppercase text-cyan-300 font-bold">Specific Strength (Rp0.2 / ρ)</div>
          <div className="text-2xl font-black text-white">{(data.yieldMPa / data.density).toFixed(1)} <span className="text-xs font-normal text-cyan-400">kN·m/kg</span></div>
          <div className="text-[10px] text-slate-400">True ρ = {data.density.toFixed(2)} g/cm³</div>
        </div>
      </div>

      {/* 12-Metric Engineering Readout Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="work-card">
            <p className="hud-label">{s.label}</p>
            <p className="text-lg font-black text-white font-mono">{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Interactive 4-Tab Alloy Workbench */}
      <AlloyInteractiveWorkbench alloy={data} />

      {/* Chemical Composition Table (EN 573-3 / ASTM B209) */}
      {data.composition && (
        <section className="work-card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Chemical Composition Limits (wt% per {data.standard})
              </h2>
              <p className="text-[11px] text-slate-400">
                Nominal elemental mass fractions governing density ({data.density.toFixed(2)} g/cm³), precipitation hardening, and weldability.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/20 px-2 py-0.5 rounded">
              EN 573-3 / AA Registered Limits
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
            {Object.entries(data.composition).map(([elem, pct]) => (
              <div key={elem} className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                <div className="text-[10px] font-bold text-cyan-300">{elem}</div>
                <div className="text-white font-bold mt-0.5 text-[11px]">{pct}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Density vs the 2.70 Myth */}
      <section className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-2">Density vs the 2.70 g/cm³ Assumption</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          True certified density for {data.name} is <strong className="text-white">{data.density.toFixed(2)} g/cm³</strong> ({Math.round(data.density * 1000)} kg/m³). Assuming a generic 2.70 g/cm³ aluminum density introduces a{' '}
          <strong className="text-cyan-300">{err >= 0 ? `+${err.toFixed(2)}%` : `${err.toFixed(2)}%`}</strong> mass error across BOM and freight calculations.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 font-mono">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3">
            <p className="text-[11px] text-emerald-300">1 m² × 10 mm plate (True ρ = {data.density.toFixed(2)})</p>
            <p className="text-xl font-black text-white mt-1">{correct.toFixed(2)} kg</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3">
            <p className="text-[11px] text-slate-400">Same plate if assumed ρ = 2.70</p>
            <p className="text-xl font-black text-slate-300 mt-1">{assumed.toFixed(2)} kg</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3">
            <p className="text-[11px] text-amber-300">Mass Discrepancy per Plate</p>
            <p className="text-xl font-black text-amber-300 mt-1">
              {correct - assumed >= 0 ? '+' : ''}
              {(correct - assumed).toFixed(2)} kg ({((correct - assumed) * 2.20462).toFixed(2)} lb)
            </p>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="work-card">
          <p className="hud-label">Weldability (EN 1999 / AWS)</p>
          <p className="font-bold text-white text-base">{data.weldability}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.weldability === 'Poor'
              ? 'Join via mechanical fasteners (Hi-Lok, 2117-T4 AD rivets, or VDI 2230 bolts).'
              : 'TIG/MIG weldable using ER4043 or ER5356 filler wire.'}
          </p>
        </div>
        <div className="work-card">
          <p className="hud-label">CNC Machinability</p>
          <p className="font-bold text-white text-base">{data.machinability}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Recommended 3-flute carbide Vc ≈ {data.cncVcMMin ?? 380} m/min.
          </p>
        </div>
        <div className="work-card">
          <p className="hud-label">Corrosion & Anodizing</p>
          <p className="font-bold text-white text-base">{data.corrosion}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Melting range: {data.meltingRangeC || '580 – 650 °C'}.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <section className="work-card">
          <h2 className="text-sm font-bold text-white mb-2">Typical Industrial Applications</h2>
          <ul className="text-[13px] text-slate-300 space-y-1.5">
            {data.applications.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        </section>

        <section className="work-card">
          <h2 className="text-sm font-bold text-white mb-2">Engineering Pitfalls & Design Warnings</h2>
          <ul className="text-[13px] text-amber-200/90 space-y-1.5">
            {data.pitfalls.map((a) => (
              <li key={a}>⚠ {a}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Compare & All Alloys Directory */}
      <section className="work-card">
        <h2 className="text-sm font-bold text-white mb-3">Compare {data.name} & Explore All Aluminum Alloys</h2>
        {relatedPairs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-white/10">
            {relatedPairs.map(([a, b]) => (
              <Link key={`${a}-vs-${b}`} href={`/compare/${a}-vs-${b}/`} className="work-btn-primary">
                Compare {a.toUpperCase()} vs {b.toUpperCase()} →
              </Link>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {relatedAlloys.map((a) => (
            <Link key={a.slug} href={`/materials/${a.slug}/`} className="work-btn">
              {a.name} ({a.density.toFixed(2)} g/cm³ · {a.yieldMPa} MPa)
            </Link>
          ))}
          <Link href="/materials/" className="work-btn-primary">
            All Materials & Alloy Selector Hub →
          </Link>
        </div>
      </section>

      <p className="mt-6 text-[11px] text-slate-500 font-mono">
        Methodology Tier 1 Normative Reference: {data.standard} / EN 573-3 / EN 485-2 / MMPDS. Values are typical handbook figures for temper {data.temper}.
      </p>
    </main>
  );
}

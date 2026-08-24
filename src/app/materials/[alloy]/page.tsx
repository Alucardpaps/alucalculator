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
    title: `${data.name} Density, Strength & Properties | AluCalc`,
    description: `${data.name}: density ${data.density.toFixed(2)} g/cm³, yield ${data.yieldMPa} MPa. ${data.blurb}`,
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
  const relatedAlloys = ALLOY_DATASHEETS.filter((a) => a.family === data.family && a.slug !== data.slug).slice(0, 3);

  const stats = [
    { label: 'Density', value: `${data.density.toFixed(2)} g/cm³`, hint: `${Math.round(data.density * 1000)} kg/m³` },
    { label: 'Yield (Rp0.2)', value: `${data.yieldMPa} MPa`, hint: 'typical' },
    { label: 'Tensile (Rm)', value: `${data.tensileMPa} MPa`, hint: 'typical' },
    { label: 'Elongation', value: `${data.elongationPct}%`, hint: 'A' },
    { label: 'Modulus E', value: `${data.modulusGPa} GPa`, hint: 'elastic' },
    { label: 'Hardness', value: data.hardness, hint: data.temper },
    { label: 'α thermal', value: `${data.thermalExp.toFixed(1)}×10⁻⁶/K`, hint: 'expansion' },
    { label: 'k thermal', value: `${data.thermalCond} W/m·K`, hint: 'conductivity' },
  ];

  return (
    <main className="work-shell max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">{data.family} · {data.standard}</p>
      <h1 className="work-title">{data.name}</h1>
      <p className="work-lead">{data.blurb}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="work-card">
            <p className="hud-label">{s.label}</p>
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      <section className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-2">Density vs the 2.70 myth</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          True density for {data.name} is <strong className="text-white">{data.density.toFixed(2)} g/cm³</strong>. Using 2.70 introduces a{' '}
          <strong className="text-white">{err.toFixed(2)}%</strong> mass error.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-slate-500">1 m² × 10 mm plate (correct ρ)</p>
            <p className="text-xl font-black text-emerald-400">{correct.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Same plate if ρ = 2.70</p>
            <p className="text-xl font-black text-white">{assumed.toFixed(2)} kg</p>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="work-card"><p className="hud-label">Weldability</p><p className="font-bold text-white">{data.weldability}</p></div>
        <div className="work-card"><p className="hud-label">Machinability</p><p className="font-bold text-white">{data.machinability}</p></div>
        <div className="work-card"><p className="hud-label">Corrosion resistance</p><p className="font-bold text-white">{data.corrosion}</p></div>
      </div>

      <section className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-2">Typical applications</h2>
        <ul className="text-[13px] text-slate-300 space-y-1">
          {data.applications.map((a) => <li key={a}>• {a}</li>)}
        </ul>
      </section>

      <section className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-2">Engineering pitfalls</h2>
        <ul className="text-[13px] text-slate-300 space-y-1">
          {data.pitfalls.map((a) => <li key={a}>• {a}</li>)}
        </ul>
      </section>

      <section className="work-card">
        <h2 className="text-sm font-bold text-white mb-3">Compare & related</h2>
        <div className="flex flex-wrap gap-2">
          {relatedPairs.map(([a, b]) => (
            <Link key={`${a}-vs-${b}`} href={`/compare/${a}-vs-${b}/`} className="work-btn">
              {a} vs {b}
            </Link>
          ))}
          {relatedAlloys.map((a) => (
            <Link key={a.slug} href={`/materials/${a.slug}/`} className="work-btn">
              {a.name}
            </Link>
          ))}
          <Link href="/aluminum/" className="work-btn-primary">Weight calculator</Link>
        </div>
      </section>

      <p className="mt-6 text-[11px] text-slate-500">
        Values are typical handbook figures for the stated temper ({data.temper}) and are intended for preliminary engineering.
        Production design must use certified material data and applicable design codes. Standard reference: {data.standard}.
      </p>
    </main>
  );
}

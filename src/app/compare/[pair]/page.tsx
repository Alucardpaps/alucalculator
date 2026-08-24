import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  COMPARE_PAIRS,
  densityErrorPct,
  getAlloy,
  plateMassKg,
} from '@/data/alloyDatasheets';

interface PageProps {
  params: Promise<{ pair: string }>;
}

function parsePair(pair: string): [string, string] | null {
  const found = COMPARE_PAIRS.find(([a, b]) => `${a}-vs-${b}` === pair);
  return found ? [...found] : null;
}

export function generateStaticParams() {
  return COMPARE_PAIRS.map(([a, b]) => ({ pair: `${a}-vs-${b}` }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const slugs = parsePair(pair);
  if (!slugs) return { title: 'Compare not found' };
  const left = getAlloy(slugs[0]);
  const right = getAlloy(slugs[1]);
  if (!left || !right) return { title: 'Compare not found' };
  return {
    title: `${left.name} vs ${right.name} — Density, Strength & Weldability | AluCalc`,
    description: `Compare ${left.name} and ${right.name}: density, yield, weldability, and plate mass.`,
    alternates: { canonical: `https://www.alucalculator.com/compare/${pair}/` },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { pair } = await params;
  const slugs = parsePair(pair);
  if (!slugs) notFound();
  const left = getAlloy(slugs[0]);
  const right = getAlloy(slugs[1]);
  if (!left || !right) notFound();

  const rows: { label: string; l: string; r: string }[] = [
    { label: 'Density', l: `${left.density.toFixed(2)} g/cm³`, r: `${right.density.toFixed(2)} g/cm³` },
    { label: 'Error if using 2.70', l: `${densityErrorPct(left.density).toFixed(1)}%`, r: `${densityErrorPct(right.density) >= 0 ? '+' : ''}${densityErrorPct(right.density).toFixed(1)}%` },
    { label: 'Yield strength', l: `${left.yieldMPa} MPa`, r: `${right.yieldMPa} MPa` },
    { label: 'Tensile strength', l: `${left.tensileMPa} MPa`, r: `${right.tensileMPa} MPa` },
    { label: 'Elongation', l: `${left.elongationPct}%`, r: `${right.elongationPct}%` },
    { label: 'Modulus E', l: `${left.modulusGPa} GPa`, r: `${right.modulusGPa} GPa` },
    { label: 'Weldability', l: left.weldability, r: right.weldability },
    { label: 'Machinability', l: left.machinability, r: right.machinability },
    { label: 'Corrosion', l: left.corrosion, r: right.corrosion },
    { label: '1 m² × 10 mm plate', l: `${plateMassKg(left.density).toFixed(2)} kg`, r: `${plateMassKg(right.density).toFixed(2)} kg` },
  ];

  const lighter = left.density <= right.density ? left : right;
  const delta = Math.abs(plateMassKg(left.density) - plateMassKg(right.density));
  const stronger = left.yieldMPa >= right.yieldMPa ? left : right;
  const weaker = left.yieldMPa >= right.yieldMPa ? right : left;

  return (
    <main className="work-shell max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">Alloy compare</p>
      <h1 className="work-title">{left.name} vs {right.name}</h1>

      <div className="grid md:grid-cols-2 gap-3 mb-8">
        {[left, right].map((a) => (
          <Link key={a.slug} href={`/materials/${a.slug}/`} className="work-card hover:border-white/20 transition-colors">
            <h2 className="text-base font-black text-white mb-1">{a.name}</h2>
            <p className="text-[11px] text-slate-500 mb-2">{a.family} · {a.standard}</p>
            <p className="text-[13px] text-slate-400 mb-3">{a.blurb}</p>
            <div className="flex gap-6 text-sm">
              <div><p className="hud-label">Density</p><p className="font-bold text-white">{a.density.toFixed(2)} g/cm³</p></div>
              <div><p className="hud-label">Yield</p><p className="font-bold text-white">{a.yieldMPa} MPa</p></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="work-card overflow-x-auto mb-8">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="py-2 pr-3">Property</th>
              <th className="py-2 px-2">{left.name}</th>
              <th className="py-2 px-2">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/5">
                <td className="py-2 pr-3 text-slate-300">{row.label}</td>
                <td className="py-2 px-2 text-white font-medium">{row.l}</td>
                <td className="py-2 px-2 text-white font-medium">{row.r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="work-card mb-6">
        <h2 className="text-sm font-bold text-white mb-2">Quick selection guide</h2>
        <ul className="text-[13px] text-slate-300 space-y-2">
          <li>
            <strong className="text-white">Choose {weaker.name}</strong> when you prioritize {weaker.applications[0].toLowerCase()}
            {weaker.weldability === 'Good' || weaker.weldability === 'Excellent' ? ', and welding is acceptable' : ''}.
          </li>
          <li>
            <strong className="text-white">Choose {stronger.name}</strong> when you prioritize {stronger.applications[0].toLowerCase()}
            (higher yield: {stronger.yieldMPa} vs {weaker.yieldMPa} MPa).
          </li>
          <li>
            Weight difference on a 1 m² × 10 mm plate: <strong className="text-white">{delta.toFixed(2)} kg</strong> ({lighter.name} is lighter).
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/aluminum/?alloy=${left.slug}&shape=sheet`} className="work-btn-primary">Weight · {left.slug}</Link>
        <Link href={`/aluminum/?alloy=${right.slug}&shape=sheet`} className="work-btn-primary">Weight · {right.slug}</Link>
        <Link href={`/materials/${left.slug}/`} className="work-btn">{left.name} datasheet</Link>
        <Link href={`/materials/${right.slug}/`} className="work-btn">{right.name} datasheet</Link>
        <Link href="/handbook/" className="work-btn">All alloys →</Link>
      </div>
    </main>
  );
}

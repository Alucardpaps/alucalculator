import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Engineering Guides | AluCalc',
  description:
    'Practical engineering guides: aluminum density myth, kerf loss, alloy selection, bolt torque, and bearing life — linked to free calculators.',
  alternates: { canonical: 'https://www.alucalculator.com/guides/' },
};

const GUIDES = [
  {
    id: 'aluminum-density-myth',
    tags: ['Materials', 'Mass'],
    title: 'Why 2.70 g/cm³ is wrong for production',
    body: '5083 and 7075 differ by ~5.6% in density. How the freshman rule-of-thumb breaks weight quotes, shipping, and BOM cost.',
    primary: { href: '/aluminum/', label: 'Open calculator' },
    secondary: { href: '/materials/6061-t6/', label: 'Related' },
  },
  {
    id: 'kerf-and-nesting',
    tags: ['Manufacturing', 'Cost'],
    title: 'Kerf loss & bar nesting',
    body: 'Laser, plasma, waterjet, and saw kerf widths — and how many parts fit on a 6 m stock with remnant waste.',
    primary: { href: '/aluminum/', label: 'Open calculator' },
    secondary: { href: '/nesting/', label: 'Related' },
  },
  {
    id: 'alloy-selection-6061-vs-7075',
    tags: ['Materials', 'Compare'],
    title: '6061-T6 vs 7075-T6',
    body: 'Strength, weldability, corrosion, and density trade-offs. When aerospace strength is the wrong pick for fabricators.',
    primary: { href: '/compare/6061-t6-vs-7075-t6/', label: 'Open calculator' },
    secondary: { href: '/materials/6061-t6/', label: 'Related' },
  },
  {
    id: 'vdi-2230-bolt-torque',
    tags: ['Fasteners'],
    title: 'Bolt preload (VDI 2230 overview)',
    body: 'Preload, friction, and proof load — open the VDI-oriented bolt torque calculator for numbers, not just theory.',
    primary: { href: '/bolt-torque/', label: 'Open calculator' },
    secondary: { href: '/calculators/fasteners/vdi2230/', label: 'Related' },
  },
  {
    id: 'iso-281-bearing-life',
    tags: ['Bearings'],
    title: 'Bearing L10 life (ISO 281)',
    body: 'Dynamic load rating, equivalent load, and life modification — jump to the ISO 281 module for L10h.',
    primary: { href: '/bearings/', label: 'Open calculator' },
    secondary: { href: '/calculators/machine-elements/bearing-life/', label: 'Related' },
  },
  {
    id: 'beam-deflection-basics',
    tags: ['Structural'],
    title: 'Beam deflection basics',
    body: 'Simple supported and cantilever cases — validate hand calcs against the interactive beam module.',
    primary: { href: '/beam-deflection/', label: 'Open calculator' },
    secondary: { href: '/academy/', label: 'Related' },
  },
];

export default function GuidesPage() {
  return (
    <main className="work-shell max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8 max-w-2xl">
        <p className="work-kicker">Guides</p>
        <h1 className="work-title">Engineering guides that open real tools</h1>
        <p className="work-lead">
          Short, practical notes on materials, manufacturing, and machine elements — each one linked to a live AluCalc module so theory never sits alone.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {GUIDES.map((g) => (
          <article key={g.id} className="work-card flex flex-col transition-colors hover:border-white/15">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {g.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="mb-2 text-base font-bold text-white">{g.title}</h2>
            <p className="mb-4 flex-1 text-[13px] leading-relaxed text-slate-400">{g.body}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={g.primary.href} className="work-btn-primary !py-1.5 !text-[10px]">
                {g.primary.label}
              </Link>
              <Link href={g.secondary.href} className="work-btn !py-1.5 !text-[10px]">
                {g.secondary.label}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="work-card mt-10">
        <h2 className="mb-2 text-sm font-bold text-white">Start from data, not slogans</h2>
        <p className="mb-4 text-[13px] leading-relaxed text-slate-400">
          Browse alloy datasheets with real densities, compare grades side-by-side, or jump into the full calculator hub.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/handbook/" className="work-btn-solid">Materials library</Link>
          <Link href="/" className="work-btn">Calculator hub</Link>
          <Link href="/academy/" className="work-btn">Academy</Link>
        </div>
      </section>
    </main>
  );
}

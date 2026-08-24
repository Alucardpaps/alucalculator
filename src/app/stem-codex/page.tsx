import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'STEM Codex | AluCalc',
  description: 'Physics, chemistry, biology, and CS solvers in the AluCalc engineering workspace.',
  alternates: { canonical: 'https://www.alucalculator.com/stem-codex/' },
};

const ITEMS = [
  { href: '/physics-kinematics/', title: 'Physics / Kinematics', body: 'Projectile motion, Newton, energy, and rotation checks.' },
  { href: '/chemistry-reactions/', title: 'Chemistry Reactions', body: 'Stoichiometry, reagents, and reaction safety sandbox.' },
  { href: '/biology-genetics/', title: 'Biology / Genetics', body: 'Mendelian ratios and simple population genetics.' },
  { href: '/cs-algorithms/', title: 'CS Algorithms', body: 'Sorting visualizer, complexity, and data-structure lab.' },
  { href: '/physics-solver/', title: 'Physics CAS Solver', body: 'Symbolic / numeric physics worksheet.' },
  { href: '/periodic-table/', title: 'Periodic Table', body: 'Element lookup with engineering-relevant properties.' },
];

export default function StemCodexPage() {
  return (
    <main className="work-shell max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">STEM</p>
      <h1 className="work-title">STEM Codex</h1>
      <p className="work-lead">
        Cross-disciplinary solvers that sit next to the mechanical workbench — physics, chemistry, biology, and algorithms.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="work-card hover:border-white/20 transition-colors">
            <h2 className="text-sm font-black text-white mb-1">{item.title}</h2>
            <p className="text-[13px] text-slate-400">{item.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

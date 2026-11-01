import { Metadata } from 'next';
import Link from 'next/link';
import { CANONICAL_TOOL_COUNT } from '@/data/canonicalInventory';

export const metadata: Metadata = {
  title: 'About AluCalc OS — Engineering Operating System',
  description: 'Learn about AluCalc OS, our engineering mission, deterministic ISO/DIN calculation standards, and our architecture.',
  alternates: {
    canonical: 'https://www.alucalculator.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-[var(--ink)]">
      <div className="mb-12 border-b border-[var(--line)] pb-8">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--cyan)]">
          Engineering Operating System
        </span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight mt-2 text-[var(--ink)]">
          About AluCalc OS
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--alu)] leading-relaxed">
          AluCalc OS is an industrial-grade engineering operating system built for mechanical designers, structural engineers, and manufacturing technicians.
        </p>
      </div>

      <div className="space-y-10 text-[var(--alu)] leading-relaxed">
        <section>
          <h2 className="text-xl font-mono font-bold text-[var(--ink)] mb-3">Our Core Mission</h2>
          <p>
            Traditional engineering calculation tools are fragmented across spreadsheets, ad-hoc formulas, and expensive closed-source legacy software. AluCalc OS unifies {CANONICAL_TOOL_COUNT} deterministic ISO, DIN, VDI, and ASME engineering solvers with a full-fledged 3D parametric CAD workspace inside a fast, accessible browser environment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-mono font-bold text-[var(--ink)] mb-3">Deterministic Engineering Standards</h2>
          <p className="mb-4">
            Every solver in AluCalc OS cites its authoritative normative standard, scientific formulation, or benchmarked numerical specification:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>VDI 2230 Blatt 1 & ISO 898-1:</strong> Systematic bolted joint calculation and tightening torque.</li>
            <li><strong>ISO 281 & ISO 76:</strong> Dynamic and static load ratings and rating life for rolling bearings.</li>
            <li><strong>ISO 6336 Method B & DIN 3990:</strong> Spur and helical gear bending and pitting safety calculation.</li>
            <li><strong>DIN 743 & DIN 6885:</strong> Stepped shaft fatigue resistance and parallel key surface pressure limits.</li>
            <li><strong>ISO 286-1 / 286-2:</strong> Standard metric limits, fits, and tolerances.</li>
            <li><strong>EN 573-3 & ASTM B221:</strong> Verified mechanical and thermal datasheets for 6000 and 7000 series aluminum alloys.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-mono font-bold text-[var(--ink)] mb-3">Open Interfaces & AI Agent Visibility</h2>
          <p>
            AluCalc OS is built for both human engineers and autonomous AI agents. We expose machine-readable schemas via the Model Context Protocol (MCP), WebMCP in-browser tools, and standard <Link href="/llms.txt" className="text-[var(--cyan)] hover:underline font-mono">llms.txt</Link> specifications.
          </p>
        </section>

        <section className="pt-6 border-t border-[var(--line)] flex flex-wrap gap-4 text-sm font-mono">
          <Link href="/contact" className="px-4 py-2 rounded border border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/20 transition-colors">
            Contact Engineering Team
          </Link>
          <Link href="/calculators" className="px-4 py-2 rounded border border-[var(--line)] bg-[var(--bg-1)] text-[var(--ink)] hover:border-[var(--alu)] transition-colors">
            Browse All Solvers
          </Link>
          <Link href="/pricing" className="px-4 py-2 rounded border border-[var(--line)] bg-[var(--bg-1)] text-[var(--ink)] hover:border-[var(--alu)] transition-colors">
            Licensing & Pricing
          </Link>
        </section>
      </div>
    </div>
  );
}

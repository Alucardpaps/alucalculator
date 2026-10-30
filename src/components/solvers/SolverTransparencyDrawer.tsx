'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, BookOpen, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import solversData from '@/data/solvers.json';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { MathFormula } from '@/components/ui/MathFormula';

export interface SolverTransparencyProps {
  solverId: string;
  defaultOpen?: boolean;
}

export function SolverTransparencyDrawer({ solverId, defaultOpen = false }: SolverTransparencyProps) {
  const { language } = useI18nStore();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const solver = (solversData as any[]).find((s) => s.id === solverId);
  if (!solver) return null;

  return (
    <section className="w-full border-t border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu)] select-none" aria-label="Calculation transparency and standards">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 text-left focus:outline-none group"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/25">
              <ShieldCheck size={14} />
            </span>
            <div className="min-w-0 truncate text-xs font-mono">
              <span className="font-bold text-[var(--ink)] group-hover:text-[var(--cyan)] transition-colors">
                {t12(language, 'Standard Methodology & Assumptions', 'Resmi Standart ve Mühendislik Kabulleri')}
              </span>
              <span className="mx-2 text-[var(--alu-dim)]/50">·</span>
              <span className="text-[var(--cyan)] font-bold uppercase tracking-wider text-[11px]">
                {solver.standard}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--alu-dim)] group-hover:text-white">
            <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--ok)]/15 text-[var(--ok)] text-[10px] font-bold uppercase border border-[var(--ok)]/30">
              {solver.status === 'stable' ? (t12(language, 'STABLE', 'KARARLI')) : solver.status}
            </span>
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--line)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono animate-in slide-in-from-top-1 duration-200">
            {/* 1. Standard and Formula */}
            <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--cyan)] font-bold uppercase text-[11px]">
                <Cpu size={14} />
                <span>{t12(language, 'Normative Formula', 'Resmi Norm ve Formülasyon')}</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] overflow-x-auto text-[11px] text-[var(--ink)]">
                <MathFormula formula={solver.formula} />
              </div>
              <p className="text-[10px] text-[var(--alu-dim)] leading-relaxed font-sans">
                {t12(language, `Computed deterministically per official ${solver.standard} standards without heuristic rounding.`, `${solver.standard} normu kapsamında doğrudan analitik çözücü motoru tarafından hesaplanır.`)}
              </p>
            </div>

            {/* 2. Assumptions */}
            <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--ok)] font-bold uppercase text-[11px]">
                <CheckCircle2 size={14} />
                <span>{t12(language, 'Engineering Assumptions', 'Mühendislik Kabul ve Varsayımları')}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--alu-dim)] font-sans">
                {solver.assumptions.map((a: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--ok)] shrink-0 font-mono">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Limitations and Warnings */}
            <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-[var(--warn)] font-bold uppercase text-[11px]">
                <AlertTriangle size={14} />
                <span>{t12(language, 'Boundary Limitations', 'Kritik Sınırlar ve Uyarılar')}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--alu-dim)] font-sans">
                {solver.limitations.map((l: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--warn)] shrink-0 font-mono">!</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-[var(--line)]">
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-1.5 text-[11px] text-[var(--cyan)] hover:text-[var(--cyan-dim)] font-bold transition-colors font-mono"
                >
                  <BookOpen size={12} />
                  <span>{t12(language, 'Academy Theory & Examples →', 'Akademi Teori ve Örnek Çözüm →')}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default SolverTransparencyDrawer;

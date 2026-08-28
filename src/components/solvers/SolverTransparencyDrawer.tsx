'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, BookOpen, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import solversData from '@/data/solvers.json';
import { useI18nStore } from '@/store/i18nStore';

export interface SolverTransparencyProps {
  solverId: string;
  defaultOpen?: boolean;
}

export function SolverTransparencyDrawer({ solverId, defaultOpen = false }: SolverTransparencyProps) {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const solver = (solversData as any[]).find((s) => s.id === solverId);
  if (!solver) return null;

  return (
    <section className="w-full border-t border-white/10 bg-[#060a12] text-slate-300 select-none" aria-label="Calculation transparency and standards">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-1 text-left group transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={14} />
            </div>
            <div className="truncate text-xs font-mono">
              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                {tr ? 'Kaynak ve Norm Varsayımları' : 'Standard Methodology & Assumptions'}
              </span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                {solver.standard}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 group-hover:text-white">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
              {solver.status === 'stable' ? (tr ? 'DOĞRULANMIŞ' : 'STABLE') : solver.status}
            </span>
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-white/5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono animate-in slide-in-from-top-1 duration-200">
            {/* 1. Standard and Formula */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
                <Cpu size={14} />
                <span>{tr ? 'Resmi Norm ve Formülasyon' : 'Normative Formula'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#03060a] border border-white/5 font-mono text-[11px] text-slate-200 overflow-x-auto">
                <code>{solver.formula}</code>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {tr
                  ? `${solver.standard} normu kapsamında doğrudan analitik çözücü motoru tarafından hesaplanır.`
                  : `Computed deterministically per official ${solver.standard} standards without heuristic rounding.`}
              </p>
            </div>

            {/* 2. Assumptions */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
                <CheckCircle2 size={14} />
                <span>{tr ? 'Mühendislik Kabul ve Varsayımları' : 'Engineering Assumptions'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                {solver.assumptions.map((a: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Limitations and Warnings */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
                <AlertTriangle size={14} />
                <span>{tr ? 'Kritik Sınırlar ve Uyarılar' : 'Boundary Limitations'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                {solver.limitations.map((l: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">!</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-white/5">
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  <BookOpen size={12} />
                  <span>{tr ? 'Akademi Teori ve Örnek Çözüm →' : 'Academy Theory & Examples →'}</span>
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

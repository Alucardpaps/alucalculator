'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Box, Layers, Radio, ShieldCheck, Smartphone, GraduationCap } from 'lucide-react';
import { APP_MAJOR_MINOR } from '@/config/app';
import { solverCount, fieldToolCount, academyUnitCount } from '@/lib/registry/calculatorRegistry';
import { openNotebookLMStudio } from '@/components/notebooklm/NotebookLMStudioModal';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function EngineeringTelemetryBar() {
  const { language } = useI18nStore();

  return (
    <div className="w-full rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] px-3.5 py-2 font-mono text-[11px] text-[var(--alu-dim)] flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: System Status & Canonical Counts */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-[var(--ok)] shrink-0" />
        <span className="font-bold text-[var(--ink)] text-[10px] tracking-wider uppercase">
          ALUCAD OS v{APP_MAJOR_MINOR} · DETERMINISTIC CAE KERNEL
        </span>
        <span className="text-[var(--line-strong)] hidden sm:inline">|</span>
        <span className="text-[var(--ok)] text-[10px] hidden sm:inline-flex items-center gap-1 font-bold">
          <ShieldCheck size={11} /> IEEE 754 BINARY64
        </span>
        <span className="text-[var(--line-strong)] hidden lg:inline">|</span>
        <span className="text-[var(--std)] text-[10px] hidden lg:inline font-bold">
          ISO · DIN · VDI · ASME · EUROCODE
        </span>
      </div>

      {/* Right: Live Canonical Telemetry & NotebookLM Trigger */}
      <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-[var(--ink)]">
        <Link
          href="/calculators"
          className="px-2 py-0.5 rounded-[2px] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] transition-colors flex items-center gap-1 font-bold"
        >
          <Cpu size={11} className="text-[var(--cyan)]" />
          <span>{solverCount} {t12(language, 'Solvers', 'Çözücü')}</span>
        </Link>

        <Link
          href="/field"
          className="hidden sm:flex px-2 py-0.5 rounded-[2px] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] transition-colors items-center gap-1"
        >
          <Smartphone size={11} className="text-[var(--ok)]" />
          <span>{fieldToolCount} {t12(language, 'Field Tools', 'Saha Kiti')}</span>
        </Link>

        <Link
          href="/academy"
          className="hidden md:flex px-2 py-0.5 rounded-[2px] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] transition-colors items-center gap-1"
        >
          <GraduationCap size={11} className="text-[var(--std)]" />
          <span>{academyUnitCount} {t12(language, 'Academy Units', 'Akademi')}</span>
        </Link>

        <button
          type="button"
          onClick={() => openNotebookLMStudio()}
          className="px-2.5 py-0.5 rounded-[2px] bg-[var(--cyan)]/15 border border-[var(--cyan)]/50 text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] transition-colors flex items-center gap-1 font-bold cursor-pointer"
        >
          <Radio size={11} />
          <span>NotebookLM Studio (Alt+N)</span>
        </button>
      </div>
    </div>
  );
}

export default EngineeringTelemetryBar;

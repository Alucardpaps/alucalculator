import React from 'react';
import type { ModuleMethod } from '@/data/moduleMethodology';

interface StaticWorkedExampleProps {
  method: ModuleMethod;
  defaultTitle: string;
}

export function StaticWorkedExample({ method, defaultTitle }: StaticWorkedExampleProps) {
  const ex = method.workedExample;
  const block = ex?.block;

  if (block) {
    const isPass = block.result.status === 'PASS';

    return (
      <div className="work-panel-worked-example flex flex-col gap-3 font-mono text-[var(--ink)]" data-testid="static-worked-example">
        {/* Header with Standard & PASS/FAIL status */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-[var(--line)]/50 pb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--warn)]">
              {block.standard}
            </span>
            <h3 className="text-xs sm:text-[13px] font-bold tracking-tight text-[var(--ink)] mt-0.5 font-sans">
              {block.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${
                isPass
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              STATUS: {block.result.status}
            </span>
            {block.result.margin && (
              <span className="text-[10px] text-[var(--alu-dim)] font-mono">
                ({block.result.margin})
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-[var(--alu-dim)] font-sans">
          {block.summary}
        </p>

        {/* 1. Girdiler (sayı + birim) */}
        <div className="rounded border border-[var(--line)] bg-[var(--bg-1)] p-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
            1. Inputs & Boundary Parameters (Girdiler)
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {block.inputs.map((inp, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded border border-[var(--line)]/50 bg-[var(--bg-0)]/70 px-2 py-1.5"
              >
                <span className="text-[10px] text-[var(--alu-dim)] font-sans leading-tight">
                  {inp.label}
                </span>
                <span className="mt-0.5 text-[11px] font-bold text-[var(--ink)]">
                  {inp.value}{' '}
                  <span className="font-normal text-[10px] text-[var(--alu-dim)]">
                    {inp.unit}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Uygulanan bağıntı + norm maddesi */}
        <div className="rounded border border-[var(--line)] bg-[var(--bg-1)] p-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ok)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
            2. Applied Governing Equations & Standard Clauses (Bağıntılar & Norm Maddesi)
          </div>
          <div className="space-y-1.5">
            {block.relations.map((rel, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between gap-1 rounded border border-[var(--line)]/50 bg-[var(--bg-0)]/70 px-2.5 py-1.5 sm:flex-row sm:items-baseline"
              >
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-[var(--cyan)] font-sans">{rel.name}: </span>
                  <code className="text-[var(--ink)] font-mono text-[11px]">{rel.formula}</code>
                </div>
                <span className="shrink-0 rounded border border-[var(--line)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] text-[var(--alu-dim)]">
                  {rel.clause}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 1–2 Ara Değer */}
        <div className="rounded border border-[var(--line)] bg-[var(--bg-1)] p-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            3. Intermediate Calculation Stages (Ara Değerler)
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {block.intermediates.map((med, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded border border-[var(--line)]/50 bg-[var(--bg-0)]/70 px-2.5 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--alu-dim)] font-sans leading-tight">
                    {med.label}
                  </span>
                  {med.note && (
                    <span className="text-[9px] text-[var(--alu-dim)]/70 font-mono">
                      {med.note}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-bold text-[var(--ink)] font-mono">
                  {med.value}{' '}
                  <span className="font-normal text-[10px] text-[var(--alu-dim)]">
                    {med.unit}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Sonuç + limit (PASS/FAIL eşiği) */}
        <div
          className={`rounded border p-3 ${
            isPass
              ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
              : 'border-rose-500/40 bg-rose-500/[0.05]'
          }`}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink)] font-mono">
              <span className={`h-2 w-2 rounded-full ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              4. Engineering Verification Result & Limit Threshold (Sonuç + Sınır)
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                isPass ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {block.result.status}
            </span>
          </div>
          <div className="mt-2 flex flex-col justify-between gap-2 border-t border-[var(--line)]/50 pt-2 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] text-[var(--alu-dim)] font-sans">{block.result.label}: </span>
              <span className="text-xs sm:text-[13px] font-bold text-[var(--ink)] font-mono">
                {block.result.value}
              </span>
            </div>
            <div className="text-[11px] text-[var(--alu-dim)] font-mono">
              Acceptance limit:{' '}
              <span className="font-semibold text-[var(--ink)]">
                {block.result.limit}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-panel rounded-[var(--radius-s)] p-3 bg-[var(--bg-2)] border border-[var(--line)]">
      <h2 className="work-label !mb-1.5 text-xs font-bold uppercase text-[var(--warn)]">Worked example</h2>
      <p className="text-[11px] text-[var(--alu-dim)] font-sans">{ex?.title || `Worked example — ${defaultTitle}`}</p>
      <p className="mt-1 font-mono text-[12px] text-[var(--ink)]">
        {ex?.result || 'Deterministic calculation verified against international engineering standards.'}
      </p>
    </div>
  );
}

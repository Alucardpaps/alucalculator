'use client';

import { Cpu, ArrowRight, FileCode2 } from 'lucide-react';
import type { AcademyEngineWalkthrough } from '@/data/academyEngineWalkthroughs';
import type { AcademyPageStrings } from '@/locales/academyPageTranslations';

type Props = {
  walkthrough: AcademyEngineWalkthrough;
  t: AcademyPageStrings;
};

export function AcademyEngineWalkthroughPanel({ walkthrough, t }: Props) {
  return (
    <section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] overflow-hidden">
      <div className="px-6 py-5 border-b border-violet-500/10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Cpu size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">{t.engineWalkthroughTitle}</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{t.engineWalkthroughDesc}</p>
          <p className="text-[10px] font-mono text-violet-400/80 mt-2 uppercase tracking-widest">
            {t.engineNameLabel}: {walkthrough.engineName}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-violet-500/10">
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {t.engineInputsLabel}
            </h3>
            <ul className="space-y-1.5">
              {walkthrough.inputs.map((item) => (
                <li key={item} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-emerald-500 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {t.engineOutputsLabel}
            </h3>
            <ul className="space-y-1.5">
              {walkthrough.outputs.map((item) => (
                <li key={item} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-cyan-400 shrink-0">←</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 pt-2 border-t border-white/5">
            <FileCode2 size={12} />
            {walkthrough.sourceFile}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {t.enginePipelineLabel}
          </h3>
          <ol className="space-y-3">
            {walkthrough.steps.map((step, idx) => (
              <li key={step.title} className="relative pl-8">
                <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="text-sm font-bold text-white">{step.title}</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.detail}</p>
                {step.formula && (
                  <code className="block mt-2 text-[11px] font-mono text-cyan-400/90 bg-black/40 px-2 py-1 rounded border border-white/5">
                    {step.formula}
                  </code>
                )}
                {idx < walkthrough.steps.length - 1 && (
                  <ArrowRight size={12} className="text-violet-500/40 mt-2 ml-1 rotate-90 md:rotate-0" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

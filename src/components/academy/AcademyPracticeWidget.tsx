'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { PracticeConfig } from '@/data/academyPractice';
import type { AcademyPageStrings } from '@/locales/academyPageTranslations';
import { markPracticeDone } from '@/lib/academyProgress';

type Props = {
  slug: string;
  config: PracticeConfig;
  t: AcademyPageStrings;
  onDone?: () => void;
};

export function AcademyPracticeWidget({ slug, config, t, onDone }: Props) {
  const initial = useMemo(
    () => Object.fromEntries(config.fields.map((f) => [f.key, f.defaultValue])),
    [config.fields],
  );
  const [values, setValues] = useState<Record<string, number>>(initial);
  const [touched, setTouched] = useState(false);

  const results = useMemo(() => config.compute(values), [config, values]);

  const update = (key: string, raw: string) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    setValues((v) => ({ ...v, [key]: n }));
    if (!touched) {
      setTouched(true);
      markPracticeDone(slug);
      onDone?.();
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6 sm:p-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={18} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">{t.practiceTitle}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.practiceDesc}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.fields.map((field) => (
          <label key={field.key} className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {field.label}
              {field.unit ? ` (${field.unit})` : ''}
            </span>
            <input
              type="number"
              value={values[field.key]}
              min={field.min}
              max={field.max}
              step={field.step ?? 'any'}
              onChange={(e) => update(field.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/40"
            />
          </label>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {results.map((r) => (
          <div key={r.label} className="p-4 rounded-xl bg-black/30 border border-white/5">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{r.label}</div>
            <div className="text-lg font-mono font-bold text-cyan-300 mt-1">{r.value}</div>
            {r.detail && <div className="text-[10px] text-slate-600 mt-1 font-mono">{r.detail}</div>}
          </div>
        ))}
      </div>

      {touched && (
        <p className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">{t.practiceDoneHint}</p>
      )}
    </section>
  );
}

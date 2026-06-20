'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ListTree } from 'lucide-react';
import type { AcademyPageStrings } from '@/locales/academyPageTranslations';
import type { LessonProgress } from '@/lib/academyProgress';

const EMPTY_PROGRESS: LessonProgress = {
  visited: false,
  quizPassed: false,
  practiceDone: false,
  complete: false,
};

export type TocSection = { id: string; label: string };

type Props = {
  sections: TocSection[];
  progress: LessonProgress;
  t: AcademyPageStrings;
  prereqLinks?: { slug: string; title: string; done: boolean }[];
};

export function AcademyLessonSidebar({ sections, progress, t, prereqLinks }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayProgress = mounted ? progress : EMPTY_PROGRESS;
  const displayPrereqLinks =
    prereqLinks?.map((p) => (mounted ? p : { ...p, done: false })) ?? undefined;

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-36 space-y-6">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t.lessonProgressTitle}</div>
          <ProgressRow done={displayProgress.visited} label={t.progressRead} />
          <ProgressRow done={displayProgress.practiceDone} label={t.progressPractice} />
          <ProgressRow done={displayProgress.quizPassed} label={t.progressQuiz} />
          {displayProgress.complete && (
            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 pt-1">{t.lessonComplete}</div>
          )}
        </div>

        {displayPrereqLinks && displayPrereqLinks.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/15 space-y-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-500">{t.prerequisitesLabel}</div>
            {displayPrereqLinks.map((p) => (
              <Link
                key={p.slug}
                href={`/academy/${p.slug}`}
                className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
              >
                {p.done ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Circle size={12} />}
                {p.title}
              </Link>
            ))}
          </div>
        )}

        <nav className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
            <ListTree size={12} /> {t.tocTitle}
          </div>
          <ul className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function ProgressRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      {done ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <Circle size={14} className="text-slate-600 shrink-0" />}
      {label}
    </div>
  );
}

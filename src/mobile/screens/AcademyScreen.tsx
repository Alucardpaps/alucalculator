'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ACADEMY_ARTICLES, getAcademyStats } from '@/data/academyIndex';
import { getCompletionPercent, getLessonProgress } from '@/lib/academyProgress';
import type { MobileStrings } from '@/locales/mobileTranslations';
import type { Language } from '@/store/i18nStore';
import { localizeAcademyArticle } from '@/locales/academyLessonI18n';

type Props = { m: MobileStrings; language: Language };

export function AcademyScreen({ m, language }: Props) {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const stats = getAcademyStats();

  useEffect(() => {
    setMounted(true);
    setProgress(getCompletionPercent(ACADEMY_ARTICLES.length));
  }, []);

  const articles = ACADEMY_ARTICLES.map((a) => localizeAcademyArticle(a, language));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-6">
      <div className="p-5 rounded-2xl border border-indigo-950/40 bg-indigo-950/20">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap size={24} className="text-indigo-400" />
          <h2 className="font-bold text-white">{m.academy}</h2>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">{m.academyProgress}</span>
          <span className="text-indigo-400 font-bold">{mounted ? `${progress}%` : '—'}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: mounted ? `${progress}%` : '0%' }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-3">
          {stats.moduleCount} {m.lessonsComplete} · {stats.totalHours}h
        </p>
      </div>

      <div className="space-y-2">
        {articles.map((article) => {
          const lessonProgress = mounted ? getLessonProgress(article.slug) : null;
          const isComplete = lessonProgress?.complete;
          return (
            <Link
              key={article.slug}
              href={`/academy/${article.slug}`}
              className="flex items-center justify-between p-4 bg-slate-950/30 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isComplete ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border border-slate-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-bold text-xs text-white block truncate">{article.meta.title}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{article.readingTime} min</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-600 shrink-0" />
            </Link>
          );
        })}
      </div>

      <Link
        href="/academy"
        className="block w-full py-3 text-center text-xs font-bold uppercase text-indigo-400 border border-indigo-500/30 rounded-xl"
      >
        {m.continueLearning}
      </Link>
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from '@/data/academyQuizzes';
import type { AcademyPageStrings } from '@/locales/academyPageTranslations';
import { markQuizPassed } from '@/lib/academyProgress';

type Props = {
  slug: string;
  questions: QuizQuestion[];
  t: AcademyPageStrings;
  onPassed?: () => void;
};

export function AcademyQuiz({ slug, questions, t, onPassed }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return null;

  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const passed = submitted && score === questions.length;

  const handleSubmit = () => {
    setSubmitted(true);
    if (score === questions.length) {
      markQuizPassed(slug);
      onPassed?.();
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">{t.quizTitle}</h2>
        <p className="text-sm text-slate-400 mt-1">{t.quizDesc}</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          const isCorrect = submitted && chosen === q.correctIndex;
          const isWrong = submitted && chosen !== undefined && chosen !== q.correctIndex;

          return (
            <div key={q.id} className="space-y-3">
              <p className="text-sm font-bold text-white">
                {qi + 1}. {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const selected = chosen === oi;
                  let cls = 'border-white/10 bg-white/[0.02] hover:border-emerald-500/30';
                  if (submitted && oi === q.correctIndex) cls = 'border-emerald-500/50 bg-emerald-500/10';
                  else if (submitted && selected && oi !== q.correctIndex) cls = 'border-red-500/40 bg-red-500/10';
                  else if (selected) cls = 'border-emerald-500/40 bg-emerald-500/5';

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`text-left text-xs sm:text-sm px-4 py-3 rounded-xl border transition-colors ${cls} disabled:cursor-default`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className={`text-xs leading-relaxed flex gap-2 ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isCorrect ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5 text-red-400" />}
                  {q.explanation}
                </p>
              )}
              {isWrong && null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
        {!submitted ? (
          <button
            type="button"
            disabled={Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            {t.quizSubmit}
          </button>
        ) : (
          <>
            <span className={`text-sm font-bold ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {formatAcademyQuizScore(t.quizScore, score, questions.length)}
            </span>
            {!passed && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
              >
                <RotateCcw size={12} /> {t.quizRetry}
              </button>
            )}
            {passed && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t.quizPassed}</span>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function formatAcademyQuizScore(template: string, score: number, total: number): string {
  return template.replace('{score}', String(score)).replace('{total}', String(total));
}

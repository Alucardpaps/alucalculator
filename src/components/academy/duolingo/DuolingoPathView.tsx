'use client';

import React, { useState } from 'react';
import {
  Check, Lock, Star, Crown, Play, Award, Sparkles,
  Wrench, ShieldCheck, Compass, CircleDot, Cog, Layers, Activity, Zap, Flame, ShieldAlert
} from 'lucide-react';
import { DUOLINGO_100_SECTIONS, DuolingoLesson, DuolingoSection, getDuolingoUiText } from './DuolingoCurriculumData';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';

interface DuolingoPathViewProps {
  onStartLesson: (lesson: DuolingoLesson) => void;
}

export function DuolingoPathView({ onStartLesson }: DuolingoPathViewProps) {
  const { lessonScores } = useAcademyGamificationStore();
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [selectedLesson, setSelectedLesson] = useState<DuolingoLesson | null>(null);

  // Flatten all lessons to check sequential unlock
  const allLessonsFlat = DUOLINGO_100_SECTIONS.flatMap((s) => s.lessons);

  // Determine lesson status
  const getLessonStatus = (lesson: DuolingoLesson) => {
    const score = lessonScores[lesson.slug];
    if (score && score.stars > 0) return 'completed';

    const lessonIdx = allLessonsFlat.findIndex((l) => l.id === lesson.id);
    if (lessonIdx === 0) return 'active';

    const prevLesson = allLessonsFlat[lessonIdx - 1];
    const prevScore = lessonScores[prevLesson?.slug];
    if (prevScore && prevScore.stars > 0) return 'active';

    return 'locked';
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🟢 {getDuolingoUiText(language, 'easy')}</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">🟡 {getDuolingoUiText(language, 'medium')}</span>;
      case 'hard':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">🔴 {getDuolingoUiText(language, 'hard')}</span>;
      case 'expert':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">🔥 {getDuolingoUiText(language, 'expert')}</span>;
      case 'extreme':
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse shadow-lg shadow-amber-500/30">💀 {getDuolingoUiText(language, 'extreme')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-16 pb-28 select-none">
      
      {DUOLINGO_100_SECTIONS.map((section, sIdx) => {
        const isExtremeUnit = section.difficulty === 'extreme';

        return (
          <div key={section.id} id={section.id} className="space-y-8 scroll-mt-20">
            
            {/* ─── UNIT MASTER BANNER ─── */}
            <div
              className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-r ${section.gradient} text-slate-950 shadow-2xl space-y-2 relative overflow-hidden border ${
                isExtremeUnit ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.25)]' : 'border-white/15'
              }`}
            >
              {/* Subtle Ambient Light */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-md">
                    {tr ? `Ünite ${section.number}` : `Unit ${section.number}`}
                  </span>
                  {getDifficultyBadge(section.difficulty)}
                </div>

                <span className="text-xs font-mono font-black text-white/90 bg-black/20 px-2.5 py-0.5 rounded-lg">
                  {section.lessons.length} {tr ? 'Ders' : 'Sections'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight drop-shadow">
                {tr ? section.titleTr : section.titleEn}
              </h2>

              <p className="text-xs text-white/85 font-medium leading-relaxed font-sans pt-0.5">
                {tr ? section.descriptionTr : section.descriptionEn}
              </p>
            </div>

            {/* ─── 10 WINDING STEPPING STONES (THE SNAKE PATH) ─── */}
            <div className="flex flex-col items-center gap-7 pt-2">
              {section.lessons.map((lesson, lIdx) => {
                const status = getLessonStatus(lesson);
                const isSelected = selectedLesson?.id === lesson.id;
                const isBoss = lesson.isBoss;

                // Mathematical sine wave for organic Duolingo snake curve
                const xOffset = Math.sin((lIdx + sIdx * 3) * 1.15) * 60;

                return (
                  <div
                    key={lesson.id}
                    className="relative flex flex-col items-center"
                    style={{ transform: `translateX(${xOffset}px)` }}
                  >
                    {/* Active Bouncing Tooltip Pointer */}
                    {status === 'active' && !isSelected && (
                      <div className="absolute -top-11 z-20 animate-bounce">
                        <div className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-mono font-black text-[11px] uppercase tracking-wider shadow-lg shadow-cyan-500/50 relative">
                          {getDuolingoUiText(language, 'startLesson')}
                          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-400 rotate-45" />
                        </div>
                      </div>
                    )}

                    {/* 3D Round Stepping Stone Button */}
                    <button
                      type="button"
                      disabled={status === 'locked'}
                      onClick={() => {
                        if (status !== 'locked') {
                          setSelectedLesson(lesson);
                        }
                      }}
                      className={`relative rounded-full border-4 flex items-center justify-center transition-all cursor-pointer shadow-2xl ${
                        isBoss ? 'w-22 h-22' : 'w-18 h-18'
                      } ${
                        status === 'completed'
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 text-slate-950 shadow-amber-500/25 border-b-6 border-b-amber-700 active:translate-y-1'
                          : status === 'active'
                          ? isBoss
                            ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-b-6 border-b-purple-900 animate-pulse active:translate-y-1'
                            : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-slate-950 shadow-cyan-500/50 border-b-6 border-b-blue-700 animate-pulse active:translate-y-1'
                          : 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed border-b-6 border-b-slate-950'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check size={isBoss ? 34 : 28} strokeWidth={3.5} className="text-slate-950" />
                      ) : status === 'active' ? (
                        isBoss ? (
                          <Crown size={32} className="text-slate-950 fill-slate-950" />
                        ) : (
                          <Play size={24} className="fill-slate-950 ml-1 text-slate-950" />
                        )
                      ) : (
                        <Lock size={isBoss ? 24 : 18} className="text-slate-600" />
                      )}

                      {/* Small Stars / Crown for Completed */}
                      {status === 'completed' && (
                        <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-amber-400 text-amber-400 flex items-center justify-center text-[10px] font-bold shadow">
                          ★
                        </div>
                      )}
                    </button>

                    {/* Title label beneath node */}
                    <span className="text-[11px] font-mono font-bold text-slate-300 mt-2 max-w-[150px] text-center truncate drop-shadow">
                      {tr ? lesson.titleTr : lesson.titleEn}
                    </span>

                    {/* Interactive Lesson Popover Modal */}
                    {isSelected && (
                      <div className="absolute top-24 z-30 w-80 p-5 rounded-3xl bg-[#080d1a] border border-cyan-500/60 shadow-[0_0_40px_rgba(0,229,255,0.25)] space-y-3.5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                              {lesson.standard}
                            </span>
                            {isBoss && (
                              <span className="text-[10px] font-mono font-black uppercase bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                                👑 BOSS
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-amber-400 font-bold">+{lesson.xpReward} XP</span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {tr ? lesson.titleTr : lesson.titleEn}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-sans">
                            {lesson.steps.length} {tr ? 'etkileşimli adım (Teori + Test)' : 'interactive steps (Theory + Quiz)'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onStartLesson(lesson);
                              setSelectedLesson(null);
                            }}
                            className={`flex-1 py-3 rounded-2xl font-mono font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer ${
                              isBoss
                                ? 'bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 shadow-amber-500/30'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            }`}
                          >
                            {isBoss ? (tr ? '👑 BOSS BAŞLA' : '👑 START BOSS') : getDuolingoUiText(language, 'startLesson')}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedLesson(null)}
                            className="px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono font-bold transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}

    </div>
  );
}

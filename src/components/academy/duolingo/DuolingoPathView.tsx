'use client';

import React, { useState } from 'react';
import {
  Check, Lock, Star, Crown, Play, Award, Sparkles,
  Wrench, ShieldCheck, Compass, CircleDot, Cog, Layers, Activity, Zap
} from 'lucide-react';
import { DUOLINGO_SECTIONS, DuolingoLesson, DuolingoSection } from './DuolingoCurriculumData';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';

interface DuolingoPathViewProps {
  onStartLesson: (lesson: DuolingoLesson) => void;
  tr: boolean;
}

export function DuolingoPathView({ onStartLesson, tr }: DuolingoPathViewProps) {
  const { lessonScores } = useAcademyGamificationStore();
  const [selectedLesson, setSelectedLesson] = useState<DuolingoLesson | null>(null);

  // Determine lesson state (completed, current/active, locked)
  const getLessonStatus = (lesson: DuolingoLesson, allLessons: DuolingoLesson[]) => {
    const score = lessonScores[lesson.slug];
    if (score && score.stars > 0) return 'completed';

    const lessonIdx = allLessons.findIndex((l) => l.id === lesson.id);
    if (lessonIdx === 0) return 'active';

    const prevLesson = allLessons[lessonIdx - 1];
    const prevScore = lessonScores[prevLesson.slug];
    if (prevScore && prevScore.stars > 0) return 'active';

    return 'locked';
  };

  // Flatten all lessons to check sequential unlock
  const allLessonsFlat = DUOLINGO_SECTIONS.flatMap((s) => s.lessons);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 pb-24 select-none">
      
      {DUOLINGO_SECTIONS.map((section, sIdx) => {
        return (
          <div key={section.id} className="space-y-6">
            
            {/* ─── SECTION HEADER BANNER ─── */}
            <div
              className={`p-6 rounded-3xl bg-gradient-to-r ${section.gradient} text-slate-950 shadow-xl space-y-1 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider bg-black/20 text-white px-3 py-1 rounded-full">
                  {tr ? section.titleTr : section.titleEn}
                </span>
                <span className="text-xs font-mono font-bold text-white/90">
                  {section.lessons.length} {tr ? 'Ders' : 'Lessons'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium pt-1 font-sans">
                {tr ? section.descriptionTr : section.descriptionEn}
              </p>
            </div>

            {/* ─── WINDING STEPS OF NODES (THE SNAKE PATH) ─── */}
            <div className="flex flex-col items-center gap-6 pt-4">
              {section.lessons.map((lesson, lIdx) => {
                const status = getLessonStatus(lesson, allLessonsFlat);
                const isSelected = selectedLesson?.id === lesson.id;
                
                // Sine wave offset for natural Duolingo winding path
                const xOffset = Math.sin((lIdx + sIdx * 3) * 1.1) * 55;

                return (
                  <div
                    key={lesson.id}
                    className="relative flex flex-col items-center"
                    style={{ transform: `translateX(${xOffset}px)` }}
                  >
                    {/* Active Bouncing Tooltip Bubble */}
                    {status === 'active' && !isSelected && (
                      <div className="absolute -top-10 z-20 animate-bounce">
                        <div className="px-3 py-1 rounded-xl bg-cyan-400 text-slate-950 font-mono font-black text-[11px] uppercase tracking-wider shadow-lg shadow-cyan-500/40 relative">
                          {tr ? 'BAŞLA' : 'START'}
                          {/* Triangle pointer */}
                          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-cyan-400 rotate-45" />
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
                      className={`relative w-18 h-18 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                        status === 'completed'
                          ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-amber-500/20 border-b-6 border-b-amber-600 active:translate-y-1'
                          : status === 'active'
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-slate-950 shadow-cyan-500/40 border-b-6 border-b-blue-700 animate-pulse active:translate-y-1'
                          : 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed border-b-6 border-b-slate-950'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check size={28} strokeWidth={3.5} className="text-slate-950" />
                      ) : status === 'active' ? (
                        <Play size={24} className="fill-slate-950 ml-1 text-slate-950" />
                      ) : (
                        <Lock size={20} className="text-slate-600" />
                      )}

                      {/* Small Stars / Crown for Completed */}
                      {status === 'completed' && (
                        <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-amber-400 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                          ★
                        </div>
                      )}
                    </button>

                    {/* Title label beneath node */}
                    <span className="text-[11px] font-mono font-bold text-slate-400 mt-2 max-w-[140px] text-center truncate">
                      {tr ? lesson.titleTr : lesson.titleEn}
                    </span>

                    {/* Interactive Lesson Card Popover */}
                    {isSelected && (
                      <div className="absolute top-22 z-30 w-72 p-5 rounded-3xl bg-[#080d1a] border border-cyan-500/50 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                            {lesson.standard}
                          </span>
                          <span className="text-xs font-mono text-amber-400 font-bold">+{lesson.xpReward} XP</span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {tr ? lesson.titleTr : lesson.titleEn}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-sans">
                            {lesson.steps.length} {tr ? 'etkileşimli adım (Teori + Soru)' : 'interactive steps'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onStartLesson(lesson);
                              setSelectedLesson(null);
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                          >
                            {tr ? 'BAŞLA' : 'START'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedLesson(null)}
                            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono font-bold transition cursor-pointer"
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

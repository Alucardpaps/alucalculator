'use client';

import React, { useState } from 'react';
import {
  Check, Lock, Star, Crown, Play, Award, Sparkles,
  Calculator, PenTool, Image as ImageIcon, Zap, ChevronLeft, ChevronRight,
  ShieldCheck, AlertTriangle, Layers, ArrowRight, X
} from 'lucide-react';
import {
  CurriculumLesson,
  CurriculumUnit,
  SupportedLanguage,
  DUOLINGO_I18N
} from './DuolingoCurriculumData';
import { DUOLINGO_UNITS } from './academyCurriculum';
import { ModalityIcon } from './AcademyModalityIcons';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';

interface DuolingoPathViewProps {
  onStartLesson: (lesson: CurriculumLesson) => void;
  activeUnitIndex?: number;
  onSelectUnit?: (index: number) => void;
}

export function DuolingoPathView({ onStartLesson, activeUnitIndex: externalUnitIndex, onSelectUnit }: DuolingoPathViewProps) {
  const { lessonScores } = useAcademyGamificationStore();
  const { language } = useI18nStore();
  const lang = (language in DUOLINGO_I18N.startLesson ? language : 'tr') as SupportedLanguage;

  const [internalUnitIndex, setInternalUnitIndex] = useState(0);
  const currentUnitIndex = externalUnitIndex !== undefined ? externalUnitIndex : internalUnitIndex;
  
  const handleUnitChange = (index: number) => {
    const safeIndex = Math.max(0, Math.min(DUOLINGO_UNITS.length - 1, index));
    if (onSelectUnit) {
      onSelectUnit(safeIndex);
    } else {
      setInternalUnitIndex(safeIndex);
    }
  };

  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);

  // Flatten all lessons across all 10 units to verify sequential unlocks
  const allLessonsFlat = DUOLINGO_UNITS.flatMap((u) => u.lessons);

  // Determine lesson status
  const getLessonStatus = (lesson: CurriculumLesson) => {
    const score = lessonScores[lesson.slug];
    if (score && score.stars > 0) return 'completed';

    const lessonIdx = allLessonsFlat.findIndex((l) => l.id === lesson.id);
    if (lessonIdx === 0) return 'active';

    const prevLesson = allLessonsFlat[lessonIdx - 1];
    const prevScore = lessonScores[prevLesson?.slug];
    if (prevScore && prevScore.stars > 0) return 'active';

    return 'locked';
  };

  const activeUnit: CurriculumUnit = DUOLINGO_UNITS[currentUnitIndex] || DUOLINGO_UNITS[0];
  const isExtremeUnit = activeUnit.difficulty === 'extreme';

  // Calculate unit progress
  const completedInUnit = activeUnit.lessons.filter((l) => {
    const score = lessonScores[l.slug];
    return score && score.stars > 0;
  }).length;
  const unitProgressPct = Math.round((completedInUnit / activeUnit.lessons.length) * 100);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🟢 Başlangıç / Temel</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">🟡 Standart Endüstri</span>;
      case 'hard':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">🔴 İleri Mukavemet</span>;
      case 'expert':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">🔥 Uzman Düzey</span>;
      case 'extreme':
        return <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse shadow-lg shadow-amber-500/30">💀 GRANDMASTER EKSTREM</span>;
      default:
        return null;
    }
  };

  // Node Icon Renderer based on question modality
  const renderNodeIcon = (lesson: CurriculumLesson, status: string) => {
    if (status === 'completed') {
      return <Check size={lesson.isBoss ? 32 : 26} strokeWidth={3.5} className="text-slate-950" />;
    }
    if (lesson.isBoss) {
      return <Crown size={30} className="text-slate-950 fill-slate-950" />;
    }
    if (status === 'locked') {
      return <Lock size={18} className="text-slate-600" />;
    }

    const iconType = lesson.isBoss ? 'boss' : lesson.primaryType;
    return <ModalityIcon type={iconType} size={lesson.isBoss ? 30 : 24} />;
  };

  const getModalityLabel = (pType: string) => {
    switch (pType) {
      case 'calculation':
        return { label: '🧮 Sayısal Hesaplama', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'drawing':
        return { label: '✏️ Vektör Çizimi', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'visual':
        return { label: '🖼️ Görsel Şema Seçimi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'boss':
        return { label: '👑 Boss Sınavı', color: 'bg-amber-500/30 text-amber-300 border-amber-400' };
      case 'quiz':
      default:
        return { label: '⚡ Test & Analiz', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-28 select-none">
      
      {/* ─── 1. TOP UNIT PAGINATION CAROUSEL TABS (1..10) ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-[#080d1a] border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={currentUnitIndex === 0}
            onClick={() => handleUnitChange(currentUnitIndex - 1)}
            className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-slate-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{DUOLINGO_I18N.prevUnit[lang]}</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <span className="font-mono font-black text-xs uppercase tracking-wider text-cyan-400">
              {DUOLINGO_I18N.unit[lang]} {activeUnit.number} / 10
            </span>
          </div>

          <button
            type="button"
            disabled={currentUnitIndex === DUOLINGO_UNITS.length - 1}
            onClick={() => handleUnitChange(currentUnitIndex + 1)}
            className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-slate-300 hover:text-white font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <span className="hidden sm:inline">{DUOLINGO_I18N.nextUnit[lang]}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Horizontal Unit Selector Pills */}
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {DUOLINGO_UNITS.map((u, uIdx) => {
            const isActive = uIdx === currentUnitIndex;
            const isBossUnit = u.difficulty === 'extreme';
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleUnitChange(uIdx)}
                className={`flex-1 min-w-[42px] py-2 rounded-2xl font-mono text-xs font-bold transition text-center cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-105'
                    : isBossUnit
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/5'
                }`}
              >
                {isBossUnit ? '👑 10' : `U${u.number}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. ACTIVE UNIT MASTER HERO BANNER ─── */}
      <div
        className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-r ${activeUnit.gradient} text-slate-950 shadow-2xl space-y-3 relative overflow-hidden border ${
          isExtremeUnit ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : 'border-white/15'
        }`}
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-black uppercase tracking-wider bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-md">
              {activeUnit.title[lang]}
            </span>
            {getDifficultyBadge(activeUnit.difficulty)}
          </div>

          <span className="text-xs font-mono font-black text-white/90 bg-black/20 px-3 py-1 rounded-xl">
            {completedInUnit} / {activeUnit.lessons.length} Tamamlandı (%{unitProgressPct})
          </span>
        </div>

        <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed font-sans pt-1">
          {activeUnit.description[lang]}
        </p>

        {/* Unit Internal Progress Bar */}
        <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/20">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${unitProgressPct}%` }}
          />
        </div>
      </div>

      {/* ─── 3. THE 15 WINDING STEPPING STONES (ACTIVE UNIT ONLY) ─── */}
      <div className="flex flex-col items-center gap-8 pt-4">
        {activeUnit.lessons.map((lesson, lIdx) => {
          const status = getLessonStatus(lesson);
          const isBoss = lesson.isBoss;
          const modality = getModalityLabel(lesson.primaryType);

          // Natural Duolingo winding sine wave curve
          const xOffset = Math.sin(lIdx * 1.05) * 65;

          return (
            <div
              key={lesson.id}
              className="relative flex flex-col items-center"
              style={{ transform: `translateX(${xOffset}px)` }}
            >
              {/* Active Pulsing Tooltip Pointer */}
              {status === 'active' && (
                <div className="absolute -top-11 z-20 animate-bounce">
                  <div className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-mono font-black text-[11px] uppercase tracking-wider shadow-lg shadow-cyan-500/50 relative">
                    {DUOLINGO_I18N.startLesson[lang]}
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
                      ? 'bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 border-amber-300 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.7)] border-b-6 border-b-purple-900 animate-pulse active:translate-y-1'
                      : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-slate-950 shadow-cyan-500/50 border-b-6 border-b-blue-700 animate-pulse active:translate-y-1'
                    : 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed border-b-6 border-b-slate-950'
                }`}
              >
                {renderNodeIcon(lesson, status)}

                {/* Small Badge for Modality */}
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-950/90 border border-white/20 flex items-center justify-center shadow-lg">
                  <ModalityIcon type={isBoss ? 'boss' : lesson.primaryType} size={14} />
                </span>

                {/* Small Gold Star for Completed */}
                {status === 'completed' && (
                  <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-amber-400 text-amber-400 flex items-center justify-center text-[10px] font-bold shadow">
                    ★
                  </div>
                )}
              </button>

              {/* Title & Type Label beneath node */}
              <div className="mt-2 text-center max-w-[170px] space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-slate-200 block truncate drop-shadow">
                  {lesson.title[lang]}
                </span>
                <span className={`inline-block text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${modality.color}`}>
                  {modality.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 4. BOTTOM UNIT NAVIGATION BAR ─── */}
      <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 shadow-xl flex items-center justify-between gap-4 font-mono text-xs">
        <button
          type="button"
          disabled={currentUnitIndex === 0}
          onClick={() => handleUnitChange(currentUnitIndex - 1)}
          className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-slate-300 hover:text-white font-bold transition cursor-pointer flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          <span>{DUOLINGO_I18N.prevUnit[lang]}</span>
        </button>

        <span className="text-slate-400 text-center font-bold">
          Ünite {activeUnit.number} / 10
        </span>

        <button
          type="button"
          disabled={currentUnitIndex === DUOLINGO_UNITS.length - 1}
          onClick={() => handleUnitChange(currentUnitIndex + 1)}
          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <span>{DUOLINGO_I18N.nextUnit[lang]}</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ─── 5. CENTERED NON-COLLIDING LESSON START MODAL (FIXED DIALOG) ─── */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#080d1a] border border-cyan-500/50 shadow-[0_0_50px_rgba(0,229,255,0.3)] space-y-4 animate-in zoom-in-95 duration-200 relative">
            
            {/* Close X */}
            <button
              type="button"
              onClick={() => setSelectedLesson(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header badges */}
            <div className="flex items-center gap-2 pr-8">
              <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
                {selectedLesson.standard || 'ISO/DIN'}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border ${getModalityLabel(selectedLesson.primaryType).color}`}>
                {getModalityLabel(selectedLesson.primaryType).label}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold ml-auto">
                +{selectedLesson.xpReward} XP
              </span>
            </div>

            {/* Lesson Title & Details */}
            <div>
              <h3 className="text-lg font-extrabold text-white leading-snug">
                {selectedLesson.title[lang]}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-sans leading-relaxed">
                {selectedLesson.steps.length} etkileşimli adım (Teori & Formül + Uygulamalı Soru)
              </p>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onStartLesson(selectedLesson);
                  setSelectedLesson(null);
                }}
                className={`w-full py-4 rounded-2xl font-mono font-black text-sm uppercase tracking-wider shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  selectedLesson.isBoss
                    ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-slate-950 shadow-amber-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                <span>{selectedLesson.isBoss ? '👑 BOSS SINAVINI BAŞLAT' : DUOLINGO_I18N.startLesson[lang]}</span>
                <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

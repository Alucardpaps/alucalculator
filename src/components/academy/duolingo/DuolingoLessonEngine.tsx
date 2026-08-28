'use client';

import React, { useState, useMemo } from 'react';
import {
  X, Heart, CheckCircle2, AlertCircle, Award, RotateCcw,
  ChevronRight, Sparkles, Trophy, Volume2, HelpCircle, Check, ArrowRight
} from 'lucide-react';
import { DuolingoLesson, DuolingoLessonStep } from './DuolingoCurriculumData';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';

interface DuolingoLessonEngineProps {
  lesson: DuolingoLesson;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (lessonId: string, earnedXp: number) => void;
  tr: boolean;
}

export function DuolingoLessonEngine({
  lesson,
  isOpen,
  onClose,
  onCompleted,
  tr,
}: DuolingoLessonEngineProps) {
  const { hearts, loseHeart, refillHearts, completeLesson } = useAcademyGamificationStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Match pairs state
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Completion state
  const [isFinished, setIsFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);

  if (!isOpen) return null;

  const currentStep = lesson.steps[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / lesson.steps.length) * 100);

  // Check Multiple Choice Answer
  const handleCheckAnswer = () => {
    if (selectedOption === null || isAnswerChecked) return;

    const isCorrect = selectedOption === currentStep.correctIndex;
    setIsAnswerCorrect(isCorrect);
    setIsAnswerChecked(true);

    if (!isCorrect) {
      loseHeart();
    }
  };

  // Match Pairs Tap
  const handleMatchTap = (item: string, side: 'left' | 'right') => {
    if (side === 'left') {
      setSelectedLeft(item);
    } else if (side === 'right' && selectedLeft) {
      // Check if matches
      const pairs = tr ? currentStep.pairsTr : currentStep.pairsEn;
      const validPair = pairs?.find((p) => p.left === selectedLeft && p.right === item);
      if (validPair) {
        setMatchedPairs((prev) => [...prev, selectedLeft]);
        setSelectedLeft(null);
        // If all pairs matched
        if (pairs && matchedPairs.length + 1 >= pairs.length) {
          setIsAnswerCorrect(true);
          setIsAnswerChecked(true);
        }
      } else {
        // Wrong match
        loseHeart();
        setSelectedLeft(null);
      }
    }
  };

  // Next Step Action
  const handleNextStep = () => {
    setIsAnswerChecked(false);
    setSelectedOption(null);
    setSelectedLeft(null);
    setMatchedPairs([]);

    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Finished lesson!
      const stars = hearts >= 4 ? 3 : hearts >= 2 ? 2 : 1;
      setEarnedStars(stars);
      setIsFinished(true);
      completeLesson(lesson.slug, 100, 100);
      onCompleted(lesson.id, lesson.xpReward);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#030712] text-slate-100 select-none animate-in fade-in duration-200">
      
      {/* ─── 1. TOP PROGRESS BAR & HEARTS ─── */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 font-mono">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Dynamic Filling Progress Bar */}
        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hearts Count */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">
          <Heart size={16} className="fill-rose-500 text-rose-500" />
          <span>{hearts}</span>
        </div>
      </header>

      {/* ─── 2. MAIN LESSON STEP CONTENT ─── */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center overflow-y-auto">
        {!isFinished ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            
            {/* TYPE 1: CONCEPT CARD */}
            {currentStep.type === 'concept' && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/50 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/25">
                  🤖
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    {tr ? 'Mühendislik Hap Bilgisi' : 'Engineering Core Concept'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {tr ? currentStep.titleTr : currentStep.titleEn}
                  </h2>
                </div>

                <div className="p-6 rounded-3xl bg-[#080d1a] border border-white/10 text-sm sm:text-base leading-relaxed text-slate-200 font-medium text-left space-y-4 shadow-xl">
                  <p>{tr ? currentStep.conceptTr : currentStep.conceptEn}</p>

                  {currentStep.formula && (
                    <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-center font-mono text-cyan-300 font-bold text-sm overflow-x-auto">
                      {currentStep.formula}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TYPE 2: MULTIPLE CHOICE QUESTION */}
            {currentStep.type === 'multiple_choice' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {tr ? 'Soru' : 'Question'} {currentStepIndex + 1}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {tr ? currentStep.questionTr : currentStep.questionEn}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {(tr ? currentStep.optionsTr : currentStep.optionsEn)?.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = optIdx === currentStep.correctIndex;

                    let btnClasses = 'bg-[#080d1a] hover:bg-[#0c1324] border-white/10 hover:border-white/20 text-slate-200 border-b-4 border-b-slate-950 active:translate-y-1 active:border-b-0';

                    if (isAnswerChecked) {
                      if (isCorrect) {
                        btnClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold border-b-4 border-b-emerald-900';
                      } else if (isSelected && !isCorrect) {
                        btnClasses = 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold border-b-4 border-b-rose-900';
                      } else {
                        btnClasses = 'bg-slate-950/50 border-white/5 text-slate-600 opacity-50';
                      }
                    } else if (isSelected) {
                      btnClasses = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold border-b-4 border-b-cyan-600';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          if (!isAnswerChecked) setSelectedOption(optIdx);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${btnClasses}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm font-medium">{opt}</span>
                        </div>

                        {isAnswerChecked && isCorrect && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
                        {isAnswerChecked && isSelected && !isCorrect && <AlertCircle size={20} className="text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 3: MATCH PAIRS */}
            {currentStep.type === 'match_pairs' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {tr ? 'Eşleştirme Egzersizi' : 'Matching Exercise'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {tr ? currentStep.titleTr : currentStep.titleEn}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  {/* Left Column */}
                  <div className="space-y-2">
                    {(tr ? currentStep.pairsTr : currentStep.pairsEn)?.map((p, idx) => {
                      const isMatched = matchedPairs.includes(p.left);
                      const isSelected = selectedLeft === p.left;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleMatchTap(p.left, 'left')}
                          className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                            isMatched
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 opacity-60'
                              : isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow'
                              : 'bg-[#080d1a] border-white/10 hover:bg-[#0c1324] text-slate-300'
                          }`}
                        >
                          {p.left}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2">
                    {(tr ? currentStep.pairsTr : currentStep.pairsEn)?.map((p, idx) => {
                      const isMatched = matchedPairs.includes(p.left);

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleMatchTap(p.right, 'right')}
                          className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                            isMatched
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 opacity-60'
                              : 'bg-[#080d1a] border-white/10 hover:bg-[#0c1324] text-slate-300'
                          }`}
                        >
                          {p.right}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ─── 3. LESSON VICTORY CELEBRATION ─── */
          <div className="text-center space-y-6 p-8 rounded-3xl bg-[#080d1a] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 border border-yellow-300/50 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Trophy size={40} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {tr ? 'Harika İş Çıkardın!' : 'Lesson Completed!'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {tr ? `${lesson.titleTr} ünitesini başarıyla tamamladınız.` : `You mastered ${lesson.titleEn}.`}
              </p>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto font-mono">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Kazanılan XP</span>
                <p className="text-xl font-black text-white mt-0.5">+{lesson.xpReward} XP</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Yıldız Skoru</span>
                <p className="text-xl font-black text-yellow-300 mt-0.5">
                  {'★'.repeat(earnedStars)}{'☆'.repeat(3 - earnedStars)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              {tr ? 'Müfredata Dön' : 'Continue to Path'}
            </button>
          </div>
        )}
      </main>

      {/* ─── 4. BOTTOM FEEDBACK DRAWER (DUOLINGO STYLE) ─── */}
      {!isFinished && (
        <footer
          className={`w-full border-t p-4 sm:p-6 transition-all duration-200 ${
            isAnswerChecked
              ? isAnswerCorrect
                ? 'bg-emerald-950/90 border-emerald-500/50'
                : 'bg-rose-950/90 border-rose-500/50'
              : 'bg-[#040711] border-white/10'
          }`}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            {/* Feedback Message */}
            <div>
              {isAnswerChecked ? (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isAnswerCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isAnswerCorrect ? <Check size={20} /> : <X size={20} />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isAnswerCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isAnswerCorrect
                        ? (tr ? 'Mükemmel! Doğru Yanıt' : 'Nicely Done!')
                        : (tr ? 'Doğru Cevap Değil' : 'Incorrect')}
                    </h4>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 line-clamp-1">
                      {tr ? currentStep.explanationTr : currentStep.explanationEn}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {currentStep.type === 'concept'
                    ? (tr ? 'Teoriyi okuyup devam edin.' : 'Read and proceed.')
                    : (tr ? 'Bir seçenek belirleyin.' : 'Select an option.')}
                </span>
              )}
            </div>

            {/* Action Button */}
            <div>
              {currentStep.type === 'concept' ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{tr ? 'Anladım, Devam Et' : 'Continue'}</span>
                  <ChevronRight size={16} />
                </button>
              ) : !isAnswerChecked ? (
                <button
                  type="button"
                  disabled={selectedOption === null && currentStep.type === 'multiple_choice'}
                  onClick={handleCheckAnswer}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  {tr ? 'Kontrol Et' : 'Check'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-8 py-3 rounded-2xl font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer ${
                    isAnswerCorrect
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {tr ? 'Devam Et' : 'Continue'}
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

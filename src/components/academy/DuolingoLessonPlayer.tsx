'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Trophy, 
  Flame, 
  Gem, 
  ArrowRight, 
  RotateCcw,
  Zap,
  HelpCircle,
  Award
} from 'lucide-react';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';
import type { QuizQuestion } from '@/data/academyQuizzes';

export interface InteractiveSlide {
  id: string;
  type: 'concept' | 'multiple_choice' | 'formula_builder' | 'match_pairs' | 'slider_challenge';
  title: string;
  description?: string;
  formula?: string;
  options?: string[];
  correctAnswer?: number | string | string[];
  tokens?: string[];
  pairs?: { left: string; right: string }[];
  explanation: string;
}

interface Props {
  slug: string;
  title: string;
  department?: string;
  questions?: QuizQuestion[];
  onClose: () => void;
  onComplete?: () => void;
}

export function DuolingoLessonPlayer({ slug, title, department = 'Engineering', questions = [], onClose, onComplete }: Props) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';

  const { hearts, loseHeart, refillHearts, completeLesson, soundEnabled } = useAcademyGamificationStore();

  // Generate interactive slides from quiz questions & formulas
  const slides: InteractiveSlide[] = React.useMemo(() => {
    const list: InteractiveSlide[] = [];

    // 1. Concept Intro Slide
    list.push({
      id: 'concept-1',
      type: 'concept',
      title: isTr ? `Temel Mühendislik Prensibi: ${title}` : `Core Principle: ${title}`,
      description: isTr 
        ? `${title} konusundaki formülleri, sınır koşullarını ve güvenlik faktörlerini adım adım çözeceğiz.`
        : `We will solve the governing equations, boundary conditions, and safety margins for ${title}.`,
      explanation: isTr ? 'Hazırsanız başlayalım!' : 'Let\'s begin!',
    });

    // 2. Map Quiz Questions
    questions.forEach((q, idx) => {
      list.push({
        id: `quiz-${idx}`,
        type: 'multiple_choice',
        title: q.question,
        options: q.options,
        correctAnswer: q.correctIndex,
        explanation: q.explanation,
      });
    });

    // 3. Formula Builder Slide (e.g. Stress or Torque formula)
    list.push({
      id: 'formula-builder-1',
      type: 'formula_builder',
      title: isTr ? 'Mühendislik Formülünü Oluştur' : 'Construct the Engineering Equation',
      description: isTr ? 'Aşağıdaki terimleri doğru sırayla dizerek temel bağıntıyı kurun:' : 'Arrange the tokens in order to complete the formula:',
      tokens: ['σ', '=', 'M', '/', 'W', '·', 'SF'],
      correctAnswer: ['σ', '=', 'M', '/', 'W'],
      explanation: isTr ? 'Eğilme gerilmesi formülü: σ = M / W (Moment / Mukavemet Momenti)' : 'Bending stress formula: σ = M / W (Moment / Section Modulus)',
    });

    // 4. Match Pairs Slide (Units & Standards)
    list.push({
      id: 'match-pairs-1',
      type: 'match_pairs',
      title: isTr ? 'Birimleri ve Standartları Eşleştir' : 'Match Units & Standards',
      pairs: [
        { left: 'Gerilme (Stress)', right: 'MPa (N/mm²)' },
        { left: 'Tork (Torque)', right: 'N·m' },
        { left: 'Atalet Momenti (Inertia)', right: 'mm⁴' },
      ],
      explanation: isTr ? 'Tüm birimler SI mühendislik sistemine uygundur.' : 'All units conform to SI engineering standards.',
    });

    return list;
  }, [slug, title, questions, isTr]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [builtTokens, setBuiltTokens] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalResults, setFinalResults] = useState<{ stars: number; xpEarned: number; gemsEarned: number } | null>(null);

  const currentSlide = slides[currentSlideIndex];
  const progressPercent = Math.round(((currentSlideIndex) / slides.length) * 100);

  // Reset slide state on step change
  useEffect(() => {
    setSelectedOption(null);
    setBuiltTokens([]);
    setMatchedPairs({});
    setSelectedLeft(null);
    setIsChecked(false);
    setIsCorrect(false);
  }, [currentSlideIndex]);

  const handleCheckAnswer = () => {
    if (!currentSlide) return;
    let correct = false;

    if (currentSlide.type === 'concept') {
      correct = true;
    } else if (currentSlide.type === 'multiple_choice') {
      correct = selectedOption === currentSlide.correctAnswer;
    } else if (currentSlide.type === 'formula_builder') {
      const target = currentSlide.correctAnswer as string[];
      correct = JSON.stringify(builtTokens) === JSON.stringify(target);
    } else if (currentSlide.type === 'match_pairs') {
      correct = Object.keys(matchedPairs).length === (currentSlide.pairs?.length || 0);
    }

    setIsCorrect(correct);
    setIsChecked(true);

    if (!correct) {
      loseHeart();
    }
  };

  const handleContinue = () => {
    if (currentSlideIndex + 1 < slides.length) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Completed all slides!
      const results = completeLesson(slug, slides.length, slides.length);
      setFinalResults(results);
      setIsFinished(true);
      onComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070a0f] flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="h-16 px-4 sm:px-8 border-b border-white/10 flex items-center justify-between gap-4 max-w-4xl w-full mx-auto">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={20} />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hearts Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-black text-xs">
          <Heart size={16} className="text-rose-500 fill-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Main Slide Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-2xl w-full mx-auto overflow-y-auto">
        {!isFinished ? (
          <div className="w-full space-y-6">
            {/* Slide Question / Title */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {department} · {isTr ? `Soru ${currentSlideIndex + 1} / ${slides.length}` : `Step ${currentSlideIndex + 1} / ${slides.length}`}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-2 leading-snug">
                {currentSlide.title}
              </h2>
              {currentSlide.description && (
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  {currentSlide.description}
                </p>
              )}
            </div>

            {/* Slide Content: Concept */}
            {currentSlide.type === 'concept' && (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto text-blue-400">
                  <Sparkles size={32} />
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {isTr 
                    ? 'Bu derste öğreneceğiniz bağıntılar, ISO ve DIN standartlarında emniyetli makine tasarımının temelini oluşturur.'
                    : 'The governing formulas you will learn in this session form the core foundation of certified machine design.'}
                </p>
              </div>
            )}

            {/* Slide Content: Multiple Choice */}
            {currentSlide.type === 'multiple_choice' && currentSlide.options && (
              <div className="grid gap-3">
                {currentSlide.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  let btnCls = 'bg-white/[0.02] border-white/10 text-slate-200 hover:bg-white/[0.05] hover:border-emerald-500/30';
                  if (isSelected) {
                    btnCls = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isChecked}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl border font-bold text-sm sm:text-base transition-all flex items-center justify-between ${btnCls}`}
                    >
                      <span>{opt}</span>
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Slide Content: Formula Builder */}
            {currentSlide.type === 'formula_builder' && currentSlide.tokens && (
              <div className="space-y-6">
                {/* Construction Zone */}
                <div className="min-h-16 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap gap-2 items-center">
                  {builtTokens.length === 0 ? (
                    <span className="text-xs font-mono text-slate-500 italic">
                      {isTr ? 'Tokenlara tıklayarak formülü buraya yerleştirin...' : 'Tap tokens below to assemble the formula here...'}
                    </span>
                  ) : (
                    builtTokens.map((tok, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isChecked) return;
                          setBuiltTokens(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm"
                      >
                        {tok}
                      </button>
                    ))
                  )}
                </div>

                {/* Available Tokens */}
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {currentSlide.tokens.map((tok, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isChecked}
                      onClick={() => setBuiltTokens(prev => [...prev, tok])}
                      className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 text-white font-mono font-black text-sm transition-all"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slide Content: Match Pairs */}
            {currentSlide.type === 'match_pairs' && currentSlide.pairs && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {currentSlide.pairs.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedLeft(p.left)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        matchedPairs[p.left] 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                          : selectedLeft === p.left 
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {p.left}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {currentSlide.pairs.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedLeft && !matchedPairs[selectedLeft]) {
                          if (p.right === currentSlide.pairs?.find(pair => pair.left === selectedLeft)?.right) {
                            setMatchedPairs(prev => ({ ...prev, [selectedLeft]: p.right }));
                          }
                          setSelectedLeft(null);
                        }
                      }}
                      className="w-full p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-left text-white transition-all font-mono"
                    >
                      {p.right}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion Screen */
          <div className="w-full max-w-md rounded-3xl bg-[#0e141f] border border-white/10 p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Trophy size={42} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">{isTr ? 'Ders Tamamlandı!' : 'Lesson Complete!'}</h3>
              <p className="text-xs text-slate-400 mt-1">{title}</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Award 
                  key={i} 
                  size={32} 
                  className={i < (finalResults?.stars || 3) ? "text-amber-400 fill-amber-400 animate-bounce" : "text-slate-700"} 
                />
              ))}
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <Zap size={16} className="text-blue-400 mx-auto" />
                <p className="text-sm font-black text-white mt-1">+{finalResults?.xpEarned || 35}</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-400">XP</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <Gem size={16} className="text-cyan-400 mx-auto" />
                <p className="text-sm font-black text-white mt-1">+{finalResults?.gemsEarned || 15}</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-400">{isTr ? 'Elmas' : 'Gems'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <Flame size={16} className="text-amber-400 mx-auto" />
                <p className="text-sm font-black text-white mt-1">+1</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-400">{isTr ? 'Seri' : 'Streak'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              {isTr ? 'Tamamla ve Devam Et' : 'Finish and Continue'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action / Banner */}
      {!isFinished && (
        <div className={`border-t p-4 sm:p-6 transition-all ${
          isChecked 
            ? isCorrect 
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200' 
            : 'bg-[#0a0e16]/90 border-white/10'
        }`}>
          <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-4">
            {isChecked ? (
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle2 size={32} className="text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={32} className="text-rose-400 shrink-0" />
                )}
                <div>
                  <p className="font-black text-sm sm:text-base">
                    {isCorrect ? (isTr ? 'Harika İş! +15 XP' : 'Excellent Job! +15 XP') : (isTr ? 'Hatalı Çözüm' : 'Incorrect Solution')}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {currentSlide.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="hidden sm:block text-xs font-mono text-slate-500">
                {isTr ? 'Hazır olduğunuzda kontrol edin' : 'Check your work when ready'}
              </div>
            )}

            {!isChecked ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0 ml-auto"
              >
                {isTr ? 'KONTROL ET' : 'CHECK'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleContinue}
                className={`px-8 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 shrink-0 ml-auto ${
                  isCorrect ? 'bg-emerald-400 text-black hover:bg-emerald-300' : 'bg-rose-500 text-white hover:bg-rose-400'
                }`}
              >
                {isTr ? 'DEVAM ET' : 'CONTINUE'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

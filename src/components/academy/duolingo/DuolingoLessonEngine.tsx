'use client';

import React, { useState } from 'react';
import {
  X, Heart, CheckCircle2, AlertCircle, Award, RotateCcw,
  ChevronRight, Sparkles, Trophy, HelpCircle, Check, ArrowRight,
  Calculator, PenTool, Image as ImageIcon, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight as ArrowRightIcon, RotateCw, RotateCcw as RotateCcwIcon
} from 'lucide-react';
import {
  CurriculumLesson,
  LessonStep,
  SupportedLanguage,
  DUOLINGO_I18N
} from './DuolingoCurriculumData';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';

interface DuolingoLessonEngineProps {
  lesson: CurriculumLesson;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (lessonId: string, earnedXp: number) => void;
}

export function DuolingoLessonEngine({
  lesson,
  isOpen,
  onClose,
  onCompleted,
}: DuolingoLessonEngineProps) {
  const { hearts, loseHeart, completeLesson } = useAcademyGamificationStore();
  const { language } = useI18nStore();
  const lang = (language in DUOLINGO_I18N.startLesson ? language : 'tr') as SupportedLanguage;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Modality States
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [calcInput, setCalcInput] = useState<string>('');
  const [showFormulaHint, setShowFormulaHint] = useState<boolean>(false);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const [selectedVisualCardId, setSelectedVisualCardId] = useState<string | null>(null);

  // Answer Validation State
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Finished state
  const [isFinished, setIsFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);

  if (!isOpen) return null;

  const currentStep: LessonStep = lesson.steps[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / lesson.steps.length) * 100);

  // Generic Answer Check Handler
  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;

    let correct = false;

    if (currentStep.type === 'multiple_choice' && currentStep.questionData) {
      if (selectedOption === null) return;
      correct = selectedOption === currentStep.questionData.correctIndex;
    } else if (currentStep.type === 'calculation_input' && currentStep.calculationData) {
      const num = parseFloat(calcInput.replace(',', '.').trim());
      if (isNaN(num)) return;
      const target = currentStep.calculationData.targetValue;
      const tol = currentStep.calculationData.tolerance;
      correct = Math.abs(num - target) <= tol;
    } else if (currentStep.type === 'diagram_draw' && currentStep.diagramData) {
      if (!selectedVectorId) return;
      const opt = currentStep.diagramData.vectorOptions.find((v) => v.id === selectedVectorId);
      correct = !!opt?.isCorrect;
    } else if (currentStep.type === 'visual_select' && currentStep.visualData) {
      if (!selectedVisualCardId) return;
      const card = currentStep.visualData.cards.find((c) => c.id === selectedVisualCardId);
      correct = !!card?.isCorrect;
    }

    setIsAnswerCorrect(correct);
    setIsAnswerChecked(true);

    if (!correct) {
      loseHeart();
    }
  };

  // Next Step Action
  const handleNextStep = () => {
    setIsAnswerChecked(false);
    setSelectedOption(null);
    setCalcInput('');
    setShowFormulaHint(false);
    setSelectedVectorId(null);
    setSelectedVisualCardId(null);

    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      const stars = hearts >= 4 ? 3 : hearts >= 2 ? 2 : 1;
      setEarnedStars(stars);
      setIsFinished(true);
      completeLesson(lesson.slug, 100, 100);
      onCompleted(lesson.id, lesson.xpReward);
    }
  };

  // SVG Technical Diagram Renderer for Visual Questions
  const renderSvgDiagram = (type: string) => {
    switch (type) {
      case 'stress_notch':
        return (
          <svg className="w-full h-24 sm:h-28 rounded-xl bg-slate-950 p-2" viewBox="0 0 200 80">
            <rect x="10" y="20" width="180" height="40" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <path d="M 90 20 C 95 32 105 32 110 20" fill="#0f172a" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 90 60 C 95 48 105 48 110 60" fill="#0f172a" stroke="#ef4444" strokeWidth="2.5" />
            <circle cx="100" cy="33" r="5" fill="#f97316" opacity="0.8" />
            <circle cx="100" cy="47" r="5" fill="#f97316" opacity="0.8" />
            <text x="100" y="42" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">σ_max</text>
          </svg>
        );
      case 'i_beam_stress':
        return (
          <svg className="w-full h-24 sm:h-28 rounded-xl bg-slate-950 p-2" viewBox="0 0 200 80">
            <path d="M 60 15 L 140 15 L 140 25 L 105 25 L 105 55 L 140 55 L 140 65 L 60 65 L 60 55 L 95 55 L 95 25 L 60 25 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <line x1="40" y1="40" x2="160" y2="40" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
            <text x="100" y="43" textAnchor="middle" fill="#bae6fd" fontSize="7" fontFamily="monospace">N.A. (y=0, σ=0)</text>
          </svg>
        );
      case 'roetscher_cone':
        return (
          <svg className="w-full h-24 sm:h-28 rounded-xl bg-slate-950 p-2" viewBox="0 0 200 80">
            <polygon points="70,15 130,15 150,40 50,40" fill="#3b82f6" opacity="0.6" stroke="#60a5fa" strokeWidth="1.5" />
            <polygon points="50,40 150,40 130,65 70,65" fill="#3b82f6" opacity="0.6" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="100" y1="10" x2="100" y2="70" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="100" y="44" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">tan(φ)=0.5</text>
          </svg>
        );
      case 'pitting_crack':
        return (
          <svg className="w-full h-24 sm:h-28 rounded-xl bg-slate-950 p-2" viewBox="0 0 200 80">
            <rect x="20" y="30" width="160" height="35" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="85" cy="30" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
            <circle cx="115" cy="30" r="12" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
            <path d="M 85 30 L 75 45 M 115 30 L 125 48" stroke="#f87171" strokeWidth="1.5" />
            <text x="100" y="55" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace">Pitting Kraterleri</text>
          </svg>
        );
      case 'rect_beam_stress':
      default:
        return (
          <svg className="w-full h-24 sm:h-28 rounded-xl bg-slate-950 p-2" viewBox="0 0 200 80">
            <rect x="50" y="15" width="100" height="50" fill="#1e293b" stroke="#00e5ff" strokeWidth="2" />
            <line x1="30" y1="40" x2="170" y2="40" stroke="#64748b" strokeDasharray="3 3" />
            <polygon points="60,20 140,20 100,40" fill="#06b6d4" opacity="0.4" />
            <polygon points="100,40 140,60 60,60" fill="#3b82f6" opacity="0.4" />
            <text x="100" y="43" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">σ(y) = M·y / I</text>
          </svg>
        );
    }
  };

  const renderVectorIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <ArrowUp size={22} className="text-cyan-400" />;
      case 'down': return <ArrowDown size={22} className="text-cyan-400" />;
      case 'left': return <ArrowLeft size={22} className="text-cyan-400" />;
      case 'right': return <ArrowRightIcon size={22} className="text-cyan-400" />;
      case 'cw': return <RotateCw size={22} className="text-amber-400" />;
      case 'ccw': return <RotateCcwIcon size={22} className="text-emerald-400" />;
      default: return <ArrowUp size={22} className="text-cyan-400" />;
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
            
            {/* TYPE 1: CONCEPT STEP */}
            {currentStep.type === 'concept' && currentStep.conceptData && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/50 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/25">
                  🤖
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    Mühendislik Hap Bilgisi
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {currentStep.conceptData.title[lang]}
                  </h2>
                </div>

                <div className="p-6 rounded-3xl bg-[#080d1a] border border-white/10 text-sm sm:text-base leading-relaxed text-slate-200 font-medium text-left space-y-4 shadow-xl">
                  <p>{currentStep.conceptData.explanation[lang]}</p>

                  {currentStep.conceptData.formula && (
                    <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-center font-mono text-cyan-300 font-bold text-sm overflow-x-auto">
                      {currentStep.conceptData.formula}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TYPE 2: MULTIPLE CHOICE QUESTION */}
            {currentStep.type === 'multiple_choice' && currentStep.questionData && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Soru {currentStepIndex + 1}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentStep.questionData.question[lang]}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentStep.questionData.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = optIdx === currentStep.questionData?.correctIndex;

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
                          <span className="text-sm font-medium">{opt[lang]}</span>
                        </div>

                        {isAnswerChecked && isCorrect && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
                        {isAnswerChecked && isSelected && !isCorrect && <AlertCircle size={20} className="text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 3: CALCULATION INPUT (🧮 ELDE HESAPLAMA) */}
            {currentStep.type === 'calculation_input' && currentStep.calculationData && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator size={16} />
                    <span>Sayısal Formül Çözümü & Hesaplama</span>
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentStep.calculationData.prompt[lang]}
                  </h2>
                </div>

                {/* Formula Hint Toggle */}
                {currentStep.calculationData.formulaHint && (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-teal-500/30">
                    <button
                      type="button"
                      onClick={() => setShowFormulaHint(!showFormulaHint)}
                      className="text-xs font-mono text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle size={15} />
                      <span>{DUOLINGO_I18N.calculationHint[lang]} {showFormulaHint ? '(Gizle)' : '(Göster)'}</span>
                    </button>
                    {showFormulaHint && (
                      <p className="mt-2 text-xs font-mono text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-teal-500/20">
                        {currentStep.calculationData.formulaHint}
                      </p>
                    )}
                  </div>
                )}

                {/* Numerical Input Box with Unit Badge */}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isAnswerChecked}
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder={DUOLINGO_I18N.enterNumericValue[lang]}
                    className={`w-full p-4.5 pr-20 rounded-2xl bg-[#080d1a] border text-lg font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition ${
                      isAnswerChecked
                        ? isAnswerCorrect
                          ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300'
                          : 'border-rose-500 bg-rose-950/50 text-rose-300'
                        : 'border-teal-500/40 focus:border-teal-400'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono text-teal-300 font-bold">
                    {currentStep.calculationData.unit}
                  </div>
                </div>

                {/* Step-by-Step Explanation when Checked */}
                {isAnswerChecked && (
                  <div className="p-4 rounded-2xl bg-[#0c1427] border border-teal-500/40 space-y-1 animate-in fade-in">
                    <span className="text-[11px] font-mono font-bold text-teal-300 uppercase block">
                      Adım Adım Mühendislik Çözümü:
                    </span>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">
                      {currentStep.calculationData.stepByStepSolution[lang]}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TYPE 4: DIAGRAM VECTOR DRAWING (✏️ FBD ÇİZİM) */}
            {currentStep.type === 'diagram_draw' && currentStep.diagramData && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool size={16} />
                    <span>FBD Kuvvet Vektörü & Reaksiyon Çizimi</span>
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentStep.diagramData.prompt[lang]}
                  </h2>
                </div>

                {/* Direction Option Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentStep.diagramData.vectorOptions.map((v) => {
                    const isSelected = selectedVectorId === v.id;
                    const isCorrect = v.isCorrect;

                    let cardClass = 'bg-[#080d1a] border-white/10 hover:border-indigo-500/40 text-slate-200';
                    if (isAnswerChecked) {
                      if (isCorrect) {
                        cardClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
                      } else if (isSelected && !isCorrect) {
                        cardClass = 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold';
                      } else {
                        cardClass = 'bg-slate-950/50 border-white/5 opacity-50';
                      }
                    } else if (isSelected) {
                      cardClass = 'bg-indigo-500/20 border-indigo-400 text-indigo-200 font-bold shadow-lg shadow-indigo-500/20';
                    }

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedVectorId(v.id)}
                        className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 text-left cursor-pointer ${cardClass}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                          {renderVectorIcon(v.direction)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{v.label[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPE 5: VISUAL SCHEMATIC CARD SELECTION (🖼️ GÖRSEL ŞEMA SEÇİMİ) */}
            {currentStep.type === 'visual_select' && currentStep.visualData && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={16} />
                    <span>Teknik Şema & Gerilme Diyagramı Kartı</span>
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentStep.visualData.prompt[lang]}
                  </h2>
                </div>

                {/* Visual Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentStep.visualData.cards.map((card) => {
                    const isSelected = selectedVisualCardId === card.id;
                    const isCorrect = card.isCorrect;

                    let cardStyle = 'bg-[#080d1a] border-white/10 hover:border-rose-500/40';
                    if (isAnswerChecked) {
                      if (isCorrect) {
                        cardStyle = 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
                      } else if (isSelected && !isCorrect) {
                        cardStyle = 'bg-rose-950/80 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
                      } else {
                        cardStyle = 'bg-slate-950/50 border-white/5 opacity-40';
                      }
                    } else if (isSelected) {
                      cardStyle = 'bg-rose-500/15 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
                    }

                    return (
                      <button
                        key={card.id}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedVisualCardId(card.id)}
                        className={`p-4 rounded-3xl border transition-all text-left space-y-3 cursor-pointer ${cardStyle}`}
                      >
                        {renderSvgDiagram(card.diagramSvgType)}

                        <div>
                          <h4 className="text-sm font-bold text-white">{card.title[lang]}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug font-sans">
                            {card.description[lang]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
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
                {DUOLINGO_I18N.lessonCompleted[lang]}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {lesson.title[lang]} başarıyla tamamlandı.
              </p>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto font-mono">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Kazanılan XP</span>
                <p className="text-xl font-black text-white mt-0.5">+{lesson.xpReward} XP</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Başarı Derecesi</span>
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
              Müfredata Geri Dön
            </button>
          </div>
        )}
      </main>

      {/* ─── 4. BOTTOM ACTION DRAWER ─── */}
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
                        ? DUOLINGO_I18N.correct[lang]
                        : DUOLINGO_I18N.incorrect[lang]}
                    </h4>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 line-clamp-1">
                      {currentStep.questionData?.explanation?.[lang] ||
                       currentStep.calculationData?.stepByStepSolution?.[lang] ||
                       currentStep.diagramData?.explanation?.[lang] ||
                       currentStep.visualData?.explanation?.[lang] ||
                       'Harika mühendislik kavrayışı!'}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {currentStep.type === 'concept'
                    ? 'Teoriyi inceleyip devam ediniz.'
                    : currentStep.type === 'calculation_input'
                    ? 'Sayısal sonucu hesaplayıp giriniz.'
                    : 'Cevabınızı seçip kontrol ediniz.'}
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
                  <span>{DUOLINGO_I18N.continue[lang]}</span>
                  <ChevronRight size={16} />
                </button>
              ) : !isAnswerChecked ? (
                <button
                  type="button"
                  disabled={
                    (currentStep.type === 'multiple_choice' && selectedOption === null) ||
                    (currentStep.type === 'calculation_input' && !calcInput.trim()) ||
                    (currentStep.type === 'diagram_draw' && !selectedVectorId) ||
                    (currentStep.type === 'visual_select' && !selectedVisualCardId)
                  }
                  onClick={handleCheckAnswer}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  {DUOLINGO_I18N.check[lang]}
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
                  {DUOLINGO_I18N.continue[lang]}
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  X, BookOpen, Activity, ShieldCheck, Award, Calculator,
  ExternalLink, Check, ChevronRight, RotateCcw, Sparkles,
  CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';
import { AcademyMvpUnit } from '@/data/academyMvpUnits';
import { AcademyInteractiveSimulators } from './AcademyInteractiveSimulators';
import { CertificateModal } from './CertificateModal';

interface AcademyUnitModalProps {
  unit: AcademyMvpUnit;
  isOpen: boolean;
  onClose: () => void;
  onUnitCompleted: (unitId: string, earnedXp: number) => void;
  isCompleted: boolean;
  tr: boolean;
}

export function AcademyUnitModal({
  unit,
  isOpen,
  onClose,
  onUnitCompleted,
  isCompleted,
  tr,
}: AcademyUnitModalProps) {
  const [activeTab, setActiveTab] = useState<'theory' | 'simulator' | 'quiz' | 'cert'>('theory');

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Reset quiz state when modal opens or unit changes
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setSubmittedQuestions({});
      setIsQuizFinished(false);
      setActiveTab('theory');
    }
  }, [isOpen, unit.id]);

  if (!isOpen) return null;

  const currentQ = unit.questions[currentQuestionIndex];
  const isCurrentSubmitted = submittedQuestions[currentQ.id];
  const selectedOpt = selectedAnswers[currentQ.id];

  const handleSelectOption = (optIdx: number) => {
    if (isCurrentSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handleConfirmAnswer = () => {
    if (selectedOpt === undefined) return;
    setSubmittedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < unit.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finish Quiz
      setIsQuizFinished(true);
      // Calculate score
      let correct = 0;
      unit.questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) correct++;
      });
      const scorePct = Math.round((correct / unit.questions.length) * 100);
      if (scorePct >= 80) {
        onUnitCompleted(unit.id, 100);
      }
    }
  };

  const scoreStats = () => {
    let correct = 0;
    unit.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) correct++;
    });
    const pct = Math.round((correct / unit.questions.length) * 100);
    return { correct, total: unit.questions.length, pct, passed: pct >= 80 };
  };

  const stats = scoreStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl bg-[#060a14] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER BAR ─── */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              U{unit.unitNumber}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {unit.standard}
                </span>
                <span className="text-xs font-mono text-slate-500">· {unit.category}</span>
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <Check size={10} /> {tr ? 'Tamamlandı' : 'Completed'}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                {tr ? unit.titleTr : unit.titleEn}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={unit.solverRoute}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-semibold transition"
            >
              <Calculator size={14} />
              <span>{tr ? 'Canlı Çözücü' : 'Solver'}</span>
              <ExternalLink size={12} />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/10 bg-[#040711] font-mono text-xs overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={14} />
            <span>1. {tr ? 'Normatif Teori & Formüller' : 'Theory & Standards'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={14} className="text-emerald-400" />
            <span>2. {tr ? 'İnteraktif Simülatör Laboratuvarı' : 'Interactive Lab'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={14} className="text-amber-400" />
            <span>3. {tr ? 'Doğrulama Sınavı' : 'Verification Quiz'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cert')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'cert'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award size={14} className="text-yellow-400" />
            <span>4. {tr ? 'Sertifika & Akreditasyon' : 'Certificate'}</span>
          </button>
        </div>

        {/* ─── TAB CONTENT (SCROLLABLE) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 1: THEORY & FORMULAS */}
          {activeTab === 'theory' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  {tr ? 'Mühendislik Özeti' : 'Engineering Abstract'}
                </span>
                <p className="text-sm leading-relaxed text-slate-200 font-medium">
                  {tr ? unit.summaryTr : unit.summaryEn}
                </p>
              </div>

              {/* In-depth Theory */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>{tr ? 'Kapsamlı Normatif Teori' : 'Comprehensive Normative Theory'}</span>
                </h3>
                <div className="p-5 rounded-2xl bg-[#080d1a] border border-white/10 text-sm leading-relaxed text-slate-300 space-y-3 font-normal">
                  <p>{tr ? unit.theoryTr : unit.theoryEn}</p>
                </div>
              </div>

              {/* Governing Formulas */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Calculator size={16} />
                  <span>{tr ? 'Yönetici Standart Formülleri' : 'Governing Standard Formulas'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unit.formulas.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#080d1a] border border-white/10 space-y-1.5 font-mono">
                      <span className="text-xs text-slate-400 font-sans block">{f.label}</span>
                      <p className="text-sm font-bold text-cyan-300 overflow-x-auto whitespace-nowrap py-1">
                        {f.latex}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action to proceed to simulator */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-lg transition cursor-pointer"
                >
                  <span>{tr ? 'İnteraktif Simülatöre Geç' : 'Proceed to Simulator'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {tr ? 'Parametrik Deney ve Hesaplama Laboratuvarı' : 'Parametric Lab Simulator'}
                </h3>
                <p className="text-xs text-slate-400">
                  {tr
                    ? 'Aşağıdaki parametreleri kaydırarak formüllerin davranışını, gerilmeleri ve güvenlik katsayılarını canlı inceleyin.'
                    : 'Adjust parameters live to observe theoretical stress curves and factor of safety in real-time.'}
                </p>
              </div>

              <AcademyInteractiveSimulators unitId={unit.id} />

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('theory')}
                  className="text-xs font-mono text-slate-400 hover:text-white"
                >
                  ← {tr ? 'Teoriye Dön' : 'Back to Theory'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-lg transition cursor-pointer"
                >
                  <span>{tr ? 'Sınava Başla (5 Soru)' : 'Start Quiz (5 Questions)'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP GAMIFIED QUIZ */}
          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {!isQuizFinished ? (
                <div className="space-y-5">
                  {/* Progress Meter */}
                  <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                    <span>
                      {tr ? 'Soru' : 'Question'} {currentQuestionIndex + 1} / {unit.questions.length}
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round(((currentQuestionIndex + 1) / unit.questions.length) * 100)}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / unit.questions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question Card */}
                  <div className="p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-5 shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {tr ? currentQ.questionTr : currentQ.questionEn}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2.5 font-mono text-xs">
                      {(tr ? currentQ.optionsTr : currentQ.optionsEn).map((opt, optIdx) => {
                        const isSelected = selectedOpt === optIdx;
                        const isCorrect = optIdx === currentQ.correctIndex;

                        let styleClasses = 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/20 hover:bg-slate-800';

                        if (isCurrentSubmitted) {
                          if (isCorrect) {
                            styleClasses = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-bold';
                          } else if (isSelected && !isCorrect) {
                            styleClasses = 'bg-rose-950/60 border-rose-500/80 text-rose-300 font-bold';
                          } else {
                            styleClasses = 'bg-slate-950/40 border-white/5 text-slate-600 opacity-60';
                          }
                        } else if (isSelected) {
                          styleClasses = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(optIdx)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${styleClasses}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[11px]">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isCurrentSubmitted && isCorrect && (
                              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            )}
                            {isCurrentSubmitted && isSelected && !isCorrect && (
                              <AlertCircle size={18} className="text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Explanation Card */}
                    {isCurrentSubmitted && (
                      <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-xs leading-relaxed space-y-1 animate-in fade-in">
                        <span className="font-mono font-bold text-cyan-400 uppercase text-[10px]">
                          {selectedOpt === currentQ.correctIndex ? '✓ Doğru Açıklama' : 'ℹ Teknik Açıklama'}:
                        </span>
                        <p className="text-slate-300 font-sans">
                          {tr ? currentQ.explanationTr : currentQ.explanationEn}
                        </p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isCurrentSubmitted ? (selectedOpt === currentQ.correctIndex ? 'Doğru (+20 XP)' : 'Yanlış (0 XP)') : 'Lütfen bir şık seçin'}
                      </span>

                      {!isCurrentSubmitted ? (
                        <button
                          type="button"
                          disabled={selectedOpt === undefined}
                          onClick={handleConfirmAnswer}
                          className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition cursor-pointer"
                        >
                          {tr ? 'Cevabı Onayla' : 'Submit Answer'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{currentQuestionIndex < unit.questions.length - 1 ? (tr ? 'Sonraki Soru' : 'Next Question') : (tr ? 'Sonuçları Gör' : 'View Results')}</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* QUIZ COMPLETED SUMMARY */
                <div className="p-8 rounded-3xl bg-[#080d1a] border border-white/10 text-center space-y-6 shadow-2xl">
                  <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${
                    stats.passed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {stats.passed ? <Award size={32} /> : <RotateCcw size={32} />}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">
                      {stats.passed ? (tr ? 'Tebrikler! Üniteyi Başarıyla Tamamladınız' : 'Unit Passed Successfully!') : (tr ? 'Tekrar Deneyin' : 'Quiz Not Passed')}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {stats.passed
                        ? (tr ? `%${stats.pct} başarı oranıyla ${unit.titleTr} akreditasyonunu kazandınız. (+100 XP)` : `You scored ${stats.pct}% and passed the unit. (+100 XP)`)
                        : (tr ? `%${stats.pct} puan aldınız. Sertifika için en az %80 gereklidir.` : `You scored ${stats.pct}%. 80% required to pass.`)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 max-w-sm mx-auto font-mono text-sm flex justify-around">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Doğru</span>
                      <strong className="text-emerald-400 text-lg">{stats.correct} / {stats.total}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Başarı Oranı</span>
                      <strong className="text-cyan-400 text-lg">%{stats.pct}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Kazanılan XP</span>
                      <strong className="text-amber-400 text-lg">{stats.passed ? '+100' : '0'}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIndex(0);
                        setSelectedAnswers({});
                        setSubmittedQuestions({});
                        setIsQuizFinished(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {tr ? 'Sınavı Tekrarla' : 'Retry Quiz'}
                    </button>

                    {stats.passed && (
                      <button
                        type="button"
                        onClick={() => setCertModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center gap-2"
                      >
                        <Award size={16} />
                        <span>{tr ? 'Sertifikayı İndir (PDF)' : 'Download PDF Certificate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CERTIFICATE */}
          {activeTab === 'cert' && (
            <div className="max-w-xl mx-auto p-8 rounded-3xl bg-[#080d1a] border border-white/10 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 mx-auto flex items-center justify-center">
                <Award size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  {tr ? 'Doğrulanabilir Mühendislik Sertifikası' : 'Verified Engineering Certificate'}
                </h3>
                <p className="text-xs text-slate-400">
                  {tr
                    ? 'Bu üniteyi tamamlayarak SHA-256 kriptografik doğrulama kodlu resmi PDF sertifikanızı alabilirsiniz.'
                    : 'Download your official PDF certificate signed with a cryptographic SHA-256 hash.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ünite:</span>
                  <span className="text-white font-bold">{unit.unitNumber}. {tr ? unit.titleTr : unit.titleEn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Akreditasyon Normu:</span>
                  <span className="text-cyan-400">{unit.standard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Durum:</span>
                  <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isCompleted ? (tr ? '✓ Hak Kazandı' : '✓ Verified') : (tr ? 'Sınavı Geçin (%80+)' : 'Pass Quiz (80%+)')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCertModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Award size={16} />
                <span>{tr ? 'Resmi PDF Sertifikasını Oluştur & İndir' : 'Generate & Download Certificate'}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Embedded Certificate PDF Generator Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        unit={unit}
        score={stats.pct > 0 ? stats.pct : 100}
      />
    </div>
  );
}

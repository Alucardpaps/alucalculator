'use client';

/**
 * 🎓 ALUCALC ACADEMY MVP — 15 CURATED ENGINEERING UNITS
 * 
 * Interactive Hub featuring:
 * - 15 Verified Core Units (VDI 2230, ISO 281, ISO 6336, DIN 743, Euler-Bernoulli, FEA, Nesting, etc.)
 * - Normative Formulas & Theory
 * - Direct Live Solver Links
 * - Interactive 5-Question Multiple Choice Quizzes
 * - Verified PDF Certificate Generator (SHA-verification code)
 * - Local Progress Tracking (X / 15 Units)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, CheckCircle2, ChevronRight, Calculator,
  Award, BookOpen, Layers, Activity, Wrench, ShieldCheck,
  Check, X, RotateCcw, ArrowRight, Sparkles, ExternalLink, Filter
} from 'lucide-react';
import { ACADEMY_MVP_UNITS, AcademyMvpUnit } from '@/data/academyMvpUnits';
import { CertificateModal } from './CertificateModal';
import { useI18nStore } from '@/store/i18nStore';

const STORAGE_KEY = 'alucalc-academy-completed-units';

export function AcademyMvpHub() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(ACADEMY_MVP_UNITS[0].id);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Quiz state for selected unit
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [certificateOpen, setCertificateOpen] = useState<boolean>(false);
  const [certUnit, setCertUnit] = useState<AcademyMvpUnit>(ACADEMY_MVP_UNITS[0]);
  const [certScore, setCertScore] = useState<number>(100);

  // Load completed units from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompletedUnits(JSON.parse(raw));
    } catch {
      setCompletedUnits([]);
    }
  }, []);

  // Save completed units
  const markUnitCompleted = (unitId: string) => {
    setCompletedUnits((prev) => {
      if (prev.includes(unitId)) return prev;
      const updated = [...prev, unitId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const selectedUnit = useMemo(
    () => ACADEMY_MVP_UNITS.find((u) => u.id === selectedUnitId) || ACADEMY_MVP_UNITS[0],
    [selectedUnitId]
  );

  // Reset quiz state when switching units
  useEffect(() => {
    setUserAnswers({});
    setQuizSubmitted(false);
  }, [selectedUnitId]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ACADEMY_MVP_UNITS.map((u) => u.category)));
    return ['All', ...cats];
  }, []);

  const filteredUnits = useMemo(() => {
    if (activeCategory === 'All') return ACADEMY_MVP_UNITS;
    return ACADEMY_MVP_UNITS.filter((u) => u.category === activeCategory);
  }, [activeCategory]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleEvaluateQuiz = () => {
    setQuizSubmitted(true);
    let correct = 0;
    selectedUnit.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    const scorePct = Math.round((correct / selectedUnit.questions.length) * 100);
    if (scorePct >= 80) {
      markUnitCompleted(selectedUnit.id);
    }
  };

  const currentScore = useMemo(() => {
    if (!quizSubmitted) return 0;
    let correct = 0;
    selectedUnit.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / selectedUnit.questions.length) * 100);
  }, [quizSubmitted, userAnswers, selectedUnit]);

  const isPassed = currentScore >= 80;

  const handleOpenCert = () => {
    setCertUnit(selectedUnit);
    setCertScore(currentScore > 0 ? currentScore : 100);
    setCertificateOpen(true);
  };

  const progressPercent = Math.round((completedUnits.length / ACADEMY_MVP_UNITS.length) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-200">
      {/* ─── TOP HEADER & PROGRESS ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AluCalc Engineering Academy
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                15 MVP Units
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {tr
                ? 'Normatif Mühendislik Teorisi · Canlı Hesaplama · İnteraktif Sınav · Doğrulanabilir PDF Sertifika'
                : 'Normative Theory · Interactive Solvers · Verification Quizzes · Official PDF Certificates'}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="flex flex-col sm:items-end gap-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{tr ? 'Müfredat İlerlemesi:' : 'Curriculum Progress:'}</span>
            <span className="font-black text-cyan-300">
              {completedUnits.length} / {ACADEMY_MVP_UNITS.length} {tr ? 'Ünite' : 'Units'} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-48 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* ─── CATEGORY FILTER PILLS ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-md'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── MAIN 2-COLUMN WORKBENCH ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 15-Unit Navigation List (4 Cols) */}
        <div className="lg:col-span-4 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          {filteredUnits.map((u) => {
            const isCompleted = completedUnits.includes(u.id);
            const isSelected = u.id === selectedUnitId;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUnitId(u.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#080d1a] border-white/5 hover:border-white/15 hover:bg-[#0c1222]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : u.unitNumber}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {tr ? u.titleTr : u.titleEn}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      {u.standard} · {u.category}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform ${
                    isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Active Unit Detail, Theory, Formulas, Live Solver & Quiz (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Unit Header Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Unit {selectedUnit.unitNumber} · {selectedUnit.standard}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1.5">
                  {tr ? selectedUnit.titleTr : selectedUnit.titleEn}
                </h2>
              </div>

              {/* Direct Link to Live Solver */}
              <Link
                href={selectedUnit.solverRoute}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono font-bold transition-all shadow-md active:scale-95"
              >
                <Calculator size={14} />
                <span>{tr ? 'Canlı Çözücüyü Aç' : 'Open Live Solver'}</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {/* Theory Explanation */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-300 font-sans">
              <p>{tr ? selectedUnit.theoryTr : selectedUnit.theoryEn}</p>
            </div>

            {/* Normative Formulas Grid */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3 font-mono text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>{tr ? 'Temel Normatif Formüller' : 'Governing Normative Formulas'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedUnit.formulas.map((f, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 font-sans">{f.label}</span>
                    <p className="text-xs font-bold text-amber-300 overflow-x-auto whitespace-nowrap">{f.latex}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── INTERACTIVE QUIZ SECTION ─── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-6 shadow-xl font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  {tr ? 'Teknik Doğrulama Sınavı (5 Soru)' : 'Technical Verification Quiz (5 Questions)'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {tr ? 'Geçme Notu: %80 (En az 4 doğru)' : 'Pass Threshold: 80% (Min 4 correct)'}
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {selectedUnit.questions.map((q, qIndex) => {
                const selectedOpt = userAnswers[q.id];
                const isAnswered = selectedOpt !== undefined;
                const isCorrect = selectedOpt === q.correctIndex;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <p className="text-xs font-bold text-slate-200">
                      <span className="text-cyan-400 font-mono mr-2">{qIndex + 1}.</span>
                      {tr ? q.questionTr : q.questionEn}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(tr ? q.optionsTr : q.optionsEn).map((opt, oIndex) => {
                        const isThisSelected = selectedOpt === oIndex;
                        const isThisCorrectAnswer = oIndex === q.correctIndex;

                        let btnClass = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';
                        if (quizSubmitted) {
                          if (isThisCorrectAnswer) {
                            btnClass = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-bold';
                          } else if (isThisSelected && !isCorrect) {
                            btnClass = 'bg-rose-950/60 border-rose-500/80 text-rose-300';
                          }
                        } else if (isThisSelected) {
                          btnClass = 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold';
                        }

                        return (
                          <button
                            key={oIndex}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(q.id, oIndex)}
                            className={`p-3 rounded-xl border text-xs text-left transition-all ${btnClass}`}
                          >
                            <span className="font-mono text-[10px] text-slate-500 mr-1.5">
                              {String.fromCharCode(65 + oIndex)}.
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Explanation */}
                    {quizSubmitted && (
                      <div
                        className={`p-2.5 rounded-xl text-[11px] font-mono leading-relaxed border ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <span className="font-bold mr-1">{isCorrect ? '✓ Doğru:' : '✗ Yanlış:'}</span>
                        {tr ? q.explanationTr : q.explanationEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={Object.keys(userAnswers).length < selectedUnit.questions.length}
                  onClick={handleEvaluateQuiz}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25"
                >
                  {tr ? 'Cevapları Gönder & Değerlendir' : 'Submit & Evaluate Answers'}
                </button>
              ) : (
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black border ${
                        isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {tr ? 'Puan: %' : 'Score: '}{currentScore}% ({isPassed ? (tr ? 'BAŞARILI' : 'PASSED') : (tr ? 'TEKRAR DENE' : 'RETRY')})
                    </div>
                    {isPassed && (
                      <span className="text-xs font-mono text-emerald-400">
                        {tr ? '✓ Ünite Tamamlandı & Sertifikaya Hak Kazandınız!' : '✓ Unit Completed & Certificate Unlocked!'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all"
                    >
                      <RotateCcw size={12} className="inline mr-1" />
                      {tr ? 'Tekrar Çöz' : 'Retake'}
                    </button>

                    {isPassed && (
                      <button
                        type="button"
                        onClick={handleOpenCert}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 flex items-center gap-1.5"
                      >
                        <Award size={14} />
                        <span>{tr ? 'PDF Sertifikasını Al' : 'Claim Certificate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Certificate Modal */}
      <CertificateModal
        isOpen={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        completedCount={completedUnits.length}
        unitTitle={tr ? certUnit.titleTr : certUnit.titleEn}
        unitStandard={certUnit.standard}
        score={certScore}
      />
    </div>
  );
}

export default AcademyMvpHub;

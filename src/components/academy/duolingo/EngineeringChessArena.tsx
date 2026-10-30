'use client';

import React, { useState } from 'react';
import {
  Trophy, Sparkles, CheckCircle2, AlertCircle, Play, ArrowRight,
  RotateCcw, ShieldCheck, Zap, Cog, Scissors, Box, Layers,
  ChevronRight, X, Star, Award, ExternalLink, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrossModuleBridge, ChessPuzzleConfig } from '@/system/crossModuleBridge';
import { useAcademyGamificationStore } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export function EngineeringChessArena({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { language } = useI18nStore();
  const { addXp, addGems } = useAcademyGamificationStore();

  const puzzles = CrossModuleBridge.getChessPuzzles();
  const [selectedPuzzle, setSelectedPuzzle] = useState<ChessPuzzleConfig>(puzzles[0]);
  const [inputs, setInputs] = useState<Record<string, number | string>>(puzzles[0].initialInputs);
  const [evalResult, setEvalResult] = useState<{ pass: boolean; currentVal: number; messageTr: string; messageEn: string } | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSelectPuzzle = (p: ChessPuzzleConfig) => {
    setSelectedPuzzle(p);
    setInputs(p.initialInputs);
    setEvalResult(null);
  };

  const handleEvaluate = () => {
    const res = selectedPuzzle.evaluate(inputs);
    setEvalResult(res);
    if (res.pass && !solvedIds.includes(selectedPuzzle.id)) {
      setSolvedIds(prev => [...prev, selectedPuzzle.id]);
      addXp(selectedPuzzle.rewardXp);
      addGems(selectedPuzzle.rewardGems);
    }
  };

  const handleInputChange = (key: string, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setEvalResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[var(--bg-1)] border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[var(--bg-1)] to-[var(--bg-1)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Trophy size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  {t12(language, 'Engineering Chess Arena', 'Mühendislik Satrancı (Grandmaster Quests)')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                  {solvedIds.length} / {puzzles.length} {t12(language, 'Solved', 'Çözüldü')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t12(language, 'Solve live parametric engineering constraints and earn master credentials!', 'Gerçek mühendislik kısıtlarını hesaplayıcı ve parametrik modellerle çöz, ustalık kazan!')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Layout: Left Puzzle List (30%) + Right Interactive Arena (70%) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Quest Selector */}
          <div className="w-full md:w-80 border-r border-white/10 p-4 overflow-y-auto space-y-2.5 bg-black/20">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2">
              {t12(language, 'Chess Puzzles', 'Satranç Bulmacaları')}
            </div>
            {puzzles.map((p, idx) => {
              const isSolved = solvedIds.includes(p.id);
              const isSelected = selectedPuzzle.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPuzzle(p)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-lg '
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">#{idx + 1}</span>
                      <span className="text-xs font-bold text-white line-clamp-1">{t12(language, p.title, p.titleTr)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        p.difficulty === 'Master' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">+{p.rewardXp} XP</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isSolved ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Live Interactive Arena */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-[var(--bg-0)]">
            <div className="space-y-6">
              
              {/* Quest Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    {selectedPuzzle.category.toUpperCase()} MISSION
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Reward: +{selectedPuzzle.rewardXp} XP · +{selectedPuzzle.rewardGems} 💎
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {t12(language, selectedPuzzle.title, selectedPuzzle.titleTr)}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  {t12(language, selectedPuzzle.promptEn, selectedPuzzle.promptTr)}
                </p>
              </div>

              {/* Interactive Sliders & Live Parametric Controls */}
              <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/10">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {t12(language, 'Live Parametric Controls', 'Canlı Parametrik Kontroller')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(inputs).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{key}</span>
                        <span className="text-cyan-400 font-bold">{String(val)}</span>
                      </div>
                      {typeof val === 'number' ? (
                        <input
                          type="range"
                          min={key.includes('load') ? 1000 : key.includes('Ix') ? 1 : 1}
                          max={key.includes('load') ? 20000 : key.includes('Ix') ? 150 : 100}
                          step={key.includes('load') ? 100 : 1}
                          value={val}
                          onChange={(e) => handleInputChange(key, Number(e.target.value))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Result Feedback */}
              {evalResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    evalResult.pass
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {evalResult.pass ? (
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-bold">
                      {evalResult.pass ? (t12(language, 'Challenge Passed! 🎉', 'Görev Başarıyla Tamamlandı! 🎉')) : (t12(language, 'Criteria Not Met', 'Kriter Sağlanamadı'))}
                    </div>
                    <div className="text-xs opacity-90">
                      {t12(language, evalResult.messageEn, evalResult.messageTr)}
                    </div>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  CrossModuleBridge.openLiveSolverFromLesson(selectedPuzzle.category);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={14} />
                {t12(language, 'Open Live Engineering Solver', 'Canlı Mühendislik Modülünü Aç')}
              </button>

              <button
                type="button"
                onClick={handleEvaluate}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                {t12(language, 'Verify Solution', 'Çözümü Doğrula (Evaluate Move)')}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

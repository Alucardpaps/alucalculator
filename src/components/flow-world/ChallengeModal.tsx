'use client';

import React, { useState, useMemo } from 'react';
import { CHALLENGES } from './challenges';
import { ChallengeScenario, ScenarioCategory } from './types';
import {
  X,
  Compass,
  Search,
  Zap,
  Layers,
  Link as LinkIcon,
  ArrowRight,
  Sparkles,
  Mountain
} from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  activeChallengeId: string;
  onClose: () => void;
  onSelectChallenge: (c: ChallengeScenario) => void;
}

const CATEGORY_TABS: { id: ScenarioCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Tümü', icon: '🌐' },
  { id: 'vehicles', label: 'Araç & Ulaşım', icon: '🏎️' },
  { id: 'robotics', label: 'Robotik', icon: '🤖' },
  { id: 'mechanisms', label: 'Mekanizmalar', icon: '⚙️' },
  { id: 'structural', label: 'Mukavemet', icon: '🏗️' },
  { id: 'marine', label: 'Denizcilik', icon: '🚤' },
  { id: 'sandbox', label: 'Kum Havuzu', icon: '🧪' },
];

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  activeChallengeId,
  onClose,
  onSelectChallenge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChallenges = useMemo(() => {
    return CHALLENGES.filter((c) => {
      // Category match
      if (selectedCategory !== 'all') {
        if (c.category !== selectedCategory) {
          if (selectedCategory === 'mechanisms' && (c.category === 'gears' || c.category === 'ballistics')) {
            // allow compatibility
          } else {
            return false;
          }
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesFocus = c.physicsFocus?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesDesc || matchesFocus;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--bg-1)] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 1. HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[var(--bg-1)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>FLOW MÜHENDİSLİK ŞABLONLARI & SENARYOLAR</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                  {CHALLENGES.length} HAZIR ŞABLON
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerçek alaşım mukavemeti, DIN/ISO dişliler ve engebeli/dalgalı arazi fiziğiyle hazırlanmış düzenekler.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CATEGORY TABS & SEARCH */}
        <div className="px-6 py-3 border-b border-white/10 bg-[var(--bg-1)] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isSel = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSel
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold shadow-lg '
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Şablon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* 3. TEMPLATE CARDS GRID */}
        <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChallenges.map((c) => {
            const isActive = c.id === activeChallengeId;
            const hasMotor = c.initialBodies.some((b) => b.type === 'gear' && b.isMotor);

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectChallenge(c);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-xl '
                    : 'bg-slate-900/60 border-white/10 hover:border-cyan-500/50 hover:bg-slate-900'
                }`}
              >

                <div className="space-y-2.5">
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                        <span>{c.title}</span>
                      </div>
                      {c.physicsFocus && (
                        <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                          <Zap className="w-3 h-3 flex-shrink-0" />
                          <span>{c.physicsFocus}</span>
                        </div>
                      )}
                    </div>

                    {/* Difficulty Pill */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                          AKTİF
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                            c.difficulty === 'Başlangıç'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : c.difficulty === 'Orta'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : c.difficulty === 'İleri'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {c.difficulty || 'Standart'}
                        </span>
                      )}

                      {/* Terrain Badge */}
                      {c.terrainType === 'wavy' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono flex items-center gap-1">
                          <Mountain className="w-2.5 h-2.5" />
                          <span>Dalgalı Zemin</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Component Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{c.initialBodies.length} Gövde</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      <LinkIcon className="w-3 h-3 text-slate-400" />
                      <span>{c.initialJoints.length} Mafsal</span>
                    </span>
                    {hasMotor && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 font-bold">
                        ⚡ Motorlu
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Target & Action */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 truncate max-w-[70%]">
                    <span className="text-slate-500">Hedef:</span> {c.targetObjective}
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 font-mono text-xs font-semibold">
                    <span>YÜKLE</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredChallenges.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-500 font-mono text-xs">
              Aramanıza uygun şablon bulunamadı.
            </div>
          )}
        </div>

        {/* 4. FOOTER */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[var(--bg-1)] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Tüm şablonlar doğrudan Matter.js rijit gövde ve DIN/ISO dişli simülasyonuyla çalışır.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

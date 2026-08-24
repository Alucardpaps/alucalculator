'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  Lock, 
  Star, 
  Crown, 
  Sparkles, 
  Flame, 
  Play, 
  Layers, 
  Wrench, 
  HardHat, 
  Microscope,
  Award,
  Heart,
  Trophy,
  Compass,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Target,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Box
} from 'lucide-react';
import { useAcademyGamificationStore, getLeagueInfo } from '@/store/useAcademyGamificationStore';
import { useI18nStore } from '@/store/i18nStore';
import { DuolingoLessonPlayer } from './DuolingoLessonPlayer';
import { CertificateModal } from './CertificateModal';
import { getLocalizedQuiz } from '@/locales/academyLessonI18n';
import { AegisIcon } from '@/components/copilot/AegisIcon';
import { AegisFloatingWidget } from '@/components/copilot/AegisFloatingWidget';
import type { AcademyDepartment, AcademyCourse } from '@/locales/academyPageTranslations';

interface Props {
  departments: AcademyDepartment[];
  onSwitchToCurriculum?: () => void;
}

// Gamified Curriculum Sections & Specific Lesson Names matching Screenshot 1
interface GamifiedUnit {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tier: number;
  tierLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  questionCount: number;
  dept: string;
}

const FOUNDATIONS_UNITS: GamifiedUnit[] = [
  {
    id: 'u1',
    slug: 'engineering-units-and-standards',
    title: 'Shop drawing: inches on a metric floor',
    subtitle: 'T1 · 10 Q',
    tier: 1,
    tierLabel: 'Tier 1',
    sectionTitle: 'Section 1 · Foundations',
    sectionDesc: 'Units, algebra of forces, safe habits — easy start',
    questionCount: 10,
    dept: 'Design',
  },
  {
    id: 'u2',
    slug: 'fundamentals-of-statics',
    title: 'Newton vs kilogram-force on the floor',
    subtitle: 'T1 · 10 Q',
    tier: 1,
    tierLabel: 'Tier 1',
    sectionTitle: 'Section 1 · Foundations',
    sectionDesc: 'Units, algebra of forces, safe habits — easy start',
    questionCount: 10,
    dept: 'Structural',
  },
  {
    id: 'u3',
    slug: 'motor-power-calculation',
    title: 'Resistor power rating trap',
    subtitle: 'T1 · 10 Q',
    tier: 1,
    tierLabel: 'Tier 1',
    sectionTitle: 'Section 1 · Foundations',
    sectionDesc: 'Units, algebra of forces, safe habits — easy start',
    questionCount: 10,
    dept: 'Physics',
  },
  {
    id: 'u4',
    slug: 'how-to-calculate-bolt-torque',
    title: 'Bolt Torque & Preload (VDI 2230)',
    subtitle: 'T1 · 12 Q',
    tier: 1,
    tierLabel: 'Tier 1',
    sectionTitle: 'Section 1 · Foundations',
    sectionDesc: 'Units, algebra of forces, safe habits — easy start',
    questionCount: 12,
    dept: 'Design',
  },
  {
    id: 'u5',
    slug: 'bearing-life-calculation-explained',
    title: 'Bearing Rating Life (ISO 281)',
    subtitle: 'T1 · 10 Q',
    tier: 1,
    tierLabel: 'Tier 1',
    sectionTitle: 'Section 1 · Foundations',
    sectionDesc: 'Units, algebra of forces, safe habits — easy start',
    questionCount: 10,
    dept: 'Design',
  },
  {
    id: 'u6',
    slug: 'beam-deflection-formula-explained',
    title: 'Euler-Bernoulli Beam Deflection',
    subtitle: 'T2 · 12 Q',
    tier: 2,
    tierLabel: 'Tier 2',
    sectionTitle: 'Section 2 · Mechanics of Materials',
    sectionDesc: 'Deflection, shear moments, buckling & Mohr circle',
    questionCount: 12,
    dept: 'Structural',
  },
  {
    id: 'u7',
    slug: 'mohrs-circle-stress-analysis',
    title: "3D Mohr's Circle & Principal Stress",
    subtitle: 'T2 · 10 Q',
    tier: 2,
    tierLabel: 'Tier 2',
    sectionTitle: 'Section 2 · Mechanics of Materials',
    sectionDesc: 'Deflection, shear moments, buckling & Mohr circle',
    questionCount: 10,
    dept: 'Structural',
  },
  {
    id: 'u8',
    slug: 'thread-geometry-standards',
    title: 'Thread Geometry & Stress Areas',
    subtitle: 'T2 · 8 Q',
    tier: 2,
    tierLabel: 'Tier 2',
    sectionTitle: 'Section 2 · Mechanics of Materials',
    sectionDesc: 'Deflection, shear moments, buckling & Mohr circle',
    questionCount: 8,
    dept: 'Design',
  },
  {
    id: 'u9',
    slug: 'chip-breaker-logic',
    title: 'Chip Breaker Physics & Machining',
    subtitle: 'T3 · 10 Q',
    tier: 3,
    tierLabel: 'Tier 3',
    sectionTitle: 'Section 3 · Manufacturing & Fluids',
    sectionDesc: 'Speeds, feeds, welding codes and pipe pressure drops',
    questionCount: 10,
    dept: 'Manufacturing',
  },
  {
    id: 'u10',
    slug: 'pressure-drop-calculation-guide',
    title: 'Darcy-Weisbach Pressure Drop',
    subtitle: 'T3 · 10 Q',
    tier: 3,
    tierLabel: 'Tier 3',
    sectionTitle: 'Section 3 · Manufacturing & Fluids',
    sectionDesc: 'Speeds, feeds, welding codes and pipe pressure drops',
    questionCount: 10,
    dept: 'Physics',
  },
];

export function DuolingoLearningPath({ departments, onSwitchToCurriculum }: Props) {
  const { language } = useI18nStore();
  const isTr = language === 'tr';

  const { 
    xp, 
    hearts, 
    maxHearts, 
    streak, 
    lessonScores 
  } = useAcademyGamificationStore();

  const [activeLesson, setActiveLesson] = useState<{ slug: string; title: string; dept: string } | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Compute completed units
  const completedCount = Object.keys(lessonScores).length;
  const totalUnits = 113;
  const masteryPercent = Math.round((completedCount / totalUnits) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      {/* ─── HEADER BAR (100 LESSONS, 21.4h STUDY HOURS, 36 PRACTICE, 12 STANDARDS) ─── */}
      <div className="rounded-3xl border border-white/10 bg-[#080d16]/90 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-mono font-bold text-blue-400">
                100 LESSONS
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                21.4h STUDY HOURS
              </span>
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                  <Wrench size={12} className="text-emerald-400" /> 36 PRACTICE & LABS
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                  <ShieldCheck size={12} className="text-cyan-400" /> 12 STANDARDS
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{completedCount} of 100 lessons visited</span>
                <span className="text-blue-400 font-bold">{masteryPercent}% curriculum mastery</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(masteryPercent, 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCertificateOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-[10px] font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/5"
            >
              <Award size={14} className="text-amber-400" />
              GET CERTIFICATE
            </button>

            <Link
              href="/academy/engineering-units-and-standards"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-wider text-white transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Play size={13} className="fill-white" />
              START WITH YEAR 1 FUNDAMENTALS
            </Link>

            <Link
              href="/academy/how-to-calculate-bolt-torque"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <ChevronRight size={14} />
              RESUME LESSON
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. TWO BIG MODE CARDS (Screenshot 1) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: AeGiS Practice Path (ACTIVE) */}
        <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3.5 shadow-lg shadow-emerald-500/10 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              AeGiS Practice Path
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-300/80 mt-0.5">
              100+ units · Duolingo-style · 12 langs
            </div>
          </div>
        </div>

        {/* Card 2: Classic Curriculum */}
        <div 
          onClick={onSwitchToCurriculum}
          className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center gap-3.5 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-slate-200">
              Classic Curriculum
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              Articles · quiz · lab · standards
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. GLOWING GREEN GAMIFIED BANNER (Screenshot 1) ─── */}
      <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-[#081210] flex items-center gap-3.5 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              AEGIS GAMIFIED PRACTICE PATH
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider">
              DUOLINGO MODE
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            100+ practice units · 220+ questions · Streak 🔥 · XP 🌟 · 12 Languages
          </div>
        </div>
      </div>

      {/* ─── 4. MAIN 2-COLUMN LAYOUT: PATH (LEFT) & AEGIS CARD (RIGHT) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        
        {/* ── LEFT COLUMN (7 COLS): SECTION CARD & WINDING PATH ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1 Header Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0a0f18]/90 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-[10px] font-mono font-black uppercase text-blue-400">
                Tier 1
              </span>
              <h2 className="text-sm font-black text-white">
                Section 1 · Foundations
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Units, algebra of forces, safe habits — easy start
            </p>
          </div>

          {/* Winding Duolingo Node Path */}
          <div className="relative py-8 px-4 flex flex-col items-center">
            {/* Curved dashed line background */}
            <div className="absolute top-8 bottom-8 w-1 border-r-2 border-dashed border-emerald-500/30 z-0" />

            <div className="w-full space-y-10 relative z-10">
              {FOUNDATIONS_UNITS.map((unit, idx) => {
                const scoreInfo = lessonScores[unit.slug];
                const isCompleted = !!scoreInfo;
                const isFirst = idx === 0;
                const isUnlocked = idx < 3 || isFirst || isCompleted;

                // Winding zigzag offsets
                const offsetPattern = ['translate-x-0', 'translate-x-6 sm:translate-x-12', 'translate-x-0', '-translate-x-6 sm:-translate-x-12'];
                const offsetCls = offsetPattern[idx % 4];

                return (
                  <div key={unit.id} className={`flex flex-col items-center ${offsetCls} transition-transform`}>
                    
                    {/* Node Button with glow & ring */}
                    <div className="relative group">
                      {isUnlocked && !isCompleted && (
                        <div className="absolute -inset-2.5 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveLesson({ slug: unit.slug, title: unit.title, dept: unit.dept })}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 shadow-2xl relative ${
                          isCompleted
                            ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-black hover:brightness-110'
                            : isUnlocked
                              ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-300 text-white hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {isCompleted ? (
                          <Crown size={28} className="text-black fill-black" />
                        ) : isUnlocked ? (
                          <div className="flex flex-col items-center">
                            <Box size={22} className="text-white" />
                            <span className="text-[10px] font-black mt-0.5">#{idx + 1}</span>
                          </div>
                        ) : (
                          <Lock size={20} className="text-slate-600" />
                        )}

                        {/* Stars Tag under node */}
                        {isCompleted && (
                          <div className="absolute -bottom-2.5 bg-black/90 px-2 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-0.5">
                            {Array.from({ length: 3 }).map((_, si) => (
                              <Star key={si} size={9} className="text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Lesson Label Card (matching Screenshot 1) */}
                    <div 
                      onClick={() => isUnlocked && setActiveLesson({ slug: unit.slug, title: unit.title, dept: unit.dept })}
                      className={`mt-3 px-4 py-2 rounded-2xl border text-center max-w-[240px] shadow-lg transition-all cursor-pointer ${
                        isUnlocked
                          ? 'bg-[#0a0f18]/90 border-emerald-500/30 hover:border-emerald-400 text-white'
                          : 'bg-[#0a0f18]/50 border-white/5 text-slate-500'
                      }`}
                    >
                      <p className="text-xs font-bold leading-snug">
                        {unit.title}
                      </p>
                      <p className="text-[9px] font-mono font-black text-emerald-400 mt-1">
                        {unit.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 COLS): AEGIS ACADEMY SIDEBAR CARD (Screenshot 1) ── */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0a0f18]/95 p-5 shadow-2xl backdrop-blur-xl space-y-5">
            
            {/* Header: Mascot + Level */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
                <AegisIcon size={34} mode="idle" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">AeGiS Academy</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-[9px] font-mono font-black text-blue-300">
                    Lvl 1
                  </span>
                </div>
                <p className="text-[10px] font-mono text-cyan-400 font-bold mt-0.5">
                  110+ units · 3★ Star System
                </p>
                <p className="text-[9px] text-slate-500">
                  Bronze · 113 units
                </p>
              </div>
            </div>

            {/* Weekly XP */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Trophy size={15} className="text-amber-400" />
              <span>{xp} XP this week</span>
            </div>

            {/* 3★ Mastery Goal Card */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Star size={16} className="fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-300">3★ Mastery Goal</div>
                  <div className="text-[10px] font-mono text-slate-400">{completedCount} / 113 Units Flawless</div>
                </div>
              </div>
              <Lock size={15} className="text-amber-400/60 shrink-0" />
            </div>

            {/* AeGiS Hint Box */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                <span>💡</span> AeGiS:
              </div>
              <p className="text-slate-400">
                Answer without mistakes to earn 3 Stars. Scoring 3 stars on all units unlocks your verified certificate!
              </p>
            </div>

            {/* Stats Grid: Streak / Hearts / XP */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-black">
                  <Flame size={13} /> {streak}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">STREAK (DAYS)</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-black">
                  <Heart size={13} className="fill-rose-500" /> {hearts}/{maxHearts}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">HEARTS</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-300 text-xs font-black">
                  <Star size={13} className="fill-amber-400" /> {xp}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">XP</div>
              </div>
            </div>

            {/* Daily Goal Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Daily goal</span>
                <span className="text-emerald-400 font-bold">{Math.min(xp, 50)}/50 XP</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((xp / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE LESSON MODAL ─── */}
      {activeLesson && (
        <DuolingoLessonPlayer
          slug={activeLesson.slug}
          title={activeLesson.title}
          department={activeLesson.dept}
          questions={getLocalizedQuiz(activeLesson.slug, language)}
          onClose={() => setActiveLesson(null)}
          onComplete={() => {}}
        />
      )}

      {/* ─── VERIFIED CERTIFICATE MODAL ─── */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        completedCount={completedCount}
        xp={xp}
      />
    </div>
  );
}

export default DuolingoLearningPath;

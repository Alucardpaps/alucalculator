'use client';

/**
 * 🎓 ALUCALC ENGINEERING ACADEMY CAMPUS 2.0
 * 
 * Complete Next-Gen Interactive Engineering Learning & Accreditation Campus:
 * - 15 Verified Core Units (VDI 2230, ISO 281, ISO 6336, DIN 743, Euler Buckling, FEA, Nesting, etc.)
 * - Gamified Engineer Rank & XP Progression HUD
 * - Live Interactive Parameter Simulators (Bolt, Bearing, Beam, Gear, Column)
 * - Step-by-Step Question Verification Quiz
 * - Cryptographically Verified PDF Certificate Generator
 * - Dedicated Interactive Labs Hub (Mohr's Circle, Beam Visualizer, Dynamics)
 * - 50+ In-Depth Engineering Guides Catalog
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, CheckCircle2, ChevronRight, Calculator,
  Award, BookOpen, Layers, Activity, Wrench, ShieldCheck,
  Check, X, RotateCcw, ArrowRight, Sparkles, ExternalLink,
  Search, Filter, Play, Zap, Flame, Compass, Eye, Trophy, Clock
} from 'lucide-react';
import { ACADEMY_MVP_UNITS, AcademyMvpUnit } from '@/data/academyMvpUnits';
import { ACADEMY_ARTICLES } from '@/data/academyIndex';
import { AcademyUnitModal } from './AcademyUnitModal';
import { useI18nStore } from '@/store/i18nStore';

const STORAGE_KEY_UNITS = 'alucalc-academy-completed-units';
const STORAGE_KEY_XP = 'alucalc-academy-user-xp';

export function AcademyMvpHub() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  // Navigation mode
  const [campusMode, setCampusMode] = useState<'curriculum' | 'labs' | 'guides'>('curriculum');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Gamification state
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [userXp, setUserXp] = useState<number>(0);

  // Active Unit Modal state
  const [selectedUnit, setSelectedUnit] = useState<AcademyMvpUnit | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const rawUnits = localStorage.getItem(STORAGE_KEY_UNITS);
      if (rawUnits) setCompletedUnits(JSON.parse(rawUnits));

      const rawXp = localStorage.getItem(STORAGE_KEY_XP);
      if (rawXp) setUserXp(Number(rawXp));
    } catch {
      setCompletedUnits([]);
      setUserXp(0);
    }
  }, []);

  // Handle unit completion & XP reward
  const handleUnitCompleted = (unitId: string, earnedXp: number) => {
    setCompletedUnits((prev) => {
      if (prev.includes(unitId)) return prev;
      const updated = [...prev, unitId];
      try {
        localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserXp((prev) => {
      const newXp = prev + earnedXp;
      try {
        localStorage.setItem(STORAGE_KEY_XP, String(newXp));
      } catch {}
      return newXp;
    });
  };

  // Engineer Rank Calculation
  const engineerRank = useMemo(() => {
    if (userXp >= 1500) {
      return { title: tr ? 'Başmühendis & Baş Analist' : 'Principal Engineer', level: 5, color: '#f59e0b', nextXp: 2000 };
    }
    if (userXp >= 1000) {
      return { title: tr ? 'Kıdemli Tasarım Mühendisi' : 'Senior Design Engineer', level: 4, color: '#a855f7', nextXp: 1500 };
    }
    if (userXp >= 500) {
      return { title: tr ? 'Mekanik Tasarım Uzmanı' : 'Mechanical Specialist', level: 3, color: '#00e5ff', nextXp: 1000 };
    }
    if (userXp >= 200) {
      return { title: tr ? 'Tasarım Mühendisi' : 'Design Engineer', level: 2, color: '#38bdf8', nextXp: 500 };
    }
    return { title: tr ? 'Aday / Çırak Mühendis' : 'Apprentice Engineer', level: 1, color: '#94a3b8', nextXp: 200 };
  }, [userXp, tr]);

  // Filter categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(ACADEMY_MVP_UNITS.map((u) => u.category)));
    return ['All', ...cats];
  }, []);

  // Filtered units based on search & category
  const filteredUnits = useMemo(() => {
    return ACADEMY_MVP_UNITS.filter((u) => {
      const matchesCategory = activeCategory === 'All' || u.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.titleTr.toLowerCase().includes(q) ||
        u.titleEn.toLowerCase().includes(q) ||
        u.standard.toLowerCase().includes(q) ||
        u.summaryTr.toLowerCase().includes(q) ||
        u.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Filtered technical guides
  const filteredGuides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ACADEMY_ARTICLES;
    return ACADEMY_ARTICLES.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const progressPercent = Math.round((completedUnits.length / ACADEMY_MVP_UNITS.length) * 100);

  const openUnit = (unit: AcademyMvpUnit) => {
    setSelectedUnit(unit);
    setModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 text-slate-200 select-none">
      
      {/* ─── 1. CAMPUS HERO & PROGRESSION HUD ─── */}
      <section className="relative rounded-3xl bg-gradient-to-r from-[#080d1a] via-[#050914] to-[#02050c] border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Hero Left Content */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>AluCalc OS Engineering Campus</span>
              </span>
              <span className="text-xs font-mono text-slate-500">ISO / DIN / VDI Akredite</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Mühendislik Akademisi & Sertifikasyon
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              15 doğrulanmış temel müfredat ünitesi, canlı simülasyon laboratuvarları, formül türetimleri ve resmi kriptografik PDF sertifikalarıyla mekanik tasarım yetkinliğinizi belgeleyin.
            </p>
          </div>

          {/* Gamified Engineer Rank & XP Card */}
          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md space-y-3 min-w-[280px] lg:w-80 shrink-0 font-mono shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-semibold">Mühendislik Rütbesi</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Seviye {engineerRank.level}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow"
                style={{ backgroundColor: engineerRank.color }}
              >
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{engineerRank.title}</p>
                <p className="text-xs text-cyan-400 mt-0.5">{userXp} XP <span className="text-slate-500 font-normal">/ {engineerRank.nextXp} XP</span></p>
              </div>
            </div>

            {/* Curriculum Progress Bar */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Tamamlanan Ünite:</span>
                <strong className="text-white">{completedUnits.length} / {ACADEMY_MVP_UNITS.length} (%{progressPercent})</strong>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. CAMPUS MODE TABS & LIVE SEARCH ─── */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* 3 Main View Tabs */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCampusMode('curriculum')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              campusMode === 'curriculum'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap size={16} />
            <span>1. {tr ? 'Akredite Müfredat (15 Ünite)' : 'Curriculum Units'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCampusMode('labs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              campusMode === 'labs'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity size={16} />
            <span>2. {tr ? 'İnteraktif Laboratuvarlar' : 'Interactive Labs'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCampusMode('guides')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              campusMode === 'guides'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen size={16} />
            <span>3. {tr ? 'Teknik Kılavuzlar (50+)' : 'Technical Guides'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr ? 'Ünite, formül veya standart ara...' : 'Search units or standards...'}
            className="w-full bg-[#080d1a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>
      </section>

      {/* ─── 3. VIEW 1: CURRICULUM TRACKS (15 UNITS) ─── */}
      {campusMode === 'curriculum' && (
        <section className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold shadow'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Units Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUnits.map((u) => {
              const isCompleted = completedUnits.includes(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => openUnit(u)}
                  className="p-5 rounded-3xl bg-[#080d1a]/90 hover:bg-[#0c1324] border border-white/10 hover:border-cyan-500/40 transition-all duration-200 shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between space-y-4 group cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-black text-cyan-300">
                        {u.unitNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {u.standard}
                        </span>
                        {isCompleted && (
                          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                        {u.category}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mt-0.5">
                        {tr ? u.titleTr : u.titleEn}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {tr ? u.summaryTr : u.summaryEn}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> 10-15 dk
                    </span>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors"
                    >
                      <span>{isCompleted ? (tr ? 'Tekrar İncele' : 'Review Unit') : (tr ? 'Derse Başla' : 'Start Lesson')}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 4. VIEW 2: INTERACTIVE LABS SHOWCASE ─── */}
      {campusMode === 'labs' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">İnteraktif Deney & Simülasyon Odaları</h2>
            <p className="text-xs text-slate-400">
              Formüllerin fiziksel davranışlarını gerçek zamanlı 3D ve 2D parametrelerle test edebileceğiniz laboratuvarlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Lab 1: Dynamics & Vibration */}
            <Link
              href="/academy/dynamics"
              className="p-6 rounded-3xl bg-[#080d1a] hover:bg-[#0c1324] border border-white/10 hover:border-cyan-500/40 p-6 space-y-4 shadow-xl transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Activity size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">Dinamik & Titreşim</span>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300">Dinamik Sistemler Simülatörü</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sönümlü serbest titreşim, rezonans frekansı ve harmonik zorlamalı hareket denklemlerini grafik üzerinde interaktif test edin.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                <span>Laboratuvara Gir</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Lab 2: Additive Manufacturing */}
            <Link
              href="/academy/additive-manufacturing"
              className="p-6 rounded-3xl bg-[#080d1a] hover:bg-[#0c1324] border border-white/10 hover:border-purple-500/40 p-6 space-y-4 shadow-xl transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Layers size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-400">İleri İmalat</span>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300">Katmanlı İmalat & Topoloji</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  3D baskı parametreleri, dolgu geometrileri, anizotropik mukavemet ve DfAM (Design for Additive Manufacturing) kuralları.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400">
                <span>Laboratuvara Gir</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Lab 3: Sandbox Visualizer */}
            <Link
              href="/academy/sandbox"
              className="p-6 rounded-3xl bg-[#080d1a] hover:bg-[#0c1324] border border-white/10 hover:border-emerald-500/40 p-6 space-y-4 shadow-xl transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Compass size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Yapısal Deney</span>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300">Kiriş & Sehim Sandbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Serbest mesnetli, ankastre ve konsol kirişlerde yayılı ve tekil yüklerin oluşturduğu eğilme momenti ve sehim eğrileri.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                <span>Laboratuvara Gir</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ─── 5. VIEW 3: TECHNICAL GUIDES & ARTICLES (50+) ─── */}
      {campusMode === 'guides' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Derinlemesine Mühendislik Kılavuzları ({filteredGuides.length})</h2>
            <p className="text-xs text-slate-400">
              Formül arkasındaki mantığı, endüstriyel vaka incelemelerini ve pratik atölye hesaplarını açıklayan detaylı rehberler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/academy/${guide.slug}`}
                className="p-5 rounded-2xl bg-[#080d1a] hover:bg-[#0c1324] border border-white/10 hover:border-cyan-500/30 transition flex items-start justify-between gap-4 group shadow-lg"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">Teknik Kılavuz</span>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {guide.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {guide.description}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 transition shrink-0 mt-1">
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── 6. INTERACTIVE FULL-FEATURED UNIT WORKBENCH MODAL ─── */}
      {selectedUnit && (
        <AcademyUnitModal
          unit={selectedUnit}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onUnitCompleted={handleUnitCompleted}
          isCompleted={completedUnits.includes(selectedUnit.id)}
          tr={tr}
        />
      )}

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Pencil,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Smartphone,
  Check,
  ChevronRight,
  Layers,
  Cpu,
  Compass,
  FileCode2,
  HardDriveDownload,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getHomeTranslations } from '@/locales/homeTranslations';
import { getAppPages } from '@/locales/appPagesTranslations';
import { AegisHeroStage } from '@/components/copilot/AegisHeroStage';

export function HomePageContent() {
  const { language } = useI18nStore();
  const tHome = getHomeTranslations(language);
  const tExtra = getAppPages(language).homeExtra;

  // CAD Mockup state for interactive feel
  const [activeCadView, setActiveCadView] = useState<'3d' | 'wireframe'>('3d');

  return (
    <div className="w-full flex flex-col space-y-16 md:space-y-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 sm:py-12 select-none">
      
      {/* ─── 1. HERO (NO BOXES, EXPANSIVE SOFT DARK) ─── */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 pt-4 sm:pt-8">
        
        {/* Left: Bold Typography & 2 Clean CTAs */}
        <div className="flex-1 flex flex-col space-y-6 text-left max-w-2xl">
          
          {/* Subtle Version Pill */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-mono w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-slate-200">AluCalc OS v5.2</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-medium">100+ Deterministik Çözücü</span>
          </div>

          {/* Large Hero Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Mühendisler için <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Deterministik CAD & Hesaplama
            </span>{' '}
            Platformu.
          </h1>

          {/* 2 Clear, Concise Sentences */}
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl font-normal">
            ISO, DIN ve VDI normlarına uygun 100+ deterministik mekanik çözücü ve tarayıcı tabanlı parametrik 3D CAD konfigüratörü.
            Tüm mühendislik hesaplamalarınızı sıfır hata payı ve doğrudan STL/STEP ihracı ile tek platformda yürütün.
          </p>

          {/* 2 Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/design-studio"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] active:scale-[0.99]"
            >
              <Box size={18} className="text-slate-950" />
              <span>3D Design Studio</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/calculators"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-semibold text-sm transition-all active:scale-[0.99]"
            >
              <Pencil size={17} className="text-cyan-400" />
              <span>2D AluCAD & Çözücüler</span>
            </Link>
          </div>

          {/* Direct Mobile Download Link */}
          <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
            <Link
              href="/download"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Smartphone size={14} className="text-cyan-400" />
              <span>Android & Wear OS APK İndir (v5.0)</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right: AeGiS Copilot Mascot Stage */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="relative h-[300px] sm:h-[340px] rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#080d1a] to-[#020408] p-2 shadow-[0_0_35px_rgba(0,229,255,0.15)] overflow-hidden group hover:border-cyan-400/50 transition-all">
            <AegisHeroStage />
          </div>
        </div>
      </section>

      {/* ─── 2. NORM STRIP (SINGLE CLEAN LINE, NO CLUTTERED BOXES) ─── */}
      <section className="border-y border-white/10 py-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-400">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Norm Uyumluluğu:
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300 text-[11px]">
            <span className="text-cyan-400 font-bold">VDI 2230</span>
            <span className="text-slate-700">•</span>
            <span>ISO 281:2007</span>
            <span className="text-slate-700">•</span>
            <span>ISO 6336</span>
            <span className="text-slate-700">•</span>
            <span>DIN 6935</span>
            <span className="text-slate-700">•</span>
            <span>ISO 5291</span>
            <span className="text-slate-700">•</span>
            <span>DIN 743</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-400 font-medium">64-bit IEEE 754</span>
          </div>
        </div>
      </section>

      {/* ─── 3. THREE CORE PILLARS (BORDERLESS, AIRY COLUMNS) ─── */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kapsamlı Mühendislik Ekosistemi
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Mekanik tasarımcılar, atölye uzmanları ve Ar-Ge ekipleri için tek bir tarayıcı çalışma alanında birleşen modüller.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
          
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 shadow-lg space-y-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              100+ Deterministik Çözücü
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Cıvata ön gerilimi (VDI 2230), rulman ömrü (ISO 281), dişli mukavemeti (ISO 6336), kiriş sehimleri ve mil burulması hesaplamalarında sıfır halüsinasyon ile garantili matematiksel doğruluk.
            </p>
            <Link
              href="/calculators"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-2 transition-colors"
            >
              <span>Tüm Çözücüleri Keşfet</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-sky-500/30 transition-all duration-300 shadow-lg space-y-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 group-hover:scale-105 transition-all">
              <Box size={22} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
              2D & 3D Parametrik CAD
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Web tarayıcınızda çalışan donanım hızlandırmalı 3D parça konfigüratörü ve 2D AluCAD motoru. Delik, havşa ve özel alüminyum profil geometrilerini anında STL, STEP veya DXF olarak dışa aktarın.
            </p>
            <Link
              href="/design-studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 pt-2 transition-colors"
            >
              <span>Design Studio'yu Başlat</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-lg space-y-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
              <GraduationCap size={22} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              Mühendislik Akademisi & Saha
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Formül mantıklarını, mukavemet temellerini ve talaşlı imalat parametrelerini açıklayan zengin akademi içeriği. Sahada akustik ölçüm, titreşim ve eğim sensör araçları.
            </p>
            <Link
              href="/academy"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 pt-2 transition-colors"
            >
              <span>Akademiye Göz At</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. STREAMLINED DOWNLOAD BAR (MINIMAL, ELEGANT) ─── */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0a1224]/90 via-[#060b18]/90 to-[#020408]/90 border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Mobil & Giyilebilir Platform</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-semibold">v5.0 İmzalı</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">AluCalc OS'u Cebinize ve Saatinize Taşıyın</h3>
          <p className="text-xs text-slate-400 max-w-xl font-normal leading-relaxed">
            Atölyede veya şantiyede internet olmadan dahi çalışan bağımsız Android (1.16 MB) ve Wear OS akıllı saat APK paketleri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/app/alucalc-release.apk"
            download="alucalc-release.apk"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98]"
          >
            <HardDriveDownload size={16} />
            <span>Telefon APK (1.16 MB)</span>
          </a>

          <a
            href="/app/alucalc-wear-release.apk"
            download="alucalc-wear-release.apk"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-semibold text-xs uppercase tracking-wider transition-all backdrop-blur-md active:scale-[0.98]"
          >
            <Smartphone size={16} className="text-sky-400" />
            <span>Wear OS APK</span>
          </a>
        </div>
      </section>

    </div>
  );
}

export default HomePageContent;

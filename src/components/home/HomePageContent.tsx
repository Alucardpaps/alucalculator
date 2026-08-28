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

        {/* Right: Sleek 3D CAD Workspace Thumbnail (No Robot) */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="relative rounded-2xl border border-white/10 bg-[#080d1a]/80 backdrop-blur-xl p-5 shadow-2xl overflow-hidden group hover:border-cyan-500/30 transition-all">
            
            {/* Viewport Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-slate-300 font-medium pl-1">3D_Profile_Assembly.step</span>
              </div>
              
              <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveCadView('3d')}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${activeCadView === '3d' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Shaded
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCadView('wireframe')}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${activeCadView === 'wireframe' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Mesh
                </button>
              </div>
            </div>

            {/* Simulated 3D Isometric Viewport */}
            <div className="relative h-64 w-full my-3 rounded-xl bg-gradient-to-b from-[#02050c] to-[#060b18] border border-white/5 flex items-center justify-center overflow-hidden">
              
              {/* Coordinate Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              {/* Dynamic 3D Isometric CAD Rendering Graphic */}
              <svg viewBox="0 0 320 200" className="w-full h-full relative z-10 p-4">
                <defs>
                  <linearGradient id="aluGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="aluGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Isometric Aluminum Extrusion Profile Mesh */}
                <g transform="translate(160, 100) scale(1.1)">
                  {/* Outer Main Flanges */}
                  <polygon
                    points="0,-45 75,-10 75,35 0,0"
                    fill="url(#aluGrad1)"
                    stroke="#38bdf8"
                    strokeWidth={activeCadView === 'wireframe' ? '1' : '1.5'}
                    strokeDasharray={activeCadView === 'wireframe' ? '3 2' : 'none'}
                  />
                  <polygon
                    points="0,-45 -75,-10 -75,35 0,0"
                    fill="url(#aluGrad2)"
                    stroke="#0284c7"
                    strokeWidth={activeCadView === 'wireframe' ? '1' : '1.5'}
                    strokeDasharray={activeCadView === 'wireframe' ? '3 2' : 'none'}
                  />
                  <polygon
                    points="0,-45 75,-10 0,25 -75,-10"
                    fill="#0c4a6e"
                    fillOpacity="0.75"
                    stroke="#7dd3fc"
                    strokeWidth="1.2"
                  />

                  {/* Center ISO Bore & T-Slots */}
                  <ellipse cx="0" cy="-10" rx="18" ry="9" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                  <ellipse cx="0" cy="0" rx="18" ry="9" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Dimension Annotations */}
                  <line x1="-75" y1="45" x2="75" y2="45" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="0" y="58" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    B = 80.00 mm (ISO 2768-m)
                  </text>
                </g>

                {/* Coordinate Triad */}
                <g transform="translate(30, 170)">
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="2" />
                  <line x1="0" y1="0" x2="0" y2="-20" stroke="#22c55e" strokeWidth="2" />
                  <line x1="0" y1="0" x2="-12" y2="12" stroke="#3b82f6" strokeWidth="2" />
                  <text x="24" y="4" fill="#ef4444" fontSize="8" fontFamily="monospace">X</text>
                  <text x="-3" y="-24" fill="#22c55e" fontSize="8" fontFamily="monospace">Y</text>
                  <text x="-20" y="16" fill="#3b82f6" fontSize="8" fontFamily="monospace">Z</text>
                </g>
              </svg>

              {/* Status Overlay Badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>B-Rep Solid Valid</span>
              </div>
            </div>

            {/* Quick Specs Readout Bar */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-slate-400">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase">Malzeme</div>
                <div className="text-slate-200 font-bold">6082-T6</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase">Ağırlık</div>
                <div className="text-cyan-400 font-bold">2.41 kg/m</div>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase">İhracat</div>
                <div className="text-slate-200 font-bold">STL / STEP</div>
              </div>
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-4">
          
          {/* Pillar 1 */}
          <div className="space-y-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              100+ Deterministik Çözücü
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Cıvata ön gerilimi (VDI 2230), rulman ömrü (ISO 281), dişli mukavemeti (ISO 6336), kiriş sehimleri ve mil burulması hesaplamalarında sıfır yapay zeka halüsinasyonu ile garantili matematiksel doğruluk.
            </p>
            <Link
              href="/calculators"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-1 transition-colors"
            >
              <span>Tüm Çözücüleri Keşfet</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
              <Box size={20} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
              2D & 3D Parametrik CAD
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Web tarayıcınızda çalışan donanım hızlandırmalı 3D parça konfigüratörü ve 2D AluCAD motoru. Delik, havşa, kanal ve özel alüminyum profil geometrilerini anında STL, STEP veya DXF olarak dışa aktarın.
            </p>
            <Link
              href="/design-studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 pt-1 transition-colors"
            >
              <span>Design Studio'yu Başlat</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-3.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <GraduationCap size={20} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              Mühendislik Akademisi & Saha
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              Formül mantıklarını, mukavemet temellerini ve talaşlı imalat parametrelerini açıklayan zengin akademi içeriği. Sahada akustik ölçüm, titreşim ve eğim sensör araçları.
            </p>
            <Link
              href="/academy"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 pt-1 transition-colors"
            >
              <span>Akademiye Göz At</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. STREAMLINED DOWNLOAD BAR (MINIMAL, ELEGANT) ─── */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0a1224] to-[#060b18] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Mobil & Giyilebilir Platform</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400">v5.0 İmzalı</span>
          </div>
          <h3 className="text-xl font-bold text-white">AluCalc OS'u Cebinize ve Saatinize Taşıyın</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Atölyede veya şantiyede internet olmadan dahi çalışan bağımsız Android (1.16 MB) ve Wear OS akıllı saat APK paketleri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/app/alucalc-release.apk"
            download="alucalc-release.apk"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <HardDriveDownload size={15} />
            <span>Telefon APK (1.16 MB)</span>
          </a>

          <a
            href="/app/alucalc-wear-release.apk"
            download="alucalc-wear-release.apk"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all"
          >
            <Smartphone size={15} className="text-sky-400" />
            <span>Wear OS APK</span>
          </a>
        </div>
      </section>

    </div>
  );
}

export default HomePageContent;

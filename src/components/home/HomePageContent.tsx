'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Pencil,
  Workflow,
  Cpu,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Scale,
  Activity,
  Award,
  Smartphone,
  Watch
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { AegisMascot } from '@/components/copilot/AegisMascot';

export function HomePageContent() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  return (
    <div className="w-full flex flex-col space-y-16 px-4 py-8 lg:px-12 lg:py-12 max-w-7xl mx-auto select-none">
      {/* ─── 1. HERO PRODUCT SHOWCASE ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#080d18] via-[#050810] to-[#03050a] p-8 lg:p-14 shadow-2xl">
        {/* Glowing backdrop ambient light */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Hero Copy */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span>{tr ? 'Endüstriyel Mühendislik Zekası' : 'Industrial Engineering Intelligence'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {tr ? (
                <>
                  Mühendisler İçin <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                    Deterministik CAD & Çözücü
                  </span> Platformu
                </>
              ) : (
                <>
                  Deterministic CAD & <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                    Engineering Intelligence
                  </span> Platform
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              {tr
                ? 'ISO, DIN ve VDI standartlarına %100 uyumlu 100+ mekanik çözücü, tarayıcı tabanlı 3D montaj & 2D AluCAD stüdyosu ve yapay zeka destekli AeGiS asistanı ile projelerinizi sıfır hata payıyla tasarlayın.'
                : 'Over 100+ deterministic engineering solvers verified against ISO, DIN and VDI standards, browser-based 3D Assembly & 2D AluCAD Studio, and the AeGiS AI Copilot for precision engineering.'}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/design-studio"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_25px_rgba(0,229,255,0.3)] group"
              >
                <Box size={16} />
                <span>{tr ? '3D Stüdyoyu Başlat' : 'Launch 3D Studio'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/cad-editor"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-200 text-xs font-black uppercase tracking-wider hover:bg-white/10 hover:border-cyan-400 transition-all"
              >
                <Pencil size={16} className="text-cyan-400" />
                <span>{tr ? '2D AluCAD Çizim' : '2D AluCAD'}</span>
              </Link>

              <Link
                href="/download"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-sky-500/40 bg-sky-950/30 text-sky-300 text-xs font-black uppercase tracking-wider hover:bg-sky-900/40 hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] group"
              >
                <Smartphone size={16} className="text-sky-400" />
                <span>{tr ? 'Mobil & Saat APK' : 'Mobile & Watch APK'}</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Mascot & Status Card */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl border border-cyan-500/20 bg-black/40 backdrop-blur-xl shadow-xl space-y-4">
            <AegisMascot size={72} />
            <div className="text-center space-y-1">
              <div className="text-sm font-black tracking-wider text-cyan-300 uppercase">
                AeGiS Assistant OS
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {tr ? 'Tüm modüllere sol yan sidebar üzerinden anında erişebilirsiniz.' : 'Access all modules instantly from the left sidebar.'}
              </div>
            </div>

            <div className="w-full pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                NOMINAL
              </span>
              <span>100+ SOLVERS ACTIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. THREE PILLARS OF ALUCALC OS ─── */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {tr ? 'Platformun Temel Yetenekleri' : 'Platform Core Capabilities'}
          </h2>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            {tr ? 'Hatasız Hesaplama · CAD Entegrasyonu · Dijital Sertifikasyon' : 'Zero Error Solvers · CAD Pipeline · Verified Certification'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Deterministic Solvers */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-[#070b14]/80 backdrop-blur-xl space-y-4 hover:border-cyan-500/40 transition-all group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {tr ? '1. Doğrulanmış Norm Hesaplayıcıları' : '1. Standardized Solvers'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tr
                  ? 'VDI 2230 Cıvata Torku, ISO 281 Rulman Ömrü, ISO 6336 Dişli Mukavemeti, DIN 6935 Sac Büküm ve Euler-Bernoulli Kiriş analizleri doğrudan resmi norm formülleriyle çalışır.'
                  : 'VDI 2230 Bolt Torque, ISO 281 Bearing Life, ISO 6336 Gear Strength, DIN 6935 Sheet Metal Bends, and Beam Deflection solvers computed directly from official standard equations.'}
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[10px] font-mono text-cyan-400/90 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tr ? 'Sıfır Yaklaşıklık Hatası' : 'Deterministic Precision'}</span>
            </div>
          </div>

          {/* Pillar 2: 2D & 3D CAD Architecture */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-[#070b14]/80 backdrop-blur-xl space-y-4 hover:border-sky-500/40 transition-all group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-md">
                <Box size={20} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                {tr ? '2. Tarayıcı İçi 2D/3D CAD Stüdyosu' : '2. Browser 2D/3D CAD Studio'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tr
                  ? 'Three.js tabanlı 3D montaj, kesit görünüşleri, 8 farklı render modu ve STL/DXF dışa aktarma yeteneği. Paper.js ile hassas 2D çizim ve görsel düğüm (node-flow) veri akışı.'
                  : 'Three.js 3D assembly, real-time section clipping, 8 render modes, and STL/DXF exporters. Precision 2D drafting with Paper.js and visual node-flow graph automation.'}
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[10px] font-mono text-sky-400/90 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tr ? 'Doğrudan WebGL Hızlandırmalı' : 'Hardware Accelerated WebGL'}</span>
            </div>
          </div>

          {/* Pillar 3: Academy & AI Copilot */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-[#070b14]/80 backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-md">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {tr ? '3. Akademi & AeGiS Asistanı' : '3. Academy & AeGiS Copilot'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tr
                  ? '113 üniteli etkileşimli mühendislik müfredatı, testler ve doğrulanabilir PDF başarı sertifikaları. Malzeme seçimi ve formül çözümlerinde anında rehberlik sunan AeGiS AI.'
                  : '113-unit interactive engineering curriculum with quizzes and verifiable PDF certificates. Instant AI guidance on material selection, stress checks, and mechanical formulas.'}
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[10px] font-mono text-emerald-400/90 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tr ? 'Doğrulanabilir Dijital Sertifika' : 'Verifiable Certification'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. STANDARDS COMPLIANCE & PRIVACY GUARANTEE ─── */}
      <section className="p-8 rounded-3xl border border-white/10 bg-[#04070e] space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <h3 className="text-base font-bold text-white">
              {tr ? 'Doğrulanmış Uluslararası Standartlar' : 'Verified International Standards'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr ? 'Tüm çözücüler aşağıdaki resmi norm kurallarına göre hesaplama yapar:' : 'All solvers strictly adhere to official normative equations:'}
            </p>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
            <Lock size={13} className="text-emerald-400" />
            <span>{tr ? 'İstemci Taraflı Hesaplama (%100 Gizlilik)' : 'Client-Side Solvers (100% Private)'}</span>
          </div>
        </div>

        {/* Standard tags */}
        <div className="flex flex-wrap gap-2.5 font-mono text-xs">
          {[
            { code: 'VDI 2230', label: 'High-Strength Bolted Joints' },
            { code: 'ISO 281:2007', label: 'Dynamic Bearing Rating Life' },
            { code: 'ISO 6336', label: 'Spur & Helical Gear Pitting/Bending' },
            { code: 'ISO 606', label: 'Precision Roller Chain Drives' },
            { code: 'ISO 5291', label: 'Industrial V-Belt & Pulley Drives' },
            { code: 'DIN 6935', label: 'Sheet Metal Bend Allowance & K-Factor' },
            { code: 'DIN 743 (Basic)', label: 'Shaft Torsion & Reaction Analysis' },
            { code: 'ISO 286', label: 'Limits & Fits System' },
          ].map((std) => (
            <div
              key={std.code}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 font-bold"
            >
              <span className="text-cyan-400">{std.code}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">· {std.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. MOBILE & WEAR OS APK SHOWCASE ─── */}
      <section className="p-6 sm:p-8 rounded-3xl border border-sky-500/30 bg-gradient-to-r from-[#060b18] via-[#040812] to-[#081224] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-inner">
            <Smartphone size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400">PWA & NATIVE ANDROID</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v5.0 APK</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              {tr ? 'AluCalc OS Mobil ve Akıllı Saat (Wear OS) Uygulamaları' : 'AluCalc OS Mobile & Smartwatch (Wear OS) Apps'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              {tr
                ? 'Saha mühendisliği için çevrimdışı çalışma, ivmeölçer su terazisi, sesli not kaydı ve akıllı saatinizde doğrudan cıvata/kılavuz ölçüleri.'
                : 'Offline calculation engine, accelerometer spirit level, voice memos, and wrist-mounted tap drill charts for Galaxy Watch & Pixel Watch.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10 w-full md:w-auto justify-start md:justify-end">
          <a
            href="/app/alucalc-release.apk"
            download="alucalc-release.apk"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)]"
          >
            <span>{tr ? 'Telefon APK (1.16 MB)' : 'Phone APK (1.16 MB)'}</span>
          </a>

          <a
            href="/app/alucalc-wear-release.apk"
            download="alucalc-wear-release.apk"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 font-black text-xs uppercase tracking-wider transition-all"
          >
            <span>{tr ? 'Saat APK (Wear OS)' : 'Watch APK (Wear OS)'}</span>
          </a>

          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase transition-all"
          >
            <span>{tr ? 'Tüm Detaylar' : 'All Downloads'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── 5. HOW TO NAVIGATE TIP ─── */}
      <section className="p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Sliders size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {tr ? 'Kolay Gezinme İpucu' : 'Quick Navigation Tip'}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {tr
                ? 'Ekranın solundaki yan sidebar ile istediğiniz hesaplayıcıya veya CAD ortamına tek tıkla geçiş yapabilirsiniz.'
                : 'Use the left sidebar on your screen to jump to any solver, 3D/2D CAD tool, or academy module instantly.'}
            </div>
          </div>
        </div>

        <Link
          href="/design-studio"
          className="shrink-0 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
        >
          {tr ? 'Stüdyoya Git →' : 'Open Studio →'}
        </Link>
      </section>
    </div>
  );
}

export default HomePageContent;

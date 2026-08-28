'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Pencil,
  ShieldCheck,
  Zap,
  Layers,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sliders,
  Smartphone,
  Cpu,
  Activity,
  Terminal
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { AegisHeroStage } from '@/components/copilot/AegisHeroStage';
import { getHomeTranslations } from '@/locales/homeTranslations';
import { getAppPages } from '@/locales/appPagesTranslations';

export function HomePageContent() {
  const { language } = useI18nStore();
  const tHome = getHomeTranslations(language);
  const tExtra = getAppPages(language).homeExtra;

  return (
    <div className="w-full flex flex-col space-y-8 px-3 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto select-none">
      {/* ─── 1. HERO INSTRUMENT PRODUCT SHOWCASE ─── */}
      <section className="relative rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-8">
          {/* Left Hero Copy */}
          <div className="flex-1 flex flex-col justify-between space-y-5 text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)] text-[10px] font-mono font-bold tracking-wider uppercase">
                <Terminal size={12} className="text-[var(--cyan)]" />
                <span>{tHome.badge}</span>
                <span className="text-[var(--alu-dim)]/60">·</span>
                <span className="text-[var(--ok)]">v5.2 ACTIVE</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black tracking-tight text-[var(--ink)] leading-snug uppercase">
                {tHome.heroH1Before} <br />
                <span className="text-[var(--cyan)]">
                  {tHome.heroH1Highlight}
                </span>{' '}
                {tHome.heroH1After}
              </h1>

              <p className="text-xs sm:text-sm text-[var(--alu-dim)] max-w-xl leading-relaxed font-sans">
                {tHome.heroDesc}
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2 font-mono">
              <Link
                href="/design-studio"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] hover:bg-[var(--cyan-dim)] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Box size={14} />
                <span>{tHome.btn3d}</span>
                <ArrowRight size={13} />
              </Link>

              <Link
                href="/cad-editor"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)] hover:bg-[var(--bg-3)] hover:text-white hover:border-[var(--line-strong)] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Pencil size={14} className="text-[var(--cyan)]" />
                <span>{tHome.btn2d}</span>
              </Link>

              <Link
                href="/download"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--std)] hover:bg-[var(--bg-3)] hover:border-[var(--std)]/40 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Smartphone size={14} className="text-[var(--std)]" />
                <span>{tHome.btnApk}</span>
              </Link>
            </div>
          </div>

          {/* Right Hero: Instrument Status & Telemetry HUD */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] p-3 space-y-2">
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[var(--line)] text-[10px] font-mono text-[var(--alu-dim)]">
              <span className="flex items-center gap-1.5 font-bold uppercase text-[var(--cyan)]">
                <Activity size={12} className="text-[var(--cyan)]" />
                {tExtra.copilotTitle}
              </span>
              <span className="flex items-center gap-1 text-[var(--ok)] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
                {tExtra.statusNominal}
              </span>
            </div>

            <div className="h-52 w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden relative">
              <AegisHeroStage />
            </div>

            {/* Live Readout Strip */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
              <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                <div className="text-[var(--alu-dim)] text-[9px] uppercase">NORMS COMPLIANT</div>
                <div className="text-[var(--ink)] font-bold">VDI / ISO / DIN</div>
              </div>
              <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                <div className="text-[var(--alu-dim)] text-[9px] uppercase">ACTIVE SOLVERS</div>
                <div className="text-[var(--cyan)] font-bold">100+ DETERMINISTIC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. THREE PILLARS OF ALUCALC OS ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--cyan)] rounded-[1px]" />
            {tHome.featTitle}
          </h2>
          <span className="text-[10px] font-mono text-[var(--alu-dim)] uppercase">
            {tHome.featDesc}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Deterministic Solvers */}
          <div className="flex flex-col justify-between p-4 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-strong)] transition-colors group">
            <div className="space-y-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)]">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-sm font-mono font-bold text-[var(--ink)] group-hover:text-[var(--cyan)] transition-colors uppercase">
                {tHome.cardSolversTitle}
              </h3>
              <p className="text-xs text-[var(--alu-dim)] leading-relaxed font-sans">
                {tHome.cardSolversDesc}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[var(--line)] text-[10px] font-mono text-[var(--ok)] font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tHome.statsVerified}</span>
            </div>
          </div>

          {/* Pillar 2: 2D & 3D CAD Architecture */}
          <div className="flex flex-col justify-between p-4 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-strong)] transition-colors group">
            <div className="space-y-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--std)]">
                <Box size={16} />
              </div>
              <h3 className="text-sm font-mono font-bold text-[var(--ink)] group-hover:text-[var(--std)] transition-colors uppercase">
                {tHome.card3dTitle}
              </h3>
              <p className="text-xs text-[var(--alu-dim)] leading-relaxed font-sans">
                {tHome.card3dDesc}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[var(--line)] text-[10px] font-mono text-[var(--std)] font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tHome.cardCadTitle}</span>
            </div>
          </div>

          {/* Pillar 3: Academy & AI Copilot */}
          <div className="flex flex-col justify-between p-4 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-strong)] transition-colors group">
            <div className="space-y-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--warn)]">
                <GraduationCap size={16} />
              </div>
              <h3 className="text-sm font-mono font-bold text-[var(--ink)] group-hover:text-[var(--warn)] transition-colors uppercase">
                {tHome.cardAcademyTitle}
              </h3>
              <p className="text-xs text-[var(--alu-dim)] leading-relaxed font-sans">
                {tHome.cardAcademyDesc}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[var(--line)] text-[10px] font-mono text-[var(--warn)] font-bold flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>{tHome.cardCopilotTitle}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. STANDARDS COMPLIANCE STRIP ─── */}
      <section className="p-5 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
              {tExtra.standardsTitle}
            </h3>
            <p className="text-[11px] text-[var(--alu-dim)] mt-0.5">
              {tExtra.standardsDesc}
            </p>
          </div>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)] text-[10px]">
            <Lock size={12} className="text-[var(--ok)]" />
            <span>{tExtra.privacy}</span>
          </div>
        </div>

        {/* Standard tags */}
        <div className="flex flex-wrap gap-2 text-xs">
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)]"
            >
              <span className="text-[var(--cyan)] font-bold">{std.code}</span>
              <span className="text-[10px] text-[var(--alu-dim)] hidden sm:inline">· {std.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. MOBILE & WEAR OS APK SHOWCASE ─── */}
      <section className="p-5 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] flex flex-col md:flex-row items-center justify-between gap-5 font-mono">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--std)]">
            <Smartphone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">PWA & NATIVE ANDROID</span>
              <span className="px-1.5 py-0.2 rounded-[2px] text-[8px] font-bold bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30">v5.0 APK</span>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)] mt-0.5">
              {tExtra.mobileTitle}
            </h3>
            <p className="text-[11px] font-sans text-[var(--alu-dim)] mt-0.5 max-w-xl">
              {tExtra.mobileDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-start md:justify-end text-xs">
          <a
            href="/app/alucalc-release.apk"
            download="alucalc-release.apk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] hover:bg-[var(--cyan-dim)] hover:text-white font-bold uppercase tracking-wider transition-colors"
          >
            <span>{tExtra.phoneApk}</span>
          </a>

          <a
            href="/app/alucalc-wear-release.apk"
            download="alucalc-wear-release.apk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] hover:text-white font-bold uppercase tracking-wider transition-colors"
          >
            <span>{tExtra.watchApk}</span>
          </a>

          <Link
            href="/download"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu-dim)] hover:text-white font-bold text-xs uppercase transition-colors"
          >
            <span>{tExtra.allDownloads}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ─── 5. NAVIGATION QUICK WORKSPACE TIP ─── */}
      <section className="p-4 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--line)]">
            <Sliders size={16} />
          </div>
          <div>
            <div className="font-bold text-[var(--ink)] uppercase tracking-wider">
              {tExtra.navTip}
            </div>
            <div className="text-[11px] font-sans text-[var(--alu-dim)] mt-0.5">
              {tExtra.navTipBody}
            </div>
          </div>
        </div>

        <Link
          href="/design-studio"
          className="shrink-0 px-3.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)] hover:bg-[var(--bg-3)] hover:border-[var(--cyan)]/40 text-[11px] font-bold transition-colors"
        >
          {tExtra.openStudio}
        </Link>
      </section>
    </div>
  );
}

export default HomePageContent;


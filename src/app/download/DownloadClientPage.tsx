'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Watch,
  HardDriveDownload,
  ShieldCheck,
  Zap,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  Copy,
  Check,
  FileCode,
  Compass,
  Scale
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { HomeFooterSection } from '@/components/home/HomeFooterSection';
import { APP_VERSION } from '@/config/app';
import { getAppPages } from '@/locales/appPagesTranslations';

export default function DownloadClientPage() {
  const { language } = useI18nStore();
  const t = getAppPages(language).download;
  const [copiedAdb, setCopiedAdb] = useState(false);

  const adbWatchCmd = 'adb install -r alucalc-wear-release.apk';

  const copyAdb = () => {
    navigator.clipboard.writeText(adbWatchCmd);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-white flex flex-col justify-between selection:text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16 w-full">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan-dim)] text-[var(--cyan)] text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            <span>{t.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono uppercase">
            AluCAD OS <br />
            <span className="text-[var(--cyan)]">
              {t.title}
            </span>
          </h1>

          <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t.lead}
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Android Mobile & Tablet */}
          <div className="relative rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden hover:border-[var(--line-strong)] transition-all">
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan-dim)] text-[var(--cyan)] shadow-inner">
                  <Smartphone size={28} />
                </div>
                <span className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan-dim)] text-[var(--cyan)] font-mono text-xs font-black uppercase">
                  ANDROID APK
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {t.androidTitle}
                </h2>
                <p className="text-[var(--muted)] text-xs sm:text-sm leading-relaxed">
                  {t.androidDesc}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.fileSize}</span>
                  <span className="font-bold text-white">1.16 MB (Ultra Light)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.requirement}</span>
                  <span className="font-bold text-white">Android 7.0+ (Nougat - Android 16)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.signature}</span>
                  <span className="font-bold text-[var(--ok)]">Signed Release</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--line)] relative z-10">
              <a
                href="/app/alucalc-release.apk"
                download="alucalc-release.apk"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-black text-sm uppercase tracking-wider transition-all shadow-md group active:scale-[0.99] font-mono"
              >
                <HardDriveDownload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>{t.downloadApk}</span>
              </a>

              <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] pt-1">
                <a href="/app/alucalc-release.aab" download="alucalc-release.aab" className="hover:text-[var(--cyan)] hover:underline">
                  {t.downloadAab}
                </a>
                <span className="text-slate-600">v{APP_VERSION}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Wear OS Smartwatch */}
          <div className="relative rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden hover:border-[var(--line-strong)] transition-all">
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--std)]/40 text-[var(--std)] shadow-inner">
                  <Watch size={28} />
                </div>
                <span className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--std)]/40 text-[var(--std)] font-mono text-xs font-black uppercase">
                  WEAR OS WATCH APK
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {t.watchTitle}
                </h2>
                <p className="text-[var(--muted)] text-xs sm:text-sm leading-relaxed">
                  {t.watchDesc}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.fileSize}</span>
                  <span className="font-bold text-white">1.16 MB (Optimized)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)] shrink-0">{t12(language, 'Compatible Devices', 'Uyumlu Cihazlar')}</span>
                  <span className="font-bold text-left sm:text-right text-white">Galaxy Watch 4/5/6/7, Pixel Watch, TicWatch</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t12(language, 'Installation', 'Yükleme Modu')}</span>
                  <span className="font-bold text-[var(--cyan)]">Wireless Debugging / ADB Sideload</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--line)] relative z-10">
              <a
                href="/app/alucalc-wear-release.apk"
                download="alucalc-wear-release.apk"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-black text-sm uppercase tracking-wider transition-all shadow-md group active:scale-[0.99] font-mono"
              >
                <HardDriveDownload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>{t12(language, 'Download Watch APK (Wear OS)', 'Saat APK İndir (Wear OS)')}</span>
              </a>

              {/* Copy ADB command */}
              <div className="flex items-center justify-between p-2 rounded-[var(--radius-s)] bg-[var(--bg-3)] border border-[var(--line)] text-xs font-mono">
                <span className="text-[var(--muted)] truncate pr-2">{adbWatchCmd}</span>
                <button
                  onClick={copyAdb}
                  className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--line-strong)] text-[var(--cyan)] flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  {copiedAdb ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedAdb ? (t12(language, 'Copied', 'Kopyalandı')) : (t12(language, 'Copy', 'Kopyala'))}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Matrix / Highlights */}
        <div className="p-8 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5 font-mono uppercase">
            <ShieldCheck size={20} className="text-[var(--cyan)]" />
            <span>{t12(language, 'Mobile & Smartwatch Features', 'Mobil ve Akıllı Saat Yetenekleri')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
              <div className="font-bold text-[var(--cyan)] flex items-center gap-2 font-mono">
                <Zap size={16} />
                <span>{t12(language, 'Precached Offline Solvers', 'Önbelleğe Alınan Çözücüler')}</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                {t12(language, 'Installs the web app. Listed solvers work offline once precached.', 'Web uygulamasını yükler. Listelenen çözücüler önbelleğe alındıktan sonra çevrimdışı çalışır.')}
              </p>
            </div>

            <div className="p-4 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
              <div className="font-bold text-[var(--cyan)] flex items-center gap-2 font-mono">
                <Compass size={16} />
                <span>{t12(language, 'Field Sensors & Level', 'Saha Sensörleri & Terazi')}</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                {t12(language, '2-axis frame alignment spirit level, sound meter, and optical height finder.', 'Telefon jiroskopu ve ivmeölçeri ile 2 eksenli çerçeve hizalama ve yükseklik bulucu.')}
              </p>
            </div>

            <div className="p-4 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
              <div className="font-bold text-[var(--cyan)] flex items-center gap-2 font-mono">
                <Watch size={16} />
                <span>{t12(language, 'Wrist-Mounted Guide', 'Bilekte Saha Kılavuzu')}</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                {t12(language, 'Instant tap drill charts, bolt torque lookups, and unit conversions on your wrist.', 'Akıllı saatinizden metrik cıvata kılavuz çekme deliklerine ve birim çeviriciye anında erişim.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <HomeFooterSection />
    </div>
  );
}

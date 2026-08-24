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
import { HomeFooterSection } from '@/components/home/HomeFooterSection';

export default function DownloadClientPage() {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [copiedAdb, setCopiedAdb] = useState(false);

  const adbWatchCmd = 'adb install -r alucalc-wear-release.apk';

  const copyAdb = () => {
    navigator.clipboard.writeText(adbWatchCmd);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#03060a] text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16 w-full">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            <span>{tr ? 'Resmi Yayın • Sürüm 5.0' : 'Official Release • Version 5.0'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {tr ? (
              <>
                AluCalc OS <br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Mobil & Akıllı Saat Uygulamaları
                </span>
              </>
            ) : (
              <>
                AluCalc OS <br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Mobile & Smartwatch APK Downloads
                </span>
              </>
            )}
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {tr
              ? 'Tüm mühendislik hesaplayıcılarını, 2D/3D CAD tasarım stüdyosunu ve saha telemetri araçlarını internet bağlantısı olmadan telefonunuzda ve Wear OS akıllı saatinizde kullanın.'
              : 'Take the entire deterministic engineering suite, 2D/3D CAD workstation, and field telemetry tools offline on your Android devices and Wear OS smartwatches.'}
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Android Mobile & Tablet */}
          <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#080d1a] to-[#04070e] p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden group hover:border-cyan-400/60 transition-all">
            <div className="pointer-events-none absolute -top-16 -right-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-inner">
                  <Smartphone size={28} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-black uppercase">
                  ANDROID APK
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  AluCalc OS Android App
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {tr
                    ? 'Telefon ve tabletler için optimize edilmiş tam kapsamlı mühendislik işletim sistemi. Çevrimdışı hesaplama motoru, Jiroskopik Su Terazisi ve 2D AluCAD.'
                    : 'Full deterministic engineering OS optimized for Android smartphones and tablets with offline solvers, gyro level, and 2D AluCAD.'}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Dosya Boyutu' : 'File Size'}</span>
                  <span className="font-bold text-white">1.16 MB (Ultra Light)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Gereksinim' : 'Requirement'}</span>
                  <span className="font-bold text-white">Android 7.0+ (Nougat - Android 16)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Sertifika' : 'Signature'}</span>
                  <span className="font-bold text-emerald-400">RSA-2048 (SHA-256 Validated)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 relative z-10">
              <a
                href="/app/alucalc-release.apk"
                download="alucalc-release.apk"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,229,255,0.3)] group active:scale-[0.99]"
              >
                <HardDriveDownload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>{tr ? 'Doğrudan APK İndir (v5.0)' : 'Download APK Directly (v5.0)'}</span>
              </a>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <a href="/app/alucalc-release.aab" download="alucalc-release.aab" className="hover:text-cyan-300 hover:underline">
                  {tr ? 'Google Play AAB İndir' : 'Download Google Play AAB'}
                </a>
                <span className="text-slate-600">v5.0.0</span>
              </div>
            </div>
          </div>

          {/* Card 2: Wear OS Smartwatch */}
          <div className="relative rounded-3xl border border-sky-500/30 bg-gradient-to-b from-[#0a0f1e] to-[#04070e] p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-8 overflow-hidden group hover:border-sky-400/60 transition-all">
            <div className="pointer-events-none absolute -top-16 -right-16 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-500/40 text-sky-300 shadow-inner">
                  <Watch size={28} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-black uppercase">
                  WEAR OS WATCH APK
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">
                  AluCalc OS Wear OS Smartwatch
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {tr
                    ? 'Samsung Galaxy Watch, Google Pixel Watch ve Wear OS 3+ akıllı saatler için bağımsız saha asistanı. Titreşim analizi ve hızlı birim çevirici.'
                    : 'Standalone smartwatch app for Samsung Galaxy Watch, Google Pixel Watch, and Wear OS 3+ devices with vibration analysis and tap charts.'}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Dosya Boyutu' : 'File Size'}</span>
                  <span className="font-bold text-white">1.16 MB (Optimized)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Uyumlu Cihazlar' : 'Compatible Devices'}</span>
                  <span className="font-bold text-white">Galaxy Watch 4/5/6/7, Pixel Watch, TicWatch</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-400">{tr ? 'Yükleme Modu' : 'Installation'}</span>
                  <span className="font-bold text-cyan-400">Wireless Debugging / ADB Sideload</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 relative z-10">
              <a
                href="/app/alucalc-wear-release.apk"
                download="alucalc-wear-release.apk"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] group active:scale-[0.99]"
              >
                <HardDriveDownload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>{tr ? 'Saat APK İndir (Wear OS)' : 'Download Watch APK (Wear OS)'}</span>
              </a>

              {/* Copy ADB command */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-400 truncate pr-2">{adbWatchCmd}</span>
                <button
                  onClick={copyAdb}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-cyan-300 flex items-center gap-1 shrink-0 transition"
                >
                  {copiedAdb ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedAdb ? (tr ? 'Kopyalandı' : 'Copied') : (tr ? 'Kopyala' : 'Copy')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Matrix / Highlights */}
        <div className="p-8 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-cyan-400" />
            <span>{tr ? 'Mobil ve Akıllı Saat Yetenekleri' : 'Mobile & Smartwatch Features'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <Zap size={16} />
                <span>{tr ? '100% Çevrimdışı Motor' : '100% Offline Engine'}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {tr
                  ? 'Atölye, şantiye ve uçak modunda tüm formülleri internet gerektirmeden çalıştırır.'
                  : 'Run all solvers in hangars, basements, or remote job sites with zero network dependency.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <Compass size={16} />
                <span>{tr ? 'Saha Sensörleri & Terazi' : 'Field Sensors & Level'}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {tr
                  ? 'Telefon jiroskopu ve ivmeölçeri ile 2 eksenli çerçeve hizalama ve yükseklik bulucu.'
                  : '2-axis frame alignment spirit level, sound meter, and optical height finder.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="font-bold text-cyan-300 flex items-center gap-2">
                <Watch size={16} />
                <span>{tr ? 'Bilekte Saha Kılavuzu' : 'Wrist-Mounted Guide'}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {tr
                  ? 'Akıllı saatinizden metrik cıvata kılavuz çekme deliklerine ve birim çeviriciye anında erişim.'
                  : 'Instant tap drill charts, bolt torque lookups, and unit conversions on your wrist.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <HomeFooterSection />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Watch,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  X,
  Sparkles,
  Terminal,
  Layers,
  HardDriveDownload,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const [activeTab, setActiveTab] = useState<'mobile' | 'wear' | 'guide'>('mobile');
  const [copiedAdb, setCopiedAdb] = useState(false);

  const adbWatchCmd = 'adb install -r alucalc-wear-release.apk';

  const copyAdb = () => {
    navigator.clipboard.writeText(adbWatchCmd);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-[#060a12] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Ambient Background Gradient */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 relative z-10 bg-black/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                  <Download size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400">ALUCALC OS</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v5.0 STABLE</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {tr ? 'Mobil ve Akıllı Saat APK İndirme Merkezi' : 'Mobile & Wear OS App Download Center'}
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 bg-black/40 px-4 sm:px-6 gap-2 text-xs font-mono">
              <button
                onClick={() => setActiveTab('mobile')}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold transition-all ${
                  activeTab === 'mobile'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone size={16} />
                <span>{tr ? 'Android Telefon & Tablet' : 'Android Mobile & Tablet'}</span>
              </button>

              <button
                onClick={() => setActiveTab('wear')}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold transition-all ${
                  activeTab === 'wear'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Watch size={16} />
                <span>{tr ? 'Wear OS Akıllı Saat' : 'Wear OS Smartwatch'}</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold transition-all ${
                  activeTab === 'guide'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info size={16} />
                <span>{tr ? 'Kurulum Rehberi' : 'Install Guide'}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs sm:text-sm">
              {activeTab === 'mobile' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090f1a] border border-cyan-500/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">AluCalc OS Android App</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">APK (1.16 MB)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tr
                          ? '100+ mekanik hesaplayıcı, 2D AluCAD, 3D görselleştirme, jiroskop su terazisi ve çevrimdışı çalışma desteği.'
                          : '100+ engineering solvers, 2D AluCAD, 3D visualization, gyro spirit level and full offline support.'}
                      </p>
                    </div>

                    <a
                      href="/app/alucalc-release.apk"
                      download="alucalc-release.apk"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0"
                    >
                      <HardDriveDownload size={16} />
                      <span>{tr ? 'APK İndir' : 'Download APK'}</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{tr ? 'Paket Adı' : 'Package ID'}</div>
                      <div className="text-white font-bold select-all">com.alucard.alucalcos</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{tr ? 'Ekstra Format' : 'Alt Format'}</div>
                      <a href="/app/alucalc-release.aab" download="alucalc-release.aab" className="text-cyan-400 hover:underline flex items-center gap-1 font-bold">
                        <span>Google Play AAB (1.29 MB)</span>
                        <Download size={12} />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs">
                    <ShieldCheck size={20} className="shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-bold text-white mb-0.5">{tr ? 'Güvenli ve İmzalı Paket' : 'Secure & Signed Package'}</div>
                      <p className="text-emerald-300/80 leading-relaxed">
                        {tr
                          ? 'Resmi RSA-2048 SHA-256 anahtarıyla imzalanmıştır. Google Digital Asset Links entegrasyonu ile tam güvenlik sağlar.'
                          : 'Signed with official RSA-2048 SHA-256 certificate. Full TWA & Digital Asset Links verification.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wear' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090f1a] border border-cyan-500/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">AluCalc OS Wear OS Watch App</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">WATCH APK (1.16 MB)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tr
                          ? 'Samsung Galaxy Watch, Google Pixel Watch ve Wear OS 3+ akıllı saatler için bilekte saha kılavuzu ve titreşim analizi.'
                          : 'Wrist-mounted field engineering, ISO 10816 vibration analysis, and tap charts for Galaxy Watch & Pixel Watch.'}
                      </p>
                    </div>

                    <a
                      href="/app/alucalc-wear-release.apk"
                      download="alucalc-wear-release.apk"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0"
                    >
                      <HardDriveDownload size={16} />
                      <span>{tr ? 'Saat APK İndir' : 'Download Watch APK'}</span>
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-300 flex items-center justify-between">
                      <span>{tr ? 'ADB ile Akıllı Saate Yükleme Komutu:' : 'Direct ADB Install Command for Smartwatch:'}</span>
                      <button
                        onClick={copyAdb}
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                      >
                        {copiedAdb ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedAdb ? (tr ? 'Kopyalandı' : 'Copied') : (tr ? 'Kopyala' : 'Copy')}</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/80 border border-cyan-900/40 text-cyan-300 font-mono text-xs select-all">
                      {adbWatchCmd}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                      {tr ? 'Telefona Doğrudan APK Kurulumu' : 'Direct APK Installation on Android'}
                    </h4>
                    <p className="text-slate-400">
                      {tr
                        ? '1. İndirdiğiniz "alucalc-release.apk" dosyasına dokunun.\n2. "Bilinmeyen kaynaklardan yükleme" uyarısı çıkarsa izin verin.\n3. Yükle butonuna basarak kurulumu tamamlayın.'
                        : '1. Tap the downloaded "alucalc-release.apk" file.\n2. Allow installation from unknown sources if prompted.\n3. Tap Install to complete setup.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                      {tr ? 'Wear OS Akıllı Saate Yükleme (Sideload)' : 'Wear OS Smartwatch Sideloading'}
                    </h4>
                    <p className="text-slate-400">
                      {tr
                        ? '1. Saatinizde Geliştirici Seçenekleri > Kablosuz Hata Ayıklama (Wireless Debugging) modunu açın.\n2. Telefonunuzdaki Easy Fire Tools veya bilgisayardaki ADB ile saate bağlanın.\n3. "alucalc-wear-release.apk" dosyasını yükleyin.'
                        : '1. Enable Developer Options > Wireless Debugging on your Wear OS watch.\n2. Connect via Easy Fire Tools / Bugjaeger or ADB on PC.\n3. Install "alucalc-wear-release.apk".'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" />
                <span>{tr ? 'AluCalc OS v5.0 Resmi Yayın' : 'Official AluCalc OS v5.0 Release'}</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition"
              >
                {tr ? 'Kapat' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AppDownloadModal;

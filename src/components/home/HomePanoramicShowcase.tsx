'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Activity,
  Scissors,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  Zap,
  Gauge,
  Flame,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AegisMascot, playMascotChirp, type AegisPose } from '@/components/copilot/AegisMascot';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { APP_MAJOR_MINOR } from '@/config/app';

type ShowcaseMode = 'cad' | 'fea' | 'cam' | 'flow';

interface DialogEntry {
  pose: AegisPose;
  tr: string;
  en: string;
  subTr: string;
  subEn: string;
}

const AEGIS_DIALOGS: DialogEntry[] = [
  {
    pose: 'wave',
    tr: 'Selam Mühendis! "Bu ne ola ki?" dediğini duyar gibiyim!',
    en: 'Greetings Engineer! I heard you say "What on earth is this?!"',
    subTr: 'Burası web tarayıcında yaşayan dünyanın ilk bütünleşik 3D CAD, CAM, FEA ve Standart Çözücü İşletim Sistemi!',
    subEn: 'This is the world\'s first live 3D CAD, CAM, FEA & Standard Solver Operating System running right in your browser!',
  },
  {
    pose: 'celebrate',
    tr: 'Beni tıkla, manzarayı değiştir veya lazeri ateşle!',
    en: 'Click me, switch the scenery, or fire the laser!',
    subTr: 'Aşağıdaki mod butonlarıyla 3D katı model, von Mises gerilme ısı haritası ve CNC takım yolları arasında geçiş yap.',
    subEn: 'Use the mode buttons below to switch between 3D solid model, von Mises stress heatmap, and CNC toolpaths.',
  },
  {
    pose: 'calculation',
    tr: 'VDI 2230 cıvatan mı gevşedi, dişlin mi aşındı?',
    en: 'Loose VDI 2230 bolt or worn gear tooth?',
    subTr: '89+ deterministik ISO/DIN/VDI çözücümüz sıfır sapma ve 64-bit hassasiyetle emrinde.',
    subEn: '89+ deterministic ISO/DIN/VDI solvers are at your command with zero drift and 64-bit precision.',
  },
  {
    pose: 'thinking',
    tr: 'Şu an beynimde von Mises gerilmesi 0 MPa!',
    en: 'Von Mises stress in my titanium cortex is currently 0 MPa!',
    subTr: 'Çünkü tüm hesaplamalar bulut sunucularına gitmeden doğrudan cihazında çalışıyor.',
    subEn: 'Because all computations run locally on your device with zero cloud lag.',
  },
  {
    pose: 'einstein',
    tr: 'Dahiliye ciddiyet, hariciye zevk-i sefa!',
    en: 'Rigorous within, thrilling without!',
    subTr: 'Yüzeyde fütüristik ve eğlenceli bir şov, içeride tavizsiz endüstriyel matematik.',
    subEn: 'Futuristic and playful on the surface, uncompromising industrial mathematics inside.',
  },
];

export function HomePanoramicShowcase() {
  const { language } = useI18nStore();
  const [activeMode, setActiveMode] = useState<ShowcaseMode>('fea');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [lookAt, setLookAt] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [poseOverride, setPoseOverride] = useState<AegisPose | null>(null);
  const [rotationAngle, setRotationAngle] = useState(25);
  const [laserActive, setLaserActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setLookAt({ x, y });
    setRotationAngle(25 + x * 20);
  }, []);

  // Cycle dialog
  const cycleDialog = useCallback(() => {
    setDialogIndex((prev) => (prev + 1) % AEGIS_DIALOGS.length);
    if (soundEnabled) {
      playMascotChirp(1040, 'ping');
    }
  }, [soundEnabled]);

  // Click mascot: celebrate & blast laser
  const handleMascotClick = () => {
    if (soundEnabled) {
      playMascotChirp(1200, 'solve');
    }
    setPoseOverride('celebrate');
    setLaserActive(true);
    cycleDialog();
    window.setTimeout(() => {
      setPoseOverride(null);
      setLaserActive(false);
    }, 1500);
  };

  const handleModeChange = (mode: ShowcaseMode) => {
    setActiveMode(mode);
    if (soundEnabled) {
      playMascotChirp(mode === 'fea' ? 980 : mode === 'cam' ? 760 : 880, 'calc');
    }
  };

  const currentDialog = AEGIS_DIALOGS[dialogIndex];
  const mascotPose = poseOverride || (isHovered ? 'wave' : currentDialog.pose);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setLookAt(null);
        setRotationAngle(25);
      }}
      className="relative w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-0)] overflow-hidden shadow-2xl p-4 sm:p-6 lg:p-8 select-none"
    >
      {/* ═══ 1. PANORAMIC BACKGROUND ATMOSPHERE (Futuristic CAD / FEA Grid) ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(58, 208, 230, 0.25), transparent 70%),
            linear-gradient(to right, rgba(58, 208, 230, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(58, 208, 230, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      />

      {/* Cybernetic Horizon Glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--cyan)]/10 via-[var(--bg-0)]/60 to-transparent" />

      {/* Laser Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent " />

      {/* ═══ 2. TOP HEADER HUD / TELEMETRY STATUS ═══ */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--line)]/80 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ok)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ok)]" />
            </span>
            <span className="font-bold text-[var(--ink)] tracking-wider">
              AeGiS AUTONOMOUS COPILOT v{APP_MAJOR_MINOR}
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-2)] text-[var(--cyan)] border border-[var(--cyan)]/20 text-[10px]">
            <ShieldCheck size={12} />
            <span>{t12(language, 'ISO / DIN / VDI Certified Kernel', 'ISO / DIN / VDI Onaylı Çekirdek')}</span>
          </span>
        </div>

        {/* Right Controls: Audio & Dialogue Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleDialog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-[var(--cyan)] text-[var(--ink)] transition-colors cursor-pointer text-[10px]"
            title={t12(language, 'Ask AeGiS another quote / tip', 'AeGiS\'ten yeni ipucu veya söz iste')}
          >
            <MessageSquare size={12} className="text-[var(--cyan)]" />
            <span>{t12(language, 'Next Quip 💬', 'Sıradaki Mesaj 💬')}</span>
          </button>

          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--cyan)] transition-colors cursor-pointer"
            title={soundEnabled ? t12(language, 'Mute Sound FX', 'Sesi Kapat') : t12(language, 'Enable Sound FX', 'Sesi Aç')}
          >
            {soundEnabled ? <Volume2 size={14} className="text-[var(--cyan)]" /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* ═══ 3. THE GRAND PANORAMIC STAGE (AeGiS + Live 3D Hologram + Dialogue) ═══ */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-6 sm:py-8">
        
        {/* LEFT COLUMN (lg:col-span-5): AeGiS Super Mascot & Interactive Speech Bubble */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          
          {/* Dynamic Interactive Speech Bubble */}
          <div className="relative w-full max-w-md p-3.5 sm:p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--cyan)]/40 shadow-xl transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--cyan)] pb-1 mb-1 border-b border-[var(--line)]">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles size={12} className="animate-pulse" />
                {t12(language, 'AeGiS LIVE COMMENTARY', 'AeGiS CANLI DİYALOG')}
              </span>
              <span className="text-[var(--alu-dim)]">
                {dialogIndex + 1}/{AEGIS_DIALOGS.length}
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold font-tech text-[var(--ink)] leading-snug">
              &quot;{language === 'tr' ? currentDialog.tr : currentDialog.en}&quot;
            </p>

            <p className="mt-1.5 text-xs text-[var(--alu-dim)] font-sans leading-relaxed">
              {language === 'tr' ? currentDialog.subTr : currentDialog.subEn}
            </p>

            {/* Bubble arrow pointing towards mascot */}
            <div className="hidden lg:block absolute -right-2 top-10 w-4 h-4 bg-[var(--bg-1)] border-t border-r border-[var(--cyan)]/40 rotate-45" />
          </div>

          {/* Interactive Mascot Avatar & Controls */}
          <div className="flex items-center gap-4 pt-2">
            <div
              onClick={handleMascotClick}
              className="relative cursor-pointer group p-2 rounded-full hover:bg-[var(--cyan)]/10 transition-colors"
              title={t12(language, 'Click me to run diagnostics & celebrate!', 'Tanılama çalıştırmak ve kutlamak için tıkla!')}
            >
              {/* Holographic Aura */}
              <div className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(58,208,230,0.3),transparent_70%)] blur-md group-hover:scale-125 transition-transform" />

              <AegisMascot
                size={140}
                variant="full"
                lookAt={lookAt}
                isHovered={isHovered}
                pose={mascotPose}
                soundEnabled={soundEnabled}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left font-mono text-xs">
              <button
                onClick={handleMascotClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-bold text-[11px] shadow-sm hover:bg-[var(--cyan)] transition-all cursor-pointer"
              >
                <Zap size={13} />
                <span>{t12(language, 'Laser Scan / Celebrate 🚀', 'Lazer Tara / Kutla 🚀')}</span>
              </button>

              <span className="text-[10px] text-[var(--alu-dim)]">
                {t12(language, 'Tracks pointer in 3D parallax', 'İmleci 3D paralaks ile takip eder')}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-7): Panoramic 3D Isometric Engineering Showcase */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleModeChange('fea')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeMode === 'fea'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                    : 'text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)]'
                }`}
              >
                <Activity size={13} className="text-rose-400" />
                <span>{t12(language, 'Real-Time FEA Stress', 'Canlı FEA Gerilmesi')}</span>
              </button>

              <button
                onClick={() => handleModeChange('cam')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeMode === 'cam'
                    ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40 shadow-xs'
                    : 'text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)]'
                }`}
              >
                <Scissors size={13} className="text-[var(--ok)]" />
                <span>{t12(language, 'CNC Toolpath & CAM', 'CNC Takım Yolu & CAM')}</span>
              </button>

              <button
                onClick={() => handleModeChange('cad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeMode === 'cad'
                    ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-xs'
                    : 'text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)]'
                }`}
              >
                <Box size={13} className="text-[var(--cyan)]" />
                <span>{t12(language, '3D CAD B-Rep', '3D CAD Katı Model')}</span>
              </button>
            </div>

            <span className="hidden sm:inline-flex text-[10px] font-mono text-[var(--alu-dim)] px-2">
              {activeMode === 'fea' ? 'EN 1993 · Von Mises' : activeMode === 'cam' ? 'ISO 6983 · G-Code' : 'OpenCASCADE WASM'}
            </span>
          </div>

          {/* Interactive Scenic Canvas / Stage Viewport */}
          <div className="relative w-full h-[240px] sm:h-[280px] rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] overflow-hidden flex items-center justify-center shadow-inner group">
            
            {/* Viewport Laser Sweep Line */}
            {laserActive && (
              <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-[var(--cyan)] to-transparent animate-[ping_1.2s_ease-in-out_infinite]" />
            )}

            {/* Dynamic Telemetry Watermark */}
            <div className="absolute top-3 left-3 flex flex-col font-mono text-[10px] text-[var(--alu-dim)]/70 pointer-events-none">
              <span>MODEL: AL-6061-T6 BRACKET</span>
              <span>GRID: 10.00 mm · TOL: ISO 2768-mK</span>
              <span className="text-[var(--cyan)]">ROT: {rotationAngle.toFixed(1)}°</span>
            </div>

            {/* Readout Badge Top Right */}
            <div className="absolute top-3 right-3 font-mono text-right pointer-events-none">
              {activeMode === 'fea' && (
                <div className="px-2 py-1 rounded bg-rose-950/70 border border-rose-500/40 text-[10px] text-rose-300">
                  <div className="font-bold">σ_max = 142.6 MPa</div>
                  <div className="text-[9px] text-emerald-400">Sf = 1.93 (YIELD SAFE)</div>
                </div>
              )}
              {activeMode === 'cam' && (
                <div className="px-2 py-1 rounded bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-300">
                  <div className="font-bold">RPM: 8500 · F: 1200 mm/min</div>
                  <div className="text-[9px] text-[var(--cyan)]">G01 X120.4 Y45.0 Z-3.0</div>
                </div>
              )}
              {activeMode === 'cad' && (
                <div className="px-2 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-[10px] text-cyan-300">
                  <div className="font-bold">STEP AP242 · B-REP</div>
                  <div className="text-[9px] text-white">SOLID BODY (0 NON-MANIFOLD)</div>
                </div>
              )}
            </div>

            {/* ═══ INTERACTIVE SVG ISOMETRIC 3D PART ═══ */}
            <div
              className="relative transition-transform duration-300 ease-out"
              style={{
                transform: `perspective(600px) rotateY(${(rotationAngle - 25) * 0.8}deg) scale(1.05)`,
              }}
            >
              <svg
                width="340"
                height="220"
                viewBox="0 0 340 220"
                className="overflow-visible select-none drop-shadow-2xl"
              >
                <defs>
                  {/* FEA Rainbow Gradient */}
                  <linearGradient id="feaRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="25%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="75%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  {/* CAD Aluminum Gradient */}
                  <linearGradient id="aluChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* CAM Glow Filter */}
                  <filter id="camGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Isometric Base Grid Shadow */}
                <ellipse cx="170" cy="180" rx="110" ry="24" fill="rgba(0,0,0,0.5)" filter="blur(8px)" />

                {/* Isometric Cantilever / Structural Mechanical Bracket */}
                {/* Bottom Extrusion */}
                <path
                  d="M 80 130 L 170 175 L 260 130 L 260 110 L 170 155 L 80 110 Z"
                  fill={activeMode === 'fea' ? 'url(#feaRainbow)' : '#111827'}
                  stroke={activeMode === 'cam' ? '#22c55e' : '#38bdf8'}
                  strokeWidth="1.5"
                  opacity={activeMode === 'fea' ? 0.9 : 0.8}
                />

                {/* Left Face */}
                <path
                  d="M 80 80 L 170 125 L 170 155 L 80 110 Z"
                  fill={activeMode === 'fea' ? 'url(#feaRainbow)' : '#1e293b'}
                  stroke={activeMode === 'cam' ? '#22c55e' : '#38bdf8'}
                  strokeWidth="1.5"
                />

                {/* Right Face */}
                <path
                  d="M 170 125 L 260 80 L 260 110 L 170 155 Z"
                  fill={activeMode === 'fea' ? 'url(#feaRainbow)' : '#0f172a'}
                  stroke={activeMode === 'cam' ? '#22c55e' : '#38bdf8'}
                  strokeWidth="1.5"
                />

                {/* Top Deck */}
                <path
                  d="M 80 80 L 170 35 L 260 80 L 170 125 Z"
                  fill={activeMode === 'fea' ? 'url(#feaRainbow)' : 'url(#aluChassis)'}
                  stroke={activeMode === 'cam' ? '#22c55e' : '#38bdf8'}
                  strokeWidth="2"
                />

                {/* Center Bored Hole (Parametric Counterbore) */}
                <ellipse
                  cx="170"
                  cy="80"
                  rx="30"
                  ry="15"
                  fill="#030712"
                  stroke={activeMode === 'cam' ? '#4ade80' : activeMode === 'fea' ? '#ef4444' : '#38bdf8'}
                  strokeWidth="2"
                />

                {/* Inner Depth Hole */}
                <path
                  d="M 140 80 C 140 95, 200 95, 200 80 L 200 100 C 200 115, 140 115, 140 100 Z"
                  fill="#050810"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* CAM Toolpath Overlay (If CAM Mode) */}
                {activeMode === 'cam' && (
                  <g filter="url(#camGlow)">
                    {/* Spiral Milling Path */}
                    <path
                      d="M 170 80 m -40, 0 a 40,20 0 1,0 80,0 a 40,20 0 1,0 -80,0"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-[spin_6s_linear_infinite]"
                      style={{ transformOrigin: '170px 80px' }}
                    />
                    {/* Tooltip G00 Trajectory Line */}
                    <line x1="280" y1="30" x2="170" y2="80" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* CNC Endmill Cutter Icon */}
                    <circle cx="170" cy="80" r="5" fill="#f59e0b" />
                    <line x1="170" y1="80" x2="170" y2="50" stroke="#f59e0b" strokeWidth="3" />
                  </g>
                )}

                {/* FEA High Stress Point Indicator (If FEA Mode) */}
                {activeMode === 'fea' && (
                  <g>
                    <circle cx="140" cy="80" r="6" fill="#ef4444" className="animate-ping opacity-75" />
                    <circle cx="140" cy="80" r="4" fill="#ef4444" />
                    <line x1="140" y1="80" x2="90" y2="40" stroke="#ef4444" strokeWidth="1.5" />
                    <rect x="30" y="24" width="75" height="20" rx="3" fill="#1f1315" stroke="#ef4444" strokeWidth="1" />
                    <text x="35" y="38" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      142.6 MPa PEAK
                    </text>
                  </g>
                )}

                {/* CAD Dimension Callouts (If CAD Mode) */}
                {activeMode === 'cad' && (
                  <g>
                    <line x1="80" y1="135" x2="170" y2="180" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="80" cy="135" r="2" fill="#38bdf8" />
                    <circle cx="170" cy="180" r="2" fill="#38bdf8" />
                    <text x="110" y="170" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      120.00 mm
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Floating Interactive Instruction */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-[var(--bg-0)]/90 border border-[var(--line)] text-[10px] font-mono text-[var(--cyan)] shadow-md">
                {t12(language, 'Move cursor to rotate 3D view · Click modes above to explore', 'İmleci gezdirerek 3D modeli döndür · Yukarıdan modları dene')}
              </span>
            </div>
          </div>

          {/* ═══ 4. INSTANT LAUNCH DOORS INTO ACTUAL SOLVERS & 3D STUDIO ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <Link
              href="/design-studio"
              className="flex items-center justify-between p-3 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-tech font-bold text-xs tracking-wide transition-all group"
            >
              <div className="flex items-center gap-2">
                <Box size={16} />
                <span>{t12(language, 'Launch 3D Studio', '3D Stüdyoyu Başlat')}</span>
              </div>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/calculators"
              className="flex items-center justify-between p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] hover:bg-[var(--bg-2)] border border-[var(--line-strong)] hover:border-[var(--cyan)] text-white font-tech font-medium text-xs transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-[var(--std)]" />
                <span>{t12(language, 'Engineering Solvers', 'Mühendislik Çözücüleri')} ({solverCount})</span>
              </div>
              <ChevronRight size={14} className="text-[var(--alu-dim)] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/flow"
              className="flex items-center justify-between p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] hover:bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--ok)] text-[var(--ink)] font-mono text-xs transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[var(--ok)]" />
                <span>{t12(language, 'Flow Engine Graph', 'Flow Engine Grafı')}</span>
              </div>
              <ChevronRight size={14} className="text-[var(--alu-dim)] group-hover:text-[var(--ok)] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePanoramicShowcase;

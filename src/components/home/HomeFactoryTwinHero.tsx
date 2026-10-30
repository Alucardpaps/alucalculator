'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Factory,
  Box,
  Activity,
  Scissors,
  ArrowRight,
  Gauge,
  Cpu,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  Crosshair,
  CheckCircle2,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { playMascotChirp } from '@/components/copilot/AegisMascot';

export function HomeFactoryTwinHero() {
  const { language } = useI18nStore();
  const [isPlaying, setIsPlaying] = useState(true);
  const [cycleTime, setCycleTime] = useState(14.2);
  const [oeePercent, setOeePercent] = useState(88.4);
  const [temperature, setTemperature] = useState(16.5);
  const [sparkActive, setSparkActive] = useState(true);
  const [rotationOffset, setRotationOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setRotationOffset(x * 12);
  }, []);

  // Live simulation tick
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCycleTime((prev) => {
        const next = prev - 0.2;
        if (next <= 0) {
          playMascotChirp(1200, 'solve');
          setOeePercent((o) => Math.min(96, Math.max(82, +(o + (Math.random() * 1.2 - 0.5)).toFixed(1))));
          return 14.2;
        }
        return +next.toFixed(1);
      });
      setSparkActive((s) => !s || Math.random() > 0.3);
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-0)] overflow-hidden shadow-2xl p-4 sm:p-6 lg:p-7 select-none group"
    >
      {/* ═══ 1. BACKGROUND INDUSTRIAL FACTORY GRID ATMOSPHERE ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 25%, rgba(0, 229, 255, 0.22), transparent 70%),
            linear-gradient(to right, rgba(0, 229, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        }}
      />

      {/* Cybernetic Floor Glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--cyan)]/10 via-[var(--bg-0)]/70 to-transparent" />

      {/* Top Laser Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent " />

      {/* ═══ 2. HEADER TELEMETRY STRIP ═══ */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)] text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-bold text-white tracking-wider uppercase">
              {t12(language, 'INDUSTRY 4.0 DIGITAL TWIN CELL', 'ENDÜSTRİ 4.0 DİJİTAL İKİZ HÜCRESİ')}
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px]">
            <CheckCircle2 size={11} />
            <span>CELL ACTIVE · ISO 22400 / VDI 2860</span>
          </span>
        </div>

        {/* Right Controls: Sim Play/Pause & Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying((p) => !p);
              playMascotChirp(isPlaying ? 700 : 1000, 'ping');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[10px] font-mono transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{t12(language, 'Pause Sim', 'Simülasyonu Duraklat')}</span>
              </>
            ) : (
              <>
                <Play size={10} className="text-emerald-400" />
                <span>{t12(language, 'Resume Sim', 'Simülasyonu Başlat')}</span>
              </>
            )}
          </button>

          <Link
            href="/factory"
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 text-[10px] font-mono font-bold transition-all"
            title={t12(language, 'Open Full 3D Factory Floor', 'Tam 3D Fabrikayı Aç')}
          >
            <Factory size={11} />
            <span>{t12(language, 'Full 3D Factory →', 'Tam Fabrika Modeli →')}</span>
          </Link>
        </div>
      </div>

      {/* ═══ 3. THE GRAND 3D FACTORY ROBOTIC STAGE (DESIGN 3 VISUAL) ═══ */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center py-5 sm:py-6">
        
        {/* LEFT COLUMN HUD (lg:col-span-3): LIVE OEE & CYCLE TIME GAUGES */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-3 justify-between">
          
          {/* Card 1: Live OEE Circular Gauge */}
          <div className="flex-1 p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                {t12(language, 'Overall OEE', 'Genel OEE')}
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1 mt-0.5">
                <span>{oeePercent}%</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400">
                {t12(language, '▲ Optimal Yield', '▲ İdeal Verim')}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeDasharray={`${oeePercent}, 100`}
                  className="transition-all duration-300"
                />
              </svg>
              <Gauge size={14} className="absolute text-emerald-400" />
            </div>
          </div>

          {/* Card 2: Cycle Time Countdown */}
          <div className="flex-1 p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-lg">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--alu-dim)] mb-1">
              <span>{t12(language, 'Cycle Timer', 'Çevrim Süresi')}</span>
              <span className="text-[var(--cyan)] font-bold">14.2s NOMINAL</span>
            </div>
            <div className="text-xl font-bold font-mono text-[var(--cyan)] tracking-tight">
              {cycleTime}s
            </div>
            <div className="w-full bg-[var(--bg-2)] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[var(--cyan)] h-full transition-all duration-200"
                style={{ width: `${(cycleTime / 14.2) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 3: Thermal & Health Readout */}
          <div className="hidden lg:flex items-center justify-between p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] text-[10px] font-mono text-[var(--alu-dim)]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Thermometer size={12} className="text-cyan-400" />
              <span>Cell Temp: {temperature} °C</span>
            </span>
            <span className="text-emerald-400 font-bold">NORMAL</span>
          </div>
        </div>

        {/* ═══ CENTER STAGE (lg:col-span-9): 3D ROBOTIC WELDING CELL & CHASSIS CONVEYOR ═══ */}
        <div className="lg:col-span-9 relative flex flex-col justify-between rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] p-4 sm:p-6 overflow-hidden min-h-[300px] sm:min-h-[340px] shadow-inner">
          
          {/* Top-Right 3D Coordinate Inspection HUD */}
          <div className="absolute top-3 right-3 text-right font-mono text-[10px] pointer-events-none z-20">
            <div className="px-2.5 py-1.5 rounded bg-[var(--bg-0)]/90 border border-[var(--cyan)]/30 text-[var(--cyan)] shadow-md">
              <div className="flex items-center justify-end gap-1 font-bold">
                <Crosshair size={11} />
                <span>3D KINEMATICS COORD</span>
              </div>
              <div className="text-[9px] text-[var(--alu-dim)]">
                X: 1840.0 · Y: 420.5 · Z: 890.0 mm
              </div>
            </div>
          </div>

          {/* Top-Left Machine Name */}
          <div className="absolute top-3 left-3 font-mono text-[10px] text-[var(--alu-dim)] pointer-events-none z-20">
            <span className="text-white font-bold">CELL-A1: 6-AXIS ROBOTIC WELDING LINE</span>
            <div className="text-[9px] text-[var(--cyan)]">AUTO-ASSEMBLY & SPOT WELDING</div>
          </div>

          {/* ═══ INTERACTIVE ISOMETRIC ROBOTIC FACTORY CELL (SVG 3D PERSPECTIVE) ═══ */}
          <div
            className="flex-1 flex items-center justify-center transition-transform duration-200 ease-out py-4"
            style={{
              transform: `perspective(800px) rotateY(${rotationOffset * 0.6}deg) rotateX(${
                -rotationOffset * 0.15
              }deg)`,
            }}
          >
            <svg
              width="560"
              height="280"
              viewBox="0 0 560 280"
              className="overflow-visible drop-shadow-2xl max-w-full h-auto"
            >
              <defs>
                {/* Robot KUKA Orange Gradient */}
                <linearGradient id="kukaOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff781f" />
                  <stop offset="50%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>

                {/* Dark Steel Conveyor Gradient */}
                <linearGradient id="steelConveyor" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* Aluminum Chassis Gradient */}
                <linearGradient id="chassisSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>

                {/* Welding Glow Filter */}
                <filter id="weldSpark" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Floor Factory Tiles & Shadows */}
              <ellipse cx="280" cy="245" rx="220" ry="30" fill="rgba(0,0,0,0.65)" filter="blur(10px)" />

              {/* 2. Automated Conveyor Track */}
              {/* Conveyor Bed */}
              <polygon
                points="80,180 480,180 440,215 40,215"
                fill="url(#steelConveyor)"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Conveyor Rollers (Animated dashes) */}
              <line x1="80" y1="185" x2="480" y2="185" stroke="#475569" strokeWidth="2" strokeDasharray="8 6" />
              <line x1="60" y1="200" x2="460" y2="200" stroke="#475569" strokeWidth="2" strokeDasharray="8 6" />

              {/* 3. Aluminum Vehicle Chassis (Mounted on Conveyor) */}
              <g transform="translate(180, 135)">
                {/* Chassis Lower Pan */}
                <polygon
                  points="20,40 180,40 200,65 0,65"
                  fill="url(#chassisSilver)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                {/* Chassis Structural Ribs */}
                <line x1="40" y1="42" x2="25" y2="62" stroke="#00e5ff" strokeWidth="1.2" />
                <line x1="80" y1="42" x2="65" y2="62" stroke="#00e5ff" strokeWidth="1.2" />
                <line x1="120" y1="42" x2="105" y2="62" stroke="#00e5ff" strokeWidth="1.2" />
                <line x1="160" y1="42" x2="145" y2="62" stroke="#00e5ff" strokeWidth="1.2" />
              </g>

              {/* 4. ROBOT ARM 1 (Left 6-Axis Robot - Orange KUKA Style) */}
              <g transform="translate(130, 70)">
                {/* Base Turret */}
                <ellipse cx="40" cy="110" rx="24" ry="10" fill="#0f172a" stroke="#ea580c" strokeWidth="1.5" />
                <rect x="25" y="85" width="30" height="25" rx="4" fill="url(#kukaOrange)" stroke="#334155" strokeWidth="1" />
                {/* Joint 1 (Swivel) */}
                <circle cx="40" cy="85" r="8" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Arm Segment 1 (Shoulder to Elbow) */}
                <line x1="40" y1="85" x2="75" y2="30" stroke="url(#kukaOrange)" strokeWidth="12" strokeLinecap="round" />
                <circle cx="75" cy="30" r="7" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Arm Segment 2 (Elbow to Wrist) */}
                <line x1="75" y1="30" x2="125" y2="75" stroke="url(#kukaOrange)" strokeWidth="9" strokeLinecap="round" />
                <circle cx="125" cy="75" r="5" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Toolhead / Welding Torch */}
                <line x1="125" y1="75" x2="140" y2="105" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="140" cy="105" r="2.5" fill="#f59e0b" />

                {/* Welding Laser Sparks (Left Robot) */}
                {sparkActive && (
                  <g filter="url(#weldSpark)">
                    <circle cx="140" cy="105" r="6" fill="#38bdf8" opacity="0.9" className="animate-ping" />
                    <circle cx="140" cy="105" r="3" fill="#ffffff" />
                    <line x1="140" y1="105" x2="148" y2="98" stroke="#00e5ff" strokeWidth="1" />
                    <line x1="140" y1="105" x2="146" y2="114" stroke="#ffedd5" strokeWidth="1" />
                    <line x1="140" y1="105" x2="132" y2="110" stroke="#00e5ff" strokeWidth="1" />
                  </g>
                )}
              </g>

              {/* 5. ROBOT ARM 2 (Right 6-Axis Robot - Overhead Gripper) */}
              <g transform="translate(350, 70)">
                {/* Base Turret */}
                <ellipse cx="40" cy="110" rx="24" ry="10" fill="#0f172a" stroke="#ea580c" strokeWidth="1.5" />
                <rect x="25" y="85" width="30" height="25" rx="4" fill="url(#kukaOrange)" stroke="#334155" strokeWidth="1" />
                {/* Joint 1 */}
                <circle cx="40" cy="85" r="8" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Arm Segment 1 */}
                <line x1="40" y1="85" x2="10" y2="35" stroke="url(#kukaOrange)" strokeWidth="12" strokeLinecap="round" />
                <circle cx="10" cy="35" r="7" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Arm Segment 2 */}
                <line x1="10" y1="35" x2="-35" y2="80" stroke="url(#kukaOrange)" strokeWidth="9" strokeLinecap="round" />
                <circle cx="-35" cy="80" r="5" fill="#1e293b" stroke="#ea580c" strokeWidth="1.5" />

                {/* Gripper Clamp Tool */}
                <line x1="-35" y1="80" x2="-45" y2="105" stroke="#94a3b8" strokeWidth="3" />
                <path d="M -52 105 L -45 105 L -45 112" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M -38 105 L -45 105 L -45 112" fill="none" stroke="#38bdf8" strokeWidth="2" />
              </g>

              {/* 6. Dynamic Laser Coordinate Axes HUD (Pinnus 3D Space) */}
              <g transform="translate(420, 45)">
                <line x1="0" y1="0" x2="35" y2="0" stroke="#ef4444" strokeWidth="1.5" />
                <text x="38" y="4" fill="#ef4444" fontSize="8" fontFamily="monospace">X</text>
                <line x1="0" y1="0" x2="0" y2="-28" stroke="#22c55e" strokeWidth="1.5" />
                <text x="-4" y="-32" fill="#22c55e" fontSize="8" fontFamily="monospace">Z</text>
                <line x1="0" y1="0" x2="-20" y2="18" stroke="#00e5ff" strokeWidth="1.5" />
                <text x="-28" y="24" fill="#00e5ff" fontSize="8" fontFamily="monospace">Y</text>
                <circle cx="0" cy="0" r="3" fill="#ffffff" />
              </g>
            </svg>
          </div>

          {/* Bottom Card Footer: Action Doors */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--alu-dim)]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
              <span>
                {t12(
                  language,
                  'Real-time kinematic simulation · OEE telemetry · G-code CNC sync',
                  'Gerçek zamanlı kinematik simülasyon · OEE telemetrisi · G-code CNC eşitleme'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/factory"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-tech font-bold text-xs tracking-wide transition-all "
              >
                <Factory size={14} />
                <span>{t12(language, 'Open 3D Factory Simulation', '3D Fabrika Simülasyonunu Başlat')}</span>
                <ArrowRight size={13} />
              </Link>

              <Link
                href="/design-studio"
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white font-mono text-xs font-bold transition-colors"
              >
                <Box size={13} className="text-[var(--cyan)]" />
                <span>{t12(language, '3D CAD Studio', '3D CAD Stüdyo')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeFactoryTwinHero;

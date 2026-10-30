'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Wind,
  Cog,
  Box,
  Compass,
  Activity,
  Zap,
  Gauge,
  Scissors,
  Watch,
  Layers,
  Cpu,
  Bot,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Crosshair,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { playMascotChirp } from '@/components/copilot/AegisMascot';

export interface ConceptDefinition {
  id: number;
  nameTr: string;
  nameEn: string;
  tag: string;
  subtitleTr: string;
  subtitleEn: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  telemetryLeftTr: string;
  telemetryLeftEn: string;
  telemetryLeftVal: string;
  telemetryRightTr: string;
  telemetryRightEn: string;
  telemetryRightVal: string;
  accentColor: string;
}

export const HOMEPAGE_CONCEPTS: ConceptDefinition[] = [
  {
    id: 1,
    nameTr: 'Havacılık Turbofan Motoru',
    nameEn: 'Aerospace Turbofan Jet Engine',
    tag: 'AERO-PROPULSION · ISO 8535',
    subtitleTr: 'Türbin kanatçıkları, yanma odası kesiti ve aerodinamik akış hatları',
    subtitleEn: 'Turbine blisk, combustion cutaway, and aerodynamic velocity streamlines',
    icon: Wind,
    telemetryLeftTr: 'İtki Kuvveti (Thrust)',
    telemetryLeftEn: 'Thrust Output',
    telemetryLeftVal: '112.4 kN',
    telemetryRightTr: 'Maks. Türbin Gerilmesi',
    telemetryRightEn: 'Peak Blade Stress',
    telemetryRightVal: '385 MPa (Sf=2.1)',
    accentColor: '#00e5ff',
  },
  {
    id: 2,
    nameTr: 'Episiklik Planet Dişli Kutusu',
    nameEn: 'Epicyclic Planetary Gearbox',
    tag: 'KINEMATICS · ISO 6336 / DIN 3990',
    subtitleTr: 'Güneş, planet ve çember dişli temas gerilmesi analizi',
    subtitleEn: 'Sun, planet and ring gear contact stress & torque distribution',
    icon: Cog,
    telemetryLeftTr: 'Çıkış Torku (Torque)',
    telemetryLeftEn: 'Output Torque',
    telemetryLeftVal: '1,450 Nm',
    telemetryRightTr: 'Çevrim Oranı & Verim',
    telemetryRightEn: 'Gear Ratio & Eff.',
    telemetryRightVal: 'i = 28.4 (98.2%)',
    accentColor: '#38bdf8',
  },
  {
    id: 3,
    nameTr: 'Sonsuz 3D CAD Çalışma Tuvali',
    nameEn: 'Infinite 3D CAD Canvas',
    tag: 'PARAMETRIC B-REP · ISO 10303 STEP',
    subtitleTr: 'İzometrik teknik çizim ızgarası üzerinde doğrudan 3D montaj ve ölçülendirme',
    subtitleEn: 'Full-bleed isometric drafting grid with direct push-pull 3D assembly',
    icon: Box,
    telemetryLeftTr: 'Montaj Parça Sayısı',
    telemetryLeftEn: 'Active Sub-Assemblies',
    telemetryLeftVal: '24 Bileşen',
    telemetryRightTr: 'Geometrik Tolerans (GD&T)',
    telemetryRightEn: 'Geometric Tolerance',
    telemetryRightVal: '±0.005 mm (ISO 2768)',
    accentColor: '#818cf8',
  },
  {
    id: 4,
    nameTr: 'Hiperaraba Aerodinamik Rüzgar Tüneli',
    nameEn: 'Hypercar Aerodynamic Wind Tunnel',
    tag: 'CFD & GROUND EFFECT · SAE J1594',
    subtitleTr: 'Karbon şasi etrafında hava akış simülasyonu ve sürtünme katsayısı',
    subtitleEn: 'Carbon chassis airflow streamlines and downforce balance',
    icon: Compass,
    telemetryLeftTr: 'Sürtünme Katsayısı (Cd)',
    telemetryLeftEn: 'Drag Coefficient (Cd)',
    telemetryLeftVal: '0.208 Cd',
    telemetryRightTr: 'Bastırma Kuvveti @ 250km/h',
    telemetryRightEn: 'Downforce @ 250km/h',
    telemetryRightVal: '4,200 N',
    accentColor: '#2dd4bf',
  },
  {
    id: 5,
    nameTr: 'Biyonik Mekatronik Robotik El',
    nameEn: 'Bionic Mechatronic Robotic Hand',
    tag: 'MECHATRONICS · VDI 2206',
    subtitleTr: 'Mikro doğrusal eyleyiciler, tendon gerilimleri ve 5 parmak kinematik serbestlik',
    subtitleEn: 'Micro-linear actuators, tendon tension sensors, and 5-finger kinematics',
    icon: Bot,
    telemetryLeftTr: 'Kavrama Kuvveti (Grip)',
    telemetryLeftEn: 'Peak Grip Force',
    telemetryLeftVal: '140.0 N',
    telemetryRightTr: 'Serbestlik Derecesi (DoF)',
    telemetryRightEn: 'Degrees of Freedom',
    telemetryRightVal: '16 Aktif Eksen',
    accentColor: '#a78bfa',
  },
  {
    id: 6,
    nameTr: '5 Eksenli Yüksek Hızlı CNC Freze Mili',
    nameEn: '5-Axis High-Speed CNC Spindle',
    tag: 'CAM & TOOLPATHS · ISO 6983',
    subtitleTr: 'HSK-63A mil başlığı, titanyum blisk işleme ve canlı G-code takım yolları',
    subtitleEn: 'HSK-63A spindle sculpting titanium blisk with live G-code toolpaths',
    icon: Scissors,
    telemetryLeftTr: 'Mil Hızı (Spindle RPM)',
    telemetryLeftEn: 'Spindle Speed',
    telemetryLeftVal: '24,000 RPM',
    telemetryRightTr: 'Diş Başına İlerleme (fz)',
    telemetryRightEn: 'Feed per Tooth (fz)',
    telemetryRightVal: '0.085 mm/z',
    accentColor: '#34d399',
  },
  {
    id: 7,
    nameTr: 'İsviçre Tourbillon Mekanik Saat Mekanizması',
    nameEn: 'Swiss Tourbillon Mechanical Movement',
    tag: 'MICRO-MECHANICS · NIHS 91-10',
    subtitleTr: 'İskeletleştirilmiş dişli çarkları, yakut yataklar ve balans yayı salınımı',
    subtitleEn: 'Skeletonized gear train, ruby jewels, and balance spring oscillation',
    icon: Watch,
    telemetryLeftTr: 'Salınım Frekansı',
    telemetryLeftEn: 'Oscillation Frequency',
    telemetryLeftVal: '28,800 vph (4 Hz)',
    telemetryRightTr: 'Günlük Sapma Hassasiyeti',
    telemetryRightEn: 'Daily Rate Deviation',
    telemetryRightVal: '+0.8 s/gün (COSC)',
    accentColor: '#fbbf24',
  },
  {
    id: 8,
    nameTr: 'FEA Yapısal Çelik Köprü Kafesi',
    nameEn: 'FEA Structural Space Truss & Stress',
    tag: 'STRUCTURAL FEA · EN 1993 / AISC 360',
    subtitleTr: 'von Mises gerilme ısı haritası, elastik sehim ve burkulma emniyeti',
    subtitleEn: 'von Mises stress heatmap shader with elastic deflection vectors',
    icon: Activity,
    telemetryLeftTr: 'Maks. Eşdeğer Gerilme',
    telemetryLeftEn: 'Max von Mises Stress',
    telemetryLeftVal: '242.0 MPa',
    telemetryRightTr: 'Kritik Sehim (Deflection)',
    telemetryRightEn: 'Center Deflection',
    telemetryRightVal: '14.2 mm (L/550)',
    accentColor: '#f87171',
  },
  {
    id: 9,
    nameTr: 'Ağır Hizmet Hidrolik Silindir & Akışkan',
    nameEn: 'Heavy-Duty Hydraulic Cylinder Actuator',
    tag: 'FLUID POWER · ISO 6020 / DIN 24554',
    subtitleTr: '350 bar çalışma basıncı, krom piston mili ve sızdırmazlık kanalı ezilmesi',
    subtitleEn: '350 bar operating pressure, hard-chrome rod, and gland seal analysis',
    icon: Layers,
    telemetryLeftTr: 'Çalışma Basıncı (Pressure)',
    telemetryLeftEn: 'Working Pressure',
    telemetryLeftVal: '280.0 bar',
    telemetryRightTr: 'İtme Kuvveti (Push Force)',
    telemetryRightEn: 'Net Pushing Force',
    telemetryRightVal: '140.7 kN',
    accentColor: '#38bdf8',
  },
  {
    id: 10,
    nameTr: 'AeGiS Holografik Mühendislik Asistanı',
    nameEn: 'AeGiS Holographic AI Copilot Showroom',
    tag: 'AUTONOMOUS AI COPILOT · VDI 2230 / ISO',
    subtitleTr: 'Mascot AeGiS parıldayan 3D mekanik montajı sunar ve anında hesaplama yapar',
    subtitleEn: 'AeGiS mascot drone presenting interactive 3D assembly with instant math',
    icon: Bot,
    telemetryLeftTr: 'Senkronize Çözücüler',
    telemetryLeftEn: 'Solvers Synchronized',
    telemetryLeftVal: '89+ Çözücü',
    telemetryRightTr: 'Çözüm Gecikmesi (Latency)',
    telemetryRightEn: 'Math Engine Latency',
    telemetryRightVal: '0.42 ms (Deterministic)',
    accentColor: '#00e5ff',
  },
];

export function HomeConceptShowcase() {
  const { language } = useI18nStore();
  const [selectedConceptId, setSelectedConceptId] = useState(1);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [animTime, setAnimTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load persisted concept choice on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alucalc-home-concept-id');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 10) {
          setSelectedConceptId(parsed);
        }
      }
    } catch {
      // ignore SSR/storage block
    }
  }, []);

  const handleSelectConcept = (id: number) => {
    setSelectedConceptId(id);
    playMascotChirp(700 + id * 50, 'ping');
    try {
      localStorage.setItem('alucalc-home-concept-id', id.toString());
    } catch {
      // ignore
    }
  };

  const concept = HOMEPAGE_CONCEPTS.find((c) => c.id === selectedConceptId) || HOMEPAGE_CONCEPTS[0];

  // Mouse move parallax
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setRotationOffset(x * 10);
  }, []);

  // Animation ticker for dynamic gears / flows
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimTime((t) => (t + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* ═══ 1. CONCEPT SELECTOR BAR (10 CONCEPTS) ═══ */}
      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--line)]/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              {t12(language, '10 Homepage Design Concepts (Concept 3 Direction)', '10 Ana Sayfa Tasarım Konsepti (Konsept 3 Tarzı)')}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--alu-dim)]">
            {t12(
              language,
              'Click any concept to preview the full 3D homepage hero instantly:',
              'Önizlemek istediğiniz konsept numarasına tıklayın:'
            )}
          </span>
        </div>

        {/* 10 Concept Switcher Buttons */}
        <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto scrollbar-none">
          {HOMEPAGE_CONCEPTS.map((c) => {
            const isSelected = c.id === selectedConceptId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConceptId(c.id);
                  playMascotChirp(700 + c.id * 50, 'ping');
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-s)] text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-md'
                    : 'bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                }`}
                title={language === 'tr' ? c.nameTr : c.nameEn}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-[var(--bg-1)] text-[var(--cyan)]' : 'bg-[var(--bg-1)] text-[var(--alu-dim)]'
                  }`}
                >
                  {c.id}
                </span>
                <span className="hidden md:inline text-[11px]">
                  {language === 'tr' ? c.nameTr.split(' ')[0] : c.nameEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 2. THE GRAND 3D HERO STAGE (CONCEPT 3 AESTHETIC) ═══ */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-0)] overflow-hidden shadow-2xl p-5 sm:p-7 select-none group min-h-[460px] flex flex-col justify-between"
      >
        {/* Background Cybernetic Blueprint Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 30%, rgba(0, 229, 255, 0.22), transparent 70%),
              linear-gradient(to right, rgba(0, 229, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 36px 36px, 36px 36px',
          }}
        />

        {/* Ambient Dark Floor Reflection Glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--cyan)]/10 via-[var(--bg-0)]/70 to-transparent" />

        {/* Top Laser Accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent " />

        {/* ═══ HEADER TELEMETRY STRIP ═══ */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)] text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--cyan)]/40 text-[var(--cyan)] font-bold tracking-wider uppercase text-[10px]">
              KONCEPT {concept.id} · {concept.tag}
            </span>
            <span className="text-white font-bold text-xs">
              {language === 'tr' ? concept.nameTr : concept.nameEn}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px]">
              <CheckCircle2 size={11} />
              <span>DETERMINISTIC SOLVER SYNCED</span>
            </span>
            <span className="text-[10px] text-[var(--alu-dim)] font-mono">
              ALUCAD OS v5.2
            </span>
          </div>
        </div>

        {/* ═══ 3D CENTERPIECE VISUAL CANVAS ═══ */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
          
          {/* Left Telemetry Widgets */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-3 justify-between">
            <div className="flex-1 p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-lg">
              <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                {language === 'tr' ? concept.telemetryLeftTr : concept.telemetryLeftEn}
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--cyan)] tracking-tight mt-1">
                {concept.telemetryLeftVal}
              </div>
              <span className="text-[9px] font-mono text-emerald-400">
                ▲ {t12(language, 'Verified ISO / DIN', 'Doğrulanmış ISO / DIN')}
              </span>
            </div>

            <div className="flex-1 p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] shadow-lg">
              <div className="text-[10px] font-mono text-[var(--alu-dim)] uppercase tracking-wider">
                {language === 'tr' ? concept.telemetryRightTr : concept.telemetryRightEn}
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight mt-1">
                {concept.telemetryRightVal}
              </div>
              <span className="text-[9px] font-mono text-[var(--std)]">
                ● {t12(language, 'Continuous Analysis', 'Sürekli Analiz')}
              </span>
            </div>
          </div>

          {/* ═══ CENTER 3D PERSPECTIVE MODEL ═══ */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[280px]">
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `perspective(900px) rotateY(${rotationOffset}deg) rotateX(${-rotationOffset * 0.2}deg)`,
              }}
            >
              {/* RENDER SPECIFIC 3D GRAPHIC ACCORDING TO CONCEPT */}
              {concept.id === 1 && (
                /* Concept 1: Aerospace Turbofan Engine */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  <defs>
                    <linearGradient id="titaniumBlisk" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e2e8f0" />
                      <stop offset="50%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                    <radialGradient id="combustionCore" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="40%" stopColor="#0284c7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  {/* Outer Nacelle Ring */}
                  <ellipse cx="210" cy="130" rx="150" ry="110" fill="none" stroke="#334155" strokeWidth="8" />
                  <ellipse cx="210" cy="130" rx="145" ry="105" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="12 8" />
                  {/* Glowing Core */}
                  <circle cx="210" cy="130" r="55" fill="url(#combustionCore)" />
                  {/* Spinner Cone */}
                  <path d="M 210 95 Q 230 130 210 165 Q 190 130 210 95" fill="url(#titaniumBlisk)" stroke="#00e5ff" strokeWidth="1.5" />
                  {/* 16 Rotating Turbofan Blades */}
                  {[...Array(16)].map((_, i) => {
                    const angle = (i * 22.5 + animTime * 0.8) * (Math.PI / 180);
                    const x1 = 210 + Math.cos(angle) * 55;
                    const y1 = 130 + Math.sin(angle) * 45;
                    const x2 = 210 + Math.cos(angle) * 140;
                    const y2 = 130 + Math.sin(angle) * 100;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="url(#titaniumBlisk)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all"
                      />
                    );
                  })}
                  {/* Airflow Streamlines */}
                  <path d="M 20 80 Q 120 70 210 100 T 400 110" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.8" />
                  <path d="M 20 180 Q 120 190 210 160 T 400 150" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.8" />
                </svg>
              )}

              {concept.id === 2 && (
                /* Concept 2: Planetary Gearbox */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  <defs>
                    <linearGradient id="bronzeSun" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id="steelRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                  </defs>
                  {/* Outer Ring Gear */}
                  <circle cx="210" cy="130" r="105" fill="none" stroke="url(#steelRing)" strokeWidth="16" />
                  <circle cx="210" cy="130" r="95" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Central Sun Gear */}
                  <g transform={`rotate(${animTime * 1.5} 210 130)`}>
                    <circle cx="210" cy="130" r="32" fill="url(#bronzeSun)" stroke="#fbbf24" strokeWidth="2" />
                    {[...Array(10)].map((_, i) => (
                      <rect
                        key={i}
                        x="207"
                        y="94"
                        width="6"
                        height="8"
                        rx="1"
                        fill="#fbbf24"
                        transform={`rotate(${i * 36} 210 130)`}
                      />
                    ))}
                  </g>
                  {/* 3 Planetary Gears */}
                  {[0, 120, 240].map((baseAngle, idx) => {
                    const orbitAngle = (baseAngle + animTime * 0.5) * (Math.PI / 180);
                    const px = 210 + Math.cos(orbitAngle) * 62;
                    const py = 130 + Math.sin(orbitAngle) * 62;
                    return (
                      <g key={idx} transform={`rotate(${-animTime * 1.5} ${px} ${py})`}>
                        <circle cx={px} cy={py} r="28" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
                        <circle cx={px} cy={py} r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                        {[...Array(8)].map((_, j) => (
                          <rect
                            key={j}
                            x={px - 2.5}
                            y={py - 31}
                            width="5"
                            height="6"
                            rx="1"
                            fill="#38bdf8"
                            transform={`rotate(${j * 45} ${px} ${py})`}
                          />
                        ))}
                      </g>
                    );
                  })}
                  {/* Contact Stress Glow */}
                  <circle cx="210" cy="98" r="8" fill="#ef4444" opacity="0.75" filter="blur(2px)" />
                  <circle cx="210" cy="98" r="3" fill="#ffffff" />
                </svg>
              )}

              {concept.id === 3 && (
                /* Concept 3: Infinite 3D CAD Canvas */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Isometric B-Rep Solid Block */}
                  <g transform="translate(140, 50)">
                    {/* Top Face */}
                    <polygon points="70,20 170,20 130,70 30,70" fill="#1e293b" stroke="#818cf8" strokeWidth="2" />
                    {/* Front Face */}
                    <polygon points="30,70 130,70 130,150 30,150" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
                    {/* Right Face */}
                    <polygon points="130,70 170,20 170,100 130,150" fill="#334155" stroke="#818cf8" strokeWidth="2" />
                    {/* Hole in Top Face */}
                    <ellipse cx="100" cy="45" rx="20" ry="10" fill="#090d16" stroke="#00e5ff" strokeWidth="1.5" />
                    {/* Dimension Lines (ISO 128) */}
                    <line x1="30" y1="165" x2="130" y2="165" stroke="#00e5ff" strokeWidth="1.2" />
                    <line x1="30" y1="160" x2="30" y2="170" stroke="#00e5ff" strokeWidth="1.2" />
                    <line x1="130" y1="160" x2="130" y2="170" stroke="#00e5ff" strokeWidth="1.2" />
                    <text x="70" y="180" fill="#00e5ff" fontSize="10" fontFamily="monospace">100.00 mm</text>
                  </g>
                  {/* Origin Triad */}
                  <g transform="translate(50, 190)">
                    <line x1="0" y1="0" x2="35" y2="0" stroke="#ef4444" strokeWidth="2" />
                    <text x="38" y="4" fill="#ef4444" fontSize="9" fontFamily="monospace">X</text>
                    <line x1="0" y1="0" x2="0" y2="-30" stroke="#22c55e" strokeWidth="2" />
                    <text x="-3" y="-33" fill="#22c55e" fontSize="9" fontFamily="monospace">Y</text>
                    <line x1="0" y1="0" x2="-20" y2="20" stroke="#00e5ff" strokeWidth="2" />
                    <text x="-28" y="24" fill="#00e5ff" fontSize="9" fontFamily="monospace">Z</text>
                  </g>
                </svg>
              )}

              {concept.id === 4 && (
                /* Concept 4: Hypercar Aerodynamics */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Aerodynamic Streamlines */}
                  <path d="M 10 90 Q 140 50 250 110 T 410 130" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="8 6" opacity="0.9" />
                  <path d="M 10 110 Q 150 70 260 125 T 410 145" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />
                  <path d="M 10 170 Q 140 180 260 165 T 410 160" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
                  {/* Supercar Silhouette (Side Profile) */}
                  <path
                    d="M 60 160 Q 90 155 120 140 Q 160 100 230 100 Q 300 100 340 140 Q 370 150 380 160 L 50 160"
                    fill="#0f172a"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                  />
                  {/* Wheels */}
                  <circle cx="120" cy="165" r="22" fill="#1e293b" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="120" cy="165" r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="320" cy="165" r="22" fill="#1e293b" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="320" cy="165" r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
                  {/* Rear Wing / Spoiler */}
                  <line x1="360" y1="135" x2="385" y2="130" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
                  <line x1="375" y1="135" x2="375" y2="150" stroke="#2dd4bf" strokeWidth="2" />
                </svg>
              )}

              {concept.id === 5 && (
                /* Concept 5: Bionic Robotic Hand */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Palm Chassis */}
                  <polygon points="170,120 250,120 260,190 160,190" fill="#1e293b" stroke="#a78bfa" strokeWidth="2" />
                  {/* Wrist Mount */}
                  <rect x="180" y="195" width="60" height="30" rx="4" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.5" />
                  {/* Thumb */}
                  <line x1="170" y1="150" x2="130" y2="130" stroke="#a78bfa" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="130" cy="130" r="5" fill="#38bdf8" />
                  <line x1="130" y1="130" x2="105" y2="110" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" />
                  {/* 4 Articulated Fingers */}
                  {[185, 205, 225, 245].map((x, i) => {
                    const len = i === 1 ? 45 : i === 2 ? 42 : 36;
                    return (
                      <g key={i}>
                        <line x1={x} y1="120" x2={x} y2={120 - len} stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" />
                        <circle cx={x} cy={120 - len} r="4" fill="#38bdf8" />
                        <line x1={x} y1={120 - len} x2={x - 2} y2={120 - len - 25} stroke="#a78bfa" strokeWidth="5" strokeLinecap="round" />
                        <circle cx={x - 2} cy={120 - len - 25} r="3" fill="#ffffff" />
                      </g>
                    );
                  })}
                </svg>
              )}

              {concept.id === 6 && (
                /* Concept 6: 5-Axis CNC Spindle */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Spindle Body */}
                  <rect x="180" y="30" width="60" height="90" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
                  <rect x="195" y="120" width="30" height="30" fill="#334155" stroke="#34d399" strokeWidth="1.5" />
                  {/* Endmill Tool */}
                  <rect x="206" y="150" width="8" height="40" fill="#94a3b8" stroke="#34d399" strokeWidth="1.5" />
                  {/* Workpiece */}
                  <rect x="130" y="190" width="160" height="45" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                  {/* Spiral Toolpath Laser Lines */}
                  <ellipse cx="210" cy="190" rx="45" ry="12" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 3" />
                  <ellipse cx="210" cy="190" rx="30" ry="8" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
                  {/* Machining Sparks */}
                  <circle cx="210" cy="190" r="5" fill="#f59e0b" className="animate-ping" />
                  <circle cx="210" cy="190" r="2.5" fill="#ffffff" />
                </svg>
              )}

              {concept.id === 7 && (
                /* Concept 7: Swiss Tourbillon Movement */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Outer Movement Ring with Geneva Stripes */}
                  <circle cx="210" cy="130" r="105" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
                  <line x1="120" y1="130" x2="300" y2="130" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Tourbillon Rotating Cage */}
                  <g transform={`rotate(${animTime * 2} 210 130)`}>
                    <circle cx="210" cy="130" r="48" fill="none" stroke="#fbbf24" strokeWidth="2" />
                    {/* Balance Spring Spiral */}
                    <path
                      d="M 210 130 Q 215 125 220 130 T 225 135 T 230 130 T 235 125"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    {/* Ruby Jewels */}
                    <circle cx="210" cy="85" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="210" cy="175" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="165" cy="130" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="255" cy="130" r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                  </g>
                  <circle cx="210" cy="130" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              )}

              {concept.id === 8 && (
                /* Concept 8: Structural FEA Space Truss */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  <defs>
                    <linearGradient id="feaStressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="35%" stopColor="#22c55e" />
                      <stop offset="70%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* Top Chord (Compression) */}
                  <line x1="60" y1="80" x2="360" y2="80" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
                  {/* Bottom Chord (Tension) */}
                  <line x1="30" y1="180" x2="390" y2="180" stroke="url(#feaStressGrad)" strokeWidth="8" strokeLinecap="round" />
                  {/* Web Diagonals */}
                  <line x1="30" y1="180" x2="90" y2="80" stroke="#22c55e" strokeWidth="4" />
                  <line x1="90" y1="80" x2="150" y2="180" stroke="#f59e0b" strokeWidth="4" />
                  <line x1="150" y1="180" x2="210" y2="80" stroke="#ef4444" strokeWidth="5" />
                  <line x1="210" y1="80" x2="270" y2="180" stroke="#ef4444" strokeWidth="5" />
                  <line x1="270" y1="180" x2="330" y2="80" stroke="#f59e0b" strokeWidth="4" />
                  <line x1="330" y1="80" x2="390" y2="180" stroke="#22c55e" strokeWidth="4" />
                  {/* Gusset Plate Pins */}
                  {[30, 90, 150, 210, 270, 330, 390].map((x, i) => (
                    <circle key={i} cx={x} cy={i % 2 === 0 ? 180 : 80} r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  ))}
                  {/* Deflection Load Arrow */}
                  <path d="M 210 40 L 210 70 M 205 62 L 210 70 L 215 62" stroke="#ef4444" strokeWidth="2.5" />
                  <text x="220" y="55" fill="#ef4444" fontSize="10" fontFamily="monospace">F = 250 kN</text>
                </svg>
              )}

              {concept.id === 9 && (
                /* Concept 9: Hydraulic Cylinder */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Cylinder Barrel Tube */}
                  <rect x="50" y="100" width="220" height="60" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                  {/* Hydraulic Fluid Chamber (Blue Pressure) */}
                  <rect x="52" y="102" width="130" height="56" fill="#0284c7" opacity="0.3" />
                  {/* Piston Head */}
                  <rect x="180" y="102" width="24" height="56" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Chrome Piston Rod */}
                  <rect x="204" y="115" width="160" height="30" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="2" />
                  {/* Rod Eye Clevis */}
                  <circle cx="375" cy="130" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="375" cy="130" r="7" fill="#090d16" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Ports */}
                  <rect x="70" y="85" width="16" height="15" fill="#38bdf8" />
                  <rect x="235" y="85" width="16" height="15" fill="#38bdf8" />
                </svg>
              )}

              {concept.id === 10 && (
                /* Concept 10: AeGiS Mascot Floating Presentation */
                <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl overflow-visible">
                  {/* Holographic Platform */}
                  <ellipse cx="210" cy="210" rx="140" ry="25" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="6 4" />
                  <ellipse cx="210" cy="210" rx="100" ry="18" fill="rgba(0,229,255,0.08)" />
                  {/* Floating Holographic Gear */}
                  <g transform={`rotate(${animTime} 210 90)`}>
                    <circle cx="210" cy="90" r="40" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="8 6" opacity="0.8" />
                    <circle cx="210" cy="90" r="12" fill="#00e5ff" opacity="0.5" />
                  </g>
                  {/* Floating AeGiS Mascot Drone */}
                  <g transform="translate(180, 120)">
                    {/* Head / Helmet */}
                    <rect x="10" y="15" width="40" height="32" rx="12" fill="#f8fafc" stroke="#00e5ff" strokeWidth="2" />
                    {/* Blue Visor */}
                    <rect x="15" y="22" width="30" height="16" rx="6" fill="#06121e" />
                    {/* Glowing Smiling Eyes */}
                    <path d="M 20 30 Q 24 26 28 30" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 32 30 Q 36 26 40 30" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
                    {/* Body */}
                    <rect x="16" y="50" width="28" height="22" rx="6" fill="#e2e8f0" stroke="#00e5ff" strokeWidth="1.5" />
                    {/* Thruster Glow */}
                    <ellipse cx="30" cy="74" rx="8" ry="4" fill="#00e5ff" className="animate-pulse" />
                  </g>
                </svg>
              )}
            </div>
          </div>

          {/* Right Concept Explainer & Actions */}
          <div className="lg:col-span-3 space-y-3">
            <div className="p-3.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)]">
              <span className="text-[10px] font-mono text-[var(--cyan)] uppercase tracking-wider font-bold">
                {t12(language, 'CONCEPT HIGHLIGHT', 'KONSEPT VURGUSU')}
              </span>
              <p className="text-xs text-[var(--ink)] leading-relaxed mt-1 font-sans">
                {language === 'tr' ? concept.subtitleTr : concept.subtitleEn}
              </p>
            </div>

            <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Design Rating', 'Tasarım Notu')}</span>
              <span className="text-[var(--cyan)] font-bold">★★★★★ (10/10)</span>
            </div>

            <Link
              href="/calculators"
              className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-tech font-bold text-xs tracking-wide transition-all "
            >
              <span>{t12(language, 'Launch Engineering Solvers', 'Mühendislik Çözücülerini Başlat')}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ═══ FOOTER BANNER ═══ */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--line)] text-[11px] font-mono text-[var(--alu-dim)]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
            <span>
              {t12(
                language,
                'Full responsive 3D viewport · ISO/DIN/VDI verified equations · Zero accumulation drift',
                'Tam duyarlı 3D görünüm alanı · ISO/DIN/VDI onaylı denklemler · Sıfır hesaplama sapması'
              )}
            </span>
          </div>

          <span className="text-white font-bold">
            {t12(language, `Active Concept: #${concept.id} ${concept.nameEn}`, `Aktif Konsept: #${concept.id} ${concept.nameTr}`)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default HomeConceptShowcase;

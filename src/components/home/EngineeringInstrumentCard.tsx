'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  Box,
  Activity,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { APP_MAJOR_MINOR } from '@/config/app';

interface InstrumentPreset {
  id: string;
  badge: string;
  standard: string;
  titleTr: string;
  titleEn: string;
  formula: string;
  outputLabelTr: string;
  outputLabelEn: string;
  outputValue: string;
  statusTextTr: string;
  statusTextEn: string;
  href: string;
  btnTextTr: string;
  btnTextEn: string;
}

const PRESETS: InstrumentPreset[] = [
  {
    id: 'fea',
    badge: '3D FEA & B-REP',
    standard: 'EN 1993 · OpenCASCADE',
    titleTr: 'Gerçek Zamanlı Von Mises Gerilme Analizi',
    titleEn: 'Real-Time Von Mises Stress Field',
    formula: 'σ_v = √(σ² + 3τ²) ≤ f_y / γ_M0',
    outputLabelTr: 'Maksimum Eşdeğer Gerilme (σ_max):',
    outputLabelEn: 'Peak Equivalent Stress (σ_max):',
    outputValue: '124.8 MPa (Sf = 2.21 · SAFE)',
    statusTextTr: '6061-T6 Alüminyum gövdede elastik gerilme güvenli bölgede.',
    statusTextEn: 'Elastic stress within safe margin for 6061-T6 Aluminum alloy.',
    href: '/design-studio',
    btnTextTr: '3D Stüdyoda Simüle Et',
    btnTextEn: 'Simulate in 3D Studio',
  },
  {
    id: 'bolt',
    badge: 'BOLT PRELOAD',
    standard: 'VDI 2230 BLATT 1',
    titleTr: 'Cıvata Sıkma Torku ve Ön Yük Hesabı',
    titleEn: 'Bolt Tightening Torque & Preload',
    formula: 'F_M = M_A / [d · (0.16·P + μ_ges·d_2)]',
    outputLabelTr: 'Gerekli Sıkma Torku (M_A):',
    outputLabelEn: 'Required Tightening Torque (M_A):',
    outputValue: '48.5 Nm (S_F = 1.35 · ISO 898-1)',
    statusTextTr: 'Metrik M10 8.8 cıvata montajında akma emniyeti sağlandı.',
    statusTextEn: 'Proof yield margin verified for Metric M10 Grade 8.8 fastener.',
    href: '/bolt-torque',
    btnTextTr: 'VDI 2230 Çözücüyü Aç',
    btnTextEn: 'Open VDI 2230 Solver',
  },
  {
    id: 'bearing',
    badge: 'BEARING LIFE',
    standard: 'ISO 281:2007',
    titleTr: 'Rulman Yorulma Ömrü (L10h)',
    titleEn: 'Rolling Bearing Rating Life (L10h)',
    formula: 'L_10h = (10⁶ / 60·n) · (C / P)ᵖ',
    outputLabelTr: 'Temel Nominal Çalışma Ömrü:',
    outputLabelEn: 'Basic Rating Operating Life:',
    outputValue: '28,450 Saat (Saatlik Güvenilirlik %90)',
    statusTextTr: 'SKF 6208 derin kanallı bilyalı rulman için doğrulanmıştır.',
    statusTextEn: 'Verified for SKF 6208 deep groove ball bearing under 4.2 kN load.',
    href: '/bearings',
    btnTextTr: 'ISO 281 Rulman Çözücü',
    btnTextEn: 'ISO 281 Bearing Solver',
  },
  {
    id: 'gear',
    badge: 'GEAR RATING',
    standard: 'ISO 6336-1/2',
    titleTr: 'Dişli Temas ve Diş Dibi Mukavemeti',
    titleEn: 'Gear Surface Pitting & Root Bending',
    formula: 'σ_H = Z_H·Z_E·Z_ε · √(F_t / (d₁·b)) ≤ σ_HP',
    outputLabelTr: 'Yüzey Ezilme Gerilmesi (σ_H):',
    outputLabelEn: 'Hertzian Contact Stress (σ_H):',
    outputValue: '482.0 MPa (S_H = 1.42 · OK)',
    statusTextTr: 'Modül m=2.5, 20° kavrama açılı helis dişli çifti doğrulaması.',
    statusTextEn: 'Module 2.5, 20° pressure angle helical gear pair verified.',
    href: '/gears',
    btnTextTr: 'ISO 6336 Dişli Çözücü',
    btnTextEn: 'ISO 6336 Gear Solver',
  },
];

export function EngineeringInstrumentCard() {
  const { language } = useI18nStore();
  const [activeId, setActiveId] = useState<string>('fea');

  const preset = PRESETS.find((p) => p.id === activeId) || PRESETS[0];

  return (
    <div className="relative w-full lg:w-[420px] xl:w-[460px] shrink-0 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-5 flex flex-col justify-between min-h-[420px] select-none shadow-xl font-mono text-[11px]">
      {/* Subtle Grid Accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 rounded-[var(--radius-m)]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 229, 255, 0.4) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[var(--ok)]" />
          <span className="font-bold text-[var(--ink)] tracking-wider text-[11px]">
            {t12(language, 'ALUCALC INSTRUMENT READOUT', 'ALUCALC GÖSTERGE PANELİ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[var(--cyan)] border border-[var(--cyan)]/30 rounded px-1.5 py-0.5 bg-[var(--bg-0)]">
          <Cpu size={10} />
          <span>64-BIT PRECISION</span>
        </div>
      </div>

      {/* Preset Selector Chips */}
      <div className="relative z-10 grid grid-cols-4 gap-1 pt-3">
        {PRESETS.map((p) => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`py-1.5 px-2 rounded-[var(--radius-s)] text-[10px] font-bold text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--cyan)] text-[var(--bg-0)] shadow-sm'
                  : 'bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-3)]'
              }`}
            >
              {p.badge}
            </button>
          );
        })}
      </div>

      {/* Instrument Display Body */}
      <div className="relative z-10 my-3 p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--cyan)] font-bold">{preset.standard}</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
            <CheckCircle2 size={11} />
            {t12(language, 'DETERMINISTIC VERIFIED', 'DETERMİNİSTİK DOĞRULANDI')}
          </span>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold font-sans">
            {language === 'tr' ? preset.titleTr : preset.titleEn}
          </h4>
          <div className="mt-1.5 p-2 rounded bg-[var(--bg-1)] border border-[var(--line)] text-[var(--alu)] text-[10px] tracking-wide font-mono">
            <code>{preset.formula}</code>
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-[var(--line)]/60">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--alu-dim)]">
              {language === 'tr' ? preset.outputLabelTr : preset.outputLabelEn}
            </span>
            <strong className="text-white text-xs font-bold text-right">
              {preset.outputValue}
            </strong>
          </div>
          <p className="text-[9px] text-[var(--alu-dim)] leading-relaxed pt-1">
            {language === 'tr' ? preset.statusTextTr : preset.statusTextEn}
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="relative z-10 pt-2 border-t border-[var(--line)] flex items-center justify-between">
        <span className="text-[9px] text-[var(--alu-dim)]">
          {t12(language, `Active Kernel v${APP_MAJOR_MINOR}`, `Aktif Çekirdek v${APP_MAJOR_MINOR}`)}
        </span>
        <Link
          href={preset.href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] text-[var(--cyan)] font-bold text-[10px] transition-all border border-[var(--cyan)]/30 hover:border-[var(--cyan)] cursor-pointer"
        >
          <span>{language === 'tr' ? preset.btnTextTr : preset.btnTextEn}</span>
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

export default EngineeringInstrumentCard;

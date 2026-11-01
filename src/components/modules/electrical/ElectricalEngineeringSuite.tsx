'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Zap, Cable, Radio, Binary, Sliders, ShieldCheck } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// Lazy load child modules to maintain bundle isolation
const ThreePhasePowerModule = dynamic(() => import('@/components/modules/electrical/ThreePhasePowerModule'), {
  loading: () => <SuiteTabLoading label="3-Phase AC Power" />
});
const VoltageDropModule = dynamic(() => import('@/components/modules/electrical/VoltageDropModule'), {
  loading: () => <SuiteTabLoading label="Voltage Drop & Cable Sizing" />
});
const OhmsLawModule = dynamic(() => import('@/components/modules/electrical/OhmsLawModule'), {
  loading: () => <SuiteTabLoading label="Ohm's Law & Circuit Fundamentals" />
});
const FilterDesignModule = dynamic(() => import('@/components/modules/electronics/FilterDesignModule'), {
  loading: () => <SuiteTabLoading label="Filter Design" />
});
const DigitalLogicModule = dynamic(() => import('@/modules/automation/DigitalLogic'), {
  loading: () => <SuiteTabLoading label="Digital Logic Simulator" />
});

function SuiteTabLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[600px] text-slate-400">
      <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p className="text-xs font-mono uppercase tracking-widest">{label} Loading...</p>
    </div>
  );
}

export type ElectricalTab = 'three-phase' | 'voltage-drop' | 'ohms-law' | 'filter-design' | 'digital-logic';

export interface ElectricalEngineeringSuiteProps {
  initialTab?: ElectricalTab;
}

export default function ElectricalEngineeringSuite({ initialTab = 'three-phase' }: ElectricalEngineeringSuiteProps) {
  const { language } = useI18nStore();
  const [activeTab, setActiveTab] = useState<ElectricalTab>(initialTab);

  const tabs: { id: ElectricalTab; labelEn: string; labelTr: string; icon: any; standard: string; color: string }[] = [
    {
      id: 'three-phase',
      labelEn: '3-Phase AC Power & Phasors',
      labelTr: '3-Faz Güç & Fazör Analizi',
      icon: Zap,
      standard: 'IEC 60034',
      color: '#f59e0b',
    },
    {
      id: 'voltage-drop',
      labelEn: 'Voltage Drop & Cable Sizing',
      labelTr: 'Gerilim Düşümü & Kablo Kesiti',
      icon: Cable,
      standard: 'IEC 60287 / 60364',
      color: '#06b6d4',
    },
    {
      id: 'ohms-law',
      labelEn: "Ohm's Law & Circuit Solver",
      labelTr: 'Ohm Kanunu & Devre Çözücü',
      icon: Sliders,
      standard: 'DC / AC Fundamentals',
      color: '#eab308',
    },
    {
      id: 'filter-design',
      labelEn: 'Analog Filter Design (RC/RLC)',
      labelTr: 'Analog Filtre & Bode Analizi',
      icon: Radio,
      standard: 'Signal Processing',
      color: '#8b5cf6',
    },
    {
      id: 'digital-logic',
      labelEn: 'Digital Logic Simulator',
      labelTr: 'Dijital Mantık Simülatörü',
      icon: Binary,
      standard: 'IEEE 91 / Boolean',
      color: '#10b981',
    },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-[var(--bg-0)] text-white overflow-hidden">
      {/* Top Suite Bar */}
      <header className="flex-none px-4 py-2.5 bg-[var(--bg-0)] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
            <Zap size={16} />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {t12(language, 'Electrical & Electronics Suite', 'Elektrik & Elektronik Mühendisliği Paketi')}
            </h1>
            <p className="text-[9px] text-amber-500/70 font-mono tracking-widest">
              {t12(language, 'IEC 60364 / IEC 60287 / IEEE 91 DETERMINISTIC SUITE', 'IEC 60364 / IEC 60287 / IEEE 91 DETERMINİSTİK ÇÖZÜCÜ')}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 gap-1 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={isActive ? { borderLeftColor: tab.color, borderLeftWidth: 3 } : undefined}
              >
                <Icon size={14} style={{ color: isActive ? tab.color : undefined }} />
                <span>{language === 'tr' ? tab.labelTr : tab.labelEn}</span>
                <span className="hidden md:inline-block text-[9px] font-mono opacity-50 px-1 py-0.5 rounded bg-black/40">
                  {tab.standard}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Active Tab Content Frame */}
      <div className="flex-1 w-full h-[calc(100%-53px)] overflow-hidden relative">
        {activeTab === 'three-phase' && <ThreePhasePowerModule />}
        {activeTab === 'voltage-drop' && <VoltageDropModule />}
        {activeTab === 'ohms-law' && <OhmsLawModule />}
        {activeTab === 'filter-design' && <FilterDesignModule />}
        {activeTab === 'digital-logic' && <DigitalLogicModule />}
      </div>
    </div>
  );
}

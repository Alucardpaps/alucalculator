'use client';

import Link from 'next/link';
import {
  Zap, Layers, ShieldCheck, ChevronRight, Cpu, Wrench, Droplets,
  ArrowRight, Calculator, Settings, CircleDot, Ruler, FlaskConical,
  CheckCircle2, BookOpen, GraduationCap, Globe, Download, Play,} from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18nStore } from '@/store/i18nStore';
import { UI_TRANSLATIONS } from '@/locales/uiTranslations';

const COLOR_MAP: Record<string, string> = {
  cyan: 'border-cyan-500/20 hover:border-cyan-400/50 text-cyan-400',
  indigo: 'border-indigo-500/20 hover:border-indigo-400/50 text-indigo-400',
  blue: 'border-blue-500/20 hover:border-blue-400/50 text-blue-400',
  yellow: 'border-yellow-500/20 hover:border-yellow-400/50 text-yellow-400',
  purple: 'border-purple-500/20 hover:border-purple-400/50 text-purple-400',
  orange: 'border-orange-500/20 hover:border-orange-400/50 text-orange-400',
  emerald: 'border-emerald-500/20 hover:border-emerald-400/50 text-emerald-400',
};

const CAT_COLOR_MAP: Record<string, { icon: string; dot: string }> = {
  cyan: { icon: 'text-cyan-400', dot: 'bg-cyan-400' },
  indigo: { icon: 'text-indigo-400', dot: 'bg-indigo-400' },
  blue: { icon: 'text-blue-400', dot: 'bg-blue-400' },
  yellow: { icon: 'text-yellow-400', dot: 'bg-yellow-400' },
  purple: { icon: 'text-purple-400', dot: 'bg-purple-400' },
};

const CALCULATOR_LABEL_MAP: Record<string, Record<string, string>> = {
  'bolt-torque': { en: 'Bolt Torque', tr: 'Cıvata Tork' },
  'bearings': { en: 'Bearing Life (ISO 281)', tr: 'Rulman Ömrü (ISO 281)' },
  'shafts': { en: 'Shaft Diameter', tr: 'Mil Çapı' },
  'gears': { en: 'Gear Ratio', tr: 'Dişli Oranı' },
  'motor-selection-std': { en: 'Motor Power', tr: 'Motor Gücü' },
  'hooke-law': { en: 'Spring Constant', tr: 'Yay Sabiti (Hooke)' },
  'beam-deflection': { en: 'Beam Deflection', tr: 'Kiriş Sehimi' },
  'concrete-reinforcement': { en: 'Concrete Reinforcement', tr: 'Betonarme Donatı' },
  'topology-optimization': { en: 'Topology Optimization', tr: 'Topoloji Optimizasyonu' },
  'machine-assembly': { en: 'Machine Assembly', tr: 'Makine Montajı' },
  'simulation-fea': { en: 'FEA Analysis', tr: 'FEA Analizi' },
  'fluid-dynamics': { en: 'Pressure Drop', tr: 'Basınç Düşümü' },
  'thermal-expansion': { en: 'Heat Transfer', tr: 'Isı Transferi' },
  'pumps': { en: 'Pump Performance', tr: 'Pompa Performansı' },
  'reducer-lubrication': { en: 'Gearbox Lubrication', tr: 'Redüktör Yağlama' },
  'naval-hydrostatics': { en: 'Naval Hydrostatics', tr: 'Gemi Hidrostatiği' },
  'three-phase-power': { en: '3-Phase Power', tr: '3 Faz Güç' },
  'ohms-law': { en: "Ohm's Law", tr: 'Ohm Kanunu' },
  'voltage-drop': { en: 'Voltage Drop', tr: 'Gerilim Düşümü' },
  'transformer-calculation': { en: 'Transformer Calculation', tr: 'Trafo Hesabı' },
  'filter-design': { en: 'Filter Design', tr: 'Filtre Tasarımı' },
  'physics-solver': { en: 'Physics CAS Solver', tr: 'Fizik Çözücü' },
  'failure-prediction': { en: 'Failure Prediction', tr: 'Arıza Tahmini' },
  'failure-diagnosis': { en: 'Failure Diagnosis', tr: 'Arıza Teşhisi' },
  'biology-genetics': { en: 'Population Genetics', tr: 'Popülasyon Genetiği' },
  'digital-logic': { en: 'Digital Logic Lab', tr: 'Dijital Mantık Laboratuvarı' },
};

const POPULAR_CALCULATORS = [
  { key: 'boltTorque', slug: 'bolt-torque', icon: Wrench, color: 'orange' },
  { key: 'bearingLife', slug: 'bearings', icon: CircleDot, color: 'cyan' },
  { key: 'beamDeflection', slug: 'beam-deflection', icon: Ruler, color: 'indigo' },
  { key: 'shaftDiameter', slug: 'shafts', icon: Settings, color: 'emerald' },
  { key: 'gearRatio', slug: 'gears', icon: Settings, color: 'purple' },
  { key: 'electricalPower', slug: 'three-phase-power', icon: Zap, color: 'yellow' },
] as const;

const CATEGORY_DEFS = [
  { id: 'mech', color: 'cyan', icon: Settings, links: ['bolt-torque', 'bearings', 'shafts', 'gears', 'motor-selection-std', 'hooke-law'] },
  { id: 'struct', color: 'indigo', icon: Layers, links: ['beam-deflection', 'concrete-reinforcement', 'topology-optimization', 'machine-assembly', 'simulation-fea'] },
  { id: 'fluid', color: 'blue', icon: Droplets, links: ['fluid-dynamics', 'thermal-expansion', 'pumps', 'reducer-lubrication', 'naval-hydrostatics'] },
  { id: 'elec', color: 'yellow', icon: Zap, links: ['three-phase-power', 'ohms-law', 'voltage-drop', 'transformer-calculation', 'filter-design'] },
  { id: 'science', color: 'purple', icon: FlaskConical, links: ['physics-solver', 'failure-prediction', 'failure-diagnosis', 'biology-genetics', 'digital-logic'] },
] as const;

function getCalculatorWorkspaceUrl(slug: string): string {
  return slug.startsWith('/') ? slug : `/${slug}`;
}

function getCalculatorLabel(slug: string, language: string): string {
  const item = CALCULATOR_LABEL_MAP[slug];
  if (!item) return slug.replace(/-/g, ' ');
  return item[language] || item['en'] || slug.replace(/-/g, ' ');
}

const WHY_ITEMS = [
  { icon: ShieldCheck, titleKey: 'why1Title', descKey: 'why1Desc' },
  { icon: Cpu, titleKey: 'why2Title', descKey: 'why2Desc' },
  { icon: Globe, titleKey: 'why3Title', descKey: 'why3Desc' },
] as const;

interface HomePageContentProps {
  recentCalculators: Array<{ slug: string; category?: string; title?: string; id?: string }>;
}

export function HomePageContent({ recentCalculators }: HomePageContentProps) {
  const router = useRouter();
  const { language } = useI18nStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.location.search.includes('mode=app') || 
                           window.location.search.includes('utm_source=app');
      if (isStandalone) {
        router.push('/workspace');
      }
    }
  }, [router]);

  const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  const popularTitle = (key: string) => ui[`${key}Title`] as string;
  const popularDesc = (key: string) => ui[`${key}Desc`] as string;

  return (
    <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
      <header className="text-center max-w-5xl mx-auto pt-32 md:pt-44 pb-24 md:pb-32">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-10 border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
          <span className="text-[9px] font-black text-blue-400 tracking-[0.4em] uppercase">{ui.activeSolvers}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-10 text-white">
          {ui.heroTitle}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-500">
            {ui.heroTitleHighlight}
          </span>
          <span className="block text-2xl sm:text-3xl md:text-4xl mt-4 text-slate-400 font-bold">{ui.heroSubTitle}</span>
        </h1>

        <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto mb-10 px-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-start gap-4 text-left w-full">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-base text-slate-300">
                <span className="font-bold text-white">{ui[`prop${n}Title`]}</span>
                {ui[`prop${n}Text`]}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {['ISO 281', 'VDI 2230', 'ASME', 'ANSI', 'DIN'].map((std) => (
            <div key={std} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-blue-400" />
              <span className="text-[10px] font-black text-blue-300 tracking-widest uppercase">{std}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-8">
          <Link
            href="/workspace"
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center gap-3"
          >
            <Calculator size={16} /> {ui.launchWorkspace} <ArrowRight size={16} />
          </Link>
          <Link href="/academy" className="px-10 py-5 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-300 font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all backdrop-blur-md flex items-center gap-3">
            <GraduationCap size={16} /> {ui.exploreAcademy}
          </Link>
        </div>

        {/* Mobile Download Section */}
        <div className="mt-8 mb-16 flex flex-col items-center justify-center gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
            {ui.downloadTitle}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://play.google.com/store/apps/details?id=com.alucard.alucalcos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4 bg-white/[0.02] hover:bg-[#00e5ff]/5 border border-white/10 hover:border-[#00e5ff]/40 rounded-2xl text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md active:scale-95 shadow-lg hover:shadow-[0_0_25px_rgba(0,229,255,0.15)] group"
            >
              <Play size={14} className="text-[#00e5ff] fill-[#00e5ff] group-hover:scale-110 transition-transform" />
              <span>{ui.googlePlay}</span>
            </a>
            <a
              href="/app/alucalc-release.apk"
              download
              className="inline-flex items-center gap-2.5 px-6 py-4 bg-white/[0.02] hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-400/40 rounded-2xl text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md active:scale-95 shadow-lg hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group"
            >
              <Download size={14} className="text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
              <span>{ui.downloadApk}</span>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest self-center mr-2">
            <BookOpen size={12} className="inline mb-0.5" /> {ui.masterGuides}
          </span>
          <Link href="/academy/how-to-calculate-bolt-torque" className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-full px-4 py-1.5 hover:bg-blue-500/10 transition-all">{popularTitle('boltTorque')}</Link>
          <Link href="/academy/bearing-life-calculation-explained" className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 rounded-full px-4 py-1.5 hover:bg-cyan-500/10 transition-all">{popularTitle('bearingLife')}</Link>
          <Link href="/academy/beam-deflection-formula-explained" className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1.5 hover:bg-indigo-500/10 transition-all">{popularTitle('beamDeflection')}</Link>
          <Link href="/academy/pressure-drop-calculation-guide" className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-full px-4 py-1.5 hover:bg-blue-500/10 transition-all">{ui.domains.fluid}</Link>
          <Link href="/academy/motor-power-calculation" className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/20 rounded-full px-4 py-1.5 hover:bg-orange-500/10 transition-all">Motor Power</Link>
        </div>
      </header>

      <section className="pb-32" aria-labelledby="popular-heading">
        <div className="flex items-center gap-6 mb-12">
          <h2 id="popular-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">{ui.popularCalcs}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_CALCULATORS.map((calc) => {
            const Icon = calc.icon;
            const colorClass = COLOR_MAP[calc.color] || COLOR_MAP.cyan;
            return (
              <Link
                key={calc.slug}
                href={getCalculatorWorkspaceUrl(calc.slug)}
                className={`group relative block p-8 rounded-3xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden ${colorClass}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#05080f] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Icon size={22} />
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{popularTitle(calc.key)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{popularDesc(calc.key)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pb-32" aria-labelledby="categories-heading">
        <div className="flex items-center gap-6 mb-12">
          <h2 id="categories-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">{ui.calculatorCategories}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CATEGORY_DEFS.map((cat) => {
            const Icon = cat.icon;
            const colors = CAT_COLOR_MAP[cat.color] || { icon: 'text-slate-400', dot: 'bg-slate-500' };
            return (
              <div key={cat.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={18} className={colors.icon} />
                  <h3 className="text-sm font-bold text-white">{ui.domains[cat.id]}</h3>
                </div>
                <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">{ui.domains[`${cat.id}Desc`]}</p>
                <ul className="space-y-2.5">
                  {cat.links.map((slug) => (
                    <li key={slug}>
                      <Link href={getCalculatorWorkspaceUrl(slug)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                        <span className={`w-1 h-1 rounded-full ${colors.dot} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        {getCalculatorLabel(slug, language)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-32" aria-labelledby="recent-heading">
        <div className="flex items-center gap-6 mb-4">
          <h2 id="recent-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">{ui.recentlyAdded}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
        </div>
        <p className="text-sm text-slate-500 mb-8 max-w-2xl">{ui.recentlyAddedDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentCalculators.map((calc) => (
            <Link
              key={calc.slug}
              href={getCalculatorWorkspaceUrl(calc.slug)}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-blue-500/20 transition-all"
            >
              <span className="text-[9px] font-bold text-blue-500/40 uppercase tracking-widest">{calc.category}</span>
              <h3 className="text-sm font-bold text-white/60 group-hover:text-white mt-2 transition-colors leading-tight">
                {calc.title?.replace(' & Engineering Guide - AluCalc', '') || calc.id}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-32" aria-labelledby="why-heading">
        <div className="flex items-center gap-6 mb-12">
          <h2 id="why-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">{ui.whyAluCalcTitle}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            const title = ui[item.titleKey] || ui.whyChoose;
            const desc = ui[item.descKey] || ui.prop1Text;
            return (
              <div key={item.titleKey} className="p-8 rounded-3xl border border-white/5 bg-white/[0.015]">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-32">
        <div className="p-12 md:p-16 rounded-[3rem] border border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{ui.startEngineeringNow}</h2>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">{ui.startEngineeringDesc}</p>
            </div>
            <Link
              href="/workspace"
              className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 whitespace-nowrap"
            >
              {ui.launchWorkspace} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

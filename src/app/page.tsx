import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Hexagon, Zap, Layers, Globe, ShieldCheck,
  ChevronRight, Cpu, Wrench, Box, Droplets,
  Gauge, FlaskConical, Thermometer, Activity,
  ArrowRight, Calculator, Settings, CircleDot,
  Ruler, Flame, Cable, Scissors, Anchor
} from 'lucide-react';
import calculatorsData from '@/data/seo-calculators/calculators.json';

export const metadata: Metadata = {
  title: 'Engineering Calculators Built on Real Formulas (ISO, ASME, ANSI) — AluCalc OS',
  description: 'Free online engineering calculators for bolt torque, bearing life, beam deflection, gear ratio, shaft design and more. Browser-based, no installation, engineering-grade accuracy. Used by mechanical engineers, students, and manufacturers worldwide.',
  alternates: {
    canonical: 'https://www.alucalculator.com',
  },
};

/* ═══════════════════════════════════════════════════════════ */
/*  STATIC DATA — All rendered server-side for full SSR/SSG  */
/* ═══════════════════════════════════════════════════════════ */

const POPULAR_CALCULATORS = [
  { title: 'Bolt Torque Calculator', desc: 'Calculate bolt tightening torque from preload force, friction coefficient, and diameter using T = K × F × d formula with VDI 2230 methodology. Includes K-factor tables and worked examples.', slug: 'bolt-torque-calc', icon: Wrench, color: 'orange' },
  { title: 'Bearing Life Calculator (ISO 281)', desc: 'Predict rolling element bearing L₁₀ life using dynamic load rating and equivalent load per ISO 281. Includes reliability factors, lubrication adjustment, and catalog selection guidance.', slug: 'bearing-life-calc', icon: CircleDot, color: 'cyan' },
  { title: 'Beam Deflection Calculator', desc: 'Calculate maximum beam deflection, bending moment, and shear force for simply supported beams under uniform and point loads using Euler-Bernoulli theory with δ = 5wL⁴/(384EI).', slug: 'beam-deflection-calc', icon: Ruler, color: 'indigo' },
  { title: 'Shaft Diameter Calculator', desc: 'Determine minimum shaft diameter from torsional shear stress using d = (16T/πτ)^(1/3). Includes material tables for AISI 1045, 4140 steel and torsional deflection checks.', slug: 'shaft-diameter-calc', icon: Settings, color: 'emerald' },
  { title: 'Gear Ratio Calculator', desc: 'Calculate transmission gear ratio, output speed, and torque multiplication for spur, helical, worm, and planetary gear trains. Includes multi-stage efficiency calculations.', slug: 'gear-ratio-calc', icon: Settings, color: 'purple' },
  { title: 'Electrical Power Calculator', desc: 'Calculate real power (W), apparent power (VA), and reactive power (VAR) for single-phase and three-phase AC/DC circuits using P = V × I × cos(φ) with power factor correction guidance.', slug: 'power-electrical-calc', icon: Zap, color: 'yellow' },
];

const CATEGORIES = [
  {
    name: 'Mechanical Engineering',
    color: 'cyan',
    icon: Settings,
    desc: 'Mechanical engineering calculators for shaft design, bearing analysis, bolt torque, gear ratios, and power transmission systems.',
    links: [
      { title: 'Bolt Torque Calculator', slug: 'bolt-torque-calc' },
      { title: 'Bearing Life (ISO 281)', slug: 'bearing-life-calc' },
      { title: 'Shaft Diameter Calculator', slug: 'shaft-diameter-calc' },
      { title: 'Gear Ratio Calculator', slug: 'gear-ratio-calc' },
      { title: 'Motor Power Calculator', slug: 'motor-power-calc' },
      { title: 'Spring Constant Calculator', slug: 'spring-constant-calc' },
    ],
  },
  {
    name: 'Structural Engineering',
    color: 'indigo',
    icon: Layers,
    desc: 'Structural analysis tools for beam deflection, concrete reinforcement, topology optimization, and FEA simulation.',
    links: [
      { title: 'Beam Deflection Calculator', slug: 'beam-deflection-calc' },
      { title: 'Concrete Reinforcement', slug: 'concrete-reinforcement' },
      { title: 'Topology Optimization', slug: 'topology-optimization' },
      { title: 'Machine Assembly', slug: 'machine-assembly' },
      { title: 'FEA Analysis', slug: 'simulation-fea' },
    ],
  },
  {
    name: 'Fluid & Thermal',
    color: 'blue',
    icon: Droplets,
    desc: 'Fluid dynamics and thermal engineering calculators for pressure drop, heat transfer, pump sizing, and lubrication analysis.',
    links: [
      { title: 'Pressure Drop Calculator', slug: 'pressure-drop-calc' },
      { title: 'Heat Transfer Calculator', slug: 'heat-transfer-calc' },
      { title: 'Pump Performance', slug: 'pumps' },
      { title: 'Gearbox Lubrication', slug: 'reducer-lubrication' },
      { title: 'Naval Hydrostatics', slug: 'naval-hydrostatics' },
    ],
  },
  {
    name: 'Electrical & Power',
    color: 'yellow',
    icon: Zap,
    desc: 'Electrical engineering calculators for AC/DC power, Ohm\'s law, voltage drop, three-phase systems, and filter design.',
    links: [
      { title: 'Power Calculator (AC/DC)', slug: 'power-electrical-calc' },
      { title: 'Ohm\'s Law Calculator', slug: 'ohms-law' },
      { title: 'Voltage Drop Calculator', slug: 'voltage-drop' },
      { title: '3-Phase Power', slug: 'three-phase-power' },
      { title: 'Filter Design', slug: 'filter-design' },
    ],
  },
  {
    name: 'Science & Simulation',
    color: 'purple',
    icon: FlaskConical,
    desc: 'Advanced simulation and science tools for physics solvers, failure prediction, diagnostics, genetics, and digital logic.',
    links: [
      { title: 'Physics CAS Solver', slug: 'physics-solver' },
      { title: 'Failure Prediction AI', slug: 'failure-prediction' },
      { title: 'Failure Diagnosis', slug: 'failure-diagnosis' },
      { title: 'Population Genetics', slug: 'biology-genetics' },
      { title: 'Digital Logic Lab', slug: 'digital-logic' },
    ],
  },
];

const WHY_ALUCALC = [
  { title: 'Built on Real Engineering Standards', desc: 'Every formula validated against ISO 281, VDI 2230, ASME PCC-1, ANSI, and DIN standards. Not approximations — real engineering methodology used by professionals in automotive, aerospace, and manufacturing.', icon: ShieldCheck },
  { title: 'Step-by-Step Calculation Logic', desc: 'Each calculator provides numbered methodology steps, worked numerical examples, and technical reference tables. Understand the engineering behind every result, not just a number.', icon: Cpu },
  { title: 'Designed for Real-World Engineering Use', desc: 'From sizing a motor shaft to predicting bearing fatigue life — these tools solve actual design problems. Used by mechanical engineers, structural designers, and engineering students worldwide. Zero installation, zero cost.', icon: Globe },
];

const COLOR_MAP: Record<string, string> = {
  cyan: 'border-cyan-500/20 hover:border-cyan-400/50 text-cyan-400',
  indigo: 'border-indigo-500/20 hover:border-indigo-400/50 text-indigo-400',
  blue: 'border-blue-500/20 hover:border-blue-400/50 text-blue-400',
  yellow: 'border-yellow-500/20 hover:border-yellow-400/50 text-yellow-400',
  purple: 'border-purple-500/20 hover:border-purple-400/50 text-purple-400',
  orange: 'border-orange-500/20 hover:border-orange-400/50 text-orange-400',
  emerald: 'border-emerald-500/20 hover:border-emerald-400/50 text-emerald-400',
};

/* ═══════════════════════════════════════════════════════════ */
/*  SERVER COMPONENT — Full SSR, Zero client JS for content  */
/* ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const recentCalculators = (calculatorsData as any[]).slice(-5).reverse();

  return (
    <div className="min-h-screen bg-[#010204] text-white overflow-hidden font-sans">

      {/* ═══ AMBIENT BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,58,138,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-3xl bg-[#010204]/80">
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#0a0f18] border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:scale-105 transition-all">
              <Hexagon size={22} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tighter text-white uppercase">AluCalc OS</span>
              <span className="text-[7px] font-black tracking-[0.5em] uppercase text-blue-500/40 mt-1">Engineering Intelligence v5.5</span>
            </div>
          </Link>
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/calculators" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Calculators</Link>
            <Link href="/academy" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors hidden sm:block">Academy</Link>
            <Link href="/workspace" className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-blue-500/10 transition-all flex items-center gap-3">
              <Calculator size={14} /> Open AluCalc OS
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">

        {/* ═══ HERO SECTION ═══ */}
        <header className="text-center max-w-5xl mx-auto pt-32 md:pt-44 pb-24 md:pb-32">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full mb-10 border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[9px] font-black text-blue-400 tracking-[0.4em] uppercase">88+ Engineering Solvers Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-10 text-white">
            Engineering Calculators{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-500">
              Built on Real Formulas
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl mt-4 text-slate-400 font-bold">(ISO, ASME, ANSI, DIN)</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto mb-8 px-4">
            From bolt torque to bearing life (ISO 281), calculate real engineering problems with verified formulas and step-by-step solutions. AluCalc OS is a free, browser-based engineering platform built for mechanical engineers, structural designers, electrical engineers, students, and manufacturers. Access over 88 precision calculators covering bolt torque analysis, bearing life prediction, beam deflection, gear design, fluid dynamics, and thermal systems — all validated against international standards. No installation needed. No license fees. Used by professionals in automotive, aerospace, manufacturing, and construction industries worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12">
            <Link
              href="/workspace"
              className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] flex items-center gap-3"
            >
              Open AluCalc OS <ArrowRight size={16} />
            </Link>
            <Link href="/calculators" className="px-10 py-5 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-300 font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all backdrop-blur-md">
              Browse All Calculators
            </Link>
          </div>

          {/* Above-the-fold quick links */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest self-center mr-2">Top Calculators:</span>
            <Link href="/calculators/bolt-torque-calc" className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-full px-4 py-1.5 hover:bg-blue-500/10 transition-all">Bolt Torque</Link>
            <Link href="/calculators/bearing-life-calc" className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 rounded-full px-4 py-1.5 hover:bg-cyan-500/10 transition-all">Bearing Life (ISO 281)</Link>
            <Link href="/calculators/beam-deflection-calc" className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1.5 hover:bg-indigo-500/10 transition-all">Beam Deflection</Link>
            <Link href="/calculators/shaft-diameter-calc" className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-full px-4 py-1.5 hover:bg-emerald-500/10 transition-all">Shaft Design</Link>
            <Link href="/calculators/gear-ratio-calc" className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-full px-4 py-1.5 hover:bg-purple-500/10 transition-all">Gear Ratio</Link>
            <Link href="/calculators/pressure-drop-calc" className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-full px-4 py-1.5 hover:bg-blue-500/10 transition-all">Pressure Drop</Link>
            <Link href="/calculators/motor-power-calc" className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/20 rounded-full px-4 py-1.5 hover:bg-orange-500/10 transition-all">Motor Power</Link>
            <Link href="/calculators/heat-transfer-calc" className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-full px-4 py-1.5 hover:bg-red-500/10 transition-all">Heat Transfer</Link>
          </div>
        </header>

        {/* ═══ POPULAR CALCULATORS ═══ */}
        <section className="pb-32" aria-labelledby="popular-heading">
          <div className="flex items-center gap-6 mb-12">
            <h2 id="popular-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">Popular Engineering Calculators</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_CALCULATORS.map((calc) => {
              const Icon = calc.icon;
              const colorClass = COLOR_MAP[calc.color] || COLOR_MAP.cyan;
              return (
                <Link
                  key={calc.slug}
                  href={`/calculators/${calc.slug}`}
                  className={`group relative block p-8 rounded-3xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden ${colorClass}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#05080f] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all">
                      <Icon size={22} />
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{calc.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{calc.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ═══ CATEGORIES ═══ */}
        <section className="pb-32" aria-labelledby="categories-heading">
          <div className="flex items-center gap-6 mb-12">
            <h2 id="categories-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">Calculator Categories</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={18} className={`text-${cat.color}-400`} />
                    <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  </div>
                  {(cat as any).desc && <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">{(cat as any).desc}</p>}
                  <ul className="space-y-2.5">
                    {cat.links.map((link) => (
                      <li key={link.slug}>
                        <Link
                          href={`/calculators/${link.slug}`}
                          className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ RECENTLY ADDED ═══ */}
        <section className="pb-32" aria-labelledby="recent-heading">
          <div className="flex items-center gap-6 mb-4">
            <h2 id="recent-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">Recently Added Engineering Calculators</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
          </div>
          <p className="text-sm text-slate-500 mb-8 max-w-2xl">New engineering tools added with real formulas, worked examples, and step-by-step calculation methodology.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentCalculators.map((calc: any) => (
              <Link
                key={calc.slug}
                href={`/calculators/${calc.slug}`}
                className="group p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-blue-500/20 transition-all"
              >
                <span className="text-[9px] font-bold text-blue-500/40 uppercase tracking-widest">{calc.category}</span>
                <h3 className="text-sm font-bold text-white/60 group-hover:text-white mt-2 transition-colors leading-tight">{calc.title?.replace(' & Engineering Guide - AluCalc', '') || calc.id}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ WHY ALUCALC OS ═══ */}
        <section className="pb-32" aria-labelledby="why-heading">
          <div className="flex items-center gap-6 mb-12">
            <h2 id="why-heading" className="text-2xl md:text-3xl font-black tracking-tight text-white">Why AluCalc OS?</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_ALUCALC.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-8 rounded-3xl border border-white/5 bg-white/[0.015]">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                    <Icon size={22} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ CTA BANNER ═══ */}
        <section className="pb-32">
          <div className="p-12 md:p-16 rounded-[3rem] border border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Start Engineering Now</h2>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">88+ calculators, 3D assembly workspace, materials database, and BOM generation — all in your browser. Free, forever.</p>
              </div>
              <Link
                href="/workspace"
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3 whitespace-nowrap"
              >
                Open AluCalc OS <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ SEO TEXT BLOCKS ═══ */}
        <section className="pb-24 max-w-4xl" aria-labelledby="what-heading">
          <h2 id="what-heading" className="text-2xl font-bold text-white mb-6">What Are Engineering Calculators?</h2>
          <div className="text-sm text-slate-400 leading-relaxed space-y-4">
            <p>Engineering calculators are specialized computational tools that solve technical equations used in mechanical, structural, electrical, and thermal engineering. Unlike general-purpose calculators, engineering calculators implement validated formulas from international standards such as ISO 281 for bearing life, VDI 2230 for bolted joint analysis, ASME PCC-1 for flange assembly, and Euler-Bernoulli beam theory for structural deflection.</p>
            <p>These tools are used daily by design engineers, project engineers, manufacturing engineers, and engineering students to verify hand calculations, perform preliminary sizing, and validate simulation results. A bolt torque calculator, for example, determines the exact tightening torque needed to achieve a target preload force — a critical safety calculation in pressure vessel, automotive, and structural steel applications. Similarly, a bearing life calculator predicts when a rolling element bearing will reach fatigue failure, enabling planned maintenance and avoiding costly unplanned downtime.</p>
            <p>Modern browser-based engineering calculators like AluCalc OS eliminate the need for expensive desktop software licenses. Engineers can perform accurate calculations from any device — laptop, tablet, or phone — with results validated against the same standards used by major engineering firms worldwide.</p>
          </div>
        </section>

        <section className="pb-32 max-w-4xl" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-2xl font-bold text-white mb-6">How Engineers Use These Tools</h2>
          <div className="text-sm text-slate-400 leading-relaxed space-y-4">
            <p>Professional engineers integrate online calculators into their design workflow at multiple stages. During conceptual design, quick sizing calculations determine whether a shaft diameter, beam section, or motor rating is in the right ballpark before committing to detailed CAD modeling. During detailed design, engineers verify FEA results against analytical solutions — if a beam deflection calculator gives 6.5mm and the FEA model shows 6.8mm, the engineer has confidence in the model.</p>
            <p>In manufacturing and field engineering, calculators serve as instant reference tools. A maintenance engineer replacing a bearing can quickly verify the L₁₀ life of a proposed replacement bearing matches the application requirements. A field service engineer can calculate the correct bolt torque for a flange repair without returning to the office. Engineering students use these tools to check homework solutions and build intuition for how changing one variable affects the entire system — increasing wire diameter by 25% nearly doubles spring stiffness, for example.</p>
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 py-16 px-6 md:px-8 bg-[#010204]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Mechanical</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators/bolt-torque-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Bolt Torque Calculator</Link></li>
                <li><Link href="/calculators/bearing-life-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Bearing Life (ISO 281)</Link></li>
                <li><Link href="/calculators/gear-ratio-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Gear Ratio Calculator</Link></li>
                <li><Link href="/calculators/shaft-diameter-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Shaft Diameter</Link></li>
                <li><Link href="/calculators/spring-constant-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Spring Constant</Link></li>
                <li><Link href="/calculators/motor-power-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Motor Power</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Structural</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators/beam-deflection-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Beam Deflection</Link></li>
                <li><Link href="/calculators/concrete-reinforcement" className="text-xs text-slate-600 hover:text-white transition-colors">Concrete Reinforcement</Link></li>
                <li><Link href="/calculators/simulation-fea" className="text-xs text-slate-600 hover:text-white transition-colors">FEA Analysis</Link></li>
                <li><Link href="/calculators/topology-optimization" className="text-xs text-slate-600 hover:text-white transition-colors">Topology Optimization</Link></li>
                <li><Link href="/calculators/machine-assembly" className="text-xs text-slate-600 hover:text-white transition-colors">Machine Assembly</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Fluid & Thermal</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators/pressure-drop-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Pressure Drop</Link></li>
                <li><Link href="/calculators/heat-transfer-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Heat Transfer</Link></li>
                <li><Link href="/calculators/pumps" className="text-xs text-slate-600 hover:text-white transition-colors">Pump Performance</Link></li>
                <li><Link href="/calculators/reducer-lubrication" className="text-xs text-slate-600 hover:text-white transition-colors">Gearbox Lubrication</Link></li>
                <li><Link href="/calculators/naval-hydrostatics" className="text-xs text-slate-600 hover:text-white transition-colors">Naval Hydrostatics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Electrical</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators/power-electrical-calc" className="text-xs text-slate-600 hover:text-white transition-colors">Power Calculator</Link></li>
                <li><Link href="/calculators/ohms-law" className="text-xs text-slate-600 hover:text-white transition-colors">Ohm&apos;s Law</Link></li>
                <li><Link href="/calculators/voltage-drop" className="text-xs text-slate-600 hover:text-white transition-colors">Voltage Drop</Link></li>
                <li><Link href="/calculators/three-phase-power" className="text-xs text-slate-600 hover:text-white transition-colors">3-Phase Power</Link></li>
                <li><Link href="/calculators/filter-design" className="text-xs text-slate-600 hover:text-white transition-colors">Filter Design</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Science</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators/physics-solver" className="text-xs text-slate-600 hover:text-white transition-colors">Physics CAS Solver</Link></li>
                <li><Link href="/calculators/failure-prediction" className="text-xs text-slate-600 hover:text-white transition-colors">Failure Prediction</Link></li>
                <li><Link href="/calculators/failure-diagnosis" className="text-xs text-slate-600 hover:text-white transition-colors">Failure Diagnosis</Link></li>
                <li><Link href="/calculators/biology-genetics" className="text-xs text-slate-600 hover:text-white transition-colors">Population Genetics</Link></li>
                <li><Link href="/calculators/digital-logic" className="text-xs text-slate-600 hover:text-white transition-colors">Digital Logic Lab</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/calculators" className="text-xs text-slate-600 hover:text-white transition-colors">All Calculators</Link></li>
                <li><Link href="/workspace" className="text-xs text-slate-600 hover:text-white transition-colors">Open Workspace</Link></li>
                <li><Link href="/academy" className="text-xs text-slate-600 hover:text-white transition-colors">Engineering Academy</Link></li>
                <li><Link href="/" className="text-xs text-slate-600 hover:text-white transition-colors">Home</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 opacity-60">
              <Hexagon size={22} className="text-white" />
              <span className="text-xs font-black tracking-[0.4em] text-white uppercase">AluCalc OS</span>
            </div>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">© 2026 AluCalc Advanced Engineering Systems</p>
          </div>
        </div>
      </footer>

      {/* ═══ STRUCTURED DATA ═══ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AluCalc OS",
            "url": "https://www.alucalculator.com",
            "applicationCategory": "EngineeringApplication",
            "operatingSystem": "Web",
            "description": "Free online engineering calculators for mechanical, structural, electrical, and thermal analysis. 88+ precision solvers.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is AluCalc OS?",
                "acceptedAnswer": { "@type": "Answer", "text": "AluCalc OS is a free, browser-based engineering platform with 88+ precision calculators for mechanical, structural, electrical, and thermal analysis. All formulas are validated against ISO, DIN, ASME, and ANSI standards." }
              },
              {
                "@type": "Question",
                "name": "Is AluCalc OS free to use?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes, AluCalc OS is completely free. No registration, no installation, and no license fees. All calculators work directly in your browser." }
              },
              {
                "@type": "Question",
                "name": "What engineering calculators are available?",
                "acceptedAnswer": { "@type": "Answer", "text": "AluCalc OS includes calculators for bolt torque, bearing life (ISO 281), beam deflection, shaft design, gear ratios, electrical power, pressure drop, heat transfer, motor sizing, spring constants, and 78+ more engineering tools." }
              }
            ]
          }),
        }}
      />
    </div>
  );
}

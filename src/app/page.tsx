'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Hexagon, Zap, Layers, Beaker, Globe, ShieldCheck, ChevronRight, Activity, Terminal, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'mechanical', icon: <Hexagon size={24} />, title: "Mechanical Engineering", color: "from-blue-500 to-indigo-600", links: [
    { name: 'Bolted Joint Integrity', slug: 'bolt-torque-calculator', isGuide: true },
    { name: 'Bearing Life (ISO 281)', slug: 'bearing-life-iso-281', isGuide: true },
    { name: 'Shaft Diameter Analyser', slug: 'shaft-diameter' },
    { name: 'Gear Ratio Engine', slug: 'gear-ratio' },
    { name: 'Spring Rate Design', slug: 'spring-rate-compression' }
  ] },
  { id: 'structural', icon: <Layers size={24} />, title: "Structural Engineering", color: "from-emerald-500 to-teal-600", links: [
    { name: 'Structural Beam Theory', slug: 'beam-deflection-calculator', isGuide: true },
    { name: 'Bending Moment Solver', slug: 'bending-moment-calculator' },
    { name: 'Euler Buckling Formula', slug: 'buckling-euler' },
    { name: 'Wind Load Engineering', slug: 'wind-asce' },
    { name: 'Truss Analysis Suite', slug: 'truss-analysis' }
  ] },
  { id: 'fluid', icon: <Globe size={24} />, title: "Fluid Mechanics", color: "from-cyan-400 to-blue-500", links: [
    { name: 'Bernoulli Flow Energy', slug: 'bernoulli-equation-calculator', isGuide: true },
    { name: 'Pressure Drop (Pipe)', slug: 'pipe-pressure-drop' },
    { name: 'Flow Rate Dynamics', slug: 'flow-rate-calculator' },
    { name: 'Reynolds Regimes', slug: 'reynolds' },
    { name: 'Pump Performance', slug: 'pump-power-calculator' }
  ] },
  { id: 'electrical', icon: <Zap size={24} />, title: "Electrical Engineering", color: "from-amber-400 to-orange-500", links: [
    { name: '3-Phase Power System', slug: '3-phase-power-calculator', isGuide: true },
    { name: 'Voltage Drop Solver', slug: 'voltage-drop-calculator' },
    { name: 'Power Factor Correction', slug: 'kvar-correct' },
    { name: 'Motor Current Analysis', slug: 'motor-current-calculator' },
    { name: 'Industrial Cable Sizing', slug: 'cable-sizing-calculator' }
  ] },
  { id: 'thermal', icon: <Activity size={24} />, title: "Thermal Engineering", color: "from-rose-500 to-red-600", links: [
    { name: 'Heat Transfer Calculator', slug: 'thermal-conduction' },
    { name: 'Thermal Expansion Calculator', slug: 'exp-linear' },
    { name: 'Heat Exchanger Tool', slug: 'heat-lmtd' }
  ] },
  { id: 'science', icon: <Beaker size={24} />, title: "Advanced Science", color: "from-purple-500 to-fuchsia-600", links: [
    { name: 'Material Science Matrix', slug: 'material-properties-calculator', isGuide: true },
    { name: 'Kinematics Solver', slug: 'projectile-motion' },
    { name: 'Stoichiometry Lab', slug: 'stoichiometry-calc' },
    { name: 'Vibration ISO 10816', slug: 'vibration-iso' },
    { name: 'Universal Converter', slug: 'unit-converter' }
  ] }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch on initial render with motion

  return (
    <div className="min-h-screen bg-[#03060a] text-white overflow-hidden selection:bg-blue-500/30">
      
      {/* ═══ DYNAMIC EFFECTS BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#03060a] to-[#03060a]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" 
        />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-2xl bg-[#03060a]/70 border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.2)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all">
              <Hexagon size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AluCalc OS</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/calculators" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Library</Link>
            <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Academy</Link>
            <Link href="/workspace" className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2">
              <Terminal size={14} /> Open Core
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* HERO SECTION */}
        <motion.header 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto mb-32 pt-10"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full mb-8 border border-blue-500/30 bg-blue-500/10 backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-black text-blue-300 tracking-[0.2em] uppercase font-mono">Platform v5.0 Live</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500">
            Engineering Calculators <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">& Design Tools</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto font-medium mb-10">
            AluCalc OS is a browser-based engineering workstation that provides professional-grade calculation tools across mechanical, structural, fluid, electrical, and thermal domains.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="group relative inline-flex items-center justify-center px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity" />
              <span className="relative flex items-center text-white">
                Open AluCalc Workspace <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link href="/calculators" className="px-8 py-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md text-sm font-bold tracking-widest uppercase transition-colors text-white">
              Browse SEO Library
            </Link>
          </div>
        </motion.header>

        {/* METRICS / TRUST BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32 border-y border-white/5 py-8"
        >
          {[
            { value: "150+", label: "Dynamic Tools" },
            { value: "0ms", label: "Client Latency" },
            { value: "ISO/DIN", label: "Compliant" },
            { value: "100%", label: "Native Browser" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* POPULAR TOOLS */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-[1px] bg-blue-500/50" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-blue-400 font-bold">Trending Operations</h2>
            <div className="flex-1 h-[1px] bg-slate-800/50" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Bolt Torque Calculator", slug: "bolt-torque-calculator", desc: "Determine required tightening torque for joints using dynamic friction coefficients." },
              { title: "Bearing Life Calculator", slug: "bearing-life-iso-281", desc: "Calculate ISO 281 L10 bearing life dynamically in the browser." },
              { title: "Beam Deflection Engine", slug: "beam-deflection", desc: "Analyze structural loads and deflections with real-time FEA." }
            ].map((calc, i) => (
              <motion.div 
                key={calc.slug} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/calculators/${calc.slug}`} className="group relative block h-full p-8 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target size={64} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 mb-3 transition-colors">{calc.title}</h3>
                  <p className="text-sm text-slate-400 mb-8 leading-relaxed relative z-10">{calc.desc}</p>
                  <div className="flex items-center text-[10px] font-mono font-black text-blue-500 uppercase tracking-widest">
                    Initialize Tool <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ENGINEERING DIRECTORY (THE GRID) */}
        <section>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-[1px] bg-slate-600" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold">Engineering Directory</h2>
            <div className="flex-1 h-[1px] bg-slate-800/50" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((cat, i) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-[0.03] rounded-[2rem] transition-opacity`} />
                
                <div className="flex flex-col gap-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} p-[1px] shadow-lg`}>
                    <div className="w-full h-full bg-[#05080f] rounded-2xl flex items-center justify-center text-white">
                      {cat.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white tracking-tight">{cat.title}</h3>
                  
                  <ul className="space-y-3">
              {cat.links.map(link => (
                <li key={link.slug}>
                  <Link 
                    href={link.isGuide ? `/learn/${link.slug}` : `/calculators/${link.slug}`} 
                    className="group/link flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full mr-3 group-hover/link:scale-150 group-hover/link:bg-current transition-all" />
                    <span className="text-sm font-medium">{link.name}</span>
                    {link.isGuide && <span className="ml-2 text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/30 px-1 rounded">Guide</span>}
                  </Link>
                </li>
              ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-white/5 py-12 px-6 bg-[#020306] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <Hexagon size={18} className="text-white" />
            <span className="text-sm font-black tracking-widest text-white">ALUCALC OS</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} AluCalc Engineering Platform. Built for Production.
          </div>
        </div>
      </footer>
    </div>
  );
}

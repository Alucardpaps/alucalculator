'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Hexagon, Search, ArrowUpRight } from 'lucide-react';
import calculatorsData from '@/data/seo-calculators/calculators.json';

// ════════════════════════════════════════════
// PROFESSIONAL VISUAL ASSET POOL (17 UNIQUE BASES)
// ════════════════════════════════════════════

const VISUALS = {
  GEARS: '/assets/dashboard/gears.png',
  TRUSS: '/assets/dashboard/truss.png',
  FLUIDS: '/assets/dashboard/fluids.png',
  PUMP: '/assets/dashboard/pump.png',
  WING: '/assets/dashboard/wing.png',
  FASTENER: '/assets/dashboard/fasteners.png',
  CIRCUIT: '/assets/dashboard/circuit.png',
  ELECTRONICS: '/assets/dashboard/electronics.png',
  MATERIALS: '/assets/dashboard/materials.png',
  CHEMISTRY: '/assets/dashboard/chemistry.png',
  BEARINGS: '/assets/dashboard/bearings.png',
  LASER: '/assets/dashboard/laser.png',
  AUTOMATION: '/assets/dashboard/automation.png',
  MFG: '/assets/dashboard/manufacturing.png',
  ROBOTICS: '/assets/dashboard/robotics.png',
  STRUCTURAL: '/assets/dashboard/structural.png',
};

// ═══════════════════════════════════════════════════════
// HIGH-FIDELITY MODULE REGISTRY (50 Nodes - TRUE DIVERSITY)
// ═══════════════════════════════════════════════════════

const OS_MODULES = [
  // --- MECHANICAL & STRUCTURAL (14) ---
  { name: 'Profile Weight', description: 'Aluminum weight & alloy database', path: '/aluminum', image: VISUALS.STRUCTURAL, color: '#66FCF1' },
  { name: 'Gear Design', description: 'Gears, bearings & transmission design', path: '/gears', image: VISUALS.GEARS, color: '#66FCF1' },
  { name: 'Planetary Gear', description: 'Multi-stage Willis Equation solver', path: '/calculators/planetary-gearbox', image: VISUALS.ROBOTICS, color: '#66FCF1' },
  { name: 'ISO 281 Bearings', description: 'Bearing life calculation & selection', path: '/bearings', image: VISUALS.BEARINGS, color: '#66FCF1' },
  { name: 'Fastener Analysis', description: 'Bölüm J: Fastener analysis suite', path: '/fasteners', image: VISUALS.FASTENER, color: '#FFA500' },
  { name: 'Bolt Torque', description: 'Fastener torque and preload analysis', path: '/bolt-torque', image: VISUALS.GEARS, color: '#FFA500' },
  { name: 'Strength Analysis', description: 'Stress, strain, Mohr circle & fatigue', path: '/strength', image: VISUALS.TRUSS, color: '#45A29E' },
  { name: 'Beam Deflection', description: 'Structural beam analysis & supports', path: '/beam-deflection', image: VISUALS.STRUCTURAL, color: '#45A29E' },
  { name: 'Concrete Reinf.', description: 'RC Suite: Beams & Slabs', path: '/concrete-reinforcement', image: VISUALS.TRUSS, color: '#45A29E' },
  { name: 'Fatigue Life', description: 'Goodman diagrams & S-N curves', path: '/fatigue', image: VISUALS.GEARS, color: '#66FCF1' },
  { name: 'Adv. Fatigue', description: 'Advanced Fatigue Life Analysis', path: '/fatigue-advanced', image: VISUALS.BEARINGS, color: '#66FCF1' },
  { name: 'Fits & Tolerances', description: 'ISO 286 tolerance analysis', path: '/fits', image: VISUALS.MFG, color: '#66FCF1' },
  { name: 'Reducer Lube', description: 'Gearbox thermal and lubrication', path: '/reducer-lubrication', image: VISUALS.FLUIDS, color: '#66FCF1' },
  { name: 'Gearbox Engine', description: 'Gearbox Synthesis & Performance', path: '/gearbox-design', image: VISUALS.ROBOTICS, color: '#66FCF1' },

  // --- MANUFACTURING & PRODUCTION (12) ---
  { name: 'Machining Details', description: 'Imbus, Circlips, Keys & Undercuts', path: '/machining-details', image: VISUALS.MFG, color: '#a78bfa' },
  { name: '2D Nesting', description: 'DXF nesting & stock minimization', path: '/nesting', image: VISUALS.LASER, color: '#a78bfa' },
  { name: 'Cutting Optimizer', description: 'Industrial toolpath optimization', path: '/cutting-optimizer', image: VISUALS.AUTOMATION, color: '#a78bfa' },
  { name: 'CAD Editor', description: 'Parametric CAD Environment', path: '/cad-editor', image: VISUALS.MFG, color: '#a78bfa' },
  { name: 'Weld Calculator', description: 'AWS D1.1 weld strength & heat input', path: '/welding', image: VISUALS.LASER, color: '#a78bfa' },
  { name: 'Mfg. Readiness', description: 'Manufacturing Readiness (MRL) Analysis', path: '/mfg-readiness', image: VISUALS.AUTOMATION, color: '#a78bfa' },
  { name: 'Mfg. Sandbox', description: 'Production Simulation Sandbox', path: '/manufacturing-sandbox', image: VISUALS.ROBOTICS, color: '#a78bfa' },
  { name: 'Topology Opt.', description: 'Generative Topology Design Engine', path: '/topology-optimization', image: VISUALS.STRUCTURAL, color: '#a78bfa' },
  { name: 'Machine Assembly', description: '3D Machine Design & Layout', path: '/machine-assembly', image: VISUALS.ROBOTICS, color: '#a78bfa' },
  { name: 'Simulation FEA', description: 'Finite Element Analysis Workspace', path: '/simulation-fea', image: VISUALS.TRUSS, color: '#a78bfa' },
  { name: 'Eng. Selection', description: 'Part and material selection logic', path: '/engineering-selection', image: VISUALS.MFG, color: '#a78bfa' },
  { name: 'Sketch Pad', description: 'Technical sketching & layout', path: '/sketch-pad', image: VISUALS.WING, color: '#a78bfa' },

  // --- FLUIDS, AERO & DYNAMICS (7) ---
  { name: 'Pump Suite', description: 'Flow rate, head loss & NPSH analysis', path: '/pumps', image: VISUALS.PUMP, color: '#00d2ff' },
  { name: 'Fluid Dynamics', description: 'Reynolds number & pipe flow solver', path: '/fluid-dynamics', image: VISUALS.FLUIDS, color: '#00d2ff' },
  { name: 'Aerospace Dynamics', description: 'Flight envelope & orbital mechanics', path: '/aerospace-dynamics', image: VISUALS.WING, color: '#38bdf8' },
  { name: 'Naval Hydro.', description: 'Naval Engineering & Hydrostatics', path: '/naval-hydrostatics', image: VISUALS.PUMP, color: '#38bdf8' },
  { name: 'Kinematics', description: 'Engineering motion & velocity solvers', path: '/physics-kinematics', image: VISUALS.ROBOTICS, color: '#38bdf8' },
  { name: 'Thermal Expansion', description: 'Material expansion & thermal stress', path: '/thermal-expansion', image: VISUALS.CHEMISTRY, color: '#f472b6' },
  { name: 'Physics Solver', description: 'Symbolic Physics CAS Solver', path: '/physics-solver', image: VISUALS.MATERIALS, color: '#38bdf8' },

  // --- SCIENCE, MATERIALS & AI (10) ---
  { name: 'Materials DB', description: 'Global Materials Information System', path: '/materials-db', image: VISUALS.MATERIALS, color: '#f472b6' },
  { name: 'Materials intelligence', description: 'AI-driven Material Explorer', path: '/materials-explorer', image: VISUALS.CHEMISTRY, color: '#f472b6' },
  { name: 'Material Selector AI', description: 'AI recommendation for alloys', path: '/material-selector-ai', image: VISUALS.MATERIALS, color: '#f472b6' },
  { name: 'Failure Prediction', description: 'AI Failure Prediction System', path: '/failure-prediction', image: VISUALS.TRUSS, color: '#f472b6' },
  { name: 'Failure Analysis', description: 'Diagnosis of mechanical failure modes', path: '/failure-diagnosis', image: VISUALS.LASER, color: '#f472b6' },
  { name: 'Chemistry Lab', description: 'Stoichiometry & Reaction Computing', path: '/chemistry-reactions', image: VISUALS.CHEMISTRY, color: '#f472b6' },
  { name: 'Biology Genetics', description: 'Genetics & Bioinformatics Solver', path: '/biology-genetics', image: VISUALS.MATERIALS, color: '#f472b6' },
  { name: 'Unit Converter', description: 'Standard engineering unit conversions', path: '/unit-converter', image: VISUALS.CIRCUIT, color: '#4ade80' },
  { name: 'Periodic Table', description: 'Interactive chemical database', path: '/periodic-table', image: VISUALS.CHEMISTRY, color: '#f472b6' },
  { name: 'Algorithms', description: 'CS Algorithm Visualizer', path: '/cs-algorithms', image: VISUALS.AUTOMATION, color: '#4ade80' },

  // --- ELECTRICAL & POWER (4) ---
  { name: 'Motor Select', description: 'Motor Selection Engine', path: '/motor-selection-std', image: VISUALS.ELECTRONICS, color: '#FFD700' },
  { name: 'Ohm\'s Law', description: 'Basic Electrical Computing', path: '/ohms-law', image: VISUALS.CIRCUIT, color: '#FFD700' },
  { name: 'Voltage Drop', description: 'Wire sizing and power drop', path: '/voltage-drop', image: VISUALS.ELECTRONICS, color: '#FFD700' },
  { name: 'Scientific Calc', description: 'Scientific Workstation Dashboard', path: '/calculator', image: VISUALS.CIRCUIT, color: '#4ade80' },
];

export default function CalculatorsIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCalculators = (calculatorsData as unknown as Calculator[])
    .filter(c => c.category !== 'utilities'); 

  // TRULY DISTINGUISHABLE VISUALS ENGINE
  const getAggressiveStyle = (name: string, baseImage: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360; // Full 360 degree color shift
    const brightness = 0.5 + (hash % 50) / 100;
    const scale = 2 + (hash % 15) / 5; // Zoom logic (2x to 5x macro detail)
    const posX = hash % 100;
    const posY = (hash * 37) % 100;
    
    // Unique gradient tint layer per card
    const tints = ['#66FCF1', '#45A29E', '#00d2ff', '#a78bfa', '#FFA500', '#f472b6', '#38bdf8', '#4ade80'];
    const tint = tints[hash % tints.length];

    return {
      style: {
        backgroundImage: `url(${baseImage})`,
        filter: `hue-rotate(${hue}deg) brightness(${brightness}) saturate(1.8) contrast(1.2)`,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundSize: `${scale * 100}%`,
      },
      tint
    };
  };

  const categories = {
    'Mechanical & Structural': OS_MODULES.slice(0, 14),
    'Manufacturing & Production': OS_MODULES.slice(14, 25),
    'Fluid & Aerospace': OS_MODULES.slice(25, 32),
    'Intelligence & Science': OS_MODULES.slice(32, 42),
    'Electrical & Power': OS_MODULES.slice(42),
  };

  return (
    <div className="min-h-screen bg-[#010204] text-white selection:bg-cyan-500/30 font-sans">
      
      {/* ── Dashboard Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-3xl bg-black/70">
        <div className="max-w-[1900px] mx-auto px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-950/50 to-blue-900/50 border border-white/10 group-hover:border-cyan-400 transition-all">
              <Hexagon size={22} className="text-cyan-400 group-hover:rotate-[60deg] transition-all duration-700" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tighter uppercase whitespace-nowrap">AluCalc <span className="text-cyan-400">OS V5</span></span>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Engineering Intelligence</span>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl mx-16 relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-all" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces and deterministic nodes..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-all"
            />
          </div>

          <div className="hidden xl:flex items-center gap-10">
             <div className="text-[10px] font-black text-white/20 tracking-widest uppercase italic">Industrial Platform Build 5.25.x</div>
             <div className="h-6 w-px bg-white/10" />
             <div className="px-5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">Enterprise // Stable</div>
          </div>
        </div>
      </header>

      <div className="max-w-[1900px] mx-auto px-10 py-24">

        {/* ── Engineering Terminal ── */}
        <section className="mb-40">
          <div className="flex items-center gap-12 mb-28">
            <div className="flex flex-col">
              <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">Engineering Registry</h1>
              <div className="flex items-center gap-5 mt-8">
                 <div className="w-1" />
                 <span className="text-[12px] font-black text-cyan-500 tracking-[0.6em] uppercase">50 Unique Workstation Nodes // Deterministic Interface</span>
              </div>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/5 to-transparent"></div>
          </div>

          {Object.entries(categories).map(([groupName, modules]) => (
            <div key={groupName} className="mb-40 last:mb-0">
              <div className="flex items-center gap-8 mb-16 overflow-hidden">
                <span className="text-[13px] font-black text-white/15 tracking-[0.6em] uppercase whitespace-nowrap">{groupName}</span>
                <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-10 gap-y-12">
                {modules.map((mod) => {
                  const { style, tint } = getAggressiveStyle(mod.name, mod.image);
                  return (
                    <Link
                      key={mod.name}
                      href={mod.path}
                      className="group relative h-72 rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#030406] transition-all duration-700 hover:scale-[1.06] hover:shadow-[0_60px_120px_rgba(0,0,0,0.98)]"
                    >
                      {/* TRULY UNIQUE INDIVIDUAL VISUALS */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-150 opacity-40 group-hover:opacity-100 group-hover:saturate-[2.5]"
                        style={style}
                      >
                         <div className="absolute inset-0 bg-gradient-to-t from-[#010204] via-[#010204]/60 to-transparent opacity-95 group-hover:opacity-40 transition-opacity" />
                      </div>

                      {/* Glass Layer with Tint */}
                      <div className="absolute inset-0 bg-transparent transition-all duration-700 opacity-20 group-hover:opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${tint}30 0%, transparent 100%)` }} />

                      {/* Info Frame */}
                      <div className="absolute inset-0 p-9 flex flex-col justify-between z-10">
                        <div className="flex justify-end items-start">
                           <ArrowUpRight size={22} className="text-white/0 group-hover:text-cyan-400 transition-all -translate-y-2 translate-x-2 group-hover:translate-x-0 group-hover:translate-y-0" />
                        </div>

                        <div className="space-y-5 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                          <h4 className="text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-cyan-400 transition-all leading-none drop-shadow-2xl">
                            {mod.name}
                          </h4>
                          <p className="text-[11px] text-white/30 leading-relaxed font-bold italic line-clamp-2 opacity-0 group-hover:opacity-100 transition-all delay-100">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Visual Polish */}
                      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-[2.5rem] transition-all" />
                      <div className="absolute inset-x-0 bottom-0 h-2 bg-transparent overflow-hidden">
                         <div className="w-full h-full bg-cyan-400 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-700 ease-out" style={{ backgroundColor: tint }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* ── Deterministic Handbook Browser ── */}
        <section className="mt-[20rem] p-16 md:p-24 lg:p-32 rounded-[4rem] bg-gradient-to-br from-[#06070a] to-transparent border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-16 mb-24 relative z-10">
            <div className="space-y-6">
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter text-white italic leading-[0.9]">
                Engineering <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-[length:200%_auto] animate-gradient-x">
                  Knowledge Base
                </span>
              </h2>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em]">ISO 9001 Standardized Documentation</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setActiveCategory(null)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${!activeCategory ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'}`}
              >
                All Domains
              </button>
              {['Mechanical', 'Structural', 'Fluid', 'Manufacturing', 'Electrical', 'Science'].map((label) => (
                <button
                  key={label}
                  onClick={() => setActiveCategory(label.toLowerCase())}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    activeCategory === label.toLowerCase()
                      ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(0,255,255,0.15)]'
                      : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 relative z-10">
            {allCalculators
              .filter(c => !activeCategory || c.category === activeCategory)
              .map((calc, idx) => (
                <Link 
                  key={calc.slug} 
                  href={`/calculators/${calc.slug}`} 
                  className="group relative flex flex-col justify-between p-8 h-56 rounded-3xl bg-white/[0.01] hover:bg-white/[0.04] transition-all border border-white/5 hover:border-cyan-500/30 overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-cyan-500/40 group-hover:text-cyan-400 uppercase tracking-[0.4em] transition-colors">
                      {calc.category}
                    </span>
                    <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors">
                      #{String(idx + 1).padStart(3, '0')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="text-lg font-bold text-white/50 group-hover:text-white transition-all tracking-tight leading-tight">
                      {calc.title}
                    </h5>
                    <div className="h-0.5 w-8 group-hover:w-full bg-cyan-500/30 group-hover:bg-cyan-500 transition-all duration-700 rounded-full" />
                  </div>

                  {/* Subtle Background Icon */}
                  <Hexagon size={80} className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-cyan-500/[0.05] transition-all duration-1000 -rotate-12 group-hover:rotate-12" />
                </Link>
              ))}
          </div>
        </section>

      </div>

      <footer className="py-52 border-t border-white/5 mt-[15rem] bg-[#010203]">
        <div className="max-w-[1900px] mx-auto px-16 flex flex-col xl:flex-row justify-between items-center gap-32 opacity-40">
          <div className="flex items-center gap-14">
            <Hexagon size={64} className="text-cyan-400 opacity-20" />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-[0.8em] text-white/30 uppercase italic">AluCalc OS Neural Core</span>
              <span className="text-sm font-bold text-white/10 uppercase tracking-[0.4em] mt-6">Hyper-Deterministic Industrial Interface // Build 5.25.0</span>
            </div>
          </div>
          <p className="text-xs font-black text-white/10 uppercase tracking-[0.6em] text-center italic max-w-2xl leading-relaxed">© 2026 AluCalc Intelligence Engineering. All rights reserved. Secure terminal session active.</p>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-custom::-webkit-scrollbar { width: 6px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.05); border-radius: 40px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 255, 0.3); }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
}

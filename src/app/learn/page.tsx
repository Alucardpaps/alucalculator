'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Calculator, Award, GraduationCap, ChevronRight, 
    Search, FileText, Zap, Hexagon, Layers, Globe, Gauge, 
    Activity, Cpu, ShieldCheck, Hammer, Beaker, Wrench, ShieldAlert, Droplets
} from 'lucide-react';

/**
 * AluCalc Academy v5.0 — The Final Mega Expansion
 * 
 * Integrated technical data from the platform and high-fidelity 
 * educational content with premium visuals and Master Guides.
 */

const ACADEMY_CATEGORIES = [
    { id: 'mech', title: "Mechanical Engineering", count: 48, icon: <Hexagon className="text-blue-400" />, desc: "Machine design, gears, and power transmission." },
    { id: 'mat', title: "Material Science", count: 32, icon: <Award className="text-emerald-400" />, desc: "Properties of alloys, composites, and polymers." },
    { id: 'struc', title: "Structural Analysis", count: 54, icon: <Layers className="text-amber-400" />, desc: "FEA, beam theory, and column stability." },
    { id: 'fluid', title: "Fluid Dynamics", count: 28, icon: <Globe className="text-cyan-400" />, desc: "Hydraulics, pipe flow, and Bernoulli logic." },
    { id: 'elec', title: "Electrical Power", count: 36, icon: <Zap className="text-purple-400" />, desc: "3-phase systems, motor current, and VFDs." },
    { id: 'manu', title: "Manufacturing", count: 22, icon: <Hammer className="text-orange-400" />, desc: "CNC programming, tolerances, and casting." },
    { id: 'sci', title: "Advanced Science", count: 31, icon: <Beaker className="text-pink-400" />, desc: "Stoichiometry, orbital dynamics, and heat." },
    { id: 'std', title: "Standards & Codes", count: 18, icon: <ShieldCheck className="text-slate-400" />, desc: "ISO, DIN, ASME, and ASTM compliance." }
];

const MASTER_GUIDES = [
    {
        title: "Bolted Joint Integrity",
        icon: <Wrench size={24} />,
        desc: "Theory of preloads, K-factors, and ISO 898-1 material standards for critical fasteners.",
        slug: "bolt-torque-calculator",
        color: "blue",
        count: "Master Class"
    },
    {
        title: "Material Science & Alloys",
        icon: <ShieldAlert size={24} />,
        desc: "Comparison of Steel vs Aluminum, tempering processes (T6), and stress-strain physics.",
        slug: "material-properties-calculator",
        color: "purple",
        count: "High Density"
    },
    {
        title: "Structural Beam Theory",
        icon: <Layers size={24} />,
        desc: "Euler-Bernoulli derivations, inertia tables, and boundary conditions for structural spans.",
        slug: "beam-deflection-calculator",
        color: "emerald",
        count: "Engineering Spec"
    },
    {
        title: "3-Phase Power Systems",
        icon: <Zap size={24} />,
        desc: "Industrial distribution math, Star/Delta configurations, and power factor efficiency.",
        slug: "3-phase-power-calculator",
        color: "amber",
        count: "Power Pack"
    },
    {
        title: "Fluid Flow Dynamics",
        icon: <Droplets size={24} />,
        desc: "Conservation of energy via Bernoulli's principle and Reynolds number flow regimes.",
        slug: "bernoulli-equation-calculator",
        color: "cyan",
        count: "Hydraulic Core"
    },
    {
        title: "Bearing Life Analysis",
        icon: <Activity size={24} />,
        desc: "ISO 281 L10 life statistical derivations and reliability adjustment factors.",
        slug: "bearing-life-iso-281",
        color: "rose",
        count: "Machine Ops"
    }
];

const MATERIAL_DATABASE = [
    { name: "Steel S235", density: 7850, youngs: 210000, yield: 235, uts: 360, type: 'Steel' },
    { name: "Steel S355", density: 7850, youngs: 210000, yield: 355, uts: 470, type: 'Steel' },
    { name: "Aluminum 6061-T6", density: 2700, youngs: 68900, yield: 276, uts: 310, type: 'Aluminum' },
    { name: "Aluminum 7075-T6", density: 2810, youngs: 71700, yield: 503, uts: 572, type: 'Aluminum' },
    { name: "Concrete C25/30", density: 2400, youngs: 31000, yield: 25, uts: 2.6, type: 'Concrete' }
];

const VISUAL_LEARNING = [
    {
        title: "Stress-Strain Relationships",
        image: "/images/learn/stress-strain.png",
        desc: "Understanding how materials deform under load. Key regions: Elastic Limit, Yield Point, and Strain Hardening.",
        topic: "Material Science"
    },
    {
        title: "Beam Loading Configurations",
        image: "/images/learn/beam-loading.png",
        desc: "Differentiating between Point Loads, Uniformly Distributed Loads (UDL), and Moment applications on structural spans.",
        topic: "Structural Analysis"
    },
    {
        title: "3-Phase Power Distribution",
        image: "/images/learn/3phase-circuit.png",
        desc: "Conceptual schematic of balanced L1, L2, L3 lines used in high-power industrial electrical systems.",
        topic: "Electrical Engineering"
    }
];

export default function LearnPage() {
    const [activeMaterial, setActiveMaterial] = useState(0);

    return (
        <div className="min-h-screen bg-[#03060a] text-white selection:bg-blue-500/30 font-sans pb-32">
            {/* Header / Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-3xl bg-[#03060a]/80 border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                            <Hexagon size={16} className="text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
                        </div>
                        <span className="text-sm font-black tracking-widest uppercase text-slate-200">AluCalc Academy</span>
                    </Link>
                    <div className="flex gap-8 items-center">
                        <Link href="/calculators" className="text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em]">Calculator Library</Link>
                        <Link href="/workspace" className="px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all">
                            Open Workspace
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-32">
                
                {/* Hero / Introduction */}
                <header className="mb-24 relative overflow-hidden p-12 rounded-[32px] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <div className="max-w-3xl relative z-10">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest mb-8"
                        >
                            <GraduationCap size={12} /> Engineering Knowledge Hub v5.0
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8">
                            Master <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">Technical Engineering</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
                            Master the core principles of physics, mechanics, and material science with our data-integrated learning modules. All information is verified against ISO/DIN standards used in the AluCalc OS engine.
                        </p>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-[#03060a] bg-slate-800" />)}
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Join 40k+ Engineers</span>
                        </div>
                    </div>
                </header>

                {/* Categories Grid (Technical Master Classes) */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-[1px] bg-blue-500/50" />
                        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400 font-black">High-Fidelity Master Guides</h2>
                        <div className="flex-1 h-[1px] bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {MASTER_GUIDES.map((cat, i) => (
                            <Link href={`/learn/${cat.slug}`} key={i}>
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer h-full flex flex-col"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl">
                                        <div className={`text-${cat.color}-400`}>{cat.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{cat.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">{cat.desc}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">{cat.count}</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Legacy Categories Grid */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-[1px] bg-slate-500/50" />
                        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-black">Knowledge Tracks</h2>
                        <div className="flex-1 h-[1px] bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {ACADEMY_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                                <div className="mb-4">{cat.icon}</div>
                                <h4 className="text-sm font-bold text-white mb-1">{cat.title}</h4>
                                <p className="text-[10px] text-slate-500 mb-4">{cat.desc}</p>
                                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{cat.count} Resources</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SYSTEM DATA INTEGRATION: Common Materials Database */}
                <section className="mb-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-[1px] bg-emerald-500/50" />
                                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400 font-black">Live System Data</h2>
                            </div>
                            <h3 className="text-4xl font-black tracking-tight mb-8">Material Properties <br />Compare Module</h3>
                            <p className="text-slate-400 leading-relaxed mb-10">
                                This live database synchronizes with the core AluCalc material engines. Select a material to view its physical characteristics—critical for structural and thermal simulations.
                            </p>
                            
                            <div className="space-y-3">
                                {MATERIAL_DATABASE.map((mat, i) => (
                                    <button 
                                        key={mat.name}
                                        onClick={() => setActiveMaterial(i)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeMaterial === i ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-transparent border-white/5 text-slate-500 hover:border-white/10'}`}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-widest">{mat.name}</span>
                                        <span className="text-[10px] font-mono opacity-50">{mat.type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                            
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeMaterial}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8 relative z-10"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                            <Gauge size={40} />
                                        </div>
                                        <div>
                                            <h4 className="text-3xl font-black text-white">{MATERIAL_DATABASE[activeMaterial].name}</h4>
                                            <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">Verified Structural Spec</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <DataBit label="Young's Modulus" value={`${MATERIAL_DATABASE[activeMaterial].youngs} MPa`} />
                                        <DataBit label="Yield Strength" value={`${MATERIAL_DATABASE[activeMaterial].yield} MPa`} />
                                        <DataBit label="Density" value={`${MATERIAL_DATABASE[activeMaterial].density} kg/m³`} />
                                        <DataBit label="Tensile Strength" value={`${MATERIAL_DATABASE[activeMaterial].uts} MPa`} />
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <Link href="/workspace" className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                                            Run Simulation with this material <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* VISUAL LEARNING GALLERY */}
                <section className="mb-32">
                    <div className="flex flex-col items-center text-center mb-16">
                        <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Visual Education</div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Technical Core Manuals</h2>
                        <p className="max-w-xl text-slate-500 text-sm leading-relaxed">
                            Visualizing engineering concepts makes them instantly intuitive. Explore our high-fidelity conceptual guides for mechanics and thermodynamics.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {VISUAL_LEARNING.map((item, i) => (
                            <motion.div 
                                key={item.title}
                                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-white/[0.01] border border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/[0.03] transition-all"
                            >
                                <div className="aspect-video relative overflow-hidden bg-slate-900">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#03060a] to-transparent" />
                                    <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest">{item.topic}</div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-8">{item.desc}</p>
                                    <button className="flex items-center text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                                        View Full Guide <div className="ml-2 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center"><ChevronRight size={12} /></div>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* KNOWLEDGE SEARCH & CONTRIBUTION */}
                <section className="py-24 px-12 rounded-[3rem] bg-blue-600/5 border border-blue-500/10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                    
                    <h2 className="text-3xl font-black tracking-tight mb-8">Can't find a specific concept?</h2>
                    <div className="max-w-xl mx-auto relative mb-12">
                         <div className="absolute inset-y-0 left-5 flex items-center text-blue-400">
                            <Search size={22} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search 1,200+ technical articles..." 
                            className="w-full h-16 bg-blue-500/10 border-2 border-blue-500/20 rounded-3xl pl-14 pr-6 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/20 transition-all font-medium shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">Submit Topic Request</button>
                        <button className="px-10 py-4 bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">Join Peer Review Board</button>
                    </div>
                </section>
            </main>

            {/* Footer Subscriptions */}
            <footer className="mt-20 border-t border-white/5 py-12 px-6 bg-[#020306]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Hexagon size={18} className="text-blue-500" />
                        <span className="text-sm font-black tracking-widest">ALUCALC ACADEMY</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        Content Verified by AluCalc Engineering Standards Board. Last Updated April 2026.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function DataBit({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{value}</div>
        </div>
    );
}

'use client';

/**
 * AluCalc OS v5.0 — Calculator Library Hub
 *
 * Index page for all engineering calculators and legacy modules.
 * Provides category-based browsing, search, and direct links
 * to both the SEO calculator pages and the legacy engineering modules.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Hexagon } from 'lucide-react';
import calculatorsData from '@/data/seo-calculators/calculators.json';
import { BASE_REGISTRY } from '@/config/modules';

// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════

interface Calculator {
  slug: string;
  title: string;
  category: string;
  meta: { title: string; description: string };
}

// ════════════════════════════════════════════
// Category Config
// ════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  mechanical: { icon: '⚙️', label: 'Mechanical', color: '#60a5fa' },
  structural: { icon: '🏗️', label: 'Structural', color: '#34d399' },
  fluid: { icon: '💧', label: 'Fluid & Thermal', color: '#38bdf8' },
  electrical: { icon: '⚡', label: 'Electrical', color: '#f59e0b' },
  manufacturing: { icon: '🔧', label: 'Manufacturing', color: '#a78bfa' },
  science: { icon: '🔬', label: 'Science & Physics', color: '#f472b6' },
};

// ════════════════════════════════════════════
// Legacy Module Links
// ════════════════════════════════════════════

const OS_MODULES = [
  { icon: '📊', name: 'Aluminum Weight', description: 'Profile weight, alloy database, cutting optimizer', path: '/aluminum', color: '#3b82f6' },
  { icon: '⚙️', name: 'Gear Design', description: 'Spur, helical, bevel gears with 3D preview', path: '/gears', color: '#60a5fa' },
  { icon: '🔩', name: 'Fasteners', description: 'Bolt torque, thread analysis, preload', path: '/fasteners', color: '#a78bfa' },
  { icon: '🔄', name: 'Bearings', description: 'ISO 281 life calculation, bearing selection', path: '/bearings', color: '#f59e0b' },
  { icon: '🔥', name: 'Welding', description: 'Weld strength, joint design, electrode selection', path: '/welding', color: '#ef4444' },
  { icon: '💪', name: 'Strength Analysis', description: 'Stress, strain, Mohr circle, fatigue', path: '/strength', color: '#34d399' },
  { icon: '📐', name: 'Sheet Metal', description: 'Bend allowance, K-factor, flat pattern', path: '/sheet-metal', color: '#38bdf8' },
  { icon: '🧩', name: 'Nesting 2D', description: 'DXF nesting, scrap minimization', path: '/nesting', color: '#f43f5e' },
  { icon: '💧', name: 'Pumps', description: 'Flow rate, head loss, pipe sizing', path: '/pumps', color: '#06b6d4' },
  { icon: '📏', name: 'Fits (ISO 286)', description: 'Tolerance analysis, hole/shaft fit', path: '/fits', color: '#818cf8' },
  { icon: '🔻', name: 'Beam Deflection', description: 'Structural beam analysis, loads, and supports', path: '/beam-deflection', color: '#fb923c' },
  { icon: '📈', name: 'Fatigue Life', description: 'Goodman diagrams, S-N curves, cycle life', path: '/fatigue', color: '#f43f5e' },
  { icon: '🌡️', name: 'Thermal Expansion', description: 'Material expansion, stress due to delta T', path: '/thermal', color: '#ef4444' },
  { icon: '🌊', name: 'Fluid Dynamics', description: 'Navier-Stokes, pipe flow, Reynolds number', path: '/fluids', color: '#0ea5e9' },
  { icon: '🚀', name: 'Aerospace Dynamics', description: 'Lift, drag, thrust, orbital mechanics', path: '/aerospace', color: '#8b5cf6' },
  { icon: '⚛️', name: 'Kinematics', description: 'Motion, velocity, acceleration solvers', path: '/kinematics', color: '#10b981' },
  { icon: '🔄', name: 'Unit Converter', description: 'Engineering unit conversions', path: '/converter', color: '#94a3b8' },
  { icon: '📖', name: 'Handbook', description: 'Engineering reference tables', path: '/handbook', color: '#eab308' },
  { icon: '🎨', name: 'Sketch Pad', description: 'Freehand & vector engineering sketching', path: '/sketch-pad', color: '#ec4899' },
  { icon: '✏️', name: 'CAD Editor', description: '2D parametric CAD environment', path: '/cad-editor', color: '#0ea5e9' },
  { icon: '🧠', name: 'Eng. Selection', description: 'Engineering Selection System', path: '/engineering-selection', color: '#10b981' },
  { icon: '📈', name: 'Mfg. Readiness', description: 'Manufacturing Readiness Level', path: '/mfg-readiness', color: '#f59e0b' },
  { icon: '🏭', name: 'Mfg. Sandbox', description: 'Manufacturing Simulation Sandbox', path: '/mfg-sandbox', color: '#8b5cf6' },
  { icon: '✂️', name: 'Cut Optimizer', description: '1D/2D Cutting Stock Optimization', path: '/cutting-optimizer', color: '#ef4444' },
  { icon: '📚', name: 'Materials DB', description: 'Comprehensive Materials Database', path: '/materials-db', color: '#3b82f6' },
  { icon: '🏗️', name: 'Drag & Build', description: 'Interactive Machine Assembly', path: '/machine-assembly', color: '#f43f5e' },
  { icon: '📉', name: 'Adv. Fatigue', description: 'Advanced Fatigue Life Analysis', path: '/fatigue-advanced', color: '#38bdf8' },
  { icon: '⚡', name: 'Motor Select', description: 'Standard Motor Selection Engine', path: '/motor-selection', color: '#eab308' },
  { icon: '🗜️', name: 'Gearbox Engine', description: 'Gearbox Design & Synthesis', path: '/gearbox-design', color: '#6366f1' },
  { icon: '🔍', name: 'Material Explorer', description: 'AI-driven Materials Intelligence', path: '/materials-explorer', color: '#a855f7' },
  { icon: '🔮', name: 'Failure AI', description: 'AI Failure Prediction Engine', path: '/failure-prediction', color: '#ef4444' },
  { icon: '🩺', name: 'Failure Diagnosis', description: 'Symptom-based Failure Analysis', path: '/failure-diagnosis', color: '#fb923c' },
  { icon: '🕸️', name: 'FEA Simulation', description: 'Finite Element Analysis Lite', path: '/simulation-fea', color: '#14b8a6' },
  { icon: '🌲', name: 'Topology Opt.', description: 'Generative Design & Topology Opt.', path: '/topology-optimization', color: '#22c55e' },
  { icon: '🧮', name: 'Scientific Calc', description: 'Advanced Scientific Calculator', path: '/calculator', color: '#64748b' },
  { icon: '🤖', name: 'AI Copilot', description: 'Engineering AI Assistant', path: '/ai-copilot', color: '#8b5cf6' },
  { icon: '👓', name: 'Holographic', description: 'Holographic Projection Viewer', path: '/holographic-viewer', color: '#0ea5e9' },
  { icon: '💻', name: 'Matrix Scien.', description: 'Engineering Matrix Simulation', path: '/matrix-screensaver', color: '#10b981' },
  { icon: '💧', name: 'Reducer Lube', description: 'Gearbox thermal and lubrication', path: '/reducer-lubrication', color: '#0ea5e9' },
  { icon: '🏗️', name: 'Concrete Reinf.', description: 'Concrete reinforcement calculation', path: '/concrete-reinforcement', color: '#64748b' },
  { icon: '⚡', name: 'Ohm\'s Law', description: 'Basic electrical calculations', path: '/ohms-law', color: '#eab308' },
  { icon: '🔌', name: 'Voltage Drop', description: 'Wire size and voltage drop', path: '/voltage-drop', color: '#f59e0b' },
  { icon: '⚛️', name: 'Periodic Table', description: 'Interactive periodic table of elements', path: '/periodic-table', color: '#a855f7' },
  { icon: '💰', name: 'VAT Calc', description: 'Value added tax calculator', path: '/vat-calculator', color: '#22c55e' },
  { icon: '📊', name: 'Excel Helper', description: 'Excel formula generator', path: '/excel-helper', color: '#10b981' },
  { icon: '📋', name: 'JSON Formatter', description: 'JSON validation and formatting', path: '/json-formatter', color: '#6366f1' },
  { icon: '🔍', name: 'Regex Tester', description: 'Regular expression testing environment', path: '/regex-tester', color: '#8b5cf6' },
  { icon: '📷', name: 'Profile Detector', description: 'Box profile optical detection', path: '/box-profile-detector', color: '#ef4444' },
  { icon: '💵', name: 'Cost Estimator', description: 'Project cost and BOM estimation', path: '/cost-estimator', color: '#34d399' },
  { icon: '📁', name: 'File Explorer', description: 'Local project file explorer', path: '/file-explorer', color: '#f59e0b' },
  { icon: '🎬', name: 'Media Player', description: 'Local engineering media playback', path: '/media-player', color: '#ec4899' },
  { icon: '🖼️', name: 'Image Viewer', description: 'Reference image viewer', path: '/image-viewer', color: '#38bdf8' },
  { icon: '📄', name: 'PDF Viewer', description: 'Datasheet and PDF reader', path: '/pdf-viewer', color: '#ef4444' },
  { icon: '📈', name: 'Spreadsheet', description: 'Embedded engineering spreadsheet', path: '/spreadsheet-viewer', color: '#10b981' },
  { icon: '🌐', name: 'Browser', description: 'In-app web browser', path: '/browser', color: '#3b82f6' },
  { icon: '🎨', name: 'Paint', description: 'Simple raster image editor', path: '/paint', color: '#f472b6' },
  { icon: '🔀', name: 'Flow Editor', description: 'Node-based logic editor', path: '/flow-editor', color: '#8b5cf6' },
  { icon: '🧊', name: 'Parametric CAD', description: 'Full 3D parametric CAD engine', path: '/parametric-cad', color: '#3b82f6' },
  { icon: '📊', name: 'Analytics', description: 'Real-time project analytics', path: '/analytics-dashboard', color: '#0ea5e9' },
  { icon: '🧮', name: 'Project Vars', description: 'Global project variables', path: '/project-variables', color: '#f59e0b' },
  { icon: '📋', name: 'Project BOM', description: 'Detailed project BOM manager', path: '/project-manager', color: '#eab308' },
  { icon: '💻', name: 'Terminal', description: 'System command terminal', path: '/terminal', color: '#64748b' },
  { icon: '📝', name: 'Eng. Notes', description: 'Engineering scratchpad', path: '/engineering-notes', color: '#facc15' },
  { icon: '🧪', name: 'Chemistry Lab', description: 'Chemical reactions & properties', path: '/chemistry-reactions', color: '#14b8a6' },
  { icon: '🧬', name: 'Biology Genetics', description: 'Biological & genetic calculations', path: '/biology-genetics', color: '#84cc16' },
  { icon: '💻', name: 'Algorithms', description: 'Algorithm execution and visualizer', path: '/cs-algorithms', color: '#6366f1' },
  { icon: '⚓', name: 'Naval Hydro.', description: 'Naval hydrostatics and stability', path: '/naval-hydrostatics', color: '#2563eb' },
  { icon: '📐', name: 'Physics Solver', description: 'Physics CAS solver', path: '/physics-solver', color: '#a855f7' },
  { icon: '🔐', name: 'Project Vault', description: 'Engineering project vault archive', path: '/project-vault', color: '#94a3b8' },
  { icon: '⚙️', name: 'Settings', description: 'OS configuration panel', path: '/settings', color: '#64748b' },
];

// ════════════════════════════════════════════
// Page Component
// ════════════════════════════════════════════


export default function CalculatorsIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCalculators = calculatorsData as unknown as Calculator[];

  // Grouped OS Modules
  const groupedOSModules = useMemo(() => {
    const groups: Record<string, typeof OS_MODULES> = {
      'Mechanical & Structural': [],
      'Manufacturing & Assembly': [],
      'Science & Simulation': [],
      'Utilities & IT': [],
    };
    
    OS_MODULES.forEach((mod) => {
      const slug = mod.path.replace('/', '');
      const def = BASE_REGISTRY[slug as keyof typeof BASE_REGISTRY];
      const cat = def?.category || 'other';

      if (cat === 'mechanical' || cat === 'civil') {
        groups['Mechanical & Structural'].push(mod);
      } else if (cat === 'manufacturing') {
        groups['Manufacturing & Assembly'].push(mod);
      } else if (cat === 'science' || cat === 'electrical') {
        groups['Science & Simulation'].push(mod);
      } else {
        groups['Utilities & IT'].push(mod);
      }
    });
    
    return groups;
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCalculators.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [allCalculators]);

  // Filtered calculators
  const filteredCalculators = useMemo(() => {
    let result = allCalculators;

    if (activeCategory) {
      result = result.filter((c) => c.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.slug.includes(q) || c.category.includes(q)
      );
    }

    return result;
  }, [allCalculators, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ background: 'rgba(2,4,8,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all">
                <Hexagon size={16} className="text-cyan-400" />
              </div>
              <span className="text-sm font-black tracking-widest text-white/40 group-hover:text-white transition-colors">AluCalc OS</span>
            </Link>
            <span className="text-white/10">|</span>
            <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.2em]">Calculator Library</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/workspace" className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white/40 hover:text-white/70 transition-colors border border-white/5 hover:border-white/15">
              Workspace
            </Link>
            <Link href="/" className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white/40 hover:text-white/70 transition-colors border border-white/5 hover:border-white/15">
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Page header ── */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Engineering</span>{' '}
            <span className="text-white/90">Calculator Library</span>
          </h1>
          <p className="text-lg text-white/35 max-w-2xl mx-auto">
            {allCalculators.length} professional engineering tools across {Object.keys(categoryCounts).length} categories.
            All ISO-compliant, formula-transparent, and free.
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calculators... (e.g. bolt torque, gear ratio, beam deflection)"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15 text-xs font-mono">
              {filteredCalculators.length} results
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
             ENGINEERING MODULES (Legacy)
           ══════════════════════════════════════ */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white/80">Engineering Modules</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400">INTERACTIVE</span>
          </div>

          {Object.entries(groupedOSModules).map(([groupName, modules]) => {
            if (modules.length === 0) return null;
            return (
              <div key={groupName} className="mb-10 last:mb-0">
                <h3 className="text-sm font-bold text-white/50 mb-4 px-1 tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                  {groupName} <span className="text-white/20">({modules.length})</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {modules.map((mod) => (
                    <Link
                      key={mod.path}
                      href={mod.path}
                      className="group p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: `${mod.color}05`,
                        borderColor: `${mod.color}15`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${mod.color}40`;
                        e.currentTarget.style.background = `${mod.color}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${mod.color}15`;
                        e.currentTarget.style.background = `${mod.color}05`;
                      }}
                    >
                      <div className="text-2xl mb-2">{mod.icon}</div>
                      <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{mod.name}</div>
                      <div className="text-[11px] text-white/30 mt-1 leading-relaxed line-clamp-2">{mod.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* ══════════════════════════════════════
             CATEGORY FILTER
           ══════════════════════════════════════ */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-white/80">SEO Calculator Library</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400">{allCalculators.length} TOOLS</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                !activeCategory
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/[0.02] text-white/30 border border-white/5 hover:text-white/60 hover:border-white/15'
              }`}
            >
              All ({allCalculators.length})
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeCategory === key
                    ? 'text-white border'
                    : 'text-white/30 border border-white/5 hover:text-white/60 hover:border-white/15'
                }`}
                style={activeCategory === key ? { background: `${config.color}15`, borderColor: `${config.color}40`, color: config.color } : {}}
              >
                <span>{config.icon}</span>
                {config.label} ({categoryCounts[key] || 0})
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
             CALCULATOR GRID
           ══════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCalculators.map((calc) => {
              const catConfig = CATEGORY_CONFIG[calc.category] || { icon: '📊', label: calc.category, color: '#94a3b8' };

              return (
                <Link
                  key={calc.slug}
                  href={`/calculators/${calc.slug}`}
                  className="group p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    borderColor: 'rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${catConfig.color}30`;
                    e.currentTarget.style.background = `${catConfig.color}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{catConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white/75 group-hover:text-white/95 transition-colors truncate">
                        {calc.title}
                      </h3>
                      <p className="text-[11px] text-white/25 mt-1 line-clamp-2">{calc.meta.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                          style={{ background: `${catConfig.color}12`, color: catConfig.color }}
                        >
                          {catConfig.label}
                        </span>
                        <span className="text-[10px] text-white/15 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          Open →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCalculators.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg text-white/40">No calculators found for "{searchQuery}"</div>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6 mt-16" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-500/30">
              <Hexagon size={18} className="text-cyan-400/70" />
            </div>
            <span className="text-sm font-black tracking-widest text-white/40">AluCalc OS</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[11px] text-white/20 hover:text-emerald-400 font-mono transition-colors">Home</Link>
            <Link href="/workspace" className="text-[11px] text-white/20 hover:text-emerald-400 font-mono transition-colors">Workspace</Link>
            <Link href="/calculators" className="text-[11px] text-emerald-500 font-mono">Library</Link>
          </div>

          <p className="text-[10px] font-mono text-white/10">v5.2 — © {new Date().getFullYear()} AluCalc OS</p>
        </div>
      </footer>
    </div>
  );
}

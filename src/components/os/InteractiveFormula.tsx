'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { evaluate } from 'mathjs';
import { 
  Zap, 
  Activity, 
  Info, 
  ArrowRight, 
  Share2, 
  Clipboard, 
  Check, 
  History, 
  TrendingUp, 
  ChevronRight,
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

interface InteractiveFormulaProps {
  id?: string;
  formula: string;
  variables: Record<string, string>;
}

const COLORS = {
  accent: '#00e5ff',
  glow: 'rgba(0, 229, 255, 0.3)',
};

// ════════════════════════════════════════════
// THEME SUB-COMPONENTS
// ════════════════════════════════════════════

const DataDisplay = ({ label, value, unit, icon: Icon, color = COLORS.accent }: any) => (
  <div className="relative group overflow-hidden bg-[#0a1018]/80 border border-white/5 rounded-2xl p-5 transition-all hover:border-[#00e5ff]/30 hover:scale-[1.01] duration-300">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-xl bg-black/40 text-[#00e5ff]">
        <Icon size={18} />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black font-mono tabular-nums tracking-tighter" style={{ color }}>
        {value}
      </span>
      <span className="text-xs font-mono text-white/20 uppercase">{unit}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: color }} />
  </div>
);

// Helper to clean LaTeX math expressions for Math.js
export function cleanFormulaExpression(expr: string, independentVars: string[]): string {
  let cleaned = expr.trim();
  cleaned = cleaned.replace(/\\left\(/g, '(');
  cleaned = cleaned.replace(/\\right\)/g, ')');
  cleaned = cleaned.replace(/\\left\[/g, '[');
  cleaned = cleaned.replace(/\\right\]/g, ']');
  cleaned = cleaned.replace(/\\left\\\{/g, '{');
  cleaned = cleaned.replace(/\\right\\\}/g, '}');
  cleaned = cleaned.replace(/\\vec\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\\vec\s+([a-zA-Z])/g, '$1');

  let index;
  while ((index = cleaned.indexOf('\\frac{')) !== -1) {
    let start = index + 5;
    let depth = 1;
    let i = start + 1;
    while (i < cleaned.length && depth > 0) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') depth--;
      i++;
    }
    if (depth > 0) break;
    const arg1 = cleaned.substring(start + 1, i - 1);

    let nextStart = i;
    while (nextStart < cleaned.length && /\s/.test(cleaned[nextStart])) {
      nextStart++;
    }
    if (cleaned[nextStart] !== '{') break;
    depth = 1;
    let j = nextStart + 1;
    while (j < cleaned.length && depth > 0) {
      if (cleaned[j] === '{') depth++;
      else if (cleaned[j] === '}') depth--;
      j++;
    }
    if (depth > 0) break;
    const arg2 = cleaned.substring(nextStart + 1, j - 1);

    cleaned = cleaned.substring(0, index) + '((' + arg1 + ')/(' + arg2 + '))' + cleaned.substring(j);
  }

  while ((index = cleaned.indexOf('\\sqrt{')) !== -1) {
    let start = index + 5;
    let depth = 1;
    let i = start + 1;
    while (i < cleaned.length && depth > 0) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') depth--;
      i++;
    }
    if (depth > 0) break;
    const arg = cleaned.substring(start + 1, i - 1);
    cleaned = cleaned.substring(0, index) + 'sqrt(' + arg + ')' + cleaned.substring(i);
  }

  cleaned = cleaned.replace(/\\cdot/g, '*');

  const greekLetters = [
    'sigma', 'tau', 'kappa', 'lambda', 'pi', 'eta', 'phi',
    'rho', 'Delta', 'theta', 'mu', 'alpha', 'beta', 'gamma',
    'epsilon', 'omega', 'psi', 'chi', 'cos', 'sin', 'tan', 'log', 'ln'
  ];
  greekLetters.forEach(g => {
    const regex = new RegExp('\\\\' + g + '\\b', 'g');
    cleaned = cleaned.replace(regex, g);
  });

  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)_\{([^}]+)\}/g, '$1_$2');

  if (independentVars.includes('cos_phi')) {
    cleaned = cleaned.replace(/cos\s*\\phi\b/g, 'cos_phi');
    cleaned = cleaned.replace(/cos\s+phi\b/g, 'cos_phi');
    cleaned = cleaned.replace(/cos\s*\(\s*phi\s*\)/g, 'cos_phi');
  }

  cleaned = cleaned.replace(/\b(cos|sin|tan|log|ln|sqrt)\s+([a-zA-Z0-9_]+)/g, '$1($2)');
  cleaned = cleaned.replace(/\\%/g, '');

  independentVars.forEach(v => {
    const regex = new RegExp('\\b' + v + '\\s*\\(', 'g');
    cleaned = cleaned.replace(regex, v + ' * (');
  });

  cleaned = cleaned.replace(/\\/g, '');
  return cleaned;
}

// ════════════════════════════════════════════
// DYNAMIC DEFAULT PICKER
// ════════════════════════════════════════════

function getDefaultValueForVariable(name: string, description: string): string {
  const desc = description.toLowerCase();
  
  const eqMatch = description.match(/(?:(?:default|typical|e\.g\.|like)\s*[:=]?\s*|([A-Za-z]+)\s*=\s*)(\d+(?:\.\d+)?)/i);
  if (eqMatch) {
    return eqMatch[2];
  }
  
  const rangeMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const start = parseFloat(rangeMatch[1]);
    const end = parseFloat(rangeMatch[2]);
    if (start < end) {
      const mid = (start + end) / 2;
      return String(Number(mid.toFixed(4)));
    }
  }

  switch (name) {
    case 'K': return '0.15';
    case 'F': return '40000';
    case 'd': return '0.012';
    case 'sigma_x': return '100';
    case 'sigma_y': return '50';
    case 'tau_xy': return '30';
    case 'P': return '15000';
    case 'V': return '380';
    case 'cos_phi': return '0.85';
    case 'L': return '100';
    case 'kappa': return '1.5';
    case 'S': return '2.5';
    case 'E': return '210000';
    case 'Sy': return '250';
    case 'I': return '5000';
    case 'A': return '100';
    case 'C': return '28000';
    case 'p': return '3';
    case 'n': return '1500';
    case 'a1': return '1.0';
    case 'eC': return '0.5';
    default:
      const numMatch = description.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        return numMatch[1];
      }
      return '1.0';
  }
}

// ════════════════════════════════════════════
// CUSTOM SUB-CALCULATORS
// ════════════════════════════════════════════

// 1. BEARING LIFE (ISO 281)
const BearingLifeCalculator = () => {
  const [C, setC] = useState<number>(28000);
  const [P, setP] = useState<number>(4000);
  const [p, setPExponent] = useState<number>(3);
  const [n, setN] = useState<number>(1500);
  const [a1, setA1] = useState<number>(1.0);
  const [kappa, setKappa] = useState<number>(1.5);
  const [eC, setEC] = useState<number>(0.5);

  const aISO = useMemo(() => {
    // Standard ISO 281 approximation
    const Cu = 0.08 * C; // fatigue load limit estimate
    const ratio = (eC * Cu) / P;
    const factor = 0.1 * Math.pow(ratio, 0.4) * Math.pow(kappa, 0.6);
    return Math.min(50, Math.max(0.005, factor));
  }, [C, P, eC, kappa]);

  const Lnm = useMemo(() => {
    return a1 * aISO * Math.pow(C / P, p); // Million revs
  }, [a1, aISO, C, P, p]);

  const Lnmh = useMemo(() => {
    return (Lnm * 1e6) / (60 * n); // hours
  }, [Lnm, n]);

  return (
    <div className="space-y-6">
      <div className="bg-[#0a1018]/20 backdrop-blur-xl border border-white/5 p-5 rounded-2xl">
        <h3 className="text-xs font-mono text-[#00e5ff] uppercase tracking-widest mb-4">ISO 281 Expanded Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">C: Dynamic Load Rating (N)</label>
              <input type="number" value={C} onChange={(e) => setC(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">P: Equivalent Dynamic Load (N)</label>
              <input type="number" value={P} onChange={(e) => setP(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">n: Rotational Speed (rpm)</label>
              <input type="number" value={n} onChange={(e) => setN(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Bearing Exponent (p)</label>
              <select value={p} onChange={(e) => setPExponent(parseFloat(e.target.value))} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value={3}>Ball Bearings (p=3)</option>
                <option value={3.3333}>Roller Bearings (p=3.33)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">a1: Reliability Factor</label>
              <select value={a1} onChange={(e) => setA1(parseFloat(e.target.value))} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value={1.0}>90% Reliability (a1 = 1.00)</option>
                <option value={0.62}>95% Reliability (a1 = 0.62)</option>
                <option value={0.21}>99% Reliability (a1 = 0.21)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">eC: Contamination Factor</label>
              <select value={eC} onChange={(e) => setEC(parseFloat(e.target.value))} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value={0.8}>Ultra Clean Lubrication (eC = 0.8)</option>
                <option value={0.5}>Clean Lubrication (eC = 0.5)</option>
                <option value={0.3}>Typical Industrial (eC = 0.3)</option>
                <option value={0.1}>Severe Contamination (eC = 0.1)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-white/40 uppercase font-mono">κ (kappa): Viscosity Ratio ({kappa})</label>
              </div>
              <input type="range" min="0.1" max="10" step="0.1" value={kappa} onChange={(e) => setKappa(parseFloat(e.target.value))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00e5ff]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DataDisplay label="aISO Mod. Factor" value={aISO.toFixed(3)} unit="dimensionless" icon={Activity} />
        <DataDisplay label="Lnm Rating Life" value={Lnm.toFixed(2)} unit="Million Revs" icon={TrendingUp} />
        <DataDisplay label="Lnmh Operating Life" value={Math.round(Lnmh).toLocaleString()} unit="Hours" icon={ShieldCheck} />
      </div>

      <div className="p-4 bg-[#00e5ff]/5 border border-[#00e5ff]/10 rounded-xl text-[10px] font-mono text-white/40">
        <span className="text-[#00e5ff]">Note:</span> {"$a_{ISO}$"} is approximated as a function of lubrication quality ($\kappa$), contamination factor ($e_C$), and fatigue limit load ratio ($C_u/P$) following standard ISO 281:2007 Annex guidelines. Catalog values modeled from SKF / Schaeffler design references.
      </div>
    </div>
  );
};

// 2. BOLT FATIGUE (VDI 2230)
const BoltFatigueCalculator = () => {
  const [grade, setGrade] = useState<'8.8' | '10.9' | '12.9'>('8.8');
  const [size, setSize] = useState<string>('M12');
  const [Fmax, setFmax] = useState<number>(25000);
  const [Fmin, setFmin] = useState<number>(5000);
  const [targetSF, setTargetSF] = useState<number>(2.0);

  const boltSizes: Record<string, number> = {
    M6: 20.1, M8: 36.6, M10: 58.0, M12: 84.3, M16: 157, M20: 245, M24: 353, M30: 561, M36: 817
  };

  const boltGrades = {
    '8.8': { Su: 800, Sy: 640 },
    '10.9': { Su: 1000, Sy: 900 },
    '12.9': { Su: 1200, Sy: 1080 }
  };

  const As = boltSizes[size] || 84.3;
  const { Su, Sy } = boltGrades[grade];
  const Se = 0.5 * Su; // Endurance limit

  const sigma_max = Fmax / As; // MPa
  const sigma_min = Fmin / As; // MPa
  const sigma_a = (Fmax - Fmin) / (2 * As); // MPa
  const sigma_m = (Fmax + Fmin) / (2 * As); // MPa

  const SF_calc = 1 / (sigma_a / Se + sigma_m / Su);
  const ratio = (sigma_a / Se + sigma_m / Su) * 100;

  const status = useMemo(() => {
    if (SF_calc < 1.0 || ratio > 100) return { label: 'FAIL', color: '#ff4d4d' };
    if (SF_calc < targetSF) return { label: 'MARGINAL', color: '#ffb300' };
    return { label: 'SAFE', color: '#2ecc71' };
  }, [SF_calc, targetSF, ratio]);

  return (
    <div className="space-y-6">
      <div className="bg-[#0a1018]/20 backdrop-blur-xl border border-white/5 p-5 rounded-2xl">
        <h3 className="text-xs font-mono text-[#00e5ff] uppercase tracking-widest mb-4">VDI 2230 Fatigue Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Bolt Material Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value as any)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value="8.8">Grade 8.8 (Su=800 MPa, Sy=640 MPa)</option>
                <option value="10.9">Grade 10.9 (Su=1000 MPa, Sy=900 MPa)</option>
                <option value="12.9">Grade 12.9 (Su=1200 MPa, Sy=1080 MPa)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Bolt Thread Designation</label>
              <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                {Object.keys(boltSizes).map((s) => (
                  <option key={s} value={s}>{s} (Stress Area: {boltSizes[s]} mm²)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Fmax: Peak Load (N)</label>
              <input type="number" value={Fmax} onChange={(e) => setFmax(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Fmin: Minimum Load (N)</label>
              <input type="number" value={Fmin} onChange={(e) => setFmin(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Target Safety Factor (SF)</label>
              <input type="number" step="0.1" value={targetSF} onChange={(e) => setTargetSF(parseFloat(e.target.value) || 1)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-black/40 p-4 rounded-xl border border-white/5 relative">
            <span className="absolute top-2 left-4 text-[9px] font-mono text-white/30 uppercase">Goodman Fatigue Diagram</span>
            
            {/* SVG Goodman Diagram */}
            <svg width="220" height="220" viewBox="0 0 220 220" className="mt-4 overflow-visible">
              {/* Axes */}
              <line x1="20" y1="200" x2="210" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <line x1="20" y1="20" x2="20" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              
              {/* Labels */}
              <text x="110" y="215" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" className="font-mono">Mean Stress σm</text>
              <text x="8" y="110" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" transform="rotate(-90 8 110)" className="font-mono">Amp Stress σa</text>
              
              {/* Goodman Envelope Line (Se = 100 px, Su = 180 px on scaled axis) */}
              {/* Scaling factors: 180px = Su, 200px = Origin at (20,200) */}
              {/* Goodman line from (20, 200 - Se_scale) to (20 + Su_scale, 200) */}
              {(() => {
                const maxVal = Su;
                const scaleX = (val: number) => 20 + (val / maxVal) * 160;
                const scaleY = (val: number) => 200 - (val / maxVal) * 160;
                
                const Se_y = scaleY(Se);
                const Su_x = scaleX(Su);
                const Sy_x = scaleX(Sy);
                const Sy_y = scaleY(Sy);
                
                const op_x = scaleX(sigma_m);
                const op_y = scaleY(sigma_a);

                return (
                  <>
                    {/* Safe Region Shading */}
                    <polygon 
                      points={`20,200 20,${Se_y} ${Su_x},200`} 
                      fill="rgba(46, 204, 113, 0.08)" 
                      stroke="rgba(46, 204, 113, 0.4)" 
                      strokeWidth="1.5" 
                    />
                    {/* Yield Line */}
                    <line x1="20" y1={Sy_y} x2={Sy_x} y2="200" stroke="rgba(231, 76, 60, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
                    
                    {/* Tick labels */}
                    <text x={Su_x} y="208" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle" className="font-mono">Su</text>
                    <text x="12" y={Se_y} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end" className="font-mono">Se</text>
                    
                    {/* Operating Stress Point */}
                    <circle cx={op_x} cy={op_y} r="4" fill={status.color} className="animate-pulse" />
                    <circle cx={op_x} cy={op_y} r="7" stroke={status.color} strokeWidth="1" fill="none" opacity="0.4" />
                  </>
                );
              })()}
            </svg>
            <span className="text-[9px] font-mono mt-2" style={{ color: status.color }}>State: {status.label} ({ratio.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DataDisplay label="Mean Stress σm" value={Math.round(sigma_m)} unit="MPa" icon={Activity} />
        <DataDisplay label="Amp Stress σa" value={Math.round(sigma_a)} unit="MPa" icon={TrendingUp} />
        <DataDisplay label="Safety Factor SF" value={SF_calc > 0 && SF_calc < 100 ? SF_calc.toFixed(2) : 'N/A'} unit={`Target: ${targetSF}`} icon={ShieldCheck} color={status.color} />
      </div>
    </div>
  );
};

// 3. SHAFT FATIGUE (ASME + SODERBERG)
const ShaftFatigueCalculator = () => {
  const [d, setD] = useState<number>(40);
  const [M, setM] = useState<number>(400);
  const [T, setT] = useState<number>(600);
  const [material, setMaterial] = useState<'1045' | '4140' | '4340'>('1045');
  const [ka, setKa] = useState<number>(0.8);
  const [targetSF, setTargetSF] = useState<number>(1.5);

  const materials = {
    '1045': { Sy: 310, Su: 570, label: 'AISI 1045 Carbon Steel' },
    '4140': { Sy: 655, Su: 950, label: 'AISI 4140 Alloy Steel' },
    '4340': { Sy: 850, Su: 1010, label: 'AISI 4340 High Strength' }
  };

  const { Sy, Su, label: matLabel } = materials[material];
  
  // Calculate size factor kb dynamically based on diameter
  const kb = useMemo(() => {
    if (d <= 8) return 1.0;
    if (d <= 50) return 1.24 * Math.pow(d, -0.107);
    if (d <= 250) return 1.51 * Math.pow(d, -0.157);
    return 0.60;
  }, [d]);

  const Se = ka * kb * 0.5 * Su; // corrected endurance limit

  const sigma_a = (32 * M * 1000) / (Math.PI * Math.pow(d, 3)); // bending amplitude (MPa)
  const tau_m = (16 * T * 1000) / (Math.PI * Math.pow(d, 3)); // steady shear stress (MPa)

  const sigma_a_VM = sigma_a;
  const sigma_m_VM = Math.sqrt(3) * tau_m;

  const SoderbergRatio = (sigma_a_VM / Se + sigma_m_VM / Sy) * 100;
  const SF_calc = 1 / (sigma_a_VM / Se + sigma_m_VM / Sy);

  // Numerical solver for minimum safe diameter (where SF = targetSF)
  const d_safe = useMemo(() => {
    let guess = 10;
    for (let i = 0; i < 6; i++) {
      const current_kb = guess <= 8 ? 1.0 : guess <= 50 ? 1.24 * Math.pow(guess, -0.107) : 1.51 * Math.pow(guess, -0.157);
      const current_Se = ka * current_kb * 0.5 * Su;
      const c1 = (32 * M * 1000) / (Math.PI * current_Se);
      const c2 = (Math.sqrt(3) * 16 * T * 1000) / (Math.PI * Sy);
      guess = Math.pow(targetSF * (c1 + c2), 1/3);
    }
    return guess;
  }, [M, T, ka, Su, Sy, targetSF]);

  const status = useMemo(() => {
    if (SF_calc < 1.0 || SoderbergRatio > 100) return { label: 'FAIL', color: '#ff4d4d' };
    if (SF_calc < targetSF) return { label: 'MARGINAL', color: '#ffb300' };
    return { label: 'SAFE', color: '#2ecc71' };
  }, [SF_calc, targetSF, SoderbergRatio]);

  return (
    <div className="space-y-6">
      <div className="bg-[#0a1018]/20 backdrop-blur-xl border border-white/5 p-5 rounded-2xl">
        <h3 className="text-xs font-mono text-[#00e5ff] uppercase tracking-widest mb-4">ASME / Soderberg Shaft Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Shaft Material</label>
              <select value={material} onChange={(e) => setMaterial(e.target.value as any)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value="1045">AISI 1045 (Sy=310 MPa, Su=570 MPa)</option>
                <option value="4140">AISI 4140 (Sy=655 MPa, Su=950 MPa)</option>
                <option value="4340">AISI 4340 (Sy=850 MPa, Su=1010 MPa)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">Shaft Diameter d (mm)</label>
              <input type="number" value={d} onChange={(e) => setD(parseFloat(e.target.value) || 1)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">M: Bending Moment (N·m)</label>
              <input type="number" value={M} onChange={(e) => setM(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">T: Torsional Moment (N·m)</label>
              <input type="number" value={T} onChange={(e) => setT(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-mono mb-1">ka: Surface Finish Factor</label>
              <select value={ka} onChange={(e) => setKa(parseFloat(e.target.value))} className="w-full bg-[#0a1018] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono">
                <option value={0.9}>Ground Finish (ka = 0.90)</option>
                <option value={0.8}>Machined Finish (ka = 0.80)</option>
                <option value={0.7}>Hot-Rolled (ka = 0.70)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-black/40 p-4 rounded-xl border border-white/5 relative">
            <span className="absolute top-2 left-4 text-[9px] font-mono text-white/30 uppercase">Soderberg Yield Diagram</span>
            
            {/* SVG Soderberg Diagram */}
            <svg width="220" height="220" viewBox="0 0 220 220" className="mt-4 overflow-visible">
              <line x1="20" y1="200" x2="210" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <line x1="20" y1="20" x2="20" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              
              <text x="110" y="215" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" className="font-mono">Mean stress σ'm (Von Mises)</text>
              <text x="8" y="110" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" transform="rotate(-90 8 110)" className="font-mono">Amp Stress σ'a</text>
              
              {(() => {
                const maxVal = Sy;
                const scaleX = (val: number) => 20 + (val / maxVal) * 160;
                const scaleY = (val: number) => 200 - (val / maxVal) * 160;
                
                const Se_y = scaleY(Se);
                const Sy_x = scaleX(Sy);
                
                const op_x = scaleX(sigma_m_VM);
                const op_y = scaleY(sigma_a_VM);

                return (
                  <>
                    {/* Soderberg Limit Line */}
                    <polygon 
                      points={`20,200 20,${Se_y} ${Sy_x},200`} 
                      fill="rgba(46, 204, 113, 0.08)" 
                      stroke="rgba(46, 204, 113, 0.4)" 
                      strokeWidth="1.5" 
                    />
                    
                    <text x={Sy_x} y="208" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle" className="font-mono">Sy</text>
                    <text x="12" y={Se_y} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end" className="font-mono">Se</text>
                    
                    {/* Operating stress point */}
                    <circle cx={op_x} cy={op_y} r="4" fill={status.color} className="animate-pulse" />
                    <circle cx={op_x} cy={op_y} r="7" stroke={status.color} strokeWidth="1" fill="none" opacity="0.4" />
                  </>
                );
              })()}
            </svg>
            <span className="text-[9px] font-mono mt-2" style={{ color: status.color }}>Soderberg Ratio: {SoderbergRatio.toFixed(1)}% ({status.label})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DataDisplay label="Von Mises Mean Stress" value={Math.round(sigma_m_VM)} unit="MPa" icon={Activity} />
        <DataDisplay label="Von Mises Amp Stress" value={Math.round(sigma_a_VM)} unit="MPa" icon={TrendingUp} />
        <DataDisplay label="Safety Factor (Min Size)" value={SF_calc > 0 && SF_calc < 100 ? SF_calc.toFixed(2) : 'N/A'} unit={`Rec Min: ${d_safe.toFixed(1)} mm`} icon={ShieldCheck} color={status.color} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// MAIN ENGINE COMPONENT
// ════════════════════════════════════════════

export const InteractiveFormula: React.FC<InteractiveFormulaProps> = ({ id, formula, variables }) => {
  // If it's a custom bearing life, VDI fatigue, or shaft fatigue, dispatch immediately
  if (id === 'bearing-life-calc') {
    return <BearingLifeCalculator />;
  }
  if (id === 'bolt-fatigue-calc') {
    return <BoltFatigueCalculator />;
  }
  if (id === 'shaft-fatigue-calc') {
    return <ShaftFatigueCalculator />;
  }

  // Generic Calculator Parsing System
  const [resultVar, expressionStr] = useMemo(() => {
    let eq = formula.trim()
      .replace(/×/g, '*')
      .replace(/÷/g, '/');
      
    if (eq.includes('=')) {
      const parts = eq.split('=');
      const rVar = parts[0].trim().replace(/\\/g, '').replace(/%/g, '');
      return [rVar, parts[1].trim()];
    }
    return ['Result', eq];
  }, [formula]);

  const independentVars = useMemo(() => {
    return Object.keys(variables).filter(v => v !== resultVar);
  }, [variables, resultVar]);

  // Read initial values from URL query string or defaults
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const defaultVals: Record<string, string> = {};
    let urlParams: URLSearchParams | null = null;
    if (typeof window !== 'undefined') {
      urlParams = new URLSearchParams(window.location.search);
    }

    independentVars.forEach(v => {
      const urlVal = urlParams?.get(v);
      if (urlVal !== null && urlVal !== undefined && urlVal !== '') {
        defaultVals[v] = urlVal;
      } else {
        defaultVals[v] = getDefaultValueForVariable(v, variables[v] || '');
      }
    });
    return defaultVals;
  });

  // Tolerance state (0-20% slider)
  const [tolerances, setTolerances] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    independentVars.forEach(v => { init[v] = 0; });
    return init;
  });

  const [result, setResult] = useState<number | null>(null);
  const [errorChart, setErrorChart] = useState<string | null>(null);
  const [toleranceRange, setToleranceRange] = useState<{ min: number; max: number } | null>(null);

  // Sync inputs with URL query string
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      let changed = false;
      Object.entries(inputs).forEach(([k, v]) => {
        if (v !== '') {
          url.searchParams.set(k, v);
          changed = true;
        } else {
          url.searchParams.delete(k);
        }
      });
      if (changed) {
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, [inputs]);

  // Listen to Decoupled Table Row Click Event
  useEffect(() => {
    const handleSetInput = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.name && independentVars.includes(customEvent.detail.name)) {
        setInputs(prev => ({ ...prev, [customEvent.detail.name]: String(customEvent.detail.value) }));
      }
    };
    window.addEventListener('set-calculator-input', handleSetInput);
    return () => window.removeEventListener('set-calculator-input', handleSetInput);
  }, [independentVars]);

  // Main evaluation logic
  useEffect(() => {
    try {
      const scope: Record<string, number> = {};
      let allFilled = true;

      for (const v of independentVars) {
        if (inputs[v] === '' || isNaN(Number(inputs[v]))) {
          allFilled = false;
          break;
        }
        scope[v] = Number(inputs[v]);
      }

      if (allFilled) {
        const cleanedExpr = cleanFormulaExpression(expressionStr, independentVars);
        const finalVal = evaluate(cleanedExpr, scope);
        setResult(finalVal);
        setErrorChart(null);

        // Calculate Tolerance bounds
        let minVal = finalVal;
        let maxVal = finalVal;
        const hasTolerance = Object.values(tolerances).some(t => t > 0);
        if (hasTolerance) {
          const keys = Object.keys(scope);
          const combos = [{} as Record<string, number>];
          
          keys.forEach(k => {
            const val = scope[k];
            const tol = tolerances[k] || 0;
            const vMin = val * (1 - tol / 100);
            const vMax = val * (1 + tol / 100);
            
            const newCombos: Record<string, number>[] = [];
            combos.forEach(c => {
              newCombos.push({ ...c, [k]: vMin });
              newCombos.push({ ...c, [k]: vMax });
            });
            combos.length = 0;
            combos.push(...newCombos);
          });

          let first = true;
          combos.forEach(c => {
            try {
              const val = evaluate(cleanedExpr, c);
              if (typeof val === 'number' && !isNaN(val)) {
                if (first) {
                  minVal = val;
                  maxVal = val;
                  first = false;
                } else {
                  if (val < minVal) minVal = val;
                  if (val > maxVal) maxVal = val;
                }
              }
            } catch(e) {}
          });
          setToleranceRange({ min: minVal, max: maxVal });
        } else {
          setToleranceRange(null);
        }
      } else {
        setResult(null);
        setToleranceRange(null);
      }
    } catch (e: any) {
      setResult(null);
      setToleranceRange(null);
      setErrorChart("Formula parse error: " + e.message);
    }
  }, [inputs, expressionStr, independentVars, tolerances]);

  // Unit conversion logic
  const unitOptions = useMemo(() => {
    const defaultUnit = variables[resultVar] || '';
    if (defaultUnit.toLowerCase().includes('n·m') || defaultUnit.toLowerCase().includes('torque')) {
      return [
        { label: 'N·m', factor: 1 },
        { label: 'ft·lb', factor: 0.73756 },
        { label: 'kgf·cm', factor: 10.197 }
      ];
    }
    if (defaultUnit.toLowerCase().includes('mpa') || defaultUnit.toLowerCase().includes('stress')) {
      return [
        { label: 'MPa', factor: 1 },
        { label: 'psi', factor: 145.038 },
        { label: 'bar', factor: 10 }
      ];
    }
    if (defaultUnit.toLowerCase().includes('(m)') || defaultUnit === 'm') {
      return [
        { label: 'm', factor: 1 },
        { label: 'mm', factor: 1000 },
        { label: 'in', factor: 39.37 }
      ];
    }
    return null;
  }, [variables, resultVar]);

  const [activeUnit, setActiveUnit] = useState<string>('');
  const [factor, setFactor] = useState<number>(1);

  useEffect(() => {
    if (unitOptions && unitOptions.length > 0) {
      setActiveUnit(unitOptions[0].label);
      setFactor(1);
    } else {
      setActiveUnit(variables[resultVar] || '');
      setFactor(1);
    }
  }, [unitOptions, variables, resultVar]);

  // Save calculation history log
  useEffect(() => {
    if (result !== null) {
      const historyKey = `calc_history_${id || 'default'}`;
      try {
        const existingRaw = localStorage.getItem(historyKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const currentInputsStr = JSON.stringify(inputs);

        if (existing.length > 0 && JSON.stringify(existing[0].inputs) === currentInputsStr) {
          return;
        }

        const newItem = {
          timestamp: new Date().toISOString(),
          inputs: { ...inputs },
          result: result
        };

        const updated = [newItem, ...existing.filter((item: any) => JSON.stringify(item.inputs) !== currentInputsStr)].slice(0, 10);
        localStorage.setItem(historyKey, JSON.stringify(updated));
        window.dispatchEvent(new Event('calc-history-updated'));
      } catch (err) {
        console.error("Failed to save history:", err);
      }
    }
  }, [result, inputs, id]);

  const [copiedShare, setCopiedShare] = useState(false);
  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Formula Card */}
      <div className="bg-[#0a1018]/20 backdrop-blur-xl border border-white/5 p-6 rounded-2xl font-mono text-lg text-[#00e5ff] flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-4 bg-[#00e5ff] rounded-full"></span>
          <span>{formula}</span>
        </div>
        <button 
          onClick={copyShareLink} 
          title="Copy share link with these parameters"
          className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-white/60 font-mono transition-all"
        >
          {copiedShare ? <Check size={12} className="text-[#00e5ff]" /> : <Share2 size={12} />}
          <span>{copiedShare ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {errorChart && (
        <div className="text-red-400 text-xs font-mono px-2 bg-red-500/10 py-2 border border-red-500/20 rounded-xl flex items-center gap-2">
          <AlertTriangle size={14} />
          {errorChart}
        </div>
      )}

      {/* Inputs Section */}
      <div className="space-y-6 bg-[#0a1018]/10 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Parameters Configuration</h3>
          <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-white/30">Interactive Solver</span>
        </div>

        <div className="space-y-6">
          {independentVars.map((v) => {
            const numericVal = Number(inputs[v]) || 0;
            const maxVal = numericVal > 0 ? numericVal * 2 : 100;
            const stepVal = numericVal > 0 ? Math.min(0.1, numericVal / 50) : 1;

            return (
              <div key={v} className="space-y-2 p-3 bg-black/10 rounded-xl border border-white/[0.02] hover:border-white/5 transition-all">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-xs font-bold text-[#00e5ff] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]/50"></span>
                    {v} <span className="text-[10px] text-white/30 font-normal normal-case">— {variables[v]}</span>
                  </label>
                  <input
                    type="number"
                    value={inputs[v]}
                    onChange={(e) => setInputs({ ...inputs, [v]: e.target.value })}
                    placeholder="Value"
                    className="w-24 bg-[#0a1018] border border-white/10 focus:border-[#00e5ff]/50 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none"
                  />
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max={maxVal}
                  step={stepVal}
                  value={inputs[v] === '' ? '0' : inputs[v]}
                  onChange={(e) => setInputs({ ...inputs, [v]: e.target.value })}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                />

                {/* Tolerance slider */}
                <div className="flex items-center justify-between text-[9px] font-mono text-white/20 pt-1.5 border-t border-white/[0.02] mt-1">
                  <span>Tolerance limit</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={tolerances[v] || 0}
                      onChange={(e) => setTolerances({ ...tolerances, [v]: parseInt(e.target.value) || 0 })}
                      className="w-20 h-0.5 bg-white/5 rounded appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-emerald-500/80">±{tolerances[v] || 0}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculated Display Output Card */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <DataDisplay
              label={`Calculated Output (${resultVar})`}
              value={result !== null ? (Number.isInteger(result * factor) ? (result * factor).toLocaleString() : (result * factor).toFixed(5)) : 'Waiting...'}
              unit={activeUnit}
              icon={Activity}
            />

            {/* Tolerance range output */}
            {toleranceRange && (
              <div className="mt-2 text-[10px] font-mono text-emerald-400/70 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-lg flex justify-between">
                <span>Worst-case bounds (under tolerance limits)</span>
                <span>
                  {(toleranceRange.min * factor).toFixed(4)} ↔ {(toleranceRange.max * factor).toFixed(4)} {activeUnit}
                </span>
              </div>
            )}
          </div>

          {/* Unit Switcher */}
          {unitOptions && (
            <div className="flex flex-col bg-black/30 border border-white/5 p-3 rounded-2xl shrink-0 self-stretch justify-center items-center">
              <label className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Convert Unit</label>
              <div className="flex gap-1">
                {unitOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setActiveUnit(opt.label);
                      setFactor(opt.factor);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all font-mono border ${activeUnit === opt.label ? 'bg-[#00e5ff] border-[#00e5ff] text-black shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

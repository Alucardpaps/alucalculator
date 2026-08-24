'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Hexagon, Play, Sparkles, Terminal, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getSiteNav } from '@/locales/siteNav';

export default function AIAnalysisPage() {
  const { language } = useI18nStore();
  const nav = getSiteNav(language);
  const [calcId, setCalcId] = useState<string>('bolt-torque-calc');
  const [inputs, setInputs] = useState<Record<string, string>>({
    // Bolt Torque defaults
    K: '0.15', F: '40000', d: '0.012',
    // Bearing Life defaults
    C: '28000', P: '4000', p: '3', n: '1500', a1: '1.0', kappa: '1.5', eC: '0.5',
    // Bolt Fatigue defaults
    grade: '8.8', size: 'M12', Fmax: '25000', Fmin: '5000', targetSF: '2.0',
    // Shaft Fatigue defaults
    shaft_d: '40', shaft_M: '400', shaft_T: '600', material: '1045', ka: '0.8', shaft_targetSF: '1.5'
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom during streaming
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Derived calculation results for AI context
  const calculatedResult = React.useMemo(() => {
    try {
      if (calcId === 'bolt-torque-calc') {
        const K = parseFloat(inputs.K);
        const F = parseFloat(inputs.F);
        const d = parseFloat(inputs.d);
        return `${K * F * d} N·m`;
      }
      if (calcId === 'bearing-life-calc') {
        const C = parseFloat(inputs.C);
        const P = parseFloat(inputs.P);
        const p_val = parseFloat(inputs.p);
        const a1_val = parseFloat(inputs.a1);
        const kappa_val = parseFloat(inputs.kappa);
        const eC_val = parseFloat(inputs.eC);
        const Cu = 0.08 * C;
        const aISO = Math.min(50, Math.max(0.005, 0.1 * Math.pow((eC_val * Cu) / P, 0.4) * Math.pow(kappa_val, 0.6)));
        const Lnm = a1_val * aISO * Math.pow(C / P, p_val);
        return `${Lnm.toFixed(2)} Million revolutions`;
      }
      if (calcId === 'bolt-fatigue-calc') {
        const boltSizes: Record<string, number> = { M6: 20.1, M8: 36.6, M10: 58, M12: 84.3, M16: 157, M20: 245, M24: 353 };
        const As = boltSizes[inputs.size] || 84.3;
        const Fmax_v = parseFloat(inputs.Fmax);
        const Fmin_v = parseFloat(inputs.Fmin);
        const sigma_a = (Fmax_v - Fmin_v) / (2 * As);
        const sigma_m = (Fmax_v + Fmin_v) / (2 * As);
        const Su = inputs.grade === '8.8' ? 800 : inputs.grade === '10.9' ? 1000 : 1200;
        const Se = 0.5 * Su;
        const SF = 1 / (sigma_a / Se + sigma_m / Su);
        return `Safety Factor: ${SF.toFixed(2)}`;
      }
      if (calcId === 'shaft-fatigue-calc') {
        const d_v = parseFloat(inputs.shaft_d);
        const M_v = parseFloat(inputs.shaft_M);
        const T_v = parseFloat(inputs.shaft_T);
        const Su = inputs.material === '1045' ? 570 : inputs.material === '4140' ? 950 : 1010;
        const Sy = inputs.material === '1045' ? 310 : inputs.material === '4140' ? 655 : 850;
        const kb = d_v <= 8 ? 1 : d_v <= 50 ? 1.24 * Math.pow(d_v, -0.107) : 1.51 * Math.pow(d_v, -0.157);
        const Se = parseFloat(inputs.ka) * kb * 0.5 * Su;
        const sigma_a = (32 * M_v * 1000) / (Math.PI * Math.pow(d_v, 3));
        const tau_m = (16 * T_v * 1000) / (Math.PI * Math.pow(d_v, 3));
        const SF = 1 / (sigma_a / Se + (Math.sqrt(3) * tau_m) / Sy);
        return `Safety Factor: ${SF.toFixed(2)}`;
      }
      return '';
    } catch (e) {
      return 'Calculation Error';
    }
  }, [calcId, inputs]);

  // Extract variables specific to active calculator to send to AI
  const activeParams = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (calcId === 'bolt-torque-calc') {
      p.K = inputs.K; p.F = inputs.F; p.d = inputs.d;
    } else if (calcId === 'bearing-life-calc') {
      p.C = inputs.C; p.P = inputs.P; p.p = inputs.p; p.n = inputs.n; p.a1 = inputs.a1; p.kappa = inputs.kappa; p.eC = inputs.eC;
    } else if (calcId === 'bolt-fatigue-calc') {
      p.Grade = inputs.grade; p.Size = inputs.size; p.Fmax = inputs.Fmax; p.Fmin = inputs.Fmin; p.TargetSF = inputs.targetSF;
    } else if (calcId === 'shaft-fatigue-calc') {
      p.Diameter = inputs.shaft_d; p.BendingMoment = inputs.shaft_M; p.TorsionalMoment = inputs.shaft_T; p.Material = inputs.material; p.SurfaceFactor = inputs.ka; p.TargetSF = inputs.shaft_targetSF;
    }
    return p;
  }, [calcId, inputs]);

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setError(null);
    setLogs('> Connecting to AluCalc Sovereign AI Engine...\n> Fetching Claude 3.5 Sonnet analysis agent...\n> Injecting parameters...\n\n');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculatorId: calcId,
          inputs: activeParams,
          result: calculatedResult
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Server responded with an error');
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setLogs((prev) => prev + '> Connection established. Streaming report delta blocks...\n\n');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setLogs((prev) => prev + chunk);
      }

      setLogs((prev) => prev + '\n\n> [PROCESS COMPLETED SUCCESSFULLY] // Session closed.');
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setLogs((prev) => prev + `\n\n> [FATAL ERROR]: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-[#E8EDF5] selection:bg-[#00e5ff]/30 relative overflow-x-hidden font-sans">
      <div className="fixed inset-0 z-0 opacity-5 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#00e5ff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/academy?tab=calculators" className="flex items-center gap-2 text-xs font-mono uppercase text-white/40 hover:text-[#00e5ff] transition-all">
            <ArrowLeft size={14} /> {nav.calculators}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">AI Core v2.0 Online</span>
          </div>
        </div>

        {/* Header */}
        <header className="mb-12 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#00e5ff]" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-[#00e5ff] uppercase">Cognitive Engineering Engine</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
            AI Calculation Audit Workspace
          </h1>
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed max-w-3xl">
            Audit your designs against VDI, ISO, and ASME standards. Run real-time stress verification and obtain diagnostic advice generated directly by Claude 3.5 Sonnet.
          </p>
        </header>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Selector + Inputs */}
          <div className="lg:col-span-5 space-y-6 bg-[#0A1628]/40 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/40 mb-2">1. Select Engineering Module</label>
              <select 
                value={calcId} 
                onChange={(e) => setCalcId(e.target.value)}
                disabled={isRunning}
                className="w-full bg-[#0a1018] border border-white/10 focus:border-[#00e5ff]/50 outline-none rounded-xl px-3.5 py-3 text-xs text-white font-mono"
              >
                <option value="bolt-torque-calc">Bolt Tightening Torque (T = K·F·d)</option>
                <option value="bearing-life-calc">ISO 281 Bearing Rating Life (Lnm)</option>
                <option value="bolt-fatigue-calc">Cıvata Yorulma Analizi (VDI 2230)</option>
                <option value="shaft-fatigue-calc">Shaft Fatigue & Soderberg (ASME)</option>
              </select>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-4">
              <label className="block text-[10px] font-mono uppercase text-white/40">2. Configure Parameters</label>
              
              {/* Dynamic Inputs according to selected calculator */}
              {calcId === 'bolt-torque-calc' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/50 uppercase">K: Nut Friction Coefficient</label>
                    <input type="number" step="0.01" value={inputs.K} onChange={(e) => setInputs({...inputs, K: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-white/50 uppercase">F: Target Preload Clamp Force (N)</label>
                    <input type="number" value={inputs.F} onChange={(e) => setInputs({...inputs, F: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-white/50 uppercase">d: Nominal Bolt Diameter (m)</label>
                    <input type="number" step="0.001" value={inputs.d} onChange={(e) => setInputs({...inputs, d: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                  </div>
                </div>
              )}

              {calcId === 'bearing-life-calc' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">C: Dynamic Load (N)</label>
                      <input type="number" value={inputs.C} onChange={(e) => setInputs({...inputs, C: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">P: Equivalent Load (N)</label>
                      <input type="number" value={inputs.P} onChange={(e) => setInputs({...inputs, P: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Speed n (rpm)</label>
                      <input type="number" value={inputs.n} onChange={(e) => setInputs({...inputs, n: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Life Exponent p</label>
                      <select value={inputs.p} onChange={(e) => setInputs({...inputs, p: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="3">3.0 (Ball Bearings)</option>
                        <option value="3.3333">3.33 (Roller Bearings)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">a1: Reliability</label>
                      <select value={inputs.a1} onChange={(e) => setInputs({...inputs, a1: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="1.0">90% (a1=1.00)</option>
                        <option value="0.62">95% (a1=0.62)</option>
                        <option value="0.21">99% (a1=0.21)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">eC: Contamination</label>
                      <select value={inputs.eC} onChange={(e) => setInputs({...inputs, eC: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="0.8">0.8 (Ultra Clean)</option>
                        <option value="0.5">0.5 (Clean)</option>
                        <option value="0.3">0.3 (Typical)</option>
                        <option value="0.1">0.1 (Contaminated)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-white/50 uppercase">κ (kappa): Viscosity Ratio</label>
                    <input type="number" step="0.1" value={inputs.kappa} onChange={(e) => setInputs({...inputs, kappa: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                  </div>
                </div>
              )}

              {calcId === 'bolt-fatigue-calc' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Bolt Grade</label>
                      <select value={inputs.grade} onChange={(e) => setInputs({...inputs, grade: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="8.8">Grade 8.8</option>
                        <option value="10.9">Grade 10.9</option>
                        <option value="12.9">Grade 12.9</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Bolt Size</label>
                      <select value={inputs.size} onChange={(e) => setInputs({...inputs, size: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="M6">M6</option>
                        <option value="M8">M8</option>
                        <option value="M10">M10</option>
                        <option value="M12">M12</option>
                        <option value="M16">M16</option>
                        <option value="M20">M20</option>
                        <option value="M24">M24</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Fmax (N)</label>
                      <input type="number" value={inputs.Fmax} onChange={(e) => setInputs({...inputs, Fmax: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Fmin (N)</label>
                      <input type="number" value={inputs.Fmin} onChange={(e) => setInputs({...inputs, Fmin: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-white/50 uppercase">Target Safety factor (SF)</label>
                    <input type="number" step="0.1" value={inputs.targetSF} onChange={(e) => setInputs({...inputs, targetSF: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                  </div>
                </div>
              )}

              {calcId === 'shaft-fatigue-calc' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Diameter d (mm)</label>
                      <input type="number" value={inputs.shaft_d} onChange={(e) => setInputs({...inputs, shaft_d: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Material Steel</label>
                      <select value={inputs.material} onChange={(e) => setInputs({...inputs, material: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="1045">AISI 1045</option>
                        <option value="4140">AISI 4140</option>
                        <option value="4340">AISI 4340</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Moment M (N·m)</label>
                      <input type="number" value={inputs.shaft_M} onChange={(e) => setInputs({...inputs, shaft_M: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Torque T (N·m)</label>
                      <input type="number" value={inputs.shaft_T} onChange={(e) => setInputs({...inputs, shaft_T: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Surface ka</label>
                      <select value={inputs.ka} onChange={(e) => setInputs({...inputs, ka: e.target.value})} className="w-full bg-[#0a1018] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white">
                        <option value="0.9">Ground (0.9)</option>
                        <option value="0.8">Machined (0.8)</option>
                        <option value="0.7">Hot-Rolled (0.7)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-white/50 uppercase">Target SF</label>
                      <input type="number" step="0.1" value={inputs.shaft_targetSF} onChange={(e) => setInputs({...inputs, shaft_targetSF: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex items-baseline justify-between text-xs font-mono">
              <span className="text-white/40">Computed Output:</span>
              <span className="text-[#00e5ff] font-bold text-base">{calculatedResult}</span>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isRunning}
              className="w-full py-4 bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-extrabold rounded-xl text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isRunning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating Audit...
                </>
              ) : (
                <>
                  <Play size={14} fill="black" />
                  Run AI Analysis
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>Error: {error}</span>
              </div>
            )}
          </div>

          {/* Right Panel: Streaming Terminal */}
          <div className="lg:col-span-7 flex flex-col h-[600px] bg-black/80 border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-white/[0.02] border-b border-white/5 px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-white/40" />
                <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">Sovereign Audit Terminal</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
              </div>
            </div>

            {/* Terminal Text Body */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-[11px] leading-relaxed text-white/80 space-y-4 scrollbar-custom select-text">
              {logs ? (
                <div className="whitespace-pre-wrap break-words prose prose-invert prose-xs max-w-none">
                  {logs}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none pointer-events-none">
                  <Sparkles size={24} className="text-white/60 mb-2 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest">Awaiting parameter injection...</span>
                  <span className="text-[9px] mt-1">Configure inputs and click RUN AI ANALYSIS to stream report</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/5 text-center text-[10px] font-mono text-white/20">
          <p>© 2026 AluCalc OS — Sovereign Auditing System. Safe terminal environment.</p>
        </footer>

      </div>
    </div>
  );
}

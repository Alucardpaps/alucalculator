'use client';

/**
 * 🏗️ BETA 3D FINITE ELEMENT ANALYSIS (FEA) STRESS SIMULATOR
 * 
 * Approximate 3D linear-elastic stress tensor & von Mises contour solver
 * for imported STL models and parametric engineering CAD parts.
 * 
 * ⚠️ DISCLAIMER: Beta feature for educational and preliminary evaluation only.
 */

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity, Layers, ShieldCheck, Play, Download,
  Settings2, Upload, AlertTriangle, ShieldAlert, CheckCircle2,
  Box, Cpu, FileSpreadsheet, RotateCcw, Sliders, Info, Eye, Sparkles
} from 'lucide-react';
import {
  FEA_MATERIALS,
  FeaMaterial,
  FeaLoadCondition,
  SupportPlane,
  solve3DFea,
  generatePresetGeometry,
  parseStlFile,
} from '@/engines/fea/StlFeaSolver';
import * as THREE from 'three';

// Dynamic 3D Viewer to prevent SSR hydration mismatch
const FeaMeshViewer3D = dynamic(
  () => import('@/components/modules/fea/FeaMeshViewer3D').then((m) => m.FeaMeshViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] flex items-center justify-center bg-[#05080c] rounded-2xl border border-white/5">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Initializing 3D FEA WebGL Canvas...
          </p>
        </div>
      </div>
    ),
  }
);

type PresetType = 'bracket' | 'i-beam' | 'plate-hole' | 'connecting-rod' | 'spindle';

export function SimulationFEAModule() {
  // Model state
  const [activePreset, setActivePreset] = useState<PresetType>('bracket');
  const [customGeometry, setCustomGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');

  // Material state
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>('al-6061-t6');
  const material = FEA_MATERIALS[selectedMaterialKey] || FEA_MATERIALS['al-6061-t6'];

  // Boundary condition & Loads
  const [supportPlane, setSupportPlane] = useState<SupportPlane>('min-x');
  const [forceX, setForceX] = useState<number>(0);
  const [forceY, setForceY] = useState<number>(-5000); // 5 kN downward
  const [forceZ, setForceZ] = useState<number>(0);

  // View state
  const [deformationScale, setDeformationScale] = useState<number>(20);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showProbes, setShowProbes] = useState<boolean>(true);

  // Active geometry
  const activeGeometry = useMemo(() => {
    if (customGeometry) return customGeometry;
    return generatePresetGeometry(activePreset);
  }, [activePreset, customGeometry]);

  // Run FEA Solver
  const analysis = useMemo(() => {
    const loadCondition: FeaLoadCondition = {
      forceX,
      forceY,
      forceZ,
      supportPlane,
      fixAllDof: true,
    };
    return solve3DFea(activeGeometry, selectedMaterialKey, loadCondition);
  }, [activeGeometry, selectedMaterialKey, forceX, forceY, forceZ, supportPlane]);

  // Handle STL file upload (ASCII and Binary)
  const handleStlUpload = useCallback((buffer: ArrayBuffer, fileName: string) => {
    try {
      const geom = parseStlFile(buffer);
      geom.center();
      setCustomGeometry(geom);
      setCustomFileName(fileName);
    } catch (err) {
      console.error('Failed to parse STL file:', err);
      alert('Error parsing STL file. Please verify it is a valid ASCII or Binary STL file.');
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        handleStlUpload(event.target.result, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearCustomStl = () => {
    setCustomGeometry(null);
    setCustomFileName('');
  };

  // Export CSV results with Beta disclaimer
  const exportCsvData = () => {
    let csv = `# ALU CALC OS - 3D FEA STRESS ANALYSIS REPORT (BETA)\n`;
    csv += `# DISCLAIMER: Approximate linear-elastic analysis for educational/preliminary use only. Not certified for flight or structural compliance.\n`;
    csv += `# Model: ${customFileName || activePreset} | Material: ${material.name} (Sy=${material.yieldStrength} MPa, E=${material.elasticModulus} GPa)\n`;
    csv += `# Applied Load: Fx=${forceX} N, Fy=${forceY} N, Fz=${forceZ} N | Fixed Support: ${supportPlane.toUpperCase()}\n`;
    csv += `# Max von Mises Stress: ${analysis.maxVonMisesMpa} MPa | Max Deflection: ${analysis.maxDisplacementMm} mm | Safety Factor: ${analysis.safetyFactor} (${analysis.status})\n\n`;
    csv += `Node_Index,von_Mises_MPa,Displacement_X_mm,Displacement_Y_mm,Displacement_Z_mm\n`;

    const count = Math.min(analysis.nodeCount, 2000);
    for (let i = 0; i < count; i++) {
      csv += `${i},${analysis.vonMisesStress[i].toFixed(2)},${analysis.displacements[i * 3].toFixed(4)},${analysis.displacements[i * 3 + 1].toFixed(4)},${analysis.displacements[i * 3 + 2].toFixed(4)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AluCalc_FEA_Beta_${customFileName || activePreset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#020408] text-slate-200 p-3 sm:p-5 space-y-4 font-sans select-none">
      {/* ─── WORKSTATION HEADER WITH PROMINENT BETA BADGE ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>3D Finite Element Analysis (FEA) Simulator</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black tracking-wider">
                BETA
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Linear-elastic stress tensor & von Mises contour solver for custom 3D STL & CAD components (Educational & Preliminary use)
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono font-bold cursor-pointer transition-all">
            <Upload size={14} />
            <span>Import STL</span>
            <input type="file" accept=".stl,.STL" className="hidden" onChange={handleFileInputChange} />
          </label>

          <button
            type="button"
            onClick={exportCsvData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all"
            title="Export Stress CSV Data (Beta)"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── MANDATORY BETA DISCLAIMER BANNER ─── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11.5px] font-mono text-amber-200/90 shadow-lg">
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-300 font-bold">Beta Engineering Notice:</strong> Approximate linear-elastic analysis for educational & preliminary engineering assessment. Not a certified replacement for commercial FEA suites (ANSYS, Abaqus, SolidWorks).
        </span>
      </div>

      {/* ─── MAIN WORKSPACE GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT COLUMN: 3D VIEWPORT & METRICS (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* 3D WebGL Canvas Viewport */}
          <div className="flex-1 min-h-[480px] relative rounded-2xl border border-white/10 overflow-hidden bg-[#04070e] shadow-2xl">
            <FeaMeshViewer3D
              analysis={analysis}
              deformationScale={deformationScale}
              showWireframe={showWireframe}
              showProbes={showProbes}
              onDropStlFile={handleStlUpload}
            />

            {/* Floating Top Controls (Wireframe, Probes, Deflection Scale) */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 bg-[#080d1a]/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setShowWireframe(!showWireframe)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  showWireframe ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Wireframe: {showWireframe ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setShowProbes(!showProbes)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  showProbes ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Probes: {showProbes ? 'ON' : 'OFF'}
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1 border-l border-white/10">
                <span className="text-slate-400">Deform Scale:</span>
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={deformationScale}
                  onChange={(e) => setDeformationScale(Number(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-400 font-bold w-10">{deformationScale}×</span>
              </div>
            </div>
          </div>

          {/* KEY ANALYSIS METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Peak von Mises</span>
              <div className="text-lg font-mono font-bold text-red-400">{analysis.maxVonMisesMpa} <span className="text-xs text-slate-400">MPa</span></div>
              <div className="text-[10px] font-mono text-slate-500">Yield: {analysis.yieldStrengthMpa} MPa</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070b14] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Max Deflection</span>
              <div className="text-lg font-mono font-bold text-cyan-400">{analysis.maxDisplacementMm} <span className="text-xs text-slate-400">mm</span></div>
              <div className="text-[10px] font-mono text-slate-500">Scale: {deformationScale}×</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070b14] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Safety Factor (SF)</span>
              <div className={`text-lg font-mono font-bold ${
                analysis.status === 'SAFE' ? 'text-emerald-400' : analysis.status === 'WARNING' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {analysis.safetyFactor}
              </div>
              <div className="text-[10px] font-mono text-slate-500">Status: {analysis.status}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070b14] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Mesh & Mass</span>
              <div className="text-lg font-mono font-bold text-purple-400">{analysis.massKg.toFixed(2)} <span className="text-xs text-slate-400">kg</span></div>
              <div className="text-[10px] font-mono text-slate-500">{analysis.nodeCount} nodes ({analysis.elementCount} elem)</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & PHYSICAL BOUNDARY CONDITIONS (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {/* 1. 3D Model Selection Card */}
          <div className="p-4 rounded-2xl bg-[#070b14] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box size={14} />
                <span>1. Geometry & Model Source</span>
              </span>
              {customGeometry && (
                <button
                  type="button"
                  onClick={clearCustomStl}
                  className="text-[10px] font-mono text-red-400 hover:underline"
                >
                  Clear STL
                </button>
              )}
            </div>

            {customGeometry ? (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-200">
                <span className="font-bold">Loaded STL:</span> {customFileName}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'bracket', label: 'Aerospace L-Bracket' },
                  { id: 'i-beam', label: 'Cantilever I-Beam' },
                  { id: 'plate-hole', label: 'Perforated Plate' },
                  { id: 'connecting-rod', label: 'Connecting Rod' },
                  { id: 'spindle', label: 'Flanged Spindle' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePreset(p.id as PresetType)}
                    className={`px-2.5 py-2 rounded-xl text-left font-mono text-xs font-bold transition-all ${
                      activePreset === p.id && !customGeometry
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-md'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] font-mono text-slate-500 pt-1">
              Beta tip: Optimized for small to medium STL meshes (&lt; 50k triangles).
            </p>
          </div>

          {/* 2. Material Selection Card */}
          <div className="p-4 rounded-2xl bg-[#070b14] border border-white/5 space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} />
              <span>2. Engineering Material</span>
            </span>

            <select
              value={selectedMaterialKey}
              onChange={(e) => setSelectedMaterialKey(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 transition-all"
            >
              {Object.values(FEA_MATERIALS).map((m) => (
                <option key={m.id} value={m.id} className="bg-[#070b14] text-slate-200">
                  {m.name} (Sy = {m.yieldStrength} MPa)
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[9px]">E MODULUS</span>
                <span className="text-slate-200 font-bold">{material.elasticModulus} GPa</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">POISSON ν</span>
                <span className="text-slate-200 font-bold">{material.poissonsRatio}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">DENSITY</span>
                <span className="text-slate-200 font-bold">{material.density} g/cm³</span>
              </div>
            </div>
          </div>

          {/* 3. Boundary Conditions & Loads */}
          <div className="p-4 rounded-2xl bg-[#070b14] border border-white/5 space-y-3 flex-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} />
              <span>3. Boundary Support & Loads</span>
            </span>

            {/* Support Plane Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Fixed Constraint Face:</label>
              <div className="grid grid-cols-3 gap-1 font-mono text-xs">
                {(['min-x', 'max-x', 'min-y', 'max-y', 'min-z', 'max-z'] as SupportPlane[]).map((plane) => (
                  <button
                    key={plane}
                    type="button"
                    onClick={() => setSupportPlane(plane)}
                    className={`py-1.5 rounded-lg border transition-all uppercase ${
                      supportPlane === plane
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {plane}
                  </button>
                ))}
              </div>
            </div>

            {/* Force Vector (Fx, Fy, Fz) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Force Fy (Vertical):</span>
                <span className="text-cyan-300 font-bold">{forceY} N</span>
              </div>
              <input
                type="range"
                min={-50000}
                max={50000}
                step={500}
                value={forceY}
                onChange={(e) => setForceY(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <span className="text-slate-400">Force Fz (Transverse):</span>
                <span className="text-cyan-300 font-bold">{forceZ} N</span>
              </div>
              <input
                type="range"
                min={-25000}
                max={25000}
                step={500}
                value={forceZ}
                onChange={(e) => setForceZ(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Quick Force Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1 font-mono text-[10px]">
              <span className="text-slate-500">Presets:</span>
              {[
                { label: '1 kN', y: -1000 },
                { label: '5 kN', y: -5000 },
                { label: '20 kN', y: -20000 },
                { label: '50 kN', y: -50000 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => {
                    setForceY(b.y);
                    setForceZ(0);
                  }}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationFEAModule;

"use client";

import React, { useState, useEffect } from 'react';
import { Layers, Activity, Database, RefreshCw, Eye, EyeOff, Cpu, Box } from 'lucide-react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';

interface MassPropertiesHUDProps {
  initialWidth?: number; // mm
  initialHeight?: number; // mm
  initialLength?: number; // mm
}

const PRESET_MATERIALS = [
  { name: 'S235 Structural Steel', density: 7.85 },
  { name: '4140 Alloy Steel', density: 7.85 },
  { name: '6061-T6 Aluminum', density: 2.70 },
  { name: 'Ti-6Al-4V Titanium', density: 4.43 },
  { name: 'CuSn12 Cast Bronze', density: 8.80 },
  { name: 'Polyamide (PA6)', density: 1.15 }
];

export const MassPropertiesHUD: React.FC<MassPropertiesHUDProps> = ({
  initialWidth = 100,
  initialHeight = 50,
  initialLength = 500,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [length, setLength] = useState(initialLength);
  const [selectedMat, setSelectedMat] = useState(PRESET_MATERIALS[0]);
  const [customDensity, setCustomDensity] = useState<number | ''>('');
  const feaActive = useAssemblyStore((s) => s.feaActive);
  const setFeaActive = useAssemblyStore((s) => s.setFeaActive);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active density in g/cm³
  const currentDensity = customDensity !== '' ? customDensity : selectedMat.density;

  // Real-time calculations
  // Volume in cm³
  const volumeCm3 = (width * height * length) / 1000;
  // Mass in kg = Volume(cm³) * Density(g/cm³) / 1000
  const massKg = (volumeCm3 * currentDensity) / 1000;

  // Center of Gravity (Assuming uniform rectangular prism centered at origin)
  const cogX = 0.0;
  const cogY = height / 2; // relative from base
  const cogZ = 0.0;

  // Approximate Moments of Inertia about CoG (in kg·m²)
  // Ixx = (1/12) * m * (h² + l²)
  const hM = height / 1000;
  const lM = length / 1000;
  const wM = width / 1000;
  const ixx = (1 / 12) * massKg * (hM * hM + lM * lM);
  const iyy = (1 / 12) * massKg * (wM * wM + lM * lM);
  const izz = (1 / 12) * massKg * (wM * wM + hM * hM);

  useEffect(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    setLength(initialLength);
  }, [initialWidth, initialHeight, initialLength]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const toggleFEAMode = () => {
    setFeaActive(!feaActive);
  };

  return (
    <div className="glass-hud-panel rounded-2xl p-4 w-full sm:w-80 text-white font-mono select-none relative overflow-hidden animate-fadeIn">
      {/* Subtle background industrial grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(0,229,255,0.02)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(0,229,255,0.02)_1px,_transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      {/* Top Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#00e5ff]/20 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#00e5ff] uppercase">Mass Properties</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleFEAMode}
            className={`p-1 rounded transition-all ${feaActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
            title="Toggle FEA Stress Contour Mapping"
          >
            {feaActive ? <Activity size={13} className="animate-pulse" /> : <Layers size={13} />}
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1 text-slate-400 hover:text-white transition-all ${isRefreshing ? 'rotate-180' : ''}`}
            title="Recalculate Telemetry"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Material & Density Configuration */}
      <div className="py-3 space-y-2 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase">
          <span>Material Base</span>
          <span className="text-[#00e5ff]">{currentDensity.toFixed(2)} g/cm³</span>
        </div>
        <select
          value={selectedMat.name}
          onChange={(e) => {
            const mat = PRESET_MATERIALS.find(m => m.name === e.target.value);
            if (mat) {
              setSelectedMat(mat);
              setCustomDensity('');
            }
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#00e5ff]/40 transition-colors cursor-pointer"
        >
          {PRESET_MATERIALS.map((mat) => (
            <option key={mat.name} value={mat.name} className="bg-slate-900 text-white">
              {mat.name} ({mat.density} g/cm³)
            </option>
          ))}
        </select>
      </div>

      {/* Real-time Dimensional Inputs */}
      <div className="py-3 grid grid-cols-3 gap-2 border-b border-white/5 relative z-10">
        <div>
          <label className="block text-[8px] text-slate-400 uppercase mb-0.5">W (mm)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center text-white focus:outline-none focus:border-[#00e5ff]/40 font-bold"
          />
        </div>
        <div>
          <label className="block text-[8px] text-slate-400 uppercase mb-0.5">H (mm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center text-white focus:outline-none focus:border-[#00e5ff]/40 font-bold"
          />
        </div>
        <div>
          <label className="block text-[8px] text-slate-400 uppercase mb-0.5">L (mm)</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center text-white focus:outline-none focus:border-[#00e5ff]/40 font-bold"
          />
        </div>
      </div>

      {/* Primary Calculated Metrics */}
      <div className="py-3 grid grid-cols-2 gap-3 border-b border-white/5 relative z-10">
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="block text-[8px] text-slate-500 uppercase">Total Mass</span>
          <div className="text-sm font-black text-white tracking-tight mt-0.5">
            {massKg.toFixed(3)} <span className="text-[9px] font-normal text-slate-400">kg</span>
          </div>
        </div>
        <div className="bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="block text-[8px] text-slate-500 uppercase">Volume</span>
          <div className="text-sm font-black text-[#00e5ff] tracking-tight mt-0.5">
            {volumeCm3.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[9px] font-normal text-slate-400">cm³</span>
          </div>
        </div>
      </div>

      {/* Spatial Center of Gravity Telemetry */}
      <div className="pt-3 space-y-2 relative z-10">
        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Center of Gravity (CoG) Vector</span>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-white/5 rounded p-1 border border-white/5">
            <span className="block text-[7px] text-red-400">X</span>
            <span className="text-[9px] font-bold text-white">{cogX.toFixed(1)}</span>
          </div>
          <div className="bg-white/5 rounded p-1 border border-white/5">
            <span className="block text-[7px] text-green-400">Y</span>
            <span className="text-[9px] font-bold text-white">{cogY.toFixed(1)}</span>
          </div>
          <div className="bg-white/5 rounded p-1 border border-white/5">
            <span className="block text-[7px] text-blue-400">Z</span>
            <span className="text-[9px] font-bold text-white">{cogZ.toFixed(1)}</span>
          </div>
        </div>

        {/* Inertia Preview */}
        <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1">
          <span>Ixx: {ixx.toExponential(2)}</span>
          <span>Iyy: {iyy.toExponential(2)}</span>
          <span>Izz: {izz.toExponential(2)}</span>
        </div>
      </div>

      {/* Active Shader Overlay Banner if FEA Mode is ON */}
      {feaActive && (
        <div className="mt-3 p-1.5 rounded-lg bg-gradient-to-r from-red-500/20 via-orange-500/20 to-blue-500/20 border border-orange-500/30 text-center relative z-10">
          <span className="text-[8px] font-bold text-orange-300 uppercase tracking-widest block animate-pulse">
            ⚠️ FEA Stress Shaders Active
          </span>
        </div>
      )}
    </div>
  );
};

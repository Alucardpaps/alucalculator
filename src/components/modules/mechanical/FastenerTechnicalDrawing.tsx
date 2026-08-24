'use client';

import React from 'react';

interface Props {
  results: any;
  size: string;
  length: number;
}

export function FastenerTechnicalDrawing({ results, size, length }: Props) {
  const d = results.d_nom || 12;
  const d2 = results.d2 || (d - 0.64952 * (results.pitchVal || 1.75));
  const d1 = results.d1 || (d - 1.0825 * (results.pitchVal || 1.75));
  const d3 = results.d3 || (d - 1.2269 * (results.pitchVal || 1.75));
  const p = results.pitchVal || 1.75;
  const as = results.As || 84.3;
  const s = results.boltDim?.s || 18.0;
  const e = results.boltDim?.e || (s * 1.155);
  const k = results.boltDim?.k || 7.5;
  const m = results.nutDim?.height || (d * 0.9);
  const dh = results.dh || (d + 2.0);
  const dw = results.dw || (s * 1.05);
  const tap = results.tapDrill || (d - p);

  return (
    <div className="space-y-4 p-3 sm:p-4 text-slate-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Technical dimension drawing
          </h3>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {size} · ISO 68-1 / ISO 965 · ISO 4017 · ISO 273
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-bold text-blue-400">
          {size}
        </span>
      </div>

      {/* 3 Technical Drawing Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 1 - SIDE ELEVATION */}
        <div className="p-3 rounded-xl border border-white/5 bg-[#080c14] flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            1 - SIDE ELEVATION
          </div>
          <div className="h-36 flex items-center justify-center relative">
            <svg viewBox="0 0 200 90" className="w-full h-full text-cyan-400 overflow-visible font-mono text-[7px]">
              {/* Head */}
              <polygon points="10,25 25,20 25,70 10,65" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.2" />
              {/* Shank */}
              <rect x="25" y="30" width="40" height="30" fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1.2" />
              {/* Threaded Section with ZigZag */}
              <path d="M 65,30 L 140,30 L 155,45 L 140,60 L 65,60 Z" fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1.2" />
              {/* Thread ridges */}
              <path d="M 70,30 L 75,60 M 85,30 L 90,60 M 100,30 L 105,60 M 115,30 L 120,60 M 130,30 L 135,60" stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="1,2" opacity="0.6" />
              
              {/* Dimensions */}
              {/* k */}
              <line x1="10" y1="75" x2="25" y2="75" stroke="#64748b" strokeWidth="0.7" />
              <text x="17" y="83" fill="#94a3b8" textAnchor="middle">k = {k.toFixed(1)}</text>
              {/* d */}
              <line x1="30" y1="30" x2="30" y2="60" stroke="#64748b" strokeWidth="0.7" strokeDasharray="1,1" />
              <text x="45" y="47" fill="#94a3b8" textAnchor="middle">d = {d.toFixed(1)}</text>
              {/* L */}
              <line x1="25" y1="12" x2="145" y2="12" stroke="#64748b" strokeWidth="0.7" />
              <text x="85" y="8" fill="#94a3b8" textAnchor="middle">L = {length}</text>
              {/* thread label */}
              <text x="105" y="26" fill="#38bdf8" textAnchor="middle">thread</text>
            </svg>
          </div>
        </div>

        {/* 2 - THREAD DETAIL */}
        <div className="p-3 rounded-xl border border-white/5 bg-[#080c14] flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            2 - THREAD DETAIL
          </div>
          <div className="h-36 flex items-center justify-center relative">
            <svg viewBox="0 0 180 90" className="w-full h-full text-cyan-400 font-mono text-[7px]">
              {/* 60 deg thread teeth */}
              <path d="M 20,15 L 45,15 L 55,30 L 45,45 L 55,60 L 45,75 L 20,75 Z" fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1.2" />
              <path d="M 120,15 L 95,15 L 85,30 L 95,45 L 85,60 L 95,75 L 120,75 Z" fill="rgba(0,229,255,0.05)" stroke="#00e5ff" strokeWidth="1.2" />
              
              {/* Dimension callouts */}
              <line x1="45" y1="15" x2="95" y2="15" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2,2" />
              <text x="70" y="11" fill="#38bdf8" textAnchor="middle">d {d.toFixed(2)}</text>
              
              <line x1="50" y1="35" x2="90" y2="35" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2,2" />
              <text x="70" y="33" fill="#94a3b8" textAnchor="middle">d₂ {d2.toFixed(2)}</text>

              <line x1="55" y1="50" x2="85" y2="50" stroke="#64748b" strokeWidth="0.6" strokeDasharray="2,2" />
              <text x="70" y="48" fill="#94a3b8" textAnchor="middle">d₁ {d1.toFixed(2)}</text>

              <text x="70" y="63" fill="#94a3b8" textAnchor="middle">d₃ {d3.toFixed(2)}</text>

              {/* Pitch */}
              <text x="135" y="47" fill="#cbd5e1" textAnchor="start">P={p.toFixed(2)}</text>
            </svg>
          </div>
          <div className="text-[8px] font-mono text-center text-slate-500">
            ISO metric 60°
          </div>
        </div>

        {/* 3 - HEAD PLAN */}
        <div className="p-3 rounded-xl border border-white/5 bg-[#080c14] flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            3 - HEAD PLAN
          </div>
          <div className="h-36 flex items-center justify-center relative">
            <svg viewBox="0 0 120 90" className="w-full h-full text-cyan-400 font-mono text-[7px]">
              {/* Hexagon */}
              <polygon points="60,10 85,25 85,55 60,70 35,55 35,25" fill="rgba(0,229,255,0.06)" stroke="#00e5ff" strokeWidth="1.2" />
              {/* Inner Circle */}
              <circle cx="60" cy="40" r="14" fill="none" stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="2,2" />
              <circle cx="60" cy="40" r="1.5" fill="#00e5ff" />

              {/* Callouts */}
              <text x="60" y="6" fill="#38bdf8" textAnchor="middle">e = {e.toFixed(1)}</text>
              <line x1="35" y1="80" x2="85" y2="80" stroke="#64748b" strokeWidth="0.7" />
              <text x="60" y="87" fill="#94a3b8" textAnchor="middle">s = {s.toFixed(1)}</text>
            </svg>
          </div>
          <div className="text-[8px] font-mono text-center text-slate-500">
            ISO 4017 hex
          </div>
        </div>

      </div>

      {/* ─── DIMENSION TABLE (Grid of 14 engineering parameters) ─── */}
      <div className="pt-2">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
          DIMENSION TABLE
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { key: 'd', label: 'Major diameter', val: `${d.toFixed(2)} mm` },
            { key: 'd2', label: 'Pitch diameter', val: `${d2.toFixed(3)} mm` },
            { key: 'd1', label: 'Minor diameter', val: `${d1.toFixed(3)} mm` },
            { key: 'd3', label: 'Root diameter', val: `${d3.toFixed(3)} mm` },
            { key: 'P', label: 'Pitch', val: `${p.toFixed(3)} mm` },
            { key: 'As', label: 'Stress area', val: `${as.toFixed(1)} mm²` },
            { key: 's', label: 'Across flats', val: `${s.toFixed(1)} mm` },
            { key: 'e', label: 'Across corners', val: `${e.toFixed(1)} mm` },
            { key: 'k', label: 'Head height', val: `${k.toFixed(1)} mm` },
            { key: 'm', label: 'Nut height', val: `${m.toFixed(1)} mm` },
            { key: 'L', label: 'Length', val: `${length} mm` },
            { key: 'dh', label: 'Clearance hole', val: `${dh.toFixed(1)} mm` },
            { key: 'dw', label: 'Bearing diameter', val: `${dw.toFixed(1)} mm` },
            { key: 'tap', label: 'Tap drill', val: `${tap.toFixed(1)} mm` },
          ].map((item) => (
            <div key={item.key} className="p-2.5 rounded-xl border border-white/5 bg-[#0a0f16]">
              <div className="flex items-center justify-between text-[8px] font-mono uppercase text-slate-500">
                <span className="font-bold text-cyan-400">{item.key}</span>
                <span className="truncate max-w-[70px]">{item.label}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] font-bold text-white tabular-nums">
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FastenerTechnicalDrawing;

'use client';

import React from 'react';
import { StageConfig } from '@/hooks/useWillisEquation';

interface GearboxSchematicProps {
  stages: any[];
  activeStageIndex: number;
}

// Draw realistic gear teeth with a 4-point approximation for an involute profile
const RealisticGear = ({ cx, cy, r, teeth, fill, stroke, strokeWidth, isRing = false }: any) => {
  // Typical addendum/dedendum relative to module. Here we approximate visually.
  const moduleVisual = (2 * r) / teeth;
  const addendum = moduleVisual * 1.0;
  const dedendum = moduleVisual * 1.25;

  let path = "";
  const angleStep = (2 * Math.PI) / teeth;

  for (let i = 0; i < teeth; i++) {
    const angle = i * angleStep;
    // Tooth thickness is roughly half the pitch
    const a1 = angle - angleStep * 0.25;
    const a2 = angle - angleStep * 0.1;
    const a3 = angle + angleStep * 0.1;
    const a4 = angle + angleStep * 0.25;

    const rRoot = isRing ? r + dedendum : r - dedendum;
    const rTip = isRing ? r - addendum : r + addendum;

    const p1x = (cx + Math.cos(a1) * rRoot).toFixed(3); const p1y = (cy + Math.sin(a1) * rRoot).toFixed(3);
    const p2x = (cx + Math.cos(a2) * rTip).toFixed(3); const p2y = (cy + Math.sin(a2) * rTip).toFixed(3);
    const p3x = (cx + Math.cos(a3) * rTip).toFixed(3); const p3y = (cy + Math.sin(a3) * rTip).toFixed(3);
    const p4x = (cx + Math.cos(a4) * rRoot).toFixed(3); const p4y = (cy + Math.sin(a4) * rRoot).toFixed(3);

    if (i === 0) {
      path += `M ${p1x},${p1y} `;
    } else {
      // The previous iteration ended with an A command, which needs the target x,y.
      // So we just provide p1x,p1y here WITHOUT an 'L' prefix.
      path += `${p1x},${p1y} `;
    }
    // Arc for root. Then Line to p2. Then Arc to p3. Then Line to p4. Then Arc to next p1.
    // Wait, let's just make it simpler:
    // M p1 -> L p2 -> A p3 -> L p4 -> A (next p1)
    
    path += `L ${p2x},${p2y} A ${Number(rTip).toFixed(3)},${Number(rTip).toFixed(3)} 0 0 1 ${p3x},${p3y} L ${p4x},${p4y} A ${Number(rRoot).toFixed(3)},${Number(rRoot).toFixed(3)} 0 0 1 `;
  }

  // Close the last arc to the first point
  const firstA1 = -angleStep * 0.25;
  const firstRRoot = isRing ? r + dedendum : r - dedendum;
  path += `${(cx + Math.cos(firstA1) * firstRRoot).toFixed(3)},${(cy + Math.sin(firstA1) * firstRRoot).toFixed(3)} Z`;

  if (isRing) {
    // Add outer boundary to fill the ring body (drawn in opposite direction for evenodd rule)
    const outerR = (r + dedendum + moduleVisual * 4).toFixed(3);
    path += ` M ${(cx - Number(outerR)).toFixed(3)},${Number(cy).toFixed(3)} A ${Number(outerR).toFixed(3)},${Number(outerR).toFixed(3)} 0 1 0 ${(cx + Number(outerR)).toFixed(3)},${Number(cy).toFixed(3)} A ${Number(outerR).toFixed(3)},${Number(outerR).toFixed(3)} 0 1 0 ${(cx - Number(outerR)).toFixed(3)},${Number(cy).toFixed(3)} Z`;
  }

  return (
    <path 
      d={path} 
      fill={fill} 
      stroke={stroke} 
      strokeWidth={strokeWidth}
      fillRule="evenodd"
    />
  );
};

export const GearboxSchematic = ({ stages, activeStageIndex }: GearboxSchematicProps) => {
  const activeStage = stages[activeStageIndex] || stages[0];
  if (!activeStage) return null;

  const { zs, zr, ds, dr, dp, zp, planetCount, mode } = activeStage;
  
  // Scale so the Ring fits perfectly in a 400x400 box
  const scale = 170 / (dr / 2); 
  
  const rs = (ds / 2) * scale;
  const rr = (dr / 2) * scale;
  const rp = (dp / 2) * scale;
  const rOrbit = rs + rp;

  const baseSpeed = 10;
  let w_s = 0, w_r = 0, w_c = 0;
  
  if (mode === 'RING_FIXED') {
    w_r = 0;
    w_s = 1;
    w_c = 1 / (1 + zr/zs);
  } else if (mode === 'SUN_FIXED') {
    w_s = 0;
    w_r = 1;
    w_c = 1 / (1 + zs/zr);
  } else {
    w_c = 0;
    w_s = 1;
    w_r = -zs/zr;
  }

  const wp_rel = (w_c - w_s) * (zs / zp);
  const w_p_abs = w_c + wp_rel;

  const getStyle = (omega: number) => {
    if (Math.abs(omega) < 0.001) return {};
    const duration = (baseSpeed / Math.abs(omega)).toFixed(3);
    return {
      animation: `spin ${duration}s linear infinite ${omega < 0 ? 'reverse' : 'normal'}`,
      transformOrigin: '0px 0px'
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-[#05080f] rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />

      {/* 2D REALISTIC KINEMATIC VIEW */}
      <div className="relative aspect-square bg-[#0a0c10] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <linearGradient id="metalSun" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="metalPlanet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="metalRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="metalCarrier" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
            </filter>
            <filter id="glowCyan">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform="translate(200, 200)">
            <g style={getStyle(w_r)}>
              <RealisticGear cx={0} cy={0} r={rr} teeth={zr} fill="url(#metalRing)" stroke="#475569" strokeWidth="1" isRing={true} />
              <circle r={rr + 15} fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.3" strokeDasharray="10 5" />
            </g>

            <g style={getStyle(w_c)}>
              <circle r={rOrbit + rp * 0.4} fill="url(#metalCarrier)" opacity="0.15" stroke="#06b6d4" strokeWidth="1" />
              <polygon 
                points={Array.from({length: planetCount}).map((_, i) => {
                  const a = (i * 2 * Math.PI) / planetCount;
                  return `${(Math.cos(a)*rOrbit).toFixed(3)},${(Math.sin(a)*rOrbit).toFixed(3)}`;
                }).join(' ')} 
                fill="url(#metalCarrier)" opacity="0.2" stroke="#06b6d4" strokeWidth="2" 
              />
              
              {Array.from({ length: planetCount }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / planetCount;
                const px = (Math.cos(angle) * rOrbit).toFixed(3);
                const py = (Math.sin(angle) * rOrbit).toFixed(3);
                
                return (
                  <g key={`planet-${i}`} transform={`translate(${px}, ${py})`}>
                    <circle cx="0" cy="0" r={rp * 0.3} fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    <g style={{
                        animation: Math.abs(wp_rel) > 0.001 ? `spin ${(baseSpeed / Math.abs(wp_rel)).toFixed(3)}s linear infinite ${wp_rel < 0 ? 'reverse' : 'normal'}` : 'none',
                        transformOrigin: '0px 0px'
                    }}>
                        <RealisticGear cx={0} cy={0} r={rp} teeth={Math.round(zp)} fill="url(#metalPlanet)" stroke="#cbd5e1" strokeWidth="0.5" filter="url(#dropShadow)" />
                        <circle cx="0" cy="0" r={rp * 0.35} fill="#05080f" />
                    </g>
                  </g>
                );
              })}
              <circle r={rs * 1.5} fill="url(#metalCarrier)" opacity="0.3" stroke="#06b6d4" strokeWidth="2" />
            </g>

            <g style={getStyle(w_s)}>
              <RealisticGear cx={0} cy={0} r={rs} teeth={zs} fill="url(#metalSun)" stroke="#fbbf24" strokeWidth="1" filter="url(#dropShadow)" />
              <circle r={rs * 0.4} fill="#0f172a" stroke="#78350f" strokeWidth="2" />
            </g>

            <path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
          </g>
          
          <text x="20" y="30" className="text-xs font-black fill-cyan-500 uppercase tracking-[0.3em]" filter="url(#glowCyan)">FRONT VIEW (DYNAMIC)</text>
          <text x="20" y="50" className="text-[9px] fill-white/40 font-mono">Stage: {activeStageIndex + 1} • Mode: {mode.replace('_FIXED', '')} LOCKED</text>
        </svg>
      </div>

      {/* CROSS SECTION */}
      <div className="relative aspect-square bg-[#0a0c10] rounded-2xl border border-white/10 overflow-hidden">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <pattern id="hatchBlue" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
            </pattern>
            <pattern id="hatchOrange" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" />
            </pattern>
            <pattern id="hatchSilver" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.4" />
            </pattern>
          </defs>

          <g transform="translate(200, 40)">
            {stages.map((stage, idx) => {
              const h = 320 / stages.length;
              const y = idx * h;
              const active = idx === activeStageIndex;
              const srr = (stage.dr / 2) * scale;
              const srs = (stage.ds / 2) * scale;
              const srp = (stage.dp / 2) * scale;
              const sor = srs + srp;

              return (
                <g key={idx} transform={`translate(0, ${y.toFixed(3)})`}>
                  <rect x={(-srr - 20).toFixed(3)} y={0} width={((srr + 20) * 2).toFixed(3)} height={h.toFixed(3)} fill={active ? 'rgba(0, 229, 255, 0.03)' : 'none'} stroke={active ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)'} strokeWidth="2" />
                  <line x1={0} y1={-10} x2={0} y2={(h + 10).toFixed(3)} stroke="#00e5ff" strokeDasharray="10 5 2 5" strokeWidth="1" opacity="0.5" />

                  <rect x={(-srs*0.4).toFixed(3)} y={0} width={(srs*0.8).toFixed(3)} height={h.toFixed(3)} fill="#1e293b" stroke="#0f172a" />
                  
                  <rect x={(-srs).toFixed(3)} y={(h*0.2).toFixed(3)} width={(srs * 2).toFixed(3)} height={(h*0.6).toFixed(3)} fill="url(#hatchOrange)" stroke="#f59e0b" strokeWidth="2" filter="url(#dropShadow)" />
                  <rect x={(-srs).toFixed(3)} y={(h*0.2).toFixed(3)} width={(srs * 2).toFixed(3)} height={(h*0.6).toFixed(3)} fill="none" stroke="#f59e0b" strokeWidth="2" />

                  <rect x={(-sor - srp).toFixed(3)} y={(h*0.2).toFixed(3)} width={(srp * 2).toFixed(3)} height={(h*0.6).toFixed(3)} fill="url(#hatchSilver)" stroke="#cbd5e1" strokeWidth="2" filter="url(#dropShadow)" />
                  <rect x={(sor - srp).toFixed(3)} y={(h*0.2).toFixed(3)} width={(srp * 2).toFixed(3)} height={(h*0.6).toFixed(3)} fill="url(#hatchSilver)" stroke="#cbd5e1" strokeWidth="2" filter="url(#dropShadow)" />

                  <rect x={(-sor - srp*0.3).toFixed(3)} y={(h*0.1).toFixed(3)} width={(srp*0.6).toFixed(3)} height={(h*0.8).toFixed(3)} fill="#334155" stroke="#1e293b" />
                  <rect x={(sor - srp*0.3).toFixed(3)} y={(h*0.1).toFixed(3)} width={(srp*0.6).toFixed(3)} height={(h*0.8).toFixed(3)} fill="#334155" stroke="#1e293b" />
                  
                  <rect x={(-sor - srp).toFixed(3)} y={(h*0.8).toFixed(3)} width={((sor + srp) * 2).toFixed(3)} height={(h*0.1).toFixed(3)} fill="url(#hatchBlue)" stroke="#06b6d4" strokeWidth="2" />

                  <path d={`M ${(-srr + 10).toFixed(3)} ${(h*0.1).toFixed(3)} L ${(-srr - 10).toFixed(3)} ${(h*0.1).toFixed(3)} L ${(-srr - 10).toFixed(3)} ${(h*0.9).toFixed(3)} L ${(-srr + 10).toFixed(3)} ${(h*0.9).toFixed(3)} Z`} fill="url(#hatchBlue)" stroke="#334155" strokeWidth="2" />
                  <path d={`M ${(srr - 10).toFixed(3)} ${(h*0.1).toFixed(3)} L ${(srr + 10).toFixed(3)} ${(h*0.1).toFixed(3)} L ${(srr + 10).toFixed(3)} ${(h*0.9).toFixed(3)} L ${(srr - 10).toFixed(3)} ${(h*0.9).toFixed(3)} Z`} fill="url(#hatchBlue)" stroke="#334155" strokeWidth="2" />

                  <text x={(-srr - 15).toFixed(3)} y={(h/2 + 3).toFixed(3)} className="text-[10px] font-black fill-white/20 uppercase tracking-widest text-right" transform={`rotate(-90, ${(-srr - 15).toFixed(3)}, ${(h/2).toFixed(3)})`}>
                    STAGE {idx + 1}
                  </text>
                </g>
              );
            })}
          </g>
          <text x="20" y="30" className="text-xs font-black fill-white/80 uppercase tracking-[0.3em]">CROSS SECTION</text>
          <text x="20" y="50" className="text-[9px] fill-white/40 font-mono">DIN 3960 Shaft Layout</text>
        </svg>
      </div>
    </div>
  );
};

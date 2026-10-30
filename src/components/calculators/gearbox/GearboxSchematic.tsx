'use client';

import React, { useMemo } from 'react';
import { StageConfig } from '@/hooks/useWillisEquation';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import {
  generateExternalGearContour,
  generateInternalGearContour,
  calculateInvoluteGearSpecs,
  pointsToSvgPath,
  downloadGearProductionSvg,
  downloadGearProductionDxf,
} from '@/engines/math/gear-involute-factory';
import { Download } from 'lucide-react';

interface GearboxSchematicProps {
  stages: any[];
  activeStageIndex: number;
}

export const GearboxSchematic = ({ stages, activeStageIndex }: GearboxSchematicProps) => {
  const [viewMode, setViewMode] = React.useState<'both' | 'kinematic' | 'cross'>('both');
  const activeStage = stages[activeStageIndex] || stages[0];

  const m = activeStage?.m || 2;
  const zs = Math.max(8, Math.round(activeStage?.zs || 20));
  const zr = Math.max(zs + 2, Math.round(activeStage?.zr || 60));
  const zp = Math.max(4, Math.round(activeStage?.zp || (zr - zs) / 2));
  const planetCount = activeStage?.planetCount || 3;
  const mode = activeStage?.mode || 'RING_FIXED';
  const beta = Number(activeStage?.helixAngle || 0);
  const faceWidth = Number(activeStage?.faceWidth || 10 * m);
  const sunBeta = beta;
  const planetBeta = -beta;
  const ringBeta = -beta;

  // Calculate true DIN 3960 / ISO 53 gear specs (helical: d = mt·z)
  const sunSpecs = useMemo(() => calculateInvoluteGearSpecs({
    module: m,
    teeth: zs,
    pressureAngle: 20,
    helixAngle: sunBeta,
    faceWidth,
    hasKeyway: true,
  }), [m, zs, sunBeta, faceWidth]);

  const planetSpecs = useMemo(() => calculateInvoluteGearSpecs({
    module: m,
    teeth: zp,
    pressureAngle: 20,
    helixAngle: planetBeta,
    faceWidth,
    hasKeyway: false,
    boreDiameter: Math.max(6, Math.round((m * zp * 0.35) / 2) * 2),
  }), [m, zp, planetBeta, faceWidth]);

  const ringSpecs = useMemo(() => calculateInvoluteGearSpecs({
    module: m,
    teeth: zr,
    pressureAngle: 20,
    helixAngle: ringBeta,
    faceWidth,
    isInternal: true,
    rimThickness: Math.max(10, 3.5 * m),
  }), [m, zr, ringBeta, faceWidth]);

  // Contours (True Involute)
  const sunPath = useMemo(() => {
    const pts = generateExternalGearContour({
      module: m,
      teeth: zs,
      pressureAngle: 20,
      helixAngle: sunBeta,
      pointsPerFlank: 8,
      center: { x: 0, y: 0 },
    });
    return pointsToSvgPath(pts, true);
  }, [m, zs, sunBeta]);

  const planetPath = useMemo(() => {
    const pts = generateExternalGearContour({
      module: m,
      teeth: zp,
      pressureAngle: 20,
      helixAngle: planetBeta,
      pointsPerFlank: 8,
      center: { x: 0, y: 0 },
    });
    return pointsToSvgPath(pts, true);
  }, [m, zp, planetBeta]);

  const ringPaths = useMemo(() => {
    const { innerTeethContour, outerRimContour } = generateInternalGearContour({
      module: m,
      teeth: zr,
      pressureAngle: 20,
      helixAngle: ringBeta,
      pointsPerFlank: 8,
      center: { x: 0, y: 0 },
      rimThickness: Math.max(10, 3.5 * m),
    });
    return {
      inner: pointsToSvgPath(innerTeethContour, true),
      outer: pointsToSvgPath(outerRimContour, true),
      combined: `${pointsToSvgPath(outerRimContour, true)} ${pointsToSvgPath(innerTeethContour, true)}`,
    };
  }, [m, zr, ringBeta]);

  // Scale so the Ring fits perfectly in a 400x400 box with padding
  const rOuterRingMm = (ringSpecs.outerRingDiameter ?? (ringSpecs.rootDiameter + 20)) / 2;
  const rs = sunSpecs.pitchRadius;
  const rp = planetSpecs.pitchRadius;
  const rr = ringSpecs.pitchRadius;
  const rOrbit = rs + rp;
  const scale = 175 / rOuterRingMm;

  // Orbit planet coordinates
  const planets = useMemo(() => {
    const list = [];
    for (let i = 0; i < planetCount; i++) {
      const angle = (i * 2 * Math.PI) / planetCount;
      const px = rOrbit * Math.cos(angle);
      const py = rOrbit * Math.sin(angle);
      list.push({ angle, px, py });
    }
    return list;
  }, [planetCount, rOrbit]);

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

  // Interactive kinetic spin engine
  const kinetic = useKineticSpin({
    mode: 'circular',
    nominalSpeedDegPerSec: 36, // ~10s per full cycle at nominal
    autoPlay: true,
    dragSensitivity: 1.1,
    wheelSensitivity: 0.003,
  });

  const sunAngle = (kinetic.angle * w_s) % 360;
  const carrierAngle = (kinetic.angle * w_c) % 360;
  const ringAngle = ((kinetic.angle * w_r) + (180 / zr)) % 360;
  const planetRelAngle = ((kinetic.angle * wp_rel) + (180 / zp)) % 360;

  // 1:1 CAM Download Handlers
  const handleDownloadSunSvg = () => {
    downloadGearProductionSvg({
      module: m,
      teeth: zs,
      pressureAngle: 20,
      helixAngle: sunBeta,
      faceWidth,
      hasKeyway: true,
      center: { x: 0, y: 0 },
    }, `sun_gear_stage${activeStageIndex + 1}_z${zs}_m${m}_1to1.svg`, {
      customTitle: `Sun Gear Stage ${activeStageIndex + 1}`,
      material: '16MnCr5 Case-Hardened Steel',
    });
  };

  const handleDownloadSunDxf = () => {
    downloadGearProductionDxf({
      module: m,
      teeth: zs,
      pressureAngle: 20,
      helixAngle: sunBeta,
      faceWidth,
      hasKeyway: true,
      center: { x: 0, y: 0 },
    }, `sun_gear_stage${activeStageIndex + 1}_z${zs}_m${m}_1to1.dxf`);
  };

  const handleDownloadPlanetSvg = () => {
    downloadGearProductionSvg({
      module: m,
      teeth: zp,
      pressureAngle: 20,
      helixAngle: planetBeta,
      faceWidth,
      hasKeyway: false,
      boreDiameter: planetSpecs.boreDiameter,
      center: { x: 0, y: 0 },
    }, `planet_gear_stage${activeStageIndex + 1}_zp${zp}_m${m}_1to1.svg`, {
      customTitle: `Planet Gear Stage ${activeStageIndex + 1}`,
      material: '16MnCr5 Case-Hardened Steel',
    });
  };

  const handleDownloadPlanetDxf = () => {
    downloadGearProductionDxf({
      module: m,
      teeth: zp,
      pressureAngle: 20,
      helixAngle: planetBeta,
      faceWidth,
      hasKeyway: false,
      boreDiameter: planetSpecs.boreDiameter,
      center: { x: 0, y: 0 },
    }, `planet_gear_stage${activeStageIndex + 1}_zp${zp}_m${m}_1to1.dxf`);
  };

  const handleDownloadRingSvg = () => {
    downloadGearProductionSvg({
      module: m,
      teeth: zr,
      pressureAngle: 20,
      helixAngle: ringBeta,
      faceWidth,
      isInternal: true,
      rimThickness: Math.max(10, 3.5 * m),
      center: { x: 0, y: 0 },
    }, `ring_gear_stage${activeStageIndex + 1}_zr${zr}_m${m}_1to1.svg`, {
      customTitle: `Internal Ring Gear Stage ${activeStageIndex + 1}`,
      material: '42CrMo4 Nitrided Steel',
    });
  };

  const handleDownloadRingDxf = () => {
    downloadGearProductionDxf({
      module: m,
      teeth: zr,
      pressureAngle: 20,
      helixAngle: ringBeta,
      faceWidth,
      isInternal: true,
      rimThickness: Math.max(10, 3.5 * m),
      center: { x: 0, y: 0 },
    }, `ring_gear_stage${activeStageIndex + 1}_zr${zr}_m${m}_1to1.dxf`);
  };

  if (!activeStage) return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--bg-0)] rounded-2xl border border-white/10 ">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            DIN 3960 Kinematic Visualizer (ISO 53 Involute)
          </span>
        </div>
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 text-[9px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'both' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
          >
            DUAL VIEW
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kinematic')}
            className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'kinematic' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
          >
            2D KINEMATICS
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cross')}
            className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'cross' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
          >
            CROSS SECTION
          </button>
        </div>
      </div>

      {/* 1:1 Production CAD/CAM Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-3)] border border-[var(--line)] text-xs font-mono">
        <div className="flex items-center gap-2 text-white/70">
          <Download size={14} className="text-[var(--cyan)]" />
          <span className="text-[10px] uppercase tracking-wider text-[var(--alu-dim)] font-bold">1:1 CAM Export:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sun Gear Exports */}
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
            <span className="text-[9px] text-amber-300 font-bold">Sun (zs={zs}):</span>
            <button onClick={handleDownloadSunSvg} className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-[9px] transition-colors cursor-pointer">SVG 1:1</button>
            <button onClick={handleDownloadSunDxf} className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-[9px] transition-colors cursor-pointer">DXF 1:1</button>
          </div>
          {/* Planet Gear Exports */}
          <div className="flex items-center gap-1 bg-slate-500/10 border border-slate-400/30 rounded px-2 py-1">
            <span className="text-[9px] text-slate-300 font-bold">Planet (zp={zp}):</span>
            <button onClick={handleDownloadPlanetSvg} className="px-1.5 py-0.5 rounded bg-slate-500/20 hover:bg-slate-500/40 text-slate-200 text-[9px] transition-colors cursor-pointer">SVG 1:1</button>
            <button onClick={handleDownloadPlanetDxf} className="px-1.5 py-0.5 rounded bg-slate-500/20 hover:bg-slate-500/40 text-slate-200 text-[9px] transition-colors cursor-pointer">DXF 1:1</button>
          </div>
          {/* Ring Gear Exports */}
          <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 rounded px-2 py-1">
            <span className="text-[9px] text-cyan-300 font-bold">Ring (zr={zr}):</span>
            <button onClick={handleDownloadRingSvg} className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[9px] transition-colors cursor-pointer">SVG 1:1</button>
            <button onClick={handleDownloadRingDxf} className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[9px] transition-colors cursor-pointer">DXF 1:1</button>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto w-full'}`}>
        {/* 2D REALISTIC KINEMATIC VIEW */}
        {(viewMode === 'both' || viewMode === 'kinematic') && (
          <div 
            {...kinetic.containerProps}
            className="relative aspect-square max-h-[340px] mx-auto w-full bg-[var(--bg-1)] rounded-[var(--radius-m)] border border-[var(--line)] overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] select-none"
            title="🖱️ Click & drag to rotate planetary train • Scroll wheel to adjust speed & direction • Double-click to reset"
          >
            {/* Tactile Motion HUD Badge */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-s)] bg-black/70 border border-white/10 text-[9px] font-mono text-[var(--cyan)] pointer-events-none select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{Math.abs(kinetic.speedMultiplier).toFixed(1)}x {kinetic.direction === 1 ? 'CW' : 'CCW'}</span>
            </div>

            <svg viewBox="0 0 400 400" className="w-full h-full select-none">
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
                  <feDropShadow dx="1.5" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.8" />
                </filter>
                <filter id="glowCyan">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(200, 200) scale(${scale.toFixed(5)})`}>
                {/* RING GEAR */}
                <g transform={Math.abs(w_r) > 0.0001 || ringAngle !== 0 ? `rotate(${ringAngle.toFixed(2)})` : undefined}>
                  <path 
                    d={ringPaths.combined} 
                    fill="url(#metalRing)" 
                    stroke="#475569" 
                    strokeWidth={1 / scale} 
                    vectorEffect="non-scaling-stroke"
                    fillRule="evenodd" 
                  />
                  <circle 
                    r={rr} 
                    fill="none" 
                    stroke="#94a3b8" 
                    strokeWidth={1 / scale} 
                    opacity="0.35" 
                    strokeDasharray={`${6 / scale} ${4 / scale}`} 
                    vectorEffect="non-scaling-stroke"
                  />
                </g>

                {/* PLANET CARRIER & PLANETS */}
                <g transform={Math.abs(w_c) > 0.0001 ? `rotate(${carrierAngle.toFixed(2)})` : undefined}>
                  {/* Carrier Spider Disc */}
                  <circle 
                    r={rOrbit + rp * 0.4} 
                    fill="url(#metalCarrier)" 
                    opacity="0.15" 
                    stroke="#06b6d4" 
                    strokeWidth={1 / scale}
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Carrier Arms Polygon */}
                  <polygon 
                    points={planets.map((p) => `${p.px.toFixed(3)},${p.py.toFixed(3)}`).join(' ')} 
                    fill="url(#metalCarrier)" 
                    opacity="0.25" 
                    stroke="#06b6d4" 
                    strokeWidth={2 / scale} 
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Arm lines from center to each planet pin */}
                  {planets.map((p, i) => (
                    <line
                      key={`carrier-arm-${i}`}
                      x1={0}
                      y1={0}
                      x2={p.px}
                      y2={p.py}
                      stroke="#06b6d4"
                      strokeWidth={2.5 / scale}
                      strokeLinecap="round"
                      opacity="0.6"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  
                  {/* Planets */}
                  {planets.map((p, i) => (
                    <g key={`planet-${i}`} transform={`translate(${p.px.toFixed(3)}, ${p.py.toFixed(3)})`}>
                      {/* Carrier Pin Boss */}
                      <circle cx="0" cy="0" r={rp * 0.4} fill="#0f172a" stroke="#334155" strokeWidth={1.5 / scale} vectorEffect="non-scaling-stroke" />
                      
                      {/* Rotating Planet Gear */}
                      <g transform={`rotate(${planetRelAngle.toFixed(2)})`}>
                        <path 
                          d={planetPath} 
                          fill="url(#metalPlanet)" 
                          stroke="#cbd5e1" 
                          strokeWidth={0.75 / scale} 
                          vectorEffect="non-scaling-stroke" 
                          filter="url(#dropShadow)" 
                        />
                        {/* Planet Bearing Bore */}
                        <circle cx="0" cy="0" r={planetSpecs.boreDiameter / 2} fill="#05080f" stroke="#475569" strokeWidth={1 / scale} vectorEffect="non-scaling-stroke" />
                      </g>
                    </g>
                  ))}
                  
                  {/* Central Carrier Hub */}
                  <circle r={rs * 1.2} fill="url(#metalCarrier)" opacity="0.35" stroke="#06b6d4" strokeWidth={1.5 / scale} vectorEffect="non-scaling-stroke" />
                </g>

                {/* SUN GEAR */}
                <g transform={Math.abs(w_s) > 0.0001 ? `rotate(${sunAngle.toFixed(2)})` : undefined}>
                  <path 
                    d={sunPath} 
                    fill="url(#metalSun)" 
                    stroke="#fbbf24" 
                    strokeWidth={1 / scale} 
                    vectorEffect="non-scaling-stroke"
                    filter="url(#dropShadow)" 
                  />
                  {/* Pitch circle */}
                  <circle 
                    r={rs} 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth={1 / scale} 
                    opacity="0.4" 
                    strokeDasharray={`${4 / scale} ${3 / scale}`} 
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Central shaft bore */}
                  <circle r={sunSpecs.boreDiameter / 2} fill="#0f172a" stroke="#78350f" strokeWidth={1.5 / scale} vectorEffect="non-scaling-stroke" />
                </g>

                {/* Center cross axis */}
                <path 
                  d={`M ${(-12 / scale).toFixed(3)} 0 L ${(12 / scale).toFixed(3)} 0 M 0 ${(-12 / scale).toFixed(3)} L 0 ${(12 / scale).toFixed(3)}`} 
                  stroke="#00e5ff" 
                  strokeWidth={1 / scale} 
                  opacity="0.6" 
                  vectorEffect="non-scaling-stroke"
                />
              </g>
              
              <text x="20" y="24" className="text-[10px] font-bold fill-cyan-400 uppercase tracking-wider" filter="url(#glowCyan)">FRONT VIEW (DIN 3960)</text>
              <text x="20" y="38" className="text-[8.5px] fill-white/40 font-mono">Stage: {activeStageIndex + 1} • m={m}mm • zs={zs} zp={zp} zr={zr} • Mode: {mode.replace('_FIXED', '')} LOCKED</text>
            </svg>
          </div>
        )}

        {/* CROSS SECTION */}
        {(viewMode === 'both' || viewMode === 'cross') && (
          <div className="relative aspect-square max-h-[340px] mx-auto w-full bg-[var(--bg-1)] rounded-xl border border-white/10 overflow-hidden">
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
        )}
      </div>
    </div>
  );
};

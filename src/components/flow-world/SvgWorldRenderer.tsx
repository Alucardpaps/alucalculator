'use client';

import React from 'react';
import { ContactPoint, PhysicsBody, PhysicsJoint } from './types';
import { computeTerrainY, WATER_LINE_Y } from './physicsEngine';

interface SvgWorldRendererProps {
  bodies: PhysicsBody[];
  joints: PhysicsJoint[];
  selectedBodyId: string | null;
  draggedBodyId: string | null;
  mousePos: { x: number; y: number } | null;
  dragStartPos: { x: number; y: number } | null;
  pan: { x: number; y: number };
  zoom: number;
  groundSlopeDeg?: number;
  terrainType?: 'flat' | 'wavy' | 'hills';
  waveAmplitude?: number;
  contacts?: ContactPoint[];
  showDebug?: boolean;
  windX?: number;
  onGroundSlopeHandleMouseDown?: (e: React.MouseEvent) => void;
  onBodyMouseDown: (id: string, e: React.MouseEvent) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
}

export const SvgWorldRenderer: React.FC<SvgWorldRendererProps> = ({
  bodies,
  joints,
  selectedBodyId,
  draggedBodyId,
  mousePos,
  pan,
  zoom,
  groundSlopeDeg = 0,
  terrainType = 'flat',
  waveAmplitude = 28,
  contacts = [],
  showDebug = false,
  windX = 0,
  onGroundSlopeHandleMouseDown,
  onBodyMouseDown,
  onCanvasMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}) => {
  // Helper to generate gear teeth SVG path
  const renderGearPath = (radius: number, teeth: number) => {
    const rootR = radius * 0.82;
    const tipR = radius * 1.12;
    let path = '';
    const step = (Math.PI * 2) / teeth;

    for (let i = 0; i < teeth; i++) {
      const a1 = i * step;
      const a2 = a1 + step * 0.28;
      const a3 = a1 + step * 0.52;
      const a4 = a1 + step * 0.8;

      const p1x = (Math.cos(a1) * rootR).toFixed(2);
      const p1y = (Math.sin(a1) * rootR).toFixed(2);
      const p2x = (Math.cos(a2) * tipR).toFixed(2);
      const p2y = (Math.sin(a2) * tipR).toFixed(2);
      const p3x = (Math.cos(a3) * tipR).toFixed(2);
      const p3y = (Math.sin(a3) * tipR).toFixed(2);
      const p4x = (Math.cos(a4) * rootR).toFixed(2);
      const p4y = (Math.sin(a4) * rootR).toFixed(2);

      if (i === 0) {
        path += `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} `;
      } else {
        path += `L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} `;
      }
    }
    path += 'Z';
    return path;
  };

  // Helper for stress heatmap color
  const getStressColor = (body: PhysicsBody) => {
    if (body.isBroken) return '#ef4444';
    if (!body.stressMpa || !body.material) return body.material.color;

    const ratio = body.stressMpa / body.material.yieldStrength;
    if (ratio < 0.4) return '#00e5ff'; // Safe blue/cyan
    if (ratio < 0.75) return '#10b981'; // Green
    if (ratio < 1.0) return '#f59e0b'; // Amber warning
    return '#ef4444'; // Red failure zone!
  };

  return (
    <svg
      className="w-full h-full cursor-crosshair select-none bg-[var(--bg-0)]"
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
    >
      <defs>
        {/* Neon Glow Filter */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* CAD Grid Pattern */}
        <pattern id="cad-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.5" fill="rgba(0, 229, 255, 0.3)" />
        </pattern>
        <pattern id="cad-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="0.5" />
        </pattern>

        {/* Foundation Pattern for Anchors */}
        <pattern id="anchor-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
        </pattern>

        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7dd3fc" />
        </marker>
        <marker id="vel-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
        </marker>

        {/* Metallic Gradients */}
        <linearGradient id="metal-grad-al" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
        </linearGradient>

        {/* Boat & Water Gradients */}
        <linearGradient id="boat-hull-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0284c7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#082f49" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#0284c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Camera Transform Group (Pan & Zoom) */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Grid Background */}
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#cad-grid-minor)" />
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#cad-grid-major)" />

        {(bodies.some((b) => b.type === 'boat' || (b.submergedRatio || 0) > 0) || showDebug) && (
          <g>
            <rect x="-2000" y={WATER_LINE_Y} width="6000" height="220" fill="url(#water-grad)" />
            <line x1="-2000" y1={WATER_LINE_Y} x2="4000" y2={WATER_LINE_Y} stroke="#38bdf8" strokeWidth="2" strokeDasharray="8 4" opacity="0.8" />
            <text x="80" y={WATER_LINE_Y - 6} fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              SU HATTI y={WATER_LINE_Y} · ARCHIMEDES + KUADRATİK SÜRÜKLEME
            </text>
          </g>
        )}

        {Math.abs(windX) > 1 && (
          <g opacity="0.45">
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`wind-${i}`}
                x1={80}
                y1={80 + i * 40}
                x2={80 + windX * 3}
                y2={80 + i * 40}
                stroke="#7dd3fc"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            ))}
          </g>
        )}

        {/* Ground Baseline / Wavy Geological Terrain */}
        {terrainType === 'flat' ? (
          <g transform={`rotate(${groundSlopeDeg}, 500, 650)`}>
            <line x1="-3000" y1="650" x2="6000" y2="650" stroke="#00e5ff" strokeWidth="2.5" opacity="0.6" />
            <rect x="-3000" y="650" width="9000" height="600" fill="rgba(8, 13, 22, 0.94)" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.2" />

            {/* Pivot indicator at (500, 650) */}
            <circle cx="500" cy="650" r="5" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
            <circle cx="500" cy="650" r="2" fill="#fff" />
            <text x="500" y="675" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              EĞİM MERKEZİ (5m)
            </text>

            {/* Ground scale markers */}
            {Array.from({ length: 60 }).map((_, i) => {
              const gx = -1000 + i * 100;
              return (
                <g key={`g-tick-${i}`}>
                  <line x1={gx} y1={650} x2={gx} y2={658} stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />
                  <text x={gx + 4} y={668} fill="rgba(255, 255, 255, 0.35)" fontSize="9" fontFamily="monospace">
                    {i - 10}m
                  </text>
                </g>
              );
            })}

            {/* Interactive Slope Handle at x = 950 on the ground plane */}
            <g
              transform="translate(950, 650)"
              className="cursor-ns-resize select-none"
              onMouseDown={(e) => {
                e.stopPropagation();
                onGroundSlopeHandleMouseDown?.(e);
              }}
            >
              <circle r="14" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
              <circle r="5" fill="#38bdf8" />
              <rect x="18" y="-12" width="135" height="24" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1" />
              <text x="26" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                📐 EĞİM KOLU: {groundSlopeDeg > 0 ? '+' : ''}{groundSlopeDeg.toFixed(1)}°
              </text>
            </g>
          </g>
        ) : (
          <g>
            {/* Wavy / Hilly Terrain with Geological Solid Fill & Glowing Surface */}
            {(() => {
              const minX = -1500;
              const maxX = 4200;
              const step = 35;
              let pathD = `M ${minX} 1400 L ${minX} ${computeTerrainY(minX, groundSlopeDeg, terrainType, waveAmplitude).toFixed(1)}`;
              let surfaceD = `M ${minX} ${computeTerrainY(minX, groundSlopeDeg, terrainType, waveAmplitude).toFixed(1)}`;

              for (let x = minX + step; x <= maxX; x += step) {
                const y = computeTerrainY(x, groundSlopeDeg, terrainType, waveAmplitude).toFixed(1);
                pathD += ` L ${x} ${y}`;
                surfaceD += ` L ${x} ${y}`;
              }
              pathD += ` L ${maxX} 1400 Z`;

              return (
                <>
                  <path d={pathD} fill="rgba(8, 13, 22, 0.94)" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.2" />
                  <path d={surfaceD} fill="none" stroke="#00e5ff" strokeWidth="3" opacity="0.85" />
                  {/* Terrain Surface Ticks & Meter Labels */}
                  {Array.from({ length: 45 }).map((_, i) => {
                    const gx = -800 + i * 100;
                    const gy = computeTerrainY(gx, groundSlopeDeg, terrainType, waveAmplitude);
                    return (
                      <g key={`wavy-tick-${i}`}>
                        <circle cx={gx} cy={gy} r="2.5" fill="#00e5ff" opacity="0.7" />
                        <line x1={gx} y1={gy} x2={gx} y2={gy + 10} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                        <text x={gx + 4} y={gy + 18} fill="rgba(255, 255, 255, 0.4)" fontSize="9" fontFamily="monospace">
                          {i - 8}m
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </g>
        )}

        {/* 1. JOINTS RENDER */}
        {joints.map((j) => {
          if (j.isBroken) return null;
          const bA = bodies.find((b) => b.id === j.bodyAId);
          const bB = bodies.find((b) => b.id === j.bodyBId);
          if (!bA || !bB) return null;

          const angleA = Number.isFinite(bA.angle) ? bA.angle : 0;
          const angleB = Number.isFinite(bB.angle) ? bB.angle : 0;
          const axA = j.localAnchorA && Number.isFinite(j.localAnchorA.x) ? j.localAnchorA.x : 0;
          const ayA = j.localAnchorA && Number.isFinite(j.localAnchorA.y) ? j.localAnchorA.y : 0;
          const axB = j.localAnchorB && Number.isFinite(j.localAnchorB.x) ? j.localAnchorB.x : 0;
          const ayB = j.localAnchorB && Number.isFinite(j.localAnchorB.y) ? j.localAnchorB.y : 0;

          const bxA = Number.isFinite(bA.x) ? bA.x : 0;
          const byA = Number.isFinite(bA.y) ? bA.y : 0;
          const bxB = Number.isFinite(bB.x) ? bB.x : 0;
          const byB = Number.isFinite(bB.y) ? bB.y : 0;

          const pA = {
            x: bxA + Math.cos(angleA) * axA - Math.sin(angleA) * ayA,
            y: byA + Math.sin(angleA) * axA + Math.cos(angleA) * ayA
          };
          const pB = {
            x: bxB + Math.cos(angleB) * axB - Math.sin(angleB) * ayB,
            y: byB + Math.sin(angleB) * axB + Math.cos(angleB) * ayB
          };

          if (!Number.isFinite(pA.x) || !Number.isFinite(pA.y) || !Number.isFinite(pB.x) || !Number.isFinite(pB.y)) {
            return null;
          }

          if (j.type === 'cable' || j.type === 'spring') {
            const tRatio = Math.min(1, (j.currentTension || 0) / Math.max(j.maxTension || 50000, 1));
            const stroke = tRatio > 0.75 ? '#ef4444' : tRatio > 0.4 ? '#f59e0b' : '#cbd5e1';
            return (
              <g key={j.id}>
                <line
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke={stroke}
                  strokeWidth={j.type === 'spring' ? 2 : 2.5}
                  strokeDasharray={j.type === 'spring' ? '6 3' : '4 2'}
                />
                {/* Tension label */}
                {j.currentTension && j.currentTension > 10 && (
                  <text
                    x={(pA.x + pB.x) / 2}
                    y={(pA.y + pB.y) / 2 - 8}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    T: {Math.round(j.currentTension)} N
                  </text>
                )}
              </g>
            );
          }

          if (j.type === 'pin') {
            return (
              <g key={j.id} transform={`translate(${pA.x}, ${pA.y})`}>
                <circle r="6" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
                <circle r="2" fill="#fff" />
              </g>
            );
          }

          if (j.type === 'weld') {
            return (
              <g key={j.id} transform={`translate(${pA.x}, ${pA.y})`}>
                <rect x="-5" y="-5" width="10" height="10" fill="#00e5ff" stroke="#000" strokeWidth="1" />
              </g>
            );
          }

          return null;
        })}

        {/* 2. BODIES RENDER */}
        {bodies.map((b) => {
          if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
          const isSelected = selectedBodyId === b.id;
          const stressCol = getStressColor(b);

          if (b.type === 'anchor') {
            const w = b.width || 60;
            const h = b.height || 80;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  fill="url(#anchor-hatch)"
                  stroke={isSelected ? '#00e5ff' : '#475569'}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <circle r="4" fill="#64748b" />
                <text x="0" y={h / 2 + 14} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {b.name}
                </text>
              </g>
            );
          }

          if (b.type === 'gear') {
            const pr = b.pitchRadius || 40;
            const z = b.teethCount || 20;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                {/* Gear Pitch Outline */}
                <circle r={pr} fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeDasharray="3 3" strokeWidth="1" />
                {/* Gear Body Path */}
                <path
                  d={renderGearPath(pr, z)}
                  fill={b.isMotor ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.85)'}
                  stroke={isSelected ? '#00e5ff' : b.isMotor ? '#f59e0b' : b.material.strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Spokes & Center Bore */}
                <circle r={pr * 0.35} fill="#05080c" stroke={b.material.strokeColor} strokeWidth="1" />
                <line x1={-pr * 0.7} y1="0" x2={pr * 0.7} y2="0" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <line x1="0" y1={-pr * 0.7} x2="0" y2={pr * 0.7} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <circle r="5" fill="#f8fafc" />

                {/* Motor badge */}
                {b.isMotor && (
                  <text x="0" y={-pr - 8} fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    ⚡ {b.motorRpm} RPM
                  </text>
                )}
                {/* Teeth info */}
                <text x="0" y={pr + 16} fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {z}T ({b.material.name.split(' ')[0]})
                </text>
              </g>
            );
          }

          if (b.type === 'beam') {
            const len = b.length || 200;
            const h = b.height || 16;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                {b.isBroken ? (
                  // Broken Fractured State
                  <g>
                    <rect x={-len / 2} y={-h / 2} width={len / 2 - 10} height={h} fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
                    <rect x="10" y={-h / 2 + 10} width={len / 2 - 10} height={h} fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
                    <text x="0" y="-12" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      💥 YAPI KOPTU! (AKMA SINIRI AŞILDI)
                    </text>
                  </g>
                ) : (
                  // Intact Beam with Deflection & Heatmap
                  <g>
                    <rect
                      x={-len / 2}
                      y={-h / 2}
                      width={len}
                      height={h}
                      rx="3"
                      fill="rgba(15, 23, 42, 0.9)"
                      stroke={isSelected ? '#00e5ff' : stressCol}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={isSelected ? 'url(#neon-glow)' : undefined}
                    />
                    {/* Center neutral axis line */}
                    <line x1={-len / 2 + 6} y1="0" x2={len / 2 - 6} y2="0" stroke={stressCol} strokeWidth="2" strokeDasharray="3 3" />

                    {/* Stress & FoS HUD Tag */}
                    <text x="0" y={-h / 2 - 6} fill={stressCol} fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      σ: {Math.round(b.stressMpa || 0)} MPa | FoS: {b.safetyFactor?.toFixed(1) || '10+'}
                    </text>
                  </g>
                )}
              </g>
            );
          }

          if (b.type === 'box') {
            const w = b.width || 60;
            const h = b.height || 60;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx="4"
                  fill="url(#metal-grad-al)"
                  stroke={isSelected ? '#00e5ff' : b.material.strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Cross bracing lines */}
                <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                {/* Mass text */}
                <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {b.mass} kg
                </text>
              </g>
            );
          }

          if (b.type === 'circle') {
            const r = b.radius || 25;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                <circle
                  r={r}
                  fill="rgba(30, 41, 59, 0.9)"
                  stroke={isSelected ? '#00e5ff' : b.material.strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <line x1="0" y1="0" x2={r} y2="0" stroke="#00e5ff" strokeWidth="1.5" />
                <text x="0" y="4" fill="#ffffff" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {b.mass} kg
                </text>
              </g>
            );
          }

          if (b.type === 'wheel') {
            const r = b.radius || 24;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                {/* Thick Rubber Tire with Deep Tread */}
                <circle r={r} fill="#1e293b" stroke="#090d16" strokeWidth="5" />
                {/* 12 Outer Tread Grooves */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = (i * Math.PI * 2) / 12;
                  return (
                    <line
                      key={i}
                      x1={(Math.cos(a) * (r - 5)).toFixed(2)}
                      y1={(Math.sin(a) * (r - 5)).toFixed(2)}
                      x2={(Math.cos(a) * r).toFixed(2)}
                      y2={(Math.sin(a) * r).toFixed(2)}
                      stroke="#05080c"
                      strokeWidth="3"
                    />
                  );
                })}
                {/* Alloy Wheel Rim */}
                <circle r={r * 0.68} fill="url(#metal-grad-al)" stroke={isSelected ? '#00e5ff' : '#0284c7'} strokeWidth={isSelected ? 2.5 : 1.5} />
                {/* 5-Spoke Star Design */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const a = (i * Math.PI * 2) / 5;
                  return (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2={(Math.cos(a) * (r * 0.65)).toFixed(2)}
                      y2={(Math.sin(a) * (r * 0.65)).toFixed(2)}
                      stroke="#0284c7"
                      strokeWidth="2.5"
                    />
                  );
                })}
                {/* Center Hub & Axle Nut */}
                <circle r={r * 0.26} fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
                <circle r="3.5" fill="#f8fafc" />
                {/* Wheel Diameter Tag */}
                <text x="0" y={r + 15} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  Ø{(r * 20).toFixed(0)}mm Lastik
                </text>
              </g>
            );
          }

          if (b.type === 'boat') {
            const w = b.width || 180;
            const h = b.height || 45;
            return (
              <g
                key={b.id}
                transform={`translate(${b.x}, ${b.y}) rotate(${(b.angle * 180) / Math.PI})`}
                onMouseDown={(e) => onBodyMouseDown(b.id, e)}
                className="cursor-pointer"
              >
                {/* Hydrodynamic Boat Hull Shape */}
                <path
                  d={`M ${-w / 2} ${-h / 2} 
                     L ${w / 2 - 25} ${-h / 2} 
                     Q ${w / 2 + 10} ${-h / 4}, ${w / 2} ${h / 2} 
                     L ${-w / 2 + 20} ${h / 2} 
                     Q ${-w / 2} ${h / 4}, ${-w / 2} ${-h / 2} Z`}
                  fill="url(#boat-hull-grad)"
                  stroke={isSelected ? '#00e5ff' : '#0284c7'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {/* Waterline Stripe */}
                <line x1={-w / 2 + 10} y1="2" x2={w / 2 - 8} y2="2" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
                {/* Cabin Deck */}
                <rect x={-30} y={-h / 2 - 20} width="50" height="20" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1" />
                <circle cx={-15} cy={-h / 2 - 10} r="3" fill="#38bdf8" />
                <circle cx={5} cy={-h / 2 - 10} r="3" fill="#38bdf8" />
                {/* Stern Propeller Mount */}
                <rect x={-w / 2 - 6} y="0" width="6" height="18" fill="#f59e0b" rx="2" />
                <text x="0" y={h / 2 + 15} fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  🚤 {b.name}
                </text>
              </g>
            );
          }

          return null;
        })}

        {/* Drag Spring Tether & Live Coordinate Badge */}
        {draggedBodyId && (
          <g pointerEvents="none">
            {(() => {
              const body = bodies.find((b) => b.id === draggedBodyId);
              if (!body || !Number.isFinite(body.x) || !Number.isFinite(body.y)) return null;
              return (
                <>
                  {mousePos && (
                    <line
                      x1={body.x}
                      y1={body.y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke="#00e5ff"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                  {/* Floating Live Coordinates Badge */}
                  <g transform={`translate(${body.x}, ${body.y - 45})`}>
                    <rect
                      x="-70"
                      y="-14"
                      width="140"
                      height="24"
                      rx="6"
                      fill="rgba(8, 13, 22, 0.95)"
                      stroke="#00e5ff"
                      strokeWidth="1.5"
                    />
                    <text x="0" y="3" fill="#00e5ff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      X: {Math.round(body.x)} | Y: {Math.round(body.y)}
                    </text>
                  </g>
                </>
              );
            })()}
          </g>
        )}

        {showDebug && (
          <g pointerEvents="none">
            {contacts.map((c, i) => (
              <g key={`c-${i}`}>
                <circle cx={c.x} cy={c.y} r="3.5" fill="#f472b6" opacity="0.9" />
                <line
                  x1={c.x}
                  y1={c.y}
                  x2={c.x + c.nx * 18}
                  y2={c.y + c.ny * 18}
                  stroke="#f472b6"
                  strokeWidth="1.5"
                />
              </g>
            ))}
            {bodies.map((b) => {
              const vx = (b.vx || 0) * 0.04;
              const vy = (b.vy || 0) * 0.04;
              if (Math.hypot(vx, vy) < 2) return null;
              return (
                <line
                  key={`v-${b.id}`}
                  x1={b.x}
                  y1={b.y}
                  x2={b.x + vx}
                  y2={b.y + vy}
                  stroke="#34d399"
                  strokeWidth="1.6"
                  markerEnd="url(#vel-arrow)"
                  opacity="0.85"
                />
              );
            })}
            {bodies.filter((b) => b.type === 'wheel').map((b) => (
              <text
                key={`slip-${b.id}`}
                x={b.x}
                y={b.y + (b.radius || 24) + 28}
                fill={b.grounded ? '#34d399' : '#64748b'}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {b.grounded ? `μ-slip ${Math.round(b.slipSpeed || 0)}` : 'hava'}
              </text>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
};

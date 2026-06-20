'use client';

/**
 * AeGiS Logo — Animated SVG Brand Mark
 * 
 * A hexagonal AI shield with rotating orbits, neural pulses,
 * and glowing core. Used as the AeGiS identity icon throughout the app.
 */

import React from 'react';

interface AegisIconProps {
  size?: number;
  className?: string;
  /** 'idle' = slow ambient pulse | 'active' = fast orbit + glow | 'thinking' = rapid spin */
  mode?: 'idle' | 'active' | 'thinking';
}

export function AegisIcon({ size = 32, className = '', mode = 'idle' }: AegisIconProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.38;

  // Hexagon points
  const hex = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(4)},${y.toFixed(4)}`;
  }).join(' ');

  const orbitDur = mode === 'thinking' ? '0.8s' : mode === 'active' ? '2s' : '4s';
  const pulseDur = mode === 'thinking' ? '0.5s' : '2s';
  const glowOpacity = mode === 'active' || mode === 'thinking' ? '0.9' : '0.6';

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AeGiS"
    >
      <defs>
        {/* Core gradient */}
        <radialGradient id={`aegis-core-${s}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        {/* Glow filter */}
        <filter id={`aegis-glow-${s}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={s * 0.06} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shield clip */}
        <clipPath id={`aegis-clip-${s}`}>
          <polygon points={hex} />
        </clipPath>

        {/* Orbit gradient */}
        <linearGradient id={`aegis-orbit-${s}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Outer ambient ring ── */}
      <circle cx={cx} cy={cy} r={r * 1.22}
        stroke="#00e5ff" strokeWidth={s * 0.012} strokeOpacity="0.12"
        strokeDasharray={`${r * 0.4} ${r * 0.2}`} fill="none">
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={`${parseFloat(orbitDur) * 3}s`}
          repeatCount="indefinite" />
      </circle>

      {/* ── Hex background fill ── */}
      <polygon points={hex}
        fill="#050d1a" stroke="#00e5ff" strokeWidth={s * 0.025} strokeOpacity="0.35"
        filter={`url(#aegis-glow-${s})`} />

      {/* ── Inner hex ring ── */}
      <polygon points={
        Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const ri = r * 0.72;
          const x = cx + ri * Math.cos(angle);
          const y = cy + ri * Math.sin(angle);
          return `${x.toFixed(4)},${y.toFixed(4)}`;
        }).join(' ')
      }
        fill="none" stroke="#00e5ff" strokeWidth={s * 0.012} strokeOpacity="0.18" />

      {/* ── Radial neural lines ── */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = (cx + r * 0.72 * Math.cos(rad)).toFixed(4);
        const y2 = (cy + r * 0.72 * Math.sin(rad)).toFixed(4);
        return (
          <line key={i} x1={cx} y1={cy} x2={x2} y2={y2}
            stroke="#00e5ff" strokeWidth={s * 0.008} strokeOpacity="0.2">
            <animate attributeName="stroke-opacity"
              values="0.1;0.35;0.1" dur={`${1.2 + i * 0.3}s`}
              repeatCount="indefinite" />
          </line>
        );
      })}

      {/* ── Spinning orbit arc ── */}
      <g filter={`url(#aegis-glow-${s})`}>
        <circle cx={cx} cy={cy} r={r * 0.52}
          fill="none" stroke="url(#aegis-orbit-${s})"
          strokeWidth={s * 0.022} strokeLinecap="round"
          strokeDasharray={`${r * 1.1} ${r * 2.3}`}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={orbitDur}
            repeatCount="indefinite" />
        </circle>
      </g>

      {/* ── Counter-orbit dot ── */}
      <circle cx={cx} cy={cy - r * 0.52} r={s * 0.03}
        fill="#00e5ff" opacity="0.9" filter={`url(#aegis-glow-${s})`}>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${cx} ${cy}`} to={`-360 ${cx} ${cy}`} dur={`${parseFloat(orbitDur) * 1.5}s`}
          repeatCount="indefinite" />
        <animate attributeName="r" values={`${s * 0.025};${s * 0.045};${s * 0.025}`}
          dur={pulseDur} repeatCount="indefinite" />
      </circle>

      {/* ── Core glow pulse ── */}
      <circle cx={cx} cy={cy} r={r * 0.28}
        fill={`url(#aegis-core-${s})`} opacity={glowOpacity}>
        <animate attributeName="r" values={`${r * 0.22};${r * 0.32};${r * 0.22}`}
          dur={pulseDur} repeatCount="indefinite" />
        <animate attributeName="opacity"
          values={`${parseFloat(glowOpacity) * 0.6};${glowOpacity};${parseFloat(glowOpacity) * 0.6}`}
          dur={pulseDur} repeatCount="indefinite" />
      </circle>

      {/* ── Center dot ── */}
      <circle cx={cx} cy={cy} r={s * 0.045}
        fill="#00e5ff" filter={`url(#aegis-glow-${s})`} />

      {/* ── "A" letter mark (subtle) ── */}
      <text
        x={cx} y={cy + s * 0.08}
        textAnchor="middle"
        fontSize={s * 0.22}
        fontFamily="'Inter', 'SF Pro Display', sans-serif"
        fontWeight="900"
        fill="#00e5ff"
        fillOpacity="0.85"
        letterSpacing="-1"
        style={{ userSelect: 'none' }}
      >
        Æ
      </text>
    </svg>
  );
}

export default AegisIcon;

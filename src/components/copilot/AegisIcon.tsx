'use client';

import React, { useId } from 'react';

interface AegisIconProps {
  size?: number;
  className?: string;
  mode?: 'idle' | 'active' | 'thinking' | 'tracking';
  /** Kept for call-site compatibility. Always a compact brand mark. */
  pure?: boolean;
}

/** Instrument hex mark — same geometry language as the AluCalc navbar logo. */
export function AegisIcon({ size = 32, className = '', mode = 'idle' }: AegisIconProps) {
  const uid = useId().replace(/:/g, '');
  const thinking = mode === 'thinking';
  const active = mode === 'active' || mode === 'tracking';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AeGiS Copilot"
    >
      <defs>
        <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3ad0e6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M18 3L32 11V25L18 33L4 25V11L18 3Z"
        fill="#07090c"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.75"
        strokeLinejoin="round"
        filter={`url(#${uid}-glow)`}
      />
      <path
        d="M18 3L32 11L18 19L4 11L18 3Z"
        fill="#3ad0e6"
        fillOpacity={active ? 0.28 : 0.12}
        stroke="#3ad0e6"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M18 19V33M4 11L18 19L32 11"
        stroke={`url(#${uid}-stroke)`}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="19" r={thinking ? 3.4 : 2.6} fill="#3ad0e6">
        {thinking && (
          <animate attributeName="r" values="2.4;3.6;2.4" dur="0.9s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="18" cy="19" r="1" fill="#ffffff" />
    </svg>
  );
}

export default AegisIcon;

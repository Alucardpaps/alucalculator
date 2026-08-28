'use client';

import React from 'react';

export function ModalityIcon({
  type,
  size = 26,
  className = '',
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', className };
  switch (type) {
    case 'calculation':
      return (
        <svg {...common}>
          <style>{`@keyframes calcBlink { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
          <rect x="8" y="6" width="32" height="36" rx="6" fill="#042f2e" stroke="#2dd4bf" strokeWidth="2.2" />
          <rect x="12" y="10" width="24" height="10" rx="2" fill="#0f172a" stroke="#5eead4" strokeWidth="1.2" />
          <text x="24" y="18" textAnchor="middle" fontSize="8" fill="#5eead4" fontFamily="monospace">123</text>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}${c}`} x={13 + c * 8} y={24 + r * 5.5} width="6" height="4.2" rx="1" fill="#14b8a6" style={{ animation: 'calcBlink 1.4s ease-in-out infinite', animationDelay: `${(r + c) * 0.12}s` }} />
            )),
          )}
        </svg>
      );
    case 'drawing':
      return (
        <svg {...common}>
          <style>{`@keyframes penDraw { 0%{transform:translate(0,0)} 50%{transform:translate(4px,-3px)} 100%{transform:translate(0,0)} }`}</style>
          <rect x="7" y="10" width="34" height="28" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <path d="M12 30 L22 18 L36 28" fill="none" stroke="#a5b4fc" strokeWidth="2" />
          <g style={{ animation: 'penDraw 1.6s ease-in-out infinite', transformOrigin: '30px 16px' }}>
            <path d="M28 14 L38 8 L40 12 Z" fill="#fbbf24" stroke="#f59e0b" />
            <line x1="28" y1="14" x2="18" y2="26" stroke="#fcd34d" strokeWidth="2" />
          </g>
        </svg>
      );
    case 'visual':
      return (
        <svg {...common}>
          <style>{`@keyframes visPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
          <rect x="6" y="10" width="36" height="26" rx="4" fill="#4c0519" stroke="#fb7185" strokeWidth="2" />
          <circle cx="18" cy="22" r="5" fill="#fda4af" style={{ animation: 'visPulse 1.5s ease-in-out infinite', transformOrigin: '18px 22px' }} />
          <path d="M26 30 L32 22 L40 30 Z" fill="#fb7185" />
        </svg>
      );
    case 'boss':
      return (
        <svg {...common}>
          <style>{`@keyframes crownShine { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
          <path d="M8 30 L10 14 L18 24 L24 10 L30 24 L38 14 L40 30 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.6" />
          <rect x="10" y="30" width="28" height="6" rx="1" fill="#b45309" />
          <circle cx="24" cy="10" r="3" fill="#fde68a" style={{ animation: 'crownShine 1.2s ease-in-out infinite' }} />
        </svg>
      );
    case 'quiz':
    default:
      return (
        <svg {...common}>
          <style>{`@keyframes boltFlash { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.6)} }`}</style>
          <path d="M26 4 L12 26 H22 L18 44 L38 20 H26 Z" fill="#38bdf8" stroke="#7dd3fc" strokeWidth="1.5" style={{ animation: 'boltFlash 1.1s ease-in-out infinite' }} />
        </svg>
      );
  }
}

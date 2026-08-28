'use client';

import React from 'react';

interface AluCalcLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * 💎 OFFICIAL ALUCALC VECTOR BRAND LOGO
 * Precision Isometric Aluminum Profile with Animated Gradient Stroke
 */
export function AluCalcLogo({ size = 28, className = '', animate = true }: AluCalcLogoProps) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center group ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 ${animate ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}
      >
        <defs>
          <linearGradient id="alu-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="alu-grad-glow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
          </linearGradient>
          <filter id="alu-glow-fx" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Isometric Hexagonal B-Rep Profile */}
        <path
          d="M18 3L32 11V25L18 33L4 25V11L18 3Z"
          fill="#060d19"
          stroke="url(#alu-grad-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#alu-glow-fx)"
        />

        {/* Top Isometric Facet */}
        <path
          d="M18 3L32 11L18 19L4 11L18 3Z"
          fill="url(#alu-grad-glow)"
          fillOpacity="0.18"
          stroke="#00e5ff"
          strokeWidth="1.2"
          strokeLinejoin="round"
          className={animate ? 'transition-all duration-300 group-hover:fill-opacity-35' : ''}
        />

        {/* Isometric Internal T-Slot / Core Web Structure */}
        <path
          d="M18 19V33M4 11L18 19L32 11"
          stroke="url(#alu-grad-primary)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Center Precision Engineering Core Dot */}
        <circle
          cx="18"
          cy="19"
          r="3"
          fill="#00e5ff"
          className={animate ? 'animate-pulse' : ''}
        />
        <circle
          cx="18"
          cy="19"
          r="1.2"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}

export default AluCalcLogo;

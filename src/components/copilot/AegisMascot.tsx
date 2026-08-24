'use client';

import React from 'react';

interface AegisMascotProps {
  size?: number;
  className?: string;
  isHovered?: boolean;
}

export function AegisMascot({ size = 44, className = '', isHovered = false }: AegisMascotProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <style>{`
        @keyframes aegisFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3.5px) rotate(0.5deg); }
        }
        @keyframes eyeBlink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 8px rgba(0,229,255,0.4)); }
          50% { opacity: 0.95; filter: drop-shadow(0 0 16px rgba(0,229,255,0.8)); }
        }
        .aegis-mascot-anim {
          animation: aegisFloat 3s ease-in-out infinite;
        }
        .aegis-eye-blink {
          transform-origin: center;
          animation: eyeBlink 4s infinite ease-in-out;
        }
        .aegis-glow-pulse {
          animation: glowPulse 2.5s infinite ease-in-out;
        }
      `}</style>

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible aegis-mascot-anim aegis-glow-pulse"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Head Body Gradient */}
          <linearGradient id="aegisHeadGrad" x1="50" y1="15" x2="50" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0f2238" />
            <stop offset="50%" stopColor="#0a1828" />
            <stop offset="100%" stopColor="#050e18" />
          </linearGradient>

          {/* Cyan Glow Filter */}
          <filter id="aegisNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Side Ear Bolt/Antenna Left */}
        <rect
          x="12"
          y="42"
          width="8"
          height="16"
          rx="3"
          fill="#00e5ff"
          opacity="0.8"
          stroke="#00e5ff"
          strokeWidth="1.5"
        />

        {/* Side Ear Bolt/Antenna Right */}
        <rect
          x="80"
          y="42"
          width="8"
          height="16"
          rx="3"
          fill="#00e5ff"
          opacity="0.8"
          stroke="#00e5ff"
          strokeWidth="1.5"
        />

        {/* Outer Hexagonal Shield Head */}
        <polygon
          points="50,16 82,32 82,68 50,84 18,68 18,32"
          fill="url(#aegisHeadGrad)"
          stroke="#00e5ff"
          strokeWidth="3.5"
          strokeLinejoin="round"
          filter="url(#aegisNeonGlow)"
        />

        {/* Inner Subtle Circuit Bevel Line */}
        <polygon
          points="50,22 76,35 76,65 50,78 24,65 24,35"
          fill="none"
          stroke="rgba(0,229,255,0.25)"
          strokeWidth="1.2"
          strokeDasharray="4,3"
          strokeLinejoin="round"
        />

        {/* Forehead Core Tech Node */}
        <circle cx="50" cy="27" r="2.5" fill="#00e5ff" />

        {/* Left Eye */}
        <g className="aegis-eye-blink">
          <ellipse cx="37" cy="48" rx="6.5" ry="7.5" fill="#00e5ff" filter="url(#aegisNeonGlow)" />
          {/* Pupil / Highlight reflection */}
          <circle cx="35" cy="45.5" r="2.2" fill="#ffffff" />
          <circle cx="39" cy="50.5" r="1.1" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Right Eye */}
        <g className="aegis-eye-blink">
          <ellipse cx="63" cy="48" rx="6.5" ry="7.5" fill="#00e5ff" filter="url(#aegisNeonGlow)" />
          {/* Pupil / Highlight reflection */}
          <circle cx="61" cy="45.5" r="2.2" fill="#ffffff" />
          <circle cx="65" cy="50.5" r="1.1" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Cute Cheerful Smile */}
        <path
          d={isHovered ? "M 40,61 Q 50,71 60,61" : "M 42,62 Q 50,69 58,62"}
          stroke="#00e5ff"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          filter="url(#aegisNeonGlow)"
        />

        {/* Soft Cheeks (Blush) */}
        <circle cx="28" cy="57" r="3" fill="#00e5ff" opacity="0.35" />
        <circle cx="72" cy="57" r="3" fill="#00e5ff" opacity="0.35" />
      </svg>
    </div>
  );
}

export default AegisMascot;

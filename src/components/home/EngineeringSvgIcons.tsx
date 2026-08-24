'use client';

import React from 'react';

export function BoltTorqueSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes fs-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        @keyframes fs-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        .fs-float { animation: fs-float 3.2s ease-in-out infinite; }
        .fs-pulse { animation: fs-pulse 2.8s ease-in-out infinite; }
      `}</style>
      <g className="fs-float">
        <path d="M60 14 l10 5.5 v11 L60 36 l-10-5.5 v-11 Z" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1.35" strokeLinejoin="round" />
        <path d="M50 19.5 h20" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.3" />
        <circle cx="60" cy="25" r="3.2" fill="#8aa4c8" fillOpacity="0.35" />
        <ellipse cx="60" cy="37" rx="11" ry="3" fill="#8aa4c8" fillOpacity="0.12" stroke="#8aa4c8" strokeWidth="1" />
        <rect x="54.5" y="38" width="11" height="18" rx="1.5" fill="#8aa4c8" fillOpacity="0.16" stroke="#8aa4c8" strokeWidth="1.15" />
        <path d="M54.5 40 l2.5 1.5 l2.5-1.5 l2.5 1.5 l2.5-1.5" stroke="#8aa4c8" strokeWidth="0.85" strokeOpacity="0.45" fill="none" strokeLinejoin="round" />
        <path d="M54.5 43.5 l2.5 1.5 l2.5-1.5 l2.5 1.5 l2.5-1.5" stroke="#8aa4c8" strokeWidth="0.85" strokeOpacity="0.45" fill="none" strokeLinejoin="round" />
        <path d="M54.5 47 l2.5 1.5 l2.5-1.5 l2.5 1.5 l2.5-1.5" stroke="#8aa4c8" strokeWidth="0.85" strokeOpacity="0.45" fill="none" strokeLinejoin="round" />
        <path d="M54.5 50.5 l2.5 1.5 l2.5-1.5 l2.5 1.5 l2.5-1.5" stroke="#8aa4c8" strokeWidth="0.85" strokeOpacity="0.45" fill="none" strokeLinejoin="round" />
        <path d="M54.5 54 l2.5 1.5 l2.5-1.5 l2.5 1.5 l2.5-1.5" stroke="#8aa4c8" strokeWidth="0.85" strokeOpacity="0.45" fill="none" strokeLinejoin="round" />
        <path d="M54.5 56 h11 l-5.5 10 z" fill="#8aa4c8" fillOpacity="0.3" stroke="#8aa4c8" strokeWidth="1.05" strokeLinejoin="round" />
      </g>
      <g opacity="0.4">
        <line x1="78" y1="38" x2="78" y2="56" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="78" y1="35.5" x2="78" y2="40.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="78" y1="53.5" x2="78" y2="58.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <text x="78" y="44" textAnchor="middle" fontSize="6.5" fontFamily="ui-sans-serif,system-ui" fontWeight="600" fill="#8aa4c8">L</text>
      </g>
      <text x="88" y="22" fontSize="7" fontFamily="ui-sans-serif,system-ui" fontWeight="700" fill="#8aa4c8" fillOpacity="0.4" className="fs-pulse">M</text>
    </svg>
  );
}

export function BearingSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes br-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes br-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        .br-ring { animation: br-spin 10s linear infinite; transform-origin: 60px 40px; }
        .br-pulse { animation: br-pulse 2.8s ease-in-out infinite; }
      `}</style>
      <circle cx="60" cy="40" r="27" fill="#8aa4c8" fillOpacity="0.05" stroke="#8aa4c8" strokeWidth="3" strokeOpacity="0.4" />
      <circle cx="60" cy="40" r="24.5" fill="none" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.2" />
      <circle cx="60" cy="40" r="13" fill="#8aa4c8" fillOpacity="0.06" stroke="#8aa4c8" strokeWidth="2.4" strokeOpacity="0.45" />
      <circle cx="60" cy="40" r="10" fill="none" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.25" />
      <circle cx="60" cy="40" r="18.5" fill="none" stroke="#8aa4c8" strokeWidth="0.9" strokeOpacity="0.18" strokeDasharray="2 2" />
      <g className="br-ring">
        <g><circle cx="82" cy="40" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="80.9" cy="38.9" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="73.7" cy="57.2" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="72.6" cy="56.1" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="55.2" cy="61.5" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="54.1" cy="60.4" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="40.4" cy="49.7" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="39.3" cy="48.6" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="40.4" cy="30.3" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="39.3" cy="29.2" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="55.2" cy="18.5" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="54.1" cy="17.4" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
        <g><circle cx="73.7" cy="22.8" r="4.4" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.7" /><circle cx="72.6" cy="21.7" r="1.2" fill="#8aa4c8" fillOpacity="0.35" /></g>
      </g>
      <circle cx="60" cy="40" r="4.5" fill="#8aa4c8" fillOpacity="0.18" stroke="#8aa4c8" strokeWidth="1.1" />
      <circle cx="60" cy="40" r="2" fill="#8aa4c8" fillOpacity="0.6" className="br-pulse" />
      <text x="60" y="72" textAnchor="middle" fontSize="6.5" fontFamily="ui-sans-serif,system-ui" fontWeight="600" fill="#8aa4c8" fillOpacity="0.4">d</text>
    </svg>
  );
}

export function BeamDeflectionSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes bd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes bd-bob { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-1.5px) scale(1.03)} }
        .bd-float { animation: bd-float 3.2s ease-in-out infinite; }
        .bd-bob { animation: bd-bob 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>
      <line x1="24" y1="34" x2="96" y2="34" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="3 2" />
      <path d="M22 56 l7 10 h-14 z" fill="#8aa4c8" fillOpacity="0.32" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M98 56 l7 10 h-14 z" fill="#8aa4c8" fillOpacity="0.32" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="16" y1="66" x2="34" y2="66" stroke="#8aa4c8" strokeWidth="1.3" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="86" y1="66" x2="104" y2="66" stroke="#8aa4c8" strokeWidth="1.3" strokeOpacity="0.35" strokeLinecap="round" />
      <circle cx="94" cy="68" r="2" fill="none" stroke="#8aa4c8" strokeWidth="0.9" strokeOpacity="0.35" />
      <circle cx="100" cy="68" r="2" fill="none" stroke="#8aa4c8" strokeWidth="0.9" strokeOpacity="0.35" />
      <g className="bd-float">
        <path d="M24 34 C40 34 50 50 60 50 C70 50 80 34 96 34" stroke="#8aa4c8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
        <path d="M24 34 C40 34 50 50 60 50 C70 50 80 34 96 34" stroke="#8aa4c8" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.08" />
        <line x1="36" y1="36" x2="36" y2="30" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="48" y1="44" x2="48" y2="38" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="60" y1="50" x2="60" y2="44" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="72" y1="44" x2="72" y2="38" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="84" y1="36" x2="84" y2="30" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.25" />
      </g>
      <g className="bd-bob">
        <line x1="60" y1="12" x2="60" y2="42" stroke="#8aa4c8" strokeWidth="1.3" strokeOpacity="0.6" />
        <path d="M55 38 l5 7 5-7" fill="none" stroke="#8aa4c8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="11" r="3.5" fill="#8aa4c8" fillOpacity="0.2" stroke="#8aa4c8" strokeWidth="1" />
        <text x="68" y="14" fontSize="7" fill="#8aa4c8" fillOpacity="0.5" fontFamily="ui-sans-serif,system-ui" fontWeight="700">P</text>
      </g>
      <text x="64" y="54" fontSize="6.5" fill="#8aa4c8" fillOpacity="0.4" fontFamily="ui-sans-serif,system-ui" fontWeight="600">δ</text>
    </svg>
  );
}

export function ShaftsSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes st-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .st-float { animation: st-float 3.2s ease-in-out infinite; }
      `}</style>
      <line x1="20" y1="58" x2="102" y2="58" stroke="#8aa4c8" strokeOpacity="0.28" strokeWidth="1.15" />
      <line x1="26" y1="68" x2="26" y2="12" stroke="#8aa4c8" strokeOpacity="0.28" strokeWidth="1.15" />
      <path d="M100 55 l4 3 -4 3" fill="none" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
      <path d="M23 14 l3-4 3 4" fill="none" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
      <g className="st-float">
        <circle cx="60" cy="40" r="18" fill="#8aa4c8" fillOpacity="0.06" stroke="#8aa4c8" strokeWidth="1.55" strokeOpacity="0.7" />
        <line x1="42" y1="40" x2="78" y2="40" stroke="#8aa4c8" strokeWidth="1.15" strokeOpacity="0.45" />
        <line x1="60" y1="22" x2="60" y2="58" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.28" strokeDasharray="2 2" />
        <circle cx="78" cy="40" r="3.4" fill="#8aa4c8" fillOpacity="0.65" />
        <circle cx="42" cy="40" r="3.4" fill="#8aa4c8" fillOpacity="0.4" />
        <circle cx="60" cy="22" r="2.4" fill="#8aa4c8" fillOpacity="0.35" />
        <circle cx="60" cy="40" r="2.6" fill="#8aa4c8" fillOpacity="0.5" />
        <path d="M70 28 q8 4 4 12" stroke="#8aa4c8" strokeWidth="1" fill="none" strokeOpacity="0.35" />
      </g>
      <text x="104" y="62" fontSize="6.5" fill="#8aa4c8" fillOpacity="0.4" fontFamily="ui-sans-serif,system-ui" fontWeight="600">σ</text>
      <text x="18" y="16" fontSize="6.5" fill="#8aa4c8" fillOpacity="0.4" fontFamily="ui-sans-serif,system-ui" fontWeight="600">τ</text>
    </svg>
  );
}

export function GearsSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes gd-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes gd-spinr { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
        @keyframes gd-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        .gd-s1 { animation: gd-spin 7s linear infinite; transform-origin: 42px 42px; }
        .gd-s2 { animation: gd-spinr 4.6s linear infinite; transform-origin: 78px 40px; }
        .gd-pulse { animation: gd-pulse 2.8s ease-in-out infinite; }
      `}</style>
      <line x1="58" y1="40" x2="66" y2="40" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 2" />
      <g className="gd-s1">
        <polygon points="57.00,42.00 61.89,45.54 61.21,48.24 55.49,48.56 54.14,50.82 56.01,56.55 53.87,58.34 49.06,55.23 46.64,56.27 44.78,62.01 42.00,62.20 39.93,56.86 37.36,56.27 32.49,59.82 30.13,58.34 31.60,52.80 29.86,50.82 23.83,50.83 22.79,48.24 27.23,44.63 27.00,42.00 22.11,38.46 22.79,35.76 28.51,35.44 29.86,33.18 27.99,27.45 30.13,25.66 34.94,28.77 37.36,27.73 39.22,21.99 42.00,21.80 44.07,27.14 46.64,27.73 51.51,24.18 53.87,25.66 52.40,31.20 54.14,33.18 60.17,33.17 61.21,35.76 56.77,39.37" fill="#8aa4c8" fillOpacity="0.14" stroke="#8aa4c8" strokeWidth="1.35" strokeLinejoin="round" />
        <circle cx="42" cy="42" r="10.8" fill="none" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.22" strokeDasharray="2 2" />
        <circle cx="42" cy="42" r="7.2" fill="#8aa4c8" fillOpacity="0.1" stroke="#8aa4c8" strokeWidth="1.15" />
        <circle cx="42" cy="42" r="2.1" fill="#8aa4c8" fillOpacity="0.55" />
      </g>
      <g className="gd-s2">
        <polygon points="88.50,40.00 91.96,43.12 91.21,45.47 86.87,45.63 85.42,47.42 85.66,52.07 83.47,53.21 80.29,50.25 78.00,50.50 74.88,53.96 72.53,53.21 72.37,48.87 70.58,47.42 65.93,47.66 64.79,45.47 67.75,42.29 67.50,40.00 64.04,36.88 64.79,34.53 69.13,34.37 70.58,32.58 70.34,27.93 72.53,26.79 75.71,29.75 78.00,29.50 81.12,26.04 83.47,26.79 83.63,31.13 85.42,32.58 90.07,32.34 91.21,34.53 88.25,37.71" fill="#8aa4c8" fillOpacity="0.14" stroke="#8aa4c8" strokeWidth="1.35" strokeLinejoin="round" />
        <circle cx="78" cy="40" r="7.56" fill="none" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.22" strokeDasharray="2 2" />
        <circle cx="78" cy="40" r="5.04" fill="#8aa4c8" fillOpacity="0.1" stroke="#8aa4c8" strokeWidth="1.15" />
        <circle cx="78" cy="40" r="1.47" fill="#8aa4c8" fillOpacity="0.55" />
      </g>
      <g opacity="0.4">
        <line x1="42" y1="68" x2="78" y2="68" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="42" y1="65.5" x2="42" y2="70.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="78" y1="65.5" x2="78" y2="70.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <text x="60" y="65" textAnchor="middle" fontSize="6.5" fontFamily="ui-sans-serif,system-ui" fontWeight="600" fill="#8aa4c8">a</text>
      </g>
      <circle cx="60" cy="16" r="1.8" fill="#8aa4c8" className="gd-pulse" opacity="0.45" />
    </svg>
  );
}

export function ThreePhaseSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes tpw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes tpw-pulse { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
        .tpw-float { animation: tpw-float 3.2s ease-in-out infinite; }
        .tpw-pulse { animation: tpw-pulse 2.8s ease-in-out infinite; }
      `}</style>
      <circle cx="60" cy="40" r="22" fill="none" stroke="#8aa4c8" strokeWidth="0.9" strokeOpacity="0.15" strokeDasharray="3 3" />
      <g className="tpw-float">
        <g>
          <line x1="60" y1="40" x2="60" y2="22" stroke="#8aa4c8" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="60" cy="22" r="7" fill="#8aa4c8" fillOpacity="0.12" stroke="#8aa4c8" strokeWidth="1.2" />
          <text x="60" y="24.8" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#8aa4c8" fillOpacity="0.8" fontFamily="ui-sans-serif,system-ui">L1</text>
        </g>
        <g>
          <line x1="60" y1="40" x2="75.6" y2="49" stroke="#8aa4c8" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="75.6" cy="49" r="7" fill="#8aa4c8" fillOpacity="0.17" stroke="#8aa4c8" strokeWidth="1.2" />
          <text x="75.6" y="51.8" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#8aa4c8" fillOpacity="0.8" fontFamily="ui-sans-serif,system-ui">L2</text>
        </g>
        <g>
          <line x1="60" y1="40" x2="44.4" y2="49" stroke="#8aa4c8" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="44.4" cy="49" r="7" fill="#8aa4c8" fillOpacity="0.22" stroke="#8aa4c8" strokeWidth="1.2" />
          <text x="44.4" y="51.8" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#8aa4c8" fillOpacity="0.8" fontFamily="ui-sans-serif,system-ui">L3</text>
        </g>
        <circle cx="60" cy="40" r="5" fill="#8aa4c8" fillOpacity="0.15" stroke="#8aa4c8" strokeWidth="1.1" />
        <circle cx="60" cy="40" r="2.2" fill="#8aa4c8" fillOpacity="0.55" className="tpw-pulse" />
      </g>
      <text x="60" y="72" textAnchor="middle" fontSize="6.5" fill="#8aa4c8" fillOpacity="0.4" fontFamily="ui-sans-serif,system-ui" fontWeight="600">120°</text>
    </svg>
  );
}

export function ProfileWeightSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes pw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .pw-float { animation: pw-float 3.2s ease-in-out infinite; }
      `}</style>
      <g className="pw-float">
        <rect x="26" y="26" width="68" height="9" rx="2" fill="#8aa4c8" fillOpacity="0.12" stroke="#8aa4c8" strokeWidth="1.35" />
        <rect x="26" y="51" width="68" height="9" rx="2" fill="#8aa4c8" fillOpacity="0.12" stroke="#8aa4c8" strokeWidth="1.35" />
        <rect x="54" y="26" width="12" height="34" rx="2" fill="#8aa4c8" fillOpacity="0.28" stroke="#8aa4c8" strokeWidth="1.2" />
        <line x1="60" y1="28" x2="60" y2="58" stroke="#8aa4c8" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="2 2" />
      </g>
      <g opacity="0.4">
        <line x1="26" y1="66" x2="94" y2="66" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="26" y1="63.5" x2="26" y2="68.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <line x1="94" y1="63.5" x2="94" y2="68.5" stroke="#8aa4c8" strokeWidth="0.9" />
        <text x="60" y="63" textAnchor="middle" fontSize="6.5" fontFamily="ui-sans-serif,system-ui" fontWeight="600" fill="#8aa4c8">L</text>
      </g>
      <text x="72" y="16" fontSize="7" fontFamily="ui-sans-serif,system-ui" fontWeight="700" fill="#8aa4c8" fillOpacity="0.55">W</text>
    </svg>
  );
}

export function FitsTolerancesSvg() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <style>{`
        @keyframes ftol-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .ftol-float { animation: ftol-float 3.2s ease-in-out infinite; }
      `}</style>
      <g className="ftol-float">
        <rect x="18" y="24" width="40" height="34" rx="5" fill="#8aa4c8" fillOpacity="0.08" stroke="#8aa4c8" strokeWidth="1.35" />
        <circle cx="38" cy="41" r="11" fill="none" stroke="#8aa4c8" strokeWidth="1.6" strokeOpacity="0.55" />
        <circle cx="38" cy="41" r="9.2" fill="none" stroke="#8aa4c8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 1.5" />
        <rect x="64" y="28" width="38" height="26" rx="13" fill="#8aa4c8" fillOpacity="0.14" stroke="#8aa4c8" strokeWidth="1.35" />
        <circle cx="74" cy="41" r="8" fill="#8aa4c8" fillOpacity="0.1" stroke="#8aa4c8" strokeWidth="1.15" />
      </g>
      <path d="M50 41 h12" stroke="#8aa4c8" strokeWidth="1.1" strokeDasharray="2 2" opacity="0.35" />
      <path d="M58 37 l4 4 -4 4" fill="none" stroke="#8aa4c8" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
      <text x="60" y="16" textAnchor="middle" fontSize="7.5" fontFamily="ui-sans-serif,system-ui" fontWeight="700" fill="#8aa4c8" fillOpacity="0.5">H7 / g6</text>
    </svg>
  );
}

export function SvgSolverIcon({ slug }: { slug: string }) {
  switch (slug) {
    case 'bolt-torque':
      return <BoltTorqueSvg />;
    case 'bearings':
      return <BearingSvg />;
    case 'beam-deflection':
      return <BeamDeflectionSvg />;
    case 'shafts':
    case 'shaft-diameter':
      return <ShaftsSvg />;
    case 'gears':
    case 'gear-ratio':
      return <GearsSvg />;
    case 'three-phase-power':
    case '3-phase-power':
      return <ThreePhaseSvg />;
    case 'profile-weight':
    case 'aluminum':
      return <ProfileWeightSvg />;
    case 'fits':
    case 'fits-tolerances':
      return <FitsTolerancesSvg />;
    default:
      return <BoltTorqueSvg />;
  }
}

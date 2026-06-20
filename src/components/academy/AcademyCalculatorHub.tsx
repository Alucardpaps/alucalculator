'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, ChevronRight } from 'lucide-react';
import {
  getCalculatorsPage,
  formatWorkstationNodes,
  CALC_MODULE_I18N_KEYS,
} from '@/locales/calculatorsPageTranslations';
import { useI18nStore } from '@/store/i18nStore';
import {
  CALCULATOR_HUB_MODULES,
  CALC_HUB_GROUP_ORDER,
} from '@/data/calculatorHubData';

// ─────────────────────────────────────────────────────────────────────────────
// Unique SVG Illustrations (animated, self-contained)
// ─────────────────────────────────────────────────────────────────────────────

const SVG_ILLUSTRATIONS: Record<string, React.FC<{ color: string }>> = {

  profileWeight: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="30" width="100" height="12" rx="2" fill={color} opacity="0.15" />
      <rect x="10" y="30" width="100" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="30" width="6" height="40" rx="1" fill={color} opacity="0.3" />
      <rect x="104" y="30" width="6" height="40" rx="1" fill={color} opacity="0.3" />
      <line x1="60" y1="0" x2="60" y2="28" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <path d="M50 8 L60 0 L70 8" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
      <text x="62" y="20" fontSize="8" fill={color} opacity="0.8" fontFamily="monospace">W</text>
      <style>{`
        @keyframes weigh { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .weigh-anim { animation: weigh 2.5s ease-in-out infinite; transform-origin:60px 40px; }
      `}</style>
      <g className="weigh-anim">
        <rect x="30" y="52" width="60" height="10" rx="2" fill={color} opacity="0.2" />
        <text x="60" y="60" fontSize="7" fill={color} textAnchor="middle" opacity="0.9" fontFamily="monospace">kg/m</text>
      </g>
    </svg>
  ),

  gearDesign: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes spin1 { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes spin2 { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
        .g1{animation:spin1 4s linear infinite;transform-origin:40px 40px}
        .g2{animation:spin2 2.7s linear infinite;transform-origin:82px 40px}
      `}</style>
      <g className="g1">
        {[0,45,90,135,180,225,270,315].map((a,i)=>(
          <rect key={i} x="36" y="16" width="8" height="8" rx="1" fill={color} opacity="0.7"
            transform={`rotate(${a} 40 40)`} />
        ))}
        <circle cx="40" cy="40" r="12" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
        <circle cx="40" cy="40" r="4" fill={color} opacity="0.5" />
      </g>
      <g className="g2">
        {[0,60,120,180,240,300].map((a,i)=>(
          <rect key={i} x="78" y="22" width="7" height="7" rx="1" fill={color} opacity="0.6"
            transform={`rotate(${a} 82 40)`} />
        ))}
        <circle cx="82" cy="40" r="9" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5" />
        <circle cx="82" cy="40" r="3" fill={color} opacity="0.5" />
      </g>
    </svg>
  ),

  planetaryGear: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes planet { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .planet-orbit{animation:planet 5s linear infinite;transform-origin:60px 40px}
        @keyframes sun { from{transform:rotate(0)} to{transform:rotate(-360deg)} }
        .sun-spin{animation:sun 3s linear infinite;transform-origin:60px 40px}
      `}</style>
      <circle cx="60" cy="40" r="30" fill="none" stroke={color} strokeWidth="1" opacity="0.2" strokeDasharray="4 3" />
      <g className="sun-spin">
        {[0,45,90,135,180,225,270,315].map((a,i)=>(
          <rect key={i} x="56.5" y="24" width="7" height="5" rx="1" fill={color} opacity="0.5"
            transform={`rotate(${a} 60 40)`} />
        ))}
        <circle cx="60" cy="40" r="8" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
      </g>
      <g className="planet-orbit">
        <circle cx="60" cy="16" r="6" fill={color} opacity="0.3" stroke={color} strokeWidth="1" />
      </g>
      <g className="planet-orbit" style={{animationDelay:'-1.6s'}}>
        <circle cx="60" cy="16" r="6" fill={color} opacity="0.3" stroke={color} strokeWidth="1"
          transform="rotate(120 60 40)" />
      </g>
      <g className="planet-orbit" style={{animationDelay:'-3.3s'}}>
        <circle cx="60" cy="16" r="6" fill={color} opacity="0.3" stroke={color} strokeWidth="1"
          transform="rotate(240 60 40)" />
      </g>
    </svg>
  ),

  iso281Bearings: ({ color }) => {
    // Pre-computed ball positions to avoid SSR/client floating-point mismatch
    // cx = 60 + 22*cos(a°), cy = 40 + 22*sin(a°) for a in [0,51.4,102.9,154.3,205.7,257.1,308.6]
    const BALLS: [number, number][] = [
      [82.00, 40.00],
      [73.73, 57.19],
      [55.22, 61.49],
      [40.35, 49.69],
      [40.35, 30.31],
      [55.22, 18.51],
      [73.73, 22.81],
    ];
    return (
      <svg viewBox="0 0 120 80" fill="none">
        <style>{`
          @keyframes rollBall { from{transform:rotate(0)} to{transform:rotate(360deg)} }
          .balls{animation:rollBall 3s linear infinite;transform-origin:60px 40px}
        `}</style>
        <circle cx="60" cy="40" r="28" fill="none" stroke={color} strokeWidth="2" opacity="0.2" />
        <circle cx="60" cy="40" r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        <circle cx="60" cy="40" r="8" fill={color} opacity="0.15" />
        <g className="balls">
          {BALLS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.5" fill={color} opacity="0.7" />
          ))}
        </g>
      </svg>
    );
  },

  fastenerEngineering: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes tighten { 0%,100%{transform:rotate(0)} 25%{transform:rotate(15deg)} 75%{transform:rotate(-5deg)} }
        .bolt-rotate{animation:tighten 2s ease-in-out infinite;transform-origin:60px 20px}
        @keyframes descend { 0%{transform:translateY(0)} 100%{transform:translateY(6px)} }
        .bolt-move{animation:descend 2s ease-in-out infinite alternate;transform-origin:60px 40px}
      `}</style>
      <g className="bolt-move">
        <g className="bolt-rotate">
          <polygon points="60,4 70,14 50,14" fill={color} opacity="0.8" />
          <rect x="56" y="14" width="8" height="5" fill={color} opacity="0.8" />
        </g>
        <rect x="57" y="18" width="6" height="40" fill={color} opacity="0.5" />
        <rect x="53" y="55" width="14" height="5" rx="1" fill={color} opacity="0.4" />
        <rect x="51" y="60" width="18" height="5" rx="1" fill={color} opacity="0.4" />
        <rect x="53" y="65" width="14" height="5" rx="1" fill={color} opacity="0.4" />
      </g>
    </svg>
  ),

  strengthAnalysis: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes stress { 0%,100%{d:path("M10,40 Q35,20 60,40 Q85,60 110,40")} 50%{d:path("M10,40 Q35,10 60,40 Q85,70 110,40")} }
        @keyframes arrowPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .arr{animation:arrowPulse 1.5s ease-in-out infinite}
      `}</style>
      <rect x="10" y="38" width="100" height="4" rx="2" fill={color} opacity="0.2" />
      <line x1="10" y1="40" x2="110" y2="40" stroke={color} strokeWidth="2" opacity="0.5" />
      <path d="M10,40 Q35,15 60,40 Q85,65 110,40" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="3 2" />
      {[20,40,60,80,100].map((x,i)=>(
        <g key={i} className="arr" style={{animationDelay:`${i*0.3}s`}}>
          <line x1={x} y1="20" x2={x} y2="38" stroke={color} strokeWidth="1.5" />
          <polygon points={`${x},38 ${x-3},31 ${x+3},31`} fill={color} />
        </g>
      ))}
    </svg>
  ),

  beamDeflection: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes deflect { 0%,100%{d:path("M10,30 Q60,30 110,30")} 50%{d:path("M10,30 Q60,55 110,30")} }
        .beam-line{animation:deflect 3s ease-in-out infinite}
        @keyframes loadBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
        .load-arrow{animation:loadBounce 3s ease-in-out infinite}
      `}</style>
      <rect x="5" y="28" width="8" height="8" rx="1" fill={color} opacity="0.6" />
      <rect x="107" y="28" width="8" height="8" rx="1" fill={color} opacity="0.6" />
      <path d="M10,30 Q60,30 110,30" stroke={color} strokeWidth="2.5" fill="none" opacity="0.2"/>
      <path d="M10,30 Q60,55 110,30" stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round"/>
      <g className="load-arrow">
        <line x1="60" y1="8" x2="60" y2="26" stroke={color} strokeWidth="2" />
        <polygon points="60,28 55,20 65,20" fill={color} opacity="0.9" />
        <text x="62" y="16" fontSize="7" fill={color} opacity="0.8" fontFamily="monospace">P</text>
      </g>
      <line x1="10" y1="55" x2="110" y2="55" stroke={color} strokeWidth="1" opacity="0.2" strokeDasharray="3 3" />
    </svg>
  ),

  concreteReinf: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes rebar { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .rebar{animation:rebar 2s ease-in-out infinite}
      `}</style>
      <rect x="10" y="20" width="100" height="45" rx="3" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      {[20,30,40,50,60,70,80,90,100].map((x,i)=>(
        <line key={i} x1={x} y1="20" x2={x} y2="65" stroke={color} strokeWidth="1" opacity="0.2" className="rebar"
          style={{animationDelay:`${i*0.2}s`}} />
      ))}
      {[30,45,55].map((y,i)=>(
        <line key={i} x1="10" x2="110" y1={y} y2={y} stroke={color} strokeWidth="2" opacity="0.6" className="rebar"
          style={{animationDelay:`${i*0.4}s`}} />
      ))}
    </svg>
  ),

  fatigueLife: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes snLine { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
        .sn-path{stroke-dasharray:200;animation:snLine 4s ease-out infinite}
      `}</style>
      <line x1="15" y1="65" x2="15" y2="10" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="15" y1="65" x2="110" y2="65" stroke={color} strokeWidth="1" opacity="0.3" />
      <path className="sn-path" d="M20,15 C30,15 35,20 45,30 C55,40 60,55 80,60 C95,63 105,63 110,63"
        stroke={color} strokeWidth="2" fill="none" opacity="0.9" />
      <text x="16" y="8" fontSize="7" fill={color} opacity="0.6" fontFamily="monospace">σ</text>
      <text x="105" y="73" fontSize="7" fill={color} opacity="0.6" fontFamily="monospace">N</text>
    </svg>
  ),

  advFatigue: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes crack { 0%,100%{opacity:0;stroke-dashoffset:50} 50%{opacity:1;stroke-dashoffset:0} }
        .crack-line{stroke-dasharray:50;animation:crack 3s ease-in-out infinite}
      `}</style>
      <rect x="20" y="20" width="80" height="40" rx="3" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <path className="crack-line" d="M60,20 L55,35 L65,45 L55,60" stroke={color} strokeWidth="2" fill="none" opacity="0.9" />
      {[30,50,70,90].map((x,i)=>(
        <line key={i} x1={x} y1="20" x2={x} y2="60" stroke={color} strokeWidth="0.5" opacity="0.1" />
      ))}
    </svg>
  ),

  fitsTolerances: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes fitSlide { 0%{transform:translateX(-8px)} 100%{transform:translateX(0)} }
        .fit-move{animation:fitSlide 2s ease-in-out infinite alternate}
      `}</style>
      <rect x="10" y="28" width="50" height="24" rx="12" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <g className="fit-move">
        <rect x="45" y="30" width="65" height="20" rx="10" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
      </g>
      <line x1="35" y1="70" x2="35" y2="20" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
      <line x1="60" y1="70" x2="60" y2="20" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
      <text x="40" y="18" fontSize="7" fill={color} opacity="0.8" fontFamily="monospace" textAnchor="middle">Δ</text>
    </svg>
  ),

  reducerLube: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes drip { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(20px);opacity:0} }
        .drop{animation:drip 2s ease-in infinite}
      `}</style>
      <path d="M30,10 L30,60 C30,70 90,70 90,60 L90,10 Z" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <g className="drop"><ellipse cx="60" cy="25" rx="4" ry="6" fill={color} opacity="0.7" /></g>
      <g className="drop" style={{animationDelay:'0.7s'}}><ellipse cx="50" cy="30" rx="3" ry="5" fill={color} opacity="0.5" /></g>
      <g className="drop" style={{animationDelay:'1.4s'}}><ellipse cx="70" cy="28" rx="3" ry="5" fill={color} opacity="0.5" /></g>
      <ellipse cx="60" cy="65" rx="24" ry="4" fill={color} opacity="0.25" />
    </svg>
  ),

  gearboxEngine: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes shaft { from{stroke-dashoffset:0} to{stroke-dashoffset:-20} }
        .shaft-anim{stroke-dasharray:5 5;animation:shaft 1s linear infinite}
      `}</style>
      <rect x="15" y="20" width="90" height="40" rx="4" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <rect x="30" y="28" width="25" height="24" rx="3" fill={color} opacity="0.15" />
      <rect x="65" y="28" width="25" height="24" rx="3" fill={color} opacity="0.15" />
      <line className="shaft-anim" x1="55" y1="40" x2="65" y2="40" stroke={color} strokeWidth="3" opacity="0.8" />
      <circle cx="42" cy="40" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="78" cy="40" r="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
    </svg>
  ),

  rollerChainDrive: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes chainMove { from{stroke-dashoffset:0} to{stroke-dashoffset:24} }
        .chain{stroke-dasharray:12 4;animation:chainMove 1.5s linear infinite}
      `}</style>
      <circle cx="30" cy="40" r="18" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <circle cx="90" cy="40" r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <line className="chain" x1="30" y1="22" x2="90" y2="28" stroke={color} strokeWidth="4" opacity="0.6" />
      <line className="chain" x1="30" y1="58" x2="90" y2="52" stroke={color} strokeWidth="4" opacity="0.6" strokeDashoffset="12" />
    </svg>
  ),

  beltDrive: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes beltSpin { from{stroke-dashoffset:0} to{stroke-dashoffset:40} }
        .belt{stroke-dasharray:8 4;animation:beltSpin 2s linear infinite}
      `}</style>
      <circle cx="30" cy="40" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
      <circle cx="90" cy="40" r="14" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
      <line className="belt" x1="30" y1="20" x2="90" y2="26" stroke={color} strokeWidth="5" opacity="0.5" strokeLinecap="round" />
      <line className="belt" x1="30" y1="60" x2="90" y2="54" stroke={color} strokeWidth="5" opacity="0.5" strokeLinecap="round" strokeDashoffset="20" />
    </svg>
  ),

  machiningDetails: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes drill { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
        .drill{animation:drill 2s ease-in-out infinite;transform-origin:60px 0}
        @keyframes chip { 0%{opacity:1;transform:translate(0,0)} 100%{opacity:0;transform:translate(15px,-15px)} }
        .chip{animation:chip 1.5s ease-out infinite}
      `}</style>
      <rect x="20" y="55" width="80" height="18" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <g className="drill">
        <rect x="53" y="5" width="14" height="50" rx="2" fill={color} opacity="0.4" />
        <polygon points="53,55 67,55 60,68" fill={color} opacity="0.8" />
      </g>
      <g className="chip" style={{animationDelay:'0.5s'}}><circle cx="72" cy="52" r="2" fill={color} opacity="0.8" /></g>
      <g className="chip" style={{animationDelay:'1s'}}><circle cx="68" cy="48" r="1.5" fill={color} opacity="0.6" /></g>
    </svg>
  ),

  weldCalculator: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes spark { 0%,100%{opacity:0;r:0} 50%{opacity:1;r:4} }
        .spark{animation:spark 0.8s ease-in-out infinite}
        @keyframes weldMove { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        .weld-path{stroke-dasharray:100;animation:weldMove 4s linear infinite}
      `}</style>
      <rect x="10" y="35" width="100" height="15" rx="2" fill={color} opacity="0.15" />
      <path className="weld-path" d="M10,42 Q20,35 30,42 Q40,50 50,42 Q60,35 70,42 Q80,50 90,42 Q100,35 110,42"
        stroke={color} strokeWidth="2.5" fill="none" opacity="0.9" />
      {[35,55,75].map((x,i)=>(
        <circle key={i} className="spark" cx={x} cy="38" r="4" fill={color} style={{animationDelay:`${i*0.27}s`}} />
      ))}
    </svg>
  ),

  mfgReadiness: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes trl { 0%{width:0} 100%{width:80px} }
        .bar-fill{animation:trl 3s ease-out forwards}
        @keyframes check { 0%,60%{opacity:0} 100%{opacity:1} }
        .check{animation:check 3s ease-out forwards}
      `}</style>
      {[1,2,3,4].map((i)=>(
        <g key={i}>
          <rect x="15" y={10+i*15} width="80" height="8" rx="4" fill={color} opacity="0.1" />
          <rect x="15" y={10+i*15} width={20*i} height="8" rx="4" fill={color} opacity="0.6" />
          <text x="10" y={17+i*15} fontSize="7" fill={color} opacity="0.5" fontFamily="monospace">{`TRL${i*2}`}</text>
        </g>
      ))}
    </svg>
  ),

  mfgSandbox: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .box1{animation:float 2s ease-in-out infinite}
        .box2{animation:float 2s ease-in-out infinite;animation-delay:0.7s}
        .box3{animation:float 2s ease-in-out infinite;animation-delay:1.4s}
      `}</style>
      <g className="box1"><rect x="10" y="35" width="25" height="25" rx="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" /></g>
      <g className="box2"><rect x="47" y="25" width="26" height="35" rx="3" fill={color} opacity="0.4" stroke={color} strokeWidth="1.5" /></g>
      <g className="box3"><rect x="85" y="30" width="22" height="30" rx="3" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" /></g>
      <line x1="10" y1="70" x2="110" y2="70" stroke={color} strokeWidth="1.5" opacity="0.4" />
    </svg>
  ),

  topologyOpt: ({ color }) => {
    // Fixed opacity table — avoids Math.random() SSR hydration mismatch
    // Row i (0-7), Col j (0-4), values pre-seeded
    const TOPO_OPACITIES: number[][] = [
      [0,    0,    0.28, 0,    0   ],
      [0,    0.32, 0.22, 0.38, 0   ],
      [0.25, 0.18, 0.42, 0.20, 0.30],
      [0.35, 0.28, 0.20, 0.25, 0.40],
      [0.28, 0.38, 0.22, 0.30, 0.18],
      [0.20, 0.25, 0.40, 0.22, 0.28],
      [0,    0.30, 0.18, 0.35, 0   ],
      [0,    0,    0.25, 0,    0   ],
    ];
    return (
      <svg viewBox="0 0 120 80" fill="none">
        <style>{`
          @keyframes dissolve { 0%,100%{opacity:0.15} 50%{opacity:0.6} }
          .topo-cell{animation:dissolve 2s ease-in-out infinite}
        `}</style>
        {Array.from({length:8},(_,i)=>Array.from({length:5},(_,j)=>{
          const keep = Math.abs(i-3.5)+Math.abs(j-2) < 3.5;
          const op = TOPO_OPACITIES[i]?.[j] ?? 0.25;
          return keep ? (
            <rect key={`${i}-${j}`} x={10+i*13} y={10+j*13} width="11" height="11" rx="2"
              fill={color} opacity={op} className="topo-cell"
              style={{animationDelay:`${(i+j)*0.15}s`}} />
          ) : null;
        }))}
      </svg>
    );
  },

  engSelection: ({ color }) => {
    // Fixed bar widths — avoids Math.random() SSR hydration mismatch
    const BAR_WIDTHS = [68, 52, 44, 72, 38];
    return (
      <svg viewBox="0 0 120 80" fill="none">
        <style>{`
          @keyframes scan { from{transform:translateY(10px)} to{transform:translateY(60px)} }
          .scanline{animation:scan 2s ease-in-out infinite alternate;opacity:0.4}
        `}</style>
        <rect x="15" y="10" width="90" height="60" rx="4" fill={color} opacity="0.05" stroke={color} strokeWidth="1.5" />
        {([20,30,40,50,55] as const).map((y,i)=>(
          <rect key={i} x="22" y={y} width={BAR_WIDTHS[i]} height="5" rx="2" fill={color} opacity="0.2" />
        ))}
        <rect className="scanline" x="15" y="10" width="90" height="3" rx="1" fill={color} />
        <circle cx="95" cy="55" r="10" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
        <line x1="102" y1="62" x2="110" y2="70" stroke={color} strokeWidth="2" opacity="0.7" />
      </svg>
    );
  },

  sheetMetalBending: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes bend { 0%,100%{d:path("M20,60 L60,60 L100,60")} 50%{d:path("M20,60 L60,60 L80,30")} }
        .metal-path{animation:bend 3s ease-in-out infinite}
      `}</style>
      <path className="metal-path" d="M20,60 L60,60 L80,30" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <path d="M20,60 L60,60 L100,60" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.2" />
      <line x1="60" y1="20" x2="60" y2="70" stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
      <text x="62" y="18" fontSize="7" fill={color} opacity="0.7" fontFamily="monospace">90°</text>
    </svg>
  ),

  costEstimator: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes barGrow { from{scaleY:0} to{scaleY:1} }
        .bar{animation:barGrow 1.5s ease-out forwards;transform-origin:bottom}
        @keyframes countUp { 0%{opacity:0} 100%{opacity:1} }
        .num{animation:countUp 2s ease-out forwards}
      `}</style>
      {[[20,50,'0.8s'],[35,35,'1s'],[50,45,'1.2s'],[65,25,'1.4s'],[80,55,'1.6s'],[95,40,'1.8s']].map(([x,h,d],i)=>(
        <rect key={i} className="bar" x={Number(x)} y={70-Number(h)} width="12" height={Number(h)} rx="2"
          fill={color} opacity={0.3+i*0.1} style={{animationDelay:String(d)}} />
      ))}
      <line x1="15" y1="70" x2="110" y2="70" stroke={color} strokeWidth="1" opacity="0.3" />
      <text x="60" y="12" fontSize="10" fill={color} opacity="0.9" textAnchor="middle" fontFamily="monospace" className="num">$</text>
    </svg>
  ),

  pumpSuite: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes impeller { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .impeller{animation:impeller 2s linear infinite;transform-origin:60px 42px}
        @keyframes flow { from{stroke-dashoffset:0} to{stroke-dashoffset:-30} }
        .flow{stroke-dasharray:6 4;animation:flow 1s linear infinite}
      `}</style>
      <circle cx="60" cy="42" r="22" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <g className="impeller">
        {[0,72,144,216,288].map((a,i)=>(
          <path key={i} d={`M60,42 Q${60+18*Math.cos((a-20)*Math.PI/180)},${42+18*Math.sin((a-20)*Math.PI/180)} ${60+15*Math.cos(a*Math.PI/180)},${42+15*Math.sin(a*Math.PI/180)}`}
            stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        ))}
      </g>
      <line className="flow" x1="5" y1="42" x2="38" y2="42" stroke={color} strokeWidth="3" opacity="0.5" />
      <line className="flow" x1="82" y1="42" x2="115" y2="42" stroke={color} strokeWidth="3" opacity="0.5" />
    </svg>
  ),

  fluidDynamics: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes streamline { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
        .sl{stroke-dasharray:200;animation:streamline 3s linear infinite}
      `}</style>
      {[
        "M5,20 C30,15 50,30 80,20 C95,15 105,25 115,20",
        "M5,40 C20,35 50,50 75,40 C90,33 105,45 115,40",
        "M5,60 C30,55 55,70 80,60 C95,55 105,65 115,60",
      ].map((d,i)=>(
        <path key={i} className="sl" d={d} stroke={color} strokeWidth="2" fill="none" opacity={0.8-i*0.2}
          style={{animationDelay:`${i*1}s`}} />
      ))}
    </svg>
  ),

  aerospaceDynamics: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes fly { from{transform:translateX(-10px)} to{transform:translateX(10px)} }
        .airplane{animation:fly 2s ease-in-out infinite alternate}
        @keyframes wave { from{stroke-dashoffset:0} to{stroke-dashoffset:-40} }
        .airwave{stroke-dasharray:10 5;animation:wave 2s linear infinite}
      `}</style>
      <g className="airplane">
        <path d="M45,40 L75,30 L80,40 L75,50 Z" fill={color} opacity="0.7" />
        <path d="M55,35 L70,20 L72,35 Z" fill={color} opacity="0.4" />
        <path d="M55,45 L70,60 L72,45 Z" fill={color} opacity="0.4" />
      </g>
      <path className="airwave" d="M85,30 Q95,40 85,50" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path className="airwave" d="M90,25 Q105,40 90,55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" style={{animationDelay:'0.5s'}} />
    </svg>
  ),

  navalHydro: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes wave2 { 0%,100%{d:path("M0,55 Q15,45 30,55 Q45,65 60,55 Q75,45 90,55 Q105,65 120,55")} 50%{d:path("M0,55 Q15,65 30,55 Q45,45 60,55 Q75,65 90,55 Q105,45 120,55")} }
        .wave-path{animation:wave2 2s ease-in-out infinite}
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .ship{animation:bob 2s ease-in-out infinite}
      `}</style>
      <g className="ship">
        <path d="M30,40 L90,40 L80,55 L40,55 Z" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
        <rect x="50" y="25" width="20" height="15" rx="2" fill={color} opacity="0.4" />
      </g>
      <path className="wave-path" d="M0,55 Q15,45 30,55 Q45,65 60,55 Q75,45 90,55 Q105,65 120,55"
        fill={color} opacity="0.15" />
    </svg>
  ),

  kinematics: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes orbit { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .k-orbit{animation:orbit 3s linear infinite;transform-origin:60px 40px}
        @keyframes trail { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
        .k-trail{stroke-dasharray:100;animation:trail 3s linear infinite}
      `}</style>
      <circle cx="60" cy="40" r="5" fill={color} opacity="0.6" />
      <circle cx="60" cy="40" r="25" fill="none" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="4 3" />
      <g className="k-orbit">
        <circle cx="60" cy="15" r="6" fill={color} opacity="0.7" />
        <path className="k-trail" d="M60,15 A25,25 0 0 1 85,40" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4" />
      </g>
    </svg>
  ),

  thermalExpansion: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes expand { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.12)} }
        .bar-expand{animation:expand 2.5s ease-in-out infinite;transform-origin:center}
        @keyframes heat { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .heat-wave{animation:heat 1s ease-in-out infinite}
      `}</style>
      <g className="bar-expand">
        <rect x="20" y="33" width="80" height="14" rx="7" fill={color} opacity="0.3" stroke={color} strokeWidth="1.5" />
      </g>
      {[30,50,70,90].map((x,i)=>(
        <path key={i} className="heat-wave" d={`M${x},28 Q${x+4},22 ${x+8},28`}
          stroke={color} strokeWidth="1.5" fill="none" style={{animationDelay:`${i*0.25}s`}} />
      ))}
      <text x="60" y="72" fontSize="8" fill={color} opacity="0.6" textAnchor="middle" fontFamily="monospace">α·ΔT</text>
    </svg>
  ),

  physicsSolver: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes pulse { 0%,100%{r:3} 50%{r:6} }
        .node-pulse{animation:pulse 2s ease-in-out infinite}
      `}</style>
      {[[20,20],[60,10],[100,25],[30,55],[70,50],[110,60],[50,70]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} className="node-pulse" r="4" fill={color} opacity="0.6"
            style={{animationDelay:`${i*0.3}s`}} />
        </g>
      ))}
      {[[20,20,60,10],[60,10,100,25],[20,20,30,55],[60,10,70,50],[100,25,110,60],[30,55,70,50]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" opacity="0.25" />
      ))}
    </svg>
  ),

  materialsDB: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes dbPulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        .db-row{animation:dbPulse 2s ease-in-out infinite}
      `}</style>
      {[15,27,39,51,63].map((y,i)=>(
        <g key={i} className="db-row" style={{animationDelay:`${i*0.4}s`}}>
          <rect x="10" y={y} width="100" height="9" rx="2" fill={color} opacity={0.1+i*0.04} stroke={color} strokeWidth="0.5" />
          <rect x="10" y={y} width="30" height="9" rx="2" fill={color} opacity={0.1} />
        </g>
      ))}
    </svg>
  ),

  materialsIntelligence: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes aiGlow { 0%,100%{opacity:0.3;r:20} 50%{opacity:0.7;r:28} }
        .ai-glow{animation:aiGlow 3s ease-in-out infinite}
        @keyframes lattice { from{stroke-dashoffset:0} to{stroke-dashoffset:-10} }
        .lattice-line{stroke-dasharray:5 3;animation:lattice 1s linear infinite}
      `}</style>
      <circle className="ai-glow" cx="60" cy="40" r="22" fill={color} opacity="0.1" />
      {[20,35,50,65,80,95].map((x,i)=>
        [20,35,50,65].map((y,j)=>(
          <circle key={`${i}-${j}`} cx={x} cy={y} r="2" fill={color} opacity="0.4" />
        ))
      )}
      {[20,35,50,65,80].map((x,i)=>(
        <line key={i} className="lattice-line" x1={x} y1="20" x2={x+15} y2="35" stroke={color} strokeWidth="0.5" opacity="0.3" />
      ))}
    </svg>
  ),

  materialSelectorAI: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes brainPulse { 0%,100%{stroke-width:1;opacity:0.5} 50%{stroke-width:2;opacity:1} }
        .neuron{animation:brainPulse 2s ease-in-out infinite}
      `}</style>
      {[[25,20],[25,40],[25,60],[60,15],[60,35],[60,55],[95,25],[95,50]].map(([x,y],i)=>(
        <circle key={i} className="neuron" cx={x} cy={y} r="5" fill={color} opacity="0.4"
          style={{animationDelay:`${i*0.25}s`}} />
      ))}
      {[[25,20,60,15],[25,20,60,35],[25,40,60,35],[25,40,60,55],[25,60,60,55],[60,15,95,25],[60,35,95,25],[60,35,95,50],[60,55,95,50]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.8" opacity="0.25" />
      ))}
    </svg>
  ),

  failurePrediction: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes warning { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        .warn{animation:warning 1.5s ease-in-out infinite;transform-origin:60px 35px}
      `}</style>
      <g className="warn">
        <polygon points="60,10 105,68 15,68" fill={color} opacity="0.12" stroke={color} strokeWidth="2" />
        <text x="60" y="52" fontSize="20" fill={color} textAnchor="middle" opacity="0.9" fontFamily="monospace">!</text>
        <line x1="60" y1="28" x2="60" y2="44" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="55" r="2" fill={color} />
      </g>
    </svg>
  ),

  failureAnalysis: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes fracture { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .frac{animation:fracture 1.5s ease-in-out infinite}
      `}</style>
      <rect x="15" y="25" width="90" height="30" rx="4" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <path className="frac" d="M45,25 L52,40 L45,55" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="frac" d="M52,40 L62,30 L72,55" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{animationDelay:'0.3s'}} />
    </svg>
  ),

  chemistryLab: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes bubble { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-20px);opacity:0} }
        .bub{animation:bubble 2s ease-in infinite}
      `}</style>
      <path d="M45,15 L45,40 L25,65 L95,65 L75,40 L75,15 Z" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5" />
      <line x1="38" y1="15" x2="82" y2="15" stroke={color} strokeWidth="2" opacity="0.6" />
      <g className="bub" style={{animationDelay:'0s'}}><circle cx="55" cy="55" r="3" fill={color} opacity="0.7" /></g>
      <g className="bub" style={{animationDelay:'0.6s'}}><circle cx="65" cy="58" r="2" fill={color} opacity="0.5" /></g>
      <g className="bub" style={{animationDelay:'1.2s'}}><circle cx="60" cy="52" r="2.5" fill={color} opacity="0.6" /></g>
    </svg>
  ),

  biologyGenetics: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes dna { from{stroke-dashoffset:0} to{stroke-dashoffset:-40} }
        .dna-strand{stroke-dasharray:8 4;animation:dna 2s linear infinite}
      `}</style>
      <path className="dna-strand" d="M40,5 C55,20 65,30 50,45 C35,60 45,70 60,75"
        stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
      <path className="dna-strand" d="M80,5 C65,20 55,30 70,45 C85,60 75,70 60,75"
        stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" style={{animationDelay:'1s'}} />
      {[15,25,35,48,58,68].map((y,i)=>(
        <line key={i} x1={50+Math.sin(i)*8} y1={y} x2={70-Math.sin(i)*8} y2={y}
          stroke={color} strokeWidth="1.5" opacity="0.4" />
      ))}
    </svg>
  ),

  unitConverter: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes convert { 0%,100%{transform:translateX(0)} 50%{transform:translateX(10px)} }
        .conv-arrow{animation:convert 2s ease-in-out infinite}
      `}</style>
      <rect x="5" y="28" width="40" height="24" rx="4" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
      <rect x="75" y="28" width="40" height="24" rx="4" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
      <text x="25" y="43" fontSize="9" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.9">kg</text>
      <text x="95" y="43" fontSize="9" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.9">lb</text>
      <g className="conv-arrow">
        <line x1="50" y1="40" x2="70" y2="40" stroke={color} strokeWidth="2" />
        <polygon points="70,40 64,36 64,44" fill={color} />
      </g>
    </svg>
  ),

  periodicTable: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes elementGlow { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
      `}</style>
      {Array.from({length:18}).map((_,i)=>
        Array.from({length:4}).map((_,j)=>{
          const filled = (j===0&&i<2)||(j===1&&i>=2&&i<12)||(j===2&&i>=2&&i<12)||(j===3);
          return filled ? (
            <rect key={`${i}-${j}`} x={5+i*6.5} y={8+j*17} width="5.5" height="12" rx="1"
              fill={color} opacity="0.2+j*0.05"
              style={{animation:`elementGlow 2s ease-in-out ${(i+j)*0.1}s infinite`}} />
          ):null;
        })
      )}
    </svg>
  ),

  algorithms: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes binaryFlow { from{stroke-dashoffset:0} to{stroke-dashoffset:-30} }
        .binary-flow{stroke-dasharray:10 5;animation:binaryFlow 2s linear infinite}
        @keyframes code { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
      {['01101001','10110100','01001011'].map((b,i)=>(
        <text key={i} x="10" y={20+i*20} fontSize="8" fill={color} opacity={0.4+i*0.2}
          fontFamily="monospace" style={{animation:`code 2s ease-in-out ${i*0.5}s infinite`}}>{b}</text>
      ))}
      <line className="binary-flow" x1="85" y1="15" x2="115" y2="15" stroke={color} strokeWidth="2" opacity="0.6" />
      <line className="binary-flow" x1="85" y1="35" x2="115" y2="35" stroke={color} strokeWidth="2" opacity="0.4" style={{animationDelay:'0.7s'}} />
      <line className="binary-flow" x1="85" y1="55" x2="115" y2="55" stroke={color} strokeWidth="2" opacity="0.3" style={{animationDelay:'1.4s'}} />
    </svg>
  ),

  digitalLogicLab: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes pulse01 { 0%,45%{height:3px;y:42} 50%,95%{height:20px;y:25} }
        @keyframes clk { from{stroke-dashoffset:0} to{stroke-dashoffset:-40} }
        .clk-line{stroke-dasharray:40;animation:clk 1s linear infinite}
      `}</style>
      <path className="clk-line" d="M10,50 L25,50 L25,25 L40,25 L40,50 L55,50 L55,25 L70,25 L70,50 L85,50 L85,25 L100,25 L100,50 L110,50"
        stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
      <rect x="38" y="30" width="24" height="20" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <text x="50" y="43" fontSize="8" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.8">AND</text>
    </svg>
  ),

  engineeringNotes: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes write { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
        .writing{stroke-dasharray:200;animation:write 4s linear infinite}
      `}</style>
      <rect x="20" y="10" width="80" height="65" rx="4" fill={color} opacity="0.06" stroke={color} strokeWidth="1.5" />
      <line x1="30" y1="25" x2="90" y2="25" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="30" y1="35" x2="90" y2="35" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="30" y1="45" x2="90" y2="45" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <line x1="30" y1="55" x2="90" y2="55" stroke={color} strokeWidth="0.8" opacity="0.15" />
      <path className="writing" d="M30,25 L70,25" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path className="writing" d="M30,35 L80,35" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" style={{animationDelay:'1s'}} />
    </svg>
  ),

  motorSelect: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes motorSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .motor-rotor{animation:motorSpin 1.5s linear infinite;transform-origin:60px 40px}
        @keyframes emf { from{stroke-dashoffset:0} to{stroke-dashoffset:-20} }
        .emf-line{stroke-dasharray:5 3;animation:emf 0.8s linear infinite}
      `}</style>
      <circle cx="60" cy="40" r="22" fill={color} opacity="0.08" stroke={color} strokeWidth="2" />
      <g className="motor-rotor">
        {[0,90,180,270].map((a,i)=>(
          <rect key={i} x="56" y="20" width="8" height="12" rx="2" fill={color} opacity="0.5"
            transform={`rotate(${a} 60 40)`} />
        ))}
        <circle cx="60" cy="40" r="6" fill={color} opacity="0.3" />
      </g>
      <line className="emf-line" x1="87" y1="40" x2="110" y2="40" stroke={color} strokeWidth="3" opacity="0.6" />
      <line x1="5" y1="40" x2="30" y2="40" stroke={color} strokeWidth="3" opacity="0.4" />
      <polygon points="30,40 24,36 24,44" fill={color} opacity="0.5" />
    </svg>
  ),

  ohmsLaw: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes current { from{stroke-dashoffset:0} to{stroke-dashoffset:-50} }
        .current-flow{stroke-dasharray:10 5;animation:current 1s linear infinite}
      `}</style>
      <path className="current-flow" d="M10,40 L35,40" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <rect x="35" y="30" width="50" height="20" rx="4" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <text x="60" y="43" fontSize="8" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.9">Ω</text>
      <path className="current-flow" d="M85,40 L110,40" stroke={color} strokeWidth="3" strokeLinecap="round" style={{animationDelay:'0.5s'}} />
      <text x="60" y="15" fontSize="9" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.7">V = IR</text>
    </svg>
  ),

  voltageDrop: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes voltDrop { 0%,100%{opacity:0.4;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.1)} }
        .volt-bar{animation:voltDrop 2s ease-in-out infinite;transform-origin:bottom}
      `}</style>
      {[[15,60],[32,50],[49,42],[66,35],[83,30],[100,26]].map(([x,h],i)=>(
        <rect key={i} className="volt-bar" x={x} y={70-h} width="14" height={h} rx="2"
          fill={color} opacity={0.6-i*0.07} style={{animationDelay:`${i*0.2}s`}} />
      ))}
      <path d="M15,10 Q60,5 107,10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="4 2" />
      <text x="60" y="8" fontSize="7" fill={color} textAnchor="middle" opacity="0.6" fontFamily="monospace">ΔV</text>
    </svg>
  ),

  threePhasePower: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes sineA { 0%{d:path("M10,40 Q22,10 33,40 Q44,70 55,40")} 100%{d:path("M15,40 Q27,10 38,40 Q49,70 60,40")} }
      `}</style>
      {[
        {offset:'0s', color: color, op: '0.9', d:"M10,40 Q22,10 33,40 Q44,70 55,40 Q66,10 77,40 Q88,70 99,40 Q110,10 120,40"},
        {offset:'0.33s', color: color, op: '0.5', d:"M10,60 Q22,30 33,60 Q44,90 55,60 Q66,30 77,60 Q88,90 99,60 Q110,30 120,60"},
        {offset:'0.66s', color: color, op: '0.3', d:"M10,20 Q22,50 33,20 Q44,-10 55,20 Q66,50 77,20 Q88,-10 99,20 Q110,50 120,20"},
      ].map((s,i)=>(
        <path key={i} d={s.d} stroke={color} strokeWidth="2" fill="none" opacity={Number(s.op)}
          style={{animation:`sineA 0.5s linear ${s.offset} infinite alternate`}} />
      ))}
    </svg>
  ),

  filterDesign: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes filterAnim { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
        .filter-path{stroke-dasharray:200;animation:filterAnim 3s linear infinite}
      `}</style>
      <line x1="10" y1="65" x2="110" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
      <line x1="10" y1="10" x2="10" y2="65" stroke={color} strokeWidth="1" opacity="0.2" />
      <path className="filter-path" d="M10,40 L45,40 Q50,40 52,30 L58,10 Q60,5 62,10 L68,30 Q70,40 75,40 L110,40"
        stroke={color} strokeWidth="2.5" fill="none" opacity="0.9" />
      <text x="60" y="75" fontSize="6" fill={color} textAnchor="middle" fontFamily="monospace" opacity="0.5">fc</text>
    </svg>
  ),

  scientificCalc: ({ color }) => (
    <svg viewBox="0 0 120 80" fill="none">
      <style>{`
        @keyframes calcBlink { 0%,90%,100%{opacity:1} 95%{opacity:0} }
        .calc-cursor{animation:calcBlink 2s ease-in-out infinite}
      `}</style>
      <rect x="20" y="8" width="80" height="64" rx="6" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" />
      <rect x="27" y="14" width="66" height="18" rx="3" fill={color} opacity="0.15" />
      <text x="87" y="27" fontSize="10" fill={color} textAnchor="end" fontFamily="monospace" opacity="0.9">3.14</text>
      <rect className="calc-cursor" x="89" y="18" width="1.5" height="12" fill={color} />
      {[[0,1,2],[3,4,5],[6,7,8]].map((row,i)=>
        row.map((n,j)=>(
          <rect key={n} x={28+j*21} y={38+i*12} width="16" height="9" rx="2" fill={color} opacity="0.15" />
        ))
      )}
    </svg>
  ),
};

// Fallback for any module without a specific SVG
const DefaultSVG: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 80" fill="none">
    <style>{`
      @keyframes defaultPulse { 0%,100%{opacity:0.3;r:20} 50%{opacity:0.7;r:28} }
      .dp{animation:defaultPulse 3s ease-in-out infinite}
    `}</style>
    <circle className="dp" cx="60" cy="40" r="22" fill={color} opacity="0.15" />
    <circle cx="60" cy="40" r="12" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
    <circle cx="60" cy="40" r="4" fill={color} opacity="0.5" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Group accent colors
// ─────────────────────────────────────────────────────────────────────────────
const GROUP_ACCENTS: Record<string, { pill: string; glow: string; badge: string }> = {
  mechanicalStructural: {
    pill: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    glow: 'rgba(59,130,246,0.08)',
    badge: 'bg-blue-500/10 text-blue-400',
  },
  manufacturingProduction: {
    pill: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    glow: 'rgba(139,92,246,0.08)',
    badge: 'bg-violet-500/10 text-violet-400',
  },
  fluidAerospace: {
    pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    glow: 'rgba(6,182,212,0.08)',
    badge: 'bg-cyan-500/10 text-cyan-400',
  },
  intelligenceScience: {
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    glow: 'rgba(244,63,94,0.08)',
    badge: 'bg-rose-500/10 text-rose-400',
  },
  electricalPower: {
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    glow: 'rgba(245,158,11,0.08)',
    badge: 'bg-amber-500/10 text-amber-400',
  },
};

type Props = { externalSearch?: string };

export function AcademyCalculatorHub({ externalSearch = '' }: Props) {
  const { language, t } = useI18nStore();
  const page = getCalculatorsPage(language);
  const [localSearch, setLocalSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const searchQuery = externalSearch.trim() || localSearch;

  const localizedModules = useMemo(
    () =>
      CALCULATOR_HUB_MODULES.map((mod) => {
        const i18nKey = CALC_MODULE_I18N_KEYS[mod.id];
        const fallback = page.modules[mod.id];
        const name = (i18nKey && t.modules?.[i18nKey]?.title) || fallback.name;
        const description = (i18nKey && t.moduleHints?.[i18nKey]) || fallback.description;
        return { ...mod, name, description };
      }),
    [page, t],
  );

  const categories = useMemo(() => {
    const result: Record<string, { mods: typeof localizedModules; groupKey: string }> = {};
    for (const groupKey of CALC_HUB_GROUP_ORDER) {
      const mods = localizedModules.filter((m) => m.group === groupKey);
      if (mods.length > 0) {
        result[page.groups[groupKey]] = { mods, groupKey };
      }
    }
    return result;
  }, [localizedModules, page.groups]);

  const filteredCategories = useMemo(() => {
    const result: Record<string, { mods: typeof localizedModules; groupKey: string }> = {};
    for (const [groupName, { mods, groupKey }] of Object.entries(categories)) {
      if (activeGroup && groupKey !== activeGroup) continue;
      const q = searchQuery.toLowerCase();
      const filteredMods = q
        ? mods.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
        : mods;
      if (filteredMods.length > 0) {
        result[groupName] = { mods: filteredMods, groupKey };
      }
    }
    return result;
  }, [categories, searchQuery, activeGroup]);

  const totalCount = useMemo(() =>
    Object.values(filteredCategories).reduce((s, { mods }) => s + mods.length, 0),
  [filteredCategories]);

  return (
    <div id="calculators" className="scroll-mt-28 pb-24">

      {/* ── Hero header ── */}
      <div className="relative mb-16 overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-[#050a12] to-[#020408] px-10 py-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,229,255,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-8 justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Engineering Calculator Registry
            </div>
            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
              {page.engineeringRegistry}
            </h2>
            <p className="mt-4 text-sm text-slate-500 max-w-xl leading-relaxed">
              {formatWorkstationNodes(page.workstationNodes, CALCULATOR_HUB_MODULES.length)}
            </p>
          </div>

          {/* Search */}
          {!externalSearch && (
            <div className="relative w-full md:w-80 group shrink-0">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="search"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={page.searchPlaceholder}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Group filter pills */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-8">
          <button
            onClick={() => setActiveGroup(null)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
              activeGroup === null
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300'
            }`}
          >
            All ({CALCULATOR_HUB_MODULES.length})
          </button>
          {CALC_HUB_GROUP_ORDER.map((gk) => {
            const groupName = page.groups[gk];
            const accent = GROUP_ACCENTS[gk];
            const count = localizedModules.filter(m => m.group === gk).length;
            return (
              <button
                key={gk}
                onClick={() => setActiveGroup(activeGroup === gk ? null : gk)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  activeGroup === gk
                    ? `${accent.pill} border-current`
                    : 'bg-white/[0.02] border-white/8 text-slate-500 hover:text-slate-300'
                }`}
              >
                {groupName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result count ── */}
      {(searchQuery || activeGroup) && (
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-10">
          {totalCount} result{totalCount !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {/* ── Category sections ── */}
      <div className="space-y-20">
        {Object.entries(filteredCategories).map(([groupName, { mods, groupKey }]) => {
          const accent = GROUP_ACCENTS[groupKey] ?? GROUP_ACCENTS.mechanicalStructural;

          return (
            <section key={groupKey}>
              {/* Section label */}
              <div className="flex items-center gap-6 mb-8">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border ${accent.pill}`}>
                  {groupName}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-[9px] font-mono text-slate-600">{mods.length} calculators</span>
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {mods.map((mod) => {
                  const SvgIllustration = SVG_ILLUSTRATIONS[mod.id] ?? DefaultSVG;

                  return (
                    <Link
                      key={mod.id}
                      href={mod.path}
                      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/5 bg-[#060a10] transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
                      style={{ '--glow': accent.glow } as React.CSSProperties}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.75rem]"
                        style={{ background: `radial-gradient(ellipse at 50% 0%, ${mod.color}18 0%, transparent 70%)` }}
                      />

                      {/* SVG illustration area */}
                      <div className="relative h-40 flex items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{ background: `radial-gradient(circle at 50% 50%, ${mod.color}12 0%, transparent 70%)` }}
                        />
                        <div className="relative z-10 w-28 h-20 transition-transform duration-500 group-hover:scale-110">
                          <SvgIllustration color={mod.color} />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5 gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[13px] font-black uppercase tracking-tight text-white leading-tight group-hover:text-white transition-colors" style={{ '--tw-text-opacity': '1' } as React.CSSProperties}>
                            {mod.name}
                          </h3>
                          <ArrowUpRight
                            size={14}
                            className="shrink-0 mt-0.5 text-white/0 group-hover:text-white/60 transition-all duration-300"
                          />
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 group-hover:text-slate-400 transition-colors">
                          {mod.description}
                        </p>

                        <div className="mt-auto flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: mod.color, boxShadow: `0 0 6px ${mod.color}` }}
                          />
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">
                            Open Calculator
                          </span>
                          <ChevronRight size={10} className="text-slate-700 group-hover:text-slate-400 transition-colors ml-auto" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="py-24 text-center">
            <p className="text-slate-600 text-sm font-mono uppercase tracking-widest">No calculators found</p>
          </div>
        )}
      </div>
    </div>
  );
}

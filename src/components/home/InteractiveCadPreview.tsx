'use client';

import React, { useState } from 'react';
import { Box, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';

export function InteractiveCadPreview() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  return (
    <div className="flex flex-col h-full justify-between space-y-4 font-sans select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--cyan)]/10 text-[var(--cyan)] border border-[var(--cyan)]/25">
            <Box size={14} />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--cyan)] uppercase tracking-wider">
            Parametric CAD & B-Rep Mesh
          </span>
        </div>

        {/* 2D / 3D Mode Toggle */}
        <div className="flex items-center bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-2.5 py-1 rounded-[var(--radius-s)] transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-xs'
                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            3D Mesh
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-2.5 py-1 rounded-[var(--radius-s)] transition-all cursor-pointer ${
              viewMode === '2d'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-xs'
                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            2D AluCAD
          </button>
        </div>
      </div>

      {/* Visual Canvas Stage */}
      <div className="relative h-44 sm:h-48 w-full rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] overflow-hidden flex items-center justify-center p-3 group">
        {/* Background Blueprint Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(58, 208, 230, 0.4) 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* 3D Isometric View */}
        {viewMode === '3d' ? (
          <div className="relative z-10 flex flex-col items-center justify-center scale-95 sm:scale-100 transition-transform duration-500 group-hover:scale-105">
            <svg
              width="150"
              height="115"
              viewBox="0 0 140 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-"
            >
              {/* Isometric 40x40 Profile wireframe/solid */}
              <polygon
                points="70,10 120,38 70,66 20,38"
                fill="rgba(58, 208, 230, 0.15)"
                stroke="#3ad0e6"
                strokeWidth="1.5"
              />
              <polygon
                points="20,38 70,66 70,100 20,72"
                fill="rgba(58, 208, 230, 0.08)"
                stroke="#1a8fa3"
                strokeWidth="1.5"
              />
              <polygon
                points="70,66 120,38 120,72 70,100"
                fill="rgba(58, 208, 230, 0.2)"
                stroke="#243041"
                strokeWidth="1.5"
              />
              {/* T-Slot Core Hole */}
              <ellipse
                cx="70"
                cy="38"
                rx="14"
                ry="8"
                stroke="#3ad0e6"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                fill="rgba(7, 9, 12, 0.85)"
              />
              {/* Profile cross-slots */}
              <line x1="70" y1="20" x2="70" y2="30" stroke="#7aa2ff" strokeWidth="1.5" />
              <line x1="70" y1="46" x2="70" y2="56" stroke="#7aa2ff" strokeWidth="1.5" />
              <line x1="45" y1="38" x2="56" y2="38" stroke="#7aa2ff" strokeWidth="1.5" />
              <line x1="84" y1="38" x2="95" y2="38" stroke="#7aa2ff" strokeWidth="1.5" />
            </svg>
            <span className="text-[10px] font-mono text-[var(--cyan)] mt-1">40x40 Heavy T-Slot 8 (ISO 2768-mK)</span>
          </div>
        ) : (
          /* 2D Blueprint View */
          <div className="relative z-10 flex flex-col items-center justify-center scale-95 sm:scale-100 transition-transform duration-500 group-hover:scale-105">
            <svg
              width="140"
              height="105"
              viewBox="0 0 130 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-"
            >
              {/* Outer 40x40 box */}
              <rect x="25" y="10" width="80" height="80" stroke="#3ad0e6" strokeWidth="1.5" fill="rgba(58,208,230,0.06)" />
              {/* Core hole circle */}
              <circle cx="65" cy="50" r="16" stroke="#7aa2ff" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Dimension lines */}
              <line x1="15" y1="10" x2="15" y2="90" stroke="#475569" strokeWidth="1" />
              <line x1="12" y1="10" x2="18" y2="10" stroke="#475569" strokeWidth="1" />
              <line x1="12" y1="90" x2="18" y2="90" stroke="#475569" strokeWidth="1" />
              <text x="5" y="53" fill="#8b96a4" fontSize="8" fontFamily="monospace">40</text>
              {/* 4 slots */}
              <path d="M55 10 L55 22 L75 22 L75 10" stroke="#3ad0e6" strokeWidth="1.2" />
              <path d="M55 90 L55 78 L75 78 L75 90" stroke="#3ad0e6" strokeWidth="1.2" />
              <path d="M25 40 L37 40 L37 60 L25 60" stroke="#3ad0e6" strokeWidth="1.2" />
              <path d="M105 40 L93 40 L93 60 L105 60" stroke="#3ad0e6" strokeWidth="1.2" />
            </svg>
            <span className="text-[10px] font-mono text-[var(--std)] mt-1">PlaneGCS Constraint Solver Layer</span>
          </div>
        )}

        {/* Format Badges */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 font-mono text-[9px]">
          <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)]">STEP</span>
          <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)]">STL</span>
          <span className="px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] text-[var(--alu)] border border-[var(--line)]">DXF</span>
        </div>
      </div>

      {/* Footer link to Design Studio */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--line)]">
        <span className="text-[10px] font-mono text-[var(--alu-dim)] flex items-center gap-1">
          <Eye size={11} className="text-[var(--cyan)]" />
          WASM OpenCASCADE Kernel
        </span>
        <Link
          href="/design-studio"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cyan)] hover:underline transition-colors"
        >
          <span>Launch 3D Design Studio</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export default InteractiveCadPreview;

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Wrench, Disc, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { computeBoltAssembly } from '@/lib/fastener/sharedEngine';
import { calculateBearingLifeL10h } from '@/utils/mathEngines/bearingLife';
import { simplySupportedCenterPoint } from '@/utils/mathEngines/beamDeflection';

type SolverTab = 'bolt' | 'bearing' | 'beam';

const BOLT_SIZES = ['M8', 'M10', 'M12', 'M16', 'M20'];
const GRADES = ['8.8', '10.9', '12.9'];

export function InteractiveSolverPreview() {
  const [activeTab, setActiveTab] = useState<SolverTab>('bolt');

  // Bolt State
  const [sizeIndex, setSizeIndex] = useState(2); // M12
  const [gradeIndex, setGradeIndex] = useState(0); // 8.8
  const bolt = BOLT_SIZES[sizeIndex];
  const grade = GRADES[gradeIndex];

  // Bearing State
  const [dynLoadC, setDynLoadC] = useState(28); // kN
  const [eqLoadP, setEqLoadP] = useState(4.5); // kN
  const [speedRpm, setSpeedRpm] = useState(1500); // RPM

  // Beam State
  const [beamSpan, setBeamSpan] = useState(2.0); // meters
  const [beamLoad, setBeamLoad] = useState(5.0); // kN
  const [profileIndex, setProfileIndex] = useState(1); // 0: Alu 40x40, 1: IPE 120, 2: HEB 160

  // 1. Bolt VDI 2230 Math (via canonical sharedEngine)
  const { fm, ma } = useMemo(() => {
    const res = computeBoltAssembly({
      threadStandard: 'Metric Coarse',
      size: bolt,
      grade: grade,
      muThread: 0.12,
      muHead: 0.12,
      yieldUtilization: 90,
      useProofStress: false,
    });
    return { fm: res.Fm_max.toFixed(1), ma: res.MA.toFixed(1) };
  }, [bolt, grade]);

  // 2. ISO 281 Bearing Life Math: L10h = (10^6 / (60 * n)) * (C / P)^3
  const bearingLifeHours = useMemo(() => {
    return Math.round(calculateBearingLifeL10h(dynLoadC, eqLoadP, speedRpm, 'ball'));
  }, [dynLoadC, eqLoadP, speedRpm]);

  // 3. Beam Deflection (Center Point Load): f_max = (F * L^3) / (48 * E * I)
  const profiles = [
    { name: 'Alu 40x40 T-Slot', eMpa: 70000, iMm4: 93000 },
    { name: 'Steel IPE 120', eMpa: 210000, iMm4: 3180000 },
    { name: 'Steel HEB 160', eMpa: 210000, iMm4: 24900000 },
  ];
  const beamResult = useMemo(() => {
    const prof = profiles[profileIndex];
    const fN = beamLoad * 1000; // N
    const lMm = beamSpan * 1000; // mm
    const { maxDeflection: fMax } = simplySupportedCenterPoint(fN, lMm, prof.eMpa, prof.iMm4);
    const limitL500 = lMm / 500;
    const isSafe = fMax <= limitL500;
    return {
      fMax: fMax.toFixed(2),
      limit: limitL500.toFixed(2),
      isSafe,
      profName: prof.name,
    };
  }, [beamSpan, beamLoad, profileIndex]);

  return (
    <div className="flex flex-col h-full justify-between space-y-4 font-sans select-none">
      {/* Top Header & Interactive Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bolt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] transition-all cursor-pointer ${
              activeTab === 'bolt'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-sm'
                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            <Wrench size={13} />
            <span>VDI 2230 Bolt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bearing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] transition-all cursor-pointer ${
              activeTab === 'bearing'
                ? 'bg-[var(--std)] text-[var(--bg-0)] font-bold shadow-sm'
                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            <Disc size={13} />
            <span>ISO 281 Bearing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('beam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] transition-all cursor-pointer ${
              activeTab === 'beam'
                ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold shadow-sm'
                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
            }`}
          >
            <Layers size={13} />
            <span>Beam Deflection</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--ok)]/30 text-[10px] font-mono text-[var(--ok)] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
          <span>Real-time Kernel</span>
        </div>
      </div>

      {/* ─── TAB 1: BOLT VDI 2230 ─── */}
      {activeTab === 'bolt' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            {/* Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[var(--alu-dim)] flex justify-between">
                <span>Thread Size</span>
                <span className="text-[var(--cyan)] font-bold">{bolt}</span>
              </label>
              <div className="flex items-center gap-1 bg-[var(--bg-0)] p-1 rounded-[var(--radius-s)] border border-[var(--line)]">
                {BOLT_SIZES.map((b, idx) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSizeIndex(idx)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      sizeIndex === idx
                        ? 'bg-[var(--cyan)] text-[var(--bg-0)] shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[var(--alu-dim)] flex justify-between">
                <span>Property Class</span>
                <span className="text-[var(--std)] font-bold">{grade}</span>
              </label>
              <div className="flex items-center gap-1 bg-[var(--bg-0)] p-1 rounded-[var(--radius-s)] border border-[var(--line)]">
                {GRADES.map((g, idx) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeIndex(idx)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      gradeIndex === idx
                        ? 'bg-[var(--std)] text-[var(--bg-0)] shadow-sm'
                        : 'text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono">
            <div className="space-y-0.5">
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">Clamp Preload (F_M)</div>
              <div className="text-2xl font-bold font-tech text-[var(--cyan)] flex items-baseline gap-1.5">
                <span>{fm}</span>
                <span className="text-xs text-[var(--alu-dim)] font-normal font-sans">kN</span>
              </div>
              <div className="text-[10px] text-[var(--alu-dim)]">90% R_p0.2 yield limit</div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">Tightening Torque (M_A)</div>
              <div className="text-2xl font-bold font-tech text-[var(--ok)] flex items-baseline gap-1.5">
                <span>{ma}</span>
                <span className="text-xs text-[var(--alu-dim)] font-normal font-sans">N·m</span>
              </div>
              <div className="text-[10px] text-[var(--alu-dim)]">μ = 0.12 (standard oiled)</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BEARING ISO 281 ─── */}
      {activeTab === 'bearing' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2">
            {/* Dynamic Load C */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Dynamic Rating C (kN)</label>
              <div className="flex gap-1">
                {[14, 28, 52].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDynLoadC(c)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      dynLoadC === c ? 'bg-[var(--std)] text-[var(--bg-0)]' : 'bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Equivalent Load P */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Applied Load P (kN)</label>
              <div className="flex gap-1">
                {[2.5, 4.5, 8.0].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEqLoadP(p)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      eqLoadP === p ? 'bg-[var(--std)] text-[var(--bg-0)]' : 'bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* RPM */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Speed (RPM)</label>
              <div className="flex gap-1">
                {[750, 1500, 3000].map((rpm) => (
                  <button
                    key={rpm}
                    type="button"
                    onClick={() => setSpeedRpm(rpm)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      speedRpm === rpm ? 'bg-[var(--std)] text-[var(--bg-0)]' : 'bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                    }`}
                  >
                    {rpm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bearing Result Display */}
          <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">ISO 281 L_10h Service Life</div>
              <div className="text-2xl font-bold font-tech text-[var(--std)] flex items-baseline gap-2">
                <span>{bearingLifeHours.toLocaleString()}</span>
                <span className="text-xs text-[var(--alu-dim)] font-normal font-sans">Operating Hours</span>
              </div>
              <div className="text-[10px] text-[var(--alu-dim)]">
                {bearingLifeHours > 20000 ? '✅ Heavy Continuous Industrial Service' : '⚠️ Sized for Periodic Duty Cycle'}
              </div>
            </div>
            <div className="text-right text-[10px] font-mono text-[var(--alu-dim)] hidden sm:block">
              <div>Formula: L10 = (C/P)³</div>
              <div className="text-[var(--std)]">90% Reliability Rating</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BEAM DEFLECTION ─── */}
      {activeTab === 'beam' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2">
            {/* Span */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Span L (m)</label>
              <div className="flex gap-1">
                {[1.0, 2.0, 3.5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBeamSpan(s)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      beamSpan === s ? 'bg-[var(--cyan)] text-[var(--bg-0)]' : 'bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                    }`}
                  >
                    {s}m
                  </button>
                ))}
              </div>
            </div>

            {/* Load F */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Center Load F (kN)</label>
              <div className="flex gap-1">
                {[2, 5, 10].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setBeamLoad(f)}
                    className={`flex-1 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      beamLoad === f ? 'bg-[var(--cyan)] text-[var(--bg-0)]' : 'bg-[var(--bg-0)] text-[var(--alu-dim)] hover:text-[var(--ink)] border border-[var(--line)]'
                    }`}
                  >
                    {f}kN
                  </button>
                ))}
              </div>
            </div>

            {/* Profile */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--alu-dim)]">Cross Section</label>
              <select
                value={profileIndex}
                onChange={(e) => setProfileIndex(Number(e.target.value))}
                className="w-full py-1 px-1.5 rounded-[var(--radius-s)] text-[11px] font-mono bg-[var(--bg-0)] border border-[var(--line)] text-[var(--ink)] outline-none"
              >
                {profiles.map((p, idx) => (
                  <option key={p.name} value={idx} className="bg-[var(--bg-1)] text-[var(--ink)]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Beam Result Display */}
          <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-[var(--alu-dim)] uppercase tracking-wider">Max Deflection (f_max)</div>
              <div className="text-2xl font-bold font-tech text-[var(--cyan)] flex items-baseline gap-2">
                <span>{beamResult.fMax}</span>
                <span className="text-xs text-[var(--alu-dim)] font-normal font-sans">mm (Eurocode L/500 Limit: {beamResult.limit} mm)</span>
              </div>
              <div className="text-[10px] flex items-center gap-1.5">
                {beamResult.isSafe ? (
                  <span className="text-[var(--ok)] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Within L/500 Eurocode 3 Limit (Pass)
                  </span>
                ) : (
                  <span className="text-[var(--warn)] flex items-center gap-1">
                    <AlertTriangle size={12} /> Exceeds L/500 Limit — Select Larger Profile
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-[10px] font-mono text-[var(--alu-dim)] hidden sm:block">
              <div>f = (F·L³)/(48·E·I)</div>
              <div className="text-[var(--cyan)]">Euler-Bernoulli Beam</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer link to full solver */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
        <span className="text-[10px] font-mono text-[var(--alu-dim)] flex items-center gap-1">
          <ShieldCheck size={12} className="text-[var(--cyan)]" />
          ISO / DIN / VDI Deterministic Precision
        </span>
        <Link
          href={
            activeTab === 'bolt'
              ? '/bolt-torque'
              : activeTab === 'bearing'
              ? '/bearings'
              : '/beam-deflection'
          }
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cyan)] hover:underline transition-colors"
        >
          <span>Open Dedicated Full Solver</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export default InteractiveSolverPreview;

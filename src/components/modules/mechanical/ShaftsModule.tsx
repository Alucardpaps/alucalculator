'use client';

import React, { useMemo, useState } from 'react';
import { Disc, Settings, ShieldCheck, AlertTriangle } from 'lucide-react';

const MATERIALS: Array<{ id: string; name: string; Sy: number; Sut: number }> = [
  { id: 's355', name: 'S355 / A572', Sy: 355, Sut: 510 },
  { id: 'c45', name: 'C45 / AISI 1045', Sy: 430, Sut: 650 },
  { id: '42crmo4', name: '42CrMo4 / AISI 4140', Sy: 750, Sut: 950 },
  { id: 'aisi304', name: 'AISI 304 stainless', Sy: 215, Sut: 505 },
];

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(d) + 'e6';
  if (a >= 1000) return n.toFixed(1);
  if (a >= 10) return n.toFixed(d);
  return n.toFixed(Math.min(3, d + 1));
}

export default function ShaftsModule() {
  const [length, setLength] = useState(500);
  const [forcePos, setForcePos] = useState(250);
  const [force, setForce] = useState(2000);
  const [torque, setTorque] = useState(80);
  const [diameter, setDiameter] = useState(30);
  const [fosTarget, setFosTarget] = useState(2);
  const [matId, setMatId] = useState('c45');

  const mat = MATERIALS.find((m) => m.id === matId) ?? MATERIALS[1];

  const results = useMemo(() => {
    const L = Math.max(1, length);
    const a = Math.min(Math.max(0.1, forcePos), L - 0.1);
    const F = Math.max(0, force);
    const T_Nmm = Math.max(0, torque) * 1000;
    const d = Math.max(0.5, diameter);
    const Sy = mat.Sy;

    const Ra = (F * (L - a)) / L;
    const Rb = (F * a) / L;
    const M = (F * a * (L - a)) / L;

    const d3 = Math.pow(d, 3);
    const sigma = (32 * M) / (Math.PI * d3);
    const tau = (16 * T_Nmm) / (Math.PI * d3);
    const svm = Math.sqrt(sigma * sigma + 3 * tau * tau);
    const fos = svm > 1e-9 ? Sy / svm : Infinity;

    const n = Math.max(1, fosTarget);
    const dReq = Math.pow(
      (32 * n) / (Math.PI * Sy) * Math.sqrt(M * M + 0.75 * T_Nmm * T_Nmm),
      1 / 3,
    );

    return {
      a,
      Ra,
      Rb,
      M,
      sigma,
      tau,
      svm,
      fos,
      dReq,
      isSafe: fos >= n,
    };
  }, [length, forcePos, force, torque, diameter, fosTarget, mat]);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#03060a] text-white overflow-hidden">
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-[#05080f]/90 border-r border-white/5 overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Disc size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Shaft Sizing</h1>
              <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase">
                Reactions · von Mises · ASME diameter
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Settings size={12} /> Geometry & load
          </h2>
          <Num label="Span L" unit="mm" value={length} min={50} max={5000} step={10} onChange={setLength} />
          <Num label="Load position a (from left)" unit="mm" value={forcePos} min={1} max={length - 1} step={5} onChange={setForcePos} />
          <Num label="Transverse force F" unit="N" value={force} min={0} max={1e6} step={50} onChange={setForce} />
          <Num label="Torque T" unit="N·m" value={torque} min={0} max={50000} step={1} onChange={setTorque} />
          <Num label="Trial diameter d" unit="mm" value={diameter} min={4} max={400} step={0.5} onChange={setDiameter} />
          <Num label="Target factor of safety" unit="—" value={fosTarget} min={1} max={8} step={0.1} onChange={setFosTarget} />

          <label className="block space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Material</span>
            <select
              value={matId}
              onChange={(e) => setMatId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · Sy {m.Sy} MPa
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            results.isSafe
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {results.isSafe ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          <div className="text-sm font-bold">
            {results.isSafe
              ? `Safe — von Mises FoS ${fmt(results.fos, 2)} ≥ ${fmt(fosTarget, 1)}`
              : `Overstressed — FoS ${fmt(results.fos, 2)} < ${fmt(fosTarget, 1)}. Use d ≥ ${fmt(results.dReq, 1)} mm`}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat label="Left reaction Ra" value={`${fmt(results.Ra, 1)} N`} />
          <Stat label="Right reaction Rb" value={`${fmt(results.Rb, 1)} N`} />
          <Stat label="Max bending M" value={`${fmt(results.M / 1000, 2)} N·m`} />
          <Stat label="Bending σb" value={`${fmt(results.sigma, 1)} MPa`} />
          <Stat label="Torsion τ" value={`${fmt(results.tau, 1)} MPa`} />
          <Stat label="von Mises σvm" value={`${fmt(results.svm, 1)} MPa`} />
          <Stat label="Required d (n-target)" value={`${fmt(results.dReq, 1)} mm`} accent />
          <Stat label="Yield Sy" value={`${mat.Sy} MPa`} />
          <Stat label="FoS" value={fmt(results.fos, 2)} />
        </div>

        <p className="text-[11px] text-slate-500 font-mono leading-relaxed max-w-2xl">
          Simply supported shaft, single point load. Ra = F(L−a)/L, Rb = Fa/L, M = Fa(L−a)/L.
          σb = 32M/(πd³), τ = 16T/(πd³), σvm = √(σb² + 3τ²). Diameter from distortion-energy:
          d = [32n/(π Sy) · √(M² + 0.75 T²)]⅓. Steady torsion + static bending; not a fatigue (DE-Goodman) check.
        </p>
      </div>
    </div>
  );
}

function Num({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-slate-400">
        <span>{label}</span>
        <span className="text-cyan-300">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-lg font-black mt-1 ${accent ? 'text-cyan-300' : 'text-white'}`}>{value}</div>
    </div>
  );
}

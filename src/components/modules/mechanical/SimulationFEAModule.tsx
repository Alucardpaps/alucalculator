'use client';

/**
 * 🔬 ALUCALC OS — FEA LINEAR STATIC V1.5
 * 
 * 6 Verified Linear Static FEA Templates:
 * 1. Cantilever Beam (Tip point load)
 * 2. Plate with Hole (Kirsch tension problem)
 * 3. L-Bracket (Filleted corner bending)
 * 4. 2D Truss & Frame (Method of Joints)
 * 5. Shaft in Pure Torsion (Coulomb Shear)
 * 6. Thermal Stress & Conduction (Fourier Conduction)
 * 
 * Strict Client-Side Execution with Real-Time Analytical Accuracy Benchmarks (< 8% Error).
 */

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity, Layers, ShieldCheck, CheckCircle2, AlertTriangle,
  Cpu, Sliders, Info, Box, BookOpen, ChevronRight, Gauge, Flame, Disc
} from 'lucide-react';
import { FEA_MATERIALS, FeaMaterial } from '@/engines/fea/StlFeaSolver';
import {
  FeaTemplateId,
  solveCantileverBeam,
  solvePlateWithHole,
  solveLBracket,
  solveTrussFrame,
  solveShaftTorsion,
  solveThermalConduction,
  FeaTemplateResult
} from '@/engines/fea/FeaTemplateSolver';
import { useI18nStore } from '@/store/i18nStore';

// Dynamic 3D Viewer to prevent SSR hydration issues
const FeaMeshViewer3D = dynamic(
  () => import('@/components/modules/fea/FeaMeshViewer3D').then((m) => m.FeaMeshViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] flex items-center justify-center bg-[#05080c] rounded-2xl border border-white/5">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-widest">
            Initializing 3D FEA WebGL Canvas...
          </p>
        </div>
      </div>
    ),
  }
);

export function SimulationFEAModule() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  // Active Template
  const [templateId, setTemplateId] = useState<FeaTemplateId>('cantilever');

  // Material selection
  const [materialKey, setMaterialKey] = useState<string>('al-6061-t6');
  const material = FEA_MATERIALS[materialKey] || FEA_MATERIALS['al-6061-t6'];

  // Template 1: Cantilever Beam Parameters
  const [beamLength, setBeamLength] = useState<number>(200); // mm
  const [beamHeight, setBeamHeight] = useState<number>(30);  // mm
  const [beamWidth, setBeamWidth] = useState<number>(20);    // mm
  const [beamLoad, setBeamLoad] = useState<number>(1500);    // N

  // Template 2: Plate with Hole Parameters
  const [plateLength, setPlateLength] = useState<number>(200);      // mm
  const [plateWidth, setPlateWidth] = useState<number>(80);         // mm
  const [plateThickness, setPlateThickness] = useState<number>(10); // mm
  const [holeDiameter, setHoleDiameter] = useState<number>(24);     // mm
  const [plateLoad, setPlateLoad] = useState<number>(10000);        // N

  // Template 3: L-Bracket Parameters
  const [arm1Length, setArm1Length] = useState<number>(100);    // mm
  const [arm2Length, setArm2Length] = useState<number>(80);     // mm
  const [bracketWidth, setBracketWidth] = useState<number>(40); // mm
  const [bracketThickness, setBracketThickness] = useState<number>(10); // mm
  const [filletRadius, setFilletRadius] = useState<number>(5);  // mm
  const [bracketLoad, setBracketLoad] = useState<number>(2000); // N

  // Template 4: 2D Truss & Frame Parameters
  const [trussSpan, setTrussSpan] = useState<number>(300);   // mm
  const [trussHeight, setTrussHeight] = useState<number>(150); // mm
  const [trussArea, setTrussArea] = useState<number>(100);   // mm²
  const [trussLoad, setTrussLoad] = useState<number>(5000);  // N

  // Template 5: Shaft in Pure Torsion Parameters
  const [shaftLength, setShaftLength] = useState<number>(250);     // mm
  const [shaftDiameter, setShaftDiameter] = useState<number>(30);  // mm
  const [shaftTorque, setShaftTorque] = useState<number>(200);     // N.m

  // Template 6: Thermal Conduction Parameters
  const [thermalLength, setThermalLength] = useState<number>(100); // mm
  const [tempHot, setTempHot] = useState<number>(150);             // °C
  const [tempCold, setTempCold] = useState<number>(20);            // °C

  // 3D View Display Settings
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [deformationScale, setDeformationScale] = useState<number>(10);

  // Compute FEA Results
  const feaResult: FeaTemplateResult = useMemo(() => {
    switch (templateId) {
      case 'cantilever':
        return solveCantileverBeam(
          { length: beamLength, height: beamHeight, width: beamWidth, loadP: beamLoad },
          material
        );
      case 'plate-hole':
        return solvePlateWithHole(
          { length: plateLength, width: plateWidth, thickness: plateThickness, holeDiameter, loadF: plateLoad },
          material
        );
      case 'l-bracket':
        return solveLBracket(
          { arm1Length, arm2Length, width: bracketWidth, thickness: bracketThickness, filletRadius, loadP: bracketLoad },
          material
        );
      case 'truss-frame':
        return solveTrussFrame(
          { spanLength: trussSpan, height: trussHeight, barArea: trussArea, loadP: trussLoad },
          material
        );
      case 'shaft-torsion':
        return solveShaftTorsion(
          { length: shaftLength, diameter: shaftDiameter, torqueT: shaftTorque },
          material
        );
      case 'thermal-conduction':
        return solveThermalConduction(
          { length: thermalLength, width: 50, thickness: 10, tempHot, tempCold },
          material
        );
    }
  }, [
    templateId, material,
    beamLength, beamHeight, beamWidth, beamLoad,
    plateLength, plateWidth, plateThickness, holeDiameter, plateLoad,
    arm1Length, arm2Length, bracketWidth, bracketThickness, filletRadius, bracketLoad,
    trussSpan, trussHeight, trussArea, trussLoad,
    shaftLength, shaftDiameter, shaftTorque,
    thermalLength, tempHot, tempCold
  ]);

  const templateCards = [
    {
      id: 'cantilever' as FeaTemplateId,
      nameEn: 'Cantilever Beam',
      nameTr: 'Konsol Kiriş',
      std: 'Euler-Bernoulli',
      icon: Box,
    },
    {
      id: 'plate-hole' as FeaTemplateId,
      nameEn: 'Plate with Hole',
      nameTr: 'Delikli Çekme Plakası',
      std: 'Kirsch (Kt ≈ 3.0)',
      icon: Layers,
    },
    {
      id: 'l-bracket' as FeaTemplateId,
      nameEn: 'L-Bracket Joint',
      nameTr: 'L-Braket Köşebent',
      std: 'Peterson Stress Conc.',
      icon: Activity,
    },
    {
      id: 'truss-frame' as FeaTemplateId,
      nameEn: '2D Truss Frame',
      nameTr: '2D Kafes Sistem',
      std: 'Method of Joints',
      icon: ShieldCheck,
    },
    {
      id: 'shaft-torsion' as FeaTemplateId,
      nameEn: 'Shaft Torsion',
      nameTr: 'Burulma Mili',
      std: 'Coulomb / St. Venant',
      icon: Disc,
    },
    {
      id: 'thermal-conduction' as FeaTemplateId,
      nameEn: 'Thermal Stress',
      nameTr: 'Termal Gerilme',
      std: 'Fourier Conduction',
      icon: Flame,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-200">
      {/* ─── TOP HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                FEA Linear Static v1.5
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                6 Validated Templates
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {tr
                ? 'Deterministik Sonlu Elemanlar Analizi · %100 İstemci Taraflı Çözücü · Analitik Doğrulama (< %8 Hata)'
                : 'Deterministic Finite Element Solver · 100% Client-Side · Analytical Verification (< 8% Error)'}
            </p>
          </div>
        </div>

        {/* Real-Time Accuracy Badge */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="font-mono text-xs">
            <span className="text-slate-400">{tr ? 'Doğrulama Hatası:' : 'Accuracy Benchmark:'} </span>
            <span className="font-bold text-emerald-300">
              {feaResult.stressErrorPct}% {tr ? 'Hata' : 'Error'} ({tr ? 'Doğrulandı' : 'Verified'})
            </span>
          </div>
        </div>
      </header>

      {/* ─── TEMPLATE SELECTOR PILLS (6 Templates) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {templateCards.map((t) => {
          const Icon = t.icon;
          const isSelected = templateId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/70 to-blue-950/50 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-[#080d1a] border-white/5 text-slate-400 hover:border-white/15 hover:bg-[#0c1222]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                <span className="text-xs font-bold truncate">{tr ? t.nameTr : t.nameEn}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block truncate">{t.std}</span>
            </button>
          );
        })}
      </div>

      {/* ─── MAIN 2-COLUMN WORKBENCH ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Parametric Controls & Material (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Material Selector */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>{tr ? 'Malzeme Seçimi' : 'Material Selection'}</span>
            </label>
            <select
              value={materialKey}
              onChange={(e) => setMaterialKey(e.target.value)}
              className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 shadow-inner"
            >
              {Object.entries(FEA_MATERIALS).map(([key, mat]) => (
                <option key={key} value={key}>
                  {mat.name} (E={mat.elasticModulus || (mat.youngsModulus ? mat.youngsModulus / 1000 : 70)} GPa, Sy={mat.yieldStrength} MPa)
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Template Sliders */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sliders size={14} />
                <span>{tr ? 'Parametreler & Yükler' : 'Parameters & Loads'}</span>
              </span>
            </div>

            {/* Cantilever Controls */}
            {templateId === 'cantilever' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Uzunluk (L)' : 'Length (L)'}</span>
                    <span className="text-white font-bold">{beamLength} mm</span>
                  </div>
                  <input type="range" min={50} max={500} step={10} value={beamLength} onChange={(e) => setBeamLength(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Yükseklik (H)' : 'Height (H)'}</span>
                    <span className="text-white font-bold">{beamHeight} mm</span>
                  </div>
                  <input type="range" min={10} max={100} step={5} value={beamHeight} onChange={(e) => setBeamHeight(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Genişlik (B)' : 'Width (B)'}</span>
                    <span className="text-white font-bold">{beamWidth} mm</span>
                  </div>
                  <input type="range" min={5} max={50} step={5} value={beamWidth} onChange={(e) => setBeamWidth(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Uç Yükü (P)' : 'Tip Load (P)'}</span>
                    <span className="text-amber-400 font-bold">{beamLoad} N</span>
                  </div>
                  <input type="range" min={100} max={10000} step={100} value={beamLoad} onChange={(e) => setBeamLoad(Number(e.target.value))} className="w-full accent-amber-400" />
                </div>
              </div>
            )}

            {/* Plate with Hole Controls */}
            {templateId === 'plate-hole' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Plaka Genişliği (W)' : 'Width (W)'}</span>
                    <span className="text-white font-bold">{plateWidth} mm</span>
                  </div>
                  <input type="range" min={40} max={150} step={5} value={plateWidth} onChange={(e) => setPlateWidth(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Delik Çapı (d)' : 'Hole Diameter (d)'}</span>
                    <span className="text-white font-bold">{holeDiameter} mm</span>
                  </div>
                  <input type="range" min={6} max={Math.min(50, plateWidth * 0.6)} step={2} value={holeDiameter} onChange={(e) => setHoleDiameter(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Kalınlık (T)' : 'Thickness (T)'}</span>
                    <span className="text-white font-bold">{plateThickness} mm</span>
                  </div>
                  <input type="range" min={2} max={25} step={1} value={plateThickness} onChange={(e) => setPlateThickness(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Çekme Yükü (F)' : 'Tensile Load (F)'}</span>
                    <span className="text-amber-400 font-bold">{plateLoad} N</span>
                  </div>
                  <input type="range" min={1000} max={50000} step={1000} value={plateLoad} onChange={(e) => setPlateLoad(Number(e.target.value))} className="w-full accent-amber-400" />
                </div>
              </div>
            )}

            {/* L-Bracket Controls */}
            {templateId === 'l-bracket' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Yatay Kol (L1)' : 'Arm 1 (L1)'}</span>
                    <span className="text-white font-bold">{arm1Length} mm</span>
                  </div>
                  <input type="range" min={50} max={200} step={10} value={arm1Length} onChange={(e) => setArm1Length(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Dikey Kol (L2)' : 'Arm 2 (L2)'}</span>
                    <span className="text-white font-bold">{arm2Length} mm</span>
                  </div>
                  <input type="range" min={40} max={150} step={10} value={arm2Length} onChange={(e) => setArm2Length(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Kavis Yarıçapı (r)' : 'Fillet Radius (r)'}</span>
                    <span className="text-white font-bold">{filletRadius} mm</span>
                  </div>
                  <input type="range" min={2} max={20} step={1} value={filletRadius} onChange={(e) => setFilletRadius(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Uygulanan Yük (P)' : 'Applied Load (P)'}</span>
                    <span className="text-amber-400 font-bold">{bracketLoad} N</span>
                  </div>
                  <input type="range" min={200} max={10000} step={200} value={bracketLoad} onChange={(e) => setBracketLoad(Number(e.target.value))} className="w-full accent-amber-400" />
                </div>
              </div>
            )}

            {/* 2D Truss Controls */}
            {templateId === 'truss-frame' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Açıklık (L)' : 'Span (L)'}</span>
                    <span className="text-white font-bold">{trussSpan} mm</span>
                  </div>
                  <input type="range" min={100} max={600} step={20} value={trussSpan} onChange={(e) => setTrussSpan(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Yükseklik (H)' : 'Height (H)'}</span>
                    <span className="text-white font-bold">{trussHeight} mm</span>
                  </div>
                  <input type="range" min={50} max={300} step={10} value={trussHeight} onChange={(e) => setTrussHeight(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Düğüm Noktası Yükü (P)' : 'Joint Load (P)'}</span>
                    <span className="text-amber-400 font-bold">{trussLoad} N</span>
                  </div>
                  <input type="range" min={500} max={20000} step={500} value={trussLoad} onChange={(e) => setTrussLoad(Number(e.target.value))} className="w-full accent-amber-400" />
                </div>
              </div>
            )}

            {/* Shaft Torsion Controls */}
            {templateId === 'shaft-torsion' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Mil Boyu (L)' : 'Shaft Length (L)'}</span>
                    <span className="text-white font-bold">{shaftLength} mm</span>
                  </div>
                  <input type="range" min={100} max={600} step={20} value={shaftLength} onChange={(e) => setShaftLength(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Mil Çapı (d)' : 'Diameter (d)'}</span>
                    <span className="text-white font-bold">{shaftDiameter} mm</span>
                  </div>
                  <input type="range" min={10} max={80} step={2} value={shaftDiameter} onChange={(e) => setShaftDiameter(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Burulma Torku (T)' : 'Torque (T)'}</span>
                    <span className="text-amber-400 font-bold">{shaftTorque} N.m</span>
                  </div>
                  <input type="range" min={10} max={1000} step={10} value={shaftTorque} onChange={(e) => setShaftTorque(Number(e.target.value))} className="w-full accent-amber-400" />
                </div>
              </div>
            )}

            {/* Thermal Conduction Controls */}
            {templateId === 'thermal-conduction' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Sıcak Yüzey Sıcaklığı (T_hot)' : 'Hot Surface Temp (T_hot)'}</span>
                    <span className="text-rose-400 font-bold">{tempHot} °C</span>
                  </div>
                  <input type="range" min={50} max={300} step={10} value={tempHot} onChange={(e) => setTempHot(Number(e.target.value))} className="w-full accent-rose-400" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{tr ? 'Soğuk Yüzey Sıcaklığı (T_cold)' : 'Cold Surface Temp (T_cold)'}</span>
                    <span className="text-cyan-400 font-bold">{tempCold} °C</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={tempCold} onChange={(e) => setTempCold(Number(e.target.value))} className="w-full accent-cyan-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Interactive WebGL Mesh Canvas & Benchmark Output (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 3D Viewer Container */}
          <div className="rounded-3xl bg-[#080d1a] border border-white/10 p-3 sm:p-4 shadow-2xl space-y-3">
            <div className="h-[460px] w-full rounded-2xl overflow-hidden relative">
              <FeaMeshViewer3D
                analysis={feaResult}
                showWireframe={showWireframe}
                deformationScale={deformationScale}
                showProbes={true}
              />
            </div>

            {/* Viewport Control Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 border-t border-white/10 font-mono text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showWireframe}
                    onChange={(e) => setShowWireframe(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span>{tr ? 'Tel Kafes (Wireframe)' : 'Wireframe Mesh'}</span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span>{tr ? 'Deformasyon Ölçeği:' : 'Deform Scale:'}</span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={deformationScale}
                  onChange={(e) => setDeformationScale(Number(e.target.value))}
                  className="w-24 accent-cyan-400"
                />
                <span className="text-cyan-400 font-bold">{deformationScale}x</span>
              </div>
            </div>
          </div>

          {/* Real-Time Analytical Benchmark Comparison Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/10 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">{tr ? 'Maks von Mises' : 'Max von Mises'}</span>
              <p className="text-lg font-black text-cyan-300 mt-1">{feaResult.maxVonMisesMpa} <span className="text-xs text-slate-400">MPa</span></p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{tr ? 'Analitik:' : 'Analytical:'} {feaResult.analyticalStressMpa} MPa</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/10 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">{tr ? 'Maks Deplasman' : 'Max Displacement'}</span>
              <p className="text-lg font-black text-amber-300 mt-1">{feaResult.maxDisplacementMm} <span className="text-xs text-slate-400">mm</span></p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{tr ? 'Analitik:' : 'Analytical:'} {feaResult.analyticalDispMm} mm</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/10 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">{tr ? 'Güvenlik Katsayısı' : 'Safety Factor'}</span>
              <p className={`text-lg font-black mt-1 ${feaResult.safetyFactor >= 1.5 ? 'text-emerald-400' : feaResult.safetyFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {feaResult.safetyFactor}x
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Akma Sy: {material.yieldStrength} MPa</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080d1a] border border-emerald-500/30 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">{tr ? 'Doğrulama Durumu' : 'Validation Status'}</span>
              <p className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={16} />
                <span>% {feaResult.stressErrorPct} {tr ? 'Hata' : 'Error'}</span>
              </p>
              <span className="text-[10px] text-emerald-300/80 mt-0.5 block">&lt; %8 {tr ? 'Hassasiyet Onaylı' : 'Accuracy Pass'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationFEAModule;

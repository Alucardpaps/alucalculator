'use client';

/**
 * 🧰 AUTODESK INVENTOR-GRADE DESIGN ACCELERATORS (V2)
 * 
 * Normative ISO/DIN/VDI calculation suite coupled directly to 3D parametric solids:
 * 1. Bolted Connection Generator (VDI 2230 / ISO 4014 / ISO 7089 / ISO 4032 Stack)
 * 2. Involute Gearbox Generator (ISO 6336: Spur, Helical, Bevel, Worm & Rack)
 * 3. Stepped Shaft & Keyway Generator (DIN 743 & DIN 6885)
 * 4. Anti-Friction Bearing Catalog (ISO 281 / DIN 625)
 * 5. Helical Spring Generator (DIN EN 13906-1 / DIN 2089)
 * 6. Structural Profile & Frame Extrusion (DIN EN 12020 & EN 10025)
 */

import React, { useState } from 'react';
import {
  Wrench,
  Layers,
  CircleDot,
  Settings,
  Ruler,
  Plus,
  Check,
  Search,
  Sparkles,
  Activity,
  Box,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore, type Point2D } from '@/design-studio/designStore';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';

/** ISO 261 coarse pitch, ISO 898-1 stress area, ISO 4014 dw min, ISO 273 medium clearance hole. */
const BOLT_VDI_ROWS: Record<number, { P: number; As: number; dw: number; dh: number }> = {
  10: { P: 1.5, As: 58.0, dw: 14.6, dh: 11.0 },
  12: { P: 1.75, As: 84.3, dw: 16.6, dh: 13.5 },
  16: { P: 2.0, As: 157, dw: 22.5, dh: 17.5 },
  20: { P: 2.5, As: 245, dw: 28.2, dh: 22.0 },
  24: { P: 3.0, As: 353, dw: 33.6, dh: 26.0 },
};

export function SolversDrawer() {
  const { language } = useI18nStore();
  const addPart = useDesignStore((s) => s.addPart);

  const [activeSolver, setActiveSolver] = useState<
    'bolt' | 'gear' | 'shaft' | 'bearing' | 'spring' | 'tslot'
  >('bolt');
  const [searchFilter, setSearchFilter] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // ─── 1. BOLTED CONNECTION GENERATOR (VDI 2230 / ISO 4014 / ISO 7089) ───
  const [boltDia, setBoltDia] = useState<number>(16); // M16
  const [boltLen, setBoltLen] = useState<number>(60);
  const [boltGrade, setBoltGrade] = useState<'8.8' | '10.9' | '12.9'>('10.9');
  const [boltFriction, setBoltFriction] = useState<number>(0.12);
  const [clampingMm, setClampingMm] = useState<number>(35);
  const [insertAsStack, setInsertAsStack] = useState<boolean>(true);

  // VDI 2230-1 (R13): MA = FM · (0.16·P + 0.58·d2·μG + DKm/2·μK), FM = 0.9 · Sp · As
  // ISO 261 coarse pitch, ISO 898-1 As and proof stress Sp (8.8: 580 MPa for d ≤ 16, 600 above),
  // ISO 4014 bearing face dw and ISO 273 medium clearance hole dh.
  const boltRow = BOLT_VDI_ROWS[boltDia] ?? BOLT_VDI_ROWS[16];
  const boltPitch = boltRow.P;
  const proofStressMpa = boltGrade === '8.8' ? (boltDia <= 16 ? 580 : 600) : boltGrade === '10.9' ? 830 : 970;
  const stressAreaMm2 = boltRow.As;
  const preloadN = 0.9 * proofStressMpa * stressAreaMm2;
  const preloadKn = Number((preloadN / 1000).toFixed(1));
  const boltD2 = boltDia - 0.6495 * boltPitch;
  const boltDKm = (boltRow.dw + boltRow.dh) / 2;
  const torqueNm = Number(((preloadN * (0.16 * boltPitch + 0.58 * boltD2 * boltFriction + (boltDKm / 2) * boltFriction)) / 1000).toFixed(1));

  const handleInsertBoltOrStack = () => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const washerThick = boltDia <= 12 ? 2.5 : boltDia <= 16 ? 3.0 : 4.0;
    const nutThick = Math.round(boltDia * 0.85);

    if (insertAsStack) {
      // 1. Bolt ISO 4014
      const boltId = store.addPart('hex-bolt');
      const boltY = clampingMm / 2 + washerThick;
      store.updatePart(boltId, {
        name: `M${boltDia}x${boltLen} ISO 4014 (${boltGrade})`,
        position: { x: 0, y: boltY, z: 0 },
        rotation: { x: 180, y: 0, z: 0 },
        params: {
          diameter: boltDia,
          length: boltLen,
          pitch: boltPitch,
          boltType: 'hex_bolt',
          grade: boltGrade,
        },
      });

      // 2. Top Washer ISO 7089
      const topWasherId = store.addPart('washer');
      store.updatePart(topWasherId, {
        name: `Washer ISO 7089-d${boltDia} (Top)`,
        position: { x: 0, y: clampingMm / 2 + washerThick / 2, z: 0 },
        params: {
          innerDiameter: boltDia + 1,
          outerDiameter: Math.round(boltDia * 2),
          thickness: washerThick,
        },
      });

      // 3. Bottom Washer ISO 7089
      const botWasherId = store.addPart('washer');
      store.updatePart(botWasherId, {
        name: `Washer ISO 7089-d${boltDia} (Bottom)`,
        position: { x: 0, y: -clampingMm / 2 - washerThick / 2, z: 0 },
        params: {
          innerDiameter: boltDia + 1,
          outerDiameter: Math.round(boltDia * 2),
          thickness: washerThick,
        },
      });

      // 4. Hex Nut ISO 4032
      const nutId = store.addPart('hex-nut');
      store.updatePart(nutId, {
        name: `M${boltDia} ISO 4032 Nut`,
        position: { x: 0, y: -clampingMm / 2 - washerThick - nutThick / 2, z: 0 },
        params: {
          diameter: boltDia,
          width: Math.round(boltDia * 1.8),
          height: nutThick,
          pitch: boltPitch,
        },
      });

      notify(t12(language, `Complete M${boltDia} Joint Stack (Bolt+Washers+Nut) added`, `Tam M${boltDia} Bağlantı Takımı (Cıvata+Pul+Somun) eklendi`));
    } else {
      const boltId = store.addPart('hex-bolt');
      store.updatePart(boltId, {
        name: `M${boltDia}x${boltLen} ISO 4014 (${boltGrade})`,
        params: {
          diameter: boltDia,
          length: boltLen,
          pitch: boltPitch,
          boltType: 'hex_bolt',
          grade: boltGrade,
        },
      });
      notify(t12(language, `M${boltDia} Bolt added to 3D scene`, `M${boltDia} Cıvata 3D sahneye eklendi`));
    }
    triggerCameraView('fit');
  };

  // ─── 2. INVOLUTE GEARBOX GENERATOR (ISO 6336 / DIN 867) ───
  const [gearForm, setGearForm] = useState<'spur' | 'helical' | 'bevel' | 'worm' | 'rack'>('spur');
  const [gearModule, setGearModule] = useState<number>(2.5);
  const [gearTeethZ1, setGearTeethZ1] = useState<number>(18);
  const [gearTeethZ2, setGearTeethZ2] = useState<number>(36);
  const [gearFaceWidth, setGearFaceWidth] = useState<number>(25);
  const [gearHelixAngle, setGearHelixAngle] = useState<number>(15);

  const cosBeta = gearForm === 'helical' ? Math.cos((gearHelixAngle * Math.PI) / 180) : 1.0;
  const gearPitchDia1 = (gearModule * gearTeethZ1) / cosBeta;
  const gearPitchDia2 = (gearModule * gearTeethZ2) / cosBeta;
  const gearCenterDistance = (gearModule * (gearTeethZ1 + gearTeethZ2)) / (2 * cosBeta);
  const gearRatio = (gearTeethZ2 / gearTeethZ1).toFixed(2);

  const handleInsertGearPair = () => {
    useDesignStore.getState().addGearPair({
      module: gearModule,
      z1: gearTeethZ1,
      z2: gearTeethZ2,
      faceWidth: gearFaceWidth,
      pressureAngle: 20,
    });
    notify(t12(language, `Mated Gear Pair (z1=${gearTeethZ1}, z2=${gearTeethZ2}, a=${gearCenterDistance.toFixed(1)}mm) added`, `Eşleşen Dişli Çifti (z₁=${gearTeethZ1}, z₂=${gearTeethZ2}, a=${gearCenterDistance.toFixed(1)}mm) eklendi`));
    triggerCameraView('fit');
  };

  const handleInsertSingleGear = () => {
    const store = useDesignStore.getState();
    const id = store.addPart('gear-blank');
    store.updatePart(id, {
      name: `${gearForm.toUpperCase()} Gear m=${gearModule} z=${gearTeethZ1}`,
      params: {
        form: gearForm,
        module: gearModule,
        teeth: gearTeethZ1,
        depth: gearFaceWidth,
        faceWidth: gearFaceWidth,
        bore: Math.max(12, Math.round(gearPitchDia1 * 0.3)),
        pressureAngle: 20,
        helixAngle: gearForm === 'helical' ? gearHelixAngle : 0,
        pitchConeAngleDeg: gearForm === 'bevel' ? 45 : undefined,
      },
    });
    notify(t12(language, `Single ${gearForm} gear added`, `Tek ${gearForm} dişli eklendi`));
    triggerCameraView('fit');
  };

  // ─── 3. STEPPED SHAFT & KEYWAY (DIN 743 & DIN 6885) ───
  const [shaftDia, setShaftDia] = useState<number>(40);
  const [hubTorque, setHubTorque] = useState<number>(350);
  const keyWidth = shaftDia <= 22 ? 6 : shaftDia <= 30 ? 8 : shaftDia <= 38 ? 10 : shaftDia <= 44 ? 12 : 14;
  const keyHeight = shaftDia <= 22 ? 6 : shaftDia <= 30 ? 7 : shaftDia <= 38 ? 8 : shaftDia <= 44 ? 8 : 9;
  const minKeyLen = Math.max(25, Math.ceil((2 * hubTorque * 1000) / (shaftDia * (keyHeight / 2) * 120)));

  const handleInsertKeywayShaft = () => {
    const store = useDesignStore.getState();
    const id = store.addPart('keyway-shaft');
    store.updatePart(id, {
      name: `Ø${shaftDia} DIN 6885 Spindle (${minKeyLen}mm Key)`,
      params: {
        diameter: shaftDia,
        length: minKeyLen * 2.5,
        keyWidth: keyWidth,
        keyDepth: keyHeight / 2,
        keyLength: minKeyLen,
      },
    });
    notify(t12(language, `Ø${shaftDia} Keyway shaft added to 3D scene`, `Ø${shaftDia} Kamalı mil 3D sahneye eklendi`));
    triggerCameraView('fit');
  };

  // ─── 4. ANTI-FRICTION BEARING (ISO 281 / DIN 625) ───
  const [bearingType, setBearingType] = useState<'6008' | '6208' | '6308'>('6208');
  const bearingSpecs = {
    '6008': { d: 40, D: 68, B: 15, C: 17.8, C0: 11.6 },
    '6208': { d: 40, D: 80, B: 18, C: 30.7, C0: 19.0 },
    '6308': { d: 40, D: 90, B: 23, C: 42.3, C0: 24.0 },
  }[bearingType];

  const handleInsertBearing = () => {
    const store = useDesignStore.getState();
    store.addStandardBearing({
      designation: `SKF ${bearingType}`,
      d: bearingSpecs.d,
      D: bearingSpecs.D,
      B: bearingSpecs.B,
      type: 'deep-groove-ball',
      Cr: bearingSpecs.C,
      C0: bearingSpecs.C0,
    });
    notify(t12(language, `Bearing ${bearingType} added to 3D scene`, `${bearingType} Rulman 3D sahneye eklendi`));
    triggerCameraView('fit');
  };

  // ─── 5. HELICAL SPRING ACCELERATOR (DIN EN 13906-1 / DIN 2089) ───
  const [springWireDia, setSpringWireDia] = useState<number>(3.5);
  const [springMeanDia, setSpringMeanDia] = useState<number>(28);
  const [springActiveCoils, setSpringActiveCoils] = useState<number>(7);
  const [springFreeLen, setSpringFreeLen] = useState<number>(65);

  // DIN EN 13906-1 calculations
  const springIndexC = Number((springMeanDia / springWireDia).toFixed(1));
  const wahlFactorKw = Number(((4 * springIndexC - 1) / (4 * springIndexC - 4) + 0.615 / springIndexC).toFixed(3));
  // G = 81500 MPa for EN 10270-1 spring steel
  const springRate = Number(
    ((81500 * Math.pow(springWireDia, 4)) / (8 * Math.pow(springMeanDia, 3) * springActiveCoils)).toFixed(2)
  );
  const solidLengthLc = Number(((springActiveCoils + 1.5) * springWireDia).toFixed(1));
  const maxWorkingForceFc = Number(((springFreeLen - solidLengthLc) * springRate).toFixed(1));

  const handleInsertSpring = () => {
    const store = useDesignStore.getState();
    store.pushHistory();

    const wireR = springWireDia / 2;
    const outer: Point2D[] = [];
    const segs = 12;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      outer.push({ x: Math.cos(a) * wireR, y: Math.sin(a) * wireR });
    }

    const id = store.addPart('profile');
    store.updatePart(id, {
      name: `Spring DIN 13906-1 (d=${springWireDia}, Dm=${springMeanDia}, L0=${springFreeLen})`,
      kind: 'profile',
      solidOp: 'helix',
      outer,
      params: {
        helixPitch: springFreeLen / Math.max(1, springActiveCoils),
        helixTurns: springActiveCoils,
        helixRadius: springMeanDia / 2,
        wireDiameter: springWireDia,
        meanDiameter: springMeanDia,
        freeLength: springFreeLen,
        coils: springActiveCoils,
        springRate,
      },
    });
    notify(t12(language, `Helical Spring (R=${springRate} N/mm) added to 3D scene`, `Helisel Yay (R=${springRate} N/mm) 3D sahneye eklendi`));
    triggerCameraView('fit');
  };

  // ─── 6. STRUCTURAL EXTRUSION & BEAM (DIN EN 12020 / EN 10025) ───
  const [profileKind, setProfileKind] = useState<'tslot' | 'steel'>('tslot');
  const [tslotSeries, setTslotSeries] = useState<number>(40);
  const [steelBeamName, setSteelBeamName] = useState<'IPE 100' | 'HEA 120' | 'RHS 80x40'>('IPE 100');
  const [cutLength, setCutLength] = useState<number>(600);

  const handleInsertProfile = () => {
    const store = useDesignStore.getState();
    if (profileKind === 'tslot') {
      store.addTSlotPart(tslotSeries, cutLength);
      notify(t12(language, `${tslotSeries}s T-Slot Profile added`, `${tslotSeries}s T-Kanal profil eklendi`));
    } else {
      const specs = {
        'IPE 100': { h: 100, b: 55, tw: 4.1, tf: 5.7 },
        'HEA 120': { h: 114, b: 120, tw: 5.0, tf: 8.0 },
        'RHS 80x40': { h: 80, b: 40, tw: 4.0, tf: 4.0 },
      }[steelBeamName];

      store.addStructuralProfile({
        type: steelBeamName.startsWith('RHS') ? 'box' : 'I-beam',
        designation: steelBeamName,
        lengthMm: cutLength,
        params: {
          height: specs.h,
          width: specs.b,
          depth: cutLength,
          length: cutLength,
          webThickness: specs.tw,
          flangeThickness: specs.tf,
        },
        standard: 'EN 10025 / EN 10034',
      });
      notify(t12(language, `${steelBeamName} Steel Beam added`, `${steelBeamName} Çelik Kiriş eklendi`));
    }
    triggerCameraView('fit');
  };

  const solversList = [
    { id: 'bolt', name: 'Bolted Joint', nameTr: 'Cıvata Bağlantısı', std: 'VDI 2230', icon: Wrench },
    { id: 'gear', name: 'Involute Gearbox', nameTr: 'Evolvent Dişli', std: 'ISO 6336', icon: Settings },
    { id: 'shaft', name: 'Stepped Shaft & Key', nameTr: 'Kademeli Mil & Kama', std: 'DIN 743 / 6885', icon: Layers },
    { id: 'bearing', name: 'Ball Bearing', nameTr: 'Rulman (SKF)', std: 'ISO 281', icon: CircleDot },
    { id: 'spring', name: 'Helical Spring', nameTr: 'Helisel Yay', std: 'DIN EN 13906', icon: Activity },
    { id: 'tslot', name: 'Structural Frame', nameTr: 'Yapısal Profil / Kiriş', std: 'DIN EN 12020', icon: Ruler },
  ] as const;

  const filteredSolvers = solversList.filter((s) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.nameTr.toLowerCase().includes(q) || s.std.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg-1)] font-mono text-[11px] text-[var(--ink)] select-none overflow-hidden">
      {/* Toast Notification */}
      {successToast && (
        <div className="mx-2 mt-2 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--ok)]/20 border border-[var(--ok)]/40 text-[var(--ok)] text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
          <Check size={12} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Search */}
      <div className="p-2.5 border-b border-[var(--line)] bg-[var(--bg-0)] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[var(--cyan)] font-bold text-xs">
            <Sparkles size={14} />
            <span>{t12(language, 'DESIGN ACCELERATORS', 'TASARIM HIZLANDIRICILARI')}</span>
          </div>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)]">
            DIN · ISO · VDI
          </span>
        </div>

        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t12(language, 'Search standard solvers (e.g. VDI, Gear, Spring)...', 'Çözücü ara (örn. Cıvata, Dişli, Yay)...')}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-7 pr-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] text-[10px] text-white focus:outline-none focus:border-[var(--cyan)] placeholder-slate-500"
          />
        </div>
      </div>

      {/* Horizontal Category Switcher Chips */}
      <div className="p-1.5 border-b border-[var(--line)] bg-[var(--bg-0)]/50 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        {filteredSolvers.map((s) => {
          const Icon = s.icon;
          const isActive = activeSolver === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSolver(s.id as any)}
              className={`px-2 py-1 rounded-[var(--radius-s)] text-[9.5px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--cyan)] text-black shadow-sm'
                  : 'bg-[var(--bg-2)] text-[var(--alu)] hover:text-white border border-[var(--line)]'
              }`}
            >
              <Icon size={11} />
              <span>{t12(language, s.name, s.nameTr)}</span>
            </button>
          );
        })}
      </div>

      {/* Solver Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* 1. BOLT SOLVER */}
        {activeSolver === 'bolt' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">ISO 4014 / VDI 2230</span>
                <span className="text-[var(--cyan)] font-mono text-[9px] font-bold">Grade {boltGrade}</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(
                  language,
                  'High-strength bolted joint calculation with 3D helical threads.',
                  '3D helisel dişli yüksek mukavemetli cıvata, somun ve pul takımı.'
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">{t12(language, 'Nominal Size:', 'Nominal Çap:')}</span>
                <div className="flex items-center gap-1">
                  {[10, 12, 16, 20, 24].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBoltDia(d)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                        boltDia === d
                          ? 'bg-[var(--cyan)] text-black'
                          : 'bg-[var(--bg-0)] text-slate-400 border border-[var(--line)]'
                      }`}
                    >
                      M{d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">{t12(language, 'Clamp Length (t):', 'Sıkma Paketi (t):')}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={clampingMm}
                    onChange={(e) => setClampingMm(Math.max(5, Number(e.target.value) || 30))}
                    className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">mm</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">{t12(language, 'Assembly Mode:', 'Montaj Modu:')}</span>
                <button
                  type="button"
                  onClick={() => setInsertAsStack((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                    insertAsStack
                      ? 'bg-[var(--ok)]/20 text-[var(--ok)] border-[var(--ok)]/50'
                      : 'bg-[var(--bg-0)] text-[var(--alu)] border-[var(--line)]'
                  }`}
                >
                  {insertAsStack
                    ? t12(language, 'Full Stack (Bolt+Washers+Nut)', 'Tam Takım (Cıvata+Pul+Somun)')
                    : t12(language, 'Bolt Only', 'Sadece Cıvata')}
                </button>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">{t12(language, 'Preload (Fm):', 'Ön Gerilme (Fm):')}</span>
                <strong className="text-[var(--cyan)]">{preloadKn} kN</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">{t12(language, 'Tightening Torque (Ma):', 'Sıkma Torku (Ma):')}</span>
                <strong className="text-[var(--ok)]">{torqueNm} Nm</strong>
              </div>
            </div>

            <button
              onClick={handleInsertBoltOrStack}
              className="w-full py-2 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:brightness-110 text-black font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              <span>{insertAsStack ? t12(language, 'INSERT BOLTED JOINT STACK', 'TAM CIVATA TAKIMINI 3D EKLE') : t12(language, 'INSERT BOLT TO 3D', 'CIVATAYI 3D SAHNEYE EKLE')}</span>
            </button>
          </div>
        )}

        {/* 2. GEAR SOLVER */}
        {activeSolver === 'gear' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">ISO 6336 / DIN 867</span>
                <span className="text-emerald-400 font-mono text-[9px] font-bold">{gearForm.toUpperCase()}</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(
                  language,
                  'Deterministic involute gear generator with exact center distance (a).',
                  'Eksen mesafesi (a) ile analitik evolvent eşleşen ikiz dişli katı model üretici.'
                )}
              </p>
            </div>

            {/* Gear Form Switcher */}
            <div className="grid grid-cols-4 gap-1">
              {(['spur', 'helical', 'bevel', 'worm'] as const).map((gf) => (
                <button
                  key={gf}
                  onClick={() => setGearForm(gf)}
                  className={`py-1 text-[9px] font-bold rounded border uppercase cursor-pointer ${
                    gearForm === gf
                      ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-emerald-400'
                      : 'bg-[var(--bg-0)] text-[var(--alu)] border-[var(--line)]'
                  }`}
                >
                  {gf}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Modül m:</span>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={gearModule}
                  onChange={(e) => setGearModule(Math.max(0.5, Number(e.target.value) || 2))}
                  className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Pinyon z₁ / Çark z₂:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={gearTeethZ1}
                    onChange={(e) => setGearTeethZ1(Math.max(8, Number(e.target.value) || 18))}
                    className="w-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 text-center text-[10px] text-white"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={gearTeethZ2}
                    onChange={(e) => setGearTeethZ2(Math.max(8, Number(e.target.value) || 36))}
                    className="w-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 text-center text-[10px] text-white"
                  />
                </div>
              </div>

              {gearForm === 'helical' && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--alu)]">Helis Açısı β:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={45}
                      value={gearHelixAngle}
                      onChange={(e) => setGearHelixAngle(Math.max(0, Number(e.target.value) || 15))}
                      className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                    />
                    <span className="text-[9px] text-[var(--alu)]">°</span>
                  </div>
                </div>
              )}
            </div>

            {/* Geometry Info */}
            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-emerald-500/30 space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Eksen Mesafesi (a):</span>
                <strong className="text-emerald-400">{gearCenterDistance.toFixed(2)} mm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Çevrim Oranı (i):</span>
                <strong className="text-white">{gearRatio} : 1</strong>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={handleInsertGearPair}
                className="w-full py-2 rounded-[var(--radius-s)] bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={13} />
                <span>{t12(language, 'INSERT MATED GEAR PAIR (Z1+Z2)', 'İKİZİ İLE BERABER EKLE (PİNYON + ÇARK)')}</span>
              </button>

              <button
                onClick={handleInsertSingleGear}
                className="w-full py-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] border border-[var(--line)] text-slate-300 hover:text-white font-bold text-[9px] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>{t12(language, `Insert Single ${gearForm} (z₁=${gearTeethZ1})`, `Tek ${gearForm} Dişli Ekle (z₁=${gearTeethZ1})`)}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. STEPPED SHAFT SOLVER */}
        {activeSolver === 'shaft' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">DIN 743 / DIN 6885</span>
                <span className="text-amber-400 font-mono text-[9px] font-bold">Stepped Spindle</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(language, 'Torsion transmission shaft with DIN 6885 keyway slot.', 'Tork transmisyon mili ve DIN 6885 standart kama yuvası.')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Mil Çapı (d):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={shaftDia}
                    onChange={(e) => setShaftDia(Math.max(15, Number(e.target.value) || 40))}
                    className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">mm</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Tork (T):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={hubTorque}
                    onChange={(e) => setHubTorque(Math.max(10, Number(e.target.value) || 350))}
                    className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">Nm</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-amber-500/30 space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Kama Kesiti (b × h):</span>
                <strong className="text-amber-400">{keyWidth} × {keyHeight} mm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Min. Kama Boyu (L):</span>
                <strong className="text-white">{minKeyLen} mm</strong>
              </div>
            </div>

            <button
              onClick={handleInsertKeywayShaft}
              className="w-full py-2 rounded-[var(--radius-s)] bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              <span>{t12(language, 'INSERT STEPPED SHAFT TO 3D', 'KAMALI MİLİ 3D SAHNEYE EKLE')}</span>
            </button>
          </div>
        )}

        {/* 4. BEARING SOLVER */}
        {activeSolver === 'bearing' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">ISO 281 / DIN 625</span>
                <span className="text-sky-400 font-mono text-[9px] font-bold">Deep Groove Ball</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(language, 'Standard industrial deep groove ball bearing catalog.', 'Standart sabit bilyalı rulman seçim ve 3D geometrisi.')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--alu)]">Rulman Serisi:</span>
              <div className="flex items-center gap-1">
                {(['6008', '6208', '6308'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBearingType(b)}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer ${
                      bearingType === b ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-[var(--bg-0)] text-slate-400 border border-[var(--line)]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-sky-500/30 space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Boyutlar (d × D × B):</span>
                <strong className="text-white">{bearingSpecs.d} × {bearingSpecs.D} × {bearingSpecs.B} mm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Dinamik Yük (C):</span>
                <strong className="text-sky-300">{bearingSpecs.C} kN</strong>
              </div>
            </div>

            <button
              onClick={handleInsertBearing}
              className="w-full py-2 rounded-[var(--radius-s)] bg-sky-400 hover:bg-sky-300 text-black font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              <span>{t12(language, 'INSERT BEARING ' + bearingType, bearingType + ' RULMANI 3D SAHNEYE EKLE')}</span>
            </button>
          </div>
        )}

        {/* 5. HELICAL SPRING SOLVER */}
        {activeSolver === 'spring' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">DIN EN 13906-1 / DIN 2089</span>
                <span className="text-purple-400 font-mono text-[9px] font-bold">Compression Coil</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(language, 'Parametric 3D helical coil spring generator with Wahl stress factor.', 'Wahl gerilme faktörlü parametrik 3B helisel baskı yayı.')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Tel Çapı (d):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0.5}
                    max={16}
                    step={0.5}
                    value={springWireDia}
                    onChange={(e) => setSpringWireDia(Math.max(0.5, Number(e.target.value) || 3.5))}
                    className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">mm</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Ortalama Çap (Dm):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={4}
                    max={120}
                    value={springMeanDia}
                    onChange={(e) => setSpringMeanDia(Math.max(4, Number(e.target.value) || 28))}
                    className="w-16 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">mm</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Aktif Sarım (n) / Boy (L₀):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={springActiveCoils}
                    onChange={(e) => setSpringActiveCoils(Math.max(2, Number(e.target.value) || 7))}
                    className="w-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 text-center text-[10px] text-white"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={springFreeLen}
                    onChange={(e) => setSpringFreeLen(Math.max(10, Number(e.target.value) || 65))}
                    className="w-14 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-1 py-0.5 text-center text-[10px] text-white"
                  />
                  <span className="text-[9px] text-[var(--alu)]">mm</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-purple-500/30 space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Yay İndeksi (C = D/d):</span>
                <strong className={`font-bold ${springIndexC < 4 || springIndexC > 20 ? 'text-[var(--warn)]' : 'text-purple-400'}`}>
                  {springIndexC} (k_w = {wahlFactorKw})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Yay Rijitliği (R):</span>
                <strong className="text-white">{springRate} N/mm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alu)]">Blok Boyu (Lc):</span>
                <strong className="text-[var(--alu)]">{solidLengthLc} mm</strong>
              </div>
            </div>

            <button
              onClick={handleInsertSpring}
              className="w-full py-2 rounded-[var(--radius-s)] bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              <span>{t12(language, 'INSERT 3D HELICAL SPRING', '3D HELİSEL YAYI SAHNEYE EKLE')}</span>
            </button>
          </div>
        )}

        {/* 6. STRUCTURAL PROFILE SOLVER */}
        {activeSolver === 'tslot' && (
          <div className="space-y-3">
            <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white">DIN EN 12020 / EN 10025</span>
                <span className="text-amber-400 font-mono text-[9px] font-bold">Frame & Beams</span>
              </div>
              <p className="text-[9px] text-[var(--alu)] leading-tight">
                {t12(language, 'Standard modular aluminum T-slots & structural steel beams.', 'Modüler alüminyum T-kanallı profiller ve yapısal çelik kirişler.')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setProfileKind('tslot')}
                className={`py-1 text-[9.5px] font-bold rounded border cursor-pointer ${
                  profileKind === 'tslot'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-400'
                    : 'bg-[var(--bg-0)] text-[var(--alu)] border-[var(--line)]'
                }`}
              >
                T-Slot Alüminyum
              </button>
              <button
                type="button"
                onClick={() => setProfileKind('steel')}
                className={`py-1 text-[9.5px] font-bold rounded border cursor-pointer ${
                  profileKind === 'steel'
                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-amber-400'
                    : 'bg-[var(--bg-0)] text-[var(--alu)] border-[var(--line)]'
                }`}
              >
                Çelik Kiriş (IPE/HEA)
              </button>
            </div>

            {profileKind === 'tslot' ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">T-Slot Serisi:</span>
                <div className="flex items-center gap-1">
                  {[20, 30, 40, 45, 80].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTslotSeries(s)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                        tslotSeries === s ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-[var(--bg-0)] text-slate-400 border border-[var(--line)]'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--alu)]">Profil Tipi:</span>
                <div className="flex items-center gap-1">
                  {(['IPE 100', 'HEA 120', 'RHS 80x40'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSteelBeamName(b)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                        steelBeamName === b ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-[var(--bg-0)] text-slate-400 border border-[var(--line)]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--alu)]">{t12(language, 'Cut Length (L):', 'Kesim Boyu (L):')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={20}
                  max={6000}
                  step={50}
                  value={cutLength}
                  onChange={(e) => setCutLength(Math.max(20, Number(e.target.value) || 500))}
                  className="w-20 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                />
                <span className="text-[9px] text-[var(--alu)]">mm</span>
              </div>
            </div>

            <button
              onClick={handleInsertProfile}
              className="w-full py-2 rounded-[var(--radius-s)] bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              <span>{t12(language, 'INSERT PROFILE TO 3D', 'PROFİLİ 3D SAHNEYE EKLE')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Wind, ArrowUp, Activity, Gauge, CloudFog, Compass, 
  Layers, AlertTriangle, CheckCircle2, Zap, Sliders, Box, Car, 
  ShieldCheck, Fuel, BarChart3, TrendingUp, Info
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// Dynamically import 3D Wind Tunnel Viewport with SSR disabled
const WindTunnel3DViewport = dynamic(
  () => import('@/components/modules/mechanical/WindTunnel3DViewport'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] bg-[var(--bg-0)] rounded-2xl border border-[var(--line)] flex flex-col items-center justify-center text-cyan-400 font-mono text-xs gap-3">
        <Wind className="w-8 h-8 animate-spin text-cyan-500" />
        <span>Initializing 3D Wind Tunnel Chamber (Three.js WebGL)...</span>
      </div>
    ),
  }
);

// -------------------------------------------------------------
// Standard Atmosphere Model (ISA 1976 / ICAO Doc 7488)
// -------------------------------------------------------------
export function calculateISA(altitudeM: number) {
  const T0 = 288.15;       // Sea level temp (K)
  const P0 = 101325;       // Sea level pressure (Pa)
  const g = 9.80665;       // Gravity (m/s^2)
  const R = 287.05287;     // Specific gas constant for dry air (J/(kg·K))
  const gamma = 1.4;       // Specific heat ratio
  const L = 0.0065;        // Lapse rate (K/m)

  const h = Math.max(0, Math.min(30000, altitudeM));
  let T: number, P: number, rho: number;

  if (h <= 11000) {
    // Troposphere (0 - 11 km)
    T = T0 - L * h;
    P = P0 * Math.pow(1 - (L * h) / T0, g / (R * L));
  } else if (h <= 20000) {
    // Tropopause (11 - 20 km isothermal)
    T = 216.65;
    const P11 = 22632.1; // Pressure at 11 km (Pa)
    P = P11 * Math.exp((-g * (h - 11000)) / (R * T));
  } else {
    // Stratosphere lower (20 - 30 km)
    const T20 = 216.65;
    const L20 = -0.001; // Inversion: temp increases
    T = T20 - L20 * (h - 20000);
    const P20 = 5474.9; // Pressure at 20 km (Pa)
    P = P20 * Math.pow(T20 / T, g / (R * (-L20)));
  }

  rho = P / (R * T);
  const a = Math.sqrt(gamma * R * T); // Speed of sound (m/s)

  return { T, P, rho, a, h };
}

// -------------------------------------------------------------
// Shape Drag Database for Wind Tunnel
// -------------------------------------------------------------
interface TestShape {
  id: string;
  nameEn: string;
  nameTr: string;
  cd: number;
  area: number; // m^2
  charLengthM: number; // Length for Reynolds number
  formDragPct: number; // % of drag that is form/pressure drag
  category: 'streamlined' | 'ground' | 'bluff';
}

const WIND_TUNNEL_SHAPES: TestShape[] = [
  { id: 'airfoil', nameEn: 'NACA Streamlined Airfoil', nameTr: 'NACA Damla / Kanat Profili', cd: 0.045, area: 0.50, charLengthM: 1.5, formDragPct: 12, category: 'streamlined' },
  { id: 'sedan', nameEn: 'Passenger Sedan (Aero)', nameTr: 'Binek Otomobil (Sedan)', cd: 0.28, area: 2.20, charLengthM: 4.5, formDragPct: 72, category: 'ground' },
  { id: 'suv', nameEn: 'SUV / Crossover Vehicle', nameTr: 'SUV / Arazi Aracı', cd: 0.38, area: 2.85, charLengthM: 4.8, formDragPct: 80, category: 'ground' },
  { id: 'truck', nameEn: 'Commercial Heavy Truck', nameTr: 'Ağır Ticari Kamyon / Çekici', cd: 0.72, area: 8.50, charLengthM: 12.0, formDragPct: 92, category: 'ground' },
  { id: 'sphere', nameEn: 'Smooth Sphere (Subcritical)', nameTr: 'Pürüzsüz Küre (Kritik Altı)', cd: 0.47, area: 0.785, charLengthM: 1.0, formDragPct: 92, category: 'bluff' },
  { id: 'cube', nameEn: 'Blunt Cube / Flat Face', nameTr: 'Küp / Düz Yüzeyli Gövde', cd: 1.05, area: 1.00, charLengthM: 1.0, formDragPct: 98, category: 'bluff' },
];

// -------------------------------------------------------------
// NACA Airfoil Data
// -------------------------------------------------------------
interface AirfoilPreset {
  id: string;
  name: string;
  cd0: number;
  clMax: number;
  alphaStallDeg: number;
  clAlphaPerDeg: number;
  camberCl0: number;
}

const AIRFOIL_PRESETS: AirfoilPreset[] = [
  { id: 'naca0012', name: 'NACA 0012 (Symmetric, Aerobatic/Rotor)', cd0: 0.008, clMax: 1.55, alphaStallDeg: 15, clAlphaPerDeg: 0.105, camberCl0: 0.0 },
  { id: 'naca2412', name: 'NACA 2412 (General Aviation, Cessna 172)', cd0: 0.009, clMax: 1.62, alphaStallDeg: 16, clAlphaPerDeg: 0.108, camberCl0: 0.24 },
  { id: 'naca4412', name: 'NACA 4412 (High Lift, STOL / Cargo)', cd0: 0.012, clMax: 1.78, alphaStallDeg: 14, clAlphaPerDeg: 0.112, camberCl0: 0.44 },
  { id: 'flatplate', name: 'Flat Plate / Thin Fin (Low Re)', cd0: 0.020, clMax: 1.10, alphaStallDeg: 11, clAlphaPerDeg: 0.090, camberCl0: 0.0 },
];

export default function AerospaceDynamicsSuite() {
  const precision = useGlobalPrecision();
  const language = useI18nStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'flight-envelope' | 'wind-tunnel' | 'airfoil-polar'>('wind-tunnel');

  // Tab 1: Flight Envelope & ISA
  const [altitude, setAltitude] = useState<number>(3000); // meters
  const [velocityKmH, setVelocityKmH] = useState<number>(450); // km/h
  const [wingArea, setWingArea] = useState<number>(35); // m^2
  const [cl, setCl] = useState<number>(0.45); // Lift coefficient
  const [cd, setCd] = useState<number>(0.032); // Drag coefficient

  // Tab 2: Wind Tunnel
  const [tunnelVelocityKmH, setTunnelVelocityKmH] = useState<number>(120); // km/h
  const [tunnelDensity, setTunnelDensity] = useState<number>(1.225); // kg/m^3
  const [selectedShapeId, setSelectedShapeId] = useState<string>('airfoil');
  const [useCustomShape, setUseCustomShape] = useState<boolean>(false);
  const [customCd, setCustomCd] = useState<number>(0.35);
  const [customArea, setCustomArea] = useState<number>(2.0);

  // Tab 3: Airfoil Polars
  const [selectedAirfoilId, setSelectedAirfoilId] = useState<string>('naca2412');
  const [alphaDeg, setAlphaDeg] = useState<number>(4.0); // deg
  const [aspectRatio, setAspectRatio] = useState<number>(7.5);
  const [oswaldEff, setOswaldEff] = useState<number>(0.85);

  // -------------------------------------------------------------
  // Flight Envelope Math
  // -------------------------------------------------------------
  const isa = useMemo(() => calculateISA(altitude), [altitude]);
  const velocityMs = velocityKmH / 3.6;

  const flightForces = useMemo(() => {
    const q = 0.5 * isa.rho * Math.pow(velocityMs, 2);
    const lift = q * wingArea * cl;
    const drag = q * wingArea * cd;
    const mach = velocityMs / (isa.a || 340);
    const l_d_ratio = cl / (cd || 0.001);
    const thrustRequired = drag;
    const powerRequiredKw = (drag * velocityMs) / 1000;
    const powerRequiredHp = powerRequiredKw * 1.34102;

    return {
      q,
      lift,
      drag,
      mach,
      l_d_ratio,
      thrustRequired,
      powerRequiredKw,
      powerRequiredHp,
    };
  }, [isa, velocityMs, wingArea, cl, cd]);

  // -------------------------------------------------------------
  // Wind Tunnel Math
  // -------------------------------------------------------------
  const selectedShape = useMemo(
    () => WIND_TUNNEL_SHAPES.find((s) => s.id === selectedShapeId) || WIND_TUNNEL_SHAPES[0],
    [selectedShapeId]
  );
  const activeCd = useCustomShape ? customCd : selectedShape.cd;
  const activeArea = useCustomShape ? customArea : selectedShape.area;
  const tunnelVelMs = tunnelVelocityKmH / 3.6;

  const tunnelResults = useMemo(() => {
    const q = 0.5 * tunnelDensity * Math.pow(tunnelVelMs, 2);
    const dragForce = q * activeCd * activeArea;
    const dragForceKn = dragForce / 1000;
    const powerKw = (dragForce * tunnelVelMs) / 1000;
    const powerHp = powerKw * 1.34102;
    const dragAreaCdA = activeCd * activeArea;

    // Fluid dynamics calculations:
    const mu = 1.81e-5; // Dynamic viscosity of air at ~20°C (Pa·s)
    const charL = useCustomShape ? Math.sqrt(activeArea) * 1.5 : selectedShape.charLengthM;
    const reynoldsNumber = (tunnelDensity * tunnelVelMs * charL) / mu;

    // Boundary layer thickness at trailing edge delta ~ 0.37 * L / Re^0.2 (turbulent)
    const boundaryLayerMm = (0.37 * charL) / Math.pow(Math.max(1, reynoldsNumber), 0.2) * 1000;

    // Drag breakdown: Form vs Skin friction
    const formPct = useCustomShape ? 75 : selectedShape.formDragPct;
    const frictionPct = 100 - formPct;
    const formDragForceN = dragForce * (formPct / 100);
    const frictionDragForceN = dragForce * (frictionPct / 100);

    // Fuel & energy consumption penalties purely from aero drag over 100 km:
    // EV kWh / 100km = (F_D * 100) / (3600 * 0.90)
    const evKwhPer100Km = (dragForce * 100) / (3600 * 0.90);
    // Gasoline L / 100km = (F_D * 100) / (34200 * 0.30)
    const iceLitersPer100Km = (dragForce * 100) / (34200 * 0.30);

    // Speed sweep points (20 to 220 km/h)
    const speedCurvePoints: { speedKmH: number; dragN: number; powerKw: number }[] = [];
    for (let v = 20; v <= 220; v += 20) {
      const vMs = v / 3.6;
      const vQ = 0.5 * tunnelDensity * Math.pow(vMs, 2);
      const vDrag = vQ * activeCd * activeArea;
      const vPow = (vDrag * vMs) / 1000;
      speedCurvePoints.push({ speedKmH: v, dragN: vDrag, powerKw: vPow });
    }

    // Benchmark comparison across all 6 shapes at current speed:
    const benchmarks = WIND_TUNNEL_SHAPES.map((shp) => {
      const bDrag = q * shp.cd * shp.area;
      const bPower = (bDrag * tunnelVelMs) / 1000;
      const diffPct = ((bDrag - dragForce) / (dragForce || 1)) * 100;
      return {
        ...shp,
        bDrag,
        bPower,
        diffPct,
      };
    });

    return {
      q,
      dragForce,
      dragForceKn,
      powerKw,
      powerHp,
      dragAreaCdA,
      reynoldsNumber,
      boundaryLayerMm,
      formPct,
      frictionPct,
      formDragForceN,
      frictionDragForceN,
      evKwhPer100Km,
      iceLitersPer100Km,
      speedCurvePoints,
      benchmarks,
    };
  }, [tunnelVelMs, tunnelDensity, activeCd, activeArea, useCustomShape, selectedShape]);

  // -------------------------------------------------------------
  // Airfoil Polars Math
  // -------------------------------------------------------------
  const activeAirfoil = useMemo(
    () => AIRFOIL_PRESETS.find((a) => a.id === selectedAirfoilId) || AIRFOIL_PRESETS[1],
    [selectedAirfoilId]
  );

  const airfoilCalc = useMemo(() => {
    const isStalled = alphaDeg >= activeAirfoil.alphaStallDeg;
    let clCurrent: number;
    if (alphaDeg < activeAirfoil.alphaStallDeg) {
      clCurrent = activeAirfoil.camberCl0 + activeAirfoil.clAlphaPerDeg * alphaDeg;
    } else {
      const deltaAlpha = alphaDeg - activeAirfoil.alphaStallDeg;
      clCurrent = activeAirfoil.clMax * Math.exp(-0.15 * deltaAlpha);
    }

    const cdi = (clCurrent * clCurrent) / (Math.PI * aspectRatio * oswaldEff);
    const cdTotal = activeAirfoil.cd0 + cdi + (isStalled ? 0.08 * (alphaDeg - activeAirfoil.alphaStallDeg) : 0);
    const ld = clCurrent / (cdTotal || 0.001);

    const points: { alpha: number; cl: number; cd: number }[] = [];
    for (let a = -4; a <= 20; a += 1) {
      let pCl = 0;
      if (a < activeAirfoil.alphaStallDeg) {
        pCl = activeAirfoil.camberCl0 + activeAirfoil.clAlphaPerDeg * a;
      } else {
        const da = a - activeAirfoil.alphaStallDeg;
        pCl = activeAirfoil.clMax * Math.exp(-0.15 * da);
      }
      const pCdi = (pCl * pCl) / (Math.PI * aspectRatio * oswaldEff);
      const pCd = activeAirfoil.cd0 + pCdi + (a >= activeAirfoil.alphaStallDeg ? 0.08 * (a - activeAirfoil.alphaStallDeg) : 0);
      points.push({ alpha: a, cl: pCl, cd: pCd });
    }

    return {
      clCurrent,
      cdi,
      cdTotal,
      ld,
      isStalled,
      points,
    };
  }, [activeAirfoil, alphaDeg, aspectRatio, oswaldEff]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-0)] text-slate-100 overflow-hidden select-none">
      {/* Top Banner / Suite Navigation */}
      <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-400">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                {t12(language, 'Aerospace & Aerodynamics Suite', 'Havacılık & Aerodinamik Paketi')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                ICAO 7488 / NASA SP-367
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {t12(
                language,
                'Deterministic ISA 1976 flight envelope, 3D wind tunnel drag & NACA airfoil polar solver',
                'Deterministik ISA 1976 uçuş zarfı, 3B rüzgar tüneli sürükleme ve NACA kanat profili çözücü'
              )}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] gap-1">
          <button
            onClick={() => setActiveTab('flight-envelope')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'flight-envelope'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CloudFog className="w-3.5 h-3.5" />
            {t12(language, 'Flight Envelope & ISA', 'Uçuş Zarfı & ISA')}
          </button>
          <button
            onClick={() => setActiveTab('wind-tunnel')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'wind-tunnel'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            {t12(language, 'Wind Tunnel Drag (3D)', 'Rüzgar Tüneli Sürükleme (3B)')}
          </button>
          <button
            onClick={() => setActiveTab('airfoil-polar')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'airfoil-polar'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t12(language, 'NACA Airfoil Polars', 'NACA Kanat Polarları')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="aerospace-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================= */}
        {/* TAB 1: FLIGHT ENVELOPE & ISA 1976                        */}
        {/* ========================================================= */}
        {activeTab === 'flight-envelope' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Controls */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-cyan-400">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Flight State Inputs', 'Uçuş Durumu Girdileri')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Flight Altitude (h)', 'Uçuş İrtifası (h)')}</span>
                      <span className="font-mono text-cyan-400 font-bold">{altitude.toLocaleString()} m ({((altitude * 3.28084) / 1000).toFixed(1)}k ft)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25000}
                      step={250}
                      value={altitude}
                      onChange={(e) => setAltitude(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>0 m (SL)</span>
                      <span>11 km (Tropopause)</span>
                      <span>25 km (Stratosphere)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'True Airspeed (TAS)', 'Gerçek Hava Sürati (TAS)')}</span>
                      <span className="font-mono text-cyan-400 font-bold">{velocityKmH} km/h ({(velocityKmH / 3.6).toFixed(1)} m/s)</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={1200}
                      step={10}
                      value={velocityKmH}
                      onChange={(e) => setVelocityKmH(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Wing Reference Area (S)', 'Kanat Referans Alanı (S)')}</span>
                      <span className="font-mono text-cyan-400 font-bold">{wingArea} m²</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={250}
                      step={1}
                      value={wingArea}
                      onChange={(e) => setWingArea(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Lift Coeff (CL)', 'Taşıma Kat. (CL)')}</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.05}
                        max={2.5}
                        value={cl}
                        onChange={(e) => setCl(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Drag Coeff (CD)', 'Sürükleme Kat. (CD)')}</label>
                      <input
                        type="number"
                        step={0.005}
                        min={0.005}
                        max={0.5}
                        value={cd}
                        onChange={(e) => setCd(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ISA Atmospheric Readout */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-slate-300">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'ISA Atmospheric Layer', 'ISA Atmosfer Katmanı')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Density (ρ)', 'Hava Yoğunluğu (ρ)')}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{isa.rho.toFixed(4)} <span className="text-[10px] text-slate-400">kg/m³</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{((isa.rho / 1.225) * 100).toFixed(1)}% {t12(language, 'of sea level', 'deniz seviyesi')}</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Pressure (P)', 'Statik Basınç (P)')}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{(isa.P / 100).toFixed(1)} <span className="text-[10px] text-slate-400">hPa</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{(isa.P / 1000).toFixed(2)} kPa</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Temperature (T)', 'Sıcaklık (T)')}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{(isa.T - 273.15).toFixed(1)} <span className="text-[10px] text-slate-400">°C</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{isa.T.toFixed(1)} K</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Speed of Sound (a)', 'Ses Hızı (a)')}</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">{isa.a.toFixed(1)} <span className="text-[10px] text-slate-400">m/s</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{(isa.a * 3.6).toFixed(0)} km/h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Flight Telemetry Readout */}
            <div className="lg:col-span-8 space-y-5">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Lift Force (L)', 'Taşıma Kuvveti (L)')}</div>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {(flightForces.lift / 1000).toFixed(1)} <span className="text-sm font-sans text-emerald-500/70">kN</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{flightForces.lift.toFixed(0)} N</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Drag Force (D)', 'Sürükleme (D)')}</div>
                  <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                    {(flightForces.drag / 1000).toFixed(2)} <span className="text-sm font-sans text-rose-500/70">kN</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{flightForces.drag.toFixed(0)} N</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Flight Mach (M)', 'Uçuş Mach Sayısı')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    M {flightForces.mach.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {flightForces.mach < 0.8
                      ? t12(language, 'Subsonic Flow', 'Ses Altı (Subsonik)')
                      : flightForces.mach < 1.2
                      ? t12(language, 'Transonic Flow', 'Transonik Akış')
                      : t12(language, 'Supersonic Flow', 'Ses Üstü (Süpersonik)')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Aero Efficiency (L/D)', 'Aerodinamik Verim (L/D)')}</div>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                    {flightForces.l_d_ratio.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{t12(language, 'Glide Ratio', 'Süzülüş Oranı')}</div>
                </div>
              </div>

              {/* Visual Vector Balance Canvas / Diagram */}
              <div className="relative min-h-[300px] bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-6 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#18202b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex flex-col items-center mb-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold shadow-md">
                      <ArrowUp className="w-3.5 h-3.5" />
                      LIFT: {(flightForces.lift / 1000).toFixed(1)} kN
                    </div>
                    <div className="w-0.5 h-12 bg-emerald-500" />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center">
                      <div className="px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold shadow-md">
                        THRUST: {(flightForces.thrustRequired / 1000).toFixed(2)} kN
                      </div>
                      <div className="w-12 h-0.5 bg-cyan-500" />
                    </div>

                    <div className="w-16 h-16 rounded-full bg-[var(--bg-3)] border-2 border-cyan-500 flex items-center justify-center ">
                      <Plane className="w-8 h-8 text-cyan-400 -rotate-45" />
                    </div>

                    <div className="flex items-center">
                      <div className="w-12 h-0.5 bg-rose-500" />
                      <div className="px-3 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold shadow-md">
                        DRAG: {(flightForces.drag / 1000).toFixed(2)} kN
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mt-2">
                    <div className="w-0.5 h-12 bg-slate-600" />
                    <div className="px-3 py-1 rounded bg-[var(--bg-3)] border border-slate-700 text-slate-400 text-xs font-mono">
                      WEIGHT EQUILIBRIUM: {(flightForces.lift / 1000).toFixed(1)} kN
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-500">
                  Dynamic Pressure q = {flightForces.q.toFixed(0)} Pa | V = {(velocityKmH / 3.6).toFixed(1)} m/s
                </div>
              </div>

              {/* Propulsion Power Demand */}
              <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-950/50 border border-amber-500/40 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wide">
                      {t12(language, 'Engine Propulsion Power Required', 'Gerekli Motor Tahrik Gücü')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t12(language, 'Steady level cruise power: P = D × V', 'Kararlı yatay uçuş için güç ihtiyacı: P = D × V')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-amber-400">
                    {flightForces.powerRequiredKw.toFixed(1)} kW
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {flightForces.powerRequiredHp.toFixed(0)} HP (metric)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: WIND TUNNEL & SHAPE DRAG (3D / EXPERIMENTAL)      */}
        {/* ========================================================= */}
        {activeTab === 'wind-tunnel' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Grid: Controls + 3D Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls Column (4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                {/* Wind Tunnel Atmosphere Inputs */}
                <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-cyan-400">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {t12(language, 'Wind Tunnel Conditions', 'Rüzgar Tüneli Şartları')}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{t12(language, 'Airstream Speed (v)', 'Hava Akış Hızı (v)')}</span>
                        <span className="font-mono text-cyan-400 font-bold">{tunnelVelocityKmH} km/h ({(tunnelVelocityKmH / 3.6).toFixed(1)} m/s)</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={350}
                        step={5}
                        value={tunnelVelocityKmH}
                        onChange={(e) => setTunnelVelocityKmH(Number(e.target.value))}
                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{t12(language, 'Air Density (ρ)', 'Hava Yoğunluğu (ρ)')}</span>
                        <span className="font-mono text-cyan-400 font-bold">{tunnelDensity} kg/m³</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={1.4}
                        step={0.005}
                        value={tunnelDensity}
                        onChange={(e) => setTunnelDensity(Number(e.target.value))}
                        className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>0.80 kg/m³</span>
                        <span>1.225 (Sea Level)</span>
                        <span>1.40 kg/m³</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Object Catalog */}
                <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--line)]">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      {t12(language, 'Test Body Geometry', 'Test Gövde Geometrisi')}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomShape}
                        onChange={(e) => setUseCustomShape(e.target.checked)}
                        className="accent-[var(--cyan)]"
                      />
                      <span>{t12(language, 'Custom', 'Özel')}</span>
                    </label>
                  </div>

                  {!useCustomShape ? (
                    <div className="space-y-2">
                      {WIND_TUNNEL_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => setSelectedShapeId(shape.id)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                            selectedShapeId === shape.id
                              ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-md'
                              : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white hover:border-slate-600'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{language === 'tr' ? shape.nameTr : shape.nameEn}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              A = {shape.area} m² | L = {shape.charLengthM}m
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-cyan-400">Cd: {shape.cd.toFixed(3)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs text-slate-400 font-mono">{t12(language, 'Drag Coefficient (Cd)', 'Sürükleme Katsayısı (Cd)')}</label>
                        <input
                          type="number"
                          step={0.01}
                          value={customCd}
                          onChange={(e) => setCustomCd(Number(e.target.value))}
                          className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-mono">{t12(language, 'Frontal Projected Area (A, m²)', 'Ön İzdüşüm Alanı (A, m²)')}</label>
                        <input
                          type="number"
                          step={0.05}
                          value={customArea}
                          onChange={(e) => setCustomArea(Number(e.target.value))}
                          className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 3D Viewport Column (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* 4 KPI Telemetry Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Aerodynamic Drag Force', 'Aerodinamik Sürükleme')}</div>
                    <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                      {tunnelResults.dragForce < 1000
                        ? `${tunnelResults.dragForce.toFixed(1)} N`
                        : `${tunnelResults.dragForceKn.toFixed(2)} kN`}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">FD = 0.5 · ρ · v² · Cd · A</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Aero Drag Power (kW)', 'Sürükleme Gücü (kW)')}</div>
                    <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                      {tunnelResults.powerKw.toFixed(1)} <span className="text-xs font-sans text-amber-500/70">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{tunnelResults.powerHp.toFixed(0)} metric HP</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Dynamic Pressure (q)', 'Dinamik Basınç (q)')}</div>
                    <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                      {tunnelResults.q.toFixed(0)} <span className="text-xs font-sans text-cyan-500/70">Pa</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{(tunnelResults.q / 1000).toFixed(2)} kPa</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Effective Aero Area (Cd·A)', 'Efektif Direnç Alanı (Cd·A)')}</div>
                    <div className="text-2xl font-mono font-black text-white mt-1">
                      {tunnelResults.dragAreaCdA.toFixed(3)} <span className="text-xs font-sans text-slate-400">m²</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{t12(language, 'Shape Penetration Index', 'Hava Nüfuz İndeksi')}</div>
                  </div>
                </div>

                {/* 3D Interactive Wind Tunnel Viewport */}
                <WindTunnel3DViewport
                  shapeId={selectedShape.id}
                  velocityKmH={tunnelVelocityKmH}
                  density={tunnelDensity}
                  cd={activeCd}
                  area={activeArea}
                  dragForceN={tunnelResults.dragForce}
                  powerKw={tunnelResults.powerKw}
                  qPa={tunnelResults.q}
                />
              </div>
            </div>

            {/* Bottom Comprehensive Engineering Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Card 1: Boundary Layer & Reynolds Physics */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-cyan-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {t12(language, 'Reynolds Number & Flow Regime', 'Reynolds Sayısı & Akış Rejimi')}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      <span className="text-slate-400">Reynolds (Re):</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {(tunnelResults.reynoldsNumber / 1e6).toFixed(2)} × 10⁶
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      <span className="text-slate-400">{t12(language, 'Boundary Regime', 'Sınır Tabaka Rejimi')}:</span>
                      <span className="text-emerald-400 font-bold">
                        {tunnelResults.reynoldsNumber > 5e5 ? t12(language, 'Turbulent BL (Re > 5×10⁵)', 'Türbülanslı ST (Re > 5×10⁵)') : t12(language, 'Laminar BL', 'Laminar ST')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      <span className="text-slate-400">{t12(language, 'Est. BL Thickness (δ99)', 'Tahmini ST Kalınlığı')}:</span>
                      <span className="text-white font-bold">{tunnelResults.boundaryLayerMm.toFixed(1)} mm</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex justify-between">
                    <span>{t12(language, 'Drag Mechanism Distribution', 'Sürükleme Mekanizması Dağılımı')}</span>
                    <span className="text-cyan-400">{tunnelResults.formPct}% Form / {tunnelResults.frictionPct}% Friction</span>
                  </div>
                  <div className="h-3 w-full bg-[var(--bg-3)] rounded-full overflow-hidden flex border border-[var(--line)]">
                    <div className="h-full bg-rose-500" style={{ width: `${tunnelResults.formPct}%` }} title="Form/Pressure Drag" />
                    <div className="h-full bg-cyan-400" style={{ width: `${tunnelResults.frictionPct}%` }} title="Skin Friction Drag" />
                  </div>
                </div>
              </div>

              {/* Card 2: Fuel & Energy Aerodynamic Consumption Penalty */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-amber-400">
                    <Fuel className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {t12(language, 'Aero Drag Fuel / Energy Penalty', 'Aerodinamik Yakıt & Enerji Maliyeti')}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Electric Vehicle (EV) Aero Consumption', 'Elektrikli Araç (EV) Hava Direnci Tüketimi')}</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">
                        {tunnelResults.evKwhPer100Km.toFixed(2)} <span className="text-xs font-sans text-slate-400">kWh / 100 km</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {t12(language, 'At 90% powertrain efficiency', '%90 motor/inverter veriminde')}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                      <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Gasoline Engine (ICE) Aero Consumption', 'İçten Yanmalı (Benzin) Ek Yakıt Tüketimi')}</div>
                      <div className="text-xl font-bold text-amber-400 mt-1">
                        {tunnelResults.iceLitersPer100Km.toFixed(2)} <span className="text-xs font-sans text-slate-400">L / 100 km</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {t12(language, 'At 30% thermal brake efficiency', '%30 termal motor veriminde')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)] text-[10px] text-slate-500 font-mono">
                  {t12(language, 'Aerodynamic drag scales quadratically (v²), meaning energy required per 100km doubles from 80 km/h to 115 km/h.', 'Hava direnci süratle karesel (v²) artar; 80 km/h\'den 115 km/h\'e çıkıldığında 100 km başına harcanan hava direnci enerjisi 2 katına çıkar.')}
                </div>
              </div>

              {/* Card 3: Comparative Shape Drag Benchmark */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-purple-400">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {t12(language, 'Shape Efficiency Benchmark', 'Geometri Verimlilik Kıyaslaması')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tunnelResults.benchmarks.map((bm) => (
                      <div
                        key={bm.id}
                        onClick={() => setSelectedShapeId(bm.id)}
                        className={`p-2 rounded cursor-pointer border flex items-center justify-between text-xs transition-all ${
                          selectedShape.id === bm.id
                            ? 'bg-purple-950/40 border-purple-500/60 text-white font-bold'
                            : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate max-w-[130px]">
                          {language === 'tr' ? bm.nameTr : bm.nameEn}
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-white font-bold">{bm.bPower.toFixed(1)} kW</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">(Cd: {bm.cd.toFixed(2)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)] text-[10px] text-purple-400 font-mono flex items-center justify-between">
                  <span>{t12(language, 'Tap any shape to load directly into 3D chamber', 'Herhangi bir şekle tıklayarak 3B tünele yükleyin')}</span>
                </div>
              </div>
            </div>

            {/* Speed Sweep Interactive SVG Curve (Cubic Power Law) */}
            <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {t12(language, 'Aerodynamic Drag Force & Power vs Speed Curve (Cubic Law: P ∝ v³)', 'Aerodinamik Sürükleme & Güç - Hız Eğrisi (Kübik Yasa: P ∝ v³)')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">
                  {useCustomShape ? 'Custom Body' : (language === 'tr' ? selectedShape.nameTr : selectedShape.nameEn)} | Cd = {activeCd.toFixed(3)}
                </span>
              </div>

              <div className="relative h-60 w-full bg-[var(--bg-0)] rounded-lg border border-[var(--line)] p-4 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="60" y1="20" x2="570" y2="20" stroke="#1f2937" strokeDasharray="3 3" />
                  <line x1="60" y1="70" x2="570" y2="70" stroke="#1f2937" strokeDasharray="3 3" />
                  <line x1="60" y1="120" x2="570" y2="120" stroke="#1f2937" strokeDasharray="3 3" />
                  <line x1="60" y1="170" x2="570" y2="170" stroke="#374151" strokeWidth="1.5" />

                  {/* Curve path for Power (kW) */}
                  {(() => {
                    const maxPower = Math.max(10, tunnelResults.speedCurvePoints[tunnelResults.speedCurvePoints.length - 1].powerKw * 1.15);
                    const pts = tunnelResults.speedCurvePoints.map((pt) => {
                      const x = 60 + ((pt.speedKmH - 20) / (220 - 20)) * 500;
                      const y = 170 - (pt.powerKw / maxPower) * 145;
                      return `${x},${y}`;
                    });
                    return (
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        points={pts.join(' ')}
                      />
                    );
                  })()}

                  {/* Curve path for Drag Force (N) */}
                  {(() => {
                    const maxDrag = Math.max(100, tunnelResults.speedCurvePoints[tunnelResults.speedCurvePoints.length - 1].dragN * 1.15);
                    const pts = tunnelResults.speedCurvePoints.map((pt) => {
                      const x = 60 + ((pt.speedKmH - 20) / (220 - 20)) * 500;
                      const y = 170 - (pt.dragN / maxDrag) * 145;
                      return `${x},${y}`;
                    });
                    return (
                      <polyline
                        fill="none"
                        stroke="#3ad0e6"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        points={pts.join(' ')}
                      />
                    );
                  })()}

                  {/* Current operating point marker */}
                  {(() => {
                    const maxPower = Math.max(10, tunnelResults.speedCurvePoints[tunnelResults.speedCurvePoints.length - 1].powerKw * 1.15);
                    const clampedSpeed = Math.min(220, Math.max(20, tunnelVelocityKmH));
                    const curX = 60 + ((clampedSpeed - 20) / (220 - 20)) * 500;
                    const curY = 170 - (tunnelResults.powerKw / maxPower) * 145;
                    return (
                      <g>
                        <circle cx={curX} cy={curY} r="6" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                        <line x1={curX} y1={curY} x2={curX} y2="170" stroke="#f59e0b" strokeDasharray="2 2" opacity="0.6" />
                      </g>
                    );
                  })()}
                </svg>

                {/* Axis indicators */}
                <div className="absolute bottom-1 left-16 text-[9px] font-mono text-slate-500">20 km/h</div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400">Speed (km/h)</div>
                <div className="absolute bottom-1 right-8 text-[9px] font-mono text-slate-500">220 km/h</div>
                <div className="absolute top-2 left-3 text-[9px] font-mono text-amber-400">Power (kW) [Solid Amber]</div>
                <div className="absolute top-6 left-3 text-[9px] font-mono text-cyan-400">Drag (N) [Dashed Cyan]</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NACA AIRFOIL POLARS & STALL                       */}
        {/* ========================================================= */}
        {activeTab === 'airfoil-polar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Airfoil Controls */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-cyan-400">
                  <Sliders className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Airfoil & Wing Geometry', 'Kanat & Profil Geometrisi')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Airfoil Preset', 'Profil Tipi')}
                    </label>
                    <select
                      value={selectedAirfoilId}
                      onChange={(e) => setSelectedAirfoilId(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                    >
                      {AIRFOIL_PRESETS.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[var(--bg-1)]">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Angle of Attack (α)', 'Hücum Açısı (α)')}</span>
                      <span className={`font-mono font-bold ${airfoilCalc.isStalled ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {alphaDeg.toFixed(1)}° {airfoilCalc.isStalled && `[${t12(language, 'STALL', 'PERDÖVİT')}]`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={20}
                      step={0.5}
                      value={alphaDeg}
                      onChange={(e) => setAlphaDeg(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>-4°</span>
                      <span>0°</span>
                      <span>Stall ~ {activeAirfoil.alphaStallDeg}°</span>
                      <span>+20°</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Wing Aspect Ratio (AR = b²/S)', 'Açıklık Oranı (AR)')}</span>
                      <span className="font-mono text-cyan-400 font-bold">{aspectRatio.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={20}
                      step={0.5}
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>3.0 (Fighter)</span>
                      <span>7.5 (GA)</span>
                      <span>20.0 (Glider)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Oswald Efficiency Factor (e)', 'Oswald Verim Faktörü (e)')}</span>
                      <span className="font-mono text-cyan-400 font-bold">{oswaldEff.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.65}
                      max={0.98}
                      step={0.01}
                      value={oswaldEff}
                      onChange={(e) => setOswaldEff(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Airfoil Polar Curves & Readout */}
            <div className="lg:col-span-8 space-y-5">
              {/* Polar KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Lift Coeff (CL)', 'Taşıma Kat. (CL)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${airfoilCalc.isStalled ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {airfoilCalc.clCurrent.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">CL(max) = {activeAirfoil.clMax.toFixed(2)}</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Total Drag Coeff (CD)', 'Toplam Sürükleme (CD)')}</div>
                  <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                    {airfoilCalc.cdTotal.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">CD0 + CDi (Induced)</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Induced Drag (CDi)', 'İndüklenmiş Sürükleme')}</div>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                    {airfoilCalc.cdi.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{((airfoilCalc.cdi / airfoilCalc.cdTotal) * 100).toFixed(0)}% of total CD</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Lift-to-Drag (L/D)', 'Taşıma/Sürükleme (L/D)')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {airfoilCalc.ld.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{t12(language, 'Aerodynamic Quality', 'Aerodinamik Kalite')}</div>
                </div>
              </div>

              {/* Stall Warning Banner if active */}
              {airfoilCalc.isStalled && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {t12(language, 'AERODYNAMIC STALL WARNING (CL CLIFF)', 'AERODİNAMİK PERDÖVİT UYARISI (AKIM AYRILMASI)')}
                    </div>
                    <div className="text-[11px] text-rose-400/80">
                      {t12(
                        language,
                        `Angle of attack ${alphaDeg}° exceeds stall limit (${activeAirfoil.alphaStallDeg}°). Boundary layer flow separation causes severe lift collapse and massive profile drag increase.`,
                        `Hücum açısı ${alphaDeg}°, perdövit sınırını (${activeAirfoil.alphaStallDeg}°) aştı. Sınır tabaka akım ayrılması nedeniyle taşıma aniden çöker ve profil sürüklemesi katlanır.`
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SVG Polar Curve Plot */}
              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4 flex justify-between items-center">
                  <span>{t12(language, 'Lift Coefficient vs Angle of Attack [CL - α Curve]', 'Taşıma Katsayısı - Hücum Açısı Eğrisi [CL - α]')}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">NASA SP-367 Wind Tunnel Database</span>
                </div>

                <div className="relative h-64 w-full bg-[var(--bg-0)] rounded-lg border border-[var(--line)] p-4 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="50" y1="20" x2="480" y2="20" stroke="#1f2937" strokeDasharray="3 3" />
                    <line x1="50" y1="70" x2="480" y2="70" stroke="#1f2937" strokeDasharray="3 3" />
                    <line x1="50" y1="120" x2="480" y2="120" stroke="#1f2937" strokeDasharray="3 3" />
                    <line x1="50" y1="170" x2="480" y2="170" stroke="#1f2937" strokeDasharray="3 3" />

                    {/* Zero CL line */}
                    <line x1="50" y1="180" x2="480" y2="180" stroke="#374151" strokeWidth="1.5" />

                    {/* Curve Path */}
                    {(() => {
                      const points = airfoilCalc.points.map((pt) => {
                        const x = 60 + ((pt.alpha - -4) / (20 - -4)) * 400;
                        const y = 180 - (pt.cl / 2.0) * 150;
                        return `${x},${y}`;
                      });
                      return (
                        <polyline
                          fill="none"
                          stroke="#3ad0e6"
                          strokeWidth="2.5"
                          points={points.join(' ')}
                        />
                      );
                    })()}

                    {/* Current Alpha Marker */}
                    {(() => {
                      const markerX = 60 + ((alphaDeg - -4) / (20 - -4)) * 400;
                      const markerY = 180 - (airfoilCalc.clCurrent / 2.0) * 150;
                      return (
                        <g>
                          <circle cx={markerX} cy={markerY} r="6" fill={airfoilCalc.isStalled ? '#f43f5e' : '#10b981'} stroke="#fff" strokeWidth="2" />
                          <line x1={markerX} y1={markerY} x2={markerX} y2="180" stroke="#10b981" strokeDasharray="2 2" />
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Axis Labels */}
                  <div className="absolute bottom-1 left-16 text-[9px] font-mono text-slate-500">α = -4°</div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">α = +8°</div>
                  <div className="absolute bottom-1 right-8 text-[9px] font-mono text-slate-500">α = +20°</div>
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400">CL = 2.0</div>
                  <div className="absolute bottom-6 left-2 text-[9px] font-mono text-slate-400">CL = 0.0</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

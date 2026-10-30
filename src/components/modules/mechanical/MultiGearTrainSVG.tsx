'use client';

import React, { useMemo, useState } from 'react';
import { GearCalculatedData, ShaftLayoutInfo } from '@/data/gearTrainEngine';
import { Play, Pause, RotateCw, RotateCcw, Ruler, Eye, Gauge, Compass, Activity, Hand, Download } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import {
  generateExternalGearContour,
  generateInternalGearContour,
  pointsToSvgPath,
  downloadGearProductionSvg,
  helixFaceTwistDeg,
  helixHandLabel,
  calculateInvoluteGearSpecs,
} from '@/engines/math/gear-involute-factory';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface MultiGearTrainSVGProps {
  gears: GearCalculatedData[];
  shafts: ShaftLayoutInfo[];
  selectedGearId: string;
  onSelectGear: (id: string) => void;
  viewMode?: 'both' | 'front' | 'top_section';
  isPrint?: boolean;
}

// Generate external spur/helical gear profile (ISO 53 / DIN 3960 True Involute)
function generateGearPath(cx: number, cy: number, _rRef: number, teeth: number, m: number, x: number = 0, helixAngle: number = 0, pressureAngle: number = 20, rotationAngle = 0) {
  const points = generateExternalGearContour({
    module: m,
    teeth: Math.max(4, Math.round(teeth)),
    profileShift: x,
    helixAngle,
    pressureAngle,
    rotationAngle,
    center: { x: cx, y: cy },
    pointsPerFlank: 8,
  });
  return pointsToSvgPath(points);
}

// Generate internal ring gear profile (annular ring with internal teeth)
function generateRingGearPath(cx: number, cy: number, rRef: number, teeth: number, m: number, rOuter: number) {
  const rimThick = Math.max(8, rOuter - (rRef + m * 1.25));
  const { innerTeethContour, outerRimContour } = generateInternalGearContour({
    module: m,
    teeth: Math.max(8, Math.round(teeth)),
    center: { x: cx, y: cy },
    isInternal: true,
    rimThickness: rimThick,
    pointsPerFlank: 8,
  });
  return pointsToSvgPath(innerTeethContour) + ' ' + pointsToSvgPath(outerRimContour);
}

export function MultiGearTrainSVG({
  gears,
  shafts,
  selectedGearId,
  onSelectGear,
  viewMode = 'both',
  isPrint = false,
}: MultiGearTrainSVGProps) {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isReversed, setIsReversed] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showContactLines, setShowContactLines] = useState(true);

  const kinetic = useKineticSpin({
    mode: 'circular',
    nominalSpeedDegPerSec: 45,
    autoPlay: isPlaying,
    dragSensitivity: 1.0,
    wheelSensitivity: 0.003,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. UNIFIED KINEMATIC & GEOMETRIC LAYOUT COMPUTATION
  // ════════════════════════════════════════════════════════════════════════════
  const layout = useMemo(() => {
    if (!gears || gears.length === 0) {
      return {
        width: 860,
        height: 640,
        frontCy: 140,
        sectionStartY: 360,
        gearCoords: [],
        topSectionGears: [],
      };
    }

    const maxDiameter = Math.max(
      ...gears.map((g) => (g.gearType === 'planetary_stage' ? g.module * (g.ringTeeth || 70) * 1.25 : g.da))
    );
    const scale = Math.min(0.9, 130 / Math.max(100, maxDiameter));

    const frontCy = 145;
    const getGearOuterRadius = (g: GearCalculatedData) => {
      if (g.gearType === 'planetary_stage') {
        const zr = g.ringTeeth || (g.teeth + 2 * (g.planetTeeth || 25));
        return (zr * g.module * 0.5 + g.module * 2.2) * scale;
      }
      return (g.da / 2) * scale;
    };

    let currentX = 80;
    const gearCoords: {
      id: string;
      gear: GearCalculatedData;
      cx: number;
      cy: number;
      r: number;
      scale: number;
    }[] = [];

    for (let i = 0; i < gears.length; i++) {
      const g = gears[i];
      const rOuter = getGearOuterRadius(g);

      let cx = currentX;

      if (i === 0) {
        cx = 75 + rOuter;
        currentX = cx;
      } else {
        const prev = gears[i - 1];
        const prevCoord = gearCoords[i - 1];
        const prevROuter = getGearOuterRadius(prev);

        if (g.isCoaxial) {
          cx = prevCoord.cx;
        } else if (g.gearType === 'planetary_stage' || prev.gearType === 'planetary_stage') {
          // Planetary stages connect in series in-line: enforce complete visual casing clearance
          cx = prevCoord.cx + prevROuter + rOuter + 45;
        } else if (g.gearType === 'internal') {
          const rPinion = (prev.d / 2) * scale;
          const rRing = (g.d / 2) * scale;
          const a_scaled = rRing - rPinion;
          cx = prevCoord.cx + a_scaled;
        } else if (prev.gearType === 'internal') {
          cx = prevCoord.cx + prevROuter + rOuter + 20;
        } else {
          // Standard external gear pair: exact pitch circle contact
          const rPrevPitch = (prev.d / 2) * scale;
          const rPitch = (g.d / 2) * scale;
          cx = prevCoord.cx + rPrevPitch + rPitch;
        }
      }

      currentX = cx;
      gearCoords.push({
        id: g.id,
        gear: g,
        cx,
        cy: frontCy,
        r: rOuter,
        scale,
      });
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 2. 1:1 ORTHOGRAPHIC TOP SECTION PROJECTION (ÜSTTEN KESİT GÖRÜNÜŞÜ)
    // Direct 1-to-1 vertical projection from Front View without shafts
    // ════════════════════════════════════════════════════════════════════════════
    const sectionStartY = viewMode === 'both' ? 330 : 60;
    const layerHeight = 36;
    const layerGap = 16;
    
    // Group gears into axial layers (stages)
    // Stage 1 gears are at layer 0. Coaxial gears step to layer 1, etc.
    let currentAxialLayer = 0;
    const topSectionGears: {
      id: string;
      gear: GearCalculatedData;
      cx: number;            // Exactly same X as front view!
      r: number;             // Tip radius matching front view!
      rp: number;            // Pitch radius
      rf: number;            // Root radius
      axialLayer: number;
      y: number;             // Top view Y position
      height: number;        // Face width visual height
      faceWidth: number;
    }[] = [];

    for (let i = 0; i < gearCoords.length; i++) {
      const gc = gearCoords[i];
      const g = gc.gear;
      
      if (i > 0 && g.isCoaxial) {
        currentAxialLayer += 1;
      }
      
      const bVis = Math.max(22, Math.min(50, (g.faceWidth || 25) * 0.9));
      const y = sectionStartY + currentAxialLayer * (layerHeight + layerGap);
      const rp = (g.d / 2) * scale;
      const rf = (g.df / 2) * scale;
      
      topSectionGears.push({
        id: g.id,
        gear: g,
        cx: gc.cx,
        r: gc.r,
        rp,
        rf,
        axialLayer: currentAxialLayer,
        y,
        height: bVis,
        faceWidth: g.faceWidth,
      });
    }

    const maxLayer = Math.max(...topSectionGears.map((g) => g.axialLayer), 0);
    const maxSectionY = sectionStartY + (maxLayer + 1) * (layerHeight + layerGap) + 50;

    const totalWidth = Math.max(860, ...gearCoords.map((g) => g.cx + g.r + 70));
    const totalHeight = viewMode === 'front' ? 300 : maxSectionY;

    return {
      width: totalWidth,
      height: totalHeight,
      frontCy,
      sectionStartY,
      gearCoords,
      topSectionGears,
    };
  }, [gears, viewMode]);

  return (
    <div
      {...kinetic.containerProps}
      className="w-full h-full relative select-none bg-[var(--bg-0)] rounded-2xl overflow-hidden border border-cyan-500/20"
      title={t12(language, '🖱️ Push / Drag to Spin • Wheel to accelerate & reverse • Double-click to reset', '🖱️ Elinle İttir / Sürükle • Fare tekeri ile hızlandır & yön değiştir • Çift tıkla sıfırla')}
    >
      {/* Interactive Controls Overlay HUD */}
      {!isPrint && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[var(--bg-1)]/90 p-1.5 rounded-xl border border-white/10 text-[10px] font-mono shadow-xl">
          {/* Tactile Motion Indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-bold text-[9px]">
            <Hand size={11} className={kinetic.isDragging ? 'text-amber-400 animate-bounce' : 'text-cyan-400'} />
            <span>{t12(language, 'PUSH & SPIN', 'İTTİR / DÖNDÜR')}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className={`p-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
              isPlaying
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isPlaying ? (t12(language, 'Pause', 'Durdur')) : (t12(language, 'Play', 'Oynat'))}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span className="hidden sm:inline">{isPlaying ? (t12(language, 'PAUSE', 'DURDUR')) : (t12(language, 'PLAY', 'OYNAT'))}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const speeds = [0.25, 0.5, 1.0, 2.0, 4.0];
              const curAbs = Math.abs(kinetic.speedMultiplier);
              const closestIdx = speeds.reduce((best, s, idx) => Math.abs(s - curAbs) < Math.abs(speeds[best] - curAbs) ? idx : best, 0);
              const nextSpeed = speeds[(closestIdx + 1) % speeds.length];
              kinetic.setMultiplier(nextSpeed * (isReversed ? -1 : 1));
            }}
            className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 font-bold border border-white/5 flex items-center gap-1"
            title={t12(language, 'Change Animation Speed (Also scroll wheel)', 'Animasyon Hızını Değiştir (Fare tekerleğiyle de ayarlanabilir)')}
          >
            <Gauge size={11} />
            <span>{formatEngineeringValue(Math.abs(kinetic.speedMultiplier), precision, false)}x</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsReversed(!isReversed);
              kinetic.toggleDirection();
            }}
            className={`p-1.5 rounded-lg border border-white/5 transition-all ${
              kinetic.direction === -1 ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
            title={t12(language, 'Reverse Rotation Direction', 'Dönme Yönünü Tersine Çevir')}
          >
            {kinetic.direction === -1 ? <RotateCcw size={12} /> : <RotateCw size={12} />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowContactLines(!showContactLines);
            }}
            className={`p-1.5 rounded-lg border border-white/5 transition-all ${
              showContactLines ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
            title={t12(language, 'Toggle Line of Action & Contact Points', 'Kavrama Doğrusu & Temas Noktalarını Aç/Kapat')}
          >
            <Activity size={12} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDimensions(!showDimensions);
            }}
            className={`p-1.5 rounded-lg border border-white/5 transition-all ${
              showDimensions ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
            title={t12(language, 'Toggle Dimensions', 'Ölçülendirme Çizgilerini Aç/Kapat')}
          >
            <Ruler size={12} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const selGear = gears.find((g) => g.id === selectedGearId) || gears[0];
              if (selGear) {
                downloadGearProductionSvg({
                  module: selGear.module,
                  teeth: selGear.teeth,
                  helixAngle: selGear.helixAngle || 0,
                  pressureAngle: 20,
                  profileShift: selGear.profileShift || 0,
                  faceWidth: selGear.faceWidth || 20,
                  boreDiameter: selGear.minShaftDiameter || 25,
                  isInternal: selGear.gearType === 'internal',
                  hasKeyway: selGear.gearType !== 'internal',
                }, `${selGear.name.replace(/\s+/g, '_')}_1to1_CAM.svg`, {
                  customTitle: `${selGear.name} z=${selGear.teeth} mn=${selGear.module} β=${selGear.helixAngle || 0}° ${helixHandLabel(selGear.helixAngle || 0)}`,
                  material: selGear.material,
                });
              }
            }}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all"
            title={t12(language, 'Download 1:1 Production SVG for Selected Gear', 'Seçili Dişlinin 1:1 Üretim SVG Dosyasını İndir')}
          >
            <Download size={11} />
            <span>1:1 SVG</span>
          </button>
        </div>
      )}

      <svg
        viewBox={'0 0 ' + layout.width + ' ' + layout.height}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Technical Section Hatching Patterns */}
          <pattern id="secHatchBlue" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#38bdf8" strokeWidth="1" opacity="0.45" />
          </pattern>

          <pattern id="secHatchSelected" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#00e5ff" strokeWidth="1.5" opacity="0.85" />
          </pattern>

          {/* Gradients */}
          <linearGradient id="unPinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="unWheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          <linearGradient id="unCoaxialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="unPlanetaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>

          <linearGradient id="unShaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Glowing Filters */}
          <filter id="unSelGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="unErrorGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
          .gear-elem:hover { filter: brightness(1.25) drop-shadow(0 0 8px rgba(0, 229, 255, 0.6)); cursor: pointer; }
        `}</style>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TOP ZONE: 1. ÖNDEN KİNEMATİK GÖRÜNÜŞ (FRONT KINEMATIC VIEW)       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {(viewMode === 'both' || viewMode === 'front') && (
          <g id="front-view-group">
            {/* Front View Title Header */}
            <g transform="translate(20, 24)">
              <rect x="0" y="-14" width="220" height="20" rx="4" fill="rgba(0, 229, 255, 0.08)" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.8" />
              <text x="8" y="0" fill="#00e5ff" fontSize="9.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                {t12(language, '1. FRONT KINEMATIC VIEW (Front)', '1. ÖNDEN KİNEMATİK GÖRÜNÜŞ (Front)')}
              </text>
            </g>

            {/* Global Impossible Design Banner if any gear has critical error */}
            {layout.gearCoords.some((c) => c.gear.isImpossible) && (
              <g transform="translate(250, 24)">
                <rect x="0" y="-14" width="370" height="20" rx="4" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1" />
                <text x="10" y="0" fill="#fca5a5" fontSize="9" fontWeight="bold" fontFamily="ui-monospace, monospace">
                  {t12(language, '🚨 IMPOSSIBLE DESIGN (Geometric/Physical Clash)', '🚨 BU TASARIM İMKANSIZDIR (Geometrik/Fiziksel Hata)')}
                </text>
              </g>
            )}

            {/* Continuous Centerline */}
            {layout.gearCoords.length > 1 && (
              <line
                x1={layout.gearCoords[0].cx - 40}
                y1={layout.frontCy}
                x2={layout.gearCoords[layout.gearCoords.length - 1].cx + 60}
                y2={layout.frontCy}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="8,4,2,4"
                opacity={0.35}
              />
            )}

            {/* Center Distance Dimension Lines between Meshing Stages */}
            {showDimensions && layout.gearCoords.map((coord, idx) => {
              if (idx === 0) return null;
              const prev = layout.gearCoords[idx - 1];
              if (coord.gear.isCoaxial) return null;
              const midX = (prev.cx + coord.cx) / 2;
              const dimY = 52 + (idx % 2) * 20;
              const isPlanetaryConn = coord.gear.gearType === 'planetary_stage' || prev.gear.gearType === 'planetary_stage';

              if (isPlanetaryConn) {
                const isPlanetTarget = coord.gear.gearType === 'planetary_stage';
                const pGear = isPlanetTarget ? coord.gear : prev.gear;
                const pMode = pGear.planetaryMode || 'fixed_ring_carrier_out';

                const isSunIn = pMode === 'fixed_ring_carrier_out' || pMode === 'fixed_carrier_ring_out';
                const isRingIn = pMode === 'fixed_sun_carrier_out' || pMode === 'fixed_carrier_sun_out';
                const isCarrierIn = pMode === 'fixed_ring_sun_out' || pMode === 'fixed_sun_ring_out';

                const zs = pGear.teeth;
                const zp = pGear.planetTeeth || 25;
                const zr = pGear.ringTeeth || (zs + 2 * zp);
                const scale = coord.scale;
                const rs = (zs * pGear.module * 0.5) * scale;
                const rp = (zp * pGear.module * 0.5) * scale;
                const rr = (zr * pGear.module * 0.5 + pGear.module * scale * 2.2);
                const rCarrier = rs + rp;

                const linkTargetX = isPlanetTarget
                  ? isSunIn
                    ? coord.cx - rs - 2
                    : isRingIn
                      ? coord.cx - rr
                      : coord.cx - rCarrier
                  : coord.cx - coord.r - 4;

                const linkColor = isSunIn ? '#38bdf8' : isRingIn ? '#c084fc' : '#34d399';
                const linkBadge = isSunIn
                  ? t12(language, '➔ Sun Shaft Input', '➔ Güneş Dişliye Giriş (Sun Input)')
                  : isRingIn
                    ? t12(language, '➔ Outer Ring Input', '➔ Dış Yüzükten Giriş (Ring Input)')
                    : t12(language, '➔ Carrier Input', '➔ Taşıyıcıya Giriş (Carrier Input)');

                return (
                  <g key={'dim-a-' + idx} opacity={0.95}>
                    {/* Shaft link line on the axis */}
                    <line
                      x1={prev.cx + prev.r + 4}
                      y1={layout.frontCy}
                      x2={linkTargetX}
                      y2={layout.frontCy}
                      stroke={linkColor}
                      strokeWidth="2.2"
                      strokeDasharray="6,3"
                    />
                    <polygon
                      points={`${linkTargetX},${layout.frontCy} ${linkTargetX - 7},${layout.frontCy - 4.5} ${linkTargetX - 7},${layout.frontCy + 4.5}`}
                      fill={linkColor}
                    />

                    {/* Port Input Node Pulsing */}
                    <circle cx={linkTargetX} cy={layout.frontCy} r="4.5" fill={linkColor} filter="url(#unSelGlow)" />

                    {/* Header badge */}
                    <g transform={'translate(' + midX + ', ' + dimY + ')'}>
                      <rect x="-68" y="-9" width="136" height="18" rx="4" fill="#03070d" stroke={linkColor} strokeWidth="1" />
                      <text x="0" y="3.5" textAnchor="middle" fill={linkColor} fontSize="7.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        {linkBadge}
                      </text>
                    </g>
                  </g>
                );
              }

              const a_mm = coord.gear.gearType === 'internal'
                ? (coord.gear.module * Math.abs(coord.gear.teeth - prev.gear.teeth)) / 2
                : (coord.gear.module * (prev.gear.teeth + coord.gear.teeth)) / 2;

              return (
                <g key={'dim-a-' + idx} opacity={0.85}>
                  <line x1={prev.cx} y1={layout.frontCy - prev.r - 4} x2={prev.cx} y2={dimY - 6} stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="3 3" opacity={0.4} />
                  <line x1={coord.cx} y1={layout.frontCy - coord.r - 4} x2={coord.cx} y2={dimY - 6} stroke="#38bdf8" strokeWidth="0.7" strokeDasharray="3 3" opacity={0.4} />
                  <line x1={prev.cx + 2} y1={dimY} x2={coord.cx - 2} y2={dimY} stroke="#38bdf8" strokeWidth="1" />
                  <rect x={midX - 36} y={dimY - 8} width={72} height={16} rx="3" fill="#03070d" stroke="rgba(56,189,248,0.35)" strokeWidth="0.8" />
                  <text x={midX} y={dimY + 3.5} textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="ui-monospace, monospace" fontWeight="bold">
                    a = {formatEngineeringValue(a_mm, precision, false)} mm
                  </text>
                </g>
              );
            })}

            {/* Live Mesh Contact Points & Line of Action (Kavrama Doğrusu) */}
            {showContactLines && layout.gearCoords.map((coord, idx) => {
              if (idx === 0) return null;
              const prev = layout.gearCoords[idx - 1];
              if (coord.gear.isCoaxial) return null;
              if (coord.gear.gearType === 'planetary_stage' || prev.gear.gearType === 'planetary_stage') return null;

              const meshX = coord.gear.gearType === 'internal'
                ? coord.cx - coord.r
                : (prev.cx * coord.r + coord.cx * prev.r) / (prev.r + coord.r);
              const meshY = layout.frontCy;

              const alphaRad = (20 * Math.PI) / 180;
              const lineLen = Math.min(38, (prev.r + coord.r) * 0.32);
              const dx = Math.sin(alphaRad) * lineLen;
              const dy = Math.cos(alphaRad) * lineLen;

              return (
                <g key={'mesh-pt-' + idx} pointerEvents="none">
                  {/* Line of Action */}
                  <line
                    x1={meshX - dx}
                    y1={meshY - dy}
                    x2={meshX + dx}
                    y2={meshY + dy}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                    opacity={0.8}
                  />

                  {/* Pulsing Pitch Contact Point */}
                  <circle cx={meshX} cy={meshY} r="3" fill="#10b981" filter="url(#unSelGlow)" />
                  <circle cx={meshX} cy={meshY} r="6" fill="none" stroke="#10b981" strokeWidth="0.8" opacity={0.6} />

                  {/* Transverse Contact Ratio Badge */}
                    <g transform={'translate(' + meshX + ', ' + (meshY - 20) + ')'}>
                    <rect x="-24" y="-6" width="48" height="12" rx="2" fill="#040810" stroke="#10b981" strokeWidth="0.6" />
                    <text x="0" y="2.5" textAnchor="middle" fill="#34d399" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                      {'εα=' + (coord.gear.transverseContactRatio || 1.6).toFixed(2)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Render Each Gear in Front View */}
            {layout.gearCoords.map((coord, idx) => {
              const { gear, cx, cy, r, scale } = coord;
              const isSelected = selectedGearId === gear.id;
              const isDriver = idx === 0;
              const isCoaxial = gear.isCoaxial;
              const isPlanetary = gear.gearType === 'planetary_stage';
              const isInternal = gear.gearType === 'internal';

              const driverRpm = layout.gearCoords[0]?.gear.rpm || 1450;
              const effectiveSign = isReversed ? -1 : 1;
              const ratioFactor = gear.rpm > 0 ? (gear.rpm / driverRpm) : 1;
              const gearAngle = (kinetic.angle * ratioFactor * (gear.rotationDir === 'cw' ? 1 : -1) * effectiveSign) % 360;

              const animStyle = isPlaying && !isPrint
                ? {
                    transformOrigin: `${cx}px ${cy}px`,
                    transformBox: 'view-box' as const,
                    transform: `rotate(${gearAngle.toFixed(2)}deg)`,
                  }
                : {};

              if (isPlanetary) {
                // ─── INTEGRATED PLANETARY STAGE ───
                const zs = gear.teeth;
                const zp = gear.planetTeeth || 25;
                const zr = gear.ringTeeth || 70;
                const rs = (zs * gear.module * 0.5) * scale;
                const rp = (zp * gear.module * 0.5) * scale;
                const rr = (zr * gear.module * 0.5) * scale;
                const rCarrier = rs + rp;

                const sunPath = generateGearPath(cx, cy, rs, zs, gear.module * scale, 0);
                const ringPath = generateRingGearPath(cx, cy, rr, zr, gear.module * scale, rr + gear.module * scale * 2.2);
                const ringInitRot = (180 / zr);

                return (
                  <g key={'front-' + gear.id} className="gear-elem transition-all" onClick={() => onSelectGear(gear.id)}>
                    {/* Fixed Outer Ring Gear Casing */}
                    <g transform={ringInitRot !== 0 ? 'rotate(' + ringInitRot + ', ' + cx + ', ' + cy + ')' : undefined}>
                      <path
                        d={ringPath}
                        fill="url(#unWheelGrad)"
                        stroke={isSelected ? '#00e5ff' : '#a855f7'}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        fillRule="evenodd"
                        opacity={0.88}
                        filter={isSelected ? 'url(#unSelGlow)' : undefined}
                      />
                    </g>

                    {/* Orbiting Carrier & 3 Planet Pinions */}
                    <g style={animStyle}>
                      <circle cx={cx} cy={cy} r={rCarrier} fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="4,3" opacity={0.6} />

                      {[0, 120, 240].map((deg, pIdx) => {
                        const rad = (deg * Math.PI) / 180;
                        const px = cx + Math.cos(rad) * rCarrier;
                        const py = cy + Math.sin(rad) * rCarrier;
                        const planetTeethCount = Math.min(24, zp);
                        const planetPath = generateGearPath(px, py, rp, planetTeethCount, gear.module * scale, 0);
                        const planetInitRot = (180 / planetTeethCount);
                        return (
                          <g key={'planet-pin-' + pIdx} transform={'rotate(' + planetInitRot + ', ' + px + ', ' + py + ')'}>
                            <path d={planetPath} fill="url(#unPlanetaryGrad)" stroke="#10b981" strokeWidth="1" />
                            <circle cx={px} cy={py} r={Math.max(3.5, rp * 0.25)} fill="#03060a" stroke="#10b981" strokeWidth="1" />
                          </g>
                        );
                      })}

                      {/* Carrier Hub & Central Output Shaft */}
                      <circle cx={cx} cy={cy} r={Math.max(6, rs * 0.35)} fill="#03060a" stroke="#34d399" strokeWidth="2" />
                    </g>

                    {/* Central Sun Gear (Driven by Input) */}
                    <g style={
                      isPlaying && !isPrint
                        ? {
                            transformOrigin: `${cx}px ${cy}px`,
                            transformBox: 'view-box' as const,
                            transform: `rotate(${((gearAngle * 2.5) % 360).toFixed(2)}deg)`,
                          }
                        : {}
                    }>
                      <path d={sunPath} fill="url(#unPinionGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                      <circle cx={cx} cy={cy} r={Math.max(3.5, rs * 0.25)} fill="#03060a" stroke="#38bdf8" strokeWidth="1" />
                    </g>

                    {/* Component Callout Badges */}
                    {/* 1. Ring Casing Tag */}
                    <g transform={'translate(' + cx + ', ' + (cy - rr - 14) + ')'} pointerEvents="none">
                      <rect x="-42" y="-7" width="84" height="14" rx="3" fill="#080c14" stroke="#a855f7" strokeWidth="0.8" opacity="0.9" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#c084fc" fontSize="6.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        {'⭕ Halka / Ring (z=' + zr + ')'}
                      </text>
                    </g>

                    {/* 2. Sun Gear Tag */}
                    <g transform={'translate(' + (cx - rs - 28) + ', ' + (cy - rs - 6) + ')'} pointerEvents="none">
                      <rect x="-38" y="-7" width="76" height="14" rx="3" fill="#080c14" stroke="#38bdf8" strokeWidth="0.8" opacity="0.9" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        {'☀️ Güneş (z=' + zs + ')'}
                      </text>
                    </g>

                    {/* 3. Planet Pinions Tag */}
                    <g transform={'translate(' + (cx + rCarrier + 22) + ', ' + (cy - rp) + ')'} pointerEvents="none">
                      <rect x="-44" y="-7" width="88" height="14" rx="3" fill="#080c14" stroke="#10b981" strokeWidth="0.8" opacity="0.9" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#34d399" fontSize="6.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        {'🪐 ' + (gear.numPlanets || 3) + 'x Planet (z=' + zp + ')'}
                      </text>
                    </g>

                    {/* Main Stage Label & Ratio */}
                    <g transform={'translate(' + cx + ', ' + (cy + rr + 26) + ')'}>
                      <rect x="-56" y="-9" width="112" height="28" rx="4" fill="#080c14" stroke={isSelected ? '#00e5ff' : 'rgba(255,255,255,0.15)'} strokeWidth={isSelected ? 1.5 : 0.8} />
                      <text x="0" y="2" textAnchor="middle" fill={isSelected ? '#00e5ff' : '#a855f7'} fontSize="8.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                        {gear.name}
                      </text>
                      <text x="0" y="13" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="7" fontFamily="ui-monospace, monospace">
                        {'i=' + (gear.stageRatio || 4.5).toFixed(1) + ':1 · ' + Math.round(gear.rpm) + ' RPM'}
                      </text>
                    </g>
                  </g>
                );
              }

              if (isInternal) {
                // ─── NESTED INTERNAL RING GEAR ───
                const rOuter = r + gear.module * scale * 2.5;
                const ringPath = generateRingGearPath(cx, cy, r, gear.teeth, gear.module * scale, rOuter);
                const initRingRot = (180 / gear.teeth);

                return (
                  <g key={'front-' + gear.id} className="gear-elem transition-all" onClick={() => onSelectGear(gear.id)}>
                    <g transform={initRingRot !== 0 ? 'rotate(' + initRingRot + ', ' + cx + ', ' + cy + ')' : undefined}>
                      <g style={animStyle}>
                        <path
                          d={ringPath}
                          fill="url(#unWheelGrad)"
                          stroke={isSelected ? '#00e5ff' : '#c084fc'}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                          fillRule="evenodd"
                          filter={isSelected ? 'url(#unSelGlow)' : undefined}
                        />
                      </g>
                    </g>

                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="4,2" opacity={0.6} />

                    <g transform={'translate(' + cx + ', ' + (cy + rOuter + 22) + ')'}>
                      <rect x="-48" y="-9" width="96" height="26" rx="4" fill="#080c14" stroke={isSelected ? '#00e5ff' : 'rgba(255,255,255,0.12)'} strokeWidth={isSelected ? 1.5 : 0.8} />
                      <text x="0" y="2" textAnchor="middle" fill={isSelected ? '#00e5ff' : '#c084fc'} fontSize="8.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                        {gear.name}
                      </text>
                      <text x="0" y="12" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="ui-monospace, monospace">
                        {'z=' + gear.teeth + ' · ' + Math.round(gear.rpm) + ' RPM' + (Math.abs(gear.helixAngle || 0) > 0.05 ? ' · β=' + gear.helixAngle + '° ' + helixHandLabel(gear.helixAngle) : '')}
                      </text>
                    </g>
                  </g>
                );
              }

              // ─── STANDARD EXTERNAL GEAR ───
              const path = generateGearPath(cx, cy, r, gear.teeth, gear.module * scale, gear.profileShift, gear.helixAngle, gear.pressureAngle);
              const gearFill = isPrint ? '#eee' : isDriver ? 'url(#unPinionGrad)' : isCoaxial ? 'url(#unCoaxialGrad)' : 'url(#unWheelGrad)';
              const strokeColor = isSelected ? '#00e5ff' : isDriver ? '#38bdf8' : isCoaxial ? '#fbbf24' : '#c084fc';
              const initRotation = (!isDriver && !isCoaxial) ? (180 / gear.teeth) : 0;
              const hSpecs = calculateInvoluteGearSpecs({
                module: gear.module * scale,
                teeth: gear.teeth,
                helixAngle: gear.helixAngle,
                profileShift: gear.profileShift,
                pressureAngle: gear.pressureAngle,
              });
              const twistDeg = helixFaceTwistDeg(gear.helixAngle || 0, (gear.faceWidth || 20) * scale, hSpecs.pitchRadius);
              const backPath = Math.abs(twistDeg) > 0.05
                ? generateGearPath(cx, cy, r, gear.teeth, gear.module * scale, gear.profileShift, gear.helixAngle, gear.pressureAngle, twistDeg)
                : null;

              return (
                <g key={'front-' + gear.id} className="gear-elem transition-all" onClick={() => onSelectGear(gear.id)}>
                  <g transform={initRotation !== 0 ? 'rotate(' + initRotation + ', ' + cx + ', ' + cy + ')' : undefined}>
                    <g style={animStyle}>
                      {backPath && (
                        <path d={backPath} fill="none" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 2" opacity={0.4} />
                      )}
                      <path
                        d={path}
                        fill={gearFill}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        filter={isSelected ? 'url(#unSelGlow)' : undefined}
                        opacity={isCoaxial ? 0.92 : 0.98}
                      />
                      <circle cx={cx} cy={cy} r={Math.max(5, r * 0.25)} fill="#03060a" stroke={strokeColor} strokeWidth="1.5" />
                      {Math.abs(gear.helixAngle || 0) > 0.05 && Array.from({ length: 8 }, (_, i) => {
                        const a0 = (i / 8) * 2 * Math.PI;
                        const a1 = a0 + (twistDeg * Math.PI) / 180;
                        return (
                          <line
                            key={'hx-' + i}
                            x1={cx + hSpecs.pitchRadius * Math.cos(a0)}
                            y1={cy + hSpecs.pitchRadius * Math.sin(a0)}
                            x2={cx + hSpecs.pitchRadius * Math.cos(a1)}
                            y2={cy + hSpecs.pitchRadius * Math.sin(a1)}
                            stroke={strokeColor}
                            strokeWidth="1"
                            opacity={0.8}
                          />
                        );
                      })}
                    </g>
                  </g>

                  {/* Pitch Line */}
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="4,2" opacity={0.4} pointerEvents="none" />

                  {/* Center Dot */}
                  <circle cx={cx} cy={cy} r={2.5} fill="#00e5ff" pointerEvents="none" />

                  {/* Tag */}
                  <g transform={'translate(' + cx + ', ' + (cy + (idx % 2 === 0 ? r + 22 : r + 38)) + ')'}>
                    <rect x="-48" y="-9" width="96" height="26" rx="4" fill="#080c14" stroke={isSelected ? '#00e5ff' : 'rgba(255,255,255,0.12)'} strokeWidth={isSelected ? 1.5 : 0.8} />
                    <text x="0" y="2" textAnchor="middle" fill={isSelected ? '#00e5ff' : '#ffffff'} fontSize="8.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                      {gear.name}
                    </text>
                    <text x="0" y="12" textAnchor="middle" fill={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.5)'} fontSize="7" fontFamily="ui-monospace, monospace">
                      {'z=' + gear.teeth + ' · ' + Math.round(gear.rpm) + ' RPM'}
                    </text>
                  </g>

                  {isCoaxial && (
                    <g transform={'translate(' + cx + ', ' + (cy - r - 16) + ')'}>
                      <rect x="-38" y="-7" width="76" height="13" rx="2" fill="#b45309" stroke="#fbbf24" strokeWidth="0.6" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#fef3c7" fontSize="6.5" fontWeight="bold" fontFamily="ui-monospace, monospace">
                        {t12(language, 'COAXIAL SHAFT', 'KOAKSİYEL MİL')}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROJECTION & SECTION DIVIDER (1:1 ORTHOGRAPHIC PROJECTION)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'both' && (
          <g id="drafting-divider-group">
            {/* Technical Section Cutting Line (A-A) */}
            <line
              x1="20"
              y1={layout.sectionStartY - 24}
              x2={layout.width - 20}
              y2={layout.sectionStartY - 24}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="14,3,2,3"
              opacity={0.4}
            />

            {/* Vertical Projection Lines from Front View Down to Top Section Slabs */}
            {layout.gearCoords.map((coord) => (
              <g key={'proj-lines-' + coord.id} opacity={0.3}>
                {/* Left Tip Projection */}
                <line
                  x1={coord.cx - coord.r}
                  y1={layout.frontCy + coord.r + 6}
                  x2={coord.cx - coord.r}
                  y2={layout.sectionStartY - 4}
                  stroke="#38bdf8"
                  strokeWidth="0.6"
                  strokeDasharray="2,3"
                />
                {/* Center Axis Projection */}
                <line
                  x1={coord.cx}
                  y1={layout.frontCy + coord.r + 6}
                  x2={coord.cx}
                  y2={layout.sectionStartY - 4}
                  stroke="#00e5ff"
                  strokeWidth="0.75"
                  strokeDasharray="6,2,1,2"
                />
                {/* Right Tip Projection */}
                <line
                  x1={coord.cx + coord.r}
                  y1={layout.frontCy + coord.r + 6}
                  x2={coord.cx + coord.r}
                  y2={layout.sectionStartY - 4}
                  stroke="#38bdf8"
                  strokeWidth="0.6"
                  strokeDasharray="2,3"
                />
              </g>
            ))}

            {/* Section View Title Header */}
            <g transform={'translate(20, ' + (layout.sectionStartY - 10) + ')'}>
              <rect x="0" y="-14" width="340" height="20" rx="4" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.35)" strokeWidth="0.8" />
              <text x="10" y="0" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="ui-monospace, monospace">
                {t12(language, '2. A-A TOP SECTION VIEW (1:1 ORTHOGRAPHIC PROJECTION)', '2. A-A ÜSTTEN KESİT GÖRÜNÜŞÜ (1:1 DİK İZDÜŞÜM)')}
              </text>
            </g>
          </g>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM ZONE: 2. A-A ÜSTTEN KESİT (1:1 DIRECT PROJECTION)           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {(viewMode === 'both' || viewMode === 'top_section') && (
          <g id="top-section-group">
            {viewMode === 'top_section' && (
              <g transform="translate(20, 24)">
                <rect x="0" y="-14" width="340" height="20" rx="4" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.35)" strokeWidth="0.8" />
                <text x="10" y="0" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="ui-monospace, monospace">
                  {t12(language, 'A-A TOP SECTION VIEW (1:1 PROJECTION)', 'A-A ÜSTTEN KESİT GÖRÜNÜŞÜ (1:1 İZDÜŞÜM)')}
                </text>
              </g>
            )}

            {/* Render 1:1 Orthographic Gear Slabs */}
            {layout.topSectionGears.map((item, idx) => {
              const g = item.gear;
              const isSelected = selectedGearId === g.id;
              const isDriver = idx === 0;
              const isCoaxial = g.isCoaxial;
              const isPlanetary = g.gearType === 'planetary_stage';
              const isInternal = g.gearType === 'internal';

              const strokeColor = isSelected ? '#00e5ff' : isDriver ? '#38bdf8' : isCoaxial ? '#fbbf24' : isPlanetary ? '#10b981' : '#c084fc';
              const slabFill = isSelected
                ? 'url(#secHatchSelected)'
                : isDriver
                ? 'url(#unPinionGrad)'
                : isCoaxial
                ? 'url(#unCoaxialGrad)'
                : isPlanetary
                ? 'url(#unPlanetaryGrad)'
                : 'url(#unWheelGrad)';

              const slabWidth = 2 * item.r;
              const slabX = item.cx - item.r;
              const slabY = item.y;
              const slabH = item.height;

              return (
                <g
                  key={'top-sec-slab-' + g.id}
                  className="cursor-pointer transition-all hover:brightness-125"
                  onClick={() => onSelectGear(g.id)}
                >
                  {/* Shaft Centerline Through Gear */}
                  <line
                    x1={item.cx}
                    y1={slabY - 10}
                    x2={item.cx}
                    y2={slabY + slabH + 10}
                    stroke="#00e5ff"
                    strokeWidth="0.85"
                    strokeDasharray="6,2,1,2"
                    opacity={0.7}
                  />

                  {/* Main Gear Body Slab (Horizontally spanning exactly across front-view diameter) */}
                  <rect
                    x={slabX}
                    y={slabY}
                    width={slabWidth}
                    height={slabH}
                    rx="2"
                    fill={slabFill}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.2 : 1.2}
                    filter={isSelected ? 'url(#unSelGlow)' : undefined}
                    opacity={0.92}
                  />

                  {/* Left Tooth Root Line */}
                  <line
                    x1={item.cx - item.rf}
                    y1={slabY}
                    x2={item.cx - item.rf}
                    y2={slabY + slabH}
                    stroke="#03060a"
                    strokeWidth="1"
                    opacity={0.6}
                  />

                  {/* Right Tooth Root Line */}
                  <line
                    x1={item.cx + item.rf}
                    y1={slabY}
                    x2={item.cx + item.rf}
                    y2={slabY + slabH}
                    stroke="#03060a"
                    strokeWidth="1"
                    opacity={0.6}
                  />

                  {/* Pitch Diameter Mark (Left & Right) */}
                  <line
                    x1={item.cx - item.rp}
                    y1={slabY - 2}
                    x2={item.cx - item.rp}
                    y2={slabY + slabH + 2}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                    opacity={0.8}
                  />
                  <line
                    x1={item.cx + item.rp}
                    y1={slabY - 2}
                    x2={item.cx + item.rp}
                    y2={slabY + slabH + 2}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                    opacity={0.8}
                  />

                  {/* Center Shaft Bore (Göbek Delik Yuvası) */}
                  <rect
                    x={item.cx - 5}
                    y={slabY}
                    width={10}
                    height={slabH}
                    rx="1"
                    fill="#03060a"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                  />

                  {/* Face Width Dimension Line (Diş Genişliği Ölçüsü b) */}
                  {showDimensions && (
                    <g opacity={0.85}>
                      <line x1={slabX + slabWidth + 6} y1={slabY} x2={slabX + slabWidth + 6} y2={slabY + slabH} stroke="#38bdf8" strokeWidth="0.8" />
                      <line x1={slabX + slabWidth + 3} y1={slabY} x2={slabX + slabWidth + 9} y2={slabY} stroke="#38bdf8" strokeWidth="0.8" />
                      <line x1={slabX + slabWidth + 3} y1={slabY + slabH} x2={slabX + slabWidth + 9} y2={slabY + slabH} stroke="#38bdf8" strokeWidth="0.8" />
                      <text
                        x={slabX + slabWidth + 12}
                        y={slabY + slabH / 2 + 3}
                        fill="#38bdf8"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        b={g.faceWidth}
                      </text>
                    </g>
                  )}

                  {/* Gear Identity Badge above slab */}
                  <g transform={'translate(' + item.cx + ', ' + (slabY - 6) + ')'}>
                    <rect
                      x="-38"
                      y="-7"
                      width="76"
                      height="13"
                      rx="2.5"
                      fill="#03060a"
                      stroke={isSelected ? '#00e5ff' : 'rgba(255,255,255,0.18)'}
                      strokeWidth={isSelected ? 1.4 : 0.7}
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fill={isSelected ? '#00e5ff' : '#ffffff'}
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="ui-monospace, monospace"
                    >
                      {g.name.split(' ')[0] + ' (z=' + g.teeth + ')'}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}

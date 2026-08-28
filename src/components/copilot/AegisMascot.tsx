'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { useI18nStore } from '@/store/i18nStore';
import { getChrome } from '@/locales/chromeTranslations';

export type AegisPose =
  | 'idle'
  | 'blueprint'
  | 'calculation'
  | 'einstein'
  | 'tesla'
  | 'newton'
  | 'wave'
  | 'thinking'
  | 'celebrate'
  | 'walk'
  | 'run'
  | 'jump'
  | 'apple'
  | 'auto';

export type AegisVariant = 'panoramic' | 'face' | 'full';

interface AegisMascotProps {
  size?: number | string;
  className?: string;
  isHovered?: boolean;
  pose?: AegisPose;
  variant?: AegisVariant;
  interactive?: boolean;
  onPoseChange?: (pose: AegisPose) => void;
}

/**
 * 🤖 AEGIS COPILOT — PANORAMIC HOLOGRAPHIC SCIENTIST & CAD CANVAS
 * - 'panoramic': Wide-angle HUD with live CAD blueprints, tensor equations & spacetime physics.
 * - 'face': Tight, high-definition zoom on AeGiS's adorable face, big shiny anime eyes & blush.
 */
export function AegisMascot({
  size,
  className = '',
  isHovered = false,
  pose = 'auto',
  variant = 'panoramic',
  interactive = true,
  onPoseChange,
}: AegisMascotProps) {
  const uid = useId().replace(/:/g, '');
  const { language } = useI18nStore();
  const chrome = getChrome(language);
  const [currentPose, setCurrentPose] = useState<AegisPose>(
    pose === 'auto' ? (variant === 'face' ? 'idle' : 'walk') : pose,
  );
  const [clickCount, setClickCount] = useState(0);
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPose = useRef<AegisPose | null>(null);

  // Auto-cycle: durations land on gait loop boundaries so the next pose starts at rest.
  useEffect(() => {
    if (pose !== 'auto') {
      setCurrentPose(pose);
      return;
    }

    const poses: AegisPose[] = variant === 'face'
      ? ['idle', 'wave', 'calculation']
      : ['walk', 'run', 'jump', 'apple', 'idle', 'wave', 'blueprint', 'calculation'];
    const durations = variant === 'face'
      ? [3600, 2800, 3600]
      : [4800, 3000, 2800, 3600, 3000, 2800, 4800, 4800];
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      idx = (idx + 1) % poses.length;
      setCurrentPose(poses[idx]);
      onPoseChange?.(poses[idx]);
      timer = setTimeout(tick, durations[idx]);
    };
    timer = setTimeout(tick, durations[0]);

    return () => clearTimeout(timer);
  }, [pose, onPoseChange, variant]);

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    const allPoses: AegisPose[] = ['walk', 'run', 'jump', 'apple', 'wave', 'blueprint', 'calculation', 'idle'];
    const nextIdx = (clickCount + 1) % allPoses.length;
    setClickCount(nextIdx);
    setCurrentPose(allPoses[nextIdx]);
    onPoseChange?.(allPoses[nextIdx]);
  };

  // Normalize aliases
  const rawPose = pose !== 'auto' ? pose : currentPose;
  const activePose = rawPose === 'thinking' ? 'calculation' : rawPose === 'celebrate' ? 'wave' : rawPose;
  const isRun = activePose === 'run';
  const isWalk = activePose === 'walk';
  const isJump = activePose === 'jump';
  const isApple = activePose === 'apple';

  useEffect(() => {
    if (lastPose.current === null) {
      lastPose.current = activePose;
      return;
    }
    if (lastPose.current === activePose) return;
    lastPose.current = activePose;
    setSwitching(true);
    if (switchTimer.current) clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => setSwitching(false), 320);
    return () => {
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, [activePose]);

  const isFaceMode = variant === 'face';
  const viewBox = isFaceMode ? '14 6 72 74' : '-100 -45 300 190';

  const styleObj = size
    ? typeof size === 'number'
      ? { width: size, height: size }
      : { width: size, height: size }
    : undefined;

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none group ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={styleObj}
      title={
        interactive
          ? chrome.mascotHint
          : 'AeGiS Copilot'
      }
    >
      <style>{`
        /* Nested layers: float (svg) → stride/jump (actor) → lean → body/limbs.
           Each transform lives on its own node so pose changes don't fight. */
        @keyframes aegisFloatGentle {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -5px, 0); }
        }
        @keyframes eyeBlinkSweet {
          0%, 93%, 100% { transform: scaleY(1); }
          96.5% { transform: scaleY(0.08); }
        }
        @keyframes magneticJetPulse {
          0%, 100% { transform: scaleY(0.85) scaleX(0.9); opacity: 0.55; }
          50% { transform: scaleY(1.25) scaleX(1.15); opacity: 0.95; }
        }
        @keyframes cadDrawStroke {
          0% { stroke-dashoffset: 200; opacity: 0.2; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.9; }
        }
        @keyframes laserPointerScan {
          0%, 100% { transform: translate(0px, 0px); }
          25% { transform: translate(-10px, -6px); }
          75% { transform: translate(10px, 6px); }
        }
        @keyframes mathEquationGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; filter: drop-shadow(0 0 5px rgba(0,229,255,0.8)); }
        }
        @keyframes teslaFluxRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes teslaSparkFlicker {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes gravityCurveSweep {
          0% { stroke-dashoffset: 250; opacity: 0; }
          35% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.9; }
        }
        @keyframes appleBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(10deg); }
        }
        @keyframes spacetimeWarp {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.04) rotate(1.4deg); }
        }
        @keyframes waveHandGentle {
          0%, 100% { transform: rotate(-8deg); }
          30% { transform: rotate(-42deg); }
          62% { transform: rotate(-16deg); }
        }

        .aegis-root-character {
          animation: aegisFloatGentle 4.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }
        .aegis-eye-blink-anim {
          transform-origin: 50% 50%;
          animation: eyeBlinkSweet 4.2s infinite ease-in-out;
          transition: opacity 0.35s ease;
        }
        .aegis-jet-wrap {
          opacity: 1;
          transition: opacity 0.45s ease;
        }
        .aegis-jet-wrap.aegis-jet-dim { opacity: 0; }
        .aegis-jet-glow {
          transform-origin: 50px 94px;
          transform-box: view-box;
          animation: magneticJetPulse 1.4s infinite ease-in-out;
        }
        .aegis-cad-stroke-anim {
          stroke-dasharray: 200;
          animation: cadDrawStroke 3.2s ease-in-out infinite alternate;
        }
        .aegis-laser-hand {
          animation: laserPointerScan 4s ease-in-out infinite;
        }
        .aegis-math-pulse {
          animation: mathEquationGlow 2.8s infinite ease-in-out;
        }
        .aegis-tesla-flux-anim {
          transform-origin: 50px 50px;
          transform-box: view-box;
          animation: teslaFluxRotate 9s linear infinite;
        }
        .aegis-spark-flash {
          animation: teslaSparkFlicker 0.35s infinite alternate ease-in-out;
        }
        .aegis-gravity-curve {
          stroke-dasharray: 250;
          animation: gravityCurveSweep 3.2s ease-out infinite;
        }
        .aegis-apple-float {
          animation: appleBob 2.8s ease-in-out infinite;
        }
        .aegis-spacetime-anim {
          transform-origin: 50px 75px;
          transform-box: view-box;
          animation: spacetimeWarp 4.2s ease-in-out infinite;
        }

        /* HUD crossfade — layers stay mounted so they never pop in from empty */
        .aegis-hud-layer {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.55s ease;
        }
        .aegis-hud-layer.is-on { opacity: 1; }
        svg[data-variant="face"] .aegis-act-walk,
        svg[data-variant="face"] .aegis-act-run,
        svg[data-variant="face"] .aegis-act-jump {
          animation: none;
        }

        .aegis-sway {
          transform-box: view-box;
          transform-origin: 50px 88px;
          animation: aegisStrideSway 6.4s ease-in-out infinite;
        }
        .aegis-actor {
          transform-box: view-box;
          transform-origin: 50px 88px;
          transition: opacity 0.32s ease;
        }
        .aegis-is-switching .aegis-actor { opacity: 0.82; }

        .aegis-lean {
          transform-box: view-box;
          transform-origin: 50px 96px;
          transform: rotate(0deg);
          transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .aegis-act-run .aegis-lean { transform: rotate(-7deg); }
        .aegis-act-jump .aegis-lean { transform: rotate(-2deg); }

        /* In-place stride (no wrap teleport). 0% === 100%. */
        @keyframes aegisStrideSway {
          0%, 100% { transform: translate3d(-5px, 0, 0); }
          50% { transform: translate3d(5px, 0, 0); }
        }
        @keyframes aegisWalkBob {
          0%, 50%, 100% { transform: translateY(0); }
          25%, 75% { transform: translateY(2.5px); }
        }
        @keyframes aegisJumpBody {
          0% { transform: translateY(0) scaleY(1) scaleX(1); }
          10% { transform: translateY(5px) scaleY(0.9) scaleX(1.05); }
          30% { transform: translateY(-42px) scaleY(1.06) scaleX(0.97); }
          52% { transform: translateY(-6px) scaleY(1) scaleX(1); }
          64% { transform: translateY(5px) scaleY(0.9) scaleX(1.04); }
          78% { transform: translateY(-5px) scaleY(1.02) scaleX(0.99); }
          100% { transform: translateY(0) scaleY(1) scaleX(1); }
        }
        @keyframes aegisLegCycle {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(24deg); }
          75% { transform: rotate(-24deg); }
        }
        @keyframes aegisArmCycle {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        @keyframes aegisLegIdle {
          0%, 100% { transform: rotate(3deg); }
          50% { transform: rotate(-3deg); }
        }
        @keyframes aegisLegJump {
          0%, 100% { transform: rotate(4deg); }
          10% { transform: rotate(16deg); }
          30% { transform: rotate(-12deg); }
          64% { transform: rotate(14deg); }
        }
        @keyframes aegisAppleDrop {
          0% { transform: translate(0, -86px) rotate(0deg); }
          54% { transform: translate(0, 4px) rotate(175deg); }
          68% { transform: translate(2px, -11px) rotate(210deg); }
          84% { transform: translate(-1px, 5px) rotate(240deg); }
          100% { transform: translate(0, 4px) rotate(255deg); }
        }
        @keyframes aegisBonkHead {
          0%, 48% { transform: rotate(0deg) translateY(0); }
          56% { transform: rotate(-10deg) translateY(4px); }
          64% { transform: rotate(7deg) translateY(1px); }
          74% { transform: rotate(-4deg) translateY(2px); }
          86% { transform: rotate(2deg); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes aegisStarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes aegisDustPuff {
          0% { opacity: 0; transform: scale(0.4); }
          18% { opacity: 0.65; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.55) translateY(5px); }
        }
        @keyframes aegisGroundScroll {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -80; }
        }
        @keyframes aegisSpeedLine {
          0% { transform: translateX(36px); opacity: 0; }
          28% { opacity: 0.65; }
          100% { transform: translateX(-130px); opacity: 0; }
        }

        .aegis-act-jump { animation: aegisJumpBody 1.4s cubic-bezier(0.33, 0.05, 0.2, 1) infinite; }
        .aegis-act-walk .aegis-body-rig { animation: aegisWalkBob 0.6s ease-in-out infinite; }
        .aegis-act-run .aegis-body-rig { animation: aegisWalkBob 0.3s ease-in-out infinite; }
        .aegis-act-apple .aegis-body-rig {
          transform-origin: 50px 80px;
          transform-box: view-box;
          animation: aegisBonkHead 2.5s ease-in-out 1 both;
        }

        .aegis-leg-l, .aegis-leg-r, .aegis-arm-l, .aegis-arm-r, .aegis-body-rig {
          transform-box: view-box;
        }
        .aegis-leg-l {
          transform-origin: 43px 88px;
          animation: aegisLegIdle 2.8s ease-in-out infinite;
        }
        .aegis-leg-r {
          transform-origin: 57px 88px;
          animation: aegisLegIdle 2.8s ease-in-out infinite reverse;
        }
        .aegis-arm-l { transform-origin: 36px 76px; }
        .aegis-arm-r { transform-origin: 64px 76px; }

        .aegis-act-walk .aegis-leg-l,
        .aegis-act-run .aegis-leg-l { animation: aegisLegCycle 0.6s ease-in-out infinite; }
        .aegis-act-walk .aegis-leg-r,
        .aegis-act-run .aegis-leg-r { animation: aegisLegCycle 0.6s ease-in-out infinite reverse; }
        .aegis-act-run .aegis-leg-l,
        .aegis-act-run .aegis-leg-r { animation-duration: 0.3s; }
        .aegis-act-walk .aegis-arm-l,
        .aegis-act-run .aegis-arm-l { animation: aegisArmCycle 0.6s ease-in-out infinite; }
        .aegis-act-walk .aegis-arm-r,
        .aegis-act-run .aegis-arm-r { animation: aegisArmCycle 0.6s ease-in-out infinite reverse; }
        .aegis-act-run .aegis-arm-l,
        .aegis-act-run .aegis-arm-r { animation-duration: 0.3s; }
        .aegis-act-jump .aegis-leg-l,
        .aegis-act-jump .aegis-leg-r { animation: aegisLegJump 1.4s ease-in-out infinite; }
        .aegis-act-wave .aegis-arm-l { animation: waveHandGentle 0.8s ease-in-out infinite; }

        .aegis-apple-prop {
          opacity: 0;
          transform: translate(0, 4px) rotate(255deg);
          transition: opacity 0.4s ease;
        }
        .aegis-act-apple .aegis-apple-prop {
          opacity: 1;
          animation: aegisAppleDrop 2.4s cubic-bezier(0.45, 0.05, 0.55, 1.12) 1 forwards;
        }
        .aegis-star-spin {
          transform-origin: 50px 18px;
          transform-box: view-box;
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .aegis-act-apple .aegis-star-spin {
          opacity: 0.95;
          animation: aegisStarSpin 2.2s linear infinite;
        }
        .aegis-dazed { opacity: 0; transition: opacity 0.3s ease; }
        .aegis-act-apple .aegis-dazed { opacity: 1; }
        .aegis-act-apple .aegis-eye-blink-anim { opacity: 0.15; }

        .aegis-dust { animation: aegisDustPuff 1.4s ease-out infinite; }
        .aegis-ground-scroll {
          stroke-dasharray: 10 10;
          animation: aegisGroundScroll 1.6s linear infinite;
        }
        svg[data-pose="walk"] .aegis-ground-scroll { animation-duration: 0.7s; }
        svg[data-pose="run"] .aegis-ground-scroll { animation-duration: 0.28s; }
        svg[data-pose="jump"] .aegis-ground-scroll { animation-duration: 1.1s; }
        .aegis-speed-line { animation: aegisSpeedLine 0.55s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .aegis-root-character, .aegis-sway, .aegis-act-jump,
          .aegis-act-apple .aegis-body-rig, .aegis-act-apple .aegis-apple-prop,
          .aegis-leg-l, .aegis-leg-r, .aegis-arm-l, .aegis-arm-r,
          .aegis-star-spin, .aegis-dust, .aegis-ground-scroll, .aegis-speed-line,
          .aegis-jet-glow, .aegis-eye-blink-anim {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        viewBox={viewBox}
        className={`w-full h-full ${isFaceMode ? 'overflow-hidden' : 'overflow-visible'} aegis-root-character ${switching ? 'aegis-is-switching' : ''}`}
        data-pose={activePose}
        data-variant={variant}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Cyber Armor Gradients */}
          <linearGradient id={`${uid}-armor`} x1="50" y1="12" x2="50" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#142e4d" />
            <stop offset="40%" stopColor="#0a1a2e" />
            <stop offset="100%" stopColor="#040d18" />
          </linearGradient>

          {/* Visor Screen Glass */}
          <linearGradient id={`${uid}-glass`} x1="50" y1="26" x2="50" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#030c17" />
            <stop offset="70%" stopColor="#061626" />
            <stop offset="100%" stopColor="#020810" />
          </linearGradient>

          {/* Glass Gloss Highlight */}
          <linearGradient id={`${uid}-gloss`} x1="28" y1="28" x2="72" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Body Chassis Gradient */}
          <linearGradient id={`${uid}-body`} x1="50" y1="72" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0e233d" />
            <stop offset="100%" stopColor="#050e1b" />
          </linearGradient>

          {/* Glowing Arc Reactor */}
          <linearGradient id={`${uid}-arc`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Panoramic Hologram Grid Pattern */}
          <pattern id={`${uid}-grid`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,229,255,0.09)" strokeWidth="0.5" />
          </pattern>

          {/* Glow Filters */}
          <filter id={`${uid}-neon`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id={`${uid}-laser`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ════════════════════════════════════════════════════════════════════════
            LAYER 1: FULL PANORAMIC BACKGROUND BLUEPRINTS & CALCULATIONS HUD
            (Active when not in tight face-focus mode)
        ════════════════════════════════════════════════════════════════════════ */}
        {!isFaceMode && (
          <>
            <rect x="-95" y="-40" width="290" height="180" rx="12" fill="#030814" fillOpacity="0.48" stroke="rgba(0,229,255,0.18)" strokeWidth="0.8" />
            <line className="aegis-ground-scroll" x1="-90" y1="118" x2="190" y2="118" stroke="#00e5ff" strokeWidth="1.4" opacity="0.35" />
            <line className="aegis-ground-scroll" x1="-90" y1="128" x2="190" y2="128" stroke="#38bdf8" strokeWidth="0.7" opacity="0.18" />

            {/* ─── 1. CAD BLUEPRINT & ISOMETRIC 3D DRAWING MODE ─── */}
            <g className={`aegis-hud-layer ${activePose === 'blueprint' ? 'is-on' : ''}`}>
                <rect x="-95" y="-40" width="290" height="180" rx="12" fill={`url(#${uid}-grid)`} fillOpacity="0.85" stroke="rgba(0,229,255,0.2)" strokeWidth="0.8" />
                
                {/* Coordinate Axis Compass on Far Left */}
                <g transform="translate(-75, -20)" stroke="#38bdf8" strokeWidth="1" opacity="0.8">
                  <line x1="0" y1="0" x2="18" y2="0" />
                  <line x1="0" y1="0" x2="0" y2="-18" />
                  <line x1="0" y1="0" x2="-10" y2="10" />
                  <text x="21" y="3" fill="#38bdf8" fontSize="6" fontFamily="monospace">X</text>
                  <text x="-3" y="-21" fill="#38bdf8" fontSize="6" fontFamily="monospace">Z</text>
                  <text x="-16" y="16" fill="#38bdf8" fontSize="6" fontFamily="monospace">Y</text>
                </g>

                {/* Left Side: Real-time Isometric 3D CAD Wireframe Part */}
                <g transform="translate(-45, -5)">
                  <g className="aegis-cad-stroke-anim" stroke="#00e5ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${uid}-neon)`}>
                    <polygon points="12,-10 36,2 12,14 -12,2" />
                    <polygon points="-12,2 12,14 12,32 -12,20" />
                    <polygon points="12,14 36,2 36,20 12,32" />
                    <ellipse cx="12" cy="2" rx="8" ry="4" strokeDasharray="3,2" />
                  </g>

                  {/* Dimension Ticks & Tolerance Callouts */}
                  <g stroke="#38bdf8" strokeWidth="0.8" opacity="0.85">
                    <line x1="-16" y1="2" x2="-16" y2="20" strokeDasharray="1.5,1.5" />
                    <line x1="-19" y1="2" x2="-13" y2="2" />
                    <line x1="-19" y1="20" x2="-13" y2="20" />
                    <text x="-30" y="13" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      H7/g6
                    </text>

                    <line x1="12" y1="-14" x2="36" y2="-2" strokeDasharray="1.5,1.5" />
                    <text x="22" y="-14" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      R18.5
                    </text>
                  </g>
                </g>

                {/* Right Side: CAD Drafting Spec Sheet & Parameters */}
                <g transform="translate(115, -15)" fontFamily="monospace" fontSize="6.5">
                  <rect x="0" y="0" width="70" height="50" rx="4" fill="#040d1a" stroke="rgba(0,229,255,0.3)" strokeWidth="0.8" />
                  <text x="6" y="12" fill="#00e5ff" fontWeight="bold">[CAD B-REP v4]</text>
                  <text x="6" y="24" fill="#94a3b8">DIM: 120x60mm</text>
                  <text x="6" y="34" fill="#94a3b8">TOL: ±0.02mm</text>
                  <text x="6" y="44" fill="#4ade80" fontWeight="bold">ISO 2768-mK</text>
                </g>

                {/* Cyan Laser Beam from Robot Stylus to the CAD Drawing */}
                <g filter={`url(#${uid}-laser)`}>
                  <line x1="79" y1="91" x2="-25" y2="10" stroke="#00e5ff" strokeWidth="1.8" strokeDasharray="4,2" opacity="0.85" />
                  <circle cx="-25" cy="10" r="3" fill="#ffffff" />
                </g>
            </g>

            {/* ─── 2. LIVE MATHEMATICAL & STRUCTURAL DERIVATION MODE ─── */}
            <g className={`aegis-hud-layer ${activePose === 'calculation' ? 'is-on' : ''}`}>
                <rect x="-95" y="-40" width="290" height="180" rx="12" fill="#030814" fillOpacity="0.55" stroke="rgba(0,229,255,0.25)" strokeWidth="0.8" />
                
                {/* Left Math Wings */}
                <g className="aegis-math-pulse" fontFamily="monospace" transform="translate(-85, -20)">
                  <text x="0" y="10" fill="#38bdf8" fontSize="10" fontWeight="bold">
                    ∫ σ·dA = F_axial
                  </text>
                  <text x="0" y="26" fill="#a855f7" fontSize="9" fontWeight="bold">
                    E·I·y'' = M(x)
                  </text>
                  <text x="0" y="42" fill="#22d3ee" fontSize="8.5" fontWeight="bold">
                    σ_vm = √(σ₁²-σ₁σ₂+σ₂²)
                  </text>
                  <text x="0" y="58" fill="#facc15" fontSize="8" fontWeight="bold">
                    τ_max = (σ₁ - σ₂)/2
                  </text>
                </g>

                {/* Right Math Wings & Matrix Solution */}
                <g className="aegis-math-pulse" fontFamily="monospace" transform="translate(105, -20)">
                  <rect x="0" y="0" width="80" height="65" rx="5" fill="#051020" stroke="rgba(0,229,255,0.3)" strokeWidth="0.8" />
                  <text x="6" y="14" fill="#00e5ff" fontSize="7.5" fontWeight="bold">[STRESS TENSOR]</text>
                  <text x="6" y="28" fill="#94a3b8" fontSize="7">[ 120   45   0 ]</text>
                  <text x="6" y="40" fill="#94a3b8" fontSize="7">[  45  -30   0 ]</text>
                  <text x="6" y="52" fill="#94a3b8" fontSize="7">[   0    0  85 ]</text>
                  
                  <rect x="6" y="55" width="68" height="7" rx="2" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="0.6" />
                  <text x="12" y="60.5" fill="#4ade80" fontSize="5.5" fontWeight="black">
                    [✓ VON MISES PASS]
                  </text>
                </g>

                {/* Laser Stylus Pointer from Robot Hand */}
                <g filter={`url(#${uid}-laser)`}>
                  <line x1="79" y1="91" x2="-20" y2="20" stroke="#c084fc" strokeWidth="1.6" strokeDasharray="3,2" opacity="0.8" />
                  <circle cx="-20" cy="20" r="2.5" fill="#ffffff" />
                </g>
            </g>

            {/* ─── 3. ALBERT EINSTEIN RELATIVISTIC SPACETIME CURVATURE ─── */}
            <g className={`aegis-hud-layer ${activePose === 'einstein' ? 'is-on' : ''}`}>
                {/* Wide Curved 3D Spacetime Grid */}
                <g className="aegis-spacetime-anim" stroke="rgba(56,189,248,0.28)" strokeWidth="0.8" fill="none">
                  <ellipse cx="50" cy="80" rx="120" ry="40" strokeDasharray="5,3" />
                  <ellipse cx="50" cy="80" rx="85" ry="28" />
                  <ellipse cx="50" cy="80" rx="50" ry="16" stroke="#00e5ff" strokeWidth="1.2" />
                  <line x1="-90" y1="80" x2="190" y2="80" />
                  <line x1="50" y1="35" x2="50" y2="125" />
                </g>

                {/* Glowing E=mc² Energy Equation Banner on Top Right */}
                <g transform="translate(100, -25)" filter={`url(#${uid}-neon)`}>
                  <rect x="0" y="0" width="80" height="32" rx="8" fill="#040e1c" stroke="#38bdf8" strokeWidth="1.4" />
                  <text x="10" y="21" fill="#38bdf8" fontSize="16" fontWeight="900" fontFamily="monospace">
                    E = mc²
                  </text>
                </g>

                {/* Relativistic Tensor on Left */}
                <g transform="translate(-85, -20)" fontFamily="monospace">
                  <text x="0" y="10" fill="#a855f7" fontSize="10" fontWeight="bold">
                    G_μν + Λg_μν = 8πT_μν
                  </text>
                  <text x="0" y="26" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    γ = 1/√(1 - v²/c²)
                  </text>
                  <text x="0" y="42" fill="#f43f5e" fontSize="8" fontWeight="bold">
                    Δt = γ · Δt₀
                  </text>
                </g>
            </g>

            {/* ─── 4. NIKOLA TESLA HIGH VOLTAGE RESONANCE FLUX ─── */}
            <g className={`aegis-hud-layer ${activePose === 'tesla' ? 'is-on' : ''}`}>
                {/* Wide Concentric Electromagnetic Wireless Flux Rings */}
                <g className="aegis-tesla-flux-anim" stroke="rgba(168,85,247,0.3)" strokeWidth="1" fill="none" strokeDasharray="8,5">
                  <circle cx="50" cy="50" r="90" />
                  <circle cx="50" cy="50" r="65" />
                  <circle cx="50" cy="50" r="40" stroke="#00e5ff" strokeWidth="1.2" />
                </g>

                {/* Wide Lightning Arc Streams branching across the card */}
                <g className="aegis-spark-flash" filter={`url(#${uid}-laser)`}>
                  <path d="M 15 44 L -45 20 L -25 0 L -80 -20" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M 85 44 L 145 20 L 125 0 L 180 -20" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M 50 8 L 50 -25 L 80 -35" stroke="#00e5ff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>

                {/* Left/Right Resonator Tower Symbols */}
                <g stroke="#a855f7" strokeWidth="1" opacity="0.75" transform="translate(-75, 40)">
                  <line x1="0" y1="0" x2="0" y2="40" />
                  <circle cx="0" cy="0" r="6" fill="#a855f7" fillOpacity="0.2" />
                </g>
                <g stroke="#a855f7" strokeWidth="1" opacity="0.75" transform="translate(175, 40)">
                  <line x1="0" y1="0" x2="0" y2="40" />
                  <circle cx="0" cy="0" r="6" fill="#a855f7" fillOpacity="0.2" />
                </g>
            </g>

            {/* ─── 5. ISAAC NEWTON GRAVITY TRAJECTORY & PARABOLAS ─── */}
            <g className={`aegis-hud-layer ${activePose === 'newton' ? 'is-on' : ''}`}>
                {/* Wide Gravitational Acceleration Parabola Curve */}
                <g className="aegis-gravity-curve" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" filter={`url(#${uid}-neon)`}>
                  <path d="M -85 90 Q 50 -45 185 90" />
                </g>

                {/* Left Gravity Kinematics Equation & Vectors */}
                <g fontFamily="monospace" transform="translate(-85, -20)">
                  <text x="0" y="10" fill="#facc15" fontSize="11" fontWeight="bold">
                    g = 9.80665 m/s²
                  </text>
                  <text x="0" y="26" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    F_g = G · (m₁·m₂)/r²
                  </text>
                  <text x="0" y="42" fill="#a855f7" fontSize="8" fontWeight="bold">
                    y(t) = v₀·t - ½g·t²
                  </text>
                </g>

                {/* Right Orbital Orbit Ring & Floating Apple */}
                <g transform="translate(130, -10)">
                  <ellipse cx="0" cy="0" rx="35" ry="15" stroke="rgba(34,211,238,0.3)" strokeWidth="0.8" strokeDasharray="3,2" />
                  <g className="aegis-apple-float" transform="translate(15, -6)">
                    <circle cx="0" cy="0" r="9" fill="#ef4444" filter={`url(#${uid}-neon)`} />
                    <path d="M 0 -8 Q 3 -13 7 -14" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M 1 -11 Q 8 -10 7 -6 Z" fill="#22c55e" />
                    <circle cx="-3" cy="-3" r="2.2" fill="#ffffff" opacity="0.6" />
                  </g>
                </g>
            </g>

            {/* ─── 6. WAVE / GREETING RADAR EXPANSION RINGS ─── */}
            <g className={`aegis-hud-layer ${activePose === 'wave' ? 'is-on' : ''}`} stroke="rgba(0,229,255,0.22)" strokeWidth="0.9" fill="none">
                <circle cx="21" cy="91" r="30" strokeDasharray="4,4" />
                <circle cx="21" cy="91" r="60" strokeDasharray="5,5" opacity="0.6" />
                <circle cx="21" cy="91" r="95" strokeDasharray="6,6" opacity="0.35" />
            </g>

            <g className={`aegis-hud-layer ${isWalk ? 'is-on' : ''}`}>
                <text x="-80" y="-18" fill="#00e5ff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  v = 1.2 m/s  ·  gait cycle
                </text>
            </g>

            <g className={`aegis-hud-layer ${isRun ? 'is-on' : ''}`}>
                <g stroke="#00e5ff" strokeWidth="1.4" strokeLinecap="round">
                  <line className="aegis-speed-line" x1="40" y1="30" x2="90" y2="30" opacity="0.5" />
                  <line className="aegis-speed-line" x1="55" y1="48" x2="120" y2="48" opacity="0.35" style={{ animationDelay: '0.12s' }} />
                  <line className="aegis-speed-line" x1="30" y1="66" x2="95" y2="66" opacity="0.4" style={{ animationDelay: '0.22s' }} />
                </g>
                <text x="-80" y="-18" fill="#00e5ff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  v = 3.8 m/s  ·  Fr = μN
                </text>
            </g>

            <g className={`aegis-hud-layer ${isJump ? 'is-on' : ''}`}>
                <ellipse className="aegis-dust" cx="50" cy="118" rx="22" ry="4" fill="none" stroke="#00e5ff" strokeWidth="1" />
                <text x="-80" y="-16" fill="#facc15" fontSize="9" fontFamily="monospace" fontWeight="bold">h(t) = v₀t − ½gt²</text>
            </g>

            <g className={`aegis-hud-layer ${isApple ? 'is-on' : ''}`}>
                <path d="M 8 -40 C 8 -18 22 -14 28 -8" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
                <ellipse cx="4" cy="-22" rx="14" ry="8" fill="#166534" opacity="0.85" />
                <ellipse cx="18" cy="-28" rx="11" ry="7" fill="#15803d" opacity="0.9" />
                <text x="100" y="-12" fill="#facc15" fontSize="10" fontFamily="monospace" fontWeight="bold">F = mg</text>
                <text x="100" y="6" fill="#38bdf8" fontSize="8" fontFamily="monospace">g = 9.80665 m/s²</text>
            </g>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            LAYER 2: MAIN UNIFIED AEGIS ROBOT CHARACTER (CENTER STAGE)
        ════════════════════════════════════════════════════════════════════════ */}
        <g className="aegis-sway">
        <g className={`aegis-actor aegis-act-${activePose}`}>
        <g className="aegis-lean">
        <g className="aegis-body-rig">

        <g className={`aegis-jet-wrap ${isWalk || isRun ? 'aegis-jet-dim' : ''}`}>
          <g className="aegis-jet-glow" filter={`url(#${uid}-neon)`}>
            <ellipse cx="50" cy="94" rx="9.5" ry="3.5" fill="#00e5ff" opacity="0.65" />
            <ellipse cx="50" cy="95" rx="4.5" ry="1.8" fill="#ffffff" opacity="0.85" />
          </g>
        </g>

        {/* ─── ROBOT BODY / TORSO ─── */}
        <path
          d="M 38 72 C 38 68 62 68 62 72 L 64 88 C 64 92 36 92 36 88 Z"
          fill={`url(#${uid}-body)`}
          stroke="#00e5ff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Chest Arc Reactor Core */}
        <circle cx="50" cy="80" r="4" fill={`url(#${uid}-arc)`} filter={`url(#${uid}-neon)`} />
        <circle cx="50" cy="80" r="1.8" fill="#ffffff" />

        {/* ─── SIDE EAR HEADPHONE PODS (Left & Right) ─── */}
        {/* Left Ear Pod */}
        <rect
          x="15"
          y="35"
          width="8"
          height="18"
          rx="4"
          fill="#0a192e"
          stroke="#00e5ff"
          strokeWidth="1.8"
          filter={`url(#${uid}-neon)`}
        />
        <circle cx="19" cy="44" r="2" fill="#00e5ff" opacity="0.85" />

        {/* Right Ear Pod */}
        <rect
          x="77"
          y="35"
          width="8"
          height="18"
          rx="4"
          fill="#0a192e"
          stroke="#00e5ff"
          strokeWidth="1.8"
          filter={`url(#${uid}-neon)`}
        />
        <circle cx="81" cy="44" r="2" fill="#00e5ff" opacity="0.85" />

        {/* ─── MAIN ROUNDED CYBER HELMET / HEAD ─── */}
        <rect
          x="20"
          y="15"
          width="60"
          height="54"
          rx="22"
          fill={`url(#${uid}-armor)`}
          stroke="#00e5ff"
          strokeWidth="2.4"
          filter={`url(#${uid}-neon)`}
        />

        {/* Top Antenna Node */}
        <path d="M 50 15 L 50 8" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="7" r="2.8" fill="#00e5ff" filter={`url(#${uid}-neon)`} />
        <circle cx="50" cy="7" r="1.2" fill="#ffffff" />

        {/* ─── INNER VISOR GLASS SCREEN ─── */}
        <rect
          x="26"
          y="22"
          width="48"
          height="40"
          rx="15"
          fill={`url(#${uid}-glass)`}
          stroke="rgba(0,229,255,0.4)"
          strokeWidth="1.2"
        />

        {/* Visor Curved Glass Gloss Reflection */}
        <path
          d="M 28 26 C 36 23 64 23 72 26 C 68 36 40 38 28 26 Z"
          fill={`url(#${uid}-gloss)`}
        />

        {/* Eyes stay mounted — apple pose only overlays dazed marks */}
        <g className="aegis-eye-blink-anim">
          <ellipse cx="40" cy="42" rx="6.5" ry="8" fill="#00e5ff" filter={`url(#${uid}-neon)`} />
          <circle cx="38" cy="39.5" r="2.4" fill="#ffffff" />
          <circle cx="42" cy="44.5" r="1.1" fill="#ffffff" opacity="0.8" />
        </g>
        <g className="aegis-eye-blink-anim">
          <ellipse cx="60" cy="42" rx="6.5" ry="8" fill="#00e5ff" filter={`url(#${uid}-neon)`} />
          <circle cx="58" cy="39.5" r="2.4" fill="#ffffff" />
          <circle cx="62" cy="44.5" r="1.1" fill="#ffffff" opacity="0.8" />
        </g>
        <g className="aegis-dazed" fill="#facc15">
          <text x="34" y="46" fontSize="11" fontWeight="900">✕</text>
          <text x="54" y="46" fontSize="11" fontWeight="900">✕</text>
        </g>

        {/* ─── BLUSHING CHEEKS ─── */}
        <circle cx="30" cy="50" r="3.2" fill="#00e5ff" opacity={activePose === 'wave' ? 0.55 : 0.28} />
        <circle cx="70" cy="50" r="3.2" fill="#00e5ff" opacity={activePose === 'wave' ? 0.55 : 0.28} />

        <path
          d={isHovered || activePose === 'wave' ? 'M 42 53 Q 50 62 58 53' : activePose === 'calculation' ? 'M 47 54 Q 50 58 53 54' : 'M 43 54 Q 50 60 57 54'}
          stroke="#00e5ff"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
          filter={`url(#${uid}-neon)`}
        />
        <ellipse
          cx="50"
          cy="55"
          rx="2.6"
          ry="3.6"
          fill="#00e5ff"
          opacity={activePose === 'calculation' ? 0.85 : 0}
          filter={`url(#${uid}-neon)`}
          style={{ transition: 'opacity 0.3s ease' }}
        />

        <g className="aegis-arm-l">
          <path d="M 36 76 Q 24 82 22 90" stroke="#00e5ff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="21" cy="91" r="3.6" fill="#0c1f36" stroke="#00e5ff" strokeWidth="1.5" />
        </g>
        <g className={`aegis-arm-r ${activePose === 'blueprint' || activePose === 'calculation' ? 'aegis-laser-hand' : ''}`}>
          <path d="M 64 76 Q 76 82 78 90" stroke="#00e5ff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="79" cy="91" r="3.6" fill="#0c1f36" stroke="#00e5ff" strokeWidth="1.5" />
        </g>

        <g className="aegis-star-spin">
          <polygon points="50,2 52,8 58,8 53,12 55,18 50,14 45,18 47,12 42,8 48,8" fill="#facc15" />
          <polygon points="66,10 67.5,14 72,14 68.5,16.5 70,21 66,18 62,21 63.5,16.5 60,14 64.5,14" fill="#fde047" />
          <polygon points="34,10 35.5,14 40,14 36.5,16.5 38,21 34,18 30,21 31.5,16.5 28,14 32.5,14" fill="#fde047" />
        </g>
        </g>

        <g className="aegis-leg-l">
          <path d="M 43 88 L 38 104 L 33 110" stroke="#00e5ff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="31" cy="111" rx="5.5" ry="2.1" fill="#0c1f36" stroke="#00e5ff" strokeWidth="1.3" />
        </g>
        <g className="aegis-leg-r">
          <path d="M 57 88 L 62 104 L 67 110" stroke="#00e5ff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="69" cy="111" rx="5.5" ry="2.1" fill="#0c1f36" stroke="#00e5ff" strokeWidth="1.3" />
        </g>

        <g className="aegis-apple-prop">
          <circle cx="50" cy="10" r="8.5" fill="#ef4444" />
          <path d="M 50 2 Q 54 -4 59 -5" stroke="#78350f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 51 1 Q 58 0 57 5 Z" fill="#22c55e" />
          <circle cx="47" cy="8" r="2" fill="#ffffff" opacity="0.45" />
        </g>
        </g>
        </g>
        </g>
      </svg>
    </div>
  );
}

export default AegisMascot;

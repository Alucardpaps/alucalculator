'use client';

import React from 'react';

interface AegisIconProps {
  size?: number;
  className?: string;
  /** 'idle' = slow ambient pulse | 'active' = fast orbit + glow | 'thinking' = rapid spin | 'tracking' = flight mode */
  mode?: 'idle' | 'active' | 'thinking' | 'tracking';
  /** If true, renders only the core hexagon brand mark (no limbs or swarm) */
  pure?: boolean;
}

export function AegisIcon({ size = 32, className = '', mode = 'idle', pure }: AegisIconProps) {
  const s = size;
  const cx = 100;
  const cy = 100;
  const r = 70; // Expanded core radius (from 45 to 70) for high visibility

  // Auto-enable pure mode for tiny sizes (<= 24) to keep icons clear and legible
  const isPure = pure ?? (s <= 24);

  const orbitDur = mode === 'thinking' ? '0.8s' : mode === 'active' ? '2s' : mode === 'tracking' ? '1.5s' : '4s';
  const pulseDur = mode === 'thinking' ? '0.5s' : mode === 'tracking' ? '1s' : '2s';
  const glowOpacity = mode === 'active' || mode === 'thinking' ? '0.9' : mode === 'tracking' ? '0.8' : '0.6';

  // Dynamic eye and face values based on mode
  let leftEye, rightEye, mouth, eyebrows;

  if (mode === 'thinking') {
    // Digital scanning lines for eyes
    leftEye = (
      <g key="eye-l">
        <line x1="74" y1="92" x2="88" y2="92" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" />
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
      </g>
    );
    rightEye = (
      <g key="eye-r">
        <line x1="112" y1="92" x2="126" y2="92" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" />
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
      </g>
    );
    // Concentrating eyebrows
    eyebrows = (
      <g key="brows" stroke="#00e5ff" strokeWidth="2.0" strokeLinecap="round" opacity="0.8">
        <line x1="72" y1="84" x2="88" y2="88" />
        <line x1="112" y1="88" x2="128" y2="84" />
      </g>
    );
    // Flat load-pulse mouth
    mouth = (
      <line key="mouth" x1="90" y1="110" x2="110" y2="110" stroke="#00e5ff" strokeWidth="3.0" strokeLinecap="round" strokeDasharray="4,2">
        <animate attributeName="stroke-dashoffset" values="0;6" dur="0.5s" repeatCount="indefinite" />
      </line>
    );
  } else if (mode === 'active') {
    // Happy, large round eyes
    leftEye = (
      <circle key="eye-l" cx="81" cy="92" r="6.5" fill="#00e5ff" filter="url(#aegis-glow-inner)">
        <animate attributeName="r" values="6.5;6.5;1;6.5;6.5" dur="3s" repeatCount="indefinite" />
      </circle>
    );
    rightEye = (
      <circle key="eye-r" cx="119" cy="92" r="6.5" fill="#00e5ff" filter="url(#aegis-glow-inner)">
        <animate attributeName="r" values="6.5;6.5;1;6.5;6.5" dur="3s" repeatCount="indefinite" />
      </circle>
    );
    // Happy raised eyebrows
    eyebrows = (
      <g key="brows" stroke="#00e5ff" strokeWidth="2.0" strokeLinecap="round" opacity="0.9">
        <path d="M 72 82 Q 81 75 90 82" fill="none" />
        <path d="M 110 82 Q 119 75 128 82" fill="none" />
      </g>
    );
    // Big open smile
    mouth = (
      <path key="mouth" d="M 90 106 Q 100 122 110 106 Z" fill="#00e5ff" opacity="0.95" />
    );
  } else if (mode === 'tracking') {
    // Focused eyes
    leftEye = (
      <ellipse key="eye-l" cx="81" cy="92" rx="5.5" ry="5.5" fill="#00e5ff" filter="url(#aegis-glow-inner)" />
    );
    rightEye = (
      <ellipse key="eye-r" cx="119" cy="92" rx="5.5" ry="5.5" fill="#00e5ff" filter="url(#aegis-glow-inner)" />
    );
    // Focused eyebrows
    eyebrows = (
      <g key="brows" stroke="#00e5ff" strokeWidth="2.0" strokeLinecap="round" opacity="0.85">
        <line x1="72" y1="83" x2="88" y2="81" />
        <line x1="112" y1="81" x2="128" y2="83" />
      </g>
    );
    // Focused mouth
    mouth = (
      <path key="mouth" d="M 92 108 Q 100 114 108 108" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
    );
  } else {
    // Default Idle: Cute blinking eyes
    leftEye = (
      <ellipse key="eye-l" cx="81" cy="92" rx="5" ry="5" fill="#00e5ff">
        <animate attributeName="ry" values="5;5;0.2;5;5" dur="4s" repeatCount="indefinite" />
      </ellipse>
    );
    rightEye = (
      <ellipse key="eye-r" cx="119" cy="92" rx="5" ry="5" fill="#00e5ff">
        <animate attributeName="ry" values="5;5;0.2;5;5" dur="4s" repeatCount="indefinite" />
      </ellipse>
    );
    // Relaxed eyebrows
    eyebrows = (
      <g key="brows" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="73" y1="82" x2="89" y2="82" />
        <line x1="111" y1="82" x2="127" y2="82" />
      </g>
    );
    // Sweet smile
    mouth = (
      <path key="mouth" d="M 91 108 Q 100 118 109 108" fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
    );
  }

  // Dynamic arm animations based on mode
  let leftArm, rightArm;

  if (mode === 'thinking') {
    // Left arm taps head (thinking gesture)
    leftArm = (
      <g key="arm-l">
        <path d="M 39.38 100 Q 22 75 40 55" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="40" cy="55" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 39.38 100; 12 39.38 100; -8 39.38 100; 12 39.38 100; 0 39.38 100" 
          dur="1.5s" 
          repeatCount="indefinite" 
        />
      </g>
    );
    // Right arm scratch/shrug gesture
    rightArm = (
      <g key="arm-r">
        <path d="M 160.62 100 Q 175 110 180 120" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="180" cy="120" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 160.62 100; -10 160.62 100; 10 160.62 100; 0 160.62 100" 
          dur="2s" 
          repeatCount="indefinite" 
        />
      </g>
    );
  } else if (mode === 'active') {
    // Both arms cheer excitedly (dancing / celebrating!)
    leftArm = (
      <g key="arm-l">
        <path d="M 39.38 100 Q 20 85 15 65" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="15" cy="65" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 39.38 100; 25 39.38 100; -15 39.38 100; 0 39.38 100" 
          dur="1s" 
          repeatCount="indefinite" 
        />
      </g>
    );
    rightArm = (
      <g key="arm-r">
        <path d="M 160.62 100 Q 180 85 185 65" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="185" cy="65" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 160.62 100; -25 160.62 100; 15 160.62 100; 0 160.62 100" 
          dur="1s" 
          repeatCount="indefinite" 
        />
      </g>
    );
  } else if (mode === 'tracking') {
    // Both arms sweep back for flight streamlined pose
    leftArm = (
      <g key="arm-l">
        <path d="M 39.38 100 Q 22 110 15 125" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="15" cy="125" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 39.38 100; -5 39.38 100; 5 39.38 100; 0 39.38 100" 
          dur="1.2s" 
          repeatCount="indefinite" 
        />
      </g>
    );
    rightArm = (
      <g key="arm-r">
        <path d="M 160.62 100 Q 178 110 185 125" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="185" cy="125" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 160.62 100; 5 160.62 100; -5 160.62 100; 0 160.62 100" 
          dur="1.2s" 
          repeatCount="indefinite" 
        />
      </g>
    );
  } else {
    // Default Idle: Left arm gently sways, Right arm waves intermittently (2s wave, 6s rest)
    leftArm = (
      <g key="arm-l">
        <path d="M 39.38 100 Q 25 104 20 118" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="20" cy="118" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 39.38 100; -8 39.38 100; 0 39.38 100" 
          dur="3.2s" 
          repeatCount="indefinite" 
        />
      </g>
    );
    rightArm = (
      <g key="arm-r">
        <path d="M 160.62 100 Q 175 92 180 74" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.85" />
        <circle cx="180" cy="74" r="3" fill="#00e5ff" />
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="0 160.62 100; -28 160.62 100; 12 160.62 100; -28 160.62 100; 0 160.62 100; 3 160.62 100; 0 160.62 100; 0 160.62 100" 
          keyTimes="0; 0.05; 0.12; 0.18; 0.25; 0.5; 0.75; 1"
          dur="8s" 
          repeatCount="indefinite" 
        />
      </g>
    );
  }

  // Sweep legs back in tracking flight mode
  const leftLegRotate = mode === 'tracking' ? '12 75 155; 8 75 155; 12 75 155' : '-6 75 155; 4 75 155; -6 75 155';
  const rightLegRotate = mode === 'tracking' ? '-12 125 155; -8 125 155; -12 125 155' : '6 125 155; -4 125 155; 6 125 155';
  const legDur = mode === 'tracking' ? '1.5s' : '2.8s';

  // Dynamic thruster flame scaling and pulsing
  const flameRyValues = mode === 'tracking' ? '9;17;9' : mode === 'thinking' ? '8;13;8' : '6;11;6';
  const flameRxValues = mode === 'tracking' ? '4;6.5;4' : mode === 'thinking' ? '3.8;5.5;3.8' : '3.5;5;3.5';
  const flameDur = mode === 'tracking' ? '0.15s' : mode === 'thinking' ? '0.2s' : '0.3s';
  const flameBaseRy = mode === 'tracking' ? 12 : mode === 'thinking' ? 10 : 8;
  const flameBaseRx = mode === 'tracking' ? 5 : mode === 'thinking' ? 4.5 : 4.5;

  // Toggle viewBox to crop tightly in pure mode (keeps logo large and readable)
  const viewBox = isPure ? '25 25 150 150' : '0 0 200 200';

  return (
    <svg
      width={s}
      height={s}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AeGiS Copilot Pet"
    >
      <defs>
        {/* Core glow filter */}
        <filter id="aegis-glow-inner" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Core radial gradient */}
        <radialGradient id="aegis-core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        {/* Thruster Flame Gradient */}
        <linearGradient id="thruster-flame" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="1" />
          <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>

        {/* Orbit gradient */}
        <linearGradient id="aegis-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── BACKGROUND SWARM / CHILDREN (Hidden in Pure Mode) ── */}
      {!isPure && (
        <>
          {/* Child 1: Left-Top */}
          <g>
            <polygon 
              points="25,25 33.66,30 33.66,40 25,45 16.34,40 16.34,30" 
              fill="rgba(0, 229, 255, 0.15)" 
              stroke="#00e5ff" 
              strokeWidth="1.5" 
              strokeOpacity="0.6"
            />
            <circle cx="25" cy="35" r="1.5" fill="#00e5ff" opacity="0.8" />
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; -6,-8; 4,4; 0,0" 
              dur="6s" 
              repeatCount="indefinite" 
            />
          </g>

          {/* Child 2: Right-Top */}
          <g>
            <polygon 
              points="175,20 181.9,24 181.9,32 175,36 168.1,32 168.1,24" 
              fill="rgba(0, 229, 255, 0.1)" 
              stroke="#00e5ff" 
              strokeWidth="1.2" 
              strokeOpacity="0.5"
            />
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; 5,-4; -3,6; 0,0" 
              dur="5s" 
              repeatCount="indefinite" 
            />
          </g>

          {/* Child 3: Right-Bottom */}
          <g>
            <polygon 
              points="170,135 180.4,141 180.4,153 170,159 159.6,153 159.6,141" 
              fill="rgba(0, 229, 255, 0.18)" 
              stroke="#00e5ff" 
              strokeWidth="1.5" 
              strokeOpacity="0.7"
            />
            <circle cx="170" cy="147" r="2" fill="#00e5ff" opacity="0.8" />
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; -4,8; 6,-4; 0,0" 
              dur="7s" 
              repeatCount="indefinite" 
            />
          </g>
        </>
      )}

      {/* ── MAIN BODY GROUP (Hover bouncing, offset animation) ── */}
      <g>
        {!isPure && (
          <animateTransform 
            attributeName="transform" 
            type="translate" 
            values="0,0; 0,-5; 0,0" 
            dur={mode === 'thinking' ? '1.5s' : '3s'} 
            repeatCount="indefinite" 
          />
        )}

        {/* ── Thruster Jet (Hidden in Pure Mode) ── */}
        {!isPure && (
          <g>
            {/* Metal nozzle */}
            <path d="M 92 162 L 108 162 L 100 168 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            {/* Pulsing flame */}
            <ellipse cx="100" cy={166 + flameBaseRy} rx={flameBaseRx} ry={flameBaseRy} fill="url(#thruster-flame)" filter="url(#aegis-glow-inner)">
              <animate attributeName="ry" values={flameRyValues} dur={flameDur} repeatCount="indefinite" />
              <animate attributeName="rx" values={flameRxValues} dur={flameDur} repeatCount="indefinite" />
            </ellipse>
          </g>
        )}

        {/* ── Left Dangling Leg (Hidden in Pure Mode) ── */}
        {!isPure && (
          <g>
            <path d="M 75 155 Q 70 172 65 184 L 57 186" fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              values={leftLegRotate} 
              dur={legDur} 
              repeatCount="indefinite" 
            />
          </g>
        )}

        {/* ── Right Dangling Leg (Hidden in Pure Mode) ── */}
        {!isPure && (
          <g>
            <path d="M 125 155 Q 130 172 135 184 L 143 186" fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              values={rightLegRotate} 
              dur={legDur} 
              repeatCount="indefinite" 
            />
          </g>
        )}

        {/* ── Left Arm (Gently swaying, Hidden in Pure Mode) ── */}
        {!isPure && leftArm}

        {/* ── Right Arm (Waving!, Hidden in Pure Mode) ── */}
        {!isPure && rightArm}

        {/* ── Outer Ambient Ring ── */}
        <circle cx={cx} cy={cy} r={r * 1.15}
          stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0.12"
          strokeDasharray="12 6" fill="none">
          <animateTransform attributeName="transform" type="rotate"
            from="0 100 100" to="360 100 100" dur="15s"
            repeatCount="indefinite" />
        </circle>

        {/* ── Hexagon Core Shield ── */}
        <polygon 
          points="160.62,65.00 160.62,135.00 100.00,170.00 39.38,135.00 39.38,65.00 100.00,30.00"
          fill="#030712" 
          stroke="#00e5ff" 
          strokeWidth="3" 
          strokeOpacity="0.75" 
          filter="url(#aegis-glow-inner)"
        />

        {/* ── Inner Hex Screen ── */}
        <polygon 
          points="143.30,75.00 143.30,125.00 100.00,150.00 56.70,125.00 56.70,75.00 100.00,50.00"
          fill="#070f1e" 
          stroke="#00e5ff" 
          strokeWidth="1.5" 
          strokeOpacity="0.3" 
        />

        {/* ── Neural Circuit Lines ── */}
        <g opacity="0.15">
          <line x1="100" y1="100" x2="143.30" y2="75" stroke="#00e5ff" strokeWidth="1" />
          <line x1="100" y1="100" x2="143.30" y2="125" stroke="#00e5ff" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="150" stroke="#00e5ff" strokeWidth="1" />
          <line x1="100" y1="100" x2="56.70" y2="125" stroke="#00e5ff" strokeWidth="1" />
          <line x1="100" y1="100" x2="56.70" y2="75" stroke="#00e5ff" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="50" stroke="#00e5ff" strokeWidth="1" />
        </g>

        {/* ── Spinning Orbit Arc ── */}
        <circle cx={cx} cy={cy} r={r * 0.52}
          fill="none" stroke="url(#aegis-orbit-grad)"
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="25 60">
          <animateTransform attributeName="transform" type="rotate"
            from="0 100 100" to="360 100 100" dur={orbitDur}
            repeatCount="indefinite" />
        </circle>

        {/* ── Core Glow Pulse ── */}
        <circle cx={cx} cy={cy} r={r * 0.28}
          fill="url(#aegis-core-grad)" opacity={glowOpacity}>
          <animate attributeName="r" values="14;20;14"
            dur={pulseDur} repeatCount="indefinite" />
          <animate attributeName="opacity"
            values={`${parseFloat(glowOpacity) * 0.6};${glowOpacity};${parseFloat(glowOpacity) * 0.6}`}
            dur={pulseDur} repeatCount="indefinite" />
        </circle>

        {/* ── Center Dot Core ── */}
        <circle cx={cx} cy={cy} r="4" fill="#00e5ff" filter="url(#aegis-glow-inner)" />

        {/* ── Robotic Face Features ── */}
        <g id="aegis-face">
          {/* Subtle robotic look-around gaze shift */}
          <animateTransform 
            attributeName="transform" 
            type="translate" 
            values="0,0; 1.5,-0.5; -1.5,0.5; 0,1; 0,0" 
            dur="5s" 
            repeatCount="indefinite" 
          />
          {eyebrows}
          {leftEye}
          {rightEye}
          {mouth}
        </g>
      </g>
    </svg>
  );
}

export default AegisIcon;

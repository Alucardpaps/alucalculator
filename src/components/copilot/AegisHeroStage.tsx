'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AegisMascot, type AegisPose } from './AegisMascot';

const POSE_LABEL: Record<string, string> = {
  blueprint: 'CAD B-REP · ISO 2768',
  calculation: 'TENSOR SOLVE · σ_vm',
  einstein: 'RELATIVITY · Gμν',
  tesla: 'EM FLUX · 1.21 GW',
  newton: 'BALLISTICS · g=9.80665',
  wave: 'LINK UP · HANDSHAKE',
  idle: 'STANDBY · NOMINAL',
  thinking: 'REASONING STREAM',
  celebrate: 'SOLVE LOCKED',
  walk: 'GAIT CYCLE · 1.2 m/s',
  run: 'SPRINT · 3.8 m/s',
  jump: 'BALLISTIC · Δh CLEAR',
  apple: 'NEWTON IMPACT · mg',
};

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${10 + ((i * 23) % 72)}%`,
  size: 2 + (i % 3),
  dur: `${4.2 + (i % 5) * 0.7}s`,
  mx: `${(i % 2 === 0 ? 10 : -12) + (i % 5)}px`,
  my: `${-10 - (i % 7) * 3}px`,
  delay: `${(i % 6) * 0.35}s`,
}));

export function AegisHeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<AegisPose>('walk');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const label = useMemo(() => POSE_LABEL[pose] ?? POSE_LABEL.idle, [pose]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setTilt({ x: nx * 6, y: ny * -5 });
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="aegis-hero-stage relative w-full h-full min-h-[200px] overflow-hidden rounded-[var(--radius-s)] bg-[var(--bg-0)]"
    >
      <div className="pointer-events-none absolute inset-0 aegis-hero-floor opacity-40" />

      {/* Clean Technical Orbit Ring */}
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="aegis-orbit-slow h-40 w-40 rounded-full border border-[var(--line)] border-dashed" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="aegis-orbit-rev h-28 w-28 rounded-full border border-[var(--cyan)]/20" />
      </div>

      <div className="pointer-events-none absolute inset-x-6 top-0 h-10 overflow-hidden">
        <div className="aegis-scan-line h-8 w-full bg-gradient-to-b from-transparent via-[var(--cyan)]/15 to-transparent" />
      </div>

      <motion.div
        className="relative z-10 flex h-[82%] items-center justify-center pt-2"
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: 'spring', stiffness: 70, damping: 22, mass: 0.8 }}
        style={{ transformPerspective: 700 }}
      >
        <AegisMascot className="h-full w-full" variant="panoramic" pose="auto" onPoseChange={setPose} />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-1.5 z-20 flex items-center justify-center">
        <div className="rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[var(--cyan)] overflow-hidden">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="inline-block"
          >
            {label}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

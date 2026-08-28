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
      className="aegis-hero-stage relative w-full h-56 sm:h-64 overflow-hidden rounded-xl"
    >
      <div className="pointer-events-none absolute inset-0 aegis-hero-floor opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-2 h-10 aegis-cloud-drift opacity-40">
        <div className="absolute left-[8%] top-1 h-3 w-16 rounded-full bg-cyan-200/15 blur-[1px]" />
        <div className="absolute left-[42%] top-0 h-4 w-24 rounded-full bg-sky-200/12 blur-[1px]" />
        <div className="absolute right-[12%] top-2 h-3 w-14 rounded-full bg-cyan-100/12 blur-[1px]" />
      </div>

      <div className="pointer-events-none absolute inset-x-[8%] bottom-2 h-24 aegis-beam bg-gradient-to-t from-cyan-400/25 via-cyan-400/8 to-transparent blur-md" />

      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="aegis-orbit-slow h-48 w-48 rounded-full border border-cyan-400/15 border-dashed" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="aegis-orbit-rev h-36 w-36 rounded-full border border-cyan-300/25" style={{ borderTopColor: 'rgba(0,229,255,0.65)', borderBottomColor: 'transparent' }} />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="aegis-orbit h-24 w-24 rounded-full border border-sky-400/20" style={{ borderRightColor: 'rgba(56,189,248,0.7)', borderLeftColor: 'transparent' }} />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[58%] h-16 w-40 -translate-x-1/2 rounded-[100%] bg-cyan-400/20 blur-2xl aegis-bloom" />

      <div className="pointer-events-none absolute inset-x-6 top-0 h-10 overflow-hidden">
        <div className="aegis-scan-line h-10 w-full bg-gradient-to-b from-transparent via-cyan-300/25 to-transparent" />
      </div>

      {MOTES.map((m) => (
        <span
          key={m.id}
          className="aegis-mote pointer-events-none absolute rounded-full bg-cyan-300"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            '--dur': m.dur,
            '--mx': m.mx,
            '--my': m.my,
            animationDelay: m.delay,
            boxShadow: '0 0 8px rgba(0,229,255,0.8)',
          } as React.CSSProperties}
        />
      ))}

      <motion.div
        className="relative z-10 flex h-[78%] items-center justify-center"
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: 'spring', stiffness: 70, damping: 22, mass: 0.8 }}
        style={{ transformPerspective: 700 }}
      >
        <AegisMascot className="h-full w-full" variant="panoramic" pose="auto" onPoseChange={setPose} />
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-1.5 z-20 flex items-center justify-center">
        <div className="rounded-full border border-cyan-400/25 bg-black/55 px-3 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-cyan-300/90 backdrop-blur-md overflow-hidden">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="inline-block"
          >
            {label}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * AeGiS — AluCalc's engineering companion (v6 redesign).
 *
 * "Floating parts" character: a glossy capsule head that levitates above an egg-shaped
 * body, flipper arms that hover beside it and a small thruster underneath. Each part
 * floats with a slight delay (follow-through), the head turns with layered parallax and
 * the OLED face carries the expressions.
 *
 * Public API is unchanged (props, poses, playMascotChirp) so every caller keeps working.
 *  - Colours: --ag-* tokens in styles/themes.css (dark: titanium, light: white ceramic).
 *  - Gaze: inherited --lx/--ly CSS variables (set by the page without React renders) or
 *    the `lookAt` prop.
 *  - Motion pauses off-screen / in background tabs and stops for prefers-reduced-motion.
 *  - Sound: one shared AudioContext, silent until the visitor interacts, mutable.
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './AegisMascot.module.css';

export type AegisPose =
  | 'idle'
  | 'wave'
  | 'blueprint'
  | 'calculation'
  | 'celebrate'
  | 'tesla'
  | 'newton'
  | 'cad3d'
  | 'laser'
  | 'quest'
  | 'einstein'
  | 'walk'
  | 'thinking'
  | 'speaking'
  | 'listening'
  | 'error'
  | 'auto';

export type AegisBodyPart = 'visor' | 'heart' | 'leftHand' | 'rightHand';

export interface AegisMascotProps {
  size?: number;
  /** fill the parent's width (square, aspect-ratio 1) instead of a fixed px size */
  fluid?: boolean;
  variant?: 'full' | 'compact' | 'face' | 'panoramic';
  className?: string;
  isHovered?: boolean;
  /** Normalised gaze target (-1…1). When omitted the mascot inherits --lx/--ly from the page. */
  lookAt?: { x: number; y: number } | null;
  pose?: AegisPose;
  soundEnabled?: boolean;
  interactive?: boolean;
  onPoseChange?: (activePose: Exclude<AegisPose, 'auto'>) => void;
  onPartInteract?: (part: AegisBodyPart, messageTr: string, messageEn: string) => void;
  /** Hide hand-held props (holograms, tools). Arm poses and celebration stay. */
  clean?: boolean;
  emotion?: 'normal' | 'happy' | 'curious' | 'wink' | 'celebrate';
  squashStretch?: { sx: number; sy: number };
}

type Pose = Exclude<AegisPose, 'auto' | 'einstein' | 'walk'>;
type Expression = 'normal' | 'happy' | 'curious' | 'wink' | 'focused' | 'thinking' | 'speaking' | 'error';

const AUTO_POSE_SEQUENCE: Array<Exclude<AegisPose, 'auto'>> = [
  'blueprint',
  'cad3d',
  'laser',
  'calculation',
  'tesla',
  'newton',
  'quest',
  'celebrate',
  'wave',
];

// ─── sound ──────────────────────────────────────────────────────────────────

const SOUND_KEY = 'alucalc-ui-sound';
let sharedAudio: AudioContext | null = null;

export function isMascotSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setMascotSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('alucalc-ui-sound', { detail: on }));
  } catch {
    /* storage unavailable */
  }
}

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  // Never start audio before the visitor has interacted with the page.
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (activation && !activation.hasBeenActive) return null;
  try {
    if (!sharedAudio) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      sharedAudio = new Ctor();
    }
    if (sharedAudio.state === 'suspended') void sharedAudio.resume().catch(() => undefined);
    return sharedAudio.state === 'closed' ? null : sharedAudio;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, peak: number, glideTo?: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur * 0.9);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Short synthesized chime. Silent until the visitor has interacted with the page. */
export function playMascotChirp(
  freq = 880,
  type: 'ping' | 'solve' | 'calc' | 'laser' | 'overdrive' = 'ping'
) {
  if (typeof window === 'undefined' || !isMascotSoundEnabled()) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + 0.01;
    if (type === 'solve') {
      [587.33, 880, 1174.66].forEach((f, i) => tone(ctx, f, now + i * 0.055, 0.14, 'sine', 0.02));
    } else if (type === 'overdrive') {
      [440, 554.37, 659.25, 880].forEach((f, i) => tone(ctx, f, now + i * 0.04, 0.14, 'triangle', 0.02));
    } else if (type === 'laser') {
      tone(ctx, 1320, now, 0.12, 'sawtooth', 0.012, 520);
    } else if (type === 'calc') {
      [740, 987.77].forEach((f, i) => tone(ctx, f, now + i * 0.045, 0.09, 'triangle', 0.016));
    } else {
      tone(ctx, freq, now, 0.1, 'sine', 0.02, freq * 1.35);
    }
  } catch {
    /* ignore audio failures */
  }
}

// ─── hooks ──────────────────────────────────────────────────────────────────

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

/** true while the element is on screen and the tab is visible */
function useActive(ref: React.RefObject<HTMLElement | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return onScreen && pageVisible;
}

/** Random blinks and idle saccades written straight to the DOM (no React renders). */
function useLife(ref: React.RefObject<HTMLElement | null>, enabled: boolean, saccades: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let blinkTimer: ReturnType<typeof setTimeout>;
    let sacTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      el.classList.add(styles.blink);
      closeTimer = setTimeout(() => {
        el.classList.remove(styles.blink);
        if (Math.random() < 0.18) {
          closeTimer = setTimeout(() => {
            el.classList.add(styles.blink);
            closeTimer = setTimeout(() => el.classList.remove(styles.blink), 110);
          }, 150);
        }
      }, 120);
      blinkTimer = setTimeout(blink, 2600 + Math.random() * 3800);
    };
    blinkTimer = setTimeout(blink, 1200 + Math.random() * 2000);
    const saccade = () => {
      if (Math.random() < 0.35) {
        el.style.setProperty('--sx', '0');
        el.style.setProperty('--sy', '0');
      } else {
        el.style.setProperty('--sx', ((Math.random() - 0.5) * 0.7).toFixed(2));
        el.style.setProperty('--sy', ((Math.random() - 0.5) * 0.45).toFixed(2));
      }
      sacTimer = setTimeout(saccade, 1700 + Math.random() * 2800);
    };
    if (saccades) sacTimer = setTimeout(saccade, 1500);
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(sacTimer);
      clearTimeout(closeTimer);
      el.classList.remove(styles.blink);
      el.style.removeProperty('--sx');
      el.style.removeProperty('--sy');
    };
  }, [ref, enabled, saccades]);
}

// ─── geometry ───────────────────────────────────────────────────────────────

function gearPath(rOuter: number, rInner: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a1 = i * step - step * 0.34;
    const a2 = i * step + step * 0.34;
    pts.push(`${i === 0 ? 'M' : 'L'}${(Math.cos(a1) * r).toFixed(2)} ${(Math.sin(a1) * r).toFixed(2)}`);
    pts.push(`L${(Math.cos(a2) * r).toFixed(2)} ${(Math.sin(a2) * r).toFixed(2)}`);
  }
  return pts.join(' ') + 'Z';
}

const MAIN_GEAR = gearPath(12.5, 9.6, 11);
const PINION = gearPath(6.6, 4.9, 8);
const TARGET_GEAR = gearPath(10, 7.6, 9);

// head: capsule centred on (0,-70); body: egg from y -10 to 92
const HEAD = { x: -66, y: -116, w: 132, h: 92, r: 42 };
const SCREEN = { x: -54, y: -106, w: 108, h: 70, r: 32 };
const BODY_PATH = 'M 0 -10 C 45 -10 58 12 55 38 C 52 70 30 92 0 92 C -30 92 -52 70 -55 38 C -58 12 -45 -10 0 -10 Z';
const FLIPPER_PATH = 'M 0 -7 C 10 -7 13.5 6 12.5 22 C 11.5 38 7 50 0 54 C -7 50 -11.5 38 -12.5 22 C -13.5 6 -10 -7 0 -7 Z';
const EYE_Y = -73;
const EYE_X = 22;

const C = {
  shell: 'var(--ag-shell)',
  outline: 'var(--ag-outline)',
  joint: 'var(--ag-joint)',
  visor: 'var(--ag-visor)',
  eye: 'var(--ag-eye)',
  eyeCore: 'var(--ag-eye-core)',
  brass: 'var(--ag-brass)',
  brassHi: 'var(--ag-brass-hi)',
  blush: 'var(--ag-blush)',
  spec: 'var(--ag-spec)',
  ao: 'var(--ag-ao)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
  std: 'var(--std)',
  accent: 'var(--cyan)',
  shadow: 'var(--ag-shadow)',
};

interface ArmPose {
  /** outward/upward raise in degrees (mirrored per side) */
  raise: number;
  motion?: 'sway' | 'wave' | 'gesture' | 'none';
}

function armPoses(pose: Pose, hovered: boolean): { left: ArmPose; right: ArmPose } {
  const idle: ArmPose = { raise: 12, motion: 'sway' };
  const hold: ArmPose = { raise: 125, motion: 'none' };
  switch (pose) {
    case 'wave':
      return { left: idle, right: { raise: 150, motion: 'wave' } };
    case 'celebrate':
      return { left: { raise: 158, motion: 'none' }, right: { raise: 158, motion: 'none' } };
    case 'blueprint':
    case 'calculation':
    case 'cad3d':
    case 'tesla':
    case 'newton':
      return { left: hold, right: idle };
    case 'thinking':
      return { left: idle, right: { raise: -140, motion: 'none' } };
    case 'laser':
      return { left: idle, right: { raise: 72, motion: 'none' } };
    case 'quest':
      return { left: idle, right: { raise: 172, motion: 'none' } };
    case 'speaking':
      return { left: idle, right: { raise: 46, motion: 'gesture' } };
    case 'listening':
      return { left: { raise: 26, motion: 'none' }, right: { raise: 26, motion: 'none' } };
    case 'error':
      return { left: { raise: 3, motion: 'none' }, right: { raise: 3, motion: 'none' } };
    default:
      return hovered ? { left: idle, right: { raise: 150, motion: 'wave' } } : { left: idle, right: idle };
  }
}

const CONFETTI = [
  { dx: -70, dy: -60, rot: 220, c: C.accent, shape: 'r' },
  { dx: -46, dy: -88, rot: -160, c: C.warn, shape: 'c' },
  { dx: -18, dy: -100, rot: 300, c: C.ok, shape: 'r' },
  { dx: 16, dy: -104, rot: -260, c: C.std, shape: 'c' },
  { dx: 44, dy: -86, rot: 180, c: C.accent, shape: 'r' },
  { dx: 72, dy: -58, rot: -200, c: C.warn, shape: 'r' },
  { dx: -84, dy: -24, rot: 140, c: C.ok, shape: 'c' },
  { dx: 86, dy: -22, rot: -120, c: C.std, shape: 'c' },
  { dx: -30, dy: -70, rot: 260, c: C.warn, shape: 'r' },
  { dx: 32, dy: -66, rot: -300, c: C.ok, shape: 'r' },
] as const;

// ─── component ──────────────────────────────────────────────────────────────

export function AegisMascot({
  size = 64,
  fluid = false,
  variant,
  className = '',
  isHovered = false,
  lookAt = null,
  pose = 'idle',
  soundEnabled = false,
  interactive = true,
  onPoseChange,
  onPartInteract,
  clean = false,
  emotion = 'normal',
  squashStretch = { sx: 1, sy: 1 },
}: AegisMascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const compact =
    variant === 'face' || variant === 'compact' ? true : variant === 'panoramic' || variant === 'full' ? false : size < 88;

  const reduced = useReducedMotion();
  const active = useActive(rootRef);
  useLife(rootRef, active && !reduced, lookAt === null);

  const [autoIdx, setAutoIdx] = useState(0);
  const [overdrive, setOverdrive] = useState(false);
  const [wink, setWink] = useState(false);
  const [caliper, setCaliper] = useState('40.00');

  useEffect(() => {
    if (pose !== 'auto' || compact || !active || reduced) return;
    const timer = setInterval(() => {
      setAutoIdx((prev) => {
        const next = (prev + 1) % AUTO_POSE_SEQUENCE.length;
        onPoseChange?.(AUTO_POSE_SEQUENCE[next]);
        return next;
      });
    }, 4200);
    return () => clearInterval(timer);
  }, [pose, compact, active, reduced, onPoseChange]);

  const rawPose: Exclude<AegisPose, 'auto'> = pose === 'auto' ? (compact ? 'idle' : AUTO_POSE_SEQUENCE[autoIdx]) : pose || 'idle';
  const resolved: Pose = rawPose === 'einstein' ? 'newton' : rawPose === 'walk' ? 'wave' : rawPose;

  useEffect(() => {
    if (!soundEnabled || compact) return;
    if (resolved === 'celebrate') playMascotChirp(980, 'solve');
    else if (resolved === 'laser') playMascotChirp(1120, 'laser');
    else if (resolved === 'calculation' || resolved === 'tesla') playMascotChirp(780, 'calc');
  }, [resolved, soundEnabled, compact]);

  const expression: Expression =
    resolved === 'error'
      ? 'error'
      : resolved === 'speaking'
      ? 'speaking'
      : resolved === 'thinking'
      ? 'thinking'
      : resolved === 'calculation' || resolved === 'laser'
      ? 'focused'
      : wink || emotion === 'wink'
      ? 'wink'
      : emotion === 'happy' || emotion === 'celebrate' || resolved === 'celebrate' || resolved === 'wave' || (isHovered && resolved === 'idle')
      ? 'happy'
      : emotion === 'curious' || resolved === 'listening' || resolved === 'quest' || resolved === 'blueprint'
      ? 'curious'
      : 'normal';

  const statusColor =
    resolved === 'error' || resolved === 'laser'
      ? C.bad
      : resolved === 'celebrate' || overdrive
      ? C.ok
      : resolved === 'calculation' || resolved === 'thinking' || resolved === 'tesla'
      ? C.warn
      : C.eye;

  const handlePart = useCallback(
    (e: React.MouseEvent, part: AegisBodyPart, tr: string, en: string) => {
      e.stopPropagation();
      if (part === 'heart') {
        setOverdrive((v) => !v);
        if (soundEnabled) playMascotChirp(880, 'overdrive');
      } else if (part === 'visor') {
        setWink(true);
        setTimeout(() => setWink(false), 650);
        if (soundEnabled) playMascotChirp(1040, 'ping');
      } else if (part === 'rightHand') {
        const samples = ['25.00 H7', '40.02 g6', 'M12×1.75', '89.00 ±0.05', '50.00 k6'];
        setCaliper(samples[Math.floor(Math.random() * samples.length)]);
        if (soundEnabled) playMascotChirp(920, 'calc');
      } else if (soundEnabled) {
        playMascotChirp(980, 'solve');
      }
      onPartInteract?.(part, tr, en);
    },
    [onPartInteract, soundEnabled]
  );

  const rootStyle = useMemo(() => {
    const s: React.CSSProperties & Record<string, string | number> = fluid
      ? { width: '100%', height: 'auto', aspectRatio: '1 / 1' }
      : { width: size, height: size };
    if (lookAt) {
      s['--lx'] = Math.max(-1, Math.min(1, lookAt.x)).toFixed(3);
      s['--ly'] = Math.max(-1, Math.min(1, lookAt.y)).toFixed(3);
    }
    const sx = squashStretch?.sx ?? 1;
    const sy = squashStretch?.sy ?? 1;
    if (sx !== 1 || sy !== 1) {
      s.transform = `scale(${sx}, ${sy})`;
      s.transition = 'transform 0.14s ease-out';
    }
    return s;
  }, [size, fluid, lookAt, squashStretch?.sx, squashStretch?.sy]);

  const rootClass = `${styles.root} ${overdrive ? styles.overdrive : ''} ${className}`;
  const paused = active ? 'false' : 'true';
  const tiny = size < 40;

  if (compact) {
    return (
      <div ref={rootRef} className={rootClass} style={rootStyle} data-paused={paused} aria-hidden="true">
        <svg viewBox="-80 -152 160 136" className={`${styles.svg} ${styles.static}`}>
          <Defs uid={uid} />
          <Head uid={uid} expression={expression} statusColor={statusColor} detail={!tiny} />
        </svg>
      </div>
    );
  }

  const arms = armPoses(resolved, isHovered);
  const showProps = !clean;
  const tilt =
    resolved === 'thinking'
      ? '-7deg'
      : resolved === 'error'
      ? '6deg'
      : resolved === 'listening' || emotion === 'curious'
      ? '5deg'
      : undefined;

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle} data-paused={paused}>
      <svg
        viewBox="-150 -170 300 318"
        className={`${styles.svg} ${interactive ? '' : styles.static}`}
        role="img"
        aria-label="AeGiS"
      >
        <Defs uid={uid} />

        <ellipse className={styles.groundShadow} cx="0" cy="136" rx="40" ry="6" style={{ fill: C.shadow }} />

        {resolved === 'laser' && showProps && (
          <g transform="translate(118 126)">
            <ellipse cx="0" cy="11" rx="15" ry="3.2" style={{ fill: C.shadow }} />
            <g className={styles.spin}>
              <path d={TARGET_GEAR} fill={`url(#ag-shell-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.2" />
              <circle r="3.2" style={{ fill: C.visor }} />
            </g>
          </g>
        )}

        <g className={resolved === 'celebrate' ? styles.jump : resolved === 'error' ? styles.shake : undefined}>
          {/* ── body ── */}
          <g className={styles.bodyFloat}>
            <g transform="translate(0 92)">
              <ellipse className={styles.thrust} cx="0" cy="6" rx="22" ry="16" fill={`url(#ag-thrust-${uid})`} />
            </g>
            <rect x="-15" y="84" width="30" height="11" rx="5.5" style={{ fill: C.joint }} />
            <g className={styles.bodyTurn}>
              <path d={BODY_PATH} fill={`url(#ag-body-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.6" />
              <path d={BODY_PATH} fill="none" stroke={`url(#ag-rim-${uid})`} strokeWidth="2.2" opacity="0.9" />
              <ellipse cx="-22" cy="10" rx="13" ry="21" transform="rotate(24 -22 10)" fill={`url(#ag-spec-${uid})`} />
              <ellipse cx="0" cy="92" rx="44" ry="26" fill={`url(#ag-bounce-${uid})`} clipPath={`url(#ag-bodyclip-${uid})`} />
              <path d="M -40 64 Q 0 80 40 64" fill="none" style={{ stroke: C.outline }} strokeWidth="1.2" opacity="0.35" />
              <ellipse className={styles.headShadow} cx="0" cy="-4" rx="30" ry="5" style={{ fill: C.ao }} />
              <ellipse className={styles.ring} cx="0" cy="-15" rx="26" ry="3.4" fill="none" style={{ stroke: C.eye }} strokeWidth="1.6" />

              {/* gear core */}
              <g className={styles.coreTurn}>
                <g
                  className={interactive ? styles.part : undefined}
                  onClick={(e) =>
                    handlePart(
                      e,
                      'heart',
                      overdrive ? 'Çekirdek normal devirde.' : 'Çekirdek overdrive modunda!',
                      overdrive ? 'Core back to nominal speed.' : 'Core overdrive engaged!'
                    )
                  }
                >
                  <circle cx="0" cy="32" r="21" fill={`url(#ag-glass-${uid})`} style={{ stroke: C.brass }} strokeWidth="2.2" />
                  <circle cx="0" cy="32" r="16.5" fill="none" style={{ stroke: statusColor }} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.7" />
                  <g transform="translate(-3.5 35)">
                    <g className={styles.spin}>
                      <path d={MAIN_GEAR} fill={`url(#ag-brass-${uid})`} />
                      <circle r="4.2" style={{ fill: C.visor }} />
                      <circle r="1.7" style={{ fill: statusColor }} />
                    </g>
                  </g>
                  <g transform="translate(9.5 22.5)">
                    <g className={styles.spinRev}>
                      <path d={PINION} style={{ fill: C.eye }} opacity="0.92" />
                      <circle r="2" style={{ fill: C.visor }} />
                    </g>
                  </g>
                  <path d="M -12 20 A 15 15 0 0 1 8 16" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.32" />
                </g>
              </g>
            </g>
          </g>

          {/* ── head ── */}
          <g className={styles.headFloat}>
            <g
              className={`${styles.headTurn} ${interactive ? styles.part : ''}`}
              style={tilt ? ({ '--tilt': tilt } as React.CSSProperties) : undefined}
              onClick={(e) => handlePart(e, 'visor', 'Optik sensör kalibre edildi.', 'Optical sensor calibrated.')}
            >
              <Head uid={uid} expression={expression} statusColor={statusColor} detail />
            </g>
          </g>

          {/* ── arms ── */}
          <Arm side={-1} pose={arms.left} uid={uid} interactive={interactive}
            onHand={(e) => handlePart(e, 'leftHand', 'Sol el: hologram projektörü hazır.', 'Left hand: hologram projector ready.')} />
          <Arm side={1} pose={arms.right} uid={uid} interactive={interactive}
            onHand={(e) => handlePart(e, 'rightHand', `Dijital kumpas: Ø${caliper} mm`, `Digital caliper: Ø${caliper} mm`)} />

          {/* ── pose props ── */}
          {showProps && <PoseProp pose={resolved} />}
          {resolved === 'laser' && showProps && (
            <path className={styles.beam} d="M 112 33 L 119 118" fill="none" style={{ stroke: C.bad }} strokeWidth="2" strokeLinecap="round" />
          )}
          {resolved === 'celebrate' && (
            <g className={styles.confetti} transform="translate(0 -128)">
              {CONFETTI.map((p, i) => {
                const st = {
                  fill: p.c,
                  ['--dx' as string]: `${p.dx}px`,
                  ['--dy' as string]: `${p.dy}px`,
                  ['--rot' as string]: `${p.rot}deg`,
                  animationDelay: `${(i % 5) * 0.12}s`,
                } as React.CSSProperties;
                return p.shape === 'r' ? (
                  <rect key={i} x="-2" y="-3.5" width="4" height="7" rx="1" style={st} />
                ) : (
                  <circle key={i} r="2.6" style={st} />
                );
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

// ─── parts ──────────────────────────────────────────────────────────────────

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      {/* ceramic / titanium shell, light from the top-left */}
      <linearGradient id={`ag-shell-${uid}`} x1="0.15" y1="0" x2="0.75" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--ag-shell-hi)' }} />
        <stop offset="52%" style={{ stopColor: 'var(--ag-shell)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-shell-lo)' }} />
      </linearGradient>
      <linearGradient id={`ag-body-${uid}`} x1="0.2" y1="0" x2="0.7" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--ag-shell-hi)' }} />
        <stop offset="48%" style={{ stopColor: 'var(--ag-shell)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-shell-lo)' }} />
      </linearGradient>
      <linearGradient id={`ag-limb-${uid}`} x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0%" style={{ stopColor: 'var(--ag-shell-hi)' }} />
        <stop offset="60%" style={{ stopColor: 'var(--ag-shell)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-shell-lo)' }} />
      </linearGradient>
      {/* accent rim light on the right edge */}
      <linearGradient id={`ag-rim-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" style={{ stopColor: 'var(--ag-rim)', stopOpacity: 0.32 }} />
        <stop offset="20%" style={{ stopColor: 'var(--ag-rim)', stopOpacity: 0 }} />
        <stop offset="64%" style={{ stopColor: 'var(--ag-rim)', stopOpacity: 0 }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-rim)', stopOpacity: 0.95 }} />
      </linearGradient>
      <radialGradient id={`ag-spec-${uid}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: 'var(--ag-spec)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-spec)', stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id={`ag-screen-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--ag-visor-hi)' }} />
        <stop offset="58%" style={{ stopColor: 'var(--ag-visor)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-visor)' }} />
      </linearGradient>
      <radialGradient id={`ag-glass-${uid}`} cx="42%" cy="36%" r="70%">
        <stop offset="0%" style={{ stopColor: 'var(--ag-visor-hi)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-visor)' }} />
      </radialGradient>
      <radialGradient id={`ag-eyeglow-${uid}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0.42 }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id={`ag-eye-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--ag-eye-core)' }} />
        <stop offset="70%" style={{ stopColor: 'var(--ag-eye)' }} />
      </linearGradient>
      <radialGradient id={`ag-thrust-${uid}`} cx="50%" cy="20%" r="70%">
        <stop offset="0%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0.75 }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0 }} />
      </radialGradient>
      <radialGradient id={`ag-bounce-${uid}`} cx="50%" cy="100%" r="80%">
        <stop offset="0%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0.32 }} />
        <stop offset="100%" style={{ stopColor: 'var(--ag-eye)', stopOpacity: 0 }} />
      </radialGradient>
      <clipPath id={`ag-bodyclip-${uid}`}>
        <path d={BODY_PATH} />
      </clipPath>
      <linearGradient id={`ag-brass-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--ag-brass-hi)' }} />
        <stop offset="60%" style={{ stopColor: 'var(--ag-brass)' }} />
      </linearGradient>
    </defs>
  );
}

function Head({
  uid,
  expression,
  statusColor,
  detail,
}: {
  uid: string;
  expression: Expression;
  statusColor: string;
  detail: boolean;
}) {
  return (
    <>
      {/* antenna (sways from its base) */}
      <g transform="translate(24 -114)">
        <g className={styles.antenna}>
          <path d="M 0 0 Q -1 -12 6 -21" fill="none" style={{ stroke: C.outline }} strokeWidth="4.2" strokeLinecap="round" />
          <path d="M 0 0 Q -1 -12 6 -21" fill="none" style={{ stroke: C.shell }} strokeWidth="2.4" strokeLinecap="round" />
          <circle className={styles.pulse} cx="7" cy="-25" r="5.5" style={{ fill: statusColor }} />
          <circle cx="5.5" cy="-26.5" r="1.6" fill="#ffffff" opacity="0.8" />
        </g>
      </g>

      {/* shell */}
      <rect x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} rx={HEAD.r} fill={`url(#ag-shell-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.6" />
      <rect x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} rx={HEAD.r} fill="none" stroke={`url(#ag-rim-${uid})`} strokeWidth="2.2" />
      {detail && <ellipse cx="-36" cy="-106" rx="22" ry="7" transform="rotate(-14 -36 -106)" fill={`url(#ag-spec-${uid})`} />}

      {/* ear caps */}
      <g>
        <ellipse cx="-66" cy="-70" rx="7" ry="13" fill={`url(#ag-limb-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.4" />
        <ellipse cx="66" cy="-70" rx="7" ry="13" fill={`url(#ag-limb-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.4" />
        <ellipse className={styles.pulse} cx="-68" cy="-70" rx="2.2" ry="6" style={{ fill: C.eye }} />
        <ellipse className={styles.pulse} cx="68" cy="-70" rx="2.2" ry="6" style={{ fill: C.eye }} />
      </g>

      {/* face screen */}
      <g className={styles.screenTurn}>
        <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r} fill={`url(#ag-screen-${uid})`} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1.2" />
        <ellipse cx="0" cy={EYE_Y} rx="48" ry="24" fill={`url(#ag-eyeglow-${uid})`} />
        <g className={styles.gaze}>
          <Face expression={expression} uid={uid} />
        </g>
        {detail && (
          <g className={styles.glare}>
            <path d="M -38 -97 Q -6 -104 26 -99" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
            <path d="M 34 -54 Q 42 -62 43 -74" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.12" />
          </g>
        )}
      </g>
    </>
  );
}

function Face({ expression, uid }: { expression: Expression; uid: string }) {
  const eyeFill = `url(#ag-eye-${uid})`;
  const ey = EYE_Y;
  const ex = EYE_X;

  const pill = (cx: number, w = 19, h = 27, look = 0) => (
    <g>
      <rect x={cx - w / 2} y={ey - h / 2 + look} width={w} height={h} rx={w / 2} fill={eyeFill} />
      <rect x={cx - w / 2 + w * 0.2} y={ey - h / 2 + look + h * 0.14} width={w * 0.24} height={h * 0.22} rx={w * 0.12} fill="#ffffff" opacity="0.8" />
    </g>
  );

  let eyes: React.ReactNode;
  let mouth: React.ReactNode = null;
  let extras: React.ReactNode = null;

  switch (expression) {
    case 'happy':
      eyes = (
        <g fill="none" style={{ stroke: C.eye }} strokeWidth="5.2" strokeLinecap="round">
          <path d={`M ${-ex - 10} ${ey + 5} Q ${-ex} ${ey - 10} ${-ex + 10} ${ey + 5}`} />
          <path d={`M ${ex - 10} ${ey + 5} Q ${ex} ${ey - 10} ${ex + 10} ${ey + 5}`} />
        </g>
      );
      mouth = <path d="M -10 -52 Q 0 -40 10 -52 Z" style={{ fill: C.eye }} />;
      extras = (
        <g style={{ fill: C.blush }} opacity="0.45">
          <ellipse cx={-ex - 14} cy={ey + 14} rx="7" ry="3.5" />
          <ellipse cx={ex + 14} cy={ey + 14} rx="7" ry="3.5" />
        </g>
      );
      break;
    case 'curious':
      eyes = (
        <g>
          {pill(-ex, 21, 30)}
          {pill(ex, 16, 21, 2)}
        </g>
      );
      extras = <path d={`M ${-ex - 11} ${ey - 21} Q ${-ex} ${ey - 27} ${-ex + 11} ${ey - 22}`} fill="none" style={{ stroke: C.eye }} strokeWidth="2.6" strokeLinecap="round" />;
      mouth = <circle cx="2" cy="-49" r="3.4" fill="none" style={{ stroke: C.eye }} strokeWidth="2.4" />;
      break;
    case 'wink':
      eyes = (
        <g>
          <path d={`M ${-ex - 10} ${ey} Q ${-ex} ${ey + 7} ${-ex + 10} ${ey}`} fill="none" style={{ stroke: C.eye }} strokeWidth="4.6" strokeLinecap="round" />
          {pill(ex)}
        </g>
      );
      mouth = <path d="M -9 -51 Q 3 -42 11 -52" fill="none" style={{ stroke: C.eye }} strokeWidth="3" strokeLinecap="round" />;
      break;
    case 'focused':
      eyes = (
        <g>
          {pill(-ex, 20, 13)}
          {pill(ex, 20, 13)}
        </g>
      );
      extras = (
        <g style={{ stroke: C.eye }} strokeWidth="2.6" strokeLinecap="round">
          <line x1={-ex - 11} y1={ey - 14} x2={-ex + 10} y2={ey - 10} />
          <line x1={ex + 11} y1={ey - 14} x2={ex - 10} y2={ey - 10} />
        </g>
      );
      mouth = <path d="M -11 -49 L -6 -49 L -3 -53 L 0 -45 L 3 -52 L 6 -47 L 11 -49" fill="none" style={{ stroke: C.eye }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      break;
    case 'thinking':
      eyes = (
        <g transform="translate(5 -5)">
          {pill(-ex, 17, 20)}
          {pill(ex, 17, 20)}
        </g>
      );
      extras = <path d={`M ${ex - 6} ${ey - 26} Q ${ex + 5} ${ey - 32} ${ex + 15} ${ey - 26}`} fill="none" style={{ stroke: C.eye }} strokeWidth="2.6" strokeLinecap="round" />;
      mouth = (
        <g style={{ fill: C.eye }}>
          <circle className={styles.dot} cx="-8" cy="-49" r="2.6" />
          <circle className={styles.dot} cx="0" cy="-49" r="2.6" />
          <circle className={styles.dot} cx="8" cy="-49" r="2.6" />
        </g>
      );
      break;
    case 'speaking':
      eyes = (
        <g>
          {pill(-ex)}
          {pill(ex)}
        </g>
      );
      mouth = (
        <g style={{ fill: C.eye }}>
          {[-10, -5, 0, 5, 10].map((x) => (
            <rect key={x} className={styles.bar} x={x - 1.6} y={-54} width="3.2" height="10" rx="1.6" />
          ))}
        </g>
      );
      break;
    case 'error':
      eyes = (
        <g style={{ stroke: C.bad }} strokeWidth="4.4" strokeLinecap="round">
          <line x1={-ex - 7} y1={ey - 7} x2={-ex + 7} y2={ey + 7} />
          <line x1={-ex + 7} y1={ey - 7} x2={-ex - 7} y2={ey + 7} />
          <line x1={ex - 7} y1={ey - 7} x2={ex + 7} y2={ey + 7} />
          <line x1={ex + 7} y1={ey - 7} x2={ex - 7} y2={ey + 7} />
        </g>
      );
      mouth = <path d="M -12 -48 q 3 -4 6 0 t 6 0 t 6 0 t 6 0" fill="none" style={{ stroke: C.bad }} strokeWidth="2.4" strokeLinecap="round" />;
      break;
    default:
      eyes = (
        <g>
          {pill(-ex)}
          {pill(ex)}
        </g>
      );
      mouth = <path d="M -8 -51 Q 0 -45 8 -51" fill="none" style={{ stroke: C.eye }} strokeWidth="2.8" strokeLinecap="round" />;
  }

  return (
    <>
      <g className={styles.eyes}>
        <g key={expression} className={styles.expr}>
          {eyes}
        </g>
      </g>
      <g key={`x-${expression}`}>{extras}</g>
      <g key={`m-${expression}`}>{mouth}</g>
    </>
  );
}

function Arm({
  side,
  pose,
  uid,
  interactive,
  onHand,
}: {
  side: -1 | 1;
  pose: ArmPose;
  uid: string;
  interactive: boolean;
  onHand: (e: React.MouseEvent) => void;
}) {
  // positive raise = outward/up on both sides (SVG rotation is clockwise, so the left arm uses +)
  const angle = side < 0 ? pose.raise : -pose.raise;
  const motion =
    pose.motion === 'sway'
      ? side < 0
        ? styles.swayL
        : styles.swayR
      : pose.motion === 'wave'
      ? styles.wave
      : pose.motion === 'gesture'
      ? styles.gesture
      : undefined;
  return (
    <g className={side < 0 ? styles.armFloatL : styles.armFloatR}>
      <g transform={`translate(${side * 63} 4)`}>
        <g className={styles.joint} style={{ transform: `rotate(${angle}deg)` }}>
          <g className={motion}>
            <g className={interactive ? styles.part : undefined} onClick={onHand}>
              <path d={FLIPPER_PATH} fill={`url(#ag-limb-${uid})`} style={{ stroke: C.outline }} strokeWidth="1.5" />
              <path d={FLIPPER_PATH} fill="none" stroke={`url(#ag-rim-${uid})`} strokeWidth="1.8" opacity="0.8" />
              <path d="M -5 4 Q -7 20 -5 34" fill="none" style={{ stroke: C.spec }} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
              <circle cx="0" cy="42" r="2.6" style={{ fill: C.eye }} opacity="0.9" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/** Objects AeGiS shows for a pose. Left-flipper props float near (-110, -60). */
function PoseProp({ pose }: { pose: Pose }) {
  const mono = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";
  switch (pose) {
    case 'blueprint':
      return (
        <g transform="translate(-112 -64)">
          <g className={styles.bob}>
            <g transform="rotate(-6)">
              <rect x="-30" y="-21" width="60" height="42" rx="4" style={{ fill: 'var(--cyan-glow)', stroke: C.accent }} strokeWidth="1.6" />
              <g style={{ stroke: C.accent }} strokeWidth="0.6" opacity="0.45">
                {[-20, -10, 0, 10, 20].map((x) => <line key={`v${x}`} x1={x} y1="-21" x2={x} y2="21" />)}
                {[-11, 0, 11].map((y) => <line key={`h${y}`} x1="-30" y1={y} x2="30" y2={y} />)}
              </g>
              <circle cx="-6" cy="0" r="11" fill="none" style={{ stroke: C.accent }} strokeWidth="1.8" />
              <circle cx="-6" cy="0" r="4" fill="none" style={{ stroke: C.accent }} strokeWidth="1.4" />
              <line x1="11" y1="-12" x2="11" y2="12" style={{ stroke: C.brass }} strokeWidth="1.4" />
              <path d="M 8 -12 L 11 -16 L 14 -12 M 8 12 L 11 16 L 14 12" fill="none" style={{ stroke: C.brass }} strokeWidth="1.2" />
            </g>
          </g>
        </g>
      );
    case 'calculation':
      return (
        <g transform="translate(-112 -64)">
          <g className={styles.bob}>
            <rect x="-31" y="-19" width="62" height="38" rx="7" style={{ fill: C.visor, stroke: C.warn }} strokeWidth="1.6" />
            <text x="-4" y="1" textAnchor="middle" style={{ fill: C.warn }} fontSize="11" fontFamily={mono} fontWeight="700">ΣM = 0</text>
            <text x="-4" y="13" textAnchor="middle" style={{ fill: C.eye }} fontSize="7.5" fontFamily={mono}>σv ≤ Rp</text>
            <path d="M 18 6 L 22 10 L 28 2" fill="none" style={{ stroke: C.ok }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      );
    case 'cad3d':
      return (
        <g transform="translate(-110 -64)">
          <g className={styles.bob}>
            <g style={{ stroke: C.accent }} strokeWidth="1.8" strokeLinejoin="round" fill="none">
              <path d="M 0 -22 L 19 -11 L 19 11 L 0 22 L -19 11 L -19 -11 Z" style={{ fill: 'var(--cyan-glow)' }} />
              <path d="M -19 -11 L 0 0 L 19 -11 M 0 0 L 0 22" />
            </g>
            <line className={styles.scan} x1="-24" y1="0" x2="24" y2="0" style={{ stroke: C.brass }} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </g>
      );
    case 'tesla':
      return (
        <g transform="translate(-110 -66)">
          <g className={styles.bob}>
            <circle r="9" style={{ fill: C.brass, stroke: C.brassHi }} strokeWidth="1.4" />
            <g fill="none" style={{ stroke: C.eye }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path className={styles.flicker} d="M -8 -6 L -16 -12 L -12 -17 L -22 -25" />
              <path className={styles.flicker} d="M 8 -5 L 15 -13 L 11 -17 L 20 -26" />
              <path className={styles.flicker} d="M 9 5 L 18 9 L 15 15 L 24 19" />
            </g>
          </g>
        </g>
      );
    case 'newton':
      return (
        <g transform="translate(-110 -64)">
          <g className={styles.bob}>
            <path d="M 0 -10 C -10 -16 -18 -4 -13 8 C -9 16 -2 17 0 13 C 2 17 9 16 13 8 C 18 -4 10 -16 0 -10 Z" style={{ fill: C.bad }} />
            <path d="M 0 -10 Q 2 -18 8 -17" fill="none" style={{ stroke: C.ok }} strokeWidth="2.2" strokeLinecap="round" />
            <text x="0" y="31" textAnchor="middle" style={{ fill: C.warn }} fontSize="8.5" fontFamily={mono} fontWeight="700">g = 9.81</text>
          </g>
        </g>
      );
    case 'quest':
      return (
        <g transform="translate(92 -118)">
          <g className={styles.bob}>
            <path d="M 0 -18 L 16 0 L 0 18 L -16 0 Z" style={{ fill: C.visor, stroke: C.warn }} strokeWidth="2" />
            <text x="0" y="6" textAnchor="middle" style={{ fill: C.warn }} fontSize="16" fontFamily={mono} fontWeight="700">!</text>
          </g>
        </g>
      );
    default:
      return null;
  }
}

export default AegisMascot;

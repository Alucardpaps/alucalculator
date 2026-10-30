'use client';

/**
 * AeGiS stage: the floating companion on the home page.
 *
 * Performance notes (v6):
 *  - Gaze tracking writes --lx/--ly CSS variables on the stage (one rAF per pointer move);
 *    the mascot smooths them with CSS transitions, so React does not re-render at 60 fps.
 *  - Autonomous behaviour only runs while the stage is on screen, the tab is visible, the
 *    visitor has not asked for reduced motion and the page is not driving the pose.
 *  - Sounds only play in response to the visitor's own clicks/drags and can be muted.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  AegisMascot,
  isMascotSoundEnabled,
  playMascotChirp,
  setMascotSoundEnabled,
  useReducedMotion,
  type AegisPose,
} from '@/components/copilot/AegisMascot';
import { useI18nStore } from '@/store/i18nStore';

type Emotion = 'normal' | 'happy' | 'curious' | 'wink' | 'celebrate';

const PATROL_WAYPOINTS = [
  { x: 0, y: 0, tilt: 0 },
  { x: -46, y: -14, tilt: -6 },
  { x: 50, y: -10, tilt: 7 },
  { x: -30, y: 16, tilt: -4 },
  { x: 38, y: 18, tilt: 5 },
];

const COMPANION_REMARKS = [
  { tr: 'Bir cıvata, dişli ya da rulman yaz; standardıyla hesaplayayım.', en: 'Type a bolt, gear or bearing — I will run it against its standard.' },
  { tr: 'Sonuçları sohbette adım adım açıklayabilirim.', en: 'I can explain any result step by step in the chat.' },
  { tr: 'Beni sürükleyip bırakabilirsin.', en: 'You can drag me around.' },
  { tr: '3D stüdyoda parametrik bir parça tasarlayalım mı?', en: 'Shall we model a parametric part in the 3D studio?' },
  { tr: 'Göğsümdeki dişliye dokun, hızlanayım!', en: 'Tap the gear in my chest to speed me up!' },
];

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

export interface AegisHeroCardProps {
  /**
   * Mascot size: a px number, or Tailwind width classes for a CSS-responsive size
   * (e.g. "w-[200px] sm:w-[280px]") — the latter avoids a layout shift after hydration.
   */
  size?: number | string;
  /** make the eyes look at a point (-1…1); null follows the pointer */
  lookAt?: { x: number; y: number } | null;
  /** wave hello once after mounting */
  greet?: boolean;
  /** when set, the page drives the pose and autonomous behaviour pauses */
  forcedPose?: AegisPose | null;
  /** persistent speech bubble text (click remarks replace it briefly) */
  message?: string | null;
  className?: string;
}

function AegisHeroCardImpl({ size = 260, lookAt = null, greet = false, forcedPose = null, message = null, className = '' }: AegisHeroCardProps) {
  const fluid = typeof size === 'string';
  const { language } = useI18nStore();
  const isTr = language === 'tr';
  const reduced = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const timersRef = useRef<number[]>([]);

  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);
  const [squash, setSquash] = useState({ sx: 1, sy: 1 });
  const [rolling, setRolling] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [pose, setPose] = useState<AegisPose>('idle');
  const [emotion, setEmotion] = useState<Emotion>('normal');
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [remark, setRemark] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    setSound(isMascotSoundEnabled());
    const timers = timersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  /* ─── hello wave ─── */
  useEffect(() => {
    if (!greet || reduced) return;
    const start = window.setTimeout(() => setPose('wave'), 650);
    const stop = window.setTimeout(() => setPose((p) => (p === 'wave' ? 'idle' : p)), 3000);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [greet, reduced]);

  /* ─── visibility ─── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let onScreen = true;
    const update = () => {
      const v = onScreen && document.visibilityState !== 'hidden';
      visibleRef.current = v;
      setVisible(v);
    };
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            update();
          })
        : null;
    io?.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  /* ─── gaze: pointer → CSS variables (no React renders) ─── */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let frame = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      const box = (moverRef.current ?? stage).getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height * 0.35;
      const halfW = Math.max(window.innerWidth / 2, 450);
      const halfH = Math.max(window.innerHeight / 2, 350);
      stage.style.setProperty('--lx', clamp1((px - cx) / halfW).toFixed(3));
      stage.style.setProperty('--ly', clamp1((py - cy) / halfH).toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame && visibleRef.current) frame = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* ─── autonomous behaviour ─── */
  useEffect(() => {
    if (!visible || reduced || dragging || hovered || forcedPose) return;
    let waypoint = 0;
    const interval = window.setInterval(() => {
      const roll = Math.random();
      if (roll < 0.4) {
        waypoint = (waypoint + 1) % PATROL_WAYPOINTS.length;
        const target = PATROL_WAYPOINTS[waypoint];
        setSquash({ sx: 0.96, sy: 1.05 });
        setTilt(target.tilt * 1.4);
        setPosition({ x: target.x, y: target.y });
        setPose('idle');
        later(() => {
          setSquash({ sx: 1.04, sy: 0.96 });
          setTilt(target.tilt * 0.3);
          later(() => {
            setSquash({ sx: 1, sy: 1 });
            setTilt(0);
          }, 320);
        }, 850);
      } else if (roll < 0.6) {
        setEmotion('curious');
        setTilt(8);
        later(() => {
          setEmotion('normal');
          setTilt(0);
        }, 2000);
      } else if (roll < 0.76) {
        setPose('wave');
        later(() => setPose('idle'), 2400);
      } else if (roll < 0.9) {
        setPose('thinking');
        later(() => setPose('idle'), 2600);
      } else {
        setRolling(true);
        setEmotion('happy');
        later(() => {
          setRolling(false);
          setEmotion('wink');
          later(() => setEmotion('normal'), 700);
        }, 1100);
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [visible, reduced, dragging, hovered, forcedPose, later]);

  // when the page starts driving the pose, settle back to the centre
  useEffect(() => {
    if (!forcedPose) return;
    setPosition({ x: 0, y: 0 });
    setTilt(0);
    setRolling(false);
  }, [forcedPose]);

  /* ─── click: celebrate + remark ─── */
  const celebrate = useCallback(() => {
    setJumping(true);
    setEmotion('happy');
    setPose('celebrate');
    setSquash({ sx: 0.92, sy: 1.1 }); // the mascot plays its own celebrate chirp
    const next = COMPANION_REMARKS[Math.floor(Math.random() * COMPANION_REMARKS.length)];
    setRemark(isTr ? next.tr : next.en);
    later(() => setRemark(null), 3600);
    later(() => {
      setSquash({ sx: 1.05, sy: 0.95 });
      later(() => {
        setJumping(false);
        setSquash({ sx: 1, sy: 1 });
        setPose('idle');
        setEmotion('normal');
      }, 380);
    }, 900);
  }, [isTr, later]);

  /* ─── drag & toss ─── */
  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(true);
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startX: position.x, startY: position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    if (Math.abs(dx) + Math.abs(dy) > 4) setEmotion('curious');
    setPosition({
      x: Math.max(-140, Math.min(140, dragStart.current.startX + dx)),
      y: Math.max(-70, Math.min(70, dragStart.current.startY + dy)),
    });
    setTilt(Math.max(-18, Math.min(18, dx * 0.16)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const moved = Math.hypot(position.x - dragStart.current.startX, position.y - dragStart.current.startY);
    if (moved < 4) return; // a click, handled by onClick
    setSquash({ sx: 1.08, sy: 0.93 });
    playMascotChirp(840, 'ping');
    later(() => {
      setSquash({ sx: 1, sy: 1 });
      setTilt(0);
      setPosition({ x: 0, y: 0 });
      setEmotion('happy');
      later(() => setEmotion('normal'), 1200);
    }, 300);
  };

  const onPointerCancel = () => {
    if (!dragging) return;
    setDragging(false);
    setTilt(0);
    setPosition({ x: 0, y: 0 });
    setEmotion('normal');
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setMascotSoundEnabled(next);
    if (next) playMascotChirp(880, 'ping');
  };

  const bubble = remark ?? message;
  const activePose = forcedPose ?? pose;

  return (
    <div
      ref={stageRef}
      data-tour="home-mascot"
      className={`relative flex w-full flex-col items-center justify-end select-none ${className}`}
      style={fluid ? undefined : { minHeight: (size as number) + 70 }}
    >
      <button
        type="button"
        onClick={toggleSound}
        className="absolute right-0 top-0 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--ink)]"
        aria-label={sound ? (isTr ? 'Maskot seslerini kapat' : 'Mute mascot sounds') : isTr ? 'Maskot seslerini aç' : 'Unmute mascot sounds'}
        title={sound ? (isTr ? 'Sesleri kapat' : 'Mute') : isTr ? 'Sesleri aç' : 'Unmute'}
      >
        {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>

      {/* speech bubble */}
      <div className="relative z-20 flex h-[64px] w-full items-end justify-center">
        {bubble && (
          <div
            key={bubble}
            role="status"
            aria-live="polite"
            className="relative max-w-[320px] rounded-[var(--radius-l)] border border-[var(--line-strong)] bg-[var(--bg-1)] px-4 py-2.5 text-center text-[13px] leading-snug text-[var(--ink)] shadow-[var(--shadow-2)] animate-in fade-in zoom-in-95 duration-200"
          >
            {bubble}
            <span
              aria-hidden
              className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[var(--line-strong)] bg-[var(--bg-1)]"
            />
          </div>
        )}
      </div>

      <div
        ref={moverRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={() => {
          setHovered(true);
          if (!forcedPose) setEmotion('happy');
        }}
        onMouseLeave={() => {
          setHovered(false);
          setEmotion('normal');
        }}
        onClick={celebrate}
        style={{
          transform: `translate3d(${position.x}px, ${position.y + (jumping ? -22 : 0)}px, 0) rotateZ(${tilt}deg)${rolling ? ' rotateY(360deg)' : ''}`,
          transition: dragging
            ? 'none'
            : rolling
            ? 'transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)',
          cursor: dragging ? 'grabbing' : 'grab',
          // vertical swipes keep scrolling the page on phones; horizontal drags move AeGiS
          touchAction: 'pan-y',
        }}
        className={`relative z-10 mt-1 flex flex-col items-center justify-center ${fluid ? (size as string) : ''}`}
        title={isTr ? 'AeGiS — tıkla veya sürükle' : 'AeGiS — click or drag me'}
      >
        <AegisMascot
          size={fluid ? 280 : (size as number)}
          fluid={fluid}
          lookAt={lookAt}
          variant="full"
          clean
          isHovered={hovered && !forcedPose}
          pose={activePose}
          emotion={emotion}
          squashStretch={squash}
          soundEnabled={sound}
        />
      </div>
    </div>
  );
}

/** memoised: the home page re-renders on every keystroke, AeGiS only when its props change */
export const AegisHeroCard = React.memo(AegisHeroCardImpl);

export default AegisHeroCard;

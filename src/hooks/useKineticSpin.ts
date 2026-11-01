'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface KineticSpinOptions {
  /** Mode: 'circular' tracks rotation around center; 'linear' tracks horizontal drag */
  mode?: 'circular' | 'linear';
  /** Base nominal rotation speed in degrees per second (default: 45 deg/s) */
  nominalSpeedDegPerSec?: number;
  /** Center coordinates for circular mode in SVG/container space (optional, defaults to element center) */
  center?: { x: number; y: number };
  /** Minimum and maximum speed multiplier limits */
  minMultiplier?: number;
  maxMultiplier?: number;
  /** Sensitivity factor for mouse drag interaction */
  dragSensitivity?: number;
  /** Sensitivity factor for mouse wheel */
  wheelSensitivity?: number;
  /** Whether the animation runs by default */
  autoPlay?: boolean;
}

export interface KineticSpinReturn {
  /** Current continuous rotation angle in degrees */
  angle: number;
  /** Current continuous angle in radians */
  angleRad: number;
  /** Current speed multiplier (positive for forward, negative for reverse) */
  speedMultiplier: number;
  /** Absolute speed magnitude (e.g. 1.5x) */
  speedMagnitude: number;
  /** Current direction: 1 for clockwise/forward, -1 for reverse */
  direction: 1 | -1;
  /** Whether user is actively dragging */
  isDragging: boolean;
  /** Manual reset to 1.0x nominal speed */
  resetSpeed: () => void;
  /** Manually set speed multiplier */
  setMultiplier: (mult: number) => void;
  /** Manually toggle direction */
  toggleDirection: () => void;
  /** Props to spread onto the interactive container or SVG */
  containerProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onDoubleClick: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
  };
}

export function useKineticSpin(options: KineticSpinOptions = {}): KineticSpinReturn {
  const {
    mode = 'circular',
    nominalSpeedDegPerSec = 45,
    center,
    minMultiplier = -6.0,
    maxMultiplier = 6.0,
    dragSensitivity = 1.0,
    wheelSensitivity = 0.002,
    autoPlay = true,
  } = options;

  const [angle, setAngle] = useState(0);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);

  // Internal physics refs
  const angleRef = useRef(0);
  const multiplierRef = useRef(1.0);
  const isDraggingRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Drag tracking refs
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastDragTimeRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);
  const containerRectRef = useRef<DOMRect | null>(null);

  multiplierRef.current = speedMultiplier;
  isDraggingRef.current = isDragging;

  // Animation Loop via requestAnimationFrame
  useEffect(() => {
    if (!autoPlay) return;

    let active = true;

    const animate = (currentTime: number) => {
      if (!active) return;

      if (lastTimeRef.current == null) {
        lastTimeRef.current = currentTime;
      }

      const dt = Math.min(0.1, (currentTime - lastTimeRef.current) / 1000); // seconds
      lastTimeRef.current = currentTime;

      // If not dragging, advance angle based on speedMultiplier
      if (!isDraggingRef.current) {
        const deltaAngle = nominalSpeedDegPerSec * multiplierRef.current * dt;
        angleRef.current = (angleRef.current + deltaAngle) % 360000;
        setAngle(angleRef.current);
      }

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (reqIdRef.current != null) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, [autoPlay, nominalSpeedDegPerSec]);

  // Pointer event handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Allow primary touch/mouse button
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const targetEl = e.target as HTMLElement | null;
      if (targetEl && targetEl.closest('button, a, input, select, textarea, [role="button"], [data-no-drag]')) {
        return;
      }

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture?.(e.pointerId);

      containerRectRef.current = target.getBoundingClientRect();
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      lastDragTimeRef.current = performance.now();
      dragVelocityRef.current = 0;
      setIsDragging(true);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      const now = performance.now();
      const dt = Math.max(0.001, (now - lastDragTimeRef.current) / 1000);
      const curX = e.clientX;
      const curY = e.clientY;
      const prevX = lastPosRef.current.x;
      const prevY = lastPosRef.current.y;

      let deltaDeg = 0;

      if (mode === 'circular') {
        const rect = containerRectRef.current;
        const cx = center ? center.x : rect ? rect.left + rect.width / 2 : curX;
        const cy = center ? center.y : rect ? rect.top + rect.height / 2 : curY;

        const prevAngle = Math.atan2(prevY - cy, prevX - cx);
        const curAngle = Math.atan2(curY - cy, curX - cx);
        let diffRad = curAngle - prevAngle;

        // Normalize radian delta across PI wrap
        if (diffRad > Math.PI) diffRad -= 2 * Math.PI;
        if (diffRad < -Math.PI) diffRad += 2 * Math.PI;

        deltaDeg = (diffRad * 180) / Math.PI * dragSensitivity;

        // Fallback: If drag was near center or tiny, add horizontal flick contribution
        if (Math.abs(deltaDeg) < 0.05) {
          deltaDeg = (curX - prevX) * 0.5 * dragSensitivity;
        }
      } else {
        // Linear mode (e.g. horizontal track or chain/belt)
        deltaDeg = (curX - prevX) * 0.8 * dragSensitivity;
      }

      // Directly update angle in real-time
      angleRef.current = (angleRef.current + deltaDeg) % 360000;
      setAngle(angleRef.current);

      // Instantaneous angular velocity in deg/s
      const instVelocity = deltaDeg / dt;
      // Exponential moving average for flick momentum
      dragVelocityRef.current = dragVelocityRef.current * 0.6 + instVelocity * 0.4;

      lastPosRef.current = { x: curX, y: curY };
      lastDragTimeRef.current = now;
    },
    [center, dragSensitivity, mode]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      try {
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }

      setIsDragging(false);

      // If flicked with velocity, translate that velocity into a persistent new speed multiplier!
      const flickSpeed = dragVelocityRef.current;
      if (Math.abs(flickSpeed) > 15) {
        // Compute corresponding multiplier relative to nominal speed
        const newMult = Math.min(
          maxMultiplier,
          Math.max(minMultiplier, flickSpeed / nominalSpeedDegPerSec)
        );
        // Retain sign and round cleanly
        const rounded = Math.round(newMult * 10) / 10;
        if (Math.abs(rounded) >= 0.1) {
          setSpeedMultiplierState(rounded);
        }
      }
    },
    [maxMultiplier, minMultiplier, nominalSpeedDegPerSec]
  );

  // Mouse Wheel: speeds up or slows down & reverses!
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Negative deltaY is scrolling UP (speed up forward)
      // Positive deltaY is scrolling DOWN (slow down / reverse)
      const delta = -e.deltaY * wheelSensitivity;
      setSpeedMultiplierState((prev) => {
        const next = Math.min(maxMultiplier, Math.max(minMultiplier, prev + delta));
        return Math.round(next * 100) / 100;
      });
    },
    [maxMultiplier, minMultiplier, wheelSensitivity]
  );

  // Double Click: reset to default 1.0x
  const handleDoubleClick = useCallback(() => {
    setSpeedMultiplierState(1.0);
  }, []);

  const resetSpeed = useCallback(() => {
    setSpeedMultiplierState(1.0);
  }, []);

  const setMultiplier = useCallback(
    (mult: number) => {
      setSpeedMultiplierState(Math.min(maxMultiplier, Math.max(minMultiplier, mult)));
    },
    [maxMultiplier, minMultiplier]
  );

  const toggleDirection = useCallback(() => {
    setSpeedMultiplierState((prev) => -prev);
  }, []);

  const direction: 1 | -1 = speedMultiplier >= 0 ? 1 : -1;
  const speedMagnitude = Math.abs(speedMultiplier);

  return {
    angle,
    angleRad: (angle * Math.PI) / 180,
    speedMultiplier,
    speedMagnitude,
    direction,
    isDragging,
    resetSpeed,
    setMultiplier,
    toggleDirection,
    containerProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      },
    },
  };
}

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  gap?: string;
  /** Base speed in pixels per second (default: 40) */
  speed?: number;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  gap = '1.5rem',
  speed = 40,
  ...props
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(reverse ? -1 : 1);

  // Physics refs
  const offsetRef = useRef(0);
  const multiplierRef = useRef(reverse ? -1 : 1);
  const isDraggingRef = useRef(false);
  const itemSizeRef = useRef(1000);
  const lastTimeRef = useRef<number | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Drag velocity refs
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastDragTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const isHoveredRef = useRef(false);

  multiplierRef.current = speedMultiplier;
  isDraggingRef.current = isDragging;

  // Measure single item width/height
  const updateItemSize = useCallback(() => {
    if (firstItemRef.current) {
      const rect = firstItemRef.current.getBoundingClientRect();
      const size = vertical ? rect.height : rect.width;
      if (size > 10) {
        itemSizeRef.current = size;
      }
    }
  }, [vertical]);

  useEffect(() => {
    updateItemSize();
    window.addEventListener('resize', updateItemSize);
    return () => window.removeEventListener('resize', updateItemSize);
  }, [updateItemSize]);

  // Kinetic Animation Loop
  useEffect(() => {
    let active = true;

    const animate = (time: number) => {
      if (!active) return;

      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }

      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      // Only auto-scroll if not dragging, and not paused on hover
      if (!isDraggingRef.current && !(pauseOnHover && isHoveredRef.current)) {
        // Move offset
        const move = -speed * multiplierRef.current * dt;
        offsetRef.current += move;

        // Wrap seamlessly
        const itemSize = itemSizeRef.current;
        if (itemSize > 10) {
          while (offsetRef.current <= -itemSize) {
            offsetRef.current += itemSize;
          }
          while (offsetRef.current > 0) {
            offsetRef.current -= itemSize;
          }
        }

        setOffset(offsetRef.current);
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
  }, [pauseOnHover, speed]);

  // Pointer drag events: "aynı elinle ittiriyormuşsun gibi"
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const target = containerRef.current;
    target?.setPointerCapture?.(e.pointerId);

    updateItemSize();
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastDragTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dt = Math.max(0.001, (now - lastDragTimeRef.current) / 1000);
    const curPos = vertical ? e.clientY : e.clientX;
    const prevPos = vertical ? lastPosRef.current.y : lastPosRef.current.x;
    const delta = curPos - prevPos;

    offsetRef.current += delta;

    // Wrap seamlessly while dragging
    const itemSize = itemSizeRef.current;
    if (itemSize > 10) {
      while (offsetRef.current <= -itemSize) {
        offsetRef.current += itemSize;
      }
      while (offsetRef.current > 0) {
        offsetRef.current -= itemSize;
      }
    }

    setOffset(offsetRef.current);

    // Instantaneous velocity in px/s
    const instVelocity = delta / dt;
    dragVelocityRef.current = dragVelocityRef.current * 0.6 + instVelocity * 0.4;

    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastDragTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    try {
      containerRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    setIsDragging(false);

    // If flung with velocity, adopt that direction and speed!
    const v = dragVelocityRef.current;
    if (Math.abs(v) > 30) {
      // Flinging left (v < 0) means forward marquee (multiplier > 0)
      // Flinging right (v > 0) means reversed marquee (multiplier < 0)
      const targetMultiplier = -v / speed;
      const clamped = Math.min(5, Math.max(-5, targetMultiplier));
      setSpeedMultiplier(Math.round(clamped * 10) / 10);
    }
  };

  // Mouse wheel: scroll up to accelerate forward, scroll down to reverse!
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent interfering with page scroll only if hovering over marquee
    const delta = e.deltaY * 0.003;
    setSpeedMultiplier((prev) => {
      // deltaY < 0 is wheel UP -> increase forward speed
      // deltaY > 0 is wheel DOWN -> decrease/reverse speed
      const next = prev - delta;
      return Math.min(5, Math.max(-5, Math.round(next * 100) / 100));
    });
  };

  // Double click: reset to nominal speed
  const handleDoubleClick = () => {
    setSpeedMultiplier(reverse ? -1 : 1);
  };

  const transformStyle = vertical
    ? `translate3d(0, ${offset.toFixed(2)}px, 0)`
    : `translate3d(${offset.toFixed(2)}px, 0, 0)`;

  return (
    <div
      ref={containerRef}
      {...props}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      className={cn(
        'group flex overflow-hidden p-2 select-none touch-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className
      )}
      style={
        {
          '--gap': gap,
          maskImage: vertical
            ? 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, transparent)'
            : 'linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, transparent)',
          WebkitMaskImage: vertical
            ? 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, transparent)'
            : 'linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 92%, transparent)',
        } as React.CSSProperties
      }
      title="🖱️ Elinle İttir / Sürükle • Fare tekeri ile hızlandır & yön değiştir • Çift tıkla sıfırla"
    >
      <div
        className={cn('flex shrink-0 [gap:var(--gap)]', {
          'flex-row': !vertical,
          'flex-col': vertical,
        })}
        style={{
          transform: transformStyle,
          willChange: 'transform',
        }}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? firstItemRef : undefined}
            className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
              'flex-row': !vertical,
              'flex-col': vertical,
            })}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Marquee;

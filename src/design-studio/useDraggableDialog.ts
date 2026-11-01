'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseDraggableOptions {
  initialPosition?: { x: number; y: number } | (() => { x: number; y: number });
  boundaryMargin?: number;
}

/**
 * Industrial-grade hook to make CAD dialogs, property managers, and tool boxes
 * freely draggable anywhere on the screen with instant mouse and touch support.
 */
export function useDraggableDialog(options?: UseDraggableOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getDefaultPos = useCallback(() => {
    const opts = optionsRef.current;
    if (typeof opts?.initialPosition === 'function') {
      return opts.initialPosition();
    }
    if (opts?.initialPosition) {
      return opts.initialPosition;
    }
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 768;
      return {
        x: isDesktop ? Math.min(340, Math.max(16, window.innerWidth - 360)) : 16,
        y: 112,
      };
    }
    return { x: 340, y: 112 };
  }, []);

  const [position, setPosition] = useState<{ x: number; y: number }>(getDefaultPos);
  const positionRef = useRef<{ x: number; y: number }>(position);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Keep positionRef in sync with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Recalculate once on mount if window dimensions are available
  useEffect(() => {
    const p = getDefaultPos();
    setPosition(p);
    positionRef.current = p;
  }, [getDefaultPos]);

  const resetPosition = useCallback(() => {
    const p = getDefaultPos();
    setPosition(p);
    positionRef.current = p;
  }, [getDefaultPos]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking interactive controls inside the header
      if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [role="button"]')) {
        return;
      }

      e.preventDefault();
      setIsDragging(true);
      isDraggingRef.current = true;

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const initialX = positionRef.current.x;
      const initialY = positionRef.current.y;
      const margin = options?.boundaryMargin ?? 10;

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const dx = moveEvt.clientX - startClientX;
        const dy = moveEvt.clientY - startClientY;

        const elWidth = elementRef.current?.offsetWidth || 320;
        const maxX = Math.max(margin, window.innerWidth - Math.min(elWidth, 80));
        const maxY = Math.max(margin, window.innerHeight - 50);

        const nextX = Math.max(margin, Math.min(initialX + dx, maxX));
        const nextY = Math.max(margin, Math.min(initialY + dy, maxY));

        setPosition({ x: nextX, y: nextY });
        positionRef.current = { x: nextX, y: nextY };
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [options?.boundaryMargin]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [role="button"]')) {
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;

      setIsDragging(true);
      isDraggingRef.current = true;

      const startClientX = touch.clientX;
      const startClientY = touch.clientY;
      const initialX = positionRef.current.x;
      const initialY = positionRef.current.y;
      const margin = options?.boundaryMargin ?? 10;

      const onTouchMove = (moveEvt: TouchEvent) => {
        if (!isDraggingRef.current) return;
        const curTouch = moveEvt.touches[0];
        if (!curTouch) return;

        const dx = curTouch.clientX - startClientX;
        const dy = curTouch.clientY - startClientY;

        const elWidth = elementRef.current?.offsetWidth || 320;
        const maxX = Math.max(margin, window.innerWidth - Math.min(elWidth, 80));
        const maxY = Math.max(margin, window.innerHeight - 50);

        const nextX = Math.max(margin, Math.min(initialX + dx, maxX));
        const nextY = Math.max(margin, Math.min(initialY + dy, maxY));

        setPosition({ x: nextX, y: nextY });
        positionRef.current = { x: nextX, y: nextY };
      };

      const onTouchEnd = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    },
    [options?.boundaryMargin]
  );

  return {
    position,
    setPosition,
    resetPosition,
    isDragging,
    elementRef,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
  };
}

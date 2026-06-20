'use client';

import React, { useEffect, useRef } from 'react';
import { useCopilotStore } from '@/store/copilotStore';

interface HexagonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseRadius: number;
  angle: number;
  spin: number;
  color: string;
  depth: number; // 0.2 to 1.0 (far to near)
  pulse: number; // phase for pulsing
  pulseSpeed: number;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexagonsRef = useRef<HexagonParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, lastMove: 0 });
  const swarmTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Swarm target initial coordinates
    swarmTargetRef.current = { x: width / 2, y: height / 2 };

    // Bright Neon colors matching the site UI
    const colors = [
      'rgba(0, 229, 255, 0.4)',  // Neon Cyan
      'rgba(167, 139, 250, 0.4)', // Neon Violet
      'rgba(59, 130, 246, 0.4)',  // Neon Blue
      'rgba(139, 92, 246, 0.4)',  // Neon Purple
      'rgba(6, 182, 212, 0.4)',   // Neon Teal
      'rgba(96, 165, 250, 0.4)',  // Neon Sky
    ];

    // Create 90 particles with layered 3D depth
    const hexagons: HexagonParticle[] = Array.from({ length: 90 }).map((_, idx) => {
      const depth = 0.2 + Math.random() * 0.8; // Depth factor (0.2 is far, 1.0 is near)
      const baseRadius = 4 + depth * 12; // 4px (far) to 16px (near) radius
      const colorIndex = idx % colors.length;
      const baseColor = colors[colorIndex];
      // Scale particle base color opacity with depth
      const color = baseColor.replace(/[^,]+\)$/, `${0.12 + depth * 0.38})`);

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 3 * depth, // Far particles move slower (parallax)
        vy: (Math.random() - 0.5) * 3 * depth,
        r: baseRadius,
        baseRadius,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.02 * depth,
        color,
        depth,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      };
    });

    hexagonsRef.current = hexagons;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Update copilot store mouse coordinates
      useCopilotStore.getState().setMousePos({ x: e.clientX, y: e.clientY });

      // Check if hovering over an interactive element
      const target = e.target as HTMLElement | null;
      let isInteractive = false;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (['button', 'a', 'input', 'select', 'textarea', 'label'].includes(tag)) {
          isInteractive = true;
        } else {
          const closest = target.closest('button, a, input, select, textarea, [role="button"]');
          if (closest) {
            isInteractive = true;
          } else {
            const style = window.getComputedStyle(target);
            if (style.cursor === 'pointer') {
              isInteractive = true;
            }
          }
        }
      }

      mouseRef.current.active = !isInteractive;
      mouseRef.current.lastMove = Date.now();
    };

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (['button', 'a', 'input', 'select', 'textarea', 'label'].includes(tag)) return true;
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return true;
      return window.getComputedStyle(target).cursor === 'pointer';
    };

    const hitHexagon = (clientX: number, clientY: number): boolean => {
      for (const hex of hexagonsRef.current) {
        const dx = clientX - hex.x;
        const dy = clientY - hex.y;
        const hitRadius = hex.r * 2.8;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) return true;
      }
      return false;
    };

    const tryOpenCopilot = (clientX: number, clientY: number, target: EventTarget | null) => {
      if (useCopilotStore.getState().isOpen) return;
      if (isInteractiveTarget(target)) return;
      if (!hitHexagon(clientX, clientY)) return;
      useCopilotStore.getState().setIsOpen(true);
    };

    const handleClick = (e: MouseEvent) => {
      tryOpenCopilot(e.clientX, e.clientY, e.target);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      tryOpenCopilot(touch.clientX, touch.clientY, e.target);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    // Disabled global click/touch triggers to prevent accidental copilot activation during scene orbits/drags
    // window.addEventListener('click', handleClick);
    // window.addEventListener('touchend', handleTouchEnd, { passive: true });

    const drawHexagon = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      angle: number,
      color: string,
      depth: number,
      pulseVal: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      
      // Slight breathing size pulsation
      const currentRadius = r * (0.96 + 0.04 * Math.sin(pulseVal));
      
      // Neon Glow gets blurrier based on closeness
      c.shadowBlur = 4 + depth * 12;
      c.shadowColor = color;
      
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = currentRadius * Math.cos(a);
        const py = currentRadius * Math.sin(a);
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      
      // Faint neon background fill inside hexagon
      c.fillStyle = color.replace(/[^,]+\)$/, '0.035)');
      c.fill();
      
      c.strokeStyle = color;
      c.lineWidth = 1 + depth * 1.5; // Nearer objects have thicker strokes
      c.stroke();
      c.restore();
    };

    const tick = () => {
      // Clear the canvas completely on each frame to remove distracting trails
      ctx.clearRect(0, 0, width, height);

      // Check mouse activity timeout (idle after 2 seconds)
      const now = Date.now();
      if (mouseRef.current.active && now - mouseRef.current.lastMove > 2000) {
        mouseRef.current.active = false;
      }

      // Swarm Target drifting dynamically
      const swarmTarget = swarmTargetRef.current;
      if (Math.random() < 0.03) {
        swarmTarget.x = Math.random() * width;
        swarmTarget.y = Math.random() * height;
      }

      // Draw interactive glowing aura under the cursor
      if (mouseRef.current.active) {
        ctx.save();
        const g = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 140
        );
        g.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
        g.addColorStop(0.5, 'rgba(167, 139, 250, 0.04)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Connection network lines between nearby hexagons at similar depth
      ctx.save();
      for (let i = 0; i < hexagons.length; i++) {
        const hexA = hexagons[i];
        for (let j = i + 1; j < hexagons.length; j++) {
          const hexB = hexagons[j];
          if (Math.abs(hexA.depth - hexB.depth) > 0.25) continue; // Only connect if in similar 3D plane

          const dx = hexB.x - hexA.x;
          const dy = hexB.y - hexA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const maxDist = 80 + hexA.depth * 50; 
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(hexA.x, hexA.y);
            ctx.lineTo(hexB.x, hexB.y);
            const alpha = 0.08 * (1 - dist / maxDist) * hexA.depth;
            ctx.strokeStyle = hexA.color.replace(/[^,]+\)$/, `${alpha})`);
            ctx.lineWidth = 0.5 + hexA.depth * 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Update and draw hexagons
      hexagons.forEach((hex, i) => {
        let ax = 0;
        let ay = 0;
        const depthFactor = hex.depth;

        const isMerged = useCopilotStore.getState().isOpen;

        if (isMerged) {
          // Pull towards a tight cluster on the left (x: 60, y: height / 2)
          const targetX = 60;
          const targetY = height / 2;
          
          // Add a slight rotation/orbit so it looks like a beautiful swirling vortex!
          const angleOffset = (i * Math.PI * 2) / hexagons.length;
          const time = Date.now() * 0.002;
          const orbitX = targetX + Math.cos(time + angleOffset) * 12;
          const orbitY = targetY + Math.sin(time + angleOffset) * 12;
          
          const dx = orbitX - hex.x;
          const dy = orbitY - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 5) {
            ax = (dx / dist) * 0.55 * depthFactor;
            ay = (dy / dist) * 0.55 * depthFactor;
          } else {
            ax = (Math.random() - 0.5) * 0.2 * depthFactor;
            ay = (Math.random() - 0.5) * 0.2 * depthFactor;
          }
        } else if (mouseRef.current.active) {
          // Pull towards mouse with depth-based lag & high-frequency buzzing
          const dx = mouseRef.current.x - hex.x;
          const dy = mouseRef.current.y - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 15) {
            const attraction = (0.1 + (i % 6) * 0.015) * depthFactor;
            ax = (dx / dist) * attraction + (Math.random() - 0.5) * 0.3 * depthFactor;
            ay = (dy / dist) * attraction + (Math.random() - 0.5) * 0.3 * depthFactor;
          } else {
            // Buzz closely around cursor
            ax = (Math.random() - 0.5) * 0.7 * depthFactor;
            ay = (Math.random() - 0.5) * 0.7 * depthFactor;
          }
        } else {
          // Roam/dance like bees around the swarm target (higher noise for "buzzing dance")
          const dx = swarmTarget.x - hex.x;
          const dy = swarmTarget.y - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 60) {
            ax = (dx / dist) * 0.04 * depthFactor;
            ay = (dy / dist) * 0.04 * depthFactor;
          }
          // High-frequency random buzzing
          ax += (Math.random() - 0.5) * 0.32 * depthFactor;
          ay += (Math.random() - 0.5) * 0.32 * depthFactor;
        }

        // Separation force to keep them distinct at similar depths
        hexagons.forEach((other, j) => {
          if (i === j) return;
          const dx = other.x - hex.x;
          const dy = other.y - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40) {
            const repulse = (40 - dist) * 0.003 * Math.min(hex.depth, other.depth);
            ax -= (dx / dist) * repulse;
            ay -= (dy / dist) * repulse;
          }
        });

        // Update physics
        hex.vx += ax;
        hex.vy += ay;
        
        // Damping factor
        const damping = (isMerged || mouseRef.current.active) ? 0.94 : 0.97;
        hex.vx *= damping;
        hex.vy *= damping;

        // Speed limits
        const speed = Math.sqrt(hex.vx * hex.vx + hex.vy * hex.vy);
        const maxSpeed = (isMerged ? 12 : mouseRef.current.active ? 8 : 3.2) * depthFactor;
        if (speed > maxSpeed) {
          hex.vx = (hex.vx / speed) * maxSpeed;
          hex.vy = (hex.vy / speed) * maxSpeed;
        }

        hex.x += hex.vx;
        hex.y += hex.vy;
        hex.angle += hex.spin + (hex.vx * 0.003);
        hex.pulse += hex.pulseSpeed;

        // Screen boundary safety wrap-around
        const margin = hex.r + 30;
        if (hex.x < -margin) hex.x = width + margin;
        if (hex.x > width + margin) hex.x = -margin;
        if (hex.y < -margin) hex.y = height + margin;
        if (hex.y > height + margin) hex.y = -margin;

        // Draw hexagon particle with depth, neon glow and pulse
        drawHexagon(ctx, hex.x, hex.y, hex.r, hex.angle, hex.color, hex.depth, hex.pulse);
      });

      hexagonsRef.current = hexagons;

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020408]">
      {/* ═══ GLOW LAYERS ═══ */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,229,255,0.06)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,_rgba(139,92,246,0.03)_0%,_transparent_50%)]" />
      
      {/* ═══ GRID PATTERN ═══ */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* ═══ INTERACTIVE SWARM CANVAS ═══ */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}

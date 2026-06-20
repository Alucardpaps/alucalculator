'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCopilotStore } from '@/store/copilotStore';
import { AegisIcon } from '@/components/copilot/AegisIcon';

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
  const leaderDOMRef = useRef<HTMLDivElement>(null);
  const hexagonsRef = useRef<HexagonParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, lastMove: 0 });

  const [petMode, setPetMode] = useState<'idle' | 'active' | 'thinking' | 'tracking'>('idle');

  const isOpen = useCopilotStore((s) => s.isOpen);
  const isThinking = useCopilotStore((s) => s.isThinking);
  const mode = isThinking ? 'thinking' : isOpen ? 'active' : petMode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Leader particle state (lives inside the tick loop scope) starts in bottom-right corner
    const leader = {
      x: width - 110,
      y: height - 110,
      vx: 0,
      vy: 0,
      targetX: width - 110,
      targetY: height - 110,
    };

    // Leader self-directed behavior FSM state
    const petState = {
      mode: 'idle_float', // 'idle_float' | 'gliding' | 'playful_loop' | 'scanning'
      stateTime: Date.now(),
      loopAngle: 0,
    };

    let currentPetMode = 'idle';

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
      const baseRadius = 3 + depth * 9; // 3px to 12px (drones are smaller than the 70px leader)
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
      const oldWidth = width;
      const oldHeight = height;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Shift leader position smoothly to match the new bottom-right coordinates
      leader.targetX += (width - oldWidth);
      leader.targetY += (height - oldHeight);
      leader.x += (width - oldWidth);
      leader.y += (height - oldHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Update copilot store mouse coordinates
      useCopilotStore.getState().setMousePos({ x: e.clientX, y: e.clientY });

      // Check if hovering over an interactive HTML element
      const target = e.target as HTMLElement | null;
      let isInteractive = false;
      if (target) {
        // Exclude the leader DOM itself so hover doesn't freeze the pet
        const isLeaderOrChild = leaderDOMRef.current?.contains(target);
        if (!isLeaderOrChild) {
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
      // Hit check for leader only (70px boundary)
      const ldx = clientX - leader.x;
      const ldy = clientY - leader.y;
      return (ldx * ldx + ldy * ldy <= 35 * 35);
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
    window.addEventListener('click', handleClick);
    window.addEventListener('touchend', handleTouchEnd);

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
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();
      if (mouseRef.current.active && now - mouseRef.current.lastMove > 2000) {
        mouseRef.current.active = false;
      }

      // ── UPDATE LEADER POSITION TARGET (FSM BEHAVIORS) ──
      const isMerged = useCopilotStore.getState().isOpen;
      let lTargetX = leader.targetX;
      let lTargetY = leader.targetY;
      let petAnimMode = 'idle';

      if (isMerged) {
        // Hover directly below the bottom-right speech bubble chat panel
        petAnimMode = 'active';
        lTargetX = width - 110;
        lTargetY = height - 70 + Math.sin(now * 0.0015) * 8;
      } else {
        const timeInState = now - petState.stateTime;
        
        // Randomly transition states (every 4 to 10 seconds)
        if (timeInState > 4000 + Math.random() * 6000) {
          const rand = Math.random();
          petState.stateTime = now;
          if (rand < 0.45) {
            petState.mode = 'gliding';
            // Pick a new target in the bottom-right quadrant/pocket
            leader.targetX = width - 110 - Math.random() * 100;
            leader.targetY = height - 110 - Math.random() * 100;
          } else if (rand < 0.7) {
            petState.mode = 'scanning';
          } else if (rand < 0.85) {
            petState.mode = 'playful_loop';
            petState.loopAngle = 0;
          } else {
            petState.mode = 'idle_float';
          }
        }

        // FSM State actions for target updates
        if (petState.mode === 'gliding') {
          petAnimMode = 'tracking'; // flight mode
          lTargetX = leader.targetX;
          lTargetY = leader.targetY;
          
          // If close to target, transition to idle_float early
          const dx = lTargetX - leader.x;
          const dy = lTargetY - leader.y;
          if (dx * dx + dy * dy < 40 * 40) {
            petState.mode = 'idle_float';
            petState.stateTime = now;
          }
        } else if (petState.mode === 'playful_loop') {
          petAnimMode = 'tracking';
          // Perform a neat circular loop-de-loop around the current target
          petState.loopAngle += 0.07;
          const radius = 45;
          lTargetX = leader.targetX + Math.cos(petState.loopAngle) * radius;
          lTargetY = leader.targetY + Math.sin(petState.loopAngle) * radius;
          
          if (petState.loopAngle >= Math.PI * 2) {
            petState.mode = 'idle_float';
            petState.stateTime = now;
          }
        } else if (petState.mode === 'scanning') {
          petAnimMode = 'thinking'; // scanning / thinking mode
          lTargetX = leader.targetX + Math.sin(now * 0.001) * 3;
          lTargetY = leader.targetY + Math.cos(now * 0.001) * 3;
        } else {
          // 'idle_float' - Gently bobbing in place
          petAnimMode = 'idle';
          lTargetX = leader.targetX + Math.sin(now * 0.0008) * 40;
          lTargetY = leader.targetY + Math.cos(now * 0.0006) * 30;
        }
      }

      // Transition React state if mode changes
      if (currentPetMode !== petAnimMode) {
        currentPetMode = petAnimMode;
        setPetMode(petAnimMode as 'idle' | 'active' | 'thinking' | 'tracking');
      }

      // Physics for leader
      const ldx = lTargetX - leader.x;
      const ldy = lTargetY - leader.y;
      const ldist = Math.sqrt(ldx * ldx + ldy * ldy);

      if (ldist > 2) {
        // Accelerate faster when active/merging, drift smoothly for ambient self-directed walks
        const ease = isMerged ? 0.06 : (petState.mode === 'gliding' || petState.mode === 'playful_loop') ? 0.025 : 0.012;
        leader.vx += ldx * ease;
        leader.vy += ldy * ease;
      }

      leader.vx *= 0.88;
      leader.vy *= 0.88;
      leader.x += leader.vx;
      leader.y += leader.vy;

      // Keep leader within viewport bounds
      leader.x = Math.max(35, Math.min(width - 35, leader.x));
      leader.y = Math.max(35, Math.min(height - 35, leader.y));

      // Direct DOM transform update with velocity-based tilt
      if (leaderDOMRef.current) {
        const tilt = Math.max(-12, Math.min(12, leader.vx * 0.6));
        leaderDOMRef.current.style.transform = `translate3d(${leader.x - 35}px, ${leader.y - 35}px, 0) rotate(${tilt}deg)`;
      }

      // ── DRAW CONSTELLATION CONNECTIONS BETWEEN PARTICLES ──
      ctx.save();
      for (let i = 0; i < hexagons.length; i++) {
        const hexA = hexagons[i];
        for (let j = i + 1; j < hexagons.length; j++) {
          const hexB = hexagons[j];
          if (Math.abs(hexA.depth - hexB.depth) > 0.25) continue; 

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

      // ── DRAW CONSTELLATION LINES FROM LEADER TO Swarm PARTICLES ──
      ctx.save();
      for (let i = 0; i < hexagons.length; i++) {
        const hex = hexagons[i];
        const dx = hex.x - leader.x;
        const dy = hex.y - leader.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 110 + hex.depth * 50;

        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(leader.x, leader.y);
          ctx.lineTo(hex.x, hex.y);
          const alpha = 0.12 * (1 - dist / maxDist) * hex.depth;
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
          ctx.lineWidth = 0.6 + hex.depth * 0.8;
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── UPDATE AND DRAW SWARM PARTICLES ──
      hexagons.forEach((hex, i) => {
        let ax = 0;
        let ay = 0;
        const depthFactor = hex.depth;

        // Decouple tracking: swarm tracks the user's cursor when active, and orbits the leader when mouse is idle
        let targetX = leader.x;
        let targetY = leader.y;

        if (mouseRef.current.active && !isMerged) {
          targetX = mouseRef.current.x;
          targetY = mouseRef.current.y;
        }

        const dx = targetX - hex.x;
        const dy = targetY - hex.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (isMerged) {
          // Swarm tightly in a beautiful swirling orbit around the leader next to the panel
          const angleOffset = (i * Math.PI * 2) / hexagons.length;
          const time = Date.now() * 0.002;
          const orbitX = leader.x + Math.cos(time + angleOffset) * 45;
          const orbitY = leader.y + Math.sin(time + angleOffset) * 45;
          
          const odx = orbitX - hex.x;
          const ody = orbitY - hex.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          
          if (odist > 5) {
            ax = (odx / odist) * 0.55 * depthFactor;
            ay = (ody / odist) * 0.55 * depthFactor;
          } else {
            ax = (Math.random() - 0.5) * 0.2 * depthFactor;
            ay = (Math.random() - 0.5) * 0.2 * depthFactor;
          }
        } else if (mouseRef.current.active) {
          // Swarm follows user's mouse cursor with depth-based lag
          if (dist > 15) {
            const attraction = (0.1 + (i % 6) * 0.015) * depthFactor;
            ax = (dx / dist) * attraction + (Math.random() - 0.5) * 0.3 * depthFactor;
            ay = (dy / dist) * attraction + (Math.random() - 0.5) * 0.3 * depthFactor;
          } else {
            ax = (Math.random() - 0.5) * 0.7 * depthFactor;
            ay = (Math.random() - 0.5) * 0.7 * depthFactor;
          }
        } else {
          // Swarm around leader (gravity well), orbiting when close
          if (dist > 75) {
            ax = (dx / dist) * 0.06 * depthFactor;
            ay = (dy / dist) * 0.06 * depthFactor;
          } else {
            // Orbiting force
            const speedScale = 0.04 * depthFactor;
            ax = -dy * speedScale;
            ay = dx * speedScale;
          }
          // High-frequency random buzzing
          ax += (Math.random() - 0.5) * 0.35 * depthFactor;
          ay += (Math.random() - 0.5) * 0.35 * depthFactor;
        }

        // Separation force to keep them distinct at similar depths
        hexagons.forEach((other, j) => {
          if (i === j) return;
          const sdx = other.x - hex.x;
          const sdy = other.y - hex.y;
          const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sdist < 40) {
            const repulse = (40 - sdist) * 0.003 * Math.min(hex.depth, other.depth);
            ax -= (sdx / sdist) * repulse;
            ay -= (sdy / sdist) * repulse;
          }
        });

        // Update physics
        hex.vx += ax;
        hex.vy += ay;
        
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

        // Screen boundary wrap-around
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
      {/* ── GLOW LAYERS ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,229,255,0.06)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,_rgba(139,92,246,0.03)_0%,_transparent_50%)]" />
      
      {/* ── GRID PATTERN ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* ── INTERACTIVE SWARM CANVAS ── */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* ── FLOATING LEADER AEGIS ASSISTANT PET ── */}
      <div
        ref={leaderDOMRef}
        className="absolute pointer-events-auto cursor-pointer select-none transition-shadow hover:scale-105 active:scale-95 duration-200"
        style={{
          width: '70px',
          height: '70px',
          left: 0,
          top: 0,
          transform: 'translate3d(50vw, 50vh, 0)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          useCopilotStore.getState().setIsOpen(!isOpen);
        }}
        title="Open AeGiS Assistant"
      >
        {/* Render with full character mode (pure={false}) to display waving arms, legs, and mini-hexagons */}
        <AegisIcon size={70} mode={mode} pure={false} />
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhysicsEngine } from './physicsEngine';
import { SvgWorldRenderer } from './SvgWorldRenderer';
import { WorldToolbar } from './WorldToolbar';
import { TelemetryPanel } from './TelemetryPanel';
import { ChallengeModal } from './ChallengeModal';
import { CHALLENGES } from './challenges';
import { ENGINEERING_MATERIALS } from './materials';
import {
  PhysicsBody,
  PhysicsJoint,
  EditorTool,
  EngineeringMaterial,
  TelemetryData,
  ChallengeScenario,
  ContactPoint,
} from './types';
import { PX_PER_METER, FIXED_DT } from './physicsEngine';
import { playAudio } from './audio';
import { Trophy, CheckCircle2, XCircle, Timer, Zap, Flag } from 'lucide-react';

function estimateMass(
  type: PhysicsBody['type'] | 'motor' | 'robot_arm',
  material: EngineeringMaterial,
  dims: { w?: number; h?: number; r?: number; length?: number; thickness?: number }
): number {
  const rho = (material.density || 2.7) * 1000;
  const px = PX_PER_METER;
  let vol = 0.008;
  if (type === 'wheel' || type === 'circle' || type === 'gear' || type === 'motor') {
    const r = (dims.r || 30) / px;
    vol = Math.PI * r * r * 0.05;
  } else if (type === 'beam' || type === 'robot_arm') {
    vol = ((dims.length || 200) / px) * ((dims.h || 16) / px) * ((dims.thickness || 12) / px);
  } else if (type === 'boat') {
    vol = ((dims.w || 170) / px) * ((dims.h || 42) / px) * 0.08;
  } else {
    vol = ((dims.w || 60) / px) * ((dims.h || 40) / px) * 0.06;
  }
  return Math.max(2, Math.round(rho * vol));
}

export function FlowWorld() {
  const engineRef = useRef<PhysicsEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new PhysicsEngine();
  }
  const engine = engineRef.current;

  // Active Challenge
  const [activeChallenge, setActiveChallenge] = useState<ChallengeScenario>(CHALLENGES[0]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // World State
  const [bodies, setBodies] = useState<PhysicsBody[]>(() => JSON.parse(JSON.stringify(CHALLENGES[0].initialBodies)));
  const [joints, setJoints] = useState<PhysicsJoint[]>(() => JSON.parse(JSON.stringify(CHALLENGES[0].initialJoints)));
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Editor Tools
  const [activeTool, setActiveTool] = useState<EditorTool>('drag');
  const [currentMaterial, setCurrentMaterial] = useState<EngineeringMaterial>(ENGINEERING_MATERIALS['al-6061-t6']);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [draggedBodyId, setDraggedBodyId] = useState<string | null>(null);

  // Canvas Viewport (Pan & Zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Challenge Stopwatch Timer
  const [stopwatchMs, setStopwatchMs] = useState(0);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    bodyCount: bodies.length,
    jointCount: joints.length,
    maxStressMpa: 0,
    minSafetyFactor: 10,
    totalKineticEnergy: 0,
    totalPotentialEnergy: 0,
    criticalBodyId: null,
    contactCount: 0,
    snappedJoints: 0,
    maxSlip: 0,
    motorPowerKw: 0,
    timeScale: 1,
  });
  const [contacts, setContacts] = useState<ContactPoint[]>([]);
  const [timeScale, setTimeScale] = useState(1);
  const [windX, setWindX] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [quality, setQuality] = useState<'fast' | 'accurate'>('accurate');

  const bodiesRef = useRef(bodies);
  const jointsRef = useRef(joints);
  const pausedRef = useRef(isPaused);
  const mutedRef = useRef(isMuted);
  const dragIdRef = useRef<string | null>(null);
  const challengeRef = useRef(activeChallenge);
  const statusRef = useRef(challengeStatus);
  bodiesRef.current = bodies;
  jointsRef.current = joints;
  pausedRef.current = isPaused;
  mutedRef.current = isMuted;
  dragIdRef.current = draggedBodyId;
  challengeRef.current = activeChallenge;
  statusRef.current = challengeStatus;

  // Motor Power State (Independent from time pause)
  const [isMotorRunning, setIsMotorRunning] = useState<boolean>(false);

  const handleToggleMotor = () => {
    setIsMotorRunning((prev) => {
      const next = !prev;
      engine.isMotorRunning = next;
      if (!isMuted) playAudio('click');
      return next;
    });
  };

  // Ground Slope State (degrees) & Terrain Contour
  const [groundSlopeDeg, setGroundSlopeDeg] = useState<number>(0);
  const [terrainType, setTerrainType] = useState<'flat' | 'wavy' | 'hills'>('flat');
  const [waveAmplitude, setWaveAmplitude] = useState<number>(28);
  const [isDraggingSlopeHandle, setIsDraggingSlopeHandle] = useState<boolean>(false);

  const handleChangeGroundSlope = (deg: number) => {
    const clamped = Math.max(-30, Math.min(30, deg));
    setGroundSlopeDeg(clamped);
    engine.setGroundSlope(clamped);
  };

  const handleChangeTerrainType = (t: 'flat' | 'wavy' | 'hills') => {
    setTerrainType(t);
    engine.setTerrain(t, waveAmplitude);
  };

  // Direct Mouse Coordinate Dragging Offset
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Gravity Mode (Earth 9.8, Moon 1.6, Zero 0)
  const [gravityMode, setGravityMode] = useState<'earth' | 'moon' | 'zero'>('earth');

  const handleToggleGravity = () => {
    setGravityMode((prev) => {
      const next = prev === 'earth' ? 'moon' : prev === 'moon' ? 'zero' : 'earth';
      engine.setGravityMode(next);
      return next;
    });
  };

  // Load a Challenge or Preset
  const handleSelectChallenge = useCallback((challenge: ChallengeScenario) => {
    engine.reset();
    setActiveChallenge(challenge);
    setBodies(JSON.parse(JSON.stringify(challenge.initialBodies)));
    setJoints(JSON.parse(JSON.stringify(challenge.initialJoints)));
    setIsPaused(true);
    setIsMotorRunning(false);
    engine.isMotorRunning = false;
    setChallengeStatus('idle');
    setStopwatchMs(0);
    setSelectedBodyId(null);
    setDraggedBodyId(null);

    // Apply template terrain
    const tType = challenge.terrainType || 'flat';
    const wAmp = challenge.waveAmplitude || 28;
    const slope = challenge.initialGroundSlope || 0;
    setTerrainType(tType);
    setWaveAmplitude(wAmp);
    setGroundSlopeDeg(slope);
    engine.terrainType = tType;
    engine.waveAmplitude = wAmp;
    engine.groundSlopeDeg = slope;
    engine.rebuildTerrain();

    engine.isPaused = true;
  }, [engine]);

  useEffect(() => {
    engine.timeScale = timeScale;
    engine.windX = windX;
    engine.setQuality(quality);
  }, [engine, timeScale, windX, quality]);

  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let frames = 0;
    let fpsStamp = lastTime;
    let displayFps = 60;

    const loop = (now: number) => {
      const rawDt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frames += 1;
      if (now - fpsStamp >= 400) {
        displayFps = Math.round((frames * 1000) / (now - fpsStamp));
        frames = 0;
        fpsStamp = now;
      }

      if (!pausedRef.current) {
        accumulator += rawDt * engine.timeScale;
        const step = FIXED_DT;
        let guard = 0;
        while (accumulator >= step && guard < 5) {
          const tel = engine.update(
            bodiesRef.current,
            jointsRef.current,
            step,
            dragIdRef.current,
            mousePosRef.current
          );
          tel.fps = displayFps;
          accumulator -= step;
          guard += 1;

          if (statusRef.current === 'idle') {
            const ch = challengeRef.current;
            if (ch.checkSuccess(bodiesRef.current, jointsRef.current)) {
              statusRef.current = 'success';
              setChallengeStatus('success');
              if (!mutedRef.current) playAudio('success');
            } else if (ch.checkFailure && ch.checkFailure(bodiesRef.current, jointsRef.current)) {
              statusRef.current = 'failed';
              setChallengeStatus('failed');
              if (!mutedRef.current) playAudio('snap');
            }
          }
        }

        if (guard > 0) {
          setStopwatchMs((ms) => ms + Math.round(guard * step * 1000));
          setBodies(bodiesRef.current.slice());
          setJoints(jointsRef.current.slice());
          setTelemetry({ ...engine.lastTelemetry, fps: displayFps });
          setContacts(engine.lastContacts);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMotor();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'd' || e.key === 'D') {
        setShowDebug((v) => !v);
      } else if (e.key === '.') {
        handleStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Playback Handlers
  const handleTogglePlay = () => {
    const next = !isPaused;
    setIsPaused(next);
    engine.isPaused = next;
    if (!isMuted) playAudio(next ? 'click' : 'joint');
  };

  const handleStep = () => {
    if (!isPaused) return;
    const prevPause = engine.isPaused;
    engine.isPaused = false;
    engine.update(bodiesRef.current, jointsRef.current, FIXED_DT, draggedBodyId, mousePosRef.current);
    engine.isPaused = prevPause;
    setBodies(bodiesRef.current.slice());
    setJoints(jointsRef.current.slice());
    setTelemetry(engine.lastTelemetry);
    setContacts(engine.lastContacts);
  };

  const handleReset = () => {
    engine.reset();
    setBodies(JSON.parse(JSON.stringify(activeChallenge.initialBodies)));
    setJoints(JSON.parse(JSON.stringify(activeChallenge.initialJoints)));
    setSelectedBodyId(null);
    setDraggedBodyId(null);
    setChallengeStatus('idle');
    setStopwatchMs(0);
    setIsPaused(true);
    setIsMotorRunning(false);
    engine.isMotorRunning = false;
    if (!isMuted) playAudio('click');
  };

  const handleClear = () => {
    engine.reset();
    setBodies([]);
    setJoints([]);
    setSelectedBodyId(null);
    setDraggedBodyId(null);
    setChallengeStatus('idle');
    setStopwatchMs(0);
    setIsMotorRunning(false);
    engine.isMotorRunning = false;
    if (!isMuted) playAudio('snap');
  };

  // Canvas Mouse Events
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Background click pans the viewport
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }

    // World coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = (e.clientX - rect.left - pan.x) / zoom;
    const wy = (e.clientY - rect.top - pan.y) / zoom;
    mousePosRef.current = { x: wx, y: wy };

    // If dragging ground slope lever
    if (isDraggingSlopeHandle) {
      const dx = wx - 500;
      const dy = wy - 650;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const clamped = Math.max(-30, Math.min(30, Math.round(angleDeg * 2) / 2));
      setGroundSlopeDeg(clamped);
      engine.setGroundSlope(clamped);
      return;
    }

    // Direct object coordinate movement with mouse
    if (draggedBodyId) {
      const targetX = Math.round(wx - dragOffsetRef.current.x);
      const targetY = Math.round(wy - dragOffsetRef.current.y);

      setBodies((prev) =>
        prev.map((b) => {
          if (b.id === draggedBodyId) {
            return {
              ...b,
              x: targetX,
              y: targetY,
              vx: 0,
              vy: 0,
            };
          }
          return b;
        })
      );
      engine.setBodyPosition(draggedBodyId, targetX, targetY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedBodyId(null);
    setIsDraggingSlopeHandle(false);
  };

  const [jointSourceBodyId, setJointSourceBodyId] = useState<string | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * zoomFactor)));
  };

  const handleBodyMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBodyId(id);

    // Calculate grab offset from body center to mouse cursor
    const target = bodies.find((b) => b.id === id);
    if (target && mousePosRef.current) {
      dragOffsetRef.current = {
        x: mousePosRef.current.x - target.x,
        y: mousePosRef.current.y - target.y,
      };
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
    }

    // Interactive Joint creation: Click body 1, then click body 2
    if (activeTool === 'joint_pin' || activeTool === 'joint_weld' || activeTool === 'joint_cable') {
      if (!jointSourceBodyId) {
        setJointSourceBodyId(id);
        if (!isMuted) playAudio('click');
      } else if (jointSourceBodyId !== id) {
        const bodyA = bodies.find((b) => b.id === jointSourceBodyId);
        const bodyB = bodies.find((b) => b.id === id);
        if (bodyA && bodyB) {
          const jType = activeTool === 'joint_pin' ? 'pin' : activeTool === 'joint_weld' ? 'weld' : 'cable';
          const dist = Math.sqrt(Math.pow(bodyB.x - bodyA.x, 2) + Math.pow(bodyB.y - bodyA.y, 2));
          const newJoint: PhysicsJoint = {
            id: `joint-${Date.now()}`,
            type: jType,
            bodyAId: bodyA.id,
            bodyBId: bodyB.id,
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            length: Math.max(30, dist),
            stiffness: 850,
            maxTension: 50000,
          };
          setJoints((prev) => [...prev, newJoint]);
          if (!isMuted) playAudio('joint');
        }
        setJointSourceBodyId(null);
      }
      return;
    }

    if (activeTool === 'erase') {
      setBodies((prev) => prev.filter((b) => b.id !== id));
      setJoints((prev) => prev.filter((j) => j.bodyAId !== id && j.bodyBId !== id));
      setSelectedBodyId(null);
      if (!isMuted) playAudio('snap');
      return;
    }

    // Direct object dragging with mouse
    setDraggedBodyId(id);
  };

  // Spawn preset elements
  const handleSpawnPreset = (
    type: 'beam' | 'gear' | 'motor' | 'wheel' | 'boat' | 'robot_arm' | 'box' | 'circle' | 'anchor'
  ) => {
    const wx = 500 - pan.x / zoom;
    const wy = 320 - pan.y / zoom;
    const id = `body-${Date.now()}`;

    let newBody: PhysicsBody;

    if (type === 'wheel') {
      const mat = ENGINEERING_MATERIALS['rubber-tire'] || currentMaterial;
      const mass = estimateMass('wheel', mat, { r: 26 });
      newBody = {
        id,
        name: 'Yeni Yuvarlak Lastik Tekerlek',
        type: 'wheel',
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        mass,
        inertia: mass * 0.4,
        isStatic: false,
        material: mat,
        restitution: 0.1,
        friction: 1.15,
        radius: 26,
      };
    } else if (type === 'boat') {
      const mat = ENGINEERING_MATERIALS['marine-composite'] || currentMaterial;
      const mass = estimateMass('boat', mat, { w: 170, h: 42 });
      newBody = {
        id,
        name: 'Yeni Hidrodinamik Tekne',
        type: 'boat',
        x: wx,
        y: 470,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        mass,
        inertia: mass * 0.8,
        isStatic: false,
        material: mat,
        restitution: 0.1,
        friction: 0.4,
        width: 170,
        height: 42,
        thrustPower: 400,
      };
    } else if (type === 'robot_arm') {
      const mat = ENGINEERING_MATERIALS['al-7075-t6'] || currentMaterial;
      const mass = estimateMass('robot_arm', mat, { length: 200, h: 18, thickness: 14 });
      newBody = {
        id,
        name: 'Yeni Robot Kolu (Servo Mafsal)',
        type: 'beam',
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        mass,
        inertia: mass * 1.4,
        isStatic: false,
        material: mat,
        restitution: 0.1,
        friction: 0.6,
        length: 200,
        height: 18,
        beamThickness: 14,
        isServo: true,
        servoTargetAngle: 0.4,
      };
    } else {
      const mass = type === 'anchor' ? 99999 : estimateMass(type, currentMaterial, {
        w: 60,
        h: 40,
        length: 240,
        r: 45,
      });
      newBody = {
        id,
        name: `Yeni ${type.toUpperCase()}`,
        type: type === 'motor' ? 'gear' : type,
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        mass,
        inertia: mass * 0.6,
        isStatic: type === 'anchor',
        material: currentMaterial,
        restitution: 0.2,
        friction: 0.6,
        width: type === 'box' ? 60 : undefined,
        height: type === 'box' ? 40 : undefined,
        length: type === 'beam' ? 240 : undefined,
        pitchRadius: type === 'gear' || type === 'motor' ? 45 : undefined,
        teethCount: type === 'gear' || type === 'motor' ? 18 : undefined,
        isMotor: type === 'motor',
        motorRpm: type === 'motor' ? 240 : undefined,
        motorTorque: type === 'motor' ? 400 : undefined,
      };
    }

    setBodies((prev) => [...prev, newBody]);
    setSelectedBodyId(id);
    if (!isMuted) playAudio('place');
  };

  const selectedBody = bodies.find((b) => b.id === selectedBodyId) || null;

  const handleUpdateBody = (updated: PhysicsBody) => {
    setBodies((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    engine.setBodyPosition(updated.id, updated.x, updated.y);
  };

  const handleDeleteBody = (id: string) => {
    setBodies((prev) => prev.filter((b) => b.id !== id));
    setJoints((prev) => prev.filter((j) => j.bodyAId !== id && j.bodyBId !== id));
    setSelectedBodyId(null);
  };

  const formatTimer = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(ms % 1000 / 10);
    return `${s}.${String(m).padStart(2, '0')}s`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-0)] select-none text-slate-200 overflow-hidden relative font-sans">
      
      {/* 1. TOP WORLD TOOLBAR */}
      <WorldToolbar
        isPaused={isPaused}
        isMotorRunning={isMotorRunning}
        groundSlopeDeg={groundSlopeDeg}
        terrainType={terrainType}
        activeTool={activeTool}
        currentMaterial={currentMaterial}
        isMuted={isMuted}
        gravityMode={gravityMode}
        timeScale={timeScale}
        windX={windX}
        showDebug={showDebug}
        quality={quality}
        onTogglePlay={handleTogglePlay}
        onToggleMotor={handleToggleMotor}
        onChangeGroundSlope={handleChangeGroundSlope}
        onChangeTerrainType={handleChangeTerrainType}
        onStep={handleStep}
        onReset={handleReset}
        onClear={handleClear}
        onToggleGravity={handleToggleGravity}
        onSelectTool={setActiveTool}
        onSelectMaterial={setCurrentMaterial}
        onToggleAudio={() => setIsMuted(!isMuted)}
        onResetCamera={() => {
          setPan({ x: 0, y: 0 });
          setZoom(1.0);
        }}
        onOpenChallenges={() => setIsChallengeModalOpen(true)}
        onSpawnPreset={handleSpawnPreset}
        onChangeTimeScale={setTimeScale}
        onChangeWind={setWindX}
        onToggleDebug={() => setShowDebug((v) => !v)}
        onChangeQuality={setQuality}
      />

      {/* 2. ACTIVE CHALLENGE & STOPWATCH BANNER */}
      <div className="h-10 bg-[var(--bg-1)] border-b border-white/10 px-4 flex items-center justify-between z-10 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            {activeChallenge.id.includes('sandbox') ? (
              <span className="text-amber-400 font-bold">🛠️ SERBEST MÜHENDİSLİK KUM HAVUZU (SANDBOX)</span>
            ) : (
              <>
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{activeChallenge.title}</span>
              </>
            )}
          </span>
          <span className="text-slate-400 hidden md:inline">| {activeChallenge.targetObjective}</span>
        </div>

        {/* Stopwatch & Status */}
        <div className="flex items-center gap-3">
          {!activeChallenge.id.includes('sandbox') && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-amber-300 font-bold font-mono">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>KRONOMETRE: {formatTimer(stopwatchMs)}</span>
            </div>
          )}

          {challengeStatus === 'success' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>GÖREV BAŞARILDI! ({formatTimer(stopwatchMs)})</span>
            </div>
          )}

          {challengeStatus === 'failed' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold animate-pulse">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>GÖREV BAŞARISIZ (KIRILDI / DÜŞTÜ)</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: 2D SVG CANVAS + TELEMETRY PANEL */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full relative">
          <SvgWorldRenderer
            bodies={bodies}
            joints={joints}
            selectedBodyId={selectedBodyId}
            draggedBodyId={draggedBodyId}
            mousePos={mousePosRef.current}
            dragStartPos={null}
            pan={pan}
            zoom={zoom}
            groundSlopeDeg={groundSlopeDeg}
            terrainType={terrainType}
            waveAmplitude={waveAmplitude}
            contacts={contacts}
            showDebug={showDebug}
            windX={windX}
            onGroundSlopeHandleMouseDown={() => setIsDraggingSlopeHandle(true)}
            onBodyMouseDown={handleBodyMouseDown}
            onCanvasMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Quick HUD Overlays */}
          <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/75 border border-white/10 text-[11px] font-mono text-slate-300 space-y-1 pointer-events-none">
            <div className="text-cyan-400 font-bold">KONTROLLER:</div>
            <div>• Space: zaman · M: motor · R: reset · D: debug · .: adım</div>
            <div>• Sol tık + sürükle: parçayı tut / fırlat</div>
            <div>• Boş alan: pan · tekerlek: zoom · eğim kolu: zemin</div>
            <div>• Coulomb tutuş · tork sınırlı motor · Archimedes yüzme</div>
          </div>
        </div>

        {/* Telemetry Inspector Sidebar */}
        <TelemetryPanel
          telemetry={telemetry}
          selectedBody={selectedBody}
          allBodies={bodies}
          onUpdateBody={handleUpdateBody}
          onDeleteBody={handleDeleteBody}
        />
      </div>

      {/* 4. CHALLENGE SELECTION MODAL */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        activeChallengeId={activeChallenge.id}
        onClose={() => setIsChallengeModalOpen(false)}
        onSelectChallenge={handleSelectChallenge}
      />

    </div>
  );
}

export default FlowWorld;

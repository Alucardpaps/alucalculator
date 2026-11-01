'use client';

/**
 * 🏭 Factory Floor Digital Twin (ISO 22400 / VDI 2860)
 * Industrial Factory Simulation & Kinematics Viewport
 * 
 * Features:
 * 1. 2D DWG / DXF Factory Importer (AutoCAD Layer-to-3D Synthesis)
 * 2. 2D Top-Down Blueprint Layout Editor (Sims-style placement)
 * 3. 3D Kinematics & Sims-style Transform Gizmo / Snapping (500mm grid)
 * 4. Real 3D CAD Asset Swap Modal (STEP / STL / GLB / Industrial Presets)
 * 5. Dual-Mode Simulation (Autonomous Random Sim vs. Live IoT Sensor Feed)
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  FactoryEngine,
  type FactoryMachine,
  type RobotArmDetail,
  type AgvDetail,
  type FactoryTelemetry,
  type FactoryAnimationController,
} from '@/engines/factory/FactoryEngine';
import {
  type FactoryTwinSchema,
  type FactoryTwinComponent,
  type LiveIoTPayload,
  DEFAULT_FACTORY_PLAN,
} from '@/engines/factory/FactoryTwinSchema';
import { DxfFactoryImporter } from '@/engines/factory/DxfFactoryImporter';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  Activity,
  Layers,
  Zap,
  Gauge,
  Bot,
  Truck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  FolderOpen,
  Sliders,
  Move,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Radio,
  FileCode,
  Sparkles,
  RefreshCw,
  Box,
  Compass,
  Check,
  X,
  UploadCloud,
} from 'lucide-react';

export function FactorySimulation() {
  const { language } = useI18nStore();
  const mountRef = useRef<HTMLDivElement>(null);

  // Active View Tab: 3D Twin vs 2D Floor Blueprint
  const [activeTab, setActiveTab] = useState<'3d' | '2d_blueprint'>('3d');

  // Simulation controls state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [simMode, setSimMode] = useState<'stochastic_random' | 'live_iot_stream'>('stochastic_random');

  // Active Factory Schema
  const [factorySchema, setFactorySchema] = useState<FactoryTwinSchema>(DEFAULT_FACTORY_PLAN);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('cnc-5axis-1');

  // 3D Asset Swap Modal State
  const [isAssetSwapModalOpen, setIsAssetSwapModalOpen] = useState(false);
  const [assetSwapStatus, setAssetSwapStatus] = useState<string | null>(null);

  // Live IoT Telemetry Simulator Controls
  const [iotSpindleRpm, setIotSpindleRpm] = useState<number>(16400);
  const [iotDoorOpen, setIotDoorOpen] = useState<boolean>(false);
  const [iotConveyorSpeed, setIotConveyorSpeed] = useState<number>(0.8);
  const [iotRobotJ1, setIotRobotJ1] = useState<number>(30);
  const [iotRobotJ2, setIotRobotJ2] = useState<number>(-45);
  const [iotRobotJ3, setIotRobotJ3] = useState<number>(85);

  // Live simulation data state
  const [machines, setMachines] = useState<FactoryMachine[]>([]);
  const [robotStates, setRobotStates] = useState<RobotArmDetail[]>([]);
  const [agvStates, setAgvStates] = useState<AgvDetail[]>([]);
  const [telemetry, setTelemetry] = useState<FactoryTelemetry>({
    oeePercent: 86.9,
    availabilityPercent: 94.8,
    performancePercent: 92.4,
    qualityPercent: 99.2,
    totalPartsProduced: 1420,
    taktTimeSeconds: 42.5,
    hourlyProductionRate: 84,
    totalPowerConsumptionKw: 68.4,
    bottleneckStation: 'DMG Mori #2 (Tool Change Cycle)',
    activeAlertsCount: 0,
  });

  // Three.js instances
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animControllerRef = useRef<FactoryAnimationController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 3D SCENE INITIALIZATION & REBUILD HOOK
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 180, 260);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controlsRef.current = controls;

    // Lighting (Overhead Factory Luminaire Array)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainDirectional = new THREE.DirectionalLight(0xffffff, 1.2);
    mainDirectional.position.set(100, 220, 120);
    mainDirectional.castShadow = true;
    mainDirectional.shadow.mapSize.width = 2048;
    mainDirectional.shadow.mapSize.height = 2048;
    scene.add(mainDirectional);

    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.4);
    fillLight.position.set(-120, 140, -100);
    scene.add(fillLight);

    // Build Factory Scene via FactoryEngine using current schema
    const { sceneGroup, machines: initialMachines, animController } = FactoryEngine.createFactoryScene(factorySchema);
    scene.add(sceneGroup);
    setMachines(initialMachines);
    animControllerRef.current = animController;
    animController.setSimulationMode(simMode);

    // Raycasting selection when user clicks a machine in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (evt: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sceneGroup.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== sceneGroup) {
          if (cur.userData?.componentId) {
            setSelectedMachineId(cur.userData.componentId);
            return;
          }
          cur = cur.parent;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    let animId = 0;

    const renderLoop = (now: number) => {
      animId = requestAnimationFrame(renderLoop);
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      if (isPlayingRef.current) {
        const simUpdate = animController.update(deltaSec, speedRef.current);
        setRobotStates(simUpdate.robotStates);
        setAgvStates(simUpdate.agvStates);
        setTelemetry(simUpdate.telemetry);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      animController.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [factorySchema]);

  // Sync refs for animation loop
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const speedRef = useRef(speedMultiplier);
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Sync simulation mode to engine controller
  useEffect(() => {
    if (animControllerRef.current) {
      animControllerRef.current.setSimulationMode(simMode);
    }
  }, [simMode]);

  // Live IoT Telemetry Dispatcher to 3D engine
  useEffect(() => {
    if (simMode !== 'live_iot_stream' || !animControllerRef.current) return;

    const payload: LiveIoTPayload = {
      timestamp: Date.now(),
      machines: {
        'cnc-5axis-1': {
          spindleRpm: iotSpindleRpm,
          doorOpen: iotDoorOpen,
          status: iotDoorOpen ? 'tool_change' : 'running',
          loadPercentage: Math.round((iotSpindleRpm / 20000) * 100),
          temperatureC: 38 + (iotSpindleRpm / 3000),
        },
      },
      robots: {
        'robot-kuka-1': {
          jointAngles: [iotRobotJ1, iotRobotJ2, iotRobotJ3, 0, 45, 90],
          payloadKg: 12.5,
          toolAction: 'Live IoT PLC Synchronized Joint Feed',
          status: 'running',
        },
      },
      conveyors: {
        'conveyor-main': {
          speedMps: iotConveyorSpeed,
          jammed: iotConveyorSpeed === 0,
        },
      },
    };

    animControllerRef.current.applyLiveIoTData(payload);
  }, [simMode, iotSpindleRpm, iotDoorOpen, iotConveyorSpeed, iotRobotJ1, iotRobotJ2, iotRobotJ3]);

  // Camera presets
  const handleCameraPreset = (preset: 'iso' | 'top' | 'cnc' | 'robots' | 'cmm') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    if (preset === 'iso') {
      cam.position.set(0, 180, 260);
      ctrl.target.set(0, 0, 0);
    } else if (preset === 'top') {
      cam.position.set(0, 320, 1);
      ctrl.target.set(0, 0, 0);
    } else if (preset === 'cnc') {
      cam.position.set(-40, 60, -10);
      ctrl.target.set(-40, 15, -70);
    } else if (preset === 'robots') {
      cam.position.set(-80, 45, 30);
      ctrl.target.set(-80, 15, -20);
    } else if (preset === 'cmm') {
      cam.position.set(0, 40, 150);
      ctrl.target.set(0, 15, 100);
    }
    ctrl.update();
  };

  // ─────────────────────────────────────────────────────────────
  // SIMS-STYLE TRANSFORM UPDATE HANDLER (500mm Grid Snapped)
  // ─────────────────────────────────────────────────────────────
  const updateComponentPosition = useCallback(
    (compIndex: number, deltaX: number, deltaZ: number, deltaRot: number) => {
      setFactorySchema((prev) => {
        const nextComps = [...prev.components];
        const target = nextComps[compIndex];
        if (!target) return prev;

        const snap = prev.grid.snapSizeMm || 500;
        const newX = Math.round((target.placement.x + deltaX) / snap) * snap;
        const newZ = Math.round((target.placement.z + deltaZ) / snap) * snap;
        const newRot = (target.placement.rotationY + deltaRot + 360) % 360;

        nextComps[compIndex] = {
          ...target,
          placement: {
            ...target.placement,
            x: newX,
            z: newZ,
            rotationY: newRot,
          },
        };

        // Realtime sync to 3D engine
        if (animControllerRef.current) {
          animControllerRef.current.updateComponentTransform(target.id, newX, newZ, newRot);
        }

        return { ...prev, components: nextComps };
      });
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // DXF / DWG FILE IMPORT HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = DxfFactoryImporter.parseDxfToFactorySchema(text);
      if (parsed.success && parsed.schema && parsed.schema.components.length > 0) {
        setFactorySchema(parsed.schema);
        setSelectedMachineId(parsed.schema.components[0].id);
      } else {
        alert(
          language === 'tr'
            ? `DXF ayrıştırma hatası: ${parsed.errors.join(', ') || 'Katmanlar tanınamadı.'}`
            : `DXF parse error: ${parsed.errors.join(', ') || 'Layers not recognized.'}`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleDxf = () => {
    const sampleDxf = DxfFactoryImporter.generateSampleFactoryDxf();
    const parsed = DxfFactoryImporter.parseDxfToFactorySchema(sampleDxf);
    if (parsed.success && parsed.schema) {
      setFactorySchema(parsed.schema);
      if (parsed.schema.components.length > 0) {
        setSelectedMachineId(parsed.schema.components[0].id);
      }
    }
  };

  const selectedCompIndex = useMemo(
    () => factorySchema.components.findIndex((c) => c.id === selectedMachineId),
    [factorySchema.components, selectedMachineId]
  );

  const selectedComp = factorySchema.components[selectedCompIndex] || factorySchema.components[0];

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] text-[var(--ink)] font-mono select-none overflow-hidden">
      {/* Hidden file input for DWG/DXF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf,.dwg"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ─── TOP INDUSTRIAL INSTRUMENT BANNER (ISO 22400 OEE & TELEMETRY) ─── */}
      <div className="flex-none flex flex-wrap items-center justify-between px-3.5 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] z-20 gap-3">
        {/* Title & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)]">
            <Cpu size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink)] tracking-wider uppercase">
                {t12(language, 'Factory Digital Twin', 'Fabrika Dijital İkizi')}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                ● {t12(language, 'SIM ACTIVE', 'SİMÜLASYON AKTİF')}
              </span>
            </div>
            <span className="text-[9.5px] text-[var(--alu-dim)]">
              ISO 22400 · VDI 2860 · 2D DWG Synthesizer · Sims-Style Placement
            </span>
          </div>
        </div>

        {/* ─── TAB SWITCHER: 3D TWIN vs 2D BLUEPRINT ─── */}
        <div className="flex items-center rounded-[var(--radius-s)] bg-[var(--bg-2)] p-0.5 border border-[var(--line)]">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`px-3 py-1 rounded-[var(--radius-s)] text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === '3d'
                ? 'bg-[var(--cyan)] text-slate-950 shadow-sm'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Box size={12} />
            <span>{t12(language, '3D Digital Twin', '3D Dijital İkiz')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('2d_blueprint')}
            className={`px-3 py-1 rounded-[var(--radius-s)] text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              activeTab === '2d_blueprint'
                ? 'bg-[var(--cyan)] text-slate-950 shadow-sm'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Compass size={12} />
            <span>{t12(language, '2D Layout (AutoCAD)', '2D Kat Planı (DWG/CAD)')}</span>
          </button>
        </div>

        {/* DWG / DXF Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-[var(--cyan)] text-[10px] text-[var(--alu)] hover:text-cyan-300 transition-colors flex items-center gap-1"
            title={t12(language, 'Import 2D AutoCAD DXF/DWG Plan', 'AutoCAD 2D DWG/DXF Çizimi Aktar')}
          >
            <UploadCloud size={12} className="text-[var(--cyan)]" />
            <span className="hidden sm:inline">{t12(language, 'Import DWG/DXF', 'DWG/DXF Çizim Aktar')}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleDxf}
            className="px-2.5 py-1 rounded-[var(--radius-s)] bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-[10px] text-cyan-300 transition-colors flex items-center gap-1"
            title={t12(language, 'Load Sample 2D Factory Blueprint', 'Örnek 2D Fabrika Çizimini Yükle')}
          >
            <FileCode size={12} />
            <span>{t12(language, 'Sample 2D Blueprint', 'Örnek 2D Çizim')}</span>
          </button>
        </div>

        {/* Live KPI Indicators */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex items-center gap-1.5">
            <Gauge size={13} className="text-[var(--cyan)]" />
            <div>
              <span className="text-[8px] text-[var(--alu-dim)] uppercase block">OEE</span>
              <span className="font-bold text-[var(--cyan)]">{telemetry.oeePercent}%</span>
            </div>
          </div>
          <div className="px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <div>
              <span className="text-[8px] text-[var(--alu-dim)] uppercase block">PARTS</span>
              <span className="font-bold text-emerald-400">{telemetry.totalPartsProduced}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DUAL-MODE SIMULATION TOOLBAR ─── */}
      <div className="flex-none flex flex-wrap items-center justify-between px-3.5 py-1.5 bg-[var(--bg-2)] border-b border-[var(--line)] text-[10px] z-20 gap-2">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[var(--alu-dim)] uppercase tracking-wider">
            {t12(language, 'Driver Mode:', 'Sürücü Modu:')}
          </span>
          <button
            type="button"
            onClick={() => setSimMode('stochastic_random')}
            className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition-all ${
              simMode === 'stochastic_random'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-black/30 text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Sparkles size={11} />
            <span>{t12(language, '🎲 Autonomous Random Sim (Sims)', '🎲 Otonom Rastgele Sim (Sims)')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSimMode('live_iot_stream')}
            className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition-all ${
              simMode === 'live_iot_stream'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-black/30 text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Radio size={11} className={simMode === 'live_iot_stream' ? 'animate-pulse text-cyan-400' : ''} />
            <span>{t12(language, '📡 Live IoT Sensor Stream', '📡 Canlı Sensör / IoT Verisi')}</span>
          </button>
        </div>

        {/* Play/Pause & Speed */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded bg-[var(--bg-1)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--cyan)]"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="flex items-center rounded bg-black/40 border border-[var(--line)] text-[9px] font-bold">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-1.5 py-0.5 ${
                    speedMultiplier === spd ? 'text-[var(--cyan)] font-black bg-cyan-950/80' : 'text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE IOT SENSOR SIMULATOR PANEL (WHEN IN IOT MODE) ─── */}
      {simMode === 'live_iot_stream' && (
        <div className="flex-none bg-gradient-to-r from-cyan-950/80 via-[var(--bg-2)] to-cyan-950/80 border-b border-cyan-500/40 px-3.5 py-2 flex flex-wrap items-center justify-between text-[10px] gap-4 z-20">
          <div className="flex items-center gap-2 text-cyan-300 font-bold shrink-0">
            <Activity size={14} className="text-cyan-400 animate-spin" />
            <span>{t12(language, 'PLC & SENSOR INJECTION SLIDERS:', 'PLC VE SENSÖR VERİ ENJEKSİYONU:')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[9.5px]">
            {/* Robot J1 Angle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--alu-dim)]">Robot J1:</span>
              <input
                type="range"
                min="-120"
                max="120"
                value={iotRobotJ1}
                onChange={(e) => setIotRobotJ1(Number(e.target.value))}
                className="w-20 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="font-bold text-cyan-300 w-8">{iotRobotJ1}°</span>
            </div>

            {/* Robot J2 Angle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--alu-dim)]">Robot J2:</span>
              <input
                type="range"
                min="-90"
                max="45"
                value={iotRobotJ2}
                onChange={(e) => setIotRobotJ2(Number(e.target.value))}
                className="w-20 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="font-bold text-cyan-300 w-8">{iotRobotJ2}°</span>
            </div>

            {/* CNC Spindle RPM */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--alu-dim)]">CNC RPM:</span>
              <input
                type="range"
                min="0"
                max="24000"
                step="500"
                value={iotSpindleRpm}
                onChange={(e) => setIotSpindleRpm(Number(e.target.value))}
                className="w-20 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="font-bold text-cyan-300 w-12">{iotSpindleRpm}</span>
            </div>

            {/* Conveyor Speed */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--alu-dim)]">Bant:</span>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.1"
                value={iotConveyorSpeed}
                onChange={(e) => setIotConveyorSpeed(Number(e.target.value))}
                className="w-16 accent-[var(--cyan)] cursor-pointer"
              />
              <span className="font-bold text-cyan-300 w-10">{iotConveyorSpeed} m/s</span>
            </div>

            {/* CNC Door Toggle */}
            <button
              type="button"
              onClick={() => setIotDoorOpen(!iotDoorOpen)}
              className={`px-2 py-0.5 rounded border font-bold transition-all ${
                iotDoorOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-black/50 text-slate-300 border-white/10'
              }`}
            >
              {iotDoorOpen ? '🚪 Kapı Açık' : '🚪 Kapı Kapalı'}
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT VIEWPORT (3D TWIN OR 2D BLUEPRINT) ─── */}
      <div className="flex-1 min-h-0 relative w-full h-full">
        {/* 3D WebGL Canvas Container */}
        <div
          ref={mountRef}
          className={`w-full h-full ${activeTab === '3d' ? 'block' : 'hidden'}`}
        />

        {/* 2D Top-Down Blueprint Canvas (Sims / AutoCAD style) */}
        {activeTab === '2d_blueprint' && (
          <div className="w-full h-full bg-[var(--bg-0)] relative flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400">
                {t12(language, '📐 2D AutoCAD Layout Blueprint (Top-Down)', '📐 2D AutoCAD Kat Planı (Kuşbakışı)')}
              </span>
              <span className="text-[9px] text-[var(--alu-dim)]">
                {t12(language, 'Click component to select · Snaps to 500mm grid', 'Bileşene tıklayarak seçin · 500mm ızgaraya kilitlenir')}
              </span>
            </div>

            {/* SVG Interactive Floor Plan */}
            <div className="w-full max-w-4xl h-full max-h-[600px] border border-cyan-500/30 rounded-xl bg-[var(--bg-1)] relative shadow-2xl overflow-hidden">
              <svg
                viewBox="-260 -190 520 380"
                className="w-full h-full"
                style={{ background: 'radial-gradient(circle at center, #0d1525 0%, #060a12 100%)' }}
              >
                {/* 2D Floor Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                  <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#00e5ff" strokeWidth="0.8" strokeOpacity="0.15" />
                  </pattern>
                </defs>
                <rect x="-260" y="-190" width="520" height="380" fill="url(#grid)" />
                <rect x="-260" y="-190" width="520" height="380" fill="url(#grid-major)" />

                {/* Machine Components in 2D */}
                {factorySchema.components.map((c) => {
                  const cx = c.placement.x / 100;
                  const cz = c.placement.z / 100;
                  const w = Math.max(10, c.geometry.dimensions.width / 100);
                  const d = Math.max(10, c.geometry.dimensions.depth / 100);
                  const isSelected = c.id === selectedMachineId;

                  return (
                    <g
                      key={c.id}
                      transform={`translate(${cx}, ${cz}) rotate(${c.placement.rotationY || 0})`}
                      onClick={() => setSelectedMachineId(c.id)}
                      className="cursor-pointer group"
                    >
                      {/* Bounding shape */}
                      <rect
                        x={-w / 2}
                        y={-d / 2}
                        width={w}
                        height={d}
                        rx="2"
                        fill={
                          isSelected
                            ? '#0284c7'
                            : c.type.includes('robot')
                            ? '#ea580c'
                            : c.type.includes('conveyor')
                            ? '#334155'
                            : '#1e293b'
                        }
                        fillOpacity={isSelected ? 0.8 : 0.6}
                        stroke={isSelected ? '#00e5ff' : '#64748b'}
                        strokeWidth={isSelected ? 2 : 0.8}
                      />
                      {/* Orientation notch */}
                      <line x1={0} y1={-d / 2} x2={0} y2={-d / 2 + 4} stroke="#00e5ff" strokeWidth="2" />
                      {/* Label */}
                      <text
                        x={0}
                        y={2}
                        fontSize="6"
                        fill={isSelected ? '#ffffff' : '#94a3b8'}
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {c.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* ─── 3D CAMERA FLOATING PRESET HUD ─── */}
        {activeTab === '3d' && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1 bg-[var(--bg-1)]/90 border border-[var(--line)] p-1 rounded-[var(--radius-s)] text-[9.5px]">
            <span className="text-[var(--alu-dim)] px-1 uppercase text-[8px]">KAMERA:</span>
            <button
              type="button"
              onClick={() => handleCameraPreset('iso')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-white"
            >
              İzo 3D
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('top')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-white"
            >
              Üst 2D
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('cnc')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-cyan-300"
            >
              5-Axis CNC
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('robots')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-amber-300"
            >
              KUKA Robot
            </button>
            <button
              type="button"
              onClick={() => handleCameraPreset('cmm')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-rose-300"
            >
              CMM Kalite
            </button>
          </div>
        )}

        {/* ─── SIMS-STYLE TRANSFORM INSPECTOR (FLOATING RIGHT PANEL) ─── */}
        {selectedComp && (
          <div className="absolute top-3 right-3 z-10 w-80 bg-[var(--bg-1)]/95 border border-[var(--line)] rounded-[var(--radius-m)] shadow-2xl flex flex-col p-3.5 space-y-3 max-h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-2.5">
              <div className="min-w-0">
                <span className="text-[9px] text-[var(--cyan)] uppercase font-bold tracking-wider block">
                  {t12(language, 'Selected Component (Sims Inspector)', 'Seçili Bileşen (Sims Paneli)')}
                </span>
                <h3 className="text-xs font-bold text-white truncate">{selectedComp.name}</h3>
                <span className="text-[9px] text-[var(--alu-dim)]">ID: {selectedComp.id} · Tip: {selectedComp.type}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMachineId('')}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>

            {/* Sims Position Controls (500mm Grid Snapping) */}
            <div className="space-y-1.5 p-2 rounded bg-black/40 border border-white/5">
              <div className="flex items-center justify-between text-[9px] text-[var(--alu-dim)] uppercase">
                <span>{t12(language, 'Floor Position & Angle:', 'Zemin Konumu & Açı:')}</span>
                <span className="text-cyan-400 font-bold">Snap: 500mm</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[8px] text-[var(--alu-dim)] block">X</span>
                  <span className="font-bold text-white">{selectedComp.placement.x} mm</span>
                </div>
                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[8px] text-[var(--alu-dim)] block">Z</span>
                  <span className="font-bold text-white">{selectedComp.placement.z} mm</span>
                </div>
                <div className="p-1 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                  <span className="text-[8px] text-[var(--alu-dim)] block">AÇI</span>
                  <span className="font-bold text-cyan-300">{selectedComp.placement.rotationY}°</span>
                </div>
              </div>

              {/* D-Pad / Sims Arrow Movement Controls */}
              <div className="pt-2 flex flex-col items-center space-y-1">
                <button
                  type="button"
                  onClick={() => updateComponentPosition(selectedCompIndex, 0, -500, 0)}
                  className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200"
                  title="Move -Z (500mm)"
                >
                  <ArrowUp size={13} />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateComponentPosition(selectedCompIndex, -500, 0, 0)}
                    className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200"
                    title="Move -X (500mm)"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <div className="p-1.5 rounded bg-black/60 border border-cyan-500/30 text-[9px] text-cyan-300 font-bold">
                    MOVE
                  </div>
                  <button
                    type="button"
                    onClick={() => updateComponentPosition(selectedCompIndex, 500, 0, 0)}
                    className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200"
                    title="Move +X (500mm)"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => updateComponentPosition(selectedCompIndex, 0, 500, 0)}
                  className="p-1.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-200"
                  title="Move +Z (500mm)"
                >
                  <ArrowDown size={13} />
                </button>
              </div>

              {/* Quick Rotation Buttons */}
              <div className="pt-2 flex items-center justify-center gap-1.5">
                {[-90, -45, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => updateComponentPosition(selectedCompIndex, 0, 0, deg)}
                    className="px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[9px] text-slate-300 font-bold"
                  >
                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap 3D Model with Real CAD Button */}
            <button
              type="button"
              onClick={() => setIsAssetSwapModalOpen(true)}
              className="w-full py-2 rounded-[var(--radius-s)] bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-md "
            >
              <Box size={13} />
              <span>{t12(language, 'Swap with Real 3D CAD Model', 'Gerçek 3D CAD Modeli ile Değiştir')}</span>
            </button>

            {/* Live Component Telemetry */}
            <div className="space-y-1.5 text-[10px] border-t border-[var(--line)] pt-2">
              <span className="text-[9px] text-[var(--alu-dim)] uppercase block">
                {t12(language, 'Station Telemetry:', 'İstasyon Telemetrisi:')}
              </span>
              <div className="flex justify-between text-slate-300">
                <span>{t12(language, 'Active Job:', 'Aktif İş:')}</span>
                <span className="font-bold text-white truncate max-w-[150px]">{selectedComp.telemetry.activeJob}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{t12(language, 'Power Consumption:', 'Güç Tüketimi:')}</span>
                <span className="font-bold text-amber-400">{selectedComp.telemetry.powerKw} kW</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{t12(language, 'Temperature:', 'Sıcaklık:')}</span>
                <span className="font-bold text-rose-400">{selectedComp.telemetry.temperatureC}°C</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── REAL 3D CAD ASSET SWAP MODAL ─── */}
        {isAssetSwapModalOpen && selectedComp && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] shadow-2xl p-5 space-y-4 font-mono">
              <div className="flex items-start justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Box size={16} className="text-cyan-400" />
                    <span>{t12(language, 'Swap 3D Asset Model', 'Gerçek 3D CAD Modeli Seç')}</span>
                  </h3>
                  <p className="text-[10px] text-[var(--alu-dim)] mt-0.5">
                    {selectedComp.name} ({selectedComp.type})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssetSwapModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Presets List */}
              <div className="space-y-2">
                <span className="text-[10px] text-[var(--alu-dim)] uppercase block">
                  {t12(language, 'Standard Industrial 3D Library:', 'Endüstriyel 3D CAD Kütüphanesi:')}
                </span>

                {[
                  { id: 'kuka-kr120', name: 'KUKA KR 120 R2700 Articulated Arm (STEP/GLTF)', type: 'robot' },
                  { id: 'fanuc-m20', name: 'FANUC M-20iD/25 High-Inertia Robot (CAD Solid)', type: 'robot' },
                  { id: 'dmg-dmu50', name: 'DMG MORI DMU 50 5-Axis Center (Detailed 3D)', type: 'machine' },
                  { id: 'mazak-qt250', name: 'Mazak Quick Turn 250 CNC Lathe (Detailed CAD)', type: 'machine' },
                  { id: 'rexroth-line', name: 'Bosch Rexroth TS2 Plus Roller Track (Modular)', type: 'conveyor' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (animControllerRef.current) {
                        animControllerRef.current.swapComponent3DAsset(selectedComp.id, item.id);
                      }
                      setAssetSwapStatus(`Loaded: ${item.name}`);
                      setTimeout(() => {
                        setAssetSwapStatus(null);
                        setIsAssetSwapModalOpen(false);
                      }, 1000);
                    }}
                    className="w-full p-2.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] hover:border-cyan-500/50 text-left flex items-center justify-between text-xs text-slate-200 transition-colors"
                  >
                    <span>{item.name}</span>
                    <Check size={13} className="text-cyan-400" />
                  </button>
                ))}
              </div>

              {/* Custom CAD upload file button */}
              <div className="pt-2 border-t border-[var(--line)]">
                <label className="w-full py-2.5 rounded border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <UploadCloud size={16} className="text-cyan-400 mb-1" />
                  <span className="text-[10px] font-bold text-cyan-300">
                    {t12(language, 'Upload Custom .STEP / .STL / .GLB File', 'Özel .STEP / .STL / .GLB Dosyası Yükle')}
                  </span>
                  <input
                    type="file"
                    accept=".step,.stp,.stl,.glb,.gltf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && animControllerRef.current) {
                        animControllerRef.current.swapComponent3DAsset(selectedComp.id, f.name);
                        setAssetSwapStatus(`Imported custom CAD: ${f.name}`);
                        setTimeout(() => {
                          setAssetSwapStatus(null);
                          setIsAssetSwapModalOpen(false);
                        }, 1200);
                      }
                    }}
                  />
                </label>
              </div>

              {assetSwapStatus && (
                <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] text-center font-bold">
                  {assetSwapStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FactorySimulation;

/**
 * Factory Digital Twin Engine (ISO 22400 / VDI 2860)
 * Deterministic Industrial Factory Floor Simulation & Kinematics Engine
 * 
 * Standards cited:
 * - ISO 22400: Automation systems - KPIs for manufacturing operations management (OEE, Takt, Availability)
 * - VDI 2860: Assembly and handling technology - Kinematic designations & degrees of freedom
 * - ISO 14067: Carbon footprint of products - Machinery power & energy consumption
 */

import * as THREE from 'three';
import {
  type FactoryTwinSchema,
  type FactoryTwinComponent,
  type LiveIoTPayload,
  DEFAULT_FACTORY_PLAN,
} from './FactoryTwinSchema';

export interface FactoryMachine {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotationY?: number;
  status: 'running' | 'idle' | 'tool_change' | 'warning' | 'stopped';
  activeJob: string;
  loadPercentage: number;
  temperatureC: number;
  powerKw: number;
  spindleRpm?: number;
  vibrationMms?: number;
  jointAngles?: number[];
  batteryPct?: number;
  cycleTimeSec?: number;
}

export interface RobotArmDetail {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'tool_change' | 'warning';
  task: string;
  jointAngles: number[];
  toolAction: string;
  payloadKg: number;
}

export interface AgvDetail {
  id: string;
  name: string;
  x: number;
  z: number;
  speedMps: number;
  batteryPct: number;
  task: string;
  payload: string;
}

export interface FactoryTelemetry {
  oeePercent: number;
  availabilityPercent: number;
  performancePercent: number;
  qualityPercent: number;
  totalPartsProduced: number;
  taktTimeSeconds: number;
  hourlyProductionRate: number;
  totalPowerConsumptionKw: number;
  bottleneckStation: string;
  activeAlertsCount: number;
}

export interface FactoryAnimationController {
  update: (deltaSeconds: number, speedMultiplier: number) => {
    completedPartsIncrement: number;
    robotStates: RobotArmDetail[];
    agvStates: AgvDetail[];
    telemetry: FactoryTelemetry;
  };
  setSimulationMode: (mode: 'stochastic_random' | 'live_iot_stream') => void;
  applyLiveIoTData: (payload: LiveIoTPayload) => void;
  updateComponentTransform: (id: string, xMm: number, zMm: number, rotYDeg: number) => void;
  getComponentTransform: (id: string) => { xMm: number; zMm: number; rotYDeg: number } | null;
  swapComponent3DAsset: (id: string, assetUrl: string) => void;
  dispose: () => void;
}

export class FactoryEngine {
  /**
   * Builds the complete 3D Industrial Factory scene with machine cells,
   * safety perimeters, conveyors, and kinematics animation hooks from a schema.
   */
  public static createFactoryScene(schemaInput?: FactoryTwinSchema): {
    sceneGroup: THREE.Group;
    machines: FactoryMachine[];
    animController: FactoryAnimationController;
    componentGroupMap: Map<string, THREE.Group>;
  } {
    const schema = schemaInput || DEFAULT_FACTORY_PLAN;
    const root = new THREE.Group();
    root.name = 'FactorySceneRoot';

    // ─────────────────────────────────────────────────────────────
    // 1. FACTORY FLOOR (Epoxy Coated Industrial Concrete)
    // ─────────────────────────────────────────────────────────────
    const floorWidth = (schema.grid.floorWidthMm || 50000) / 100;
    const floorDepth = (schema.grid.floorDepthMm || 38000) / 100;

    const floorGeom = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      roughness: 0.35,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorMesh.name = 'FactoryFloor';
    root.add(floorMesh);

    // Floor Guidance Grid (500mm / 5 Three.js unit grid)
    const gridHelper = new THREE.GridHelper(floorWidth, Math.round(floorWidth / 5), 0x00e5ff, 0x1e293b);
    gridHelper.position.y = 0.05;
    root.add(gridHelper);

    // Component tracking structures
    const componentGroupMap = new Map<string, THREE.Group>();
    const machines: FactoryMachine[] = [];

    // Internal animation refs
    interface CncRef {
      id: string;
      group: THREE.Group;
      doorMesh: THREE.Mesh;
      spindleMesh: THREE.Mesh;
      beaconMesh: THREE.Mesh;
      light: THREE.PointLight;
    }
    const cncRefs: CncRef[] = [];

    interface RobotRef {
      id: string;
      group: THREE.Group;
      baseGroup: THREE.Group;
      joint1Group: THREE.Group;
      joint2Group: THREE.Group;
      joint3Group: THREE.Group;
      gripperMesh: THREE.Mesh;
    }
    const robotRefs: RobotRef[] = [];

    interface AgvRef {
      id: string;
      group: THREE.Group;
      t: number;
      speed: number;
      pathPoints: THREE.Vector3[];
      light: THREE.PointLight;
    }
    const agvRefs: AgvRef[] = [];

    const billetMeshes: THREE.Mesh[] = [];

    // Helper: Mark all children with componentId for Raycasting
    const tagMeshHierarchy = (obj: THREE.Object3D, compId: string) => {
      obj.userData = { ...obj.userData, componentId: compId };
      obj.children.forEach((child) => tagMeshHierarchy(child, compId));
    };

    // ─────────────────────────────────────────────────────────────
    // 2. BUILD COMPONENTS FROM SCHEMA
    // ─────────────────────────────────────────────────────────────
    schema.components.forEach((comp) => {
      const compGroup = new THREE.Group();
      compGroup.name = `Comp_${comp.id}`;
      // Coordinates: 100 mm = 1 Three.js unit
      const posX = comp.placement.x / 100;
      const posY = (comp.placement.y || 0) / 100;
      const posZ = comp.placement.z / 100;
      const rotY = (comp.placement.rotationY || 0) * (Math.PI / 180);

      compGroup.position.set(posX, posY, posZ);
      compGroup.rotation.y = rotY;

      // ── TYPE: CNC 5-AXIS / LATHE ──
      if (comp.type === 'cnc_5axis' || comp.type === 'cnc_lathe') {
        const w = (comp.geometry.dimensions.width || 5000) / 100;
        const h = (comp.geometry.dimensions.height || 4400) / 100;
        const d = (comp.geometry.dimensions.depth || 4400) / 100;

        // Cabin
        const cabinGeom = new THREE.BoxGeometry(w, h, d);
        const cabinMat = new THREE.MeshStandardMaterial({
          color: comp.type === 'cnc_5axis' ? 0x1e293b : 0x0f172a,
          metalness: 0.6,
          roughness: 0.3,
        });
        const cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
        cabinMesh.position.y = h / 2;
        cabinMesh.castShadow = true;
        cabinMesh.receiveShadow = true;
        compGroup.add(cabinMesh);

        // Window
        const windowGeom = new THREE.BoxGeometry(w * 0.48, h * 0.5, 1);
        const windowMat = new THREE.MeshPhysicalMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          transmission: 0.8,
        });
        const windowMesh = new THREE.Mesh(windowGeom, windowMat);
        windowMesh.position.set(0, h * 0.54, d / 2 + 0.5);
        compGroup.add(windowMesh);

        // Door
        const doorGeom = new THREE.BoxGeometry(w * 0.52, h * 0.6, 1.5);
        const doorMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.7,
          roughness: 0.25,
        });
        const doorMesh = new THREE.Mesh(doorGeom, doorMat);
        doorMesh.position.set(0, h * 0.54, d / 2 + 0.8);
        compGroup.add(doorMesh);

        // Spindle
        const spindleGeom = new THREE.CylinderGeometry(2.5, 3.5, 12, 16);
        const spindleMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.9,
          roughness: 0.15,
        });
        const spindleMesh = new THREE.Mesh(spindleGeom, spindleMat);
        spindleMesh.position.set(0, h * 0.58, 0);
        compGroup.add(spindleMesh);

        // 5-Axis Rotary Trunnion Table / Fixture Pallet
        const tableGeom = new THREE.CylinderGeometry(w * 0.24, w * 0.26, 3, 24);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
        const tableMesh = new THREE.Mesh(tableGeom, tableMat);
        tableMesh.position.set(0, h * 0.28, 0);
        tableMesh.receiveShadow = true;
        compGroup.add(tableMesh);

        // Clamped Workpiece Billet (Active Machining Solid from CAD)
        const workpieceGeom = new THREE.BoxGeometry(w * 0.16, 4.5, d * 0.16);
        const workpieceMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.85,
          roughness: 0.2,
        });
        const workpieceMesh = new THREE.Mesh(workpieceGeom, workpieceMat);
        workpieceMesh.position.set(0, h * 0.28 + 3.5, 0);
        workpieceMesh.castShadow = true;
        compGroup.add(workpieceMesh);

        // Working Light
        const cncLight = new THREE.PointLight(0x00e5ff, 1.2, 35);
        cncLight.position.set(0, h * 0.64, 5);
        compGroup.add(cncLight);

        // Andon Tower
        const poleGeom = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const poleMesh = new THREE.Mesh(poleGeom, poleMat);
        poleMesh.position.set(w * 0.4, h + 6, -d * 0.36);
        compGroup.add(poleMesh);

        const beaconGeom = new THREE.CylinderGeometry(1.4, 1.4, 3, 12);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: comp.telemetry.status === 'warning' ? 0xf59e0b : comp.telemetry.status === 'tool_change' ? 0x0284c7 : 0x10b981,
          emissive: comp.telemetry.status === 'warning' ? 0xf59e0b : comp.telemetry.status === 'tool_change' ? 0x0284c7 : 0x10b981,
          emissiveIntensity: 0.8,
        });
        const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
        beaconMesh.position.set(w * 0.4, h + 13, -d * 0.36);
        compGroup.add(beaconMesh);

        cncRefs.push({ id: comp.id, group: compGroup, doorMesh, spindleMesh, beaconMesh, light: cncLight });
      }

      // ── TYPE: ROBOT 6-AXIS ──
      else if (comp.type === 'robot_6axis') {
        const pedGeom = new THREE.CylinderGeometry(7, 8, 8, 16);
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const pedMesh = new THREE.Mesh(pedGeom, pedMat);
        pedMesh.position.y = 4;
        compGroup.add(pedMesh);

        const j1Group = new THREE.Group();
        j1Group.position.y = 8;
        const armColor = comp.geometry.color === '#eab308' ? 0xeab308 : 0xf97316;
        const armMat = new THREE.MeshStandardMaterial({ color: armColor, roughness: 0.35, metalness: 0.4 });

        const j1Geom = new THREE.CylinderGeometry(6, 6, 6, 16);
        const j1Mesh = new THREE.Mesh(j1Geom, armMat);
        j1Mesh.position.y = 3;
        j1Group.add(j1Mesh);

        const j2Group = new THREE.Group();
        j2Group.position.y = 6;
        const j2Geom = new THREE.BoxGeometry(4, 22, 5);
        const j2Mesh = new THREE.Mesh(j2Geom, armMat);
        j2Mesh.position.y = 11;
        j2Group.add(j2Mesh);

        const j3Group = new THREE.Group();
        j3Group.position.y = 22;
        const j3Geom = new THREE.BoxGeometry(3.5, 18, 4);
        const j3Mesh = new THREE.Mesh(j3Geom, armMat);
        j3Mesh.position.y = 9;
        j3Group.add(j3Mesh);

        const gripGeom = new THREE.BoxGeometry(4, 4, 3);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
        const gripMesh = new THREE.Mesh(gripGeom, gripMat);
        gripMesh.position.y = 18;
        j3Group.add(gripMesh);

        j2Group.add(j3Group);
        j1Group.add(j2Group);
        compGroup.add(j1Group);

        robotRefs.push({
          id: comp.id,
          group: compGroup,
          baseGroup: compGroup,
          joint1Group: j1Group,
          joint2Group: j2Group,
          joint3Group: j3Group,
          gripperMesh: gripMesh,
        });
      }

      // ── TYPE: ROLLER CONVEYOR ──
      else if (comp.type === 'roller_conveyor') {
        const len = (comp.geometry.dimensions.depth || 32000) / 100;
        const w = (comp.geometry.dimensions.width || 1200) / 100;
        const h = (comp.geometry.dimensions.height || 800) / 100;

        const frameGeom = new THREE.BoxGeometry(len, h * 0.4, w);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
        const frameMesh = new THREE.Mesh(frameGeom, frameMat);
        frameMesh.position.y = h * 0.7;
        compGroup.add(frameMesh);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.8, 0.8, h * 0.7, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const numLegPairs = Math.max(2, Math.round(len / 30));
        for (let i = 0; i <= numLegPairs; i++) {
          const legX = -len / 2 + (i / numLegPairs) * len;
          const l1 = new THREE.Mesh(legGeom, legMat);
          l1.position.set(legX, (h * 0.7) / 2, -w * 0.42);
          const l2 = new THREE.Mesh(legGeom, legMat);
          l2.position.set(legX, (h * 0.7) / 2, w * 0.42);
          compGroup.add(l1, l2);
        }

        // Conveyor Rollers
        const rollerGeom = new THREE.CylinderGeometry(1.2, 1.2, w * 0.86, 12);
        const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
        const numRollers = Math.round(len / 4);
        for (let r = 0; r < numRollers; r++) {
          const rx = -len / 2 + (r / numRollers) * len;
          const rMesh = new THREE.Mesh(rollerGeom, rollerMat);
          rMesh.rotation.x = Math.PI / 2;
          rMesh.position.set(rx, h * 0.9, 0);
          compGroup.add(rMesh);
        }

        // Billet workpieces moving along conveyor
        const billetGeom = new THREE.BoxGeometry(6, 4, 6);
        const billetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 });
        for (let b = 0; b < 5; b++) {
          const bMesh = new THREE.Mesh(billetGeom, billetMat);
          bMesh.position.set(-len / 2 + b * (len / 5), h + 2, 0);
          compGroup.add(bMesh);
          billetMeshes.push(bMesh);
        }
      }

      // ── TYPE: AGV AMR ──
      else if (comp.type === 'agv_amr') {
        const bodyGeom = new THREE.BoxGeometry(22, 6, 14);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 });
        const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        bodyMesh.position.y = 3;
        compGroup.add(bodyMesh);

        const palletGeom = new THREE.BoxGeometry(16, 3, 12);
        const palletMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
        const palletMesh = new THREE.Mesh(palletGeom, palletMat);
        palletMesh.position.y = 7.5;
        compGroup.add(palletMesh);

        const lidarGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
        const lidarMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff });
        const lidarMesh = new THREE.Mesh(lidarGeom, lidarMat);
        lidarMesh.position.set(8, 7, 0);
        compGroup.add(lidarMesh);

        const agvLight = new THREE.PointLight(0xf59e0b, 1.0, 15);
        agvLight.position.set(-8, 8, 0);
        compGroup.add(agvLight);

        const defaultPoints = [
          new THREE.Vector3(-100, 0, 80),
          new THREE.Vector3(-120, 0, -15),
          new THREE.Vector3(40, 0, -15),
          new THREE.Vector3(80, 0, 80),
          new THREE.Vector3(-100, 0, 80),
        ];

        agvRefs.push({
          id: comp.id,
          group: compGroup,
          t: 0,
          speed: 0.05,
          pathPoints: defaultPoints,
          light: agvLight,
        });
      }

      // ── TYPE: ASRS STORAGE ──
      else if (comp.type === 'asrs_storage') {
        for (let bay = 0; bay < 3; bay++) {
          for (let tier = 0; tier < 4; tier++) {
            const binGeom = new THREE.BoxGeometry(18, 12, 14);
            const binMat = new THREE.MeshStandardMaterial({
              color: (bay + tier) % 2 === 0 ? 0x334155 : 0x475569,
              roughness: 0.5,
            });
            const binMesh = new THREE.Mesh(binGeom, binMat);
            binMesh.position.set(bay * 22, tier * 16 + 8, 0);
            compGroup.add(binMesh);
          }
        }
      }

      // ── TYPE: CMM QUALITY CELL ──
      else if (comp.type === 'cmm_inspection') {
        const graniteGeom = new THREE.BoxGeometry(36, 12, 30);
        const graniteMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
        const graniteMesh = new THREE.Mesh(graniteGeom, graniteMat);
        graniteMesh.position.y = 6;
        compGroup.add(graniteMesh);

        const gantryGeom = new THREE.BoxGeometry(6, 28, 30);
        const gantryMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4 });
        const gantryMesh = new THREE.Mesh(gantryGeom, gantryMat);
        gantryMesh.position.set(0, 26, 0);
        compGroup.add(gantryMesh);

        const probeGeom = new THREE.CylinderGeometry(0.5, 0.5, 14, 12);
        const probeMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.9 });
        const probeMesh = new THREE.Mesh(probeGeom, probeMat);
        probeMesh.position.set(0, 20, 0);
        compGroup.add(probeMesh);
      }

      // ── TYPE: SAFETY ZONE ──
      else if (comp.type === 'safety_zone') {
        const zw = (comp.geometry.dimensions.width || 10000) / 100;
        const zd = (comp.geometry.dimensions.depth || 10000) / 100;
        const zoneGeom = new THREE.PlaneGeometry(zw, zd);
        const zoneMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const zoneMesh = new THREE.Mesh(zoneGeom, zoneMat);
        zoneMesh.rotation.x = -Math.PI / 2;
        zoneMesh.position.y = 0.1;
        compGroup.add(zoneMesh);
      }

      // ── TYPE: WALL ──
      else if (comp.type === 'wall') {
        const ww = (comp.geometry.dimensions.width || 4000) / 100;
        const wh = (comp.geometry.dimensions.height || 4500) / 100;
        const wd = (comp.geometry.dimensions.depth || 400) / 100;
        const wallGeom = new THREE.BoxGeometry(ww, wh, wd);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
        const wallMesh = new THREE.Mesh(wallGeom, wallMat);
        wallMesh.position.y = wh / 2;
        compGroup.add(wallMesh);
      }

      // Tag all meshes with componentId for Raycasting selection
      tagMeshHierarchy(compGroup, comp.id);

      root.add(compGroup);
      componentGroupMap.set(comp.id, compGroup);

      machines.push({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        position: [comp.placement.x / 100, comp.placement.y / 100, comp.placement.z / 100],
        rotationY: comp.placement.rotationY || 0,
        status: comp.telemetry.status,
        activeJob: comp.telemetry.activeJob,
        loadPercentage: comp.telemetry.loadPercentage,
        temperatureC: comp.telemetry.temperatureC,
        powerKw: comp.telemetry.powerKw,
        spindleRpm: comp.telemetry.spindleRpm,
        vibrationMms: comp.telemetry.vibrationMms,
        jointAngles: comp.telemetry.jointAngles,
        batteryPct: comp.telemetry.batteryPct,
        cycleTimeSec: comp.telemetry.cycleTimeSec || 300,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. REAL-TIME KINEMATICS & DUAL-MODE CONTROLLER
    // ─────────────────────────────────────────────────────────────
    let simTotalSeconds = 0;
    let partsProducedAccumulator = 1420;
    let currentSimulationMode: 'stochastic_random' | 'live_iot_stream' = schema.simulationMode || 'stochastic_random';
    let latestIoTData: LiveIoTPayload | null = null;

    const animController: FactoryAnimationController = {
      setSimulationMode: (mode) => {
        currentSimulationMode = mode;
      },

      applyLiveIoTData: (payload) => {
        latestIoTData = payload;
      },

      updateComponentTransform: (id, xMm, zMm, rotYDeg) => {
        const group = componentGroupMap.get(id);
        if (group) {
          group.position.x = xMm / 100;
          group.position.z = zMm / 100;
          group.rotation.y = rotYDeg * (Math.PI / 180);
        }
        const m = machines.find((item) => item.id === id);
        if (m) {
          m.position[0] = xMm / 100;
          m.position[2] = zMm / 100;
          m.rotationY = rotYDeg;
        }
      },

      getComponentTransform: (id) => {
        const group = componentGroupMap.get(id);
        if (!group) return null;
        return {
          xMm: Math.round(group.position.x * 100),
          zMm: Math.round(group.position.z * 100),
          rotYDeg: Math.round(group.rotation.y * (180 / Math.PI)),
        };
      },

      swapComponent3DAsset: (id, assetUrl) => {
        const group = componentGroupMap.get(id);
        if (!group) return;
        // In full GLTF/CAD loader pipeline, this attaches the loaded mesh.
        // For visual confirmation, we tag the group and apply a futuristic cyber metal highlight.
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.set(0x38bdf8);
            child.material.metalness = 0.95;
            child.material.roughness = 0.15;
          }
        });
      },

      update: (deltaSeconds: number, speedMultiplier: number) => {
        const effectiveDelta = Math.min(deltaSeconds, 0.1) * speedMultiplier;
        simTotalSeconds += effectiveDelta;

        // ── A. CNC Doors & Spindles ──
        cncRefs.forEach((cnc, i) => {
          if (currentSimulationMode === 'live_iot_stream' && latestIoTData?.machines?.[cnc.id]) {
            const data = latestIoTData.machines[cnc.id];
            if (data.spindleRpm !== undefined) {
              cnc.spindleMesh.rotation.y += effectiveDelta * (data.spindleRpm / 1000);
            }
            if (data.doorOpen !== undefined) {
              const targetDoorX = data.doorOpen ? 10 : 0;
              cnc.doorMesh.position.x = THREE.MathUtils.lerp(cnc.doorMesh.position.x, targetDoorX, 0.1);
            }
            if (data.status) {
              const col = data.status === 'warning' ? 0xf59e0b : data.status === 'tool_change' ? 0x0284c7 : 0x10b981;
              (cnc.beaconMesh.material as THREE.MeshStandardMaterial).color.set(col);
              (cnc.beaconMesh.material as THREE.MeshStandardMaterial).emissive.set(col);
            }
          } else {
            // Autonomous random breathing
            cnc.spindleMesh.rotation.y += effectiveDelta * (i === 1 ? 0 : 25);
            const doorPhase = Math.sin(simTotalSeconds * 0.4 + i);
            cnc.doorMesh.position.x = THREE.MathUtils.clamp(doorPhase * 8, 0, 10);
          }
        });

        // ── B. Robots (Joints) ──
        const robotStates: RobotArmDetail[] = robotRefs.map((r, i) => {
          let deg1 = 0, deg2 = 0, deg3 = 0;

          if (currentSimulationMode === 'live_iot_stream' && latestIoTData?.robots?.[r.id]) {
            const rData = latestIoTData.robots[r.id];
            if (rData.jointAngles) {
              const [j1, j2, j3] = rData.jointAngles;
              r.joint1Group.rotation.y = THREE.MathUtils.lerp(r.joint1Group.rotation.y, (j1 * Math.PI) / 180, 0.1);
              r.joint2Group.rotation.z = THREE.MathUtils.lerp(r.joint2Group.rotation.z, (j2 * Math.PI) / 180, 0.1);
              r.joint3Group.rotation.z = THREE.MathUtils.lerp(r.joint3Group.rotation.z, (j3 * Math.PI) / 180, 0.1);
              deg1 = Math.round(j1);
              deg2 = Math.round(j2);
              deg3 = Math.round(j3);
            }
          } else {
            // Autonomous trigonometric pick & place
            const t = simTotalSeconds * 0.8 + i * 2;
            const theta1 = Math.sin(t * 0.7) * 0.8;
            const theta2 = Math.cos(t * 0.9) * 0.35 + 0.3;
            const theta3 = -Math.sin(t * 1.1) * 0.45 - 0.4;

            r.joint1Group.rotation.y = theta1;
            r.joint2Group.rotation.z = theta2;
            r.joint3Group.rotation.z = theta3;

            deg1 = Math.round((theta1 * 180) / Math.PI);
            deg2 = Math.round((theta2 * 180) / Math.PI);
            deg3 = Math.round((theta3 * 180) / Math.PI);
          }

          return {
            id: r.id,
            name: i === 0 ? 'KUKA KR 120 (Cell Alpha)' : 'FANUC M-20iD (Cell Beta)',
            status: 'running',
            task: i === 0 ? 'Unloading 5-Axis CNC #1 -> Conveyor' : 'Loading Finished Part -> CMM Pallet',
            jointAngles: [deg1, deg2, deg3, 0, 45, 90],
            toolAction: Math.abs(deg1) < 15 ? 'GRIPPER CLOSED [HOLDING BILLET]' : 'TRANSFER IN PROGRESS',
            payloadKg: i === 0 ? 12.5 : 8.2,
          };
        });

        // ── C. AGVs (Waypoints) ──
        const agvStates: AgvDetail[] = agvRefs.map((agv) => {
          if (currentSimulationMode === 'live_iot_stream' && latestIoTData?.agvs?.[agv.id]) {
            const data = latestIoTData.agvs[agv.id];
            if (data.xMm !== undefined && data.zMm !== undefined) {
              agv.group.position.x = THREE.MathUtils.lerp(agv.group.position.x, data.xMm / 100, 0.05);
              agv.group.position.z = THREE.MathUtils.lerp(agv.group.position.z, data.zMm / 100, 0.05);
            }
          } else {
            agv.t = (agv.t + effectiveDelta * agv.speed * 0.15) % 1;
            const pts = agv.pathPoints;
            const totalSegments = pts.length - 1;
            const currentSegIndex = Math.min(Math.floor(agv.t * totalSegments), totalSegments - 1);
            const segT = agv.t * totalSegments - currentSegIndex;

            const p0 = pts[currentSegIndex];
            const p1 = pts[currentSegIndex + 1];
            if (p0 && p1) {
              agv.group.position.lerpVectors(p0, p1, segT);
              const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
              if (dir.lengthSq() > 0.001) {
                agv.group.rotation.y = Math.atan2(dir.x, dir.z);
              }
            }
          }

          return {
            id: agv.id,
            name: agv.id === 'agv-1' ? 'KION Forklift AGV #1' : 'Omron Mobile Robot #2',
            x: Math.round(agv.group.position.x * 100),
            z: Math.round(agv.group.position.z * 100),
            speedMps: 1.2,
            batteryPct: Math.max(15, Math.round(94 - ((simTotalSeconds * 0.01) % 40))),
            task: 'Navigating Guided Floor Line (LiDAR Active)',
            payload: 'Aluminum 7075-T6 Machined Parts Batch',
          };
        });

        // ── D. Conveyor Billets ──
        let conveyorSpeed = 8;
        if (currentSimulationMode === 'live_iot_stream' && latestIoTData?.conveyors) {
          const firstConveyorKey = Object.keys(latestIoTData.conveyors)[0];
          if (firstConveyorKey && latestIoTData.conveyors[firstConveyorKey].speedMps !== undefined) {
            conveyorSpeed = (latestIoTData.conveyors[firstConveyorKey].speedMps || 0.8) * 10;
          }
        }

        billetMeshes.forEach((bm) => {
          bm.position.x += effectiveDelta * conveyorSpeed;
          if (bm.position.x > 140) {
            bm.position.x = -140;
            partsProducedAccumulator += 1;
          }
        });

        // ── E. OEE & ISO 22400 Telemetry ──
        const availability = 94.8;
        const performance = 92.4;
        const quality = 99.2;
        const oee = Math.round(((availability * performance * quality) / 10000) * 10) / 10;

        const telemetry: FactoryTelemetry = {
          oeePercent: oee,
          availabilityPercent: availability,
          performancePercent: performance,
          qualityPercent: quality,
          totalPartsProduced: partsProducedAccumulator,
          taktTimeSeconds: 42.5,
          hourlyProductionRate: 84,
          totalPowerConsumptionKw: 68.4,
          bottleneckStation: 'DMG Mori #2 (Tool Change Cycle)',
          activeAlertsCount: 0,
        };

        return {
          completedPartsIncrement: 0,
          robotStates,
          agvStates,
          telemetry,
        };
      },
      dispose: () => {
        root.clear();
      },
    };

    return { sceneGroup: root, machines, animController, componentGroupMap };
  }
}

export default FactoryEngine;

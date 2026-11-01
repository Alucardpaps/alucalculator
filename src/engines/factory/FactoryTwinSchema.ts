/**
 * 🏭 Factory Digital Twin Schema (FDTS v1.0)
 * Standard Data Contract for 2D/3D Factory Floor, Kinematics & Dual-Mode Telemetry
 * 
 * Standards cited:
 * - ISO 22400: Automation systems - Key performance indicators for manufacturing
 * - VDI 2860: Assembly and handling technology - Kinematic designations & degrees of freedom
 * - ISO 1000: SI units and recommendations for the use of their multiples
 * - ISO 14067: Carbon footprint of machinery & electrical power consumption
 */

export type FactoryComponentCategory =
  | 'machine'
  | 'robot'
  | 'conveyor'
  | 'agv'
  | 'storage'
  | 'inspection'
  | 'structure'
  | 'safety';

export type FactoryComponentType =
  | 'cnc_5axis'
  | 'cnc_lathe'
  | 'robot_6axis'
  | 'roller_conveyor'
  | 'agv_amr'
  | 'asrs_storage'
  | 'cmm_inspection'
  | 'wall'
  | 'safety_zone';

export interface ComponentPlacement {
  /** X coordinate on factory floor in mm */
  x: number;
  /** Y elevation in mm (normally 0 on floor level) */
  y: number;
  /** Z coordinate on factory floor in mm */
  z: number;
  /** Heading / yaw rotation around Y-axis in degrees (0 to 360) */
  rotationY: number;
}

export interface ComponentGeometrySpec {
  source: 'builtin' | 'custom_cad';
  /** Optional URL or base64 data URI to external STEP/STL/GLTF CAD asset */
  custom3dAssetUrl?: string | null;
  /** Dimensions for procedural bounding box in mm */
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color?: string;
}

export interface RobotJointLimit {
  joint: string; // 'J1', 'J2', 'J3', 'J4', 'J5', 'J6'
  minDeg: number;
  maxDeg: number;
}

export interface AgvWaypoint {
  x: number; // mm
  z: number; // mm
  stationName?: string;
  waitTimeSec?: number;
}

export interface ComponentKinematics {
  // CNC / Lathe axes
  spindle?: {
    axis: 'Y' | 'Z';
    maxRpm: number;
    currentRpm?: number;
  };
  door?: {
    axis: 'X' | 'Z';
    strokeMm: number;
    isOpen?: boolean;
    progress?: number; // 0 (closed) to 1 (fully open)
  };
  // 6-Axis Robot Arm
  robot?: {
    dof: 6;
    reachRadiusMm: number;
    jointLimits: RobotJointLimit[];
    currentJointsDeg: [number, number, number, number, number, number];
    toolAction?: string;
    payloadKg?: number;
  };
  // Conveyor Flow
  conveyor?: {
    direction: [number, number, number];
    speedMps: number;
    partSpawnIntervalSec: number;
    partModelName?: string;
  };
  // AGV / AMR Laser Navigation
  agv?: {
    speedMps: number;
    waypoints: AgvWaypoint[];
    currentWaypointIndex?: number;
    batteryPct?: number;
  };
}

export interface ComponentTelemetryData {
  status: 'running' | 'idle' | 'tool_change' | 'warning' | 'stopped';
  activeJob: string;
  loadPercentage: number;
  temperatureC: number;
  powerKw: number;
  spindleRpm?: number;
  vibrationMms?: number;
  jointAngles?: number[];
  batteryPct?: number;
  conveyorSpeedMps?: number;
  cycleTimeSec?: number;
}

export interface FactoryTwinComponent {
  id: string;
  name: string;
  category: FactoryComponentCategory;
  type: FactoryComponentType;
  placement: ComponentPlacement;
  geometry: ComponentGeometrySpec;
  kinematics?: ComponentKinematics;
  sensorBindings?: Record<string, string>;
  telemetry: ComponentTelemetryData;
}

export interface FactoryTwinSchema {
  $schema: string;
  factoryId: string;
  name: string;
  version: string;
  grid: {
    unit: 'mm';
    snapSizeMm: number; // e.g., 500 mm
    floorWidthMm: number; // e.g., 50000 mm (50m)
    floorDepthMm: number; // e.g., 38000 mm (38m)
  };
  simulationMode: 'stochastic_random' | 'live_iot_stream';
  components: FactoryTwinComponent[];
}

export interface LiveIoTPayload {
  timestamp: number;
  machines?: Record<
    string,
    {
      status?: 'running' | 'idle' | 'tool_change' | 'warning' | 'stopped';
      spindleRpm?: number;
      loadPercentage?: number;
      temperatureC?: number;
      vibrationMms?: number;
      doorOpen?: boolean;
      powerKw?: number;
    }
  >;
  robots?: Record<
    string,
    {
      jointAngles?: [number, number, number, number, number, number];
      payloadKg?: number;
      toolAction?: string;
      status?: 'running' | 'idle' | 'warning';
    }
  >;
  conveyors?: Record<
    string,
    {
      speedMps?: number;
      jammed?: boolean;
    }
  >;
  agvs?: Record<
    string,
    {
      xMm?: number;
      zMm?: number;
      batteryPct?: number;
      task?: string;
    }
  >;
}

/**
 * Default Production Factory Line (Gebze Machining & Robotic Cell)
 * Calibrated in SI mm / degrees.
 */
export const DEFAULT_FACTORY_PLAN: FactoryTwinSchema = {
  $schema: 'https://alucalculator.com/schemas/factory-twin-v1.json',
  factoryId: 'plant-gebze-01',
  name: 'AluCAD OS — Digital Twin Advanced Machining Facility',
  version: '1.0.0',
  grid: {
    unit: 'mm',
    snapSizeMm: 500,
    floorWidthMm: 50000,
    floorDepthMm: 38000,
  },
  simulationMode: 'stochastic_random',
  components: [
    // ── 4x DMG MORI 5-AXIS CNC MACHINING CENTERS ──
    {
      id: 'cnc-5axis-1',
      name: 'DMG Mori DMU 50 #1',
      category: 'machine',
      type: 'cnc_5axis',
      placement: { x: -12000, y: 0, z: -7000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 5000, height: 4400, depth: 4400 },
        color: '#1e293b',
      },
      kinematics: {
        spindle: { axis: 'Y', maxRpm: 20000, currentRpm: 14200 },
        door: { axis: 'X', strokeMm: 1200, isOpen: false, progress: 0 },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Op #20 5-Axis Milling — Billet Al-7075-T6',
        loadPercentage: 88,
        temperatureC: 38.4,
        powerKw: 16.4,
        spindleRpm: 14200,
        vibrationMms: 0.35,
        cycleTimeSec: 840,
      },
    },
    {
      id: 'cnc-5axis-2',
      name: 'DMG Mori DMU 50 #2',
      category: 'machine',
      type: 'cnc_5axis',
      placement: { x: -4000, y: 0, z: -7000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 5000, height: 4400, depth: 4400 },
        color: '#1e293b',
      },
      kinematics: {
        spindle: { axis: 'Y', maxRpm: 20000, currentRpm: 0 },
        door: { axis: 'X', strokeMm: 1200, isOpen: true, progress: 0.8 },
      },
      telemetry: {
        status: 'tool_change',
        activeJob: 'Automatic Tool Changer (ATC HSK-A63 Indexing)',
        loadPercentage: 0,
        temperatureC: 39.9,
        powerKw: 2.1,
        spindleRpm: 0,
        vibrationMms: 0.12,
        cycleTimeSec: 840,
      },
    },
    {
      id: 'cnc-5axis-3',
      name: 'DMG Mori DMU 50 #3',
      category: 'machine',
      type: 'cnc_5axis',
      placement: { x: 4000, y: 0, z: -7000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 5000, height: 4400, depth: 4400 },
        color: '#1e293b',
      },
      kinematics: {
        spindle: { axis: 'Y', maxRpm: 20000, currentRpm: 15100 },
        door: { axis: 'X', strokeMm: 1200, isOpen: false, progress: 0 },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Rough Cavity Trochoidal Milling (D12 TiAlN)',
        loadPercentage: 94,
        temperatureC: 41.4,
        powerKw: 18.0,
        spindleRpm: 15100,
        vibrationMms: 0.42,
        cycleTimeSec: 720,
      },
    },
    {
      id: 'cnc-5axis-4',
      name: 'DMG Mori DMU 50 #4',
      category: 'machine',
      type: 'cnc_5axis',
      placement: { x: 12000, y: 0, z: -7000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 5000, height: 4400, depth: 4400 },
        color: '#1e293b',
      },
      kinematics: {
        spindle: { axis: 'Y', maxRpm: 20000, currentRpm: 14800 },
        door: { axis: 'X', strokeMm: 1200, isOpen: false, progress: 0 },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Finish Surfacing Impeller Blade',
        loadPercentage: 76,
        temperatureC: 37.8,
        powerKw: 14.5,
        spindleRpm: 14800,
        vibrationMms: 0.28,
        cycleTimeSec: 960,
      },
    },

    // ── 2x KUKA / FANUC 6-AXIS ARTICULATED ROBOTS ──
    {
      id: 'robot-kuka-1',
      name: 'KUKA KR 120 R2700 (Cell Alpha)',
      category: 'robot',
      type: 'robot_6axis',
      placement: { x: -8000, y: 0, z: -4000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 1400, height: 2600, depth: 1400 },
        color: '#ea580c',
      },
      kinematics: {
        robot: {
          dof: 6,
          reachRadiusMm: 2700,
          jointLimits: [
            { joint: 'J1', minDeg: -185, maxDeg: 185 },
            { joint: 'J2', minDeg: -140, maxDeg: -5 },
            { joint: 'J3', minDeg: -120, maxDeg: 168 },
            { joint: 'J4', minDeg: -350, maxDeg: 350 },
            { joint: 'J5', minDeg: -125, maxDeg: 125 },
            { joint: 'J6', minDeg: -350, maxDeg: 350 },
          ],
          currentJointsDeg: [25, -45, 80, 0, 35, 90],
          toolAction: 'Transferring 5-Axis CNC #1 -> Conveyor',
          payloadKg: 12.5,
        },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Tending CNC #1 & #2 Pick-and-Place',
        loadPercentage: 62,
        temperatureC: 34.2,
        powerKw: 4.8,
        jointAngles: [25, -45, 80, 0, 35, 90],
      },
    },
    {
      id: 'robot-fanuc-1',
      name: 'FANUC M-20iD/25 (Cell Beta)',
      category: 'robot',
      type: 'robot_6axis',
      placement: { x: 8000, y: 0, z: -4000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 1200, height: 2200, depth: 1200 },
        color: '#eab308',
      },
      kinematics: {
        robot: {
          dof: 6,
          reachRadiusMm: 1831,
          jointLimits: [
            { joint: 'J1', minDeg: -180, maxDeg: 180 },
            { joint: 'J2', minDeg: -100, maxDeg: 140 },
            { joint: 'J3', minDeg: -180, maxDeg: 270 },
            { joint: 'J4', minDeg: -200, maxDeg: 200 },
            { joint: 'J5', minDeg: -140, maxDeg: 140 },
            { joint: 'J6', minDeg: -360, maxDeg: 360 },
          ],
          currentJointsDeg: [-40, -30, 95, 10, 45, -60],
          toolAction: 'Loading Machined Billet into Outbound Pallet',
          payloadKg: 8.2,
        },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Loading Finished Parts to Outfeed Pallet',
        loadPercentage: 54,
        temperatureC: 32.1,
        powerKw: 3.6,
        jointAngles: [-40, -30, 95, 10, 45, -60],
      },
    },

    // ── CONTINUOUS ROLLER CONVEYOR LINE ──
    {
      id: 'conveyor-main',
      name: 'Main Assembly Roller Conveyor Line',
      category: 'conveyor',
      type: 'roller_conveyor',
      placement: { x: 0, y: 0, z: -4000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 1200, height: 800, depth: 32000 },
        color: '#334155',
      },
      kinematics: {
        conveyor: {
          direction: [1, 0, 0],
          speedMps: 0.8,
          partSpawnIntervalSec: 10,
          partModelName: 'billet_al_7075',
        },
      },
      telemetry: {
        status: 'running',
        activeJob: 'Continuous Billet Infeed / Outfeed Transfer',
        loadPercentage: 45,
        temperatureC: 26.5,
        powerKw: 3.2,
        conveyorSpeedMps: 0.8,
      },
    },

    // ── AUTOMATED GUIDED VEHICLE (AGV) ──
    {
      id: 'agv-1',
      name: 'OmniDirectional AMR / AGV #1',
      category: 'agv',
      type: 'agv_amr',
      placement: { x: -10000, y: 0, z: 8000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 1400, height: 600, depth: 2200 },
        color: '#0284c7',
      },
      kinematics: {
        agv: {
          speedMps: 1.2,
          waypoints: [
            { x: -10000, z: 8000, stationName: 'ASRS Raw Material Outfeed' },
            { x: -12000, z: -1500, stationName: 'CNC Cell 1 Buffer' },
            { x: 4000, z: -1500, stationName: 'CNC Cell 3 Buffer' },
            { x: 8000, z: 8000, stationName: 'CMM Inspection Infeed' },
          ],
          batteryPct: 87,
        },
      },
      telemetry: {
        status: 'running',
        activeJob: 'In-Transit: ASRS Raw Material -> CNC Buffer',
        loadPercentage: 70,
        temperatureC: 28.0,
        powerKw: 1.8,
        batteryPct: 87,
      },
    },

    // ── ASRS AUTOMATED HIGH-BAY WAREHOUSE ──
    {
      id: 'asrs-warehouse-1',
      name: 'ASRS Automated Pallet Storage Bay',
      category: 'storage',
      type: 'asrs_storage',
      placement: { x: -18000, y: 0, z: 5000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 8000, height: 12000, depth: 16000 },
        color: '#1e293b',
      },
      telemetry: {
        status: 'running',
        activeJob: 'Automated Pallet Stacking & Inventory Retrieval',
        loadPercentage: 82,
        temperatureC: 22.0,
        powerKw: 7.5,
      },
    },

    // ── CMM MITUTOYO QUALITY INSPECTION CELL ──
    {
      id: 'cmm-cell-1',
      name: 'Mitutoyo Crysta-Apex CMM Quality Cell',
      category: 'inspection',
      type: 'cmm_inspection',
      placement: { x: 0, y: 0, z: 10000, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 4500, height: 3500, depth: 4000 },
        color: '#0f172a',
      },
      telemetry: {
        status: 'running',
        activeJob: 'Coordinate Measuring Inspection (ISO 10360-2)',
        loadPercentage: 55,
        temperatureC: 20.2, // Climate-controlled metrology lab
        powerKw: 2.4,
      },
    },

    // ── SAFETY ZONE (ISO 7010) ──
    {
      id: 'safety-zone-machining',
      name: 'ISO 7010 Machining Cell Perimeter',
      category: 'safety',
      type: 'safety_zone',
      placement: { x: 0, y: 0, z: -5500, rotationY: 0 },
      geometry: {
        source: 'builtin',
        dimensions: { width: 34000, height: 20, depth: 14000 },
        color: '#f59e0b',
      },
      telemetry: {
        status: 'running',
        activeJob: 'Active Laser Safety Curtain Interlock',
        loadPercentage: 0,
        temperatureC: 24.0,
        powerKw: 0.1,
      },
    },
  ],
};

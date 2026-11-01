/**
 * Engineering Flow World — Types & Contracts
 * Hybrid 2D SVG Mechanical Physics & Engineering Simulation Engine
 */

export interface EngineeringMaterial {
  id: string;
  name: string;
  category: 'aluminum' | 'steel' | 'titanium' | 'brass' | 'polymer';
  density: number; // g/cm^3
  yieldStrength: number; // MPa
  youngsModulus: number; // GPa
  shearModulus: number; // GPa
  hardness: string;
  thermalExpansion: number; // µm/m·K
  color: string;
  strokeColor: string;
}

export type BodyType = 'beam' | 'gear' | 'box' | 'circle' | 'anchor' | 'wheel' | 'boat';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhysicsBody {
  id: string;
  name: string;
  type: BodyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // radians
  omega: number; // angular velocity (rad/s)
  mass: number; // kg
  inertia: number; // kg·m^2
  isStatic: boolean;
  material: EngineeringMaterial;
  restitution: number; // 0..1
  friction: number; // 0..1
  collisionGroup?: number; // negative value disables collision between bodies in same group

  // Dimensions
  width?: number;
  height?: number;
  radius?: number;

  // Beam specifics
  length?: number;
  beamThickness?: number;
  currentDeflection?: number; // mm
  maxDeflection?: number; // mm
  stressMpa?: number; // Current Von Mises stress
  safetyFactor?: number; // FoS = YieldStrength / Stress
  isBroken?: boolean;

  // Gear & Motor specifics
  teethCount?: number;
  gearModule?: number; // mm
  pitchRadius?: number;
  isMotor?: boolean;
  motorRpm?: number;
  motorTorque?: number; // N·m
  meshedWith?: string[]; // IDs of meshing gears

  // Powertrain & Wheel specifics
  axleConnectedBodyId?: string; // Shaft/Axle coupling (Gear driving Wheel)
  tireTread?: boolean;

  // Robotic Arm / Servo specifics
  isServo?: boolean;
  servoTargetAngle?: number; // radians
  servoSpeed?: number; // rad/s

  // Hydrodynamic Boat specifics
  buoyancyVolume?: number; // m^3 equivalent
  thrustPower?: number; // Propeller thrust in Newtons

  // Visual
  color?: string;
  opacity?: number;

  /** Transient collision impact stress (MPa), decays each step. */
  impactStressMpa?: number;
  /** Instantaneous slip speed at contact (px/s), wheels only. */
  slipSpeed?: number;
  /** True when a wheel currently has a ground contact. */
  grounded?: boolean;
  /** Submerged fraction 0..1 for hydro bodies. */
  submergedRatio?: number;
}

export type JointType = 'pin' | 'weld' | 'spring' | 'cable';

export interface PhysicsJoint {
  id: string;
  type: JointType;
  bodyAId: string;
  bodyBId: string;
  localAnchorA: Vector2D;
  localAnchorB: Vector2D;
  length?: number;
  stiffness?: number; // N/m
  damping?: number;
  maxTension?: number; // N before snapping
  currentTension?: number; // N
  isBroken?: boolean;
}

export type EditorTool =
  | 'select'
  | 'drag'
  | 'beam'
  | 'gear'
  | 'wheel'
  | 'boat'
  | 'box'
  | 'circle'
  | 'anchor'
  | 'joint_pin'
  | 'joint_weld'
  | 'joint_cable'
  | 'cutter'
  | 'erase';

export interface ContactPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  depth: number;
  bodyId?: string;
}

export interface TelemetryData {
  fps: number;
  bodyCount: number;
  jointCount: number;
  maxStressMpa: number;
  minSafetyFactor: number;
  totalKineticEnergy: number; // Joules
  totalPotentialEnergy: number; // Joules (mgh, 100px = 1m)
  criticalBodyId: string | null;
  contactCount: number;
  snappedJoints: number;
  maxSlip: number;
  motorPowerKw: number;
  timeScale: number;
}

export type ScenarioCategory =
  | 'all'
  | 'vehicles'
  | 'robotics'
  | 'mechanisms'
  | 'structural'
  | 'marine'
  | 'sandbox';

export interface ChallengeScenario {
  id: string;
  title: string;
  category: 'structural' | 'gears' | 'ballistics' | 'sandbox' | 'vehicles' | 'robotics' | 'mechanisms' | 'marine';
  difficulty?: 'Başlangıç' | 'Orta' | 'İleri' | 'Serbest';
  physicsFocus?: string;
  initialGroundSlope?: number;
  terrainType?: 'flat' | 'wavy' | 'hills';
  waveAmplitude?: number;
  description: string;
  instructions: string;
  targetObjective: string;
  initialBodies: PhysicsBody[];
  initialJoints: PhysicsJoint[];
  checkSuccess: (bodies: PhysicsBody[], joints: PhysicsJoint[]) => boolean;
  checkFailure?: (bodies: PhysicsBody[], joints: PhysicsJoint[]) => boolean;
}

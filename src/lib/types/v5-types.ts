/**
 * AluCalc OS v5.0 — Core Type Definitions
 *
 * Single source of truth for the entire Workspace Engine type system.
 * All stores, engines, and components import from here.
 */

// ════════════════════════════════════════════
// Component Types
// ════════════════════════════════════════════

export type ComponentType = 'profile' | 'bracket' | 'bolt' | 'gear' | 'bearing' | 'key';

export type MachiningType = 'HOLE' | 'SURFACE_MILLED' | 'THREADED' | 'WELDED' | 'RECT_CUT';

export interface MachiningModifier {
  id: string;
  type: MachiningType;
  face?: 'top' | 'front' | 'side'; // selected sketch plane
  x: number; // Position along the relevant axis/surface (mm)
  y: number; // Position across the relevant axis/surface (mm)
  diameter?: number; // for circular holes/threads
  width?: number; // for rectangular cuts
  height?: number; // for rectangular cuts
  depth?: number;
  description?: string;
  weldSize?: number;
}

export type Vec3 = [number, number, number];

export interface ComponentMetadata {
  /** Length in mm (profiles / keys) */
  length?: number;
  /** Material designation */
  material?: string;
  /** Calculated weight in kg */
  weight?: number;
  /** Unit cost in currency */
  unitCost?: number;
  // Gear params
  teeth?: number;
  module?: number;
  width?: number; // face width (mm)
  // Bearing params
  innerDia?: number;
  outerDia?: number;
  // Key params
  height?: number;
}

export interface WorkspaceComponent {
  id: string;
  type: ComponentType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  connections: string[];
  metadata: ComponentMetadata;
  /** Machining operations applied to this component */
  modifiers?: MachiningModifier[];
  /** Computed validation state */
  isValid: boolean;
  /** List of active validation errors */
  validationErrors: string[];
}

// ════════════════════════════════════════════
// Connection & Snap Types
// ════════════════════════════════════════════

export interface ConnectionRule {
  source: ComponentType;
  targets: ComponentType[];
  snapAxis: 'x' | 'y' | 'z' | 'any';
}

export interface SnapResult {
  /** Whether a snap was found */
  isSnapped: boolean;
  /** Corrected position after snap */
  position: Vec3;
  /** Corrected rotation after snap */
  rotation: Vec3;
  /** ID of the component snapped to */
  targetId: string | null;
  /** Distance to snap target */
  distance: number;
}

export interface SnapConfig {
  /** Maximum distance for snap detection (world units) */
  threshold: number;
  /** Grid size for grid-based snapping */
  gridSize: number;
  /** Whether snapping is enabled */
  enabled: boolean;
}

// ════════════════════════════════════════════
// Drag State
// ════════════════════════════════════════════

export interface DragState {
  isDragging: boolean;
  draggedComponentId: string | null;
  /** Preview position (not yet committed to store) */
  previewPosition: Vec3;
  /** Preview rotation */
  previewRotation: Vec3;
  /** Current snap result during drag */
  snapResult: SnapResult | null;
}

// ════════════════════════════════════════════
// BOM Types
// ════════════════════════════════════════════

export interface BOMEntry {
  type: ComponentType;
  count: number;
  totalWeight: number;
  totalCost: number;
}

export interface BOMSummary {
  entries: BOMEntry[];
  totalComponents: number;
  totalWeight: number;
  totalCost: number;
}

// ════════════════════════════════════════════
// Validation Types
// ════════════════════════════════════════════

export type ValidationSeverity = 'warning' | 'error';

export interface ValidationMessage {
  componentId: string;
  severity: ValidationSeverity;
  message: string;
}

export interface StructureHealth {
  isStable: boolean;
  warnings: ValidationMessage[];
  errors: ValidationMessage[];
  connectedRatio: number;
}

// ════════════════════════════════════════════
// Component Defaults
// ════════════════════════════════════════════

export const DEFAULT_METADATA: Record<ComponentType, ComponentMetadata> = {
  profile: { length: 200, material: 'AL-6063-T5', weight: 0.54, unitCost: 12.5 },
  bracket: { material: 'AL-6063-T5', weight: 0.08, unitCost: 3.2 },
  bolt: { material: 'Steel 8.8', weight: 0.015, unitCost: 0.45 },
  gear: { teeth: 24, module: 2, width: 20, material: 'Steel C45', weight: 0.85, unitCost: 18.5 },
  bearing: { innerDia: 20, outerDia: 47, width: 14, material: 'Chrome Steel', weight: 0.12, unitCost: 6.5 },
  key: { length: 20, width: 6, height: 6, material: 'Steel C45', weight: 0.02, unitCost: 1.2 },
};

export const CONNECTION_RULES: ConnectionRule[] = [
  { source: 'profile', targets: ['profile', 'bracket', 'gear', 'bearing', 'key'], snapAxis: 'x' },
  { source: 'bracket', targets: ['profile'], snapAxis: 'any' },
  { source: 'bolt', targets: ['profile', 'bracket'], snapAxis: 'z' },
  { source: 'gear', targets: ['profile', 'bearing'], snapAxis: 'any' },
  { source: 'bearing', targets: ['profile', 'gear'], snapAxis: 'any' },
  { source: 'key', targets: ['profile'], snapAxis: 'any' },
];

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  threshold: 0.5,
  gridSize: 0.25,
  enabled: true,
};

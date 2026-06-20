/**
 * AluCalc OS v5.0 — Assembly Store
 *
 * THE single source of truth for the entire Workspace Engine.
 * All 3D scene components read from this. All UI writes to this.
 * Zero logic inside React render — everything goes through actions.
 */

import { create } from 'zustand';
import type {
  WorkspaceComponent,
  ComponentType,
  Vec3,
  DragState,
  SnapConfig,
  SnapResult,
  ConnectionRule,
  MachiningType,
  MachiningModifier,
} from '@/lib/types/v5-types';

// Re-import as values (not just types)
import {
  DEFAULT_SNAP_CONFIG as SNAP_DEFAULTS,
  DEFAULT_METADATA as META_DEFAULTS,
  CONNECTION_RULES as RULES,
} from '@/lib/types/v5-types';

// ════════════════════════════════════════════
// State Interface
// ════════════════════════════════════════════

interface AssemblyState {
  /** All workspace components keyed by ID */
  components: Record<string, WorkspaceComponent>;
  /** Current drag operation state */
  dragState: DragState;
  /** Snap configuration */
  snapConfig: SnapConfig;
  /** Connection rules */
  connectionRules: ConnectionRule[];
  /** Selected component ID */
  selectedId: string | null;
  /** Workspace tool mode */
  toolMode: 'select' | 'translate' | 'rotate';
  /** Whether FEA stress rendering is active */
  feaActive: boolean;
}

// ════════════════════════════════════════════
// Actions Interface
// ════════════════════════════════════════════

interface AssemblyActions {
  // ── Component CRUD ──
  addComponent: (type: ComponentType, position?: Vec3) => string;
  removeComponent: (id: string) => void;
  updateTransform: (id: string, position: Vec3, rotation?: Vec3) => void;
  updateMetadata: (id: string, metadata: Partial<WorkspaceComponent['metadata']>) => void;

  // ── Machining Modifiers ──
  addModifier: (id: string, type: MachiningType, face?: 'top' | 'front' | 'side', x?: number, y?: number) => void;
  removeModifier: (id: string, modId: string) => void;
  updateModifier: (id: string, modId: string, data: Partial<MachiningModifier>) => void;

  // ── Connection ──
  connectComponents: (sourceId: string, targetId: string) => boolean;
  disconnectComponents: (sourceId: string, targetId: string) => void;

  // ── Drag Flow ──
  startDrag: (componentId: string) => void;
  updateDragPreview: (position: Vec3, rotation: Vec3, snapResult: SnapResult | null) => void;
  commitDrag: () => void;
  cancelDrag: () => void;

  // ── Selection ──
  selectComponent: (id: string | null) => void;

  // ── Tools ──
  setToolMode: (mode: 'select' | 'translate' | 'rotate') => void;

  // ── FEA Visualization ──
  setFeaActive: (active: boolean) => void;

  // ── Snap Config ──
  setSnapEnabled: (enabled: boolean) => void;
  setSnapThreshold: (threshold: number) => void;
  setGridSize: (size: number) => void;

  // ── Validation ──
  validateStructure: () => void;

  // ── Bulk ──
  clearWorkspace: () => void;
}

// ════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════

let _idCounter = 0;

function generateId(type: ComponentType): string {
  _idCounter++;
  return `${type}-${Date.now().toString(36)}-${_idCounter}`;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  draggedComponentId: null,
  previewPosition: [0, 0, 0],
  previewRotation: [0, 0, 0],
  snapResult: null,
};

// ════════════════════════════════════════════
// Store Implementation
// ════════════════════════════════════════════

export const useAssemblyStore = create<AssemblyState & AssemblyActions>()(
  (set, get) => ({
      // ── Initial State ──
      components: {},
      dragState: { ...INITIAL_DRAG_STATE },
      snapConfig: { ...SNAP_DEFAULTS },
      connectionRules: [...RULES],
      selectedId: null,
      toolMode: 'select',
      feaActive: false,

      // ════════════════════════════════════════
      // Component CRUD
      // ════════════════════════════════════════

      addComponent: (type, position = [0, 0, 0]) => {
        const id = generateId(type);
        const meta = META_DEFAULTS[type];

        const component: WorkspaceComponent = {
          id,
          type,
          position,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          connections: [],
          metadata: { ...meta },
          modifiers: [],
          isValid: false,
          validationErrors: ['Not connected to any component'],
        };

        set((state) => ({
          components: { ...state.components, [id]: component },
        }));

        return id;
      },

      removeComponent: (id) => {
        set((state) => {
          const { [id]: removed, ...remaining } = state.components;
          if (!removed) return state;

          // Clean up connections referencing this ID
          const cleaned: Record<string, WorkspaceComponent> = {};
          for (const [key, comp] of Object.entries(remaining)) {
            cleaned[key] = {
              ...comp,
              connections: comp.connections.filter((cid) => cid !== id),
            };
          }

          return {
            components: cleaned,
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        });
      },

      updateTransform: (id, position, rotation) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return state;

          return {
            components: {
              ...state.components,
              [id]: {
                ...component,
                position,
                rotation: rotation ?? component.rotation,
              },
            },
          };
        });
      },

      updateMetadata: (id, metadata) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return state;

          const newMeta = { ...component.metadata, ...metadata };
          let newWeight = component.metadata.weight;
          let newCost = component.metadata.unitCost;

          if (component.type === 'profile' && metadata.length !== undefined) {
            newWeight = parseFloat((newMeta.length! * 0.0027).toFixed(3));
            newCost = parseFloat((newMeta.length! * 0.0625).toFixed(2));
          } else if (component.type === 'gear' && (metadata.teeth !== undefined || metadata.module !== undefined || metadata.width !== undefined)) {
            const Rp = ((newMeta.module ?? 2) * (newMeta.teeth ?? 24)) / 2;
            const volume = Math.PI * Rp * Rp * (newMeta.width ?? 20);
            const steelDensity = 7.85e-6; // kg/mm^3
            newWeight = parseFloat((volume * steelDensity).toFixed(3));
            newCost = parseFloat((newWeight * 15 + 5).toFixed(2));
          } else if (component.type === 'bearing' && (metadata.innerDia !== undefined || metadata.outerDia !== undefined || metadata.width !== undefined)) {
            const rOuter = (newMeta.outerDia ?? 47) / 2;
            const rInner = (newMeta.innerDia ?? 20) / 2;
            const volume = Math.PI * (rOuter * rOuter - rInner * rInner) * (newMeta.width ?? 14);
            const steelDensity = 7.85e-6; // kg/mm^3
            newWeight = parseFloat((volume * steelDensity * 0.65).toFixed(3)); // 65% fill factor
            newCost = parseFloat((newWeight * 30 + 8).toFixed(2));
          } else if (component.type === 'key' && (metadata.length !== undefined || metadata.width !== undefined || metadata.height !== undefined)) {
            const volume = (newMeta.length ?? 20) * (newMeta.width ?? 6) * (newMeta.height ?? 6);
            const steelDensity = 7.85e-6; // kg/mm^3
            newWeight = parseFloat((volume * steelDensity).toFixed(3));
            newCost = parseFloat((newWeight * 20 + 0.5).toFixed(2));
          }

          return {
            components: {
              ...state.components,
              [id]: {
                ...component,
                metadata: { ...newMeta, weight: newWeight, unitCost: newCost },
              },
            },
          };
        });
      },

      addModifier: (id, type, face = 'top', x = 0, y = 0) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return state;

          const newMod: MachiningModifier = {
            id: crypto.randomUUID(),
            type,
            face,
            x,
            y,
            diameter: type === 'HOLE' || type === 'THREADED' ? 8 : undefined,
            width: type === 'RECT_CUT' ? 20 : undefined,
            height: type === 'RECT_CUT' ? 20 : undefined,
            depth: 10,
          };

          return {
            components: {
              ...state.components,
              [id]: {
                ...component,
                modifiers: [...(component.modifiers || []), newMod],
              },
            },
          };
        });
      },

      removeModifier: (id, modId) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return state;

          return {
            components: {
              ...state.components,
              [id]: {
                ...component,
                modifiers: (component.modifiers || []).filter((m) => m.id !== modId),
              },
            },
          };
        });
      },

      updateModifier: (id, modId, data) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return state;

          return {
            components: {
              ...state.components,
              [id]: {
                ...component,
                modifiers: (component.modifiers || []).map((m) =>
                  m.id === modId ? { ...m, ...data } : m
                ),
              },
            },
          };
        });
      },

      // ════════════════════════════════════════
      // Connections
      // ════════════════════════════════════════

      connectComponents: (sourceId, targetId) => {
        const state = get();
        const source = state.components[sourceId];
        const target = state.components[targetId];

        if (!source || !target) return false;
        if (source.connections.includes(targetId)) return false;

        // Validate connection rules
        const rule = state.connectionRules.find((r) => r.source === source.type);
        if (!rule || !rule.targets.includes(target.type)) return false;

        set((prev) => ({
          components: {
            ...prev.components,
            [sourceId]: {
              ...prev.components[sourceId],
              connections: [...prev.components[sourceId].connections, targetId],
            },
            [targetId]: {
              ...prev.components[targetId],
              connections: [...prev.components[targetId].connections, sourceId],
            },
          },
        }));

        // Re-validate after connection
        get().validateStructure();
        return true;
      },

      disconnectComponents: (sourceId, targetId) => {
        set((state) => ({
          components: {
            ...state.components,
            [sourceId]: {
              ...state.components[sourceId],
              connections: state.components[sourceId].connections.filter(
                (id) => id !== targetId
              ),
            },
            [targetId]: {
              ...state.components[targetId],
              connections: state.components[targetId].connections.filter(
                (id) => id !== sourceId
              ),
            },
          },
        }));

        get().validateStructure();
      },

      // ════════════════════════════════════════
      // Drag Flow (Preview → Commit pattern)
      // ════════════════════════════════════════

      startDrag: (componentId) => {
        const component = get().components[componentId];
        if (!component) return;

        set({
          dragState: {
            isDragging: true,
            draggedComponentId: componentId,
            previewPosition: [...component.position] as Vec3,
            previewRotation: [...component.rotation] as Vec3,
            snapResult: null,
          },
          selectedId: componentId,
        });
      },

      updateDragPreview: (position, rotation, snapResult) => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            previewPosition: position,
            previewRotation: rotation,
            snapResult,
          },
        }));
      },

      commitDrag: () => {
        const { dragState, components } = get();
        if (!dragState.isDragging || !dragState.draggedComponentId) return;

        const componentId = dragState.draggedComponentId;
        const component = components[componentId];
        if (!component) return;

        // Commit the preview position to the actual component
        const finalPosition = dragState.snapResult?.isSnapped
          ? dragState.snapResult.position
          : dragState.previewPosition;

        const finalRotation = dragState.snapResult?.isSnapped
          ? dragState.snapResult.rotation
          : dragState.previewRotation;

        set((state) => ({
          components: {
            ...state.components,
            [componentId]: {
              ...state.components[componentId],
              position: finalPosition,
              rotation: finalRotation,
            },
          },
          dragState: { ...INITIAL_DRAG_STATE },
        }));

        // Auto-connect if snapped
        if (dragState.snapResult?.isSnapped && dragState.snapResult.targetId) {
          get().connectComponents(componentId, dragState.snapResult.targetId);
        }

        get().validateStructure();
      },

      cancelDrag: () => {
        set({ dragState: { ...INITIAL_DRAG_STATE } });
      },

      // ════════════════════════════════════════
      // Selection
      // ════════════════════════════════════════

      selectComponent: (id) => {
        set({ selectedId: id });
      },

      // ════════════════════════════════════════
      // Tools
      // ════════════════════════════════════════

      setToolMode: (mode) => {
        set({ toolMode: mode });
      },

      setFeaActive: (active) => {
        set({ feaActive: active });
      },

      // ════════════════════════════════════════
      // Snap Config
      // ════════════════════════════════════════

      setSnapEnabled: (enabled) => {
        set((state) => ({
          snapConfig: { ...state.snapConfig, enabled },
        }));
      },

      setSnapThreshold: (threshold) => {
        set((state) => ({
          snapConfig: { ...state.snapConfig, threshold },
        }));
      },

      setGridSize: (size) => {
        set((state) => ({
          snapConfig: { ...state.snapConfig, gridSize: size },
        }));
      },

      // ════════════════════════════════════════
      // Validation
      // ════════════════════════════════════════

      validateStructure: () => {
        set((state) => {
          const updated: Record<string, WorkspaceComponent> = {};

          for (const [id, comp] of Object.entries(state.components)) {
            const errors: string[] = [];

            // Check: No connections = floating
            if (comp.connections.length === 0) {
              errors.push('Not connected to any component');
            }

            // Check: Bolt without both profile and bracket
            if (comp.type === 'bolt' && comp.connections.length < 2) {
              errors.push('Bolt should connect at least 2 components');
            }

            // Check: Connection targets still exist
            const orphanedConnections = comp.connections.filter(
              (cid) => !state.components[cid]
            );
            if (orphanedConnections.length > 0) {
              errors.push('Has orphaned connections');
            }

            updated[id] = {
              ...comp,
              // Remove orphaned connections
              connections: comp.connections.filter(
                (cid) => !!state.components[cid]
              ),
              isValid: errors.length === 0,
              validationErrors: errors,
            };
          }

          return { components: updated };
        });
      },

      // ════════════════════════════════════════
      // Bulk Operations
      // ════════════════════════════════════════

      clearWorkspace: () => {
        set({
          components: {},
          dragState: { ...INITIAL_DRAG_STATE },
          selectedId: null,
        });
      },
    })
);

// ════════════════════════════════════════════
// Selectors (for selective subscriptions)
// ════════════════════════════════════════════

/** Get all components as array */
export const selectComponentList = (state: AssemblyState) =>
  Object.values(state.components);

/** Get component by ID */
export const selectComponent = (id: string) => (state: AssemblyState) =>
  state.components[id] ?? null;

/** Get components by type */
export const selectComponentsByType = (type: ComponentType) => (state: AssemblyState) =>
  Object.values(state.components).filter((c) => c.type === type);

/** Get the currently dragged component's effective position */
export const selectDragPreview = (state: AssemblyState & { dragState: DragState }) => {
  if (!state.dragState.isDragging) return null;
  return {
    componentId: state.dragState.draggedComponentId,
    position: state.dragState.previewPosition,
    rotation: state.dragState.previewRotation,
    isSnapped: state.dragState.snapResult?.isSnapped ?? false,
    snapTargetId: state.dragState.snapResult?.targetId ?? null,
  };
};

/** Check if a specific component is selected */
export const selectIsSelected = (id: string) => (state: AssemblyState) =>
  state.selectedId === id;

/** Get count of all components */
export const selectComponentCount = (state: AssemblyState) =>
  Object.keys(state.components).length;

/** Whether FEA stress visualization is active */
export const selectFeaActive = (state: AssemblyState) => state.feaActive;

/**
 * AluCAD Store - Main CAD State Management
 * 
 * Zustand store for entities, viewport, selection, and command state.
 */

import { create } from 'zustand';
import {
    CadEntity,
    Point,
    Viewport,
    Layer,
    CommandState,
    OSnapMode,
    SnapResult,
    Constraint,
    createPointEntity,
    createCircleEntity,
    CadUnit,
    MachiningModifier
} from '../kernel/types';
import { DEFAULT_LAYER } from '../kernel/constants';
import { Body, createBody } from '../kernel/Body';
import {
    distance, distanceSquared, rotatePoint, mirrorPoint,
    isPointInRect, isLineInRect
} from '../kernel/GeometryKernel';
import { constraintGraph } from '../kernel/ConstraintGraph';
import { spatialIndex, computeEntityBBox } from '../geometry/SpatialIndex';
import { solverWrapper } from '../constraints/SolverWrapper';
import { Transformer } from '../kernel/Transformer';
import { DynamicBlockEngine } from '../blocks/dynamic/DynamicBlockEngine';
import { DynamicBlockRegistry } from '../blocks/dynamic/registry';
import { geometryPrimitives, primitivesInBox } from '../kernel/primitives';
import { isEntityEditable, publishLayers } from '../kernel/layers';
import { explodeEntity, isExplodable, missingReferenceLayers } from '../kernel/explode';

/** Undo depth (each step stores a full snapshot of the drawing). */
const MAX_HISTORY = 100;

// ═══════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════

interface HistoryEntry {
    entities: CadEntity[];
    /** layer table at that step (older entries may not have it) */
    layers?: Layer[];
    description: string;
}

const snapshot = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface CadStore {
    // ─────────────────────────────────────────────────────────────
    // ENTITIES
    // ─────────────────────────────────────────────────────────────
    entities: CadEntity[];
    constraints: Constraint[];
    addEntity: (entity: CadEntity) => void;
    addEntities: (entities: CadEntity[]) => void;
    removeEntity: (id: string) => void;
    updateEntity: (id: string, updates: Partial<CadEntity>) => void;
    moveEntities: (ids: string[], vector: Point, skipHistory?: boolean) => void;
    updateDynamicBlock: (
        blockInstanceId: string,
        patchParams: Record<string, any>,
        options?: { skipHistory?: boolean; newBasePoint?: Point }
    ) => void;
    clearEntities: () => void;

    // Constraints
    addConstraint: (constraint: Constraint) => void;
    removeConstraint: (id: string) => void;
    solveConstraints: () => void;

    // ─────────────────────────────────────────────────────────────
    // BODIES (Multibody)
    // ─────────────────────────────────────────────────────────────
    bodies: Body[];
    activeBodyId: string | null;
    addBody: (name: string) => string;
    removeBody: (id: string) => void;
    updateBody: (id: string, updates: Partial<Body>) => void;
    setActiveBody: (id: string | null) => void;

    // ─────────────────────────────────────────────────────────────
    // LAYERS
    // ─────────────────────────────────────────────────────────────
    layers: Layer[];
    activeLayerId: string;
    addLayer: (name: string, color: string) => void;
    setActiveLayer: (id: string) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    removeLayer: (id: string) => void;
    toggleLayerVisibility: (id: string) => void;
    toggleLayerLock: (id: string) => void;
    toggleLayerFreeze: (id: string) => void;
    setLayerColor: (id: string, color: string) => void;

    // ─────────────────────────────────────────────────────────────
    // VIEWPORT
    // ─────────────────────────────────────────────────────────────
    viewport: Viewport;
    setViewport: (viewport: Viewport) => void;
    updateViewport: (updates: Partial<Viewport>) => void;
    zoomExtents: () => void;

    // ─────────────────────────────────────────────────────────────
    // SELECTION
    // ─────────────────────────────────────────────────────────────
    selectedIds: string[];
    selectEntity: (id: string, additive?: boolean) => void;
    deselectEntity: (id: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    toggleSelection: (id: string) => void;
    selectEntitiesInRect: (p1: Point, p2: Point, fullyContained: boolean) => void;
    deleteSelected: () => void;
    groupSelectedEntities: (groupId?: string) => string | null;
    ungroupSelectedEntities: () => number;
    explodeSelectedEntities: () => number;

    // ─────────────────────────────────────────────────────────────
    // COMMAND STATE
    // ─────────────────────────────────────────────────────────────
    activeCommand: string | null;
    commandState: CommandState;
    commandPrompt: string;
    commandPoints: Point[];
    setActiveCommand: (cmd: string | null) => void;
    setCommandState: (state: CommandState) => void;
    setCommandPrompt: (prompt: string) => void;
    addCommandPoint: (point: Point) => void;
    clearCommandPoints: () => void;
    cancelCommand: () => void;

    // ─────────────────────────────────────────────────────────────
    // SNAP SETTINGS
    // ─────────────────────────────────────────────────────────────
    snapEnabled: boolean;
    activeSnaps: OSnapMode[];
    currentSnap: SnapResult | null;
    toggleSnap: () => void;
    setActiveSnaps: (snaps: OSnapMode[]) => void;
    setCurrentSnap: (snap: SnapResult | null) => void;

    // ─────────────────────────────────────────────────────────────
    // ORTHO, POLAR & GRID
    // ─────────────────────────────────────────────────────────────
    orthoEnabled: boolean;
    polarTrackingEnabled: boolean;
    polarAngleIncrement: number;
    gridSnapEnabled: boolean;
    showGrid: boolean;
    gridSpacing: number;
    toggleOrtho: () => void;
    togglePolarTracking: () => void;
    setPolarAngleIncrement: (increment: number) => void;
    toggleGridSnap: () => void;
    toggleGrid: () => void;
    setGridSpacing: (spacing: number) => void;

    // ─────────────────────────────────────────────────────────────
    // UNDO/REDO
    // ─────────────────────────────────────────────────────────────
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    pushHistory: (description: string) => void;
    undo: () => void;
    redo: () => void;

    // ─────────────────────────────────────────────────────────────
    // PREVIEW (for elastic band, etc.)
    // ─────────────────────────────────────────────────────────────
    previewEntity: CadEntity | null;
    setPreviewEntity: (entity: CadEntity | null) => void;

    // ─────────────────────────────────────────────────────────────
    // CURSOR
    // ─────────────────────────────────────────────────────────────
    cursorWorld: Point;
    cursorScreen: Point;
    setCursor: (world: Point, screen: Point) => void;
    // ─────────────────────────────────────────────────────────────
    // PARAMETRIC DIMENSIONS
    // ─────────────────────────────────────────────────────────────
    editDimension: (constraintId: string, newValue: number) => void;

    // ─────────────────────────────────────────────────────────────
    // UNITS
    // ─────────────────────────────────────────────────────────────
    units: CadUnit;
    setUnits: (unit: CadUnit) => void;
    scaleAllEntities: (scaleFactor: number, basePoint?: Point) => void;

    // ─────────────────────────────────────────────────────────────
    // MCP INTEGRATION (AI TOOLS)
    // ─────────────────────────────────────────────────────────────
    isMcpPanelOpen: boolean;
    activeMcpTool: string | null;
    setMcpPanelOpen: (isOpen: boolean) => void;
    setActiveMcpTool: (toolName: string | null) => void;

    // ─────────────────────────────────────────────────────────────
    // MACHINING MODIFIERS
    // ─────────────────────────────────────────────────────────────
    addModifier: (entityId: string, modifier: MachiningModifier) => void;
    removeModifier: (entityId: string, modifierIndex: number) => void;
    updateModifier: (entityId: string, index: number, updates: Partial<MachiningModifier>) => void;
}


// ═══════════════════════════════════════════════════════════════
// STORE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SEED ENTITIES & CONSTRAINTS (100x60 Parametric Rectangle)
// ═══════════════════════════════════════════════════════════════

const SEED_RECT_LINE_B: CadEntity = {
    id: 'seed-line-bottom',
    layerId: 'layer-0',
    color: '#00e5ff',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'LINE',
        start: { x: -50, y: -30 },
        end: { x: 50, y: -30 }
    }
};

const SEED_RECT_LINE_R: CadEntity = {
    id: 'seed-line-right',
    layerId: 'layer-0',
    color: '#00e5ff',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'LINE',
        start: { x: 50, y: -30 },
        end: { x: 50, y: 30 }
    }
};

const SEED_RECT_LINE_T: CadEntity = {
    id: 'seed-line-top',
    layerId: 'layer-0',
    color: '#00e5ff',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'LINE',
        start: { x: 50, y: 30 },
        end: { x: -50, y: 30 }
    }
};

const SEED_RECT_LINE_L: CadEntity = {
    id: 'seed-line-left',
    layerId: 'layer-0',
    color: '#00e5ff',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'LINE',
        start: { x: -50, y: 30 },
        end: { x: -50, y: -30 }
    }
};

const SEED_RECT_DIM_H: CadEntity = {
    id: 'seed-dim-width',
    layerId: 'layer-0',
    color: '#ffcc00',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'DIMENSION',
        start: { x: -50, y: -30 },
        end: { x: 50, y: -30 },
        textPoint: { x: 0, y: -45 },
        value: 100,
        text: '100.00 mm',
        offset: 15
    }
};

const SEED_RECT_DIM_V: CadEntity = {
    id: 'seed-dim-height',
    layerId: 'layer-0',
    color: '#ffcc00',
    isVisible: true,
    isSelected: false,
    geometry: {
        type: 'DIMENSION',
        start: { x: 50, y: -30 },
        end: { x: 50, y: 30 },
        textPoint: { x: 68, y: 0 },
        value: 60,
        text: '60.00 mm',
        offset: 15
    }
};

export const INITIAL_CAD_ENTITIES: CadEntity[] = [];

export const INITIAL_CAD_CONSTRAINTS: Constraint[] = [];

export const DEMO_CAD_ENTITIES: CadEntity[] = [
    SEED_RECT_LINE_B,
    SEED_RECT_LINE_R,
    SEED_RECT_LINE_T,
    SEED_RECT_LINE_L,
    SEED_RECT_DIM_H,
    SEED_RECT_DIM_V
];

export const DEMO_CAD_CONSTRAINTS: Constraint[] = [
    { id: 'seed-c-horiz-1', type: 'HORIZONTAL', entityIds: ['seed-line-bottom'], active: true },
    { id: 'seed-c-vert-1', type: 'VERTICAL', entityIds: ['seed-line-right'], active: true },
    { id: 'seed-c-horiz-2', type: 'HORIZONTAL', entityIds: ['seed-line-top'], active: true },
    { id: 'seed-c-vert-2', type: 'VERTICAL', entityIds: ['seed-line-left'], active: true },
    { id: 'seed-c-dist-w', type: 'DISTANCE', entityIds: ['seed-line-bottom'], active: true, value: 100 },
    { id: 'seed-c-dist-h', type: 'DISTANCE', entityIds: ['seed-line-right'], active: true, value: 60 }
];

export const useCadStore = create<CadStore>((set, get) => ({
    // ─────────────────────────────────────────────────────────────
    // ENTITIES
    // ─────────────────────────────────────────────────────────────
    entities: INITIAL_CAD_ENTITIES,
    constraints: INITIAL_CAD_CONSTRAINTS,
    bodies: [],
    activeBodyId: null,
    // ─────────────────────────────────────────────────────────────
    // CONSTRAINTS & SOLVER
    // ─────────────────────────────────────────────────────────────
    addConstraint: (constraint) => {
        get().pushHistory('Add constraint');
        set(state => ({ constraints: [...state.constraints, constraint] }));
        get().solveConstraints();
    },

    removeConstraint: (id) => {
        get().pushHistory('Remove constraint');
        set(state => ({ constraints: state.constraints.filter(c => c.id !== id) }));
        get().solveConstraints();
    },

    solveConstraints: () => {
        const { entities, constraints } = get();
        if (constraints.length === 0) return; // Nothing to solve

        // Ensure solver is initialized before solving
        solverWrapper.init().then(() => {
            const solvedEntities = solverWrapper.solve(get().entities, get().constraints);

            // Rebuild spatial index with updated geometries
            spatialIndex.clear();
            solvedEntities.forEach(e => {
                if (e.isVisible !== false) {
                    const bbox = computeEntityBBox(e);
                    if (bbox) spatialIndex.insert(e.id, bbox);
                }
            });

            set({ entities: solvedEntities });
        });
    },

    addEntity: (entity) => {
        get().pushHistory('Add entity');
        const newEntities = [...get().entities, entity];
        set({ entities: newEntities });
        spatialIndex.rebuild(newEntities);
    },

    addEntities: (newEnts) => {
        if (!newEnts || newEnts.length === 0) return;
        get().pushHistory('Add entities');
        const combined = [...get().entities, ...newEnts];
        set({ entities: combined });
        spatialIndex.rebuild(combined);
    },

    removeEntity: (id) => {
        get().pushHistory('Remove entity');
        set(state => {
            const newEntities = state.entities.filter(e => e.id !== id);
            spatialIndex.remove(id);
            return {
                entities: newEntities,
                selectedIds: state.selectedIds.filter(sid => sid !== id)
            };
        });
    },

    updateEntity: (id, updates) => {
        set(state => {
            const newEntities = state.entities.map(e => {
                if (e.id === id) {
                    const updated = { ...e, ...updates };
                    // If geometry/visibility changed, update spatial index
                    if (updates.geometry || 'isVisible' in updates) {
                        spatialIndex.remove(id);
                        if (updated.isVisible !== false) {
                            const bbox = computeEntityBBox(updated);
                            if (bbox) spatialIndex.insert(id, bbox);
                        }
                    }
                    return updated;
                }
                return e;
            });
            return { entities: newEntities };
        });
    },

    moveEntities: (ids, vector, skipHistory = false) => {
        if (!ids.length || (vector.x === 0 && vector.y === 0)) return;
        if (!skipHistory) {
            get().pushHistory('Move');
        }
        set(state => {
            const idSet = new Set(ids);
            const newEntities = state.entities.map(e => {
                if (idSet.has(e.id)) {
                    const moved = Transformer.move(e, vector);
                    spatialIndex.remove(e.id);
                    if (moved.isVisible !== false) {
                        const bbox = computeEntityBBox(moved);
                        if (bbox) spatialIndex.insert(moved.id, bbox);
                    }
                    return moved;
                }
                return e;
            });
            return { entities: newEntities };
        });
    },

    updateDynamicBlock: (blockInstanceId, patchParams, options) => {
        const state = get();
        const existing = state.entities.filter(e => e.blockInstanceId === blockInstanceId);
        if (existing.length === 0) return;

        const first = existing[0];
        if (!first.dynamicBlockId) return;

        const blockDef = DynamicBlockRegistry.getById(first.dynamicBlockId);
        if (!blockDef) return;

        if (!options?.skipHistory) {
            get().pushHistory(`Update dynamic block: ${blockDef.nameTr || blockDef.name}`);
        }

        const updatedEntities = DynamicBlockEngine.updateInstance(existing, patchParams, options?.newBasePoint);

        // Remove old entities from spatial index
        for (const ent of existing) {
            spatialIndex.remove(ent.id);
        }

        // Insert new entities into spatial index
        for (const ent of updatedEntities) {
            const bbox = computeEntityBBox(ent);
            if (bbox) spatialIndex.insert(ent.id, bbox);
        }

        const newSelectedIds = updatedEntities.map(e => e.id);
        const existingIdsSet = new Set(existing.map(e => e.id));
        const remaining = state.entities.filter(e => !existingIdsSet.has(e.id));
        const newEntities = [...remaining, ...updatedEntities];

        set({
            entities: newEntities,
            selectedIds: newSelectedIds
        });
    },

    clearEntities: () => {
        get().pushHistory('Clear all');
        spatialIndex.clear();
        set({ entities: [], constraints: [], selectedIds: [] });
    },

    // ─────────────────────────────────────────────────────────────
    // LAYERS
    // ─────────────────────────────────────────────────────────────
    layers: [DEFAULT_LAYER],
    activeLayerId: 'layer-0',

    addLayer: (name: string, color: string) => set((state) => {
        const id = `layer-${Date.now()}`;
        const newLayer: Layer = {
            id,
            name,
            color,
            visible: true,
            locked: false,
            frozen: false,
            lineType: 'CONTINUOUS',
            lineWeight: 1
        };
        return {
            layers: [...state.layers, newLayer],
            activeLayerId: id
        };
    }),

    setActiveLayer: (id) => set({ activeLayerId: id }),

    updateLayer: (id, updates) => set(state => ({
        layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    })),

    removeLayer: (id) => {
        if (id === 'layer-0') return;
        const state = get();
        if (!state.layers.some(l => l.id === id)) return;
        // never lose drawing objects: they move to layer 0 (undoable)
        if (state.entities.some(e => e.layerId === id)) state.pushHistory('Delete layer');
        set(s => ({
            layers: s.layers.filter(l => l.id !== id),
            entities: s.entities.map(e => e.layerId === id ? { ...e, layerId: 'layer-0' } : e),
            activeLayerId: s.activeLayerId === id ? 'layer-0' : s.activeLayerId
        }));
    },

    toggleLayerVisibility: (id) => set((state) => {
        const hiding = state.layers.find(l => l.id === id)?.visible !== false;
        return {
            layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
            ...(hiding ? {
                entities: state.entities.map(e => e.layerId === id && e.isSelected ? { ...e, isSelected: false } : e),
                selectedIds: state.selectedIds.filter(sid => state.entities.find(e => e.id === sid)?.layerId !== id),
            } : {}),
        };
    }),

    toggleLayerLock: (id) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
        // objects on a locked layer cannot stay selected
        ...(state.layers.find(l => l.id === id)?.locked ? {} : {
            entities: state.entities.map(e => e.layerId === id && e.isSelected ? { ...e, isSelected: false } : e),
            selectedIds: state.selectedIds.filter(sid => state.entities.find(e => e.id === sid)?.layerId !== id),
        }),
    })),

    toggleLayerFreeze: (id) => set((state) => {
        // the current layer cannot be frozen (AutoCAD rule)
        if (id === state.activeLayerId) return state;
        return {
            layers: state.layers.map(l => l.id === id ? { ...l, frozen: !l.frozen } : l),
            entities: state.entities.map(e => e.layerId === id && e.isSelected ? { ...e, isSelected: false } : e),
            selectedIds: state.selectedIds.filter(sid => state.entities.find(e => e.id === sid)?.layerId !== id),
        };
    }),

    setLayerColor: (id, color) => set((state) => {
        const layer = state.layers.find(l => l.id === id);
        if (!layer) return state;
        const old = (layer.color || '').toLowerCase();
        // objects drawn in the layer colour follow it (ByLayer behaviour)
        return {
            layers: state.layers.map(l => l.id === id ? { ...l, color } : l),
            entities: state.entities.map(e =>
                e.layerId === id && (e.color || '').toLowerCase() === old ? { ...e, color } : e
            ),
        };
    }),

    // ─────────────────────────────────────────────────────────────
    // VIEWPORT
    // ─────────────────────────────────────────────────────────────
    viewport: {
        center: { x: 0, y: 0 },
        zoom: 1,
        width: 1920,
        height: 1080
    },

    setViewport: (viewport) => set({ viewport }),

    updateViewport: (updates) => set(state => ({
        viewport: { ...state.viewport, ...updates }
    })),

    zoomExtents: () => {
        const { entities, viewport } = get();
        if (entities.length === 0) {
            set({
                viewport: {
                    ...viewport,
                    center: { x: 0, y: 0 },
                    zoom: 1
                }
            });
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const expand = (x: number, y: number) => {
            if (Number.isFinite(x) && Number.isFinite(y)) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        };

        for (const e of entities) {
            const g = e.geometry as any;
            if (!g) continue;
            if (g.type === 'POINT' && g.x !== undefined) {
                expand(g.x, g.y);
            } else if (g.type === 'LINE' && g.start && g.end) {
                expand(g.start.x, g.start.y);
                expand(g.end.x, g.end.y);
            } else if ((g.type === 'CIRCLE' || g.type === 'ARC') && g.center && g.radius) {
                expand(g.center.x - g.radius, g.center.y - g.radius);
                expand(g.center.x + g.radius, g.center.y + g.radius);
            } else if (g.type === 'RECTANGLE' && g.x !== undefined && g.y !== undefined) {
                expand(g.x, g.y);
                expand(g.x + (g.width || 0), g.y + (g.height || 0));
            } else if (g.type === 'POLYLINE' && Array.isArray(g.points)) {
                for (const p of g.points) expand(p.x, p.y);
            } else if (g.type === 'SPLINE' && Array.isArray(g.controlPoints)) {
                for (const p of g.controlPoints) expand(p.x, p.y);
            } else if (g.type === 'DIMENSION' && g.start && g.end) {
                expand(g.start.x, g.start.y);
                expand(g.end.x, g.end.y);
            } else if (g.type === 'TEXT' && g.position) {
                expand(g.position.x, g.position.y);
            }
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX >= maxX || minY >= maxY) {
            set({
                viewport: {
                    ...viewport,
                    center: { x: 0, y: 0 },
                    zoom: 1
                }
            });
            return;
        }

        const bboxWidth = Math.max(10, maxX - minX);
        const bboxHeight = Math.max(10, maxY - minY);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const viewW = viewport.width || 1200;
        const viewH = viewport.height || 800;
        const padding = 0.85;

        const zoomX = (viewW * padding) / bboxWidth;
        const zoomY = (viewH * padding) / bboxHeight;
        const newZoom = Math.max(0.01, Math.min(50, Math.min(zoomX, zoomY)));

        set({
            viewport: {
                ...viewport,
                center: { x: centerX, y: centerY },
                zoom: newZoom
            }
        });
    },

    // ─────────────────────────────────────────────────────────────
    // SELECTION
    // ─────────────────────────────────────────────────────────────
    selectedIds: [],

    selectEntity: (id, additive = false) => set(state => {
        const target = state.entities.find(e => e.id === id);
        let idsToAdd = [id];
        if (target && (target.blockInstanceId || target.groupId)) {
            idsToAdd = state.entities.filter(e =>
                (target.blockInstanceId && e.blockInstanceId === target.blockInstanceId) ||
                (target.groupId && e.groupId === target.groupId)
            ).map(e => e.id);
        }
        const setIds = new Set(additive ? state.selectedIds : []);
        idsToAdd.forEach(i => setIds.add(i));
        const newSelection = Array.from(setIds);
        return {
            selectedIds: newSelection,
            entities: state.entities.map(e => ({
                ...e,
                isSelected: setIds.has(e.id)
            }))
        };
    }),

    deselectEntity: (id) => set(state => {
        const target = state.entities.find(e => e.id === id);
        const idsToRemove = new Set([id]);
        if (target && (target.blockInstanceId || target.groupId)) {
            state.entities.filter(e =>
                (target.blockInstanceId && e.blockInstanceId === target.blockInstanceId) ||
                (target.groupId && e.groupId === target.groupId)
            ).forEach(e => idsToRemove.add(e.id));
        }
        const newSelection = state.selectedIds.filter(sid => !idsToRemove.has(sid));
        return {
            selectedIds: newSelection,
            entities: state.entities.map(e => ({
                ...e,
                isSelected: newSelection.includes(e.id)
            }))
        };
    }),

    selectAll: () => set(state => ({
        selectedIds: state.entities.map(e => e.id),
        entities: state.entities.map(e => ({ ...e, isSelected: true }))
    })),

    deselectAll: () => set(state => ({
        selectedIds: [],
        entities: state.entities.map(e => ({ ...e, isSelected: false }))
    })),

    toggleSelection: (id) => {
        const state = get();
        const isSelected = state.selectedIds.includes(id);
        if (isSelected) {
            state.deselectEntity(id);
        } else {
            state.selectEntity(id, true);
        }
    },

    selectEntitiesInRect: (p1, p2, fullyContained) => set(state => {
        // AutoCAD semantics: window (left → right) takes whole objects inside the box,
        // crossing (right → left) also takes everything the box touches
        const box = {
            minX: Math.min(p1.x, p2.x), minY: Math.min(p1.y, p2.y),
            maxX: Math.max(p1.x, p2.x), maxY: Math.max(p1.y, p2.y),
        };
        const mode = fullyContained ? 'window' : 'crossing';
        const selected: string[] = [];
        const newEntities = state.entities.map(entity => {
            const isSelected = isEntityEditable(entity)
                && primitivesInBox(geometryPrimitives(entity.geometry, state.units), box, mode);
            if (isSelected) selected.push(entity.id);
            return entity.isSelected === isSelected ? entity : { ...entity, isSelected };
        });

        return {
            entities: newEntities,
            selectedIds: selected
        };
    }),

    deleteSelected: () => {
        const { entities, selectedIds } = get();
        if (selectedIds.length === 0) return;
        get().pushHistory('Delete selected');
        const remaining = entities.filter(e => !selectedIds.includes(e.id));
        selectedIds.forEach(id => {
            spatialIndex.remove(id);
            constraintGraph.removeNode(id);
        });
        set({ entities: remaining, selectedIds: [] });
    },

    groupSelectedEntities: (groupId?: string) => {
        const state = get();
        if (state.selectedIds.length < 2) return null;
        const newGroupId = groupId || `grp_${crypto.randomUUID().slice(0, 8)}`;
        state.pushHistory('Group entities');
        set(s => ({
            entities: s.entities.map(e => s.selectedIds.includes(e.id) ? { ...e, groupId: newGroupId } : e)
        }));
        return newGroupId;
    },

    ungroupSelectedEntities: () => {
        const state = get();
        if (state.selectedIds.length === 0) return 0;
        state.pushHistory('Ungroup entities');
        let count = 0;
        set(s => ({
            entities: s.entities.map(e => {
                if (s.selectedIds.includes(e.id) && e.groupId) {
                    count++;
                    const { groupId, ...rest } = e;
                    return rest as CadEntity;
                }
                return e;
            })
        }));
        return count;
    },

    explodeSelectedEntities: () => {
        const state = get();
        if (state.selectedIds.length === 0) return 0;
        const selected = new Set(state.selectedIds);
        const targets = state.entities.filter(e => selected.has(e.id) && isEntityEditable(e)
            && (e.blockInstanceId || e.groupId || e.isDynamic || isExplodable(e)));
        if (targets.length === 0) return 0;
        state.pushHistory('Explode entities');
        let explodedCount = 0;
        const needed = new Set<'center' | 'hidden' | 'dashed'>();
        const newEntities: CadEntity[] = [];

        for (const e of state.entities) {
            if (!selected.has(e.id) || !isEntityEditable(e)) {
                newEntities.push(e);
                continue;
            }
            if (e.blockInstanceId || e.groupId || e.isDynamic) {
                // block reference / group: its members become ordinary objects (one level, like AutoCAD)
                explodedCount++;
                const {
                    groupId, blockInstanceId, isDynamic, dynamicBlockId, dynamicParams,
                    dynamicBasePoint, dynamicScale, dynamicRotationRad, ...rest
                } = e;
                newEntities.push({ ...rest, isSelected: true });
                continue;
            }
            const res = explodeEntity(e, state.units);
            if (!res || res.entities.length === 0) {
                newEntities.push(e);
                continue;
            }
            explodedCount++;
            res.layersNeeded.forEach(k => needed.add(k));
            newEntities.push(...res.entities);
        }

        const extraLayers = missingReferenceLayers(state.layers, needed);
        const newSelectedIds = newEntities.filter(e => e.isSelected).map(e => e.id);
        set({
            entities: newEntities,
            selectedIds: newSelectedIds,
            ...(extraLayers.length ? { layers: [...state.layers, ...extraLayers] } : {}),
        });
        return explodedCount;
    },

    // ─────────────────────────────────────────────────────────────
    // COMMAND STATE
    // ─────────────────────────────────────────────────────────────
    activeCommand: null,
    commandState: 'IDLE',
    commandPrompt: '',
    commandPoints: [],

    setActiveCommand: (cmd) => {
        if (!cmd) {
            import('../commands/CommandProcessor').then(m => m.commandProcessor.setActiveCommand(null)).catch(() => {});
            set({
                activeCommand: null,
                commandState: 'IDLE',
                commandPrompt: '',
                commandPoints: [],
                previewEntity: null
            });
        } else {
            import('../commands/CommandProcessor').then(m => m.commandProcessor.startCommand(cmd)).catch(() => {});
            set({
                activeCommand: cmd,
                commandState: 'AWAITING_POINT',
                commandPrompt: `${cmd}: Specify first point:`,
                commandPoints: []
            });
        }
    },

    setCommandState: (state) => set({ commandState: state }),

    setCommandPrompt: (prompt) => set({ commandPrompt: prompt }),

    addCommandPoint: (point) => set(state => ({
        commandPoints: [...state.commandPoints, point]
    })),

    clearCommandPoints: () => set({ commandPoints: [] }),

    cancelCommand: () => {
        import('../commands/CommandProcessor').then(m => m.commandProcessor.handleCancel()).catch(() => {});
        set({
            activeCommand: null,
            commandState: 'IDLE',
            commandPrompt: '',
            commandPoints: [],
            previewEntity: null
        });
    },

    // ─────────────────────────────────────────────────────────────
    // SNAP SETTINGS
    // ─────────────────────────────────────────────────────────────
    snapEnabled: true,
    activeSnaps: ['END', 'MID', 'CEN', 'INT'],
    currentSnap: null,

    toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),

    setActiveSnaps: (snaps) => set({ activeSnaps: snaps }),

    setCurrentSnap: (snap) => set({ currentSnap: snap }),

    // ─────────────────────────────────────────────────────────────
    // ORTHO, POLAR & GRID
    // ─────────────────────────────────────────────────────────────
    orthoEnabled: false,
    polarTrackingEnabled: false,
    polarAngleIncrement: 45,
    gridSnapEnabled: true,
    showGrid: true,
    gridSpacing: 10,

    toggleOrtho: () => set(state => ({
        orthoEnabled: !state.orthoEnabled,
        polarTrackingEnabled: !state.orthoEnabled ? false : state.polarTrackingEnabled,
    })),

    togglePolarTracking: () => set(state => ({
        polarTrackingEnabled: !state.polarTrackingEnabled,
        orthoEnabled: !state.polarTrackingEnabled ? false : state.orthoEnabled,
    })),

    setPolarAngleIncrement: (increment) => set({ polarAngleIncrement: increment }),

    toggleGridSnap: () => set(state => ({ gridSnapEnabled: !state.gridSnapEnabled })),

    toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),

    setGridSpacing: (spacing) => set({ gridSpacing: spacing }),

    // ─────────────────────────────────────────────────────────────
    // UNDO/REDO
    // ─────────────────────────────────────────────────────────────
    undoStack: [],
    redoStack: [],

    pushHistory: (description) => set(state => ({
        undoStack: [...state.undoStack, {
            entities: snapshot(state.entities),
            layers: snapshot(state.layers),
            description
        }].slice(-MAX_HISTORY),
        redoStack: [] // Clear redo on new action
    })),

    undo: () => set(state => {
        if (state.undoStack.length === 0) return state;

        const prev = state.undoStack[state.undoStack.length - 1];
        return {
            entities: prev.entities,
            ...(prev.layers ? { layers: prev.layers } : {}),
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, {
                entities: snapshot(state.entities),
                layers: snapshot(state.layers),
                description: 'Undo'
            }].slice(-MAX_HISTORY)
        };
    }),

    redo: () => set(state => {
        if (state.redoStack.length === 0) return state;

        const next = state.redoStack[state.redoStack.length - 1];
        return {
            entities: next.entities,
            ...(next.layers ? { layers: next.layers } : {}),
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, {
                entities: snapshot(state.entities),
                layers: snapshot(state.layers),
                description: 'Redo'
            }].slice(-MAX_HISTORY)
        };
    }),

    // ─────────────────────────────────────────────────────────────
    // PREVIEW
    // ─────────────────────────────────────────────────────────────
    previewEntity: null,
    setPreviewEntity: (entity) => set({ previewEntity: entity }),

    // ─────────────────────────────────────────────────────────────
    // CURSOR
    // ─────────────────────────────────────────────────────────────
    cursorWorld: { x: 0, y: 0 },
    cursorScreen: { x: 0, y: 0 },
    setCursor: (world, screen) => set({ cursorWorld: world, cursorScreen: screen }),

    // ─────────────────────────────────────────────────────────────
    // BODIES (Multibody)
    // ─────────────────────────────────────────────────────────────
    addBody: (name) => {
        const body = createBody(name);
        set(state => ({ bodies: [...state.bodies, body] }));
        return body.id;
    },

    removeBody: (id) => set(state => ({
        bodies: state.bodies.filter(b => b.id !== id),
        activeBodyId: state.activeBodyId === id ? null : state.activeBodyId
    })),

    updateBody: (id, updates) => set(state => ({
        bodies: state.bodies.map(b => b.id === id ? { ...b, ...updates } : b)
    })),

    setActiveBody: (id) => set({ activeBodyId: id }),

    // ─────────────────────────────────────────────────────────────
    // PARAMETRIC DIMENSIONS
    // ─────────────────────────────────────────────────────────────
    editDimension: (constraintId, newValue) => {
        set(state => ({
            constraints: state.constraints.map(c =>
                c.id === constraintId ? { ...c, value: newValue } : c
            )
        }));
        get().solveConstraints();
    },

    // ─────────────────────────────────────────────────────────────
    // UNITS
    // ─────────────────────────────────────────────────────────────
    units: 'mm',
    setUnits: (units) => set({ units }),
    scaleAllEntities: (scaleFactor, basePoint = { x: 0, y: 0 }) => {
        if (!Number.isFinite(scaleFactor) || Math.abs(scaleFactor) < 1e-9) return;
        get().pushHistory(`Scale all entities (×${scaleFactor})`);
        const scaledEntities = get().entities.map((e) => Transformer.scale(e, basePoint, scaleFactor));
        set({ entities: scaledEntities });
        spatialIndex.rebuild(scaledEntities);
    },

    // ─────────────────────────────────────────────────────────────
    // MCP INTEGRATION
    // ─────────────────────────────────────────────────────────────
    isMcpPanelOpen: false,
    activeMcpTool: null,
    setMcpPanelOpen: (isOpen) => set({ isMcpPanelOpen: isOpen }),
    setActiveMcpTool: (toolName) => set({ activeMcpTool: toolName, isMcpPanelOpen: !!toolName }),

    // ─────────────────────────────────────────────────────────────
    // MACHINING MODIFIERS
    // ─────────────────────────────────────────────────────────────
    addModifier: (entityId, modifier) => {
        get().pushHistory('Add modifier');
        set(state => ({
            entities: state.entities.map(e => {
                if (e.id === entityId) {
                    return { ...e, modifiers: [...(e.modifiers || []), modifier] };
                }
                return e;
            })
        }));
    },

    removeModifier: (entityId, modifierIndex) => {
        get().pushHistory('Remove modifier');
        set(state => ({
            entities: state.entities.map(e => {
                if (e.id === entityId && e.modifiers) {
                    const newMods = [...e.modifiers];
                    newMods.splice(modifierIndex, 1);
                    return { ...e, modifiers: newMods };
                }
                return e;
            })
        }));
    },

    updateModifier: (entityId, index, updates) => {
        set(state => ({
            entities: state.entities.map(e => {
                if (e.id === entityId && e.modifiers) {
                    const modifiers = e.modifiers.map((m, i) =>
                        i === index ? { ...m, ...updates } : m
                    );
                    return { ...e, modifiers };
                }
                return e;
            })
        }));
    },

}));

// ═══════════════════════════════════════════════════════════════
// INITIAL SPATIAL INDEX PRIMING
// ═══════════════════════════════════════════════════════════════
spatialIndex.rebuild(INITIAL_CAD_ENTITIES);

// ═══════════════════════════════════════════════════════════════
// SELECTORS / COMPUTED HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Accurate DOF count using ConstraintGraph.
 * Falls back to naive estimation if graph not available.
 */
export const useDOFCount = () => {
    const entities = useCadStore(s => s.entities);
    const constraints = useCadStore(s => s.constraints);

    try {
        constraintGraph.rebuild(entities, constraints);
        const analysis = constraintGraph.analyzeDOF();
        return analysis.totalDOF;
    } catch (e) {
        console.error("Error calculating DOF with ConstraintGraph, falling back to naive estimation:", e);
        // Fallback: naive estimation
        const pointCount = entities.filter(e => e.geometry.type === 'POINT').length;
        const lineCount = entities.filter(e => e.geometry.type === 'LINE').length;
        const circleCount = entities.filter(e => e.geometry.type === 'CIRCLE').length;
        const totalVars = pointCount * 2 + lineCount * 4 + circleCount * 3;
        const activeConstraints = constraints.filter(c => c.active).length;
        return Math.max(0, totalVars - activeConstraints);
    }
};

export const useConstraintStatus = () => {
    const dof = useDOFCount();
    if (dof === 0) return 'FULLY_CONSTRAINED' as const;
    if (dof < 0) return 'OVER_CONSTRAINED' as const;
    return 'UNDER_CONSTRAINED' as const;
};

// layer flags are read by picking, snapping and the renderer
publishLayers(useCadStore.getState().layers);
useCadStore.subscribe((state, prevState) => {
    if (state.layers !== prevState.layers) publishLayers(state.layers);
});

// ═══════════════════════════════════════════════════════════════
// AUTOMATIC PERSISTENCE SYNC
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    useCadStore.subscribe((state, prevState) => {
        if (
            state.entities !== prevState.entities ||
            state.layers !== prevState.layers ||
            state.bodies !== prevState.bodies ||
            state.constraints !== prevState.constraints ||
            state.units !== prevState.units
        ) {
            import('../persistence/autoSaveManager').then(({ autoSaveManager }) => {
                autoSaveManager.triggerChange();
            }).catch(() => {});
        }
    });
}


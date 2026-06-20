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

// ═══════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════

interface HistoryEntry {
    entities: CadEntity[];
    description: string;
}

interface CadStore {
    // ─────────────────────────────────────────────────────────────
    // ENTITIES
    // ─────────────────────────────────────────────────────────────
    entities: CadEntity[];
    constraints: Constraint[];
    addEntity: (entity: CadEntity) => void;
    removeEntity: (id: string) => void;
    updateEntity: (id: string, updates: Partial<CadEntity>) => void;
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
    setLayerColor: (id: string, color: string) => void;

    // ─────────────────────────────────────────────────────────────
    // VIEWPORT
    // ─────────────────────────────────────────────────────────────
    viewport: Viewport;
    setViewport: (viewport: Viewport) => void;
    updateViewport: (updates: Partial<Viewport>) => void;

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
    // ORTHO & GRID
    // ─────────────────────────────────────────────────────────────
    orthoEnabled: boolean;
    gridSnapEnabled: boolean;
    showGrid: boolean;
    gridSpacing: number;
    toggleOrtho: () => void;
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

export const useCadStore = create<CadStore>((set, get) => ({
    // ─────────────────────────────────────────────────────────────
    // ENTITIES
    // ─────────────────────────────────────────────────────────────
    entities: [],
    constraints: [],
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

    clearEntities: () => {
        get().pushHistory('Clear all');
        spatialIndex.clear();
        set({ entities: [], selectedIds: [] });
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

    removeLayer: (id) => set((state) => {
        if (id === 'layer-0') return state;
        const newEntities = state.entities.filter(e => e.layerId !== id);
        return {
            layers: state.layers.filter(l => l.id !== id),
            entities: newEntities,
            activeLayerId: state.activeLayerId === id ? 'layer-0' : state.activeLayerId
        };
    }),

    toggleLayerVisibility: (id) => set((state) => ({
        layers: state.layers.map(l =>
            l.id === id ? { ...l, visible: !l.visible } : l
        )
    })),

    setLayerColor: (id, color) => set((state) => ({
        layers: state.layers.map(l =>
            l.id === id ? { ...l, color } : l
        )
    })),

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

    // ─────────────────────────────────────────────────────────────
    // SELECTION
    // ─────────────────────────────────────────────────────────────
    selectedIds: [],

    selectEntity: (id, additive = false) => set(state => {
        const newSelection = additive
            ? [...state.selectedIds, id]
            : [id];
        return {
            selectedIds: newSelection,
            entities: state.entities.map(e => ({
                ...e,
                isSelected: newSelection.includes(e.id)
            }))
        };
    }),

    deselectEntity: (id) => set(state => {
        const newSelection = state.selectedIds.filter(sid => sid !== id);
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
        const selected: string[] = [];
        const newEntities = state.entities.map(entity => {
            let isSelected = false;
            const geom = entity.geometry;

            if (geom.type === 'LINE') {
                isSelected = isLineInRect(geom.start, geom.end, p1, p2, fullyContained);
            } else if (geom.type === 'CIRCLE' || geom.type === 'ARC') {
                isSelected = isPointInRect(geom.center, p1, p2);
            } else if (geom.type === 'POINT') {
                isSelected = isPointInRect({ x: geom.x, y: geom.y }, p1, p2);
            } else if (geom.type === 'POLYLINE') {
                // Check if any segment is in rect
                isSelected = geom.vertices.some((v, i) => {
                    if (i === 0) return isPointInRect(v, p1, p2);
                    return isLineInRect(geom.vertices[i - 1], v, p1, p2, fullyContained);
                });
            } else if (geom.type === 'DIMENSION') {
                if (geom.start && geom.end) {
                    isSelected = isLineInRect(geom.start, geom.end, p1, p2, fullyContained);
                }
            } else if (geom.type === 'RECTANGLE' || geom.type === 'HEXAGON' || geom.type === 'GEAR') {
                isSelected = isPointInRect((geom as any).center, p1, p2);
            } else if (geom.type === 'FASTENER') {
                isSelected = isPointInRect((geom as any).origin, p1, p2);
            }


            if (isSelected) {
                selected.push(entity.id);
            }

            return { ...entity, isSelected };
        });

        return {
            entities: newEntities,
            selectedIds: selected
        };
    }),

    // ─────────────────────────────────────────────────────────────
    // COMMAND STATE
    // ─────────────────────────────────────────────────────────────
    activeCommand: null,
    commandState: 'IDLE',
    commandPrompt: '',
    commandPoints: [],

    setActiveCommand: (cmd) => set({
        activeCommand: cmd,
        commandState: cmd ? 'AWAITING_POINT' : 'IDLE',
        commandPrompt: cmd ? `${cmd}: Specify first point:` : '',
        commandPoints: []
    }),

    setCommandState: (state) => set({ commandState: state }),

    setCommandPrompt: (prompt) => set({ commandPrompt: prompt }),

    addCommandPoint: (point) => set(state => ({
        commandPoints: [...state.commandPoints, point]
    })),

    clearCommandPoints: () => set({ commandPoints: [] }),

    cancelCommand: () => set({
        activeCommand: null,
        commandState: 'IDLE',
        commandPrompt: '',
        commandPoints: [],
        previewEntity: null
    }),

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
    // ORTHO & GRID
    // ─────────────────────────────────────────────────────────────
    orthoEnabled: false,
    gridSnapEnabled: true,
    showGrid: true,
    gridSpacing: 10,

    toggleOrtho: () => set(state => ({ orthoEnabled: !state.orthoEnabled })),

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
            entities: JSON.parse(JSON.stringify(state.entities)),
            description
        }],
        redoStack: [] // Clear redo on new action
    })),

    undo: () => set(state => {
        if (state.undoStack.length === 0) return state;

        const prev = state.undoStack[state.undoStack.length - 1];
        return {
            entities: prev.entities,
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, {
                entities: JSON.parse(JSON.stringify(state.entities)),
                description: 'Undo'
            }]
        };
    }),

    redo: () => set(state => {
        if (state.redoStack.length === 0) return state;

        const next = state.redoStack[state.redoStack.length - 1];
        return {
            entities: next.entities,
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, {
                entities: JSON.parse(JSON.stringify(state.entities)),
                description: 'Redo'
            }]
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

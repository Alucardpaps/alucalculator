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
    createLineEntity,
    createPointEntity,
    createCircleEntity
} from '../kernel/types';
import { DEFAULT_LAYER } from '../kernel/constants';
import { Body, createBody } from '../kernel/Body';

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
    // SOLVER INTEGRATION
    // ─────────────────────────────────────────────────────────────
    sketchModel: any | null; // Typed as any to avoid circular import issues in store definition if needed, or import SketchModel
    setSketchModel: (model: any | null) => void;
    solverInterface: {
        addConstraint: (type: any, entityIds: string[], value?: number) => void;
        dragPoint: (pointId: string, newX: number, newY: number) => void;
        solve: () => void;
    } | null;
    setSolverInterface: (intf: any | null) => void;
    syncFromModel: () => void;

    // ─────────────────────────────────────────────────────────────
    // PARAMETRIC DIMENSIONS
    // ─────────────────────────────────────────────────────────────
    editDimension: (constraintId: string, newValue: number) => void;
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
    sketchModel: null,

    setSketchModel: (model) => set({ sketchModel: model }),

    solverInterface: null,
    setSolverInterface: (intf) => set({ solverInterface: intf }),

    syncFromModel: () => {
        const model = get().sketchModel;
        if (!model) return;

        // Convert model state to entities
        // We need to map model.points and model.lines to CadEntities
        // This is a simplified sync (replaces all)
        const newEntities: CadEntity[] = [];

        // Lines
        model.lines.forEach((line: any) => {
            const p1 = model.points.get(line.p1);
            const p2 = model.points.get(line.p2);
            if (p1 && p2) {
                newEntities.push(createLineEntity(
                    { x: p1.x.value, y: p1.y.value },
                    { x: p2.x.value, y: p2.y.value },
                    '0', // Layer
                    '#ffffff',
                    line.id // Use Model ID
                ));
            }
        });

        // Points
        model.points.forEach((point: any) => {
            // Only show points if they are NOT endpoints of lines? 
            // OR show all points so they can be selected for constraints.
            // Showing all points (endpoints) is crucial for "Coincident" constraint.
            newEntities.push(createPointEntity(
                point.x.value,
                point.y.value,
                '0',
                '#00ff00', // Green points
                point.id
            ));
        });

        // Constraints
        const newConstraints: Constraint[] = [];
        model.constraints.forEach((c: Constraint) => {
            newConstraints.push({ ...c });
        });

        set({ entities: newEntities, constraints: newConstraints });
    },

    addEntity: (entity) => {
        const model = get().sketchModel;

        if (model) {
            get().pushHistory('Add entity (Solver)');

            // Import to Solver
            if (entity.geometry.type === 'LINE') {
                const g = entity.geometry;
                const p1 = model.addPoint(g.start.x, g.start.y);
                const p2 = model.addPoint(g.end.x, g.end.y);
                model.addLine(p1.id, p2.id);
            }
            // Add other types here

            // Sync back to store
            get().syncFromModel();
        } else {
            // Classic Mode
            get().pushHistory('Add entity');
            set(state => ({ entities: [...state.entities, entity] }));
        }
    },

    removeEntity: (id) => {
        get().pushHistory('Remove entity');
        set(state => ({
            entities: state.entities.filter(e => e.id !== id),
            selectedIds: state.selectedIds.filter(sid => sid !== id)
        }));
    },

    updateEntity: (id, updates) => {
        set(state => ({
            entities: state.entities.map(e =>
                e.id === id ? { ...e, ...updates } : e
            )
        }));
    },

    clearEntities: () => {
        get().pushHistory('Clear all');
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
        const model = get().sketchModel;
        if (!model) return;

        // Update the constraint value in the model
        const constraint = model.constraints.get(constraintId);
        if (constraint && constraint.type === 'DISTANCE') {
            constraint.value = newValue;
            // Re-solve to update geometry
            const solver = get().solverInterface;
            if (solver) {
                solver.solve();
            }
            get().syncFromModel();
        }
    },
}));

// ═══════════════════════════════════════════════════════════════
// SELECTORS / COMPUTED HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Approximate DOF count.
 * Each point brings 2 DOF, each constraint removes ~1.
 */
export const useDOFCount = () => {
    const entities = useCadStore(s => s.entities);
    const constraints = useCadStore(s => s.constraints);
    const pointCount = entities.filter(e => e.geometry.type === 'POINT').length;
    const activeConstraints = constraints.filter(c => c.active).length;
    return Math.max(0, pointCount * 2 - activeConstraints);
};

export const useConstraintStatus = () => {
    const dof = useDOFCount();
    if (dof === 0) return 'FULLY_CONSTRAINED' as const;
    if (dof < 0) return 'OVER_CONSTRAINED' as const;
    return 'UNDER_CONSTRAINED' as const;
};

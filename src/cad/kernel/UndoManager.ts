/**
 * AluCAD — Undo Manager (Command Pattern)
 * 
 * Every state-mutating operation is wrapped in an UndoableAction.
 * Stack-based undo/redo with configurable max history depth.
 * 
 * Integration:
 *   - cadStore actions call UndoManager.execute(action)
 *   - Ctrl+Z → UndoManager.undo()
 *   - Ctrl+Y / Ctrl+Shift+Z → UndoManager.redo()
 *   - Future: feeds into parametric rebuild tree
 */

import type { CadEntity } from '../kernel/types';
import type { Constraint } from '../constraints/types';

// ============================================
// TYPES
// ============================================

export interface UndoableAction {
    /** Human-readable description for UI */
    description: string;
    /** Perform the action */
    execute: () => void;
    /** Reverse the action */
    undo: () => void;
}

/** Snapshot of full CAD state (for chunked undo) */
export interface StateSnapshot {
    entities: CadEntity[];
    constraints: Constraint[];
    timestamp: number;
    description: string;
}

// ============================================
// UNDO MANAGER
// ============================================

export class UndoManager {
    private undoStack: StateSnapshot[] = [];
    private redoStack: StateSnapshot[] = [];
    private maxHistory: number;
    private stateProvider: (() => { entities: CadEntity[]; constraints: Constraint[] }) | null = null;
    private stateRestorer: ((snapshot: StateSnapshot) => void) | null = null;

    constructor(maxHistory = 50) {
        this.maxHistory = maxHistory;
    }

    /**
     * Connect the undo manager to the store.
     * stateProvider: returns current entities + constraints
     * stateRestorer: applies a snapshot back to the store
     */
    connect(
        stateProvider: () => { entities: CadEntity[]; constraints: Constraint[] },
        stateRestorer: (snapshot: StateSnapshot) => void
    ): void {
        this.stateProvider = stateProvider;
        this.stateRestorer = stateRestorer;
    }

    /**
     * Record current state before a mutation.
     * Call this BEFORE applying changes.
     */
    recordBeforeMutation(description: string): void {
        if (!this.stateProvider) return;

        const state = this.stateProvider();
        const snapshot: StateSnapshot = {
            entities: deepCloneEntities(state.entities),
            constraints: deepCloneConstraints(state.constraints),
            timestamp: Date.now(),
            description,
        };

        this.undoStack.push(snapshot);

        // Cap history
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        // Clear redo stack on new action
        this.redoStack = [];
    }

    /**
     * Undo the last action.
     */
    undo(): string | null {
        if (this.undoStack.length === 0 || !this.stateProvider || !this.stateRestorer) {
            return null;
        }

        // Save current state to redo stack
        const currentState = this.stateProvider();
        const currentSnapshot: StateSnapshot = {
            entities: deepCloneEntities(currentState.entities),
            constraints: deepCloneConstraints(currentState.constraints),
            timestamp: Date.now(),
            description: 'redo',
        };
        this.redoStack.push(currentSnapshot);

        // Pop and restore
        const snapshot = this.undoStack.pop()!;
        this.stateRestorer(snapshot);

        return snapshot.description;
    }

    /**
     * Redo the last undone action.
     */
    redo(): string | null {
        if (this.redoStack.length === 0 || !this.stateProvider || !this.stateRestorer) {
            return null;
        }

        // Save current state to undo stack
        const currentState = this.stateProvider();
        const currentSnapshot: StateSnapshot = {
            entities: deepCloneEntities(currentState.entities),
            constraints: deepCloneConstraints(currentState.constraints),
            timestamp: Date.now(),
            description: 'undo',
        };
        this.undoStack.push(currentSnapshot);

        // Pop and restore
        const snapshot = this.redoStack.pop()!;
        this.stateRestorer(snapshot);

        return snapshot.description;
    }

    /**
     * Check if undo is available.
     */
    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available.
     */
    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Get history descriptions (most recent first).
     */
    getHistory(): string[] {
        return [...this.undoStack].reverse().map(s => s.description);
    }

    /**
     * Clear all history.
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}

// ============================================
// DEEP CLONE HELPERS
// ============================================

function deepCloneEntities(entities: CadEntity[]): CadEntity[] {
    return entities.map(e => {
        const cloned = { ...e, geometry: { ...e.geometry } } as CadEntity;
        if (cloned.geometry.type === 'POLYLINE') {
            cloned.geometry = {
                ...cloned.geometry,
                vertices: cloned.geometry.vertices.map(v => ({ ...v })),
            };
        }
        if (cloned.geometry.type === 'LINE') {
            cloned.geometry = {
                ...cloned.geometry,
                start: { ...cloned.geometry.start },
                end: { ...cloned.geometry.end },
            };
        }
        if (cloned.geometry.type === 'CIRCLE') {
            cloned.geometry = {
                ...cloned.geometry,
                center: { ...cloned.geometry.center },
            };
        }
        if (cloned.geometry.type === 'ARC') {
            cloned.geometry = {
                ...cloned.geometry,
                center: { ...cloned.geometry.center },
            };
        }
        if (cloned.geometry.type === 'DIMENSION') {
            cloned.geometry = {
                ...cloned.geometry,
                start: { ...cloned.geometry.start },
                end: { ...cloned.geometry.end },
                textPoint: { ...cloned.geometry.textPoint },
            };
        }
        return cloned;
    });
}

function deepCloneConstraints(constraints: Constraint[]): Constraint[] {
    return constraints.map(c => ({
        ...c,
        entityIds: [...c.entityIds],
    }));
}

// ============================================
// SINGLETON
// ============================================

export const undoManager = new UndoManager();

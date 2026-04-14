/**
 * store/historyStore.ts
 * 
 * Modular Command pattern for Undo/Redo operations across the UDA.
 * Stores deep copies or diff snapshots of project states.
 */

import { create } from 'zustand';

export interface CommandMutation {
    id: string;
    description: string;
    undo: () => void;
    redo: () => void;
    timestamp: number;
}

interface HistoryState {
    past: CommandMutation[];
    future: CommandMutation[];

    executeCommand: (cmd: CommandMutation) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    past: [],
    future: [],

    executeCommand: (cmd: CommandMutation) => {
        // Run the action
        cmd.redo();

        // Push to past, clear future
        set(state => ({
            past: [...state.past, cmd],
            future: []
        }));
    },

    undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;

        const cmd = past[past.length - 1];
        cmd.undo();

        set({
            past: past.slice(0, past.length - 1),
            future: [cmd, ...future]
        });
    },

    redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const cmd = future[0];
        cmd.redo();

        set({
            past: [...past, cmd],
            future: future.slice(1)
        });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    clear: () => set({ past: [], future: [] })
}));

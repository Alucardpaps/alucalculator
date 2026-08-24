/**
 * ui/taskbar/TaskbarAPI.ts
 * 
 * Provides an interface for modules to interact with the OS Taskbar.
 * Allows setting badges, progress indicators, or flashing alerts.
 */

export interface TaskbarState {
    progress?: number; // 0-100
    badge?: string; // e.g. "3" or "!"
    isFlashing?: boolean;
}

export class TaskbarAPI {
    private static _states: Map<string, TaskbarState> = new Map();
    private static _listeners: Set<() => void> = new Set();

    /**
     * Updates the taskbar state for a specific window/module
     */
    static setState(windowId: string, state: TaskbarState) {
        this._states.set(windowId, { ...this.getState(windowId), ...state });
        this.notify();
    }

    /**
     * Retrieves the current taskbar state for a window
     */
    static getState(windowId: string): TaskbarState {
        return this._states.get(windowId) || {};
    }

    /**
     * Subscribe to state changes (Used by the Taskbar UI component)
     */
    static subscribe(listener: () => void) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    private static notify() {
        this._listeners.forEach(l => l());
    }
}

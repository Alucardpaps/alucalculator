/**
 * engine/os/WindowAPI.ts
 * 
 * Provides an encapsulated API for interacting with the AluCalc UDA window manager (`osStore`).
 * This insulates modules from the Zustand store's internals, guaranteeing a stable contract.
 * 
 * Usage:
 * const api = new WindowAPI('my-window-id');
 * api.setTitle('New Status');
 */

import { useOSStore } from '@/store/osStore';

export class WindowAPI {
    private _windowId: string;

    constructor(windowId: string) {
        this._windowId = windowId;
    }

    /** Focuses this window, bringing it to the front */
    focus() {
        useOSStore.getState().focusWindow(this._windowId);
    }

    /** Minimizes this window to the Taskbar */
    minimize() {
        useOSStore.getState().minimizeWindow(this._windowId);
    }

    /** Restores this window from the minimized state */
    restore() {
        useOSStore.getState().restoreWindow(this._windowId);
    }

    /** Toggles the maximize state of this window */
    toggleMaximize() {
        useOSStore.getState().toggleMaximize(this._windowId);
    }

    /** Closes this window entirely */
    close() {
        useOSStore.getState().closeWindow(this._windowId);
    }

    /** Updates properties dynamically if needed in future (e.g. title) */
    // setTitle(title: string) { ... }
}

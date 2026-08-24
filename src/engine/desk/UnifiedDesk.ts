/**
 * engine/desk/UnifiedDesk.ts
 * 
 * Provides an encapsulated API for interacting with the AluCalc UDA Unified Desk.
 * Modules can read the current active project, switch workspaces, and access global layers.
 */

import { useOSStore } from '@/store/osStore';

export class UnifiedDeskAPI {
    /** 
     * Switches the global OS workspace mode 
     */
    static setWorkspaceMode(mode: 'cad' | 'flow' | 'cam' | 'desk' | 'fea' | 'mechanical' | 'civil' | 'electrical' | 'science' | 'finance' | 'software') {
        useOSStore.getState().setWorkspaceMode(mode);
    }

    /** 
     * Retrieves the current workspace mode 
     */
    static getWorkspaceMode() {
        return useOSStore.getState().workspaceMode;
    }

    /**
     * Gets the full active project reference (Stub for future ProjectStore integration)
     */
    static getActiveProject() {
        // Implementation will hook into store/projectStore.ts
        console.warn('[UnifiedDeskAPI] getActiveProject not fully implemented. Returning null.');
        return null;
    }

    /**
     * Opens a specific module globally (e.g. from the ribbon or command palette)
     */
    static openModule(moduleType: string) {
        useOSStore.getState().openWindow(moduleType as any);
    }
}

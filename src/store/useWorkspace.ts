import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Workspace Store
 * Manages the global state of the engineering workspace, including 
 * current project, active calculation, and change tracking.
 */

interface WorkspaceState {
    currentProjectId: string | null;
    currentCalculationId: string | null;
    unsavedChanges: boolean;
    
    // Actions
    setCurrentProject: (id: string | null) => void;
    setCurrentCalculation: (id: string | null) => void;
    setUnsavedChanges: (hasChanges: boolean) => void;
    resetWorkspace: () => void;
}

export const useWorkspace = create<WorkspaceState>()(
    persist(
        (set) => ({
            currentProjectId: null,
            currentCalculationId: null,
            unsavedChanges: false,

            setCurrentProject: (id) => set({ currentProjectId: id, unsavedChanges: false }),
            setCurrentCalculation: (id) => set({ currentCalculationId: id, unsavedChanges: false }),
            setUnsavedChanges: (hasChanges) => set({ unsavedChanges: hasChanges }),
            resetWorkspace: () => set({ 
                currentProjectId: null, 
                currentCalculationId: null, 
                unsavedChanges: false 
            }),
        }),
        {
            name: 'alucalc-workspace-storage',
        }
    )
);

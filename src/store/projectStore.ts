import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModuleType } from '@/config/modules';

// ============================================
// Types
// ============================================

export type ModuleInstanceId = string;
export type VariableId = string;

export interface ModuleVariable {
    id: VariableId;
    name: string;
    value: number | null;
    unit?: string;
    linkedFrom?: {
        sourceModuleId: ModuleInstanceId;
        sourceVariableId: VariableId;
    };
}

export interface ModuleData {
    id: ModuleInstanceId;
    type: ModuleType;
    name: string;
    inputs: Record<string, ModuleVariable>;
    outputs: Record<string, ModuleVariable>;
    position?: { x: number; y: number };
}

export interface ProjectData {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    modules: Record<string, ModuleData>; // Map id -> data
    moduleOrder: string[]; // Order of module ids
}

// ============================================
// Store Interface
// ============================================

interface ProjectState {
    currentProject: ProjectData | null;
    savedProjects: Record<string, ProjectData>; // Map id -> project
}

interface ProjectActions {
    createProject: (name: string) => void;
    loadProject: (id: string) => void;
    saveCurrentProject: () => void;
    deleteProject: (id: string) => void;
    addModule: (type: ModuleType) => void;
    removeModule: (id: string) => void;
    updateModuleData: (id: string, data: Partial<ModuleData>) => void;
    linkVariable: (targetModId: string, targetVarId: string, sourceModId: string, sourceVarId: string) => void;
    unlinkVariable: (targetModId: string, targetVarId: string) => void;
}

// ============================================
// Store Implementation
// ============================================

export const useProjectStore = create<ProjectState & ProjectActions>()(
    persist(
        (set, get) => ({
            currentProject: null,
            savedProjects: {},

            createProject: (name: string) => {
                const newProject: ProjectData = {
                    id: crypto.randomUUID(),
                    name,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    modules: {},
                    moduleOrder: []
                };
                set({ currentProject: newProject });
                // Auto-save immediately
                get().saveCurrentProject();
            },

            loadProject: (id: string) => {
                const project = get().savedProjects[id];
                if (project) {
                    set({ currentProject: { ...project } });
                }
            },

            saveCurrentProject: () => {
                const { currentProject, savedProjects } = get();
                if (currentProject) {
                    const updated = { ...currentProject, updatedAt: Date.now() };
                    set({
                        currentProject: updated,
                        savedProjects: {
                            ...savedProjects,
                            [updated.id]: updated
                        }
                    });
                }
            },

            deleteProject: (id: string) => {
                const { savedProjects, currentProject } = get();
                const newSaved = { ...savedProjects };
                delete newSaved[id];

                set({
                    savedProjects: newSaved,
                    currentProject: currentProject?.id === id ? null : currentProject
                });
            },

            addModule: (type: ModuleType) => {
                const { currentProject } = get();
                if (!currentProject) return;

                const moduleId = crypto.randomUUID();
                const newModule: ModuleData = {
                    id: moduleId,
                    type,
                    name: type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                    inputs: {},
                    outputs: {}
                };

                const updatedProject = {
                    ...currentProject,
                    modules: {
                        ...currentProject.modules,
                        [moduleId]: newModule
                    },
                    moduleOrder: [...currentProject.moduleOrder, moduleId],
                    updatedAt: Date.now()
                };

                set({ currentProject: updatedProject });
                get().saveCurrentProject();
            },

            removeModule: (id: string) => {
                const { currentProject } = get();
                if (!currentProject) return;

                const newModules = { ...currentProject.modules };
                delete newModules[id];

                const updatedProject = {
                    ...currentProject,
                    modules: newModules,
                    moduleOrder: currentProject.moduleOrder.filter(mId => mId !== id),
                    updatedAt: Date.now()
                };

                set({ currentProject: updatedProject });
                get().saveCurrentProject();
            },

            updateModuleData: (id: string, data: Partial<ModuleData>) => {
                const { currentProject } = get();
                if (!currentProject || !currentProject.modules[id]) return;

                const updatedModule = { ...currentProject.modules[id], ...data };
                const updatedProject = {
                    ...currentProject,
                    modules: {
                        ...currentProject.modules,
                        [id]: updatedModule
                    },
                    updatedAt: Date.now()
                };

                set({ currentProject: updatedProject });
            },

            linkVariable: (targetModId, targetVarId, sourceModId, sourceVarId) => {
                const { currentProject } = get();
                if (!currentProject) return;
                const targetMod = currentProject.modules[targetModId];
                if (!targetMod || !targetMod.inputs[targetVarId]) return;

                const updatedMod = {
                    ...targetMod,
                    inputs: {
                        ...targetMod.inputs,
                        [targetVarId]: {
                            ...targetMod.inputs[targetVarId],
                            linkedFrom: { sourceModuleId: sourceModId, sourceVariableId: sourceVarId }
                        }
                    }
                };

                set({
                    currentProject: {
                        ...currentProject,
                        modules: { ...currentProject.modules, [targetModId]: updatedMod }
                    }
                });
                get().saveCurrentProject();
            },

            unlinkVariable: (targetModId, targetVarId) => {
                const { currentProject } = get();
                if (!currentProject) return;
                const targetMod = currentProject.modules[targetModId];
                if (!targetMod || !targetMod.inputs[targetVarId]) return;

                const updatedMod = {
                    ...targetMod,
                    inputs: {
                        ...targetMod.inputs,
                        [targetVarId]: {
                            ...targetMod.inputs[targetVarId],
                            linkedFrom: undefined
                        }
                    }
                };

                set({
                    currentProject: {
                        ...currentProject,
                        modules: { ...currentProject.modules, [targetModId]: updatedMod }
                    }
                });
                get().saveCurrentProject();
            }
        }),
        {
            name: 'alucalc-projects',
            partialize: (state) => ({
                savedProjects: state.savedProjects,
            })
        }
    )
);

// ============================================
// Selectors
// ============================================

export const selectCurrentProject = (state: ProjectState) => state.currentProject;
export const selectSavedProjects = (state: ProjectState) => state.savedProjects;
export const selectModuleOrder = (state: ProjectState) => state.currentProject?.moduleOrder || [];
export const selectModules = (state: ProjectState) => state.currentProject?.modules || {};

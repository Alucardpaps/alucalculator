/**
 * AluCalc OS — Workspace Store
 * 
 * Manages workspace state, project persistence, and layout serialization.
 * Supports multiple workspaces with auto-save functionality.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface WorkspaceLayout {
    id: string;
    name: string;
    windows: WindowState[];
    flowState?: {
        nodes: any[];
        edges: any[];
    };
    createdAt: number;
    updatedAt: number;
}

export interface WindowState {
    id: string;
    moduleType: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    isMaximized: boolean;
    zIndex: number;
    metadata?: Record<string, any>;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    workspaces: WorkspaceLayout[];
    activeWorkspaceId: string;
    calculatorValues: Record<string, Record<string, number>>; // calculatorId -> values
    createdAt: number;
    updatedAt: number;
    tags?: string[];
}

interface WorkspaceState {
    // Current session
    currentProjectId: string | null;
    projects: Project[];
    recentProjects: string[]; // IDs

    // Auto-save
    isDirty: boolean;
    lastSaved: number | null;
    autoSaveEnabled: boolean;
}

interface WorkspaceActions {
    // Project CRUD
    createProject: (name: string, description?: string) => string;
    openProject: (id: string) => boolean;
    saveProject: () => void;
    deleteProject: (id: string) => void;
    duplicateProject: (id: string) => string;
    renameProject: (id: string, name: string) => void;

    // Workspace management
    createWorkspace: (name: string) => string;
    switchWorkspace: (id: string) => void;
    deleteWorkspace: (id: string) => void;
    renameWorkspace: (id: string, name: string) => void;

    // Layout persistence
    saveCurrentLayout: (windows: WindowState[], flowState?: any) => void;
    loadLayout: (workspaceId: string) => WorkspaceLayout | null;

    // Calculator values
    saveCalculatorValues: (calculatorId: string, values: Record<string, number>) => void;
    getCalculatorValues: (calculatorId: string) => Record<string, number> | null;

    // Utilities
    markDirty: () => void;
    getProject: (id: string) => Project | null;
    getCurrentProject: () => Project | null;
    getCurrentWorkspace: () => WorkspaceLayout | null;
    exportProject: (id: string) => string; // JSON
    importProject: (json: string) => string; // returns new project ID
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultWorkspace(name: string = 'Default'): WorkspaceLayout {
    return {
        id: generateId(),
        name,
        windows: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

// ============================================
// Store Implementation
// ============================================

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
    persist(
        (set, get) => ({
            // Initial state
            currentProjectId: null,
            projects: [],
            recentProjects: [],
            isDirty: false,
            lastSaved: null,
            autoSaveEnabled: true,

            // ─────────────────────────────────────
            // Project CRUD
            // ─────────────────────────────────────

            createProject: (name: string, description?: string) => {
                const defaultWorkspace = createDefaultWorkspace();
                const project: Project = {
                    id: generateId(),
                    name,
                    description,
                    workspaces: [defaultWorkspace],
                    activeWorkspaceId: defaultWorkspace.id,
                    calculatorValues: {},
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                set(state => ({
                    projects: [...state.projects, project],
                    currentProjectId: project.id,
                    recentProjects: [project.id, ...state.recentProjects.filter(id => id !== project.id)].slice(0, 10),
                    isDirty: false,
                    lastSaved: Date.now(),
                }));

                return project.id;
            },

            openProject: (id: string) => {
                const project = get().projects.find(p => p.id === id);
                if (!project) return false;

                set(state => ({
                    currentProjectId: id,
                    recentProjects: [id, ...state.recentProjects.filter(pid => pid !== id)].slice(0, 10),
                    isDirty: false,
                }));

                return true;
            },

            saveProject: () => {
                const { currentProjectId, projects } = get();
                if (!currentProjectId) return;

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === currentProjectId
                            ? { ...p, updatedAt: Date.now() }
                            : p
                    ),
                    isDirty: false,
                    lastSaved: Date.now(),
                }));
            },

            deleteProject: (id: string) => {
                set(state => ({
                    projects: state.projects.filter(p => p.id !== id),
                    currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
                    recentProjects: state.recentProjects.filter(pid => pid !== id),
                }));
            },

            duplicateProject: (id: string) => {
                const project = get().projects.find(p => p.id === id);
                if (!project) return '';

                const newProject: Project = {
                    ...project,
                    id: generateId(),
                    name: `${project.name} (Copy)`,
                    workspaces: project.workspaces.map(w => ({
                        ...w,
                        id: generateId(),
                    })),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                // Update activeWorkspaceId
                newProject.activeWorkspaceId = newProject.workspaces[0]?.id || '';

                set(state => ({
                    projects: [...state.projects, newProject],
                }));

                return newProject.id;
            },

            renameProject: (id: string, name: string) => {
                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
                    ),
                    isDirty: true,
                }));
            },

            // ─────────────────────────────────────
            // Workspace Management
            // ─────────────────────────────────────

            createWorkspace: (name: string) => {
                const { currentProjectId } = get();
                if (!currentProjectId) return '';

                const newWorkspace = createDefaultWorkspace(name);

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === currentProjectId
                            ? {
                                ...p,
                                workspaces: [...p.workspaces, newWorkspace],
                                activeWorkspaceId: newWorkspace.id,
                                updatedAt: Date.now(),
                            }
                            : p
                    ),
                    isDirty: true,
                }));

                return newWorkspace.id;
            },

            switchWorkspace: (id: string) => {
                const { currentProjectId } = get();
                if (!currentProjectId) return;

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === currentProjectId
                            ? { ...p, activeWorkspaceId: id }
                            : p
                    ),
                }));
            },

            deleteWorkspace: (id: string) => {
                const { currentProjectId, projects } = get();
                if (!currentProjectId) return;

                const project = projects.find(p => p.id === currentProjectId);
                if (!project || project.workspaces.length <= 1) return; // Keep at least one

                set(state => ({
                    projects: state.projects.map(p => {
                        if (p.id !== currentProjectId) return p;
                        const newWorkspaces = p.workspaces.filter(w => w.id !== id);
                        return {
                            ...p,
                            workspaces: newWorkspaces,
                            activeWorkspaceId: p.activeWorkspaceId === id
                                ? newWorkspaces[0]?.id || ''
                                : p.activeWorkspaceId,
                            updatedAt: Date.now(),
                        };
                    }),
                    isDirty: true,
                }));
            },

            renameWorkspace: (id: string, name: string) => {
                const { currentProjectId } = get();
                if (!currentProjectId) return;

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === currentProjectId
                            ? {
                                ...p,
                                workspaces: p.workspaces.map(w =>
                                    w.id === id ? { ...w, name, updatedAt: Date.now() } : w
                                ),
                                updatedAt: Date.now(),
                            }
                            : p
                    ),
                    isDirty: true,
                }));
            },

            // ─────────────────────────────────────
            // Layout Persistence
            // ─────────────────────────────────────

            saveCurrentLayout: (windows: WindowState[], flowState?: any) => {
                const { currentProjectId, projects } = get();
                if (!currentProjectId) return;

                const project = projects.find(p => p.id === currentProjectId);
                if (!project) return;

                set(state => ({
                    projects: state.projects.map(p => {
                        if (p.id !== currentProjectId) return p;
                        return {
                            ...p,
                            workspaces: p.workspaces.map(w =>
                                w.id === p.activeWorkspaceId
                                    ? { ...w, windows, flowState, updatedAt: Date.now() }
                                    : w
                            ),
                            updatedAt: Date.now(),
                        };
                    }),
                    isDirty: true,
                }));
            },

            loadLayout: (workspaceId: string) => {
                const project = get().getCurrentProject();
                if (!project) return null;
                return project.workspaces.find(w => w.id === workspaceId) || null;
            },

            // ─────────────────────────────────────
            // Calculator Values
            // ─────────────────────────────────────

            saveCalculatorValues: (calculatorId: string, values: Record<string, number>) => {
                const { currentProjectId } = get();
                if (!currentProjectId) return;

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === currentProjectId
                            ? {
                                ...p,
                                calculatorValues: {
                                    ...p.calculatorValues,
                                    [calculatorId]: values,
                                },
                                updatedAt: Date.now(),
                            }
                            : p
                    ),
                    isDirty: true,
                }));
            },

            getCalculatorValues: (calculatorId: string) => {
                const project = get().getCurrentProject();
                if (!project) return null;
                return project.calculatorValues[calculatorId] || null;
            },

            // ─────────────────────────────────────
            // Utilities
            // ─────────────────────────────────────

            markDirty: () => {
                set({ isDirty: true });
            },

            getProject: (id: string) => {
                return get().projects.find(p => p.id === id) || null;
            },

            getCurrentProject: () => {
                const { currentProjectId, projects } = get();
                if (!currentProjectId) return null;
                return projects.find(p => p.id === currentProjectId) || null;
            },

            getCurrentWorkspace: () => {
                const project = get().getCurrentProject();
                if (!project) return null;
                return project.workspaces.find(w => w.id === project.activeWorkspaceId) || null;
            },

            exportProject: (id: string) => {
                const project = get().projects.find(p => p.id === id);
                if (!project) return '';
                return JSON.stringify(project, null, 2);
            },

            importProject: (json: string) => {
                try {
                    const imported = JSON.parse(json) as Project;
                    const newId = generateId();
                    const newProject: Project = {
                        ...imported,
                        id: newId,
                        name: `${imported.name} (Imported)`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };

                    set(state => ({
                        projects: [...state.projects, newProject],
                    }));

                    return newId;
                } catch (e) {
                    console.error('Failed to import project:', e);
                    return '';
                }
            },
        }),
        {
            name: 'alucalc-workspace',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                projects: state.projects,
                recentProjects: state.recentProjects,
                currentProjectId: state.currentProjectId,
                autoSaveEnabled: state.autoSaveEnabled,
            }),
        }
    )
);

// ============================================
// Selectors
// ============================================

export const selectCurrentProject = (state: WorkspaceState) =>
    state.projects.find(p => p.id === state.currentProjectId) || null;

export const selectRecentProjects = (state: WorkspaceState & WorkspaceActions) =>
    state.recentProjects
        .map(id => state.getProject(id))
        .filter(Boolean) as Project[];

/**
 * AluCAD Auto-Save & Session Recovery Engine
 * 
 * Automatically captures drawing modifications into high-speed browser IndexedDB.
 * Coordinates with FileSystemAccess API for seamless disk synchronization.
 */

import { useCadStore } from '../store/cadStore';
import { useDesignStore } from '@/design-studio/designStore';
import { AluCadProjectFile, AutoSaveState, AutoSaveStatus } from './types';
import { saveAutoSaveToIndexedDb, loadAutoSaveFromIndexedDb, clearAutoSaveFromIndexedDb } from './cadIndexedDb';
import { saveProjectToLocalPc, openProjectFromLocalPc, getCurrentFileName, getCurrentFileHandle } from './localFileSystem';

class AutoSaveManager {
    private state: AutoSaveState = {
        status: 'idle',
        lastSavedTimestamp: null,
        activeFileName: null,
        hasUnsavedChanges: false,
        error: null,
    };

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private listeners: Set<(state: AutoSaveState) => void> = new Set();
    private isInitialized = false;
    private lastSavedHash = '';

    constructor() {
        // Safe check for browser environment
        if (typeof window !== 'undefined') {
            this.setupWindowListeners();
        }
    }

    private setupWindowListeners() {
        // Save immediately before tab close or refresh
        window.addEventListener('beforeunload', () => {
            if (this.state.hasUnsavedChanges) {
                this.saveNowSynchronously();
            }
        });

        // Save when user switches tab or minimizes window
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.state.hasUnsavedChanges) {
                this.performAutoSave();
            }
        });
    }

    public subscribe(listener: (state: AutoSaveState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    public getState(): AutoSaveState {
        return { ...this.state };
    }

    /**
     * Creates a full project snapshot from current 2D CAD and 3D Studio stores
     */
    public createProjectSnapshot(name?: string): AluCadProjectFile {
        const cad = useCadStore.getState();
        let designParts: any[] = [];
        let designMates: any[] = [];
        let designSubAssemblies: any[] = [];
        let projectName = name || 'AluCAD_Cizim';

        try {
            const design = useDesignStore.getState();
            if (design) {
                designParts = design.parts || [];
                designMates = design.mates || [];
                designSubAssemblies = design.subAssemblies || [];
                if (!name && design.projectName) projectName = design.projectName;
            }
        } catch {
            // Design store optional in pure 2D mode
        }

        const project: AluCadProjectFile = {
            fileType: 'ALUCAD_PROJECT',
            schemaVersion: 1,
            appName: 'AluCAD OS',
            id: `proj_${Date.now()}`,
            metadata: {
                id: `proj_${Date.now()}`,
                name: projectName,
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                units: cad.units || 'mm',
                entityCount: cad.entities?.length || 0,
                bodyCount: cad.bodies?.length || 0,
                partCount: designParts.length,
                appVersion: '5.2.0',
            },
            cad2d: {
                entities: cad.entities || [],
                layers: cad.layers || [],
                bodies: cad.bodies || [],
                constraints: cad.constraints || [],
                units: cad.units || 'mm',
                viewport: {
                    center: cad.viewport?.center || { x: 0, y: 0 },
                    zoom: cad.viewport?.zoom || 1,
                    width: cad.viewport?.width,
                    height: cad.viewport?.height,
                },
                activeLayerId: cad.activeLayerId,
            },
            design3d: (designParts.length > 0 || designSubAssemblies.length > 0) ? {
                parts: designParts,
                mates: designMates,
                subAssemblies: designSubAssemblies,
                projectName,
            } : undefined,
        };

        return project;
    }

    /**
     * Marks state dirty and triggers debounced auto-save
     */
    public triggerChange() {
        this.state.hasUnsavedChanges = true;
        this.state.status = 'modified_unsaved';
        this.notify();

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce auto-save to IndexedDB by 3 seconds
        this.debounceTimer = setTimeout(() => {
            this.performAutoSave();
        }, 3000);
    }

    /**
     * Executes auto-save to IndexedDB
     */
    public async performAutoSave(): Promise<boolean> {
        if (!this.state.hasUnsavedChanges && this.state.lastSavedTimestamp !== null) {
            return true;
        }

        this.state.status = 'saving';
        this.notify();

        try {
            const project = this.createProjectSnapshot(this.state.activeFileName || undefined);
            await saveAutoSaveToIndexedDb(project);

            this.state.status = this.state.activeFileName ? 'saved_pc_file' : 'saved_local_storage';
            this.state.lastSavedTimestamp = Date.now();
            this.state.hasUnsavedChanges = false;
            this.state.error = null;
            this.notify();
            return true;
        } catch (err: any) {
            this.state.status = 'error';
            this.state.error = err?.message || 'Otomatik kayıt başarısız oldu.';
            this.notify();
            return false;
        }
    }

    /**
     * Fallback synchronous-like quick save into localStorage during page unload
     */
    private saveNowSynchronously() {
        try {
            const project = this.createProjectSnapshot(this.state.activeFileName || undefined);
            saveAutoSaveToIndexedDb(project);
        } catch {
            // best-effort on exit
        }
    }

    /**
     * Saves project to user-selected file on Local PC (File System Access API)
     */
    public async saveToLocalPc(forcePrompt = false): Promise<boolean> {
        this.state.status = 'saving';
        this.notify();

        try {
            const project = this.createProjectSnapshot(this.state.activeFileName || undefined);
            const result = await saveProjectToLocalPc(project, { forcePrompt });

            if (result.success) {
                this.state.activeFileName = result.filename;
                this.state.lastSavedTimestamp = Date.now();
                this.state.hasUnsavedChanges = false;
                this.state.status = 'saved_pc_file';
                this.state.error = null;

                // Also update IndexedDB snapshot so session matches
                await saveAutoSaveToIndexedDb(project);
                this.notify();
                return true;
            } else {
                // User cancelled
                this.state.status = this.state.hasUnsavedChanges ? 'modified_unsaved' : 'idle';
                this.notify();
                return false;
            }
        } catch (err: any) {
            this.state.status = 'error';
            this.state.error = err?.message || 'Yerel PC dosyasına kayıt başarısız.';
            this.notify();
            return false;
        }
    }

    /**
     * Opens project file from Local PC and loads into CAD store
     */
    public async openFromLocalPc(): Promise<boolean> {
        try {
            const result = await openProjectFromLocalPc();
            if (!result) return false;

            this.loadProjectIntoCad(result.project);
            this.state.activeFileName = result.filename;
            this.state.lastSavedTimestamp = Date.now();
            this.state.hasUnsavedChanges = false;
            this.state.status = 'saved_pc_file';
            this.state.error = null;

            // Cache into IndexedDB
            await saveAutoSaveToIndexedDb(result.project);
            this.notify();
            return true;
        } catch (err: any) {
            this.state.status = 'error';
            this.state.error = err?.message || 'Dosya açılamadı.';
            this.notify();
            return false;
        }
    }

    /**
     * Checks if a previous unrecovered auto-save session exists in IndexedDB
     */
    public async checkForRecoverySession(): Promise<{
        hasSession: boolean;
        timestamp?: number;
        entityCount?: number;
        project?: AluCadProjectFile;
    }> {
        try {
            const record = await loadAutoSaveFromIndexedDb();
            if (!record || !record.project) return { hasSession: false };

            const cad = useCadStore.getState();
            let designPartCount = 0;
            try {
                designPartCount = useDesignStore.getState().parts?.length || 0;
            } catch {}

            const currentCount = (cad.entities?.length || 0) + designPartCount;
            const savedCadCount = record.project.cad2d?.entities?.length || 0;
            const saved3dCount = record.project.design3d?.parts?.length || 0;
            const totalSaved = savedCadCount + saved3dCount;

            if (totalSaved > 0 && (currentCount === 0 || totalSaved !== currentCount)) {
                return {
                    hasSession: true,
                    timestamp: record.timestamp,
                    entityCount: totalSaved,
                    project: record.project,
                };
            }

            return { hasSession: false };
        } catch {
            return { hasSession: false };
        }
    }

    /**
     * Restores an AluCadProjectFile into cadStore and designStore
     */
    public loadProjectIntoCad(project: AluCadProjectFile) {
        if (!project) return;

        // Restore 2D CAD entities if present
        if (project.cad2d) {
            const cad = useCadStore.getState();
            cad.clearEntities();

            if (project.cad2d.layers && project.cad2d.layers.length > 0) {
                useCadStore.setState({ layers: project.cad2d.layers });
            }
            if (project.cad2d.bodies && project.cad2d.bodies.length > 0) {
                useCadStore.setState({ bodies: project.cad2d.bodies });
            }
            if (project.cad2d.entities && project.cad2d.entities.length > 0) {
                cad.addEntities(project.cad2d.entities);
            }
            if (project.cad2d.constraints && project.cad2d.constraints.length > 0) {
                useCadStore.setState({ constraints: project.cad2d.constraints });
            }
            if (project.cad2d.units) {
                cad.setUnits(project.cad2d.units);
            }
            if (project.cad2d.viewport) {
                cad.updateViewport({
                    center: project.cad2d.viewport.center,
                    zoom: project.cad2d.viewport.zoom,
                });
            }
            cad.zoomExtents();
        }

        // Restore 3D Design Studio parts & sub-assemblies if present
        if (project.design3d && (Array.isArray(project.design3d.parts) || Array.isArray(project.design3d.subAssemblies))) {
            try {
                useDesignStore.setState({
                    parts: project.design3d.parts || [],
                    mates: project.design3d.mates || [],
                    subAssemblies: project.design3d.subAssemblies || [],
                    projectName: project.design3d.projectName || project.metadata?.name || 'AluCAD_Cizim',
                });
                import('@/design-studio/cadCameraDispatcher').then(({ triggerCameraView }) => {
                    triggerCameraView('fit');
                }).catch(() => {});
            } catch {
                // Ignore if 3D store is not mounted
            }
        }
    }

    /**
     * Discards auto-saved session and starts clean
     */
    public async discardAutoSaveSession() {
        await clearAutoSaveFromIndexedDb();
        this.state.hasUnsavedChanges = false;
        this.state.status = 'idle';
        this.notify();
    }
}

export const autoSaveManager = new AutoSaveManager();

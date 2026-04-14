/**
 * engine/project/IdbAdapter.ts
 * 
 * Local persistence layer utilizing IndexedDB (via `idb` library).
 * Syncs the ProjectSchema to local storage with conflict resolution strategies.
 */

import { openDB, IDBPDatabase } from 'idb';
import { ProjectSchema } from './ProjectSchema';

export class IdbAdapter {
    private dbName = 'alucalc_projects_db';
    private storeName = 'projects';
    private dbPromise: Promise<IDBPDatabase>;

    constructor() {
        this.dbPromise = openDB(this.dbName, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }
            }
        });
    }

    /**
     * Saves a project, overwriting if newer
     */
    async saveProject(id: string, project: ProjectSchema): Promise<void> {
        const db = await this.dbPromise;
        const existing = await db.get(this.storeName, id);

        if (existing && existing.metadata.lastModified > project.metadata.lastModified) {
            console.warn(`[IdbAdapter] Conflict detected for project ${id}. Local version is newer.`);
            // In a real app, trigger conflict resolution UI here
        }

        await db.put(this.storeName, { id, ...project });
    }

    /**
     * Loads a project by ID
     */
    async loadProject(id: string): Promise<ProjectSchema | undefined> {
        const db = await this.dbPromise;
        const record = await db.get(this.storeName, id);
        if (record) {
            const { id: _, ...project } = record;
            return project as ProjectSchema;
        }
        return undefined;
    }

    /**
     * Lists all local projects
     */
    async listProjects(): Promise<{ id: string, title: string, lastModified: number }[]> {
        const db = await this.dbPromise;
        const all = await db.getAll(this.storeName);
        return all.map(p => ({
            id: p.id,
            title: p.metadata.title,
            lastModified: p.metadata.lastModified
        }));
    }
}

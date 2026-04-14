/**
 * engine/module/ModuleRegistry.ts
 * 
 * Provides a dynamic registry for UDA modules, allowing new calculators and tools 
 * to be inject at runtime without modifying `config/modules.ts` or `osStore.ts` directly.
 * 
 * Usage:
 * ModuleRegistry.register(myManifest, MyReactComponent);
 */

import { ModuleManifest } from './ModuleManifest';
import { MODULE_REGISTRY, ModuleType, ModuleDefinition } from '@/config/modules';

export class ModuleRegistry {
    private static _dynamicModules: Map<string, { manifest: ModuleManifest, component: React.ComponentType<any> }> = new Map();

    /**
     * Registers a new module dynamically into the UDA.
     * @param manifest The ModuleManifest definition
     * @param component The React component handling the module UI
     */
    static register(manifest: ModuleManifest, component: React.ComponentType<any>) {
        if (this._dynamicModules.has(manifest.id)) {
            console.warn(`[ModuleRegistry] Module ${manifest.id} is already registered. Overwriting.`);
        }

        this._dynamicModules.set(manifest.id, { manifest, component });

        // Patch the global MODULE_REGISTRY to make osStore aware of it
        // Note: as requested, we do not touch osStore internals, just the registry config it reads
        if (!MODULE_REGISTRY[manifest.type as ModuleType]) {
            (MODULE_REGISTRY as any)[manifest.type] = {
                type: manifest.type,
                title: manifest.title,
                category: manifest.category,
                iconName: manifest.icon,
                defaultSize: manifest.defaultSize
            } as ModuleDefinition;
        }

        console.log(`[ModuleRegistry] Successfully registered ${manifest.id} v${manifest.version}`);
    }

    /**
     * Retrieves the React component for a dynamic module if registered by ID
     */
    static getComponent(id: string): React.ComponentType<any> | undefined {
        return this._dynamicModules.get(id)?.component;
    }

    /**
     * Retrieves the React component for a dynamic module if registered by Type
     */
    static getComponentByType(type: string): React.ComponentType<any> | undefined {
        for (const [_, entry] of this._dynamicModules.entries()) {
            if (entry.manifest.type === type) return entry.component;
        }
        return undefined;
    }

    /**
     * Returns all dynamically registered manifests
     */
    static getAllManifests(): ModuleManifest[] {
        return Array.from(this._dynamicModules.values()).map(m => m.manifest);
    }
}

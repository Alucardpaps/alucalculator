/**
 * AluCalculator — Central Engine Registry
 * 
 * Single source of truth for all registered engines.
 * Provides lookup, filtering, and introspection capabilities.
 * 
 * Design:
 * - Initialized at kernel boot (Phase 5)
 * - Immutable after boot (engines cannot be added at runtime)
 * - Supports AI SDK introspection via getAll/getByCategory
 * - Supports ReactFlow node auto-binding via manifest.tags
 */

import type {
    EngineManifest,
    EngineRegistryEntry,
    EngineCategory,
    IEngine,
} from '@/types/engine-contracts';

// ============================================
// ENGINE REGISTRY SINGLETON
// ============================================

class EngineRegistryImpl {
    private entries = new Map<string, EngineRegistryEntry>();
    private _sealed = false;

    /**
     * Register an engine with its manifest.
     * Must be called during kernel boot, before seal().
     */
    register(
        manifest: EngineManifest,
        instance?: IEngine<unknown, unknown> | null,
        loader?: () => Promise<IEngine<unknown, unknown>>
    ): void {
        if (this._sealed) {
            console.warn(`[ENGINE_REGISTRY] Registry is sealed. Cannot register '${manifest.id}' post-boot.`);
            return;
        }

        if (this.entries.has(manifest.id)) {
            console.warn(`[ENGINE_REGISTRY] Engine '${manifest.id}' already registered, skipping.`);
            return;
        }

        this.entries.set(manifest.id, {
            manifest,
            instance: instance ?? null,
            loader,
            initialized: instance !== null,
        });

        console.log(`[ENGINE_REGISTRY] ✅ Registered: ${manifest.id} v${manifest.version} [${manifest.category}]`);
    }

    /**
     * Seal the registry — no more registrations allowed.
     * Called at end of kernel boot.
     */
    seal(): void {
        this._sealed = true;
        console.log(`[ENGINE_REGISTRY] 🔒 Sealed with ${this.entries.size} engines.`);
    }

    /**
     * Check if registry is sealed.
     */
    isSealed(): boolean {
        return this._sealed;
    }

    /**
     * Get an engine entry by ID.
     */
    get(id: string): EngineRegistryEntry | undefined {
        return this.entries.get(id);
    }

    /**
     * Get an engine's manifest by ID.
     */
    getManifest(id: string): EngineManifest | undefined {
        return this.entries.get(id)?.manifest;
    }

    /**
     * Get all registered engine entries.
     */
    getAll(): EngineRegistryEntry[] {
        return Array.from(this.entries.values());
    }

    /**
     * Get all manifests (lightweight — no instances).
     */
    getAllManifests(): EngineManifest[] {
        return this.getAll().map(e => e.manifest);
    }

    /**
     * Filter engines by category.
     */
    getByCategory(category: EngineCategory): EngineRegistryEntry[] {
        return this.getAll().filter(e => e.manifest.category === category);
    }

    /**
     * Filter engines by tag (for AI introspection).
     */
    getByTag(tag: string): EngineRegistryEntry[] {
        return this.getAll().filter(e => e.manifest.tags?.includes(tag));
    }

    /**
     * Get engines eligible for worker offloading.
     */
    getWorkerEligible(): EngineRegistryEntry[] {
        return this.getAll().filter(e => e.manifest.workerEligible);
    }

    /**
     * Check if an engine is registered.
     */
    has(id: string): boolean {
        return this.entries.has(id);
    }

    /**
     * Get the total count of registered engines.
     */
    get size(): number {
        return this.entries.size;
    }

    /**
     * Lazily initialize an engine (if it has a loader).
     */
    async initialize(id: string): Promise<IEngine<unknown, unknown> | null> {
        const entry = this.entries.get(id);
        if (!entry) {
            console.error(`[ENGINE_REGISTRY] Engine '${id}' not found.`);
            return null;
        }

        if (entry.initialized && entry.instance) {
            return entry.instance;
        }

        if (!entry.loader) {
            console.warn(`[ENGINE_REGISTRY] Engine '${id}' has no loader and no instance.`);
            return null;
        }

        try {
            const instance = await entry.loader();
            entry.instance = instance;
            entry.initialized = true;
            console.log(`[ENGINE_REGISTRY] 🔧 Lazy-initialized: ${id}`);
            return instance;
        } catch (err) {
            console.error(`[ENGINE_REGISTRY] Failed to initialize '${id}':`, err);
            return null;
        }
    }

    /**
     * Debug: dump registry summary to console.
     */
    dump(): void {
        console.group('[ENGINE_REGISTRY] Registry Dump');
        console.table(
            this.getAll().map(e => ({
                id: e.manifest.id,
                version: e.manifest.version,
                category: e.manifest.category,
                workerEligible: e.manifest.workerEligible,
                initialized: e.initialized,
                standards: e.manifest.standards.join(', '),
            }))
        );
        console.groupEnd();
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const ENGINE_REGISTRY = new EngineRegistryImpl();

// ============================================
// DEFAULT ENGINE MANIFESTS
// ============================================

/**
 * Pre-configured manifests for existing engines.
 * Called during kernel boot Phase 5.
 */
export function registerDefaultEngines(): void {
    // --- MATH ENGINES ---
    ENGINE_REGISTRY.register({
        id: 'involute',
        version: '1.0.0',
        name: 'Involute Math Engine',
        description: 'True parametric involute curve generation',
        category: 'math',
        dependencies: { dependsOn: [], produces: ['involute-curve', 'gear-profile'] },
        workerEligible: false,
        standards: ['DIN 3960', 'ISO 21771'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['gear', 'curve', 'parametric'],
    });

    ENGINE_REGISTRY.register({
        id: 'gear-geometry',
        version: '1.0.0',
        name: 'Gear Geometry Engine',
        description: 'Mesh analysis, contact ratio, interference detection',
        category: 'math',
        dependencies: { dependsOn: ['involute'], produces: ['gear-mesh', 'contact-ratio'] },
        workerEligible: false,
        standards: ['ISO 6336', 'AGMA 2001'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['gear', 'mesh', 'analysis'],
    });

    ENGINE_REGISTRY.register({
        id: 'primitives',
        version: '1.0.0',
        name: 'Math Primitives',
        description: 'Core geometric types and operations',
        category: 'math',
        dependencies: { dependsOn: [], produces: ['point', 'line', 'arc', 'circle'] },
        workerEligible: false,
        standards: [],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['geometry', 'primitives'],
    });

    // --- MATERIALS ENGINE ---
    ENGINE_REGISTRY.register({
        id: 'materials',
        version: '1.0.0',
        name: 'Material Database Engine',
        description: 'Material properties lookup and comparison',
        category: 'materials',
        dependencies: { dependsOn: [], produces: ['material-props', 'density', 'yield-strength'] },
        workerEligible: false,
        standards: ['ASTM', 'EN 573', 'EN 485'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['material', 'database', 'properties'],
    });

    // --- STRUCTURE ENGINES ---
    ENGINE_REGISTRY.register({
        id: 'structural-2d',
        version: '1.0.0',
        name: 'Structural Analysis Engine',
        description: 'Beam deflection, stress analysis, section properties',
        category: 'structure',
        dependencies: { dependsOn: ['materials'], produces: ['stress-result', 'deflection-result'] },
        workerEligible: true,
        standards: ['Euler-Bernoulli', 'Timoshenko'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['beam', 'stress', 'deflection'],
    });

    ENGINE_REGISTRY.register({
        id: 'structural-3d',
        version: '1.0.0',
        name: '3D Structural Analysis Engine',
        description: 'FEA-lite 3D structural analysis with matrix solver',
        category: 'structure',
        dependencies: { dependsOn: ['materials', 'structural-2d'], produces: ['3d-stress', '3d-displacement'] },
        workerEligible: true,
        standards: ['ISO 16587'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['fea', '3d', 'matrix'],
    });

    // --- GRAPH ENGINE ---
    ENGINE_REGISTRY.register({
        id: 'graph-engine',
        version: '1.0.0',
        name: 'Computational Graph Engine',
        description: 'ReactFlow-based computational graph solver',
        category: 'graph',
        dependencies: { dependsOn: [], produces: ['graph-result'] },
        workerEligible: true,
        standards: [],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['flow', 'graph', 'solver'],
    });

    // --- EXPORT ENGINES ---
    ENGINE_REGISTRY.register({
        id: 'dxf-exporter',
        version: '1.0.0',
        name: 'DXF Exporter',
        description: 'CNC-grade AutoCAD R12 DXF export',
        category: 'export',
        dependencies: { dependsOn: ['primitives'], produces: ['dxf-file'] },
        workerEligible: false,
        standards: ['AutoCAD R12'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['export', 'dxf', 'cad'],
    });

    ENGINE_REGISTRY.register({
        id: 'step-exporter',
        version: '1.0.0',
        name: 'STEP Exporter',
        description: 'ISO-10303-21 AP214 solid body export',
        category: 'export',
        dependencies: { dependsOn: ['primitives'], produces: ['step-file'] },
        workerEligible: false,
        standards: ['ISO 10303-21', 'AP214'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['export', 'step', 'solid'],
    });

    // --- NESTING ENGINE (Worker-bound) ---
    ENGINE_REGISTRY.register({
        id: 'nesting-2d',
        version: '1.0.0',
        name: '2D Nesting Optimizer',
        description: 'Sheet metal part nesting with waste minimization',
        category: 'mechanical',
        dependencies: { dependsOn: ['materials'], produces: ['nesting-layout', 'waste-report'] },
        workerEligible: true,
        standards: [],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['nesting', 'optimization', 'sheet-metal'],
    });
    // --- AI INTELLIGENCE ENGINES ---
    ENGINE_REGISTRY.register({
        id: 'ai-materials',
        version: '1.0.0',
        name: 'AI Materials Intelligence',
        description: 'AI-driven material property prediction and verification via Materials Project',
        category: 'intelligence' as any,
        dependencies: { dependsOn: ['materials'], produces: ['ai-prop-prediction'] },
        workerEligible: false,
        standards: ['Materials Project'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['ai', 'materials', 'prediction'],
    });

    ENGINE_REGISTRY.register({
        id: 'ai-phys',
        version: '1.0.0',
        name: 'AI Physical CAS',
        description: 'Symbolic physics and structural derivation via Phys-MCP',
        category: 'intelligence' as any,
        dependencies: { dependsOn: ['structural-2d'], produces: ['symbolic-derivation'] },
        workerEligible: false,
        standards: ['CAS', 'Phys-MCP'],
        inputSchemaVersion: '1.0.0',
        preferredUnitSystem: 'SI',
        tags: ['ai', 'physics', 'symbolic'],
    });
}

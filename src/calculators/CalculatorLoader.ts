/**
 * AluCalculator V2 — Dynamic Calculator Loader
 * 
 * Performance-first lazy loading system.
 * 
 * Targets:
 * - Initial load: < 1 second
 * - Calculator load on demand: < 300ms
 * - Zero unnecessary re-renders
 */

import type { CalculatorSchemaV2, CalculatorRegistryV2 } from '@/types/calculator-schema-v2';

// ============================================
// PERFORMANCE THRESHOLDS
// ============================================

const PERFORMANCE = {
    WARN_THRESHOLD_MS: 300,
    ERROR_THRESHOLD_MS: 1000,
    CACHE_TTL_MS: 1000 * 60 * 30, // 30 minutes
};

// ============================================
// CALCULATOR LOADER CLASS
// ============================================

interface CacheEntry {
    schema: CalculatorSchemaV2;
    loadedAt: number;
    loadTimeMs: number;
}

class CalculatorLoader {
    private cache = new Map<string, CacheEntry>();
    private loadingPromises = new Map<string, Promise<CalculatorSchemaV2>>();
    private registry: CalculatorRegistryV2;

    constructor(registry: CalculatorRegistryV2) {
        this.registry = registry;
    }

    /**
     * Load a calculator schema by ID.
     * Uses caching and deduplication.
     */
    async load(id: string): Promise<CalculatorSchemaV2> {
        // Check cache first
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.loadedAt < PERFORMANCE.CACHE_TTL_MS) {
            return cached.schema;
        }

        // Deduplicate concurrent requests
        const existingPromise = this.loadingPromises.get(id);
        if (existingPromise) {
            return existingPromise;
        }

        // Validate registry entry exists
        const entry = this.registry[id];
        if (!entry) {
            throw new Error(`Calculator not found in registry: ${id}`);
        }

        // Create loading promise
        const loadPromise = this.doLoad(id, entry);
        this.loadingPromises.set(id, loadPromise);

        try {
            const schema = await loadPromise;
            return schema;
        } finally {
            this.loadingPromises.delete(id);
        }
    }

    private async doLoad(
        id: string,
        entry: CalculatorRegistryV2[string]
    ): Promise<CalculatorSchemaV2> {
        const startTime = performance.now();

        try {
            const loadedModule = await entry.loader();
            const schema = loadedModule.default;
            const loadTimeMs = performance.now() - startTime;

            // Performance monitoring
            if (loadTimeMs > PERFORMANCE.ERROR_THRESHOLD_MS) {
                console.error(
                    `[CalculatorLoader] CRITICAL: ${id} took ${loadTimeMs.toFixed(0)}ms to load (limit: ${PERFORMANCE.ERROR_THRESHOLD_MS}ms)`
                );
            } else if (loadTimeMs > PERFORMANCE.WARN_THRESHOLD_MS) {
                console.warn(
                    `[CalculatorLoader] SLOW: ${id} took ${loadTimeMs.toFixed(0)}ms to load (target: ${PERFORMANCE.WARN_THRESHOLD_MS}ms)`
                );
            }

            // Cache the result
            this.cache.set(id, {
                schema,
                loadedAt: Date.now(),
                loadTimeMs,
            });

            return schema;
        } catch (error) {
            console.error(`[CalculatorLoader] Failed to load ${id}:`, error);
            throw error;
        }
    }

    /**
     * Preload calculators for better UX.
     * Call this when user hovers over calculator card.
     */
    preload(id: string): void {
        if (this.cache.has(id)) return;
        if (this.loadingPromises.has(id)) return;

        // Start loading in background (don't await)
        this.load(id).catch(() => {
            // Silently ignore preload failures
        });
    }

    /**
     * Get metadata without loading full schema.
     */
    getMetadata(id: string) {
        const entry = this.registry[id];
        return entry?.metadata ?? null;
    }

    /**
     * List all available calculator IDs.
     */
    listAll(): string[] {
        return Object.keys(this.registry);
    }

    /**
     * Filter calculators by category.
     */
    listByCategory(category: string): string[] {
        return Object.entries(this.registry)
            .filter(([, entry]) => entry.metadata.category === category)
            .map(([id]) => id);
    }

    /**
     * Clear cache (for development/testing).
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics.
     */
    getCacheStats() {
        const entries = Array.from(this.cache.entries());
        return {
            size: entries.length,
            totalLoadTimeMs: entries.reduce((sum, [, e]) => sum + e.loadTimeMs, 0),
            avgLoadTimeMs: entries.length > 0
                ? entries.reduce((sum, [, e]) => sum + e.loadTimeMs, 0) / entries.length
                : 0,
            entries: entries.map(([id, e]) => ({
                id,
                loadTimeMs: e.loadTimeMs,
                age: Date.now() - e.loadedAt,
            })),
        };
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

let loaderInstance: CalculatorLoader | null = null;

export function getCalculatorLoader(
    registry?: CalculatorRegistryV2
): CalculatorLoader {
    if (!loaderInstance && registry) {
        loaderInstance = new CalculatorLoader(registry);
    }
    if (!loaderInstance) {
        throw new Error('CalculatorLoader not initialized. Pass registry first.');
    }
    return loaderInstance;
}

export function resetCalculatorLoader(): void {
    loaderInstance = null;
}

export { CalculatorLoader, PERFORMANCE };

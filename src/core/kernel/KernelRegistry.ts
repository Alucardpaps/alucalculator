/**
 * AluCalculator Engineering Kernel — Self-Registering Registry
 * 
 * CORE PRINCIPLE: Zero manual wiring.
 * Every calculator/engine registers itself at module load.
 * 
 * If something exists in code but not in registry → kernel failure.
 */

import type { CalculatorCategory } from '@/types/calculator-schema-v2';
import type { EngineManifest } from '@/types/engine-contracts';

// ============================================
// TYPES
// ============================================

export interface KernelModule {
    id: string;
    type: 'calculator' | 'engine' | 'exporter' | 'visualizer';
    metadata: {
        title: string;
        description: string;
        category: CalculatorCategory | 'math' | 'export' | 'graph';
        icon?: string;
        version?: string;
        standards?: string[];
        /** Enterprise engine manifest (optional, for engines with full metadata) */
        manifest?: EngineManifest;
    };
    loader?: () => Promise<{ default: unknown }>;
    instance?: unknown;
}

export interface KernelStatus {
    bootedAt: Date | null;
    moduleCount: number;
    buildId: string;
    errors: string[];
}

// ============================================
// KERNEL REGISTRY SINGLETON
// ============================================

class KernelRegistry {
    private modules = new Map<string, KernelModule>();
    private status: KernelStatus = {
        bootedAt: null,
        moduleCount: 0,
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || process.env.BUILD_ID || 'dev-local',
        errors: [],
    };
    private bootPromise: Promise<void> | null = null;

    /**
     * Register a module in the kernel
     * Called automatically by self-registering modules
     */
    register(kernelModule: KernelModule): void {
        if (this.modules.has(kernelModule.id)) {
            console.warn(`[KERNEL] Module ${kernelModule.id} already registered, skipping`);
            return;
        }
        this.modules.set(kernelModule.id, kernelModule);
        this.status.moduleCount = this.modules.size;
        console.log(`[KERNEL] ✅ Registered: ${kernelModule.id} (${kernelModule.type})`);
    }

    /**
     * Unregister a module (for hot reload)
     */
    unregister(id: string): boolean {
        const result = this.modules.delete(id);
        this.status.moduleCount = this.modules.size;
        return result;
    }

    /**
     * Get all registered modules
     */
    getAll(): KernelModule[] {
        return Array.from(this.modules.values());
    }

    /**
     * Get modules by type
     */
    getByType(type: KernelModule['type']): KernelModule[] {
        return this.getAll().filter(m => m.type === type);
    }

    /**
     * Get modules by category
     */
    getByCategory(category: string): KernelModule[] {
        return this.getAll().filter(m => m.metadata.category === category);
    }

    /**
     * Get a specific module by ID
     */
    getById(id: string): KernelModule | undefined {
        return this.modules.get(id);
    }

    /**
     * Check if a module exists
     */
    has(id: string): boolean {
        return this.modules.has(id);
    }

    /**
     * Get kernel status
     */
    getStatus(): KernelStatus {
        return { ...this.status };
    }

    /**
     * Mark kernel as booted
     */
    markBooted(): void {
        this.status.bootedAt = new Date();
    }

    /**
     * Log error
     */
    logError(error: string): void {
        this.status.errors.push(error);
        console.error(`[KERNEL] ❌ ${error}`);
    }

    /**
     * Get boot promise (for awaiting boot completion)
     */
    getBootPromise(): Promise<void> | null {
        return this.bootPromise;
    }

    /**
     * Set boot promise
     */
    setBootPromise(promise: Promise<void>): void {
        this.bootPromise = promise;
    }

    /**
     * Expose to window for debugging
     */
    exposeGlobals(): void {
        if (typeof window !== 'undefined') {
            (window as any).__KERNEL__ = this;
            (window as any).__KERNEL_MODULES__ = this.getAll();
            (window as any).__BUILD_ID__ = this.status.buildId;
            console.log('[KERNEL] 🔧 Exposed to window.__KERNEL__');
        }
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const KERNEL = new KernelRegistry();

// ============================================
// REGISTRATION HELPERS
// ============================================

/**
 * Helper to create and register a calculator module
 */
export function registerCalculator(
    id: string,
    metadata: KernelModule['metadata'],
    loader: () => Promise<{ default: unknown }>
): void {
    KERNEL.register({
        id,
        type: 'calculator',
        metadata,
        loader,
    });
}

/**
 * Helper to register an engine module
 */
export function registerEngine(
    id: string,
    metadata: Omit<KernelModule['metadata'], 'category'>,
    instance: unknown
): void {
    KERNEL.register({
        id,
        type: 'engine',
        metadata: { ...metadata, category: 'math' },
        instance,
    });
}

/**
 * Helper to register an exporter module
 */
export function registerExporter(
    id: string,
    metadata: Omit<KernelModule['metadata'], 'category'>,
    instance: unknown
): void {
    KERNEL.register({
        id,
        type: 'exporter',
        metadata: { ...metadata, category: 'export' },
        instance,
    });
}

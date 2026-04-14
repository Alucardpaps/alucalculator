/**
 * AluCalculator Engineering Kernel — Boot System
 * 
 * Auto-discovery of all calculators and engines.
 * Zero manual wiring required.
 * 
 * New files automatically become discoverable.
 */

import { KERNEL, registerCalculator, registerEngine, registerExporter } from './KernelRegistry';
import { ENGINE_REGISTRY, registerDefaultEngines } from '@/engine/engineRegistry';
import { validateDependencyGraph } from '@/engine/dependencyResolver';
import { initializeTelemetry } from '@/system/telemetryStore';
import { EVENT_BUS, EVENT_TYPES } from '@/system/eventBus';

// ============================================
// STATIC REGISTRATION (MIGRATION BRIDGE)
// ============================================

/**
 * Register calculators from the existing registry-v2.ts
 * This provides backward compatibility during migration
 */
async function registerLegacyCalculators(): Promise<void> {
    const { CALCULATOR_REGISTRY_V2 } = await import('@/calculators/registry-v2');

    for (const [id, entry] of Object.entries(CALCULATOR_REGISTRY_V2)) {
        registerCalculator(id, entry.metadata, entry.loader);
    }
}

/**
 * Register math engines
 */
function registerMathEngines(): void {
    const engines = [
        { id: 'involute', title: 'Involute Math Engine', standards: ['DIN 3960', 'ISO 21771'] },
        { id: 'gear-geometry', title: 'Gear Geometry Engine', standards: ['ISO 6336', 'AGMA 2001'] },
        { id: 'primitives', title: 'Math Primitives', standards: [] }
    ];

    engines.forEach(e => {
        registerEngine(e.id, {
            title: e.title,
            description: `${e.title} Description Placeholder`,
            version: '1.0.0',
            standards: e.standards,
        }, null);
    });
}

/**
 * Register export engines
 */
function registerExportEngines(): void {
    // DXF exporter
    registerExporter('dxf', {
        title: 'DXF Exporter',
        description: 'CNC-grade AutoCAD R12 DXF export',
        version: '1.0.0',
    }, null);

    // STEP exporter
    registerExporter('step', {
        title: 'STEP Exporter',
        description: 'ISO-10303-21 AP214 solid body export',
        version: '1.0.0',
    }, null);
}

/**
 * Register graph engine nodes
 */
function registerGraphNodes(): void {
    const graphNodes = [
        { id: 'node-gear', title: 'Gear Node', description: 'Involute spur gear calculation' },
        { id: 'node-shaft', title: 'Shaft Node', description: 'Shaft sizing based on torque' },
        { id: 'node-bearing', title: 'Bearing Node', description: 'Bearing life calculation' },
    ];

    graphNodes.forEach(node => {
        KERNEL.register({
            id: node.id,
            type: 'engine',
            metadata: {
                title: node.title,
                description: node.description,
                category: 'graph',
            },
        });
    });
}

// ============================================
// BOOT FUNCTION
// ============================================

let booted = false;

/**
 * Boot the engineering kernel
 * Discovers and registers all modules
 */
export async function bootKernel(): Promise<void> {
    if (booted) {
        console.log('[KERNEL] Already booted, skipping');
        return;
    }

    const existingPromise = KERNEL.getBootPromise();
    if (existingPromise) {
        return existingPromise;
    }

    const bootPromise = (async () => {
        console.log('[KERNEL] 🚀 Booting Engineering Kernel...');
        const startTime = performance.now();

        try {
            // Phase 0: Boot Engineering OS Kernel (The Constitution)
            console.log('[KERNEL] 🏛️ Phase 0: Booting Engineering OS Kernel...');
            const { bootstrapRegistry } = await import('@/lib/init');
            bootstrapRegistry();

            // Phase 1: Register legacy calculators
            console.log('[KERNEL] Phase 1: Loading calculators...');
            await registerLegacyCalculators();

            // Phase 2: Register math engines
            console.log('[KERNEL] Phase 2: Registering math engines...');
            registerMathEngines();

            // Phase 3: Register export engines
            console.log('[KERNEL] Phase 3: Registering export engines...');
            registerExportEngines();

            // Phase 4: Register graph nodes
            console.log('[KERNEL] Phase 4: Registering graph nodes...');
            registerGraphNodes();

            // Phase 5: Initialize Engine Registry with manifests
            console.log('[KERNEL] Phase 5: Initializing Engine Registry...');
            registerDefaultEngines();
            const depValidation = validateDependencyGraph();
            if (depValidation.hasCycles) {
                KERNEL.logError(`Dependency cycle detected: ${depValidation.cycleParticipants.join(' → ')}`);
            }
            ENGINE_REGISTRY.seal();
            console.log(`[KERNEL] 📋 Engine Registry: ${ENGINE_REGISTRY.size} engines registered`);

            // Phase 6: Initialize Telemetry & Event Bus
            console.log('[KERNEL] Phase 6: Initializing Telemetry & Event Bus...');
            initializeTelemetry();

            // INVARIANT CHECK: If we got here but nothing registered, something is broken
            const registeredCount = KERNEL.getAll().length;
            if (registeredCount === 0) {
                KERNEL.logError('INVARIANT VIOLATION: Modules imported but none registered. Self-registration failure.');
                throw new Error('Kernel boot failed: No modules registered');
            }

            // Mark as booted
            KERNEL.markBooted();
            booted = true;

            const elapsed = (performance.now() - startTime).toFixed(0);
            const status = KERNEL.getStatus();

            console.log(`[KERNEL] ✅ Boot complete in ${elapsed}ms`);
            console.log(`[KERNEL] 📦 Modules: ${status.moduleCount}`);
            console.log(`[KERNEL] 🏷️ Build: ${status.buildId}`);
            console.log(`[KERNEL] 🔧 Engines: ${ENGINE_REGISTRY.size}`);

            // Expose to window for debugging
            KERNEL.exposeGlobals();

            // Emit kernel booted event
            EVENT_BUS.emit({
                type: EVENT_TYPES.KERNEL_BOOTED,
                payload: { modules: status.moduleCount, engines: ENGINE_REGISTRY.size, elapsed },
                sourceModule: 'kernel',
            });

        } catch (error) {
            KERNEL.logError(`Boot failed: ${error}`);
            throw error;
        }
    })();

    KERNEL.setBootPromise(bootPromise);
    return bootPromise;
}

/**
 * Get boot status
 */
export function isKernelBooted(): boolean {
    return booted;
}

/**
 * Force reboot (for development)
 */
export async function rebootKernel(): Promise<void> {
    booted = false;
    return bootKernel();
}

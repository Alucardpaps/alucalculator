/**
 * AluCalculator Engineering Kernel — Index
 */

// --- Core Kernel ---
export { KERNEL, registerCalculator, registerEngine, registerExporter } from './KernelRegistry';
export type { KernelModule, KernelStatus } from './KernelRegistry';
export { bootKernel, isKernelBooted, rebootKernel } from './boot';

// --- Engine Infrastructure ---
export { ENGINE_REGISTRY, registerDefaultEngines } from '@/engine/engineRegistry';
export { resolveDependencies, resolveMultipleDependencies, validateDependencyGraph, getDependents } from '@/engine/dependencyResolver';
export { executeEngine, setTelemetryRecorder } from '@/runtime/engineRunner';
export type { ExecuteOptions } from '@/runtime/engineRunner';
export { shouldUseWorker, executeInWorker, terminateAllWorkers } from '@/runtime/workerRouter';
export { useTelemetryStore, initializeTelemetry } from '@/system/telemetryStore';
export { EVENT_BUS, EVENT_TYPES } from '@/system/eventBus';
export type { SystemEvent, EventHandler } from '@/system/eventBus';


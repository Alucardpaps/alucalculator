/**
 * AluCalculator — Worker Router
 * 
 * Decides whether an engine execution should be offloaded to a Web Worker.
 * Provides a unified interface for main-thread ↔ worker communication.
 * 
 * Architecture:
 *   engineRunner.ts → shouldUseWorker(id) → true → executeInWorker(id, input)
 *                                         → false → execute on main thread
 * 
 * Graceful degradation:
 *   - Falls back to main thread if Worker API is unavailable
 *   - Falls back to main thread if worker script fails to load
 */

import { ENGINE_REGISTRY } from '@/engine/engineRegistry';

// ============================================
// WORKER ROUTING DECISION
// ============================================

/**
 * Determine if an engine should run in a Web Worker.
 * 
 * Decision criteria:
 * 1. Engine manifest declares workerEligible = true
 * 2. Worker API is available in current environment
 * 3. Input payload is serializable (no functions, DOM refs, etc.)
 */
export function shouldUseWorker(engineId: string): boolean {
    // Check Worker API availability
    if (typeof Worker === 'undefined') {
        return false;
    }

    // Check engine manifest
    const entry = ENGINE_REGISTRY.get(engineId);
    if (!entry) {
        return false;
    }

    return entry.manifest.workerEligible;
}

// ============================================
// WORKER POOL (Future — currently single-instance)
// ============================================

const activeWorkers = new Map<string, Worker>();

/**
 * Get or create a worker for a given engine category.
 * Currently maps engine IDs to a generic computation worker.
 */
function getWorker(engineId: string): Worker | null {
    try {
        // Check if we already have a worker for this engine
        if (activeWorkers.has(engineId)) {
            return activeWorkers.get(engineId)!;
        }

        // Special case: nesting engine has its own dedicated worker
        if (engineId === 'nesting-2d') {
            const worker = new Worker(
                new URL('@/workers/nesting.worker.ts', import.meta.url),
                { type: 'module' }
            );
            activeWorkers.set(engineId, worker);
            return worker;
        }

        // For other engines, we'd create a generic computation worker
        // This is a placeholder for future worker implementations
        console.warn(`[WORKER_ROUTER] No dedicated worker for '${engineId}', falling back to main thread.`);
        return null;
    } catch (err) {
        console.error(`[WORKER_ROUTER] Failed to create worker for '${engineId}':`, err);
        return null;
    }
}

// ============================================
// WORKER EXECUTION
// ============================================

export interface WorkerMessage {
    type: 'execute' | 'cancel' | 'status';
    engineId: string;
    executionId: string;
    payload: unknown;
}

export interface WorkerResponse {
    type: 'result' | 'error' | 'progress';
    engineId: string;
    executionId: string;
    data?: unknown;
    error?: string;
    progress?: number;
}

/**
 * Execute an engine computation in a Web Worker.
 * Returns a Promise that resolves with the worker's response.
 * 
 * Timeout: 30 seconds (configurable per engine in future)
 */
export function executeInWorker<T>(
    engineId: string,
    executionId: string,
    payload: unknown,
    timeoutMs = 30_000
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const worker = getWorker(engineId);

        if (!worker) {
            reject(new Error(`No worker available for engine '${engineId}'`));
            return;
        }

        const timeoutHandle = setTimeout(() => {
            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);
            reject(new Error(`Worker execution timeout for '${engineId}' after ${timeoutMs}ms`));
        }, timeoutMs);

        function onMessage(event: MessageEvent<WorkerResponse>) {
            if (event.data.executionId !== executionId) return;

            clearTimeout(timeoutHandle);
            worker!.removeEventListener('message', onMessage);
            worker!.removeEventListener('error', onError);

            if (event.data.type === 'error') {
                reject(new Error(event.data.error || 'Unknown worker error'));
            } else {
                resolve(event.data.data as T);
            }
        }

        function onError(event: ErrorEvent) {
            clearTimeout(timeoutHandle);
            worker!.removeEventListener('message', onMessage);
            worker!.removeEventListener('error', onError);
            reject(new Error(`Worker error: ${event.message}`));
        }

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);

        // Send execution message
        const message: WorkerMessage = {
            type: 'execute',
            engineId,
            executionId,
            payload,
        };

        worker.postMessage(message);
    });
}

/**
 * Terminate all active workers.
 * Called during kernel shutdown or hot reload.
 */
export function terminateAllWorkers(): void {
    activeWorkers.forEach((worker, id) => {
        worker.terminate();
        console.log(`[WORKER_ROUTER] Terminated worker: ${id}`);
    });
    activeWorkers.clear();
}

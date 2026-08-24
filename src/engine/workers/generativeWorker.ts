/**
 * engine/workers/generativeWorker.ts
 * 
 * WebWorker for Topology Optimization.
 * Uses a heuristic material removal algorithm (BESO inspired mock).
 */

const ctx: Worker = self as any;

interface GenRequest {
    type: 'START_OPTIMIZATION';
    targetVolumeFraction: number;
    maxIterations: number;
    initialVolume: number;
}

ctx.addEventListener('message', (event: MessageEvent<GenRequest>) => {
    const { type, targetVolumeFraction, maxIterations, initialVolume } = event.data;

    if (type === 'START_OPTIMIZATION') {
        let currentIt = 0;
        let currentVolume = initialVolume;

        // Mock iterative process
        const interval = setInterval(() => {
            currentIt++;

            // Remove 5% volume each iteration towards target
            const reduction = (currentVolume - (initialVolume * targetVolumeFraction)) * 0.15;
            currentVolume -= Math.max(0, reduction);

            // Report progress
            ctx.postMessage({
                type: 'PROGRESS',
                iteration: currentIt,
                currentVolume,
                progressPercent: Math.min(100, Math.round((currentIt / maxIterations) * 100))
            });

            if (currentIt >= maxIterations || currentVolume <= initialVolume * targetVolumeFraction) {
                clearInterval(interval);
                ctx.postMessage({
                    type: 'COMPLETE',
                    finalVolume: currentVolume,
                    optimizedMeshUrl: 'mock-geometry-blob-url', // In reality, serializes new CAD entities
                    success: true
                });
            }
        }, 150); // Simulate heavy compute time per iteration
    }
});

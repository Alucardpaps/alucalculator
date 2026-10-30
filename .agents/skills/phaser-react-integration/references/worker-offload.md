# WebWorker Offloading (SBTD approach)

For complex simulations (Factorio-style conveyor belts, thousands of enemy AI agents):

1. Create `aluForgeWorker.ts`.
2. Do **not** pass DOM elements to the worker.
3. Post state arrays `[id, x, y, hp]` via `postMessage`.
4. Update Phaser sprites in `scene.update()` based on the worker messages.

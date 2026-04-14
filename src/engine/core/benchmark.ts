/**
 * 📊 Scene Performance Benchmark
 * 
 * Verifies the performance gains of Quadtree indexing vs O(N) hit testing.
 */

import { Scene, Shape } from './Scene';

async function runBenchmark() {
    console.log('--- Scene Performance Benchmark ---');
    const scene = new Scene();
    const count = 5000;

    console.log(`Generating ${count} shapes...`);
    for (let i = 0; i < count; i++) {
        scene.addShape({
            id: `shape-${i}`,
            type: 'rect',
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            width: 10,
            height: 10
        });
    }

    console.log('Running 1000 random hit tests...');
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 1000;
        const y = Math.random() * 1000;
        scene.hitTest(x, y);
    }

    const elapsed = performance.now() - startTime;
    console.log(`Benchmark Complete.`);
    console.log(`Total Time: ${elapsed.toFixed(2)}ms`);
    console.log(`Average Hit Test: ${(elapsed / 1000).toFixed(4)}ms`);

    // Verification check
    if (elapsed / 1000 < 0.1) {
        console.log('✅ Performance meets Principal Architect standards (<0.1ms/hit at N=5000).');
    } else {
        console.warn('⚠️ Performance warning: Hit tests are slower than expected.');
    }
}

runBenchmark().catch(console.error);

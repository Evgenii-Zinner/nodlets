import { ResourceSystem } from './public/ResourceSystem.js';

function runBenchmark() {
    const iterations = 1000;
    const nodletsCount = 5000;

    // Simulate game state
    const resources = new ResourceSystem(2000);
    resources.initGrid(5000, 5000);
    // Spawn some static resources
    for (let i = 0; i < 2000; i++) {
        resources.spawnServer(Math.random() * 5000, Math.random() * 5000, 1000, 0);
    }
    resources.activePacketCount = 30; // Simulate packets are always there
    resources.updateGrid();

    const tempNeighbors = new Int32Array(resources.maxResources);
    let frameCount = 0;

    // Unoptimized Loop (activePacketCount check which is always true)
    const unoptimizedStart = performance.now();
    for (let f = 0; f < iterations; f++) {
        for(let i = 0; i < nodletsCount; i++) {
            const cx = Math.random() * 5000;
            const cy = Math.random() * 5000;

            let packetCaught = false;
            if (resources.activePacketCount > 0) {
                const neighborCount = resources.getNeighbors(cx, cy, 30, tempNeighbors);
                for (let k = 0; k < neighborCount; k++) {
                    const resIdx = tempNeighbors[k];
                    if (resources.type[resIdx] === 2 && !packetCaught) {
                        packetCaught = true;
                    }
                }
            }
        }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    // Optimized Loop (staggered updates)
    const optimizedStart = performance.now();
    for (let f = 0; f < iterations; f++) {
        frameCount++;
        for(let i = 0; i < nodletsCount; i++) {
            const cx = Math.random() * 5000;
            const cy = Math.random() * 5000;

            let packetCaught = false;
            if ((i + frameCount) % 10 === 0) {
                const neighborCount = resources.getNeighbors(cx, cy, 30, tempNeighbors);
                for (let k = 0; k < neighborCount; k++) {
                    const resIdx = tempNeighbors[k];
                    if (resources.type[resIdx] === 2 && !packetCaught) {
                        packetCaught = true;
                    }
                }
            }
        }
    }
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`Unoptimized Time: ${unoptimizedTime.toFixed(2)} ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}% faster`);
}

runBenchmark();

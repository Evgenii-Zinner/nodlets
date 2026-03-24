import { ResourceSystem } from './public/ResourceSystem.js';

function runBenchmark() {
    const iterations = 10000;
    const nodletsCount = 5000;

    // Simulate game state
    const resources = new ResourceSystem(2000);
    resources.initGrid(5000, 5000);
    // Spawn some static resources
    for (let i = 0; i < 2000; i++) {
        resources.spawnServer(Math.random() * 5000, Math.random() * 5000, 1000, 0);
    }
    resources.updateGrid();

    const tempNeighbors = new Int32Array(resources.maxResources);

    // Unoptimized Loop
    const unoptimizedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        for(let n = 0; n < nodletsCount; n++) {
            const cx = Math.random() * 5000;
            const cy = Math.random() * 5000;

            // Simulating previous logic where it always searches
            const neighborCount = resources.getNeighbors(cx, cy, 30, tempNeighbors);
            let packetCaught = false;
            for (let k = 0; k < neighborCount; k++) {
                const resIdx = tempNeighbors[k];
                if (resources.type[resIdx] === 2 && !packetCaught) {
                    packetCaught = true;
                }
            }
        }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    // Optimized Loop
    const optimizedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        for(let n = 0; n < nodletsCount; n++) {
            const cx = Math.random() * 5000;
            const cy = Math.random() * 5000;

            // Simulating new logic with early exit
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
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`Unoptimized Time: ${unoptimizedTime.toFixed(2)} ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}% faster`);
}

runBenchmark();

function runDistanceBenchmark() {
    console.log("\n--- Distance Check Hoisting Benchmark ---");
    const iterations = 5000;
    const nodletsCount = 10000;

    const h_size = new Float32Array(100);
    h_size.fill(50);

    const dx = new Float32Array(nodletsCount);
    const dy = new Float32Array(nodletsCount);
    for(let i=0; i<nodletsCount; i++) {
        dx[i] = Math.random() * 200 - 100;
        dy[i] = Math.random() * 200 - 100;
    }

    const hubIdx = 0;

    let a_time = 0;
    let b_time = 0;

    // Unhoisted Loop
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
        for(let n = 0; n < nodletsCount; n++) {
            const dxx = dx[n];
            const dyy = dy[n];
            const distSq = dxx * dxx + dyy * dyy;

            if (distSq < h_size[hubIdx] * h_size[hubIdx]) {
                // simulate action
                let x = 1;
            }
        }
    }
    a_time = performance.now() - start;

    // Hoisted Loop
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const h_sizeSq = h_size[hubIdx] * h_size[hubIdx];
        for(let n = 0; n < nodletsCount; n++) {
            const dxx = dx[n];
            const dyy = dy[n];
            const distSq = dxx * dxx + dyy * dyy;

            if (distSq < h_sizeSq) {
                // simulate action
                let x = 1;
            }
        }
    }
    b_time = performance.now() - start;

    console.log(`Unhoisted h_size Check Time: ${a_time.toFixed(2)} ms`);
    console.log(`Hoisted h_size Check Time: ${b_time.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((a_time - b_time) / a_time * 100).toFixed(2)}% faster`);
}

runDistanceBenchmark();

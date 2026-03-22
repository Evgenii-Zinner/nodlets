import { NodletSystem } from './public/NodletSystem.js';

function runBenchmark() {
    const iterations = 1000;
    const nodletsCount = 10000;

    const nodlets = new NodletSystem(nodletsCount);
    for (let i = 0; i < nodletsCount; i++) {
        nodlets.spawn(0, 0, 0);
    }

    const unoptimizedStart = performance.now();
    for (let it = 0; it < iterations; it++) {
        for (let i = 0; i < nodlets.count; i++) {
            const cx = nodlets.posX[i];
            const cy = nodlets.posY[i];
            const state = nodlets.state[i];
            const carriedData = nodlets.carriedData[i];
            const maxCarry = nodlets.maxDataCapacity[i];
            const hubIdx = nodlets.hubId[i];
            const velX = nodlets.velX[i];
            const velY = nodlets.velY[i];
        }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    const optimizedStart = performance.now();
    for (let it = 0; it < iterations; it++) {
        const count = nodlets.count;
        const posX = nodlets.posX;
        const posY = nodlets.posY;
        const state = nodlets.state;
        const carriedData = nodlets.carriedData;
        const maxDataCapacity = nodlets.maxDataCapacity;
        const hubId = nodlets.hubId;
        const velX = nodlets.velX;
        const velY = nodlets.velY;

        for (let i = 0; i < count; i++) {
            const cx = posX[i];
            const cy = posY[i];
            const st = state[i];
            const cd = carriedData[i];
            const mc = maxDataCapacity[i];
            const hi = hubId[i];
            const vx = velX[i];
            const vy = velY[i];
        }
    }
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`Unoptimized Time: ${unoptimizedTime.toFixed(2)} ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}% faster`);
}

runBenchmark();

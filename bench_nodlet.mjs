import { NodletSystem } from './public/NodletSystem.js';

class UnoptNodletSystem extends NodletSystem {
    updateUnopt(deltaTime, world) {
        for (let i = 0; i < this.count; i++) {
            this.age[i] += deltaTime;

            this.posX[i] += this.velX[i] * deltaTime;
            this.posY[i] += this.velY[i] * deltaTime;

            // Keep inside world bounds with soft bounce
            const radius = this.size[i] / 2;
            const minX = radius;
            const maxX = world.width - radius;
            const minY = radius;
            const maxY = world.height - radius;

            if (this.posX[i] < minX) {
                this.posX[i] = minX;
                this.velX[i] *= -0.6;
            } else if (this.posX[i] > maxX) {
                this.posX[i] = maxX;
                this.velX[i] *= -0.6;
            }

            if (this.posY[i] < minY) {
                this.posY[i] = minY;
                this.velY[i] *= -0.6;
            } else if (this.posY[i] > maxY) {
                this.posY[i] = maxY;
                this.velY[i] *= -0.6;
            }
        }
    }
}

function runBenchmark() {
    const iterations = 500;
    const nodletsCount = 10000;

    const sysUnopt = new UnoptNodletSystem(nodletsCount);
    for(let i=0; i<nodletsCount; i++) sysUnopt.spawn(2500, 2500, 0);

    const sysOpt = new NodletSystem(nodletsCount);
    for(let i=0; i<nodletsCount; i++) sysOpt.spawn(2500, 2500, 0);

    const world = { width: 5000, height: 5000 };
    const dt = 1/60;

    // Warmup
    for (let i = 0; i < 100; i++) {
        sysUnopt.updateUnopt(dt, world);
        sysOpt.update(dt, world);
    }

    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
        sysUnopt.updateUnopt(dt, world);
    }
    const endUnopt = performance.now();

    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
        sysOpt.update(dt, world);
    }
    const endOpt = performance.now();

    console.log(`Unoptimized: ${(endUnopt - startUnopt).toFixed(2)}ms`);
    console.log(`Optimized:   ${(endOpt - startOpt).toFixed(2)}ms`);
    console.log(`Speedup:     ${(((endUnopt - startUnopt) / (endOpt - startOpt)) - 1) * 100}%`);
}

runBenchmark();
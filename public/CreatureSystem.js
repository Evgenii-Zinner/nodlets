/**
 * CreatureSystem - Data-oriented creature simulation
 */
export class CreatureSystem {
    constructor(maxCreatures = 1000) {
        this.maxCreatures = maxCreatures;
        this.count = 0;

        // Flat arrays for creature data
        this.posX = new Float32Array(maxCreatures);
        this.posY = new Float32Array(maxCreatures);
        this.velX = new Float32Array(maxCreatures);
        this.velY = new Float32Array(maxCreatures);
        this.size = new Uint8Array(maxCreatures);
        this.energy = new Float32Array(maxCreatures);
        this.intelligence = new Float32Array(maxCreatures);
        this.maxEnergy = new Uint8Array(maxCreatures);
        this.age = new Float32Array(maxCreatures);
        this.color = new Uint32Array(maxCreatures);

        // Behavioral state
        this.wanderAngle = new Float32Array(maxCreatures);
        this.wanderTimer = new Float32Array(maxCreatures);
        this.state = new Uint8Array(maxCreatures);

        // Spatial Grid for optimized neighbor lookups (Bolt optimization)
        this.cellSize = 200;
        this.grid = null;
        this.gridCols = 0;
        this.gridRows = 0;
        this.nextInCell = new Int32Array(maxCreatures);
    }

    initGrid(worldWidth, worldHeight) {
        this.gridCols = Math.ceil(worldWidth / this.cellSize);
        this.gridRows = Math.ceil(worldHeight / this.cellSize);
        this.grid = new Int32Array(this.gridCols * this.gridRows);
        this.grid.fill(-1);
    }

    updateGrid() {
        if (!this.grid) return;
        this.grid.fill(-1);
        for (let i = 0; i < this.count; i++) {
            const gx = Math.floor(this.posX[i] / this.cellSize);
            const gy = Math.floor(this.posY[i] / this.cellSize);

            if (gx >= 0 && gx < this.gridCols && gy >= 0 && gy < this.gridRows) {
                const cellIdx = gy * this.gridCols + gx;
                this.nextInCell[i] = this.grid[cellIdx];
                this.grid[cellIdx] = i;
            } else {
                this.nextInCell[i] = -1;
            }
        }
    }

    /**
     * Efficiently find creatures within a radius using the spatial grid
     */
    forEachNeighbor(x, y, radius, callback) {
        if (!this.grid) return;

        const x1 = Math.floor((x - radius) / this.cellSize);
        const x2 = Math.floor((x + radius) / this.cellSize);
        const y1 = Math.floor((y - radius) / this.cellSize);
        const y2 = Math.floor((y + radius) / this.cellSize);

        const r2 = radius * radius;

        for (let gy = y1; gy <= y2; gy++) {
            if (gy < 0 || gy >= this.gridRows) continue;
            for (let gx = x1; gx <= x2; gx++) {
                if (gx < 0 || gx >= this.gridCols) continue;

                let idx = this.grid[gy * this.gridCols + gx];
                while (idx !== -1) {
                    const dx = this.posX[idx] - x;
                    const dy = this.posY[idx] - y;
                    if (dx * dx + dy * dy <= r2) {
                        callback(idx);
                    }
                    idx = this.nextInCell[idx];
                }
            }
        }
    }

    spawn(x, y, parentParams = null) {
        if (this.count >= this.maxCreatures) return -1;

        const idx = this.count++;

        this.posX[idx] = x;
        this.posY[idx] = y;
        this.velX[idx] = (Math.random() - 0.5) * 20;
        this.velY[idx] = (Math.random() - 0.5) * 20;

        // Inheritance & Mutation
        if (parentParams) {
            const mutation = 0.95 + Math.random() * 0.1; // +/- 5%
            this.size[idx] = Math.max(4, Math.min(20, Math.round(parentParams.size * mutation)));
            this.color[idx] = parentParams.color;
        } else {
            this.size[idx] = 8 + Math.random() * 4; // 8-12
            const colors = [0xBC13FEFF, 0x00F3FFFF, 0x00FF41FF, 0xFF10F0FF];
            this.color[idx] = colors[Math.floor(Math.random() * colors.length)];
        }

        this.maxEnergy[idx] = 80 + Math.floor(Math.random() * 41); // 80-120
        this.energy[idx] = 20; // Start with low energy to force seeking behavior
        this.intelligence[idx] = 0;
        this.age[idx] = 0;

        this.wanderAngle[idx] = Math.random() * Math.PI * 2;
        this.wanderTimer[idx] = Math.random() * 3;
        this.state[idx] = 1;

        return idx;
    }

    despawn(idx) {
        if (idx < 0 || idx >= this.count) return;

        // Swap and Pop
        const lastIdx = --this.count;
        if (idx !== lastIdx) {
            this.posX[idx] = this.posX[lastIdx];
            this.posY[idx] = this.posY[lastIdx];
            this.velX[idx] = this.velX[lastIdx];
            this.velY[idx] = this.velY[lastIdx];
            this.size[idx] = this.size[lastIdx];
            this.energy[idx] = this.energy[lastIdx];
            this.intelligence[idx] = this.intelligence[lastIdx];
            this.maxEnergy[idx] = this.maxEnergy[lastIdx];
            this.age[idx] = this.age[lastIdx];
            this.color[idx] = this.color[lastIdx];
            this.wanderAngle[idx] = this.wanderAngle[lastIdx];
            this.wanderTimer[idx] = this.wanderTimer[lastIdx];
            this.state[idx] = this.state[lastIdx];
        }
    }

    update(deltaTime, world) {
        if (!this.grid) this.initGrid(world.width, world.height);
        this.updateGrid();

        for (let i = 0; i < this.count; i++) {
            this.age[i] += deltaTime;

            // Movement is now directive (handled in game.js AI)
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

            // Energy Depletion: Steady drain (1 unit in 10 sec = 0.1/sec)
            this.energy[i] -= 1 * deltaTime;
            if (this.energy[i] < 0) this.energy[i] = 0;
        }
    }
}

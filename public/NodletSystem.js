/**
 * NodletSystem - Data-oriented nodlet simulation
 */
export class NodletSystem {
    constructor(maxNodlets = 1000) {
        this.maxNodlets = maxNodlets;
        this.count = 0;

        // Flat arrays for nodlet data
        this.posX = new Float32Array(maxNodlets);
        this.posY = new Float32Array(maxNodlets);
        this.velX = new Float32Array(maxNodlets);
        this.velY = new Float32Array(maxNodlets);
        this.size = new Uint8Array(maxNodlets);

        this.carriedData = new Float32Array(maxNodlets);
        this.maxDataCapacity = new Float32Array(maxNodlets);

        this.age = new Float32Array(maxNodlets);
        this.color = new Uint32Array(maxNodlets);

        this.hubId = new Int32Array(maxNodlets); // Which Hub owns this nodlet

        // Behavioral state
        this.wanderAngle = new Float32Array(maxNodlets);
        this.wanderTimer = new Float32Array(maxNodlets);
        // State: 0 = Seeking Data, 1 = Returning to Hub
        this.state = new Uint8Array(maxNodlets);

        // Spatial Grid for optimized neighbor lookups
        this.cellSize = 200;
        this.grid = null;
        this.gridCols = 0;
        this.gridRows = 0;
        this.nextInCell = new Int32Array(maxNodlets);
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

    spawn(x, y, hubId, color = 0x00F3FFFF) {
        if (this.count >= this.maxNodlets) return -1;

        const idx = this.count++;

        this.posX[idx] = x;
        this.posY[idx] = y;
        this.velX[idx] = (Math.random() - 0.5) * 40;
        this.velY[idx] = (Math.random() - 0.5) * 40;

        this.size[idx] = 8 + Math.random() * 4; // 8-12
        this.color[idx] = color;
        this.hubId[idx] = hubId;

        this.carriedData[idx] = 0;
        this.maxDataCapacity[idx] = 50 + Math.random() * 20;
        this.age[idx] = 0;

        this.wanderAngle[idx] = Math.random() * Math.PI * 2;
        this.wanderTimer[idx] = Math.random() * 3;
        this.state[idx] = 0; // Seeking Data

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
            this.carriedData[idx] = this.carriedData[lastIdx];
            this.maxDataCapacity[idx] = this.maxDataCapacity[lastIdx];
            this.age[idx] = this.age[lastIdx];
            this.color[idx] = this.color[lastIdx];
            this.hubId[idx] = this.hubId[lastIdx];
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

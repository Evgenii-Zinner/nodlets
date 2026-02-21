/**
 * ResourceSystem - Handles static Servers and traveling Data Packets
 */
export class ResourceSystem {
    constructor(maxResources = 2000) {
        this.maxResources = maxResources;
        this.count = 0;

        // 0: Server, 1: Packet
        this.type = new Uint8Array(maxResources);
        this.posX = new Float32Array(maxResources);
        this.posY = new Float32Array(maxResources);
        this.amount = new Float32Array(maxResources);

        // For Servers (Regeneration)
        this.maxAmount = new Float32Array(maxResources);

        // For Packets (Movement)
        this.targetX = new Float32Array(maxResources);
        this.targetY = new Float32Array(maxResources);
        this.speed = new Float32Array(maxResources);

        // Spatial Grid for optimized neighbor lookups
        this.cellSize = 200;
        this.grid = null;
        this.gridCols = 0;
        this.gridRows = 0;
        this.nextInCell = new Int32Array(maxResources);
        this.dirtyGrid = true;
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

    spawnServer(x, y, maxAmount = 1000) {
        if (this.count >= this.maxResources) return -1;
        const idx = this.count++;

        this.type[idx] = 0; // Server
        this.posX[idx] = x;
        this.posY[idx] = y;
        this.amount[idx] = maxAmount;
        this.maxAmount[idx] = maxAmount;

        this.dirtyGrid = true;
        return idx;
    }

    spawnPacket(startX, startY, endX, endY, amount = 20) {
        if (this.count >= this.maxResources) return -1;
        const idx = this.count++;

        this.type[idx] = 1; // Packet
        this.posX[idx] = startX;
        this.posY[idx] = startY;
        this.amount[idx] = amount;

        this.targetX[idx] = endX;
        this.targetY[idx] = endY;
        this.speed[idx] = 250 + Math.random() * 100; // Packets are fast

        this.dirtyGrid = true;
        return idx;
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
                    if (idx < this.count) {
                        const dx = this.posX[idx] - x;
                        const dy = this.posY[idx] - y;
                        if (dx * dx + dy * dy <= r2) {
                            callback(idx);
                        }
                    }
                    idx = this.nextInCell[idx];
                }
            }
        }
    }

    update(deltaTime, world) {
        if (!this.grid) this.initGrid(world.width, world.height);

        for (let i = 0; i < this.count; i++) {
            if (this.type[i] === 0) {
                // Server Regeneration
                if (this.amount[i] < this.maxAmount[i]) {
                    this.amount[i] += 10 * deltaTime; // 10 bytes per second regen
                    if (this.amount[i] > this.maxAmount[i]) {
                        this.amount[i] = this.maxAmount[i];
                    }
                }
            } else if (this.type[i] === 1) {
                // Packet Movement
                const dx = this.targetX[i] - this.posX[i];
                const dy = this.targetY[i] - this.posY[i];
                const distSq = dx * dx + dy * dy;

                // If it reached the destination server, despawn it
                if (distSq < 100) { // arbitrary small arrival radius
                    this.despawn(i);
                    i--;
                    continue;
                }

                // Move towards target
                const dist = Math.sqrt(distSq);
                const vx = (dx / dist) * this.speed[i];
                const vy = (dy / dist) * this.speed[i];

                this.posX[i] += vx * deltaTime;
                this.posY[i] += vy * deltaTime;
                this.dirtyGrid = true;
            }
        }

        if (this.dirtyGrid) {
            this.updateGrid();
            this.dirtyGrid = false;
        }
    }

    despawn(idx) {
        if (idx < 0 || idx >= this.count) return;

        // Swap with last
        const lastIdx = this.count - 1;
        if (idx !== lastIdx) {
            this.posX[idx] = this.posX[lastIdx];
            this.posY[idx] = this.posY[lastIdx];
            this.amount[idx] = this.amount[lastIdx];
            this.type[idx] = this.type[lastIdx];
            this.maxAmount[idx] = this.maxAmount[lastIdx];
            this.targetX[idx] = this.targetX[lastIdx];
            this.targetY[idx] = this.targetY[lastIdx];
            this.speed[idx] = this.speed[lastIdx];
        }

        this.count--;
        this.dirtyGrid = true;
    }
}

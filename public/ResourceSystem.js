/**
 * ResourceSystem - Handles static Servers and traveling Data Packets
 */
export class ResourceSystem {
    constructor(maxResources = 2000) {
        this.maxResources = maxResources;
        this.count = 0;

        // 0: Generator Server, 1: Relay Server, 2: Packet
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

        // Tracks number of active packets for early-exit optimizations
        this.activePacketCount = 0;

        // Pre-allocated array for internal queries to avoid GC
        this._queryResults = new Int32Array(maxResources);
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

    spawnServer(x, y, maxAmount = 1000, type = 0) {
        if (this.count >= this.maxResources) return -1;
        const idx = this.count++;

        this.type[idx] = type; // 0 = Generator, 1 = Relay
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

        this.type[idx] = 2; // Packet
        this.posX[idx] = startX;
        this.posY[idx] = startY;
        this.amount[idx] = amount;

        this.targetX[idx] = endX;
        this.targetY[idx] = endY;
        this.speed[idx] = 250 + Math.random() * 100; // Packets are fast

        this.activePacketCount++;

        this.dirtyGrid = true;
        return idx;
    }

    /**
     * Finds all resources within `radius` of `x, y` and appends their indices to `outArray`.
     * ⚡ Bolt Optimization: Avoids closure allocations by populating a passed Int32Array by index.
     * Returns the number of neighbors found to avoid modifying array length.
     */
    getNeighbors(x, y, radius, outArray) {
        if (!this.grid) return 0;
        const x1 = Math.floor((x - radius) / this.cellSize);
        const x2 = Math.floor((x + radius) / this.cellSize);
        const y1 = Math.floor((y - radius) / this.cellSize);
        const y2 = Math.floor((y + radius) / this.cellSize);
        const r2 = radius * radius;
        let count = 0;

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
                            outArray[count++] = idx;
                        }
                    }
                    idx = this.nextInCell[idx];
                }
            }
        }
        return count;
    }

    update(deltaTime, world) {
        if (!this.grid) this.initGrid(world.width, world.height);

        for (let i = 0; i < this.count; i++) {
            if (this.type[i] === 0) { // Generator Regeneration
                if (this.amount[i] < this.maxAmount[i]) {
                    this.amount[i] += 10 * deltaTime; // 10 bytes per second regen
                    if (this.amount[i] > this.maxAmount[i]) {
                        this.amount[i] = this.maxAmount[i];
                    }
                }
            } else if (this.type[i] === 2) { // Packet Movement
                const dx = this.targetX[i] - this.posX[i];
                const dy = this.targetY[i] - this.posY[i];
                const distSq = dx * dx + dy * dy;

                // If it reached the destination (arbitrary small radius 100)
                if (distSq < 100) {
                    // Find the destination server to add data to it (if it has capacity)
                    const neighborCount = this.getNeighbors(this.posX[i], this.posY[i], 50, this._queryResults);
                    for (let k = 0; k < neighborCount; k++) {
                        const neighborIdx = this._queryResults[k];
                        if (this.type[neighborIdx] === 0 || this.type[neighborIdx] === 1) {
                            if (this.amount[neighborIdx] < this.maxAmount[neighborIdx]) {
                                this.amount[neighborIdx] += this.amount[i];
                                if (this.amount[neighborIdx] > this.maxAmount[neighborIdx]) {
                                    this.amount[neighborIdx] = this.maxAmount[neighborIdx];
                                }
                            }
                        }
                    }

                    this.despawn(i);
                    i--;
                    continue;
                }

                // Move towards target
                const dist = Math.sqrt(distSq);
                // ⚡ Bolt Optimization: Hoist division to single multiplication factor
                const speedOverDist = this.speed[i] / dist;
                const vx = dx * speedOverDist;
                const vy = dy * speedOverDist;

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

        if (this.type[idx] === 2) {
            this.activePacketCount--;
        }

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

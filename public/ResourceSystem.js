/**
 * ResourceSystem - Handles food and charge sources
 */
export class ResourceSystem {
    constructor(maxResources = 500) {
        this.maxResources = maxResources;
        this.count = 0;

        this.posX = new Float32Array(maxResources);
        this.posY = new Float32Array(maxResources);
        this.amount = new Float32Array(maxResources);
        this.type = new Uint8Array(maxResources); // 0: Food (Data), 1: Charge

        // Spatial Grid
        this.cellSize = 200;
        this.grid = null;
        this.gridCols = 0;
        this.gridRows = 0;
        this.nextInCell = new Int32Array(maxResources);
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

    spawn(x, y, type, amount = 100) {
        if (this.count >= this.maxResources) return -1;
        const idx = this.count++;
        this.posX[idx] = x;
        this.posY[idx] = y;
        this.type[idx] = type;
        this.amount[idx] = amount;
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

    update(deltaTime, world) {
        if (!this.grid) this.initGrid(world.width, world.height);
        this.updateGrid();

        // Resources might slowly replenish or deplete
        for (let i = 0; i < this.count; i++) {
            if (this.amount[i] < 100) {
                this.amount[i] += deltaTime * 2; // Slow replenish
                if (this.amount[i] > 100) this.amount[i] = 100;
            }
        }
    }
}

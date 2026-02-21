/**
 * HubSystem - Data-oriented hub simulation
 */
export class HubSystem {
    constructor(maxHubs = 100) {
        this.maxHubs = maxHubs;
        this.count = 0;

        // Flat arrays for hub data
        this.posX = new Float32Array(maxHubs);
        this.posY = new Float32Array(maxHubs);
        this.data = new Float32Array(maxHubs);
        this.baseNodletCapacity = new Uint32Array(maxHubs);
        this.activeNodlets = new Uint32Array(maxHubs);
        this.color = new Uint32Array(maxHubs);
        this.size = new Float32Array(maxHubs);
    }

    spawn(x, y, color = 0xBC13FEFF) {
        if (this.count >= this.maxHubs) return -1;

        const idx = this.count++;

        this.posX[idx] = x;
        this.posY[idx] = y;
        this.data[idx] = 0;
        this.baseNodletCapacity[idx] = 10;
        this.activeNodlets[idx] = 0;
        this.color[idx] = color;
        this.size[idx] = 40; // Base visible size

        return idx;
    }

    despawn(idx) {
        if (idx < 0 || idx >= this.count) return;

        // Swap and Pop
        const lastIdx = --this.count;
        if (idx !== lastIdx) {
            this.posX[idx] = this.posX[lastIdx];
            this.posY[idx] = this.posY[lastIdx];
            this.data[idx] = this.data[lastIdx];
            this.baseNodletCapacity[idx] = this.baseNodletCapacity[lastIdx];
            this.activeNodlets[idx] = this.activeNodlets[lastIdx];
            this.color[idx] = this.color[lastIdx];
            this.size[idx] = this.size[lastIdx];
        }
    }

    depositData(idx, amount) {
        if (idx < 0 || idx >= this.count) return;
        this.data[idx] += amount;
    }
}

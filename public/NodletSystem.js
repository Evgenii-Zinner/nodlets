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
        this.orbitRadius = new Float32Array(maxNodlets);
        this.orbitDirection = new Float32Array(maxNodlets); // 1 or -1
        // State: 0 = Seeking Data, 1 = Returning to Hub
        this.state = new Uint8Array(maxNodlets);
    }

    forEachNeighbor(x, y, radius, callback) {
        const r2 = radius * radius;
        for (let i = 0; i < this.count; i++) {
            const dx = this.posX[i] - x;
            const dy = this.posY[i] - y;
            if (dx * dx + dy * dy <= r2) {
                callback(i);
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
        this.orbitRadius[idx] = 40 + Math.random() * 60; // Random radius between 40 and 100
        this.orbitDirection[idx] = Math.random() > 0.5 ? 1 : -1; // Random clockwise or counter-clockwise
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
            this.orbitRadius[idx] = this.orbitRadius[lastIdx];
            this.orbitDirection[idx] = this.orbitDirection[lastIdx];
            this.state[idx] = this.state[lastIdx];
        }
    }

    update(deltaTime, world) {
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

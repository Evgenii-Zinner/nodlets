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
        this.size = new Float32Array(maxCreatures);
        this.energy = new Float32Array(maxCreatures);
        this.age = new Float32Array(maxCreatures);
        this.color = new Uint32Array(maxCreatures);
        
        // Behavioral state
        this.wanderAngle = new Float32Array(maxCreatures);
        this.wanderTimer = new Float32Array(maxCreatures);
        this.state = new Uint8Array(maxCreatures);
    }
    
    spawn(x, y) {
        if (this.count >= this.maxCreatures) return -1;
        
        const idx = this.count++;
        
        this.posX[idx] = x;
        this.posY[idx] = y;
        this.velX[idx] = (Math.random() - 0.5) * 20;
        this.velY[idx] = (Math.random() - 0.5) * 20;
        this.size[idx] = 10 + Math.random() * 10;
        this.energy[idx] = 100;
        this.age[idx] = 0;
        
        const colors = [0xBC13FEFF, 0x00F3FFFF, 0x00FF41FF, 0xFF10F0FF];
        this.color[idx] = colors[Math.floor(Math.random() * colors.length)];
        
        this.wanderAngle[idx] = Math.random() * Math.PI * 2;
        this.wanderTimer[idx] = Math.random() * 3;
        this.state[idx] = 1;
        
        return idx;
    }
    
    update(deltaTime, world) {
        for (let i = 0; i < this.count; i++) {
            this.age[i] += deltaTime;
            
            if (this.state[i] === 1) {
                this.wanderTimer[i] -= deltaTime;
                
                if (this.wanderTimer[i] <= 0) {
                    this.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                    this.wanderTimer[i] = 1 + Math.random() * 2;
                    const speed = 30 + Math.random() * 20;
                    this.velX[i] = Math.cos(this.wanderAngle[i]) * speed;
                    this.velY[i] = Math.sin(this.wanderAngle[i]) * speed;
                }
            }
            
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
            
            this.energy[i] -= deltaTime * 0.5;
            if (this.energy[i] < 0) this.energy[i] = 0;
        }
    }
}

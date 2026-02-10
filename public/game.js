/**
 * Canvas Game - Life Simulation with Creatures
 * EZ Space - Tactical Cyberpunk Edition
 */

import { CreatureSystem } from './CreatureSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';

class CanvasGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.world = {
            width: 5000,
            height: 5000,
        };

        this.colors = {
            ground: '#1a0f28',
            grid: 'rgba(188, 19, 254, 0.2)',
            accent: '#00f3ff'
        };

        this.resizeCanvas();

        this.camera = new Camera(this.world, this.canvas);
        this.renderer = new Renderer(this.ctx, this.colors);
        this.creatures = new CreatureSystem(1500);
        this.resources = new ResourceSystem(1000);
        this.input = new Input(
            this.canvas,
            this.camera,
            () => this.updateZoomDisplay(),
            (sx, sy) => this.handleCanvasClick(sx, sy)
        );

        this.lastFrameTime = performance.now();
        this.updateAccumulator = 0;
        this.fixedTimeStep = 1 / 60;

        this.selectedCreatureIndex = -1;

        this.init();
    }

    init() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.spawnInitialCreatures();
        this.spawnInitialResources();
        this.gameLoop();
    }

    spawnInitialCreatures() {
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            this.creatures.spawn(x, y);
        }
    }

    spawnInitialResources() {
        for (let i = 0; i < 30000; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            const type = Math.random() > 0.3 ? 0 : 1; // 70% food, 30% charge
            this.resources.spawn(x, y, type);
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    updateZoomDisplay() {
        document.getElementById('zoomValue').textContent =
            Math.round(this.camera.zoom * 100) + '%';
    }

    updateCreatureStatus(creatureIndex) {
        if (creatureIndex < 0 || creatureIndex >= this.creatures.count) return;

        this.selectedCreatureIndex = creatureIndex;

        const stateEl = document.getElementById('creatureState');
        const ageEl = document.getElementById('creatureAge');
        const energyEl = document.getElementById('creatureStateEnergy');

        const state = this.creatures.state[creatureIndex];
        const stateText = state === 1 ? 'Wandering' : 'Idle';

        stateEl.textContent = stateText;
        stateEl.className = `status-state ${state === 1 ? 'wandering' : 'idle'}`;

        ageEl.textContent = Math.round(this.creatures.age[creatureIndex]) + 's';
        energyEl.textContent = Math.round(this.creatures.energy[creatureIndex]) + '%';
    }

    updateCreatureCount() {
        const countEl = document.getElementById('creatureCount');
        if (countEl) countEl.textContent = this.creatures.count;
    }

    handleCanvasClick(sx, sy) {
        const worldPos = this.camera.screenToWorld(sx, sy);
        let nearestIndex = -1;
        let minDist = 30 / this.camera.zoom; // Click tolerance in world units

        this.creatures.forEachNeighbor(worldPos.x, worldPos.y, 50, (idx) => {
            const dx = this.creatures.posX[idx] - worldPos.x;
            const dy = this.creatures.posY[idx] - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearestIndex = idx;
            }
        });

        if (nearestIndex !== -1) {
            this.updateCreatureStatus(nearestIndex);
        }
    }

    update(deltaTime) {
        this.creatures.update(deltaTime, this.world);
        this.resources.update(deltaTime, this.world);

        // Interaction: Awareness & AI (Bolt optimized via Spatial Grid)
        for (let i = 0; i < this.creatures.count; i++) {
            const cx = this.creatures.posX[i];
            const cy = this.creatures.posY[i];
            const energy = this.creatures.energy[i];

            if (energy < 80) {
                this.resources.forEachNeighbor(cx, cy, 200, (resIdx) => {
                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);

                    if (dist < 30) {
                        // Consuming
                        const amount = Math.min(this.resources.amount[resIdx], deltaTime * 40);
                        this.creatures.energy[i] += amount;
                        this.resources.amount[resIdx] -= amount;

                        // Slow down when eating
                        this.creatures.velX[i] *= 0.9;
                        this.creatures.velY[i] *= 0.9;
                    } else if (energy < 50) {
                        // Attraction: Move towards resource if hungry
                        const force = (1.0 - dist / 2000) * 20 * deltaTime;
                        this.creatures.velX[i] += (dx / dist) * force;
                        this.creatures.velY[i] += (dy / dist) * force;
                    }
                });
            }
        }
    }

    render() {
        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawBackground(this.camera, this.world, this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.camera, this.world, this.canvas.width, this.canvas.height);
        this.renderer.drawResources(this.resources, this.camera, this.canvas.width, this.canvas.height);
        this.renderer.drawCreatures(this.creatures, this.camera, this.canvas.width, this.canvas.height);
        this.renderer.drawDebug(this.camera, this.creatures.count, this.canvas.width, this.canvas.height);
    }

    gameLoop() {
        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (deltaTime > 0.1) deltaTime = 0.1;

        this.updateAccumulator += deltaTime;
        while (this.updateAccumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.updateAccumulator -= this.fixedTimeStep;
        }

        if (Math.random() < 0.016) {
            this.updateCreatureCount();
            if (this.selectedCreatureIndex >= 0) {
                this.updateCreatureStatus(this.selectedCreatureIndex);
            }
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CanvasGame();
});

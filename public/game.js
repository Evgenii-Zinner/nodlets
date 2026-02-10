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
        this.creatures = new CreatureSystem(10000);
        this.resources = new ResourceSystem(2000);
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
        for (let i = 0; i < this.creatures.maxCreatures * 0.8; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            this.creatures.spawn(x, y);
        }
    }

    spawnInitialResources() {
        // Initial 20 Large Energy Nodes (Permanent)
        for (let i = 0; i < 20; i++) {
            this.resources.spawnEnergy(Math.random() * this.world.width, Math.random() * this.world.height);
        }
        // Initial 150 Data Nodes (Disposable)
        for (let i = 0; i < 150; i++) {
            this.resources.spawnData(Math.random() * this.world.width, Math.random() * this.world.height);
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
        const maxEnergyEl = document.getElementById('creatureMaxEnergy');
        const intelEl = document.getElementById('creatureIntelligence');
        const intentEl = document.getElementById('creatureIntent');

        const state = this.creatures.state[creatureIndex];
        const stateLabels = ['Seeking Energy', 'Seeking Data', 'Evolution Ready'];

        stateEl.textContent = state === 2 ? 'Evolving' : 'Active';
        stateEl.className = `status-state ${state === 2 ? 'idle' : 'wandering'}`;

        ageEl.textContent = Math.round(this.creatures.age[creatureIndex]) + 's';
        intentEl.textContent = stateLabels[state] || 'None';
        energyEl.textContent = Math.round(this.creatures.energy[creatureIndex]);
        maxEnergyEl.textContent = this.creatures.maxEnergy[creatureIndex];
        intelEl.textContent = Math.round(this.creatures.intelligence[creatureIndex]) + '%';
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
            const maxEnergy = this.creatures.maxEnergy[i];
            const intelligence = this.creatures.intelligence[i];

            // Death Logic
            if (energy <= 0) {
                this.resources.spawnData(cx, cy, 100); // Drop 100 Data on death
                this.creatures.despawn(i);
                i--; // Adjust loop for swap-and-pop
                continue;
            }

            // Intelligence / Evolution Logic
            if (intelligence >= 100) {
                // ALWAYS Spawn Child First
                this.creatures.spawn(cx + 10, cy + 10, {
                    size: this.creatures.size[i],
                    color: this.creatures.color[i]
                });

                if (Math.random() < 0.5) {
                    // Parent Dies (Sacrifice)
                    this.resources.spawnData(cx, cy, 200);
                    this.creatures.despawn(i);
                    i--;
                    continue;
                } else {
                    // Parent Lives (Reset)
                    this.creatures.intelligence[i] = 0;
                }
            }

            // Seek Resources / Choice Logic (Hysteresis implemented)
            let searchType = -1;
            const currentState = this.creatures.state[i];

            if (currentState === 0) {
                // Currently Charging: Continue until nearly Full (Buffer to avoid getting stuck)
                if (energy < maxEnergy - 2) {
                    searchType = 0;
                } else {
                    // Full Enough! Switch to Data if needed
                    this.creatures.state[i] = intelligence < 100 ? 1 : 2;
                    searchType = this.creatures.state[i] === 1 ? 1 : -1;
                }
            } else {
                // Normal operation
                if (energy < 50) {
                    this.creatures.state[i] = 0; // Start Seeking Energy
                    searchType = 0;
                } else if (intelligence < 100) {
                    this.creatures.state[i] = 1; // Seeking Data
                    searchType = 1;
                } else {
                    this.creatures.state[i] = 2; // Evolving
                }
            }

            let foundResource = false;
            if (searchType !== -1) {
                let closestDistSq = 300 * 300;
                let targetResIdx = -1;

                this.resources.forEachNeighbor(cx, cy, 300, (resIdx) => {
                    if (this.resources.type[resIdx] !== searchType) return;
                    if (this.resources.amount[resIdx] <= 0) return;

                    // Economy V2: Energy Sufficiency Check
                    if (searchType === 0) {
                        const needed = maxEnergy - energy;
                        if (this.resources.amount[resIdx] < needed) return;
                    }

                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < closestDistSq) {
                        closestDistSq = distSq;
                        targetResIdx = resIdx;
                    }
                });

                if (targetResIdx !== -1) {
                    foundResource = true;
                    const resIdx = targetResIdx;
                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;

                    if (closestDistSq < 900) { // dist < 30
                        const bite = 25 * deltaTime;
                        const amount = Math.min(this.resources.amount[resIdx], bite);

                        if (searchType === 0) {
                            // Energy: Subtract but NO DESPAWN (Regenerates)
                            this.creatures.energy[i] = Math.min(maxEnergy, this.creatures.energy[i] + amount);
                            this.resources.amount[resIdx] -= amount;
                        } else {
                            // Data: Subtract and DESPAWN when empty
                            this.creatures.intelligence[i] = Math.min(100, this.creatures.intelligence[i] + amount);
                            this.resources.amount[resIdx] -= amount;

                            if (this.resources.amount[resIdx] <= 0) {
                                this.resources.despawn(resIdx);
                            }
                        }

                        this.creatures.velX[i] *= 0.8;
                        this.creatures.velY[i] *= 0.8;
                    } else {
                        const dist = Math.sqrt(closestDistSq);
                        const force = (1.0 - dist / 300) * 35 * deltaTime;
                        this.creatures.velX[i] += (dx / dist) * force;
                        this.creatures.velY[i] += (dy / dist) * force;
                    }
                }
            }

            // Fallback search behavior (Directive wandering)
            if (!foundResource && this.creatures.state[i] !== 2) {
                this.creatures.wanderTimer[i] -= deltaTime;
                if (this.creatures.wanderTimer[i] <= 0) {
                    this.creatures.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                    this.creatures.wanderTimer[i] = 1 + Math.random() * 2;
                }
                const speed = 40;
                this.creatures.velX[i] += (Math.cos(this.creatures.wanderAngle[i]) * speed - this.creatures.velX[i]) * 0.1;
                this.creatures.velY[i] += (Math.sin(this.creatures.wanderAngle[i]) * speed - this.creatures.velY[i]) * 0.1;
            } else if (this.creatures.state[i] === 2) {
                // Drift when evolving
                this.creatures.velX[i] *= 0.95;
                this.creatures.velY[i] *= 0.95;
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

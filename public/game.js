/**
 * Canvas Game - Life Simulation with Creatures
 * EZ Space - Tactical Cyberpunk Edition
 */

import { CreatureSystem } from './CreatureSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';

class CanvasGame {
    constructor() {
        this.container = document.querySelector('.game-container');

        this.world = {
            width: 5000,
            height: 5000,
        };

        this.colors = {
            ground: '#1a0f28',
            grid: 0xBC13FE, // Hex for Pixi
            accent: 0x00f3ff
        };

        this.renderer = new Renderer(this.colors, this.world);
        this.creatures = new CreatureSystem(10000);
        this.resources = new ResourceSystem(2000);

        // Input needs camera, which is created after renderer init
        this.camera = null;
        this.input = null;

        this.lastFrameTime = performance.now();
        this.updateAccumulator = 0;
        this.fixedTimeStep = 1 / 60;

        this.selectedCreatureIndex = -1;
        this.totalDataConsumed = 0;

        this.upgrades = new UpgradeSystem();

        this.init();
    }

    async init() {
        await this.renderer.init(this.container);


        // Accessibility for canvas
        const newCanvas = this.renderer.app.canvas;
        newCanvas.setAttribute('role', 'img');
        newCanvas.setAttribute('aria-label', 'Simulation Canvas');
// Remove the old canvas if it exists (index.html has it)
        const oldCanvas = document.getElementById('gameCanvas');
        if (oldCanvas) oldCanvas.remove();

        this.camera = new Camera(this.world, this.renderer.app.screen);
        this.input = new Input(
            this.renderer.app.canvas,
            this.camera,
            () => this.updateZoomDisplay(),
            (sx, sy) => this.handleCanvasClick(sx, sy)
        );

        this.bindUpgradeEvents();

        this.spawnInitialCreatures();
        this.spawnInitialResources();
        this.gameLoop();
    }

    spawnInitialCreatures() {
        const centerX = this.world.width / 2;
        const centerY = this.world.height / 2;
        const radius = 300;

        for (let i = 0; i < 50; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.creatures.spawn(x, y);
        }
    }

    spawnInitialResources() {
        const centerX = this.world.width / 2;
        const centerY = this.world.height / 2;
        const maxDist = Math.max(this.world.width, this.world.height) / 2;

        // 1. Center Hub (Single Energy Source)
        this.resources.spawnEnergy(centerX, centerY);

        // 2. Star Vectors (8 directions)
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },   // Sides
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 0.707, dy: 0.707 }, { dx: -0.707, dy: 0.707 }, // Diagonals
            { dx: 0.707, dy: -0.707 }, { dx: -0.707, dy: -0.707 }
        ];

        directions.forEach(dir => {
            // Spawn single points along the vector at equal distances
            for (let step = 1; step <= 8; step++) {
                const dist = step * (maxDist / 10);
                const x = centerX + dir.dx * dist;
                const y = centerY + dir.dy * dist;
                this.resources.spawnEnergy(x, y);
            }
        });

        // 3. Data Filling
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            this.resources.spawnData(x, y);
        }
    }

    bindUpgradeEvents() {
        const btn = document.getElementById('upgradeBtn');
        const modal = document.getElementById('upgradeModal');
        const choicesContainer = document.getElementById('upgradeChoices');

        if (btn) {
            btn.addEventListener('click', () => {
                const choices = this.upgrades.getChoices();
                choicesContainer.innerHTML = '';

                choices.forEach((choice) => {
                    const card = document.createElement('div');
                    card.className = 'upgrade-card';
                    card.innerHTML = `<h3>${choice.name}</h3><p>${choice.description}</p>`;
                    card.onclick = () => {
                        this.upgrades.applyUpgrade(choice);
                        modal.classList.add('hidden');
                        btn.classList.add('hidden');
                    };
                    choicesContainer.appendChild(card);
                });

                modal.classList.remove('hidden');
            });
        }
    }

    updateZoomDisplay() {
        if (this.camera) {
            document.getElementById('zoomValue').textContent =
                Math.round(this.camera.zoom * 100) + '%';
        }
    }

    // ... rest of the status methods stay mostly same ...
    clearCreatureSelection() {
        this.selectedCreatureIndex = -1;
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.remove('hidden');
        if (details) details.classList.add('hidden');
    }

    updateCreatureStatus(creatureIndex) {
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.add('hidden');
        if (details) details.classList.remove('hidden');

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

    updateGlobalStats() {
        const dataEl = document.getElementById('totalDataConsumed');
        if (dataEl) dataEl.textContent = Math.floor(this.totalDataConsumed);
    }

    handleCanvasClick(sx, sy) {
        if (!this.camera) return;
        const worldPos = this.camera.screenToWorld(sx, sy);
        let nearestIndex = -1;
        let minDist = 30 / this.camera.zoom;

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
        } else {
            this.clearCreatureSelection();
        }
    }

    update(deltaTime) {
        // Upgrade Check
        if (this.upgrades.checkMilestone(this.totalDataConsumed)) {
            const btn = document.getElementById('upgradeBtn');
            if (btn) btn.classList.remove('hidden');
        }

        if (Math.random() < this.upgrades.perks.dataDropChance) {
            this.resources.spawnData(
                Math.random() * this.world.width,
                Math.random() * this.world.height
            );
        }

        this.creatures.update(deltaTime, this.world);
        this.resources.update(deltaTime, this.world, this.upgrades.perks.energyResetRate);

        for (let i = 0; i < this.creatures.count; i++) {
            const cx = this.creatures.posX[i];
            const cy = this.creatures.posY[i];
            const energy = this.creatures.energy[i];
            const maxEnergy = this.creatures.maxEnergy[i];
            const intelligence = this.creatures.intelligence[i];

            if (energy <= 0) {
                this.resources.spawnData(cx, cy, 100);
                this.creatures.despawn(i);
                i--;
                continue;
            }

            if (intelligence >= 100) {
                this.creatures.spawn(cx + 10, cy + 10, {
                    size: this.creatures.size[i],
                    color: this.creatures.color[i]
                }, this.upgrades.perks);

                if (Math.random() < 0.5) {
                    this.resources.spawnData(cx, cy, 200);
                    this.creatures.despawn(i);
                    i--;
                    continue;
                } else {
                    this.creatures.intelligence[i] = 0;
                }
            }

            let searchType = -1;
            const currentState = this.creatures.state[i];

            if (currentState === 0) {
                if (energy < maxEnergy - 2) {
                    searchType = 0;
                } else {
                    this.creatures.state[i] = intelligence < 100 ? 1 : 2;
                    searchType = this.creatures.state[i] === 1 ? 1 : -1;
                }
            } else {
                if (energy < 50) {
                    this.creatures.state[i] = 0;
                    searchType = 0;
                } else if (intelligence < 100) {
                    this.creatures.state[i] = 1;
                    searchType = 1;
                } else {
                    this.creatures.state[i] = 2;
                }
            }

            let foundResource = false;
            if (searchType !== -1) {
                let closestDistSq = 300 * 300;
                let targetResIdx = -1;

                this.resources.forEachNeighbor(cx, cy, 300, (resIdx) => {
                    if (this.resources.type[resIdx] !== searchType) return;
                    if (this.resources.amount[resIdx] <= 0) return;

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

                    if (closestDistSq < 900) {
                        const bite = 25 * deltaTime;
                        const amount = Math.min(this.resources.amount[resIdx], bite);

                        if (searchType === 0) {
                            this.creatures.energy[i] = Math.min(maxEnergy, this.creatures.energy[i] + amount);
                            this.resources.amount[resIdx] -= amount;
                        } else {
                            this.creatures.intelligence[i] = Math.min(100, this.creatures.intelligence[i] + amount);
                            this.resources.amount[resIdx] -= amount;
                            this.totalDataConsumed += amount;

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
                this.creatures.velX[i] *= 0.95;
                this.creatures.velY[i] *= 0.95;
            }
        }
    }

    render() {
        if (this.camera) {
            this.renderer.update(this.camera, this.creatures, this.resources);
        }
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
            this.updateGlobalStats();
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

/**
 * Canvas Game - Life Simulation with Hubs and Nodlets
 * EZ Space - Tactical Cyberpunk Edition
 */

import { HubSystem } from './HubSystem.js';
import { NodletSystem } from './NodletSystem.js';
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
        this.hubs = new HubSystem(100);
        this.nodlets = new NodletSystem(10000);
        this.resources = new ResourceSystem(2000);

        this.camera = null;
        this.input = null;

        this.lastFrameTime = performance.now();
        this.updateAccumulator = 0;
        this.fixedTimeStep = 1 / 60;

        this.selectedNodletIndex = -1;
        this.totalDataConsumed = 0;

        this.upgrades = new UpgradeSystem();

        this.init();
    }

    async init() {
        await this.renderer.init(this.container);

        const newCanvas = this.renderer.app.canvas;
        newCanvas.setAttribute('role', 'img');
        newCanvas.setAttribute('aria-label', 'Simulation Canvas');
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

        this.spawnInitialHubs();
        this.spawnInitialResources();
        this.gameLoop();
    }

    spawnInitialHubs() {
        const centerX = this.world.width / 2;
        const centerY = this.world.height / 2;
        this.hubs.spawn(centerX, centerY);
    }

    spawnInitialResources() {
        // Data Filling
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

    clearNodletSelection() {
        this.selectedNodletIndex = -1;
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.remove('hidden');
        if (details) details.classList.add('hidden');
    }

    updateNodletStatus(nodletIndex) {
        const empty = document.getElementById('creature-empty');
        const details = document.getElementById('creature-details');
        if (empty) empty.classList.add('hidden');
        if (details) details.classList.remove('hidden');

        if (nodletIndex < 0 || nodletIndex >= this.nodlets.count) return;

        this.selectedNodletIndex = nodletIndex;

        const stateEl = document.getElementById('creatureState');
        const ageEl = document.getElementById('creatureAge');
        const energyContainer = document.getElementById('energyItem'); // Assuming we hide this later in HTML
        if (energyContainer) energyContainer.style.display = 'none';

        const dataCountEl = document.getElementById('creatureIntelligence');
        const intentEl = document.getElementById('creatureIntent');

        const state = this.nodlets.state[nodletIndex];
        const stateLabels = ['Seeking Data', 'Returning to Hub'];

        stateEl.textContent = state === 1 ? 'Returning' : 'Seeking';
        stateEl.className = `status-state ${state === 1 ? 'charging' : 'wandering'}`;

        ageEl.textContent = Math.round(this.nodlets.age[nodletIndex]) + 's';
        intentEl.textContent = stateLabels[state] || 'None';

        // Repurposing Intelligence UI for Data Carrying Capacity
        dataCountEl.textContent = Math.round(this.nodlets.carriedData[nodletIndex]) + ' / ' + Math.round(this.nodlets.maxDataCapacity[nodletIndex]);
    }

    updateCounts() {
        const countEl = document.getElementById('creatureCount');
        if (countEl) countEl.textContent = this.nodlets.count;
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

        this.nodlets.forEachNeighbor(worldPos.x, worldPos.y, 50, (idx) => {
            const dx = this.nodlets.posX[idx] - worldPos.x;
            const dy = this.nodlets.posY[idx] - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearestIndex = idx;
            }
        });

        if (nearestIndex !== -1) {
            this.updateNodletStatus(nearestIndex);
        } else {
            this.clearNodletSelection();
        }
    }

    update(deltaTime) {
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

        // Just maintain 500 data points on screen loosely
        if (this.resources.count < 500 && Math.random() < 0.1) {
            this.resources.spawnData(
                Math.random() * this.world.width,
                Math.random() * this.world.height
            );
        }

        this.nodlets.update(deltaTime, this.world);
        this.resources.update(deltaTime, this.world, 0); // energy reset rate 0

        // Hub Loop
        for (let i = 0; i < this.hubs.count; i++) {
            // Count active nodlets
            let active = 0;
            for (let j = 0; j < this.nodlets.count; j++) {
                if (this.nodlets.hubId[j] === i) active++;
            }
            this.hubs.activeNodlets[i] = active;

            // Spawn to reach capacity
            if (active < this.hubs.baseNodletCapacity[i]) {
                const angle = Math.random() * Math.PI * 2;
                const r = this.hubs.size[i];
                const nx = this.hubs.posX[i] + Math.cos(angle) * r;
                const ny = this.hubs.posY[i] + Math.sin(angle) * r;
                this.nodlets.spawn(nx, ny, i, this.hubs.color[i]);
            }
        }

        // Nodlet Loop
        for (let i = 0; i < this.nodlets.count; i++) {
            const cx = this.nodlets.posX[i];
            const cy = this.nodlets.posY[i];
            const state = this.nodlets.state[i];
            const carriedData = this.nodlets.carriedData[i];
            const maxCarry = this.nodlets.maxDataCapacity[i];
            const hubIdx = this.nodlets.hubId[i];

            if (state === 0) { // Seeking Data
                if (carriedData >= maxCarry) {
                    this.nodlets.state[i] = 1;
                    continue;
                }

                let closestDistSq = 500 * 500;
                let targetResIdx = -1;

                this.resources.forEachNeighbor(cx, cy, 500, (resIdx) => {
                    if (this.resources.type[resIdx] !== 1) return; // Need data (type 1)
                    if (this.resources.amount[resIdx] <= 0) return;

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
                    const resIdx = targetResIdx;
                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;

                    if (closestDistSq < 900) { // Harvest range
                        const bite = 50 * deltaTime;
                        const amountToTake = Math.min(this.resources.amount[resIdx], bite, maxCarry - carriedData);

                        this.nodlets.carriedData[i] += amountToTake;
                        this.resources.amount[resIdx] -= amountToTake;

                        if (this.resources.amount[resIdx] <= 0) {
                            this.resources.despawn(resIdx);
                        }

                        this.nodlets.velX[i] *= 0.8;
                        this.nodlets.velY[i] *= 0.8;
                    } else { // Move towards
                        const dist = Math.sqrt(closestDistSq);
                        const force = (1.0 - dist / 500) * 45 * deltaTime;
                        this.nodlets.velX[i] += (dx / dist) * force;
                        this.nodlets.velY[i] += (dy / dist) * force;
                    }
                } else { // Wander
                    this.nodlets.wanderTimer[i] -= deltaTime;
                    if (this.nodlets.wanderTimer[i] <= 0) {
                        this.nodlets.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                        this.nodlets.wanderTimer[i] = 1 + Math.random() * 2;
                    }
                    const speed = 50;
                    this.nodlets.velX[i] += (Math.cos(this.nodlets.wanderAngle[i]) * speed - this.nodlets.velX[i]) * 0.1;
                    this.nodlets.velY[i] += (Math.sin(this.nodlets.wanderAngle[i]) * speed - this.nodlets.velY[i]) * 0.1;
                }
            } else if (state === 1) { // Returning to Hub
                const hx = this.hubs.posX[hubIdx];
                const hy = this.hubs.posY[hubIdx];
                const dx = hx - cx;
                const dy = hy - cy;
                const distSq = dx * dx + dy * dy;

                if (distSq < this.hubs.size[hubIdx] * this.hubs.size[hubIdx]) {
                    // Deposit Data
                    this.hubs.depositData(hubIdx, carriedData);
                    this.totalDataConsumed += carriedData;
                    this.nodlets.carriedData[i] = 0;
                    this.nodlets.state[i] = 0;
                    this.nodlets.velX[i] *= 0.1;
                    this.nodlets.velY[i] *= 0.1;
                } else {
                    const dist = Math.sqrt(distSq);
                    const force = 60 * deltaTime;
                    this.nodlets.velX[i] += (dx / dist) * force;
                    this.nodlets.velY[i] += (dy / dist) * force;

                    // Cap speed
                    const currentSpeed = Math.sqrt(this.nodlets.velX[i] * this.nodlets.velX[i] + this.nodlets.velY[i] * this.nodlets.velY[i]);
                    if (currentSpeed > 100) {
                        this.nodlets.velX[i] = (this.nodlets.velX[i] / currentSpeed) * 100;
                        this.nodlets.velY[i] = (this.nodlets.velY[i] / currentSpeed) * 100;
                    }
                }
            }
        }
    }

    render() {
        if (this.camera) {
            this.renderer.update(this.camera, this.hubs, this.nodlets, this.resources);
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

        if (Math.random() < 0.05) {
            this.updateCounts();
            this.updateGlobalStats();
            if (this.selectedNodletIndex >= 0) {
                this.updateNodletStatus(this.selectedNodletIndex);
            }
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new CanvasGame();
});

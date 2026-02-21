/**
 * Canvas Game - Life Simulation with Hubs, Nodlets, and Servers
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
        this.spawnInitialServers();
        this.gameLoop();
    }

    spawnInitialHubs() {
        const centerX = this.world.width / 2;
        const centerY = this.world.height / 2;
        this.hubs.spawn(centerX, centerY);
    }

    spawnInitialServers() {
        // Spawn 30 servers randomly around the map
        for (let i = 0; i < 30; i++) {
            const x = 500 + Math.random() * (this.world.width - 1000);
            const y = 500 + Math.random() * (this.world.height - 1000);
            this.resources.spawnServer(x, y, 2000 + Math.random() * 2000);
        }
    }

    // Modal UI handled via HTML/CSS layout (to be implemented next)
    bindUpgradeEvents() {
        const btn = document.getElementById('upgradeBtn');
        const modal = document.getElementById('upgradeModal');
        const closeBtn = document.getElementById('closeModalBtn'); // Assuming we add this

        if (btn) {
            btn.addEventListener('click', () => {
                this.renderUpgradeTree();
                modal.classList.remove('hidden');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
    }

    renderUpgradeTree() {
        // This will bind to the new HTML layout
        const ptsEl = document.getElementById('availablePoints');
        if (ptsEl) ptsEl.textContent = this.upgrades.availablePoints;

        // Tier 1 UI
        const t1Keys = ['capacity', 'speed', 'influence', 'amount'];
        t1Keys.forEach(k => {
            const btn = document.getElementById(`btn_${this.upgrades.tree.tier1.nodes[k].id}`);
            if (btn) {
                const node = this.upgrades.tree.tier1.nodes[k];
                if (node.unlocked) {
                    btn.className = "node unlocked";
                    btn.onclick = null;
                } else if (!this.upgrades.tree.tier1.unlocked) {
                    btn.className = "node locked";
                    btn.onclick = null;
                } else {
                    btn.className = "node available";
                    btn.onclick = () => {
                        if (this.upgrades.buyUpgrade('tier1', k)) {
                            this.renderUpgradeTree();
                        }
                    };
                }
                btn.title = `${node.name}\nCost: ${node.cost} pt(s)\n${node.desc}`;
            }
        });

        // Tier 2 UI
        const t2Keys = ['capacity', 'speed', 'influence', 'amount'];
        t2Keys.forEach(k => {
            const btn = document.getElementById(`btn_${this.upgrades.tree.tier2.nodes[k].id}`);
            if (btn) {
                const node = this.upgrades.tree.tier2.nodes[k];
                if (node.unlocked) {
                    btn.className = "node unlocked";
                    btn.onclick = null;
                } else if (!this.upgrades.tree.tier2.unlocked) {
                    btn.className = "node locked";
                    btn.onclick = null;
                } else {
                    btn.className = "node available";
                    btn.onclick = () => {
                        if (this.upgrades.buyUpgrade('tier2', k)) {
                            this.renderUpgradeTree();
                        }
                    };
                }
                btn.title = `${node.name}\nCost: ${node.cost} pt(s)\n${node.desc}`;
            }
        });
    }

    updateZoomDisplay() {
        if (this.camera) {
            document.getElementById('zoomValue').textContent =
                Math.round(this.camera.zoom * 100) + '%';
        }
    }

    clearSelection() {
        this.selectedNodletIndex = -1;
        this.selectedServerIndex = -1;
        const empty = document.getElementById('entity-empty');
        const nDetails = document.getElementById('creature-details');
        const sDetails = document.getElementById('server-details');
        if (empty) empty.classList.remove('hidden');
        if (nDetails) nDetails.classList.add('hidden');
        if (sDetails) sDetails.classList.add('hidden');
    }

    updateNodletStatus(nodletIndex) {
        const empty = document.getElementById('entity-empty');
        const nDetails = document.getElementById('creature-details');
        const sDetails = document.getElementById('server-details');
        if (empty) empty.classList.add('hidden');
        if (sDetails) sDetails.classList.add('hidden');
        if (nDetails) nDetails.classList.remove('hidden');

        if (nodletIndex < 0 || nodletIndex >= this.nodlets.count) return;

        this.selectedNodletIndex = nodletIndex;

        const stateEl = document.getElementById('creatureState');
        const dataCountEl = document.getElementById('creatureIntelligence');
        const intentEl = document.getElementById('creatureIntent');

        const state = this.nodlets.state[nodletIndex];
        const stateLabels = ['Seeking Data', 'Returning to Hub'];

        if (stateEl) {
            stateEl.textContent = state === 1 ? 'Returning' : 'Seeking';
            stateEl.className = `status-state ${state === 1 ? 'charging' : 'wandering'}`;
        }

        if (intentEl) {
            intentEl.textContent = stateLabels[state] || 'None';
        }

        dataCountEl.textContent = Math.round(this.nodlets.carriedData[nodletIndex]) + ' / ' + Math.round(this.nodlets.maxDataCapacity[nodletIndex]);
    }

    updateCounts() {
        const countEl = document.getElementById('creatureCount');
        if (countEl) countEl.textContent = this.nodlets.count;
    }

    updateGlobalStats() {
        const dataEl = document.getElementById('totalDataConsumed');
        if (dataEl) dataEl.textContent = Math.floor(this.upgrades.totalDataEarned);

        const pointsEl = document.getElementById('pointsHUD'); // Add this to HTML
        if (pointsEl) pointsEl.textContent = this.upgrades.availablePoints;
    }

    updateServerStatus(serverIndex) {
        const empty = document.getElementById('entity-empty');
        const nDetails = document.getElementById('creature-details');
        const sDetails = document.getElementById('server-details');
        if (empty) empty.classList.add('hidden');
        if (nDetails) nDetails.classList.add('hidden');
        if (sDetails) sDetails.classList.remove('hidden');

        if (serverIndex < 0 || serverIndex >= this.resources.count) return;
        this.selectedServerIndex = serverIndex;

        const amtEl = document.getElementById('serverDataAmount');
        const maxEl = document.getElementById('serverDataMax');

        amtEl.textContent = Math.floor(this.resources.amount[serverIndex]);
        maxEl.textContent = Math.floor(this.resources.maxAmount[serverIndex]);
    }

    handleCanvasClick(sx, sy) {
        if (!this.camera) return;
        const worldPos = this.camera.screenToWorld(sx, sy);

        let nearestNodlet = -1;
        let minDistNodlet = 30 / this.camera.zoom;

        let nearestServer = -1;
        let minDistServer = 60 / this.camera.zoom; // Servers are larger

        // Check Servers first
        this.resources.forEachNeighbor(worldPos.x, worldPos.y, 100, (idx) => {
            if (this.resources.type[idx] !== 0) return; // Only click servers
            const dx = this.resources.posX[idx] - worldPos.x;
            const dy = this.resources.posY[idx] - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistServer) {
                minDistServer = dist;
                nearestServer = idx;
            }
        });

        // Check Nodlets
        this.nodlets.forEachNeighbor(worldPos.x, worldPos.y, 50, (idx) => {
            const dx = this.nodlets.posX[idx] - worldPos.x;
            const dy = this.nodlets.posY[idx] - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistNodlet) {
                minDistNodlet = dist;
                nearestNodlet = idx;
            }
        });

        if (nearestServer !== -1) {
            this.clearSelection();
            this.updateServerStatus(nearestServer);
        } else if (nearestNodlet !== -1) {
            this.clearSelection();
            this.updateNodletStatus(nearestNodlet);
        } else {
            this.clearSelection();
        }
    }

    update(deltaTime) {
        // Upgrade button logic
        const btn = document.getElementById('upgradeBtn');
        if (btn) {
            if (this.upgrades.availablePoints > 0) {
                btn.classList.add('can-upgrade'); // visual cue to be styled
            } else {
                btn.classList.remove('can-upgrade');
            }
        }

        // Spawn Packets periodically
        // Get all server indices
        const serverIndices = [];
        for (let i = 0; i < this.resources.count; i++) {
            if (this.resources.type[i] === 0 && this.resources.amount[i] > 50) {
                serverIndices.push(i);
            }
        }

        if (serverIndices.length >= 2 && Math.random() < 0.1) {
            // Pick two distinct servers
            const s1 = serverIndices[Math.floor(Math.random() * serverIndices.length)];
            let s2 = serverIndices[Math.floor(Math.random() * serverIndices.length)];
            while (s1 === s2) {
                s2 = serverIndices[Math.floor(Math.random() * serverIndices.length)];
            }

            // Spawn packet
            const chunk = 20 + Math.random() * 30;
            this.resources.amount[s1] -= chunk;
            this.resources.spawnPacket(
                this.resources.posX[s1], this.resources.posY[s1],
                this.resources.posX[s2], this.resources.posY[s2],
                chunk
            );
        }

        this.nodlets.update(deltaTime, this.world);
        this.resources.update(deltaTime, this.world);

        // Core Hub and Upgrades sync
        const baseInfluence = 500;
        const currentInfluence = baseInfluence + this.upgrades.perks.hubInfluenceRadiusBoost;
        const maxNodlets = 10 + this.upgrades.perks.nodletAmountBoost;
        const globalNodletCap = 8 + this.upgrades.perks.nodletCapacityBoost;

        for (let i = 0; i < this.hubs.count; i++) {
            this.hubs.baseNodletCapacity[i] = maxNodlets;
            let active = 0;
            for (let j = 0; j < this.nodlets.count; j++) {
                if (this.nodlets.hubId[j] === i) active++;
            }
            this.hubs.activeNodlets[i] = active;

            if (active < this.hubs.baseNodletCapacity[i]) {
                const angle = Math.random() * Math.PI * 2;
                const r = this.hubs.size[i];
                const nx = this.hubs.posX[i] + Math.cos(angle) * r;
                const ny = this.hubs.posY[i] + Math.sin(angle) * r;
                const nIdx = this.nodlets.spawn(nx, ny, i, this.hubs.color[i]);
                if (nIdx !== -1) {
                    this.nodlets.maxDataCapacity[nIdx] = globalNodletCap;
                }
            }
        }

        // Nodlet AI
        const MAX_WANDER_SPEED = 50 * this.upgrades.perks.nodletSpeedMult;
        const MAX_RETURN_SPEED = 100 * this.upgrades.perks.nodletSpeedMult;

        for (let i = 0; i < this.nodlets.count; i++) {
            // Force capacity update immediately from tree
            this.nodlets.maxDataCapacity[i] = globalNodletCap;

            const cx = this.nodlets.posX[i];
            const cy = this.nodlets.posY[i];
            const state = this.nodlets.state[i];
            const carriedData = this.nodlets.carriedData[i];
            const maxCarry = this.nodlets.maxDataCapacity[i];
            const hubIdx = this.nodlets.hubId[i];

            const hx = this.hubs.posX[hubIdx];
            const hy = this.hubs.posY[hubIdx];

            if (state === 0) { // Seeking Data
                if (carriedData >= maxCarry) {
                    this.nodlets.state[i] = 1;
                    continue;
                }

                // Check collisions with packets or servers
                let closestDistSq = 500 * 500;
                let targetResIdx = -1;

                this.resources.forEachNeighbor(cx, cy, 500, (resIdx) => {
                    if (this.resources.amount[resIdx] <= 0) return;

                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;
                    const distSq = dx * dx + dy * dy;

                    // If it's a Packet (type 1), check for immediate collision
                    if (this.resources.type[resIdx] === 1 && distSq < 1000) { // roughly 30px distance
                        const take = Math.min(this.resources.amount[resIdx], maxCarry - this.nodlets.carriedData[i]);
                        this.nodlets.carriedData[i] += take;
                        this.resources.despawn(resIdx);
                        if (this.nodlets.carriedData[i] >= maxCarry) {
                            this.nodlets.state[i] = 1; // Full!
                        }
                        return; // continue search
                    }

                    // Otherwise if it's a Server (type 0), lock onto closest
                    if (this.resources.type[resIdx] === 0 && distSq < closestDistSq) {
                        closestDistSq = distSq;
                        targetResIdx = resIdx;
                    }
                });

                // If still seeking and found a server
                if (this.nodlets.state[i] === 0 && targetResIdx !== -1) {
                    const resIdx = targetResIdx;
                    const rx = this.resources.posX[resIdx];
                    const ry = this.resources.posY[resIdx];
                    const dx = rx - cx;
                    const dy = ry - cy;

                    if (closestDistSq < 1600) { // Harvest range from server (40px)
                        const bite = 20 * deltaTime;
                        const amountToTake = Math.min(this.resources.amount[resIdx], bite, maxCarry - carriedData);

                        this.nodlets.carriedData[i] += amountToTake;
                        this.resources.amount[resIdx] -= amountToTake;

                        this.nodlets.velX[i] *= 0.8;
                        this.nodlets.velY[i] *= 0.8;
                    } else { // Move towards server
                        const dist = Math.sqrt(closestDistSq);
                        const force = (1.0 - dist / 500) * 45 * deltaTime;

                        // BUT only if moving towards it doesn't leave the influence zone!
                        const dHubX = (rx) - hx;
                        const dHubY = (ry) - hy;
                        if (dHubX * dHubX + dHubY * dHubY <= currentInfluence * currentInfluence) {
                            this.nodlets.velX[i] += (dx / dist) * force * this.upgrades.perks.nodletSpeedMult;
                            this.nodlets.velY[i] += (dy / dist) * force * this.upgrades.perks.nodletSpeedMult;
                        } else {
                            // Target server is outside influence zone, ignore it and wander
                            targetResIdx = -1;
                        }
                    }
                }

                if (targetResIdx === -1) { // Wander
                    this.nodlets.wanderTimer[i] -= deltaTime;
                    if (this.nodlets.wanderTimer[i] <= 0) {
                        this.nodlets.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                        this.nodlets.wanderTimer[i] = 1 + Math.random() * 2;
                    }

                    // Constrain wander within Influence zone
                    let wanderVx = Math.cos(this.nodlets.wanderAngle[i]) * MAX_WANDER_SPEED;
                    let wanderVy = Math.sin(this.nodlets.wanderAngle[i]) * MAX_WANDER_SPEED;

                    const dHubX = (cx + wanderVx * deltaTime) - hx;
                    const dHubY = (cy + wanderVy * deltaTime) - hy;

                    if (dHubX * dHubX + dHubY * dHubY > currentInfluence * currentInfluence) {
                        // Point back to hub
                        this.nodlets.wanderAngle[i] = Math.atan2(hy - cy, hx - cx);
                        wanderVx = Math.cos(this.nodlets.wanderAngle[i]) * MAX_WANDER_SPEED;
                        wanderVy = Math.sin(this.nodlets.wanderAngle[i]) * MAX_WANDER_SPEED;
                    }

                    this.nodlets.velX[i] += (wanderVx - this.nodlets.velX[i]) * 0.1;
                    this.nodlets.velY[i] += (wanderVy - this.nodlets.velY[i]) * 0.1;
                }
            } else if (state === 1) { // Returning to Hub
                const dx = hx - cx;
                const dy = hy - cy;
                const distSq = dx * dx + dy * dy;

                if (distSq < this.hubs.size[hubIdx] * this.hubs.size[hubIdx]) {
                    // Deposit Data
                    this.upgrades.addTotalData(carriedData); // Adds to global pool and point pool
                    this.hubs.depositData(hubIdx, carriedData); // Adds to XP
                    this.nodlets.carriedData[i] = 0;
                    this.nodlets.state[i] = 0;
                    this.nodlets.velX[i] *= 0.1;
                    this.nodlets.velY[i] *= 0.1;

                    // Cap speed on return just in case
                } else {
                    const dist = Math.sqrt(distSq);

                    // Desired velocity pointing directly at the hub
                    const targetVx = (dx / dist) * MAX_RETURN_SPEED;
                    const targetVy = (dy / dist) * MAX_RETURN_SPEED;

                    // Interpolate current velocity towards target velocity
                    // This naturally smooths the curve and kills orbital momentum
                    const turnSpeed = 4.0; // Higher = tighter turns
                    this.nodlets.velX[i] += (targetVx - this.nodlets.velX[i]) * turnSpeed * deltaTime;
                    this.nodlets.velY[i] += (targetVy - this.nodlets.velY[i]) * turnSpeed * deltaTime;
                }
            }

            // Hard clamp to influence zone (Wall)
            const dxToHub = this.nodlets.posX[i] - hx;
            const dyToHub = this.nodlets.posY[i] - hy;
            const distToHubSq = dxToHub * dxToHub + dyToHub * dyToHub;

            if (distToHubSq > currentInfluence * currentInfluence) {
                const distToHub = Math.sqrt(distToHubSq);
                // Clamp position to exactly the radius
                this.nodlets.posX[i] = hx + (dxToHub / distToHub) * currentInfluence;
                this.nodlets.posY[i] = hy + (dyToHub / distToHub) * currentInfluence;

                // Bounce velocities to prevent getting stuck pushing against the wall
                this.nodlets.velX[i] *= -0.8;
                this.nodlets.velY[i] *= -0.8;

                // If wandering, turn them around immediately
                if (state === 0) {
                    this.nodlets.wanderAngle[i] = Math.atan2(hy - this.nodlets.posY[i], hx - this.nodlets.posX[i]);
                }
            }
        } // End of Nodlets AI loop
    }

    render() {
        if (this.camera) {
            this.renderer.update(this.camera, this.hubs, this.nodlets, this.resources, {
                influence: 500 + this.upgrades.perks.hubInfluenceRadiusBoost
            });
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
            if (this.selectedServerIndex >= 0) {
                this.updateServerStatus(this.selectedServerIndex);
            }
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new CanvasGame();
});

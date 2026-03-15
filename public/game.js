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
        this.selectedServerIndex = -1;
        this.activeTargetServer = -1; // Global Target

        this.upgrades = new UpgradeSystem();

        // Pre-allocated arrays for spawn packets to avoid GC overhead
        this.generatorIndices = new Int32Array(this.resources.maxResources);
        this.relayIndices = new Int32Array(this.resources.maxResources);
        this.allServers = new Int32Array(this.resources.maxResources);

        // Pre-allocated array of arrays for spatial grid optimization
        this.hubTargets = Array.from({ length: this.hubs.maxHubs }, () => new Int32Array(this.resources.maxResources));
        this.hubTargetsCount = new Int32Array(this.hubs.maxHubs);

        // Pre-allocated array for retrieving neighbors without closure allocations
        this.tempNeighbors = new Int32Array(this.resources.maxResources);

        // Performance tracking for upgrades
        this._lastGlobalNodletCap = -1;
        this._lastNodletCount = 0;


        // DOM Element Cache
        this.ui = {};

        this.init();
    }

    cacheUIElements() {
        this.ui.upgradeBtn = document.getElementById('upgradeBtn');
        this.ui.upgradeModal = document.getElementById('upgradeModal');
        this.ui.closeModalBtn = document.getElementById('closeModalBtn');
        this.ui.setTargetBtn = document.getElementById('setTargetBtn');
        this.ui.availablePoints = document.getElementById('availablePoints');

        this.ui.mainStatusPanel = document.getElementById('mainStatusPanel');
        this.ui.nDetails = document.getElementById('creature-details');
        this.ui.sDetails = document.getElementById('server-details');

        this.ui.creatureState = document.getElementById('creatureState');
        this.ui.creatureIntelligence = document.getElementById('creatureIntelligence');
        this.ui.creatureIntent = document.getElementById('creatureIntent');

        this.ui.creatureCount = document.getElementById('creatureCount');
        this.ui.totalDataConsumed = document.getElementById('totalDataConsumed');
        this.ui.pointsHUD = document.getElementById('pointsHUD');

        this.ui.serverTypeLabel = document.getElementById('serverTypeLabel');
        this.ui.serverDataAmount = document.getElementById('serverDataAmount');
        this.ui.serverDataMax = document.getElementById('serverDataMax');

        this.ui.tier1Btns = {};
        const t1Keys = ['capacity', 'speed', 'influence', 'amount'];
        t1Keys.forEach(k => {
            this.ui.tier1Btns[k] = document.getElementById(`btn_${this.upgrades.tree.tier1.nodes[k].id}`);
        });

        this.ui.tier2Btns = {};
        const t2Keys = ['capacity', 'speed', 'influence', 'amount'];
        t2Keys.forEach(k => {
            this.ui.tier2Btns[k] = document.getElementById(`btn_${this.upgrades.tree.tier2.nodes[k].id}`);
        });
    }

    async init() {
        this.cacheUIElements();

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
            () => {},
            (sx, sy) => this.handleCanvasClick(sx, sy)
        );

        this.bindUpgradeEvents();

        this.spawnInitialHubs();
        this.spawnInitialServers();
        this.bindTargetEvent();

        // Handle screen resizing
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer && this.renderer.app.screen) {
                // The renderer resizes automatically because of 'resizeTo: container'
                // We just need to ensure the camera object knows the new screen size
                // if it caches it. (Looking at Camera.js, it might need updates or it just uses getter)
            }
        });

        this.gameLoop();

    }

    spawnInitialHubs() {
        const centerX = this.world.width / 2;
        const centerY = this.world.height / 2;
        this.hubs.spawn(centerX, centerY);
    }

    spawnInitialServers() {
        // Spawn exactly 10 Generators (type 0) and 20 Relays (type 1)
        for (let i = 0; i < 30; i++) {
            const x = 500 + Math.random() * (this.world.width - 1000);
            const y = 500 + Math.random() * (this.world.height - 1000);
            const amount = 2000 + Math.random() * 2000;
            const type = i < 10 ? 0 : 1; // 10 Generators, 20 Relays
            this.resources.spawnServer(x, y, amount, type);
        }
    }

    // Modal UI handled via HTML/CSS layout (to be implemented next)
    bindUpgradeEvents() {
        if (this.ui.upgradeBtn) {
            this.ui.upgradeBtn.addEventListener('click', () => {
                this.renderUpgradeTree();
                if (this.ui.upgradeModal) this.ui.upgradeModal.classList.remove('hidden');
            });
        }

        if (this.ui.closeModalBtn) {
            this.ui.closeModalBtn.addEventListener('click', () => {
                if (this.ui.upgradeModal) this.ui.upgradeModal.classList.add('hidden');
            });
        }
    }

    bindTargetEvent() {
        if (this.ui.setTargetBtn) {
            this.ui.setTargetBtn.addEventListener('click', () => {
                if (this.selectedServerIndex !== -1) {
                    if (this.activeTargetServer === this.selectedServerIndex) {
                        this.activeTargetServer = -1; // Deselect
                        console.log("Target Cleared");
                    } else {
                        this.activeTargetServer = this.selectedServerIndex; // Select
                        console.log("Target Locked:", this.activeTargetServer);
                    }
                    this.updateServerStatus(this.selectedServerIndex); // Force UI update
                }
            });
        }
    }

    renderUpgradeTree() {
        // This will bind to the new HTML layout
        if (this.ui.availablePoints) this.ui.availablePoints.textContent = this.upgrades.availablePoints;

        // Tier 1 UI
        const t1Keys = ['capacity', 'speed', 'influence', 'amount'];
        t1Keys.forEach(k => {
            const btn = this.ui.tier1Btns[k];
            if (btn) {
                const node = this.upgrades.tree.tier1.nodes[k];
                btn.textContent = node.icon || "?";
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
            const btn = this.ui.tier2Btns[k];
            if (btn) {
                const node = this.upgrades.tree.tier2.nodes[k];
                btn.textContent = node.icon || "?";
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

    clearSelection() {
        this.selectedNodletIndex = -1;
        this.selectedServerIndex = -1;

        if (this.ui.mainStatusPanel) this.ui.mainStatusPanel.classList.add('hidden');
        if (this.ui.nDetails) this.ui.nDetails.classList.add('hidden');
        if (this.ui.sDetails) this.ui.sDetails.classList.add('hidden');
    }

    updateNodletStatus(nodletIndex) {
        if (this.ui.mainStatusPanel) this.ui.mainStatusPanel.classList.remove('hidden');
        if (this.ui.sDetails) this.ui.sDetails.classList.add('hidden');
        if (this.ui.nDetails) this.ui.nDetails.classList.remove('hidden');

        if (nodletIndex < 0 || nodletIndex >= this.nodlets.count) return;

        this.selectedNodletIndex = nodletIndex;

        const state = this.nodlets.state[nodletIndex];
        const stateLabels = ['Seeking Data', 'Returning to Hub'];

        if (this.ui.creatureState) {
            this.ui.creatureState.textContent = state === 1 ? 'Returning' : 'Seeking';
            this.ui.creatureState.className = `status-state ${state === 1 ? 'charging' : 'wandering'}`;
        }

        if (this.ui.creatureIntent) {
            this.ui.creatureIntent.textContent = stateLabels[state] || 'None';
        }

        if (this.ui.creatureIntelligence) {
            this.ui.creatureIntelligence.textContent = Math.round(this.nodlets.carriedData[nodletIndex]) + ' / ' + Math.round(this.nodlets.maxDataCapacity[nodletIndex]);
        }
    }

    updateCounts() {
        if (this.ui.creatureCount) this.ui.creatureCount.textContent = this.nodlets.count;
    }

    updateGlobalStats() {
        if (this.ui.totalDataConsumed) this.ui.totalDataConsumed.textContent = Math.floor(this.upgrades.totalDataEarned);
        if (this.ui.pointsHUD) this.ui.pointsHUD.textContent = this.upgrades.availablePoints;
    }

    updateServerStatus(serverIndex) {
        if (this.ui.mainStatusPanel) this.ui.mainStatusPanel.classList.remove('hidden');
        if (this.ui.nDetails) this.ui.nDetails.classList.add('hidden');
        if (this.ui.sDetails) this.ui.sDetails.classList.remove('hidden');

        if (serverIndex < 0 || serverIndex >= this.resources.count) return;
        this.selectedServerIndex = serverIndex;

        if (this.ui.serverTypeLabel) {
            this.ui.serverTypeLabel.textContent = this.resources.type[serverIndex] === 0 ? 'Generator' : 'Relay';
            this.ui.serverTypeLabel.style.color = this.resources.type[serverIndex] === 0 ? '#ff00ff' : '#00F3FF'; // Purple vs Cyan
        }

        if (this.ui.serverDataAmount) this.ui.serverDataAmount.textContent = Math.floor(this.resources.amount[serverIndex]);
        if (this.ui.serverDataMax) this.ui.serverDataMax.textContent = Math.floor(this.resources.maxAmount[serverIndex]);

        // Hide targeting button if outside influence radius
        if (this.ui.setTargetBtn) {
            const targetBtn = this.ui.setTargetBtn;
            const hx = this.hubs.posX[0]; // Assuming one main hub for now
            const hy = this.hubs.posY[0];
            const sx = this.resources.posX[serverIndex];
            const sy = this.resources.posY[serverIndex];
            const dx = sx - hx;
            const dy = sy - hy;
            const distSq = dx * dx + dy * dy;

            const currentInfluence = 500 + this.upgrades.perks.hubInfluenceRadiusBoost;

            if (distSq <= currentInfluence * currentInfluence) {
                targetBtn.style.display = 'block';
                if (this.activeTargetServer === serverIndex) {
                    targetBtn.textContent = 'REMOVE TARGET';
                    targetBtn.style.opacity = '1';
                    targetBtn.style.cursor = 'pointer';
                    targetBtn.style.background = 'linear-gradient(135deg, #ff0044, #ff6600)';
                } else {
                    targetBtn.textContent = 'SET AS TARGET';
                    targetBtn.style.opacity = '1';
                    targetBtn.style.cursor = 'pointer';
                    targetBtn.style.background = ''; // Revert to stylesheet default
                }
            } else {
                targetBtn.style.display = 'none';
            }
        }
    }

    handleCanvasClick(sx, sy) {
        if (!this.camera) return;
        const worldPos = this.camera.screenToWorld(sx, sy);

        let nearestNodlet = -1;
        let minDistNodlet = 30 / this.camera.zoom;

        let nearestServer = -1;
        let minDistServer = 60 / this.camera.zoom; // Servers are larger

        // Check Servers first
        const neighborCount = this.resources.getNeighbors(worldPos.x, worldPos.y, 100, this.tempNeighbors);

        for (let i = 0; i < neighborCount; i++) {
            const idx = this.tempNeighbors[i];
            if (this.resources.type[idx] !== 0 && this.resources.type[idx] !== 1) continue; // Only click generators or relays
            const dx = this.resources.posX[idx] - worldPos.x;
            const dy = this.resources.posY[idx] - worldPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistServer) {
                minDistServer = dist;
                nearestServer = idx;
            }
        }

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
            if (this.selectedServerIndex === nearestServer) {
                this.clearSelection();
            } else {
                this.clearSelection();
                this.updateServerStatus(nearestServer);
            }
        } else if (nearestNodlet !== -1) {
            if (this.selectedNodletIndex === nearestNodlet) {
                this.clearSelection();
            } else {
                this.clearSelection();
                this.updateNodletStatus(nearestNodlet);
            }
        } else {
            this.clearSelection();
        }
    }

    update(deltaTime) {
        // Upgrade button logic
        if (this.ui.upgradeBtn) {
            if (this.upgrades.availablePoints > 0) {
                this.ui.upgradeBtn.classList.add('can-upgrade'); // visual cue to be styled
            } else {
                this.ui.upgradeBtn.classList.remove('can-upgrade');
            }
        }

        // Spawn Packets periodically
        let genCount = 0;
        let relayCount = 0;
        let allCount = 0;

        for (let i = 0; i < this.resources.count; i++) {
            if (this.resources.amount[i] > 50) {
                if (this.resources.type[i] === 0) {
                    this.generatorIndices[genCount++] = i;
                    this.allServers[allCount++] = i;
                } else if (this.resources.type[i] === 1) {
                    this.relayIndices[relayCount++] = i;
                    this.allServers[allCount++] = i;
                }
            }
        }

        // Generators emit rarely (2% chance per frame)
        if (genCount > 0 && Math.random() < 0.1) {
            const s1 = this.generatorIndices[Math.floor(Math.random() * genCount)];
            // Pick a random target (any server)
            let s2 = this.allServers[Math.floor(Math.random() * allCount)];

            if (s1 !== s2) {
                const chunk = 20 + Math.random() * 30;
                this.resources.amount[s1] -= chunk;
                this.resources.spawnPacket(
                    this.resources.posX[s1], this.resources.posY[s1],
                    this.resources.posX[s2], this.resources.posY[s2],
                    chunk
                );
            }
        }

        // Relays emit frequently (15% chance per frame)
        if (relayCount > 0 && Math.random() < 0.25) {
            const s1 = this.relayIndices[Math.floor(Math.random() * relayCount)];
            // Pick a random target (any server)
            let s2 = this.allServers[Math.floor(Math.random() * allCount)];

            if (s1 !== s2) {
                const chunk = 20 + Math.random() * 30;
                this.resources.amount[s1] -= chunk;
                this.resources.spawnPacket(
                    this.resources.posX[s1], this.resources.posY[s1],
                    this.resources.posX[s2], this.resources.posY[s2],
                    chunk
                );
            }
        }

        this.nodlets.update(deltaTime, this.world);
        this.resources.update(deltaTime, this.world);

        // Core Hub and Upgrades sync
        const baseInfluence = 500;
        const currentInfluence = baseInfluence + this.upgrades.perks.hubInfluenceRadiusBoost;
        const maxNodlets = 10 + this.upgrades.perks.nodletAmountBoost;
        const globalNodletCap = 8 + this.upgrades.perks.nodletCapacityBoost;

        // Optimization: Replace O(Hubs * Nodlets) nested loop with two O(N) passes.
        // 1. Reset active counts and calculate capacity
        for (let i = 0; i < this.hubs.count; i++) {
            this.hubs.baseNodletCapacity[i] = maxNodlets;
            this.hubs.activeNodlets[i] = 0;
        }

        // 2. Count active nodlets per hub (O(Nodlets))
        for (let j = 0; j < this.nodlets.count; j++) {
            const hId = this.nodlets.hubId[j];
            if (hId >= 0 && hId < this.hubs.count) {
                this.hubs.activeNodlets[hId]++;
            }
        }

        // 3. Process Hub Spawning (O(Hubs))
        for (let i = 0; i < this.hubs.count; i++) {
            const active = this.hubs.activeNodlets[i];

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

        // ⚡ Bolt Optimization: Avoid redundant per-frame writes to TypedArrays for global upgrades.
        // Only update the entire nodlet array when the global cap actually changes or when nodlets are spawned/despawned.
        if (this._lastGlobalNodletCap !== globalNodletCap || this._lastNodletCount !== this.nodlets.count) {
            for (let i = 0; i < this.nodlets.count; i++) {
                this.nodlets.maxDataCapacity[i] = globalNodletCap;
            }
            this._lastGlobalNodletCap = globalNodletCap;
            this._lastNodletCount = this.nodlets.count;
        }

        // Nodlet AI
        const MAX_WANDER_SPEED = 50 * this.upgrades.perks.nodletSpeedMult;
        const MAX_RETURN_SPEED = 100 * this.upgrades.perks.nodletSpeedMult;

        // Optimization: Pre-calculate valid targets for each Hub using Spatial Grid to avoid O(Hubs * Resources) lookup
        // This turns a 200,000 iteration frame (100 hubs * 2k resources) into a fast spatial lookup.

        for(let h = 0; h < this.hubs.count; h++) {
            const hx = this.hubs.posX[h];
            const hy = this.hubs.posY[h];

            // Reuse pre-allocated arrays to avoid GC pressure
            const targets = this.hubTargets[h];
            let targetCount = 0;

            const neighborCount = this.resources.getNeighbors(hx, hy, currentInfluence, this.tempNeighbors);
            for (let i = 0; i < neighborCount; i++) {

                const r = this.tempNeighbors[i];
                if (this.resources.type[r] === 0 || this.resources.type[r] === 1) {
                    targets[targetCount++] = r;
                }
            }
            this.hubTargetsCount[h] = targetCount;
        }

        const force = 60 * deltaTime * this.upgrades.perks.nodletSpeedMult;
        const orbitSpeed = 150 * deltaTime * this.upgrades.perks.nodletSpeedMult;

        for (let i = 0; i < this.nodlets.count; i++) {
            const cx = this.nodlets.posX[i];
            const cy = this.nodlets.posY[i];
            const state = this.nodlets.state[i];
            const carriedData = this.nodlets.carriedData[i];
            const maxCarry = this.nodlets.maxDataCapacity[i];
            const hubIdx = this.nodlets.hubId[i];

            const hx = this.hubs.posX[hubIdx];
            const hy = this.hubs.posY[hubIdx];

            if (state === 0 || state === 2) { // Seeking or Orbiting Target Server
                if (carriedData >= maxCarry) {
                    this.nodlets.state[i] = 1; // Full, go home
                    continue;
                }

                // 1. Always check for Packet Collisions first
                let packetCaught = false;

                // ⚡ Bolt Optimization: Skip expensive spatial grid lookup if no packets exist
                if (this.resources.activePacketCount > 0) {
                    const neighborCount = this.resources.getNeighbors(cx, cy, 30, this.tempNeighbors);
                    for (let k = 0; k < neighborCount; k++) {

                        const resIdx = this.tempNeighbors[k];
                        if (this.resources.type[resIdx] === 2 && !packetCaught) { // Packet collision
                            const take = Math.min(this.resources.amount[resIdx], maxCarry - this.nodlets.carriedData[i]);
                            this.nodlets.carriedData[i] += take;
                            this.resources.despawn(resIdx);
                            packetCaught = true;
                        }
                    }
                }

                if (this.nodlets.carriedData[i] >= maxCarry) {
                    this.nodlets.state[i] = 1;
                    continue;
                }

                // 2. Movement Logic
                let targetId = this.activeTargetServer;

                // Validate Target Server (exists and is within influence)
                if (targetId !== -1) {
                    const tx = this.resources.posX[targetId];
                    const ty = this.resources.posY[targetId];
                    const dxToHub = tx - hx;
                    const dyToHub = ty - hy;
                    if (dxToHub * dxToHub + dyToHub * dyToHub > currentInfluence * currentInfluence) {
                        targetId = -1; // Target is outside influence zone, ignore it
                    }
                }

                // If no valid global target, pick a random server in range
                if (targetId === -1) {
                    const potentialTargets = this.hubTargets[hubIdx];
                    const count = this.hubTargetsCount[hubIdx];
                    if (count > 0) {
                        // Pick random valid server
                        targetId = potentialTargets[Math.floor(Math.random() * count)];
                    }
                }

                if (targetId !== -1) {
                    const tx = this.resources.posX[targetId];
                    const ty = this.resources.posY[targetId];
                    const dx = tx - cx;
                    const dy = ty - cy;
                    const distSq = dx * dx + dy * dy;

                    const orbitRadius = this.nodlets.orbitRadius[i];

                    if (distSq > orbitRadius * orbitRadius * 1.5) {
                        // Fly towards target
                        this.nodlets.state[i] = 0; // Seeking
                        const dist = Math.sqrt(distSq);
                        this.nodlets.velX[i] += (dx / dist) * force;
                        this.nodlets.velY[i] += (dy / dist) * force;
                    } else {
                        // Orbiting
                        this.nodlets.state[i] = 2; // Orbiting

                        // Perpendicular vector for orbit, factoring in user desired direction
                        const dir = this.nodlets.orbitDirection[i];
                        const pX = -dy * dir;
                        const pY = dx * dir;
                        const dist = Math.sqrt(distSq);

                        // Pull towards the exact orbit radius
                        const pullFactor = (dist - orbitRadius) * 0.1;
                        const pullX = (dx / dist) * pullFactor;
                        const pullY = (dy / dist) * pullFactor;

                        // Orbit speed (significantly faster as requested)
                        const tangentX = (pX / dist) * orbitSpeed;
                        const tangentY = (pY / dist) * orbitSpeed;

                        this.nodlets.velX[i] += tangentX + pullX;
                        this.nodlets.velY[i] += tangentY + pullY;

                        // Apply friction to keep orbit stable
                        this.nodlets.velX[i] *= 0.95;
                        this.nodlets.velY[i] *= 0.95;
                    }
                } else {
                    // WANDER EMULATOR (if absolutely no servers exist)
                    this.nodlets.state[i] = 0;
                    this.nodlets.wanderTimer[i] -= deltaTime;
                    if (this.nodlets.wanderTimer[i] <= 0) {
                        this.nodlets.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                        this.nodlets.wanderTimer[i] = 1 + Math.random() * 2;
                    }

                    // Constrain wander within Influence zone BEFORE moving
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
                influence: 500 + this.upgrades.perks.hubInfluenceRadiusBoost,
                activeTargetServer: this.activeTargetServer,
                selectedServerIndex: this.selectedServerIndex,
                selectedNodletIndex: this.selectedNodletIndex
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

// Add resize listener at the end of the file
window.addEventListener('resize', () => {
    // Redraw screen size or re-calculate camera dimensions if needed
});

/**
 * Canvas Game - Life Simulation with Creatures
 * EZ Space - Tactical Cyberpunk Edition
 */

import { CreatureSystem } from './CreatureSystem.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';

class CanvasGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.world = {
            width: 500000,
            height: 500000,
        };
        
        this.colors = {
            ground: '#1a0f28',
            grid: 'rgba(188, 19, 254, 0.2)',
            accent: '#00f3ff'
        };
        
        this.resizeCanvas();
        
        this.camera = new Camera(this.world, this.canvas);
        this.renderer = new Renderer(this.ctx, this.colors);
        this.creatures = new CreatureSystem(1000);
        this.input = new Input(this.canvas, this.camera, () => this.updateZoomDisplay());
        
        this.lastFrameTime = performance.now();
        this.updateAccumulator = 0;
        this.fixedTimeStep = 1 / 60;
        
        this.selectedCreatureIndex = -1;
        
        this.init();
    }
    
    init() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.spawnInitialCreatures();
        this.updateCreatureList();
        this.gameLoop();
    }
    
    spawnInitialCreatures() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            this.creatures.spawn(x, y);
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
    
    updateCreatureList() {
        const list = document.getElementById('creatureList');
        const count = document.getElementById('creatureCount');
        
        count.textContent = this.creatures.count;
        list.innerHTML = '';
        
        for (let i = 0; i < this.creatures.count; i++) {
            const item = document.createElement('div');
            item.className = 'creature-item';
            
            const colorInt = this.creatures.color[i];
            const r = (colorInt >> 24) & 0xFF;
            const g = (colorInt >> 16) & 0xFF;
            const b = (colorInt >> 8) & 0xFF;
            const color = `rgb(${r}, ${g}, ${b})`;
            
            const energy = Math.round(this.creatures.energy[i]);
            
            item.innerHTML = `
                <div class="creature-dot" style="background: ${color};"></div>
                <div class="creature-info">
                    <div class="creature-id">#${i + 1}</div>
                    <div class="creature-energy">Energy: ${energy}%</div>
                </div>
            `;
            
            const creatureIndex = i;
            item.addEventListener('click', () => {
                const x = this.creatures.posX[creatureIndex];
                const y = this.creatures.posY[creatureIndex];
                this.camera.focusOn(x, y, this.canvas);
                this.updateCreatureStatus(creatureIndex);
            });
            
            list.appendChild(item);
        }
    }
    
    update(deltaTime) {
        this.creatures.update(deltaTime, this.world);
    }
    
    render() {
        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawBackground(this.camera, this.world, this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.camera, this.world, this.canvas.width, this.canvas.height);
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
            this.updateCreatureList();
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

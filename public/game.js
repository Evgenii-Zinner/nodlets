/**
 * Canvas Game - Life Simulation with Creatures
 * EZ Space - Tactical Cyberpunk Edition
 * Data-Oriented Design: Flat arrays for efficient simulation
 */

class CreatureSystem {
    constructor(maxCreatures = 1000) {
        this.maxCreatures = maxCreatures;
        this.count = 0;
        
        // Flat arrays for creature data (Data-Oriented Design)
        this.posX = new Float32Array(maxCreatures);
        this.posY = new Float32Array(maxCreatures);
        this.velX = new Float32Array(maxCreatures);
        this.velY = new Float32Array(maxCreatures);
        this.size = new Float32Array(maxCreatures);
        this.energy = new Float32Array(maxCreatures);
        this.age = new Float32Array(maxCreatures);
        this.color = new Uint32Array(maxCreatures); // RGBA as single uint
        
        // Behavioral state (for future AI/thoughts)
        this.wanderAngle = new Float32Array(maxCreatures);
        this.wanderTimer = new Float32Array(maxCreatures);
        this.state = new Uint8Array(maxCreatures); // 0=idle, 1=wander, 2=seek, etc.
        
        // Performance tracking
        this.lastUpdateTime = performance.now();
    }
    
    spawn(x, y, worldHeight, groundLevel) {
        if (this.count >= this.maxCreatures) return -1;
        
        const idx = this.count++;
        const groundY = worldHeight * groundLevel;
        
        // Position on ground
        this.posX[idx] = x;
        this.posY[idx] = groundY - 20; // Just above ground
        
        // Random velocity
        this.velX[idx] = (Math.random() - 0.5) * 2;
        this.velY[idx] = 0;
        
        // Properties
        this.size[idx] = 10 + Math.random() * 10;
        this.energy[idx] = 100;
        this.age[idx] = 0;
        
        // Random color (neon theme)
        const colors = [0xBC13FEFF, 0x00F3FFFF, 0x00FF41FF, 0xFF10F0FF];
        this.color[idx] = colors[Math.floor(Math.random() * colors.length)];
        
        // Behavior
        this.wanderAngle[idx] = Math.random() * Math.PI * 2;
        this.wanderTimer[idx] = Math.random() * 3;
        this.state[idx] = 1; // Start wandering
        
        return idx;
    }
    
    update(deltaTime, world) {
        const groundY = world.height * world.groundLevel;
        
        for (let i = 0; i < this.count; i++) {
            // Update age
            this.age[i] += deltaTime;
            
            // Update wander behavior
            if (this.state[i] === 1) { // Wandering
                this.wanderTimer[i] -= deltaTime;
                
                if (this.wanderTimer[i] <= 0) {
                    // Change direction
                    this.wanderAngle[i] += (Math.random() - 0.5) * Math.PI;
                    this.wanderTimer[i] = 1 + Math.random() * 2;
                    
                    const speed = 30 + Math.random() * 20;
                    this.velX[i] = Math.cos(this.wanderAngle[i]) * speed;
                }
            }
            
            // Apply velocity
            this.posX[i] += this.velX[i] * deltaTime;
            this.posY[i] += this.velY[i] * deltaTime;
            
            // Gravity (keep on ground)
            const targetY = groundY - this.size[i] / 2;
            this.posY[i] = targetY;
            
            // World boundaries (wrap around)
            if (this.posX[i] < 0) this.posX[i] = world.width;
            if (this.posX[i] > world.width) this.posX[i] = 0;
            
            // Energy decay
            this.energy[i] -= deltaTime * 0.5;
            if (this.energy[i] < 0) this.energy[i] = 0;
        }
    }
}

class CanvasGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Camera and zoom settings
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            minZoom: 0.1,
            maxZoom: 5
        };
        
        // World settings
        this.world = {
            width: 10000,
            height: 10000,
            groundLevel: 0.7 // 70% down from top
        };
        
        // Colors from EZ Space theme
        this.colors = {
            sky: '#050308',
            ground: '#1a0f28',
            groundTop: '#bc13fe',
            grid: 'rgba(188, 19, 254, 0.2)',
            accent: '#00f3ff'
        };
        
        // Mouse interaction
        this.mouse = {
            isDragging: false,
            lastX: 0,
            lastY: 0
        };
        
        // Creature system
        this.creatures = new CreatureSystem(1000);
        
        // Timing
        this.lastFrameTime = performance.now();
        this.updateAccumulator = 0;
        this.fixedTimeStep = 1 / 60; // 60 updates per second
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.centerCamera();
        this.spawnInitialCreatures();
        this.gameLoop();
    }
    
    spawnInitialCreatures() {
        // Spawn 50 creatures randomly across the world
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.world.width;
            this.creatures.spawn(x, 0, this.world.height, this.world.groundLevel);
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    centerCamera() {
        // Center camera on the world
        this.camera.x = this.world.width / 2 - this.canvas.width / 2;
        this.camera.y = this.world.height / 2 - this.canvas.height / 2;
    }
    
    setupEventListeners() {
        // Resize handling
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoom(0.1);
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoom(-0.1);
        });
        
        document.getElementById('resetZoom').addEventListener('click', () => {
            this.camera.zoom = 1;
            this.centerCamera();
            this.updateZoomDisplay();
        });
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(zoomDelta, e.offsetX, e.offsetY);
        });
        
        // Mouse drag to pan
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDragging = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouse.isDragging) {
                const deltaX = e.clientX - this.mouse.lastX;
                const deltaY = e.clientY - this.mouse.lastY;
                
                this.camera.x -= deltaX / this.camera.zoom;
                this.camera.y -= deltaY / this.camera.zoom;
                
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDragging = false;
            this.canvas.style.cursor = 'move';
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.isDragging = false;
            this.canvas.style.cursor = 'move';
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            const moveSpeed = 50 / this.camera.zoom;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    this.camera.y -= moveSpeed;
                    break;
                case 'ArrowDown':
                case 's':
                    this.camera.y += moveSpeed;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.camera.x -= moveSpeed;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.camera.x += moveSpeed;
                    break;
                case '+':
                case '=':
                    this.zoom(0.1);
                    break;
                case '-':
                    this.zoom(-0.1);
                    break;
            }
        });
    }
    
    zoom(delta, mouseX = null, mouseY = null) {
        const oldZoom = this.camera.zoom;
        this.camera.zoom = Math.max(
            this.camera.minZoom,
            Math.min(this.camera.maxZoom, this.camera.zoom + delta)
        );
        
        // Zoom towards mouse position if provided
        if (mouseX !== null && mouseY !== null) {
            const zoomFactor = this.camera.zoom / oldZoom;
            this.camera.x = mouseX / oldZoom + (this.camera.x - mouseX / oldZoom) * zoomFactor;
            this.camera.y = mouseY / oldZoom + (this.camera.y - mouseY / oldZoom) * zoomFactor;
        }
        
        this.updateZoomDisplay();
    }
    
    updateZoomDisplay() {
        document.getElementById('zoomValue').textContent = 
            Math.round(this.camera.zoom * 100) + '%';
    }
    
    update(deltaTime) {
        // Update creatures with fixed timestep
        this.creatures.update(deltaTime, this.world);
    }
    
    drawBackground() {
        // Sky
        const groundYWorld = this.world.height * this.world.groundLevel;
        const groundYScreen = (groundYWorld - this.camera.y) * this.camera.zoom;
        
        // Create gradient for sky
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, groundYScreen);
        skyGradient.addColorStop(0, this.colors.sky);
        skyGradient.addColorStop(1, '#0a0615');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, groundYScreen);
    }
    
    drawGround() {
        const groundYWorld = this.world.height * this.world.groundLevel;
        const groundYScreen = (groundYWorld - this.camera.y) * this.camera.zoom;
        
        // Ground gradient
        const groundGradient = this.ctx.createLinearGradient(0, groundYScreen, 0, this.canvas.height);
        groundGradient.addColorStop(0, this.colors.groundTop);
        groundGradient.addColorStop(0.3, this.colors.ground);
        groundGradient.addColorStop(1, this.colors.sky);
        
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, groundYScreen, this.canvas.width, this.canvas.height - groundYScreen);
        
        // Ground surface line with glow
        this.ctx.strokeStyle = this.colors.accent;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.colors.accent;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundYScreen);
        this.ctx.lineTo(this.canvas.width, groundYScreen);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawGrid() {
        const gridSize = 100;
        
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Calculate visible grid area
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const endX = startX + (this.canvas.width / this.camera.zoom) + gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endY = startY + (this.canvas.height / this.camera.zoom) + gridSize;
        
        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = (x - this.camera.x) * this.camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = (y - this.camera.y) * this.camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }
    
    drawCreatures() {
        const creatures = this.creatures;
        
        for (let i = 0; i < creatures.count; i++) {
            // Convert world position to screen position
            const screenX = (creatures.posX[i] - this.camera.x) * this.camera.zoom;
            const screenY = (creatures.posY[i] - this.camera.y) * this.camera.zoom;
            const size = creatures.size[i] * this.camera.zoom;
            
            // Cull creatures outside viewport
            if (screenX < -size || screenX > this.canvas.width + size ||
                screenY < -size || screenY > this.canvas.height + size) {
                continue;
            }
            
            // Extract color from uint32 (RGBA)
            const colorInt = creatures.color[i];
            const r = (colorInt >> 24) & 0xFF;
            const g = (colorInt >> 16) & 0xFF;
            const b = (colorInt >> 8) & 0xFF;
            const a = (colorInt & 0xFF) / 255;
            
            // Draw creature body
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            this.ctx.shadowBlur = 15 * this.camera.zoom;
            this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw energy bar (when zoomed in)
            if (this.camera.zoom > 0.5) {
                const barWidth = size;
                const barHeight = 3 * this.camera.zoom;
                const energyPercent = creatures.energy[i] / 100;
                
                this.ctx.shadowBlur = 0;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(screenX - barWidth / 2, screenY - size, barWidth, barHeight);
                
                // Energy bar
                const energyColor = energyPercent > 0.5 ? '#00ff41' : energyPercent > 0.25 ? '#00f3ff' : '#bc13fe';
                this.ctx.fillStyle = energyColor;
                this.ctx.fillRect(screenX - barWidth / 2, screenY - size, barWidth * energyPercent, barHeight);
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world
        this.drawBackground();
        this.drawGrid();
        this.drawGround();
        
        // Draw creatures
        this.drawCreatures();
        
        // Draw debug info
        this.drawDebugInfo();
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 243, 255, 0.8)';
        this.ctx.font = '12px "Orbitron", monospace';
        this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, this.canvas.height - 45);
        this.ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 10, this.canvas.height - 30);
        this.ctx.fillText(`Creatures: ${this.creatures.count}`, 10, this.canvas.height - 15);
    }
    
    gameLoop() {
        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Cap deltaTime to prevent spiral of death
        if (deltaTime > 0.1) deltaTime = 0.1;
        
        // Fixed timestep updates
        this.updateAccumulator += deltaTime;
        while (this.updateAccumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.updateAccumulator -= this.fixedTimeStep;
        }
        
        // Render at display framerate
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new CanvasGame();
});

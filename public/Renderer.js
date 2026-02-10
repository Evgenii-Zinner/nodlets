/**
 * Renderer - Handles all canvas drawing
 */
export class Renderer {
    constructor(ctx, colors) {
        this.ctx = ctx;
        this.colors = colors;
        this.colorCache = new Map();
    }

    getColorStrings(colorInt) {
        if (!this.colorCache.has(colorInt)) {
            const r = (colorInt >> 24) & 0xFF;
            const g = (colorInt >> 16) & 0xFF;
            const b = (colorInt >> 8) & 0xFF;
            const a = (colorInt & 0xFF) / 255;
            this.colorCache.set(colorInt, {
                fill: `rgba(${r}, ${g}, ${b}, ${a})`
            });
        }
        return this.colorCache.get(colorInt);
    }

    clear(width, height) {
        this.ctx.clearRect(0, 0, width, height);
    }

    drawBackground(camera, world, width, height) {
        const groundGradient = this.ctx.createLinearGradient(0, 0, 0, height);
        groundGradient.addColorStop(0, '#08040f');
        groundGradient.addColorStop(1, this.colors.ground);

        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGround(camera, world, width, height) { }

    drawGrid(camera, world, width, height) {
        const gridSize = 100;
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const endX = startX + (width / camera.zoom) + gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endY = startY + (height / camera.zoom) + gridSize;

        for (let x = startX; x < endX; x += gridSize) {
            const screenX = (x - camera.x) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, height);
            this.ctx.stroke();
        }

        for (let y = startY; y < endY; y += gridSize) {
            const screenY = (y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(width, screenY);
            this.ctx.stroke();
        }
    }

    drawResources(resources, camera, width, height) {
        for (let i = 0; i < resources.count; i++) {
            const size = 15 * camera.zoom;
            const screenX = (resources.posX[i] - camera.x) * camera.zoom;
            const screenY = (resources.posY[i] - camera.y) * camera.zoom;

            if (screenX < -size || screenX > width + size ||
                screenY < -size || screenY > height + size) {
                continue;
            }

            const type = resources.type[i];
            const maxAmount = 1000;
            const amountRatio = Math.min(1.0, resources.amount[i] / maxAmount);

            // Energy: Green, Data: Blue
            this.ctx.fillStyle = type === 0
                ? `rgba(0, 255, 65, ${0.3 + amountRatio * 0.7})`
                : `rgba(0, 243, 255, ${0.3 + amountRatio * 0.7})`;

            this.ctx.beginPath();
            if (type === 0) {
                // Diamond for Energy
                this.ctx.moveTo(screenX, screenY - size);
                this.ctx.lineTo(screenX + size, screenY);
                this.ctx.lineTo(screenX, screenY + size);
                this.ctx.lineTo(screenX - size, screenY);
            } else if (type === 1) {
                // Square for Data
                this.ctx.rect(screenX - size / 2, screenY - size / 2, size, size);
            }
            this.ctx.closePath();
            this.ctx.fill();

            if (camera.zoom > 0.3) {
                this.ctx.strokeStyle = this.colors.accent;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    drawWorldBounds(camera, world) {
        const x = (0 - camera.x) * camera.zoom;
        const y = (0 - camera.y) * camera.zoom;
        const w = world.width * camera.zoom;
        const h = world.height * camera.zoom;

        this.ctx.strokeStyle = this.colors.accent;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawCreatures(creatures, camera, width, height) {
        const shadowBlur = 15 * camera.zoom;

        // Group indices by color to minimize state changes
        const colorBatches = new Map();

        for (let i = 0; i < creatures.count; i++) {
            const size = creatures.size[i] * camera.zoom;
            const screenX = (creatures.posX[i] - camera.x) * camera.zoom;
            const screenY = (creatures.posY[i] - camera.y) * camera.zoom;

            if (screenX < -size || screenX > width + size ||
                screenY < -size || screenY > height + size) {
                continue;
            }

            const colorInt = creatures.color[i];
            if (!colorBatches.has(colorInt)) colorBatches.set(colorInt, []);
            colorBatches.get(colorInt).push(i);
        }

        for (const [colorInt, indices] of colorBatches) {
            const colors = this.getColorStrings(colorInt);
            this.ctx.fillStyle = colors.fill;

            for (const i of indices) {
                const screenX = (creatures.posX[i] - camera.x) * camera.zoom;
                const screenY = (creatures.posY[i] - camera.y) * camera.zoom;
                const size = creatures.size[i] * camera.zoom;

                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Draw energy bars in a separate pass to avoid shadowBlur toggling
        if (camera.zoom > 0.5) {
            for (const indices of colorBatches.values()) {
                for (const i of indices) {
                    const screenX = (creatures.posX[i] - camera.x) * camera.zoom;
                    const screenY = (creatures.posY[i] - camera.y) * camera.zoom;
                    const size = creatures.size[i] * camera.zoom;

                    const barWidth = size;
                    const barHeight = 2 * camera.zoom;
                    const energyPercent = creatures.energy[i] / creatures.maxEnergy[i];

                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(screenX - barWidth / 2, screenY - size, barWidth, barHeight);

                    const energyColor = energyPercent > 0.5 ? '#00ff41' : energyPercent > 0.25 ? '#00f3ff' : '#bc13fe';
                    this.ctx.fillStyle = energyColor;
                    this.ctx.fillRect(screenX - barWidth / 2, screenY - size, barWidth * energyPercent, barHeight);
                }
            }
        }
    }

    drawDebug(camera, creatureCount, width, height) {
        this.ctx.fillStyle = 'rgba(0, 243, 255, 0.8)';
        this.ctx.font = '12px "Orbitron", monospace';
        this.ctx.fillText(`Camera: (${Math.round(camera.x)}, ${Math.round(camera.y)})`, 10, height - 45);
        this.ctx.fillText(`Zoom: ${Math.round(camera.zoom * 100)}%`, 10, height - 30);
        this.ctx.fillText(`Creatures: ${creatureCount}`, 10, height - 15);
    }

    getGroundScreenY(camera, world) {
        return 0;
    }
}

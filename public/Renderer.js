/**
 * Renderer - Handles PixiJS rendering with Sprite Pooling
 */
export class Renderer {
    constructor(colors, world) {
        this.colors = colors;
        this.world = world;

        this.app = new PIXI.Application();
        this.creatureSprites = [];
        this.resourceSprites = [];
    }

    async init(container) {
        await this.app.init({
            resizeTo: container,
            background: this.colors.ground,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        container.appendChild(this.app.canvas);

        // Layers
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        this.gridGraphics = new PIXI.Graphics();
        this.worldContainer.addChild(this.gridGraphics);

        this.resourceContainer = new PIXI.Container();
        this.worldContainer.addChild(this.resourceContainer);

        this.creatureContainer = new PIXI.Container();
        this.worldContainer.addChild(this.creatureContainer);

        this.debugGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.debugGraphics);

        this.createTemplates();
    }

    createTemplates() {
        // Creature texture
        const creatureGfx = new PIXI.Graphics()
            .circle(0, 0, 10)
            .fill(0xFFFFFF);
        this.creatureTexture = this.app.renderer.generateTexture(creatureGfx);

        // Energy texture
        const energyGfx = new PIXI.Graphics()
            .moveTo(0, -15)
            .lineTo(15, 0)
            .lineTo(0, 15)
            .lineTo(-15, 0)
            .closePath()
            .fill({ color: 0x00FF41, alpha: 0.8 });
        this.energyTexture = this.app.renderer.generateTexture(energyGfx);

        // Data texture
        const dataGfx = new PIXI.Graphics()
            .rect(-7.5, -7.5, 15, 15)
            .fill({ color: 0x00F3FF, alpha: 0.8 });
        this.dataTexture = this.app.renderer.generateTexture(dataGfx);
    }

    update(camera, creatures, resources) {
        this.worldContainer.scale.set(camera.zoom);
        this.worldContainer.position.set(-camera.x * camera.zoom, -camera.y * camera.zoom);

        this.drawGrid(camera);
        this.updateResources(resources);
        this.updateCreatures(creatures, camera);
        this.drawDebug(camera, creatures.count);
    }

    drawGrid(camera) {
        this.gridGraphics.clear();
        const gridSize = 100;
        const width = this.app.screen.width / camera.zoom;
        const height = this.app.screen.height / camera.zoom;

        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const endX = startX + width + gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endY = startY + height + gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            this.gridGraphics.moveTo(x, startY);
            this.gridGraphics.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.gridGraphics.moveTo(startX, y);
            this.gridGraphics.lineTo(endX, y);
        }
        this.gridGraphics.stroke({ color: 0xBC13FE, width: 1, alpha: 0.2 });

        // World bounds
        this.gridGraphics.rect(0, 0, this.world.width, this.world.height)
            .stroke({ color: 0x00F3FF, width: 2, alpha: 0.5 });
    }

    updateResources(resources) {
        // Grow pool if needed
        while (this.resourceSprites.length < resources.count) {
            const sprite = new PIXI.Sprite();
            sprite.anchor.set(0.5);
            this.resourceContainer.addChild(sprite);
            this.resourceSprites.push(sprite);
        }

        // Sync sprites
        for (let i = 0; i < this.resourceSprites.length; i++) {
            const sprite = this.resourceSprites[i];
            if (i < resources.count) {
                sprite.visible = true;
                sprite.texture = resources.type[i] === 0 ? this.energyTexture : this.dataTexture;
                sprite.position.set(resources.posX[i], resources.posY[i]);
                sprite.alpha = 0.3 + (Math.min(1.0, resources.amount[i] / 1000) * 0.7);
            } else {
                sprite.visible = false;
            }
        }
    }

    updateCreatures(creatures, camera) {
        // Tweakable Variables for Juice
        const SQUASH_FACTOR = 0.005;
        const MAX_SQUASH = 1.6; // Max stretch

        // Grow pool if needed
        while (this.creatureSprites.length < creatures.count) {
            const root = new PIXI.Container();

            const body = new PIXI.Sprite(this.creatureTexture);
            body.name = 'body';
            body.anchor.set(0.5);
            root.addChild(body);

            // Container for bars
            const bars = new PIXI.Container();
            bars.name = 'bars';
            root.addChild(bars);

            const bg = new PIXI.Graphics();
            bg.name = 'bg';
            const fill = new PIXI.Graphics();
            fill.name = 'fill';
            bars.addChild(bg);
            bars.addChild(fill);

            this.creatureContainer.addChild(root);
            this.creatureSprites.push(root);
        }

        // Sync sprites
        for (let i = 0; i < this.creatureSprites.length; i++) {
            const root = this.creatureSprites[i];

            if (i < creatures.count) {
                root.visible = true;
                root.position.set(creatures.posX[i], creatures.posY[i]);

                const body = root.getChildByName('body');
                const bars = root.getChildByName('bars');

                const vx = creatures.velX[i];
                const vy = creatures.velY[i];
                const speed = Math.sqrt(vx * vx + vy * vy);

                // Squash and Stretch based on Speed
                // Stretch in direction of movement (X locally when rotated), Squash perpendicular (Y locally)
                const stretch = Math.min(MAX_SQUASH, 1.0 + (speed * SQUASH_FACTOR));
                const squash = 1.0 / stretch; // Maintain volume

                // Base size
                const baseSize = creatures.size[i];
                // Apply stretch to width/height to bypass global scale inheritance confusion
                body.width = baseSize * stretch;
                body.height = baseSize * squash;

                // Rotate body to face velocity vector
                if (speed > 0.1) {
                    body.rotation = Math.atan2(vy, vx);
                }

                const colorInt = creatures.color[i];
                body.tint = (colorInt >> 8) & 0xFFFFFF;

                if (camera.zoom > 0.5) {
                    bars.visible = true;
                    // Reset bars rotation opposite to root if root rotated, or just don't rotate root.
                    // We applied rotation to `body`, so `bars` stay unrotated implicitly.
                    const energyPercent = creatures.energy[i] / creatures.maxEnergy[i];
                    const barWidth = creatures.size[i];
                    const barHeight = 2;

                    const bg = bars.getChildByName('bg');
                    const fill = bars.getChildByName('fill');

                    bg.clear().rect(-barWidth / 2, -creatures.size[i] - barHeight, barWidth, barHeight)
                        .fill({ color: 0x000000, alpha: 0.5 });

                    const energyColor = energyPercent > 0.5 ? 0x00FF41 : energyPercent > 0.25 ? 0x00F3FF : 0xBC13FE;
                    fill.clear().rect(-barWidth / 2, -creatures.size[i] - barHeight, barWidth * energyPercent, barHeight)
                        .fill(energyColor);
                } else {
                    bars.visible = false;
                }
            } else {
                root.visible = false;
            }
        }
    }

    drawDebug(camera, creatureCount) {
        this.debugGraphics.clear();
        if (!this.debugText) {
            this.debugText = new PIXI.Text({
                text: '',
                style: {
                    fontFamily: 'Orbitron, monospace',
                    fontSize: 12,
                    fill: 0x00F3FF,
                }
            });
            this.app.stage.addChild(this.debugText);
        }

        this.debugText.text = `Camera: (${Math.round(camera.x)}, ${Math.round(camera.y)})\n` +
            `Zoom: ${Math.round(camera.zoom * 100)}%\n` +
            `Creatures: ${creatureCount}`;
        this.debugText.position.set(10, this.app.screen.height - 60);
    }

    clear() { }
}



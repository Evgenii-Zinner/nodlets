/**
 * Renderer - Handles PixiJS rendering with Sprite Pooling
 */
export class Renderer {
    constructor(colors, world) {
        this.colors = colors;
        this.world = world;

        this.app = new PIXI.Application();
        this.hubSprites = [];
        this.nodletSprites = [];
        this.resourceSprites = [];

        // Active target circle
        this.targetGraphics = null;
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

        // Graphics for influence zones
        this.influenceGraphics = new PIXI.Graphics();
        this.worldContainer.addChild(this.influenceGraphics);

        this.resourceContainer = new PIXI.Container();
        this.worldContainer.addChild(this.resourceContainer);

        this.hubContainer = new PIXI.Container();
        this.worldContainer.addChild(this.hubContainer);

        this.nodletContainer = new PIXI.Container();
        this.worldContainer.addChild(this.nodletContainer);

        this.targetGraphics = new PIXI.Graphics();
        this.worldContainer.addChild(this.targetGraphics);

        this.debugGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.debugGraphics);

        this.createTemplates();
    }

    createTemplates() {
        // Nodlet texture
        const nodletGfx = new PIXI.Graphics()
            .circle(0, 0, 10)
            .fill(0xFFFFFF);
        this.nodletTexture = this.app.renderer.generateTexture(nodletGfx);

        // Data texture
        const dataGfx = new PIXI.Graphics()
            .rect(-7.5, -7.5, 15, 15)
            .fill({ color: 0x00F3FF, alpha: 0.8 });
        this.dataTexture = this.app.renderer.generateTexture(dataGfx);

        // Generator Server texture (Large Diamond - Purple)
        const generatorGfx = new PIXI.Graphics()
            .moveTo(0, -30)
            .lineTo(30, 0)
            .lineTo(0, 30)
            .lineTo(-30, 0)
            .closePath()
            .fill({ color: 0xFF00FF, alpha: 0.8 }); // Magenta
        this.generatorTexture = this.app.renderer.generateTexture(generatorGfx);

        // Relay Server texture (Square Diamond - Cyan)
        const relayGfx = new PIXI.Graphics()
            .moveTo(0, -20)
            .lineTo(20, 0)
            .lineTo(0, 20)
            .lineTo(-20, 0)
            .closePath()
            .fill({ color: 0x00F3FF, alpha: 0.8 });
        this.relayTexture = this.app.renderer.generateTexture(relayGfx);

        // Hub Hexagon texture
        const hubGfx = new PIXI.Graphics();
        const hexRadius = 20;
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            hexPoints.push(hexRadius * Math.cos(angle_rad));
            hexPoints.push(hexRadius * Math.sin(angle_rad));
        }
        hubGfx.poly(hexPoints).fill(0xFFFFFF);
        this.hubTexture = this.app.renderer.generateTexture(hubGfx);

        // Pixel texture for bars
        const pixelGfx = new PIXI.Graphics().rect(0, 0, 1, 1).fill(0xFFFFFF);
        this.pixelTexture = this.app.renderer.generateTexture(pixelGfx);
    }

    update(camera, hubs, nodlets, resources, options = {}) {
        this.worldContainer.scale.set(camera.zoom);
        this.worldContainer.position.set(-camera.x * camera.zoom, -camera.y * camera.zoom);

        const padding = 100;
        const width = this.app.screen.width / camera.zoom;
        const height = this.app.screen.height / camera.zoom;
        const bounds = {
            minX: camera.x - padding,
            maxX: camera.x + width + padding,
            minY: camera.y - padding,
            maxY: camera.y + height + padding
        };

        this.drawGrid(camera);
        this.drawInfluenceZones(hubs, options.influence || 500);

        this.targetGraphics.clear();

        this.updateResources(resources, bounds, options.activeTargetServer, options.selectedServerIndex);
        this.updateHubs(hubs, bounds);
        this.updateNodlets(nodlets, camera, bounds, options.selectedNodletIndex);
        this.drawDebug(camera, hubs.count, nodlets.count);
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

    drawInfluenceZones(hubs, influenceRadius) {
        this.influenceGraphics.clear();
        for (let i = 0; i < hubs.count; i++) {
            this.influenceGraphics.circle(hubs.posX[i], hubs.posY[i], influenceRadius)
                .stroke({ color: 0x00F3FF, width: 1, alpha: 0.15 })
                .fill({ color: 0x00F3FF, alpha: 0.02 });
        }
    }

    updateResources(resources, bounds, activeTargetServer = -1, selectedServerIndex = -1) {
        // Grow pool if needed
        while (this.resourceSprites.length < resources.count) {
            const sprite = new PIXI.Sprite();
            sprite.anchor.set(0.5);
            this.resourceContainer.addChild(sprite);
            this.resourceSprites.push(sprite);
        }

        // Draw Selected Server Highlight (Glow)
        if (selectedServerIndex !== -1 && selectedServerIndex < resources.count) {
            const tx = resources.posX[selectedServerIndex];
            const ty = resources.posY[selectedServerIndex];

            this.targetGraphics.circle(tx, ty, 45)
                .fill({ color: 0xFFFFFF, alpha: 0.15 })
                .stroke({ color: 0xFFFFFF, width: 3, alpha: 0.8 });
        }

        // Draw Target highlight
        if (activeTargetServer !== -1 && activeTargetServer < resources.count) {
            const tx = resources.posX[activeTargetServer];
            const ty = resources.posY[activeTargetServer];

            this.targetGraphics.circle(tx, ty, 60)
                .stroke({ color: 0xFFFFFF, width: 2, alpha: 0.8 });
            // Add a small spinning crosshair look
            const time = performance.now() * 0.002;
            const r = 70;
            this.targetGraphics.moveTo(tx - r * Math.cos(time), ty - r * Math.sin(time))
                .lineTo(tx + r * Math.cos(time), ty + r * Math.sin(time));
            this.targetGraphics.moveTo(tx - r * Math.cos(time + Math.PI / 2), ty - r * Math.sin(time + Math.PI / 2))
                .lineTo(tx + r * Math.cos(time + Math.PI / 2), ty + r * Math.sin(time + Math.PI / 2))
                .stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 });
        }

        // Sync sprites
        for (let i = 0; i < this.resourceSprites.length; i++) {
            const sprite = this.resourceSprites[i];
            if (i < resources.count) {
                // Frustum Culling
                const rx = resources.posX[i];
                const ry = resources.posY[i];
                if (rx < bounds.minX || rx > bounds.maxX || ry < bounds.minY || ry > bounds.maxY) {
                    sprite.visible = false;
                    continue;
                }

                sprite.visible = true;

                // 0: Generator, 1: Relay, 2: Packet
                if (resources.type[i] === 0) {
                    sprite.texture = this.generatorTexture;
                } else if (resources.type[i] === 1) {
                    sprite.texture = this.relayTexture;
                } else {
                    sprite.texture = this.dataTexture;
                }

                sprite.position.set(resources.posX[i], resources.posY[i]);

                if (resources.type[i] === 0 || resources.type[i] === 1) {
                    // Scale server based on current amount vs max amount
                    const scale = 0.5 + (resources.amount[i] / resources.maxAmount[i]) * 0.5;
                    sprite.scale.set(scale);
                    sprite.alpha = 0.5 + (resources.amount[i] / resources.maxAmount[i]) * 0.5;
                } else {
                    sprite.scale.set(1);
                    sprite.alpha = 1.0;
                }
            } else {
                sprite.visible = false;
            }
        }
    }

    updateHubs(hubs, bounds) {
        while (this.hubSprites.length < hubs.count) {
            const root = new PIXI.Container();

            const body = new PIXI.Sprite(this.hubTexture);
            body.name = 'body';
            body.anchor.set(0.5);
            root.addChild(body);

            this.hubContainer.addChild(root);
            this.hubSprites.push(root);
        }

        for (let i = 0; i < this.hubSprites.length; i++) {
            const root = this.hubSprites[i];

            if (i < hubs.count) {
                const hx = hubs.posX[i];
                const hy = hubs.posY[i];
                if (hx < bounds.minX || hx > bounds.maxX || hy < bounds.minY || hy > bounds.maxY) {
                    root.visible = false;
                    continue;
                }

                root.visible = true;
                root.position.set(hx, hy);

                const body = root.getChildByName('body');
                const scale = hubs.size[i] / 20.0;
                body.scale.set(scale);

                const colorInt = hubs.color[i];
                body.tint = (colorInt >> 8) & 0xFFFFFF;
            } else {
                root.visible = false;
            }
        }
    }

    updateNodlets(nodlets, camera, bounds, selectedNodletIndex = -1) {
        const SQUASH_FACTOR = 0.005;
        const MAX_SQUASH = 1.6; // Max stretch

        // Draw Selected Nodlet Highlight (Glow)
        if (selectedNodletIndex !== -1 && selectedNodletIndex < nodlets.count) {
            const nx = nodlets.posX[selectedNodletIndex];
            const ny = nodlets.posY[selectedNodletIndex];
            this.targetGraphics.circle(nx, ny, 20)
                .fill({ color: 0xFFFFFF, alpha: 0.2 })
                .stroke({ color: 0xFFFFFF, width: 2, alpha: 0.9 });
        }

        while (this.nodletSprites.length < nodlets.count) {
            const root = new PIXI.Container();

            const body = new PIXI.Sprite(this.nodletTexture);
            body.name = 'body';
            body.anchor.set(0.5);
            root.addChild(body);

            // Container for bars
            const bars = new PIXI.Container();
            bars.name = 'bars';
            root.addChild(bars);

            const bg = new PIXI.Sprite(this.pixelTexture);
            bg.name = 'bg';
            bg.anchor.set(0.5, 1.0);
            const fill = new PIXI.Sprite(this.pixelTexture);
            fill.name = 'fill';
            fill.anchor.set(0.5, 1.0);
            bars.addChild(bg);
            bars.addChild(fill);

            this.nodletContainer.addChild(root);
            this.nodletSprites.push(root);
        }

        const globalPulse = 1.0 + Math.sin(performance.now() * 0.01) * 0.2;

        for (let i = 0; i < this.nodletSprites.length; i++) {
            const root = this.nodletSprites[i];

            if (i < nodlets.count) {
                const nx = nodlets.posX[i];
                const ny = nodlets.posY[i];
                if (nx < bounds.minX || nx > bounds.maxX || ny < bounds.minY || ny > bounds.maxY) {
                    root.visible = false;
                    continue;
                }

                root.visible = true;
                root.position.set(nx, ny);

                const body = root.getChildByName('body');
                const bars = root.getChildByName('bars');

                const vx = nodlets.velX[i];
                const vy = nodlets.velY[i];
                const speed = Math.sqrt(vx * vx + vy * vy);

                const stretch = Math.min(MAX_SQUASH, 1.0 + (speed * SQUASH_FACTOR));
                const squash = 1.0 / stretch;

                const baseSize = nodlets.size[i];
                body.width = baseSize * stretch;
                body.height = baseSize * squash;

                if (speed > 0.1) {
                    body.rotation = Math.atan2(vy, vx);
                }

                // If returning with data, glow or pulsate a bit
                if (nodlets.state[i] === 1) {
                    body.width *= globalPulse;
                    body.height *= globalPulse;
                }

                const colorInt = nodlets.color[i];
                body.tint = (colorInt >> 8) & 0xFFFFFF;

                if (camera.zoom > 0.5) {
                    bars.visible = true;
                    // Draw Data Bar instead of Energy
                    const dataPercent = nodlets.carriedData[i] / nodlets.maxDataCapacity[i];
                    const barWidth = nodlets.size[i];
                    const barHeight = 2;
                    const yOffset = -nodlets.size[i]; // Bottom of the bar is top of the nodlet (radius approx)

                    const bg = bars.getChildByName('bg');
                    const fill = bars.getChildByName('fill');

                    // Update BG
                    bg.width = barWidth;
                    bg.height = barHeight;
                    bg.position.set(0, yOffset);
                    bg.tint = 0x000000;
                    bg.alpha = 0.5;

                    // Cyan for data
                    const dataColor = 0x00F3FF;
                    fill.width = barWidth * dataPercent;
                    fill.height = barHeight;
                    fill.anchor.set(0, 1.0);
                    fill.position.set(-barWidth / 2, yOffset);
                    fill.tint = dataColor;
                } else {
                    bars.visible = false;
                }
            } else {
                root.visible = false;
            }
        }
    }

    drawDebug(camera, hubCount, nodletCount) {
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
            `Hubs: ${hubCount}\n` +
            `Nodlets: ${nodletCount}`;
        this.debugText.position.set(10, this.app.screen.height - 80);
    }

    clear() { }
}

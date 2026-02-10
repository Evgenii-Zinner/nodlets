/**
 * Camera - Handles viewport, zoom, and panning
 */
export class Camera {
    constructor(world, canvas) {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;

        this.centerOn(world, canvas);
    }

    centerOn(world, canvas) {
        this.x = world.width / 2 - canvas.width / (2 * this.zoom);
        this.y = world.height / 2 - canvas.height / (2 * this.zoom);
    }

    focusOn(x, y, canvas) {
        this.x = x - canvas.width / (2 * this.zoom);
        this.y = y - canvas.height / (2 * this.zoom);
    }

    adjustZoom(delta, pivotX = null, pivotY = null) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));

        if (pivotX !== null && pivotY !== null && this.zoom !== oldZoom) {
            const worldX = this.x + pivotX / oldZoom;
            const worldY = this.y + pivotY / oldZoom;
            this.x = worldX - pivotX / this.zoom;
            this.y = worldY - pivotY / this.zoom;
        }
    }

    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: this.x + screenX / this.zoom,
            y: this.y + screenY / this.zoom
        };
    }
}

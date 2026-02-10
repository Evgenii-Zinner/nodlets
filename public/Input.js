/**
 * Input - Handles keyboard, mouse, and UI controls
 */
export class Input {
    constructor(canvas, camera, onZoomChange, onClick) {
        this.canvas = canvas;
        this.camera = camera;
        this.onZoomChange = onZoomChange;
        this.onClick = onClick;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastX = 0;
        this.lastY = 0;

        this.setupListeners();
    }

    setupListeners() {
        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.camera.adjustZoom(0.1);
            this.onZoomChange();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.camera.adjustZoom(-0.1);
            this.onZoomChange();
        });

        document.getElementById('resetZoom').addEventListener('click', () => {
            this.camera.zoom = 1;
            this.onZoomChange();
        });

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.camera.adjustZoom(delta, e.offsetX, e.offsetY);
            this.onZoomChange();
        });

        // Mouse drag and click
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.camera.pan(e.clientX - this.lastX, e.clientY - this.lastY);
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                const moveDist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
                if (moveDist < 5 && this.onClick) {
                    this.onClick(e.offsetX, e.offsetY);
                }
            }
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // Keyboard
        window.addEventListener('keydown', (e) => {
            const speed = 50 / this.camera.zoom;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.camera.y -= speed;
                    break;
                case 'ArrowDown':
                case 's':
                    this.camera.y += speed;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.camera.x -= speed;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.camera.x += speed;
                    break;
                case '+':
                case '=':
                    this.camera.adjustZoom(0.1);
                    this.onZoomChange();
                    break;
                case '-':
                    this.camera.adjustZoom(-0.1);
                    this.onZoomChange();
                    break;
            }
        });
    }
}

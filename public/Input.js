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



        // Touch controls
        let initialPinchDistance = null;
        let initialZoom = null;
        let lastTouchCentroid = null;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
                lastTouchCentroid = null;
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDistance = Math.hypot(dx, dy);
                initialZoom = this.camera.zoom;

                lastTouchCentroid = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                this.camera.pan(e.touches[0].clientX - this.lastX, e.touches[0].clientY - this.lastY);
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && initialPinchDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.hypot(dx, dy);

                const currentCentroid = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };

                if (lastTouchCentroid) {
                    this.camera.pan(currentCentroid.x - lastTouchCentroid.x, currentCentroid.y - lastTouchCentroid.y);
                }

                const zoomFactor = distance / initialPinchDistance;
                const targetZoom = initialZoom * zoomFactor;
                const zoomDelta = targetZoom - this.camera.zoom;

                if (Math.abs(zoomDelta) > 0.01) {
                    this.camera.adjustZoom(zoomDelta, currentCentroid.x, currentCentroid.y);
                    this.onZoomChange();
                }

                lastTouchCentroid = currentCentroid;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0) {
                if (this.isDragging) {
                    const moveDist = Math.hypot(this.lastX - this.dragStartX, this.lastY - this.dragStartY);
                    if (moveDist < 10 && this.onClick) {
                        this.onClick(this.lastX, this.lastY);
                    }
                }
                this.isDragging = false;
                initialPinchDistance = null;
                lastTouchCentroid = null;
            } else if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
                initialPinchDistance = null;
                lastTouchCentroid = null;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                this.camera.pan(e.touches[0].clientX - this.lastX, e.touches[0].clientY - this.lastY);
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
                lastTouchCentroid = { x: this.lastX, y: this.lastY };
            } else if (e.touches.length === 2 && initialPinchDistance) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.hypot(dx, dy);

                const currentCentroid = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                };

                // Panning while zooming
                if (lastTouchCentroid) {
                    this.camera.pan(currentCentroid.x - lastTouchCentroid.x, currentCentroid.y - lastTouchCentroid.y);
                }

                const zoomFactor = distance / initialPinchDistance;
                const targetZoom = initialZoom * zoomFactor;
                const zoomDelta = targetZoom - this.camera.zoom;

                this.camera.adjustZoom(zoomDelta, currentCentroid.x, currentCentroid.y);
                this.onZoomChange();

                lastTouchCentroid = currentCentroid;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0) {
                if (this.isDragging) {
                    // Check if it was a tap
                    const moveDist = Math.hypot(this.lastX - this.dragStartX, this.lastY - this.dragStartY);
                    if (moveDist < 10 && this.onClick) {
                        this.onClick(this.lastX, this.lastY);
                    }
                }
                this.isDragging = false;
                initialPinchDistance = null;
                lastTouchCentroid = null;
            } else if (e.touches.length === 1) {
                // Switching from pinch to pan
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartY = e.touches[0].clientY;
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
                initialPinchDistance = null;
                lastTouchCentroid = { x: this.lastX, y: this.lastY };
            }
        }, { passive: false });

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

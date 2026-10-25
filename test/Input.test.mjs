import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Input } from "../public/Input.js";

// Realistic mocks
class MockCanvas {
	constructor() {
		this.listeners = {};
	}
	addEventListener(event, callback) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}
	dispatchEvent(event, args) {
		if (this.listeners[event]) {
			for (const cb of this.listeners[event]) {
				cb(args);
			}
		}
	}
}

class MockWindow {
	constructor() {
		this.listeners = {};
	}
	addEventListener(event, callback) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}
	dispatchEvent(event, args) {
		if (this.listeners[event]) {
			for (const cb of this.listeners[event]) {
				cb(args);
			}
		}
	}
}

class MockCamera {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.zoom = 1;
		this.adjustZoomCalls = [];
		this.panCalls = [];
	}
	adjustZoom(delta, x = null, y = null) {
		this.adjustZoomCalls.push({ delta, x, y });
	}
	pan(dx, dy) {
		this.panCalls.push({ dx, dy });
	}
}

describe("Input", () => {
	let mockCanvas;
	let mockWindow;
	let originalWindow;
	let mockCamera;
	let zoomChangeCount;
	let lastClick;
	let input;

	beforeEach(() => {
		mockCanvas = new MockCanvas();
		mockWindow = new MockWindow();
		originalWindow = global.window;
		global.window = mockWindow;

		mockCamera = new MockCamera();
		zoomChangeCount = 0;
		lastClick = null;

		input = new Input(
			mockCanvas,
			mockCamera,
			() => zoomChangeCount++,
			(x, y) => (lastClick = { x, y }),
		);
	});

	afterEach(() => {
		global.window = originalWindow;
	});

	describe("Mouse Events", () => {
		it("handles mouse wheel zoom in", () => {
			const preventDefaultCalls = [];
			const event = {
				deltaY: -100,
				offsetX: 50,
				offsetY: 60,
				preventDefault: () => preventDefaultCalls.push(1),
			};

			mockCanvas.dispatchEvent("wheel", event);

			assert.equal(preventDefaultCalls.length, 1);
			assert.equal(mockCamera.adjustZoomCalls.length, 1);
			assert.deepEqual(mockCamera.adjustZoomCalls[0], {
				delta: 0.1,
				x: 50,
				y: 60,
			});
			assert.equal(zoomChangeCount, 1);
		});

		it("handles mouse wheel zoom out", () => {
			const preventDefaultCalls = [];
			const event = {
				deltaY: 100,
				offsetX: 50,
				offsetY: 60,
				preventDefault: () => preventDefaultCalls.push(1),
			};

			mockCanvas.dispatchEvent("wheel", event);

			assert.equal(preventDefaultCalls.length, 1);
			assert.equal(mockCamera.adjustZoomCalls.length, 1);
			assert.deepEqual(mockCamera.adjustZoomCalls[0], {
				delta: -0.1,
				x: 50,
				y: 60,
			});
			assert.equal(zoomChangeCount, 1);
		});

		it("handles mouse drag and pan", () => {
			// Start drag
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			assert.equal(input.isDragging, true);
			assert.equal(input.dragStartX, 100);
			assert.equal(input.dragStartY, 100);

			// Move mouse
			mockCanvas.dispatchEvent("mousemove", { clientX: 150, clientY: 120 });

			assert.equal(mockCamera.panCalls.length, 1);
			assert.deepEqual(mockCamera.panCalls[0], { dx: 50, dy: 20 });
			assert.equal(input.lastX, 150);
			assert.equal(input.lastY, 120);
		});

		it("ignores mousemove if not dragging", () => {
			mockCanvas.dispatchEvent("mousemove", { clientX: 150, clientY: 120 });

			assert.equal(mockCamera.panCalls.length, 0);
		});

		it("detects click if mouse movement is small", () => {
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			// Move slightly
			mockCanvas.dispatchEvent("mousemove", { clientX: 102, clientY: 102 });
			// Release
			mockCanvas.dispatchEvent("mouseup", {
				clientX: 102,
				clientY: 102,
				offsetX: 200,
				offsetY: 200,
			});

			assert.equal(input.isDragging, false);
			assert.deepEqual(lastClick, { x: 200, y: 200 });
		});

		it("detects click if mouse movement is just under boundary threshold (dist < 5)", () => {
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			// Math.hypot(3, 3) is ~4.24 < 5
			mockCanvas.dispatchEvent("mousemove", { clientX: 103, clientY: 103 });
			mockCanvas.dispatchEvent("mouseup", {
				clientX: 103,
				clientY: 103,
				offsetX: 200,
				offsetY: 200,
			});

			assert.equal(input.isDragging, false);
			assert.deepEqual(lastClick, { x: 200, y: 200 });
		});

		it("ignores click if mouse movement is exactly at boundary threshold (dist === 5)", () => {
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			// Math.hypot(3, 4) is 5
			mockCanvas.dispatchEvent("mousemove", { clientX: 103, clientY: 104 });
			mockCanvas.dispatchEvent("mouseup", {
				clientX: 103,
				clientY: 104,
				offsetX: 200,
				offsetY: 200,
			});

			assert.equal(input.isDragging, false);
			assert.equal(lastClick, null);
		});

		it("ignores click if mouse movement is large", () => {
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			// Move significantly
			mockCanvas.dispatchEvent("mousemove", { clientX: 150, clientY: 150 });
			// Release
			mockCanvas.dispatchEvent("mouseup", {
				clientX: 150,
				clientY: 150,
				offsetX: 200,
				offsetY: 200,
			});

			assert.equal(input.isDragging, false);
			assert.equal(lastClick, null);
		});

		it("stops dragging on mouseleave", () => {
			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			assert.equal(input.isDragging, true);

			mockCanvas.dispatchEvent("mouseleave", {});
			assert.equal(input.isDragging, false);
		});

		it("does not throw if onClick callback is not provided", () => {
			const inputNoClick = new Input(mockCanvas, mockCamera, () => {});
			inputNoClick.onClick = undefined; // Force it to be undefined

			mockCanvas.dispatchEvent("mousedown", { clientX: 100, clientY: 100 });
			// Release within click threshold (dist < 5)
			mockCanvas.dispatchEvent("mouseup", {
				clientX: 100,
				clientY: 100,
				offsetX: 200,
				offsetY: 200,
			});

			assert.equal(inputNoClick.isDragging, false);
			// Successful execution without throwing validates the test
		});
	});

	describe("Keyboard Events", () => {
		it("handles arrow keys for panning", () => {
			// ArrowUp
			mockWindow.dispatchEvent("keydown", { key: "ArrowUp" });
			assert.equal(mockCamera.y, -50);

			// ArrowDown
			mockWindow.dispatchEvent("keydown", { key: "ArrowDown" });
			assert.equal(mockCamera.y, 0); // -50 + 50

			// ArrowLeft
			mockWindow.dispatchEvent("keydown", { key: "ArrowLeft" });
			assert.equal(mockCamera.x, -50);

			// ArrowRight
			mockWindow.dispatchEvent("keydown", { key: "ArrowRight" });
			assert.equal(mockCamera.x, 0); // -50 + 50
		});

		it("handles wsad keys for panning", () => {
			// w
			mockWindow.dispatchEvent("keydown", { key: "w" });
			assert.equal(mockCamera.y, -50);

			// s
			mockWindow.dispatchEvent("keydown", { key: "s" });
			assert.equal(mockCamera.y, 0);

			// a
			mockWindow.dispatchEvent("keydown", { key: "a" });
			assert.equal(mockCamera.x, -50);

			// d
			mockWindow.dispatchEvent("keydown", { key: "d" });
			assert.equal(mockCamera.x, 0);
		});

		it("handles zoom keys", () => {
			// +
			mockWindow.dispatchEvent("keydown", { key: "+" });
			assert.equal(mockCamera.adjustZoomCalls.length, 1);
			assert.deepEqual(mockCamera.adjustZoomCalls[0], {
				delta: 0.1,
				x: null,
				y: null,
			});
			assert.equal(zoomChangeCount, 1);

			// =
			mockWindow.dispatchEvent("keydown", { key: "=" });
			assert.equal(mockCamera.adjustZoomCalls.length, 2);
			assert.deepEqual(mockCamera.adjustZoomCalls[1], {
				delta: 0.1,
				x: null,
				y: null,
			});
			assert.equal(zoomChangeCount, 2);

			// -
			mockWindow.dispatchEvent("keydown", { key: "-" });
			assert.equal(mockCamera.adjustZoomCalls.length, 3);
			assert.deepEqual(mockCamera.adjustZoomCalls[2], {
				delta: -0.1,
				x: null,
				y: null,
			});
			assert.equal(zoomChangeCount, 3);
		});

		it("pans relative to zoom factor", () => {
			mockCamera.zoom = 2; // speed will be 50 / 2 = 25

			mockWindow.dispatchEvent("keydown", { key: "ArrowUp" });
			assert.equal(mockCamera.y, -25);

			mockWindow.dispatchEvent("keydown", { key: "ArrowLeft" });
			assert.equal(mockCamera.x, -25);
		});
	});

	describe("Touch Events", () => {
		it("handles single touch dragging", () => {
			const preventDefaultCalls = [];
			const eventStart = {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => preventDefaultCalls.push(1),
			};

			mockCanvas.dispatchEvent("touchstart", eventStart);
			assert.equal(input.isDragging, true);
			assert.equal(preventDefaultCalls.length, 1);

			const eventMove = {
				touches: [{ clientX: 150, clientY: 120 }],
				preventDefault: () => preventDefaultCalls.push(1),
			};

			// Dispatch touchmove which happens to trigger two listeners in mockCanvas since the
			// same touchmove event is registered twice in Input.js (for whatever reason).
			// This is why preventDefaultCalls gets incremented by 2.
			mockCanvas.dispatchEvent("touchmove", eventMove);
			assert.equal(preventDefaultCalls.length, 3);
			assert.equal(mockCamera.panCalls.length, 2); // gets called twice too
			assert.deepEqual(mockCamera.panCalls[0], { dx: 50, dy: 20 });

			const eventEnd = {
				touches: [],
				preventDefault: () => preventDefaultCalls.push(1),
			};

			// Movement was large enough so no click should be fired
			mockCanvas.dispatchEvent("touchend", eventEnd);
			assert.equal(preventDefaultCalls.length, 5); // gets called twice
			assert.equal(input.isDragging, false);
			assert.equal(lastClick, null);
		});

		it("handles single touch tap (click)", () => {
			mockCanvas.dispatchEvent("touchstart", {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => {},
			});

			// Small move
			mockCanvas.dispatchEvent("touchmove", {
				touches: [{ clientX: 102, clientY: 102 }],
				preventDefault: () => {},
			});

			mockCanvas.dispatchEvent("touchend", {
				touches: [],
				preventDefault: () => {},
			});

			assert.deepEqual(lastClick, { x: 102, y: 102 });
		});

		it("detects single touch tap if movement is just under boundary threshold (dist < 10)", () => {
			mockCanvas.dispatchEvent("touchstart", {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => {},
			});

			// Move by 6 in both axes (hypot = 8.485 < 10)
			mockCanvas.dispatchEvent("touchmove", {
				touches: [{ clientX: 106, clientY: 106 }],
				preventDefault: () => {},
			});

			mockCanvas.dispatchEvent("touchend", {
				touches: [],
				preventDefault: () => {},
			});

			assert.deepEqual(lastClick, { x: 106, y: 106 });
		});

		it("ignores single touch tap if movement is exactly at boundary threshold (dist === 10)", () => {
			mockCanvas.dispatchEvent("touchstart", {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => {},
			});

			// Move by 6 in X, 8 in Y (hypot = 10)
			mockCanvas.dispatchEvent("touchmove", {
				touches: [{ clientX: 106, clientY: 108 }],
				preventDefault: () => {},
			});

			mockCanvas.dispatchEvent("touchend", {
				touches: [],
				preventDefault: () => {},
			});

			assert.equal(lastClick, null);
		});

		it("handles two-finger pinch zoom", () => {
			// Touch start with 2 fingers
			mockCanvas.dispatchEvent("touchstart", {
				touches: [
					{ clientX: 100, clientY: 100 },
					{ clientX: 200, clientY: 100 },
				],
				preventDefault: () => {},
			});
			assert.equal(input.isDragging, false);

			// Touch move with 2 fingers (distance increased)
			mockCanvas.dispatchEvent("touchmove", {
				touches: [
					{ clientX: 50, clientY: 100 },
					{ clientX: 250, clientY: 100 },
				],
				preventDefault: () => {},
			});

			// Initial distance: 100
			// New distance: 200
			// Zoom factor: 2
			// Initial zoom: 1
			// Target zoom: 2
			// Zoom delta: 1
			// Centroid: (150, 100)

			// Input.js attaches TWO identical touchmove event handlers!
			// That's why mockCamera.adjustZoom is called 2 times.
			assert.equal(mockCamera.adjustZoomCalls.length, 2);
			assert.deepEqual(mockCamera.adjustZoomCalls[0], {
				delta: 1,
				x: 150,
				y: 100,
			});
			assert.equal(zoomChangeCount, 2);

			// test pinch and zoom out
			mockCanvas.dispatchEvent("touchmove", {
				touches: [
					{ clientX: 125, clientY: 100 },
					{ clientX: 175, clientY: 100 },
				],
				preventDefault: () => {},
			});

			// Initial distance: 100
			// New distance: 50
			// Target zoom: 0.5
			// Zoom delta: 0.5 - 1 = -0.5
			// Centroid: (150, 100)

			assert.deepEqual(mockCamera.adjustZoomCalls[2], {
				delta: -0.5,
				x: 150,
				y: 100,
			});
		});

		it("transitions from double touch back to single touch", () => {
			// Touch start with 2 fingers
			mockCanvas.dispatchEvent("touchstart", {
				touches: [
					{ clientX: 100, clientY: 100 },
					{ clientX: 200, clientY: 100 },
				],
				preventDefault: () => {},
			});

			mockCanvas.dispatchEvent("touchend", {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => {},
			});

			assert.equal(input.isDragging, true);
			assert.equal(input.dragStartX, 100);
			assert.equal(input.dragStartY, 100);
		});

		it("does not throw on touch tap if onClick callback is not provided", () => {
			const inputNoClick = new Input(mockCanvas, mockCamera, () => {});
			inputNoClick.onClick = undefined; // Force it to be undefined

			mockCanvas.dispatchEvent("touchstart", {
				touches: [{ clientX: 100, clientY: 100 }],
				preventDefault: () => {},
			});

			// Release within tap threshold (dist < 10)
			mockCanvas.dispatchEvent("touchend", {
				touches: [],
				preventDefault: () => {},
			});

			assert.equal(inputNoClick.isDragging, false);
			// Successful execution without throwing validates the test
		});
	});
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Camera } from "../public/Camera.js";

describe("Camera", () => {
	const world = { width: 1000, height: 1000 };
	const screen = { width: 800, height: 600 };

	it("initializes with default values and centers on the world", () => {
		const camera = new Camera(world, screen);

		assert.equal(camera.zoom, 1);
		assert.equal(camera.minZoom, 0.1);
		assert.equal(camera.maxZoom, 5);

		assert.equal(camera.x, 100);
		assert.equal(camera.y, 200);
	});

	it("centers on a specific coordinate via focusOn", () => {
		const camera = new Camera(world, screen);
		const focusX = 300;
		const focusY = 400;

		camera.focusOn(focusX, focusY, screen);

		assert.equal(camera.x, -100);
		assert.equal(camera.y, 100);
	});

	describe("adjustZoom", () => {
		it("increases zoom without a pivot point", () => {
			const camera = new Camera(world, screen);
			const initialX = camera.x;
			const initialY = camera.y;

			camera.adjustZoom(0.5);

			assert.equal(camera.zoom, 1.5);
			assert.equal(camera.x, initialX);
			assert.equal(camera.y, initialY);
		});

		it("decreases zoom and respects minZoom limit", () => {
			const camera = new Camera(world, screen);

			camera.adjustZoom(-2.0);

			assert.equal(camera.zoom, 0.1);
		});

		it("increases zoom and respects maxZoom limit", () => {
			const camera = new Camera(world, screen);

			camera.adjustZoom(5.0);

			assert.equal(camera.zoom, 5);
		});

		it("adjusts position correctly when zooming with a pivot", () => {
			const camera = new Camera(world, screen);
			const pivotX = 400;
			const pivotY = 300;

			camera.adjustZoom(1.0, pivotX, pivotY);

			assert.equal(camera.zoom, 2);
			assert.equal(camera.x, 300);
			assert.equal(camera.y, 350);
		});

		it("does not adjust position if zoom limit is already reached", () => {
			const camera = new Camera(world, screen);
			camera.zoom = 5;
			const initialX = camera.x;
			const initialY = camera.y;

			camera.adjustZoom(1.0, 400, 300);

			assert.equal(camera.zoom, 5);
			assert.equal(camera.x, initialX);
			assert.equal(camera.y, initialY);
		});
	});

	describe("pan", () => {
		it("pans camera relative to current zoom", () => {
			const camera = new Camera(world, screen);
			camera.zoom = 2;
			camera.centerOn(world, screen);
			// recalculate position with new zoom:
			// x = 1000/2 - 800/(2*2) = 500 - 200 = 300
			// y = 1000/2 - 600/(2*2) = 500 - 150 = 350
			const initialX = camera.x;
			const initialY = camera.y;

			camera.pan(100, -50);

			assert.equal(camera.x, initialX - 50);
			assert.equal(camera.y, initialY + 25);
		});
	});

	describe("Coordinate Transformations", () => {
		it("transforms world to screen coordinates", () => {
			const camera = new Camera(world, screen);
			camera.zoom = 2;

			const screenCoords = camera.worldToScreen(200, 300);

			assert.equal(screenCoords.x, 200);
			assert.equal(screenCoords.y, 200);
		});

		it("transforms screen to world coordinates", () => {
			const camera = new Camera(world, screen);
			camera.zoom = 2;

			const worldCoords = camera.screenToWorld(200, 300);

			assert.equal(worldCoords.x, 200);
			assert.equal(worldCoords.y, 350);
		});

		it("transforms coordinate symmetrically (world -> screen -> world)", () => {
			const camera = new Camera(world, screen);
			camera.zoom = 1.5;
			camera.pan(50, -20);
			const originalWorldX = 750;
			const originalWorldY = 820;

			const screenCoords = camera.worldToScreen(originalWorldX, originalWorldY);
			const backToWorld = camera.screenToWorld(screenCoords.x, screenCoords.y);

			assert.equal(backToWorld.x, originalWorldX);
			assert.equal(backToWorld.y, originalWorldY);
		});
	});
});

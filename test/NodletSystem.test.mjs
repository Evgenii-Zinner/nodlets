import assert from "node:assert/strict";
import test from "node:test";
import { NodletSystem } from "../public/NodletSystem.js";

test("NodletSystem - Core Initialization", async (t) => {
	await t.test("initializes with correct default state", () => {
		const sys = new NodletSystem(100);
		assert.equal(sys.maxNodlets, 100);
		assert.equal(sys.count, 0);

		// Assert array sizes
		assert.equal(sys.posX.length, 100);
		assert.equal(sys.posY.length, 100);
		assert.equal(sys.velX.length, 100);
		assert.equal(sys.velY.length, 100);
		assert.equal(sys.size.length, 100);
	});
});

test("NodletSystem - Spawning logic", async (t) => {
	await t.test("spawns a nodlet correctly", () => {
		const sys = new NodletSystem(100);
		const idx = sys.spawn(10, 20, 1, 0xff0000ff);

		assert.equal(idx, 0);
		assert.equal(sys.count, 1);
		assert.equal(sys.posX[idx], 10);
		assert.equal(sys.posY[idx], 20);
		assert.equal(sys.hubId[idx], 1);
		assert.equal(sys.color[idx], 0xff0000ff);
		assert.equal(sys.state[idx], 0);

		assert.ok(sys.size[idx] >= 8 && sys.size[idx] <= 12);
		assert.ok(sys.orbitRadius[idx] >= 40 && sys.orbitRadius[idx] <= 100);
	});

	await t.test("rejects spawning beyond maxNodlets limit", () => {
		const sys = new NodletSystem(2);
		assert.equal(sys.spawn(0, 0, 1), 0);
		assert.equal(sys.spawn(0, 0, 1), 1);

		assert.equal(sys.spawn(0, 0, 1), -1);
		assert.equal(sys.count, 2);
	});
});

test("NodletSystem - Despawn Logic", async (t) => {
	await t.test("despawns a nodlet and swaps with last element", () => {
		const sys = new NodletSystem(10);
		sys.spawn(10, 10, 1); // idx 0
		sys.spawn(20, 20, 1); // idx 1
		sys.spawn(30, 30, 1); // idx 2

		assert.equal(sys.count, 3);

		sys.despawn(1);

		assert.equal(sys.count, 2);
		assert.equal(sys.posX[1], 30);
		assert.equal(sys.posY[1], 30);
	});

	await t.test("ignores out-of-bounds despawn attempts gracefully", () => {
		const sys = new NodletSystem(10);
		sys.spawn(0, 0, 1);

		sys.despawn(-1);
		sys.despawn(5);
		assert.equal(sys.count, 1);
	});
});

test("NodletSystem - forEachNeighbor Logic", async (t) => {
	await t.test("finds neighbors within radius", () => {
		const sys = new NodletSystem(10);
		sys.spawn(10, 10, 1); // idx 0
		sys.spawn(20, 20, 1); // idx 1
		sys.spawn(100, 100, 1); // idx 2

		const neighbors = [];
		sys.forEachNeighbor(15, 15, 20, (idx) => neighbors.push(idx));

		assert.equal(neighbors.length, 2);
		assert.ok(neighbors.includes(0));
		assert.ok(neighbors.includes(1));
		assert.ok(!neighbors.includes(2));
	});
});

test("NodletSystem - Update Logic", async (t) => {
	await t.test("updates positions and applies soft bounce on bounds", () => {
		const sys = new NodletSystem(10);
		const world = { width: 1000, height: 1000 };

		const idx = sys.spawn(995, 995, 1);
		sys.size[idx] = 20; // Radius 10
		sys.velX[idx] = 100; // Moving out of bounds right
		sys.velY[idx] = 100; // Moving out of bounds bottom

		sys.update(0.1, world);

		// Expected pos > 990 (max bound is 990) -> bounced
		assert.equal(sys.posX[idx], 990);
		assert.equal(sys.posY[idx], 990);

		// Velocity should be multiplied by -0.6
		assert.equal(sys.velX[idx], -60);
		assert.equal(sys.velY[idx], -60);
	});

	await t.test(
		"updates positions and applies soft bounce on min bounds",
		() => {
			const sys = new NodletSystem(10);
			const world = { width: 1000, height: 1000 };

			const idx = sys.spawn(5, 5, 1);
			sys.size[idx] = 20; // Radius 10
			sys.velX[idx] = -100; // Moving out of bounds left
			sys.velY[idx] = -100; // Moving out of bounds top

			sys.update(0.1, world);

			assert.equal(sys.posX[idx], 10);
			assert.equal(sys.posY[idx], 10);

			// Velocity should be multiplied by -0.6
			assert.equal(sys.velX[idx], 60);
			assert.equal(sys.velY[idx], 60);
		},
	);
});

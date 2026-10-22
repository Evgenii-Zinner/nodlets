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

		// Store properties of the last element before despawn
		const lastPosX = sys.posX[2];
		const lastPosY = sys.posY[2];
		const lastVelX = sys.velX[2];
		const lastVelY = sys.velY[2];
		const lastSize = sys.size[2];
		const lastCarriedData = sys.carriedData[2];
		const lastMaxCapacity = sys.maxDataCapacity[2];
		const lastAge = sys.age[2];
		const lastColor = sys.color[2];
		const lastHubId = sys.hubId[2];
		const lastWanderAngle = sys.wanderAngle[2];
		const lastWanderTimer = sys.wanderTimer[2];
		const lastOrbitRadius = sys.orbitRadius[2];
		const lastOrbitDirection = sys.orbitDirection[2];
		const lastState = sys.state[2];

		sys.despawn(1);

		assert.equal(sys.count, 2);

		// Assert that ALL properties were correctly swapped
		assert.equal(sys.posX[1], lastPosX);
		assert.equal(sys.posY[1], lastPosY);
		assert.equal(sys.velX[1], lastVelX);
		assert.equal(sys.velY[1], lastVelY);
		assert.equal(sys.size[1], lastSize);
		assert.equal(sys.carriedData[1], lastCarriedData);
		assert.equal(sys.maxDataCapacity[1], lastMaxCapacity);
		assert.equal(sys.age[1], lastAge);
		assert.equal(sys.color[1], lastColor);
		assert.equal(sys.hubId[1], lastHubId);
		assert.equal(sys.wanderAngle[1], lastWanderAngle);
		assert.equal(sys.wanderTimer[1], lastWanderTimer);
		assert.equal(sys.orbitRadius[1], lastOrbitRadius);
		assert.equal(sys.orbitDirection[1], lastOrbitDirection);
		assert.equal(sys.state[1], lastState);
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

	await t.test(
		"does not apply soft bounce when exactly on the min boundary",
		() => {
			const sys = new NodletSystem(10);
			const world = { width: 1000, height: 1000 };

			const idx = sys.spawn(20, 20, 1);
			sys.size[idx] = 20; // Radius 10
			sys.velX[idx] = -100; // moving towards left boundary
			sys.velY[idx] = -100; // moving towards top boundary

			// If dt is 0.1, px = 20 + (-100 * 0.1) = 10 (exactly the radius)
			sys.update(0.1, world);

			// Should be exactly on bounds, NOT strictly less than radius
			assert.equal(sys.posX[idx], 10);
			assert.equal(sys.posY[idx], 10);

			// Velocity should NOT be modified because it's not out of bounds
			assert.equal(sys.velX[idx], -100);
			assert.equal(sys.velY[idx], -100);
		},
	);

	await t.test(
		"does not apply soft bounce when exactly on the max boundary",
		() => {
			const sys = new NodletSystem(10);
			const world = { width: 1000, height: 1000 };

			const idx = sys.spawn(980, 980, 1);
			sys.size[idx] = 20; // Radius 10
			sys.velX[idx] = 100; // moving towards right boundary
			sys.velY[idx] = 100; // moving towards bottom boundary

			// If dt is 0.1, px = 980 + (100 * 0.1) = 990 (exactly maxX which is 1000 - 10)
			sys.update(0.1, world);

			assert.equal(sys.posX[idx], 990);
			assert.equal(sys.posY[idx], 990);

			// Velocity should NOT be modified because it's not out of bounds
			assert.equal(sys.velX[idx], 100);
			assert.equal(sys.velY[idx], 100);
		},
	);
});

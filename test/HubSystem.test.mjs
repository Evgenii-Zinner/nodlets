import assert from "node:assert/strict";
import test from "node:test";
import { HubSystem } from "../public/HubSystem.js";

test("HubSystem - Core Initialization", async (t) => {
	await t.test("initializes with correct default state and flat arrays", () => {
		const sys = new HubSystem(100);
		assert.equal(sys.maxHubs, 100);
		assert.equal(sys.count, 0);

		// Assert array sizes
		assert.equal(sys.posX.length, 100);
		assert.equal(sys.posY.length, 100);
		assert.equal(sys.data.length, 100);
		assert.equal(sys.baseNodletCapacity.length, 100);
		assert.equal(sys.activeNodlets.length, 100);
		assert.equal(sys.color.length, 100);
		assert.equal(sys.size.length, 100);
	});
});

test("HubSystem - Spawning Logic", async (t) => {
	await t.test("spawns a hub correctly with default values", () => {
		const sys = new HubSystem(10);
		const idx = sys.spawn(150, 250);

		assert.equal(idx, 0);
		assert.equal(sys.count, 1);
		assert.equal(sys.posX[idx], 150);
		assert.equal(sys.posY[idx], 250);
		assert.equal(sys.data[idx], 0);
		assert.equal(sys.baseNodletCapacity[idx], 10);
		assert.equal(sys.activeNodlets[idx], 0);
		assert.equal(sys.color[idx], 0xbc13feff);
		assert.equal(sys.size[idx], 40);
	});

	await t.test("spawns a hub correctly with custom color", () => {
		const sys = new HubSystem(10);
		const idx = sys.spawn(100, 100, 0xff0000ff);

		assert.equal(idx, 0);
		assert.equal(sys.color[idx], 0xff0000ff);
	});

	await t.test("rejects spawning beyond maxHubs limit", () => {
		const sys = new HubSystem(2);
		assert.equal(sys.spawn(0, 0), 0);
		assert.equal(sys.spawn(0, 0), 1);

		assert.equal(sys.spawn(0, 0), -1);
		assert.equal(sys.count, 2);
	});
});

test("HubSystem - Despawn and Swap/Pop", async (t) => {
	await t.test(
		"despawns a hub and swaps with last element to maintain dense array",
		() => {
			const sys = new HubSystem(10);
			sys.spawn(10, 10); // idx 0
			sys.spawn(20, 20); // idx 1
			sys.spawn(30, 30); // idx 2

			assert.equal(sys.count, 3);

			sys.despawn(1);

			assert.equal(sys.count, 2);
			assert.equal(sys.posX[1], 30);
			assert.equal(sys.posY[1], 30);
		},
	);

	await t.test("ignores out-of-bounds despawn attempts gracefully", () => {
		const sys = new HubSystem(10);
		sys.spawn(0, 0);

		sys.despawn(-1);
		sys.despawn(5);
		assert.equal(sys.count, 1);
	});

	await t.test("despawning the last element skips swap", () => {
		const sys = new HubSystem(10);
		sys.spawn(10, 10); // idx 0
		sys.spawn(20, 20); // idx 1

		sys.despawn(1);

		assert.equal(sys.count, 1);
		assert.equal(sys.posX[0], 10);
	});
});

test("HubSystem - Data Deposit Logic", async (t) => {
	await t.test("deposits data to a valid hub index", () => {
		const sys = new HubSystem(10);
		sys.spawn(10, 10); // idx 0
		sys.spawn(20, 20); // idx 1

		sys.depositData(1, 150);

		assert.equal(sys.data[0], 0);
		assert.equal(sys.data[1], 150);
	});

	await t.test(
		"ignores data deposit to invalid or out-of-bounds indices",
		() => {
			const sys = new HubSystem(10);
			sys.spawn(10, 10); // idx 0

			sys.depositData(-1, 50);
			sys.depositData(1, 50);
			sys.depositData(10, 50);

			assert.equal(sys.data[0], 0);
		},
	);
});

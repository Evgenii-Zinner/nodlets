import assert from "node:assert/strict";
import test from "node:test";
import { ResourceSystem } from "../public/ResourceSystem.js";

test("ResourceSystem - Core Initialization", async (t) => {
	await t.test("initializes with correct default state and flat arrays", () => {
		const maxResources = 100;
		const sys = new ResourceSystem(maxResources);

		assert.equal(sys.maxResources, maxResources);
		assert.equal(sys.count, 0);
		assert.equal(sys.activePacketCount, 0);
		assert.equal(sys.dirtyGrid, true);

		// Assert array sizes
		assert.equal(sys.type.length, maxResources);
		assert.equal(sys.posX.length, maxResources);
		assert.equal(sys.posY.length, maxResources);
		assert.equal(sys.amount.length, maxResources);
	});
});

test("ResourceSystem - Spawning and Capacity Limits", async (t) => {
	await t.test("spawns a Generator Server correctly", () => {
		const sys = new ResourceSystem(100);
		const idx = sys.spawnServer(10, 20, 500, 0);

		assert.equal(idx, 0);
		assert.equal(sys.count, 1);
		assert.equal(sys.type[idx], 0);
		assert.equal(sys.posX[idx], 10);
		assert.equal(sys.posY[idx], 20);
		assert.equal(sys.amount[idx], 500);
		assert.equal(sys.maxAmount[idx], 500);
		assert.equal(sys.dirtyGrid, true);
	});

	await t.test("spawns a Packet correctly", () => {
		const sys = new ResourceSystem(100);
		const idx = sys.spawnPacket(10, 10, 100, 100, 50);

		assert.equal(idx, 0);
		assert.equal(sys.count, 1);
		assert.equal(sys.activePacketCount, 1);
		assert.equal(sys.type[idx], 2);
		assert.equal(sys.posX[idx], 10);
		assert.equal(sys.targetX[idx], 100);
		assert.equal(sys.amount[idx], 50);
		assert.ok(
			sys.speed[idx] >= 251 && sys.speed[idx] <= 350,
			"Packet speed out of bounds",
		);
	});

	await t.test("rejects spawning beyond maxResources limit", () => {
		const sys = new ResourceSystem(2);

		assert.equal(sys.spawnServer(0, 0, 100, 0), 0);
		assert.equal(sys.spawnServer(0, 0, 100, 1), 1);

		// Should reject
		assert.equal(sys.spawnServer(0, 0, 100, 0), -1);
		assert.equal(sys.spawnPacket(0, 0, 10, 10, 10), -1);
		assert.equal(sys.count, 2);
	});
});

test("ResourceSystem - Despawn and Swap/Pop", async (t) => {
	await t.test(
		"despawns a resource and swaps with last element to maintain dense array",
		() => {
			const sys = new ResourceSystem(10);
			sys.spawnServer(10, 10, 100, 0); // idx 0
			sys.spawnServer(20, 20, 200, 1); // idx 1
			sys.spawnPacket(30, 30, 40, 40, 50); // idx 2

			assert.equal(sys.count, 3);
			assert.equal(sys.activePacketCount, 1);

			// Despawn the middle one
			sys.despawn(1);

			assert.equal(sys.count, 2);
			assert.equal(sys.activePacketCount, 1); // Packet wasn't despawned

			// The packet (idx 2) should have moved to idx 1
			assert.equal(sys.type[1], 2);
			assert.equal(sys.posX[1], 30);
			assert.equal(sys.amount[1], 50);
			assert.equal(sys.dirtyGrid, true);
		},
	);

	await t.test("despawning a packet decrements activePacketCount", () => {
		const sys = new ResourceSystem(10);
		const idx = sys.spawnPacket(0, 0, 10, 10, 50);
		assert.equal(sys.activePacketCount, 1);

		sys.despawn(idx);
		assert.equal(sys.activePacketCount, 0);
		assert.equal(sys.count, 0);
	});

	await t.test("ignores out-of-bounds despawn attempts gracefully", () => {
		const sys = new ResourceSystem(10);
		sys.spawnServer(0, 0, 100, 0);

		sys.despawn(-1);
		sys.despawn(5);
		assert.equal(sys.count, 1);
	});
});

test("ResourceSystem - Grid Initialization and Neighbors", async (t) => {
	await t.test(
		"initializes spatial grid correctly based on world bounds",
		() => {
			const sys = new ResourceSystem(10);
			// With cellSize = 200, a 500x500 world means 3 cols, 3 rows
			sys.initGrid(500, 500);

			assert.equal(sys.gridCols, 3);
			assert.equal(sys.gridRows, 3);
			assert.equal(sys.grid.length, 9);
			assert.equal(sys.grid[0], -1);
		},
	);

	await t.test(
		"getNeighbors accurately returns resources within radius",
		() => {
			const sys = new ResourceSystem(10);
			const world = { width: 1000, height: 1000 };

			const s1 = sys.spawnServer(100, 100, 100, 0);
			const s2 = sys.spawnServer(150, 100, 100, 0); // dist 50
			const s3 = sys.spawnServer(500, 500, 100, 0); // far

			sys.update(0.1, world); // Forces grid update

			const outArray = new Int32Array(10);
			const count = sys.getNeighbors(100, 100, 60, outArray);

			assert.equal(count, 2);
			const found = Array.from(outArray.subarray(0, count));
			assert.ok(found.includes(s1));
			assert.ok(found.includes(s2));
			assert.ok(!found.includes(s3));
		},
	);

	await t.test("getNeighbors safely handles edge queries near bounds", () => {
		const sys = new ResourceSystem(10);
		sys.initGrid(1000, 1000);

		const outArray = new Int32Array(10);
		// Querying at the extreme negative coordinate
		const count = sys.getNeighbors(-500, -500, 100, outArray);
		assert.equal(count, 0);
	});
});

test("ResourceSystem - Update Logic", async (t) => {
	await t.test("generators regenerate amount up to maxAmount", () => {
		const sys = new ResourceSystem(10);
		const world = { width: 1000, height: 1000 };

		const idx = sys.spawnServer(0, 0, 100, 0);
		sys.amount[idx] = 50; // Drain it

		// Regenerates 10 bytes per second
		sys.update(2.0, world);

		assert.equal(sys.amount[idx], 70);

		sys.update(10.0, world); // Over-regen
		assert.equal(sys.amount[idx], 100); // Clamped
	});

	await t.test(
		"packets move towards destination based on speed and deltaTime",
		() => {
			const sys = new ResourceSystem(10);
			const world = { width: 1000, height: 1000 };

			// Spawn at 0,0 going to 100,0
			const idx = sys.spawnPacket(0, 0, 100, 0, 50);
			sys.speed[idx] = 10; // Explicit speed for math: 10 units/sec

			sys.update(1.0, world); // Move for 1 second

			// X should be ~10, Y should be 0
			assert.ok(Math.abs(sys.posX[idx] - 10) < 0.001);
			assert.equal(sys.posY[idx], 0);
		},
	);

	await t.test(
		"packets despawn and transfer amount when reaching destination server",
		() => {
			const sys = new ResourceSystem(10);
			const world = { width: 1000, height: 1000 };

			// Target server at 100, 100 with capacity space
			const sIdx = sys.spawnServer(100, 100, 500, 0);
			sys.amount[sIdx] = 200; // 300 space left

			// Packet spawned very close to target (distSq < 100)
			sys.spawnPacket(95, 95, 100, 100, 50);

			assert.equal(sys.count, 2);

			// Update grid first to ensure neighbors are found correctly
			sys.initGrid(world.width, world.height);
			sys.updateGrid();
			// Update will process movement, find dist < 10, trigger delivery
			sys.update(0.1, world);

			assert.equal(sys.count, 1, "Packet should be despawned");
			// Note: server also regenerates during the 0.1s update, so it gains 10*0.1 = +1 extra. 200 + 50 + 1 = 251.
			assert.equal(
				sys.amount[sIdx],
				251,
				"Server amount should increase by packet amount and regeneration",
			);
		},
	);
});

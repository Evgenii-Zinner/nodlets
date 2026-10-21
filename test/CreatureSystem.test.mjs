import assert from "node:assert/strict";
import test from "node:test";
import { CreatureSystem } from "../public/CreatureSystem.js";

test("CreatureSystem - Core Initialization", async (t) => {
	await t.test("initializes with correct default state and flat arrays", () => {
		const maxCreatures = 500;
		const sys = new CreatureSystem(maxCreatures);

		assert.equal(sys.maxCreatures, maxCreatures);
		assert.equal(sys.count, 0);

		// Assert array sizes
		assert.equal(sys.posX.length, maxCreatures);
		assert.equal(sys.posY.length, maxCreatures);
		assert.equal(sys.velX.length, maxCreatures);
		assert.equal(sys.velY.length, maxCreatures);
		assert.equal(sys.size.length, maxCreatures);
		assert.equal(sys.energy.length, maxCreatures);
		assert.equal(sys.intelligence.length, maxCreatures);
		assert.equal(sys.maxEnergy.length, maxCreatures);
		assert.equal(sys.age.length, maxCreatures);
		assert.equal(sys.color.length, maxCreatures);
		assert.equal(sys.wanderAngle.length, maxCreatures);
		assert.equal(sys.wanderTimer.length, maxCreatures);
		assert.equal(sys.state.length, maxCreatures);
		assert.equal(sys.nextInCell.length, maxCreatures);
	});
});

test("CreatureSystem - Grid and Neighbors", async (t) => {
	await t.test("initializes and updates spatial grid correctly", () => {
		const sys = new CreatureSystem(10);
		sys.initGrid(500, 500); // cellSize is 200, so 3x3 grid
		assert.equal(sys.gridCols, 3);
		assert.equal(sys.gridRows, 3);
		assert.equal(sys.grid.length, 9);

		const idx1 = sys.spawn(50, 50); // cell 0,0 (index 0)
		const idx2 = sys.spawn(250, 50); // cell 1,0 (index 1)

		sys.updateGrid();

		assert.equal(sys.grid[0], idx1);
		assert.equal(sys.grid[1], idx2);
		assert.equal(sys.nextInCell[idx1], -1);
		assert.equal(sys.nextInCell[idx2], -1);
	});

	await t.test(
		"forEachNeighbor accurately returns creatures within radius",
		() => {
			const sys = new CreatureSystem(10);
			sys.initGrid(1000, 1000);

			const c1 = sys.spawn(100, 100);
			const c2 = sys.spawn(120, 100); // dist 20
			const c3 = sys.spawn(500, 500); // far

			sys.updateGrid();

			const neighbors = [];
			sys.forEachNeighbor(100, 100, 50, (idx) => neighbors.push(idx));

			assert.equal(neighbors.length, 2);
			assert.ok(neighbors.includes(c1));
			assert.ok(neighbors.includes(c2));
			assert.ok(!neighbors.includes(c3));
		},
	);

	await t.test("forEachNeighbor gracefully handles uninitialized grid", () => {
		const sys = new CreatureSystem(10);
		sys.spawn(100, 100);

		let callCount = 0;
		sys.forEachNeighbor(100, 100, 50, () => callCount++);
		assert.equal(callCount, 0); // shouldn't throw, just returns
	});
});

test("CreatureSystem - Spawning Logic", async (t) => {
	await t.test("spawns a creature correctly with defaults", () => {
		const sys = new CreatureSystem(10);
		const idx = sys.spawn(100, 200);

		assert.equal(idx, 0);
		assert.equal(sys.count, 1);
		assert.equal(sys.posX[idx], 100);
		assert.equal(sys.posY[idx], 200);
		assert.ok(sys.velX[idx] >= -10 && sys.velX[idx] <= 10);
		assert.ok(sys.velY[idx] >= -10 && sys.velY[idx] <= 10);
		assert.ok(sys.size[idx] >= 8 && sys.size[idx] <= 12);
		assert.equal(sys.energy[idx], 20);
		assert.equal(sys.age[idx], 0);
		assert.equal(sys.state[idx], 1);
	});

	await t.test("spawns with inheritance and mutations", () => {
		const sys = new CreatureSystem(10);

		const parentParams = { size: 10, color: 0x123456ff };
		const perks = {
			maxEnergyBoost: 50,
			positiveMutationChance: 1.0, // Force positive mutation
			negativeMutationChance: 0.0,
		};

		const idx = sys.spawn(100, 200, parentParams, perks);

		assert.equal(sys.color[idx], 0x123456ff);
		assert.ok(sys.size[idx] >= 11 && sys.size[idx] <= 12); // size * 1.1 or 1.2
		assert.ok(sys.maxEnergy[idx] >= 130); // 80 base + up to 40 + 50 boost
	});

	await t.test("rejects spawning beyond maxCreatures limit", () => {
		const sys = new CreatureSystem(2);

		assert.equal(sys.spawn(0, 0), 0);
		assert.equal(sys.spawn(0, 0), 1);
		assert.equal(sys.spawn(0, 0), -1); // Exceeded
		assert.equal(sys.count, 2);
	});
});

test("CreatureSystem - Despawn Logic", async (t) => {
	await t.test(
		"despawns a creature and swaps with last element to maintain density",
		() => {
			const sys = new CreatureSystem(10);
			sys.spawn(10, 10); // idx 0
			sys.spawn(20, 20); // idx 1
			sys.spawn(30, 30); // idx 2

			assert.equal(sys.count, 3);

			sys.despawn(1); // despawn middle element

			assert.equal(sys.count, 2);
			// Element 2 should have been swapped to position 1
			assert.equal(sys.posX[1], 30);
			assert.equal(sys.posY[1], 30);
		},
	);

	await t.test("ignores out-of-bounds despawn attempts gracefully", () => {
		const sys = new CreatureSystem(10);
		sys.spawn(0, 0);

		sys.despawn(-1);
		sys.despawn(5);
		assert.equal(sys.count, 1);
	});
});

test("CreatureSystem - Update Logic", async (t) => {
	await t.test("updates positions based on velocity and deltaTime", () => {
		const sys = new CreatureSystem(10);
		const world = { width: 1000, height: 1000 };

		const idx = sys.spawn(100, 100);
		sys.velX[idx] = 50;
		sys.velY[idx] = 0;

		sys.update(1.0, world); // 1 second

		assert.equal(sys.posX[idx], 150);
		assert.equal(sys.posY[idx], 100);
	});

	await t.test("applies soft bounce on world boundaries", () => {
		const sys = new CreatureSystem(10);
		const world = { width: 1000, height: 1000 };

		// Max bounds bounce
		const idx1 = sys.spawn(995, 995);
		sys.size[idx1] = 20; // radius 10
		sys.velX[idx1] = 100;
		sys.velY[idx1] = 100;

		sys.update(0.1, world);

		assert.equal(sys.posX[idx1], 990); // clamped at 1000 - 10
		assert.equal(sys.posY[idx1], 990);
		assert.equal(sys.velX[idx1], -60); // 100 * -0.6
		assert.equal(sys.velY[idx1], -60);

		// Min bounds bounce
		const idx2 = sys.spawn(5, 5);
		sys.size[idx2] = 20; // radius 10
		sys.velX[idx2] = -100;
		sys.velY[idx2] = -100;

		sys.update(0.1, world);

		assert.equal(sys.posX[idx2], 10); // clamped at 0 + 10
		assert.equal(sys.posY[idx2], 10);
		assert.equal(sys.velX[idx2], 60); // -100 * -0.6
		assert.equal(sys.velY[idx2], 60);
	});

	await t.test("depletes energy over time and clamps at 0", () => {
		const sys = new CreatureSystem(10);
		const world = { width: 1000, height: 1000 };

		const idx = sys.spawn(100, 100);
		sys.energy[idx] = 1.5;

		sys.update(1.0, world); // drain 1 unit
		assert.equal(sys.energy[idx], 0.5);

		sys.update(1.0, world); // drain 1 unit, should clamp to 0
		assert.equal(sys.energy[idx], 0);
	});
});

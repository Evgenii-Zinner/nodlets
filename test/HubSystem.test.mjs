import assert from "node:assert/strict";
import test from "node:test";
import { HubSystem } from "../public/HubSystem.js";

test("HubSystem spawn - happy path and defaults", () => {
	const sys = new HubSystem(10);
	const idx = sys.spawn(100, 200, 0xff0000ff);

	assert.equal(idx, 0, "First spawned hub should have index 0");
	assert.equal(sys.count, 1, "Count should be incremented");
	assert.equal(sys.posX[idx], 100, "X position should match");
	assert.equal(sys.posY[idx], 200, "Y position should match");
	assert.equal(sys.data[idx], 0, "Initial data should be 0");
	assert.equal(
		sys.baseNodletCapacity[idx],
		10,
		"Default capacity should be 10",
	);
	assert.equal(sys.activeNodlets[idx], 0, "Active nodlets should start at 0");
	assert.equal(sys.color[idx], 0xff0000ff, "Color should match input");
	assert.equal(sys.size[idx], 40, "Default size should be 40");
});

test("HubSystem spawn - capacity bounds", () => {
	const sys = new HubSystem(2);

	const idx1 = sys.spawn(0, 0);
	const idx2 = sys.spawn(10, 10);

	assert.equal(idx1, 0, "First index should be 0");
	assert.equal(idx2, 1, "Second index should be 1");
	assert.equal(sys.count, 2, "Count should be 2");

	const idx3 = sys.spawn(20, 20);
	assert.equal(idx3, -1, "Should return -1 when spawning beyond capacity");
	assert.equal(sys.count, 2, "Count should remain 2");
});

test("HubSystem despawn - swap and pop mechanism", () => {
	const sys = new HubSystem(10);
	const _id0 = sys.spawn(10, 10, 0x111111);
	const id1 = sys.spawn(20, 20, 0x222222);
	const _id2 = sys.spawn(30, 30, 0x333333);

	assert.equal(sys.count, 3, "Initial count should be 3");

	// Despawn the middle hub (id1). The last hub (id2) should be swapped into its place.
	sys.despawn(id1);

	assert.equal(sys.count, 2, "Count should decrease to 2");

	// Check that index 1 now holds the data that originally belonged to id2
	assert.equal(sys.posX[1], 30, "X position swapped correctly");
	assert.equal(sys.posY[1], 30, "Y position swapped correctly");
	assert.equal(sys.color[1], 0x333333, "Color swapped correctly");

	// Check that index 0 is unchanged
	assert.equal(sys.posX[0], 10, "Index 0 remains unchanged");
	assert.equal(sys.color[0], 0x111111, "Index 0 color unchanged");
});

test("HubSystem despawn - out of bounds graceful failure", () => {
	const sys = new HubSystem(5);
	sys.spawn(10, 10);

	assert.equal(sys.count, 1, "Initial count should be 1");

	// Try despawning invalid indices
	sys.despawn(-1);
	assert.equal(sys.count, 1, "Count should not change for negative index");

	sys.despawn(1);
	assert.equal(sys.count, 1, "Count should not change for index >= count");

	sys.despawn(5);
	assert.equal(sys.count, 1, "Count should not change for index >= maxHubs");
});

test("HubSystem depositData - happy path and bounds", () => {
	const sys = new HubSystem(5);
	const idx = sys.spawn(50, 50);

	assert.equal(sys.data[idx], 0, "Initial data is 0");

	// Deposit valid data
	sys.depositData(idx, 150.5);
	assert.equal(sys.data[idx], 150.5, "Data should accumulate correctly");

	sys.depositData(idx, 49.5);
	assert.equal(sys.data[idx], 200.0, "Data should sum correctly");

	// Try out of bounds deposits
	// Since invalid calls return early, we assert the system state didn't crash or mutate
	sys.depositData(-1, 500); // Should fail silently
	sys.depositData(1, 500); // Index >= count, should fail silently

	// We can't directly check arrays out of JS bounds, but we can verify it didn't mutate the valid hub
	assert.equal(
		sys.data[idx],
		200.0,
		"Valid hub data should be unaffected by OOB operations",
	);
});

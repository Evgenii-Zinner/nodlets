import assert from "node:assert/strict";
import test from "node:test";
import { UpgradeSystem } from "../public/UpgradeSystem.js";

test("UpgradeSystem - Core Initialization", async (t) => {
	await t.test("initializes with correct default state", () => {
		const sys = new UpgradeSystem();
		assert.equal(sys.totalDataEarned, 0);
		assert.equal(sys.spentPoints, 0);
		assert.equal(sys.bytesPerPoint, 1024);
		assert.equal(sys.availablePoints, 0);

		assert.deepEqual(sys.perks, {
			nodletCapacityBoost: 0,
			nodletSpeedMult: 1.0,
			hubInfluenceRadiusBoost: 0,
			nodletAmountBoost: 0,
		});

		assert.equal(sys.tree.tier1.unlocked, true);
		assert.equal(sys.tree.tier2.unlocked, false);
	});
});

test("UpgradeSystem - Point Calculation", async (t) => {
	await t.test(
		"availablePoints calculates from totalDataEarned and bytesPerPoint",
		() => {
			const sys = new UpgradeSystem();
			sys.addTotalData(1024 * 3);
			assert.equal(sys.availablePoints, 3);
		},
	);

	await t.test("availablePoints correctly accounts for spentPoints", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 5);
		sys.spentPoints = 2;
		assert.equal(sys.availablePoints, 3);
	});

	await t.test("availablePoints rounds down partial data points", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1500); // 1.46 points
		assert.equal(sys.availablePoints, 1);
	});

	await t.test(
		"negative totalDataEarned results in negative or zero availablePoints",
		() => {
			const sys = new UpgradeSystem();
			sys.addTotalData(-1024);
			assert.equal(sys.availablePoints, -1);
		},
	);

	await t.test(
		"negative spentPoints incorrectly increases available points (math bound behavior)",
		() => {
			const sys = new UpgradeSystem();
			sys.addTotalData(1024);
			sys.spentPoints = -5; // System bound check: it's purely total / bytes - spent
			assert.equal(sys.availablePoints, 6);
		},
	);

	await t.test(
		"divide by zero bytesPerPoint returns Infinity or NaN, verifying boundary",
		() => {
			const sys = new UpgradeSystem();
			sys.addTotalData(1024);
			sys.bytesPerPoint = 0;
			assert.equal(sys.availablePoints, Infinity);
		},
	);
});

test("UpgradeSystem - Purchase Logic", async (t) => {
	await t.test("rejects purchase of non-existent tier", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 10);
		const result = sys.buyUpgrade("tier99", "capacity");
		assert.equal(result, false);
		assert.equal(sys.spentPoints, 0);
	});

	await t.test("rejects purchase of non-existent node", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 10);
		const result = sys.buyUpgrade("tier1", "fake_node");
		assert.equal(result, false);
		assert.equal(sys.spentPoints, 0);
	});

	await t.test("rejects purchase if tier is locked", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 10);
		const result = sys.buyUpgrade("tier2", "capacity");
		assert.equal(result, false);
		assert.equal(sys.spentPoints, 0);
		assert.equal(sys.tree.tier2.nodes.capacity.unlocked, false);
	});

	await t.test("rejects purchase if available points are insufficient", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 0); // 0 points available
		const result = sys.buyUpgrade("tier1", "capacity"); // Costs 1
		assert.equal(result, false);
		assert.equal(sys.spentPoints, 0);
		assert.equal(sys.tree.tier1.nodes.capacity.unlocked, false);
	});

	await t.test("rejects purchase if node is already unlocked", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 5);

		// Buy once
		const firstBuy = sys.buyUpgrade("tier1", "capacity");
		assert.equal(firstBuy, true);
		assert.equal(sys.spentPoints, 1);

		// Buy again
		const secondBuy = sys.buyUpgrade("tier1", "capacity");
		assert.equal(secondBuy, false);
		assert.equal(sys.spentPoints, 1); // Should not increase
	});
});

test("UpgradeSystem - Tier Progression", async (t) => {
	await t.test("unlocks Tier 2 after 3 Tier 1 nodes are purchased", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 10); // Plenty of points

		assert.equal(sys.tree.tier2.unlocked, false);

		sys.buyUpgrade("tier1", "capacity");
		assert.equal(sys.tree.tier2.unlocked, false);

		sys.buyUpgrade("tier1", "speed");
		assert.equal(sys.tree.tier2.unlocked, false);

		sys.buyUpgrade("tier1", "influence");
		assert.equal(sys.tree.tier2.unlocked, true); // 3rd node unlocks tier 2
	});
});

test("UpgradeSystem - Perk Accumulation (Mutations)", async (t) => {
	await t.test("Tier 1 and Tier 2 Capacity correctly increases perk", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 20); // 20 points

		// Tier 1
		sys.buyUpgrade("tier1", "capacity");
		assert.equal(sys.perks.nodletCapacityBoost, 8);

		// Unlock Tier 2
		sys.buyUpgrade("tier1", "speed");
		sys.buyUpgrade("tier1", "influence");

		// Tier 2
		sys.buyUpgrade("tier2", "capacity");
		assert.equal(sys.perks.nodletCapacityBoost, 8 + 16);
	});

	await t.test("Tier 1 and Tier 2 Speed correctly increases perk", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 20);

		sys.buyUpgrade("tier1", "speed");
		assert.equal(Math.round(sys.perks.nodletSpeedMult * 10) / 10, 1.2); // Avoid float drift

		sys.buyUpgrade("tier1", "capacity");
		sys.buyUpgrade("tier1", "influence");

		sys.buyUpgrade("tier2", "speed");
		assert.equal(Math.round(sys.perks.nodletSpeedMult * 10) / 10, 1.5);
	});

	await t.test("Tier 1 and Tier 2 Influence correctly increases perk", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 20);

		sys.buyUpgrade("tier1", "influence");
		assert.equal(sys.perks.hubInfluenceRadiusBoost, 500);

		sys.buyUpgrade("tier1", "capacity");
		sys.buyUpgrade("tier1", "speed");

		sys.buyUpgrade("tier2", "influence");
		assert.equal(sys.perks.hubInfluenceRadiusBoost, 1500);
	});

	await t.test("Tier 1 and Tier 2 Amount correctly increases perk", () => {
		const sys = new UpgradeSystem();
		sys.addTotalData(1024 * 20);

		sys.buyUpgrade("tier1", "amount");
		assert.equal(sys.perks.nodletAmountBoost, 5);

		sys.buyUpgrade("tier1", "capacity");
		sys.buyUpgrade("tier1", "speed");

		sys.buyUpgrade("tier2", "amount");
		assert.equal(sys.perks.nodletAmountBoost, 15);
	});
});

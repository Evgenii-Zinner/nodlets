/**
 * UpgradeSystem - Manages the Radial Star Upgrade Tree
 */
export class UpgradeSystem {
    constructor() {
        this.totalDataEarned = 0;
        this.spentPoints = 0;
        this.bytesPerPoint = 1024;

        // Current actual perks applied to game logic
        this.perks = {
            nodletCapacityBoost: 0,   // Base is 8
            nodletSpeedMult: 1.0,     // Base is 1.0
            hubInfluenceRadiusBoost: 0, // Base is e.g. 500
            nodletAmountBoost: 0      // Base is 10
        };

        // Radial Star Tree Definition
        // true = unlocked, false = locked
        this.tree = {
            tier1: {
                unlocked: true, // Tier 1 is always available to buy
                nodes: {
                    capacity: { id: 't1_cap', icon: 'C', name: 'Expanded Cache I', cost: 1, unlocked: false, apply: (p) => p.nodletCapacityBoost += 8, desc: "+8 Nodlet Capacity" },
                    speed: { id: 't1_spd', icon: 'S', name: 'Overclock I', cost: 1, unlocked: false, apply: (p) => p.nodletSpeedMult += 0.2, desc: "+20% Nodlet Speed" },
                    influence: { id: 't1_inf', icon: 'I', name: 'Signal Boost I', cost: 1, unlocked: false, apply: (p) => p.hubInfluenceRadiusBoost += 500, desc: "+500 Hub Range" },
                    amount: { id: 't1_amt', icon: 'A', name: 'Swarm Logic I', cost: 1, unlocked: false, apply: (p) => p.nodletAmountBoost += 5, desc: "+5 Max Nodlets" }
                }
            },
            tier2: {
                unlocked: false, // Unlocks when 3/4 Tier 1 nodes are bought
                nodes: {
                    capacity: { id: 't2_cap', icon: 'C', name: 'Expanded Cache II', cost: 2, unlocked: false, apply: (p) => p.nodletCapacityBoost += 16, desc: "+16 Nodlet Capacity" },
                    speed: { id: 't2_spd', icon: 'S', name: 'Overclock II', cost: 2, unlocked: false, apply: (p) => p.nodletSpeedMult += 0.3, desc: "+30% Nodlet Speed" },
                    influence: { id: 't2_inf', icon: 'I', name: 'Signal Boost II', cost: 2, unlocked: false, apply: (p) => p.hubInfluenceRadiusBoost += 1000, desc: "+1000 Hub Range" },
                    amount: { id: 't2_amt', icon: 'A', name: 'Swarm Logic II', cost: 2, unlocked: false, apply: (p) => p.nodletAmountBoost += 10, desc: "+10 Max Nodlets" }
                }
            }
        };
    }

    get availablePoints() {
        return Math.floor(this.totalDataEarned / this.bytesPerPoint) - this.spentPoints;
    }

    addTotalData(amount) {
        this.totalDataEarned += amount;
    }

    checkUnlockConditions() {
        let t1Count = 0;
        for (const key in this.tree.tier1.nodes) {
            if (this.tree.tier1.nodes[key].unlocked) t1Count++;
        }

        if (t1Count >= 3) {
            this.tree.tier2.unlocked = true;
        }
    }

    buyUpgrade(tier, nodeKey) {
        const tierObj = this.tree[tier];
        if (!tierObj || !tierObj.unlocked) return false;

        const node = tierObj.nodes[nodeKey];
        if (!node || node.unlocked) return false;

        if (this.availablePoints >= node.cost) {
            this.spentPoints += node.cost;
            node.unlocked = true;
            node.apply(this.perks);
            this.checkUnlockConditions();
            return true;
        }

        return false;
    }
}

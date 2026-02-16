/**
 * UpgradeSystem - Manages milestones and global perks
 */
export class UpgradeSystem {
    constructor() {
        this.nextMilestone = 500; // Start lower for testing
        this.milestoneMultiplier = 2.0;

        this.perks = {
            energyResetRate: 10,        // Base replenishment rate
            maxEnergyBoost: 0,          // Added to base max energy
            dataDropChance: 0.00,       // Chance for random data drop
            positiveMutationChance: 0.05,
            negativeMutationChance: 0.05
        };

        this.availablePerks = [
            {
                id: 'energy_rate',
                name: 'Flux Capacitor',
                description: 'Energy regenerates +20% faster.',
                apply: (perks) => perks.energyResetRate *= 1.2
            },
            {
                id: 'max_battery',
                name: 'Expanded Batteries',
                description: 'New creatures have +20 Max Energy.',
                apply: (perks) => perks.maxEnergyBoost += 20
            },
            {
                id: 'data_leak',
                name: 'Data Leak',
                description: '0.1% chance for spontaneous Data generation per tick.',
                apply: (perks) => perks.dataDropChance += 0.001
            },
            {
                id: 'stable_genetics',
                name: 'Stable Genetics',
                description: 'Reduces negative mutation chance by 20%.',
                apply: (perks) => perks.negativeMutationChance *= 0.8
            },
            {
                id: 'rad_evolution',
                name: 'Radical Evolution',
                description: 'Increases positive mutation chance by 20%.',
                apply: (perks) => perks.positiveMutationChance *= 1.2
            }
        ];
    }

    checkMilestone(totalData) {
        return totalData >= this.nextMilestone;
    }

    advanceMilestone() {
        this.nextMilestone = Math.floor(this.nextMilestone * this.milestoneMultiplier);
    }

    getChoices() {
        // Shuffle and pick 3
        const shuffled = [...this.availablePerks].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    applyUpgrade(choice) {
        if (choice) {
            choice.apply(this.perks);
            this.advanceMilestone();
            return true;
        }
        return false;
    }
}

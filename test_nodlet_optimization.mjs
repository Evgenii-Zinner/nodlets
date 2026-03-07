import { HubSystem } from './public/HubSystem.js';
import { NodletSystem } from './public/NodletSystem.js';
import { ResourceSystem } from './public/ResourceSystem.js';
import { UpgradeSystem } from './public/UpgradeSystem.js';
import { Camera } from './public/Camera.js';

// Setup mock objects and classes
class MockInput {
    constructor() {}
}

class MockRenderer {
    constructor() {
        this.app = {
            canvas: {
                setAttribute: () => {},
                remove: () => {}
            },
            screen: { width: 800, height: 600 }
        };
    }
    async init() {}
    update() {}
}

const document = {
    querySelector: () => ({ appendChild: () => {} }),
    getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } }),
    addEventListener: () => {}
};
const window = {
    addEventListener: () => {},
    devicePixelRatio: 1
};
global.document = document;
global.window = window;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => {};

// Mock the imported class CanvasGame (or create a simplified test loop logic)
// Since we want to test the update logic we can just instanciate components and run their updates.
console.log("Mocking game components for smoke test...");

const world = { width: 5000, height: 5000 };
const hubs = new HubSystem(10);
const nodlets = new NodletSystem(100);
const resources = new ResourceSystem(10);
const upgrades = new UpgradeSystem();

hubs.spawn(2500, 2500);
resources.spawnServer(2600, 2600, 1000, 0);

// Just calling update on Nodlet System and Resource System
console.log("Running component updates...");
try {
    nodlets.update(0.016, world);
    resources.update(0.016, world);
    console.log("Component updates successful.");
} catch (e) {
    console.error("Component update failed:", e);
    process.exit(1);
}

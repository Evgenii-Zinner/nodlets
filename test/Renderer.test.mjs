import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

class MockContainer {
	constructor() {
		this.children = [];
		this.scale = { set: () => {} };
		this.position = {
			x: 0,
			y: 0,
			set: (x, y) => {
				this.position.x = x;
				this.position.y = y;
			},
		};
	}
	addChild(_child) {
		this.children.push(_child);
	}
	addChildAt(child, index) {
		this.children.splice(index, 0, child);
	}
}

class MockGraphics {
	constructor() {
		this.clearCalls = 0;
	}
	clear() {
		this.clearCalls++;
		return this;
	}
	circle() {
		return this;
	}
	fill() {
		return this;
	}
	rect() {
		return this;
	}
	stroke() {
		return this;
	}
	moveTo() {
		return this;
	}
	lineTo() {
		return this;
	}
	closePath() {
		return this;
	}
	poly() {
		return this;
	}
}

class MockSprite {
	constructor(texture) {
		this.texture = texture;
		this.anchor = { set: () => {} };
		this.position = {
			x: 0,
			y: 0,
			set: (x, y) => {
				this.position.x = x;
				this.position.y = y;
			},
		};
		this.scale = {
			x: 1,
			y: 1,
			set: (s) => {
				this.scale.x = s;
				this.scale.y = s;
			},
		};
		this.alpha = 1;
		this.visible = true;
		this.tint = 0xffffff;
		this.width = 0;
		this.height = 0;
		this.rotation = 0;
	}
}

class MockTilingSprite {
	constructor(options) {
		this.texture = options.texture;
		this.width = options.width;
		this.height = options.height;
	}
}

class MockText {
	constructor(opts) {
		this.text = opts.text;
		this.position = { set: () => {} };
	}
}

class MockApplication {
	constructor() {
		this.renderer = {
			generateTexture: () => "mock-texture",
		};
		this.canvas = "mock-canvas";
		this.stage = new MockContainer();
		this.screen = { width: 800, height: 600 };
	}
	async init() {}
}

const originalWindow = global.window;
const originalPIXI = global.PIXI;

describe("Renderer", async () => {
	let Renderer;

	beforeEach(async () => {
		global.window = { devicePixelRatio: 1, performance: { now: () => 1000 } };
		global.performance = { now: () => 1000 };
		global.PIXI = {
			Application: MockApplication,
			Container: MockContainer,
			Graphics: MockGraphics,
			Sprite: MockSprite,
			TilingSprite: MockTilingSprite,
			Rectangle: class {},
			Text: MockText,
		};
		const module = await import(`../public/Renderer.js?update=${Date.now()}`);
		Renderer = module.Renderer;
	});

	afterEach(() => {
		global.window = originalWindow;
		global.PIXI = originalPIXI;
	});

	it("initializes application, layers, and templates", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);

		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		assert.ok(renderer.worldContainer instanceof MockContainer);
		assert.ok(renderer.gridGraphics instanceof MockGraphics);
		assert.ok(renderer.hubTexture === "mock-texture");
	});

	it("updates resources with correct pooling and scaling", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const resources = {
			count: 2,
			posX: new Float32Array([100, 200]),
			posY: new Float32Array([100, 200]),
			type: new Uint8Array([0, 1]), // Generator, Relay
			amount: new Float32Array([50, 100]),
			maxAmount: new Float32Array([100, 100]),
		};

		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };
		renderer.updateResources(resources, bounds, -1, -1);

		assert.equal(renderer.resourceSprites.length, 2);
		assert.equal(renderer.resourceSprites[0].visible, true);
		assert.equal(renderer.resourceSprites[0].position.x, 100);
		// targetScale = 0.5 + (50/100) * 0.5 = 0.75
		assert.equal(renderer.resourceSprites[0].scale.x, 0.75);
		// targetScale = 0.5 + (100/100) * 0.5 = 1.0
		assert.equal(renderer.resourceSprites[1].scale.x, 1.0);
	});

	it("culls resources outside of bounds", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const resources = {
			count: 1,
			posX: new Float32Array([600]), // Outside bounds
			posY: new Float32Array([600]),
			type: new Uint8Array([0]),
			amount: new Float32Array([50]),
			maxAmount: new Float32Array([100]),
		};

		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };
		renderer.updateResources(resources, bounds, -1, -1);

		assert.equal(renderer.resourceSprites.length, 1);
		assert.equal(renderer.resourceSprites[0].visible, false);
	});

	it("updates hubs with correct scale and tint", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const hubs = {
			count: 1,
			posX: new Float32Array([250]),
			posY: new Float32Array([250]),
			size: new Float32Array([40]),
			color: new Uint32Array([(0xff0000 << 8) | 0xff]), // Color + alpha byte
		};
		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };

		renderer.updateHubs(hubs, bounds);

		assert.equal(renderer.hubSprites.length, 1);
		const root = renderer.hubSprites[0];
		assert.equal(root.visible, true);
		assert.equal(root.position.x, 250);

		const body = root._body;
		// scale = size / 20 = 40 / 20 = 2
		assert.equal(body.scale.x, 2);
		assert.equal(body.tint, 0xff0000);
	});

	it("updates nodlets with squash and stretch based on velocity", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const nodlets = {
			count: 1,
			posX: new Float32Array([100]),
			posY: new Float32Array([100]),
			velX: new Float32Array([10]), // velocity of 10
			velY: new Float32Array([0]),
			size: new Float32Array([10]),
			state: new Uint8Array([0]),
			color: new Uint32Array([(0x00ff00 << 8) | 0xff]),
			carriedData: new Float32Array([0]),
			maxDataCapacity: new Float32Array([100]),
		};
		const camera = { zoom: 1 };
		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };

		renderer.updateNodlets(nodlets, camera, bounds, -1);

		assert.equal(renderer.nodletSprites.length, 1);
		const root = renderer.nodletSprites[0];
		assert.equal(root.visible, true);

		const body = root._body;
		const speed = 10;
		const stretch = Math.min(1.6, 1.0 + speed * 0.005); // 1.0 + 0.05 = 1.05
		const squash = 1.0 / stretch;

		assert.equal(body.width, 10 * stretch);
		assert.equal(body.height, 10 * squash);
		assert.equal(body.tint, 0x00ff00);
	});

	it("displays data bars for nodlets when zoomed in", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const nodlets = {
			count: 1,
			posX: new Float32Array([100]),
			posY: new Float32Array([100]),
			velX: new Float32Array([0]),
			velY: new Float32Array([0]),
			size: new Float32Array([10]),
			state: new Uint8Array([0]),
			color: new Uint32Array([(0x00ff00 << 8) | 0xff]),
			carriedData: new Float32Array([50]),
			maxDataCapacity: new Float32Array([100]),
		};
		const camera = { zoom: 1 }; // zoom > 0.5
		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };

		renderer.updateNodlets(nodlets, camera, bounds, -1);

		const root = renderer.nodletSprites[0];
		const bars = root._bars;
		assert.equal(bars.visible, true);

		const bg = bars._bg;
		const fill = bars._fill;

		assert.equal(bg.width, 10);
		// fill target width = barWidth * dataPercent = 10 * (50/100) = 5
		assert.equal(fill.width, 5);
	});

	it("hides data bars for nodlets when zoomed out", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const nodlets = {
			count: 1,
			posX: new Float32Array([100]),
			posY: new Float32Array([100]),
			velX: new Float32Array([0]),
			velY: new Float32Array([0]),
			size: new Float32Array([10]),
			state: new Uint8Array([0]),
			color: new Uint32Array([(0x00ff00 << 8) | 0xff]),
			carriedData: new Float32Array([50]),
			maxDataCapacity: new Float32Array([100]),
		};
		const camera = { zoom: 0.4 }; // zoom <= 0.5
		const bounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };

		renderer.updateNodlets(nodlets, camera, bounds, -1);

		const root = renderer.nodletSprites[0];
		const bars = root._bars;
		assert.equal(bars.visible, false);
	});

	it("draws global debug information properly", async () => {
		const colors = { ground: 0x000000, grid: 0x222222 };
		const world = { width: 1000, height: 1000 };
		const renderer = new Renderer(colors, world);
		const mockContainerElement = { appendChild: (_child) => {} };
		await renderer.init(mockContainerElement);

		const camera = { x: 100.2, y: 200.8, zoom: 1.5 };
		renderer.drawDebug(camera, 5, 20);

		assert.equal(
			renderer.debugText.text,
			"Camera: (100, 201)\nZoom: 150%\nHubs: 5\nNodlets: 20",
		);
	});
});

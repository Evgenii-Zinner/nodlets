import { Renderer } from './public/Renderer.js';

// We can mock PIXI.js by just running a plain loop over objects with setters.
class MockSprite {
    constructor() {
        this._width = 0;
        this._height = 0;
        this._tint = 0xFFFFFF;
    }
    set width(v) { this._width = v; this.updateTransform(); }
    set height(v) { this._height = v; this.updateTransform(); }
    setSize(w, h) { this._width = w; this._height = h; this.updateTransform(); }
    set tint(v) { this._tint = v; }
    get tint() { return this._tint; }
    updateTransform() { /* dummy overhead */ let a = 1; for(let i=0;i<10;i++) a *= 1.1; }
}

function runBenchmark() {
    const sprites = Array.from({ length: 10000 }, () => new MockSprite());
    const iterations = 1000;

    const unoptimizedStart = performance.now();
    for(let i = 0; i < iterations; i++) {
        for(let j = 0; j < sprites.length; j++) {
            const body = sprites[j];
            body.width = 10;
            body.height = 10;
            body.tint = 0x00F3FF;
        }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    const optimizedStart = performance.now();
    for(let i = 0; i < iterations; i++) {
        for(let j = 0; j < sprites.length; j++) {
            const body = sprites[j];
            body.setSize(10, 10);
            if (body.tint !== 0x00F3FF) {
                body.tint = 0x00F3FF;
            }
        }
    }
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`Unoptimized Time: ${unoptimizedTime.toFixed(2)} ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}% faster`);
}

runBenchmark();

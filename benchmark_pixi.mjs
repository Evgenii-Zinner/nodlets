

async function runBenchmark() {
    // We don't have PIXI in node directly if it's not installed or uses DOM.
    // Let's just create a mock PIXI Sprite class that does some work on setter.
    class Sprite {
        constructor() {
            this._width = 0;
            this._height = 0;
            this._x = 0;
            this._y = 0;
            this._scale = 1;
            this._alpha = 1;
        }

        get width() { return this._width; }
        set width(v) {
            this._width = v;
            this.invalidateTransform();
        }

        get height() { return this._height; }
        set height(v) {
            this._height = v;
            this.invalidateTransform();
        }

        get alpha() { return this._alpha; }
        set alpha(v) { this._alpha = v; }

        get scale() { return { x: this._scale, y: this._scale, set: (v) => { this._scale = v; this.invalidateTransform(); } }; }

        position = {
            x: 0,
            y: 0,
            set: (x, y) => {
                this._x = x;
                this._y = y;
                this.invalidateTransform();
            }
        };

        invalidateTransform() {
            // simulate some overhead
            let a = 0;
            for(let i=0; i<50; i++) a += i;
        }
    }

    const sprites = Array.from({length: 10000}, () => new Sprite());

    // warm up
    for(let i=0; i<10000; i++) {
        sprites[i].width = 10;
        sprites[i].height = 10;
        sprites[i].position.set(5, 5);
        sprites[i].alpha = 1;
    }

    const iterations = 100;

    const unoptimizedStart = performance.now();
    for(let it=0; it<iterations; it++) {
        for(let i=0; i<10000; i++) {
            sprites[i].width = 10;
            sprites[i].height = 10;
            sprites[i].position.set(5, 5);
            sprites[i].alpha = 1;
        }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    const optimizedStart = performance.now();
    for(let it=0; it<iterations; it++) {
        for(let i=0; i<10000; i++) {
            if (sprites[i].width !== 10) sprites[i].width = 10;
            if (sprites[i].height !== 10) sprites[i].height = 10;
            if (sprites[i].position.x !== 5 || sprites[i].position.y !== 5) sprites[i].position.set(5, 5);
            if (sprites[i].alpha !== 1) sprites[i].alpha = 1;
        }
    }
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`Unoptimized Time: ${unoptimizedTime.toFixed(2)} ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
    console.log(`Performance Improvement: ${((unoptimizedTime - optimizedTime) / unoptimizedTime * 100).toFixed(2)}% faster`);
}

runBenchmark();

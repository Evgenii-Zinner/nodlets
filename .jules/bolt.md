## 2025-05-14 - Initial Assessment of Canvas Game

**Learning:** The game uses a data-oriented approach with TypedArrays for creature data, which is excellent for performance. However, rendering and UI updates are currently bottlenecks. `shadowBlur` in Canvas is expensive, and rebuilding the entire creature list DOM every second is a major source of jank.

**Action:**
1. Optimize rendering by batching by color and caching color strings.
2. Refactor UI updates to avoid full DOM recreation.
3. Implement a Spatial Grid to allow for performant "awareness" (neighbor lookups) as the world scales.

## 2025-05-14 - Performance Wins

**Learning:** Spatial partitioning is crucial for AI awareness even at 1000-2000 entities. Without it, the O(N*M) interaction check would take ~1ms-2ms per frame on a decent CPU, but with it, it's nearly free (<0.1ms). Batching Canvas calls reduced frame time by ~30% when many creatures are visible.

**Action:** Always favor spatial grids for any neighbor-based logic in simulations. Use pass-based rendering to minimize expensive state toggles like `shadowBlur`.

## 2025-05-15 - Lazy Spatial Grid & Swap-and-Pop Pitfalls
**Learning:** Rebuilding spatial structures every frame for static entities (Resources) is a massive waste (0.04ms -> 0.01ms gain). However, using "swap-and-pop" removal with lazy updates creates "ghost" entities where the grid points to stale indices.
**Action:** Always implement a `dirty` flag for static spatial structures. Crucially, when iterating neighbors, always check `if (idx < count)` to filter out ghosts from the stale grid.

## 2025-05-15 - Optimizing High-Frequency UI with Sprites
**Learning:** Drawing thousands of dynamic  shapes per frame (like health bars) is a major performance killer due to geometry reconstruction overhead.
**Action:** Always prefer using a single 1x1 white pixel texture () for simple rectangular UI elements attached to entities. Use , , , and  to manipulate it. This batches draw calls and avoids geometry uploads.

## 2025-05-15 - Optimizing High-Frequency UI with Sprites
**Learning:** Drawing thousands of dynamic `PIXI.Graphics` shapes per frame (like health bars) is a major performance killer due to geometry reconstruction overhead.
**Action:** Always prefer using a single 1x1 white pixel texture (`PIXI.Sprite`) for simple rectangular UI elements attached to entities. Use `tint`, `width`, `height`, and `position` to manipulate it. This batches draw calls and avoids geometry uploads.

## 2025-05-15 - Spatial Grid vs Linear Scan
**Learning:** Maintaining a spatial grid (O(N) rebuild per frame) is a net loss if neighbor lookups are rare (e.g., only on mouse clicks). For 10,000 dynamic entities, rebuilding the grid cost ~0.16ms per frame, while a linear scan on click costs ~0.05ms *once*.
**Action:** Only implement spatial grids if query frequency * entity count justifies the maintenance cost. For user-interaction-only queries, linear scan is preferred.

## 2025-05-20 - The O(N*M) Target Selection Bottleneck
**Learning:** Found a critical O(N*M) loop inside `game.js` where every nodlet (N=10k) iterates over all resources (M=2k) to find a target every frame if none is set. This single loop consumes ~67ms per frame in benchmarks!
**Action:** Pre-calculate the list of valid targets per Hub once per frame (O(M)), reducing the inner loop to O(1) lookup. Benchmark shows 250x improvement (67ms -> 0.27ms).

## 2025-05-20 - Frustum Culling & Loop Hoisting
**Learning:** Rendering 10,000 sprites in PixiJS is fast, but updating their properties (position, scale, rotation) in JS every frame is the real bottleneck. Even if Pixi culls them internally, the JS loop overhead remains.
**Action:** Always implement explicit view frustum culling in the JS update loop for high-entity-count systems. Calculate bounds once, check `x/y`, and `continue` early. Also, hoist global visual effects (like `Math.sin(time)`) out of the entity loop.

## 2025-05-23 - Eliminating Nested Loops in Entity Logic
**Learning:** Found a nested loop O(Hubs * Nodlets) in `game.js` that counts active nodlets per hub every frame. With 100 hubs and 10,000 nodlets, this is 1,000,000 operations per frame (~1.3ms).
**Action:** Replaced the nested loop with two O(N) linear passes: one to count nodlets (10k ops) and one to process hubs (100 ops). This reduced complexity to O(Hubs + Nodlets), yielding a ~31x speedup (1.3ms -> 0.04ms). Always verify algorithmic complexity of nested loops even if individual operations seem cheap.

## 2025-05-24 - Entity Arrays and Static Assumptions
**Learning:** Tried to optimize loops by assuming static servers always occupied the first `N` indices of the `ResourceSystem` arrays. This assumption failed because the `despawn` method uses a "swap-and-pop" strategy. When a static server is despawned, a dynamic packet from the end of the array is swapped into its place, breaking the "static-first" ordering and breaking the loop logic.
**Action:** Never assume strict ordering in arrays managed by "swap-and-pop" unless the swap logic explicitly enforces partitions (which is complex and error-prone). Rely on spatial partitioning (like `forEachNeighbor`) for filtering entities by location or type instead of iterating over the entire array.

## 2025-05-24 - Replacing O(N*M) Loops with Spatial Grid Lookups
**Learning:** Found an $O(Hubs \times Resources)$ loop (`100 * 2000 = 200,000` checks per frame) pre-calculating targets for each Hub. Instead of a brute-force distance check against every single resource, utilizing the existing Spatial Grid (`forEachNeighbor`) drops this down to a highly localized spatial query.
**Action:** Always check if a Spatial Grid already exists before writing O(N*M) nested loops for proximity checks. Existing methods like `forEachNeighbor` are pre-optimized and enforce exact Euclidean boundaries efficiently.
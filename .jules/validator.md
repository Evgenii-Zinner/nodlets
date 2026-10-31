## 2023-10-24 - UpgradeSystem
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/UpgradeSystem.test.mjs`
- **Learning / Discovery:** `UpgradeSystem` bounds handling: `availablePoints` relies purely on `Math.floor(totalDataEarned / bytesPerPoint) - spentPoints`. This naturally produces `Infinity` if `bytesPerPoint` is 0, and permits arbitrary debt if negative values bypass standard access points.

## 2023-10-25 - ResourceSystem
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/ResourceSystem.test.mjs`
- **Learning / Discovery:** `ResourceSystem` uses parallel typed arrays for optimized contiguous memory layout and early-exits using spatial grid bounding. Packets deliver data to generators within a hard-coded 50 radius upon arriving within a 100 squared distance tolerance.

## 2023-10-26 - NodletSystem
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/NodletSystem.test.mjs`
- **Learning / Discovery:** `NodletSystem` properly applies a "soft bounce" of `vel *= -0.6` at the boundaries to prevent nodlets from getting stuck off-screen, handled securely within bounds and radius. Flat typed arrays maintain deterministic O(1) performance using `Swap & Pop` via `count` decrementing.

## 2023-10-27 - public
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/HubSystem.test.mjs`
- **Learning / Discovery:** `HubSystem` utilizes "Swap and Pop" logic for efficient `despawn` operations, maintaining O(1) removals. Invalid boundary checks (e.g. data deposit to out-of-bound indices, negative counts, despawning max bounds) resolve gracefully without exceptions but silently fail, which is useful context for consumers of the system.
## 2023-10-27 - HubSystem
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/HubSystem.test.mjs`
- **Learning / Discovery:** `HubSystem` utilizes flat TypedArrays and implements entity despawning via an O(1) "Swap and Pop" mechanism. Out-of-bound attempts in operations like `despawn` and `depositData` fail gracefully and silently.

## 2023-10-28 - Camera and Input
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/Camera.test.mjs`, `test/Input.test.mjs`
- **Learning / Discovery:** `Input.js` attaches duplicate touchmove event handlers which doubles up processing logic for touch events like pinching and dragging. The `Camera` coordinates logic properly handles viewport translations. Added strict unit testing using test doubles mimicking Canvas and Window behaviour.

## 2023-10-29 - worker.js
- **Audited Path:** `/`
- **Tests Added / Hardened:** `test/worker.test.mjs`
- **Learning / Discovery:** Wrote a test suite for `worker.js`, testing the Cloudflare Worker fetch logic including root redirects to `/index.html`, passthrough for static assets, and the exception handling returning 404s. Checked that security headers are applied consistently in both success and error branches.
## 2023-10-30 - Renderer
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/Renderer.test.mjs`
- **Learning / Discovery:** Wrote a test suite for `Renderer.js` with comprehensive mock setups for `PIXI` components (Application, Container, Graphics, Sprite, TilingSprite). Asserts cover DOM interactions, sprite pooling based on camera visibility, bounding box calculations, hub and resource drawing, scaling factors and squash-and-stretch rendering formulas using the AAA pattern. Ensures tests are self-contained without mutating or mocking application variables.

## 2023-10-31 - CreatureSystem
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/CreatureSystem.test.mjs`
- **Learning / Discovery:** `CreatureSystem` uses parallel typed arrays and a grid system (`initGrid`, `updateGrid`, `forEachNeighbor`) similar to other entities. Movement and updates strictly enforce soft bounds (bouncing at bounds rather than leaving boundaries) and implements "Swap and pop" logic for efficient entity removal without fragmentation.
## 2026-10-21 - ResourceSystem
- **Audited Path:** `test/ResourceSystem.test.mjs`
- **Tests Added / Hardened:** `test/ResourceSystem.test.mjs`
- **Learning / Discovery:** `ResourceSystem` correctly drops packets when no generator is within the delivery radius. Upon delivery, the amount is appropriately clamped at `maxAmount` without failing or crashing. A flaky assertion `Math.random() * 100 + 250 >= 251` was fixed by lowering it to the actual inclusive bound of `250`.
## 2023-11-01 - NodletSystem
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/NodletSystem.test.mjs`
- **Learning / Discovery:** Hardened O(1) swap logic testing to assert all 15 TypedArrays correctly swap instead of just position bounds, and added edge-case testing validating exactly identical bounds matching during soft bounce boundary enforcement.
## 2023-11-02 - UpgradeSystem
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/UpgradeSystem.test.mjs`
- **Learning / Discovery:** Hardened `UpgradeSystem` by adding tests for exact purchase costs, asserting the preservation of Tier 2 unlocked state when exceeding Tier 1 unlock thresholds, and properly checking cascading `NaN` behaviour via `addTotalData`.
## 2023-11-03 - HubSystem
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/HubSystem.test.mjs`
- **Learning / Discovery:** Hardened O(1) swap and pop logic testing in `HubSystem` by explicitly asserting that all properties inside flat parallel arrays (`posX`, `posY`, `data`, `baseNodletCapacity`, `activeNodlets`, `color`, `size`) are cleanly swapped, removing redundant duplicate test suites.
## 2023-11-04 - Input
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/Input.test.mjs`
- **Learning / Discovery:** Hardened `Input` testing by adding strict boundary assertions for `moveDist` during mouse clicks and touch taps (detecting under thresholds like 5 or 10 respectively, and ignoring at exactly the threshold), while also resolving missing validations for omitted `onClick` callbacks to prevent runtime exceptions on conditional checks.
## 2023-11-05 - public
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/Renderer.test.mjs`
- **Learning / Discovery:** Hardened `Renderer` UI rendering tests by replacing shallow mock tests with boundary interaction assertions verifying the correct visual representation of `activeTargetServer`, `selectedServerIndex`, and `selectedNodletIndex`. Added explicit checks for bounding box logic inside `drawGrid` and `drawInfluenceZones` using PIXI mock injections.
## 2023-11-06 - Camera
- **Audited Path:** `public/`
- **Tests Added / Hardened:** `test/Camera.test.mjs`
- **Learning / Discovery:** Hardened `Camera` tests by asserting non-default zoom factors during centering and focus translations. Added edge case validation where a falsy `0` pivot was potentially bypassing zoom offsets, and strictly verified negative fractional math correctly mirroring between screen and world projections.
## 2023-11-07 - root
- **Audited Path:** `/`
- **Tests Added / Hardened:** `test/worker.test.mjs`
- **Learning / Discovery:** Hardened `worker.js` by asserting boundaries, ensuring original request properties (method, headers) are cleanly passed to `ASSETS.fetch` when rewriting paths, passing through natural non-200 responses, and gracefully catching `new URL()` TypeErrors on invalid requests with valid 404 security headers responses.
## 2023-11-08 - CreatureSystem
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/CreatureSystem.test.mjs`
- **Learning / Discovery:** Hardened `CreatureSystem` testing by explicitly asserting branching logic for neutral and negative mutation boundaries, verifying safe early returns when operations are performed on an uninitialized spatial grid (`!this.grid`), and asserting that the "Swap and Pop" logic safely skips swap assignment when despawning the very last element in the TypedArray.

## 2026-10-30 - ResourceSystem
- **Audited Path:** `test/ResourceSystem.test.mjs`
- **Tests Added / Hardened:** `test/ResourceSystem.test.mjs`
- **Learning / Discovery:** Hardened ResourceSystem testing by adding checks for O(1) swap early exits, spatial grid uninitialized safe returns, out-of-bounds nextInCell handling, and ensuring Relay servers do not implicitly regenerate.
## 2023-11-09 - CreatureSystem
- **Audited Path:** `test/`
- **Tests Added / Hardened:** `test/CreatureSystem.test.mjs`
- **Learning / Discovery:** Hardened `CreatureSystem` testing by explicitly asserting the early exits in `updateGrid` for spatial grid boundaries. When a resource is spawned at out-of-bounds negative or positive coordinates, the system successfully defaults to `-1` for `nextInCell` instead of storing an out-of-bounds index or throwing.

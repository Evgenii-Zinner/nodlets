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

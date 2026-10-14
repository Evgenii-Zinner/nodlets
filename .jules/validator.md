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

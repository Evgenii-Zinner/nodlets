# AGENTS.md — Operational Context for Autonomous Coding Agents 🤖

> High-density, token-efficient system briefing for AI coding agents (Jules, Claude Code, Gemini CLI, Cursor, Antigravity, Copilot). Keep this file under 200 lines.

---

## 🚨 Critical Invariants (Never Violate)

1. **Agent Sandbox Mandate:** Nodlets is an experimental proving ground for autonomous coding agents. Code should be authored and refactored by agents with minimal to zero human typing.
2. **Atomic PR Limits:** PRs must be small, cohesive, and easily reviewable (< 200–300 lines diff). Never submit 1,000+ line mega-diffs or total rewrites.
3. **No Identifier Collisions:** When optimizing loops or hoisting variables in `game.js` or `Renderer.js`, verify block scopes to prevent duplicate `const`/`let` declarations.
4. **Toolchain Compliance:** Every contribution must pass:
   - `pnpm run lint` (Biome check)
   - `pnpm run format` (Biome format)
   - `for f in public/*.js worker.js; do node --input-type=module --check < "$f"; done`
5. **No Deployment Commands:** Do not run deployment scripts (`wrangler deploy`) without explicit human instruction; CI/CD auto-deploys from `main`.

---

## 🗺️ System Topology & Architecture

Nodlets is a high-performance 2D digital terrarium simulation built on **PixiJS v8** and Data-Oriented Design (DOD).

```
public/
├── index.html          # HTML shell, PIXI CDN link, UI overlay & Radial Modal
├── style.css           # Retro-futuristic cyberpunk UI styling
├── game.js             # CanvasGame orchestrator: main loop (RAF), AI state machine, spatial queries
├── NodletSystem.js     # ECS Entity pool: Flat TypedArrays (posX, posY, velX, velY, state, carriedData)
├── HubSystem.js        # Home Hub management: capacity, active count, data deposits
├── ResourceSystem.js   # Server nodes (Generators, Relays), packet emissions, spatial hash grid
├── UpgradeSystem.js    # Radial System Matrix: perk boosts (speed, capacity, influence, count)
├── Renderer.js         # PixiJS v8 rendering: sprite pools, frustum culling, transform cache guards
├── Camera.js           # World-to-screen coordinate math, zoom & pan bounds
└── Input.js            # Pan/drag, mouse selection, and multi-touch pinch-to-zoom
worker.js               # Cloudflare Workers static asset router with CSP security headers
biome.json              # Fast formatting and linting configuration
.jules/                 # Persistent agent memory journals
```

---

## 🧠 Memory System (`.jules/`)

Autonomous agents maintain persistent context and architectural learnings across sessions using journal files stored in `.jules/`.

### 1. Journal Mapping
- Match your active role/persona to a file in `.jules/` (e.g. `.jules/bolt.md`, `.jules/forge.md`, `.jules/craftsman.md`).
- If your role file does not exist, create `.jules/<role>.md`.

### 2. Startup Protocol
On session start, read your journal in `.jules/<role>.md` to load past discoveries, performance gotchas, and pitfalls discovered by previous runs.

### 3. Completion Logging
Before completing a task, append your new learning to the bottom of your journal in this exact format:

```markdown
## YYYY-MM-DD - <Concise Title>
**Learning:** <What was discovered about the codebase, performance bottleneck, or gotcha>
**Action:** <What concrete change was implemented>
```

### 4. Memory Compaction
- Keep each journal focused (maintain the **last 10–15 entries**).
- If a critical repository invariant is discovered, promote it directly into `AGENTS.md` and prune older redundant entries from the journal.

---

## ⚡ Performance Patterns (Hot Paths)

- **TypedArray Hoisting:** In 60 FPS entity loops (10,000 Nodlets), cache TypedArray references (`const n_posX = nodlets.posX;`) to local variables outside the loop to eliminate V8 property-lookup overhead.
- **Transform Invalidation Guards:** Guard PIXI property assignments (`if (sprite.position.x !== rx) sprite.position.set(rx, ry);`) to prevent triggering redundant internal matrix recalculations.
- **Zero-Allocation Spatial Queries:** Reuse pre-allocated `Int32Array` buffers for spatial neighbor queries (`resources.getNeighbors`) instead of instantiating new JS arrays or closures per frame.

# Seed Issues for Agent Sandbox 🤖👾

These issues are designed to turn Nodlets into a sandbox for **opinionated autonomous coding agents** (Google Jules, Claude Code, Cursor/Windsurf agents, Antigravity, etc.).

**Universal Agent Ground Rules for All Issues:**
1. **Agent-Only:** The implementation should be produced by an AI coding agent with minimal to zero manual human code editing.
2. **Strict Diff Limits:** Small, atomic PRs only (< 200–300 lines changed). Absolutely no 1,000+ line mega-diffs or total rewrites.
3. **Toolchain Compliant:** Must run and pass `pnpm run lint`, `pnpm run format` (Biome), and `node --input-type=module --check < [file]`.

---

## Issue 1: [Gameplay] Ambient Event: Implement "Corrupted Packet Surge" or Mini-Loop Objective
- **Labels:** `help wanted`, `vibecode`
- **Scope:** ~150–250 lines diff

### Problem Description
Right now, Nodlets has zero gameplay, no objective, and no win/loss tension—it's purely an idle simulation. While that makes for a great screensaver, having occasional high-stakes network events would make watching it much more compelling.

### Desired Agent Task
Use your coding agent to implement a recurring ambient network event:
1. **The Event:** Every few minutes, a random server node becomes "Corrupted" (e.g. flashes red, emits red corrupted packets).
2. **The Mechanic:** Corrupted packets degrade hub efficiency or siphon stored data if they reach the home Hub.
3. **Player / Swarm Action:** The player can target the corrupted node (or nearby relay) so Nodlets intercept the glitch packets before they reach home, or spend data to deploy a quick "Purge" action.
4. **Visual Indicator:** Display an unobtrusive warning in the HUD banner (e.g., `ALERT: PACKET SURGE DETECTED AT NODE #3`).

### Constraints
- Do not rewrite the game loop. Hook into `game.js` and `ResourceSystem.js`.
- Keep state lightweight and integrate with existing TypedArrays if possible.
- Run `pnpm run lint` and `pnpm run format` before opening your PR.

---

## Issue 2: [Audio/VFX] Zero-Dependency Web Audio Synthesizer for Packet Interceptions & Ambience
- **Labels:** `help wanted`, `good first issue`, `vibecode`
- **Scope:** ~100–180 lines diff

### Problem Description
The digital ether is completely silent. When thousands of Nodlets dart around and snatch packets from the void, there is zero audio feedback.

### Desired Agent Task
Use your coding agent to implement a lightweight, zero-dependency audio engine using the browser's native `AudioContext` (no external MP3/WAV files):
1. **Packet Capture Chime:** A short, gentle high-pitch FM or sine blip when a Nodlet intercepts a packet.
2. **Data Deposit Hum:** A resonant chord or bass swell when Nodlets dock at the Hub and deliver data.
3. **Volume / Mute Toggle:** Add a neat little cyberpunk audio toggle button (🔊 / 🔇) in the top HUD corner.
4. **Voice Throttling:** Throttle overlapping sound instances so 1,000 simultaneous packet drops don't deafen the user (e.g. simple audio pooling or max 4–6 polyphonic voices).

### Constraints
- Must use browser native Web Audio API (zero npm audio dependencies, zero external media files).
- Keep file self-contained (e.g. `public/SoundSystem.js`).
- Pass Biome checks (`pnpm run lint`).

---

## Issue 3: [Graphics] Pulsing Cyber-Circuit Connections & Packet Particle Trails
- **Labels:** `help wanted`, `vibecode`
- **Scope:** ~120–200 lines diff

### Problem Description
Servers are currently static colored diamond sprites, and data packets are simple small square dots. The game lacks the feeling of a living, high-speed fiber network grid.

### Desired Agent Task
Have your agent upgrade the visual presentation in `Renderer.js`:
1. **Dynamic Network Links:** Render subtle animated circuit/wire lines between linked Generators and Relays showing data transfer flow.
2. **Packet Particle Trails:** Give traveling packets a faint fading trail or velocity streak so players can see data streaming across network corridors at high speed.
3. **Hub Idle Pulse:** Give the home Hub a rhythmic breathing / reactor glow effect.

### Constraints
- Keep it 60 FPS friendly on mobile/laptops—use PixiJS batching/containers rather than re-creating canvas graphics every frame.
- Do not introduce massive asset textures; generate procedural textures via PixiJS or shader filters.
- Keep diff under 250 lines.

---

## Issue 4: [Entities] Introduce Specialized Nodlet Castes (Scouts & Heavy Haulers)
- **Labels:** `help wanted`, `good first issue`, `vibecode`
- **Scope:** ~150–220 lines diff

### Problem Description
Every Nodlet is an identical white dot with identical speed, size, and carry capacity. Adding specialization introduces natural emergent behavior in the swarm.

### Desired Agent Task
Have your agent expand `NodletSystem.js` and `Renderer.js` with 2 distinct Nodlet castes:
1. **Scouts (30% spawn rate):** Smaller size, 2x faster wander and return speed, but can only carry 1–2 data packets.
2. **Heavy Haulers (20% spawn rate):** Larger size, 0.6x speed, but carries 4x more data packets before needing to return to base.
3. **Standard Nodlets (50% spawn rate):** Default balanced stats.
4. **Visual Differentiation:** Distinct tints or sizes in `Renderer.js` so they are immediately recognizable in the swarm.

### Constraints
- Maintain the Data-Oriented TypedArray architecture in `NodletSystem.js` (add a `caste` or `type` TypedArray).
- No performance regressions in the 10,000 entity hot loop.
- Format with Biome (`pnpm run format`).

---

## Issue 5: [Telemetry] Real-time Throughput (Packets/Sec) Sparkline & Network Health HUD
- **Labels:** `help wanted`, `good first issue`, `vibecode`
- **Scope:** ~90–160 lines diff

### Problem Description
The stats bar only displays static counters ("Nodlets: X", "Data Harvested: Y"). Players have no insight into current network throughput, packet delivery velocity, or hub harvest efficiency over time.

### Desired Agent Task
Have your coding agent implement an elegant, retro-futuristic telemetry widget:
1. **Throughput Meter:** Calculate and display rolling **Packets / Second (PPS)** harvested over the last 3–5 seconds.
2. **Mini Sparkline:** Render a small 60-second historical canvas/SVG sparkline graph in the bottom HUD showing throughput spikes.
3. **Efficiency Rating:** Display a simple rating (e.g., `NET EFFICIENCY: 94.2%`) based on how many emitted packets are successfully salvaged vs lost.

### Constraints
- Minimal DOM and memory overhead; update sparkline once every 250–500ms rather than every 60fps frame.
- Clean CSS styling matching the existing neon cyberpunk palette (`style.css`).
- Pass `pnpm run lint`.

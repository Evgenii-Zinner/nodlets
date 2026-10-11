# Nodlets 👾

[Play live on nodlets.ezinner.com](https://nodlets.ezinner.com/)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](public/game.js)
[![PixiJS](https://img.shields.io/badge/PixiJS-v8-E72264?logo=pixijs&logoColor=white)](https://pixijs.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare-workers&logoColor=white)](https://workers.cloudflare.com/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Ever wondered what happens to lost packets?**
>
> You know the ones. The ones that disappear into the void when your ping spikes to 999ms, or when that risky text message mysteriously fails to send.
>
> They aren't lost. They are snatched up by **Nodlets**.
>
> Nodlets are tiny digital creatures that live in the liminal spaces spanning across the digital ether. They zip around the network, intercepting dropped data packets and hoarding them at their home servers.
>
> I made this visualization tool so that we can finally observe these elusive creatures in their natural habitat. And the best part? We've managed to wrest control over one of their homes!

---

## Background & Purpose

This repository was created to evaluate how **Google Jules** and its performance optimization persona (**Bolt**) perform in real-world scenarios.

At the time, I didn't have a disposable project with enough mathematical throughput or render-loop bottlenecks to test automated optimization safely. So I built this entity simulation specifically as an optimizer target: a dense loop with thousands of active entities, vector math, distance checks, and canvas drawing.

There is **no gameplay loop and no winning condition**. The simulation runs indefinitely as an autonomous canvas benchmark and digital terrarium.

---

## Features

- **Entity Simulation:** Thousands of Nodlets swarm and intercept data packets traveling between Generators (infrequent, high capacity) and Relays (frequent, low capacity).
- **Target Assignment:** Select any server node within your Hub's blue influence radius and click **TARGET ACQUIRED** to redirect the swarm into orbit around it.
- **Hub Upgrades:** Harvested data can be spent in the radial Matrix to adjust swarm parameters:
  - Carrying capacity per Nodlet
  - Velocity and orbital speed
  - Hub influence radius
  - Nodlet population cap

---

## Controls

- **Pan:** Click & drag or Arrow keys
- **Zoom:** Mouse wheel / trackpad pinch
- **Select Server:** Left-click on any server diamond
- **Assign Swarm Target:** Click **TARGET ACQUIRED** in the selection panel
- **Upgrade Matrix:** Click **★ UPGRADES ★** (top-right)

---

## Architecture

- **Engine:** Pixi.js v8 (WebGL/WebGPU batch rendering with sprite pooling)
- **Data Layout:** Data-Oriented Design (TypedArrays for positions, velocities, state, and capacity)
- **Spatial Partitioning:** Flat spatial grid for neighbor queries and collision detection without runtime heap allocations
- **Edge Runtime:** Cloudflare Workers static asset serving with security headers

---

## Development

```bash
# Install dependencies
pnpm install

# Start local server via Wrangler
pnpm run dev

# Deploy to Cloudflare Workers
pnpm run deploy
```

---

## License

[MIT](LICENSE)

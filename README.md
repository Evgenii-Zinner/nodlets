# Nodlets 👾

[![Play Live](https://img.shields.io/badge/play%20live-nodlets.ezinner.com-blueviolet?style=for-the-badge)](https://nodlets.ezinner.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-♥-ff69b4?style=for-the-badge)](https://github.com/sponsors/Evgenii-Zinner)

> **Ever wondered what happens to lost packets?**
>
> You know the ones. The packets that vanish into the abyss when your ping spikes to 999ms, or when that risky text message mysteriously fails to send.
>
> They aren't lost. They are hoarded by **Nodlets**.

---

## 🔬 The Origin Story (Or: How Jules Got a Guinea Pig)

Here’s the honest truth: I really wanted to experiment with **Google Jules**, the autonomous coding agent, and specifically test out its performance optimizer persona, **Bolt**.

The problem? I didn't have a suitable disposable repository on hand with hot enough loops, math-heavy calculations, or render bottlenecks to let Bolt loose on without risking critical infrastructure.

So, naturally, I did what any reasonable developer would do: **I wrote a chaotic HTML5 Canvas simulation filled with thousands of tiny digital creatures buzzing around like caffeinated bees**, just to see how Jules and Bolt would tackle optimizing hot loops, TypedArray access, and PIXI transform invalidations.

As a result, you get **Nodlets**:
- **No real gameplay.**
- **No winning condition.**
- **Zero chance of "beating" the game.**
- Just an endless, soothing, high-performance digital terrarium where little critters scavenge dropped data packets across the ether at a silky 60 FPS.

---

## 🌟 What You Can Actually Do

Even with no win condition, being a digital landlord is weirdly satisfying:

- **Observe Digital Nature:** Watch swarms of Nodlets pour out of your central Hub and intercept packets traveling between Generators and Relays.
- **Direct the Swarm:** Click on any Server (the glowing diamonds) within your Hub's blue influence radius and hit **"TARGET ACQUIRED"** to order your swarm into orbital interception mode.
- **Endless Matrix Upgrades:** Open the radial **SYSTEM MATRIX** using the upgrade star in the corner. Spend harvested data points on:
  - 📦 *Data Capacity:* Let each Nodlet carry more packets before returning home.
  - ⚡ *Swarm Speed:* Turn gentle fliers into hyper-velocity data missiles.
  - 📡 *Hub Influence:* Expand your territorial control radius across the canvas.
  - 🐣 *Nodlet Count:* Print even more creatures into existence until your GPU starts sweating.

---

## 🕹️ Controls

| Action | Control |
|---|---|
| **Pan Camera** | Click & drag canvas / Arrow keys |
| **Zoom** | Mouse scroll wheel / Pinch |
| **Select Server** | Click any server node |
| **Target Server** | Click **TARGET ACQUIRED** in the entity panel |
| **System Matrix** | Click the **★ UPGRADES ★** button |

---

## 🛠️ Tech Stack & Under the Hood

- **Rendering:** [Pixi.js v8](https://pixijs.com/) (WebGPU/WebGL accelerated)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) (Zero-latency global edge delivery)
- **Architecture:** Data-Oriented Design (TypedArrays, Flat ECS-like arrays, spatial hash grids)
- **Co-author:** Extensively profiled and hoisted by **Google Jules (Bolt)** ⚡

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/Evgenii-Zinner/nodlets.git
cd nodlets

# Install dependencies
pnpm install

# Start local dev server via Wrangler
pnpm run dev
```

---

## 🤝 Community & Support

- **Found a bug or optimization opportunity?** Feel free to open an issue or PR! Check out our [Contributing Guide](.github/CONTRIBUTING.md).
- **Security:** Read our [Security Policy](.github/SECURITY.md).
- **Code of Conduct:** We adhere to the [Contributor Covenant](.github/CODE_OF_CONDUCT.md).
- **Support the Project:** If you enjoy watching digital critters hoard lost bytes, consider [sponsoring](https://github.com/sponsors/Evgenii-Zinner) or buying a coffee!

---

## 📄 License

Licensed under the [MIT License](LICENSE).

*No actual network traffic was harmed in the making of this visualization... I think.*

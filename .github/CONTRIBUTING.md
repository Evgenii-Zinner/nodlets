# Contributing to Nodlets 👾

First off, thank you for considering contributing to Nodlets! Whether you're here to fix a bug, speed up mathematical loops, or teach Nodlets new tricks, all contributions are welcome.

---

## 💡 What is this project?

Nodlets was born as an experimental playground to see how autonomous AI code optimizers (specifically **Google Jules** and its performance-focused **Bolt** persona) handle hot loops, WebGL transforms, and spatial queries in real-world JavaScript.

There is no formal winning condition and no traditional gameplay—just a digital terrarium running at 60 FPS.

---

## 🛠️ Development Setup

Nodlets runs on **Cloudflare Workers** with static assets in `public/`.

### Prerequisites
- Node.js (v18+)
- `pnpm` (or `npm`)

### Local Development
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the local development server:
   ```bash
   pnpm run dev
   ```
   This launches Wrangler to serve static assets locally.

---

## 📜 Pull Request Guidelines

1. **Keep it working:** Test your changes locally before submitting. Run `node --input-type=module --check < public/game.js` to avoid SyntaxErrors or duplicate declarations.
2. **Conventional Commits:** Prefer commit messages following conventional standards (e.g. `fix: ...`, `perf: ...`, `chore: ...`).
3. **No Placebo Variables:** If optimizing loops, ensure hoisted variables or calculations actually provide measurable speedups without shadowing existing declarations.

---

## 💬 Community

Please note that this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold these standards.

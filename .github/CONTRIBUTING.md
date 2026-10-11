# Contributing to Nodlets 👾

First off, thank you for considering contributing to Nodlets! Whether you're here to fix a bug, speed up mathematical loops, enhance graphics, or teach Nodlets new tricks, all contributions are welcome.

---

## 🤖 The Agent-Driven Sandbox Philosophy

Nodlets was born as an experimental testing ground for autonomous coding agents (specifically **Google Jules** and its **Bolt** persona). We want to keep it that way:

- **Agent-First Workflow:** We strongly encourage you to fork this repo and **let coding agents do the work** (Google Jules, Claude Code, Cursor/Windsurf agents, Antigravity, etc.) with **minimal to no human typing**. Treat Nodlets as a sandbox for opinionated coding agents.
- **Strict Atomic PR Limit:** No 1,000+ line kitchen-sink diffs. All PRs must be small, cohesive, and easy to review (ideally < 200–300 lines diff). One feature, refactor, or optimization at a time.
- **No Regression Rule:** Check that ES modules parse without duplicate identifier errors or syntax failures.

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

## 🧹 Code Quality with Biome

We use **Biome** for fast formatting and linting. Before opening a PR, ensure your agent runs:

```bash
# Check linting and formatting
pnpm run lint

# Auto-format files
pnpm run format
```

Additionally, verify JavaScript syntax across ES modules:

```bash
for f in public/*.js worker.js; do node --input-type=module --check < "$f"; done
```

---

## 📜 Pull Request Guidelines

1. **Atomic & Focused:** Address one issue or feature per PR. If an agent wants to overhaul three systems, have it split the work into three sequential PRs.
2. **Conventional Commits:** Use standard commit messages (`feat: ...`, `fix: ...`, `perf: ...`, `refactor: ...`).
3. **No Redundant Hoisting / Placebo Vars:** When optimizing hot loops, verify variable scope to prevent identifier shadowing or duplicate declarations.

---

## 💬 Community

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold these standards.

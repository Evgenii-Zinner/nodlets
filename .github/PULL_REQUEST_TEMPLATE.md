### 💡 What
[Clear summary of the bug fix, feature, optimization, or context added]

### 🎯 Why & Value
[How this improves the project (performance gain, bug resolved, human onboarding, repository professionalism, or AI token efficiency)]

### 📜 Standard Applied
[Mention any specific standards, such as GitHub Community Standard, Contributor Covenant, Shields.io, AGENTS.md Specification, etc.]

### ✅ Verification
- [ ] Verified that changes are atomic and focused
- [ ] PR title strictly follows Conventional Commits format (`feat:`, `fix:`, `perf:`, `docs:`, etc.)
- [ ] Checked for variable scope correctness (no identifier shadowing or duplicate declarations)
- [ ] Ran project formatters (`pnpm run format`) and markdown linters (`pnpm run lint`)
- [ ] Confirmed zero ES module syntax failures (`for f in public/*.js worker.js; do node --input-type=module --check < "$f"; done`)

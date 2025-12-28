# Frontend Refactor Execution Plan — Zero Behavior Change

## 🎯 Objective

Refactor the entire `frontend/` codebase to align strictly with the standards defined in `docs/frontendImproved.md`, starting with the pilot decomposition of `GameDetailsPage` (~2,400 lines → ≤250 lines).

**Core Policy:** This is a **ZERO BEHAVIOR CHANGE** refactor. All existing functionality must work exactly as before.

---

## 📋 Scope

### Phase 0 — Safety Net (Current)
- Establish regression protection (E2E smoke + integration tests)
- Define behavior parity gates that must pass for every PR

### Phase 1 — Pilot Decomposition
- Decompose `GameDetailsPage/index.jsx` into modules + hooks
- Normalize API usage (remove hardcoded URLs)
- Target: ≤250 lines for route component

### Phase 2 — Restructure
- Introduce `src/pages/` layer
- Split `game-management` into domain-aligned features

### Phase 3 — Shared Abstractions + Enforcement
- Shared dialog base + form patterns
- ESLint enforcement (`max-lines`, import boundaries)

---

## 🛡️ Non-Negotiables (Constitution)

From `docs/frontendImproved.md`:

- **No cross-feature imports**: `features/*` must not import from other `features/*`
- **Server data via React Query**: No `fetch` in `useEffect`
- **File size limits**: Soft 200, hard 300 lines per file
- **Tailwind-first styling**: No new per-component CSS files
- **Handler naming**: Event handlers are `handleX` (e.g., `handleSubmit`)
- **Accessibility**: Semantic HTML, labels, aria attributes

---

## 🚦 PR Gates (Must Pass)

Every PR in this refactor stream must pass:

1. ✅ **E2E smoke tests** (game flow: schedule → details → actions)
2. ✅ **Integration tests** (GameDetailsPage behaviors per status)
3. ✅ **No cross-feature imports** introduced
4. ✅ **Behavior parity checklist** (manual smoke) has no regressions
5. ✅ **All existing tests** remain green

---

## 📊 Success Metrics

- **Pilot parity**: 0 known regressions after cutover
- **Maintainability**: `GameDetailsPage` reduced from ~2,400 → ≤250 lines
- **Architecture**: `max-lines` warning enabled, import boundaries enforced
- **Developer experience**: Smaller PRs, faster reviews

---

## 📚 Reference Documents

- **PRD**: `tasks/prd-frontend-refactor-execution-plan.md`
- **Task Breakdown**: `tasks/tasks-frontend-refactor-execution-plan.md`
- **Constitution**: `docs/frontendImproved.md`
- **Diagnosis**: `docs/refactorUi.txt`
- **Backend Context**: `docs/official/backendSummary.md`

---

## 🔄 Strategy

- **Small PRs**: Each sub-task is a shippable PR
- **Incremental**: No "big bang" cutovers
- **Test-driven**: Add tests before refactoring
- **Behavior-preserving**: Any UI/logic change is a regression

---

## 👥 Reviewers

Please review for:
- Behavior parity (no UI/logic changes)
- Test coverage (gates pass)
- Architecture alignment (standards adherence)
- Import boundaries (no cross-feature)

---

## ⚠️ Important Notes

1. **This is a draft PR** — will be updated incrementally as phases progress
2. **No merge until Phase 3 complete** — all PRs will be merged to this branch first
3. **Preserve all behavior** — any difference is a bug unless explicitly approved
4. **Backend unchanged** — this is frontend-only refactor

---

## 📝 Progress Tracking

See `tasks/tasks-frontend-refactor-execution-plan.md` for detailed checkbox progress.

Current Status: **Phase 0 — Safety Net**


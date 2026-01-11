# PRD — Frontend Refactor Execution Plan (Align to `docs/frontendImproved.md`)

## 1) Introduction / Overview

We need a **comprehensive, safe, step-by-step refactor execution plan** to bring the entire `frontend/` codebase into strict alignment with the standards defined in `docs/frontendImproved.md`.

The plan must:

- Prioritize the highest-risk “God Components” (starting with `frontend/src/features/game-management/components/GameDetailsPage/index.jsx` ~2,400+ lines).
- Address broader structural issues (inconsistent feature layouts, missing abstraction layers).
- **Guarantee no behavior regression** (logic works exactly like before) by using an incremental rollout strategy with strong automated testing gates.

### Constitution source

The requested constitution file `@.cursor/rules/frontend.md` is **not present** in the repo. For this PRD, the constitution is:

- `docs/frontendImproved.md` (official standards)

Additional diagnosis input:

- `docs/refactorUi.txt` (code smells and target direction)

Pilot focus:

- `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

---

## 2) Goals

1. **Stabilize and refactor** the frontend so that new work can be done without creating more monoliths.
2. Reduce the biggest “God Components” into **small, testable, composable modules** without behavior changes.
3. Enforce architecture boundaries (no cross-feature imports) and file-size limits **gradually** without breaking CI.
4. Improve team velocity: PRs become reviewable, smaller, and safer.
5. Establish a repeatable refactor playbook that can be applied to the next big offenders (e.g., `TacticBoardPage`, `FormationEditor`, etc.).

---

## 3) User Stories

1. **As a developer**, I want clear refactor steps and PR-sized tasks so I can contribute safely without breaking the product.
2. **As a reviewer**, I want changes broken into small modules with tests so I can validate correctness quickly.
3. **As a product owner**, I want the UI/logic to behave exactly as before after refactors so users are not impacted.
4. **As a maintainer**, I want enforceable boundaries (imports, file size) so the codebase doesn’t regress into monoliths again.

---

## 4) Functional Requirements

### 4.1 Refactor execution plan must be deliverable-ready

1. The plan must include a **phase-based roadmap** (milestones with outcomes).
2. The plan must include a **ticket/PR-sized breakdown** (small tasks, ordered).
3. The plan must include a **mapping** describing the intended directory structure and where extracted code moves.
4. The plan must define **acceptance criteria** per phase and per critical refactor (pilot).
5. The plan must include a **risk register** and mitigation strategies.

### 4.2 Behavior parity guarantees

6. The plan must require **regression tests** for `GameDetailsPage` key flows.
7. The plan must require **E2E smoke tests** covering the primary “game flow”.
8. The plan must ensure refactors are **incremental** and preserve behavior at each step.
9. The plan must prevent “lost code” by requiring:
   - audit of exports/usage before deletion,
   - deprecation windows where needed,
   - search-based usage validation.

### 4.3 Architecture alignment with `docs/frontendImproved.md`

10. The plan must eliminate cross-feature imports and reduce deep imports over time.
11. The plan must migrate ad-hoc data fetching toward **React Query** patterns:
    - queries/mutations in feature hooks,
    - API calls via `src/shared/api/client.js`,
    - consistent query keys.
12. The plan must formalize `Pages` and optionally `Widgets` as described in `docs/frontendImproved.md`, without forcing an Entities refactor.
13. The plan must enforce the CSS policy:
    - Tailwind-first,
    - allow `src/styles/*` for global tokens/system only,
    - ban new per-component CSS.

### 4.4 Tooling enforcement (staged)

14. The plan must add `max-lines` as **warning** first, then later upgrade to **error** once top offenders are refactored.
15. The plan must add **import boundary enforcement** (auto-prevent cross-feature imports), staged after the pilot is stabilized.

---

## 5) Non‑Goals (Out of Scope)

1. Rewriting the UI design or changing product behavior.
2. Large-scale conversion to TypeScript across the whole repo.
3. Backend API redesign (except small additive endpoints if absolutely required for parity and tested).
4. Introducing a new global state library (Redux/Zustand/etc.) unless a specific refactor phase explicitly justifies it.

---

## 6) Design Considerations (Optional)

- No visible UI changes are desired. Any UI differences introduced by splitting components must be treated as regressions unless explicitly approved.
- Prefer “container + presentational” splits:
  - containers orchestrate data/hooks,
  - presentational components render.

---

## 7) Technical Considerations (Optional)

### 7.1 Known smells (from `docs/refactorUi.txt`)

- **God Components** (e.g., `GameDetailsPage/index.jsx` ~2,395 lines)
- **Inconsistent feature structure** (especially `game-management`)
- **Missing abstractions** (dialog system, form patterns, consistent layout composition)
- **Misplaced complexity** (huge theme/animation utilities while feature UI remains monolithic)

### 7.2 Pilot file risk profile (from `GameDetailsPage/index.jsx`)

This file currently mixes:

- direct `fetch` calls and hardcoded backend URL(s),
- deep local UI state and business logic,
- many effects and derived computations,
- multiple dialogs and UI sections,
- roster/formation logic and validation,
- “draft autosave” workflows.

The refactor must preserve:

- behavior for `Scheduled`, `Played`, `Done`,
- draft load/save behavior,
- validation and confirmation flows,
- all dialog open/save/edit/delete behaviors,
- scoring/goal calculations,
- timeline refresh behaviors.

---

## 8) Success Metrics

- **Pilot parity**:
  - 0 known regressions after cutover
  - E2E smoke passes consistently (CI/local)
  - Integration tests cover key flows for `GameDetailsPage`
- **Maintainability**:
  - `GameDetailsPage` reduced from ~2,400 lines → **≤ 250 lines** for the route component
  - top 5 offenders reduced to < 300 lines each (or split into modules)
- **Architecture enforcement**:
  - `max-lines` warning enabled repo-wide
  - import boundary rule enabled (at least for `features/*` cross-import prevention)
- **Developer experience**:
  - PR size reduced (median lines changed per PR decreases)
  - Review cycle time decreases (qualitative if metrics not available)

---

## 9) Open Questions

1. Do we want the “Pages” layer to be introduced immediately (`src/pages/`) or after the pilot cutover?
2. Should we standardize on one dialog base location: `shared/components` vs `shared/ui/composed`?
3. Should we keep the existing `DataProvider` during the pilot, or begin migrating pilot data fetching to React Query in parallel?

---

## Roadmap (Phase-based)

### Phase 0 — Safety Net (1–3 days)

**Outcome**: We can refactor without fear.

- Establish baseline:
  - run existing tests and record baseline results
  - define smoke paths (manual + E2E)
- Add missing tests:
  - E2E smoke: open schedule → open game details → core actions
  - Integration tests for `GameDetailsPage`:
    - loads game in Scheduled/Played/Done
    - lineup draft loads/saves
    - dialogs open/close/save flows (goal/card/substitution)
    - final report submission validation

Acceptance criteria:

- E2E smoke exists and passes locally.
- Integration tests exist and cover at least the top 5 critical flows.

### Phase 1 — Pilot Decomposition (1–2 weeks)

**Outcome**: `GameDetailsPage` becomes a thin container with extracted modules/hooks.

Approach:

- No feature flags; no behavior changes.
- Move code in small PRs, keeping exports stable.

Acceptance criteria:

- `GameDetailsPage/index.jsx` becomes mostly composition + hooks usage.
- All tests green and E2E smoke green after each PR.

### Phase 2 — `game-management` Split + Consistency (1–3 weeks)

**Outcome**: `game-management` stops being a “kitchen sink”.

- Split by domain boundaries (recommended target):
  - game-creation
  - game-execution (pilot lands here conceptually)
  - game-analysis
  - roster-management (if clearly separate)

Acceptance criteria:

- no cross-imports between new features
- consistent internal structure per feature template

### Phase 3 — Shared Abstractions + Enforcement (1–2 weeks)

**Outcome**: Shared patterns exist and lint prevents regression.

- Shared dialog base (one standard)
- Shared form building blocks (where repeated)
- Enable ESLint `max-lines` = warn
- Enable import boundary enforcement (prevent cross-feature imports)

Acceptance criteria:

- lint warnings visible, boundaries enforced for new code
- at least 2 features using the shared dialog base

---

## Ticket / PR Breakdown (small, ordered tasks)

### Phase 0 tickets (safety net)

**T0.1** Add E2E smoke test for game flow
- Scope: minimal but stable path
- AC: fails on regression; passes on baseline

**T0.2** Add integration tests for `GameDetailsPage`:
- scheduled load + draft load/save
- played load + report draft autosave
- done load + dialogs read-only behavior

**T0.3** Add “refactor guardrails” doc snippet to PR template (optional)
- Paste PR checklist from `docs/frontendImproved.md`

### Phase 1 tickets (pilot decomposition)

**T1.1** Create `GameDetailsPage/modules/` shell and move layout sections
- Extract:
  - header section wrapper
  - left sidebar wrapper
  - center tactical wrapper
  - right analysis wrapper
- AC: No behavior change; snapshots (if used) updated deliberately

**T1.2** Extract data loading logic into a hook
- New hook candidate: `useGameDetailsData(gameId)`
- Must preserve:
  - direct fetch behavior (until later migration)
  - fallback to DataProvider games array
  - `isFetchingGame` semantics

**T1.3** Extract draft autosave logic into a hook
- New hook candidate: `useLineupDraftAutosave(...)`
- Must preserve:
  - debounce timing
  - “skip while finalizing” behavior

**T1.4** Extract report draft autosave + merging logic into a hook
- New hook candidate: `useReportDraftAutosaveAndLoad(...)`
- Must preserve merge precedence (draft overrides saved)

**T1.5** Extract roster/formation derivations into hooks
- Candidates:
  - `useGamePlayersByStatus(...)`
  - `useFormationAutoBuild(...)`
  - `useDragAndDropFormation(...)`

**T1.6** Normalize API usage (no hardcoded URLs) inside pilot (incremental)
- Replace direct `fetch('http://localhost:3001/...')` with shared client + env base
- AC: still hits same endpoints; auth still works

**T1.7** Cutover PR: `GameDetailsPage/index.jsx` becomes thin
- `index.jsx` should mostly:
  - parse `gameId`
  - call hooks
  - pass props to modules/components
- AC:
  - ≤ 250 lines for `index.jsx`
  - tests green

### Phase 2 tickets (broader structure)

**T2.1** Create `src/pages/` and move route composition there (thin pages)
- Ensure router points to pages, pages compose features

**T2.2** Split `game-management` into domains (directory move plan + cutover)
- Include a mapping doc and incremental moves (no broken imports)

### Phase 3 tickets (enforcement)

**T3.1** Add ESLint `max-lines` as warning repo-wide
- Configure: 300 hard cap target, but start with warn

**T3.2** Add import boundary enforcement
- Goal: prevent `features/*` importing other `features/*`
- Must provide an allowlist for same-feature internal imports

**T3.3** Establish a shared dialog base and migrate 2+ dialogs
- Choose one location and standardize.

---

## Acceptance Criteria (overall)

- All existing functionality behaves the same after refactor.
- E2E smoke tests pass.
- Integration tests added for the pilot pass.
- No cross-feature imports are introduced; boundaries enforcement planned and later enabled.
- The pilot file is reduced to a maintainable size with logic moved into hooks/modules.



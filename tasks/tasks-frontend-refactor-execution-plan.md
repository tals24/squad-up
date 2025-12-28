## Relevant Files

- `tasks/prd-frontend-refactor-execution-plan.md` - Source PRD defining phases, constraints, and acceptance criteria.
- `docs/frontendImproved.md` - Constitution / standards the refactor must align to.
- `docs/refactorUi.txt` - Diagnosis of code smells and target direction.
- `docs/official/backendSummary.md` - Backend domain behavior and endpoints (game lifecycle, drafts, timeline); used to preserve exact frontend behavior during refactors.
- `frontend/src/features/game-management/components/GameDetailsPage/index.jsx` - Pilot “God Component” to decompose first.
- `frontend/src/features/game-management/components/GameDetailsPage/components/` - Existing extracted subcomponents used by the pilot.
- `frontend/src/features/game-management/api/` - Current API modules used by the pilot (goals, cards, substitutions, etc.).
- `frontend/src/features/game-management/utils/` - Validation + game state utilities used by the pilot.
- `frontend/src/app/providers/DataProvider.jsx` - Global data provider currently used by the pilot; impacts refactor strategy.
- `frontend/src/app/providers/QueryProvider.jsx` - React Query defaults; impacts migration patterns.
- `frontend/src/shared/api/client.js` - Shared API client required by `docs/frontendImproved.md`.
- `frontend/src/__tests__/e2e/gameManagement.spec.js` - Existing E2E location; add/extend smoke coverage here.
- `frontend/src/__tests__/integration/gameCreationFlow.test.jsx` - Existing integration test patterns to follow.
- `frontend/eslint.config.js` - Add staged lint enforcement (`max-lines`, boundaries) here.
- `frontend/vite.config.js` - Alias config (`@`); affects import cleanup during moves.

### Notes

- Unit/integration tests should be colocated when feature-specific, but this repo already has `src/__tests__/...`—follow existing conventions unless we deliberately migrate.
- Use small PRs. Each parent task below should be shippable with tests green.
- Keep behavior identical. Any UI/logic change is a regression unless explicitly approved.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this work (e.g., `git checkout -b refactor/frontend-alignment-plan`)
  - [x] 0.2 Push branch to remote and open a draft PR describing scope + "no behavior change" policy

- [x] 1.0 Phase 0 — Safety Net: establish regression protection (tests + smoke)
  - [x] 1.1 Read and internalize the constitution + diagnosis
    - [x] 1.1.1 Read `docs/frontendImproved.md` and extract the non-negotiables into the PR description
    - [x] 1.1.2 Read `docs/refactorUi.txt` and list the top 5 offenders + why they are risky
  - [x] 1.2 Establish a reproducible baseline (record "known good" behavior)
    - [x] 1.2.1 Identify the critical user flows for the pilot page (Scheduled/Played/Done)
    - [x] 1.2.2 Write a short "manual smoke checklist" (steps + expected results) for GameDetails
    - [x] 1.2.3 Capture baseline console/network expectations (e.g., which endpoints are called in each flow)
  - [x] 1.3 Add/extend E2E smoke coverage for game flow
    - [x] 1.3.1 Review `frontend/src/__tests__/e2e/gameManagement.spec.js` and existing coverage gaps
    - [x] 1.3.2 Add a stable E2E smoke scenario: open schedule → open game details → verify key UI loads
    - [x] 1.3.3 Add at least one smoke scenario per game status (Scheduled, Played, Done) if feasible
  - [x] 1.4 Add integration regression tests for `GameDetailsPage` (behavior parity)
    - [x] 1.4.1 Add tests for Scheduled: draft loads, roster changes trigger autosave debounce
    - [x] 1.4.2 Add tests for Played: report draft autosave enabled; "final report" validation blocks as before
    - [x] 1.4.3 Add tests for Done: read-only behavior enforced, dialogs reflect read-only state
    - [x] 1.4.4 Add tests for dialogs: Goal/Card/Substitution open/close/save paths (happy paths)
  - [x] 1.5 Define "refactor gates" that must stay green for every PR
    - [x] 1.5.1 Gate: E2E smoke passes
    - [x] 1.5.2 Gate: pilot integration tests pass
    - [x] 1.5.3 Gate: no cross-feature imports introduced
    - [x] 1.5.4 Gate: behavior parity checklist has no regressions

- [ ] 2.0 Phase 1 — Pilot: decompose `GameDetailsPage` into modules + hooks (no behavior changes)
  - [x] 2.1 Create a decomposition map before moving code
    - [x] 2.1.1 Inventory responsibilities inside `GameDetailsPage/index.jsx` (data loading, draft autosave, formation, dialogs, validation, etc.)
    - [x] 2.1.2 Identify "stable boundaries" for extraction (what can move without changing behavior)
    - [x] 2.1.3 Document a target folder layout for the pilot (modules + hooks), keeping current imports working
  - [x] 2.2 PR set A — UI module extraction (pure composition)
    - [x] 2.2.1 Create `GameDetailsPage/modules/` and extract top-level layout sections as wrappers (no logic changes)
    - [x] 2.2.2 Ensure all props passed through unchanged (same values, same handlers)
    - [x] 2.2.3 Verify: E2E smoke + integration tests green
  - [ ] 2.3 PR set B — Extract “data loading” hook (preserve current behavior)
    - [ ] 2.3.1 Extract the “fetch game directly + fallback to DataProvider” logic into `useGameDetailsData(gameId, games, ...)`
    - [ ] 2.3.2 Preserve semantics: `isFetchingGame`, `isReadOnly`, matchDuration init, finalScore init, teamSummary init
    - [ ] 2.3.3 Keep network behavior the same for now (still uses the same endpoints)
    - [ ] 2.3.4 Verify: tests green + manual smoke checklist unchanged
  - [ ] 2.4 PR set C — Extract lineup draft load + autosave hook (Scheduled games)
    - [ ] 2.4.1 Extract draft load precedence logic (draft first, then gameRosters, then default)
    - [ ] 2.4.2 Extract autosave debounce logic (2.5s) and “skip while finalizing” guard
    - [ ] 2.4.3 Preserve payload shape and endpoint used for draft updates
    - [ ] 2.4.4 Verify: scheduled tests + smoke green
  - [ ] 2.5 PR set D — Extract report draft load + autosave hook (Played/Done games)
    - [ ] 2.5.1 Extract report draft merge logic (draft overrides saved)
    - [ ] 2.5.2 Preserve the “shouldSkip” semantics used by `useAutosave`
    - [ ] 2.5.3 Verify: played/done tests + smoke green
  - [ ] 2.6 PR set E — Extract formation/roster derivations + DnD behavior into hooks
    - [ ] 2.6.1 Extract player grouping logic (bench/squad/onPitch, maps for reconstruction)
    - [ ] 2.6.2 Extract formation auto-build logic and ensure manual mode behavior stays identical
    - [ ] 2.6.3 Extract drag/drop handlers and out-of-position confirmation logic
    - [ ] 2.6.4 Verify: same DnD UX + tests green
  - [ ] 2.7 PR set F — Normalize API calls in the pilot (remove hardcoded URLs)
    - [ ] 2.7.1 Replace `fetch('http://localhost:3001/...')` in the pilot with `src/shared/api/client.js` usage
    - [ ] 2.7.2 Preserve auth header behavior and response parsing behavior
    - [ ] 2.7.3 Verify network requests still hit the same backend routes and behavior is unchanged
  - [ ] 2.8 Cutover PR — Make `GameDetailsPage/index.jsx` a thin container
    - [ ] 2.8.1 Ensure `index.jsx` is primarily: id parsing → hooks → module composition
    - [ ] 2.8.2 Target: `index.jsx` ≤ 250 lines
    - [ ] 2.8.3 Verify: all tests green, smoke green, no regressions on manual checklist

- [ ] 3.0 Phase 2 — Restructure: introduce `src/pages/` and split `game-management` by domain (incremental cutovers)
  - [ ] 3.1 Introduce `src/pages/` without breaking routes
    - [ ] 3.1.1 Create `frontend/src/pages/` and add a thin page for the pilot route (compose the feature component)
    - [ ] 3.1.2 Update routing (`frontend/src/app/router/*`) to point to pages (keep URLs identical)
    - [ ] 3.1.3 Verify: routing works + tests green
  - [ ] 3.2 Plan domain split for `game-management` (no “big bang”)
    - [ ] 3.2.1 Create a migration mapping doc: what becomes game-creation vs game-execution vs game-analysis
    - [ ] 3.2.2 Identify shared modules that must remain in `shared/` vs stay feature-local
    - [ ] 3.2.3 Define incremental cutover order (which folders move first)
  - [ ] 3.3 Execute domain split incrementally
    - [ ] 3.3.1 Create new feature folders with canonical template (api/components/hooks/schemas/utils/index.js)
    - [ ] 3.3.2 Move code in small PRs, keeping public exports stable via `index.js`
    - [ ] 3.3.3 Update imports using `@/` alias (no fragile relative chains)
    - [ ] 3.3.4 Verify: no cross-feature imports, tests green after each move

- [ ] 4.0 Phase 3 — Shared abstractions: dialog base + shared patterns adoption
  - [ ] 4.1 Standardize shared dialog base location
    - [ ] 4.1.1 Decide and document the standard location (recommended: `frontend/src/shared/ui/composed/`)
    - [ ] 4.1.2 Create a reusable base dialog wrapper and API (title/body/footer/actions/loading)
  - [ ] 4.2 Migrate at least 2 dialogs to the shared base
    - [ ] 4.2.1 Migrate Goal dialog or Card dialog first (pick the simplest)
    - [ ] 4.2.2 Migrate one additional dialog (Substitution or Confirmation)
    - [ ] 4.2.3 Verify: behavior and styling unchanged, tests green
  - [ ] 4.3 Consolidate shared form patterns (only where repeated)
    - [ ] 4.3.1 Identify duplicated form field patterns across dialogs/features
    - [ ] 4.3.2 Introduce shared form primitives (if justified) and migrate incrementally

- [ ] 5.0 Tooling enforcement rollout: staged ESLint `max-lines` + import boundary enforcement (non-breaking first)
  - [ ] 5.1 Add `max-lines` as warning (Stage 1)
    - [ ] 5.1.1 Update `frontend/eslint.config.js` to add `max-lines` with warning severity
    - [ ] 5.1.2 Confirm it targets JS/JSX only and skips blanks/comments as per standards
    - [ ] 5.1.3 Verify it doesn’t block CI immediately (warning only)
  - [ ] 5.2 Add import boundary enforcement (Stage 2, after pilot is stable)
    - [ ] 5.2.1 Choose an approach (eslint plugin or custom rule) to prevent `features/*` importing other `features/*`
    - [ ] 5.2.2 Add allowlist rules for same-feature internal imports and `shared/` imports
    - [ ] 5.2.3 Add a small set of tests/examples to prove the rule works (if supported)
  - [ ] 5.3 Flip enforcement levels once top offenders are reduced
    - [ ] 5.3.1 Promote `max-lines` from warn → error once pilot + next offenders are refactored
    - [ ] 5.3.2 Add a CI check / PR template note to prevent reintroducing mega-files



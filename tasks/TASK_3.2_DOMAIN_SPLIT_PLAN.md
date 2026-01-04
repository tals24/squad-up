# Task 3.2: Domain Split Plan for `game-management`

**Status:** 📋 Planning  
**Date:** 2026-01-04  
**Branch:** `refactor/frontend-alignment-plan`

---

## 📊 Current State Analysis

### Current `game-management` Structure:

```
src/features/game-management/
├── api/                          # 9 API modules
│   ├── cardsApi.js
│   ├── difficultyAssessmentApi.js
│   ├── gameApi.js
│   ├── goalsApi.js
│   ├── playerMatchStatsApi.js
│   ├── playerStatsApi.js
│   ├── substitutionsApi.js
│   ├── timelineApi.js
│   └── index.js
├── components/
│   ├── AddGamePage/             # Game creation
│   ├── GameDetailsPage/         # Game execution (Scheduled/Played/Done)
│   │   ├── components/          # 14 UI components + 7 dialogs
│   │   ├── hooks/               # 15 custom hooks
│   │   ├── modules/             # 5 composition modules
│   │   ├── formations.js        # Formation definitions
│   │   └── __tests__/           # Integration tests
│   └── GamesSchedulePage/       # Game listing/schedule
├── utils/                        # 6 utility modules
│   ├── cardValidation.js
│   ├── gameState.js
│   ├── gameUtils.js
│   ├── minutesValidation.js
│   ├── squadValidation.js
│   └── __tests__/
└── index.js
```

**Size:** ~5,000+ lines of code (LOC), largest feature in the codebase

---

## 🎯 Domain Analysis

### Backend Domain Boundaries (from `backendSummary.md`):

The backend organizes game functionality into clear bounded contexts:

1. **Game Lifecycle Management** - Creating, scheduling, starting, finalizing games
2. **Game Execution** - Real-time tracking (goals, cards, substitutions)
3. **Game Reporting** - Post-game reports, player performance, team summaries
4. **Game Analysis** - Statistics, difficulty assessment, timeline

### User Journey Analysis:

1. **Pre-Game (Planning):**
   - View games schedule
   - Create new game
   - Set lineup and formation (Draft → Scheduled)

2. **Game Day (Execution):**
   - Start game (Scheduled → Played)
   - Track events (goals, cards, subs)
   - Fill reports

3. **Post-Game (Analysis):**
   - Submit final report (Played → Done)
   - View completed game stats
   - Analyze performance

---

## 🗺️ Proposed Domain Split

### Option 1: Split by User Journey (Recommended)

**Rationale:** Aligns with user workflows and natural boundaries

```
src/features/
├── game-scheduling/              # NEW - Pre-game management
│   ├── api/
│   │   └── gameApi.js           # MOVE: Basic CRUD operations
│   ├── components/
│   │   ├── GamesSchedulePage/   # MOVE from game-management
│   │   └── AddGamePage/         # MOVE from game-management
│   └── utils/
│       └── gameUtils.js         # MOVE: Basic game utilities
│
├── game-execution/               # NEW - Game day operations (PILOT)
│   ├── api/
│   │   ├── gameApi.js           # SHARED: Game state transitions
│   │   ├── goalsApi.js          # MOVE
│   │   ├── cardsApi.js          # MOVE
│   │   ├── substitutionsApi.js  # MOVE
│   │   ├── timelineApi.js       # MOVE
│   │   ├── playerMatchStatsApi.js # MOVE
│   │   └── playerStatsApi.js    # MOVE
│   ├── components/
│   │   └── GameDetailsPage/     # MOVE (already refactored!)
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── modules/
│   │       ├── formations.js
│   │       └── __tests__/
│   └── utils/
│       ├── cardValidation.js    # MOVE
│       ├── minutesValidation.js # MOVE
│       └── squadValidation.js   # MOVE
│
└── game-analysis/                # FUTURE - Post-game analytics
    ├── api/
    │   ├── difficultyAssessmentApi.js # MOVE
    │   └── analyticsApi.js      # NEW (if needed)
    └── components/
        └── GameAnalyticsPage/   # FUTURE (detailed analysis view)
```

**Benefits:**
- ✅ Clear separation by user workflow
- ✅ GameDetailsPage (pilot) moves as-is with all its decomposed structure
- ✅ Reduces cross-feature imports naturally
- ✅ Each feature <1,500 LOC
- ✅ Easy to reason about and test

**Drawbacks:**
- Some API modules shared between features (gameApi.js used by both)
- Requires careful extraction of shared logic

---

### Option 2: Split by Data Entity (Alternative)

**Rationale:** Aligns with backend controllers

```
src/features/
├── games/                        # Core game CRUD
├── game-events/                  # Goals, cards, subs
├── game-reports/                 # Player reports, team summaries
└── game-rosters/                 # Lineup management
```

**Benefits:**
- ✅ Maps 1:1 with backend structure
- ✅ Clear data ownership

**Drawbacks:**
- ❌ High cross-feature coupling (GameDetailsPage needs all features)
- ❌ Doesn't match user workflows
- ❌ More complex to refactor
- ❌ Violates "no cross-feature imports" rule

**Decision: Option 1 (Split by User Journey)** ✅

---

## 📦 Shared vs. Feature-Local Identification

### Move to `shared/` (Used by 2+ features):

1. **API Client** - Already in `shared/api/client.js` ✅
2. **Formation Types/Utils** - If used outside game-execution
3. **Player Card Component** - If used in other features
4. **Base Dialog Wrapper** - Phase 3 work (Task 4.1)

### Keep Feature-Local (Used within single feature):

1. **GameDetailsPage/** - All components, hooks, modules (game-execution)
2. **Game-specific dialogs** - GoalDialog, CardDialog, SubDialog (game-execution)
3. **Game-specific validation** - squadValidation, minutesValidation (game-execution)
4. **AddGamePage/** - Form components (game-scheduling)
5. **GamesSchedulePage/** - Schedule grid/list (game-scheduling)

### Shared API Modules (Special Case):

**Problem:** `gameApi.js` is needed by both game-scheduling AND game-execution

**Solution (3 options):**

**A) Split gameApi.js** (Recommended)
```javascript
// shared/api/gameApi.js - Basic CRUD only
export const getGames = () => apiClient.get('/api/games');
export const getGameById = (id) => apiClient.get(`/api/games/${id}`);
export const createGame = (data) => apiClient.post('/api/games', data);
export const updateGame = (id, data) => apiClient.put(`/api/games/${id}`, data);

// game-execution/api/gameExecutionApi.js - Game day operations
export const startGame = (id, data) => apiClient.post(`/api/games/${id}/start-game`, data);
export const submitFinalReport = (id, data) => apiClient.post(`/api/games/${id}/submit-final-report`, data);
export const getPlayerStats = (id) => apiClient.get(`/api/games/${id}/player-stats`);

// game-scheduling/api/gameSchedulingApi.js - Schedule-specific
export const transitionToScheduled = (id) => apiClient.post(`/api/games/${id}/transition-to-scheduled`);
export const getGameDraft = (id) => apiClient.get(`/api/games/${id}/draft`);
```

**B) Keep in shared/api/** - If truly used everywhere
```javascript
// shared/api/gameApi.js - Complete API, moved to shared
```

**C) Use composition** - Each feature re-exports what it needs
```javascript
// game-execution/api/index.js
export { getGameById, startGame } from '@/shared/api/gameApi';
export * from './goalsApi';
export * from './cardsApi';
```

**Decision: Option A (Split by concern)** ✅

---

## 🔄 Migration Order (Incremental Cutover)

### Phase A: Preparation (No moves yet)
1. ✅ Create `pages/GameDetailsPage.jsx` wrapper (Task 3.1 - DONE!)
2. ✅ Update routing to use pages layer (Task 3.1 - DONE!)
3. [ ] Document current imports/exports in `game-management/index.js`
4. [ ] Identify all external imports TO game-management
5. [ ] Run tests to ensure green baseline

### Phase B: Extract `game-scheduling` (Smallest, least coupled)
1. [ ] Create `features/game-scheduling/` with canonical structure
2. [ ] Move `GamesSchedulePage/` + `AddGamePage/`
3. [ ] Split `gameApi.js` and move scheduling functions
4. [ ] Move `gameUtils.js` (if only used for scheduling)
5. [ ] Create pages wrappers (`pages/GamesSchedulePage.jsx`, `pages/AddGamePage.jsx`)
6. [ ] Update routing imports
7. [ ] Update `game-management/index.js` to remove moved exports
8. [ ] Run tests → verify green
9. [ ] Commit & push

### Phase C: Rename `game-management` → `game-execution` (Pilot feature)
1. [ ] Create `features/game-execution/` folder
2. [ ] Move `GameDetailsPage/` (entire folder with hooks, modules, tests)
3. [ ] Move execution-specific APIs (goals, cards, subs, timeline, stats)
4. [ ] Move execution-specific utils (validation)
5. [ ] Update `pages/GameDetailsPage.jsx` import path
6. [ ] Update all internal imports (use `@/` alias)
7. [ ] Run tests → verify green
8. [ ] Delete empty `game-management/` folder
9. [ ] Commit & push

### Phase D: Extract `game-analysis` (Future - Optional)
1. [ ] Create `features/game-analysis/` when analytics grows
2. [ ] Move difficulty assessment
3. [ ] Create dedicated analytics/reports views
4. [ ] Separate from game-execution

**Estimated Effort:**
- Phase A: 30 minutes
- Phase B: 2-3 hours
- Phase C: 2-3 hours
- Phase D: Future work

**Total: ~5-6 hours** (spread across multiple PRs)

---

## 🧪 Verification Strategy

### After Each Phase:

**1. Import Analysis:**
```bash
# Verify no cross-feature imports
grep -r "from '@/features" frontend/src/features/game-scheduling
grep -r "from '@/features" frontend/src/features/game-execution

# Should only find: from '@/shared'
```

**2. Run Tests:**
```bash
cd frontend
npm run test                      # All tests pass
npm run lint                      # No errors
```

**3. Manual Smoke Test:**
- Navigate to each moved page
- Verify functionality unchanged
- Check console for errors

**4. Bundle Analysis:**
```bash
npm run build
# Verify chunk sizes reasonable
# Verify lazy loading still works
```

---

## 📋 Checklist for Each Migration PR

- [ ] Create new feature folder with canonical structure (api/components/hooks/utils/index.js)
- [ ] Move files using `git mv` (preserves history)
- [ ] Update all imports to use `@/` alias (no relative imports across features)
- [ ] Update `index.js` public exports
- [ ] Create/update page wrappers
- [ ] Update routing
- [ ] Run linter → fix errors
- [ ] Run tests → all green
- [ ] Manual smoke test → no regressions
- [ ] Update this plan with ✅ checkmarks
- [ ] Commit with clear message
- [ ] Push and verify CI passes

---

## 🎯 Success Metrics

**Before Split:**
- 1 feature: `game-management` (~5,000+ LOC)
- Mixed concerns (creation + execution + analysis)
- Hard to navigate and reason about

**After Split:**
- 2 features: `game-scheduling` + `game-execution` (~1,500 LOC each)
- Clear boundaries by user workflow
- Each feature independently testable
- No cross-feature imports
- Easier onboarding for new developers

**Future State:**
- 3 features: + `game-analysis` for advanced analytics
- Each <1,500 LOC
- Clean dependency graph

---

## 🔍 Open Questions & Decisions Needed

### Q1: Should formations.js move to shared/?
**Analysis:** Currently only used in GameDetailsPage. If other features need formations (e.g., TacticBoardPage), move to `shared/lib/formations.js`.

**Decision:** Keep in game-execution for now. Move to shared if/when needed. ✅

### Q2: What about GameDetailsPage OLD files?
**Found:**
- `index_FINAL.jsx`
- `index_NEW.jsx`
- `index.jsx.NEW`
- `index.jsx.OLD`

**Decision:** Delete all backup files before migration. Only keep `index.jsx`. ✅

### Q3: Where do tests live?
**Analysis:** 
- Integration tests specific to feature → keep colocated (`__tests__/` inside feature)
- E2E tests → keep in global `frontend/src/__tests__/e2e/`

**Decision:** Keep feature tests colocated, update import paths. ✅

---

## 📚 References

- `docs/frontendImproved.md` - Feature-Sliced Design principles
- `docs/official/backendSummary.md` - Backend domain boundaries
- `tasks/DECOMPOSITION_MAP.md` - GameDetailsPage decomposition
- `tasks/TASK_2.8_COMPLETE.md` - Phase 1 completion summary

---

## 📝 Notes

- This plan follows the "incremental cutovers" approach (no big bang)
- Each phase is independently testable and shippable
- We prioritize moving the already-refactored pilot (game-execution) to showcase the new pattern
- Smaller PRs = easier to review and safer to merge
- The pages layer (Task 3.1) makes this migration cleaner by isolating routing


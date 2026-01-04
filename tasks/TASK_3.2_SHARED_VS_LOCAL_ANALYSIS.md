# Task 3.2.2: Shared vs. Feature-Local Module Analysis

**Date:** 2026-01-04  
**Branch:** `refactor/frontend-alignment-plan`

---

## 🎯 Objective

Identify which modules from `game-management` should move to `shared/` (reusable across features) vs. stay feature-local (used within a single domain).

---

## 📊 Analysis Results

### ✅ MOVE TO `shared/` (Used by 2+ features or will be)

#### 1. **API Client** 
- **Current:** `shared/api/client.js` ✅ Already there!
- **Usage:** All features
- **Action:** No move needed

#### 2. **Base Dialog Components** (Phase 3 - Task 4.1)
- **Current:** Feature-specific dialogs in each feature
- **Future:** `shared/ui/composed/BaseDialog.jsx`
- **Usage:** Will be used by all dialog-heavy features
- **Action:** Create in Phase 3, migrate dialogs incrementally

#### 3. **Player Card Component** (If used beyond game-execution)
- **Current:** `game-management/components/GameDetailsPage/components/PlayerCard.jsx`
- **Check needed:** Is it used in PlayerManagement, Analytics, or other features?
- **Decision:** 
  - ✅ If used elsewhere → move to `shared/components/PlayerCard/`
  - ❌ If only in GameDetails → keep in game-execution
- **Current assessment:** Likely stays feature-local (only seen in GameDetails)

#### 4. **Formation Utilities** (If used beyond game-execution)
- **Current:** `game-management/components/GameDetailsPage/formations.js`
- **Check needed:** Does TacticBoardPage or TrainingPlanner use formations?
- **Decision:**
  - ✅ If used elsewhere → move to `shared/lib/formations.js`
  - ❌ If only in GameDetails → keep in game-execution
- **Current assessment:** Likely stays feature-local for now, move if needed later

---

### ❌ KEEP FEATURE-LOCAL (Single feature usage)

#### In `game-execution/` (from GameDetailsPage):

**Components:**
- ✅ All GameDetailsPage components (14 files)
- ✅ All dialogs (7 files) - Goal, Card, Substitution, PlayerPerformance, TeamSummary, FinalReport
- ✅ DifficultyAssessmentCard
- ✅ TacticalBoard
- ✅ GameDayRosterSidebar
- ✅ MatchAnalysisSidebar
- ✅ GameDetailsHeader
- ✅ Feature sections (DetailedStats, GoalInvolvement, DetailedDisciplinary)

**Hooks (15 files):**
- ✅ useCardsHandlers
- ✅ useDialogState
- ✅ useDifficultyHandlers
- ✅ useEntityLoading
- ✅ useFormationAutoBuild
- ✅ useFormationHandlers
- ✅ useGameDetailsData
- ✅ useGameStateHandlers
- ✅ useGoalsHandlers
- ✅ useLineupDraftManager
- ✅ usePlayerGrouping
- ✅ useReportDraftManager
- ✅ useReportHandlers
- ✅ useSubstitutionsHandlers
- ✅ useTacticalBoardDragDrop

**Modules (5 files):**
- ✅ DialogsModule
- ✅ GameHeaderModule
- ✅ MatchAnalysisModule
- ✅ RosterSidebarModule
- ✅ TacticalBoardModule

**Utils:**
- ✅ cardValidation.js (specific to game cards logic)
- ✅ minutesValidation.js (specific to game minutes calculation)
- ✅ squadValidation.js (specific to game squad/lineup rules)

**API Modules:**
- ✅ goalsApi.js
- ✅ cardsApi.js
- ✅ substitutionsApi.js
- ✅ timelineApi.js
- ✅ playerMatchStatsApi.js
- ✅ playerStatsApi.js
- ✅ difficultyAssessmentApi.js (or move to game-analysis later)

**Other:**
- ✅ formations.js (formation definitions)
- ✅ __tests__/ (all integration tests)

#### In `game-scheduling/`:

**Components:**
- ✅ AddGamePage/ (entire folder)
- ✅ GamesSchedulePage/ (entire folder)

**API:**
- ✅ gameSchedulingApi.js (split from gameApi.js)
  - createGame
  - updateGame
  - deleteGame
  - transitionToScheduled
  - getGameDraft (for scheduled games)
  - updateGameDraft (for scheduled games)

**Utils:**
- ✅ gameUtils.js (if only used for basic game operations)

---

## 🔀 SPLIT MODULES (Used by multiple features)

### 1. `gameApi.js` → Split into 3 parts

**A) `shared/api/gameApi.js` - Core CRUD**
```javascript
// Basic operations used everywhere
export const getGames = (filters) => apiClient.get('/api/games', { params: filters });
export const getGameById = (id) => apiClient.get(`/api/games/${id}`);
```

**B) `game-scheduling/api/gameSchedulingApi.js` - Pre-game**
```javascript
// Scheduling-specific operations
export const createGame = (data) => apiClient.post('/api/games', data);
export const updateGame = (id, data) => apiClient.put(`/api/games/${id}`, data);
export const deleteGame = (id) => apiClient.delete(`/api/games/${id}`);
export const transitionToScheduled = (id) => apiClient.post(`/api/games/${id}/transition-to-scheduled`);
export const getGameDraft = (id) => apiClient.get(`/api/games/${id}/draft`);
export const updateGameDraft = (id, data) => apiClient.put(`/api/games/${id}/draft`, data);
```

**C) `game-execution/api/gameExecutionApi.js` - Game day**
```javascript
// Execution-specific operations
export const startGame = (id, data) => apiClient.post(`/api/games/${id}/start-game`, data);
export const getPlayerStats = (gameId) => apiClient.get(`/api/games/${gameId}/player-stats`);
export const submitFinalReport = (id, data) => apiClient.post(`/api/games/${id}/submit-final-report`, data);
export const transitionToDone = (id) => apiClient.post(`/api/games/${id}/transition-to-done`);
export const getGameDraft = (id) => apiClient.get(`/api/games/${id}/draft`); // For report drafts
export const updateGameDraft = (id, data) => apiClient.put(`/api/games/${id}/draft`, data); // For report drafts
```

**Note:** `getGameDraft` and `updateGameDraft` are polymorphic (work for both lineup and report drafts based on game status). Both features will have these functions, calling the same backend endpoint with different payload shapes.

---

## 📋 Verification Checklist

After migration, verify:

- [ ] No imports like `from '@/features/game-execution'` in game-scheduling
- [ ] No imports like `from '@/features/game-scheduling'` in game-execution
- [ ] All cross-feature needs met through `shared/`
- [ ] Each feature has complete `index.js` with public API
- [ ] All tests pass
- [ ] No circular dependencies

---

## 🎯 Decision Summary

| Module | Location | Rationale |
|--------|----------|-----------|
| API Client | `shared/api/` | Used by all features ✅ |
| Base Dialog | `shared/ui/composed/` (Phase 3) | Will be used across features |
| PlayerCard | `game-execution/` | Only used in GameDetails (for now) |
| Formations | `game-execution/` | Only used in GameDetails (for now) |
| Game CRUD | `shared/api/gameApi.js` | Used by scheduling, execution, analytics |
| Game scheduling ops | `game-scheduling/api/` | Only scheduling cares |
| Game execution ops | `game-execution/api/` | Only execution cares |
| GameDetailsPage/* | `game-execution/` | Complete feature (already decomposed) |
| AddGamePage | `game-scheduling/` | Only scheduling cares |
| GamesSchedulePage | `game-scheduling/` | Only scheduling cares |
| Validation utils | `game-execution/utils/` | Specific to game day logic |

---

## 📝 Notes

- This analysis follows the "Feature-Sliced Design" principle: features should be independent, communicating only through shared abstractions or backend APIs.
- When in doubt, start feature-local. Move to `shared/` only when a second feature genuinely needs it.
- The split of `gameApi.js` follows the Single Responsibility Principle: each part handles one concern.
- This structure makes it easy to find code: "Where's the lineup builder?" → "game-execution, it's about executing games."


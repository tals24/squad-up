# Task 3.3 - Phase A: Baseline Documentation

**Date:** 2026-01-04  
**Branch:** `refactor/frontend-alignment-plan`

---

## 📊 Current `game-management` Exports

### Public API (`frontend/src/features/game-management/index.js`):

```javascript
// Page Components
export { default as GameDetailsPage } from './components/GameDetailsPage';
export { default as GamesSchedulePage } from './components/GamesSchedulePage';
export { default as AddGamePage } from './components/AddGamePage';

// API Functions
export * from './api/gameApi';

// Utilities
export * from './utils';
```

---

## 🔍 External Imports Analysis

### Files importing FROM `game-management`:

#### ✅ **Valid Imports** (via pages layer or shared):

1. **`pages/GameDetailsPage.jsx`**
   ```javascript
   import GameDetails from '@/features/game-management/components/GameDetailsPage';
   ```
   - **Status:** ✅ Valid (will be updated when we move to game-execution)
   - **Note:** Using pages layer correctly

2. **`shared/hooks/queries/useGames.js`**
   ```javascript
   import { updateGame, deleteGame } from '@/features/game-management/api/gameApi';
   ```
   - **Status:** ✅ Valid (shared can import from features)
   - **Note:** Will need to update paths after split

#### ✅ **Internal Imports** (within game-management):

3. **`features/game-management/components/AddGamePage/index.jsx`**
   ```javascript
   import { createGame } from '@/features/game-management/api';
   ```
   - **Status:** ✅ Valid (internal import within same feature)

#### ⚠️ **Test Imports** (acceptable for tests):

4. **`__tests__/integration/gameDetailsPage.test.jsx`**
   ```javascript
   import GameDetailsPage from '@/features/game-management/components/GameDetailsPage';
   import * as gameApi from '@/features/game-management/api/gameApi';
   ```
   - **Status:** ⚠️ Acceptable (tests can import directly)
   - **Note:** Will need to update paths after migration

5. **`__tests__/integration/gameCreationFlow.test.jsx`**
   ```javascript
   import GamesSchedulePage from '@/features/game-management/components/GamesSchedulePage';
   import * as gameApi from '@/features/game-management/api/gameApi';
   ```
   - **Status:** ⚠️ Acceptable (tests can import directly)
   - **Note:** Will need to update paths after migration

#### ❌ **CROSS-FEATURE IMPORTS** (violations!):

6. **`features/analytics/components/DashboardPage/index.jsx`**
   ```javascript
   import { getGameResult, getResultColor, getResultText } from '@/features/game-management/utils';
   ```
   - **Status:** ❌ **VIOLATION** - Cross-feature import!
   - **Action Required:** Move these utils to `shared/lib/` before domain split

7. **`features/analytics/components/shared/GameZone.jsx`**
   ```javascript
   import { getGameResult, getResultColor, getResultText } from '@/features/game-management/utils';
   ```
   - **Status:** ❌ **VIOLATION** - Cross-feature import!
   - **Action Required:** Move these utils to `shared/lib/` before domain split

---

## 🚨 Blockers Found

### **Issue #1: Cross-Feature Util Imports**

**Problem:** `analytics` feature imports utils from `game-management` feature.

**Functions:**
- `getGameResult(game)` - Determines game outcome (win/loss/draw)
- `getResultColor(result)` - Returns color class for result
- `getResultText(result)` - Returns display text for result

**Current Location:**
- `frontend/src/features/game-management/utils/gameUtils.js`

**Required Action:**
- Move these utils to `shared/lib/gameResultUtils.js` (or similar)
- Update imports in analytics AND game-management
- Verify both features work after move

**Why This Blocks Migration:**
If we split game-management into game-scheduling/game-execution without fixing this, the analytics feature will break because it won't know which of the two new features to import from.

---

## 📋 Phase A Checklist

- [x] Document current exports (`game-management/index.js`)
- [x] Identify all external imports TO game-management
- [x] **❌ BLOCKER FOUND:** Cross-feature util imports
- [ ] Move shared utils to `shared/lib/` (MUST DO FIRST)
- [ ] Verify analytics still works after util move
- [ ] Run tests to ensure green baseline
- [ ] Commit baseline fix before proceeding to Phase B

---

## 🎯 Next Steps (Phase A Continued)

### Step 1: Move shared utils to `shared/lib/`
```bash
# Create new shared lib file
# Move getGameResult, getResultColor, getResultText
# Update exports
```

### Step 2: Update imports
```javascript
// In analytics/DashboardPage/index.jsx
- import { getGameResult, getResultColor, getResultText } from '@/features/game-management/utils';
+ import { getGameResult, getResultColor, getResultText } from '@/shared/lib/gameResultUtils';

// In analytics/shared/GameZone.jsx
- import { getGameResult, getResultColor, getResultText } from '@/features/game-management/utils';
+ import { getGameResult, getResultColor, getResultText } from '@/shared/lib/gameResultUtils';

// In game-management (if used internally)
+ import { getGameResult, getResultColor, getResultText } from '@/shared/lib/gameResultUtils';
```

### Step 3: Verify & commit
```bash
npm run lint
npm run test
# Manual smoke: Dashboard, GameZone, GameDetails
git add -A
git commit -m "refactor: move game result utils to shared lib"
git push
```

---

## 📊 Migration Impact Summary

### Files That Will Need Path Updates After Split:

**After Phase B (game-scheduling extraction):**
- `pages/GamesSchedulePage.jsx` → import from `@/features/game-scheduling`
- `pages/AddGamePage.jsx` → import from `@/features/game-scheduling`
- Test files importing GamesSchedulePage, AddGamePage

**After Phase C (game-management → game-execution rename):**
- `pages/GameDetailsPage.jsx` → import from `@/features/game-execution`
- `shared/hooks/queries/useGames.js` → imports split between shared/api and feature APIs
- Test files importing GameDetailsPage

**Estimated Files to Update:** 5-7 files per phase (manageable)

---

## 🧪 Baseline Test Status

**To be run after fixing blocker:**

```bash
cd frontend
npm run lint          # Should pass
npm run test          # Should pass
```

**Manual Smoke Test:**
1. Navigate to Dashboard → verify GameZone displays correctly
2. Navigate to Games Schedule → verify list displays
3. Open a game in "Done" status → verify result badge shows correct color/text
4. Check console → no errors

---

## ✅ Definition of Done (Phase A)

- [ ] All cross-feature imports resolved (utils moved to shared)
- [ ] All tests pass (green baseline)
- [ ] No linter errors
- [ ] Manual smoke test passes
- [ ] Changes committed and pushed
- [ ] Ready to start Phase B (game-scheduling extraction)

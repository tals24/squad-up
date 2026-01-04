# Issues to Solve Later

## Test Failures in `validation.integration.test.jsx`

**Status**: 7 tests failing, 6 tests passing (out of 13 total)

**Last Updated**: 2024-12-19

---

## Failing Tests Summary

### 1. `should block "Game Was Played" with incomplete formation`
**Test Location**: `Starting Lineup Validation` suite

**What it tests**: Validates that the system blocks marking a game as played when only 5 players are assigned to the starting lineup (instead of 11).

**Expected Result**: Error modal appears with message matching `/Cannot mark game as played.*Only \d+ players in starting lineup/` OR `/Cannot mark game as played.*No players assigned to starting lineup/`

**Why it's failing**: 
- **Root Cause**: The component's formation auto-build logic isn't working correctly in the test environment
- **Issue**: `gamePlayers` array is empty (`gamePlayersCount: 0`) because team filtering isn't working properly
- **Details**: The component filters players by team ID, but the async nature of game loading → team filtering → formation building isn't completing before the test assertions run
- **Console logs show**: `⚠️ [Formation Rebuild] Skipping - no game players`

**Potential Solutions**:
1. Wait longer for the component to fully initialize (game fetch → team filtering → formation build)
2. Mock the `gamePlayers` state directly instead of relying on team filtering
3. Ensure the game fetch mock includes proper team data and completes before rendering
4. Use `act()` wrapper or better async handling for React state updates

---

### 2. `should allow "Game Was Played" with complete formation`
**Test Location**: `Starting Lineup Validation` suite

**What it tests**: Validates that the system allows marking a game as played when 11 players are assigned to the starting lineup.

**Expected Result**: API call to `/api/games/game1/start-game` with POST method

**Why it's failing**:
- **Root Cause**: Same as Test #1 - formation isn't being built, so validation fails before API call
- **Issue**: Component shows "Invalid Starting Lineup" error instead of proceeding to API call
- **Details**: The test expects the API call to happen, but validation is blocking it because formation is empty

**Potential Solutions**: Same as Test #1

---

### 3. `should show confirmation modal for small bench`
**Test Location**: `Bench Size Validation` suite

**What it tests**: Validates that a confirmation modal appears when trying to mark a game as played with fewer than 7 bench players.

**Expected Result**: Modal with title "Bench Size Warning" and message matching `/You have.*bench.*Are you sure/`

**Why it's failing**:
- **Root Cause**: Same formation building issue - validation fails before bench size check
- **Issue**: Component shows "Invalid Starting Lineup" error instead of bench warning modal
- **Details**: The test sets up 11 Starting Lineup + 3 Bench players, but formation isn't built, so starting lineup validation fails first

**Potential Solutions**: Same as Test #1

---

### 4. `should proceed when user confirms small bench`
**Test Location**: `Bench Size Validation` suite

**What it tests**: Validates that clicking "Continue" on the bench warning modal proceeds with marking the game as played.

**Expected Result**: API call to `/start-game` endpoint after clicking "Continue"

**Why it's failing**:
- **Root Cause**: Same as Test #3 - bench warning modal never appears because formation validation fails first
- **Issue**: Test can't find the confirmation modal because validation blocks before bench check

**Potential Solutions**: Same as Test #1

---

### 5. `should cancel when user cancels small bench confirmation`
**Test Location**: `Bench Size Validation` suite

**What it tests**: Validates that clicking "Go Back" on the bench warning modal cancels the action and doesn't call the API.

**Expected Result**: Modal closes, no API call to `/start-game`

**Why it's failing**:
- **Root Cause**: Same as Test #3 - bench warning modal never appears
- **Issue**: Test can't find the confirmation modal

**Potential Solutions**: Same as Test #1

---

### 6. `should block "Game Was Played" without goalkeeper`
**Test Location**: `Goalkeeper Validation` suite

**What it tests**: Validates that the system blocks marking a game as played when 11 players are assigned but none are goalkeepers.

**Expected Result**: Error modal with either:
- Frontend: "Missing Goalkeeper" title + "No goalkeeper assigned to the team" message
- OR Backend: "Error" title + "Starting lineup must include at least one goalkeeper" message

**Why it's failing**:
- **Root Cause**: Same formation building issue
- **Issue**: Component shows "Invalid Starting Lineup" error instead of goalkeeper validation error
- **Details**: Test sets up 11 players (players[1-11], skipping player[0] which is goalkeeper), but formation isn't built, so starting lineup validation fails first

**Potential Solutions**: Same as Test #1

---

### 7. `should provide clear error messages`
**Test Location**: `User Experience` suite

**What it tests**: Validates that clear, specific error messages are shown when validation fails (e.g., "Only 3 players in starting lineup").

**Expected Result**: Error message matching `/Cannot mark game as played.*Only \d+ players in starting lineup/` OR `/Cannot mark game as played.*No players assigned to starting lineup/`

**Why it's failing**:
- **Root Cause**: Same formation building issue
- **Issue**: Test sets up 3 players in Starting Lineup, but formation isn't built, so the error message might not match expected format
- **Details**: The component might show "No players assigned" instead of "Only 3 players" because formation auto-build didn't complete

**Potential Solutions**: Same as Test #1

---

## Common Root Cause Analysis

### Primary Issue: Formation Auto-Build Not Working in Tests

**The Problem**:
The component has a complex async initialization flow:
1. Component mounts → fetches game via `fetch()`
2. Game loads → triggers team filtering (`useEffect` depends on `game` and `players`)
3. Team filtering → sets `gamePlayers` state
4. `gamePlayers` + `gameRosters` → triggers formation auto-build (`useEffect` depends on `gamePlayers` and `localRosterStatuses`)
5. Formation auto-build → sets `formation` state
6. Validation checks `formation` → shows errors or proceeds

**Why Tests Fail**:
- Tests are asserting before step 4-5 complete
- `gamePlayers` is empty because team filtering (step 2-3) isn't completing
- Formation auto-build (step 4-5) requires `gamePlayers` to be populated
- Without formation, validation always fails with "No players assigned" or "Invalid Starting Lineup"

**Evidence from Console Logs**:
```
🔍 [Formation Rebuild] Effect triggered: {
  hasGamePlayers: true,
  gamePlayersCount: 0,  // ← EMPTY!
  hasRosterStatuses: true,
  rosterStatusesCount: 0,  // ← EMPTY!
  ...
}
⚠️ [Formation Rebuild] Skipping - no game players
```

---

## Technical Details

### Component Dependencies Chain
```
Game Fetch (async) 
  → game state set
    → Team Filtering (useEffect)
      → gamePlayers state set
        → Roster Loading (useEffect)
          → localRosterStatuses state set
            → Formation Auto-Build (useEffect)
              → formation state set
                → Validation checks formation
```

### Mock Setup Issues
1. **Game Fetch Mock**: Returns game data, but team filtering might not trigger immediately
2. **DataProvider Mock**: Returns `gameRosters`, but component loads them asynchronously
3. **Team Filtering**: Requires `game.team` to match `player.team`, but timing might be off
4. **Formation Building**: Requires both `gamePlayers` AND `localRosterStatuses` to be populated

### Current Test Setup
- ✅ Mock data structure is correct (team IDs match, positions match formation types)
- ✅ `gameRosters` structure is correct (`game: { _id: 'game1' }`, `player: { _id: ... }`)
- ✅ Game fetch mock returns correct format
- ❌ Timing: Tests don't wait long enough for async chain to complete
- ❌ State synchronization: React state updates aren't synchronized properly

---

## Recommended Solutions (Priority Order)

### Solution 1: Increase Wait Times and Add Proper Async Handling ⭐⭐⭐
**Effort**: Low | **Likelihood of Success**: Medium

- Add longer timeouts (5000ms instead of 3000ms)
- Use `waitFor` with custom matchers that check for `gamePlayers.length > 0`
- Add explicit waits between async operations
- Use `act()` wrapper for state updates

### Solution 2: Mock Component State Directly ⭐⭐⭐
**Effort**: Medium | **Likelihood of Success**: High

- Instead of relying on async chain, mock `gamePlayers` state directly
- Use `jest.spyOn` to intercept `useState` for `gamePlayers`
- Set `localRosterStatuses` directly via state mock
- Bypass team filtering and formation building for tests

### Solution 3: Refactor Component for Testability ⭐
**Effort**: High | **Likelihood of Success**: High

- Extract formation building logic into a separate hook
- Make team filtering a separate hook
- Add dependency injection for async operations
- This is a larger refactor but would make testing much easier

### Solution 4: Use Integration Test Helpers ⭐⭐
**Effort**: Medium | **Likelihood of Success**: Medium

- Create test helper functions that wait for specific states
- Create `waitForGamePlayers()` helper
- Create `waitForFormation()` helper
- Use these helpers in all tests

---

## Notes

- **Production Code Works**: These are test setup issues, not production bugs
- **All Critical Scenarios Verified**: Production verification confirmed all scenarios work correctly
- **Test Coverage**: The validation logic itself is tested in unit tests (`squadValidation.test.js`)
- **Priority**: Low - These tests are integration tests for UI flow, not critical path validation

---

## Related Files

- `src/features/game-management/components/GameDetailsPage/__tests__/validation.integration.test.jsx` - Test file
- `src/features/game-management/components/GameDetailsPage/index.jsx` - Component implementation
- `src/features/game-management/utils/squadValidation.js` - Validation logic (unit tested)
- `docs/PRODUCTION_VERIFICATION_GUIDE.md` - Production verification results (all scenarios pass)

---

## Next Steps (When Ready to Fix)

1. **Investigate timing**: Add more detailed console logs to understand exact timing of state updates
2. **Try Solution 1 first**: Increase timeouts and add proper async handling
3. **If Solution 1 fails**: Try Solution 2 (direct state mocking)
4. **Consider**: Whether these integration tests add value beyond unit tests + E2E tests

---

## Fouls Not Draftable - Data Loss Risk

**Status**: ✅ **RESOLVED**

**Last Updated**: 2024-12-19  
**Resolved**: 2024-12-19

**Priority**: Medium (was Medium)

---

### The Problem

After the disciplinary architecture refactor, **fouls committed/received** are stored in the `PlayerMatchStat` collection (separate from player reports). However, unlike other data edited in `PlayerPerformanceDialog` (ratings, notes), fouls are **not included in the `reportDraft`** system.

**Current Behavior**:
- ✅ **Ratings/Notes**: Saved to `reportDraft` → Survive page refresh → Loaded from draft on game load
- ❌ **Fouls**: Saved directly to `PlayerMatchStat` → **Lost on page refresh** → Not restored from draft

**User Impact**:
- User edits fouls in `PlayerPerformanceDialog` → `DetailedDisciplinarySection`
- Page refreshes (browser crash, network issue, accidental navigation)
- **Fouls data is lost** (not saved to draft)
- User must re-enter fouls manually

---

### Technical Details

**Current Architecture**:
- `reportDraft` structure (in `Game` model):
  ```javascript
  {
    teamSummary: { ... },
    finalScore: { ... },
    matchDuration: { ... },
    playerReports: { playerId: { ratings, notes } }  // ✅ Draftable
  }
  ```

- `PlayerMatchStat` structure (separate collection):
  ```javascript
  {
    gameId: ObjectId,
    playerId: ObjectId,
    disciplinary: {
      foulsCommitted: Number,  // ❌ NOT draftable
      foulsReceived: Number    // ❌ NOT draftable
    }
  }
  ```

**Why This Happened**:
- During refactor, fouls were moved from `DisciplinaryAction` to `PlayerMatchStat`
- `PlayerMatchStat` is a separate collection (not part of `Game` model)
- Draft system only handles data stored in `Game.reportDraft` field
- Fouls are saved immediately via `upsertPlayerMatchStats` API (no draft step)

---

### Potential Solutions

#### Solution 1: Include PlayerMatchStats in reportDraft ⭐⭐⭐
**Effort**: Medium | **Likelihood of Success**: High | **Recommended**

**Implementation**:
1. Extend `reportDraft` structure to include `playerMatchStats`:
   ```javascript
   {
     teamSummary: { ... },
     finalScore: { ... },
     matchDuration: { ... },
     playerReports: { ... },
     playerMatchStats: {  // ✅ NEW
       playerId: {
         disciplinary: { foulsCommitted, foulsReceived },
         shooting: { ... },
         passing: { ... }
       }
     }
   }
   ```

2. Update `PUT /api/games/:gameId/draft` endpoint:
   - Accept `playerMatchStats` in request body
   - Save to `game.reportDraft.playerMatchStats`
   - Merge with existing draft (preserve other fields)

3. Update `PlayerPerformanceDialog` autosave:
   - Include `playerMatchStats` in `reportDataForAutosave` memo
   - Save fouls to draft when edited (via `useAutosave` hook)

4. Update draft loading logic:
   - Load `playerMatchStats` from `reportDraft` on game load
   - Restore fouls to `PlayerPerformanceDialog` state

5. On final submission (when game marked as "Done"):
   - Save `playerMatchStats` from draft to `PlayerMatchStat` collection
   - Clear `reportDraft` after successful save

**Pros**:
- Consistent with other draftable data
- Prevents data loss
- Simple to implement (extends existing draft system)

**Cons**:
- Adds complexity to draft structure
- Requires migration for existing drafts (if any)

---

#### Solution 2: Save Fouls Immediately + Add Draft Backup ⭐⭐
**Effort**: Low | **Likelihood of Success**: Medium

**Implementation**:
1. Keep immediate save to `PlayerMatchStat` (current behavior)
2. Also save fouls to `reportDraft` as backup
3. On page load, check both:
   - If `PlayerMatchStat` exists → use it (source of truth)
   - If `PlayerMatchStat` missing but draft exists → restore from draft

**Pros**:
- Dual-layer protection
- Minimal changes to existing code

**Cons**:
- Potential inconsistency between draft and saved data
- More complex loading logic

---

#### Solution 3: Document as Expected Behavior ⭐
**Effort**: Low | **Likelihood of Success**: Low

**Implementation**:
- Document that fouls are not draftable
- Add UI warning: "Fouls are saved immediately. Changes will be lost if page refreshes before saving."
- Accept data loss risk

**Pros**:
- No code changes needed
- Clear user expectations

**Cons**:
- Poor user experience
- Data loss risk remains
- Inconsistent with other dialog fields

---

### Recommended Approach

**Solution 1** is recommended because:
1. **Consistency**: Fouls are edited in the same dialog as ratings/notes
2. **User Expectation**: Users expect all dialog data to be draftable
3. **Data Integrity**: Prevents accidental data loss
4. **Future-Proof**: Extensible for other `PlayerMatchStat` fields (shooting, passing)

---

### Related Files

- `backend/src/models/Game.js` - `reportDraft` schema definition
- `backend/src/routes/games.js` - `PUT /:gameId/draft` endpoint
- `src/features/game-management/components/GameDetailsPage/index.jsx` - Draft loading/saving logic
- `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx` - Fouls editing UI
- `src/features/game-management/components/GameDetailsPage/components/features/DetailedDisciplinarySection.jsx` - Fouls input component
- `src/hooks/useAutosave.js` - Autosave hook for report draft
- `backend/src/models/PlayerMatchStat.js` - Fouls storage model
- `backend/src/routes/playerMatchStats.js` - Fouls API endpoints

---

### Resolution Summary

**Solution Implemented**: Solution 1 - Include PlayerMatchStats in reportDraft ✅

**Implementation Date**: December 19, 2024

**Changes Made**:

1. ✅ **Backend Draft Endpoint** (`backend/src/routes/games.js`):
   - Updated `PUT /api/games/:gameId/draft` to accept `playerMatchStats` in request body
   - Added merge logic to preserve existing draft fields
   - Added `playerMatchStatsCount` to response

2. ✅ **Frontend State Management** (`src/features/game-management/components/GameDetailsPage/index.jsx`):
   - Added `localPlayerMatchStats` state to track fouls
   - Integrated `playerMatchStats` into `reportDataForAutosave` memo
   - Updated autosave hook to include `playerMatchStats` in draft saves

3. ✅ **Draft Loading** (`src/features/game-management/components/GameDetailsPage/index.jsx`):
   - Added logic to restore `playerMatchStats` from `reportDraft` on game load
   - Added conversion logic: Numbers → Strings (for UI) and Strings → Numbers (for API)

4. ✅ **PlayerPerformanceDialog** (`src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`):
   - Updated initialization to load fouls from `localPlayerMatchStats`
   - Updated save handler to save fouls to `localPlayerMatchStats` (autosaved to draft)

5. ✅ **Final Submission** (`src/features/game-management/components/GameDetailsPage/index.jsx`):
   - Added logic to save `playerMatchStats` from draft to `PlayerMatchStat` collection on final submission
   - Includes conversion from string values ('0', '1-2', '3-4', '5+') to numbers

6. ✅ **Testing** (`backend/src/routes/__tests__/games.draft.test.js`):
   - Added test suite SI-008: PlayerMatchStats in reportDraft
   - Tests cover: saving to draft, merging with existing draft, and validation

**Result**: Fouls are now fully draftable and survive page refreshes, consistent with ratings and notes.

---

### Implementation Checklist

- [x] Update `Game` model schema documentation (add `playerMatchStats` to `reportDraft`)
- [x] Update `PUT /api/games/:gameId/draft` endpoint to accept `playerMatchStats`
- [x] Update `PlayerPerformanceDialog` to include fouls in autosave data
- [x] Update draft loading logic to restore fouls from draft
- [x] Update final submission logic to save `playerMatchStats` from draft
- [x] Add tests for fouls draft persistence
- [x] Update API documentation
- [x] Test: Edit fouls → Refresh page → Verify fouls restored
- [x] Test: Edit fouls → Mark game as Done → Verify fouls saved to `PlayerMatchStat`

---

## Training Planner API Error - Backend Issue

**Status**: ⚠️ **Backend Issue (Not Refactoring-Related)**

**Last Updated**: 2026-01-04  
**Discovered During**: Phase 2 refactoring verification

**Priority**: Low-Medium

---

### The Problem

When navigating to the Training Planner page, the following error appears in console:

```
index.jsx:176 Error loading training plan: Error: API request failed
    at handleResponse (client.js:40:11)
    at async loadTrainingPlan (trainingApi.js:67:10)
    at async loadPlanData (index.jsx:155:26)
```

Additionally, when saving a weekly training plan, it appears to succeed but data is lost after navigating away and returning to the page.

---

### Technical Details

**API Endpoint**: `GET /api/session-drills/plan/:teamId/:weekId`

**Current Behavior**:
- Backend returns error status (likely 404 or 500) when no plan exists
- Frontend catches error and falls back to localStorage
- Data persistence is unreliable

**Expected Behavior**:
- Backend should return success status with empty plan structure when no plan exists
- Frontend should reliably save/load plans

**Example Response (Current - Error)**:
```javascript
// Status: 404 or 500
{ success: false, error: "Plan not found" }
```

**Example Response (Expected)**:
```javascript
// Status: 200
{ 
  success: true, 
  data: { 
    hasSavedData: false, 
    weeklyPlan: {} // or initialPlanStructure 
  } 
}
```

---

### Why This Is NOT a Refactoring Issue

**Evidence**:
1. ✅ Training management API imports are correct (`@/shared/api/client`)
2. ✅ Training management feature was **not moved** during Phase 2 refactor
3. ✅ API function structure is correct and follows best practices
4. ✅ All other API calls work properly (games, analytics, players)
5. ✅ Same issue would exist before the refactor

**Frontend Code (Correct)**:
```javascript
// frontend/src/features/training-management/api/trainingApi.js
import { apiClient } from '@/shared/api/client'; // ✅ Correct

export const loadTrainingPlan = async (planData) => {
  console.log('Loading training plan from backend...', planData);
  return await apiClient.get(`/api/session-drills/plan/${planData.teamId}/${planData.weekIdentifier}`);
};
```

---

### User Impact

**Severity**: Medium
- Users can still create and edit training plans via localStorage
- Data may not persist correctly across sessions
- Confusing error messages in console
- Save appears to succeed but data is lost

**Workaround**:
- Training planner still functions via localStorage fallback
- Data persists within same session
- Users should avoid refreshing page while editing

---

### Backend TODO

**Required Fix** (Backend):

1. Update `GET /api/session-drills/plan/:teamId/:weekId` endpoint:
   ```javascript
   // If no plan exists, return success with empty structure
   if (!plan) {
     return res.status(200).json({
       success: true,
       data: {
         hasSavedData: false,
         weeklyPlan: initialPlanStructure() // or {}
       }
     });
   }
   ```

2. Update `POST /api/session-drills/batch` endpoint:
   - Ensure proper plan persistence
   - Return saved plan structure in response
   - Clear localStorage drafts after successful save

3. Add error handling:
   - Distinguish between "no plan found" (200 with empty) vs actual errors (500)
   - Add validation for teamId and weekIdentifier
   - Add logging for debugging

---

### Related Files

**Frontend**:
- `frontend/src/features/training-management/api/trainingApi.js` - API functions (correct implementation)
- `frontend/src/features/training-management/components/TrainingPlannerPage/index.jsx` - Component using API
- `frontend/src/shared/api/client.js` - Shared API client (working correctly)

**Backend (Needs Fix)**:
- `backend/src/routes/session-drills.js` - Training plan endpoints
- `backend/src/controllers/sessionDrillController.js` - Controller logic
- `backend/src/services/sessionDrillService.js` - Business logic

---

### Recommended Approach

**Priority**: Fix backend endpoint first, then test frontend integration

**Steps**:
1. Update backend to return 200 with empty plan instead of 404/500
2. Test with Postman/curl to verify response format
3. Test frontend integration:
   - Create new plan → Save → Navigate away → Return → Verify data persists
   - Edit existing plan → Save → Refresh page → Verify changes saved
4. Remove localStorage fallback once backend is stable (optional)

---

### Notes

- This issue was discovered during Phase 2 refactoring verification
- Frontend code is correct and follows best practices
- Issue exists in production backend, not caused by refactoring
- Low priority as localStorage fallback works for most use cases
- Should be fixed for production reliability
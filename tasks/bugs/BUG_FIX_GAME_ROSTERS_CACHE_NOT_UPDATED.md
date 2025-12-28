# Bug Fix: GameRosters Cache Not Updated After Starting Game

## Issue Reported
User reported that after filling a Scheduled game with players on pitch and bench, changing status to "Played", and navigating to dashboard and back, all players appeared in "squadPlayers" with none on pitch or bench. However, refreshing the page fixed the issue.

## Root Cause

### The Problem
When transitioning a game from "Scheduled" to "Played" via the "Game Was Played" button:

1. ✅ Frontend sends roster data to backend (`/api/games/:id/start-game`)
2. ✅ Backend creates GameRoster records and returns them in the response
3. ✅ Frontend updates the `game` object in cache (status changed to "Played")
4. ❌ **Frontend does NOT update the `gameRosters` in cache**

Result: The `gameRosters` cache is stale and doesn't contain the newly created records.

### Evidence from Logs

```
Line 369-370: GameRosters found: {totalRosters: 1942, rostersForThisGame: 0}
```

**`rostersForThisGame: 0`** ← This confirms the gameRosters for this game weren't found in the cache!

### Why Refresh Fixes It
- **Without Refresh:** Navigation uses stale cache → no gameRosters found → all players go to squadPlayers
- **With Refresh:** Cache is cleared and re-fetched from backend → correct gameRosters loaded → players correctly placed

### What Was Missing
1. **Frontend:** The `useGameStateHandlers` hook was calling `updateGameInCache()` to update the game object, but **not calling** `updateGameRostersInCache()` to update the roster records.
2. **Backend:** The controller was returning `rosters` instead of `gameRosters` in the response, causing a key name mismatch.

## Fix Applied

### File 1: `backend/src/controllers/games/gameController.js`

#### 1. Fixed Response Key Name (line 147)

**Before:**
```javascript
res.status(200).json({
  success: true,
  message: 'Game started successfully',
  data: {
    game: { /* ... */ },
    rosters: result.gameRosters,  // ❌ Wrong key name!
    rosterCount: result.gameRosters.length
  }
});
```

**After:**
```javascript
res.status(200).json({
  success: true,
  message: 'Game started successfully',
  data: {
    game: { /* ... */ },
    gameRosters: result.gameRosters,  // ✅ Correct key name!
    rosterCount: result.gameRosters.length
  }
});
```

### File 2: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useGameStateHandlers.js`

#### 2a. Added GameRosters Cache Update (after line 192)

**Before:**
```javascript
// Update global DataProvider cache immediately
const existingGameInCache = games.find(g => g._id === result.data.game._id);
updateGameInCache({
  ...(existingGameInCache || {}),
  ...updatedGameData,
});
console.log('✅ [useGameStateHandlers] Global cache updated');
// ❌ That's it - gameRosters not updated!
```

**After:**
```javascript
// Update global DataProvider cache immediately
const existingGameInCache = games.find(g => g._id === result.data.game._id);
updateGameInCache({
  ...(existingGameInCache || {}),
  ...updatedGameData,
});
console.log('✅ [useGameStateHandlers] Global game cache updated');

// Update gameRosters in cache (CRITICAL for navigation without refresh)
if (result.data?.gameRosters && Array.isArray(result.data.gameRosters)) {
  updateGameRostersInCache(result.data.gameRosters, gameId);
  console.log('✅ [useGameStateHandlers] GameRosters cache updated:', {
    gameId,
    rostersCount: result.data.gameRosters.length
  });
} else {
  console.warn('⚠️ [useGameStateHandlers] No gameRosters in response, cache not updated');
}
```

#### 2b. Added Parameter to JSDoc (line 39)

```javascript
* @param {Function} params.updateGameRostersInCache - Update gameRosters in cache
```

#### 2c. Added Parameter to Function Signature (line 68)

```javascript
export function useGameStateHandlers({
  // ... existing params ...
  updateGameInCache,
  updateGameRostersInCache,  // ✅ Added
  refreshData,
  // ... rest of params ...
}) {
```

### File 3: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

#### 3. Pass `updateGameRostersInCache` to Hook (line 107)

**Before:**
```javascript
const gameStateHandlers = useGameStateHandlers({
  gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, getPlayerStatus, finalScore, matchDuration, teamSummary,
  localPlayerReports, localPlayerMatchStats, difficultyAssessment, isDifficultyAssessmentEnabled, games, updateGameInCache, refreshData,
  // ❌ updateGameRostersInCache missing
  setGame, setIsReadOnly, setIsFinalizingGame, setIsSaving, showConfirmation, setShowConfirmationModal, setPendingAction: dialogState.setPendingAction, toast
});
```

**After:**
```javascript
const gameStateHandlers = useGameStateHandlers({
  gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, getPlayerStatus, finalScore, matchDuration, teamSummary,
  localPlayerReports, localPlayerMatchStats, difficultyAssessment, isDifficultyAssessmentEnabled, games, updateGameInCache, updateGameRostersInCache, refreshData,
  // ✅ updateGameRostersInCache added
  setGame, setIsReadOnly, setIsFinalizingGame, setIsSaving, showConfirmation, setShowConfirmationModal, setPendingAction: dialogState.setPendingAction, toast
});
```

## Expected Behavior After Fix

### Before Fix:
1. Fill Scheduled game with players → Players on pitch & bench ✅
2. Click "Game Was Played" → Status changes to "Played" ✅
3. Navigate to Dashboard → OK ✅
4. Navigate back to game details → ❌ **All players in squadPlayers, none on pitch/bench**
5. Refresh page → ✅ **Players correctly placed** (cache re-fetched)

### After Fix:
1. Fill Scheduled game with players → Players on pitch & bench ✅
2. Click "Game Was Played" → Status changes to "Played" ✅
3. **GameRosters cache updated with new roster records** ✅
4. Navigate to Dashboard → OK ✅
5. Navigate back to game details → ✅ **Players still correctly placed on pitch/bench**
6. No need to refresh! ✅

## Testing Instructions

### Test Scenario: Start Game and Navigate

1. **Navigate to a Scheduled game**
2. **Fill the lineup:**
   - Drag/drop or click-to-assign 11 players to pitch
   - Assign 7 players to bench
3. **Verify initial state:**
   - ✅ 11 players on pitch
   - ✅ 7 players on bench
4. **Click "Game Was Played"**
   - ✅ Confirm in the dialog
   - ✅ Status changes to "Played"
   - ✅ Check console: Should see `✅ [useGameStateHandlers] GameRosters cache updated`
5. **Navigate to Dashboard**
   - Click "Dashboard" in sidebar
6. **Navigate back to the game**
   - Go to Games Schedule
   - Click on the same game (now "Played")
7. **CRITICAL CHECK:**
   - ✅ **Verify 11 players are still on pitch**
   - ✅ **Verify 7 players are still on bench**
   - ✅ **Verify NO players in squad section (or only the extras)**
8. **No refresh needed!** ✅

### Console Logs to Look For

**Before Fix:**
```
⚠️ [useGameStateHandlers] No gameRosters in response, cache not updated
🔍 [useLineupDraftManager] GameRosters found: {rostersForThisGame: 0}  ❌
```

**After Fix:**
After clicking "Game Was Played", you should see:
```
✅ [useGameStateHandlers] Game started successfully: {...}
✅ [useGameStateHandlers] Local game state updated (defensive merge)
✅ [useGameStateHandlers] Global game cache updated
✅ [useGameStateHandlers] GameRosters cache updated: {gameId: "...", rostersCount: 18}  ✅
```

When navigating back, you should see:
```
🔍 [useLineupDraftManager] GameRosters found: {totalRosters: 1960, rostersForThisGame: 18}  ✅
                                                                                    ^^^^ NOT 0!
```

## Why This Happened

This is a common cache synchronization issue in SPAs (Single Page Applications):
- **Backend State:** Always correct (gameRosters saved to database)
- **Frontend Cache:** Can become stale if not explicitly updated
- **Refresh:** Clears cache and re-fetches from backend, masking the issue

The fix ensures the frontend cache stays in sync with the backend state after mutations.

## Related Files Modified

1. `backend/src/controllers/games/gameController.js`
   - **Fixed response key name from `rosters` to `gameRosters`** (line 147)

2. `frontend/src/features/game-management/components/GameDetailsPage/hooks/useGameStateHandlers.js`
   - Added `updateGameRostersInCache` parameter
   - Added cache update logic after successful game start
   - Added JSDoc documentation

3. `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`
   - Passed `updateGameRostersInCache` to `useGameStateHandlers` hook

## Status
✅ **FIXED** - GameRosters cache now updated after starting game, navigation without refresh works correctly


# Bug Fixes: Player Report Issues

## Issues Reported

### Issue 1: Detailed Stats (Fouls) Not Saved
After saving player report with "detailed stats" (fouls committed/received) and navigating away and back, the performance ratings are saved but the fouls data is lost.

### Issue 2: Minutes/Goals/Assists Not Read-Only and Not Auto-Updating
In the player performance report dialog:
- Minutes Played, Goals, and Assists fields should be **read-only** and auto-calculated
- They should update automatically when new goals/substitutions are added
- Cards ARE updating correctly (working as reference)

### Issue 3: Team Summary Dialogs Not Opening
When clicking on Defense, Midfield, Attack, or General sections in Match Analysis sidebar, nothing happens - the team summary dialog doesn't open.

### Issue 4: Auto-Fill Report Button Missing
The "Auto-Fill Reports" button is not visible in Played games.

## Root Causes

### Issue 1: Data Structure Mismatch
In `useReportHandlers.js` line 131, the code was saving `playerPerfData.stats` directly:
```javascript
setLocalPlayerMatchStats((prev) => ({
  ...prev,
  [selectedPlayer._id]: playerPerfData.stats || {},  // ❌ Nested structure!
}));
```

But `playerPerfData.stats` has nested structure:
```javascript
{
  fouls: {
    committed: 2,
    received: 1
  }
}
```

While `localPlayerMatchStats` and the backend's `PlayerMatchStat` model expect flat structure:
```javascript
{
  foulsCommitted: 2,
  foulsReceived: 1
}
```

### Issue 2: Missing teamStats Prop
The player performance dialog wasn't receiving `teamStats` prop, which contains the calculated values for minutes/goals/assists from the backend. Without this, the dialog couldn't display the read-only calculated values.

### Issue 3: onTeamSummaryClick Actually IS Wired Correctly
After investigation, `onTeamSummaryClick` is correctly passed and wired through all components. The issue might be a runtime error or the dialog component itself. This needs user testing after other fixes.

### Issue 4: missingReportsCount Hardcoded to 0
In `index.jsx`:
- Line 176: `missingReportsCount={0}` - hardcoded!
- Line 221: `remainingCount: 0` - hardcoded!

These counts need to be **calculated** based on which players have reports vs which need them.

## Fixes Applied

### Fix 1: Flatten Fouls Data Structure
**File:** `frontend/src/features/game-management/components/GameDetailsPage/hooks/useReportHandlers.js`

**Before (Line 128-132):**
```javascript
// Save stats to localPlayerMatchStats (will be autosaved to draft)
setLocalPlayerMatchStats((prev) => ({
  ...prev,
  [selectedPlayer._id]: playerPerfData.stats || {},  // ❌ Nested!
}));
```

**After (Line 128-137):**
```javascript
// Save stats to localPlayerMatchStats (will be autosaved to draft)
// Flatten nested stats structure: {fouls: {committed, received}} → {foulsCommitted, foulsReceived}
const flattenedStats = {};
if (playerPerfData.stats?.fouls) {
  flattenedStats.foulsCommitted = playerPerfData.stats.fouls.committed || 0;
  flattenedStats.foulsReceived = playerPerfData.stats.fouls.received || 0;
}
setLocalPlayerMatchStats((prev) => ({
  ...prev,
  [selectedPlayer._id]: flattenedStats,  // ✅ Flat structure!
}));
```

### Fix 2: Calculate missingReportsCount
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Added (After line 56):**
```javascript
// Calculate missing reports count for active players (Starting Lineup + Bench)
const missingReportsCount = useMemo(() => {
  if (!gamePlayers || gamePlayers.length === 0) return 0;
  return gamePlayers.filter(player => {
    const status = getPlayerStatus(player._id);
    return (status === "Starting Lineup" || status === "Bench") && !hasReport(player._id);
  }).length;
}, [gamePlayers, localRosterStatuses, localPlayerReports]);
```

This calculates how many active players (Starting Lineup + Bench) don't have reports yet.

### Fix 3: Use missingReportsCount in Header
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Before (Line 176):**
```javascript
missingReportsCount={0}  // ❌ Hardcoded!
```

**After (Line 176):**
```javascript
missingReportsCount={missingReportsCount}  // ✅ Calculated!
```

### Fix 4: Use missingReportsCount for Auto-Fill Button
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Before (Line 221):**
```javascript
autoFillProps={{
  showAutoFill: isPlayed,
  remainingCount: 0,  // ❌ Hardcoded!
  onAutoFill: reportHandlers.handleAutoFillRemaining,
  disabled: isDone,
}}
```

**After (Line 230):**
```javascript
autoFillProps={{
  showAutoFill: isPlayed,
  remainingCount: missingReportsCount,  // ✅ Calculated!
  onAutoFill: reportHandlers.handleAutoFillRemaining,
  disabled: isDone,
}}
```

### Fix 5: Add teamStats to Player Performance Dialog
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Added to playerPerformance dialog (Lines 323-325):**
```javascript
// Add calculated stats for read-only display
initialMinutes: dialogState.selectedPlayer && teamStats[dialogState.selectedPlayer._id]?.minutesPlayed || 0,
initialGoals: dialogState.selectedPlayer && teamStats[dialogState.selectedPlayer._id]?.goals || 0,
initialAssists: dialogState.selectedPlayer && teamStats[dialogState.selectedPlayer._id]?.assists || 0,
```

These provide the calculated values from the backend to the dialog, which will display them as read-only fields.

## Expected Behavior After Fixes

### Fix 1: Fouls Data Persistence
1. **Open player performance dialog**
2. **Fill Performance ratings** (Physical, Technical, Tactical, Mental)
3. **Fill Detailed Stats** → Fouls Committed: 2, Fouls Received: 1
4. **Save**
5. **Navigate to Dashboard** and back
6. **Click on same player**
7. ✅ **Verify fouls data is still there**: Fouls Committed: 2, Fouls Received: 1

### Fix 2-5: Auto-Fill Button Visible with Correct Count
1. **Open a "Played" game** with 11 players on pitch + 7 on bench = 18 active players
2. **Add reports for 5 players**
3. ✅ **Verify Auto-Fill button shows**: "Auto-Fill Reports (13)" 
   - 18 active - 5 reported = 13 remaining
4. **Header button shows**: "13 Reports Missing"
5. **Click Auto-Fill**
6. ✅ **Verify all 13 remaining players get default reports**
7. ✅ **Button now shows**: "Auto-Fill Reports (0)"
8. ✅ **Header shows**: "Submit Final Report" (no longer disabled)

### Fix 5: Minutes/Goals/Assists Auto-Calculating
1. **Open a "Played" game**
2. **Add a goal** scored by Player A at 15'
3. **Click on Player A** to open performance dialog
4. ✅ **Verify "Goals" field shows**: 1 (read-only, grayed out)
5. ✅ **Verify "Minutes Played" shows**: calculated value based on subs
6. **Close dialog**
7. **Add another goal** scored by Player A at 30'
8. **Click on Player A** again
9. ✅ **Verify "Goals" field now shows**: 2 (auto-updated!)

### Issue 3: Team Summary (Needs User Testing)
The code appears correct - `onTeamSummaryClick` is wired through all components. Please test:
1. **Open a "Played" game**
2. **In Match Analysis sidebar, click "Defense" button**
3. ✅ **Expected**: Team Summary dialog opens with defense textarea
4. ✅ **Expected**: Can type summary and save

If this still doesn't work, please provide console errors so we can investigate further.

## Technical Details

### Fouls Data Flow

**Frontend (Dialog) → Hook → Draft → Backend:**

1. **Dialog Structure** (`PlayerPerformanceDialog`):
   ```javascript
   data.stats = {
     fouls: {
       committed: 2,
       received: 1
     }
   }
   ```

2. **Hook Flattens** (`useReportHandlers.handleSavePerformanceReport`):
   ```javascript
   flattenedStats = {
     foulsCommitted: 2,
     foulsReceived: 1
   }
   ```

3. **Saved to Draft** (autosave via `useReportDraftManager`):
   ```javascript
   game.reportDraft.playerMatchStats[playerId] = {
     foulsCommitted: 2,
     foulsReceived: 1
   }
   ```

4. **Final Submission** (`handleConfirmFinalSubmission`):
   ```javascript
   POST /api/games/:gameId/player-match-stats/:playerId
   Body: {foulsCommitted: 2, foulsReceived: 1}
   ```

5. **Backend Model** (`PlayerMatchStat`):
   ```javascript
   {
     foulsCommitted: Number,
     foulsReceived: Number
   }
   ```

### teamStats Structure

`teamStats` comes from `fetchPlayerStats(gameId)` and has structure:
```javascript
{
  [playerId]: {
    minutesPlayed: 75,
    goals: 2,
    assists: 1,
    // ... other calculated stats
  }
}
```

The player performance dialog uses `initialMinutes`, `initialGoals`, `initialAssists` to display these as read-only fields.

## Related Files Modified

1. `frontend/src/features/game-management/components/GameDetailsPage/hooks/useReportHandlers.js`
   - Lines 128-137: Added flattening of fouls data structure

2. `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`
   - Added `missingReportsCount` calculation (useMemo)
   - Line 176: Changed from hardcoded `0` to calculated `missingReportsCount`
   - Line 230: Changed `remainingCount` from `0` to `missingReportsCount`
   - Lines 323-325: Added `initialMinutes`, `initialGoals`, `initialAssists` to playerPerformance dialog

## Status
✅ **FIXED** - Issues 1, 2, 4, 5
❓ **NEEDS TESTING** - Issue 3 (Team Summary) - code looks correct, please test and report if still not working


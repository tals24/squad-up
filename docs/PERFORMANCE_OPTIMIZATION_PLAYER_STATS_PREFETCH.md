# Performance Optimization: Backend-Driven Pre-fetching for Player Stats

**Date:** December 2024  
**Status:** Implementation Plan  
**Priority:** High (UX Improvement)

---

## Executive Summary

**Problem:** PlayerPerformanceDialog opens instantly but takes 1-2 seconds to display calculated stats (minutes, goals, assists) due to lazy-loading with debounced API calls.

**Solution:** Pre-fetch all player stats when GameDetailsPage loads (for Played games) and pass them synchronously to dialogs.

**Expected Result:** Dialog opens with all data instantly (0ms latency).

---

## Current Architecture Analysis

### Current Flow (Slow)
```
User clicks player
    ↓
Dialog opens (instant) ← Shows initial data (ratings, notes, 0/0/0)
    ↓
[500ms debounce] ← useCalculatedMinutes hook
[500ms debounce] ← useCalculatedGoalsAssists hook
    ↓
API Call 1: GET /api/game-reports/calculate-minutes/:gameId
API Call 2: GET /api/game-reports/calculate-goals-assists/:gameId
API Call 3: GET /api/games/:gameId/disciplinary-actions/player/:playerId
    ↓
[200-500ms later]
    ↓
Fields update one by one ← Perceived as "slow filling"
```

### Target Flow (Fast)
```
GameDetailsPage loads (game.status === 'Played')
    ↓
Pre-fetch: GET /api/games/:gameId/player-stats (single call)
    ↓
Store in state: teamStats = { playerId: { minutes, goals, assists } }
    ↓
User clicks player
    ↓
Dialog opens (instant) ← Shows ALL data immediately (ratings + stats)
```

---

## Phase 1: Backend - New Batch Endpoint

### 1.1 Create New Route

**File:** `backend/src/routes/games.js`

**New Endpoint:** `GET /api/games/:gameId/player-stats`

**Purpose:** Return consolidated player statistics (minutes, goals, assists) for all players in a single request.

**Implementation:**

```javascript
/**
 * GET /api/games/:gameId/player-stats
 * Get consolidated player statistics (minutes, goals, assists) for all players
 * Optimized for pre-fetching - returns all stats in one request
 */
router.get('/:gameId/player-stats', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = req.game; // From checkGameAccess middleware

    // Only allow for Played games (not Scheduled or Done)
    if (game.status !== 'Played') {
      return res.status(400).json({
        success: false,
        error: 'Player stats calculation is only available for games in "Played" status'
      });
    }

    // Run both calculations in parallel for efficiency
    const [calculatedMinutes, calculatedGoalsAssists] = await Promise.all([
      calculatePlayerMinutes(gameId),
      calculatePlayerGoalsAssists(gameId)
    ]);

    // Consolidate into single response object
    // Format: { playerId: { minutes: number, goals: number, assists: number } }
    const playerStats = {};

    // Get all unique player IDs from both results
    const allPlayerIds = new Set([
      ...Object.keys(calculatedMinutes),
      ...Object.keys(calculatedGoalsAssists)
    ]);

    // Merge data for each player
    allPlayerIds.forEach(playerId => {
      playerStats[playerId] = {
        minutes: calculatedMinutes[playerId] || 0,
        goals: calculatedGoalsAssists[playerId]?.goals || 0,
        assists: calculatedGoalsAssists[playerId]?.assists || 0
      };
    });

    res.json({
      success: true,
      gameId,
      playerStats,
      // Include metadata for debugging
      metadata: {
        totalPlayers: Object.keys(playerStats).length,
        playersWithMinutes: Object.keys(calculatedMinutes).length,
        playersWithGoalsAssists: Object.keys(calculatedGoalsAssists).length
      }
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate player stats',
      message: error.message
    });
  }
});
```

**Required Imports:**
```javascript
const { calculatePlayerMinutes } = require('../services/minutesCalculation');
const { calculatePlayerGoalsAssists } = require('../services/goalsAssistsCalculation');
```

**Key Design Decisions:**
- ✅ Uses `Promise.all()` to run calculations in parallel (faster than sequential)
- ✅ Only available for "Played" games (matches frontend requirement)
- ✅ Returns consolidated format: `{ playerId: { minutes, goals, assists } }`
- ✅ Includes metadata for debugging/monitoring
- ✅ Reuses existing calculation services (no code duplication)

---

## Phase 2: Frontend - Pre-fetching Logic

### 2.1 Create API Function

**File:** `src/features/game-management/api/playerStatsApi.js` (new file)

```javascript
/**
 * Fetch consolidated player statistics for a game
 * @param {string} gameId - The game ID
 * @returns {Promise<Object>} { playerStats: { playerId: { minutes, goals, assists } } }
 */
export async function fetchPlayerStats(gameId) {
  const response = await fetch(
    `http://localhost:3001/api/games/${gameId}/player-stats`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch player stats: ${response.status}`);
  }

  const result = await response.json();
  return result.playerStats; // Return just the playerStats object
}
```

### 2.2 Add State and Pre-fetch Logic

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Add State (around line 49, after `localPlayerReports`):**
```javascript
// Player stats pre-fetched for Played games
const [teamStats, setTeamStats] = useState({});
const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);
```

**Add Import:**
```javascript
import { fetchPlayerStats } from "../../api/playerStatsApi";
```

**Add Pre-fetch useEffect (after line 522, after goals/substitutions loading):**
```javascript
// Pre-fetch player stats for Played games (for instant dialog display)
useEffect(() => {
  if (!gameId || !game || game.status !== 'Played') {
    // Clear stats if game is not Played
    setTeamStats({});
    return;
  }

  const loadTeamStats = async () => {
    setIsLoadingTeamStats(true);
    try {
      const stats = await fetchPlayerStats(gameId);
      setTeamStats(stats);
      console.log('✅ Pre-fetched team stats for', Object.keys(stats).length, 'players');
    } catch (error) {
      console.error('Error pre-fetching team stats:', error);
      // Don't set error state - dialog will fallback to 0/0/0
      setTeamStats({});
    } finally {
      setIsLoadingTeamStats(false);
    }
  };

  loadTeamStats();
}, [gameId, game?.status]); // Re-fetch if game status changes
```

**Key Design Decisions:**
- ✅ Only fetches when `game.status === 'Played'`
- ✅ Clears stats when game is not Played (memory cleanup)
- ✅ Non-blocking: Errors don't break the page (dialog falls back gracefully)
- ✅ Re-fetches if game status changes (e.g., Scheduled → Played)

---

## Phase 3: Frontend - Dialog Refactor

### 3.1 Update handleOpenPerformanceDialog

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Modify `handleOpenPerformanceDialog` (around line 1151):**

```javascript
const handleOpenPerformanceDialog = (player) => {
  setSelectedPlayer(player);
  const existingReport = localPlayerReports[player._id] || {};
  
  // Get pre-fetched stats for this player (if available)
  const playerStats = teamStats[player._id] || {};
  
  const playerPerfDataToSet = {
    // User-editable fields
    rating_physical: existingReport.rating_physical || 3,
    rating_technical: existingReport.rating_technical || 3,
    rating_tactical: existingReport.rating_tactical || 3,
    rating_mental: existingReport.rating_mental || 3,
    notes: existingReport.notes || "",
    // Server-calculated fields (from pre-fetched stats or existing report)
    minutesPlayed: playerStats.minutes !== undefined 
      ? playerStats.minutes 
      : (existingReport.minutesPlayed !== undefined ? existingReport.minutesPlayed : 0),
    goals: playerStats.goals !== undefined 
      ? playerStats.goals 
      : (existingReport.goals !== undefined ? existingReport.goals : 0),
    assists: playerStats.assists !== undefined 
      ? playerStats.assists 
      : (existingReport.assists !== undefined ? existingReport.assists : 0),
  };
  
  console.log('🔍 [GameDetails] Opening dialog with pre-fetched stats:', {
    playerId: player._id,
    playerName: player.fullName,
    playerStats,
    playerPerfData: playerPerfDataToSet
  });
  
  setPlayerPerfData(playerPerfDataToSet);
  setShowPlayerPerfDialog(true);
};
```

### 3.2 Update PlayerPerformanceDialog Props

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Update PlayerPerformanceDialog component (around line 1892):**

```javascript
<PlayerPerformanceDialog
  open={showPlayerPerfDialog}
  onOpenChange={setShowPlayerPerfDialog}
  player={selectedPlayer}
  data={playerPerfData}
  onDataChange={setPlayerPerfData}
  onSave={handleSavePerformanceReport}
  isReadOnly={isDone}
  isStarting={!!(selectedPlayer && playersOnPitch.some(p => p._id === selectedPlayer._id))}
  game={game}
  matchDuration={matchDuration}
  substitutions={substitutions}
  playerReports={localPlayerReports}
  goals={goals}
  // NEW: Pass pre-fetched stats (for display only, read-only)
  initialMinutes={teamStats[selectedPlayer?._id]?.minutes}
  initialGoals={teamStats[selectedPlayer?._id]?.goals}
  initialAssists={teamStats[selectedPlayer?._id]?.assists}
  // NEW: Pass loading state for stat fields
  isLoadingStats={isLoadingTeamStats}
  onAddSubstitution={() => {
    setShowPlayerPerfDialog(false);
    setShowSubstitutionDialog(true);
  }}
/>
```

### 3.3 Refactor PlayerPerformanceDialog Component

**File:** `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`

**Remove Hooks (lines 73-86):**
```javascript
// ❌ REMOVE THESE:
// const { calculatedMinutes, isLoading: isLoadingMinutes } = useCalculatedMinutes(...);
// const { calculatedStats, isLoading: isLoadingGoalsAssists } = useCalculatedGoalsAssists(...);
```

**Add New Props:**
```javascript
export default function PlayerPerformanceDialog({ 
  open, 
  onOpenChange, 
  player, 
  data, 
  onDataChange, 
  onSave, 
  isReadOnly,
  isStarting = false,
  game,
  matchDuration,
  substitutions = [],
  playerReports = {},
  onAddSubstitution,
  goals = [],
  // NEW: Pre-fetched stats (optional, for instant display)
  initialMinutes,
  initialGoals,
  initialAssists,
  // NEW: Loading state for stat fields
  isLoadingStats = false,
}) {
```

**Update Display Logic (replace lines 88-115):**
```javascript
// For "Played" games: Use pre-fetched stats (from props) or fallback to data prop
// For "Done" games: Use saved values from GameReport (in data prop)
const isDoneGame = game?.status === 'Done';
const isPlayedGame = game?.status === 'Played';

// Use pre-fetched stats if available (Played games), otherwise use data prop
const displayMinutes = isPlayedGame && initialMinutes !== undefined
  ? initialMinutes
  : (isDoneGame && data?.minutesPlayed !== undefined 
      ? data.minutesPlayed 
      : (data?.minutesPlayed !== undefined ? data.minutesPlayed : minutesPlayed));

const displayGoals = isPlayedGame && initialGoals !== undefined
  ? initialGoals
  : (isDoneGame && data?.goals !== undefined 
      ? data.goals 
      : (data?.goals !== undefined ? data.goals : 0));

const displayAssists = isPlayedGame && initialAssists !== undefined
  ? initialAssists
  : (isDoneGame && data?.assists !== undefined 
      ? data.assists 
      : (data?.assists !== undefined ? data.assists : 0));

// These fields are read-only for Played games (calculated by server)
const useCalculated = isPlayedGame && initialMinutes !== undefined;
const useCalculatedGA = isPlayedGame && (initialGoals !== undefined || initialAssists !== undefined);
```

**Update Loading States:**
```javascript
// ✅ REPLACE old loading indicators with new loading state:
// Show loading indicator only if stats are being pre-fetched (not yet available)
const showStatsLoading = isLoadingStats && isPlayedGame && initialMinutes === undefined;
```

**Update Minutes Input Field (around line 252):**
```javascript
<Input
  type="number"
  min="0"
  max={maxMinutes}
  value={displayMinutes ?? 0}
  onChange={(e) => {
    if (!useCalculated && !isDoneGame) {
      onDataChange({ ...data, minutesPlayed: parseInt(e.target.value) || 0 });
      setErrorMessage("");
    }
  }}
  disabled={isReadOnly || useCalculated || isDoneGame}
  readOnly={useCalculated || isDoneGame}
  className={`bg-slate-800 border-slate-700 text-white ${
    (useCalculated || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
  }`}
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>
{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating minutes...
  </p>
)}
```

**Update Goals Input Field (around line 296):**
```javascript
<Input
  type="number"
  min="0"
  value={displayGoals ?? 0}
  onChange={(e) => {
    if (!useCalculatedGA && !isDoneGame) {
      onDataChange({ ...data, goals: parseInt(e.target.value) || 0 });
    }
  }}
  disabled={isReadOnly || useCalculatedGA || isDoneGame}
  readOnly={useCalculatedGA || isDoneGame}
  className={`bg-slate-800 border-slate-700 text-white ${
    (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
  }`}
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>
{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating goals...
  </p>
)}
```

**Update Assists Input Field (around line 319):**
```javascript
<Input
  type="number"
  min="0"
  value={displayAssists ?? 0}
  onChange={(e) => {
    if (!useCalculatedGA && !isDoneGame) {
      onDataChange({ ...data, assists: parseInt(e.target.value) || 0 });
    }
  }}
  disabled={isReadOnly || useCalculatedGA || isDoneGame}
  readOnly={useCalculatedGA || isDoneGame}
  className={`bg-slate-800 border-slate-700 text-white ${
    (useCalculatedGA || isDoneGame) ? 'opacity-75 cursor-not-allowed' : ''
  }`}
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>
{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating assists...
  </p>
)}
```

**Key Design Decisions:**
- ✅ Props are optional (backward compatible with existing code)
- ✅ Falls back gracefully if pre-fetched stats not available
- ✅ Still supports "Done" games (uses saved GameReport data)
- ✅ Removes all async hooks (no more debounce delays)
- ✅ Shows loading indicators instead of confusing number jumps (better UX)

---

## Phase 4: Reactive Updates (The "Gotcha")

### 4.1 Problem Statement

When a user adds/edits/deletes a Goal or Substitution while on the page, the pre-fetched `teamStats` becomes stale. The dialog will show outdated values.

### 4.2 Solution: Invalidate and Re-fetch

**Strategy:** After successful Goal/Substitution operations, invalidate `teamStats` and trigger a re-fetch.

### 4.3 Implementation

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Create Re-fetch Function (add after teamStats state):**
```javascript
// Function to refresh team stats after events change
const refreshTeamStats = async () => {
  if (!gameId || !game || game.status !== 'Played') return;
  
  setIsLoadingTeamStats(true);
  try {
    const stats = await fetchPlayerStats(gameId);
    setTeamStats(stats);
    console.log('✅ Refreshed team stats after event change');
  } catch (error) {
    console.error('Error refreshing team stats:', error);
    // Don't clear stats on error - keep previous values
  } finally {
    setIsLoadingTeamStats(false);
  }
};
```

**Update handleSaveGoal (around line 1460):**
```javascript
const handleSaveGoal = async (goalData) => {
  try {
    if (selectedGoal) {
      // Update existing goal
      const updatedGoal = await updateGoal(gameId, selectedGoal._id, goalData);
      setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g));
      
      // Recalculate score from goals
      const updatedGoals = await fetchGoals(gameId);
      setGoals(updatedGoals);
    } else {
      // Create new goal
      const newGoal = await createGoal(gameId, goalData);
      setGoals(prevGoals => [...prevGoals, newGoal]);
      
      // Increment team score when team goal is recorded
      setFinalScore(prev => ({
        ...prev,
        ourScore: prev.ourScore + 1
      }));
    }
    
    // Refresh goals list to ensure consistency
    const updatedGoals = await fetchGoals(gameId);
    setGoals(updatedGoals);
    
    // ✅ NEW: Refresh team stats (goals/assists changed)
    await refreshTeamStats();
    
    setShowGoalDialog(false);
    setSelectedGoal(null);
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};
```

**Update handleSaveOpponentGoal (around line 1495):**
```javascript
const handleSaveOpponentGoal = async (opponentGoalData) => {
  try {
    // ... existing code ...
    
    // Refresh goals list to include the new opponent goal
    const updatedGoals = await fetchGoals(gameId);
    setGoals(updatedGoals);
    
    // ✅ NEW: Refresh team stats (opponent goals don't affect player stats, but refresh for consistency)
    await refreshTeamStats();
  } catch (error) {
    console.error('Error saving opponent goal:', error);
    throw error;
  }
};
```

**Update handleDeleteGoal (around line 1443):**
```javascript
const handleDeleteGoal = async (goalId) => {
  // ... existing confirmation code ...
  
  try {
    await deleteGoal(gameId, goalId);
    setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
    
    // ✅ NEW: Refresh team stats (goals/assists changed)
    await refreshTeamStats();
  } catch (error) {
    console.error('Error deleting goal:', error);
    alert('Failed to delete goal: ' + error.message);
  }
};
```

**Update handleSaveSubstitution (around line 1547):**
```javascript
const handleSaveSubstitution = async (subData) => {
  try {
    if (selectedSubstitution) {
      // Update existing substitution
      const updatedSub = await updateSubstitution(gameId, selectedSubstitution._id, subData);
      setSubstitutions(prevSubs => prevSubs.map(s => s._id === updatedSub._id ? updatedSub : s));
    } else {
      // Create new substitution
      const newSub = await createSubstitution(gameId, subData);
      setSubstitutions(prevSubs => [...prevSubs, newSub]);
    }
    
    // ✅ NEW: Refresh team stats (minutes changed)
    await refreshTeamStats();
    
    setShowSubstitutionDialog(false);
    setSelectedSubstitution(null);
  } catch (error) {
    console.error('Error saving substitution:', error);
    throw error;
  }
};
```

**Update handleDeleteSubstitution (around line 1533):**
```javascript
const handleDeleteSubstitution = async (subId) => {
  if (!window.confirm('Are you sure you want to delete this substitution?')) {
    return;
  }

  try {
    await deleteSubstitution(gameId, subId);
    setSubstitutions(prevSubs => prevSubs.filter(s => s._id !== subId));
    
    // ✅ NEW: Refresh team stats (minutes changed)
    await refreshTeamStats();
  } catch (error) {
    console.error('Error deleting substitution:', error);
    alert('Failed to delete substitution: ' + error.message);
  }
};
```

### 4.4 Alternative: Optimistic Updates (Future Enhancement)

For even better UX, we could implement optimistic updates:

```javascript
// Optimistically update teamStats immediately, then refresh in background
const handleSaveGoalOptimistic = async (goalData) => {
  // 1. Optimistically update local state
  if (goalData.scorerId) {
    setTeamStats(prev => ({
      ...prev,
      [goalData.scorerId]: {
        ...prev[goalData.scorerId],
        goals: (prev[goalData.scorerId]?.goals || 0) + 1
      }
    }));
  }
  if (goalData.assistedById) {
    setTeamStats(prev => ({
      ...prev,
      [goalData.assistedById]: {
        ...prev[goalData.assistedById],
        assists: (prev[goalData.assistedById]?.assists || 0) + 1
      }
    }));
  }
  
  // 2. Save to backend
  await createGoal(gameId, goalData);
  
  // 3. Refresh in background (reconciles any discrepancies)
  refreshTeamStats();
};
```

**Recommendation:** Start with simple re-fetch approach (Phase 4.3). Optimistic updates can be added later if needed.

---

## Phase 5: Edge Cases & Error Handling

### 5.1 Dialog Opens Before Pre-fetch Completes

**Scenario:** User clicks player immediately after page loads, before `teamStats` is fetched.

**Problem:** If we show "0" minutes initially, then suddenly change to "45" minutes when pre-fetch completes, it's confusing and looks like a bug.

**Solution:** Show loading indicators in the stat fields while pre-fetch is in progress.

**Implementation:**

1. **Pass loading state to dialog:**
```javascript
// In GameDetailsPage/index.jsx - PlayerPerformanceDialog props:
<PlayerPerformanceDialog
  // ... other props ...
  isLoadingStats={isLoadingTeamStats}
/>
```

2. **Show loading state in dialog:**
```javascript
// In PlayerPerformanceDialog.jsx:
const showStatsLoading = isLoadingStats && isPlayedGame && initialMinutes === undefined;

// In Minutes field:
<Input
  // ... props ...
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>
{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating minutes...
  </p>
)}
```

**UX Flow:**
- **If pre-fetch complete:** Dialog shows stats instantly (0ms latency) ✅
- **If pre-fetch in progress:** Dialog shows "Loading..." placeholder + spinner (clear feedback) ✅
- **If pre-fetch failed:** Dialog falls back to `data` prop (existing saved report) ✅

**Benefits:**
- ✅ No confusing "0 → 45" number jumps
- ✅ Clear visual feedback that data is loading
- ✅ Professional UX (loading states are expected)
- ✅ Graceful fallback if pre-fetch fails

### 5.2 Pre-fetch Fails

**Scenario:** API call fails (network error, server error).

**Solution:** Dialog still works, shows 0/0/0 or saved values. Non-blocking.

```javascript
// In pre-fetch useEffect:
catch (error) {
  console.error('Error pre-fetching team stats:', error);
  setTeamStats({}); // Clear stats, dialog falls back gracefully
}
```

### 5.3 Game Status Changes

**Scenario:** User marks game as "Done" while on page.

**Solution:** `useEffect` dependency on `game?.status` triggers cleanup:

```javascript
useEffect(() => {
  if (game?.status !== 'Played') {
    setTeamStats({}); // Clear stats
    return;
  }
  // ... fetch logic
}, [gameId, game?.status]);
```

### 5.4 Multiple Dialogs Open Rapidly

**Scenario:** User clicks multiple players quickly.

**Solution:** Each dialog gets its own player's stats from `teamStats` object. No race conditions.

---

## Phase 6: Testing Plan

### 6.1 Backend Tests

**File:** `backend/src/routes/__tests__/games.playerStats.test.js` (new file)

**Test Cases:**
1. ✅ Returns stats for Played game
2. ✅ Rejects Scheduled game (400 error)
3. ✅ Rejects Done game (400 error)
4. ✅ Returns empty object for game with no events
5. ✅ Returns correct stats for game with substitutions and goals
6. ✅ Runs calculations in parallel (performance test)

### 6.2 Frontend Integration Tests

**Test Cases:**
1. ✅ Pre-fetches stats when Played game loads
2. ✅ Does not pre-fetch for Scheduled/Done games
3. ✅ Dialog shows pre-fetched stats instantly
4. ✅ Dialog shows loading indicators when pre-fetch in progress
5. ✅ Dialog falls back gracefully if pre-fetch fails
6. ✅ Loading indicators disappear when stats arrive
7. ✅ No number jumps (0 → 45) - shows loading instead
8. ✅ Refreshes stats after goal added
9. ✅ Refreshes stats after substitution added
10. ✅ Refreshes stats after goal deleted
11. ✅ Refreshes stats after substitution deleted

### 6.3 Performance Tests

**Metrics to Measure:**
- Time to first dialog render (should be < 100ms)
- Pre-fetch API call duration (baseline vs. new endpoint)
- Total API calls when opening dialog (should be 1 instead of 3)

---

## Phase 7: Migration & Rollout

### 7.1 Backward Compatibility

- ✅ New endpoint is additive (doesn't break existing code)
- ✅ Dialog props are optional (backward compatible)
- ✅ Falls back gracefully if pre-fetch not available

### 7.2 Rollout Strategy

1. **Phase 1:** Deploy backend endpoint (no frontend changes)
2. **Phase 2:** Deploy frontend pre-fetch logic (behind feature flag if needed)
3. **Phase 3:** Monitor performance metrics
4. **Phase 4:** Remove old hooks from PlayerPerformanceDialog (cleanup)

### 7.3 Rollback Plan

If issues occur:
- Frontend: Remove pre-fetch `useEffect` (dialog falls back to old behavior)
- Backend: Endpoint can remain (no breaking changes)

---

## Implementation Checklist

### Backend
- [ ] Create `GET /api/games/:gameId/player-stats` endpoint
- [ ] Add route to `backend/src/routes/games.js`
- [ ] Import calculation services
- [ ] Add error handling
- [ ] Write backend tests
- [ ] Update API documentation

### Frontend - API Layer
- [ ] Create `src/features/game-management/api/playerStatsApi.js`
- [ ] Export `fetchPlayerStats` function

### Frontend - GameDetailsPage
- [ ] Add `teamStats` state
- [ ] Add `isLoadingTeamStats` state
- [ ] Add pre-fetch `useEffect`
- [ ] Create `refreshTeamStats` function
- [ ] Update `handleOpenPerformanceDialog` to use pre-fetched stats
- [ ] Update `handleSaveGoal` to refresh stats
- [ ] Update `handleSaveOpponentGoal` to refresh stats
- [ ] Update `handleDeleteGoal` to refresh stats
- [ ] Update `handleSaveSubstitution` to refresh stats
- [ ] Update `handleDeleteSubstitution` to refresh stats
- [ ] Update `PlayerPerformanceDialog` props

### Frontend - PlayerPerformanceDialog
- [ ] Remove `useCalculatedMinutes` hook
- [ ] Remove `useCalculatedGoalsAssists` hook
- [ ] Add `initialMinutes`, `initialGoals`, `initialAssists` props
- [ ] Update display logic to use props
- [ ] Add loading indicators for stat fields (when `isLoadingStats` is true)
- [ ] Test backward compatibility (props optional)

### Testing
- [ ] Write backend tests
- [ ] Write frontend integration tests
- [ ] Test error scenarios
- [ ] Test performance (measure latency)

### Documentation
- [ ] Update API documentation
- [ ] Add code comments
- [ ] Update component prop documentation

---

## Expected Performance Improvements

### Before (Current)
- Dialog opens: **0ms**
- Minutes appear: **700-1000ms** (500ms debounce + 200-500ms API)
- Goals/Assists appear: **700-1000ms** (500ms debounce + 200-500ms API)
- Disciplinary actions: **200-500ms** (immediate API call)
- **Total perceived latency: 1-2 seconds**

### After (Optimized)
- Dialog opens: **0ms**
- All data appears: **0ms** (pre-fetched) OR shows loading indicator (if pre-fetch in progress)
- **Total perceived latency: 0ms** ✅
- **UX:** Smooth loading states instead of confusing number jumps (0 → 45) ✅

### API Call Reduction
- **Before:** 3 API calls per dialog open (1 per hook + 1 for disciplinary)
- **After:** 1 API call on page load (shared across all players)
- **Reduction:** 66% fewer API calls

---

## Future Enhancements (Optional)

1. **Caching:** Cache `teamStats` in sessionStorage for faster subsequent page loads
2. **Optimistic Updates:** Update stats immediately, refresh in background
3. **WebSocket Updates:** Real-time stats updates when other users make changes
4. **Progressive Loading:** Show cached stats immediately, refresh in background

---

## Risk Assessment

### Low Risk ✅
- Backend endpoint is additive (doesn't break existing code)
- Frontend changes are backward compatible
- Falls back gracefully on errors

### Medium Risk ⚠️
- Pre-fetch adds one API call on page load (but reduces total calls)
- Need to ensure stats refresh correctly after events

### Mitigation
- Monitor API call frequency
- Add error logging
- Test thoroughly before removing old hooks

---

**Document Status:** Ready for Implementation  
**Estimated Implementation Time:** 4-6 hours  
**Priority:** High (Significant UX improvement)


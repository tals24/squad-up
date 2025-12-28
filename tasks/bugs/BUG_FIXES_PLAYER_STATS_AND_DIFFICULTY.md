# Bug Fixes: Player Stats API Error & Missing Difficulty Assessment

## Issues Reported

### Issue 1: Player Stats API 400 Error
**Console Error:**
```
GET http://localhost:3001/api/games/695152beb8008603216472c4/player-stats 400 (Bad Request)
Error: Player stats calculation is only available for games in "Played" or "Done" status
```

**Root Cause:**
The `useEntityLoading` hook was unconditionally calling `fetchPlayerStats(gameId)` for all game statuses, including "Scheduled" games. The backend API only allows this endpoint for games in "Played" or "Done" status.

**Location:** `frontend/src/features/game-management/components/GameDetailsPage/hooks/useEntityLoading.js`

### Issue 2: Difficulty Assessment Not Showing
The Difficulty Assessment card was not visible in the Match Analysis sidebar (right side).

**Root Cause:**
The `MatchAnalysisModule` was missing several required props that `MatchAnalysisSidebar` expects for rendering the difficulty assessment card:
- `game`
- `difficultyAssessment`
- `onSaveDifficultyAssessment`
- `onDeleteDifficultyAssessment`
- `isDifficultyAssessmentEnabled`
- `matchDuration`
- `setMatchDuration`

**Location:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

## Fixes Applied

### Fix 1: Conditional Player Stats Fetching

**File:** `frontend/src/features/game-management/components/GameDetailsPage/hooks/useEntityLoading.js`

#### 1a. Load Entities Effect
Added conditional check to only fetch player stats for appropriate game statuses:

```javascript
// Before:
const [goalsData, subsData, cardsData, difficultyData, timelineData, statsData] = await Promise.all([
  fetchGoals(gameId),
  fetchSubstitutions(gameId),
  fetchCards(gameId),
  isDifficultyAssessmentEnabled ? fetchDifficultyAssessment(gameId) : Promise.resolve(null),
  fetchMatchTimeline(gameId),
  fetchPlayerStats(gameId), // ❌ Always called
]);

// After:
const shouldFetchStats = game.status === 'Played' || game.status === 'Done';

const [goalsData, subsData, cardsData, difficultyData, timelineData, statsData] = await Promise.all([
  fetchGoals(gameId),
  fetchSubstitutions(gameId),
  fetchCards(gameId),
  isDifficultyAssessmentEnabled ? fetchDifficultyAssessment(gameId) : Promise.resolve(null),
  fetchMatchTimeline(gameId),
  shouldFetchStats ? fetchPlayerStats(gameId) : Promise.resolve({}), // ✅ Conditional
]);
```

#### 1b. Refresh Team Stats Function
Added guard clause to prevent fetching stats for inappropriate statuses:

```javascript
// Before:
const refreshTeamStats = async () => {
  if (!gameId || !game) return;
  try {
    const stats = await fetchPlayerStats(gameId); // ❌ Always called
    setTeamStats(stats);
  } catch (error) {
    console.error('[useEntityLoading] Error refreshing team stats:', error);
  }
};

// After:
const refreshTeamStats = async () => {
  if (!gameId || !game) return;
  // Only fetch stats for Played/Done games
  if (game.status !== 'Played' && game.status !== 'Done') return; // ✅ Guard clause
  
  try {
    const stats = await fetchPlayerStats(gameId);
    setTeamStats(stats);
  } catch (error) {
    console.error('[useEntityLoading] Error refreshing team stats:', error);
  }
};
```

### Fix 2: Added Missing Props to MatchAnalysisModule

**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

Added all required props for the difficulty assessment feature:

```javascript
// Before:
<MatchAnalysisModule
  isScheduled={isScheduled}
  isPlayed={isPlayed}
  isDone={isDone}
  teamSummary={teamSummary}
  setTeamSummary={setTeamSummary}
  onTeamSummaryClick={reportHandlers.handleTeamSummaryClick}
  goals={goals}
  onAddGoal={goalsHandlers.handleAddGoal}
  onEditGoal={goalsHandlers.handleEditGoal}
  onDeleteGoal={goalsHandlers.handleDeleteGoal}
  substitutions={substitutions}
  onAddSubstitution={subsHandlers.handleAddSubstitution}
  onEditSubstitution={subsHandlers.handleEditSubstitution}
  onDeleteSubstitution={subsHandlers.handleDeleteSubstitution}
  cards={cards}
  onAddCard={cardsHandlers.handleAddCard}
  onEditCard={cardsHandlers.handleEditCard}
  onDeleteCard={cardsHandlers.handleDeleteCard}
/>

// After:
<MatchAnalysisModule
  isScheduled={isScheduled}
  isPlayed={isPlayed}
  isDone={isDone}
  game={game} // ✅ Added
  teamSummary={teamSummary}
  setTeamSummary={setTeamSummary}
  onTeamSummaryClick={reportHandlers.handleTeamSummaryClick}
  goals={goals}
  onAddGoal={goalsHandlers.handleAddGoal}
  onEditGoal={goalsHandlers.handleEditGoal}
  onDeleteGoal={goalsHandlers.handleDeleteGoal}
  substitutions={substitutions}
  onAddSubstitution={subsHandlers.handleAddSubstitution}
  onEditSubstitution={subsHandlers.handleEditSubstitution}
  onDeleteSubstitution={subsHandlers.handleDeleteSubstitution}
  cards={cards}
  onAddCard={cardsHandlers.handleAddCard}
  onEditCard={cardsHandlers.handleEditCard}
  onDeleteCard={cardsHandlers.handleDeleteCard}
  matchDuration={matchDuration} // ✅ Added
  setMatchDuration={setMatchDuration} // ✅ Added
  difficultyAssessment={difficultyAssessment} // ✅ Added
  onSaveDifficultyAssessment={difficultyHandlers.handleSaveDifficultyAssessment} // ✅ Added
  onDeleteDifficultyAssessment={difficultyHandlers.handleDeleteDifficultyAssessment} // ✅ Added
  isDifficultyAssessmentEnabled={isDifficultyAssessmentEnabled} // ✅ Added
/>
```

## Expected Behavior After Fix

### For Issue 1 (Player Stats API):
- ✅ **Scheduled games:** No player stats API call, no console errors
- ✅ **Played games:** Player stats fetched successfully
- ✅ **Done games:** Player stats fetched successfully
- ✅ **Refresh stats:** Only called for Played/Done games

### For Issue 2 (Difficulty Assessment):
- ✅ **Scheduled games:** Difficulty assessment card visible in right sidebar (if feature enabled)
- ✅ **Played games:** Difficulty assessment card visible (if feature enabled)
- ✅ **Done games:** Difficulty assessment card visible in read-only mode (if feature enabled)
- ✅ **Save/Delete:** Handlers properly wired to `useDifficultyHandlers` hook

## Verification Steps

### Test Issue 1 Fix:
1. Navigate to a **Scheduled** game's details page
2. Open browser console (F12)
3. ✅ Verify: No 400 error for player stats API
4. ✅ Verify: No error messages in console

### Test Issue 2 Fix:
1. Ensure difficulty assessment feature is enabled (`isDifficultyAssessmentEnabled`)
2. Navigate to any game's details page
3. ✅ Verify: Difficulty assessment card is visible in the right sidebar
4. ✅ Verify: Card appears below "AI Match Preview" for Scheduled games
5. ✅ Verify: Card appears below "AI Match Summary" for Done games
6. **For Scheduled/Played games:**
   - ✅ Click "Add Assessment" or "Edit Assessment"
   - ✅ Fill in the form and save
   - ✅ Verify: Assessment is saved and displayed
   - ✅ Click "Delete Assessment"
   - ✅ Verify: Assessment is removed
7. **For Done games:**
   - ✅ Verify: Assessment is displayed in read-only mode
   - ✅ Verify: No edit/delete buttons are shown

## Impact

- **Performance:** Reduced unnecessary API calls for Scheduled games
- **User Experience:** No more console errors, difficulty assessment now visible
- **Code Quality:** Proper conditional logic for API calls, complete prop passing
- **Behavior Parity:** All existing functionality maintained

## Related Files Modified

1. `frontend/src/features/game-management/components/GameDetailsPage/hooks/useEntityLoading.js`
   - Added conditional check for player stats fetching
   - Added guard clause in `refreshTeamStats`

2. `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`
   - Added 6 missing props to `MatchAnalysisModule`

## Status
✅ **Issue 1 FIXED** - Player stats API error resolved
⚠️ **Issue 2 PARTIALLY FIXED** - Props were added, but feature flag was missing. See `BUG_FIX_DIFFICULTY_ASSESSMENT_FEATURE_FLAG.md` for the complete fix.


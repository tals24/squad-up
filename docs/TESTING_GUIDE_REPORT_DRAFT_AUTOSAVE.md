# Testing Guide: Report Draft & Autosave Feature

## Overview

This guide provides step-by-step instructions for testing the Report Draft & Autosave feature for games in "Played" status. The feature automatically saves team summaries, scores, match duration, and player reports to prevent data loss during the reporting phase.

---

## Prerequisites

1. **Backend Server**: Ensure backend is running on `http://localhost:3001`
2. **Frontend Server**: Ensure frontend is running
3. **Test User**: Logged in user with access to a team
4. **Browser DevTools**: Open browser console to monitor autosave logs
5. **Network Tab**: Open browser Network tab to verify API calls

---

## Terminology

Throughout this guide, we use these terms:

- **"Saved" data** = Data stored in the main game document fields:
  - `game.ourScore`, `game.opponentScore` (scores)
  - `game.defenseSummary`, `game.midfieldSummary`, etc. (team summaries)
  - `game.matchDuration` (match duration)
  - `gameReports` collection (player reports)
  
  This is **finalized/official** data that persists even after the game is finalized.

- **"Draft" data** = Temporary autosaved data stored in `game.reportDraft` field:
  - `game.reportDraft.finalScore`
  - `game.reportDraft.teamSummary`
  - `game.reportDraft.matchDuration`
  - `game.reportDraft.playerReports`
  
  This is **work-in-progress** data that gets automatically saved as you type. It's cleared when the game transitions to "Done" status.

**Key Points**: 
- Draft data takes priority over saved data when both exist (draft = current work, saved = previous finalized data).
- **Score Calculation**: Scores are automatically calculated from goals in the UI. The `finalScore` in draft is a snapshot, but the actual displayed score comes from counting goals. When testing draft score override, ensure goals match the draft score or temporarily remove goals.

---

## Test Scenarios

### Scenario 1: Basic Autosave Functionality

**Objective**: Verify that changes are automatically saved after 2.5 seconds of inactivity.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Open browser DevTools Console (F12)
3. Open browser Network tab
4. In the **Team Summaries** section, click on **"Defense"** button
5. Type some text in the Defense Summary field (e.g., "Solid defensive performance")
6. **Wait 2.5 seconds** without typing
7. Check Network tab for a `PUT` request to `/api/games/{gameId}/draft`
8. Check Console for logs in sequence:
   - `✅ [useAutosave] Data changed, scheduling autosave in 2500 ms`
   - `🚀 [useAutosave] Executing autosave API call now...` (after 2.5 seconds)
   - `✅ Draft autosaved successfully`
9. Verify the request payload contains:
   ```json
   {
     "teamSummary": {
       "defenseSummary": "Solid defensive performance"
     }
   }
   ```

#### Expected Results:
- ✅ Autosave request sent after 2.5 seconds
- ✅ Request includes only changed fields
- ✅ Success message in console
- ✅ No error messages

---

### Scenario 2: Autosave Debounce Behavior

**Objective**: Verify that rapid typing doesn't trigger multiple saves, and autosave only triggers when data actually changes.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Open Network tab
3. In **Team Summaries** → **"Midfield"**, start typing rapidly:
   - Type "Good" → wait 1 second
   - Type " midfield" → wait 1 second  
   - Type " control" → wait 1 second
   - Type " today" → wait 2.5 seconds
4. Count the number of `PUT /api/games/{gameId}/draft` requests
5. **Important**: After autosave completes, wait 5 seconds without making any changes
6. Check if any additional autosave requests were made

#### Expected Results:
- ✅ Only **ONE** autosave request after final pause (2.5 seconds after last change)
- ✅ Request contains complete text: "Good midfield control today"
- ✅ No intermediate saves during rapid typing
- ✅ **No additional autosave requests** when no changes are made (even after waiting)
- ✅ Autosave only triggers when data **actually changes**, not on every render

---

### Scenario 3: Multiple Field Autosave

**Objective**: Verify that changes to multiple fields are saved together.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Make changes to multiple fields:
   - **Final Score**: Set "Our Score" to `2`, "Opponent Score" to `1`
   - **Extra Time**: Set "1st" to `3`, "2nd" to `2`
   - **Team Summary** → **"Attack"**: Type "Great attacking play"
3. Wait 2.5 seconds
4. Check Network tab for autosave request

#### Expected Results:
- ✅ Single autosave request contains all changes:
   ```json
   {
     "finalScore": { "ourScore": 2, "opponentScore": 1 },
     "matchDuration": { "firstHalfExtraTime": 3, "secondHalfExtraTime": 2 },
     "teamSummary": { "attackSummary": "Great attacking play" }
   }
   ```

---

### Scenario 4: Draft Loading - Fresh Game (No Draft, No Saved Data)

**Objective**: Verify that a fresh Played game loads with default values.

#### Steps:
1. Create a new game or use a game that was just transitioned to "Played"
2. Ensure the game has:
   - No `reportDraft` in database
   - No saved team summaries, scores, or reports
3. Navigate to the game details page
4. Check browser console for logs:
   - `🔍 [Report Draft Loading] Checking for draft`
   - `⚠️ [Report Draft Loading] No draft found, using saved data from DB`
5. Verify UI shows:
   - Empty team summary fields
   - Score: 0 - 0
   - Match duration: 90 minutes, 0 + 0 extra time
   - No player reports

#### Expected Results:
- ✅ No draft loading logs
- ✅ UI shows default/empty values
- ✅ No errors in console

---

### Scenario 5: Draft Loading - Draft Only (No Saved Data)

**Objective**: Verify that draft data loads correctly when no saved data exists.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Make some changes:
   - Set score to `3-1`
   - Type "Test defense summary" in Defense Summary
3. Wait for autosave (2.5 seconds)
4. **Refresh the page** (F5)
5. Check console for logs:
   - `🔍 [Report Draft Loading] Checking for draft`
   - `📋 Loading report draft:`
   - `✅ Report draft loaded and merged with saved data`
6. Verify UI shows:
   - Score: 3 - 1
   - Defense Summary: "Test defense summary"

#### Expected Results:
- ✅ Draft data loads correctly
- ✅ UI displays draft values
- ✅ No data loss after refresh

---

### Scenario 6: Draft Loading - Saved Data Only (No Draft)

**Objective**: Verify that saved data loads when no draft exists.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Fill in some data and **manually save** (not autosave):
   - Set score to `2-0`
   - Type "Saved midfield summary" in Midfield Summary
   - Click "Save" or finalize (if applicable)
3. Ensure game has saved data but **no draft** (check database or clear draft manually)
4. **Refresh the page**
5. Check console for logs:
   - `⚠️ [Report Draft Loading] No draft found, using saved data from DB`
6. Verify UI shows saved values:
   - Score: 2 - 0
   - Midfield Summary: "Saved midfield summary"

#### Expected Results:
- ✅ Saved data loads correctly
- ✅ No draft loading logs
- ✅ UI displays saved values

---

### Scenario 7: Draft Merging - Draft Overrides Saved Data

**Objective**: Verify that draft data takes priority over saved data when both exist.

#### Terminology:
- **"Saved" data** = Data stored in the main game document fields (`game.ourScore`, `game.defenseSummary`, etc.) - this is finalized/official data
- **"Draft" data** = Temporary autosaved data stored in `game.reportDraft` field - this is work-in-progress that hasn't been finalized

#### Setup:
**Important Note**: In normal operation, **scores are automatically calculated from goals**. However, for testing purposes, we can manually set scores in the database to simulate different scenarios.

1. **Create a game with saved data** (finalized/official data in main game fields):
   - Score: `1-1` (stored in `game.ourScore` and `game.opponentScore`)
   - Defense Summary: "Old defense summary" (stored in `game.defenseSummary`)
   - Midfield Summary: "Saved midfield" (stored in `game.midfieldSummary`)
   
   **How to create**: 
   - **Option A (Recommended)**: Create goals in the UI that result in 1-1 score, then finalize the report
   - **Option B (For testing)**: Manually set these fields in the database:
   ```javascript
   db.games.updateOne(
     { _id: ObjectId("gameId") },
     {
       $set: {
         ourScore: 1,
         opponentScore: 1,
         defenseSummary: "Old defense summary",
         midfieldSummary: "Saved midfield"
       }
     }
   )
   ```

2. **Create a draft with partial data** (temporary autosaved data):
   - Score: `2-1` (stored in `game.reportDraft.finalScore`)
   - Defense Summary: "New defense summary" (stored in `game.reportDraft.teamSummary.defenseSummary`)
   - (No midfield summary in draft)
   
   **How to create**: 
   - **Option A (Recommended)**: Add goals in the UI to make score 2-1, then edit defense summary (this will autosave to draft)
   - **Option B (For testing)**: Manually set in database:
   ```javascript
   db.games.updateOne(
     { _id: ObjectId("gameId") },
     {
       $set: {
         reportDraft: {
           finalScore: { ourScore: 2, opponentScore: 1 },
           teamSummary: { defenseSummary: "New defense summary" }
         }
       }
     }
   )
   ```
   
   **Note**: If you manually set `reportDraft.finalScore`, be aware that when goals are loaded, the score will be recalculated from goals. To test draft score override, you may need to temporarily remove goals or ensure goals match the draft score.

#### Steps:
1. Navigate to the game details page
2. Check console for logs:
   - `📋 Loading report draft:`
   - `✅ Report draft loaded and merged with saved data`
3. Verify UI shows **merged** values:
   - Score: **2 - 1** (from draft, overrides saved 1-1)
   - Defense Summary: **"New defense summary"** (from draft, overrides saved)
   - Midfield Summary: **"Saved midfield"** (from saved, draft doesn't have it)

#### Expected Results:
- ✅ Draft fields override saved fields
- ✅ Saved fields not in draft are preserved
- ✅ Merge works correctly

---

### Scenario 8: Player Reports Autosave

**Objective**: Verify that player report changes are autosaved.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Open a player's report card
3. Make changes:
   - Set Physical Rating to `4`
   - Set Technical Rating to `5`
   - Type notes: "Excellent performance"
4. Wait 2.5 seconds
5. Check Network tab for autosave request
6. Verify payload contains:
   ```json
   {
     "playerReports": {
       "{playerId}": {
         "rating_physical": 4,
         "rating_technical": 5,
         "notes": "Excellent performance"
       }
     }
   }
   ```
7. Refresh the page
8. Verify player report still shows the changes

#### Expected Results:
- ✅ Player report changes are autosaved
- ✅ Data persists after refresh
- ✅ Only changed player's data is in payload

---

### Scenario 9: Status Transition - Played → Done (Draft Cleanup)

**Objective**: Verify that draft is cleared when game transitions to "Done".

#### Steps:
1. Navigate to a game with status **"Played"**
2. Make some changes (create a draft):
   - Set score to `3-2`
   - Type "Draft summary" in General Summary
3. Wait for autosave
4. **Finalize the game** (change status to "Done")
5. Check backend logs or database:
   - `reportDraft` should be `null`
6. Refresh the page
7. Verify:
   - Game status is now "Done"
   - Draft data is cleared (check database)
   - UI shows finalized data (not draft)

#### Expected Results:
- ✅ Draft cleared when status changes to "Done"
- ✅ Backend sets `reportDraft = null`
- ✅ No draft loading logs after status change

---

### Scenario 10: Status Validation - Scheduled Games

**Objective**: Verify that autosave doesn't run for Scheduled games.

#### Steps:
1. Navigate to a game with status **"Scheduled"**
2. Try to access report fields (if available)
3. Make changes to any report-related fields
4. Wait 2.5 seconds
5. Check Network tab

#### Expected Results:
- ✅ No autosave request to `/draft` endpoint for report data
- ✅ Autosave only works for lineup draft (Scheduled games)
- ✅ No errors in console

---

### Scenario 11: Autosave Skip Logic - Empty Data

**Objective**: Verify that autosave skips when there's no meaningful data.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Ensure all fields are empty/default:
   - Score: 0-0
   - No team summaries
   - No player reports
   - Match duration: 90 minutes, 0+0 extra time
3. Open Network tab
4. Wait 5 seconds
5. Check for autosave requests

#### Expected Results:
- ✅ No autosave requests sent
- ✅ `shouldSkip` function prevents unnecessary saves
- ✅ No errors

---

### Scenario 11b: Autosave Change Detection - No Unnecessary Saves

**Objective**: Verify that autosave only triggers when data actually changes, not on every render.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Make a change:
   - Type "Test summary" in Defense Summary
3. Wait for autosave to complete (check Network tab)
4. **Do NOT make any more changes**
5. Wait 10 seconds
6. Interact with the page (scroll, click other buttons, etc.) but **don't change any report data**
7. Wait another 10 seconds
8. Check Network tab for any additional autosave requests

#### Expected Results:
- ✅ Only **ONE** autosave request (from step 2)
- ✅ **NO** additional autosave requests when no data changes
- ✅ Autosave doesn't trigger on component re-renders
- ✅ Autosave doesn't trigger on unrelated interactions (scrolling, clicking other buttons)
- ✅ Autosave only triggers when report data **actually changes**

---

### Scenario 12: Error Handling - Network Failure

**Objective**: Verify that autosave errors are handled gracefully.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Open browser DevTools → Network tab
3. Set Network throttling to **"Offline"** or block the API endpoint
4. Make changes:
   - Type "Test summary" in Defense Summary
5. Wait 2.5 seconds
6. Check console for error logs:
   - `❌ Error autosaving draft:`
7. Restore network connection
8. Make another small change (add a space)
9. Wait 2.5 seconds
10. Verify autosave succeeds on retry

#### Expected Results:
- ✅ Error logged in console
- ✅ No UI crash or blocking
- ✅ User can continue editing
- ✅ Autosave retries when network is restored

---

### Scenario 13: Concurrent Edits - Multiple Tabs

**Objective**: Verify behavior when same game is open in multiple tabs.

#### Steps:
1. Open game details page in **Tab 1**
2. Open same game in **Tab 2** (new tab)
3. In Tab 1: Set score to `2-1`, wait for autosave
4. In Tab 2: Set score to `3-0`, wait for autosave
5. Refresh Tab 1
6. Refresh Tab 2
7. Check which score is displayed

#### Expected Results:
- ✅ Last write wins (last autosave persists)
- ✅ Both tabs can edit independently
- ✅ No conflicts or errors
- ✅ Final state reflects last saved draft

---

### Scenario 14: Browser Refresh During Autosave

**Objective**: Verify that draft persists even if page refreshes during autosave.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Make changes:
   - Type "Important summary" in General Summary
3. Wait 1 second (before autosave completes)
4. **Immediately refresh the page** (F5)
5. Check if data is preserved:
   - If previous autosave completed → data should load from draft
   - If autosave was in-flight → check if data is lost or preserved

#### Expected Results:
- ✅ Draft loading restores last saved draft
- ✅ Data is preserved (if previous autosave succeeded)
- ✅ No data loss

---

### Scenario 15: Extra Time Component Visibility

**Objective**: Verify that Extra Time component is hidden for Done games.

#### Steps:
1. Navigate to a game with status **"Played"**
2. Verify Extra Time component is visible in Match Analysis Sidebar
3. Change game status to **"Done"**
4. Refresh the page
5. Verify Extra Time component is **hidden**

#### Expected Results:
- ✅ Extra Time component visible for "Played" games
- ✅ Extra Time component hidden for "Done" games
- ✅ No console errors

---

## Verification Checklist

After completing all test scenarios, verify:

- [ ] Autosave triggers after 2.5 seconds of inactivity **only when data changes**
- [ ] Autosave **does NOT trigger** when data hasn't changed (even after waiting)
- [ ] Debounce prevents multiple rapid saves
- [ ] Draft loads correctly on page refresh
- [ ] Draft merges correctly with saved data (draft overrides saved)
- [ ] Multiple fields save together in single request
- [ ] Player reports autosave correctly
- [ ] Draft clears when game transitions to "Done"
- [ ] Autosave doesn't run for Scheduled games
- [ ] Empty data doesn't trigger autosave
- [ ] Network errors are handled gracefully
- [ ] Extra Time component hidden for Done games
- [ ] No console errors during normal operation
- [ ] **No unnecessary API calls** - autosave only triggers on actual data changes

---

## Debugging Tips

### Check Draft in Database
```javascript
// In MongoDB or backend console
db.games.findOne({ _id: ObjectId("gameId") }, { reportDraft: 1 })
```

### Monitor Autosave in Console
Look for these log messages:
- `🔍 [useAutosave] Initial mount, skipping...` (on component mount)
- `✅ [useAutosave] Data changed, scheduling autosave in 2500 ms` (when change detected)
- `🚀 [useAutosave] Executing autosave API call now...` (when API call executes)
- `✅ Draft autosaved successfully:` (on success)
- `❌ Error autosaving draft:` (on error)
- `🔍 [Report Draft Loading] Checking for draft:` (when loading draft)
- `📋 Loading report draft:` (when draft found)

### Check Network Requests
- Filter by `/draft` endpoint
- Verify request method: `PUT`
- Check request payload structure
- Verify response status: `200 OK`

### Common Issues

1. **Autosave not triggering**
   - Check game status is "Played"
   - Verify `isFinalizingGame` is false
   - Check `shouldSkip` logic
   - Verify data actually changed (hook compares previous values)

2. **Autosave triggering too often (every 2 seconds)**
   - **This is a bug** - autosave should only trigger when data changes
   - Check if `useAutosave` hook has proper change detection (compares previous data)
   - Verify `reportDataForAutosave` useMemo dependencies aren't causing unnecessary recreations
   - Check console for repeated autosave logs

3. **Draft not loading**
   - Verify `game.reportDraft` exists in database
   - Check console for loading logs
   - Verify game status is "Played"

4. **Merge not working**
   - Check draft structure matches expected format
   - Verify merge logic runs after saved data loads
   - Check console for merge logs

---

## Test Data Setup

### Create Test Game with Draft
```javascript
// Backend console or MongoDB
db.games.updateOne(
  { _id: ObjectId("gameId") },
  {
    $set: {
      status: "Played",
      reportDraft: {
        teamSummary: {
          defenseSummary: "Test defense",
          midfieldSummary: "Test midfield"
        },
        finalScore: {
          ourScore: 2,
          opponentScore: 1
        }
      }
    }
  }
)
```

### Clear Draft for Testing
```javascript
db.games.updateOne(
  { _id: ObjectId("gameId") },
  { $set: { reportDraft: null } }
)
```

---

## Success Criteria

The feature is working correctly if:

1. ✅ All autosave scenarios pass
2. ✅ Draft loading scenarios pass
3. ✅ Merge scenarios work correctly
4. ✅ Status transitions work as expected
5. ✅ Error handling is graceful
6. ✅ No data loss during normal operation
7. ✅ Performance is acceptable (no lag during typing)
8. ✅ No console errors or warnings

---

## Notes

- **Debounce Time**: 2.5 seconds (2500ms)
- **Autosave Endpoint**: `PUT /api/games/:gameId/draft`
- **Draft Field**: `game.reportDraft` (MongoDB Mixed type)
- **Supported Statuses**: Only "Played" games
- **Cleanup**: Draft cleared when status → "Done"

---

## Related Documentation

- [Feature Plan](./FEATURE_PLAN_REPORT_DRAFT_AUTOSAVE.md)
- [Backend API Documentation](./API_DOCUMENTATION.md) (if available)
- [Frontend Component Documentation](./COMPONENT_DOCUMENTATION.md) (if available)


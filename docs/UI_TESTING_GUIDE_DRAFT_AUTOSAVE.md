# UI Testing Guide: Draft/Autosave System

## Overview

This guide walks you through testing the new draft/autosave system for the GameDetails page. The system provides instant UI updates with debounced autosave to prevent data loss.

---

## Prerequisites

1. **Backend running** on `http://localhost:3001`
2. **Frontend running** on `http://localhost:5173`
3. **Browser DevTools open** (F12) - Network tab and Console tab
4. **At least one Scheduled game** in your database

---

## Test 1: Instant UI Updates (No API Calls on Drag)

**Goal:** Verify that dragging players updates the UI instantly without immediate API calls.

### Steps:

1. Navigate to a **Scheduled** game in the GameDetails page
2. Open **Browser DevTools** → **Network** tab
3. Clear the network log (click the 🚫 icon)
4. **Drag a player** from "Squad Players" section to the tactical board (or change their status)
5. **Observe:**

### Expected Results:

✅ **UI updates instantly** - Player appears on board immediately (no delay)  
✅ **No API calls** in Network tab immediately after drag  
✅ **Console shows no errors**

### What to Look For:

- Player should move/update instantly (0ms delay)
- Network tab should remain empty for ~2.5 seconds
- No `POST /api/game-rosters/batch` calls (old behavior)

---

## Test 2: Debounced Autosave (2.5 Second Delay)

**Goal:** Verify that changes are autosaved after 2.5 seconds of inactivity.

### Steps:

1. Navigate to a **Scheduled** game
2. Open **Browser DevTools** → **Network** tab
3. Clear the network log
4. **Drag one player** to change their status
5. **Wait 2.5 seconds** (don't make any more changes)
6. **Observe the Network tab**

### Expected Results:

✅ **After 2.5 seconds**, you should see:
   - `PUT /api/games/:gameId/draft` request
   - Status: `200 OK`
   - Request body: `{ rosters: { playerId: status, ... } }`
   - Response: `{ success: true, message: "Draft saved successfully" }`

✅ **Console shows:**
   - `✅ Draft autosaved successfully: { ... }`

### What to Look For:

- Request appears exactly 2.5 seconds after last change
- Request is `PUT` (not `POST`)
- Endpoint is `/api/games/:gameId/draft` (not `/api/game-rosters/batch`)

---

## Test 3: Autosave Cancellation (Multiple Rapid Changes)

**Goal:** Verify that rapid changes cancel previous autosave timers.

### Steps:

1. Navigate to a **Scheduled** game
2. Open **Browser DevTools** → **Network** tab
3. Clear the network log
4. **Drag Player 1** to change status
5. **Wait 1 second**
6. **Drag Player 2** to change status
7. **Wait 1 second**
8. **Drag Player 3** to change status
9. **Wait 2.5 seconds** (don't make any more changes)
10. **Observe the Network tab**

### Expected Results:

✅ **Only ONE** `PUT /api/games/:gameId/draft` request appears  
✅ Request appears **2.5 seconds after the last change** (Player 3)  
✅ Request body includes **all three players' statuses** (not just Player 3)

### What to Look For:

- Multiple rapid changes should result in only one API call
- The API call should include all changes made during the 2.5 second window
- No duplicate requests

---

## Test 4: Draft Loading on Page Refresh

**Goal:** Verify that saved drafts are loaded when you refresh the page.

### Steps:

1. Navigate to a **Scheduled** game
2. **Drag several players** to different statuses (Starting Lineup, Bench, etc.)
3. **Wait 2.5 seconds** for autosave to complete
4. **Verify autosave succeeded** (check Network tab or Console)
5. **Refresh the page** (F5 or Ctrl+R)
6. **Observe the roster state**

### Expected Results:

✅ **All player statuses are restored** exactly as you left them  
✅ **Console shows:** `📋 Loading draft lineup: { ... }`  
✅ **No "Not in Squad" reset** - players maintain their positions

### What to Look For:

- Players on tactical board should still be there
- Players in "Bench" section should still be there
- Formation should be preserved
- Console log confirms draft was loaded

---

## Test 5: Draft Cleanup (Game Finalization)

**Goal:** Verify that draft is cleared when game is finalized.

### Steps:

1. Navigate to a **Scheduled** game
2. **Drag players** to create a lineup (11 starters, some bench players)
3. **Wait 2.5 seconds** for autosave
4. **Click "Game Was Played"** button
5. **Wait for game status to change to "Played"**
6. **Refresh the page** (F5)
7. **Check the game in MongoDB** (optional) or check Network tab

### Expected Results:

✅ **Game status changes to "Played"**  
✅ **Roster is saved** to GameRoster collection (not draft)  
✅ **On refresh**, roster loads from `gameRosters` (not draft)  
✅ **Draft field is null** in database (if you check MongoDB)

### What to Look For:

- After refresh, players still appear correctly (loaded from gameRosters)
- Console should NOT show "📋 Loading draft lineup" (draft should be gone)
- Network tab shows `POST /api/games/:gameId/start-game` succeeded

---

## Test 6: Played/Done Games (No Autosave)

**Goal:** Verify that autosave does NOT run for Played or Done games.

### Steps:

1. Navigate to a **Played** or **Done** game
2. Open **Browser DevTools** → **Network** tab
3. Clear the network log
4. **Try to drag a player** (if allowed) or change status
5. **Wait 3 seconds**
6. **Observe the Network tab**

### Expected Results:

✅ **No `PUT /api/games/:gameId/draft` requests** appear  
✅ **Autosave useEffect does not run** (only for Scheduled games)  
✅ **Console shows no autosave logs**

### What to Look For:

- Network tab remains empty (no draft API calls)
- Console shows no autosave-related logs
- If game is "Played", you shouldn't be able to drag players anyway

---

## Test 7: Network Failure Handling

**Goal:** Verify that autosave errors are handled gracefully.

### Steps:

1. Navigate to a **Scheduled** game
2. Open **Browser DevTools** → **Network** tab
3. **Enable "Offline" mode** (Network tab → Throttling → Offline)
4. **Drag a player** to change status
5. **Wait 2.5 seconds**
6. **Check Console tab**

### Expected Results:

✅ **Console shows error:** `❌ Error autosaving draft: ...`  
✅ **UI state is NOT lost** - player status remains in local state  
✅ **Error message is stored** in `autosaveError` state

### What to Look For:

- Error is logged but doesn't crash the app
- Player status remains correct in UI (local state preserved)
- When network is restored, next autosave should succeed

---

## Test 8: Multiple Tabs (Isolation)

**Goal:** Verify that draft changes in one tab don't interfere with another.

### Steps:

1. **Open two browser tabs** with the same Scheduled game
2. In **Tab 1**: Drag Player A to "Starting Lineup"
3. In **Tab 2**: Drag Player B to "Bench"
4. **Wait 2.5 seconds** in both tabs
5. **Refresh both tabs**
6. **Observe the final state**

### Expected Results:

✅ **Last save wins** - The last tab to autosave will overwrite the draft  
✅ **Both tabs show the same state** after refresh (from latest draft)  
✅ **No data corruption** - Draft is a single source of truth

### What to Look For:

- After refresh, both tabs show the same roster state
- The state matches whichever tab saved last
- No conflicts or duplicate data

---

## Test 9: Empty Draft (New Game)

**Goal:** Verify that new games without drafts initialize correctly.

### Steps:

1. **Create a new Scheduled game** (or use one with no draft)
2. Navigate to the GameDetails page
3. **Observe the initial state**

### Expected Results:

✅ **All players start as "Not in Squad"**  
✅ **No errors in console**  
✅ **Draft loading useEffect skips** (no draft exists)

### What to Look For:

- All players appear in "Squad Players" section
- Tactical board is empty
- No console errors about missing draft

---

## Test 10: Draft Merging (Missing Players)

**Goal:** Verify that draft correctly merges with all players.

### Steps:

1. Navigate to a **Scheduled** game
2. **Drag 5 players** to "Starting Lineup"
3. **Wait 2.5 seconds** for autosave
4. **Add a new player** to the team (via Players page)
5. **Refresh the GameDetails page**
6. **Observe the new player's status**

### Expected Results:

✅ **Draft players maintain their statuses** (5 players still in Starting Lineup)  
✅ **New player defaults to "Not in Squad"** (merged correctly)  
✅ **No errors or missing data**

### What to Look For:

- Existing draft players keep their statuses
- New player appears with default "Not in Squad" status
- All players are accounted for

---

## Quick Verification Checklist

Use this checklist to quickly verify all functionality:

- [ ] **Instant UI Updates**: Dragging players updates UI immediately (no delay)
- [ ] **Debounced Autosave**: API call appears 2.5 seconds after last change
- [ ] **Autosave Cancellation**: Multiple rapid changes result in only one API call
- [ ] **Draft Loading**: Refreshing page restores all player statuses
- [ ] **Draft Cleanup**: Starting game clears draft and saves to gameRosters
- [ ] **Played/Done Games**: No autosave for non-Scheduled games
- [ ] **Network Failure**: Errors are handled gracefully, UI state preserved
- [ ] **Multiple Tabs**: Last save wins, no conflicts
- [ ] **Empty Draft**: New games initialize correctly
- [ ] **Draft Merging**: New players are merged correctly with existing draft

---

## Network Tab Monitoring

### What to Watch For:

**✅ Good Signs:**
- `PUT /api/games/:gameId/draft` appears after 2.5 seconds
- Status: `200 OK`
- Request body contains `{ rosters: { ... } }`
- Response: `{ success: true, ... }`

**❌ Bad Signs:**
- `POST /api/game-rosters/batch` still appearing (old behavior)
- Multiple draft requests for single change (debounce not working)
- `400 Bad Request` (game not Scheduled, invalid body)
- `403 Forbidden` (authorization issue)
- `500 Internal Server Error` (backend error)

---

## Console Monitoring

### Expected Logs:

**✅ Success:**
```
📋 Loading draft lineup: { playerId: status, ... }
✅ Draft autosaved successfully: { success: true, ... }
```

**❌ Errors (should be handled gracefully):**
```
❌ Error autosaving draft: NetworkError: Failed to fetch
❌ Error autosaving draft: Error: Cannot save draft for game with status: Played
```

---

## MongoDB Verification (Optional)

If you want to verify the database state:

### Check Draft Field:
```javascript
// In MongoDB shell or Compass
db.games.findOne({ _id: ObjectId("your-game-id") }, { lineupDraft: 1, status: 1 })
```

**Expected:**
- `Scheduled` games: `lineupDraft: { playerId: status, ... }` or `null`
- `Played` games: `lineupDraft: null` (cleared)
- `Done` games: `lineupDraft: null` (cleared)

---

## Troubleshooting

### Issue: Autosave not triggering

**Check:**
1. Game status is "Scheduled" (not "Played" or "Done")
2. `localRosterStatuses` is not empty (wait for initial load)
3. Network tab shows no errors
4. Console shows no JavaScript errors

**Solution:**
- Verify game status in console: `game.status === 'Scheduled'`
- Check if `localRosterStatuses` has data: `console.log(localRosterStatuses)`

---

### Issue: Draft not loading on refresh

**Check:**
1. Draft was actually saved (check Network tab for previous `PUT /draft` request)
2. Game status is still "Scheduled" (draft cleared if game is Played)
3. Console shows draft loading log

**Solution:**
- Check MongoDB: `db.games.findOne({ _id: ObjectId("...") }, { lineupDraft: 1 })`
- Verify game status hasn't changed to "Played"

---

### Issue: Multiple API calls for single change

**Check:**
1. Debounce timer is being cancelled correctly
2. `useEffect` dependencies are correct
3. No duplicate `useEffect` hooks

**Solution:**
- Check Network tab timing - should be exactly 2.5 seconds after last change
- Verify cleanup function in `useEffect` is working

---

## Summary

The draft/autosave system should provide:
- **Instant UI updates** (0ms delay)
- **Debounced autosave** (2.5s delay, reduces API calls by ~90%)
- **Draft persistence** (survives page refresh)
- **Automatic cleanup** (draft cleared when game starts)
- **Graceful error handling** (network failures don't lose data)

All tests should pass for the system to be considered working correctly.




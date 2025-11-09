# UI Testing Checklist: Denormalization Removal

## Overview

After removing denormalized fields (`playerName`, `gameTitle`, `rosterEntry`) from `GameRoster`, verify that the UI correctly displays player names and game titles by performing lookups from the `gamePlayers` and `game` state instead of stale database fields.

---

## Pre-Testing Setup

1. **Ensure backend is running** with the new schema (no denormalized fields)
2. **Ensure frontend is running** with the refactored code
3. **Migration completed** - All denormalized fields removed from database

---

## Test Scenarios

### Test 1: Basic Display - Player Names in Roster Sidebar

**Location:** Left sidebar - "Game Day Roster"

**Steps:**
1. Navigate to any game (Scheduled, Played, or Done)
2. Open the Game Details page
3. Look at the left sidebar "Game Day Roster"

**What to Check:**
- ✅ **Players on Pitch** section displays player names correctly
- ✅ **Bench** section displays player names correctly
- ✅ **Squad Players** section displays player names correctly
- ✅ All player names match the actual player names from the Players page
- ✅ No "undefined" or "Unknown Player" text (unless player actually has no name)

**Expected Result:**
All player names should display correctly from `gamePlayers` state.

---

### Test 2: Basic Display - Player Names in Tactical Board

**Location:** Center - Tactical Board (Formation)

**Steps:**
1. Navigate to a game with status "Scheduled"
2. Drag players to positions on the tactical board
3. Verify players appear on the board

**What to Check:**
- ✅ Player names display correctly on each position
- ✅ Player kit numbers display correctly
- ✅ Clicking on a player opens the correct player dialog
- ✅ No "undefined" or missing names

**Expected Result:**
All player names should display correctly from `formation` state (which uses player objects from `gamePlayers`).

---

### Test 3: Game Title Display

**Location:** Header - Game Title

**Steps:**
1. Navigate to any game
2. Look at the header

**What to Check:**
- ✅ Game title displays correctly (e.g., "U12 vs Hapoel yafo11")
- ✅ Title matches the game details
- ✅ Title updates if you edit the game and refresh

**Expected Result:**
Game title should display from `game.gameTitle` or calculated from `game.teamName` and `game.opponent`.

---

### Test 4: Player Name Update - Immediate Reflection

**Critical Test:** This verifies we're using fresh state, not stale denormalized data.

**Steps:**
1. Navigate to a game with existing roster (status: Played or Done)
2. Note the current player names displayed in the roster sidebar
3. Open a new tab/window
4. Go to Players page
5. Edit a player's name (change "John Doe" to "John Smith")
6. Save the change
7. Return to the Game Details page
8. Refresh the page (F5)

**What to Check:**
- ✅ Player name updates immediately to the new name
- ✅ Name appears correctly in:
  - Game Day Roster sidebar
  - Tactical Board (if player is on formation)
  - Player Performance Dialog (when clicking on player)
- ✅ No stale/old name displayed

**Expected Result:**
Player name should update immediately because it's read from `gamePlayers` state (which is refreshed from the Players collection), not from stale `GameRoster.playerName`.

---

### Test 5: Game Details Update - Immediate Reflection

**Critical Test:** This verifies game title uses fresh state.

**Steps:**
1. Navigate to a game
2. Note the current game title in the header
3. Open a new tab/window
4. Go to Games Schedule page
5. Edit the game (change opponent name or other details)
6. Save the change
7. Return to the Game Details page
8. Refresh the page (F5)

**What to Check:**
- ✅ Game title updates immediately to reflect the change
- ✅ Title appears correctly in the header
- ✅ No stale/old title displayed

**Expected Result:**
Game title should update immediately because it's read from `game` state (which is refreshed from the Games collection), not from stale `GameRoster.gameTitle`.

---

### Test 6: Create New Roster Entry

**Steps:**
1. Navigate to a "Scheduled" game
2. Drag a player from "Squad Players" to the formation
3. Verify the player appears on the tactical board
4. Check the Game Day Roster sidebar

**What to Check:**
- ✅ Player name displays correctly in the formation
- ✅ Player appears in "Players on Pitch" section with correct name
- ✅ Player is removed from "Squad Players" section
- ✅ No "undefined" or "Unknown Player" text

**Expected Result:**
New roster entries should work correctly, and player names should display from `gamePlayers` state.

---

### Test 7: Update Player Status

**Steps:**
1. Navigate to a "Scheduled" game
2. Click on a player in "Squad Players" section
3. Change their status (e.g., to "Bench")
4. Verify the change

**What to Check:**
- ✅ Player moves to the correct section (e.g., "Bench")
- ✅ Player name still displays correctly
- ✅ Status change is saved correctly
- ✅ No errors in console

**Expected Result:**
Status updates should work, and player names should remain correct throughout.

---

### Test 8: Start Game (Mark as Played)

**Steps:**
1. Navigate to a "Scheduled" game
2. Assign 11 players to starting lineup
3. Assign some players to bench
4. Click "Game Was Played" button
5. Wait for the game status to change to "Played"

**What to Check:**
- ✅ Game status changes to "Played"
- ✅ All player names still display correctly in:
  - Game Day Roster sidebar
  - Tactical Board
- ✅ No "undefined" or missing names
- ✅ Roster data is saved correctly

**Expected Result:**
Starting a game should work correctly, and all player names should display from `gamePlayers` state.

---

### Test 9: Player Performance Dialog

**Steps:**
1. Navigate to a "Played" or "Done" game
2. Click on any player in the roster sidebar
3. Player Performance Dialog opens

**What to Check:**
- ✅ Player name displays correctly in the dialog header
- ✅ All player information is correct
- ✅ No "undefined" or missing data

**Expected Result:**
Player dialog should display correct information from the player object.

---

### Test 10: Multiple Games - Verify Isolation

**Steps:**
1. Navigate to Game 1
2. Note player names
3. Navigate to Game 2 (different team)
4. Note player names
5. Navigate back to Game 1

**What to Check:**
- ✅ Each game shows the correct players for that game's team
- ✅ Player names are correct for each game
- ✅ No cross-contamination between games
- ✅ Formation rebuilds correctly when navigating back

**Expected Result:**
Each game should display its own team's players correctly, with names from the current `gamePlayers` state.

---

## Edge Cases to Test

### Edge Case 1: Player with No Name

**Steps:**
1. Create or find a player with empty/null `fullName`
2. Add them to a game roster
3. Check UI display

**What to Check:**
- ✅ UI handles missing name gracefully
- ✅ Shows "Unknown Player" or player ID, not "undefined"
- ✅ No crashes

---

### Edge Case 2: Game with No Title

**Steps:**
1. Create or find a game with empty/null `gameTitle`
2. Navigate to that game
3. Check header display

**What to Check:**
- ✅ UI handles missing title gracefully
- ✅ Shows calculated title (e.g., "Team vs Opponent") or fallback
- ✅ No crashes

---

### Edge Case 3: Empty Roster

**Steps:**
1. Navigate to a game with no roster entries
2. Check UI display

**What to Check:**
- ✅ Empty states display correctly
- ✅ No errors in console
- ✅ Can still add players

---

## Console Checks

**Open Browser DevTools (F12) → Console tab**

**What to Look For:**
- ❌ No errors about `playerName`, `gameTitle`, or `rosterEntry` being undefined
- ❌ No errors about missing player data
- ❌ No warnings about stale data
- ✅ Any debug logs show correct player IDs and names

---

## Network Tab Checks

**Open Browser DevTools (F12) → Network tab**

**What to Check:**
1. **When updating player status:**
   - Request to `POST /api/game-rosters/batch`
   - Verify request body **does NOT** include `playerName`, `gameTitle`, `rosterEntry`
   - Request body should only have: `{ gameId, rosters: [{ playerId, status }] }`

2. **When starting game:**
   - Request to `POST /api/games/:gameId/start-game`
   - Verify request body **does NOT** include `playerName`, `gameTitle`, `rosterEntry`
   - Request body should only have: `{ rosters: [{ playerId, status }] }`

**Expected Result:**
API requests should not include denormalized fields.

---

## Quick Verification Checklist

- [ ] Player names display correctly in Game Day Roster sidebar
- [ ] Player names display correctly on Tactical Board
- [ ] Game title displays correctly in header
- [ ] Updating a player name reflects immediately in game UI
- [ ] Updating game details reflects immediately in game UI
- [ ] Creating new roster entries works correctly
- [ ] Updating player status works correctly
- [ ] Starting a game works correctly
- [ ] Player Performance Dialog shows correct names
- [ ] No "undefined" or "Unknown Player" text (unless actually missing)
- [ ] No console errors
- [ ] API requests don't include denormalized fields

---

## Success Criteria

✅ **All tests pass** - UI displays correct data from fresh state  
✅ **No stale data** - Updates reflect immediately  
✅ **No errors** - Console is clean, no crashes  
✅ **API is clean** - No denormalized fields in requests  

---

## If Issues Found

### Issue: Player names show "undefined"

**Possible Causes:**
- `gamePlayers` state not loaded correctly
- Player lookup failing in `playerMap`
- Player object missing `fullName` field

**Debug Steps:**
1. Check console for `gamePlayers` array
2. Verify `playerMap` is created correctly
3. Check if player has `fullName` field in database

---

### Issue: Game title shows "undefined"

**Possible Causes:**
- `game` state not loaded correctly
- Game object missing `gameTitle` field

**Debug Steps:**
1. Check console for `game` object
2. Verify game has `gameTitle` or calculate from `teamName` and `opponent`

---

### Issue: API still sending denormalized fields

**Possible Causes:**
- Frontend code not updated
- Old cached code

**Debug Steps:**
1. Check Network tab - verify request body
2. Check `updatePlayerStatus` and `executeGameWasPlayed` functions
3. Hard refresh browser (Ctrl+Shift+R)

---

## Summary

The key verification is that **player names and game titles always display the current, fresh data** from the `gamePlayers` and `game` state, not stale denormalized fields from the database. After updating a player name or game details, the UI should reflect the change immediately upon refresh.


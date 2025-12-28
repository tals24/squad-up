# Manual Smoke Checklist — GameDetailsPage

Use this checklist to manually verify behavior parity after each refactor PR.

---

## 🎯 Pre-Test Setup

### Test Data Requirements
- [ ] At least 1 team with 15+ players
- [ ] At least 3 games in different states:
  - 1 game in "Scheduled" status
  - 1 game in "Played" status
  - 1 game in "Done" status

### Environment
- [ ] Backend running on `http://localhost:3001`
- [ ] Frontend running (Vite dev server)
- [ ] Authenticated as Coach or Admin
- [ ] Browser console open (check for errors)
- [ ] Network tab open (check for failed requests)

---

## ✅ Test 1: Scheduled Game (Draft Roster)

### 1.1 Load Game
- [ ] Navigate to game details for a "Scheduled" game
- [ ] Page loads without errors
- [ ] Game header shows: opponent name, date, "Scheduled" badge
- [ ] Tactical board displays in center
- [ ] Left sidebar shows "Squad" with all team players
- [ ] Right sidebar shows empty

**Expected Network**:
- [ ] `GET /api/games/{gameId}` returns 200
- [ ] Game object includes `lineupDraft` (may be null if first load)

### 1.2 Assign Players to Formation
- [ ] Drag a goalkeeper from Squad to GK position
- [ ] Player appears on tactical board
- [ ] Player removed from Squad section
- [ ] No errors in console

- [ ] Drag 10 more players to field positions
- [ ] Formation fills up
- [ ] "Starting Lineup" section in sidebar shows 11 players

### 1.3 Autosave Verification
- [ ] Wait 3 seconds after last change
- [ ] Autosave indicator appears briefly
- [ ] No errors in network tab

**Expected Network**:
- [ ] `PUT /api/games/{gameId}/draft` fires after 2.5s
- [ ] Payload includes `rosters` (player statuses) and `formation` (positions)

### 1.4 Draft Persistence
- [ ] Refresh the page (F5)
- [ ] Page reloads
- [ ] All 11 players still assigned to formation
- [ ] Formation layout unchanged

**Expected Network**:
- [ ] `GET /api/games/{gameId}` includes `lineupDraft` with saved data

### 1.5 Assign Bench Players
- [ ] Change 5 players status to "Bench" (via dropdown in Squad section)
- [ ] Players move to "Bench" section
- [ ] Wait for autosave (3 seconds)
- [ ] Refresh page
- [ ] Bench players persist

### 1.6 Transition to Played
- [ ] Click "Game Was Played" button
- [ ] Validation passes (11 players, 1 GK)
- [ ] Confirmation modal appears (if bench < 3 or > 7)
- [ ] Click "Confirm"
- [ ] Page transitions to "Played" state
- [ ] Game header shows "Played" badge
- [ ] Right sidebar now shows match events section

**Expected Network**:
- [ ] `POST /api/games/{gameId}/start-game` returns 200
- [ ] Response includes updated game with `status: "Played"`

---

## ✅ Test 2: Played Game (Record Events)

### 2.1 Load Played Game
- [ ] Navigate to game details for a "Played" game
- [ ] Page loads without errors
- [ ] Game header shows "Played" badge
- [ ] Left sidebar shows roster (Starting Lineup + Bench)
- [ ] Right sidebar shows match events section (Goals, Subs, Cards)
- [ ] Tactical board shows formation

**Expected Network**:
- [ ] `GET /api/games/{gameId}` returns 200
- [ ] `GET /api/games/{gameId}/goals` returns 200
- [ ] `GET /api/games/{gameId}/substitutions` returns 200
- [ ] `GET /api/games/{gameId}/cards` returns 200
- [ ] `GET /api/games/{gameId}/player-stats` returns 200
- [ ] `GET /api/games/{gameId}/timeline` returns 200

### 2.2 Add Goal
- [ ] Click "+ Goal" button in right sidebar
- [ ] Goal dialog opens
- [ ] Select scorer from dropdown (only active players shown)
- [ ] Select assister (optional)
- [ ] Enter minute (e.g., 23)
- [ ] Select goal type (e.g., "Open Play")
- [ ] Click "Save"
- [ ] Dialog closes
- [ ] Goal appears in events list
- [ ] Score updates in header

**Expected Network**:
- [ ] `POST /api/games/{gameId}/goals` returns 201
- [ ] `GET /api/games/{gameId}/player-stats` fires (stats recalculated)
- [ ] `GET /api/games/{gameId}/timeline` fires (timeline updated)

### 2.3 Add Substitution
- [ ] Click "+ Substitution" button
- [ ] Substitution dialog opens
- [ ] Select "Player Out" (must be on field)
- [ ] Select "Player In" (must be on bench)
- [ ] Enter minute (e.g., 60)
- [ ] Select reason (optional)
- [ ] Click "Save"
- [ ] Substitution appears in events list
- [ ] Timeline updates

**Expected Network**:
- [ ] `POST /api/games/{gameId}/substitutions` returns 201
- [ ] `GET /api/games/{gameId}/player-stats` fires
- [ ] `GET /api/games/{gameId}/timeline` fires

### 2.4 Add Card
- [ ] Click "+ Card" button
- [ ] Card dialog opens
- [ ] Select player (must be on field)
- [ ] Select card type (Yellow or Red)
- [ ] Enter minute
- [ ] Enter reason (optional)
- [ ] Click "Save"
- [ ] Card appears in events list

**Expected Network**:
- [ ] `POST /api/games/{gameId}/cards` returns 201
- [ ] `GET /api/games/{gameId}/timeline` fires

### 2.5 Update Player Report
- [ ] Click on a player card in left sidebar
- [ ] Performance dialog opens
- [ ] Shows: Minutes Played, Goals, Assists (read-only, calculated)
- [ ] Edit ratings: Physical, Technical, Tactical, Mental (1-5)
- [ ] Edit match stats: Fouls, Shooting, Passing, Duels (1-5 ratings)
- [ ] Add notes in text area
- [ ] Click "Save"
- [ ] Dialog closes
- [ ] Wait 3 seconds (autosave)

**Expected Network**:
- [ ] `POST /api/game-reports/batch` fires immediately (saves report)
- [ ] `PUT /api/games/{gameId}/draft` fires after 2.5s (saves to draft)

### 2.6 Fill Team Summaries
- [ ] Click "Defense Summary" in right sidebar
- [ ] Text area dialog opens
- [ ] Enter summary text (e.g., "Solid defensive performance")
- [ ] Click "Save"
- [ ] Dialog closes
- [ ] Defense summary checkmark appears

- [ ] Repeat for Midfield, Attack, General summaries
- [ ] Wait 3 seconds for autosave

**Expected Network**:
- [ ] `PUT /api/games/{gameId}/draft` fires after 2.5s
- [ ] Payload includes `teamSummary` with all summaries

### 2.7 Report Draft Persistence
- [ ] Refresh the page
- [ ] Team summaries persist (checkmarks shown)
- [ ] Player reports persist (click player to verify)
- [ ] Match stats persist

**Expected Network**:
- [ ] `GET /api/games/{gameId}` includes `reportDraft` with saved data

### 2.8 Submit Final Report
- [ ] Ensure all 4 team summaries filled
- [ ] Click "Submit Final Report" button
- [ ] Validation passes
- [ ] Confirmation dialog shows final score and summaries
- [ ] Click "Confirm"
- [ ] Page transitions to "Done" state
- [ ] Game header shows "Done" badge
- [ ] All UI becomes read-only

**Expected Network**:
- [ ] `PUT /api/games/{gameId}` fires with:
  - `status: "Done"`
  - `ourScore`, `opponentScore`
  - `matchDuration`
  - Team summaries
- [ ] `POST /api/game-reports/batch` fires (saves all reports)
- [ ] Player match stats saved to collection

---

## ✅ Test 3: Done Game (Read-Only)

### 3.1 Load Done Game
- [ ] Navigate to game details for a "Done" game
- [ ] Page loads without errors
- [ ] Game header shows "Done" badge, final score
- [ ] Left sidebar shows final roster
- [ ] Right sidebar shows finalized events
- [ ] Tactical board shows final formation

### 3.2 Read-Only Enforcement
- [ ] Try to drag players → Disabled
- [ ] Click player → Performance dialog opens in read-only mode
- [ ] All input fields disabled/read-only
- [ ] Dialog shows saved report data
- [ ] Close dialog

- [ ] Try to add goal/sub/card → Buttons disabled
- [ ] Try to edit team summaries → Text areas read-only or disabled

### 3.3 View Saved Reports
- [ ] Click each player
- [ ] Verify ratings display correctly
- [ ] Verify notes display correctly
- [ ] Verify match stats display correctly
- [ ] Verify calculated stats (minutes, goals, assists) match

**Expected Network**:
- [ ] `GET /api/games/{gameId}` returns finalized game
- [ ] `GET /api/game-reports` (filtered) returns saved reports
- [ ] `GET /api/games/{gameId}/player-match-stats` returns saved stats
- [ ] NO autosave calls fire

---

## ✅ Test 4: Edge Cases

### 4.1 Out-of-Position Warning
- [ ] In Scheduled game, drag a Defender to Forward position
- [ ] Confirmation dialog appears: "Out of Position Warning"
- [ ] Click "Confirm" → Player assigned
- [ ] OR click "Cancel" → Assignment canceled

### 4.2 Formation Change
- [ ] In Scheduled game with players assigned
- [ ] Change formation type (e.g., 1-4-4-2 → 1-4-3-3)
- [ ] Warning dialog: "Changing formation will clear all assignments"
- [ ] Click "OK" → Formation clears, players return to Squad
- [ ] OR click "Cancel" → Formation unchanged

### 4.3 Invalid Transition
- [ ] In Scheduled game with only 9 players assigned
- [ ] Click "Game Was Played"
- [ ] Error dialog: "Invalid Starting Lineup - Must have exactly 11 players"
- [ ] Transition blocked

### 4.4 Opponent Goal
- [ ] In Played game, click "+ Goal"
- [ ] Switch to "Opponent Goal" tab
- [ ] Enter minute and goal type
- [ ] Click "Save"
- [ ] Opponent score increments
- [ ] No scorer/assister required

### 4.5 Red Card Ejection
- [ ] In Played game, add a Red Card at minute 30
- [ ] Try to add a goal by same player at minute 40
- [ ] Player should NOT appear in scorer dropdown (ejected)

### 4.6 Auto-fill Reports
- [ ] In Played game with 11 players but only 5 reports filled
- [ ] "Auto-fill 6 remaining" button appears in right sidebar
- [ ] Click button
- [ ] Missing reports filled with default values (rating: 3, note: placeholder)
- [ ] Existing reports unchanged
- [ ] Autosave fires

---

## 🚨 Failure Criteria

Mark test as **FAILED** if any of these occur:

- [ ] Console errors (except expected warnings)
- [ ] Network request fails (4xx/5xx errors)
- [ ] UI does not update after action
- [ ] Data does not persist after refresh
- [ ] Validation allows invalid state
- [ ] Read-only mode allows editing
- [ ] Autosave does not fire within 3 seconds
- [ ] Stats calculate incorrectly
- [ ] Dialog does not open/close properly
- [ ] Layout/styling breaks
- [ ] Draft does not load/save correctly

---

## 📝 Test Results Template

```
Test Date: YYYY-MM-DD
Tester: [Name]
Branch: [branch-name]
Commit: [short-hash]

Test 1 (Scheduled): ✅ PASS / ❌ FAIL
  Issues: [if any]

Test 2 (Played): ✅ PASS / ❌ FAIL
  Issues: [if any]

Test 3 (Done): ✅ PASS / ❌ FAIL
  Issues: [if any]

Test 4 (Edge Cases): ✅ PASS / ❌ FAIL
  Issues: [if any]

Overall: ✅ PASS / ❌ FAIL
```

---

## 🔄 When to Run This Checklist

Run this complete checklist:
- ✅ After Phase 0 baseline (establish known good)
- ✅ After each Phase 1 extraction PR (verify no regression)
- ✅ After Phase 1 cutover PR (final verification)
- ✅ Before merging to main (final gate)


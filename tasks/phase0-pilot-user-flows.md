# GameDetailsPage — Critical User Flows

Baseline behavioral specification for regression testing.

---

## 🎯 Overview

`GameDetailsPage` manages the entire lifecycle of a game with three distinct states:
1. **Scheduled** — Plan roster and formation (draft mode)
2. **Played** — Record match events and player performance
3. **Done** — View finalized game reports (read-only)

---

## 📋 Flow 1: Scheduled Game (Draft Roster & Formation)

### Entry Conditions
- User navigates to `/game-details?id={gameId}`
- Game status is "Scheduled"
- User has permission to access the team

### Main Flow
1. **Page loads game data**
   - Fetches game directly from API
   - Falls back to DataProvider cache if direct fetch fails
   - Loads existing lineup draft (if saved previously)

2. **User manages roster**
   - Drag players from "Squad" section to formation positions
   - OR click position on tactical board → select player from dialog
   - OR change player status via dropdown (Starting Lineup / Bench / Not in Squad)
   - System auto-builds formation when players assigned to "Starting Lineup"

3. **User adjusts formation type**
   - Select different formation (e.g., 1-4-4-2 → 1-4-3-3)
   - System warns: "Changing formation will clear all position assignments"
   - If confirmed, formation resets and players return to roster pool

4. **Draft autosave (2.5s debounce)**
   - System automatically saves:
     - Roster statuses (Starting Lineup, Bench, Not in Squad)
     - Formation assignments (player → position mapping)
     - Formation type
   - Autosave indicator shows "Saving..." then disappears
   - Draft persists if user navigates away

5. **Mark game as "Played"**
   - User clicks "Game Was Played" button
   - System validates:
     - 11 players in starting lineup (mandatory)
     - 1 goalkeeper assigned (mandatory)
     - Bench size warning (if < 3 or > 7 players)
   - If valid, transitions to "Played" status
   - Creates GameRoster entries in database
   - Clears lineup draft

### Expected Behavior
- ✅ Roster changes trigger autosave after 2.5s
- ✅ Draft loads on page reload
- ✅ Formation auto-rebuilds when players change to "Starting Lineup"
- ✅ Manual drag-and-drop overrides auto-build (manual mode)
- ✅ Out-of-position warnings appear (e.g., Defender → Forward)
- ✅ Validation blocks invalid transitions

### Network Calls
1. `GET /api/games/{gameId}` — Fetch game with lineupDraft
2. `PUT /api/games/{gameId}/draft` — Autosave lineup draft (debounced)
3. `POST /api/games/{gameId}/start-game` — Transition to Played

---

## 📋 Flow 2: Played Game (Record Events & Performance)

### Entry Conditions
- Game status is "Played"
- User navigated from Scheduled → Played transition OR direct link

### Main Flow
1. **Page loads game + events**
   - Loads game data
   - Loads report draft (if saved previously)
   - Pre-fetches player stats (minutes/goals/assists) for instant display
   - Loads goals, substitutions, cards collections
   - Builds unified timeline of events

2. **User records match events**
   - **Add Goal**: Click "+Goal" → Dialog opens → Select scorer, assister, minute, type
   - **Add Substitution**: Click "+Sub" → Select player out/in, minute, reason
   - **Add Card**: Click "+Card" → Select player, card type (yellow/red), minute
   - Each event validates player eligibility at that minute

3. **User updates player reports**
   - Click player card → Performance dialog opens
   - Shows auto-calculated: Minutes Played, Goals, Assists (read-only)
   - Edit ratings: Physical, Technical, Tactical, Mental (1-5 scale)
   - Edit match stats: Fouls committed/received, shooting, passing, duels (1-5 ratings)
   - Add notes (free text)
   - Click Save → Updates report, autosaves to draft

4. **User fills team summaries**
   - Click "Defense Summary" → Text area dialog
   - Click "Midfield Summary" → Text area dialog
   - Click "Attack Summary" → Text area dialog
   - Click "General Summary" → Text area dialog
   - Each saves to report draft (autosave)

5. **Auto-fill remaining reports** (optional)
   - If some players have no reports, "Auto-fill X remaining" button appears
   - Click → Fills missing reports with default ratings (3/5) and placeholder note
   - Saves autosave draft

6. **Report draft autosave (2.5s debounce)**
   - System automatically saves:
     - Team summaries
     - Final score (calculated from goals)
     - Match duration
     - Player reports (ratings, notes)
     - Player match stats (fouls, shooting, passing, duels)
   - Draft persists if user navigates away

7. **Submit final report**
   - User clicks "Submit Final Report"
   - System validates:
     - All 4 team summaries filled (mandatory)
     - 11 players in starting lineup (already enforced)
     - Goalkeeper assigned (already enforced)
   - Confirmation dialog shows final score and summaries
   - If confirmed, transitions to "Done" status
   - Saves all reports to database
   - Saves player match stats to PlayerMatchStat collection
   - Clears report draft
   - Triggers analytics recalculation

### Expected Behavior
- ✅ Events validate player eligibility (on field, not ejected)
- ✅ Stats calculate in real-time after event changes
- ✅ Timeline updates after events added/edited/deleted
- ✅ Report draft autosaves after changes
- ✅ Draft loads on page reload
- ✅ Read-only stats fields display correct calculated values
- ✅ Validation blocks incomplete final submission

### Network Calls
1. `GET /api/games/{gameId}` — Fetch game with reportDraft
2. `GET /api/games/{gameId}/goals` — Fetch all goals
3. `GET /api/games/{gameId}/substitutions` — Fetch all substitutions
4. `GET /api/games/{gameId}/cards` — Fetch all cards
5. `GET /api/games/{gameId}/player-stats` — Fetch calculated stats
6. `GET /api/games/{gameId}/player-match-stats` — Fetch match stats
7. `GET /api/games/{gameId}/timeline` — Fetch unified event timeline
8. `PUT /api/games/{gameId}/draft` — Autosave report draft (debounced)
9. `POST /api/games/{gameId}/goals` — Create/update goal
10. `POST /api/games/{gameId}/substitutions` — Create/update substitution
11. `POST /api/games/{gameId}/cards` — Create/update card
12. `POST /api/game-reports/batch` — Save player reports
13. `PUT /api/games/{gameId}` — Submit final report (transition to Done)

---

## 📋 Flow 3: Done Game (View Finalized Reports)

### Entry Conditions
- Game status is "Done"
- User navigated from Played → Done transition OR direct link

### Main Flow
1. **Page loads finalized game**
   - Loads game data (score, duration, summaries)
   - Loads all events (goals, subs, cards)
   - Loads player reports from database
   - Loads player match stats from database
   - All UI is read-only

2. **User views reports**
   - Click player → Performance dialog opens (read-only)
   - All fields display saved values
   - No editing allowed
   - View team summaries (read-only)

3. **Optional: Edit report (admin feature)**
   - Click "Edit Report" button (if enabled)
   - Transitions game back to "Played" status
   - Allows editing (same as Played flow)

### Expected Behavior
- ✅ All dialogs open in read-only mode
- ✅ No autosave occurs
- ✅ Stats display from saved reports (not recalculated)
- ✅ Edit button only visible to authorized users

### Network Calls
1. `GET /api/games/{gameId}` — Fetch finalized game
2. `GET /api/games/{gameId}/goals` — Fetch all goals
3. `GET /api/games/{gameId}/substitutions` — Fetch all substitutions
4. `GET /api/games/{gameId}/cards` — Fetch all cards
5. `GET /api/game-reports` (filtered by gameId) — Fetch saved reports
6. `GET /api/games/{gameId}/player-match-stats` — Fetch saved match stats

---

## 🚦 Critical Validation Rules

### Starting Lineup
- Must have exactly 11 players
- Must include 1 goalkeeper
- Blocks "Game Was Played" if invalid

### Bench Size
- Warns if < 3 or > 7 players
- Allows continue with confirmation
- Does not block transition

### Event Eligibility
- **Goal**: Scorer and assister must be on roster and not ejected at minute
- **Card**: Player must be on field (not benched/subbed out) at minute
- **Substitution**: Player out must be on field, player in must be on bench

### Final Report
- All 4 team summaries must be filled
- Blocks submission if missing

---

## 🔍 Edge Cases to Test

1. **Direct fetch fails → fallback to DataProvider**
2. **Draft loads → overrides saved data** (draft has precedence)
3. **Autosave during finalization** → skipped (guard prevents conflict)
4. **Player dragged out-of-position** → confirmation dialog
5. **Formation change** → clears all assignments (with warning)
6. **Red card** → player becomes ineligible for future events
7. **Substitution** → player out becomes ineligible, player in becomes eligible
8. **Goal by opponent** → doesn't require team player selection
9. **Auto-fill reports** → fills only missing reports (doesn't overwrite existing)
10. **Navigate away during autosave** → draft saves complete before navigation

---

## ✅ Definition of "Behavior Parity"

After refactor, the following must remain EXACTLY the same:

1. **UI renders identically** (same sections, same layout, same styles)
2. **Validation messages identical** (same text, same triggers)
3. **Network requests identical** (same endpoints, same payloads, same timing)
4. **Autosave behavior identical** (same debounce, same skip conditions)
5. **Dialog flows identical** (same open/close/save behaviors)
6. **State transitions identical** (Scheduled → Played → Done)
7. **Read-only enforcement identical** (Done status prevents editing)
8. **Draft precedence identical** (draft loads override saved data)
9. **Player eligibility rules identical** (same validation logic)
10. **Stats calculation identical** (same values displayed)


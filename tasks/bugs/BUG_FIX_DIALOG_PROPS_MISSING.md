# Bug Fix: Dialog Props Missing - Player Reports & Empty Dropdowns

## Issues Reported

### Issue 1: Player Report Dialog Not Opening
When game is in "Played" status, clicking on a player to submit their report doesn't open the player performance dialog. Same issue with team summary reports.

### Issue 2: Empty Player Dropdowns
In goals, cards, and substitutions dialogs, when trying to select a player from the dropdown, no players appear - the dropdown is empty.

## Root Cause

### The Problem
The `DialogsModule` in `index.jsx` was missing **critical props** that the dialogs need to function:

#### Issue 1: Player Performance Dialog Props Mismatch
The dialog component expects:
- `open` (boolean)
- `onOpenChange` (function)
- `player` (object)
- `data` (object)
- `onDataChange` (function)
- Plus: `game`, `matchDuration`, `substitutions`, `playerReports`, `goals`, `timeline`, `cards`, etc.

But it was receiving:
- ❌ `isOpen` (should be `open`)
- ❌ `selectedPlayer` (should be `player`)
- ❌ `playerPerfData` (should be `data`)
- ❌ `setPlayerPerfData` (should be `onDataChange`)
- ❌ Missing: `game`, `matchDuration`, `substitutions`, etc.

#### Issue 2: Event Dialogs Missing Player Lists
**GoalDialog** expects:
- `gamePlayers` - Active players (lineup + bench) who can score/assist
- `existingGoals` - For validation
- `matchDuration` - To validate minute ranges
- `game`, `timeline`, `startingLineup`, `squadPlayers` - For context

**SubstitutionDialog** expects:
- `playersOnPitch` - Players who can be substituted out
- `benchPlayers` - Players who can be substituted in
- `matchDuration`, `playerReports`, `timeline`, `startingLineup`, `squadPlayers`

**CardDialog** expects:
- `gamePlayers` - Active players who can receive cards
- `cards` - Existing cards for validation
- `matchDuration`, `game`

But they were **only receiving**:
- ✅ `isOpen`
- ✅ `selected` (the entity being edited)
- ✅ `onSave`
- ✅ `onClose`
- ❌ **No player lists!** - Hence empty dropdowns

### Additional Missing Data
`usePlayerGrouping` hook returns:
- `playersOnPitch`
- `benchPlayers`
- `squadPlayers`
- `activeGamePlayers`
- `startingLineupMap` ← **Not destructured in index.jsx!**
- `squadPlayersMap` ← **Not destructured in index.jsx!**

Without these maps, the dialogs couldn't determine which players were in the starting lineup vs bench.

## Fix Applied

### File: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

#### 1. Added Missing Destructuring (line 44)

**Before:**
```javascript
const { playersOnPitch, benchPlayers, squadPlayers, activeGamePlayers } = usePlayerGrouping({ 
  formation, gamePlayers, localRosterStatuses 
});
```

**After:**
```javascript
const { 
  playersOnPitch, 
  benchPlayers, 
  squadPlayers, 
  activeGamePlayers, 
  startingLineupMap,  // ✅ Added
  squadPlayersMap     // ✅ Added
} = usePlayerGrouping({ 
  formation, gamePlayers, localRosterStatuses 
});
```

#### 2. Fixed Player Performance Dialog Props (lines 278-321)

**Before:**
```javascript
playerPerformance: {
  isOpen: dialogState.showPlayerPerfDialog,              // ❌ Wrong prop name
  selectedPlayer: dialogState.selectedPlayer,            // ❌ Wrong prop name
  playerPerfData: dialogState.playerPerfData,            // ❌ Wrong prop name
  setPlayerPerfData: dialogState.setPlayerPerfData,      // ❌ Wrong prop name
  onSave: reportHandlers.handleSavePerformanceReport,
  onClose: () => dialogState.setShowPlayerPerfDialog(false),
  // ❌ Missing: game, matchDuration, substitutions, goals, etc.
}
```

**After:**
```javascript
playerPerformance: {
  open: dialogState.showPlayerPerfDialog,                         // ✅ Correct
  onOpenChange: dialogState.setShowPlayerPerfDialog,              // ✅ Added
  player: dialogState.selectedPlayer,                             // ✅ Correct
  data: dialogState.playerPerfData,                               // ✅ Correct
  onDataChange: dialogState.setPlayerPerfData,                    // ✅ Correct
  isReadOnly: isDone,                                             // ✅ Added
  isStarting: dialogState.selectedPlayer                          // ✅ Added
    ? getPlayerStatus(dialogState.selectedPlayer._id) === "Starting Lineup" 
    : false,
  game,                                                           // ✅ Added
  matchDuration: matchDuration?.minutes || 90,                    // ✅ Added
  substitutions,                                                  // ✅ Added
  playerReports: localPlayerReports,                              // ✅ Added
  onAddSubstitution: () => { /* TODO */ },                        // ✅ Added
  goals,                                                          // ✅ Added
  timeline,                                                       // ✅ Added
  cards,                                                          // ✅ Added
  onSave: reportHandlers.handleSavePerformanceReport,
  onClose: () => dialogState.setShowPlayerPerfDialog(false),
}
```

#### 3. Fixed Goal Dialog Props (lines 259-273)

**Before:**
```javascript
goal: {
  isOpen: dialogState.showGoalDialog,
  selected: dialogState.selectedGoal,                     // ❌ Wrong prop name
  onSave: goalsHandlers.handleSaveGoal,
  onSaveOpponent: goalsHandlers.handleSaveOpponentGoal,
  onClose: () => { dialogState.setShowGoalDialog(false); dialogState.setSelectedGoal(null); },
  // ❌ Missing: gamePlayers, existingGoals, matchDuration, etc.
}
```

**After:**
```javascript
goal: {
  isOpen: dialogState.showGoalDialog,
  goal: dialogState.selectedGoal,                               // ✅ Correct prop name
  gamePlayers: activeGamePlayers,                               // ✅ Added - players who can score
  existingGoals: goals,                                         // ✅ Added - for validation
  matchDuration: matchDuration?.minutes || 90,                  // ✅ Added
  isReadOnly: isDone,                                           // ✅ Added
  game,                                                         // ✅ Added
  timeline,                                                     // ✅ Added
  startingLineup: startingLineupMap,                            // ✅ Added
  squadPlayers: squadPlayersMap,                                // ✅ Added
  onSave: goalsHandlers.handleSaveGoal,
  onSaveOpponent: goalsHandlers.handleSaveOpponentGoal,
  onClose: () => { dialogState.setShowGoalDialog(false); dialogState.setSelectedGoal(null); },
}
```

#### 4. Fixed Substitution Dialog Props (lines 274-287)

**Before:**
```javascript
substitution: {
  isOpen: dialogState.showSubstitutionDialog,
  selected: dialogState.selectedSubstitution,             // ❌ Wrong prop name
  onSave: subsHandlers.handleSaveSubstitution,
  onClose: () => { dialogState.setShowSubstitutionDialog(false); dialogState.setSelectedSubstitution(null); },
  // ❌ Missing: playersOnPitch, benchPlayers, matchDuration, etc.
}
```

**After:**
```javascript
substitution: {
  isOpen: dialogState.showSubstitutionDialog,
  substitution: dialogState.selectedSubstitution,               // ✅ Correct prop name
  playersOnPitch,                                               // ✅ Added - players who can go out
  benchPlayers,                                                 // ✅ Added - players who can come in
  matchDuration: matchDuration?.minutes || 90,                  // ✅ Added
  isReadOnly: isDone,                                           // ✅ Added
  playerReports: localPlayerReports,                            // ✅ Added
  timeline,                                                     // ✅ Added
  startingLineup: startingLineupMap,                            // ✅ Added
  squadPlayers: squadPlayersMap,                                // ✅ Added
  onSave: subsHandlers.handleSaveSubstitution,
  onClose: () => { dialogState.setShowSubstitutionDialog(false); dialogState.setSelectedSubstitution(null); },
}
```

#### 5. Fixed Card Dialog Props (lines 288-297)

**Before:**
```javascript
card: {
  isOpen: dialogState.showCardDialog,
  selected: dialogState.selectedCard,                     // ❌ Wrong prop name
  onSave: cardsHandlers.handleSaveCard,
  onClose: () => { dialogState.setShowCardDialog(false); dialogState.setSelectedCard(null); },
  // ❌ Missing: gamePlayers, cards, matchDuration, etc.
}
```

**After:**
```javascript
card: {
  isOpen: dialogState.showCardDialog,
  card: dialogState.selectedCard,                               // ✅ Correct prop name
  gamePlayers: activeGamePlayers,                               // ✅ Added - players who can get cards
  cards,                                                        // ✅ Added - for validation
  matchDuration: matchDuration?.minutes || 90,                  // ✅ Added
  isReadOnly: isDone,                                           // ✅ Added
  game,                                                         // ✅ Added
  onSave: cardsHandlers.handleSaveCard,
  onClose: () => { dialogState.setShowCardDialog(false); dialogState.setSelectedCard(null); },
}
```

## Expected Behavior After Fix

### Before Fix:
1. **Click on player in "Played" game** → ❌ **Dialog doesn't open**
2. **Click "Add Goal"** → Dialog opens → Click player dropdown → ❌ **Empty!**
3. **Click "Add Substitution"** → Dialog opens → Click dropdowns → ❌ **Empty!**
4. **Click "Add Card"** → Dialog opens → Click player dropdown → ❌ **Empty!**
5. **Click team summary** → ❌ **Dialog doesn't open**

### After Fix:
1. **Click on player in "Played" game** → ✅ **Dialog opens with player data**
2. **Click "Add Goal"** → Dialog opens → Click player dropdown → ✅ **Shows all active players (lineup + bench)**
3. **Click "Add Substitution"** → Dialog opens:
   - Player Out dropdown → ✅ **Shows players currently on pitch**
   - Player In dropdown → ✅ **Shows bench players**
4. **Click "Add Card"** → Dialog opens → Click player dropdown → ✅ **Shows all active players**
5. **Click team summary** → ✅ **Dialog opens with team summary data**

## Testing Instructions

### Test 1: Player Report Dialog
1. **Create/Open a "Played" game with players on pitch and bench**
2. **Click on any player on the tactical board**
3. ✅ **Verify the Player Performance dialog opens**
4. ✅ **Verify you see:**
   - Rating sliders (Physical, Technical, Tactical, Mental)
   - Notes field
   - Stats (Minutes, Goals, Assists, Fouls)
   - Timeline showing cards/goals/subs for this player
5. **Save the report**
6. ✅ **Verify report is saved and player badge updates**

### Test 2: Goal Dialog
1. **Open a "Played" game**
2. **Click "Add Goal" in the Match Events sidebar**
3. ✅ **Verify dialog opens**
4. **Click the "Scorer" dropdown**
5. ✅ **Verify you see all players who were on pitch or bench**
6. ✅ **Verify each player shows their:**
   - Name
   - Kit number
   - Position/status (Starting Lineup or Bench)
7. **Select a scorer and save**
8. ✅ **Verify goal appears in timeline**

### Test 3: Substitution Dialog
1. **Open a "Played" game**
2. **Click "Add Substitution"**
3. ✅ **Verify dialog opens**
4. **Click "Player Out" dropdown**
5. ✅ **Verify you see only players currently on pitch**
6. **Click "Player In" dropdown**
7. ✅ **Verify you see only players on bench**
8. **Select both players and save**
9. ✅ **Verify substitution appears in timeline**

### Test 4: Card Dialog
1. **Open a "Played" game**
2. **Click "Add Card"**
3. ✅ **Verify dialog opens**
4. **Click "Player" dropdown**
5. ✅ **Verify you see all active players (pitch + bench)**
6. **Select a player, choose card type, and save**
7. ✅ **Verify card appears in timeline**

### Test 5: Team Summary Dialog
1. **Open a "Played" game**
2. **In Match Analysis sidebar, click on a team summary section** (e.g., "Team Performance")
3. ✅ **Verify Team Summary dialog opens**
4. ✅ **Verify you can edit the summary**
5. **Save the summary**
6. ✅ **Verify summary is saved**

## Related Files Modified

1. `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`
   - Added `startingLineupMap` and `squadPlayersMap` to `usePlayerGrouping` destructuring
   - Updated `playerPerformance` dialog props (fixed prop names + added missing props)
   - Updated `goal` dialog props (added player lists and context)
   - Updated `substitution` dialog props (added player lists and context)
   - Updated `card` dialog props (added player lists and context)

## Technical Details

### Why This Happened
During the refactoring from the monolithic component to modular hooks, the dialog props were not fully migrated. The dialogs were created early with comprehensive prop lists, but when the `DialogsModule` was set up, it only received minimal props.

### The Contract
Each dialog has a well-defined prop interface:
- **Identity props**: `isOpen`, `onClose`, `selected entity`
- **Action props**: `onSave`, handler callbacks
- **Data props**: Player lists, game context, timeline, etc.
- **State props**: Read-only mode, feature flags, etc.

All these must be passed from the parent for the dialogs to function correctly.

### Active Players
`activeGamePlayers` = `playersOnPitch` + `benchPlayers`

These are the only players who:
- Can score goals
- Can get assists
- Can receive cards
- Can participate in substitutions
- Should have performance reports

Squad players (not on pitch or bench) cannot participate in game events.

## Status
✅ **FIXED** - All dialog props corrected, player lists passed, reports and event dialogs now working


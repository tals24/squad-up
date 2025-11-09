# Refactoring Plan: Remove Denormalized Data from GameRoster

## Problem Statement

### The Issue

The `GameRoster` model (`backend/src/models/GameRoster.js`) denormalizes data by storing `playerName`, `gameTitle`, and `rosterEntry` as plain text fields.

**Problems:**
- When a Player's name is updated, all `GameRoster` documents with that player have stale `playerName` values
- When a Game's details (like opponent) are changed, all `GameRoster` documents for that game have stale `gameTitle` values
- This leads to UI inconsistencies where old names/titles are displayed
- Data integrity issues - the denormalized data can become incorrect over time
- Maintenance burden - requires manual updates or complex sync logic

**Current State:**
- `GameRoster` schema includes: `gameTitle`, `playerName`, `rosterEntry` (denormalized)
- Pre-save hook populates these fields from referenced `Game` and `Player` documents
- API routes (`games.js`, `gameRosters.js`) save these denormalized fields
- Frontend sends these fields when creating/updating rosters

### The Solution

**Remove denormalization entirely.** The frontend already has access to:
- `gamePlayers` array (all players for the game's team)
- `game` object (contains `gameTitle`)

The UI components should perform lookups from this local state instead of relying on stale, denormalized text fields.

**Benefits:**
- ✅ Always displays fresh data (from current `gamePlayers` and `game` state)
- ✅ No data sync issues
- ✅ Simpler data model
- ✅ Reduced storage (no redundant text fields)
- ✅ Better data integrity

---

## Architecture Overview

### Current Flow (With Denormalization)

```
┌─────────────────┐
│  Player Update  │  Player.fullName changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GameRoster     │  playerName is now STALE ❌
│  (denormalized)│  (still has old name)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend UI    │  Displays stale playerName ❌
└─────────────────┘
```

### New Flow (Without Denormalization)

```
┌─────────────────┐
│  Player Update  │  Player.fullName changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  gamePlayers    │  Updated via refreshData()
│  (local state)  │  Always fresh ✅
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend UI    │  Looks up from gamePlayers ✅
│  (playerMap)    │  Always displays current name
└─────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend - Model Refactor (GameRoster.js)

**File:** `backend/src/models/GameRoster.js`

#### Step 1.1: Remove Denormalized Fields from Schema

**Current Schema:**
```javascript
const gameRosterSchema = new mongoose.Schema({
  gameRosterID: { ... },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  status: { ... },
  
  // ❌ REMOVE THESE:
  gameTitle: { type: String, required: true },
  playerName: { type: String, required: true },
  rosterEntry: { type: String, required: true }
}, { timestamps: true });
```

**New Schema:**
```javascript
const gameRosterSchema = new mongoose.Schema({
  gameRosterID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Links to Game and Player
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  
  status: {
    type: String,
    required: true,
    enum: ['Starting Lineup', 'Bench', 'Unavailable', 'Not in Squad'],
    default: 'Not in Squad'
  }
  
  // ✅ Removed: gameTitle, playerName, rosterEntry
}, {
  timestamps: true
});
```

#### Step 1.2: Remove Pre-Save Hook

**Current Code (lines 60-79):**
```javascript
// ❌ REMOVE THIS ENTIRE BLOCK
gameRosterSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('game') || this.isModified('player')) {
    // Populate the game and player to get their names
    await this.populate('game player');
    
    if (this.game) {
      this.gameTitle = this.game.gameTitle;
    }
    
    if (this.player) {
      this.playerName = this.player.fullName;
    }
    
    // Generate roster entry
    this.rosterEntry = `${this.gameTitle} - ${this.playerName}`;
  }
  
  next();
});
```

**Action:** Delete this entire pre-save hook block.

#### Step 1.3: Update Indexes (Optional Cleanup)

The indexes remain the same - they don't reference the removed fields:
```javascript
// These indexes are still valid
gameRosterSchema.index({ gameRosterID: 1 });
gameRosterSchema.index({ game: 1 });
gameRosterSchema.index({ player: 1 });
gameRosterSchema.index({ status: 1 });
gameRosterSchema.index({ game: 1, player: 1 }, { unique: true });
```

**No changes needed to indexes.**

---

### Phase 2: Backend - API Refactor (Routes)

#### File 1: `backend/src/routes/games.js`

**Route:** `POST /api/games/:gameId/start-game`

**Current Code (lines ~500-536):**
```javascript
// ❌ CURRENT CODE (lines ~500-536)
for (const rosterData of rosters) {
  const { playerId, status } = rosterData;
  const player = await Player.findById(playerId);
  
  // Build denormalized fields
  const finalPlayerName = playerName || player?.fullName || 'Unknown Player';
  const finalGameTitle = providedGameTitle || gameTitle;
  const finalRosterEntry = rosterEntry || `${finalGameTitle} - ${finalPlayerName}`;

  rosterEntries.push({
    game: gameId,
    player: playerId,
    status: status || 'Not in Squad',
    playerName: finalPlayerName,        // ❌ REMOVE
    gameTitle: finalGameTitle,          // ❌ REMOVE
    rosterEntry: finalRosterEntry       // ❌ REMOVE
  });
}

// Upsert all roster entries
for (const rosterData of rosterEntries) {
  const gameRoster = await GameRoster.findOneAndUpdate(
    { game: rosterData.game, player: rosterData.player },
    {
      status: rosterData.status,
      playerName: rosterData.playerName,    // ❌ REMOVE
      gameTitle: rosterData.gameTitle,      // ❌ REMOVE
      rosterEntry: rosterData.rosterEntry  // ❌ REMOVE
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  rosterResults.push(gameRoster);
}
```

**Refactored Code:**
```javascript
// ✅ NEW CODE
for (const rosterData of rosters) {
  const { playerId, status } = rosterData;
  
  // Validate player exists (optional - for better error messages)
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  rosterEntries.push({
    game: gameId,
    player: playerId,
    status: status || 'Not in Squad'
    // ✅ Removed: playerName, gameTitle, rosterEntry
  });
}

// Upsert all roster entries (within transaction)
const rosterResults = [];
for (const rosterData of rosterEntries) {
  const gameRoster = await GameRoster.findOneAndUpdate(
    { game: rosterData.game, player: rosterData.player },
    {
      status: rosterData.status
      // ✅ Only save: game, player, status
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session // Include session for transaction
    }
  );

  rosterResults.push(gameRoster);
}
```

**Also remove from function parameters:**
- Remove `playerName`, `gameTitle`, `rosterEntry` from the `validateLineup` function if they're used there
- Remove any logic that extracts these from `rosterData` in the loop

---

#### File 2: `backend/src/routes/gameRosters.js`

**Route:** `POST /api/game-rosters/batch`

**Current Code (lines ~178-209):**
```javascript
// ❌ CURRENT CODE
for (const rosterData of rosters) {
  const { playerId, status, playerName, gameTitle, rosterEntry } = rosterData;
  
  // Find existing roster entry or create new
  let gameRoster = await GameRoster.findOne({ 
    game: gameId, 
    player: playerId 
  });

  if (gameRoster) {
    // Update existing
    gameRoster.status = status;
    if (playerName) gameRoster.playerName = playerName;        // ❌ REMOVE
    if (gameTitle) gameRoster.gameTitle = gameTitle;            // ❌ REMOVE
    if (rosterEntry) gameRoster.rosterEntry = rosterEntry;     // ❌ REMOVE
    await gameRoster.save();
  } else {
    // Create new
    gameRoster = new GameRoster({
      game: gameId,
      player: playerId,
      status: status || 'Not in Squad',
      playerName: playerName || '',      // ❌ REMOVE
      gameTitle: gameTitle || '',        // ❌ REMOVE
      rosterEntry: rosterEntry || ''    // ❌ REMOVE
    });
    await gameRoster.save();
  }
  
  await gameRoster.populate('game player');
  results.push(gameRoster);
}
```

**Refactored Code:**
```javascript
// ✅ NEW CODE
for (const rosterData of rosters) {
  const { playerId, status } = rosterData;
  
  // Use findOneAndUpdate with upsert for atomic operation
  const gameRoster = await GameRoster.findOneAndUpdate(
    { game: gameId, player: playerId },
    {
      status: status || 'Not in Squad'
      // ✅ Only save: game, player, status
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  await gameRoster.populate('game player');
  results.push(gameRoster);
}
```

**Also update GET routes (optional cleanup):**

The GET routes already use `.populate()`, so they're fine. However, we can remove any sorting by denormalized fields:

**Current (line 42):**
```javascript
.sort({ gameTitle: 1, playerName: 1 });  // ❌ Uses denormalized fields
```

**New:**
```javascript
.sort({ 'game.gameTitle': 1, 'player.fullName': 1 });  // ✅ Uses populated fields
// OR, if game/player are not populated:
.sort({ game: 1, player: 1 });  // ✅ Sort by IDs
```

**Current (line 60):**
```javascript
.sort({ status: 1, playerName: 1 });  // ❌ Uses denormalized field
```

**New:**
```javascript
.sort({ status: 1, 'player.fullName': 1 });  // ✅ Uses populated field
// OR:
.sort({ status: 1, player: 1 });  // ✅ Sort by player ID
```

---

### Phase 3: Frontend - UI Refactor (Lookups)

#### File 1: `src/features/game-management/components/GameDetailsPage/index.jsx`

**Step 3.1: Create Player Map for Efficient Lookups**

Add this `useMemo` hook after the `gamePlayers` state is set:

```javascript
// ✅ ADD THIS (after gamePlayers useEffect, around line 185)
// Create efficient lookup map for player data
const playerMap = useMemo(() => {
  const map = new Map();
  gamePlayers.forEach(player => {
    map.set(player._id, player);
  });
  return map;
}, [gamePlayers]);
```

**Step 3.2: Update `updatePlayerStatus` Function**

**Current Code (lines ~422-450):**
```javascript
// ❌ CURRENT CODE
const updatePlayerStatus = async (playerId, newStatus) => {
  setLocalRosterStatuses((prev) => ({ ...prev, [playerId]: newStatus }));
  
  try {
    const response = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        gameId: gameId,
        rosters: [{
          playerId: playerId,
          playerName: gamePlayers.find(p => p._id === playerId)?.fullName || gamePlayers.find(p => p._id === playerId)?.name || 'Unknown Player',  // ❌ REMOVE
          gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',  // ❌ REMOVE
          rosterEntry: newStatus,  // ❌ REMOVE
          status: newStatus
        }]
      }),
    });
    // ... rest of function
  }
};
```

**Refactored Code:**
```javascript
// ✅ NEW CODE
const updatePlayerStatus = async (playerId, newStatus) => {
  setLocalRosterStatuses((prev) => ({ ...prev, [playerId]: newStatus }));
  
  try {
    const response = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        gameId: gameId,
        rosters: [{
          playerId: playerId,
          status: newStatus
          // ✅ Removed: playerName, gameTitle, rosterEntry
        }]
      }),
    });
    // ... rest of function
  }
};
```

**Step 3.3: Update `executeGameWasPlayed` Function**

**Current Code (lines ~638-644):**
```javascript
// ❌ CURRENT CODE
const rosterUpdates = gamePlayers.map((player) => ({
  playerId: player._id,
  playerName: player.fullName || player.name || 'Unknown Player',  // ❌ REMOVE
  gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',  // ❌ REMOVE
  rosterEntry: getPlayerStatus(player._id),  // ❌ REMOVE
  status: getPlayerStatus(player._id),
}));
```

**Refactored Code:**
```javascript
// ✅ NEW CODE
const rosterUpdates = gamePlayers.map((player) => ({
  playerId: player._id,
  status: getPlayerStatus(player._id)
  // ✅ Removed: playerName, gameTitle, rosterEntry
}));
```

**Step 3.4: Pass `playerMap` to Child Components**

Update the component props:

```javascript
// ✅ UPDATE THESE COMPONENT RENDERS
<GameDayRosterSidebar
  playersOnPitch={playersOnPitch}
  benchPlayers={benchPlayers}
  squadPlayers={squadPlayers}
  playerMap={playerMap}  // ✅ ADD THIS
  // ... other props
/>

<TacticalBoard
  formations={formations}
  formationType={formationType}
  positions={positions}
  formation={formation}
  playerMap={playerMap}  // ✅ ADD THIS
  // ... other props
/>
```

**Note:** The frontend components (`GameDayRosterSidebar`, `TacticalBoard`) already use `player` objects from `gamePlayers`, not from `gameRosters`. So they may not need changes, but we should verify and add `playerMap` as a prop for consistency and future-proofing.

---

#### File 2: `src/features/game-management/components/GameDetailsPage/components/GameDayRosterSidebar.jsx`

**Current State:**
This component already receives `playersOnPitch`, `benchPlayers`, and `squadPlayers` as props, which are arrays of player objects (not GameRoster objects). So it already uses `player.fullName` from the player objects.

**Verification:**
- ✅ Component uses `player.fullName` (from player objects)
- ✅ No direct usage of `roster.playerName`

**Action:** No changes needed, but add `playerMap` prop for consistency:

```javascript
// ✅ ADD playerMap prop (optional, for future use)
export default function GameDayRosterSidebar({
  playersOnPitch,
  benchPlayers,
  squadPlayers,
  playerMap,  // ✅ ADD (optional)
  // ... other props
}) {
  // Component already uses player.fullName, so no changes needed
  // But playerMap is available if needed for lookups
}
```

---

#### File 3: `src/features/game-management/components/GameDetailsPage/components/TacticalBoard.jsx`

**Current State:**
This component receives `formation` which maps position IDs to player objects (or null). It already uses `player.fullName` from the player objects.

**Verification:**
- ✅ Component uses `player.fullName` (from player objects in formation)
- ✅ No direct usage of `roster.playerName`

**Action:** No changes needed, but add `playerMap` prop for consistency:

```javascript
// ✅ ADD playerMap prop (optional, for future use)
export default function TacticalBoard({ 
  formations, 
  formationType, 
  positions, 
  formation, 
  playerMap,  // ✅ ADD (optional)
  // ... other props
}) {
  // Component already uses player.fullName, so no changes needed
  // But playerMap is available if needed for lookups
}
```

---

### Phase 4: Data Migration (Optional)

**Important:** Existing `GameRoster` documents in the database will still have the old `playerName`, `gameTitle`, and `rosterEntry` fields. These fields will be ignored by the new schema, but they'll remain in the database.

**Migration Options:**

#### Option 1: No Migration (Recommended)
- Leave old fields in database (they'll be ignored)
- No data loss
- Simplest approach

#### Option 2: Cleanup Migration (Optional)
If you want to clean up the database:

```javascript
// Migration script: backend/scripts/migrate-remove-denormalized-fields.js
const mongoose = require('mongoose');
const GameRoster = require('../src/models/GameRoster');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Remove denormalized fields from all GameRoster documents
  const result = await GameRoster.updateMany(
    {},
    {
      $unset: {
        playerName: "",
        gameTitle: "",
        rosterEntry: ""
      }
    }
  );
  
  console.log(`Removed denormalized fields from ${result.modifiedCount} GameRoster documents`);
  await mongoose.connection.close();
}

migrate();
```

**Run migration:**
```bash
node backend/scripts/migrate-remove-denormalized-fields.js
```

---

## Testing Plan

### Test 1: Backend Model Validation

**Steps:**
1. Create a new GameRoster document without `playerName`, `gameTitle`, `rosterEntry`
2. Verify it saves successfully
3. Verify pre-save hook doesn't run (or doesn't error)

**Expected:**
- ✅ Document saves with only `game`, `player`, `status`
- ✅ No errors about missing required fields

---

### Test 2: API Endpoint - Start Game

**Steps:**
1. Create a game with status "Scheduled"
2. Assign 11 players to starting lineup
3. Click "Game Was Played"
4. Check MongoDB `gameRosters` collection

**Expected:**
- ✅ GameRoster documents created with only `game`, `player`, `status`
- ✅ No `playerName`, `gameTitle`, `rosterEntry` fields
- ✅ Game status changes to "Played"

---

### Test 3: API Endpoint - Batch Update

**Steps:**
1. Update a player's status via `updatePlayerStatus` function
2. Check MongoDB `gameRosters` collection

**Expected:**
- ✅ GameRoster document updated with only `status` field
- ✅ No `playerName`, `gameTitle`, `rosterEntry` fields updated

---

### Test 4: Frontend UI - Player Name Display

**Steps:**
1. Open a game with existing roster
2. Verify player names display correctly in:
   - GameDayRosterSidebar (all sections)
   - TacticalBoard (formation positions)
3. Update a player's name in the Players page
4. Refresh the game page
5. Verify player name updates immediately

**Expected:**
- ✅ Player names display correctly from `gamePlayers` state
- ✅ After player name update, UI shows new name (no stale data)

---

### Test 5: Frontend UI - Game Title Display

**Steps:**
1. Open a game
2. Verify game title displays correctly in header
3. Update game opponent/details
4. Refresh the game page
5. Verify game title updates immediately

**Expected:**
- ✅ Game title displays correctly from `game` state
- ✅ After game update, UI shows new title (no stale data)

---

### Test 6: Edge Cases

**Test 6.1: Player Not Found**
- If `playerMap.get(playerId)` returns `undefined`, verify UI handles gracefully
- Should show "Loading..." or player ID, not crash

**Test 6.2: Empty Roster**
- Game with no roster entries
- Verify UI doesn't crash
- Verify empty states display correctly

**Test 6.3: Rapid Updates**
- Update player status multiple times quickly
- Verify no race conditions
- Verify final state is correct

---

## Rollback Plan

If issues arise:

1. **Quick Rollback:** Revert schema changes (add back `playerName`, `gameTitle`, `rosterEntry` fields)
2. **Restore Pre-Save Hook:** Re-add the pre-save hook that populates denormalized fields
3. **Restore API Logic:** Re-add denormalized field assignments in routes
4. **Restore Frontend:** Re-add denormalized fields in API payloads

**Rollback Code (GameRoster.js):**
```javascript
// Re-add fields to schema
gameTitle: { type: String, required: true },
playerName: { type: String, required: true },
rosterEntry: { type: String, required: true }

// Re-add pre-save hook
gameRosterSchema.pre('save', async function(next) {
  // ... previous hook code
});
```

---

## Summary

### What We're Fixing

- ❌ **Before:** Denormalized `playerName`, `gameTitle`, `rosterEntry` fields that become stale
- ✅ **After:** Clean schema with only references; UI performs lookups from fresh state

### Key Changes

1. ✅ **Backend Model:** Remove `playerName`, `gameTitle`, `rosterEntry` from schema
2. ✅ **Backend Routes:** Remove denormalized field assignments
3. ✅ **Frontend:** Remove denormalized fields from API payloads
4. ✅ **Frontend:** Create `playerMap` for efficient lookups (optional, for consistency)

### Benefits

- ✅ **Data Integrity:** Always displays current player names and game titles
- ✅ **Simpler Model:** Fewer fields to maintain
- ✅ **Reduced Storage:** No redundant text data
- ✅ **Better Performance:** No pre-save hook overhead
- ✅ **Easier Maintenance:** No sync logic needed

---

## Implementation Checklist

- [ ] Phase 1: Remove denormalized fields from `GameRoster.js` schema
- [ ] Phase 1: Remove pre-save hook from `GameRoster.js`
- [ ] Phase 2: Refactor `POST /api/games/:gameId/start-game` in `games.js`
- [ ] Phase 2: Refactor `POST /api/game-rosters/batch` in `gameRosters.js`
- [ ] Phase 2: Update GET route sorting (optional)
- [ ] Phase 3: Create `playerMap` in `GameDetailsPage/index.jsx`
- [ ] Phase 3: Update `updatePlayerStatus` function
- [ ] Phase 3: Update `executeGameWasPlayed` function
- [ ] Phase 3: Pass `playerMap` to child components (optional)
- [ ] Phase 4: Run data migration (optional)
- [ ] Test: Backend model validation
- [ ] Test: API endpoints
- [ ] Test: Frontend UI display
- [ ] Test: Edge cases
- [ ] Commit and push changes

---

## Files Modified

**Backend:**
- `backend/src/models/GameRoster.js` - Remove denormalized fields and pre-save hook
- `backend/src/routes/games.js` - Remove denormalized field assignments
- `backend/src/routes/gameRosters.js` - Remove denormalized field assignments

**Frontend:**
- `src/features/game-management/components/GameDetailsPage/index.jsx` - Remove denormalized fields from API payloads, add `playerMap`
- `src/features/game-management/components/GameDetailsPage/components/GameDayRosterSidebar.jsx` - Add `playerMap` prop (optional)
- `src/features/game-management/components/GameDetailsPage/components/TacticalBoard.jsx` - Add `playerMap` prop (optional)

**Optional:**
- `backend/scripts/migrate-remove-denormalized-fields.js` - Migration script (if cleanup desired)

---

**End of Plan**


# Refactoring Plan: Atomic Game State Transition

## Problem Statement

**Critical Data Integrity Vulnerability:** Non-Atomic State Transition

The workflow for moving a game from `Scheduled` to `Played` is not atomic. It's orchestrated by the client, which makes two separate, non-transactional API calls:

1. `PUT /api/games/:id {status: 'Played'}`
2. `POST /api/game-rosters/batch` (to save the final lineup)

**Race Condition Scenario:**
- If call 1 succeeds but call 2 fails (due to network error, validation, or server crash), we are left with a corrupted state: the game is `Played` but has no final lineup, breaking all downstream logic.
- If call 2 succeeds but call 1 fails, we have a lineup saved but the game is still `Scheduled`, which is also inconsistent.

**Impact:**
- Data corruption
- Inconsistent application state
- Broken downstream logic (calculations, reports, etc.)
- Poor user experience (partial updates)

---

## Solution Overview

**Create a single, atomic, idempotent backend endpoint** that:
1. Validates the lineup on the backend
2. Updates game status to `Played`
3. Saves the final lineup to `GameRoster`
4. Uses MongoDB transactions to ensure atomicity
5. Is idempotent (can be safely retried)

---

## Phase 1: Backend Plan (The Atomic Endpoint)

### Step 1.1: Create New Route in `backend/src/routes/games.js`

**Route:** `POST /api/games/:gameId/start-game`

**Purpose:** Atomically transition game from `Scheduled` to `Played` and save the final lineup.

**Code Implementation:**

```javascript
// Add to backend/src/routes/games.js

const mongoose = require('mongoose');
const GameRoster = require('../models/GameRoster');
const Player = require('../models/Player');

/**
 * POST /api/games/:gameId/start-game
 * Atomically transition game from Scheduled to Played and save final lineup
 * 
 * This endpoint:
 * 1. Validates user has access to the game (via checkGameAccess middleware)
 * 2. Validates the lineup (11 starters, goalkeeper, etc.)
 * 3. Uses MongoDB transaction to atomically:
 *    - Update game status to 'Played'
 *    - Save/update all roster entries
 * 4. Returns success or detailed error
 * 
 * Request Body:
 * {
 *   rosters: [
 *     {
 *       playerId: string,
 *       status: 'Starting Lineup' | 'Bench' | 'Unavailable' | 'Not in Squad',
 *       playerName?: string,  // Optional, will be populated if missing
 *       gameTitle?: string,   // Optional, will be populated if missing
 *       rosterEntry?: string  // Optional, will be auto-generated if missing
 *     }
 *   ]
 * }
 */
router.post('/:gameId/start-game', authenticateJWT, checkGameAccess, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { gameId } = req.params;
    const { rosters } = req.body;

    // Get game from middleware (already validated and attached)
    const game = req.game;

    // Step 1: Validate request body
    if (!rosters || !Array.isArray(rosters)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid request format. Expected { rosters: [{ playerId, status, ... }] }'
      });
    }

    // Step 2: Validate game is in Scheduled status
    if (game.status !== 'Scheduled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `Game cannot be started. Current status: ${game.status}. Only 'Scheduled' games can be started.`
      });
    }

    // Step 3: Backend validation of lineup
    const validationResult = await validateLineup(rosters, gameId, session);
    if (!validationResult.isValid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: validationResult.error,
        details: validationResult.details
      });
    }

    // Step 4: Prepare roster entries for upsert
    const rosterEntries = [];
    for (const rosterData of rosters) {
      const { playerId, status, playerName, gameTitle, rosterEntry } = rosterData;

      // Populate player if needed
      let player = null;
      if (playerId) {
        player = await Player.findById(playerId).session(session);
        if (!player) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            error: `Player not found: ${playerId}`
          });
        }
      }

      // Build roster entry
      const rosterEntryData = {
        game: gameId,
        player: playerId,
        status: status || 'Not in Squad',
        playerName: playerName || player?.fullName || 'Unknown Player',
        gameTitle: gameTitle || game.gameTitle || `${game.teamName} vs ${game.opponent}`,
        rosterEntry: rosterEntry || `${gameTitle || game.gameTitle || 'Unknown Game'} - ${playerName || player?.fullName || 'Unknown Player'}`
      };

      rosterEntries.push(rosterEntryData);
    }

    // Step 5: Upsert all roster entries (within transaction)
    const rosterResults = [];
    for (const rosterData of rosterEntries) {
      const { game, player, status, playerName, gameTitle, rosterEntry } = rosterData;

      // Use findOneAndUpdate with upsert for atomic operation
      const gameRoster = await GameRoster.findOneAndUpdate(
        { game, player },
        {
          status,
          playerName,
          gameTitle,
          rosterEntry
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

    // Step 6: Update game status to 'Played' (within transaction)
    game.status = 'Played';
    await game.save({ session });

    // Step 7: Commit transaction
    await session.commitTransaction();

    // Step 8: Populate references for response (after transaction)
    await Promise.all(
      rosterResults.map(roster => 
        roster.populate('game player')
      )
    );

    res.status(200).json({
      success: true,
      message: 'Game started successfully',
      data: {
        game: {
          _id: game._id,
          status: game.status,
          gameTitle: game.gameTitle
        },
        rosters: rosterResults,
        rosterCount: rosterResults.length
      }
    });

  } catch (error) {
    // Abort transaction on any error
    await session.abortTransaction();
    
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start game',
      message: error.message
    });
  } finally {
    // Always end the session
    session.endSession();
  }
});
```

### Step 1.2: Create Backend Validation Function

**File:** `backend/src/routes/games.js` (or create `backend/src/utils/gameValidation.js`)

**Purpose:** Validate lineup before saving (11 starters, goalkeeper, etc.)

**Code Implementation:**

```javascript
// Add to backend/src/routes/games.js (or create separate utility file)

const GameRoster = require('../models/GameRoster');
const Player = require('../models/Player');

/**
 * Validate lineup before starting game
 * @param {Array} rosters - Array of roster entries
 * @param {String} gameId - Game ID
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} - { isValid: boolean, error?: string, details?: object }
 */
async function validateLineup(rosters, gameId, session) {
  // Count players by status
  const statusCounts = {
    'Starting Lineup': 0,
    'Bench': 0,
    'Unavailable': 0,
    'Not in Squad': 0
  };

  const startingLineupPlayers = [];
  const playerIds = new Set();

  // Validate each roster entry
  for (const roster of rosters) {
    const { playerId, status } = roster;

    // Validate required fields
    if (!playerId) {
      return {
        isValid: false,
        error: 'Missing playerId in roster entry',
        details: { roster }
      };
    }

    // Validate status
    const validStatuses = ['Starting Lineup', 'Bench', 'Unavailable', 'Not in Squad'];
    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        details: { playerId, status }
      };
    }

    // Check for duplicate players
    if (playerIds.has(playerId)) {
      return {
        isValid: false,
        error: `Duplicate player in roster: ${playerId}`,
        details: { playerId }
      };
    }
    playerIds.add(playerId);

    // Validate player exists
    const player = await Player.findById(playerId).session(session);
    if (!player) {
      return {
        isValid: false,
        error: `Player not found: ${playerId}`,
        details: { playerId }
      };
    }

    // Count by status
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }

    // Collect starting lineup players
    if (status === 'Starting Lineup') {
      startingLineupPlayers.push(player);
    }
  }

  // Validation 1: Must have exactly 11 starting lineup players
  if (statusCounts['Starting Lineup'] !== 11) {
    return {
      isValid: false,
      error: `Invalid starting lineup. Expected 11 players, got ${statusCounts['Starting Lineup']}`,
      details: {
        expected: 11,
        actual: statusCounts['Starting Lineup']
      }
    };
  }

  // Validation 2: Must have at least one goalkeeper in starting lineup
  const hasGoalkeeper = startingLineupPlayers.some(player => {
    const position = (player.position || '').toLowerCase();
    return position === 'gk' || position === 'goalkeeper' || position.includes('goalkeeper');
  });

  if (!hasGoalkeeper) {
    return {
      isValid: false,
      error: 'Starting lineup must include at least one goalkeeper',
      details: {
        startingLineupCount: startingLineupPlayers.length,
        positions: startingLineupPlayers.map(p => p.position)
      }
    };
  }

  // All validations passed
  return {
    isValid: true,
    details: {
      startingLineupCount: statusCounts['Starting Lineup'],
      benchCount: statusCounts['Bench'],
      totalPlayers: rosters.length
    }
  };
}
```

### Step 1.3: Import Required Models and Middleware

**File:** `backend/src/routes/games.js`

**Update imports:**

```javascript
// Add to existing imports at top of file
const mongoose = require('mongoose');
const GameRoster = require('../models/GameRoster');
const Player = require('../models/Player');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');
```

**Note:** `checkGameAccess` should already be imported if we're using it. If not, add it.

---

## Phase 2: Frontend Plan (The Refactor)

### Step 2.1: Update `executeGameWasPlayed` Function

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Current Implementation (Vulnerable):**
```javascript
const executeGameWasPlayed = async () => {
  setIsSaving(true);
  try {
    // ❌ Call 1: Update game status
    const response = await fetch(`http://localhost:3001/api/games/${gameId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ status: "Played" }),
    });

    if (!response.ok) throw new Error("Failed to update game status");

    // ❌ Call 2: Save roster (separate, non-atomic)
    const rosterUpdates = gamePlayers.map((player) => ({
      playerId: player._id,
      playerName: player.fullName || player.name || 'Unknown Player',
      gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',
      rosterEntry: getPlayerStatus(player._id),
      status: getPlayerStatus(player._id),
    }));

    const rosterResponse = await fetch(`http://localhost:3001/api/game-rosters/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ gameId, rosters: rosterUpdates }),
    });

    if (!rosterResponse.ok) {
      const errorText = await rosterResponse.text();
      throw new Error(`Failed to update rosters: ${rosterResponse.status} - ${errorText}`);
    }

    await refreshData();
    setGame((prev) => ({ ...prev, status: "Played" }));
  } catch (error) {
    // Error handling...
  } finally {
    setIsSaving(false);
  }
};
```

**New Implementation (Atomic):**
```javascript
// Execute the actual game was played logic
const executeGameWasPlayed = async () => {
  setIsSaving(true);
  try {
    // ✅ Single atomic call: Start game with lineup
    const rosterUpdates = gamePlayers.map((player) => ({
      playerId: player._id,
      playerName: player.fullName || player.name || 'Unknown Player',
      gameTitle: game.gameTitle || game.GameTitle || game.title || game.teamName || 'Unknown Game',
      rosterEntry: getPlayerStatus(player._id),
      status: getPlayerStatus(player._id),
    }));

    console.log('🔍 Starting game with roster:', {
      gameId,
      rosterCount: rosterUpdates.length,
      startingLineupCount: rosterUpdates.filter(r => r.status === 'Starting Lineup').length,
      benchCount: rosterUpdates.filter(r => r.status === 'Bench').length
    });

    const response = await fetch(`http://localhost:3001/api/games/${gameId}/start-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ rosters: rosterUpdates }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to start game: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Game started successfully:', result);

    // Refresh data to get updated game state
    await refreshData();
    
    // Update local game state
    setGame((prev) => ({ ...prev, status: "Played" }));
  } catch (error) {
    console.error("Error starting game:", error);
    showConfirmation({
      title: "Error",
      message: error.message || "Failed to start game. Please try again.",
      confirmText: "OK",
      cancelText: null,
      onConfirm: () => setShowConfirmationModal(false),
      onCancel: null,
      type: "error"
    });
  } finally {
    setIsSaving(false);
  }
};
```

### Step 2.2: Update API URL Configuration (Optional but Recommended)

**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**Current:** Hardcoded `http://localhost:3001`

**Recommended:** Use environment variable or API configuration

```javascript
// At top of file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Then in executeGameWasPlayed:
const response = await fetch(`${API_URL}/api/games/${gameId}/start-game`, {
  // ...
});
```

---

## Phase 3: Idempotency Considerations

### Step 3.1: Make Endpoint Idempotent

**Current Implementation:** The endpoint will fail if game is already `Played`.

**Idempotent Implementation:** Allow safe retries if game is already `Played` and lineup matches.

**Updated Route Logic:**

```javascript
// In POST /api/games/:gameId/start-game route

// Step 2: Check if game is already Played (idempotency)
if (game.status === 'Played') {
  // Check if lineup already exists and matches
  const existingRosters = await GameRoster.find({ game: gameId }).session(session);
  
  // If rosters match, return success (idempotent)
  if (existingRosters.length > 0) {
    await session.abortTransaction();
    return res.status(200).json({
      success: true,
      message: 'Game is already started',
      data: {
        game: {
          _id: game._id,
          status: game.status
        },
        rosters: existingRosters,
        alreadyStarted: true
      }
    });
  }
  
  // If game is Played but no rosters, allow update (recovery scenario)
  // Continue with transaction...
}

if (game.status !== 'Scheduled' && game.status !== 'Played') {
  await session.abortTransaction();
  return res.status(400).json({
    success: false,
    error: `Game cannot be started. Current status: ${game.status}. Only 'Scheduled' or 'Played' games can be started.`
  });
}
```

---

## Phase 4: Error Handling and Rollback

### Step 4.1: Transaction Error Handling

**Already implemented in Step 1.1**, but ensure:

1. **All database operations use `session` parameter:**
   - `GameRoster.findOneAndUpdate(..., { session })`
   - `game.save({ session })`
   - `Player.findById(playerId).session(session)`

2. **Transaction is always aborted on error:**
   ```javascript
   try {
     // ... transaction logic
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
     // ... error handling
   } finally {
     session.endSession();
   }
   ```

3. **Validation errors abort transaction before any writes:**
   - Validate lineup first
   - Only start transaction after validation passes
   - Or validate within transaction and abort if invalid

---

## Phase 5: Testing Plan

### Test 1: Happy Path - Successful Atomic Transition

**Steps:**
1. Create a game with status `Scheduled`
2. Prepare valid lineup (11 starters, goalkeeper, bench players)
3. Call `POST /api/games/:gameId/start-game` with valid roster
4. Verify:
   - Game status is `Played`
   - All roster entries are saved
   - Response indicates success

**Expected Result:** ✅ Success - Game and rosters are atomically updated

---

### Test 2: Validation Failure - Invalid Lineup

**Steps:**
1. Create a game with status `Scheduled`
2. Prepare invalid lineup (e.g., only 10 starters)
3. Call `POST /api/games/:gameId/start-game` with invalid roster
4. Verify:
   - Game status remains `Scheduled`
   - No roster entries are saved
   - Response indicates validation error

**Expected Result:** ✅ Transaction aborted - No changes to database

---

### Test 3: Network Failure Simulation

**Steps:**
1. Create a game with status `Scheduled`
2. Prepare valid lineup
3. Simulate network failure during request (kill connection)
4. Verify:
   - Game status remains `Scheduled`
   - No roster entries are saved
   - Database is in consistent state

**Expected Result:** ✅ Transaction aborted - No partial updates

---

### Test 4: Idempotency - Retry After Success

**Steps:**
1. Successfully start a game (status = `Played`, rosters saved)
2. Call `POST /api/games/:gameId/start-game` again with same roster
3. Verify:
   - Response indicates game already started
   - No duplicate roster entries
   - Game status remains `Played`

**Expected Result:** ✅ Idempotent - Safe to retry

---

### Test 5: Unauthorized Access

**Steps:**
1. Authenticate as Coach A
2. Try to start Coach B's game
3. Verify:
   - Request is rejected with 403 Forbidden
   - No changes to database

**Expected Result:** ✅ Access denied - Security enforced

---

### Test 6: Concurrent Requests (Race Condition Prevention)

**Steps:**
1. Create a game with status `Scheduled`
2. Send two concurrent requests to start the game
3. Verify:
   - Only one succeeds
   - Game status is `Played`
   - Roster entries are saved correctly
   - No duplicate entries

**Expected Result:** ✅ Transaction isolation prevents race conditions

---

## Phase 6: Migration Strategy

### Step 6.1: Backward Compatibility

**Option A: Keep Old Endpoints (Deprecated)**
- Keep `PUT /api/games/:id` and `POST /api/game-rosters/batch` for backward compatibility
- Add deprecation warnings
- Document new endpoint as preferred

**Option B: Remove Old Endpoints (Breaking Change)**
- Remove old endpoints after migration
- Update all clients to use new endpoint
- Requires coordinated deployment

**Recommendation:** Option A for gradual migration, then Option B after all clients are updated.

---

## Phase 7: Implementation Checklist

### Backend
- [ ] Add `mongoose` import to `games.js`
- [ ] Add `GameRoster` and `Player` imports
- [ ] Create `validateLineup` function
- [ ] Create `POST /api/games/:gameId/start-game` route
- [ ] Add transaction logic with proper error handling
- [ ] Add idempotency checks
- [ ] Test transaction rollback on errors
- [ ] Test validation failures
- [ ] Test concurrent requests

### Frontend
- [ ] Update `executeGameWasPlayed` function
- [ ] Remove old `PUT /api/games/:id` call
- [ ] Remove old `POST /api/game-rosters/batch` call
- [ ] Replace with single `POST /api/games/:gameId/start-game` call
- [ ] Update error handling
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Test network failures

### Testing
- [ ] Test 1: Happy path
- [ ] Test 2: Validation failure
- [ ] Test 3: Network failure
- [ ] Test 4: Idempotency
- [ ] Test 5: Unauthorized access
- [ ] Test 6: Concurrent requests

### Documentation
- [ ] Update API documentation
- [ ] Document new endpoint
- [ ] Mark old endpoints as deprecated (if keeping)
- [ ] Update frontend code comments

---

## Benefits of This Refactoring

1. **Data Integrity:** Atomic transaction ensures game and roster are always in sync
2. **Reliability:** No partial updates, no corrupted state
3. **Idempotency:** Safe to retry on network failures
4. **Performance:** Single round-trip instead of two
5. **Security:** Backend validation ensures data consistency
6. **Maintainability:** Single source of truth for state transition logic

---

## Risk Assessment

**Before Refactoring:**
- **Severity:** Critical
- **Impact:** Data corruption, inconsistent state
- **Likelihood:** High (network failures are common)

**After Refactoring:**
- **Severity:** None
- **Impact:** Atomic operations prevent corruption
- **Likelihood:** None (transaction ensures consistency)

---

## Rollout Strategy

1. **Development:**
   - Implement backend endpoint first
   - Test thoroughly in isolation
   - Implement frontend changes
   - Test end-to-end

2. **Staging:**
   - Deploy to staging
   - Run full test suite
   - Perform load testing
   - Test failure scenarios

3. **Production:**
   - Deploy during low-traffic period
   - Monitor error logs
   - Have rollback plan ready
   - Gradually migrate clients

---

## Conclusion

This refactoring plan provides a comprehensive solution to the non-atomic state transition vulnerability. The new `POST /api/games/:gameId/start-game` endpoint ensures that game status updates and roster saves happen atomically within a MongoDB transaction, preventing data corruption and ensuring data integrity.


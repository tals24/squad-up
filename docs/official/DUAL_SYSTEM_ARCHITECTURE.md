# Dual-System Statistics Architecture - Complete Technical Guide

**Project:** SquadUp - Youth Soccer Management System  
**Last Updated:** December 7, 2025  
**Purpose:** Detailed explanation of how player statistics are calculated and displayed

---

## 🎯 Overview

The system uses **two complementary approaches** to calculate and display player statistics (minutes played, goals, assists):

1. **System 1: Background Worker** (Async, Persistence)
2. **System 2: Real-Time API** (Sync, Instant Display)

Both systems calculate the **same data** but serve **different purposes**:
- **Worker** = Save to database for history
- **API** = Display to user instantly

---

## 📊 System 1: Background Worker (Persistence)

### Purpose
Save calculated stats to the database for:
- Historical queries
- Reports
- Analytics over time

### Architecture Flow

```
User Action (Game Status Change)
        ↓
    Job Created
        ↓
Worker Polls (every 5s)
        ↓
    Processes Job
        ↓
Calculates Minutes/Goals/Assists
        ↓
   Saves to GameReport DB
```

---

### 1.1 Job Creation Triggers

There are **6 specific triggers** that create `recalc-minutes` jobs:

#### **Trigger 1: Game Starts (Scheduled → Played)**

**File:** `backend/src/services/games/gameService.js`  
**Function:** `exports.startGame()`  
**When:** User clicks "Game Was Played" and finalizes lineup

```javascript
// After successful transaction at line 316-329
await session.commitTransaction();
session.endSession();

console.log(`✅ Game ${gameId} started successfully. Created ${gameRosters.length} rosters.`);

// Create job for minutes and played status recalculation
try {
  await Job.create({
    jobType: 'recalc-minutes',
    payload: { gameId: gameId },
    status: 'pending',
    runAt: new Date() // Process immediately
  });
  console.log(`📋 Created recalc-minutes job for game ${gameId} after start-game`);
} catch (error) {
  console.error(`⚠️ Error creating recalc-minutes job:`, error);
}
```

**What This Does:**
- Game transitions from "Scheduled" to "Played"
- GameRoster entries are created with initial `playedInGame = true` for starting lineup
- Job is queued to recalculate everything based on actual game events

---

#### **Trigger 2: Game Status Updated (Manual Status Change)**

**File:** `backend/src/services/games/gameService.js`  
**Function:** `exports.updateGame()`  
**When:** User manually changes game status to "Played" or "Done"

```javascript
// At lines 130-147
const statusChangedToPlayed = status === 'Played' && oldGame.status !== 'Played';
const statusChangedToDone = status === 'Done' && oldGame.status !== 'Done';

// Update game
const game = await Game.findByIdAndUpdate(gameId, update, { new: true })
  .populate('team', 'teamName season division');

// Handle status changes
if (statusChangedToPlayed || statusChangedToDone) {
  await this.handleStatusChangeToPlayed(game._id, status);
}
```

**Function Called:** `handleStatusChangeToPlayed()` at lines 159-172

```javascript
exports.handleStatusChangeToPlayed = async (gameId, status) => {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after status change to ${status}`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
};
```

---

#### **Trigger 3: Final Report Submitted (Played → Done)**

**File:** `backend/src/services/games/gameService.js`  
**Function:** `exports.submitFinalReport()`  
**When:** User submits final game report and moves game to "Done"

```javascript
// At line 419
await this.handleStatusChangeToPlayed(gameId, 'Done');
```

**Same Job Creation:** Calls the same `handleStatusChangeToPlayed()` function shown above.

---

#### **Trigger 4: Substitution Created/Updated/Deleted**

**File:** `backend/src/services/games/substitutionService.js`  
**Functions:** `createSubstitution()`, `updateSubstitution()`, `deleteSubstitution()`  
**When:** User adds, edits, or removes a substitution

**On Create (lines 124-135):**
```javascript
// ✅ Create job for minutes recalculation (non-blocking)
try {
  await Job.create({
    jobType: 'recalc-minutes',
    payload: { gameId: gameId },
    status: 'pending',
    runAt: new Date() // Process immediately
  });
  console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution creation`);
} catch (error) {
  console.error(`❌ Error creating recalc-minutes job:`, error);
}
```

**On Update (lines 221-231):** Same job creation code

**On Delete (lines 255-265):** Same job creation code

**Why:** Substitutions directly affect player minutes, so any change requires recalculation.

---

#### **Trigger 5: Red Card Created**

**File:** `backend/src/services/games/cardService.js`  
**Function:** `createCard()`  
**When:** User adds a red card or second yellow

```javascript
// At lines 121-134
await card.save();

// ✅ CRITICAL: Trigger recalc-minutes job for red cards
if (cardType === 'red' || cardType === 'second-yellow') {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after red card`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**Why:** Red cards cause player ejection, which stops them from earning minutes. Yellow cards do NOT trigger recalculation.

---

#### **Trigger 6: Card Updated or Deleted (Red Card Status Changes)**

**File:** `backend/src/services/games/cardService.js`  
**Functions:** `updateCard()`, `deleteCard()`

**On Update (lines 211-236):**
```javascript
// Track if card type changed to/from red card (affects recalc-minutes)
const wasRedCard = card.cardType === 'red' || card.cardType === 'second-yellow';
const willBeRedCard = cardType === 'red' || cardType === 'second-yellow';

// Update fields
if (cardType !== undefined) card.cardType = cardType;
await card.save();

// ✅ CRITICAL: Trigger recalc-minutes job if red card status changed
if (wasRedCard !== willBeRedCard) {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after card type change`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**On Delete (lines 255-268):**
```javascript
// ✅ CRITICAL: Trigger recalc-minutes job if red card was deleted
if (card.cardType === 'red' || card.cardType === 'second-yellow') {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after red card deletion`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
  }
}
```

**Why:** Changing or removing a red card changes when a player was ejected, affecting their minutes.

---

### 1.2 Job Processing (The Worker)

#### **Worker Startup**

**File:** `backend/src/worker.js`  
**Command:** `npm run worker:dev`  
**Process:** Separate Node.js process from the API server

**Initialization (lines 112-150):**
```javascript
async function startWorker() {
  await connectDB();
  
  console.log('✅ Worker started successfully');
  console.log(`🔄 Polling for jobs every ${POLL_INTERVAL_MS / 1000} seconds...`);
  
  // Start polling loop
  setInterval(pollForJobs, POLL_INTERVAL_MS);
  
  // Also run immediately
  pollForJobs();
}

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startWorker();
```

---

#### **Job Polling and Locking**

**Function:** `pollForJobs()` (lines 93-111)

```javascript
async function pollForJobs() {
  try {
    // Find and lock a job (atomic operation)
    const job = await Job.findAndLock();
    
    if (!job) {
      // No jobs available
      return;
    }
    
    // Process the locked job
    await processJob(job);
    
  } catch (error) {
    console.error('❌ Error in polling loop:', error);
  }
}
```

**How Job Locking Works:**
- `Job.findAndLock()` is an atomic operation (defined in Job model)
- Prevents multiple workers from processing the same job
- Updates job status from 'pending' to 'running'

---

#### **Job Dispatching**

**Function:** `processJob(job)` (lines 33-71)

```javascript
async function processJob(job) {
  console.log(`🔄 Processing job ${job._id} (${job.jobType}) for game ${job.payload.gameId}`);
  
  try {
    // Route to appropriate handler based on jobType
    switch (job.jobType) {
      case 'recalc-minutes':
        await handleRecalcMinutes(job);
        break;
      
      case 'recalc-goals-assists':
        // Future implementation
        console.warn(`⚠️ Job type ${job.jobType} not yet implemented`);
        await job.markFailed(new Error('Job type not implemented'));
        return;
      
      default:
        console.error(`❌ Unknown job type: ${job.jobType}`);
        await job.markFailed(new Error(`Unknown job type: ${job.jobType}`));
        return;
    }
    
    // Mark job as completed
    await job.markCompleted();
    console.log(`✅ Job ${job._id} completed successfully`);
    
  } catch (error) {
    console.error(`❌ Job ${job._id} failed:`, error);
    await job.markFailed(error);
  }
}
```

---

#### **Job Handler: recalc-minutes**

**Function:** `handleRecalcMinutes(job)` (lines 76-91)

```javascript
async function handleRecalcMinutes(job) {
  const { gameId } = job.payload;
  
  if (!gameId) {
    throw new Error('Missing gameId in job payload');
  }
  
  // Step 1: Recalculate minutes (updates GameReport documents)
  await recalculatePlayerMinutes(gameId, true);
  console.log(`✅ Recalculated minutes for game ${gameId}`);
  
  // Step 2: Update played status (updates GameRoster documents)
  const statusResult = await updatePlayedStatusForGame(gameId);
  console.log(`✅ Updated played status for game ${gameId}: ${statusResult.playersPlayed} played, ${statusResult.playersNotPlayed} not played`);
}
```

**Two Operations:**
1. `recalculatePlayerMinutes()` - Calculates minutes and saves to GameReport
2. `updatePlayedStatusForGame()` - Updates `playedInGame` field in GameRoster

---

### 1.3 Calculation Functions

#### **Minutes Calculation**

**File:** `backend/src/services/games/utils/minutesCalculation.js`  
**Function:** `calculatePlayerMinutes(gameId)` (lines 12-204)

**Algorithm:**
1. Fetch game to get total match duration
2. Fetch starting lineup from GameRoster
3. Fetch timeline (substitutions + red cards) using `getMatchTimeline(gameId)`
4. For each starting player:
   - Start with full match duration
   - Subtract time after substitution out
   - Subtract time after red card
5. For each bench player:
   - Check if they were subbed in
   - Calculate time from sub in → sub out/red card/end

**Code Example (lines 12-50):**
```javascript
async function calculatePlayerMinutes(gameId) {
  try {
    // Fetch game to get match duration
    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Calculate total match duration
    const totalMatchDuration = game.totalMatchDuration || 
      (game.matchDuration?.regularTime || 90) +
      (game.matchDuration?.firstHalfExtraTime || 0) +
      (game.matchDuration?.secondHalfExtraTime || 0);

    // Fetch starting lineup from GameRoster
    const gameRosters = await GameRoster.find({ 
      game: gameId,
      status: 'Starting Lineup'
    }).populate('player', '_id fullName');

    // Fetch match timeline (substitutions + red cards)
    const timeline = await getMatchTimeline(gameId);
    
    // ... complex calculation logic ...
    
    return calculatedMinutes; // { playerId: minutes }
  } catch (error) {
    console.error('Error calculating player minutes:', error);
    throw error;
  }
}
```

---

#### **Goals/Assists Calculation**

**File:** `backend/src/services/games/utils/goalsAssistsCalculation.js`  
**Function:** `calculatePlayerGoalsAssists(gameId)` (lines 10-53)

**Algorithm:**
1. Fetch all team goals (exclude opponent goals)
2. Count goals where `scorerId = playerId`
3. Count assists where `assistedById = playerId`
4. Return map: `{ playerId: { goals, assists } }`

**Complete Code:**
```javascript
async function calculatePlayerGoalsAssists(gameId) {
  try {
    // Fetch all team goals for this game (exclude opponent goals)
    const teamGoals = await Goal.find({ 
      gameId,
      goalCategory: 'TeamGoal' // Only count team goals
    }).select('scorerId assistedById');

    if (teamGoals.length === 0) {
      console.log(`No team goals found for game ${gameId}`);
      return {};
    }

    // Initialize result map
    const playerStats = {};

    // Count goals and assists for each player
    teamGoals.forEach(goal => {
      // Count goals (scorerId)
      if (goal.scorerId) {
        const scorerId = goal.scorerId.toString();
        if (!playerStats[scorerId]) {
          playerStats[scorerId] = { goals: 0, assists: 0 };
        }
        playerStats[scorerId].goals += 1;
      }

      // Count assists (assistedById)
      if (goal.assistedById) {
        const assisterId = goal.assistedById.toString();
        if (!playerStats[assisterId]) {
          playerStats[assisterId] = { goals: 0, assists: 0 };
        }
        playerStats[assisterId].assists += 1;
      }
    });

    console.log(`✅ Calculated goals/assists for ${Object.keys(playerStats).length} players`);
    return playerStats;
  } catch (error) {
    console.error(`❌ Error calculating goals/assists:`, error);
    throw error;
  }
}
```

**Data Source:** Reads from `Goal` collection (created when user adds goals during game).

---

### 1.4 Saving to Database

#### **Minutes → GameReport**

**File:** `backend/src/services/games/utils/minutesCalculation.js`  
**Function:** `recalculatePlayerMinutes(gameId, updateReports = true)` (lines 232-263)

```javascript
async function recalculatePlayerMinutes(gameId, updateReports = false) {
  try {
    const calculatedMinutes = await calculatePlayerMinutes(gameId);
    
    // Optionally update GameReport documents
    if (updateReports) {
      const GameReport = require('../models/GameReport');
      
      for (const [playerId, minutes] of Object.entries(calculatedMinutes)) {
        await GameReport.updateMany(
          { 
            game: gameId,
            player: playerId
          },
          {
            $set: {
              minutesPlayed: minutes,
              minutesCalculationMethod: 'calculated'
            }
          }
        );
      }
      
      console.log(`✅ Updated GameReports with calculated minutes for game ${gameId}`);
    }
    
    return calculatedMinutes;
  } catch (error) {
    console.error('Error recalculating player minutes:', error);
    throw error;
  }
}
```

**What Gets Saved:**
- **Collection:** `GameReport`
- **Fields Updated:** `minutesPlayed`, `minutesCalculationMethod`
- **Match By:** `game` + `player`

**Note:** Goals and assists are NOT saved by the worker. They're always calculated on-demand from the `Goal` collection.

---

#### **Played Status → GameRoster**

**File:** `backend/src/services/games/utils/minutesCalculation.js`  
**Function:** `updatePlayedStatusForGame(gameId)` (lines 272-357)

```javascript
async function updatePlayedStatusForGame(gameId) {
  try {
    // Fetch all roster entries for the game
    const gameRosters = await GameRoster.find({ game: gameId });
    
    // Fetch timeline to check if bench players were subbed in
    const timeline = await getMatchTimeline(gameId);
    const substitutions = timeline.filter(e => e.type === 'substitution');
    
    // Track which players were subbed in
    const playersSubbedIn = new Set();
    substitutions.forEach(sub => {
      if (sub.playerInId) {
        playersSubbedIn.add(sub.playerInId.toString());
      }
    });
    
    let playersPlayed = 0;
    let playersNotPlayed = 0;
    
    // Update each roster entry
    for (const roster of gameRosters) {
      const playerId = roster.player.toString();
      let played = false;
      
      if (roster.status === 'Starting Lineup') {
        played = true; // Starting lineup always plays
      } else if (roster.status === 'Bench') {
        played = playersSubbedIn.has(playerId); // Bench players only if subbed in
      }
      
      // Update if changed
      if (roster.playedInGame !== played) {
        roster.playedInGame = played;
        await roster.save();
      }
      
      if (played) playersPlayed++;
      else playersNotPlayed++;
    }
    
    return { playersPlayed, playersNotPlayed };
  } catch (error) {
    console.error('Error updating played status:', error);
    throw error;
  }
}
```

**What Gets Updated:**
- **Collection:** `GameRoster`
- **Field Updated:** `playedInGame` (boolean)
- **Logic:** Starting lineup = true, Bench = true only if subbed in

---

### 1.5 Summary: System 1 Flow

```
User Action (e.g., adds substitution)
        ↓
Service creates Job.create({ jobType: 'recalc-minutes', payload: { gameId } })
        ↓
Job saved to MongoDB (Jobs collection)
        ↓
Worker polls database every 5 seconds
        ↓
Worker finds pending Job and locks it
        ↓
Worker calls handleRecalcMinutes(job)
        ↓
    ┌───────────────┴──────────────┐
    ↓                              ↓
recalculatePlayerMinutes()    updatePlayedStatusForGame()
    ↓                              ↓
calculatePlayerMinutes()      Check timeline for subs
    ↓                              ↓
Reads: GameRoster,            Update GameRoster.playedInGame
       Timeline (Subs/Cards)        ↓
    ↓                          Saves to GameRoster
Calculates minutes map
    ↓
Updates GameReport.minutesPlayed
    ↓
Saves to GameReport
        ↓
Worker marks Job as 'completed'
```

---

## 🚀 System 2: Real-Time API (Instant Display)

### Purpose
Calculate stats **on-the-fly** for immediate display to user:
- No waiting for worker (instant feedback)
- Always uses latest data
- Doesn't persist to database

---

### 2.1 API Endpoint Definition

**File:** `backend/src/routes/games/stats.js`  
**Route:** `GET /api/games/:gameId/player-stats`

```javascript
const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/games/gameController');

const router = express.Router();

/**
 * GET /api/games/:gameId/player-stats
 * Calculates on-demand for instant display (not from GameReport)
 * Works for games with status 'Played' or 'Done'
 */
router.get('/:gameId/player-stats', authenticateJWT, checkGameAccess, gameController.getPlayerStats);

module.exports = router;
```

**Middleware Chain:**
1. `authenticateJWT` - Verifies user is logged in
2. `checkGameAccess` - Verifies user has access to this game
3. `gameController.getPlayerStats` - Handles the request

---

### 2.2 Controller Handler

**File:** `backend/src/controllers/games/gameController.js`  
**Function:** `exports.getPlayerStats()` (lines 164-188)

```javascript
exports.getPlayerStats = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const game = req.game; // From checkGameAccess middleware

    // Only allow for Played and Done games (not Scheduled)
    if (game.status !== 'Played' && game.status !== 'Done') {
      return res.status(400).json({
        success: false,
        error: 'Player stats calculation is only available for games in "Played" or "Done" status'
      });
    }

    const playerStats = await gameService.calculatePlayerStatsRealtime(gameId);

    res.json({
      success: true,
      gameId,
      playerStats
    });
  } catch (error) {
    console.error('Get player stats controller error:', error);
    next(error);
  }
};
```

**What It Does:**
1. Validates game status (must be Played or Done)
2. Calls service to calculate stats
3. Returns JSON response

---

### 2.3 Real-Time Calculation Service

**File:** `backend/src/services/games/gameService.js`  
**Function:** `exports.calculatePlayerStatsRealtime()` (lines 213-242)

```javascript
exports.calculatePlayerStatsRealtime = async (gameId) => {
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

  return playerStats;
};
```

**Key Insight:** This uses the **EXACT SAME calculation functions** as the worker:
- ✅ `calculatePlayerMinutes(gameId)` - Same function
- ✅ `calculatePlayerGoalsAssists(gameId)` - Same function

**Difference:** The `updateReports` parameter is `false` (default), so it doesn't save to database.

---

### 2.4 Response Structure

**JSON Response:**
```json
{
  "success": true,
  "gameId": "507f1f77bcf86cd799439011",
  "playerStats": {
    "507f1f77bcf86cd799439012": {
      "minutes": 90,
      "goals": 2,
      "assists": 1
    },
    "507f1f77bcf86cd799439013": {
      "minutes": 65,
      "goals": 0,
      "assists": 0
    },
    "507f1f77bcf86cd799439014": {
      "minutes": 25,
      "goals": 0,
      "assists": 1
    }
  }
}
```

**Format:**
- Top-level: `success`, `gameId`, `playerStats`
- `playerStats` is an object: `{ playerId: { minutes, goals, assists } }`
- All player IDs that have minutes OR goals OR assists are included

---

### 2.5 Summary: System 2 Flow

```
Frontend: fetchPlayerStats(gameId)
        ↓
GET /api/games/:gameId/player-stats
        ↓
Middleware: authenticateJWT → checkGameAccess
        ↓
Controller: gameController.getPlayerStats()
        ↓
Service: gameService.calculatePlayerStatsRealtime()
        ↓
    ┌───────────────┴──────────────┐
    ↓                              ↓
calculatePlayerMinutes()    calculatePlayerGoalsAssists()
    ↓                              ↓
Reads: GameRoster            Reads: Goal collection
       Timeline                   (goalCategory = 'TeamGoal')
    ↓                              ↓
Returns minutes map          Returns { goals, assists } map
        ↓
    Merge Results
        ↓
Return to frontend (JSON)
        ↓
Frontend displays immediately
```

**Time:** < 1 second (instant)

---

## 🔄 How Both Systems Work Together

### Scenario 1: User Marks Game as "Played"

**Timeline:**

```
T=0s: User clicks "Game Was Played"
      ↓
T=0.1s: POST /api/games/:id/start-game
      ↓
T=0.2s: gameService.startGame() executes
      ├─ Creates GameRoster entries
      ├─ Updates game status to 'Played'
      └─ Job.create({ type: 'recalc-minutes' }) ← System 1 trigger
      ↓
T=0.3s: Response sent to frontend
      ↓ [Game page reloads]
      ↓
T=0.4s: Frontend calls fetchPlayerStats(gameId) ← System 2
      ↓
T=0.5s: GET /api/games/:gameId/player-stats
      ↓
T=0.6s: calculatePlayerStatsRealtime() executes
      ├─ calculatePlayerMinutes() (reads timeline)
      └─ calculatePlayerGoalsAssists() (reads goals)
      ↓
T=0.7s: Stats returned to frontend → User sees data ✅
      
      [Meanwhile, in background...]
      
T=5s: Worker polls for jobs
      ↓
T=5.1s: Worker finds pending Job, locks it
      ↓
T=5.2s: handleRecalcMinutes() executes
      ├─ recalculatePlayerMinutes(gameId, true) ← updateReports = true
      │  └─ GameReport.updateMany({ minutesPlayed: ... })
      └─ updatePlayedStatusForGame()
         └─ GameRoster.save({ playedInGame: ... })
      ↓
T=8s: Job marked as completed
      ↓
T=8.1s: Stats now persisted in database ✅
```

**Result:**
- ✅ User sees stats at **0.7s** (System 2 - API)
- ✅ Stats saved to DB at **8s** (System 1 - Worker)

---

### Scenario 2: User Adds Goal After Game is "Played"

**Timeline:**

```
T=0s: User adds goal (minute 23, scorer: Player A, assister: Player B)
      ↓
T=0.1s: POST /api/games/:gameId/goals
      ↓
T=0.2s: goalService.createGoal() executes
      ├─ Validates player eligibility
      ├─ Creates Goal document
      └─ Goal.save() → Saved to Goal collection ✅
      ↓
T=0.3s: Response sent (goal created)
      ↓
T=0.4s: Frontend refreshes stats
      ↓
T=0.5s: GET /api/games/:gameId/player-stats ← System 2
      ↓
T=0.6s: calculatePlayerStatsRealtime() executes
      ├─ calculatePlayerMinutes() → Same as before
      └─ calculatePlayerGoalsAssists() → Finds NEW goal ✅
      ↓
T=0.7s: Updated stats returned → User sees new goal count ✅

      [Meanwhile, NO Job is created for goals...]
      
      [Worker does NOT run because goals don't trigger jobs]
```

**Important:** 
- ❌ Goals do NOT trigger `recalc-minutes` jobs
- ✅ Real-time API always reads from Goal collection (always fresh)
- ✅ User sees updated goal count immediately

**Why No Job for Goals?**
- Goals are stored in Goal collection
- `calculatePlayerGoalsAssists()` reads from Goal collection
- No need to persist to GameReport (read from source every time)
- Only minutes need to be pre-calculated and saved (complex calculation)

---

### Scenario 3: User Adds Substitution After Game is "Played"

**Timeline:**

```
T=0s: User adds substitution (minute 65, Player A out, Player B in)
      ↓
T=0.1s: POST /api/games/:gameId/substitutions
      ↓
T=0.2s: substitutionService.createSubstitution() executes
      ├─ Validates eligibility
      ├─ Creates Substitution document
      ├─ Substitution.save() → Saved to Substitution collection ✅
      └─ Job.create({ type: 'recalc-minutes' }) ← System 1 trigger ✅
      ↓
T=0.3s: Response sent (substitution created)
      ↓
T=0.4s: Frontend refreshes stats
      ↓
T=0.5s: GET /api/games/:gameId/player-stats ← System 2
      ↓
T=0.6s: calculatePlayerStatsRealtime() executes
      ├─ calculatePlayerMinutes() → Reads timeline with NEW sub ✅
      │  └─ Player A: 65 minutes (was 90, now reduced)
      │  └─ Player B: 25 minutes (was 0, now has minutes)
      └─ calculatePlayerGoalsAssists() → Same as before
      ↓
T=0.7s: Updated stats returned → User sees new minutes ✅

      [Meanwhile, in background...]
      
T=5s: Worker polls for jobs
      ↓
T=5.1s: Worker finds pending Job (recalc-minutes)
      ↓
T=5.2s: handleRecalcMinutes() executes
      └─ recalculatePlayerMinutes(gameId, true) ← updateReports = true
         └─ GameReport.updateMany({ minutesPlayed: 65 }) for Player A
         └─ GameReport.updateMany({ minutesPlayed: 25 }) for Player B
      ↓
T=8s: Job completed, GameReports updated ✅
```

**Result:**
- ✅ User sees new minutes at **0.7s** (System 2 - API recalculates)
- ✅ GameReport updated at **8s** (System 1 - Worker persists)
- ✅ Both systems stay in sync

---

## 🆚 Comparison: Same Functions, Different Purposes

| Aspect | System 1 (Worker) | System 2 (Real-Time API) |
|--------|-------------------|--------------------------|
| **Trigger** | Job created by various events | Frontend HTTP request |
| **When** | 5-10 seconds after event | Instant (on page load) |
| **Calculation Functions** | `calculatePlayerMinutes()`<br>`calculatePlayerGoalsAssists()` | **SAME FUNCTIONS** ✅ |
| **Data Source** | GameRoster, Timeline, Goals | **SAME DATA** ✅ |
| **Saves to DB** | ✅ Yes (GameReport) | ❌ No (calculated only) |
| **Purpose** | Persistence for history | Instant display for user |

**Key Insight:** Both systems use the **exact same calculation logic** but differ in:
- **When** they run
- **Whether** they save results

---

## 📋 Complete Trigger Summary

| Event | Trigger Location | System 1 (Job) | System 2 (API) |
|-------|------------------|----------------|----------------|
| **Game starts** | `gameService.startGame()` | ✅ Job created | Called by frontend |
| **Status → Played** | `gameService.updateGame()` | ✅ Job created | Called by frontend |
| **Status → Done** | `gameService.submitFinalReport()` | ✅ Job created | Called by frontend |
| **Substitution add/edit/delete** | `substitutionService.*()` | ✅ Job created | Called by frontend |
| **Red card add** | `cardService.createCard()` | ✅ Job created | Called by frontend |
| **Red card edit/delete** | `cardService.update/deleteCard()` | ✅ Job created | Called by frontend |
| **Goal add/edit/delete** | `goalService.*()` | ❌ No job | Called by frontend |
| **Yellow card** | `cardService.createCard()` | ❌ No job | Called by frontend |
| **Frontend page load** | N/A | N/A | ✅ API called |

---

## 🎯 Practical Example: Adding a Goal After Game is "Played"

### Step-by-Step with Exact Code Paths

**User Action:** Add goal at minute 23 by Player A (assisted by Player B)

---

#### **Step 1: Frontend Sends Request**

**File:** `frontend/src/features/game-management/api/goalsApi.js`

```javascript
// Frontend calls:
await createGoal(gameId, {
  minute: 23,
  scorerId: playerA._id,
  assistedById: playerB._id,
  goalType: 'open-play',
  isOpponentGoal: false
});
```

---

#### **Step 2: Backend Creates Goal**

**File:** `backend/src/services/games/goalService.js`  
**Function:** `createGoal()`

```javascript
// 1. Validates player eligibility
const eligibilityValidation = await validateGoalEligibility(
  gameId, scorerId, assistedById, minute
);
if (!eligibilityValidation.valid) {
  throw new Error(`Invalid goal assignment: ${eligibilityValidation.error}`);
}

// 2. Creates Goal document
const goal = new Goal({
  gameId,
  scorerId,
  assistedById,
  minute,
  goalType,
  goalCategory: isOpponentGoal ? 'OpponentGoal' : 'TeamGoal'
});

await goal.save(); // ← SAVED TO GOAL COLLECTION

// 3. Returns goal (NO JOB CREATED)
return goal;
```

**Important:** Goals do NOT trigger `recalc-minutes` jobs because goals/assists are always read from the Goal collection directly.

---

#### **Step 3: Frontend Refreshes Stats**

**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

```javascript
// After goal is added, frontend refreshes team stats:
const refreshTeamStats = async () => {
  try {
    const stats = await fetchPlayerStats(gameId);
    setTeamStats(stats);
    console.log('✅ Refreshed team stats');
  } catch (error) {
    console.error('Error refreshing team stats:', error);
  }
};
```

---

#### **Step 4: Real-Time API Calculates Stats**

**Request:** `GET /api/games/:gameId/player-stats`

**Service Called:** `calculatePlayerStatsRealtime(gameId)`

```javascript
// Runs in parallel:
const [calculatedMinutes, calculatedGoalsAssists] = await Promise.all([
  calculatePlayerMinutes(gameId),      // ← Reads GameRoster + Timeline
  calculatePlayerGoalsAssists(gameId)  // ← Reads Goal collection (finds NEW goal!)
]);

// Merge results
playerStats[playerA._id] = {
  minutes: 90,
  goals: 2,      // ← NEW! Was 1, now 2
  assists: 1
};

playerStats[playerB._id] = {
  minutes: 90,
  goals: 0,
  assists: 2     // ← NEW! Was 1, now 2
};

return playerStats;
```

---

#### **Step 5: Frontend Displays Updated Stats**

**User sees:**
- ✅ Player A: 2 goals (was 1)
- ✅ Player B: 2 assists (was 1)
- ✅ Instant update (< 1 second)

---

#### **Step 6: What About the Worker?**

**Answer:** The worker does NOT run for goals because:

1. **No Job was created** (goals don't trigger jobs)
2. **Goal data lives in Goal collection** (source of truth)
3. **API always reads from Goal collection** (always fresh)
4. **No need to persist** (already persisted in Goal collection)

**If frontend refreshes later:**
- API will re-query Goal collection
- Will always get the latest goals
- No stale data possible

---

## 🔑 Key Architectural Insights

### Why Goals Don't Trigger Jobs

| Data Type | Triggers Job? | Why/Why Not? |
|-----------|---------------|--------------|
| **Minutes** | ✅ Yes | Complex calculation, needs persistence |
| **Substitutions** | ✅ Yes | Affects minutes calculation |
| **Red Cards** | ✅ Yes | Affects minutes (player ejection) |
| **Yellow Cards** | ❌ No | Doesn't affect calculations |
| **Goals** | ❌ No | Stored in Goal collection (source of truth) |
| **Assists** | ❌ No | Stored in Goal collection (source of truth) |

---

### Data Flow: Source of Truth

```
Minutes:
  Source → Timeline (Subs + Red Cards) + GameRoster
         → Calculated by Worker → Saved to GameReport
         → OR calculated by API (same logic, not saved)
         
Goals/Assists:
  Source → Goal collection (ONE source of truth)
         → Read by Worker → NOT saved (already in DB)
         → Read by API → NOT saved (already in DB)
```

**Insight:** Minutes are **calculated and saved**, goals/assists are **counted from source**.

---

## 🎯 Mental Model: Data Lifecycle

### For Minutes (Complex)

```
1. Game starts → Starting lineup set
        ↓
2. User adds substitution → Timeline updated
        ↓
3. Job created → Worker will calculate
        ↓
4. Frontend requests stats → API calculates (doesn't wait for worker)
        ↓
5. User sees minutes (instant from API)
        ↓
6. Worker runs → Saves to GameReport (for history)
```

---

### For Goals/Assists (Simple)

```
1. User adds goal → Goal collection
        ↓
2. Frontend requests stats → API reads Goal collection
        ↓
3. User sees goals/assists (instant)
        ↓
[No worker needed - data already in DB]
```

---

## 🔍 Code File Reference Summary

### System 1: Background Worker

| Component | File | Key Functions |
|-----------|------|---------------|
| **Worker Process** | `src/worker.js` | `startWorker()`, `pollForJobs()`, `handleRecalcMinutes()` |
| **Job Creation** | `src/services/games/gameService.js` | `handleStatusChangeToPlayed()` |
| | `src/services/games/substitutionService.js` | `createSubstitution()`, `updateSubstitution()`, `deleteSubstitution()` |
| | `src/services/games/cardService.js` | `createCard()`, `updateCard()`, `deleteCard()` |
| **Calculations** | `src/services/games/utils/minutesCalculation.js` | `calculatePlayerMinutes()`, `recalculatePlayerMinutes()` |
| | `src/services/games/utils/goalsAssistsCalculation.js` | `calculatePlayerGoalsAssists()` |
| **DB Updates** | `src/services/games/utils/minutesCalculation.js` | `GameReport.updateMany()` (line 241-252) |
| | `src/services/games/utils/minutesCalculation.js` | `GameRoster.save()` (line 325-328) |

---

### System 2: Real-Time API

| Component | File | Key Functions |
|-----------|------|---------------|
| **Route Definition** | `src/routes/games/stats.js` | `GET /:gameId/player-stats` |
| **Controller** | `src/controllers/games/gameController.js` | `getPlayerStats()` (line 164-188) |
| **Service** | `src/services/games/gameService.js` | `calculatePlayerStatsRealtime()` (line 213-242) |
| **Calculations** | `src/services/games/utils/minutesCalculation.js` | `calculatePlayerMinutes()` |
| | `src/services/games/utils/goalsAssistsCalculation.js` | `calculatePlayerGoalsAssists()` |
| **Frontend API** | `frontend/src/features/game-management/api/playerStatsApi.js` | `fetchPlayerStats()` |
| **Frontend Usage** | `frontend/src/features/game-management/components/GameDetailsPage/index.jsx` | `useEffect()` pre-fetching |

---

## 🎓 Why This Architecture?

### Benefits of Dual System

| Benefit | Explanation | Real Impact |
|---------|-------------|-------------|
| **Instant UX** | API provides stats in < 1s | User doesn't wait for worker |
| **Data Persistence** | Worker saves to GameReport | Historical queries are fast |
| **Reliability** | API works even if worker is down | System is fault-tolerant |
| **Always Fresh** | API calculates from latest events | No stale data |
| **Efficiency** | Worker runs once, API runs on-demand | Balanced workload |

---

### Trade-offs

| Aspect | Consideration |
|--------|---------------|
| **Code Duplication** | Same calculation logic called by both systems (acceptable) |
| **Complexity** | Two systems to maintain (but well-separated) |
| **Database Load** | API calculates on each request (but fast, < 1s) |
| **Worker Dependency** | GameReport needs worker running (but API works as fallback) |

---

## 🚀 Running the System

### Start Both Systems

```bash
# Terminal 1: API Server
cd backend
npm run dev

# Terminal 2: Worker (REQUIRED for persistence)
cd backend
npm run worker:dev
```

### Worker Logs to Watch

```
✅ Worker connected to MongoDB
🔄 Polling for jobs every 5 seconds...
🔄 Processing job 67a... (recalc-minutes) for game 507f...
✅ Recalculated minutes for game 507f...
✅ Updated played status for game 507f...: 11 played, 4 not played
✅ Job 67a... completed successfully
```

---

## 🐛 Troubleshooting

### Issue: Stats Show 0 for Everything

**Check:**
1. Is game status "Played" or "Done"? (API only works for these)
2. Are there substitutions/goals in the database?
3. Check browser console for API errors
4. Check backend logs for calculation errors

---

### Issue: Stats Don't Persist After Refresh

**Check:**
1. Is worker running? (`npm run worker:dev`)
2. Check worker logs for job processing
3. Query GameReport collection to see if data was saved
4. Check for worker errors in console

---

### Issue: Minutes Wrong After Red Card

**Check:**
1. Was a `recalc-minutes` job created? (Check Jobs collection)
2. Did worker process the job? (Check worker logs)
3. Is the red card in the timeline? (Check Cards collection)
4. Manually trigger calculation via API to verify logic

---

## 📚 Related Documentation

- **Comparison Document:** `docs/STATS_CALCULATION_COMPARISON.md` - Main vs Refactored comparison
- **Backend Summary:** `docs/official/backendSummary.md` - Complete architecture overview
- **API Documentation:** `docs/official/apiDocumentation.md` - API endpoint reference
- **Backfill Script:** `backend/src/scripts/README.md` - How to fix historical games

---

## 🎯 Summary

### What Makes This Architecture Work

1. **Same Calculation Logic** - Both systems use identical functions
2. **Different Timing** - Worker is async (5-10s), API is sync (instant)
3. **Different Purposes** - Worker persists, API displays
4. **Complementary** - They work together, not against each other

### The Power of This Design

- ✅ User never waits (API provides instant feedback)
- ✅ Data is always saved (Worker persists in background)
- ✅ System is resilient (API works if worker fails)
- ✅ Code is DRY (same calculation functions reused)

---

**This dual-system architecture provides both excellent UX (instant) and excellent data integrity (persistent).**

---

*Last Updated: December 7, 2025*  
*SquadUp Football Management System*  
*Version: 2.0 (Post-MVC Refactoring)*


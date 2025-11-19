# Minutes System - Complete Documentation

**Date:** December 2024  
**Version:** 2.0  
**Status:** Production Ready

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Services](#backend-services)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [Frontend Utilities](#frontend-utilities)
6. [Frontend Components](#frontend-components)
7. [Database Models](#database-models)
8. [Job Queue Integration](#job-queue-integration)
9. [Data Flow](#data-flow)
10. [Algorithm Details](#algorithm-details)

---

## 🎯 **Overview**

The Minutes System automatically calculates player minutes from game events (substitutions and red cards). Minutes are **server-authoritative** and cannot be manually entered for games in "Played" status.

### Key Principles:
- ✅ **Automated Calculation** - Minutes calculated from game events
- ✅ **Server Authoritative** - Client cannot provide minutes
- ✅ **Pre-fetching** - Stats loaded before UI display (0ms latency)
- ✅ **Background Processing** - Non-blocking recalculation via job queue
- ✅ **Session-Based Algorithm** - Tracks play sessions for accuracy

---

## 🏗️ **Architecture**

### High-Level Flow:
```
Game Events (Substitutions/Red Cards)
    ↓
Backend API Routes
    ↓
Job Queue (recalc-minutes)
    ↓
Worker Process
    ↓
Minutes Calculation Service
    ↓
GameReports Updated
    ↓
Frontend Pre-fetching
    ↓
UI Display (Read-Only)
```

---

## 🔧 **Backend Services**

### 1. `backend/src/services/minutesCalculation.js`

#### **Function: `calculatePlayerMinutes(gameId)`**

**Purpose:** Calculate player minutes from game events using session-based algorithm

**Parameters:**
- `gameId` (string) - The game ID

**Returns:**
- `Object` - Map of `playerId -> calculated minutes`

**Algorithm:**
1. Fetch game and calculate total match duration
2. Fetch starting lineup from GameRoster (status: 'Starting Lineup')
3. Fetch all substitutions and red cards for the game
4. Initialize player sessions:
   - Starting lineup players: session from 0 to totalMatchDuration
5. Process events chronologically:
   - **Substitution:** End playerOut's session at substitution minute, start playerIn's session
   - **Red Card:** End player's session immediately at card minute
6. Calculate total minutes for each player:
   - Sum all session durations
   - Round to nearest minute

**Example:**
```javascript
const minutes = await calculatePlayerMinutes('game123');
// Returns: { 'playerId1': 90, 'playerId2': 65, 'playerId3': 25 }
```

**Used By:**
- `POST /api/game-reports/batch` - Final report submission
- `GET /api/games/:gameId/player-stats` - Pre-fetch endpoint
- `recalculatePlayerMinutes()` - Background job processing

---

#### **Function: `recalculatePlayerMinutes(gameId, updateReports = false)`**

**Purpose:** Recalculate minutes and optionally update GameReports

**Parameters:**
- `gameId` (string) - The game ID
- `updateReports` (boolean) - Whether to update GameReports in database

**Returns:**
- `Object` - Map of `playerId -> calculated minutes`

**Behavior:**
- Calls `calculatePlayerMinutes()` internally
- If `updateReports = true`, updates all GameReports with calculated minutes
- Sets `minutesCalculationMethod = 'calculated'` on updated reports

**Used By:**
- `backend/src/worker.js` - Background job processing

---

### 2. `backend/src/services/minutesValidation.js`

#### **Function: `calculateTotalMatchDuration(matchDuration)`**

**Purpose:** Calculate total match duration including extra time

**Parameters:**
- `matchDuration` (Object) - `{ regularTime, firstHalfExtraTime, secondHalfExtraTime }`

**Returns:**
- `Number` - Total match duration in minutes

**Formula:**
```
totalMatchDuration = regularTime + firstHalfExtraTime + secondHalfExtraTime
```

**Defaults:**
- `regularTime`: 90 minutes
- `firstHalfExtraTime`: 0 minutes
- `secondHalfExtraTime`: 0 minutes

**Example:**
```javascript
const duration = calculateTotalMatchDuration({
  regularTime: 90,
  firstHalfExtraTime: 3,
  secondHalfExtraTime: 5
});
// Returns: 98
```

**Used By:**
- `PUT /api/games/:gameId/match-duration` - Match duration endpoint
- `PUT /api/games/:id` - Game update endpoint
- `calculatePlayerMinutes()` - For max minutes calculation

---

#### **Function: `validateExtraTime(extraTime, halfName)`**

**Purpose:** Validate extra time values

**Parameters:**
- `extraTime` (Number) - Extra time in minutes
- `halfName` (String) - "first half" or "second half"

**Returns:**
- `Object` - `{ isValid: boolean, error: string }`

**Validation Rules:**
- Must be non-negative (>= 0)
- Must be <= 15 minutes (recommended maximum)
- Returns error if validation fails

**Example:**
```javascript
const validation = validateExtraTime(20, 'first half');
// Returns: { isValid: false, error: "Extra time for first half (20 minutes) is unusually high..." }
```

**Used By:**
- `PUT /api/games/:gameId/match-duration` - Match duration endpoint

---

## 🌐 **Backend API Endpoints**

### 1. `PUT /api/games/:gameId/match-duration`

**File:** `backend/src/routes/minutesValidation.js`  
**Authentication:** Required + game access check

**Purpose:** Update match duration (regular time + extra time)

**Request Body:**
```json
{
  "regularTime": 90,
  "firstHalfExtraTime": 3,
  "secondHalfExtraTime": 5
}
```

**Response:**
```json
{
  "message": "Match duration updated successfully",
  "matchDuration": {
    "regularTime": 90,
    "firstHalfExtraTime": 3,
    "secondHalfExtraTime": 5
  },
  "totalMatchDuration": 98
}
```

**Validation:**
- Extra time values validated via `validateExtraTime()`
- `totalMatchDuration` automatically calculated and stored

**Used By:**
- Frontend: `MatchAnalysisSidebar` component

---

### 2. `GET /api/games/:gameId/player-stats`

**File:** `backend/src/routes/games.js`  
**Authentication:** Required + game access check

**Purpose:** Get consolidated player statistics (minutes, goals, assists) for all players

**Restrictions:**
- Only available for games with status `"Played"`
- Returns 400 error for other statuses

**Response:**
```json
{
  "success": true,
  "gameId": "game123",
  "playerStats": {
    "playerId1": { "minutes": 90, "goals": 2, "assists": 1 },
    "playerId2": { "minutes": 65, "goals": 0, "assists": 1 },
    "playerId3": { "minutes": 25, "goals": 0, "assists": 0 }
  },
  "metadata": {
    "totalPlayers": 3,
    "playersWithMinutes": 3,
    "playersWithGoalsAssists": 2
  }
}
```

**Implementation:**
- Runs `calculatePlayerMinutes()` and `calculatePlayerGoalsAssists()` in parallel
- Consolidates results into single response object
- Optimized for pre-fetching (single request for all stats)

**Used By:**
- Frontend: `GameDetailsPage` pre-fetching logic

---

### 3. `POST /api/game-reports/batch`

**File:** `backend/src/routes/gameReports.js`  
**Authentication:** Required + game access check

**Purpose:** Batch create/update game reports (final submission)

**Request Body:**
```json
{
  "gameId": "game123",
  "reports": [
    {
      "playerId": "playerId1",
      "rating_physical": 4,
      "rating_technical": 5,
      "rating_tactical": 4,
      "rating_mental": 4,
      "notes": "Great game"
    }
  ]
}
```

**Forbidden Fields:**
- `minutesPlayed` - Server-calculated, cannot be provided
- `goals` - Server-calculated, cannot be provided
- `assists` - Server-calculated, cannot be provided

**Behavior:**
- Server automatically calculates `minutesPlayed` using `calculatePlayerMinutes()`
- Server automatically calculates `goals` and `assists` from Goals collection
- Sets `minutesCalculationMethod = 'calculated'` on all reports

**Response:**
```json
{
  "success": true,
  "data": [ /* updated GameReport objects */ ],
  "message": "Updated 11 game reports"
}
```

**Used By:**
- Frontend: `FinalReportDialog` component

---

### 4. `GET /api/game-reports/calculate-goals-assists/:gameId`

**File:** `backend/src/routes/gameReports.js`  
**Authentication:** Required + game access check

**Purpose:** Calculate player goals and assists (separate from minutes)

**Response:**
```json
{
  "success": true,
  "gameId": "game123",
  "calculatedStats": {
    "playerId1": { "goals": 2, "assists": 1 },
    "playerId2": { "goals": 0, "assists": 1 }
  }
}
```

**Note:** Minutes are now fetched via `/player-stats` batch endpoint, but this endpoint remains for goals/assists-only queries.

---

## 💻 **Frontend Utilities**

### 1. `src/features/game-management/utils/minutesValidation.js`

#### **Function: `calculateTotalMatchDuration(matchDuration)`**

**Purpose:** Frontend version of match duration calculation

**Parameters:**
- `matchDuration` (Object) - `{ regularTime, firstHalfExtraTime, secondHalfExtraTime }`

**Returns:**
- `Number` - Total match duration in minutes

**Used By:**
- `PlayerPerformanceDialog.jsx` - For max minutes validation

**Example:**
```javascript
import { calculateTotalMatchDuration } from '../../utils/minutesValidation';

const maxMinutes = calculateTotalMatchDuration(game.matchDuration);
// Returns: 98 (for 90 + 3 + 5)
```

---

### 2. `src/features/game-management/utils/squadValidation.js`

#### **Function: `validateMinutesPlayed(startingLineup, playerReports)`**

**Purpose:** Validate that starting lineup players have minutes played

**Parameters:**
- `startingLineup` (Array) - Array of players in starting lineup
- `playerReports` (Object) - Object containing player reports by player ID

**Returns:**
- `Object` - `{ isValid: boolean, message: string, needsConfirmation: boolean }`

**Validation:**
- Checks that all starting lineup players have `minutesPlayed > 0`
- Returns error message with player names if validation fails

**Note:** Validates **presence** of minutes, not values (since minutes are auto-calculated).

**Used By:**
- Tests only (`squadValidation.test.js`)

---

## 🎨 **Frontend Components**

### 1. `src/features/game-management/components/GameDetailsPage/index.jsx`

#### **Pre-fetching Logic**

**State:**
```javascript
const [teamStats, setTeamStats] = useState({});
const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);
```

**Pre-fetch Effect:**
```javascript
useEffect(() => {
  if (game?.status === 'Played' && gameId) {
    setIsLoadingTeamStats(true);
    fetchPlayerStats(gameId)
      .then(stats => {
        setTeamStats(stats);
        setIsLoadingTeamStats(false);
      })
      .catch(error => {
        console.error('Error fetching player stats:', error);
        setIsLoadingTeamStats(false);
      });
  }
}, [gameId, game?.status]);
```

**Refresh After Events:**
```javascript
const refreshTeamStats = async () => {
  if (game?.status === 'Played') {
    try {
      const stats = await fetchPlayerStats(gameId);
      setTeamStats(stats);
    } catch (error) {
      console.error('Error refreshing team stats:', error);
    }
  }
};

// Called after:
// - Goal created/updated/deleted
// - Substitution created/updated/deleted
```

**Pass to Dialog:**
```javascript
<PlayerPerformanceDialog
  initialMinutes={teamStats[selectedPlayer?._id]?.minutes}
  initialGoals={teamStats[selectedPlayer?._id]?.goals}
  initialAssists={teamStats[selectedPlayer?._id]?.assists}
  isLoadingStats={isLoadingTeamStats}
  // ... other props
/>
```

---

### 2. `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`

#### **Display Logic**

**Max Minutes Calculation:**
```javascript
import { calculateTotalMatchDuration } from '../../../../utils/minutesValidation';

const maxMinutes = useMemo(() => {
  const duration = matchDuration || game?.matchDuration;
  return calculateTotalMatchDuration(duration);
}, [matchDuration, game]);
```

**Minutes Display:**
```javascript
// For "Played" games: Use pre-fetched stats (read-only)
// For "Done" games: Use saved GameReport values
const useCalculated = isPlayedGame && initialMinutes !== undefined;
const displayMinutes = useCalculated 
  ? initialMinutes 
  : (isDoneGame && data?.minutesPlayed !== undefined 
      ? data.minutesPlayed 
      : (data?.minutesPlayed !== undefined ? data.minutesPlayed : 0));
```

**Input Field:**
```javascript
<Input
  type="number"
  min="0"
  max={maxMinutes}
  value={displayMinutes ?? 0}
  disabled={isReadOnly || useCalculated || isDoneGame}
  readOnly={useCalculated || isDoneGame}
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>
```

**Loading Indicator:**
```javascript
{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating minutes...
  </p>
)}
```

---

## 🗄️ **Database Models**

### 1. `GameReport` Model

**Fields:**
```javascript
{
  minutesPlayed: {
    type: Number,
    default: 0
  },
  minutesCalculationMethod: {
    type: String,
    enum: ['calculated', 'manual'],
    default: 'calculated'
  }
}
```

**Behavior:**
- `minutesPlayed` is server-calculated for "Played" games
- `minutesCalculationMethod` tracks how minutes were determined
- Client cannot provide `minutesPlayed` in batch submission

---

### 2. `Game` Model

**Fields:**
```javascript
{
  matchDuration: {
    regularTime: { type: Number, default: 90 },
    firstHalfExtraTime: { type: Number, default: 0 },
    secondHalfExtraTime: { type: Number, default: 0 }
  },
  totalMatchDuration: {
    type: Number
  }
}
```

**Behavior:**
- `matchDuration` can be updated via API
- `totalMatchDuration` is automatically calculated and stored

---

### 3. `Job` Model

**Job Type:**
```javascript
{
  jobType: {
    type: String,
    enum: ['recalc-minutes', 'recalc-goals-assists', 'recalc-analytics']
  }
}
```

**Usage:**
- `'recalc-minutes'` jobs created after substitution/red card events
- Processed by worker asynchronously

---

## ⚙️ **Job Queue Integration**

### Job Creation

**After Substitution Events:**
```javascript
// backend/src/routes/substitutions.js
await Job.create({
  gameId,
  jobType: 'recalc-minutes',
  status: 'pending',
  priority: 'normal'
});
```

**After Red Card Events:**
```javascript
// backend/src/routes/disciplinaryActions.js
if (cardType === 'red' || cardType === 'second-yellow') {
  await Job.create({
    gameId,
    jobType: 'recalc-minutes',
    status: 'pending',
    priority: 'normal'
  });
}
```

### Job Processing

**Worker Handler:**
```javascript
// backend/src/worker.js
case 'recalc-minutes':
  await handleRecalcMinutes(job);
  break;

async function handleRecalcMinutes(job) {
  const { gameId } = job.data;
  await recalculatePlayerMinutes(gameId, true); // Update reports
  console.log(`✅ Recalculated minutes for game ${gameId}`);
}
```

---

## 🔄 **Data Flow**

### 1. Minutes Calculation Flow

```
User Action (Substitution/Red Card)
    ↓
Backend API Route (POST/PUT/DELETE)
    ↓
Create Job: { jobType: 'recalc-minutes', gameId }
    ↓
Worker Process (async)
    ↓
recalculatePlayerMinutes(gameId, updateReports=true)
    ↓
calculatePlayerMinutes(gameId)
    ↓
Session-Based Algorithm
    ↓
Update GameReports: { minutesPlayed, minutesCalculationMethod: 'calculated' }
```

### 2. Frontend Display Flow

```
GameDetailsPage Loads (game.status === 'Played')
    ↓
Pre-fetch: GET /api/games/:gameId/player-stats
    ↓
Store in teamStats state
    ↓
User Clicks Player
    ↓
PlayerPerformanceDialog Opens
    ↓
Display initialMinutes instantly (read-only)
    ↓
User Adds Goal/Substitution
    ↓
refreshTeamStats() called
    ↓
Stats updated in dialog
```

---

## 🧮 **Algorithm Details**

### Session-Based Algorithm

**Concept:**
- Each player has one or more "play sessions"
- Session = time period player is on the pitch
- Total minutes = sum of all session durations

**Initialization:**
```javascript
// Starting lineup players
gameRosters.forEach(roster => {
  playerSessions.set(playerId, [{
    startTime: 0,
    endTime: totalMatchDuration
  }]);
});
```

**Substitution Processing:**
```javascript
// End playerOut's session
const playerOutSessions = playerSessions.get(playerOutId);
const activeSession = playerOutSessions.find(s => s.endTime === totalMatchDuration);
if (activeSession) {
  activeSession.endTime = substitutionMinute;
}

// Start playerIn's session
const playerInSessions = playerSessions.get(playerInId) || [];
playerInSessions.push({
  startTime: substitutionMinute,
  endTime: totalMatchDuration
});
```

**Red Card Processing:**
```javascript
// End player's session immediately
const playerSessions = playerSessions.get(playerId);
const activeSession = playerSessions.find(s => s.endTime === totalMatchDuration);
if (activeSession) {
  activeSession.endTime = redCardMinute;
}
```

**Minutes Calculation:**
```javascript
playerSessions.forEach((sessions, playerId) => {
  const totalMinutes = sessions.reduce((sum, session) => {
    return sum + (session.endTime - session.startTime);
  }, 0);
  calculatedMinutes[playerId] = Math.round(totalMinutes);
});
```

**Example:**
```
Player A: Starting lineup
  Session 1: 0-65 minutes (substituted out)
  Total: 65 minutes

Player B: Substitute
  Session 1: 65-90 minutes (substituted in)
  Total: 25 minutes

Player C: Starting lineup, red card at 45
  Session 1: 0-45 minutes (red card)
  Total: 45 minutes
```

---

## 📊 **Summary**

### Active Components:
- **Backend Services:** 2 files
- **Backend Routes:** 3 files
- **Frontend Utilities:** 2 files
- **Frontend Components:** 2 files
- **Total:** 9 active files

### API Endpoints:
- `PUT /api/games/:gameId/match-duration` - Update match duration
- `GET /api/games/:gameId/player-stats` - Pre-fetch all stats
- `POST /api/game-reports/batch` - Final submission (calculates minutes)
- `GET /api/game-reports/calculate-goals-assists/:gameId` - Goals/assists only

### Key Features:
- ✅ Automated calculation from events
- ✅ Pre-fetching for instant display
- ✅ Background job processing
- ✅ Server-authoritative
- ✅ Session-based algorithm

---

**Last Updated:** December 2024  
**Status:** Production Ready


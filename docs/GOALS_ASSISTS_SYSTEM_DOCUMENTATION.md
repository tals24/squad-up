# Goals & Assists System - Complete Documentation

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
8. [Goal Analytics](#goal-analytics)
9. [Data Flow](#data-flow)
10. [Algorithm Details](#algorithm-details)

---

## 🎯 **Overview**

The Goals & Assists System automatically calculates player goals and assists from the Goals collection. Goals and assists are **server-authoritative** and cannot be manually entered for games in "Played" status.

### Key Principles:
- ✅ **Automated Calculation** - Goals/assists calculated from Goals collection
- ✅ **Server Authoritative** - Client cannot provide goals/assists for "Played" games
- ✅ **Pre-fetching** - Stats loaded before UI display (0ms latency)
- ✅ **Goal Tracking** - Full CRUD operations for goals (TeamGoal and OpponentGoal)
- ✅ **Goal Analytics** - Goal numbers and match states calculated when game = "Done"
- ✅ **Score Calculation** - Team score automatically calculated from goals

---

## 🏗️ **Architecture**

### High-Level Flow:
```
User Creates Goal (TeamGoal/OpponentGoal)
    ↓
Backend API Routes (POST /goals)
    ↓
Goal Saved to Database
    ↓
Frontend Pre-fetching (GET /player-stats)
    ↓
Goals/Assists Calculated from Goals Collection
    ↓
UI Display (Read-Only for "Played" games)
    ↓
Game Status = "Done"
    ↓
Goal Analytics Calculated (goalNumber, matchState)
```

---

## 🔧 **Backend Services**

### 1. `backend/src/services/goalsAssistsCalculation.js`

#### **Function: `calculatePlayerGoalsAssists(gameId)`**

**Purpose:** Calculate player goals and assists from Goals collection

**Parameters:**
- `gameId` (string) - The game ID

**Returns:**
- `Object` - Map of `playerId -> { goals: number, assists: number }`

**Algorithm:**
1. Fetch all TeamGoal documents for the game (excludes OpponentGoal)
2. Count goals: `scorerId` matches playerId
3. Count assists: `assistedById` matches playerId
4. Return consolidated stats map

**Example:**
```javascript
const stats = await calculatePlayerGoalsAssists('game123');
// Returns: { 'playerId1': { goals: 2, assists: 1 }, 'playerId2': { goals: 0, assists: 1 } }
```

**Used By:**
- `POST /api/game-reports/batch` - Final report submission
- `GET /api/games/:gameId/player-stats` - Pre-fetch endpoint

**Key Points:**
- Only counts TeamGoal documents (excludes OpponentGoal)
- Goals without scorerId (own goals) are not counted
- Assists without assistedById are not counted
- Returns empty object `{}` if no team goals found

---

### 2. `backend/src/services/goalAnalytics.js`

#### **Function: `recalculateGoalAnalytics(gameId, finalOurScore, finalOpponentScore)`**

**Purpose:** Recalculate goal numbers and match states for all goals when game status changes to "Done"

**Parameters:**
- `gameId` (string) - The game ID
- `finalOurScore` (number) - Final score for our team
- `finalOpponentScore` (number) - Final score for opponent

**Returns:**
- `Object` - `{ success: boolean, goalsUpdated: number }`

**Algorithm:**
1. Fetch all goals (TeamGoal + OpponentGoal) sorted by minute chronologically
2. Separate team goals and opponent goals using discriminator
3. For each team goal:
   - Calculate `goalNumber`: chronological order (1, 2, 3, ...)
   - Calculate `matchState`: winning/drawing/losing based on score at goal time
   - Count our goals before this goal
   - Count opponent goals before this goal's minute
   - Determine match state: winning if ahead, losing if behind, drawing if equal
4. Update all goals in database

**Example:**
```javascript
await recalculateGoalAnalytics('game123', 3, 1);
// Updates all goals with goalNumber and matchState
```

**Used By:**
- `PUT /api/games/:id` - When game status changes to "Done"

**Match State Logic:**
- **Winning**: Our goals before this goal > Opponent goals before this minute
- **Losing**: Our goals before this goal < Opponent goals before this minute
- **Drawing**: Our goals before this goal = Opponent goals before this minute

---

## 🌐 **Backend API Endpoints**

### 1. `GET /api/games/:gameId/goals`

**File:** `backend/src/routes/goals.js`  
**Authentication:** Required + game access check

**Purpose:** Get all goals for a game

**Response:**
```json
{
  "gameId": "game123",
  "totalGoals": 3,
  "goals": [
    {
      "_id": "goal123",
      "gameId": "game123",
      "minute": 23,
      "goalCategory": "TeamGoal",
      "scorerId": { "fullName": "Player Name", "kitNumber": 10 },
      "assistedById": { "fullName": "Assister Name", "kitNumber": 7 },
      "goalType": "open-play",
      "goalNumber": 1,
      "matchState": "drawing",
      "goalInvolvement": [
        { "playerId": "...", "contributionType": "pre-assist" }
      ]
    },
    {
      "_id": "goal124",
      "gameId": "game123",
      "minute": 45,
      "goalCategory": "OpponentGoal",
      "goalType": "open-play"
    }
  ]
}
```

**Features:**
- Returns both TeamGoal and OpponentGoal documents
- Populates scorer, assister, and goal involvement data
- Sorted by goalNumber (if calculated) or minute

**Used By:**
- Frontend: `GameDetailsPage` goal management

---

### 2. `POST /api/games/:gameId/goals`

**File:** `backend/src/routes/goals.js`  
**Authentication:** Required + game access check

**Purpose:** Create a new goal (TeamGoal or OpponentGoal)

**Request Body (TeamGoal):**
```json
{
  "minute": 23,
  "scorerId": "playerId",
  "assistedById": "playerId", // optional
  "goalType": "open-play", // open-play, set-piece, penalty, counter-attack, own-goal
  "goalInvolvement": [ // optional
    { "playerId": "...", "contributionType": "pre-assist" }
  ],
  "isOpponentGoal": false
}
```

**Request Body (OpponentGoal):**
```json
{
  "minute": 45,
  "goalType": "open-play",
  "isOpponentGoal": true
}
```

**Validation:**
- Scorer required for TeamGoal (unless goalType = "own-goal")
- Scorer and assister cannot be the same player
- Goal involvement players cannot include scorer or assister
- Minute must be between 1-120

**Response:**
```json
{
  "message": "Goal created successfully",
  "goal": { /* created goal object with populated references */ }
}
```

**Used By:**
- Frontend: `GoalDialog` component

---

### 3. `PUT /api/games/:gameId/goals/:goalId`

**File:** `backend/src/routes/goals.js`  
**Authentication:** Required + game access check

**Purpose:** Update an existing goal

**Request Body:**
```json
{
  "minute": 25,
  "scorerId": "playerId",
  "assistedById": "playerId", // or null to remove
  "goalType": "penalty",
  "goalInvolvement": [ /* updated array */ ]
}
```

**Features:**
- Updates only provided fields
- Validates scorer and assister if changed
- Populates references in response

**Used By:**
- Frontend: `GoalDialog` component (edit mode)

---

### 4. `DELETE /api/games/:gameId/goals/:goalId`

**File:** `backend/src/routes/goals.js`  
**Authentication:** Required + game access check

**Purpose:** Delete a goal

**Response:**
```json
{
  "message": "Goal deleted successfully",
  "goalId": "goal123"
}
```

**Used By:**
- Frontend: `GameDetailsPage` goal deletion

---

### 5. `GET /api/games/:gameId/player-stats`

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
- Runs `calculatePlayerGoalsAssists()` in parallel with `calculatePlayerMinutes()`
- Consolidates results into single response object
- Optimized for pre-fetching (single request for all stats)

**Used By:**
- Frontend: `GameDetailsPage` pre-fetching logic

---

### 6. `POST /api/game-reports/batch`

**File:** `backend/src/routes/gameReports.js`  
**Authentication:** Required + game access check

**Purpose:** Batch create/update game reports (final submission)

**Forbidden Fields:**
- `goals` - Server-calculated, cannot be provided
- `assists` - Server-calculated, cannot be provided

**Behavior:**
- Server automatically calculates `goals` and `assists` using `calculatePlayerGoalsAssists()`
- Sets calculated values on all GameReports

**Used By:**
- Frontend: `FinalReportDialog` component

---

## 💻 **Frontend Utilities**

### 1. `src/features/game-management/api/goalsApi.js`

**Functions:**

#### `fetchGoals(gameId)`
- Fetches all goals for a game
- Returns array of goal objects

#### `createGoal(gameId, goalData)`
- Creates new goal (TeamGoal or OpponentGoal)
- Returns created goal object

#### `updateGoal(gameId, goalId, goalData)`
- Updates existing goal
- Returns updated goal object

#### `deleteGoal(gameId, goalId)`
- Deletes goal
- Returns `true` on success

#### `fetchGoalPartnerships(teamId, season)`
- Fetches goal partnerships analytics
- Returns array of scorer-assister combinations

**Used By:**
- `GameDetailsPage/index.jsx` - Goal management
- `GoalDialog.jsx` - Goal CRUD operations

---

### 2. `src/features/game-management/api/playerStatsApi.js`

**Function:**

#### `fetchPlayerStats(gameId)`
- Fetches consolidated player stats (minutes, goals, assists)
- Returns `{ playerId: { minutes, goals, assists } }`
- Used for pre-fetching

**Used By:**
- `GameDetailsPage/index.jsx` - Pre-fetching logic

---

## 🎨 **Frontend Components**

### 1. `src/features/game-management/components/GameDetailsPage/index.jsx`

#### **Goal Management State**

**State:**
```javascript
const [goals, setGoals] = useState([]);
const [showGoalDialog, setShowGoalDialog] = useState(false);
const [selectedGoal, setSelectedGoal] = useState(null);
```

**Load Goals on Mount:**
```javascript
useEffect(() => {
  if (gameId) {
    const loadGoals = async () => {
      try {
        const goalsData = await fetchGoals(gameId);
        setGoals(goalsData);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };
    loadGoals();
  }
}, [gameId]);
```

**Pre-fetching Logic:**
```javascript
const [teamStats, setTeamStats] = useState({});
const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);

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

**Score Calculation from Goals:**
```javascript
useEffect(() => {
  if (!goals || goals.length === 0) {
    // If no goals, keep score from game data or default to 0-0
    return;
  }

  // Calculate score from goals array
  let teamGoalsCount = 0;
  let opponentGoalsCount = 0;

  goals.forEach(goal => {
    if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) {
      opponentGoalsCount++;
    } else {
      teamGoalsCount++;
    }
  });

  setFinalScore(prev => {
    if (prev.ourScore !== teamGoalsCount || prev.opponentScore !== opponentGoalsCount) {
      return {
        ourScore: teamGoalsCount,
        opponentScore: opponentGoalsCount
      };
    }
    return prev;
  });
}, [goals]);
```

**Goal Handlers:**
```javascript
const handleAddGoal = () => {
  setSelectedGoal(null);
  setShowGoalDialog(true);
};

const handleEditGoal = (goal) => {
  setSelectedGoal(goal);
  setShowGoalDialog(true);
};

const handleDeleteGoal = async (goalId) => {
  if (!window.confirm('Are you sure you want to delete this goal?')) {
    return;
  }
  try {
    await deleteGoal(gameId, goalId);
    setGoals(prevGoals => prevGoals.filter(g => g._id !== goalId));
    // Refresh team stats after goal deletion
    refreshTeamStats();
  } catch (error) {
    console.error('Error deleting goal:', error);
    alert('Failed to delete goal: ' + error.message);
  }
};

const handleSaveGoal = async (goalData) => {
  try {
    if (selectedGoal) {
      // Update existing goal
      const updatedGoal = await updateGoal(gameId, selectedGoal._id, goalData);
      setGoals(prevGoals => prevGoals.map(g => g._id === updatedGoal._id ? updatedGoal : g));
    } else {
      // Create new goal
      const newGoal = await createGoal(gameId, goalData);
      setGoals(prevGoals => [...prevGoals, newGoal]);
    }
    // Refresh goals list
    const updatedGoals = await fetchGoals(gameId);
    setGoals(updatedGoals);
    // Refresh team stats after goal save
    refreshTeamStats();
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};
```

**Match Stats Calculation:**
```javascript
const matchStats = useMemo(() => {
  const scorerMap = new Map();
  const assisterMap = new Map();

  // Calculate scorers and assists from goals array (excluding opponent goals)
  (goals || []).forEach((goal) => {
    // Skip opponent goals
    if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) return;

    // Count scorers
    if (goal.scorerId && goal.scorerId._id) {
      const scorerId = goal.scorerId._id;
      const scorerName = goal.scorerId.fullName || goal.scorerId.name || 'Unknown';
      scorerMap.set(scorerId, {
        name: scorerName,
        count: (scorerMap.get(scorerId)?.count || 0) + 1
      });
    }

    // Count assisters
    if (goal.assistedById && goal.assistedById._id) {
      const assisterId = goal.assistedById._id;
      const assisterName = goal.assistedById.fullName || goal.assistedById.name || 'Unknown';
      assisterMap.set(assisterId, {
        name: assisterName,
        count: (assisterMap.get(assisterId)?.count || 0) + 1
      });
    }
  });

  return { 
    scorers: Array.from(scorerMap.values()),
    assists: Array.from(assisterMap.values())
  };
}, [goals]);
```

---

### 2. `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`

#### **Goals/Assists Display Logic**

**Display Priority:**
```javascript
// For "Played" games: Use pre-fetched stats (read-only)
// For "Done" games: Use saved values from GameReport
const useCalculatedGA = isPlayedGame && (initialGoals !== undefined || initialAssists !== undefined);

const displayGoals = useCalculatedGA 
  ? (initialGoals ?? 0)
  : (isDoneGame && data?.goals !== undefined 
      ? data.goals 
      : (data?.goals !== undefined ? data.goals : 0));

const displayAssists = useCalculatedGA 
  ? (initialAssists ?? 0)
  : (isDoneGame && data?.assists !== undefined 
      ? data.assists 
      : (data?.assists !== undefined ? data.assists : 0));
```

**Input Fields:**
```javascript
<Input
  type="number"
  min="0"
  value={displayGoals ?? 0}
  onChange={(e) => {
    if (!useCalculatedGA && !isDoneGame) {
      onDataChange({ ...data, goals: parseInt(e.target.value) || 0 });
    }
  }}
  disabled={isReadOnly || useCalculatedGA || isDoneGame}
  readOnly={useCalculatedGA || isDoneGame}
  placeholder={showStatsLoading ? "Loading..." : undefined}
/>

{showStatsLoading && (
  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
    <span className="animate-spin">⏳</span>
    Calculating goals...
  </p>
)}
```

**Key Points:**
- Goals/assists are read-only for "Played" games (server-calculated)
- Shows loading indicator when stats are being pre-fetched
- Falls back to saved GameReport values for "Done" games

---

### 3. `src/features/game-management/components/GameDetailsPage/components/dialogs/GoalDialog.jsx`

#### **Goal Creation/Editing UI**

**Features:**
- Tabs for Team Goal and Opponent Goal
- Scorer selection (required for TeamGoal, optional for own-goal)
- Assister selection (optional)
- Goal type selection (open-play, set-piece, penalty, counter-attack, own-goal)
- Goal involvement multi-select (pre-assist, space-creation, etc.)
- Minute input (validated against match duration)
- Match state selection (for manual override)

**Validation:**
- Scorer required for TeamGoal (unless own-goal)
- Minute cannot exceed match duration
- Scorer and assister cannot be the same
- Goal involvement players cannot include scorer or assister

**Used By:**
- `GameDetailsPage/index.jsx` - Goal management UI

---

## 🗄️ **Database Models**

### 1. `Goal` Model (Base Schema)

**File:** `backend/src/models/Goal.js`

**Base Fields:**
```javascript
{
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  goalNumber: {
    type: Number,
    min: 1
    // Calculated when game status = "Done"
  },
  matchState: {
    type: String,
    enum: ['winning', 'drawing', 'losing']
    // Calculated when game status = "Done"
  }
}
```

**Discriminator Key:** `goalCategory` (distinguishes TeamGoal from OpponentGoal)

**Indexes:**
- `{ gameId: 1, goalNumber: 1 }` - For efficient game-level queries
- `{ gameId: 1, minute: 1 }` - For timeline analysis

---

### 2. `TeamGoal` Discriminator

**Fields:**
```javascript
{
  scorerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: false, // Optional for own goals
    index: true
  },
  assistedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
    index: true
  },
  goalInvolvement: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    contributionType: {
      type: String,
      enum: ['pre-assist', 'space-creation', 'defensive-action', 'set-piece-delivery', 'pressing-action', 'other'],
      required: true
    }
  }],
  goalType: {
    type: String,
    enum: ['open-play', 'set-piece', 'penalty', 'counter-attack', 'own-goal'],
    default: 'open-play'
  }
}
```

**Validations:**
- Scorer and assister cannot be the same player
- Goal involvement players cannot include scorer or assister
- Scorer required unless goalType = "own-goal"

---

### 3. `OpponentGoal` Discriminator

**Fields:**
```javascript
{
  goalType: {
    type: String,
    enum: ['open-play', 'set-piece', 'penalty', 'counter-attack'],
    default: 'open-play'
  }
  // No scorerId, assistedById, or goalInvolvement
}
```

**Note:** OpponentGoal only tracks minute and goalType. No scorer/assister data.

---

### 4. `GameReport` Model

**Fields:**
```javascript
{
  goals: {
    type: Number,
    default: 0
    // Server-calculated from Goals collection
  },
  assists: {
    type: Number,
    default: 0
    // Server-calculated from Goals collection
  }
}
```

**Behavior:**
- `goals` and `assists` are server-calculated for "Played" games
- Client cannot provide these fields in batch submission
- Values stored in GameReport for "Done" games

---

## 📊 **Goal Analytics**

### Goal Number Calculation

**When:** Game status changes to "Done"

**Algorithm:**
1. Fetch all TeamGoal documents sorted by minute chronologically
2. Assign `goalNumber` sequentially: 1, 2, 3, ...
3. Update all goals in database

**Example:**
```
Goal at 23': goalNumber = 1
Goal at 45': goalNumber = 2
Goal at 67': goalNumber = 3
```

---

### Match State Calculation

**When:** Game status changes to "Done"

**Algorithm:**
For each TeamGoal:
1. Count our goals scored BEFORE this goal (0-indexed position)
2. Count opponent goals scored BEFORE this goal's minute
3. Determine match state:
   - **Winning**: Our goals > Opponent goals
   - **Losing**: Our goals < Opponent goals
   - **Drawing**: Our goals = Opponent goals

**Example:**
```
Game: Our team wins 3-1

Goal 1 at 23' (Our): 
  Our goals before: 0
  Opponent goals before 23': 0
  Match state: "drawing"

Goal 2 at 45' (Opponent):
  (OpponentGoal, no match state)

Goal 3 at 67' (Our):
  Our goals before: 1
  Opponent goals before 67': 1
  Match state: "drawing"

Goal 4 at 89' (Our):
  Our goals before: 2
  Opponent goals before 89': 1
  Match state: "winning"
```

---

## 🔄 **Data Flow**

### 1. Goal Creation Flow

```
User Creates Goal (GoalDialog)
    ↓
Frontend: createGoal(gameId, goalData)
    ↓
Backend: POST /api/games/:gameId/goals
    ↓
Validation (scorer, assister, minute)
    ↓
Save Goal to Database (TeamGoal or OpponentGoal)
    ↓
Return Created Goal (populated)
    ↓
Frontend: Update goals state
    ↓
Frontend: Recalculate score from goals
    ↓
Frontend: Refresh team stats (pre-fetch)
```

---

### 2. Goals/Assists Calculation Flow

```
GameDetailsPage Loads (game.status === 'Played')
    ↓
Pre-fetch: GET /api/games/:gameId/player-stats
    ↓
Backend: calculatePlayerGoalsAssists(gameId)
    ↓
Fetch TeamGoal documents (exclude OpponentGoal)
    ↓
Count goals: scorerId matches playerId
    ↓
Count assists: assistedById matches playerId
    ↓
Return: { playerId: { goals, assists } }
    ↓
Store in teamStats state
    ↓
User Clicks Player
    ↓
PlayerPerformanceDialog Opens
    ↓
Display initialGoals/initialAssists instantly (read-only)
```

---

### 3. Goal Analytics Flow

```
Game Status Changes to "Done"
    ↓
Backend: PUT /api/games/:id
    ↓
Call: recalculateGoalAnalytics(gameId, finalOurScore, finalOpponentScore)
    ↓
Fetch all goals (TeamGoal + OpponentGoal) sorted by minute
    ↓
Separate team goals and opponent goals
    ↓
For each TeamGoal:
    Calculate goalNumber (chronological order)
    Calculate matchState (winning/drawing/losing)
    ↓
Update all goals in database
    ↓
Return success
```

---

## 🧮 **Algorithm Details**

### Goals Calculation Algorithm

**Input:** `gameId`

**Steps:**
1. Query Goals collection:
   ```javascript
   const teamGoals = await Goal.find({ 
     gameId,
     goalCategory: 'TeamGoal' // Only team goals
   }).select('scorerId assistedById');
   ```

2. Initialize result map:
   ```javascript
   const playerStats = {};
   ```

3. Count goals and assists:
   ```javascript
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
   ```

4. Return consolidated stats:
   ```javascript
   return playerStats; // { playerId: { goals: number, assists: number } }
   ```

**Example:**
```
Goals in database:
- Goal 1: scorerId = "player1", assistedById = "player2"
- Goal 2: scorerId = "player1", assistedById = null
- Goal 3: scorerId = "player2", assistedById = "player1"

Result:
{
  "player1": { goals: 2, assists: 1 },
  "player2": { goals: 1, assists: 0 }
}
```

---

### Score Calculation Algorithm

**Input:** `goals` array

**Steps:**
1. Initialize counters:
   ```javascript
   let teamGoalsCount = 0;
   let opponentGoalsCount = 0;
   ```

2. Iterate through goals:
   ```javascript
   goals.forEach(goal => {
     if (goal.goalCategory === 'OpponentGoal' || goal.isOpponentGoal) {
       opponentGoalsCount++;
     } else {
       teamGoalsCount++;
     }
   });
   ```

3. Update score state:
   ```javascript
   setFinalScore({
     ourScore: teamGoalsCount,
     opponentScore: opponentGoalsCount
   });
   ```

**Example:**
```
Goals array:
- TeamGoal at 23'
- OpponentGoal at 45'
- TeamGoal at 67'
- TeamGoal at 89'

Result:
{ ourScore: 3, opponentScore: 1 }
```

---

## 📊 **Summary**

### Active Components:
- **Backend Services:** 2 files
- **Backend Routes:** 2 files (goals.js, games.js)
- **Frontend API:** 2 files
- **Frontend Components:** 3 files
- **Total:** 9 active files

### API Endpoints:
- `GET /api/games/:gameId/goals` - Get all goals
- `POST /api/games/:gameId/goals` - Create goal
- `PUT /api/games/:gameId/goals/:goalId` - Update goal
- `DELETE /api/games/:gameId/goals/:goalId` - Delete goal
- `GET /api/games/:gameId/player-stats` - Pre-fetch all stats (includes goals/assists)
- `POST /api/game-reports/batch` - Final submission (calculates goals/assists)

### Key Features:
- ✅ Automated calculation from Goals collection
- ✅ Pre-fetching for instant display
- ✅ Server-authoritative
- ✅ Goal CRUD operations
- ✅ Goal analytics (goalNumber, matchState)
- ✅ Score calculation from goals
- ✅ Support for TeamGoal and OpponentGoal
- ✅ Goal involvement tracking

---

**Last Updated:** December 2024  
**Status:** Production Ready


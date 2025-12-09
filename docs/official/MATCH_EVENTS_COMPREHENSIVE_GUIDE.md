# Match Events Comprehensive Guide

## 🎯 Overview

This document provides a complete reference for **Goals**, **Substitutions**, and **Cards** - the three core timeline events in the SquadUp football management system. It covers all validation rules, API endpoints, functions, and business logic.

**Last Updated**: 2024-12-19

---

## 📋 Table of Contents

1. [Goals](#goals)
2. [Substitutions](#substitutions)
3. [Cards](#cards)
4. [Timeline Service](#timeline-service)
5. [Game Rules Engine](#game-rules-engine)
6. [Validation Summary](#validation-summary)

---

## ⚽ Goals

### Overview

Goals represent scoring events during a match. They can be:
- **Team Goals**: Scored by the team (with optional scorer, assister, and goal involvement)
- **Opponent Goals**: Scored by the opposing team

### Database Schema

**Model**: `Goal` (with discriminators: `TeamGoal`, `OpponentGoal`)

```javascript
{
  gameId: ObjectId,           // Required
  minute: Number,             // Required (1-120)
  goalType: String,           // 'open-play', 'penalty', 'free-kick', 'corner', 'own-goal'
  goalCategory: String,       // 'TeamGoal' or 'OpponentGoal'
  
  // TeamGoal fields
  scorerId: ObjectId,         // Optional (null for own goals)
  assistedById: ObjectId,     // Optional
  goalInvolvement: [{         // Optional (for goal involvement tracking feature)
    playerId: ObjectId,
    involvementType: String   // 'shot', 'pass', 'cross', etc.
  }],
  
  // Calculated fields (when game status = "Done")
  goalNumber: Number,         // Sequential goal number
  matchState: String          // 'winning', 'drawing', 'losing'
}
```

### API Endpoints

#### **POST** `/api/games/:gameId/goals`
**Purpose**: Create a new goal

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "minute": 25,
  "scorerId": "60f7b3b3b3b3b3b3b3b3b3b3",      // Required for team goals (unless own-goal)
  "assistedById": "60f7b3b3b3b3b3b3b3b3b3b4", // Optional
  "goalType": "open-play",                     // Optional, default: "open-play"
  "goalInvolvement": [                         // Optional
    {
      "playerId": "60f7b3b3b3b3b3b3b3b3b3b5",
      "involvementType": "shot"
    }
  ],
  "isOpponentGoal": false                      // Optional, default: false
}
```

**Response** (201 Created):
```json
{
  "message": "Goal created successfully",
  "goal": {
    "_id": "...",
    "gameId": "...",
    "minute": 25,
    "scorerId": { "fullName": "John Doe", "kitNumber": 10 },
    "assistedById": { "fullName": "Jane Smith", "kitNumber": 7 },
    "goalType": "open-play",
    "goalCategory": "TeamGoal"
  }
}
```

**Validation Errors** (400 Bad Request):
- `"Scorer is required for team goals"` - Team goal without scorer (unless own-goal)
- `"Scorer not found"` - Invalid scorerId
- `"Assister not found"` - Invalid assistedById
- `"Invalid goal assignment"` - Game rules validation failed (see below)

---

#### **GET** `/api/games/:gameId/goals`
**Purpose**: Get all goals for a game

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "gameId": "...",
  "totalGoals": 3,
  "goals": [
    {
      "_id": "...",
      "minute": 15,
      "scorerId": { "fullName": "John Doe" },
      "goalType": "penalty",
      "goalNumber": 1,
      "matchState": "winning"
    }
  ]
}
```

**Sorting**: By `goalNumber` (ascending)

---

#### **GET** `/api/games/:gameId/goals/:goalId`
**Purpose**: Get a specific goal

**Authentication**: Required (JWT)

**Response** (200 OK): Single goal object

---

#### **PUT** `/api/games/:gameId/goals/:goalId`
**Purpose**: Update an existing goal

**Authentication**: Required (JWT)

**Request Body**: Same as POST (all fields optional)

**Response** (200 OK): Updated goal object

**Validation**: Same as POST

---

#### **DELETE** `/api/games/:gameId/goals/:goalId`
**Purpose**: Delete a goal

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "message": "Goal deleted successfully"
}
```

---

### Validation Rules

#### 1. **Game Rules Validation** (`validateGoalEligibility`)

**Location**: `backend/src/services/gameRules.js`

**Rules**:
- ✅ **Scorer must be ON_PITCH** at the minute
- ✅ **Assister must be ON_PITCH** at the minute (if provided)
- ✅ **Scorer and assister cannot be the same player**
- ✅ **Both scorer and assister must be in the game squad** (starting lineup or bench)

**Player States**:
- `ON_PITCH`: Player is currently playing
- `BENCH`: Player is on the bench
- `SUBSTITUTED_OUT`: Player was substituted out
- `SENT_OFF`: Player was sent off (red card)
- `NOT_IN_SQUAD`: Player is not in the game roster

**Error Messages**:
- `"Scorer must be on the pitch. Current state: sent off"`
- `"Scorer must be on the pitch. Current state: on bench"`
- `"Scorer must be on the pitch. Current state: substituted out"`
- `"Assister must be on the pitch. Current state: ..."`
- `"Assister cannot be the same as scorer"`
- `"Scorer must be in the game squad (starting lineup or bench)"`

**Implementation**:
```javascript
const validation = await validateGoalEligibility(gameId, scorerId, assisterId, minute);
if (!validation.valid) {
  return res.status(400).json({
    message: 'Invalid goal assignment',
    error: validation.error
  });
}
```

---

#### 2. **Basic Field Validation**

- `minute`: Must be between 1 and 120
- `scorerId`: Must exist in Player collection (for team goals, unless own-goal)
- `assistedById`: Must exist in Player collection (if provided)
- `goalType`: Must be one of: `'open-play'`, `'penalty'`, `'free-kick'`, `'corner'`, `'own-goal'`

---

### Frontend Functions

**Location**: `src/features/game-management/api/goalsApi.js`

```javascript
// Fetch all goals for a game
fetchGoals(gameId) → Promise<Goal[]>

// Fetch a specific goal
fetchGoal(gameId, goalId) → Promise<Goal>

// Create a new goal
createGoal(gameId, goalData) → Promise<Goal>
// goalData: { minute, scorerId?, assistedById?, goalType?, goalInvolvement?, isOpponentGoal? }

// Update an existing goal
updateGoal(gameId, goalId, goalData) → Promise<Goal>

// Delete a goal
deleteGoal(gameId, goalId) → Promise<void>
```

**Error Handling**: All functions extract `error.error` from backend responses for detailed validation messages.

---

### Related Services

- **Timeline Service**: Goals are included in unified timeline
- **Minutes Calculation**: Goals don't affect player minutes
- **Player Stats**: Goals contribute to player's goal count

---

## 🔄 Substitutions

### Overview

Substitutions represent player changes during a match. They affect:
- Player minutes calculation
- Player state (ON_PITCH ↔ BENCH/SUBSTITUTED_OUT)
- Match timeline

### Database Schema

**Model**: `Substitution`

```javascript
{
  gameId: ObjectId,           // Required
  playerOutId: ObjectId,      // Required (player leaving)
  playerInId: ObjectId,      // Required (player entering)
  minute: Number,             // Required (1-120)
  reason: String,             // 'tactical', 'injury', 'fatigue', 'disciplinary'
  matchState: String,         // 'winning', 'drawing', 'losing'
  tacticalNote: String        // Optional tactical note
}
```

### API Endpoints

#### **POST** `/api/games/:gameId/substitutions`
**Purpose**: Create a new substitution

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "playerOutId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "playerInId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "minute": 60,
  "reason": "tactical",              // Optional, default: "tactical"
  "matchState": "winning",           // Optional, default: "drawing"
  "tacticalNote": "Need more pace"   // Optional
}
```

**Response** (201 Created):
```json
{
  "message": "Substitution created successfully",
  "substitution": {
    "_id": "...",
    "gameId": "...",
    "playerOutId": { "fullName": "John Doe", "kitNumber": 10 },
    "playerInId": { "fullName": "Jane Smith", "kitNumber": 7 },
    "minute": 60,
    "reason": "tactical"
  }
}
```

**Side Effects**:
- ✅ Creates `recalc-minutes` job (background process to recalculate player minutes)

**Validation Errors** (400 Bad Request):
- `"Player leaving field not found"` - Invalid playerOutId
- `"Player entering field not found"` - Invalid playerInId
- `"Invalid substitution"` - Game rules validation failed (see below)

---

#### **GET** `/api/games/:gameId/substitutions`
**Purpose**: Get all substitutions for a game

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "gameId": "...",
  "totalSubstitutions": 3,
  "substitutions": [
    {
      "_id": "...",
      "minute": 45,
      "playerOutId": { "fullName": "John Doe" },
      "playerInId": { "fullName": "Jane Smith" },
      "reason": "tactical"
    }
  ]
}
```

**Sorting**: By `minute` (ascending)

---

#### **GET** `/api/games/:gameId/substitutions/:subId`
**Purpose**: Get a specific substitution

**Authentication**: Required (JWT)

**Response** (200 OK): Single substitution object

---

#### **PUT** `/api/games/:gameId/substitutions/:subId`
**Purpose**: Update an existing substitution

**Authentication**: Required (JWT)

**Request Body**: Same as POST (all fields optional)

**Response** (200 OK): Updated substitution object

**Side Effects**: Creates `recalc-minutes` job if `minute`, `playerOutId`, or `playerInId` changed

**Validation**: Same as POST

---

#### **DELETE** `/api/games/:gameId/substitutions/:subId`
**Purpose**: Delete a substitution

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "message": "Substitution deleted successfully"
}
```

**Side Effects**: Creates `recalc-minutes` job

---

### Validation Rules

#### 1. **Game Rules Validation** (`validateSubstitutionEligibility`)

**Location**: `backend/src/services/gameRules.js`

**Rules**:
- ✅ **PlayerOut must be ON_PITCH** at the minute
- ✅ **PlayerOut cannot be SENT_OFF**
- ✅ **PlayerIn must be BENCH or SUBSTITUTED_OUT** at the minute
- ✅ **PlayerIn cannot be SENT_OFF**
- ✅ **PlayerIn cannot be ON_PITCH** (already playing)
- ✅ **Players must be different**

**Error Messages**:
- `"Player leaving field must be on the pitch. Current state: on bench"`
- `"Player leaving field must be on the pitch. Current state: already substituted out"`
- `"Cannot substitute a player who has been sent off"`
- `"Player entering field must be on bench or previously substituted out. Current state: ON_PITCH"`
- `"Cannot substitute in a player who has been sent off"`
- `"Player out and player in must be different"`

**Implementation**:
```javascript
const validation = await validateSubstitutionEligibility(gameId, playerOutId, playerInId, minute);
if (!validation.valid) {
  return res.status(400).json({
    message: 'Invalid substitution',
    error: validation.error
  });
}
```

---

#### 2. **Future Consistency Check** (`validateFutureConsistency`)

**Purpose**: Prevent out-of-order event corruption

**Scenario**: User adds a substitution at minute 5, but player already scored a goal at minute 10.

**Rules**:
- ✅ **If PlayerOut is substituted at minute T**, check for future events involving PlayerOut:
  - Goals (scorer/assister) at minute > T → **BLOCK**
  - Cards at minute > T → **BLOCK**
  - Other substitutions (playerOut) at minute > T → **BLOCK**

**Error Messages**:
- `"Cannot be substituted out at minute 5 because the player scored a goal at minute 10. Please delete or modify the conflicting events first."`
- `"Cannot be substituted out at minute 5 because the player received a red card at minute 8. Please delete or modify the conflicting events first."`

**Implementation**:
```javascript
const futureConsistency = await validateFutureConsistency(gameId, {
  type: 'substitution',
  minute,
  playerOutId,
  playerInId
});
if (!futureConsistency.valid) {
  return res.status(400).json({
    message: 'Invalid substitution',
    error: futureConsistency.error
  });
}
```

---

#### 3. **Basic Field Validation**

- `minute`: Must be between 1 and 120
- `playerOutId`: Must exist in Player collection
- `playerInId`: Must exist in Player collection
- `reason`: Must be one of: `'tactical'`, `'injury'`, `'fatigue'`, `'disciplinary'`

---

### Frontend Functions

**Location**: `src/features/game-management/api/substitutionsApi.js`

```javascript
// Fetch all substitutions for a game
fetchSubstitutions(gameId) → Promise<Substitution[]>

// Fetch a specific substitution
fetchSubstitution(gameId, subId) → Promise<Substitution>

// Create a new substitution
createSubstitution(gameId, subData) → Promise<Substitution>
// subData: { playerOutId, playerInId, minute, reason?, matchState?, tacticalNote? }

// Update an existing substitution
updateSubstitution(gameId, subId, subData) → Promise<Substitution>

// Delete a substitution
deleteSubstitution(gameId, subId) → Promise<void>
```

**Error Handling**: All functions extract `error.error` from backend responses for detailed validation messages.

---

### Related Services

- **Timeline Service**: Substitutions are included in unified timeline
- **Minutes Calculation**: Substitutions trigger `recalc-minutes` job
- **Game Rules Engine**: Uses substitutions to reconstruct player state

---

## 🟨🟥 Cards

### Overview

Cards represent disciplinary actions during a match. They affect:
- Player state (red card → SENT_OFF)
- Player minutes calculation (red card → player leaves pitch)
- Match timeline

### Database Schema

**Model**: `Card`

```javascript
{
  gameId: ObjectId,           // Required
  playerId: ObjectId,         // Required
  minute: Number,             // Required (1-120)
  cardType: String,           // Required: 'yellow', 'red', 'second-yellow'
  reason: String              // Optional (max 200 chars)
}
```

### API Endpoints

#### **POST** `/api/games/:gameId/cards`
**Purpose**: Create a new card

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "playerId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "cardType": "yellow",       // 'yellow', 'red', 'second-yellow'
  "minute": 45,
  "reason": "Unsporting behavior"  // Optional
}
```

**Response** (201 Created):
```json
{
  "message": "Card created successfully",
  "card": {
    "_id": "...",
    "gameId": "...",
    "playerId": { "fullName": "John Doe", "kitNumber": 10 },
    "cardType": "yellow",
    "minute": 45,
    "reason": "Unsporting behavior"
  }
}
```

**Side Effects**:
- ✅ Creates `recalc-minutes` job if `cardType` is `'red'` or `'second-yellow'`

**Validation Errors** (400 Bad Request):
- `"Player not found"` - Invalid playerId
- `"Invalid card assignment"` - Card type validation or game rules validation failed (see below)

---

#### **GET** `/api/games/:gameId/cards`
**Purpose**: Get all cards for a game

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "gameId": "...",
  "totalCards": 5,
  "cards": [
    {
      "_id": "...",
      "minute": 25,
      "playerId": { "fullName": "John Doe" },
      "cardType": "yellow",
      "reason": "Unsporting behavior"
    }
  ]
}
```

**Sorting**: By `minute` (ascending), then `createdAt` (ascending)

---

#### **GET** `/api/games/:gameId/cards/player/:playerId`
**Purpose**: Get cards for a specific player in a game

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "gameId": "...",
  "playerId": "...",
  "totalCards": 2,
  "cards": [...]
}
```

---

#### **PUT** `/api/games/:gameId/cards/:cardId`
**Purpose**: Update an existing card

**Authentication**: Required (JWT)

**Request Body**: Same as POST (all fields optional)

**Response** (200 OK): Updated card object

**Side Effects**: 
- Creates `recalc-minutes` job if `cardType` changed to/from `'red'` or `'second-yellow'`
- Validates card type rules if `cardType` is being updated

**Validation**: Same as POST

---

#### **DELETE** `/api/games/:gameId/cards/:cardId`
**Purpose**: Delete a card

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "message": "Card deleted successfully"
}
```

**Side Effects**: Creates `recalc-minutes` job if deleted card was red/second-yellow

---

### Validation Rules

#### 1. **Card Type Validation** (`canReceiveCard`)

**Location**: `backend/src/utils/cardValidation.js` (backend)  
**Location**: `src/features/game-management/utils/cardValidation.js` (frontend)

**Rules**:
- ✅ **Clean Slate (0 cards)**: Can get Yellow OR Red, **NOT** Second Yellow
- ✅ **Existing Yellow (1 Yellow)**: Can get Second Yellow OR Direct Red, **NOT** another Yellow
- ✅ **Sent Off (Red OR Second Yellow)**: Cannot receive **ANY** new cards

**Card Type Matrix**:

| Current State | Yellow | Red | Second Yellow |
|--------------|--------|-----|---------------|
| 0 cards | ✅ | ✅ | ❌ |
| 1 Yellow | ❌ | ✅ | ✅ |
| Red Card | ❌ | ❌ | ❌ |
| Second Yellow | ❌ | ❌ | ❌ |

**Error Messages**:
- `"Player has already been sent off and cannot receive additional cards"`
- `"Player already has a yellow card. Use 'Second Yellow' instead"`
- `"Player must have a yellow card before receiving a second yellow"`
- `"Player already has multiple yellow cards or has been sent off"`

**Implementation**:
```javascript
const existingCards = await Card.find({ gameId, playerId }).lean();
const cardTypeValidation = canReceiveCard(existingCards, cardType);
if (!cardTypeValidation.valid) {
  return res.status(400).json({ 
    message: 'Invalid card assignment',
    error: cardTypeValidation.error 
  });
}
```

---

#### 2. **Game Rules Validation** (`validateCardEligibility`)

**Location**: `backend/src/services/gameRules.js`

**Rules**:
- ✅ **Player must be ON_PITCH or BENCH** at the minute
- ✅ **Player cannot be SENT_OFF** (already sent off)
- ✅ **Player must be in the game squad**

**Note**: Cards can be given to bench players (unlike goals, which require ON_PITCH)

**Error Messages**:
- `"Player must be on the pitch or on the bench. Current state: sent off"`
- `"Player must be on the pitch or on the bench. Current state: not in squad"`

**Implementation**:
```javascript
const eligibilityValidation = await validateCardEligibility(gameId, playerId, minute);
if (!eligibilityValidation.valid) {
  return res.status(400).json({
    message: 'Invalid card assignment',
    error: eligibilityValidation.error
  });
}
```

---

#### 3. **Future Consistency Check** (`validateFutureConsistency`)

**Purpose**: Prevent out-of-order event corruption (only for red cards)

**Scenario**: User adds a red card at minute 5, but player already scored a goal at minute 10.

**Rules**:
- ✅ **If Player receives Red Card at minute T**, check for future events involving Player:
  - Goals (scorer/assister) at minute > T → **BLOCK**
  - Cards at minute > T → **BLOCK**
  - Substitutions (playerOut) at minute > T → **BLOCK**

**Error Messages**:
- `"Cannot receive a red card at minute 5 because the player scored a goal at minute 10. Please delete or modify the conflicting events first."`
- `"Cannot receive a red card at minute 5 because the player was substituted out at minute 8. Please delete or modify the conflicting events first."`

**Implementation**:
```javascript
if (cardType === 'red' || cardType === 'second-yellow') {
  const futureConsistency = await validateFutureConsistency(gameId, {
    type: 'card',
    minute,
    playerId,
    cardType
  });
  if (!futureConsistency.valid) {
    return res.status(400).json({
      message: 'Invalid card assignment',
      error: futureConsistency.error
    });
  }
}
```

---

#### 4. **Basic Field Validation**

- `minute`: Must be between 1 and 120
- `playerId`: Must exist in Player collection
- `cardType`: Must be one of: `'yellow'`, `'red'`, `'second-yellow'`
- `reason`: Optional, max 200 characters

---

### Frontend Functions

**Location**: `src/features/game-management/api/cardsApi.js`

```javascript
// Fetch all cards for a game
fetchCards(gameId) → Promise<Card[]>

// Fetch cards for a specific player
fetchPlayerCards(gameId, playerId) → Promise<Card[]>

// Create a new card
createCard(gameId, cardData) → Promise<Card>
// cardData: { playerId, cardType, minute, reason? }

// Update an existing card
updateCard(gameId, cardId, cardData) → Promise<Card>

// Delete a card
deleteCard(gameId, cardId) → Promise<void>
```

**Error Handling**: All functions extract `error.error` from backend responses for detailed validation messages.

---

### Frontend Utilities

**Location**: `src/features/game-management/utils/cardValidation.js`

```javascript
// Validate if player can receive a card type
canReceiveCard(existingCards, newCardType) → { valid: boolean, error: string|null }

// Get available card options for a player
getAvailableCardOptions(existingCards) → {
  yellow: boolean,
  red: boolean,
  secondYellow: boolean,
  isSentOff: boolean
}

// Get recommended card type (auto-selects "second-yellow" if player has 1 yellow)
getRecommendedCardType(existingCards) → string|null
```

---

### Related Services

- **Timeline Service**: Cards are included in unified timeline
- **Minutes Calculation**: Red cards trigger `recalc-minutes` job
- **Game Rules Engine**: Uses cards to reconstruct player state

---

## 📊 Timeline Service

### Overview

The Timeline Service provides a unified, chronologically sorted view of all match events (Goals, Substitutions, Cards) from multiple collections.

**Location**: `backend/src/services/timelineService.js`

### Function

#### `getMatchTimeline(gameId)`

**Purpose**: Fetch and merge all timeline events from Cards, Goals, and Substitutions collections

**Returns**: `Promise<Array<TimelineEvent>>`

**Timeline Event Structure**:
```javascript
{
  id: ObjectId,              // Event ID
  type: String,              // 'goal', 'opponent-goal', 'card', 'substitution'
  minute: Number,            // Minute of event
  timestamp: Date,           // Created timestamp (for secondary sorting)
  
  // Card-specific fields
  cardType?: String,         // 'yellow', 'red', 'second-yellow'
  player?: Object,           // Player object
  reason?: String,           // Card reason
  
  // Goal-specific fields
  scorer?: Object,           // Scorer player object
  assister?: Object,         // Assister player object
  goalInvolvement?: Array,   // Goal involvement array
  goalType?: String,         // Goal type
  goalNumber?: Number,       // Sequential goal number
  matchState?: String,       // Match state
  
  // Substitution-specific fields
  playerOut?: Object,        // Player leaving
  playerIn?: Object,         // Player entering
  reason?: String,           // Substitution reason
  matchState?: String,       // Match state
  tacticalNote?: String      // Tactical note
}
```

**Sorting**:
1. Primary: `minute` (ascending)
2. Secondary: `timestamp` (ascending) - if same minute

**Implementation**:
```javascript
const timeline = await getMatchTimeline(gameId);
// Returns chronologically sorted array of all events
```

### API Endpoint

#### **GET** `/api/games/:gameId/timeline`
**Purpose**: Get unified match timeline

**Authentication**: Required (JWT)

**Response** (200 OK):
```json
{
  "gameId": "...",
  "totalEvents": 15,
  "timeline": [
    {
      "id": "...",
      "type": "goal",
      "minute": 15,
      "scorer": { "fullName": "John Doe" },
      "assister": { "fullName": "Jane Smith" }
    },
    {
      "id": "...",
      "type": "card",
      "minute": 25,
      "cardType": "yellow",
      "player": { "fullName": "Bob Wilson" }
    }
  ]
}
```

---

## 🎮 Game Rules Engine

### Overview

The Game Rules Engine validates match events by reconstructing player state at specific minutes. It ensures logical consistency (e.g., players can't score while on the bench).

**Location**: `backend/src/services/gameRules.js`

### Core Function

#### `getPlayerStateAtMinute(timeline, playerId, targetMinute, startingLineup, squadPlayers)`

**Purpose**: Reconstruct a player's state at a specific minute by iterating through timeline events chronologically

**Parameters**:
- `timeline`: Array of timeline events (from `getMatchTimeline`)
- `playerId`: Player ID to track
- `targetMinute`: Minute to check state at
- `startingLineup`: Map of `playerId -> true` for starting lineup players
- `squadPlayers`: Map of `playerId -> status` for all squad players

**Returns**: `PlayerState` enum value

**Player States**:
```javascript
const PlayerState = {
  NOT_IN_SQUAD: 'NOT_IN_SQUAD',      // Not in game roster
  BENCH: 'BENCH',                     // On bench
  ON_PITCH: 'ON_PITCH',               // Currently playing
  SUBSTITUTED_OUT: 'SUBSTITUTED_OUT', // Was substituted out
  SENT_OFF: 'SENT_OFF'                // Sent off (red card)
};
```

**State Transitions**:
1. **Initial State**: Based on starting lineup
   - In starting lineup → `ON_PITCH`
   - On bench → `BENCH`
   - Not in squad → `NOT_IN_SQUAD`

2. **Substitution (Out)**: `ON_PITCH` → `SUBSTITUTED_OUT`

3. **Substitution (In)**: `BENCH` or `SUBSTITUTED_OUT` → `ON_PITCH`

4. **Red Card**: Any state → `SENT_OFF` (irreversible)

**Implementation**:
```javascript
const timeline = await getMatchTimeline(gameId);
const startingLineup = await getStartingLineup(gameId);
const squadPlayers = await getSquadPlayers(gameId);

const playerState = getPlayerStateAtMinute(
  timeline,
  playerId,
  targetMinute,
  startingLineup,
  squadPlayers
);
```

---

### Validation Functions

#### 1. `validateGoalEligibility(gameId, scorerId, assisterId, minute)`

**Purpose**: Validate if a player can score/assist a goal at a specific minute

**Rules**:
- Scorer must be `ON_PITCH`
- Assister must be `ON_PITCH` (if provided)
- Scorer and assister cannot be the same player
- Both must be in squad

**Returns**: `{ valid: boolean, error: string|null }`

---

#### 2. `validateSubstitutionEligibility(gameId, playerOutId, playerInId, minute)`

**Purpose**: Validate if a substitution can be made at a specific minute

**Rules**:
- PlayerOut must be `ON_PITCH`
- PlayerOut cannot be `SENT_OFF`
- PlayerIn must be `BENCH` or `SUBSTITUTED_OUT`
- PlayerIn cannot be `SENT_OFF`
- PlayerIn cannot be `ON_PITCH`
- Players must be different

**Returns**: `{ valid: boolean, error: string|null }`

---

#### 3. `validateCardEligibility(gameId, playerId, minute)`

**Purpose**: Validate if a player can receive a card at a specific minute

**Rules**:
- Player must be `ON_PITCH` or `BENCH`
- Player cannot be `SENT_OFF`
- Player must be in squad

**Returns**: `{ valid: boolean, error: string|null }`

---

#### 4. `validateFutureConsistency(gameId, newEvent)`

**Purpose**: Prevent out-of-order event corruption

**Rules**:
- For substitutions: Check if PlayerOut has future events (goals, cards, subs)
- For red cards: Check if Player has future events (goals, cards, subs)

**Event Types**:
- `{ type: 'substitution', minute, playerOutId, playerInId }`
- `{ type: 'card', minute, playerId, cardType }`

**Returns**: `{ valid: boolean, error: string|null }`

**Error Format**:
```
"Cannot {action} at minute {T} because the player {conflict description}. Please delete or modify the conflicting events first."
```

---

### Helper Functions

#### `getStartingLineup(gameId)`

**Purpose**: Get map of starting lineup players

**Returns**: `Promise<Object>` - Map of `playerId -> true`

---

#### `getSquadPlayers(gameId)`

**Purpose**: Get map of all squad players (starting lineup + bench)

**Returns**: `Promise<Object>` - Map of `playerId -> status` ('Starting Lineup' or 'Bench')

---

## ✅ Validation Summary

### Validation Layers

1. **Frontend Validation** (UX):
   - Card type options (disable invalid options)
   - Form field validation (required fields, ranges)
   - Immediate feedback (before API call)

2. **Backend Validation** (Data Integrity):
   - Card type rules (`canReceiveCard`)
   - Game rules (`validateGoalEligibility`, `validateSubstitutionEligibility`, `validateCardEligibility`)
   - Future consistency (`validateFutureConsistency`)
   - Field validation (existence, ranges, enums)

### Validation Order (Backend)

**For Goals**:
1. Basic field validation (minute, scorerId exists, etc.)
2. Game rules validation (`validateGoalEligibility`)
3. Save goal

**For Substitutions**:
1. Basic field validation (minute, players exist, etc.)
2. Game rules validation (`validateSubstitutionEligibility`)
3. Future consistency check (`validateFutureConsistency`)
4. Save substitution
5. Create `recalc-minutes` job

**For Cards**:
1. Basic field validation (minute, playerId exists, etc.)
2. Card type validation (`canReceiveCard`)
3. Game rules validation (`validateCardEligibility`)
4. Future consistency check (`validateFutureConsistency`) - only for red cards
5. Save card
6. Create `recalc-minutes` job (only for red cards)

---

## 🔗 Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Database schema details
- [Refactor Disciplinary Architecture Plan](./planned_features/refactor_disciplinary_architecture_plan.md) - Architecture decisions

---

## 📝 Notes

- **Timeline Events**: Goals, Substitutions, and Cards are all "timeline events" - they happen at specific minutes
- **Player State**: State is reconstructed chronologically, not stored
- **Rolling Subs**: System supports rolling substitutions (players can re-enter)
- **Red Cards**: Red cards are irreversible (player cannot return)
- **Minutes Calculation**: Substitutions and red cards trigger background jobs to recalculate player minutes
- **Future Consistency**: Prevents retroactive data corruption when events are entered out of order

---

**Last Updated**: 2024-12-19


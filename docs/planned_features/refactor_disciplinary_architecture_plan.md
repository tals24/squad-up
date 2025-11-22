# Refactor Disciplinary Architecture - Implementation Plan

## Overview

This plan refactors the game-management database schema by separating **Timeline Events** (Cards) from **Aggregate Statistics** (Fouls, Shots, etc.), and implements a Virtual Timeline Service to provide a unified chronological view of match events.

## Architecture Decision

### Problem Statement
The current `DisciplinaryAction` model mixes two distinct data types:
- **Timeline Events**: Cards (Yellow/Red) that occur at specific minutes and affect game state (trigger recalc-minutes job)
- **Aggregate Stats**: Fouls (Committed/Received) that are just counters, feature-flagged, and don't affect game time

### Solution: Separation of Concerns
1. **`Card` Collection**: Dedicated to timeline events (Yellow/Red cards)
2. **`PlayerMatchStat` Collection**: Centralized container for all aggregate statistics (Fouls, Shots, Passing, etc.)
3. **Virtual Timeline Service**: Aggregates Cards, Goals, and Substitutions into unified chronological stream

---

## Phase 1: Backend Models

### 1.1 Create Card Model
**File:** `backend/src/models/Card.js`

**Purpose:** Timeline event for disciplinary cards (Yellow/Red/Second Yellow)

**Schema:**
```javascript
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true, 
    index: true 
  },
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true, 
    index: true 
  },
  
  // Timeline Data
  minute: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 120 
  },
  cardType: { 
    type: String, 
    enum: ['yellow', 'red', 'second-yellow'], 
    required: true 
  },
  
  // Context
  reason: { 
    type: String, 
    maxlength: 200 
  }
}, { timestamps: true });

// Indexes
cardSchema.index({ gameId: 1, minute: 1 }); // Timeline order
cardSchema.index({ gameId: 1, playerId: 1 }); // Player cards per game

module.exports = mongoose.model('Card', cardSchema);
```

**Key Points:**
- No fouls fields (moved to PlayerMatchStat)
- Minute is required (critical for recalc-minutes job)
- Timestamps for chronological sorting

---

### 1.2 Create PlayerMatchStat Model
**File:** `backend/src/models/PlayerMatchStat.js`

**Purpose:** Centralized container for all aggregate player statistics per game

**Schema:**
```javascript
const mongoose = require('mongoose');

const playerMatchStatSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true 
  },
  
  // 1. Disciplinary Stats (Moved from DisciplinaryAction)
  disciplinary: {
    foulsCommitted: { type: Number, default: 0, min: 0 },
    foulsReceived: { type: Number, default: 0, min: 0 }
  },

  // 2. Shot Tracking (Future Extensibility)
  shooting: {
    shotsOnTarget: { type: Number, default: 0 },
    shotsOffTarget: { type: Number, default: 0 },
    blockedShots: { type: Number, default: 0 },
    hitWoodwork: { type: Number, default: 0 }
  },

  // 3. Passing (Future Extensibility)
  passing: {
    totalPasses: { type: Number, default: 0 },
    completedPasses: { type: Number, default: 0 },
    keyPasses: { type: Number, default: 0 }
  }

  // ... add more stat categories as needed (corners, duels, etc.)
}, { timestamps: true });

// Compound Index: Ensures one stat sheet per player per game
playerMatchStatSchema.index({ gameId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerMatchStat', playerMatchStatSchema);
```

**Key Points:**
- One document per player per game (upsert pattern)
- Extensible structure (add new stat categories without schema migration)
- Feature flags handled at API/UI layer, not DB layer

---

## Phase 2: Backend API Routes

### 2.1 Create Cards API Routes
**File:** `backend/src/routes/cards.js`

**Endpoints:**
- `POST /api/games/:gameId/cards` - Create card
- `GET /api/games/:gameId/cards` - Get all cards for game
- `GET /api/games/:gameId/cards/player/:playerId` - Get cards for specific player
- `PUT /api/games/:gameId/cards/:cardId` - Update card
- `DELETE /api/games/:gameId/cards/:cardId` - Delete card

**Critical Logic:**
- Red cards (`cardType === 'red' || cardType === 'second-yellow'`) MUST trigger `recalc-minutes` job
- Use `checkGameAccess` middleware for all routes
- Populate player info in responses

**Example POST handler:**
```javascript
router.post('/:gameId/cards', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, cardType, minute, reason } = req.body;

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Create card
    const card = new Card({
      gameId,
      playerId,
      cardType,
      minute,
      reason: reason || ''
    });

    await card.save();

    // ✅ CRITICAL: Trigger recalc-minutes job for red cards
    if (cardType === 'red' || cardType === 'second-yellow') {
      await Job.create({
        jobType: 'recalc-minutes',
        payload: { gameId },
        status: 'pending',
        runAt: new Date()
      });
    }

    await card.populate('playerId', 'fullName kitNumber position');

    res.status(201).json({
      message: 'Card created successfully',
      card
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create card', 
      error: error.message 
    });
  }
});
```

---

### 2.2 Create PlayerMatchStats API Routes
**File:** `backend/src/routes/playerMatchStats.js`

**Endpoints:**
- `GET /api/games/:gameId/player-match-stats` - Get all stats for game
- `GET /api/games/:gameId/player-match-stats/player/:playerId` - Get stats for specific player
- `PUT /api/games/:gameId/player-match-stats/player/:playerId` - Update/upsert stats

**Critical Logic:**
- Use upsert pattern (findOneAndUpdate with upsert: true)
- Does NOT trigger recalc-minutes job (stats don't affect game time)
- Feature flag checks should be done at API layer (return filtered data based on organizationConfig)

**Example PUT handler:**
```javascript
router.put('/:gameId/player-match-stats/player/:playerId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { disciplinary, shooting, passing } = req.body;

    // Upsert stats
    const stats = await PlayerMatchStat.findOneAndUpdate(
      { gameId, playerId },
      {
        gameId,
        playerId,
        ...(disciplinary && { disciplinary }),
        ...(shooting && { shooting }),
        ...(passing && { passing })
      },
      { upsert: true, new: true }
    );

    await stats.populate('playerId', 'fullName kitNumber position');

    res.json({
      message: 'Player match stats updated successfully',
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update player match stats', 
      error: error.message 
    });
  }
});
```

---

## Phase 3: Virtual Timeline Service

### 3.1 Create Timeline Service
**File:** `backend/src/services/timelineService.js`

**Purpose:** Aggregate timeline events from Card, Goal, and Substitution collections into unified chronological array

**Implementation:**
```javascript
const Card = require('../models/Card');
const Goal = require('../models/Goal');
const Substitution = require('../models/Substitution');

/**
 * Get unified match timeline from multiple collections
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} Chronologically sorted array of timeline events
 */
async function getMatchTimeline(gameId) {
  // Fetch all timeline events in parallel
  const [cards, goals, substitutions] = await Promise.all([
    Card.find({ gameId })
      .populate('playerId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean(),
    
    Goal.find({ gameId })
      .populate('scorerId', 'fullName kitNumber position')
      .populate('assistedById', 'fullName kitNumber position')
      .populate('goalInvolvement.playerId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean(),
    
    Substitution.find({ gameId })
      .populate('playerOutId', 'fullName kitNumber position')
      .populate('playerInId', 'fullName kitNumber position')
      .sort({ minute: 1, createdAt: 1 })
      .lean()
  ]);

  // Normalize Cards
  const normalizedCards = cards.map(card => ({
    id: card._id,
    type: 'card',
    minute: card.minute,
    timestamp: card.createdAt,
    cardType: card.cardType,
    player: card.playerId,
    reason: card.reason
  }));

  // Normalize Goals
  const normalizedGoals = goals.map(goal => ({
    id: goal._id,
    type: goal.goalCategory === 'TeamGoal' ? 'goal' : 'opponent-goal',
    minute: goal.minute,
    timestamp: goal.createdAt,
    scorer: goal.scorerId,
    assister: goal.assistedById,
    goalInvolvement: goal.goalInvolvement,
    goalType: goal.goalType,
    goalNumber: goal.goalNumber,
    matchState: goal.matchState
  }));

  // Normalize Substitutions
  const normalizedSubs = substitutions.map(sub => ({
    id: sub._id,
    type: 'substitution',
    minute: sub.minute,
    timestamp: sub.createdAt,
    playerOut: sub.playerOutId,
    playerIn: sub.playerInId,
    reason: sub.reason,
    matchState: sub.matchState,
    tacticalNote: sub.tacticalNote
  }));

  // Merge and sort chronologically
  const timeline = [
    ...normalizedCards,
    ...normalizedGoals,
    ...normalizedSubs
  ].sort((a, b) => {
    // Primary sort: minute
    if (a.minute !== b.minute) {
      return a.minute - b.minute;
    }
    // Secondary sort: timestamp (if same minute)
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  return timeline;
}

module.exports = { getMatchTimeline };
```

---

### 3.2 Create Timeline API Endpoint
**File:** `backend/src/routes/games.js` (add new route) OR `backend/src/routes/timeline.js` (new file)

**Endpoint:** `GET /api/games/:gameId/timeline`

**Implementation:**
```javascript
const { getMatchTimeline } = require('../services/timelineService');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

/**
 * GET /api/games/:gameId/timeline
 * Get unified chronological timeline for a match
 */
router.get('/:gameId/timeline', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const timeline = await getMatchTimeline(gameId);
    
    res.json({
      gameId,
      totalEvents: timeline.length,
      timeline
    });
  } catch (error) {
    console.error('Error fetching match timeline:', error);
    res.status(500).json({ 
      message: 'Failed to fetch match timeline', 
      error: error.message 
    });
  }
});
```

**Benefits:**
- Single API call for frontend to get all timeline events
- Consistent data structure across event types
- Parallel fetching for performance
- Centralized timeline logic

---

## Phase 4: Frontend Card Implementation

### 4.1 Create Card API Client
**File:** `src/features/game-management/api/cardsApi.js` (NEW)

**Functions:**
- `fetchCards(gameId)` - Get all cards for a game
- `fetchPlayerCards(gameId, playerId)` - Get cards for specific player (optional, prefer filtering timeline)
- `createCard(gameId, cardData)` - Create new card
- `updateCard(gameId, cardId, cardData)` - Update card
- `deleteCard(gameId, cardId)` - Delete card

**Implementation:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchCards = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch cards');
  const data = await response.json();
  return data.cards || [];
};

export const createCard = async (gameId, cardData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/cards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cardData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create card');
  }
  const data = await response.json();
  return data.card;
};

// Similar implementations for updateCard and deleteCard
```

---

### 4.2 Create CardDialog Component
**File:** `src/features/game-management/components/GameDetailsPage/components/dialogs/CardDialog.jsx` (NEW)

**Purpose:** Dedicated dialog for creating/editing cards with minute validation

**Pattern:** Mimics `GoalDialog.jsx` structure

**Fields:**
- **Player**: Dropdown (Required) - filtered to `gamePlayers` prop
- **Card Type**: Radio Group or Select (Required) - Options: Yellow, Red, Second Yellow
- **Minute**: Number Input (Required, 1-120) - Critical for backend recalc-minutes job
- **Reason**: Text Input (Optional, max 200 chars)

**Props:**
```javascript
export default function CardDialog({
  isOpen,
  onClose,
  onSave,
  card = null, // For editing existing card
  gamePlayers = [], // Active players (lineup + bench)
  matchDuration = 90, // Max minute validation
  isReadOnly = false,
  game = null // For feature flags
})
```

**Validation:**
- Player required
- Card type required
- Minute required, must be between 1 and matchDuration
- Reason optional, max 200 characters

**Key Features:**
- Form state management similar to GoalDialog
- Error handling and display
- Loading state during save
- Reset form on close/cancel

---

### 4.3 Add Card Button to MatchAnalysisSidebar
**File:** `src/features/game-management/components/GameDetailsPage/components/MatchAnalysisSidebar.jsx`

**Changes:**
- Add new "Cards" section (similar to Goals/Substitutions sections)
- Display list of cards with:
  - Card type badge (Yellow/Red/Second Yellow)
  - Minute
  - Player name
  - Reason (if exists)
- Add "Add Card" button (only visible when `isPlayed && !isDone`)
- Button calls `onAddCard` handler prop (passed from GameDetailsPage)

**Location:** Add after Substitutions section

**Example Structure:**
```javascript
{/* Cards Section - Only show for Played/Done */}
{(isPlayed || isDone) && (
  <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
          Cards ({cards.length})
        </CardTitle>
        {!isDone && onAddCard && (
          <Button
            onClick={onAddCard}
            size="sm"
            className="h-7 px-2 bg-gradient-to-r from-yellow-500 to-orange-500"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {/* Display cards list */}
    </CardContent>
  </Card>
)}
```

---

### 4.4 Integrate CardDialog in GameDetailsPage
**File:** `src/features/game-management/components/GameDetailsPage/index.jsx`

**State Additions:**
```javascript
const [showCardDialog, setShowCardDialog] = useState(false);
const [selectedCard, setSelectedCard] = useState(null);
const [cards, setCards] = useState([]);
```

**Handler Functions:**
```javascript
// Add card handler
const handleAddCard = () => {
  setSelectedCard(null);
  setShowCardDialog(true);
};

// Edit card handler
const handleEditCard = (card) => {
  setSelectedCard(card);
  setShowCardDialog(true);
};

// Delete card handler
const handleDeleteCard = async (cardId) => {
  if (!window.confirm('Are you sure you want to delete this card?')) {
    return;
  }
  try {
    await deleteCard(gameId, cardId);
    setCards(prevCards => prevCards.filter(c => c._id !== cardId));
    // Refresh team stats if red card was deleted (affects minutes)
    refreshTeamStats();
  } catch (error) {
    console.error('Error deleting card:', error);
    alert('Failed to delete card: ' + error.message);
  }
};

// Save card handler
const handleSaveCard = async (cardData) => {
  try {
    if (selectedCard) {
      // Update existing card
      await updateCard(gameId, selectedCard._id, cardData);
    } else {
      // Create new card
      await createCard(gameId, cardData);
    }
    
    // Refresh cards list
    const updatedCards = await fetchCards(gameId);
    setCards(updatedCards);
    
    // Refresh team stats if red card (affects minutes)
    if (cardData.cardType === 'red' || cardData.cardType === 'second-yellow') {
      refreshTeamStats();
    }
    
    setShowCardDialog(false);
    setSelectedCard(null);
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};
```

**Data Fetching:**
- Fetch cards on component mount (similar to goals/substitutions)
- Refresh cards after save/delete operations

**Component Rendering:**
```javascript
<CardDialog
  isOpen={showCardDialog}
  onClose={() => {
    setShowCardDialog(false);
    setSelectedCard(null);
  }}
  onSave={handleSaveCard}
  card={selectedCard}
  gamePlayers={activeGamePlayers}
  matchDuration={matchDuration.regularTime + matchDuration.firstHalfExtraTime + matchDuration.secondHalfExtraTime}
  isReadOnly={isDone}
  game={game}
/>
```

**Props Passed to MatchAnalysisSidebar:**
- Add `onAddCard={handleAddCard}` prop
- Add `cards={cards}` prop

---

### 4.5 Update PlayerPerformanceDialog - Read-Only Cards Display
**File:** `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`

**Critical Requirement:** Use pre-fetched data, avoid new API calls

**Changes:**
- Remove card creation form from Disciplinary tab (cards now managed via CardDialog)
- Add read-only cards list section in Disciplinary tab
- Display cards by filtering pre-fetched timeline data (passed as prop) or from `teamStats[playerId].cards` if available
- Avoid triggering new API calls on dialog open

**Data Source Priority:**
1. Filter from unified timeline array (if `timeline` prop is passed from parent)
2. Use `teamStats[player._id].cards` if teamStats pre-fetch includes card data
3. Fallback to empty array (cards will appear after parent refreshes timeline)

**Implementation:**
```javascript
// In PlayerPerformanceDialog component
const playerCards = useMemo(() => {
  if (timeline) {
    return timeline.filter(event => 
      event.type === 'card' && 
      event.player?._id === player._id
    );
  }
  // Fallback: could check teamStats if cards are included there
  return [];
}, [timeline, player._id]);

// Display in Disciplinary tab
{playerCards.length > 0 ? (
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-300 mb-2">Cards Received</h3>
    {playerCards.map(card => (
      <div key={card.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded">
        <Badge className={getCardBadgeColor(card.cardType)}>
          {card.cardType === 'yellow' && '🟨'} Yellow
          {card.cardType === 'red' && '🟥'} Red
          {card.cardType === 'second-yellow' && '🟨🟥'} Second Yellow
        </Badge>
        <span className="text-sm text-white">Minute {card.minute}'</span>
        {card.reason && <span className="text-xs text-slate-400">{card.reason}</span>}
      </div>
    ))}
  </div>
) : (
  <p className="text-sm text-slate-500">No cards received</p>
)}
```

**Props Update:**
- Add optional `timeline` prop to PlayerPerformanceDialog (passed from GameDetailsPage)
- Or ensure `teamStats` prop includes card information

**Performance Note:**
- No `fetchPlayerCards()` API call in this component
- Cards are filtered from data already loaded in parent component
- Maintains the pre-fetch performance optimization pattern

---

## Phase 5: Data Migration

### 5.1 Create Migration Script
**File:** `backend/scripts/migrateDisciplinaryData.js`

**Purpose:** Migrate existing `DisciplinaryAction` documents to new `Card` and `PlayerMatchStat` collections

**Process:**
1. Read all existing `DisciplinaryAction` documents
2. For each document:
   - Create `Card` document (using `cardType`, `minute`, `reason`)
   - Create/Update `PlayerMatchStat` document:
     - Upsert by `gameId` + `playerId`
     - Set `disciplinary.foulsCommitted` and `disciplinary.foulsReceived`
3. Verify totals match (count of cards, sum of fouls)
4. Optionally: Archive or delete old `DisciplinaryAction` collection

**Example Implementation:**
```javascript
const mongoose = require('mongoose');
const DisciplinaryAction = require('../src/models/DisciplinaryAction');
const Card = require('../src/models/Card');
const PlayerMatchStat = require('../src/models/PlayerMatchStat');

async function migrateDisciplinaryData() {
  try {
    const actions = await DisciplinaryAction.find({});
    console.log(`Found ${actions.length} disciplinary actions to migrate`);

    let cardsCreated = 0;
    let statsUpdated = 0;

    for (const action of actions) {
      // Create Card
      const card = new Card({
        gameId: action.gameId,
        playerId: action.playerId,
        cardType: action.cardType,
        minute: action.minute,
        reason: action.reason || ''
      });
      await card.save();
      cardsCreated++;

      // Upsert PlayerMatchStat
      await PlayerMatchStat.findOneAndUpdate(
        { gameId: action.gameId, playerId: action.playerId },
        {
          gameId: action.gameId,
          playerId: action.playerId,
          disciplinary: {
            foulsCommitted: action.foulsCommitted || 0,
            foulsReceived: action.foulsReceived || 0
          }
        },
        { upsert: true }
      );
      statsUpdated++;
    }

    console.log(`Migration complete:`);
    console.log(`- Cards created: ${cardsCreated}`);
    console.log(`- Stats updated: ${statsUpdated}`);
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migration
migrateDisciplinaryData()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

---

## Phase 6: Frontend Refactoring

### 6.1 Update Existing Components
**Files to Update:**
- `src/features/game-management/components/GameDetailsPage/index.jsx`
  - Replace `disciplinaryActionsApi` calls with `cardsApi` and `playerMatchStatsApi`
  - Update state management for cards vs stats
  - Integrate timeline service usage

- `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`
  - Remove detailed disciplinary form (fouls)
  - Add read-only cards display (filtered from timeline)
  - Update to use `PlayerMatchStat` API for fouls (if feature enabled)

### 6.2 Update API Imports
**Files:**
- Replace `disciplinaryActionsApi` imports with `cardsApi` and `playerMatchStatsApi`
- Add `timelineApi` import where needed

### 6.3 Feature Flag Integration
- Ensure `FeatureGuard` still wraps detailed disciplinary fields (fouls)
- Cards are always visible (not feature-flagged)
- Stats (fouls) are conditionally shown based on `detailedDisciplinaryEnabled`

---

## Phase 7: Cleanup

### 7.1 Remove Legacy Code
**Files to Delete:**
- `backend/src/models/DisciplinaryAction.js`
- `backend/src/routes/disciplinaryActions.js`

**Files to Update:**
- `backend/src/app.js` - Remove disciplinaryActions route registration
- Update any remaining references to DisciplinaryAction model

---

## Phase 8: Documentation Updates

### 8.1 Update API Documentation
**File:** `docs/API_DOCUMENTATION.md`

**Changes Required:**

1. **Remove Disciplinary Actions Section:**
   - Remove entire section: `#### **Disciplinary Actions** (/api/games/:gameId/disciplinary-actions)`
   - Remove all endpoints: GET, GET /player/:playerId, POST, PUT, DELETE

2. **Add Cards Section:**
   - Add new section: `#### **Cards** (/api/games/:gameId/cards)`
   - Document all endpoints:
     - `GET /api/games/:gameId/cards` - Get all cards for a game
     - `GET /api/games/:gameId/cards/player/:playerId` - Get cards for specific player
     - `POST /api/games/:gameId/cards` - Create new card
     - `PUT /api/games/:gameId/cards/:cardId` - Update card
     - `DELETE /api/games/:gameId/cards/:cardId` - Delete card
   - Include request/response examples
   - Note: Red cards trigger recalc-minutes job

3. **Add Player Match Stats Section:**
   - Add new section: `#### **Player Match Stats** (/api/games/:gameId/player-match-stats)`
   - Document endpoints:
     - `GET /api/games/:gameId/player-match-stats` - Get all stats for game
     - `GET /api/games/:gameId/player-match-stats/player/:playerId` - Get stats for specific player
     - `PUT /api/games/:gameId/player-match-stats/player/:playerId` - Update/upsert stats
   - Include request/response examples
   - Note: Stats don't trigger recalc-minutes job

4. **Add Timeline Endpoint:**
   - Add new section: `#### **Match Timeline** (/api/games/:gameId/timeline)`
   - Document endpoint:
     - `GET /api/games/:gameId/timeline` - Get unified chronological timeline
   - Include response example showing normalized event structure
   - Explain that it aggregates Cards, Goals, and Substitutions

5. **Update Game Events Section Header:**
   - Update section description to mention Cards instead of Disciplinary Actions

### 8.2 Update Database Architecture Documentation
**File:** `docs/DATABASE_ARCHITECTURE.md`

**Changes Required:**

1. **Update Match Events Domain Section:**
   - Remove `disciplinaryactions` collection entry
   - Add `cards` collection entry:
     ```markdown
     #### `cards`
     **Purpose:** Card events during matches (Yellow/Red/Second Yellow)
     **Relationships:**
     - References `games` (gameId)
     - References `players` (playerId)
     **Size:** Small-Medium (typically 100-500 documents per season)
     **Growth:** Moderate (adds 1-3 cards per game)
     **Indexes:**
     - `{ gameId: 1, minute: 1 }` - Timeline order
     - `{ gameId: 1, playerId: 1 }` - Player cards per game
     **Special Features:**
     - Red cards trigger recalc-minutes job
     - Minute field is required (critical for timeline)
     ```

2. **Add PlayerMatchStat Collection:**
   - Add new section under Match Data Domain:
     ```markdown
     #### `playermatchstats`
     **Purpose:** Aggregate player statistics per game (Fouls, Shots, Passing, etc.)
     **Relationships:**
     - References `games` (gameId)
     - References `players` (playerId)
     **Size:** Medium (typically 100-1000 documents)
     **Growth:** Moderate (one per player per game)
     **Indexes:**
     - `{ gameId: 1, playerId: 1 }` - Unique constraint (one stat sheet per player per game)
     **Special Features:**
     - Uses upsert pattern (efficient updates)
     - Extensible structure (add new stat categories without migration)
     - Feature flags handled at API/UI layer
     ```

3. **Update Collection Count:**
   - Update total from 17 to 18 collections (removed disciplinaryactions, added cards and playermatchstats)

4. **Update Collection Relationships Diagram:**
   - Remove `disciplinaryactions` from diagram
   - Add `cards` and `playermatchstats` to diagram
   - Update relationship arrows

5. **Update Query Patterns Section:**
   - Replace `DisciplinaryAction.find({ gameId })` with `Card.find({ gameId })`
   - Add example query for PlayerMatchStat
   - Update Game Details Page query pattern

6. **Update Indexing Strategy Section:**
   - Remove DisciplinaryActions indexes
   - Add Card indexes
   - Add PlayerMatchStat indexes

7. **Update Data Growth Projections Table:**
   - Remove `disciplinaryactions` row
   - Add `cards` row
   - Add `playermatchstats` row

### 8.3 Update Other Documentation Files

**Files to Review and Update:**

1. **`docs/ENHANCED_MATCH_EVENT_TRACKING_SPEC.md`** (if exists):
   - Update disciplinary action references to Card model
   - Update schema definitions
   - Update API endpoint references

2. **`docs/GAP_ANALYSIS_ENHANCED_MATCH_EVENT_TRACKING.md`** (if exists):
   - Update status of disciplinary tracking implementation
   - Note the architectural change (Card vs Stats separation)

3. **`backend/README.md`** (if exists):
   - Update model list
   - Update route list
   - Update any examples using DisciplinaryAction

4. **`docs/GOALS_ASSISTS_SYSTEM_DOCUMENTATION.md`** (if exists):
   - Add note about timeline service integration
   - Update any references to disciplinary actions

### 8.4 Create Migration Documentation
**File:** `docs/MIGRATIONS/disciplinary_architecture_refactor.md` (NEW)

**Purpose:** Document the migration process for future reference

**Content:**
- Migration date and version
- What changed (DisciplinaryAction → Card + PlayerMatchStat)
- Migration script location and usage
- Rollback procedure (if needed)
- Data verification steps

---

## Implementation Order & Dependencies

### Phase Order:
1. **Phase 1**: Backend Models (Card, PlayerMatchStat)
2. **Phase 2**: Backend API Routes (cards, playerMatchStats)
3. **Phase 3**: Virtual Timeline Service (timelineService + endpoint)
4. **Phase 4**: Frontend Card Implementation
   - 4.1: Card API Client
   - 4.2: CardDialog Component
   - 4.3: MatchAnalysisSidebar Integration
   - 4.4: GameDetailsPage Integration
   - 4.5: PlayerPerformanceDialog Update
5. **Phase 5**: Data Migration (run after Phase 1-2 complete)
6. **Phase 6**: Frontend Refactoring (update existing components)
7. **Phase 7**: Cleanup (remove legacy code)
8. **Phase 8**: Documentation Updates (API docs, DB architecture, migration docs)

### Critical Dependencies:
- Phase 4 depends on Phase 2 (API routes must exist)
- Phase 4.5 depends on Phase 3 (timeline service for pre-fetched data)
- Phase 5 depends on Phase 1-2 (models and routes must exist)
- Phase 6-7 depend on Phase 4-5 (new system must be working before cleanup)
- Phase 8 depends on Phase 1-7 (documentation reflects final implementation)

---

## Testing Checklist

### Backend Testing:
- [ ] Card creation triggers recalc-minutes job for red cards
- [ ] Card deletion triggers recalc-minutes job if red card deleted
- [ ] PlayerMatchStat upsert works correctly
- [ ] Timeline service returns correctly sorted events
- [ ] Timeline endpoint returns unified chronological array

### Frontend Testing:
- [ ] CardDialog validates minute field correctly
- [ ] CardDialog saves cards successfully
- [ ] MatchAnalysisSidebar displays cards correctly
- [ ] PlayerPerformanceDialog shows read-only cards (no API call)
- [ ] Feature flags still work for detailed disciplinary fields
- [ ] Timeline integration works (single API call for all events)

### Migration Testing:
- [ ] Migration script runs without errors
- [ ] Card count matches original DisciplinaryAction count
- [ ] Foul totals match original data
- [ ] No data loss during migration

---

## Notes & Considerations

### Performance:
- Timeline service uses `Promise.all()` for parallel fetching
- Frontend uses pre-fetched data to avoid unnecessary API calls
- PlayerMatchStat uses upsert pattern (efficient for updates)

### Extensibility:
- New stat categories can be added to PlayerMatchStat without schema migration
- New timeline event types can be added to timeline service
- Feature flags handled at API/UI layer, not DB layer

### Data Integrity:
- Cards always trigger recalc-minutes job for red cards (critical)
- Stats never trigger recalc-minutes job (by design)
- Minute field is required for cards (validation enforced)

### Backward Compatibility:
- Migration script ensures existing data is preserved
- API responses maintain similar structure where possible
- Frontend gradually migrates to new endpoints

---

## Success Criteria

1. ✅ Cards are managed via dedicated CardDialog component
2. ✅ Fouls are stored in PlayerMatchStat collection
3. ✅ Timeline service provides unified chronological view
4. ✅ Red cards correctly trigger recalc-minutes job
5. ✅ Feature flags still control detailed disciplinary visibility
6. ✅ No performance regressions (pre-fetch pattern maintained)
7. ✅ Migration completes without data loss
8. ✅ Legacy DisciplinaryAction code removed

---

## Future Enhancements

### Potential Additions:
- Shot tracking stats (already scaffolded in PlayerMatchStat)
- Passing stats (already scaffolded in PlayerMatchStat)
- Corner kicks, free kicks, etc. (add to PlayerMatchStat)
- Additional timeline events (injuries, VAR decisions, etc.)

### Timeline Service Enhancements:
- Add caching layer for frequently accessed timelines
- Add filtering options (by event type, player, etc.)
- Add pagination for very long matches

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation


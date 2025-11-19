# Investigation Plan: Start-Game Race Condition

## Problem Summary

When users click "Game Was Played," they experience three critical symptoms:

1. **Slow Request**: The `POST /api/games/:gameId/start-game` endpoint takes much longer than expected
2. **Weird UI State**: After the request completes, the GameDetailsPage shows incorrect state (missing report indicators disappear)
3. **Stale Data**: Navigating away and returning shows the game as not "Played" and lineup is empty (20-80 second delay before data appears)

## Root Cause Hypothesis

1. **Transaction Slowness**: The atomic transaction is correctly implemented but slow (needs measurement)
2. **Poor UI Feedback**: No clear indication that a long-running operation is happening
3. **Read-After-Write Problem**: Frontend reads data before MongoDB transaction is fully committed and propagated to replicas
4. **State Update Bug**: Frontend state update logic may be overwriting important fields (like `game.reports`)

---

## Part 1: Backend Logging (✅ COMPLETED)

### Changes Made

**File**: `backend/src/routes/games.js`

Added comprehensive timing logs to measure every step:

```javascript
console.time('Full start-game transaction')  // Wraps entire operation
console.time('Lineup validation')            // Measures validateLineup()
console.time('Roster save loop')             // Measures GameRoster upsert loop
console.time('Game status save')              // Measures game.save()
console.time('Transaction commit')           // Measures commitTransaction()
console.time('Populate references')          // Measures populate() calls
```

### Expected Output

When you run the operation, you'll see:
```
🚀 [start-game] Starting transaction: { gameId: '...', rosterCount: 25, ... }
Lineup validation: 45.123ms
Roster save loop: 234.567ms
Game status save: 12.345ms
Transaction commit: 89.012ms
Populate references: 34.567ms
Full start-game transaction: 415.614ms
✅ [start-game] Request completed successfully
```

### Next Steps

1. **Run the operation** and check backend console logs
2. **Identify the bottleneck** - which step takes the longest?
3. **Optimize accordingly**:
   - If "Roster save loop" is slow → Consider batch operations
   - If "Transaction commit" is slow → Check MongoDB replica lag
   - If "Lineup validation" is slow → Optimize validation queries

---

## Part 2: Frontend Loading State (Plan)

### Current Problem

The `isSaving` spinner in the header is not sufficient for a long-running transaction. Users can:
- Navigate away during the operation
- Not understand that a critical operation is happening
- Experience confusion when the UI updates unexpectedly

### Proposed Solution: Modal Overlay

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

#### Implementation Plan

1. **Create a blocking modal component**:

```jsx
// Add new state
const [isFinalizingGame, setIsFinalizingGame] = useState(false);

// In executeGameWasPlayed:
const executeGameWasPlayed = async () => {
  setIsFinalizingGame(true); // Show modal
  setIsSaving(true);
  try {
    // ... existing code ...
  } finally {
    setIsSaving(false);
    setIsFinalizingGame(false); // Hide modal
  }
};
```

2. **Add modal component** (before return statement):

```jsx
{isFinalizingGame && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center border border-cyan-500/30 shadow-2xl">
      <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
      <h2 className="text-2xl font-bold text-white mb-2">Finalizing Game</h2>
      <p className="text-slate-300 mb-4">
        Please do not navigate away. This may take a few moments...
      </p>
      <div className="text-sm text-slate-400">
        Saving lineup, updating game status, and clearing draft...
      </div>
    </div>
  </div>
)}
```

3. **Prevent navigation** (optional but recommended):

```jsx
useEffect(() => {
  if (isFinalizingGame) {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Game finalization in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }
}, [isFinalizingGame]);
```

### Benefits

- ✅ Clear visual feedback
- ✅ Prevents accidental navigation
- ✅ Communicates that operation is critical
- ✅ Better UX than a small spinner

---

## Part 3: Frontend State Bug Investigation

### Current Code Analysis

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

**Lines 887-898**:

```javascript
if (result.data?.game) {
  setGame((prev) => ({
    ...prev,
    ...result.data.game, // ⚠️ POTENTIAL BUG: This might overwrite fields
    status: result.data.game.status,
  }));
}
```

### Problem Analysis

**Question 1**: What is in `result.data.game`?

Looking at the backend response (lines 631-644):
```javascript
data: {
  game: {
    _id: game._id,
    status: game.status,
    gameTitle: game.gameTitle || `${game.teamName} vs ${game.opponent}`,
    lineupDraft: null
  },
  rosters: rosterResults,
  rosterCount: rosterResults.length
}
```

**Answer**: The backend only returns `_id`, `status`, `gameTitle`, and `lineupDraft`. It does NOT return:
- `game.reports` (player reports)
- `game.teamSummary`
- `game.finalScore`
- `game.matchDuration`
- Other fields that might be in the frontend state

**Question 2**: Is the state update deleting fields?

**YES - This is likely the bug!**

The spread operator `...result.data.game` will overwrite any fields that exist in `prev` but are NOT in `result.data.game`. Since the backend response is minimal, fields like `game.reports`, `game.teamSummary`, etc. will be **deleted** from state.

### Proposed Fix

**Option A: Defensive Merge (Recommended)**

```javascript
if (result.data?.game) {
  setGame((prev) => {
    // Only update specific fields we know about, preserve everything else
    return {
      ...prev,
      status: result.data.game.status,
      lineupDraft: result.data.game.lineupDraft ?? null,
      // Only update gameTitle if it's provided and different
      ...(result.data.game.gameTitle && { gameTitle: result.data.game.gameTitle }),
    };
  });
}
```

**Option B: Full Game Fetch After Success**

```javascript
// After successful start-game, fetch the full game again
if (result.data?.game) {
  // Update status immediately
  setGame((prev) => ({ ...prev, status: 'Played', lineupDraft: null }));
  
  // Then fetch full game data
  const fullGameResponse = await fetch(`http://localhost:3001/api/games/${gameId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
  });
  if (fullGameResponse.ok) {
    const fullGameResult = await fullGameResponse.json();
    setGame(fullGameResult.data); // Replace with complete game object
  }
}
```

**Recommendation**: Use **Option A** (defensive merge) because:
- ✅ Faster (no extra API call)
- ✅ Preserves all existing state
- ✅ Only updates what changed
- ✅ More predictable

---

## Part 4: Eventual Consistency Investigation

### Problem

After `start-game` completes, other pages (like GamesSchedulePage) don't see the updated game status for 20-80 seconds.

### Root Cause Analysis

#### Write Path (Backend)

**File**: `backend/src/routes/games.js`

1. Transaction starts: `session.startTransaction()`
2. Data is written: `game.save({ session })`, `GameRoster.findOneAndUpdate(..., { session })`
3. Transaction commits: `await session.commitTransaction()`
4. Response sent: `res.status(200).json(responseData)`

**Timeline**: Response is sent **immediately after commit**, but MongoDB replica propagation may take time.

#### Read Paths (Frontend)

**Path 1: GamesSchedulePage**

**File**: `src/features/game-management/components/GamesSchedulePage/index.jsx`

- Uses `useData()` hook from `DataProvider`
- `DataProvider` calls `GET /api/data/all` on mount/refresh
- This endpoint queries MongoDB directly

**Path 2: GameDetailsPage (on load)**

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

- Calls `GET /api/games/:gameId` directly (line 125)
- Also uses `gameRosters` from `DataProvider` (which comes from `GET /api/data/all`)

#### MongoDB Connection Settings

**File**: `backend/src/config/database.js`

**Current Settings**:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // ❌ NO readPreference specified
});
```

**Problem**: If MongoDB is a replica set, the default `readPreference` might be `'secondaryPreferred'`, which means:
- Reads can go to secondary replicas
- Secondary replicas may lag behind primary
- This causes eventual consistency issues

### Proposed Solutions

#### Solution A: Update MongoDB Connection (Recommended)

**File**: `backend/src/config/database.js`

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  readPreference: 'primary', // ✅ Always read from primary (strong consistency)
  // OR use 'primaryPreferred' if you want fallback to secondary
});
```

**Benefits**:
- ✅ Ensures reads always get latest data
- ✅ No code changes needed in routes
- ✅ Fixes eventual consistency globally

**Trade-offs**:
- ⚠️ Slightly higher load on primary
- ⚠️ If primary is down, reads fail (unless using 'primaryPreferred')

#### Solution B: Update Critical Read Routes

**Files**: 
- `backend/src/routes/data.js` (GET /api/data/all)
- `backend/src/routes/games.js` (GET /api/games/:id)

Add `readPreference: 'primary'` to specific queries:

```javascript
// In GET /api/data/all
const games = await Game.find()
  .populate('team', 'teamName season division')
  .read('primary') // ✅ Force read from primary
  .lean();

// In GET /api/games/:id
const game = await Game.findById(gameId)
  .read('primary') // ✅ Force read from primary
  .populate('team', 'teamName season division');
```

**Benefits**:
- ✅ More granular control
- ✅ Only critical routes use primary

**Trade-offs**:
- ⚠️ More code changes
- ⚠️ Need to remember to add to all critical routes

#### Solution C: Frontend Cache Update (Immediate Fix)

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

After successful `start-game`, manually update the DataProvider cache:

```javascript
// In executeGameWasPlayed, after successful response:
const result = await response.json();

// Update local DataProvider cache
if (refreshData) {
  // Update games array
  const updatedGames = games.map(g => 
    g._id === gameId 
      ? { ...g, status: 'Played', lineupDraft: null }
      : g
  );
  // This would require exposing a setGames function from DataProvider
  // OR call refreshData() but with optimistic update
}

// Then update local state
setGame((prev) => ({ ...prev, status: 'Played', lineupDraft: null }));
```

**Benefits**:
- ✅ Immediate UI update
- ✅ No backend changes

**Trade-offs**:
- ⚠️ Requires DataProvider refactoring to expose cache update methods
- ⚠️ Only fixes frontend cache, not actual database reads
- ⚠️ Temporary solution - doesn't fix root cause

### Recommendation

**Use Solution A (Update MongoDB Connection)** because:
1. ✅ Fixes root cause (eventual consistency)
2. ✅ Minimal code changes (one file)
3. ✅ Applies globally to all routes
4. ✅ Most reliable solution

**If Solution A doesn't work** (e.g., if you're not using a replica set), then:
- Use Solution C as a temporary frontend fix
- Investigate why MongoDB is slow to propagate (network latency, replica lag)

---

## Implementation Priority

1. **✅ Backend Logging** - COMPLETED
2. **🔴 High Priority**: Frontend State Bug Fix (Part 3)
3. **🟡 Medium Priority**: Frontend Loading State (Part 2)
4. **🟡 Medium Priority**: MongoDB Connection Fix (Part 4, Solution A)
5. **🟢 Low Priority**: Frontend Cache Update (Part 4, Solution C) - only if Solution A doesn't work

---

## Testing Checklist

After implementing fixes:

- [ ] Backend logs show timing for each step
- [ ] Modal appears when "Game Was Played" is clicked
- [ ] Modal prevents navigation (browser warning)
- [ ] After success, game state shows correct status
- [ ] Missing report indicators still appear correctly
- [ ] Navigating to GamesSchedulePage shows game as "Played" immediately
- [ ] Re-opening the game shows lineup correctly (no empty state)
- [ ] No 20-80 second delay before data appears

---

## Next Steps

1. **Review backend logs** after next "Game Was Played" click
2. **Implement Part 2** (Frontend Loading State)
3. **Implement Part 3** (Frontend State Bug Fix)
4. **Implement Part 4** (MongoDB Connection Fix)
5. **Test thoroughly** with the checklist above




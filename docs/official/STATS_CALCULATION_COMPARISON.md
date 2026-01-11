# Stats Calculation: Main Branch vs Refactored Branch

**Date:** December 7, 2025  
**Purpose:** Compare how minutes, goals, and assists are calculated and displayed in player reports

---

## 📊 **Main Branch Approach (Original)**

### **Architecture: Real-Time Calculation + Pre-Fetching**

The main branch uses a **hybrid approach** with two systems:

1. **Background Worker** (for data persistence)
2. **On-Demand API Endpoint** (for real-time display)

---

### **System 1: Background Worker (Async)**

**Purpose:** Calculate and persist stats to database

**Flow:**
```
Game Status Change (Played/Done)
  ↓
Job Created: { type: 'recalc-minutes', gameId: '...' }
  ↓
Worker Processes Job (every 5 seconds)
  ↓
Calculates:
  - Minutes from substitutions/red cards
  - Goals/assists from Goals collection
  - Updates playedInGame status
  ↓
Saves to GameReport collection
```

**Code Location:**
- `backend/src/routes/games.js` - Creates Jobs
- `backend/src/worker.js` - Processes Jobs
- `backend/src/services/minutesCalculation.js` - Calculation logic
- `backend/src/services/goalsAssistsCalculation.js` - Goals/assists logic

**When It Runs:**
- After game status changes to 'Played'
- After game status changes to 'Done'
- After start-game transaction

---

### **System 2: On-Demand API (Synchronous)**

**Purpose:** Calculate stats in real-time for immediate display

**Endpoint:**
```
GET /api/games/:gameId/player-stats
```

**Flow:**
```
Frontend Requests Stats
  ↓
Backend Calculates ON-THE-FLY:
  - calculatePlayerMinutes(gameId)
  - calculatePlayerGoalsAssists(gameId)
  ↓
Returns: { playerId: { minutes, goals, assists } }
  ↓
Frontend Displays Immediately
```

**Code Location:**
- `backend/src/routes/games.js` - Route handler
- `frontend/src/features/game-management/api/playerStatsApi.js` - API call
- `frontend/src/features/game-management/components/GameDetailsPage/index.jsx` - Usage

**When It Runs:**
- When GameDetailsPage loads (if game status is 'Played' or 'Done')
- Pre-fetches stats for all players
- Displays in player report dialogs

**Restrictions:**
- Only works for games with status 'Played' (not 'Done')
- Calculates from raw data (substitutions, goals) every time

---

### **Why Two Systems?**

| System | Purpose | Speed | Persistence |
|--------|---------|-------|-------------|
| **Worker** | Background persistence | Slow (5-10s) | ✅ Saves to DB |
| **API Endpoint** | Real-time display | Fast (instant) | ❌ Calculated on-demand |

**Benefits:**
1. ✅ **Instant Display** - Frontend doesn't wait for worker
2. ✅ **Always Fresh** - Calculates from latest data
3. ✅ **Persistent Data** - Worker saves for historical queries
4. ✅ **Fallback** - If worker fails, API still works

---

## 🔧 **Refactored Branch Approach (Current)**

### **Architecture: Worker Only**

The refactored branch uses **only the background worker**:

**Flow:**
```
Game Status Change (Played/Done)
  ↓
Job Created: { type: 'recalc-minutes', gameId: '...' }
  ↓
Worker Processes Job (every 5 seconds)
  ↓
Saves to GameReport collection
  ↓
Frontend Reads from GameReport
```

**Code Location:**
- `backend/src/services/games/gameService.js` - Creates Jobs
- `backend/src/worker.js` - Processes Jobs
- `backend/src/services/games/utils/minutesCalculation.js` - Calculation logic
- `backend/src/services/games/utils/goalsAssistsCalculation.js` - Goals/assists logic

**What's Missing:**
- ❌ No `/api/games/:gameId/player-stats` endpoint
- ❌ No real-time calculation API
- ❌ Frontend can't pre-fetch stats

---

## 🆚 **Comparison Table**

| Feature | Main Branch | Refactored Branch | Impact |
|---------|-------------|-------------------|--------|
| **Background Worker** | ✅ Yes | ✅ Yes | Same |
| **Real-Time API** | ✅ Yes | ❌ Missing | **Critical** |
| **Pre-Fetching** | ✅ Yes | ❌ No | **UX Issue** |
| **Instant Display** | ✅ Yes | ❌ No | **UX Issue** |
| **Data Persistence** | ✅ Yes | ✅ Yes | Same |
| **Fallback if Worker Down** | ✅ Yes (API works) | ❌ No | **Reliability Issue** |

---

## 🐛 **Problems in Refactored Branch**

### **Problem 1: No Real-Time Stats**

**Symptom:**
- Player report shows 0 minutes, 0 goals, 0 assists
- Even after worker runs, data doesn't appear

**Root Cause:**
- Missing `/api/games/:gameId/player-stats` endpoint
- Frontend calls `fetchPlayerStats()` but endpoint doesn't exist
- Frontend falls back to showing 0/0/0

**Fix Needed:**
- Restore the player-stats endpoint
- OR change frontend to read from GameReport collection

---

### **Problem 2: Delayed Stats Display**

**Symptom:**
- Stats take 5-10 seconds to appear after marking game as "Done"
- User sees empty state while waiting

**Root Cause:**
- Only worker calculates stats (async, delayed)
- No instant calculation like main branch

**Fix Needed:**
- Restore real-time API endpoint for instant feedback
- Keep worker for persistence

---

### **Problem 3: No Fallback**

**Symptom:**
- If worker is down, stats never appear
- No way to manually trigger calculation

**Root Cause:**
- Only one system (worker) instead of two (worker + API)

**Fix Needed:**
- Restore API endpoint as fallback

---

## ✅ **Recommended Solution**

### **Option A: Restore Both Systems (Best UX)**

**Restore the missing endpoint:**

```javascript
// backend/src/routes/games/stats.js (NEW FILE)
router.get('/:gameId/player-stats', authenticateJWT, checkGameAccess, async (req, res) => {
  const { gameId } = req.params;
  const game = req.game;

  // Only allow for Played games
  if (game.status !== 'Played') {
    return res.status(400).json({
      success: false,
      error: 'Player stats calculation is only available for games in "Played" status'
    });
  }

  // Calculate on-the-fly
  const [calculatedMinutes, calculatedGoalsAssists] = await Promise.all([
    calculatePlayerMinutes(gameId),
    calculatePlayerGoalsAssists(gameId)
  ]);

  // Merge results
  const playerStats = {};
  const allPlayerIds = new Set([
    ...Object.keys(calculatedMinutes),
    ...Object.keys(calculatedGoalsAssists)
  ]);

  allPlayerIds.forEach(playerId => {
    playerStats[playerId] = {
      minutes: calculatedMinutes[playerId] || 0,
      goals: calculatedGoalsAssists[playerId]?.goals || 0,
      assists: calculatedGoalsAssists[playerId]?.assists || 0
    };
  });

  res.json({
    success: true,
    gameId,
    playerStats
  });
});
```

**Benefits:**
- ✅ Instant stats display (no waiting for worker)
- ✅ Always fresh data (calculated from latest events)
- ✅ Fallback if worker fails
- ✅ Same UX as main branch

**Drawbacks:**
- Slightly more code to maintain
- Calculates same data twice (once for API, once for worker)

---

### **Option B: Worker Only (Current Approach)**

**Keep current implementation but fix frontend:**

1. Remove `fetchPlayerStats()` calls from frontend
2. Read from GameReport collection instead
3. Show loading state while worker processes

**Benefits:**
- ✅ Simpler architecture (one system)
- ✅ Less code to maintain
- ✅ Single source of truth (GameReport)

**Drawbacks:**
- ❌ 5-10 second delay before stats appear
- ❌ No fallback if worker fails
- ❌ Worse UX than main branch

---

### **Option C: API Only (No Worker)**

**Remove worker, only use real-time API:**

1. Delete worker.js
2. Calculate stats on-demand via API
3. Optionally cache results

**Benefits:**
- ✅ Instant display
- ✅ Simpler (no background jobs)
- ✅ Always fresh data

**Drawbacks:**
- ❌ No persistent stats in database
- ❌ Slower API responses (calculates every time)
- ❌ Can't query historical stats efficiently

---

## 🎯 **Recommendation: Option A (Restore Both Systems)**

**Why:**
1. **Best UX** - Instant stats display like main branch
2. **Reliability** - Fallback if worker fails
3. **Data Integrity** - Worker persists for historical queries
4. **Proven** - Main branch already uses this approach successfully

**Implementation:**
1. Create `backend/src/routes/games/stats.js`
2. Add controller method `gameController.getPlayerStats()`
3. Mount route in `backend/src/routes/games/index.js`
4. Import calculation functions from `services/games/utils/`
5. Test with existing frontend code (already expects this endpoint)

**Estimated Time:** 30 minutes

---

## 📋 **Summary**

| Aspect | Main Branch | Refactored Branch | Issue |
|--------|-------------|-------------------|-------|
| **Worker** | ✅ Creates Jobs | ✅ Creates Jobs | ✅ Working |
| **Worker Import Path** | ❌ Old path | ✅ Fixed | ✅ Fixed (Bug #7) |
| **Real-Time API** | ✅ `/player-stats` | ❌ Missing | ❌ **MISSING** |
| **Pre-Fetching** | ✅ useEffect | ❌ No endpoint | ❌ **BROKEN** |
| **Stats Display** | ✅ Instant | ❌ Delayed/Missing | ❌ **BROKEN** |
| **Fallback** | ✅ API works | ❌ Worker only | ❌ **MISSING** |

---

## 🚀 **Next Steps**

1. **Decide on approach** (Recommended: Option A)
2. **Implement missing endpoint** (if Option A)
3. **Test with existing games** (run backfill script)
4. **Verify frontend displays stats** (should work automatically)

---

**The main difference:** Main branch has **TWO ways** to get stats (worker + API), refactored branch has **ONE way** (worker only). The missing API endpoint is why stats don't display properly.


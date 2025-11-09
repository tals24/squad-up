# Testing Guide: Atomic Game State Transition

## Overview

This guide provides step-by-step instructions for testing the new atomic `POST /api/games/:gameId/start-game` endpoint that fixes the non-atomic state transition vulnerability.

---

## Prerequisites

1. **Backend server running:** `npm run dev` (or your backend start command)
2. **Frontend server running:** `npm run dev` (or your frontend start command)
3. **Database access:** MongoDB connection active
4. **Test user accounts:** At least two coach accounts (Coach A and Coach B) for security testing
5. **Test data:** At least one game with status "Scheduled" and players available

---

## Test 1: Happy Path - Successful Atomic Transition

### Objective
Verify that a game can be successfully transitioned from "Scheduled" to "Played" with a valid lineup.

### Steps

1. **Prepare Test Data:**
   - Create or select a game with status "Scheduled"
   - Ensure you have at least 11 players available
   - Assign 11 players to starting lineup positions
   - Assign some players to bench

2. **Execute Test:**
   - Navigate to the Game Details page for the scheduled game
   - Click "Game Was Played" button
   - Confirm if bench size warning appears (if applicable)

3. **Verify Results:**
   - ✅ Game status should change to "Played"
   - ✅ All roster entries should be saved
   - ✅ No errors in browser console
   - ✅ No errors in backend logs

4. **Database Verification:**
   ```javascript
   // In MongoDB shell or Compass
   db.games.findOne({ _id: ObjectId("YOUR_GAME_ID") })
   // Should show: status: "Played"
   
   db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID") })
   // Should show all roster entries with correct statuses
   ```

5. **Expected Console Logs:**
   ```
   🔍 Starting game with roster: { gameId: "...", rosterCount: X, startingLineupCount: 11, benchCount: Y }
   ✅ Game started successfully: { success: true, ... }
   ```

---

## Test 2: Validation Failure - Invalid Lineup (Less Than 11 Starters)

### Objective
Verify that the endpoint rejects invalid lineups and does NOT update the game status.

### Steps

1. **Prepare Test Data:**
   - Create or select a game with status "Scheduled"
   - Assign only 10 players to starting lineup (intentionally invalid)

2. **Execute Test:**
   - Navigate to Game Details page
   - Click "Game Was Played" button

3. **Verify Results:**
   - ❌ Should show error message: "Invalid starting lineup. Expected 11 players, got 10"
   - ❌ Game status should remain "Scheduled"
   - ❌ No roster entries should be saved
   - ✅ Error should appear in UI confirmation modal

4. **Database Verification:**
   ```javascript
   db.games.findOne({ _id: ObjectId("YOUR_GAME_ID") })
   // Should show: status: "Scheduled" (unchanged)
   
   db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID"), status: "Starting Lineup" })
   // Should show 0 or old entries (not updated)
   ```

5. **Expected Backend Logs:**
   ```
   Error starting game: Invalid starting lineup. Expected 11 players, got 10
   ```

---

## Test 3: Validation Failure - Missing Goalkeeper

### Objective
Verify that the endpoint rejects lineups without a goalkeeper.

### Steps

1. **Prepare Test Data:**
   - Create or select a game with status "Scheduled"
   - Assign 11 players to starting lineup, but NONE with position "GK" or "Goalkeeper"

2. **Execute Test:**
   - Navigate to Game Details page
   - Click "Game Was Played" button

3. **Verify Results:**
   - ❌ Should show error: "Starting lineup must include at least one goalkeeper"
   - ❌ Game status should remain "Scheduled"
   - ❌ No roster entries should be saved

4. **Database Verification:**
   - Game status should remain "Scheduled"
   - No new roster entries should be created

---

## Test 4: Network Failure Simulation

### Objective
Verify that partial updates don't occur when network fails mid-request.

### Steps

1. **Prepare Test Data:**
   - Create or select a game with status "Scheduled"
   - Prepare valid lineup (11 starters with goalkeeper)

2. **Simulate Network Failure:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Set throttling to "Offline" or "Slow 3G"
   - Click "Game Was Played" button
   - Immediately close browser or kill network connection

3. **Verify Results:**
   - ❌ Request should fail
   - ❌ Game status should remain "Scheduled"
   - ❌ No roster entries should be saved

4. **Database Verification:**
   ```javascript
   db.games.findOne({ _id: ObjectId("YOUR_GAME_ID") })
   // Should show: status: "Scheduled" (unchanged)
   ```

5. **Retry Test:**
   - Restore network connection
   - Click "Game Was Played" again
   - Should succeed (idempotent - safe to retry)

---

## Test 5: Idempotency - Retry After Success

### Objective
Verify that calling the endpoint multiple times is safe (idempotent).

### Steps

1. **First Call:**
   - Start a game successfully (status changes to "Played")
   - Note the roster entries created

2. **Second Call:**
   - Click "Game Was Played" button again (or make API call directly)
   - Should return success without errors

3. **Verify Results:**
   - ✅ Should return: `{ success: true, message: "Game is already started", alreadyStarted: true }`
   - ✅ No duplicate roster entries should be created
   - ✅ Game status should remain "Played"

4. **Database Verification:**
   ```javascript
   db.gamerosters.find({ game: ObjectId("YOUR_GAME_ID") })
   // Should show same number of entries (no duplicates)
   ```

---

## Test 6: Unauthorized Access (Security)

### Objective
Verify that users cannot start games they don't have access to.

### Steps

1. **Prepare Test Data:**
   - Login as Coach A
   - Note a game ID that belongs to Coach B's team

2. **Execute Test (Using API directly):**
   ```bash
   # Get Coach A's token
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "coachA@example.com", "password": "password"}'
   
   # Try to start Coach B's game
   curl -X POST http://localhost:3001/api/games/COACH_B_GAME_ID/start-game \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer COACH_A_TOKEN" \
     -d '{"rosters": [...]}'
   ```

3. **Verify Results:**
   - ❌ Should return: `403 Forbidden`
   - ❌ Error message: "Access denied: You do not have permission to access this game"
   - ❌ Game status should NOT change
   - ❌ No roster entries should be saved

---

## Test 7: Concurrent Requests (Race Condition Prevention)

### Objective
Verify that MongoDB transactions prevent race conditions.

### Steps

1. **Prepare Test:**
   - Create a game with status "Scheduled"
   - Prepare valid lineup

2. **Execute Concurrent Requests:**
   ```bash
   # Terminal 1
   curl -X POST http://localhost:3001/api/games/GAME_ID/start-game \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"rosters": [...]}'
   
   # Terminal 2 (run immediately after, before first completes)
   curl -X POST http://localhost:3001/api/games/GAME_ID/start-game \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"rosters": [...]}'
   ```

3. **Verify Results:**
   - ✅ One request should succeed
   - ✅ One request should either:
     - Succeed (idempotent response if first completed)
     - Fail with transaction error (if both tried to update simultaneously)
   - ✅ No duplicate roster entries
   - ✅ Game status is "Played" (not "Scheduled")

---

## Test 8: Invalid Game Status (Already Done)

### Objective
Verify that games with status "Done" cannot be started.

### Steps

1. **Prepare Test Data:**
   - Select a game with status "Done"

2. **Execute Test:**
   - Try to click "Game Was Played" (button should be disabled in UI)
   - Or make API call directly

3. **Verify Results:**
   - ❌ Should return: `400 Bad Request`
   - ❌ Error: "Game cannot be started. Current status: Done. Only 'Scheduled' or 'Played' games can be started."

---

## Test 9: Missing Required Fields

### Objective
Verify validation of request body structure.

### Steps

1. **Execute Test (API call):**
   ```bash
   curl -X POST http://localhost:3001/api/games/GAME_ID/start-game \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{}'
   ```

2. **Verify Results:**
   - ❌ Should return: `400 Bad Request`
   - ❌ Error: "Invalid request format. Expected { rosters: [{ playerId, status, ... }] }"

---

## Test 10: Duplicate Players in Roster

### Objective
Verify that duplicate players are rejected.

### Steps

1. **Prepare Test Data:**
   - Create roster array with same playerId appearing twice

2. **Execute Test:**
   - Make API call with duplicate playerId

3. **Verify Results:**
   - ❌ Should return: `400 Bad Request`
   - ❌ Error: "Duplicate player in roster: [playerId]"

---

## Manual Testing Checklist

### Frontend UI Testing

- [ ] **Button Visibility:** "Game Was Played" button appears for Scheduled games
- [ ] **Button Disabled:** Button is disabled for Done/Postponed games
- [ ] **Loading State:** Button shows loading state during request
- [ ] **Success Feedback:** Success message or UI update after successful start
- [ ] **Error Display:** Error messages display correctly in confirmation modal
- [ ] **State Refresh:** Game status updates in UI after successful start
- [ ] **Roster Display:** Roster sidebar shows correct player statuses after start

### Backend API Testing

- [ ] **Authentication:** Endpoint requires valid JWT token
- [ ] **Authorization:** Endpoint checks game access via checkGameAccess
- [ ] **Validation:** Lineup validation works correctly
- [ ] **Transaction:** Database operations are atomic
- [ ] **Error Handling:** Proper error responses with transaction rollback
- [ ] **Idempotency:** Multiple calls return consistent results

---

## Using Postman/Thunder Client for API Testing

### Setup

1. **Create Collection:**
   - Name: "Game State Transition Tests"
   - Base URL: `http://localhost:3001`

2. **Set Environment Variables:**
   - `baseUrl`: `http://localhost:3001`
   - `authToken`: (get from login)
   - `gameId`: (your test game ID)

### Test Requests

#### Request 1: Start Game (Happy Path)
```
POST {{baseUrl}}/api/games/{{gameId}}/start-game
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json

Body:
{
  "rosters": [
    { "playerId": "PLAYER_1_ID", "status": "Starting Lineup" },
    { "playerId": "PLAYER_2_ID", "status": "Starting Lineup" },
    // ... 9 more starters (including goalkeeper)
    { "playerId": "PLAYER_12_ID", "status": "Bench" },
    // ... more bench players
  ]
}
```

#### Request 2: Invalid Lineup (10 Starters)
```
POST {{baseUrl}}/api/games/{{gameId}}/start-game
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json

Body:
{
  "rosters": [
    // Only 10 starters (should fail)
    { "playerId": "PLAYER_1_ID", "status": "Starting Lineup" },
    // ... 9 more (missing 11th)
  ]
}
```

#### Request 3: Idempotency Test
```
POST {{baseUrl}}/api/games/{{gameId}}/start-game
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json

Body:
{
  "rosters": [ /* same as Request 1 */ ]
}
// Run this AFTER Request 1 succeeds
// Should return: { "alreadyStarted": true }
```

---

## Database Inspection Commands

### MongoDB Shell Commands

```javascript
// Connect to MongoDB
use your_database_name

// Check game status
db.games.findOne({ _id: ObjectId("YOUR_GAME_ID") }, { status: 1, gameTitle: 1 })

// Count roster entries by status
db.gamerosters.aggregate([
  { $match: { game: ObjectId("YOUR_GAME_ID") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Check for duplicate players
db.gamerosters.aggregate([
  { $match: { game: ObjectId("YOUR_GAME_ID") } },
  { $group: { _id: "$player", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Verify transaction atomicity (before/after test)
// Before: Check game status and roster count
// After: Verify both changed together or neither changed
```

### MongoDB Compass Queries

1. **Check Game Status:**
   - Collection: `games`
   - Filter: `{ _id: ObjectId("YOUR_GAME_ID") }`
   - View: Check `status` field

2. **Check Roster Entries:**
   - Collection: `gamerosters`
   - Filter: `{ game: ObjectId("YOUR_GAME_ID") }`
   - View: Count entries, check statuses

3. **Verify Atomicity:**
   - Before test: Note game status and roster count
   - After failed test: Verify both unchanged
   - After successful test: Verify both updated

---

## Automated Testing Script

### Node.js Test Script

Create `test-atomic-game-transition.js`:

```javascript
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';
let authToken = '';
let gameId = '';

// Helper: Login and get token
async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return data.token;
}

// Helper: Start game
async function startGame(gameId, rosters, token) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/start-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rosters })
  });
  return response;
}

// Test 1: Happy Path
async function testHappyPath() {
  console.log('🧪 Test 1: Happy Path');
  const rosters = [
    // Add 11 valid starters + bench players
  ];
  
  const response = await startGame(gameId, rosters, authToken);
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('✅ Test 1 PASSED');
  } else {
    console.log('❌ Test 1 FAILED:', data);
  }
}

// Test 2: Invalid Lineup
async function testInvalidLineup() {
  console.log('🧪 Test 2: Invalid Lineup');
  const rosters = [
    // Only 10 starters (invalid)
  ];
  
  const response = await startGame(gameId, rosters, authToken);
  const data = await response.json();
  
  if (!response.ok && data.error.includes('Expected 11 players')) {
    console.log('✅ Test 2 PASSED');
  } else {
    console.log('❌ Test 2 FAILED:', data);
  }
}

// Run tests
async function runTests() {
  authToken = await login('coach@example.com', 'password');
  // Set gameId to a test game
  
  await testHappyPath();
  await testInvalidLineup();
  // Add more tests...
}

runTests();
```

---

## Browser DevTools Testing

### Network Tab Inspection

1. **Open DevTools (F12)**
2. **Go to Network tab**
3. **Filter:** `start-game`
4. **Click "Game Was Played"**
5. **Inspect Request:**
   - Method: `POST`
   - URL: `/api/games/:gameId/start-game`
   - Headers: Should include `Authorization: Bearer ...`
   - Payload: Should include `rosters` array

6. **Inspect Response:**
   - Status: `200 OK` (success) or `400/403/500` (error)
   - Body: JSON with `success`, `message`, `data`

### Console Logs

Watch for:
- `🔍 Starting game with roster: ...`
- `✅ Game started successfully: ...`
- Or error messages

---

## Common Issues and Troubleshooting

### Issue 1: "Game not found" (404)

**Cause:** Game ID is incorrect or game doesn't exist.

**Fix:**
- Verify gameId is correct
- Check game exists in database
- Ensure checkGameAccess middleware is working

### Issue 2: "Access denied" (403)

**Cause:** User doesn't have permission to access the game.

**Fix:**
- Verify user is coach of the team
- Check game.team matches user's team
- Verify checkGameAccess middleware logic

### Issue 3: "Invalid starting lineup" (400)

**Cause:** Lineup validation failed.

**Fix:**
- Ensure exactly 11 players with status "Starting Lineup"
- Ensure at least one goalkeeper in starting lineup
- Check for duplicate players

### Issue 4: Transaction Error

**Cause:** MongoDB transaction failed.

**Fix:**
- Check MongoDB connection
- Verify MongoDB version supports transactions (4.0+)
- Check for database locks
- Review backend logs for specific error

### Issue 5: Game Status Not Updating

**Cause:** Transaction rolled back or save failed.

**Fix:**
- Check backend logs for errors
- Verify game document is not locked
- Check for validation errors on Game model

---

## Verification Checklist

After running tests, verify:

- [ ] **Atomicity:** Game status and rosters always update together
- [ ] **Validation:** Invalid lineups are rejected before any writes
- [ ] **Security:** Unauthorized users cannot start games
- [ ] **Idempotency:** Multiple calls are safe
- [ ] **Error Handling:** Errors are properly caught and transactions rolled back
- [ ] **Data Integrity:** No partial updates in database
- [ ] **UI Feedback:** User sees appropriate success/error messages

---

## Performance Testing

### Load Test (Optional)

```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
   -p request.json -T application/json \
   http://localhost:3001/api/games/GAME_ID/start-game

# Using k6
k6 run load-test.js
```

**Expected:** All requests should either succeed (idempotent) or fail gracefully. No data corruption.

---

## Success Criteria

✅ **All tests pass:**
- Happy path works
- Validation failures prevent updates
- Network failures don't corrupt data
- Idempotency works
- Security is enforced
- Transactions are atomic

✅ **No data corruption observed**

✅ **Database remains consistent in all scenarios**

---

## Next Steps After Testing

1. **If all tests pass:** Ready for production deployment
2. **If issues found:** Review error logs, fix bugs, retest
3. **Documentation:** Update API docs with new endpoint
4. **Monitoring:** Set up alerts for transaction failures
5. **Rollout:** Deploy to staging, then production


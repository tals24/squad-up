# Manual Endpoint Testing Guide
## Field Name Standardization Validation

This guide helps you manually test the endpoints that were updated to use `:gameId` instead of `:id`.

### Prerequisites
1. Backend server running on `http://localhost:3001`
2. Frontend running on `http://localhost:5174` (for authentication)
3. Browser with DevTools open

### Getting Authentication Token

1. Open the frontend in your browser: `http://localhost:5174`
2. Login with your credentials
3. Open Browser DevTools (F12) → Application/Storage → Local Storage
4. Find the `authToken` or similar key
5. Copy the token value (it starts with `eyJ...`)

### Test 7.2: GET /api/games/:gameId

**Purpose**: Verify the route uses `:gameId` parameter

**Steps**:
1. Get a game ID from the frontend (Dashboard or Games Schedule page)
2. In browser console, run:
```javascript
fetch('http://localhost:3001/api/games/YOUR_GAME_ID_HERE', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
})
.then(r => r.json())
.then(data => console.log('✓ Test 7.2 PASSED:', data))
.catch(err => console.error('✗ Test 7.2 FAILED:', err));
```

**Expected**: Game object with `_id`, `gameTitle`, `status` fields

### Test 7.3: POST /api/games/:gameId/goals

**Purpose**: Verify the route uses `:gameId` parameter

**Steps**:
1. Get a game ID and player IDs from the frontend
2. In browser console, run:
```javascript
fetch('http://localhost:3001/api/games/YOUR_GAME_ID_HERE/goals', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scorerId: 'PLAYER_ID_HERE',
    minute: 25,
    description: 'Test goal'
  })
})
.then(r => r.json())
.then(data => console.log('✓ Test 7.3 PASSED:', data))
.catch(err => console.error('✗ Test 7.3 FAILED:', err));
```

**Expected**: Goal object with `_id`, `scorerId` fields

### Test 7.4: GET /api/games/:gameId/draft

**Purpose**: Verify the route uses `:gameId` parameter

**Steps**:
1. Get a game ID from the frontend
2. In browser console, run:
```javascript
fetch('http://localhost:3001/api/games/YOUR_GAME_ID_HERE/draft', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
})
.then(r => r.json())
.then(data => console.log('✓ Test 7.4 PASSED:', data))
.catch(err => console.error('✗ Test 7.4 FAILED:', err));
```

**Expected**: Draft object with `rosters` or `lineup` fields (or empty object if no draft)

### Test 7.5: POST /api/games/:gameId/start-game

**Purpose**: Verify the route uses `:gameId` parameter

**Steps**:
1. Get a SCHEDULED game ID from the frontend (Games Schedule page)
2. In browser console, run:
```javascript
fetch('http://localhost:3001/api/games/YOUR_GAME_ID_HERE/start-game', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('✓ Test 7.5 PASSED:', data))
.catch(err => console.error('✗ Test 7.5 FAILED (expected if game not scheduled):', err));
```

**Expected**: 
- If scheduled: Game object with `status: 'in-progress'`
- If already started: Error message (still valid - route works)

---

## Quick Browser Console Test Script

Paste this all at once in browser console (after logging in):

```javascript
// Get your token from localStorage
const token = localStorage.getItem('authToken'); // Adjust key name if different

// Get a game ID from the page or use this to find one:
fetch('http://localhost:3001/api/games', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(games => {
  if (games.length === 0) {
    console.error('No games found');
    return;
  }
  
  const gameId = games[0]._id;
  console.log(`Testing with game: ${games[0].gameTitle} (${gameId})`);
  
  // Test 7.2
  return fetch(`http://localhost:3001/api/games/${gameId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Test 7.2 PASSED - GET /api/games/:gameId');
    
    // Test 7.4
    return fetch(`http://localhost:3001/api/games/${gameId}/draft`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Test 7.4 PASSED - GET /api/games/:gameId/draft');
    console.log('\n✨ All accessible tests passed!');
    console.log('Note: Tests 7.3 and 7.5 require specific IDs and can be tested manually');
  });
})
.catch(err => console.error('❌ Test failed:', err));
```

---

## Alternative: Using Browser Network Tab

1. Navigate to different pages in the frontend:
   - **Dashboard** → Should call `GET /api/games/:gameId`
   - **Game Details page** → Should call `GET /api/games/:gameId/draft`
   - **Start a game** → Should call `POST /api/games/:gameId/start-game`

2. Open DevTools → Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to `/api/games/...`
5. Verify they use the game ID in the URL path (not query params)
6. Check response is 200 OK

---

## Success Criteria

✅ All endpoints return 200 OK (or expected business logic errors like "game already started")
✅ No 404 "Route not found" errors
✅ Endpoints use `:gameId` in the URL path
✅ Data is returned with correct structure (_id, gameTitle, etc.)

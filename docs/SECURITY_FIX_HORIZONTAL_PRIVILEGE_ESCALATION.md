# Security Fix Plan: Horizontal Privilege Escalation Vulnerability

## Problem Statement

**Critical Vulnerability:** Missing Transitive Authorization Checks

The main `backend/src/routes/games.js` route is correctly protected by `checkTeamAccess` middleware. However, all child routes that use a `:gameId` parameter (e.g., `goals.js`, `substitutions.js`, `disciplinaryActions.js`, `gameRosters.js`, `gameReports.js`) are only protected by `authenticateJWT`. They do not re-check that the authenticated user has permission to access the specific `gameId` in the URL.

**Attack Scenario:**
- Coach A (authenticated) sends `POST /api/games/{COACH_B_GAME_ID}/goals`
- Request succeeds because only JWT authentication is checked
- Coach A can write data to another user's game
- **This is a critical security failure**

---

## Step-by-Step Implementation Plan

### Step 1: Create New `checkGameAccess` Middleware

**File:** `backend/src/middleware/jwtAuth.js`

**Action:** Add a new middleware function `checkGameAccess` that:
1. Extracts `gameId` from `req.params.gameId`
2. Validates the gameId format
3. Fetches the game from database
4. Checks if user has access to the game's team
5. Attaches game object to `req.game` for optimization
6. Returns appropriate error codes (400, 404, 403)

**Code Implementation:**

```javascript
// Add to backend/src/middleware/jwtAuth.js

const Game = require('../models/Game');
const Team = require('../models/Team');

/**
 * Middleware to check if user has access to a specific game
 * Must be placed AFTER authenticateJWT middleware
 * 
 * This middleware:
 * 1. Validates gameId parameter
 * 2. Fetches the game from database
 * 3. Checks if user has access to the game's team
 * 4. Attaches game object to req.game for optimization
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkGameAccess = async (req, res, next) => {
  try {
    // Step 1: Get gameId from params
    const { gameId } = req.params;
    
    // Step 2: Validate gameId exists and is valid format
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }
    
    // Validate ObjectId format (MongoDB)
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID format'
      });
    }
    
    // Step 3: Fetch game from database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    // Step 4: Get teamId from game
    const teamId = game.team;
    
    if (!teamId) {
      return res.status(500).json({
        success: false,
        error: 'Game has no associated team'
      });
    }
    
    // Step 5: Check user access based on role
    const user = req.user;
    
    // Admin and Department Manager can access all games
    if (user.role === 'Admin' || user.role === 'Department Manager') {
      req.game = game; // Attach game for optimization
      return next();
    }
    
    // Division Manager: Check if team is in their division
    if (user.role === 'Division Manager') {
      // Fetch team to check division
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      // Check if user is the division manager for this team
      if (team.divisionManager && team.divisionManager.toString() === user._id.toString()) {
        req.game = game;
        return next();
      }
      
      // If division manager logic is more complex, implement here
      // For now, deny access if not explicitly assigned
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this game'
      });
    }
    
    // Coach: Check if they are the coach of the team
    if (user.role === 'Coach') {
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      // Check if user is the coach of this team
      if (team.coach.toString() === user._id.toString()) {
        req.game = game; // Attach game for optimization
        return next();
      }
      
      // Access denied
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this game'
      });
    }
    
    // Unknown role - deny access
    return res.status(403).json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    });
    
  } catch (error) {
    console.error('Game access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during access check'
    });
  }
};

// Export the new middleware
module.exports = {
  authenticateJWT,
  requireRole,
  checkTeamAccess,
  checkGameAccess  // Add this export
};
```

**Note:** Add `const mongoose = require('mongoose');` at the top of the file if not already present.

---

### Step 2: Apply Middleware to All Affected Routes

#### 2.1 Goals Routes (`backend/src/routes/goals.js`)

**Current State:**
```javascript
router.use(authenticateJWT);
router.post('/:gameId/goals', async (req, res) => { ... });
router.get('/:gameId/goals', async (req, res) => { ... });
router.put('/:gameId/goals/:goalId', async (req, res) => { ... });
router.delete('/:gameId/goals/:goalId', async (req, res) => { ... });
```

**Updated Code:**
```javascript
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Apply game access check to all routes with :gameId
router.post('/:gameId/goals', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    // Remove: const game = await Game.findById(gameId); (already in req.game)
    const game = req.game; // Use game from middleware
    
    // ... rest of handler
  } catch (error) {
    // ... error handling
  }
});

router.get('/:gameId/goals', checkGameAccess, async (req, res) => {
  // Use req.game instead of fetching
  const game = req.game;
  // ... rest of handler
});

router.put('/:gameId/goals/:goalId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.delete('/:gameId/goals/:goalId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});
```

#### 2.2 Substitutions Routes (`backend/src/routes/substitutions.js`)

**Updated Code:**
```javascript
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

router.use(authenticateJWT);

router.post('/:gameId/substitutions', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = req.game; // Use from middleware instead of fetching
    
    // Remove: const game = await Game.findById(gameId);
    // Remove: if (!game) { return res.status(404)... }
    
    // ... rest of handler
  } catch (error) {
    // ... error handling
  }
});

router.get('/:gameId/substitutions', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.put('/:gameId/substitutions/:subId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.delete('/:gameId/substitutions/:subId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});
```

#### 2.3 Disciplinary Actions Routes (`backend/src/routes/disciplinaryActions.js`)

**Updated Code:**
```javascript
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

router.use(authenticateJWT);

router.post('/:gameId/disciplinary-actions', checkGameAccess, async (req, res) => {
  const game = req.game;
  // Remove game fetch and validation
  // ... rest of handler
});

router.get('/:gameId/disciplinary-actions', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.get('/:gameId/disciplinary-actions/player/:playerId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.put('/:gameId/disciplinary-actions/:actionId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.delete('/:gameId/disciplinary-actions/:actionId', checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});
```

#### 2.4 Game Reports Routes (`backend/src/routes/gameReports.js`)

**Updated Code:**
```javascript
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

// Routes with :gameId parameter
router.get('/game/:gameId', authenticateJWT, checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});

router.get('/calculate-minutes/:gameId', authenticateJWT, checkGameAccess, async (req, res) => {
  const game = req.game;
  // Remove: const game = await Game.findById(gameId);
  // Remove: if (!game) { return res.status(404)... }
  // ... rest of handler
});

router.get('/calculate-goals-assists/:gameId', authenticateJWT, checkGameAccess, async (req, res) => {
  const game = req.game;
  // Remove game fetch and validation
  // ... rest of handler
});

// Note: POST /batch route uses gameId from body, not params
// This route needs special handling (see Step 3)
```

#### 2.5 Game Rosters Routes (`backend/src/routes/gameRosters.js`)

**Updated Code:**
```javascript
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

router.get('/game/:gameId', authenticateJWT, checkGameAccess, async (req, res) => {
  const game = req.game;
  // ... rest of handler
});
```

---

### Step 3: Special Cases - Routes with gameId in Request Body

Some routes receive `gameId` in the request body instead of URL params. These need special handling.

#### 3.1 Game Reports Batch Route (`backend/src/routes/gameReports.js`)

**Current Code:**
```javascript
router.post('/batch', authenticateJWT, async (req, res) => {
  const { gameId, reports } = req.body;
  const game = await Game.findById(gameId);
  // ...
});
```

**Updated Code:**
```javascript
// Create a special middleware for body-based gameId
const checkGameAccessFromBody = async (req, res, next) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required in request body'
      });
    }
    
    // Temporarily set gameId in params for checkGameAccess
    req.params.gameId = gameId;
    
    // Call the main checkGameAccess middleware
    return checkGameAccess(req, res, next);
  } catch (error) {
    console.error('Game access check from body error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during access check'
    });
  }
};

router.post('/batch', authenticateJWT, checkGameAccessFromBody, async (req, res) => {
  const game = req.game; // Use from middleware
  const { gameId, reports } = req.body;
  // Remove: const game = await Game.findById(gameId);
  // ... rest of handler
});
```

**Alternative Approach (Cleaner):**
```javascript
// Extract gameId validation into a reusable function
const validateGameAccess = async (gameId, user) => {
  // Same logic as checkGameAccess but returns { game, error }
  // This can be reused for both param and body-based routes
};
```

---

### Step 4: Refactor Route Handlers to Use `req.game`

**Pattern to Follow:**

**Before:**
```javascript
router.post('/:gameId/goals', async (req, res) => {
  const { gameId } = req.params;
  
  // ❌ Vulnerable: No access check
  const game = await Game.findById(gameId);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }
  
  // ... rest of handler
});
```

**After:**
```javascript
router.post('/:gameId/goals', checkGameAccess, async (req, res) => {
  const { gameId } = req.params;
  
  // ✅ Secure: Access already checked, game attached to req
  const game = req.game; // Already validated and attached by middleware
  
  // ... rest of handler (no need to fetch game again)
});
```

**Benefits:**
1. **Security:** Access is checked before handler executes
2. **Performance:** Game is fetched once, not multiple times
3. **Code Quality:** Removes duplicate validation logic
4. **Consistency:** All routes follow the same pattern

---

## Test Plan

### Test 1: Positive Case - Authorized Access

**Scenario:** Coach A requests goals for their own game

**Steps:**
1. Authenticate as Coach A (get JWT token)
2. Create a game for Coach A's team (get `gameId`)
3. Send `GET /api/games/:gameId/goals` with Coach A's token
4. Verify response is `200 OK` with goals data

**Expected Result:** ✅ Success - Returns goals for the game

---

### Test 2: Negative Case - Unauthorized Access (Horizontal Privilege Escalation)

**Scenario:** Coach A attempts to access Coach B's game

**Steps:**
1. Authenticate as Coach A (get JWT token)
2. Get `gameId` of a game belonging to Coach B's team
3. Send `GET /api/games/:gameId/goals` with Coach A's token
4. Verify response is `403 Forbidden`

**Expected Result:** ✅ Blocked - Returns `403 Forbidden` with error message

**Test Cases:**
- `POST /api/games/:gameId/goals` (create goal)
- `PUT /api/games/:gameId/goals/:goalId` (update goal)
- `DELETE /api/games/:gameId/goals/:goalId` (delete goal)
- `POST /api/games/:gameId/substitutions` (create substitution)
- `POST /api/games/:gameId/disciplinary-actions` (create disciplinary action)
- `GET /api/game-reports/game/:gameId` (get game reports)
- `GET /api/game-reports/calculate-minutes/:gameId` (calculate minutes)

---

### Test 3: Negative Case - Non-Existent Game

**Scenario:** User requests access to a game that doesn't exist

**Steps:**
1. Authenticate as Coach A (get JWT token)
2. Use a fake/invalid `gameId` (e.g., `507f1f77bcf86cd799439011`)
3. Send `GET /api/games/:gameId/goals` with Coach A's token
4. Verify response is `404 Not Found`

**Expected Result:** ✅ Blocked - Returns `404 Not Found` with error message

---

### Test 4: Negative Case - Invalid Game ID Format

**Scenario:** User sends malformed gameId

**Steps:**
1. Authenticate as Coach A (get JWT token)
2. Use invalid `gameId` format (e.g., `invalid-id`)
3. Send `GET /api/games/:gameId/goals` with Coach A's token
4. Verify response is `400 Bad Request`

**Expected Result:** ✅ Blocked - Returns `400 Bad Request` with error message

---

### Test 5: Positive Case - Admin Access

**Scenario:** Admin user accesses any game

**Steps:**
1. Authenticate as Admin (get JWT token)
2. Get `gameId` of any game (even Coach B's game)
3. Send `GET /api/games/:gameId/goals` with Admin's token
4. Verify response is `200 OK`

**Expected Result:** ✅ Success - Admin can access all games

---

### Test 6: Positive Case - Department Manager Access

**Scenario:** Department Manager accesses any game

**Steps:**
1. Authenticate as Department Manager (get JWT token)
2. Get `gameId` of any game
3. Send `GET /api/games/:gameId/goals` with Department Manager's token
4. Verify response is `200 OK`

**Expected Result:** ✅ Success - Department Manager can access all games

---

### Test 7: Edge Case - Missing gameId Parameter

**Scenario:** Route is called without gameId (should not happen, but defensive)

**Steps:**
1. Authenticate as Coach A (get JWT token)
2. Send request to route that expects `:gameId` but it's missing
3. Verify middleware handles gracefully

**Expected Result:** ✅ Returns `400 Bad Request` or route doesn't match

---

## Implementation Checklist

### Phase 1: Middleware Creation
- [ ] Add `checkGameAccess` middleware to `backend/src/middleware/jwtAuth.js`
- [ ] Add `mongoose` import if not present
- [ ] Export `checkGameAccess` in module.exports
- [ ] Test middleware in isolation (unit test)

### Phase 2: Apply to Goals Routes
- [ ] Update `backend/src/routes/goals.js` imports
- [ ] Add `checkGameAccess` to `POST /:gameId/goals`
- [ ] Add `checkGameAccess` to `GET /:gameId/goals`
- [ ] Add `checkGameAccess` to `PUT /:gameId/goals/:goalId`
- [ ] Add `checkGameAccess` to `DELETE /:gameId/goals/:goalId`
- [ ] Refactor handlers to use `req.game`
- [ ] Remove duplicate game fetch/validation code

### Phase 3: Apply to Substitutions Routes
- [ ] Update `backend/src/routes/substitutions.js` imports
- [ ] Add `checkGameAccess` to all `:gameId` routes
- [ ] Refactor handlers to use `req.game`
- [ ] Remove duplicate game fetch/validation code

### Phase 4: Apply to Disciplinary Actions Routes
- [ ] Update `backend/src/routes/disciplinaryActions.js` imports
- [ ] Add `checkGameAccess` to all `:gameId` routes
- [ ] Refactor handlers to use `req.game`
- [ ] Remove duplicate game fetch/validation code

### Phase 5: Apply to Game Reports Routes
- [ ] Update `backend/src/routes/gameReports.js` imports
- [ ] Add `checkGameAccess` to `GET /game/:gameId`
- [ ] Add `checkGameAccess` to `GET /calculate-minutes/:gameId`
- [ ] Add `checkGameAccess` to `GET /calculate-goals-assists/:gameId`
- [ ] Handle `POST /batch` route (gameId in body) - create `checkGameAccessFromBody`
- [ ] Refactor handlers to use `req.game`
- [ ] Remove duplicate game fetch/validation code

### Phase 6: Apply to Game Rosters Routes
- [ ] Update `backend/src/routes/gameRosters.js` imports
- [ ] Add `checkGameAccess` to `GET /game/:gameId`
- [ ] Refactor handlers to use `req.game`
- [ ] Remove duplicate game fetch/validation code

### Phase 7: Testing
- [ ] Test 1: Authorized access (Coach A → Coach A's game)
- [ ] Test 2: Unauthorized access (Coach A → Coach B's game) - All routes
- [ ] Test 3: Non-existent game
- [ ] Test 4: Invalid gameId format
- [ ] Test 5: Admin access
- [ ] Test 6: Department Manager access
- [ ] Test 7: Edge cases

### Phase 8: Documentation
- [ ] Update API documentation with security notes
- [ ] Add comments to middleware explaining security purpose
- [ ] Document the pattern for future routes

---

## Security Notes

1. **Order Matters:** `checkGameAccess` must be placed AFTER `authenticateJWT` because it depends on `req.user` being set.

2. **Performance:** The middleware fetches the game once and attaches it to `req.game`, saving subsequent database queries in route handlers.

3. **Error Messages:** Error messages should not reveal sensitive information (e.g., don't say "Game exists but you don't have access" - use generic "Access denied").

4. **Role-Based Access:** The middleware implements the same role-based access control as `checkTeamAccess`:
   - **Admin & Department Manager:** Full access
   - **Division Manager:** Access to teams in their division
   - **Coach:** Access only to their own team's games

5. **Future Routes:** Any new route that uses `:gameId` must include `checkGameAccess` middleware.

---

## Risk Assessment

**Before Fix:**
- **Severity:** Critical
- **Impact:** Any authenticated user can read/write data for any game
- **Exploitability:** Easy (just need valid JWT token)

**After Fix:**
- **Severity:** None (vulnerability eliminated)
- **Impact:** Users can only access games they're authorized for
- **Exploitability:** Not possible (access is enforced at middleware level)

---

## Rollout Strategy

1. **Development:**
   - Implement middleware first
   - Test in isolation
   - Apply to one route file at a time
   - Test each route file before moving to next

2. **Staging:**
   - Deploy to staging environment
   - Run full test suite
   - Perform security testing (penetration testing)

3. **Production:**
   - Deploy during low-traffic period
   - Monitor error logs for 403 responses (expected for unauthorized attempts)
   - Have rollback plan ready

---

## Additional Considerations

1. **Caching:** Consider caching game-team relationships if performance becomes an issue.

2. **Logging:** Log all 403 Forbidden responses for security monitoring.

3. **Rate Limiting:** Consider adding rate limiting to prevent brute-force attempts.

4. **Audit Trail:** Consider logging all game access attempts for audit purposes.

---

## Conclusion

This plan provides a comprehensive solution to the horizontal privilege escalation vulnerability. The `checkGameAccess` middleware ensures that all routes using `:gameId` properly validate user access before allowing any operations. The implementation is reusable, performant, and follows security best practices.


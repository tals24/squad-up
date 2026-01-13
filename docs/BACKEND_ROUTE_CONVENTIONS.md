# Backend Route Conventions

## Overview
This document establishes naming conventions for Express.js route parameters in the SquadUp backend to improve code readability, maintainability, and self-documentation.

---

## Route Parameter Naming Standards

### ✅ DO: Use Semantic Parameter Names

Route parameters should clearly indicate the resource they identify.

```javascript
// ✅ GOOD - Self-documenting
router.get('/games/:gameId', getGameById);
router.get('/teams/:teamId/players', getTeamPlayers);
router.get('/players/:playerId/stats', getPlayerStats);
router.post('/games/:gameId/goals', createGoal);
```

### ❌ DON'T: Use Generic `:id`

Generic `:id` parameters are ambiguous and require mental mapping.

```javascript
// ❌ BAD - What does :id refer to?
router.get('/games/:id', getGameById);
router.post('/games/:id/goals', createGoal);
```

---

## Standard Parameter Names by Resource

| Resource | Route Parameter | Example Route |
|----------|----------------|---------------|
| **Game** | `:gameId` | `/api/games/:gameId` |
| **Player** | `:playerId` | `/api/players/:playerId` |
| **Team** | `:teamId` | `/api/teams/:teamId` |
| **User** | `:userId` | `/api/users/:userId` |
| **Drill** | `:drillId` | `/api/drills/:drillId` |
| **Roster** | `:rosterId` | `/api/games/:gameId/rosters/:rosterId` |
| **Report** | `:reportId` | `/api/games/:gameId/reports/:reportId` |
| **Goal** | `:goalId` | `/api/games/:gameId/goals/:goalId` |
| **Card** | `:cardId` | `/api/games/:gameId/cards/:cardId` |
| **Substitution** | `:subId` | `/api/games/:gameId/substitutions/:subId` |
| **Training Session** | `:sessionId` | `/api/training/sessions/:sessionId` |
| **Scout Report** | `:reportId` | `/api/scout-reports/:reportId` |

---

## Examples by Route File

### Games Routes

#### `backend/src/routes/games/crud.js`
```javascript
// Game CRUD operations
router.get('/:gameId', getGameById);           // GET /api/games/:gameId
router.put('/:gameId', updateGame);            // PUT /api/games/:gameId
router.delete('/:gameId', deleteGame);         // DELETE /api/games/:gameId
```

#### `backend/src/routes/games/drafts.js`
```javascript
// Game draft operations
router.get('/:gameId/draft', getGameDraft);    // GET /api/games/:gameId/draft
router.put('/:gameId/draft', updateGameDraft); // PUT /api/games/:gameId/draft
```

#### `backend/src/routes/games/status.js`
```javascript
// Game status transitions
router.post('/:gameId/start-game', startGame);              // POST /api/games/:gameId/start-game
router.post('/:gameId/submit-final-report', submitReport);  // POST /api/games/:gameId/submit-final-report
```

#### `backend/src/routes/games/gameRosters.js`
```javascript
// Game roster operations (nested resource)
router.get('/:rosterId', getGameRosterById);       // GET /api/game-rosters/:rosterId
router.put('/:rosterId', updateGameRoster);        // PUT /api/game-rosters/:rosterId
router.delete('/:rosterId', deleteGameRoster);     // DELETE /api/game-rosters/:rosterId
```

#### `backend/src/routes/games/gameReports.js`
```javascript
// Game report operations (nested resource)
router.get('/:reportId', getGameReportById);    // GET /api/game-reports/:reportId
router.put('/:reportId', updateGameReport);     // PUT /api/game-reports/:reportId
router.delete('/:reportId', deleteGameReport);  // DELETE /api/game-reports/:reportId
```

### Nested Resources

When a route handles a sub-resource, both parameters should be semantic:

```javascript
// ✅ GOOD - Both parameters are semantic
router.get('/games/:gameId/goals/:goalId', getGoalById);
router.delete('/games/:gameId/cards/:cardId', deleteCard);
router.put('/teams/:teamId/players/:playerId', updateTeamPlayer);

// ❌ BAD - Generic :id is ambiguous
router.get('/games/:gameId/goals/:id', getGoalById);
```

---

## Controller Implementation

Controllers should access parameters using the semantic names:

```javascript
// ✅ GOOD - Clear parameter access
async function getGameById(req, res) {
  const { gameId } = req.params;  // Semantic name from route
  const game = await Game.findById(gameId);
  res.json(game);
}

// ✅ GOOD - Multiple semantic parameters
async function createGoal(req, res) {
  const { gameId } = req.params;
  const { scorerId, minute } = req.body;
  
  const goal = await Goal.create({
    game: gameId,
    scorer: scorerId,
    minute
  });
  
  res.json(goal);
}

// ❌ BAD - Workarounds needed for generic :id
async function getGameById(req, res) {
  const gameId = req.params.gameId || req.params.id;  // Avoid this
  // ...
}
```

---

## Middleware Considerations

### Authentication & Authorization

Middleware can access semantic parameters directly:

```javascript
// ✅ GOOD - Clear parameter in middleware
async function authorizeGameAccess(req, res, next) {
  const { gameId } = req.params;
  const game = await Game.findById(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.team.toString() !== req.user.team.toString()) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
```

### Avoid Generic Workarounds

Don't create middleware to normalize generic `:id` parameters:

```javascript
// ❌ BAD - Don't do this
function normalizeId(req, res, next) {
  req.params.id = req.params.gameId || req.params.playerId || req.params.id;
  next();
}
```

Instead, use semantic names from the start.

---

## Migration from Generic `:id`

If updating existing routes from `:id` to semantic names:

### 1. Update Route Definition
```javascript
// Before
router.get('/:id', getGameById);

// After
router.get('/:gameId', getGameById);
```

### 2. Update Controller
```javascript
// Before
const gameId = req.params.id;

// After
const gameId = req.params.gameId;
```

### 3. Update Middleware
```javascript
// Before
const gameId = req.params.gameId || req.params.id;  // Workaround

// After
const gameId = req.params.gameId;  // Clean
```

### 4. Verify Frontend Integration
Ensure frontend API calls work correctly (they usually do, as they use the actual ID value, not the parameter name):

```javascript
// Frontend code doesn't need to change
fetch(`/api/games/${gameId}`)  // Works with both :id and :gameId
```

---

## Exception: When Generic `:id` is Acceptable

Only use generic `:id` when:

1. **Truly Polymorphic Resources**: The endpoint handles multiple resource types
   ```javascript
   // Example: Search endpoint that can find any resource by ID
   router.get('/search/:id', searchById);
   ```

2. **Documented Ambiguity**: When the route explicitly handles multiple types, document it
   ```javascript
   /**
    * @route GET /api/resources/:id
    * @param {string} id - Can be gameId, playerId, or teamId (determined by query param)
    */
   router.get('/resources/:id', getResourceById);
   ```

For 99% of cases, use semantic parameter names.

---

## Testing Route Parameters

When writing tests, use semantic parameter names:

```javascript
// ✅ GOOD - Test with semantic parameters
describe('GET /api/games/:gameId', () => {
  it('should return game by ID', async () => {
    const response = await request(app)
      .get(`/api/games/${gameId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(gameId);
  });
});
```

---

## Benefits of Semantic Parameter Names

1. **Self-Documenting Code**: Route definitions clearly show what resource they handle
2. **Easier Debugging**: Error messages and logs are more informative
3. **Better IDE Support**: Autocomplete and refactoring tools work better
4. **Reduced Cognitive Load**: No mental mapping from `:id` to actual resource
5. **Prevents Bugs**: Less confusion about which ID is being used
6. **Cleaner Controllers**: No workarounds or fallbacks needed
7. **Better API Documentation**: Generated docs are more descriptive

---

## Checklist for New Routes

When creating new routes, ensure:

- [ ] Route parameter uses semantic name (`:gameId`, not `:id`)
- [ ] Controller accesses parameter using semantic name
- [ ] No workarounds or fallbacks for generic `:id`
- [ ] Middleware uses semantic parameter name
- [ ] Tests reference semantic parameter name
- [ ] API documentation uses semantic parameter name

---

## Related Documentation

- **Field Naming**: `FIELD_NAME_MIGRATION_SUMMARY.md`
- **Backend Summary**: `docs/official/backendSummary.md`
- **API Testing**: `backend/scripts/MANUAL_ENDPOINT_TESTS.md`
- **Models**: `backend/src/models/`

---

**Last Updated**: January 13, 2026  
**Applies To**: All Express.js routes in `backend/src/routes/`

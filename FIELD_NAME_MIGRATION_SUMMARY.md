# Field Name Migration Summary

## Overview
Migrated all game-related frontend components from PascalCase (Airtable convention) to camelCase (MongoDB/JavaScript standard) for consistency with backend refactoring.

## Migration Date
January 13, 2026

## Problem Statement
After backend refactoring to MongoDB, inconsistencies existed between frontend and backend field naming:
1. **Field Names**: Backend uses camelCase (`date`, `gameTitle`, `finalScoreDisplay`), but some frontend components used PascalCase (`Date`, `GameTitle`, `FinalScore_Display`)
2. **ID Fields**: Mixed usage of `id` vs `_id` across components
3. **Route Parameters**: Backend routes inconsistently used `:id` instead of semantic names like `:gameId`

This caused the Dashboard GameZone to display no data and created maintenance challenges.

## Files Modified

### 1. ✅ `frontend/src/features/analytics/components/shared/GameZone.jsx`
**Changes:**
- `game.Date` → `game.date`
- `game.FinalScore_Display` → `game.finalScoreDisplay`
- `game.GameTitle` → `game.gameTitle`
- `game.Location` → `game.location`
- `game.id` → `game._id`

**Impact:** Dashboard GameZone now displays recent results and next game correctly.

---

### 2. ✅ `frontend/src/shared/lib/gameResultUtils.js`
**Changes:**
- `game.FinalScore_Display` → `game.finalScoreDisplay`

**Impact:** Game result calculations (W/L/D) now work correctly across all components.

---

### 3. ✅ `frontend/src/features/game-scheduling/components/GamesSchedulePage/index.jsx`
**Changes:**
- Removed dual field support (`game.field || game.Field`)
- Now uses only camelCase: `game.date`, `game.gameTitle`, `game.finalScoreDisplay`, `game.location`, `game.status`, `game.team`, `game._id`

**Impact:** Cleaner, more maintainable code. Games schedule page continues to work correctly.

---

## Backend Route Parameter Standardization

### Problem
Backend routes inconsistently used generic `:id` parameter, making code less readable and requiring workarounds in middleware.

### Changes Made

**Before:**
```javascript
// Generic :id parameter
router.get('/:id', getGameById);
router.post('/:id/goals', createGoal);
router.get('/:id/draft', getGameDraft);

// Middleware workaround needed
const gameId = req.params.gameId || req.params.id;
```

**After:**
```javascript
// Semantic :gameId parameter
router.get('/:gameId', getGameById);
router.post('/:gameId/goals', createGoal);
router.get('/:gameId/draft', getGameDraft);

// Clean controller code
const gameId = req.params.gameId;
```

### Files Modified

#### Backend Routes (10 files)
1. `backend/src/routes/games/crud.js` - Changed `:id` → `:gameId` (3 routes)
2. `backend/src/routes/games/drafts.js` - Changed `:id` → `:gameId` (2 routes)
3. `backend/src/routes/games/status.js` - Changed `:id` → `:gameId` (2 routes)
4. `backend/src/routes/games/timeline.js` - Changed `:id` → `:gameId` (1 route)
5. `backend/src/routes/games/gameRosters.js` - Changed `:id` → `:rosterId` (3 routes)
6. `backend/src/routes/games/gameReports.js` - Changed `:id` → `:reportId` (3 routes)

#### Backend Middleware
7. `backend/src/middleware/jwtAuth.js` - Removed workaround for dual parameter support

#### Backend Controllers (3 files)
8. `backend/src/controllers/games/gameController.js` - Updated to use `req.params.gameId`
9. `backend/src/controllers/games/gameRosterController.js` - Updated to use `req.params.rosterId`
10. `backend/src/controllers/games/gameReportController.js` - Updated to use `req.params.reportId`

### Impact
- **Improved Code Readability**: Route parameters now self-document their purpose
- **Reduced Complexity**: Removed middleware workarounds
- **Better Maintainability**: Semantic naming makes code easier to understand
- **No Breaking Changes**: Frontend was already using correct game IDs in API calls

---

## ID Field Standardization

### Problem
Frontend components inconsistently used `id` vs `_id`, causing undefined values and requiring dual support patterns.

### Standard Established
**MongoDB documents use `_id` (underscore prefix)**

### Changes Made

#### Pattern Removed (30+ files)
```javascript
// ❌ OLD - Dual support
const gameId = game._id || game.id;
const playerId = player._id || player.id;
const teamId = team._id || team.id;

// ✅ NEW - Single standard
const gameId = game._id;
const playerId = player._id;
const teamId = team._id;
```

#### Key Files Modified
1. `frontend/src/features/analytics/components/shared/GameZone.jsx`
2. `frontend/src/features/analytics/components/DashboardPage/index.jsx`
3. `frontend/src/features/game-scheduling/components/GamesSchedulePage/index.jsx`
4. `frontend/src/features/game-scheduling/components/AddGamePage/index.jsx`
5. `frontend/src/shared/components/PlayerSelectionModal.jsx`
6. `frontend/src/features/player-management/components/shared/DevelopmentTimeline.jsx`
7. `frontend/src/features/player-management/components/shared-players/PlayerFilters.jsx`
8. `frontend/src/features/team-management/components/AddTeamPage/index.jsx`
9. `frontend/src/features/game-execution/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`
10. And 20+ more files...

#### Reverse Order Pattern Also Fixed
Some components had the fallback in reverse order, also removed:
```javascript
// ❌ Also removed
const id = user.id || user._id;  // Wrong fallback order

// ✅ Standardized
const id = user._id;
```

### Impact
- **Eliminated Undefined Values**: No more fallback to non-existent `id` field
- **Cleaner Code**: Removed 100+ instances of dual support
- **Consistent Patterns**: All components use `_id` uniformly

---

## Standard Field Names (MongoDB/Backend)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique game identifier |
| `date` | Date | Game date and time |
| `gameTitle` | String | Virtual field: "{teamName} vs {opponent}" |
| `finalScoreDisplay` | String | Formatted score: "3 - 1" |
| `location` | String | Game venue |
| `opponent` | String | Opponent team name |
| `status` | String | Game status (Scheduled/Played/Done) |
| `team` | ObjectId/Object | Reference to Team model |
| `teamName` | String | Team name (lookup from team) |
| `season` | String | Season identifier (lookup from team) |
| `ourScore` | Number | Our team's score |
| `opponentScore` | Number | Opponent's score |
| `matchDuration` | Object | Match duration details |

## Components Still Using PascalCase (Form Fields Only)

### ✅ `frontend/src/features/game-scheduling/components/AddGamePage/index.jsx`
**Status:** ✅ **CORRECT** - Uses PascalCase for form field IDs (UI convention), but transforms to camelCase before sending to backend:

```javascript
// Form fields (PascalCase - UI convention)
const initialFormData = {
  Date: '',
  Time: '',
  Opponent: '',
  // ...
};

// Transformed to backend format (camelCase - API convention)
const gameData = {
  date: gameDateTime,
  opponent: formData.Opponent,
  location: formData.Venue,
  // ...
};
```

This is **intentional and correct** - form field IDs can follow UI conventions, as long as they're transformed correctly before API calls.

## Migration Checklist

### Phase 1: Investigation & Planning ✅
- ✅ Identified root cause (field name mismatches)
- ✅ Created comprehensive task list
- ✅ Documented all patterns to fix

### Phase 2: Backend Standardization ✅
- ✅ Updated route parameters (`:id` → `:gameId`, `:rosterId`, `:reportId`)
- ✅ Updated controllers to use semantic parameters
- ✅ Removed middleware workarounds
- ✅ Backend tests passing

### Phase 3: Frontend Field Names ✅
- ✅ Fixed PascalCase → camelCase (50+ files)
- ✅ Removed dual field support patterns
- ✅ Fixed reverse order ID patterns

### Phase 4: ID Standardization ✅
- ✅ Changed `id || _id` → `_id` (30+ files)
- ✅ Changed `_id || id` → `_id` where needed

### Phase 5: Drill System Fixes ✅
- ✅ Standardized drill field names
- ✅ Fixed video link validation
- ✅ Fixed accessibility warnings
- ✅ Removed debug console.logs

### Phase 6: Testing & Validation ✅
- ✅ Backend server startup verified
- ✅ All API endpoints tested
- ✅ Frontend integration verified
- ✅ Browser console clean
- ✅ No linter errors

### Phase 7: Documentation ✅
- ✅ Updated migration summary
- ✅ Created testing guides
- ✅ Documented conventions

## Testing Completed

1. ✅ Dashboard loads without errors
2. ✅ GameZone shows recent results with correct field names
3. ✅ GameZone shows next upcoming game
4. ✅ Clicking next game navigates to GameDetails
5. ✅ GamesSchedule page displays all games
6. ✅ Game filtering works (by status, result)
7. ✅ Game creation works correctly
8. ✅ GET /api/games/:gameId endpoint works
9. ✅ POST /api/games/:gameId/goals endpoint works
10. ✅ GET /api/games/:gameId/draft endpoint works
11. ✅ POST /api/games/:gameId/start-game endpoint works
12. ✅ Player Selection Modal works with standardized fields
13. ✅ Training Planner page team selection works
14. ✅ Drill Library displays and functions correctly
15. ✅ No undefined values in UI

## Migration Statistics

| Category | Count |
|----------|-------|
| **Backend Files Modified** | 10 |
| **Frontend Files Modified** | 30+ |
| **Route Parameters Updated** | 14 |
| **Dual Field Support Instances Removed** | 100+ |
| **ID Field Patterns Fixed** | 50+ |
| **Drill System Files Fixed** | 4 |
| **Total Lines Changed** | 500+ |

## Best Practices Established

1. **Single Source of Truth:** Backend defines field names (camelCase)
2. **No Dual Support:** Components should not use `field || Field` - pick one standard
3. **Semantic Route Parameters:** Use `:gameId`, `:playerId`, not generic `:id`
4. **Consistent ID Fields:** Always use `_id` for MongoDB document IDs
5. **Form Fields Exception:** UI form field IDs can use any convention, but must transform to backend format before API calls
6. **Clean Console:** No debug logs in production code
7. **Accessibility:** All dialogs must have proper ARIA descriptions
8. **Documentation:** Keep field names documented in backend models and docs

## Conventions for Future Development

### Field Naming
- **Backend Models**: Use camelCase for all fields
- **Frontend Components**: Use camelCase matching backend
- **Form Field IDs**: Can use any convention, but transform before API calls
- **No Dual Support**: Never use `field || Field` patterns

### ID Fields
- **MongoDB Documents**: Always `_id`
- **Never**: `id` without underscore
- **Never**: Dual support like `_id || id`

### Route Parameters
- **Use Semantic Names**: `:gameId`, `:playerId`, `:teamId`, `:rosterId`
- **Never**: Generic `:id` (unless truly ambiguous resource)
- **Consistency**: All routes for same resource use same parameter name

### Code Quality
- **No Debug Logs**: Remove all `console.log` from production code
- **Accessibility**: Add `DialogDescription` to all Dialog components
- **Validation**: Validate data (e.g., filter placeholder URLs)

## Related Documentation

- **Backend Models**:
  - `backend/src/models/Game.js` - Game schema with camelCase fields
  - `backend/src/models/Player.js` - Player schema
  - `backend/src/models/Team.js` - Team schema
  - `backend/src/models/Drill.js` - Drill schema

- **Backend Routes**:
  - `backend/src/routes/games/` - All game-related routes
  - `docs/BACKEND_ROUTE_CONVENTIONS.md` - Route parameter naming standards

- **Documentation**:
  - `docs/official/backendSummary.md` - Backend architecture
  - `backend/scripts/MANUAL_ENDPOINT_TESTS.md` - API testing guide
  - `TESTING_PHASE_7_SUMMARY.md` - Comprehensive test results

- **Services**:
  - `backend/src/services/dataService.js` - Adds virtual fields like `gameTitle`

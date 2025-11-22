# Automated Minutes Calculation - Architecture Review & Recommendations

## Executive Summary

This document provides expert architectural review of the Automated Player Minute Calculation feature implementation plan, identifying critical issues and providing improved recommendations.

**Reviewer Perspective**: 10+ years experience building large-scale systems  
**Date**: Current  
**Status**: Critical Review Complete

---

## Critical Issues Identified

### 1. Data Consistency & Source of Truth ⚠️ **HIGH PRIORITY**

**Issue**: Plan suggests both on-demand calculation AND storing in GameReport, which can lead to inconsistency.

**Problem**:
- If events change after calculation, stored value becomes stale
- Race conditions if multiple users edit events simultaneously
- No clear source of truth

**Recommendation**:
- **Option A (Recommended)**: Make `minutesPlayed` a computed field that's only persisted when game status = "Done"
  - During "Played" status: Always calculate on-the-fly from events
  - When game becomes "Done": Calculate once and store for historical queries
  - This ensures single source of truth (events) during active editing

- **Option B**: Use database triggers/hooks to auto-recalculate on event changes
  - Mongoose middleware on Substitution/DisciplinaryAction models
  - Ensures stored value always matches events
  - More complex but guarantees consistency

**Implementation**:
```javascript
// GameReport model
gameReportSchema.virtual('calculatedMinutes', {
  // Computed on-the-fly for "Played" games
  // Cached/stored for "Done" games
});

// Only persist when game is finalized
if (game.status === 'Done') {
  gameReport.minutesPlayed = calculatedMinutes;
  gameReport.minutesCalculationMethod = 'calculated';
}
```

---

### 2. Calculation Trigger Strategy ⚠️ **HIGH PRIORITY** - **VALIDATED**

**Issue**: Plan uses frontend `useEffect` to recalculate on every event change, causing:
- Performance issues (unnecessary API calls)
- Race conditions (multiple rapid changes)
- Poor user experience (delays, flickering)

**Codebase Analysis**:
- ✅ They ALREADY use Mongoose `.pre('save')` hooks extensively:
  - `Goal.js`: `teamGoalSchema.pre('save')` for validation
  - `Substitution.js`: `substitutionSchema.pre('save')` for validation
  - `Game.js`: `gameSchema.pre('save')` for calculations
  - `GameRoster.js`: `gameRosterSchema.pre('save')` for lookups
- ✅ They have recalculation services pattern:
  - `goalAnalytics.js`: `recalculateGoalAnalytics()` called when game status = "Done"
  - `substitutionAnalytics.js`: `recalculateSubstitutionAnalytics()` called when game status = "Done"
  - These are called in `games.js` route when updating game status

**Recommendation** (aligned with existing patterns):
- **Backend Triggers**: Use Mongoose `.post('save')` hooks (they already use `.pre('save')`)
- **Follow Existing Pattern**: Create `minutesCalculation.js` service similar to `goalAnalytics.js` and `substitutionAnalytics.js`
- **Call on Event Changes**: Trigger recalculation in substitution/disciplinary action routes (not just on game status change)
- **Frontend Debouncing**: Wait 500ms after last event change before refetching

**Implementation** (following their existing patterns):
```javascript
// backend/src/services/minutesCalculation.js (similar to goalAnalytics.js)
async function recalculatePlayerMinutes(gameId) {
  // ... calculation logic
}

// backend/src/models/Substitution.js - add post hook
substitutionSchema.post('save', async function() {
  if (this.gameId) {
    await recalculatePlayerMinutes(this.gameId);
  }
});

substitutionSchema.post('remove', async function() {
  if (this.gameId) {
    await recalculatePlayerMinutes(this.gameId);
  }
});

// backend/src/routes/substitutions.js - call after save/delete
router.post('/games/:gameId/substitutions', async (req, res) => {
  // ... create substitution
  await recalculatePlayerMinutes(gameId); // Similar to how they call recalculateGoalAnalytics
});

// Frontend - debounced refetch (they use useEffect pattern)
const debouncedRefetch = useMemo(
  () => debounce(() => {
    fetchCalculatedMinutes(gameId);
  }, 500),
  [gameId]
);

useEffect(() => {
  if (substitutions.length > 0 || disciplinaryActions.length > 0) {
    debouncedRefetch();
  }
}, [substitutions.length, disciplinaryActions.length]);
```

---

### 3. API Design & Caching ⚠️ **MEDIUM PRIORITY**

**Issue**: Separate GET endpoint for calculation creates unnecessary API calls and doesn't leverage existing endpoints.

**Recommendation**:
- Include calculated minutes in existing game/substitution endpoints
- Add optional query parameter: `?includeCalculatedMinutes=true`
- Implement caching (Redis or in-memory) with TTL based on game status

**Implementation**:
```javascript
// GET /api/games/:gameId/substitutions?includeCalculatedMinutes=true
router.get('/games/:gameId/substitutions', async (req, res) => {
  const substitutions = await fetchSubstitutions(gameId);
  
  if (req.query.includeCalculatedMinutes === 'true') {
    const calculatedMinutes = await getCachedCalculatedMinutes(gameId);
    return res.json({
      substitutions,
      calculatedMinutes
    });
  }
  
  return res.json({ substitutions });
});
```

---

### 4. Edge Cases Not Covered ⚠️ **HIGH PRIORITY**

**Missing Scenarios**:
1. Player subbed in → subbed out → subbed in again (multiple sessions)
2. Red card for player already subbed out (should not affect minutes)
3. Events out of chronological order (validation needed)
4. Injury time substitutions (minute > 90 but within totalMatchDuration)
5. Player gets red card, then substitution happens (which takes precedence?)

**Recommendation**: Add comprehensive validation and explicit handling:

```javascript
function calculatePlayerMinutes(game, startingLineup, substitutions, redCards) {
  // 1. Validate events are in chronological order
  const allEvents = [...substitutions, ...redCards]
    .sort((a, b) => a.minute - b.minute);
  
  // 2. Validate no duplicate events at same minute
  validateNoDuplicateEvents(allEvents);
  
  // 3. Track player state (on-field/off-field) through events
  const playerState = new Map(); // playerId -> { onField: boolean, sessions: [] }
  
  // 4. Process events chronologically
  for (const event of allEvents) {
    if (event.type === 'substitution') {
      // Handle substitution logic
      // Check if playerOut is actually on field
      // Check if playerIn is actually on bench
    } else if (event.type === 'redCard') {
      // Only process if player is on field
      if (playerState.get(event.playerId)?.onField) {
        // End session
      }
    }
  }
  
  // 5. Handle multiple sessions per player
  // Sum all sessions for final minutes
}
```

---

### 5. Database Migration Strategy ⚠️ **MEDIUM PRIORITY**

**Issue**: Adding `minutesCalculationMethod` field without migration plan for existing data.

**Recommendation**:
- Add field as optional with default 'manual'
- Create migration script to backfill for existing "Played" games
- Add index for queries filtering by calculation method
- Document migration process

**Implementation**:
```javascript
// Migration script: backend/scripts/migrateMinutesCalculation.js
async function migrateExistingGames() {
  const playedGames = await Game.find({ status: 'Played' });
  
  for (const game of playedGames) {
    const calculatedMinutes = await calculatePlayerMinutesForGame(game._id);
    
    // Update all GameReports for this game
    await GameReport.updateMany(
      { game: game._id },
      { 
        $set: {
          minutesPlayed: calculatedMinutes[playerId],
          minutesCalculationMethod: 'calculated'
        }
      }
    );
  }
}
```

---

### 6. Performance & Scalability ⚠️ **MEDIUM PRIORITY**

**Issue**: Recalculating all players for every event change is inefficient.

**Recommendation**:
- **Incremental Calculation**: Only recalculate affected players
- **Batch Operations**: If multiple events change, recalculate once
- **Background Jobs**: For "Done" games, calculate once and cache

**Implementation**:
```javascript
async function recalculateAffectedPlayers(gameId, affectedPlayerIds) {
  // Only fetch events for affected players
  const playerEvents = await getEventsForPlayers(gameId, affectedPlayerIds);
  
  // Calculate only these players, not entire squad
  const calculatedMinutes = calculateForPlayers(
    game,
    startingLineup,
    playerEvents
  );
  
  return calculatedMinutes;
}
```

---

### 7. Error Handling & Validation ⚠️ **HIGH PRIORITY**

**Issue**: Plan doesn't specify error handling for invalid states.

**Recommendation**:
- Validate starting lineup exists before calculation
- Validate event consistency (player can't be subbed out if not on field)
- Return detailed error messages for debugging
- Log warnings for edge cases (e.g., red card for player already off)

**Implementation**:
```javascript
async function calculatePlayerMinutes(game, startingLineup, substitutions, redCards) {
  // Validation
  if (!startingLineup || startingLineup.length !== 11) {
    throw new Error('Starting lineup must have exactly 11 players');
  }
  
  // Validate substitutions
  for (const sub of substitutions) {
    if (!isPlayerOnField(sub.playerOutId, currentState)) {
      console.warn(`Player ${sub.playerOutId} not on field at minute ${sub.minute}`);
      // Skip this substitution or throw error?
    }
  }
  
  // ... calculation logic
}
```

---

### 8. Testing Strategy ⚠️ **MEDIUM PRIORITY**

**Missing**: Comprehensive testing plan.

**Recommendation**:
- **Unit Tests**: Calculation algorithm with all edge cases
- **Integration Tests**: API endpoints with real database
- **Performance Tests**: Games with many events (100+ substitutions)
- **E2E Tests**: Full user flow from event creation to report submission

**Test Cases**:
```javascript
describe('Minutes Calculation', () => {
  it('handles standard substitution', () => {
    // A starts, subbed out at 75', B in → A=75min, B=15min
  });
  
  it('handles multiple sessions per player', () => {
    // A starts, out at 45', in at 60', out at 80' → A=65min
  });
  
  it('handles red card for player already subbed out', () => {
    // A starts, out at 60', red card at 70' → A=60min (red card ignored)
  });
  
  it('handles events out of order', () => {
    // Should throw validation error
  });
});
```

---

### 9. Frontend State Management ⚠️ **MEDIUM PRIORITY** - **REVISED**

**Issue**: Managing calculated minutes in component state can get complex.

**Codebase Analysis**: 
- ❌ They do NOT use React Query or SWR
- ✅ They use custom `DataProvider` context with `useState` and `useEffect`
- ✅ They use `useMemo` for computed values (see `usePlayersData` hook)

**Revised Recommendation** (aligned with their architecture):
- Use existing `DataProvider` pattern or create custom hook similar to `usePlayersData`
- Implement `useMemo` for calculated minutes (cache based on gameId, substitutions, redCards)
- Show loading states during recalculation
- Handle error states gracefully

**Implementation** (aligned with their patterns):
```javascript
// Custom hook following their existing pattern
function useCalculatedMinutes(gameId, game, substitutions, disciplinaryActions) {
  const [calculatedMinutes, setCalculatedMinutes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId || game?.status !== 'Played') return;
    
    const fetchCalculated = async () => {
      setIsLoading(true);
      try {
        const minutes = await fetchCalculatedMinutes(gameId);
        setCalculatedMinutes(minutes);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalculated();
  }, [gameId, game?.status, substitutions.length, disciplinaryActions.length]);

  return { calculatedMinutes, isLoading, error };
}

// Or use useMemo for client-side calculation (if events are already loaded)
const calculatedMinutes = useMemo(() => {
  if (game?.status !== 'Played') return null;
  return calculateMinutesFromEvents(game, startingLineup, substitutions, redCards);
}, [game, startingLineup, substitutions, redCards]);
```

---

### 10. Backward Compatibility ⚠️ **HIGH PRIORITY** - **REVISED**

**Issue**: Plan doesn't address games in transition or gradual rollout.

**Codebase Analysis**:
- ⚠️ They have feature flags planned in `OrganizationConfig` schema (see `ENHANCED_MATCH_EVENT_TRACKING_SPEC.md`)
- ⚠️ Feature flags are not fully implemented yet (coming in Phase 4)
- ✅ They have scripts folder: `backend/scripts/` with `generateMockData.js` and `addTestGameRoster.js`
- ❌ No formal migration system found

**Revised Recommendation** (aligned with their architecture):
- **Simple Environment Variable**: Use `ENABLE_CALCULATED_MINUTES` env var (simpler than full feature flag system)
- **Follow Existing Pattern**: Create migration script in `backend/scripts/` similar to their existing scripts
- **Gradual Rollout**: Enable for new games first, then migrate existing "Played" games
- **Fallback**: If calculation fails, fall back to manual entry (they already have error handling patterns)

**Implementation** (aligned with their patterns):
```javascript
// backend/.env
ENABLE_CALCULATED_MINUTES=true

// backend/src/routes/gameReports.js
const useCalculatedMinutes = process.env.ENABLE_CALCULATED_MINUTES === 'true';

// In batch endpoint
if (useCalculatedMinutes && game.status === 'Played') {
  try {
    const calculatedMinutes = await calculatePlayerMinutesForGame(gameId);
    // Use calculated values
  } catch (error) {
    console.error('Calculation failed, falling back to manual:', error);
    // Fall back to manual entry (they already have this pattern)
  }
}

// backend/scripts/migrateCalculatedMinutes.js (similar to generateMockData.js)
async function migrateExistingGames() {
  const playedGames = await Game.find({ status: 'Played' });
  // ... migration logic
}
```

---

## Revised Implementation Plan

### Phase 1: Backend Foundation (Week 1)

1. **Create Calculation Service** (`backend/src/services/minutesCalculation.js`)
   - Implement session-based algorithm
   - Handle all edge cases
   - Add comprehensive validation
   - Write unit tests

2. **Add Database Triggers** (Mongoose middleware)
   - Substitution model: post-save/post-remove hooks
   - DisciplinaryAction model: post-save/post-remove hooks
   - Auto-recalculate on event changes

3. **Create API Endpoint** (modify existing routes)
   - Add `?includeCalculatedMinutes=true` to existing endpoints
   - Implement caching layer
   - Add error handling

### Phase 2: Model Updates (Week 1)

1. **Add Metadata Field** (`backend/src/models/GameReport.js`)
   - Add `minutesCalculationMethod` (optional, default: 'manual')
   - Add database migration script
   - Add index for queries

2. **Update Batch Endpoint** (`backend/src/routes/gameReports.js`)
   - Add logic to calculate minutes for "Played" games
   - Fall back to manual for "Done" games
   - Add feature flag support

### Phase 3: Frontend Integration (Week 2)

1. **Create Calculation Utility** (`src/features/game-management/utils/minutesCalculation.js`)
   - Fetch calculated minutes from API
   - Implement caching (React Query/SWR)
   - Handle error states

2. **Update PlayerPerformanceDialog**
   - Show calculated minutes as read-only
   - Add loading/error states
   - Add tooltip explaining calculation

3. **Update GameDetailsPage**
   - Integrate with React Query for data fetching
   - Implement debounced recalculation
   - Handle optimistic updates

### Phase 4: Testing & Validation (Week 2)

1. **Unit Tests**: Calculation algorithm
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Full user flow
4. **Performance Tests**: Large games with many events

### Phase 5: Migration & Rollout (Week 3)

1. **Migration Script**: Backfill calculated minutes for existing "Played" games
2. **Feature Flag**: Enable gradually
3. **Monitoring**: Track calculation accuracy and performance

---

## Key Architectural Decisions

1. **Source of Truth**: Events (Substitution, DisciplinaryAction) are the source of truth
2. **Calculation Timing**: On-the-fly for "Played" games, cached for "Done" games
3. **Trigger Strategy**: Backend triggers (Mongoose hooks) + frontend debouncing
4. **Caching**: Redis or in-memory cache with TTL based on game status
5. **Error Handling**: Comprehensive validation with detailed error messages
6. **Backward Compatibility**: Feature flag + gradual rollout + migration script

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data inconsistency | High | Use events as single source of truth, only persist when game is "Done" |
| Performance issues | Medium | Implement caching, incremental calculation, debouncing |
| Edge case bugs | High | Comprehensive testing, validation, error handling |
| Migration failures | Medium | Feature flag, gradual rollout, fallback to manual |
| Race conditions | Medium | Backend triggers, optimistic updates, proper locking |

---

## Codebase Research Summary

### ✅ Validated Recommendations (Aligned with Codebase)

1. **Mongoose Hooks**: ✅ They extensively use `.pre('save')` hooks - recommendation to use `.post('save')` is valid
2. **Recalculation Services**: ✅ They have `goalAnalytics.js` and `substitutionAnalytics.js` - recommendation to create `minutesCalculation.js` follows their pattern
3. **Service Pattern**: ✅ They call recalculation services in routes (see `games.js` line 224, 235) - recommendation is aligned
4. **Error Handling**: ✅ They have try-catch patterns with console.error - recommendation is aligned

### ❌ Revised Recommendations (Not Aligned with Codebase)

1. **React Query/SWR**: ❌ They DON'T use React Query or SWR - they use custom `DataProvider` context
   - **Revised**: Use their existing `DataProvider` pattern or custom hooks with `useMemo`
   
2. **Feature Flags**: ⚠️ They have feature flags planned but not fully implemented
   - **Revised**: Use simple environment variable instead of full feature flag system

3. **Migrations**: ❌ No formal migration system found
   - **Revised**: Create script in `backend/scripts/` following their existing script pattern

## Conclusion

The original plan is solid but needs refinement in:
1. Data consistency strategy ✅ (validated - they use similar patterns)
2. Calculation trigger mechanism ✅ (validated - they use Mongoose hooks)
3. Edge case handling ⚠️ (needs implementation)
4. Error handling and validation ✅ (validated - they have patterns)
5. Performance optimization ⚠️ (revised - use their DataProvider pattern, not React Query)

**Key Finding**: Most recommendations are valid, but frontend state management should follow their existing `DataProvider` pattern rather than introducing React Query.


# Refactoring Plan: Fix GameReport Data Integrity Issue

## Problem Statement

**Contradictory GameReport Payload**: The system has a design flaw where the client sends data (`minutesPlayed`, `goals`, `assists`) that the server is documented to calculate itself when game status is `'Played'`.

### Current Behavior (Problematic)

1. **Backend** (`backend/src/routes/gameReports.js`):
   - `/batch` endpoint calculates `minutesPlayed`, `goals`, `assists` using `calculatePlayerMinutes()` and `calculatePlayerGoalsAssists()` when `game.status === 'Played'`
   - BUT still accepts these fields from client payload and uses them as fallback (lines 230-240)
   - This creates ambiguity: which value is authoritative?

2. **Frontend** (`src/features/game-management/components/GameDetailsPage/index.jsx`):
   - `handleSavePerformanceReport()` (line 731) sends `minutesPlayed`, `goals`, `assists` in payload (lines 750-752)
   - `handleConfirmFinalSubmission()` (line 809) sends `minutesPlayed`, `goals`, `assists` in payload (lines 867-869)
   - Even though `PlayerPerformanceDialog` shows these fields as read-only when game status is "Played"

### Root Cause

The server should be the **single source of truth** for calculated stats, but the current implementation allows client-provided values to override server calculations, creating data integrity risks.

---

## Solution Overview

**Principle**: Server calculates → Server saves → Client displays (read-only)

1. **Backend**: Explicitly ignore/reject `minutesPlayed`, `goals`, `assists` from client when `game.status === 'Played'`
2. **Frontend**: Don't send these fields when `game.status === 'Played'`
3. **Validation**: Add API-level validation to reject invalid requests

---

## Step-by-Step Refactoring Plan

### Phase 1: Backend Refactoring (`backend/src/routes/gameReports.js`)

#### Step 1.1: Modify `/batch` Endpoint to Ignore Client-Provided Calculated Fields

**File**: `backend/src/routes/gameReports.js`  
**Location**: Lines 181-299 (POST `/batch` route)

**Changes**:

1. **Extract and validate game status early** (after line 194):
   ```javascript
   // Determine calculation strategy based on game status
   const shouldCalculateStats = game.status === 'Played';
   const useCalculatedMinutes = process.env.ENABLE_CALCULATED_MINUTES === 'true' && shouldCalculateStats;
   const useCalculatedGoalsAssists = shouldCalculateStats;
   ```

2. **Add validation to reject client-provided calculated fields** (after line 195, before calculation):
   ```javascript
   // Validate: Reject client-provided calculated fields for "Played" games
   if (shouldCalculateStats) {
     const invalidFields = [];
     for (const reportData of reports) {
       if (reportData.minutesPlayed !== undefined) invalidFields.push('minutesPlayed');
       if (reportData.goals !== undefined) invalidFields.push('goals');
       if (reportData.assists !== undefined) invalidFields.push('assists');
     }
     
     if (invalidFields.length > 0) {
       const uniqueFields = [...new Set(invalidFields)];
       return res.status(400).json({ 
         error: `Invalid request: Server-calculated fields cannot be provided for "Played" games. Remove: ${uniqueFields.join(', ')}` 
       });
     }
   }
   ```

3. **Refactor calculation logic** (replace lines 196-222):
   ```javascript
   // Calculate minutes (only for "Played" games with feature flag)
   let calculatedMinutesMap = {};
   if (useCalculatedMinutes) {
     try {
       calculatedMinutesMap = await calculatePlayerMinutes(gameId);
       console.log(`✅ Using calculated minutes for game ${gameId} (status: ${game.status})`);
     } catch (error) {
       console.error(`❌ Error calculating minutes, falling back to manual:`, error);
       // For "Played" games, calculation failure is critical - don't fall back to manual
       if (shouldCalculateStats) {
         return res.status(500).json({ 
           error: 'Failed to calculate player minutes. Please ensure game events (substitutions, red cards) are properly recorded.' 
         });
       }
     }
   }

   // Calculate goals/assists (always for "Played" games)
   let calculatedGoalsAssistsMap = {};
   if (useCalculatedGoalsAssists) {
     try {
       calculatedGoalsAssistsMap = await calculatePlayerGoalsAssists(gameId);
       console.log(`✅ Using calculated goals/assists for game ${gameId} (status: ${game.status})`);
     } catch (error) {
       console.error(`❌ Error calculating goals/assists, falling back to manual:`, error);
       // For "Played" games, calculation failure is critical - don't fall back to manual
       return res.status(500).json({ 
         error: 'Failed to calculate goals/assists. Please ensure goals are properly recorded in the Goals collection.' 
       });
     }
   }
   ```

4. **Refactor report processing loop** (replace lines 226-286):
   ```javascript
   const results = [];
   
   for (const reportData of reports) {
     const { 
       playerId, 
       // DO NOT destructure minutesPlayed, goals, assists - they are server-calculated
       rating_physical, 
       rating_technical, 
       rating_tactical, 
       rating_mental, 
       notes 
     } = reportData;
     
     // Validate playerId
     if (!playerId) {
       return res.status(400).json({ error: 'Missing playerId in report data' });
     }
     
     // Determine final values for calculated fields
     let finalMinutesPlayed = 0;
     let finalGoals = 0;
     let finalAssists = 0;
     let minutesCalculationMethod = 'manual';
     
     if (shouldCalculateStats) {
       // For "Played" games: Use calculated values ONLY
       finalMinutesPlayed = useCalculatedMinutes && calculatedMinutesMap[playerId] !== undefined
         ? calculatedMinutesMap[playerId]
         : 0; // Default to 0 if calculation failed (shouldn't happen due to validation above)
       
       minutesCalculationMethod = useCalculatedMinutes && calculatedMinutesMap[playerId] !== undefined
         ? 'calculated'
         : 'manual';
       
       finalGoals = calculatedGoalsAssistsMap[playerId]?.goals || 0;
       finalAssists = calculatedGoalsAssistsMap[playerId]?.assists || 0;
     } else {
       // For "Scheduled" or "Done" games: Use client-provided values (legacy support)
       finalMinutesPlayed = reportData.minutesPlayed !== undefined ? reportData.minutesPlayed : 0;
       finalGoals = reportData.goals !== undefined ? reportData.goals : 0;
       finalAssists = reportData.assists !== undefined ? reportData.assists : 0;
       minutesCalculationMethod = 'manual';
     }
     
     // Find existing report or create new
     let gameReport = await GameReport.findOne({ 
       game: gameId, 
       player: playerId 
     });

     if (gameReport) {
       // Update existing
       gameReport.minutesPlayed = finalMinutesPlayed;
       gameReport.minutesCalculationMethod = minutesCalculationMethod;
       gameReport.goals = finalGoals;
       gameReport.assists = finalAssists;
       gameReport.rating_physical = rating_physical !== undefined ? rating_physical : gameReport.rating_physical;
       gameReport.rating_technical = rating_technical !== undefined ? rating_technical : gameReport.rating_technical;
       gameReport.rating_tactical = rating_tactical !== undefined ? rating_tactical : gameReport.rating_tactical;
       gameReport.rating_mental = rating_mental !== undefined ? rating_mental : gameReport.rating_mental;
       gameReport.notes = notes !== undefined ? notes : gameReport.notes;
       gameReport.author = req.user._id;
       await gameReport.save();
     } else {
       // Create new
       gameReport = new GameReport({
         game: gameId,
         player: playerId,
         author: req.user._id,
         minutesPlayed: finalMinutesPlayed,
         minutesCalculationMethod: minutesCalculationMethod,
         goals: finalGoals,
         assists: finalAssists,
         rating_physical: rating_physical || 3,
         rating_technical: rating_technical || 3,
         rating_tactical: rating_tactical || 3,
         rating_mental: rating_mental || 3,
         notes
       });
       await gameReport.save();
     }
     
     await gameReport.populate('player game author');
     results.push(gameReport);
   }
   ```

**Summary of Backend Changes**:
- ✅ Reject client-provided `minutesPlayed`, `goals`, `assists` for "Played" games (400 Bad Request)
- ✅ Always calculate these fields server-side for "Played" games
- ✅ Don't fall back to client values for "Played" games (fail fast if calculation fails)
- ✅ Keep legacy support for "Scheduled" and "Done" games (accept client values)

---

### Phase 2: Frontend Refactoring

#### Step 2.1: Modify `handleSavePerformanceReport` in `GameDetailsPage`

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`  
**Location**: Lines 731-771

**Changes**:

Replace the function with:
```javascript
const handleSavePerformanceReport = async () => {
  if (!selectedPlayer) return;

  setLocalPlayerReports((prev) => ({
    ...prev,
    [selectedPlayer._id]: playerPerfData,
  }));

  try {
    // Build payload: Only include user-editable fields
    // For "Played" games, do NOT send minutesPlayed, goals, assists (server calculates)
    const isPlayed = game?.status === 'Played';
    
    const reportPayload = {
      playerId: selectedPlayer._id,
      rating_physical: playerPerfData.rating,
      rating_technical: playerPerfData.rating,
      rating_tactical: playerPerfData.rating,
      rating_mental: playerPerfData.rating,
      notes: playerPerfData.notes,
    };
    
    // Only include calculated fields for non-"Played" games (legacy support)
    if (!isPlayed) {
      reportPayload.minutesPlayed = playerPerfData.minutesPlayed;
      reportPayload.goals = playerPerfData.goals;
      reportPayload.assists = playerPerfData.assists;
    }
    // For "Played" games, these fields are omitted - server will calculate them

    const response = await fetch(`http://localhost:3001/api/game-reports/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        gameId,
        reports: [reportPayload],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to auto-save performance report:", errorData.error || "Unknown error");
      // Optionally show user-friendly error message
    }
  } catch (error) {
    console.error("Error auto-saving performance report:", error);
  }

  setShowPlayerPerfDialog(false);
  setSelectedPlayer(null);
};
```

#### Step 2.2: Modify `handleConfirmFinalSubmission` in `GameDetailsPage`

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`  
**Location**: Lines 809-924

**Changes**:

Replace the `reportUpdates` construction (lines 865-875) with:
```javascript
// Build report updates: Only include user-editable fields
// For "Played" games, do NOT send minutesPlayed, goals, assists (server calculates)
const isPlayed = game?.status === 'Played';

const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => {
  const payload = {
    playerId,
    rating_physical: report.rating,
    rating_technical: report.rating,
    rating_tactical: report.rating,
    rating_mental: report.rating,
    notes: report.notes,
  };
  
  // Only include calculated fields for non-"Played" games (legacy support)
  if (!isPlayed) {
    payload.minutesPlayed = report.minutesPlayed;
    payload.goals = report.goals;
    payload.assists = report.assists;
  }
  // For "Played" games, these fields are omitted - server will calculate them
  
  return payload;
});
```

**Summary of Frontend Changes**:
- ✅ Conditionally exclude `minutesPlayed`, `goals`, `assists` from payload when `game.status === 'Played'`
- ✅ Keep sending these fields for "Scheduled" and "Done" games (legacy support)
- ✅ Only send user-editable fields: `rating_*`, `notes`

---

### Phase 3: API Contract Validation (Optional but Recommended)

#### Step 3.1: Add Request Validation Middleware

**Option A: Mongoose Schema Validation** (Simpler)

**File**: `backend/src/models/GameReport.js`

Add a pre-save hook to validate that calculated fields aren't manually set for "Played" games:
```javascript
// Add before module.exports
gameReportSchema.pre('save', async function(next) {
  // This validation is primarily for batch operations
  // Individual field validation happens at route level
  next();
});
```

**Note**: Schema-level validation is less ideal here because we need game context. Route-level validation (Step 1.1) is preferred.

**Option B: Joi/Zod Validation** (More Robust)

Create a validation schema file: `backend/src/validation/gameReportValidation.js`

```javascript
const Joi = require('joi');

const gameReportBatchSchema = (gameStatus) => {
  const baseReportSchema = {
    playerId: Joi.string().required(),
    rating_physical: Joi.number().min(1).max(5).optional(),
    rating_technical: Joi.number().min(1).max(5).optional(),
    rating_tactical: Joi.number().min(1).max(5).optional(),
    rating_mental: Joi.number().min(1).max(5).optional(),
    notes: Joi.string().allow(null, '').optional(),
  };
  
  // For "Played" games, reject calculated fields
  if (gameStatus === 'Played') {
    return Joi.object({
      gameId: Joi.string().required(),
      reports: Joi.array().items(
        Joi.object({
          ...baseReportSchema,
          minutesPlayed: Joi.forbidden(), // Explicitly reject
          goals: Joi.forbidden(), // Explicitly reject
          assists: Joi.forbidden(), // Explicitly reject
        })
      ).required(),
    });
  }
  
  // For other statuses, allow calculated fields (legacy)
  return Joi.object({
    gameId: Joi.string().required(),
    reports: Joi.array().items(
      Joi.object({
        ...baseReportSchema,
        minutesPlayed: Joi.number().min(0).max(120).optional(),
        goals: Joi.number().min(0).optional(),
        assists: Joi.number().min(0).optional(),
      })
    ).required(),
  });
};

module.exports = { gameReportBatchSchema };
```

Then use in `backend/src/routes/gameReports.js`:
```javascript
const { gameReportBatchSchema } = require('../validation/gameReportValidation');

// In POST /batch route, after getting game (line 194):
const { error, value } = gameReportBatchSchema(game.status).validate(req.body);
if (error) {
  return res.status(400).json({ 
    error: 'Validation error', 
    details: error.details.map(d => d.message).join(', ') 
  });
}
// Use validated value instead of req.body
```

**Recommendation**: Use **Option B (Joi/Zod)** for production-grade validation, but **Option A (route-level validation from Step 1.1)** is sufficient for MVP.

---

## Testing Checklist

### Backend Tests

- [ ] **Test 1**: POST `/api/game-reports/batch` with `game.status === 'Played'` and `minutesPlayed` in payload → Should return 400 Bad Request
- [ ] **Test 2**: POST `/api/game-reports/batch` with `game.status === 'Played'` and `goals` in payload → Should return 400 Bad Request
- [ ] **Test 3**: POST `/api/game-reports/batch` with `game.status === 'Played'` and `assists` in payload → Should return 400 Bad Request
- [ ] **Test 4**: POST `/api/game-reports/batch` with `game.status === 'Played'` WITHOUT calculated fields → Should succeed and use server-calculated values
- [ ] **Test 5**: POST `/api/game-reports/batch` with `game.status === 'Scheduled'` WITH calculated fields → Should succeed (legacy support)
- [ ] **Test 6**: POST `/api/game-reports/batch` with `game.status === 'Done'` WITH calculated fields → Should succeed (legacy support)
- [ ] **Test 7**: Verify calculated values match `calculatePlayerMinutes()` and `calculatePlayerGoalsAssists()` results

### Frontend Tests

- [ ] **Test 8**: Save player report when `game.status === 'Played'` → Network tab should show payload WITHOUT `minutesPlayed`, `goals`, `assists`
- [ ] **Test 9**: Save player report when `game.status === 'Scheduled'` → Network tab should show payload WITH `minutesPlayed`, `goals`, `assists`
- [ ] **Test 10**: Final submission when `game.status === 'Played'` → Network tab should show batch payload WITHOUT calculated fields
- [ ] **Test 11**: Verify UI still displays calculated values correctly (read-only)

### Integration Tests

- [ ] **Test 12**: End-to-end: Create game → Mark as "Played" → Add goals/substitutions → Save player report → Verify database has server-calculated values
- [ ] **Test 13**: Verify backward compatibility: "Done" games still accept client-provided values

---

## Migration Notes

### Backward Compatibility

- ✅ **"Scheduled" games**: Continue accepting client-provided `minutesPlayed`, `goals`, `assists` (no breaking change)
- ✅ **"Done" games**: Continue accepting client-provided values (legacy support)
- ⚠️ **"Played" games**: Breaking change - client MUST NOT send calculated fields

### Rollout Strategy

1. **Phase 1**: Deploy backend changes (with validation)
2. **Phase 2**: Deploy frontend changes (stop sending calculated fields)
3. **Phase 3**: Monitor error logs for 400 Bad Request responses (should be zero after frontend deployment)

### Error Handling

- If backend receives calculated fields for "Played" games → Return 400 with clear error message
- If calculation fails for "Played" games → Return 500 with actionable error message
- Frontend should display user-friendly error messages

---

## Files Modified

### Backend
- `backend/src/routes/gameReports.js` (POST `/batch` route)

### Frontend
- `src/features/game-management/components/GameDetailsPage/index.jsx` (`handleSavePerformanceReport`, `handleConfirmFinalSubmission`)

### Optional
- `backend/src/validation/gameReportValidation.js` (NEW - if using Joi/Zod)

---

## Success Criteria

✅ **Server is single source of truth**: Calculated fields for "Played" games are always computed server-side  
✅ **No data integrity issues**: Client cannot override server calculations  
✅ **Clear API contract**: 400 Bad Request for invalid requests  
✅ **Backward compatible**: "Scheduled" and "Done" games continue to work  
✅ **User experience**: UI correctly displays calculated values (read-only)

---

## Estimated Effort

- **Backend refactoring**: 2-3 hours
- **Frontend refactoring**: 1-2 hours
- **Validation layer (optional)**: 1-2 hours
- **Testing**: 2-3 hours
- **Total**: 6-10 hours

---

## Risk Assessment

### Low Risk
- Backend validation is additive (doesn't break existing functionality)
- Frontend changes are conditional (only affects "Played" games)

### Medium Risk
- Breaking change for "Played" games (mitigated by clear error messages)
- Calculation failures need proper error handling

### Mitigation
- Deploy backend first, monitor for 400 errors
- Deploy frontend second, verify no 400 errors
- Add comprehensive logging for debugging

---

## Next Steps

1. Review this plan with the team
2. Create feature branch: `fix/gamereport-data-integrity`
3. Implement backend changes (Phase 1)
4. Implement frontend changes (Phase 2)
5. Add validation layer (Phase 3 - optional)
6. Run test checklist
7. Deploy to staging
8. Monitor error logs
9. Deploy to production


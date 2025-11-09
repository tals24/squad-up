# Simplified Refactoring Plan: GameReport Data Integrity Fix

## Problem Statement

**Contradictory GameReport Payload**: The client sends `minutesPlayed`, `goals`, and `assists` that the server should calculate. This creates data integrity risks and ambiguity about which values are authoritative.

## Solution Overview

**Principle**: Server is 100% authoritative for calculated fields. Client only sends user-editable data.

- ✅ **Server always calculates**: `minutesPlayed`, `goals`, `assists` are always computed server-side
- ✅ **Client sends only**: `playerId`, `notes`, `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental`
- ✅ **Strict validation**: Reject any request containing calculated fields (400 Bad Request)
- ❌ **No legacy support**: Remove all conditional logic based on game status

---

## Step-by-Step Refactoring Plan

### Phase 1: Backend Refactoring (`backend/src/routes/gameReports.js`)

#### Step 1.1: Strict Validation - Reject Calculated Fields

**File**: `backend/src/routes/gameReports.js`  
**Location**: POST `/batch` route (lines 181-299)

**Action**: Add validation immediately after parsing request body to reject any calculated fields.

**Code Change** (insert after line 188):
```javascript
// Strict validation: Reject any calculated fields from client
const forbiddenFields = ['minutesPlayed', 'goals', 'assists'];
const invalidFields = [];

for (const reportData of reports) {
  for (const field of forbiddenFields) {
    if (reportData[field] !== undefined) {
      invalidFields.push(`${field} in report for playerId: ${reportData.playerId || 'unknown'}`);
    }
  }
}

if (invalidFields.length > 0) {
  return res.status(400).json({ 
    error: 'Invalid request: Server-calculated fields cannot be provided by client.',
    details: invalidFields,
    message: 'The following fields are server-calculated and must not be sent: minutesPlayed, goals, assists'
  });
}
```

#### Step 1.2: Always Calculate Server-Side

**File**: `backend/src/routes/gameReports.js`  
**Location**: Replace lines 196-222

**Action**: Remove all conditional logic. Always calculate minutes, goals, and assists.

**Code Change**:
```javascript
// Always calculate minutes (server is authoritative)
let calculatedMinutesMap = {};
try {
  calculatedMinutesMap = await calculatePlayerMinutes(gameId);
  console.log(`✅ Calculated minutes for game ${gameId}`);
} catch (error) {
  console.error(`❌ Error calculating minutes:`, error);
  return res.status(500).json({ 
    error: 'Failed to calculate player minutes',
    message: 'Please ensure game events (substitutions, red cards) are properly recorded.'
  });
}

// Always calculate goals/assists (server is authoritative)
let calculatedGoalsAssistsMap = {};
try {
  calculatedGoalsAssistsMap = await calculatePlayerGoalsAssists(gameId);
  console.log(`✅ Calculated goals/assists for game ${gameId}`);
} catch (error) {
  console.error(`❌ Error calculating goals/assists:`, error);
  return res.status(500).json({ 
    error: 'Failed to calculate goals/assists',
    message: 'Please ensure goals are properly recorded in the Goals collection.'
  });
}
```

#### Step 1.3: Refactor Report Processing Loop

**File**: `backend/src/routes/gameReports.js`  
**Location**: Replace lines 224-286

**Action**: Use `findOneAndUpdate` with `upsert: true`. Only extract allowed fields from request. Use calculated values from server.

**Code Change**:
```javascript
const results = [];

for (const reportData of reports) {
  // Extract ONLY allowed fields from client
  const { 
    playerId, 
    notes, 
    rating_physical, 
    rating_technical, 
    rating_tactical, 
    rating_mental 
  } = reportData;
  
  // Validate required fields
  if (!playerId) {
    return res.status(400).json({ error: 'Missing required field: playerId' });
  }
  
  // Get calculated values from server (authoritative)
  const calculatedMinutes = calculatedMinutesMap[playerId] || 0;
  const calculatedGoals = calculatedGoalsAssistsMap[playerId]?.goals || 0;
  const calculatedAssists = calculatedGoalsAssistsMap[playerId]?.assists || 0;
  
  // Determine calculation method for minutes
  const minutesCalculationMethod = calculatedMinutesMap[playerId] !== undefined 
    ? 'calculated' 
    : 'manual';
  
  // Use findOneAndUpdate with upsert for atomic operation
  const gameReport = await GameReport.findOneAndUpdate(
    { 
      game: gameId, 
      player: playerId 
    },
    {
      // Server-calculated fields (always from calculation services)
      minutesPlayed: calculatedMinutes,
      minutesCalculationMethod: minutesCalculationMethod,
      goals: calculatedGoals,
      assists: calculatedAssists,
      
      // Client-provided fields (user-editable)
      rating_physical: rating_physical !== undefined ? rating_physical : 3,
      rating_technical: rating_technical !== undefined ? rating_technical : 3,
      rating_tactical: rating_tactical !== undefined ? rating_tactical : 3,
      rating_mental: rating_mental !== undefined ? rating_mental : 3,
      notes: notes !== undefined ? notes : null,
      
      // Metadata
      author: req.user._id,
    },
    {
      new: true, // Return updated document
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true // Apply schema defaults on insert
    }
  );
  
  await gameReport.populate('player game author');
  results.push(gameReport);
}
```

**Summary of Backend Changes**:
- ✅ Strict validation: Reject requests with `minutesPlayed`, `goals`, `assists` (400 Bad Request)
- ✅ Always calculate: Remove all conditional logic, always call calculation services
- ✅ Fail fast: Return 500 if calculations fail (no fallback)
- ✅ Atomic operations: Use `findOneAndUpdate` with `upsert: true`
- ✅ Clear separation: Client fields vs server-calculated fields

---

### Phase 2: Frontend State Refactoring (`GameDetailsPage/index.jsx`)

#### Step 2.1: Update State Structure for Individual Ratings

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

**Action**: Change from single `rating` field to individual `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental` fields.

**Locations to Update**:

1. **Line 326**: Update report initialization to extract individual ratings
   ```javascript
   // OLD:
   rating: Math.round((report.rating_physical + report.rating_technical + report.rating_tactical + report.rating_mental) / 4),
   
   // NEW:
   rating_physical: report.rating_physical || 3,
   rating_technical: report.rating_technical || 3,
   rating_tactical: report.rating_tactical || 3,
   rating_mental: report.rating_mental || 3,
   ```

2. **Line 470**: Update validation check (if needed)
   ```javascript
   // Remove or update any validation that checks rating field
   ```

3. **Line 522-537**: Update rating aggregation logic (if needed)
   ```javascript
   // If calculating max rating, use average of 4 ratings:
   const avgRating = (report.rating_physical + report.rating_technical + report.rating_tactical + report.rating_mental) / 4;
   ```

4. **Line 720-725**: Update `playerPerfData` initialization
   ```javascript
   // OLD:
   const existingReport = localPlayerReports[player._id] || {};
   setPlayerPerfData({
     minutesPlayed: existingReport.minutesPlayed || 0,
     goals: existingReport.goals || 0,
     assists: existingReport.assists || 0,
     rating: existingReport.rating || 3,
     notes: existingReport.notes || "",
   });
   
   // NEW:
   const existingReport = localPlayerReports[player._id] || {};
   setPlayerPerfData({
     // Remove calculated fields - they're read-only
     rating_physical: existingReport.rating_physical || 3,
     rating_technical: existingReport.rating_technical || 3,
     rating_tactical: existingReport.rating_tactical || 3,
     rating_mental: existingReport.rating_mental || 3,
     notes: existingReport.notes || "",
   });
   ```

#### Step 2.2: Update `handleSavePerformanceReport`

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`  
**Location**: Lines 731-771

**Action**: Remove calculated fields from payload. Only send allowed fields.

**Code Change**:
```javascript
const handleSavePerformanceReport = async () => {
  if (!selectedPlayer) return;

  setLocalPlayerReports((prev) => ({
    ...prev,
    [selectedPlayer._id]: playerPerfData,
  }));

  try {
    // Build payload: ONLY user-editable fields
    const reportPayload = {
      playerId: selectedPlayer._id,
      rating_physical: playerPerfData.rating_physical,
      rating_technical: playerPerfData.rating_technical,
      rating_tactical: playerPerfData.rating_tactical,
      rating_mental: playerPerfData.rating_mental,
      notes: playerPerfData.notes || null,
    };
    
    // DO NOT send: minutesPlayed, goals, assists (server calculates)

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
      console.error("Failed to save performance report:", errorData.error || "Unknown error");
      // Optionally show user-friendly error message
    }
  } catch (error) {
    console.error("Error saving performance report:", error);
  }

  setShowPlayerPerfDialog(false);
  setSelectedPlayer(null);
};
```

#### Step 2.3: Update `handleConfirmFinalSubmission`

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`  
**Location**: Lines 865-875

**Action**: Remove calculated fields from batch payload. Only send allowed fields.

**Code Change**:
```javascript
// Build report updates: ONLY user-editable fields
const reportUpdates = Object.entries(localPlayerReports).map(([playerId, report]) => ({
  playerId,
  rating_physical: report.rating_physical || 3,
  rating_technical: report.rating_technical || 3,
  rating_tactical: report.rating_tactical || 3,
  rating_mental: report.rating_mental || 3,
  notes: report.notes || null,
  // DO NOT send: minutesPlayed, goals, assists (server calculates)
}));
```

---

### Phase 3: Frontend UI Refactoring (`PlayerPerformanceDialog.jsx`)

#### Step 3.1: Replace Single Rating with Four Individual Ratings

**File**: `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`  
**Location**: Lines 319-338

**Action**: Replace the single "General Rating" star selector with four separate rating inputs (one for each dimension).

**Code Change** (replace lines 319-338):
```javascript
{/* Individual Rating Dimensions */}
<div className="space-y-4">
  <div>
    <label className="text-sm font-semibold text-slate-400 mb-2 block">
      Physical Rating
    </label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !isReadOnly && onDataChange({ ...data, rating_physical: star })}
          disabled={isReadOnly}
          className={`
            text-2xl transition-all
            ${(data.rating_physical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
            ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
          `}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-400">
        {data.rating_physical || 3}/5
      </span>
    </div>
  </div>

  <div>
    <label className="text-sm font-semibold text-slate-400 mb-2 block">
      Technical Rating
    </label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !isReadOnly && onDataChange({ ...data, rating_technical: star })}
          disabled={isReadOnly}
          className={`
            text-2xl transition-all
            ${(data.rating_technical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
            ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
          `}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-400">
        {data.rating_technical || 3}/5
      </span>
    </div>
  </div>

  <div>
    <label className="text-sm font-semibold text-slate-400 mb-2 block">
      Tactical Rating
    </label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !isReadOnly && onDataChange({ ...data, rating_tactical: star })}
          disabled={isReadOnly}
          className={`
            text-2xl transition-all
            ${(data.rating_tactical || 3) >= star ? "text-yellow-400" : "text-slate-600"}
            ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
          `}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-400">
        {data.rating_tactical || 3}/5
      </span>
    </div>
  </div>

  <div>
    <label className="text-sm font-semibold text-slate-400 mb-2 block">
      Mental Rating
    </label>
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !isReadOnly && onDataChange({ ...data, rating_mental: star })}
          disabled={isReadOnly}
          className={`
            text-2xl transition-all
            ${(data.rating_mental || 3) >= star ? "text-yellow-400" : "text-slate-600"}
            ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
          `}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-400">
        {data.rating_mental || 3}/5
      </span>
    </div>
  </div>
</div>
```

#### Step 3.2: Update Data Initialization in Dialog

**File**: `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`

**Action**: Ensure the dialog receives and initializes the four rating fields correctly.

**Check**: The `data` prop should already contain `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental` from the parent component (after Phase 2 changes).

**Note**: The dialog already receives `data` as a prop and uses `onDataChange` to update it. No changes needed here if parent component is updated correctly.

---

## Testing Checklist

### Backend Tests

- [ ] **Test 1**: POST `/api/game-reports/batch` with `minutesPlayed` in payload → Should return 400 Bad Request
- [ ] **Test 2**: POST `/api/game-reports/batch` with `goals` in payload → Should return 400 Bad Request
- [ ] **Test 3**: POST `/api/game-reports/batch` with `assists` in payload → Should return 400 Bad Request
- [ ] **Test 4**: POST `/api/game-reports/batch` with all three calculated fields → Should return 400 Bad Request
- [ ] **Test 5**: POST `/api/game-reports/batch` with only allowed fields → Should succeed
- [ ] **Test 6**: Verify calculated values are saved correctly (match `calculatePlayerMinutes()` and `calculatePlayerGoalsAssists()`)
- [ ] **Test 7**: Verify `findOneAndUpdate` with `upsert: true` works (creates new, updates existing)
- [ ] **Test 8**: Test calculation failure → Should return 500 error (no fallback)

### Frontend Tests

- [ ] **Test 9**: Save player report → Network tab shows payload WITHOUT `minutesPlayed`, `goals`, `assists`
- [ ] **Test 10**: Save player report → Network tab shows payload WITH `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental`
- [ ] **Test 11**: Final submission → Network tab shows batch payload WITHOUT calculated fields
- [ ] **Test 12**: UI displays four separate rating inputs (Physical, Technical, Tactical, Mental)
- [ ] **Test 13**: Each rating input updates independently
- [ ] **Test 14**: Read-only mode: Calculated fields (minutes, goals, assists) display correctly but are disabled

### Integration Tests

- [ ] **Test 15**: End-to-end: Create game → Mark as "Played" → Add goals/substitutions → Save player report → Verify database has server-calculated values
- [ ] **Test 16**: Verify individual ratings are saved correctly (not all set to same value)
- [ ] **Test 17**: Verify existing reports are updated (not duplicated) when saving again

---

## Migration Notes

### Breaking Changes

⚠️ **API Breaking Change**: Client MUST NOT send `minutesPlayed`, `goals`, `assists` in any request. These fields will be rejected with 400 Bad Request.

⚠️ **State Structure Change**: Frontend state changes from single `rating` field to four separate fields: `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental`.

### Data Migration

**Existing Data**: Existing `GameReport` documents in database already have the four rating fields. No migration needed.

**Frontend State**: Existing `localPlayerReports` state may have `rating` field. Need to handle migration:
- When loading existing reports, if `rating` exists but individual ratings don't, set all four to `rating` value
- Or: Calculate average from existing individual ratings if they exist

**Recommended Migration Code** (in `GameDetailsPage/index.jsx`, when loading reports):
```javascript
// When initializing localPlayerReports from gameReports
const report = {
  // ... other fields
  rating_physical: report.rating_physical || report.rating || 3,
  rating_technical: report.rating_technical || report.rating || 3,
  rating_tactical: report.rating_tactical || report.rating || 3,
  rating_mental: report.rating_mental || report.rating || 3,
  // Remove: rating field (deprecated)
};
```

### Rollout Strategy

1. **Phase 1**: Deploy backend changes (strict validation)
   - Monitor for 400 errors (should be zero after frontend deployment)
   - Monitor for 500 errors (calculation failures)

2. **Phase 2**: Deploy frontend changes (remove calculated fields from payload)
   - Verify no 400 errors in logs
   - Test UI functionality

3. **Phase 3**: Deploy UI changes (four rating inputs)
   - Test user experience
   - Verify data persistence

---

## Files Modified

### Backend
- `backend/src/routes/gameReports.js` (POST `/batch` route - strict validation, always calculate, atomic upsert)

### Frontend
- `src/features/game-management/components/GameDetailsPage/index.jsx` (state structure, payload construction)
- `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx` (UI for four rating inputs)

---

## Success Criteria

✅ **Server is 100% authoritative**: Calculated fields are always computed server-side, never from client  
✅ **Strict API contract**: 400 Bad Request for any request containing calculated fields  
✅ **Clean separation**: Client sends only user-editable fields, server calculates the rest  
✅ **User experience**: Four individual rating inputs work correctly  
✅ **Data integrity**: No ambiguity about which values are authoritative  

---

## Estimated Effort

- **Backend refactoring**: 2-3 hours
- **Frontend state refactoring**: 2-3 hours
- **UI refactoring**: 2-3 hours
- **Testing**: 2-3 hours
- **Total**: 8-12 hours

---

## Risk Assessment

### Low Risk
- Backend validation is strict but clear (good error messages)
- Frontend changes are straightforward (remove fields, add UI)

### Medium Risk
- State structure change requires careful migration
- UI change (four inputs) needs UX testing

### Mitigation
- Deploy backend first, monitor for errors
- Add migration code for existing state
- Test UI thoroughly before production

---

## Next Steps

1. Review this plan with the team
2. Create feature branch: `refactor/gamereport-strict-api`
3. Implement backend changes (Phase 1)
4. Implement frontend state changes (Phase 2)
5. Implement UI changes (Phase 3)
6. Run test checklist
7. Deploy to staging
8. Monitor error logs
9. Deploy to production


# Bug Fix: Feature Name Mismatch - Difficulty Assessment

## Issue Found via Debug Logs
The Difficulty Assessment card was not showing because of a **feature name mismatch** between the backend and frontend.

## Root Cause

### Backend (Correct)
```javascript
features: {
  gameDifficultyAssessmentEnabled: true  // ✅ Backend uses this name
}
```

### Frontend (Incorrect)
```javascript
useFeature("difficultyAssessment")  // ❌ Frontend was looking for this name
```

**Result:** `useFeature("difficultyAssessment")` returned `false` because that property doesn't exist in the config. The actual property is `gameDifficultyAssessmentEnabled`.

## Evidence from Debug Logs

The key log that revealed the issue:
```
🔍 [useFeature] "difficultyAssessment": globalEnabled = false, features = {
  shotTrackingEnabled: false, 
  positionSpecificMetricsEnabled: false, 
  detailedDisciplinaryEnabled: true, 
  goalInvolvementEnabled: true, 
  gameDifficultyAssessmentEnabled: true  // ← This is what exists!
}
```

The frontend was asking for `"difficultyAssessment"`, but the backend config has `gameDifficultyAssessmentEnabled`.

## Fix Applied

Changed the feature name in the frontend to match the backend's naming convention.

### File 1: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Before:**
```javascript
const isDifficultyAssessmentEnabled = useFeature("difficultyAssessment");
```

**After:**
```javascript
const isDifficultyAssessmentEnabled = useFeature("gameDifficultyAssessmentEnabled");
```

### File 2: `frontend/src/app/providers/DataProvider.jsx`

Updated default/fallback configs to use the correct property name:

**Before:**
```javascript
features: {
  shotTrackingEnabled: false,
  positionSpecificMetricsEnabled: false,
  detailedDisciplinaryEnabled: true,
  goalInvolvementEnabled: true,
  difficultyAssessment: true  // ❌ Wrong name
}
```

**After:**
```javascript
features: {
  shotTrackingEnabled: false,
  positionSpecificMetricsEnabled: false,
  detailedDisciplinaryEnabled: true,
  goalInvolvementEnabled: true,
  gameDifficultyAssessmentEnabled: true  // ✅ Correct name
}
```

This change was made in **3 places** in `DataProvider.jsx`:
1. Default config when no auth token exists
2. Fallback config when API call fails
3. Debug log messages

## Expected Behavior After Fix

### Before Fix:
```
🔍 [useFeature] "difficultyAssessment": globalEnabled = false
🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: false
🔍 [MatchAnalysisSidebar] NOT rendering DifficultyAssessmentCard
```
❌ Card never renders

### After Fix:
```
🔍 [useFeature] "gameDifficultyAssessmentEnabled": globalEnabled = true
🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: true
🔍 [MatchAnalysisSidebar] Rendering DifficultyAssessmentCard
```
✅ Card renders successfully

## Testing Instructions

1. **Reload the page** (Ctrl+R or Cmd+R)
2. **Open browser console** (F12)
3. **Navigate to a game details page**
4. **Check the debug logs** - You should now see:
   ```
   🔍 [useFeature] "gameDifficultyAssessmentEnabled": globalEnabled = true
   🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: true
   🔍 [MatchAnalysisSidebar] Rendering DifficultyAssessmentCard
   ```
5. **Check the right sidebar** - The Difficulty Assessment card should now be visible!

## Why This Happened

This is a classic naming inconsistency issue that can occur when:
- Backend API is developed separately from the frontend
- Feature names are not documented in a shared specification
- Different developers use different naming conventions
- The feature name in the backend was changed but not updated in the frontend (or vice versa)

## Naming Convention Note

The backend uses a more descriptive name: `gameDifficultyAssessmentEnabled`
- ✅ **Clear:** Explicitly states it's for "game" difficulty assessment
- ✅ **Specific:** Distinguishes from other types of difficulty assessments (e.g., player, drill, training)
- ✅ **Consistent:** Follows the pattern of other features (`shotTrackingEnabled`, `goalInvolvementEnabled`)

The frontend was using a shorter name: `difficultyAssessment`
- ⚠️ **Ambiguous:** Doesn't specify what type of difficulty assessment
- ⚠️ **Inconsistent:** Doesn't follow the `*Enabled` suffix pattern

**Decision:** Use the backend's naming convention (`gameDifficultyAssessmentEnabled`) as it's more explicit and consistent.

## Related Files Modified

1. `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`
   - Changed `useFeature("difficultyAssessment")` → `useFeature("gameDifficultyAssessmentEnabled")`

2. `frontend/src/app/providers/DataProvider.jsx`
   - Changed `difficultyAssessment: true` → `gameDifficultyAssessmentEnabled: true` (3 places)
   - Updated debug log messages

## Status
✅ **FIXED** - Feature name now matches between frontend and backend

## Next Steps
After confirming this fix works, we should:
1. ✅ Test the Difficulty Assessment card appears and functions correctly
2. ✅ Remove debug console logs once fully tested
3. ✅ Document the correct feature flag name in project documentation
4. ✅ Consider creating a shared type definition or constant file for feature flag names to prevent future mismatches


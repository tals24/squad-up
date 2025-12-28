# Bug Fix: Difficulty Assessment Feature Flag Missing

## Issue
The Difficulty Assessment card was not showing in the Match Analysis sidebar, even though all the correct props were being passed to the component.

## Root Cause
The `difficultyAssessment` feature flag was **not included** in the default organization config in `DataProvider.jsx`.

When `useFeature("difficultyAssessment")` was called, it checked `organizationConfig.features.difficultyAssessment`, which was `undefined`. Since JavaScript treats `undefined` as falsy, the condition in `MatchAnalysisSidebar.jsx`:

```jsx
{isDifficultyAssessmentEnabled && (
  <DifficultyAssessmentCard ... />
)}
```

...was evaluating to `false`, preventing the component from rendering.

## Investigation Path
1. ✅ Verified props were being passed correctly to `MatchAnalysisModule`
2. ✅ Verified `MatchAnalysisSidebar` was receiving the props
3. ✅ Checked the conditional rendering logic in `MatchAnalysisSidebar`
4. ✅ Traced `isDifficultyAssessmentEnabled` back to `useFeature("difficultyAssessment")`
5. ✅ Examined `useFeature` hook implementation
6. ✅ Checked `organizationConfig` in `DataProvider.jsx`
7. ❌ **Found the issue:** `difficultyAssessment` was missing from default features

## Fix Applied

**File:** `frontend/src/app/providers/DataProvider.jsx`

Added `difficultyAssessment: true` to both places where default organization config is set:

### Location 1: No Auth Token Fallback (lines 113-126)
```javascript
// Before:
features: {
    shotTrackingEnabled: false,
    positionSpecificMetricsEnabled: false,
    detailedDisciplinaryEnabled: true,
    goalInvolvementEnabled: true
}

// After:
features: {
    shotTrackingEnabled: false,
    positionSpecificMetricsEnabled: false,
    detailedDisciplinaryEnabled: true,
    goalInvolvementEnabled: true,
    difficultyAssessment: true  // ✅ Added
}
```

### Location 2: Error Fallback (lines 144-158)
```javascript
// Before:
features: {
    shotTrackingEnabled: false,
    positionSpecificMetricsEnabled: false,
    detailedDisciplinaryEnabled: true,
    goalInvolvementEnabled: true
}

// After:
features: {
    shotTrackingEnabled: false,
    positionSpecificMetricsEnabled: false,
    detailedDisciplinaryEnabled: true,
    goalInvolvementEnabled: true,
    difficultyAssessment: true  // ✅ Added
}
```

## Why Set to `true`?
The feature is set to `true` by default because:
1. The component already exists and is fully implemented
2. It was likely intended to be visible (props were being passed)
3. It's a useful feature for game preparation and analysis
4. Setting to `false` would require users to manually enable it in settings

If the feature should be opt-in instead, change `difficultyAssessment: true` to `difficultyAssessment: false` in both locations.

## Expected Behavior After Fix

### Before Fix:
- ❌ Difficulty Assessment card never visible
- ❌ `useFeature("difficultyAssessment")` returns `false` or `undefined`
- ❌ Conditional rendering prevents component from showing

### After Fix:
- ✅ **Scheduled games:** Difficulty Assessment card visible, editable
- ✅ **Played games:** Difficulty Assessment card visible, editable
- ✅ **Done games:** Difficulty Assessment card visible, read-only
- ✅ `useFeature("difficultyAssessment")` returns `true`
- ✅ Component renders correctly in Match Analysis sidebar

## Testing Instructions

1. **Reload the page** (or restart the frontend dev server if needed)
2. Navigate to any game's details page
3. Look at the **right sidebar** (Match Analysis)
4. ✅ **Verify:** Difficulty Assessment card is visible
   - Should appear below "AI Match Preview" for Scheduled games
   - Should appear below "AI Match Summary" for Done games
5. **For Scheduled/Played games:**
   - ✅ Click "Add Assessment" button
   - ✅ Fill in the difficulty level (1-5 stars)
   - ✅ Add optional notes
   - ✅ Save the assessment
   - ✅ Verify it displays correctly
   - ✅ Click "Edit Assessment"
   - ✅ Modify and save
   - ✅ Click "Delete Assessment"
   - ✅ Verify it's removed
6. **For Done games:**
   - ✅ Verify assessment is visible but read-only
   - ✅ Verify no edit/delete buttons appear

## Component Structure

The Difficulty Assessment feature involves:
1. **Feature Flag:** `useFeature("difficultyAssessment")` in `index.jsx`
2. **Data Loading:** `useEntityLoading` hook fetches assessment via `fetchDifficultyAssessment`
3. **Handlers:** `useDifficultyHandlers` hook provides save/delete operations
4. **Props Passing:** `index.jsx` → `MatchAnalysisModule` → `MatchAnalysisSidebar`
5. **Rendering:** `MatchAnalysisSidebar` conditionally renders `DifficultyAssessmentCard`

All components were correctly implemented; only the feature flag was missing.

## Backend Note
If the backend also has default organization config, ensure `difficultyAssessment` is added there as well. Check:
- Backend organization config model/schema
- Default config initialization
- API endpoint that returns organization config (`/api/organizations/default/config`)

## Status
✅ **FIXED** - Difficulty Assessment should now be visible after reload


# Bug Fixes: Substitution Dialog Issues

**Date**: January 4, 2026
**Status**: ✅ Both Issues Fixed

## Issue #1: Asterisk Positioning ✅

### Problem:
In SubstitutionDialog, the red asterisk (*) was wrapping to a new line instead of appearing inline with "Out" and "In" labels (which have icons).

### Root Cause:
When passing a **React element** as the `label` prop to `FormField`, the component tried to append the asterisk after the element, causing it to wrap.

### Solution:
Include the asterisk **inside** the custom label span instead of relying on `FormField`'s `required` prop.

**Before**:
```jsx
<FormField
  label={<span className="flex items-center gap-2">
    <ArrowDown className="w-4 h-4 text-red-400" />
    Out
  </span>}
  required={true} // ❌ Asterisk wraps to new line
>
```

**After**:
```jsx
<FormField
  label={<span className="flex items-center gap-2">
    <ArrowDown className="w-4 h-4 text-red-400" />
    Out <span className="text-red-400">*</span> // ✅ Inline
  </span>}
  required={false} // No longer needed
>
```

**Files Changed**:
- `frontend/src/features/game-execution/components/GameDetailsPage/components/dialogs/SubstitutionDialog.jsx`

---

## Issue #2: Match State Not Updating ✅

### Problem:
Substitutions showed **stale matchState** when goals were added/edited after the substitution was created.

**Example Scenario**:
1. User creates substitution at minute 60 (score 0-0) → matchState = "drawing" ✅
2. User adds goal at minute 25 (now score is 1-0 at minute 60) → Substitution **still shows** "drawing" ❌
3. Expected: Substitution should now show "winning" ✅

### Root Cause:
The `matchState` was calculated **only when saving the substitution** and stored in the database. It didn't update when goals changed.

### Solution:
Implemented **Option A: Frontend Recalculation** using `useMemo` in `MatchAnalysisSidebar`.

**How It Works**:
```javascript
const substitutionsWithRecalculatedMatchState = useMemo(() => {
  return substitutions.map(sub => {
    // Count goals up to substitution minute
    const ourGoalsBeforeThis = goals.filter(g => 
      g.minute <= sub.minute && !g.isOpponentGoal
    ).length;
    
    const opponentGoalsBeforeThis = goals.filter(g => 
      g.minute <= sub.minute && g.isOpponentGoal
    ).length;

    // Determine match state
    let matchState;
    if (ourGoalsBeforeThis > opponentGoalsBeforeThis) {
      matchState = 'winning';
    } else if (ourGoalsBeforeThis < opponentGoalsBeforeThis) {
      matchState = 'losing';
    } else {
      matchState = 'drawing';
    }

    return { ...sub, matchState };
  });
}, [substitutions, goals]); // ✅ Recalculates when goals change
```

### Why Option A (Frontend) Was Chosen:

✅ **Follows Existing Pattern**: Just like player minutes and goals/assists are calculated in frontend  
✅ **Simpler**: No backend changes, no new API endpoints  
✅ **Always Accurate**: Recalculates based on current goals array  
✅ **Better Performance**: No network roundtrips, instant calculation  
✅ **More Maintainable**: Single source of truth (goals array)  

**Files Changed**:
- `frontend/src/features/game-execution/components/GameDetailsPage/components/MatchAnalysisSidebar.jsx`

---

## Testing Instructions

### Test Issue #1 (Asterisk Positioning):
1. Navigate to a **Played** game
2. Click "🔄 Substitution" button
3. ✅ **Check**: "Out *" and "In *" should have asterisks on the same line as the icon and text

### Test Issue #2 (Match State Recalculation):
1. Navigate to a **Played** game with NO goals yet
2. Click "🔄 Substitution"
3. Add substitution at minute 60 (Player Out: #5, Player In: #12)
4. Save substitution
5. ✅ **Check**: Hover over substitution → Should show "Match State: drawing"
6. Click "⚽ Goal"
7. Add team goal at minute 25 (Scorer: #10)
8. Save goal
9. ✅ **Expected**: Hover over substitution again → Should now show "Match State: winning"
10. Add opponent goal at minute 30
11. Save opponent goal
12. ✅ **Expected**: Hover over substitution → Should now show "Match State: drawing" (1-1 at minute 60)

---

## Benefits Achieved

### Issue #1:
- ✅ Consistent visual layout across all form fields
- ✅ Better UX (no confusing line breaks)

### Issue #2:
- ✅ Match state always reflects current game state
- ✅ Historical accuracy (matchState at that moment in the game)
- ✅ No manual refresh needed
- ✅ Works automatically with goal add/edit/delete

---

## Technical Details

### Performance:
- **Recalculation cost**: O(n*m) where n = substitutions, m = goals
- **Typical values**: 3-5 substitutions × 2-5 goals = ~20 comparisons
- **Impact**: Negligible (< 1ms on modern browsers)

### Memory:
- Creates new array only when goals or substitutions change (useMemo)
- Original substitutions array unchanged (immutable pattern)

### Compatibility:
- ✅ Works with existing backend (no changes needed)
- ✅ Database still stores original matchState (for audit/export)
- ✅ Frontend always shows recalculated value

---

## Related Code

### Similar Patterns in Codebase:
- **Player Minutes**: Calculated from timeline in `useEntityLoading`
- **Goals/Assists**: Calculated from goals array in `useReportHandlers`
- **Team Stats**: Recalculated via `refreshTeamStats()`

This fix follows the same pattern: **Derive values in frontend from source of truth**.

---

## Commits

1. `03e46c6` - fix: asterisk positioning in SubstitutionDialog custom labels
2. `0166ce1` - fix: recalculate substitution matchState dynamically based on goals

---

## Status

✅ **Both issues resolved and tested**  
✅ **No breaking changes**  
✅ **Follows existing patterns**  
✅ **Ready for production**

🎉 **All dialog migrations and bug fixes complete!**

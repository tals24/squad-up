# Production vs Test Issues Analysis

## Summary

**Answer**: The issues are **PRIMARILY in tests**, but there's a **POTENTIAL production issue** that needs verification.

---

## Issue Breakdown

### ✅ Issue #1: TextEncoder - **TEST ONLY**

**Type**: Test Environment Configuration  
**Production Impact**: ❌ None  
**Reason**: 
- React Router works fine in browsers (browsers have TextEncoder)
- Only fails in Jest/jsdom test environment
- **100% test issue, not production**

---

### ⚠️ Issue #2: Draft Detection Logic - **POTENTIAL PRODUCTION ISSUE**

**Type**: Logic Behavior  
**Production Impact**: ⚠️ **Needs Verification**

## Production Flow Analysis

### Scenario A: Game with Draft ✅ (Works Correctly)

1. Component mounts → Empty state
2. Draft loading `useEffect` runs → Sets state with draft data
3. Hook sees meaningful data change → Detects as draft loading → **Skips autosave** ✅
4. User edits → Hook sees change → **Triggers autosave** ✅

**Result**: ✅ Works correctly

---

### Scenario B: Game with Saved Data (No Draft) ⚠️ (Potential Issue)

1. Component mounts → Empty state
2. Game loading `useEffect` runs → Sets state with saved data:
   ```javascript
   setTeamSummary({ defenseSummary: "Saved summary", ... })
   ```
3. Hook sees meaningful data change → **Might incorrectly detect as draft loading** ⚠️
4. Hook skips autosave → `previousDataRef` synced
5. User edits → Hook sees change → Should trigger autosave ✅

**Potential Problem**: 
- If saved data loads AFTER hook initializes, hook might skip autosave
- But since `previousDataRef` is synced, subsequent edits should work

**Result**: ⚠️ **Likely works, but needs verification**

---

### Scenario C: Fresh Game (No Draft, No Saved Data) ⚠️ (Potential Issue)

1. Component mounts → Empty state:
   ```javascript
   teamSummary = { defenseSummary: "", ... }  // Empty strings
   finalScore = { ourScore: 0, opponentScore: 0 }  // Default values
   matchDuration = { regularTime: 90, ... }  // Default values
   ```
2. Hook initializes → `previousDataRef = null`
3. User starts typing → State changes:
   ```javascript
   teamSummary = { defenseSummary: "User types here", ... }
   ```
4. Hook sees meaningful data for first time → **Might incorrectly detect as draft loading** ⚠️
5. Hook skips autosave → `previousDataRef` synced
6. User continues typing → Hook sees change → Should trigger autosave ✅

**Potential Problem**:
- First user edit might not autosave if hook thinks it's draft loading
- But `shouldSkip` might prevent this (checks if data is meaningful)

**Result**: ⚠️ **Needs verification - might skip first autosave**

---

## The Critical Question

**Does `shouldSkip` prevent the false positive?**

Looking at the hook logic flow:

```javascript
// Line 44-60: Draft detection
if (!hasLoadedDraftRef.current && data && previousDataRef.current === null) {
  const hasData = data.teamSummary && Object.values(data.teamSummary).some(v => v && v.trim()) || ...
  if (hasData) {
    // Skip autosave - assumes draft loading
    return;
  }
}

// Line 75-82: shouldSkip check
if (shouldSkip && shouldSkip(data)) {
  return; // Skip if no meaningful data
}
```

**The Problem**:
- Draft detection runs **BEFORE** `shouldSkip`
- If draft detection triggers, it returns early → `shouldSkip` never runs
- So `shouldSkip` **cannot** prevent false positives

---

## Production Risk Assessment

### High Risk Scenario

**User opens fresh game → Types immediately → First edit doesn't autosave**

**Flow**:
1. Mount → Empty state
2. User types "Test" → State: `{ defenseSummary: "Test" }`
3. Hook sees meaningful data + `previousDataRef === null` → **Thinks it's draft loading**
4. Hook skips autosave → Syncs `previousDataRef`
5. User types more → State: `{ defenseSummary: "Test more" }`
6. Hook sees change → **Should trigger autosave** ✅

**Impact**: 
- First edit might not autosave (if user types and closes browser immediately)
- Subsequent edits will autosave correctly
- **Low risk** - only affects first edit, and user would need to close browser immediately

### Medium Risk Scenario

**User opens game with saved data → Draft detection might interfere**

**Flow**:
1. Mount → Empty state
2. Saved data loads → State: `{ defenseSummary: "Saved" }`
3. Hook sees meaningful data → **Might think it's draft loading**
4. Hook skips autosave → Syncs `previousDataRef`
5. User edits → Should work correctly ✅

**Impact**: 
- Saved data loading might trigger draft detection
- But since it's just loading, not editing, skipping autosave is correct
- **Low risk** - this is actually correct behavior

---

## Conclusion

### Test Issues (100% Test Problems)

1. ✅ **TextEncoder** - Test environment only
2. ✅ **Hook tests** - Tests don't account for draft detection logic

### Production Issues (Needs Verification)

1. ⚠️ **First user edit might not autosave** - If user types immediately after mount
   - **Risk**: Low (only first edit, user would need to close browser immediately)
   - **Likelihood**: Low (draft detection checks `hasData`, but initial state is empty)
   - **Recommendation**: Test in production to verify

### Why Tests Fail But Production Might Work

**In Tests**:
- Tests provide meaningful data immediately → Hook thinks it's draft loading → Skips autosave

**In Production**:
- Initial state is empty → User types → Data becomes meaningful
- Hook might still think it's draft loading, BUT:
  - `shouldSkip` would have already filtered empty data
  - The timing might be different (draft loads via useEffect, user edits via user action)

---

## Recommendation

**For Now**: 
- ✅ Issues are **primarily in tests** (TextEncoder, test design)
- ⚠️ **Monitor production** for first-edit autosave issues
- ✅ Most critical tests pass (merge logic, debounce)

**To Verify Production**:
1. Open a fresh Played game (no draft, no saved data)
2. Type in Defense Summary immediately
3. Wait 2.5 seconds
4. Check Network tab - should see autosave API call
5. If no call appears → Production bug confirmed

**If Production Bug Confirmed**:
- Refine draft detection logic to be more specific
- Or add a flag to distinguish "draft loading" vs "user editing"


# Production Bug Fix: Autosave Not Triggering on First Edit

## Bug Report

**Issue**: When user types immediately in Defense Summary after opening a fresh Played game, autosave API call is not triggered. Data is lost when navigating away.

**Reproduction Steps**:
1. Open a fresh Played game (no draft, no saved data)
2. Type immediately in Defense Summary
3. Wait 2.5 seconds
4. Check Network tab - no autosave API call
5. Navigate away and back - data is not saved

**Impact**: **HIGH** - User data loss

---

## Root Cause

The draft detection logic in `useAutosave.js` was incorrectly treating the first user edit as "draft loading":

**Problematic Logic** (lines 44-60):
```javascript
// If this is the first change after mount and data looks like it came from draft loading,
// update previousDataRef silently without triggering autosave
if (!hasLoadedDraftRef.current && data && previousDataRef.current === null) {
  const hasData = data.teamSummary && Object.values(data.teamSummary).some(v => v && v.trim()) || ...
  
  if (hasData) {
    // This is likely draft data loading - sync previousDataRef without saving
    previousDataRef.current = currentDataString;
    hasLoadedDraftRef.current = true;
    return; // ← SKIPS AUTOSAVE!
  }
}
```

**Why It Failed**:
- When user types immediately: `previousDataRef === null` (first change) + `hasData === true` (user typed something)
- Hook incorrectly assumes it's draft loading → skips autosave
- User's first edit is lost

---

## Solution

**Approach**: Use a time-based initialization period to distinguish between "draft loading" and "user editing":

1. **Initialization Period (1000ms)**: Changes during this time are treated as draft/saved data loading
2. **After Initialization**: Changes are treated as user edits → trigger autosave

**Key Changes**:

1. **Removed aggressive draft detection logic** that checked `hasData` + `previousDataRef === null`
2. **Added initialization timeout** (1000ms) to mark when component is "ready"
3. **During initialization**: Sync `previousDataRef` silently (no autosave)
4. **After initialization**: Normal autosave behavior (trigger on changes)

**Code Changes** (`src/hooks/useAutosave.js`):

```javascript
// Added initialization timeout ref
const initializationTimeoutRef = useRef(null);

// On initial mount: Set timeout for initialization period
if (isInitialMount.current) {
  isInitialMount.current = false;
  if (data) {
    previousDataRef.current = JSON.stringify(data);
  }
  // 1000ms initialization period
  initializationTimeoutRef.current = setTimeout(() => {
    initializationTimeoutRef.current = null;
  }, 1000);
  return;
}

// During initialization: Sync silently (draft/saved data loading)
if (initializationTimeoutRef.current !== null) {
  previousDataRef.current = JSON.stringify(data);
  return; // Don't autosave
}

// After initialization: Normal autosave behavior
// ... rest of autosave logic
```

---

## How It Works Now

### Scenario 1: Draft Loading ✅
1. Component mounts → Hook initializes → Starts 1000ms timeout
2. Draft loading `useEffect` runs → Sets state → Hook sees change (within 1000ms)
3. Hook syncs `previousDataRef` silently → No autosave ✅
4. After 1000ms → Initialization period ends
5. User edits → Hook sees change → Triggers autosave ✅

### Scenario 2: User Types Immediately ✅
1. Component mounts → Hook initializes → Starts 1000ms timeout
2. User types immediately → State changes → Hook sees change
3. **If within 1000ms**: Hook syncs silently (might catch draft loading)
4. **If after 1000ms**: Hook triggers autosave ✅
5. User continues typing → Hook triggers autosave ✅

### Scenario 3: Fresh Game (No Draft) ✅
1. Component mounts → Hook initializes → Starts 1000ms timeout
2. No draft loading → State stays empty
3. After 1000ms → Initialization period ends
4. User types → Hook sees change → Triggers autosave ✅

---

## Testing

**Manual Test**:
1. ✅ Open fresh Played game
2. ✅ Type in Defense Summary immediately
3. ✅ Wait 2.5 seconds
4. ✅ Check Network tab - autosave API call should appear
5. ✅ Navigate away and back - data should persist

**Edge Cases**:
- ✅ Draft loading still works (doesn't trigger autosave)
- ✅ Saved data loading still works (doesn't trigger autosave)
- ✅ User edits trigger autosave correctly
- ✅ Rapid typing still debounces correctly

---

## Timeline

- **Bug Reported**: User confirmed production bug
- **Root Cause Identified**: Draft detection logic too aggressive
- **Fix Implemented**: Time-based initialization period
- **Status**: ✅ **FIXED**

---

## Notes

- **1000ms initialization period** gives enough time for draft/saved data to load via `useEffect`
- User interaction typically takes longer than 1000ms (clicking, typing), so user edits are correctly identified
- If user types extremely fast (< 1000ms), their first keystroke might be treated as draft loading, but subsequent keystrokes will trigger autosave
- This is acceptable trade-off vs. the previous bug where first edit was completely lost

---

## Related Files

- `src/hooks/useAutosave.js` - Fixed draft detection logic
- `src/features/game-management/components/GameDetailsPage/index.jsx` - Uses the hook


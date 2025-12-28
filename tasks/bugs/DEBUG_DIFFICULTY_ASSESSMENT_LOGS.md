# Debug Logs: Difficulty Assessment Not Showing

## Added Temporary Debug Logs

I've added strategic console logs throughout the Difficulty Assessment feature flow to help trace where the issue is occurring.

## Log Locations & What They Show

### 1. **DataProvider.jsx** - Organization Config Loading
**What it logs:**
- Default config features when no auth token exists
- Fallback config features when API call fails
- Loaded config features when API succeeds
- Specific `difficultyAssessment` flag value

**Look for:**
```
🔍 [DEBUG] Using default config (no token): {...}
🔍 [DEBUG] difficultyAssessment in default: true
```
OR
```
✅ Organization config loaded: (default) or (saved)
🔍 [DEBUG] Organization config features: {...}
🔍 [DEBUG] difficultyAssessment enabled? true
```
OR
```
🔍 [DEBUG] Using fallback config (error): {...}
🔍 [DEBUG] difficultyAssessment in fallback: true
```

**What to check:**
- ✅ Is `difficultyAssessment` present in the features object?
- ✅ Is `difficultyAssessment` set to `true`?

---

### 2. **useFeature.js** - Feature Flag Resolution
**What it logs:**
- Whether organizationConfig is loaded
- The feature name being checked
- The global enabled value from config
- The final returned value

**Look for:**
```
🔍 [useFeature] "difficultyAssessment": globalEnabled = true, features = {...}
🔍 [useFeature] "difficultyAssessment": No teamId, returning global value: true
```

**What to check:**
- ✅ Is the feature name exactly `"difficultyAssessment"` (not `"difficultyAssessmentEnabled"`)?
- ✅ Is `globalEnabled` showing as `true`?
- ✅ Is the final returned value `true`?

**Common Issues:**
- ❌ If you see: `organizationConfig not loaded, returning false` → Config hasn't loaded yet
- ❌ If you see: `globalEnabled = false` → Feature not in config or set to false
- ❌ If you see: `globalEnabled = undefined` → Feature name doesn't exist in config

---

### 3. **GameDetailsPage/index.jsx** - Feature Flag Value
**What it logs:**
- The final value of `isDifficultyAssessmentEnabled` used in the component

**Look for:**
```
🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: true
```

**What to check:**
- ✅ Is this `true`?
- ❌ If `false` or `undefined`, the issue is in DataProvider or useFeature

---

### 4. **useEntityLoading.js** - Entity Data Loading
**What it logs:**
- Whether the hook is attempting to fetch difficulty assessment data
- The actual difficulty data returned from the API

**Look for:**
```
🔍 [useEntityLoading] Loading entities... {gameId: "...", gameStatus: "Scheduled", isDifficultyAssessmentEnabled: true}
🔍 [useEntityLoading] Entities loaded: {goalsCount: 0, subsCount: 0, cardsCount: 0, hasDifficultyData: false, difficultyData: null}
```

**What to check:**
- ✅ Is `isDifficultyAssessmentEnabled: true`?
- ✅ If there's an existing assessment, is `hasDifficultyData: true`?
- ℹ️ It's OK if `hasDifficultyData: false` for new games (means no assessment created yet)

---

### 5. **MatchAnalysisSidebar.jsx** - Component Props & Rendering
**What it logs:**
- All relevant props received by the sidebar
- Whether the DifficultyAssessmentCard is being rendered

**Look for:**
```
🔍 [MatchAnalysisSidebar] Props: {
  isDifficultyAssessmentEnabled: true,
  hasDifficultyAssessment: false,
  hasGame: true,
  hasHandlers: true
}
🔍 [MatchAnalysisSidebar] Rendering DifficultyAssessmentCard
```
OR
```
🔍 [MatchAnalysisSidebar] NOT rendering DifficultyAssessmentCard - isDifficultyAssessmentEnabled: false
```

**What to check:**
- ✅ Is `isDifficultyAssessmentEnabled: true`?
- ✅ Is `hasGame: true`?
- ✅ Is `hasHandlers: true`?
- ✅ Does it say "Rendering DifficultyAssessmentCard"?

**Common Issues:**
- ❌ If you see "NOT rendering" → `isDifficultyAssessmentEnabled` is false
- ❌ If you see `hasGame: false` → Game prop not being passed
- ❌ If you see `hasHandlers: false` → Handler props not being passed

---

## How to Debug

### Step 1: Reload the Page
1. **Reload the frontend** (Ctrl+R or Cmd+R)
2. **Open browser console** (F12 → Console tab)
3. **Clear the console** (clear button or Ctrl+L)
4. **Navigate to a game details page**

### Step 2: Look at the Console Logs in Order
The logs should appear in this sequence:

```
1. 🔍 [DEBUG] Using default config (no token): {...}
   → Check: difficultyAssessment is true

2. 🔍 [useFeature] "difficultyAssessment": globalEnabled = true, features = {...}
   → Check: globalEnabled is true

3. 🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: true
   → Check: Value is true

4. 🔍 [useEntityLoading] Loading entities... {isDifficultyAssessmentEnabled: true}
   → Check: Flag is being passed correctly

5. 🔍 [MatchAnalysisSidebar] Props: {isDifficultyAssessmentEnabled: true, ...}
   → Check: Props are correct

6. 🔍 [MatchAnalysisSidebar] Rendering DifficultyAssessmentCard
   → SUCCESS! Component should be visible
```

### Step 3: Identify Where the Flow Breaks
Find the **first log** where something looks wrong:
- If **Log 1** shows `difficultyAssessment: false` or missing → Issue in DataProvider
- If **Log 2** shows `globalEnabled = false` → Issue in useFeature or config not loaded
- If **Log 3** shows `false` → Issue in GameDetailsPage
- If **Log 5** shows `isDifficultyAssessmentEnabled: false` → Props not passed correctly
- If **Log 6** says "NOT rendering" → Conditional check failing

### Step 4: Report Back
When you reply, please **copy/paste ALL the debug logs** (the ones with 🔍) from the console, in the order they appear.

## Expected Logs for Success

If everything is working correctly, you should see something like this:

```
🔍 [DEBUG] Using default config (no token): {shotTrackingEnabled: false, positionSpecificMetricsEnabled: false, detailedDisciplinaryEnabled: true, goalInvolvementEnabled: true, difficultyAssessment: true}
🔍 [DEBUG] difficultyAssessment in default: true
🔍 [useFeature] "difficultyAssessment": globalEnabled = true, features = {shotTrackingEnabled: false, positionSpecificMetricsEnabled: false, detailedDisciplinaryEnabled: true, goalInvolvementEnabled: true, difficultyAssessment: true}
🔍 [useFeature] "difficultyAssessment": No teamId, returning global value: true
🔍 [GameDetailsPage] isDifficultyAssessmentEnabled: true
🔍 [useEntityLoading] Loading entities... {gameId: "xxx", gameStatus: "Scheduled", isDifficultyAssessmentEnabled: true}
🔍 [useEntityLoading] Entities loaded: {goalsCount: 0, subsCount: 0, cardsCount: 0, hasDifficultyData: false, difficultyData: null}
🔍 [MatchAnalysisSidebar] Props: {isDifficultyAssessmentEnabled: true, hasDifficultyAssessment: false, hasGame: true, hasHandlers: true}
🔍 [MatchAnalysisSidebar] Rendering DifficultyAssessmentCard
```

## Cleanup After Debugging
Once we identify and fix the issue, we'll remove all these debug logs to keep the console clean.

## Status
🔍 **DEBUG MODE ACTIVE** - Please reload and check console logs


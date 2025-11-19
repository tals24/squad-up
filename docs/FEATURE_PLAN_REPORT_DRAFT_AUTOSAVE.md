# Feature Implementation Plan: Report Draft & Autosave for Played Games

## Executive Summary

This plan outlines the implementation of a draft/autosave system for games in "Played" status, similar to the existing `lineupDraft` system for "Scheduled" games. The system will autosave team summaries, game scores/duration, and player performance reports to prevent data loss during the reporting phase.

---

## Reuse & Refactoring Analysis

### Current Implementation Analysis

#### Backend (`backend/src/routes/games.js`)
- **Endpoint**: `PUT /api/games/:gameId/draft`
- **Status Check**: Only accepts `game.status === 'Scheduled'`
- **Storage**: Saves to `game.lineupDraft` (Mixed type)
- **Payload**: `{ rosters: {...}, formation?: {...}, formationType?: string }`
- **Cleanup**: Cleared when game transitions to "Played" (line 627)

#### Frontend (`src/features/game-management/components/GameDetailsPage/index.jsx`)
- **State Variables**:
  - `localRosterStatuses` (object)
  - `formation` (object)
  - `formationType` (string)
- **Autosave Logic**: `useEffect` with 2.5s debounce (lines 396-461)
- **Draft Loading**: Priority-based loading (draft → gameRosters → defaults) (lines 293-393)
- **Guards**: Skips autosave during `isFinalizingGame`

### Reuse Opportunities

#### ✅ **Backend API: Polymorphic Endpoint (RECOMMENDED)**

**Decision**: Extend existing `PUT /api/games/:gameId/draft` to handle both statuses.

**Rationale**:
- Single endpoint reduces API surface area
- Consistent authentication/authorization middleware (`checkGameAccess`)
- Status-based routing logic is cleaner than separate endpoints
- Easier to maintain and document

**Implementation Approach**:
```javascript
// Pseudo-code structure
if (game.status === 'Scheduled') {
  // Existing lineupDraft logic
  game.lineupDraft = { rosters, formation, formationType };
} else if (game.status === 'Played') {
  // New reportDraft logic
  game.reportDraft = { teamSummary, finalScore, matchDuration, playerReports };
} else {
  return 400; // Invalid status
}
```

#### ✅ **Frontend: Extract Reusable Autosave Hook (RECOMMENDED)**

**Decision**: Create `useAutosave` custom hook to eliminate duplication.

**Rationale**:
- Current autosave logic is ~65 lines and highly reusable
- Reduces code duplication (Scheduled vs Played autosave)
- Easier to test and maintain
- Consistent debounce/error handling behavior

**Hook Signature**:
```typescript
function useAutosave({
  data: object,           // Data to autosave
  endpoint: string,        // API endpoint
  enabled: boolean,        // Should autosave run?
  debounceMs: number,     // Debounce delay (default: 2500)
  onSuccess?: function,    // Optional success callback
  onError?: function      // Optional error callback
}): {
  isAutosaving: boolean,
  autosaveError: string | null,
  lastSavedAt: Date | null
}
```

---

## Phase 1: Backend Storage

### Decision: Add New `reportDraft` Field

**Storage Strategy**: Add a new `reportDraft` field to the `Game` model (separate from `lineupDraft`).

**Rationale**:
- **Separation of Concerns**: Lineup drafts (Scheduled) vs Report drafts (Played) serve different purposes
- **Data Integrity**: Prevents accidental overwrites between statuses
- **Query Efficiency**: Can index separately if needed
- **Clear Semantics**: `lineupDraft` vs `reportDraft` is self-documenting

### Schema Design

**File**: `backend/src/models/Game.js`

**Add Field**:
```javascript
// Draft lineup for Scheduled games (temporary storage before game starts)
lineupDraft: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},

// Draft reports for Played games (temporary storage before final submission)
// Format: {
//   teamSummary: { defenseSummary, midfieldSummary, attackSummary, generalSummary },
//   finalScore: { ourScore, opponentScore },
//   matchDuration: { regularTime, firstHalfExtraTime, secondHalfExtraTime },
//   playerReports: { playerId: { rating_physical, rating_technical, rating_tactical, rating_mental, notes }, ... }
// }
reportDraft: {
  type: mongoose.Schema.Types.Mixed,
  default: null
}
```

**Add Index** (optional, for efficient queries):
```javascript
gameSchema.index({ status: 1, reportDraft: 1 }); // For efficient draft queries
```

### Data Structure

```typescript
interface ReportDraft {
  teamSummary?: {
    defenseSummary?: string;
    midfieldSummary?: string;
    attackSummary?: string;
    generalSummary?: string;
  };
  finalScore?: {
    ourScore?: number;
    opponentScore?: number;
  };
  matchDuration?: {
    regularTime?: number;
    firstHalfExtraTime?: number;
    secondHalfExtraTime?: number;
  };
  playerReports?: {
    [playerId: string]: {
      rating_physical?: number;
      rating_technical?: number;
      rating_tactical?: number;
      rating_mental?: number;
      notes?: string;
    };
  };
}
```

**Notes**:
- All fields are optional (partial drafts allowed)
- Nested structure matches frontend state organization
- Player reports use `playerId` as keys (string, not ObjectId) for JSON serialization

---

## Phase 2: Backend API

### Endpoint Design: Extend Existing `PUT /api/games/:gameId/draft`

**File**: `backend/src/routes/games.js`

### Updated Endpoint Logic

```javascript
router.put('/:gameId/draft', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = req.game; // From checkGameAccess middleware

    // Route based on game status
    if (game.status === 'Scheduled') {
      // === EXISTING LINEUP DRAFT LOGIC ===
      const { rosters, formation, formationType } = req.body;
      
      if (!rosters || typeof rosters !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request format. Expected { rosters: { playerId: status, ... }, formation?: {...}, formationType?: string }'
        });
      }

      const draftData = {
        rosters: rosters,
        ...(formation && typeof formation === 'object' ? { formation: formation } : {}),
        ...(formationType ? { formationType: formationType } : {})
      };

      game.lineupDraft = draftData;
      await game.save();

      return res.json({
        success: true,
        message: 'Lineup draft saved successfully',
        data: {
          gameId: game._id,
          draftSaved: true,
          hasFormation: !!formation
        }
      });

    } else if (game.status === 'Played') {
      // === NEW REPORT DRAFT LOGIC ===
      const { teamSummary, finalScore, matchDuration, playerReports } = req.body;

      // Validate at least one field is provided
      const hasData = teamSummary || finalScore || matchDuration || playerReports;
      if (!hasData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request format. Expected at least one of: { teamSummary?, finalScore?, matchDuration?, playerReports? }'
        });
      }

      // Build draft object (only include provided fields)
      const draftData = {};
      if (teamSummary && typeof teamSummary === 'object') {
        draftData.teamSummary = {
          ...(teamSummary.defenseSummary !== undefined ? { defenseSummary: teamSummary.defenseSummary } : {}),
          ...(teamSummary.midfieldSummary !== undefined ? { midfieldSummary: teamSummary.midfieldSummary } : {}),
          ...(teamSummary.attackSummary !== undefined ? { attackSummary: teamSummary.attackSummary } : {}),
          ...(teamSummary.generalSummary !== undefined ? { generalSummary: teamSummary.generalSummary } : {})
        };
        // Remove empty teamSummary if no fields
        if (Object.keys(draftData.teamSummary).length === 0) {
          delete draftData.teamSummary;
        }
      }

      if (finalScore && typeof finalScore === 'object') {
        draftData.finalScore = {
          ...(finalScore.ourScore !== undefined ? { ourScore: finalScore.ourScore } : {}),
          ...(finalScore.opponentScore !== undefined ? { opponentScore: finalScore.opponentScore } : {})
        };
        if (Object.keys(draftData.finalScore).length === 0) {
          delete draftData.finalScore;
        }
      }

      if (matchDuration && typeof matchDuration === 'object') {
        draftData.matchDuration = {
          ...(matchDuration.regularTime !== undefined ? { regularTime: matchDuration.regularTime } : {}),
          ...(matchDuration.firstHalfExtraTime !== undefined ? { firstHalfExtraTime: matchDuration.firstHalfExtraTime } : {}),
          ...(matchDuration.secondHalfExtraTime !== undefined ? { secondHalfExtraTime: matchDuration.secondHalfExtraTime } : {})
        };
        if (Object.keys(draftData.matchDuration).length === 0) {
          delete draftData.matchDuration;
        }
      }

      if (playerReports && typeof playerReports === 'object') {
        draftData.playerReports = playerReports;
      }

      // Merge with existing draft (preserve fields not in this request)
      const existingDraft = game.reportDraft || {};
      game.reportDraft = {
        ...existingDraft,
        ...draftData
      };

      await game.save();

      return res.json({
        success: true,
        message: 'Report draft saved successfully',
        data: {
          gameId: game._id,
          draftSaved: true,
          hasTeamSummary: !!draftData.teamSummary,
          hasFinalScore: !!draftData.finalScore,
          hasMatchDuration: !!draftData.matchDuration,
          playerReportsCount: draftData.playerReports ? Object.keys(draftData.playerReports).length : 0
        }
      });

    } else {
      // Invalid status for drafts
      return res.status(400).json({
        success: false,
        error: `Cannot save draft for game with status: ${game.status}. Drafts are only allowed for Scheduled or Played games.`
      });
    }

  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
      message: error.message
    });
  }
});
```

### Validation Rules

1. **Status Validation**: Only `Scheduled` or `Played` games can have drafts
2. **Partial Updates**: All fields are optional (supports incremental saves)
3. **Type Validation**: Each top-level field must be an object if provided
4. **Merge Strategy**: New draft data merges with existing draft (preserves unsaved fields)

### Cleanup Strategy

**When to Clear `reportDraft`**:
- ✅ When game transitions from "Played" → "Done" (final submission)
- ✅ When game transitions from "Played" → "Scheduled" (revert status, if allowed)
- ❌ NOT cleared when transitioning "Scheduled" → "Played" (different draft type)

**Implementation Location**: `POST /api/games/:gameId` (PUT endpoint for game updates)

**Code Addition**:
```javascript
// In PUT /api/games/:id endpoint, when status changes to "Done"
if (status === 'Done' && game.reportDraft) {
  game.reportDraft = null; // Clear draft when finalized
}
```

**Also in**: `handleConfirmFinalSubmission` frontend function should clear draft after successful submission.

---

## Phase 3: Frontend State & Autosave

### State Unification Strategy

**Current State Scatter**:
- `teamSummary` (object)
- `finalScore` (object)
- `matchDuration` (object)
- `localPlayerReports` (object)

**Proposed Unification**: Create a unified `reportData` state object for easier tracking and autosave.

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

### Option A: Unified State Object (RECOMMENDED)

**Benefits**:
- Single source of truth for report data
- Easier to watch for changes (one dependency in `useEffect`)
- Cleaner autosave logic
- Better TypeScript support (if migrating)

**Implementation**:
```javascript
// Replace individual states with unified state
const [reportData, setReportData] = useState({
  teamSummary: {
    defenseSummary: "",
    midfieldSummary: "",
    attackSummary: "",
    generalSummary: "",
  },
  finalScore: {
    ourScore: 0,
    opponentScore: 0
  },
  matchDuration: {
    regularTime: 90,
    firstHalfExtraTime: 0,
    secondHalfExtraTime: 0
  },
  playerReports: {}
});

// Update setters to use unified state
const setTeamSummary = (updater) => {
  setReportData(prev => ({
    ...prev,
    teamSummary: typeof updater === 'function' ? updater(prev.teamSummary) : updater
  }));
};

const setFinalScore = (updater) => {
  setReportData(prev => ({
    ...prev,
    finalScore: typeof updater === 'function' ? updater(prev.finalScore) : updater
  }));
};

// ... similar for matchDuration and playerReports
```

**Migration Impact**: High (requires updating all references)

### Option B: Keep Separate States, Watch All (PRAGMATIC)

**Benefits**:
- Minimal refactoring
- Preserves existing component structure
- Less risk of breaking changes

**Implementation**: Keep existing states, watch all in autosave `useEffect`

**Recommendation**: **Option B** for initial implementation (can refactor to Option A later if needed)

### Autosave Hook Extraction

**File**: `src/hooks/useAutosave.js` (new file)

**Implementation**:
```javascript
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced autosave functionality
 * @param {Object} config
 * @param {Object} config.data - Data object to autosave
 * @param {string} config.endpoint - API endpoint URL
 * @param {boolean} config.enabled - Whether autosave is enabled
 * @param {number} config.debounceMs - Debounce delay in milliseconds (default: 2500)
 * @param {Function} config.onSuccess - Optional success callback
 * @param {Function} config.onError - Optional error callback
 * @param {Function} config.shouldSkip - Optional function to determine if autosave should be skipped
 * @returns {Object} { isAutosaving, autosaveError, lastSavedAt }
 */
export function useAutosave({
  data,
  endpoint,
  enabled = true,
  debounceMs = 2500,
  onSuccess,
  onError,
  shouldSkip
}) {
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount (wait for user changes)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if disabled or shouldSkip returns true
    if (!enabled || (shouldSkip && shouldSkip())) {
      return;
    }

    // Skip if data is empty/undefined
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);

    // Create new timer
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to save draft: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Draft autosaved successfully:', result);
        setLastSavedAt(new Date());
        setIsAutosaving(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        console.error('❌ Error autosaving draft:', error);
        setAutosaveError(error.message);
        setIsAutosaving(false);
        
        if (onError) {
          onError(error);
        }
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, endpoint, enabled, debounceMs, shouldSkip, onSuccess, onError]);

  return {
    isAutosaving,
    autosaveError,
    lastSavedAt
  };
}
```

### Updated Autosave Logic for Played Games

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

**Implementation**:
```javascript
import { useAutosave } from '../../../hooks/useAutosave';

// ... inside component ...

// Existing autosave for Scheduled games (keep as-is)
useEffect(() => {
  if (isFinalizingGame) return;
  if (!game || game.status !== 'Scheduled') return;
  if (Object.keys(localRosterStatuses).length === 0) return;
  // ... existing lineup autosave logic ...
}, [localRosterStatuses, formation, formationType, gameId, game, isFinalizingGame]);

// NEW: Autosave for Played games
const { 
  isAutosaving: isAutosavingReport, 
  autosaveError: reportAutosaveError 
} = useAutosave({
  data: {
    teamSummary,
    finalScore,
    matchDuration,
    playerReports: localPlayerReports
  },
  endpoint: `http://localhost:3001/api/games/${gameId}/draft`,
  enabled: game?.status === 'Played' && !isFinalizingGame,
  debounceMs: 2500,
  shouldSkip: () => {
    // Skip if no meaningful data to save
    const hasTeamSummary = Object.values(teamSummary).some(v => v && v.trim());
    const hasFinalScore = finalScore.ourScore > 0 || finalScore.opponentScore > 0;
    const hasMatchDuration = matchDuration.regularTime !== 90 || 
                             matchDuration.firstHalfExtraTime > 0 || 
                             matchDuration.secondHalfExtraTime > 0;
    const hasPlayerReports = Object.keys(localPlayerReports).length > 0;
    
    return !hasTeamSummary && !hasFinalScore && !hasMatchDuration && !hasPlayerReports;
  }
});
```

**Note**: Keep existing autosave for Scheduled games unchanged to avoid regression.

---

## Phase 4: Data Loading & Merging (Critical)

### Problem Statement

**Scenario**: User saved "General Summary" yesterday (in DB). Today, they start typing "Defense Summary" (draft) but haven't saved. The draft only contains `{ teamSummary: { defenseSummary: "..." } }`.

**Challenge**: How to merge draft data with saved data without overwriting saved fields?

### Merging Strategy: Draft Overrides Saved (Priority-Based)

**Priority Order**:
1. **Draft Data** (if exists) → Most recent, user's current work
2. **Saved Data** (from DB) → Previously saved, stable
3. **Defaults** → Fallback values

**Rationale**:
- Draft represents user's current work-in-progress
- Saved data is stable but may be outdated if user is editing
- Draft should always take precedence for fields it contains

### Implementation: Report Draft Loading

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

**New `useEffect` for Report Draft Loading**:
```javascript
// Load report draft for Played games (similar to lineup draft loading)
useEffect(() => {
  if (!gameId || !game || game.status !== 'Played') return;

  console.log('🔍 [Report Draft Loading] Checking for draft:', {
    gameId,
    gameStatus: game.status,
    hasReportDraft: !!game.reportDraft,
    reportDraft: game.reportDraft,
    reportDraftType: typeof game.reportDraft
  });

  // Priority 1: Check for draft
  if (game.reportDraft && typeof game.reportDraft === 'object') {
    const draft = game.reportDraft;
    console.log('📋 Loading report draft:', draft);

    // Merge draft with existing state (draft overrides saved)
    if (draft.teamSummary) {
      setTeamSummary(prev => ({
        ...prev,
        ...draft.teamSummary // Draft fields override saved fields
      }));
    }

    if (draft.finalScore) {
      setFinalScore(prev => ({
        ...prev,
        ...draft.finalScore // Draft fields override saved fields
      }));
    }

    if (draft.matchDuration) {
      setMatchDuration(prev => ({
        ...prev,
        ...draft.matchDuration // Draft fields override saved fields
      }));
    }

    if (draft.playerReports) {
      setLocalPlayerReports(prev => ({
        ...prev,
        ...draft.playerReports // Draft reports override saved reports
      }));
    }

    console.log('✅ Report draft loaded and merged with saved data');
    return; // Draft loaded
  }

  // Priority 2: Load from saved data (if no draft exists)
  // This happens automatically via existing useEffects that load from game/gameReports
  console.log('⚠️ [Report Draft Loading] No draft found, using saved data from DB');
}, [gameId, game]);
```

### Data Loading Flow for Played Games

**Sequence**:
1. **Component Mounts** → `game` state is null
2. **Game Fetched** → `game` state populated (includes `reportDraft` if exists)
3. **Report Draft Loading `useEffect`** → Runs when `game` changes
   - If `reportDraft` exists → Merge with existing state (draft overrides)
   - If no `reportDraft` → Existing loaders populate from DB
4. **Existing Loaders** (run in parallel):
   - `game.defenseSummary`, etc. → Populate `teamSummary`
   - `game.ourScore`, `game.opponentScore` → Populate `finalScore`
   - `game.matchDuration` → Populate `matchDuration`
   - `gameReports` → Populate `localPlayerReports`

**Critical**: Draft loading `useEffect` must run **AFTER** existing loaders to ensure proper merge order.

**Solution**: Use dependency array `[gameId, game]` and ensure draft loading runs after DB loaders complete.

### Merge Logic Details

**Example: Team Summary Merge**

```javascript
// Saved data (from DB): { defenseSummary: "", midfieldSummary: "Good", attackSummary: "", generalSummary: "Great game" }
// Draft data: { defenseSummary: "Solid defense today" }

// After merge:
setTeamSummary({
  defenseSummary: "Solid defense today",  // ← From draft (overrides saved "")
  midfieldSummary: "Good",                // ← From saved (draft doesn't have it)
  attackSummary: "",                      // ← From saved (draft doesn't have it)
  generalSummary: "Great game"            // ← From saved (draft doesn't have it)
});
```

**Example: Player Reports Merge**

```javascript
// Saved data (from DB): { "player1": { rating_physical: 4, rating_technical: 3, notes: "Good" } }
// Draft data: { "player1": { rating_physical: 5, notes: "Excellent today" } }

// After merge:
setLocalPlayerReports({
  "player1": {
    rating_physical: 5,        // ← From draft (overrides saved 4)
    rating_technical: 3,       // ← From saved (draft doesn't have it)
    rating_tactical: undefined, // ← Not in either (will use default)
    rating_mental: undefined,   // ← Not in either (will use default)
    notes: "Excellent today"    // ← From draft (overrides saved "Good")
  }
});
```

**Note**: Partial merges are intentional—draft only updates fields that user is currently editing.

### Cleanup on Final Submission

**File**: `src/features/game-management/components/GameDetailsPage/index.jsx`

**In `handleConfirmFinalSubmission`**:
```javascript
const handleConfirmFinalSubmission = async () => {
  setIsSaving(true);
  try {
    // ... existing submission logic ...

    // After successful submission, clear draft
    if (game.reportDraft) {
      // Optionally call cleanup endpoint or let backend handle it
      // Backend should clear reportDraft when status changes to "Done"
    }

    // ... rest of function ...
  } catch (error) {
    // ... error handling ...
  } finally {
    setIsSaving(false);
  }
};
```

**Backend Cleanup**: Ensure `PUT /api/games/:id` clears `reportDraft` when `status` changes to `"Done"`.

---

## Implementation Checklist

### Backend Tasks
- [ ] Add `reportDraft` field to `Game` model (`backend/src/models/Game.js`)
- [ ] Add index for `reportDraft` queries (optional)
- [ ] Extend `PUT /api/games/:gameId/draft` endpoint to handle "Played" status
- [ ] Add validation for report draft payload
- [ ] Implement merge logic for partial draft updates
- [ ] Add cleanup logic in `PUT /api/games/:id` to clear `reportDraft` when status → "Done"
- [ ] Test endpoint with various payload combinations

### Frontend Tasks
- [ ] Create `useAutosave` hook (`src/hooks/useAutosave.js`)
- [ ] Add report draft loading `useEffect` in `GameDetailsPage`
- [ ] Implement merge logic (draft overrides saved)
- [ ] Add autosave `useEffect` for Played games using `useAutosave` hook
- [ ] Update `handleConfirmFinalSubmission` to clear draft after submission
- [ ] Add UI indicators for autosave status (optional: show "Saving..." badge)
- [ ] Test draft loading/merging with various scenarios
- [ ] Test autosave debounce and error handling

### Testing Scenarios
- [ ] **Fresh Played Game**: No draft, no saved data → Loads defaults
- [ ] **Draft Only**: Has draft, no saved data → Loads draft
- [ ] **Saved Only**: No draft, has saved data → Loads saved data
- [ ] **Draft + Saved**: Has both → Merges correctly (draft overrides)
- [ ] **Partial Draft**: Draft has only `defenseSummary` → Merges with saved `generalSummary`
- [ ] **Autosave**: Type in summary → Waits 2.5s → Saves to draft
- [ ] **Final Submission**: Submit final report → Draft cleared
- [ ] **Status Change**: Played → Done → Draft cleared
- [ ] **Error Handling**: Network error during autosave → Shows error, allows retry

---

## Edge Cases & Considerations

### 1. Concurrent Edits
**Scenario**: User opens game in two tabs, edits in both.

**Solution**: Last write wins (draft is last-saved version). Consider adding `lastModified` timestamp to draft for conflict detection (future enhancement).

### 2. Large Player Reports Object
**Scenario**: 30+ players, each with ratings + notes.

**Solution**: Current design handles this (MongoDB Mixed type supports large objects). Monitor performance; consider pagination if needed.

### 3. Draft Expiration
**Scenario**: User leaves draft for weeks, comes back.

**Solution**: No expiration (draft persists until cleared). Consider adding cleanup job for old drafts (future enhancement).

### 4. Browser Refresh During Autosave
**Scenario**: User refreshes while autosave is in-flight.

**Solution**: Draft loading on mount will restore last saved draft. In-flight autosave may fail, but previous draft is preserved.

### 5. Network Interruption
**Scenario**: User loses internet while typing.

**Solution**: Autosave will fail, error shown. Draft persists locally in React state. On reconnect, next autosave will save accumulated changes.

---

## Performance Considerations

### Backend
- **Draft Size**: Report drafts are typically small (< 50KB). MongoDB Mixed type handles this efficiently.
- **Index**: Optional index on `{ status: 1, reportDraft: 1 }` for queries (only if needed for analytics).

### Frontend
- **Debounce**: 2.5s prevents excessive API calls.
- **Partial Updates**: Only changed fields sent (reduces payload size).
- **State Updates**: Merge logic is O(n) where n = number of fields (negligible).

---

## Future Enhancements

1. **Draft Versioning**: Track draft history for undo/redo
2. **Conflict Resolution**: Detect concurrent edits and show merge UI
3. **Draft Expiration**: Auto-cleanup drafts older than 30 days
4. **Offline Support**: Store draft in localStorage as backup
5. **Draft Preview**: Show "Unsaved changes" indicator in UI
6. **Batch Autosave**: Group multiple field changes into single request

---

## Conclusion

This plan provides a comprehensive roadmap for implementing report draft/autosave for Played games, reusing existing patterns where possible while maintaining clean separation of concerns. The phased approach allows for incremental implementation and testing.

**Estimated Implementation Time**: 4-6 hours (backend: 2h, frontend: 3h, testing: 1h)

**Risk Level**: Low (reuses proven patterns, minimal breaking changes)



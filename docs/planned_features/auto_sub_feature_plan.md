# Implementation Plan: Auto-Sub Feature

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** Planning Phase  
**Priority:** Medium (UX Enhancement)

---

## Executive Summary

The "Auto-Sub" feature is a smart UX enhancement for the Goal Dialog that proactively detects when a coach attempts to record a goal for a player who is currently on the bench. Instead of blocking the user with a validation error, the system offers to automatically create a substitution event for that player immediately preceding the goal, streamlining the data entry process during match reporting.

**Goal:** Improve user experience by preventing validation errors and reducing manual data entry steps when recording goals for players who need to be substituted in first.

---

## Problem Statement

### Current Behavior

When a coach tries to record a goal for a player who is on the bench:
1. User opens Goal Dialog
2. User selects a player from the bench
3. User enters goal details (minute, assister, etc.)
4. User clicks "Save"
5. **Backend validation fails** with error: "Player must be ON_PITCH to score"
6. User must manually:
   - Close Goal Dialog
   - Open Substitution Dialog
   - Create substitution (bench player IN at minute X-1)
   - Re-open Goal Dialog
   - Re-enter goal details
   - Save again

### User Pain Points

- **Frustrating workflow**: User must switch between dialogs multiple times
- **Data re-entry**: Goal details must be entered twice
- **Time-consuming**: Slows down match reporting process
- **Error-prone**: User might forget to create the substitution
- **Poor UX**: Validation error feels like a "gotcha" moment

---

## Proposed Solution: Auto-Sub Feature

### User Flow (With Auto-Sub)

1. User opens Goal Dialog
2. User selects a player from the bench
3. User enters goal details (minute: 60, assister, etc.)
4. User clicks "Save"
5. **System detects**: Player is on bench at minute 60
6. **System prompts**: "Player X is on the bench. Would you like to create a substitution (Player X IN) at minute 59?"
7. User clicks "Yes, create substitution"
8. **System automatically**:
   - Creates substitution (Player X IN) at minute 59
   - Creates goal (Player X) at minute 60
   - Closes dialog
   - Refreshes timeline
9. ✅ **Success**: Both events created atomically

### Alternative Flow (User Declines)

1-6. Same as above
7. User clicks "No, cancel"
8. Dialog stays open
9. User can manually create substitution or change player selection

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Goal Dialog (Frontend)                   │
│                                                             │
│  User Action: Save Goal                                     │
│  ↓                                                          │
│  Check Player State at Goal Minute                         │
│  ↓                                                          │
│  ┌─────────────────────────────────────┐                  │
│  │ Player State: BENCH?                │                  │
│  └─────────────────────────────────────┘                  │
│           │                    │                            │
│        YES │                    │ NO                        │
│           ↓                    ↓                            │
│  ┌─────────────────┐   ┌──────────────────┐              │
│  │ Show Auto-Sub   │   │ Save Goal        │              │
│  │ Confirmation    │   │ Directly         │              │
│  │ Dialog          │   │                  │              │
│  └─────────────────┘   └──────────────────┘              │
│           │                                                │
│           ↓                                                │
│  ┌─────────────────────────────────────┐                  │
│  │ User Confirms Auto-Sub?              │                  │
│  └─────────────────────────────────────┘                  │
│           │                    │                            │
│        YES │                    │ NO                        │
│           ↓                    ↓                            │
│  ┌─────────────────┐   ┌──────────────┐                  │
│  │ Call Backend     │   │ Cancel       │                  │
│  │ Atomic Endpoint  │   │ (Stay open)  │                  │
│  │ (Sub + Goal)     │   │              │                  │
│  └─────────────────┘   └──────────────┘                  │
│           │                                                │
│           ↓                                                │
│  ┌─────────────────────────────────────┐                  │
│  │ Backend: Atomic Transaction         │                  │
│  │ 1. Create Substitution (min 59)      │                  │
│  │ 2. Create Goal (min 60)              │                  │
│  │ 3. Validate both events              │                  │
│  │ 4. Commit or Rollback                │                  │
│  └─────────────────────────────────────┘                  │
│           │                                                │
│           ↓                                                │
│  ┌─────────────────────────────────────┐                  │
│  │ Success: Refresh Timeline            │                  │
│  │ Close Dialog                          │                  │
│  └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Frontend Detection Logic

**Goal:** Detect when a goal is attempted for a bench player

**Files to Modify:**
- `src/features/game-management/components/GameDetailsPage/components/dialogs/GoalDialog.jsx`

**Changes Required:**

1. **Add State Reconstruction Check**
   - Before saving goal, check player state at goal minute
   - Use existing `getPlayerStateAtMinute` utility from `gameState.js`
   - If player state is `BENCH` → trigger Auto-Sub flow

2. **Add Auto-Sub Confirmation Dialog**
   - Create new confirmation dialog component
   - Show message: "Player {name} is on the bench at minute {minute}. Would you like to create a substitution (Player {name} IN) at minute {minute-1}?"
   - Buttons: "Yes, create substitution" | "No, cancel"

3. **Update Save Handler**
   - If player is BENCH → show confirmation dialog
   - If player is ON_PITCH → save directly (existing flow)
   - If user confirms → call atomic backend endpoint
   - If user cancels → keep dialog open

**Dependencies:**
- `gameState.js` utility (already exists)
- Timeline data (already available in GoalDialog)

---

### Phase 2: Backend Atomic Endpoint

**Goal:** Create atomic transaction endpoint for Sub + Goal creation

**Files to Create:**
- `backend/src/routes/goals.js` (add new endpoint)

**New Endpoint:**
```
POST /api/games/:gameId/goals/with-substitution
```

**Request Body:**
```json
{
  "goal": {
    "scorerId": "player123",
    "assisterId": "player456",
    "minute": 60,
    "goalCategory": "OpenPlay"
  },
  "substitution": {
    "playerOutId": null, // Will be determined by bench player
    "playerInId": "player123",
    "minute": 59 // Goal minute - 1
  }
}
```

**Implementation Logic:**

1. **Start MongoDB Transaction**
   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   ```

2. **Determine Player Out**
   - Find a player currently ON_PITCH at substitution minute
   - Use game rules engine to determine eligible player
   - If multiple options → use first available player
   - If no eligible player → abort transaction, return error

3. **Create Substitution (within transaction)**
   - Validate substitution eligibility
   - Create substitution document
   - Use session for transaction

4. **Create Goal (within transaction)**
   - Validate goal eligibility (scorer now ON_PITCH)
   - Create goal document
   - Use session for transaction

5. **Commit or Rollback**
   - If both succeed → commit transaction
   - If either fails → rollback transaction
   - Return success/error response

**Error Handling:**
- If substitution fails → rollback, return error
- If goal fails → rollback, return error
- If no eligible player to sub out → return error with message

**Dependencies:**
- `gameRules.js` service (already exists)
- `substitutions.js` routes (for validation logic)
- `goals.js` routes (for validation logic)

---

### Phase 3: Frontend Integration

**Goal:** Integrate Auto-Sub confirmation with atomic endpoint

**Files to Modify:**
- `src/features/game-management/components/GameDetailsPage/components/dialogs/GoalDialog.jsx`
- `src/features/game-management/api/goalsApi.js` (add new function)

**Changes Required:**

1. **Add API Function**
   ```javascript
   export const createGoalWithSubstitution = async (gameId, goalData, substitutionData) => {
     const response = await fetch(`${API_URL}/api/games/${gameId}/goals/with-substitution`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
       },
       body: JSON.stringify({
         goal: goalData,
         substitution: substitutionData
       })
     });
     // Handle response...
   };
   ```

2. **Update GoalDialog Save Handler**
   - When user confirms Auto-Sub:
     - Call `createGoalWithSubstitution`
     - Show loading state
     - On success: refresh timeline, close dialog
     - On error: show error message, keep dialog open

3. **Add Confirmation Dialog State**
   - `showAutoSubDialog` state
   - `autoSubData` state (stores goal data temporarily)

**Dependencies:**
- Phase 2 (backend endpoint must exist)

---

### Phase 4: Edge Cases & Validation

**Goal:** Handle edge cases and improve validation

**Edge Cases to Handle:**

1. **No Eligible Player to Sub Out**
   - Scenario: All players on pitch are already substituted out
   - Solution: Show error: "Cannot create substitution. No eligible player available to substitute out."

2. **Multiple Eligible Players**
   - Scenario: Multiple players can be subbed out
   - Solution: Use first available player (or allow user to select?)

3. **Substitution Minute < 1**
   - Scenario: Goal at minute 1, substitution would be at minute 0
   - Solution: Show error: "Cannot create substitution before minute 1. Please manually create substitution first."

4. **Player Already Substituted In**
   - Scenario: Player was already subbed in earlier
   - Solution: Backend validation will catch this, show error message

5. **Future Consistency Conflicts**
   - Scenario: Creating sub at min 59 conflicts with existing event at min 58
   - Solution: Backend validation will catch this, show error message

**Validation Enhancements:**

- Add frontend validation before showing Auto-Sub dialog
- Check if substitution minute is valid (> 0)
- Check if player is actually on bench (not already ON_PITCH)
- Check if there's an eligible player to sub out

---

### Phase 5: Testing

**Goal:** Comprehensive testing of Auto-Sub feature

**Test Cases:**

1. **Happy Path**
   - ✅ Goal for bench player → Auto-Sub dialog appears
   - ✅ User confirms → Both events created successfully
   - ✅ Timeline shows both events in correct order

2. **User Declines**
   - ✅ Goal for bench player → Auto-Sub dialog appears
   - ✅ User cancels → Dialog stays open
   - ✅ User can manually create substitution

3. **Backend Validation**
   - ✅ Atomic transaction succeeds when both events valid
   - ✅ Atomic transaction rolls back when substitution invalid
   - ✅ Atomic transaction rolls back when goal invalid

4. **Edge Cases**
   - ✅ No eligible player to sub out → Error shown
   - ✅ Substitution minute < 1 → Error shown
   - ✅ Player already ON_PITCH → No Auto-Sub dialog
   - ✅ Future consistency conflict → Error shown

5. **Data Integrity**
   - ✅ Both events appear in timeline
   - ✅ Player state correctly updated
   - ✅ No orphaned events (sub without goal or vice versa)

**Test Files to Create:**
- `backend/src/routes/__tests__/goals.with-substitution.test.js`
- `src/features/game-management/components/GameDetailsPage/components/dialogs/__tests__/GoalDialog.auto-sub.test.jsx`

---

## Technical Considerations

### Atomic Transactions

**Why Atomic?**
- Prevents partial data: Either both events are created or neither
- Ensures data consistency: No orphaned substitutions or goals
- Simplifies error handling: Single rollback point

**MongoDB Transaction Pattern:**
```javascript
const session = await mongoose.startSession();
try {
  session.startTransaction();
  
  // Create substitution
  const sub = await Substitution.create([subData], { session });
  
  // Create goal
  const goal = await Goal.create([goalData], { session });
  
  // Commit if both succeed
  await session.commitTransaction();
  return { success: true, substitution: sub[0], goal: goal[0] };
} catch (error) {
  // Rollback on any error
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Player Selection Logic

**Determining Player Out:**

1. Get all players ON_PITCH at substitution minute
2. Filter out players who:
   - Are already substituted out (future events)
   - Are sent off (red card)
   - Are goalkeepers (optional: preserve GK?)
3. Select first available player
4. If no player available → return error

**Alternative Approach:**
- Allow user to select which player to sub out
- More complex UI, but more control
- Consider for future enhancement

### Performance Considerations

- **Frontend**: State reconstruction check is lightweight (uses pre-fetched timeline)
- **Backend**: Transaction overhead is minimal (2 document creates)
- **Timeline Refresh**: Single API call after transaction (already optimized)

---

## Success Criteria

1. ✅ User can record goal for bench player without manual substitution step
2. ✅ Auto-Sub dialog appears when appropriate
3. ✅ Atomic transaction ensures data integrity
4. ✅ Error handling provides clear feedback
5. ✅ Edge cases are handled gracefully
6. ✅ No performance regressions
7. ✅ Tests cover all scenarios

---

## Future Enhancements

### Potential Additions:

1. **Auto-Sub for Assister**
   - If assister is on bench → offer to sub them in too
   - More complex: Need to handle multiple substitutions

2. **User Selection of Player Out**
   - Instead of auto-selecting, show dropdown of eligible players
   - Gives user more control

3. **Auto-Sub for Cards**
   - Similar feature for cards (if player on bench gets card)
   - Less common use case

4. **Batch Auto-Sub**
   - If multiple players need to be subbed in → batch substitution
   - Complex UI/UX challenge

---

## Dependencies

### Required:
- ✅ `gameRules.js` service (exists)
- ✅ `gameState.js` utility (exists)
- ✅ Timeline service (exists)
- ✅ Substitution routes (exists)
- ✅ Goal routes (exists)

### New:
- ⚠️ MongoDB transaction support (check MongoDB version)
- ⚠️ Atomic endpoint for Sub + Goal

---

## Risks & Mitigations

### Risk 1: Transaction Overhead
**Risk:** MongoDB transactions add latency  
**Mitigation:** Transactions are fast for 2 document creates. Monitor performance.

### Risk 2: Complex Error Handling
**Risk:** Multiple failure points in atomic operation  
**Mitigation:** Comprehensive error messages, rollback ensures consistency.

### Risk 3: Player Selection Logic
**Risk:** Auto-selecting player to sub out might not match user intent  
**Mitigation:** Start with simple logic (first available), enhance later with user selection.

### Risk 4: Edge Cases
**Risk:** Many edge cases (no eligible player, minute conflicts, etc.)  
**Mitigation:** Phase 4 dedicated to edge case handling, comprehensive testing.

---

## Implementation Order

1. **Phase 1**: Frontend Detection Logic (can be done independently)
2. **Phase 2**: Backend Atomic Endpoint (requires MongoDB transaction support)
3. **Phase 3**: Frontend Integration (depends on Phase 2)
4. **Phase 4**: Edge Cases & Validation (depends on Phase 3)
5. **Phase 5**: Testing (depends on all phases)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation Planning


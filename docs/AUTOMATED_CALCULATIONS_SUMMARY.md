# Automated Calculations Summary

## Overview

This document summarizes the automated calculation features implemented in the game management system. These features eliminate manual data entry and ensure data consistency by calculating values directly from game events.

## Automated Fields

### 1. Minutes Played

**Status**: ✅ Implemented

**Source**: Calculated from game events (substitutions, red cards)

**How it works**:
- Uses a session-based algorithm that tracks play sessions for each player
- Starting lineup players begin with a session at minute 0
- Substitutions end one player's session and start another's
- Red cards end a player's session immediately
- Total minutes = sum of all session durations

**Implementation**:
- **Backend Service**: `backend/src/services/minutesCalculation.js`
- **API Endpoint**: `GET /api/game-reports/calculate-minutes/:gameId`
- **Frontend Hook**: `useCalculatedMinutes`
- **Frontend API**: `src/features/game-management/api/minutesCalculationApi.js`

**When Active**:
- Only for games with status `"Played"`
- Controlled by `ENABLE_CALCULATED_MINUTES` environment variable
- Falls back to manual entry if calculation fails

**UI Behavior**:
- Minutes input field is disabled and read-only when calculated
- Shows "Automatically calculated from game events" message
- Displays loading indicator while calculating

---

### 2. Goals

**Status**: ✅ Implemented

**Source**: Calculated from Goals collection (`scorerId` field)

**How it works**:
- Counts all TeamGoal documents where `scorerId` matches the player
- Only counts team goals (excludes opponent goals)
- Own goals (where `scorerId` is null) are not counted

**Implementation**:
- **Backend Service**: `backend/src/services/goalsAssistsCalculation.js`
- **API Endpoint**: `GET /api/game-reports/calculate-goals-assists/:gameId`
- **Frontend Hook**: `useCalculatedGoalsAssists`
- **Frontend API**: `src/features/game-management/api/goalsAssistsCalculationApi.js`

**When Active**:
- Only for games with status `"Played"`
- Always active (no feature flag needed)
- Falls back to manual entry if calculation fails

**UI Behavior**:
- Goals input field is disabled and read-only when calculated
- Shows "Automatically calculated from Goals collection" message
- Displays loading indicator while calculating

---

### 3. Assists

**Status**: ✅ Implemented

**Source**: Calculated from Goals collection (`assistedById` field)

**How it works**:
- Counts all TeamGoal documents where `assistedById` matches the player
- Only counts team goals (excludes opponent goals)
- Goals without assists are not counted

**Implementation**:
- **Backend Service**: `backend/src/services/goalsAssistsCalculation.js` (same as goals)
- **API Endpoint**: `GET /api/game-reports/calculate-goals-assists/:gameId` (returns both goals and assists)
- **Frontend Hook**: `useCalculatedGoalsAssists` (returns both goals and assists)
- **Frontend API**: `src/features/game-management/api/goalsAssistsCalculationApi.js`

**When Active**:
- Only for games with status `"Played"`
- Always active (no feature flag needed)
- Falls back to manual entry if calculation fails

**UI Behavior**:
- Assists input field is disabled and read-only when calculated
- Shows "Automatically calculated from Goals collection" message
- Displays loading indicator while calculating

---

## Removed Validations

Since values are now calculated automatically, the following validations have been removed:

### Minutes Validation
- ❌ Removed: `validateMinutesForSubmission` function
- ❌ Removed: Team minutes minimum/maximum validation
- ❌ Removed: Individual player minutes validation
- ❌ Removed: Minutes progress indicator component
- ❌ Removed: Starting lineup minutes validation in PlayerPerformanceDialog

### Goals/Assists Validation
- ❌ Removed: Goals scored consistency validation (comparing team score to player goals)
- ❌ Removed: Assists validation (total assists cannot exceed team goals)
- ❌ Removed: Own goals confirmation dialog

**Reason**: Calculations ensure correctness automatically, so validation is unnecessary.

---

## Backend Batch Route Behavior

The `/api/game-reports/batch` route now:

1. **Calculates minutes** (if `ENABLE_CALCULATED_MINUTES=true` and game status is `"Played"`)
2. **Calculates goals/assists** (if game status is `"Played"`)
3. **Uses calculated values** when available, falls back to manual entry otherwise
4. **No validation** - calculations ensure correctness

---

## Data Flow

```
Game Events (Substitutions, Red Cards, Goals)
    ↓
Backend Services (calculatePlayerMinutes, calculatePlayerGoalsAssists)
    ↓
API Endpoints (/calculate-minutes, /calculate-goals-assists)
    ↓
Frontend Hooks (useCalculatedMinutes, useCalculatedGoalsAssists)
    ↓
UI Components (PlayerPerformanceDialog)
    ↓
Read-only fields with calculated values
```

---

## Migration Notes

### Existing Games
- **"Done" games**: Continue to use manual entry (no calculation)
- **"Played" games**: Automatically use calculated values when available
- **Legacy data**: Existing `minutesPlayed`, `goals`, `assists` values remain unchanged

### New Games
- All new "Played" games automatically use calculated values
- No manual entry required for minutes, goals, or assists

---

## Testing

### Manual Testing Checklist
- [ ] Create a game and mark as "Played"
- [ ] Add substitutions and verify minutes are calculated correctly
- [ ] Add goals and verify goals/assists are calculated correctly
- [ ] Verify fields are read-only in PlayerPerformanceDialog
- [ ] Verify calculated values are used in batch submission
- [ ] Test with "Done" games (should use manual entry)

### Edge Cases
- [ ] Player with no events (should show full match duration)
- [ ] Player with multiple substitutions
- [ ] Player with red card
- [ ] Goals without assists
- [ ] Own goals (should not count toward player goals)

---

## Future Enhancements

Potential improvements:
1. **Real-time updates**: Recalculate immediately when events are added/modified
2. **Calculation history**: Track when calculations were performed
3. **Manual override**: Allow manual entry for edge cases (with admin permission)
4. **Calculation verification**: Add audit log for calculated values

---

## Related Documentation

- `AUTOMATED_MINUTES_CALCULATION_ARCHITECTURE_REVIEW.md` - Architecture review for minutes calculation
- `AUTOMATED_MINUTES_IMPLEMENTATION_STATUS.md` - Implementation status for minutes
- `MINUTES_PROGRESS_INDICATOR_REMOVAL_PLAN.md` - Plan for removing validation components


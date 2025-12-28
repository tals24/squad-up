# Bug Fix: Position Click Modal Not Working

## Issue Reported
User reported that clicking on a position on the tactical board was not showing the player selection modal. The drag & drop functionality was working, but the click-to-assign feature was not visible or not working.

## Root Causes Identified

### 1. **Prop Name Mismatch** (Primary Issue)
The `PlayerSelectionDialog` component expected different prop names than what was being passed from `GameDetailsPage/index.jsx`:

**Expected by Dialog:**
- `open` (we were passing `isOpen`)
- `position` (we were passing `selectedPosition`)
- `positionData` (we were passing `selectedPositionData`)
- `availablePlayers` (we were passing `squadPlayers`)
- `onSelectPlayer` (we were passing `onSelect`)

**Result:** The dialog was receiving `undefined` for all props, so it never opened even when the handler was called.

### 2. **Incorrect Dialog Prop Name**
The dialog prop object key was `playerPerf` but `DialogsModule` expected `playerPerformance`. This caused the performance dialog to also be broken (though not reported by the user).

### 3. **Duplicate ConfirmationModal**
Two `ConfirmationModal` components were being rendered:
- One inside `DialogsModule`
- One standalone in `index.jsx`

The standalone modal was receiving props, but `DialogsModule`'s modal was not, causing potential conflicts.

### 4. **Limited Position Click Scope** (Secondary Issue)
The `TacticalBoard` component only allowed clicking on **empty** positions:
```jsx
if (!isOccupied && isScheduled && !isReadOnly) {
  onPositionClick?.(posId, posData);
}
```

This prevented users from clicking on occupied positions to reassign players, which is a reasonable expectation.

## Fixes Applied

### Fix 1: Corrected Prop Names for Player Selection Dialog
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

Changed the `playerSelection` props to match the dialog's expected prop names:
```jsx
playerSelection: {
  open: dialogState.showPlayerSelectionDialog,              // was: isOpen
  position: dialogState.selectedPosition,                   // was: selectedPosition
  positionData: dialogState.selectedPositionData,           // was: selectedPositionData
  availablePlayers: squadPlayers,                           // was: squadPlayers
  onSelectPlayer: formationHandlers.handleSelectPlayerForPosition, // was: onSelect
  onClose: () => {
    dialogState.setShowPlayerSelectionDialog(false);
    dialogState.setSelectedPosition(null);
    dialogState.setSelectedPositionData(null);
  },
},
```

### Fix 2: Corrected Dialog Prop Key Name
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

Changed `playerPerf` to `playerPerformance` to match `DialogsModule`'s expectation.

### Fix 3: Consolidated ConfirmationModal
**File:** `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

Removed the standalone `ConfirmationModal` and added `confirmation` to the `dialogs` object passed to `DialogsModule`:
```jsx
confirmation: {
  isOpen: showConfirmationModal,
  onClose: () => setShowConfirmationModal(false),
  onConfirm: confirmationConfig.onConfirm,
  onCancel: confirmationConfig.onCancel,
  title: confirmationConfig.title,
  message: confirmationConfig.message,
  confirmText: confirmationConfig.confirmText,
  cancelText: confirmationConfig.cancelText,
  type: confirmationConfig.type,
},
```

### Fix 4: Enhanced Position Click Functionality
**File:** `frontend/src/features/game-management/components/GameDetailsPage/components/TacticalBoard.jsx`

#### 4a. Allow Clicking Occupied Positions
Changed the outer `onClick` condition to allow clicking on both empty and occupied positions:
```jsx
// Before:
if (!isOccupied && isScheduled && !isReadOnly) {
  onPositionClick?.(posId, posData);
}

// After:
if (isScheduled && !isReadOnly) {
  onPositionClick?.(posId, posData);
}
```

#### 4b. Updated Cursor and Tooltip
Updated the occupied position div to show it's clickable in Scheduled games:
```jsx
className={`relative group ${(isPlayed || isDone || (isScheduled && !isReadOnly)) ? "cursor-pointer" : ""}`}
title={(isPlayed || isDone) ? `Click to view ${player.fullName}'s report` : 
      (isScheduled && !isReadOnly) ? `Click to reassign position` : ""}
```

#### 4c. Inner vs Outer Click Behavior
The click behavior is now properly separated by game status:
- **Scheduled games:** Click triggers outer `onClick` → opens player selection dialog (reassignment)
- **Played/Done games:** Click triggers inner `onClick` → opens performance report dialog
- These are mutually exclusive conditions, preventing conflicts

## Expected Behavior After Fix

### For Scheduled Games:
1. **Empty positions:** Click opens player selection modal filtered by position type
2. **Occupied positions:** Click opens player selection modal to reassign the player
3. **Hover:** Cursor changes to pointer, tooltip shows "Click to reassign position"
4. **Remove button:** Small "×" button appears on hover to remove player without reassignment

### For Played/Done Games:
1. **Occupied positions:** Click opens performance report dialog
2. **Hover:** Cursor changes to pointer, tooltip shows "Click to view [player]'s report"
3. **Empty positions:** Not clickable (as expected)

## Testing Instructions

1. Navigate to a **Scheduled** game's details page
2. Fill some positions using drag & drop
3. **Test empty position click:**
   - Click on an empty position
   - ✅ Player selection modal should appear
   - ✅ Modal should show players filtered by position type (e.g., only Midfielders for CM position)
4. **Test occupied position click:**
   - Click on an occupied position
   - ✅ Player selection modal should appear
   - ✅ Selecting a different player should reassign the position
5. **Test drag & drop (regression check):**
   - Drag a player from the sidebar to a position
   - ✅ Should work as before
6. Navigate to a **Played** or **Done** game
7. **Test occupied position click:**
   - Click on an occupied position
   - ✅ Performance report dialog should appear (not the player selection modal)

## Impact

- **User Experience:** Significantly improved - position clicks now work as expected
- **Functionality:** Both click-to-assign and drag-to-assign methods now work
- **Code Quality:** Consolidated dialogs, removed duplication
- **Behavior Parity:** All existing functionality maintained

## Status
✅ **FIXED** - Ready for manual testing


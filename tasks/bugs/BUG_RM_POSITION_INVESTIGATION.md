# Bug Investigation: RM Position Player Disappearing

**Date**: 2024-12-28  
**Reporter**: User manual testing  
**Status**: 🔧 **FIX IMPLEMENTED** + **EXTENSIVE LOGGING ADDED**  
**Priority**: 🔥 **CRITICAL** (Data loss issue)

---

## 📋 Bug Description

**Steps to Reproduce**:
1. Create a game with status "Scheduled"
2. Fill players on pitch, including RM position
3. Change game status to "Played"
4. Navigate away to dashboard
5. Navigate back to game details
6. **BUG**: RM position player has disappeared

---

## 🔍 Root Cause Analysis

### **Primary Issue Identified**:

The `useLineupDraftManager` hook was **only loading draft for Scheduled games**:

```javascript
// ❌ OLD CODE (Bug):
if (game.status === 'Scheduled' && game.lineupDraft && ...) {
  // Load draft with formation
}
// Falls back to gameRosters for Played games
```

**Problem**: When game transitions from Scheduled → Played:
- ✅ Draft was saved (with formation including RM player)
- ❌ Draft loading was skipped (due to status check)
- ❌ Fallback to `gameRosters` which **doesn't contain formation data**
- ❌ Result: RM player disappears

---

## ✅ Fix Implemented

### **Solution**: Load draft for both Scheduled AND Played games

```javascript
// ✅ NEW CODE (Fixed):
const shouldLoadDraft = (game.status === 'Scheduled' || game.status === 'Played') && 
                        game.lineupDraft && 
                        typeof game.lineupDraft === 'object';

if (shouldLoadDraft) {
  // Load draft with formation for BOTH Scheduled and Played
}
```

**Why This Works**:
1. **Scheduled game**: Draft loads (formation saved)  
   → User sets RM player → Autosaves to draft
   
2. **Game transitions to Played**: Draft STILL loads (formation preserved)  
   → RM player remains in formation
   
3. **Navigate away/back**: Draft loads again  
   → RM player persists ✅

4. **Done game**: Draft NOT loaded (uses finalized gameRosters)  
   → Expected behavior ✅

---

## 📊 Comprehensive Logging Added

### **Purpose**: Track the complete data flow to diagnose any remaining issues

### **Log Sections**:

#### 1. **Draft Loading Start**
```javascript
console.log('🔍 [useLineupDraftManager] === DRAFT LOADING START ===');
// Shows: gameId, gameStatus, opponent, date
// Shows: draft existence, size, formationType
// Shows: available players count, gameRosters count
```

#### 2. **Draft Content**
```javascript
console.log('📋 [useLineupDraftManager] Draft content:');
// Shows: full draft object
// Shows: rosters keys count
// Shows: formation keys count
```

#### 3. **Formation Restoration**
```javascript
console.log('🔧 [useLineupDraftManager] Restoring formation from draft...');
// Shows: each position being processed
// Shows: player found/missing for each position
// Shows: final restored formation with player details
// ❌ ERROR logs if player is missing from gamePlayers
```

#### 4. **Missing Players Alert**
```javascript
console.error('❌ [useLineupDraftManager] MISSING PLAYER for position ${posId}:');
// Shows: playerId that's missing
// Shows: all available player IDs
// Shows: all available player names
// Helps identify: Is player missing from gamePlayers? Or from draft?
```

#### 5. **Fallback Paths**
```javascript
console.log('🔍 [useLineupDraftManager] Attempting gameRosters fallback...');
// Shows: why draft wasn't loaded
// Shows: gameRosters data and count
// ⚠️ WARNING: gameRosters does NOT include formation data
```

#### 6. **Autosave Tracking**
```javascript
console.log('💾 [useLineupDraftManager] Autosave triggered - starting 2.5s timer...');
console.log('💾 [useLineupDraftManager] Autosave payload:');
// Shows: rosters count, formation positions count
// Shows: exact formation data being saved (position → player mapping)
// Shows: success/failure with details
```

---

## 🧪 Testing Instructions

### **Test Case 1: Basic Flow (Should Now Work)**

1. **Setup**:
   - Open browser console (F12)
   - Create a new Scheduled game
   
2. **Fill Lineup**:
   - Add players to positions, including RM
   - Watch console logs: `💾 Autosave triggered...`
   - Wait 2.5s for autosave
   - Verify: `✅ Draft autosaved successfully!`
   - **Check log**: Confirm RM position is in saved formation

3. **Transition to Played**:
   - Click "Game Was Played"
   - Complete validation
   - **Check console**: Should see new draft load logs

4. **Navigate Away**:
   - Go to Dashboard
   - Return to game details

5. **Verify Fix**:
   - **Check console logs**:
     - `✅ LOADING DRAFT (Played game)`
     - `✅ Position RM restored: { playerId, playerName }`
   - **Check UI**: RM position should have player
   - **✅ PASS** if RM player is present

---

### **Test Case 2: Edge Cases**

#### A. **Player Not in GamePlayers**
**Symptom**: Player exists in draft but not loaded
**Log to look for**:
```
❌ MISSING PLAYER for position RM:
  playerId: "xxx"
  availablePlayerIds: [...]
```
**Diagnosis**: Player was deleted or team changed

#### B. **Draft Not Saved**
**Symptom**: No draft found when returning
**Log to look for**:
```
⚠️ Played game but NO DRAFT found
  WARNING: This might indicate draft was not saved or cleared!
```
**Diagnosis**: Autosave failed or backend cleared draft

#### C. **Formation Empty in Draft**
**Symptom**: Draft exists but no formation
**Log to look for**:
```
⚠️ No formation in draft to restore
  draftFormationCount: 0
```
**Diagnosis**: Draft saved without formation data

---

## 🔍 Diagnostic Checklist

Use these console log filters in Chrome DevTools:

### **1. Track Draft Loading**:
```
Filter: "DRAFT LOADING"
```
Shows: When draft loading starts/ends, which path taken

### **2. Track Specific Position**:
```
Filter: "position RM" or "Position RM"
```
Shows: Whether RM is being processed, restored, or missing

### **3. Track Autosave**:
```
Filter: "Autosave"
```
Shows: When autosave triggers, what's being saved, success/failure

### **4. Track Errors Only**:
```
Filter: "❌" or "MISSING PLAYER"
```
Shows: Only error conditions

---

## 🎯 Expected Behavior After Fix

### **Scheduled Game**:
- ✅ Draft loads on page load
- ✅ Formation (including RM) is restored
- ✅ Changes autosave every 2.5s
- ✅ RM player persists

### **Played Game**:
- ✅ Draft STILL loads (NEW!)
- ✅ Formation (including RM) is restored
- ✅ Autosave does NOT run (by design)
- ✅ RM player persists

### **Done Game**:
- ✅ Draft is NOT loaded (uses finalized rosters)
- ✅ Formation from gameRosters
- ✅ RM player from saved data

---

## 🚨 Potential Secondary Issues

### **Issue 1: Backend Clears Draft on Status Change**

**Symptom**: Draft not found after transitioning to Played

**Check backend code**: Does `handleGameWasPlayed` clear `lineupDraft`?

**If YES**: Backend needs to preserve draft OR copy formation to gameRosters

**Temporary workaround**: Don't clear draft for Played games

---

### **Issue 2: Formation Not Saved in Draft**

**Symptom**: Draft exists but formation is empty

**Check**: Console log `draftFormationCount: 0`

**Cause**: Autosave might be saving rosters but not formation

**Fix**: Verify autosave payload includes formation

---

### **Issue 3: Player ID Mismatch**

**Symptom**: Player in draft but not found in gamePlayers

**Check**: Console log shows `playerId: "xxx"` but not in `availablePlayerIds`

**Cause**: Player deleted, team changed, or ID format mismatch

**Fix**: Verify player still exists and is on correct team

---

## 📝 Next Steps

### **1. Test the Fix** ✅
- Follow Test Case 1 above
- Verify RM player persists through status change
- Check console logs confirm draft loading for Played games

### **2. Monitor Logs** 👀
- Watch for any `❌ MISSING PLAYER` errors
- Watch for `⚠️ NO DRAFT found` warnings
- Report any unexpected behavior

### **3. If Issue Persists** 🔍
- Capture full console log output
- Note exact steps to reproduce
- Check if other positions also disappear
- Check if issue happens with specific players

### **4. Backend Investigation** (if needed)
- Verify draft persists after game status change
- Check if formation data is included in draft
- Verify gameRosters structure for Played games

---

## 📦 Files Modified

1. **`hooks/useLineupDraftManager.js`**:
   - ✅ Fixed draft loading condition (Scheduled OR Played)
   - ✅ Added 200+ lines of diagnostic logging
   - ✅ Tracks complete data flow from draft to formation

---

## 🎓 Lessons Learned

### **Key Insight**:
Draft data should persist across status changes if it contains formation info.  
The original logic assumed draft is only for "drafting" (Scheduled), but it's actually  
the **source of truth for formation data** until game is finalized (Done).

### **Design Decision**:
Load draft for **both Scheduled and Played** to preserve user-created formations.  
Only skip draft for **Done** games which use finalized gameRosters.

---

**Status**: Ready for testing  
**Confidence**: High (root cause identified and fixed)  
**Logging**: Comprehensive (will catch any remaining edge cases)  
**Next**: User manual testing with console open


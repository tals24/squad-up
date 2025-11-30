# Migration: DisciplinaryAction → Card + PlayerMatchStat

**Date:** December 2024  
**Status:** ✅ Completed  
**Migration Script:** `backend/scripts/migrateDisciplinaryData.js`

---

## Overview

This migration refactored the disciplinary data architecture by separating **Timeline Events** (Cards) from **Aggregate Statistics** (Fouls). The old `DisciplinaryAction` model mixed both concerns, which limited extensibility and query efficiency.

### Architecture Change

**Before:**
- Single `DisciplinaryAction` collection mixing:
  - Cards (timeline events with minute)
  - Fouls (aggregate stats)

**After:**
- `Card` collection: Timeline events (Yellow/Red/Second Yellow cards)
- `PlayerMatchStat` collection: Aggregate statistics (Fouls, Shots, Passing, etc.)

---

## Migration Process

### Step 1: Dry Run
```bash
node backend/scripts/migrateDisciplinaryData.js --dry-run
```

This previews what would be migrated without making changes.

### Step 2: Live Migration
```bash
node backend/scripts/migrateDisciplinaryData.js --archive
```

This performs the actual migration and archives the old collection.

### Migration Results

- **6 DisciplinaryActions** migrated successfully
- **6 Cards** created
- **6 PlayerMatchStat documents** created
- Old collection archived as `disciplinaryactions_archived_YYYY-MM-DD`

---

## What Was Migrated

### Cards (Timeline Events)
- `cardType` → `cardType` (yellow, red, second-yellow)
- `minute` → `minute` (1-120)
- `reason` → `reason` (optional, max 200 chars)
- `gameId` → `gameId`
- `playerId` → `playerId`

### Player Match Stats (Aggregate Stats)
- `foulsCommitted` → `disciplinary.foulsCommitted`
- `foulsReceived` → `disciplinary.foulsReceived`
- Grouped by `gameId` + `playerId` (unique constraint)

---

## Post-Migration Cleanup

### Files Deleted
- ✅ `backend/src/models/DisciplinaryAction.js`
- ✅ `backend/src/routes/disciplinaryActions.js`
- ✅ `src/features/game-management/api/disciplinaryActionsApi.js`

### Code Updated
- ✅ `backend/src/app.js` - Removed route registration
- ✅ `backend/src/routes/analytics.js` - Uses Card model
- ✅ `backend/src/worker.js` - Uses Card model
- ✅ `backend/src/services/minutesCalculation.js` - Uses timelineService
- ✅ Frontend components updated to use new Card API

---

## Verification

After migration, verify:
1. ✅ Cards appear in Match Timeline sidebar
2. ✅ Cards display correctly in PlayerPerformanceDialog
3. ✅ Red cards trigger recalc-minutes job
4. ✅ Player match stats can be updated via API
5. ✅ Timeline endpoint returns unified events

---

## Rollback (If Needed)

If rollback is required:
1. Restore archived collection: `disciplinaryactions_archived_YYYY-MM-DD` → `disciplinaryactions`
2. Revert code changes (restore deleted files from git history)
3. Re-run migration script in reverse (not implemented, manual process)

**Note:** Rollback should only be done if critical issues are discovered immediately after migration.

---

## Future Considerations

- The `PlayerMatchStat` model is extensible - new stat categories can be added without migration
- Cards are now properly separated as timeline events
- Timeline service provides unified chronological view of all match events

---

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Updated with Card and PlayerMatchStat endpoints
- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Updated collection structure
- [Refactoring Plan](./planned_features/refactor_disciplinary_architecture_plan.md) - Full implementation plan


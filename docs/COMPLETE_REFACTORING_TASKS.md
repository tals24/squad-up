# Complete Refactoring Tasks - COMPREHENSIVE LIST

## Current State (After Initial Work)

### ✅ Completed:
- 9 custom hooks extracted from GameDetailsPage
- Shared dialog system created (BaseDialog, ConfirmDialog, FormDialog)
- ESLint rules added
- FEATURE_TEMPLATE.md created
- Documentation written

### ❌ Critical Issues Remaining:
- GameDetailsPage still 1,082 lines (Target: 200)
- 12 files violate 300-line limit
- No feature splitting done
- No modules/ folder created
- Large dialogs not split
- Large utils not cleaned

## CRITICAL PATH: Tasks to Complete Plan

### PHASE 1: Fix GameDetailsPage (HIGH PRIORITY)

#### 1.1 Refactor Main index.jsx (1,082 → 250 lines)
**Current Problem:** Still has all dialog state and handlers inline
**Solution:**
- Create `hooks/useDialogManagement.js` - Consolidate all 7 dialog states
- Create `hooks/useGameHandlers.js` - All handler functions
- Simplify main render to just layout + hook calls
**Estimate:** 2-3 hours

#### 1.2 Split Large Dialogs (BLOCKING ESLint)
1. **PlayerPerformanceDialog** (502 → 250 lines)
   - ✅ PlayerRatingsForm.jsx created (needs integration)
   - ✅ PlayerStatsDisplay.jsx created (needs integration)
   - TODO: Remove duplicate code, rebuild properly

2. **CardDialog** (432 → 250 lines)
   - Extract form to CardForm.jsx module
   - Extract validation to useCardValidation hook

3. **GoalDialog** (417 → 250 lines)
   - Split into TeamGoalForm.jsx + OpponentGoalForm.jsx
   - Keep dialog as tab orchestrator

4. **SubstitutionDialog** (329 → 250 lines)
   - Extract form to SubstitutionForm.jsx
   - Extract validation to useSubValidation hook

#### 1.3 Create modules/ Folder
- GameContent.jsx - 3-column layout wrapper
- Split MatchAnalysisSidebar (613 lines) into:
  - TeamSummarySection.jsx (~100 lines)
  - EventsSection.jsx (~120 lines)
  - DifficultySection.jsx (~90 lines)
  - AnalysisSidebar.jsx (~150 lines) - Container
- Split GameDayRosterSidebar if needed (currently 127 lines - OK)

### PHASE 2: Feature Splitting (ARCHITECTURAL)

#### 2.1 Create game-creation Feature
**Action:** New folder `src/features/game-creation/`
- Copy AddGamePage from game-management
- Copy GamesSchedulePage from game-management
- Create game-creation/api/gameApi.js (create/update only)
- Create hooks/useCreateGame.js
- Create index.js with public exports
**Estimate:** 3-4 hours

#### 2.2 Create game-execution Feature
**Action:** New folder `src/features/game-execution/`
- Move GameDetailsPage (refactored) from game-management
- Move api/goalsApi.js, substitutionsApi.js, cardsApi.js, timelineApi.js
- Move utils/squadValidation.js, minutesValidation.js, cardValidation.js, gameState.js
- Create index.js
**Estimate:** 2-3 hours

#### 2.3 Create game-analysis Feature
**Action:** New folder `src/features/game-analysis/`
- Move api/playerStatsApi.js, playerMatchStatsApi.js, difficultyAssessmentApi.js
- Create placeholder GameStatsPage
- Create hooks/useGameStats.js
- Create index.js
**Estimate:** 2 hours

#### 2.4 Update Router
- Update all imports in `app/router/` to point to new features
- Test all routes still work
**Estimate:** 1 hour

#### 2.5 Delete game-management
- Verify nothing left behind
- Remove folder
**Estimate:** 30 min

### PHASE 3: Other Large Files

#### 3.1 TacticBoardPage (1,332 lines)
Extract to:
-hooks/useFormationState.js (~120 lines)
- hooks/usePlayerPositions.js (~100 lines)
- hooks/useTacticsActions.js (~150 lines)
- modules/TacticsHeader.jsx (~80 lines)
- modules/FormationCanvas.jsx (~180 lines)
- modules/PlayerPool.jsx (~100 lines)
- modules/TacticsToolbar.jsx (~90 lines)
Target: Main file ~150 lines
**Estimate:** 4-5 hours

#### 3.2 OrganizationSettingsSection (760 lines)
Split into modules/:
- OrganizationForm.jsx (~150 lines)
- TeamsList.jsx (~100 lines)
- SeasonsList.jsx (~100 lines)
- FeatureFlagsList.jsx (~120 lines)
- DangerZone.jsx (~80 lines)
Target: Main file ~120 lines
**Estimate:** 3-4 hours

#### 3.3 MatchReportModal (627 lines)
- Extract hooks (useReportForm, useReportValidation)
- Split into modules
Target: ~200 lines
**Estimate:** 3 hours

#### 3.4 FormationEditor (632 lines)
- Move to game-execution/components/shared/
- Extract formation logic to hook
- Split canvas into module
Target: ~200 lines
**Estimate:** 3-4 hours

#### 3.5 DrillCanvas (603 lines)
- Extract drawing logic to hooks
- Split into modules
Target: ~200 lines
**Estimate:** 3-4 hours

### PHASE 4: Shared Layer Cleanup

#### 4.1 Move Feature-Specific from Shared
- FormationEditor.jsx → game-execution/components/shared/
- PlayerSelectionModal.jsx → game-execution/components/dialogs/
**Estimate:** 1 hour

#### 4.2 Clean Up Over-Engineered Utils
- theme.ts (746 → 150 lines): Extract to CSS variables
- accessibility.ts: Split into hooks and lib
- advanced-animations.ts: Move to CSS
**Estimate:** 4-5 hours

#### 4.3 Create shared/ui/composed/
- Move PlayerProfileCard, PerformanceStatsCard
- Create README.md
**Estimate:** 1 hour

### PHASE 5: Testing & Validation

#### 5.1 Write Hook Tests
- Test all 9 GameDetailsPage hooks
- Test dialog hooks
**Estimate:** 4-5 hours

#### 5.2 Run Validation
- `npm run lint` - Fix all violations
- Run existing tests
- Verify draft autosave works
**Estimate:** 2-3 hours

#### 5.3 Integration Testing
- Test game flow (Scheduled → Played → Done)
- Test all dialogs
- Test formation drag & drop
**Estimate:** 2-3 hours

## Total Estimated Effort

- Phase 1: 8-10 hours
- Phase 2: 8-10 hours  
- Phase 3: 16-20 hours
- Phase 4: 6-7 hours
- Phase 5: 8-11 hours

**Total: 46-58 hours of work remaining**

## Priority Order (If Time Limited)

1. **CRITICAL:** Split 4 large dialogs (ESLint blocking)
2. **HIGH:** Reduce GameDetailsPage to 250 lines
3. **HIGH:** Split game-management feature
4. **MEDIUM:** TacticBoardPage refactoring
5. **MEDIUM:** OrganizationSettingsSection refactoring
6. **LOW:** Clean up utils
7. **LOW:** Comprehensive testing

## Files That MUST Be Fixed (ESLint Violations)

1. GameDetailsPage/index.jsx: 1,082 lines → 250 lines
2. PlayerPerformanceDialog.jsx: 502 lines → 250 lines
3. CardDialog.jsx: 432 lines → 250 lines
4. GoalDialog.jsx: 417 lines → 250 lines
5. SubstitutionDialog.jsx: 329 lines → 250 lines
6. MatchAnalysisSidebar.jsx: 613 lines → 150 lines
7. FormationEditor.jsx: 632 lines → 200 lines (+ move)
8. MatchReportModal.jsx: 627 lines → 200 lines
9. DrillCanvas.jsx: 603 lines → 200 lines
10. theme.ts: 746 lines → 150 lines
11. TacticBoardPage: 1,332 lines → 150 lines
12. OrganizationSettingsSection: 760 lines → 120 lines

**Total: 12 files blocking ESLint compliance**


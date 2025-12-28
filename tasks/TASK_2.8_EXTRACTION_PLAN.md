# Task 2.8 Extraction Plan: Make GameDetailsPage a Thin Container

**Current**: 1,807 lines  
**Target**: ≤ 250 lines  
**Reduction Needed**: ~1,557 lines (86%)

---

## 📊 Current Component Breakdown

### **Handlers Still in Component: 30**

#### Game State Handlers (5):
- `handleGameWasPlayed` - Transition Scheduled → Played
- `handlePostpone` - Postpone game
- `handleSubmitFinalReport` - Submit final report (Played → Done)
- `handleConfirmFinalSubmission` - Confirm final submission
- `handleEditReport` - Re-open Done game for editing

#### Report/Performance Handlers (5):
- `handleOpenPerformanceDialog` - Open player performance dialog
- `handleSavePerformanceReport` - Save individual player report
- `handleAutoFillRemaining` - Auto-fill missing reports
- `handleTeamSummaryClick` - Open team summary dialog
- `handleTeamSummarySave` - Save team summary

#### Goals Handlers (5):
- `handleAddGoal` - Open add goal dialog
- `handleEditGoal` - Edit existing goal
- `handleDeleteGoal` - Delete goal
- `handleSaveGoal` - Save goal data
- `handleSaveOpponentGoal` - Save opponent goal

#### Substitutions Handlers (4):
- `handleAddSubstitution` - Open add substitution dialog
- `handleEditSubstitution` - Edit substitution
- `handleDeleteSubstitution` - Delete substitution
- `handleSaveSubstitution` - Save substitution

#### Cards Handlers (4):
- `handleAddCard` - Open add card dialog
- `handleEditCard` - Edit card
- `handleDeleteCard` - Delete card
- `handleSaveCard` - Save card

#### Formation Handlers (3):
- `handleFormationChange` - Change formation type
- `handlePositionClick` - Click position on tactical board
- `handleSelectPlayerForPosition` - Assign player to position

#### Difficulty Assessment (2):
- `handleSaveDifficultyAssessment` - Save difficulty rating
- `handleDeleteDifficultyAssessment` - Delete difficulty rating

#### Confirmation Handlers (2):
- `handleConfirmation` - Confirm action
- `handleConfirmationCancel` - Cancel confirmation

---

## 🎯 Extraction Strategy

### **Phase 1: Extract Event Handlers into Hooks** (Priority 🔥)

Create dedicated hooks for each logical group:

1. **`useGameStateHandlers.js`** (~200 lines)
   - handleGameWasPlayed
   - handlePostpone  
   - handleSubmitFinalReport
   - handleConfirmFinalSubmission
   - handleEditReport

2. **`useReportHandlers.js`** (~150 lines)
   - handleOpenPerformanceDialog
   - handleSavePerformanceReport
   - handleAutoFillRemaining
   - handleTeamSummaryClick
   - handleTeamSummarySave

3. **`useGoalsHandlers.js`** (~150 lines)
   - handleAddGoal
   - handleEditGoal
   - handleDeleteGoal
   - handleSaveGoal
   - handleSaveOpponentGoal

4. **`useSubstitutionsHandlers.js`** (~100 lines)
   - handleAddSubstitution
   - handleEditSubstitution
   - handleDeleteSubstitution
   - handleSaveSubstitution

5. **`useCardsHandlers.js`** (~100 lines)
   - handleAddCard
   - handleEditCard
   - handleDeleteCard
   - handleSaveCard

6. **`useFormationHandlers.js`** (~50 lines)
   - handleFormationChange
   - handlePositionClick
   - handleSelectPlayerForPosition

7. **`useDifficultyHandlers.js`** (~50 lines)
   - handleSaveDifficultyAssessment
   - handleDeleteDifficultyAssessment

**Estimated Extraction**: ~800 lines

---

### **Phase 2: Extract Remaining State & Effects** (Priority 🔴)

1. **Extract dialog state management**:
   - Move all dialog state (`showGoalDialog`, `selectedGoal`, etc.) into hooks
   - Create `useDialogState.js` to manage dialog visibility

2. **Extract data loading effects**:
   - Goals, substitutions, cards loading
   - Timeline loading
   - Player stats loading

**Estimated Extraction**: ~200 lines

---

### **Phase 3: Simplify Main Component** (Priority 🟡)

1. **Keep only**:
   - ID parsing from URL
   - Hook calls (data + handlers)
   - Early returns (loading/error)
   - Module composition (render)

2. **Remove**:
   - All inline handler definitions
   - Complex state management
   - Business logic

**Target Structure**:
```jsx
export default function GameDetails() {
  // 1. URL params & context
  const gameId = useGameId();
  const context = useData();
  
  // 2. Data hooks
  const gameData = useGameDetailsData(gameId, context);
  const draftManagers = useDraftManagers(gameId, gameData);
  const playerGrouping = usePlayerGrouping(gameData);
  
  // 3. Handler hooks
  const gameHandlers = useGameStateHandlers(gameId, gameData);
  const reportHandlers = useReportHandlers(gameId, gameData);
  const goalsHandlers = useGoalsHandlers(gameId);
  const subsHandlers = useSubstitutionsHandlers(gameId);
  const cardsHandlers = useCardsHandlers(gameId);
  
  // 4. Early returns
  if (loading) return <PageLoader />;
  if (error) return <ErrorState />;
  if (!game) return <NotFound />;
  
  // 5. Render modules
  return (
    <div>
      <GameHeaderModule {...headerProps} />
      <RosterSidebarModule {...rosterProps} />
      <TacticalBoardModule {...boardProps} />
      <MatchAnalysisModule {...analysisProps} />
      <DialogsModule {...dialogProps} />
    </div>
  );
}
```

**Target**: ~150-200 lines

---

## 📝 Realistic Target

Given the complexity, a more realistic target might be:
- **Minimum**: ~400-500 lines (thin orchestrator with hook calls)
- **Stretch Goal**: ~250 lines (extremely minimal)

The key is to make it a **thin container** where all logic is in hooks/utilities.

---

## 🚀 Execution Order

1. ✅ Start with `useGameStateHandlers` (most complex, highest value)
2. ✅ Then `useReportHandlers`
3. ✅ Then `useGoalsHandlers`, `useSubstitutionsHandlers`, `useCardsHandlers`
4. ✅ Extract dialog state management
5. ✅ Final cleanup and verification

---

## ✅ Success Criteria

- [ ] All handler functions extracted into hooks
- [ ] Main component ≤ 400 lines (stretch: ≤ 250)
- [ ] Component is primarily: hooks → early returns → modules
- [ ] All tests pass
- [ ] No regressions in manual testing
- [ ] Code is readable and maintainable

---

**End of Extraction Plan**


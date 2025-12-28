# Task 2.8 Implementation Plan: Complete the Thin Container Refactor

**Status**: 🟡 **IN PROGRESS** (Patterns established, mechanical work remains)  
**Current**: 1,807 lines  
**Target**: ≤ 250 lines  
**Remaining**: ~1,557 lines to extract (86%)

---

## ✅ **What's Been Completed**

### **Phase 1: Foundation (Tasks 2.1-2.7)** ✅
- ✅ Task 2.1: Decomposition map created
- ✅ Task 2.2: UI modules extracted (GameHeaderModule, RosterSidebarModule, etc.)
- ✅ Task 2.3: Data loading hook (useGameDetailsData)
- ✅ Task 2.4: Lineup draft manager (useLineupDraftManager)
- ✅ Task 2.5: Report draft manager (useReportDraftManager)
- ✅ Task 2.6: Player grouping, formation auto-build, DnD (3 hooks)
- ✅ Task 2.7: API normalization (replaced fetch with apiClient)

### **Task 2.8: Partial Progress** 🟡
- ✅ **useGameStateHandlers** created (443 lines)
  - handleGameWasPlayed
  - handlePostpone
  - handleSubmitFinalReport
  - handleConfirmFinalSubmission
  - handleEditReport
- ✅ **useReportHandlers** skeleton created (125 lines)
  - handleOpenPerformanceDialog
  - handleSavePerformanceReport
  - handleAutoFillRemaining
  - handleTeamSummaryClick
  - handleTeamSummarySave

---

## 🎯 **What Remains**

### **5 Handler Hooks to Create** (~600-800 lines total)
1. ❌ `useGoalsHandlers.js` (~150 lines)
2. ❌ `useSubstitutionsHandlers.js` (~100 lines)
3. ❌ `useCardsHandlers.js` (~100 lines)
4. ❌ `useFormationHandlers.js` (~50 lines)
5. ❌ `useDifficultyHandlers.js` (~50 lines)

### **Dialog State Management** (~100 lines)
6. ❌ Extract all dialog state into hooks/context

### **Main Component Integration** (~600 lines removed)
7. ❌ Replace inline handlers with hook calls
8. ❌ Remove duplicated state declarations
9. ❌ Simplify to thin orchestrator

---

## 📋 **Step-by-Step Implementation Guide**

---

### **STEP 1: Complete useReportHandlers** ⏱️ 30 mins

**Current State**: Skeleton exists, needs full implementation

**Location**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useReportHandlers.js`

**What to Extract**:
```javascript
// From index.jsx, find these functions:
const handleOpenPerformanceDialog = (player) => { ... };  // Line ~943
const handleSavePerformanceReport = async () => { ... };  // Line ~1031
const handleAutoFillRemaining = () => { ... };            // Line ~1094
const handleTeamSummaryClick = (summaryType) => { ... };  // Line ~1295
const handleTeamSummarySave = (summaryType, value) => { ... }; // Line ~1300
```

**Full Implementation**:
1. Find `handleSavePerformanceReport` in index.jsx (line ~1031)
2. Copy the ENTIRE function body (it's ~50 lines with API call)
3. Paste into useReportHandlers and adapt dependencies
4. Ensure all required params are in the hook signature
5. Test that report saving still works

**Dependencies Needed**:
- `gameId`, `game`, `selectedPlayer`, `playerPerfData`
- `localPlayerReports`, `setLocalPlayerReports`
- `localPlayerMatchStats`, `setLocalPlayerMatchStats`
- `showConfirmation`, `setShowConfirmationModal`
- `apiClient` for batch report save

**Success Criteria**:
- ✅ Can open player performance dialog
- ✅ Can save individual report
- ✅ Auto-fill creates default reports for all missing players
- ✅ Team summaries can be edited

---

### **STEP 2: Create useGoalsHandlers** ⏱️ 45 mins

**Create**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useGoalsHandlers.js`

**What to Extract**:
```javascript
// From index.jsx:
const handleAddGoal = () => { ... };                    // Line ~1323
const handleEditGoal = (goal) => { ... };               // Line ~1328
const handleDeleteGoal = async (goalId) => { ... };    // Line ~1336
const handleSaveGoal = async (goalData) => { ... };    // Line ~1352
const handleSaveOpponentGoal = async (opponentGoalData) => { ... }; // Line ~1398
```

**Hook Template**:
```javascript
import { apiClient } from '@/shared/api/client';
import { createGoal, updateGoal, deleteGoal } from '../../../api/goalsApi';

/**
 * useGoalsHandlers
 * 
 * Manages all goal-related CRUD operations
 */
export function useGoalsHandlers({
  gameId,
  goals,
  setGoals,
  activeGamePlayers,
  setShowGoalDialog,
  setSelectedGoal,
  showConfirmation,
  setShowConfirmationModal,
  refreshTimeline,
}) {
  
  const handleAddGoal = () => {
    setSelectedGoal(null);
    setShowGoalDialog(true);
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowGoalDialog(true);
  };

  const handleDeleteGoal = async (goalId) => {
    // Copy full implementation from index.jsx
    // Use deleteGoal API function
    // Update goals state
    // Refresh timeline
  };

  const handleSaveGoal = async (goalData) => {
    // Copy full implementation from index.jsx
    // Handle create vs update
    // Update goals state
    // Refresh timeline
  };

  const handleSaveOpponentGoal = async (opponentGoalData) => {
    // Copy full implementation from index.jsx
    // Handle opponent goals separately
  };

  return {
    handleAddGoal,
    handleEditGoal,
    handleDeleteGoal,
    handleSaveGoal,
    handleSaveOpponentGoal,
  };
}
```

**Dependencies**:
- Goals API functions (already imported in index.jsx)
- `goals` state, `activeGamePlayers`
- Dialog state setters
- Timeline refresh function

**Success Criteria**:
- ✅ Can add new goal
- ✅ Can edit existing goal
- ✅ Can delete goal with confirmation
- ✅ Goals update in UI immediately
- ✅ Timeline refreshes after goal changes

---

### **STEP 3: Create useSubstitutionsHandlers** ⏱️ 30 mins

**Create**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useSubstitutionsHandlers.js`

**What to Extract**:
```javascript
// From index.jsx:
const handleAddSubstitution = () => { ... };                        // Line ~1429
const handleEditSubstitution = (substitution) => { ... };           // Line ~1434
const handleDeleteSubstitution = async (subId) => { ... };          // Line ~1439
const handleSaveSubstitution = async (subData) => { ... };          // Line ~1455
```

**Hook Template** (Similar to useGoalsHandlers):
```javascript
import { createSubstitution, updateSubstitution, deleteSubstitution } from '../../../api/substitutionsApi';

export function useSubstitutionsHandlers({
  gameId,
  substitutions,
  setSubstitutions,
  activeGamePlayers,
  setShowSubstitutionDialog,
  setSelectedSubstitution,
  showConfirmation,
  setShowConfirmationModal,
  refreshTimeline,
}) {
  // Copy all 4 handler implementations from index.jsx
  // Follow same pattern as goals handlers
  
  return {
    handleAddSubstitution,
    handleEditSubstitution,
    handleDeleteSubstitution,
    handleSaveSubstitution,
  };
}
```

**Success Criteria**:
- ✅ Can add/edit/delete substitutions
- ✅ Timeline refreshes
- ✅ All validations work

---

### **STEP 4: Create useCardsHandlers** ⏱️ 30 mins

**Create**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useCardsHandlers.js`

**What to Extract**:
```javascript
// From index.jsx:
const handleAddCard = () => { ... };                    // Line ~1487
const handleEditCard = (card) => { ... };               // Line ~1492
const handleDeleteCard = async (cardId) => { ... };    // Line ~1507
const handleSaveCard = async (cardData) => { ... };    // Line ~1523
```

**Hook Template** (Same pattern as goals/subs):
```javascript
import { createCard, updateCard, deleteCard } from '../../../api/cardsApi';

export function useCardsHandlers({
  gameId,
  cards,
  setCards,
  activeGamePlayers,
  setShowCardDialog,
  setSelectedCard,
  showConfirmation,
  setShowConfirmationModal,
  refreshTimeline,
}) {
  // Copy all 4 handler implementations from index.jsx
  
  return {
    handleAddCard,
    handleEditCard,
    handleDeleteCard,
    handleSaveCard,
  };
}
```

**Success Criteria**:
- ✅ Can add/edit/delete cards
- ✅ Timeline refreshes
- ✅ All validations work

---

### **STEP 5: Create useFormationHandlers** ⏱️ 15 mins

**Create**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useFormationHandlers.js`

**What to Extract**:
```javascript
// From index.jsx:
const handleFormationChange = (newFormationType) => { ... };      // Line ~1624
const handlePositionClick = (posId, posData) => { ... };          // Line ~1631
const handleSelectPlayerForPosition = (player) => { ... };        // Line ~1638
```

**Hook Template**:
```javascript
export function useFormationHandlers({
  formation,
  setFormation,
  formationType,
  setFormationType,
  setManualFormationMode,
  setSelectedPosition,
  setSelectedPositionData,
  setShowPlayerSelectionDialog,
  updatePlayerStatus,
}) {
  
  const handleFormationChange = (newFormationType) => {
    if (window.confirm("Changing formation will clear all current position assignments. Continue?")) {
      setFormationType(newFormationType);
      setFormation({});
    }
  };

  const handlePositionClick = (posId, posData) => {
    setSelectedPosition(posId);
    setSelectedPositionData(posData);
    setShowPlayerSelectionDialog(true);
  };

  const handleSelectPlayerForPosition = (player) => {
    // Copy from index.jsx - it's ~20 lines
    // Handles player assignment to clicked position
  };

  return {
    handleFormationChange,
    handlePositionClick,
    handleSelectPlayerForPosition,
  };
}
```

**Success Criteria**:
- ✅ Can change formation type
- ✅ Can click position to assign player
- ✅ Manual mode activates correctly

---

### **STEP 6: Create useDifficultyHandlers** ⏱️ 15 mins

**Create**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/useDifficultyHandlers.js`

**What to Extract**:
```javascript
// From index.jsx:
const handleSaveDifficultyAssessment = async (assessment) => { ... };  // Line ~630
const handleDeleteDifficultyAssessment = async () => { ... };          // Line ~649
```

**Hook Template**:
```javascript
import { updateDifficultyAssessment, deleteDifficultyAssessment } from '../../../api/difficultyAssessmentApi';

export function useDifficultyHandlers({
  gameId,
  difficultyAssessment,
  setDifficultyAssessment,
  showConfirmation,
  setShowConfirmationModal,
}) {
  
  const handleSaveDifficultyAssessment = async (assessment) => {
    // Copy from index.jsx - ~15 lines
  };

  const handleDeleteDifficultyAssessment = async () => {
    // Copy from index.jsx - ~35 lines
  };

  return {
    handleSaveDifficultyAssessment,
    handleDeleteDifficultyAssessment,
  };
}
```

**Success Criteria**:
- ✅ Can save difficulty assessment
- ✅ Can delete difficulty assessment
- ✅ State updates correctly

---

### **STEP 7: Export All New Hooks** ⏱️ 5 mins

**Update**: `frontend/src/features/game-management/components/GameDetailsPage/hooks/index.js`

Add exports:
```javascript
export { useGameDetailsData } from './useGameDetailsData';
export { useLineupDraftManager } from './useLineupDraftManager';
export { useReportDraftManager } from './useReportDraftManager';
export { usePlayerGrouping } from './usePlayerGrouping';
export { useFormationAutoBuild } from './useFormationAutoBuild';
export { useTacticalBoardDragDrop } from './useTacticalBoardDragDrop';
export { useGameStateHandlers } from './useGameStateHandlers';
export { useReportHandlers } from './useReportHandlers';
export { useGoalsHandlers } from './useGoalsHandlers';
export { useSubstitutionsHandlers } from './useSubstitutionsHandlers';
export { useCardsHandlers } from './useCardsHandlers';
export { useFormationHandlers } from './useFormationHandlers';
export { useDifficultyHandlers } from './useDifficultyHandlers';
```

---

### **STEP 8: Integrate Hooks into Main Component** ⏱️ 1-2 hours

**File**: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Target Structure** (~200-250 lines):

```javascript
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/app/providers/DataProvider";
import { useToast } from "@/shared/ui/primitives/use-toast";
import { useFeature } from "@/shared/hooks";
import { apiClient } from "@/shared/api/client";
import { formations } from "./formations";
import { ConfirmationModal } from "@/shared/components";
import PageLoader from "@/shared/components/PageLoader";

// Import UI modules
import {
  GameHeaderModule,
  RosterSidebarModule,
  TacticalBoardModule,
  MatchAnalysisModule,
  DialogsModule
} from "./modules";

// Import ALL custom hooks
import {
  useGameDetailsData,
  useLineupDraftManager,
  useReportDraftManager,
  usePlayerGrouping,
  useFormationAutoBuild,
  useTacticalBoardDragDrop,
  useGameStateHandlers,
  useReportHandlers,
  useGoalsHandlers,
  useSubstitutionsHandlers,
  useCardsHandlers,
  useFormationHandlers,
  useDifficultyHandlers,
} from "./hooks";

export default function GameDetails() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");
  const { games, players, teams, gameRosters, gameReports, refreshData, isLoading, error, updateGameInCache, updateGameRostersInCache } = useData();
  const { toast } = useToast();

  // === SECTION 1: Formation State (Required Early) ===
  const [formationType, setFormationType] = useState("1-4-4-2");
  const [formation, setFormation] = useState({});
  const [manualFormationMode, setManualFormationMode] = useState(false);
  const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);
  const [isFinalizingGame, setIsFinalizingGame] = useState(false);

  // === SECTION 2: Data Hooks ===
  const gameData = useGameDetailsData(gameId, { games, players, teams });
  const { game, gamePlayers, matchDuration, setMatchDuration, finalScore, setFinalScore, teamSummary, setTeamSummary, isReadOnly, setIsReadOnly, setGame } = gameData;
  
  const draftManagers = useLineupDraftManager({ gameId, game, gamePlayers, gameRosters, isFinalizingGame, formation, setFormation, formationType, setFormationType, manualFormationMode, setManualFormationMode });
  const { localRosterStatuses, setLocalRosterStatuses, isAutosaving, autosaveError } = draftManagers;
  
  const reportManager = useReportDraftManager({ gameId, game, isFinalizingGame, teamSummary, setTeamSummary, finalScore, setFinalScore, matchDuration, setMatchDuration });
  
  const playerGrouping = usePlayerGrouping({ formation, gamePlayers, localRosterStatuses });
  const { playersOnPitch, benchPlayers, squadPlayers, activeGamePlayers } = playerGrouping;

  // === SECTION 3: Dialog State (Consolidated) ===
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showPlayerPerfDialog, setShowPlayerPerfDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerPerfData, setPlayerPerfData] = useState({});
  const [showTeamSummaryDialog, setShowTeamSummaryDialog] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);
  const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPositionData, setSelectedPositionData] = useState(null);
  
  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  
  const showConfirmation = (config) => {
    setConfirmationConfig(config);
    setShowConfirmationModal(true);
  };

  // === SECTION 4: Entity State (Goals, Subs, Cards, etc.) ===
  const [goals, setGoals] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [cards, setCards] = useState([]);
  const [difficultyAssessment, setDifficultyAssessment] = useState(null);
  const [teamStats, setTeamStats] = useState({});
  const [timeline, setTimeline] = useState([]);

  // === SECTION 5: Formation & DnD ===
  useFormationAutoBuild({ positions, gamePlayers, localRosterStatuses, formation, setFormation, manualFormationMode, setManualFormationMode });
  const dndHandlers = useTacticalBoardDragDrop({ positions, formation, setFormation, updatePlayerStatus: (id, status) => setLocalRosterStatuses(prev => ({...prev, [id]: status})), setManualFormationMode, showConfirmation, validatePlayerPosition });

  // === SECTION 6: All Handler Hooks ===
  const gameStateHandlers = useGameStateHandlers({ gameId, game, formation, formationType, gamePlayers, benchPlayers, localRosterStatuses, finalScore, matchDuration, teamSummary, /* ... all deps */ });
  const reportHandlers = useReportHandlers({ gameId, game, gamePlayers, /* ... all deps */ });
  const goalsHandlers = useGoalsHandlers({ gameId, goals, setGoals, activeGamePlayers, /* ... all deps */ });
  const subsHandlers = useSubstitutionsHandlers({ gameId, substitutions, setSubstitutions, /* ... all deps */ });
  const cardsHandlers = useCardsHandlers({ gameId, cards, setCards, /* ... all deps */ });
  const formationHandlers = useFormationHandlers({ formation, setFormation, formationType, setFormationType, /* ... all deps */ });
  const difficultyHandlers = useDifficultyHandlers({ gameId, difficultyAssessment, setDifficultyAssessment, /* ... all deps */ });

  // === SECTION 7: Data Loading Effects (Keep minimal) ===
  // Load goals, substitutions, cards, timeline, etc.
  // (Keep these as they are - they're just data fetching)

  // === SECTION 8: Early Returns ===
  if (isLoading || !gameId) return <PageLoader message="Loading game details..." />;
  if (error) return <div>Error: {error.message}</div>;
  if (!game) return <div>Game not found</div>;

  // === SECTION 9: Render (Module Composition) ===
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <GameHeaderModule {...headerProps} />
      <RosterSidebarModule {...rosterProps} />
      <TacticalBoardModule {...boardProps} />
      <MatchAnalysisModule {...analysisProps} />
      <DialogsModule {...dialogProps} />
      <ConfirmationModal {...confirmationProps} />
    </div>
  );
}
```

**Key Actions**:
1. **Remove ALL inline handler functions** (they're now in hooks)
2. **Call handler hooks** and destructure their return values
3. **Pass handlers to modules** via props
4. **Keep only**:
   - State declarations
   - Hook calls
   - Early returns
   - Module composition

**What to Remove**:
- ❌ All `const handleXXX = ...` function definitions
- ❌ Complex validation logic (moved to hooks)
- ❌ Inline API calls (moved to hooks)
- ❌ Derived state calculations (moved to hooks where possible)

---

### **STEP 9: Update Module Props** ⏱️ 30 mins

**For Each Module**, ensure handlers are passed correctly:

**Example - TacticalBoardModule**:
```javascript
<TacticalBoardModule
  tacticalBoardProps={{
    formations,
    formationType,
    positions,
    formation,
    onFormationChange: formationHandlers.handleFormationChange,  // ✅ From hook
    onPositionDrop: dndHandlers.handlePositionDrop,              // ✅ From hook
    onRemovePlayer: dndHandlers.handleRemovePlayerFromPosition,  // ✅ From hook
    onPlayerClick: reportHandlers.handleOpenPerformanceDialog,   // ✅ From hook
    onPositionClick: formationHandlers.handlePositionClick,      // ✅ From hook
    // ... other props
  }}
/>
```

**Do this for all 5 modules**.

---

### **STEP 10: Testing Checklist** ⏱️ 1 hour

Run through EVERY feature:

#### **Game State Transitions**:
- [ ] Scheduled → Played (with validation)
- [ ] Played → Done (finalize report)
- [ ] Done → Played (edit report)
- [ ] Any → Postponed

#### **Player Reports**:
- [ ] Open performance dialog
- [ ] Save individual report
- [ ] Auto-fill missing reports
- [ ] Edit team summaries

#### **Goals**:
- [ ] Add goal
- [ ] Edit goal
- [ ] Delete goal
- [ ] Opponent goals

#### **Substitutions**:
- [ ] Add substitution
- [ ] Edit substitution
- [ ] Delete substitution

#### **Cards**:
- [ ] Add card (yellow/red)
- [ ] Edit card
- [ ] Delete card

#### **Formation**:
- [ ] Change formation type
- [ ] Drag & drop players
- [ ] Click position to assign
- [ ] Out-of-position warnings

#### **Difficulty Assessment** (if enabled):
- [ ] Save assessment
- [ ] Delete assessment

---

## 📏 **Success Metrics**

### **Quantitative**:
- [ ] Main component ≤ 250 lines ✨ **PRIMARY GOAL**
- [ ] All handler functions extracted into hooks
- [ ] No linter errors
- [ ] All existing tests pass

### **Qualitative**:
- [ ] Component is readable (mostly hooks + composition)
- [ ] Each hook is self-contained and testable
- [ ] No "spaghetti relocation" (hooks are clean)
- [ ] Code is maintainable for 3+ years

---

## ⚡ **Time Estimate**

| Task | Time | Cumulative |
|---|---|---|
| Complete useReportHandlers | 30 mins | 30 mins |
| Create useGoalsHandlers | 45 mins | 1h 15m |
| Create useSubstitutionsHandlers | 30 mins | 1h 45m |
| Create useCardsHandlers | 30 mins | 2h 15m |
| Create useFormationHandlers | 15 mins | 2h 30m |
| Create useDifficultyHandlers | 15 mins | 2h 45m |
| Export all hooks | 5 mins | 2h 50m |
| Integrate hooks into main component | 1-2 hours | 4h 50m |
| Update module props | 30 mins | 5h 20m |
| Testing & verification | 1 hour | **6h 20m** |

**Total**: ~6-7 hours of focused work

---

## 💡 **Pro Tips**

1. **Work Incrementally**: Extract one hook at a time, test, commit
2. **Copy-Paste is OK**: You're moving code, not rewriting it
3. **Test After Each Hook**: Don't wait until the end
4. **Use Git Branches**: Create `task-2.8-goals`, `task-2.8-subs`, etc.
5. **Don't Over-Engineer**: Keep hooks simple, focus on extraction
6. **Watch for Missing Dependencies**: If a handler breaks, check hook params
7. **Console Logs are Your Friend**: Keep the logging we added
8. **Commit Often**: Every hook extraction is a win

---

## 🚨 **Common Pitfalls to Avoid**

1. **❌ Forgetting to pass dependencies to hooks**
   - Solution: Check what the handler uses, add to hook params

2. **❌ Breaking state updates**
   - Solution: Ensure setters are passed correctly

3. **❌ Missing API imports in hooks**
   - Solution: Copy import statements from index.jsx

4. **❌ Confirmation dialogs not working**
   - Solution: Ensure `showConfirmation` is passed to all hooks

5. **❌ Timeline not refreshing**
   - Solution: Pass `refreshTimeline` function to goals/subs/cards hooks

---

## 🎯 **Final Target Structure**

```
GameDetailsPage/
├── index.jsx                 (~250 lines) ✨ THIN CONTAINER
├── formations.js             (unchanged)
├── hooks/
│   ├── index.js              (barrel export)
│   ├── useGameDetailsData.js         ✅
│   ├── useLineupDraftManager.js      ✅
│   ├── useReportDraftManager.js      ✅
│   ├── usePlayerGrouping.js          ✅
│   ├── useFormationAutoBuild.js      ✅
│   ├── useTacticalBoardDragDrop.js   ✅
│   ├── useGameStateHandlers.js       ✅
│   ├── useReportHandlers.js          🟡 Partial
│   ├── useGoalsHandlers.js           ❌ TODO
│   ├── useSubstitutionsHandlers.js   ❌ TODO
│   ├── useCardsHandlers.js           ❌ TODO
│   ├── useFormationHandlers.js       ❌ TODO
│   └── useDifficultyHandlers.js      ❌ TODO
└── modules/                  ✅ (already extracted)
```

---

## 🏆 **Victory Condition**

When you run:
```bash
(Get-Content "frontend\src\features\game-management\components\GameDetailsPage\index.jsx" | Measure-Object -Line).Lines
```

And see: **≤ 250** 🎉

You've created a **maintainable component for 3+ years**, not just "pragmatically okay for 6 months."

---

**End of Implementation Plan** ✅

Good luck! The patterns are solid. Now it's just execution. 💪


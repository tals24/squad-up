# GameDetailsPage Decomposition Map

**Component**: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`  
**Current Size**: 2,395 lines  
**Target Size**: ≤ 250 lines  
**Reduction Needed**: 90% (extract ~2,145 lines)

**Date Created**: 2024-12-28  
**Phase**: Phase 1 - Pilot Decomposition  
**Task**: 2.1 - Create decomposition map before moving code

---

## 📋 Table of Contents

1. [Responsibilities Inventory](#responsibilities-inventory)
2. [State Analysis (40+ state variables)](#state-analysis)
3. [Effects Analysis (12 useEffect hooks)](#effects-analysis)
4. [Handler Functions (30+ handlers)](#handler-functions)
5. [Derived State & Computations](#derived-state--computations)
6. [API Integration Points](#api-integration-points)
7. [Stable Boundaries for Extraction](#stable-boundaries-for-extraction)
8. [Target Folder Layout](#target-folder-layout)
9. [Extraction Priority & Sequence](#extraction-priority--sequence)

---

## 1. Responsibilities Inventory

### What This Component Does (Too Much!)

**Primary Responsibilities** (should keep):
- ✅ Route param parsing (get game ID from URL)
- ✅ Orchestrate hooks and modules
- ✅ Compose UI sections (header, sidebars, board, dialogs)

**Secondary Responsibilities** (should extract):
1. **Data Loading**  
   - Direct API fetch for game details  
   - Fallback to DataProvider if fetch fails  
   - Load team data, players, rosters, reports

2. **Draft Management (Scheduled Games)**  
   - Load lineup draft from API  
   - Merge draft with existing roster  
   - Autosave draft changes (2.5s debounce)  
   - Handle draft precedence logic

3. **Report Draft Management (Played/Done Games)**  
   - Load report drafts from API  
   - Merge draft data with saved reports  
   - Autosave report changes  
   - Track dirty state

4. **Formation & Roster Logic**  
   - Build formation from current data  
   - Auto-populate positions  
   - Manual vs auto mode switching  
   - Player grouping (bench, squad, on-pitch)

5. **Drag & Drop Handling**  
   - Drag start/end state  
   - Drop validation  
   - Out-of-position confirmation  
   - Position assignment

6. **Event Management (Goals/Cards/Subs)**  
   - CRUD operations for each event type  
   - Timeline reconstruction  
   - Event validation  
   - API integration

7. **Player Performance**  
   - Pre-fetch team stats (for instant display)  
   - Performance dialog data preparation  
   - Report save/validation  
   - Auto-fill remaining reports

8. **Game State Transitions**  
   - "Game Was Played" validation + transition  
   - "Submit Final Report" validation + transition  
   - Postpone game  
   - Edit report (reopen game)

9. **Validation Logic**  
   - Starting lineup validation (11 players, 1 GK)  
   - Formation completeness checks  
   - Report completeness validation  
   - Position validation (out-of-position warnings)

10. **Dialog State Management**  
    - 7 different dialogs (Goal, Card, Sub, Performance, Final, Selection, Summary)  
    - Dialog open/close state  
    - Selected item tracking  
    - Confirmation modals

11. **Difficulty Assessment** (feature-flagged)  
    - Load/save/delete assessment  
    - Feature flag check  
    - API integration

12. **Match Duration & Score**  
    - Load from game data  
    - Update local state  
    - Sync with backend

13. **Team Summary**  
    - Load from game data  
    - Edit summaries (4 types)  
    - Save to game

14. **Timeline/Match Stats**  
    - Fetch timeline events  
    - Fetch player match stats  
    - Reconstruct game state from timeline

---

## 2. State Analysis (40+ State Variables)

### 2.1 Core Game Data (5 variables)
```javascript
const [game, setGame] = useState(null);                    // Main game object
const [gamePlayers, setGamePlayers] = useState([]);        // Players for this game's team
const [finalScore, setFinalScore] = useState({ ourScore: 0, opponentScore: 0 });
const [matchDuration, setMatchDuration] = useState({       // Regular + extra time
  regularTime: 90,
  firstHalfExtraTime: 0,
  secondHalfExtraTime: 0
});
const [teamSummary, setTeamSummary] = useState({           // 4 summary types
  defenseSummary: "",
  midfieldSummary: "",
  attackSummary: "",
  generalSummary: "",
});
```

**Extraction Target**: `hooks/useGameDetailsData.js`  
**Why**: Data loading logic separate from UI

---

### 2.2 Formation & Roster State (5 variables)
```javascript
const [localRosterStatuses, setLocalRosterStatuses] = useState({}); // Draft roster
const [formationType, setFormationType] = useState("1-4-4-2");
const [formation, setFormation] = useState({});                      // Position -> Player map
const [manualFormationMode, setManualFormationMode] = useState(false);
const positions = useMemo(() => formations[formationType]?.positions || {}, [formationType]);
```

**Extraction Target**: `hooks/useFormationManager.js`  
**Why**: Complex formation logic + auto-build behavior

---

### 2.3 Player Reports & Match Stats (4 variables)
```javascript
const [localPlayerReports, setLocalPlayerReports] = useState({});      // Report drafts
const [localPlayerMatchStats, setLocalPlayerMatchStats] = useState({}); // Fouls, etc.
const [teamStats, setTeamStats] = useState({});                        // Pre-fetched for dialogs
const [isLoadingTeamStats, setIsLoadingTeamStats] = useState(false);
```

**Extraction Target**: `hooks/usePlayerReportsManager.js`  
**Why**: Report draft autosave + merge logic

---

### 2.4 Events State (9 variables - Goals/Cards/Subs)
```javascript
// Goals
const [goals, setGoals] = useState([]);
const [showGoalDialog, setShowGoalDialog] = useState(false);
const [selectedGoal, setSelectedGoal] = useState(null);

// Substitutions
const [substitutions, setSubstitutions] = useState([]);
const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
const [selectedSubstitution, setSelectedSubstitution] = useState(null);

// Cards
const [cards, setCards] = useState([]);
const [showCardDialog, setShowCardDialog] = useState(false);
const [selectedCard, setSelectedCard] = useState(null);
```

**Extraction Target**: `hooks/useGameEvents.js`  
**Why**: Events CRUD + timeline logic is self-contained

---

### 2.5 Timeline & Difficulty (2 variables)
```javascript
const [timeline, setTimeline] = useState([]);                    // Unified event timeline
const [difficultyAssessment, setDifficultyAssessment] = useState(null);
```

**Extraction Target**: `hooks/useTimeline.js` + `hooks/useDifficultyAssessment.js`  
**Why**: Separate concerns

---

### 2.6 Dialog State Management (10 variables)
```javascript
// Player Performance Dialog
const [showPlayerPerfDialog, setShowPlayerPerfDialog] = useState(false);
const [selectedPlayer, setSelectedPlayer] = useState(null);
const [playerPerfData, setPlayerPerfData] = useState({});

// Final Report Dialog
const [showFinalReportDialog, setShowFinalReportDialog] = useState(false);

// Player Selection Dialog (for position assignment)
const [showPlayerSelectionDialog, setShowPlayerSelectionDialog] = useState(false);
const [selectedPosition, setSelectedPosition] = useState(null);
const [selectedPositionData, setSelectedPositionData] = useState(null);

// Team Summary Dialog
const [showTeamSummaryDialog, setShowTeamSummaryDialog] = useState(false);
const [selectedSummaryType, setSelectedSummaryType] = useState(null);
```

**Extraction Target**: Keep in main component (orchestration layer)  
**Why**: Dialog coordination is part of page orchestration

---

### 2.7 Drag & Drop State (3 variables)
```javascript
const [draggedPlayer, setDraggedPlayer] = useState(null);
const [isDragging, setIsDragging] = useState(false);
const [pendingPlayerPosition, setPendingPlayerPosition] = useState(null); // For out-of-position warning
```

**Extraction Target**: `hooks/useDragAndDrop.js`  
**Why**: DnD logic is self-contained

---

### 2.8 Validation & Confirmation State (3 variables)
```javascript
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [confirmationConfig, setConfirmationConfig] = useState({
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  onConfirm: null,
  onCancel: null,
  type: "warning"
});
const [pendingAction, setPendingAction] = useState(null);
```

**Extraction Target**: Keep in main component  
**Why**: Confirmation is UI orchestration

---

### 2.9 Loading & Error State (6 variables)
```javascript
const [isSaving, setIsSaving] = useState(false);          // General save indicator
const [isReadOnly, setIsReadOnly] = useState(false);      // Done game mode
const [isAutosaving, setIsAutosaving] = useState(false);  // Autosave indicator
const [autosaveError, setAutosaveError] = useState(null); // Autosave errors
const [isFetchingGame, setIsFetchingGame] = useState(true); // Initial game load
const [isFinalizingGame, setIsFinalizingGame] = useState(false); // Final transition blocking
```

**Extraction Target**: Mostly hooks (each hook manages own loading state)  
**Why**: Co-locate loading state with data fetching logic

---

### State Summary

| Category | Variables | Extraction Target | Priority |
|---|---:|---|---|
| Core Game Data | 5 | `useGameDetailsData` | 🔥 High |
| Formation & Roster | 5 | `useFormationManager` | 🔥 High |
| Player Reports | 4 | `usePlayerReportsManager` | 🔥 High |
| Events (Goals/Cards/Subs) | 9 | `useGameEvents` | 🔴 Medium |
| Timeline | 1 | `useTimeline` | 🟡 Low |
| Difficulty | 1 | `useDifficultyAssessment` | 🟡 Low |
| Dialogs | 10 | Keep in page | N/A |
| Drag & Drop | 3 | `useDragAndDrop` | 🔴 Medium |
| Validation | 3 | Keep in page | N/A |
| Loading | 6 | Distributed in hooks | N/A |
| **TOTAL** | **47** | **~35 move, ~12 stay** | |

---

## 3. Effects Analysis (12 useEffect Hooks)

### Effect 1: Game Data Loading (Lines 148-295)
```javascript
useEffect(() => {
  // Fetch game directly to ensure latest draft data
  // Fallback to DataProvider if fetch fails
  // Initialize: matchDuration, finalScore, teamSummary, isReadOnly
}, [gameId, games]);
```
**Purpose**: Load game + initial state  
**Dependencies**: `gameId`, `games` (DataProvider)  
**Extraction Target**: `useGameDetailsData` hook  
**Priority**: 🔥 **CRITICAL** (needed first)

---

### Effect 2: Game Players Loading (Lines 296-313)
```javascript
useEffect(() => {
  // Filter players for this game's team
  if (game?.team && players.length > 0 && teams.length > 0) {
    // Find team, get players
  }
}, [game, players, teams]);
```
**Purpose**: Derive gamePlayers from global players  
**Extraction Target**: `useGameDetailsData` hook  
**Priority**: 🔥 **HIGH**

---

### Effect 3: Lineup Draft Loading - Scheduled Games (Lines 314-340)
```javascript
useEffect(() => {
  // SCHEDULED: Load lineup draft
  // Precedence: draft → gameRosters → empty
  if (game?.status === "Scheduled") {
    // Fetch draft, merge with rosters
  }
}, [game, gameRosters, gameId]);
```
**Purpose**: Load + merge lineup draft (Scheduled games)  
**Extraction Target**: `useLineupDraftManager` hook  
**Priority**: 🔥 **CRITICAL** (complex logic)

---

### Effect 4: Report Draft Loading - Played/Done Games (Lines 341-443)
```javascript
useEffect(() => {
  // PLAYED/DONE: Load report drafts
  // Merge draft data with saved reports
  if (game && (game.status === "Played" || game.status === "Done")) {
    // Fetch report drafts, merge with gameReports
  }
}, [game, gameReports, gameId]);
```
**Purpose**: Load + merge report drafts (Played/Done games)  
**Extraction Target**: `useReportDraftManager` hook  
**Priority**: 🔥 **CRITICAL** (complex merge logic)

---

### Effect 5: Pre-fetch Team Stats - Played Games (Lines 444-547)
```javascript
useEffect(() => {
  // PLAYED: Pre-fetch team stats for instant dialog display
  if (game?.status === "Played" && gamePlayers.length > 0) {
    const fetchAllStats = async () => {
      // Parallel fetch for all players
    };
    fetchAllStats();
  }
}, [game?.status, gameId, gamePlayers]);
```
**Purpose**: Pre-load player stats for performance dialogs  
**Extraction Target**: `usePlayerStats` hook  
**Priority**: 🔴 **MEDIUM**

---

### Effect 6: Load Goals (Lines 548-611)
```javascript
useEffect(() => {
  if (gameId && game) {
    fetchGoals(gameId).then(setGoals);
  }
}, [gameId, game]);
```
**Purpose**: Load goals for this game  
**Extraction Target**: `useGameEvents` hook  
**Priority**: 🔴 **MEDIUM**

---

### Effect 7: Load Substitutions (Lines 612-693)
```javascript
useEffect(() => {
  if (gameId && game) {
    fetchSubstitutions(gameId).then(setSubstitutions);
  }
}, [gameId, game]);
```
**Purpose**: Load substitutions  
**Extraction Target**: `useGameEvents` hook  
**Priority**: 🔴 **MEDIUM**

---

### Effect 8: Load Cards (Lines 694-728)
```javascript
useEffect(() => {
  if (gameId && game) {
    fetchCards(gameId).then(setCards);
  }
}, [gameId, game]);
```
**Purpose**: Load cards  
**Extraction Target**: `useGameEvents` hook  
**Priority**: 🔴 **MEDIUM**

---

### Effect 9: Load Timeline (Lines 729-810)
```javascript
useEffect(() => {
  if (gameId && game) {
    fetchMatchTimeline(gameId).then(setTimeline);
  }
}, [gameId, game]);
```
**Purpose**: Load unified timeline  
**Extraction Target**: `useTimeline` hook  
**Priority**: 🟡 **LOW**

---

### Effect 10: Load Difficulty Assessment (Lines 811-877)
```javascript
useEffect(() => {
  if (gameId && game && isDifficultyAssessmentEnabled) {
    fetchDifficultyAssessment(gameId).then(setDifficultyAssessment);
  }
}, [gameId, game, isDifficultyAssessmentEnabled]);
```
**Purpose**: Load difficulty (feature-flagged)  
**Extraction Target**: `useDifficultyAssessment` hook  
**Priority**: 🟡 **LOW**

---

### Effect 11: Auto-build Formation (Lines 878-1082)
```javascript
useEffect(() => {
  // Auto-populate formation from current roster
  // Skip if manual mode
  // Build position map from localRosterStatuses
  if (!manualFormationMode && game) {
    // Complex auto-build logic (~200 lines!)
  }
}, [localRosterStatuses, formationType, game, manualFormationMode, gamePlayers, positions]);
```
**Purpose**: Auto-populate formation positions  
**Extraction Target**: `useFormationManager` hook  
**Priority**: 🔥 **CRITICAL** (huge, complex logic)

---

### Effect 12: Autosave Hook (from `useAutosave`)
```javascript
useAutosave({
  data: game?.status === "Scheduled" ? localRosterStatuses : localPlayerReports,
  onSave: game?.status === "Scheduled" ? handleDraftSave : handleReportDraftSave,
  debounceMs: 2500,
  shouldSkip: isReadOnly || isFinalizingGame || !game,
  dependencies: [game?.status, isReadOnly, isFinalizingGame, game]
});
```
**Purpose**: Debounced autosave for drafts  
**Extraction Target**: Keep hook, but move save handlers  
**Priority**: 🔥 **HIGH** (must preserve timing)

---

### Effects Summary

| Effect | Purpose | Lines | Extraction Target | Priority |
|---|---|---:|---|---|
| 1 | Game data loading | 148 | `useGameDetailsData` | 🔥 Critical |
| 2 | Game players | 18 | `useGameDetailsData` | 🔥 High |
| 3 | Lineup draft (Scheduled) | 27 | `useLineupDraftManager` | 🔥 Critical |
| 4 | Report draft (Played/Done) | 103 | `useReportDraftManager` | 🔥 Critical |
| 5 | Pre-fetch team stats | 104 | `usePlayerStats` | 🔴 Medium |
| 6 | Load goals | 64 | `useGameEvents` | 🔴 Medium |
| 7 | Load substitutions | 82 | `useGameEvents` | 🔴 Medium |
| 8 | Load cards | 35 | `useGameEvents` | 🔴 Medium |
| 9 | Load timeline | 82 | `useTimeline` | 🟡 Low |
| 10 | Load difficulty | 67 | `useDifficultyAssessment` | 🟡 Low |
| 11 | Auto-build formation | 205 | `useFormationManager` | 🔥 Critical |
| 12 | Autosave (external) | Hook | Distributed | 🔥 High |
| **TOTAL** | | **~995 lines** | **Extract** | |

**Impact**: Extracting effects alone reduces main file by **~1,000 lines (42%)**!

---

## 4. Handler Functions (30+ Handlers)

### 4.1 Game State Transition Handlers (4)
```javascript
handleGameWasPlayed()           // Lines 1158-1397 (240 lines!) - Transition Scheduled → Played
handlePostpone()                // Lines 1398-1431 - Postpone game
handleSubmitFinalReport()       // Lines 1637-1672 - Validate + show final dialog
handleConfirmFinalSubmission()  // Lines 1673-1826 - Finalize game (Played → Done)
handleEditReport()              // Lines 1827-1832 - Reopen Done game
```
**Extraction Target**: `handlers/gameTransitions.js`  
**Priority**: 🔥 **CRITICAL** (core business logic)

---

### 4.2 Player Performance Handlers (3)
```javascript
handleOpenPerformanceDialog()   // Lines 1432-1519 - Prep player data + open dialog
handleSavePerformanceReport()   // Lines 1520-1589 - Save report + update local state
handleAutoFillRemaining()       // Lines 1590-1636 - Auto-fill missing reports
```
**Extraction Target**: `handlers/playerPerformance.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.3 Team Summary Handlers (2)
```javascript
handleTeamSummaryClick()        // Lines 1833-1837 - Open summary dialog
handleTeamSummarySave()         // Lines 1838-1860 - Save summary to game
```
**Extraction Target**: `handlers/teamSummary.js`  
**Priority**: 🟡 **LOW**

---

### 4.4 Goal Event Handlers (5)
```javascript
handleAddGoal()                 // Lines 1861-1865 - Open dialog for new goal
handleEditGoal()                // Lines 1866-1872 - Open dialog with existing goal
handleDeleteGoal()              // Lines 1874-1889 - Delete goal + refresh
handleSaveGoal()                // Lines 1890-1935 - Create/update goal
handleSaveOpponentGoal()        // Lines 1936-1966 - Special handler for opponent goals
```
**Extraction Target**: `handlers/goals.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.5 Substitution Event Handlers (4)
```javascript
handleAddSubstitution()         // Lines 1967-1971
handleEditSubstitution()        // Lines 1972-1976
handleDeleteSubstitution()      // Lines 1977-1992
handleSaveSubstitution()        // Lines 1993-2024
```
**Extraction Target**: `handlers/substitutions.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.6 Card Event Handlers (4)
```javascript
handleAddCard()                 // Lines 2025-2029
handleEditCard()                // Lines 2030-2043
handleDeleteCard()              // Lines 2045-2060
handleSaveCard()                // Lines 2061-2160
```
**Extraction Target**: `handlers/cards.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.7 Drag & Drop Handlers (5)
```javascript
handleDragStart()               // Lines 2161-2174 - Set dragged player
handleDragEnd()                 // Lines 2175-2180 - Clear drag state
handlePositionDrop()            // Lines 2181-2250 - Validate + assign position
handleRemovePlayerFromPosition()// Lines 2251-2258 - Clear position
handleSelectPlayerForPosition() // Lines 2273-2302 - Select via dialog
```
**Extraction Target**: `handlers/dragAndDrop.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.8 Formation Handlers (2)
```javascript
handleFormationChange()         // Lines 2259-2265 - Change formation type
handlePositionClick()           // Lines 2266-2272 - Open player selection dialog
```
**Extraction Target**: `handlers/formation.js`  
**Priority**: 🔴 **MEDIUM**

---

### 4.9 Confirmation Handlers (2)
```javascript
handleConfirmation()            // Lines 1083-1089 - Execute pending action
handleConfirmationCancel()      // Lines 1090-1096 - Cancel action
```
**Extraction Target**: Keep in main component  
**Priority**: N/A (orchestration)

---

### 4.10 Difficulty Assessment Handlers (2)
```javascript
handleSaveDifficultyAssessment()  // Lines 1098-1116
handleDeleteDifficultyAssessment() // Lines 1117-1157
```
**Extraction Target**: `handlers/difficultyAssessment.js`  
**Priority**: 🟡 **LOW**

---

### Handlers Summary

| Category | Handlers | Total Lines | Extraction Target | Priority |
|---|---:|---:|---|---|
| Game Transitions | 5 | ~380 | `handlers/gameTransitions.js` | 🔥 Critical |
| Player Performance | 3 | ~205 | `handlers/playerPerformance.js` | 🔴 Medium |
| Goals | 5 | ~147 | `handlers/goals.js` | 🔴 Medium |
| Substitutions | 4 | ~58 | `handlers/substitutions.js` | 🔴 Medium |
| Cards | 4 | ~136 | `handlers/cards.js` | 🔴 Medium |
| Drag & Drop | 5 | ~122 | `handlers/dragAndDrop.js` | 🔴 Medium |
| Formation | 2 | ~14 | `handlers/formation.js` | 🔴 Medium |
| Team Summary | 2 | ~28 | `handlers/teamSummary.js` | 🟡 Low |
| Difficulty | 2 | ~60 | `handlers/difficultyAssessment.js` | 🟡 Low |
| Confirmation | 2 | ~14 | Keep in page | N/A |
| **TOTAL** | **34** | **~1,164 lines** | **Extract** | |

**Impact**: Extracting handlers reduces main file by **~1,200 lines (50%)**!

---

## 5. Derived State & Computations

### 5.1 Player Grouping (useMemo - Complex!)
```javascript
// Compute bench, squad, and on-pitch players (Lines ~900-1082)
const { playersOnPitch, benchPlayers, squadPlayers, playerIdsToReconstruct } = useMemo(() => {
  // Huge computation to group players by status
  // Build reverse maps for position assignment
  // ~180 lines of complex logic!
}, [localRosterStatuses, formation, gamePlayers]);
```
**Extraction Target**: `hooks/usePlayerGrouping.js`  
**Priority**: 🔥 **CRITICAL** (huge computed value)

---

### 5.2 Match Stats Computation
```javascript
// Compute team stats from player reports
const matchStats = useMemo(() => {
  // Aggregate player stats to team stats
}, [localPlayerReports, localPlayerMatchStats]);
```
**Extraction Target**: `hooks/useMatchStats.js`  
**Priority**: 🔴 **MEDIUM**

---

### 5.3 Report Completeness
```javascript
// Count players with/without reports
const { missingReportsCount, remainingReportsCount } = useMemo(() => {
  // Calculate from localPlayerReports
}, [localPlayerReports, playersOnPitch]);
```
**Extraction Target**: `hooks/useReportStats.js`  
**Priority**: 🔴 **MEDIUM**

---

### 5.4 Player Status Helpers
```javascript
// Check if player has report, needs report
const hasReport = (playerId) => { ... };
const needsReport = (playerId) => { ... };
const getPlayerStatus = (playerId) => { ... };
```
**Extraction Target**: `hooks/usePlayerStatus.js`  
**Priority**: 🔴 **MEDIUM**

---

### Derived State Summary

| Computation | Lines | Extraction Target | Priority |
|---|---:|---|---|
| Player Grouping | ~180 | `usePlayerGrouping` | 🔥 Critical |
| Match Stats | ~50 | `useMatchStats` | 🔴 Medium |
| Report Stats | ~30 | `useReportStats` | 🔴 Medium |
| Player Status | ~20 | `usePlayerStatus` | 🔴 Medium |
| **TOTAL** | **~280 lines** | **Extract** | |

---

## 6. API Integration Points

### 6.1 Direct Fetch Calls (Hardcoded URLs)
```javascript
// Game data
fetch('http://localhost:3001/api/games/${gameId}')

// Draft save
fetch('http://localhost:3001/api/games/${gameId}/lineup-draft')

// Report draft save
fetch('http://localhost:3001/api/games/${gameId}/report-draft')
```
**Issue**: ❌ Violates `frontendImproved.md` (must use `apiClient`)  
**Fix**: Replace with `shared/api/client.js`  
**Priority**: 🔥 **HIGH** (Task 2.7)

---

### 6.2 Imported API Functions (Good!)
```javascript
// Goals
import { fetchGoals, createGoal, updateGoal, deleteGoal } from "../../api/goalsApi";

// Substitutions
import { fetchSubstitutions, createSubstitution, updateSubstitution, deleteSubstitution } from "../../api/substitutionsApi";

// Cards
import { fetchCards, createCard, updateCard, deleteCard } from "../../api/cardsApi";

// Stats
import { fetchPlayerStats } from "../../api/playerStatsApi";
import { fetchPlayerMatchStats, upsertPlayerMatchStats } from "../../api/playerMatchStatsApi";

// Timeline
import { fetchMatchTimeline } from "../../api/timelineApi";

// Difficulty
import { fetchDifficultyAssessment, updateDifficultyAssessment, deleteDifficultyAssessment } from "../../api/difficultyAssessmentApi";
```
**Status**: ✅ Good pattern (feature-specific API modules)  
**Action**: Keep using these

---

### 6.3 DataProvider Dependencies
```javascript
const { 
  games, players, teams, gameRosters, gameReports, 
  refreshData, isLoading, error, 
  updateGameInCache, updateGameRostersInCache 
} = useData();
```
**Issue**: ⚠️ Global provider tightly couples page to data layer  
**Strategy**: Keep for now, but isolate usage in data hooks  
**Priority**: 🟡 **LOW** (Phase 2 concern)

---

## 7. Stable Boundaries for Extraction

### What CAN Move Safely (No Behavior Change):

#### ✅ **SAFE - Pure Data Loading**
- Game fetch logic → `useGameDetailsData`
- Players filtering → `useGameDetailsData`
- Draft loading → `useLineupDraftManager`
- Report draft loading → `useReportDraftManager`

**Why Safe**: Pure data transformation, no side effects on other code

---

#### ✅ **SAFE - Self-Contained Events**
- Goals CRUD → `useGameEvents` (goals slice)
- Substitutions CRUD → `useGameEvents` (subs slice)
- Cards CRUD → `useGameEvents` (cards slice)
- Timeline fetch → `useTimeline`

**Why Safe**: Events are independent, don't affect formation or reports

---

#### ✅ **SAFE - Pure Computations**
- Player grouping → `usePlayerGrouping`
- Match stats calculation → `useMatchStats`
- Report completeness → `useReportStats`

**Why Safe**: Pure functions, deterministic output from input

---

#### ✅ **SAFE - Isolated UI Logic**
- Drag & Drop handlers → `useDragAndDrop`
- Formation change → `useFormationManager`

**Why Safe**: Self-contained UI interaction, clear boundaries

---

### ⚠️ **RISKY - Complex Interdependencies**

#### ⚠️ Auto-build Formation (Lines 878-1082)
**Why Risky**: 
- Depends on: `localRosterStatuses`, `formationType`, `gamePlayers`, `positions`
- Updates: `formation`, `manualFormationMode`
- Complex logic with many edge cases

**Strategy**: Extract to `useFormationManager` but test HEAVILY

---

#### ⚠️ Game Transition Handlers
**Why Risky**:
- `handleGameWasPlayed`: 240 lines, validates lineup, updates game status, clears draft
- `handleConfirmFinalSubmission`: Validates reports, finalizes game, navigates away
- Multiple side effects and state updates

**Strategy**: Extract to handlers file but keep interface identical

---

### 🚫 **DO NOT TOUCH YET**
- Autosave hook timing (currently working, fragile)
- Dialog state orchestration (main component responsibility)
- Confirmation flow (main component responsibility)

---

## 8. Target Folder Layout

```
GameDetailsPage/
├── index.jsx                          # ✅ TARGET: ≤250 lines (orchestration only)
│   └── Responsibilities:
│       - Parse route params
│       - Call hooks
│       - Compose UI modules
│       - Manage dialog state
│       - Handle confirmations
│
├── hooks/                             # 🆕 NEW: Extract state + logic here
│   ├── useGameDetailsData.js          # Game fetch + initial state (Effect 1, 2)
│   ├── useLineupDraftManager.js       # Draft load + autosave (Scheduled) (Effect 3)
│   ├── useReportDraftManager.js       # Report draft load + autosave (Played/Done) (Effect 4)
│   ├── useFormationManager.js         # Formation auto-build + manual mode (Effect 11)
│   ├── usePlayerGrouping.js           # Compute bench/squad/onPitch (~180 lines)
│   ├── useGameEvents.js               # Goals/Cards/Subs CRUD (Effects 6-8)
│   ├── useTimeline.js                 # Timeline fetch (Effect 9)
│   ├── usePlayerStats.js              # Pre-fetch team stats (Effect 5)
│   ├── useDifficultyAssessment.js     # Difficulty (Effect 10, feature-flagged)
│   ├── useDragAndDrop.js              # DnD state + validation
│   ├── useMatchStats.js               # Aggregate player stats
│   ├── useReportStats.js              # Count reports
│   └── index.js                       # Barrel export
│
├── handlers/                          # 🆕 NEW: Extract event handlers
│   ├── gameTransitions.js             # handleGameWasPlayed, handleSubmitFinalReport, etc.
│   ├── playerPerformance.js           # handleOpenPerf, handleSavePerf, handleAutoFill
│   ├── goals.js                       # handleAddGoal, handleSaveGoal, etc.
│   ├── substitutions.js               # handleAddSub, handleSaveSub, etc.
│   ├── cards.js                       # handleAddCard, handleSaveCard, etc.
│   ├── dragAndDrop.js                 # handleDragStart, handlePositionDrop, etc.
│   ├── formation.js                   # handleFormationChange, handlePositionClick
│   ├── teamSummary.js                 # handleTeamSummarySave
│   ├── difficultyAssessment.js        # handleSaveDifficulty, handleDeleteDifficulty
│   └── index.js                       # Barrel export
│
├── modules/                           # 🆕 NEW: UI section wrappers (Phase 1 PR Set A)
│   ├── GameHeader.jsx                 # Wrap GameDetailsHeader (pure props passthrough)
│   ├── RosterSidebar.jsx              # Wrap GameDayRosterSidebar
│   ├── TacticalBoardSection.jsx       # Wrap TacticalBoard + AutoFillButton
│   ├── MatchAnalysisSection.jsx       # Wrap MatchAnalysisSidebar
│   └── index.js                       # Barrel export
│
├── components/                        # ✅ EXISTING: Keep as is for now
│   ├── GameDetailsHeader.jsx
│   ├── GameDayRosterSidebar.jsx
│   ├── TacticalBoard.jsx
│   ├── MatchAnalysisSidebar.jsx
│   ├── AutoFillReportsButton.jsx
│   ├── dialogs/
│   │   ├── GoalDialog.jsx
│   │   ├── CardDialog.jsx
│   │   ├── SubstitutionDialog.jsx
│   │   ├── PlayerPerformanceDialog.jsx
│   │   ├── FinalReportDialog.jsx
│   │   ├── PlayerSelectionDialog.jsx
│   │   └── TeamSummaryDialog.jsx
│   └── features/
│       ├── DetailedStatsSection.jsx
│       ├── DetailedDisciplinarySection.jsx
│       └── GoalInvolvementSection.jsx
│
├── formations.js                      # ✅ EXISTING: Keep as is
├── __tests__/                         # ✅ EXISTING: Tests stay here
│   ├── validation.integration.test.jsx
│   ├── draftMerge.test.jsx
│   └── draftE2E.test.jsx
└── README.md                          # 🔄 UPDATE: Document new structure

```

---

## 9. Extraction Priority & Sequence

### Phase 1 - PR Set A: UI Module Extraction (Composition)
**Goal**: Create wrapper modules with zero logic changes  
**Files to Create**: `modules/` folder with pure wrappers  
**Lines Reduced**: ~50 lines (minimal)  
**Risk**: ⭐ **VERY LOW** (just composition)

**Tasks**:
- [ ] 2.2.1 Create `modules/` folder
- [ ] 2.2.2 Extract layout sections as wrappers
- [ ] 2.2.3 Verify tests green

---

### Phase 1 - PR Set B: Extract Data Loading Hook
**Goal**: Isolate game fetch + initial state logic  
**Files to Create**: `hooks/useGameDetailsData.js`  
**Lines Reduced**: ~300 lines (Effects 1, 2 + score/duration init)  
**Risk**: ⭐⭐ **LOW-MEDIUM** (side effects but well-defined)

**What Goes In**:
- Game fetch logic (direct + DataProvider fallback)
- `gamePlayers` derivation
- `matchDuration` initialization
- `finalScore` initialization
- `teamSummary` initialization
- `isReadOnly` state

**Tasks**:
- [ ] 2.3.1 Extract fetch logic to hook
- [ ] 2.3.2 Preserve semantics (same network calls)
- [ ] 2.3.3 Verify tests green

---

### Phase 1 - PR Set C: Extract Lineup Draft Hook (Scheduled)
**Goal**: Isolate draft load + autosave for Scheduled games  
**Files to Create**: `hooks/useLineupDraftManager.js`  
**Lines Reduced**: ~150 lines (Effect 3 + autosave logic)  
**Risk**: ⭐⭐⭐ **MEDIUM** (complex precedence logic + autosave timing)

**What Goes In**:
- Draft load precedence (draft → gameRosters → empty)
- Draft merge logic
- Autosave debounce (2.5s)
- `localRosterStatuses` state

**Tasks**:
- [ ] 2.4.1 Extract draft load logic
- [ ] 2.4.2 Extract autosave debounce
- [ ] 2.4.3 Preserve payload shape
- [ ] 2.4.4 Verify scheduled tests green

---

### Phase 1 - PR Set D: Extract Report Draft Hook (Played/Done)
**Goal**: Isolate report draft load + autosave  
**Files to Create**: `hooks/useReportDraftManager.js`  
**Lines Reduced**: ~200 lines (Effect 4 + autosave logic)  
**Risk**: ⭐⭐⭐ **MEDIUM** (complex merge logic)

**What Goes In**:
- Report draft fetch
- Draft merge with saved reports
- Autosave debounce
- `localPlayerReports` state

**Tasks**:
- [ ] 2.5.1 Extract report draft merge
- [ ] 2.5.2 Preserve shouldSkip semantics
- [ ] 2.5.3 Verify played/done tests green

---

### Phase 1 - PR Set E: Extract Formation & DnD Hooks
**Goal**: Isolate formation auto-build + DnD logic  
**Files to Create**: 
- `hooks/useFormationManager.js`
- `hooks/usePlayerGrouping.js`
- `hooks/useDragAndDrop.js`  
**Lines Reduced**: ~500 lines (Effect 11 + player grouping + DnD handlers)  
**Risk**: ⭐⭐⭐⭐ **HIGH** (complex auto-build logic, many edge cases)

**What Goes In**:
- Formation auto-build (Effect 11 - 205 lines!)
- Player grouping (useMemo - 180 lines!)
- DnD state + handlers (~122 lines)
- Manual mode switching

**Tasks**:
- [ ] 2.6.1 Extract player grouping
- [ ] 2.6.2 Extract formation auto-build
- [ ] 2.6.3 Extract DnD handlers
- [ ] 2.6.4 Verify DnD UX unchanged

---

### Phase 1 - PR Set F: Normalize API Calls
**Goal**: Replace hardcoded URLs with `apiClient`  
**Files to Modify**: `index.jsx` (API calls)  
**Lines Changed**: ~10 fetch calls  
**Risk**: ⭐⭐ **LOW-MEDIUM** (must preserve auth + response parsing)

**Tasks**:
- [ ] 2.7.1 Replace fetch with apiClient
- [ ] 2.7.2 Preserve auth header behavior
- [ ] 2.7.3 Verify network requests unchanged

---

### Phase 1 - PR Set G: Extract Event Hooks (Goals/Cards/Subs)
**Goal**: Isolate event CRUD operations  
**Files to Create**: `hooks/useGameEvents.js`  
**Lines Reduced**: ~400 lines (Effects 6-8 + event handlers)  
**Risk**: ⭐⭐ **LOW-MEDIUM** (self-contained logic)

**What Goes In**:
- Goals state + CRUD (Effects 6 + handlers)
- Substitutions state + CRUD (Effect 7 + handlers)
- Cards state + CRUD (Effect 8 + handlers)

**Tasks**:
- [ ] Extract goals logic
- [ ] Extract subs logic
- [ ] Extract cards logic
- [ ] Verify events work

---

### Phase 1 - Cutover PR: Finalize Thin Container
**Goal**: `index.jsx` becomes orchestration layer only  
**Files to Modify**: `index.jsx`  
**Target Size**: ≤ 250 lines  
**Lines Reduced**: From 2,395 → ~250 (90% reduction!)  
**Risk**: ⭐ **LOW** (all logic already extracted)

**Final index.jsx Structure**:
```javascript
export default function GameDetails() {
  // 1. Parse route params (5 lines)
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("id");

  // 2. Call hooks (15 lines)
  const { game, gamePlayers, ... } = useGameDetailsData(gameId);
  const { localRosterStatuses, ... } = useLineupDraftManager(game);
  const { localPlayerReports, ... } = useReportDraftManager(game);
  const { formation, ... } = useFormationManager(...);
  const { goals, subs, cards } = useGameEvents(gameId);
  // etc.

  // 3. Dialog state (20 lines)
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  // etc.

  // 4. Confirmation state (15 lines)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // etc.

  // 5. Import handlers (20 lines)
  const gameTransitionHandlers = useGameTransitionHandlers(...);
  const eventHandlers = useEventHandlers(...);
  // etc.

  // 6. Loading/error states (10 lines)
  if (isLoading) return <PageLoader />;
  if (error) return <ErrorDisplay />;

  // 7. Render (150 lines - mostly JSX)
  return (
    <div>
      <GameHeader {...} />
      <div className="flex">
        <RosterSidebar {...} />
        <TacticalBoardSection {...} />
        <MatchAnalysisSection {...} />
      </div>
      <Dialogs {...} />
      <ConfirmationModal {...} />
    </div>
  );
}
```

**Tasks**:
- [ ] 2.8.1 Ensure index.jsx is thin orchestration
- [ ] 2.8.2 Target ≤ 250 lines
- [ ] 2.8.3 Verify all tests green

---

## Summary Table: Extraction Impact

| Extraction Target | Lines Reduced | Priority | Risk | Phase 1 PR Set |
|---|---:|---|---|---|
| **UI Modules** | ~50 | 🔥 First | ⭐ Very Low | A |
| **useGameDetailsData** | ~300 | 🔥 High | ⭐⭐ Low-Med | B |
| **useLineupDraftManager** | ~150 | 🔥 Critical | ⭐⭐⭐ Medium | C |
| **useReportDraftManager** | ~200 | 🔥 Critical | ⭐⭐⭐ Medium | D |
| **useFormationManager** | ~400 | 🔥 Critical | ⭐⭐⭐⭐ High | E |
| **useDragAndDrop** | ~122 | 🔴 Medium | ⭐⭐ Low-Med | E |
| **API Normalization** | ~10 | 🔥 High | ⭐⭐ Low-Med | F |
| **useGameEvents** | ~400 | 🔴 Medium | ⭐⭐ Low-Med | G |
| **useTimeline** | ~82 | 🟡 Low | ⭐ Low | Later |
| **useDifficultyAssessment** | ~67 | 🟡 Low | ⭐ Low | Later |
| **usePlayerStats** | ~104 | 🔴 Medium | ⭐⭐ Low-Med | Later |
| **Handlers (all)** | ~1,164 | 🔴 Medium | ⭐⭐⭐ Medium | Mixed |
| **Final Orchestration** | ~250 remain | Final | ⭐ Low | Cutover |
| **TOTAL REDUCTION** | **~2,145** | | | **~90%** |

---

## 🎯 Success Criteria for Decomposition

### For Each Extraction PR:

1. ✅ **Tests Stay Green**
   - E2E smoke tests pass
   - Integration tests pass
   - Unit tests pass

2. ✅ **Behavior Parity**
   - Same API calls made (same endpoints, payloads)
   - Same timing (autosave debounce preserved)
   - Same validation (no new errors, no missing errors)
   - Same UI interactions

3. ✅ **No Cross-Feature Imports**
   - Hooks only import from `shared/` or same feature
   - No `features/*` importing other `features/*`

4. ✅ **Code Quality**
   - Hook has single responsibility
   - Clear interface (input/output)
   - JSDoc comments for complex logic
   - Tests for hook if complex

5. ✅ **Manual Smoke Checklist**
   - Scheduled game: draft loads, autosaves
   - Played game: reports load, autosave, events work
   - Done game: read-only enforced
   - State transitions: Scheduled → Played → Done

---

## 📋 Next Steps (Immediate)

1. **Mark Task 2.1 Complete** ✅
   - [x] 2.1.1 Inventory responsibilities
   - [x] 2.1.2 Identify stable boundaries
   - [x] 2.1.3 Document target folder layout

2. **Start Task 2.2 (PR Set A - UI Modules)**
   - [ ] 2.2.1 Create `modules/` folder
   - [ ] 2.2.2 Extract layout sections as wrappers
   - [ ] 2.2.3 Verify tests green

---

**Created**: 2024-12-28  
**Status**: ✅ **COMPLETE** - Ready for extraction work  
**Total Analysis Time**: Comprehensive deep dive into 2,395-line component  
**Confidence**: **HIGH** - Clear extraction path identified


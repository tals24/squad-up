# Top 5 Offenders — Risk Analysis

Extracted from `docs/refactorUi.txt` for Phase 0 safety net.

---

## 🚨 Critical Offenders (>500 lines)

### 1. GameDetailsPage/index.jsx — **2,395 lines** ⚠️ CRITICAL
**Location**: `frontend/src/features/game-management/components/GameDetailsPage/index.jsx`

**Why Risky**:
- **50+ state variables**: Complex interdependent state (roster, formation, drafts, reports, stats)
- **30+ useEffect hooks**: Complex lifecycle dependencies, race conditions likely
- **7 dialogs managed**: Goal, Card, Substitution, Player Performance, Final Report, Team Summary, Player Selection
- **Direct fetch calls**: Hardcoded URLs, no centralized API handling
- **Draft autosave**: Complex debounce logic with "skip while finalizing" guards
- **Timeline reconstruction**: Complex player state tracking across events (substitutions, cards, goals)
- **Three game states**: Scheduled (draft roster), Played (record events), Done (read-only) with different behaviors

**Impact if broken**:
- Coaches cannot manage game rosters or record match events
- Data loss possible if autosave breaks
- Core feature of the application

**Refactor Strategy**:
- Extract hooks: `useGameDetailsData`, `useLineupDraftAutosave`, `useReportDraftAutosave`, `useFormationManagement`, `useDragAndDropFormation`
- Extract modules: Header, RosterSidebar, TacticalBoard (already extracted), MatchAnalysisSidebar
- Normalize API: Replace hardcoded fetch with shared client
- Target: Reduce to ≤250 lines

---

### 2. TacticBoardPage/index.jsx — **1,332 lines** ⚠️ CRITICAL
**Location**: `frontend/src/features/team-management/components/TacticBoardPage/index.jsx`

**Why Risky**:
- Formation editor with complex drag-and-drop
- Player positioning logic
- Save/load formations to database
- Multiple formation types (5v5, 7v7, 11v11)

**Impact if broken**:
- Coaches cannot create/edit tactical formations
- Training session planning impacted

**Refactor Strategy** (Phase 2+):
- Similar approach to GameDetailsPage
- Extract formation editor to reusable component
- Extract drag-and-drop logic to hooks

---

### 3. OrganizationSettingsSection.jsx — **760 lines** ⚠️ SEVERE
**Location**: `frontend/src/features/settings/components/SettingsPage/OrganizationSettingsSection.jsx`

**Why Risky**:
- Feature flag management
- Age group overrides
- Complex nested forms
- Admin-only functionality

**Impact if broken**:
- Organization configuration broken
- Feature toggles stop working

**Refactor Strategy** (Phase 2+):
- Extract form sections to modules
- Extract feature flag logic to hooks

---

### 4. FormationEditor.jsx — **605 lines** ⚠️ SEVERE
**Location**: `frontend/src/shared/components/FormationEditor.jsx`

**Why Risky**:
- Shared component used by multiple features
- Complex drag-and-drop with validation
- Position calculation logic
- Currently in `shared/` but too complex for a shared component

**Impact if broken**:
- Both TacticBoard and GameDetails affected
- Multiple features break simultaneously

**Refactor Strategy** (Phase 3):
- Break into composition pattern (Canvas + Players + Controls)
- Extract position calculations to utils
- Move to feature-specific location or create dedicated widget

---

### 5. DrillCanvas.jsx — **603 lines** ⚠️ SEVERE
**Location**: `frontend/src/features/drill-system/components/DrillCanvas.jsx`

**Why Risky**:
- Canvas-based drawing logic
- Complex state for drill design
- Save/load drill configurations

**Impact if broken**:
- Drill designer stops working
- Training planning impacted

**Refactor Strategy** (Phase 2+):
- Extract canvas operations to hooks
- Extract drawing tools to modules
- Separate presentation from drawing logic

---

## 🔧 Additional Architecture Issues

### Missing Abstractions
1. **No shared dialog base**: 7+ custom dialogs with duplicated logic
2. **No form composition pattern**: Repeated form field patterns across features
3. **Inconsistent state management**: Mix of local state, DataProvider, and ad-hoc fetch
4. **No reusable layout system**: Pages rebuild layout structure repeatedly

### Structural Inconsistencies
1. **game-management doing too much**: Should be split into:
   - game-creation (schedule games)
   - game-execution (record events, manage roster)
   - game-analysis (reports, statistics)
2. **Deep dialog nesting**: Dialogs nested 4 levels deep in GameDetailsPage
3. **9 API files in one feature**: game-management has fragmented API layer

---

## 📊 Refactor Priority Order

### Phase 1 (Now)
1. **GameDetailsPage** — Highest risk, highest impact
   - Add safety net (tests)
   - Extract incrementally
   - Normalize API usage

### Phase 2 (Next)
2. **TacticBoardPage** — Same patterns as GameDetailsPage
3. **game-management split** — Fix structural issues
4. **Introduce Pages layer** — Thin route composition

### Phase 3 (Later)
5. **FormationEditor** — Shared component complexity
6. **OrganizationSettingsSection** — Settings complexity
7. **DrillCanvas** — Drill designer complexity

---

## 🎯 Success Criteria

Each offender refactor must achieve:
- ✅ File reduced to < 300 lines (ideally < 200)
- ✅ Logic extracted to focused hooks (< 150 lines each)
- ✅ UI split into modules (< 150 lines each)
- ✅ All tests green
- ✅ Zero behavior changes
- ✅ No cross-feature imports introduced

---

## ⚠️ Risk Mitigation Strategy

1. **Add comprehensive tests FIRST** (this phase)
2. **Extract in small PRs** (one responsibility at a time)
3. **Verify behavior after each extraction** (manual + automated)
4. **Keep old code working during extraction** (no breaking changes)
5. **Final cutover in single PR** (after all extractions stable)


# 🏗️ PHASE 3: FEATURE MIGRATION PLAN

**Status**: IN PROGRESS  
**Date**: October 21, 2025  
**Goal**: Migrate all features to `src/features/` for complete Feature-Sliced Design

---

## 🎯 **FEATURES TO MIGRATE**

### 1. **Game Management** ⚽ (HIGH PRIORITY - STARTING HERE)
**Current Files:**
- `src/pages/GameDetails/` (already modular)
- `src/pages/GamesSchedule.jsx`
- `src/pages/AddGame.jsx`

**New Location:**
```
src/features/game-management/
├── api/
│   └── gameApi.js           (game-specific API calls)
├── components/
│   ├── GameDetailsPage/      (from pages/GameDetails)
│   ├── GamesSchedulePage/    (from pages/GamesSchedule)
│   ├── AddGamePage/          (from pages/AddGame)
│   └── shared/               (game-specific shared components)
├── hooks/
│   └── useGameData.js        (game-specific hooks)
├── utils/
│   └── gameHelpers.js        (game-specific utilities)
└── index.js                  (public API)
```

---

### 2. **Player Management** 👥
**Current Files:**
- `src/pages/Players.jsx`
- `src/pages/Player.jsx` (individual player)
- `src/pages/AddPlayer.jsx`
- `src/components/player/` (PlayerProfileCard, DevelopmentTimeline, etc.)
- `src/components/players/` (PlayersHeader, PlayerGrid, PlayerFilters)

**New Location:**
```
src/features/player-management/
├── api/
│   └── playerApi.js
├── components/
│   ├── PlayersPage/
│   ├── PlayerDetailPage/
│   ├── AddPlayerPage/
│   └── shared/
├── hooks/
│   └── usePlayerData.js
└── index.js
```

---

### 3. **Drill System** 🎯
**Current Files:**
- `src/pages/DrillLibrary/` (already modular)
- `src/pages/DrillDesigner.jsx`
- `src/components/drilldesigner/`
- `src/components/DrillMenuDropdown.jsx`
- `src/components/DrillDetailModal.jsx`
- `src/components/DrillDescriptionModal.jsx`

**New Location:**
```
src/features/drill-system/
├── api/
│   └── drillApi.js
├── components/
│   ├── DrillLibraryPage/
│   ├── DrillDesignerPage/
│   └── shared/
├── hooks/
│   └── useDrillData.js
└── index.js
```

---

### 4. **Training Management** 📅
**Current Files:**
- `src/pages/TrainingPlanner/` (already modular)
- `src/components/WeeklyCalendar.jsx`
- `src/components/DrillLibrarySidebar.jsx`

**New Location:**
```
src/features/training-management/
├── api/
│   └── trainingApi.js
├── components/
│   ├── TrainingPlannerPage/
│   └── shared/
├── hooks/
│   └── useTrainingData.js
└── index.js
```

---

### 5. **Analytics** 📊
**Current Files:**
- `src/pages/Analytics.jsx`
- `src/pages/Dashboard.jsx` (includes analytics)
- `src/components/dashboard/`

**New Location:**
```
src/features/analytics/
├── api/
│   └── analyticsApi.js
├── components/
│   ├── DashboardPage/
│   ├── AnalyticsPage/
│   └── shared/
├── hooks/
│   └── useAnalyticsData.js
└── index.js
```

---

### 6. **Team Management** 🏆 (Minor)
**Current Files:**
- `src/pages/AddTeam.jsx`
- `src/pages/TacticBoard.jsx`

**New Location:**
```
src/features/team-management/
├── api/
│   └── teamApi.js
├── components/
│   ├── AddTeamPage/
│   ├── TacticBoardPage/
│   └── shared/
└── index.js
```

---

### 7. **User Management** 👤 (Minor)
**Current Files:**
- `src/pages/Login.jsx`
- `src/pages/AddUser.jsx`
- `src/pages/AccessDenied.jsx`
- `src/components/LoginModal.jsx`

**New Location:**
```
src/features/user-management/
├── api/
│   └── userApi.js
├── components/
│   ├── LoginPage/
│   ├── AddUserPage/
│   ├── AccessDeniedPage/
│   └── shared/
└── index.js
```

---

### 8. **Reporting** 📝 (Minor)
**Current Files:**
- `src/pages/AddReport.jsx`
- `src/components/MatchReportModal.jsx`
- `src/components/PlayerPerformanceModal.jsx`

**New Location:**
```
src/features/reporting/
├── api/
│   └── reportApi.js
├── components/
│   ├── AddReportPage/
│   └── shared/
└── index.js
```

---

## 🔄 **MIGRATION STRATEGY**

### **For Each Feature:**

1. **Create Feature Directory**
   ```bash
   mkdir -p src/features/[feature-name]/api
   mkdir -p src/features/[feature-name]/components
   mkdir -p src/features/[feature-name]/hooks
   mkdir -p src/features/[feature-name]/utils
   ```

2. **Move Page Components**
   - Move from `src/pages/` to `src/features/[feature-name]/components/`
   - Rename to follow pattern: `SomethingPage/index.jsx`

3. **Extract API Calls**
   - Create `api/[feature]Api.js`
   - Move API calls from components to dedicated API file
   - Use shared API client from `@/shared/api`

4. **Extract Hooks**
   - Move feature-specific hooks from components
   - Create `hooks/use[Feature]Data.js`

5. **Extract Utilities**
   - Move feature-specific utility functions
   - Keep in `utils/` folder

6. **Create Public API**
   - Create `index.js` with barrel exports
   - Export components, hooks, and utilities

7. **Update Imports**
   - Update router to import from feature modules
   - Update any cross-feature dependencies

---

## 📋 **EXECUTION ORDER**

1. ✅ **Game Management** (Most complex, start here)
2. **Player Management** (Second most complex)
3. **Drill System** (Medium complexity)
4. **Training Management** (Medium complexity)
5. **Analytics** (Medium complexity)
6. **Team Management** (Simple)
7. **User Management** (Simple)
8. **Reporting** (Simple)

---

## 🎯 **SUCCESS CRITERIA**

For each feature:
- ✅ All files moved to feature directory
- ✅ API calls extracted to dedicated file
- ✅ Hooks extracted and reusable
- ✅ Utilities organized
- ✅ Public API created
- ✅ Router updated
- ✅ Feature works exactly as before
- ✅ No broken imports

---

## 🚀 **LET'S START WITH GAME MANAGEMENT!**

**Next steps:**
1. Create `src/features/game-management/` structure
2. Move GameDetails components
3. Move GamesSchedule
4. Move AddGame
5. Extract API calls
6. Update router
7. Test thoroughly

---

**Status**: Ready to begin migration! 🎯


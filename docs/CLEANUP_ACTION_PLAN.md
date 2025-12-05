# 🎯 Cleanup Action Plan

**Based on:** PROJECT_STRUCTURE_DEEP_REVIEW.md  
**Target Date:** December 2025  
**Status:** 🟡 In Progress

---

## 📊 Progress Tracker

**Overall Progress:** 5/27 items completed (19%) - Tasks 1 & 2 DONE! ✅

| Priority | Completed | Total | Progress |
|----------|-----------|-------|----------|
| P0 (Foundation) | 1 | 1 | ██████████ 100% ✅ |
| P1 (High)       | 2 | 9 | ██░░░░░░░░ 22%  |
| P2 (Medium)     | 2 | 3 | ██████░░░░ 67%  ✅ |
| P3 (Low)        | 0 | 3 | ░░░░░░░░░░ 0%   |
| Testing         | 0 | 3 | ░░░░░░░░░░ 0%   |
| Docs            | 0 | 3 | ░░░░░░░░░░ 0%   |
| Performance     | 0 | 2 | ░░░░░░░░░░ 0%   |
| DevOps          | 0 | 2 | ░░░░░░░░░░ 0%   |

**Phase 1 (Backend MVC) Progress:** 2/9 sub-phases complete
- ✅ 1.1: Add controller layer (games) - DONE
- ✅ 1.2: Split game routes - DONE
- ⏳ 1.3: Apply to all 21 remaining routes (6 sub-phases)

---

## ✅ Priority 0: Foundation (COMPLETED!)

### 0.1 Move Frontend to frontend/ Directory

**Status:** ✅ COMPLETED  
**Effort:** 1-2 hours  
**Impact:** CRITICAL - Foundational architecture

**⚠️ WHY THIS IS PRIORITY 0:**
- Currently backend is in `backend/`, but frontend is scattered at root
- Creates asymmetry and confusion
- Not scalable for adding mobile/, admin/, etc.
- Must be done BEFORE other cleanup (paths will change)

**Tasks:**
- [ ] Create `frontend/` directory at root
- [ ] Move frontend files:
  - [ ] `src/` → `frontend/src/`
  - [ ] `public/` → `frontend/public/`
  - [ ] `package.json` → `frontend/package.json`
  - [ ] `package-lock.json` → `frontend/package-lock.json`
  - [ ] `vite.config.js` → `frontend/vite.config.js`
  - [ ] `tailwind.config.js` → `frontend/tailwind.config.js`
  - [ ] `postcss.config.js` → `frontend/postcss.config.js`
  - [ ] `eslint.config.js` → `frontend/eslint.config.js`
  - [ ] `jest.config.cjs` → `frontend/jest.config.cjs`
  - [ ] `jsconfig.json` → `frontend/jsconfig.json`
  - [ ] `components.json` → `frontend/components.json`
  - [ ] `index.html` → `frontend/index.html`
  - [ ] `.prettierrc` → `frontend/.prettierrc`
  - [ ] `.prettierignore` → `frontend/.prettierignore`
  - [ ] `TEST_IMPLEMENTATION_GUIDE.md` → `frontend/` or `docs/`
- [ ] Verify `@` alias in vite.config.js points to `./src` (not `../src`)
- [ ] Test:
  ```bash
  cd frontend
  npm install
  npm run dev      # Should start on localhost:5173
  npm run build    # Should build successfully
  npm test         # Should run tests
  ```
- [ ] Update root README.md to reference new structure
- [ ] Commit with message: `refactor: move frontend to frontend/ directory for better organization`

**Result Structure:**
```
squad-up-with-backend/
├── backend/              ✅ Backend code
│   ├── src/
│   ├── package.json
│   └── [configs]
├── frontend/             ✅ Frontend code (NEW)
│   ├── src/
│   ├── package.json
│   └── [configs]
├── docs/                 ✅ Shared docs
├── scripts/              ✅ Root-level scripts
└── README.md             ✅ Root README
```

---

## 🚨 Priority 1: High Impact (Fix Soon)

### 1.1 Add Controller Layer (NEW - Do This First!)

**Status:** ⏳ Not Started  
**Effort:** 3-4 hours  
**Impact:** HIGH - Improves architecture significantly

**⚠️ WHY THIS IS FIRST:**
- Routes currently contain business logic (anti-pattern)
- 974 lines in games.js doing too much
- Controllers provide proper separation of concerns
- Makes splitting routes easier afterward

**Architecture:**
```
Routes (thin) → Controllers (orchestration) → Services (business logic) → Models (data)
```

**Tasks:**
- [ ] Create `backend/src/controllers/` directory
- [ ] Create `backend/src/controllers/gameController.js`
  - [ ] Extract `getAllGames` from routes
  - [ ] Extract `getGameById` from routes
  - [ ] Extract `createGame` from routes
  - [ ] Extract `updateGame` from routes
  - [ ] Extract `deleteGame` from routes
  - [ ] Extract draft-related methods
  - [ ] Extract status transition methods
- [ ] Create `backend/src/services/gameService.js` (orchestration)
  - [ ] Move CRUD business logic from routes
  - [ ] Move status change detection
  - [ ] Move analytics triggering
  - [ ] Move job creation logic
- [ ] Update `backend/src/routes/games.js` to use controllers
  - [ ] Keep only route definitions
  - [ ] Apply middleware
  - [ ] Call controller methods
  - [ ] Remove business logic
- [ ] Test all endpoints still work
- [ ] Run backend tests to verify

**Example Pattern:**
```javascript
// routes/games.js (BEFORE - 974 lines)
router.put('/:id', authenticateJWT, async (req, res) => {
  // 80+ lines of business logic
});

// routes/games.js (AFTER - 5 lines)
const gameController = require('../controllers/gameController');
router.put('/:id', authenticateJWT, gameController.updateGame);

// controllers/gameController.js (NEW - orchestration)
exports.updateGame = async (req, res, next) => {
  try {
    const game = await gameService.updateGame(req.params.id, req.body);
    res.json({ success: true, data: game });
  } catch (error) {
    next(error);
  }
};

// services/gameService.js (NEW - business logic)
exports.updateGame = async (gameId, updateData) => {
  // All the complex logic here
};
```

**Files to Create:**
```
backend/src/controllers/
  ├── index.js
  └── gameController.js

backend/src/services/
  └── gameService.js (NEW - orchestration service)
```

**Files to Modify:**
```
backend/src/routes/games.js (make thin, use controllers)
```

**Benefits:**
- ✅ Single Responsibility Principle
- ✅ Easy to test (unit test controllers/services separately)
- ✅ Reusable business logic
- ✅ Clear error handling
- ✅ Makes next step (splitting routes) trivial

---

### 1.2 Split Backend games.js (NOW MUCH EASIER!)

**Status:** ⏳ Not Started  
**Effort:** 1-2 hours (reduced from 2-3!)  
**Impact:** Medium (easier after controllers)

**Note:** Do this AFTER 1.1 (controller layer). With controllers, this becomes trivial!

**Tasks:**
- [ ] Create `backend/src/routes/games/` directory
- [ ] Split thin routes into domain files:
  - [ ] `index.js` - Aggregates all game routes
  - [ ] `crud.js` - Basic CRUD endpoints
  - [ ] `drafts.js` - Draft operation endpoints
  - [ ] `status.js` - Status transition endpoints
  - [ ] `reports.js` - Report operation endpoints
- [ ] All call the same `gameController` methods
- [ ] Update imports in `backend/src/app.js`
- [ ] Run backend tests to verify

**Files to Create:**
```
backend/src/routes/games/
  ├── index.js (~30 lines - aggregates routes)
  ├── crud.js (~50 lines - GET, POST, PUT, DELETE)
  ├── drafts.js (~40 lines - draft operations)
  ├── status.js (~30 lines - status transitions)
  └── reports.js (~30 lines - report operations)
```

**Files to Delete:**
```
backend/src/routes/games.js (split into games/ folder)
```

**Why This Is Easier After Controllers:**
- Routes are already thin (just routing)
- No need to figure out where business logic goes
- Just organize endpoints by domain
- All complex logic already in controllers/services

---

### 1.3 Consolidate Frontend API Layers

**Status:** ⏳ Not Started  
**Effort:** 4-6 hours  
**Impact:** High

**Tasks:**
- [ ] Audit `src/api/` usage:
  - [ ] `dataService.js` - Find all imports
  - [ ] `entities.js` - Find all imports
  - [ ] `functions.js` - Find all imports
  - [ ] `integrations.js` - Find all imports
- [ ] Migrate remaining calls to `src/shared/api/`
- [ ] Update all imports across features
- [ ] Delete deprecated `src/api/` folder
- [ ] Run frontend tests to verify

**Expected Migrations:**
```
frontend/src/api/dataService.js   → frontend/src/shared/api/client.js (consolidate)
frontend/src/api/entities.js      → DELETE (unused?)
frontend/src/api/functions.js     → Feature-specific APIs
frontend/src/api/integrations.js  → frontend/src/shared/api/integrations.js
```

**Note:** Paths assume Priority 0 (frontend restructure) is complete

---

### 1.3 Apply MVC Architecture to All Backend Routes (Phase 1B1)

**Status:** ⏳ Not Started  
**Effort:** 22-27 hours (comprehensive refactoring)  
**Impact:** HIGH - Professional, consistent backend architecture

**⚠️ SCOPE:**
Apply the same MVC pattern (Controllers → Services → Routes) to ALL 21 remaining backend route files.

**See Detailed Plan:** [PHASE_1B1_BACKEND_REFACTORING_PLAN.md](./PHASE_1B1_BACKEND_REFACTORING_PLAN.md)

**Sub-Phases:**

#### 1.3.1 Game Events Domain (6-7 hours, Priority 1)
- [ ] goals.js (305 lines) → goalController + goalService
- [ ] substitutions.js (304 lines) → substitutionController + substitutionService
- [ ] cards.js (319 lines) → cardController + cardService
- [ ] playerMatchStats.js (111 lines) → playerMatchStatsController + service
- [ ] timelineEvents.js (123 lines) → timelineEventController + service

#### 1.3.2 Game Domain Extended (4-5 hours, Priority 2)
- [ ] gameReports.js (354 lines) → gameReportController + gameReportService
- [ ] gameRosters.js (115 lines) → gameRosterController + gameRosterService
- [ ] difficultyAssessment.js (145 lines) → difficultyAssessmentController + service
- [ ] minutesValidation.js (58 lines) → minutesValidationController (thin)

#### 1.3.3 Training Domain (4-5 hours, Priority 3)
- [ ] sessionDrills.js (348 lines) → sessionDrillController + sessionDrillService
- [ ] trainingSessions.js (115 lines) → trainingSessionController + service
- [ ] drills.js (103 lines) → drillController + drillService

#### 1.3.4 Core Domain (3-4 hours, Priority 4)
- [ ] players.js (122 lines) → playerController + playerService
- [ ] teams.js (115 lines) → teamController + teamService
- [ ] users.js (109 lines) → userController + userService

#### 1.3.5 Supporting Domains (3-4 hours, Priority 5)
- [ ] analytics.js (327 lines) → analyticsController + analyticsService
- [ ] scoutReports.js (135 lines) → scoutReportController + scoutReportService
- [ ] formations.js (103 lines) → formationController + formationService
- [ ] organizationConfigs.js (221 lines) → organizationConfigController + service
- [ ] auth.js (164 lines) → authController + authService ⚠️ Security critical!

#### 1.3.6 Data Management (1-2 hours, Priority 6)
- [ ] data.js (191 lines) → dataController + dataService

**Expected Result:**
```
backend/src/
├── controllers/ (22 files)
│   ├── gameController.js ✅
│   ├── goalController.js
│   ├── substitutionController.js
│   ├── cardController.js
│   ├── [18 more controllers]
│   └── index.js
│
├── services/ (25+ files)
│   ├── gameService.js ✅
│   ├── goalService.js
│   ├── goalAnalytics.js ✅ (keep - specific calculations)
│   ├── [20+ services]
│   └── index.js
│
└── routes/ (21 files, all thin!)
    ├── games/ ✅
    ├── goals.js (thin)
    ├── substitutions.js (thin)
    ├── [18 more thin routes]
    └── All < 150 lines each
```

**Benefits:**
- ✅ 100% consistent MVC architecture
- ✅ All routes follow same pattern
- ✅ Easy for team to understand and contribute
- ✅ Professional, industry-standard codebase
- ✅ Fully testable and maintainable

---

## ⚠️ Priority 2: Medium Impact (Next Sprint)

### 2.1 Move Feature-Specific Hooks from shared/

**Status:** ✅ PARTIALLY COMPLETED (useAutosave & useFeature migrated)  
**Effort:** 30 minutes (actual)  
**Impact:** Medium

**Completed:**
- [x] Migrated useAutosave.js to shared/hooks/
- [x] Migrated useFeature.js to shared/hooks/
- [x] Moved test file to shared/hooks/__tests__/
- [x] Updated imports in 2 files
- [x] Deleted old frontend/src/hooks/ folder

**Remaining Tasks:**
- [ ] Move remaining feature-specific hooks to proper features:
  ```
  frontend/src/shared/hooks/useDashboardData.js     → frontend/src/features/analytics/hooks/
  frontend/src/shared/hooks/useDrillLabData.js      → frontend/src/features/drill-system/hooks/
  frontend/src/shared/hooks/useDrillLabHistory.js   → frontend/src/features/drill-system/hooks/
  frontend/src/shared/hooks/useDrillLabMode.js      → frontend/src/features/drill-system/hooks/
  frontend/src/shared/hooks/usePlayersData.js       → frontend/src/features/player-management/hooks/
  frontend/src/shared/hooks/useRecentEvents.js      → frontend/src/features/analytics/hooks/
  ```
  
**Note:** Paths assume Priority 0 (frontend restructure) is complete
- [ ] Update imports in all consuming components
- [ ] Update index.js exports in each feature
- [ ] Run tests to verify

**Files to Update:**
```
Search for imports of each hook and update paths
Update feature index.js exports
```

---

### 2.2 Reorganize Utils

**Status:** ✅ COMPLETED  
**Effort:** 45 minutes (actual, estimated 1 hour)  
**Impact:** Medium

**Completed:**
- [x] Moved feature-specific utils:
  ```
  ✅ frontend/src/utils/dashboardConstants.js → frontend/src/features/analytics/utils/
  ✅ frontend/src/utils/drillLabUtils.js      → frontend/src/features/drill-system/utils/
  ✅ frontend/src/utils/gameUtils.js          → frontend/src/features/game-management/utils/
  ✅ frontend/src/utils/positionUtils.js      → frontend/src/shared/utils/
  ✅ frontend/src/utils/categoryColors.js     → frontend/src/shared/utils/
  ```
- [x] Deleted test data:
  ```
  ✅ frontend/src/utils/testTeamData.js → DELETED
  ```
- [x] Created barrel exports (index.js) for each utils folder
- [x] Updated shared/utils/index.js with createPageUrl and re-exports
- [x] Updated 24 files with new import paths
- [x] Deleted old frontend/src/utils/ folder

**New Structure:**
```
frontend/src/
├── features/
│   ├── analytics/utils/
│   │   ├── dashboardConstants.js
│   │   └── index.js
│   ├── drill-system/utils/
│   │   ├── drillLabUtils.js
│   │   └── index.js
│   └── game-management/utils/
│       ├── gameUtils.js
│       └── index.js
└── shared/utils/
    ├── categoryColors.js
    ├── positionUtils.js
    ├── date/
    └── index.js
✅ index.ts (barrel export)
```

---

### 2.3 Consolidate lib/ Folders

**Status:** ⏳ Not Started  
**Effort:** 30 minutes  
**Impact:** Medium

**Tasks:**
- [ ] Choose TypeScript or JavaScript strategy (see 3.1)
- [ ] Move `src/lib/*` into `src/shared/lib/`
- [ ] Update imports across codebase
- [ ] Delete empty `src/lib/` folder
- [ ] Run build to verify

**Files to Move:**
```
frontend/src/lib/advanced-animations.ts      → frontend/src/shared/lib/
frontend/src/lib/advanced-theming.ts         → frontend/src/shared/lib/
frontend/src/lib/dark-mode.ts                → frontend/src/shared/lib/
frontend/src/lib/progressive-loading.tsx     → frontend/src/shared/lib/
frontend/src/lib/responsive.ts               → frontend/src/shared/lib/
```

**Note:** Paths assume Priority 0 (frontend restructure) is complete

---

## 🧹 Priority 3: Low Impact (Tech Debt)

### 3.1 TypeScript/JavaScript Consistency

**Status:** ⏳ Not Started (Requires Decision)  
**Effort:** Low (remove .ts) OR High (full migration)  
**Impact:** Low (DX improvement)

**Decision Required:** Choose one path:

**Option A: Remove TypeScript** (Effort: 1 hour)
- [ ] Delete all .ts/.tsx files in lib/
- [ ] Rewrite as .js or delete if unused
- [ ] Update imports
- [ ] Remove @types/* from package.json

**Option B: Commit to TypeScript** (Effort: High, 40+ hours)
- [ ] Add TypeScript to project (`npm install -D typescript @types/react @types/react-dom`)
- [ ] Create `tsconfig.json`
- [ ] Incrementally convert .js → .ts starting with shared/
- [ ] Add type definitions for all features
- [ ] Target: Complete by Q2 2026

**Recommendation:** Option A for now (remove .ts files), revisit TypeScript later

---

### 3.2 Clean Up Empty/Unused Directories

**Status:** ⏳ Not Started  
**Effort:** 15 minutes  
**Impact:** Low (cleanup)

**Tasks:**
- [ ] Check and delete if empty:
  ```
  backend/src/components/player/
  src/features/*/api/ (if empty)
  src/features/*/hooks/ (if empty)
  src/features/*/utils/ (if empty)
  ```
- [ ] Verify no imports reference deleted folders

---

### 3.3 Delete Test Data from src/

**Status:** ⏳ Not Started  
**Effort:** 5 minutes  
**Impact:** Low

**Tasks:**
- [ ] Delete `src/utils/testTeamData.js`
- [ ] Search for imports (should be none in production code)
- [ ] If used in tests, move to `__tests__/fixtures/`

---

## 🧪 Testing Improvements

### 4.1 Add Component Tests for drill-system

**Status:** ⏳ Not Started  
**Effort:** 4-6 hours  
**Impact:** Medium

**Tasks:**
- [ ] Create `frontend/src/features/drill-system/components/__tests__/`
- [ ] Add tests for:
  - [ ] DrillLibraryPage
  - [ ] DrillDesignerPage
  - [ ] DrillCanvas
  - [ ] AddDrillDialog
- [ ] Target: 70% coverage
- [ ] Use game-management tests as template

---

### 4.2 Add Component Tests for player-management

**Status:** ⏳ Not Started  
**Effort:** 4-6 hours  
**Impact:** Medium

**Tasks:**
- [ ] Create tests for:
  - [ ] PlayersPage
  - [ ] PlayerDetailPage
  - [ ] AddPlayerPage
- [ ] Target: 70% coverage

---

### 4.3 Add Integration Tests

**Status:** ⏳ Not Started  
**Effort:** 8-10 hours  
**Impact:** Medium

**Tasks:**
- [ ] Install Playwright or Cypress
- [ ] Add E2E tests for critical flows:
  - [ ] Login → Dashboard
  - [ ] Create Player → View Player
  - [ ] Create Game → Add Roster → Submit Report
- [ ] Add to CI pipeline

---

## 📚 Documentation Updates

### 5.1 Backend Scripts README

**Status:** ⏳ Not Started  
**Effort:** 1 hour  
**Impact:** Low (DX improvement)

**Tasks:**
- [ ] Create `backend/scripts/README.md`
- [ ] Document each script:
  - What it does
  - When to run it
  - Required environment variables
  - Example usage
- [ ] Add to main README.md

---

### 5.2 Update Architecture Docs

**Status:** ⏳ Not Started  
**Effort:** 2-3 hours  
**Impact:** Medium

**Tasks:**
- [ ] Update `ARCHITECTURE_REFACTORING_PLAN.md` with completed items
- [ ] Create architecture diagrams (Mermaid or draw.io)
- [ ] Document API layer consolidation decisions
- [ ] Update DATABASE_ARCHITECTURE.md if schema changes

---

### 5.3 Create Contribution Guidelines

**Status:** ⏳ Not Started  
**Effort:** 2 hours  
**Impact:** Medium (team scalability)

**Tasks:**
- [ ] Create `CONTRIBUTING.md`
- [ ] Document:
  - [ ] Project structure and conventions
  - [ ] How to add a new feature
  - [ ] How to add a new route
  - [ ] Testing requirements
  - [ ] Code review process
  - [ ] Git workflow

---

## ⚡ Performance Optimization

### 6.1 Implement Code Splitting

**Status:** ⏳ Not Started  
**Effort:** 3-4 hours  
**Impact:** High (performance)

**Tasks:**
- [ ] Add React.lazy() for route components
- [ ] Wrap with Suspense in router
- [ ] Measure bundle size before/after
- [ ] Target: <500KB main bundle
- [ ] Test lazy loading in dev/prod

**Example:**
```javascript
// src/app/router/routes.jsx
const GameDetailsPage = React.lazy(() => 
  import('@/features/game-management')
    .then(m => ({ default: m.GameDetailsPage }))
);
```

---

### 6.2 Bundle Analysis & Optimization

**Status:** ⏳ Not Started  
**Effort:** 2-3 hours  
**Impact:** Medium

**Tasks:**
- [ ] Install `rollup-plugin-visualizer`
- [ ] Generate bundle analysis
- [ ] Identify large dependencies
- [ ] Consider alternatives or code splitting
- [ ] Document findings

---

## 🚀 DevOps Improvements

### 7.1 Add CI/CD Pipeline

**Status:** ⏳ Not Started  
**Effort:** 4-6 hours  
**Impact:** High (quality gates)

**Tasks:**
- [ ] Choose platform (GitHub Actions, GitLab CI, etc.)
- [ ] Create workflow:
  - [ ] Lint check
  - [ ] Format check
  - [ ] Run tests
  - [ ] Build frontend
  - [ ] Build backend
  - [ ] Deploy to staging (optional)
- [ ] Add status badges to README

---

### 7.2 Add Error Tracking & Monitoring

**Status:** ⏳ Not Started  
**Effort:** 2-3 hours  
**Impact:** High (production visibility)

**Tasks:**
- [ ] Choose service (Sentry, LogRocket, etc.)
- [ ] Add to frontend
- [ ] Add to backend
- [ ] Configure source maps
- [ ] Set up alerts
- [ ] Document in README

---

## 📝 Notes

### Completed Items
*(Move items here as they're completed)*

---

### Blocked Items
*(Items waiting on decisions or dependencies)*

---

### Deferred Items
*(Items postponed to later phases)*

---

## 🔄 Review Schedule

- **Weekly Review:** Every Monday at 10 AM
- **Progress Updates:** Update this file after completing each item
- **Team Sync:** Discuss blockers and priorities

---

**Last Updated:** December 3, 2025  
**Next Review:** December 9, 2025


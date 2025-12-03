# 🎯 Cleanup Action Plan

**Based on:** PROJECT_STRUCTURE_DEEP_REVIEW.md  
**Target Date:** December 2025  
**Status:** 🟡 In Progress

---

## 📊 Progress Tracker

**Overall Progress:** 0/19 items completed (0%)

| Priority | Completed | Total | Progress |
|----------|-----------|-------|----------|
| P0 (Foundation) | 0 | 1 | ░░░░░░░░░░ 0%   |
| P1 (High)       | 0 | 2 | ░░░░░░░░░░ 0%   |
| P2 (Medium)     | 0 | 3 | ░░░░░░░░░░ 0%   |
| P3 (Low)        | 0 | 3 | ░░░░░░░░░░ 0%   |
| Testing         | 0 | 3 | ░░░░░░░░░░ 0%   |
| Docs            | 0 | 3 | ░░░░░░░░░░ 0%   |
| Performance     | 0 | 2 | ░░░░░░░░░░ 0%   |
| DevOps          | 0 | 2 | ░░░░░░░░░░ 0%   |

---

## 🔥 Priority 0: Foundation (DO THIS FIRST!)

### 0.1 Move Frontend to frontend/ Directory

**Status:** ⏳ Not Started  
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

### 1.1 Split Backend games.js (974 lines → ~200 lines each)

**Status:** ⏳ Not Started  
**Effort:** 2-3 hours  
**Impact:** High

**Tasks:**
- [ ] Create `backend/src/routes/games/` directory
- [ ] Split into domain files:
  - [ ] `index.js` - Router setup
  - [ ] `games.crud.js` - Basic CRUD operations
  - [ ] `games.drafts.js` - Draft operations (lineupDraft, reportDraft)
  - [ ] `games.status.js` - Status transitions (Scheduled → Played → Done)
  - [ ] `games.reports.js` - Report operations
- [ ] Update imports in `backend/src/app.js`
- [ ] Run backend tests to verify
- [ ] Update API documentation

**Files to Modify:**
```
backend/src/routes/games.js (delete after split)
backend/src/app.js (update import)
docs/API_DOCUMENTATION.md (verify routes still work)
```

**Note:** Do this AFTER Priority 0 (frontend restructure)

---

### 1.2 Consolidate API Layers

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

## ⚠️ Priority 2: Medium Impact (Next Sprint)

### 2.1 Move Feature-Specific Hooks from shared/

**Status:** ⏳ Not Started  
**Effort:** 1-2 hours  
**Impact:** Medium

**Tasks:**
- [ ] Move hooks to proper features:
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

**Status:** ⏳ Not Started  
**Effort:** 1-2 hours  
**Impact:** Medium

**Tasks:**
- [ ] Move feature-specific utils:
  ```
  frontend/src/utils/dashboardConstants.js → frontend/src/features/analytics/utils/
  frontend/src/utils/drillLabUtils.js      → frontend/src/features/drill-system/utils/
  frontend/src/utils/gameUtils.js          → frontend/src/features/game-management/utils/
  frontend/src/utils/positionUtils.js      → frontend/src/shared/utils/football/ (new folder)
  ```
- [ ] Delete test data:
  ```
  frontend/src/utils/testTeamData.js → DELETE
  ```
  
**Note:** Paths assume Priority 0 (frontend restructure) is complete

**Keep in frontend/src/utils/:**
```
✅ categoryColors.js (generic)
✅ index.ts (barrel export)
```
- [ ] Update imports
- [ ] Run tests to verify

**Keep in src/utils/:**
```
✅ categoryColors.js (generic)
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


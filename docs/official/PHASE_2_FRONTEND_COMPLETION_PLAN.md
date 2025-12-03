# Phase 2: Frontend Architecture Completion Plan

**Version:** 1.0  
**Date:** December 2025  
**Status:** In Progress  
**Goal:** Complete frontend Feature-Sliced Design migration

---

## 🎯 Overview

The frontend has undergone significant refactoring and now follows **Feature-Sliced Design** architecture. However, there are still remnants of the old structure that need to be cleaned up.

### Current Progress: ~85% Complete ✅

**Completed:**
- ✅ `app/` layer (layout, providers, router)
- ✅ `features/` folder with 8 domains
- ✅ `shared/` folder (ui, components, hooks, utils, api)
- ✅ Most features properly organized

**Remaining Work:**
- ⚠️ Old `src/api/` folder cleanup
- ⚠️ Old `src/hooks/` folder migration
- ⚠️ Old `src/utils/` folder migration
- ⚠️ Old `src/pages/` folder migration
- ⚠️ Loose components in `src/components/`
- ⚠️ Final cleanup and documentation

---

## 📊 Detailed Assessment

### ✅ What's Already Done Well

#### 1. **App Layer** (`frontend/src/app/`)
```
app/
├── layout/
│   ├── components/
│   ├── index.js
│   └── MainLayout.jsx
├── providers/
│   ├── DataProvider.jsx
│   ├── ThemeProvider.jsx
│   └── index.js
└── router/
    ├── guards/
    ├── index.jsx
    └── routes.jsx
```
**Status:** ✅ Complete and well-organized

---

#### 2. **Features Layer** (`frontend/src/features/`)

| Feature | Status | Components | API | Notes |
|---------|--------|------------|-----|-------|
| `analytics` | ✅ Complete | AnalyticsPage, DashboardPage, shared | ✅ | Well-organized |
| `drill-system` | ✅ Complete | DrillDesignerPage, DrillLibraryPage, shared | ✅ | Excellent structure |
| `game-management` | ✅ Complete | AddGamePage, GameDetailsPage, GamesSchedulePage | ✅ 8 API files | Very comprehensive |
| `player-management` | ✅ Complete | AddPlayerPage, PlayerDetailPage, PlayersPage, shared | ⚠️ Missing | Good structure |
| `reporting` | ✅ Complete | AddReportPage, modals | ⚠️ Missing | Decent structure |
| `team-management` | ✅ Complete | AddTeamPage, TacticBoardPage | ⚠️ Missing | Good structure |
| `training-management` | ✅ Complete | TrainingPlannerPage, components | ⚠️ Missing | Good structure |
| `user-management` | ✅ Complete | AccessDeniedPage, AddUserPage, LoginPage | ⚠️ Missing | Good structure |

**Status:** ✅ 8 features migrated, all well-structured

---

#### 3. **Shared Layer** (`frontend/src/shared/`)
```
shared/
├── api/
│   ├── client.js       ✅ Base API client
│   ├── endpoints.js    ✅ Endpoint constants
│   └── index.js
├── components/         ✅ 13 shared components
├── hooks/              ✅ 9 shared hooks
├── ui/
│   ├── primitives/     ✅ 63 Radix UI components
│   └── composed/       ✅ Composed components
└── utils/
    └── date/           ✅ Date utilities
```
**Status:** ✅ Well-organized and complete

---

### ⚠️ What Needs to Be Fixed

#### 1. **Old API Folder** (`frontend/src/api/`)

**Files to Migrate:**
```
src/api/
├── dataService.js      → DELETE (use feature-specific APIs or shared/api)
├── entities.js         → DELETE (use feature-specific APIs)
├── functions.js        → DELETE (use feature-specific APIs)
├── integrations.js     → DELETE or move to shared/api/
└── testConnection.js   → DELETE (testing utility)
```

**Action:** Audit each file, migrate any used functionality to feature-specific APIs, then delete folder.

---

#### 2. **Old Hooks Folder** (`frontend/src/hooks/`)

**Files to Migrate:**
```
src/hooks/
├── useAutosave.js      → Move to shared/hooks/
├── useFeature.js       → Move to shared/hooks/
└── index.js            → Delete after migration
```

**Action:** Move to `shared/hooks/`, update imports, delete old folder.

---

#### 3. **Old Utils Folder** (`frontend/src/utils/`)

**Files to Migrate:**
```
src/utils/
├── categoryColors.js      → Move to shared/utils/
├── dashboardConstants.js  → Move to features/analytics/utils/
├── drillLabUtils.js       → Move to features/drill-system/utils/
├── gameUtils.js           → Move to features/game-management/utils/
├── positionUtils.js       → Move to shared/utils/
├── testTeamData.js        → DELETE (test data)
└── index.ts               → Delete after migration
```

**Action:** Migrate each file to appropriate location (feature-specific or shared).

---

#### 4. **Old Pages Folder** (`frontend/src/pages/`)

**Files to Migrate:**
```
src/pages/
├── Settings/
│   ├── components/
│   │   ├── DatabaseSyncSection.jsx
│   │   └── OrganizationSettingsSection.jsx
│   └── index.jsx
├── SyncStatus.jsx
└── index.jsx              → Keep (router entry point)
```

**Action:** Create `features/settings/` feature with Settings page and components.

---

#### 5. **Loose Components** (`frontend/src/components/`)

**Files to Migrate:**
```
src/components/
├── FeatureGuard.jsx       → Move to app/router/guards/
├── PageLoader.jsx         → Move to shared/components/
└── ui/
    └── StatSliderControl.jsx → Move to shared/ui/composed/
```

**Action:** Move to appropriate locations, delete old folder.

---

## 🎯 Phase 2 Completion Tasks

### **Task 1: Migrate Old Hooks** ⏱️ 30 minutes

**Steps:**
1. Move `useAutosave.js` and `useFeature.js` to `shared/hooks/`
2. Update `shared/hooks/index.js` to export them
3. Find and update all imports across the codebase
4. Test affected features
5. Delete `frontend/src/hooks/` folder

**Commands:**
```bash
# Move files
mv frontend/src/hooks/useAutosave.js frontend/src/shared/hooks/
mv frontend/src/hooks/useFeature.js frontend/src/shared/hooks/

# Update shared hooks index
# Add exports to frontend/src/shared/hooks/index.js

# Find all imports to update
grep -r "from '@/hooks/" frontend/src/
grep -r "from '../hooks/" frontend/src/

# Delete old folder after verifying
rm -rf frontend/src/hooks/
```

**Commit:** `refactor(frontend): migrate old hooks to shared layer`

---

### **Task 2: Migrate Old Utils** ⏱️ 1 hour

**Steps:**
1. **Shared Utils** (move to `shared/utils/`):
   - `categoryColors.js` → `shared/utils/`
   - `positionUtils.js` → `shared/utils/`

2. **Feature-Specific Utils** (move to feature folders):
   - `dashboardConstants.js` → `features/analytics/utils/`
   - `drillLabUtils.js` → `features/drill-system/utils/`
   - `gameUtils.js` → `features/game-management/utils/`

3. **Delete Test Data**:
   - `testTeamData.js` → DELETE

4. Update all imports
5. Delete `frontend/src/utils/` folder

**Commands:**
```bash
# Shared utils
mv frontend/src/utils/categoryColors.js frontend/src/shared/utils/
mv frontend/src/utils/positionUtils.js frontend/src/shared/utils/

# Feature-specific utils
mv frontend/src/utils/dashboardConstants.js frontend/src/features/analytics/utils/
mv frontend/src/utils/drillLabUtils.js frontend/src/features/drill-system/utils/
mv frontend/src/utils/gameUtils.js frontend/src/features/game-management/utils/

# Delete test data
rm frontend/src/utils/testTeamData.js

# Update imports
grep -r "from '@/utils/" frontend/src/
grep -r "from '../utils/" frontend/src/

# Delete old folder after verifying
rm -rf frontend/src/utils/
```

**Commit:** `refactor(frontend): migrate old utils to appropriate layers`

---

### **Task 3: Create Settings Feature** ⏱️ 1 hour

**Steps:**
1. Create `features/settings/` folder structure
2. Move Settings page and components
3. Create settings API file if needed
4. Update router to use new Settings feature
5. Delete old `pages/Settings/` folder

**Structure:**
```
features/
└── settings/
    ├── components/
    │   ├── SettingsPage/
    │   │   ├── index.jsx
    │   │   ├── DatabaseSyncSection.jsx
    │   │   ├── OrganizationSettingsSection.jsx
    │   │   └── SyncStatusPanel.jsx (from SyncStatus.jsx)
    │   └── shared/
    ├── api/
    │   └── settingsApi.js
    ├── hooks/
    ├── utils/
    └── index.js
```

**Commands:**
```bash
# Create structure
mkdir -p frontend/src/features/settings/{components/SettingsPage,api,hooks,utils}

# Move files (you'll need to do this manually with proper refactoring)
# Move pages/Settings/ content to features/settings/components/SettingsPage/
# Move pages/SyncStatus.jsx to features/settings/components/SettingsPage/SyncStatusPanel.jsx

# Create index.js export
# Update router
# Test settings page

# Delete old folder
rm -rf frontend/src/pages/Settings/
rm frontend/src/pages/SyncStatus.jsx
```

**Commit:** `refactor(frontend): migrate Settings to features layer`

---

### **Task 4: Migrate Loose Components** ⏱️ 30 minutes

**Steps:**
1. Move `FeatureGuard.jsx` → `app/router/guards/`
2. Move `PageLoader.jsx` → `shared/components/`
3. Move `ui/StatSliderControl.jsx` → `shared/ui/composed/`
4. Update all imports
5. Delete `frontend/src/components/` folder (except `ui/` if needed)

**Commands:**
```bash
# Move guards
mv frontend/src/components/FeatureGuard.jsx frontend/src/app/router/guards/

# Move shared components
mv frontend/src/components/PageLoader.jsx frontend/src/shared/components/
mv frontend/src/components/ui/StatSliderControl.jsx frontend/src/shared/ui/composed/

# Update imports
grep -r "from '@/components/FeatureGuard'" frontend/src/
grep -r "from '@/components/PageLoader'" frontend/src/
grep -r "from '@/components/ui/StatSliderControl'" frontend/src/

# Delete empty folders
rm -rf frontend/src/components/ui/
rm -rf frontend/src/components/ # if completely empty
```

**Commit:** `refactor(frontend): migrate loose components to proper layers`

---

### **Task 5: Audit and Cleanup Old API Folder** ⏱️ 1-2 hours

**Steps:**
1. **Audit each file** in `frontend/src/api/`:
   - Check if it's still used (search for imports)
   - If used, migrate to feature-specific API or shared API
   - If unused, mark for deletion

2. **Common scenarios**:
   - `dataService.js` - Likely replaced by feature-specific APIs
   - `entities.js` - Likely replaced by feature-specific APIs
   - `functions.js` - May have utility functions to migrate
   - `integrations.js` - May need to move to `shared/api/`

3. **Delete the folder** after migration

**Commands:**
```bash
# Check usage of each file
grep -r "from '@/api/dataService'" frontend/src/
grep -r "from '@/api/entities'" frontend/src/
grep -r "from '@/api/functions'" frontend/src/
grep -r "from '@/api/integrations'" frontend/src/

# If any are still used, refactor them to use new API structure
# Then delete the folder
rm -rf frontend/src/api/
```

**Commit:** `refactor(frontend): remove old API layer`

---

### **Task 6: Create Missing Feature APIs** ⏱️ 1-2 hours

**Add API files to features that are missing them:**

1. **player-management** - Create `api/playersApi.js`
2. **reporting** - Create `api/reportsApi.js`
3. **team-management** - Create `api/teamsApi.js`
4. **training-management** - Create `api/trainingsApi.js`
5. **user-management** - Create `api/usersApi.js`

**Template for feature API:**
```javascript
// features/{feature}/api/{feature}Api.js
import { apiClient } from '@/shared/api';

export const {feature}Api = {
  getAll: () => apiClient.get('/api/{endpoint}'),
  getById: (id) => apiClient.get(`/api/{endpoint}/${id}`),
  create: (data) => apiClient.post('/api/{endpoint}', data),
  update: (id, data) => apiClient.put(`/api/{endpoint}/${id}`, data),
  delete: (id) => apiClient.delete(`/api/{endpoint}/${id}`),
};
```

**Commit:** `feat(frontend): add missing feature API files`

---

### **Task 7: Final Cleanup and Documentation** ⏱️ 1 hour

**Steps:**
1. **Verify folder structure** is clean:
   ```bash
   # Should only have these at src root:
   ls frontend/src/
   # Expected: app/, features/, shared/, styles/, main.jsx, App.jsx, index.css, setupTests.js, __mocks__/, lib/, pages/index.jsx
   ```

2. **Update imports** - ensure all use `@/` alias consistently

3. **Create feature documentation** - Document how to create a new feature

4. **Update main README** - Reflect new structure

5. **Delete any remaining backup files**

**Commit:** `docs(frontend): document Feature-Sliced Design architecture`

---

## 📋 Phase 2 Completion Checklist

- [ ] **Task 1:** Migrate old hooks to shared layer (30 min)
- [ ] **Task 2:** Migrate old utils to appropriate layers (1 hour)
- [ ] **Task 3:** Create Settings feature (1 hour)
- [ ] **Task 4:** Migrate loose components (30 min)
- [ ] **Task 5:** Audit and cleanup old API folder (1-2 hours)
- [ ] **Task 6:** Create missing feature APIs (1-2 hours)
- [ ] **Task 7:** Final cleanup and documentation (1 hour)

**Total Estimated Time:** 6-8 hours

---

## 🎯 Success Criteria

✅ **Phase 2 is complete when:**

1. ✅ No files remain in `frontend/src/api/` (deleted)
2. ✅ No files remain in `frontend/src/hooks/` (migrated to shared)
3. ✅ No files remain in `frontend/src/utils/` (migrated to features or shared)
4. ✅ No files remain in `frontend/src/components/` (migrated to shared or features)
5. ✅ Settings has its own feature folder
6. ✅ All features have API files
7. ✅ All imports use `@/` alias consistently
8. ✅ Documentation is updated

---

## 📁 Final Target Structure

```
frontend/src/
├── app/                           ✅ App-level code
│   ├── layout/
│   ├── providers/
│   └── router/
│       └── guards/                 ✅ FeatureGuard moved here
│
├── features/                      ✅ 9 feature domains
│   ├── analytics/
│   ├── drill-system/
│   ├── game-management/
│   ├── player-management/
│   ├── reporting/
│   ├── settings/                   🆕 Settings feature
│   ├── team-management/
│   ├── training-management/
│   └── user-management/
│
├── shared/                        ✅ Shared code
│   ├── api/                        ✅ Base client
│   ├── components/                 ✅ + PageLoader
│   ├── hooks/                      ✅ + useAutosave, useFeature
│   ├── ui/
│   │   ├── primitives/
│   │   └── composed/               ✅ + StatSliderControl
│   └── utils/                      ✅ + categoryColors, positionUtils
│
├── pages/                         ✅ Only router entry
│   └── index.jsx
│
├── styles/                        ✅ Global styles
├── lib/                           ✅ External lib configs
├── __mocks__/                     ✅ Test mocks
├── main.jsx                       ✅ Entry point
├── App.jsx                        ✅ Root component
└── setupTests.js                  ✅ Test setup
```

**Clean, organized, production-ready!** ✨

---

## 🚀 Getting Started

To begin Phase 2 completion:

```bash
# Create a new branch for Phase 2 work
git checkout -b refactor/frontend-phase-2-completion

# Follow tasks 1-7 in order
# Commit after each task
# Test thoroughly between tasks

# When complete, merge to main
```

---

## 📚 Related Documentation

- **Backend Architecture:** `docs/official/backendSummary.md`
- **API Reference:** `docs/official/apiDocumentation.md`
- **Original Refactoring Plan:** `docs/restructure/ARCHITECTURE_REFACTORING_PLAN.md`

---

**Let's complete this refactoring! 🎯**

*Version: 1.0*  
*Last Updated: December 2025*


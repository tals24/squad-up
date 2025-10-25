# 🏗️ Squad-Up: Full-Project Architecture & Refactoring Analysis

**Project**: Football/Soccer Team Management System  
**Status**: MVP Development Phase  
**Developer**: Solo  
**Date**: October 2025

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Identified Issues & Technical Debt](#identified-issues--technical-debt)
4. [Proposed Architecture](#proposed-architecture)
5. [Safe Migration Plan](#safe-migration-plan)
6. [Code Standards & Tooling](#code-standards--tooling)
7. [Performance & Scalability Considerations](#performance--scalability-considerations)

---

## 1. Executive Summary

### 🎯 Project Context

**Primary Purpose**: A comprehensive football team management system for coaches and managers to:
- Manage drill design and training sessions
- Track game performance and generate reports
- Monitor player development and statistics
- Plan tactics and formations

**Core Features**:
- 🎨 **DrillDesigner** (formerly DrillLab) - Visual drill creation tool
- 📋 **Game Management** - Match reports, rosters, and tactical boards
- 📊 **Player Tracking** - Performance analytics and development timelines
- 📅 **Training Planner** - Schedule and organize training sessions

**Tech Stack**:
- **Frontend**: React 18.2 + Vite + React Router v7
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **UI**: Radix UI + Tailwind CSS + Framer Motion
- **Auth**: Firebase Authentication + JWT
- **State**: React Context API + Hooks

**Future Goals**:
- ✅ Handle large-scale data (many players/teams)
- ✅ Multi-tenancy support
- ✅ Feature expansion across multiple domains
- ✅ Maintainable, scalable codebase

---

## 2. Current State Analysis

### 📊 Current Folder Structure

```
squad-up-with-backend/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express server
│   │   ├── config/                   # Database & Firebase config
│   │   ├── middleware/               # Auth middleware
│   │   ├── models/                   # Mongoose schemas (12 models)
│   │   └── routes/                   # API endpoints (14 route files)
│   └── scripts/                      # Data generation scripts
│
├── src/                              # FRONTEND
│   ├── api/                          # API client services
│   │   ├── dataService.js
│   │   ├── entities.js
│   │   ├── functions.js
│   │   └── integrations.js
│   │
│   ├── components/                   # ⚠️ MIXED CONCERNS
│   │   ├── ui/                       # 63 Radix UI components
│   │   ├── dashboard/                # Dashboard-specific components
│   │   ├── drilldesigner/            # ⚠️ 6 files (3 duplicates!)
│   │   ├── player/                   # Player-specific components
│   │   ├── players/                  # Players list components
│   │   ├── DataContext.jsx           # ⚠️ Global state context
│   │   ├── DrillCanvas.jsx           # ⚠️ Shared drill component
│   │   ├── FormationEditor.jsx       # ⚠️ Shared tactical component
│   │   ├── WeeklyCalendar.jsx        # ⚠️ Shared training component
│   │   ├── Phase3Showcase.jsx        # ⚠️ UNUSED - Demo component
│   │   ├── Phase4Demo.jsx            # ⚠️ UNUSED - Demo component
│   │   ├── DesignSystemShowcase.jsx  # ⚠️ UNUSED - Demo component
│   │   ├── UnifiedComponentsShowcase.jsx # ⚠️ UNUSED - Demo
│   │   └── ... 15+ other loose components
│   │
│   ├── pages/                        # ⚠️ INCONSISTENT STRUCTURE
│   │   ├── GameDetails/              # ✅ Modular (9 components)
│   │   │   ├── components/
│   │   │   │   ├── dialogs/
│   │   │   │   ├── GameDayRosterSidebar.jsx
│   │   │   │   ├── TacticalBoard.jsx
│   │   │   │   └── ...
│   │   │   ├── formations.js
│   │   │   └── index.jsx
│   │   ├── TrainingPlanner/          # ✅ Modular (3 components)
│   │   │   ├── components/
│   │   │   └── index.jsx
│   │   ├── DrillLibrary/             # ✅ Modular (5 components)
│   │   │   ├── components/dialogs/
│   │   │   └── index.jsx
│   │   ├── GameDetails.old.jsx       # ⚠️ LEGACY BACKUP
│   │   ├── GameDetails.backup.jsx    # ⚠️ LEGACY BACKUP
│   │   ├── GameDetailsOriginal.jsx   # ⚠️ LEGACY BACKUP
│   │   ├── TrainingPlanner.old.jsx   # ⚠️ LEGACY BACKUP
│   │   ├── DrillLibrary.old.jsx      # ⚠️ LEGACY BACKUP
│   │   ├── Dashboard.jsx             # ⚠️ Monolithic (400+ lines)
│   │   ├── Players.jsx               # ⚠️ Monolithic
│   │   ├── Player.jsx                # ⚠️ Monolithic
│   │   ├── GamesSchedule.jsx         # ⚠️ Monolithic
│   │   ├── DrillDesigner.jsx         # ⚠️ Monolithic
│   │   ├── TacticBoard.jsx           # ⚠️ Monolithic
│   │   ├── AddPlayer.jsx             # ⚠️ Monolithic
│   │   ├── AddGame.jsx               # ⚠️ Monolithic
│   │   ├── AddTeam.jsx               # ⚠️ Monolithic
│   │   ├── AddUser.jsx               # ⚠️ Monolithic
│   │   ├── AddReport.jsx             # ⚠️ Monolithic
│   │   ├── Analytics.jsx             # ⚠️ Monolithic
│   │   ├── ComponentsDemo.jsx        # ⚠️ UNUSED - Demo page
│   │   └── ...
│   │
│   ├── hooks/                        # ⚠️ DOMAIN-SPECIFIC
│   │   ├── useDashboardData.js       # Dashboard hook
│   │   ├── useDrillLabData.js        # DrillDesigner hook
│   │   ├── usePlayersData.js         # Players hook
│   │   └── ...
│   │
│   ├── utils/                        # ⚠️ MIXED UTILITIES
│   │   ├── categoryColors.js
│   │   ├── dashboardConstants.js
│   │   ├── dateUtils.js
│   │   ├── drillLabUtils.js
│   │   ├── gameUtils.js
│   │   ├── positionUtils.js
│   │   ├── seasonUtils.js
│   │   └── testTeamData.js           # ⚠️ Test data
│   │
│   ├── services/                     # Auth services
│   ├── contexts/                     # Theme context
│   ├── lib/                          # ⚠️ MIXED TS/JS utilities
│   └── styles/                       # Global styles
│
├── docs/                             # Documentation
├── backup-2025-09-18-1748/           # ⚠️ OLD BACKUP FOLDER
└── [config files]
```

### 🔍 Key Observations

#### ✅ **Strengths**
1. **Recent Refactoring**: `GameDetails`, `TrainingPlanner`, and `DrillLibrary` now have modular structures
2. **Good UI Component Library**: Well-organized Radix UI components in `/components/ui`
3. **Clear Backend Structure**: Models, routes, and middleware well-separated
4. **Comprehensive Feature Set**: Core MVP features are functional

#### ⚠️ **Critical Issues**

1. **Inconsistent Architecture** (יציבות)
   - 3 pages are modular, 12+ pages are monolithic
   - No clear pattern for where components live
   - Mixed concerns in `/components` folder

2. **File Duplication** (ניקיון הקוד)
   - 5 `.old.jsx` and `.backup.jsx` files
   - `DrillLab*` components alongside `DrillDesigner*` components
   - Multiple showcase/demo components not in production
   - Old backup folder from September

3. **Poor Discoverability** (אחידות)
   - Feature-related components scattered across `/components`
   - Hard to find all code related to a single feature
   - No clear ownership boundaries

4. **Tight Coupling**
   - Global `DataContext.jsx` fetches ALL data upfront
   - Shared components (`FormationEditor`, `DrillCanvas`) not properly organized
   - API layer mixes concerns (`dataService.js`, `entities.js`, `functions.js`)

5. **Scalability Concerns** (גמישות וגדילה בהמשך)
   - No code splitting strategy
   - All data loaded on initial mount
   - No lazy loading for routes
   - Monolithic components will become harder to maintain

6. **Missing Standards**
   - No ESLint/Prettier config enforced
   - Mixed TypeScript/JavaScript in `/lib`
   - Inconsistent naming conventions

---

## 3. Identified Issues & Technical Debt

### 🗑️ Files Safe to Delete

#### **A. Legacy Backup Files** (0% Risk)
```
✅ DELETE:
- src/pages/GameDetails.old.jsx          (1,678 lines - replaced by modular version)
- src/pages/GameDetails.backup.jsx       (1,104 lines - duplicate)
- src/pages/GameDetailsOriginal.jsx      (882 lines - duplicate)
- src/pages/TrainingPlanner.old.jsx      (replaced by modular version)
- src/pages/DrillLibrary.old.jsx         (replaced by modular version)
- backup-2025-09-18-1748/                (entire old backup folder)
```
**Reason**: These are git-tracked backups. Your git history preserves all versions.  
**Impact**: Removes ~4,500 lines of dead code  
**Safety**: ✅ 100% safe (use git if you need to reference old code)

---

#### **B. Duplicate DrillDesigner Components** (0% Risk)
```
✅ DELETE:
- src/components/drilldesigner/DrillLabCanvas.jsx
- src/components/drilldesigner/DrillLabHeader.jsx
- src/components/drilldesigner/DrillLabToolbar.jsx
```
**Reason**: These are old "DrillLab" components. You renamed to "DrillDesigner" but didn't remove old files.  
**Verification**: The `index.js` only exports `DrillDesigner*` versions.  
**Impact**: Removes 3 duplicate files  
**Safety**: ✅ 100% safe (not imported anywhere)

---

#### **C. Unused Demo/Showcase Components** (0% Risk)
```
✅ DELETE:
- src/components/Phase3Showcase.jsx
- src/components/Phase4Demo.jsx
- src/components/DesignSystemShowcase.jsx
- src/components/UnifiedComponentsShowcase.jsx
- src/pages/ComponentsDemo.jsx
```
**Reason**: These are development showcase components, not used in production routes.  
**Verification**: Not imported in `src/pages/index.jsx` routing.  
**Impact**: Removes 5 demo files  
**Safety**: ⚠️ 95% safe (verify they're not linked in any admin/dev route first)

---

#### **D. Test Data Files** (Low Risk)
```
⚠️ CONSIDER MOVING TO /backend/scripts:
- src/utils/testTeamData.js
```
**Reason**: Test/mock data should live with backend scripts, not frontend utils.  
**Impact**: Better organization  
**Safety**: ✅ Safe if moved (ensure no frontend references)

---

### ⚠️ Architectural Anti-Patterns

#### **1. God Context: `DataContext.jsx`**
**Problem**: 
- Fetches ALL data from backend in one massive API call (`/api/data/all`)
- Every page re-renders when any data changes
- No data caching or lazy loading
- Doesn't scale to large datasets

**Impact**:
- Poor performance with many players/teams
- Wasteful network requests
- Difficult to add granular permissions

**Solution**: Implement feature-specific data hooks or use React Query/SWR

---

#### **2. Monolithic Page Components**
**Problem**:
- 12+ pages are 300-800+ lines each
- Mix state management, UI, business logic, and API calls
- Hard to test, reuse, or maintain

**Examples**:
- `Dashboard.jsx` (~400 lines)
- `Players.jsx` (~350 lines)
- `AddReport.jsx` (~700+ lines)

**Solution**: Break into modular structures like `GameDetails/`

---

#### **3. Scattered Feature Components**
**Problem**:
- Dashboard components in `/components/dashboard`
- Player components in `/components/player` AND `/components/players`
- Drill components split between `/components` and `/components/drilldesigner`

**Impact**: Hard to find all code for a feature

**Solution**: Feature-based folder structure

---

#### **4. Mixed API Layer**
**Problem**:
- `dataService.js` - generic CRUD
- `entities.js` - entity-specific operations
- `functions.js` - utility functions
- `integrations.js` - external integrations

**Impact**: Unclear which file to use for what

**Solution**: Organize by domain/feature

---

## 4. Proposed Architecture

### 🎯 Design Principles

1. **Feature-First Organization** - Group by domain/feature, not by file type
2. **Scalable for Growth** - Easy to add new features without restructuring
3. **Clear Ownership** - Each folder has a single, clear purpose
4. **Progressive Enhancement** - Migrate incrementally, no big-bang refactor
5. **Performance-Ready** - Support code splitting, lazy loading, and caching

### 🏛️ Recommended Architecture: **Feature-Sliced Design (Adapted)**

This architecture balances simplicity (for solo dev) with scalability (for future growth).

---

### 📁 New Folder Structure

```
squad-up-with-backend/
│
├── backend/                          # ✅ Keep as-is (well-structured)
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   └── scripts/
│
├── src/                              # FRONTEND - NEW STRUCTURE
│   │
│   ├── app/                          # 🆕 App-level code
│   │   ├── providers/                # Context providers
│   │   │   ├── DataProvider.jsx      # Refactored global data (or remove)
│   │   │   ├── ThemeProvider.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── router/                   # Routing configuration
│   │   │   ├── index.jsx             # Main router
│   │   │   ├── routes.jsx            # Route definitions
│   │   │   └── guards/               # Auth guards, etc.
│   │   ├── layout/                   # App-level layouts
│   │   │   ├── MainLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   └── components/
│   │   │       ├── Header.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Footer.jsx
│   │   └── App.jsx                   # Root app component
│   │
│   ├── features/                     # 🆕 FEATURE MODULES
│   │   │
│   │   ├── dashboard/                # Dashboard feature
│   │   │   ├── components/
│   │   │   │   ├── DashboardHeader.jsx
│   │   │   │   ├── DashboardStats.jsx
│   │   │   │   ├── GameZone.jsx
│   │   │   │   └── RecentActivity.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useDashboardData.js
│   │   │   ├── utils/
│   │   │   │   └── dashboardConstants.js
│   │   │   ├── api/
│   │   │   │   └── dashboardApi.js
│   │   │   └── Dashboard.page.jsx    # Main page component
│   │   │
│   │   ├── games/                    # Game management feature
│   │   │   ├── components/
│   │   │   │   ├── GameCard.jsx
│   │   │   │   ├── GameForm.jsx
│   │   │   │   └── GameFilters.jsx
│   │   │   ├── game-details/         # Sub-feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── GameDayRosterSidebar.jsx
│   │   │   │   │   ├── TacticalBoard.jsx
│   │   │   │   │   ├── MatchAnalysisSidebar.jsx
│   │   │   │   │   └── dialogs/
│   │   │   │   │       ├── FinalReportDialog.jsx
│   │   │   │   │       ├── PlayerPerformanceDialog.jsx
│   │   │   │   │       └── PlayerSelectionDialog.jsx
│   │   │   │   ├── formations.js
│   │   │   │   └── GameDetails.page.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useGameData.js
│   │   │   ├── utils/
│   │   │   │   └── gameUtils.js
│   │   │   ├── api/
│   │   │   │   ├── gamesApi.js
│   │   │   │   ├── gameRostersApi.js
│   │   │   │   └── gameReportsApi.js
│   │   │   ├── GamesSchedule.page.jsx
│   │   │   ├── AddGame.page.jsx
│   │   │   └── index.js              # Public exports
│   │   │
│   │   ├── players/                  # Player management feature
│   │   │   ├── components/
│   │   │   │   ├── PlayerCard.jsx
│   │   │   │   ├── PlayerFilters.jsx
│   │   │   │   ├── PlayerGrid.jsx
│   │   │   │   ├── PlayersHeader.jsx
│   │   │   │   └── PlayerForm.jsx
│   │   │   ├── player-profile/       # Sub-feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── PlayerProfileCard.jsx
│   │   │   │   │   ├── PerformanceStatsCard.jsx
│   │   │   │   │   ├── DevelopmentTimeline.jsx
│   │   │   │   │   └── TimelineItem.jsx
│   │   │   │   └── PlayerProfile.page.jsx
│   │   │   ├── hooks/
│   │   │   │   └── usePlayersData.js
│   │   │   ├── utils/
│   │   │   │   ├── positionUtils.js
│   │   │   │   └── categoryColors.js
│   │   │   ├── api/
│   │   │   │   └── playersApi.js
│   │   │   ├── Players.page.jsx
│   │   │   ├── AddPlayer.page.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── training/                 # Training management feature
│   │   │   ├── components/
│   │   │   │   ├── WeeklyCalendar.jsx
│   │   │   │   ├── SessionCard.jsx
│   │   │   │   └── DrillLibrarySidebar.jsx
│   │   │   ├── training-planner/     # Sub-feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── TrainingPlannerHeader.jsx
│   │   │   │   │   └── TrainingPlannerContent.jsx
│   │   │   │   └── TrainingPlanner.page.jsx
│   │   │   ├── drill-designer/       # Sub-feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── DrillDesignerHeader.jsx
│   │   │   │   │   ├── DrillDesignerToolbar.jsx
│   │   │   │   │   ├── DrillDesignerCanvas.jsx
│   │   │   │   │   └── DrillCanvas.jsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useDrillDesignerData.js
│   │   │   │   │   ├── useDrillDesignerHistory.js
│   │   │   │   │   └── useDrillDesignerMode.js
│   │   │   │   ├── utils/
│   │   │   │   │   └── drillDesignerUtils.js
│   │   │   │   └── DrillDesigner.page.jsx
│   │   │   ├── drill-library/        # Sub-feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── DrillLibraryHeader.jsx
│   │   │   │   │   ├── DrillGrid.jsx
│   │   │   │   │   └── dialogs/
│   │   │   │   │       ├── AddDrillDialog.jsx
│   │   │   │   │       └── DrillDetailDialog.jsx
│   │   │   │   └── DrillLibrary.page.jsx
│   │   │   ├── api/
│   │   │   │   ├── trainingsApi.js
│   │   │   │   ├── drillsApi.js
│   │   │   │   └── sessionDrillsApi.js
│   │   │   └── index.js
│   │   │
│   │   ├── tactics/                  # Tactical planning feature
│   │   │   ├── components/
│   │   │   │   ├── FormationEditor.jsx
│   │   │   │   ├── FormationEditorModal.jsx
│   │   │   │   └── formations.jsx
│   │   │   ├── TacticBoard.page.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── teams/                    # Team management feature
│   │   │   ├── components/
│   │   │   │   ├── TeamCard.jsx
│   │   │   │   └── TeamForm.jsx
│   │   │   ├── api/
│   │   │   │   └── teamsApi.js
│   │   │   ├── AddTeam.page.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── analytics/                # Analytics feature
│   │   │   ├── components/
│   │   │   │   └── AnalyticsDashboard.jsx
│   │   │   ├── Analytics.page.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── reports/                  # Reporting feature
│   │   │   ├── components/
│   │   │   │   ├── ReportForm.jsx
│   │   │   │   ├── MatchReportModal.jsx
│   │   │   │   └── PlayerPerformanceModal.jsx
│   │   │   ├── api/
│   │   │   │   ├── gameReportsApi.js
│   │   │   │   └── scoutReportsApi.js
│   │   │   ├── AddReport.page.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── auth/                     # Authentication feature
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── LoginModal.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js
│   │   │   ├── api/
│   │   │   │   └── authApi.js
│   │   │   ├── Login.page.jsx
│   │   │   ├── AccessDenied.page.jsx
│   │   │   └── index.js
│   │   │
│   │   └── users/                    # User management feature
│   │       ├── components/
│   │       │   └── UserForm.jsx
│   │       ├── hooks/
│   │       │   └── useUserRole.js
│   │       ├── api/
│   │       │   └── usersApi.js
│   │       ├── AddUser.page.jsx
│   │       └── index.js
│   │
│   ├── shared/                       # 🆕 SHARED CODE (used by 2+ features)
│   │   │
│   │   ├── ui/                       # Design system components
│   │   │   ├── primitives/           # Radix UI wrappers
│   │   │   │   ├── button.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── select.jsx
│   │   │   │   └── ... (63 components)
│   │   │   ├── composed/             # App-specific composed components
│   │   │   │   ├── DataCard.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── LoadingState.jsx
│   │   │   │   ├── PageHeader.jsx
│   │   │   │   ├── SearchFilter.jsx
│   │   │   │   └── StandardButton.jsx
│   │   │   └── index.js              # Central export
│   │   │
│   │   ├── components/               # Shared business components
│   │   │   ├── ConfirmationToast.jsx
│   │   │   ├── CustomNumberInput.jsx
│   │   │   ├── CustomTooltip.jsx
│   │   │   └── PlayerSelectionModal.jsx
│   │   │
│   │   ├── hooks/                    # Shared hooks
│   │   │   ├── use-mobile.jsx
│   │   │   ├── useRecentEvents.js
│   │   │   └── index.js
│   │   │
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── date/
│   │   │   │   ├── dateUtils.js
│   │   │   │   └── seasonUtils.js
│   │   │   ├── formatting/
│   │   │   │   └── index.ts
│   │   │   ├── validation/
│   │   │   │   └── schemas.js
│   │   │   └── index.js
│   │   │
│   │   ├── api/                      # Shared API utilities
│   │   │   ├── client.js             # Base API client (fetch wrapper)
│   │   │   ├── endpoints.js          # API endpoint constants
│   │   │   └── index.js
│   │   │
│   │   ├── lib/                      # External library configs
│   │   │   ├── theme.ts
│   │   │   ├── utils.js              # cn() helper
│   │   │   └── accessibility.ts
│   │   │
│   │   └── config/                   # App configuration
│   │       ├── firebase.js
│   │       └── constants.js
│   │
│   ├── styles/                       # Global styles
│   │   ├── index.css                 # Main entry
│   │   ├── design-system.css
│   │   ├── dark-mode.css
│   │   └── responsive-design.css
│   │
│   └── main.jsx                      # App entry point
│
├── public/                           # Static assets
├── docs/                             # Documentation
└── [config files]
```

---

### 📐 Directory Responsibilities

| Directory | Purpose | When to Use | Examples |
|-----------|---------|-------------|----------|
| `app/` | App-level setup, routing, providers, layout | Framework code, not business logic | Router, Theme provider, Auth guard |
| `features/` | Self-contained business domains | Code specific to a single feature/domain | Games, Players, Training |
| `features/{name}/components` | UI components for this feature only | Components used only in this feature | `GameCard`, `PlayerFilters` |
| `features/{name}/hooks` | Custom hooks for this feature | Feature-specific state/logic | `useGameData`, `useDrillDesignerMode` |
| `features/{name}/api` | API calls for this feature | Backend communication for this feature | `gamesApi.js`, `playersApi.js` |
| `features/{name}/utils` | Utilities for this feature | Helper functions for this feature | `gameUtils.js`, `drillDesignerUtils.js` |
| `features/{name}/*.page.jsx` | Page components | Top-level route components | `Dashboard.page.jsx`, `Players.page.jsx` |
| `shared/ui` | Reusable UI components | Design system, used by 2+ features | `Button`, `Dialog`, `DataCard` |
| `shared/components` | Reusable business components | Cross-feature components | `PlayerSelectionModal` |
| `shared/hooks` | Reusable hooks | Hooks used by 2+ features | `use-mobile`, `useRecentEvents` |
| `shared/utils` | Reusable utilities | Pure functions, no UI | Date formatting, validation |
| `shared/api` | API client & shared API logic | Base fetch wrapper, endpoints | `client.js`, `endpoints.js` |

---

### 🎨 Naming Conventions

1. **File Names**:
   - Components: `PascalCase.jsx` (e.g., `PlayerCard.jsx`)
   - Pages: `PascalCase.page.jsx` (e.g., `Dashboard.page.jsx`)
   - Hooks: `camelCase.js` (e.g., `useGameData.js`)
   - Utils: `camelCase.js` (e.g., `dateUtils.js`)
   - API: `camelCase.js` (e.g., `gamesApi.js`)

2. **Folder Names**:
   - Features: `kebab-case` (e.g., `drill-designer/`, `training-planner/`)
   - Sub-features: `kebab-case` (e.g., `game-details/`, `player-profile/`)

3. **Component Names**:
   - Use descriptive, domain-specific names
   - Avoid generic names like `Container`, `Wrapper`
   - Page components end with `.page.jsx` for clarity

4. **Import Paths**:
   - Use absolute imports with `@/` alias (already configured in `jsconfig.json`)
   - Prefer named exports for better tree-shaking
   - Use barrel exports (`index.js`) for public APIs

---

### 🔄 Before vs. After Comparison

#### **Current Structure (Example: Game Management)**

```
❌ BEFORE - Code scattered across multiple locations:

src/
├── components/
│   ├── FormationEditor.jsx           # Shared tactical component
│   ├── MatchReportModal.jsx          # Game-specific modal
│   └── PlayerPerformanceModal.jsx    # Game-specific modal
├── pages/
│   ├── GameDetails/                  # Modular
│   │   └── ... (9 files)
│   ├── GamesSchedule.jsx             # Monolithic
│   └── AddGame.jsx                   # Monolithic
├── hooks/
│   └── (no game-specific hooks)
├── utils/
│   └── gameUtils.js                  # Game utilities
└── api/
    ├── dataService.js                # Generic CRUD
    └── entities.js                   # Mixed entity operations
```

**Problems**:
- Hard to find all game-related code
- `GamesSchedule.jsx` is 300+ lines, monolithic
- Shared modals in wrong location
- No clear API layer for games

---

#### **New Structure (Example: Game Management)**

```
✅ AFTER - All game code in one place:

src/
└── features/
    └── games/
        ├── components/
        │   ├── GameCard.jsx
        │   ├── GameForm.jsx
        │   └── GameFilters.jsx
        ├── game-details/             # Sub-feature
        │   ├── components/
        │   │   ├── GameDayRosterSidebar.jsx
        │   │   ├── TacticalBoard.jsx
        │   │   ├── MatchAnalysisSidebar.jsx
        │   │   └── dialogs/
        │   │       ├── FinalReportDialog.jsx
        │   │       ├── PlayerPerformanceDialog.jsx
        │   │       └── PlayerSelectionDialog.jsx
        │   ├── formations.js
        │   └── GameDetails.page.jsx
        ├── hooks/
        │   └── useGameData.js
        ├── utils/
        │   └── gameUtils.js
        ├── api/
        │   ├── gamesApi.js
        │   ├── gameRostersApi.js
        │   └── gameReportsApi.js
        ├── GamesSchedule.page.jsx    # Refactored to use components
        ├── AddGame.page.jsx           # Refactored to use components
        └── index.js

shared/
└── components/
    └── FormationEditor.jsx           # Still shared (used by tactics + games)
```

**Benefits**:
- ✅ All game code in one folder
- ✅ Easy to find and modify
- ✅ Clear API layer
- ✅ Reusable components extracted
- ✅ Scalable for new game features

---

## 5. Safe Migration Plan

### 🛡️ Migration Strategy

**Approach**: **Incremental, Feature-by-Feature Migration**

- ✅ No big-bang refactor
- ✅ Migrate one feature at a time
- ✅ Test after each migration
- ✅ Keep app functional throughout
- ✅ Git commits after each step

---

### 📅 Phased Implementation

#### **Phase 0: Preparation & Cleanup** ⏱️ 1-2 hours

**Goal**: Remove dead code, set up tooling

1. **Delete Legacy Files** (30 min)
   ```bash
   # Create backup branch first
   git checkout -b backup/pre-refactor
   git push origin backup/pre-refactor
   
   # Switch to refactor branch
   git checkout feature/project-restructure
   
   # Delete legacy backup files
   rm src/pages/GameDetails.old.jsx
   rm src/pages/GameDetails.backup.jsx
   rm src/pages/GameDetailsOriginal.jsx
   rm src/pages/TrainingPlanner.old.jsx
   rm src/pages/DrillLibrary.old.jsx
   rm -rf backup-2025-09-18-1748/
   
   # Delete duplicate DrillLab components
   rm src/components/drilldesigner/DrillLabCanvas.jsx
   rm src/components/drilldesigner/DrillLabHeader.jsx
   rm src/components/drilldesigner/DrillLabToolbar.jsx
   
   # Delete demo/showcase components (verify first!)
   rm src/components/Phase3Showcase.jsx
   rm src/components/Phase4Demo.jsx
   rm src/components/DesignSystemShowcase.jsx
   rm src/components/UnifiedComponentsShowcase.jsx
   rm src/pages/ComponentsDemo.jsx
   
   git add -A
   git commit -m "chore: remove legacy backup files and demo components"
   ```

2. **Set Up Code Standards** (30 min)
   - Install ESLint + Prettier with Airbnb config
   - Configure auto-formatting
   - Add lint script to `package.json`

3. **Create New Folder Structure** (30 min)
   ```bash
   # Create new directories
   mkdir -p src/app/{providers,router,layout}
   mkdir -p src/features
   mkdir -p src/shared/{ui/primitives,ui/composed,components,hooks,utils,api,lib,config}
   ```

4. **Document Migration Plan** (30 min)
   - Create `MIGRATION.md` with checklist
   - Track which features are migrated

**Commit**: `chore: prepare project structure for refactoring`

---

#### **Phase 1: Foundation - Shared Layer** ⏱️ 2-3 hours

**Goal**: Establish shared utilities and UI components

1. **Move UI Components** (1 hour)
   ```
   src/components/ui/ → src/shared/ui/primitives/
   ```
   - Move all 63 Radix UI components
   - Create `src/shared/ui/index.js` barrel export
   - Update imports across the app (use find & replace)

2. **Move Shared Components** (30 min)
   ```
   src/components/DataCard.jsx → src/shared/ui/composed/
   src/components/EmptyState.jsx → src/shared/ui/composed/
   src/components/LoadingState.jsx → src/shared/ui/composed/
   src/components/ConfirmationToast.jsx → src/shared/components/
   src/components/CustomNumberInput.jsx → src/shared/components/
   src/components/CustomTooltip.jsx → src/shared/components/
   ```

3. **Move Shared Hooks** (30 min)
   ```
   src/hooks/use-mobile.jsx → src/shared/hooks/
   src/hooks/useRecentEvents.js → src/shared/hooks/
   ```
   - Create `src/shared/hooks/index.js` barrel export

4. **Move Shared Utils** (30 min)
   ```
   src/utils/dateUtils.js → src/shared/utils/date/
   src/utils/seasonUtils.js → src/shared/utils/date/
   src/lib/utils.js → src/shared/lib/
   src/lib/theme.ts → src/shared/lib/
   ```

5. **Create Shared API Client** (30 min)
   - Create `src/shared/api/client.js` (base fetch wrapper)
   - Create `src/shared/api/endpoints.js` (API constants)
   - Centralize error handling

**Commit**: `refactor: establish shared layer (ui, components, hooks, utils, api)`

---

#### **Phase 2: App Layer** ⏱️ 1-2 hours

**Goal**: Set up app-level providers, routing, and layout

1. **Move Providers** (30 min)
   ```
   src/components/DataContext.jsx → src/app/providers/DataProvider.jsx
   src/contexts/ThemeContext.jsx → src/app/providers/ThemeProvider.jsx
   ```
   - Create `src/app/providers/index.js` to export all providers

2. **Set Up Router** (30 min)
   - Move routing logic from `src/pages/index.jsx` to `src/app/router/`
   - Create `src/app/router/routes.jsx` for route definitions
   - Create `src/app/router/guards/AuthGuard.jsx` for auth protection

3. **Create Layout** (30 min)
   ```
   src/pages/Layout.jsx → src/app/layout/MainLayout.jsx
   ```
   - Extract header, sidebar, footer into separate components

4. **Update `main.jsx`** (15 min)
   - Import from new `app/` structure
   - Simplify app entry point

**Commit**: `refactor: establish app layer (providers, routing, layout)`

---

#### **Phase 3: Migrate Features (One at a Time)** ⏱️ 6-12 hours

**Goal**: Migrate each feature to new structure

**Order of Migration** (easiest → hardest):

1. **Auth** (30 min) - Simple, self-contained
2. **Users** (30 min) - Simple CRUD
3. **Teams** (30 min) - Simple CRUD
4. **Analytics** (1 hour) - Moderate complexity
5. **Dashboard** (1-2 hours) - Moderate complexity, already has components
6. **Players** (2-3 hours) - Complex, has sub-features
7. **Games** (2-3 hours) - Complex, mostly modular already
8. **Training** (2-3 hours) - Complex, has 3 sub-features
9. **Tactics** (1 hour) - Standalone feature
10. **Reports** (1 hour) - Cross-cutting concern

**Example: Migrating "Auth" Feature**

```bash
# 1. Create feature folder
mkdir -p src/features/auth/{components,hooks,api}

# 2. Move files
mv src/pages/Login.jsx src/features/auth/Login.page.jsx
mv src/pages/AccessDenied.jsx src/features/auth/AccessDenied.page.jsx
mv src/components/LoginModal.jsx src/features/auth/components/
mv src/services/authService.js src/features/auth/api/authApi.js
mv src/services/jwtAuthService.js src/features/auth/api/jwtAuthApi.js

# 3. Create barrel export
cat > src/features/auth/index.js << EOF
export { default as LoginPage } from './Login.page';
export { default as AccessDeniedPage } from './AccessDenied.page';
export { LoginModal } from './components/LoginModal';
EOF

# 4. Update imports in router
# (Update src/app/router/routes.jsx to import from features/auth)

# 5. Test
npm run dev
# Verify login flow works

# 6. Commit
git add src/features/auth
git commit -m "refactor(auth): migrate auth feature to new structure"
```

**Repeat for each feature**, committing after each one.

---

#### **Phase 4: Optimize & Enhance** ⏱️ 2-4 hours

**Goal**: Add performance optimizations and tooling

1. **Implement Lazy Loading** (1 hour)
   ```jsx
   // src/app/router/routes.jsx
   import { lazy } from 'react';
   
   const Dashboard = lazy(() => import('@/features/dashboard/Dashboard.page'));
   const Players = lazy(() => import('@/features/players/Players.page'));
   // ... etc
   ```

2. **Add React Query / SWR** (1 hour) - OPTIONAL
   - Replace `DataContext` with on-demand data fetching
   - Add caching, background refetching

3. **Set Up Code Splitting** (30 min)
   - Configure Vite for optimal chunking
   - Analyze bundle size

4. **Add Performance Monitoring** (30 min) - OPTIONAL
   - Add `React.memo` where appropriate
   - Use React DevTools Profiler

**Commit**: `feat: add lazy loading and performance optimizations`

---

#### **Phase 5: Testing & Documentation** ⏱️ 2-3 hours

**Goal**: Ensure stability and document new structure

1. **Manual Testing** (1 hour)
   - Test all major flows (login, add player, create game, etc.)
   - Check for broken imports or missing components

2. **Update Documentation** (1 hour)
   - Update README with new structure
   - Create `ARCHITECTURE.md` guide
   - Document feature creation process

3. **Set Up Basic Tests** (1 hour) - OPTIONAL
   - Install Vitest or Jest
   - Add smoke tests for critical paths

**Commit**: `docs: update documentation for new architecture`

---

### 📊 Migration Checklist

Track your progress with this checklist:

- [ ] **Phase 0: Cleanup**
  - [ ] Delete legacy backup files
  - [ ] Delete duplicate DrillLab components
  - [ ] Delete demo/showcase components
  - [ ] Set up ESLint + Prettier
  - [ ] Create new folder structure

- [ ] **Phase 1: Shared Layer**
  - [ ] Move UI components to `shared/ui/primitives`
  - [ ] Move composed UI to `shared/ui/composed`
  - [ ] Move shared components to `shared/components`
  - [ ] Move shared hooks to `shared/hooks`
  - [ ] Move shared utils to `shared/utils`
  - [ ] Create shared API client

- [ ] **Phase 2: App Layer**
  - [ ] Move providers to `app/providers`
  - [ ] Set up router in `app/router`
  - [ ] Create layout in `app/layout`
  - [ ] Update `main.jsx`

- [ ] **Phase 3: Features**
  - [ ] Migrate `auth` feature
  - [ ] Migrate `users` feature
  - [ ] Migrate `teams` feature
  - [ ] Migrate `analytics` feature
  - [ ] Migrate `dashboard` feature
  - [ ] Migrate `players` feature
  - [ ] Migrate `games` feature
  - [ ] Migrate `training` feature
  - [ ] Migrate `tactics` feature
  - [ ] Migrate `reports` feature

- [ ] **Phase 4: Optimize**
  - [ ] Implement lazy loading
  - [ ] Set up code splitting
  - [ ] (Optional) Add React Query/SWR
  - [ ] (Optional) Add performance monitoring

- [ ] **Phase 5: Testing & Docs**
  - [ ] Manual testing of all features
  - [ ] Update README
  - [ ] Create ARCHITECTURE.md
  - [ ] (Optional) Add basic tests

---

## 6. Code Standards & Tooling

### 🎨 ESLint + Prettier Configuration

**Recommended Setup**: Airbnb JavaScript Style Guide

#### **Install Dependencies**

```bash
npm install --save-dev \
  eslint-config-airbnb \
  eslint-plugin-import \
  eslint-plugin-jsx-a11y \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier
```

#### **`.eslintrc.json`**

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "airbnb",
    "airbnb/hooks",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react", "jsx-a11y", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "warn",
    "import/prefer-default-export": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react/jsx-filename-extension": [1, { "extensions": [".jsx", ".tsx"] }],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never"
      }
    ]
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "alias": {
        "map": [["@", "./src"]],
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  }
}
```

#### **`.prettierrc`**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### **Update `package.json` Scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\""
  }
}
```

#### **VS Code Settings** (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

---

### 📝 Coding Conventions

1. **Component Structure**:
   ```jsx
   // Imports
   import React, { useState, useEffect } from 'react';
   import { Button } from '@/shared/ui';
   import { useGameData } from '../hooks/useGameData';
   
   // Component
   export default function GameCard({ gameId, onSelect }) {
     // 1. Hooks
     const { game, loading } = useGameData(gameId);
     const [isExpanded, setIsExpanded] = useState(false);
     
     // 2. Effects
     useEffect(() => {
       // ...
     }, []);
     
     // 3. Event handlers
     const handleClick = () => {
       setIsExpanded(!isExpanded);
       onSelect(gameId);
     };
     
     // 4. Early returns
     if (loading) return <LoadingState />;
     if (!game) return null;
     
     // 5. Render
     return (
       <div>
         {/* ... */}
       </div>
     );
   }
   ```

2. **Import Order**:
   ```jsx
   // 1. External dependencies
   import React, { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   
   // 2. Shared/UI components
   import { Button, Dialog } from '@/shared/ui';
   
   // 3. Feature-specific imports
   import { useGameData } from '../hooks/useGameData';
   import { GameCard } from '../components/GameCard';
   
   // 4. Utils
   import { formatDate } from '@/shared/utils/date';
   
   // 5. Styles (if any)
   import './styles.css';
   ```

3. **Prop Destructuring**:
   ```jsx
   // ✅ Good
   export default function PlayerCard({ player, onSelect, isSelected }) {
     // ...
   }
   
   // ❌ Avoid
   export default function PlayerCard(props) {
     const { player, onSelect, isSelected } = props;
     // ...
   }
   ```

4. **Boolean Props**:
   ```jsx
   // ✅ Good
   <Button disabled loading primary />
   
   // ❌ Avoid
   <Button disabled={true} loading={true} primary={true} />
   ```

5. **Conditional Rendering**:
   ```jsx
   // ✅ Good - Early return
   if (!data) return <EmptyState />;
   
   // ✅ Good - Ternary for simple cases
   {isLoading ? <Spinner /> : <Content />}
   
   // ✅ Good - Logical AND for single condition
   {hasError && <ErrorMessage />}
   
   // ❌ Avoid - Nested ternaries
   {isLoading ? <Spinner /> : hasError ? <Error /> : <Content />}
   ```

---

## 7. Performance & Scalability Considerations

### ⚡ Performance Optimizations

#### **1. Code Splitting & Lazy Loading**

```jsx
// src/app/router/routes.jsx
import { lazy, Suspense } from 'react';
import { LoadingState } from '@/shared/ui';

// Lazy load feature pages
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard.page'));
const Players = lazy(() => import('@/features/players/Players.page'));
const GameDetails = lazy(() => import('@/features/games/game-details/GameDetails.page'));

export const routes = [
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<LoadingState />}>
        <Dashboard />
      </Suspense>
    ),
  },
  // ... etc
];
```

**Impact**: Reduces initial bundle size, faster first load.

---

#### **2. Data Fetching Strategy**

**Current Problem**: `DataContext` loads ALL data on mount.

**Solution**: Feature-specific data hooks with caching.

```jsx
// src/features/players/hooks/usePlayersData.js
import { useState, useEffect } from 'react';
import { playersApi } from '../api/playersApi';

export function usePlayersData() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const data = await playersApi.getAll();
        setPlayers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return { players, loading, error };
}
```

**Better: Use React Query** (recommended for MVP+)

```jsx
// src/features/players/hooks/usePlayersData.js
import { useQuery } from '@tanstack/react-query';
import { playersApi } from '../api/playersApi';

export function usePlayersData() {
  return useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Benefits**:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Deduplication of requests
- ✅ Pagination/infinite scroll support

---

#### **3. Virtualization for Large Lists**

```jsx
// src/features/players/Players.page.jsx
import { FixedSizeList as List } from 'react-window';

function PlayersList({ players }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PlayerCard player={players[index]} />
    </div>
  );

  return (
    <List
      height={800}
      itemCount={players.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

**When to Use**: Lists with 100+ items (player lists, game history, etc.)

---

#### **4. Memoization**

```jsx
import React, { useMemo, memo } from 'react';

// Memoize expensive calculations
function PlayerStats({ player }) {
  const stats = useMemo(() => {
    return calculateAdvancedStats(player.performances);
  }, [player.performances]);

  return <div>{/* ... */}</div>;
}

// Memoize components that rarely change
export default memo(PlayerStats, (prevProps, nextProps) => {
  return prevProps.player._id === nextProps.player._id;
});
```

---

### 📈 Scalability for Large Datasets

#### **1. Backend Pagination**

```js
// backend/src/routes/players.js
router.get('/', authenticateJWT, async (req, res) => {
  const { page = 1, limit = 20, team, position } = req.query;

  const query = {};
  if (team) query.team = team;
  if (position) query.position = position;

  const players = await Player.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('team', 'teamName')
    .lean();

  const count = await Player.countDocuments(query);

  res.json({
    players,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count,
  });
});
```

---

#### **2. Search & Filtering**

```js
// backend/src/routes/players.js - Add search
router.get('/search', authenticateJWT, async (req, res) => {
  const { q, team, position } = req.query;

  const query = {
    $or: [
      { fullName: { $regex: q, $options: 'i' } },
      { kitNumber: parseInt(q) || -1 },
    ],
  };

  if (team) query.team = team;
  if (position) query.position = position;

  const players = await Player.find(query)
    .limit(50)
    .populate('team', 'teamName')
    .lean();

  res.json(players);
});
```

---

#### **3. Database Indexing**

```js
// backend/src/models/Player.js
const playerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, index: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
  position: { type: String, enum: positions, index: true },
  kitNumber: { type: Number, index: true },
  // ...
});

// Compound index for common queries
playerSchema.index({ team: 1, position: 1 });
playerSchema.index({ fullName: 'text' }); // Text search
```

---

### 🔮 Multi-Tenancy Preparation

For future multi-tenancy support, add `organizationId` to all models:

```js
// backend/src/models/Player.js
const playerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  // ... other fields
});

// Middleware to filter by organization
playerSchema.pre(/^find/, function(next) {
  if (this.options.skipOrganizationFilter) return next();
  
  const user = this.options.user; // Pass user from middleware
  if (user && user.organizationId) {
    this.where({ organizationId: user.organizationId });
  }
  next();
});
```

---

## 🎯 Summary & Next Steps

### ✅ Key Takeaways

1. **Architecture**: Feature-Sliced Design balances simplicity and scalability
2. **Migration**: Incremental, feature-by-feature approach minimizes risk
3. **Standards**: ESLint + Prettier with Airbnb config ensures consistency
4. **Performance**: Lazy loading, data caching, virtualization for scale
5. **Cleanup**: Remove 4,500+ lines of dead code immediately

---

### 🚀 Immediate Action Items

1. **Start with Phase 0** (Cleanup):
   - Delete legacy files (safe, low-risk)
   - Set up ESLint + Prettier
   - Create new folder structure

2. **Migrate Shared Layer** (Phase 1):
   - Foundation for all other migrations
   - Update imports across app

3. **Migrate Features Incrementally** (Phase 3):
   - Start with simple features (Auth, Users, Teams)
   - Build confidence before tackling complex features

4. **Document as You Go**:
   - Update README with new structure
   - Create feature creation guide
   - Track migration progress

---

### 📚 Recommended Resources

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Window (Virtualization)](https://react-window.vercel.app/)

---

### 🤝 Need Help?

As you migrate, you may encounter:
- Import errors → Update paths to new structure
- Circular dependencies → Refactor to break cycles
- Performance issues → Add lazy loading or memoization

Feel free to ask questions during the migration process!

---

**Good luck with your refactoring! 🎉**

*Remember: This is a marathon, not a sprint. Take it one feature at a time, commit often, and test thoroughly.*


# Project Structure

> Generated on: 3.12.2025, 16:46:07

This document provides a complete overview of the project structure, showing all directories and files while excluding build artifacts and dependencies.

## Directory Tree

```
└── squad-up-with backend
    ├── backend
    │   ├── scripts
    │   │   ├── addTestGameRoster.js
    │   │   ├── checkAndFixGameStatus.js
    │   │   ├── checkGamePlayedStatus.js
    │   │   ├── generateMockData.js
    │   │   ├── initializeOrgConfig.js
    │   │   ├── migrate-remove-denormalized-fields.js
    │   │   ├── migrateDisciplinaryData.js
    │   │   ├── resetAdminPassword.js
    │   │   └── testPlayedStatus.js
    │   ├── src
    │   │   ├── __tests__
    │   │   │   └── setup.js
    │   │   ├── components
    │   │   │   └── player
    │   │   ├── config
    │   │   │   └── database.js
    │   │   ├── middleware
    │   │   │   └── jwtAuth.js
    │   │   ├── models
    │   │   │   ├── Card.js
    │   │   │   ├── Drill.js
    │   │   │   ├── Formation.js
    │   │   │   ├── Game.js
    │   │   │   ├── GameReport.js
    │   │   │   ├── GameRoster.js
    │   │   │   ├── Goal.js
    │   │   │   ├── Job.js
    │   │   │   ├── OrganizationConfig.js
    │   │   │   ├── Player.js
    │   │   │   ├── PlayerMatchStat.js
    │   │   │   ├── ScoutReport.js
    │   │   │   ├── SessionDrill.js
    │   │   │   ├── Substitution.js
    │   │   │   ├── Team.js
    │   │   │   ├── TimelineEvent.js
    │   │   │   ├── TrainingSession.js
    │   │   │   └── User.js
    │   │   ├── routes
    │   │   │   ├── __tests__
    │   │   │   │   ├── cards.test.js
    │   │   │   │   ├── games.draft.test.js
    │   │   │   │   ├── playerMatchStats.test.js
    │   │   │   │   └── README.md
    │   │   │   ├── analytics.js
    │   │   │   ├── auth.js
    │   │   │   ├── cards.js
    │   │   │   ├── data.js
    │   │   │   ├── difficultyAssessment.js
    │   │   │   ├── drills.js
    │   │   │   ├── formations.js
    │   │   │   ├── gameReports.js
    │   │   │   ├── gameRosters.js
    │   │   │   ├── games.js
    │   │   │   ├── goals.js
    │   │   │   ├── minutesValidation.js
    │   │   │   ├── organizationConfigs.js
    │   │   │   ├── playerMatchStats.js
    │   │   │   ├── players.js
    │   │   │   ├── scoutReports.js
    │   │   │   ├── sessionDrills.js
    │   │   │   ├── substitutions.js
    │   │   │   ├── teams.js
    │   │   │   ├── timelineEvents.js
    │   │   │   ├── trainingSessions.js
    │   │   │   └── users.js
    │   │   ├── services
    │   │   │   ├── __tests__
    │   │   │   │   ├── gameRules.test.js
    │   │   │   │   ├── minutesCalculation.test.js
    │   │   │   │   └── timelineService.test.js
    │   │   │   ├── gameRules.js
    │   │   │   ├── goalAnalytics.js
    │   │   │   ├── goalsAssistsCalculation.js
    │   │   │   ├── minutesCalculation.js
    │   │   │   ├── minutesValidation.js
    │   │   │   ├── substitutionAnalytics.js
    │   │   │   └── timelineService.js
    │   │   ├── utils
    │   │   │   ├── ageGroupUtils.js
    │   │   │   └── cardValidation.js
    │   │   ├── app.js
    │   │   └── worker.js
    │   ├── .env
    │   ├── env.example
    │   ├── fix-index.js
    │   ├── jest.config.js
    │   ├── MOCK_DATA_SUMMARY.md
    │   ├── package-lock.json
    │   ├── package.json
    │   └── README.md
    ├── docs
    │   ├── planned_features
    │   │   ├── auto_sub_feature_plan.md
    │   │   ├── optimistic_ui_plan.md
    │   │   ├── organization_config_implementation_plan.md
    │   │   └── refactor_disciplinary_architecture_plan.md
    │   ├── restructure
    │   │   ├── ARCHITECTURE_REFACTORING_PLAN.md
    │   │   ├── PHASE_3_TEST_INSTRUCTIONS.md
    │   │   ├── README.md
    │   │   └── RESTRUCTURE_SUCCESS.md
    │   ├── API_DOCUMENTATION.md
    │   ├── AUTOMATED_CALCULATIONS_SUMMARY.md
    │   ├── AUTOMATED_MINUTES_CALCULATION_ARCHITECTURE_REVIEW.md
    │   ├── BACKEND_TEST_SETUP.md
    │   ├── CODE_CLEANUP_REPORT.md
    │   ├── DATABASE_ARCHITECTURE.md
    │   ├── ENHANCED_MATCH_EVENT_TRACKING_SPEC.md
    │   ├── EXPLANATION_MISSING_FEATURES.md
    │   ├── FUTURE_ENHANCEMENTS_SUMMARY.md
    │   ├── GAP_ANALYSIS_ENHANCED_MATCH_EVENT_TRACKING.md
    │   ├── GOALS_ASSISTS_SYSTEM_DOCUMENTATION.md
    │   ├── IMPLEMENTATION_SUMMARY_ORG_CONFIG.md
    │   ├── ISSUES_TO_SOLVE_LATER.md
    │   ├── MATCH_EVENTS_COMPREHENSIVE_GUIDE.md
    │   ├── MIGRATION_DISCIPLINARY_ARCHITECTURE.md
    │   ├── MINUTES_SYSTEM_DOCUMENTATION.md
    │   ├── MINUTES_UI_COMPONENT_SPEC.md
    │   ├── MONGODB_QUERIES.md
    │   ├── NOT_IMPLEMENTED_FEATURES_DESCRIPTIONS.md
    │   ├── PERFORMANCE_OPTIMIZATION_PLAYER_STATS_PREFETCH.md
    │   ├── README.md
    │   ├── TESTING_DOCUMENTATION.md
    │   ├── TESTING_PLAYED_IN_GAME.md
    │   └── WORKER_JOB_QUEUE_DOCUMENTATION.md
    ├── scripts
    │   └── generate-structure.js
    ├── src
    │   ├── api
    │   │   ├── dataService.js
    │   │   ├── entities.js
    │   │   ├── functions.js
    │   │   ├── integrations.js
    │   │   └── testConnection.js
    │   ├── app
    │   │   ├── layout
    │   │   │   ├── components
    │   │   │   ├── index.js
    │   │   │   └── MainLayout.jsx
    │   │   ├── providers
    │   │   │   ├── DataProvider.jsx
    │   │   │   ├── index.js
    │   │   │   └── ThemeProvider.jsx
    │   │   └── router
    │   │       ├── guards
    │   │       ├── index.jsx
    │   │       └── routes.jsx
    │   ├── components
    │   │   ├── ui
    │   │   │   └── StatSliderControl.jsx
    │   │   ├── FeatureGuard.jsx
    │   │   └── PageLoader.jsx
    │   ├── features
    │   │   ├── analytics
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── AnalyticsPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── DashboardPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   └── shared
    │   │   │   │       ├── DashboardHeader.jsx
    │   │   │   │       ├── DashboardStats.jsx
    │   │   │   │       ├── GameZone.jsx
    │   │   │   │       ├── index.js
    │   │   │   │       └── RecentActivity.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   ├── drill-system
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── DrillDesignerPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── DrillLibraryPage
    │   │   │   │   │   ├── components
    │   │   │   │   │   │   ├── dialogs
    │   │   │   │   │   │   │   ├── AddDrillDialog.jsx
    │   │   │   │   │   │   │   └── DrillDetailDialog.jsx
    │   │   │   │   │   │   ├── DrillGrid.jsx
    │   │   │   │   │   │   └── DrillLibraryHeader.jsx
    │   │   │   │   │   ├── index.jsx
    │   │   │   │   │   └── README.md
    │   │   │   │   ├── shared
    │   │   │   │   │   ├── DrillDesignerCanvas.jsx
    │   │   │   │   │   ├── DrillDesignerHeader.jsx
    │   │   │   │   │   ├── DrillDesignerToolbar.jsx
    │   │   │   │   │   └── index.js
    │   │   │   │   ├── DrillCanvas.jsx
    │   │   │   │   ├── DrillDescriptionModal.jsx
    │   │   │   │   ├── DrillDetailModal.jsx
    │   │   │   │   └── DrillMenuDropdown.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   ├── game-management
    │   │   │   ├── api
    │   │   │   │   ├── cardsApi.js
    │   │   │   │   ├── difficultyAssessmentApi.js
    │   │   │   │   ├── gameApi.js
    │   │   │   │   ├── goalsApi.js
    │   │   │   │   ├── playerMatchStatsApi.js
    │   │   │   │   ├── playerStatsApi.js
    │   │   │   │   ├── substitutionsApi.js
    │   │   │   │   └── timelineApi.js
    │   │   │   ├── components
    │   │   │   │   ├── AddGamePage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── GameDetailsPage
    │   │   │   │   │   ├── __tests__
    │   │   │   │   │   │   ├── draftE2E.test.jsx
    │   │   │   │   │   │   ├── draftMerge.test.jsx
    │   │   │   │   │   │   └── validation.integration.test.jsx
    │   │   │   │   │   ├── components
    │   │   │   │   │   │   ├── dialogs
    │   │   │   │   │   │   │   ├── CardDialog.jsx
    │   │   │   │   │   │   │   ├── FinalReportDialog.jsx
    │   │   │   │   │   │   │   ├── GoalDialog.jsx
    │   │   │   │   │   │   │   ├── PlayerPerformanceDialog.jsx
    │   │   │   │   │   │   │   ├── PlayerSelectionDialog.jsx
    │   │   │   │   │   │   │   ├── SubstitutionDialog.jsx
    │   │   │   │   │   │   │   └── TeamSummaryDialog.jsx
    │   │   │   │   │   │   ├── features
    │   │   │   │   │   │   │   ├── DetailedDisciplinarySection.jsx
    │   │   │   │   │   │   │   ├── DetailedStatsSection.jsx
    │   │   │   │   │   │   │   ├── GoalInvolvementSection.jsx
    │   │   │   │   │   │   │   └── index.js
    │   │   │   │   │   │   ├── AutoFillReportsButton.jsx
    │   │   │   │   │   │   ├── DifficultyAssessmentCard.jsx
    │   │   │   │   │   │   ├── GameDayRosterSidebar.jsx
    │   │   │   │   │   │   ├── GameDetailsHeader.jsx
    │   │   │   │   │   │   ├── MatchAnalysisSidebar.jsx
    │   │   │   │   │   │   ├── PlayerCard.jsx
    │   │   │   │   │   │   └── TacticalBoard.jsx
    │   │   │   │   │   ├── formations.js
    │   │   │   │   │   ├── index.jsx
    │   │   │   │   │   └── README.md
    │   │   │   │   └── GamesSchedulePage
    │   │   │   │       └── index.jsx
    │   │   │   ├── utils
    │   │   │   │   ├── __tests__
    │   │   │   │   │   ├── minutesValidation.test.js
    │   │   │   │   │   └── squadValidation.test.js
    │   │   │   │   ├── cardValidation.js
    │   │   │   │   ├── gameState.js
    │   │   │   │   ├── index.js
    │   │   │   │   ├── minutesValidation.js
    │   │   │   │   └── squadValidation.js
    │   │   │   └── index.js
    │   │   ├── player-management
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── AddPlayerPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── PlayerDetailPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── PlayersPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── shared
    │   │   │   │   │   ├── DevelopmentTimeline.jsx
    │   │   │   │   │   ├── index.js
    │   │   │   │   │   ├── PerformanceStatsCard.jsx
    │   │   │   │   │   ├── PlayerProfileCard.jsx
    │   │   │   │   │   ├── ProfileImage.jsx
    │   │   │   │   │   └── TimelineItem.jsx
    │   │   │   │   └── shared-players
    │   │   │   │       ├── PlayerFilters.jsx
    │   │   │   │       ├── PlayerGrid.jsx
    │   │   │   │       └── PlayersHeader.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   ├── reporting
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── AddReportPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   ├── MatchReportModal.jsx
    │   │   │   │   └── PlayerPerformanceModal.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   ├── team-management
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── AddTeamPage
    │   │   │   │   │   └── index.jsx
    │   │   │   │   └── TacticBoardPage
    │   │   │   │       └── index.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   ├── training-management
    │   │   │   ├── api
    │   │   │   ├── components
    │   │   │   │   ├── TrainingPlannerPage
    │   │   │   │   │   ├── components
    │   │   │   │   │   │   ├── TrainingPlannerContent.jsx
    │   │   │   │   │   │   └── TrainingPlannerHeader.jsx
    │   │   │   │   │   ├── index.jsx
    │   │   │   │   │   └── README.md
    │   │   │   │   ├── DrillLibrarySidebar.jsx
    │   │   │   │   └── WeeklyCalendar.jsx
    │   │   │   ├── hooks
    │   │   │   ├── utils
    │   │   │   └── index.js
    │   │   └── user-management
    │   │       ├── api
    │   │       ├── components
    │   │       │   ├── AccessDeniedPage
    │   │       │   │   └── index.jsx
    │   │       │   ├── AddUserPage
    │   │       │   │   └── index.jsx
    │   │       │   ├── LoginPage
    │   │       │   │   └── index.jsx
    │   │       │   └── LoginModal.jsx
    │   │       ├── hooks
    │   │       ├── utils
    │   │       └── index.js
    │   ├── hooks
    │   │   ├── __tests__
    │   │   │   └── useAutosave.test.js
    │   │   ├── index.js
    │   │   ├── useAutosave.js
    │   │   └── useFeature.js
    │   ├── lib
    │   │   ├── advanced-animations.ts
    │   │   ├── advanced-theming.ts
    │   │   ├── dark-mode.ts
    │   │   ├── progressive-loading.tsx
    │   │   └── responsive.ts
    │   ├── pages
    │   │   ├── Settings
    │   │   │   ├── components
    │   │   │   │   ├── DatabaseSyncSection.jsx
    │   │   │   │   └── OrganizationSettingsSection.jsx
    │   │   │   └── index.jsx
    │   │   ├── index.jsx
    │   │   └── SyncStatus.jsx
    │   ├── services
    │   │   └── jwtAuthService.js
    │   ├── shared
    │   │   ├── api
    │   │   │   ├── client.js
    │   │   │   ├── endpoints.js
    │   │   │   └── index.js
    │   │   ├── components
    │   │   │   ├── __tests__
    │   │   │   │   └── ConfirmationModal.test.jsx
    │   │   │   ├── ConfirmationModal.jsx
    │   │   │   ├── ConfirmationToast.jsx
    │   │   │   ├── CustomNumberInput.jsx
    │   │   │   ├── CustomTooltip.jsx
    │   │   │   ├── FormationEditor.jsx
    │   │   │   ├── FormationEditorModal.jsx
    │   │   │   ├── formations.jsx
    │   │   │   ├── FormFields.jsx
    │   │   │   ├── GenericAddPage.jsx
    │   │   │   ├── index.js
    │   │   │   ├── PlayerNumberMenu.jsx
    │   │   │   ├── PlayerSelectionModal.jsx
    │   │   │   └── ThemeEditor.jsx
    │   │   ├── config
    │   │   │   └── index.js
    │   │   ├── hooks
    │   │   │   ├── index.js
    │   │   │   ├── use-mobile.jsx
    │   │   │   ├── useDashboardData.js
    │   │   │   ├── useDrillLabData.js
    │   │   │   ├── useDrillLabHistory.js
    │   │   │   ├── useDrillLabMode.js
    │   │   │   ├── usePlayersData.js
    │   │   │   ├── useRecentEvents.js
    │   │   │   └── useUserRole.js
    │   │   ├── lib
    │   │   │   ├── accessibility.ts
    │   │   │   ├── index.js
    │   │   │   ├── theme.ts
    │   │   │   └── utils.js
    │   │   ├── ui
    │   │   │   ├── composed
    │   │   │   │   └── index.js
    │   │   │   ├── primitives
    │   │   │   │   ├── accordion.jsx
    │   │   │   │   ├── advanced-animated-components.jsx
    │   │   │   │   ├── alert-dialog.jsx
    │   │   │   │   ├── alert.jsx
    │   │   │   │   ├── animated-components.jsx
    │   │   │   │   ├── aspect-ratio.jsx
    │   │   │   │   ├── avatar.jsx
    │   │   │   │   ├── badge.jsx
    │   │   │   │   ├── breadcrumb.jsx
    │   │   │   │   ├── button.jsx
    │   │   │   │   ├── calendar.jsx
    │   │   │   │   ├── card.jsx
    │   │   │   │   ├── carousel.jsx
    │   │   │   │   ├── chart.jsx
    │   │   │   │   ├── checkbox.jsx
    │   │   │   │   ├── collapsible.jsx
    │   │   │   │   ├── combobox.jsx
    │   │   │   │   ├── command.jsx
    │   │   │   │   ├── context-menu.jsx
    │   │   │   │   ├── DataCard.jsx
    │   │   │   │   ├── design-system-components.jsx
    │   │   │   │   ├── dialog.jsx
    │   │   │   │   ├── drawer.jsx
    │   │   │   │   ├── dropdown-menu.jsx
    │   │   │   │   ├── EmptyState.jsx
    │   │   │   │   ├── form.jsx
    │   │   │   │   ├── hover-card.jsx
    │   │   │   │   ├── index.js
    │   │   │   │   ├── input-otp.jsx
    │   │   │   │   ├── input.jsx
    │   │   │   │   ├── label.jsx
    │   │   │   │   ├── LoadingState.jsx
    │   │   │   │   ├── menubar.jsx
    │   │   │   │   ├── navigation-menu.jsx
    │   │   │   │   ├── PageHeader.jsx
    │   │   │   │   ├── PageLayout.jsx
    │   │   │   │   ├── pagination.jsx
    │   │   │   │   ├── popover.jsx
    │   │   │   │   ├── progress.jsx
    │   │   │   │   ├── radio-group.jsx
    │   │   │   │   ├── resizable.jsx
    │   │   │   │   ├── scroll-area.jsx
    │   │   │   │   ├── SearchFilter.jsx
    │   │   │   │   ├── select.jsx
    │   │   │   │   ├── separator.jsx
    │   │   │   │   ├── sheet.jsx
    │   │   │   │   ├── sidebar.jsx
    │   │   │   │   ├── skeleton.jsx
    │   │   │   │   ├── slider.jsx
    │   │   │   │   ├── sonner.jsx
    │   │   │   │   ├── StandardButton.jsx
    │   │   │   │   ├── switch.jsx
    │   │   │   │   ├── table.jsx
    │   │   │   │   ├── tabs.jsx
    │   │   │   │   ├── textarea.jsx
    │   │   │   │   ├── theme-components.jsx
    │   │   │   │   ├── toast.jsx
    │   │   │   │   ├── toaster.jsx
    │   │   │   │   ├── toggle-group.jsx
    │   │   │   │   ├── toggle.jsx
    │   │   │   │   ├── tooltip.jsx
    │   │   │   │   ├── unified-components.jsx
    │   │   │   │   ├── use-toast.jsx
    │   │   │   │   └── virtual-scrolling.jsx
    │   │   │   └── index.js
    │   │   └── utils
    │   │       ├── date
    │   │       │   ├── dateUtils.js
    │   │       │   ├── index.js
    │   │       │   └── seasonUtils.js
    │   │       └── index.js
    │   ├── styles
    │   │   ├── dark-mode.css
    │   │   ├── design-system.css
    │   │   └── responsive-design.css
    │   ├── utils
    │   │   ├── __tests__
    │   │   │   └── seasonUtils.test.js
    │   │   ├── categoryColors.js
    │   │   ├── dashboardConstants.js
    │   │   ├── drillLabUtils.js
    │   │   ├── gameUtils.js
    │   │   ├── index.ts
    │   │   ├── positionUtils.js
    │   │   └── testTeamData.js
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── setupTests.js
    ├── .gitignore
    ├── .prettierignore
    ├── .prettierrc
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── jest.config.cjs
    ├── jsconfig.json
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── TEST_IMPLEMENTATION_GUIDE.md
    └── vite.config.js
```

## Notes

- **Excluded directories**: `node_modules`, `.git`, `.vscode`, `dist`, `build`, `coverage`
- This structure shows the complete `src` folder hierarchy
- Root-level configuration files are included for reference

## Key Directories

- **src/**: Main source code directory
- **docs/**: Documentation files
- **scripts/**: Utility scripts (including this generator)

---

*This file was automatically generated by `scripts/generate-structure.js`*

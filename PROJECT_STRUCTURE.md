# Project Structure

> Generated on: 11.12.2025, 15:23:04

This document provides a complete overview of the project structure, showing all directories and files while excluding build artifacts and dependencies.

## Directory Tree

```
└── squad-up-with backend
    ├── .cursor
    │   └── rules
    ├── backend
    │   ├── scripts
    │   │   ├── addTestGameRoster.js (74 lines)
    │   │   ├── checkAndFixGameStatus.js (123 lines)
    │   │   ├── checkGamePlayedStatus.js (143 lines)
    │   │   ├── generateMockData.js (683 lines)
    │   │   ├── initializeOrgConfig.js (80 lines)
    │   │   ├── migrate-remove-denormalized-fields.js (101 lines)
    │   │   ├── migrateDisciplinaryData.js (269 lines)
    │   │   ├── resetAdminPassword.js (86 lines)
    │   │   └── testPlayedStatus.js (177 lines)
    │   ├── src
    │   │   ├── __tests__
    │   │   │   └── setup.js (22 lines)
    │   │   ├── components
    │   │   │   └── player
    │   │   ├── config
    │   │   │   └── database.js (21 lines)
    │   │   ├── controllers
    │   │   │   ├── games
    │   │   │   │   ├── cardController.js (147 lines)
    │   │   │   │   ├── difficultyAssessmentController.js (115 lines)
    │   │   │   │   ├── gameController.js (262 lines)
    │   │   │   │   ├── gameReportController.js (170 lines)
    │   │   │   │   ├── gameRosterController.js (126 lines)
    │   │   │   │   ├── goalController.js (130 lines)
    │   │   │   │   ├── minutesValidationController.js (31 lines)
    │   │   │   │   ├── playerMatchStatsController.js (85 lines)
    │   │   │   │   └── substitutionController.js (130 lines)
    │   │   │   ├── training
    │   │   │   │   ├── drillController.js (62 lines)
    │   │   │   │   ├── sessionDrillController.js (72 lines)
    │   │   │   │   └── trainingSessionController.js (65 lines)
    │   │   │   ├── analyticsController.js (59 lines)
    │   │   │   ├── authController.js (74 lines)
    │   │   │   ├── dataController.js (27 lines)
    │   │   │   ├── formationController.js (62 lines)
    │   │   │   ├── index.js (12 lines)
    │   │   │   ├── organizationConfigController.js (65 lines)
    │   │   │   ├── playerController.js (65 lines)
    │   │   │   ├── scoutReportController.js (62 lines)
    │   │   │   ├── teamController.js (65 lines)
    │   │   │   ├── timelineEventController.js (108 lines)
    │   │   │   └── userController.js (65 lines)
    │   │   ├── middleware
    │   │   │   └── jwtAuth.js (249 lines)
    │   │   ├── models
    │   │   │   ├── Card.js (43 lines)
    │   │   │   ├── Drill.js (91 lines)
    │   │   │   ├── Formation.js (65 lines)
    │   │   │   ├── Game.js (239 lines)
    │   │   │   ├── GameReport.js (128 lines)
    │   │   │   ├── GameRoster.js (56 lines)
    │   │   │   ├── Goal.js (128 lines)
    │   │   │   ├── Job.js (153 lines)
    │   │   │   ├── OrganizationConfig.js (87 lines)
    │   │   │   ├── Player.js (92 lines)
    │   │   │   ├── PlayerMatchStat.js (47 lines)
    │   │   │   ├── ScoutReport.js (77 lines)
    │   │   │   ├── SessionDrill.js (81 lines)
    │   │   │   ├── Substitution.js (68 lines)
    │   │   │   ├── Team.js (57 lines)
    │   │   │   ├── TimelineEvent.js (98 lines)
    │   │   │   ├── TrainingSession.js (91 lines)
    │   │   │   └── User.js (100 lines)
    │   │   ├── routes
    │   │   │   ├── __tests__
    │   │   │   │   ├── cards.test.js (379 lines)
    │   │   │   │   ├── games.draft.test.js (528 lines)
    │   │   │   │   ├── playerMatchStats.test.js (365 lines)
    │   │   │   │   └── README.md (74 lines)
    │   │   │   ├── games
    │   │   │   │   ├── cards.js (40 lines)
    │   │   │   │   ├── crud.js (44 lines)
    │   │   │   │   ├── difficultyAssessment.js (28 lines)
    │   │   │   │   ├── drafts.js (26 lines)
    │   │   │   │   ├── gameReports.js (79 lines)
    │   │   │   │   ├── gameRosters.js (44 lines)
    │   │   │   │   ├── goals.js (35 lines)
    │   │   │   │   ├── index.js (42 lines)
    │   │   │   │   ├── minutesValidation.js (12 lines)
    │   │   │   │   ├── playerMatchStats.js (28 lines)
    │   │   │   │   ├── stats.js (24 lines)
    │   │   │   │   ├── status.js (26 lines)
    │   │   │   │   ├── substitutions.js (34 lines)
    │   │   │   │   └── timeline.js (33 lines)
    │   │   │   ├── analytics.js (15 lines)
    │   │   │   ├── auth.js (14 lines)
    │   │   │   ├── data.js (11 lines)
    │   │   │   ├── drills.js (14 lines)
    │   │   │   ├── formations.js (14 lines)
    │   │   │   ├── games.single-file.backup.js (105 lines)
    │   │   │   ├── organizationConfigs.js (12 lines)
    │   │   │   ├── players.js (14 lines)
    │   │   │   ├── scoutReports.js (14 lines)
    │   │   │   ├── sessionDrills.js (15 lines)
    │   │   │   ├── teams.js (14 lines)
    │   │   │   ├── timelineEvents.js (38 lines)
    │   │   │   ├── trainingSessions.js (14 lines)
    │   │   │   └── users.js (14 lines)
    │   │   ├── scripts
    │   │   │   ├── backfillJobs.js (122 lines)
    │   │   │   └── README.md (90 lines)
    │   │   ├── services
    │   │   │   ├── __tests__
    │   │   │   │   ├── gameRules.test.js (886 lines)
    │   │   │   │   ├── minutesCalculation.test.js (595 lines)
    │   │   │   │   └── timelineService.test.js (308 lines)
    │   │   │   ├── games
    │   │   │   │   ├── utils
    │   │   │   │   │   ├── gameEventsAggregator.js (92 lines)
    │   │   │   │   │   ├── gameRules.js (493 lines)
    │   │   │   │   │   ├── goalAnalytics.js (81 lines)
    │   │   │   │   │   ├── goalsAssistsCalculation.js (57 lines)
    │   │   │   │   │   ├── minutesCalculation.js (362 lines)
    │   │   │   │   │   ├── minutesValidation.js (51 lines)
    │   │   │   │   │   └── substitutionAnalytics.js (86 lines)
    │   │   │   │   ├── cardService.js (273 lines)
    │   │   │   │   ├── difficultyAssessmentService.js (100 lines)
    │   │   │   │   ├── gameReportService.js (311 lines)
    │   │   │   │   ├── gameRosterService.js (107 lines)
    │   │   │   │   ├── gameService.js (428 lines)
    │   │   │   │   ├── goalService.js (267 lines)
    │   │   │   │   ├── minutesValidationService.js (51 lines)
    │   │   │   │   ├── playerMatchStatsService.js (81 lines)
    │   │   │   │   └── substitutionService.js (270 lines)
    │   │   │   ├── training
    │   │   │   │   ├── drillService.js (72 lines)
    │   │   │   │   ├── sessionDrillService.js (147 lines)
    │   │   │   │   └── trainingSessionService.js (83 lines)
    │   │   │   ├── analyticsService.js (267 lines)
    │   │   │   ├── authService.js (97 lines)
    │   │   │   ├── dataService.js (139 lines)
    │   │   │   ├── formationService.js (72 lines)
    │   │   │   ├── organizationConfigService.js (137 lines)
    │   │   │   ├── playerService.js (95 lines)
    │   │   │   ├── scoutReportService.js (91 lines)
    │   │   │   ├── teamService.js (83 lines)
    │   │   │   ├── timelineEventService.js (119 lines)
    │   │   │   └── userService.js (76 lines)
    │   │   ├── utils
    │   │   │   ├── ageGroupUtils.js (94 lines)
    │   │   │   └── cardValidation.js (73 lines)
    │   │   ├── app.js (112 lines)
    │   │   └── worker.js (150 lines)
    │   ├── .env (16 lines)
    │   ├── env.example (18 lines)
    │   ├── fix-index.js (37 lines)
    │   ├── jest.config.js (15 lines)
    │   ├── package-lock.json (6326 lines)
    │   ├── package.json (41 lines)
    │   └── README.md (165 lines)
    ├── docs
    │   ├── official
    │   │   ├── apiDocumentation.md (1680 lines)
    │   │   ├── backendSummary.md (1186 lines)
    │   │   ├── databaseArchitecture.md (857 lines)
    │   │   ├── DRAFT_AND_CACHING_SYSTEM.md (2014 lines)
    │   │   ├── DUAL_SYSTEM_ARCHITECTURE.md (1373 lines)
    │   │   ├── GOALS_ASSISTS_SYSTEM.md (1049 lines)
    │   │   ├── MATCH_EVENTS_COMPREHENSIVE_GUIDE.md (1102 lines)
    │   │   ├── MINUTES_CALCULATION_SYSTEM.md (759 lines)
    │   │   ├── README.md (222 lines)
    │   │   ├── STATS_CALCULATION_COMPARISON.md (343 lines)
    │   │   └── WORKER_JOB_QUEUE_SYSTEM.md (895 lines)
    │   ├── planned_features
    │   │   ├── auto_sub_feature_plan.md (488 lines)
    │   │   ├── ci_cd_implementation_plan.md (944 lines)
    │   │   ├── draft improvement (52 lines)
    │   │   ├── ENHANCED_MATCH_EVENT_TRACKING_SPEC.md (1684 lines)
    │   │   ├── EXPLANATION_MISSING_FEATURES.md (240 lines)
    │   │   ├── FUTURE_ENHANCEMENTS_SUMMARY.md (320 lines)
    │   │   ├── MINUTES_UI_COMPONENT_SPEC.md (413 lines)
    │   │   ├── NOT_IMPLEMENTED_FEATURES_DESCRIPTIONS.md (209 lines)
    │   │   ├── optimistic_ui_plan.md (741 lines)
    │   │   ├── organization_config_implementation_plan.md (1319 lines)
    │   │   └── refactor_disciplinary_architecture_plan.md (1065 lines)
    │   ├── BACKEND_TEST_SETUP.md (137 lines)
    │   ├── ISSUES_TO_SOLVE_LATER.md (477 lines)
    │   ├── PROJECT_STRUCTURE_DEEP_REVIEW.md (752 lines)
    │   ├── README.md (120 lines)
    │   └── TESTING_DOCUMENTATION.md (317 lines)
    ├── frontend
    │   ├── src
    │   │   ├── __mocks__
    │   │   │   └── lucide-react.js (38 lines)
    │   │   ├── __tests__
    │   │   │   ├── e2e
    │   │   │   │   ├── gameManagement.spec.js (188 lines)
    │   │   │   │   └── README.md (280 lines)
    │   │   │   └── integration
    │   │   │       ├── gameCreationFlow.test.jsx (135 lines)
    │   │   │       └── README.md (99 lines)
    │   │   ├── app
    │   │   │   ├── layout
    │   │   │   │   ├── components
    │   │   │   │   ├── index.js (4 lines)
    │   │   │   │   └── MainLayout.jsx (389 lines)
    │   │   │   ├── providers
    │   │   │   │   ├── DataProvider.jsx (266 lines)
    │   │   │   │   ├── index.js (6 lines)
    │   │   │   │   ├── QueryProvider.jsx (65 lines)
    │   │   │   │   └── ThemeProvider.jsx (213 lines)
    │   │   │   └── router
    │   │   │       ├── guards
    │   │   │       │   └── FeatureGuard.jsx (27 lines)
    │   │   │       ├── index.jsx (55 lines)
    │   │   │       └── routes.jsx (179 lines)
    │   │   ├── features
    │   │   │   ├── analytics
    │   │   │   │   ├── api
    │   │   │   │   ├── components
    │   │   │   │   │   ├── AnalyticsPage
    │   │   │   │   │   │   └── index.jsx (356 lines)
    │   │   │   │   │   ├── DashboardPage
    │   │   │   │   │   │   └── index.jsx (504 lines)
    │   │   │   │   │   └── shared
    │   │   │   │   │       ├── DashboardHeader.jsx (44 lines)
    │   │   │   │   │       ├── DashboardStats.jsx (68 lines)
    │   │   │   │   │       ├── GameZone.jsx (99 lines)
    │   │   │   │   │       ├── index.js (10 lines)
    │   │   │   │   │       └── RecentActivity.jsx (103 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   │   ├── dashboardConstants.js (62 lines)
    │   │   │   │   │   └── index.js (4 lines)
    │   │   │   │   └── index.js (8 lines)
    │   │   │   ├── drill-system
    │   │   │   │   ├── api
    │   │   │   │   │   ├── drillApi.js (28 lines)
    │   │   │   │   │   └── index.js (4 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── DrillDesignerPage
    │   │   │   │   │   │   └── index.jsx (280 lines)
    │   │   │   │   │   ├── DrillLibraryPage
    │   │   │   │   │   │   ├── components
    │   │   │   │   │   │   │   ├── dialogs
    │   │   │   │   │   │   │   │   ├── AddDrillDialog.jsx (348 lines)
    │   │   │   │   │   │   │   │   └── DrillDetailDialog.jsx (103 lines)
    │   │   │   │   │   │   │   ├── DrillGrid.jsx (68 lines)
    │   │   │   │   │   │   │   └── DrillLibraryHeader.jsx (61 lines)
    │   │   │   │   │   │   ├── index.jsx (128 lines)
    │   │   │   │   │   │   └── README.md (78 lines)
    │   │   │   │   │   ├── shared
    │   │   │   │   │   │   ├── DrillDesignerCanvas.jsx (68 lines)
    │   │   │   │   │   │   ├── DrillDesignerHeader.jsx (69 lines)
    │   │   │   │   │   │   ├── DrillDesignerToolbar.jsx (236 lines)
    │   │   │   │   │   │   └── index.js (9 lines)
    │   │   │   │   │   ├── DrillCanvas.jsx (636 lines)
    │   │   │   │   │   ├── DrillDescriptionModal.jsx (74 lines)
    │   │   │   │   │   ├── DrillDetailModal.jsx (174 lines)
    │   │   │   │   │   └── DrillMenuDropdown.jsx (62 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   │   ├── drillLabUtils.js (82 lines)
    │   │   │   │   │   └── index.js (4 lines)
    │   │   │   │   └── index.js (8 lines)
    │   │   │   ├── game-management
    │   │   │   │   ├── __tests__
    │   │   │   │   │   ├── gameApi.test.js (160 lines)
    │   │   │   │   │   └── README.md (160 lines)
    │   │   │   │   ├── api
    │   │   │   │   │   ├── cardsApi.js (107 lines)
    │   │   │   │   │   ├── difficultyAssessmentApi.js (70 lines)
    │   │   │   │   │   ├── gameApi.js (111 lines)
    │   │   │   │   │   ├── goalsApi.js (113 lines)
    │   │   │   │   │   ├── index.js (15 lines)
    │   │   │   │   │   ├── playerMatchStatsApi.js (66 lines)
    │   │   │   │   │   ├── playerStatsApi.js (29 lines)
    │   │   │   │   │   ├── substitutionsApi.js (88 lines)
    │   │   │   │   │   └── timelineApi.js (34 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── AddGamePage
    │   │   │   │   │   │   └── index.jsx (226 lines)
    │   │   │   │   │   ├── GameDetailsPage
    │   │   │   │   │   │   ├── __tests__
    │   │   │   │   │   │   │   ├── draftE2E.test.jsx (318 lines)
    │   │   │   │   │   │   │   ├── draftMerge.test.jsx (344 lines)
    │   │   │   │   │   │   │   └── validation.integration.test.jsx (820 lines)
    │   │   │   │   │   │   ├── components
    │   │   │   │   │   │   │   ├── dialogs
    │   │   │   │   │   │   │   │   ├── CardDialog.jsx (433 lines)
    │   │   │   │   │   │   │   │   ├── FinalReportDialog.jsx (108 lines)
    │   │   │   │   │   │   │   │   ├── GoalDialog.jsx (418 lines)
    │   │   │   │   │   │   │   │   ├── PlayerPerformanceDialog.jsx (503 lines)
    │   │   │   │   │   │   │   │   ├── PlayerSelectionDialog.jsx (115 lines)
    │   │   │   │   │   │   │   │   ├── SubstitutionDialog.jsx (330 lines)
    │   │   │   │   │   │   │   │   └── TeamSummaryDialog.jsx (130 lines)
    │   │   │   │   │   │   │   ├── features
    │   │   │   │   │   │   │   │   ├── DetailedDisciplinarySection.jsx (73 lines)
    │   │   │   │   │   │   │   │   ├── DetailedStatsSection.jsx (283 lines)
    │   │   │   │   │   │   │   │   ├── GoalInvolvementSection.jsx (142 lines)
    │   │   │   │   │   │   │   │   └── index.js (17 lines)
    │   │   │   │   │   │   │   ├── AutoFillReportsButton.jsx (45 lines)
    │   │   │   │   │   │   │   ├── DifficultyAssessmentCard.jsx (291 lines)
    │   │   │   │   │   │   │   ├── GameDayRosterSidebar.jsx (128 lines)
    │   │   │   │   │   │   │   ├── GameDetailsHeader.jsx (270 lines)
    │   │   │   │   │   │   │   ├── MatchAnalysisSidebar.jsx (614 lines)
    │   │   │   │   │   │   │   ├── PlayerCard.jsx (160 lines)
    │   │   │   │   │   │   │   └── TacticalBoard.jsx (269 lines)
    │   │   │   │   │   │   ├── formations.js (53 lines)
    │   │   │   │   │   │   ├── index.jsx (2589 lines)
    │   │   │   │   │   │   └── README.md (176 lines)
    │   │   │   │   │   └── GamesSchedulePage
    │   │   │   │   │       └── index.jsx (581 lines)
    │   │   │   │   ├── utils
    │   │   │   │   │   ├── __tests__
    │   │   │   │   │   │   ├── minutesValidation.test.js (63 lines)
    │   │   │   │   │   │   └── squadValidation.test.js (615 lines)
    │   │   │   │   │   ├── cardValidation.js (112 lines)
    │   │   │   │   │   ├── gameState.js (120 lines)
    │   │   │   │   │   ├── gameUtils.js (43 lines)
    │   │   │   │   │   ├── index.js (3 lines)
    │   │   │   │   │   ├── minutesValidation.js (25 lines)
    │   │   │   │   │   └── squadValidation.js (270 lines)
    │   │   │   │   └── index.js (22 lines)
    │   │   │   ├── player-management
    │   │   │   │   ├── api
    │   │   │   │   │   ├── index.js (4 lines)
    │   │   │   │   │   └── playerApi.js (44 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── AddPlayerPage
    │   │   │   │   │   │   └── index.jsx (192 lines)
    │   │   │   │   │   ├── PlayerDetailPage
    │   │   │   │   │   │   └── index.jsx (182 lines)
    │   │   │   │   │   ├── PlayersPage
    │   │   │   │   │   │   └── index.jsx (280 lines)
    │   │   │   │   │   ├── shared
    │   │   │   │   │   │   ├── DevelopmentTimeline.jsx (59 lines)
    │   │   │   │   │   │   ├── index.js (11 lines)
    │   │   │   │   │   │   ├── PerformanceStatsCard.jsx (60 lines)
    │   │   │   │   │   │   ├── PlayerProfileCard.jsx (77 lines)
    │   │   │   │   │   │   ├── ProfileImage.jsx (31 lines)
    │   │   │   │   │   │   └── TimelineItem.jsx (80 lines)
    │   │   │   │   │   └── shared-players
    │   │   │   │   │       ├── PlayerFilters.jsx (50 lines)
    │   │   │   │   │       ├── PlayerGrid.jsx (133 lines)
    │   │   │   │   │       └── PlayersHeader.jsx (24 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   └── index.js (10 lines)
    │   │   │   ├── reporting
    │   │   │   │   ├── api
    │   │   │   │   │   ├── index.js (4 lines)
    │   │   │   │   │   └── reportApi.js (59 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── AddReportPage
    │   │   │   │   │   │   └── index.jsx (523 lines)
    │   │   │   │   │   ├── MatchReportModal.jsx (628 lines)
    │   │   │   │   │   └── PlayerPerformanceModal.jsx (491 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   └── index.js (7 lines)
    │   │   │   ├── settings
    │   │   │   │   ├── api
    │   │   │   │   ├── components
    │   │   │   │   │   ├── SettingsPage
    │   │   │   │   │   │   ├── DatabaseSyncSection.jsx (249 lines)
    │   │   │   │   │   │   ├── index.jsx (85 lines)
    │   │   │   │   │   │   ├── OrganizationSettingsSection.jsx (784 lines)
    │   │   │   │   │   │   └── SyncStatusPanel.jsx (254 lines)
    │   │   │   │   │   └── shared
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   └── index.js (5 lines)
    │   │   │   ├── team-management
    │   │   │   │   ├── api
    │   │   │   │   │   ├── formationApi.js (33 lines)
    │   │   │   │   │   ├── index.js (5 lines)
    │   │   │   │   │   └── teamApi.js (28 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── AddTeamPage
    │   │   │   │   │   │   └── index.jsx (161 lines)
    │   │   │   │   │   └── TacticBoardPage
    │   │   │   │   │       └── index.jsx (1464 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   └── index.js (8 lines)
    │   │   │   ├── training-management
    │   │   │   │   ├── api
    │   │   │   │   │   ├── index.js (4 lines)
    │   │   │   │   │   └── trainingApi.js (70 lines)
    │   │   │   │   ├── components
    │   │   │   │   │   ├── TrainingPlannerPage
    │   │   │   │   │   │   ├── components
    │   │   │   │   │   │   │   ├── TrainingPlannerContent.jsx (55 lines)
    │   │   │   │   │   │   │   └── TrainingPlannerHeader.jsx (83 lines)
    │   │   │   │   │   │   ├── index.jsx (351 lines)
    │   │   │   │   │   │   └── README.md (61 lines)
    │   │   │   │   │   ├── DrillLibrarySidebar.jsx (174 lines)
    │   │   │   │   │   └── WeeklyCalendar.jsx (125 lines)
    │   │   │   │   ├── hooks
    │   │   │   │   ├── utils
    │   │   │   │   └── index.js (7 lines)
    │   │   │   └── user-management
    │   │   │       ├── api
    │   │   │       │   ├── index.js (4 lines)
    │   │   │       │   └── userApi.js (53 lines)
    │   │   │       ├── components
    │   │   │       │   ├── AccessDeniedPage
    │   │   │       │   │   └── index.jsx (77 lines)
    │   │   │       │   ├── AddUserPage
    │   │   │       │   │   └── index.jsx (194 lines)
    │   │   │       │   ├── LoginPage
    │   │   │       │   │   └── index.jsx (171 lines)
    │   │   │       │   └── LoginModal.jsx (188 lines)
    │   │   │       ├── hooks
    │   │   │       ├── utils
    │   │   │       └── index.js (9 lines)
    │   │   ├── lib
    │   │   │   ├── advanced-animations.ts (405 lines)
    │   │   │   ├── advanced-theming.ts (605 lines)
    │   │   │   ├── dark-mode.ts (236 lines)
    │   │   │   ├── progressive-loading.tsx (521 lines)
    │   │   │   └── responsive.ts (358 lines)
    │   │   ├── services
    │   │   │   └── jwtAuthService.js (172 lines)
    │   │   ├── shared
    │   │   │   ├── api
    │   │   │   │   ├── auth.js (27 lines)
    │   │   │   │   ├── client.js (121 lines)
    │   │   │   │   ├── dataApi.js (18 lines)
    │   │   │   │   ├── endpoints.js (98 lines)
    │   │   │   │   ├── index.js (14 lines)
    │   │   │   │   └── README.md (251 lines)
    │   │   │   ├── components
    │   │   │   │   ├── __tests__
    │   │   │   │   │   └── ConfirmationModal.test.jsx (377 lines)
    │   │   │   │   ├── OptimizedImage
    │   │   │   │   │   ├── index.js (8 lines)
    │   │   │   │   │   ├── OptimizedImage.jsx (157 lines)
    │   │   │   │   │   └── README.md (351 lines)
    │   │   │   │   ├── PageLoader
    │   │   │   │   │   ├── index.js (8 lines)
    │   │   │   │   │   └── SuspenseLoader.jsx (45 lines)
    │   │   │   │   ├── VirtualList
    │   │   │   │   │   ├── index.js (8 lines)
    │   │   │   │   │   ├── README.md (221 lines)
    │   │   │   │   │   ├── VirtualGrid.jsx (82 lines)
    │   │   │   │   │   └── VirtualList.jsx (72 lines)
    │   │   │   │   ├── ConfirmationModal.jsx (120 lines)
    │   │   │   │   ├── ConfirmationToast.jsx (86 lines)
    │   │   │   │   ├── CustomNumberInput.jsx (68 lines)
    │   │   │   │   ├── CustomTooltip.jsx (64 lines)
    │   │   │   │   ├── FormationEditor.jsx (633 lines)
    │   │   │   │   ├── FormationEditorModal.jsx (133 lines)
    │   │   │   │   ├── formations.jsx (47 lines)
    │   │   │   │   ├── FormFields.jsx (227 lines)
    │   │   │   │   ├── GenericAddPage.jsx (195 lines)
    │   │   │   │   ├── index.js (15 lines)
    │   │   │   │   ├── PlayerNumberMenu.jsx (54 lines)
    │   │   │   │   ├── PlayerSelectionModal.jsx (273 lines)
    │   │   │   │   └── ThemeEditor.jsx (555 lines)
    │   │   │   ├── config
    │   │   │   │   └── index.js (4 lines)
    │   │   │   ├── hooks
    │   │   │   │   ├── __tests__
    │   │   │   │   │   ├── useAutosave.test.js (294 lines)
    │   │   │   │   │   └── useGames.test.js (139 lines)
    │   │   │   │   ├── queries
    │   │   │   │   │   ├── index.js (15 lines)
    │   │   │   │   │   ├── README.md (204 lines)
    │   │   │   │   │   ├── useGames.js (122 lines)
    │   │   │   │   │   ├── usePlayers.js (107 lines)
    │   │   │   │   │   └── useTeams.js (102 lines)
    │   │   │   │   ├── index.js (16 lines)
    │   │   │   │   ├── use-mobile.jsx (20 lines)
    │   │   │   │   ├── useAutosave.js (165 lines)
    │   │   │   │   ├── useDashboardData.js (108 lines)
    │   │   │   │   ├── useDrillLabData.js (131 lines)
    │   │   │   │   ├── useDrillLabHistory.js (61 lines)
    │   │   │   │   ├── useDrillLabMode.js (35 lines)
    │   │   │   │   ├── useFeature.js (125 lines)
    │   │   │   │   ├── usePlayersData.js (67 lines)
    │   │   │   │   ├── useRecentEvents.js (47 lines)
    │   │   │   │   └── useUserRole.js (63 lines)
    │   │   │   ├── lib
    │   │   │   │   ├── accessibility.ts (377 lines)
    │   │   │   │   ├── index.js (6 lines)
    │   │   │   │   ├── theme.ts (747 lines)
    │   │   │   │   └── utils.js (6 lines)
    │   │   │   ├── ui
    │   │   │   │   ├── composed
    │   │   │   │   │   ├── index.js (10 lines)
    │   │   │   │   │   └── StatSliderControl.jsx (141 lines)
    │   │   │   │   ├── primitives
    │   │   │   │   │   ├── accordion.jsx (42 lines)
    │   │   │   │   │   ├── advanced-animated-components.jsx (597 lines)
    │   │   │   │   │   ├── alert-dialog.jsx (98 lines)
    │   │   │   │   │   ├── alert.jsx (48 lines)
    │   │   │   │   │   ├── animated-components.jsx (511 lines)
    │   │   │   │   │   ├── aspect-ratio.jsx (6 lines)
    │   │   │   │   │   ├── avatar.jsx (36 lines)
    │   │   │   │   │   ├── badge.jsx (35 lines)
    │   │   │   │   │   ├── breadcrumb.jsx (93 lines)
    │   │   │   │   │   ├── button.jsx (49 lines)
    │   │   │   │   │   ├── calendar.jsx (72 lines)
    │   │   │   │   │   ├── card.jsx (51 lines)
    │   │   │   │   │   ├── carousel.jsx (194 lines)
    │   │   │   │   │   ├── chart.jsx (310 lines)
    │   │   │   │   │   ├── checkbox.jsx (23 lines)
    │   │   │   │   │   ├── collapsible.jsx (12 lines)
    │   │   │   │   │   ├── combobox.jsx (94 lines)
    │   │   │   │   │   ├── command.jsx (117 lines)
    │   │   │   │   │   ├── context-menu.jsx (157 lines)
    │   │   │   │   │   ├── DataCard.jsx (43 lines)
    │   │   │   │   │   ├── design-system-components.jsx (117 lines)
    │   │   │   │   │   ├── dialog.jsx (97 lines)
    │   │   │   │   │   ├── drawer.jsx (93 lines)
    │   │   │   │   │   ├── dropdown-menu.jsx (157 lines)
    │   │   │   │   │   ├── EmptyState.jsx (34 lines)
    │   │   │   │   │   ├── form.jsx (167 lines)
    │   │   │   │   │   ├── hover-card.jsx (26 lines)
    │   │   │   │   │   ├── index.js (53 lines)
    │   │   │   │   │   ├── input-otp.jsx (54 lines)
    │   │   │   │   │   ├── input.jsx (20 lines)
    │   │   │   │   │   ├── label.jsx (17 lines)
    │   │   │   │   │   ├── LoadingState.jsx (43 lines)
    │   │   │   │   │   ├── menubar.jsx (201 lines)
    │   │   │   │   │   ├── navigation-menu.jsx (105 lines)
    │   │   │   │   │   ├── PageHeader.jsx (39 lines)
    │   │   │   │   │   ├── PageLayout.jsx (23 lines)
    │   │   │   │   │   ├── pagination.jsx (101 lines)
    │   │   │   │   │   ├── popover.jsx (28 lines)
    │   │   │   │   │   ├── progress.jsx (24 lines)
    │   │   │   │   │   ├── radio-group.jsx (30 lines)
    │   │   │   │   │   ├── resizable.jsx (43 lines)
    │   │   │   │   │   ├── scroll-area.jsx (39 lines)
    │   │   │   │   │   ├── SearchFilter.jsx (63 lines)
    │   │   │   │   │   ├── select.jsx (122 lines)
    │   │   │   │   │   ├── separator.jsx (24 lines)
    │   │   │   │   │   ├── sheet.jsx (110 lines)
    │   │   │   │   │   ├── sidebar.jsx (619 lines)
    │   │   │   │   │   ├── skeleton.jsx (15 lines)
    │   │   │   │   │   ├── slider.jsx (22 lines)
    │   │   │   │   │   ├── sonner.jsx (30 lines)
    │   │   │   │   │   ├── StandardButton.jsx (44 lines)
    │   │   │   │   │   ├── switch.jsx (23 lines)
    │   │   │   │   │   ├── table.jsx (87 lines)
    │   │   │   │   │   ├── tabs.jsx (42 lines)
    │   │   │   │   │   ├── textarea.jsx (19 lines)
    │   │   │   │   │   ├── theme-components.jsx (672 lines)
    │   │   │   │   │   ├── toast.jsx (113 lines)
    │   │   │   │   │   ├── toaster.jsx (44 lines)
    │   │   │   │   │   ├── toggle-group.jsx (45 lines)
    │   │   │   │   │   ├── toggle.jsx (39 lines)
    │   │   │   │   │   ├── tooltip.jsx (29 lines)
    │   │   │   │   │   ├── unified-components.jsx (589 lines)
    │   │   │   │   │   ├── use-toast.jsx (165 lines)
    │   │   │   │   │   └── virtual-scrolling.jsx (639 lines)
    │   │   │   │   └── index.js (5 lines)
    │   │   │   └── utils
    │   │   │       ├── date
    │   │   │       │   ├── dateUtils.js (60 lines)
    │   │   │       │   ├── index.js (5 lines)
    │   │   │       │   └── seasonUtils.js (86 lines)
    │   │   │       ├── categoryColors.js (24 lines)
    │   │   │       ├── index.js (17 lines)
    │   │   │       └── positionUtils.js (56 lines)
    │   │   ├── styles
    │   │   │   ├── dark-mode.css (158 lines)
    │   │   │   ├── design-system.css (372 lines)
    │   │   │   └── responsive-design.css (588 lines)
    │   │   ├── App.css (23 lines)
    │   │   ├── App.jsx (14 lines)
    │   │   ├── index.css (397 lines)
    │   │   ├── main.jsx (11 lines)
    │   │   └── setupTests.js (72 lines)
    │   ├── .babelrc.cjs (25 lines)
    │   ├── .babelrc.js (26 lines)
    │   ├── .prettierignore (23 lines)
    │   ├── .prettierrc (12 lines)
    │   ├── components.json (21 lines)
    │   ├── eslint.config.js (47 lines)
    │   ├── index.html (14 lines)
    │   ├── jest.config.cjs (38 lines)
    │   ├── jsconfig.json (10 lines)
    │   ├── package-lock.json (14790 lines)
    │   ├── package.json (104 lines)
    │   ├── postcss.config.js (7 lines)
    │   ├── tailwind.config.js (180 lines)
    │   ├── TEST_GUIDE.md (456 lines)
    │   ├── TEST_IMPLEMENTATION_GUIDE.md (196 lines)
    │   └── vite.config.js (24 lines)
    ├── scripts
    │   └── generate-structure.js (189 lines)
    ├── .gitignore (62 lines)
    ├── PROJECT_STRUCTURE.md (620 lines)
    └── README.md (407 lines)
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

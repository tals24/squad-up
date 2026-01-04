/**
 * Pages Index
 * 
 * Central export point for all page components.
 * Pages are thin wrappers around feature components,
 * handling only route-level concerns.
 * 
 * Architecture:
 * - Pages = routing layer (what the router sees)
 * - Features = business logic layer (what pages compose)
 * - Shared = reusable utilities and components
 * 
 * Benefits:
 * - Clear separation of routing from business logic
 * - Easier to test features in isolation
 * - Simpler to refactor routing without touching features
 * - Better code organization and discoverability
 */

// Game Management Pages
export { default as GameDetailsPage } from './GameDetailsPage';

// TODO: Migrate other pages from features/* as part of Phase 2
// - GamesSchedulePage
// - AddGamePage
// - PlayersPage
// - PlayerDetailPage
// - AddPlayerPage
// - DrillLibraryPage
// - DrillDesignerPage
// - TrainingPlannerPage
// - DashboardPage
// - AnalyticsPage
// - AddTeamPage
// - TacticBoardPage
// - LoginPage
// - AddUserPage
// - AccessDeniedPage
// - AddReportPage
// - SettingsPage


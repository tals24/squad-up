/**
 * Game Management Feature - Public API
 * 
 * ⚠️ DEPRECATED: This feature is being split into domain-specific features:
 * - game-scheduling: GamesSchedulePage, AddGamePage (migrated!)
 * - game-execution: GameDetailsPage (in progress)
 * 
 * TODO: After Phase C is complete, this file will be deleted.
 */

// Page Components (remaining to be migrated)
export { default as GameDetailsPage } from './components/GameDetailsPage';

// API Functions (deprecated - use shared/api or feature-specific APIs)
export * from './api/gameApi';

// Utilities
export * from './utils';


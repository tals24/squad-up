/**
 * Game Management Feature - Public API
 * 
 * This barrel export defines the public interface of the game-management feature.
 * Other features and parts of the app should only import from this file.
 */

// Page Components
export { default as GameDetailsPage } from './components/GameDetailsPage';
export { default as GamesSchedulePage } from './components/GamesSchedulePage';
export { default as AddGamePage } from './components/AddGamePage';

// API Functions
export * from './api/gameApi';

// Utilities
export * from './utils';

// Re-export specific components if needed by other features
// (Currently keeping them internal to the feature)


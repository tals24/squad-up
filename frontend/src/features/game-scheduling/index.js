/**
 * Game Scheduling Feature - Public API
 *
 * This feature handles pre-game planning: creating games, viewing schedules,
 * and transitioning games from Draft → Scheduled status.
 *
 * User Journey: Pre-game planning phase
 */

// Page Components
export { default as GamesSchedulePage } from './components/GamesSchedulePage';
export { default as AddGamePage } from './components/AddGamePage';

// API Functions
export * from './api';

// Utilities (if any)
// export * from './utils';

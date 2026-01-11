/**
 * Game Execution Feature - Public API
 *
 * This feature handles game day operations: starting games, tracking events
 * (goals, cards, substitutions), filling reports, and finalizing games.
 *
 * User Journey: Game day execution and post-game reporting
 * Statuses: Scheduled → Played → Done
 */

// Page Components
export { default as GameDetailsPage } from './components/GameDetailsPage';

// API Functions
export * from './api';

// Utilities
export * from './utils';

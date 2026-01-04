// Shared API - Barrel Export
export { apiClient, default } from './client';
export { API_ENDPOINTS } from './endpoints';

// Authentication
export { User, jwtAuthService } from './auth';

// Data Aggregation
export { fetchAllTables } from './dataApi';

// Games (Core read operations)
export { getGames, getGame, getGameById } from './gameApi';

// NOTE: Game write operations (create/update/delete) are in feature-specific APIs
// - game-scheduling: createGame, updateGame, deleteGame, transitionToScheduled
// - game-execution: startGame, submitFinalReport, etc (via apiClient directly in hooks)


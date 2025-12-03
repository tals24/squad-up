/**
 * API Endpoints
 * Centralized API endpoint constants
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    BY_ID: (id) => `/api/users/${id}`,
  },

  // Teams
  TEAMS: {
    BASE: '/api/teams',
    BY_ID: (id) => `/api/teams/${id}`,
  },

  // Players
  PLAYERS: {
    BASE: '/api/players',
    BY_ID: (id) => `/api/players/${id}`,
    SEARCH: '/api/players/search',
  },

  // Games
  GAMES: {
    BASE: '/api/games',
    BY_ID: (id) => `/api/games/${id}`,
  },

  // Game Rosters
  GAME_ROSTERS: {
    BASE: '/api/game-rosters',
    BY_ID: (id) => `/api/game-rosters/${id}`,
    BATCH_UPDATE: '/api/game-rosters/batch-update',
  },

  // Game Reports
  GAME_REPORTS: {
    BASE: '/api/game-reports',
    BY_ID: (id) => `/api/game-reports/${id}`,
    BATCH_UPDATE: '/api/game-reports/batch-update',
  },

  // Scout Reports
  SCOUT_REPORTS: {
    BASE: '/api/scout-reports',
    BY_ID: (id) => `/api/scout-reports/${id}`,
  },

  // Timeline Events
  TIMELINE_EVENTS: {
    BASE: '/api/timeline-events',
    BY_ID: (id) => `/api/timeline-events/${id}`,
  },

  // Drills
  DRILLS: {
    BASE: '/api/drills',
    BY_ID: (id) => `/api/drills/${id}`,
  },

  // Formations
  FORMATIONS: {
    BASE: '/api/formations',
    BY_ID: (id) => `/api/formations/${id}`,
  },

  // Training Sessions
  TRAINING_SESSIONS: {
    BASE: '/api/training-sessions',
    BY_ID: (id) => `/api/training-sessions/${id}`,
  },

  // Session Drills
  SESSION_DRILLS: {
    BASE: '/api/session-drills',
    BY_ID: (id) => `/api/session-drills/${id}`,
  },

  // Data (bulk fetch)
  DATA: {
    ALL: '/api/data/all',
  },
};

export default API_ENDPOINTS;


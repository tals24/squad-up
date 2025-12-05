/**
 * LEGACY API CLIENT
 * 
 * ⚠️ WARNING: This file contains legacy API functions that need to be migrated
 * to feature-specific API modules. This centralization is temporary to complete
 * the Phase 2 cleanup while maintaining functionality.
 * 
 * TODO - Future Refactoring (Phase 3):
 * - Migrate user/team functions → features/user-management/api/
 * - Migrate player functions → features/player-management/api/
 * - Migrate game functions → features/game-management/api/
 * - Migrate drill functions → features/drill-system/api/
 * - Migrate training functions → features/training-management/api/
 * - Migrate formation functions → features/team-management/api/
 * - Migrate report functions → features/reporting/api/
 * 
 * After migration, this file should be deleted.
 * 
 * @deprecated Use feature-specific APIs instead
 * @since Phase 2 cleanup (December 2025)
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  console.log('🔐 Getting auth token:', !!token);
  return token;
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  console.log(`🌐 Making API call to: ${API_BASE_URL}${endpoint}`);
  console.log('  - Method:', options.method || 'GET');
  console.log('  - Has token:', !!token);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`  - Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('  - Error response body:', errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('  - Response data keys:', Object.keys(data));
    console.log('  - ✅ API call successful');
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ API call error:', error);
    return { data: null, error: error.message };
  }
};

// ===========================================================================
// DATA AGGREGATION
// ===========================================================================

export const fetchAllTables = async () => {
  console.log('Fetching all data from backend API...');
  return await apiCall('/data/all');
};

// ===========================================================================
// USER MANAGEMENT
// ===========================================================================

export const getUsers = async () => {
  return await apiCall('/users');
};

export const createUser = async (userData) => {
  return await apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (userId, userData) => {
  return await apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (userId) => {
  return await apiCall(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// TEAM MANAGEMENT
// ===========================================================================

export const getTeams = async () => {
  return await apiCall('/teams');
};

export const createTeam = async (teamData) => {
  return await apiCall('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
};

export const updateTeam = async (teamId, teamData) => {
  return await apiCall(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData),
  });
};

export const deleteTeam = async (teamId) => {
  return await apiCall(`/teams/${teamId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// PLAYER MANAGEMENT
// ===========================================================================

export const getPlayers = async () => {
  return await apiCall('/players');
};

export const getPlayersForTeam = async (teamId) => {
  return await apiCall(`/players?team=${teamId}`);
};

export const searchAllPlayers = async ({ searchTerm, teamId }) => {
  let url = '/players';
  const params = new URLSearchParams();
  
  if (searchTerm) {
    params.append('search', searchTerm);
  }
  
  if (teamId && teamId !== 'all') {
    params.append('team', teamId);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  console.log(`🔍 Search - URL: ${url}, searchTerm: "${searchTerm}", teamId: "${teamId}"`);
  
  return await apiCall(url);
};

export const createPlayer = async (playerData) => {
  return await apiCall('/players', {
    method: 'POST',
    body: JSON.stringify(playerData),
  });
};

export const updatePlayer = async (playerId, playerData) => {
  return await apiCall(`/players/${playerId}`, {
    method: 'PUT',
    body: JSON.stringify(playerData),
  });
};

export const deletePlayer = async (playerId) => {
  return await apiCall(`/players/${playerId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// GAME MANAGEMENT
// ===========================================================================

export const getGames = async () => {
  return await apiCall('/games');
};

export const createGame = async (gameData) => {
  return await apiCall('/games', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
};

export const updateGame = async (gameId, gameData) => {
  return await apiCall(`/games/${gameId}`, {
    method: 'PUT',
    body: JSON.stringify(gameData),
  });
};

export const deleteGame = async (gameId) => {
  return await apiCall(`/games/${gameId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// GAME ROSTER MANAGEMENT
// ===========================================================================

export const getGameRosters = async () => {
  return await apiCall('/game-rosters');
};

export const createGameRoster = async (rosterData) => {
  return await apiCall('/game-rosters', {
    method: 'POST',
    body: JSON.stringify(rosterData),
  });
};

export const updateGameRoster = async (rosterId, rosterData) => {
  return await apiCall(`/game-rosters/${rosterId}`, {
    method: 'PUT',
    body: JSON.stringify(rosterData),
  });
};

export const deleteGameRoster = async (rosterId) => {
  return await apiCall(`/game-rosters/${rosterId}`, {
    method: 'DELETE',
  });
};

export const initializeGameRoster = async (gameId, teamId) => {
  console.log('Initializing game roster...', { gameId, teamId });
  return await apiCall('/game-rosters/initialize', {
    method: 'POST',
    body: JSON.stringify({ gameId, teamId }),
  });
};

// ===========================================================================
// TIMELINE EVENTS
// ===========================================================================

export const getTimelineEvents = async () => {
  return await apiCall('/timeline-events');
};

export const createTimelineEvent = async (eventData) => {
  return await apiCall('/timeline-events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const updateTimelineEvent = async (eventId, eventData) => {
  return await apiCall(`/timeline-events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
};

export const deleteTimelineEvent = async (eventId) => {
  return await apiCall(`/timeline-events/${eventId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// REPORTS
// ===========================================================================

export const getGameReports = async () => {
  return await apiCall('/game-reports');
};

export const createGameReport = async (reportData) => {
  return await apiCall('/game-reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
};

export const updateGameReport = async (reportId, reportData) => {
  return await apiCall(`/game-reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(reportData),
  });
};

export const deleteGameReport = async (reportId) => {
  return await apiCall(`/game-reports/${reportId}`, {
    method: 'DELETE',
  });
};

export const getScoutReports = async () => {
  return await apiCall('/scout-reports');
};

export const createScoutReport = async (reportData) => {
  return await apiCall('/scout-reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
};

export const updateScoutReport = async (reportId, reportData) => {
  return await apiCall(`/scout-reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(reportData),
  });
};

export const deleteScoutReport = async (reportId) => {
  return await apiCall(`/scout-reports/${reportId}`, {
    method: 'DELETE',
  });
};

// Legacy alias for backward compatibility (will be removed)
export const createReport = createScoutReport;

// ===========================================================================
// DRILLS
// ===========================================================================

export const getDrills = async () => {
  return await apiCall('/drills');
};

export const createDrill = async (drillData) => {
  return await apiCall('/drills', {
    method: 'POST',
    body: JSON.stringify(drillData),
  });
};

export const updateDrill = async (drillId, drillData) => {
  return await apiCall(`/drills/${drillId}`, {
    method: 'PUT',
    body: JSON.stringify(drillData),
  });
};

export const deleteDrill = async (drillId) => {
  return await apiCall(`/drills/${drillId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// FORMATIONS
// ===========================================================================

export const getFormations = async () => {
  return await apiCall('/formations');
};

export const createFormation = async (formationData) => {
  return await apiCall('/formations', {
    method: 'POST',
    body: JSON.stringify(formationData),
  });
};

export const updateFormation = async (formationId, formationData) => {
  return await apiCall(`/formations/${formationId}`, {
    method: 'PUT',
    body: JSON.stringify(formationData),
  });
};

export const deleteFormation = async (formationId) => {
  return await apiCall(`/formations/${formationId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// TRAINING SESSIONS
// ===========================================================================

export const getTrainingSessions = async () => {
  return await apiCall('/training-sessions');
};

export const createTrainingSession = async (sessionData) => {
  return await apiCall('/training-sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
};

export const updateTrainingSession = async (sessionId, sessionData) => {
  return await apiCall(`/training-sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
};

export const deleteTrainingSession = async (sessionId) => {
  return await apiCall(`/training-sessions/${sessionId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// SESSION DRILLS
// ===========================================================================

export const getSessionDrills = async () => {
  return await apiCall('/session-drills');
};

export const createSessionDrill = async (drillData) => {
  return await apiCall('/session-drills', {
    method: 'POST',
    body: JSON.stringify(drillData),
  });
};

export const updateSessionDrill = async (drillId, drillData) => {
  return await apiCall(`/session-drills/${drillId}`, {
    method: 'PUT',
    body: JSON.stringify(drillData),
  });
};

export const deleteSessionDrill = async (drillId) => {
  return await apiCall(`/session-drills/${drillId}`, {
    method: 'DELETE',
  });
};

// ===========================================================================
// TRAINING PLANS
// ===========================================================================

export const saveTrainingPlan = async (planData) => {
  console.log('Saving training plan to backend...', planData);
  return await apiCall('/session-drills/batch', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
};

export const loadTrainingPlan = async (planData) => {
  console.log('Loading training plan from backend...', planData);
  return await apiCall(`/session-drills/plan/${planData.teamId}/${planData.weekIdentifier}`);
};


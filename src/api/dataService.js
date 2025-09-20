// Data service for connecting to custom backend API
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  // Get the JWT auth token from localStorage
  const token = localStorage.getItem('authToken');
  
  console.log('🔐 Getting auth token:');
  console.log('  - JWT Token exists:', !!token);
  console.log('  - Token length:', token ? token.length : 0);
  
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

  console.log('  - Request headers:', config.headers);

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

// Data fetching functions
export const fetchAllTables = async () => {
  console.log('Fetching all data from backend API...');
  return await apiCall('/data/all');
};

// Removed airtableSync - now using MongoDB backend directly

// User management
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

// Team management
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

// Player management
export const getPlayers = async () => {
  return await apiCall('/players');
};

export const getPlayersForTeam = async (teamId) => {
  return await apiCall(`/players?team=${teamId}`);
};

export const searchAllPlayers = async (searchTerm) => {
  return await apiCall(`/players?search=${encodeURIComponent(searchTerm)}`);
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

// Game management
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

// Game Roster management
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

// Timeline Events (Reports) management
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

// Drill management
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

// Formation management
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

// Training Session management
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

// Session Drill management
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

// Training Plan management (using session drills)
export const saveTrainingPlan = async (planData) => {
  console.log('Saving training plan to backend...', planData);
  // This would save a complete training plan with multiple session drills
  return await apiCall('/session-drills/batch', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
};

export const loadTrainingPlan = async (planId) => {
  console.log('Loading training plan from backend...', planId);
  // This would load a complete training plan
  return await apiCall(`/session-drills/plan/${planId}`);
};

// Initialize game roster (create roster entries for a game)
export const initializeGameRoster = async (gameId, teamId) => {
  console.log('Initializing game roster...', { gameId, teamId });
  return await apiCall('/game-rosters/initialize', {
    method: 'POST',
    body: JSON.stringify({ gameId, teamId }),
  });
};


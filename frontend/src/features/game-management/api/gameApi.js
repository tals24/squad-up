/**
 * Game Management API
 * All game-related API calls centralized here
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Get authentication token
 */
const getAuthToken = () => localStorage.getItem('authToken');

/**
 * Get all games for the current user's teams
 */
export const getGames = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/games`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch games');
  }
  
  return response.json();
};

/**
 * Get a single game by ID
 */
export const getGame = async (gameId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch game');
  }
  
  return response.json();
};

/**
 * Create a new game
 */
export const createGame = async (gameData) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(gameData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  
  return response.json();
};

/**
 * Update a game
 */
export const updateGame = async (gameId, updates) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update game');
  }
  
  return response.json();
};

/**
 * Delete a game
 */
export const deleteGame = async (gameId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete game');
  }
  
  return response.json();
};



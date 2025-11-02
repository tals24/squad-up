import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch all disciplinary actions for a game
 * @param {string} gameId - The game ID
 * @returns {Promise<Array>} Array of disciplinary actions
 */
export const fetchDisciplinaryActions = async (gameId) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(
    `${API_BASE_URL}/games/${gameId}/disciplinary-actions`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Fetch disciplinary actions for a specific player in a game
 * @param {string} gameId - The game ID
 * @param {string} playerId - The player ID
 * @returns {Promise<Array>} Array of disciplinary actions for the player
 */
export const fetchPlayerDisciplinaryActions = async (gameId, playerId) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(
    `${API_BASE_URL}/games/${gameId}/disciplinary-actions/player/${playerId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Create a new disciplinary action
 * @param {string} gameId - The game ID
 * @param {Object} actionData - Disciplinary action data
 * @returns {Promise<Object>} Created disciplinary action
 */
export const createDisciplinaryAction = async (gameId, actionData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.post(
    `${API_BASE_URL}/games/${gameId}/disciplinary-actions`,
    actionData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Update an existing disciplinary action
 * @param {string} gameId - The game ID
 * @param {string} actionId - The disciplinary action ID
 * @param {Object} actionData - Updated disciplinary action data
 * @returns {Promise<Object>} Updated disciplinary action
 */
export const updateDisciplinaryAction = async (gameId, actionId, actionData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.put(
    `${API_BASE_URL}/games/${gameId}/disciplinary-actions/${actionId}`,
    actionData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Delete a disciplinary action
 * @param {string} gameId - The game ID
 * @param {string} actionId - The disciplinary action ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteDisciplinaryAction = async (gameId, actionId) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.delete(
    `${API_BASE_URL}/games/${gameId}/disciplinary-actions/${actionId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};


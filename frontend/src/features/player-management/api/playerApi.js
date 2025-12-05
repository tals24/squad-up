/**
 * Player Management API
 * Handles all player-related API calls
 */

import { apiClient } from '@/shared/api/client';

/**
 * Get all players
 * @returns {Promise<Array>} List of all players
 */
export const getPlayers = async () => {
  return await apiClient.get('/api/players');
};

/**
 * Get players for a specific team
 * @param {string} teamId - Team ID
 * @returns {Promise<Array>} List of players for the team
 */
export const getPlayersForTeam = async (teamId) => {
  return await apiClient.get(`/api/players?team=${teamId}`);
};

/**
 * Search players
 * @param {Object} params - Search parameters
 * @param {string} params.searchTerm - Search term
 * @param {string} params.teamId - Team ID filter
 * @returns {Promise<Array>} List of matching players
 */
export const searchPlayers = async ({ searchTerm, teamId }) => {
  const params = new URLSearchParams();
  
  if (searchTerm) {
    params.append('search', searchTerm);
  }
  
  if (teamId && teamId !== 'all') {
    params.append('team', teamId);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/api/players?${queryString}` : '/api/players';
  
  return await apiClient.get(url);
};

/**
 * Get player by ID
 * @param {string} playerId - Player ID
 * @returns {Promise<Object>} Player data
 */
export const getPlayerById = async (playerId) => {
  return await apiClient.get(`/api/players/${playerId}`);
};

/**
 * Create new player
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Created player
 */
export const createPlayer = async (playerData) => {
  return await apiClient.post('/api/players', playerData);
};

/**
 * Update player
 * @param {string} playerId - Player ID
 * @param {Object} playerData - Updated player data
 * @returns {Promise<Object>} Updated player
 */
export const updatePlayer = async (playerId, playerData) => {
  return await apiClient.put(`/api/players/${playerId}`, playerData);
};

/**
 * Delete player
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export const deletePlayer = async (playerId) => {
  return await apiClient.delete(`/api/players/${playerId}`);
};


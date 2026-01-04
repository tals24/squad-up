/**
 * Game Scheduling API
 * 
 * Handles API calls for game creation, scheduling, and pre-game planning.
 * Part of the game-scheduling feature domain.
 */

import { apiClient } from '@/shared/api/client';

/**
 * Create a new game
 * @param {Object} gameData - Game data (Date, Time, Venue, Opponent, Team, GameType, Status)
 * @returns {Promise<Object>} Created game object
 */
export const createGame = async (gameData) => {
  const response = await apiClient.post('/api/games', gameData);
  return response;
};

/**
 * Update a game
 * @param {string} gameId - Game ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated game object
 */
export const updateGame = async (gameId, updates) => {
  const response = await apiClient.put(`/api/games/${gameId}`, updates);
  return response;
};

/**
 * Delete a game
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteGame = async (gameId) => {
  const response = await apiClient.delete(`/api/games/${gameId}`);
  return response;
};

/**
 * Transition game from Draft to Scheduled
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Updated game object
 */
export const transitionToScheduled = async (gameId) => {
  const response = await apiClient.post(`/api/games/${gameId}/transition-to-scheduled`);
  return response;
};

/**
 * Get game draft data (lineup draft for Scheduled games)
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Draft data
 */
export const getGameDraft = async (gameId) => {
  const response = await apiClient.get(`/api/games/${gameId}/draft`);
  return response;
};

/**
 * Update game draft data (autosave lineup)
 * @param {string} gameId - Game ID
 * @param {Object} draftData - Draft data to save
 * @returns {Promise<Object>} Update result
 */
export const updateGameDraft = async (gameId, draftData) => {
  const response = await apiClient.put(`/api/games/${gameId}/draft`, draftData);
  return response;
};

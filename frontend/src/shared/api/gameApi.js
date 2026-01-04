/**
 * Shared Game API
 * 
 * Core game data fetching operations used across multiple features.
 * Write operations (create/update/delete) are domain-specific and live in feature APIs.
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

/**
 * Get all games for the current user's teams
 * @param {Object} filters - Optional query filters
 * @returns {Promise<Array>} Array of game objects
 */
export const getGames = async (filters = {}) => {
  const response = await apiClient.get(API_ENDPOINTS.GAMES.BASE, { params: filters });
  return response;
};

/**
 * Get a single game by ID
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Game object with populated relationships
 */
export const getGame = async (gameId) => {
  const response = await apiClient.get(API_ENDPOINTS.GAMES.BY_ID(gameId));
  return response;
};

/**
 * Alias for getGame (for backward compatibility)
 * @deprecated Use getGame instead
 */
export const getGameById = getGame;

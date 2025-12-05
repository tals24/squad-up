/**
 * Player Management API
 * Handles all player-related API calls
 * 
 * NOTE: These functions return { data, error } format for backward compatibility
 */

import { apiClient } from '@/shared/api/client';

const wrapApiCall = async (apiCallFn) => {
  try {
    const data = await apiCallFn();
    return { data, error: null };
  } catch (error) {
    console.error('API call error:', error);
    return { data: null, error: error.message };
  }
};

export const getPlayers = async () => {
  return wrapApiCall(() => apiClient.get('/api/players'));
};

export const getPlayersForTeam = async (teamId) => {
  return wrapApiCall(() => apiClient.get(`/api/players?team=${teamId}`));
};

export const searchPlayers = async ({ searchTerm, teamId }) => {
  return wrapApiCall(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (teamId && teamId !== 'all') params.append('team', teamId);
    const queryString = params.toString();
    const url = queryString ? `/api/players?${queryString}` : '/api/players';
    return apiClient.get(url);
  });
};

// Alias for compatibility
export const searchAllPlayers = searchPlayers;

export const getPlayerById = async (playerId) => {
  return wrapApiCall(() => apiClient.get(`/api/players/${playerId}`));
};

export const createPlayer = async (playerData) => {
  return wrapApiCall(() => apiClient.post('/api/players', playerData));
};

export const updatePlayer = async (playerId, playerData) => {
  return wrapApiCall(() => apiClient.put(`/api/players/${playerId}`, playerData));
};

export const deletePlayer = async (playerId) => {
  return wrapApiCall(() => apiClient.delete(`/api/players/${playerId}`));
};


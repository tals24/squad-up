/**
 * Player Management API
 * Handles all player-related API calls
 */

import { apiClient } from '@/shared/api/client';

export const getPlayers = async () => {
  return await apiClient.get('/api/players');
};

export const getPlayersForTeam = async (teamId) => {
  return await apiClient.get(`/api/players?team=${teamId}`);
};

export const searchPlayers = async ({ searchTerm, teamId }) => {
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  if (teamId && teamId !== 'all') params.append('team', teamId);
  const queryString = params.toString();
  const url = queryString ? `/api/players?${queryString}` : '/api/players';
  return await apiClient.get(url);
};

// Alias for compatibility
export const searchAllPlayers = searchPlayers;

export const getPlayerById = async (playerId) => {
  return await apiClient.get(`/api/players/${playerId}`);
};

export const createPlayer = async (playerData) => {
  return await apiClient.post('/api/players', playerData);
};

export const updatePlayer = async (playerId, playerData) => {
  return await apiClient.put(`/api/players/${playerId}`, playerData);
};

export const deletePlayer = async (playerId) => {
  return await apiClient.delete(`/api/players/${playerId}`);
};


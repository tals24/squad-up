/**
 * Team Management API
 * Handles all team-related API calls
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

export const getTeams = async () => {
  return wrapApiCall(() => apiClient.get('/api/teams'));
};

export const getTeamById = async (teamId) => {
  return wrapApiCall(() => apiClient.get(`/api/teams/${teamId}`));
};

export const createTeam = async (teamData) => {
  return wrapApiCall(() => apiClient.post('/api/teams', teamData));
};

export const updateTeam = async (teamId, teamData) => {
  return wrapApiCall(() => apiClient.put(`/api/teams/${teamId}`, teamData));
};

export const deleteTeam = async (teamId) => {
  return wrapApiCall(() => apiClient.delete(`/api/teams/${teamId}`));
};


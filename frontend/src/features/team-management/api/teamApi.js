/**
 * Team Management API
 * Handles all team-related API calls
 */

import { apiClient } from '@/shared/api/client';

export const getTeams = async () => {
  return await apiClient.get('/api/teams');
};

export const getTeamById = async (teamId) => {
  return await apiClient.get(`/api/teams/${teamId}`);
};

export const createTeam = async (teamData) => {
  return await apiClient.post('/api/teams', teamData);
};

export const updateTeam = async (teamId, teamData) => {
  return await apiClient.put(`/api/teams/${teamId}`, teamData);
};

export const deleteTeam = async (teamId) => {
  return await apiClient.delete(`/api/teams/${teamId}`);
};


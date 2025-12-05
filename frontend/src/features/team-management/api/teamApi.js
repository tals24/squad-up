/**
 * Team Management API
 * Handles all team-related API calls
 */

import { apiClient } from '@/shared/api/client';

/**
 * Get all teams
 * @returns {Promise<Array>} List of all teams
 */
export const getTeams = async () => {
  return await apiClient.get('/api/teams');
};

/**
 * Get team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Team data
 */
export const getTeamById = async (teamId) => {
  return await apiClient.get(`/api/teams/${teamId}`);
};

/**
 * Create new team
 * @param {Object} teamData - Team data
 * @returns {Promise<Object>} Created team
 */
export const createTeam = async (teamData) => {
  return await apiClient.post('/api/teams', teamData);
};

/**
 * Update team
 * @param {string} teamId - Team ID
 * @param {Object} teamData - Updated team data
 * @returns {Promise<Object>} Updated team
 */
export const updateTeam = async (teamId, teamData) => {
  return await apiClient.put(`/api/teams/${teamId}`, teamData);
};

/**
 * Delete team
 * @param {string} teamId - Team ID
 * @returns {Promise<void>}
 */
export const deleteTeam = async (teamId) => {
  return await apiClient.delete(`/api/teams/${teamId}`);
};


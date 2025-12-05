/**
 * Formation API
 * Handles all formation-related API calls
 */

import { apiClient } from '@/shared/api/client';

/**
 * Get all formations
 * @returns {Promise<Array>} List of all formations
 */
export const getFormations = async () => {
  return await apiClient.get('/api/formations');
};

/**
 * Get formation by ID
 * @param {string} formationId - Formation ID
 * @returns {Promise<Object>} Formation data
 */
export const getFormationById = async (formationId) => {
  return await apiClient.get(`/api/formations/${formationId}`);
};

/**
 * Create new formation
 * @param {Object} formationData - Formation data
 * @returns {Promise<Object>} Created formation
 */
export const createFormation = async (formationData) => {
  return await apiClient.post('/api/formations', formationData);
};

/**
 * Update formation
 * @param {string} formationId - Formation ID
 * @param {Object} formationData - Updated formation data
 * @returns {Promise<Object>} Updated formation
 */
export const updateFormation = async (formationId, formationData) => {
  return await apiClient.put(`/api/formations/${formationId}`, formationData);
};

/**
 * Delete formation
 * @param {string} formationId - Formation ID
 * @returns {Promise<void>}
 */
export const deleteFormation = async (formationId) => {
  return await apiClient.delete(`/api/formations/${formationId}`);
};


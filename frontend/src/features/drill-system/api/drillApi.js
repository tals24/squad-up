/**
 * Drill System API
 * Handles all drill-related API calls
 */

import { apiClient } from '@/shared/api/client';

/**
 * Get all drills
 * @returns {Promise<Array>} List of all drills
 */
export const getDrills = async () => {
  return await apiClient.get('/api/drills');
};

/**
 * Get drill by ID
 * @param {string} drillId - Drill ID
 * @returns {Promise<Object>} Drill data
 */
export const getDrillById = async (drillId) => {
  return await apiClient.get(`/api/drills/${drillId}`);
};

/**
 * Create new drill
 * @param {Object} drillData - Drill data
 * @returns {Promise<Object>} Created drill
 */
export const createDrill = async (drillData) => {
  return await apiClient.post('/api/drills', drillData);
};

/**
 * Update drill
 * @param {string} drillId - Drill ID
 * @param {Object} drillData - Updated drill data
 * @returns {Promise<Object>} Updated drill
 */
export const updateDrill = async (drillId, drillData) => {
  return await apiClient.put(`/api/drills/${drillId}`, drillData);
};

/**
 * Delete drill
 * @param {string} drillId - Drill ID
 * @returns {Promise<void>}
 */
export const deleteDrill = async (drillId) => {
  return await apiClient.delete(`/api/drills/${drillId}`);
};


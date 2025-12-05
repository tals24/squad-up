/**
 * Reporting API
 * Handles all report-related API calls (game reports and scout reports)
 */

import { apiClient } from '@/shared/api/client';

// ===========================================================================
// GAME REPORTS
// ===========================================================================

/**
 * Get all game reports
 * @returns {Promise<Array>} List of all game reports
 */
export const getGameReports = async () => {
  return await apiClient.get('/api/game-reports');
};

/**
 * Get game report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Game report data
 */
export const getGameReportById = async (reportId) => {
  return await apiClient.get(`/api/game-reports/${reportId}`);
};

/**
 * Create new game report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created game report
 */
export const createGameReport = async (reportData) => {
  return await apiClient.post('/api/game-reports', reportData);
};

/**
 * Update game report
 * @param {string} reportId - Report ID
 * @param {Object} reportData - Updated report data
 * @returns {Promise<Object>} Updated game report
 */
export const updateGameReport = async (reportId, reportData) => {
  return await apiClient.put(`/api/game-reports/${reportId}`, reportData);
};

/**
 * Delete game report
 * @param {string} reportId - Report ID
 * @returns {Promise<void>}
 */
export const deleteGameReport = async (reportId) => {
  return await apiClient.delete(`/api/game-reports/${reportId}`);
};

// ===========================================================================
// SCOUT REPORTS
// ===========================================================================

/**
 * Get all scout reports
 * @returns {Promise<Array>} List of all scout reports
 */
export const getScoutReports = async () => {
  return await apiClient.get('/api/scout-reports');
};

/**
 * Get scout report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Scout report data
 */
export const getScoutReportById = async (reportId) => {
  return await apiClient.get(`/api/scout-reports/${reportId}`);
};

/**
 * Create new scout report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created scout report
 */
export const createScoutReport = async (reportData) => {
  return await apiClient.post('/api/scout-reports', reportData);
};

/**
 * Update scout report
 * @param {string} reportId - Report ID
 * @param {Object} reportData - Updated report data
 * @returns {Promise<Object>} Updated scout report
 */
export const updateScoutReport = async (reportId, reportData) => {
  return await apiClient.put(`/api/scout-reports/${reportId}`, reportData);
};

/**
 * Delete scout report
 * @param {string} reportId - Report ID
 * @returns {Promise<void>}
 */
export const deleteScoutReport = async (reportId) => {
  return await apiClient.delete(`/api/scout-reports/${reportId}`);
};

// Legacy alias for backward compatibility
export const createReport = createScoutReport;


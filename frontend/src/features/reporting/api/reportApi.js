/**
 * Reporting API
 * Handles all report-related API calls (game reports and scout reports)
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

// ===========================================================================
// GAME REPORTS
// ===========================================================================

export const getGameReports = async () => {
  return wrapApiCall(() => apiClient.get('/api/game-reports'));
};

export const getGameReportById = async (reportId) => {
  return wrapApiCall(() => apiClient.get(`/api/game-reports/${reportId}`));
};

export const createGameReport = async (reportData) => {
  return wrapApiCall(() => apiClient.post('/api/game-reports', reportData));
};

export const updateGameReport = async (reportId, reportData) => {
  return wrapApiCall(() => apiClient.put(`/api/game-reports/${reportId}`, reportData));
};

export const deleteGameReport = async (reportId) => {
  return wrapApiCall(() => apiClient.delete(`/api/game-reports/${reportId}`));
};

// ===========================================================================
// SCOUT REPORTS
// ===========================================================================

export const getScoutReports = async () => {
  return wrapApiCall(() => apiClient.get('/api/scout-reports'));
};

export const getScoutReportById = async (reportId) => {
  return wrapApiCall(() => apiClient.get(`/api/scout-reports/${reportId}`));
};

export const createScoutReport = async (reportData) => {
  return wrapApiCall(() => apiClient.post('/api/scout-reports', reportData));
};

export const updateScoutReport = async (reportId, reportData) => {
  return wrapApiCall(() => apiClient.put(`/api/scout-reports/${reportId}`, reportData));
};

export const deleteScoutReport = async (reportId) => {
  return wrapApiCall(() => apiClient.delete(`/api/scout-reports/${reportId}`));
};

// Legacy alias for backward compatibility
export const createReport = createScoutReport;


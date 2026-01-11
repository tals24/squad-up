/**
 * Reporting API
 * Handles all report-related API calls (game reports and scout reports)
 */

import { apiClient } from '@/shared/api/client';

// ===========================================================================
// GAME REPORTS
// ===========================================================================

export const getGameReports = async () => {
  return await apiClient.get('/api/game-reports');
};

export const getGameReportById = async (reportId) => {
  return await apiClient.get(`/api/game-reports/${reportId}`);
};

export const createGameReport = async (reportData) => {
  return await apiClient.post('/api/game-reports', reportData);
};

export const updateGameReport = async (reportId, reportData) => {
  return await apiClient.put(`/api/game-reports/${reportId}`, reportData);
};

export const deleteGameReport = async (reportId) => {
  return await apiClient.delete(`/api/game-reports/${reportId}`);
};

// ===========================================================================
// SCOUT REPORTS
// ===========================================================================

export const getScoutReports = async () => {
  return await apiClient.get('/api/scout-reports');
};

export const getScoutReportById = async (reportId) => {
  return await apiClient.get(`/api/scout-reports/${reportId}`);
};

export const createScoutReport = async (reportData) => {
  return await apiClient.post('/api/scout-reports', reportData);
};

export const updateScoutReport = async (reportId, reportData) => {
  return await apiClient.put(`/api/scout-reports/${reportId}`, reportData);
};

export const deleteScoutReport = async (reportId) => {
  return await apiClient.delete(`/api/scout-reports/${reportId}`);
};

// Legacy alias for backward compatibility
export const createReport = createScoutReport;

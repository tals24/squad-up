/**
 * Drill System API
 * Handles all drill-related API calls
 */

import { apiClient } from '@/shared/api/client';

export const getDrills = async () => {
  return await apiClient.get('/api/drills');
};

export const getDrillById = async (drillId) => {
  return await apiClient.get(`/api/drills/${drillId}`);
};

export const createDrill = async (drillData) => {
  return await apiClient.post('/api/drills', drillData);
};

export const updateDrill = async (drillId, drillData) => {
  return await apiClient.put(`/api/drills/${drillId}`, drillData);
};

export const deleteDrill = async (drillId) => {
  return await apiClient.delete(`/api/drills/${drillId}`);
};


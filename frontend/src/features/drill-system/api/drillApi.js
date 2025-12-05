/**
 * Drill System API
 * Handles all drill-related API calls
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

export const getDrills = async () => {
  return wrapApiCall(() => apiClient.get('/api/drills'));
};

export const getDrillById = async (drillId) => {
  return wrapApiCall(() => apiClient.get(`/api/drills/${drillId}`));
};

export const createDrill = async (drillData) => {
  return wrapApiCall(() => apiClient.post('/api/drills', drillData));
};

export const updateDrill = async (drillId, drillData) => {
  return wrapApiCall(() => apiClient.put(`/api/drills/${drillId}`, drillData));
};

export const deleteDrill = async (drillId) => {
  return wrapApiCall(() => apiClient.delete(`/api/drills/${drillId}`));
};


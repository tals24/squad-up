/**
 * Formation API
 * Handles all formation-related API calls
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

export const getFormations = async () => {
  return wrapApiCall(() => apiClient.get('/api/formations'));
};

export const getFormationById = async (formationId) => {
  return wrapApiCall(() => apiClient.get(`/api/formations/${formationId}`));
};

export const createFormation = async (formationData) => {
  return wrapApiCall(() => apiClient.post('/api/formations', formationData));
};

export const updateFormation = async (formationId, formationData) => {
  return wrapApiCall(() => apiClient.put(`/api/formations/${formationId}`, formationData));
};

export const deleteFormation = async (formationId) => {
  return wrapApiCall(() => apiClient.delete(`/api/formations/${formationId}`));
};

// Timeline events (used by TacticBoard)
export const createTimelineEvent = async (eventData) => {
  return wrapApiCall(() => apiClient.post('/api/timeline-events', eventData));
};


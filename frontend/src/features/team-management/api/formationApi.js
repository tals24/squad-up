/**
 * Formation API
 * Handles all formation-related API calls
 */

import { apiClient } from '@/shared/api/client';

export const getFormations = async () => {
  return await apiClient.get('/api/formations');
};

export const getFormationById = async (formationId) => {
  return await apiClient.get(`/api/formations/${formationId}`);
};

export const createFormation = async (formationData) => {
  return await apiClient.post('/api/formations', formationData);
};

export const updateFormation = async (formationId, formationData) => {
  return await apiClient.put(`/api/formations/${formationId}`, formationData);
};

export const deleteFormation = async (formationId) => {
  return await apiClient.delete(`/api/formations/${formationId}`);
};

// Timeline events (used by TacticBoard)
export const createTimelineEvent = async (eventData) => {
  return await apiClient.post('/api/timeline-events', eventData);
};

/**
 * Training Management API
 * Handles all training session-related API calls
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
// TRAINING SESSIONS
// ===========================================================================

export const getTrainingSessions = async () => {
  return wrapApiCall(() => apiClient.get('/api/training-sessions'));
};

export const getTrainingSessionById = async (sessionId) => {
  return wrapApiCall(() => apiClient.get(`/api/training-sessions/${sessionId}`));
};

export const createTrainingSession = async (sessionData) => {
  return wrapApiCall(() => apiClient.post('/api/training-sessions', sessionData));
};

export const updateTrainingSession = async (sessionId, sessionData) => {
  return wrapApiCall(() => apiClient.put(`/api/training-sessions/${sessionId}`, sessionData));
};

export const deleteTrainingSession = async (sessionId) => {
  return wrapApiCall(() => apiClient.delete(`/api/training-sessions/${sessionId}`));
};

// ===========================================================================
// SESSION DRILLS
// ===========================================================================

export const getSessionDrills = async () => {
  return wrapApiCall(() => apiClient.get('/api/session-drills'));
};

export const getSessionDrillById = async (drillId) => {
  return wrapApiCall(() => apiClient.get(`/api/session-drills/${drillId}`));
};

export const createSessionDrill = async (drillData) => {
  return wrapApiCall(() => apiClient.post('/api/session-drills', drillData));
};

export const updateSessionDrill = async (drillId, drillData) => {
  return wrapApiCall(() => apiClient.put(`/api/session-drills/${drillId}`, drillData));
};

export const deleteSessionDrill = async (drillId) => {
  return wrapApiCall(() => apiClient.delete(`/api/session-drills/${drillId}`));
};

// ===========================================================================
// TRAINING PLANS
// ===========================================================================

export const saveTrainingPlan = async (planData) => {
  console.log('Saving training plan to backend...', planData);
  return wrapApiCall(() => apiClient.post('/api/session-drills/batch', planData));
};

export const loadTrainingPlan = async (planData) => {
  console.log('Loading training plan from backend...', planData);
  return wrapApiCall(() => 
    apiClient.get(`/api/session-drills/plan/${planData.teamId}/${planData.weekIdentifier}`)
  );
};


/**
 * Training Management API
 * Handles all training session-related API calls
 */

import { apiClient } from '@/shared/api/client';

// ===========================================================================
// TRAINING SESSIONS
// ===========================================================================

export const getTrainingSessions = async () => {
  return await apiClient.get('/api/training-sessions');
};

export const getTrainingSessionById = async (sessionId) => {
  return await apiClient.get(`/api/training-sessions/${sessionId}`);
};

export const createTrainingSession = async (sessionData) => {
  return await apiClient.post('/api/training-sessions', sessionData);
};

export const updateTrainingSession = async (sessionId, sessionData) => {
  return await apiClient.put(`/api/training-sessions/${sessionId}`, sessionData);
};

export const deleteTrainingSession = async (sessionId) => {
  return await apiClient.delete(`/api/training-sessions/${sessionId}`);
};

// ===========================================================================
// SESSION DRILLS
// ===========================================================================

export const getSessionDrills = async () => {
  return await apiClient.get('/api/session-drills');
};

export const getSessionDrillById = async (drillId) => {
  return await apiClient.get(`/api/session-drills/${drillId}`);
};

export const createSessionDrill = async (drillData) => {
  return await apiClient.post('/api/session-drills', drillData);
};

export const updateSessionDrill = async (drillId, drillData) => {
  return await apiClient.put(`/api/session-drills/${drillId}`, drillData);
};

export const deleteSessionDrill = async (drillId) => {
  return await apiClient.delete(`/api/session-drills/${drillId}`);
};

// ===========================================================================
// TRAINING PLANS
// ===========================================================================

export const saveTrainingPlan = async (planData) => {
  console.log('Saving training plan to backend...', planData);
  return await apiClient.post('/api/session-drills/batch', planData);
};

export const loadTrainingPlan = async (planData) => {
  console.log('Loading training plan from backend...', planData);
  return await apiClient.get(
    `/api/session-drills/plan/${planData.teamId}/${planData.weekIdentifier}`
  );
};

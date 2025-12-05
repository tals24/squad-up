/**
 * Training Management API
 * Handles all training session-related API calls
 */

import { apiClient } from '@/shared/api/client';

// ===========================================================================
// TRAINING SESSIONS
// ===========================================================================

/**
 * Get all training sessions
 * @returns {Promise<Array>} List of all training sessions
 */
export const getTrainingSessions = async () => {
  return await apiClient.get('/api/training-sessions');
};

/**
 * Get training session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Training session data
 */
export const getTrainingSessionById = async (sessionId) => {
  return await apiClient.get(`/api/training-sessions/${sessionId}`);
};

/**
 * Create new training session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created training session
 */
export const createTrainingSession = async (sessionData) => {
  return await apiClient.post('/api/training-sessions', sessionData);
};

/**
 * Update training session
 * @param {string} sessionId - Session ID
 * @param {Object} sessionData - Updated session data
 * @returns {Promise<Object>} Updated training session
 */
export const updateTrainingSession = async (sessionId, sessionData) => {
  return await apiClient.put(`/api/training-sessions/${sessionId}`, sessionData);
};

/**
 * Delete training session
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export const deleteTrainingSession = async (sessionId) => {
  return await apiClient.delete(`/api/training-sessions/${sessionId}`);
};

// ===========================================================================
// SESSION DRILLS
// ===========================================================================

/**
 * Get all session drills
 * @returns {Promise<Array>} List of all session drills
 */
export const getSessionDrills = async () => {
  return await apiClient.get('/api/session-drills');
};

/**
 * Get session drill by ID
 * @param {string} drillId - Drill ID
 * @returns {Promise<Object>} Session drill data
 */
export const getSessionDrillById = async (drillId) => {
  return await apiClient.get(`/api/session-drills/${drillId}`);
};

/**
 * Create new session drill
 * @param {Object} drillData - Drill data
 * @returns {Promise<Object>} Created session drill
 */
export const createSessionDrill = async (drillData) => {
  return await apiClient.post('/api/session-drills', drillData);
};

/**
 * Update session drill
 * @param {string} drillId - Drill ID
 * @param {Object} drillData - Updated drill data
 * @returns {Promise<Object>} Updated session drill
 */
export const updateSessionDrill = async (drillId, drillData) => {
  return await apiClient.put(`/api/session-drills/${drillId}`, drillData);
};

/**
 * Delete session drill
 * @param {string} drillId - Drill ID
 * @returns {Promise<void>}
 */
export const deleteSessionDrill = async (drillId) => {
  return await apiClient.delete(`/api/session-drills/${drillId}`);
};

// ===========================================================================
// TRAINING PLANS
// ===========================================================================

/**
 * Save training plan
 * @param {Object} planData - Plan data
 * @returns {Promise<Object>} Saved training plan
 */
export const saveTrainingPlan = async (planData) => {
  console.log('Saving training plan to backend...', planData);
  return await apiClient.post('/api/session-drills/batch', planData);
};

/**
 * Load training plan
 * @param {Object} planData - Plan query data (teamId, weekIdentifier)
 * @returns {Promise<Object>} Training plan data
 */
export const loadTrainingPlan = async (planData) => {
  console.log('Loading training plan from backend...', planData);
  return await apiClient.get(`/api/session-drills/plan/${planData.teamId}/${planData.weekIdentifier}`);
};


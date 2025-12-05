/**
 * User Management API
 * Handles all user-related API calls
 * 
 * NOTE: These functions return { data, error } format for backward compatibility
 * with existing code. Future versions may use apiClient directly.
 */

import { apiClient } from '@/shared/api/client';

/**
 * Wrapper to convert apiClient format to legacy { data, error } format
 * @private
 */
const wrapApiCall = async (apiCallFn) => {
  try {
    const data = await apiCallFn();
    return { data, error: null };
  } catch (error) {
    console.error('API call error:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get all users
 * @returns {Promise<{data, error}>} Response with data and error
 */
export const getUsers = async () => {
  return wrapApiCall(() => apiClient.get('/api/users'));
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Response with data and error
 */
export const getUserById = async (userId) => {
  return wrapApiCall(() => apiClient.get(`/api/users/${userId}`));
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<{data, error}>} Response with data and error
 */
export const createUser = async (userData) => {
  return wrapApiCall(() => apiClient.post('/api/users', userData));
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<{data, error}>} Response with data and error
 */
export const updateUser = async (userId, userData) => {
  return wrapApiCall(() => apiClient.put(`/api/users/${userId}`, userData));
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<{data, error}>} Response with data and error
 */
export const deleteUser = async (userId) => {
  return wrapApiCall(() => apiClient.delete(`/api/users/${userId}`));
};


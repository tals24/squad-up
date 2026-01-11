/**
 * User Management API
 * Handles all user-related API calls
 */

import { apiClient } from '@/shared/api/client';

/**
 * Get all users
 * @returns {Promise<Object>} Backend response: { success: true, data: [...] }
 */
export const getUsers = async () => {
  return await apiClient.get('/api/users');
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Backend response
 */
export const getUserById = async (userId) => {
  return await apiClient.get(`/api/users/${userId}`);
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Backend response
 */
export const createUser = async (userData) => {
  return await apiClient.post('/api/users', userData);
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Backend response
 */
export const updateUser = async (userId, userData) => {
  return await apiClient.put(`/api/users/${userId}`, userData);
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Backend response
 */
export const deleteUser = async (userId) => {
  return await apiClient.delete(`/api/users/${userId}`);
};

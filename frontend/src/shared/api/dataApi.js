/**
 * Data Aggregation API
 * Handles fetching all data in bulk for the DataProvider
 * 
 * NOTE: This function returns { data, error } format for backward compatibility
 */

import { apiClient } from './client';

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
 * Fetch all tables/data from the backend
 * Used by DataProvider to load all data at once
 * @returns {Promise<{data, error}>} All application data
 */
export const fetchAllTables = async () => {
  console.log('Fetching all data from backend API...');
  return wrapApiCall(() => apiClient.get('/api/data/all'));
};


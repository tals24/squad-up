/**
 * Data Aggregation API
 * Handles fetching all data in bulk for the DataProvider
 */

import { apiClient } from './client';

/**
 * Fetch all tables/data from the backend
 * Used by DataProvider to load all data at once
 * @returns {Promise<Object>} Backend response: { success: true, data: {...} }
 */
export const fetchAllTables = async () => {
  console.log('Fetching all data from backend API...');
  return await apiClient.get('/api/data/all');
};


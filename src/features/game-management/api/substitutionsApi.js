import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch all substitutions for a game
 * @param {string} gameId - The game ID
 * @returns {Promise<Array>} Array of substitutions
 */
export const fetchSubstitutions = async (gameId) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(
    `${API_BASE_URL}/games/${gameId}/substitutions`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Create a new substitution
 * @param {string} gameId - The game ID
 * @param {Object} substitutionData - Substitution data
 * @returns {Promise<Object>} Created substitution
 */
export const createSubstitution = async (gameId, substitutionData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.post(
    `${API_BASE_URL}/games/${gameId}/substitutions`,
    substitutionData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Update an existing substitution
 * @param {string} gameId - The game ID
 * @param {string} subId - The substitution ID
 * @param {Object} substitutionData - Updated substitution data
 * @returns {Promise<Object>} Updated substitution
 */
export const updateSubstitution = async (gameId, subId, substitutionData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.put(
    `${API_BASE_URL}/games/${gameId}/substitutions/${subId}`,
    substitutionData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

/**
 * Delete a substitution
 * @param {string} gameId - The game ID
 * @param {string} subId - The substitution ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteSubstitution = async (gameId, subId) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.delete(
    `${API_BASE_URL}/games/${gameId}/substitutions/${subId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};


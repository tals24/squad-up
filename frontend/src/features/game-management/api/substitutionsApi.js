const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch all substitutions for a game
 */
export const fetchSubstitutions = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/substitutions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch substitutions');
  }

  const data = await response.json();
  return data.substitutions || [];
};

/**
 * Create a new substitution
 */
export const createSubstitution = async (gameId, substitutionData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/substitutions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(substitutionData)
  });

  if (!response.ok) {
    const error = await response.json();
    // Prefer detailed error message if available, fallback to generic message
    throw new Error(error.error || error.message || 'Failed to create substitution');
  }

  const data = await response.json();
  return data.substitution;
};

/**
 * Update an existing substitution
 */
export const updateSubstitution = async (gameId, subId, substitutionData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/substitutions/${subId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(substitutionData)
  });

  if (!response.ok) {
    const error = await response.json();
    // Prefer detailed error message if available, fallback to generic message
    throw new Error(error.error || error.message || 'Failed to update substitution');
  }

  const data = await response.json();
  return data.substitution;
};

/**
 * Delete a substitution
 */
export const deleteSubstitution = async (gameId, subId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/substitutions/${subId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete substitution');
  }

  const data = await response.json();
  return data;
};


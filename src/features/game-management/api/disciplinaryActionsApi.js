const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch all disciplinary actions for a game
 */
export const fetchDisciplinaryActions = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/disciplinary-actions`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch disciplinary actions');
  }

  const data = await response.json();
  return data.actions || [];
};

/**
 * Fetch disciplinary actions for a specific player in a game
 */
export const fetchPlayerDisciplinaryActions = async (gameId, playerId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/disciplinary-actions/player/${playerId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player disciplinary actions');
  }

  const data = await response.json();
  return data.actions || [];
};

/**
 * Create a new disciplinary action
 */
export const createDisciplinaryAction = async (gameId, actionData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/disciplinary-actions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(actionData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create disciplinary action');
  }

  const data = await response.json();
  return data.action;
};

/**
 * Update an existing disciplinary action
 */
export const updateDisciplinaryAction = async (gameId, actionId, actionData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/disciplinary-actions/${actionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(actionData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update disciplinary action');
  }

  const data = await response.json();
  return data.action;
};

/**
 * Delete a disciplinary action
 */
export const deleteDisciplinaryAction = async (gameId, actionId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/disciplinary-actions/${actionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete disciplinary action');
  }

  const data = await response.json();
  return data;
};


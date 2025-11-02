const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch all goals for a game
 */
export const fetchGoals = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/goals`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch goals');
  }

  const data = await response.json();
  return data.goals || [];
};

/**
 * Create a new goal
 */
export const createGoal = async (gameId, goalData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/goals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(goalData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create goal');
  }

  const data = await response.json();
  return data.goal;
};

/**
 * Update an existing goal
 */
export const updateGoal = async (gameId, goalId, goalData) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/goals/${goalId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(goalData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update goal');
  }

  const data = await response.json();
  return data.goal;
};

/**
 * Delete a goal
 */
export const deleteGoal = async (gameId, goalId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/goals/${goalId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete goal');
  }

  return true;
};

/**
 * Fetch goal partnerships analytics
 */
export const fetchGoalPartnerships = async (teamId, season = null) => {
  const url = new URL(`${API_URL}/api/analytics/goal-partnerships`);
  url.searchParams.append('teamId', teamId);
  if (season) {
    url.searchParams.append('season', season);
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch goal partnerships');
  }

  const data = await response.json();
  return data.partnerships || [];
};


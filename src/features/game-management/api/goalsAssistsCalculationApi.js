const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch calculated goals and assists for a game
 * @param {string} gameId - The game ID
 * @returns {Promise<Object>} Map of playerId -> { goals: number, assists: number }
 */
export const fetchCalculatedGoalsAssists = async (gameId) => {
  const response = await fetch(`${API_URL}/api/game-reports/calculate-goals-assists/${gameId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch calculated goals/assists');
  }

  const data = await response.json();
  return data.calculatedStats || {};
};


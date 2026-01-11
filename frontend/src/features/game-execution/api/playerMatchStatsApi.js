const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch all player match stats for a game
 */
export const fetchPlayerMatchStats = async (gameId) => {
  const response = await fetch(`${API_URL}/api/games/${gameId}/player-match-stats`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player match stats');
  }

  const data = await response.json();
  return data.stats || [];
};

/**
 * Fetch player match stats for a specific player in a game
 */
export const fetchPlayerMatchStat = async (gameId, playerId) => {
  const response = await fetch(
    `${API_URL}/api/games/${gameId}/player-match-stats/player/${playerId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Stats don't exist yet
    }
    throw new Error('Failed to fetch player match stats');
  }

  const data = await response.json();
  return data.stats;
};

/**
 * Update or create player match stats (upsert)
 */
export const upsertPlayerMatchStats = async (gameId, playerId, statsData) => {
  const response = await fetch(
    `${API_URL}/api/games/${gameId}/player-match-stats/player/${playerId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statsData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update player match stats');
  }

  const data = await response.json();
  return data.stats;
};

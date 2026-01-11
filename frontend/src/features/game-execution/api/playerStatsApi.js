/**
 * Fetch consolidated player statistics for a game
 * Returns all player stats (minutes, goals, assists) in a single request
 *
 * @param {string} gameId - The game ID
 * @returns {Promise<Object>} { playerId: { minutes: number, goals: number, assists: number } }
 */
export async function fetchPlayerStats(gameId) {
  const response = await fetch(`http://localhost:3001/api/games/${gameId}/player-stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to fetch player stats: ${response.status}`);
  }

  const result = await response.json();
  return result.playerStats; // Return just the playerStats object
}

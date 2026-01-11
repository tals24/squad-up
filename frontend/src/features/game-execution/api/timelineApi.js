/**
 * Timeline API
 * Fetches unified match timeline (Cards, Goals, Substitutions) from backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch unified match timeline for a game
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} Chronologically sorted array of timeline events
 */
export async function fetchMatchTimeline(gameId) {
  try {
    const response = await fetch(`${API_URL}/api/games/${gameId}/timeline`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch timeline: ${response.statusText}`);
    }

    const result = await response.json();
    return result.timeline || [];
  } catch (error) {
    console.error('Error fetching match timeline:', error);
    throw error;
  }
}

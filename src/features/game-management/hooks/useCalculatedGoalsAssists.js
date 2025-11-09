import { useState, useEffect, useMemo } from 'react';
import { fetchCalculatedGoalsAssists } from '../api/goalsAssistsCalculationApi';

/**
 * Custom hook to fetch and manage calculated goals and assists for a game
 * Follows the existing DataProvider pattern (not React Query)
 * 
 * @param {string} gameId - The game ID
 * @param {Object} game - The game object (to check status)
 * @param {Array} goals - Array of goals (for dependency tracking)
 * @returns {Object} { calculatedStats, isLoading, error }
 *   calculatedStats: Map of playerId -> { goals: number, assists: number }
 */
export function useCalculatedGoalsAssists(gameId, game, goals = []) {
  const [calculatedStats, setCalculatedStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only fetch for "Played" games (not "Done" or "Scheduled")
  const shouldFetch = gameId && game?.status === 'Played';

  useEffect(() => {
    if (!shouldFetch) {
      setCalculatedStats({});
      setError(null);
      return;
    }

    // Debounce: Wait 500ms after last goal change before refetching
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const stats = await fetchCalculatedGoalsAssists(gameId);
        setCalculatedStats(stats);
      } catch (err) {
        console.error('Error fetching calculated goals/assists:', err);
        setError(err.message);
        // Don't clear calculatedStats on error - keep previous value
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [gameId, shouldFetch, goals.length]);

  // Memoize result to prevent unnecessary re-renders
  return useMemo(() => ({
    calculatedStats,
    isLoading,
    error
  }), [calculatedStats, isLoading, error]);
}


import { useState, useEffect, useMemo } from 'react';
import { fetchCalculatedMinutes } from '../api/minutesCalculationApi';

/**
 * Custom hook to fetch and manage calculated minutes for a game
 * Follows the existing DataProvider pattern (not React Query)
 * 
 * @param {string} gameId - The game ID
 * @param {Object} game - The game object (to check status)
 * @param {Array} substitutions - Array of substitutions (for dependency tracking)
 * @param {Array} disciplinaryActions - Array of disciplinary actions (for dependency tracking)
 * @returns {Object} { calculatedMinutes, isLoading, error }
 */
export function useCalculatedMinutes(gameId, game, substitutions = [], disciplinaryActions = []) {
  const [calculatedMinutes, setCalculatedMinutes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Only fetch for "Played" games (not "Done" or "Scheduled")
  const shouldFetch = gameId && game?.status === 'Played';

  useEffect(() => {
    if (!shouldFetch) {
      setCalculatedMinutes({});
      setError(null);
      return;
    }

    // Debounce: Wait 500ms after last event change before refetching
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const minutes = await fetchCalculatedMinutes(gameId);
        setCalculatedMinutes(minutes);
      } catch (err) {
        console.error('Error fetching calculated minutes:', err);
        setError(err.message);
        // Don't clear calculatedMinutes on error - keep previous value
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [gameId, shouldFetch, substitutions.length, disciplinaryActions.length]);

  // Memoize result to prevent unnecessary re-renders
  return useMemo(() => ({
    calculatedMinutes,
    isLoading,
    error
  }), [calculatedMinutes, isLoading, error]);
}


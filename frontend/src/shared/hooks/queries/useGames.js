/**
 * React Query Hooks for Games
 * Provides cached, auto-updating game data with smart refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getGames, 
  getGame, 
  createGame, 
  updateGame, 
  deleteGame 
} from '@/features/game-management/api/gameApi';

// Query Keys - Centralized for consistency
export const gameKeys = {
  all: ['games'],
  lists: () => [...gameKeys.all, 'list'],
  list: (filters) => [...gameKeys.lists(), { filters }],
  details: () => [...gameKeys.all, 'detail'],
  detail: (id) => [...gameKeys.details(), id],
};

/**
 * Fetch all games with caching
 * 
 * Benefits:
 * - Cached for 5 minutes (no refetch on navigation)
 * - Background updates when data gets stale
 * - Automatic retry on failure
 * 
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useGames() {
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async () => {
      const response = await getGames();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch games');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single game by ID with caching
 * 
 * @param {string} gameId - Game ID
 * @returns {Object} { data, isLoading, error }
 */
export function useGame(gameId) {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: async () => {
      const response = await getGame(gameId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch game');
      }
      return response.data;
    },
    enabled: !!gameId, // Only fetch if gameId exists
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create game mutation with optimistic updates
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading }
 */
export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      // Invalidate games list to refetch
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

/**
 * Update game mutation with cache update
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading }
 */
export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, data }) => updateGame(gameId, data),
    onSuccess: (data, variables) => {
      // Update specific game in cache
      queryClient.setQueryData(gameKeys.detail(variables.gameId), data.data);
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

/**
 * Delete game mutation
 * 
 * @returns {Object} { mutate, mutateAsync, isLoading }
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
      // Invalidate games list
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}


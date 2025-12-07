/**
 * React Query Hooks for Players
 * Provides cached, auto-updating player data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPlayers, 
  getPlayerById, 
  createPlayer, 
  updatePlayer, 
  deletePlayer 
} from '@/features/player-management/api/playerApi';

// Query Keys
export const playerKeys = {
  all: ['players'],
  lists: () => [...playerKeys.all, 'list'],
  list: (filters) => [...playerKeys.lists(), { filters }],
  details: () => [...playerKeys.all, 'detail'],
  detail: (id) => [...playerKeys.details(), id],
};

/**
 * Fetch all players with caching
 * 
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function usePlayers() {
  return useQuery({
    queryKey: playerKeys.lists(),
    queryFn: async () => {
      const response = await getPlayers();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch players');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single player by ID
 * 
 * @param {string} playerId - Player ID
 * @returns {Object} { data, isLoading, error }
 */
export function usePlayer(playerId) {
  return useQuery({
    queryKey: playerKeys.detail(playerId),
    queryFn: async () => {
      const response = await getPlayerById(playerId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch player');
      }
      return response.data;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create player mutation
 */
export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
    },
  });
}

/**
 * Update player mutation
 */
export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playerId, data }) => updatePlayer(playerId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(playerKeys.detail(variables.playerId), data.data);
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
    },
  });
}

/**
 * Delete player mutation
 */
export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
    },
  });
}


/**
 * React Query Hooks for Teams
 * Provides cached, auto-updating team data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from '@/features/team-management/api/teamApi';

// Query Keys
export const teamKeys = {
  all: ['teams'],
  lists: () => [...teamKeys.all, 'list'],
  list: (filters) => [...teamKeys.lists(), { filters }],
  details: () => [...teamKeys.all, 'detail'],
  detail: (id) => [...teamKeys.details(), id],
};

/**
 * Fetch all teams with caching
 */
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const response = await getTeams();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch teams');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch single team by ID
 */
export function useTeam(teamId) {
  return useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: async () => {
      const response = await getTeamById(teamId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch team');
      }
      return response.data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create team mutation
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * Update team mutation
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }) => updateTeam(teamId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(teamKeys.detail(variables.teamId), data.data);
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

/**
 * Delete team mutation
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

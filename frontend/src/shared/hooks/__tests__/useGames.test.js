/**
 * useGames Hook Tests
 * Tests for React Query game hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGames, useGame, useCreateGame } from '../queries/useGames';
import * as gameApi from '@/features/game-management/api/gameApi';

// Mock the game API
jest.mock('@/features/game-management/api/gameApi');

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useGames Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGames', () => {
    it('should fetch games successfully', async () => {
      const mockGames = {
        success: true,
        data: [
          { _id: '1', opponent: 'Team A' },
          { _id: '2', opponent: 'Team B' },
        ],
      };

      gameApi.getGames.mockResolvedValue(mockGames);

      const { result } = renderHook(() => useGames(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockGames.data);
      expect(gameApi.getGames).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch error', async () => {
      gameApi.getGames.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useGames(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useGame', () => {
    it('should fetch single game by ID', async () => {
      const mockGame = {
        success: true,
        data: { _id: '1', opponent: 'Team A' },
      };

      gameApi.getGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockGame.data);
      expect(gameApi.getGame).toHaveBeenCalledWith('1');
    });

    it('should not fetch if gameId is falsy', () => {
      const { result } = renderHook(() => useGame(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(gameApi.getGame).not.toHaveBeenCalled();
    });
  });

  describe('useCreateGame', () => {
    it('should create a game successfully', async () => {
      const newGame = { opponent: 'Team C', date: '2024-01-03' };
      const mockResponse = {
        success: true,
        data: { _id: '3', ...newGame },
      };

      gameApi.createGame.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateGame(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newGame);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(gameApi.createGame).toHaveBeenCalledWith(newGame);
    });
  });
});


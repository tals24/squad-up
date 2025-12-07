/**
 * Game API Tests
 * Tests for game-related API calls
 */

import { getGames, getGame, createGame, updateGame, deleteGame } from '../api/gameApi';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'fake-token'),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Game API', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
  });

  describe('getGames', () => {
    it('should fetch all games successfully', async () => {
      const mockGames = {
        success: true,
        data: [
          { _id: '1', opponent: 'Team A', date: '2024-01-01' },
          { _id: '2', opponent: 'Team B', date: '2024-01-02' },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGames,
      });

      const result = await getGames();

      expect(result).toEqual(mockGames);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
    });

    it('should throw error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getGames()).rejects.toThrow('Failed to fetch games');
    });
  });

  describe('getGame', () => {
    it('should fetch single game by ID', async () => {
      const mockGame = {
        success: true,
        data: { _id: '1', opponent: 'Team A' },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGame,
      });

      const result = await getGame('1');

      expect(result).toEqual(mockGame);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games/1',
        expect.any(Object)
      );
    });
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      const newGame = { opponent: 'Team C', date: '2024-01-03' };
      const mockResponse = {
        success: true,
        data: { _id: '3', ...newGame },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createGame(newGame);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newGame),
        })
      );
    });
  });

  describe('updateGame', () => {
    it('should update an existing game', async () => {
      const gameId = '1';
      const updates = { opponent: 'Team A Updated' };
      const mockResponse = {
        success: true,
        data: { _id: gameId, ...updates },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateGame(gameId, updates);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/games/${gameId}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });
  });

  describe('deleteGame', () => {
    it('should delete a game', async () => {
      const gameId = '1';
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteGame(gameId);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/games/${gameId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});


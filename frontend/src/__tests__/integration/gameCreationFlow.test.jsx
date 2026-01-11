/**
 * Game Creation Flow - Integration Test
 * Tests the complete flow of creating a game and seeing it in the list
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tantml:tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from '@/app/providers/DataProvider';
import GamesSchedulePage from '@/features/game-scheduling/components/GamesSchedulePage';
import * as gameSchedulingApi from '@/features/game-scheduling/api';
import * as sharedGameApi from '@/shared/api/gameApi';

// Mock APIs
jest.mock('@/features/game-scheduling/api');
jest.mock('@/shared/api/gameApi');

// Test wrapper with all providers
const AllProviders = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DataProvider>{children}</DataProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Game Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock initial games list
    sharedGameApi.getGames.mockResolvedValue({
      success: true,
      data: [
        { _id: '1', opponent: 'Team A', date: '2024-01-01', status: 'Scheduled' },
        { _id: '2', opponent: 'Team B', date: '2024-01-02', status: 'Scheduled' },
      ],
    });
  });

  it('should create game and see it appear in the list', async () => {
    // Render games page
    render(<GamesSchedulePage />, { wrapper: AllProviders });

    // Wait for initial games to load
    await waitFor(() => {
      expect(screen.getByText('vs Team A')).toBeInTheDocument();
    });

    // Mock create game API
    const newGame = {
      _id: '3',
      opponent: 'Real Madrid',
      date: '2024-01-10',
      status: 'Scheduled',
    };

    gameSchedulingApi.createGame.mockResolvedValue({
      success: true,
      data: newGame,
    });

    // Mock updated games list
    sharedGameApi.getGames.mockResolvedValue({
      success: true,
      data: [
        { _id: '1', opponent: 'Team A', date: '2024-01-01', status: 'Scheduled' },
        { _id: '2', opponent: 'Team B', date: '2024-01-02', status: 'Scheduled' },
        newGame,
      ],
    });

    // Click "Add Game" button
    const addButton = screen.getByText(/add game/i);
    fireEvent.click(addButton);

    // Fill in game form
    const opponentInput = screen.getByLabelText(/opponent/i);
    fireEvent.change(opponentInput, { target: { value: 'Real Madrid' } });

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2024-01-10' } });

    // Submit form
    const submitButton = screen.getByText(/create/i);
    fireEvent.click(submitButton);

    // Verify game appears in list
    await waitFor(() => {
      expect(screen.getByText('vs Real Madrid')).toBeInTheDocument();
    });

    // Verify API was called correctly
    expect(gameSchedulingApi.createGame).toHaveBeenCalledWith(
      expect.objectContaining({
        opponent: 'Real Madrid',
        date: '2024-01-10',
      })
    );
  });

  it('should show error message when creation fails', async () => {
    render(<GamesSchedulePage />, { wrapper: AllProviders });

    await waitFor(() => {
      expect(screen.getByText('vs Team A')).toBeInTheDocument();
    });

    // Mock API failure
    gameSchedulingApi.createGame.mockRejectedValue(new Error('Failed to create game'));

    // Try to create game
    fireEvent.click(screen.getByText(/add game/i));
    fireEvent.change(screen.getByLabelText(/opponent/i), {
      target: { value: 'Test Team' },
    });
    fireEvent.click(screen.getByText(/create/i));

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
    });
  });
});

/**
 * GameDetailsPage Integration Tests
 * Safety net for frontend refactor execution plan (Phase 0)
 *
 * Purpose: Verify GameDetailsPage behavior for all three game states
 * Tests user interactions, state management, and API integrations
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { DataProvider } from '@/app/providers/DataProvider';
import GameDetailsPage from '@/features/game-execution/components/GameDetailsPage';
import * as gameApi from '@/shared/api/gameApi';

// Mock API modules
jest.mock('@/features/game-management/api/gameApi');
jest.mock('@/shared/api/client');

// Test wrapper with all providers
const createTestWrapper = (initialRoute = '/game-details?id=game123') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>
        <DataProvider>{children}</DataProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// Mock game data
const mockScheduledGame = {
  _id: 'game123',
  opponent: 'Real Madrid',
  date: '2024-06-15T15:00:00Z',
  status: 'Scheduled',
  location: 'Home',
  lineupDraft: {
    rosters: [
      { playerId: 'p1', status: 'Starting Lineup', position: 'GK' },
      { playerId: 'p2', status: 'Starting Lineup', position: 'CB' },
      { playerId: 'p3', status: 'Bench' },
    ],
    formation: '1-4-4-2',
  },
  team: {
    _id: 't1',
    name: 'FC Barcelona',
  },
};

const mockPlayedGame = {
  ...mockScheduledGame,
  _id: 'game456',
  status: 'Played',
  reportDraft: {
    teamSummary: {
      defense: 'Strong defensive performance',
      midfield: '',
      attack: '',
      general: '',
    },
    ourScore: 3,
    opponentScore: 2,
  },
};

const mockDoneGame = {
  ...mockPlayedGame,
  _id: 'game789',
  status: 'Done',
  ourScore: 3,
  opponentScore: 2,
  matchDuration: 90,
};

const mockPlayers = [
  { _id: 'p1', firstName: 'John', lastName: 'Doe', primaryPosition: 'Goalkeeper' },
  { _id: 'p2', firstName: 'Jane', lastName: 'Smith', primaryPosition: 'Center Back' },
  { _id: 'p3', firstName: 'Bob', lastName: 'Johnson', primaryPosition: 'Midfielder' },
];

describe('GameDetailsPage - Scheduled Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: mockScheduledGame,
    });

    gameApi.getTeamPlayers.mockResolvedValue({
      success: true,
      data: mockPlayers,
    });
  });

  it('should load and display scheduled game', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Verify game header
    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Verify status badge
    expect(screen.getByText(/Scheduled/i)).toBeInTheDocument();

    // Verify tactical board is visible
    const tacticalBoard =
      screen.getByTestId('tactical-board') ||
      screen.getByRole('region', { name: /tactical board/i }) ||
      document.querySelector('.tactical-board');
    expect(tacticalBoard).toBeInTheDocument();
  });

  it('should persist lineup draft on change', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Mock draft save API
    gameApi.saveLineupDraft.mockResolvedValue({ success: true });

    // Simulate changing a player's status
    const playerStatusDropdown = screen.getAllByRole('combobox')[0];
    fireEvent.change(playerStatusDropdown, { target: { value: 'Bench' } });

    // Wait for autosave debounce (2.5s + buffer)
    await waitFor(
      () => {
        expect(gameApi.saveLineupDraft).toHaveBeenCalled();
      },
      { timeout: 4000 }
    );
  });

  it('should validate starting lineup before transition', async () => {
    // Game with invalid lineup (< 11 players)
    const invalidGame = {
      ...mockScheduledGame,
      lineupDraft: {
        rosters: [
          { playerId: 'p1', status: 'Starting Lineup', position: 'GK' },
          { playerId: 'p2', status: 'Starting Lineup', position: 'CB' },
          // Only 2 players - should fail validation
        ],
        formation: '1-4-4-2',
      },
    };

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: invalidGame,
    });

    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Try to transition to "Played"
    const playedButton = screen.getByText(/Game Was Played|Mark as Played/i);
    fireEvent.click(playedButton);

    // Verify validation error appears
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Invalid Starting Lineup|Must have exactly 11 players|Missing players/i
      );
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify transition API was NOT called
    expect(gameApi.startGame).not.toHaveBeenCalled();
  });

  it('should transition to Played when lineup is valid', async () => {
    // Game with valid 11-player lineup
    const validGame = {
      ...mockScheduledGame,
      lineupDraft: {
        rosters: [
          { playerId: 'p1', status: 'Starting Lineup', position: 'GK' },
          { playerId: 'p2', status: 'Starting Lineup', position: 'CB' },
          { playerId: 'p3', status: 'Starting Lineup', position: 'CB' },
          { playerId: 'p4', status: 'Starting Lineup', position: 'LB' },
          { playerId: 'p5', status: 'Starting Lineup', position: 'RB' },
          { playerId: 'p6', status: 'Starting Lineup', position: 'CDM' },
          { playerId: 'p7', status: 'Starting Lineup', position: 'CM' },
          { playerId: 'p8', status: 'Starting Lineup', position: 'CM' },
          { playerId: 'p9', status: 'Starting Lineup', position: 'LW' },
          { playerId: 'p10', status: 'Starting Lineup', position: 'RW' },
          { playerId: 'p11', status: 'Starting Lineup', position: 'ST' },
        ],
        formation: '1-4-3-3',
      },
    };

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: validGame,
    });

    gameApi.startGame.mockResolvedValue({
      success: true,
      data: { ...validGame, status: 'Played' },
    });

    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Click transition button
    const playedButton = screen.getByText(/Game Was Played|Mark as Played/i);
    fireEvent.click(playedButton);

    // Confirm any confirmation dialog
    const confirmButton = await screen.findByText(/Confirm|Yes|Continue/i);
    fireEvent.click(confirmButton);

    // Verify API was called
    await waitFor(() => {
      expect(gameApi.startGame).toHaveBeenCalledWith('game123', expect.any(Object));
    });
  });
});

describe('GameDetailsPage - Played Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: mockPlayedGame,
    });

    gameApi.getGameGoals.mockResolvedValue({ success: true, data: [] });
    gameApi.getGameSubstitutions.mockResolvedValue({ success: true, data: [] });
    gameApi.getGameCards.mockResolvedValue({ success: true, data: [] });
    gameApi.getPlayerStats.mockResolvedValue({ success: true, data: [] });
    gameApi.getGameTimeline.mockResolvedValue({ success: true, data: [] });
  });

  it('should load and display played game', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Verify game loads
    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Verify status is "Played"
    expect(screen.getByText(/Played/i)).toBeInTheDocument();

    // Verify events section visible
    expect(screen.getByText(/Goals|Match Events|Timeline/i)).toBeInTheDocument();
  });

  it('should open goal dialog', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Click add goal button
    const addGoalButton = screen.getByText(/\+ Goal|Add Goal/i);
    fireEvent.click(addGoalButton);

    // Verify dialog opens
    await waitFor(() => {
      const dialog = screen.getByRole('dialog') || screen.getByTestId('goal-dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Verify dialog has goal form fields
    expect(screen.getByLabelText(/Scorer|Player/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minute/i)).toBeInTheDocument();
  });

  it('should save goal and update timeline', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Mock save goal API
    gameApi.createGoal.mockResolvedValue({
      success: true,
      data: { _id: 'goal1', scorer: 'p1', minute: 23, type: 'Open Play' },
    });

    // Refresh timeline after save
    gameApi.getGameTimeline.mockResolvedValue({
      success: true,
      data: [{ type: 'goal', minute: 23, player: 'John Doe' }],
    });

    // Open goal dialog
    fireEvent.click(screen.getByText(/\+ Goal|Add Goal/i));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in goal form
    const scorerSelect = screen.getByLabelText(/Scorer|Player/i);
    fireEvent.change(scorerSelect, { target: { value: 'p1' } });

    const minuteInput = screen.getByLabelText(/Minute/i);
    fireEvent.change(minuteInput, { target: { value: '23' } });

    // Submit form
    const saveButton = screen.getByText(/Save|Add/i);
    fireEvent.click(saveButton);

    // Verify API was called
    await waitFor(() => {
      expect(gameApi.createGoal).toHaveBeenCalledWith(
        'game456',
        expect.objectContaining({
          scorer: 'p1',
          minute: 23,
        })
      );
    });

    // Verify timeline refreshes
    await waitFor(() => {
      expect(gameApi.getGameTimeline).toHaveBeenCalled();
    });
  });

  it('should open player performance dialog', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Click on a player card
    const playerCard =
      screen.getByText(/John Doe/i).closest('[data-testid="player-card"]') ||
      screen.getByText(/John Doe/i).closest('.player-card') ||
      screen.getByText(/John Doe/i);

    fireEvent.click(playerCard);

    // Verify performance dialog opens
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Performance|Report/i)).toBeInTheDocument();
    });

    // Verify rating fields exist
    expect(screen.getByLabelText(/Physical|Rating/i)).toBeInTheDocument();
  });

  it('should persist report draft on change', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Mock draft save API
    gameApi.saveReportDraft.mockResolvedValue({ success: true });

    // Open team summary dialog
    const defenseSummaryButton = screen.getByText(/Defense Summary/i);
    fireEvent.click(defenseSummaryButton);

    // Fill in summary
    const summaryTextarea = await screen.findByRole('textbox');
    fireEvent.change(summaryTextarea, { target: { value: 'Great defense!' } });

    // Save dialog
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);

    // Wait for autosave debounce
    await waitFor(
      () => {
        expect(gameApi.saveReportDraft).toHaveBeenCalled();
      },
      { timeout: 4000 }
    );
  });

  it('should validate team summaries before final submission', async () => {
    // Game with incomplete report (missing summaries)
    const incompleteGame = {
      ...mockPlayedGame,
      reportDraft: {
        teamSummary: {
          defense: 'Good',
          midfield: '', // Missing
          attack: '', // Missing
          general: '', // Missing
        },
      },
    };

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: incompleteGame,
    });

    const Wrapper = createTestWrapper('/game-details?id=game456');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Try to submit final report
    const submitButton = screen.getByText(/Submit Final Report|Finalize/i);
    fireEvent.click(submitButton);

    // Verify validation error
    await waitFor(() => {
      expect(
        screen.getByText(/All team summaries|Complete all summaries|Missing summaries/i)
      ).toBeInTheDocument();
    });

    // Verify submit API was NOT called
    expect(gameApi.finalizeGame).not.toHaveBeenCalled();
  });
});

describe('GameDetailsPage - Done Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: mockDoneGame,
    });

    gameApi.getGameGoals.mockResolvedValue({ success: true, data: [] });
    gameApi.getGameSubstitutions.mockResolvedValue({ success: true, data: [] });
    gameApi.getGameCards.mockResolvedValue({ success: true, data: [] });
    gameApi.getPlayerReports.mockResolvedValue({ success: true, data: [] });
  });

  it('should load and display done game in read-only mode', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game789');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Verify game loads
    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Verify status is "Done"
    expect(screen.getByText(/Done|Finalized|Completed/i)).toBeInTheDocument();

    // Verify final score is displayed
    expect(screen.getByText(/3.*2|3-2/)).toBeInTheDocument();
  });

  it('should not show Submit Final Report button', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game789');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Verify no submit button
    const submitButton = screen.queryByText(/Submit Final Report|Finalize/i);
    expect(submitButton).not.toBeInTheDocument();
  });

  it('should open player dialog in read-only mode', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game789');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Click on player
    const playerCard = screen.getByText(/John Doe/i);
    fireEvent.click(playerCard);

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify input fields are read-only
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('readonly', '');
      // OR: expect(input).toBeDisabled();
    });
  });

  it('should not allow adding events in done game', async () => {
    const Wrapper = createTestWrapper('/game-details?id=game789');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Verify event buttons are disabled or hidden
    const addGoalButton = screen.queryByText(/\+ Goal|Add Goal/i);
    if (addGoalButton) {
      expect(addGoalButton).toBeDisabled();
    }
  });
});

describe('GameDetailsPage - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle game not found', async () => {
    gameApi.getGameById.mockRejectedValue(new Error('Game not found'));

    const Wrapper = createTestWrapper('/game-details?id=invalid');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Game not found|Error loading game|Not found/i)).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    gameApi.getGameById.mockRejectedValue(new Error('Network error'));

    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Verify error state (no crash)
    await waitFor(() => {
      expect(screen.getByText(/Error|Failed to load|Something went wrong/i)).toBeInTheDocument();
    });
  });

  it('should handle missing lineup draft gracefully', async () => {
    const gameWithoutDraft = {
      ...mockScheduledGame,
      lineupDraft: null, // No draft saved yet
    };

    gameApi.getGameById.mockResolvedValue({
      success: true,
      data: gameWithoutDraft,
    });

    const Wrapper = createTestWrapper('/game-details?id=game123');
    render(<GameDetailsPage />, { wrapper: Wrapper });

    // Should render without crash
    await waitFor(() => {
      expect(screen.getByText(/Real Madrid/i)).toBeInTheDocument();
    });

    // Should show empty formation
    expect(screen.getByTestId('tactical-board')).toBeInTheDocument();
  });
});

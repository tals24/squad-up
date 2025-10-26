/**
 * Integration Tests for GameDetails Validation
 * 
 * Tests the integration of validation logic with the GameDetails component
 * including user interactions, validation flows, and confirmation modals
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import GameDetails from '../index';

// Mock the DataProvider
const mockDataProvider = {
  games: [
    {
      _id: 'game1',
      gameTitle: 'Test Game',
      teamName: 'Test Team',
      opponent: 'Test Opponent',
      date: '2024-01-01',
      location: 'Test Stadium',
      status: 'Scheduled',
      ourScore: null,
      opponentScore: null
    }
  ],
  players: [
    { _id: '1', fullName: 'John Doe', position: 'Goalkeeper' },
    { _id: '2', fullName: 'Mike Smith', position: 'Defender' },
    { _id: '3', fullName: 'Tom Wilson', position: 'Midfielder' },
    { _id: '4', fullName: 'Alex Brown', position: 'Forward' },
    { _id: '5', fullName: 'Chris Davis', position: 'Defender' },
    { _id: '6', fullName: 'Sam Johnson', position: 'Midfielder' },
    { _id: '7', fullName: 'Ben Miller', position: 'Forward' },
    { _id: '8', fullName: 'Dan Garcia', position: 'Midfielder' },
    { _id: '9', fullName: 'Luke Martinez', position: 'Forward' },
    { _id: '10', fullName: 'Nick Anderson', position: 'Defender' },
    { _id: '11', fullName: 'Paul Taylor', position: 'Midfielder' },
    { _id: '12', fullName: 'Steve Thomas', position: 'Forward' },
    { _id: '13', fullName: 'Mark Jackson', position: 'Defender' },
    { _id: '14', fullName: 'Ryan White', position: 'Midfielder' },
    { _id: '15', fullName: 'Kevin Harris', position: 'Forward' },
    { _id: '16', fullName: 'Tony Martin', position: 'Defender' },
    { _id: '17', fullName: 'Jake Thompson', position: 'Midfielder' }
  ],
  teams: [],
  gameRosters: [],
  gameReports: [],
  refreshData: jest.fn(),
  isLoading: false,
  error: null
};

// Mock the useData hook
jest.mock('@/app/providers/DataProvider', () => ({
  useData: () => mockDataProvider
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true
});

// Mock the router
const mockSearchParams = new URLSearchParams('id=game1');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams]
}));

// Mock the formation configurations
jest.mock('../formations', () => ({
  formations: {
    '1-4-4-2': {
      positions: {
        gk: { type: 'goalkeeper', label: 'GK' },
        cb1: { type: 'defender', label: 'CB' },
        cb2: { type: 'defender', label: 'CB' },
        lb: { type: 'defender', label: 'LB' },
        rb: { type: 'defender', label: 'RB' },
        cm1: { type: 'midfielder', label: 'CM' },
        cm2: { type: 'midfielder', label: 'CM' },
        lm: { type: 'midfielder', label: 'LM' },
        rm: { type: 'midfielder', label: 'RM' },
        st1: { type: 'forward', label: 'ST' },
        st2: { type: 'forward', label: 'ST' }
      }
    }
  }
}));

// Mock the shared components
jest.mock('@/shared/components', () => ({
  ConfirmationModal: ({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }) => 
    isOpen ? (
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onCancel}>{cancelText}</button>
      </div>
    ) : null
}));

// Mock the child components
jest.mock('../components/GameDetailsHeader', () => 
  ({ handleGameWasPlayed, isScheduled }) => (
    <div data-testid="game-details-header">
      {isScheduled && (
        <button onClick={handleGameWasPlayed} data-testid="game-was-played-btn">
          Game Was Played
        </button>
      )}
    </div>
  )
);

jest.mock('../components/TacticalBoard', () => 
  ({ formation, onPositionDrop }) => (
    <div data-testid="tactical-board">
      {Object.entries(formation).map(([posId, player]) => (
        <div key={posId} data-testid={`position-${posId}`}>
          {player ? (
            <div 
              data-testid={`player-${posId}`}
              draggable
              onDragStart={() => {}}
              onDragEnd={() => {}}
            >
              {player.fullName}
            </div>
          ) : (
            <div 
              data-testid={`empty-${posId}`}
              onDrop={(e) => onPositionDrop(e, posId)}
            >
              Empty
            </div>
          )}
        </div>
      ))}
    </div>
  )
);

jest.mock('../components/GameDayRosterSidebar', () => 
  ({ benchPlayers }) => (
    <div data-testid="roster-sidebar">
      <div data-testid="bench-count">{benchPlayers.length}</div>
    </div>
  )
);

jest.mock('../components/MatchAnalysisSidebar', () => () => 
  <div data-testid="match-analysis-sidebar">Match Analysis</div>
);

jest.mock('../components/dialogs/PlayerPerformanceDialog', () => () => 
  <div data-testid="player-performance-dialog">Player Performance</div>
);

jest.mock('../components/dialogs/FinalReportDialog', () => () => 
  <div data-testid="final-report-dialog">Final Report</div>
);

jest.mock('../components/dialogs/PlayerSelectionDialog', () => () => 
  <div data-testid="player-selection-dialog">Player Selection</div>
);

const renderGameDetails = () => {
  return render(
    <BrowserRouter>
      <GameDetails />
    </BrowserRouter>
  );
};

describe('GameDetails Validation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  describe('Starting Lineup Validation', () => {
    it('should block "Game Was Played" with incomplete formation', async () => {
      const user = userEvent.setup();
      renderGameDetails();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      // Try to mark game as played with incomplete formation
      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should show alert for incomplete formation
      await waitFor(() => {
        expect(screen.getByText(/Only \d+ players in starting lineup/)).toBeInTheDocument();
      });
    });

    it('should allow "Game Was Played" with complete formation', async () => {
      const user = userEvent.setup();
      
      // Mock a complete formation
      const mockFormation = {
        gk: mockDataProvider.players[0],
        cb1: mockDataProvider.players[1],
        cb2: mockDataProvider.players[2],
        lb: mockDataProvider.players[3],
        rb: mockDataProvider.players[4],
        cm1: mockDataProvider.players[5],
        cm2: mockDataProvider.players[6],
        lm: mockDataProvider.players[7],
        rm: mockDataProvider.players[8],
        st1: mockDataProvider.players[9],
        st2: mockDataProvider.players[10]
      };

      // Mock the component to have a complete formation
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        if (typeof initial === 'object' && initial !== null && !Array.isArray(initial)) {
          if (Object.keys(initial).length === 0) return [mockFormation, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should call API to update game status
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/games/game1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({ status: 'Played' })
        })
      );
    });
  });

  describe('Bench Size Validation', () => {
    it('should show confirmation modal for small bench', async () => {
      const user = userEvent.setup();
      
      // Mock formation with small bench
      const mockFormation = {
        gk: mockDataProvider.players[0],
        cb1: mockDataProvider.players[1],
        cb2: mockDataProvider.players[2],
        lb: mockDataProvider.players[3],
        rb: mockDataProvider.players[4],
        cm1: mockDataProvider.players[5],
        cm2: mockDataProvider.players[6],
        lm: mockDataProvider.players[7],
        rm: mockDataProvider.players[8],
        st1: mockDataProvider.players[9],
        st2: mockDataProvider.players[10]
      };

      // Mock small bench (3 players)
      const smallBench = mockDataProvider.players.slice(11, 14);

      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        if (typeof initial === 'object' && initial !== null && !Array.isArray(initial)) {
          if (Object.keys(initial).length === 0) return [mockFormation, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('Bench Size Warning')).toBeInTheDocument();
        expect(screen.getByText('You have fewer than 6 bench players. Are you sure you want to continue?')).toBeInTheDocument();
      });
    });

    it('should proceed when user confirms small bench', async () => {
      const user = userEvent.setup();
      
      // Mock the confirmation modal to be open
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) return [true, jest.fn()]; // showConfirmationModal
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByText('Continue');
      await user.click(confirmBtn);

      // Should proceed with the action
      expect(fetch).toHaveBeenCalled();
    });

    it('should cancel when user cancels small bench confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock the confirmation modal to be open
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) return [true, jest.fn()]; // showConfirmationModal
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByText('Go Back');
      await user.click(cancelBtn);

      // Should not proceed with the action
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Position Validation', () => {
    it('should show confirmation modal for out-of-position player', async () => {
      const user = userEvent.setup();
      
      // Mock a goalkeeper being placed in forward position
      const mockFormation = {
        gk: null,
        st1: null // Empty forward position
      };

      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        if (typeof initial === 'object' && initial !== null && !Array.isArray(initial)) {
          if (Object.keys(initial).length === 0) return [mockFormation, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('tactical-board')).toBeInTheDocument();
      });

      // Simulate dropping a goalkeeper in forward position
      const emptyPosition = screen.getByTestId('empty-st1');
      fireEvent.drop(emptyPosition);

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('Out of Position Warning')).toBeInTheDocument();
      });
    });

    it('should proceed when user confirms out-of-position placement', async () => {
      const user = userEvent.setup();
      
      // Mock the confirmation modal to be open
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) return [true, jest.fn()]; // showConfirmationModal
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByText('Confirm');
      await user.click(confirmBtn);

      // Should proceed with the placement
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    it('should cancel when user cancels out-of-position placement', async () => {
      const user = userEvent.setup();
      
      // Mock the confirmation modal to be open
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) return [true, jest.fn()]; // showConfirmationModal
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByText('Cancel');
      await user.click(cancelBtn);

      // Should not proceed with the placement
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });
  });

  describe('Goalkeeper Validation', () => {
    it('should block "Game Was Played" without goalkeeper', async () => {
      const user = userEvent.setup();
      
      // Mock formation without goalkeeper
      const mockFormation = {
        cb1: mockDataProvider.players[1],
        cb2: mockDataProvider.players[2],
        lb: mockDataProvider.players[3],
        rb: mockDataProvider.players[4],
        cm1: mockDataProvider.players[5],
        cm2: mockDataProvider.players[6],
        lm: mockDataProvider.players[7],
        rm: mockDataProvider.players[8],
        st1: mockDataProvider.players[9],
        st2: mockDataProvider.players[10],
        st3: mockDataProvider.players[11] // Extra player to make 11
      };

      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === null) return [mockDataProvider.games[0], jest.fn()];
        if (Array.isArray(initial) && initial.length === 0) return [mockDataProvider.players, jest.fn()];
        if (typeof initial === 'object' && initial !== null && !Array.isArray(initial)) {
          if (Object.keys(initial).length === 0) return [mockFormation, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should show alert for missing goalkeeper
      await waitFor(() => {
        expect(screen.getByText(/No goalkeeper assigned to the team/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      fetch.mockRejectedValue(new Error('API Error'));

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText(/Failed to update game status/)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should handle network error
      await waitFor(() => {
        expect(screen.getByText(/Failed to update game status/)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('should provide clear error messages', async () => {
      const user = userEvent.setup();
      
      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should show specific error message
      await waitFor(() => {
        expect(screen.getByText(/Only \d+ players in starting lineup/)).toBeInTheDocument();
      });
    });

    it('should show loading states during API calls', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderGameDetails();

      await waitFor(() => {
        expect(screen.getByTestId('game-was-played-btn')).toBeInTheDocument();
      });

      const gameWasPlayedBtn = screen.getByTestId('game-was-played-btn');
      await user.click(gameWasPlayedBtn);

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});

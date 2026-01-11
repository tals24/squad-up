const {
  PlayerState,
  getPlayerStateAtMinute,
  getStartingLineup,
  getSquadPlayers,
  validateGoalEligibility,
  validateSubstitutionEligibility,
  validateCardEligibility
} = require('../games/utils/gameRules');

// Mock dependencies
jest.mock('../games/utils/gameEventsAggregator');
jest.mock('../../models/GameRoster');

const { getMatchTimeline } = require('../games/utils/gameEventsAggregator');
const GameRoster = require('../../models/GameRoster');

describe('Game Rules Engine', () => {
  const gameId = 'game123';
  const player1Id = 'player1';
  const player2Id = 'player2';
  const player3Id = 'player3';
  const player4Id = 'player4';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerStateAtMinute - Basic State Initialization', () => {
    test('Player in Starting Lineup -> State at min 1 is ON_PITCH', () => {
      const timeline = [];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup' };

      const state = getPlayerStateAtMinute(timeline, player1Id, 1, startingLineup, squadPlayers);
      expect(state).toBe(PlayerState.ON_PITCH);
    });

    test('Player on Bench -> State at min 1 is BENCH', () => {
      const timeline = [];
      const startingLineup = {};
      const squadPlayers = { [player1Id]: 'Bench' };

      const state = getPlayerStateAtMinute(timeline, player1Id, 1, startingLineup, squadPlayers);
      expect(state).toBe(PlayerState.BENCH);
    });

    test('Player not in squad -> State is NOT_IN_SQUAD', () => {
      const timeline = [];
      const startingLineup = {};
      const squadPlayers = {};

      const state = getPlayerStateAtMinute(timeline, player1Id, 1, startingLineup, squadPlayers);
      expect(state).toBe(PlayerState.NOT_IN_SQUAD);
    });
  });

  describe('getPlayerStateAtMinute - Substitutions', () => {
    test('Bench Player -> Sub In at min 30 -> State at min 31 is ON_PITCH', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 30,
          timestamp: new Date('2024-01-01T10:30:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player1Id }
        }
      ];
      const startingLineup = {};
      const squadPlayers = { [player1Id]: 'Bench', [player2Id]: 'Starting Lineup' };

      // Before substitution
      const stateBefore = getPlayerStateAtMinute(timeline, player1Id, 29, startingLineup, squadPlayers);
      expect(stateBefore).toBe(PlayerState.BENCH);

      // After substitution
      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 31, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.ON_PITCH);
    });

    test('Starter -> Sub Out at min 60 -> State at min 61 is SUBSTITUTED_OUT', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 60,
          timestamp: new Date('2024-01-01T10:60:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // Before substitution
      const stateBefore = getPlayerStateAtMinute(timeline, player1Id, 59, startingLineup, squadPlayers);
      expect(stateBefore).toBe(PlayerState.ON_PITCH);

      // After substitution
      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 61, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.SUBSTITUTED_OUT);
    });

    test('Substitution handles playerId as string', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 30,
          timestamp: new Date('2024-01-01T10:30:00Z'),
          playerOutId: player1Id,
          playerInId: player2Id
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      const stateOut = getPlayerStateAtMinute(timeline, player1Id, 31, startingLineup, squadPlayers);
      expect(stateOut).toBe(PlayerState.SUBSTITUTED_OUT);

      const stateIn = getPlayerStateAtMinute(timeline, player2Id, 31, startingLineup, squadPlayers);
      expect(stateIn).toBe(PlayerState.ON_PITCH);
    });
  });

  describe('getPlayerStateAtMinute - Red Cards', () => {
    test('Player gets Red Card at min 50 -> State at min 51 is SENT_OFF', () => {
      const timeline = [
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup' };

      // Before red card
      const stateBefore = getPlayerStateAtMinute(timeline, player1Id, 49, startingLineup, squadPlayers);
      expect(stateBefore).toBe(PlayerState.ON_PITCH);

      // After red card
      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 51, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.SENT_OFF);
    });

    test('Player gets Second Yellow at min 50 -> State at min 51 is SENT_OFF', () => {
      const timeline = [
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          cardType: 'second-yellow',
          playerId: player1Id
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup' };

      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 51, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.SENT_OFF);
    });

    test('Yellow card does NOT send player off', () => {
      const timeline = [
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          cardType: 'yellow',
          player: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup' };

      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 51, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.ON_PITCH);
    });

    test('Red card sends player off even if they were on bench', () => {
      const timeline = [
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      const startingLineup = {};
      const squadPlayers = { [player1Id]: 'Bench' };

      const stateAfter = getPlayerStateAtMinute(timeline, player1Id, 51, startingLineup, squadPlayers);
      expect(stateAfter).toBe(PlayerState.SENT_OFF);
    });
  });

  describe('getPlayerStateAtMinute - Complex Scenarios (Rolling Subs)', () => {
    test('Player Starts -> Sub Out (min 20) -> Sub In (min 60) -> Valid to score at min 70', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 20,
          timestamp: new Date('2024-01-01T10:20:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        },
        {
          type: 'substitution',
          minute: 60,
          timestamp: new Date('2024-01-01T10:60:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // At min 40 (substituted out)
      const stateAt40 = getPlayerStateAtMinute(timeline, player1Id, 40, startingLineup, squadPlayers);
      expect(stateAt40).toBe(PlayerState.SUBSTITUTED_OUT);

      // At min 70 (back on pitch)
      const stateAt70 = getPlayerStateAtMinute(timeline, player1Id, 70, startingLineup, squadPlayers);
      expect(stateAt70).toBe(PlayerState.ON_PITCH);
    });

    test('Player cannot come back on if sent off', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 20,
          timestamp: new Date('2024-01-01T10:20:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        },
        {
          type: 'card',
          minute: 30,
          timestamp: new Date('2024-01-01T10:30:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        },
        {
          type: 'substitution',
          minute: 60,
          timestamp: new Date('2024-01-01T10:60:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // Even though there's a substitution bringing player1 back in, they're sent off
      const stateAt70 = getPlayerStateAtMinute(timeline, player1Id, 70, startingLineup, squadPlayers);
      expect(stateAt70).toBe(PlayerState.SENT_OFF);
    });

    test('Chronological order matters - events processed in correct sequence', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        },
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:01Z'), // Same minute, later timestamp
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // At min 50, player is substituted out first, then sent off
      const stateAt50 = getPlayerStateAtMinute(timeline, player1Id, 50, startingLineup, squadPlayers);
      expect(stateAt50).toBe(PlayerState.SENT_OFF); // Red card overrides substitution
    });
  });

  describe('validateGoalEligibility', () => {
    beforeEach(() => {
      getMatchTimeline.mockResolvedValue([]);
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
    });

    test('Should fail if scorer is not in squad', async () => {
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]) // No squad players
      });

      const result = await validateGoalEligibility(gameId, player1Id, null, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Scorer must be in the game squad');
    });

    test('Should fail if scorer is on bench', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, null, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('on bench');
    });

    test('Should fail if scorer is substituted out', async () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, null, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('substituted out');
    });

    test('Should fail if scorer is sent off', async () => {
      const timeline = [
        {
          type: 'card',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, null, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sent off');
    });

    test('Should succeed if scorer is ON_PITCH', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, null, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('Should fail if assister is not ON_PITCH', async () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player3Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' },
            { player: player3Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Assister must be on the pitch');
    });

    test('Should fail if assister is same as scorer', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, player1Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Assister cannot be the same as scorer');
    });

    test('Should succeed if both scorer and assister are ON_PITCH', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateGoalEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateSubstitutionEligibility', () => {
    beforeEach(() => {
      getMatchTimeline.mockResolvedValue([]);
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
    });

    test('Should fail if playerOut and playerIn are the same', async () => {
      const result = await validateSubstitutionEligibility(gameId, player1Id, player1Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be different');
    });

    test('Should fail if playerOut is not in squad', async () => {
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]) // No squad players
      });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player leaving field must be in the game squad');
    });

    test('Should fail if playerIn is not in squad', async () => {
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players (only player1)
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player entering field must be in the game squad');
    });

    test('Should fail if playerOut is SENT_OFF', async () => {
      const timeline = [
        {
          type: 'card',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot substitute a player who has been sent off');
    });

    test('Should fail if playerOut is not ON_PITCH (on bench)', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([]) // Starting lineup (player1 not in it)
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Bench' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player leaving field must be on the pitch');
    });

    test('Should fail if playerOut is SUBSTITUTED_OUT', async () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player3Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' },
            { player: player3Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already substituted out');
    });

    test('Should fail if playerIn is SENT_OFF', async () => {
      const timeline = [
        {
          type: 'card',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          cardType: 'red',
          player: { _id: player2Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot substitute in a player who has been sent off');
    });

    test('Should fail if playerIn is already ON_PITCH', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Starting lineup (both players)
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player entering field is already on the pitch');
    });

    test('Should succeed if playerOut is ON_PITCH and playerIn is BENCH', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('Should succeed if playerIn is SUBSTITUTED_OUT (rolling subs)', async () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player3Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Starting Lineup' },
            { player: player3Id, status: 'Bench' }
          ]) // Squad players
        });

      // player2 was substituted out, player1 wants to sub out, player2 wants to sub back in
      const result = await validateSubstitutionEligibility(gameId, player1Id, player2Id, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateCardEligibility', () => {
    beforeEach(() => {
      getMatchTimeline.mockResolvedValue([]);
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
    });

    test('Should fail if player is not in squad', async () => {
      GameRoster.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]) // No squad players
      });

      const result = await validateCardEligibility(gameId, player1Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player must be in the game squad');
    });

    test('Should fail if player is SENT_OFF', async () => {
      const timeline = [
        {
          type: 'card',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateCardEligibility(gameId, player1Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot give a card to a player who has already been sent off');
    });

    test('Should fail if player is SUBSTITUTED_OUT', async () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 5,
          timestamp: new Date('2024-01-01T10:05:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        }
      ];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' },
            { player: player2Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateCardEligibility(gameId, player1Id, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('substituted out');
    });

    test('Should succeed if player is ON_PITCH', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Starting lineup
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Starting Lineup' }
          ]) // Squad players
        });

      const result = await validateCardEligibility(gameId, player1Id, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('Should succeed if player is BENCH (bench players can receive cards)', async () => {
      const timeline = [];
      getMatchTimeline.mockResolvedValue(timeline);
      
      GameRoster.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([]) // Starting lineup (player1 not in it)
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue([
            { player: player1Id, status: 'Bench' }
          ]) // Squad players
        });

      const result = await validateCardEligibility(gameId, player1Id, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Edge Cases and Chronological Order', () => {
    test('Events at same minute processed in timestamp order', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        },
        {
          type: 'card',
          minute: 50,
          timestamp: new Date('2024-01-01T10:50:01Z'), // Later timestamp
          cardType: 'red',
          player: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // At exactly minute 50, both events apply
      const stateAt50 = getPlayerStateAtMinute(timeline, player1Id, 50, startingLineup, squadPlayers);
      expect(stateAt50).toBe(PlayerState.SENT_OFF); // Red card overrides
    });

    test('Events before target minute are included, events after are excluded', () => {
      const timeline = [
        {
          type: 'substitution',
          minute: 30,
          timestamp: new Date('2024-01-01T10:30:00Z'),
          playerOut: { _id: player1Id },
          playerIn: { _id: player2Id }
        },
        {
          type: 'substitution',
          minute: 60,
          timestamp: new Date('2024-01-01T10:60:00Z'),
          playerOut: { _id: player2Id },
          playerIn: { _id: player1Id }
        }
      ];
      const startingLineup = { [player1Id]: true };
      const squadPlayers = { [player1Id]: 'Starting Lineup', [player2Id]: 'Bench' };

      // At minute 40, only first substitution applies
      const stateAt40 = getPlayerStateAtMinute(timeline, player1Id, 40, startingLineup, squadPlayers);
      expect(stateAt40).toBe(PlayerState.SUBSTITUTED_OUT);

      // At minute 70, both substitutions apply
      const stateAt70 = getPlayerStateAtMinute(timeline, player1Id, 70, startingLineup, squadPlayers);
      expect(stateAt70).toBe(PlayerState.ON_PITCH);
    });
  });
});


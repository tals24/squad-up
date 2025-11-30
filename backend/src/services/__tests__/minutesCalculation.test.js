/**
 * Test Suite: Minutes Calculation Service
 * 
 * Tests for calculatePlayerMinutes function with new timeline service architecture:
 * - Integration with timeline service
 * - Substitutions from timeline
 * - Red cards from Card collection (via timeline)
 * - Session-based algorithm
 * - Edge cases
 */

require('dotenv').config();

const mongoose = require('mongoose');
const { calculatePlayerMinutes } = require('../minutesCalculation');
const Game = require('../../models/Game');
const GameRoster = require('../../models/GameRoster');
const Player = require('../../models/Player');
const Team = require('../../models/Team');
const User = require('../../models/User');
const Card = require('../../models/Card');
const Substitution = require('../../models/Substitution');
const { TeamGoal } = require('../../models/Goal');

describe('Minutes Calculation Service (Timeline Architecture)', () => {
  jest.setTimeout(60000);
  let testUser;
  let testTeam;
  let testGame;
  let testPlayers = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    const mongoUri = process.env.MONGODB_TEST_URI || 
      (process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/test-minutes-calculation$1') : null) ||
      'mongodb://localhost:27017/test-minutes-calculation';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: 'test-coach-minutes@example.com' });
    await Team.deleteMany({ teamName: 'Test Minutes Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Minutes' });
    await Player.deleteMany({ fullName: { $regex: 'Test Player Minutes' } });
    await Card.deleteMany({});
    await Substitution.deleteMany({});
    await GameRoster.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'test-coach-minutes@example.com',
      password: 'hashedpassword',
      role: 'Coach',
      fullName: 'Test Coach Minutes'
    });

    // Create test team
    testTeam = await Team.create({
      teamName: 'Test Minutes Team',
      coach: testUser._id,
      season: '2024',
      division: 'A'
    });

    // Create test players (need at least 12 for starting lineup + subs)
    for (let i = 1; i <= 15; i++) {
      const player = await Player.create({
        fullName: `Test Player Minutes ${i}`,
        kitNumber: i,
        position: i === 1 ? 'Goalkeeper' : (i <= 5 ? 'Defender' : (i <= 10 ? 'Midfielder' : 'Forward')),
        dateOfBirth: new Date('2010-01-01'),
        team: testTeam._id,
        teamRecordID: testTeam._id.toString()
      });
      testPlayers.push(player);
    }
  });

  beforeEach(async () => {
    // Create test game
    testGame = await Game.create({
      team: testTeam._id,
      teamName: 'Test Minutes Team',
      season: '2024',
      opponent: 'Test Opponent Minutes',
      date: new Date(),
      status: 'Played',
      matchDuration: {
        regularTime: 90,
        firstHalfExtraTime: 0,
        secondHalfExtraTime: 0
      }
    });

    // Clean up events
    await Card.deleteMany({ gameId: testGame._id });
    await Substitution.deleteMany({ gameId: testGame._id });
    await GameRoster.deleteMany({ game: testGame._id });
  });

  afterEach(async () => {
    await Game.deleteMany({ _id: testGame._id });
    await Card.deleteMany({ gameId: testGame._id });
    await Substitution.deleteMany({ gameId: testGame._id });
    await GameRoster.deleteMany({ game: testGame._id });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test-coach-minutes@example.com' });
    await Team.deleteMany({ teamName: 'Test Minutes Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Minutes' });
    await Player.deleteMany({ fullName: { $regex: 'Test Player Minutes' } });
    await Card.deleteMany({});
    await Substitution.deleteMany({});
    await GameRoster.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Basic Functionality', () => {
    it('should calculate minutes for starting lineup with no events', async () => {
      // Create starting lineup (first 11 players)
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      const minutes = await calculatePlayerMinutes(testGame._id);

      // All starters should have 90 minutes
      for (let i = 0; i < 11; i++) {
        expect(minutes[testPlayers[i]._id.toString()]).toBe(90);
      }
    });

    it('should return empty object if no starting lineup', async () => {
      const minutes = await calculatePlayerMinutes(testGame._id);
      expect(minutes).toEqual({});
    });
  });

  describe('Substitutions', () => {
    it('should handle single substitution correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Create substitution at minute 45
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[0]._id,
        playerInId: testPlayers[11]._id,
        minute: 45,
        reason: 'tactical'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player out should have 45 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(45);
      // Player in should have 45 minutes (from 45 to 90)
      expect(minutes[testPlayers[11]._id.toString()]).toBe(45);
      // Other starters should have 90 minutes
      expect(minutes[testPlayers[1]._id.toString()]).toBe(90);
    });

    it('should handle multiple substitutions correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Substitution 1: Player 0 out, Player 11 in at minute 30
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[0]._id,
        playerInId: testPlayers[11]._id,
        minute: 30,
        reason: 'tactical'
      });

      // Substitution 2: Player 1 out, Player 12 in at minute 60
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[1]._id,
        playerInId: testPlayers[12]._id,
        minute: 60,
        reason: 'tactical'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0: 30 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(30);
      // Player 11: 60 minutes (30 to 90)
      expect(minutes[testPlayers[11]._id.toString()]).toBe(60);
      // Player 1: 60 minutes
      expect(minutes[testPlayers[1]._id.toString()]).toBe(60);
      // Player 12: 30 minutes (60 to 90)
      expect(minutes[testPlayers[12]._id.toString()]).toBe(30);
      // Other starters: 90 minutes
      expect(minutes[testPlayers[2]._id.toString()]).toBe(90);
    });
  });

  describe('Red Cards', () => {
    it('should handle red card correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Red card at minute 60
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 60,
        reason: 'Serious foul play'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player with red card should have 60 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(60);
      // Other starters should have 90 minutes
      expect(minutes[testPlayers[1]._id.toString()]).toBe(90);
    });

    it('should handle second-yellow card correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Second-yellow card at minute 75
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'second-yellow',
        minute: 75,
        reason: 'Second yellow'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player with second-yellow should have 75 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(75);
    });

    it('should ignore yellow cards (not red)', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Yellow card should NOT affect minutes
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'yellow',
        minute: 30,
        reason: 'Unsporting behavior'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player should still have 90 minutes (yellow card doesn't affect)
      expect(minutes[testPlayers[0]._id.toString()]).toBe(90);
    });
  });

  describe('Combined Events', () => {
    it('should handle substitution followed by red card', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Substitution at minute 45
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[0]._id,
        playerInId: testPlayers[11]._id,
        minute: 45,
        reason: 'tactical'
      });

      // Red card for substituted player at minute 60 (should not affect)
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 60,
        reason: 'Serious foul play'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0 was subbed out at 45, red card at 60 shouldn't affect (already off)
      expect(minutes[testPlayers[0]._id.toString()]).toBe(45);
      // Player 11 should have 45 minutes (45 to 90)
      expect(minutes[testPlayers[11]._id.toString()]).toBe(45);
    });

    it('should handle red card followed by substitution', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Red card at minute 30
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 30,
        reason: 'Serious foul play'
      });

      // Substitution at minute 45 (replacing red-carded player)
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[0]._id,
        playerInId: testPlayers[11]._id,
        minute: 45,
        reason: 'tactical'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0: red card at 30, but substitution at 45 should still be processed
      // However, red card already ended session at 30, so substitution at 45 shouldn't affect
      expect(minutes[testPlayers[0]._id.toString()]).toBe(30);
      // Player 11: substitution at 45, should have 45 minutes
      expect(minutes[testPlayers[11]._id.toString()]).toBe(45);
    });

    it('should handle multiple red cards correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Red card 1 at minute 20
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 20,
        reason: 'Serious foul play'
      });

      // Red card 2 at minute 50
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[1]._id,
        cardType: 'red',
        minute: 50,
        reason: 'Serious foul play'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0: 20 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(20);
      // Player 1: 50 minutes
      expect(minutes[testPlayers[1]._id.toString()]).toBe(50);
      // Other starters: 90 minutes
      expect(minutes[testPlayers[2]._id.toString()]).toBe(90);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extra time correctly', async () => {
      // Update game with extra time
      testGame.matchDuration = {
        regularTime: 90,
        firstHalfExtraTime: 2,
        secondHalfExtraTime: 3
      };
      await testGame.save();

      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      const minutes = await calculatePlayerMinutes(testGame._id);

      // All starters should have 95 minutes (90 + 2 + 3)
      expect(minutes[testPlayers[0]._id.toString()]).toBe(95);
    });

    it('should handle substitution in extra time', async () => {
      // Update game with extra time
      testGame.matchDuration = {
        regularTime: 90,
        firstHalfExtraTime: 0,
        secondHalfExtraTime: 5
      };
      await testGame.save();

      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Substitution at minute 92 (in extra time)
      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[0]._id,
        playerInId: testPlayers[11]._id,
        minute: 92,
        reason: 'tactical'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0: 92 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(92);
      // Player 11: 3 minutes (92 to 95)
      expect(minutes[testPlayers[11]._id.toString()]).toBe(3);
    });

    it('should handle events at same minute correctly', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Red card and substitution at same minute (45)
      // Red card should be processed first (earlier timestamp)
      const redCard = await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 45,
        reason: 'Serious foul play'
      });

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[1]._id,
        playerInId: testPlayers[11]._id,
        minute: 45,
        reason: 'tactical'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Player 0: red card at 45
      expect(minutes[testPlayers[0]._id.toString()]).toBe(45);
      // Player 1: substitution at 45
      expect(minutes[testPlayers[1]._id.toString()]).toBe(45);
      // Player 11: substitution at 45
      expect(minutes[testPlayers[11]._id.toString()]).toBe(45);
    });

    it('should include bench players with 0 minutes', async () => {
      // Create starting lineup (first 11)
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Create bench players
      await GameRoster.create({
        game: testGame._id,
        player: testPlayers[11]._id,
        status: 'Bench'
      });

      await GameRoster.create({
        game: testGame._id,
        player: testPlayers[12]._id,
        status: 'Bench'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Bench players should have 0 minutes
      expect(minutes[testPlayers[11]._id.toString()]).toBe(0);
      expect(minutes[testPlayers[12]._id.toString()]).toBe(0);
      // Starters should have 90 minutes
      expect(minutes[testPlayers[0]._id.toString()]).toBe(90);
    });
  });

  describe('Timeline Service Integration', () => {
    it('should use timeline service to fetch events', async () => {
      // Create starting lineup
      for (let i = 0; i < 11; i++) {
        await GameRoster.create({
          game: testGame._id,
          player: testPlayers[i]._id,
          status: 'Starting Lineup'
        });
      }

      // Create events that will be fetched via timeline service
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayers[0]._id,
        cardType: 'red',
        minute: 30,
        reason: 'Serious foul play'
      });

      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayers[1]._id,
        playerInId: testPlayers[11]._id,
        minute: 45,
        reason: 'tactical'
      });

      // Also create a goal (should be ignored by minutes calculation)
      await TeamGoal.create({
        gameId: testGame._id,
        minute: 20,
        scorerId: testPlayers[2]._id,
        goalType: 'open-play'
      });

      const minutes = await calculatePlayerMinutes(testGame._id);

      // Red card should be processed
      expect(minutes[testPlayers[0]._id.toString()]).toBe(30);
      // Substitution should be processed
      expect(minutes[testPlayers[1]._id.toString()]).toBe(45);
      expect(minutes[testPlayers[11]._id.toString()]).toBe(45);
      // Goal should NOT affect minutes
      expect(minutes[testPlayers[2]._id.toString()]).toBe(90);
    });
  });
});


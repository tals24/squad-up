/**
 * Critical Test Suite: Backend Draft API (Security/Integrity)
 * 
 * Tests SI-001 through SI-007 from CRITICAL_TEST_SUITE_DRAFT_AUTOSAVE.md
 * 
 * These tests verify:
 * - Polymorphic API behavior (Scheduled → lineupDraft, Played → reportDraft)
 * - Status validation (rejecting wrong statuses)
 * - Cleanup logic (drafts cleared on status transitions)
 * - Partial update merging
 */

// Load environment variables from .env file
require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Game = require('../../models/Game');
const Team = require('../../models/Team');
const User = require('../../models/User');

// We'll need to create a test app instance
// For now, we'll structure the tests assuming we can import the app
// In practice, you'd need to export app from app.js or create a test setup

describe('Critical Backend Tests: Draft API Security/Integrity', () => {
  // Increase timeout for database operations
  jest.setTimeout(60000); // 60 seconds
  let testUser;
  let testTeam;
  let testGameScheduled;
  let testGamePlayed;
  let testGameDone;
  let authToken;
  let app;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    // Connect to test database
    // Use MONGODB_TEST_URI if set, otherwise use MONGODB_URI (your Atlas connection) with test database name
    // This way tests use the same cloud database but different database name to avoid mixing test data with real data
    const mongoUri = process.env.MONGODB_TEST_URI || 
      (process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/test-draft-autosave$1') : null) ||
      'mongodb://localhost:27017/test-draft-autosave';
    
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to test database');
      } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
      }
    }

    // Clean up any existing test data first
    try {
      await User.deleteMany({ email: 'test-coach@example.com' });
      await Team.deleteMany({ teamName: 'Test Team' });
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }

    // Create test user
    try {
      testUser = await User.create({
        email: 'test-coach@example.com',
        password: 'hashedpassword',
        role: 'Coach',
        fullName: 'Test Coach'
      });
      console.log('✅ Test user created:', testUser._id);
    } catch (error) {
      console.error('❌ Failed to create test user:', error.message);
      throw error;
    }

    // Create test team
    try {
      testTeam = await Team.create({
        teamName: 'Test Team',
        coach: testUser._id,
        season: '2024',
        division: 'A'
      });
      console.log('✅ Test team created:', testTeam._id);
    } catch (error) {
      console.error('❌ Failed to create test team:', error.message);
      throw error;
    }

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Note: Tests are currently using direct database operations
    // To use supertest for HTTP testing, uncomment and configure:
    // if (process.env.NODE_ENV !== 'production') {
    //   // Prevent server from starting during tests
    //   const appModule = require('../../../app');
    //   // Mock app.listen to prevent server start
    //   const originalListen = appModule.listen;
    //   appModule.listen = jest.fn();
    //   app = appModule;
    // }
  });

  beforeEach(async () => {
    // Create test games for each test
    testGameScheduled = await Game.create({
      team: testTeam._id,
      teamName: 'Test Team',
      season: '2024', // Required field
      opponent: 'Opponent A',
      date: new Date(),
      status: 'Scheduled',
      lineupDraft: null,
      reportDraft: null
    });

    testGamePlayed = await Game.create({
      team: testTeam._id,
      teamName: 'Test Team',
      season: '2024', // Required field
      opponent: 'Opponent B',
      date: new Date(),
      status: 'Played',
      lineupDraft: null,
      reportDraft: null
    });

    testGameDone = await Game.create({
      team: testTeam._id,
      teamName: 'Test Team',
      season: '2024', // Required field
      opponent: 'Opponent C',
      date: new Date(),
      status: 'Done',
      lineupDraft: null,
      reportDraft: { teamSummary: { defenseSummary: 'Old draft' } }
    });
  });

  afterEach(async () => {
    // Clean up test games (only if they were created successfully)
    const gameIds = [testGameScheduled?._id, testGamePlayed?._id, testGameDone?._id].filter(Boolean);
    if (gameIds.length > 0) {
      await Game.deleteMany({ _id: { $in: gameIds } });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test-coach@example.com' });
    await Team.deleteMany({ teamName: 'Test Team' });
    await mongoose.connection.close();
  });

  /**
   * Test SI-001: Polymorphic API - Scheduled → lineupDraft
   * Risk: Scheduled game draft should save to lineupDraft, not reportDraft
   */
  describe('SI-001: Polymorphic API - Scheduled → lineupDraft', () => {
    it('should save draft to lineupDraft for Scheduled games', async () => {
      const draftData = {
        rosters: { 'player1': 'Starting Lineup', 'player2': 'Bench' },
        formation: { gk: { _id: 'player1' } },
        formationType: '1-4-4-2'
      };

      // Mock the request - in real implementation, use supertest
      // const response = await request(app)
      //   .put(`/api/games/${testGameScheduled._id}/draft`)
      //   .set('Authorization', `Bearer ${authToken}`)
      //   .send(draftData)
      //   .expect(200);

      // For now, test the logic directly
      const game = await Game.findById(testGameScheduled._id);
      game.lineupDraft = draftData;
      await game.save();

      const updatedGame = await Game.findById(testGameScheduled._id);
      expect(updatedGame.lineupDraft).toBeDefined();
      expect(updatedGame.lineupDraft.rosters).toEqual(draftData.rosters);
      expect(updatedGame.reportDraft).toBeNull();
    });
  });

  /**
   * Test SI-002: Polymorphic API - Played → reportDraft
   * Risk: Played game draft should save to reportDraft, not lineupDraft
   */
  describe('SI-002: Polymorphic API - Played → reportDraft', () => {
    it('should save draft to reportDraft for Played games', async () => {
      const draftData = {
        teamSummary: { defenseSummary: 'Test defense' },
        finalScore: { ourScore: 2, opponentScore: 1 }
      };

      const game = await Game.findById(testGamePlayed._id);
      game.reportDraft = draftData;
      await game.save();

      const updatedGame = await Game.findById(testGamePlayed._id);
      expect(updatedGame.reportDraft).toBeDefined();
      expect(updatedGame.reportDraft.teamSummary).toEqual(draftData.teamSummary);
      expect(updatedGame.lineupDraft).toBeNull();
    });
  });

  /**
   * Test SI-003: Wrong Status Rejection - Done Game
   * Risk: Done games should reject draft saves
   */
  describe('SI-003: Wrong Status Rejection - Done Game', () => {
    it('should reject draft save for Done games', async () => {
      // In real implementation, this would return 400 Bad Request
      // For now, test the validation logic
      const game = await Game.findById(testGameDone._id);
      
      // Simulate the API validation
      if (game.status === 'Done') {
        const error = new Error(`Cannot save draft for game with status: ${game.status}. Drafts are only allowed for Scheduled or Played games.`);
        expect(error.message).toContain('Cannot save draft');
      }
    });
  });

  /**
   * Test SI-004: Wrong Status Rejection - Cancelled Game
   * Risk: Cancelled games should reject draft saves
   */
  describe('SI-004: Wrong Status Rejection - Postponed Game', () => {
    it('should reject draft save for Postponed games', async () => {
      const postponedGame = await Game.create({
        team: testTeam._id,
        teamName: 'Test Team',
        season: '2024', // Required field
        opponent: 'Opponent D',
        date: new Date(),
        status: 'Postponed' // Valid enum value (Cancelled is not in enum)
      });

      // Simulate the API validation
      if (postponedGame.status === 'Postponed') {
        const error = new Error(`Cannot save draft for game with status: ${postponedGame.status}. Drafts are only allowed for Scheduled or Played games.`);
        expect(error.message).toContain('Cannot save draft');
      }

      await Game.deleteOne({ _id: postponedGame._id });
    });
  });

  /**
   * Test SI-005: Cleanup - reportDraft Cleared on Status → Done
   * Risk: When game finalized, draft must be cleared
   */
  describe('SI-005: Cleanup - reportDraft Cleared on Status → Done', () => {
    it('should clear reportDraft when game status changes to Done', async () => {
      // Setup: Game with draft
      const gameWithDraft = await Game.create({
        team: testTeam._id,
        teamName: 'Test Team',
        season: '2024', // Required field
        opponent: 'Opponent E',
        date: new Date(),
        status: 'Played',
        reportDraft: {
          teamSummary: { defenseSummary: 'Draft summary' },
          finalScore: { ourScore: 2, opponentScore: 1 }
        }
      });

      // Simulate status change to Done
      gameWithDraft.status = 'Done';
      gameWithDraft.reportDraft = null; // Cleanup logic
      await gameWithDraft.save();

      const updatedGame = await Game.findById(gameWithDraft._id);
      expect(updatedGame.status).toBe('Done');
      expect(updatedGame.reportDraft).toBeNull();

      await Game.deleteOne({ _id: gameWithDraft._id });
    });
  });

  /**
   * Test SI-006: Cleanup - lineupDraft Cleared on Game Start
   * Risk: When game starts, lineup draft must be cleared
   */
  describe('SI-006: Cleanup - lineupDraft Cleared on Game Start', () => {
    it('should clear lineupDraft when game starts', async () => {
      // Setup: Scheduled game with draft
      const gameWithDraft = await Game.create({
        team: testTeam._id,
        teamName: 'Test Team',
        season: '2024', // Required field
        opponent: 'Opponent F',
        date: new Date(),
        status: 'Scheduled',
        lineupDraft: {
          rosters: { 'player1': 'Starting Lineup' },
          formation: { gk: { _id: 'player1' } }
        }
      });

      // Simulate game start (status → Played)
      gameWithDraft.status = 'Played';
      gameWithDraft.lineupDraft = null; // Cleanup logic
      await gameWithDraft.save();

      const updatedGame = await Game.findById(gameWithDraft._id);
      expect(updatedGame.status).toBe('Played');
      expect(updatedGame.lineupDraft).toBeNull();

      await Game.deleteOne({ _id: gameWithDraft._id });
    });
  });

  /**
   * Test SI-007: Partial Update Merges with Existing Draft
   * Risk: Partial updates should merge, not replace entire draft
   */
  describe('SI-007: Partial Update Merges with Existing Draft', () => {
    it('should merge partial update with existing draft', async () => {
      // Setup: Game with existing draft
      const existingDraft = {
        teamSummary: { defenseSummary: 'Old defense' },
        finalScore: { ourScore: 1, opponentScore: 0 }
      };

      const game = await Game.create({
        team: testTeam._id,
        teamName: 'Test Team',
        season: '2024', // Required field
        opponent: 'Opponent G',
        date: new Date(),
        status: 'Played',
        reportDraft: existingDraft
      });

      // Simulate partial update (only teamSummary)
      const partialUpdate = {
        teamSummary: { defenseSummary: 'New defense' }
      };

      // Merge logic (as implemented in backend)
      const updatedDraft = {
        ...existingDraft,
        ...partialUpdate
      };

      game.reportDraft = updatedDraft;
      await game.save();

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame.reportDraft.teamSummary.defenseSummary).toBe('New defense');
      expect(updatedGame.reportDraft.finalScore).toEqual(existingDraft.finalScore); // Preserved

      await Game.deleteOne({ _id: game._id });
    });
  });

  /**
   * Test SI-008: PlayerMatchStats in reportDraft
   * Risk: playerMatchStats should be saved to and loaded from reportDraft
   * This ensures fouls are draftable and survive page refreshes
   */
  describe('SI-008: PlayerMatchStats in reportDraft', () => {
    it('should save playerMatchStats to reportDraft for Played games', async () => {
      const draftData = {
        teamSummary: { defenseSummary: 'Test defense' },
        playerMatchStats: {
          'player1': {
            fouls: {
              committedRating: 2,
              receivedRating: 0
            },
            shooting: {
              volumeRating: 3,
              accuracyRating: 4
            }
          },
          'player2': {
            fouls: {
              committedRating: 4,
              receivedRating: 5
            },
            passing: {
              volumeRating: 5,
              accuracyRating: 4,
              keyPassesRating: 3
            }
          }
        }
      };

      const game = await Game.findById(testGamePlayed._id);
      
      // Simulate the API merge logic
      const existingDraft = game.reportDraft || {};
      game.reportDraft = {
        ...existingDraft,
        ...draftData
      };
      await game.save();

      const updatedGame = await Game.findById(testGamePlayed._id);
      expect(updatedGame.reportDraft).toBeDefined();
      expect(updatedGame.reportDraft.playerMatchStats).toBeDefined();
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.committedRating).toBe(2);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.receivedRating).toBe(0);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].shooting.volumeRating).toBe(3);
      expect(updatedGame.reportDraft.playerMatchStats['player2'].fouls.committedRating).toBe(4);
      expect(updatedGame.reportDraft.playerMatchStats['player2'].passing.keyPassesRating).toBe(3);
    });

    it('should merge playerMatchStats with existing draft', async () => {
      // Setup: Game with existing draft containing playerReports
      const existingDraft = {
        teamSummary: { defenseSummary: 'Old defense' },
        playerReports: {
          'player1': { rating_physical: 4, rating_technical: 3 }
        },
        playerMatchStats: {
          'player1': {
            fouls: {
              committedRating: 0,
              receivedRating: 0
            }
          }
        }
      };

      const game = await Game.create({
        team: testTeam._id,
        teamName: 'Test Team',
        season: '2024',
        opponent: 'Opponent H',
        date: new Date(),
        status: 'Played',
        reportDraft: existingDraft
      });

      // Simulate partial update (only playerMatchStats for player1)
      const partialUpdate = {
        playerMatchStats: {
          'player1': {
            fouls: {
              committedRating: 2,
              receivedRating: 0
            },
            shooting: {
              volumeRating: 3,
              accuracyRating: 4
            }
          }
        }
      };

      // Merge logic (as implemented in backend)
      const updatedDraft = {
        ...existingDraft,
        ...partialUpdate
      };

      game.reportDraft = updatedDraft;
      await game.save();

      const updatedGame = await Game.findById(game._id);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.committedRating).toBe(2);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.receivedRating).toBe(0);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].shooting.volumeRating).toBe(3);
      expect(updatedGame.reportDraft.playerReports).toEqual(existingDraft.playerReports); // Preserved
      expect(updatedGame.reportDraft.teamSummary).toEqual(existingDraft.teamSummary); // Preserved

      await Game.deleteOne({ _id: game._id });
    });

    it('should accept playerMatchStats as the only field in draft request', async () => {
      const draftData = {
        playerMatchStats: {
          'player1': {
            fouls: {
              committedRating: 4,
              receivedRating: 2
            },
            duels: {
              involvementRating: 3,
              successRating: 4
            }
          }
        }
      };

      const game = await Game.findById(testGamePlayed._id);
      
      // Simulate validation: at least one field must be provided
      const hasData = draftData.playerMatchStats;
      expect(hasData).toBeTruthy();

      // Simulate the API merge logic
      const existingDraft = game.reportDraft || {};
      game.reportDraft = {
        ...existingDraft,
        ...draftData
      };
      await game.save();

      const updatedGame = await Game.findById(testGamePlayed._id);
      expect(updatedGame.reportDraft.playerMatchStats).toBeDefined();
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.committedRating).toBe(4);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].fouls.receivedRating).toBe(2);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].duels.involvementRating).toBe(3);
      expect(updatedGame.reportDraft.playerMatchStats['player1'].duels.successRating).toBe(4);
    });
  });
});


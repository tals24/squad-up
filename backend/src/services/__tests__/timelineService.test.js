/**
 * Test Suite: Timeline Service
 * 
 * Tests for getMatchTimeline function:
 * - Fetches Cards, Goals, and Substitutions in parallel
 * - Normalizes data to common structure
 * - Merges and sorts chronologically
 */

require('dotenv').config();

const mongoose = require('mongoose');
const { getMatchTimeline } = require('../games/utils/gameEventsAggregator');
const Card = require('../../models/Card');
const Goal = require('../../models/Goal');
const { TeamGoal, OpponentGoal } = require('../../models/Goal');
const Substitution = require('../../models/Substitution');
const Game = require('../../models/Game');
const Player = require('../../models/Player');
const Team = require('../../models/Team');
const User = require('../../models/User');

describe('Timeline Service', () => {
  jest.setTimeout(60000);
  let testUser;
  let testTeam;
  let testGame;
  let testPlayer1;
  let testPlayer2;
  let testPlayer3;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    const mongoUri = process.env.MONGODB_TEST_URI || 
      (process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/test-timeline-service$1') : null) ||
      'mongodb://localhost:27017/test-timeline-service';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: 'test-coach-timeline@example.com' });
    await Team.deleteMany({ teamName: 'Test Timeline Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Timeline' });
    await Player.deleteMany({ fullName: { $regex: 'Test Player Timeline' } });
    await Card.deleteMany({});
    await Goal.deleteMany({});
    await Substitution.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'test-coach-timeline@example.com',
      password: 'hashedpassword',
      role: 'Coach',
      fullName: 'Test Coach Timeline'
    });

    // Create test team
    testTeam = await Team.create({
      teamName: 'Test Timeline Team',
      coach: testUser._id,
      season: '2024',
      division: 'A'
    });

    // Create test players
    testPlayer1 = await Player.create({
      fullName: 'Test Player Timeline 1',
      kitNumber: 10,
      position: 'Midfielder',
      dateOfBirth: new Date('2010-01-01'),
      team: testTeam._id,
      teamRecordID: testTeam._id.toString()
    });

    testPlayer2 = await Player.create({
      fullName: 'Test Player Timeline 2',
      kitNumber: 9,
      position: 'Forward',
      dateOfBirth: new Date('2010-02-01'),
      team: testTeam._id,
      teamRecordID: testTeam._id.toString()
    });

    testPlayer3 = await Player.create({
      fullName: 'Test Player Timeline 3',
      kitNumber: 7,
      position: 'Midfielder',
      dateOfBirth: new Date('2010-03-01'),
      team: testTeam._id,
      teamRecordID: testTeam._id.toString()
    });

    // Create test game
    testGame = await Game.create({
      team: testTeam._id,
      teamName: 'Test Timeline Team',
      season: '2024',
      opponent: 'Test Opponent Timeline',
      date: new Date(),
      status: 'Played'
    });
  });

  afterEach(async () => {
    await Card.deleteMany({ gameId: testGame._id });
    await Goal.deleteMany({ gameId: testGame._id });
    await Substitution.deleteMany({ gameId: testGame._id });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test-coach-timeline@example.com' });
    await Team.deleteMany({ teamName: 'Test Timeline Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Timeline' });
    await Player.deleteMany({ fullName: { $regex: 'Test Player Timeline' } });
    await Card.deleteMany({});
    await Goal.deleteMany({});
    await Substitution.deleteMany({});
    await mongoose.connection.close();
  });

  describe('getMatchTimeline', () => {
    it('should return empty array when no events exist', async () => {
      const timeline = await getMatchTimeline(testGame._id);
      expect(timeline).toEqual([]);
    });

    it('should fetch and normalize cards', async () => {
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer1._id,
        cardType: 'yellow',
        minute: 25,
        reason: 'Test reason'
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('card');
      expect(timeline[0].cardType).toBe('yellow');
      expect(timeline[0].minute).toBe(25);
      expect(timeline[0].reason).toBe('Test reason');
      expect(timeline[0].player).toBeDefined();
    });

    it('should fetch and normalize team goals', async () => {
      const goal = await TeamGoal.create({
        gameId: testGame._id,
        minute: 15,
        scorerId: testPlayer1._id,
        assistedById: testPlayer2._id,
        goalType: 'open-play'
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('goal');
      expect(timeline[0].minute).toBe(15);
      expect(timeline[0].scorer).toBeDefined();
      expect(timeline[0].assister).toBeDefined();
      expect(timeline[0].goalCategory).toBe('TeamGoal');
    });

    it('should fetch and normalize opponent goals', async () => {
      const goal = await OpponentGoal.create({
        gameId: testGame._id,
        minute: 30,
        goalType: 'set-piece'
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('opponent-goal');
      expect(timeline[0].minute).toBe(30);
      expect(timeline[0].goalCategory).toBe('OpponentGoal');
    });

    it('should fetch and normalize substitutions', async () => {
      const sub = await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayer1._id,
        playerInId: testPlayer2._id,
        minute: 60,
        reason: 'tactical',
        matchState: 'winning'
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('substitution');
      expect(timeline[0].minute).toBe(60);
      expect(timeline[0].playerOut).toBeDefined();
      expect(timeline[0].playerIn).toBeDefined();
      expect(timeline[0].reason).toBe('tactical');
    });

    it('should merge and sort events chronologically', async () => {
      // Create events in non-chronological order
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayer1._id,
        cardType: 'yellow',
        minute: 45
      });

      await TeamGoal.create({
        gameId: testGame._id,
        minute: 10,
        scorerId: testPlayer1._id,
        goalType: 'open-play'
      });

      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayer1._id,
        playerInId: testPlayer2._id,
        minute: 30
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(3);
      // Should be sorted by minute: 10, 30, 45
      expect(timeline[0].minute).toBe(10);
      expect(timeline[0].type).toBe('goal');
      expect(timeline[1].minute).toBe(30);
      expect(timeline[1].type).toBe('substitution');
      expect(timeline[2].minute).toBe(45);
      expect(timeline[2].type).toBe('card');
    });

    it('should sort events by timestamp when minute is the same', async () => {
      // Create goal first (will have earlier timestamp)
      const goal = await TeamGoal.create({
        gameId: testGame._id,
        minute: 25,
        scorerId: testPlayer1._id,
        goalType: 'open-play'
      });

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create card second (will have later timestamp)
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer1._id,
        cardType: 'yellow',
        minute: 25
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(2);
      expect(timeline[0].minute).toBe(25);
      expect(timeline[1].minute).toBe(25);
      // Goal should come first (earlier timestamp)
      expect(timeline[0].type).toBe('goal');
      expect(timeline[1].type).toBe('card');
    });

    it('should handle mixed event types correctly', async () => {
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayer1._id,
        cardType: 'red',
        minute: 50
      });

      await TeamGoal.create({
        gameId: testGame._id,
        minute: 20,
        scorerId: testPlayer2._id,
        goalType: 'penalty'
      });

      await OpponentGoal.create({
        gameId: testGame._id,
        minute: 35,
        goalType: 'open-play'
      });

      await Substitution.create({
        gameId: testGame._id,
        playerOutId: testPlayer2._id,
        playerInId: testPlayer3._id,
        minute: 65
      });

      const timeline = await getMatchTimeline(testGame._id);
      
      expect(timeline).toHaveLength(4);
      // Verify chronological order
      expect(timeline[0].minute).toBe(20);
      expect(timeline[1].minute).toBe(35);
      expect(timeline[2].minute).toBe(50);
      expect(timeline[3].minute).toBe(65);
    });
  });
});


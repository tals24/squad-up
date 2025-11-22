/**
 * Test Suite: Player Match Stats API Routes
 * 
 * Tests for PlayerMatchStat operations:
 * - GET /api/games/:gameId/player-match-stats - Get all stats for game
 * - GET /api/games/:gameId/player-match-stats/player/:playerId - Get stats for player
 * - PUT /api/games/:gameId/player-match-stats/player/:playerId - Upsert stats
 */

require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const PlayerMatchStat = require('../../models/PlayerMatchStat');
const Game = require('../../models/Game');
const Player = require('../../models/Player');
const Team = require('../../models/Team');
const User = require('../../models/User');

describe('Player Match Stats API Routes', () => {
  jest.setTimeout(60000);
  let testUser;
  let testTeam;
  let testGame;
  let testPlayer;
  let authToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    const mongoUri = process.env.MONGODB_TEST_URI || 
      (process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/test-player-match-stats$1') : null) ||
      'mongodb://localhost:27017/test-player-match-stats';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: 'test-coach-stats@example.com' });
    await Team.deleteMany({ teamName: 'Test Stats Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Stats' });
    await Player.deleteMany({ fullName: 'Test Player Stats' });
    await PlayerMatchStat.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'test-coach-stats@example.com',
      password: 'hashedpassword',
      role: 'Coach',
      fullName: 'Test Coach Stats'
    });

    // Create test team
    testTeam = await Team.create({
      teamName: 'Test Stats Team',
      coach: testUser._id,
      season: '2024',
      division: 'A'
    });

    // Create test player
    testPlayer = await Player.create({
      fullName: 'Test Player Stats',
      kitNumber: 7,
      position: 'Forward',
      dateOfBirth: new Date('2010-01-01'),
      team: testTeam._id,
      teamRecordID: testTeam._id.toString()
    });

    // Create test game
    testGame = await Game.create({
      team: testTeam._id,
      teamName: 'Test Stats Team',
      season: '2024',
      opponent: 'Test Opponent Stats',
      date: new Date(),
      status: 'Played'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await PlayerMatchStat.deleteMany({ gameId: testGame._id });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test-coach-stats@example.com' });
    await Team.deleteMany({ teamName: 'Test Stats Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Stats' });
    await Player.deleteMany({ fullName: 'Test Player Stats' });
    await PlayerMatchStat.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/games/:gameId/player-match-stats', () => {
    it('should get all player match stats for a game', async () => {
      // Create test stats
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        disciplinary: {
          foulsCommitted: 3,
          foulsReceived: 1
        }
      });

      const response = await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalStats).toBe(1);
      expect(response.body.stats).toHaveLength(1);
      expect(response.body.stats[0].disciplinary.foulsCommitted).toBe(3);
    });

    it('should return empty array if no stats exist', async () => {
      const response = await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalStats).toBe(0);
      expect(response.body.stats).toHaveLength(0);
    });
  });

  describe('GET /api/games/:gameId/player-match-stats/player/:playerId', () => {
    it('should get stats for a specific player', async () => {
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        disciplinary: {
          foulsCommitted: 2,
          foulsReceived: 0
        }
      });

      const response = await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats.disciplinary.foulsCommitted).toBe(2);
      expect(response.body.playerId).toBe(testPlayer._id.toString());
    });

    it('should return 404 if stats not found', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats/player/${fakePlayerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/games/:gameId/player-match-stats/player/:playerId', () => {
    it('should create new stats (upsert)', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          disciplinary: {
            foulsCommitted: 4,
            foulsReceived: 2
          }
        })
        .expect(200);

      expect(response.body.stats.disciplinary.foulsCommitted).toBe(4);
      expect(response.body.stats.disciplinary.foulsReceived).toBe(2);

      // Verify stats were saved
      const stats = await PlayerMatchStat.findOne({ gameId: testGame._id, playerId: testPlayer._id });
      expect(stats).toBeDefined();
      expect(stats.disciplinary.foulsCommitted).toBe(4);
    });

    it('should update existing stats (upsert)', async () => {
      // Create initial stats
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        disciplinary: {
          foulsCommitted: 2,
          foulsReceived: 1
        }
      });

      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          disciplinary: {
            foulsCommitted: 5,
            foulsReceived: 3
          }
        })
        .expect(200);

      expect(response.body.stats.disciplinary.foulsCommitted).toBe(5);
      expect(response.body.stats.disciplinary.foulsReceived).toBe(3);
    });

    it('should handle partial updates', async () => {
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        disciplinary: {
          foulsCommitted: 2,
          foulsReceived: 1
        },
        shooting: {
          shotsOnTarget: 3,
          shotsOffTarget: 2
        }
      });

      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          disciplinary: {
            foulsCommitted: 4,
            foulsReceived: 2
          }
          // shooting should remain unchanged
        })
        .expect(200);

      expect(response.body.stats.disciplinary.foulsCommitted).toBe(4);
      expect(response.body.stats.shooting.shotsOnTarget).toBe(3); // Preserved
    });

    it('should return 404 if player not found', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${fakePlayerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          disciplinary: {
            foulsCommitted: 2,
            foulsReceived: 1
          }
        })
        .expect(404);
    });

    it('should handle shooting stats', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shooting: {
            shotsOnTarget: 5,
            shotsOffTarget: 3,
            blockedShots: 1,
            hitWoodwork: 0
          }
        })
        .expect(200);

      expect(response.body.stats.shooting.shotsOnTarget).toBe(5);
      expect(response.body.stats.shooting.shotsOffTarget).toBe(3);
    });

    it('should handle passing stats', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          passing: {
            totalPasses: 50,
            completedPasses: 45,
            keyPasses: 3
          }
        })
        .expect(200);

      expect(response.body.stats.passing.totalPasses).toBe(50);
      expect(response.body.stats.passing.completedPasses).toBe(45);
      expect(response.body.stats.passing.keyPasses).toBe(3);
    });
  });
});


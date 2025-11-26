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
      // Create test stats with new rating-based structure
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        fouls: {
          committedRating: 3,
          receivedRating: 1
        }
      });

      const response = await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalStats).toBe(1);
      expect(response.body.stats).toHaveLength(1);
      expect(response.body.stats[0].fouls.committedRating).toBe(3);
      expect(response.body.stats[0].fouls.receivedRating).toBe(1);
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
        fouls: {
          committedRating: 2,
          receivedRating: 0
        }
      });

      const response = await request(app)
        .get(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats.fouls.committedRating).toBe(2);
      expect(response.body.stats.fouls.receivedRating).toBe(0);
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
          fouls: {
            committedRating: 4,
            receivedRating: 2
          }
        })
        .expect(200);

      expect(response.body.stats.fouls.committedRating).toBe(4);
      expect(response.body.stats.fouls.receivedRating).toBe(2);

      // Verify stats were saved
      const stats = await PlayerMatchStat.findOne({ gameId: testGame._id, playerId: testPlayer._id });
      expect(stats).toBeDefined();
      expect(stats.fouls.committedRating).toBe(4);
      expect(stats.fouls.receivedRating).toBe(2);
    });

    it('should update existing stats (upsert)', async () => {
      // Create initial stats
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        fouls: {
          committedRating: 2,
          receivedRating: 1
        }
      });

      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fouls: {
            committedRating: 5,
            receivedRating: 3
          }
        })
        .expect(200);

      expect(response.body.stats.fouls.committedRating).toBe(5);
      expect(response.body.stats.fouls.receivedRating).toBe(3);
    });

    it('should handle partial updates', async () => {
      await PlayerMatchStat.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        fouls: {
          committedRating: 2,
          receivedRating: 1
        },
        shooting: {
          volumeRating: 3,
          accuracyRating: 4
        }
      });

      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fouls: {
            committedRating: 4,
            receivedRating: 2
          }
          // shooting should remain unchanged
        })
        .expect(200);

      expect(response.body.stats.fouls.committedRating).toBe(4);
      expect(response.body.stats.fouls.receivedRating).toBe(2);
      expect(response.body.stats.shooting.volumeRating).toBe(3); // Preserved
      expect(response.body.stats.shooting.accuracyRating).toBe(4); // Preserved
    });

    it('should return 404 if player not found', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${fakePlayerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fouls: {
            committedRating: 2,
            receivedRating: 1
          }
        })
        .expect(404);
    });

    it('should handle shooting stats with ratings', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shooting: {
            volumeRating: 4,
            accuracyRating: 5
          }
        })
        .expect(200);

      expect(response.body.stats.shooting.volumeRating).toBe(4);
      expect(response.body.stats.shooting.accuracyRating).toBe(5);
    });

    it('should handle passing stats with ratings', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          passing: {
            volumeRating: 5,
            accuracyRating: 4,
            keyPassesRating: 3
          }
        })
        .expect(200);

      expect(response.body.stats.passing.volumeRating).toBe(5);
      expect(response.body.stats.passing.accuracyRating).toBe(4);
      expect(response.body.stats.passing.keyPassesRating).toBe(3);
    });

    it('should handle duels stats with ratings', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duels: {
            involvementRating: 4,
            successRating: 3
          }
        })
        .expect(200);

      expect(response.body.stats.duels.involvementRating).toBe(4);
      expect(response.body.stats.duels.successRating).toBe(3);
    });

    it('should handle all stat categories together', async () => {
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fouls: {
            committedRating: 2,
            receivedRating: 1
          },
          shooting: {
            volumeRating: 4,
            accuracyRating: 5
          },
          passing: {
            volumeRating: 5,
            accuracyRating: 4,
            keyPassesRating: 3
          },
          duels: {
            involvementRating: 4,
            successRating: 3
          }
        })
        .expect(200);

      expect(response.body.stats.fouls.committedRating).toBe(2);
      expect(response.body.stats.shooting.volumeRating).toBe(4);
      expect(response.body.stats.passing.keyPassesRating).toBe(3);
      expect(response.body.stats.duels.successRating).toBe(3);
    });

    it('should validate rating values (0-5)', async () => {
      // Test invalid values (should fail validation)
      const response = await request(app)
        .put(`/api/games/${testGame._id}/player-match-stats/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fouls: {
            committedRating: 6, // Invalid: > 5
            receivedRating: -1  // Invalid: < 0
          }
        })
        .expect(500); // Mongoose validation error

      // Verify error message indicates validation failure
      expect(response.body.error).toBeDefined();
    });
  });
});


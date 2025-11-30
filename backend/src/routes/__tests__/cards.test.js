/**
 * Test Suite: Cards API Routes
 * 
 * Tests for Card CRUD operations:
 * - POST /api/games/:gameId/cards - Create card
 * - GET /api/games/:gameId/cards - Get all cards for game
 * - GET /api/games/:gameId/cards/player/:playerId - Get cards for player
 * - PUT /api/games/:gameId/cards/:cardId - Update card
 * - DELETE /api/games/:gameId/cards/:cardId - Delete card
 * - Red card triggers recalc-minutes job
 */

require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Card = require('../../models/Card');
const Game = require('../../models/Game');
const Player = require('../../models/Player');
const Team = require('../../models/Team');
const User = require('../../models/User');
const Job = require('../../models/Job');
const GameRoster = require('../../models/GameRoster');

describe('Cards API Routes', () => {
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
      (process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/test-cards-api$1') : null) ||
      'mongodb://localhost:27017/test-cards-api';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: 'test-coach-cards@example.com' });
    await Team.deleteMany({ teamName: 'Test Cards Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Cards' });
    await Player.deleteMany({ fullName: 'Test Player Cards' });
    await Card.deleteMany({});
    await Job.deleteMany({ jobType: 'recalc-minutes' });

    // Create test user
    testUser = await User.create({
      email: 'test-coach-cards@example.com',
      password: 'hashedpassword',
      role: 'Coach',
      fullName: 'Test Coach Cards'
    });

    // Create test team
    testTeam = await Team.create({
      teamName: 'Test Cards Team',
      coach: testUser._id,
      season: '2024',
      division: 'A'
    });

    // Create test player
    testPlayer = await Player.create({
      fullName: 'Test Player Cards',
      kitNumber: 10,
      position: 'Midfielder',
      dateOfBirth: new Date('2010-01-01'),
      team: testTeam._id,
      teamRecordID: testTeam._id.toString()
    });

    // Create test game
    testGame = await Game.create({
      team: testTeam._id,
      teamName: 'Test Cards Team',
      season: '2024',
      opponent: 'Test Opponent Cards',
      date: new Date(),
      status: 'Played'
    });

    // Create GameRoster entry so player is eligible for cards (must be in Starting Lineup or Bench)
    await GameRoster.create({
      game: testGame._id,
      player: testPlayer._id,
      status: 'Starting Lineup',
      position: 'MF'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up cards and jobs after each test
    await Card.deleteMany({ gameId: testGame._id });
    await Job.deleteMany({ jobType: 'recalc-minutes' });
    // Note: Keep GameRoster entries for all tests
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test-coach-cards@example.com' });
    await Team.deleteMany({ teamName: 'Test Cards Team' });
    await Game.deleteMany({ opponent: 'Test Opponent Cards' });
    await Player.deleteMany({ fullName: 'Test Player Cards' });
    await Card.deleteMany({});
    await Job.deleteMany({ jobType: 'recalc-minutes' });
    await GameRoster.deleteMany({ game: testGame._id });
    await mongoose.connection.close();
  });

  describe('POST /api/games/:gameId/cards', () => {
    it('should create a yellow card successfully', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerId: testPlayer._id,
          cardType: 'yellow',
          minute: 25,
          reason: 'Unsporting behavior'
        })
        .expect(201);

      expect(response.body.message).toBe('Card created successfully');
      expect(response.body.card.cardType).toBe('yellow');
      expect(response.body.card.minute).toBe(25);
      expect(response.body.card.reason).toBe('Unsporting behavior');
      expect(response.body.card.playerId).toBeDefined();

      // Verify card was saved
      const card = await Card.findOne({ gameId: testGame._id, playerId: testPlayer._id });
      expect(card).toBeDefined();
      expect(card.cardType).toBe('yellow');

      // Yellow card should NOT trigger recalc-minutes job
      const jobs = await Job.find({ jobType: 'recalc-minutes' });
      expect(jobs.length).toBe(0);
    });

    it('should create a red card and trigger recalc-minutes job', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerId: testPlayer._id,
          cardType: 'red',
          minute: 60,
          reason: 'Serious foul play'
        })
        .expect(201);

      expect(response.body.card.cardType).toBe('red');

      // Red card SHOULD trigger recalc-minutes job
      const jobs = await Job.find({ jobType: 'recalc-minutes', 'payload.gameId': testGame._id.toString() });
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe('pending');
    });

    it('should create a second-yellow card and trigger recalc-minutes job', async () => {
      // First create a yellow card (required before second-yellow)
      await Card.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        cardType: 'yellow',
        minute: 50
      });

      const response = await request(app)
        .post(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerId: testPlayer._id,
          cardType: 'second-yellow',
          minute: 75
        })
        .expect(201);

      expect(response.body.card.cardType).toBe('second-yellow');

      // Second-yellow SHOULD trigger recalc-minutes job
      const jobs = await Job.find({ jobType: 'recalc-minutes', 'payload.gameId': testGame._id.toString() });
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should return 404 if player not found', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerId: fakePlayerId,
          cardType: 'yellow',
          minute: 25
        })
        .expect(404);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerId: testPlayer._id
          // Missing cardType and minute
        })
        .expect(400); // Route validation error (cardType validation runs before Mongoose)

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/games/:gameId/cards', () => {
    it('should get all cards for a game', async () => {
      // Create test cards
      await Card.create([
        { gameId: testGame._id, playerId: testPlayer._id, cardType: 'yellow', minute: 10 },
        { gameId: testGame._id, playerId: testPlayer._id, cardType: 'red', minute: 45 }
      ]);

      const response = await request(app)
        .get(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalCards).toBe(2);
      expect(response.body.cards).toHaveLength(2);
      expect(response.body.cards[0].minute).toBeLessThanOrEqual(response.body.cards[1].minute); // Sorted by minute
    });

    it('should return empty array if no cards exist', async () => {
      const response = await request(app)
        .get(`/api/games/${testGame._id}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalCards).toBe(0);
      expect(response.body.cards).toHaveLength(0);
    });
  });

  describe('GET /api/games/:gameId/cards/player/:playerId', () => {
    it('should get cards for a specific player', async () => {
      // Create cards for this player
      await Card.create([
        { gameId: testGame._id, playerId: testPlayer._id, cardType: 'yellow', minute: 15 },
        { gameId: testGame._id, playerId: testPlayer._id, cardType: 'yellow', minute: 30 }
      ]);

      const response = await request(app)
        .get(`/api/games/${testGame._id}/cards/player/${testPlayer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalCards).toBe(2);
      expect(response.body.playerId).toBe(testPlayer._id.toString());
    });
  });

  describe('PUT /api/games/:gameId/cards/:cardId', () => {
    it('should update a card successfully', async () => {
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        cardType: 'yellow',
        minute: 20,
        reason: 'Old reason'
      });

      const response = await request(app)
        .put(`/api/games/${testGame._id}/cards/${card._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardType: 'yellow',
          minute: 25,
          reason: 'New reason'
        })
        .expect(200);

      expect(response.body.card.reason).toBe('New reason');
      expect(response.body.card.minute).toBe(25);
    });

    it('should trigger recalc-minutes job when card type changes to red', async () => {
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        cardType: 'yellow',
        minute: 20
      });

      await request(app)
        .put(`/api/games/${testGame._id}/cards/${card._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardType: 'red',
          minute: 20
        })
        .expect(200);

      // Should trigger job
      const jobs = await Job.find({ jobType: 'recalc-minutes', 'payload.gameId': testGame._id.toString() });
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should return 404 if card not found', async () => {
      const fakeCardId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/games/${testGame._id}/cards/${fakeCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cardType: 'yellow',
          minute: 25
        })
        .expect(404);
    });
  });

  describe('DELETE /api/games/:gameId/cards/:cardId', () => {
    it('should delete a card successfully', async () => {
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        cardType: 'yellow',
        minute: 20
      });

      await request(app)
        .delete(`/api/games/${testGame._id}/cards/${card._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedCard = await Card.findById(card._id);
      expect(deletedCard).toBeNull();
    });

    it('should trigger recalc-minutes job when red card is deleted', async () => {
      const card = await Card.create({
        gameId: testGame._id,
        playerId: testPlayer._id,
        cardType: 'red',
        minute: 60
      });

      await request(app)
        .delete(`/api/games/${testGame._id}/cards/${card._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should trigger job
      const jobs = await Job.find({ jobType: 'recalc-minutes', 'payload.gameId': testGame._id.toString() });
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should return 404 if card not found', async () => {
      const fakeCardId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/games/${testGame._id}/cards/${fakeCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});


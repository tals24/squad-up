const express = require('express');
const router = express.Router();
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const playerMatchStatsController = require('../../controllers/games/playerMatchStatsController');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/games/:gameId/player-match-stats
 * Get all player match stats for a game
 */
router.get('/:gameId/player-match-stats', checkGameAccess, playerMatchStatsController.getAllPlayerMatchStats);

/**
 * GET /api/games/:gameId/player-match-stats/player/:playerId
 * Get player match stats for a specific player in a game
 */
router.get('/:gameId/player-match-stats/player/:playerId', checkGameAccess, playerMatchStatsController.getPlayerMatchStatsByPlayer);

/**
 * PUT /api/games/:gameId/player-match-stats/player/:playerId
 * Update or create player match stats (upsert pattern)
 */
router.put('/:gameId/player-match-stats/player/:playerId', checkGameAccess, playerMatchStatsController.updatePlayerMatchStats);

module.exports = router;

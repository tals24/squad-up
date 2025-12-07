/**
 * Game Player Statistics Routes
 * Provides real-time calculation of player stats (minutes, goals, assists)
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/games/gameController');

const router = express.Router();

/**
 * GET /api/games/:gameId/player-stats
 * Get consolidated player statistics (minutes, goals, assists) for all players
 * Calculates on-demand for instant display (not from GameReport)
 * 
 * This provides instant stats display while the worker persists data in background
 */
router.get('/:gameId/player-stats', authenticateJWT, checkGameAccess, gameController.getPlayerStats);

module.exports = router;


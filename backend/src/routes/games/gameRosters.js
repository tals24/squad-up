const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameRosterController = require('../../controllers/games/gameRosterController');

const router = express.Router();

/**
 * GET /api/game-rosters
 * Get all game rosters
 */
router.get('/', authenticateJWT, gameRosterController.getAllGameRosters);

/**
 * GET /api/game-rosters/game/:gameId
 * Get game rosters by game ID
 */
router.get('/game/:gameId', authenticateJWT, checkGameAccess, gameRosterController.getGameRostersByGame);

/**
 * GET /api/game-rosters/:rosterId
 * Get game roster by ID
 */
router.get('/:rosterId', authenticateJWT, gameRosterController.getGameRosterById);

/**
 * POST /api/game-rosters
 * Create new game roster entry
 */
router.post('/', authenticateJWT, gameRosterController.createGameRoster);

/**
 * PUT /api/game-rosters/:rosterId
 * Update game roster
 */
router.put('/:rosterId', authenticateJWT, gameRosterController.updateGameRoster);

/**
 * DELETE /api/game-rosters/:rosterId
 * Delete game roster
 */
router.delete('/:rosterId', authenticateJWT, gameRosterController.deleteGameRoster);

module.exports = router;

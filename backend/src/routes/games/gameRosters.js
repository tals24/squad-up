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
 * GET /api/game-rosters/:id
 * Get game roster by ID
 */
router.get('/:id', authenticateJWT, gameRosterController.getGameRosterById);

/**
 * POST /api/game-rosters
 * Create new game roster entry
 */
router.post('/', authenticateJWT, gameRosterController.createGameRoster);

/**
 * PUT /api/game-rosters/:id
 * Update game roster
 */
router.put('/:id', authenticateJWT, gameRosterController.updateGameRoster);

/**
 * DELETE /api/game-rosters/:id
 * Delete game roster
 */
router.delete('/:id', authenticateJWT, gameRosterController.deleteGameRoster);

module.exports = router;

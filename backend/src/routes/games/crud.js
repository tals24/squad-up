/**
 * Game CRUD Routes
 * Basic Create, Read, Update, Delete operations
 */

const express = require('express');
const { authenticateJWT, checkTeamAccess, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/games/gameController');

const router = express.Router();

/**
 * Get all games (with role-based filtering)
 * GET /api/games
 */
router.get('/', authenticateJWT, gameController.getAllGames);

/**
 * Get game by ID
 * GET /api/games/:id
 */
router.get('/:id', authenticateJWT, checkGameAccess, gameController.getGameById);

/**
 * Create new game
 * POST /api/games
 */
router.post('/', authenticateJWT, checkTeamAccess, gameController.createGame);

/**
 * Update game
 * PUT /api/games/:id
 */
router.put('/:id', authenticateJWT, checkGameAccess, gameController.updateGame);

/**
 * Delete game
 * DELETE /api/games/:id
 */
router.delete('/:id', authenticateJWT, checkTeamAccess, gameController.deleteGame);

module.exports = router;


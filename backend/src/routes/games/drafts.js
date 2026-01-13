/**
 * Game Draft Routes
 * Handles lineup drafts (Scheduled games) and report drafts (Played games)
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/games/gameController');

const router = express.Router();

/**
 * Get game draft (lineup or report)
 * GET /api/games/:gameId/draft
 */
router.get('/:gameId/draft', authenticateJWT, checkGameAccess, gameController.getGameDraft);

/**
 * Update game draft (lineup or report)
 * PUT /api/games/:gameId/draft
 */
router.put('/:gameId/draft', authenticateJWT, checkGameAccess, gameController.updateGameDraft);

module.exports = router;


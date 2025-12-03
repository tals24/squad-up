/**
 * Game Draft Routes
 * Handles lineup drafts (Scheduled games) and report drafts (Played games)
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/gameController');

const router = express.Router();

/**
 * Get game draft (lineup or report)
 * GET /api/games/:id/draft
 */
router.get('/:id/draft', authenticateJWT, checkGameAccess, gameController.getGameDraft);

/**
 * Update game draft (lineup or report)
 * PUT /api/games/:id/draft
 */
router.put('/:id/draft', authenticateJWT, checkGameAccess, gameController.updateGameDraft);

module.exports = router;


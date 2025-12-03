/**
 * Game Status Transition Routes
 * Handles game state changes (Scheduled → Played → Done)
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/gameController');

const router = express.Router();

/**
 * Start game (Scheduled → Played with lineup)
 * POST /api/games/:id/start-game
 */
router.post('/:id/start-game', authenticateJWT, checkGameAccess, gameController.startGame);

/**
 * Submit final report (Played → Done)
 * POST /api/games/:id/submit-report
 */
router.post('/:id/submit-report', authenticateJWT, checkGameAccess, gameController.submitFinalReport);

module.exports = router;


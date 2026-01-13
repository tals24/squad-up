/**
 * Game Status Transition Routes
 * Handles game state changes (Scheduled → Played → Done)
 */

const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameController = require('../../controllers/games/gameController');

const router = express.Router();

/**
 * Start game (Scheduled → Played with lineup)
 * POST /api/games/:gameId/start-game
 */
router.post('/:gameId/start-game', authenticateJWT, checkGameAccess, gameController.startGame);

/**
 * Submit final report (Played → Done)
 * POST /api/games/:gameId/submit-report
 */
router.post('/:gameId/submit-report', authenticateJWT, checkGameAccess, gameController.submitFinalReport);

module.exports = router;


/**
 * Game Routes
 * Defines endpoints and applies middleware
 * Delegates to gameController for business logic
 */

const express = require('express');
const { authenticateJWT, checkTeamAccess, checkGameAccess } = require('../middleware/jwtAuth');
const gameController = require('../controllers/gameController');
const { getMatchTimeline } = require('../services/timelineService');

const router = express.Router();

// ============================================================================
// CRUD Routes
// ============================================================================

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

// ============================================================================
// Draft Routes
// ============================================================================

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

// ============================================================================
// Status Transition Routes
// ============================================================================

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

// ============================================================================
// Timeline Route (uses service directly - no complex logic)
// ============================================================================

/**
 * Get match timeline
 * GET /api/games/:id/timeline
 */
router.get('/:id/timeline', authenticateJWT, checkGameAccess, async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const timeline = await getMatchTimeline(gameId);
    
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    next(error);
  }
});

module.exports = router;


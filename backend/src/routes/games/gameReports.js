const express = require('express');
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const gameReportController = require('../../controllers/games/gameReportController');

/**
 * Special middleware for routes that have gameId in request body instead of params
 * This temporarily sets gameId in params so checkGameAccess can be reused
 */
const checkGameAccessFromBody = async (req, res, next) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required in request body'
      });
    }
    
    // Temporarily set gameId in params for checkGameAccess
    req.params.gameId = gameId;
    
    // Call the main checkGameAccess middleware
    return checkGameAccess(req, res, next);
  } catch (error) {
    console.error('Game access check from body error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during access check'
    });
  }
};

const router = express.Router();

/**
 * GET /api/game-reports
 * Get all game reports (filtered by playedInGame)
 */
router.get('/', authenticateJWT, gameReportController.getAllGameReports);

/**
 * GET /api/game-reports/game/:gameId
 * Get game reports by game ID (filtered by playedInGame)
 */
router.get('/game/:gameId', authenticateJWT, checkGameAccess, gameReportController.getGameReportsByGame);

/**
 * GET /api/game-reports/:reportId
 * Get game report by ID
 */
router.get('/:reportId', authenticateJWT, gameReportController.getGameReportById);

/**
 * POST /api/game-reports
 * Create new game report
 */
router.post('/', authenticateJWT, gameReportController.createGameReport);

/**
 * PUT /api/game-reports/:reportId
 * Update game report
 */
router.put('/:reportId', authenticateJWT, gameReportController.updateGameReport);

/**
 * DELETE /api/game-reports/:reportId
 * Delete game report
 */
router.delete('/:reportId', authenticateJWT, gameReportController.deleteGameReport);

/**
 * POST /api/game-reports/batch
 * Batch create/update game reports (for final submission)
 */
router.post('/batch', authenticateJWT, checkGameAccessFromBody, gameReportController.batchUpdateGameReports);

module.exports = router;

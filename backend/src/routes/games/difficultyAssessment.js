const express = require('express');
const router = express.Router();
const { authenticateJWT, checkGameAccess } = require('../../middleware/jwtAuth');
const difficultyAssessmentController = require('../../controllers/games/difficultyAssessmentController');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/games/:gameId/difficulty-assessment
 * Get difficulty assessment for a game
 */
router.get('/:gameId/difficulty-assessment', checkGameAccess, difficultyAssessmentController.getDifficultyAssessment);

/**
 * PUT /api/games/:gameId/difficulty-assessment
 * Update difficulty assessment for a game
 */
router.put('/:gameId/difficulty-assessment', checkGameAccess, difficultyAssessmentController.updateDifficultyAssessment);

/**
 * DELETE /api/games/:gameId/difficulty-assessment
 * Remove difficulty assessment from a game
 */
router.delete('/:gameId/difficulty-assessment', checkGameAccess, difficultyAssessmentController.deleteDifficultyAssessment);

module.exports = router;

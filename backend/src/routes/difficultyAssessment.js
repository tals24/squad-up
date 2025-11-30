const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * GET /api/games/:gameId/difficulty-assessment
 * Get difficulty assessment for a game
 * Access: All authenticated users with game access
 */
router.get('/:gameId/difficulty-assessment', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: {
        difficultyAssessment: game.difficultyAssessment || null
      }
    });
  } catch (error) {
    console.error('Get difficulty assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch difficulty assessment'
    });
  }
});

/**
 * PUT /api/games/:gameId/difficulty-assessment
 * Update difficulty assessment for a game
 * Access: All authenticated users with game access
 * Validation: Only allowed when game status is 'Scheduled'
 */
router.put('/:gameId/difficulty-assessment', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { opponentStrength, matchImportance, externalConditions } = req.body;

    // Validate required fields
    if (opponentStrength === undefined || matchImportance === undefined || externalConditions === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All three parameters are required: opponentStrength, matchImportance, externalConditions'
      });
    }

    // Validate parameter ranges (1-5)
    const params = { opponentStrength, matchImportance, externalConditions };
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'number' || value < 1 || value > 5) {
        return res.status(400).json({
          success: false,
          error: `${key} must be a number between 1 and 5`
        });
      }
    }

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Only allow updates when game status is 'Scheduled'
    if (game.status !== 'Scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Difficulty assessment can only be updated for scheduled games'
      });
    }

    // Update difficulty assessment
    game.difficultyAssessment = {
      opponentStrength,
      matchImportance,
      externalConditions,
      assessedAt: new Date()
      // overallScore will be calculated by pre-save middleware
    };

    await game.save();

    res.json({
      success: true,
      data: {
        difficultyAssessment: game.difficultyAssessment
      },
      message: 'Difficulty assessment updated successfully'
    });
  } catch (error) {
    console.error('Update difficulty assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update difficulty assessment'
    });
  }
});

/**
 * DELETE /api/games/:gameId/difficulty-assessment
 * Remove difficulty assessment from a game
 * Access: All authenticated users with game access
 * Validation: Only allowed when game status is 'Scheduled'
 */
router.delete('/:gameId/difficulty-assessment', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Only allow deletion when game status is 'Scheduled'
    if (game.status !== 'Scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Difficulty assessment can only be deleted for scheduled games'
      });
    }

    // Remove difficulty assessment
    game.difficultyAssessment = {
      opponentStrength: null,
      matchImportance: null,
      externalConditions: null,
      overallScore: null,
      assessedAt: null
    };

    await game.save();

    res.json({
      success: true,
      message: 'Difficulty assessment removed successfully'
    });
  } catch (error) {
    console.error('Delete difficulty assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete difficulty assessment'
    });
  }
});

module.exports = router;


const difficultyAssessmentService = require('../../services/games/difficultyAssessmentService');

/**
 * GET /api/games/:gameId/difficulty-assessment
 * Get difficulty assessment for a game
 */
exports.getDifficultyAssessment = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const result = await difficultyAssessmentService.getDifficultyAssessment(gameId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get difficulty assessment error:', error);
    
    if (error.message === 'Game not found') {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch difficulty assessment'
    });
  }
};

/**
 * PUT /api/games/:gameId/difficulty-assessment
 * Update difficulty assessment for a game
 */
exports.updateDifficultyAssessment = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const result = await difficultyAssessmentService.updateDifficultyAssessment(gameId, req.body);

    res.json({
      success: true,
      data: result,
      message: 'Difficulty assessment updated successfully'
    });
  } catch (error) {
    console.error('Update difficulty assessment error:', error);
    
    if (error.message === 'Game not found') {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    if (error.message.includes('required') || error.message.includes('must be a number')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('can only be updated')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update difficulty assessment'
    });
  }
};

/**
 * DELETE /api/games/:gameId/difficulty-assessment
 * Remove difficulty assessment from a game
 */
exports.deleteDifficultyAssessment = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const result = await difficultyAssessmentService.deleteDifficultyAssessment(gameId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete difficulty assessment error:', error);
    
    if (error.message === 'Game not found') {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    if (error.message.includes('can only be deleted')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete difficulty assessment'
    });
  }
};


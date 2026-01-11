const Game = require('../../models/Game');

/**
 * Get difficulty assessment for a game
 * @param {String} gameId - Game ID
 * @returns {Object} Difficulty assessment
 */
exports.getDifficultyAssessment = async (gameId) => {
  const game = await Game.findById(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  return {
    difficultyAssessment: game.difficultyAssessment || null
  };
};

/**
 * Update difficulty assessment for a game
 * @param {String} gameId - Game ID
 * @param {Object} assessmentData - Assessment data
 * @returns {Object} Updated difficulty assessment
 */
exports.updateDifficultyAssessment = async (gameId, assessmentData) => {
  const { opponentStrength, matchImportance, externalConditions } = assessmentData;

  // Validate required fields
  if (opponentStrength === undefined || matchImportance === undefined || externalConditions === undefined) {
    throw new Error('All three parameters are required: opponentStrength, matchImportance, externalConditions');
  }

  // Validate parameter ranges (1-5)
  const params = { opponentStrength, matchImportance, externalConditions };
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== 'number' || value < 1 || value > 5) {
      throw new Error(`${key} must be a number between 1 and 5`);
    }
  }

  const game = await Game.findById(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  // Only allow updates when game status is 'Scheduled'
  if (game.status !== 'Scheduled') {
    throw new Error('Difficulty assessment can only be updated for scheduled games');
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

  return {
    difficultyAssessment: game.difficultyAssessment
  };
};

/**
 * Remove difficulty assessment from a game
 * @param {String} gameId - Game ID
 * @returns {Object} Success message
 */
exports.deleteDifficultyAssessment = async (gameId) => {
  const game = await Game.findById(gameId);

  if (!game) {
    throw new Error('Game not found');
  }

  // Only allow deletion when game status is 'Scheduled'
  if (game.status !== 'Scheduled') {
    throw new Error('Difficulty assessment can only be deleted for scheduled games');
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

  return { message: 'Difficulty assessment removed successfully' };
};


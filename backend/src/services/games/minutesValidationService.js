const Game = require('../../models/Game');
const { validateExtraTime, calculateTotalMatchDuration } = require('../minutesValidation');

/**
 * Update match duration (regular time + extra time)
 * @param {String} gameId - Game ID
 * @param {Object} durationData - Duration data
 * @returns {Object} Updated match duration
 */
exports.updateMatchDuration = async (gameId, durationData) => {
  const { regularTime, firstHalfExtraTime, secondHalfExtraTime } = durationData;
  
  const game = await Game.findById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }
  
  // Validate extra time values
  if (firstHalfExtraTime) {
    const validation = validateExtraTime(firstHalfExtraTime, 'first half');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }
  
  if (secondHalfExtraTime) {
    const validation = validateExtraTime(secondHalfExtraTime, 'second half');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }
  
  // Update match duration
  game.matchDuration = {
    regularTime: regularTime || 90,
    firstHalfExtraTime: firstHalfExtraTime || 0,
    secondHalfExtraTime: secondHalfExtraTime || 0
  };
  
  // Calculate and store total duration
  game.totalMatchDuration = calculateTotalMatchDuration(game.matchDuration);
  
  await game.save();
  
  return {
    matchDuration: game.matchDuration,
    totalMatchDuration: game.totalMatchDuration
  };
};


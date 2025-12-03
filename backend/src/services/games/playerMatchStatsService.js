const PlayerMatchStat = require('../../models/PlayerMatchStat');
const Player = require('../../models/Player');

/**
 * Get all player match stats for a game
 * @param {String} gameId - Game ID
 * @returns {Array} Player match stats
 */
exports.getAllPlayerMatchStats = async (gameId) => {
  const stats = await PlayerMatchStat.find({ gameId })
    .populate('playerId', 'fullName kitNumber position')
    .sort({ 'playerId': 1 });

  return stats;
};

/**
 * Get player match stats for a specific player in a game
 * @param {String} gameId - Game ID
 * @param {String} playerId - Player ID
 * @returns {Object} Player match stats
 */
exports.getPlayerMatchStatsByPlayer = async (gameId, playerId) => {
  const stats = await PlayerMatchStat.findOne({ gameId, playerId })
    .populate('playerId', 'fullName kitNumber position');

  if (!stats) {
    throw new Error('Player match stats not found');
  }

  return stats;
};

/**
 * Update or create player match stats (upsert pattern)
 * @param {String} gameId - Game ID
 * @param {String} playerId - Player ID
 * @param {Object} statsData - Stats data
 * @returns {Object} Player match stats
 */
exports.updatePlayerMatchStats = async (gameId, playerId, statsData) => {
  // Validate player exists
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const { fouls, shooting, passing, duels } = statsData;

  // Build update object (only include fields that are provided)
  const updateData = {
    gameId,
    playerId
  };

  if (fouls !== undefined) {
    updateData.fouls = fouls;
  }
  if (shooting !== undefined) {
    updateData.shooting = shooting;
  }
  if (passing !== undefined) {
    updateData.passing = passing;
  }
  if (duels !== undefined) {
    updateData.duels = duels;
  }

  // Upsert stats (create if doesn't exist, update if exists)
  const stats = await PlayerMatchStat.findOneAndUpdate(
    { gameId, playerId },
    updateData,
    { upsert: true, new: true, runValidators: true }
  );

  await stats.populate('playerId', 'fullName kitNumber position');

  return stats;
};


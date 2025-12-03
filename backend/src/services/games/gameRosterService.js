const GameRoster = require('../../models/GameRoster');

/**
 * Get all game rosters
 * @returns {Array} Game rosters
 */
exports.getAllGameRosters = async () => {
  const gameRosters = await GameRoster.find()
    .populate('game', 'gameTitle team')
    .populate('player', 'fullName kitNumber position')
    .sort({ 'game.gameTitle': 1, 'player.fullName': 1 });

  return gameRosters;
};

/**
 * Get game rosters by game ID
 * @param {String} gameId - Game ID
 * @returns {Array} Game rosters
 */
exports.getGameRostersByGame = async (gameId) => {
  const gameRosters = await GameRoster.find({ game: gameId })
    .populate('game', 'gameTitle team')
    .populate('player', 'fullName kitNumber position team age')
    .sort({ status: 1, 'player.fullName': 1 });

  return gameRosters;
};

/**
 * Get game roster by ID
 * @param {String} rosterId - Roster ID
 * @returns {Object} Game roster
 */
exports.getGameRosterById = async (rosterId) => {
  const gameRoster = await GameRoster.findById(rosterId)
    .populate('game', 'gameTitle team')
    .populate('player', 'fullName kitNumber position');

  if (!gameRoster) {
    throw new Error('Game roster not found');
  }

  return gameRoster;
};

/**
 * Create new game roster entry
 * @param {Object} rosterData - Roster data
 * @returns {Object} Created game roster
 */
exports.createGameRoster = async (rosterData) => {
  const { game, player, status } = rosterData;

  const gameRoster = new GameRoster({
    game,
    player,
    status: status || 'Not in Squad'
  });

  await gameRoster.save();
  await gameRoster.populate('game', 'gameTitle team');
  await gameRoster.populate('player', 'fullName kitNumber position');

  return gameRoster;
};

/**
 * Update game roster
 * @param {String} rosterId - Roster ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated game roster
 */
exports.updateGameRoster = async (rosterId, updateData) => {
  const { status } = updateData;

  const gameRoster = await GameRoster.findByIdAndUpdate(
    rosterId,
    { status },
    { new: true }
  )
  .populate('game', 'gameTitle team')
  .populate('player', 'fullName kitNumber position');

  if (!gameRoster) {
    throw new Error('Game roster not found');
  }

  return gameRoster;
};

/**
 * Delete game roster
 * @param {String} rosterId - Roster ID
 * @returns {Object} Deleted game roster
 */
exports.deleteGameRoster = async (rosterId) => {
  const gameRoster = await GameRoster.findByIdAndDelete(rosterId);

  if (!gameRoster) {
    throw new Error('Game roster not found');
  }

  return gameRoster;
};


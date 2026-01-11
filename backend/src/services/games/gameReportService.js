const GameReport = require('../../models/GameReport');
const GameRoster = require('../../models/GameRoster');
const { calculatePlayerMinutes } = require('./utils/minutesCalculation');
const { calculatePlayerGoalsAssists } = require('./utils/goalsAssistsCalculation');

/**
 * Get all game reports (filtered by playedInGame)
 * @returns {Array} Game reports
 */
exports.getAllGameReports = async () => {
  // Get all GameRoster entries where playedInGame is true
  const playedRosters = await GameRoster.find({ playedInGame: true })
    .select('game player')
    .lean();
  
  // Create a Set of player-game combinations that played
  const playedPlayerGameSet = new Set();
  playedRosters.forEach(roster => {
    const key = `${roster.game.toString()}-${roster.player.toString()}`;
    playedPlayerGameSet.add(key);
  });

  // Fetch all game reports
  const allGameReports = await GameReport.find()
    .populate('player', 'fullName kitNumber position')
    .populate('game', 'gameTitle opponent date')
    .populate('author', 'fullName role')
    .lean();

  // Filter reports to only include players who played
  const gameReports = allGameReports.filter(report => {
    const gameId = typeof report.game === 'object' ? report.game._id.toString() : report.game.toString();
    const playerId = typeof report.player === 'object' ? report.player._id.toString() : report.player.toString();
    const key = `${gameId}-${playerId}`;
    return playedPlayerGameSet.has(key);
  });

  // Sort by date descending
  gameReports.sort((a, b) => {
    const dateA = a.game?.date || a.createdAt || new Date(0);
    const dateB = b.game?.date || b.createdAt || new Date(0);
    return new Date(dateB) - new Date(dateA);
  });

  return gameReports;
};

/**
 * Get game reports by game ID (filtered by playedInGame)
 * @param {String} gameId - Game ID
 * @returns {Array} Game reports
 */
exports.getGameReportsByGame = async (gameId) => {
  // Get GameRoster entries for this game where playedInGame is true
  const playedRosters = await GameRoster.find({ 
    game: gameId, 
    playedInGame: true 
  })
    .select('player')
    .lean();
  
  const playedPlayerIds = playedRosters.map(roster => roster.player.toString());

  // Fetch game reports for this game, filtered to only players who played
  const gameReports = await GameReport.find({ 
    game: gameId,
    player: { $in: playedPlayerIds }
  })
    .populate('player', 'fullName kitNumber position')
    .populate('game', 'gameTitle opponent date')
    .populate('author', 'fullName role')
    .sort({ 'player.fullName': 1 });

  return gameReports;
};

/**
 * Get game report by ID
 * @param {String} reportId - Report ID
 * @returns {Object} Game report
 */
exports.getGameReportById = async (reportId) => {
  const gameReport = await GameReport.findById(reportId)
    .populate('player', 'fullName kitNumber position')
    .populate('game', 'gameTitle opponent date')
    .populate('author', 'fullName role');

  if (!gameReport) {
    throw new Error('Game report not found');
  }

  return gameReport;
};

/**
 * Create new game report
 * @param {Object} reportData - Report data
 * @param {Object} user - User creating the report
 * @returns {Object} Created game report
 */
exports.createGameReport = async (reportData, user) => {
  const { 
    player, 
    game, 
    minutesPlayed, 
    goals, 
    assists, 
    rating_physical, 
    rating_technical, 
    rating_tactical, 
    rating_mental, 
    notes 
  } = reportData;

  const gameReport = new GameReport({
    player,
    game,
    author: user._id,
    minutesPlayed: minutesPlayed || 0,
    goals: goals || 0,
    assists: assists || 0,
    rating_physical: rating_physical || 3,
    rating_technical: rating_technical || 3,
    rating_tactical: rating_tactical || 3,
    rating_mental: rating_mental || 3,
    notes
  });

  await gameReport.save();
  await gameReport.populate('player', 'fullName kitNumber position');
  await gameReport.populate('game', 'gameTitle opponent date');
  await gameReport.populate('author', 'fullName role');

  return gameReport;
};

/**
 * Update game report
 * @param {String} reportId - Report ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated game report
 */
exports.updateGameReport = async (reportId, updateData) => {
  const { 
    minutesPlayed, 
    goals, 
    assists, 
    rating_physical, 
    rating_technical, 
    rating_tactical, 
    rating_mental, 
    notes 
  } = updateData;

  const gameReport = await GameReport.findByIdAndUpdate(
    reportId,
    { 
      minutesPlayed, 
      goals, 
      assists, 
      rating_physical, 
      rating_technical, 
      rating_tactical, 
      rating_mental, 
      notes 
    },
    { new: true }
  )
  .populate('player', 'fullName kitNumber position')
  .populate('game', 'gameTitle opponent date')
  .populate('author', 'fullName role');

  if (!gameReport) {
    throw new Error('Game report not found');
  }

  return gameReport;
};

/**
 * Delete game report
 * @param {String} reportId - Report ID
 * @returns {Object} Deleted game report
 */
exports.deleteGameReport = async (reportId) => {
  const gameReport = await GameReport.findByIdAndDelete(reportId);

  if (!gameReport) {
    throw new Error('Game report not found');
  }

  return gameReport;
};

/**
 * Batch create/update game reports
 * @param {String} gameId - Game ID
 * @param {Array} reports - Array of report data
 * @param {Object} user - User creating/updating reports
 * @returns {Array} Created/updated game reports
 */
exports.batchUpdateGameReports = async (gameId, reports, user) => {
  // Validate input
  if (!gameId || !Array.isArray(reports)) {
    throw new Error('Invalid request format. Expected gameId and reports array');
  }

  // Strict validation: Reject any calculated fields from client
  const forbiddenFields = ['minutesPlayed', 'goals', 'assists'];
  const invalidFields = [];

  for (const reportData of reports) {
    for (const field of forbiddenFields) {
      if (reportData[field] !== undefined) {
        invalidFields.push(`${field} in report for playerId: ${reportData.playerId || 'unknown'}`);
      }
    }
  }

  if (invalidFields.length > 0) {
    const error = new Error('Server-calculated fields cannot be provided by client');
    error.details = invalidFields;
    throw error;
  }

  // Always calculate minutes (server is authoritative)
  let calculatedMinutesMap = {};
  try {
    calculatedMinutesMap = await calculatePlayerMinutes(gameId);
    console.log(`✅ Calculated minutes for game ${gameId}`);
  } catch (error) {
    console.error(`❌ Error calculating minutes:`, error);
    throw new Error('Failed to calculate player minutes. Please ensure game events are properly recorded.');
  }

  // Always calculate goals/assists (server is authoritative)
  let calculatedGoalsAssistsMap = {};
  try {
    calculatedGoalsAssistsMap = await calculatePlayerGoalsAssists(gameId);
    console.log(`✅ Calculated goals/assists for game ${gameId}`);
  } catch (error) {
    console.error(`❌ Error calculating goals/assists:`, error);
    throw new Error('Failed to calculate goals/assists. Please ensure goals are properly recorded.');
  }

  const results = [];

  for (const reportData of reports) {
    // Extract ONLY allowed fields from client
    const { 
      playerId, 
      notes, 
      rating_physical, 
      rating_technical, 
      rating_tactical, 
      rating_mental 
    } = reportData;
    
    // Validate required fields
    if (!playerId) {
      throw new Error('Missing required field: playerId');
    }
    
    // Get calculated values from server (authoritative)
    const calculatedMinutes = calculatedMinutesMap[playerId] || 0;
    const calculatedGoals = calculatedGoalsAssistsMap[playerId]?.goals || 0;
    const calculatedAssists = calculatedGoalsAssistsMap[playerId]?.assists || 0;
    
    // Determine calculation method for minutes
    const minutesCalculationMethod = calculatedMinutesMap[playerId] !== undefined 
      ? 'calculated' 
      : 'manual';
    
    // Use findOneAndUpdate with upsert for atomic operation
    const gameReport = await GameReport.findOneAndUpdate(
      { 
        game: gameId, 
        player: playerId 
      },
      {
        // Server-calculated fields (always from calculation services)
        minutesPlayed: calculatedMinutes,
        minutesCalculationMethod: minutesCalculationMethod,
        goals: calculatedGoals,
        assists: calculatedAssists,
        
        // Client-provided fields (user-editable)
        rating_physical: rating_physical !== undefined ? rating_physical : 3,
        rating_technical: rating_technical !== undefined ? rating_technical : 3,
        rating_tactical: rating_tactical !== undefined ? rating_tactical : 3,
        rating_mental: rating_mental !== undefined ? rating_mental : 3,
        notes: notes !== undefined ? notes : null,
        
        // Metadata
        author: user._id,
      },
      {
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true // Apply schema defaults on insert
      }
    );
    
    await gameReport.populate('player game author');
    results.push(gameReport);
  }

  return results;
};


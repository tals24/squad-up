/**
 * Game Service
 * Contains business logic for game operations
 * Orchestrates database operations, validations, and analytics
 */

const mongoose = require('mongoose');
const Game = require('../../models/Game');
const Team = require('../../models/Team');
const GameRoster = require('../../models/GameRoster');
const Player = require('../../models/Player');
const Job = require('../../models/Job');
const { recalculateGoalAnalytics } = require('./utils/goalAnalytics');
const { recalculateSubstitutionAnalytics } = require('./utils/substitutionAnalytics');
const { calculatePlayerMinutes } = require('./utils/minutesCalculation');
const { calculatePlayerGoalsAssists } = require('./utils/goalsAssistsCalculation');
const { calculateTotalMatchDuration } = require('./utils/minutesValidation');

/**
 * Get all games with role-based filtering
 */
exports.getAllGames = async (user) => {
  let query = {};

  // Apply role-based filtering
  if (user.role === 'Coach') {
    const teams = await Team.find({ coach: user._id });
    const teamIds = teams.map(team => team._id);
    query.team = { $in: teamIds };
  }

  const games = await Game.find(query)
    .populate('team', 'teamName season division')
    .sort({ date: -1 })
    .lean();

  // Add virtual fields manually since .lean() doesn't include them
  const gamesWithVirtuals = games.map(game => {
    const gameTitle = `${game.teamName} vs ${game.opponent}`;
    
    // Debug logging
    console.log('🔍 [gameService.getAllGames] Game matchDuration:', {
      gameId: game._id,
      status: game.status,
      matchDuration: game.matchDuration,
      hasMatchDuration: !!game.matchDuration,
      totalMatchDuration: game.totalMatchDuration
    });
    
    return {
      ...game,
      gameTitle: gameTitle
    };
  });

  console.log('🔍 [gameService] Sending games:', gamesWithVirtuals.map(g => ({ 
    id: g._id, 
    gameTitle: g.gameTitle, 
    teamName: g.teamName, 
    opponent: g.opponent,
    status: g.status,
    hasMatchDuration: !!g.matchDuration
  })));

  return gamesWithVirtuals;
};

/**
 * Populate game team if needed
 */
exports.populateGameTeam = async (game) => {
  if (!game.team || typeof game.team === 'string') {
    await game.populate('team', 'teamName season division');
  }
  return game;
};

/**
 * Create new game
 */
exports.createGame = async (gameData) => {
  // Get team details to populate required lookup fields
  const teamDoc = await Team.findById(gameData.team);
  if (!teamDoc) {
    throw new Error('Team not found');
  }

  // Create game with lookup fields from team
  const game = new Game({
    ...gameData,
    season: teamDoc.season,
    teamName: teamDoc.teamName
  });
  
  await game.save();
  await game.populate('team', 'teamName season division');
  return game;
};

/**
 * Update game with status change handling
 */
exports.updateGame = async (gameId, updateData) => {
  const { status, matchDuration, ...otherData } = updateData;
  
  // Build update object
  const update = { ...otherData };
  
  if (status) {
    update.status = status;
  }
  
  // Handle match duration
  if (matchDuration) {
    update.matchDuration = matchDuration;
    update.totalMatchDuration = calculateTotalMatchDuration(matchDuration);
    
    console.log('🔍 [gameService.updateGame] Calculated matchDuration:', {
      matchDuration: update.matchDuration,
      totalMatchDuration: update.totalMatchDuration
    });
  }

  // Fetch old game for status change detection
  const oldGame = await Game.findById(gameId);
  if (!oldGame) {
    throw new Error('Game not found');
  }

  const statusChangedToPlayed = status === 'Played' && oldGame.status !== 'Played';
  const statusChangedToDone = status === 'Done' && oldGame.status !== 'Done';

  // Update game
  const game = await Game.findByIdAndUpdate(gameId, update, { new: true })
    .populate('team', 'teamName season division');
  
  console.log('🔍 [gameService.updateGame] Saved game matchDuration:', {
    gameId: game._id,
    status: game.status,
    matchDuration: game.matchDuration,
    totalMatchDuration: game.totalMatchDuration
  });

  // Handle status changes
  if (statusChangedToPlayed || statusChangedToDone) {
    await this.handleStatusChangeToPlayed(game._id, status);
  }

  if (statusChangedToDone && game.ourScore !== undefined && game.opponentScore !== undefined) {
    await this.handleStatusChangeToDone(game._id, game.ourScore, game.opponentScore);
  }

  return game;
};

/**
 * Handle status change to Played or Done (create recalc job)
 */
exports.handleStatusChangeToPlayed = async (gameId, status) => {
  try {
    await Job.create({
      jobType: 'recalc-minutes',
      payload: { gameId },
      status: 'pending',
      runAt: new Date()
    });
    console.log(`📋 Created recalc-minutes job for game ${gameId} after status change to ${status}`);
  } catch (error) {
    console.error(`❌ Error creating recalc-minutes job:`, error);
    // Don't throw - this is a background job
  }
};

/**
 * Handle status change to Done (recalculate analytics)
 */
exports.handleStatusChangeToDone = async (gameId, ourScore, opponentScore) => {
  console.log('🎯 [gameService] Game marked as Done, recalculating analytics...');
  
  try {
    await recalculateGoalAnalytics(gameId, ourScore, opponentScore);
    console.log('✅ [gameService] Goal analytics recalculated successfully');
  } catch (error) {
    console.error('❌ [gameService] Error recalculating goal analytics:', error);
    // Don't throw - analytics can be recalculated later
  }

  try {
    await recalculateSubstitutionAnalytics(gameId, ourScore, opponentScore);
    console.log('✅ [gameService] Substitution analytics recalculated successfully');
  } catch (error) {
    console.error('❌ [gameService] Error recalculating substitution analytics:', error);
    // Don't throw - analytics can be recalculated later
  }
};

/**
 * Delete game
 */
exports.deleteGame = async (gameId) => {
  const game = await Game.findByIdAndDelete(gameId);
  if (!game) {
    throw new Error('Game not found');
  }
  return game;
};

/**
 * Start game - Move from Scheduled to Played with lineup
 */
exports.startGame = async (gameId, { rosters, formation, formationType }) => {
  if (!rosters || !formation) {
    throw new Error('Rosters and formation are required');
  }

  const game = await Game.findById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'Scheduled') {
    throw new Error('Can only start games with status "Scheduled"');
  }

  // Start atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update game status to "Played" and clear lineupDraft
    game.status = 'Played';
    game.lineupDraft = undefined;
    await game.save({ session });

    // Create GameRosters from lineupDraft
    const gameRosterPromises = Object.entries(rosters).map(async ([playerId, rosterStatus]) => {
      // Fetch player to get playerNumber
      const player = await Player.findById(playerId).session(session);
      
      if (!player) {
        console.warn(`⚠️ Player ${playerId} not found, skipping roster creation`);
        return null;
      }

      // Determine if player played in game
      // Starting Lineup always plays, Bench players only if subbed in (checked later by Job)
      const playedInGame = rosterStatus === 'Starting Lineup';

      const rosterData = {
        game: gameId,
        player: playerId,
        status: rosterStatus,  // Fixed: was 'rosterStatus', should be 'status'
        playedInGame: playedInGame,
        playerNumber: player.playerNumber,
        formation: formation,
        formationType: formationType
      };

      const gameRoster = new GameRoster(rosterData);
      return await gameRoster.save({ session });
    });

    const gameRosters = (await Promise.all(gameRosterPromises)).filter(r => r !== null);

    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Game ${gameId} started successfully. Created ${gameRosters.length} rosters.`);

    return {
      game,
      gameRosters
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error starting game:', error);
    throw error;
  }
};

/**
 * Get game draft (lineup or report)
 */
exports.getGameDraft = async (gameId) => {
  const game = await Game.findById(gameId).select('lineupDraft reportDraft status');
  
  if (!game) {
    throw new Error('Game not found');
  }

  const draft = game.status === 'Scheduled' 
    ? game.lineupDraft 
    : game.reportDraft;

  return draft || {};
};

/**
 * Update game draft (lineup or report)
 */
exports.updateGameDraft = async (gameId, draftData) => {
  const game = await Game.findById(gameId);
  
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.status === 'Scheduled') {
    game.lineupDraft = draftData;
  } else if (game.status === 'Played') {
    game.reportDraft = draftData;
  }

  await game.save();
  return game;
};

/**
 * Submit final report - Move from Played to Done
 */
exports.submitFinalReport = async (gameId, reportData) => {
  const game = await Game.findById(gameId);
  
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'Played') {
    throw new Error('Can only submit reports for games with status "Played"');
  }

  const { finalScore, matchDuration, teamSummary, difficultyRating, difficultyNotes } = reportData;

  if (!finalScore || !matchDuration) {
    throw new Error('Final score and match duration are required');
  }

  // Update game with final data
  game.ourScore = finalScore.ourScore;
  game.opponentScore = finalScore.opponentScore;
  game.matchDuration = matchDuration;
  game.totalMatchDuration = calculateTotalMatchDuration(matchDuration);
  game.teamPerformanceSummary = teamSummary?.teamPerformanceSummary;
  game.defenseSummary = teamSummary?.defenseSummary;
  game.attackSummary = teamSummary?.attackSummary;
  game.difficultyRating = difficultyRating;
  game.difficultyNotes = difficultyNotes;
  game.status = 'Done';
  game.reportDraft = undefined; // Clear draft

  await game.save();

  // Trigger analytics recalculation
  await this.handleStatusChangeToDone(gameId, game.ourScore, game.opponentScore);

  // Create job for minutes recalculation
  await this.handleStatusChangeToPlayed(gameId, 'Done');

  console.log(`✅ Final report submitted for game ${gameId}. Status: Done`);

  return {
    game
  };
};


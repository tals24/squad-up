const express = require('express');
const mongoose = require('mongoose');
const { authenticateJWT, checkTeamAccess, checkGameAccess } = require('../middleware/jwtAuth');
const Game = require('../models/Game');
const Team = require('../models/Team');
const GameRoster = require('../models/GameRoster');
const Player = require('../models/Player');
const { recalculateGoalAnalytics } = require('../services/goalAnalytics');
const { recalculateSubstitutionAnalytics } = require('../services/substitutionAnalytics');

const router = express.Router();

// Get all games (with role-based filtering)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;
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
      
      // 🔍 DEBUG: Log matchDuration for each game
      console.log('🔍 [Backend GET /games] Game matchDuration:', {
        gameId: game._id,
        status: game.status,
        matchDuration: game.matchDuration,
        hasMatchDuration: !!game.matchDuration,
        matchDurationType: typeof game.matchDuration,
        matchDurationKeys: game.matchDuration ? Object.keys(game.matchDuration) : null,
        totalMatchDuration: game.totalMatchDuration
      });
      
      console.log('🔍 Backend gameTitle generation:', {
        teamName: game.teamName,
        opponent: game.opponent,
        generatedTitle: gameTitle
      });
      return {
        ...game,
        gameTitle: gameTitle
      };
    });

    console.log('🔍 Backend sending games:', gamesWithVirtuals.map(g => ({ 
      id: g._id, 
      gameTitle: g.gameTitle, 
      teamName: g.teamName, 
      opponent: g.opponent,
      status: g.status,
      hasMatchDuration: !!g.matchDuration,
      matchDuration: g.matchDuration
    })));

    res.json({
      success: true,
      data: gamesWithVirtuals
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game by ID
router.get('/:id', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    // Game is already fetched and validated by checkGameAccess middleware
    const game = req.game;
    
    // Populate team if not already populated
    if (!game.team || typeof game.team === 'string') {
      await game.populate('team', 'teamName season division');
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Create new game
router.post('/', authenticateJWT, async (req, res) => {
  try {
    console.log('🔍 Create game request body:', req.body);
    const { team, opponent, date, location, status, gameType } = req.body;
    console.log('🔍 Extracted fields:', { team, opponent, date, location, status, gameType });

    // Get team details for lookups
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const game = new Game({
      team,
      season: teamDoc.season,
      teamName: teamDoc.teamName,
      opponent,
      date,
      location,
      status: status || 'Scheduled',
      gameType: gameType || 'League' // Use provided type or default to League
      // gameTitle is now calculated dynamically via virtual field
    });

    await game.save();
    await game.populate('team', 'teamName season division');

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game
router.put('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    // 🔍 DEBUG: Log request received
    console.log('🔍 [Backend PUT /games/:id] Request received:', {
      gameId: req.params.id,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      matchDurationInBody: req.body?.matchDuration,
      matchDurationType: typeof req.body?.matchDuration,
      fullBody: JSON.stringify(req.body)
    });
    
    const { 
      opponent, 
      date, 
      location, 
      status, 
      ourScore, 
      opponentScore, 
      defenseSummary, 
      midfieldSummary, 
      attackSummary, 
      generalSummary,
      matchDuration 
    } = req.body;

    // Prepare update object
    const updateData = {
      opponent,
      date,
      location,
      status,
      ourScore,
      opponentScore,
      defenseSummary,
      midfieldSummary,
      attackSummary,
      generalSummary
    };

    // Clear reportDraft when game transitions to "Done"
    if (status === 'Done') {
      updateData.reportDraft = null;
    }

    // If matchDuration is provided, update it
    if (matchDuration) {
      // 🔍 DEBUG: Log matchDuration being saved
      console.log('🔍 [Backend PUT /games/:id] Saving matchDuration:', {
        gameId: req.params.id,
        receivedMatchDuration: matchDuration,
        matchDurationType: typeof matchDuration,
        matchDurationKeys: matchDuration ? Object.keys(matchDuration) : null
      });
      
      updateData.matchDuration = {
        regularTime: matchDuration.regularTime || 90,
        firstHalfExtraTime: matchDuration.firstHalfExtraTime || 0,
        secondHalfExtraTime: matchDuration.secondHalfExtraTime || 0
      };
      
      // Calculate and store total match duration
      const { calculateTotalMatchDuration } = require('../services/minutesValidation');
      updateData.totalMatchDuration = calculateTotalMatchDuration(updateData.matchDuration);
      
      // 🔍 DEBUG: Log calculated values
      console.log('🔍 [Backend PUT /games/:id] Calculated matchDuration:', {
        matchDuration: updateData.matchDuration,
        totalMatchDuration: updateData.totalMatchDuration
      });
    } else {
      console.log('🔍 [Backend PUT /games/:id] No matchDuration provided in request');
    }

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('team', 'teamName season division');
    
    // 🔍 DEBUG: Log saved game
    console.log('🔍 [Backend PUT /games/:id] Saved game matchDuration:', {
      gameId: game._id,
      status: game.status,
      matchDuration: game.matchDuration,
      totalMatchDuration: game.totalMatchDuration
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // 🎯 GOAL ANALYTICS: Recalculate goal numbers and match states when game status changes to "Done"
    if (status === 'Done' && game.ourScore !== undefined && game.opponentScore !== undefined) {
      console.log('🎯 [Backend PUT /games/:id] Game marked as Done, recalculating goal analytics...');
      try {
        await recalculateGoalAnalytics(game._id, game.ourScore, game.opponentScore);
        console.log('✅ [Backend PUT /games/:id] Goal analytics recalculated successfully');
      } catch (error) {
        console.error('❌ [Backend PUT /games/:id] Error recalculating goal analytics:', error);
        // Don't fail the entire request if goal analytics recalculation fails
        // The game update was successful, just log the error
      }

      // 🎯 SUBSTITUTION ANALYTICS: Recalculate match states for substitutions when game status changes to "Done"
      console.log('🎯 [Backend PUT /games/:id] Game marked as Done, recalculating substitution analytics...');
      try {
        await recalculateSubstitutionAnalytics(game._id, game.ourScore, game.opponentScore);
        console.log('✅ [Backend PUT /games/:id] Substitution analytics recalculated successfully');
      } catch (error) {
        console.error('❌ [Backend PUT /games/:id] Error recalculating substitution analytics:', error);
        // Don't fail the entire request if substitution analytics recalculation fails
        // The game update was successful, just log the error
      }
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:id', authenticateJWT, checkTeamAccess, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/games/:gameId/draft
 * Save draft lineup for Scheduled games (autosave)
 * 
 * This endpoint:
 * 1. Validates user has access to the game (via checkGameAccess middleware)
 * 2. Validates game is in Scheduled status
 * 3. Saves draft lineup to game.lineupDraft field
 * 
 * Request Body:
 * {
 *   rosters: { playerId: status, ... } // e.g., { "68ce9c940d0528dbba21e570": "Starting Lineup", ... }
 * }
 */
router.put('/:gameId/draft', authenticateJWT, checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = req.game; // From checkGameAccess middleware

    // Route based on game status
    if (game.status === 'Scheduled') {
      // === EXISTING LINEUP DRAFT LOGIC ===
      const { rosters, formation, formationType } = req.body;

      // Validate request body - support both old format (just rosters) and new format (rosters + formation)
      if (!rosters || typeof rosters !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request format. Expected { rosters: { playerId: status, ... }, formation?: {...}, formationType?: string }'
        });
      }

      // Build draft object with rosters, formation, and formationType
      const draftData = {
        rosters: rosters,
        ...(formation && typeof formation === 'object' ? { formation: formation } : {}),
        ...(formationType ? { formationType: formationType } : {})
      };

      // Update game with draft
      game.lineupDraft = draftData;
      await game.save();

      return res.json({
        success: true,
        message: 'Lineup draft saved successfully',
        data: {
          gameId: game._id,
          draftSaved: true,
          hasFormation: !!formation
        }
      });

    } else if (game.status === 'Played') {
      // === NEW REPORT DRAFT LOGIC ===
      const { teamSummary, finalScore, matchDuration, playerReports } = req.body;

      // Validate at least one field is provided
      const hasData = teamSummary || finalScore || matchDuration || playerReports;
      if (!hasData) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request format. Expected at least one of: { teamSummary?, finalScore?, matchDuration?, playerReports? }'
        });
      }

      // Build draft object (only include provided fields)
      const draftData = {};
      if (teamSummary && typeof teamSummary === 'object') {
        draftData.teamSummary = {
          ...(teamSummary.defenseSummary !== undefined ? { defenseSummary: teamSummary.defenseSummary } : {}),
          ...(teamSummary.midfieldSummary !== undefined ? { midfieldSummary: teamSummary.midfieldSummary } : {}),
          ...(teamSummary.attackSummary !== undefined ? { attackSummary: teamSummary.attackSummary } : {}),
          ...(teamSummary.generalSummary !== undefined ? { generalSummary: teamSummary.generalSummary } : {})
        };
        // Remove empty teamSummary if no fields
        if (Object.keys(draftData.teamSummary).length === 0) {
          delete draftData.teamSummary;
        }
      }

      if (finalScore && typeof finalScore === 'object') {
        draftData.finalScore = {
          ...(finalScore.ourScore !== undefined ? { ourScore: finalScore.ourScore } : {}),
          ...(finalScore.opponentScore !== undefined ? { opponentScore: finalScore.opponentScore } : {})
        };
        if (Object.keys(draftData.finalScore).length === 0) {
          delete draftData.finalScore;
        }
      }

      if (matchDuration && typeof matchDuration === 'object') {
        draftData.matchDuration = {
          ...(matchDuration.regularTime !== undefined ? { regularTime: matchDuration.regularTime } : {}),
          ...(matchDuration.firstHalfExtraTime !== undefined ? { firstHalfExtraTime: matchDuration.firstHalfExtraTime } : {}),
          ...(matchDuration.secondHalfExtraTime !== undefined ? { secondHalfExtraTime: matchDuration.secondHalfExtraTime } : {})
        };
        if (Object.keys(draftData.matchDuration).length === 0) {
          delete draftData.matchDuration;
        }
      }

      if (playerReports && typeof playerReports === 'object') {
        draftData.playerReports = playerReports;
      }

      // Merge with existing draft (preserve fields not in this request)
      const existingDraft = game.reportDraft || {};
      game.reportDraft = {
        ...existingDraft,
        ...draftData
      };

      await game.save();

      return res.json({
        success: true,
        message: 'Report draft saved successfully',
        data: {
          gameId: game._id,
          draftSaved: true,
          hasTeamSummary: !!draftData.teamSummary,
          hasFinalScore: !!draftData.finalScore,
          hasMatchDuration: !!draftData.matchDuration,
          playerReportsCount: draftData.playerReports ? Object.keys(draftData.playerReports).length : 0
        }
      });

    } else {
      // Invalid status for drafts
      return res.status(400).json({
        success: false,
        error: `Cannot save draft for game with status: ${game.status}. Drafts are only allowed for Scheduled or Played games.`
      });
    }

  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
      message: error.message
    });
  }
});

/**
 * Validate lineup before starting game
 * @param {Array} rosters - Array of roster entries
 * @param {String} gameId - Game ID
 * @param {Object} session - MongoDB session for transaction
 * @returns {Object} - { isValid: boolean, error?: string, details?: object }
 */
async function validateLineup(rosters, gameId, session) {
  // Count players by status
  const statusCounts = {
    'Starting Lineup': 0,
    'Bench': 0,
    'Unavailable': 0,
    'Not in Squad': 0
  };

  const startingLineupPlayers = [];
  const playerIds = new Set();

  // Validate each roster entry
  for (const roster of rosters) {
    const { playerId, status } = roster;

    // Validate required fields
    if (!playerId) {
      return {
        isValid: false,
        error: 'Missing playerId in roster entry',
        details: { roster }
      };
    }

    // Validate status
    const validStatuses = ['Starting Lineup', 'Bench', 'Unavailable', 'Not in Squad'];
    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        details: { playerId, status }
      };
    }

    // Check for duplicate players
    if (playerIds.has(playerId)) {
      return {
        isValid: false,
        error: `Duplicate player in roster: ${playerId}`,
        details: { playerId }
      };
    }
    playerIds.add(playerId);

    // Validate player exists
    const player = await Player.findById(playerId).session(session);
    if (!player) {
      return {
        isValid: false,
        error: `Player not found: ${playerId}`,
        details: { playerId }
      };
    }

    // Count by status
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }

    // Collect starting lineup players
    if (status === 'Starting Lineup') {
      startingLineupPlayers.push(player);
    }
  }

  // Validation 1: Must have exactly 11 starting lineup players
  if (statusCounts['Starting Lineup'] !== 11) {
    return {
      isValid: false,
      error: `Invalid starting lineup. Expected 11 players, got ${statusCounts['Starting Lineup']}`,
      details: {
        expected: 11,
        actual: statusCounts['Starting Lineup']
      }
    };
  }

  // Validation 2: Must have at least one goalkeeper in starting lineup
  const hasGoalkeeper = startingLineupPlayers.some(player => {
    const position = (player.position || '').toLowerCase();
    return position === 'gk' || position === 'goalkeeper' || position.includes('goalkeeper');
  });

  if (!hasGoalkeeper) {
    return {
      isValid: false,
      error: 'Starting lineup must include at least one goalkeeper',
      details: {
        startingLineupCount: startingLineupPlayers.length,
        positions: startingLineupPlayers.map(p => p.position)
      }
    };
  }

  // All validations passed
  return {
    isValid: true,
    details: {
      startingLineupCount: statusCounts['Starting Lineup'],
      benchCount: statusCounts['Bench'],
      totalPlayers: rosters.length
    }
  };
}

/**
 * POST /api/games/:gameId/start-game
 * Atomically transition game from Scheduled to Played and save final lineup
 * 
 * This endpoint:
 * 1. Validates user has access to the game (via checkGameAccess middleware)
 * 2. Validates the lineup (11 starters, goalkeeper, etc.)
 * 3. Uses MongoDB transaction to atomically:
 *    - Update game status to 'Played'
 *    - Save/update all roster entries
 * 4. Returns success or detailed error
 * 
 * Request Body:
 * {
 *   rosters: [
 *     {
 *       playerId: string,
 *       status: 'Starting Lineup' | 'Bench' | 'Unavailable' | 'Not in Squad',
 *       playerName?: string,  // Optional, will be populated if missing
 *       gameTitle?: string,   // Optional, will be populated if missing
 *       rosterEntry?: string  // Optional, will be auto-generated if missing
 *     }
 *   ]
 * }
 */
router.post('/:gameId/start-game', authenticateJWT, checkGameAccess, async (req, res) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000; // 1 second delay between retries
  
  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    console.time(`Full start-game transaction (attempt ${attempt})`);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { gameId } = req.params;
      const { rosters } = req.body;

      console.log(`🚀 [start-game] Starting transaction (attempt ${attempt}/${MAX_RETRIES}):`, {
        gameId,
        rosterCount: rosters?.length || 0,
        gameStatus: req.game?.status,
        timestamp: new Date().toISOString()
      });

      // Get game from middleware (already validated and attached)
      // Need to re-fetch game in transaction to get latest version
      const game = await Game.findById(gameId).session(session);
      if (!game) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Game not found'
        });
      }

    // Step 1: Validate request body
    if (!rosters || !Array.isArray(rosters)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid request format. Expected { rosters: [{ playerId, status, ... }] }'
      });
    }

    // Step 2: Check if game is already Played (idempotency)
    if (game.status === 'Played') {
      // Check if lineup already exists and matches
      const existingRosters = await GameRoster.find({ game: gameId }).session(session);
      
      // If rosters exist, return success (idempotent)
      if (existingRosters.length > 0) {
        await session.abortTransaction();
        return res.status(200).json({
          success: true,
          message: 'Game is already started',
          data: {
            game: {
              _id: game._id,
              status: game.status
            },
            rosters: existingRosters,
            alreadyStarted: true
          }
        });
      }
      
      // If game is Played but no rosters, allow update (recovery scenario)
      // Continue with transaction...
    }

    // Step 3: Validate game can be started
    if (game.status !== 'Scheduled' && game.status !== 'Played') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: `Game cannot be started. Current status: ${game.status}. Only 'Scheduled' or 'Played' games can be started.`
      });
    }

    // Step 4: Backend validation of lineup
    console.time('Lineup validation');
    const validationResult = await validateLineup(rosters, gameId, session);
    console.timeEnd('Lineup validation');
    
    if (!validationResult.isValid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: validationResult.error,
        details: validationResult.details
      });
    }

    // Step 5: Prepare roster entries for upsert
    const rosterEntries = [];

    for (const rosterData of rosters) {
      const { playerId, status } = rosterData;

      // Validate player exists (for better error messages)
      if (playerId) {
        const player = await Player.findById(playerId).session(session);
        if (!player) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            error: `Player not found: ${playerId}`
          });
        }
      }

      rosterEntries.push({
        game: gameId,
        player: playerId,
        status: status || 'Not in Squad'
        // ✅ Removed: playerName, gameTitle, rosterEntry (denormalized fields)
      });
    }

    // Step 6: Upsert all roster entries (within transaction)
    console.time('Roster save loop');
    const rosterResults = [];
    for (const rosterData of rosterEntries) {
      // Use findOneAndUpdate with upsert for atomic operation
      const gameRoster = await GameRoster.findOneAndUpdate(
        { game: rosterData.game, player: rosterData.player },
        {
          status: rosterData.status
          // ✅ Only save: game, player, status (denormalized fields removed)
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session // Include session for transaction
        }
      );

      rosterResults.push(gameRoster);
    }
    console.timeEnd('Roster save loop');
    console.log(`✅ [start-game] Saved ${rosterResults.length} roster entries`);

    // Step 7: Update game status to 'Played' AND clear draft (within transaction)
    console.time('Game status save');
    game.status = 'Played';
    game.lineupDraft = null; // ✅ Clear draft when game is finalized
    await game.save({ session });
    console.timeEnd('Game status save');
    console.log('✅ [start-game] Game status updated to Played, draft cleared');

    // Step 8: Commit transaction
    console.time('Transaction commit');
    await session.commitTransaction();
    console.timeEnd('Transaction commit');
    console.log('✅ [start-game] Transaction committed successfully');

    // Step 9: Populate references for response (after transaction)
    console.time('Populate references');
    await Promise.all(
      rosterResults.map(roster => 
        roster.populate('game player')
      )
    );
    console.timeEnd('Populate references');

    const responseData = {
      success: true,
      message: 'Game started successfully',
      data: {
        game: {
          _id: game._id,
          status: game.status,
          gameTitle: game.gameTitle || `${game.teamName} vs ${game.opponent}`,
          lineupDraft: null // Explicitly set to null
        },
        rosters: rosterResults,
        rosterCount: rosterResults.length
      }
    };

    console.timeEnd(`Full start-game transaction (attempt ${attempt})`);
    console.log('✅ [start-game] Request completed successfully:', {
      gameId: game._id,
      status: game.status,
      rosterCount: rosterResults.length,
      attempt,
      totalTime: 'See console.time output above'
    });

    // Success! End session and return response
    session.endSession();
    return res.status(200).json(responseData);

    } catch (error) {
      // Abort transaction on any error
      await session.abortTransaction();
      
      console.timeEnd(`Full start-game transaction (attempt ${attempt})`);
      
      // Check if this is a write conflict error that can be retried
      const isWriteConflict = error.message && (
        error.message.includes('Write conflict') ||
        error.message.includes('writeConflict') ||
        error.code === 112 // MongoDB WriteConflict error code
      );
      
      if (isWriteConflict && attempt < MAX_RETRIES) {
        lastError = error;
        console.warn(`⚠️ [start-game] Write conflict detected (attempt ${attempt}/${MAX_RETRIES}), retrying...`, {
          error: error.message,
          gameId: req.params.gameId,
          willRetry: true,
          retryDelay: RETRY_DELAY_MS
        });
        
        // Clean up session before retry
        session.endSession();
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue; // Retry the transaction
      }
      
      // Non-retryable error or max retries reached
      console.error(`❌ [start-game] Error starting game (attempt ${attempt}/${MAX_RETRIES}):`, {
        error: error.message,
        stack: error.stack,
        gameId: req.params.gameId,
        timestamp: new Date().toISOString(),
        isWriteConflict,
        willRetry: false
      });
      
      session.endSession();
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: 'Failed to start game',
        message: attempt >= MAX_RETRIES 
          ? `Failed after ${MAX_RETRIES} attempts. ${error.message}` 
          : error.message
      });
    }
  }
  
  // If we get here, all retries failed
  if (lastError) {
    return res.status(500).json({
      success: false,
      error: 'Failed to start game after retries',
      message: lastError.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Substitution = require('../models/Substitution');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Job = require('../models/Job');
const Goal = require('../models/Goal');
const Card = require('../models/Card');
const GameRoster = require('../models/GameRoster');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');
const { validateSubstitutionEligibility, validateFutureConsistency, getPlayerStateAtMinute, PlayerState, getMatchTimeline } = require('../services/gameRules');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/substitutions
 * Create a new substitution for a game
 */
router.post('/:gameId/substitutions', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      playerOutId,
      playerInId,
      minute,
      reason,
      matchState,
      tacticalNote
    } = req.body;

    // Game access already validated by checkGameAccess middleware
    const game = req.game;

    // Validate players exist
    const playerOut = await Player.findById(playerOutId);
    if (!playerOut) {
      return res.status(404).json({ message: 'Player leaving field not found' });
    }

    const playerIn = await Player.findById(playerInId);
    if (!playerIn) {
      return res.status(404).json({ message: 'Player entering field not found' });
    }

    // ✅ DEBUG: Log all existing events before validation
    const [allGoals, allSubstitutions, allCards] = await Promise.all([
      Goal.find({ gameId }).populate('scorerId', 'fullName').populate('assistedById', 'fullName').lean(),
      Substitution.find({ gameId }).populate('playerOutId', 'fullName').populate('playerInId', 'fullName').lean(),
      Card.find({ gameId }).populate('playerId', 'fullName').lean()
    ]);

    console.log('\n🔄 ========== CREATING SUBSTITUTION ==========');
    console.log(`📅 New Sub: Minute ${minute}, ${playerOut.fullName} OUT → ${playerIn.fullName} IN`);
    console.log('\n📊 ALL EXISTING EVENTS:');
    
    console.log('\n⚽ GOALS:');
    allGoals.forEach(g => {
      const scorerName = g.scorerId?.fullName || g.scorerId || 'Opponent Goal';
      const assisterName = g.assistedById?.fullName || g.assistedById || '';
      console.log(`  - Min ${g.minute}: ${scorerName}${assisterName ? ` (assisted by ${assisterName})` : ''}`);
    });
    
    console.log('\n🔄 SUBSTITUTIONS:');
    allSubstitutions.forEach(s => {
      const playerOutName = s.playerOutId?.fullName || s.playerOutId || 'Unknown';
      const playerInName = s.playerInId?.fullName || s.playerInId || 'Unknown';
      console.log(`  - Min ${s.minute}: ${playerOutName} OUT → ${playerInName} IN`);
    });
    
    console.log('\n🟨🟥 CARDS:');
    allCards.forEach(c => {
      const playerName = c.playerId?.fullName || c.playerId || 'Unknown';
      console.log(`  - Min ${c.minute}: ${playerName} - ${c.cardType.toUpperCase()}`);
    });
    
    // ✅ DEBUG: Show all players' states at the target minute
    const timeline = await getMatchTimeline(gameId);
    const rosters = await GameRoster.find({ game: gameId, status: { $in: ['Starting Lineup', 'Bench'] } }).lean();
    const startingLineup = {};
    const squadPlayers = {};
    rosters.forEach(roster => {
      const playerId = roster.player?.toString() || roster.player?._id?.toString();
      if (playerId) {
        squadPlayers[playerId] = roster.status;
        if (roster.status === 'Starting Lineup') {
          startingLineup[playerId] = true;
        }
      }
    });
    
    console.log('\n👥 ALL PLAYERS STATUS AT MINUTE', minute, ':');
    const allPlayers = await Player.find({ _id: { $in: Object.keys(squadPlayers) } }).lean();
    for (const player of allPlayers) {
      const playerId = player._id.toString();
      const state = getPlayerStateAtMinute(timeline, playerId, minute, startingLineup, squadPlayers);
      const playerName = player.fullName || player.name || 'Unknown';
      const rosterStatus = squadPlayers[playerId] || 'Not in Squad';
      console.log(`  - ${playerName} (${rosterStatus}): ${state}`);
    }
    console.log('==========================================\n');

    // ✅ GAME RULES VALIDATION: Validate substitution eligibility
    const subValidation = await validateSubstitutionEligibility(gameId, playerOutId, playerInId, minute);
    if (!subValidation.valid) {
      return res.status(400).json({
        message: 'Invalid substitution',
        error: subValidation.error
      });
    }

    // ✅ FUTURE CONSISTENCY CHECK: Prevent out-of-order event corruption
    const futureConsistency = await validateFutureConsistency(gameId, {
      type: 'substitution',
      minute,
      playerOutId,
      playerInId
    });
    if (!futureConsistency.valid) {
      return res.status(400).json({
        message: 'Invalid substitution',
        error: futureConsistency.error
      });
    }

    // Create substitution
    const substitution = new Substitution({
      gameId,
      playerOutId,
      playerInId,
      minute,
      reason: reason || 'tactical',
      matchState: matchState || 'drawing',
      tacticalNote: tacticalNote || ''
    });

    await substitution.save();

    // ✅ Create job for minutes recalculation (non-blocking)
    try {
      await Job.create({
        jobType: 'recalc-minutes',
        payload: { gameId: gameId },
        status: 'pending',
        runAt: new Date() // Process immediately
      });
      console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution creation`);
    } catch (error) {
      // Log but don't fail the request if job creation fails
      console.error(`❌ Error creating recalc-minutes job:`, error);
    }

    // Populate references for response
    await substitution.populate([
      { path: 'playerOutId', select: 'fullName kitNumber position' },
      { path: 'playerInId', select: 'fullName kitNumber position' }
    ]);

    res.status(201).json({
      message: 'Substitution created successfully',
      substitution
    });
  } catch (error) {
    console.error('Error creating substitution:', error);
    res.status(500).json({ 
      message: 'Failed to create substitution', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/substitutions
 * Get all substitutions for a game
 */
router.get('/:gameId/substitutions', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Game access already validated by checkGameAccess middleware
    const game = req.game;

    // Get all substitutions for the game, sorted by minute
    const substitutions = await Substitution.find({ gameId })
      .sort({ minute: 1 })
      .populate('playerOutId', 'fullName kitNumber position')
      .populate('playerInId', 'fullName kitNumber position');

    res.json({
      gameId,
      totalSubstitutions: substitutions.length,
      substitutions
    });
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch substitutions', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/games/:gameId/substitutions/:subId
 * Update an existing substitution
 */
router.put('/:gameId/substitutions/:subId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, subId } = req.params;
    const {
      playerOutId,
      playerInId,
      minute,
      reason,
      matchState,
      tacticalNote
    } = req.body;

    // Find substitution
    const substitution = await Substitution.findOne({ _id: subId, gameId });
    if (!substitution) {
      return res.status(404).json({ message: 'Substitution not found' });
    }

    // Validate players if changed
    if (playerOutId && playerOutId !== substitution.playerOutId.toString()) {
      const playerOut = await Player.findById(playerOutId);
      if (!playerOut) {
        return res.status(404).json({ message: 'Player leaving field not found' });
      }
      substitution.playerOutId = playerOutId;
    }

    if (playerInId && playerInId !== substitution.playerInId.toString()) {
      const playerIn = await Player.findById(playerInId);
      if (!playerIn) {
        return res.status(404).json({ message: 'Player entering field not found' });
      }
      substitution.playerInId = playerInId;
    }

    // ✅ GAME RULES VALIDATION: Validate substitution eligibility if players or minute changed
    const finalMinute = minute !== undefined ? minute : substitution.minute;
    const finalPlayerOutId = playerOutId !== undefined ? playerOutId : substitution.playerOutId.toString();
    const finalPlayerInId = playerInId !== undefined ? playerInId : substitution.playerInId.toString();
    
    if (playerOutId !== undefined || playerInId !== undefined || minute !== undefined) {
      const subValidation = await validateSubstitutionEligibility(gameId, finalPlayerOutId, finalPlayerInId, finalMinute);
      if (!subValidation.valid) {
        return res.status(400).json({
          message: 'Invalid substitution',
          error: subValidation.error
        });
      }
    }

    // Update other fields
    if (minute !== undefined) substitution.minute = minute;
    if (reason !== undefined) substitution.reason = reason;
    if (matchState !== undefined) substitution.matchState = matchState;
    if (tacticalNote !== undefined) substitution.tacticalNote = tacticalNote;

    await substitution.save();

    // ✅ Create job for minutes recalculation
    try {
      await Job.create({
        jobType: 'recalc-minutes',
        payload: { gameId: gameId },
        status: 'pending',
        runAt: new Date()
      });
      console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution update`);
    } catch (error) {
      console.error(`❌ Error creating recalc-minutes job:`, error);
    }

    // Populate references for response
    await substitution.populate([
      { path: 'playerOutId', select: 'fullName kitNumber position' },
      { path: 'playerInId', select: 'fullName kitNumber position' }
    ]);

    res.json({
      message: 'Substitution updated successfully',
      substitution
    });
  } catch (error) {
    console.error('Error updating substitution:', error);
    res.status(500).json({ 
      message: 'Failed to update substitution', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/games/:gameId/substitutions/:subId
 * Delete a substitution
 */
router.delete('/:gameId/substitutions/:subId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, subId } = req.params;

    // Find and delete substitution
    const substitution = await Substitution.findOneAndDelete({ _id: subId, gameId });
    if (!substitution) {
      return res.status(404).json({ message: 'Substitution not found' });
    }

    // ✅ Create job for minutes recalculation
    try {
      await Job.create({
        jobType: 'recalc-minutes',
        payload: { gameId: gameId },
        status: 'pending',
        runAt: new Date()
      });
      console.log(`📋 Created recalc-minutes job for game ${gameId} after substitution deletion`);
    } catch (error) {
      console.error(`❌ Error creating recalc-minutes job:`, error);
    }

    res.json({
      message: 'Substitution deleted successfully',
      substitutionId: subId
    });
  } catch (error) {
    console.error('Error deleting substitution:', error);
    res.status(500).json({ 
      message: 'Failed to delete substitution', 
      error: error.message 
    });
  }
});

module.exports = router;


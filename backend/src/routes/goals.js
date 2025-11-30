const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { TeamGoal, OpponentGoal } = require('../models/Goal');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Substitution = require('../models/Substitution');
const Card = require('../models/Card');
const GameRoster = require('../models/GameRoster');
const { authenticateJWT, checkGameAccess } = require('../middleware/jwtAuth');
const { validateGoalEligibility, getPlayerStateAtMinute, PlayerState, getMatchTimeline } = require('../services/gameRules');

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * POST /api/games/:gameId/goals
 * Create a new goal for a game
 */
router.post('/:gameId/goals', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      minute,
      scorerId,
      assistedById,
      goalInvolvement,
      goalType,
      isOpponentGoal = false
    } = req.body;

    // Game access already validated by checkGameAccess middleware
    const game = req.game;

    let goal;

    // Create appropriate goal type based on isOpponentGoal flag
    if (isOpponentGoal) {
      // Create OpponentGoal - needs minute and goalType
      goal = new OpponentGoal({
        gameId,
        minute,
        goalType: goalType || 'open-play'
        // goalNumber and matchState will be calculated when game status = "Done"
      });
    } else {
      // Create TeamGoal - requires scorer UNLESS it's an own goal
      if (!scorerId && goalType !== 'own-goal') {
        return res.status(400).json({ message: 'Scorer is required for team goals' });
      }

      // Validate scorer exists (only if provided)
      if (scorerId) {
        const scorer = await Player.findById(scorerId);
        if (!scorer) {
          return res.status(404).json({ message: 'Scorer not found' });
        }
      }

      // Validate assister if provided
      if (assistedById) {
        const assister = await Player.findById(assistedById);
        if (!assister) {
          return res.status(404).json({ message: 'Assister not found' });
        }
      }

    // Validate goal involvement players if provided
    if (goalInvolvement && goalInvolvement.length > 0) {
      for (const involvement of goalInvolvement) {
        const player = await Player.findById(involvement.playerId);
        if (!player) {
          return res.status(404).json({ 
            message: `Player ${involvement.playerId} not found in goal involvement` 
          });
        }
      }
    }

    // ✅ DEBUG: Log all existing events before validation
    const [allGoals, allSubstitutions, allCards] = await Promise.all([
      Goal.find({ gameId }).populate('scorerId', 'fullName').populate('assistedById', 'fullName').lean(),
      Substitution.find({ gameId }).populate('playerOutId', 'fullName').populate('playerInId', 'fullName').lean(),
      Card.find({ gameId }).populate('playerId', 'fullName').lean()
    ]);

    console.log('\n🎯 ========== CREATING GOAL ==========');
    console.log(`📅 New Goal: Minute ${minute}, Scorer: ${scorerId ? (await Player.findById(scorerId))?.fullName || scorerId : 'N/A'}, Assister: ${assistedById ? (await Player.findById(assistedById))?.fullName || assistedById : 'N/A'}`);
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
    console.log('=====================================\n');

    // ✅ GAME RULES VALIDATION: Validate scorer and assister eligibility (only for team goals with scorer)
    if (!isOpponentGoal && scorerId) {
      const goalValidation = await validateGoalEligibility(gameId, scorerId, assistedById || null, minute);
      if (!goalValidation.valid) {
        return res.status(400).json({
          message: 'Invalid goal assignment',
          error: goalValidation.error
        });
      }
    }

      // Create TeamGoal
      goal = new TeamGoal({
        gameId,
        minute,
        scorerId: scorerId || null, // Allow null for own goals
        assistedById: assistedById || null,
        goalInvolvement: goalInvolvement || [],
        goalType: goalType || 'open-play'
        // goalNumber and matchState will be calculated when game status = "Done"
      });
    }

    await goal.save();

    // Populate references for response (only for team goals)
    if (!isOpponentGoal) {
      await goal.populate([
        { path: 'scorerId', select: 'fullName kitNumber position' },
        { path: 'assistedById', select: 'fullName kitNumber position' },
        { path: 'goalInvolvement.playerId', select: 'fullName kitNumber position' }
      ]);
    }

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ 
      message: 'Failed to create goal', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/:gameId/goals
 * Get all goals for a game
 */
router.get('/:gameId/goals', checkGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Game access already validated by checkGameAccess middleware
    const game = req.game;

    // Get all goals for the game, sorted by goal number
    // Note: Discriminators (TeamGoal/OpponentGoal) are in same collection
    const goals = await Goal.find({ gameId })
      .sort({ goalNumber: 1 })
      .populate('scorerId', 'fullName kitNumber position')
      .populate('assistedById', 'fullName kitNumber position')
      .populate('goalInvolvement.playerId', 'fullName kitNumber position');
    
    // Note: populate() will ignore fields that don't exist (e.g., scorerId on OpponentGoal)
    // This is safe and works correctly with discriminators

    res.json({
      gameId,
      totalGoals: goals.length,
      goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      message: 'Failed to fetch goals', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/games/:gameId/goals/:goalId
 * Update an existing goal
 */
router.put('/:gameId/goals/:goalId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, goalId } = req.params;
    const {
      goalNumber,
      minute,
      scorerId,
      assistedById,
      goalInvolvement,
      goalType,
      matchState
    } = req.body;

    // Find goal
    const goal = await Goal.findOne({ _id: goalId, gameId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Validate scorer if changed
    if (scorerId && scorerId !== goal.scorerId.toString()) {
      const scorer = await Player.findById(scorerId);
      if (!scorer) {
        return res.status(404).json({ message: 'Scorer not found' });
      }
      goal.scorerId = scorerId;
    }

    // Validate assister if changed
    if (assistedById !== undefined) {
      if (assistedById === null || assistedById === '') {
        goal.assistedById = null;
      } else if (assistedById !== goal.assistedById?.toString()) {
        const assister = await Player.findById(assistedById);
        if (!assister) {
          return res.status(404).json({ message: 'Assister not found' });
        }
        goal.assistedById = assistedById;
      }
    }

    // ✅ GAME RULES VALIDATION: Validate scorer and assister eligibility if minute or players changed
    const finalMinute = minute !== undefined ? minute : goal.minute;
    const finalScorerId = scorerId !== undefined ? scorerId : (goal.scorerId?.toString() || null);
    const finalAssistedById = assistedById !== undefined ? assistedById : (goal.assistedById?.toString() || null);
    
    if (goal.goalCategory === 'TeamGoal' && finalScorerId && 
        (minute !== undefined || scorerId !== undefined || assistedById !== undefined)) {
      const goalValidation = await validateGoalEligibility(gameId, finalScorerId, finalAssistedById || null, finalMinute);
      if (!goalValidation.valid) {
        return res.status(400).json({
          message: 'Invalid goal assignment',
          error: goalValidation.error
        });
      }
    }

    // Update other fields
    if (goalNumber !== undefined) goal.goalNumber = goalNumber;
    if (minute !== undefined) goal.minute = minute;
    if (goalInvolvement !== undefined) goal.goalInvolvement = goalInvolvement;
    if (goalType !== undefined) goal.goalType = goalType;
    if (matchState !== undefined) goal.matchState = matchState;

    await goal.save();

    // Populate references for response
    await goal.populate([
      { path: 'scorerId', select: 'fullName kitNumber position' },
      { path: 'assistedById', select: 'fullName kitNumber position' },
      { path: 'goalInvolvement.playerId', select: 'fullName kitNumber position' }
    ]);

    res.json({
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ 
      message: 'Failed to update goal', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/games/:gameId/goals/:goalId
 * Delete a goal
 */
router.delete('/:gameId/goals/:goalId', checkGameAccess, async (req, res) => {
  try {
    const { gameId, goalId } = req.params;

    // Find and delete goal
    const goal = await Goal.findOneAndDelete({ _id: goalId, gameId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      message: 'Goal deleted successfully',
      goalId
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ 
      message: 'Failed to delete goal', 
      error: error.message 
    });
  }
});

module.exports = router;


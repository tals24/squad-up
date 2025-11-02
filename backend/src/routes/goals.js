const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Game = require('../models/Game');
const Player = require('../models/Player');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * POST /api/games/:gameId/goals
 * Create a new goal for a game
 */
router.post('/:gameId/goals', async (req, res) => {
  try {
    const { gameId } = req.params;
    const {
      goalNumber,
      minute,
      scorerId,
      assistedById,
      goalInvolvement,
      goalType,
      matchState
    } = req.body;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Validate scorer exists
    const scorer = await Player.findById(scorerId);
    if (!scorer) {
      return res.status(404).json({ message: 'Scorer not found' });
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

    // Create goal
    const goal = new Goal({
      gameId,
      goalNumber,
      minute,
      scorerId,
      assistedById: assistedById || null,
      goalInvolvement: goalInvolvement || [],
      goalType: goalType || 'open-play',
      matchState: matchState || 'drawing'
    });

    await goal.save();

    // Populate references for response
    await goal.populate([
      { path: 'scorerId', select: 'name jerseyNumber position' },
      { path: 'assistedById', select: 'name jerseyNumber position' },
      { path: 'goalInvolvement.playerId', select: 'name jerseyNumber position' }
    ]);

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
router.get('/:gameId/goals', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Get all goals for the game, sorted by goal number
    const goals = await Goal.find({ gameId })
      .sort({ goalNumber: 1 })
      .populate('scorerId', 'name jerseyNumber position')
      .populate('assistedById', 'name jerseyNumber position')
      .populate('goalInvolvement.playerId', 'name jerseyNumber position');

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
router.put('/:gameId/goals/:goalId', async (req, res) => {
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

    // Update other fields
    if (goalNumber !== undefined) goal.goalNumber = goalNumber;
    if (minute !== undefined) goal.minute = minute;
    if (goalInvolvement !== undefined) goal.goalInvolvement = goalInvolvement;
    if (goalType !== undefined) goal.goalType = goalType;
    if (matchState !== undefined) goal.matchState = matchState;

    await goal.save();

    // Populate references for response
    await goal.populate([
      { path: 'scorerId', select: 'name jerseyNumber position' },
      { path: 'assistedById', select: 'name jerseyNumber position' },
      { path: 'goalInvolvement.playerId', select: 'name jerseyNumber position' }
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
router.delete('/:gameId/goals/:goalId', async (req, res) => {
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


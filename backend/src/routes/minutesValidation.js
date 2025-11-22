const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

/**
 * PUT /api/games/:gameId/match-duration
 * Update match duration (regular time + extra time)
 */
router.put('/:gameId/match-duration', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { regularTime, firstHalfExtraTime, secondHalfExtraTime } = req.body;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Validate extra time values
    const { validateExtraTime, calculateTotalMatchDuration } = require('../services/minutesValidation');
    
    if (firstHalfExtraTime) {
      const validation = validateExtraTime(firstHalfExtraTime, 'first half');
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    if (secondHalfExtraTime) {
      const validation = validateExtraTime(secondHalfExtraTime, 'second half');
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
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
    
    res.status(200).json({
      message: 'Match duration updated successfully',
      matchDuration: game.matchDuration,
      totalMatchDuration: game.totalMatchDuration
    });
    
  } catch (error) {
    console.error('Error updating match duration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


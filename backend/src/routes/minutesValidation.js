const express = require('express');
const router = express.Router();
const { validateMatchMinutes, calculateMinutesSuggestions } = require('../services/minutesValidation');
const Game = require('../models/Game');
const GameReport = require('../models/GameReport');

/**
 * POST /api/games/:gameId/validate-minutes
 * Validate minutes for a match before final submission
 */
router.post('/:gameId/validate-minutes', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerReports } = req.body; // Array of { playerId, playerName, minutesPlayed }
    
    // Fetch game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Ensure matchDuration exists (default to 90 minutes)
    if (!game.matchDuration) {
      game.matchDuration = {
        regularTime: 90,
        firstHalfExtraTime: 0,
        secondHalfExtraTime: 0
      };
    }
    
    // Run validation
    const validation = validateMatchMinutes(game, playerReports);
    
    // Calculate suggestions if there are errors
    let suggestions = null;
    if (!validation.isValid && validation.summary.deficit > 0) {
      suggestions = calculateMinutesSuggestions(
        validation.summary.totalPlayerMinutes,
        validation.summary.minimumRequired,
        playerReports.filter(r => r.minutesPlayed > 0).length
      );
    }
    
    // Return validation result
    res.status(200).json({
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary,
      suggestions: suggestions
    });
    
  } catch (error) {
    console.error('Error validating minutes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    const { validateExtraTime } = require('../services/minutesValidation');
    
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
    const { calculateTotalMatchDuration } = require('../services/minutesValidation');
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

/**
 * GET /api/games/:gameId/minutes-summary
 * Get current minutes summary for a match
 */
router.get('/:gameId/minutes-summary', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Fetch game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Fetch all player reports for this game
    const reports = await GameReport.find({ game: gameId })
      .populate('player', 'name fullName')
      .lean();
    
    // Transform reports for validation
    const playerReports = reports.map(report => ({
      playerId: report.player._id,
      playerName: report.player.fullName || report.player.name,
      minutesPlayed: report.minutesPlayed || 0
    }));
    
    // Calculate summary
    const { calculateTotalMatchDuration, calculateMinimumTeamMinutes, calculateTotalPlayerMinutes } = require('../services/minutesValidation');
    
    const totalMatchDuration = calculateTotalMatchDuration(game.matchDuration);
    const minimumRequired = calculateMinimumTeamMinutes(totalMatchDuration);
    const totalRecorded = calculateTotalPlayerMinutes(playerReports);
    
    res.status(200).json({
      matchDuration: totalMatchDuration,
      minimumRequired,
      totalRecorded,
      deficit: Math.max(0, minimumRequired - totalRecorded),
      excess: Math.max(0, totalRecorded - minimumRequired),
      playersReported: playerReports.length,
      playersWithMinutes: playerReports.filter(r => r.minutesPlayed > 0).length,
      isValid: totalRecorded >= minimumRequired
    });
    
  } catch (error) {
    console.error('Error fetching minutes summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

